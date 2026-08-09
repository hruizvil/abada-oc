# ORCHESTRATION PLAN — Twilio SMS reminders for Abada OC booking form

## ⏸️ RESUME HERE (status as of 2026-08-07)

### Confirmed backend layout (verified in the console, capoeiraoc@gmail.com)
Three Apps Script projects, NOT one:

| Project | Script ID | Role |
|---|---|---|
| ABADA OC Registration | `1kOm4dgk0DIiaAj6zplAesWPna7SV3CdjUzYCI_by00OL8vY1ER_K0jsj` | booking + contact forms. **This is the one to change.** |
| ABADA OC Waivers | (not needed) | waiver + join forms — leave alone |
| ABADA OC Shared | `1QV4X78lJYZw3TRm-3NfxCpsvdixAhu5mccoDxfXYi8VmyF-pebUb32Yd` | library `ABADAOCShared`, 17 lines: branding consts + `emailFooter()` |

Registration's active deployment is `AKfycbzU7NQZ6DuOyYPmv0dqLnZkRPg205L8Bg…`,
Version 9 — an exact match for `environment.contactSheetUrl`. Edit this
deployment to a new version; never create a new one or the URL changes.

### ❗ Plan assumption that turned out to be WRONG
This doc previously said "Apps Script appends a Sheet row and already sends a
confirmation email." Only the email half is true. **No project touches
`SpreadsheetApp` at all** — `handleBooking` builds two HTML templates, emails
admin + attendee, and that is the whole flow. Despite the name
`contactSheetUrl`, there is no sheet anywhere.

This matters because a reminder sent 24h before class needs the booking to
still exist 6–13 days after submission. `reminderSent`, the 24h scan, and the
30-day dedupe all require persistence. Adding a store is a prerequisite, not
a nice-to-have.

### Decisions taken (user, 2026-08-07)
- **Storage:** new "ABADA OC Bookings" spreadsheet, created by
  `setupBookingsSheet()`, id kept in Script Property `BOOKINGS_SHEET_ID`.
- **Send policy:** auto-send, guarded. No per-booking approval step.

### Progress
- **Step 1 (Angular): DONE.** `book.component.ts` has `toE164()`, the payload
  carries `phone` (E.164), `phoneRaw` (as typed, so admin emails still read
  naturally) and `smsConsent`; `book.component.html`/`.scss` have the consent
  checkbox. `npm run build` passes. Verified in-browser: checkbox present,
  unchecked by default, not required. Normalization + NANP guard unit-checked
  across 14 inputs. NOT committed — repo has unrelated uncommitted work.
- **Step 3 (Apps Script): code written, not yet uploaded.** Full
  `Reminders.gs` lives at `../apps-script/registration/Reminders.gs`. Guard
  chain simulated against 11 synthetic rows; all skips/sends correct, cap
  halts correctly.
- **Twilio (Part C):** trial account exists. **Account SID and auth token are NOT
  recorded here** — they belong in Apps Script Script Properties
  (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`), never in this repo. GitHub push
  protection blocks commits containing the SID. Still TODO: trial FROM number in
  +1 form, own cell as Verified Caller ID, and for real customers the upgrade +
  A2P 10DLC brand/campaign (days-long approval).

### ✅ WORKING END TO END (2026-08-07)
A real reminder text was received on +17145520156. Everything below is done:
Angular form → E.164 + smsConsent → doPost → bookings sheet → guard chain →
Twilio → phone. Deployment `AKfycbzU7NQZ…` is at @10, same URL as before.
Apps Script source now lives in git at `../apps-script/registration/`.

Two bugs were found and fixed during verification, both worth remembering:
1. **Sheets ate the leading `+`.** Writing '+17145520156' made Sheets evaluate
   it as arithmetic and store the number 17145520156. Every row then failed
   NANP_RE with "not a valid US/Canada number" — silently, forever, including
   real bookings. Fixed by `phoneFromCell_()` on every read plus forcing the
   phone columns to text on write.
2. **The web editor clobbers `clasp push`.** Twice, an Apps Script editor tab
   left open on a stale copy autosaved over a fresh push and silently reverted
   the file (once adding a `Sa text` typo that gave it away). ALWAYS reload or
   close the editor tab before pushing, and re-clone to verify afterwards.

### ⏭️ REMAINING WORK
1. Confirm exactly-once: run `sendClassReminders` again; row 2 must say
   "already sent" and nothing may re-send.
2. `clearTestRows()` to delete the seven seeded rows.
3. Upgrade Twilio off trial, then DELETE the `TWILIO_TEMPLATE` script property
   — while it exists every customer gets Twilio's canned wording instead of
   `reminderBody_()`. The code logs loudly on each send while it is set.
4. Twilio console hardening at upgrade time (Step 0 items 5–7): Geo
   Permissions US/CA only, auto-recharge OFF, low balance, usage trigger.
5. A2P 10DLC brand + campaign — days-long carrier approval, and required
   before texting anyone who is not a Verified Caller ID.
6. Deploy the Angular site (`npm run deploy`) — the consent checkbox is built
   and verified locally but is NOT live yet. Do not run without an explicit
   ask from the user.
7. Optional: update the Apps Script deployment again so the deployed copy of
   `recordBooking_` includes `ensurePhoneColumnsAreText_`. Cosmetic only —
   the read-side recovery already handles it.

### 🔴 (historical) BLOCKED ON USER — next action
The Apps Script web editor repeatedly hung the browser extension, so upload
goes via `clasp` (installed, v3.3.0) instead. Needs two one-time steps from
the user, both as **capoeiraoc@gmail.com**:
1. Enable the Apps Script API: https://script.google.com/home/usersettings
2. `clasp login` and approve the OAuth consent.

Then: `clasp clone` the Registration project → drop in `Reminders.gs` → two
small edits to `Code.gs` (call `recordBooking_(data)`, use `phoneRaw` in the
admin email) → set project timezone → `clasp push` → run
`setupBookingsSheet()` → user pastes TWILIO_* Script Properties →
`installReminderTrigger()` → redeploy the EXISTING deployment.

---


You are the ORCHESTRATOR. Do not write code or drive the browser yourself.
Your job: brief subagents via the Agent tool, verify their work, and only
escalate to doing something yourself if a subagent fails twice.

Model routing rules:
- Coding, browser automation, anything with judgment → Agent with model: "sonnet"
- Simple mechanical verification (run a build, grep a file, confirm a string
  exists) → Agent with model: "haiku"
- Planning, reviewing diffs, resolving ambiguity, talking to the user → you.

Every subagent brief must be SELF-CONTAINED: include the repo path, file
paths, exact requirements, and acceptance criteria, because subagents have
no memory of this conversation.

## Context (include verbatim in relevant briefs)
- Repo: c:\Users\HugoRuiz\source\repos\angular-repos\abada-oc\abada-oc-temp
  (Angular 21 static SPA; the abada-oc-app/ sibling folder is empty — ignore it).
  Deployed to GitHub Pages via `npm run deploy`.
- No backend in repo. Backend = Google Apps Script web apps bound to Google
  Sheets, owned by capoeiraoc@gmail.com (NOT firstlight.tournament@gmail.com).
  Chrome must be signed into capoeiraoc@gmail.com for Steps 3 and 5.
- Booking form: src/app/features/book/book.component.ts ("Book Your Free
  Trial Class") POSTs to environment.contactSheetUrl via
  fetch(..., { mode: 'no-cors' }). Apps Script appends a Sheet row and
  already sends a confirmation email.
- Every submission is a first-time trial attendee — no "is new?" logic needed.
- Current payload: { formType:'booking', name, phone, email, interestedIn,
  firstClassSlot, comments, submittedAt }
- firstClassSlot is human-readable, e.g. "Monday, August 4, 2026 at 5:30 PM".
- Phone is NOT normalized; Twilio needs E.164 (+1XXXXXXXXXX).
- Goal: ONE SMS reminder ~24h before each booked class. No instant
  confirmation text. Studio timezone: America/Los_Angeles.

## Abuse & cost controls (include verbatim in Steps 3, 4, 6)
THREAT MODEL. environment.contactSheetUrl ships inside the public JS bundle
on GitHub Pages, and the Apps Script web app is set to "Anyone". Anyone can
read that URL and POST to it directly with curl. Therefore:
- Creating Sheet rows CANNOT be prevented, and that is fine — a junk row
  costs nothing. Money is spent only when a text is SENT.
- Every guard therefore belongs in sendClassReminders() (the send path),
  NOT in doPost() (the intake path). Guarding intake is theater.
- The expensive attack is SMS pumping / artificially inflated traffic:
  bots submit numbers in countries where they earn a revenue share on
  delivered messages. Those destinations can cost 20-50x a US message.
- These do NOT work and must not be relied on: client-side validation, a
  shared secret in the payload (it ships in the bundle and can be
  replayed), CORS (the form already posts with mode:'no-cors').

Required constants:
- NANP allowlist regex: /^\+1[2-9]\d{2}[2-9]\d{6}$/
- DAILY_CAP = 25 sends per calendar day, America/Los_Angeles.
- DEDUPE_WINDOW_DAYS = 30.

## Step 0 — YOU (orchestrator): kick off the human track first
Before spawning anything, tell the user to start Part C immediately since
A2P 10DLC carrier approval takes days–weeks. Give them this checklist:
1. Create Twilio account at twilio.com, verify identity, add payment.
2. Buy an SMS-capable US local number.
3. Register A2P 10DLC: create a Brand (sole prop is fine for a small
   studio), then a Campaign (use-case: "appointment reminders"; include
   the opt-in description: customers check an SMS-consent box on the
   booking form; sample message: "Hi {name}! Reminder: your free trial
   class is {slot}. See you there! Reply STOP to opt out.").
4. Collect: Account SID, Auth Token, purchased number in +1XXXXXXXXXX form.

CONSOLE HARDENING — do these AS PART OF THE UPGRADE, not after. The trial
account can only text Verified Caller IDs, so exposure is ~zero today and
begins the moment the account is upgraded:
5. Messaging → Geo Permissions → disable every country except US and
   Canada. This is the platform-level backstop for the NANP allowlist in
   Step 3; it holds even if the script has a bug.
6. Billing → keep a LOW balance and turn auto-recharge OFF (or set the
   smallest increment). This is the only true hard stop: if $20 is on the
   account, $20 is the maximum possible loss regardless of any bypass.
7. Usage → Triggers → email alert at ~$5 of messaging spend.
Then proceed to Step 1 without waiting.

## Step 1 — SONNET agent: Angular changes (Part A)
Brief: in the repo above, edit src/app/features/book/book.component.ts
and book.component.html:
1. Add a phone-normalization helper: strip non-digit chars (keep leading
   +); if result is 10 digits, prefix +1; if 11 digits starting with 1,
   prefix +; if input already started with +, leave as-is after stripping
   separators. Apply when building the POST payload.
2. Add SMS-consent checkbox to the form: label "Text me a reminder about
   my class (msg & data rates may apply; reply STOP to opt out)." Add
   `smsConsent: [false]` to registrationForm. It must NOT be required —
   booking succeeds unchecked; only the reminder is gated on it.
3. Payload gains: phone (normalized) and smsConsent (boolean).
4. Run `npm run build`; fix any type errors; commit with a descriptive
   message. Do NOT run `npm run deploy`.
Acceptance: build passes; report the exact diff summary and the final
payload shape.

## Step 2 — HAIKU agent: verify Part A
Brief: in the repo, confirm (a) `npm run build` exits 0, (b)
book.component.ts contains the E.164 helper and includes smsConsent in
the payload, (c) the consent control has no required validator,
(d) the change is committed (git log -1 / git status clean).
Report pass/fail per item. YOU review the report; if anything fails,
send the failures back to the Step 1 agent (SendMessage) to fix.

## Step 3 — SONNET agent: Google Apps Script (Part B, browser)
Brief: use the claude-in-chrome tools. Go to script.google.com (account
capoeiraoc@gmail.com must be logged in), open the Apps Script
project behind the booking form's contactSheetUrl web app. FIRST read the
existing doPost and the bound Sheet's columns, and report the structure
before editing. Then:
1. Ensure sheet columns exist for phone, firstClassSlot, smsConsent, and
   a new `reminderSent` (blank on insert). Update doPost to store
   smsConsent and leave reminderSent blank.
2. Add sendSms_(to, body) using UrlFetchApp →
   https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json, Basic
   auth from PropertiesService.getScriptProperties() keys TWILIO_SID /
   TWILIO_TOKEN / TWILIO_FROM. Never hard-code secrets.
3. Add slot parser: strip leading weekday + comma, replace " at " with
   " ", so new Date("August 4, 2026 5:30 PM") parses. Set the project
   timezone to America/Los_Angeles (appsscript.json).
4. Add sendClassReminders(): per row — smsConsent true AND reminderSent
   blank AND now >= classTime − 24h AND classTime > now → send
   "Hi {name}! Reminder: your free trial class is {slot}. See you there!
   Reply STOP to opt out." then stamp reminderSent = now. Wrap each
   row's send in try/catch so one bad number doesn't abort the loop;
   only stamp reminderSent on success, log failures.
5. ABUSE GUARDS — read the "Abuse & cost controls" section above first.
   All of these gate the SEND, and every one must be evaluated BEFORE
   sendSms_() is called. Skipping a row must never stamp reminderSent.
   a. NANP allowlist: skip unless /^\+1[2-9]\d{2}[2-9]\d{6}$/ matches the
      normalized number. Log the skip. This kills international SMS
      pumping, which is the only attack that costs real money.
   b. Daily cap: a Script Properties counter keyed by LA-local date, e.g.
      'SENT_yyyy-MM-dd'. Reserve a slot BEFORE sending; if the count is
      already at DAILY_CAP (25), stop the run, email the owner once, and
      return. This bounds worst-case spend no matter what else fails.
   c. Per-number dedupe: skip if the same normalized number already has a
      reminderSent stamp within DEDUPE_WINDOW_DAYS (30). Prevents a
      third party being harassed via repeat bookings, and covers the
      honest case of one person booking several slots.
   d. Consent is mandatory: never send when smsConsent is false or blank.
      This is the opt-in evidence that keeps the A2P 10DLC campaign
      alive — complaint-driven suspension would kill reminders for real
      students too.
   e. Log every send and every skip (timestamp, number, reason) so the
      owner can audit what the script actually did.
6. Install hourly time-driven trigger for sendClassReminders. Deploy →
   Manage deployments → EDIT the existing deployment to a new version
   (do NOT create a new deployment — that changes the URL the site
   posts to).
STOP AND REPORT instead of guessing if: the project can't be found, the
existing doPost handles multiple formTypes in a way that's ambiguous, or
any dialog/permission screen blocks you.
Acceptance: paste the final doPost + sendClassReminders code, including
every guard from item 5, and confirm trigger + redeploy (same URL).

## Step 4 — YOU: review Part B code
Read the pasted Apps Script code yourself. Check:
- no secrets hard-coded (SID/token/from come from Script Properties);
- per-row try/catch so one failure doesn't abort the loop, and
  reminderSent is only stamped on success;
- date parsing handles the real slot format;
- existing email-confirmation behavior untouched.

Then verify EACH abuse guard is actually present and on the send path —
a guard that only runs in doPost() is worthless, since the endpoint can
be POSTed directly:
- [ ] NANP allowlist regex gates every send
- [ ] daily cap is reserved BEFORE sending, keyed by LA-local date, and
      halts the run + notifies when hit
- [ ] per-number 30-day dedupe
- [ ] smsConsent false/blank can never send
- [ ] skipped rows do NOT get a reminderSent stamp (or they'd be
      silently swallowed and never sent when legitimate)
- [ ] sends and skips are logged with a reason
Send fixes back to the Step 3 agent if any box is unchecked.

## Step 5 — blocked on user (Part C done)
When the user reports Twilio credentials ready, walk them through adding
Script Properties (Apps Script → Project Settings → Script Properties):
TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM. Or spawn a sonnet browser agent
to navigate there with the user pasting values themselves.

## Step 6 — SONNET agent: end-to-end verification
Brief (browser + repo):
1. Serve the app locally (npm start), submit the booking form with a
   test phone; confirm in the Network tab the payload has E.164 phone +
   smsConsent. Confirm booking succeeds with the box UNCHECKED too.
2. In the Sheet: add a test row ~23h out with the user's real phone and
   smsConsent=true. Run sendClassReminders manually in the editor.
   Confirm reminderSent gets stamped; run again — must NOT double-send.
3. Confirm a row with smsConsent false/blank is never texted.
4. GUARD TESTS — add test rows in the 24h window and run
   sendClassReminders manually after each; none of these may send:
   a. a non-US number (e.g. +447700900123) → skipped by the NANP
      allowlist, and reminderSent left BLANK;
   b. a malformed/short number (e.g. +1555) → skipped, blank;
   c. a number that already has a reminderSent stamp from <30 days ago
      → skipped by dedupe.
5. Daily cap: temporarily set DAILY_CAP to 1 in the script, seed two
   eligible rows, run once → exactly one send, run halts, owner gets the
   notification email. Restore DAILY_CAP to 25 afterwards and confirm
   the restore landed.
6. Confirm the Twilio console hardening from Step 0 is actually in
   place: Geo Permissions limited to US/Canada, auto-recharge off, low
   balance, usage trigger set.
Ask the user to confirm the text arrived. Only after this passes,
tell the user to run `npm run deploy` (or ask permission to run it).

## Failure policy
If any subagent fails the same task twice, stop and report to the user
instead of burning more attempts. Prefer SendMessage to continue an
existing agent (it keeps its context) over spawning a fresh one.
