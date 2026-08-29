# Journey D — Connections, Ingestion, and Extraction Confirmation

**Status:** spec · **Personas:** Agency lead / admin (primary), Ops (extraction review), Advisor (contributes sources, sees results)
**Screens touched:** Settings → Connections, Integration health, Extraction review queue, Candidate record card, Merge/dedup sheet, Knowledge vault
**Evidence pack:** `../evidence/decisions.md`, `../evidence/signals.md`. Mechanisms without a DEC/SIG id are extrapolation, declared in the Appendix.
**Demo note:** feeds demo beat 7 (admin persona) — one pending candidate record confirmed live, under 90s.

---

## 1. Purpose

New knowledge enters Enable through connections (drive, intranet, partner portals, inbound email) and files. The ingestion pipeline extracts candidate records — but **nothing extracted becomes truth until a human confirms it**. The design driver is documented: below ~95% extraction reliability, auto-commit destroys trust and users revert to manual [DEC-19]; and the existing catalogue proves what unconfirmed extraction produces — 93% boilerplate amenity fields [SIG-44]. Confirmation is where the agency's curation becomes the product's value.

## 2. The pipeline contract

1. Every extracted field is **attributable to its source** — what, where, when [DEC-23].
2. Extraction resolves identity against existing entities before proposing anything new: Enable canonical match → agency overlay → new record [DEC-23].
3. Documents and their derived records land **private by default**; permission follows the document [DEC-25, DEC-14].
4. Candidate records are **held in review**; a candidate never surfaces in answers, cards, or search until confirmed [SIG-43: "advisor confirms in one tap"; DEC-19]. 
5. Layer/source disagreements are shown both-sided and require human confirmation [DEC-08].

## 3. Entry points

| # | Entry | Context carried | Evidence |
|---|---|---|---|
| EP1 | Settings → Connections → "Add connection" (admin) | connector type, credential scope | DEC-11 (MCP-first connector posture); DEC-24 (integration health); setup flow D1* |
| EP2 | Knowledge vault → file upload (admin or advisor) | file, uploader, default-private | DEC-25, DEC-14 |
| EP3 | Inbound email address | sender-verified message + attachments | DEC-14 |
| EP4 | Forwarded content — advisors forward it "the same you would to a friend" | link/screenshot → extraction | SIG-43 |

*Appendix ids prefixed D to avoid collision with decision-log numbering.

## 4. Happy path — new connection to confirmed record

1. Admin adds a connection (EP1): picks the source, grants scoped credentials, sets the sync cadence. Connector posture is MCP-first: consume the upstream MCP where one exists, self-hosted connector as fallback [DEC-11]. The booking-system connector is read-only — financial ground truth stays in the source system [DEC-12]. The connection appears in **Integration health** with last-success timestamp and error state [DEC-24].
2. First sync runs. The vault shows ingested documents, each private by default with its permission inherited [DEC-25].
3. The pipeline detects a candidate: a new property in a DMC's semi-structured Excel [DEC-25]. It lands in the **Extraction review queue**, badged "unconfirmed".
4. Ops/admin opens the **candidate record card**: every extracted field shows its value *and* its source snippet (what/where/when) [DEC-23]. Fields the pipeline is unsure of are visibly marked for attention rather than silently guessed [DEC-19 posture; marking mechanism D3].
5. Identity check renders first: "possible match: existing canonical record (name variant, same city)." Admin chooses **merge into existing** (extracted fields become a layered overlay on the canonical record) or **create new** [DEC-23; merge sheet D4].
6. Admin corrects one field (the extracted "amenities" text is portal boilerplate — flagged by the template-copy detector [SIG-44; detector D5]), confirms the rest per-field or all-at-once [granularity D13*], and **confirms the record**.
7. The record goes live at the correct layer with full provenance; it is now answerable, searchable, and linkable. The confirming admin is stamped on it [field provenance DEC-23; confirmer stamp D14*].

**Exit criteria:** a record reachable in Journey A answers exists only because a named person confirmed it, and every field on it can say where it came from.

## 5. Unhappy paths

### U1 — Wrong metadata extracted
The pipeline reads "Junior Suite 45m²" where the source says 38m². Reviewer sees value + source snippet side by side [DEC-23], corrects inline; the correction is attributed and the original extraction preserved in field history [DEC-08: no silent overwrites]. The same-fact-two-sources drift class is the real-world antecedent [SIG-10].

### U2 — Duplicate candidate / identity collision
The same property arrives from two sources under name variants (the orphaned-commission problem is this failure downstream [SIG-11]). The queue groups suspected duplicates; the merge sheet shows both candidates field-by-field; resolution is a human choice stored with reason [DEC-23, DEC-08; merge-reason capture D16*]. Nothing merges automatically.

### U3 — Low-confidence extraction held
A field (or whole candidate) below the reliability bar is **held**, never committed [DEC-19 posture; runtime hold gate D15*]. The card shows what was found and why it is held; CTAs: open source, fix manually, reject. A rejected candidate records why, so the pipeline's misses become reviewable [rejection log D6].

### U4 — Connection failure / degraded sync
Credentials expire or the source errors. Integration health shows last success + error [DEC-24]; dependent answers in Journey A carry the X2 gap note ("source unreachable since…"). Downstream surfaces render last-synced state rather than pretending immediacy [SIG-36]. No stale re-ingestion is presented as fresh [DEC-07 freshness posture].

### U5 — Permission misconfiguration caught at the boundary
An ingested document's permission would expose it agency-wide when its source scope was personal/team. Default-private wins [DEC-25, DEC-14]; widening scope is an explicit, attributed act [DEC-08 posture; DEC-09 tiered sharing], and derived records inherit the tightest scope of their sources until a human widens them [inheritance rule D7; SIG-12 is the stake].

### U6 — Boilerplate masquerading as content
Extracted description matches known template copy [SIG-44]. The field is flagged "template copy — needs editorial," excluded from answer corroboration, and queued for enrichment. [detector + exclusion rule D5]

### U7 — Silent unit/currency transformation
A source value in another currency is never silently converted [SIG-38: "it matches the euro to the US Dollar... so that you don't accidentally send it to a client in the wrong pricing"]. The field renders the source currency and value; any conversion is visible and dated. A candidate carrying a converted figure without its source currency is held as U3.

## 6. Edge cases

- **E1 Candidate referenced before confirmation:** an advisor's question would be answered by a held candidate. The answer does not use it [contract rule §2.4]; the refusal/gap notes that unconfirmed material exists in review — visible to roles that can see the queue, invisible otherwise [rendering rule D8].
- **E2 Re-ingestion of a changed source:** the source document updates; changed fields re-enter review as *diffs against the confirmed record*, not as a new candidate [diff mechanism D9; DEC-23 attributability].
- **E3 Bulk seeding:** a list import (e.g. openings list) creates dozens of candidates; the queue supports batch confirm for high-confidence fields while holding flagged ones [batch mechanics D10; scale motivated by SIG-44's coverage gaps].

## 7. Errors

- **X1 Pipeline failure mid-batch:** partial batches are atomic per candidate; no half-extracted record ever renders. Failed items re-queue with the error shown. [D11]
- **X2 Credential revocation mid-sync:** sync halts cleanly, health row flips, previously confirmed records remain (they carry their provenance and date). [DEC-24 posture]

## 8. Instrumentation

- Extraction precision proxy: fields corrected at review / fields confirmed [DEC-19's bar made measurable].
- Queue latency: candidate arrival → confirmation [derived metric D17*].
- Duplicate-merge rate; rejection reasons distribution [derived metrics D17*].
- Coverage movement: unconfirmed vs confirmed records per category [SIG-44 as baseline].

## 9. Acceptance criteria

- [ ] EP1 connection flow playable as admin; health row renders last-success and error states [DEC-24].
- [ ] Candidate record card shows per-field value + source snippet (what/where/when) for every extracted field [DEC-23].
- [ ] Unconfirmed candidates are invisible to Journey A answers and search; E1 verified from the advisor account.
- [ ] Merge sheet playable: variant-name duplicate resolved by choice, with reason, attributed.
- [ ] U1 correction preserves field history; U3 hold and reject flows playable.
- [ ] U5: derived record inherits tightest source scope; widening is explicit and audited.
- [ ] U6 template-copy flag renders and excludes the field from corroboration.
- [ ] Demo beat: one pending candidate confirmable end-to-end in under 90 seconds.
- [ ] Loading / empty / error states everywhere; responsive at 390 px.

## 10. Decision log

| # | Decision | Date | Evidence | What changed |
|---|---|---|---|---|
| D1 | Nothing extracted auto-commits; confirmation is human, per-record, attributed | design driver, dated by its evidence | DEC-19 (2026-04-02 reliability lesson), SIG-43 (HITL in the first ingestion pitch), SIG-44 (what raw extraction produces) | the pipeline proposes; people decide |
| D2 | Every extracted field carries source attribution (what/where/when) | Phase 2a | DEC-23 | provenance became a field-level property, not a document-level one |
| D3 | Identity resolution precedes creation: canonical match → overlay → new | Phase 2a | DEC-23 | the duplicate/orphan class [SIG-11] attacked at ingestion, not reconciliation |
| D4 | Private by default; permission follows the document into derived records | 2026-04-02 | DEC-25, DEC-14 | governance enforced at the boundary, not patched after [SIG-12, SIG-13] |

---

## Appendix — reconstruction vs. extrapolation

| # | Extrapolated mechanism |
|---|---|
| D1* | Connection setup flow (connector picker, scoped credentials, cadence) |
| D2* | Review-queue presentation (badging, grouping, sort) |
| D3* | Unsure-field marking on the candidate card |
| D4* | Merge sheet interaction design |
| D5* | Template-copy detector and its corroboration exclusion (goal grounded by SIG-44) |
| D6* | Rejection log |
| D7* | Tightest-scope inheritance rule for derived records |
| D8* | E1's role-aware "material in review" note |
| D9* | Re-ingestion diff review |
| D10* | Batch confirm mechanics |
| D11* | Per-candidate atomicity |
| D12* | The 90-second demo path; seeded candidate content |
| D13* | Per-field vs all-at-once confirmation granularity (SIG-43 grounds one-tap record-level confirmation only) |
| D14* | Confirmer identity stamp on the confirmed record (DEC-23 attributes fields to sources, not the confirming person) |
| D15* | Runtime confidence scoring and the hold gate (DEC-19 grounds the reliability lesson; the per-field runtime gate is design) |
| D16* | Merge-reason capture in U2 |
| D17* | §8 derived metrics: queue latency, duplicate-merge rate, rejection-reason distribution |

Supporting signals beyond inline citations: SIG-02 (partner-relayed content is unverified until checked), SIG-05 ("vetted proprietary data" as the product's stated edge — confirmation is the vetting), SIG-42 (import paths matter because knowledge lives in personal systems).
