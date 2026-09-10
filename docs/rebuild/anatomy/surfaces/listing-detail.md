# Surface: listing detail

**What it is.** One entity, presented in full: imagery, structured facts, trust evidence, a description, the people involved, the rules, and one action. The surface Enable's product record most resembles.

**Confidence.** Computed at 1440 (full page, 7324 high) and 375 (7781 high).

## Section order and spacing (1440)

Container 1120 wide, centred, ≈152 gutters. Below the hero the page splits **653 | 93 | 372** (content | gap | sticky sidebar). Sections are separated by a 1px `#DDD` rule at column width.

| # | Section | Width | Padding (top/bottom) | Title role |
|---|---|---|---|---|
| 1 | Title row (H1 + Share/Save) | 1120 | 24 / 0 | 26/30 500 |
| 2 | Hero grid | 1120 | 24 / 0 | — |
| 3 | Overview (place type, beds, rating) | 653 | 32 / 32 | 22/26 500 −2% |
| 3a | Trust banner (Guest favourite) | 653 | 0 / 12 | 16/20 500 + figures |
| 4 | Host overview | 653 | 24 / 24 | 16/20 500 |
| 5 | Highlights (3 icon rows) | 653 | 32 / 32 | 16/20 400 (quiet) |
| 6 | Translation notice | 653 | 32 / 0 | — |
| 7 | Description (truncated + Show more) | 653 | 32 / 48 | — (16/24 400 body) |
| 8 | Where you'll sleep (tiles) | 653 | 48 / 48 | 22/26 500 −2% |
| 9 | Amenities (5 of 30, 2 columns + Show all) | 653 | 48 / 48 | 22/26 500 −2% |
| 10 | Availability (2-month calendar) | 653 | 48 / 48 | 22/26 500 −2% |
| S | Booking card (sidebar) | 372 | sticky top 80 | 22 500 price |
| 11 | Reviews (rating title, bars, 2×3 grid + Show all) | 1120 | 48 / 48 | 26/30 500 −2% |
| 12 | Where you'll be (map) | 1120 | 48 / 48 | 22/26 500 −2% |
| 13 | Meet your host (identity card + stats) | 1120 | 40 / 40 | 22/26 500 −1% |
| 14 | Things to know (3 columns) | 1120 | 48 / 48 | 16/20 400 (quiet) |
| 15 | More stays nearby (carousel) | 1120 | 32 / 40 | 22/26 500 |
| 16 | Explore other options (SEO links) | full bleed | 48 / 48 | — |

**Rhythm.** Above the fold sections breathe 32; below the fold 48. Two "quiet" sections (Highlights, Things to know) use a 16/20 400 title so they read as notes, not chapters. Section titles are the only −2% tracking on the page.

## Density per viewport

| | 1440 | 375 |
|---|---|---|
| Gutter | ≈152 | 24 |
| Columns | 2 (content + sticky sidebar) | 1 |
| Section padding | 32 → 48 | 24 → 32 (top) / 24 (bottom) |
| Hero | 5-tile grid, radius 12 | 1 full-bleed image, radius 0 |
| Amenities | 2 columns, 5 rows | 1 column |
| Reviews | 2 × 3 grid | horizontal carousel |
| Policies | 3 columns | stacked |
| Section title weight | 500 | 600 |
| Overview title | 22/26 500 | demoted to 14/18 400 meta |

**Order change at 375:** Location moves up to sit right after Amenities, before the calendar and reviews.

## What is hidden and how it is revealed

| Content | Shown inline | Reveal | Where it opens |
|---|---|---|---|
| Photos | 5 of N | "Show all photos" small button on the hero | full-screen gallery |
| Description | ≈6 lines | "Show more" secondary button | sheet |
| Amenities | 5 of 30 | "Show all 30 amenities" secondary button | sheet (32 radius, same rows) |
| Reviews | 6 of 76 | "Show all 76 reviews" secondary button | sheet |
| Host details | card + 3 stats | "Message host" / profile | page |
| Policies | first lines of 3 columns | "Show more" text link per column | sheet |

The pattern is constant: *preview in place → one 48-high grey button at the content's left edge → a sheet that reuses the page's row anatomy.* Nothing is paginated; nothing is behind a tab.

## Where actions sit

| Action | Kind | Position |
|---|---|---|
| Reserve | primary pill | bottom of the sticky booking card (1440) · fixed bottom bar, right (375) |
| Share · Save | text buttons | title row, right-aligned (1440) · icon buttons over the hero (375) |
| Show all … | secondary fill | left edge under the previewed content |
| Report this listing | text link | under the booking card, centred |
| Verify provenance of a value | — | **absent** — Airbnb states facts, it does not cite them; the trust banner is the only evidence block |

## Trust display (the part Enable should study)

Trust is a *section*, not a badge: laurel + label + a sentence of reason + the two figures (4.9 · 470 reviews), inside a bordered row at column width, placed before the host and before the facts. Ratings are text, reviews are quotes with names and dates, the host is a person with tenure. Every trust element is words and numbers in the body type; colour is never used to say "trusted".
