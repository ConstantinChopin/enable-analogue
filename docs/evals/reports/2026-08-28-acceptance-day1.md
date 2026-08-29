# Eval 2 — Acceptance, Day 1 (2026-08-28)

**Target:** running prototype at `localhost:3000` · **Inputs:** the six journey specs + `design/design-system-inventory.md` Rev 2 (declared cuts honored: 390px named transforms owed only on demo screens; schematic surfaces accepted where they carry the schematic marking).
**Method note:** driven headless in a background tab; per-item screenshots replaced by DOM/state verification (documented per item). Verdicts: **PASS / PARTIAL / FAIL / SCHEMATIC-OK** (PARTIAL = the checkbox's core renders but a named clause of it does not).

**Totals: 33 PASS · 1 SCHEMATIC-OK · 13 PARTIAL · 10 FAIL** across 57 acceptance checkboxes.

---

## Load-bearing interactions (end-to-end)

| Interaction | Verdict | Evidence |
|---|---|---|
| Resolve → Ask propagation | **PASS** | Resolved from record card ("Keep this value" 12%) → record shows "12% · resolved · agency layer · by R. Devane today · both sources reachable" → client-side nav to Ask → answer renders with contract chip + "Cites the resolution stored today at the agency layer — both sources reachable". Also works Ask-side first. **Caveat:** state survives only client-side navigation — see fix #2. |
| Reminder draft → send → chased | **PASS** | "Draft a reminder" → editable textarea with booking refs → edited a line → Send → "Sent. Commission → chased; chase logged." + timeline "chased today by R. Devane · logged". No path sends without the review step. |
| Critical-ack blocks until acknowledged | **PASS** | /records/hotel-verlaine: "Add to itinerary shortlist" opens the gate dialog; **Close does not unblock** (second attempt re-opens the gate, `verlaineAcked` stays false); Acknowledge records "acknowledged — R. Devane, today"; add then proceeds ("on the shortlist"). Dialog copy states dismissal ≠ acknowledgment. |
| Colleague absent-not-masked money | **PASS** | As JD: briefing headline/commissions/incentives widgets gone entirely; records directory loses the Rate column and the commission sort; record card drops the Commission field and AGENT TERMS block. Nothing masked. |
| Traveller isolation across share tiers | **PARTIAL** | Travellers surfaces correct: unshared → "No travellers shared with you… absent, not locked" + request-access; Basic → name + contact only, "absent — not masked"; revoke → withdrawal banner with audit-interval copy. **But** JD's record card still renders R. Devane's *private* note ("Ask for the courtyard rooms" — labeled "My note"), and JD's briefing departures list RD's private VICs by name. See fix #3. |
| Candidate confirm with held-fields exclusion | **PASS** | /admin/review/sereno: per-field value + snippet + confidence; rate held (converted figure without source currency), description held (template copy); "Confirm record (stamped: M. Keller, today)" → "Confirmed with 2 fields still held (rate, description) — they stay in review, excluded. The rest is live at the agency layer." Well under 90s. |
| v1/v2 on briefing + record + notices | **PASS** | v1: briefing notices drop the spa notice ("v1 world" chip), record card loses the banner, /notices queue is empty ("this queue did not exist; expiry was silent"). v2: active + "Still true? review due · 76d open". **Not represented in any Ask answer** (spec B AC wanted the failure *in a Journey A answer*) — see fix #7. |

---

## Journey A — The Trusted Answer

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| A1 | All four entry points reach Ask with correct context | **FAIL** | EP1 nav ✓. EP3 "Ask about this" ✓ ("Ask / scoped to Maison Léandre", `askScope` set). EP4 briefing "Ask about the spa closure" reaches Ask scoped, but the thread carries no spa question/answer. **EP2 ⌘K does not exist** — "Search everything ⌘K" is a dead button (no handler, `shell.tsx:87`); nothing opens. Not covered by the "stubbed results" exclusion — the inventory still lists CommandPalette as build. |
| A2 | Retrieval trace in DEC-16 order | **PASS** | "How this answer was built": agency directory/vault/notes → curated specialist layer → vetted external sources, per-stage detail lines. |
| A3 | Contract chip only when all four clauses hold | **PASS** | Chip ("answer contract met" + 3 sources + oldest date + corroborated-by-3) renders only on the resolved answer. Conflict, refusal, and stale states render no chip; refusal shows the per-clause checklist (Sources ✓ / Freshness ✗ / Corroboration ✗). |
| A4 | U1 fully playable | **PASS** | Conflict block (3 values, sourced + dated, none picked) → resolve sheet (ConfidenceMeter, ImpactPanel "one decision, three places", agency-layer attribution note) → subsequent answer cites resolution, both sources reachable. Dismiss leaves conflict standing. Note: spec's A8 required-reason field is absent (Rev 2 ConflictValueRow says reason optional — divergence recorded, not failed). |
| A5 | U2 refusal: three recovery CTAs, no commercial value | **PARTIAL** | Refusal renders calm, no value, contract checklist, held-source panel. CTAs are "Ask the rep firm / Show me the two sources / Flag for review" — **the DEC-14 forward-to-vault-inbound CTA (the only evidence-grounded recovery) is missing**, and "Show me the two sources" is inspection, not recovery. |
| A6 | U4 omission, never disclosure | **PARTIAL** | Only a footnote asserts it ("A permission-filtered source never appears in this panel"). No reachable state demonstrates an omission-shaped answer or the audit log. Exists as copy, not as a state. |
| A7 | E1 Critical blocks output-use until acked | **PASS** | Verified end-to-end on the Verlaine record (see load-bearing table). No advisory banner ever renders *with an Ask answer* (spec E1's first clause) — noted, not failed here since the blocking clause holds. |
| A8 | Client export strips / advisor copy keeps provenance | **SCHEMATIC-OK** | Copy menu renders both options with correct labels ("keeps provenance footer" / "strips internal reasoning") but items have no handlers — nothing is actually copied. Covered by Rev 2 §6 "Export flows (schematic)"; the menu itself carries no schematic marking (low-priority fix). |
| A9 | Loading / empty / error states on every screen | **PARTIAL** | Ask has them all (?state=loading renders X1 partial-trace timeout + retry + "no partial answer"; empty = guided U5 empty state with inbound address; stale; refusal). X2 connector-gap answer state absent. No other screen has loading or error states (no Skeleton/ErrorState usage anywhere in `src/app`). |
| A10 | 390px: usable; source panel → bottom sheet | **FAIL** | At 390px the app shell keeps the fixed 232px sidebar; document scrollWidth 769px → horizontal scroll. No bottom-sheet transform exists. This is a demo screen — owed the full named transform under Rev 2. |

## Journey B — The Advisory Lifecycle

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| B1 | All four entry points create an advisory with pre-linked context | **FAIL** | EP1 record "Add notice…" opens a SCHEMATIC composer (severity + scope + "Submit for review") — accepted as schematic, though it creates nothing. **EP2 briefing-widget "New notice" does not exist. EP3 vault "Create notice from this" does not exist** (no notice affordance anywhere in `knowledge/page.tsx`). EP4 publish queue exists but publishes, it doesn't create. |
| B2 | Severity model; Critical blocks + attributed ack | **PASS** | Info/Important/Critical chips across briefing, record, notices; Critical gate verified (A7). Acknowledgment attributed with name + date. |
| B3 | Scope model explicit + attributed; second account proves U3 isolation | **PARTIAL** | Scope chips + owner attribution render everywhere (agency scope · MK; team scope · J. Dubois). But no personal advisory is provably isolated from a second account; the schematic U4 contradiction card on /notices actually shows JD's *personal-scope* advisory to RD ("personal scope" label visible cross-account) — the demo device undercuts the rule it cites. |
| B4 | Manual close requires reason; vanishes immediately; appears in history | **PARTIAL** | Close dialog requires a reason (button disabled empty); after close the notice leaves /notices, the record card, and the briefing immediately. **No history/archive surface exists anywhere** — "archives with its history" is claimed in copy only. |
| B5 | Stale-review queue: oldest-first, one-tap confirm/close | **PASS** | /notices sorted oldest-first (90d before 76d); "Still active" one-tap → "confirmed by R. Devane today. The review clock resets; nothing closed." Close… works with reason. |
| B6 | v1/v2 world toggle on the seeded day | **PARTIAL** | Briefing, record, and notices queue all change correctly (see load-bearing table). **The Journey A answer never shows the v1 clean-answer failure** — `ask/page.tsx` has no world/advisory handling. Also the v1 record/briefing render explanatory copy ("This silence is the v1 failure") in product mode, contradicting spec U1's "no warning exists anywhere". |
| B7 | E1 ended incentive stops feeding projections pending manual close | **PASS** (copy-level) | "ended, pending close" advisory card renders with exactly the right split: "projected commissions stopped including it immediately. The advisory itself still closes manually." No numeric projection surface contradicts it. |
| B8 | Admin publish queue playable as lead | **PASS** | As MK: queue shows advisor-submitted notice; "Publish agency-wide (owner preserved)" → "published · owner preserved", pending count 2→1. |
| B9 | States everywhere; 390px | **FAIL** | No loading/error states; horizontal scroll at 390 (even the no-horizontal-scroll floor from Rev 2 fails, shell-wide). |

## Journey C — The Working Day

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C1 | Briefing default landing; five widgets seeded | **PASS** | / → /briefing. Headline figure, commissions (overdue first), departures, notices, expiring incentives, verified-progress all seeded. Note: departures render 12d → 3d → 21d — **not soonest-first** (spec §4.1). |
| C2 | Timeline projected→due→paid with provenance; incentive-inclusive projection | **PASS** | /commissions/vo: PROJECTED "EUR 1,240 · rate 12% · partner portal · Mar · +3% active bonus — adds to base" → DUE overdue 12d → PAID unpaid, read-only from booking system. |
| C3 | Draft-reminder: renders, editable, explicit send, chase logged | **PASS** | Verified end-to-end (load-bearing table). |
| C4 | U1 resolution queue playable as ops, match with reason | **PASS** | Candidates ranked strongest-first with signals; reason required (confirm disabled until candidate + reason); result "matched · logged → VO-2214 · reason · attributed A. Blanc". "Ranking orders identity candidates only — never intelligence values" rendered. |
| C5 | U2 credit-not-refund flag at seeded cancellation | **PASS** | "Cancellation resolved as hotel credit — commission protection does not apply. The loss is a known decision, not a silent write-off." |
| C6 | U3 discrepancy both values; accept-with-reason + dispute draft | **PASS** | EXPECTED 1,120 (partner terms) vs ACTUAL 1,008 (remittance, read-only); causes incl. dated FX conversion. Accept dialog requires reason; dispute draft renders SCHEMATIC-badged with the review gate. Oddity: the seeded discrepancy is Palácio das Amoreiras but renders inside Villa Ortensia's commission page. |
| C7 | U4 no path sends without review | **PASS** | The reminder is the only send in the product and it gates on review; no bulk-send, auto-send, or scheduled-chase control exists anywhere. |
| C8 | U5/X1 sync-pending labels + gap notes under degraded seed | **PARTIAL** | Sync labels everywhere ("synced 12:04 · up to 48h behind", "actuals synced… ground truth stays in the source system"). **No degraded seed exists**: the X1 booking-system-unreachable state and the answer gap note ("unreachable since 24 Aug") exist only as descriptive copy on /admin/connections. |
| C9 | E1 unconfirmed-cancellation alert at 24h | **PASS** | Briefing: "cancellation sent 24h ago — no acknowledgment from property — no record of the cancellation" + contact CTA. |
| C10 | Phone frame 390: briefing readable, widgets stack | **FAIL** | No phone layout exists; horizontal scroll. This kills choreography beat 8 (phone briefing) as specced. |

## Journey D — Connections & Extraction Confirmation

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| D1 | EP1 connection flow playable; health rows last-success + error | **PASS** | 5 health rows (connected / syncing / credentials expired, each with last-success); read-only booking connector labeled; Add-connection sheet SCHEMATIC-badged with MCP-first posture. |
| D2 | Candidate card per-field value + snippet (what/where/when) | **PASS** | Every field: value · snippet (row/col) · confidence; identity check renders first. |
| D3 | Unconfirmed invisible to answers and search; E1 from advisor account | **FAIL** | **"Hotel Sereno Kyoto · unconfirmed" renders in the records directory to the advisor persona at all times** (`seed.ts:97` — unconditional row). Contradicts pipeline contract §2.4 said aloud in demo beat 8. The E1 role-aware "material in review" note doesn't exist in Ask either. |
| D4 | Merge sheet: variant duplicate, by choice, with reason, attributed | **PASS** | leandre-dup: similarity 0.92 + signals; field-by-field canonical ⟷ incoming; reason required; "Merged as an overlay on Maison Léandre — reason stored, attributed to M. Keller." |
| D5 | U1 correction preserves field history; U3 hold + reject playable | **PARTIAL** | Reject playable (reason required, logged, attributed). Held state renders in-queue, **but the held candidate's detail page (/admin/review/villa-unknown) is not linked from the queue — unreachable through the UI**; and **no per-field fix/correct affordance exists at all**, so U1 correction + field history is absent (Confirm is the only per-field action). |
| D6 | U5 tightest-scope inheritance; widening explicit + audited | **PARTIAL** | Inheritance asserted in queue copy only. Widening audit does render properly in the vault (WideningHistory: "MK widened access: team → agency · logged"; "private on arrival"). |
| D7 | U6 template-copy flag + corroboration exclusion | **PASS** | Flagged on the candidate ("portal boilerplate detected · excluded from corroboration; queued for enrichment") and on the record card ("template copy — needs editorial · Excluded from answer corroboration"). |
| D8 | Demo beat: one candidate confirmable < 90s | **PASS** | Queue → sereno card → confirm: 3 interactions, held fields excluded automatically. |
| D9 | States everywhere; 390px | **FAIL** | No loading/error states; horizontal scroll at 390 (no-horizontal-scroll floor fails). |

## Journey E — The Record

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| E1 | Directory filterable destination + facility; filters persist | **PARTIAL** | Tabs with counts, removable filter chips (Paris, Programme: Atelier), commission-sorted, quick-look rail. But chips don't actually filter rows, there is no facility filter ("with a spa"), and filters are local state — lost on navigation. |
| E2 | Three layer groups distinct; provenance popover + freshness per field | **PASS** | Canonical / Agency overlay / Personal groups with LayerBadges; field values open FIELD PROVENANCE popover (What · Where · When + "open document (permission holds)"); FreshnessDates throughout. |
| E3 | Seeded conflict both values; resolve from card; appears in Ask answer | **PASS** | Verified end-to-end (load-bearing table). |
| E4 | Field edit lands as overlay, canonical beneath, no silent overwrite | **PARTIAL** | The *result state* renders correctly (Negotiated perk: "agency overlay · Edited by R. Devane · canonical beneath · Daily breakfast for two"). **No edit interaction exists** — the inventory's edit composer was never built; the state is seeded, not reachable. |
| E5 | Note composer forces scope (private preselected); second account sees team/org, never private | **FAIL** | Composer: scope forced, private preselected, attributed ✓ — but the saved note never renders in the Personal group (banner only). **And as JD the record card shows R. Devane's private note verbatim** (`records/[id]/page.tsx` renders the personal group unfiltered by persona; only the commission field is gated). The isolation clause fails outright. |
| E6 | U2 financial fields absent (not masked) for unentitled viewers | **PASS** | As JD: Commission field, rate column, AGENT TERMS, sort-by-commission all absent; no placeholders. |
| E7 | Stale warning at seeded 90+d field, propagates to answers | **PASS** | Pool hours "96d unverified" → Ask stale state answers with date + "stale — inherits the field's warning". |
| E8 | U5 miss path creates a Journey D candidate and logs the gap | **PARTIAL** | "Request via the extraction pipeline" renders + banner "A candidate record now sits in the review queue; the gap is logged" — **but the review queue still shows the same 3 candidates and no knowledge-gaps report exists**. The banner overclaims. |
| E9 | "Ask about this" hands off with entity scope | **PASS** | "Ask / scoped to Maison Léandre". |
| E10 | States; 390px (layers stack, provenance → bottom sheet) | **FAIL** | Demo screen owed full transforms; nothing adapts, horizontal scroll. Also "Verify against source" is a dead button (no handler, no feedback — `records/[id]/page.tsx:341`). |

## Journey F — The Traveller

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| F1 | Owner's VICs listed; second account sees none until shared | **PASS** | RD: 2 VICs "private to you". JD unshared: "No travellers shared with you… absent, not locked." |
| F2 | Every preference renders source + date; composer requires source | **PARTIAL** | All 6 seeded preferences carry SourceTag + date + corroboration count ✓. **No preference composer exists** — the "requires a source" clause is untestable. |
| F3 | U1 amber warning cites preference; proceed possible and recorded | **PASS** | Shortlist conflict cites "classic interiors on three sources"; Proceed → "proceeded knowingly · R. Devane · recorded". Same pattern + "why the warning appeared" on the (schematic-badged) itinerary. |
| F4 | Share tiers Full/Basic; Basic sees name+contact only; revoke; audit interval | **PASS** | Share sheet: named collaborator, Private/Full/Basic with correct capability copy, approval-workflow note. Basic verified from JD (name + contact only, absent-not-masked). Revoke → "the audit records the shared interval." Full tier offered but not exercised this run. |
| F5 | U2 unshared VIC absent; request-access renders | **PASS** | Verified. Note: the banner claims "the owner sees it as a briefing item" but nothing appears on RD's briefing (local state only). |
| F6 | U3 labeled suggestion; confirm moves it with attribution | **PASS** | "Suggestions — labeled, never applied silently"; confirm → "confirmed → preference · R. Devane". Note: the card stays in the Suggestions area rather than moving into the preferences list. |
| F7 | Financial aggregates absent for non-owner roles | **PASS** | Financials tab (SCHEMATIC) owner-only; absent at Basic tier and in JD's views. |
| F8 | E1/OQ-2 tension documented on spec + presenter material | **PASS** | Spec §6 E1 three-stage story; voice-lines.md carries the DEC-01 → DEC-31 line. (Choreography 6b still says "all-or-nothing share" — stale wording, update it.) |
| F9 | States; 390px | **FAIL** | Demo screen owed full transforms; horizontal scroll; no loading/error states. |

---

## Copy check (overview §3 / no-narration)

Layer labeling and provenance discipline are excellent product-wide (layer chips, source + date on every value, "words + color never color alone"). Violations, all of one kind — the UI explaining itself in the third person in product mode (narration off):
- v1 explainers: "This silence is the v1 failure" (briefing), "The spa notice auto-expired on 1 Aug — the card looks clean, the spa is still closed" (record), "v1 carried valid-until dates — this queue did not exist" (notices). Spec B U1 says the v1 state has *no warning anywhere*; these belong in the NarrationNote layer (which correctly hides when narration is off — these lines bypass it).
- Persona helper lines rendered to the persona themselves: "Viewing as J. Dubois: commission figures are absent by policy, not masked."
- Banners that state effects that don't happen (note "renders", candidate "now sits in the review queue", request "seen as a briefing item") — see fix #9.

---

## Ranked fix list

**Demo-blocking**
1. **No 390px layout exists anywhere.** Fixed 232px sidebar forces horizontal scroll on every surface; zero named transforms on the four demo screens. Choreography beat 8 (phone briefing) cannot run. Rev 2's own floor (no horizontal scroll elsewhere) also fails. Fails A10/B9/C10/D9/E10/F9.
2. **A hard reload silently wipes all demo state.** `store.tsx`'s sessionStorage persistence loses to the StrictMode double-effect (the write-effect persists `initial` before hydration settles) — verified: resolve → F5 → conflict back, ack gone. The comment promises the opposite ("survive an accidental hard reload mid-demo"). Fix: lazy-init the reducer from sessionStorage instead of an effect, or block writes until hydrated.
3. **Private-note leak to the colleague.** As JD, Maison Léandre's Personal group still shows R. Devane's private note, labeled "My note" (`records/[id]/page.tsx` gates only the commission field). One scroll during the beat-proof persona switch contradicts the whole isolation pitch. Also: JD's briefing departures list RD's private VICs by name.
4. **Unconfirmed candidate visible in the directory.** "Hotel Sereno Kyoto · unconfirmed" renders in Records for the advisor persona always (`seed.ts:97`), directly contradicting "a candidate never surfaces in answers, cards, or search until confirmed" — the thesis line of demo beat 8. Gate the row on persona (admin/ops) or on `candidateConfirmed`.
5. **⌘K is a dead control.** The most prominent button in the nav does nothing. Either wire the stub CommandPalette (canned results per the inventory) or remove the affordance before someone clicks it live. Fails A-EP2/E-EP2.

**High**
6. **Refusal recovery CTAs miss the evidence-grounded one.** DEC-14's "forward the document to the vault inbound address" is absent; "Show me the two sources" is not a recovery. Swap it in — it's the CTA the grounding narrative depends on.
7. **v1/v2 never reaches Ask.** The rewind beat shows briefing/record/notices, but the spec's demo payoff — a *clean answer* that omits the still-true advisory under v1 — doesn't exist; nor does any advisory banner on answers (A-E1 first clause). Add the spa question to the Ask thread with world-dependent rendering.
8. **Advisory creation is entry-point-thin and closes into a void.** EP2 (briefing "New notice") and EP3 (vault "create notice from this") don't exist; EP1's composer is a non-creating schematic; no closed-notice history surface exists despite three copy claims. Minimum: one working create path + a history list on the notices page.
9. **Banners that overclaim state changes** (three instances): saved note never renders in the Personal group; E-U5 request creates no candidate and no gaps log; traveller request-access creates no owner-side briefing item. Each is one seeded-row-on-flag of work; as shipped they are demonstrable falsehoods one click apart.
10. **Dead "Verify against source" button** on the stale field (E6 one-tap verify). Wire a confirm state or remove.

**Medium**
11. **No loading/empty/error states outside Ask** — no skeletons, no per-widget failure isolation (C-X2), no degraded-connector seed feeding the X-states the specs enumerate (C8 partial). At minimum seed one failed-widget and one gap-note state.
12. **Per-field correction (D-U1) missing and held-candidate detail unreachable** — add the fix affordance on CandidateFieldRow and link "Villa ????" to its existing page (`/admin/review/villa-unknown`).
13. **Narration copy in product mode** — move the v1 explainers and "Viewing as…" lines into NarrationNote (the mechanism already exists and behaves correctly).
14. **CommissionCalendar is a caption, not the promised schematic agenda list** (Rev 2 committed to a date-grouped agenda with C-EP3 deep links; the build has one muted row with a badge).

**Low**
15. Departures not soonest-first (12d before 3d). Discrepancy block shows Palácio das Amoreiras inside Villa Ortensia's page. Directory filter chips don't filter and don't persist; no facility filter. CopyExport menu lacks a schematic marking. Suggestion card doesn't relocate into Preferences on confirm. Choreography 6b still says "all-or-nothing share" (DEC-31 superseded it). B3's schematic contradiction card shows a personal-scope advisory cross-account — add a "visible because both are yours to see" qualifier or scope it.
