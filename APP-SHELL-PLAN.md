# ABADÁ OC — App Shell + Admin Command Center migration

**Goal:** once someone logs in (member or admin), the site becomes an **app** — a shared
logged-in shell (left sidebar on desktop, bottom tab bar on mobile) with role-based
navigation. The admin side is the first real tenant: we bring the whole **Command Center**
(today an Apps Script page) into the site, and fold the member dashboard in as "Home".

Public/marketing site keeps its top nav for prospects; the shell takes over only inside the
logged-in area.

---

## 1. Current state (what we're building on)

**Angular app (`abada-oc-temp`)**
- `/member` — the member dashboard we just redesigned (hero balance, today's check-in, buy tabs, schedule).
- `/admin` — already a tabbed "Command Center" page (in-component tabs): **Overview** (cardholders, active cards, classes outstanding), **People**, **Roster**, **Catalog**. Gated in-component (non-admins bounced to `/member`). Components: `admin.component`, `admin-people`, `admin-roster`, `admin-catalog`, `admin.service`.
- Both render **inside the marketing chrome** (`header.component` top nav + footer).
- Auth: `auth.service` exposes `user()` + `role()`; `members/{uid}.role === 'admin'`.
- Already in **Firestore**: members, cards, catalog, reservations/**attendance (check-ins)**.

**Existing Command Center (`apps-script/command-center/Code.js`)** — a *read-only aggregator*, gated by a Google email allow-list, that reads three Sheets and links to Drive. Tabs:
- **Overview** — stats (trials this week / today / missing waivers / new questionnaires), upcoming trial classes, recent activity feed.
- **Questionnaire** — searchable student list + rich per-student response.
- **Waivers** — missing-waivers list + signed table (Adult/Minor) with *Open in Drive*.
- **Follow-ups** — post-trial follow-up + email/text reminder stats, sequence status, recent message activity.
- **Tools** — link grid (booking form, schedule, reviews, sheets, Drive, questionnaire form, website).

**Data sources (Sheets, not owned by the app):**
- `ABADA OC Bookings` — trials: name, classtime, phone, email, interestedin, submittedat, email/sms reminder stamps.
- `ABADA OC Waivers` — name, apelido, email, minor, agreed-at, PDF link, followup1/2 stamps.
- `Questionnaire Responses` — positional rows → the folded per-student dashboard.

The whole payload is already computed by `buildData_()` — **we can reuse that logic wholesale.**

---

## 2. Target architecture

### Shell
- A **logged-in layout** component wrapping member + admin routes: top bar (logo, "as of" time, avatar → account/sign-out), **sidebar (desktop)** / **bottom tab bar (mobile)**, content outlet. Hides the marketing header/footer while inside.
- **Role-based nav** from `auth.role()`: members see a short list; admins see the console.
- Keep URLs `/member/*` and `/admin/*` (simpler than a new `/app/*`), rendered inside the shell layout. Admin in-page tabs become **child routes** (`/admin/overview`, `/admin/waivers`, …) so each section is linkable and the sidebar drives them.
- Gate with **route guards** (canActivate: signed-in for `/member`, admin for `/admin`), lazy-loaded so Firebase ships only to the logged-in area.

### Data strategy (two stages — deliberate, not a band-aid)
- **Stage A — aggregate bridge (now):** add a **token-gated JSON endpoint** to the Command Center Apps Script that returns `buildData_()`. Angular's admin reads it and renders the sections. Reuses all existing logic; the Sheets stay the source; gets **everything in** fast.
  - Auth: switch the endpoint to `executeAs USER_DEPLOYING` (owner, so it can read the owner's Sheets) and **verify a Firebase ID token + admin role** on each call (reuse the payments project's `verifyIdToken_` pattern) — replacing the Google email allow-list.
  - CORS: Apps Script can't set CORS headers, so route the read through the existing **Cloudflare Worker** (adds CORS + forwards the Firebase token). Fallback: hidden-iframe + postMessage (same trick as checkout).
- **Stage B — converge to Firestore (incremental, later):** migrate pipelines so the app owns its data and is real-time, then retire the Sheets/aggregator:
  - Booking form → Firestore `trials`; waiver form → `waivers` (+ PDF stays in Drive, link stored); questionnaire → `questionnaires`.
  - Members/cards/attendance already in Firestore.
  - The reminder/follow-up Apps Script keeps running; it either keeps writing stamps we read, or also moves to Firestore.

---

## 3. Navigation map

**Member:** Home (dashboard) · Schedule · Buy (packages/memberships) · Account
**Admin:** Overview · Trials · Waivers · Questionnaires · Follow-ups · Members · Roster / Check-ins · Catalog · Tools · Account

Mapping Command Center → shell admin sections:
| Command Center tab | New admin section | Source (Stage A) |
|---|---|---|
| Overview | **Overview** (merge with existing cardholders/active-cards/classes-outstanding) | CC JSON + Firestore |
| — (trials inside Overview) | **Trials** (upcoming + bookings, waiver flag, contact) | CC JSON (Bookings) |
| Questionnaire | **Questionnaires** | CC JSON (Responses) |
| Waivers | **Waivers** (missing + signed, Open in Drive) | CC JSON (Waivers) + Drive |
| Follow-ups | **Follow-ups** | CC JSON |
| Tools | **Tools** (link grid) | static + CC links |
| (existing Angular) | **Members / Roster-Check-ins / Catalog** | Firestore |

---

## 4. Phases

**Phase 1 — The shell (no new data).**
- Logged-in layout component (sidebar + mobile tabs + top bar), hide marketing chrome inside.
- Convert `/admin` in-page tabs → child routes; `/member` becomes Home within the shell.
- Role-based nav + route guards. Move existing screens in untouched.
- *Deliverable:* same features, new frame, works on desktop + mobile.

**Phase 2 — Bring in the Command Center (Stage A).**
- Add token-gated JSON endpoint to `command-center` Apps Script (reuse `buildData_()`); switch gating to Firebase admin token; expose via the Worker.
- `admin-data.service` in Angular; build sections: **Overview** (enriched), **Trials**, **Waivers**, **Questionnaires**, **Follow-ups**, **Tools**.
- *Deliverable:* everything from the Apps Script Command Center, now inside abadaoc.com under the shell.

**Phase 3 — Check-in / roster tools.**
- Admin **Today's roster** + **check-in history** from Firestore attendance; **undo check-in** (refund credit).

**Phase 4 — Converge to Firestore (Stage B, incremental, optional).**
- Migrate booking / waiver / questionnaire pipelines to Firestore; retire Sheets + aggregator over time.

**Phase 5 — Polish.**
- Mobile pass (375/768/…); empty states; decide on profile extras (belt rank, "student since" — needs real data or skip); optional PWA for an installed feel.

---

## 5. Key decisions (recommendations)
- **URLs:** keep `/member` + `/admin` inside the shell (not a new `/app/*`).
- **Gating:** promote to route guards (member = signed-in, admin = admin role).
- **CC data:** Stage A aggregate via a Firebase-token-gated JSON endpoint behind the Worker; converge to Firestore later.
- **Schedule/Events:** link out to the existing marketing pages at first; in-app versions later if wanted.
- **Profile extras** (belt rank, student-since): skip in v1 unless we decide to capture that data.

---

## 6. Risks / notes
- Sheets stay the source in Stage A → admin data is as fresh as the Sheets + has Apps Script latency; fine for an internal console.
- Student **PII** (phones, waivers) must stay behind the admin gate end-to-end (token-checked endpoint, not the old email allow-list, not public).
- HMR drops event listeners on this Angular build — restart the dev server when verifying handlers (see team notes).
- Don't deploy to abadaoc.com without an explicit ask (main auto-deploys).
