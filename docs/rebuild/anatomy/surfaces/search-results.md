# Surface: search results

**What it is.** Many entities, scanned. A list of image-first cards beside a map that mirrors them; filters as a band above.

**Confidence.** Computed at 1440 (grid geometry) and 1024 (card internals). Mobile: only the header and tab bar rendered under emulation; the card list did not. Price pins did not render at any width.

## Layout (1440)

| Region | x | Width | Notes |
|---|---|---|---|
| List column | 48 | 630 | 2 cards of 303 + 24 gap; padding-left 48 |
| Map | 727 | 650 | sticky top 192 (header 152 + 40), 684 high |
| Header | 0 | full | 152 sticky: nav 80 + filter band; hairline bottom edge |
| Results H1 | 48 | — | 14/20 400 at y 176 — a count, set as meta |
| First card row | — | — | y 224; row gap 40 |

At 1024 the list is a single 440-wide column; the map keeps ≈45% of the width. The card count per row is derived from the list column's width, not the viewport.

## The card (see `components/card.md`)

Image 4:3, radius 20, no container; 15/19 caption with weight and colour as the only hierarchy; price underlined; overlay pill top-left, heart top-right, arrows on hover. Hover: title underline, image scale 1.04 + secondary elevation.

## Filters (see `components/filter-chip.md`)

A band of 34-high outlined chips, 8 apart, under the nav; the first opens the full filter sheet. Selected state not captured.

## Density per viewport

| | 1440 | 1024 | 375 |
|---|---|---|---|
| Cards per row | 2 | 1 | 1 (expected; not rendered) |
| Card width | 303 | 440 | 327 (expected) |
| Map | 650 sticky | ≈45% sticky | behind a "Map" toggle over a bottom sheet (expected) |
| Header | 152 sticky | 152 sticky | 134 fixed top + 125 tab bar bottom |
| Search control | 48 pill | 48 pill | 58 pill |

## Where actions sit

| Action | Kind | Position |
|---|---|---|
| Open listing | the whole card | — |
| Save | 32 heart | image top-right |
| Change search | segmented pill | header centre |
| Refine | chips | band under header; "Filters" first |
| Toggle map | — | mobile only (expected) |

## What Enable should and should not take

Take: the list-beside-context split with a sticky context panel; the card as image + caption with no frame; the filter band; the count set as meta. Do not take: 4:3 imagery as the card's first element for a records list — Enable's records are facts first, and the affinity map should say whether imagery leads (catalogue) or not (ledger).
