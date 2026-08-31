# Journey C — The Working Day

**Status:** spec · **Persona:** Advisor (primary); Ops for the reconciliation queue
**Screens touched:** Briefing room, Commission detail + reminder composer, Commission calendar, Resolution queue (ops), Departures widget, Expiring incentives widget
**Evidence pack:** `../evidence/decisions.md`, `../evidence/signals.md`. Mechanisms without a DEC/SIG id are extrapolation, declared in the Appendix.
**Demo note:** carries the cold open and thread 1 (see `../presenter/demo-choreography.md`).

---

## 1. Purpose

The briefing surfaces the model's state proactively. The briefing room is the screen the agency asked for by name — "If you had a dashboard that you just sat down at your desk and that was the first thing that you're viewing in the morning" [SIG-32] — pulled forward on the roadmap for exactly that reason [DEC-13]. It carries triggered action items because deferred actions fall through when they rely on memory [SIG-22]. Its center of gravity is money: commission intelligence turns a manual, year-scale recovery hunt [SIG-30: an ops person's retired mother chasing commissions "from 2023 and 2024 even"] into a daily, drafted, human-approved motion. The governing principle: **nothing sends itself** [SIG-35].

## 2. The commission model

Timeline per commission: **projected → due → paid**, each state with provenance and timestamps [DEC-22]. Projections include active incentive advisories [DEC-21]; actuals come read-only from the booking system — financial ground truth stays in the source system [DEC-12]. Discrepancies (rate mismatch, currency variance) are flagged, never silently absorbed [DEC-22; SIG-38].

## 3. Entry points

| # | Entry | Context carried | Evidence |
|---|---|---|---|
| EP1 | Morning open — briefing is the default landing | today's state | DEC-13, SIG-32 |
| EP2 | Phone — the briefing over coffee | same, responsive | choreography beat 8; extrapolation C1 |
| EP3 | Commission calendar → item | the commission in context | DEC-22 (calendar view) |
| EP4 | Ops: resolution queue | unmatched payments | SIG-11; queue mechanics C2 |

## 4. Happy path

1. Advisor lands on the briefing (EP1): headline figure (outstanding across commissions), commissions widget (overdue first), departures (soonest first, checklist state), notices [Journey B], expiring incentives [DEC-21, SIG-20], records-verified progress. (DEC-13's third component, an action-items widget, is deliberately excluded from the seeded briefing — scope cut.)
2. Opens the overdue commission: timeline shows projected (with the rate's provenance) → due date passed → unpaid [DEC-22].
3. **Draft a reminder**: the product drafts the chase message with booking references attached [DEC-22 one-click reminder; draft content C3]. It waits. Nothing sends without her review [SIG-35].
4. She edits one line, sends. The commission enters "chased," with the chase logged on the timeline [DEC-22 one-click reminder; chased state + chase log: extrapolation C11].
5. Departures: opens tomorrow's departure → traveller checklist (Journey F EP2) [DEC-27 trip reminder].
6. Expiring incentive ("+3% ends in 9 days"): she opens the affected client list and acts or dismisses knowingly [DEC-21, DEC-27; affected-list mechanics C4].

**Exit criteria:** the morning's decisions are made from one screen; every money figure can show its provenance and sync time.

## 5. Unhappy paths

### U1 — Orphaned payment (ops) [SIG-11]
A payment arrives under a traveler's name instead of the booker, or against an unresolvable property name. It cannot auto-match; it lands in the **resolution queue** with candidate matches ranked and sourced [DEC-23 identity resolution]; ops confirms the match with reason, attributed. This ranking orders identity-resolution candidates only — DEC-02/DEC-04's no-ranking posture governs conflicting intelligence values, which this queue never touches. Unmatched money is visible, never silently parked.

### U2 — Credit-not-refund kills protection [SIG-31]
A cancellation resolves as hotel credit. At the cancellation event the commission timeline flags: "resolved as credit — commission protection does not apply" [SIG-31], so the loss is a known decision, not a silent write-off. [flag mechanics C5]

### U3 — Projected vs actual discrepancy [DEC-22]
Actual arrives 10% under projection (rate mismatch or currency variance [SIG-38]). The timeline flags the delta with both values and their provenances; CTAs: accept with reason [extrapolation C13], or open a dispute draft [DEC-22 "hammer mode"; dispute draft C6].

### U4 — The send-gate holds [SIG-35]
There is no bulk-send, no auto-send setting, no scheduled chase. Any attempt path ends at a review step. This is a designed absence: a tool that emails a client on its own would be switched off in a week [SIG-35 context note].

### U5 — Sync-pending figures [SIG-36, DEC-12]
Totals derived from a mid-sync source render with last-synced time; a figure the advisor knows changed upstream shows "sync pending (up to 48h)" rather than pretending currency.

## 6. Edge cases

- **E1 Silent cancellation verification [SIG-33]:** a cancellation sent to a property gets no acknowledgment in 24h [threshold: extrapolation C12] → briefing surfaces "cancellation unconfirmed — no record at property," with a direct-contact CTA. The failure class is documented: "it didn't actually cancel... they had no record of it."
- **E2 Processor migration event [SIG-34]:** a supplier's commission processor changes (the Onyx→Hex class). Affected bookings get a briefing note: expect reconciliation change; remaining old-processor suppliers listed. [event rendering C7]
- **E3 Quiet day:** nothing overdue, no departures near. The briefing says so plainly — no manufactured urgency; the verified-records progress and expiring incentives remain. [empty-state design C8]

## 7. Errors

- **X1 Booking system unreachable [DEC-12, DEC-24]:** commission widgets render last-synced state with the gap note; drafting a chase still works (references are local [architectural rule: extrapolation C14]); send is not blocked.
- **X2 Partial widget failure:** one failed widget degrades alone with retry; the briefing never white-screens. [extrapolation C9]

## 8. Instrumentation

- Overdue aging distribution; chase → paid conversion and days-to-paid [DEC-22].
- Resolution-queue latency and match-correction rate [SIG-11].
- Discrepancy count by cause (rate vs currency) [DEC-22, SIG-38].
- Morning-open rate — is it actually the first screen [SIG-32 realized].

## 9. Acceptance criteria

- [ ] Briefing is the default landing; all five widgets render seeded state.
- [ ] Commission timeline shows projected → due → paid with provenance; incentive-inclusive projection on the seeded booking [DEC-21/22].
- [ ] Draft-reminder flow: draft renders, is editable, sends only on explicit action; chase logged.
- [ ] U1 resolution queue playable as ops: orphaned payment matched with reason.
- [ ] U2 credit-not-refund flag renders at the seeded cancellation.
- [ ] U3 discrepancy flag with both values; accept-with-reason and dispute-draft paths render.
- [ ] U4: no path sends without review (verified by attempting all).
- [ ] U5/X1: sync-pending labels and gap notes render under the degraded seed.
- [ ] E1 unconfirmed-cancellation alert renders at 24h seeded state.
- [ ] Phone frame (390 px): briefing fully readable; widgets stack.

## 10. Decision log

| # | Decision | Date | Evidence | What changed |
|---|---|---|---|---|
| D1 | Briefing room pulled forward to Phase 2c | 2026-03-31 | DEC-13, SIG-32 | the daily entry point moved up the roadmap because users named it |
| D2 | Nothing sends itself — drafts always, sends never | design principle | SIG-35 | automation stops one step short of the client, on purpose |
| D3 | Financial integration is read-only; ground truth stays in the booking system | 2026-03-31 | DEC-12 | Enable reconciles and flags; it does not become the ledger |
| D4 | Commission timeline projected → due → paid with discrepancy flags | Phase 2c | DEC-22, SIG-38 | missing money became detectable instead of invisible [SIG-30] |

---

## Appendix — reconstruction vs. extrapolation

| # | Extrapolated mechanism |
|---|---|
| C1 | Phone-frame presentation of the briefing |
| C2 | Resolution-queue ranking/UX (the failure class is SIG-11; the queue design is invented) |
| C3 | Reminder draft content and tone |
| C4 | Expiring-incentive affected-client list |
| C5 | Credit-not-refund flag mechanics at cancellation |
| C6 | Dispute-draft flow |
| C7 | Processor-migration event rendering |
| C8 | Quiet-day empty state |
| C9 | Per-widget failure isolation |
| C10 | The headline figure composition; widget set and order |
| C11 | "Chased" timeline state and the chase log (extrapolation beyond DEC-22's projected → due → paid) |
| C12 | E1's 24-hour no-acknowledgment threshold (SIG-33 gives the failure class only) |
| C13 | U3's accept-with-reason CTA |
| C14 | X1's local-references / drafting-works-offline rule |

Supporting signals: SIG-30 (the manual recovery reality), SIG-21 (inbox misses argue for surfacing deadlines in-product), SIG-20 (a real expiring incentive), SIG-34 (processor migrations tracked by hand).
