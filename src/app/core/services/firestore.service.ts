import { Injectable, inject } from '@angular/core';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

/**
 * Holds the Firestore handle. This is the ONLY place that imports `firebase/firestore`,
 * and it is only ever injected by member-area code (which is lazy-loaded), so the heavy
 * Firestore SDK stays in a lazy chunk off the initial bundle. It reuses the single
 * FirebaseApp created in FirebaseService (which owns app + Auth). `db` is null during
 * the server prerender, where there is no FirebaseApp.
 */
@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private readonly fb = inject(FirebaseService);
  readonly db: Firestore | null = this.fb.app ? getFirestore(this.fb.app) : null;
}
