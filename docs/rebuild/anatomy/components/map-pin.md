# Map pin

**Purpose.** A price on a map; the pin is the card's price line relocated. Selection on the map and hover on the card are linked.

**Confidence.** Partial. The map marker control was measured at 1024; **price pins were not captured** — the map tiles loaded but the price markers never rendered in this browser. Recorded as a gap. The values below are the marker control only.

## Measured

| Property | Value |
|---|---|
| Marker control | 40 × 40, radius 50%, `0 0 0 1px rgba(0,0,0,.02), 0 8px 24px rgba(0,0,0,.10)` (= `elevation-3`) |
| Map panel | 650 wide at 1440, sticky at top 192 (header 152 + 40), 684 high |

## Expected, to verify

From the token layer and the card: a price pin is white, radius pill, 1px hairline, `elevation-tertiary` or `elevation-3`, 14/18 600 `#222`; the selected pin inverts to `bg-interactive-selected` (#222) with white text and scales up. Not cited until measured.
