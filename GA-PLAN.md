# ABADÁ-Capoeira OC — Google Analytics Plan

**Goal:** turn GA4 data into more free-trial bookings and people in class, and make
the Google Ads launch measurable.

**Status of ads:** NONE of the items below are showstoppers for launching Google
Ads. Ads only need a booking to fire a conversion (confirmed working on desktop;
the native Google Ads conversion tied to the ad click is more robust than the GA4
beacon). Everything here makes ads *work better* and *legible* — it runs in
parallel with launch, it does not gate it.

---

## The mental model
GA4 answers a 4-step funnel. Ignore the other 90% of the interface.

**Found you → looked around → started a booking → finished a booking**

Snapshot (last 28 days, as of 2026-08-30 — directional, not yet cleaned):
- ~193 users → 34 views of "Book a Free Trial" → **72 `form_start`** → **~1–2 `free_trial_booked`**
- The 72→2 gap is the single biggest lever on bookings.

---

## Phase 1 — Fix the booking-form leak (highest ROI; free)
More bookings from traffic we already have. Do this before/around ads, not after.

- [ ] **Add Microsoft Clarity** (free session recordings + heatmaps) to *see* where
      people abandon the form, instead of guessing. ~10 min install (script in
      index.html). This is the real diagnostic.
- [ ] **Most likely culprit to test first:** the required "pick your exact first
      class time" step asks for commitment too early. Make the slot picker
      **optional** ("Not sure yet? We'll help you pick a time") — capture the lead
      first, schedule second.
- [ ] Verify **Turnstile isn't silently failing real first-attempts** (Hugo saw
      "first tap does nothing, second works"). If real users hit it, they leave.
- [ ] Re-check the form on **mobile** (most ad traffic will be iPhone).

## Phase 2 — Clean the data so numbers mean something
- [ ] **Filter GA4 to the real local market** (US / Southern California). A lot of
      current traffic is bots + random international (Iran, Moscow, Brazil, etc.)
      that inflates counts and hides the real OC signal.
- [ ] Consider marking `free_trial_booked` as a **key event** and registering
      `interested_in` as a **custom dimension** so it's reportable.

## Phase 3 — Build the weekly dashboard (Looker Studio)
- [ ] Build in **Looker Studio** (free Google tool, connects live to GA4, shareable
      link). NOT an artifact (that's a static snapshot) and NOT buried in GA4's UI.
- [ ] One page: the 4 funnel numbers + local-only traffic + ad performance
      (Paid Search sessions → bookings). A weekly glance, not a deep dive.

## Phase 4 — Wire tightly into Google Ads
- [ ] Confirm GA4 ↔ Ads link (done) and that Paid Search shows as its own bucket.
- [ ] After launch: watch **which keywords/landing pages bring bookers vs.
      bouncers** (GA4 landing-page + Ads search-terms report) and kill losers.
- [ ] Optional hardening: make the conversion event fire reliably on Safari so
      Google's bidding gets full signal (improves ROI over weeks; not a blocker).

---

## Open question flagged 2026-08-30
Desktop booking fired `free_trial_booked` (Edge/Buena Park). A Safari/mobile test
fired `form_submit` but no `free_trial_booked`. Unresolved whether that Safari
submission actually completed (Turnstile retry) or completed-but-didn't-track.
Not blocking ads. Revisit if mobile conversions look low after launch.
