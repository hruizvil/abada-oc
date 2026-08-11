import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { ScheduleComponent } from './features/schedule/schedule.component';
import { AboutLandingComponent } from './features/about/about-landing.component';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';
import { ClassesComponent } from './features/classes/classes.component';
import { RentalComponent } from './features/rental/rental.component';
import { EventsComponent } from './features/events/events.component';
import { GalleryComponent } from './features/gallery/gallery.component';
import { WaiverComponent } from './features/waiver/waiver.component';
import { BookComponent } from './features/book/book.component';

// `data.seo` keys into PAGE_SEO in core/seo/seo.config.ts, where all the page
// titles and descriptions live. SeoTitleStrategy applies them on navigation.
// Without this data every route silently falls back to the site default, which
// also points every canonical tag at the homepage — worse than no tags at all.
export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: { seo: 'home' }
  },
  {
    path: 'schedule',
    component: ScheduleComponent,
    data: { seo: 'schedule' }
  },
  {
    path: 'about',
    component: AboutLandingComponent,
    data: { seo: 'about' }
  },
  {
    path: 'about/:page',
    component: AboutComponent,
    // Metadata depends on :page, so the component sets it itself.
    data: { seoDynamic: true }
  },
  {
    path: 'contact',
    component: ContactComponent,
    data: { seo: 'contact' }
  },
  {
    path: 'book',
    component: BookComponent,
    data: { seo: 'book' }
  },
  {
    path: 'gallery',
    component: GalleryComponent,
    data: { seo: 'gallery' }
  },
  {
    path: 'classes',
    component: ClassesComponent,
    data: { seo: 'classes' }
  },
  {
    path: 'events',
    component: EventsComponent,
    data: { seo: 'events' }
  },
  {
    path: 'rental',
    component: RentalComponent,
    data: { seo: 'rental' }
  },
  {
    path: 'waiver',
    component: WaiverComponent,
    data: { seo: 'waiver' }
  },
  {
    path: '**',
    redirectTo: ''
  }
];
