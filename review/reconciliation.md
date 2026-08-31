# Reconciliation — your four-part review

Every finding from the review, what changed, and **how to check it yourself**. Nothing here asks to be taken on trust: each row names the route, the role and the state to reach it, and where a claim is numeric it gives the number and how it was measured.

Run the app per `README.md` §2. Unless a row says otherwise, the session is **advisor · v2**.

**Two things that would otherwise read as failures.** In dev, a console selector run immediately after `navigate` can return `[]` because the route has not hydrated yet — re-run it once the page has painted. And in the field-row query below, the *Commission* row returns `null` for its provenance slot: conflict rows carry their sources inline and are not given one. Both are expected.

Where a finding was **not** actioned, it says so and why. Where the fix went further than the finding, that is marked **↑**.

---

## 1 · Your ranked five

### 1. The colleague's trace panel contradicted the refusal

> *"The product has just said it cannot answer the rate, and then asserts it checked the rate."*

The trace was rendering the answer's full lineage regardless of reader. It is now built from what the reader can see: a stage that only ever touched restricted material is marked `needsCommission` in the seed and filtered out.

**Check:** sign in as **J. Dubois (colleague)** → `/ask` → open *Maison Léandre — Atelier rate*. "How this answer was built" now lists two stages — *Agency directory, vault, and notes* and *Vetted external sources*. The *Curated specialist layer* stage is gone. Sign in as **R. Devane** and open the same thread: three stages.

**↑ Also:** the composer's permanent claim — *"Every answer cites sources you can open"* — is deleted. It was false for that reader on that screen. The slot now holds the scope chip (see 1.4).

---

### 2. The vintage was over-marked in one place, unmarked in the other

Marking moved into the frame bar, so it is true on every surface at once. Both self-captioning banners are deleted — the v1 record's failure is that it looks clean and says nothing.

**Check:** press `V` anywhere. A chip reads **"March build — superseded"** in the breadcrumb strip, top right. Confirm it persists across `/ask`, `/records/maison-leandre`, `/briefing`. On `/records/maison-leandre` in v1 the notice is simply absent, with no banner explaining its absence.

**Your reframing, taken:** in v1 the answer chip now reads **"answer contract met — sourced, cited"** — the contract was real, freshness was not yet in it.

**Also closed:** the thread index no longer lists a `refused` conversation in v1, since refusal is a v2 capability.

---

### 3. The colleague's Commissions widget was a mask with a caption

Deleted from `widgetsFor.colleague`, not emptied. The permission branch in the briefing is gone with it.

**Check:** as **colleague**, `/briefing` opens on **Departures**. No Commissions card, no explanation of its absence — the same treatment Expiring Incentives already had.

---

### 4. The dock shift, and `askScope`

The active tile grew to fit its label while inactive tiles were fixed at 44px; because the dock is centre-justified, the whole dock slid on every navigation.

**Check — measure it:** open the console on any surface and run

```js
Math.round(document.querySelector('nav[aria-label="Workspaces"]').getBoundingClientRect().width)
```

**495 on every route.** Navigate between `/briefing`, `/notifications`, `/ask`, `/knowledge` and re-run — the number does not move.

The permanent label is gone rather than floated: the breadcrumb already names the current surface, so the dock was saying it twice, and a floated label would have been clipped by the dock's own scroll container. Active state is the filled tile plus the indicator dot; labels are one hover away.

**`askScope`** was dispatched from every "Ask about this" into a crumb `PageHeader` does not draw. **Check:** `/records/maison-leandre` → *Ask about this* → the composer shows **"Scoped to Maison Léandre"** with a removable control labelled *"Ask across everything instead of Maison Léandre"*.

**One correction in your favour:** you measured a residual shift on `/notifications`. That is `NEXTJS-PORTAL`, the dev-tools overlay, adding a scrollbar. Dev-only chrome, not the product.

---

### 5. Narration

Cut, not gated. Worth knowing: `NarrationNote` was already behind the `N` key, so everything you counted was plain prose — these are deletions.

| Where | What went |
|---|---|
| `/admin/review` | both prose cards (*Scope inheritance*, *Bulk seeding*) and the paragraph under the table |
| `/admin/connections` | the *When a source fails downstream* card, and the duplicated half of the subtitle |
| `/travellers` | the closing line restating the header's sharing claim |
| `/notifications` | the line between the filter rows, and the inspector's closing line |
| all three briefings | *"Each widget is a saved view…"* |
| ops briefing | *"Unmatched money stays visible. It is never parked."* |
| `/itineraries` | the subtitle re-explaining the saved-view mechanism |
| `/ask` composer | the manifesto line |

**Check:** the "nothing clears itself" count is down from five restatements across four surfaces to one, in Settings — which you identified as the place it belongs.

---

## 2 · The rest of part three

| # | Finding | Change | How to check |
|---|---|---|---|
| 1 | **Absence means three things** | An `Absent` primitive (`components/bits.tsx`) extends the ledger's em-dash convention. Restricted stays absent — now the only meaning of blank. | `/travellers`: A. Whitfield and D. Lindqvist read **"Acuity — not run"**. `/travellers/s-marchetti`: every checklist row is marked, `pending` **or** `done`. `/knowledge`: *Supplier webinar notes* reads **"— pending"** under Access. |
| 3 | **Raw probabilities** | Numbers dropped, bars kept; traveller preferences gained a bar. | `/admin/review/sereno` — bars, no `0.98`. `/travellers/s-marchetti` — no `0.60`/`0.65`; the bar carries it, and the source count beside it says the rest. |
| 4 | **Dock under-populated for lead and ops** | Lead: **Confirm records**, **Publish queue**. Ops: **Unmatched payments**. | As **lead**, dock shows 6 tiles. As **ops**, `/ops/resolution` is a tile *and* renders as the active one. |
| 5 | **Notifications panel title / severity / chrome** | Title is the subject, not the tag. Critical takes a solid `crit` rail and a tinted ground. The two segmented controls share one row. | `/notifications` → open the Hôtel Verlaine item: panel titles **"Hôtel Verlaine"**. The Critical row is visibly distinct from the six Important ones. Filters are one line, not three. |
| 6 | **Travellers: plural, names, chip order, equal height** | `1 profile` singular; cards carry `aria-label`; the share chip leads on its own line with counts demoted to meta; `h-full` on the row. | `/travellers`: A. Whitfield reads **"1 profile"**. Read the a11y tree — six named buttons, not six "button". Open the inspector: cards stay equal height. |
| 7 | **Profile leads with logistics; fake tabs** | The checklist moved below the preferences and lost its heavy bar. **↑ The tab row is deleted entirely.** | `/travellers/s-marchetti` opens on the person. No tab row: it was five tabs above a stacked column that already held their content, four inert — and once Financials was built it labelled built content "not built". |
| 8 | **Sign-in carries none of the language** | 12px inset, hairline panel, no window scroll. Demo setup moved into the column. | `/signin`: run `document.documentElement.scrollHeight > document.documentElement.clientHeight` → **false**. |
| 9 | **Display-size drift** | `t-display` is now exclusively the page title. Every in-widget figure demoted to `t-title`. | `grep -rn "t-display" src/app` → **one hit**, the sign-in `<h1>`. (The others live in `PageHeader`.) |
| 10 | **No reconnect on the failing row** | A Reconnect control opening a sheet: what is degraded while it is down, what re-authorisation needs, and an attributed log line. | `/admin/connections` as **lead** → **Reconnect** on Partner portal. |
| 12 | **Four definition-list patterns** | One `DataList` in `bits.tsx`, used by the notifications inspector, the travellers inspector, the knowledge panel and traveller Financials. | Compare the four — same rules, same spacing, same absence handling. |

**Not actioned, deliberately:** your praise items (the notification inspector's action hierarchy, `/admin/review/sereno`, the lead briefing, the S. Marchetti rail) were left alone.

---

## 3 · The rest of part four

| # | Finding | Change | How to check |
|---|---|---|---|
| 4 | **Thread index leaks** | A thread whose subject is commission terms withholds its outcome chip and message count from a reader without that access. | As **colleague**, `/ask`: the Maison Léandre thread shows no "sources disagree", no count. |
| 5 | **Itineraries filter chip not applied** | The filter was correct; its **off state** was the bug — a bordered pill reading "Departing within 30 days", indistinguishable from the applied chip. It now reads **"Limit to the next 30 days"**, dashed, with a plus. The header count follows the filter. | `/itineraries`: header reads `8 trips`; apply the window → `3 of 8 trips`. |
| 6 | **Knowledge promises 1,284, shows 11** | The footer states which number is the build and which is the vault, rather than implying paging that does not exist. | `/knowledge` footer: *"This reconstruction carries a working sample of the 1,284 documents. Paging is not built."* |
| 7 | **Two archetypes stacked in one route** | The day board sits on its own tinted band under an eyebrow reading **"One trip, opened"**. | `/itineraries`, scroll down — the change of unit is now a visible change of ground. |
| 8 | **Queues collapse at low counts** | Both gained a floor: `closedPayments` and `confirmedRecently`, with reason and attribution. | `/ops/resolution` — 2 open above 3 closed. `/admin/review` — 3 in review above 3 confirmed. |
| 9 | **Knowledge rail holds two scopes** | The vault meter moved onto the page; the panel is titled with the document. | `/knowledge`: the 71% meter is a page section; the panel reads **"Atelier Collection terms.pdf"**. |
| 11 | **Internal vocabulary on ops** | *"never intelligence values"* → *"Ranking suggests which booking this payment belongs to. It never edits anything on the booking itself."* | `/ops/resolution` → **Match**. |
| 12 | **Smaller items** | `processing` no longer fills two columns; *"Owner: anyone ×"* deleted; *"3 intranet errors"* filters to Intranet; Settings' Connections section is absent for roles that cannot manage them; `SchematicBadge` has one stated meaning — *drawn, not wired* — on hover. | `/knowledge`, `/settings`. |

**Your "Manage access" and "Financials" observations went further than flagged (↑):**

- **Manage access is real.** The vault's own claim is that every widening is an act somebody performs and the log records — the button performing the act did nothing. It opens a scope picker with the three tiers and their consequences, and confirms with an attributed, dated line. `/knowledge` → **Manage access**.
- **Financials was prose describing a feature.** Now real figures carrying the booking system's sync time. **This is the sharper permission proof:** as **advisor**, `/travellers/s-marchetti` has a Financials section; as **colleague at Collaborator Full** (`shareTier: 'full'`), it is entirely absent — no heading, no gap. The sharing tier grants the person; the commission entitlement grants the money; they are two separate grants.

---

## 4 · Beyond the audit

Found after your four parts, from a composition review. These are not in your report — flagged so you can attack them.

**The field row's provenance column was not a column.** Measured on `/records/maison-leandre` before the change: five rows, five different left edges spanning **96px**, at three different vertical offsets. Cause: `ml-auto` inside a wrapping flex right-aligns against the line an element wraps onto, not a shared axis. Replaced with a real three-track grid (`FieldGrid`).

**Check:**
```js
[...document.querySelectorAll('div.grid.gap-x-4.py-3')].slice(0,6).map(r=>({
  label: r.firstElementChild.innerText.trim(),
  right: Math.round(r.children[2]?.getBoundingClientRect().right)
}))
```
Right edge **718 on every row**; vertical offset identical at 12px.

**The same anti-pattern, swept.** 23 instances across 11 files. A detector (any `ml-auto` whose parent is a wrapping flex and whose measured top dropped below its siblings) run over every route at 795px, 560px and 375px found **three real breaks at 375px** — `/records` dropped its count 74px, `/knowledge` its footer note 27px, `/itineraries` 6px. All three now stack at narrow and split at wide. Detector re-run: zero.

**One fact stored twice.** The `pool` field carried `when: "96d unverified"` *and* `state: "stale", staleDays: 96`, so the row printed one state twice in two colours. `when` is now a date.

**The commissions table was the only surface using a different primitive.** `ui/table.tsx` had exactly one consumer, and brought shadcn's spacing scale with it — **8px cell inset against everyone else's 16px, 35px rows against 52px**. Reconciled to the row primitive's values, and its border convention inverted to match the lists (`border-t` from the second row, no rule under the last).

**A dead second `PageHeader`** lived in `bits.tsx` with its own markup and its own display size, imported by nothing. Removed.

**Mobile.** Search and the sync indicator drop below `sm`; the dock carries an edge fade so its overflow reads as scrollable rather than clipped. Tiles stay 44px — Apple's touch minimum, which the iOS thesis rests on.

**The resolve sheet permitted one of three values.** The sheet whose purpose is proving *the advisor decides* allowed exactly the answer a ranking rule would have picked; the other two buttons were disabled. All three are selectable, and the decision now requires a reason before it commits, like every other irreversible act here. **Check:** `/records/maison-leandre` → *Resolve 3 sources* → choose 14% → "Store 14% at the agency layer" stays disabled until a reason is typed.

---

## 5 · Still open

Named so findings are not spent on them.

- **`0 pending` on the publish queue is unreachable** — item 2 has no publish action. Half of your #11.
- **"Contact the property"** on the unacknowledged-cancellation notice has no destination. Correctly badged schematic, but a dead end if clicked.
- **Record imagery** is generated abstract artwork, not photography — deliberate, but it may read as placeholder.
- **The commissions stat strip** (`grid gap-3 sm:grid-cols-3`) appears exactly once in the app. Either it is the Ledger archetype's signature and belongs on `/ops/resolution` too, or it is an outlier. A design question, not a defect.
- **The dock still scrolls by 68px at 375px** — seven 44px tiles plus an account do not fit. The iOS-correct answer is a five-tile cap with the rest behind the account menu; that is an IA change, not a patch.
- **The `flush` card variant** requires callers to pass a padding override as well.

---

## 6 · What to hold us to

The inventories in this folder (`inventory-advisor.md`, `inventory-admin.md`) were captured **before** your review and have not been re-walked since. Where they and the running build disagree, **the build is the fact and the inventory is stale** — which makes them a fair target: anything they claim that the app no longer does is a documentation defect worth reporting.
