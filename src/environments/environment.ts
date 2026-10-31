export const environment = {
  production: false,
  // Every form (contact, booking, waiver, questionnaire) posts to the Cloudflare
  // Worker, never to Apps Script directly. The Apps Script URLs live only as
  // Worker secrets so they cannot be read out of the bundle and POSTed to
  // directly, which is what let the form spam start. See worker/wrangler.toml.
  contactWorkerUrl:  'https://abadaoc-contact.capoeiraoc.workers.dev',
  turnstileSiteKey:  '0x4AAAAAAENZBzOwTb2xUjno',

  // Firebase (project "abada-oc", on Mosquito's Google account). These are the
  // public client config values — they are meant to ship in the browser bundle,
  // not secrets. Security is enforced by Firestore rules + Auth, never by hiding
  // these. The member area / class-card system uses Auth (Google) + Firestore.
  firebase: {
    apiKey:            'AIzaSyDdEsQqrfjZnwNPklDZNXQ2bJabLZ4A3ZI',
    authDomain:        'abada-oc.firebaseapp.com',
    projectId:         'abada-oc',
    storageBucket:     'abada-oc.firebasestorage.app',
    messagingSenderId: '642796635940',
    appId:             '1:642796635940:web:74e5342e830674dc7155b1'
  },

  // ABADA OC Payments web app (/exec). Safe to ship: checkout verifies a Firebase ID
  // token server-side and the webhook only acts on re-fetched Stripe events, so a
  // direct POST here does nothing (unlike the auth-less contact form that got spammed).
  paymentsUrl: 'https://script.google.com/macros/s/AKfycbxJBVaVZdjyVdkyMM5DDTN-fX5uFWr7mhHxVeQHGVfG907pprCa5xTEWYdo8JPCRhPNgA/exec',

  // Standalone Admin Data API (/exec) — separate from the legacy Command Center. Safe to ship:
  // it verifies a Firebase ID token + an email allow-list server-side before returning anything.
  adminDataUrl: 'https://script.google.com/macros/s/AKfycbzdUY8y-BFluHD4PRsi5JXCeUVV4PXzM6qx1sC4GocSDPEwlMWrKw1GHNWpGt4Mo87wkg/exec',

  // Early access for the member area. While `memberBeta` is true, only the emails below
  // (compared lower-cased) can use the member area; anyone else who signs in sees an
  // "under construction" page and NO account/profile is created for them. This is a soft
  // UI gate — member data is still protected by Firestore rules (own-data-only). Set
  // `memberBeta: false` to open the member area to everyone. Admins must be on this list too.
  memberBeta: true,
  memberAllowlist: [
    'capoeiraoc@gmail.com',            // Mosquito (studio / admin)
    'firstlight.tournament@gmail.com', // Hugo (admin)
    'luispc525@gmail.com'              // tester
  ]
};
