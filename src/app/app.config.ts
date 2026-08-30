import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { TitleStrategy, provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { SeoTitleStrategy } from './core/seo/seo-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Angular 21 is zoneless by default; the app relies on zone.js's automatic
    // change detection, so we opt back in. Without this, view updates after
    // events (nav, dropdowns, the booking form) silently failed in Safari.
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    // withFetch is required for prerendering: Node has no XMLHttpRequest, so the
    // default XHR backend cannot run during the server-side build.
    provideHttpClient(withFetch()),
    // Client hydration is intentionally OFF. Adopting the prerendered DOM crashed
    // during hydration in Safari ("e.hasAttribute is not a function" — Angular hit
    // a non-element node), which left the whole app's event wiring dead: taps fired
    // but nothing responded. Rendering fresh on load avoids that entirely. Trade-off
    // is a brief first-paint flash; prerendered HTML is still served for SEO.
    { provide: TitleStrategy, useClass: SeoTitleStrategy }
  ]
};
