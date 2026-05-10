import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './join.component.html',
  styleUrl: './join.component.scss'
})
export class JoinComponent {
  joinForm: FormGroup;
  isMinor = signal(false);
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal('');

  constructor(private fb: FormBuilder) {
    this.joinForm = this.fb.group({
      // Personal
      firstName:   ['', Validators.required],
      lastName:    ['', Validators.required],
      apelido:     [''],
      email:       ['', [Validators.required, Validators.email]],
      phone:       ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      address:     ['', Validators.required],
      city:        ['', Validators.required],
      zipCode:     ['', Validators.required],
      // Parent / Guardian (conditional)
      parentName:  [''],
      parentEmail: [''],
      parentPhone: [''],
      // Emergency Contact
      emergencyName:         ['', Validators.required],
      emergencyRelationship: ['', Validators.required],
      emergencyPhone:        ['', Validators.required],
      // Medical
      medicalConditions: [''],
      // Program
      program:            ['', Validators.required],
      schedulePreference: ['', Validators.required],
      experience:         ['', Validators.required],
      goals:       [''],
      hearAboutUs: [''],
      // Agreement
      agreeToTerms: [false, Validators.requiredTrue]
    });

    this.joinForm.get('dateOfBirth')!.valueChanges.subscribe(dob => {
      const minor = this.calculateIsMinor(dob);
      this.isMinor.set(minor);
      const pName  = this.joinForm.get('parentName')!;
      const pEmail = this.joinForm.get('parentEmail')!;
      const pPhone = this.joinForm.get('parentPhone')!;
      if (minor) {
        pName.setValidators(Validators.required);
        pEmail.setValidators([Validators.required, Validators.email]);
        pPhone.setValidators(Validators.required);
      } else {
        pName.clearValidators();
        pEmail.clearValidators();
        pPhone.clearValidators();
      }
      [pName, pEmail, pPhone].forEach(c => c.updateValueAndValidity());
    });
  }

  private calculateIsMinor(dob: string): boolean {
    if (!dob) return false;
    const today = new Date();
    const birth = new Date(dob);
    const age = today.getFullYear() - birth.getFullYear()
      - (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    return age < 18;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.joinForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  async onSubmit(): Promise<void> {
    this.joinForm.markAllAsTouched();
    if (this.joinForm.invalid) return;

    this.isSubmitting.set(true);
    this.submitError.set('');

    const v = this.joinForm.value;
    const payload = {
      formType:              'join',
      firstName:             v.firstName,
      lastName:              v.lastName,
      apelido:               v.apelido || '',
      email:                 v.email,
      phone:                 v.phone,
      dateOfBirth:           v.dateOfBirth,
      isMinor:               this.isMinor(),
      parentName:            v.parentName  || '',
      parentEmail:           v.parentEmail || '',
      parentPhone:           v.parentPhone || '',
      address:               v.address,
      city:                  v.city,
      zipCode:               v.zipCode,
      emergencyName:         v.emergencyName,
      emergencyRelationship: v.emergencyRelationship,
      emergencyPhone:        v.emergencyPhone,
      medicalConditions:     v.medicalConditions || 'None',
      program:               v.program,
      schedulePreference:    v.schedulePreference,
      experience:            v.experience,
      goals:                 v.goals || '',
      hearAboutUs:           v.hearAboutUs || '',
      submittedAt:           new Date().toISOString()
    };

    try {
      if (environment.joinSheetUrl && !environment.joinSheetUrl.startsWith('YOUR_')) {
        await fetch(environment.joinSheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      this.submitSuccess.set(true);
    } catch {
      this.submitError.set('Something went wrong. Please try again or contact us directly.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
