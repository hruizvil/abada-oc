/** Shapes returned by the Command Center data API (apps-script/command-center buildData_). */

export interface AdminTrial {
  name: string;
  program: string;
  phone: string;
  email: string;
  when: number;
  time: string;
  ampm: string;
  day: string;
  dateLabel: string;
  waiver: boolean;
  today: boolean;
}

export interface AdminActivity {
  type: 'Waivers' | 'Questionnaire' | 'Bookings' | string;
  text: string;
  /** Epoch ms (admin-api v2+), so it can be merged with Firestore activity. */
  ts?: number;
  when: string;
}

export interface AdminWaiver {
  name: string;
  apelido: string;
  email: string;
  minor: boolean;
  agreed: string;
  agreedTs: number;
  pdf: string;
}

export interface AdminFollowups {
  stats: { fuSent7d: number; remEmail7d: number; remSms7d: number; lastFu: string };
  sequence: { name: string; program: string; step1?: string; due?: string; skipped?: boolean; note?: string }[];
  completed: { name: string; program: string; done: string }[];
  activity: { kind: string; text: string; when: string }[];
}

export interface AdminLinks {
  bookingForm: string;
  schedule: string;
  website: string;
  questionnaireForm: string;
  reviews: string;
  bookingsSheet: string;
  waiversFolder: string;
  waiversSheet: string;
  questionnaireSheet: string;
}

export interface AdminData {
  asOf: string;
  reviewLink: string;
  links: AdminLinks;
  stats: { trialsThisWeek: number; today: number; missingWaivers: number; newQuestionnaires: number };
  trialsToday: AdminTrial[];
  trialsLater: AdminTrial[];
  missing: AdminTrial[];
  /** Trials in the last 30 days that passed without a signed waiver, most recent first. */
  pastNoWaiver?: AdminTrial[];
  activity: AdminActivity[];
  waivers: AdminWaiver[];
  questionnaire: { headers: string[]; rows: string[][] };
  followups: AdminFollowups;
}
