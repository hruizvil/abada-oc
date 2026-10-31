import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataService } from './admin-data.service';
import { IconComponent } from '../../shared/ui/icon.component';
import { AdminTrial } from './admin-data.model';
import { initials, shortDate, tone } from '../../shared/ui/format';

interface Respondent {
  i: number;
  name: string;
  apelido: string;
  age: string;
  email: string;
  submitted: string;
}

interface Answer {
  q: string;
  a: string;
  kind: '' | 'wide' | 'med';
}

/**
 * Questionnaires: searchable respondent list (newest first) and the selected student's
 * answers, tagged with whether they have a waiver on file and a trial booked.
 */
@Component({
  selector: 'app-admin-questionnaires',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './admin-questionnaires.component.html',
  styleUrls: ['./admin-questionnaires.component.scss']
})
export class AdminQuestionnairesComponent {
  protected readonly cc = inject(AdminDataService);
  protected readonly initials = initials;
  protected readonly tone = tone;
  protected readonly q = signal('');
  private readonly picked = signal<number | null>(null);

  /** Column indexes in the questionnaire sheet (positional rows). */
  private readonly cols = computed(() => {
    const h = (this.cc.data()?.questionnaire.headers ?? []).map((x) => x.toLowerCase());
    const find = (...keys: string[]) => h.findIndex((x) => keys.some((k) => x.includes(k)));
    return {
      name: find('name'),
      apelido: find('apelido', 'nickname'),
      age: find('age'),
      email: find('email', 'e-mail')
    };
  });

  protected readonly respondents = computed<Respondent[]>(() => {
    const d = this.cc.data();
    if (!d) return [];
    const c = this.cols();
    const cell = (r: string[], i: number) => (i >= 0 ? String(r[i] ?? '').trim() : '');
    return d.questionnaire.rows
      .map((r, i) => ({
        i,
        name: cell(r, c.name) || 'Unnamed',
        apelido: cell(r, c.apelido),
        age: cell(r, c.age),
        email: cell(r, c.email),
        submitted: when(r[0])
      }))
      .reverse();
  });

  protected readonly filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    const list = this.respondents();
    return q ? list.filter((p) => `${p.name} ${p.apelido}`.toLowerCase().includes(q)) : list;
  });

  protected readonly selected = computed<Respondent | null>(() => {
    const list = this.respondents();
    const i = this.picked();
    return list.find((p) => p.i === i) ?? list[0] ?? null;
  });

  protected readonly answers = computed<Answer[]>(() => {
    const d = this.cc.data();
    const sel = this.selected();
    if (!d || !sel) return [];
    const row = d.questionnaire.rows[sel.i];
    const c = this.cols();
    const shown = new Set([0, c.name, c.apelido, c.age, c.email]);
    return d.questionnaire.headers
      .map((h, idx) => ({ q: h, a: String(row[idx] ?? '').trim(), idx }))
      .filter((x) => x.a && !shown.has(x.idx))
      .map(({ q, a }) => ({
        q,
        a,
        kind: /medical|health|injur|allerg|condition/i.test(q) ? 'med' : a.length > 70 ? 'wide' : ''
      }));
  });

  /** Waiver on file for the selected student (matched by email, then name). */
  protected readonly hasWaiver = computed(() => {
    const sel = this.selected();
    const waivers = this.cc.data()?.waivers ?? [];
    if (!sel) return false;
    return waivers.some((w) => (sel.email && w.email.toLowerCase() === sel.email.toLowerCase()) || w.name.toLowerCase() === sel.name.toLowerCase());
  });

  /** Their next booked trial, if any. */
  protected readonly trial = computed<AdminTrial | null>(() => {
    const sel = this.selected();
    const d = this.cc.data();
    if (!sel || !d) return null;
    return (
      [...d.trialsToday, ...d.trialsLater].find(
        (t) => (sel.email && t.email.toLowerCase() === sel.email.toLowerCase()) || t.name.toLowerCase() === sel.name.toLowerCase()
      ) ?? null
    );
  });

  protected select(i: number): void {
    this.picked.set(i);
  }
}

/** Sheet timestamp → "Oct 28" (or the raw text if it isn't a date). */
function when(v: unknown): string {
  const d = new Date(String(v ?? ''));
  return isNaN(d.getTime()) ? String(v ?? '') : shortDate(d);
}
