import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmailService } from '../../core/services/email.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private emailService = inject(EmailService);

  registrationForm: FormGroup;
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);

  constructor() {
    this.registrationForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      interestedIn: ['', Validators.required],
      comments: ['']
    });
  }

  async onSubmit() {
    if (this.registrationForm.valid) {
      this.isSubmitting.set(true);
      this.submitError.set(null);

      try {
        await this.emailService.sendRegistrationEmail(this.registrationForm.value);
        this.submitSuccess.set(true);
        this.registrationForm.reset();
      } catch (error) {
        this.submitError.set(
          error instanceof Error ? error.message : 'An error occurred. Please try again.'
        );
      } finally {
        this.isSubmitting.set(false);
      }
    } else {
      this.registrationForm.markAllAsTouched();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }
}
