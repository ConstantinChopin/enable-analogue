# The sequence — craft, then UX, then the narrative

**Status:** working plan · **Date:** 2026-09-10 · **Supersedes** the gate order in `00-plan-revised.md` §3. Everything else in that document stands: the five tests, the eight-line decision form, the harness extensions, the assumptions.

**Source:** `01-feedback-deel.md`. The case study's context, problem framing, research and briefing were judged clear and strong. They are kept as they are. Three things failed: design decisions were not mapped to the problems framed; craft details were below the bar; and the decisions read as offloaded to the tool rather than owned. The sequence below takes them in the order that makes each one's output the input of the next.

---

## 0. Why this order, and the smaller version of it

Three passes, each with a different unit of work:

| Pass | Unit | Question it answers | Output |
|---|---|---|---|
| **1 · Craft** | the system | Does every pixel on every surface come from a rule that was decided? | A replaced token and component layer, applied everywhere, with the harness proving it |
| **2 · UX** | the screen | Who is this for, and why are these the primary, secondary and tertiary actions? | One decision record per surface, checked by the harness, rehearsed aloud |
| **3 · Narrative** | the story | Which problem does each decision answer? | The case study's decisions section rebuilt as a problem-to-decision map |

Craft comes first because the UI layer is system-wide: one token file and one component registry reach all seventeen routes at once, so "all surfaces" is the natural unit rather than a widening. UX comes second because the action ladder on a screen is only readable once its controls are consistent. Narrative comes last because it quotes the decision log, which the first two passes fill.

**The smaller version, stated now.** Pass 1 on the components the four demo journeys touch, Pass 2 on the four demo surfaces only (briefing, record, admin review, ask), Pass 3 unchanged. About half the time. Logged as VIS-002 with the trade-off: the deck would be defensible and the rest of the product would still look generated when a panellist wanders off-script, which is exactly how the vault defects were found.

**Who decides.** Agents measure, draft, check and review. Constantin decides. Concretely: the *Evidence* and *Enforced by* lines of a decision may be machine-written; the *Why this one* line is written by Constantin, in his words, every time, and the narrative quotes that line and nothing else. Nothing about tooling appears in a decision beat. The tooling has one place in the story, under method, framed as how the rules were made executable.

---

## Pass 1 — Craft: the system, applied to every surface

**Goal.** No surface has a value that was not decided. Resemblance to Airbnb is a failure; the anatomy supplies *rules*, the constitution supplies *values*.

### 1.0 Baseline (unchanged from Gate 0)

Blind test on the current build, token provenance audit (argued / observed / default per value in `globals.css`), defect list seeded from `01-feedback-deel.md` §2. This is the *before*.

### 1.1 The constitution, from the anatomy

Each rule below is a VIS entry, its evidence line pointing at `anatomy/01-system-rules.md` or a component record. Values are Enable's; the rules are what is cited.

| Chapter | Rule taken from the anatomy | Enable's current state | Decision needed |
|---|---|---|---|
| Spacing | Two ladders (inside a thing, between things); inside is one or two steps below between | 4·8·12·16·24·32, single ladder, the rule already stated | Add the macro ladder for section rhythm; keep the rule |
| Radius | Rises with elevation and with how alone the object stands; pill only for the one primary and for things that float | 6 control · 10 card · 12 panel, no pill, no meaning above 12 | A scale mapped to distance from the page; decide whether Enable's primary earns a pill |
| Type | Two leadings per size, chosen by role (scanned ≈1.25, read 1.5); emphasis is a weight step at the same size; one display size per surface | Eight roles, macOS-derived, already weight-first | Survives; add a reading leading to `type-data` for paragraphs of machine text |
| Elevation | A ladder that starts at a hairline; "flat" is step zero of the same ladder, not a different system | Flat by decision, nested backgrounds plus hairlines | Survives, restated as elevation 0 of a ladder with two named steps above it (a tool that follows you, a layer over the page) |
| Colour roles | Four text levels; a fill you can press is a different token from one you cannot; status is ink on tint with words; chroma means state or the one primary | Four labels, trust states own chroma, ink accent | Survives; add the pressable / non-pressable fill distinction, missing today |
| States | Hover is a fill step; press shrinks; focus is a double ring; disabled is a colour swap never opacity; one curve at 0.2s | `outline` focus, no press, per-component hover | Adopt the grammar; every interactive role ships its four state tokens |
| Composition | The section unit (padding · title · content · padding · rule); one primary per surface at the bottom of the tool that owns it; disclosure is preview → grey button → sheet; trust is a bordered row of words and figures | Card grids; `Section` exists; sheets exist | Adopt the section unit as the page's atom; the brief and the record are where it shows first |

Survivors from `design-language.md` re-enter the log as VIS entries with their original evidence: the optical-size argument for Inter and Newsreader, the ink-accent collision argument, the spacing-ownership rule, the 13/16 data body.

### 1.2 The token layer

- Delete the shadcn compatibility block in `globals.css` (a named deliverable; the most visible generated residue). Radix stays.
- Add: the macro spacing ladder, the radius scale, the elevation ladder, per-role state tokens (`-hover`, `-pressed`, `-selected`, `-disabled` on every interactive role), one motion curve and duration.
- Keep `ref` / `sys` / `comp` and the naming grammar. Nothing new holds a literal.

### 1.3 The component registry

The 26 primitives in `src/components/ui/` and the atoms in `bits.tsx`, re-styled in dependency order: button → input and select → list row → section and card → badge and chip → sheet and dialog → tabs → table. Each component ships with:

1. a record in the anatomy's format (purpose · properties · variants · states · composition rules), so Enable's system is documented the way Airbnb's was measured;
2. its VIS entry, *Why this one* in Constantin's words;
3. a state matrix row in `contracts.mjs`, so tier 2 renders every declared state.

The three witnessed defects name the components that go first after the button: **legend** (C1), **count copy** (C2), **selected row** (C3).

### 1.4 The harness, extended before the surfaces are touched

From `00-plan-revised.md` §4.3, in this order: tier-1 raw-value grep widened to radius, colour, spacing and shadow; token-level AA once; the copy lexicon (`evals/lexicon.json`); the tier-2 state matrix; the selected-state check. Then the baseline debt goes to zero: 25 raw type utilities, 11 colour-alone, 30 semantic colour at call sites. Debt that cannot shrink is a decision, logged.

### 1.5 Application across all seventeen routes

Mechanical, because the components carry the system. Per surface only the composition is hand-done: the section unit, the spacing rhythm, the one primary. Order by reach: shell and dock → briefing → record → ask → commissions → knowledge → admin (review, connections, publish) → travellers, itineraries, notifications, settings → sign-in. Mobile for the brief and the record; the rest desktop-first per assumption A6.

**Exit.** Harness green with a zero baseline. Every component has a record and a VIS entry. The blind test names the domain and the register and does not name Airbnb, Linear or shadcn. The three witnessed defects have a check each and the checks pass.

---

## Pass 2 — UX: one decision record per surface

**Goal.** For any screen, Constantin can say in one breath who it is for, what they are there to do, and why the actions sit where they sit. The panel's phrase was "connect each decision back to the problem"; on a screen the problem is the person's job.

### 2.1 The contract becomes the record

`contracts.mjs` already declares `job`, `primaryAction` and `taxonomies` per screen, and all three tiers read it. It grows into the surface's full decision record:

```js
"/records/[id]": {
  for:        { advisor: "checking a value before she quotes it to a client" },
  job:        { advisor: "check a value, see where it came from, settle it if it disagrees" },
  primary:    { action: "resolve the disputed commission",
                why: "the one thing on this record that blocks a quote — DEC-08, SIG-nn" },
  secondary:  [ { action: "verify against source", why: "…" },
                { action: "add a note", why: "…" } ],
  tertiary:   [ { action: "edit", why: "an overlay edit is rare and must not compete — DEC-08" } ],
  absent:     [ { action: "auto-resolve", why: "DEC-02: show all, advisor resolves" } ],
  disclosure: "gallery preview → summary card → sections; sheets for sources",
  states:     ["loading", "empty", "error", "permission-denied", "conflict", "stale"],
  taxonomies: ["evidence state", "layer ownership"],
}
```

Every `why` cites a DEC or SIG id from `docs/evidence/`, or a VIS id. A `why` that cites nothing is a review item.

### 2.2 What the harness checks against it

- Tier 2: exactly one filled control, and it is `primary`; every `secondary` renders as a grey fill; every `tertiary` renders as text; every `absent` action is genuinely absent from the DOM; every declared state renders.
- Tier 3: the cold reader names the person in `for` and the action in `primary`. For the brief, the four "personal" criteria from `00-plan-revised.md` §4.5 become contract fields.

### 2.3 Surface order and the per-surface page

In order of demo weight, then of witnessed defects: record → briefing → ask → admin review → commissions → knowledge → connections and publish → travellers and itineraries → notifications → settings → sign-in.

Each surface gets one page in `docs/rebuild/surfaces/`: the contract in prose, the action ladder with its whys, the three challenges a panellist is most likely to raise with a counter-proposal each and the one concession the log permits, and the smaller version of the surface. Navigation is a named challenge, so the shell and dock get the same page.

**Exit.** Every route has a full contract, tier 2 and 3 green, and the surface pages have been rehearsed aloud, second question included.

---

## Pass 3 — The narrative: decisions mapped to problems

**Goal.** Keep the structure the panel praised. Rebuild only the decisions section so that no decision appears without the problem it answers, and no framed problem is left without its decision.

### 3.1 The map

A table the deck and the site page are both built from. Left column: the problems as framed in the case study's own opening, each given an id. Right column: the decision that answers it, by VIS or DEC id, with its *Why this one* line. Two rules: a problem with no decision is either cut from the framing or gets one; a decision with no problem is cut from the deck.

### 3.2 The decision beat

Every decision shown in the deck follows one shape: the problem, in the words used when it was framed → the decision → the why → the evidence → the alternative considered, including the smaller one → what we would change if wrong. Six beats, the log's own lines, spoken.

### 3.3 The scope beat, said before it is asked

The email-forwarding MVP for commission opportunities is stated as the alternative considered for the brief and for commissions, with the resourcing constraint that ruled out parallel delivery, and with what choosing the larger scope taught. It comes in the narrative, not in the questions.

### 3.4 The craft beat

The three witnessed defects, named, with the check that now catches each. Not as an apology: as the evidence that rules are enforced rather than written.

### 3.5 The tooling, in one place

One slide, under method: the rules were made executable, and here is the harness. No decision beat mentions a tool. The line "we brought the design system into Claude Code" does not appear; the reason it was done does.

### 3.6 Production

Screens re-shot from the Pass 1 build. Deck through `demo-journeys` for the live section, with the defence rehearsal from Pass 2 folded in. Site page through `case-study-canon` → `case-study-copy` → `case-study-eval`, canon reconciled first (founding product designer, eight months weekly, versus the CV's 2019–2024 tenure).

**Exit.** The map has no empty cells. The rehearsal covers every journey and every named challenge. The eval passes.

---

## Rule across passes

Partial passes do not accumulate. Each pass re-runs the full harness and the blind test on everything built so far. A component or surface without its VIS entry is not merged.

## Still open

1. The date and audience of the next presentation. The Deel window opens March 2027; anything sooner is another company and re-cuts the passes.
2. The Parable consortium protocol. The three-brief stand-in from assumption A7 runs until it is supplied.
3. A logged-in Airbnb session for the host dashboard, which the brief's affinity needs. Without it the brief's structure is argued from the editorial reference alone.
