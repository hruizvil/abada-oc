import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberStore } from './member-store.service';
import { LedgerEntry } from './member.model';
import { clock, fullDate, shortDate } from '../../shared/ui/format';

/** History: the member's own check-ins and card purchases, newest first, with simple totals. */
@Component({
  selector: 'app-member-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-history.component.html',
  styleUrls: ['./member-history.component.scss']
})
export class MemberHistoryComponent {
  protected readonly s = inject(MemberStore);

  protected readonly firstClass = computed(() => {
    const list = this.s.checkins();
    const at = list[list.length - 1]?.at;
    return at ? shortDate(at) : '';
  });

  protected readonly spent = computed(() => this.s.purchases().reduce((sum, e) => sum + (e.amountUsd ?? 0), 0));

  protected readonly monthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  protected when(e: LedgerEntry): string {
    if (!e.at) return '';
    const day = e.at.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (e.type === 'purchase') return e.at.getFullYear() === new Date().getFullYear() ? day : fullDate(e.at);
    return `${day} · ${clock(e.at)}`;
  }
}
