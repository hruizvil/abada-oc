import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
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
    // Client hydration is intentionally OFF. Adopting the prerendered DOM crashed
    // during hydration in Safari ("e.hasAttribute is not a function" — Angular hit
    // a non-element node), which left the whole app's event wiring dead: taps fired
    // but nothing responded. Rendering fresh on load avoids that entirely. Trade-off
    // is a brief first-paint flash; prerendered HTML is still served for SEO.
    { provide: TitleStrategy, useClass: SeoTitleStrategy }
  ]
};
