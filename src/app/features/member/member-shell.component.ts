import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MemberStore } from './member-store.service';
import { IconComponent, IconName } from '../../shared/ui/icon.component';
import { UiThemeComponent } from '../../shared/ui/ui-theme.component';

interface NavItem {
  label: string;
  /** Shorter label for the phone tab bar. */
  tab: string;
  path: string;
  exact?: boolean;
  icon: IconName;
}

/**
 * Member area shell: Google sign-in when signed out; otherwise the site nav stays and this adds
 * a grouped sidebar (desktop) or bottom tab bar (phones) around the member pages.
 */
@Component({
  selector: 'app-member-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, UiThemeComponent],
  templateUrl: './member-shell.component.html',
  styleUrls: ['./member-shell.component.scss']
})
export class MemberShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly store = inject(MemberStore);
  protected readonly signingIn = signal(false);
  protected readonly signInError = signal<string | null>(null);

  protected readonly groups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Training',
      items: [
        { label: 'Home', tab: 'Home', path: '/member', exact: true, icon: 'home' },
        { label: 'Schedule', tab: 'Schedule', path: '/member/schedule', icon: 'cal' },
        { label: 'History', tab: 'History', path: '/member/history', icon: 'clock' }
      ]
    },
    { title: 'Store', items: [{ label: 'Buy classes', tab: 'Buy', path: '/member/buy', icon: 'card' }] },
    { title: 'Account', items: [{ label: 'Profile', tab: 'Profile', path: '/member/profile', icon: 'user' }] }
  ];

  /** Phone tab order: the things members reach for most, first. */
  protected readonly tabs: NavItem[] = ['/member', '/member/buy', '/member/schedule', '/member/history', '/member/profile']
    .map((p) => this.groups.flatMap((g) => g.items).find((i) => i.path === p)!);

  protected readonly email = computed(() => this.auth.user()?.email ?? '');

  signOut(): void {
    void this.auth.signOut();
  }

  async signIn(): Promise<void> {
    this.signInError.set(null);
    this.signingIn.set(true);
    try {
      await this.auth.signInWithGoogle();
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? '';
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        this.signInError.set('Sign-in failed. Please try again.');
      }
    } finally {
      this.signingIn.set(false);
    }
  }
}
