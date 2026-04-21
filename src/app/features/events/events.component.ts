import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {
  private dataService = inject(DataService);
  private fb = inject(FormBuilder);

  eventData = signal<any>(null);
  lightboxImage = signal<string | null>(null);

  // Form state
  registrationForm!: FormGroup;
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);
  submittedData = signal<any>(null);

  // Attendee count options
  readonly attendeeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Signal-tracked attendee count so computed signals react to changes
  attendeeCount = signal(1);

  totalPrice = computed(() => {
    const count = this.attendeeCount();
    if (count === 1) return 220;
    if (count === 2) return 400;
    return count * 180;
  });

  pricePerPerson = computed(() => {
    const count = this.attendeeCount();
    if (count === 1) return 220;
    if (count === 2) return 200;
    return 180;
  });

  ngOnInit() {
    this.dataService.getEvents().subscribe(data => {
      this.eventData.set(data.upcomingEvent);
    });

    this.registrationForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName:  ['', Validators.required],
      apelido:   [''],
      phone:     ['', Validators.required],
      email:     ['', [Validators.required, Validators.email]],
      attendeeCount: [1, Validators.required]
    });

    // React to attendee count changes
    this.registrationForm.get('attendeeCount')!.valueChanges.subscribe(count => {
      this.attendeeCount.set(Number(count));
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  async onSubmit() {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const form = this.registrationForm.value;

    const data = {
      firstName:     form.firstName,
      lastName:      form.lastName,
      apelido:       form.apelido,
      phone:         form.phone,
      email:         form.email,
      attendeeCount: Number(form.attendeeCount),
      totalPrice:    this.totalPrice()
    };

    try {
      // POST to Google Apps Script — handles both Sheets save + confirmation email.
      // Uses fetch with no-cors + text/plain to avoid CORS preflight (Apps Script limitation).
      await fetch(environment.googleSheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(data)
      });

      this.submittedData.set(data);
      this.submitSuccess.set(true);
      this.registrationForm.reset({ attendeeCount: 1 });
    } catch (error) {
      this.submitError.set('An error occurred. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  resetForm() {
    this.submitSuccess.set(false);
    this.submittedData.set(null);
    this.submitError.set(null);
  }

  openLightbox(src: string) {
    this.lightboxImage.set(src);
  }

  closeLightbox() {
    this.lightboxImage.set(null);
  }
}
