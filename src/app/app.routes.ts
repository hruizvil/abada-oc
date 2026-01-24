import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { ScheduleComponent } from './features/schedule/schedule.component';
import { AboutLandingComponent } from './features/about/about-landing.component';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';
import { ClassesComponent } from './features/classes/classes.component';

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
    path: 'classes',
    component: ClassesComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
