# Enable visual-language rebuild — revised plan

**Status:** proposal for Constantin's review · **Date:** 2026-09-10
**Supersedes nothing yet.** This is the original plan ("Enable Case Study — Visual Language Rebuild") re-sequenced against the end it serves, with the changes argued. Where the original is kept, it is kept as written.

---

## 0. The end, restated as five tests

The plan's own sentence: *every non-negotiable exists to make one of those sentences impossible to say again.* So the end is five tests, and every task below must serve at least one. A task that serves none is cut.

| # | The panel said | The test that makes it unsayable | Proved by |
|---|---|---|---|
| T1 | "You narrate what you did without the why." | Every design decision has the six lines, and the presenter can give the *why* of any surface in one sentence without notes. | Decision log · defence rehearsal (§4.7) |
| T2 | "You didn't try to convince." Conceded instead of defending or offering an alternative. | For every key surface, the three most likely challenges are written down with a counter-proposal each. A concession is only allowed when the log already records the trade-off. | Defence rehearsal · log field *What we'd change if wrong* |
| T3 | "Details didn't reach the level" — legend colours, copy, selected states — "discovered during the interview." | Machine checks catch the defect class before a person does: legend↔state, copy lexicon, state matrix renders, tokens only, AA at token level. The last run is green. | Eval harness tiers 1–3, extended (§4.3) |
| T4 | The daily brief: "correct, but impersonal." | A cold reader names the advisor and her first task in one sentence. The brief is ordered by her day and written in sentences, not a card grid. | Tier 3 judgement on `/briefing` (§4.5) |
| T5 | "No smaller scope was proposed until asked." | The one-week version of every major surface, and of this plan, is in the log and in the narrative before it is asked for. | Log field *Alternatives considered* · §1 |

**What the tests imply about scale.** T1, T2, T4 and T5 are answered by argument, rehearsal and one rewritten surface. Only T3 is about craft, and it names consistency defects, not the language. The rebuild is therefore not *required* by the feedback. It is chosen, and the choice is the log's first entry (§1).

---

## 1. The smaller version of this plan (log entry VIS-001)

```
Decision: rebuild the visual language on Airbnb's anatomy with an editorial voice, rather than repair the current one
Problem it serves: T3 (craft) and the panel's implied verdict that the current surfaces read as generated
Evidence: the sign-in and briefing screens as shipped 2026-09-01 — shadcn geometry, card grid, warm-paper-plus-serif; the register the current design-language.md itself calls "the most over-produced look in contemporary interface design"
Alternatives considered: (smaller, one week) keep the current language; write the six lines retroactively for each token; extend the harness; rewrite the brief; rehearse the defence. Passes T1, T2, T4, T5 outright and T3 by the harness.
Why this one: the one-week version makes the *presentation* defensible but leaves the surfaces looking like the tools the panel already knows; "visually very competent" was the ceiling, not the floor. A language with an argued structural source and an argued voice is the only route to "designed by a person in command." The cost is the component layer, and §4.4 keeps it bounded.
What we'd change if wrong: if the Gate 0 baseline shows the current build already passes the blind test and tier 3, revert to the one-week version and spend the time on T2 and T4.
```

This entry is written before any pixel, and it is said in the narrative before anyone asks.

---

## 2. Assumptions (each reversible; correct any that are wrong)

| # | Assumption | If wrong |
|---|---|---|
| A1 | The next audience is another interview panel, live demo plus deck, date unknown; plan for a three-week horizon with the one-week spine shippable on its own. | A fixed date re-cuts §3 at the nearest gate. |
| A2 | The five feedback lines are the whole record; no defect list survives. The specific defects are reconstructed from `enable-collins-v2/demo-script.md` §Risks and the evals baseline. | A defect list replaces the reconstruction and seeds §4.3 directly. |
| A3 | Objective 7 targets the deck first (`enable-collins-v2`, what a panel sees) and the site page second (`constantin.studio.site`). Every captured screen in `assets/screens/` is re-shot after Phase E. | Swap the order; the log is the same. |
| A4 | Airbnb is settled as the structural source, argued as *the best public example of showing trust and provenance about a travel entity to a non-technical reader*. The editorial reference governs the dense surfaces the affinity map cannot place. | A second structural reference for ledgers is added to Phase A. |
| A5 | Decisions in the current `design-language.md` may survive if they pass the six lines; only the ones that fail are replaced. Radix primitives (behaviour, accessibility) stay; the shadcn styling layer and the compatibility aliases in `globals.css` go. | "Replace everything" adds roughly a week to §4.4 and is recorded as a decision. |
| A6 | Mobile is in scope for the brief and the record first (the choreography already plans a phone beat for the brief); the rest is desktop-first with mobile as a later gate. | All-surfaces mobile doubles Phase E. |
| A7 | The "consortium protocol from the Parable plan" is not on disk. Until it is, the review panel is three written role briefs (UI, UX, PM) run as three independent model reviews per surface, findings logged in the same six-line form with a *resolution* line. | The real protocol replaces the stand-in. |

---

## 3. Sequence — spine first, then widen

The original plan runs seven objectives strictly in series, with the whole of Airbnb's anatomy documented before any design. That is the shape the panel criticised: the large version, unproposed. The revision runs the *whole* pipeline on one surface first.

### Gate 0 — Baseline (two days)

Before any rebuild. Produces the *before* the case study needs and measures the real size of the problem.

- **0.1 Blind test on the current build.** Cold evaluator, no context, every key screen. Records top-three resemblances, typographic voice, one distinctive element, and who the screen is for. This is the test Phase F runs later; running it now gives the case study a before/after and checks the premise of VIS-001.
- **0.2 Token provenance audit.** Every value in `src/app/globals.css` tagged *argued* (has a why in `design-language.md`), *observed* (from a reference), or *default* (shadcn, Tailwind, or unexplained). The count of *default* is the honest size of "AI-set survives unexamined."
- **0.3 Defect reconstruction.** From `demo-script.md` §Risks and `evals/baseline.json`: the list of defects a panel could still find today. Each becomes a check in 4.3 or a known trade-off in the log.
- **0.4 Canon reconciliation.** The deck says founding product designer, eight months weekly with the design partner; the CV timeline says Enable 2.0 → 3.0 inside a 2019–2024 tenure. Run `case-study-canon` so the log cites one framing.

### Gate 1 — The spine: the product record, end to end (one week)

Phases A–F on `/records/[id]` only. This *is* the one-week version, and it ships on its own if the horizon collapses.

- **A (record only):** Airbnb listing detail, measured — hero image block, section anatomy, structured facts, trust signals, the sticky action, disclosure. Logged-out reachable.
- **B:** the editorial reference set, small and named (§4.2).
- **C:** the constitution's first chapters: type roles, colour roles, spacing rhythm, surface and stroke, as far as the record needs them.
- **D:** the record ↔ listing affinity argument, plus the explicit *non*-affinities inside the record (the commission row with three sources, the layer badges, the permission-absent state) and which editorial rule governs each.
- **E:** tokens and the components the record needs, desktop and mobile, all states. Every component enters the log on the way in.
- **F:** consortium review, machine checks, blind test, defence rehearsal for the record.

### Gate 2 — Widen (one week)

- **The daily brief** (T4 is its own gate; see §4.5), then **Ask with attribution**. Phase A extends to the host Today tab (needs a session; see §5) and to search results and filters for Ask's sources rail.
- Each surface repeats D → E → F. No new constitution chapters without an evidence line.

### Gate 3 — The rest, and the case study (one week)

- Remaining surfaces on the desktop, composed from the registry, no new components unless logged.
- Deck re-shot; decision log woven into the narrative at the beats where a decision is shown; the smaller version stated at each.
- Site page updated last, via `case-study-canon` → `case-study-copy` → `case-study-eval`.

**Rule across gates:** partial passes do not accumulate. Each gate re-runs the full harness and the blind test on everything built so far.

---

## 4. Changes to the original objectives, and new tasks

### 4.1 The decision form gains three lines

```
VIS-nnn · date · status (proposed | accepted | superseded by VIS-mmm)
Decision:
Problem it serves:
Evidence:            [Airbnb pattern | editorial reference | product constraint (SIG/DEC id) | accessibility standard | measurement]
Alternatives considered:   (at least one, including the smaller version)
Why this one:
What we'd change if wrong:
Enforced by:         tier 1 / tier 2 / tier 3 check name, or "judgement only"
```

- **Id, date, status** make the log compatible with the existing evidence pack (DEC-nn, SIG-nn) and let a decision be superseded rather than silently edited.
- **Evidence classes widen from two to five.** A rule like "every value carries its layer" exists because advisors said so (SIG), not because a magazine did. Money in tabular figures is a product constraint. Contrast floors are a standard. Citing an Airbnb pattern for a rule that has better evidence elsewhere is weaker, not stronger.
- **Enforced by** is the line that stops the log and the harness drifting apart. The harness README already names the failure: rules that were written, correct, and unenforced.

### 4.2 Phase A: published intent plus measured values, reachable surfaces only

- Airbnb has published its design-language reasoning (the 2016 visual-language and DLS writing, the Cereal typeface rationale, the 2025 redesign notes). Those give *intent*; the DOM gives *values*. A component record cites both where both exist.
- Logged-out reachable: search results, listing card grid, listing detail, filters, map pins. **Account-required:** host dashboard, messaging, checkout. These are documented only if Constantin signs in himself in Chrome and lets the agents use that session; the agents do not enter credentials.
- Output stays as specified: one record per component, one per surface, one cross-cutting rules summary. Add a **measurement confidence** tag per value (computed style · screenshot estimate) so nobody later defends a guessed pixel as a measured one.
- The 2025 Airbnb redesign added playful 3D iconography. It is on the anti-reference list by name so the extraction does not import it.

### 4.3 Machine checks: extend the harness, do not rebuild it

The three-tier harness in `evals/` was built after exactly the defect class the panel found. The plan's checks map onto it as extensions:

| Non-negotiable | Where it lands |
|---|---|
| No raw values in components, tokens only | Tier 1: extend the existing arbitrary-type-size grep to radius, colour, spacing, shadow |
| Copy consistent (numbers, labels, units) | Tier 1: a **copy lexicon** file (`evals/lexicon.json`) of approved labels, units and number formats; the check fails on an unlisted variant |
| Every declared state renders | Tier 2: a **state matrix** per component in `contracts.mjs`; the check renders each declared state and fails on a missing one |
| Legends match the states they describe | Tier 2: already exists ("a bar agrees with its own legend"); keep |
| Contrast meets AA at token level | Tier 1: compute every `sys-*` foreground/background pair once, at the token file, not per screen |
| Selected states unclear | Tier 2: every selectable row/tab/chip exposes `aria-selected`/`aria-pressed` *and* a visible non-colour difference |

Every constitution rule gets an *Enforced by* line pointing here, or is marked judgement-only, which is itself a review item.

### 4.4 The system: bounded replacement

- Keep Radix (headless behaviour, keyboard, focus, ARIA). Replace the shadcn styling layer entirely. Delete the shadcn compatibility alias block in `globals.css` as a named deliverable; it is the most visible generated residue.
- Survivors from `design-language.md` must pass the six lines like any new decision. Expected survivors: the optical-size argument for the type pairing, the ink-accent collision argument, the spacing-ownership rule. Expected replacements: shadcn geometry, card and control radii, the card grid on the brief, anything tagged *default* in 0.2.
- No component ships without its log entry. The entry's *Enforced by* line is filled before merge.

### 4.5 "Personal" gets a definition that can fail

The brief passes T4 when all four hold:

1. It is addressed to a named advisor and opens with her day, not the agency's.
2. It is ordered by *her* obligations: her departures, her clients, her pending items, her overdue commissions, in that order or a logged one.
3. Its top half is sentences a colleague could have written, with figures inline, not a grid of equal cards.
4. A tier-3 cold reader, asked "who is this for and what must they do first," names the person and one task in one sentence.

The existing tier-3 rubric already asks the fourth question; the first three become contract fields for `/briefing`. Notifications and the advisor's home follow the same four.

### 4.6 The blind test gets positive criteria, and a baseline

As written it is a negative test ("must not name Airbnb or Linear"), easy to pass by accident. Add: the evaluator must name the domain (travel or hospitality), the register (editorial, serif-led, or equivalent words), and how trust is shown. Run it at Gate 0 on the current build so the case study has a before.

### 4.7 New task: the defence rehearsal

The log is the defensive artefact; this is the offensive one, and it is the only task that answers T2 directly. For each key surface: the three challenges a panel is most likely to raise, the counter-proposal for each, and the one concession the log already permits with its trade-off named. Format follows `demo-journeys` (state to start from, what to point at, the line to land). It is rehearsed aloud, like the demo script.

### 4.8 Package the pipeline as general skills

Per the working-style line (this runs on Parable next) and the studio rule that skills are general-purpose: `design-system-anatomy` (agents extract and measure a reference system), `visual-constitution`, `affinity-map`, `decision-log` (the form and its checks), `blind-resemblance-test`, `defence-rehearsal`. Existing skills are reused where they already cover a phase: `prototype-audit` for F, `case-study-canon`/`copy`/`eval` for objective 7, `demo-journeys` for the live section.

---

## 5. Still open, and material

1. **The date and audience of the next presentation.** Sets which gate is the real deadline.
2. **The Parable consortium protocol.** Until supplied, the stand-in in A7 runs.
3. **An Airbnb session** for the host dashboard, messaging and checkout. Without it Phase A covers the logged-out surfaces only, which is enough for the record and Ask but not for the brief's host-dashboard affinity.

Everything else proceeds on the assumptions in §2.
