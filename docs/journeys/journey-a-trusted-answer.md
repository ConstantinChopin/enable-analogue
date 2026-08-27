# Journey A — The Trusted Answer

**Status:** template journey, drives the shared component set · **Persona:** Advisor (S. Marchetti, Paris desk)
**Screens touched:** Ask, Answer thread, Source panel, Record card, Conflict sheet
**Decisions referenced:** answer contract; show-all conflict handling; confidence score removed; no silent overwrites

---

## 1. Purpose

An advisor asks a commercial question mid-task ("What is our commission on Maison Léandre, and does the Atelier rate include breakfast?") and receives either an answer she can forward to a client without re-verifying, or an honest refusal that tells her exactly what is missing. A wrong answer costs more than no answer: the advisor's reputation is the product being protected.

## 2. The answer contract (definition of done for any answer)

An answer may render only when all four hold:

1. **Cited** — every claim carries a numbered citation to a source the advisor is permitted to open.
2. **Fresh** — the oldest supporting source is dated on the answer; values past their freshness threshold carry a warning inline.
3. **Corroborated** — commercial values (rates, commissions, policies) require corroboration or an explicit single-source label.
4. **Permission-clean** — no claim may derive from a document the advisor cannot open. Zero leakage, including via citations and search snippets.

If any clause fails, the system refuses (see U2). There is no confidence score anywhere in the product (removed; see Decision log D3).

## 3. Entry points

| # | Entry | Context carried |
|---|---|---|
| EP1 | **Ask** in the left nav | none; blank thread |
| EP2 | **Search everything** (⌘K) → "ask instead" | query text |
| EP3 | **Record card → Ask about this** | entity id (property, program, partner) pre-scoped |
| EP4 | **Briefing item → follow-up** | briefing context (e.g. active notice on the property) |

## 4. Happy path

1. Advisor opens Ask (EP1) and types the commission question.
2. Retrieval banner shows the trace as it happens: sources read → overlay checked → notices checked. The trace is a first-class UI element ("How this answer was built"), not a debug view.
3. Answer renders: claims with numbered citations, source panel on the right with quoted extracts, oldest-source date, corroboration count, "answer contract met" chip.
4. Advisor opens citation 1; the quoted extract is highlighted in context; "Open document" available because she has permission.
5. Suggested follow-ups are offered ("What does the Atelier rate exclude?"). She asks one; the thread continues with context.
6. She copies the answer; provenance footer travels with the copy.

**Exit criteria:** advisor can act on the value without opening another system.

## 5. Unhappy paths

### U1 — Sources conflict (the load-bearing path)
The partner portal says 12%; a rep email says 15%.
- The answer does **not** pick one. It renders a **conflict block**: both values, each with source, date, and layer.
- CTA: **Resolve** → conflict sheet. Advisor picks the value to treat as current, must give a reason, and the resolution is stored at the **agency layer** with her name and date. Neither source document is edited (no silent overwrites).
- Subsequent answers cite the resolution *and* keep both underlying sources reachable.
- If the advisor dismisses without resolving, the answer stays in conflict state; nothing is assumed.

### U2 — Refusal (contract fails)
No corroborating source for a commission value, or all sources are past the freshness threshold.
- The system says what it knows, what is missing, and refuses the commercial claim: "I found one uncorroborated value dated 14 months ago. I can't state a current commission."
- CTAs: request from the desk's known contact; forward a document to the vault inbound address; ask ops to verify.
- A refusal is styled as a normal, respectable outcome, not an error.

### U3 — Stale record answers, with its date
An unchecked field still answers, but it answers with its date and a freshness warning. The whole difference between useful and dangerous is the warning, not suppression.

### U4 — Permission-denied source
A relevant document exists but the advisor cannot open it.
- The claim it supports is **omitted entirely**. The answer never says "a document you can't see says…". If the omission makes the answer fail the contract, U2 renders instead.
- Admin-side: the audit log records that a permission boundary shaped an answer.

### U5 — Empty workspace
New desk, no knowledge ingested. Ask renders a guided empty state: connect sources, forward mail to the inbound address, or browse the canonical directory. No fake confidence, no sample answers styled as real ones.

## 6. Edge cases

- **E1 Active notice on the subject:** if the property has an active advisory (spa closed), it renders above the answer regardless of the question asked.
- **E2 Relative dates:** "this weekend" resolves against the desk's locale and is echoed back resolved ("Sat 5 – Sun 6 Sep").
- **E3 Currency:** values render in source currency with the workspace display currency alongside; conversion is labeled with its date, never silently applied.
- **E4 Duplicate documents:** the same PDF forwarded twice corroborates once, not twice; the answer's corroboration count deduplicates by content.

## 7. Errors

- **X1 Retrieval timeout:** partial trace shown, retry offered, no partial answer rendered.
- **X2 Source connector down:** answer renders from available sources with a visible gap note ("intranet unreachable since 09:12; answers exclude it").
- **X3 Sync pending:** a value known to be mid-sync renders its last-synced timestamp, mirroring the 24–48h sync reality advisors already live with.

## 8. Instrumentation

- Time to Trusted Answer (p50/p95) per question family.
- Refusal rate and refusal → resolution conversion (a healthy refusal produces a vault contribution).
- Conflict resolutions per week and layer of storage.
- Zero-leakage audit: permission-shaped answers logged.

## 9. Acceptance criteria

- [ ] All four entry points reach Ask with correct context.
- [ ] Contract chip renders only when all four clauses hold.
- [ ] U1 conflict is fully playable: both values → resolve sheet → agency-layer record → subsequent answer cites the resolution.
- [ ] U2 refusal renders with actionable CTAs; no commercial value shown.
- [ ] U4 produces omission, never disclosure.
- [ ] Every screen has loading / empty / error states.
- [ ] Responsive: usable at 390px; source panel becomes a bottom sheet.

## 10. Decision log

| # | Decision | Date | Source | What changed |
|---|---|---|---|---|
| D1 | Answer contract defined before any screen design | early in engagement | design principle, validated by advisor trust-boundary feedback ("I don't want to rely on it, it's just information from the Internet") | chat window deferred until the contract existed |
| D2 | Conflicts: show all values, advisor resolves, stored at agency layer | resolved 2026-03-31 | product decision log | earlier concept ranked sources by recency; rejected because a wrong auto-pick is invisible |
| D3 | Confidence score removed | mid engagement | advisor sessions: the score was read as permission to skip verification | replaced by the contract chip + freshness + corroboration count |
| D4 | Refusal is a first-class outcome | with D1 | "a wrong answer costs more than no answer" | refusal styled as respectable, with recovery CTAs |
