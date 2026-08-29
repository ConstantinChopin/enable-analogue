# Evaluation layer

Three evaluators, run by fresh-context agents that see only the files named in their protocol. Reports land in `docs/evals/reports/` as `YYYY-MM-DD-<eval>-<target>.md`.

---

## Eval 1 — Grounding (journey spec vs. evidence)

**Inputs (only these):** `docs/evidence/decisions.md`, `docs/evidence/signals.md`, one journey spec.
**Question:** is every load-bearing claim in the spec traceable to evidence, and does the spec contradict nothing that was resolved?

Checks, scored pass / fail / warn, each with a one-line justification:

1. **Traceability.** Every decision-log entry cites a DEC or SIG id (or is explicitly labeled "design principle, no external evidence"). Unsupported entries are failures.
2. **No contradiction.** Nothing in the spec contradicts a dated resolved decision (e.g. a spec that ranks conflicting sources contradicts DEC-02).
3. **Coverage.** For the spec's theme, list evidence items it should have used but didn't. Missing load-bearing signals are warns; missing decisions are failures.
4. **Invention flag.** List any concrete mechanism in the spec (state, rule, threshold) that has no evidence anchor. Invention is allowed in an analogue, but every invention must be *listed* so the presenter knows what is reconstruction and what is design extrapolation. Unlisted invention is the interview risk.
5. **Voice.** The spec reads as an engineering handoff (imperative, testable), not portfolio prose. Subjective, one paragraph.

**Output format:** table of findings (check, verdict, justification), then a ranked fix list.

## Eval 2 — Acceptance (prototype vs. journey spec)

**Inputs:** one journey spec, the running dev server.
**Protocol:** the evaluator drives the app in the browser and walks the spec top to bottom:

1. Every entry point (EP-n) reached and carries the stated context.
2. Every unhappy path (U-n), edge case (E-n), and error state (X-n) is *reachable through the UI* — not just designed. A state that exists only in code review fails.
3. Every acceptance-criteria checkbox verified, one screenshot per item, saved to `docs/evals/reports/shots/`.
4. Responsive spot-check at 390 px for the screens the spec names.
5. Copy check: UI text follows the no-narration rule and the layer/provenance labeling rules in `docs/00-overview.md` §3.

**Output:** scored checklist (pass/fail per item, screenshot refs), then a ranked fix list. Run nightly from the first build day; the morning starts by burning down the failures.

## Eval 4 — UX quality (interface vs. best practice for its class)

**Interface class:** data-dense enterprise intelligence tool (dashboard + record system + conversational surface), professional daily-use audience, trust-critical domain. Judge against that class — not against marketing sites or consumer apps.

Two stages:

### 4a — Wireframe stage (IA and flow)
**Inputs:** the wireframe (`docs/wireframe/wireframe.html`, readable as source and drivable in a browser) and the journey specs.
Checks, each pass/fail/warn with justification:
1. **Coverage:** every EP / U / E / X state and acceptance-critical flow in the six specs is represented or explicitly deferred. Produce the miss list.
2. **IA soundness:** navigation depth ≤2 to any daily task; naming matches the user's vocabulary (not system vocabulary); role-gated surfaces are discoverable to the right persona and absent for others.
3. **Flow economy:** count steps for the five demo-critical tasks (resolve a conflict; draft-and-send a chase; create an advisory; confirm a candidate; share a VIC). Flag any task whose step count or backtracking would embarrass the live demo.
4. **Pattern consistency:** the same concept uses the same pattern everywhere (provenance popover, scope chooser, resolve sheet, hold states). Divergences listed.
5. **State honesty:** loading/empty/error/permission states have a wireframe home, not just a spec mention.

### 4b — Built-UI stage (heuristics, nightly with Eval 2)
**Inputs:** the running prototype.
1. **Heuristics for the class:** visibility of system status (sync times, freshness); recognition over recall (provenance in place, no memory hops); user control (undo/close/escape everywhere; no dead ends); error prevention before error messages; progressive disclosure for density (summary before detail, drill-in not dump); restraint in notification/alert load.
2. **Data-density ergonomics:** scan patterns (left-aligned labels, tabular numerals for money, consistent column rhythm); severity encoded in form + color, never color alone; tables/lists degrade to 390 px deliberately.
3. **Accessibility floor:** contrast ≥ 4.5:1 body text; visible focus states; keyboard path through the demo-critical tasks; labels on all inputs; reduced-motion respected.
4. **Trust-surface craft:** provenance, freshness, and refusal states must *look* load-bearing, not decorative — this product's thesis lives in those details.
5. Consult the `ui-ux-pro-max` skill's UX guidelines for this product type where applicable and cite which guideline a finding rests on.

**Output:** scored findings, each tagged [class-practice], [a11y], [consistency], or [demo-risk], with a ranked fix list. Demo-risk findings outrank aesthetic ones.

## Eval 3 — Panel red-team (presentation vs. a skeptical interviewer)

**Inputs:** the deck/presenter, the prototype, the decision boards.
**Protocol:** the evaluator role-plays a senior design director at a fintech-scale company and asks, in order of likelihood: original-files provenance; why each iteration changed; what the PM disagreed with; what the candidate would cut under half the timeline; where the design fails today; metric definitions. For each probe: does the material answer it, and where does the answer live (board n, screen, doc)? Unanswerable probes are failures.
**Run:** Sunday and again Monday after fixes.

---

## Honesty rules (apply to all evaluators)

- The evaluator never sees the author's conversation or reasoning; files only.
- "Plausible" is not "grounded" — if the evidence pack doesn't contain it, it's an invention flag, whatever the evaluator believes.
- Reports are kept as written; fixes are recorded as new report entries, not edits to old ones.
