/**
 * WARNING: this file is not used by any build.
 *
 * angular.json has no `fileReplacements`, so nothing ever swaps this in — every
 * build, production included, uses environment.ts. That is why `production: true`
 * below never took effect, and why the localOnlyGuard on /musica never blocked
 * anyone: it read `environment.production`, got `false`, and let everybody in.
 *
 * Put real values in environment.ts, not here.
 */
export const environment = {
  production: true,
  // Every form posts to the Cloudflare Worker, never to Apps Script directly; the
  // Apps Script URLs live only as Worker secrets (see worker/wrangler.toml).
  contactWorkerUrl:  'YOUR_WORKER_URL',
  turnstileSiteKey:  'YOUR_TURNSTILE_SITE_KEY'
};
