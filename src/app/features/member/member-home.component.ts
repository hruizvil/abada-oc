import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MemberStore } from './member-store.service';
import { IconComponent } from '../../shared/ui/icon.component';
import { Card } from './member.model';
import { clock, fullDate, longDay, shortDate } from '../../shared/ui/format';

/** Member home: balance, today's classes with two-tap check-in, and their cards (or the new / out-of-classes views). */
@Component({
  selector: 'app-member-home',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './member-home.component.html',
  styleUrls: ['./member-home.component.scss']
})
export class MemberHomeComponent {
  protected readonly s = inject(MemberStore);
  protected readonly clock = clock;
  protected readonly shortDate = shortDate;
  protected readonly money = (usd: number) => `$${usd}`;
  protected readonly nameFirst = signal('');
  protected readonly nameLast = signal('');

  constructor() {
    // Prefill the name prompt (from their Google name) once it opens, i.e. after the profile loads.
    effect(() => {
      if (!this.s.showNamePrompt()) return;
      const seed = untracked(() => this.s.nameSeed());
      untracked(() => {
        if (!this.nameFirst()) this.nameFirst.set(seed.first);
        if (!this.nameLast()) this.nameLast.set(seed.last);
      });
    });
  }

  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    const name = this.s.firstName();
    return `Good ${h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'}${name ? ', ' + name : ''}`;
  });

  /** "Thursday, October 29 · Kids 5:00 PM and Adults 6:00 PM today" */
  protected readonly subline = computed(() => {
    const slots = this.s.todaySlots();
    const list = slots.map((x) => `${x.classTitle.split(' ')[0]} ${x.time}`);
    const classes = list.length ? `${list.join(list.length === 2 ? ' and ' : ', ')} today` : 'No classes today';
    return `${longDay(new Date())} · ${this.s.slots() ? classes : ''}`.replace(/ · $/, '');
  });

  protected readonly next = computed<Card | null>(() => this.s.liveCards()[0] ?? null);

  protected readonly lastUsedUp = computed(() => {
    const last = this.s.checkins()[0]?.at;
    return last ? shortDate(last) : '';
  });

  protected readonly memberSince = computed(() => {
    const d = this.s.profile()?.createdAt?.toDate?.();
    return d ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';
  });

  protected expires(c: Card): string {
    const d = c.expiresAt?.toDate?.();
    return d ? (d.getFullYear() === new Date().getFullYear() ? shortDate(d) : fullDate(d)) : '';
  }

  protected pct(c: Card): number {
    return c.creditsTotal ? Math.round((c.creditsRemaining / c.creditsTotal) * 100) : 0;
  }

  protected async saveName(): Promise<void> {
    await this.s.saveName(this.nameFirst(), this.nameLast());
  }
}
