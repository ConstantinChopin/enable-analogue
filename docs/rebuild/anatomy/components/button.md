# Button

**Purpose.** Five kinds, each defined by a job, not a colour: the one action that completes the surface (primary), the actions that expand or continue (secondary), the small action over imagery (small secondary), the actions that are really links (text), and the icon-only controls.

**Confidence.** All values computed from the DOM at 1440 and 375. Hover, focus, active and disabled from the CSSOM.

## Measured properties

| Kind | Example | Height | Padding | Radius | Type | Fill | Border |
|---|---|---|---|---|---|---|---|
| Primary | Reserve | 48 | 14 / 24 | 999 (pill) | 16/20 500, white | brand gradient (`bg-secondary-core`) | none |
| Secondary | Show more · Show all 30 amenities · Show all 76 reviews | 48 | 14 / 24 | 12 | 16/20 500, `#222` | `#F2F2F2` (`bg-interactive`) | none |
| Small secondary | Show all photos | 32 | 8 / 16 | 8 | 12/16 500, `#222` | `#F2F2F2` | 1px `#222` |
| Header outline | Become a host | 40 | 11 / 12 | 20 | 14/18 500 | none | none (hover pad) |
| Text | Share · Save · Report this listing · Show price breakdown | 34 | 8 / 8 | 8 | 14/18 500, underlined | none | none |
| Icon | language · menu · wishlist · carousel arrows | 40 (header) · 32 (over imagery) | — | 50% | — | `#F2F2F2` in chrome · `rgba(255,255,255,.9)` over imagery | 1px `rgba(0,0,0,.08)` over imagery |

Mobile: secondary buttons become full-width (327 in a 375 viewport); the primary keeps its intrinsic width (173) inside a fixed bottom bar.

## Rules the measurements show

1. **One primary per surface, and it is the only pill.** The Reserve action is the only 999-radius rectangle on the listing page. Every other button is 12 or 8. The pill *is* the primary signifier; the colour is secondary to the shape.
2. **Secondary buttons are fills, not outlines.** `#F2F2F2` on white, no border. Emphasis order is: gradient fill → grey fill → bordered small fill → underlined text.
3. **Height ladder is 48 · 40 · 34 · 32.** 48 for anything that commits or expands content, 40 for chrome, 32–34 for actions that sit on or beside content.
4. **Text buttons are underlined at rest.** The underline is the affordance; hover adds a grey 8-radius pad behind, it does not add the underline.
5. **Radius follows height.** 48 → 12, 40 → 20 (chrome pill), 32 → 8. The small button is not a scaled-down large one; it gets the next radius step down.
6. **Padding is 14/24 at 48, 8/16 at 32.** Vertical padding is derived: (48 − 20 leading) / 2 = 14; (32 − 16) / 2 = 8. Height is the decision; padding follows the leading.

## States (from `interactive-states.json`)

| State | Primary / secondary | Text | Icon |
|---|---|---|---|
| Hover | fill → `*_hover` token (darker); border → `*_hover` | colour → `text-primary-hover` (#000); grey pad `bg-primary-hover` (#F7F7F7) | scale 1.08 |
| Active | fill → `*_active`; **shrink by exactly 2px** each axis (`scaleX((w−2)/w)`) ; a ripple fades over 2s | scale 0.96 | scale 0.92 |
| Focus-visible | `outline: none`; ring = `0 0 0 2px white, 0 0 0 4px #222`; 0.2s standard curve | `0 0 0 2px #222, 0 0 0 4px rgba(255,255,255,.8)` | same as text |
| Disabled | `cursor: not-allowed`; fill/colour → `*_disabled` tokens; transform none; gradient removed | colour → `text-primary-disabled` (#C1C1C1); transparent | — |

The state grammar is one set of named properties (`--dls-button_{background|color|border-color}_{hover|active|focus|disabled}`) applied to every kind; only the values differ. Disabled is never opacity.

## Composition

- The primary sits at the bottom of its container (sidebar card, bottom bar), full-width in the card (324 of 372 → 24 inset), intrinsic in the bar.
- Secondary "show all" buttons sit left-aligned under the content they expand, at the content's left edge, with the section's bottom padding (48) beneath them.
- Text buttons pair right-aligned in the title row (Share · Save) with 8px between.
