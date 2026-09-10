# Recomposition brief — one surface at a time

**For:** anyone recomposing a page under `src/app/` against the rebuilt system. **Read first:** `03-constitution.md`. **Worked example:** `src/app/records/[id]/page.tsx` (the record, recomposed first).

## What recomposition is, and is not

Recompose the **presentation** of the page. Keep the **product**: every import from `@/data/seed` and `@/lib/store`, every piece of state, every handler, every route, every `href`, every demo checkpoint key, every string the demo script (`enable-collins-v2/demo-script.md`) names. The eval contracts (`evals/contracts.mjs`) name each screen's job and primary action; the recomposed page must still deliver them.

## The rules, in the order you will meet them

1. **The page is a document.** Use `Section` (default variant `chapter`) as the atom: title · content · rule. No card grid. A hairline box (`variant="tool"`) exists only for something that must stay in reach while the page scrolls: a sticky summary, a composer, a filter rail. If in doubt, it is a chapter.
2. **One primary per surface.** Exactly one `<Button>` with the default variant (the ink pill), and it is the contract's `primaryAction`. It sits at the bottom of the tool that owns it, or on the row that owns it. Secondary actions: `variant="secondary"` (grey fill). Text actions in the title row: `variant="link"`.
3. **Type is a role.** `type-title-page` once. `type-section` for chapter titles, `type-section-quiet` for notes. `type-data` / `type-data-read` / `type-data-strong` / `type-meta` / `type-micro` / `type-micro-caps` / `type-figure` / `type-code` for the machine; `type-prose*` for the person. Never `text-sm`, `font-semibold`, or a raw size.
4. **Colour is a utility on the sys tier.** Backgrounds `bg-base | bg-raised | bg-overlay | bg-sunken`; fills you can press `bg-interactive` (+`-hover`, `-pressed`), selected `bg-selected` with `text-on-selected`; labels `text-label | text-label-secondary | text-label-tertiary | text-label-quaternary`; strokes `border-hairline | border-strong | border-stroke-hover`; ink `bg-ink text-on-ink`; trust `ok | warn | crit` with `-soft`. Never `bg-card`, `text-muted-foreground`, `border-border`, `bg-muted`, `text-primary`, `bg-accent` — those are the deprecated aliases the harness counts down.
5. **State colour is a primitive's job.** Route through `Chip`, `StatusDot`, `EvidenceDot`, `SeverityBanner`, `Badge`, `Progress tone=`. A page never writes `bg-ok` or `text-crit` itself.
6. **Spacing is a ladder.** Inside a thing: `var(--space-1..8)`. Between things: `var(--gap-1..6)`. Chapters breathe by themselves; do not add margins between them.
7. **Radius is the scale.** `rounded-sm | md | lg | xl | 2xl | 3xl | 4xl | full` map to steps 1–7 and the pill. Never `rounded-[…]`.
8. **Selected is inverse.** `FilterChip`, `Segmented`, `Tabs` already do this. A selected row carries `data-state="selected"` (table) or `aria-selected` (list) and a 2px ink left edge.
9. **Disclosure is preview → grey button → sheet.** Show the first few, then one `variant="secondary" size="sm"` button at the content's left edge ("Show all 30 amenities"), opening a `Sheet` that reuses the same rows. No pagination, no accordion.
10. **Trust is a row of words.** `TrustRow` for the one evidence block a surface earns. Provenance on a value is `ProvenancePopover`.
11. **Lists.** `Rows` + `Row` / `RowStack` inside a chapter (no `inset`); inside a tool pass `inset`. Ledgers use `Table`.
12. **The dock owns navigation.** No page draws its own nav, back arrow or breadcrumb.

## Per viewport

Desktop first. Below `lg` the document's rail becomes an appendix (`.doc-layout` handles it). Below `sm` chapter padding drops to 24 and grids become one column. The brief and the record are checked on the phone; the rest at desktop.

## Exit for a surface

- `npx tsc --noEmit` clean.
- `node evals/tier1-static.mjs` shows no deprecated alias, no raw type utility, no raw radius/shadow/colour, and no semantic colour in this file.
- The page has exactly one filled button and one `type-title-page`.
- The demo script's beats for this surface still work by the same clicks.
- A line in `decisions.md` for any new component, and a note in the page's header comment naming the chapters and the one primary and why.
