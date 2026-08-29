# Eval 4a — Wireframe stage: Check 1 (Coverage) + Check 5 (State honesty)

**Date:** 2026-08-28 · **Evaluator:** fresh-context agent, files only
**Inputs:** `docs/wireframe/wireframe.html` (source), the six journey specs in `docs/journeys/`, `docs/evals/rubric.md`
**Fidelity standard applied:** a labeled box, chip, or annotation IS representation at wireframe stage; an unmentioned state is not. "Explicitly deferred" (rubric wording) counts as covered when the deferral is written into the wireframe itself.

---

## Verdicts

| Check | Verdict | One-line justification |
|---|---|---|
| **1 — Coverage** | **WARN** | All five demo-critical flows are represented and playable (conflict-resolve, chase draft-and-send, notice create/close, candidate confirm, VIC share), and the v1/v2 rewind is fully wired — but 18 of 88 spec ids have no wireframe home, including three demo-adjacent misses (briefing progress widget, briefing→Ask wiring, commission calendar). |
| **5 — State honesty** | **FAIL** | Permission states are the wireframe's strength; empty states exist only for Ask; error states are patchy and mostly annotated remotely; **loading states have zero representation anywhere** — one of the four named state classes is categorically absent while every spec's acceptance criteria demand it. |

**Counts across all six journeys (EP + U + E + X = 88 ids):**
REPRESENTED **49** · PARTIAL **21** · ABSENT **18**

---

## Check 1 — Coverage, per journey

Legend: **R** = represented (with location) · **P** = partial (what's missing) · **A** = absent.

### Journey A — The Trusted Answer (8 R / 4 P / 4 A)

| Id | Class | Where / what's missing |
|---|---|---|
| EP1 nav Ask | **R** | Nav link "Ask", chip `A`; blank-thread crumb |
| EP2 ⌘K → ask instead | **P** | Named only in the follow-up chip ("A-EP1..4 entries: nav · ⌘K …"); no command-palette surface, no query-carry shown |
| EP3 record → Ask about this | **R** | Record-card button, chip `A-EP3`; crumb actually changes to "scoped to Maison Léandre" — fully wired |
| EP4 briefing → follow-up | **P** | Named in the same chip; no briefing element navigates to Ask with context (briefing notices route to the record instead) |
| U1 conflict | **R** | "conflict A-U1" tab: both values sourced+dated, Resolve → shared sheet with required reason [A8], agency-layer storage, dismiss "stays in conflict", and the happy tab's `resolvedCite` shows the follow-through answer. Note: conflict block shows source+date but not **layer**, which the spec requires |
| U2 refusal | **R** | "refusal A-U2" tab: no commercial value, all three recovery CTAs, refusal styled as normal outcome |
| U3 stale | **R** | "stale A-U3" tab: value with date + warning. SIG-04's suspect-external-signal nuance not shown (minor) |
| U4 permission-denied | **P** | Omission rule annotated in srcSheet dashed box ("never appears here… claim omitted [A-U4]"); the A12 permission-audit log has no home |
| U5 empty workspace | **R** | "empty desk A-U5" tab: guided empty state, three CTAs, "no sample answers styled as real ones" |
| E1 active advisory on answer | **R** | v2-only banner on Ask (`A-E1 · DEC-18`); Critical-ack gate lives on the record card (B-U2 block), which covers the output gate |
| E2 relative dates | **A** | No mention anywhere |
| E3 currency dual-render in answers | **A** | Currency handling exists at ingestion (D-U7) and commission FX (SIG-38), but the answer-level dual-currency render has no home |
| E4 duplicate documents corroborate once | **A** | No mention |
| X1 retrieval timeout | **A** | No loading/timeout state on Ask at all |
| X2 connector down, gap note in answer | **P** | Annotated on the Connections screen ("Answers exclude the failed source with a visible gap note") — but no gap-note element on any Ask answer itself |
| X3 sync pending | **R** | Briefing headline "last synced 12:04 · one figure pending (up to 48h)" chip `C-U5 · SIG-36`; Connections "syncing · up to 48h" |

Acceptance-critical notes: retrieval trace in DEC-16 order **R** (the "HOW THIS ANSWER WAS BUILT" box); contract chip **R**; DEC-05 copy/export split **R** (hint annotation); 390 px bottom-sheet **explicitly deferred** via presenter-rail note "phone frame in the real build — 390px stack" — acceptable at this stage.

### Journey B — Advisory Lifecycle (7 R / 4 P / 3 A)

| Id | Class | Where / what's missing |
|---|---|---|
| EP1 record "Add notice" | **R** | Button on record card `B-EP1` → advSheet composer |
| EP2 briefing widget "New notice" | **P** | Notices widget exists on the briefing; no "New notice" composer entry from it |
| EP3 vault "Create notice from this" | **R** | Knowledge vault forwarded-mail row, button `B-EP3`, source-attached hint in composer |
| EP4 admin publish queue | **R** | Publish screen, lead-persona-gated, "owner preserved" on the publish action |
| U1 expired-but-ongoing (v1) | **R** | The wireframe's strongest beat: v1/v2 world toggle actually works — v1-only boxes on briefing and record show the silent failure; the Ask advisory banner is v2-only so the v1 answer really does render clean |
| U2 Critical unacknowledged | **R** | Interactive: shortlist attempt → blocked banner, "Dismissal is not acknowledgment", ack recorded (who/when) |
| U3 scope leakage prevented | **P** | Admin audit annotated on publish screen (DEC-29, break-glass); no second-advisor account or leakage exhibit proving personal advisories never appear elsewhere |
| U4 contradicting advisories | **A** | No pair of contradicting advisories anywhere |
| U5 stale pile-up | **R** | Stale-review screen: oldest-first in crumb `[B5]`, dashed box `B-U5` "escalates on briefing; never auto-closed" |
| E1 incentive expiry ≠ advisory expiry | **P** | Expiring-incentives widget chipped `B-E1 · DEC-21`; composer hint states the rule ("commercial end dates cut projections, closure stays manual") — but the "ended, pending close" render state [B12] is never shown as a state |
| E2 advisory follows entity through rename | **A** | No mention |
| E3 notice from email, permission-split render | **P** | EP3 exists with source attached; the reader-sees-text-but-not-document split is not shown |
| X1 publish failure / no half-publish | **A** | No mention |
| X2 surfacing not notification-dependent | **R** | Structural: all surfacing is in-product (card, briefing, answers); no notification system exists to depend on |

Composer fidelity is good: DEC-20 fields (source/timestamp/owner), DEC-18 three severities with the Critical-ack warning inline, three scopes with personal preselected, and the explicit "No end date field in v2" hint. Close sheet requires reason [B11] and states archive + never-current-again. The draft→active→closed→archived lifecycle's **draft** state is nowhere shown (minor).

### Journey C — The Working Day (9 R / 1 P / 4 A)

| Id | Class | Where / what's missing |
|---|---|---|
| EP1 default landing | **R** | Script boots to briefing; chip `C-EP1 default landing` |
| EP2 phone | **R (deferred)** | Rail beat 8 note: explicit deferral to the real build |
| EP3 commission calendar → item | **A** | No calendar view anywhere; DEC-22 names it and the spec makes it an entry point |
| EP4 ops resolution queue | **R** | Resolution screen, ops-persona-gated |
| U1 orphaned payment | **R** | Queue + matchSheet: ranked candidates, required reason, attributed; "identity only, not value ranking" disclaimer present |
| U2 credit-not-refund | **R** | Crit banner on commission detail `C-U2 · SIG-31` |
| U3 projected/actual discrepancy | **R** | Banner with both CTAs (accept-with-reason, dispute draft); "both values with provenance" stated as text rather than rendered — acceptable at wireframe fidelity |
| U4 send-gate holds | **R** | "Nothing sends without review" hint + "send is the only path, no auto-send exists" `C-U4`; the draft flow is fully interactive (draft → edit → send → chased, chase log updates) |
| U5 sync-pending figures | **R** | Briefing headline sync note `C-U5 · SIG-36` |
| E1 unconfirmed cancellation | **R** | Briefing box `C-E1 · SIG-33`, direct-contact CTA |
| E2 processor migration | **A** | No mention (SIG-34 class) |
| E3 quiet-day empty state | **A** | No empty/quiet variant of the briefing exists (also a Check 5 finding) |
| X1 booking system unreachable | **P** | Connections shows the degraded rows; the commission-widget degraded render + "drafting still works" rule has no home on the briefing/commission surfaces |
| X2 partial widget failure isolation | **A** | No mention |

**Additional acceptance miss:** the spec's happy path and acceptance list five widgets; the wireframe has four (commissions, departures, notices, incentives). The **records-verified progress** widget is absent from the briefing — and the briefing is the demo's cold open.

### Journey D — Ingestion & Confirmation (9 R / 5 P / 2 A)

| Id | Class | Where / what's missing |
|---|---|---|
| EP1 add connection | **R** | Connections screen + connSheet: MCP-first vs fallback [DEC-11], scoped-credentials + cadence hint, appears-in-health note |
| EP2 vault file upload | **P** | Vault exists with private-by-default docs; no upload affordance |
| EP3 inbound email | **R** | Inbound box on vault, `DEC-14`, sender-verified hint |
| EP4 forwarded content | **R** | "Forwarded: Rosewood incentive mail" row in the vault |
| U1 wrong metadata corrected | **P** | "Fix" button on the flagged description; value+snippet side-by-side and attributed field history are not shown |
| U2 duplicate / merge | **R** | Queue duplicate row `D-U2` + mergeSheet: field-by-field, required reason `[D16*]`, "nothing merges automatically" |
| U3 low-confidence held | **P** | Held states rendered twice (queue row, candidate currency field); the reject CTA and rejection log [D6] have no home |
| U4 connection failure degraded | **R** | Expired-credentials row `D-U4` + dashed downstream-effect box |
| U5 permission misconfig caught | **P** | Default-private posture in the vault crumb; the tightest-scope inheritance rule [D7] and the boundary-catch scenario are not shown |
| U6 boilerplate flagged | **R** | Candidate card + record card both flag template copy `[SIG-44]`, "excluded from corroboration" on the record |
| U7 silent currency transform | **R** | Candidate "held — converted figure without source currency `[D-U7 · SIG-38]`" |
| E1 candidate referenced pre-confirmation | **P** | Queue crumb annotates invisibility "[D-§2.4]"; the role-aware "material in review" note inside a refusal has no home |
| E2 re-ingestion diff review | **A** | No mention |
| E3 bulk seeding / batch confirm | **R** | Dashed box on review screen `D-E3` |
| X1 pipeline failure mid-batch | **A** | No mention |
| X2 credential revocation mid-sync | **R** | The expired-credentials health row is exactly this surface; confirmed-records-remain clause unshown (minor) |

The 90-second demo path (beat 7) is intact: queue → candidate card (per-field provenance, identity-check-first banner, per-field ✓ + confirm-all) → stamped confirmation → "now answerable" banner.

### Journey E — The Record (7 R / 5 P / 4 A)

| Id | Class | Where / what's missing |
|---|---|---|
| EP1 Records nav → directory | **R** | Nav link, filter placeholders `E-4a.1`; per-advisor filter persistence not noted (minor) |
| EP2 ⌘K search → record | **A** | No ⌘K surface exists anywhere in the wireframe |
| EP3 answer citation/conflict → record | **A** | srcSheet offers "Open document" only; the Ask conflict block has no route to the underlying record. This is the connective tissue of the "two doors" thesis and it is unwired |
| EP4 briefing notice → record | **R** | Briefing notice row `data-go="record"`; the record's own notice banner supplies the context |
| U1 conflict unresolved persists | **R** | Dismiss "stays in conflict"; directory row carries the "1 conflict" chip |
| U2 permission-filtered financials | **P** | Absent-not-masked pattern has a home on the traveller profile (SIG-46 box); the record card itself shows no financial-fields treatment |
| U3 stale field + one-tap verify | **P** | Directory chip "3 fields stale 90d+ [DEC-27]"; stale propagation to answers covered by A-U3 tab; the verify affordance [E6] and a stale field on the open card are absent |
| U4 boilerplate | **R** | Amenities field flagged, excluded from corroboration |
| U5 missing record → candidate + gap log | **R** | "Not finding it?" dashed box `E-U5`: request-via-pipeline routes to the review queue, knowledge-gaps log hint [DEC-24 · SIG-41] |
| U6 note scope regret | **R** | noteSheet hint: "Narrowing later is possible; the visible interval is audited [E-U6 · DEC-29]" |
| E1 rename history | **A** | No mention |
| E2 duplicate suspicion from the card | **P** | The merge sheet exists (Journey D); the "possible duplicate" affordance on the record card itself does not |
| E3 rep-firm portfolio pivot | **P** | "Rep firm: Corvin & Wells → named contacts [DEC-26]" on the card; no rep-firm entity view listing represented properties |
| E4 traveller cross-link gated | **R** | Context placeholder "linked traveller (permission-gated) [E-E4]" |
| X1 connector-gap fields | **P** | Annotated only on the Connections screen; no field-level gap note on the record |
| X2 failed edit atomicity | **A** | No mention |

Core anatomy is the wireframe's best work: three visually distinct layer groups [DEC-08], provenance popover with what/where/when [DEC-23], the conflict field sharing the exact resolve sheet with Journey A (chip says so: "shared: A-U1 / E-4a.4"), edit-as-overlay sheet, note composer forcing scope with private preselected.

### Journey F — The Traveller (9 R / 2 P / 1 A)

| Id | Class | Where / what's missing |
|---|---|---|
| EP1 Travellers nav | **R** | Nav link, "mine" crumb, DEC-09 |
| EP2 briefing departure → traveller | **R** | Departure row `data-go="traveller"`; profile leads with the departing trip + checklist |
| EP3 record → linked traveller | **R** | Labeled, permission-gated placeholder on the record's context box |
| U1 preference conflict warn | **R** | Interactive: shortlist attempt → amber warning citing the preference and its source, "Proceed knowingly (recorded)", "warn, not block" |
| U2 unshared VIC invisible | **R** | Dashed box `F-U2`: "absent, not locked", request-access recovery named (flow itself not playable — annotation suffices) |
| U3 guessed preference held as suggestion | **R** | Suggestions box: labeled AI suggestion, Confirm-→-attributed / Discard |
| U4 sharing regret / revoke | **P** | "revocable · audited" hint and "shared with J.D." row; no revoke control and no audit-interval display [F2] |
| E1 OQ-2 tension kept visible | **R** | Sharing hint: "OQ-2 tension (tiered sharing) documented, not silently resolved" |
| E2 conflicting preference sources | **R** | "no boats (2025) vs yacht charter (2026)" row, both shown `[F-E2 · DEC-02]` |
| E3 household / shared trips | **A** | No mention |
| X1 import failure → suggestions | **P** | The destination (suggestions area) exists; the import-failure route into it is not annotated |
| X2 share atomicity | **R** | shareSheet hint: "Atomic — never partial [F-X2]" |

One structural gap outside the id walk: the spec's screens-touched names a **Preference composer**; the wireframe renders seeded preferences with sources but has no composer requiring a source choice [DEC-28's acceptance: "the composer requires a source"].

---

## Check 5 — State honesty

Every journey's acceptance criteria include "Loading / empty / error states on every screen." Verdict by class:

| State class | Verdict | Evidence |
|---|---|---|
| **Loading** | **FAIL — zero homes** | Not a single loading, skeleton, pending, or timeout treatment exists anywhere in the wireframe — not even as an annotation. A-X1 (retrieval timeout, "partial trace shown, retry offered") is the sharpest casualty because it is a designed behavior, not just a spinner. |
| **Empty** | **FAIL — one real home** | A-U5 empty desk is a genuine, well-designed empty state. E-U5 "Not finding it?" covers the empty-search-result case. Everything else is missing: C-E3 quiet-day briefing (a *designed* empty state in the spec — "no manufactured urgency"), empty stale-review queue, empty publish queue, empty extraction review, empty resolution queue, empty travellers list. |
| **Error** | **WARN — patchy, often remote** | Strongest: Connections (expired credentials `D-U4`, degraded sync, downstream-effect note). Present as prose annotation: share atomicity [F-X2]. Absent entirely: A-X1 timeout, B-X1 half-publish, C-X2 widget failure isolation, D-X1 mid-batch failure, E-X2 failed edit. A recurring pattern: the error's *consequence* is annotated on the Connections screen rather than shown on the surface where the user would meet it (Ask answers, commission widgets, record fields). |
| **Permission** | **PASS** | The wireframe's strength, matching the product thesis: persona-gated nav (functionally wired), permission-filtered source in srcSheet with the omission rule, absent-not-masked financials (traveller), unshared-VIC invisibility box, publish-queue audit/break-glass box, private-by-default vault + note + notice scopes. |

Net: two of four state classes fail, one warns, one passes → **check 5 FAIL**. The specs treat state honesty as load-bearing ("a refusal is styled as a normal outcome"; "the briefing never white-screens") and the wireframe currently only honors it for permissions and refusal.

---

## Complete miss list, ranked by demo criticality

Absent items first within each tier; partials included where they threaten a demo beat.

**Tier 1 — would surface in the live demo (beats 1–7):**
1. **C: records-verified progress widget absent** — acceptance names five widgets; the briefing (cold open, beat 1) has four.
2. **A-EP4 / B-EP2 (partial): briefing → Ask is unwired** — the "two doors" narrative (beat 4) opens from the morning surface; today no briefing element reaches Ask, and the notices widget can't compose.
3. **E-EP3 absent: no route from an answer citation/conflict to the underlying record** — the thesis line "conflicts felt in conversation are conflicts that exist on the record" has no clickable proof in either direction from Ask.
4. **C-EP3 absent: no commission calendar** — DEC-22 names the view; commission is beat 2.
5. **Loading states absent everywhere** (check 5) — a demo that opens Ask will either fake instant answers or improvise; A-X1's partial-trace-and-retry is a designed moment with no home.
6. **F: no preference composer** — beat 6b says "attributed preferences"; adding one (the DEC-28 acceptance moment: composer requires a source) cannot be shown.

**Tier 2 — spec'd load-bearing behavior with no home:**
7. B-U4: contradicting advisories (two advisors, one property).
8. D: rejection flow + rejection log (U3's reject CTA, D6).
9. E-EP2: ⌘K search (also A-EP2 partial — no palette surface at all).
10. C-E3: quiet-day briefing (designed empty state).
11. A-U4's audit-log half (A12) and B-U3's second-account leakage proof — governance claims currently asserted, not exhibited.
12. D-U5: tightest-scope inheritance / permission-misconfig catch.
13. E-U3: stale field on the open card with one-tap verify (only the directory chip exists).

**Tier 3 — secondary edges and error states:**
14. A-E2 relative dates; A-E3 answer-level dual currency; A-E4 document dedup.
15. B-E2 / E-E1: entity rename history.
16. B-X1 half-publish prevention; C-X2 widget-failure isolation; D-X1 mid-batch atomicity; E-X2 edit atomicity.
17. C-E2 processor-migration event.
18. D-E2 re-ingestion diff review.
19. F-E3 household/shared trips; F-U4 revoke control + audit interval.
20. B-E1's "ended, pending close" render state; B lifecycle's draft state.

---

## Verdict

**Check 1 (Coverage): WARN.** The wireframe covers what the demo lives on: all five demo-critical tasks are not merely boxed but *playable* (conflict resolve with follow-through into a later answer; draft-edit-send with chase log; notice create/close/stale-nudge; candidate confirm; VIC share), the v1/v2 world toggle genuinely re-renders the seeded day, and persona gating actually hides surfaces. Spec-id chips and the solid/dashed grounding convention make the coverage auditable. But 18 of 88 ids are absent and 21 partial, and three of the misses sit inside demo beats (briefing widget count, briefing→Ask, answer→record). Fix Tier 1 before calling coverage a pass.

**Check 5 (State honesty): FAIL.** Permission states are exemplary and refusal is first-class — the trust thesis is honored. But loading states do not exist in any form, empty states exist only for Ask, and error behavior is mostly annotated on the Connections screen instead of shown where it lands. For a product whose pitch is "the UI never pretends," the wireframe currently pretends everything loads instantly and nothing is ever empty. A single annotated "system states" strip per screen (loading / empty / error) would clear most of this at wireframe cost.
