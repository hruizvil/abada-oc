import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberStore } from './member-store.service';
import { IconComponent } from '../../shared/ui/icon.component';
import { ClassSlot } from '../../core/services/schedule.service';

interface DayRow {
  day: string;
  today: boolean;
  slots: ClassSlot[];
}

/** Schedule: the weekly class table (one column per class, e.g. Kids / Adults), today highlighted. */
@Component({
  selector: 'app-member-schedule',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './member-schedule.component.html',
  styleUrls: ['./member-schedule.component.scss']
})
export class MemberScheduleComponent {
  protected readonly s = inject(MemberStore);

  /** Class columns in the order they first appear, with their colour. */
  protected readonly columns = computed(() => {
    const seen = new Map<string, string>();
    for (const x of this.s.slots() ?? []) {
      const key = x.classTitle.split(' ')[0];
      if (!seen.has(key)) seen.set(key, x.color);
    }
    return [...seen].map(([key, color]) => ({ key, color }));
  });

  protected readonly days = computed<DayRow[]>(() => {
    const rows: DayRow[] = [];
    for (const x of this.s.slots() ?? []) {
      const last = rows[rows.length - 1];
      if (last && last.day === x.day) last.slots.push(x);
      else rows.push({ day: x.day, today: x.dayIndex === this.s.todayIndex, slots: [x] });
    }
    return rows;
  });

  protected times(row: DayRow, column: string): string {
    return row.slots.filter((x) => x.classTitle.split(' ')[0] === column).map((x) => x.time).join(', ') || '—';
  }
}
