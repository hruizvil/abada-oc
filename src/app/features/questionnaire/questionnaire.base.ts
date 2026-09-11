import { inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { QUESTIONNAIRE, Part, Question } from './questionnaire.questions';
import { environment } from '../../../environments/environment';

/**
 * Shared state and answer logic for the questionnaire wizard.
 *
 * The three prototype directions (A/B/C) render completely different UIs but
 * collect the exact same data, so all of that lives here and each component only
 * owns its template + step model. When a direction is chosen this becomes the
 * single wizard's engine and only the winning template survives.
 *
 * Answers are keyed by question id: single/scale -> string, multi -> string[],
 * text -> string. `otherText` holds the write-in for allowOther questions.
 */
export abstract class QuestionnaireBase {
  protected fb = inject(FormBuilder);
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly parts: Part[] = QUESTIONNAIRE;
  readonly totalParts = QUESTIONNAIRE.length;
  readonly totalQuestions = QUESTIONNAIRE.reduce((n, p) => n + p.questions.length, 0);

  /** Name / Email / Age are required; apelido (Capoeira nickname) is optional. */
  headerForm: FormGroup = this.fb.group({
    name:    ['', Validators.required],
    apelido: [''],
    email:   ['', [Validators.required, Validators.email]],
    age:     ['', Validators.required],
  });

  answers = signal<Record<string, string | string[]>>({});
  otherText = signal<Record<string, string>>({});

  isSubmitting = signal(false);
  submitSuccess = signal(false);

  // ---- answer helpers -------------------------------------------------------

  isSelected(qid: string, opt: string): boolean {
    const v = this.answers()[qid];
    return Array.isArray(v) ? v.includes(opt) : v === opt;
  }

  /** How many options a multi-select question can still take (for maxSelect UI). */
  atMax(q: Question): boolean {
    if (q.type !== 'multi' || !q.maxSelect) return false;
    const v = this.answers()[q.id];
    return Array.isArray(v) && v.length >= q.maxSelect;
  }

  toggle(q: Question, opt: string): void {
    const current = { ...this.answers() };
    if (q.type === 'multi') {
      const arr = Array.isArray(current[q.id]) ? [...(current[q.id] as string[])] : [];
      const i = arr.indexOf(opt);
      if (i >= 0) {
        arr.splice(i, 1);
      } else {
        if (q.maxSelect && arr.length >= q.maxSelect) return; // cap reached
        arr.push(opt);
      }
      current[q.id] = arr;
    } else {
      // single / scale — tapping the chosen one again clears it (all optional)
      current[q.id] = current[q.id] === opt ? '' : opt;
    }
    this.answers.set(current);
  }

  getText(qid: string): string {
    const v = this.answers()[qid];
    return typeof v === 'string' ? v : '';
  }

  setText(qid: string, value: string): void {
    this.answers.set({ ...this.answers(), [qid]: value });
  }

  getOther(qid: string): string {
    return this.otherText()[qid] ?? '';
  }

  setOther(qid: string, value: string): void {
    this.otherText.set({ ...this.otherText(), [qid]: value });
  }

  /** Questions answered so far — drives the "X of 31" encouragement copy. */
  answeredCount(): number {
    const a = this.answers();
    let n = 0;
    for (const part of this.parts) {
      for (const q of part.questions) {
        if (this.isAnswered(q)) n++;
      }
    }
    return n;
  }

  /** A question counts as answered with at least one selection or non-empty text.
   *  For "allowOther" questions, a written-in Other value also counts, so a
   *  student who only fills the Other box isn't wrongly blocked as unanswered. */
  isAnswered(q: Question): boolean {
    if (q.allowOther && this.getOther(q.id).trim()) return true;
    const v = this.answers()[q.id];
    if (Array.isArray(v)) return v.length > 0;
    return !!(v && String(v).trim());
  }

  /** Every question in a Part must be answered before the student may advance. */
  partComplete(part: Part): boolean {
    return part.questions.every(q => this.isAnswered(q));
  }

  isHeaderInvalid(field: string): boolean {
    const c = this.headerForm.get(field);
    return !!(c && c.invalid && c.touched);
  }

  protected scrollTop(): void {
    if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Posts directly to the questionnaire Apps Script (waiver pattern: no Worker,
   * no Turnstile), which appends one row to the "Questionnaire Responses" sheet.
   * `no-cors` means we can't read the response, so — like the waiver — we show
   * success as soon as the request is dispatched.
   *
   * Each answer is flattened to one string column keyed by question id:
   * multi -> "a; b; c", single/scale -> the choice, text -> the text, and any
   * allowOther write-in is appended as "…; Other: <text>".
   */
  submit(): void {
    this.headerForm.markAllAsTouched();
    if (this.headerForm.invalid) return;

    this.isSubmitting.set(true);

    const flat: Record<string, string> = {};
    for (const part of this.parts) {
      for (const q of part.questions) {
        const v = this.answers()[q.id];
        let text = Array.isArray(v) ? v.join('; ') : (v ?? '');
        const other = this.getOther(q.id).trim();
        if (q.allowOther && other) text = text ? `${text}; Other: ${other}` : `Other: ${other}`;
        flat[q.id] = text;
      }
    }

    const payload = {
      name:    this.headerForm.value.name,
      apelido: this.headerForm.value.apelido || '',
      email:   this.headerForm.value.email,
      age:     this.headerForm.value.age,
      ...flat,
      formType: 'questionnaire',
      submittedAt: new Date().toISOString(),
    };

    const url = environment.questionnaireSheetUrl;
    if (this.isBrowser && url && !url.startsWith('YOUR_')) {
      fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    this.isSubmitting.set(false);
    this.submitSuccess.set(true);
    this.scrollTop();
  }
}
