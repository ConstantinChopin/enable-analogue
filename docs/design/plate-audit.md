# Plate audit — Collins/Enable case-study UI vs. journeys, schema, and class practice

**Date:** 2026-08-28 · **Scope:** all 9 plates (briefing, answer, conflict, refusal, directory, knowledge, traveller, admin, itinerary) audited against journeys A–F, `data-model.md`, `entity-display.md`, and Eval-4 class heuristics.

---

## 1. What works — keep, and feed back into the system

1. **The shell is already master-detail everywhere.** Consistent left nav (The working day / The model / Governance), breadcrumbs, contextual right rail on all 9 screens, contextual footer ("Synced 12:04" / "Saved 12:04" / "Policy saved 09:12"). The wireframe's card→rail pattern is native to this DNA.
2. **Trust surfaces are genuinely load-bearing — best content in the set:**
   - *Conflict:* three values side by side, per-source evidence bars ("3 of 4 sources agree"), "view excerpt", one-click **Keep this value**, and the **"Where this value goes"** impact panel (directory row / quotes / chat — "one decision, three places"). "The newest value is not the right value" as a data fact.
   - *Refusal:* the contract rendered as a literal checklist (Sources ✓ / Freshness ✗ / Corroboration ✗), **held-back sources panel** with ages, three recovery CTAs (Ask the rep firm / Show the two sources / Flag for review).
   - *Answer:* "How this answer was built" trace; corroboration counts; "answer contract met".
3. **Directory is real enterprise craft:** category tabs with counts (Hotels 209 · Cruises 41 · DMCs 28 · Rep firms 34 = the 312 in nav — the numbers reconcile), filter chips, bulk bar (Add to list / Compare / Export), an **Evidence column** (verified / 6 months old / 3 sources disagree / +3% to 30 Sep) that encodes state in words+dots, verified-this-quarter footer.
4. **Governance made visible:** knowledge vault per-document access chips, "private on arrival", **access-widening history log**, 71% verified-source meter; admin sharing defaults per record kind + **break-glass log with reason, expiry, owner-notified** (DEC-29 rendered exactly).
5. **HITL intelligence on traveller and itinerary:** signals carry per-signal source + corroboration count + "confirm this"; itinerary preference-conflict is **warn-not-block with a swap offer** and a "Why the warning appeared" panel (DEC-27/F-U1 as shipped UI); "Add from records" panel sorts verified-first.

**Feedback into our system (adopt):** the impact panel ("where this value goes"), held-back sources panel, Evidence column, access-widening history, "why the warning appeared" explainers, contextual footers. None of these were in the wireframe; all should be.

## 2. What doesn't work (UX findings)

| # | Finding | Severity |
|---|---|---|
| U1 | **Case-study narration lives inside product chrome.** Rail copy like "A ranking rule would settle this in a line of code and would be wrong often enough to cost money", "Why defaults, not exceptions", "One source is a note" is presenter voice, not product voice — it violates the no-narration-in-UI rule and invites the interview question "would you ship this paragraph?" | High (demo risk) |
| U2 | **Vocabulary drift vs schema/journeys:** plates say **"organisation layer"** (schema/journeys say agency layer); traveller says **"signals"** (schema: preferences in 7 profile types); "Keyed by hand" vs manual entry. One taxonomy pass needed. | High |
| U3 | **Traveller sharing popover is the pre-DEC-31 model** (Private / Team / Admins-per-policy) — no Collaborator Full/Basic, no approval workflow, no Acuity, no profile types. | Medium (or an asset — see plan Q3) |
| U4 | Conflict resolution has **no reason capture** and no attribution display on "Keep this value". | Medium |
| U5 | "Flag for review" and other CTAs route to surfaces that don't exist (no review queue). Bulk **Compare/Export** flows unspecified. | Medium |
| U6 | Pattern drift in small components: three tab styles (boxed segments / underline tabs / day pills), status chips vs dots vs colored text used inconsistently across screens. | Low |
| U7 | No loading, timeout, or empty states anywhere; no responsive/mobile treatment in any plate. | Medium |

## 3. Missing to honour the journeys

| Journey | Missing surface |
|---|---|
| B | Notice composer, severity tiers (Info/Important/Critical), Critical-ack gate, stale-review queue, publish queue, v1/v2 anything |
| C | Commission timeline (projected→due→paid), chase log, resolution queue (orphaned payments), commission calendar, discrepancy flags |
| D | Entire journey: connections/integration health (only a "3 intranet errors" chip exists), extraction review queue, candidate card, merge sheet |
| E | Record full-page layer anatomy exists only via the conflict screen; no note composer with scope choice, no edit-as-overlay |
| F | 7 profile types, Full/Basic tiers, Acuity states, passport/loyalty blocks, suggestions-vs-preferences split |
| A | Loading/timeout state, empty workspace state |

## 4. Missing to honour the data contract (schema)

- Directory rows/cards: no `luxury_tier`, no `status` (Coming Soon/Closed), brand vs program distinction thin.
- Record rail: no `client_amenities` (45-slug), no rep-firm contacts block, no reverse "Client Intelligence" (linked VICs, gated), no promotions block with **booking vs travel windows**, no `network_consortia`.
- No `canViewCommissions` gating evidence anywhere (commissions render unconditionally).
- No dedup/`match_signals` surfaces; no `extraction_log` provenance drill-down (conflict's "view excerpt" is the seed of it).

## 5. Decisions (Constantin, 2026-08-28)

1. **Narration → presenter overlay.** Product chrome carries product copy only; the case-study voice moves to a toggleable presenter layer (keystroke on the presenter rail). Red-team eval probes this seam.
2. **Canonical layer name: "agency".** Docs stand; plates' "organisation" is explained as an earlier label if raised.
3. **Traveller plate = historic frame.** The plate stays as mid-engagement evidence; the prototype builds the schema model (7 profiles, Collaborator Full/Basic, Acuity). The plate is the *before* in the three-stage sharing iteration.
4. **Scope: demo-beats hi-fi.** Full fidelity where the choreography lands (notice lifecycle + v1/v2, candidate confirm, commission timeline, record composers, demo-screen states); non-demo surfaces ship at wireframe fidelity behind a "schematic" badge.

Editor's calls on the minor items: conflict resolution keeps the plates' one-click **Keep this value** with automatic attribution; a reason field is optional, not blocking (demo speed wins; the audit trail still exists). Bulk Compare/Export stays schematic. Tab/chip pattern drift resolves in the build by adopting one segmented-tab and one chip component from the design system.

## 6. Verdict

The nine plates are a **strong visual and conceptual baseline** — the trust surfaces and governance surfaces are the product's identity and are already excellent. The gaps are (a) presenter narration inside product chrome, (b) six surfaces the journeys require that don't exist, (c) schema fields the cards/rails don't carry, (d) a traveller model one iteration behind the schema. All fixable in the hi-fi build; none require redesigning what exists.
