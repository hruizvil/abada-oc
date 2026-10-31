import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataService } from './admin-data.service';
import { initials, tone } from '../../shared/ui/format';

/** Follow-ups: the automatic post-trial notes (what's going out, what's done) and recent reminders. */
@Component({
  selector: 'app-admin-followups',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-followups.component.html'
})
export class AdminFollowupsComponent {
  protected readonly cc = inject(AdminDataService);
  protected readonly initials = initials;
  protected readonly tone = tone;

  protected readonly f = computed(() => this.cc.data()?.followups ?? null);
  protected readonly due = computed(() => (this.f()?.sequence ?? []).filter((s) => !s.skipped));
  protected readonly skipped = computed(() => (this.f()?.sequence ?? []).filter((s) => s.skipped));
}
