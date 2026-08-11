import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

/**
 * Fetches a Cloudflare Turnstile token for a form submission.
 *
 * Turnstile is what lets the Worker tell a parent from a bot. The token is
 * issued only after Cloudflare has watched a real browser pass a background
 * challenge, and the Worker validates it server-to-server against a secret the
 * browser never sees. That is the difference between this and any value we
 * could generate ourselves: a token we mint proves nothing, because a bot can
 * mint one too.
 *
 * The script is loaded on demand rather than from index.html so it only costs
 * anything on the two pages that actually submit a form.
 *
 * Widgets are configured 'invisible' in the Cloudflare dashboard, so nothing is
 * rendered for the visitor — no checkbox, no puzzle, no layout shift.
 */

declare global {
  interface Window {
    turnstile?: {
      render(el: HTMLElement, opts: Record<string, unknown>): string;
      execute(id: string): void;
      reset(id: string): void;
    };
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// If Cloudflare has not answered by now, give up and submit without a token.
// The Worker fails open on a missing token from an allowed origin, so a real
// parent still gets through during an outage. Losing their message silently
// would be a worse failure than briefly letting spam past.
const TOKEN_TIMEOUT_MS = 6000;

@Injectable({ providedIn: 'root' })
export class TurnstileService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private scriptPromise: Promise<void> | null = null;
  private widgetIds = new WeakMap<HTMLElement, string>();

  /** Resolves with a token, or null if Turnstile is unavailable or unconfigured. */
  async getToken(container: HTMLElement | null | undefined): Promise<string | null> {
    if (!this.isBrowser || !container) return null;
    if (!this.isConfigured()) return null;

    try {
      await this.loadScript();
    } catch {
      return null;
    }

    const turnstile = window.turnstile;
    if (!turnstile) return null;

    return new Promise<string | null>((resolve) => {
      let settled = false;
      const finish = (token: string | null) => {
        if (settled) return;
        settled = true;
        resolve(token);
      };

      setTimeout(() => finish(null), TOKEN_TIMEOUT_MS);

      try {
        let widgetId = this.widgetIds.get(container);

        if (widgetId === undefined) {
          widgetId = turnstile.render(container, {
            sitekey: environment.turnstileSiteKey,
            size: 'invisible',
            execution: 'execute',
            callback: (token: string) => finish(token),
            'error-callback': () => finish(null),
            'timeout-callback': () => finish(null)
          });
          this.widgetIds.set(container, widgetId);
        } else {
          // A second submission in the same visit needs a fresh token; tokens
          // are single-use and expire within minutes.
          turnstile.reset(widgetId);
        }

        turnstile.execute(widgetId);
      } catch {
        finish(null);
      }
    });
  }

  private isConfigured(): boolean {
    const key = environment.turnstileSiteKey;
    return !!key && !key.startsWith('YOUR_');
  }

  private loadScript(): Promise<void> {
    if (this.scriptPromise) return this.scriptPromise;

    this.scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject());
        if (window.turnstile) resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }
}
