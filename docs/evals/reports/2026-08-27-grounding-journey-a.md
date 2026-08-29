# Eval 1 — Grounding: Journey A (The Trusted Answer)

**Date:** 2026-08-27
**Inputs:** `docs/evidence/decisions.md`, `docs/evidence/signals.md`, `docs/journeys/journey-a-trusted-answer.md`
**Evaluator:** fresh-context grounding agent, files only.

**Overall verdict: FAIL** — 3 fails, 2 warns. The product logic largely respects the resolved decisions, but the decision log cites no evidence ids, one decision-log entry (D3) has no anchor anywhere in the pack, four directly relevant decisions are unused, and the spec carries a large amount of unlisted invention — including one invented fact (X3's "24–48h sync reality") presented as something advisors already live with.

---

## Findings table

| Check | Verdict | Justification |
|---|---|---|
| 1. Traceability | **FAIL** | No decision-log entry cites a DEC/SIG id; D1, D2, D4 map cleanly to pack entries but cite prose ("product decision log", "advisor sessions") instead, and D3 (confidence score removed) has no corresponding entry anywhere in the evidence pack — an unsupported entry. |
| 2. No contradiction | **WARN** | Nothing overturns a dated resolved decision (U1 correctly implements DEC-02/DEC-08), but §1 "forward to a client" + §4.6 "provenance footer travels with the copy" is in tension with DEC-05 (client proposals show recommendations *without* internal reasoning). |
| 3. Coverage | **FAIL** | Four decisions squarely on this journey's theme are unused: DEC-07 (the Trusted Answer definition the whole spec derives from), DEC-15 (three-tier knowledge model in answers), DEC-16 (internal-first two-layer retrieval; the §4.2 trace should reflect it), DEC-18 (advisory severity + Critical acknowledgment; E1 ignores it). Missing signals (warn-level): SIG-01, SIG-03, SIG-04, SIG-05, SIG-10. |
| 4. Invention flag | **FAIL** | The spec contains ~25 concrete mechanisms with no DEC/SIG anchor (full inventory below) and flags **none** of them as design extrapolation. Under the honesty rules, plausible is not grounded; the spec currently reads as if all of it were reconstruction. |
| 5. Voice | **WARN** | Mostly a genuine engineering handoff — numbered states, entry-point table, checkbox acceptance criteria — but several thesis lines are portfolio prose, not spec ("the advisor's reputation is the product being protected", "the whole difference between useful and dangerous is the warning", "a healthy refusal produces a vault contribution"). Move these to a presenter doc; keep the spec imperative. |

---

## Decision-log mapping (D1–D4 → evidence ids)

| Entry | Maps to | Assessment |
|---|---|---|
| D1 (answer contract before screens) | **SIG-01** (its quote is a close paraphrase of SIG-01, 2026-04-16) + label "design principle" | Maps cleanly; should cite SIG-01 explicitly. "Early in engagement" is undated — fine only if the design-principle label is used. |
| D2 (show all, advisor resolves, agency layer) | **DEC-02** (primary; date 2026-03-31 matches) + **DEC-08** (agency-layer storage, no silent overwrites) | Maps cleanly; "product decision log" should become the two ids. The "What changed" note ("earlier concept ranked sources by recency") is itself uncorroborated history — see inventory item 24. |
| D3 (confidence score removed) | **No mapping exists.** No DEC or SIG anywhere mentions a confidence score, its removal, or advisors reading a score as permission to skip verification | Cannot be repaired by citation. Either evidence is added to the pack, or the entry is relabeled "design principle, no external evidence" and the "advisor sessions" source claim is deleted — as written it asserts user research the pack does not contain. This is the single largest interview risk in the document. |
| D4 (refusal first-class) | **DEC-07** ("I don't know" is a component of the Trusted Answer; guardrail: low confidently-wrong rate). SIG-01 as supporting signal | Maps cleanly; should cite DEC-07. The quoted line "a wrong answer costs more than no answer" appears nowhere in the pack — it is the author's gloss and should not sit in the Source column styled as a quote. |

---

## Complete invention inventory

Mechanisms in the spec with **no DEC/SIG anchor**. Invention is permitted in an analogue; every one of these must be declared as design extrapolation. Items marked ⚠ are the ones most likely to be probed as if they were client fact.

**The contract (§2)**
1. The four-clause answer contract as a formal render gate (Cited / Fresh / Corroborated / Permission-clean). Components echo DEC-07, but the gating rule "an answer may render only when all four hold" is invented.
2. ⚠ **Corroboration requirement** for commercial values, and the "explicit single-source label". No evidence entry mentions corroboration at all.
3. ⚠ **Freshness threshold** as a gate ("values past their freshness threshold carry a warning"; U2 refuses when "all sources are past the freshness threshold"). DEC-07 requires freshness *visibility*, never a threshold. No threshold value or policy exists in the pack.
4. "Answer contract met" **chip** (also acceptance criterion 2).

**Entry points (§3)**
5. EP2: ⌘K "Search everything → ask instead" with query carry-over.
6. EP3: Record card → "Ask about this" with entity-id pre-scoping.
7. (EP4 is grounded by DEC-13/SIG-32; the briefing-context carry mechanism is mild extrapolation.)

**Happy path (§4)**
8. Retrieval **trace banner** as a first-class UI element ("How this answer was built": sources read → overlay checked → notices checked). The "overlay" step name is also unanchored vocabulary.
9. Quoted-extract citation panel with in-context highlight and "Open document".
10. Suggested follow-up questions and threaded conversational context.
11. ⚠ Copy action with a **provenance footer that travels with the copy** (also the DEC-05 tension in check 2).

**Unhappy paths (§5)**
12. U1: the Resolve sheet's **mandatory reason field**; resolution stamped with name and date. DEC-02/DEC-08 give human confirmation + agency-layer storage; the required reason and the stamp format are extrapolation.
13. U1: subsequent answers cite the resolution while keeping both sources reachable. Reasonable extension of DEC-08, unanchored as a mechanism.
14. U2: the sample refusal copy's "**dated 14 months ago**" figure.
15. U2: recovery CTAs "request from the desk's known contact" and "ask ops to verify" (the vault inbound address CTA *is* grounded — DEC-14 — but uncited).
16. U3: the answer-anyway-with-warning rule (answer with date rather than suppress). Consistent with DEC-07's freshness transparency but stated as a rule the evidence never resolves.
17. U4: the **omission-not-redaction rule** ("never says 'a document you can't see says…'") and the fallback-to-U2 cascade. DEC-07's zero-leakage guardrail anchors the goal, not this mechanism.
18. U4: admin-side **audit log** recording permission-shaped answers (also §8).
19. U5: the guided empty state's specific contents (no fake confidence, no sample answers styled as real).

**Edge cases (§6)**
20. E1: advisory renders **above the answer regardless of the question**. DEC-18 grounds advisories existing and being permission-filtered; the placement rule is invented, and the DEC-18 severity/acknowledgment model is absent (coverage failure).
21. E2: relative-date resolution against desk locale with resolved echo-back.
22. E3: dual-currency render with dated, never-silent conversion.
23. E4: corroboration dedup by document content (derivative of invented mechanism 2).

**Errors (§7)**
24. X1: timeout behavior — partial trace, retry, no partial answer.
25. X2: connector-down gap note with timestamp ("intranet unreachable since 09:12").
26. ⚠ X3: "**mirroring the 24–48h sync reality advisors already live with**" — this is an invented *fact*, not an invented mechanism. No SIG documents any 24–48h sync latency. It is the only place the spec fabricates evidence rather than design, and under the honesty rules it is the worst class of invention.

**Instrumentation (§8)**
27. p50/p95 per question family; refusal-rate and refusal→resolution conversion; conflict-resolutions-per-week. Time to Trusted Answer itself is grounded (DEC-07, uncited); every derived metric is invented.

**Frame and decision log**
28. Persona "S. Marchetti, Paris desk" — fabricated identity in a pack that deliberately reduced names to roles. Fine for an analogue, must be declared.
29. The screen set itself (Ask, Answer thread, Source panel, Record card, Conflict sheet) and the 390px source-panel-to-bottom-sheet rule.
30. D2's "What changed" narrative: "earlier concept ranked sources by recency; rejected" — invented design history; no evidence an earlier ranking concept existed.
31. D3's entire narrative: a confidence score that existed, was misread by advisors, and was removed. No anchor anywhere in the pack (see mapping table).

---

## Ranked fix list

1. **Fix or relabel D3.** No evidence entry supports a confidence score ever existing or being removed. Either add the evidence to the pack, or relabel the entry "design principle, no external evidence" and delete the "advisor sessions" source claim. As written it fabricates user research — the exact interview risk this eval exists to catch.
2. **Add an invention appendix to the spec** declaring every item in the inventory above as design extrapolation, and separately flag the three ⚠ items (corroboration clause, freshness threshold, 24–48h sync claim) since they are stated as if they were client policy or client fact.
3. **Delete or ground X3's "24–48h sync reality advisors already live with."** It is the one invented *fact* in the spec. Keep the mechanism if declared as invention; drop the claim that advisors already live with it.
4. **Replace prose sources with ids in the decision log:** D1 → SIG-01 (+ design-principle label), D2 → DEC-02 + DEC-08, D4 → DEC-07. Also stop styling the author's own gloss ("a wrong answer costs more than no answer") as a sourced quote.
5. **Wire in the missing decisions.** Cite DEC-07 as the root of §2 and §8; make the §4.2 retrieval trace reflect DEC-15/DEC-16's internal-first, tiered order (directory/vault/notes → curated → vetted external) instead of the invented "sources read → overlay checked → notices checked"; reconcile E1 with DEC-18's Info/Important/Critical model and the Critical-acknowledgment gate.
6. **Resolve the DEC-05 tension:** specify that the provenance footer on copied answers is the advisor-facing form, and that anything client-facing strips internal reasoning per DEC-05 — or change the mechanism.
7. **Cite the supporting signals where the spec already matches them:** SIG-10 for U1, SIG-03/SIG-04 for U3 and the freshness axis, SIG-05 for internal-first retrieval, DEC-14 for the inbound-address CTA in U2/U5. Cheap credibility the spec is currently leaving on the table.
8. **Move the thesis prose out of the spec** ("reputation is the product being protected", "useful and dangerous", "healthy refusal produces a vault contribution") into presenter material; keep spec sentences imperative and testable.
