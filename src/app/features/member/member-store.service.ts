import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { User } from 'firebase/auth';
import { AuthService } from '../../core/services/auth.service';
import { ScheduleService, ClassSlot } from '../../core/services/schedule.service';
import { MemberService } from './member.service';
import { Card, CardProduct, LedgerEntry, MemberProfile, PendingPayment } from './member.model';
import { studioDay } from '../../shared/ui/format';
import { environment } from '../../../environments/environment';

export type MemberState = 'loading' | 'new' | 'inactive' | 'active';

/**
 * The signed-in member's data and actions, shared by every member page (home, buy, schedule,
 * history, profile) so moving between them never refetches. Loads when the user resolves,
 * clears on sign-out. Check-in and checkout POST into a hidden iframe and read the result the
 * Payments web app postMessages back (Apps Script can't do CORS or navigate the top window).
 */
@Injectable({ providedIn: 'root' })
export class MemberStore {
  private readonly auth = inject(AuthService);
  private readonly members = inject(MemberService);
  private readonly schedule = inject(ScheduleService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly profile = signal<MemberProfile | null>(null);
  /** null = still loading; [] = loaded, none yet. */
  readonly cards = signal<Card[] | null>(null);
  readonly catalog = signal<CardProduct[] | null>(null);
  readonly slots = signal<ClassSlot[] | null>(null);
  readonly history = signal<LedgerEntry[] | null>(null);
  /** Bank payments still clearing, or recently failed. */
  readonly payments = signal<PendingPayment[]>([]);
  /** Slot ids already checked into today. */
  readonly checkedToday = signal<Map<string, Date | null>>(new Map());

  readonly error = signal<string | null>(null);
  /** A positive/neutral banner, e.g. the outcome Stripe sent us back with. */
  readonly notice = signal<{ tone: 'ok' | 'info'; text: string } | null>(null);
  /** Signed in, but not on the early-access allow-list → the shell shows an "under construction" page. */
  readonly accessDenied = signal(false);

  /** Product whose checkout is being set up (button loading state + double-click guard). */
  readonly buyingId = signal<string | null>(null);
  /** Slot awaiting the confirm tap, and the slot whose check-in is in flight. */
  readonly armingSlotId = signal<string | null>(null);
  readonly checkingInId = signal<string | null>(null);

  /** First-run name prompt. */
  readonly showNamePrompt = signal(false);
  readonly savingName = signal(false);

  private checkoutCleanup: (() => void) | null = null;

  readonly todayIndex = new Date().getDay();

  readonly firstName = computed(() => {
    const p = this.profile();
    if (p?.firstName) return p.firstName;
    const dn = this.auth.user()?.displayName;
    return dn ? dn.trim().split(/\s+/)[0] : '';
  });

  /** Cards with classes left that haven't expired, soonest-expiring first (the order they're spent). */
  readonly liveCards = computed(() =>
    (this.cards() ?? []).filter(isLive).sort((a, b) => expiry(a) - expiry(b))
  );
  readonly classesLeft = computed(() => this.liveCards().reduce((s, c) => s + (c.creditsRemaining ?? 0), 0));

  readonly state = computed<MemberState>(() => {
    const cards = this.cards();
    if (cards === null) return 'loading';
    if (cards.length === 0) return 'new';
    return this.liveCards().length ? 'active' : 'inactive';
  });

  readonly todaySlots = computed(() => (this.slots() ?? []).filter((s) => s.dayIndex === this.todayIndex));

  readonly checkins = computed(() => (this.history() ?? []).filter((e) => e.type === 'checkin'));
  readonly purchases = computed(() => (this.history() ?? []).filter((e) => e.type === 'purchase'));
  readonly classesThisMonth = computed(() => {
    const month = studioDay(new Date()).slice(0, 7);
    return this.checkins().filter((e) => (e.day ?? (e.at ? studioDay(e.at) : '')).startsWith(month)).length;
  });

  /** Created on the first member-area visit (which is also how a Stripe return lands). */
  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (!user) {
        this.reset();
        return;
      }
      void this.load(user);
    });

    if (this.isBrowser) {
      // Back from Stripe restores the page from the bfcache with a button frozen on "Opening…"
      // and the abandoned attempt's timeout still pending; reset both when the page is shown.
      window.addEventListener('pageshow', () => {
        this.checkoutCleanup?.();
        this.buyingId.set(null);
      });
      this.readPurchaseOutcome();
    }
  }

  private reset(): void {
    this.profile.set(null);
    this.cards.set(null);
    this.catalog.set(null);
    this.slots.set(null);
    this.history.set(null);
    this.payments.set([]);
    this.checkedToday.set(new Map());
    this.showNamePrompt.set(false);
    this.accessDenied.set(false);
  }

  private async load(user: User): Promise<void> {
    // Early-access gate: while the member area is in beta, only allow-listed emails get in.
    // Checked before ensureProfile so no account/profile is created for anyone else.
    const email = (user.email ?? '').toLowerCase();
    if (environment.memberBeta && !environment.memberAllowlist.map((e) => e.toLowerCase()).includes(email)) {
      this.accessDenied.set(true);
      return;
    }
    this.accessDenied.set(false);
    this.error.set(null);
    this.cards.set(null);
    try {
      const profile = await this.members.ensureProfile(user);
      this.profile.set(profile);
      // Admins manage from the admin area, not the member storefront.
      if (this.isBrowser && profile?.role === 'admin') {
        void this.router.navigate(['/admin']);
        return;
      }
      if (this.isBrowser && profile && !profile.firstName) this.showNamePrompt.set(true);

      const [cards, catalog, slots, history, payments] = await Promise.all([
        this.members.getCards(user.uid),
        this.members.getCatalog(),
        this.schedule.getSlots(),
        this.members.getHistory(user.uid),
        this.members.getPendingPayments(user.uid).catch(() => []) // display-only; never block the account load
      ]);
      this.cards.set(cards);
      this.catalog.set(catalog);
      this.slots.set(slots);
      this.history.set(history);
      this.payments.set(payments);
      this.markTodaysCheckins(history);
    } catch {
      this.error.set('Could not load your account. Please refresh and try again.');
      this.cards.set([]);
      this.catalog.set([]);
      this.slots.set([]);
      this.history.set([]);
    }
  }

  /** Today's check-ins (by slot) from the ledger, so already-used classes show "Checked in". */
  private markTodaysCheckins(history: LedgerEntry[]): void {
    const today = studioDay(new Date());
    const map = new Map<string, Date | null>();
    for (const e of history) {
      if (e.type === 'checkin' && e.day === today && e.slotId) map.set(e.slotId, e.at);
    }
    this.checkedToday.set(map);
  }

  private async refresh(): Promise<void> {
    const user = this.auth.user();
    if (!user) return;
    const [cards, history, payments] = await Promise.all([
      this.members.getCards(user.uid),
      this.members.getHistory(user.uid),
      this.members.getPendingPayments(user.uid).catch(() => []) // display-only; never block the account load
    ]);
    this.cards.set(cards);
    this.history.set(history);
    this.payments.set(payments);
  }

  /**
   * The webhook usually lands within seconds of Stripe's redirect, but can lag (Apps Script cold start, a
   * Stripe retry). Re-read every 3 s for up to a minute until the new card (or a pending payment) shows.
   */
  private async awaitPurchase(): Promise<void> {
    const since = Date.now() - 15 * 60 * 1000;
    const arrived = () =>
      (this.cards() ?? []).some((c) => (c.purchasedAt?.toMillis?.() ?? 0) > since) ||
      this.payments().some((p) => p.status === 'pending');
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      if (!this.auth.user()) return;
      if (this.cards() !== null && arrived()) return;
      try { await this.refresh(); } catch { /* next tick retries */ }
      if (arrived()) return;
    }
    this.notice.set({ tone: 'info', text: "Your classes haven't shown up yet. Refresh in a minute, or let us know if they still don't appear." });
  }

  /** Show the outcome Stripe redirected back with, then clean it off the URL. */
  private readPurchaseOutcome(): void {
    const outcome = new URLSearchParams(location.search).get('purchase');
    if (!outcome) return;
    switch (outcome) {
      case 'success':
        this.notice.set({ tone: 'ok', text: 'Thanks for your purchase! Your classes usually show up here within a few seconds.' });
        void this.awaitPurchase();
        break;
      case 'cancel':
        this.notice.set({ tone: 'info', text: "Checkout canceled. You haven't been charged." });
        break;
      case 'starter_used':
        this.error.set("You've already used your Starter card. Pick a class pack instead.");
        break;
      default:
        this.error.set('Something went wrong starting checkout. Please try again.');
    }
    history.replaceState(null, '', location.pathname + location.hash);
  }

  // ---------------- check-in ----------------

  isCheckedIn(slot: ClassSlot): boolean {
    return this.checkedToday().has(slot.id);
  }

  checkedInAt(slot: ClassSlot): Date | null {
    return this.checkedToday().get(slot.id) ?? null;
  }

  /** First tap arms the confirm; the second (confirmCheckIn) spends a class. */
  armCheckIn(slot: ClassSlot): void {
    if (this.isCheckedIn(slot) || this.checkingInId()) return;
    this.armingSlotId.set(slot.id);
  }

  cancelCheckIn(): void {
    this.armingSlotId.set(null);
  }

  /** Spend 1 class on the soonest-expiring card. Idempotent server-side, so a double tap is harmless. */
  async confirmCheckIn(slot: ClassSlot): Promise<void> {
    if (!this.isBrowser || this.checkingInId() || this.isCheckedIn(slot)) return;
    const user = this.auth.user();
    const card = this.liveCards()[0];
    if (!user) return;
    this.armingSlotId.set(null);
    if (!card) {
      this.error.set('No classes left. Buy a card to check in.');
      return;
    }
    this.checkingInId.set(slot.id);
    this.error.set(null);
    try {
      const token = await user.getIdToken();
      const result = await this.post<{ ok?: boolean; reason?: string }>('checkin', 'abada-checkin', {
        idToken: token, slotId: slot.id, cardId: card.id, classTitle: slot.classTitle
      });
      if (result?.ok) {
        this.checkedToday.update((m) => new Map(m).set(slot.id, new Date()));
        await this.refresh();
      } else if (result?.reason === 'no_credits') {
        this.error.set('No classes left. Buy a card to check in.');
        await this.refresh();
      } else {
        this.error.set('Could not check you in. Please try again.');
      }
    } catch {
      this.error.set('Could not check you in. Please try again.');
    } finally {
      this.checkingInId.set(null);
    }
  }

  // ---------------- checkout ----------------

  /** Already bought the once-per-account Starter card. */
  starterUsed(p: CardProduct): boolean {
    return !!p.oncePerAccount && !!this.profile()?.starterUsed;
  }

  /**
   * Start a Stripe Checkout. The Payments web app verifies the ID token, creates the session and
   * postMessages its URL back; we navigate here because its sandboxed frame can't.
   */
  async buy(product: CardProduct): Promise<void> {
    if (!this.isBrowser || this.buyingId()) return;
    const user = this.auth.user();
    if (!user || !product.stripePriceId || this.starterUsed(product)) return;
    this.buyingId.set(product.id);
    this.error.set(null);
    try {
      const token = await user.getIdToken();
      const url = await this.post<{ url?: string }>(
        'checkout', 'abada-checkout',
        { idToken: token, catalogId: product.id, origin: location.origin },
        (cleanup) => (this.checkoutCleanup = cleanup)
      ).then((d) => d?.url);
      this.checkoutCleanup = null;
      // Only follow a Stripe Checkout URL or a redirect back to our own app.
      if (url && (url.startsWith('https://checkout.stripe.com/') || url.startsWith(location.origin + '/'))) {
        window.location.href = url; // leaves the loading state on as we go
        return;
      }
      this.buyingId.set(null);
      this.error.set('Could not reach checkout. Please try again.');
    } catch {
      this.buyingId.set(null);
      this.error.set('Could not start checkout. Please try again.');
    }
  }

  // ---------------- name ----------------

  async saveName(first: string, last: string): Promise<boolean> {
    const user = this.auth.user();
    first = first.trim();
    last = last.trim();
    if (!first || !user || this.savingName()) return false;
    this.savingName.set(true);
    this.error.set(null);
    try {
      await this.members.saveName(user.uid, first, last);
      this.profile.update((p) => (p ? { ...p, firstName: first, lastName: last } : p));
      this.showNamePrompt.set(false);
      return true;
    } catch {
      this.error.set('Could not save your name. Please try again.');
      return false;
    } finally {
      this.savingName.set(false);
    }
  }

  /** Name fields prefilled from the saved name, falling back to the Google display name. */
  nameSeed(): { first: string; last: string } {
    const p = this.profile();
    const parts = (p?.displayName || this.auth.user()?.displayName || '').trim().split(/\s+/).filter(Boolean);
    return { first: p?.firstName || parts[0] || '', last: p?.lastName || parts.slice(1).join(' ') };
  }

  /** Card label for a ledger entry (the card it spent or created). */
  cardLabel(e: LedgerEntry): string {
    const card = (this.cards() ?? []).find((c) => c.id === e.cardId);
    if (card) return card.label;
    return (this.catalog() ?? []).find((p) => p.id === e.model)?.label ?? e.model ?? 'class card';
  }

  /**
   * POST a form into a hidden iframe and resolve with the message the Payments web app posts
   * back (null on a 20s timeout). onStart receives a cleanup so a Back-button return can cancel.
   */
  private post<T>(action: string, type: string, fields: Record<string, string>, onStart?: (cleanup: () => void) => void): Promise<T | null> {
    return new Promise((resolve) => {
      const frame = document.createElement('iframe');
      frame.name = `${type}-${Date.now()}`;
      frame.style.display = 'none';
      document.body.appendChild(frame);

      const cleanup = () => {
        window.removeEventListener('message', onMessage);
        clearTimeout(timer);
        frame.remove();
      };
      const onMessage = (ev: MessageEvent) => {
        const data = ev.data as ({ type?: string } & T) | null;
        if (!data || data.type !== type) return;
        cleanup();
        resolve(data);
      };
      const timer = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 20000);
      window.addEventListener('message', onMessage);
      onStart?.(cleanup);

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${environment.paymentsUrl}?action=${action}`;
      form.target = frame.name;
      form.style.display = 'none';
      for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      form.remove();
    });
  }
}

function expiry(c: Card): number {
  return c.expiresAt?.toDate?.().getTime() ?? Infinity;
}

function isLive(c: Card): boolean {
  return (c.creditsRemaining ?? 0) > 0 && expiry(c) > Date.now();
}
