import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { TitleStrategy, provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { SeoTitleStrategy } from './core/seo/seo-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
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
