export const environment = {
  production: false,
  googleSheetUrl: 'https://script.google.com/macros/s/AKfycbxI9B3xhru5mSRTGfrJ7m2M_pb8gCUy3pnJ8N8IZvSEMEw3FkrlKDhedsOLUJXr4yGZxg/exec',
  waiverSheetUrl:  'https://script.google.com/macros/s/AKfycbxpXsJIaZcGoDpSzDJYFCy7n06PByPjkZUZy4Ye9HNuublgnCD05d6_949LKE7ClyQkLg/exec',
  // Natural Potential Discovery questionnaire — posts directly to its own Apps
  // Script (waiver pattern), which appends to the "Questionnaire Responses" sheet.
  questionnaireSheetUrl: 'https://script.google.com/macros/s/AKfycbyAGqpMWer2xiJ9mM-h_gFBltexh9hbiWiXX2hrhNRwI2lphsBQWoL9R6E4_3GZULc/exec',
  // The contact form posts to the Cloudflare Worker, not to Apps Script. The
  // Apps Script URL is deliberately absent from this file: it lives only as a
  // Worker secret so it cannot be read out of the bundle and POSTed to directly,
  // which is what let the form spam start. See worker/README.md.
  contactWorkerUrl:  'https://abadaoc-contact.capoeiraoc.workers.dev',
  turnstileSiteKey:  '0x4AAAAAAENZBzOwTb2xUjno'
};
