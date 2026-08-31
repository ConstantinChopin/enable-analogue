# Art-direction pass — the interface as composition

Implementation quality set aside. This judges the screens as pictures: what the eye does, in what order, and whether the arrangement serves the reading.

**Method and its limit.** The briefing was read as a full-viewport capture; the commissions ledger and the record's canonical card from captures supplied during review; records, travellers, ask, record detail and the mobile frame from captures earlier in the session. The browser's screenshot service failed repeatedly mid-pass, so several screens were assessed by **measured geometry** instead of by eye — element widths, truncation ratios, empty-space fractions, chrome-to-content ratios. Where a claim is numeric it was measured on the running app at a 795px content width. Two screens — `/admin/review/sereno` and `/admin/publish` — I could not re-examine visually and have left out rather than guess.

---

## The five that matter

### 1. The composition sacrifices the subject to preserve the metadata

This is the most serious compositional fault in the product, it is structural rather than local, and it is worst on the screen seen first.

On the briefing, measured across 15 rows: **the trailing chips take roughly half of every row**, and in the worst case the subject gets **13% of the width against 87% for its metadata**.

| Row | Shown | Needed | Lost |
|---|---|---|---|
| "A. Whitfield · Lisbon, four nights" | 38px | 197px | **81%** |
| "Hôtel Verlaine — Water damage on floors 2–3 — do not confirm bookings…" | 235px | 688px | **66%** |
| "Tsavora Lodge — Camp relocating with the migration from 10 Sep…" | 221px | 537px | 59% |
| "Borgo Selvane — Approach road resurfacing until late September…" | 252px | 567px | 56% |

A. Whitfield renders as **"A. ..."** — a person reduced to two characters and an ellipsis — while "checklist 7/8" and "transfer unconfirmed" sit beside it at full width, uncut. The single **Critical** notice on the screen loses two-thirds of its message, and what it loses is the actionable half: *do not confirm bookings until the property confirms reopening*.

The cause is a rule that reads as good discipline and inverts the priority in practice: the row primitive marks trailing items `flex-shrink: 0` and lets only the primary ellipsise. Metadata is therefore incompressible and the subject is infinitely compressible. **The layout protects the least important thing in the row.**

Notice that the product already contains the correct answer. `/notifications` has **zero visible truncation**, because its rows are two-line — headline on the first, tag and time on the second. The same product holds both the failing pattern and its solution.

### 2. Every widget spends the same chrome regardless of content

Measured on the briefing: header plus footer costs **~92px in every widget**, whatever is inside.

| Widget | Height | Body | Chrome | Chrome share |
|---|---|---|---|---|
| Commissions | 320 | 226 | 92 | 29% |
| Departures | 320 | 228 | 92 | 29% |
| Notices | 346 | 254 | 92 | 27% |
| Expiring incentives | 346 | 254 | 92 | 27% |
| **Records verified** | **184** | **92** | **92** | **50%** |

The smallest widget is **half frame**. A card holding one number and one sentence pays the same structural tax as a card holding four rows and a headline figure. The frame is not earning its cost at the low end.

### 3. The grid forces empty space into cards that have nothing to say

**Departures is 44% empty** — 100px of void in a 228px body — purely because it shares a grid row with Commissions, which is taller. Notices is 19% empty for the same reason.

This reads as an incomplete screen rather than a calm one. The whitespace is not composed; it is a by-product of `sm:grid-cols-2` with equal-height tracks, and it lands in the middle of the densest screen in the product.

### 4. The Document archetype's central idea disappears at the width it will be shown at

`/records/[id]` is designed as a main column plus a context rail. The rail is behind `lg:` — **1024px**. Measured at 795px, all six sections render as **one 690px column**: Enable canonical, Agency overlay, Personal, Amenities, Contacts, Active promotion.

At that width there is no longer any visual distinction between *the record* and *context about the record*. Six cards of equal width, equal weight and equal treatment stack in a queue, and the reader is given no signal which three are the subject and which three are commentary. The archetype's proposition — that a document has a body and a margin — is not degraded gracefully; it is simply absent, with nothing put in its place.

### 5. Card titles restate their own badges

All three layer cards on the record:

> **Enable canonical** · ● canonical
> **Agency overlay** · ● agency
> **Personal** · ● personal

The badge repeats the operative word of the title it sits beside, in every case, three times on one screen. Two elements, one meaning, adjacent. It reads as a component that was designed in isolation and never looked at next to its own heading.

---

## Region by region

### The briefing — *Dashboard*

**What I notice first.** "Good morning, R. Devane" at 24px serif. Correct — it is the only serif on the screen and the only thing at that size.

**What I notice second.** Not the most urgent item. The eye goes to **EUR 12,532**, because it is the largest number and sits top-left of the first card. But the most consequential thing on the screen is the Critical water-damage notice, which is in the *third* card, on the *third* row of that card, below two lesser items. **Severity does not drive position, size or weight anywhere on this screen.**

**Unnecessarily loud.** The widget footers. "Open the ledger" and "All departures" are 13px semibold, full width, in their own ruled band, with a 16px arrow — an arrow larger than the type it sits beside. They are the most emphatic interactive element in each card, competing with the data the card exists to show. Also loud: the pill chips. They are filled shapes among unfilled text, so the eye reads "chased · 54d" before "Aurelia".

**Too quiet.** The data-quality caveat. *"booking-system figures up to 48 hours behind"* is the reason to distrust every number below it, and it is set at 12px, in secondary grey, third in a middot-joined list after a date and a sync time. Three unrelated facts wearing identical typography.

**Visually unrelated.** "Expiring incentives" uses a two-line stacked row with a prose sub-line (*bonus — adds to base · book by 05 Sep · travel by 20 Dec*). The other three widgets use single-line rows. Four widgets, and the fourth has its own internal grammar for no reason the reader can infer.

**Crowded.** The Departures rows: name, trip, "in 3d", a checklist chip and a warning chip inside ~290px, which is what forces "A. ..." Meanwhile the same card is 44% empty below.

**Arbitrary.** Four widgets in a 2×2 grid, then a fifth ("Records verified this quarter") alone on a row at half the width, 50% chrome. The grid has no rule about widget size, so the last one is orphaned.

### The record — *Document*

**What I notice first.** The property image band — a large generated motif, the most saturated area on the page. It carries no information.

**What I notice second.** The notice banner, correctly.

**Under-resolved.** The three layer cards are visually identical: same border, same radius, same background, same header treatment. Their entire point is that they are *different layers of authority* — canonical, agency, personal. The layer is communicated only by a 6px dot and a repeated word. A structure the whole product argues for is carried by the quietest possible signal.

**Good.** The field row after its rebuild — label, value, provenance on a shared right edge — has genuine three-column clarity, and the provenance stack (source over date) reads as one object rather than two.

**Arbitrary.** The stale field's chip and its date both go amber. Two amber marks for one fact, on a row where nothing else is coloured.

### The commissions ledger — *Ledger*

**What I notice first.** The three stat cards. They are the only 3-up strip in the product and they occupy the top third.

**What I notice second.** The table header — uppercase, mono, letterspaced — which is louder than the data beneath it.

**Unnecessarily loud.** Those stat cards. "TOTAL OUTSTANDING / EUR 12,532 / 9 open commissions" duplicates the briefing widget verbatim; the reader has just come from it. Three cards, ~120px tall, to restate what brought them here.

**Too quiet.** The AGEING column — 28, 19, 12 days — is the whole reason to act, and it is last, right-aligned, in secondary grey, tied with DUE.

**Crowded.** Seven columns at 795px. PROPERTY, BOOKING, TRAVELLER, AMOUNT, STATE, DUE, AGEING with no visual grouping — money columns are not separated from identity columns.

**Under-resolved.** The em-dash in AGEING for non-overdue rows is correct discipline, but five consecutive dashes in a column read as a broken import.

### Ask — *Conversation*

**What I notice first.** The question bubble — filled ink, right-aligned, the only inverted element on the screen. Right, though it is the thing the reader wrote and already knows.

**Second.** The serif answer. The two-voice contrast works: prose reads as prose, the trace beneath reads as machine.

**Too quiet.** The recovery actions under a refusal — *Forward a document to the vault*, *Ask the rep firm*, *Flag for review* — are three outline buttons of equal weight. The refusal's entire value is the route forward, and all three routes are weighted identically, so none reads as the recommended one.

**Crowded.** The left conversation rail at 290px holds title, timestamp, two-line preview, state and message count per item — five data points in a column that is furniture, not the subject.

### Notifications — *Triage*

**The best-composed list in the product.** Two-line rows mean nothing truncates; severity has a rail and a tint; the inspector's action hierarchy is genuinely resolved — one filled primary, two equal secondaries.

**Too quiet.** The tag chip and timestamp on line two are the same 12px grey as everything else, so scanning by tag means reading rather than glancing.

---

## Composition inside components

The brief's sharpest question. Three components have consistent tokens and unresolved internal architecture:

**`Section` header.** `title · chips · actions` on one wrapping line, actions pushed right. Three different classes of thing on one axis: an identity, a state, and a control. On the record this produces "Enable canonical ● canonical"; on the connections page it produces a title, a count and a button reading as one undifferentiated row. The header has no internal hierarchy — it is a bag with an order.

**The row primitive.** Its rule — exactly one element truncates — is correct in spirit and wrong in assignment, as §1 shows. The rule should be that the **subject is protected and the metadata compresses**, which is the opposite of what it does.

**The widget footer.** A full-width band with the action's label at semibold and an oversized arrow. It gives navigation more weight than the content it navigates from. Compare the notifications inspector, where the primary action is filled and unmistakable but proportionate — the same product resolving the same problem correctly one screen away.

---

## Prioritized

1. **Invert the row's truncation contract.** Protect the subject; compress or wrap the metadata. Fixes "A. ..." and the halved Critical notice — the two worst moments in the product, both on the first screen.
2. **Let severity drive position and weight on the briefing.** Critical currently sits third in the third card.
3. **Make widget height follow content.** Masonry, span rules, or a size property. Removes the 44% void and the orphaned fifth widget.
4. **Reduce the widget frame at the low end.** ~92px of chrome on a 92px body is the clearest arbitrary decision on the screen.
5. **Give the layer cards a real visual difference** and delete the badge that repeats the title.
6. **Demote the widget footers.** They are navigation, not content.
7. **Provide a Document fallback below 1024px** — the rail's collapse currently erases the archetype at the width most likely to be demoed.
8. **Cut the commissions stat strip** or earn it. It restates the widget the reader just left.
9. **Raise the data-quality caveat** out of the middot list. It qualifies every figure beneath it.
10. **Rank the refusal's three recovery actions.** One is the recommended route; the composition says all three are equal.
