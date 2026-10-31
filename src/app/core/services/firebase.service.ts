import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { environment } from '../../../environments/environment';

/**
 * Owns the Firebase app + Auth handles for the whole site.
 *
 * Deliberately does NOT import Firestore. Auth is needed app-wide (the header shows
 * who's signed in on every page), so it rides in the initial bundle — but Firestore
 * is the heavy part of the SDK, so it lives in a separate service that only the
 * member area imports, keeping it in a lazy chunk off the critical path. Both share
 * this one FirebaseApp instance (see FirestoreService, which reads `app` here).
 *
 * Firebase is NOT initialized during the server-side prerender: its clients rely on
 * browser-only APIs, and this site prerenders in Node with hydration OFF (see
 * app.config.ts). On the server `app` and `auth` are null and every caller no-ops.
 *
 * We use the plain modular `firebase` SDK rather than @angular/fire on purpose:
 * Angular 21 is very new and AngularFire tends to lag Angular majors, so the plain
 * SDK (independent of the Angular version) can't break on an Angular upgrade.
 */
@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly app: FirebaseApp | null;
  readonly auth: Auth | null;

  constructor() {
    if (!this.isBrowser) {
      this.app = null;
      this.auth = null;
      return;
    }
    // getApps() guards against double-init during dev hot-reloads.
    this.app = getApps().length ? getApps()[0] : initializeApp(environment.firebase);
    this.auth = getAuth(this.app);
  }
}
