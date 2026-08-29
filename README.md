# Enable — analogue environment

A working reconstruction of an advisor-facing intelligence product, built to present the design work behind it.

**What this is.** The original product is a luxury-travel agency's intelligence layer: it reconciles product, partner, commission, and client data from many systems into one layered model, and answers questions from it. The client environment cannot be shown, so this repository is a **reconstruction with an analogue dataset** — the same journeys, states, and decisions, running on invented data.

**What is real and what is not.** Every product decision in `docs/evidence/decisions.md` and every advisor signal in `docs/evidence/signals.md` is drawn from the engagement's own record (dated decisions, verbatim call quotes reduced to roles). Every journey spec ends with an appendix separating **reconstruction** (cited to a `DEC-`/`SIG-` id) from **design extrapolation** (invented for this build, declared). All names, properties, travellers, and figures in `src/data/seed.ts` are fictional.

## Run it

```bash
npm install && npm run dev
```

Then open http://localhost:3000. Everything is client-side and deterministic — no services, no model calls, no network. The intelligence is scripted; the design is the deliverable.

## Driving the demo

A presenter layer sits at the bottom of the shell:

| Key | Goes to |
|---|---|
| `1`–`8` | the demo checkpoints (morning · commission · record · ask · refusal · v1 rewind · traveller · admin confirm) |
| `0` | reset to the opening state |
| `N` | toggle the narration overlay (presenter commentary; the product chrome stays product-voice without it) |
| `⌘K` | command palette (stubbed destinations) |

Two switches in the top bar change what the product is:

- **world** — `v2 current` is the shipped design; `v1 Mar` rebuilds the March build whose advisories carried auto-expiry, so the failure it caused can be seen rather than described.
- **viewing as** — advisor (RD) · colleague (JD) · agency lead (MK) · ops (AB). Permission-gated content is **absent, not masked**: switching persona is the isolation proof, not a cosmetic change.

## The journeys

| | Journey | Door into the model |
|---|---|---|
| E | The Record | the catalogue — layered fields, provenance, conflicts shown |
| A | The Trusted Answer | the conversation over the same model |
| B | The Advisory Lifecycle | its time dimension (and the v1 → v2 iteration) |
| C | The Working Day | the model pushed at you: briefing, commissions |
| D | Connections & Extraction Confirmation | how it gets fed — nothing becomes truth unconfirmed |
| F | The Traveller | the most sensitive record type |

## Documentation

Specs are written as engineering handoffs, not portfolio prose.

```
docs/
  journeys/     one spec per journey: entry points, unhappy paths, edge cases,
                errors, instrumentation, acceptance criteria, dated decision log
  evidence/     the receipts: dated decisions (DEC-nn) and advisor signals (SIG-nn)
  design/       data model · entity display system · design-system inventory · plate audit
  evals/        rubric + append-only evaluation reports (grounding, acceptance, UX, coverage)
  presenter/    demo choreography and presenter voice lines
  wireframe/    the low-fidelity interactive wireframe this build was validated against
```

## Stack

Next.js (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Lucide. No database, no API.
