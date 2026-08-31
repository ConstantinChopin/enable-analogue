# Journey E — The Record

**Status:** spec · **Persona:** Advisor (primary); Agency lead for overlay governance
**Screens touched:** Records directory (list + filters), Record card, Field provenance popover, Conflict resolve sheet (shared with A), Note composer, Edit-field sheet
**Evidence pack:** `../evidence/decisions.md`, `../evidence/signals.md`. Mechanisms without a DEC/SIG id are extrapolation, declared in the Appendix.
**Demo note:** this journey opens demo thread 2 — the conflict is *seen in the model* before it is *felt in the conversation* (see `../presenter/demo-choreography.md`).

---

## 1. Purpose

Enable's core work is reconciling product data from heterogeneous sources — portals, GDS content, intranet, rep emails, DMC spreadsheets, advisor experience — into one layered model. The record card is where that reconciliation is **visible**: fields grouped by layer, each carrying provenance and freshness, conflicts shown rather than hidden [DEC-08: "Cards should visually group fields by layer (canonical vs agency vs personal) with provenance + freshness"]. The conversation (Journey A) is a surface over this model; the record is the model, inspectable.

## 2. Record anatomy

A product record renders in three visually distinct field groups [DEC-08]:

1. **Enable canonical** — baseline identity and attributes maintained centrally [DEC-08].
2. **Agency overlay** — negotiated terms, program membership, confirmed conflict resolutions, published advisories [DEC-08; DEC-02 resolutions live here].
3. **Personal** — the advisor's own notes and observations, private by default [DEC-09]; documents attached as note sources land private by default too [DEC-25].

Every field: value + source (what/where/when) [DEC-23] + freshness date; stale fields (90+ days unverified) carry the stale-data warning [DEC-27]. The card schema accepts custom fields mapped in at ingestion [DEC-25]. Cross-linked entities render in the detail panel: partner program, **rep firm and named contacts** [DEC-26], active advisories (Journey B), linked itineraries and travellers [DEC-23 cross-links], and **"who booked this last"** [DEC-27].

## 3. Entry points

| # | Entry | Context carried | Evidence |
|---|---|---|---|
| EP1 | **Records** in the left nav → directory | filters persist per advisor | extrapolation E1 |
| EP2 | ⌘K search → record result | query highlighted on card | extrapolation E1 |
| EP3 | Answer citation / conflict block → underlying record | the field in question scrolled into view | extrapolation E2 |
| EP4 | Briefing notice or advisory → subject record | notice context banner | DEC-13; mechanism E2 |

## 4. Happy paths

### 4a — Reconciliation inspected
1. Advisor filters the directory: destination + facility ("Tokyo properties with a spa") [capability grounded by the question-map family 3, DEC-16-adjacent; filter design E3].
2. Opens a record. The three-layer anatomy renders; she scans provenance on the commission field (partner portal, dated) and the amenity field (flagged: template copy [SIG-44]).
3. One field is **in conflict**: room size — GDS feed 45m², property site 38m² [SIG-10]. Both values render, sourced and dated; nothing is ranked [DEC-02].
4. She resolves it (same sheet as Journey A U1): chosen value stored at the **agency layer**, attributed, both sources kept reachable [DEC-02, DEC-08].
5. **Ask about this** hands off to Journey A with the entity pre-scoped [handoff mechanics E12].

### 4b — Inspect, edit, annotate (the daily motion)
1. Records → open a product page → inspect metadata and its provenance.
2. **Edit a field**: the edit is written as an **agency overlay** (or personal, per her choice where applicable) — canonical is never silently overwritten; the canonical value stays visible beneath the overlay with both provenances [DEC-08].
3. **Add a note**: the composer requires a scope choice at creation — **private / team / organization** [SIG-46 three-tier scope; SIG-45; DEC-09 personal-by-default is the preselected default]. Optional tags (client-type, occasion) [note fields E4].
4. The note renders in the personal group for her, and in colleagues' views per scope, attributed and dated [SIG-45].

**Exit criteria:** an advisor can tell, for any value on the card, where it came from, how old it is, and which layer owns it — without leaving the screen.

## 5. Unhappy paths

### U1 — Field conflict unresolved
As 4a.3 but the advisor dismisses. The conflict chip persists on the card and in any answer touching the field (Journey A U1); nothing is assumed [DEC-02].

### U2 — Permission-filtered fields
Financial fields (production numbers, agency commission actuals) render only to roles entitled to them [SIG-46: "your company dashboard... that nobody else can see"]; other viewers see neither value nor placeholder implying one exists [zero-leakage posture DEC-07; rendering rule E5].

### U3 — Stale field still informs
An unverified 90+ day field renders with the stale warning [DEC-27] and answers built on it inherit the warning (Journey A U3). Verification is one tap: confirm against source, or flag for review [verify affordance E6].

### U4 — Boilerplate content
Amenity/description fields matching template copy are flagged "template copy — needs editorial" and excluded from answer corroboration [SIG-44; rule shared with Journey D U6].

### U5 — Record missing from the directory
The searched property does not exist [SIG-41: "Do we have a place on the Internet where all these meet-and-greet services are listed?" — answer: no]. The empty result offers: request via the extraction pipeline (creates a Journey D candidate), or create a minimal agency-layer stub with mandatory provenance [DEC-23; stub mechanics E7]. The miss is logged to the knowledge-gaps report [DEC-24].

### U6 — Note scope regret
A note shared too widely can be narrowed; the scope change is explicit and attributed, and the audit trail records the interval it was visible [DEC-08 posture; SIG-46; mechanics E8].

## 6. Edge cases

- **E1 Entity renamed / brand change:** the record persists through renames; former names render in history and remain searchable [rename history: pure extrapolation E9].
- **E2 Duplicate suspicion from the card:** "possible duplicate" routes to Journey D's merge sheet [DEC-23; SIG-11: name variants are a normal state, not an exception].
- **E3 Rep-firm portfolio pivot:** from a rep-firm entity, list represented properties ("all properties this firm represents in the Indian Ocean") [DEC-26].
- **E4 Traveller cross-link:** records link to traveller profiles only per VIC permissions — a linked VIC the viewer cannot see renders as no link at all [DEC-09; rendering rule E13; Journey F].

## 7. Errors

- **X1 Connector gap:** fields sourced from an unreachable connector render last-synced values with the gap note [DEC-24; SIG-36: show last-synced state, never pretend immediacy; Journey A X2 pattern].
- **X2 Failed edit:** an overlay write that fails leaves the previous state intact with retry; no partial field states [extrapolation E10].

## 8. Instrumentation

- Conflict resolutions initiated from cards vs from answers [DEC-02 adoption split].
- Notes created per scope tier; retrieval of colleagues' notes [SIG-45 realized].
- Stale-field verifications per week; template-copy flags cleared [DEC-27, SIG-44 movement].
- Directory misses logged → knowledge-gaps report [DEC-24].

## 9. Acceptance criteria

- [ ] Directory filterable by destination + facility; filters persist.
- [ ] Record card renders the three layer groups visually distinct, every field with provenance popover (what/where/when) and freshness [DEC-08, DEC-23].
- [ ] The seeded conflict field shows both values sourced and dated; resolve flow works from the card and the resolution appears in a subsequent Journey A answer.
- [ ] Field edit lands as an overlay with canonical visible beneath; no silent overwrite.
- [ ] Note composer forces a scope choice (private preselected); a second seeded account sees team/org notes and never private ones.
- [ ] U2: financial fields absent (not masked) for unentitled viewers.
- [ ] Stale warning renders at the seeded 90+ day field and propagates to answers.
- [ ] U5 miss path creates a Journey D candidate and logs the gap.
- [ ] "Ask about this" hands off with entity scope (Journey A EP3).
- [ ] Loading / empty / error states; responsive at 390 px (layer groups stack, provenance becomes bottom sheet).

## 10. Decision log

| # | Decision | Date | Evidence | What changed |
|---|---|---|---|---|
| D1 | Cards group fields by layer with provenance + freshness | data-hierarchy design rule | DEC-08 | reconciliation became visible structure, not backend trivia |
| D2 | Conflicts shown both-sided on the record itself | 2026-03-31 | DEC-02, SIG-10 | unresolved conflicts render on the card, both values sourced and dated |
| D3 | Notes carry a creation-time scope choice: private / team / organization, private by default | 2026-04-30 named live | SIG-45, SIG-46, DEC-09 | notes require an explicit scope choice at creation, private preselected |
| D4 | Edits land as layer overlays; canonical is never silently overwritten | data-hierarchy rule | DEC-08 | correction without destruction; every value survives with its provenance |
| D5 | Rep firms first-class, linked from the card | 2026-03 | DEC-26 | the discovery channel became queryable structure |

---

## Appendix — reconstruction vs. extrapolation

| # | Extrapolated mechanism |
|---|---|
| E1 | Directory list/filter design; per-advisor filter persistence; ⌘K integration |
| E2 | EP3/EP4 deep-link behaviors (scroll-to-field, context banner) |
| E3 | The specific filter taxonomy |
| E4 | Note composer tags (client-type, occasion) — field ideas grounded by the Apr-30 wishlist, exact set invented |
| E5 | U2's absent-not-masked rendering rule |
| E6 | One-tap verify affordance on stale fields |
| E7 | U5 stub-creation mechanics |
| E8 | Note scope-narrowing audit rendering |
| E9 | Rename history presentation |
| E10 | X2 edit atomicity |
| E11 | "Who booked this last" presentation format (the intel itself is DEC-27) |
| E12 | "Ask about this" pre-scoped handoff to Journey A (4a.5) |
| E13 | E4's no-link rendering for a VIC cross-link the viewer cannot see |

Scope-tier note: the note composer's private / team / organization tiers are grounded by SIG-46's note-level `privacy_scope` (private / team / agency-wide); the entity-level **alliance** tier is out of analogue scope per SIG-46.

Supporting signals beyond inline citations: SIG-42 (the fourteen personal systems this page replaces), SIG-05 (vetted proprietary data as the edge), SIG-03/SIG-04 (freshness as the failure axis).
