# Component registry — Enable's system, documented the way Airbnb's was measured

One record per component: purpose · properties · variants · states · composition rule · decision. Values are the tokens the component consumes; a literal here is a bug. Source files under `src/components/ui/` and `src/components/bits.tsx`; the state matrix renders at `/system`.

## Button — `ui/button.tsx` · VIS-041, VIS-060

**Purpose.** The action ladder made visible without colour.

| Variant | Shape | Fill / text | Hover | When |
|---|---|---|---|---|
| `default` | pill (999) | ink / on-ink | ink-hover | the ONE primary per surface, at the bottom of the tool that owns it |
| `secondary` | radius-2 | fill-interactive / label | interactive-hover | under the content it extends; the disclosure button |
| `outline` | radius-2 | raised + hairline / label | stroke → ink | a secondary that must sit on a fill |
| `ghost` | radius-2 | none / label-secondary | fill-interactive | icon buttons in chrome |
| `link` | none | none / label, underline hairline | underline ink | text actions in the title row |
| `destructive` | radius-2 | crit / on-ink | brightness | the one filled action that removes something; never a pill |

Sizes: `default` 40 (row module) · `sm` 32 · `icon` 40 round · `icon-sm` 32 round. Type 14/18 510. Press scales 0.96; focus is the double ring; disabled is `ink-disabled / on-ink-disabled` or `fill-disabled / label-disabled`.

## Input · Textarea · Select · `ui/*` · VIS-022, VIS-060

Radius-2, hairline at rest, ink stroke on hover and focus, text 14/18 **400** (a field's text is what the user typed). Sizes `sm` 32 / `md` 40 mirror Button so controls of one class on one line agree. Placeholder `label-placeholder`; disabled `fill-disabled / label-disabled`; invalid `crit` stroke. Textarea grows; padding 16/10, leading 20 (read).

## Checkbox · Radio · Switch · VIS-021

18px; hairline-strong at rest; **checked is inverse** (ink box, paper mark; ink ring, paper dot; ink track, paper thumb). Focus double ring. Disabled `fill-disabled`.

## Chip — `bits.Chip` · VIS-070

A status carrier, never an action. 24 high, pill, 11/14 510. Fill is reserved for severity: `warn` and `crit` take ink on tint; `neutral` `ok` `primary` are outlined so the row's subject stays on top. Words always.

## FilterChip — `bits.FilterChip` · VIS-021

A chip you can press: 32 high, pill, 14/18 510, hairline at rest, ink stroke on hover, **inverse when selected**, `aria-pressed`. Optional count in `micro`.

## Segmented · Tabs — `bits.Segmented`, `ui/tabs.tsx` · VIS-021

A row of FilterChips with `role=tab`. Tabs `line` variant: text tabs on a hairline; the selected one carries a 2px ink rule and the primary label.

## Badge — `ui/badge.tsx`

A status tag inline with text: 20 high, radius-1, 11/14 510, ink on tint (`ok` `warn` `crit`) or sunken / outlined for neutral. Not a pill (it does not float).

## Section — `bits.Section` · VIS-070

The page's atom.

| Variant | Surface | Padding | When |
|---|---|---|---|
| `chapter` (default) | none; hairline rule below | 32 block (48 `deep`; 24 on the phone) | content: a record's layer, a brief's obligations, a profile's facts |
| `tool` | raised, radius-3, elevation 0 (`follows` → elevation 2) | 24 | something that must stay in reach while the page scrolls: a sticky summary, a composer |
| `padded` · `list` | transitional boxed card | 16 | to be removed when the last surface leaves them |

Header: identity (title `type-section`, or `type-section-quiet` with `quiet`; at most one qualifier chip) · actions (controls only). Footer: the text action that opens the saved view, or a rule and the tool's action.

## Rows · Row · RowStack — `bits.*`

Hairlines between rows, none under the last; row module 40 (padding 11). `Row` is `subject · meta · trailing` on one line, the subject keeps at least half its width; `RowStack` is two lines when the trailing marks would squeeze it. `inset` adds the 24 gutter inside a tool; in a chapter the column is the edge.

## Table — `ui/table.tsx`

The ledger. Heads `type-micro-caps` tertiary at 32; cells 40 with 16 inline; hairlines; hover a fill step; selected row = 2px ink left edge (`data-state="selected"`). Money `tnum`.

## DataList — `bits.DataList`

Label-and-value at the row module, label secondary, value right-aligned, no box. Absence renders the absence vocabulary (`Absent`).

## TrustRow — `bits.TrustRow` · VIS-070

Trust is a row of words: hairline box at column width, 24/16 inside, symbol `icon-lg` · label 14/590 · one sentence `data-read` secondary · figures `tnum`. Colour never says "trusted".

## StatusDot · EvidenceDot · LayerBadge · FreshnessDate · SourceTag · ConfidenceMeter · MoneyValue

Words beside colour, always. `StatusDot` and `EvidenceDot` take the label as a required child. `ConfidenceMeter` is a 64×6 bar on sunken with an ink fill and "n of m sources agree". `SourceTag` is `type-code` with a 12px icon.

## SeverityBanner · ConfirmBanner · Alert

Ink on tint, radius-3, 16/12 inside, `data-read`. Info is sunken; Important ochre; Critical claret; ok moss. No left border stripe.

## Sheet · Dialog — `ui/sheet.tsx`, `ui/dialog.tsx` · VIS-071, VIS-050

A layer over the page: radius-7, elevation 4, warm scrim (ink-pressed at 40%). Sheet right: inset by the frame inset, 480 wide (560 for the resolve sheet); bottom on the phone. Header 24/16 with a hairline; body 24; footer with a hairline. Close is a ghost icon-sm button. The sheet reuses the page's row anatomy.

## Popover · Tooltip · DropdownMenu · Select list

Popover: overlay paper, radius-3, elevation 3, 16 inside. Menu rows 36 with a fill step on focus. Tooltip: inverse, radius-2, `micro`, no arrow.

## PropertyGallery — `layouts.PropertyGallery`

One establishing view large, two stacked; radius-5; 2px gaps; imagery scales 1.04 on hover; the reveal is a secondary button at the content's left edge under the preview; the lightbox is a Dialog.

## Dock — `dock.tsx` · VIS-050

The only persistent chrome: overlay paper, radius-4, elevation 2 (it follows you). Tiles 44 radius-3; the active tile is **inverse**; the badge is crit with an overlay ring. Utilities 36 ghost; the account is a sunken disc.

## Frame — `shell.tsx`

Base ground, 12 inset; the panel is raised paper, radius-4, frame stroke; the frame bar above it carries back · forward · breadcrumb in `meta`.
