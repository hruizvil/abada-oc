import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AdminDataService } from './admin-data.service';
import { AdminDirectoryService } from './admin-directory.service';
import { AdminTrial } from './admin-data.model';
import { initials, longDay, tone } from '../../shared/ui/format';
import { IconComponent, IconName } from '../../shared/ui/icon.component';

type ActivityKind = 'trial' | 'sale' | 'checkin';
type ActivityFilter = ActivityKind | 'all';
interface ActivityItem { kind: ActivityKind; text: string; ts: number; fallback?: string; }

/** Filter chips, in display order after "All"; tone = the .av colour class. */
const ACTIVITY_KINDS: { id: ActivityKind; label: string; icon: IconName; tone: string }[] = [
  { id: 'trial', label: 'Trials', icon: 'cal', tone: '' },
  { id: 'sale', label: 'Sales', icon: 'card', tone: 'c2' },
  { id: 'checkin', label: 'Check-ins', icon: 'tick', tone: 'c4' }
];

interface Attention {
  /** Avatar text: initials for a person, a number for a group. */
  badge: string;
  tone: string;
  title: string;
  sub: string;
  link: string;
  action: string;
}

/**
 * Admin Overview: greeting, the six headline numbers, a "needs your attention" list built
 * from real signals (missing waivers, follow-ups going out, members nearly out of classes),
 * upcoming trials and recent activity. Each attention row links to the page that handles it.
 */
@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './admin-overview.component.html'
})
export class AdminOverviewComponent {
  private readonly auth = inject(AuthService);
  protected readonly cc = inject(AdminDataService);
  protected readonly dir = inject(AdminDirectoryService);
  protected readonly initials = initials;
  protected readonly tone = tone;

  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
    const me = this.dir.person(this.auth.user()?.uid ?? '');
    const first = me?.name.split(/\s+/)[0];
    return `Good ${part}${first && !first.includes('@') ? ', ' + first : ''}`;
  });

  protected readonly today = longDay(new Date());

  protected readonly kinds = ACTIVITY_KINDS;
  protected readonly filter = signal<ActivityFilter>('trial');

  /** Trial bookings (sheet) merged with card purchases and check-ins (Firestore), newest first. */
  private readonly allActivity = computed<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    for (const a of this.cc.data()?.activity ?? []) {
      if (a.type === 'Bookings') items.push({ kind: 'trial', text: a.text, ts: a.ts ?? 0, fallback: a.when });
    }
    const name = (uid: string) => this.dir.person(uid)?.name ?? 'A member';
    for (const c of this.dir.cards()) {
      const at = c.purchasedAt?.toDate?.();
      if (at) items.push({ kind: 'sale', text: `${name(c.memberUid)} bought a ${c.label}`, ts: at.getTime() });
    }
    for (const c of this.dir.checkins()) {
      if (c.at) items.push({ kind: 'checkin', text: `${name(c.memberUid)} checked in · ${c.classTitle}`, ts: c.at.getTime() });
    }
    return items.sort((a, b) => b.ts - a.ts);
  });

  protected readonly showAll = signal(false);

  /** The selected kind, newest first: 6 rows, or 12 after "Show more". */
  private readonly filtered = computed(() => {
    const f = this.filter();
    return this.allActivity().filter((a) => f === 'all' || a.kind === f).slice(0, 12);
  });
  protected readonly activityRows = computed(() =>
    this.filtered().slice(0, this.showAll() ? 12 : 6).map((a) => ({ ...a, when: a.ts ? whenLabel(a.ts) : (a.fallback ?? '') }))
  );
  protected readonly hasMore = computed(() => !this.showAll() && this.filtered().length > 6);

  protected setFilter(f: ActivityFilter): void {
    this.filter.set(f);
    this.showAll.set(false);
  }

  protected kindOf(k: ActivityKind) {
    return ACTIVITY_KINDS.find((x) => x.id === k)!;
  }

  protected readonly upcoming = computed(() => {
    const d = this.cc.data();
    return d ? [...d.trialsToday, ...d.trialsLater].slice(0, 6) : [];
  });

  /** "Kids 5:00 PM · Adults 6:00 PM" for today's trials. */
  protected readonly todaysClasses = computed(() => {
    const t = this.cc.data()?.trialsToday ?? [];
    const labels = [...new Set(t.map((x) => `${x.program} ${x.time} ${x.ampm}`.trim()))];
    return labels.length ? labels.join(' · ') : 'None booked';
  });

  protected readonly attention = computed<Attention[]>(() => {
    const d = this.cc.data();
    const items: Attention[] = [];
    if (d) {
      const todayMissing = d.trialsToday.filter((t) => !t.waiver);
      for (const t of todayMissing) {
        items.push({
          badge: initials(t.name), tone: tone(t.name),
          title: `${t.name} · trial today, ${t.time} ${t.ampm}`,
          sub: 'No waiver on file yet.', link: '/admin/waivers', action: 'View waiver'
        });
      }
      const otherMissing = d.missing.filter((t) => !t.today);
      if (otherMissing.length) {
        items.push({
          badge: String(otherMissing.length), tone: 'c3',
          title: `${otherMissing.length} more booked ${otherMissing.length === 1 ? 'student' : 'students'} without a waiver`,
          sub: `${names(otherMissing.map((t) => t.name))} ${otherMissing.length === 1 ? "hasn't" : "haven't"} signed yet.`,
          link: '/admin/waivers', action: 'Review'
        });
      }
      const due = d.followups.sequence.filter((s) => !s.skipped);
      if (due.length) {
        items.push({
          badge: String(due.length), tone: 'c3',
          title: `${due.length} follow-up ${due.length === 1 ? 'note' : 'notes'} going out soon`,
          sub: due.slice(0, 3).map((s) => `${s.name}${s.due ? ' (' + s.due + ')' : ''}`).join(', ') + '.',
          link: '/admin/followups', action: 'View'
        });
      }
    }
    const low = this.dir.holders().filter((p) => p.left <= 2);
    if (low.length) {
      items.push({
        badge: String(low.length), tone: 'c3',
        title: `${low.length} ${low.length === 1 ? 'member is' : 'members are'} almost out of classes`,
        sub: low.slice(0, 3).map((p) => `${p.name.split(/\s+/)[0]} has ${p.left} left`).join(', ') + '.',
        link: '/admin/people', action: 'View'
      });
    }
    return items;
  });

  protected when(t: AdminTrial): string {
    return t.today ? `Today · ${t.time} ${t.ampm}` : `${t.day} ${t.dateLabel} · ${t.time} ${t.ampm}`;
  }
}

/** "3:15 PM" today, then "Yesterday", then "Nov 21" (year added when it isn't this year). */
function whenLabel(ts: number): string {
  const d = new Date(ts);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(d)) / 86400000);
  if (diff === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diff === 1) return 'Yesterday';
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-US', opts);
}

/** "Ana, Lucas and 2 more" */
function names(list: string[]): string {
  const first = list.map((n) => n.split(/\s+/)[0]);
  if (first.length <= 2) return first.join(' and ');
  if (first.length === 3) return `${first[0]}, ${first[1]} and ${first[2]}`;
  return `${first.slice(0, 2).join(', ')} and ${first.length - 2} more`;
}
