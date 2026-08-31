# Visual audit — second pass

Reviewed as found, without reference to what was recently changed or why. Numbers are computed styles and measured geometry from the running app at an 800px pane.

**Headline:** the foundations are real and hold — one type scale, one control pair, severity legible, no truncation. But the refactor **declared four rules it then applied to only part of the product**, and **introduced five inconsistencies of its own**. The most common failure mode here is a rule stated in one file and enforced in one component.

---

## A · Rules declared and not applied

### A1 · The radius system means nothing yet — 33 violations against 10 conformances
`--radius-control` (6px) is documented as "anything you press or type into" and `--radius-card` (10px) as "anything that contains other things".

Measured across the app: **33 containers use `rounded-md` (6px)**, **10 use `rounded-lg` (10px)**. The majority of bordered boxes in the product use the *control* radius. Only `Section` was migrated.

Worst instance — one drawer, the resolve sheet, five containers at **identical nesting depth**:

| Container | Radius | Surface |
|---|---|---|
| Partner portal / Booking platform / Manual entry (×3) | **10px** | transparent |
| "Where this value goes" | **6px** | filled `bg-subtle` |
| "The other fields" | **6px** | transparent |

Same depth, same 16px padding, two radii and two surface treatments. A reader cannot learn the rule because the drawer teaches two.

Also: **five pressable elements use the pill**, which the same rule reserves for status.

### A2 · The spacing rule is inverted on the densest screen
The system states: *padding inside a container is one step smaller than the gap between containers* — 16 inside, 24 between. That relationship is what makes a group read as units rather than one field.

Measured on the briefing: **card padding 16px, gap between cards 12px.** Inside is *larger* than between. Five widgets consequently read as one continuous texture, which is the exact problem the rule exists to prevent.

### A3 · Control geometry covers four primitives and misses four
Brought in: Button, Input, Textarea, Segmented, category tabs, facet triggers.
Left out, and still rendering outside 28/36/44:

| Primitive | Renders at | In use |
|---|---|---|
| `Label` | **14px** — the last live `text-sm` | **4 files** — every sheet with a form |
| `Switch` | 18px | settings |
| `Checkbox` | 16px | records facets |
| `RadioGroup` | 16px | 3 sheets |

So every form in the product still speaks 14px, and the claim "the type scale reaches the controls" is true of buttons and untrue of labels.

### A4 · Button size assignment is unguided
87 Button instances: **42 `sm`, 45 default**. Both sizes are genuinely used — the pair is not theatre. But nothing states *which class of action* takes which, so the split is call-site habit. This is the original finding one level up: the sizes are declared, the assignment is not.

Visible symptom on `/ask`: **"New conversation" (routine navigation) and "Forward a document to the vault" (the refusal's only real recovery) are both filled primaries at 28px.** Two primaries, one screen, equal weight — the ranking work done inside the refusal is cancelled by the header.

---

## B · Inconsistencies the refactor introduced

### B1 · One chip component, two heights
`border` is added to the box, so outlined chips are **20px** and filled chips **18px**. On a single Departures row: "checklist 7/8" (20px, outlined) sits beside "transfer unconfirmed" (18px, filled). A 2px stagger in a row of pills, on every list.

### B2 · Outlined pills read as buttons
Reserving fill for severity was right for hierarchy. But the resulting shape — **a pill with a 1px border** — is the most button-like object in the interface, and the radius rule says a pill is never an action. "chased · 54d" and "checklist 7/8" now invite a click they do not accept. The hierarchy fix created an affordance lie.

### B3 · The same row type has two densities
A notification — severity, subject, message — renders at:

- **52px** on the briefing (`row-stack`)
- **74px** on `/notifications`

Two answers to one composition question, and the new one did not reconcile with the one already there.

### B4 · A freshness caveat now speaks in the severity register
"Booking-system figures up to 48 hours behind" was too quiet buried in a middot list. It is now an amber filled chip directly under the greeting — which, under the new state system, is the **severity** register. It is the second thing the eye meets on the screen, ahead of all content, and it is a footnote. Corrected past the target.

### B5 · A count is wearing severity
"Commissions · **3 overdue**" is a filled crit chip in the card header. It is a *count*, not a severity, and it sits in the identity zone that the header rule says admits only qualifiers. Compare Departures, which carries no header chip at all — two sibling cards, asymmetric headers.

---

## C · Pre-existing, still open

### C1 · The Document archetype still collapses with nothing in its place
Measured on `/records/maison-leandre` at this width: **six cards, all 558px wide, all at x=45** — three layer cards and three rail cards, visually identical. No distinction between *the record* and *context about the record*. This was the fourth finding of the previous pass; `DocumentPage` was specified and not built.

### C2 · The layer signal is now weaker than before
The badge that restated the title is gone — correct. What replaced it is a **2px left rule at 40% alpha of a mid-clay**, against 1px `#e7e3de` on the other three sides. Next to three rail cards of the same width and position, that difference is close to invisible.

The taxonomy is now carried almost entirely by the title text. Deleting the redundancy was right; the replacement does not yet carry the load. **This is a change that improved correctness and reduced legibility.**

### C3 · The two-line rule is applied to one widget and not its neighbour
Notices became two-line. **Departures did not — and it carries more trailing elements** (a day count, a checklist chip, an alert chip). The rule was applied where the failure was measured rather than where the rule points.

### C4 · No hierarchy between a total and a row
In the Commissions widget, `EUR 12,532` (the total) is **13px/590** and `EUR 2,240` (one commission) is **13px/400**. One weight step separates a summary from an instance. The headline figure does not read as a headline.

### C5 · Two dead primitives
`ui/select.tsx` and `ui/tabs.tsx` have **zero imports**. Same class as the duplicate `PageHeader` removed earlier — unused primitives are where systems drift, because nothing contradicts them.

---

## D · Prioritized

**Tier 1 — rules that exist but are not enforced. Highest leverage, because each is one decision applied widely.**

| | Finding | Reach |
|---|---|---|
| 1 | **A1** Radius semantics — 33 containers on the control radius | every card, every drawer |
| 2 | **A3** Label at 14px; Switch/Checkbox/Radio outside the scale | every form |
| 3 | **A2** Card gap 12 against padding 16 — grouping rule inverted | briefing, every grid |
| 4 | **A4** No rule for which action class takes which button size | 87 instances |

**Tier 2 — self-inflicted, cheap to fix.**

| | Finding |
|---|---|
| 5 | **B1** Chip height stagger — `box-sizing` on the border |
| 6 | **B3** Reconcile 52px and 74px to one two-line density |
| 7 | **B4** Caveat out of the severity register |
| 8 | **B5** Count chip out of the severity register, or out of the header |

**Tier 3 — composition, needs judgement rather than a rule.**

| | Finding |
|---|---|
| 9 | **C2** Give the layer a signal that carries — the current rule does not |
| 10 | **B2** Resolve the outlined-pill / button collision |
| 11 | **C4** A total should outrank a row |
| 12 | **C3** Apply the two-line rule to Departures, or state why it differs |

**Tier 4 — structural, previously specified and still unbuilt.**

| | Finding |
|---|---|
| 13 | **C1** `DocumentPage` and a designed collapse below 1024px |
| 14 | **C5** Delete the two dead primitives |

---

## What is genuinely working

Stated so the next pass does not re-litigate it.

- **The type scale holds.** Every route renders only declared roles. `/commissions` went from eight styles with two undeclared to six, all named.
- **Severity is legible for the first time.** Filled where it matters, and the Critical advisory now sorts first and renders its actionable half.
- **No truncation anywhere on the briefing** — the worst subject previously kept 13% of its width.
- **The filter row works.** Segmented and search agree at 28px; that pairing was the original exhibit.
- **The demoted widget footer is right.** It keeps the label that names the saved view and no longer outweighs the card's content.
- **The refusal's ranking is right** — one primary, two links — and is only undermined by the header competing with it (A4).
