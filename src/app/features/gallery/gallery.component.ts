import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent {
  // Gallery categories for future use
  categories = [
    { id: 'all', name: 'All' },
    { id: 'classes', name: 'Classes' },
    { id: 'events', name: 'Events' },
    { id: 'performances', name: 'Performances' },
    { id: 'community', name: 'Community' }
  ];
}
