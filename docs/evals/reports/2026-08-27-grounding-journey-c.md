# Eval 1 — Grounding — Journey C (The Working Day)

**Date:** 2026-08-27
**Inputs:** `docs/evidence/decisions.md`, `docs/evidence/signals.md`, `docs/journeys/journey-c-working-day.md` (only these).
**Evaluator:** fresh-context grounding agent, per `docs/evals/rubric.md` Eval 1.

## Findings

| Check | Verdict | Justification |
|---|---|---|
| 1. Traceability | **FAIL** | Every decision-log row cites an id, but D1 attributes claims to DEC-13 it does not contain, and three verbatim citations are misrendered (details below); misquotation is a fail. |
| 2. No contradiction | **WARN** | No dated resolved decision is contradicted; but U1's "candidate matches ranked" sits uncomfortably close to the DEC-02/DEC-04 no-ranking posture, and DEC-19 is stretched into a generic "posture"/"proxy" beyond its import-reliability scope. |
| 3. Coverage | **WARN** | No cited decision is missing outright, but SIG-22 (deferred actions need triggers) is unused despite being squarely on-theme, and DEC-13's "action items" component is silently dropped from the widget set. |
| 4. Invention flag | **FAIL** | The appendix is incomplete: the "chased" timeline state and the E1 24-hour acknowledgment threshold are concrete state/threshold inventions with no evidence anchor and no appendix entry. |
| 5. Voice | **WARN** | §3–§9 are properly imperative and testable (numbered paths, checkable acceptance criteria); §1 slips into portfolio cadence ("Its center of gravity is money", "a daily, drafted, human-approved motion") and opens with a broken sentence ("The model pushed at you."). |

## Check 1 detail — citation verification

Verified every DEC/SIG citation in the spec against the evidence pack. Accurate: DEC-12, DEC-13 (the pull-forward itself), DEC-21, DEC-22 (timeline states, discrepancy causes, calendar view, one-click reminder, "hammer mode"), DEC-23, DEC-24, DEC-27, SIG-11, SIG-20, SIG-21, SIG-31, SIG-32 (substance), SIG-33, SIG-34, SIG-35 (substance), SIG-36 (24–48h), SIG-38.

Misquotations / over-attributions:

1. **D1 (§10):** "pulled forward **from Phase 4** to Phase 2c ... shipped **a year early**." DEC-13 says only "pulled forward to Phase 2c" — no origin phase, no year figure. (DEC-27, a different decision, is the one pulled from Phase 4.) Both embellishments are attributed to DEC-13 and are not in it.
2. **§1, SIG-32 quote:** spec renders "...the first thing that you **will viewing** in the morning"; the evidence verbatim is "...the first thing that **you're viewing** in the morning." A quotation-marked verbatim citation is garbled.
3. **§1, SIG-30:** "a retired **bookkeeper**" — SIG-30 says "an ops person's retired **mother**." "Bookkeeper" is invented characterization inside a bracketed citation.
4. **U4, SIG-35:** the quoted sentence "a tool that emails a client on its own is a tool this agency would switch off in a week" is not the SIG-35 verbatim signal — it is a reworded version of the evidence pack's own *context note* ("would be switched off in a week"), presented in quotation marks as if sourced speech.

## Check 2 detail

- **U1 ranking:** DEC-02 ("show all, advisor resolves") and DEC-04 ("shows all signals without ranking") govern conflicting intelligence sources, not payment-match candidates, so this is not a hard contradiction — and human confirmation is retained, and C2 declares the queue design invented. But the rubric's own example flags ranking, and the spec should acknowledge the tension rather than leave "ranked" unremarked next to a no-ranking canon.
- **DEC-19 usage (U1 "posture", §8 "proxy"):** DEC-19 is a ~95% reliability bar for drag-and-drop import, not a general no-auto-commit doctrine. The hedged labels show awareness, but the citation carries more weight than the decision supports.
- Checked and clean: expiring-incentive countdown vs DEC-03 (incentive end dates come from DEC-21's own model; dismissal is manual — no auto-expire implied); read-only finance (DEC-12) holds throughout; U4/X1 send behavior consistent with SIG-35.

## Check 3 detail — evidence the spec should have used

- **SIG-22** (registration falls through the cracks; "deferred actions need triggers, not memory") — the strongest working-day signal for why the briefing must carry triggered action items; uncited anywhere in Journey C. Missing load-bearing signal → warn.
- **DEC-13's third component:** the decision names "overdue commissions, upcoming trips, **action items**"; the spec's widget list has the first two but no action-items widget and no note of the omission.
- **DEC-22/DEC-27 "commission speed" indicator** — part of the commission-intelligence pillar the spec otherwise mines; absent, though it plausibly belongs to a product-card journey. Noted, not penalized.
- SIG-37 (silent configuration failure class) would strengthen X2's rationale; optional.

## Check 4 detail — unlisted inventions

Mechanisms (state, rule, threshold) with no DEC/SIG anchor and no appendix entry:

1. **"Chased" commission state + chase logged on the timeline** (§4.4, acceptance item 3). DEC-22 defines exactly three states: projected → due → paid. A fourth state and a chase-log event are invented and unlisted.
2. **E1 24-hour no-acknowledgment threshold** (§6, acceptance item 9). SIG-33 gives the failure class only; "24h" is an invented threshold, and the appendix does not list it.
3. **U3 "accept with reason" CTA** — C6 covers the dispute draft only; the accept-with-reason rule is unanchored and unlisted.
4. **X1 "references are local" / drafting-works-offline rule** — an architectural claim with no anchor and no appendix entry.

Borderline but acceptably covered: "records-verified progress" widget (arguably inside C10 "widget set and order"); confirm-with-reason in U1 (arguably inside C2 queue UX); booking references in the draft (C3). The appendix is otherwise well-constructed — C1–C10 genuinely cover the phone frame, queue design, draft content, affected-client list, flag mechanics, dispute flow, event rendering, empty state, and widget isolation.

## Check 5 detail — voice (subjective, one paragraph)

Sections 3 through 9 read as a real engineering handoff: tabulated entry points with carried context, numbered unhappy paths each pinned to a failure class, error states separated from edge cases, instrumentation that names measurable quantities, and acceptance criteria phrased as verifiable checks ("verified by attempting all"). Section 1 is where the portfolio voice leaks: "Its center of gravity is money," "a daily, drafted, human-approved motion," and the opening sentence "The model pushed at you." — which is either a fragment of deleted prose or a typo, and should not survive into a handoff document either way. The decision log's "What changed" column ("missing money became detectable instead of invisible") is presenter language, tolerable there. Warn, not fail: nothing operative depends on the prose.

## Ranked fix list

1. **Complete the appendix (check 4 fail):** add the "chased" state + chase log, the 24h acknowledgment threshold, the accept-with-reason CTA, and the local-references rule as C11–C14 — or anchor them to evidence. This is the interview risk the appendix exists to close.
2. **Fix D1 (check 1 fail):** strike "from Phase 4" and "a year early", or cite evidence that says them. DEC-13 supports only "pulled forward to Phase 2c".
3. **Repair the verbatim quotes:** SIG-32 ("you're viewing"), SIG-30 ("ops person's retired mother", not "bookkeeper"), and U4 — either quote SIG-35's actual verbatim signal or drop the quotation marks and cite the paraphrase as the pack's context note.
4. **Cite SIG-22** for the briefing's deferred-action rationale, and either add DEC-13's "action items" widget or note its deliberate exclusion.
5. **Annotate U1's ranking** with a line acknowledging the DEC-02/DEC-04 no-ranking posture and why match candidates differ; downgrade or remove the DEC-19 "posture/proxy" citations.
6. **Delete or rewrite "The model pushed at you."** and tone §1 to match §3–§9.
