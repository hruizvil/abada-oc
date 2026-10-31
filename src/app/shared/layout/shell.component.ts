import { Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { User } from 'firebase/auth';
import { AuthService } from '../../core/services/auth.service';
import { MemberService } from '../../features/member/member.service';
import { AdminDataService } from '../../features/admin/admin-data.service';
import { AdminDirectoryService } from '../../features/admin/admin-directory.service';
import { UiThemeComponent } from '../ui/ui-theme.component';

type Icon = 'grid' | 'users' | 'calendar' | 'clipboard' | 'shield' | 'mail' | 'tag' | 'wrench';

interface NavItem {
  label: string;
  path: string;
  exact?: boolean;
  icon: Icon;
  count?: () => number;
  /** Count shown in amber (needs action) rather than grey. */
  warn?: boolean;
}

/**
 * Logged-in shell for the admin area: the site's top nav stays, and this adds a grouped
 * left sidebar (a scrolling strip on phones) around the section <router-outlet>. Access is
 * gated here, browser-only, so Firestore stays out of the server bundle; non-admins go to /member.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, UiThemeComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly members = inject(MemberService);
  private readonly router = inject(Router);
  private readonly cc = inject(AdminDataService);
  private readonly directory = inject(AdminDirectoryService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** null = checking access; false = not allowed (redirecting); true = admin. */
  protected readonly authorized = signal<boolean | null>(null);

  private readonly followupsDue = computed(
    () => this.cc.data()?.followups.sequence.filter((s) => !s.skipped).length ?? 0
  );

  protected readonly groups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Studio',
      items: [
        { label: 'Overview', path: '/admin', exact: true, icon: 'grid' },
        { label: 'Members', path: '/admin/people', icon: 'users' },
        { label: 'Roster', path: '/admin/roster', icon: 'calendar' }
      ]
    },
    {
      title: 'Prospects',
      items: [
        { label: 'Questionnaires', path: '/admin/questionnaires', icon: 'clipboard', count: () => this.cc.data()?.stats.newQuestionnaires ?? 0 },
        { label: 'Waivers', path: '/admin/waivers', icon: 'shield', count: () => this.cc.data()?.stats.missingWaivers ?? 0, warn: true },
        { label: 'Follow-ups', path: '/admin/followups', icon: 'mail', count: () => this.followupsDue() }
      ]
    },
    {
      title: 'Setup',
      items: [
        { label: 'Catalog', path: '/admin/catalog', icon: 'tag' },
        { label: 'Tools', path: '/admin/tools', icon: 'wrench' }
      ]
    }
  ];

  constructor() {
    effect(() => {
      if (!this.isBrowser || this.auth.initializing()) return;
      const user = this.auth.user();
      if (!user) {
        this.authorized.set(false);
        void this.router.navigate(['/member']);
        return;
      }
      void this.gate(user);
    });
  }

  private async gate(user: User): Promise<void> {
    const profile = await this.members.ensureProfile(user);
    if (profile?.role !== 'admin') {
      this.authorized.set(false);
      void this.router.navigate(['/member']);
      return;
    }
    this.authorized.set(true);
    // Warm both data sources so every section (and the sidebar counts) fill in right away.
    void this.cc.load();
    void this.directory.load();
  }
}
