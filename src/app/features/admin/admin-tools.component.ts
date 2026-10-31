import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataService } from './admin-data.service';
import { IconName, IconComponent } from '../../shared/ui/icon.component';

interface ToolLink {
  title: string;
  sub: string;
  url: string;
  icon: IconName;
  bg: string;
  fg: string;
}

/** Tools: quick links out to the booking form, sheets, Drive, Stripe and Firebase. */
@Component({
  selector: 'app-admin-tools',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './admin-tools.component.html',
  styleUrls: ['./admin-tools.component.scss']
})
export class AdminToolsComponent {
  protected readonly cc = inject(AdminDataService);

  protected readonly tools = computed<ToolLink[]>(() => {
    const l = this.cc.data()?.links;
    const fromSheets: ToolLink[] = l
      ? [
          { title: 'Booking form', sub: 'Free-trial sign-up page', url: l.bookingForm, icon: 'cal', bg: '#e3f3f1', fg: '#23756c' },
          { title: 'Class schedule', sub: 'Weekly class times', url: l.schedule, icon: 'cal', bg: '#e8eefc', fg: '#3655a8' },
          { title: 'Questionnaire form', sub: 'What new students fill in', url: l.questionnaireForm, icon: 'doc', bg: '#efe4f7', fg: '#6f1f90' },
          { title: 'Google reviews', sub: 'Your review link', url: l.reviews, icon: 'star', bg: '#fcefe1', fg: '#9a5b14' },
          { title: 'Bookings sheet', sub: 'Raw booking data', url: l.bookingsSheet, icon: 'sheet', bg: '#e7f4ec', fg: '#2f855a' },
          { title: 'Waivers in Drive', sub: 'Every signed PDF', url: l.waiversFolder, icon: 'folder', bg: '#e8eefc', fg: '#3655a8' },
          { title: 'Questionnaire responses', sub: 'Raw sheet', url: l.questionnaireSheet, icon: 'sheet', bg: '#e7f4ec', fg: '#2f855a' },
          { title: 'Website', sub: 'abadaoc.com', url: l.website, icon: 'globe', bg: '#efe4f7', fg: '#6f1f90' }
        ]
      : [];
    const always: ToolLink[] = [
      { title: 'Stripe dashboard', sub: 'Payments and payouts', url: 'https://dashboard.stripe.com/', icon: 'card', bg: '#ecebfd', fg: '#5146c9' },
      { title: 'Firebase console', sub: 'Members, cards, check-ins', url: 'https://console.firebase.google.com/project/abada-oc/firestore', icon: 'db', bg: '#fcefe1', fg: '#9a5b14' }
    ];
    return [...fromSheets, ...always].filter((t) => !!t.url);
  });

  protected readonly columns = computed(() => {
    const t = this.tools();
    const half = Math.ceil(t.length / 2);
    return [t.slice(0, half), t.slice(half)];
  });
}
