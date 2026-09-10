# Card

**Purpose.** Three different objects share the word: the **listing card** (an entity in a list — image first, facts second, no container), the **elevated card** (a tool that floats over the page — the booking card), and the **identity card** (a person — the host). They are not variants of one component; they differ in whether they have a surface at all.

**Confidence.** Listing card internals computed at 1024 (single column, 440 wide) and geometry at 1440 (303 wide). Booking and identity cards computed at 1440.

## 1. Listing card (search results, similar-listings carousel)

| Property | Value |
|---|---|
| Container | **none** — no border, no fill, no padding, no shadow at rest |
| Width | 303 in a 2-column list beside a map (1440); 440 single column (1024); 24 column gap, 40 row gap |
| Image | 4:3 (303×228 · 440×330), `object-fit: cover`, **radius 20 on the wrapper**, image itself radius 0 |
| Text block | starts ≈12 below the image; lines at 15/19 |
| Title | 15/19 500 `#222`, one line, truncated |
| Rating | right of the title, 15/19 400: ★ 4.79 (135) |
| Meta lines | 15/19 400 `#6C6C6C`; items joined by ` · ` set in `#C1C1C1` |
| Price | 15 500 `#222`, "€125 total", underlined — it is a button that opens the breakdown |
| Tags row | 20 high pills: 11/15 500 `#6C6C6C`, `rgba(242,242,242,.75)`, radius 6, padding 2.5/4, 4 apart |
| Overlays on the image | Superhost pill top-left (12 inset); wishlist heart 32 top-right (12 inset); carousel arrows 32 at mid-height, 12 inset |

**States.** Hover: title gains an underline in `grey1000`; the image tile scales 1.04 and takes `elevation-secondary`; round controls scale 1.08. Active: controls scale 0.92, tile returns to 1. Focus-visible: `0 0 0 1px #222, 0 0 0 4px #fff` plus `elevation-tertiary`.

**Rules.** The card is *the image plus a caption*. Nothing frames it; the grid gaps (24/40) do the separating. Every number in the caption is 15px; hierarchy is weight (500 vs 400) and colour (#222 vs #6C6C6C), never size. The price is the only underlined text, because it is the only text that acts.

## 2. Elevated card (booking sidebar)

| Property | Value |
|---|---|
| Width | 372 (sidebar column) |
| Surface | `#FFFFFF` on a white page — the shadow is what makes it a card |
| Radius | 12 |
| Border | 1px `rgba(0,0,0,.04)` (the hairline inside `elevation-secondary`) |
| Shadow | `0 6px 16px rgba(0,0,0,.12)` = `elevation-secondary` |
| Padding | 24 (inner controls are 324 wide in 372) |
| Sticky | top 80 (the header's height), on the column wrapper |
| Contents, top to bottom | price 22 500 with strikethrough original · date pair (56 high, two 162 cells, 1px `#8C8C8C` between, labels 10/12 700 caps, values 14/18) · guests · Reserve (48 pill) · "You won't be charged yet" 14/18 · fee lines |
| Companion | a 52-high "Rare find" row above it, same radius/shadow, 11 above, 24 below |

**Rules.** An elevated card exists only when the content is a *tool* that must stay in reach while the page scrolls. It is the only white-on-white surface on the listing page, so it gets the only mid-strength shadow. Radius 12 matches the medium button radius: card and button share a step.

## 3. Identity card (Meet your host)

| Property | Value |
|---|---|
| Size | 395 × 212 |
| Radius | **24** |
| Shadow | `0 0 0 1px rgba(0,0,0,.02), 0 8px 24px rgba(0,0,0,.10)` = `elevation-3` |
| Padding | 24 / 16, internal gap 16 |
| Contents | large avatar + name + role left; stats column right (reviews, rating, years hosting) |

**Rules.** The identity card is the only 24-radius surface and the only elevation-3 surface on the page. A person gets a softer, larger corner than a tool. This is a deliberate one-off, and it is the pattern for "one entity, presented as an object": more radius, more blur, less contrast.

## 4. Tile (sleeping arrangement, similar stays)

Image tile with 12–16 radius and `0 4px 20px rgba(0,0,0,.07)` — the softest shadow on the page (10 occurrences). Content that is *browsed*, not *used*.

## Composition summary

| Object | Surface | Radius | Elevation | When |
|---|---|---|---|---|
| Listing card | none | 20 (image only) | none at rest, secondary on hover | an entity in a list |
| Tile | white | 12–16 | 0 4px 20px .07 | an image being browsed |
| Elevated card | white | 12 | secondary (0 6px 16px .12) | a tool that follows you |
| Identity card | white | 24 | elevation-3 (0 8px 24px .10) | a person |
| Sheet | white | 32 | high (0 8px 28px .28) | a layer over the page |

Radius and elevation rise together, and both rise with the object's distance from the page.
