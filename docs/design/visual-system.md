# Visual system — locked rules

**Status:** enforced. Any surface that deviates is a bug, not a variation.
**Prompted by:** a visual pass — "just like you would on any web app such as Notion or Linear."

---

## What the audit found

Measured against the live app, not by eye.

| Measure | Before |
|---|---|
| Distinct type styles on one page (briefing) | **10** — including 11.5, 12, 12.5, 13 and 13.5px, five sizes inside a 2px band |
| Heading sizes on that page | **two** (22px and 24px) for the same rank |
| Distinct padding combinations | **9** — card padding alternating between 10/16 and 12/16 |
| Radii | 8.8px and 6.8px — artefacts of `calc()` on a 0.55rem base, not chosen values |
| Border colour / width | **1** — the only thing that was already consistent |

The departures widget's odd typography is the same defect at component level: two `truncate` siblings competing in one flex row with `ml-auto` on a third, so at narrow widths they shrink unpredictably.

## 1. The frame

The application is inset from the viewport by a fixed **12px on all four sides**. Inside that inset:

```
┌─ viewport ───────────────────────────────┐
│ 12px                                     │
│   ── breadcrumb row (no border) ──       │  back · forward · breadcrumb, left-aligned
│   ┌─ content panel ─────────────────┐    │  hairline border, radius 12, scrolls internally
│   │                                 │    │
│   └─────────────────────────────────┘    │
│              [ dock ]                    │  floats over the inset, outside the panel
│ 12px                                     │
└──────────────────────────────────────────┘
```

- The **content panel** carries the hairline stroke and owns its own scroll. The page itself never scrolls.
- The **breadcrumb row** sits above the panel, outside the border, with back and forward arrows at its left.
- The **dock** floats at the bottom, outside the panel, over the inset.
- At ≤640px the inset drops to 8px and the panel radius to 10.

## 2. Type scale — five steps, no others

| Class | Size / weight | Use |
|---|---|---|
| `.t-display` | 24 / 600, −0.01em | page title, one per screen |
| `.t-title` | 15 / 600 | section and card titles |
| `.t-body` | 13 / 400 | default text, table cells, list rows |
| `.t-meta` | 12 / 400, muted | secondary text, dates, provenance |
| `.t-micro` | 11 / 500, +0.01em | labels, chips, mono tags, column heads |

Arbitrary sizes (`text-[13.5px]`) are forbidden. Numbers that align in columns take `.tnum`.

## 3. Spacing — one ladder

4 · 8 · 12 · 16 · 24 · 32. Nothing between.

| Token | Value |
|---|---|
| Frame inset | 12 (8 at ≤640) |
| Panel padding | 24 (16 at ≤640) |
| Card padding | 16 |
| Card gap in a grid | 12 |
| List row vertical padding | 10 |
| Inline gap between related items | 8 |

## 4. Radii — chosen, not calculated

Panel 12 · card 10 · control 6 · chip pill. The 0.55rem base and its `calc()` derivatives are removed.

## 5. Strokes

- **Frame**: hairline, near-black at low alpha — defines the application against the page.
- **Internal**: the light border token — separates content from content.
Two weights only. A stroke never carries meaning that colour or type is already carrying.

## 6. Row primitive

Every list row — departures, commissions, notices, documents, notifications — uses one grid, never ad-hoc flex:

```
[ primary (1fr, truncates) ] [ meta (auto, hidden ≤sm) ] [ trailing (auto) ]
```

Exactly **one** element truncates per row. Trailing content is fixed-width and never wraps. This is what fixes the departures widget, and it fixes every other row at the same time.

## 7. Density

List row height 36 · control height 28 · dock tile 44. Widget cards are equal height in a row; their footers align on a baseline regardless of body length.
