import { Injectable, inject } from '@angular/core';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where
} from 'firebase/firestore';
import { FirestoreService } from '../../core/services/firestore.service';
import { Card, CardProduct, MemberProfile } from '../member/member.model';

/** A class check-in at ledger/checkin_{uid}_{slotId}_{day}. */
export interface Checkin {
  id: string;
  memberUid: string;
  slotId: string;
  classTitle: string;
  /** Studio (PST) day, yyyy-MM-dd. */
  day: string;
  cardId: string;
  at: Date | null;
}

/**
 * Admin data access. Lives under features/admin and is only used by the lazy admin
 * page, so `firebase/firestore` stays in the admin chunk. Reads span all members/cards
 * (allowed by the rules for an admin); catalog writes are admin-only by the rules too.
 * Credits are never written here — only the server webhook touches those.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly fs = inject(FirestoreService);

  async listMembers(): Promise<MemberProfile[]> {
    const db = this.fs.db;
    if (!db) return [];
    const snap = await getDocs(collection(db, 'members'));
    return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<MemberProfile, 'uid'>) }));
  }

  async listAllCards(): Promise<Card[]> {
    const db = this.fs.db;
    if (!db) return [];
    const snap = await getDocs(collection(db, 'cards'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Card, 'id'>) }));
  }

  /** Every class check-in (the ledger entries the check-in endpoint writes). */
  async listCheckins(): Promise<Checkin[]> {
    const db = this.fs.db;
    if (!db) return [];
    const snap = await getDocs(query(collection(db, 'ledger'), where('type', '==', 'checkin')));
    return snap.docs.map((d) => {
      const x = d.data() as Omit<Checkin, 'id' | 'at'> & { at?: Timestamp | null };
      return { ...x, id: d.id, at: x.at?.toDate?.() ?? null };
    });
  }

  /** Every catalog product, active or not, ordered for the editor. */
  async listCatalog(): Promise<CardProduct[]> {
    const db = this.fs.db;
    if (!db) return [];
    const snap = await getDocs(collection(db, 'catalog'));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<CardProduct, 'id'>) }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /** Create or overwrite a catalog product (the form carries every field). */
  async saveProduct(p: CardProduct): Promise<void> {
    const db = this.fs.db;
    if (!db) return;
    const { id, ...rest } = p;
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) data[k] = v;
    }
    await setDoc(doc(db, 'catalog', id), data);
  }

  async deleteProduct(id: string): Promise<void> {
    const db = this.fs.db;
    if (!db) return;
    await deleteDoc(doc(db, 'catalog', id));
  }
}
