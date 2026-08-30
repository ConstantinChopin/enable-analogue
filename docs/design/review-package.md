# Design review package — Enable

Prepared for an external design director's critique. Everything below is verified against the running build, not against the specs; where a spec and the build disagree, the build is the fact and the disagreement is recorded as a finding.

---

## 1 · Intake

**What this is, in one sentence.**
It answers the questions a luxury-travel advisor would otherwise have to ask five systems and two colleagues — what our commission is here, whether the rate includes breakfast, whether the spa is still closed — and shows where each answer came from, so they can put it in front of a client without checking it first.

**The user, and the state of their day.**
A travel advisor with a client waiting: rushed, interrupted, repeating known tasks. Two modes only — triage first thing (*what needs me today*), then fast lookup mid-task with an email half-written. Almost never exploratory; they know what they want. The difficulty is retrieval and trust, not discovery.

**The single most important action.**
Getting an answer they will act on **without re-checking it**. Not "search" — retrieval is the easy half. The product's value is that an answer arrives with its sources, dates and disagreements visible, so it can be forwarded to a client. It is the north-star metric: time to a trusted answer.

**Frequency.** Daily driver, many times a day, all day. Dense, low chrome, keyboard-friendly.

**Where we are.** Converging on build. One branch is genuinely still open and worth killing if it deserves it: the Ask surface is mid-change and its prose treatment is not built yet.

**What's fixed.** Stack (Next / React / Tailwind / shadcn) and the data contract, which mirrors a real production schema. Decided and expensive to move: a bottom dock instead of a left rail; five layout archetypes; a two-voice type system (sans for anything computed, editorial serif for anything read as prose); flat, no translucency; warm paper ground, earth-toned semantics, ink accent. Everything else is open. Hard deadline Tuesday.

**Suspicions.** Yes — two or three, deliberately unnamed so the read stays uncontaminated.

**Context that changes how to weight structural feedback.** This is a reconstruction of a real product, rebuilt as a case study for an interview. It has to survive a design panel, not a user base — which makes structural findings *more* valuable than polish, but also means anything requiring a week is academic.

---

## 2 · How to read this package

The product varies along four axes. Any screen can be reached at any combination, and the inventories give the exact recipe for each.

| Axis | Values | What it changes |
|---|---|---|
| **Role** | advisor · colleague · agency lead · ops | The dock's tile set, the briefing's entire contents, and what is visible at all. Restricted content is **absent, not masked** — a deliberate rule, and worth checking we kept it. |
| **Build vintage** | v2 current · v1 March | Rebuilds the superseded advisory design so its failure can be seen rather than described. Press `V`. |
| **State** | default · empty · loading · error · over-full · conflict · refusal · stale · held · gated | Most are reachable by a query param or one store flag. |
| **Width** | desktop · 390px | The dock is the mobile pattern already; the inspector becomes a bottom sheet. |

**Content is fake but load-bearing.** Invented names and figures, internally consistent, sized to stress the layouts — 26 products, 14 commissions, 10 notifications, real overflow and truncation. Density is therefore fair game for critique; it is not lorem. Anything genuinely unbuilt carries a visible **schematic** badge, and those are listed.

**The frame is global**: a bottom dock (icon-only, labels on hover, active tile labelled), a breadcrumb strip with back and forward above the content panel, ⌘K, and an account menu. It is present on every screen except sign-in, which sits outside the product.

---

## 3 · The journeys

Six, and they are the right unit of review — the product's thesis is that the same reconciled model is reachable through different doors, so a screen judged alone will read as a poster.

| | Journey | The door it opens |
|---|---|---|
| **E** | The Record | the catalogue — layered fields, provenance, disagreements shown rather than resolved |
| **A** | The Trusted Answer | the conversation over that same model |
| **B** | The Advisory Lifecycle | its time dimension, including the v1 → v2 iteration |
| **C** | The Working Day | the model pushed at you: briefing, commissions, chase |
| **D** | Connections & Extraction Confirmation | how it gets fed — nothing becomes truth unconfirmed |
| **F** | The Traveller | the most sensitive record type, and its sharing model |

Screen-by-screen inventories, with every reachable state and how to reach it:

- **Advisor and colleague surfaces** → `review-inventory-advisor.md`
- **Admin, ops, sign-in and the cross-cutting axes** → `review-inventory-admin.md`

---

## 4 · The sequences worth reviewing as sequences

Single-screen problems are cheap; sequence problems are expensive. These are the flows where the product either holds together or does not:

1. **The two doors** — briefing → a record with its inspector → the same disagreement felt in an answer. If this does not read, that is the finding, because it is the thesis.
2. **The refusal loop** — a question the product declines to answer → the recovery it offers → the answer working after the gap is filled. This is where the trust proposition either earns its place or looks like a dead end.
3. **The morning** — briefing triage → a commission → a drafted chase that will not send itself.
4. **Confirmation** — a candidate record arriving from an extraction → per-field confirmation → the record becoming answerable. Nothing becomes truth unconfirmed.
5. **The iteration** — the same day under the March build, where an advisory expired silently and the answer is confidently wrong.

---

## 5 · Known open questions

Recorded so the director is not spending findings on things already known:

- **Ask's prose voice is not built.** Answers, refusals and quoted excerpts are still set in the machine voice. The two-voice system is decided but unproven on the surface where it matters most.
- **Record imagery is generated abstract artwork**, not photography — a deliberate call (fictional properties, no network at demo time), but it may read as placeholder.
- **The `flush` variant of the card shell** requires callers to also pass a padding override. Consistent everywhere, but a wart.
