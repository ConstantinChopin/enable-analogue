/**
 * Trip lines — the itinerary builder's model (docs/rebuild/06-itinerary-builder.md).
 *
 * A trip is a list of lines, and a line is a fact with a status, like every other fact
 * in Enable: it points at a record when it can (and inherits the record's notices,
 * programme terms and the traveller's preferences through it), it keeps every request
 * sent about it, and it becomes confirmed only when a named person accepts what a
 * supplier said. The market's advisor tools make the itinerary the product and its
 * operator tools make the booking the product; the gap between them (ask, hold,
 * confirm, retype the reference) is where this model lives.
 *
 * Status words, not operator codes (RQ/KK/WL): Idea · Asked · Held until … · Confirmed ·
 * Declined · Cancelled. Payment is not a line status: deposits are money, tracked on the
 * line and never collected.
 *
 * Everything here is fictional: suppliers, references, replies and prices.
 */
import { productById, trips, personName, programmes, programmeLinks, type Persona, type Trip } from "@/data/seed";

export type LineKind = "stay" | "transfer" | "dining" | "experience" | "note";
export type LineStatus = "idea" | "requested" | "held" | "confirmed" | "declined" | "cancelled";

export interface SupplierReply {
  /** When it arrived, as read. */
  at: string;
  /** The mail it arrived as, in Knowledge → Forwarded mail. */
  doc: string;
  /** What the reply was read to say: a candidate until a named person accepts it. */
  read: { status: "held" | "confirmed" | "declined"; until?: string; ref?: string; note?: string };
  accepted?: { by: Persona; at: string };
}

export interface LineRequest {
  id: string;
  kind: "availability" | "confirm" | "chase";
  /** "28 Aug 10:14" */
  sentAt: string;
  /** ISO date, for the 48-hour check. */
  sentOn: string;
  to: string;
  text: string;
  by: Persona;
  /** When the demo's supplier answers (ms since epoch). */
  replyAt?: number;
  reply?: SupplierReply;
}

export interface TripLine {
  id: string;
  tripId: string;
  kind: LineKind;
  /** ISO date. A stay runs from `on` to `until` (the morning it ends). */
  on: string;
  until?: string;
  time?: string;
  /** As a person reads it: "Maison Léandre, four nights". */
  what: string;
  detail?: string;
  /** The cross-link. Everything a record knows reaches the line through this. */
  productId?: string;
  /** The programme it is booked under: one of the record's programmes. */
  program?: string;
  /** Who is asked. A record's reservations desk, or a supplier typed by hand. */
  supplier?: { name: string; email: string };
  status: LineStatus;
  holdUntil?: string;
  /** Booked by the travellers themselves, or accepted from a reply by a named person. */
  confirmation?: { ref: string; by: Persona | "traveller"; at: string; source?: string };
  /** What the traveller pays for this line, EUR. The commission is worked from it. */
  sell?: number;
  requests: LineRequest[];
  /** Put here by the assistant's draft, not yet kept: why it was chosen, and from what.
      A suggestion is asked about only once the advisor keeps it. */
  suggested?: { reason: string; source: string };
}

/** What the assistant knows about a trip it is about to draft, question by question.
    `awaiting` is the question it asked last; the next reply answers it. */
export interface DraftBrief {
  tripId: string;
  who?: { id: string; name: string };
  where?: string;
  from?: string;
  to?: string;
  occasion?: string;
  pace?: "slow" | "full";
  awaiting?: "who" | "where" | "when" | "purpose" | "confirm" | "change";
}

/* ── the days a trip covers ──────────────────────────────────────────────────── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n: number) => String(n).padStart(2, "0");

/** "12–19 Oct 2026" or "20 Sep–04 Oct 2026" → ["2026-10-12", "2026-10-19"]. */
export function spanOf(t: Trip): [string, string] | null {
  const m = t.dates.match(/^(\d{1,2})(?:\s([A-Z][a-z]{2}))?[–-](\d{1,2})\s([A-Z][a-z]{2})\s(\d{4})/);
  if (!m) return null;
  const endMonth = MONTHS.indexOf(m[4]);
  const startMonth = m[2] ? MONTHS.indexOf(m[2]) : endMonth;
  const year = Number(m[5]);
  const startYear = startMonth > endMonth ? year - 1 : year;
  return [`${startYear}-${pad(startMonth + 1)}-${pad(Number(m[1]))}`, `${year}-${pad(endMonth + 1)}-${pad(Number(m[3]))}`];
}

export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** Every date of the trip, first to last (the last is the day they go home). */
export function daysOf(t: Trip): string[] {
  const span = spanOf(t);
  if (!span) return [];
  const out: string[] = [];
  for (let d = span[0]; d <= span[1]; d = addDays(d, 1)) out.push(d);
  return out;
}
/** "2026-12-05" → "Sat 5 Dec". */
export function dayLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
/** ["2026-12-03", "2026-12-07"] → "03–07 Dec 2026"; across months, "20 Sep–04 Oct 2026". */
export function datesLabel(from: string, to: string): string {
  const d = (iso: string) => iso.slice(8, 10);
  const m = (iso: string) => MONTHS[Number(iso.slice(5, 7)) - 1];
  return from.slice(0, 7) === to.slice(0, 7)
    ? `${d(from)}–${d(to)} ${m(to)} ${to.slice(0, 4)}`
    : `${d(from)} ${m(from)}–${d(to)} ${m(to)} ${to.slice(0, 4)}`;
}

/** "2026-08-30" → "30 Aug". */
export const shortDate = (iso: string) => `${iso.slice(8, 10)} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
export const nightsOf = (l: TripLine) => (l.until ? Math.round((Date.parse(l.until) - Date.parse(l.on)) / 86_400_000) : 0);

/* ── the words for a status ──────────────────────────────────────────────────── */

export function statusWord(l: TripLine, today: string): string {
  switch (l.status) {
    case "idea": return "Idea";
    case "requested": {
      const last = l.requests[l.requests.length - 1];
      const days = last ? Math.round((Date.parse(today) - Date.parse(last.sentOn)) / 86_400_000) : 0;
      return days <= 0 ? "Asked today" : days === 1 ? "Asked yesterday" : `Asked ${days} days ago`;
    }
    case "held": return l.holdUntil ? `Held until ${shortDate(l.holdUntil)}` : "Held";
    case "confirmed": return "Confirmed";
    case "declined": return "Declined";
    case "cancelled": return "Cancelled";
  }
}

/* ── programme terms: what a property gives under each programme it sits in ──────
   The same object the record shows (a property's terms change with the programme,
   Constantin 2026-09-24): read from the programme links in the seed, so a line and the
   record can never disagree (2026-09-28). A line chooses one; its commission is worked
   from it. */
export interface ProgrammeTerms { rate: number; amenities: string[]; conditions: string }

export function termsFor(productId: string, program: string): ProgrammeTerms | null {
  const link = programmeLinks.find((l) => l.productId === productId && l.programme === program);
  if (!link) return null;
  const rate = Number(link.rate.replace("%", "")) / 100;
  const prog = programmes[link.programme];
  return {
    rate: Number.isFinite(rate) ? rate : 0,
    amenities: link.clientAmenities.map((a) => a.benefit),
    conditions: `Booked on the ${prog.name} rate${link.code ? ` (${link.code})` : ""}. Commission paid ${prog.paid}.`,
  };
}

/* ── who is asked ────────────────────────────────────────────────────────────── */

export function supplierOf(l: Pick<TripLine, "supplier" | "productId">): { name: string; email: string } | null {
  if (l.supplier) return l.supplier;
  const p = l.productId ? productById(l.productId) : undefined;
  if (!p) return null;
  const slug = p.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, "");
  return { name: `${p.name} reservations`, email: `reservations@${slug}.example` };
}

/* ── the traveller's preferences a line is checked against ──────────────────────
   Each has the record tags it argues with. S. Marchetti's come from her profile; the
   others are seeded here until their profiles are built. `prefers` is the preference in
   the words the conflict sentence uses, and `sources` how many sources hold it
   ("L. Grandin prefers classic interiors (3 sources); Hôtel Verlaine is contemporary",
   FB-02, 2026-09-28). L. Grandin's list is her profile's five (the traveller page reads it). */
export interface Preference { text: string; avoid?: string[]; source: string; sources?: number; prefers?: string }
export const preferencesOf: Record<string, Preference[]> = {
  "L. Grandin": [
    { text: "Classic interiors, never contemporary", avoid: ["contemporary design"], source: "call notes, 14 Jul", sources: 3, prefers: "classic interiors" },
    { text: "A quiet room, away from the street", source: "email, 02 Aug" },
    { text: "No shellfish", source: "TripSuite" },
    { text: "Dinner no earlier than 20:00", source: "email, 02 Aug" },
    { text: "Walks rather than guided tours", source: "call notes, 14 Jul" },
  ],
  "S. Marchetti": [
    { text: "Prefers classic interiors", avoid: ["contemporary design"], source: "email extract, 12 May", sources: 3, prefers: "classic interiors" },
    { text: "Kaiseki over French dining", source: "call transcript, Jan" },
  ],
  "A. Whitfield": [{ text: "Hates waiting at airports", source: "call notes, 30 Jul" }],
  "T. & P. Osei": [{ text: "Sea views, always", source: "email, 12 Jun" }],
};

/* ── drafting a request ──────────────────────────────────────────────────────── */

const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const LONG_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const longDay = (iso: string) => { const d = new Date(`${iso}T12:00:00Z`); return `${LONG_DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${LONG_MONTHS[d.getUTCMonth()]}`; };
const words = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** The request, drafted from the line and the trip. Nothing sends itself: this is the
    text an advisor reads, edits and sends. */
export function draftRequest(l: TripLine, kind: LineRequest["kind"], signer: string, trip?: Trip): string {
  const t = trip ?? trips.find((x) => x.id === l.tripId);
  const who = t?.traveller ?? "our clients";
  const occasion = t?.title.includes("anniversary") ? " It is their thirtieth anniversary." : "";
  const detail = l.detail ? ` (${l.detail})` : "";
  const sign = `\n\nWith thanks,\n${signer}`;
  if (kind === "confirm") {
    return `Hello,\n\nPlease confirm what you are holding for ${who}: ${l.what}${detail}, from ${longDay(l.on)}. Could you send the confirmation number?${sign}`;
  }
  if (kind === "chase") {
    return `Hello,\n\nI wrote about ${l.what.toLowerCase()} for ${who} and have not heard back. Could you let me know today whether it is possible?${sign}`;
  }
  switch (l.kind) {
    case "stay": {
      const n = nightsOf(l);
      return `Hello,\n\nDo you have a room for two${detail}, arriving ${longDay(l.on)} and leaving ${longDay(l.until ?? l.on)} (${words[n] ?? n} nights), for ${who}?${occasion}${l.program ? ` We book on the ${l.program} rate.` : ""} If it is available, please hold it and tell me until when.${sign}`;
    }
    case "dining":
      return `Hello,\n\nCould you hold a table for two on ${longDay(l.on)}${l.time ? ` at ${l.time}` : ""}, for ${who}?${occasion}${l.detail ? ` They would love ${l.detail.split(";")[0]}.` : ""}${sign}`;
    case "transfer":
      return `Hello,\n\nCould you book ${l.what.toLowerCase()} on ${longDay(l.on)}${l.time ? ` at ${l.time}` : ""} for ${who}, two passengers with luggage? Please send the driver's name and a reference.${sign}`;
    default:
      return `Hello,\n\nIs ${l.what.toLowerCase()} possible on ${longDay(l.on)}${l.time ? ` at ${l.time}` : ""} for ${who}, two guests? If so, please hold it and tell me until when.${sign}`;
  }
}

/* ── the demo's suppliers: what each one answers ────────────────────────────────
   Scripted, so a demo cannot hang. Each reply lands in Forwarded mail and is READ into
   a status, a date and a reference: a candidate until the advisor accepts it. */
export function replyFor(l: TripLine, kind: LineRequest["kind"]): SupplierReply["read"] & { subject: string } {
  const subject = `Re: ${l.what}`;
  if (kind === "confirm") return { status: "confirmed", ref: l.productId === "maison-leandre" ? "ML-4471" : `CF-${l.id.toUpperCase()}`, subject };
  switch (l.id) {
    case "p2": case "p8": return { status: "confirmed", ref: l.id === "p2" ? "CP-2210" : "CP-2211", note: "Driver: Karim, black Mercedes E-class, waits at the Eurostar arrivals exit.", subject };
    case "p5": return { status: "held", until: "2026-11-20", note: "Friday mornings are possible before opening. We hold 09:00 for two until 20 November.", subject };
    case "p6": return { status: "declined", note: "We are full at 20:00 that Saturday. The window table is free at 21:30 if that suits.", subject };
    case "l2": return { status: "confirmed", ref: "LPD-7781", note: "Strike day: the driver will take the A1 and allow 40 extra minutes. He will be at arrivals from 11:30.", subject };
    case "a1": return { status: "held", until: "2026-09-04", note: "A sea-view suite is available. We hold it until 4 September.", subject };
    default:
      return l.kind === "dining"
        ? { status: "confirmed", ref: `TB-${l.id.toUpperCase()}`, subject }
        : { status: "held", until: addDays(TODAY, 3), subject };
  }
}

/** The seeded morning (the Briefing's "Friday 28 August"). */
export const TODAY = "2026-08-28";

/* ── the seeded trips ─────────────────────────────────────────────────────────── */

const CHAUFFEURS = { name: "Chauffeurs de Paris", email: "bookings@chauffeursdeparis.example" };
const LISBOA = { name: "Lisboa Private Drivers", email: "ops@lisboadrivers.example" };

export const seedLines: TripLine[] = [
  /* Paris, thirtieth anniversary — L. Grandin, 03–07 Dec. The demo's thread: one stay
     held, one alternative blocked by the agency's Critical notice, four ideas not asked. */
  { id: "p1", tripId: "paris-anniversary", kind: "transfer", on: "2026-12-03", time: "13:47", what: "Eurostar from London, arrives Gare du Nord", status: "confirmed", confirmation: { ref: "9Q2LKX", by: "traveller", at: "12 Aug" }, requests: [] },
  { id: "p2", tripId: "paris-anniversary", kind: "transfer", on: "2026-12-03", time: "14:15", what: "Car from Gare du Nord to Maison Léandre", supplier: CHAUFFEURS, status: "idea", requests: [] },
  { id: "p3", tripId: "paris-anniversary", kind: "stay", on: "2026-12-03", until: "2026-12-07", time: "15:00", what: "Maison Léandre, four nights", detail: "a courtyard room, away from the street", productId: "maison-leandre", program: "Atelier", sell: 4600, status: "held", holdUntil: "2026-08-30",
    requests: [{ id: "p3-r1", kind: "availability", sentAt: "24 Aug 09:40", sentOn: "2026-08-24", to: "reservations@maisonleandre.example", text: "", by: "user",
      reply: { at: "24 Aug 15:02", doc: "Re: Maison Léandre, four nights", read: { status: "held", until: "2026-08-30", note: "A courtyard room is free. We hold it until 30 August." }, accepted: { by: "user", at: "25 Aug" } } }] },
  { id: "p4", tripId: "paris-anniversary", kind: "stay", on: "2026-12-03", until: "2026-12-07", what: "Hôtel Verlaine, four nights", detail: "the alternative, if Léandre falls through", productId: "hotel-verlaine", program: "Meridian", sell: 3900, status: "idea", requests: [] },
  { id: "p5", tripId: "paris-anniversary", kind: "experience", on: "2026-12-04", time: "09:00", what: "Private morning at the Musée Rodin", supplier: { name: "Musée Rodin, group bookings", email: "groupes@musee-rodin.example" }, status: "idea", requests: [] },
  { id: "p6", tripId: "paris-anniversary", kind: "dining", on: "2026-12-05", time: "20:00", what: "Anniversary dinner, Le Clos Arsène", detail: "the table by the window; they celebrated their tenth here", supplier: { name: "Le Clos Arsène", email: "reservations@closarsene.example" }, status: "idea", requests: [] },
  { id: "p7", tripId: "paris-anniversary", kind: "note", on: "2026-12-06", what: "A free day", detail: "they asked for nothing planned", status: "confirmed", requests: [] },
  { id: "p8", tripId: "paris-anniversary", kind: "transfer", on: "2026-12-07", time: "11:15", what: "Car from Maison Léandre to Gare du Nord", supplier: CHAUFFEURS, status: "idea", requests: [] },
  { id: "p9", tripId: "paris-anniversary", kind: "transfer", on: "2026-12-07", time: "12:13", what: "Eurostar to London", status: "confirmed", confirmation: { ref: "9Q2LKX", by: "traveller", at: "12 Aug" }, requests: [] },

  /* Lisbon, four nights — A. Whitfield, 02–06 Sep. The strike day's transfer is not booked. */
  { id: "l1", tripId: "lisbon-short", kind: "transfer", on: "2026-09-02", time: "11:40", what: "Flight from Geneva, lands at Lisbon airport", status: "confirmed", confirmation: { ref: "TP 941", by: "traveller", at: "30 Jul" }, requests: [] },
  { id: "l2", tripId: "lisbon-short", kind: "transfer", on: "2026-09-02", time: "12:15", what: "Airport to Palácio das Amoreiras", supplier: LISBOA, status: "idea", requests: [] },
  { id: "l3", tripId: "lisbon-short", kind: "stay", on: "2026-09-02", until: "2026-09-06", time: "15:00", what: "Palácio das Amoreiras, four nights", productId: "palacio-amoreiras", program: "Atelier", sell: 8400, status: "confirmed", confirmation: { ref: "PA-1902", by: "user", at: "14 Jun" }, requests: [] },
  { id: "l4", tripId: "lisbon-short", kind: "dining", on: "2026-09-03", time: "20:30", what: "Dinner, Taberna do Largo", status: "confirmed", confirmation: { ref: "by phone", by: "user", at: "20 Aug" }, requests: [] },
  { id: "l5", tripId: "lisbon-short", kind: "transfer", on: "2026-09-06", time: "10:30", what: "Palácio das Amoreiras to the airport", supplier: LISBOA, status: "confirmed", confirmation: { ref: "LPD-5520", by: "user", at: "20 Aug" }, requests: [] },

  /* Kyoto & Kansai — S. Marchetti, 12–19 Oct. Four nights have no stay yet. */
  { id: "k1", tripId: "kyoto-kansai", kind: "transfer", on: "2026-10-12", time: "14:20", what: "Kyoto station to the ryokan", detail: "the driver holds a name card", supplier: { name: "Kyoto Private Cars", email: "desk@kyotocars.example" }, status: "confirmed", confirmation: { ref: "KT-3309", by: "user", at: "02 Aug" }, requests: [] },
  { id: "k2", tripId: "kyoto-kansai", kind: "stay", on: "2026-10-12", until: "2026-10-15", time: "15:00", what: "Ryokan Suikawa, three nights", detail: "garden wing", productId: "ryokan-suikawa", program: "Meridian", sell: 5400, status: "confirmed", confirmation: { ref: "RS-7712", by: "user", at: "28 Jul" }, requests: [] },
  { id: "k3", tripId: "kyoto-kansai", kind: "dining", on: "2026-10-12", time: "19:30", what: "Dinner, Gion Watanabe", detail: "counter seats", status: "confirmed", confirmation: { ref: "GW-118", by: "user", at: "02 Aug" }, requests: [] },
  { id: "k4", tripId: "kyoto-kansai", kind: "dining", on: "2026-10-14", time: "19:00", what: "Kaiseki, Kikunoi Honten", supplier: { name: "Kikunoi Honten", email: "reserve@kikunoi.example" }, status: "idea", requests: [] },
  { id: "k6", tripId: "kyoto-kansai", kind: "transfer", on: "2026-10-19", time: "10:00", what: "Shinkansen to Tokyo", status: "confirmed", confirmation: { ref: "JR-55120", by: "traveller", at: "04 Aug" }, requests: [] },

  /* Amalfi, return visit — T. & P. Osei, 11–18 Oct. The +3% window closes on 05 Sep. */
  { id: "a1", tripId: "amalfi-return", kind: "stay", on: "2026-10-11", until: "2026-10-18", time: "15:00", what: "Villa Ortensia, seven nights", detail: "a sea-view suite", productId: "villa-ortensia", program: "Meridian", sell: 9800, status: "idea", requests: [] },
  { id: "a2", tripId: "amalfi-return", kind: "transfer", on: "2026-10-11", time: "13:00", what: "Naples airport to Praiano", supplier: { name: "Costiera Transfers", email: "book@costiera.example" }, status: "idea", requests: [] },
];

/* The seeded request reads as it was sent. */
for (const l of seedLines) for (const r of l.requests) if (!r.text) r.text = draftRequest(l, r.kind, personName[r.by]);

/** A trip's lines, in the order a day is lived. */
export function linesOf(all: TripLine[], tripId: string): TripLine[] {
  return all
    .filter((l) => l.tripId === tripId && l.status !== "cancelled")
    .sort((a, b) => (a.on === b.on ? (a.time ?? "99").localeCompare(b.time ?? "99") : a.on.localeCompare(b.on)));
}

/** "28 Aug 10:14": the seeded day, at the real time of the click. */
export function stamp(): string {
  const d = new Date();
  return `28 Aug ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
