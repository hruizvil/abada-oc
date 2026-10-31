import { Injectable, inject } from '@angular/core';
import { User } from 'firebase/auth';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { FirestoreService } from '../../core/services/firestore.service';
import { AuthService } from '../../core/services/auth.service';
import { Card, CardProduct, LedgerEntry, MemberProfile } from './member.model';

/**
 * Member-area data access (profile + class cards). Lives under features/member and is
 * only used by the lazy member page, so importing `firebase/firestore` here keeps that
 * SDK in the member lazy chunk. All of this no-ops on the server (db is null).
 */
@Injectable({ providedIn: 'root' })
export class MemberService {
  private readonly fs = inject(FirestoreService);
  private readonly auth = inject(AuthService);

  /**
   * Make sure the signed-in user has a profile doc, creating a minimal one on first
   * sign-in. The server rules let a member create only their OWN doc and never set
   * their own role to admin, so new sign-ups are always plain members. Also publishes
   * the role to AuthService so the header/guard can react without touching Firestore.
   */
  async ensureProfile(user: User): Promise<MemberProfile | null> {
    const db = this.fs.db;
    if (!db) return null;

    const ref = doc(db, 'members', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const profile = { uid: user.uid, ...(snap.data() as Omit<MemberProfile, 'uid'>) };
      this.auth.setRole(profile.role);
      return profile;
    }

    await setDoc(ref, {
      email: user.email,
      displayName: user.displayName,
      role: 'member',
      createdAt: serverTimestamp()
    });
    this.auth.setRole('member');
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: 'member'
    };
  }

  /** Save the member's own name (rules allow a member to edit their own doc but not its role). */
  async saveName(uid: string, firstName: string, lastName: string): Promise<void> {
    const db = this.fs.db;
    if (!db) return;
    await updateDoc(doc(db, 'members', uid), { firstName, lastName });
  }

  /** All class cards belonging to this member (credits are server-managed, read-only here). */
  async getCards(uid: string): Promise<Card[]> {
    const db = this.fs.db;
    if (!db) return [];
    const q = query(collection(db, 'cards'), where('memberUid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Card, 'id'>) }));
  }

  /** The member's own check-ins and purchases, newest first (the rules allow reading your own ledger). */
  async getHistory(uid: string): Promise<LedgerEntry[]> {
    const db = this.fs.db;
    if (!db) return [];
    const snap = await getDocs(query(collection(db, 'ledger'), where('memberUid', '==', uid)));
    return snap.docs
      .map((d) => {
        const x = d.data() as Omit<LedgerEntry, 'id' | 'at'> & { at?: Timestamp | null };
        return { ...x, id: d.id, at: x.at?.toDate?.() ?? null };
      })
      .sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0));
  }

  /** Buyable card products shown in the store: active, public, ordered. */
  async getCatalog(): Promise<CardProduct[]> {
    const db = this.fs.db;
    if (!db) return [];
    const q = query(collection(db, 'catalog'), where('active', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<CardProduct, 'id'>) }))
      .filter((p) => p.visibility !== 'private')
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
