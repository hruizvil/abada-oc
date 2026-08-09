import { Routes } from '@angular/router';
import { localOnlyGuard } from './core/guards/local-only.guard';
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

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'schedule',
    component: ScheduleComponent
  },
  {
    path: 'about',
    component: AboutLandingComponent
  },
  {
    path: 'about/:page',
    component: AboutComponent
  },
  {
    path: 'contact',
    component: ContactComponent
  },
  {
    path: 'book',
    component: BookComponent
  },
  {
    path: 'gallery',
    component: GalleryComponent
  },
  {
    path: 'classes',
    component: ClassesComponent
  },
  {
    path: 'events',
    component: EventsComponent
  },
  {
    path: 'rental',
    component: RentalComponent
  },
  {
    path: 'waiver',
    component: WaiverComponent
  },
  {
    path: 'musica',
    canActivate: [localOnlyGuard],
    loadComponent: () => import('./features/musica/musica.component').then(m => m.MusicaComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
