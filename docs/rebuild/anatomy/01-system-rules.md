# Airbnb's system — the cross-cutting rules

What the measurements show when read together. Every rule names the evidence it rests on (`raw/…` or a component record). Values are Airbnb's; the *rules* are what Enable's constitution may cite.

## 1. Scales

### Spacing — two ladders, one overlap

| Ladder | Steps | Job | Evidence |
|---|---|---|---|
| micro | 2 · 4 · 8 · 12 · 16 · 24 · 32 | inside a component | tokens `--spacing-micro*` |
| macro | 16 · 24 · 32 · 40 · 48 · 64 · 80 | between sections | tokens `--spacing-macro*` |

Observed use: image gaps 8 · tag gaps 4 · chip gaps 8 · button padding 8/14/24 · card padding 16/24 · section padding 24/32/40/48 · header module 80. **The rule:** padding inside a thing is one or two steps below the gap between things (24 inside a card, 48 between sections). Enable's current "16 inside, 24 between" is the same rule with a smaller pair.

### Radius — eight steps, mapped to distance from the page

| Step | 4 | 8 | 12 | 16 | 20 | 24 | 32 | pill |
|---|---|---|---|---|---|---|---|---|
| Used for | inputs, segments | small buttons, text-button pads | cards, medium buttons, hero grid, sheets' rows | image tiles | card image | identity card | sheet | primary CTA, chips, overlay pills |

**The rule:** radius rises with elevation and with how alone the object stands (`card.md` §Composition). A pill is reserved for the one primary action and for things that float (chips, overlay badges).

### Type — sizes 10 · 12 · 14 · 15 · 16 · 18 · 22 · 26, two leadings per size

| Size | UI leading | Reading leading | Weights used |
|---|---|---|---|
| 10 | 12 | — | 400, 700 (caps labels) |
| 12 | 16 | — | 400, 500 |
| 14 | 18 | 20 | 400, 500, 600 |
| 15 | 19 | — | 400, 500 (cards only) |
| 16 | 20 | 22, 24 | 400, 500, 600 |
| 18 | 24 | 28 | 400, 500 |
| 22 | 26 | — | 500, 600 (−2% tracking) |
| 26 | 30 | — | 500, 600 (−2% tracking) |

**The rules:** (a) the *role* decides leading — scanned text at ≈1.25, read text at 1.5 (`tokens` typography roles; description 16/24 vs rows 16/20). (b) Emphasis is a weight step at the same size (66 × 14/18 500 beside 66 × 14/18 400 on the listing page). (c) Tracking tightens only at 22+. (d) The largest product title is 26; display sizes exist but never reach a product surface. (e) One display size per surface: one 26 H1, then 22 sections, then 16/14.

### Elevation — a hairline plus blur, six numbered, four named

Every shadow begins `0 0 0 1px rgba(0,0,0,.02)` and adds blur (`tokens` elevation). Named roles: tertiary (controls over imagery) · secondary (cards that follow you) · primary (popovers) · high (sheets). Elevation 0 is a 1px `#DDD` inset border — "flat" is step zero of the same ladder, not a different system.

## 2. Colour roles

| Family | Levels | Values | Rule |
|---|---|---|---|
| text | primary · secondary · tertiary · quaternary + placeholder, disabled, inverse | #222 · #6C6C6C · #8C8C8C · #515151 | four levels; hierarchy by level, never by size |
| bg | primary · secondary · quaternary + interactive · interactive-selected · divider | #FFF · #F7F7F7 · #F2F2F2 · #F2F2F2 · #222 · #EBEBEB | a fill you can press (#F2F2F2 interactive) is a different token from a fill you cannot (#F7F7F7) |
| border | primary · secondary · tertiary | #222 · #8C8C8C · #DDD | control edge · input segment · content rule (`divider.md`) |
| icon | primary · secondary · tertiary · disabled + status | #222 · #6C6C6C · #8C8C8C · #C1C1C1 | icons follow the text ladder |
| status | alert · warning · success · neutral, each as ink + tint | #D7251C/#FFE6E2 · #EB6100/#FDE8D4 · #038026/#E6F6E9 · #C1C1C1 | ink on tint, never tint alone; words beside the colour (`badge.md`) |
| brand | one hue + gradient | #FF385C · #DA1249 | confined to logo, primary CTA, search button, selected heart |

**The rule:** the content layer is grey-scale; chroma means state or the single primary action. Every interactive role ships its own hover / pressed / selected / disabled value; disabled is a colour swap, never opacity. A warm neutral ramp (beige) coexists with the grey one — evidence that a warm register can live inside the same role structure.

## 3. State grammar (from `interactive-states.json`)

| State | Fills | Text controls | Imagery / round controls | Chips |
|---|---|---|---|---|
| hover | fill one step darker | colour → #000, grey pad behind | scale 1.04 + secondary elevation · scale 1.08 | border one step darker |
| active | shrink exactly 2px per axis; ripple | scale 0.96 | scale 0.92 | shrink 2px |
| focus-visible | double ring 2px white + 2px #222, 0.2s | 2px #222 + 2px white-80 | same | 2px white + 2px #222 |
| disabled | named disabled colours; no transform; no gradient | disabled colour; transparent | — | — |

One easing (`cubic-bezier(.2,0,0,1)`) at 0.2s for state changes; springs exist for layout motion (452–762 ms). Press always scales *down*; hover scales *up* only imagery and round controls, never text.

## 4. Composition

### Container and columns
- Content max 1120, centred; gutters ≈152 at 1440, 24 at 375.
- Entity page: **653 | 93 | 372** — content, gap, sticky sidebar (top 80 = header height).
- List page: **630 | 49 | 650** — list, gap, sticky map (top 192 = header + 40).

### The section unit
`padding · title · content · padding · 1px rule`. Padding 32 above the fold, 48 below; 24/32 on the phone. Title 22/26 500 −2% for chapters; 16/20 400 for notes. Rules span the column, never the page (`divider.md`).

### Disclosure
Preview in place → one 48-high grey button at the content's left edge → a sheet (radius 32, elevation high) that reuses the page's row anatomy. Never a tab, never pagination, never an accordion on desktop (`listing-detail.md`).

### Actions
- One primary per surface, the only pill, at the bottom of the tool that owns it (sidebar card / bottom bar).
- Secondary actions are grey fills under the content they extend.
- Text actions live in the title row, right-aligned, underlined.
- Icon buttons: 40 in chrome, 32 over content.

### Trust
A bordered row at column width: symbol · label · one sentence of reason · figures. Words and numbers in body type; no colour says "trusted" (`badge.md`, `listing-detail.md`).

### Per-viewport transformation (1440 → 375)
- Sidebar → fixed bottom bar; text buttons → icon buttons over imagery.
- Grids → single column or carousel; columns → stack.
- Hero grid radius 12 → full bleed radius 0.
- Section padding 48/48 → 32/24; title weight 500 → 600; overview title demotes to meta; sheet title promotes to 26/700.
- Section *order* changes (Location promoted), not just layout.

## 5. What is absent (and why it matters for Enable)

- **No provenance.** Facts are stated, never cited. The one evidence block is the trust banner. Enable's whole argument is provenance, so this is where the affinity map must switch to the editorial reference (footnote, sidenote, caption logic).
- **No dense tables.** The densest structure is a 2-column icon list at 48/row. Ledgers, reconciliation sheets and multi-source rows have no Airbnb analogue.
- **No multi-persona states.** Permission-gated absence has no pattern here.
- **No system-generated summaries.** Nothing on these surfaces is a briefing; the personal register the plan asks for must come from elsewhere.
