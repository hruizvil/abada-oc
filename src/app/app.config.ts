import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
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
    // Reuses the prerendered HTML instead of throwing it away and re-rendering.
    // Without this, every page load painted the prerendered content, wiped it,
    // then rebuilt it — the visible flash on refresh.
    provideClientHydration(),
    { provide: TitleStrategy, useClass: SeoTitleStrategy }
  ]
};
