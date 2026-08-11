import { Component, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { TurnstileService } from '../../core/services/turnstile.service';

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
      website: ['']
    });
  }

  onSubmit(): void {
    this.contactForm.markAllAsTouched();
    if (this.contactForm.invalid) return;

    const v = this.contactForm.value;

    // Confirm to the visitor straight away. Waiting on Turnstile and the network
    // would replace instant feedback with a spinner, and there is nothing useful
    // we could tell them if the send failed anyway — so the delivery runs in the
    // background and reports problems to the console, not to the person.
    this.submitSuccess.set(true);
    this.isSubmitting.set(false);
    this.contactForm.reset();

    void this.deliver(v);
  }

  private async deliver(v: Record<string, string>): Promise<void> {
    if (!environment.contactWorkerUrl || environment.contactWorkerUrl.startsWith('YOUR_')) return;

    const turnstileToken = await this.turnstile.getToken(this.turnstileHost?.nativeElement);

    const payload = {
      formType:    'contact',
      name:        v['name'],
      phone:       v['phone'],
      email:       v['email'],
      message:     v['message'],
      website:     v['website'] ?? '',
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
      }
    } catch (err) {
      console.error('Contact form could not be delivered', err);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }
}
