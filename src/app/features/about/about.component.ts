import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { SeoService } from '../../core/seo/seo.service';
import { ABOUT_SEO, PAGE_SEO } from '../../core/seo/seo.config';
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
  private seo = inject(SeoService);
  private routeSub: Subscription | null = null;

  pageData = signal<any>(null);
  pageType = signal<string>('capoeira');

  ngOnInit() {
    this.routeSub = this.route.params.subscribe(params => {
      const page = params['page'] || 'capoeira';
      this.pageType.set(page);
      // This route is marked seoDynamic, so SeoTitleStrategy leaves it to us.
      // Unknown topics fall back to the generic /about metadata.
      this.seo.update(ABOUT_SEO[page] ?? PAGE_SEO['about']);
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
