# Eval 1 — Grounding: Journey F (Traveller)

**Date:** 2026-08-27 · **Evaluator:** fresh-context grounding agent · **Inputs:** `docs/evidence/decisions.md`, `docs/evidence/signals.md`, `docs/journeys/journey-f-traveller.md` (only these)

## Findings

| Check | Verdict | Justification |
|---|---|---|
| 1. Traceability | **FAIL** | Every decision-log entry cites ids, but two citations misquote the pack: happy-path step 4 attributes the verbatim phrase "shared to specific collaborators explicitly" to DEC-09, and no such wording exists in DEC-09 as written; D1/U2/§8 attribute "audited" policy access to DEC-09 (and DEC-01), neither of which mentions auditing. |
| 2. No contradiction | **PASS** | The spec implements all-or-nothing per dated DEC-01 (2026-03-31) and nothing contradicts a resolved decision; E2 correctly applies DEC-02's show-all pattern rather than ranking sources. |
| 3. Coverage | **WARN** | No missing *decision*, but SIG-45 (attributed, team-retrievable notes) should ground §2 advisor notes and is unused; SIG-47 is used in substance (appendix quotes it by date) but never cited by id, and §2 trip history carries no citation; DEC-25 (documents land private by default) is relevant to X1 import and unused. |
| 4. Invention flag | **FAIL** | The appendix is incomplete — three concrete mechanisms have no DEC/SIG anchor and no F-entry: (a) the **audit mechanism itself** (share audit + policy-access audit events, §4.4, U2, §8) — F2 covers only its *rendering*, and the citations to DEC-01/DEC-09 are unsupported; (b) **named-collaborator share targeting** (DEC-01 says all-or-nothing, not to whom; the support offered is the fabricated DEC-09 quote); (c) the **absent-not-masked rule** for unshared VICs (U2) and the other Journey E cross-references (EP3 "Journey E E4", §2 "Journey E D3") — anchors outside the evidence pack, which for this eval count as unanchored. |
| 5. Voice | **WARN** | Largely imperative and testable (entry-point table, acceptance checkboxes), but portfolio prose leaks in: E1's "a genuine artifact of a real roadmap, not a loose end to hide," and the decision log's "What changed" column ("the profile started defending the client inside the workflow," "trust with client data became structural") are presenter copy, not handoff language. |

## Citation verification detail

Verified accurate against the pack:
- §1 DEC-09 (personal-by-default), DEC-01 (all-or-nothing), DEC-28 (attributed, not guessed) — all as written.
- §2 DEC-23 "attribution" — DEC-23 does say "keep every extracted field attributable to its source (what/where/when)."
- EP1–EP2: DEC-09, DEC-13, DEC-27 (upcoming-trip reminder on briefing) — accurate.
- U3/X1: DEC-28 "anything non-cited in proactive output is labeled an AI suggestion" + DEC-19 reliability posture — accurate.
- §8 "VIC preference application rate [DEC-28, verbatim metric]" — verbatim in DEC-28.
- **E1/OQ-2 tension is REAL as the pack is written.** DEC-01 (dated 2026-03-31, note "revisit if advisors refuse to share due to sensitive notes") mandates all-or-nothing; DEC-09 (undated, [roadmap] Data hierarchy) says "tiered sharing required for basic vs sensitive fields." The spec's characterization — dated decision vs. data-hierarchy "required" wording, prototype follows the dated decision, tension kept visible with its revisit trigger — matches the pack exactly. This section is the spec at its best.

Misquotations / unsupported attributions:
1. **§4.4:** `[DEC-09 "shared to specific collaborators explicitly"]` — the quoted string does not appear in DEC-09 (or anywhere in the pack). Fabricated verbatim quote. Fail.
2. **D1, U2, §8:** "audited" / "policy-access audit events" cited to DEC-09 and DEC-01 — neither entry mentions audit. Unsupported attribution.
3. **U1 (minor):** quoted warning copy "dislikes contemporary design — this property is listed as contemporary" alters DEC-27's example "dislikes **modern** design — this property is listed as contemporary." Presented in quotation marks citing DEC-27; should either match verbatim or drop the quotes.

## Appendix completeness (check 4 list)

Not cited to a DEC/SIG id and not in the appendix:
- Audit as a mechanism (share intervals recorded, policy-access events) — only its *rendering* is declared (F2).
- Named-collaborator targeting of shares.
- Absent-not-masked invisibility rule for unshared VICs (anchored only to "Journey E U2 rule," outside the pack).
- Journey E cross-anchors generally (EP3 "Journey E E4"; §2 "Journey E D3") — fine as pointers, but the mechanisms they carry need either a DEC/SIG id or an F-entry in *this* spec, since evaluators and interviewers see one spec at a time.

Declared correctly: F1–F8 all correspond to real extrapolations in the body; F7's honesty about the source taxonomy (DEC-28 grounds attribution, taxonomy invented) is the model to follow.

## Ranked fix list

1. **Remove or repair the fabricated DEC-09 quote in §4.4.** Cite DEC-01 for all-or-nothing, and move "to a named collaborator, explicit" into the appendix as a new F-entry (or find real pack wording). This is the interview risk: a verbatim quote that isn't in the evidence.
2. **Add an F-entry for the audit mechanism** (share audit + policy-access audit) and strip "audited" from the DEC-09/DEC-01 citations in D1, U2, and §8. F2 then covers rendering of a declared invention instead of an undeclared one.
3. **Add an F-entry (or DEC/SIG cite) for the absent-not-masked rule** and restate the Journey E cross-referenced mechanisms so this spec stands alone against the pack.
4. Fix the U1 quote to DEC-27's verbatim "dislikes modern design…" or unquote it.
5. Cite SIG-47 by id (§2 trip history + appendix), add SIG-45 to §2 notes, consider DEC-25 on X1.
6. Rewrite the decision-log "What changed" column and the E1 closing clause in handoff voice; keep the presenter framing for presenter material.

## Verdict

**FAIL** — 2 fails (traceability, invention flag), 2 warns (coverage, voice), 1 pass (no contradiction). The structure is right and the E1/OQ-2 tension is genuinely documented in the pack; the failures are concentrated in one fabricated quote and one undeclared mechanism family (audit / named-collaborator sharing), all fixable without touching the design.
