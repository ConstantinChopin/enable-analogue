# 06 — The itinerary builder: a plan

**Status:** proposed 2026-09-25; phases 0–3 built in the lab the same day, with the changes in §13. It sits on U21 in `05-two-roles.md`, which withdrew DEC-10's "no itinerary builder" and deferred the design; this is that design.
**Inputs:** Constantin's market teardown (Sept 2026: Travefy, Tern, TravelJoy, Axus, Safari Portal, Wetu, Vamoos, Tourwriter, Tourplan, Lemax, TripCreator, Moonstride, Kaptio, Fora, Virtuoso, ClientBase/Tres); the production data model (`docs/design/data-model.md`, Itinerary → Day → Event); the seed (`src/data/seed.ts`: `Trip`, `TripLeg`, `shortlist`, `itinerary`, `Commission.program`, `promotions`, `notices`); the evidence (DEC-10, DEC-18, DEC-21, DEC-22, DEC-27, DEC-30, DEC-36; SIG-10, SIG-22, SIG-47).

---

## 1. The position, in one paragraph

The market splits in two. Advisor tools (Travefy, Tern, Safari Portal) make the itinerary the product and are strong at presentation. Operator tools (Tourwriter, Lemax, Tourplan) make the booking the product and are strong at supplier status. The gap between them is the part luxury advisors still do by email: ask a supplier, hold the space, confirm it, retype the reference. **That gap is Enable's native ground.** Enable already treats every fact as an object with a source, an age and a named person who confirmed it (a record's fields, a candidate record, a commission's projected → due → paid). A trip line is one more such fact. So Enable builds the trip where the facts already are (the record, its programme terms, its notices, the traveller's preferences, the commission), and it still does not compete on presentation. DEC-10's instinct survives in a narrower form: **no presentation layer in v1; a clean export and, later, the traveller's phone.**

## 2. What already exists and gets reused

| Already built | Becomes, in the builder |
|---|---|
| `Trip` with `status` pipeline (Inbound → Planning → Booked → Traveling → Traveled) | Unchanged. `Inbound` is now what it always meant: a trip that arrived by import. |
| `TripLeg { kind, on, what, state }` (feeds `worldMeetsClient`) | Generalised into `TripLine` (§3). Existing insights keep working because a line is a leg. |
| `Trip.products[]`, `Trip.shortlist[]`, the schematic `itinerary` | Folded into lines: a product is a line with status past *Idea*; a shortlist item is a line at *Idea*. One list, not three. |
| Record page: notices, programmes, preferences, provenance | What a line inherits the moment it points at a record (`productId`). |
| `Commission { program, projected, state }` | Written by the line: a confirmed line under a programme creates its projected commission. No second entry. |
| `promotions` with booking and travel windows | Checked against the line's dates when it is added and while it waits. |
| Reminder tool on a commission (draft → edit → send; nothing sends itself, SIG-35) | The pattern for the supplier request composer. |
| Confirm new records (a candidate never becomes truth until a named person confirms it) | The pattern for a supplier's reply: parsed, then confirmed by the advisor. |
| Knowledge "Email-in" (forwarded mail, indexed) | Where supplier replies land and are read from. |
| Insight rail (deterministic joins, the model only phrases) | Trip checks: gaps, expiring holds, blocked lines. |
| Assistant tasks (steps on your own screen, a confirm step) | Request and chase in bulk; import a confirmation. |
| Floating card (the inspector slot) | A line's detail, opened from the day list. |

## 3. The model

```ts
type LineKind = "stay" | "dining" | "experience" | "transfer" | "flight" | "note";
type LineStatus = "idea" | "requested" | "held" | "confirmed" | "declined" | "cancelled";

interface TripLine {
  id: string;
  tripId: string;
  kind: LineKind;
  on: string;               // ISO date; a stay spans on → until
  until?: string;
  time?: string;
  what: string;             // as a person reads it: "Maison Léandre, four nights"
  productId?: string;       // the cross-link (data model: source_product_id). Everything a record knows reaches the line through this.
  program?: string;         // the programme it is booked under; one of the record's programmes
  status: LineStatus;
  holdUntil?: string;       // held only: when the supplier releases the space
  confirmation?: { ref: string; by: Persona; at: string; sourceDoc?: string };  // who confirmed, from which reply
  requests: SupplierRequest[];
  deposit?: { amount: number; due: string; paid?: string };  // tracked, never collected
  options?: string[];       // other line ids competing for the same slot (a client choice; phase 4)
}

interface SupplierRequest {
  id: string; sentAt: string; to: string;         // the record's reservations contact or rep firm
  asked: string;                                  // the drafted text, as sent
  reply?: { at: string; doc: string;              // the Email-in document it arrived as
            read: { status: "held" | "confirmed" | "declined"; until?: string; ref?: string };
            confirmedBy?: Persona };              // null until the advisor accepts what was read
}
```

**The status, in words a person reads** (every chip carries its word; colour only adds):

| Status | Chip | Means | Moves to |
|---|---|---|---|
| idea | *Idea* | on the trip, nobody asked yet | requested, or removed |
| requested | *Asked 2 days ago* | a request went out; no reply yet | held, confirmed, declined |
| held | *Held until 04 Sep* (amber inside 48h) | the supplier is keeping it | confirmed, or lapses back to idea |
| confirmed | *Confirmed · PA-88812* | a reference exists, and a named person accepted it | cancelled |
| declined | *Declined* | the supplier said no | removed, or swapped |
| cancelled | *Cancelled* | was confirmed, then undone | (end) |

Payment states (deposit paid, paid in full) are **not** line statuses. They are money, they live on the deposit field and in the Money area, and Enable tracks them without collecting them.

**What is derived, never stored:** the trip's alert ("transfer unconfirmed" today is typed by hand in the seed), the departure checklist count, `Trip.products`, the projected commission, and every check in §5.

## 4. The screens

**The ledger stays** (`/itineraries`, Clients area). What changes: the inspector's "Open the trip" goes to a real route instead of the schematic block under the ledger.

**The trip page** (`/itineraries/[id]`, new), in the record page's anatomy:
1. **Title row:** trip name as the title; traveller and dates beneath; status and "departs in N days" chips; actions on the same line: *Add to trip*, *Share*.
2. **What is not settled:** one line per open matter, the way a record summarises its unsettled fields. "2 ideas not asked yet · 1 hold ends Friday · the Verlaine idea is blocked." Each links to its line.
3. **The days:** one continuous list, day headers as dates. A stay is drawn once as a band across its nights, not repeated each day (the Safari Portal "classic" reading, property-led, which is how luxury FIT trips are planned). Each line is a two-line row: the thing, then kind · time · status chip. No calendar grid in v1.
4. **The floating card** for a selected line: the record in miniature (photo, verified date), the programme it is under with its amenities and, for those who may see money, its commission; the record's notices; the request log; the reply as read; the one primary for its state (*Request availability* / *Confirm what they said* / *Mark confirmed by hand*).

**Adding a line** happens in the same search as ⌘K, narrowed to records and filtered by the trip's destinations. The checks run at the moment of choice, where DEC-27 put them: a preference conflict warns in amber but does not block; a Critical notice blocks the line from being requested, says why, and names its owner. The advisor is never asked to acknowledge the owner's notice (decided 2026-09-25); she can keep it as an idea or swap it.

**Requesting availability** uses the Reminder tool's pattern: a drafted request filled from the line and the traveller (party, dates, room, the anniversary), edited, then sent by the advisor. Nothing sends itself.

**The reply** lands in Email-in, is read into status, date and reference, and waits on the line as *Reply read: held until 04 Sep · PA-88812*. The advisor accepts it (*Confirm what they said*) or corrects it. Same law as Confirm new records: what a machine read is a candidate until a named person accepts it.

## 5. The checks (quality, not generation)

The research is clear that AI's value here is in bringing data in and checking it, not in generating trips. Each check is a deterministic join, phrased by the model, shown on the trip page's rail and, when urgent, on the Briefing:

| Check | Join | Tier |
|---|---|---|
| A night with no stay | stays × nights of the trip | 2 |
| An arrival with no transfer | flight or first stay × transfer lines on that day | 2 |
| A hold ends soon | held × holdUntil within 48h | 1 |
| A request with no reply | requested × sentAt older than 48h | 3 |
| A line on a blocked record | line.productId × Critical notice | 1 |
| A preference against a line | traveller preference × record tags | 3 |
| An incentive window closes before the line is confirmed | promotion.bookingWindowEnd × line not confirmed (already `deadlineMeetsClient`) | 2 |
| An outside event on a line's day | world event × line.on (already `worldMeetsClient`) | 1 |
| A deposit is due | deposit.due within 7 days, unpaid | 2 |

The owner gets none of these for other advisors' trips by name. She gets counts, as with `deskTrips`: "3 holds end this week across the desk, names withheld."

## 6. The assistant

- **Do:** *Request availability for every idea on this trip* (drafts one request per line, shows each on the page, one confirm for the batch, sends only what she kept). *Chase every request with no reply in 48 hours.* *Read this confirmation into the trip* (a PDF or forwarded mail becomes line candidates).
- **Go:** *See what is not confirmed on trips leaving this month.* *See the Paris trip's holds.*

## 7. Roles and sharing

A trip is the advisor's, private by default (DEC-30). She shares it the way she shares a traveller: a named colleague at Full or Basic, her team at once, the whole agency through the owner's publish queue. The owner never opens, edits or acts on another advisor's trip. Her part in the builder is agency-level and already exists: the programme terms and supplier contacts the lines read from, and the counts.

## 8. The thread: Paris, thirtieth anniversary

The seed already holds the demo slice. L. Grandin, 03–07 Dec, *Planning*, Maison Léandre as the product, Hôtel Verlaine shortlisted under a Critical notice. The story in six beats:
1. The trip opens with one stay confirmed and Verlaine as a blocked idea. The rail says why and names M. Keller's notice.
2. She adds dinner on the anniversary night from records; the preference check passes.
3. She asks the assistant to request availability for the two ideas. The drafts appear on the page; she edits one line; she sends.
4. A reply arrives in Email-in: *held until 30 Nov, ref ML-4471*. She confirms what it says.
5. Maison Léandre is under Atelier, so its projected commission appears in Money without anyone typing it.
6. On the Briefing the next morning, the hold is the first move: "The Maison Léandre hold ends Friday."

This thread also replaces the Kyoto schematic, which today carries a Paris hotel as a "Day 3 idea" on a Japan trip.

## 9. Phases

| Phase | Scope | Proves |
|---|---|---|
| 0 · The model | `TripLine`, seeded for Paris and Lisbon; `legs`, `products`, `shortlist` and the schematic derived from lines; the trip route with the days list and the "not settled" summary | a trip is a list of facts with status |
| 1 · Add and inherit | Add from records with notices, programmes, preferences and incentives checked at the moment of choice; status by hand | the record's knowledge reaches the trip |
| 2 · Ask and hear back | Request composer; the reply read from Email-in and confirmed; holds and their expiry; confirmed line writes the projected commission | the gap the market leaves open |
| 3 · Checks and the assistant | §5 on the rail and the Briefing; §6 tasks | quality control, not generation |
| 4 · The client (later) | Options per slot with client choice, pricing visibility, export (PDF, and to Travefy/Axus), then the traveller's phone | only once the facts are solid |

## 10. Cut, and why

- **Taking payment or card authorisation.** Enable is not a processor. It tracks deposits and commissions; it collects nothing.
- **Live booking engines.** Integrate where they exist (a line can carry a booking engine's reference), never rebuild one.
- **"Generate a seven-day trip."** Low value for luxury work, and it undermines the product's one promise: everything has a source.
- **A calendar grid.** A day list with stays as bands reads a luxury trip better; revisit only if activity-heavy trips (safari, expedition) need it.
- **A supplier-facing reply link** (Lemax's YES/NO) is deferred, not cut: it is a new surface with its own trust questions. Email-in covers the prototype.

## 11. Decisions for Constantin

1. **Does Enable ever present to the client?** Recommendation: not in v1. Export first, the traveller's phone later. This keeps DEC-10's reason alive.
2. **The status words.** Proposed: *Idea · Asked · Held until … · Confirmed · Declined · Cancelled*. The operator codes (RQ/KK/WL) are precise but foreign to an advisor.
3. **Programme terms land with the builder.** The pending record work (a property's terms change with the programme it sits in) is the same object a line chooses from. Build them together, record first.

## 12. Harness

- `evals/contracts.mjs`: `/itineraries/[id]` — job "get a trip to confirmed"; one primary per line state.
- Tier 1: a new rule, "a line status with no word"; every status chip carries its word.
- Tier 2: the trip page on both roles; the owner is refused another advisor's trip.
- `evals/flows-two-roles.mjs`: a trip shared with the whole agency waits in the publish queue; a confirmed line's commission appears in Money for a role that may see money and not for one that may not.

---

## 13. Decided and built, 2026-09-25 (in the lab)

**Built:** trip lines, the trip page, add from records or by hand, requests, scripted replies read and accepted, holds, checks on the trip's rail and the Briefing, the ask-every-idea task, projected commission, New trip (from the list and from a traveller). Code: `src/data/trip-lines.ts`, `src/lib/trip-checks.ts`, `src/lib/draft-trip.ts`, `src/app/itineraries/[id]/page.tsx`, `src/components/new-trip.tsx`, `src/components/supplier-replies.tsx`.

**Days as tabs (Constantin).** The trip opens on **Overview** (where it stands, then every day compact), then one tab per day. The stay band runs under the tabs across the nights each stay covers, whatever tab is open; a night with nowhere to sleep is a warn chip in the band. A day's tab holds its lines in full, with "Add to" for that day. This replaces §4's single continuous list.

**The assistant drafts (Constantin), reversing §10's cut of "generate a trip".** What made generation low value was invention; the draft here only assembles from the traveller's profile and the agency's records, and says why for each line. It asks at most three questions, with tap-to-answer options (who, skipped from a traveller's page; where and when; what it is for and how full the days), plays the brief back, and drafts on screen: the trip appears, then each step's lines. A draft fills stays, a car at each end, one or two things a day by pace (a slow pace keeps one day free), and a dinner on the occasion's night; never the travellers' own trains or flights. Every line arrives **Suggested** with its reason and source: Keep, Swap or Remove, or Keep all. Nothing is asked of a supplier until a suggestion is kept. The New trip sheet offers the same flow ("Let Enable draft it"), handing over what is filled in.

**One card on the right.** A line's card, a conversation or the rail: never two. Closing a conversation gives the rail back on the insight it was asked about.
