# The proposed system

A specification, not an implementation. Every proposal traces to a measured finding in `system-audit.md`, `art-direction-pass.md` or `causal-trace.md`.

**The governing observation:** this product does not have a colour problem or a spacing problem — those are its strongest parts. It has **three absent systems** (control geometry, icon sizing, a type scale that reaches its controls), **one primitive whose contract is inverted**, and **one stated principle its own components contradict**. The proposals below are ordered by leverage, not by count: the first four are close to free and touch every screen.

---

# Part I — The systems

## 1 · Typography roles

**CURRENT.** Ten declared classes plus five migration aliases. `.t-title`, `.type-data-strong` and `.type-title-section` are byte-identical. The running UI renders **nine** sans styles against five declared: undeclared 13/510 (32 instances on two screens), 14/510 (every button), 13/700, 12/510, 12/590, and `body` at 16/24.

**PROBLEM.** Three failures in one scale. Duplicate identifiers imply semantics the CSS does not honour, so the choice between them is unguided. The scale does not reach the controls — 41 hard-coded `text-sm`/`h-9` utilities in `components/ui/`. And the inherited default sits *outside* the scale, so omitting a type class fails silently into a size the system does not contain.

**PROPOSED.** Seven roles. No aliases, no duplicates.

| Role | Family | Size/leading | Weight | Job |
|---|---|---|---|---|
| `data` | Inter | 13/16 | 400 | the default; all body text, all controls |
| `data-strong` | Inter | 13/16 | 590 | the subject of a row; a section's name |
| `meta` | Inter | 12/15 | 400 | attribution, dates, secondary facts |
| `micro` | Inter | 11/14 | 510 | tags, counts, uppercase labels |
| `code` | IBM Plex Mono | 11/14 | 510 | URIs, refs, source identifiers |
| `prose` | Newsreader | 16/25 | 400 | answers, quotations — anything read as sentences |
| `prose-lead` | Newsreader | 18/27 | 400 | an answer's opening sentence |
| `title-page` | Newsreader | 24/28 | 500 | the page's name, once per screen |

Not roles — **modifiers**: `.tnum`, `.italic`. `type-data-figure` and `type-prose-quote` become `data` + `tnum` and `prose` + `italic`.

Two structural changes carry the weight: **`body` is set to `data`**, and **Button / Input / Textarea inherit `data`**.

**RATIONALE.** Seven roles is enough for a product with two voices, and a smaller set is enforceable by reading. Setting `body` into the scale converts a silent failure into a legal default. Bringing the controls in removes the parallel scale entirely. The rule becomes checkable: **a rendered size that is not a role is a bug.**

**REUSE.** Every surface. This is the single highest-reach change in the document.

---

## 2 · Spacing scale

**CURRENT.** 32 / 16 / 12 / 10 / 8 with gaps at 8 / 12 / 16 / 24. Coherent values, but declared nowhere as a scale, so each is chosen per call site.

**PROPOSED.** A 4px base, named for function rather than size:

| Step | px | Job |
|---|---|---|
| `space-1` | 4 | icon-to-label, inside a chip |
| `space-2` | 8 | between related elements in a row |
| `space-3` | 12 | row to row; card header to body |
| `space-4` | 16 | card padding; row inset |
| `space-6` | 24 | between cards |
| `space-8` | 32 | panel padding |

**One rule does most of the work:** *the padding inside a container is always one step smaller than the gap between containers* — 16 inside, 24 between.

**RATIONALE.** That single relationship is what makes grouping legible without adding borders. When inner and outer spacing are equal, a group of cards reads as one field of items; when inner is smaller, each card reads as a unit. The current 16/16 pairing on the briefing is part of why five widgets read as one texture.

**REUSE.** Every container. Replaces per-call-site `gap-*` choices.

---

## 3 · Control geometry — *the first absent system*

**CURRENT.** No control-height token exists. Measured: **23 · 26 · 29 · 34 · 36 · 44px**, radii 0 / 4 / 6. On `/commissions` a Segmented control at 29px sits beside a search input at 36px in the same flex row.

**PROBLEM.** Six heights is not six decisions — it is zero decisions, six times. Every control invents its own geometry because nothing decides for it.

**PROPOSED.** Two sizes, both on the 4px grid, both derived from the 36px row module:

| Token | Height | Padding X | Type | Icon | Radius | Used by |
|---|---|---|---|---|---|---|
| `control-sm` | **28** | 10 | `data` | 14 | 6 | segmented tabs, facet triggers, inline actions |
| `control-md` | **36** | 12 | `data` | 14 | 6 | buttons, inputs, selects — the default |

**44px is reserved for the dock**, where the element is a touch target, not a control.

**The rule that catches the bug:** *any two controls on the same line are the same size.*

**RATIONALE.** Two sizes covers dense filtering and primary action without ambiguity. Deriving both from the row module means a control dropped into a row does not change the row's height — currently the reason several rows are 39px and others 52px.

**REUSE.** `Segmented`, `Button`, `Input`, `Textarea`, `Select`, facet triggers, category tabs, `ViewToggle`.

---

## 4 · Icon sizing — *the second absent system*

**CURRENT.** Five sizes — `size-3` / `3.5` / `4` / `[17px]` / `[18px]` — chosen per call site. The same severity icon renders at 16px on `/ask` and 14px on `/travellers/[id]`. A widget footer's arrow is 16px beside 13px type.

**PROPOSED.** Three sizes, each bound to a type role:

| Token | px | Pairs with | Job |
|---|---|---|---|
| `icon-sm` | 12 | `micro` | inside chips and micro labels |
| `icon-md` | 14 | `data` | inline with text; inside controls |
| `icon-lg` | 16 | — | severity and status marks *only* |

**The rule:** *an icon is never larger than the type beside it, unless the icon is the information.*

**RATIONALE.** Icon size currently competes with type for hierarchy without meaning to — the footer arrow outweighs its own label. Binding icon size to type role means the pairing is derivable rather than remembered, and reserving 16px for severity gives status marks a size no decorative icon can borrow.

**REUSE.** ~110 icon instances.

---

## 5 · Radii

**CURRENT.** Pill / 10 / 6 render across the app. Clean values, but shape carries no meaning: a pill can be a status chip *or* a pressable control.

**PROPOSED.** Same three values, bound to meaning:

| Radius | px | Applies to |
|---|---|---|
| `radius-control` | 6 | anything you press or type into |
| `radius-card` | 10 | anything that contains other things |
| `radius-panel` | 12 | the application frame only |
| pill | — | **status only** — never an action |

**RATIONALE.** Reserving the pill for status means shape becomes a second, redundant channel for "is this pressable" — useful on a dense screen where colour is doing almost no work.

**REUSE.** `Chip`, `Button`, the dock, `Section`, the frame.

---

## 6 · Border and surface treatment

**CURRENT.** Three stroke tokens under a comment claiming two. Cards carry `bg-card` *and* `border-border` on a `bg-base` page — but `#fdfcfa` on `#f7f5f2` is nearly no contrast, so the border does all the work while the background does none.

**PROPOSED — surfaces:** three levels, strictly assigned.

| Level | Token | What sits here |
|---|---|---|
| **L0** | `bg-base` | the ground behind the frame |
| **L1** | `bg-raised` | the content panel and the cards on it |
| **L2** | `bg-overlay` | popovers, sheets, dialogs |

`bg-sunken` is **recessed content only** — quoted source, held-back material, raw rows. It is not a fourth elevation.

**PROPOSED — strokes:** three, each with one job: `stroke-frame` (the application's edge, once), `stroke-container` (a card's edge), `stroke-divider` (between rows inside a container).

**Two rules:**
1. *Elevation is carried by one signal.* A nested container uses a border when its parent used a background, and vice versa.
2. *Depth never exceeds two levels from the panel.* A card inside a card inside a card is a composition failure, not a surface decision.

**RATIONALE.** Rule 1 stops the "card in a card" flattening currently visible in the record's rail and the resolve sheet. Rule 2 makes that a violation you can name rather than a matter of taste.

**REUSE.** `Section`, `SplitPage`'s inspector, every sheet and popover.

---

## 7 · Semantic states

**CURRENT.** `ok` / `warn` / `crit` / `neutral` / `primary` tones, plus five evidence kinds, plus three layer badges, plus four absence reasons, plus lifecycle states — all rendered through chips that look alike.

**PROPOSED.** Four state families, one carrier each:

| Family | Values | Carrier | Filled? |
|---|---|---|---|
| **Trust** | verified · stale · disagreeing · unconfirmed | `EvidenceDot` — dot + label | never |
| **Severity** | Info · Important · Critical | chip **+ row rail** | **yes — the only filled mark in a list** |
| **Lifecycle** | new · seen · actioned · deferred · pending | outline chip | never |
| **Absence** | not run · none on file · not applicable · pending | `Absent` — em dash + reason | never |

**The rule:** *one state, one mark.*

**RATIONALE.** This resolves the optical contradiction in the causal trace. The system says *"emphasis is weight before size or colour"*, but `Chip` is filled, and fill beats weight perceptually — which is why the eye reads "chased · 54d" before "Aurelia". Reserving fill for severity alone makes the filled shape mean something, and returns the subject to the top of the visual hierarchy. It also kills the record's amber-chip-plus-amber-date double encoding.

**REUSE.** Every list, every record, every triage surface.

---

## 8 · Density and alignment rules

**PROPOSED — density.** One declared density, two row shapes:

| Shape | Min height | When |
|---|---|---|
| single-line | 36 | metadata is ≤2 short items |
| two-line | 52 | **required** when the row carries ≥2 trailing elements, or when the subject would truncate |

**The measurable rule:** *the subject is never truncated below 50% of its natural width.* If it would be, the row becomes two-line.

**PROPOSED — alignment.**
- Every row is a **grid**, never a flex with `ml-auto`.
- Trailing columns align on a **shared right edge across all rows in a container** — a track, not per-row alignment.
- Numbers are `tnum` and right-aligned; text is left-aligned; **nothing is centred** except empty states.
- Label/value pairs use a fixed label track so values start at the same x on every row.

**RATIONALE.** The 50% rule is the one that fixes "A. Whitfield" rendering as **"A. ..."** — 81% lost — and the Critical notice losing 66% of its message. It is checkable in review and in a test, which "don't truncate important things" is not.

**REUSE.** `.row-grid` and its eight surfaces; the ledger; every inspector.

---

# Part II — Component compositions

Where a component's internal architecture is weak, the proposal changes the architecture — not the spacing.

## 9 · `Section` header — from a bag to two zones

**CURRENT.** `title · chips · actions` on one wrapping axis, undifferentiated. Three classes of thing — an identity, a state, a control — share one line with no hierarchy.

**PROBLEM.** With no rule about what may sit beside a title, callers add whatever they have. On the record this produces **"Enable canonical ● canonical"**, three times on one screen: a badge restating the operative word of the title beside it.

**PROPOSED.** Two zones with an admission rule.

```
┌─────────────────────────────────────────────────────┐
│  IDENTITY ZONE                      ACTION ZONE     │
│  title + at most one qualifier      controls only   │
└─────────────────────────────────────────────────────┘
```

- **Identity zone:** the title, plus **at most one qualifier**, and only if it carries information the title does not.
- **Action zone:** controls only.
- **Status describing the content moves into the body's first row**, not the header.

**RATIONALE.** The admission rule makes the redundancy a violation rather than a matter of taste: "canonical" beside "Enable canonical" adds nothing, so it is not a qualifier and is not admitted. This is a composition fix — it changes what the header *is* — rather than a spacing adjustment.

**REUSE.** All 91 `Section` call sites.

---

## 10 · `Section` variants — replacing the `flush` hack

**CURRENT.** `flush` requires every one of its 23 call sites to *also* pass `bodyClassName="p-0"`. Measured cost: **31 hand-rolled card shells across 13 files** that route around the primitive entirely.

**PROPOSED.** Three named variants, each complete on its own:

| Variant | Body padding | Rules | For |
|---|---|---|---|
| `padded` *(default)* | 16 | header/footer unruled | prose and mixed content |
| `list` | 0 — children own their inset | header and footer ruled | rows, tables |
| `bare` | 0 — no border, no background | none | grouping without a card |

`footer` becomes genuinely optional rather than conventionally always present.

**RATIONALE.** A primitive that needs a second prop to function is one people bypass, and 31 bypasses is the measured price. `bare` matters more than it looks: it is what the Document rail needs when it collapses (§14).

**REUSE.** 91 `Section` uses + the 31 hand-rolled shells they should absorb.

---

## 11 · `WidgetCard` — delete the footer, make the title the link

**CURRENT.** Header + body + a full-width footer band carrying a semibold label and a 16px arrow. Chrome costs **~92px in every widget regardless of content**; the smallest widget is **50% frame**.

**PROBLEM.** The footer is the most emphatic interactive element in each card, competing with the data the card exists to show — navigation weighted above content. And it costs the same 44px whether the body holds four rows or one number.

**PROPOSED.** The title becomes the link. The footer is deleted.

```
CURRENT                          PROPOSED
┌──────────────────────┐         ┌──────────────────────┐
│ Commissions  3 over. │         │ Commissions →  3 over│  ← header is the target
├──────────────────────┤         ├──────────────────────┤
│ EUR 12,532           │         │ EUR 12,532           │
│ … four rows …        │         │ … four rows …        │
├──────────────────────┤         └──────────────────────┘
│ Open the ledger    → │              −44px chrome
└──────────────────────┘
```

Arrow at `icon-md` (14px), inline after the title, revealed on hover.

**RATIONALE.** Three gains from one change. It removes ~44px of chrome per widget — the "50% frame" case disappears. It removes the competing emphasis. And it puts the affordance where the eye already is: the title is read first anyway, so the destination no longer has to be re-found at the bottom.

**REUSE.** All five briefing widgets, across all four roles' dashboards.

---

## 12 · The list row — two-line by default in widgets

**CURRENT.** Single-line rows with trailing chips that never shrink. Measured: subject gets 13% of the row against 87% metadata; "A. Whitfield · Lisbon, four nights" renders as **"A. ..."**; the Critical notice loses two-thirds of its message — including the actionable half.

**PROPOSED.** Two-line composition wherever a row carries more than one trailing element:

```
Hôtel Verlaine — Water damage on floors 2–3            ▌Critical
do not confirm bookings until the property reopens · 2d
```

Line 1: subject + severity. Line 2: consequence + age. Nothing truncates.

**RATIONALE.** The product already proves this works — `/notifications` uses two-line rows and has **zero visible truncation**. This is not a new pattern; it is the pattern the product already got right, applied where it got it wrong.

**REUSE.** Briefing widgets, records table, knowledge, itineraries — eight `.row-grid` surfaces.

---

## 13 · The record's layer card — the layer becomes the frame

**CURRENT.** Three cards with identical border, radius, background and header treatment, distinguished only by a 6px dot and a word that repeats the title.

**PROBLEM.** The three-layer model is the product's central argument, and it is carried by the quietest possible signal. Two elements encode one fact, adjacently.

**PROPOSED.** The layer is an attribute of the **card's left edge**, not an item inside its header.

```
▌ Enable canonical            ▌ Agency overlay          ▌ Personal
▌ Address    14 rue…          ▌ Commission  12%         ▌ My note  "…"
▌ Rooms      42               ▌ Perk        EUR 100     
  clay rule                     ink rule                  ochre rule
```

A 2px left rule in the layer's colour; the badge is deleted.

**RATIONALE.** The layer is a property of the whole card, so it belongs to the card's frame rather than to one item in its header. A left rule is read once and governs everything inside it; a badge is read as one more chip among chips. This also makes the three layers distinguishable at a glance while scrolling, which the dot never achieved.

**REUSE.** Both record surfaces; the same device suits the traveller profile's sharing tiers.

---

## 14 · `DocumentPage` — the missing primitive

**CURRENT.** No `DocumentPage` exists. Both document surfaces hand-roll `lg:grid-cols-[minmax(0,1fr)_320px]` inline. Measured at 795px: six equal cards in one column, with no distinction between the record and context about it.

**PROBLEM.** Because the archetype has no component, the breakpoint is a per-page accident and the collapsed state was never designed. The archetype's whole proposition — a document has a body and a margin — is not degraded below 1024px; it is absent.

**PROPOSED.** A primitive with a declared collapse:

- **≥1024px:** main column + 320px rail.
- **<1024px:** rail sections move **to the end** and take the `bare` variant — no card, no border, separated by a rule and a section label.

**RATIONALE.** Below the breakpoint the rail's content is not a peer of the record, it is an appendix — so it should look like one. `bare` (§10) is what makes that expressible. This is the fix that keeps the archetype legible at the width the product is most likely demoed at.

**REUSE.** `/records/[id]`, `/travellers/[id]`, `/commissions/[id]` — which should adopt the rail it currently lacks.

---

## 15 · The refusal's recovery actions — rank them

**CURRENT.** Three outline buttons of equal weight: *Forward a document to the vault* · *Ask the rep firm* · *Flag for review*.

**PROBLEM.** A refusal's entire value is the route forward. Three equally-weighted routes mean none reads as recommended, so the composition offers a choice where the product has an opinion.

**PROPOSED.** One primary (`control-md`, filled) — forwarding a document, the only route that actually reopens the answer — and two text links beneath.

**RATIONALE.** The product knows which route resolves the refusal. Saying so is the difference between a dead end with options and a recovery path.

**REUSE.** Every multi-action block: the conflict resolve sheet, candidate review, the reconnect sheet.

---

# Part III — Applying the rules to the major screens

### `/briefing` — Dashboard

| Change | From |
|---|---|
| Widget titles become links; footers deleted | §11 — reclaims ~44px per widget, removes competing emphasis |
| All widget rows become two-line | §12 — "A. ..." and the halved Critical notice both resolve |
| Notices sorted by severity; Critical takes a filled chip and a row rail | §7 — severity is currently third in the third card |
| Widgets gain a declared size; grid stops forcing equal heights | §2, §8 — the 44% void in Departures |
| The 48-hour caveat leaves the middot list and sits under the greeting as `meta` | content hierarchy — it qualifies every figure below it |
| Chips become outline except severity | §7 — subjects return to the top of the visual hierarchy |

### `/records/[id]` — Document

| Change | From |
|---|---|
| Layer becomes a left rule; badges deleted | §13 |
| Adopts `DocumentPage` with a designed collapse | §14 |
| Stale state carried once, by the chip | §7 — the amber date returns to neutral |
| The property image band shrinks or moves to the rail | art-direction — the loudest region carries no information |

### `/commissions` — Ledger

| Change | From |
|---|---|
| Stat strip deleted; the two figures not on the briefing move into the header as one `meta` line | page-level redundancy |
| Segmented and search both `control-md` | §3 — resolves 29-beside-36 |
| AGEING gains weight and moves left of DUE | content hierarchy — it is the reason to act |
| Money columns separated from identity columns by a track gap | §8 |

### `/ask` — Conversation

| Change | From |
|---|---|
| Recovery actions ranked one primary + two links | §15 |
| Conversation rail drops to subject + state; count and preview removed | density — five data points in furniture |
| Prose roles confirmed on answers; trace stays `data` | §1 — already correct, now named |

### `/notifications` — Triage

Already the best-composed list in the product. Two changes only: **tag chips gain the outline treatment** (§7), and the two-line row is **promoted from this screen into the primitive** (§12) — this screen becomes the reference implementation rather than the exception.

---

# Part IV — Priority by leverage

**Tier 1 — absent systems. Cheap, and everything downstream depends on them.**

| | Change | Reach |
|---|---|---|
| 1 | **Typography roles: 7, no aliases; `body` and controls inside the scale** (§1) | every screen |
| 2 | **Control geometry: two sizes** (§3) | every control |
| 3 | **Icon scale: three sizes bound to type** (§4) | ~110 icons |
| 4 | **Semantic states: four families, fill reserved for severity** (§7) | every list |

**Tier 2 — primitive contracts. One change each, many surfaces.**

| | Change | Reach |
|---|---|---|
| 5 | **Row: two-line shape + the 50% rule** (§8, §12) | 8 surfaces |
| 6 | **`Section`: three complete variants** (§10) | 91 uses + 31 bypasses |
| 7 | **`Section` header: two zones with an admission rule** (§9) | 91 uses |
| 8 | **`DocumentPage`** (§14) | an archetype |

**Tier 3 — compositions. Fewer surfaces, high visible payoff.**

| | Change | Reach |
|---|---|---|
| 9 | **`WidgetCard`: title-as-link, footer deleted** (§11) | 5 widgets × 4 roles |
| 10 | **Layer as left rule** (§13) | the thesis screen |
| 11 | **Rank the refusal's actions** (§15) | the trust proposition |

**Tier 4 — content hierarchy. Not layout work, and no layout fix substitutes.**

| | Change |
|---|---|
| 12 | Sort notices by severity |
| 13 | Lift the data-quality caveat out of the middot list |
| 14 | Delete the commissions stat strip |

---

## What this deliberately does not change

The warm-neutral discipline, ink-as-accent, the optical weight stops, the 13/16 data leading, the three-banner family, `NarrationNote`'s key gate, and `.row-grid`'s *"exactly one element truncates"* **principle** — which is correct, and whose implementation §12 inverts back to the right way round.

The palette is not touched. The spacing values are not changed, only named. **This is a proposal about rules and compositions, not about taste.**
