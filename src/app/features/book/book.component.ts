import { Component, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import {
  TurnstileService,
  VERIFICATION_UNAVAILABLE_MESSAGE,
  DELIVERY_FAILED_MESSAGE
} from '../../core/services/turnstile.service';

interface SlotWeek {
  weekLabel: string;
  slots: { dayAbbr: string; dateLabel: string; time: string; value: string }[];
}

@Component({
  selector: 'app-book',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.scss']
})
export class BookComponent {
  private fb = inject(FormBuilder);
  private turnstile = inject(TurnstileService);

  @ViewChild('formSection') formSection!: ElementRef;
  @ViewChild('turnstileHost') turnstileHost?: ElementRef<HTMLElement>;

  private readonly SCHEDULE: Record<string, { day: number; time: string }[]> = {
    kids: [
      { day: 1, time: '5:30 PM' }, { day: 2, time: '5:00 PM' },
      { day: 3, time: '5:30 PM' }, { day: 4, time: '5:00 PM' },
      { day: 6, time: '10:00 AM' }
    ],
    adults: [
      { day: 1, time: '7:00 PM' }, { day: 2, time: '6:00 PM' },
      { day: 3, time: '7:00 PM' }, { day: 4, time: '6:00 PM' },
      { day: 6, time: '11:00 AM' }
    ]
  };

  registrationForm: FormGroup;
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);
  availableSlots = signal<SlotWeek[]>([]);

  constructor() {
    this.registrationForm = this.fb.group({
      name:           ['', Validators.required],
      phone:          ['', Validators.required],
      email:          ['', [Validators.required, Validators.email]],
      interestedIn:   ['', Validators.required],
      firstClassSlot: ['', Validators.required],
      comments:       [''],
      // Honeypot — see the note in ContactComponent on why the name is nonsense.
      refCode:        ['']
    });

    this.registrationForm.get('interestedIn')!.valueChanges.subscribe(value => {
      this.registrationForm.get('firstClassSlot')!.setValue('');
      this.availableSlots.set(this.generateSlots(value));

      const comments = this.registrationForm.get('comments')!;
      if (value === 'multiple') {
        comments.setValidators(Validators.required);
      } else {
        comments.clearValidators();
      }
      comments.updateValueAndValidity();
    });
  }

  private generateSlots(interestedIn: string): SlotWeek[] {
    let schedule = this.SCHEDULE[interestedIn];
    if (!schedule) {
      if (interestedIn === 'multiple') {
        schedule = [
          { day: 1, time: '5:30 PM' }, { day: 1, time: '7:00 PM' },
          { day: 2, time: '5:00 PM' }, { day: 2, time: '6:00 PM' },
          { day: 3, time: '5:30 PM' }, { day: 3, time: '7:00 PM' },
          { day: 4, time: '5:00 PM' }, { day: 4, time: '6:00 PM' },
          { day: 6, time: '10:00 AM' }, { day: 6, time: '11:00 AM' }
        ];
      } else return [];
    }

    const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 7);
    const end = new Date(today);
    end.setDate(today.getDate() + 14);

    const weekMap = new Map<string, SlotWeek>();
    const d = new Date(start);
    while (d <= end) {
      const dow = d.getDay();
      const mon = new Date(d);
      mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
      const weekKey = mon.toISOString().split('T')[0];
      const weekLabel = 'Week of ' + mon.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

      for (const s of schedule.filter(x => x.day === dow)) {
        if (!weekMap.has(weekKey)) weekMap.set(weekKey, { weekLabel, slots: [] });
        const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const value = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' at ' + s.time;
        weekMap.get(weekKey)!.slots.push({ dayAbbr: DAY_ABBR[dow], dateLabel, time: s.time, value });
      }
      d.setDate(d.getDate() + 1);
    }
    return Array.from(weekMap.values());
  }

  async onSubmit() {
    this.registrationForm.markAllAsTouched();
    if (this.registrationForm.invalid) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const v = this.registrationForm.value as Record<string, string>;

    // Verify before promising anything — see the note in ContactComponent. A
    // booking is the most valuable submission on the site, so it is the last
    // place we want a success screen that quietly went nowhere.
    if (!environment.contactWorkerUrl || environment.contactWorkerUrl.startsWith('YOUR_')) {
      this.finishSuccessfully(v['interestedIn']);
      return;
    }

    const turnstileToken = await this.turnstile.getToken(this.turnstileHost?.nativeElement);

    if (!turnstileToken && this.turnstile.isEnabled()) {
      this.isSubmitting.set(false);
      this.submitError.set(VERIFICATION_UNAVAILABLE_MESSAGE);
      return;
    }

    const payload = {
      formType:       'booking',
      name:           v['name'],
      phone:          v['phone'],
      email:          v['email'],
      interestedIn:   v['interestedIn'],
      firstClassSlot: v['firstClassSlot'],
      comments:       v['comments'] || '',
      refCode:        v['refCode'] ?? '',
      submittedAt:    new Date().toISOString(),
      turnstileToken
    };

    try {
      const res = await fetch(environment.contactWorkerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.error('Booking form was rejected by the Worker', res.status);
        this.isSubmitting.set(false);
        this.submitError.set(DELIVERY_FAILED_MESSAGE);
        return;
      }
    } catch (err) {
      console.error('Booking form could not be delivered', err);
      this.isSubmitting.set(false);
      this.submitError.set(DELIVERY_FAILED_MESSAGE);
      return;
    }

    this.finishSuccessfully(v['interestedIn']);
  }

  private finishSuccessfully(interestedIn?: string): void {
    this.trackConversion(interestedIn ?? '');
    this.submitSuccess.set(true);
    this.isSubmitting.set(false);
    this.registrationForm.reset();
    this.availableSlots.set([]);
    this.scrollToForm();
  }

  /**
   * Reports a completed booking to Google, so it fires only when someone reaches
   * the "You're all set!" success screen — not on a page view. Two things fire:
   *   1. a GA4 `free_trial_booked` event (analytics/reporting in GA4), and
   *   2. the Google Ads "Free Trial Booked" conversion — this is what the ad
   *      campaigns optimise toward. Its ID/label come from the conversion action
   *      created in Ads > Goals; the AW- tag is activated in index.html.
   * Browser-only and defensive: if the gtag library is blocked or still loading,
   * it does nothing rather than throw.
   */
  private trackConversion(interestedIn: string): void {
    if (typeof window === 'undefined') return;
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag !== 'function') return;
    gtag('event', 'free_trial_booked', {
      event_category: 'booking',
      interested_in: interestedIn || 'unknown'
    });
    gtag('event', 'conversion', {
      send_to: 'AW-993372252/W5qZCN3jkuocENzQ1tkD'
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  private scrollToForm(): void {
    setTimeout(() => {
      this.formSection?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}
