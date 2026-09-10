# Header

**Purpose.** The chrome band: brand left, the search control centred, account right. On results it grows a second band (filters). On the phone it splits into a top search band and a bottom tab bar.

**Confidence.** Computed at 1440 and 375.

## Desktop (1440)

| Property | Listing page | Search results |
|---|---|---|
| Height | 80 | 152 (80 nav + 72 filter band) |
| Position | static | sticky, `0 1px 0 rgba(0,0,0,.10)` bottom edge |
| Background | white | white |
| Logo | 102 × 80 hit area at x 48 | same |
| Search pill | 48 high, 1px `#DDDDDD`, radius 40; three segments (Location · Check in/out · Guests) with radii `40 4 4 40` / `4` / `4 40 40 4`; segment text 14/20 400 with a 12/16 500 label above | same |
| Search button | circular, brand fill (`#DA1249` / gradient), inside the pill's right end | same |
| Right cluster | "Become a host" 40 high pill (14/18 500, padding 11/12, radius 20) · two 40 circle icon buttons (`#F2F2F2`) 12 apart | same |
| Filter band | — | chips 34 high at y 84–118: 12/16 400, 1px `#DDD`, radius 24, padding 8/12, 8 apart; "Filters" chip with an icon first |
| Results count | — | H1 14/20 400 at y 176 ("Over 1,000 homes in Lisbon") |

## Mobile (375)

| Property | Listing page | Search results |
|---|---|---|
| Top | 73 high transparent band over the hero: back (40 circle), share, save | 134 high fixed white: back (40 circle at x 24) · search pill **58 high**, radius 40, 1px `#DDD`, 14/18 500 · chip row at y 90 (34 high, radius 24) |
| Bottom | fixed bottom bar 97 high: price/dates left, Reserve pill right | bottom tab bar: 125 high (44 items + safe area), 1px `#EBEBEB` top, three items 73 wide, 14/20 400, icon above label |

## Rules the measurements show

1. **80 is the chrome module.** Header height, sticky offset for the booking card (top 80), logo hit height. Everything that must clear the header knows one number.
2. **The search control is a segmented pill, not a form.** One 48-high outline, three segments, one brand button. Segments show a label (12/16 500) over a value (14/20 400) — the same label-over-value pattern as the date fields in the booking card.
3. **Filters are a band, not a sidebar.** 34-high outlined chips in a horizontal row under the nav. The band scrolls with the header (sticky) so filters stay in reach.
4. **The results count is an H1 set as meta.** 14/20 400 — the page title on a list surface is deliberately quiet; the cards are the content.
5. **On the phone the header splits by job.** Search goes up (58-high pill, bigger than desktop's 48 for the thumb), navigation goes down (tab bar), and the page's own action (Reserve) gets a bar of its own above the tab bar.
6. **Icon buttons are 40 circles in chrome, 32 over content.**
