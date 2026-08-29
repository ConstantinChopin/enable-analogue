# Eval 1 — Grounding: Journey B (Advisory Lifecycle)

**Date:** 2026-08-27
**Inputs:** `docs/evidence/decisions.md`, `docs/evidence/signals.md`, `docs/journeys/journey-b-advisory-lifecycle.md`
**Evaluator:** fresh-context grounding agent, files only.

## Findings

| Check | Verdict | Justification |
|---|---|---|
| 1. Traceability | **FAIL** | All five decision-log entries cite ids, but three cited ids do not say what the spec claims: severity is attributed to DEC-20 (§2 and D1) when it exists only in DEC-18; "is audited" (U3) is attributed to DEC-09/SIG-13, neither of which mentions auditing; DEC-22 is cited (E1) for "projected commissions stop including it immediately," which DEC-22 does not state (DEC-21's "while active" is the actual anchor). Misquotation is a fail per rubric. |
| 2. No contradiction | **PASS** | Nothing contradicts a dated resolved decision; the v1→v2 auto-expire reversal is handled exactly as DEC-20→DEC-03 documents it. Two notes, not contradictions: U4 hardens DEC-08's "usually Agency" into "stored at the agency layer" (drop the certainty or cite it as a choice); DEC-03 places the stale-review nudge in Layer 4, and the spec pulls it into the current build without saying so. |
| 3. Coverage | **FAIL** | Missing decision: **DEC-27** (Early Intelligence Wins) is never cited despite specifying the exact surfacing moments this journey builds — commission-incentive alert at view/add-to-itinerary, and a **stale-data warning at 90+ days** that could ground the "review interval" the spec instead invents as extrapolation B9. Missing decisions are failures per rubric. Warn-level signal gaps listed below. |
| 4. Invention flag | **FAIL** | The appendix (B1–B10) is good but incomplete. Unlisted concrete mechanisms with no evidence anchor: (a) **manual close requires a reason** — DEC-03 says manual close only, the reason rule appears in §2, §4.5, and acceptance criteria with no B entry; (b) **admin access "is audited"** (U3) — no evidence, no B entry; (c) the **"ended, pending close" render state** (E1) — no evidence, no B entry; (d) the **three-tier scope model personal / shared-to-team / agency** (§4.3, acceptance) — DEC-20 defines only personal vs agency; the team tier is uncited and unlisted (SIG-45/SIG-46 could partially ground it but are not cited for it). Borderline, should also be declared: "dismissal is not acknowledgment" (U2) and oldest-first sort (U5, unless read into B5). |
| 5. Voice | **WARN** | Overwhelmingly an engineering handoff — imperative, tabulated, testable acceptance criteria. But several lines are presenter prose aimed at an interviewer, not a builder: "that absence *is* the exhibit" (U1), "This is the nuance that shows v2 wasn't a dogma" (E1), "retired deliberately rather than by accident" (§1). They belong in the presenter doc, not the spec. |

## Citation verification detail

Verified accurate: SIG-21 (§1, X2 — quote exact), DEC-20 v1 wording (§5 — verbatim), SIG-22 (§5, U1 — ellipsis quoting acceptable), SIG-23, DEC-03 (reversal framing matches DEC-03's own note), DEC-21 (§2 — linked/surfaced/feeding all present), DEC-18 (U2 — acknowledgment-before-output matches; note the spec extends "expired" to "expired or closed," a defensible v2 reading), DEC-13 (EP2), DEC-14 (EP3, E3), DEC-08/DEC-09 (§4.3), DEC-07 zero-leakage (E3), SIG-20 (E1 — "through June 30" is a fair paraphrase of "until June... obsolete come July 1st"), SIG-12/SIG-13 (U3, minus the audit claim), SIG-34/40/41 (appendix supporting).

Misquotations (the check-1 fails):

1. **§2 / D1:** "Per DEC-20, every advisory carries: source + timestamp + owner; visibility scope; **severity**." DEC-20 contains no severity field; severity is DEC-18's. D1's evidence column lists DEC-20 alone for a bundle that includes severity.
2. **U3:** "Admin access follows policy, is deliberate, and **is audited** [DEC-09; SIG-13]." DEC-09 says admin access per policy; SIG-13 says security testing precedes rollout. Neither says audited.
3. **E1:** "projected commissions stop including it immediately [**DEC-22** discrepancy posture]." DEC-22 covers projected→due→paid timeline and discrepancy flags; the stop-on-expiry inference actually derives from DEC-21's "active bonus rates feed projected-commission calculations."

One soft anchor, not a fail because the mechanism is declared (B6): **E2** claims motivation from "the brand-change signal class" — no such signal exists in the pack. SIG-34 (LHW→Hex) is commission-infrastructure change, not a property brand change. The gloss claims evidence that isn't there; B6 should stand as pure extrapolation.

## Coverage detail

- **DEC-27** — missing decision (the fail). Its incentive-alert-at-view moment and 90+-day stale-data threshold sit squarely inside this journey's theme; the spec invents a "review interval" (B9) where a real threshold existed to cite or explicitly diverge from.
- **SIG-36** (warn) — happy path step 5 promises "answers stop surfacing it the same minute." SIG-36 is the pack's evidence that immediacy claims are dangerous and last-synced state must be shown; the spec should either cite it or bound the claim to internal state.
- **SIG-45/SIG-46** (warn) — the closest available grounding for team-scoped sharing and per-item scope choice; uncited, leaving the shared-to-team tier as unlisted invention (see check 4).
- **SIG-04** (warn, minor) — "temporarily closed but actually just hard to get into" is the pack's two-state-closure nuance; directly relevant to the spa-closure exemplar and unused.

## Ranked fix list

1. **Complete the appendix (check 4).** Add entries for: close-requires-reason; the shared-to-team scope tier (or cite SIG-45/46 and rename to match SIG-46's private/agency/alliance); the "ended, pending close" state; dismissal≠acknowledgment; oldest-first sort if not read into B5. Delete "is audited" from U3 or add it as an extrapolation. This is the interview risk the eval exists for.
2. **Fix the three misattributions (check 1).** §2/D1: split severity out to DEC-18. U3: drop or re-anchor "audited." E1: cite DEC-21 (not DEC-22) for the projection cut-off.
3. **Cite DEC-27 (check 3).** Ground the incentive surfacing moments and either adopt the 90+-day threshold for the review interval or state explicitly why the spec diverges from it.
4. **E2:** remove "brand-change signal class" — declare B6 as pure extrapolation; SIG-34 does not cover it.
5. **Bound the immediacy claim** in step 5 against SIG-36, and soften U4's "stored at the agency layer" to DEC-08's "usually Agency" or mark the hardening as a choice.
6. **Voice:** move the three presenter-prose lines (U1 exhibit line, E1 dogma line, §1 flourish) to the presenter/demo doc.

---
*Honesty note: plausible ≠ grounded; every unlisted mechanism above was flagged regardless of how reasonable the design is.*
