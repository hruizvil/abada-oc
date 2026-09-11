import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { QuestionnaireBase } from './questionnaire.base';

/** localStorage key for the in-progress draft (bump the suffix to invalidate). */
const DRAFT_KEY = 'abada-questionnaire-draft-v1';

/**
 * Natural Potential Discovery questionnaire — the student-facing wizard.
 * Site-native styling (matches the waiver), one Part per step.
 * step 0 = intro (Name/Nickname/Email/Age), steps 1..totalParts = the Parts.
 *
 * Unlinked route (not in navigation.json) reached by direct link, like the
 * waiver. Answers post directly to the questionnaire Apps Script; see the base.
 *
 * Progress auto-saves to localStorage so an accidental refresh doesn't lose work.
 * Because the professor may run every student on one shared computer, the draft
 * is cleared on submit and, if a leftover draft is found, the intro offers
 * Resume / Start over rather than silently loading the previous student's answers.
 */
@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.scss'
})
export class QuestionnaireComponent extends QuestionnaireBase {
  step = signal(0);

  /** Reveals per-question "please answer" hints once a student tries to advance
   *  a Part that still has unanswered questions. */
  showErrors = signal(false);

  /** A leftover draft was found in this browser; the intro offers Resume/Start over. */
  hasDraft = signal(false);

  private persistEnabled = false;
  private pendingDraft: any = null;

  constructor() {
    super();

    if (this.isBrowser) {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) { this.pendingDraft = JSON.parse(raw); this.hasDraft.set(true); }
      } catch { /* private mode / blocked storage — just skip */ }
    }
    // With no draft to decide about, start persisting immediately; otherwise wait
    // for the student to choose Resume or Start over so we don't clobber it.
    if (!this.hasDraft()) this.persistEnabled = true;

    // Persist whenever answers / other-text / step change.
    effect(() => {
      this.answers(); this.otherText(); this.step();
      if (this.persistEnabled) this.saveDraft();
    });
    // Header fields are a FormGroup, not signals.
    this.headerForm.valueChanges.subscribe(() => { if (this.persistEnabled) this.saveDraft(); });
  }

  get currentPart() { return this.parts[this.step() - 1]; }

  /** Blocks the Continue/Finish button until every question in the Part is done. */
  get canAdvance(): boolean { return this.partComplete(this.currentPart); }

  resumeDraft(): void {
    const d = this.pendingDraft;
    if (d) {
      if (d.answers)   this.answers.set(d.answers);
      if (d.otherText) this.otherText.set(d.otherText);
      if (d.header)    this.headerForm.patchValue(d.header, { emitEvent: false });
      this.step.set(typeof d.step === 'number' ? d.step : 0);
    }
    this.hasDraft.set(false);
    this.persistEnabled = true;
    this.scrollTop();
  }

  startOver(): void {
    this.clearDraft();
    this.hasDraft.set(false);
    this.persistEnabled = true;
  }

  start(): void {
    // Starting from the intro means "begin fresh" — drop any leftover draft.
    this.persistEnabled = true;
    this.hasDraft.set(false);
    this.headerForm.markAllAsTouched();
    if (this.headerForm.invalid) return;
    this.step.set(1);
    this.scrollTop();
  }

  next(): void {
    if (!this.partComplete(this.currentPart)) {
      this.showErrors.set(true);
      this.scrollToFirstMissing();
      return;
    }
    this.showErrors.set(false);
    if (this.step() < this.totalParts) {
      this.step.update(s => s + 1);
      this.scrollTop();
    } else {
      this.submit();
      if (this.submitSuccess()) this.clearDraft();
    }
  }

  back(): void {
    if (this.step() > 0) {
      this.showErrors.set(false);
      this.step.update(s => s - 1);
      this.scrollTop();
    }
  }

  private saveDraft(): void {
    if (!this.isBrowser) return;
    const meaningful = this.step() > 0 || this.answeredCount() > 0 ||
      Object.values(this.headerForm.value).some(v => !!(v && String(v).trim()));
    try {
      if (meaningful) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          answers: this.answers(),
          otherText: this.otherText(),
          header: this.headerForm.value,
          step: this.step(),
        }));
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch { /* ignore quota / blocked storage */ }
  }

  private clearDraft(): void {
    if (!this.isBrowser) return;
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  }

  private scrollToFirstMissing(): void {
    if (!this.isBrowser) return;
    // Let the error hints render first, then jump to the first unanswered one.
    setTimeout(() => {
      const el = document.querySelector('.q-required');
      const target = (el?.closest('.question') as HTMLElement) || (el as HTMLElement);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  }
}
