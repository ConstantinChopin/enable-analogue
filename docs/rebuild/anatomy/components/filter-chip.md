# Filter chip

**Purpose.** A one-tap filter in a horizontal band under the header. The first chip ("Filters", with an icon) opens the full filter sheet; the rest toggle a single facet.

**Confidence.** Rest, hover, active and focus computed at 1440. **Selected state not captured**: the results page stopped rendering after repeated loads, so the click-through did not run. Expected from the token layer: `bg-interactive-selected` (#222) with `text-primary-inverse` (#fff) or a 1px `border-primary` (#222) outline, plus `aria-pressed="true"` — to be verified before it is cited.

## Measured properties (rest)

| Property | Desktop (1440) | Mobile (375) |
|---|---|---|
| Height | 34 | 34 |
| Padding | 8 / 12 | 8 / 12 |
| Radius | 24 | 24 |
| Border | 1px `#DDDDDD` | 1px `#DDDDDD` |
| Fill | white | white |
| Type | 12/16 400 `#222` | 12/16 400 |
| Gap between chips | 8 (x 32 → 141 → 205 …: 84 + 8 + 56 + 8) | 8 (86-wide chips at 95 pitch) |
| Band position | y 84–118 inside the 152 sticky header | y 90 inside the 134 fixed header |
| Leading chip | "Filters" with a sliders icon, same geometry, 84 wide | same |

## States

| State | Value |
|---|---|
| Hover | `border-color: grey500` (#C1C1C1) — the border darkens one step; no fill change |
| Active | shrink by exactly 2px each axis (`scaleX((w−2)/w) scaleY((h−2)/h)`) |
| Focus-visible | `0 0 0 2px #fff, 0 0 0 4px #222` |
| Selected | not captured (see above) |

## Rules the measurements show

1. **Chips are outlines; buttons are fills.** A chip at rest is the only bordered white control on the surface, which is what tells you it is a toggle, not an action.
2. **34 is the chip height** — below the button ladder (48/40/32), between the small button and the header pill, so a band of chips reads lighter than a row of buttons.
3. **12/16 is the chip type**, the smallest interactive text on the page. A filter is a label, not a sentence.
4. **Radius 24 on a 34-high chip is a pill.** Chips and the primary CTA are the two pill families; everything rectangular is 12 or 8.
5. **Hover is a border step, not a fill.** The only hover on the page that does not change background.
