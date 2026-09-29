# Component registry — Enable's system, documented the way Airbnb's was measured

One record per component: purpose · properties · variants · states · composition rule · decision. Values are the tokens the component consumes; a literal here is a bug. Source files under `src/components/ui/` and `src/components/bits.tsx`; the state matrix renders at `/system`.

## Button — `ui/button.tsx` · VIS-041, VIS-060

**Purpose.** The action ladder made visible without colour.

| Variant | Shape | Fill / text | Hover | When |
|---|---|---|---|---|
| `default` | radius-2 rectangle (VIS-042) | ink / on-ink | ink-hover | the ONE primary per surface, at the bottom of the tool that owns it; always an act, never "open" (VIS-095) |
| `secondary` | radius-2 | fill-interactive / label | interactive-hover | under the content it extends; the disclosure button |
| `outline` | radius-2 | raised + hairline / label | stroke → ink | a secondary that must sit on a fill |
| `ghost` | radius-2 | none / label-secondary | fill-interactive | icon buttons in chrome |
| `link` | none | none / label, underline hairline | underline ink | navigation only: it goes somewhere, it never acts |
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

Header: identity (title `type-section`, or `type-data` in secondary ink with `quiet`; at most one qualifier chip) · actions (controls only). Footer: the text action that opens the saved view, or a rule and the tool's action.

## Rows · Row · RowStack — `bits.*`

Hairlines between rows, none under the last; row module 40 (padding 11). `Row` is `subject · meta · trailing` on one line, the subject keeps at least half its width; `RowStack` is two lines when the trailing marks would squeeze it. `inset` adds the 24 gutter inside a tool; in a chapter the column is the edge.

## Table — `ui/table.tsx`

The ledger. Heads `type-meta` tertiary, sentence case, at 32; cells 40 with 16 inline; hairlines inset to the text edge; rows are the selectable row (VIS-093): hover the faintest fill, radius 3; selected lifted onto raised paper at elevation 2 (`data-state="selected"`); the hairlines either side of a lit row fade. Money `tnum`.

## DataList — `bits.DataList`

Label-and-value at the row module, label secondary, value right-aligned, no box. Absence renders the absence vocabulary (`Absent`).

## TrustRow — `bits.TrustRow` · VIS-070

Trust is a row of words: hairline box at column width, 24/16 inside, symbol `icon-lg` · label 14/590 · one sentence `data-read` secondary · figures `tnum`. Colour never says "trusted".

## StatusDot · EvidenceDot · LayerBadge · FreshnessDate · SourceTag · ConfidenceMeter · MoneyValue

Words beside colour, always. `StatusDot` and `EvidenceDot` take the label as a required child. `ConfidenceMeter` is a 64×6 bar on sunken with an ink fill and "n of m sources agree". `SourceTag` is `type-meta tnum` with a 12px icon.

## The attention model — `bits.Blocker`, `bits.Warning`, `bits.Done`, `lib/notify.ts` · VIS-097

Five kinds of message, each with one trigger, place, look and way out.

| Kind | Component | When | Where | Look | Goes away |
|---|---|---|---|---|---|
| Blocker | `Blocker` | you cannot proceed | on the object, at the moment of choice | claret tint, octagon, title + one sentence + one act | only when its condition clears |
| Warning | `Warning` | you can proceed, but decide | inline on the line or field | ochre tint, triangle, sentence, Fix · Keep | by deciding; `kept` collapses it to a neutral line with who and when |
| State | `Chip` (neutral), `StatusDot` | context, no decision | in place | words, no colour | changes with the data |
| Confirmation | `Done`; `notify` | you acted | `Done` in place where the result shows; a toast above the dock where it does not | neutral; the toast lasts ~7 s, pauses on hover, carries Undo when reversible | timeout or Undo |
| Notification | the inbox | it happened without you, or waits on you | Notifications; the Briefing's card shows the top of the same ranked list (`needsYou`) | a row: severity, subject, act | seen on open; resolved when its subject is dealt with (`inboxState`); Defer |

`SeverityBanner` and `ConfirmBanner` remain for their callers, drawn by this model. Colour means severity only.

## Sheet · Dialog — `ui/sheet.tsx`, `ui/dialog.tsx` · VIS-071, VIS-050

A layer over the page: radius-7, elevation 4, warm scrim (ink-pressed at 40%). Sheet right: inset by the frame inset, 480 wide (560 for the resolve sheet); bottom on the phone. Header 24/16 with a hairline; body 24; footer with a hairline. Close is a ghost icon-sm button. The sheet reuses the page's row anatomy.

## Popover · Tooltip · DropdownMenu · Select list

Popover: overlay paper, radius-3, elevation 3, 16 inside. Menu rows 36 with a fill step on focus. Tooltip: inverse, radius-2, `micro`, no arrow.

## PropertyGallery — `layouts.PropertyGallery`

One establishing view large, two stacked; radius-5; 2px gaps; imagery scales 1.04 on hover; the reveal is a secondary button at the content's left edge under the preview; the lightbox is a Dialog.

## Dock — `dock.tsx` · VIS-050, VIS-095

The only persistent chrome, glass. Every tile is the same circle, so the dock never moves; the place you are is the circle filled in its area's colour, and a hairline separates the area groups. The badge counts unseen items waiting on you (`unseenCount`): ink, claret only when one is Critical; the tile's name carries the count for screen readers. Shortcuts 1–9 with the platform's modifier. The account disc lights on the pages behind it (Settings, Connections).

## Frame — `shell.tsx` · VIS-095, VIS-100

Base ground, 12 inset; the panel is raised paper, radius-4, frame stroke; the frame bar in its top edge carries Back and the breadcrumb in `meta`. Every crumb but the last links to its level. The assistant's card takes the right-hand slot on every page except Conversations, where the page is the assistant.

## PageHeader · ListToolbar · ListSearch — `layouts.tsx` · VIS-095

The title row acts, the toolbar views. `PageHeader`: the page's name, one count, at most one create ("New X", secondary); a detail page's own secondary acts in `actions`. `ListToolbar`, directly above the data, in one order: state switch · filters · search · result count and true order · Grid/Table (`ViewToggle`: icon-only segments in a sunken track, the chosen one raised). All toolbar controls 28. `useQueryState` keeps filters, view and selection in the URL.

## SplitPage — `layouts.tsx` · VIS-096

One list-and-detail pattern: a row click selects and opens the inspector (a card, radius-3, elevation 3; a bottom sheet under 1024). Header: name · "Open ↗" (`openHref`) · close. Footer: the item's one next act, pinned (`footer`). Enter or a double-click on a row opens the full page. Opening the assistant closes the inspector.

## ActionBar — `layouts.tsx` · NAV-08

Under 1024, a detail page's primary repeated in a bar pinned to the bottom of the scroll; hidden at lg, where the rail follows you.

## ShareSheet — `share-sheet.tsx` · VIS-101

"Who can see this?": Only me · The Paris desk · The whole agency (a traveller: the people it is shared with), each with its consequence; Cancel then the act at the right; closes on commit with a toast that carries Undo.

## Schematic — `bits.SchematicBadge`, `bits.SchematicAction` · COL-09

Drawn, not wired: a dashed outline in tertiary ink, never a status colour and never the primary. `SchematicAction` keeps the control's place and label, is announced as unavailable, and says "Not wired in this build" when pressed.
