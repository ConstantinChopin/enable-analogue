# Image block

**Purpose.** Imagery is the first thing on both surfaces (search card, listing page). The block's job is orientation, not decoration: it is sized by the grid, cropped by `cover`, and framed by one radius on the wrapper.

**Confidence.** Computed at 1440 and 375.

## Hero grid (listing detail, 1440)

| Property | Value |
|---|---|
| Outer box | 1120 × 476 (the full content width) |
| Layout | left tile 560 × 476 · right 2×2 of 272 × 238 / 272 × 230 |
| Gap | 8 |
| Wrapper | radius 12, `overflow: hidden` — tiles themselves radius 0 |
| Ratios | left ≈ 1.18 : 1; right tiles ≈ 1.14 : 1 — all close to 7:6, none 16:9 |
| Overlay | "Show all photos" button bottom-right, 32 high, ≈16 inset (estimate) |
| Position | 24 below the title row; the section that follows starts 32 below (padding 32) |

## Search card image (1440)

4:3 exactly (303 × 228), radius 20 on the wrapper, `cover`. Carousel dots at the bottom centre, arrows 32 at mid-height appear on hover.

## Mobile hero (375)

Full bleed 375 × 356 (≈1.05:1, near-square), radius 0, one image at a time with a counter, top nav floating over it (73 high, transparent). The 5-tile grid collapses to one tile; the grid's job (orientation) is done by swiping instead.

## Tiles

Sleeping-arrangement and similar-stay tiles: radius 12–16, `0 4px 20px rgba(0,0,0,.07)`. Avatars: 100% radius; review avatars small (≈20–40), host avatar large in the identity card.

## Rules the measurements show

1. **One radius, on the wrapper.** Every clipped image gets its corner from the container (12 hero, 16 tile, 20 card, 100% avatar). The `img` never carries a radius. A gallery therefore has sharp inner corners and rounded outer ones.
2. **Radius scales with how isolated the image is.** Inside a grid: 12. Standing alone as a tile: 16. Standing alone as the whole card: 20. Standing alone as a person: 100%.
3. **Gaps are 8 inside an image grid** — half the smallest component padding. Images sit tighter together than text does.
4. **Ratios are wide-ish, not cinematic.** 4:3 for cards, ≈7:6 for the hero tiles, ≈1:1 on the phone. Height is protected; width is what flexes.
5. **Full bleed only on the phone.** At 375 the hero drops its radius and its gutters; everything else on the page keeps the 24 gutter.
6. **Controls over imagery are white-translucent circles**, 32, with the tertiary elevation (`0 2px 4px .18` + 1px 8% ring) so they survive on any photograph.
