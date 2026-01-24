import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { inject } from '@angular/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  private fb = inject(FormBuilder);

  registrationForm: FormGroup;
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);

  constructor() {
    this.registrationForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: [''],
      isFirstTime: ['yes'],
      comments: ['']
    });
  }

  onSubmit() {
    if (this.registrationForm.valid) {
      this.isSubmitting.set(true);
      this.submitError.set(null);

      // Simulate form submission (replace with actual API call later)
      setTimeout(() => {
        this.isSubmitting.set(false);
        this.submitSuccess.set(true);
        this.registrationForm.reset();
      }, 1000);
    } else {
      this.registrationForm.markAllAsTouched();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }
}
