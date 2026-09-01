import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './terms.component.html',
  // Reuses the privacy page's styles so the two legal pages look identical.
  styleUrls: ['../privacy/privacy.component.scss']
})
export class TermsComponent {
  readonly lastUpdated = 'September 1, 2026';
}
