import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * The account control that lives in the site header on every page.
 *
 * Signed out → a person icon that links to /member (sign in).
 * Signed in  → an initials avatar that opens a small menu (My account, Book, Sign out).
 *
 * It depends on AuthService (Auth only), NOT on Firestore — that keeps the heavy
 * Firestore SDK out of the header's always-loaded bundle. During prerender AuthService
 * reports signed-out, so the stable signed-out icon is what gets prerendered.
 */
@Component({
  selector: 'app-account-control',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './account-control.component.html',
  styleUrls: ['./account-control.component.scss']
})
export class AccountControlComponent {
  protected readonly auth = inject(AuthService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);

  protected readonly initials = computed(() => {
    const user = this.auth.user();
    if (!user) return '';
    const name = user.displayName?.trim();
    if (name) {
      const parts = name.split(/\s+/);
      return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
    }
    return (user.email?.[0] ?? '?').toUpperCase();
  });

  // Desktop: open the quick dropdown. Mobile: the header clips overflow (to contain
  // the slide-in menu), which would cut off a floating dropdown — so go straight to
  // the full /member account page instead. 768px matches the header's own breakpoint.
  onAvatarClick(): void {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768;
    if (isDesktop) {
      this.menuOpen.update((v) => !v);
    } else {
      this.router.navigate([this.auth.isAdmin() ? '/admin' : '/member']);
    }
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.closeMenu();
  }

  // Close the menu when clicking anywhere outside this control.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this.host.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }
}
