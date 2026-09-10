# Airbnb design-system anatomy — index

**Phase A of the Enable visual-language rebuild.** Airbnb's product UI, reverse-documented from the DOM and computed styles, so the constitution can cite a measured pattern rather than an impression.

**Method.** In-app browser (Chromium), logged out, viewports 1440×900 and 375×812. Every value comes from `getComputedStyle` or `getBoundingClientRect` unless marked *estimate*. Interactive states come from the CSSOM (`:hover`, `:focus-visible`, `:active`, `:disabled` rules matched against live elements), not from hovering by hand. The DLS token layer was read directly from the site's CSS custom properties. Screenshots were working material only; none are deliverables.

**What we take, and what we do not.** We take the *structure*: which scales exist, how many steps they have, how roles are named, how a section is built, where actions sit, what changes per viewport, how a state is expressed. We do not take Cereal, rausch, the photography, the icon set, or the copy. Resemblance to Airbnb is a failure (see the constitution's anti-reference list).

## Files

### Raw measurements (`raw/`)

| File | What it holds |
|---|---|
| `airbnb-dls-tokens.json` | The token layer itself: 540 custom properties — radius scale, two spacing ladders, typography roles, elevation 0–5 + named, materials, motion curves and springs, palette ramps and ~200 semantic colour roles |
| `listing-detail-1440-top.json` | Title, hero grid, overview, booking sidebar, header at 1440 |
| `listing-detail-1440-full.json` | Every section in order with padding and heading roles; type/colour/radius/shadow census; derived scales |
| `listing-detail-375-mobile.json` | The same page at 375: gutters, section rhythm, what moves, what disappears |
| `search-results-1440.json` | Split layout, card grid, card anatomy, filter chips, map |
| `interactive-states.json` | Hover / focus / active / disabled grammar per component kind |

### Component records (`components/`)

One record per recurring element. Each record: purpose · measured properties · variants · states · composition rules · confidence.

- `button.md` — primary pill, secondary fill, small secondary, text, icon
- `card.md` — the listing card (image-first) and the identity card
- `image-block.md` — hero grid, tile, carousel, ratios and radii
- `list-row.md` — icon rows (amenities, highlights), review rows, policy columns
- `sheet.md` — modal sheet desktop and bottom sheet mobile
- `badge.md` — overlay pill, tag, trust banner
- `filter-chip.md` — chips and the Filters trigger
- `header.md` — nav bar, search pill, sticky behaviour
- `divider.md` — section rules and hairlines
- `input.md` — date fields, search segments, calendar
- `map-pin.md` — price pins and marker controls

### Surface records (`surfaces/`)

One record per surface type: section order, spacing between sections, density per viewport, image ratios, what is hidden and how it is revealed, where primary and secondary actions sit.

- `listing-detail.md`
- `search-results.md`
- `host-dashboard.md`, `messaging.md`, `checkout.md` — **not captured**: account-required, and the logged-in session was not reachable from this browser. Recorded as gaps, not guessed.

### Cross-cutting summary

- `01-system-rules.md` — the spacing scale, the radius scale, the colour roles, the type hierarchy, the elevation ladder, the state grammar, and the composition rules, each with the measurement that supports it.

## Coverage

| Surface | 1440 | 375 | States |
|---|---|---|---|
| Listing detail | full | full | buttons, text buttons, card hover, focus, disabled |
| Search results | full | header and tab bar only (cards never rendered under emulation) | card, chip, wishlist |
| Filters (chips + sheet trigger) | measured | measured | hover/focus/active; **selected not captured** |
| Sheet / modal | full | full | — |
| Input / calendar | full (date field, calendar with available / blocked / endpoint / in-range) | — | endpoint, in-range, blocked |
| Map pin | marker control only; **price pins never rendered** | — | — |
| Host dashboard, messaging, checkout | — | — | — |

**Why some gaps.** The Claude in Chrome extension (which would have used Constantin's logged-in session) was not connected during this pass, so the in-app browser ran logged out. After roughly a dozen loads the search-results page stopped rendering its card list, which is what blocked the selected-chip and price-pin captures. Both are cheap to finish once the extension is connected.
