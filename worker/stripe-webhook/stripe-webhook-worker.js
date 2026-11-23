/**
 * Cloudflare Worker that receives Stripe webhooks for the payments Apps Script.
 *
 * Why it exists: an Apps Script web app answers every POST with a 302 redirect, and Stripe counts
 * anything but a 2xx as a failed delivery. Stripe then retries for days, emails about a failing
 * endpoint, and can eventually disable it — after which no purchase would credit anyone. Apps
 * Script also can't read request headers, so it can't check Stripe's signature.
 *
 * What it does, in order:
 *   1. Verifies the Stripe-Signature header (HMAC-SHA256, 5-minute tolerance) against the endpoint
 *      signing secret(s). Forged or stale requests get 400 and never reach Apps Script.
 *   2. Forwards the raw body to the Apps Script /exec URL and follows its redirect to read the reply.
 *   3. Answers Stripe 200 only if Apps Script replied "ok" (the event was handled). Otherwise 500,
 *      so Stripe retries — a failure is never hidden behind a fake success.
 * Every request is logged (Workers Logs; see wrangler.toml [observability]).
 */

const SIGNATURE_TOLERANCE_SECONDS = 300;

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const secrets = (env.STRIPE_WEBHOOK_SECRETS || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!secrets.length || !env.APPS_SCRIPT_URL) {
      log('error', 'not configured: STRIPE_WEBHOOK_SECRETS / APPS_SCRIPT_URL missing');
      return new Response('Not configured', { status: 500 }); // Stripe retries once it's fixed
    }

    const body = await request.text();
    const check = await verifyStripeSignature(body, request.headers.get('Stripe-Signature') || '', secrets);
    if (!check.ok) {
      log('warn', 'rejected: ' + check.reason);
      return new Response('Invalid signature', { status: 400 });
    }

    let eventId = '';
    let eventType = '';
    try {
      const evt = JSON.parse(body);
      eventId = evt.id || '';
      eventType = evt.type || '';
    } catch (e) {
      // Signed but unparseable is impossible from Stripe; Apps Script logs and ignores it anyway.
    }

    let status = 0;
    let reply = '';
    try {
      // POST, then follow Apps Script's 302 to its echo URL (fetch switches to GET), and read the reply.
      const res = await fetch(env.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        redirect: 'follow'
      });
      status = res.status;
      reply = (await res.text()).trim();
    } catch (err) {
      log('error', 'apps script unreachable', { eventId, eventType, error: String(err) });
      return new Response('Apps Script unreachable', { status: 502 });
    }

    if (status === 200 && reply === 'ok') {
      log('info', 'handled', { eventId, eventType });
      return new Response('ok', { status: 200 });
    }
    log('error', 'apps script did not confirm', { eventId, eventType, status, reply: reply.slice(0, 300) });
    return new Response('Apps Script did not confirm the event', { status: 500 });
  }
};

/**
 * Stripe signature scheme: header "t=<unix>,v1=<hex>[,v1=…]"; signed payload is "<t>.<raw body>",
 * HMAC-SHA256 with the endpoint secret (whsec_…). Accepts any configured secret (test + live).
 */
async function verifyStripeSignature(body, header, secrets) {
  const parts = header.split(',').map((p) => p.trim().split('='));
  const timestamp = (parts.find(([k]) => k === 't') || [])[1];
  const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!timestamp || !signatures.length) return { ok: false, reason: 'missing signature header' };

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!(age <= SIGNATURE_TOLERANCE_SECONDS)) return { ok: false, reason: 'timestamp outside tolerance' };

  const payload = new TextEncoder().encode(timestamp + '.' + body);
  for (const secret of secrets) {
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const expected = toHex(await crypto.subtle.sign('HMAC', key, payload));
    if (signatures.some((sig) => timingSafeEqual(sig, expected))) return { ok: true };
  }
  return { ok: false, reason: 'signature mismatch' };
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function log(level, message, details) {
  const line = JSON.stringify({ level, message, ...(details || {}) });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
