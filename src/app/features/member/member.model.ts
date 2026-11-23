import { Timestamp } from 'firebase/firestore';

export type MemberRole = 'member' | 'admin';

/** A student's profile doc at members/{uid} (keyed by their Firebase Auth uid). */
export interface MemberProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  /** Name the member set for themselves; used in the greeting and the class roster. */
  firstName?: string | null;
  lastName?: string | null;
  role: MemberRole;
  createdAt?: Timestamp | null;
  /** Set by the payments webhook once they've bought the once-per-account Starter card. */
  starterUsed?: boolean;
}

/** One of the member's own ledger entries: a class check-in or a card purchase. */
export interface LedgerEntry {
  id: string;
  type: 'checkin' | 'purchase';
  at: Date | null;
  /** Check-ins: the class slot and the studio (PST) day, yyyy-MM-dd. */
  slotId?: string;
  classTitle?: string;
  day?: string;
  /** The card spent (check-in) or created (purchase). */
  cardId?: string;
  /** Purchases: catalog id and amount paid. */
  model?: string;
  amountUsd?: number;
}

/**
 * A prepaid class card at cards/{id}. Credits are written only by the server
 * (never the client), so this is read-only from the member's side.
 */
export interface Card {
  id: string;
  memberUid: string;
  /** Machine model id, e.g. 'classes-10', 'starter-4'. */
  model: string;
  /** Human label shown to the member, e.g. '10-class card'. */
  label: string;
  creditsTotal: number;
  creditsRemaining: number;
  purchasedAt?: Timestamp | null;
  expiresAt?: Timestamp | null;
}

/** A bank payment at pendingPayments/{sessionId}, server-written. Display only; the card is created when it clears. */
export interface PendingPayment {
  id: string;
  memberUid: string;
  model: string;
  label: string;
  credits: number;
  amountUsd: number;
  status: 'pending' | 'cleared' | 'failed';
  startedAt: Date | null;
  updatedAt: Date | null;
}

export type CardKind = 'classes' | 'gift';
export type CardVisibility = 'public' | 'private';

/**
 * A buyable card product at catalog/{id} (doc id = the model, e.g. 'classes-4').
 * Admin-editable; priceUsd is display only — Stripe holds the amount actually charged.
 * Docs are sparse: fields left off take the defaults noted below.
 */
export interface CardProduct {
  id: string;
  label: string;
  priceUsd: number;
  validityMonths: number;
  active: boolean;
  sortOrder: number;
  /** 'classes' (default) = credit pack; 'gift' = dollar-value credit. */
  kind?: CardKind;
  /** 'public' (default) = shown in the store; 'private' = sold by link only. */
  visibility?: CardVisibility;
  /** Classes packs only. */
  credits?: number;
  /** Starter pass: buyable once per account (webhook enforces via a starterUsed flag). */
  oncePerAccount?: boolean;
  /** Family card: credits pooled across a household (booking logic comes later). */
  shared?: boolean;
  /** Gift credit: dollar value received (≥ priceUsd when there's a bonus). */
  valueUsd?: number;
  /** Featured in the store (shows a "Best value" accent). */
  highlight?: boolean;
  /** Set once the Stripe Price exists; until then the product can't be bought. */
  stripePriceId?: string | null;
}
