# Eval 1 — Grounding: Journey E (The Record)

**Date:** 2026-08-27 · **Evaluator:** fresh-context grounding agent
**Inputs:** `docs/evidence/decisions.md`, `docs/evidence/signals.md`, `docs/journeys/journey-e-record.md` — nothing else.

## Findings

| Check | Verdict | Justification |
|---|---|---|
| 1. Traceability | **FAIL** | All five decision-log entries cite ids, but two cited ids are misquoted: §1 puts quotation marks around wording DEC-08 does not contain, and §2 renders DEC-27's "who booked this last" as "who at the desk used this last" — a semantic broadening (booked → used) presented under the citation. |
| 2. No-contradiction | **PASS** | Nothing contradicts a dated resolved decision: conflicts unranked and advisor-resolved (DEC-02), resolutions stored at agency layer (DEC-08 "usually Agency"), no silent overwrite (DEC-08), personal-by-default (DEC-09). |
| 3. Coverage | **FAIL** | DEC-25 is missing: DMC Excel "mapped to the product card schema **with custom fields**" directly concerns this journey's core screen, and its "documents land private by default" is the correct anchor for the note default (DEC-09 is VIC-specific). Missing load-bearing signals (warns): SIG-41 grounds U5's directory-miss path verbatim; SIG-36 grounds X1's last-synced rendering; SIG-38 (visible, dated FX) touches commission/pricing fields on the card; SIG-11 grounds E2 duplicate suspicion. |
| 4. Invention flag | **FAIL** | Appendix is incomplete. Unlisted mechanisms with no DEC/SIG anchor: (a) **"Ask about this" handoff with entity pre-scoping** (4a.5, acceptance item 9) — a concrete cross-journey mechanism, not covered by E2, absent from the appendix; (b) **the scope-tier taxonomy "private / team / organization"** — SIG-46 evidences "private / agency / alliance"; the renaming is a design change presented as if cited, declared nowhere; (c) **E4's "renders as no link at all"** rule — E5 declares the absent-not-masked rule for U2 only, not for VIC cross-links. |
| 5. Voice | **WARN** | The skeleton is a genuine handoff — numbered paths, exit criteria, testable acceptance list — but portfolio prose leaks in: "The catalogue door", "the power demo", "the two doors joined", and the decision-log "What changed" column ("the card admits uncertainty instead of laundering it", "the shared brain got a consent model") is presentation copy, not engineering. |

## Citation audit detail

Verified accurate: DEC-02 (show all / advisor resolves; nothing ranked), DEC-08 (three layers, agency storage, no silent overwrite — substance, not the §1 "quote"), DEC-09 (E4 VIC gating), DEC-13 (EP4), DEC-16 source noted as adjacent only — honest hedge, DEC-23 (what/where/when; cross-links; merge routing), DEC-24 (gap report, connector health), DEC-26 (rep firms, named contacts, E3 pivot), DEC-27 (stale 90+ days), SIG-05, SIG-10 (square-footage conflict; the 45m²/38m² numbers are illustrative seeding, acceptably anchored), SIG-42, SIG-44 (template copy), SIG-45 (attributed shared notes), SIG-46 (the "company dashboard... nobody else can see" quote is a faithful subset).

Misquotations / misrepresentations:

1. **§1 [DEC-08]** — spec quotes: "cards should visually group fields by layer (canonical vs agency vs personal) with provenance + freshness". DEC-08's note reads: "cards group fields by layer with provenance + freshness". "should visually" and the parenthetical are interpolated inside quotation marks. Meaning preserved; verbatim claim false.
2. **§2 [DEC-27]** — spec: "who at the desk used this last". DEC-27: "'who booked this last' advisor intel on cards". *Used* ≠ *booked*; the spec broadens a booking-history signal into a general usage signal under the citation. E11 declares only the presentation format as extrapolated, so the semantic drift is doubly hidden.
3. **4b.3 [SIG-46]** — spec attributes "three-tier scope" private/team/organization to SIG-46, whose tiers are private/agency/alliance. The mapping (agency→team? organization? where did alliance go?) is neither evidenced nor declared.
4. **Minor**: "question-map family 3" (4a.1) cites material not present in the evidence pack; only DEC-16's source column mentions a question-map doc. Unverifiable from the inputs — should be an extrapolation entry or a SIG/DEC.

## Ranked fix list

1. **Complete the appendix**: add the "Ask about this" pre-scoped handoff, the scope-tier taxonomy rename, and E4's no-link rendering as declared extrapolations (or re-anchor them). These are exactly the interview risk the appendix exists to remove.
2. **Reconcile the note scope tiers with SIG-46** — either use private/agency/alliance as evidenced, or keep private/team/organization and declare the rename with a rationale. Right now the spec silently contradicts its own citation.
3. **Fix the two misquotes**: make the §1 DEC-08 quote verbatim (or drop the quotation marks), and restore DEC-27's "who booked this last" or declare the used-vs-booked broadening.
4. **Add DEC-25** to §2 (custom fields on the card schema; private-by-default anchor for notes) — currently the journey's core screen omits a resolved decision about its own schema.
5. **Cite SIG-41 at U5, SIG-36 at X1, SIG-11 at E2, SIG-38 for financial fields** — all four are already-collected signals that make existing paths grounded instead of merely plausible.
6. **Strip portfolio prose** from the decision-log "What changed" column and section taglines; move that language to the presenter layer.
