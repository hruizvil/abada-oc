# ABADÁ-Capoeira OC — SEO Plan

Living document. Created 2026-08-08.

**Site:** https://abadaoc.com · Angular 21 standalone SPA, client-rendered, GitHub Pages
**Location:** 8552 Warner Ave, Fountain Valley, CA 92708
**Contact:** capoeiraoc@gmail.com · (562) 340-9801 · Professor Mosquito
**Goal:** more free-trial bookings via `/book`

---

## The one framing fact

Google's local results rank by **physical proximity to the searcher**. The studio is in
**Fountain Valley**, not "Orange County" generically. Someone in Irvine searching
"capoeira near me" will not see us regardless of SEO quality.

Realistic catchment: Fountain Valley, Huntington Beach, Westminster, Garden Grove,
Costa Mesa, Santa Ana.

Target those city names. Not "Orange County," not bare "capoeira."

---

## Division of labor

| Claude can do | Hugo must do (account access / real-world) |
|---|---|
| Steps 1–4, 6 below (all in-repo) | Steps A–E below (GBP, reviews, Search Console, citations) |

**The human-only items are higher value than the code items.** That is not a dodge —
for a single-location studio the map pack outranks the website for local intent, and
photos + review velocity drive the map pack. Code work makes everything else work
properly; it does not substitute for a claimed, well-fed Google Business Profile.

---

## Code track (Claude)

### ✅ Step 1 — Per-route titles + meta descriptions + Open Graph — **DONE, not deployed**
**~3 hrs · one-time · HIGH value**

Unique `<title>` and `<meta name="description">` per route, driven by route config.
Also sets canonical, Open Graph, and X card tags at runtime.

(The X tags are still named `twitter:card` / `twitter:title` etc. — the namespace was
never renamed after the rebrand and there is no `x:` equivalent. Leave them alone.)

Fixes: all 12 routes currently share `ABADÁ-Capoeira OC` with no description, so
every search result looks identical and generic.

Caveat: runtime tags work for Google (it runs JS) but **not** for social preview
crawlers (they don't). Social previews need Step 4.

- [x] `src/app/core/seo/seo.model.ts` — page metadata interface
- [x] `src/app/core/seo/seo.config.ts` — copy for all 11 routes + 7 `/about/:page` topics
- [x] `src/app/core/seo/seo.service.ts` — sets title/description/canonical/OG/Twitter
- [x] `src/app/core/seo/seo-title.strategy.ts` — hooks into router navigation
- [x] wire into `app.config.ts`, add `data.seo` to `app.routes.ts`
- [x] `/about/:page` resolves its own metadata (`data.seoDynamic`)
- [x] sitewide fallback description + OG tags in `index.html`
- [x] `noindex` on `/waiver` and `/musica`

**Done 2026-08-08, on `feature/seo`. Not deployed.** Verified in the browser across
all 12 routes: unique title, description and canonical on each; `noindex` on
`/waiver`, correctly cleared when navigating away; `/about/:page` resolves per topic;
exactly one canonical tag after repeated navigation; no console errors; build clean.

⚠️ **Regression history — read before refactoring.** `data: { seo: … }` in
`app.routes.ts` is what feeds all of this. During the git/production reconciliation
that file was reverted to its production state and the route data was lost. Nothing
failed loudly — the build passed and the app ran — but every page fell back to the
site default, including `<link rel="canonical" href="https://abadaoc.com/">` on all
of them, which tells Google the entire site is duplicates of the homepage. That is
strictly worse than shipping no tags at all.

If `app.routes.ts` is ever touched, re-run the browser check over every route. A
green build proves nothing here.

**All page copy lives in `seo.config.ts`** — edit it freely, it's marketing text, not
logic. Titles under ~60 chars, descriptions 140–160.

Also added `.claude/launch.json` so the dev server can be started for verification.

### ✅ Step 2 — robots.txt + sitemap.xml + LocalBusiness JSON-LD — **DONE, not deployed**
**~3 hrs · one-time · MODERATE value**

- [x] `public/robots.txt` — allows everything, points at the sitemap
- [x] `public/sitemap.xml` — 16 URLs (9 top-level + 7 `/about/:page` topics),
      excludes `/waiver` and `/musica`
- [x] `SportsActivityLocation` JSON-LD in `index.html`: name, address, phone, email,
      hours, `areaServed`, `sameAs`, free-trial `Offer`, 4-service `OfferCatalog`
- [ ] **Hugo: confirm the address/phone match the Google Business Profile exactly**

`public/` is copied to the site root at build time, so these serve as
`/robots.txt` and `/sitemap.xml`. Verified: both return 200 with correct MIME
types, and the JSON-LD parses.

Two deliberate choices:
- **robots.txt does NOT disallow `/waiver` or `/musica`.** They use `noindex` meta
  instead. Disallowing would stop crawlers fetching the page, so they would never
  read the `noindex` — and Google can still list a blocked URL it has never seen.
- **`geo` coordinates are omitted, not guessed.** The GBP listing places the map pin;
  an invented lat/long would contradict it.

⚠️ **Closing times in the JSON-LD are assumptions.** Class START times come from
`assets/data/schedule.json`; each class was assumed to run about an hour. Fix the
`closes` values if that is wrong — and they should agree with GBP.

### ✅ Step 3 — Heading cleanup — **DONE, not deployed**
**~1 hr · one-time · LOW value**

- [x] duplicate `<h1>` — the header brand name is now
      `<span class="brand-name">`, so each page has exactly one `<h1>`
- [x] ~~2 of 8 `<img>` tags missing `alt`~~ — **this was wrong.** All 8 have `alt`;
      two use Angular's `[alt]="…"` property binding, which the original audit regex
      did not recognise. No change needed.
- [ ] wildcard route redirects to home (soft 404) — still open, very low priority

The `<h1>` swap is semantics only. `.brand-name` carries `display: block` so the
tagline still sits on its own line; verified in-browser that computed font-size,
weight and layout are unchanged, and that `/classes` now reports exactly one `<h1>`
("Our Programs") instead of two.

### ⬜ Step 4 — Prerendering (`@angular/ssr` static generation)
**~1–2 days · one-time + light upkeep · STRUCTURAL**

Generate real `.html` per route at build time. GitHub Pages serves them directly.

Fixes, and is the **only** thing that fixes:
- social link previews (Facebook / WhatsApp / iMessage / LinkedIn / Discord / Slack)
- AI crawler visibility (most don't run JS)
- indexing latency, Bing/DuckDuckGo, the 404.html redirect dance

Known costs before starting:
- add `@angular/ssr`
- `about/:page` needs its param values enumerated at build time
- `/musica` must be excluded (it's behind `localOnlyGuard`)
- anything touching `window` / `localStorage` / `signature_pad` at construction
  time will break the build until guarded
- the `deploy` script changes (`dist/` is gitignored; `ng deploy` pushes the build
  output to the `gh-pages` branch, so **the deploy always reflects the working tree
  on disk, not what is committed**)

**Decide after one month of Search Console data.** If traffic is overwhelmingly
map-pack, spend those two days on Step 5 instead.

### ⬜ Step 5 — Split `/classes` into real landing pages
**~2 hrs per page · ongoing · HIGHEST CEILING**

`/classes` currently serves kids, adults, and families from one page. Those are
three different searches and three different readers.

- [ ] `/classes/kids` → "kids martial arts fountain valley", "after school huntington beach"
- [ ] `/classes/adults` → "adult martial arts classes near me"

This is the only code item that can win searches we don't rank for **at all**.
It is writing, not coding — needs Hugo's voice and real details.

Do **not** mass-produce city-swapped pages (`/capoeira-westminster` etc.).
Google penalizes that explicitly.

### ⬜ Step 6 — Proper Open Graph image
**~30 min · one-time**

- [ ] 1200×630 JPG, action shot, `public/assets/images/og-default.jpg`
- currently falls back to the logo PNG, which crops badly in previews

---

## Human track (Hugo) — do these first, they're worth more

### ⬜ A — Google Business Profile *(~3 hrs, then ~20 min/month)* 🥇
Claim it. Category `Martial arts school`, secondary `Sports club`. Hours
(Mon–Thu evenings, Sat mornings). Phone (562) 340-9801. **Website link → `abadaoc.com/book`,
not the homepage.** 20+ real photos — kids' class, adult class, a roda, instruments,
the space, Professor Mosquito. Seed the Q&A: "Do you offer a free trial?",
"What age can kids start?", "Do I need experience?", "What should I wear?"
Google Posts every couple weeks.

Photo count and review velocity are among the strongest map-pack ranking factors.

### ⬜ B — Review engine *(~2 hrs setup, then continuous)* 🥈
In-person ask after a student's first month + direct Google review link texted
immediately. QR code by the door. Target 1–2/month sustained. Reply to every one.
**Never buy reviews or trade discounts for them** — that gets listings suspended.

### ⬜ C — Google Search Console *(30 min, one-time)*
Verify `abadaoc.com` via DNS TXT record. Submit the sitemap once Step 2 ships.

GA4 (`G-4J3ZPPVWS8`) is already installed but only reports what people do *after*
arriving. Search Console reports *how they found us* — the actual question.
Nothing to read for ~a month, so start the clock early.

### ⬜ D — Apple Maps Business Connect *(30 min, one-time)*
Every iPhone "near me" search. Same name/address/phone as GBP, **byte-identical**.

### ⬜ E — Citations *(~3 hrs, one-time, verify yearly)*
Bing Places, Yelp, Facebook, then capoeira directories, the ABADÁ global org site,
local parenting Facebook groups, city rec listings.

Rule: name/address/phone identical everywhere and identical to the site footer.
Mismatches actively hurt. **Skip paid citation-blasting services.**

---

## Traps — do not spend time here

| Trap | Why |
|---|---|
| Chasing "capoeira" / "capoeira orange county" | Brings people who won't drive to Warner Ave |
| A blog / "History of Capoeira" posts | Competes with Wikipedia; readers are in Brazil |
| PageSpeed perfectionism (85 → 98) | Tiebreaker, not a lever |
| Backlink building / guest posts | Near-irrelevant to the map pack |
| Paid SEO tools ($100+/mo) | Built for 1000-keyword sites; we have ~15 |
| Anyone cold-calling selling SEO | The honest answer is GBP + reviews, and it's free |
| AI-generated city-swap pages | Explicitly penalized |
| Rebranding harder around "Orange County" | Proximity beats branding |

**Meta-trap:** total monthly search volume for capoeira in this area is likely low
hundreds at best. SEO here is a **capture** channel, not a growth channel — it makes
sure people already looking for us can find and book. Growth comes from school demos,
the batizado, referrals, and Instagram.

---

## Order of operations

1. **Hugo, one afternoon:** A → C → D (GBP, Search Console, Apple Maps)
2. **Claude:** Step 1 → Step 2 + 3
3. **Wait ~1 month** for Search Console data
4. **Then decide:** Step 4 (prerender) vs Step 5 (landing pages)
5. **Ongoing:** B (reviews), GBP posts

Deploys are always Hugo's call — `npm run deploy` is never run by Claude.
