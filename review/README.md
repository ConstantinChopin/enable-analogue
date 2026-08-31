# Enable — design review package

Everything needed to review this product's UI and UX. Start here.

This folder is the reading; the running application is its parent directory, `enable-analogue`. Read this file first, then run the app (§2) and review against it — the specs are the intent, the build is the fact, and where they disagree the disagreement is itself a finding.

**Returning after an earlier review?** Go straight to [`reconciliation.md`](reconciliation.md): your findings, what changed for each, and how to check it without taking anything on trust.

---

## 1 · Intake

**What this is, in one sentence.** It answers the questions a luxury-travel advisor would otherwise have to ask five systems and two colleagues — what our commission is here, whether the rate includes breakfast, whether the spa is still closed — and shows where each answer came from, so they can put it in front of a client without checking it first.

**The user, and the state of their day.** A travel advisor with a client waiting: rushed, interrupted, repeating known tasks. Two modes only — triage first thing (*what needs me today*), then fast lookup mid-task with an email half-written. Almost never exploratory; they know what they want. The difficulty is retrieval and trust, not discovery.

**The single most important action.** Getting an answer they will act on **without re-checking it**. Not "search" — retrieval is the easy half. The value is that an answer arrives with its sources, dates and disagreements visible, so it can be forwarded to a client. Grade every screen on how much it serves or obstructs that.

**Frequency.** Daily driver, many times a day, all day. Dense, low chrome, keyboard-friendly.

**Where we are.** Converging on build. One branch is genuinely still open and worth killing if it deserves it: the Ask surface is mid-change and its prose treatment is not built.

**What's fixed.** Stack (Next / React / Tailwind / shadcn) and the data contract, which mirrors a real production schema. Decided and expensive to move: a bottom dock instead of a left rail; five layout archetypes; a two-voice type system (sans for anything computed, editorial serif for anything read as prose); flat, no translucency; warm paper ground, earth-toned semantics, ink accent. Everything else is open.

**Content is fake but load-bearing.** Invented names and figures, internally consistent, sized to stress the layouts — 26 products, 14 commissions, 10 notifications, real overflow and truncation. **Density is fair game; this is not lorem.** Anything genuinely unbuilt carries a visible `schematic` badge.

**Context.** This is a reconstruction of a real product, rebuilt as a case study for an interview. It must survive a design panel rather than a user base, which makes structural findings more valuable than polish — but anything requiring a week is academic.

---

## 2 · Run it

```bash
npm install
npm run dev
```

Then <http://localhost:3000>. Everything is client-side and deterministic — no services, no model calls, no network.

**Sign in** with any of the demo accounts on the sign-in screen, or jump straight in by setting the session directly in the console and reloading:

```js
sessionStorage.setItem('enable-demo-state', JSON.stringify({
  signedIn: true, role: 'advisor', world: 'v2', narration: false,
  conflictResolved: false, reminder: 'idle', spaNoticeClosed: false,
  verlaineAcked: false, candidateConfirmed: false, paymentMatched: false,
  shareTier: 'private', requestFiled: false, noteSaved: false,
  prefConfirmed: false, askScope: null, notices: {}
}))
```

`role` accepts `advisor` · `colleague` · `lead` · `ops`. Flip any other flag to reach a downstream state. The inventories give the exact recipe for every state.

**Keys:** `1`–`8` demo checkpoints · `0` reset · `N` narration overlay (presenter commentary, not product chrome) · `V` build vintage · `⌘K` command palette.

---

## 3 · The four axes

Any screen can be reached at any combination of these.

| Axis | Values | What it changes |
|---|---|---|
| **Role** | advisor · colleague · lead · ops | The dock's tiles, the briefing's entire contents, and what exists at all. Restricted material is **absent, not masked** — a deliberate rule; check we kept it. |
| **Build vintage** | v2 current · v1 March | Rebuilds a superseded design so its failure can be seen rather than described. Press `V`. |
| **State** | default · empty · loading · error · over-full · conflict · refusal · stale · held · gated | Mostly reachable by a query param or one store flag. |
| **Width** | desktop · 390px | The dock is already the mobile pattern; the inspector becomes a bottom sheet. |

---

## 4 · The six journeys

The product's thesis is that one reconciled model is reachable through different doors, so **a screen judged alone will read as a poster**. Review by journey.

| | Journey | The door it opens | Spec |
|---|---|---|---|
| **E** | The Record | the catalogue — layered fields, provenance, disagreements shown rather than resolved | `journeys/journey-e-record.md` |
| **A** | The Trusted Answer | the conversation over that same model | `journeys/journey-a-trusted-answer.md` |
| **B** | The Advisory Lifecycle | its time dimension, including the v1 → v2 iteration | `journeys/journey-b-advisory-lifecycle.md` |
| **C** | The Working Day | the model pushed at you: briefing, commissions, chase | `journeys/journey-c-working-day.md` |
| **D** | Connections & Extraction Confirmation | how it gets fed — nothing becomes truth unconfirmed | `journeys/journey-d-ingestion-confirmation.md` |
| **F** | The Traveller | the most sensitive record type, and its sharing model | `journeys/journey-f-traveller.md` |

---

## 5 · The five sequences worth reviewing as sequences

Single-screen problems are cheap; sequence problems are expensive. These are where the product either holds together or does not.

1. **The two doors** — `/briefing` → `/records` → `/records/maison-leandre` (resolve the disagreement) → `/ask` (the same disagreement, now in conversation). **If this does not read, that is the finding** — it is the thesis.
2. **The refusal loop** — `/ask?state=refusal` → the recovery it offers → the answer working once the gap is filled. Where the trust proposition earns its place or looks like a dead end.
3. **The morning** — `/briefing` → `/commissions/vo` → a drafted chase that will not send itself.
4. **Confirmation** (as `lead`) — `/admin/review` → `/admin/review/sereno` → per-field confirmation, with held fields excluded.
5. **The iteration** — `/records/maison-leandre`, then press `V`: the March build, where an advisory expired silently and the answer is confidently wrong.

---

## 6 · Where everything is

```
review/
  README.md              this file
  reconciliation.md      every finding from the four-part review → the change → how to verify it
  inventory-advisor.md   11 routes · 132 verified states · 8 click-paths
  inventory-admin.md     8 surfaces · cross-cutting axes · ~65 states · 6 click-paths
  design/                the decisions, so intent can be judged separately from execution
    design-language.md     typefaces, type roles, colour, composition rules, token tiers
    visual-system.md       the frame, type scale, spacing ladder, radii, row primitive
    component-audit.md     reuse findings and the standing rules
    layout-exploration.md  why a dock; the five archetypes; notifications as triage
    entity-display.md      how each entity renders at each density
    data-model.md          the entity contract the seed conforms to
    review-01-product.md   the review that prompted the current shape
    demo-choreography.md   the presenter path through the product
  journeys/              the six specs: entry points, unhappy paths, edge cases,
                         errors, acceptance criteria, dated decision logs
```

The application source is one level up, in `../src`. Screens are routes under `../src/app/**/page.tsx`.

---

## 7 · Two requests

**Read the inventories' final sections last.** Each ends with what the specs promise and the build does not do (§8 in the advisor inventory, §7 in the admin one). Those are our own findings. Reading them first contaminates the review; reading them after makes this a genuine test of both. **Anything you find that they do not contain is the most valuable output of this exercise.**

**We have specific suspicions and are not naming them.** Tell us afterwards whether you hit them.

---

## 8 · What changed after the four-part review

**→ [`reconciliation.md`](reconciliation.md) is the document for this.** Every finding, what changed, and the exact route, role, state and measurement to verify it — including the four findings where the fix went further than the report, and the six things still open.

An external audit walked every route across all four roles and reported in four parts. Its findings have been worked through; the inventories and design documents in this folder were written **before** that pass, so where they disagree with the running build, the build is current. In summary:

**Absence has one vocabulary.** An `Absent` primitive extends the em-dash convention the commissions ledger already used. Acuity that was never computed reads "— not run" rather than rendering nothing; checklist rows are marked on both sides, `pending` or `done`; a document awaiting classification reads "— pending". Restricted material remains genuinely absent — now the only thing blank space means.

**The trace is built from what the reader can see.** A stage that only touched restricted material no longer appears for a reader without that permission, so the colleague's refusal and its provenance panel no longer contradict each other.

**The vintage marker moved into the frame bar**, true on every surface at once; both v1 self-captioning banners are gone. In v1 the answer chip now reads "answer contract met — sourced, cited", which makes the sharper point: the contract was real, freshness was not yet in it.

**The colleague's Commissions widget is deleted**, not emptied — a titled card explaining its own emptiness was a mask with a caption.

**The dock no longer shifts.** Every tile is a fixed 44px; the permanent active label is gone because the breadcrumb already names the surface. Lead and ops gained tiles for their own work (confirmation queue, publish queue, unmatched payments).

**Narration cut**, not gated: two prose cards on `/admin/review`, the closing card on `/admin/connections`, the duplicated principle above and below the travellers grid, three of five "nothing clears itself" restatements, the saved-view line on all three briefings, and the Ask composer's manifesto.

**Raw probabilities are gone.** Both surfaces keep the bar; traveller preferences gained one.

**Ask speaks in the prose voice.** Answers and refusals are set in the editorial serif at 16–18px, quoted contract excerpts in the italic quote role, with the trace, chips, sources and every control staying in the machine's sans. This was the last unbuilt piece of the two-voice type system, and it is now visible on the surface where the thesis lives.

**Both queues have a floor** — closed payments and recently confirmed records — so the state they are built to reach no longer reads as a broken screen. `/admin/connections` has a Reconnect control on the failing row.

**Sign-in carries the frame**: 12px inset, hairline panel, no window scroll.

**Component layer**: one `DataList` replaces four definition-list patterns; a dead second `PageHeader` was found and removed; display size is now exclusively the page title; `SchematicBadge` has one stated meaning (drawn, not wired); the traveller profile's fake tab row is gone.

**Corrections of substance.** The conflict-resolve sheet permitted only one of three values — the sheet proving *the advisor decides* allowed exactly what a ranking rule would have picked; all three are now selectable and the decision requires a reason. Traveller Financials was prose describing a feature; it is now real figures, gated, so a colleague at Collaborator Full sees the person and not the money. Two saved-view promises that returned the wrong sets now hold. The false "appears on their briefing" claim is corrected in both places.

---

## 9 · Known open, so findings are not spent on them

- **Record imagery is generated abstract artwork**, not photography — deliberate (fictional properties, no network at demo time), but it may read as placeholder.
- **The `flush` card variant** requires callers to pass a padding override as well. Consistent everywhere, but a wart.

**The inventories were captured before the last round of fixes.** The gap rows below are already closed in the build you will be running — verified in the browser, not just in the diff. Everything else in those lists still stands.

*Advisor inventory §8* — **#45** the knowledge vault now filters by role, so `admin only` documents are absent for a colleague.

*Admin inventory §7* — **#16** every `/admin/*` and `/ops/*` route is role-scoped, and an advisor typing one is returned to their own briefing · **#19** sign-in reads its accounts from the same seed as Settings, so the address matches · **#20** one role-label map, so the account menu and Settings agree · **#21** one health rule in the seed, so the connections header, Settings and the lead briefing cannot disagree about the count · **#2** `leandre-dup` has a **Create new record** control beside Merge · **#3** `villa-unknown` renders its three real controls (open source, fix manually, reject with a reason) · **#13** `/notices` forwards to triage · **#15** root `loading`, `error` and `not-found` exist, and the session gate no longer flashes a blank screen · **#22** the lead briefing's confirmation widget links to `/admin/review`.

**#11 is half-closed**: the publish queue's *Review source* now opens the forwarded mail it was extracted from, but item 2 still has no publish action, so `0 pending` remains unreachable.
