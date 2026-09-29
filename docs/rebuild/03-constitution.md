# The constitution — Enable's visual language, Pass 1

**Status:** proposed · **Date:** 2026-09-10 · **Log:** every rule here is a VIS entry in `decisions.md`; this file is the readable form.

**Authority.** The anatomy in `anatomy/` supplies *rules* with measurements behind them. This document supplies Enable's *values*. Where the two are read together the rule is cited; the value is Enable's own. Resemblance to Airbnb is a failure.

**Authorship.** The *Why this one* lines in the log are drafts. Each is marked `proposed` until Constantin rewrites it in his own words, at which point its status becomes `accepted`. Nothing in the narrative quotes a line that is still `proposed`.

---

## 1. Type — two faces, two weights, emphasis by ink

_Revised 2026-09-28 (VIS-092). The 2026-09-10 version set Inter and Newsreader in fourteen roles and four weights; it is kept in the git history and in VIS-010 to VIS-012._

Instrument Sans sets everything (VIS-090). Source Serif 4 sets the page title and the lead, nothing else: the serif marks the two places the page speaks to the person, and its optical axis (8–60) makes the title fine at 28 without a heavier weight.

**Two weights, 400 and 500.** Emphasis is the ink ladder first (label, secondary, tertiary, quaternary), then size, and only then the one step of weight. A row's subject is 500; everything that qualifies it is 400 in a lighter ink.

**One leading per size.** A paragraph of machine text and a row share 14/20; the two leadings of 14 did not read as different, and one role is one fewer choice.

**No capitals.** A field label is meta in tertiary ink, in sentence case.

| Role | Family | Size / leading / weight | Job |
|---|---|---|---|
| `type-title-page` | Source Serif 4 | 28 / 34 / 400 · −0.01em | the page's name, once |
| `type-prose-lead` | Source Serif 4 | 18 / 28 / 400 | the day in sentences, an answer's opening, a refusal |
| `type-section` | Instrument Sans | 16 / 22 / 500 | a chapter title that owns what follows |
| `type-prose` | Instrument Sans | 16 / 24 / 400 · italic for a quoted source | answers, explanations |
| `type-data` | Instrument Sans | 14 / 20 / 400 | the default: rows, cells, controls, paragraphs of machine text; a note's title in secondary ink |
| `type-data-strong` | Instrument Sans | 14 / 20 / 500 | the subject of a row |
| `type-meta` | Instrument Sans | 12 / 16 / 400 · secondary | attribution, dates, chips, counts, field labels (tertiary), machine strings (`tnum`) |
| `type-figure` | Instrument Sans | 18 / 24 / 400 · tnum | the number a section is about |

Rules kept: one display size per surface; the serif never appears below 18.

## 2. Colour — roles, not values

The warm ramp survives (no neutral grey anywhere; the earth is in the ground). Trust states keep the only chroma. The accent stays ink.

**What the anatomy adds:** three distinctions the previous system did not draw.

1. **A fill you can press is a different token from a fill you cannot.** `fill-interactive` (with hover and pressed) versus `bg-sunken`. Same value today; different names, so a change to one cannot silently change the other.
2. **Selected is inverse, not tinted.** `fill-selected` is ink with paper text. A selected chip or tab inverts. This is the feed-forward the panel found missing. _A selected row does not invert: it lifts onto raised paper, the material of the card it opens (VIS-093, 2026-09-28)._
3. **Every interactive role ships its four states.** hover, pressed, selected, disabled, as named tokens. Disabled is a colour swap, never opacity.

| Family | Roles |
|---|---|
| bg | base · raised · overlay · sunken |
| fill | interactive · interactive-hover · interactive-pressed · selected · disabled |
| label | primary · secondary · tertiary · quaternary · placeholder · disabled · on-selected · on-accent |
| stroke | hairline (content rules, control edge at rest) · strong (input segments, secondary emphasis) · hover (ink) · frame |
| accent | ink · ink-hover · ink-pressed · on-ink · ink-disabled · on-ink-disabled |
| trust | ok · warn · crit, each as ink and tint; ink on tint, never tint alone; words beside the colour |

## 3. Spacing — two ladders

Inside a thing: 2 · 4 · 8 · 12 · 16 · 24 · 32. Between things: 16 · 24 · 32 · 40 · 48 · 64. The rule that does the work survives and is now stated across both ladders: **padding inside a container is one or two steps below the gap between containers.**

## 4. Radius — mapped to distance from the page

| Step | px | Used for |
|---|---|---|
| 1 | 4 | segments inside a control, inline code |
| 2 | 8 | controls, inputs, secondary buttons |
| 3 | 12 | cards, popovers, tiles in a list |
| 4 | 16 | the panel frame, the dock, image tiles |
| 5 | 20 | the gallery image |
| 6 | 24 | a person (identity card) |
| 7 | 32 | a sheet over the page |
| pill | 999 | a choice (tabs, segmented, filter chips, 32 high); a state (chips, 24 high); anything that floats over content. Never an action (VIS-042) |

Radius rises with elevation and with how alone the object stands. **Shape says what a control is (VIS-042): a rectangle does, a pill chooses, a chip states, an underline goes.** The primary action is an ink radius-2 rectangle; secondary actions are radius-2 grey fills; tertiary actions are quiet radius-2 rectangles, no fill at rest; the underline is navigation only. (Superseded wording follows.) Tertiary actions are text with an underline. That is the action ladder made visible without colour.

## 5. Elevation — a ladder that starts at a hairline

Flat is step zero of one ladder, not a different system.

| Step | Value | When |
|---|---|---|
| 0 | 1px hairline | everything in the content layer |
| 1 | hairline + `0 2px 4px` 12% | a control over imagery |
| 2 | hairline + `0 6px 16px` 12% | a tool that follows you: the dock, a sticky summary |
| 3 | hairline + `0 6px 20px` 16% | a popover |
| 4 | hairline + `0 8px 28px` 24% | a sheet or dialog |

Shadows are warm (the ink, not black). Nothing in the content layer rises above step 0; a card on the page is a hairline box or nothing.

## 6. States — one grammar

| State | Fills and controls | Text actions | Imagery | Chips and rows |
|---|---|---|---|---|
| hover | fill one step darker | label → ink-pressed, underline | scale 1.04 | stroke → ink |
| pressed | scale 0.96 | — | scale 0.96 | scale 0.96 |
| focus-visible | double ring: 2px paper, 2px ink | same | same | same |
| selected | inverse (ink on paper) | — | — | inverse |
| disabled | named disabled colours; no transform | disabled label | — | disabled label |

One curve (`cubic-bezier(0.2, 0, 0, 1)`) at 200ms for every state change. Press always scales down; hover scales up only imagery, never text.

## 7. Composition

**The section unit.** `padding · title · content · padding · 1px rule`, at column width. Chapters use `type-section`; notes use `type-section-quiet`. Above the fold sections breathe 32, below it 48; 24 on the phone. This replaces the card grid as the page's atom: a record, a brief, a profile are documents with chapters, not tiles.

**Cards exist only for tools.** A hairline box on the page is a tool that must stay in reach while the page scrolls (a sticky summary, a composer). An elevated card (step 2) exists only when that tool follows you. Content is never boxed.

**One primary per surface.** The ink rectangle, at the bottom of the tool that owns it (VIS-042). Secondary actions are grey fills under the content they extend. Text actions live in the title row, right-aligned.

**Disclosure.** Preview in place → one grey button at the content's left edge → a sheet (radius 7, step 4) that reuses the page's row anatomy. Never pagination, never an accordion on desktop.

**Trust is a row of words.** A bordered row at column width: symbol · label · one sentence of reason · figures. Colour never says "trusted". Enable's provenance goes further than the anatomy allows, and there the editorial rules govern: a value carries its source as a footnote, not a badge.

**Per viewport.** Sidebar → fixed bottom bar; text actions → icon buttons; grids → single column; gallery radius → full bleed; chapter padding 32 → 24; section order may change, not only layout.

## 8. Anti-references

Not taken: Cereal, rausch, the photography, the 2025 3D iconography, the card grid, shadcn geometry, Linear's ramp, materials and glass. Any surface an evaluator can name as Airbnb, Linear or shadcn has failed.
