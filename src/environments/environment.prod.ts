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
  googleSheetUrl: 'https://script.google.com/macros/s/AKfycbxI9B3xhru5mSRTGfrJ7m2M_pb8gCUy3pnJ8N8IZvSEMEw3FkrlKDhedsOLUJXr4yGZxg/exec',
  waiverSheetUrl:  'https://script.google.com/macros/s/AKfycbxpXsJIaZcGoDpSzDJYFCy7n06PByPjkZUZy4Ye9HNuublgnCD05d6_949LKE7ClyQkLg/exec',
  // The contact and booking forms post to the Cloudflare Worker, not to Apps
  // Script. The Apps Script URL is deliberately absent from this file: it lives
  // only as a Worker secret so it cannot be read out of the bundle and POSTed to
  // directly, which is what let the form spam start. See worker/README.md.
  contactWorkerUrl:  'YOUR_WORKER_URL',
  turnstileSiteKey:  'YOUR_TURNSTILE_SITE_KEY'
};
