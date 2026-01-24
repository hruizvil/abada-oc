import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  private routeSub: Subscription | null = null;

  pageData = signal<any>(null);
  pageType = signal<string>('capoeira');

  ngOnInit() {
    this.routeSub = this.route.params.subscribe(params => {
      const page = params['page'] || 'capoeira';
      this.pageType.set(page);
      this.loadPageContent(page);
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  private loadPageContent(page: string) {
    this.dataService.getAboutContent(page).subscribe({
      next: (data) => this.pageData.set(data),
      error: () => this.pageData.set(null)
    });
  }
}
