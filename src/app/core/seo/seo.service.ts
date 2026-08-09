import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { PageSeo } from './seo.model';
import { DEFAULT_OG_IMAGE, DEFAULT_SEO, SITE_LOCALE, SITE_NAME, SITE_URL } from './seo.config';

/**
 * Applies per-page title, description, canonical, and social-preview tags.
 *
 * Called automatically on navigation by SeoTitleStrategy. Components only need to
 * call `update()` directly when their metadata depends on loaded data — currently
 * just AboutComponent, whose topic comes from a route parameter.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  update(seo: PageSeo | undefined): void {
    const page = seo ?? DEFAULT_SEO;
    const url = this.absolute(page.path);
    const image = this.absolute(page.image ?? DEFAULT_OG_IMAGE);

    this.title.setTitle(page.title);
    this.meta.updateTag({ name: 'description', content: page.description });

    this.setCanonical(url);
    this.setRobots(page.noIndex === true);

    // Open Graph — Facebook, LinkedIn, WhatsApp, iMessage, Discord, Slack.
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:locale', content: SITE_LOCALE });
    this.meta.updateTag({ property: 'og:title', content: page.title });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });

    // X reads this namespace. It is still called `twitter:` — the tag names were never
    // renamed after the rebrand, and there is no `x:` equivalent. Since the og: tags
    // above are also set, the one that really earns its place is twitter:card, which
    // picks the large-image layout instead of the small default.
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: page.title });
    this.meta.updateTag({ name: 'twitter:description', content: page.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
  }

  /** Turns an app-relative path into a full https:// URL. */
  private absolute(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return normalized === '/' ? `${SITE_URL}/` : `${SITE_URL}${normalized}`;
  }

  /**
   * Tells search engines which URL is the authoritative one for this page, so the
   * SPA redirect hack's `?/route` form doesn't get indexed as a separate page.
   */
  private setCanonical(url: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  private setRobots(noIndex: boolean): void {
    if (noIndex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.meta.removeTag('name="robots"');
    }
  }
}
