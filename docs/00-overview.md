# Enable — Analogue Environment: Product Overview

**Status:** working spec · **Owner:** Constantin (Director of Product Design) · **Last updated:** 2026-08-27
**Purpose of this repo:** a faithful reconstruction of the Enable advisor environment, built with an analogue dataset for confidentiality. The journey specs in `/docs/journeys` are written the way they were handed to engineering during the engagement: one document per journey, states enumerated, acceptance criteria explicit.

---

## 1. Product context

Enable is an intelligence layer for luxury travel agencies. Advisors at the partner agency work across seven systems (booking platform, itinerary tool, consortium portal, partner portals, intranet, email, spreadsheets) and none of them holds a whole booking. Enable sits above those systems: it retrieves, structures, and surfaces agency knowledge so an advisor can get a **trusted answer** faster and serve each client better, without the system ever acting on its own.

**North-star metric:** Time to Trusted Answer (p50 / p95), with a low "confidently wrong" rate as a hard guardrail.

**Non-goals (decided, dated):** Enable does not build an itinerary builder, does not build a client-facing presentation layer, and does not compete with catalogue vendors on partner-data freshness. These refusals are design decisions and are documented in the decision log of each journey.

## 2. Personas

| Persona | Analogue name | What they need | Journeys |
|---|---|---|---|
| **Advisor** | S. Marchetti, Paris desk | Answers she can put in front of a client without re-verifying; her private notes stay private | A, B, C |
| **Agency admin** | The agency lead | Governance: who sees what, what is published agency-wide, security posture before rollout | B, D |
| **Ops / finance** | The accounts desk | Commission reconciliation: what is owed, what is overdue, what cannot be matched | C |

## 3. The layer model (core data architecture)

Every record in Enable belongs to exactly one layer. The UI must always show which layer a value came from.

1. **Enable layer (canonical):** baseline product and partner knowledge maintained by Enable.
2. **Agency layer (workspace-owned):** the agency's overlays — negotiated terms, preferred partners, confirmed conflict resolutions, published advisories.
3. **Personal layer (advisor-owned):** private notes and client (VIC) data. Private by default; shared explicitly; admin access per policy, audited.

**Product rules:** no silent overwrites between layers; conflicts are shown, never auto-resolved; every displayed value carries provenance and freshness; permissions filter every surface including citations.

## 4. Journey index

| # | Journey | One line | Spec |
|---|---|---|---|
| A | **The Trusted Answer** | An advisor asks a commercial question and gets an answer she can forward, or an honest refusal | `journeys/journey-a-trusted-answer.md` |
| B | **The Advisory Lifecycle** | Time-bound intelligence enters the system, surfaces everywhere it matters, and is retired deliberately (v1 auto-expire → v2 manual close) | `journeys/journey-b-advisory-lifecycle.md` |
| C | **The Working Day** | The briefing room: commissions, departures, notices; the product drafts, the advisor sends | `journeys/journey-c-working-day.md` |
| D | **Governance** (supporting) | Document permissions, three-tier sharing, admin policy | folded into B's admin sections |

## 5. Surfaces

1. **Advisor web app** (primary, responsive) — briefing, ask, records, itineraries, travellers, knowledge, settings.
2. **Admin governance views** — sharing defaults, publish queue, audit.
3. **Email ingestion** — a per-workspace inbound address; forwarded mail lands in the knowledge vault, private by default.

## 6. State discipline

Every screen in the prototype implements, at minimum: loading, empty, populated, error, and permission-denied states. Journey specs enumerate which additional states are load-bearing (conflict, refusal, stale, sync-pending). A screen without its unhappy states is not done.

## 7. Mapping to the presentation rubric

| Requirement | Where it lives |
|---|---|
| Entry points | §Entry points in each journey spec |
| Unhappy paths | §Unhappy paths (U-numbered) in each spec |
| Edge cases | §Edge cases (E-numbered) |
| Error handling | §Errors (X-numbered) |
| Multiple surfaces / teams | §5 above; team cadence in the deck |
| Iteration & trade-offs | §Decision log in each spec (dated, sourced) |
| Impact | Deck closing section: LOIs, curation numbers, metric movement |
