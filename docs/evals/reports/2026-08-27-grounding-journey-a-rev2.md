# Eval 1 — Grounding: Journey A (The Trusted Answer), revision 2

**Date:** 2026-08-27 (second run, post-fix)
**Inputs:** `docs/evidence/decisions.md`, `docs/evidence/signals.md`, `docs/journeys/journey-a-trusted-answer.md` (rev 2)
**Prior report:** `2026-08-27-grounding-journey-a.md`
**Evaluator:** fresh-context grounding agent, files only.

**Overall verdict: PASS (with warns)** — 0 fails, 3 warns. All three prior fails are resolved: the decision log now cites ids, the invention inventory is declared in an appendix (A1–A19), the missing decisions (DEC-07/15/16/18) are wired in, X3's sync claim is now grounded by a new evidence entry (SIG-36), and the D3 confidence-score narrative has been defused into an explicitly-open question (OQ-1) blocked from presentation use. What remains is small but real: OQ-1 itself misquotes DEC-07, E3 gestures at a failure class the pack does not contain, and a handful of minor mechanisms escaped the appendix.

---

## Findings table

| Check | Verdict | Justification |
|---|---|---|
| 1. Traceability | **WARN** | D1 (SIG-01 + DEC-07, design-principle label), D2 (DEC-02 + DEC-08, dated), D4 (DEC-07) all cite ids correctly; D3 declares "none in pack" and routes to OQ-1, which satisfies the rule's intent. The warn: **OQ-1 misquotes the pack** — it states DEC-07 "includes a 'confidence label (or "I don't know")'", but DEC-07 as written contains no "confidence label" phrase, only provenance + freshness + "I don't know". The open question manufactures a tension with wording the evidence file does not carry. |
| 2. No contradiction | **PASS** | U1 implements DEC-02/DEC-08 exactly (show both, advisor resolves, agency-layer storage, no silent overwrite); §4.6 now resolves the prior DEC-05 tension (advisor-facing copy keeps provenance, client-facing export strips reasoning); E1 now matches DEC-18's severity model and Critical-acknowledgment gate; the §4.2 trace order matches DEC-15/DEC-16. Nothing overturns a dated resolved decision. |
| 3. Coverage | **WARN** | No missing decisions (DEC-19 is off-theme for this journey). Missing load-bearing signals the spec matches but does not cite: **SIG-05** ("proprietary data that's been vetted" — the internal-first positioning behind §4.2), **SIG-02** (the DMC/ChatGPT trust-chain breakdown — the case for "vetted external" over generic search in the trace and U3), and arguably **SIG-42** (14 personal systems — motivates U5's connect-sources empty state). Cheap credibility, still uncollected. |
| 4. Invention flag | **WARN** | The appendix now declares 19 extrapolation classes covering essentially all of the prior report's 31-item inventory, including the three ⚠ items (corroboration A3, freshness threshold A2, and X3 — the last now grounded outright by SIG-36 instead). Remaining unlisted mechanisms (minor): the §4.3–4.4 quoted-extract panel with in-context highlight and "Open document" (A18 covers the Source panel screen, not this mechanism); the §4.6 advisor-facing provenance footer; U3's answer-with-warning-rather-than-suppress rule (cited evidence grounds freshness visibility, not the answer-anyway policy); U1's dismiss-leaves-conflict-state behavior; EP4's context-carry mechanism. And one phrase still leans on nonexistent evidence: E3's "motivated by the multi-currency variance class of failures" — no SIG documents any currency failure; the mechanism is correctly labeled A15 but the motivation clause implies observed incidents. |
| 5. Voice | **PASS** | The thesis prose is gone. The spec is now imperative and testable throughout — numbered paths, bracketed evidence ids, checkbox acceptance criteria, refusal "styled as a normal outcome" stated as a rule rather than argued. The lone flourish ("the load-bearing path") is a heading gloss, not a claim. |

---

## Prior findings — resolution audit

| Prior fix (ranked) | Status | Notes |
|---|---|---|
| 1. Fix or relabel D3 (confidence score) | **Resolved, correctly** | The claim is no longer asserted. D3 reads "redesigned — see OQ-1", Evidence "none in pack"; OQ-1 blocks the narrative from presentation material until the removal is confirmed or the story is reframed. This is the honest handling. One defect introduced: the OQ-1 misquote of DEC-07 (see check 1). |
| 2. Add an invention appendix | **Resolved (minor gaps)** | A1–A19 present; every ⚠ item declared or grounded. Gaps listed under check 4. |
| 3. Delete or ground X3's "24–48h sync" | **Resolved via pack extension** | `signals.md` now contains SIG-36 (verbatim, dated 2026-05-28, TripSuite→Virtuoso 24–48h) and SIG-37 under a new "Sync and system latency" theme. X3 cites SIG-36. This is the sanctioned fix path (evidence added to the pack), and the quote genuinely supports the claim. |
| 4. Replace prose sources with ids in the decision log | **Resolved** | D1→SIG-01+DEC-07 with design-principle label; D2→DEC-02+DEC-08; D4→DEC-07. The invented gloss quote ("a wrong answer costs more than no answer") is gone. |
| 5. Wire in DEC-07/15/16/18 | **Resolved** | DEC-07 roots §1, §2, §8; §4.2 trace now renders the DEC-16/DEC-15 order (internal → curated → vetted external) and the invented "overlay checked / notices checked" vocabulary is gone; E1 carries the DEC-18 Info/Important/Critical model with the Critical-acknowledgment gate, mirrored in acceptance criteria. |
| 6. Resolve the DEC-05 tension | **Resolved** | §4.6 splits advisor-facing (provenance kept) from client-facing (reasoning stripped per DEC-05). |
| 7. Cite supporting signals | **Mostly resolved** | SIG-10 on U1, SIG-03/SIG-04 on U3, DEC-14 on U2/U5 all cited. SIG-05 and SIG-02 remain uncited (check 3). |
| 8. Move thesis prose out | **Resolved** | None of the flagged lines survive. |

No regressions found: nothing that previously passed now fails, and the pack extension (SIG-36/37) is verbatim-quote formatted consistently with the rest of `signals.md`.

## Appendix completeness and residual masquerade

Asked directly: **is the appendix inventory complete, and does any claim still masquerade as client fact?**

- **Completeness:** ~95%. The five unlisted mechanisms in check 4 are all low-stakes UI behaviors, not policies or facts; none is likely to be probed as client history. Adding them (an A20, or folding into A6/A18) closes the inventory.
- **Masquerade:** two residuals. (1) **OQ-1's "confidence label" quotation** — it presents pack wording that the pack does not contain; in an interview, quoting DEC-07 that way would be checkable and wrong. Either correct OQ-1 to DEC-07's actual wording (which weakens the claimed tension — "I don't know" is not a confidence score) or, if the underlying roadmap really says "confidence label", add that wording to DEC-07 in `decisions.md` so the pack and the spec agree. (2) **E3's "multi-currency variance class of failures"** — implies observed incidents; no SIG exists. Strike the clause or relabel it "assumed failure class, no signal in pack". Everything else that reads as fact traces to an id, and the persona is declared fictional in both the header and A18.

## Ranked fix list

1. **Correct OQ-1's DEC-07 quotation.** Quote the pack as written, or amend DEC-07 in the pack if the roadmap genuinely contains "confidence label". As it stands the spec's one open question misrepresents its one piece of cited evidence.
2. **Strike or relabel E3's "multi-currency variance class of failures" motivation clause** — the only remaining phrase implying evidence the pack lacks.
3. **Close the appendix gaps:** citation-panel highlight/"Open document", advisor-facing provenance footer, U3's answer-anyway rule, U1's dismiss behavior, EP4 context-carry.
4. **Cite SIG-05 and SIG-02 in §4.2 / U3, and SIG-42 in U5** — the spec already matches them; the ids are free.
