import { Injectable, computed, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { FirebaseService } from './firebase.service';

/**
 * Google sign-in for the member area.
 *
 * "Sign in with Google" is sign-up and login in one: the first time someone signs
 * in, Firebase creates their auth user; after that it logs them in. We never store
 * a password. An auth account on its own grants nothing — all value (class credits)
 * is gated behind Firestore data a server writes, never the account's existence.
 *
 * On the server (prerender) FirebaseService.auth is null, so this service stays in
 * its signed-out, done-initializing state and renders the public shell.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly fb = inject(FirebaseService);

  private readonly _user = signal<User | null>(null);
  /** True until Firebase reports the first auth state, so the UI can avoid a flash. */
  private readonly _initializing = signal(true);
  /**
   * The signed-in member's role ('member' | 'admin'), or null until the lazy member/
   * admin code reads the profile and calls setRole. Kept here (not in a Firestore
   * service) so the header can show an Admin link without pulling Firestore into the
   * initial bundle.
   */
  private readonly _role = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly initializing = this._initializing.asReadonly();
  readonly isSignedIn = computed(() => this._user() !== null);
  readonly role = this._role.asReadonly();
  readonly isAdmin = computed(() => this._role() === 'admin');

  constructor() {
    const auth = this.fb.auth;
    if (!auth) {
      // Server prerender: nothing to watch, so we're immediately "done".
      this._initializing.set(false);
      return;
    }
    onAuthStateChanged(auth, (user) => {
      this._user.set(user);
      if (!user) this._role.set(null);
      this._initializing.set(false);
    });
  }

  /** Called by lazy member/admin code once the profile (and its role) is loaded. */
  setRole(role: string | null): void {
    this._role.set(role);
  }

  async signInWithGoogle(): Promise<void> {
    const auth = this.fb.auth;
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async signOut(): Promise<void> {
    const auth = this.fb.auth;
    if (!auth) return;
    await signOut(auth);
  }
}
