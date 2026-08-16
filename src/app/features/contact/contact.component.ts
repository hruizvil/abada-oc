import { Component, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import {
  TurnstileService,
  VERIFICATION_UNAVAILABLE_MESSAGE,
  DELIVERY_FAILED_MESSAGE
} from '../../core/services/turnstile.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private turnstile = inject(TurnstileService);

  @ViewChild('turnstileHost') turnstileHost?: ElementRef<HTMLElement>;

  contactForm: FormGroup;
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);

  constructor() {
    this.contactForm = this.fb.group({
      name:    ['', Validators.required],
      phone:   ['', Validators.required],
      email:   ['', [Validators.required, Validators.email]],
      message: ['', Validators.required],
      // Honeypot. Hidden from people and from screen readers, so anything that
      // fills it is automated. The Worker drops those without sending an email.
      //
      // The name is deliberately meaningless. It was 'website' first, which is a
      // field name password managers and browser autofill actively look for —
      // one of those filling it in would have silently binned a real message.
      refCode: ['']
    });
  }

  /**
   * Verifies first, promises second.
   *
   * The success screen used to appear the instant you clicked, with delivery run
   * in the background. That reads well right up until the Worker rejects the
   * submission — the visitor has already been told it sent, so a real inquiry
   * disappears and nobody, on either end, ever finds out.
   *
   * Turnstile is invisible and normally answers in a few hundred milliseconds,
   * so waiting for it still feels immediate. When it cannot answer — nearly
   * always a blocking browser extension — we say so and give the phone number
   * and email instead, which is a far better outcome for someone trying to book
   * a class than a success message that quietly went nowhere.
   */
  async onSubmit(): Promise<void> {
    this.contactForm.markAllAsTouched();
    if (this.contactForm.invalid) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const v = this.contactForm.value as Record<string, string>;

    if (!environment.contactWorkerUrl || environment.contactWorkerUrl.startsWith('YOUR_')) {
      // Endpoint not configured yet: keep the old inert behaviour rather than
      // showing a stranger an error caused by our own setup being incomplete.
      this.finishSuccessfully();
      return;
    }

    const turnstileToken = await this.turnstile.getToken(this.turnstileHost?.nativeElement);

    if (!turnstileToken && this.turnstile.isEnabled()) {
      this.isSubmitting.set(false);
      this.submitError.set(VERIFICATION_UNAVAILABLE_MESSAGE);
      return;
    }

    const payload = {
      formType:    'contact',
      name:        v['name'],
      phone:       v['phone'],
      email:       v['email'],
      message:     v['message'],
      refCode:     v['refCode'] ?? '',
      submittedAt: new Date().toISOString(),
      turnstileToken
    };

    try {
      const res = await fetch(environment.contactWorkerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.error('Contact form was rejected by the Worker', res.status);
        this.isSubmitting.set(false);
        this.submitError.set(DELIVERY_FAILED_MESSAGE);
        return;
      }
    } catch (err) {
      console.error('Contact form could not be delivered', err);
      this.isSubmitting.set(false);
      this.submitError.set(DELIVERY_FAILED_MESSAGE);
      return;
    }

    this.finishSuccessfully();
  }

  private finishSuccessfully(): void {
    this.submitSuccess.set(true);
    this.isSubmitting.set(false);
    this.contactForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }
}
