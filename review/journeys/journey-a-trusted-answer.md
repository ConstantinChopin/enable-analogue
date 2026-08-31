# Journey A — The Trusted Answer

**Status:** template journey, drives the shared component set · **Persona:** Advisor (S. Marchetti, Paris desk — fictional identity, declared in Appendix)
**Screens touched:** Ask, Answer thread, Source panel, Record card, Conflict sheet
**Evidence pack:** `../evidence/decisions.md` (DEC-nn), `../evidence/signals.md` (SIG-nn). Mechanisms without an id are design extrapolation and are declared in the Appendix.

---

## 1. Purpose

The conversation door. The product has two doors into the same reconciled model: open it as a catalogue (Journey E — the record, where reconciliation is visible structure) or ask it a question (this journey). Every answer here is a view over the layered model Journey E exposes; conflicts felt in conversation are conflicts that exist on the record.

An advisor asks a commercial question mid-task ("What is our commission on Maison Léandre, and does the Atelier rate include breakfast?") and receives either an answer she can rely on without re-verifying, or an honest refusal that states exactly what is missing. [DEC-07: Trusted Answer = answer + provenance + freshness transparency + confidence label / "I don't know"; guardrail: low confidently-wrong rate. SIG-01: the trust boundary this exists for.]

## 2. The answer contract (definition of done for any answer)

Derived from DEC-07. An answer may render only when all four hold [gating rule: extrapolation, see Appendix A1]:

1. **Cited** — every claim carries a numbered citation to a source the advisor is permitted to open. [DEC-07]
2. **Fresh** — the oldest supporting source is dated on the answer; stale values carry a warning inline. [DEC-07 requires freshness visibility; the threshold mechanism is extrapolation, A2]
3. **Corroborated** — commercial values (rates, commissions, policies) require corroboration or an explicit single-source label. [extrapolation, A3]
4. **Permission-clean** — no claim may derive from a document the advisor cannot open, including via citations and snippets. [DEC-07 guardrail: zero permission leakage]

If any clause fails, the system refuses (U2). There is no single confidence score: the original confidence label (DEC-07) was decomposed into the chip, the freshness date, and the corroboration count (decision D3).

## 3. Entry points

| # | Entry | Context carried | Evidence |
|---|---|---|---|
| EP1 | **Ask** in the left nav | none; blank thread | — |
| EP2 | **Search everything** (⌘K) → "ask instead" | query text | extrapolation A5 |
| EP3 | **Record card → Ask about this** | entity id pre-scoped | extrapolation A5 |
| EP4 | **Briefing item → follow-up** | briefing context (e.g. active notice) | DEC-13, SIG-32 |

## 4. Happy path

1. Advisor opens Ask (EP1) and types the commission question.
2. Retrieval trace renders in the order the system actually searches [DEC-16 two-layer retrieval; DEC-15 three-tier knowledge]: **agency directory, vault, and notes first → curated specialist layer → vetted external trusted sources**. The trace is a first-class UI element ("How this answer was built"). [trace-as-UI: extrapolation A6]
3. Answer renders: claims with numbered citations, source panel with quoted extracts, oldest-source date, corroboration count, contract chip. [chip: extrapolation A4]
4. Advisor opens citation 1; extract highlighted in context; "Open document" available because permission holds.
5. Suggested follow-ups offered; thread continues with context. [extrapolation A7]
6. Advisor copies the answer. The copied form is **advisor-facing** and keeps the provenance footer; anything exported client-facing strips internal reasoning per DEC-05.

**Exit criteria:** the advisor can act on the value without opening another system.

## 5. Unhappy paths

### U1 — Sources conflict (the load-bearing path) [DEC-02, DEC-08, SIG-10]
The partner portal says 12%; a rep email says 15%.
- The answer does **not** pick one. Conflict block renders both values, each with source, date, and layer. [DEC-02: show all, advisor resolves; no auto-resolution]
- CTA **Resolve** → conflict sheet. Advisor picks the value to treat as current; resolution stored at the **agency layer** with attribution [DEC-08: human confirmation, stored at agency layer, no silent overwrites]. Required reason field: extrapolation A8.
- Subsequent answers cite the resolution and keep both sources reachable. [DEC-08-consistent; mechanism A9]
- Dismissing without resolving leaves the conflict state; nothing is assumed.

### U2 — Refusal (contract fails) [DEC-07: "I don't know" is part of the Trusted Answer]
No corroborating source for a commercial value, or all sources stale beyond threshold.
- The system states what it found, what is missing, and refuses the commercial claim (sample copy in Appendix A10).
- Recovery CTAs: forward a document to the vault inbound address [DEC-14]; request from the desk's known contact; ask ops to verify [both: extrapolation A10].
- A refusal is styled as a normal outcome, not an error.

### U3 — Stale record answers, with its date [DEC-07 freshness transparency; SIG-03, SIG-04]
An unchecked field still answers, but with its date and a freshness warning. External "closed/changed" signals are treated as suspect, not truth [SIG-04: two-state distinction].

### U4 — Permission-denied source [DEC-07: zero leakage]
A relevant document exists but the advisor cannot open it.
- The claim it supports is **omitted entirely**; the answer never references an inaccessible document [omission-not-redaction rule: extrapolation A11]. If omission breaks the contract, U2 renders instead.
- Audit log records that a permission boundary shaped an answer [extrapolation A12; supports SIG-12/SIG-13 governance posture].

### U5 — Empty workspace
New desk, no knowledge ingested. Guided empty state: connect sources, forward mail to the inbound address [DEC-14], browse the canonical directory. No sample answers styled as real ones. [contents: extrapolation A13]

## 6. Edge cases

- **E1 Active advisory on the subject** [DEC-18]: an active advisory renders with the answer at its severity (Info / Important / Critical). A **Critical** advisory requires acknowledgment before the value is used in any itinerary/proposal output [DEC-18]. Placement above the answer: extrapolation A14.
- **E2 Relative dates**: "this weekend" resolves against desk locale and is echoed back resolved. [extrapolation A15]
- **E3 Currency**: source currency with workspace display currency alongside; conversion labeled with its date, never silent. [SIG-38: silent FX conversion nearly sent a client wrong pricing; render mechanism is extrapolation A15]
- **E4 Duplicate documents**: the same document forwarded twice corroborates once; dedup by content. [derivative of A3]

## 7. Errors

- **X1 Retrieval timeout:** partial trace shown, retry offered, no partial answer rendered. [extrapolation A16]
- **X2 Source connector down:** answer renders from available sources with a visible gap note ("intranet unreachable since 09:12; answers exclude it"). [extrapolation A16]
- **X3 Sync pending:** a value known to be mid-sync renders its last-synced timestamp. [SIG-36: advisors already live with a 24–48h sync between systems; the UI must show sync state rather than pretend immediacy]

## 8. Instrumentation

- **Time to Trusted Answer** p50/p95 [DEC-07 — north star]; per-question-family split: extrapolation A17.
- Refusal rate; refusal → vault-contribution conversion [extrapolation A17].
- Conflict resolutions per week and storage layer [extrapolation A17].
- Zero-leakage audit: permission-shaped answers logged [DEC-07 guardrail; mechanism A12].

## 9. Acceptance criteria

- [ ] All four entry points reach Ask with correct context.
- [ ] Retrieval trace renders in DEC-16 order (internal → curated → vetted external).
- [ ] Contract chip renders only when all four clauses hold.
- [ ] U1 fully playable: both values → resolve sheet → agency-layer record → subsequent answer cites the resolution with both sources reachable.
- [ ] U2 refusal renders with the three recovery CTAs; no commercial value shown.
- [ ] U4 produces omission, never disclosure.
- [ ] E1 Critical advisory blocks output-use until acknowledged.
- [ ] Client-facing export strips internal reasoning (DEC-05); advisor-facing copy keeps provenance.
- [ ] Every screen has loading / empty / error states.
- [ ] Responsive: usable at 390 px; source panel becomes a bottom sheet.

## 10. Decision log

| # | Decision | Date | Evidence | What changed |
|---|---|---|---|---|
| D1 | Answer contract defined before any screen design | design principle, early in engagement | SIG-01 (advisor trust boundary), DEC-07 | chat window deferred until the contract existed |
| D2 | Conflicts: show all values, advisor resolves, stored at agency layer | 2026-03-31 | DEC-02, DEC-08 | replaces auto-resolution approaches; a wrong auto-pick is invisible |
| D3 | The confidence label decomposed into inspectable parts: contract chip + freshness date + corroboration count | design evolution across the engagement | DEC-07 (Trusted Answer includes "confidence label (or 'I don't know')") | a single opaque score was replaced by the signals an advisor can verify; trust moved from a number to evidence |
| D4 | Refusal is a first-class outcome | with D1 | DEC-07 ("I don't know" is part of the answer; low confidently-wrong guardrail) | refusal styled as respectable, with recovery CTAs |

### Resolved questions

**OQ-1 — the confidence score (resolved 2026-08-27).** Narrative reframed: the confidence label in the original Trusted Answer definition (DEC-07) **evolved into** the contract chip + freshness date + corroboration count. Presentation line: "we didn't remove trust signaling — we decomposed an opaque score into the parts an advisor can actually verify." Consequence: the existing case-study copy ("I removed the confidence score because it bought false trust") must be updated to this framing wherever it appears (case-study page, decision boards, deck).

---

## Appendix — reconstruction vs. extrapolation

Everything cited with a DEC/SIG id above is **reconstruction** (documented decision or verbatim signal). The following are **design extrapolation**: consistent with the evidence, invented for the analogue, and to be presented as design work, never as client fact.

| # | Extrapolated mechanism |
|---|---|
| A1 | The four-clause contract as a hard render gate |
| A2 | A freshness *threshold* (DEC-07 requires visibility only) |
| A3 | The corroboration clause and single-source label |
| A4 | The "answer contract met" chip |
| A5 | EP2 ⌘K ask-instead; EP3 record-card pre-scoping |
| A6 | The retrieval trace as first-class UI |
| A7 | Suggested follow-ups; threaded context |
| A8 | Mandatory reason on conflict resolution; name/date stamp format |
| A9 | Resolved conflicts cited in later answers with both sources reachable |
| A10 | Refusal sample copy (incl. "dated 14 months ago"); contact/ops recovery CTAs |
| A11 | Omission-not-redaction rule and U2 cascade |
| A12 | Permission-audit log |
| A13 | Empty-state contents |
| A14 | Advisory placement above the answer |
| A15 | Relative-date echo; dual-currency render rules |
| A16 | X1/X2 error behaviors |
| A17 | Derived metrics beyond Time to Trusted Answer |
| A18 | Persona identity (S. Marchetti, Paris desk); the five-screen set; 390 px bottom-sheet rule |
| A19 | D2's "earlier concept ranked sources by recency" narrative — plausible history, no record; do not present as dated fact |
| A20 | Citation panel's in-context highlight and "Open document" affordance (§4.4) |
| A21 | Advisor-facing provenance footer on copied answers (§4.6; the client-side strip is grounded by DEC-05) |
| A22 | U3's answer-anyway-with-warning rule (DEC-07 grounds the transparency, not the rule) |
| A23 | U1 dismiss behavior (conflict persists, nothing assumed) |
| A24 | EP4's briefing-context carry mechanism (the entry itself is DEC-13/SIG-32) |

Supporting signals the spec's stance rests on, beyond inline citations: SIG-02 (partner-relayed content cannot be assumed verified), SIG-05 (internal-first positioning: "it's better than AI because it's all of our proprietary data that's been vetted"), SIG-42 (the fragmented personal-systems reality Ask replaces).
