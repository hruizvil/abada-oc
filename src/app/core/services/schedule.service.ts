import { Injectable } from '@angular/core';

/** One concrete weekly class session, expanded from schedule.json's display format. */
export interface ClassSlot {
  id: string;
  classId: string;
  classTitle: string;
  day: string;
  dayIndex: number; // 0=Sun … 6=Sat
  time: string;
  color: string;
}

const DAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
};

/**
 * Loads the weekly schedule (assets/data/schedule.json — the same file the public
 * schedule page uses) and expands it into individual, bookable class slots, so a
 * "Tuesdays & Thursdays 6PM" entry becomes two slots. Cached after first load.
 */
@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private cache: ClassSlot[] | null = null;

  async getSlots(): Promise<ClassSlot[]> {
    if (this.cache) return this.cache;
    try {
      const res = await fetch('assets/data/schedule.json');
      const data = await res.json();
      const slots: ClassSlot[] = [];
      for (const cls of data.classes ?? []) {
        for (const entry of cls.schedule ?? []) {
          for (const day of this.expandDays(entry.days)) {
            slots.push({
              id: `${cls.id}-${day.slice(0, 3).toLowerCase()}-${String(entry.time).replace(/[^0-9]/g, '')}`,
              classId: cls.id,
              classTitle: cls.title,
              day,
              dayIndex: DAY_INDEX[day.toLowerCase()] ?? 7,
              time: entry.time,
              color: cls.color
            });
          }
        }
      }
      slots.sort((a, b) => a.dayIndex - b.dayIndex || this.minutes(a.time) - this.minutes(b.time));
      this.cache = slots;
      return slots;
    } catch {
      return [];
    }
  }

  /** "Tuesdays & Thursdays" → ["Tuesday","Thursday"]; "Mondays" → ["Monday"]. */
  private expandDays(days: string): string[] {
    return String(days)
      .split(/&|,|and/i)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const singular = s.replace(/s$/i, '');
        return singular.charAt(0).toUpperCase() + singular.slice(1).toLowerCase();
      });
  }

  private minutes(t: string): number {
    const m = String(t).match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return 0;
    let h = parseInt(m[1], 10) % 12;
    if (/pm/i.test(m[3])) h += 12;
    return h * 60 + parseInt(m[2], 10);
  }
}
