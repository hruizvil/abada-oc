import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminDataService } from './admin-data.service';
import { IconComponent } from '../../shared/ui/icon.component';
import { AdminTrial } from './admin-data.model';
import { initials, tone } from '../../shared/ui/format';

/** Waivers: booked students with no waiver yet (soonest trial first), and every signed waiver. */
@Component({
  selector: 'app-admin-waivers',
  standalone: true,
  imports: [CommonModule, IconComponent, RouterModule],
  templateUrl: './admin-waivers.component.html'
})
export class AdminWaiversComponent {
  protected readonly cc = inject(AdminDataService);
  protected readonly initials = initials;
  protected readonly tone = tone;
  protected readonly q = signal('');

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

  /** Prefill the in-person waiver form with this booked prospect's details. */
  protected signParams(t: AdminTrial): Record<string, string> {
    const p: Record<string, string> = { name: t.name };
    if (t.phone) p['phone'] = t.phone;
    if (t.email) p['email'] = t.email;
    return p;
  }
}
