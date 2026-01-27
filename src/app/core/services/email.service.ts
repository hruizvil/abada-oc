import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { environment } from '../../../environments/environment';

export interface RegistrationData {
  name: string;
  phone: string;
  email: string;
  interestedIn: string;
  comments: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private interestLabels: Record<string, string> = {
    'kids': 'Kids (ages 5-12)',
    'adults': 'Adults (12 years & up)',
    'multiple': 'Multiple family members'
  };

  constructor() {
    // Initialize EmailJS with your public key
    emailjs.init(environment.emailjs.publicKey);
  }

  async sendRegistrationEmail(data: RegistrationData): Promise<void> {
    const templateParams = {
      from_name: data.name,
      from_email: data.email,
      phone: data.phone,
      interested_in: this.interestLabels[data.interestedIn] || data.interestedIn,
      comments: data.comments || 'None',
      to_email: environment.emailjs.toEmail
    };

    try {
      // Send admin notification email
      await emailjs.send(
        environment.emailjs.serviceId,
        environment.emailjs.templateId,
        templateParams
      );

      // Send auto-reply to user (if template is configured)
      if (environment.emailjs.autoReplyTemplateId &&
          environment.emailjs.autoReplyTemplateId !== 'YOUR_AUTO_REPLY_TEMPLATE_ID') {
        await emailjs.send(
          environment.emailjs.serviceId,
          environment.emailjs.autoReplyTemplateId,
          templateParams
        );
      }
    } catch (error) {
      console.error('EmailJS error:', error);
      throw new Error('Failed to send registration. Please try again or call us directly.');
    }
  }
}
