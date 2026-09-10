# Sheet (modal / bottom sheet)

**Purpose.** Progressive disclosure for a long list that the page only previews: amenities (5 of 30 shown inline), reviews, photos. The page shows the first few, the sheet shows all, in the same row anatomy.

**Confidence.** Computed at 1440 (centred modal) and 375 (bottom sheet). The scrim value comes from the token layer; the measured scrim element read `rgba(0,0,0,.25)` with opacity 0 mid-transition.

## Measured properties

| Property | Desktop (1440) | Mobile (375) |
|---|---|---|
| Panel width | 780 | 375 (full) |
| Panel height | 820 (of 900) | 800 (of 812) |
| Position | centred, top 140 | bottom-anchored, slides up |
| Radius | 32 all corners | 32 32 0 0 |
| Shadow | `0 8px 28px rgba(0,0,0,.28)` = `elevation-high` | same |
| Border | none | none |
| Scrim | `overlay-scrim` = rgba(26,26,26,.40) | same |
| Scroll | inner scroller, padding 40 / 24 / 24 | inner scroller |
| Close | 16px × icon, 24 from top-left, no fill, 50% radius hit area | same |
| Title | 22/26 500 (matches a page section title) | **26/30 700** — the sheet title grows and goes bold on mobile |
| Group heading | 18/24 500 | 18/24 500 |
| Row | 73 high, 16/20 400, 24px icon, no divider on the `li` (rule drawn by an inner element) | same |
| Body lock | `body { overflow: hidden }` | same |

## Rules the measurements show

1. **The sheet is the page's largest radius (32).** Cards are 12, the identity card 24, the sheet 32. Radius grows with the element's distance from the page surface — a literal elevation-to-radius mapping.
2. **The row inside the sheet is the row on the page.** Same 16/20 400, same 24 icon; only the height changes (48 on the page in two columns, 73 in the single-column sheet where each row carries a rule).
3. **The close control is an icon, not a button.** 16px glyph, no fill, top-left. The title starts below it (title y 228 vs close y 164 → 64px of head room at desktop).
4. **One scroller.** The panel does not scroll; a padded inner region does, so the radius and shadow stay fixed.
5. **Mobile promotes the title.** 22/26 500 → 26/30 700. It is the only place observed where weight jumps two steps between viewports.

## Composition

- Sheet content width = panel − 2 × 24 = 732 at desktop, 327 at mobile — the same 24 gutter as the mobile page.
- Groups are separated by their 18/24 heading with ~40px above (Bathroom at y 286 after title at 228).
