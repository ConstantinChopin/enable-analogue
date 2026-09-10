# The constitution — Enable's visual language, Pass 1

**Status:** proposed · **Date:** 2026-09-10 · **Log:** every rule here is a VIS entry in `decisions.md`; this file is the readable form.

**Authority.** The anatomy in `anatomy/` supplies *rules* with measurements behind them. This document supplies Enable's *values*. Where the two are read together the rule is cited; the value is Enable's own. Resemblance to Airbnb is a failure.

**Authorship.** The *Why this one* lines in the log are drafts. Each is marked `proposed` until Constantin rewrites it in his own words, at which point its status becomes `accepted`. Nothing in the narrative quotes a line that is still `proposed`.

---

## 1. Type — two voices, one optical floor

Inter for the machine, Newsreader for the person. Survives from the previous language on its original evidence (both carry an optical-size axis; the x-height ratio separates the registers).

**The floor moves to 14.** Inter's optical axis runs 14 to 32. The previous body of 13/16 sat below the axis, so the argued optical behaviour did not apply at the size the product mostly rendered. The data body is now 14/18, the smallest size at which the argument holds. (Anatomy: product UI body is 14/18 scanned, 16/24 read; the largest product title is 26.)

**Two leadings per size, chosen by role.** Scanned text at about 1.3, read text at about 1.45. A row is scanned; a paragraph of machine text is read.

| Role | Family | Size / leading / weight | Job |
|---|---|---|---|
| `type-data` | Inter | 14 / 18 / 400 | the default: rows, cells, controls |
| `type-data-read` | Inter | 14 / 20 / 400 | paragraphs of machine text |
| `type-data-strong` | Inter | 14 / 18 / 590 | the subject of a row; emphasis at the same size |
| `type-meta` | Inter | 12 / 16 / 400 · secondary | attribution, dates, secondary facts |
| `type-micro` | Inter | 11 / 14 / 510 | chips, counts, small labels |
| `type-micro-caps` | Inter | 10 / 12 / 700 · caps · 0.04em | a field's label inside a control |
| `type-code` | Plex Mono | 11 / 14 / 510 | identifiers, refs |
| `type-figure` | Inter | 18 / 24 / 510 · tnum · −0.01em | the number a section is about |
| `type-section` | Inter | 16 / 20 / 590 · −0.005em | a chapter title that owns what follows |
| `type-section-quiet` | Inter | 14 / 18 / 400 · secondary | a note's title, not a chapter's |
| `type-title-page` | Newsreader | 26 / 30 / 500 · −0.02em | the page's name, once |
| `type-prose-lead` | Newsreader | 18 / 28 / 400 | an answer's opening sentence, a refusal |
| `type-prose` | Newsreader | 16 / 24 / 400 | answers, explanations, the brief |
| `type-prose-quote` | Newsreader | 15 / 24 / 400 · italic | a quoted source |

Rules kept: weight is the first level of emphasis; the serif never appears below 15; one display size per surface; tracking tightens only at 16 and above.

## 2. Colour — roles, not values

The warm ramp survives (no neutral grey anywhere; the earth is in the ground). Trust states keep the only chroma. The accent stays ink.

**What the anatomy adds:** three distinctions the previous system did not draw.

1. **A fill you can press is a different token from a fill you cannot.** `fill-interactive` (with hover and pressed) versus `bg-sunken`. Same value today; different names, so a change to one cannot silently change the other.
2. **Selected is inverse, not tinted.** `fill-selected` is ink with paper text. A selected chip, tab or row inverts. This is the feed-forward the panel found missing.
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
| pill | 999 | the one primary action per surface; chips; anything that floats over content |

Radius rises with elevation and with how alone the object stands. **The primary action is a pill**, and it is the only pill that acts; secondary actions are radius-2 grey fills; tertiary actions are text with an underline. That is the action ladder made visible without colour.

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

**One primary per surface.** The pill, at the bottom of the tool that owns it. Secondary actions are grey fills under the content they extend. Text actions live in the title row, right-aligned.

**Disclosure.** Preview in place → one grey button at the content's left edge → a sheet (radius 7, step 4) that reuses the page's row anatomy. Never pagination, never an accordion on desktop.

**Trust is a row of words.** A bordered row at column width: symbol · label · one sentence of reason · figures. Colour never says "trusted". Enable's provenance goes further than the anatomy allows, and there the editorial rules govern: a value carries its source as a footnote, not a badge.

**Per viewport.** Sidebar → fixed bottom bar; text actions → icon buttons; grids → single column; gallery radius → full bleed; chapter padding 32 → 24; section order may change, not only layout.

## 8. Anti-references

Not taken: Cereal, rausch, the photography, the 2025 3D iconography, the card grid, shadcn geometry, Linear's ramp, materials and glass. Any surface an evaluator can name as Airbnb, Linear or shadcn has failed.
