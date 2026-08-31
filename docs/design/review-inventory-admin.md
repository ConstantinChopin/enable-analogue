# Review inventory — administrative, operational and cross-cutting surfaces

**Status:** reference · verified against the running prototype at `http://localhost:3000`, 2026-08-30.
**Scope:** `/signin`, `/settings`, `/admin/publish`, `/admin/connections`, `/admin/review`, `/admin/review/[id]`, `/ops/resolution`, `/notices`; plus the axes that change every screen (role, build vintage, narration, the frame, 390 px).
**Method:** every state below was reached in a browser. Where the running app and a spec disagree, the app is recorded as the fact and the disagreement is listed in §7.
**Not evaluated.** This document reports what exists.

**Reaching a state:** the demo state lives in `sessionStorage` under `enable-demo-state`. Signing in is
`{signedIn:true, role:'advisor'|'colleague'|'lead'|'ops', world:'v2'|'v1', narration:false, …}` then a reload. Everything below is also reachable by hand from `/signin`.

---

## 1. Journey D — Connections, ingestion, extraction confirmation

Spec: `docs/journeys/journey-d-ingestion-confirmation.md`. Persona: agency lead (primary), ops.

### 1.1 `/admin/connections`

| | |
|---|---|
| Journey · spec id | D · EP1, D§4.1, U4, X2 · extrapolation D1* |
| Before | lead briefing → *Connection health* widget → "All connections"; or account menu → Connections; or `/settings` → Connections → "Open connections"; or notification `n-connector` → "Open connections" |
| After | terminal — no onward navigation from this page |
| Purpose | Integration health as a surface: every source shows when it last succeeded |
| Archetype | Ledger without a detail panel |
| Breadcrumb | `Connections` (the `admin` segment is dropped — it is a grouping, not a place) |

**Content — real-looking.** Five seeded connectors: Intranet documents (MCP upstream, 09:12, *connected*) · Google Drive (MCP upstream, 08:40, *connected*) · Booking system (read-only · ground truth stays in source · sync up to 48h, yesterday 18:00, *syncing*) · Partner portal (self-hosted fallback, 24 Aug, *credentials expired*) · Inbound mail — parisdesk@inbound.enable… (private by default, sender-verified, 11:52, *connected*). Header chip reads `5 sources · 1 failing`. Trailing Section, "When a source fails downstream", is static prose.

**States**

| State | How to reach | What renders |
|---|---|---|
| Default | land on the route | table of 5, header chip `5 sources · 1 failing` |
| Add connection — MCP (default) | "Add connection" button, top right | right sheet, title `Add connection` + **SCHEMATIC** badge; radio MCP upstream selected; footer "Continue" |
| Add connection — self-hosted | select the second radio | radio moves; nothing else changes |
| Sheet dismissed | "Continue", Close, or Esc | sheet closes; no next step, no connector added |
| Narration on | press `N` | one note above the table: "Integration health is a surface, not a log line…" |

Connector rows are inert — no row click, no retry, no reconnect, no per-connector detail.

### 1.2 `/admin/review` — Confirm new records

| | |
|---|---|
| Journey · spec id | D · §4.3, §2.4 · presentation D2* |
| Before | **no in-product link exists to this index.** Reachable by URL, or by "Back to the queue" on a candidate address that resolves to nothing. Notifications link straight to individual candidates. |
| After | a row → `/admin/review/{id}` |
| Purpose | The extraction queue: nothing surfaces in answers, cards or search until a named person confirms it |
| Archetype | Ledger |
| Breadcrumb | `Confirm new records` |

**Content — real-looking**, with one schematic panel.

| Candidate | Source | State chip |
|---|---|---|
| Hotel Sereno Kyoto · `gdrive://dmc-kyoto-2026.xlsx` | DMC spreadsheet — semi-structured Excel | `new candidate` |
| "Maison Leandre" · `portal://meridian/sync-0827` | portal sync | `possible duplicate` |
| "Villa ????" · `gdrive://dmc-kyoto-2026.xlsx` | unreadable source row | `held: low confidence` |

Two footer Sections: *Scope inheritance* (prose) and *Bulk seeding* (**SCHEMATIC** badge, prose only — no batch UI).

**States**

| State | How to reach | What renders |
|---|---|---|
| Default | land on the route | header chip `3 in review`, three rows |
| Advisor request pending | set `requestFiled:true` (set in-app by filing a directory-gap request on `/records`) | header chip `4 in review`; a fourth row "Requested from directory · advisor request · gap logged" with chip `awaiting extraction`. Not a link. |
| Sereno confirmed | set `candidateConfirmed:true`, or confirm on the detail page | Sereno's chip becomes `confirmed today`; the row stays in the queue |
| Narration on | `N` | "The pipeline proposes; people decide…" |

Empty queue is unreachable — the candidate list is static seed.

### 1.3 `/admin/review/[id]` — candidate detail

| | |
|---|---|
| Journey · spec id | D · §4.4–4.7, U1, U2, U3, U6, U7 · D3*, D4*, D5*, D6*, D13*, D14*, D15*, D16* |
| Before | `/admin/review` row; notification `n-candidate` → "Confirm the record"; `n-duplicate` → "Review the match"; presenter key `8` |
| After | terminal — the confirm/merge/reject outcomes render as banners in place; no navigation |
| Purpose | Per-field confirmation against source snippets; merge, or reject with a reason |
| Archetype | Document |
| Breadcrumb | `Confirm new records / <candidate name>` |

Three seeded ids plus a not-found branch.

#### `sereno` — the new-candidate case (content: real-looking)

Header `Hotel Sereno Kyoto` + chip `new candidate`; subtitle `DMC spreadsheet — semi-structured Excel · gdrive://dmc-kyoto-2026.xlsx`. Identity banner (Info tone): "Identity check — no canonical match. Name, city and place-id are all clear, so this creates a new record."

Five fields, each with value · source snippet · confidence meter:

| Field | Value | Snippet | Confidence | Gate |
|---|---|---|---|---|
| Name | Hotel Sereno Kyoto | row 41 · col B | 0.98 | fixable, confirmable |
| City | Kyoto | row 41 · col C | 0.97 | fixable, confirmable |
| Rooms | 28 | row 41 · col F | 0.95 | fixable, confirmable |
| Rate | `held — converted figure without source currency` | row 41 · col H: "€1,180" marked (converted) | 0.40 | **held** — no fix, no confirm |
| Description | "View Hotel — experience refined luxury…" | portal boilerplate detected | 0.30 | **template copy** — no fix, no confirm |

**States**

| State | How to reach | What renders |
|---|---|---|
| Default | land | as above; footer actions "Confirm record — stamped M. Keller, today" and "Reject — reason logged" |
| Field confirmed | per-field **Confirm** | that field's button becomes chip `confirmed` |
| Field correction open | pencil icon on a confirmable field | inline `Input` prefilled with the current value + Save |
| Field corrected | type a value, Save | value replaced; chip `corrected · M. Keller` beside it; snippet and confidence unchanged |
| Confirmed (transient) | "Confirm record" | green banner: "Confirmed with 2 fields still held (rate, description) — they stay in review, excluded from answers. The rest is live at the agency layer: answerable in Ask, visible in Records." All three confirmable fields flip to `confirmed`; the button disables |
| Confirmed (persisted) | reload with `candidateConfirmed:true` | banner: "Confirmed by M. Keller — live at the agency layer with 2 fields still held in review." |
| Reject sheet — empty | "Reject — reason logged" | right sheet; "Reject candidate" button **disabled** until a reason is typed |
| Reject sheet — filled | type any reason | button enables |
| Rejected | "Reject candidate" | banner: "Rejected — reason logged, attributed to M. Keller." The header chip stays `new candidate`; fields stay; nothing else changes |

Held and template fields carry their own explanatory lines: "A converted figure without its source currency is never committed — visible here, excluded from answers." / "Excluded from corroboration; queued for enrichment."

#### `leandre-dup` — the duplicate case (content: real-looking)

Header `"Maison Leandre"` + chip `possible duplicate`. Identity banner (Important tone): "Possible match: Maison Léandre · match signal 0.92" with signal chips `name_sim 0.92`, `city exact`, `google_place_id absent`, and a **Merge** button. Three fields (Name 0.92 · Rooms 42, 0.95 · Commission 12%, 0.90), each fixable and confirmable.

**Bottom actions are absent on a duplicate** — no "Confirm record", no "Reject".

| State | How to reach | What renders |
|---|---|---|
| Default | land | as above |
| Merge sheet — empty | **Merge** | right sheet "Merge into canonical"; three field rows `canonical ⟷ incoming` (Maison Léandre⟷Maison Leandre, 42⟷42, 12%⟷12%); "Merge as overlay on canonical" **disabled** |
| Merge sheet — filled | type a merge reason | button enables |
| Merged | confirm | banner: "Merged as an overlay on Maison Léandre — reason stored, attributed to M. Keller." Page otherwise unchanged; the duplicate chip stays |

#### `villa-unknown` — the held case (content: real-looking, minimal)

Header `"Villa ????"` + chip `held`. Body: source line, then one paragraph — "Nothing was extracted with confidence from this row. The candidate is held — it never surfaces anywhere until a person opens the source, fixes it by hand, or rejects it with a reason."
**No fields, no CTAs.** The three actions the sentence names are not present.

#### any other id (e.g. `/admin/review/nonexistent`)

"No candidate at this address" · "Nothing is waiting for confirmation here." · outline link **Back to the queue** → `/admin/review`. Breadcrumb renders the raw id.

**Narration on** (all candidate pages): "Every extracted field arrives with what, where and when. The two held fields demonstrate the hold gate: a converted figure without its source currency, and boilerplate masquerading as content."

---

## 2. Journey B — Advisory lifecycle (admin end)

Spec: `docs/journeys/journey-b-advisory-lifecycle.md`.

### 2.1 `/admin/publish` — Publish queue and sharing defaults

| | |
|---|---|
| Journey · spec id | B · EP4, §4.4, D5 · extrapolation B3; plus DEC-29 break-glass |
| Before | lead briefing → *Policy and access* widget → "Sharing defaults"; or notification `n-publish` → "Review and publish" |
| After | terminal |
| Purpose | The agency lead's governance surface: what publishes, what defaults closed, who opened what |
| Archetype | Document — main column + 320 px context rail |
| Breadcrumb | `Publish queue` |

**Content — real-looking throughout; no schematic badges.**

*Main column*
- **Publish queue** (chip `2 pending`): "Spa closure — submitted by R. Devane, team scope" → **Publish agency-wide (owner preserved)**; "Serengeti camp relocation — from forwarded mail" → **Review source**. Footer: "An advisor's notice reaches the agency layer only through this review."
- **Default visibility** (chip `4 record kinds`): Knowledge from email → Private to the receiving advisor · Traveller profiles → Private to the owning advisor · Itineraries → Whole agency · Knowledge uploads → The uploader's team. Values render as static pills — not editable.
- **Admin access to personal records** (chip `per agency policy`): two break-glass rows — "MK (admin) opened a personal note · reason: advisor on leave · expires 18:00 · Today 09:41"; "JB (admin) opened a traveller profile · reason: complaint review · owner notified · Yesterday 15:12".

*Context rail* — "Who this applies to" (34 advisors · 3 admins · 4 desks · 1,284 records governed); the narration note slot; "Last change · Policy saved · MK · 09:12 today".

**States**

| State | How to reach | What renders |
|---|---|---|
| Default | land | chip `2 pending` |
| Published | "Publish agency-wide (owner preserved)" | green banner "Published agency-wide — owner preserved."; that row's button → chip `published · owner preserved`; header chip → `1 pending` (primary tone) |
| "Review source" pressed | click it | **nothing** — no handler, no sheet, no navigation |
| Narration on | `N` | rail note: "Why defaults, not exceptions: a permission model that depends on people remembering to close something will leak." |

Publication is component-local: a reload restores `2 pending`. `0 pending` is unreachable — the second item has no publishing action.

---

## 3. Journey C — The working day (ops end)

Spec: `docs/journeys/journey-c-working-day.md`.

### 3.1 `/ops/resolution` — Unmatched payments

| | |
|---|---|
| Journey · spec id | C · EP4, U1 · queue mechanics C2; DEC-23 identity resolution |
| Before | notification `n-payment` → "Open matching" (**the only in-product link**). The ops briefing's *Unmatched payments* widget expands to `/notifications?tag=Commissions`, not here. |
| After | terminal |
| Purpose | Money that cannot be matched to a booking is visible and ranked; a person closes it with a reason |
| Archetype | Ledger |
| Breadcrumb | `Unmatched payments` (the `ops` segment is dropped) |

**Content — real-looking.** Two seeded payments: `EUR 410 · R. Osei` — "arrived under traveller name; booker is M. Osei"; `EUR 862 · "Pipery Hotel"` — "unresolvable property name". Header chip `2 open` (warn).

**States**

| State | How to reach | What renders |
|---|---|---|
| Default | land as `ops` (or `advisor`/`lead`) | two rows, chip `unmatched` + **Match** each |
| Amounts absent | sign in as `colleague` | figures gone from rows *and* from the match sheet; rows read `R. Osei` / `"Pipery Hotel"`; an extra Section appears: "Amounts are absent here — Viewing as J. Dubois: payment amounts are absent by policy, not masked." |
| Match sheet — empty | **Match** | right sheet; "Candidates, strongest first" — `VO-2214 · booker M. Osei (traveller R. Osei)` chip `strong candidate`, `KX-1108 · no name overlap` chip `weak candidate`; reason `Input`; "Confirm match (attributed)" **disabled** |
| Match sheet — candidate only | select a radio | still disabled |
| Match sheet — ready | select a radio **and** type a reason | button enables |
| One matched | confirm | header chip `1 open`; row chip → `matched · logged`; a line "→ VO-2214 · … · reason: "…" · attributed A. Blanc"; green banner "Matched with a reason — attributed to A. Blanc, logged on the payment." |
| Zero open | match both | header chip `0 open` (ok tone). Rows remain, both `matched · logged`. No empty state. |
| Narration on | `N` | "Money arrives under a traveller's name instead of the booker's… a person closes it with a reason." |

Cancel and Close both dismiss the sheet without effect. `matchPayment` is written to the demo store; the per-row match decisions are component-local and revert on reload.

---

## 4. Configuration and legacy surfaces

### 4.1 `/settings`

| | |
|---|---|
| Journey · spec id | D EP1 (the route to connections) · layout-exploration §6, §10.8 |
| Before | dock → account avatar → **Settings** (every role) |
| After | lead only: "Open connections" → `/admin/connections` |
| Purpose | Who you are, what raises an item, and the way out to connections for the role that owns them |
| Archetype | Page of Sections; no rail |
| Breadcrumb | `Settings` |

**Content — mixed.**
- **Profile** (real-looking): Name / Role / Email from the signed-in role — `R. Devane · Advisor · Paris desk · r.devane@enable.example`; `J. Dubois · Advisor · Paris desk · j.dubois@enable.example`; `M. Keller · Agency lead · m.keller@enable.example`; `A. Blanc · Operations · a.blanc@enable.example`. Read-only, with the line "Changing them is an administrator's act, not a personal one."
- **Notifications** (**SCHEMATIC** badge): five switches — Critical notices **on**, Commission ageing **on**, Departure watch **on**, Freshness sweep off, Daily digest by email off. Switches toggle and hold in component state; nothing downstream changes.
- **Connections** — role-conditional (below).

**States**

| State | How to reach | What renders |
|---|---|---|
| Non-lead | sign in as advisor / colleague / ops | Connections Section is prose only: "Source connections are an agency lead's setting…" — no chip, no link |
| Lead | sign in as `lead` | Connections Section gains chip `2 need attention`, the line "5 sources feed this workspace…", and button **Open connections** |
| Preference toggled | click any switch | switch flips; the trailing line "These switches decide what raises an item…" is static |

No narration note on this screen.

### 4.2 `/notices` — redirect

Server-side `redirect()` to **`/notifications?tag=Records`**. Confirmed: the address bar lands on `/notifications?tag=Records`, breadcrumb `Notifications`.

| Signed-in role | What the destination shows |
|---|---|
| advisor | `10 open`; tags All 10 · **Records 4** · Commissions 4 · Traveller 2; the Records filter is applied and populated |
| colleague | Records tag present and populated |
| lead | `5 open`; tags All 5 · Ingestion 2 · Connections 2 · Knowledge 1 — **no Records tag**; the applied filter yields "Nothing waiting under this filter. Items are still here under another tag or state." + **Show everything open** |
| ops | same shape as lead — no Records tag, empty filter |

`/notices` is linked from nowhere in the product; it is a legacy address kept alive.

### 4.3 `/signin` — see §6

---

## 5. Cross-cutting axes

### 5.1 Role — advisor · colleague · lead · ops

**How to reach:** choose a demo account on `/signin`, or set `role` in `enable-demo-state` and reload. There is no in-product persona switch; a role change is a sign-out and sign-in.

**The dock tile set** (the permission story rendered as layout):

| Role | Person | Initials | Dock tiles | Notifications badge |
|---|---|---|---|---|
| advisor | R. Devane | RD | Briefing · Notifications · Ask · Records · Travellers · Itineraries · Knowledge (7) | **7** |
| colleague | J. Dubois | JD | identical 7 tiles | **2** |
| lead | M. Keller | MK | Briefing · Notifications · Records · Knowledge (4) | **4** |
| ops | A. Blanc | AB | Briefing · Notifications · Records · Knowledge (4) | **4** |

The badge counts notifications addressed to that role whose state is still `new`. It is the only badge in the dock.

**The briefing's contents** (`/briefing`, widget set from `widgetsFor[role]`; every widget footer navigates to the surface it summarises):

| Role | Widgets | Expands to |
|---|---|---|
| advisor | Commissions (chip `3 overdue`, EUR 12,532 outstanding across 9, EUR 410 collected this week, 4 rows) · Departures (3) · Notices (5, chips Important/Info/Critical, two `review due`) · Expiring incentives (3) · Records verified this quarter (41 of 128) | `/commissions?state=open` · `/itineraries?window=30` · `/notifications?tag=Records` · `/records?evidence=incentive` · `/records?evidence=stale` |
| colleague | Commissions (**figures absent**) · Departures (**1 row**) · Notices (5) · Records verified this quarter. **Expiring incentives absent entirely.** | as advisor, minus the Commissions footer link, which is withheld |
| lead | Awaiting publication (2) · Records awaiting confirmation (chip `3 waiting`) · Connection health (chip `2 need attention`, 5 rows) · Policy and access (4 defaults + "34 advisors · 3 admins · 4 desks · 1284 records" + "2 break-glass openings logged") | `/notifications?tag=Knowledge` · `/notifications?tag=Ingestion` · `/admin/connections` · `/admin/publish` |
| ops | Unmatched payments (chip `2 to match`, EUR 1,272 across 2) · Reconciliation this month (Collected EUR 3,138 / 5 settled; Outstanding EUR 12,532 / 9 open · 3 overdue) · Projected vs actual (1 flagged: Palácio das Amoreiras, expected EUR 1,120 · received EUR 1,008 · rate mismatch · currency variance) | `/notifications?tag=Commissions` · `/commissions?state=all` · `/commissions?state=discrepancy` |

Header is per-role: "Good morning, {name}".

**Permission-absent content — verified absent, not masked.** The single entitlement in code is `canViewCommissions(role)`, false for `colleague` only.

| Where | What the colleague sees |
|---|---|
| `/ops/resolution` rows | The `EUR 410` / `EUR 862` figures are **not rendered** — the row begins at the raw payer string. Same in the match sheet's description line. |
| `/ops/resolution`, extra Section | "Amounts are absent here — payment amounts are absent by policy, not masked." |
| Briefing → Departures | Only travellers shared with J. Dubois appear (1 of 3). Not-shared travellers produce no row. |
| Briefing → Expiring incentives | The widget is not in the colleague's widget set at all |
| Account menu | Connections item present for `lead` only |
| `/settings` | Connections chip and "Open connections" button present for `lead` only |

**One place where content is present-but-emptied rather than absent:** the colleague's **Commissions** briefing widget still renders as a card, with its title and its frame, carrying the sentence "Commission figures sit with the owning advisor. They are absent from this briefing by policy, not hidden behind a mask." The figures are genuinely gone; the container is not. Its footer link ("Open the ledger") is withheld.

**No route is role-guarded.** Signed in as `advisor` (RD in the account cluster), `/admin/publish`, `/admin/connections`, `/admin/review`, `/admin/review/{id}` and `/ops/resolution` all render in full, with their lead/ops-facing controls live. The role governs the dock, the account menu and the briefing — not the addresses.

### 5.2 Build vintage — `world: "v2"` (current) vs `"v1"` (March build)

**How to reach:** press `V` anywhere inside the product (toggles), or choose *Current build* / *March build* under **Demo setup** on `/signin`. It is written to the demo store and survives navigation and reload. There is no in-product indicator that a vintage is active other than the content differences themselves.

**Where it differs** — four surfaces only:

| Screen | v2 | v1 |
|---|---|---|
| `/briefing` → Notices widget | 5 notices, including "Maison Léandre — Spa closed to 15 Sep." (Important); two carry a `review due` chip | **4** notices — the spa notice is silently gone; no `review due` chips; the widget header gains a `v1 build` chip; with narration on, a note explains the absence |
| `/records` | notice pill on the affected card | the v1 branch renders instead |
| `/records/maison-leandre` | active spa notice banner | v1 branch banner |
| `/ask` | spa notice active in the thread and in the Sources rail | notice absent; a narration-only `v1Note` is available |

**Where it does not differ — verified identical:** `/admin/publish` (DOM-identical before and after `V`), `/admin/connections`, `/admin/review`, `/admin/review/[id]`, `/ops/resolution`, `/settings`, `/notifications`. None of these read `world`.

### 5.3 Narration overlay — presenter commentary, not product chrome

**How to reach:** press `N` inside the product (toggles). Not available on `/signin` — the key layer is not mounted there.

**What appears:** a fixed pill at the bottom-left reading `NARRATION` (the only presenter pixel the product allows), plus dashed-border, primary-tinted `<aside>` blocks with a presentation icon, inserted into the page flow at authored positions. 21 such notes exist across 16 route files. None on `/settings` or `/signin`.

In-scope notes:

| Screen | Note |
|---|---|
| `/admin/publish` (context rail) | "Why defaults, not exceptions: a permission model that depends on people remembering to close something will leak." |
| `/admin/connections` (above the table) | "Integration health is a surface, not a log line. A failed source degrades answers visibly…" |
| `/admin/review` | "The pipeline proposes; people decide. Below the reliability bar, auto-commit destroys trust faster than a missing record does." |
| `/admin/review/[id]` | "Every extracted field arrives with what, where and when. The two held fields demonstrate the hold gate…" |
| `/ops/resolution` | "Money arrives under a traveller's name instead of the booker's, or against a property name that does not resolve…" |
| `/briefing` (all roles) | "The screen the agency asked for by name… The widget set is built from the signed-in role, so the permission story is the layout, not a claim about it." |
| `/briefing`, v1 only | "The spa notice is missing from this list. The v1 build let it expire on 1 August… that absence is the failure v2 was built to remove." |

Narration changes no data and gates no control. It is an overlay of commentary about the design, addressed to the room.

### 5.4 The frame — what is global and always present

Present on every route except `/signin`. Composition, outside-in: a `bg-subtle` page inset, a breadcrumb strip *outside* the panel border, a bordered content panel that owns its own scroll (the page itself never scrolls), and the dock floating over the inset below.

| Element | Behaviour |
|---|---|
| **Back / Forward** | Two icon buttons at the far left of the breadcrumb strip. Verified working (`/admin/review/sereno` → ⌘3 → `/records` → Back → `/admin/review/sereno` → Forward → `/records`). Styled for a disabled state but never actually disabled — Back at the start of history is clickable and inert. |
| **Breadcrumb** | Path-derived. `admin` and `ops` segments are dropped as groupings. Known sections map to labels (`publish` → Publish queue, `review` → Confirm new records, `resolution` → Unmatched payments, `connections` → Connections, `settings` → Settings). Dynamic segments resolve to the entity's name (`/admin/review/sereno` → `Confirm new records / Hotel Sereno Kyoto`); an unknown id renders raw (`… / nonexistent`). Not clickable — it locates, it does not navigate. |
| **Dock** | Fixed, centred, bottom. Icon-only tiles; the active tile shows its label permanently and a dot beneath; inactive tiles show the label on hover with the ⌘n hint. Tile set is per-role (§5.1). One badge, on Notifications. |
| **Divider + utility cluster** | To the right of a vertical rule: **Search — ⌘K**, **Synced 12:04** (tooltip only, inert), and the **account** avatar. |
| **⌘K palette** | Opens from the search button or ⌘K/Ctrl-K; toggles. Four canned groups — Records (Maison Léandre, Records directory) · Travellers (S. Marchetti) · Notifications (Everything needing a decision) · Ask (Ask a question…). No live index; an unmatched query gives "Nothing here by that name." Esc closes. The same four groups appear for every role, including ones whose dock has no Ask or Travellers tile. |
| **⌘1…⌘n** | Jumps to the nth tile of the current role's dock. Verified (⌘3 → `/records` as lead). |
| **Account menu** | Header shows name + role label. Items: **Settings**; **Connections** for `lead` only; separator; **Sign out** (clears the session and replaces to `/signin`). |
| **Session gate** | Any route without `signedIn` replaces to `/signin`; `/signin` while signed in replaces to `/briefing`. While the store rehydrates, a blank `bg-background` screen renders — there is no skeleton or spinner. |
| **Presenter keys** | Invisible; render nothing. `N` narration · `V` vintage · `1` morning (advisor, v2, /briefing) · `2` commission (`/commissions/vo`) · `3` record (`/records/maison-leandre`) · `4` ask scoped · `5` ask refusal · `6` v1 rewind · `7` traveller · `8` **admin confirm** (signs in as `lead`, pushes `/admin/review/sereno`) · `0` reset (clears the seeded day's mutations, keeps role/world/narration, pushes `/briefing`). Verified: `8` and `0`. Modified keys are excluded, and the layer ignores keys while a text field is focused or a dialog is open. Not mounted on `/signin`. |

### 5.5 Responsive at 390 px

Measured at 390 × 844 on each in-scope screen. **No screen produced horizontal page overflow.**

| Element | What transforms |
|---|---|
| **Dock, 4 tiles** (lead, ops) | 345 px wide — fits with room to spare; no scroll |
| **Dock, 7 tiles** (advisor, colleague) | content 548 px inside a 364 px track — becomes **horizontally scrollable**, scrollbar hidden. Utility cluster and account sit past the right edge until scrolled |
| **Ledger rows** (`.row-grid`) | The middle `.row-meta` column is **hidden below 640 px**. On `/admin/connections` the header collapses to `SOURCE / STATE` and every **Last success** timestamp disappears. On `/admin/review` the **Source** column disappears (the `gdrive://` / `portal://` URI on the primary line survives). `/ops/resolution` and `/admin/publish` rows have no meta column and are unaffected. |
| **Document rail** (`/admin/publish`) | `lg:grid-cols-[1fr_320px]` collapses to a single 340 px column; the context rail (Who this applies to · narration · Last change) stacks beneath the main column |
| **Briefing widget grid** | 3 columns → 1 column, widgets stack in role order |
| **Right sheets** (add connection, reject, merge, match) | Stay right-side drawers at ~292 px (3/4 viewport); they do not become bottom sheets. The bottom-sheet variant is reserved for the `SplitPage` inspector below 1024 px, which none of these screens use. |
| **`/settings`** | Single column already; rows keep label-left / value-right |
| **`/signin`** | The **Demo setup** disclosure leaves its `sm:absolute` bottom-right position and becomes a static, full-width block (358 px) below the demo-accounts list. Card and accounts list stay at 358 px. |

---

## 6. `/signin` — the first thing anyone sees

| | |
|---|---|
| Journey · spec id | Frame · layout-exploration §9 (persona switch became sign-in); review 01 §7 (demo setup lives here) |
| Before | any route without a session; **Sign out** in the account menu |
| After | **Sign in** → `/briefing` as the selected role |
| Purpose | Establishes who you are — which explains the view you land in — and is the only place a demo control is visible |
| Chrome | **None.** No dock, no breadcrumb, no presenter key layer (verified: `V` on `/signin` does not change `world`) |

**Anatomy, top to bottom, in a 404 px column**

1. Product mark — an `E` tile plus the word *Enable*.
2. Card: `Sign in to Enable` · "Your desk, your travellers and your agency's terms."
3. **Work email** — prefilled from the selected demo account (`r.devane@parisdesk.travel` by default). Editable. Not `required`.
4. **Password** — prefilled with twelve bullet glyphs, `type="password"`. Editable. Not `required`. To its right, **Forgotten?** — a plain `<span>`, not a link or button; inert.
5. **Sign in** — primary, full width.
6. `or` divider.
7. **Use single sign-on** — outline button with a key icon; no handler; inert.
8. **DEMO ACCOUNTS** — a mono, uppercase, letter-spaced label over a four-row list.
9. **Demo setup** — a `<details>` disclosure.

**The demo-account affordance.** Four rows in one bordered card, each an `aria-pressed` button: initials avatar · name · title · a radio-style ring at the right.

| Row | Title | Email written into the form |
|---|---|---|
| RD · R. Devane | Advisor, Paris desk | `r.devane@parisdesk.travel` |
| JD · J. Dubois | Advisor, Paris desk | `j.dubois@parisdesk.travel` |
| MK · M. Keller | Agency lead | `m.keller@parisdesk.travel` |
| AB · A. Blanc | Operations | `a.blanc@parisdesk.travel` |

Selecting a row sets `aria-pressed` (verified: exactly one true at a time), fills the avatar solid, tints the row, thickens the ring, and rewrites both the email and the password fields. The selected row — not the typed email — determines the role that is signed in.

**The "Demo setup" disclosure.** Closed by default; a summary reading `Demo setup` with a chevron that rotates on open. Opened, it reveals one bordered Section: label **Build vintage** and a two-segment control — **Current build** (`v2`) / **March build** (`v1`). The active segment takes a muted fill and semibold weight. Selecting one writes `world` to the demo store immediately, before sign-in, and it carries through into the product. This is the only demo control visible anywhere in the application.

**States**

| State | How to reach | What renders |
|---|---|---|
| Landing (signed out) | any route without a session | R. Devane preselected, disclosure closed, vintage `v2` |
| Account selected | click any of the four rows | selection ring + prefilled credentials for that account |
| Disclosure open | click **Demo setup** | vintage segmented control |
| Vintage `v1` | **March build** | `world:"v1"` written; segment highlights |
| Submitted | **Sign in** (or Enter) | signs in as the selected role and replaces to `/briefing` |
| Submitted with an empty email | clear the field, submit | **still signs in** — there is no validation; credentials are decorative |
| 390 px | narrow the viewport | disclosure moves inline beneath the accounts list |

There is no error state, no loading state, no "wrong password", no rate limit, and no onboarding or account-creation path.

---

## 7. Spec'd but not reachable, and spec/build disagreements

Each row names where the claim is made and what the running app does instead.

| # | Spec | Claim | In the running app |
|---|---|---|---|
| 1 | D §4.1, EP1 | Admin "picks the source, grants scoped credentials, sets the sync cadence" | Add-connection sheet is **SCHEMATIC**: two radios and a "Continue" that closes it. No credential step, no cadence, no connector is created |
| 2 | D §4.5 | Admin chooses **merge into existing or create new** | On `leandre-dup` only **Merge** exists. "Confirm record" and "Reject" are suppressed for duplicates, so "create new" has no control |
| 3 | D U3 | Held candidate "CTAs: open source, fix manually, reject" | `villa-unknown` renders one paragraph naming those three actions and **no CTAs at all** |
| 4 | D U1 | Correction preserves the original extraction "in field history" | A corrected field shows a `corrected · M. Keller` chip; no field history is viewable |
| 5 | D U6 / D6* | Rejection log, so the pipeline's misses stay reviewable | Rejecting produces a banner only; no log surface, and the candidate's state does not change |
| 6 | D E2 / D9* | Re-ingestion arrives as diffs against the confirmed record | No diff surface exists |
| 7 | D E3 / D10* | Batch confirm for high-confidence fields | Described in a **SCHEMATIC**-badged prose Section on `/admin/review`; no batch UI |
| 8 | D X1 | Failed items re-queue with the error shown | No pipeline-failure state anywhere |
| 9 | D U4 / DEC-24 | Health row renders last success **and error state** | Rows show last success plus a state chip; no error text, no retry or reconnect control. At 390 px the last-success column is hidden entirely |
| 10 | D §4.7 | The confirmed record "is now answerable, searchable, linkable" | The confirm banner says so; there is no link from the confirmed candidate to a live record |
| 11 | B EP4 / B3 | Publish-queue mechanics — review, publish, badge rendering | Publish works on item 1. Item 2's **Review source** has no handler; the source-review path does not exist. `0 pending` unreachable |
| 12 | B X1 | Publish failure leaves the previous scope with an explicit retry | No error or retry state on publish |
| 13 | B U5 / §10 | A stale-review queue that sorts oldest-first and escalates | Absorbed into `/notifications` per layout §10b. There is no queue surface; for `lead` and `ops` the `Records` tag does not exist, so `/notices` lands on an empty filter |
| 14 | C U1 / C2 | Candidate matches "ranked **and sourced**" | Candidates carry a strength chip; no provenance or source attribution on a candidate |
| 15 | B §10, C §9, D §9 | "Loading / empty / error states on every screen" | No `loading.tsx`, `error.tsx` or `not-found.tsx` in the app; the `Skeleton` component is unused. The session gate renders a blank screen while rehydrating. Empty states are unreachable on `/admin/review` and `/admin/connections` (static seed) and absent on `/ops/resolution` at zero open |
| 16 | B U3 / D §5 / DEC-09 | Personal material never leaks; admin access is deliberate and audited | The audit *record* renders on `/admin/publish`. But no route is role-guarded: an advisor session reaches every `/admin/*` and `/ops/*` page with all controls live |
| 17 | demo-choreography, build req 1 | Checkpoints "1=morning, 2=pre-conflict, 3=pre-refusal, 4=v1 world, 5=admin, 0=reset" | Nine checkpoints with a different mapping: 5 = ask refusal, 6 = v1 rewind, **8 = admin confirm**. No "pre-conflict" checkpoint |
| 18 | demo-choreography, build req 4 | "Persona switcher (advisor ↔ agency lead)" | Removed by layout-exploration §9 — a persona change is a sign-out and sign-in |
| 19 | — | Identity is consistent | Sign-in advertises `@parisdesk.travel`; Settings and the rest of the product show `@enable.example` |
| 20 | — | Role label is consistent | Account menu: "Advisor, Paris desk". Settings: "Advisor · Paris desk". Two separate label maps |
| 21 | — | Connection health counts agree | `/admin/connections` header: `1 failing` (credentials only). `/settings` and the lead briefing: `2 need attention` (anything not `ok`) |
| 22 | — | Every surface has a way in | `/admin/review` (the queue index) is linked from nowhere in the product. `/notices` is linked from nowhere |

---

## 8. Shortest click-paths — the admin and ops journeys end to end

Each path begins at a signed-out browser. Keyboard alternatives are given where they are shorter.

### 8.1 Journey D — new candidate confirmed (agency lead) · 6 steps

1. `/signin` → click **M. Keller · Agency lead** → **Sign in**. Lands on `/briefing`; the dock is four tiles.
2. Dock → **Notifications**. Tag `Ingestion` shows 2.
3. Click **A new record is waiting for confirmation** (Hotel Sereno Kyoto).
4. In the panel, click **Confirm the record** → `/admin/review/sereno`.
5. Optional correction: pencil on **City** → type → **Save** (chip `corrected · M. Keller`).
6. **Confirm record — stamped M. Keller, today** → green banner, three fields flip to `confirmed`, two stay held.
   *Exit:* dock → Briefing. *Reset:* press `0`.

**Presenter short form:** press `8` (signs in as lead and lands on step 6's screen), then **Confirm record**. Two actions.

### 8.2 Journey D — duplicate resolved by merge (agency lead) · 6 steps

1. Sign in as **M. Keller**.
2. Dock → **Notifications** → tag `Ingestion`.
3. Click **A possible duplicate needs a human decision**.
4. Panel → **Review the match** → `/admin/review/leandre-dup`.
5. In the Important banner, click **Merge** → the sheet shows three `canonical ⟷ incoming` rows.
6. Type a merge reason (required) → **Merge as overlay on canonical** → banner "Merged as an overlay on Maison Léandre — reason stored, attributed to M. Keller."
   *Exit:* Back arrow.

### 8.3 Journey D — connection health (agency lead) · 4 steps

1. Sign in as **M. Keller**.
2. Briefing → **Connection health** widget → **All connections** → `/admin/connections`. (Equivalent: account avatar → **Connections**; or Notifications → `Connections` tag → *Partner portal credentials have expired* → **Open connections**.)
3. Read the failing row: Partner portal · self-hosted fallback · 24 Aug · `credentials expired`.
4. **Add connection** → choose MCP upstream or Self-hosted → **Continue** (schematic; closes).
   *Exit:* Back arrow, or dock → Briefing.

### 8.4 Journey B — advisor notice published agency-wide (agency lead) · 4 steps

1. Sign in as **M. Keller**.
2. Briefing → **Policy and access** widget → **Sharing defaults** → `/admin/publish`. (Equivalent: Notifications → `Knowledge` tag → *Two notices are awaiting publication* → **Review and publish**.)
3. **Publish agency-wide (owner preserved)** on the spa-closure row → banner "Published agency-wide — owner preserved."; the row shows `published · owner preserved`; the header chip drops to `1 pending`.
4. Scroll the same page for the governance context: **Default visibility** (4 record kinds) and **Admin access to personal records** (2 logged break-glass openings, each with reason and expiry).
   *Exit:* dock → Briefing.

### 8.5 Journey C — orphaned payment matched (ops) · 6 steps

1. `/signin` → click **A. Blanc · Operations** → **Sign in**.
2. Briefing shows *Unmatched payments* — EUR 1,272 across 2.
3. Dock → **Notifications** → click **Two payments cannot be matched to a booking**.
4. Panel → **Open matching** → `/ops/resolution`. (The briefing widget expands to the notifications tag, not to this page.)
5. **Match** on the EUR 410 row → select `VO-2214 · booker M. Osei (traveller R. Osei)` (`strong candidate`) → type a reason (required).
6. **Confirm match (attributed)** → row reads `matched · logged`, with "→ VO-2214 · reason: "…" · attributed A. Blanc"; header chip `1 open`.
   *Repeat step 5–6 on the EUR 862 row to reach `0 open`. Exit:* dock → Briefing.

### 8.6 The isolation proof — commissions absent (colleague) · 3 steps

1. Sign in as **J. Dubois**.
2. Briefing: the **Commissions** widget carries no figures and no expand link; **Expiring incentives** is not in the set; **Departures** shows one traveller.
3. Navigate to `/ops/resolution`: the payment amounts are gone from the rows and the match sheet, and a Section states they are absent by policy, not masked.
