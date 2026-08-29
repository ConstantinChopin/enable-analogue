# Eval 1 — Grounding: Journey D (Connections, Ingestion, Extraction Confirmation)

**Date:** 2026-08-27 · **Evaluator:** fresh-context grounding agent · **Inputs:** `docs/evidence/decisions.md`, `docs/evidence/signals.md`, `docs/journeys/journey-d-ingestion-confirmation.md` (only these)

## Findings

| Check | Verdict | Justification |
|---|---|---|
| 1. Traceability | **warn** | All four decision-log entries cite DEC/SIG ids and the core citations (DEC-19, DEC-23, DEC-24, DEC-25, DEC-14, SIG-43, SIG-44, SIG-10, SIG-11) check out verbatim — but two inline citations are stretched beyond what their source resolves, and one quoted phrase is inexact (details below). |
| 2. No contradiction | **pass** | Nothing merges, commits, or auto-resolves without a human; hold-until-confirmed, show-both-sides, private-by-default, and no-silent-overwrite all align with DEC-19, DEC-08, DEC-02's posture, DEC-25/14; no dated resolved decision is contradicted. |
| 3. Coverage | **fail** | DEC-11 (MCP-first connector posture) and DEC-12 (TripSuite read-only integration) are decisions squarely on this spec's theme — EP1 *is* the connector flow — and neither is cited or addressed; SIG-36 (sync latency / last-synced display) and SIG-38 (smart-upload currency corruption) are missing load-bearing signals (warn-class). |
| 4. Invention flag | **fail** | The appendix (D1*–D12*) is substantial but incomplete: several concrete mechanisms are neither evidence-anchored nor listed (enumerated below). Unlisted invention is exactly the interview risk this check exists for. |
| 5. Voice | **pass** | Reads as an engineering handoff: imperative steps, named states, per-item acceptance boxes, exit criteria phrased testably. Two thesis-flavored sentences ("Confirmation is where the agency's curation becomes the product's value") drift toward portfolio prose but do not carry load. |

## Detail

### Check 1 — citation verification (misquotation sweep)

Verified accurate: SIG-43's "advisor confirms in one tap" (verbatim); SIG-44's 93% boilerplate and 9% openings coverage; DEC-23's field-level what/where/when; DEC-24's last-success + errors; DEC-25's semi-structured Excel and private-by-default; DEC-19's ~95% reliability lesson as stated in §1; D-log dates match their sources.

Stretched or inexact:

1. **U3 cites DEC-19 for a runtime hold mechanism.** DEC-19 is a *launch criterion* ("must exceed ~95% reliability before launch or advisors revert"). The spec converts it into a per-field/per-candidate confidence gate at review time ("below the reliability bar is held, never committed"). The design move is sensible; the citation implies the evidence specifies it, and it does not.
2. **U5 cites DEC-08 for "widening scope is an explicit, attributed act."** DEC-08 governs layer-data conflicts and silent overwrites, not sharing-scope changes. The nearer anchors (DEC-09 tiered sharing, SIG-12/SIG-46) are not used here; as written this is extrapolation wearing a citation.
3. **EP4 quotes "send it like you would to a friend."** SIG-43's wording is forward content "the same you would to a friend." Semantically faithful, but an altered phrase inside quotation marks.
4. Minor: U1 names the "GDS-vs-website drift class"; SIG-10 says "website" and a booking context but never "GDS." Trivial, but the label is invented specificity.

### Check 3 — evidence the spec should have used

Missing decisions (failures per rubric):

- **DEC-11** — MCP-first integration posture (consume upstream MCP, self-hosted connectors as fallback). The spec designs a connector picker, credential scoping, and sync cadence with no reference to the resolved decision about *what a connection is*. This is the single largest grounding gap.
- **DEC-12** — TripSuite read-only elevated to Phase 2; the flagship real connection, with the "financial ground truth stays in TripSuite" boundary that constrains what ingestion may claim. Unmentioned.

Missing load-bearing signals (warns):

- **SIG-36** — 24–48h sync latency; "UIs must show last-synced state, not pretend immediacy." Integration health shows last-success but the spec never commits to surfacing sync staleness to downstream consumers the way SIG-36 demands.
- **SIG-38** — smart-upload silent currency conversion ("That's big"). This is a *documented ingestion-integrity failure* from the real product and Journey D has no unhappy path for it; U1's wrong-metadata case does not cover silent unit/currency transformation.
- Lesser: SIG-37 (silent configuration failure class) would strengthen U4/U5; SIG-40 (verbal rapid-share) is an ingestion source with no entry point — defensible scope cut, but unstated.

### Check 4 — unlisted inventions (appendix completeness)

Mechanisms with no DEC/SIG anchor and no appendix entry:

1. **Per-field vs. all-at-once confirmation granularity** (§4.6). SIG-43 grounds one-tap *record-level* confirmation; field-level confirm/correct granularity is invented and unlisted.
2. **Runtime confidence scoring / "reliability bar" hold gate** (U3, feeds E3 batch logic and the acceptance list). D3* declares only the *marking* of unsure fields, not the scoring-and-hold rule itself; the DEC-19 citation does not supply it (see Check 1.1).
3. **Confirmer identity stamp** (§4.7, "The confirming admin is stamped on it"). DEC-23 makes fields attributable to *sources*; attributing the confirmation act to a person is a distinct, unlisted mechanism.
4. **Merge-reason capture** (U2, "human choice stored with reason") — only rejection reasons are declared (D6*); merge reasons are chargeable to D4* only by generous reading.
5. **Instrumentation definitions** (§8: queue latency, duplicate-merge rate, rejection-reason distribution) — invented metrics, unanchored and undeclared; only the precision proxy ties to DEC-19.

Properly declared and confirmed complete: D1*, D2*, D4*–D12* cover their stated mechanisms; the supporting-signals footnote (SIG-02, SIG-05, SIG-42) is accurate to the evidence.

### Internal inconsistency (noted in passing)

Demo note says "~60s"; acceptance criteria say "under 90 seconds." Pick one before Eval 2 runs, or the acceptance checkbox is untestable as written.

## Ranked fix list

1. Ground the Connections surface in **DEC-11** (connector taxonomy: upstream MCP first, self-hosted fallback) and reference **DEC-12** (TripSuite read-only, financial ground truth stays upstream) in EP1/U4 — or explicitly scope connections out and say so.
2. Add the unlisted inventions to the appendix: per-field confirmation granularity, the runtime confidence/hold gate, confirmer stamp, merge-reason capture, §8 metric definitions.
3. Re-cite U3 and U5 honestly: U3's hold gate is extrapolation *motivated by* DEC-19, not specified by it; U5's scope-widening rule belongs to DEC-09/SIG-46 or the appendix, not DEC-08.
4. Add a currency/unit-integrity unhappy path anchored to SIG-38, and a last-synced-state commitment anchored to SIG-36.
5. Fix the EP4 quote to SIG-43's actual wording; drop or source the "GDS" label in U1; reconcile 60s vs 90s demo timing.
