# Critique of the proposal, and the implementation plan

Reviewed against the charge of over-systematization. Seven revisions follow, then the plan.

---

# Part I — What I would now change

## 1 · I collapsed a real typographic distinction: `prose-quote`

**I proposed** folding `type-prose-quote` into `prose` + an `.italic` modifier.

**That is wrong.** The two differ by more than slant: quote is **15/24**, prose is **16/25**. A quoted excerpt inside an answer *should* sit a step below the answer — that is standard blockquote practice, and it is what stops a quotation from competing with the sentence that introduces it. Folding it in forces quotes to full prose size and makes them heavier than the prose they support.

**Revision:** keep `prose-quote` as a role. **Eight roles, not seven.** The `italic` is incidental; the size step is the point.

---

## 2 · My icon rule is mathematically stated and optically wrong

**I wrote:** *"an icon is never larger than the type beside it."* Then I specified `icon-md` at **14px** to pair with `data` at **13px**.

My own rule contradicts my own values on the first pairing. And the values are right — an icon needs slight over-size to balance against x-height, because a 13px icon beside 13px type reads as undersized.

This is precisely the trap in the brief: privileging mathematical consistency over optical quality. The correct statement is optical.

**Revision:** *icons pair with a type role, and the pairing is tuned by eye, not by matching pixels.* `icon-sm 12` ↔ `micro`, `icon-md 14` ↔ `data`, `icon-lg 16` ↔ severity. The pairing table is the rule; there is no arithmetic rule above it.

---

## 3 · "Controls on the same line match" is too strong, and it contradicts having two sizes

If `control-sm` and `control-md` both exist, they will legitimately share a line — a dense filter beside a primary action. My rule forbids the thing the two sizes exist for.

**Revision:** *controls of the same class on the same line take the same size.* A filter row is uniformly `sm`; an action row is uniformly `md`. The commissions defect — Segmented 29 beside Input 36 — is a violation because both are **filters**, not because they share a line.

**Also missing:** I never exempted chips. A removable filter chip is pressable but is not a control; forcing it to 28px would make every filter row substantially heavier. **Chips are status carriers that may take an affordance, and they keep their own height.**

---

## 4 · `bare` is a variant that makes a card not a card

I added `Section variant="bare"` — no border, no background, no padding — to serve the collapsed Document rail.

A variant of a card primitive whose effect is *cease being a card* is a smell. It is a `<section>` with a heading, and it does not need the primitive.

**Revision: drop `bare`.** `Section` has two variants — `padded` and `list`. `DocumentPage` renders its collapsed rail as plain markup with a heading. Two variants, not three.

---

## 5 · Deleting the widget footer throws away information

This is the clearest over-correction in the proposal, and it came from treating "too loud" as "delete".

The footers are **specific**: *Open the ledger* · *All departures* · *See affected records* · *Records needing verification*. Each names the **saved view** you will land in. `Commissions →` does not. The footer's *emphasis* was wrong; its *content* was doing real work — and it is the mechanism by which the product's saved-view claim is legible at all.

I also specified the arrow as hover-revealed, which hides an affordance on touch, and made the whole header a link, which would swallow the chip into the link's accessible name.

**Revision:** demote rather than delete. Keep the label and its specificity; drop the ruled band and the full-width treatment; set the label at `meta`, the arrow at `icon-md`, left-aligned at the card's foot. Chrome falls by roughly half instead of by all, and the label survives.

---

## 6 · Colouring the layer rule collides with the state system

I proposed a 2px left rule per layer — clay / ink / ochre.

Colour in this product means **state**. Three stacked cards with three coloured left edges will read as a severity ramp, because that is what a coloured left edge already means on the notification row I proposed in the same document. I would be spending the product's scarcest channel on a taxonomy that is not a state.

**Revision:** the left rule stays as a **structural** device in one neutral value, and the **title alone** names the layer. The rule groups; the title names; colour stays reserved for state. The badge is still deleted — that finding holds.

---

## 7 · Two-line rows do not belong on tabular surfaces

I specified the two-line row for "eight `.row-grid` surfaces", which sweeps in the commissions ledger.

A ledger's value is scan density — two-line rows would halve visible rows and damage the thing the surface is for. And a table does not have the failure anyway: its columns are **tracks**, so the subject has a guaranteed share and cannot be squeezed to 13% by its neighbours.

**Revision:** the two-line shape applies to rows carrying **free-flowing trailing chips** — briefing widgets, notices, knowledge. Tracked/tabular rows keep one line. The 50% rule still governs both; on a tracked row it is satisfied by the track, not by a second line.

---

## Answering the rest of the charge honestly

**Are we creating too many tokens?** No — about 27 named things across seven scales is modest. But my framing was inconsistent: I said spacing would be "named for function rather than size" and then named the steps numerically. Numeric is the better choice — semantic spacing names are a known trap, because one value serves many functions. **The framing was wrong, not the values.**

**Are we normalizing things that should differ?** Two near-misses, both caught above (chips into control geometry, tables into two-line rows). The filter idioms and the widgets' internal layouts I had already ruled legitimate, and I still would.

**Are we solving local problems with systemic abstractions?** `bare` was — now dropped. `DocumentPage` is borderline: it has **two** real consumers today, and I counted a third that is itself only a proposal. Two consumers plus a documented archetype is enough, but I should not have inflated the count.

**Does it actually improve hierarchy?** For lists, clearly — severity ranked, fill reserved, subjects protected. **For cards, less certain.** I am removing signals (the footer band, the layer badge) without adding compensating ones, and reserving fill may leave neutral chips too weak in a light palette. That is an optical question a spec cannot settle. It needs to be looked at, and reverted if it washes out.

**Does it make the product feel more intentional?** The three absent systems, unambiguously yes — they convert accidents into decisions. The compositional changes are genuinely debatable and should be made **with eyes on the screen**, not from this document.

---

# Part II — Implementation plan

## Phase 0 — What not to do before Tuesday

**The interview is tomorrow.** Every change below is a design-system refactor touching shared primitives, and the app is currently working, verified and demo-ready.

**My recommendation: ship nothing from this plan tonight.** The expected gain is a modestly tighter interface; the risk is a broken primitive discovered on stage. The composition findings are more valuable as *material* than as *changes* — being able to say "here is the audit, here is what I would change and why" demonstrates more than a slightly better-aligned chip does.

If anything ships tonight, it is Step 1 alone, which is mechanical and verifiable.

---

## Phase 1 — Absent systems *(mechanical, high reach, verifiable)*

### Step 1 · Typography roles
**Files:** `globals.css`, then a codemod across `src/`.
1. Define the eight roles. Delete the five `t-*` aliases and the three duplicate names.
2. Set `body` to `data`.
3. Point `Button`, `Input`, `Textarea` at `data`.

**Verification:** the audit's own probe — enumerate every rendered `font-family/size/weight` inside `main` across the primary routes. **Pass = the set equals the eight roles plus the two mono roles.** Today it returns fourteen.
**Risk:** low. **Rollback:** revert one CSS file plus a mechanical rename.

### Step 2 · Control geometry
**Files:** `globals.css`, `bits.tsx` (`Segmented`), `ui/button.tsx`, `ui/input.tsx`, `ui/textarea.tsx`, `ui/select.tsx`, facet triggers in `records/page.tsx`, tabs in `knowledge/page.tsx`.
Add `--control-h-sm: 28px` / `--control-h-md: 36px`; re-point every control; exempt chips and the dock.

**Verification:** measure every control height per route. **Pass = every rendered control is 28, 36 or 44.** Today: six values.

### Step 3 · Icon scale
Three tokens, applied by the pairing table. **Verification:** no icon outside {12, 14, 16}; severity icons all 16.

### Step 4 · Semantic states
Fill reserved for severity; trust, lifecycle and absence take outline.
**Verification is visual, not numeric** — and this is the step most likely to need reverting. Look at `/briefing` and `/records` before and after; if neutral chips lose presence, fall back to a borderless tint for non-severity rather than to fill.

---

## Phase 2 — Primitive contracts

### Step 5 · The row's two-line shape and the 50% rule
`.row-grid` gains a two-line variant. Apply to chip-carrying rows only — briefing widgets, notices, knowledge. **Not** the ledger.
**Verification:** the truncation probe. **Pass = no `.row-primary` renders below 50% of its `scrollWidth`.** Today the worst is 13%.

### Step 6 · `Section` — two complete variants
`padded` and `list`; `list` needs no caller-side padding override. Then absorb the 31 hand-rolled shells.
**Verification:** `flush` and `bodyClassName="p-0"` both fall to zero occurrences; hand-rolled shells fall from 31.

### Step 7 · `Section` header — two zones
Identity zone admits the title plus at most one *informative* qualifier; action zone takes controls. Deletes the three layer badges by rule.

### Step 8 · `DocumentPage`
Main + rail ≥1024; below that, rail sections move to the end as plain markup with a heading.
**Verification:** at 795px the record shows a designed appendix, not six equal cards.

---

## Phase 3 — Compositions *(judgement; do these with the screen in front of you)*

- **Step 9** — Widget footer demoted (not deleted): label kept at `meta`, band and full-width treatment removed.
- **Step 10** — Layer card: neutral structural left rule, title names the layer, badge deleted.
- **Step 11** — Refusal actions ranked: one primary, two links.

## Phase 4 — Content hierarchy *(no layout fix substitutes)*

- **Step 12** — Sort notices by severity.
- **Step 13** — Lift the data-quality caveat out of the middot list.
- **Step 14** — Delete the commissions stat strip; move the two non-duplicated figures into the header.

---

## Sequencing

```
Tonight        →  nothing, or Step 1 alone
After Tuesday  →  Phase 1 (Steps 1–4)      one sitting, mechanical
                  Phase 2 (Steps 5–8)      one sitting, needs verification after each
                  Phase 4 (Steps 12–14)    cheap, independent of the rest
                  Phase 3 (Steps 9–11)     last — they need eyes, not a spec
```

Phase 4 is independent of Phases 1–3 and could go first if you want visible improvement for the least risk.

**Each step lands with the probe that proves it**, because every claim in this audit came from a measurement, and the fixes should be held to the same standard.
