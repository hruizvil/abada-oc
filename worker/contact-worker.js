/**
 * Cloudflare Worker that sits in front of the contact-form Apps Script.
 *
 * The site used to POST straight to the Apps Script URL, which meant that URL
 * shipped inside the JavaScript bundle and anyone could read it out and POST to
 * it forever. That is how the form spam started. Apps Script cannot see the
 * caller's IP or request headers, so it had no way to tell a parent from a bot.
 *
 * This Worker is the layer that can. It holds the Apps Script URL as a secret,
 * so the browser never sees it, and it rejects submissions before any email is
 * sent — which also keeps spam from eating the ~100 emails/day Gmail quota that
 * real inquiries depend on.
 *
 * Three checks, in increasing order of strength:
 *   1. Origin      — cheap, stops lazy bots. Trivially forged by a script.
 *   2. Turnstile   — cryptographic. Cloudflare issues the token only after
 *                    watching a real browser pass a challenge, and validates it
 *                    here against our secret. This is the one that actually works.
 *   3. Content     — a conservative sanity check, kept deliberately narrow.
 *
 * A Turnstile failure is proof, so those are dropped outright and never emailed.
 * A content failure is only a guess, so those are forwarded with a flag and the
 * Apps Script can tag the subject line. Guesses must stay recoverable: silently
 * binning a real family's message is far worse than one spam email arriving.
 */

const ALLOWED_ORIGINS = [
  'https://abadaoc.com',
  'https://www.abadaoc.com'
];

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const ALLOWED_FORM_TYPES = ['contact', 'booking'];

// Anything longer than this is not a person filling in a contact form.
const MAX_FIELD_LENGTHS = {
  name: 100,
  phone: 40,
  email: 254,
  message: 5000
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return preflightResponse(origin);
    }

    if (request.method !== 'POST') {
      return new Response('Not found', { status: 404 });
    }

    // --- Check 1: Origin -----------------------------------------------------
    // A browser will not let page JavaScript forge this, so it stops one site
    // from posting through a visitor's browser. A curl script sets it freely,
    // so this is a filter for the careless majority, not a real gate.
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return jsonResponse({ ok: false, error: 'origin_not_allowed' }, 403, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: 'invalid_json' }, 400, origin);
    }

    // Honeypot. The form renders a hidden field no human can see or tab into,
    // so anything that fills it is automated. Costs nothing to check.
    if (body.website) {
      return jsonResponse({ ok: true }, 200, origin);
    }

    // --- Check 2: Turnstile --------------------------------------------------
    const clientIp = request.headers.get('CF-Connecting-IP');
    const verdict = await verifyTurnstile(body.turnstileToken, clientIp, env.TURNSTILE_SECRET);

    if (verdict === 'failed') {
      // Proven bot. Never reaches Apps Script, so no email and no quota spent.
      return jsonResponse({ ok: false, error: 'challenge_failed' }, 403, origin);
    }
    // verdict === 'unavailable' means Cloudflare itself did not answer. We fail
    // OPEN and let the submission through. The site shows "Message received!"
    // without waiting for us, so failing closed during an outage would lose a
    // real inquiry with no trace on either end. A short spam window is cheaper.
    // Flip this to a 403 if that trade ever stops being worth it.

    // --- Check 3: Content ----------------------------------------------------
    const suspectedSpam = looksLikeSpam(body);

    // --- Forward -------------------------------------------------------------
    // Both /contact and /book post here. They share one Apps Script deployment,
    // which branches on formType, so this Worker has to carry both shapes — and
    // both pages have to route through it. If either one kept posting straight
    // to Apps Script, that URL would still ship in the bundle and none of the
    // above would matter.
    if (!ALLOWED_FORM_TYPES.includes(body.formType)) {
      return jsonResponse({ ok: false, error: 'unknown_form_type' }, 400, origin);
    }

    const payload = {
      formType:    body.formType,
      name:        truncate(body.name, MAX_FIELD_LENGTHS.name),
      phone:       truncate(body.phone, MAX_FIELD_LENGTHS.phone),
      email:       truncate(body.email, MAX_FIELD_LENGTHS.email),
      submittedAt: body.submittedAt || new Date().toISOString(),
      suspectedSpam
    };

    if (body.formType === 'contact') {
      payload.message = truncate(body.message, MAX_FIELD_LENGTHS.message);
    } else {
      payload.interestedIn   = truncate(body.interestedIn, MAX_FIELD_LENGTHS.name);
      payload.firstClassSlot = truncate(body.firstClassSlot, MAX_FIELD_LENGTHS.name);
      payload.comments       = truncate(body.comments, MAX_FIELD_LENGTHS.message);
    }

    try {
      const upstream = await fetch(env.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!upstream.ok) {
        // The visitor already saw a success screen, so surfacing this to them is
        // not an option. Log it instead — `wrangler tail` shows these live, and
        // it is the only warning you would get that inquiries are being lost.
        console.error('Apps Script rejected the forward', upstream.status);
      }
    } catch (err) {
      console.error('Apps Script unreachable', err);
    }

    return jsonResponse({ ok: true }, 200, origin);
  }
};

/**
 * Asks Cloudflare whether this token is one it issued, for our site, just now.
 *
 * Returns 'passed' | 'failed' | 'unavailable'. The third case is deliberate:
 * "we could not ask" is a different situation from "the answer was no", and the
 * caller treats them differently.
 */
async function verifyTurnstile(token, clientIp, secret) {
  if (!token) return 'failed';

  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (clientIp) form.append('remoteip', clientIp);

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(5000)
    });

    if (!res.ok) return 'unavailable';

    const outcome = await res.json();
    return outcome.success ? 'passed' : 'failed';
  } catch {
    return 'unavailable';
  }
}

/**
 * Deliberately narrow. The only rule here is one that cannot plausibly fire on
 * a real message: a message containing no letters at all.
 *
 * The spam that prompted this had "9838643988" as its entire message. Note that
 * the fake NAMES are not checked — "Jyrorqnr" reads as gibberish to a human but
 * every mechanical test for it also flags real Brazilian and Portuguese names,
 * and it would not even have caught this one. Turnstile handles the bots; this
 * only catches the residue.
 */
function looksLikeSpam(body) {
  const message = String(body.message || '');
  return message.trim().length > 0 && !/\p{L}/u.test(message);
}

function truncate(value, max) {
  return String(value ?? '').slice(0, max);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function preflightResponse(origin) {
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
  });
}
