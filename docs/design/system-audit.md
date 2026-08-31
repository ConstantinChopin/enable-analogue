# Design system audit — diagnosis only

A survey of the system that **actually exists**, measured against the running UI and the source. No changes were made. Counts are from the codebase; type and geometry figures are computed styles read from the running app.

The organising question throughout: **where do two things doing the same semantic job have different implementations?**

---

## 1 · Map of the existing design system

### Token architecture

Three tiers are declared in `globals.css`, with the tier written into the name:

| Tier | Purpose | Members |
|---|---|---|
| `ref-*` | primitives, never referenced by a component | 16 |
| `sys-*` | semantic aliases, what components consume | 22 |
| `comp-*` | component tokens, never leave their component | **0** |

**The `comp-*` tier is documented and empty.** `comp-` appears exactly once in the whole repository — in the comment that declares it. Component-local values are instead written inline at call sites (`--panel-pad` is the only near-exception, and it is a `sys`-level global).

### Colour

There is no neutral grey; every neutral carries a warm bias. This is held consistently and is the strongest part of the system.

- **Paper ramp** — 5 steps, `#ffffff` → `#e7e3de`
- **Clay** — 3 steps, `#b8b0a7` → `#57514b`
- **Ink** — 2 steps, `#2a2320`, `#1c1917`
- **Earth semantics** — moss / ochre / claret, each with a `-soft` companion. These are the only real chroma in the product.
- **Accent is ink, not a hue.** Emphasis is fill and weight. This is a genuine and unusual decision, and it holds everywhere.

Backgrounds are 4 levels (Apple's 3 plus `sunken`); labels are 4 levels (Apple's hierarchy, adopted faithfully).

**Contradiction:** the strokes comment reads *"two weights, no more"* — three are declared (`frame`, `divider`, `subtle`).

### Geometry

| Token | Desktop | ≤640px |
|---|---|---|
| `--frame-inset` | 12px | 8px |
| `--panel-pad` | 32px | 16px |
| `--radius-panel` | 12px | 10px |
| `--radius-card` | 10px | — |
| `--radius-control` | 6px | — |

Measured on the running briefing, only three radii appear: pill, 10px, 6px. The radius system is clean.

---

## 2 · The major component families

**Frame** (chrome, one instance each) — `Shell`, `FrameBar`, `Dock`. The only persistent furniture.

**Layout** — `Page` (3 widths), `SplitPage` (6 consumers), `PageHeader`, `Section`.

**Row and list** — five separate implementations, see §5.

**Micro-labels — nine components for "a small annotated value":** `Chip` (5 tones), `EvidenceDot`, `LayerBadge`, `SourceTag`, `FreshnessDate`, `Absent`, `SchematicBadge`, `ConfidenceMeter`, `MoneyValue`. Several are genuinely distinct; several differ only in which icon and colour they hard-code.

**Banners — three, differentiated by intent:** `SeverityBanner` (4 severities), `ConfirmBanner` (transient success), `NarrationNote` (presenter-only, gated on the `N` key). This family is coherent.

**Controls** — one house component, `Segmented`, plus `ViewToggle` as a thin wrapper over it. Everything else is shadcn: Button, Input, Textarea, Checkbox, RadioGroup, Switch, Select, Popover, Sheet, Dialog, DropdownMenu, Command, Tooltip, Table.

**Feedback** — `QuietLoading` (shared), `Skeleton`, and an `EmptyState` that is local to `notifications/page.tsx` and used nowhere else.

---

## 3 · The typography hierarchy

### What is declared

Ten classes, in three groups:

- **Machine (Inter):** `type-data-cell` 13/16/400 · `type-data-strong` 13/16/590 · `type-data-meta` 12/15/400 · `type-data-micro` 11/14/510 · `type-data-figure` 13/16/400 tnum
- **Person (Newsreader):** `type-prose-lead` 18/27 · `type-prose-body` 16/25 · `type-prose-quote` 15/24 italic
- **Titles:** `type-title-page` 24/28 serif · `type-title-section` 13/16/590 sans

Plus five **migration aliases** — `t-display`, `t-title`, `t-body`, `t-meta`, `t-micro` — which duplicate the role definitions rather than referencing them.

Weight stops are optical (510/590/680), not mechanical. That decision is correct and well argued.

### What actually renders

Sampled across `/briefing`, `/records`, `/travellers/s-marchetti`, `/ask`, `/commissions`:

| Style | Declared? | Where |
|---|---|---|
| Inter 13/16 **w400** | ✅ `t-body` | everywhere |
| Inter 13/16 **w590** | ✅ `t-title` | everywhere |
| Inter 12/15 **w400** | ✅ `t-meta` | everywhere |
| Inter 11/14 **w510** | ✅ `t-micro` | everywhere |
| Newsreader 24/28 w500 | ✅ `t-display` | one per page |
| Newsreader 18/27, 16/25 | ✅ prose roles | `/ask` only |
| IBM Plex Mono 11/14, 12/15 | ⚠️ undeclared as roles | source tags, refs, URIs |
| **Inter 13/16 w510** | ❌ | **15× on `/briefing`, 17× on `/commissions`** |
| **Inter 14/20 w510** | ❌ | every Button |
| **Inter 13/16 w700** | ❌ | `<b>` in banners and prose |
| **Inter 12/15 w510**, **12/15 w590** | ❌ | scattered singletons |
| **Inter 16/24 w400** | ❌ | `body` default, inherited by anything without a type class |

**The declared scale has 5 sans steps. The running UI has 9**, plus 2 mono and 3 serif — 14 distinct type styles against 10 declared, and the four undeclared ones are the most-used after the core four.

---

## 4 · The spacing and geometry system

**The vertical module is 36px** and is held in three places independently: `.row-grid { min-height: 36px }`, shadcn control heights (`h-9`), and the dock tile (44px — deliberately larger for touch).

**Padding ladder in use:** 32 (panel) · 16 (card, `Section p-4`; flush row inset `px-4`) · 12 (`py-3` on flush headers/footers) · 10 (`row-grid` padding-block) · 8 (row gap).

**Gaps:** `gap-2` (8) · `gap-3` (12) · `gap-4` (16) · `gap-6` (24). Consistent.

The ladder itself is coherent. The problem is not the values — it is how many components opt out of them (§5).

---

## 5 · The major systemic inconsistencies

Ordered by how much of the product each one touches. Every item here is **one semantic role with more than one implementation**.

### 5.1 Three names resolve to one style

`.t-title`, `.type-data-strong` and `.type-title-section` are all **Inter 13/16/590**, byte-identical. Their names imply three different semantics — a section's title, a strong data value, a section heading — and a reader choosing between them is choosing a *meaning* that the CSS does not honour. Nothing enforces which is used where.

### 5.2 Two weights compete for "this is the row's subject"

`font-medium` (510) is applied ad hoc to row primaries — **15 instances on `/briefing`, 17 on `/commissions`** — while `type-data-strong` (590) exists for exactly that job. Two emphasis weights for one role, selected per call site. This is the single most-repeated inconsistency in the product.

### 5.3 Five ways to render a label/value row

| Implementation | Where | Cell inset |
|---|---|---|
| `.row-grid` in `ul`/`li` | 8 surfaces — the house standard | 16px |
| `<Table>` (shadcn) | `/commissions` only | 16px *(was 8px until yesterday)* |
| `FieldGrid` | `/records/[id]` only, local | 16px |
| `DataList` | 4 inspector panels | 16px |
| bare `divide-y` + flex | `/settings`, scattered | varies |

Five primitives for one job. Only two of them are shared components; two are file-local; one is imported from shadcn.

### 5.4 Four ways to render an empty state

`EmptyState` (local to notifications) · `Section py-12 text-center` (travellers, itineraries, traveller detail) · `TableCell colSpan={7}` (commissions) · a bare `<p class="t-title">` (records). A shared `EmptyState` exists — in the wrong place, unexported, used once.

### 5.5 The card shell is bypassed a quarter of the time

`<Section>` — **91 uses**. Hand-rolled `rounded-lg border border-border bg-card` — **31 uses across 13 files**. The escape hatch is `Section`'s `flush` variant, which does not complete itself: all **23** `flush` call sites must also pass `bodyClassName="p-0"`. A primitive that requires a second prop to work is a primitive people route around.

### 5.6 The control layer speaks a different scale

**41 hard-coded `text-sm` / `text-xs` / `h-8` / `h-9` / `h-10` utilities across 18 files in `components/ui/`.** These are a complete parallel type-and-size system underneath the declared one. Concretely: every Button renders at **14px/20** and every Input at **14px/20**, while the design system's largest sans role is 13px. The type system does not reach the controls.

### 5.7 The inherited default is outside the system

`body` is **16px/24** — Tailwind's default. Sans 16px is not a declared role. Any element that omits a type class lands at a size that exists nowhere in the scale, and does so silently.

### 5.8 Three filter idioms for one job

`/notifications` and `/commissions` use `Segmented`; `/records` uses Popover-with-checkboxes facets; `/knowledge` uses underlined source tabs. Same task — narrow a list — three interaction models and three visual languages.

### 5.9 `panelTitle` semantics differ across the six `SplitPage` consumers

Five title the panel with the **subject's name**. `/commissions` titles it with `bookingRef` — an identifier, not a subject. The six empty-panel fallbacks are six different strings: *Trip · Commission · No document selected · Record · Traveller · Item*.

### 5.10 Icon sizing has no rule

Five sizes in app code: `size-3` (12) · `size-3.5` (14) · `size-4` (16) · `size-[17px]` · `size-[18px]`. The same **severity icon** renders at `size-4` on `/ask`, `/notifications` and `/records/[id]`, and at `size-3.5` on `/travellers/[id]`.

---

## 6 · The biggest compositional problems

**6.1 `SplitPage` has no rule about what belongs in `header` versus `children`.** Some surfaces put filters in the header prop, others in children. The header prop is a `<>…</>` fragment containing `PageHeader` plus a `NarrationNote` on most pages — a convention held by imitation, not by the component.

**6.2 The Document archetype is not enforced.** `/records/[id]` and `/travellers/[id]` have a context rail; `/commissions/[id]` does not. Nothing in the code makes the rail a property of the archetype, so it is a per-page decision.

**6.3 One page carries a layout device no other page has.** The 3-up stat strip (`grid gap-3 sm:grid-cols-3`) appears **once**, on `/commissions`. Either it is the Ledger archetype's signature — in which case `/ops/resolution` should have it — or it is an outlier.

**6.4 `/ask` manages its own height with a magic constant**: `calc(100dvh - ${DOCK_FOOTPRINT + 36}px)`. The `+ 36` is unexplained and unshared. Every other surface lets `Page` own its scroll.

**6.5 One route holds two archetypes.** `/itineraries` is a Ledger followed by a Document in the same scroll. It is now banded and labelled, but structurally it is still two archetypes at one address.

**6.6 `commissions/page.tsx` returns two different layout primitives** — `Page` for the no-permission branch, `SplitPage` for the main view. Defensible, but it means the surface's shape depends on the reader.

---

## 7 · The ten highest-leverage changes

Ranked by systemic reach divided by cost. **1–4 are close to free and touch everything.**

**1. Delete the migration aliases; keep the roles.** Collapse `.t-title` / `.type-data-strong` / `.type-title-section` into one name. Removes a whole class of drift permanently: today a developer picks between three identical classes and their choice implies a meaning the CSS does not keep.

**2. Give row emphasis a role, and stop using `font-medium` on text.** One rule — the row's subject is `type-data-strong` — resolves 30+ instances across the two densest surfaces and removes the product's most-repeated inconsistency.

**3. Bring `components/ui/` into the type scale.** Button, Input and Textarea at 13px on the 36px module. This is the highest-reach item in the audit: it is 41 utilities in one directory, and it currently means every control in the product is a size the design system does not contain.

**4. Set `body` to the data-cell role.** One line. Makes the inherited default a member of the system, so forgetting a type class degrades to something legal instead of to 16px.

**5. Promote `FieldGrid` to the shared label/value primitive and fold `DataList` into it.** Five implementations of one row become one. `FieldGrid` is already the most correct of them — it is the only one built on grid tracks rather than flex alignment.

**6. Export one `EmptyState` and use it in all four places.** It already exists; it is in the wrong file.

**7. Make `Section flush` self-complete.** Removing the required `bodyClassName="p-0"` from 23 call sites removes the reason people hand-roll the card shell 31 times.

**8. Write the icon-size rule and apply it.** Three sizes keyed to role: 12px inside chips, 14px inline with text, 16px for severity and status. Currently five sizes chosen per call site, with one role rendering at two of them.

**9. Choose one filter idiom.** Three interaction models for narrowing a list is a comprehension cost on a product whose users are described as *rushed, interrupted, repeating known tasks*. `Segmented` is the house component and already handles counts.

**10. Make `panelTitle` a rule: always the subject, one fallback string.** Small, but it is the inspector's identity, and it is currently inconsistent on the surface where money is involved.

---

## Appendix — what is working

Worth protecting in any intervention:

- **The warm-neutral discipline.** No grey anywhere; the warmth is continuous rather than applied at accent points.
- **Ink as accent.** Emphasis by fill and weight rather than hue is unusual, coherent, and holds across every surface.
- **The optical weight stops** (510/590/680) and the 13/16 data leading — density bought by setting type correctly rather than by squeezing padding.
- **The banner family.** Three banners with genuinely distinct intents, no overlap.
- **`NarrationNote` gated behind a key.** Presenter material that cannot leak into the product.
- **The radius system.** Three radii render across the whole app.
- **`.row-grid`'s "exactly one element truncates" rule** — the right idea, and the reason the eight surfaces that use it hold together.
