import { Component, signal, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import SignaturePad from 'signature_pad';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-waiver',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './waiver.component.html',
  styleUrl: './waiver.component.scss'
})
export class WaiverComponent implements AfterViewInit, AfterViewChecked, OnDestroy {
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('guardianSignatureCanvas') guardianSignatureCanvas?: ElementRef<HTMLCanvasElement>;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private signaturePad!: SignaturePad;
  private guardianSignaturePad?: SignaturePad;
  private resizeHandler = () => {
    this.resizeCanvas(this.signatureCanvas.nativeElement, this.signaturePad);
    if (this.guardianSignaturePad && this.guardianSignatureCanvas) {
      this.resizeCanvas(this.guardianSignatureCanvas.nativeElement, this.guardianSignaturePad);
    }
  };

  waiverForm: FormGroup;
  isMinor = signal(false);
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal('');
  signatureEmpty = signal(true);
  guardianSignatureEmpty = signal(true);

  constructor(private fb: FormBuilder) {
    this.waiverForm = this.fb.group({
      firstName:    ['', Validators.required],
      lastName:     ['', Validators.required],
      apelido:      [''],
      email:        ['', [Validators.required, Validators.email]],
      phone:        ['', Validators.required],
      dateOfBirth:           ['', Validators.required],
      emergencyName:         ['', Validators.required],
      emergencyPhone:        ['', Validators.required],
      emergencyRelationship: ['', Validators.required],
      parentName:            [''],
      parentEmail:           [''],
      agreeToTerms:          [false, Validators.requiredTrue]
    });

    this.waiverForm.get('dateOfBirth')!.valueChanges.subscribe(dob => {
      const minor = this.calculateIsMinor(dob);
      this.isMinor.set(minor);
      const parentName  = this.waiverForm.get('parentName')!;
      const parentEmail = this.waiverForm.get('parentEmail')!;
      if (minor) {
        parentName.setValidators(Validators.required);
        parentEmail.setValidators([Validators.required, Validators.email]);
      } else {
        parentName.clearValidators();
        parentEmail.clearValidators();
        this.guardianSignaturePad = undefined;
        this.guardianSignatureEmpty.set(true);
      }
      parentName.updateValueAndValidity();
      parentEmail.updateValueAndValidity();
    });
  }

  ngAfterViewInit(): void {
    // Prerendering DOES run this hook. Everything below needs a real canvas and
    // a real window, so it is browser-only.
    if (!this.isBrowser) return;

    const canvas = this.signatureCanvas.nativeElement;
    this.resizeCanvas(canvas);
    this.signaturePad = new SignaturePad(canvas, { penColor: '#1a1a1a', minWidth: 1, maxWidth: 3 });
    this.signaturePad.addEventListener('endStroke', () => {
      this.signatureEmpty.set(this.signaturePad.isEmpty());
    });
    window.addEventListener('resize', this.resizeHandler);
  }

  ngAfterViewChecked(): void {
    if (!this.isBrowser) return;

    if (this.isMinor() && this.guardianSignatureCanvas && !this.guardianSignaturePad) {
      this.initGuardianPad();
    }
  }

  ngOnDestroy(): void {
    // Runs during prerendering too, when the teardown destroys the app. On the
    // server the listener was never added, and touching `window` here crashed
    // the prerender worker.
    if (!this.isBrowser) return;
    window.removeEventListener('resize', this.resizeHandler);
  }

  private initGuardianPad(): void {
    const canvas = this.guardianSignatureCanvas!.nativeElement;
    this.resizeCanvas(canvas, undefined);
    this.guardianSignaturePad = new SignaturePad(canvas, { penColor: '#1a1a1a', minWidth: 1, maxWidth: 3 });
    this.guardianSignaturePad.addEventListener('endStroke', () => {
      this.guardianSignatureEmpty.set(this.guardianSignaturePad!.isEmpty());
    });
  }

  private resizeCanvas(canvas: HTMLCanvasElement, pad?: SignaturePad): void {
    const data = pad?.toData();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width  = canvas.offsetWidth  * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')!.scale(ratio, ratio);
    if (pad && data?.length) {
      pad.fromData(data);
    }
  }

  clearSignature(): void {
    this.signaturePad.clear();
    this.signatureEmpty.set(true);
  }

  clearGuardianSignature(): void {
    this.guardianSignaturePad?.clear();
    this.guardianSignatureEmpty.set(true);
  }

  private calculateIsMinor(dob: string): boolean {
    if (!dob) return false;
    const today = new Date();
    const birthDate = new Date(dob);
    const age = today.getFullYear() - birthDate.getFullYear()
      - (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0);
    return age < 18;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.waiverForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  async onSubmit(): Promise<void> {
    this.waiverForm.markAllAsTouched();

    if (this.waiverForm.invalid) return;
    if (this.signaturePad.isEmpty()) {
      this.signatureEmpty.set(true);
      return;
    }
    if (this.isMinor() && (!this.guardianSignaturePad || this.guardianSignaturePad.isEmpty())) {
      this.guardianSignatureEmpty.set(true);
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set('');

    const formValue = this.waiverForm.value;
    const payload = {
      firstName:        formValue.firstName,
      lastName:         formValue.lastName,
      apelido:          formValue.apelido || '',
      email:            formValue.email,
      phone:            formValue.phone,
      dateOfBirth:      formValue.dateOfBirth,
      isMinor:               this.isMinor(),
      emergencyName:         formValue.emergencyName,
      emergencyPhone:        formValue.emergencyPhone,
      emergencyRelationship: formValue.emergencyRelationship,
      parentName:            formValue.parentName  || '',
      parentEmail:           formValue.parentEmail || '',
      formType:         'waiver',
      signature:        this.signaturePad.toDataURL('image/png'),
      guardianSignature: this.isMinor() ? (this.guardianSignaturePad?.toDataURL('image/png') || '') : '',
      agreedAt:         new Date().toISOString()
    };

    if (environment.waiverSheetUrl && !environment.waiverSheetUrl.startsWith('YOUR_')) {
      fetch(environment.waiverSheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    this.submitSuccess.set(true);
    this.isSubmitting.set(false);
  }
}
