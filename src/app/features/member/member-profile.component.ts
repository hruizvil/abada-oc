import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { MemberStore } from './member-store.service';

/** Profile: the name shown on the class roster, the Google account, and sign out. */
@Component({
  selector: 'app-member-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-profile.component.html',
  styleUrls: ['./member-profile.component.scss']
})
export class MemberProfileComponent {
  private readonly auth = inject(AuthService);
  protected readonly s = inject(MemberStore);
  protected readonly first = signal('');
  protected readonly last = signal('');
  protected readonly saved = signal(false);

  protected readonly email = computed(() => this.s.profile()?.email ?? this.auth.user()?.email ?? '');
  protected readonly memberSince = computed(() => {
    const d = this.s.profile()?.createdAt?.toDate?.();
    return d ? d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
  });

  constructor() {
    // Fill the fields once the profile has loaded.
    effect(() => {
      if (!this.s.profile()) return;
      untracked(() => {
        const seed = this.s.nameSeed();
        this.first.set(seed.first);
        this.last.set(seed.last);
      });
    });
  }

  protected async save(): Promise<void> {
    this.saved.set(false);
    if (await this.s.saveName(this.first(), this.last())) {
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2500);
    }
  }

  protected signOut(): void {
    void this.auth.signOut();
  }
}
