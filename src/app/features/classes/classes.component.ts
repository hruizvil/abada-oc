import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DataService } from '../../core/services/data.service';

/**
 * One component, two audiences. `/classes/kids` and `/classes/adults` both render
 * this; the route's `data.audience` picks which program content and hero copy to
 * show. `/classes` itself redirects to `/classes/kids` (see app.routes.ts), so the
 * old combined page no longer exists — each audience gets a page that matches the
 * ad (and the search) that brought them here.
 */
@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.scss']
})
export class ClassesComponent implements OnInit {
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);

  audience = signal<'kids' | 'adults'>('kids');
  program = signal<any>(null);

  ngOnInit() {
    // Subscribe (not snapshot): navigating kids <-> adults reuses this instance.
    this.route.data.subscribe(data => {
      const audience = data['audience'] === 'adults' ? 'adults' : 'kids';
      this.audience.set(audience);
      const source = audience === 'adults'
        ? this.dataService.getAdultsProgram()
        : this.dataService.getKidsProgram();
      source.subscribe(program => this.program.set(program));
    });
  }
}
