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
import { PrivacyComponent } from './features/privacy/privacy.component';

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
    // Old, misspelled bio URL ("mestre", masculine) that the previous site
    // exposed and Google still has cached — the correct slug is the feminine
    // "mestra". Must sit before about/:page or the wildcard param would swallow
    // it and render an empty About page. Google will drop the stale 404 on its
    // own; this just lands any human with an old link on the right bio.
    path: 'about/mestre-cigarra',
    redirectTo: 'about/mestra-cigarra',
    pathMatch: 'full'
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
    // The combined "Our Programs" page is gone — each audience gets a page that
    // matches the ad and search that brought them here. Anyone landing on the
    // bare /classes (typed, bookmarked, or the nav parent on desktop) goes to Kids.
    path: 'classes',
    redirectTo: 'classes/kids',
    pathMatch: 'full'
  },
  {
    path: 'classes/kids',
    component: ClassesComponent,
    data: { seo: 'classesKids', audience: 'kids' }
  },
  {
    path: 'classes/adults',
    component: ClassesComponent,
    data: { seo: 'classesAdults', audience: 'adults' }
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
    path: 'privacy',
    component: PrivacyComponent,
    data: { seo: 'privacy' }
  },
  {
    path: '**',
    redirectTo: ''
  }
];
