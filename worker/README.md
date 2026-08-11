# Contact / booking form Worker

Sits between the site's forms and the Apps Script that emails Professor Mosquito.

## Why it exists

The site is static, so it has no server of its own. That meant the Apps Script URL
had to ship inside the JavaScript bundle, where anyone could read it and POST to it
forever without ever loading the site. That is how the form spam started.

Apps Script cannot see the caller's IP address or request headers, so it had no way
to tell a parent from a bot — only to guess from the text. This Worker is a real
server-side layer that can check *behaviour* instead of guessing, and it rejects
submissions **before any email is sent**, which protects the ~100 emails/day Gmail
quota that real inquiries depend on.

## Setup

Do these in order. Steps 1–4 change nothing on the live site.

### 1. Cloudflare account

Sign up at <https://dash.cloudflare.com/sign-up>. Free tier is enough — Workers
allows 100,000 requests/day and Turnstile is unlimited up to 20 widgets. No card.

### 2. Create the Turnstile widget

Dashboard → **Turnstile** → **Add widget**.

- Hostname: `abadaoc.com` (add `www.abadaoc.com` too)
- Widget mode: **Invisible**

Copy both keys:

| Key | Goes | Public? |
|---|---|---|
| **Site Key** | `src/environments/environment*.ts` | Yes — safe in the bundle |
| **Secret Key** | Worker secret, step 5 | **No — never commit** |

### 3. Create a new Apps Script deployment

In the Apps Script editor: **Deploy → New deployment**. This produces a *new* `/exec`
URL.

**This causes no downtime.** Apps Script runs deployments side by side — the old URL
keeps serving the live site until you explicitly archive it, which happens last, in
step 8. Nothing breaks in between, and the old URL stays available as a fallback if
anything goes wrong during cutover.

> Close the Apps Script editor tab afterwards — an open tab can autosave stale code
> over a `clasp push`.

### 4. Deploy the Worker

From this directory:

```bash
npx wrangler login
npx wrangler deploy
npx wrangler secret put TURNSTILE_SECRET   # paste the Secret Key from step 2
npx wrangler secret put APPS_SCRIPT_URL    # paste the NEW /exec URL from step 3
```

Wrangler prints the Worker URL, e.g. `https://abadaoc-contact.<subdomain>.workers.dev`.

You can do all of this in the dashboard instead — Workers → Create → paste
`contact-worker.js`, then Settings → Variables → add both as **encrypted**.

### 5. Point the site at it

In **both** `src/environments/environment.ts` and `environment.prod.ts`:

```ts
contactWorkerUrl:  'https://abadaoc-contact.<subdomain>.workers.dev',
turnstileSiteKey:  '0x4AAA...'
```

Until these are filled in, the forms still show their success screen but send
nothing — the same guard the codebase already used for unset endpoints.

### 6. Deploy the site

`npm run deploy`, when you're ready. That's your call, not a step to run blind.

Until `contactWorkerUrl` is set, both forms show their success screen and send
nothing — so do not deploy ahead of step 5, or real inquiries are dropped silently.

### 7. Test a real submission

Submit the contact form on the live site and confirm the email arrives. Watch it
happen with `npx wrangler tail`. Do not proceed until this passes — the old URL is
still your fallback.

### 8. Archive the old Apps Script deployment

Apps Script editor → **Deploy → Manage deployments** → archive the *old* one.

**This is the step that actually closes the hole.** The old URL is the one that has
been scraped; while it is live the bot reaches Apps Script directly, bypassing the
Worker and Turnstile entirely, and nothing else in this document matters.

Leaving it until last means there is no window where the forms are broken.

Archiving is also reversible — versioned deployments cannot be deleted, only
archived, and an archived one can be restored from **Manage deployments →
Archived → pencil → Deploy**. So this step is recoverable too if anything
unexpected turns up after cutover.

## Not doing: spam subject tagging

The Worker forwards a `suspectedSpam` boolean, but nothing acts on it. Turnstile
catches effectively everything, so the letters-free-message heuristic is redundant
in practice and the Apps Script change and Gmail filter were dropped.

The flag still arrives, so if spam ever gets through — most plausibly during a
Cloudflare outage, when the Worker fails open — the hook is already there:

```js
const subject = data.suspectedSpam
  ? `[possible spam] New Contact Inquiry — ${data.name}`
  : `New Contact Inquiry — ${data.name}`;
```

Pair that with a Gmail filter on `Subject: [possible spam]` → Skip Inbox, Apply
label. Never "Delete it" — a mis-flagged inquiry has to stay recoverable.

Note that the extra `suspectedSpam` field reaches Apps Script either way. If it
writes named columns you will not notice; if it iterates over keys, expect a new
column in the Sheet.

## How it decides

| Check | Failure | Why |
|---|---|---|
| Origin not allowed | **403** | Cheap filter. Forged by one curl flag, so it only stops careless bots. |
| Honeypot filled | **200, dropped** | Only automation fills an off-screen field. Returns success so the bot learns nothing. |
| Turnstile invalid | **403, no email** | Cryptographic proof. Cloudflare only issues a token after watching a real browser pass a challenge. |
| Turnstile unreachable | **allowed through** | Fails *open* — see below. |
| Message has no letters | forwarded, flagged | A guess, not proof. Stays recoverable. |

The split matters: **proof drops, guesses flag.** Silently binning a real family's
message is far worse than one spam email arriving.

## Fail open vs fail closed

If Cloudflare's verification API is unreachable, the Worker lets the submission
through. The site shows "Message received!" without waiting for a response, so
failing closed during an outage would lose a real inquiry with no trace on either
end — the visitor thinks it sent, and nobody is told otherwise.

To reverse that trade, in `contact-worker.js` treat `'unavailable'` the same as
`'failed'`.

## Watching it work

```bash
npx wrangler tail
```

Streams live requests. Failed forwards to Apps Script are logged here and nowhere
else — it's the only warning you'd get that inquiries are being lost.

## Still exposed

`/waiver`, `/join` and `/events` still post directly to their own Apps Script URLs,
which still ship in the bundle:

| Form | Endpoint |
|---|---|
| `/waiver` and `/join` | share one deployment |
| `/events` | its own |

They have the same weakness, just no bot has found them yet. The Worker already
allowlists `formType`, so extending it is mostly adding the field lists.
