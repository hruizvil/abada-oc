import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {
  private dataService = inject(DataService);

  eventData = signal<any>(null);
  lightboxImage = signal<string | null>(null);

  ngOnInit() {
    this.dataService.getEvents().subscribe(data => {
      this.eventData.set(data.upcomingEvent);
    });
  }

  openLightbox(src: string) {
    this.lightboxImage.set(src);
  }

  closeLightbox() {
    this.lightboxImage.set(null);
  }
}
