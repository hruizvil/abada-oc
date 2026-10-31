import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataService } from './admin-data.service';
import { IconComponent } from '../../shared/ui/icon.component';
import { AdminTrial } from './admin-data.model';
import { initials, tone } from '../../shared/ui/format';

/** Waivers: booked students with no waiver yet (soonest trial first), and every signed waiver. */
@Component({
  selector: 'app-admin-waivers',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './admin-waivers.component.html'
})
export class AdminWaiversComponent {
  protected readonly cc = inject(AdminDataService);
  protected readonly initials = initials;
  protected readonly tone = tone;
  protected readonly q = signal('');
  /** Which row's "Copy waiver link" just succeeded (shows "Copied" briefly). */
  protected readonly copied = signal<string | null>(null);

  protected readonly missing = computed(() => [...(this.cc.data()?.missing ?? [])].sort((a, b) => a.when - b.when));

  protected readonly signed = computed(() => {
    const d = this.cc.data();
    if (!d) return [];
    const q = this.q().trim().toLowerCase();
    return q ? d.waivers.filter((w) => `${w.name} ${w.apelido || ''}`.toLowerCase().includes(q)) : d.waivers;
  });

  protected trialLabel(t: AdminTrial): string {
    return `Trial ${t.today ? 'today' : t.day} ${t.time} ${t.ampm}`;
  }

  /** Copy the public waiver page link so it can be pasted into a text or email. */
  protected async copyLink(key: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(`${location.origin}/waiver`);
      this.copied.set(key);
      setTimeout(() => this.copied.update((k) => (k === key ? null : k)), 1600);
    } catch {
      this.copied.set(null);
    }
  }
}
