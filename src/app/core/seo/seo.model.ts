/**
 * Search-engine and social-preview metadata for a single page.
 *
 * Note: these are applied at runtime, after Angular boots. Google runs JavaScript
 * and will see them; social crawlers (Facebook, WhatsApp, iMessage, LinkedIn,
 * Discord, Slack) do not, and will only ever see the defaults baked into
 * index.html. Fixing that requires prerendering — see Step 4 in SEO-PLAN.md.
 */
export interface PageSeo {
  /** The <title>. Aim for under ~60 characters so it isn't truncated in results. */
  title: string;
  /** The <meta name="description">. Aim for 140-160 characters. */
  description: string;
  /**
   * Internal route path: leading slash, no trailing slash (e.g. '/contact').
   * SeoService.canonicalUrl() adds the trailing slash for the canonical/og:url,
   * to match the folder-index URL GitHub Pages actually serves.
   */
  path: string;
  /** Social preview image, app-relative. Falls back to DEFAULT_OG_IMAGE. */
  image?: string;
  /** Keep this page out of search results entirely. */
  noIndex?: boolean;
}
