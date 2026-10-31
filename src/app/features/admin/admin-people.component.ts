import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDirectoryService, Person } from './admin-directory.service';
import { AdminDataService } from './admin-data.service';
import { IconComponent } from '../../shared/ui/icon.component';
import { Card } from '../member/member.model';
import { fullDate, initials, shortDate, tone } from '../../shared/ui/format';

type Filter = 'all' | 'active' | 'low' | 'nowaiver';

interface Row extends Person {
  /** null = waivers not loaded yet. */
  waiver: boolean | null;
}

/** Members: every account with its card, classes left, waiver and last check-in. */
@Component({
  selector: 'app-admin-people',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './admin-people.component.html',
  styleUrls: ['./admin-people.component.scss']
})
export class AdminPeopleComponent {
  protected readonly dir = inject(AdminDirectoryService);
  private readonly cc = inject(AdminDataService);
  protected readonly initials = initials;
  protected readonly tone = tone;
  protected readonly shortDate = shortDate;
  protected readonly fullDate = fullDate;

  protected readonly q = signal('');
  protected readonly filter = signal<Filter>('all');
  protected readonly open = signal<string | null>(null);

  protected readonly filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active cards' },
    { key: 'low', label: 'Low credits' },
    { key: 'nowaiver', label: 'No waiver' }
  ];

  /** Waivers are matched to accounts by email, falling back to the signer's name. */
  private readonly rows = computed<Row[] | null>(() => {
    const people = this.dir.people();
    if (!people) return null;
    const waivers = this.cc.data()?.waivers;
    const emails = new Set((waivers ?? []).map((w) => w.email.trim().toLowerCase()).filter(Boolean));
    const names = new Set((waivers ?? []).map((w) => w.name.trim().toLowerCase()).filter(Boolean));
    return people.map((p) => ({
      ...p,
      waiver: waivers ? emails.has(p.email.toLowerCase()) || names.has(p.name.toLowerCase()) : null
    }));
  });

  private readonly tests: Record<Filter, (r: Row) => boolean> = {
    all: () => true,
    active: (r) => !!r.plan,
    low: (r) => !!r.plan && r.left <= 2,
    nowaiver: (r) => r.waiver === false
  };

  protected readonly counts = computed(() => {
    const rows = this.rows() ?? [];
    return Object.fromEntries(this.filters.map((f) => [f.key, rows.filter(this.tests[f.key]).length])) as Record<Filter, number>;
  });

  protected readonly visible = computed(() => {
    const q = this.q().trim().toLowerCase();
    return (this.rows() ?? [])
      .filter(this.tests[this.filter()])
      .filter((r) => !q || `${r.name} ${r.email}`.toLowerCase().includes(q));
  });

  protected toggle(uid: string): void {
    this.open.update((u) => (u === uid ? null : uid));
  }

  protected pct(r: Row): number {
    return r.total ? Math.round((r.left / r.total) * 100) : 0;
  }

  protected isSpent(c: Card): boolean {
    return !((c.creditsRemaining ?? 0) > 0 && (c.expiresAt?.toDate?.().getTime() ?? Infinity) > Date.now());
  }

  protected expiry(c: Card): string {
    return fullDate(c.expiresAt?.toDate?.());
  }
}
