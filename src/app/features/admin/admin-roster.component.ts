import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScheduleService, ClassSlot } from '../../core/services/schedule.service';
import { AdminDirectoryService } from './admin-directory.service';
import { AdminDataService } from './admin-data.service';
import { IconComponent } from '../../shared/ui/icon.component';
import { clock, initials, longDay, studioDay, tone } from '../../shared/ui/format';

interface RosterRow {
  key: string;
  name: string;
  sub: string;
  at?: Date | null;
  trial?: boolean;
  waiver?: boolean;
}

interface ClassBlock {
  key: string;
  title: string;
  time: string;
  rows: RosterRow[];
}

const DAY_MS = 86_400_000;

/**
 * Roster: who checked in to each class on a given day (members check themselves in on their
 * phone), plus that day's booked trials. Step back through earlier days with Earlier / Later.
 */
@Component({
  selector: 'app-admin-roster',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './admin-roster.component.html',
  styleUrls: ['./admin-roster.component.scss']
})
export class AdminRosterComponent implements OnInit {
  private readonly schedule = inject(ScheduleService);
  protected readonly dir = inject(AdminDirectoryService);
  private readonly cc = inject(AdminDataService);
  protected readonly initials = initials;
  protected readonly tone = tone;
  protected readonly clock = clock;

  private readonly slots = signal<ClassSlot[] | null>(null);
  /** 0 = today, 1 = yesterday, … */
  protected readonly offset = signal(0);

  private readonly date = computed(() => new Date(Date.now() - this.offset() * DAY_MS));
  private readonly dayKey = computed(() => studioDay(this.date()));
  protected readonly dayLabel = computed(() => longDay(new Date(this.dayKey() + 'T12:00:00')));

  protected readonly blocks = computed<ClassBlock[] | null>(() => {
    const slots = this.slots();
    if (!slots || !this.dir.people()) return null;
    const weekday = new Date(this.dayKey() + 'T12:00:00').getDay();
    const blocks: ClassBlock[] = slots
      .filter((s) => s.dayIndex === weekday)
      .map((s) => ({ key: s.id, title: s.classTitle, time: s.time, rows: [] }));
    const other: ClassBlock = { key: 'other', title: 'Other check-ins', time: '', rows: [] };

    for (const c of this.dir.checkins().filter((x) => x.day === this.dayKey())) {
      const person = this.dir.person(c.memberUid);
      const card = this.dir.cards().find((k) => k.id === c.cardId);
      const row: RosterRow = {
        key: c.id,
        name: person?.name ?? 'Unknown member',
        sub: card ? `${card.label} · ${card.creditsRemaining} left now` : c.classTitle,
        at: c.at
      };
      (blocks.find((b) => b.key === c.slotId) ?? other).rows.push(row);
    }

    if (this.offset() === 0) {
      for (const t of this.cc.data()?.trialsToday ?? []) {
        const time = norm(`${t.time} ${t.ampm}`);
        const program = (t.program || '').toLowerCase();
        const block =
          blocks.find((b) => norm(b.time) === time) ??
          blocks.find((b) => program && b.title.toLowerCase().includes(program.split(/\s+/)[0])) ??
          other;
        block.rows.push({
          key: 'trial-' + t.when + t.name,
          name: t.name,
          sub: t.waiver ? 'Free trial · waiver on file' : 'Free trial · no waiver yet',
          trial: true,
          waiver: t.waiver
        });
      }
    }

    for (const b of blocks) b.rows.sort((x, y) => Number(!!y.at) - Number(!!x.at) || x.name.localeCompare(y.name));
    return other.rows.length ? [...blocks, other] : blocks;
  });

  protected readonly checkedIn = computed(() => this.dir.checkins().filter((x) => x.day === this.dayKey()).length);

  ngOnInit(): void {
    void this.schedule.getSlots().then((s) => this.slots.set(s));
  }

  protected countIn(b: ClassBlock): number {
    return b.rows.filter((r) => r.at).length;
  }

  protected step(delta: number): void {
    this.offset.update((o) => Math.max(0, o + delta));
  }
}

function norm(t: string): string {
  return t.replace(/\s+/g, '').toUpperCase();
}
