# Input

**Purpose.** Two input shapes were measured: the **label-over-value field** (date pair in the booking card; the header search segments) and the **calendar** (the inline availability grid, the same component the date field opens). No free-text input was captured (search text entry did not open).

**Confidence.** Computed at 1440. The date popover did not open under script; the inline calendar is the same grid and was measured in place.

## Label-over-value field (booking card date pair)

| Property | Value |
|---|---|
| Pair box | 324 × 56, two cells of 162 |
| Divider between cells | 1px `#8C8C8C` (`border-secondary`) — the darkest rule on the page |
| Outer border | 1px `#8C8C8C`, radius 8 (estimate from screenshot; the pair reads as one outlined control) |
| Label | 10/12 700, uppercase, `#222` ("CHECK-IN", "CHECKOUT") |
| Value | 14/18 400, `#000` |
| Padding | ≈10 / 12 (estimate) |
| Behaviour | the whole pair is one button that opens the calendar |

Header search segments use the same pattern at a larger size: label 12/16 500 over value 14/20 400, inside a 48-high pill, segment radii 40/4/4/40.

## Calendar

| Property | Value |
|---|---|
| Grid | 308 wide per month, 2 months side by side (334 pitch), 4 grids mounted for scrolling |
| Month title | 16/20 500 `#222`, 20 high, left-aligned above the grid; prev/next as 12px chevrons |
| Weekday header | not resolved by script (estimate: 12/16 500 `#6C6C6C`) |
| Day cell | 42 × 42 in a 44 pitch (2px gap); `role=button`, `tabindex=-1` |
| Available | 14/18 500 `#222`, no fill |
| Unavailable | 14/18 **400** `#B0B0B0`, `line-through`, `aria-disabled` |
| Check-in / check-out day | 42 circle `#222` fill, 1px `#222`, white 14/18 500; behind it a `#F7F7F7` half-cell (`50% 0 0 50%` / mirrored) that joins the circle to the range |
| In-range day | `#F7F7F7` cell, radius `0 4 4 0` on the range's last cell; a transparent 100% circle with a `#F7F7F7` 1px ring reserved for hover |
| Selected-range colour | none — the range is one step of grey (`bg-primary-hover`), the endpoints are ink |
| Clear dates | text button 12/16 500, 32 high, padding 8/12, radius 8, right-aligned under the grid; no underline (small text-button variant) |
| Section title above | 22/26 500 −2% "2 nights in Lisbon" with 14/18 400 `#6C6C6C` date range beneath |

## Rules the measurements show

1. **Label over value, small caps for the label.** The only uppercase text on the page is the 10/12 700 field label. Uppercase marks "this is a field", nothing else.
2. **The input stroke is darker than the content rule.** `#8C8C8C` for controls, `#DDDDDD` for content — the eye separates "typable" from "readable" by one grey step (`divider.md`).
3. **Selection is ink, range is paper.** Endpoints are filled `#222` circles with inverse text; the days between are the lightest grey. No brand colour in a selection.
4. **Unavailable is weight + colour + strike**, three signals at once, never colour alone.
5. **A day is a 42 circle in a 44 cell.** The 2px gap is what lets adjacent selected circles read as separate.
6. **The calendar lives on the page and in the popover as the same component.** The booking card's field opens what section 10 already shows.
