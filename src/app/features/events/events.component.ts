import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../core/services/data.service';

interface EventBadge {
  type: 'guest' | 'free' | 'ongoing' | 'paid' | 'where' | string;
  label: string;
}

interface EventItem {
  id: string;
  title: string;
  flyer: string;
  alt?: string;
  /** ISO yyyy-mm-dd. endDate falls back to startDate for single-day events. */
  startDate?: string;
  endDate?: string;
  dateLabel?: string;
  location?: string;
  /** Recurring classes: always shown under Upcoming, never archived. */
  ongoing?: boolean;
  badges?: EventBadge[];
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {
  private dataService = inject(DataService);

  private allEvents = signal<EventItem[]>([]);
  lightboxImage = signal<string | null>(null);

  /**
   * Everything still relevant: future one-time events plus every ongoing class,
   * soonest first. This is the whole point of the date-driven page — nobody has
   * to remember to move a finished event; it drops out on its own.
   */
  upcoming = computed(() =>
    this.allEvents()
      .filter(e => e.ongoing || !this.isPast(e))
      .sort((a, b) => this.sortKey(a) - this.sortKey(b))
  );

  /** Finished one-time events, most recent first. Ongoing classes never land here. */
  past = computed(() =>
    this.allEvents()
      .filter(e => !e.ongoing && this.isPast(e))
      .sort((a, b) => this.sortKey(b) - this.sortKey(a))
  );

  ngOnInit(): void {
    this.dataService.getEvents().subscribe(data => {
      this.allEvents.set(data?.events ?? []);
    });
  }

  openLightbox(src: string): void {
    this.lightboxImage.set(src);
  }

  closeLightbox(): void {
    this.lightboxImage.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.lightboxImage()) this.closeLightbox();
  }

  /**
   * An event is "past" once the day after its end has begun, in the visitor's
   * own timezone. A dateless event (a pure ongoing class) is never past.
   */
  private isPast(e: EventItem): boolean {
    const end = e.endDate || e.startDate;
    if (!end) return false;
    // Local end-of-day: "T23:59:59" (no Z) stays in the viewer's timezone, so an
    // event isn't archived until its final day is genuinely over for them.
    return new Date(`${end}T23:59:59`).getTime() < Date.now();
  }

  private sortKey(e: EventItem): number {
    const d = e.startDate || e.endDate;
    return d ? new Date(d).getTime() : 0;
  }
}
