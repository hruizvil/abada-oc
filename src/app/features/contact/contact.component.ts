import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  private fb = inject(FormBuilder);

  contactForm: FormGroup;
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);

  constructor() {
    this.contactForm = this.fb.group({
      name:    ['', Validators.required],
      phone:   ['', Validators.required],
      email:   ['', [Validators.required, Validators.email]],
      message: ['', Validators.required]
    });
  }

  async onSubmit() {
    this.contactForm.markAllAsTouched();
    if (this.contactForm.invalid) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const v = this.contactForm.value;
    const payload = {
      formType:    'contact',
      name:        v.name,
      phone:       v.phone,
      email:       v.email,
      message:     v.message,
      submittedAt: new Date().toISOString()
    };

    if (environment.contactSheetUrl && !environment.contactSheetUrl.startsWith('YOUR_')) {
      fetch(environment.contactSheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    this.submitSuccess.set(true);
    this.isSubmitting.set(false);
    this.contactForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }
}
