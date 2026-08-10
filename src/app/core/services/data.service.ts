import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { NavigationData } from '../models/navigation.model';
import { HomeContent } from '../models/content.model';

import navigationJson from '../../../assets/data/navigation.json';
import homeContentJson from '../../../assets/data/home-content.json';
import scheduleJson from '../../../assets/data/schedule.json';
import kidsProgramJson from '../../../assets/data/kids-program.json';
import eventsJson from '../../../assets/data/events.json';

import aboutCapoeira from '../../../assets/data/about-capoeira.json';
import aboutCordSystem from '../../../assets/data/about-cord-system.json';
import aboutMaculele from '../../../assets/data/about-maculele.json';
import aboutSambaDeRoda from '../../../assets/data/about-samba-de-roda.json';
import aboutProfessorMosquito from '../../../assets/data/about-professor-mosquito.json';
import aboutMestreCamisa from '../../../assets/data/about-mestre-camisa.json';
import aboutMestraCigarra from '../../../assets/data/about-mestra-cigarra.json';

const ABOUT_PAGES: Record<string, unknown> = {
  'capoeira': aboutCapoeira,
  'cord-system': aboutCordSystem,
  'maculele': aboutMaculele,
  'samba-de-roda': aboutSambaDeRoda,
  'professor-mosquito': aboutProfessorMosquito,
  'mestre-camisa': aboutMestreCamisa,
  'mestra-cigarra': aboutMestraCigarra
};

/**
 * Site content, imported at build time rather than fetched over HTTP.
 *
 * These files are static build assets — they never change at runtime, so there is
 * nothing to wait for. Fetching them used to leave every component rendering
 * nothing until the response landed (`@if (navigationData(); as nav)`), which made
 * the header disappear on load and on every navigation.
 *
 * The methods still return Observables so callers did not have to change. `of()`
 * emits synchronously on subscribe, so the data is set before the first render
 * and no empty state is ever painted. Total bundled size is ~39 KB.
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {
  getNavigationData(): Observable<NavigationData> {
    return of(navigationJson as unknown as NavigationData);
  }

  getHomeContent(): Observable<HomeContent> {
    return of(homeContentJson as unknown as HomeContent);
  }

  getSchedule(): Observable<any> {
    return of(scheduleJson);
  }

  getKidsProgram(): Observable<any> {
    return of(kidsProgramJson);
  }

  getAboutContent(page: string): Observable<any> {
    const content = ABOUT_PAGES[page];
    // Callers treat an error as "unknown topic" and render their fallback, which
    // is what the old HTTP 404 produced.
    return content ? of(content) : throwError(() => new Error(`Unknown about page: ${page}`));
  }

  getEvents(): Observable<any> {
    return of(eventsJson);
  }
}
