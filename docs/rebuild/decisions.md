# Decision log — VIS

Form (from `00-plan-revised.md` §4.1): id · date · status · Decision · Problem it serves · Evidence · Alternatives considered · Why this one · What we'd change if wrong · Enforced by.

Evidence classes: **[A]** Airbnb pattern (anatomy file) · **[E]** editorial reference · **[P]** product constraint (DEC/SIG id) · **[S]** standard · **[M]** measurement.

**Status rule.** `proposed` means the *Why this one* line was drafted by the assistant and awaits Constantin's rewrite. `accepted` means Constantin has written it. `superseded by VIS-nnn` keeps the history. Nothing `proposed` is quoted in the narrative.

---

## VIS-001 · 2026-09-10 · proposed
**Decision:** rebuild the visual language on Airbnb's anatomy with an editorial voice, rather than repair the current one.
**Problem it serves:** T3 (craft) and the panel's implied verdict that the surfaces read as generated.
**Evidence:** [M] sign-in and briefing as shipped 2026-09-01: shadcn geometry, card grid; the design-language.md's own warning about the cream-serif register.
**Alternatives considered:** the one-week version (VIS-002).
**Why this one:** the one-week version makes the presentation defensible but leaves the surfaces looking like the tools the panel already knows; "visually very competent" was the ceiling.
**What we'd change if wrong:** if the Gate 0 blind test passes on the current build, revert to VIS-002.
**Enforced by:** blind resemblance test (judgement).

## VIS-002 · 2026-09-10 · proposed
**Decision:** the smaller version: Pass 1 on the components the four demo journeys touch, Pass 2 on the four demo surfaces, Pass 3 unchanged.
**Problem it serves:** T5. The smaller scope is stated before it is asked for.
**Evidence:** [P] `01-feedback-deel.md` §2 Scope.
**Alternatives considered:** the full sequence (chosen, `02-sequence.md`).
**Why this one (why not this one):** the vault defects were found off-script; a build that is only polished on the demo path fails the same way again.
**What we'd change if wrong:** if the date collapses, ship this.
**Enforced by:** judgement only.

## VIS-010 · 2026-09-10 · proposed
**Decision:** the data body is 14/18, not 13/16.
**Problem it serves:** the type pairing's own argument. Inter's optical axis begins at 14.
**Evidence:** [M] Inter VF `opsz` range 14–32 (read from the binary in design-language.md §1); [A] product UI body 14/18 (`anatomy/01-system-rules.md` §Type).
**Alternatives considered:** keep 13/16 (macOS table); go to 16/20 (Airbnb's read size).
**Why this one:** 14 is the smallest size at which the optical argument we cite is actually true; 16 costs the density the ledgers need.
**What we'd change if wrong:** if rows overflow at 14 on the ledger, tighten row padding before touching size.
**Enforced by:** tier 1 `raw-type-utility`; tier 2 rendered size census (every sans size is a role).

## VIS-011 · 2026-09-10 · proposed
**Decision:** two leadings per size, chosen by role: `type-data` 14/18 scanned, `type-data-read` 14/20 read.
**Problem it serves:** paragraphs of machine text (explanations under a figure, a notice body) were set at row leading.
**Evidence:** [A] description 16/24 vs rows 16/20 (`anatomy/raw/listing-detail-1440-full.json`).
**Alternatives considered:** one leading; prose in serif for all paragraphs.
**Why this one:** a paragraph the machine wrote is still the machine's voice; it only needs room to be read.
**What we'd change if wrong:** collapse to one role if the census shows `data-read` used under 5 times.
**Enforced by:** tier 1 (role exists; no raw leading utilities).

## VIS-012 · 2026-09-10 · proposed
**Decision:** page title 26/30 Newsreader 500 −0.02em; section title 16/20 Inter 590; quiet section 14/18 400 secondary.
**Problem it serves:** one display size per surface; a section must own its content without a box.
**Evidence:** [A] H1 26/30, chapter 22/26 500 −2%, quiet sections 16/20 400 (`anatomy/surfaces/listing-detail.md`); [M] the previous 24 serif over 15 sans left the section unable to subordinate a 13 value.
**Alternatives considered:** serif section titles (rejected: the serif names what you read, the sans labels the machine).
**Why this one:** the ratio 26 : 16 : 14 gives three rungs a reader can tell apart at a glance; the previous 24 : 15 : 13 did not.
**What we'd change if wrong:** if chapters read as rows, raise section to 18/24.
**Enforced by:** tier 2 (one `type-title-page` per screen).

## VIS-020 · 2026-09-10 · proposed
**Decision:** a fill you can press (`fill-interactive`) is a different token from a fill you cannot (`bg-sunken`).
**Problem it serves:** the same paper-20 served both, so a hover fill and a sunken well were indistinguishable in a diff.
**Evidence:** [A] `bg-interactive` #F2F2F2 vs `bg-secondary` #F7F7F7 (`anatomy/01-system-rules.md` §Colour).
**Alternatives considered:** one token.
**Why this one:** name for use, never for value; identical values are allowed, identical names are not.
**What we'd change if wrong:** nothing; this is free.
**Enforced by:** tier 1 (`bg-sunken` never on an interactive element).

## VIS-021 · 2026-09-10 · proposed
**Decision:** selected is inverse (ink on paper), not a tint.
**Problem it serves:** C3 in the Deel feedback: the selected state did not communicate.
**Evidence:** [P] `01-feedback-deel.md` §2 C3; [A] selected chip = `bg-primary-inverse` + `text-primary-inverse` (`anatomy/components/filter-chip.md`).
**Alternatives considered:** a tint fill with a stronger stroke; an underline.
**Why this one:** inversion is the one state change that cannot be missed at a glance and that spends no chroma.
**What we'd change if wrong:** if inversion reads as a primary action, reserve it for chips and tabs and give rows a 2px ink left edge.
**Enforced by:** tier 2 selected-state check (`aria-selected`/`aria-pressed` and a non-colour difference).

## VIS-022 · 2026-09-10 · proposed
**Decision:** every interactive role ships hover, pressed, selected and disabled as named tokens; disabled is a colour swap, never opacity.
**Problem it serves:** states were per component; disabled was `opacity-50` from shadcn.
**Evidence:** [A] `_hover`/`_active`/`_disabled` per token; disabled as named colours (`anatomy/raw/interactive-states.json`).
**Alternatives considered:** keep opacity for disabled.
**Why this one:** opacity leaks through to text on tint and breaks the contrast floor; a named colour is checkable.
**What we'd change if wrong:** nothing.
**Enforced by:** tier 1 (no `opacity-` on disabled selectors); token AA.

## VIS-030 · 2026-09-10 · proposed
**Decision:** two spacing ladders: inside 2·4·8·12·16·24·32, between 16·24·32·40·48·64.
**Problem it serves:** section rhythm had no scale; the brief used 24 everywhere.
**Evidence:** [A] micro and macro ladders (`tokens`); [M] Enable's "16 inside, 24 between" is the same rule.
**Alternatives considered:** one ladder.
**Why this one:** the between-ladder is what lets a chapter breathe 32 and a card pad 16 under one rule.
**What we'd change if wrong:** drop 64 if unused.
**Enforced by:** tier 1 `undefined-token` widened to both ladders.

## VIS-040 · 2026-09-10 · proposed
**Decision:** the radius scale 4·8·12·16·20·24·32·pill, mapped to distance from the page.
**Problem it serves:** 6 · 10 · 12 carried no meaning above 12; shadcn geometry.
**Evidence:** [A] eight steps and their uses (`anatomy/01-system-rules.md` §Radius).
**Alternatives considered:** keep three steps.
**Why this one:** a radius that rises with elevation tells the reader how far a thing is from the page before any shadow does.
**What we'd change if wrong:** collapse 20 into 16.
**Enforced by:** tier 1 (no arbitrary `rounded-[…]`).

## VIS-041 · 2026-09-10 · proposed
**Decision:** the primary action is a pill, the only pill that acts; secondary is a radius-2 grey fill; tertiary is text.
**Problem it serves:** the action ladder must be visible without colour; one primary per surface.
**Evidence:** [A] pill reserved for the one primary and for things that float (`anatomy/components/button.md`).
**Alternatives considered:** primary as filled radius-2 (the previous form); all buttons pill.
**Why this one:** a shape the eye finds once per screen is the cheapest possible hierarchy.
**What we'd change if wrong:** if the pill reads as Airbnb in the blind test, keep the filled radius-2 and make the pill the secondary's shape instead.
**Enforced by:** tier 2 (at most one filled button; it is a pill).

## VIS-050 · 2026-09-10 · proposed
**Decision:** elevation is a five-step ladder that starts at a hairline; the content layer never rises above step 0.
**Problem it serves:** "flat by decision" had no place for the dock, popovers and sheets, which each invented a shadow.
**Evidence:** [A] elevation 0 is a 1px inset; six numbered, four named (`anatomy/01-system-rules.md` §Elevation).
**Alternatives considered:** stay flat and forbid shadows.
**Why this one:** flat is step zero of a ladder, not a different system; naming the steps above it is what keeps them rare.
**What we'd change if wrong:** nothing structural.
**Enforced by:** tier 1 (no arbitrary `shadow-[…]`).

## VIS-060 · 2026-09-10 · proposed
**Decision:** one state grammar: hover is a fill step, press is scale 0.96, focus is a double ring, selected inverts, disabled swaps colour; one curve at 200ms.
**Problem it serves:** each component chose its own; focus was an outline.
**Evidence:** [A] `anatomy/raw/interactive-states.json`; [S] WCAG 2.4.7 focus visible.
**Alternatives considered:** keep outline focus.
**Why this one:** the double ring stays visible on any fill and any image; an outline disappears on ink.
**What we'd change if wrong:** nothing.
**Enforced by:** tier 2 state matrix.

## VIS-070 · 2026-09-10 · proposed
**Decision:** the section unit replaces the card grid as the page's atom; cards exist only for tools.
**Problem it serves:** T4 ("correct but impersonal"); the panel's "widgets".
**Evidence:** [A] the section unit and the elevated-card rule (`anatomy/components/card.md` §Composition, `anatomy/surfaces/listing-detail.md`); [P] DEC-08 "cards should visually group fields by layer" is satisfied by a chapter per layer.
**Alternatives considered:** keep the grid with better cards.
**Why this one:** a document with chapters can be ordered by the reader's day; a grid of equal cards cannot be ordered at all.
**What we'd change if wrong:** if the lead's brief needs a glance-able grid, give that role a ledger, not cards.
**Enforced by:** tier 2 (a page with more than one hairline box that is not a tool fails).

## VIS-071 · 2026-09-10 · proposed
**Decision:** disclosure is preview → grey button → sheet; no pagination, no accordion on desktop.
**Problem it serves:** unclear navigation (Deel); hidden content with three different reveal patterns.
**Evidence:** [A] `anatomy/surfaces/listing-detail.md` §Hidden.
**Alternatives considered:** tabs.
**Why this one:** one reveal pattern is learnable; three are not.
**What we'd change if wrong:** allow tabs for a ledger's saved views only.
**Enforced by:** contract `disclosure` field (Pass 2).

## VIS-072 · 2026-09-10 · proposed
**Decision:** the record's Summary is the tool that follows you: a sticky, elevated card in the document's rail holding everything unsettled about the record and the ONE primary, "Resolve 3 sources", at its bottom. The commission row keeps the three values and a secondary "Resolve 3 sources".
**Problem it serves:** the record's contract (check a value, see where it came from, settle it if it disagrees); the demo's "Stop on the Summary card" beat; one primary per surface.
**Evidence:** [A] the booking card: the only elevated surface on the listing page, sticky, with the one pill at its bottom (`anatomy/components/card.md` §2); [P] DEC-08 (conflicts shown, human confirms, stored at the agency layer).
**Alternatives considered:** the primary on the commission row only (the previous form); a full-width summary above the chapters (the 31 Aug form).
**Why this one:** the decision an advisor must make on this record is reachable from wherever she has scrolled to, and the field still offers it where the disagreement is shown.
**What we'd change if wrong:** if the rail reads as a second page, drop the elevation and keep the summary as the first chapter.
**Enforced by:** tier 2 "at most one filled button", "the primary is a pill".

## VIS-073 · 2026-09-10 · proposed
**Decision:** the brief is a document addressed to the person: her day in sentences with the figures inline (serif lead), then chapters in the order of her obligations (commissions · departures · notices · incentives · verification, per `widgetsFor`), each closing in the text action that opens its saved view; the tool that follows is "Today" with the counts and the one primary, "Open the ledger".
**Problem it serves:** T4, "correct but impersonal".
**Evidence:** [P] `01-feedback-deel.md` §2 Problem solving; [P] DEC-12/DEC-13 (commission reconciliation is the first pain; the briefing room is "the first screen I open"); [A] the section unit and the elevated card (`anatomy/01-system-rules.md` §4); [E] a written brief reads as a colleague's note, not a grid.
**Alternatives considered:** keep the card grid with better cards; departures first (the plan's own order in §4.5).
**Why this one:** commissions first because the agency named it first and the demo starts there; the order is logged, which the criterion allows.
**What we'd change if wrong:** if a cold reader names the departures before the ledger as her first task, swap the order and the primary.
**Enforced by:** tier 3 cold read on `/briefing` (names the person and one task); tier 2 "one page title", "at most one filled button".

## VIS-080 · 2026-09-10 · proposed
**Decision:** surface-local components are allowed when they compose registry primitives for one page and nothing else; they are named in the page's header comment and listed here, not in the registry. Today: `AccountRow` (sign-in), `Exchange` · `Foot` · `Mark` · `Cite` · `StateMark` (Ask), `FacetChip` · `Initials` · `TierChip` (records, travellers), `TimelineRow` · `ProjectedAgainstActual` (commission), `FieldLine` · `readingWords` (review), `SeverityChip` · `StateMark` (notifications), `SettingRow` (settings), `SheetBody` (record, commission, review, Ask).
**Problem it serves:** the registry stays small enough to enforce by reading; a page's one-off arrangement does not become a system component by accident.
**Evidence:** [A] Airbnb's per-instance component properties (`--dls-button_*`) live on the instance, not in the token file (`anatomy/01-system-rules.md` §1); [M] fifteen surfaces produced sixteen local components and no new primitive.
**Alternatives considered:** promote each to `bits.tsx`; forbid local components.
**Why this one:** a local component that appears on a second surface is the signal to promote it; until then it is a page's business.
**What we'd change if wrong:** promote `SheetBody` and `SeverityChip` now, since each already appears on more than one page.
**Enforced by:** tier 1 (a local component uses only sys utilities and roles, like any page code); judgement for promotion.

## VIS-081 · 2026-09-10 · proposed
**Decision:** a sheet or dialog is its own surface: it may carry one filled action of its own while the page beneath keeps its one primary.
**Problem it serves:** the one-primary rule and the disclosure pattern would otherwise conflict on every confirm flow.
**Evidence:** [A] the sheet reuses the page's anatomy and carries its own action (`anatomy/components/sheet.md`); [M] tier 2 counts filled buttons in the topmost open layer.
**Alternatives considered:** sheet commits as secondary fills.
**Why this one:** the act a sheet exists for is the most important thing on it while it is open.
**What we'd change if wrong:** nothing structural; the check scope is one line.
**Enforced by:** tier 2 "at most one filled button" (scoped to the topmost layer).
