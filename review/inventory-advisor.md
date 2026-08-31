# Advisor + colleague surfaces — verified inventory

**Scope:** `/briefing` · `/ask` · `/records` · `/records/[id]` · `/travellers` · `/travellers/[id]` · `/itineraries` · `/knowledge` · `/commissions` · `/commissions/[id]` · `/notifications`. Roles `advisor` (R. Devane) and `colleague` (J. Dubois) only.

**Method:** every state below was reached in a running browser against `http://localhost:3000` and read back from the live DOM. Where the spec and the build disagree, the build is recorded as the fact and the disagreement is listed in §8. No evaluation — description only.

**Seeded day:** Friday 28 August. Sync stamp 12:04. Nothing is live; all traces are authored.

---

## 1. How to reach any state

### 1.1 Session
The app has no sign-in you need to complete. Set the session object and reload:

```js
sessionStorage.setItem('enable-demo-state', JSON.stringify({
  signedIn:true, role:'advisor', world:'v2', narration:false,
  conflictResolved:false, reminder:'idle', spaNoticeClosed:false, verlaineAcked:false,
  candidateConfirmed:false, paymentMatched:false, shareTier:'private',
  requestFiled:false, noteSaved:false, prefConfirmed:false, askScope:null, notices:{}
}))
```

`sessionStorage` is per-tab. The store rewrites it on every state change, so edit → reload, never edit → click.

### 1.2 Store flags that change advisor-facing screens

| Flag | Values | Screens it changes | Reachable by clicking? |
|---|---|---|---|
| `role` | `advisor` \| `colleague` | all eleven | no — sign-in only (`/signin`) |
| `world` | `v2` \| `v1` | briefing, records/[id], ask (spa thread) | yes — press `v` (invisible presenter key) |
| `narration` | bool | every screen (dashed presenter notes) | yes — press `n` |
| `conflictResolved` | bool | ask (leandre-rate), records/maison-leandre | yes — resolve sheet, "Keep this value" |
| `reminder` | `idle`/`draft`/`sent` | commissions/vo | yes |
| `spaNoticeClosed` | bool | briefing notices, records/maison-leandre, ask spa thread | **no UI dispatches it** |
| `verlaineAcked` | bool | records/hotel-verlaine | yes |
| `shareTier` | `private`/`full`/`basic` | travellers, travellers/[id], briefing departures (colleague) | yes — profile → Sharing |
| `noteSaved` | bool | records/maison-leandre personal group | yes |
| `prefConfirmed` | bool | travellers/s-marchetti preferences + suggestions | yes |
| `notices{}` | per-id `new`/`seen`/`actioned`/`deferred` | notifications | yes |
| `askScope` | string \| null | **nothing** — see §8 | set, never rendered |
| `candidateConfirmed` | bool | records list/detail visibility of Hotel Sereno Kyoto | only from the lead's `/admin/review/sereno` |
| `requestFiled` | bool | **nothing** — never dispatched | no |
| `paymentMatched` | bool | ops only, out of scope | — |

### 1.3 Query parameters (the only URL-addressable states)

| URL | Effect |
|---|---|
| `/ask?state=refusal` | opens the "third night free" refusal thread |
| `/ask?state=stale` | opens the pool-hours stale-answer thread |
| `/ask?state=loading` | opens the retrieval-timeout thread |
| `/records?evidence=stale\|incentive\|verified\|disagree\|unconfirmed` | pre-applies the Evidence facet |
| `/records/maison-leandre?compose=notice` | opens the Add-notice sheet on arrival |
| `/commissions?state=open\|overdue\|paid\|discrepancy\|all` | pre-applies the ledger filter (default `open`) |
| `/itineraries?window=30` | pre-applies the 30-day departure window |
| `/notifications?tag=Records\|Commissions\|Ingestion\|Traveller\|Connections\|Knowledge` | pre-applies the tag |
| `/notices` | 301 → `/notifications?tag=Records` |
| `/` | 301 → `/briefing` |

### 1.4 Presenter keys (render nothing until pressed; ignored while typing or while a dialog is open)
`1` morning · `2` `/commissions/vo` · `3` `/records/maison-leandre` · `4` `/ask` scoped · `5` `/ask?state=refusal` · `6` v1 + record · `7` `/travellers/s-marchetti` · `8` lead + admin review · `0` reset · `n` narration · `v` world toggle.

### 1.5 Persistent chrome
- **Frame bar** (above the panel): back · forward · breadcrumb. The breadcrumb resolves dynamic segments to entity names.
- **Dock** (floating, bottom): advisor and colleague get the same seven tiles — Briefing, Notifications, Ask, Records, Travellers, Itineraries, Knowledge. `⌘1…⌘7` jump. Notifications carries a red count badge of items still `new` for the role.
- **⌘K / "Search — ⌘K"**: a canned palette of five destinations (Maison Léandre, Records directory, S. Marchetti, Notifications, "Ask a question…"). No index, no free text search.
- **Utility cluster**: Search, "Synced 12:04", Account.
- `PageHeader` accepts `back` and `crumb` props and **discards both** (`void back; void crumb;` in `src/components/layouts.tsx`). Page-level crumbs never render.

### 1.6 Loading states
There are none. Every `Suspense` boundary uses `fallback={null}`; the shell renders an empty `<div>` until the store settles; `components/ui/skeleton.tsx` is imported nowhere. Treat "loading" as absent across all eleven routes.

---

## 2. Journey C — the working day

### 2.1 `/briefing` — Journey C EP1 (DEC-13, SIG-32)
**Before:** `/` or sign-in; also the reset key. **After:** every widget footer is a link into the surface it summarises.
**For:** the morning's state on one screen, built from the signed-in role.

Advisor widgets (5): Commissions · Departures · Notices · Expiring incentives · Records verified this quarter. Colleague widgets (4): the same minus Expiring incentives.

| # | State | How to reach | What renders |
|---|---|---|---|
| C-1 | Advisor, v2, default | `/briefing` as advisor | EUR 12,532 outstanding / 9 commissions · "3 overdue" chip · 4 commission rows (Aurelia chased 54d, Cap d'Estel 28d, Casa Marena 19d, Villa Ortensia 12d) · 3 departures · 5 notices, two carrying "review due" · 3 incentives · 41/128 verified |
| C-2 | Advisor, v1 | press `v`, or set `world:'v1'` | Notices widget takes a red "v1 build" chip; the Maison Léandre spa notice is **absent**; "review due" chips disappear; with narration on, the failure is narrated in-place |
| C-3 | Narration on | press `n` | dashed presenter note under the page title and inside the v1 notices widget |
| C-4 | Spa notice closed | `spaNoticeClosed:true` | spa row gone from Notices; no closure record, no reason, no trace |
| C-5 | Colleague | `role:'colleague'` | Commissions widget renders policy prose only ("absent from this briefing by policy, not hidden behind a mask") and **loses its footer link**; Expiring incentives widget absent; departures reduced to R. & M. Osei |
| C-6 | Colleague + share Full/Basic | `role:'colleague'`, `shareTier:'full'` | S. Marchetti's Kyoto departure joins the departures list |

**Content:** real-looking and load-bearing. Figures are computed from `commissions[]`, not from `briefing.headline` (the seed's `outstanding: 2512` is dead). No schematic badges.
**Not reachable:** the "quiet day" empty briefing (E3); the departures-empty state (`No departures for travellers shared with you`) — R. & M. Osei is shared to J. Dubois in seed data regardless of `shareTier`, so the list is never empty; DEC-13's action-items widget (declared out of scope in the spec); any per-widget failure/retry (X2); any surface for the access request the traveller page says "appears on their briefing as a request".

### 2.2 `/commissions` — Journey C, the ledger
**Before:** briefing Commissions widget ("Open the ledger" → `?state=open`); dock. **After:** `/commissions/[id]`.
**For:** every commission with its state, ageing and provenance.

| # | State | How to reach | What renders |
|---|---|---|---|
| C-7 | Open (default) | `/commissions` or `?state=open` | 9 of 14 rows; summary strip EUR 12,532 / 3 overdue / EUR 410 collected; sorted overdue → chased → due |
| C-8 | Overdue / Paid / All | segmented control, or `?state=overdue\|paid\|all` | filtered table; "credit" and "under projection" row chips persist |
| C-9 | Discrepancies | `?state=discrepancy` | one row — Palácio das Amoreiras, `under projection` |
| C-10 | No match | type a nonsense string in the filter box | "No commissions match this view." (table-body row, no CTA) |
| C-11 | Inspector panel | click any row | timeline summary, rate provenance, incentive chip, discrepancy banner, credit banner, "Open the full commission" |
| C-12 | Colleague | `role:'colleague'` | whole surface replaced: "this ledger is absent by policy… the rows are not fetched, so there is no figure to read past" |

**Content:** real. 14 seeded commissions with booking refs, travellers, rate provenance.

### 2.3 `/commissions/[id]` — Journey C happy path + U2/U3
**Before:** ledger row → "Open the full commission"; briefing widget row; notification `n-overdue`. **After:** back to the ledger.
**For:** the projected → due → paid timeline, the chase log, and the send-gate.

Only `vo` (Villa Ortensia) is the "rich" record: it alone carries the reminder machine and the sibling-discrepancy block.

| # | State | How to reach | What renders |
|---|---|---|---|
| C-13 | `vo` idle | `/commissions/vo` | "overdue 12d"; timeline projected EUR 1,240 @12% + "+3% active bonus — adds to base"; due 18 Jul flagged; unpaid; Chase log "none yet"; **Draft a reminder** |
| C-14 | `vo` draft | click Draft a reminder | editable seeded letter in a monospace textarea; Send · Discard; "Sends once, on this click only. There is no auto-send." |
| C-15 | `vo` sent | click Send | title chip → `chased`; Chase log → "chased today by R. Devane · logged"; confirm banner |
| C-16 | Accept-with-reason sheet | `vo` → Accept with reason | reason field **required**; the accept button is disabled until it has text |
| C-17 | Accepted | fill reason → Accept | "Accepted with reason — logged, attributed to R. Devane." replaces both CTAs |
| C-18 | Dispute draft sheet | `vo` → Open dispute draft | **SCHEMATIC** badge; a read-only drafted message; "Draft only in this build" |
| C-19 | Discrepancy record | `/commissions/pa` | paid 09 Jul + its own "Projected against actual" block, EUR 1,120 vs EUR 1,008, both provenances |
| C-20 | Credit-not-refund | `/commissions/isc` | due "cancelled"; Critical banner "Resolved as credit, not refund" |
| C-21 | Pre-chased | `/commissions/au` | "chased · 54d open"; chase log "chased 14 Aug by R. Devane · no reply yet" |
| C-22 | Plain paid | `/commissions/kh` | timeline all three marks done; no reminder section |
| C-23 | Not on file | `/commissions/zzz` | "No commission record with this reference." + back link |
| C-24 | Colleague | `role:'colleague'` on any id | "commission records are absent by policy… nothing on this page to read past" |

**Content:** real, except the dispute draft (schematic).
**Not reachable:** the commission calendar (Journey C EP3); the unconfirmed-cancellation alert on the commission itself (E1 lives only as notification `n-cancel`); the booking-system-unreachable degraded ledger (X1); any second record with the reminder machine.

### 2.4 `/itineraries` — Journey C step 5, Journey F U1 surface
**Before:** briefing Departures widget ("All departures" → `?window=30`); dock; traveller profile "Open the itinerary". **After:** `/records/[id]` via linked products, `/travellers/[id]` via "Open the traveller".
**For:** every trip, with the seeded day board beneath it.

| # | State | How to reach | What renders |
|---|---|---|---|
| C-25 | All trips | `/itineraries` | 8 trips; status chips All/Inbound/Planning/Booked/Traveled with counts; sorted by days-to-departure |
| C-26 | 30-day window | `?window=30`, or the "Departing within 30 days" button | 3 trips; a removable "Window" chip |
| C-27 | Status filter | click a status chip | e.g. Planning → 3 |
| C-28 | Empty | click Planning, then apply the 30-day window | "No trips under this filter." + "Show every trip" |
| C-29 | Trip inspector | click a row | dates/nights/destinations, checklist progress, linked product tiles, "Open the traveller" |
| C-30 | Day board | always present below the ledger | **SCHEMATIC**; Day 1 built, Days 2–3 disabled; 3 events with type marks; Meridian + "+3% through 30 Sep" chips; five-type legend |
| C-31 | Add from records | click "Add to Day 1" on Kikunoi Honten | → "added to Day 1 · draft" chip. The search box is `readOnly` with the value "kaiseki" |
| C-32 | Preference conflict | always present | Important banner, "Hôtel Verlaine — Day 3 idea", `preference conflict` chip, "swap the property" → the traveller; "A warning, not a block" |
| C-33 | Colleague | `role:'colleague'` | the "+3%" incentive chip on the day board is **absent**; everything else identical, including all 8 trips |

**Content:** trip ledger is real; the day board is explicitly schematic (one day, one client, a frozen search).
**Not reachable:** any second day; any itinerary route of its own (`/itineraries/[id]` does not exist); a proposal/export; a Critical-notice block at add-to-itinerary time (that gate lives only on `/records/hotel-verlaine`).

---

## 3. Journey A — the trusted answer (`/ask`)

**Before:** dock (EP1); `⌘K → "Ask a question…"` (EP2, partial); "Ask about this" on any record (EP3 — navigates to `/ask` and sets `askScope`, which renders nowhere); presenter keys 4/5. **After:** "Open the record" links back into Journey E; the resolve sheet writes the agency-layer resolution that Journey E also shows.
**For:** a conversation product — a recent-conversations column, a composer, one open thread, and a sources rail.

Layout: at ≥1280 px, list | thread | rail. At 1024–1279 px the rail drops beneath the thread. Below 1024 px the list becomes a left sheet behind a "Conversations" button and the landing shows its own four-item recent list.

| # | State | How to reach | What renders |
|---|---|---|---|
| A-1 | Landing (no thread) | `/ask`, or "New conversation" | "What do you need to know?", the large composer, the contract line; no rail, no second composer |
| A-2 | Conflict answer | click "Maison Léandre — Atelier rate" | "Sources disagree — nothing assumed."; three sourced values 12% / 10% / 14% with status chips; **Resolve… · Open the record · Dismiss (stays in conflict)**; rail shows the 3-stage trace + 3 sources incl. the quoted extract |
| A-3 | Dismissed | click Dismiss | answer replaced by an Important banner: "The commission field stays in conflict. Nothing is assumed." + Resolve… |
| A-4 | Resolve sheet | click Resolve… | three source cards with a "3 of 4 sources agree" meter; **only Partner portal's "Keep this value" is enabled**, the other two are disabled; a "Where this value goes" impact panel (directory / quotes / chat, all 12%); attribution line. **No reason field** |
| A-5 | Resolved answer | Keep this value, or `conflictResolved:true` | 3 cited claims; footer "3 sources · oldest 12 Mar 2026 · corroborated by 3" + `answer contract met`; "Cites the resolution stored today at the agency layer"; rail adds the agency LayerBadge line |
| A-6 | Refusal | `/ask?state=refusal` | "I do not know."; contract checklist Sources ✓ / Freshness ✗ / Corroboration ✗; the 12-month policy line; three recovery CTAs; rail replaced by "Held back" + "Sources found" (both dashed, aged 14 and 15 months) |
| A-7 | Recovery — forward | click "Forward a document to the vault" | "Watching parisdesk@inbound.enable… — a verified document reopens this answer." |
| A-8 | Recovery — rep | click "Ask the rep firm" | "Draft opened to Corvin & Wells — nothing sends without review." |
| A-9 | Recovery — flag | click "Flag for review" | "Flagged — appears in Confirm new records." (the three are mutually exclusive; one banner at a time) |
| A-10 | Stale answer | `/ask?state=stale` | pool hours + "last verified 96 days ago"; `stale — inherits the field's warning` |
| A-11 | Retrieval timeout | `/ask?state=loading` | spinner "Building the answer"; trace stages 1–2 done, stage 3 "pending"; Important banner "Retrieval timed out at the third stage… no partial answer is rendered" + Retry; rail mirrors the partial trace |
| A-12 | Notice-carrying answer (v2) | click "Is the spa at Maison Léandre open?" | Important banner "Active notice: Spa closed to 15 Sep."; the answer states the closure; `answer carries the notice` |
| A-13 | The v1 failure | press `v`, then open the same thread | "The spa is open, 07:00–21:00 daily." + `answer contract met`. With narration on: "This answer is confidently wrong, and nothing on the screen says so." |
| A-14 | v2 with the notice closed | `spaNoticeClosed:true` | the same clean v1-style answer, with no narration note |
| A-15 | Plain answer | click "Who represents Maison Léandre?" | one cited line, `answer contract met`, "Open the rep firm" |
| A-16 | Schematic thread | click "Kaiseki near Gion" or "Patagonia — mobility-friendly cabins" | **SCHEMATIC** badge on both the bubble and the rail: "Its transcript is not reconstructed in this build" |
| A-17 | Permission-absent | `role:'colleague'`, open the rate thread | the rate is refused ("Commission terms sit with the owning advisor… no partial figure to show"), the breakfast half is deferred to the record, and the **Sources panel is omitted entirely** — trace and Copy/export remain |
| A-18 | Narrow layout | width < 1024 px | conversations move into a left sheet; the rail moves under the thread |

**Content:** four threads are fully built (rate, spa, rep, stale) plus refusal and timeout; two of the six saved conversations are declared schematic. "Copy and export" is a **SCHEMATIC** dropdown — both items are inert.

---

## 4. Journey E — the record

### 4.1 `/records` — directory
**Before:** dock; ⌘K; briefing "See affected records" (`?evidence=incentive`) and "Records needing verification" (`?evidence=stale`); notification subjects. **After:** the inspector, then `/records/[id]`, or "Ask about this" → `/ask`.
**For:** the catalogue door into the same model the chat answers from.

| # | State | How to reach | What renders |
|---|---|---|---|
| E-1 | Grid, Hotel (default) | `/records` | 17 hotel cards (Sereno Kyoto hidden from advisors); generated abstract plates, tier + programme chips, evidence mark, "updated" date; header counts are seed constants (209/41/28/34) |
| E-2 | Table | View toggle → Table | Record · Tier · Programme · Evidence · Rate |
| E-3 | Other categories | Cruise / DMC / Rep firm tabs | e.g. Rep firm → 3 records, "3 of 3 … 34 in the full directory" |
| E-4 | Stale view | `?evidence=stale` | 4 records; a removable "Evidence Stale 90d+" chip + "Clear all" |
| E-5 | Incentive view | `?evidence=incentive` | 1 record (Villa Ortensia) |
| E-6 | Empty | `?evidence=unconfirmed` as advisor | "No records match these filters. / Nothing is hidden by accident — remove a filter to widen the set." + Clear all filters |
| E-7 | Inspector — Maison Léandre | click the card | plate, Ask about this / Open full record, the Important spa notice, and a compressed three-layer summary (2 fields per layer) |
| E-8 | Inspector — any other record | click any other card | blurb + Region/Rooms/Programme/Consortia/Rep firm/Rate list, freshness line |
| E-9 | Colleague | `role:'colleague'` | Rate column and per-card rate absent; Commission absent from the Maison Léandre layer summary; R. Devane's private note absent |
| E-10 | Bottom sheet | width < 1024 px | the inspector becomes a bottom sheet; no horizontal page scroll at 375 px |

Six facets: Region · Tier · Programme · Status · Consortia · Evidence. **No text search box**, no destination or facility/amenity facet, no filter persistence between visits.

### 4.2 `/records/maison-leandre` — the full anatomy
**Before:** directory inspector; briefing notice row; notification `n-conflict`; ask "Open the record"; presenter key 3. **After:** `/ask` (scoped, invisibly), the resolve sheet, the note and notice composers.
**For:** the layered model, inspectable field by field.

Three sections — Enable canonical (Address, Rooms, Pool hours, Amenities copy) · Agency overlay (Commission, Negotiated perk, Programme, Rep firm) · Personal (My note, Team note) — plus a rail: Amenities (facility freeform flagged template copy, client amenities with slugs, agent terms), Contacts + rep firm + "Booked last by J. Dubois · May 2026", Active promotion.

| # | State | How to reach | What renders |
|---|---|---|---|
| E-11 | Default, v2 | `/records/maison-leandre` | Important spa banner + `Still true? review due · 76d open`; all four field states visible at once |
| E-12 | Conflict field | default | three bordered values (12% portal 12 Mar · 10% platform 28 Feb · 14% manual 03 Apr), `3 sources disagree`, **Resolve 3 sources** |
| E-13 | Resolve sheet | click Resolve 3 sources | same anatomy as A-4 **plus** a "The other fields" block (Address/Rooms canonical, Programme/Rep firm agency) and "Only commission is in dispute." Still no reason field |
| E-14 | Resolved | Keep this value | "12% · `resolved` · agency layer · by R. Devane today · both sources reachable" |
| E-15 | Stale field | default | Pool hours + `96d unverified` + **Verify against source** |
| E-16 | Verified | click Verify against source | `verified today · R. Devane`; the freshness stamp flips to "verified today" (row-local, not persisted) |
| E-17 | Template field | default | Amenities copy in italics + `template copy — needs editorial` + "Excluded from answer corroboration." |
| E-18 | Overlay over canonical | default | Negotiated perk + `agency overlay`, with "canonical beneath · Daily breakfast for two" carrying its own popover |
| E-19 | Provenance popover | click any field value | What / Where / When + "open document (permission holds)" |
| E-20 | Note composer | Add note… | textarea + a required three-way scope radio (Private preselected / Team · Paris desk / Agency-wide · Every advisor) |
| E-21 | Note saved | Save note | confirm banner "Note saved — private to R. Devane · attributed and dated." and a new row in the Personal group with `Saved just now · private` |
| E-22 | Notice composer | Add notice…, or `?compose=notice` | **SCHEMATIC**. Severity and Scope are static chips, not controls; "Submit for review" is inert |
| E-23 | v1 world | press `v` | the spa banner is replaced by "The spa notice auto-expired on 1 Aug — the card looks clean, the spa is still closed." |
| E-24 | Notice closed | `spaNoticeClosed:true` | no banner at all |
| E-25 | Colleague | `role:'colleague'` | Commission field, R. Devane's private note, the Agent terms block and the Active promotion card are all **absent, not masked**. Add note… and Add notice… remain |

### 4.3 `/records/hotel-verlaine` — the Critical gate (Journey B U2)
**Before:** notification `n-verlaine`; briefing notices row; directory. **After:** `/ask`.

| # | State | How to reach | What renders |
|---|---|---|---|
| E-26 | Unacknowledged | `/records/hotel-verlaine` | Critical banner + `acknowledgment required`; "Use in itineraries" explains the gate; **Add to itinerary shortlist** |
| E-27 | Dialog | click Add to itinerary shortlist | "Closing this dialog does not unblock the property. The acknowledgment is recorded with a name and a date."; Close vs "Acknowledge (recorded: R. Devane, today)" |
| E-28 | Acknowledged | click Acknowledge | banner chip → `acknowledged — R. Devane, today`; the shortlist button disables and `on the shortlist` appears |
| E-29 | Dismiss-is-not-acknowledgment | click Close in the dialog | nothing changes; the property stays blocked |

### 4.4 `/records/[id]` — every other record
| # | State | How to reach | What renders |
|---|---|---|---|
| E-30 | Standard | `/records/cap-destel` | The record · Programmes and consortia · Open notices · Evidence · Representation · Active promotion (money only) |
| E-31 | Stale | `/records/riad-anouar` | `6 months old` + "It still answers — with its date and a freshness warning attached." |
| E-32 | No memberships | `/records/villa-anzeleta` | "No programme or consortium membership on file. Nothing is inferred from the category." |
| E-33 | Rep firm | `/records/corvin-wells` | a plain record; **no represented-properties list, no named contacts** |
| E-34 | Candidate, advisor | `/records/sereno-kyoto` | "Awaiting confirmation… It does not answer questions and it is not offered to a client until a reviewer has been through it field by field." |
| E-35 | Unknown id | `/records/does-not-exist` | "Not in the directory. No record carries this id. A missing property can be requested from the directory — the extraction pipeline creates a candidate for review." The request is prose; there is no control |

**Content:** all real, drawn from `products[]`. No schematic badge on any record except the notice composer.

---

## 5. Journey F — the traveller

### 5.1 `/travellers`
**Before:** dock; ⌘K (S. Marchetti). **After:** the inspector → `/travellers/[id]`.

| # | State | How to reach | What renders |
|---|---|---|---|
| F-1 | Advisor grid | `/travellers` | 6 cards, "your clients" chip; per card: initials, next trip + days, profiles/preferences counts, Acuity score (or nothing), share chip |
| F-2 | Table | View toggle | one row per traveller |
| F-3 | Inspector | click a card | next trip / departs in / profiles / preferences / Acuity, share chip, "Open full profile" |
| F-4 | Colleague, Full | `role:'colleague'`, `shareTier:'full'` | "shared with you" chip; **2** travellers (S. Marchetti + R. & M. Osei) |
| F-5 | Colleague, Basic | `shareTier:'basic'` | same 2, each reduced to "Contact on file. Preferences, journeys and spend are absent at this tier — not masked."; the count line appends "· name and contact only at Collaborator Basic" |
| F-6 | Colleague, private | `shareTier:'private'` | empty page: "No travellers shared with you… What is not shared is absent, not locked — there is nothing here to unlock." + **Request access from the owner** |
| F-7 | Request filed | click Request access | "Request sent to R. Devane — it appears on their briefing as a request." (nothing appears on any briefing) |

Note: a single global `shareTier` governs every traveller. At `basic` R. & M. Osei also degrades; at `private` the Osei card disappears although the seed marks it shared to J. Dubois.

### 5.2 `/travellers/s-marchetti` — the full anatomy
**Before:** the list; the itinerary preference banner; notification `n-pref`; presenter key 7. **After:** `/itineraries` ("swap the property").

Sections: departure checklist (6/9, three pending) · profile-section tabs · shortlist-conflict banner · Preferences (6) · Suggestions (1) · Travel profiles (Leisure primary / Business / Celebration) · Trips (2) · Financials. Rail: Where these come from (9 signals by source) · Visibility · "One source is a note" · Acuity.

| # | State | How to reach | What renders |
|---|---|---|---|
| F-8 | Default, private | `/travellers/s-marchetti` | "departs in 12 days" chip; **Sharing** action; Visibility "Private to you." |
| F-9 | Profile tabs | always | Overview / Journeys / **Intelligence** / Communications / Financials — only Intelligence is enabled, the other four are `disabled`, and the row carries a **SCHEMATIC** badge |
| F-10 | Preference states | always | 3 sources (green) · 2 sources (green) · 1 source (hollow) · `confirm this` (amber, one preference only) — each with source label, date and a `confidence 0.NN` figure |
| F-11 | Preference confirmed | click "confirm this", or `prefConfirmed:true` | "confirmed · R. Devane · today" — **and the Suggestions block resolves at the same time** (one flag drives both) |
| F-12 | Suggestion confirmed | "Confirm as preference" | the suggestion moves into Preferences with "confirmed from suggestion · today"; the Suggestions block reads "Confirmed and moved into Preferences" |
| F-13 | Suggestion discarded | Discard | "Suggestion discarded — recorded, and the model learns nothing was true here." |
| F-14 | Shortlist conflict | always | Important banner citing the preference and its three sources, "swap the property" link, **Proceed knowingly (recorded)** |
| F-15 | Proceeded | click Proceed knowingly | chip "proceeded knowingly · R. Devane · recorded" |
| F-16 | Sharing sheet | click Sharing | radio: Private to you / Collaborator — Full / Collaborator — Basic, plus three policy lines (private by default; non-admin shares route through approval; spend stays behind the entitlement) |
| F-17 | Shared Full | pick Full → Apply sharing | banner "Shared with J. Dubois at the Collaborator Full tier — explicit, attributed, revocable…"; Visibility line updates |
| F-18 | Shared Basic | pick Basic → Apply | equivalent banner and visibility line at the Basic tier |
| F-19 | Revoked | pick Private → Apply | "Sharing withdrawn — the profile is private to you again. The audit records the shared interval." |
| F-20 | Financials | advisor only | a **SCHEMATIC** card describing what would render; no figures |
| F-21 | Colleague at Full | `role:'colleague'`, `shareTier:'full'` | the whole profile, with a `Collaborator Full` chip where the Sharing button was; Financials card absent |
| F-22 | Colleague at Basic | `shareTier:'basic'` | one Contact card: name · status · "contact on file" + the absent-not-masked line |
| F-23 | Colleague at private | `shareTier:'private'` | the same empty state as F-6, including Request access |

### 5.3 `/travellers/[id]` — every other profile
| # | State | How to reach | What renders |
|---|---|---|---|
| F-24 | Standard | `/travellers/whitfield` | Next journey + checklist + "Open the itinerary", All journeys, **SCHEMATIC** Intelligence card pointing at S. Marchetti, At a glance, Acuity, Visibility |
| F-25 | Acuity Not Run | `/travellers/whitfield` or `/lindqvist` | "Acuity has not been run for this profile. The score is absent rather than estimated." |
| F-26 | Acuity Complete | `/travellers/grandin` | score + "last complete run" |
| F-27 | Shared profile | `/travellers/osei` | header chip "shared with J. Dubois"; Visibility "Shared with J. Dubois — Collaborator Full." |
| F-28 | Colleague, not shared | `role:'colleague'`, `/travellers/grandin` | "Not shared with you. This profile is private to its owning advisor. It is absent from your list, not locked inside it." |
| F-29 | Unknown id | `/travellers/nobody` | "Not on your list. Nothing at this address for your permission path." |

**Content:** S. Marchetti is fully specified; every other profile is real but thin, with its Intelligence block explicitly schematic.

---

## 6. Journey B + D touchpoints inside advisor scope

Journey B has no advisor-facing surface of its own. It surfaces as:
- the briefing Notices widget (C-1 … C-4),
- the notice banners on records (E-11, E-23, E-24, E-26 … E-29, E-30),
- the ask spa thread (A-12 … A-14),
- the notification `n-notice-stale` ("Two notices are past their review interval") whose action button carries a **SCHEMATIC** badge and no destination,
- the SCHEMATIC notice composer (E-22).

`/notices` redirects to `/notifications?tag=Records`. There is no advisory composer that writes, no stale-review queue, no close-with-reason, no publish/share action, no archive, no history.

Journey D reaches advisor scope only as record visibility: Hotel Sereno Kyoto is hidden from the directory and returns E-34 until a lead confirms it.

---

## 7. Cross-journey surfaces

### 7.1 `/notifications` — the triage space
**Before:** dock (badged); briefing "Open triage" (`?tag=Records`); `/notices`. **After:** each item's subject link into its record, commission, traveller or filter.
**For:** every item still needing a decision, each bound to its subject.

| # | State | How to reach | What renders |
|---|---|---|---|
| N-1 | Advisor, Open | `/notifications` | "10 open"; tag segments All 10 / Records 4 / Commissions 4 / Traveller 2; sorted Critical → Important → Info, then recency; a left border marks `new` |
| N-2 | Item panel | click a row | severity, tag, state, headline, detail, Evidence / Generated by / When / Subject, the action button, Mark actioned · Defer, and "This item stays here until you action or defer it." |
| N-3 | Actioned | Mark actioned | the item leaves the Open list and its panel closes; count drops |
| N-4 | Actioned view | Actioned segment | the actioned item + "Put it back in the open list" |
| N-5 | Deferred | Defer, then the Deferred segment | same shape, `deferred` chip |
| N-6 | Empty under filter | Deferred with nothing deferred, or `?tag=Knowledge` as advisor | "Nothing waiting under this filter. / Items are still here under another tag or state." + Show everything open |
| N-7 | Tag pre-applied | `?tag=Records` | the Records segment is live on arrival |
| N-8 | Action without a destination | open `n-notice-stale` or `n-cancel` | an outline button carrying a **SCHEMATIC** badge |
| N-9 | Colleague | `role:'colleague'` | 3 items, Records tag only — the Commissions and Traveller items are absent, not greyed |

**Content:** real. Sixteen seeded notifications, ten addressed to the advisor, three to the colleague.
**Not reachable:** the all-empty state ("Nothing waiting.") — both in-scope roles always have items.

### 7.2 `/knowledge` — the vault
**Before:** dock; the refusal's "Forward a document to the vault" (prose only, no link). **After:** nothing — no document opens.
**For:** provenance-first document list with a verified-source meter and an access history.

| # | State | How to reach | What renders |
|---|---|---|---|
| K-1 | Default | `/knowledge` | 14 rows; source tabs All 1,284 / Drive 812 / Email 96 / Intranet 341 / Uploads 35; a "3 intranet errors" status line; provenance panel opens with Atelier Collection terms.pdf preselected |
| K-2 | Source tab | click Email | 2 rows; the tab count still reads 96 |
| K-3 | Document with history | Atelier Collection terms.pdf | Source / Synced 12:04 every 15 min / Used in 14 answers this month / Updated / Access "Whole agency", then a two-entry History: "MK widened access: team → agency · 14 Jun · logged" and "Uploaded by MK, private on arrival · 12 Mar" |
| K-4 | Document without history | any other row | "This document has not been widened since it arrived." |
| K-5 | Processing row | Supplier webinar notes | amber dot, "processing" in both the date and access columns |
| K-6 | Archived row | Winter rate sheet 2025 (superseded) | grey dot |
| K-7 | Owner chip removed | click × on the "Owner anyone" chip | the chip disappears; **the row set does not change** |
| K-8 | Narrow layout | width < 1024 px | the provenance panel does not open by itself; it is a bottom sheet on demand |

**Content:** real-looking rows; totals are seed constants that do not reconcile with the 14 visible rows. "Upload" carries a **SCHEMATIC** badge; "Manage access" is inert.
**Role behaviour:** none. `/knowledge` never reads the session role, so a colleague sees the identical list including the two `admin only` documents.

---

## 8. Spec'd, not reachable in the build

Journey ids in brackets.

**Journey A**
1. Mandatory reason on conflict resolution [A U1, appendix A8] — neither resolve sheet has a reason field.
2. A choice between conflicting values — only the Partner portal value can be kept; the other two buttons are disabled [A U1: "the advisor picks the value"].
3. EP2 ⌘K "ask instead" carrying the query text [A5] — the palette has a static "Ask a question…" item and no text handoff.
4. EP3 entity pre-scoping [A5] — "Ask about this" sets `askScope`, but `PageHeader` discards the crumb, so the scope is invisible and no thread is pre-filtered.
5. EP4 briefing → follow-up with briefing context [A24] — briefing notice rows link to records, never to Ask.
6. U4 permission-denied source with an audit entry [A11, A12] — the colleague variant omits the sources panel, but no audit line renders anywhere.
7. U5 empty workspace / guided first-run [A13].
8. E2 relative-date echo, E3 dual-currency rendering, E4 duplicate-document dedup [A15].
9. X2 connector-down gap note in an answer ("intranet unreachable since 09:12") — the connector failure exists in seed data and on the lead's screen, never in an answer.
10. Suggested follow-ups; a thread that continues [A7]. Submitting the composer does nothing.
11. Copy / client-facing export [DEC-05] — the menu is schematic and both items are inert.

**Journey B**
12. Creating an advisory [EP1–EP4] — the composer is schematic; severity and scope are static chips; Submit is inert.
13. Manual close with a reason [happy path 5, B11] — no UI dispatches `closeSpaNotice`; the flag can only be set in the store.
14. The stale-review queue, oldest-first, with one-tap confirm-still-active / close [happy path 6, U5, B5] — replaced by one notification whose action is schematic.
15. Scope change / share-to-team / publish from an advisor screen [happy path 3].
16. U4 contradicting advisories — the seeded personal notice ("Spa reopened — saw it Tuesday", JD) renders on no advisor surface; briefing filters personal scope out and the Maison Léandre record does not list product notices.
17. E1 "ended, pending close" render state [B12] — no promotion reaches it on the seeded day.
18. E3 advisory created from a forwarded email with a permission-split source.
19. X1 half-publish prevention / retry [B7].

**Journey C**
20. Commission calendar [EP3, DEC-22].
21. E1 unconfirmed-cancellation alert on the briefing [C12] — it exists only as notification `n-cancel`, and its action button has no destination.
22. E2 processor-migration briefing note [C7].
23. E3 quiet-day briefing empty state [C8].
24. X1 booking-system-unreachable ledger with a gap note; X2 per-widget failure with retry [C9].
25. Expiring-incentive affected-client list [C4] — `promotions[].affectedClients` is seeded and rendered nowhere; the widget's "See affected records" goes to a filter that returns one record while the widget lists three.

**Journey E**
26. Filter by destination + facility ("Tokyo properties with a spa") [4a.1] — facets are Region / Tier / Programme / Status / Consortia / Evidence; there is no city, destination, amenity or free-text search.
27. Per-advisor filter persistence [E1].
28. Edit a field into an overlay [4b.2] — the edited-overlay state exists only as seeded data; there is no edit affordance.
29. U5 record-missing recovery — the copy describes requesting via the extraction pipeline and creating a stub; neither is a control, and no knowledge-gap is logged.
30. U6 note scope narrowing with an audit interval [E8].
31. E1 rename history [E9]; E2 "possible duplicate" route to the merge sheet.
32. E3 rep-firm portfolio pivot ("all properties this firm represents") [DEC-26] — the rep-firm record lists neither properties nor named contacts.
33. X1 connector-gap field rendering; X2 failed-edit retry [E10].
34. EP3/EP4 deep links that scroll to a field or carry a notice context banner [E2].

**Journey F**
35. A preference composer that requires a source [4.2, acceptance] — preferences can be confirmed, never added.
36. A note composer on the profile [4.3] — notes exist only on product records.
37. U1 warning at selection time — the warning is a fixed banner on the profile and on the day board, not raised when a property is added.
38. U2 request-access as a real flow [F4] — the button sets local state and claims the request "appears on their briefing"; nothing does. The store's `requestFiled` is never dispatched.
39. U4 revoke audit interval [F2] — the revoke banner asserts an interval was recorded; no audit view renders it.
40. Acuity states Running and Locked [DEC-36] — only Not Run and Complete are seeded.
41. `is_primary` per travel-profile-type with six blocks each — the tabs exist and are disabled; profiles render as three chips.
42. E2 conflicting preference sources; E3 household/shared trips.
43. X1 import failure held as suggestions.

**Cross-cutting**
44. Loading states on every screen [A/B/C/E/F acceptance, "Loading / empty / error states on every screen"] — none exist; all Suspense fallbacks are `null` and the Skeleton primitive is unused.
45. Role-filtering on `/knowledge` — the vault ignores the session entirely, so `admin only` documents render for the colleague.
46. Every widget being a saved view — true for four of five advisor widgets; the gated Commissions widget loses its footer link, and the Incentives widget's view does not contain the same set it lists.

---

## 9. Shortest click-paths

Each path starts from a signed-in advisor at `/briefing` in world v2 with a fresh store (presenter key `0`, then `1`). Steps are literal.

### P1 — Journey C, the working day (entry → chase → exit) · 6 steps
1. `/briefing`.
2. In the **Commissions** widget, click **Villa Ortensia**.
3. Click **Draft a reminder**.
4. Edit a line in the textarea.
5. Click **Send** → the title becomes `chased` and the chase log records it.
6. Frame-bar **back** → briefing.

### P2 — Journey E, reconciliation inspected (entry → resolve → annotate → exit) · 8 steps
1. `/briefing`.
2. In **Notices**, click **Maison Léandre — Spa closed to 15 Sep.**
3. Click any field value to open its provenance popover; press Escape.
4. On the Commission row, click **Resolve 3 sources**.
5. On the Partner portal card, click **Keep this value** → "12% · resolved · agency layer".
6. Click **Add note…**, type, choose a scope, click **Save note**.
7. Click **Verify against source** on Pool hours → "verified today · R. Devane".
8. Click **Ask about this** → `/ask` (Journey A entry).

### P3 — Journey A, the two doors joined (record → answer → refusal → recovery) · 7 steps
1. From P2 step 8 you are on `/ask`. Click **Maison Léandre — Atelier rate** in the conversations column.
2. Read the resolved answer (P2 already stored the resolution) — footer reads `answer contract met`, rail shows the agency-layer line.
3. Click **Third night free on suites**.
4. Read the refusal: Sources ✓, Freshness ✗, Corroboration ✗.
5. Click **Forward a document to the vault** → the inbound-address banner.
6. Click **Is the spa at Maison Léandre open?** → the notice-carrying answer.
7. Press `v` → the same question now answers "The spa is open" (the v1 failure). Press `v` again to return.

*Cold variant of P3 (no P2):* 1. dock → **Ask**. 2. click **Maison Léandre — Atelier rate**. 3. **Resolve…** 4. **Keep this value**. 5–7 as above.

### P4 — Journey B, the documented iteration · 5 steps
1. `/briefing` — note the spa notice with `review due`.
2. Press `n` (narration on).
3. Press `v` → the Notices widget takes a `v1 build` chip, the spa notice vanishes, the narration note explains the silence.
4. Dock → **Ask** → **Is the spa at Maison Léandre open?** → the confidently wrong answer.
5. Press `v` → back to v2, notice restored, answer corrected.
*(There is no way to close the notice from the UI; closing is store-only.)*

### P5 — Journey B U2, the Critical gate · 5 steps
1. Dock → **Notifications**.
2. Click **Critical notice blocks a property you have shortlisted**.
3. In the panel, click **Open the record**.
4. Click **Add to itinerary shortlist** → dialog.
5. Click **Acknowledge (recorded: R. Devane, today)** → the banner records the acknowledgment and the shortlist accepts the property.

### P6 — Journey F, the traveller (departure → preference → share → isolation proof) · 9 steps
1. `/briefing`.
2. In **Departures**, note *S. Marchetti · Kyoto & Kansai · in 12d*; dock → **Travellers**.
3. Click the **S. Marchetti** card → **Open full profile**.
4. On *Kaiseki over French dining*, click **confirm this**.
5. Click **Proceed knowingly (recorded)** on the shortlist-conflict banner.
6. Click **Sharing** → select **Collaborator — Full** → **Apply sharing**.
7. Sign out via the dock's Account, sign in as **J. Dubois** (or set `role:'colleague'` and reload).
8. Dock → **Travellers** → 2 profiles, both marked Collaborator Full; open S. Marchetti — every field is there, Financials is not.
9. Set `shareTier:'basic'` and reload → the same profile collapses to name and contact; set `shareTier:'private'` → the list is empty with **Request access from the owner**.

### P7 — Journey C/F, the itinerary · 5 steps
1. `/briefing` → **Departures** → **All departures** (`?window=30`).
2. Click **Kyoto & Kansai** → the trip inspector.
3. Scroll to the day board; read the Meridian and +3% chips on Ryokan Suikawa.
4. Click **Add to Day 1** on Kikunoi Honten.
5. On the preference-conflict banner, click **swap the property** → the traveller profile.

### P8 — the permission tour (one continuous pass) · 6 steps
1. Sign in as **J. Dubois** (`role:'colleague'`).
2. `/briefing` — Commissions is prose, Expiring incentives is gone, Departures is one row.
3. Dock → **Commissions** — the ledger is absent by policy.
4. Dock → **Records** → **Maison Léandre** → open full record: no Commission field, no private note, no agent terms, no promotion.
5. Dock → **Ask** → **Maison Léandre — Atelier rate**: the rate half is refused and the Sources rail is omitted.
6. Dock → **Travellers**: only what R. Devane shared.

---

## 10. Tally

- Screens in scope: **11 routes** (plus two redirects into them).
- Distinct states verified in the browser: **132** — briefing 6, ask 18, records directory 10, records detail 25, travellers list 7, traveller profiles 22, itineraries 9, commissions ledger 6, commission detail 12, knowledge 8, notifications 9. (Each is a numbered row in §2–§7.)
- Screens or blocks carrying a **schematic** badge: ask Copy-and-export rail, ask unbuilt threads (2), record notice composer, itinerary day board, traveller profile tabs, traveller Financials, generic traveller Intelligence, knowledge Upload, commission dispute draft, notification actions without a destination (2).
- Spec'd items not reachable in the build: **46** (§8).
