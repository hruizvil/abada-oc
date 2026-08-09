import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { PAGE_SEO } from './seo.config';
import { SeoService } from './seo.service';

/**
 * Applies each route's SEO metadata on navigation.
 *
 * Routes declare `data: { seo: '<key in PAGE_SEO>' }`. A route that resolves its own
 * metadata from route parameters declares `data: { seoDynamic: true }` instead and is
 * skipped here, so the component's value isn't immediately overwritten.
 */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly seo = inject(SeoService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const route = this.deepest(snapshot.root);

    if (route.data['seoDynamic'] === true) {
      return;
    }

    const key = route.data['seo'] as string | undefined;
    this.seo.update(key ? PAGE_SEO[key] : undefined);
  }

  private deepest(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }
}
