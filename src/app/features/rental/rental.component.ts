import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-rental',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rental.component.html',
  styleUrls: ['./rental.component.scss']
})
export class RentalComponent {
  selectedImage = signal<string | null>(null);
  isVideoPlaying = signal(false);

  images = [
    { src: 'assets/images/rental/rental_space1.jpeg', alt: 'Studio space view 1' },
    { src: 'assets/images/rental/rental_space2.jpeg', alt: 'Studio space view 2' },
    { src: 'assets/images/rental/rental_space3.jpeg', alt: 'Studio space view 3' }
  ];

  openImage(src: string) {
    this.selectedImage.set(src);
  }

  closeImage() {
    this.selectedImage.set(null);
  }

  playVideo() {
    this.isVideoPlaying.set(true);
  }
}
