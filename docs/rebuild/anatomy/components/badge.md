# Badge, pill, tag, trust banner

**Purpose.** Small text carriers for status and trust. Four kinds were measured; they differ by where they sit (over imagery, in a caption, in the flow) and by whether they can be pressed.

**Confidence.** Computed at 1024/1440. The trust banner's box was not resolved by the script; its type was.

## Kinds

| Kind | Example | Height | Padding | Radius | Type | Fill | Border | Where |
|---|---|---|---|---|---|---|---|---|
| Overlay pill | Superhost · Guest favorite | 28 | 4 / 10, gap 6 | 40 | 14/18 500 white | `rgba(96,96,96,.6)` | 1px `rgba(255,255,255,.16)` | top-left of the card image, 12 inset |
| Caption tag | Pay €0 today · Free cancellation | 20 | 2.5 / 4 | 6 | 11/15 500 `#6C6C6C` | `rgba(242,242,242,.75)` | none | under the price, 4 apart |
| Status tag (coloured) | one green tag observed | 20 | 2.5 / 4 | 6 | 11/15 500 `#038026` | tint (`#E6F6E9`, from tokens) | none | same row |
| Rating inline | ★ 4.79 (135) | — | — | — | 15/19 400 | none | none | right of the card title |
| Trust banner | laurel · "Guest favorite" · "One of the most loved homes on Airbnb" · 4.9 · 470 reviews | ≈64 (estimate) | 16 (estimate) | 12 (estimate) | 16/20 500 label · 14/18 400 reason · 22/26 500 figures | none | 1px `#DDDDDD` | in the overview section, full column width |
| Elevated notice | ◇ "Rare find! This place is usually booked" | 52 | 0 / 2 | 12 | 14/18 400 | white | hairline + `elevation-secondary` | above the booking card |

## Rules the measurements show

1. **A pill over imagery is dark-translucent with a light hairline** so it reads on any photograph. It never uses the brand colour.
2. **A tag in a caption is the smallest type on the surface (11/15)** and a 6 radius — the smallest radius step above 4. Tags are grey unless they carry a status, and a status tag is *ink on tint*, never tint alone (`#038026` on `#E6F6E9`).
3. **Trust is a row, not a badge.** The "Guest favorite" evidence is laid out as a bordered row with the reason in words and the figures beside it, at section width. The badge on the card is the pointer; the banner on the page is the argument.
4. **Ratings are text.** A star glyph and two numbers at body size, never a coloured chip.
5. **Radius steps by kind:** 6 tag · 12 notice · 40 overlay pill. Only the pill is fully round, because only the pill floats.
6. **Colour is reserved for state.** Of ~300 text nodes measured on the results page, one carried a status colour. Everything else is `#222` or `#6C6C6C`.
