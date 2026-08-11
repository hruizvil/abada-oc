import { RenderMode, ServerRoute } from '@angular/ssr';
import { ABOUT_SEO } from './core/seo/seo.config';

/**
 * Which routes get turned into real .html files at build time.
 *
 * This is what makes social link previews work. Facebook, WhatsApp, iMessage,
 * LinkedIn, Discord and Slack do not execute JavaScript, so they never see the
 * per-route tags SeoService sets at runtime — they only read the HTML as served.
 * Prerendering bakes those tags into each page's HTML, so every URL gets its own
 * title, description and preview image.
 */
export const serverRoutes: ServerRoute[] = [
  {
    // Parameterised, so the values have to be enumerated at build time.
    // Derived from ABOUT_SEO so the two can never drift apart — adding a topic
    // there automatically prerenders it here.
    path: 'about/:page',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => Object.keys(ABOUT_SEO).map(page => ({ page }))
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
