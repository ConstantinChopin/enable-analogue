# Entity display system

How every entity type renders at every density. The rule set the wireframe and the hi-fi build both follow. Grounding: DEC-08 (fields grouped by layer, provenance + freshness on cards), DEC-27 (intel on cards), DEC-23/DEC-35 (per-field attribution), DEC-18 (severity), DEC-28 (attributed preferences), DEC-30/31/36 (ownership, sharing, gates). Field names bind to `data-model.md` — the schema is the contract.

## Field binding per density (schema names)

| Entity | Card fields | Rail adds | Full page adds |
|---|---|---|---|
| **Product** | name · city, country · brand + program chip · luxury_tier · status chip (Coming Soon/Closed suppress booking affordances) · notice/conflict/stale chips · footer: linked-product commission + last_verified · layer dots | category/subcategory · network_consortia · client_amenities count (45-slug vocab) · rep firm + agency contacts · "who booked this last" · active promotions (booking vs travel window) | full DEC-08 anatomy · amenities (freeform) vs client_amenities (program) kept visually distinct [DEC-34] · google_place verification · extraction_log provenance per field |
| **VIC** | preferred_name (fallback full_name) · relationship_status · next-trip line · avatar · acuity_score badge (if run) · share-state chip · footer: profile count "7 types" + preference attribution | primary profile's top preferences with ai_confidence + source · sharing tier (Owner/Full/Basic/team/directory) · passport-expiry alert if near | 7 profile tabs × 6 blocks · Acuity tab (state machine Not Run/Running/Complete/Locked; gated canRunAcuity) · spend fields gated canViewCommissions · linked products/itineraries/documents/conversations |
| **Itinerary** | title · status (kanban pipeline) · client VIC chip · dates · destinations | day count · event-type distribution · commission rollup (gated) | day-by-day with 5 event types; event → mini product card via source_product_id |
| **Promotion** | — (rows on program/record/briefing) | both windows explicit: "book by … · travel by …" · stacks_with_base as words ("adds to base" / "replaces base") | full eligibility + volume mechanics |
| **Candidate (dedup)** | — (rows) | similarity_score + match_signals rendered as evidence ("name 0.92 · phone match") | per-field confirm with source_snippet; field_decisions audit |

Commission figures anywhere: `canViewCommissions` gate — absent, not masked, for unentitled roles.

## Densities (surfaces)

| Density | Where | Job |
|---|---|---|
| **Inline chip** | inside answers, briefing rows, cross-links | recognize + state at a glance; one click to more |
| **Row** | queues and dense lists (notices due, unmatched payments, review queue) | triage: compare many, act on one |
| **Card** | directories (records, travellers) | identify + scan state; entry to detail |
| **Rail quick-look** | right panel over any directory | inspect without losing place; act on the common cases |
| **Full page** | deep work (record anatomy, candidate confirm, commission timeline) | the complete layered truth |

**Master-detail rule:** directories are card grids; selecting a card opens the right rail (non-modal, place-preserving); the rail always offers "Open full ↦". Queues stay rows — triage surfaces are tables, not galleries. Composition and confirmation stay sheets/full pages.

## Identity anatomy per entity

| Entity | Chip | Row | Card | Rail adds | Full page adds |
|---|---|---|---|---|---|
| **Product record** | name + state dot | name · place · one state chip | name / place · program / state chips (notice, conflict, stale) / footer: key commercial fact + freshness + layer dots | mini layer anatomy (2–3 fields per layer), cross-links, actions (ask, notice, open) | complete DEC-08 anatomy, provenance popovers, edit/note composers |
| **Traveller** | initials + name | name · next departure | name / next-trip line / chips: departure, share state / footer: preference count "all attributed" | top preferences with sources, share state + action | full profile, suggestions area, share audit |
| **Notice (advisory)** | severity-colored chip | text · age · severity · owner | — (notices don't get cards; they live on their subjects) | subject context + still-true?/close | composer sheet; lifecycle history |
| **Commission** | amount + state | property · amount · state chip (overdue/due/paid/chased) | — (money is rows; scan integrity beats visual variety) | timeline summary + draft-reminder action | full timeline, discrepancy flags, chase log |
| **Candidate record** | — | name · source · state (new/duplicate/held) | — | field summary + held count | per-field confirm, merge sheet |
| **Source/document** | numbered citation | name · date · scope badge | — | quoted extract + open | viewer (out of wireframe scope) |
| **Rep contact** | name chip on record | name · firm · specialty | — | endorsements + contact | — (lives on records) |

## State encoding

- **Severity/status is form + color, never color alone**: chips carry words (overdue, conflict, stale, held).
- **Freshness is a date, not an icon**: "verified Mar", "96d unverified".
- **Layer identity**: three dots (canonical · agency · personal) on cards; full grouping only at rail/page density.
- **Trust states (conflict, refusal, held, unconfirmed) are visually louder than commercial states** — they are the product's thesis.
- Solid border = grounded mechanism, dashed = declared extrapolation (wireframe-only encoding, dropped in hi-fi).
