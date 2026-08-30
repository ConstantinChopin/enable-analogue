# Product review 01 — Constantin, 2026-08-28

Captured from a walkthrough of the day-one build. Organised by surface; each item marked **fix** (agreed, actionable), **decision** (needs a call, made below), or **open**.

---

## The organising insight

> "I can't just show this as a point of arrival because essentially I need to walk through all of those steps."

Almost every finding below is the same defect wearing different clothes: **the build drops you at the payoff without the approach.** Ask opens mid-conversation. Records opens mid-table with no filters. Briefing widgets state a number with nowhere to go. A demo that begins at the arrival has nothing to demonstrate.

The rework principle: **every surface owes three states — an index (how you arrive and choose), a working state (what you do), and a detail (where it resolves).** Entry point → payoff → exit, per journey, with the edge cases hung off each.

---

## 1. Shell and chrome

| | Item |
|---|---|
| **fix** | Remove the "Analogue environment · reconstruction, analogue dataset" banner from the product chrome. |
| **fix** | Remove the `world` (v1/v2) switch from the top bar. |
| **fix** | Remove the `viewing as` persona switch from the top bar. |
| **fix** | Remove the presenter rail from the bottom of the app. |
| **fix** | Remove the nav group labels ("The working day", "The model", "Governance"). Flat nav. |
| **decision** | The demo machinery still has to exist — see §7. |

## 2. Sign-in (new surface)

| | Item |
|---|---|
| **fix** | The app opens cold on a briefing with no context. Add a proper SaaS sign-in: credentials entered, then through to the app. |
| **fix** | Not a full onboarding journey — one screen. |
| **fix** | Signing in establishes *who you are*, which then explains the view you land in (e.g. entering as an admin lands the admin view). |
| **consequence** | Sign-in replaces the `viewing as` switcher as the honest way to change persona. |

## 3. Briefing

| | Item |
|---|---|
| **fix** | "Briefing / Paris desk" is meaningless as a crumb — what is a Paris desk to a reader? |
| **fix** | "Good morning" should carry the signed-in name. |
| **fix** | The headline notification ("EUR 2,512 outstanding across three commissions") duplicates what the widgets already say. Probably cut. |
| **fix** | **Every widget must expand to a full page** carrying the rest of that data — commissions, departures, notices, expiring incentives. The widget is a summary of a real surface, not a dead end. |
| **fix** | Build the fake data needed to make those full pages real. |
| **open** | Departures ↔ itineraries: should be the same underlying object (VIC ↔ Itinerary cross-link). Confirmed by the data contract — departures are itineraries with near dates. |

## 4. Ask

| | Item |
|---|---|
| **fix** | Ask is a conversation *product*, not a single conversation. Landing on Ask must show **recent conversations** plus a composer to start a new one. |
| **fix** | Today it drops straight into a finished thread — the payoff with no approach. |
| **fix** | The composer is scrolled out of the viewport. It must be **sticky at the bottom**. |
| **fix** | Define the walk-up: ask a question → watch it resolve → land on the answer (and its conflict / refusal branches). |

## 5. Records

| | Item |
|---|---|
| **fix** | Records render only as a table. Each record needs an **image**. |
| **fix** | **No filters exist.** The data contract supports a defined filter set (category, destination, programme, luxury tier, status, consortia, evidence state, freshness) — build it. |
| **fix** | The record layout is confusing: the segmented control runs the full width and a right column appears underneath it. |
| **fix** | Correct the pattern to standard dashboard behaviour: a right panel slides in from the right; the segmented control sits to the **left** of that panel, not across the whole screen. |
| **fix** | "Open full record" should be **permanently present** in the right rail while inspecting, not a hunted-for link. |
| **keep** | Category tabs on entry (Hotels / Cruises / DMCs / Rep firms) are right. |

## 6. Every journey

| | Item |
|---|---|
| **fix** | For each journey, define explicitly: **entry point → payoff → exit**, plus the edge cases attached to each stage. The specs carry entry points, unhappy paths, edge cases and exit criteria already; "payoff" and the walk-up sequence are what's missing, and the build skipped them. |

---

## 7. Decision — where the demo machinery goes

**The tension.** The world switch is not chrome: it is demo beat 6, the live proof that the March advisory design failed — arguably the strongest single artefact in the case study, because it *shows* an iteration instead of claiming one. The persona switch is the permission-isolation proof. Deleting them from the chrome is right; deleting them is not.

**Decision.** All demo machinery leaves the product and moves to two places:

1. **The sign-in screen becomes the demo control.** You choose who you sign in as (advisor · colleague · agency lead · ops) — which is what a sign-in does anyway — and, in a quiet "demo setup" affordance on that screen, which build vintage to run (current / March). The presenter sets up before entering; the product itself is pure product.
2. **Invisible keyboard layer inside the app.** The checkpoints, reset, narration overlay and vintage switch stay on keys, with no visible chrome. Nothing renders unless invoked.

Net effect: the app looks and behaves like a product on every screen, and every demo beat survives.

## 8. Decision — record imagery

Real photographs of real hotels would contradict fictional properties, and remote images are a live-demo failure risk (no network dependency is allowed in this build). **Decision: deterministic generated imagery** — each property renders a distinct abstract architectural card derived from its id, committed to the repo, no network. Reads as intentional, stays honest about the data being invented.

## 9. Scope note

Three build days remain (Sat–Mon, interview Tuesday). This review is a substantial rework of shell, briefing, ask and records, plus the seed expansion that makes the full pages real. Journeys not visited by the demo (itineraries, parts of governance) hold at their current fidelity, marked schematic.
