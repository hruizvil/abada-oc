import { Injectable, computed, inject, signal } from '@angular/core';
import { AdminService, Checkin } from './admin.service';
import { Card, MemberProfile } from '../member/member.model';

/** One account with its cards rolled up for the admin tables. */
export interface Person {
  uid: string;
  name: string;
  email: string;
  isAdmin: boolean;
  cards: Card[];
  /** Cards with classes left that haven't expired, soonest-expiring first. */
  active: Card[];
  /** Label of the card used next (null = no active card). */
  plan: string | null;
  left: number;
  total: number;
  expires: Date | null;
  lastCheckin: Date | null;
}

/**
 * Members, cards and check-ins from Firestore, loaded once and shared by every admin page,
 * so moving between sections doesn't refetch. Empty on the server (no Firestore there).
 */
@Injectable({ providedIn: 'root' })
export class AdminDirectoryService {
  private readonly admin = inject(AdminService);

  readonly members = signal<MemberProfile[] | null>(null);
  readonly cards = signal<Card[]>([]);
  readonly checkins = signal<Checkin[]>([]);
  private loading: Promise<void> | null = null;

  readonly people = computed<Person[] | null>(() => {
    const members = this.members();
    if (!members) return null;
    const now = Date.now();
    const byUid = new Map<string, Card[]>();
    for (const c of this.cards()) byUid.set(c.memberUid, [...(byUid.get(c.memberUid) ?? []), c]);
    const lastIn = new Map<string, Date>();
    for (const c of this.checkins()) {
      const prev = lastIn.get(c.memberUid);
      if (c.at && (!prev || c.at > prev)) lastIn.set(c.memberUid, c.at);
    }
    return members
      .map((m) => {
        const cards = byUid.get(m.uid) ?? [];
        const active = cards
          .filter((c) => isActive(c, now))
          .sort((a, b) => expiry(a) - expiry(b));
        return {
          uid: m.uid,
          name: personName(m),
          email: m.email ?? '',
          isAdmin: m.role === 'admin',
          cards,
          active,
          plan: active[0]?.label ?? null,
          left: active.reduce((s, c) => s + (c.creditsRemaining ?? 0), 0),
          total: active.reduce((s, c) => s + (c.creditsTotal ?? 0), 0),
          expires: active[0]?.expiresAt?.toDate?.() ?? null,
          lastCheckin: lastIn.get(m.uid) ?? null
        };
      })
      .sort((a, b) => Number(!!b.plan) - Number(!!a.plan) || a.name.localeCompare(b.name));
  });

  readonly holders = computed(() => (this.people() ?? []).filter((p) => p.plan));
  readonly classesLeft = computed(() => this.holders().reduce((s, p) => s + p.left, 0));

  /** Load everything once; pass force to refetch (e.g. after a catalog change). */
  load(force = false): Promise<void> {
    if (typeof document === 'undefined') return Promise.resolve();
    if (this.loading && !force) return this.loading;
    this.loading = (async () => {
      const [members, cards, checkins] = await Promise.all([
        this.admin.listMembers(),
        this.admin.listAllCards(),
        this.admin.listCheckins()
      ]);
      this.cards.set(cards);
      this.checkins.set(checkins);
      this.members.set(members);
    })();
    return this.loading;
  }

  person(uid: string): Person | undefined {
    return this.people()?.find((p) => p.uid === uid);
  }
}

export function personName(m: MemberProfile): string {
  const full = [m.firstName, m.lastName].filter(Boolean).join(' ').trim();
  return full || m.displayName || m.email || 'Unnamed account';
}

function expiry(c: Card): number {
  return c.expiresAt?.toDate?.().getTime() ?? Infinity;
}

function isActive(c: Card, now: number): boolean {
  return (c.creditsRemaining ?? 0) > 0 && expiry(c) > now;
}
