# Two roles — surfaces, journeys, and the action ladder

**Status:** exercise, for Constantin's review · **Date:** 2026-09-11 · **Feeds:** Pass 2 (`02-sequence.md`), where each surface's contract becomes its decision record.

**The cut.** Four demo personas (advisor, colleague, lead, ops) become two user types:

| Type | Was | Who they are | What they hold |
|---|---|---|---|
| **Agency user** | advisor + colleague | An advisor at the agency: sells, serves travellers, keeps her own notes | The **Advisor** ownership level: notes, VICs, itineraries (schema: `advisor_id`) |
| **Agency owner** | lead + ops | The principal: also sells, and governs the agency's layer | Everything the user holds, **plus** the **Agency** level: programs, linked products, promotions, rep firms, contacts, sharing policy, connections, the money desk |

**Three consequences, stated as assumptions (correct any that are wrong).**

1. **The owner is a superset.** She reaches every user surface as herself (her own travellers, her own bookings) and three governance acts, on four screens, that the user never sees: confirming a record, publishing to the agency, and matching money nobody claimed. Nothing is hidden from the owner that a user can see.
2. **The colleague's differences become states, not a type.** "Cannot see commissions" is the schema's `canViewCommissions` policy gate, set per user by the owner (default on). "Sees only shared travellers" is what any user sees on a profile she does not own: the collaborator tier, or nothing. Neither needs a third login.
3. **Ops folds into the owner.** The unmatched-payments desk and reconciliation are the owner's money chapter. A larger agency would split it back out; that split is the schema's `agency_id` + a role flag, not a new surface.

Two demo accounts remain: **R. Devane** (agency user, Paris desk) and **M. Keller** (agency owner).

---

## 1. Surfaces in common, and surfaces that are not

| Surface | Route | User | Owner | What differs for the owner |
|---|---|---|---|---|
| Sign in | `/signin` | ● | ● | the account list |
| Brief | `/briefing` | ● | ● | her chapters: the queue, the candidates, connections and the money desk come before her own departures |
| Notifications | `/notifications` | ● | ● | ingestion, connection and publish tags exist only for her |
| Ask | `/ask` | ● | ● | answers may cite the agency layer's held candidates as "in review" (visible to the owner, invisible to the user, Journey D E1) |
| Records | `/records` | ● | ● | none |
| Record | `/records/[id]` | ● | ● | agency-scope edits publish directly instead of going to review; a user's proposed value waits here for her approval. **Client intelligence** is common, not owner-only: the seed gates it on each traveller's own sharing ("visible only for travellers shared with you"), so both types see the chapter and the owner simply sees more travellers in it |
| Travellers | `/travellers` | ● | ● | none — each sees her own travellers and those shared with her; a private traveller is out of reach for the owner too |
| Traveller | `/travellers/[id]` | ● | ● | none |
| Commissions | `/commissions` | ● | ● | her ledger is agency-wide (every advisor's bookings), with **Discrepancies** and **Reconciliation** views; the user's is her own bookings |
| Commission | `/commissions/[id]` | ● | ● | the owner can chase any agency commission, not only her own; her reminder goes out in her name and sits in the same chase log as the advisor's |
| Itineraries | `/itineraries` | ● | ● | none — both create a trip and both check it is ready |
| Knowledge | `/knowledge` | ● | ● | the owner **assigns access** and sees indexing; the user finds and reads |
| Settings | `/settings` | ● | ● | the owner's settings carry one agency chapter: who can see money, per user |
| Connections | `/connections` | ● | ● | a user connects her own mailbox or Drive; the owner also connects the agency's sources — the shared drive, the intranet, a partner portal. Either way what a source indexes arrives closed to whoever connected it, and is opened one document at a time in the vault |
| Confirm records | `/admin/review` | — | ● | owner only |
| Candidate review | `/admin/review/[id]` | — | ● | owner only |
| Publish queue | `/admin/publish` | — | ● | owner only |
| Unmatched payments | `/ops/resolution` | — | ● | owner only |

Fourteen surfaces in common, four for the owner alone, eighteen in all. The four are three acts: confirming a record (the list and the candidate), publishing to the agency, and matching money nobody claimed. The dock shows seven tiles to the user and ten to the owner (the user's seven, plus Confirm records, Publish queue, Unmatched payments); Connections and Settings live behind the account for both.

**Everything created starts private** (decided 2026-09-11). A property record, a trip, a note, an uploaded document, a forwarded email, a traveller profile: each is private to whoever made or received it, the owner included, and reaches anyone else only by a deliberate share. Working inside an agency does not hand an advisor's personal layer to the agency: the owner cannot widen, re-scope or share anything an advisor made or brought in, and cannot open it either (decided 2026-09-11). There is no policy access and no logged look: DEC-29's break-glass is withdrawn. When an advisor is away, her travellers are covered because she shared them before she left (Journey F), which keeps sharing the only way in. There are no per-kind defaults to set, so the owner's *sharing defaults* setting is removed. Today two defaults say otherwise — trips open to the whole agency and uploads to the uploader's team — and both become private. Confirm records stays for what arrives from sources; it is not the route by which anything someone made reaches the agency.

**One sharing rule, for everything** (decided 2026-09-11). Sharing with a named colleague or with your own team takes effect at once. Sharing with **the whole agency** waits in the owner's publish queue until she releases it — a note, a property, a trip, a document, an advisory, a traveller profile alike — and it goes out with its author kept. The owner's own agency-wide shares go out directly, since she is the one who would release them. The publish queue is therefore the single place where the owner decides what the entire agency sees.

**Connecting a source shares nothing, for either type.** The add flow has no "who can read it" step, and its own header says that absence is the policy: an audience picker would be a bulk share made at the moment someone is thinking about folders and OAuth scopes. That rule needed no change to reach users. The index arrives closed to whoever connected it — a user's mailbox to her, an agency drive to the administrators — and a document opens to anyone else only when a named person opens it in the vault. It is the layer model at the ingestion boundary, which is Journey D's argument.

**Itineraries are built in Enable** (decided 2026-09-11, design deferred). Both types create a trip and compose its days here — events, transfers, dining, accommodation — rather than handing it to Axus or Travify. This withdraws DEC-10's refusal of an itinerary builder, so the case study's account of what Enable chose not to build must be rewritten. The builder is designed after the rest of this document is settled; until then the itinerary rows below say *deferred* rather than guess.

**What the cut removes.** The colleague's briefing, the ops briefing, the route-role table's four-way split, two sign-in rows, and every `role !== "colleague"` branch in the pages. What it adds: one entitlement switch in the owner's settings.

---

## 2. Journeys, exhaustively

Each journey names its evidence in the journey specs (A–F) and the decision log (DEC-nn). A journey is listed once, under the type that performs it; the owner performs every user journey as well.

### 2.1 The agency user

| # | Journey | Surfaces | Spec |
|---|---|---|---|
| U1 | **Open the day.** Read the brief, see what is owed, leaving and open, and go to the first thing. | Brief → Commissions / Itineraries / Notifications | C §4 |
| U2 | **Ask and check.** Ask a question; read a cited answer; open a source; resolve a conflict from the answer; accept a refusal and take one of its three exits (forward a document, ask the rep firm, flag for review). | Ask → Sources → Resolve sheet / Document sheet | A §4, U1–U5 |
| U3 | **Find a record.** Filter the directory by category and facets, switch grid and table, select, open. | Records → Record | E §3 |
| U23 | **Add a record by hand.** Like raising a ticket: a short form — name, category, city, and whatever she knows — with a check for an existing record of that name and place before it is created. It is **private to her** when created, marked *added by hand*, and nobody else sees it until she shares it: with her team at once, or with the whole agency through the owner's publish queue. The owner's records are private too, and her agency-wide shares go out directly. | Records → New record sheet → Share | schema dedup; D §2 |
| U4 | **Read a record.** See each value's layer, source and age; open provenance; verify a stale field against its source; read the summary of what is unsettled. | Record | E 4a, U3 |
| U5 | **Settle a disagreement.** Choose one of three source values for the commission, give a reason, watch it propagate to the directory, quotes and answers. | Record → Resolve sheet | E U1, DEC-02, DEC-08 |
| U6 | **Change a value with a scope.** Edit a field for just me, my team, or the agency; the agency scope goes to the owner for review; revert my change. | Record → Edit sheet | E 4b, DEC-08 |
| U7 | **Annotate.** Add a note or a notice, private by default; share it with her team at once, or with the whole agency, which waits for the owner to release it. | Record → Note / Notice sheets | E 4b, B §3 |
| U8 | **Respect a Critical notice.** Try to shortlist a blocked property; acknowledge the notice, recorded with name and date; then shortlist. | Record (Verlaine) → Acknowledge dialog | B U2, DEC-18 |
| U9 | **Chase money.** Open a commission; read projected → due → paid with sources; draft the reminder; edit a line; send; see the chase logged. | Commissions → Commission → Reminder tool | C §4, U4 |
| U10 | **Handle money that came in wrong.** Accept a discrepancy with a reason, or open a dispute draft; read a credit-not-refund case. | Commission | C U2, U3 |
| U11 | **Check a trip is ready.** Filter trips by status and window; open the day board; act on a preference conflict (swap or proceed knowingly); add a verified record to a day. | Itineraries | C E1, F U1, DEC-27 |
| U21 | **Build an itinerary.** Start a trip from a traveller or from the trips list, and compose its days in Enable. *Design deferred.* | Traveller / Itineraries → the builder | withdraws DEC-10 |
| U24 | **Add a traveller by hand.** A prospect met before any booking: name, contact, and whatever she already knows, with a check for an existing traveller first. Private to her. Each preference she types carries her name and the date, like any other source. | Travellers → New traveller sheet | F, DEC-28 |
| U12 | **Know a traveller.** Open a profile; read preferences with their sources; confirm a single-source preference; confirm or discard a suggestion; read the checklist and profiles. | Travellers → Traveller | F §4, U3, DEC-28 |
| U13 | **Share a traveller.** Share with a named colleague at Full or Basic, at once; share with the whole agency, which waits for the owner; change or revoke; a colleague requests access to one she cannot see. | Traveller → Share sheet | F E1, DEC-31 |
| U19 | **Retire an advisory she owns.** Close her own personal or team notice when it stops being true, by name and date. The seed's one personal notice is J. Dubois's. Without this, "nothing expires on its own" holds only for the notices the owner happens to own. | Record → Notice; Notifications (review due) | B §4, DEC-03 |
| U18 | **Read client intelligence.** On a record, who booked it last and which travellers prefer or avoid it — each one visible only through that traveller's own sharing, so the chapter is the same for both types and simply holds more for the owner. | Record → Client intelligence | E E4, DEC-27 |
| U14 | **Clear what is waiting.** Triage notifications by state and tag; action, defer, or mark seen; follow one to its subject. | Notifications | B X2, C |
| U15 | **Find and read a document.** Filter the vault by source; open a document; upload one; forward mail to the inbound address. | Knowledge | D §3 (advisor), DEC-14 |
| U22 | **Connect her own source.** Her mailbox or her Drive, through the same four steps: choose the source, authorise at the provider, pick what to index, review. What it indexes is private to her. Reconnect it when it fails. | Connections → Add / Reconnect sheets | D §4, U4, DEC-24 |
| U16 | **Tune the product.** Switch which events raise a notification. | Settings | — |
| U17 | **Sign in and out.** | Sign in, account menu | — |
| U20 | **Find anything by name.** The palette reaches a record, a traveller or a past question from any surface. | ⌘K, anywhere | — |

Twenty-two journeys. U1–U2 and U4–U5 are the demo's spine; U3, U6–U13, U18, U19 and U21 are the daily motion; U14–U17, U20 and U22 are furniture that must still work by the same rules.

**Publishing and retiring are not one journey.** Publishing decides an *audience*: a thing one person wrote becomes the agency's, and its author travels with it. Retiring decides *truth*: a time-bound state is still the case, or it is not, and a named person says so on a dated day. They sit at opposite ends of one lifecycle with the surfacing in between (Journey B), and only the second one is what the case study's rewind exists to demonstrate — the v1 build let the spa notice lapse on a timer while the spa was still closed. A product that publishes well and retires by timer is the failure, not the success.

### 2.2 The agency owner

All of U1–U17 as herself, plus:

| # | Journey | Surfaces | Spec |
|---|---|---|---|
| O1 | **Open the owner's day.** The queue, the candidates, connections needing attention, unmatched payments and the Critical notice come before her own departures. | Brief | C §4, D §3 |
| O2 | **Confirm a candidate record.** Open the next candidate; read each extracted field with where it came from and how cleanly it read; confirm the confirmable; fix one; a held field cannot be confirmed; confirm the record, stamped. | Confirm records → Candidate | D §4, U1, U3, U6, DEC-33 |
| O3 | **Decide a duplicate.** Review the match against the existing record; merge with a reason, or create new. | Candidate → Merge sheet | D U2, DEC-33 |
| O4 | **Key what could not be read.** An unreadable row: key the name by hand, carried as a manual entry. | Candidate | D U3 |
| O5 | **Reject with a reason.** Reject a candidate; the reason is logged. | Candidate → Reject sheet | D §2 |
| O6 | **Release what an advisor shared with the whole agency.** Anything an advisor has shared agency-wide waits here — a note, an advisory, a property, a trip, a document, a traveller profile, a forwarded mail. She reads it, and its source where it has one, and releases it with its author kept, or returns it. | Publish queue → Source sheet | B §4, DEC-20 |
| O7 | **Approve a proposed value.** A user's agency-scope field edit is waiting; approve it in place on the record, or return it with a note. | Notification → Record (proposed field) | E 4b, `scopeWrite` |
| O10 | **Grant or revoke commission visibility.** The one entitlement the product has: whether a user sees money. It is the whole of what the colleague persona used to be. | Settings → Entitlements | `canViewCommissions` |
| O11 | **Connect the agency's sources and keep them healthy.** The shared drive, the intranet, a partner portal, through the same four steps as a user; what they index arrives closed to the administrators. Reconnect a failing one; read last success per source. | Connections → Add / Reconnect sheets | D §4, U4, DEC-24 |
| O12 | **Govern the vault.** Assign access to a document; review what is indexing; see what the assistant may answer from. | Knowledge → Access sheet | D §2, DEC-25 |
| O13 | **Match money nobody claimed.** Match an unmatched payment to a booking with a reason; read the closed ones. | Unmatched payments → Match sheet | C U1 |
| O16 | **Chase a commission on someone else's booking.** Open any overdue commission in the agency, draft the reminder, edit it, send it in her own name; the chase log shows hers beside the advisor's. | Commissions → Commission → Reminder tool | C §4, U4 |
| O14 | **Reconcile.** Read collected against outstanding across the agency; find bookings under projection; read a processor-migration note. | Commissions (Reconciliation, Discrepancies) | C U3, E2 |
| O15 | **Retire an advisory she owns.** Answer the review nudge on an agency notice — still true, or closed, by a named person on a dated day. Every agency notice in the seed is hers; two are past their review at 76 and 90 days open. Nothing expires on a timer. | Record → Notice; Notifications (review due) | B §4, U5, DEC-03 |
Fourteen owner journeys, on top of every journey she performs as a user. Two were removed: O8, setting sharing defaults, when everything became private by default; and O9, opening an advisor's private work under policy, when personal became off limits to the owner. O2–O6 are the demo's third journey; O7 and O10 exist in the schema and the decision log but have no surface yet, which is the first thing this exercise exposes.

---

## 3. The action ladder, per surface, per type

The ladder (VIS-041): **primary** is the one ink pill, at the bottom of the tool that owns it; **secondary** is a grey fill under the content it extends; **tertiary** is a text action in a title row or beside a value. **Absent** names what the surface deliberately does not offer, with the rule that forbids it. A sheet or dialog carries its own filled action (VIS-081) and is listed under the surface that opens it.

Where the two types differ the row says so. Where a row says "same", the owner sees exactly what the user sees.

### Brief `/briefing`

| | Agency user | Agency owner |
|---|---|---|
| For | the advisor, before her inbox | the principal, before the desk's day |
| Primary | **Open the ledger** (Today tool) — money is the first pain named (DEC-12, DEC-13) | **Confirm records** — the queue is what only she can clear |
| Secondary | none on the page | none |
| Tertiary | one per chapter: Open the ledger · All departures · Open triage · See affected records · Records needing verification | the same, plus Open the queue · Open connections · Match payments |
| Absent | any action that changes data: the brief reads, it does not write (C §4 exit criteria); a "dismiss" on a Critical notice (B U2) | same |
| States | quiet day (C E3), sync-pending figures (C U5), one widget failed (C X2) | same |

### Notifications `/notifications`

| | Agency user | Agency owner |
|---|---|---|
| For | someone clearing what waits on her | the same, with the desk's items too |
| Primary | **the item's own action** in the panel: Open connections, Resolve on the record, Acknowledge, Review the match | same; the owner's items add Confirm candidate, Publish, Reconnect |
| Secondary | Mark actioned · Defer · Show everything open (empty state) | same |
| Tertiary | Put it back in the open list · the subject link | same |
| Absent | delete (a decision is recorded, never erased); mark-all-read (each item carries its own decision) | same |
| Tags | Records · Commissions · Traveller | + Ingestion · Connections · Knowledge |

### Ask `/ask`

| | Agency user | Agency owner |
|---|---|---|
| For | an advisor with a client waiting | same |
| Primary | **Ask** (the composer's send) | same |
| Secondary | Resolve… (conflict) · Forward a document to the vault · Retry · Copy or export | same |
| Tertiary | New conversation · Conversations (narrow) · Open the record · Open the rep firm · Dismiss (stays in conflict) · Ask the rep firm · Flag for review · each source name · the scope chip | same |
| Absent | "regenerate" or "try another answer" (an answer is built from sources, not sampled); rating an answer (trust is the contract chip, freshness and corroboration, not a score — A OQ-1) | same |
| Differs | — | a refusal may name that unconfirmed material exists in review, with a link to the candidate (D E1) |

### Records `/records`

| | Agency user | Agency owner |
|---|---|---|
| For | finding a property and checking what is true about it | same |
| Primary | **Open full record** (inspector, once a card is selected); none with nothing selected | same |
| Secondary | **New record** · Ask about this · Clear all filters (empty state) | same |
| Tertiary | Clear all · facet chips · view toggle · category band | same |
| Sheets | New record: **Create record** — after the duplicate check · Share: **Share record** — just me, my team (at once), the whole agency (waits for the owner) | Share: the whole agency goes out directly |
| On create | private to her, marked *added by hand*; shared only when she chooses | same: the owner's new records are private too |
| Absent | creating a record that already exists (the form checks name and place first) | same |

### Record `/records/[id]`

| | Agency user | Agency owner |
|---|---|---|
| For | checking a value, seeing where it came from, settling it if it disagrees | same, and governing the agency layer |
| Primary | **Resolve 3 sources** (Summary tool); on Verlaine **Add to itinerary shortlist**; on a record with nothing unsettled, none | same |
| Secondary | Resolve 3 sources (on the row) · Verify against source · Show all N amenities · Edit (per field, in edit mode) · Change again · Submit for review (notice, agency scope) · Remove my change | same, except a notice at agency scope **Publishes** directly |
| Tertiary | Edit · Add note · Add notice (title row) · canonical beneath · each value's provenance | same |
| Sheets | Resolve: **Store 14% at the agency layer** · Edit field: **Save change** / **Submit for review** · Note: **Save note** · Acknowledge: **Acknowledge (recorded)** | Edit field at agency scope: **Save change** (direct) |
| Absent | editing a canonical value in place (Enable's layer is overlaid, never overwritten — DEC-08); deleting a note (scope regret is a scope change — E U6); dismissing a Critical notice (B U2); approving your own agency-scope proposal | same, minus the last |
| Chapters | canonical · agency overlay · personal · amenities · contacts · promotion · **client intelligence** (the travellers she can see) | the same chapters; client intelligence holds more travellers, and a proposed field carries **Approve** / **Return with a note** |

### Travellers `/travellers`

| | Agency user | Agency owner |
|---|---|---|
| For | finding a traveller | same, across the agency directory |
| Primary | **Open full profile** (inspector, once selected) | same |
| Secondary | **New traveller** · Request access from the owner (a profile she cannot open) | same |
| Tertiary | view toggle | same |
| Sheets | New traveller: **Create traveller** — after a check for an existing traveller with that name and email | same |
| On create | private to her; what she types is attributed to her and dated, never presented as the client's own statement | same |
| Absent | seeing a private traveller's fields (absent, not masked — F U2); a preference entered without a source | same |

### Traveller `/travellers/[id]`

| | Agency user | Agency owner |
|---|---|---|
| For | the owner of the profile; a collaborator at her tier | same |
| Primary | **Share with J. Dubois** / **Change sharing** (Sharing tool, owner only); none for a collaborator | same |
| Secondary | Proceed knowingly (recorded) · Confirm as preference · **Start a trip** (the trip's core link is its traveller) · Request access from the owner · Open the itinerary · Back to travellers | same |
| Tertiary | swap the property · confirm this · Discard · Marchetti cross-link | same |
| Sheets | Share: **Apply sharing** | same |
| Absent | re-sharing by a collaborator (DEC-31); guessing a preference into the profile (DEC-28); deleting a preference (attributed history stays) | same |

### Commissions `/commissions`

| | Agency user | Agency owner |
|---|---|---|
| For | seeing what is owed on her bookings and chasing what is late | seeing what is owed across the agency and what came in wrong |
| Primary | **Open the commission** (inspector) | same |
| Secondary | none | none |
| Tertiary | saved views: Open · Overdue · Paid · Discrepancies · All; search | + Reconciliation; + per-advisor filter |
| Absent | marking a commission paid by hand (actuals arrive read-only from the booking system — DEC-12); editing an amount | same |
| Gate | absent entirely for a user without the commission entitlement (policy, not mask) | — |

### Commission `/commissions/[id]`

| | Agency user | Agency owner |
|---|---|---|
| For | the advisor who owns the booking | the principal, on any agency booking |
| Primary | **Draft a reminder** → **Send** (Reminder tool), on her own bookings | the same, on any booking; sent in her name |
| Secondary | Discard · Accept with reason · Open dispute draft · Back to the ledger | same |
| Tertiary | Open that record (sibling booking) | same |
| Sheets | Accept: **Accept and log** · Dispute: **Open the draft** | same |
| Absent | sending without the draft being read (nothing sends itself — C U4); auto-escalation ("hammer mode" is a one-click *draft*, not a send — DEC-22) | same |

### Itineraries `/itineraries`

| | Agency user | Agency owner |
|---|---|---|
| For | checking a trip is ready to travel, and starting one | same |
| Primary | **Open the trip** (inspector; today an in-page anchor to the day board) — the daily act is checking, not starting | same |
| Secondary | **New trip** · Add Kikunoi Honten to Day 1 · Show every trip (empty state) | same |
| Tertiary | Open the traveller · swap the property · status chips · the 30-day chip · day tabs | same |
| Absent | booking from here | same |
| Deferred | the builder itself — composing days, and every action inside it | same |

### Knowledge `/knowledge`

| | Agency user | Agency owner |
|---|---|---|
| For | finding and reading a document | deciding what the assistant is allowed to answer from, across the agency's own sources |
| Primary | **Open document** (inspector) | **Assign access** (inspector) — on documents from the agency's sources only |
| Secondary | Manage access (her own uploads and her own sources) · Review (indexing) · Open connections | Review · Open connections · Manage access |
| Tertiary | Upload · New connection · Open review · source tabs | same |
| Sheets | — | Access: **Apply and log** |
| Absent | deleting a document (it is withdrawn from access, and the withdrawal is logged); widening access on a document she did not upload (DEC-25) | the same, and **changing who sees an advisor's own document** — one she uploaded or indexed from her own mailbox or Drive. That is the personal layer: it belongs to the advisor even inside an agency, and only she shares it |

### Settings `/settings`

| | Agency user | Agency owner |
|---|---|---|
| For | changing how the product behaves for her | the same, and how it behaves for the agency |
| Primary | none — a switch *is* the act | none |
| Secondary | Open connections | same |
| Tertiary | none | none |
| Chapters | Profile · Notifications | + Who can see money, per user (O10) |
| Absent | changing name, role or address (an administrator's act, from the directory) | changing her own role |

### Connections `/connections`

| | Agency user | Agency owner |
|---|---|---|
| For | connecting her own mailbox or Drive, so her documents can answer her | the same, and connecting the agency's sources and keeping them healthy |
| Primary | **Reconnect** the first failing source she connected; with none failing, **Connect a source** | **Reconnect partner portal** — the first failing source, hers or the agency's |
| Secondary | Reconnect… (on the row) · Close | same |
| Tertiary | Disconnect · Use another account (in the add flow) | same |
| Sheets | Add: **Continue** / **Connect source** / **Done**, with Back, Cancel and the provider handoff as secondary · Reconnect: **Request re-authorisation** | same |
| What arrives | closed to her; opened to others document by document in the vault | closed to the administrators; opened document by document in the vault |
| Absent | a "who can read it" step (connecting indexes, it never shares — the add flow's own policy); entering a password inside the product (the provider's flow does it — D §4); deleting a connection (it is disconnected, and confirmed records keep their provenance — D X2); seeing another advisor's personal sources | the same: a user's personal source is hers, and there is no way into it |

### Confirm records `/admin/review` — owner only

| | Agency owner |
|---|---|
| For | deciding which extracted candidates become records |
| Primary | **Open for review** (Next up tool, the first unconfirmed candidate) |
| Secondary | none |
| Tertiary | each row opens its candidate |
| Absent | batch-confirm from the list (a record is confirmed field by field — D §2; batch is an E3 edge for high-confidence fields only, inside the candidate) |

### Candidate `/admin/review/[id]` — owner only

| | Agency owner |
|---|---|
| For | confirming a candidate field by field, or refusing it |
| Primary | **Confirm record — stamped M. Keller, today**; for a duplicate **Review the match**; for an unreadable row **Key the name by hand** |
| Secondary | Confirm (per confirmable row) · Enter value (held row) · Create new record · Show the source row · Save (inline fix) |
| Tertiary | Fix (per row) · Reject — reason logged · Cancel |
| Sheets | Merge: **Merge into the existing record — reason logged** · Reject: **Reject** (destructive) · Source: Close |
| Absent | Confirm on a held row (D U3: a held field has no confirm control); confirming a converted figure with no source currency (D U7); confirming boilerplate as content (D U6) |

### Publish queue `/admin/publish` — owner only

| | Agency owner |
|---|---|
| For | deciding what the whole agency sees: releasing anything an advisor has shared agency-wide |
| Primary | **Publish to the whole agency** (Queue tool, the next publishable item) |
| Secondary | Publish (on the row) · Review source · **Return with a note** · Close |
| Tertiary | none |
| Absent | publishing a "needs reading" item before its source is opened; publishing without the owner preserved (DEC-20: source, timestamp, owner travel with the advisory); **approving a field's value** — a note is commentary and is additive, a value is what the product answers with, and the two do not share a queue |

### Unmatched payments `/ops/resolution` — owner only

| | Agency owner |
|---|---|
| For | matching a payment nobody claimed to a booking, with a reason |
| Primary | **Match this payment** (To match tool, the first open payment) |
| Secondary | Match… (on the row) · Cancel |
| Tertiary | none |
| Sheets | Match: **Confirm match (attributed)** — requires a candidate and a reason |
| Absent | writing off a payment (it stays open until a person closes it with a reason — C U1); editing the booking (nothing on the booking is edited) |

### Sign in `/signin`

| | Both |
|---|---|
| Primary | **Sign in** |
| Secondary | Use single sign-on |
| Tertiary | Forgotten? · the demo account rows (selected inverts) |
| Absent | creating an account (accounts come from the agency directory) |

---

## 4. What is still open

Decided during the walkthrough of 2026-09-11 and not yet on screen, in the order they block other work.

1. **The itinerary builder.** Decided: both types compose a trip's days in Enable. Design deferred until everything else here is settled. It withdraws DEC-10, so the case study's account of what Enable chose not to build must be rewritten.
2. **The publish queue receives six kinds of thing and draws two.** Today it shows an advisory and a forwarded mail. Under the one sharing rule it also receives notes, properties, trips, documents and traveller profiles shared with the whole agency, each needing its own row, a way to read what is being released, and **Return with a note**.
3. **Two owner acts have no screen.** Approving a user's proposed value (O7) leaves a chip on a field that nothing points her to; it should arrive as a notification that opens the record at that field. Who can see money, per user (O10), is in the schema and nowhere on screen; it belongs in her settings.
4. **Asking for access goes nowhere.** A user who cannot open a traveller can ask for access, and the request is recorded and received by nobody. It should reach the traveller's advisor — not the owner, who has no way in either — as a notification.
5. **The generic record's Evidence panel has no action.** Honest today; a candidate for a scope decision in Pass 2.
6. **Two withdrawn decisions change the case study.** DEC-10 (no itinerary builder) and DEC-29 (policy access to personal records) are both withdrawn. The case study currently narrates the first as a refusal; both need rewriting in Pass 3.

Holding, and worth saying in a review:

- **The dock tells the type at a glance.** Seven tiles or ten; the whole permission story, visible without a slide.
- **The colleague persona was two switches.** One survives, who can see money, as a per-user setting. The other, which travellers she can see, was never a role: it is what sharing already does.
- **The personal layer is the advisor's, full stop.** The owner cannot open it, widen it, re-scope it or share it. Everything created starts there, and only its maker moves it.

## 5. Implementation deltas (not executed; for the build after review)

**Roles**
- `Persona` → `"user" | "owner"`; `people`, `personas`, `roleLabel`, `widgetsFor`, `notificationsFor`, `dockTiles` and `ROUTE_ROLES` (shell and contracts) collapse to two. Sign-in keeps two accounts: R. Devane (user) and M. Keller (owner).
- `canViewCommissions(role)` → `canViewCommissions(user)`, reading a per-user switch defaulted on; the owner's settings gain the chapter that writes it.
- `/admin/connections` → `/connections`, open to both. A user's list holds the sources she connected; the owner's adds the agency's. The add flow keeps its four steps and no scope step; its header comment is rewritten to say the index arrives closed to whoever connected it.

**Sharing**
- Every create action defaults to private: record, trip, note, notice, upload, forwarded email, traveller. `adminPolicy.defaults` is deleted, with the *Sharing defaults* chapter on `/admin/publish`.
- One share control everywhere: just me · a named colleague or my team (at once) · the whole agency (to the publish queue). `scopeWrite` becomes: owner → direct at every scope; user → direct below agency, queue at agency.
- `adminPolicy.breakGlass` and its two logged openings are deleted, with the *Admin access to personal records* chapter. Nothing lets the owner open an advisor's private work.
- `publishQueue` takes an item kind (note, notice, record, trip, document, traveller, forwarded mail), a per-kind preview, and **Return with a note** beside **Publish**.

**New acts**
- **New record** on `/records` and **New traveller** on `/travellers`: a short form, a duplicate check (name and place; name and email), private on create, then the share control.
- **New trip** on `/itineraries` and **Start a trip** on the traveller profile, both opening the builder. The builder is deferred.
- **Retire** on a notice, for whoever owns it, answering the review nudge.
- The owner's **Draft a reminder** works on any agency commission, sent in her name, logged beside the advisor's.
- A proposed agency-scope value notifies the owner and opens the record at that field with **Approve** and **Return with a note**. An access request notifies the traveller's advisor.

**Harness and demo**
- `contracts.mjs`: one contract per surface with `for`, `primary` and `why`, `secondary`, `tertiary`, `absent` and `states` per type, straight from §3; tier 2 checks the ladder renders as declared.
- The demo script re-keyed to two accounts: keys 1–7 as R. Devane, key 8 as M. Keller.

**Already done** (2026-09-12)
- Acuity removed from the product and the live specs (commit 2970df1).
- The spine: `Persona` is `user | owner`; two sign-ins; the dock is seven tiles or ten; `/connections` shared, each source scoped; the store carries the money entitlement, hand-made records and travellers, the release decision, retiring, access requests, document shares, approving or returning a proposed value; signing out keeps the day (commit 5ccba07).
- Every surface: New record and New traveller (private on create, duplicate check, the share control with the wait-for-owner wording); the publish queue reading every kind from the store with Publish and Return with a note; Approve / Return on a proposed value, reached from the owner's inbox; Retire on a notice its owner holds; the owner chasing any commission in her name; Assign access confined to agency documents; the money switch in the owner's settings; one inbox that includes what happened this session; totals that count only what the signed-in person can reach.
- Harness: contracts declare a job for both types on every shared surface (24 screen/type pairs); `evals/flows-two-roles.mjs` walks the four cross-account handoffs.

**Not done, by decision**
- New trip / Start a trip: both open the itinerary builder, which is deferred, so neither is drawn.
