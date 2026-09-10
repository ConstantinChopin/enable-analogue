# List row

**Purpose.** The unit of structured fact. Four shapes were measured: the **icon row** (amenity), the **icon row with a reason** (highlight), the **person row** (host overview, review), and the **column** (policies). All share one left edge and one type size per line.

**Confidence.** Computed at 1440; sheet rows at 1440 and 375.

## Shapes

| Shape | Height | Icon | Icon → text | Title | Second line | Rule |
|---|---|---|---|---|---|---|
| Amenity (on page, 2 columns) | 48 | 24 | 16 (estimate) | 16/20 400 `#222` | — | none; 24 padding-bottom on the row |
| Amenity (in sheet, 1 column) | 73 | 24 | 16 (estimate) | 16/20 400 | — | 1px rule drawn by an inner element |
| Highlight | 42 + 24 gap | 24 | **32** | 14/20 500 `#222` | 14/20 400 `#6C6C6C` (the reason) | none |
| Host overview | 48 (+24/24 padding) | avatar | 16 | 16/20 500 "Hosted by Eduardo" | 14/18 400 `#6C6C6C` (Superhost · 2 years hosting) | section rule below |
| Review | — | avatar (small) | 12 | 14/18 500 name | 12/16 400 `#6C6C6C` (tenure), then 16/24 400 body | 2×3 grid, 40 gap (estimate) |
| Policy column | — | — | — | 14/18 500 column title | 14/18 400 lines | 3 columns |
| Rating bar | — | — | — | 12/16 500 category | 10/12 400 `#6C6C6C` count | 4px bar, `#222` on `#DDD` |

## Rules the measurements show

1. **The row's type never exceeds 16 and never drops below 12** (10 only for the rating-bar micro labels). Facts are set small; the title above them is what is large.
2. **Two-line rows use the same size on both lines.** Highlight: 14 + 14. Host: 16 + 14 is the one exception, and it is the row that names a person. Hierarchy inside a row is weight (500 → 400) and colour (`#222` → `#6C6C6C`).
3. **Icon column is 24 wide and the gap is large.** 32 on highlights (icon column reads as a margin), 16 on amenities. Icons are line icons at 24, never filled, never coloured.
4. **Row height is a multiple of 8 plus leading.** 48 = 20 + 28; 42 = 20 + 20 + 2; 73 in the sheet = 20 + 52 + 1 rule. Density changes by changing padding, never type.
5. **Rules only where the row can be scanned past.** On the page, amenities have no rules (the 2-column grid and 48 height are enough); in the sheet, where 30 rows run in one column, every row gets a 1px rule.
6. **Reveal, don't paginate.** The page shows 5 of 30 amenities, 6 of 76 reviews, a truncated description; each is followed by a 48-high secondary button "Show all N …" that opens a sheet with the same row anatomy.
