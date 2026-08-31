# Causal trace — every inconsistency to its origin layer

For each issue: where it *appears*, where it *originates*, and the **highest level at which it should be fixed**. The rule throughout is that a defect gets fixed at the level that owns the rule it breaks — not at the level where it was noticed.

---

## The layer model, as it applies to this codebase

| Layer | What lives here | Where |
|---|---|---|
| **SYSTEM** | Scales and rules. Tokens, type roles, geometry, the principles the product claims. | `globals.css`, `docs/design/*` |
| **PRIMITIVE** | Shared, semantically neutral building blocks. | `components/bits.tsx`, `components/layouts.tsx`, `components/ui/*`, `.row-grid` |
| **COMPONENT** | Product-specific, semantically loaded assemblies. | `WidgetCard`, `FieldRow`, `ItemPanel`, `StateChip`, `TravellerCardTile` |
| **SCREEN** | Arrangement of components on one route. | `app/**/page.tsx` |
| **CONTENT HIERARCHY** | What the data says and how it is ranked before layout sees it. | `data/seed.ts`, sort order, copy structure |
| **OPTICAL** | Perceptual behaviour that no structural rule captures. | fill vs weight, icon-to-type ratio, double-encoding |

**SYSTEM and CONTENT HIERARCHY are the two levels where fixes are cheapest and reach furthest**, and they are where most of this product's problems actually live.

---

## The traces

### A. Truncation inverts priority — "A. Whitfield" → **"A. ..."**

*Appears:* Briefing, records table, any `.row-grid` surface.
*Evidence:* subject given 13% of the row against 87% metadata; 81% of a traveller's name lost; 66% of the Critical notice lost.

**Origin: PRIMITIVE.** `.row-grid` marks trailing children `flex-shrink: 0` and ellipsises only `.row-primary`. Metadata is incompressible by construction; the subject is infinitely compressible.

The SYSTEM rule above it — *"exactly one element truncates"* — is **correct**. Only the assignment is wrong. This is why the fix does not belong at SYSTEM: the principle survives, the implementation inverts it.

**Do not fix locally.** The tempting fix is `max-w` on the Departures name, on the Notices link, on the records cell. That is three patches for one primitive defect and it would leave the other five `.row-grid` surfaces still inverted.

**Systemic fix:** the primitive needs a **two-line variant**, which `/notifications` already proves works — headline on line one, metadata on line two, nothing truncated. Adding it to `.row-grid` fixes eight surfaces at once.

**→ Fix at PRIMITIVE.**

---

### B. Six control heights for one job

*Appears:* everywhere. Segmented **29px** beside a search input **36px** in the same flex row on `/commissions`.
*Evidence:* 23 · 26 · 29 · 34 · 36 · 44px, with radii 0 / 4 / 6.

**Origin: SYSTEM — a missing scale.** The tokens define `--radius-control` but **no control height token at all**. So every control invents its own: `Segmented` uses `py-1`, shadcn `Button` uses `h-9`, `Input` uses `h-9` at 14px, facet buttons use `py-1`, category tabs use `py-2`.

This is exactly your example, and the answer is yes — they should belong to one control geometry system. Not because 29 and 36 look bad together, but because **nothing currently decides**. Six heights is not six decisions; it is zero decisions, six times.

**Do not fix locally.** Setting the Segmented to `h-9` on `/commissions` fixes one pairing and leaves the other five heights and the absent rule.

**Systemic fix:** declare `--control-h-sm: 28px` / `--control-h-md: 36px` on the 36px module the row primitive already uses, then re-point Segmented, Button, Input, facet triggers and tabs at it.

**→ Fix at SYSTEM.**

---

### C. Nine rendered sans styles against five declared

*Appears:* every screen.
*Evidence:* undeclared Inter 13/510 (32 instances on two screens), 14/510 (every button), 13/700, 12/510, 12/590, and `body` at 16/24.

**Origin: SYSTEM.** Three separate containment failures in one scale:

1. **Duplicate identifiers.** `.t-title`, `.type-data-strong` and `.type-title-section` are byte-identical. Three names implying three semantics that the CSS does not honour.
2. **The scale does not reach the controls.** 41 hard-coded `text-sm` / `h-9` utilities across 18 files in `components/ui/` — a parallel scale underneath the declared one.
3. **The inherited default is outside the scale.** `body` is 16px; sans 16px is not a role, so omitting a type class fails silently into a size the system does not contain.

**→ Fix at SYSTEM.** Collapse the duplicates, bring `ui/*` into the scale, set `body` to the data-cell role.

---

### D. `font-medium` vs `type-data-strong` for "this is the row's subject"

*Appears:* 15 instances on `/briefing`, 17 on `/commissions`.

**Origin: SYSTEM — an undefined role**, not a component inconsistency. The system declares 510 and 590 as *optical stops* but never says which stop means what. Given two legal weights and no rule, call sites choose, and they choose differently.

**Do not fix locally.** Sweeping 32 call sites to 590 fixes today's instances and leaves the next author the same undefined choice.

**Systemic fix:** name the role — *the row's subject is `type-data-strong`* — and the call sites become derivable rather than remembered.

**→ Fix at SYSTEM.**

---

### E. Five implementations of the label/value row

*Appears:* `.row-grid`, `<Table>`, `FieldGrid`, `DataList`, bare `divide-y`.

**Origin: PRIMITIVE — no owner.** Two are shared, two are file-local, one is imported from shadcn. `FieldGrid` is the most correct of the five (real grid tracks rather than flex alignment) and is trapped inside `records/[id]/page.tsx`.

**→ Fix at PRIMITIVE.** Promote `FieldGrid`, fold `DataList` into it.

---

### F. The card shell is bypassed 31 times

*Appears:* 13 files roll their own `rounded-lg border border-border bg-card` against 91 uses of `Section`.

**Origin: PRIMITIVE — an incomplete variant.** All 23 `flush` call sites must *also* pass `bodyClassName="p-0"`. A primitive that needs a second prop to function is one people route around, and 31 hand-rolled shells is the measured cost of that.

**Do not fix locally.** Converting the 31 to `Section` without fixing `flush` re-creates them within a month.

**→ Fix at PRIMITIVE.**

---

### G. Widget chrome is ~92px regardless of content

*Appears:* briefing. "Records verified this quarter" is **50% frame**.

**Origin: COMPONENT, not primitive.** `Section` renders what it is given; `WidgetCard` gives it a footer unconditionally, including for a widget holding one number and one sentence.

This is a case where the primitive is innocent. `Section`'s header/footer geometry is correct for a card that has a header and a footer.

**→ Fix at COMPONENT.** Make the footer conditional; add a compact variant for single-figure widgets.

---

### H. Departures is 44% empty

*Appears:* briefing only.

**Origin: SCREEN.** `grid sm:grid-cols-2` with equal-height tracks, and five widgets of unequal content in a grid with no size concept.

**A small SYSTEM extension makes the screen fix durable:** give `Widget` a declared size (`1×1`, `2×1`) in the seed, so the grid arranges by declaration rather than by accident. Without it, the next widget re-creates the void.

**→ Fix at SCREEN, with a CONTENT-level size property.**

---

### I. The Document archetype disappears below 1024px

*Appears:* `/records/[id]`, `/travellers/[id]`. Measured at 795px: six equal cards in one column, no distinction between the record and context about it.

**Origin: PRIMITIVE — a missing primitive.** `Page` and `SplitPage` exist; **`DocumentPage` does not**. Both document surfaces hand-roll `lg:grid-cols-[minmax(0,1fr)_320px]` inline, which is why the breakpoint is a per-page accident and why nobody designed the collapsed order.

**Do not fix locally.** Changing `lg:` to `md:` on two pages moves the cliff; it does not decide what a document does when it has no margin.

**→ Fix at PRIMITIVE.**

---

### J. Card titles restate their own badges

*Appears:* record — "Enable canonical ● canonical", "Agency overlay ● agency", "Personal ● personal".

**Origin: CONTENT HIERARCHY**, exposed by a PRIMITIVE weakness.

The redundancy is a content decision: the title and the badge encode the same fact. But it was *permitted* by `Section`'s header, which accepts `title`, `chips` and `actions` as three unrelated slots on one axis with no hierarchy between them — an identity, a state and a control, undifferentiated.

**Fix the content at COMPONENT** (the layer card should carry one of the two). **Note the primitive weakness** but do not rebuild `Section`'s header for this alone — it is a bag with an order, and that is a separate, larger question.

**→ Fix at COMPONENT.**

---

### K. Severity does not drive order or weight

*Appears:* briefing Notices — rendered order is Important, Info, **Critical**, Info, Important.

**Origin: CONTENT HIERARCHY.** The array is rendered in seed order; nothing sorts by severity. No amount of layout work fixes this, and any layout fix would be a workaround for unranked data.

**→ Fix at CONTENT HIERARCHY.**

---

### L. The data-quality caveat is buried

*Appears:* briefing subhead — *"Friday 28 August · synced 12:04 · booking-system figures up to 48 hours behind"*.

**Origin: CONTENT HIERARCHY.** Three facts of different classes — a date, a sync time, and a reason to distrust every figure below — joined by middots into one 12px grey string. The composition is even; the content is not.

**→ Fix at CONTENT HIERARCHY.**

---

### M. The commissions stat strip restates the briefing widget

*Appears:* `/commissions` top third.

**Origin: PAGE-LEVEL.** Neither screen is wrong alone. The redundancy exists only in the *sequence* — the reader arrives having just read those three figures on the briefing.

This is the one issue in this document that cannot be seen from inside any single component or screen.

**→ Fix at PAGE-LEVEL (the journey).**

---

### N. Chips outrank names perceptually

*Appears:* every list. The eye reads "chased · 54d" before "Aurelia".

**Origin: OPTICAL — and it contradicts a stated SYSTEM principle.**

The system says *"emphasis is weight before size or colour"*. But `Chip` is a **filled shape**, and fill outranks weight perceptually regardless of type size. So the product's stated hierarchy principle and its actual visual hierarchy disagree, and the chip wins.

**→ Fix at SYSTEM** (the emphasis principle must account for fill), **expressed in `Chip`** (outline as the default, fill reserved for genuine severity).

---

### O. Two amber marks for one fact

*Appears:* record's stale field — an amber "96d unverified" chip and an amber date, one state, two marks.

**Origin: OPTICAL.** Double-encoding: one state rendered twice in the same colour on the same row.

**→ Fix at COMPONENT** (`FieldRow` chooses one carrier).

---

### P. Icon sizes have no scale

*Appears:* `size-3` / `3.5` / `4` / `[17px]` / `[18px]`; the same **severity icon** at 16px on `/ask` and 14px on `/travellers/[id]`. A widget footer's arrow is 16px beside 13px type.

**Origin: SYSTEM — a missing scale**, same class as B.

**→ Fix at SYSTEM.**

---

## Where the differences are legitimate

Not everything that differs is an inconsistency. Two cases where I would **not** consolidate:

**The three filter idioms.** `Segmented` (mutually exclusive state), Popover facets (multi-select across dimensions), source tabs (scope). These are **three genuinely different interaction models for three different jobs**, and collapsing them would be a real loss. What is *not* legitimate is that they render at three different heights, three radii and three type treatments. **The behaviour should stay three; the geometry should become one** — which routes to trace B, not to a component merge.

**The five briefing widgets' internal layouts.** Commissions leads with a headline figure; Departures is a list; Expiring incentives is a two-line stacked row. These are different information shapes and a single internal template would flatten meaning. What is not legitimate is that all five pay identical chrome and are forced to identical heights — traces G and H. **The compositions legitimately differ; the frame and the sizing should not.**

This is the distinction the brief asks for: *is the card primitive wrong, or does each card legitimately have a different composition?* Here — the card primitive's **frame** is wrong, and the cards' **contents** are legitimately different.

---

## Dependency map

```
SYSTEM
├── type scale ─────────────────┬─→ PRIMITIVE ui/* (Button, Input) ─→ every screen        [C]
│   • duplicate identifiers     ├─→ PRIMITIVE .row-grid ─────────────→ 8 list surfaces    [D]
│   • no control-size token     └─→ COMPONENT Segmented / facets ────→ 4 filter surfaces  [B]
│   • body outside the scale
│
├── control geometry (ABSENT) ──┬─→ Segmented 29 │ Input 36 │ facet 26 │ tab 34           [B]
│                               └─→ icon scale (ABSENT) ─→ severity at 14 and 16          [P]
│
└── emphasis principle ─────────→ PRIMITIVE Chip (fill) ─→ chips outrank subjects         [N]
    ("weight before colour" — contradicted by fill)

PRIMITIVE
├── .row-grid truncation contract ─→ COMPONENT rows ─→ briefing, records, knowledge       [A]
├── Section.flush incomplete ──────→ 31 hand-rolled shells across 13 files                [F]
├── DocumentPage (MISSING) ────────→ SCREEN records/[id], travellers/[id]                 [I]
├── FieldGrid trapped in a page ───→ 5 label/value implementations                        [E]
└── EmptyState trapped in a page ──→ 4 empty-state implementations

COMPONENT
├── WidgetCard mandates a footer ──→ SCREEN briefing (50% chrome on the small widget)     [G]
├── layer card title + badge ──────→ SCREEN record (3 redundancies)                       [J]
└── FieldRow double-encodes stale ─→ SCREEN record                                        [O]

SCREEN
└── briefing 2-col equal-height ───→ 44% void in Departures                               [H]

CONTENT HIERARCHY
├── notices unsorted by severity ──→ Critical renders third                               [K]
├── subhead mixes three classes ───→ the caveat is whispered                              [L]
└── Widget has no size property ───→ the grid cannot arrange by intent                    [H]

PAGE-LEVEL
└── briefing → commissions ────────→ the stat strip restates what the reader just read    [M]
```

---

## Highest level at which each should be fixed

| | Issue | Fix at | Reach |
|---|---|---|---|
| **C** | Type scale: duplicates, controls, body default | **SYSTEM** | every screen |
| **B** | Control geometry — six heights, no token | **SYSTEM** | every control |
| **D** | Row-subject emphasis undefined | **SYSTEM** | 32 call sites |
| **P** | Icon scale absent | **SYSTEM** | ~110 icons |
| **N** | Fill outranks weight, contradicting the stated principle | **SYSTEM** → Chip | every list |
| **A** | Truncation protects metadata over subject | **PRIMITIVE** | 8 surfaces |
| **I** | `DocumentPage` missing | **PRIMITIVE** | 2 surfaces, 1 archetype |
| **F** | `Section.flush` incomplete | **PRIMITIVE** | 31 bypasses |
| **E** | Five label/value rows | **PRIMITIVE** | 5 implementations |
| **G** | Widget chrome unconditional | **COMPONENT** | briefing |
| **J** | Title restates badge | **COMPONENT** | record |
| **O** | Stale state double-encoded | **COMPONENT** | record |
| **K** | Severity unranked | **CONTENT** | briefing, triage |
| **L** | Caveat buried in a middot list | **CONTENT** | briefing |
| **H** | Equal-height grid void | **SCREEN** + content size property | briefing |
| **M** | Cross-screen redundancy | **PAGE-LEVEL** | the journey |

**Five of the sixteen are SYSTEM-level, and four of those five are missing scales rather than wrong values.** The product does not have a colour problem or a spacing problem. It has three absent systems — control geometry, icon sizing, and a type scale that reaches the controls — and one stated principle that its own primitive contradicts.
