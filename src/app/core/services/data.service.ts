import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NavigationData } from '../models/navigation.model';
import { HomeContent } from '../models/content.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private readonly dataPath = '/assets/data';

  getNavigationData(): Observable<NavigationData> {
    return this.http.get<NavigationData>(`${this.dataPath}/navigation.json`);
  }

  getHomeContent(): Observable<HomeContent> {
    return this.http.get<HomeContent>(`${this.dataPath}/home-content.json`);
  }

  getSchedule(): Observable<any> {
    return this.http.get(`${this.dataPath}/schedule.json`);
  }

  getKidsProgram(): Observable<any> {
    return this.http.get(`${this.dataPath}/kids-program.json`);
  }

  getAboutContent(page: string): Observable<any> {
    return this.http.get(`${this.dataPath}/about-${page}.json`);
  }
}
