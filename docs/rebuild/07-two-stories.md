# 07 — The two stories

**Status:** proposed, 2026-09-25. Replaces the beat list in `docs/presenter/demo-choreography.md` (four personas, presenter keys) for the two-role build. Constantin set the order of each story; this file tightens it, joins the two, and lists what breaks today.

**The rule the stories test:** *a thing acted on is resolved everywhere.* An act on one screen must show on every screen that mentioned it: the insight rail, the Briefing's sentence and chapters, the notification, the dock badge, the queue. Today most acts change only the page they happen on.

---

## The shape

The two stories are one loop, not two tours. Each hands the other its next beat:

- **Owner → advisor.** M. Keller gives R. Devane access to a new document (O8). R. Devane is told (A2), and later the assistant answers her from it (A6).
- **Advisor → owner.** R. Devane shares her Maison Léandre note with the whole agency (A5). It waits in M. Keller's publish queue (O7).

The thread through both is **Maison Léandre**, with the Atelier programme's terms as the document that joins them.

## The owner: M. Keller keeps the agency's knowledge true

| # | Screen | She sees | She does | What changes, everywhere | Today |
|---|---|---|---|---|---|
| O1 | Sign in | two demo accounts | chooses M. Keller | lands on the Briefing | works; the email field ignores what is typed (role follows the row) |
| O2 | Briefing | one sentence of what waits; the rail's first move, *1 of 7* | reads | — | works; the sentence's counts are fixed seed values |
| O3 | Rail → sheet | *Warn the agency about the Lisbon strike* | *Write to the agency*: the sheet opens filled (what, where, the day, how many trips, names withheld); publishes | the announcement is in Knowledge; advisors with Lisbon trips see it in *From the agency*; **the card resolves and the rail moves to 1 of 6** | breaks: the rail says "team", the sheet says "agency"; the sheet opens empty; the card never clears |
| O4 | Knowledge | a new agency document, *dmc-kyoto-2026.xlsx*, and *3 records proposed from this document* | *Confirm them* | — | breaks: "3 records proposed" is printed on every document |
| O5 | Records to confirm | Hotel Sereno Kyoto, field by field | confirms, fixes one, confirms the record; then merges the Maison Leandre duplicate; keys the unreadable name | the queue goes 3 → 0; the Briefing sentence and chapter follow; both notifications are actioned; the record reads *confirmed today by M. Keller* | breaks: the record confirms with 0 fields confirmed; counts never move; the merge is forgotten on navigation; the duplicate's insight is cleared by confirming Sereno instead |
| O6 | Notifications | fewer open: what she did is already actioned; the badge dropped | follows *Four items wait to be published* | — | breaks: nothing she did shows here |
| O7 | Publish queue | R. Devane's items, **the one the rail named already selected** | returns the spa notice with a note; publishes the Kyoto ryokan briefing | R. Devane is told; the vault shows the published document as *whole agency* | breaks: the page's primary says *Publish* on the item the insight said to *Return* |
| O8 | Knowledge → access | *Atelier Collection terms 2027*, just arrived from the agency Drive, **closed to administrators** (O11's rule) | *Share* → R. Devane | the document's history logs it; R. Devane is notified; the assistant may answer her from it | breaks: no new document exists; the only named person is J. Dubois, who cannot sign in; the grant is lost on navigation; nobody is told |

## The advisor: R. Devane sets up and gets to work

| # | Screen | She sees | She does | What changes, everywhere | Today |
|---|---|---|---|---|---|
| A1 | Sign in | — | chooses R. Devane | lands on the Briefing | works |
| A2 | Briefing | first run: the rail's first move is *Connect your mailbox*; a notification that M. Keller shared the Atelier terms with her | *Connect your mailbox* | — | breaks: her Gmail is seeded as already connected; no path from the Briefing to setup |
| A3 | Connections → add | four steps: Mailbox, authorise, what to index (rates, bookings, rep firms), review | connects | a *Mailbox · syncing* row; her documents appear in Knowledge, indexing, private to her; later *Rate note — Corvin & Wells* | breaks: the flow changes no state; nothing appears |
| A4 | Record: Maison Léandre | the agency's record; her layer is empty | *Add note*: "Ask for the courtyard rooms; the street side takes the morning deliveries." | the note is on the record, private to her | breaks: *Save note* sets a flag; the text is lost on navigation |
| A5 | Record → Share | *Share your notes on Maison Léandre*: only me · Team · Paris (at once) · the whole agency (M. Keller releases it) | shares with Team · Paris, or the whole agency | team: at once, teammates told; agency: it is the item waiting in O7 | breaks: directory records have no Share; the note's "whole agency" never reaches the queue |
| A6 | Assistant | *Ask about this* on the record opens the assistant with Maison Léandre as context | "Does the Atelier rate include breakfast?" | the answer cites *Atelier Collection terms 2027*, the document M. Keller gave her in O8 | breaks: the live Ask box does nothing on submit; the assistant exists only in the lab |
| A7 | Assistant acts | *Catch me up* | *Draft the Villa Ortensia reminder*: she watches it open the commission, find the booking, draft; confirms; edits a line; sends | the chase is logged; the Briefing's commission row reads *chased today*; the insight resolves | works in the lab only |
| A8 | (with the builder, `06-itinerary-builder.md`) | the Paris anniversary trip | *Request availability at Maison Léandre* | a hold, then a confirmation she accepts; the commission appears in Money | not built |

## One name per place, one verb per act

| Thing | Today it is called | One name |
|---|---|---|
| The candidate queue | Confirm records · Confirm new records · Records to confirm · the confirmation queue · Open review | **Records to confirm**; the act is **Confirm** |
| Unmatched money | Unmatched payments · Match payments · Open matching · Match this payment | **Unmatched payments**; the act is **Match** |
| Adding a source | Add connection · Connect a source · New connection · Add a connection · Connect source | **Connect a source** |
| Her email | Mailbox · Gmail · Email-in · Inbound mail | **Mailbox** (connected) and **Forwarded mail** (sent to the inbound address) |
| Giving someone access | Change sharing · Share record · Manage access · Apply and log · Apply sharing · Submit for release | **Share**, everywhere |
| Audiences | Just me · Private · My team · Team · Paris · Paris desk | **Only me · {a colleague} · Team · Paris · Whole agency** |
| The announcement | Write to the team · Write to the agency | **Write to the agency** |

These go into `evals/lexicon.json` so tier 1 holds them.

## What else the traces found

- **The advisor still acknowledges the owner's Critical notice** on Hôtel Verlaine (`records/[id]/page.tsx:842-951`), and the acknowledgement is always recorded as R. Devane. The notice composer repeats the rule (`publish-sheets.tsx:155`). The insight and the assistant say to take Verlaine *off* the shortlist, while the page's only action puts it *on*.
- **The shortlist is invisible.** Taking Verlaine off the Paris trip's shortlist removes an insight and nothing else; `/itineraries` never shows a shortlist. The Kyoto schematic carries Hôtel Verlaine (Paris) as a "Day 3 idea".
- **Four owner insights promise more than their destination gives:** *Raise the late payments with Meridian* (no programme column, nothing to raise); *Reconnect the partner portal* (she can only ask A. Blanc, who appears nowhere else); *Retire the notice after 15 Sep* (she can only retire it now); *Match EUR 410* (lands on the whole list, nothing selected).
- **The advisor can write the agency value alone.** *Resolve 3 sources* stores at agency level directly, when every other agency-wide write of hers waits for M. Keller.
- **One booking, three identities.** VO-2214 is Villa Ortensia for S. Marchetti in the ledger, M. Osei's booking in the unmatched payment, and "Verlaine" in the closed payments.
- **Held-field counts disagree.** The notification says two fields are held, the page says three plus one template copy, the confirm banner says four.
- **Presenter traps.** Bare keys 1–3 sign in as R. Devane; *l* toggles the lab; *v* switches the build.

## Build order

1. **The state spine.** Every actionable thing has a subject (insights already carry `subject`). Its state lives in the store; the insight, the notification, the Briefing sentence and chapter, the badge and the queue all read it. This one change repairs O3, O5, O6, O7 and A7 together.
2. **The owner's beats:** the filled announcement; per-candidate confirm state with a *next*; the insight's item selected on arrival; document-scoped candidates; the new Atelier terms document and a grant to a named person that persists and notifies.
3. **The advisor's beats:** first run with the mailbox not connected; the connect flow commits; notes persist; *Share* on the record for her layer; the assistant goes live and the Ask box goes (Ask becomes the list of conversations); the Verlaine acknowledgement goes.
4. **The names** above, into the lexicon.
5. **The seed contradictions.**
6. **`evals/flows-two-roles.mjs`** extended to run the loop: O8 → A2 → A6, and A5 → O7.
