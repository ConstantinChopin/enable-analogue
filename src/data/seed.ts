/**
 * Seed data — the single source for every screen.
 * Schema-conformant per docs/design/data-model.md; deterministic (no Date.now anywhere).
 * World note: `v1` mirrors the March build (auto-expire advisories); `v2` is current.
 * Persona note (plate-aligned): advisor = R. Devane (RD) · colleague = J. Dubois (JD)
 * · agency lead/admin = M. Keller (MK) · ops = A. Blanc (AB). Traveller = S. Marchetti (client).
 */

export type Layer = "canonical" | "agency" | "personal";
export type Persona = "advisor" | "colleague" | "lead" | "ops";
export type World = "v1" | "v2";

export interface Source {
  what: string; // snippet
  where: string; // human label
  uri: string; // provenance URI scheme
  when: string; // display date
  kind: "intranet" | "gdrive" | "email" | "axus" | "tripsuite" | "portal" | "manual";
}

export interface Field {
  key: string;
  label: string;
  value: string;
  layer: Layer;
  source: Source;
  state?: "conflict" | "stale" | "template" | "edited-overlay";
  staleDays?: number;
  /** for edited-overlay: the canonical value preserved beneath */
  beneath?: { value: string; source: Source };
}

export interface ConflictSource {
  id: string;
  label: string;
  detail: string;
  when: string;
  value: string;
  status: string; // "Signed terms" | "Superseded rate" | "Uncorroborated"
  agree: number; // of total
  total: number;
}

export const commissionConflict = {
  productId: "maison-leandre",
  field: "Commission rate",
  layerStored: "agency" as Layer,
  headline: "Three sources disagree. The product will not pick one.",
  sources: [
    { id: "portal", label: "Partner portal", detail: "Atelier Collection terms", when: "12 Mar 2026", value: "12%", status: "Signed terms", agree: 3, total: 4 },
    { id: "feed", label: "Booking platform", detail: "Rate feed", when: "28 Feb 2026", value: "10%", status: "Superseded rate", agree: 1, total: 4 },
    { id: "manual", label: "Manual entry", detail: "Keyed by JB", when: "03 Apr 2026", value: "14%", status: "Uncorroborated", agree: 1, total: 4 },
  ] as ConflictSource[],
  impact: [
    { surface: "Directory row", value: "12%" },
    { surface: "Quotes and proposals", value: "12%" },
    { surface: "Answers in chat", value: "12%" },
  ],
  otherFields: [
    { label: "Address", layer: "canonical" },
    { label: "Rooms", layer: "canonical" },
    { label: "Programme", layer: "agency" },
    { label: "Rep firm", layer: "agency" },
  ] as { label: string; layer: Layer }[],
};

export interface Product {
  id: string;
  name: string;
  city: string;
  country: string;
  category: "Hotel" | "Cruise" | "DMC" | "Rep firm";
  luxuryTier: "Ultra-Luxury" | "Luxury" | "Premium" | "Boutique";
  status: "Active" | "Coming Soon" | "Closed";
  brand?: string;
  programs: string[];
  rate: string;
  ratePerLink?: boolean;
  lastVerified: string;
  updated: string;
  evidence: { kind: "verified" | "stale" | "disagree" | "incentive"; label: string };
  address?: string;
  rooms?: number;
  repFirm?: string;
  hasNotice?: boolean;
  tags?: string[]; // e.g. "contemporary design"
}

export const products: Product[] = [
  { id: "maison-leandre", name: "Maison Léandre", city: "Paris 4e", country: "France", category: "Hotel", luxuryTier: "Ultra-Luxury", status: "Active", brand: "Atelier Collection", programs: ["Atelier", "Meridian"], rate: "12%", ratePerLink: true, lastVerified: "Mar", updated: "12 Jun", evidence: { kind: "disagree", label: "3 sources disagree" }, address: "14 rue de Sévigné", rooms: 42, repFirm: "Corvin & Wells", hasNotice: true },
  { id: "palacio-amoreiras", name: "Palácio das Amoreiras", city: "Lisbon", country: "Portugal", category: "Hotel", luxuryTier: "Luxury", status: "Active", programs: ["Atelier"], rate: "12%", lastVerified: "May", updated: "26 May", evidence: { kind: "verified", label: "verified" } },
  { id: "riad-anouar", name: "Riad Anouar", city: "Marrakech", country: "Morocco", category: "Hotel", luxuryTier: "Boutique", status: "Active", programs: ["Atelier"], rate: "12%", lastVerified: "Jan", updated: "14 Jan", evidence: { kind: "stale", label: "6 months old" } },
  { id: "villa-ortensia", name: "Villa Ortensia", city: "Amalfi coast", country: "Italy", category: "Hotel", luxuryTier: "Luxury", status: "Active", programs: ["Meridian"], rate: "11%", lastVerified: "Jun", updated: "30 Jun", evidence: { kind: "incentive", label: "+3% to 30 Sep" } },
  { id: "cap-destel", name: "Cap d'Estel", city: "Èze · Côte d'Azur", country: "France", category: "Hotel", luxuryTier: "Luxury", status: "Active", programs: ["Meridian"], rate: "11%", lastVerified: "Jun", updated: "22 Jun", evidence: { kind: "verified", label: "verified" }, hasNotice: true },
  { id: "hotel-verlaine", name: "Hôtel Verlaine", city: "Paris 8e", country: "France", category: "Hotel", luxuryTier: "Luxury", status: "Active", programs: ["Meridian"], rate: "10%", lastVerified: "Jun", updated: "18 Jun", evidence: { kind: "verified", label: "verified" }, hasNotice: true, tags: ["contemporary design"] },
  { id: "kikunoi-honten", name: "Kikunoi Honten", city: "Kyoto", country: "Japan", category: "Hotel", luxuryTier: "Luxury", status: "Active", programs: [], rate: "—", lastVerified: "May 2026", updated: "May", evidence: { kind: "verified", label: "verified May 2026" }, tags: ["kaiseki"] },
  { id: "sereno-kyoto", name: "Hotel Sereno Kyoto", city: "Kyoto", country: "Japan", category: "Hotel", luxuryTier: "Luxury", status: "Coming Soon", programs: [], rate: "—", lastVerified: "—", updated: "today", evidence: { kind: "stale", label: "unconfirmed" } },
];

export const directoryCounts = { Hotels: 209, Cruises: 41, DMCs: 28, "Rep firms": 34 };
export const directoryFooter = { total: 312, inParis: 128, verifiedThisQuarter: 41, verifiedOf: 128 };

/** Full record fields for Maison Léandre (Journey E anatomy). */
export const leandreFields: Field[] = [
  { key: "address", label: "Address", value: "14 rue de Sévigné, Paris 4e", layer: "canonical", source: { what: "canonical registry", where: "Enable directory", uri: "enable://products/maison-leandre", when: "verified May", kind: "portal" } },
  { key: "rooms", label: "Rooms", value: "42", layer: "canonical", source: { what: "brand feed", where: "Brand feed", uri: "portal://atelier/feed", when: "Mar", kind: "portal" } },
  { key: "pool", label: "Pool hours", value: "07:00–21:00", layer: "canonical", source: { what: "property site capture", where: "Property website", uri: "gdrive://capture-2026-05", when: "96d unverified", kind: "gdrive" }, state: "stale", staleDays: 96 },
  { key: "amenities-desc", label: "Amenities copy", value: "“View Hotel — experience refined luxury…”", layer: "canonical", source: { what: "portal boilerplate", where: "Consortium portal", uri: "portal://virtuoso/desc", when: "Feb", kind: "portal" }, state: "template" },
  { key: "commission", label: "Commission", value: "12% Atelier rate", layer: "agency", source: { what: "“…participating agencies receive twelve percent (12%) on the Atelier Collection rate, paid within 45 days of departure…”", where: "Partner portal · Atelier terms p.4", uri: "claromentis://partners/atelier-terms.pdf", when: "12 Mar", kind: "intranet" }, state: "conflict" },
  { key: "perk", label: "Negotiated perk", value: "EUR 100 property credit + daily breakfast for two", layer: "agency", source: { what: "keyed after rep call", where: "Edited by R. Devane", uri: "manual://rd", when: "21 Jun", kind: "manual" }, state: "edited-overlay", beneath: { value: "Daily breakfast for two", source: { what: "programme standard", where: "Atelier terms", uri: "claromentis://partners/atelier-terms.pdf", when: "12 Mar", kind: "intranet" } } },
  { key: "program", label: "Programme", value: "Atelier Collection", layer: "agency", source: { what: "programme membership", where: "Agency intranet", uri: "claromentis://programs/atelier", when: "04 Jun", kind: "intranet" } },
  { key: "repfirm", label: "Rep firm", value: "Corvin & Wells — Paris account", layer: "agency", source: { what: "rate note", where: "Email · Corvin & Wells", uri: "email://msg-2026-06-21", when: "21 Jun", kind: "email" } },
  { key: "note-rd", label: "My note", value: "“Ask for the courtyard rooms.”", layer: "personal", source: { what: "personal note", where: "R. Devane · booked Mar 2026", uri: "manual://rd", when: "Mar", kind: "manual" } },
  { key: "note-team", label: "Team note", value: "“GM changed in spring; service dip settled by June.”", layer: "personal", source: { what: "team note", where: "J. Dubois · team scope", uri: "manual://jd", when: "Jun", kind: "manual" } },
];

export const leandreContext = {
  clientAmenities: [
    { slug: "daily_breakfast_two", benefit: "Daily breakfast for two" },
    { slug: "property_credit", benefit: "EUR 100 property credit", amount: 100, currency: "EUR" },
    { slug: "room_upgrade_arrival", benefit: "Upgrade on arrival, subject to availability" },
  ],
  agentAmenities: [{ category: "commission", text: "12% on Atelier rate, paid within 45 days of departure" }],
  contacts: [
    { name: "A. Fontaine", role: "Reservations Manager", note: "Mention the agency" },
    { name: "L. Berger", role: "Commission contact" },
  ],
  whoBookedLast: "J. Dubois · May 2026",
  linkedItineraries: 2,
  clientIntelligence: { gated: true, note: "Visible only for travellers shared with you" },
};

/* ── Notices (advisories) ─────────────────────────────────── */
export interface Notice {
  id: string;
  productId: string;
  productName: string;
  text: string;
  severity: "Info" | "Important" | "Critical";
  scope: "personal" | "team" | "agency";
  owner: string;
  openedAt: string;
  ageDays: number;
  staleReviewDue?: boolean;
  /** v1 world: the March build carried valid-until */
  v1ValidUntil?: string;
  v1ExpiredOngoing?: boolean;
  endedPendingClose?: boolean;
}

export const notices: Notice[] = [
  { id: "spa", productId: "maison-leandre", productName: "Maison Léandre", text: "Spa closed to 15 Sep.", severity: "Important", scope: "agency", owner: "MK", openedAt: "12 Jun", ageDays: 76, staleReviewDue: true, v1ValidUntil: "01 Aug", v1ExpiredOngoing: true },
  { id: "gm", productId: "cap-destel", productName: "Cap d'Estel", text: "New general manager.", severity: "Info", scope: "agency", owner: "MK", openedAt: "90 days ago", ageDays: 90, staleReviewDue: true },
  { id: "verlaine-crit", productId: "hotel-verlaine", productName: "Hôtel Verlaine", text: "Water damage on floors 2–3 — do not confirm bookings until the property confirms reopening.", severity: "Critical", scope: "agency", owner: "MK", openedAt: "26 Aug", ageDays: 2 },
  { id: "contradict", productId: "maison-leandre", productName: "Maison Léandre", text: "Spa reopened — saw it Tuesday.", severity: "Info", scope: "personal", owner: "JD", openedAt: "25 Aug", ageDays: 3 },
];

/* ── Promotions / incentives ──────────────────────────────── */
export const promotions = [
  { id: "ortensia3", program: "Meridian", productName: "Villa Ortensia", rate: "+3%", type: "bonus" as const, stacksWithBase: true, bookingWindowEnd: "05 Sep", travelWindowEnd: "20 Dec", daysLeft: 9, affectedClients: ["S. Marchetti", "T. & P. Osei", "L. Grandin"] },
  { id: "atelier-credit", program: "Atelier", productName: "Atelier Collection", rate: "Upgrade credit", type: "rate_override" as const, stacksWithBase: false, bookingWindowEnd: "12 Sep", travelWindowEnd: "31 Mar 2027", daysLeft: 16, affectedClients: ["S. Marchetti"] },
];

/* ── Commissions (Journey C) ──────────────────────────────── */
export interface Commission {
  id: string;
  property: string;
  bookingRef: string;
  amount: number;
  currency: "EUR";
  state: "overdue" | "due" | "paid";
  dueDate: string;
  overdueDays?: number;
  projected: { rate: string; source: string; incentive?: string };
  paidDate?: string;
  discrepancy?: { expected: number; actual: number; causes: string[] };
  creditNotRefund?: boolean;
}

export const commissions: Commission[] = [
  { id: "vo", property: "Villa Ortensia", bookingRef: "VO-2214", amount: 1240, currency: "EUR", state: "overdue", dueDate: "18 Jul", overdueDays: 12, projected: { rate: "12%", source: "partner portal · Mar", incentive: "+3% active bonus (DEC: adds to base)" } },
  { id: "ml", property: "Maison Léandre", bookingRef: "ML-1108", amount: 862, currency: "EUR", state: "due", dueDate: "this week", projected: { rate: "12%", source: "Atelier terms p.4 · 12 Mar" } },
  { id: "kh", property: "Kirkfield House", bookingRef: "KH-0907", amount: 410, currency: "EUR", state: "paid", dueDate: "25 Jul", paidDate: "28 Jul", projected: { rate: "10%", source: "rate feed · Feb" } },
];

export const commissionEdgeCases = {
  discrepancy: { property: "Palácio das Amoreiras", expected: 1120, actual: 1008, note: "actual 10% under projection", causes: ["rate mismatch", "currency variance (EUR→USD conversion dated 14 Jul)"] },
  creditNotRefund: { property: "Ischia booking", note: "Cancellation resolved as hotel credit — commission protection does not apply." },
  unconfirmedCancellation: { property: "Ischia booking", sentHoursAgo: 24, note: "No acknowledgment from property — no record of the cancellation." },
};

export const briefing = {
  headline: { outstanding: 2512, note: "outstanding across three commissions", collectedThisWeek: 410 },
  bookedMTD: { amount: 184900, deltaPct: 11, bookings: 34, scope: "Paris desk only" },
  recordsVerified: { done: 41, of: 128, carriedForward: 87 },
  departures: [
    { traveller: "S. Marchetti", trip: "Kyoto & Kansai", inDays: 12, checklist: { done: 6, of: 9 } },
    { traveller: "A. Whitfield", trip: "Lisbon", inDays: 3, alert: "transfer unconfirmed" },
    { traveller: "R. & M. Osei", trip: "Patagonia", inDays: 21, ok: "all confirmed" },
  ],
  syncedAt: "12:04",
};

/* ── Orphaned payments (ops) ──────────────────────────────── */
export const orphanedPayments = [
  { id: "op1", amount: 410, currency: "EUR", raw: "R. Osei", note: "arrived under traveller name; booker is M. Osei", candidates: [ { ref: "VO-2214 · booker M. Osei (traveller R. Osei)", strength: "strong" }, { ref: "KX-1108 · no name overlap", strength: "weak" } ] },
  { id: "op2", amount: 862, currency: "EUR", raw: "“Pipery Hotel”", note: "unresolvable property name", candidates: [ { ref: "Maison Léandre (name_sim 0.41)", strength: "weak" } ] },
];

/* ── Traveller (Journey F) ────────────────────────────────── */
export const traveller = {
  id: "s-marchetti",
  name: "S. Marchetti",
  relationshipStatus: "Active",
  departure: { trip: "Kyoto & Kansai", inDays: 12, checklist: { done: 6, of: 9, items: ["Passport valid ✓", "Rail passes ✓", "Kaiseki reservations ✓", "Transfer name card ✓", "Ryokan confirmed ✓", "Travel insurance ✓", "Host registration — pending", "Final documents — pending", "Weather brief — pending"] } },
  profiles: [
    { type: "Leisure", isPrimary: true },
    { type: "Business", isPrimary: false },
    { type: "Celebration", isPrimary: false },
  ],
  preferences: [
    { id: "classic", text: "Prefers classic interiors", source: { kind: "email" as const, label: "email extract", when: "12 May 2026" }, sources: 3, confidence: 0.92 },
    { id: "floor", text: "No rooms above the third floor", source: { kind: "manual" as const, label: "manual note, R. Devane", when: "Apr 2026" }, sources: 1, confidence: 0.6 },
    { id: "dog", text: "Travels with a small dog", source: { kind: "tripsuite" as const, label: "booking platform", when: "Feb 2026" }, sources: 1, confidence: 0.65 },
    { id: "kaiseki", text: "Kaiseki over French dining", source: { kind: "manual" as const, label: "call transcript", when: "Jan 2026" }, sources: 1, confidence: 0.55, confirmThis: true },
    { id: "pillows", text: "No feather pillows", source: { kind: "tripsuite" as const, label: "booking platform", when: "Mar 2026" }, sources: 2, confidence: 0.88 },
    { id: "checkout", text: "Late checkout where possible", source: { kind: "email" as const, label: "email extract", when: "Feb 2026" }, sources: 1, confidence: 0.62 },
  ],
  suggestions: [
    { id: "rail", text: "Prefers rail over short flights", basis: "inferred from trip history", confidence: 0.58 },
  ],
  signalsBySource: [ ["Email extracts", 4], ["Call transcripts", 2], ["Booking platform", 2], ["Keyed by hand", 1] ] as [string, number][],
  sharing: { state: "private" as "private" | "full" | "basic", with: "J. Dubois" },
  acuity: { status: "Complete" as const, score: 82, lastRun: "14 Aug" },
  trips: [
    { title: "Kyoto & Kansai", dates: "12–19 Oct 2026", status: "Planning" },
    { title: "Amalfi coast", dates: "May 2025", status: "Traveled" },
  ],
  financialsGated: true,
};

export const shortlistConflict = {
  property: "Hôtel Verlaine",
  reason: "listed as contemporary design; the profile holds a preference for classic interiors on three sources",
  swap: "Maison Léandre",
};

/* ── Candidates (Journey D) ───────────────────────────────── */
export const candidates = [
  {
    id: "sereno",
    name: "Hotel Sereno Kyoto",
    from: "DMC spreadsheet — semi-structured Excel",
    uri: "gdrive://dmc-kyoto-2026.xlsx",
    kind: "new" as const,
    match: null,
    fields: [
      { label: "Name", value: "Hotel Sereno Kyoto", snippet: "row 41 · col B", confidence: 0.98 },
      { label: "City", value: "Kyoto", snippet: "row 41 · col C", confidence: 0.97 },
      { label: "Rooms", value: "28", snippet: "row 41 · col F", confidence: 0.95 },
      { label: "Rate", value: "held — converted figure without source currency", snippet: "row 41 · col H: “€1,180” marked (converted)", confidence: 0.4, held: true },
      { label: "Description", value: "“View Hotel — experience refined luxury…”", snippet: "portal boilerplate detected", confidence: 0.3, template: true },
    ],
  },
  {
    id: "leandre-dup",
    name: "“Maison Leandre”",
    from: "portal sync",
    uri: "portal://meridian/sync-0827",
    kind: "duplicate" as const,
    match: { target: "Maison Léandre", similarity: 0.92, signals: [["name_sim", "0.92"], ["city", "exact"], ["google_place_id", "absent"]] as [string, string][] },
    fields: [
      { label: "Name", value: "Maison Leandre", snippet: "sync record 114", confidence: 0.92 },
      { label: "Rooms", value: "42", snippet: "sync record 114", confidence: 0.95 },
      { label: "Commission", value: "12%", snippet: "sync record 114", confidence: 0.9 },
    ],
  },
  { id: "villa-unknown", name: "“Villa ????”", from: "unreadable source row", uri: "gdrive://dmc-kyoto-2026.xlsx", kind: "held" as const, match: null, fields: [] },
];

/* ── Vault + connections ──────────────────────────────────── */
export const vaultDocs = [
  { name: "Peru — just-back notes", source: "Upload", updated: "02 Jul", access: "team · Paris", state: "ok" },
  { name: "Commission schedule.xlsx", source: "Drive sync", updated: "30 Jun", access: "admin only", state: "ok" },
  { name: "Rate note — Corvin & Wells", source: "Email-in", updated: "21 Jun", access: "private", state: "ok" },
  { name: "Kyoto ryokan briefing", source: "Intranet", updated: "04 Jun", access: "agency", state: "ok" },
  { name: "Supplier webinar notes", source: "Upload", updated: "28 May", access: "processing", state: "processing" },
  { name: "Atelier Collection terms.pdf", source: "Drive sync", updated: "12 Mar", access: "agency", state: "ok", detail: { synced: "12:04 · every 15 min", usedIn: "14 answers this month", history: ["MK widened access: team → agency · 14 Jun · logged", "Uploaded by MK, private on arrival · 12 Mar"] } },
];

export const vaultStats = { total: 1284, verifiedSourcePct: 71, verified: 912, noSource: 372, tabs: { All: 1284, Drive: 812, Email: 96, Intranet: 341, Uploads: 35 } };

export const connections = [
  { name: "Intranet documents", state: "ok" as const, lastSuccess: "09:12", posture: "MCP upstream" },
  { name: "Google Drive", state: "ok" as const, lastSuccess: "08:40", posture: "MCP upstream" },
  { name: "Booking system", state: "syncing" as const, lastSuccess: "yesterday 18:00", posture: "read-only · ground truth stays in source · sync up to 48h" },
  { name: "Partner portal", state: "credentials" as const, lastSuccess: "24 Aug", posture: "self-hosted fallback" },
  { name: "Inbound mail — parisdesk@inbound.enable…", state: "ok" as const, lastSuccess: "11:52", posture: "private by default, sender-verified" },
];

/* ── Ask threads (Journey A, scripted) ────────────────────── */
export const askThreads = {
  rep: {
    q: "Who represents Maison Léandre?",
    a: "Corvin & Wells hold the Paris account. The rate note is dated 21 June 2026.",
    cites: [3],
  },
  commission: {
    q: "What is our commission on Maison Léandre, and does the Atelier rate include breakfast?",
    preResolve: "conflict" as const,
    resolved: {
      lines: [
        { text: "Maison Léandre pays 12% commission on the Atelier Collection rate.", cite: 1 },
        { text: "The rate includes daily breakfast for two and a EUR 100 property credit.", cite: 2 },
        { text: "An upgrade at check-in depends on availability. The property does not guarantee it.", cite: 3 },
      ],
      meta: { sources: 3, oldest: "12 Mar 2026", corroborated: 3, resolutionCited: true },
    },
    sources: [
      { n: 1, label: "Partner portal", detail: "Atelier Collection terms · 12 Mar 2026 · p.4", quote: "“…participating agencies receive twelve percent (12%) on the Atelier Collection rate, paid within 45 days of departure…”" },
      { n: 2, label: "Agency intranet", detail: "Preferred partners · 04 Jun 2026" },
      { n: 3, label: "Email extract", detail: "Corvin & Wells · 21 Jun 2026" },
    ],
  },
  refusal: {
    q: "Does Maison Léandre still give a third night free on suites?",
    headline: "I do not know.",
    body: "I found two sources. Neither one meets the answer contract, so I will not answer from them.",
    contract: [
      { clause: "Sources", ok: true, note: "Two sources mention this offer." },
      { clause: "Freshness", ok: false, note: "The newest source is 14 months old." },
      { clause: "Corroboration", ok: false, note: "Neither source confirms the other." },
    ],
    policy: "Offers like this change without notice. I hold anything older than twelve months unless a second source confirms it.",
    held: [
      { label: "Partner portal", detail: "Suite offers, spring · 08 Apr 2025", age: "14 months old" },
      { label: "Email extract", detail: "Forwarded offer notice · 19 Mar 2025", age: "15 months old" },
    ],
    ctas: ["Ask the rep firm", "Show me the two sources", "Flag for review"],
  },
  stale: {
    q: "What are the pool hours at Maison Léandre?",
    a: "07:00–21:00 — last verified 96 days ago; may have changed.",
    warn: true,
  },
};

export const trace = [
  { stage: "Agency directory, vault, and notes", detail: "Read 3 documents in Partners / Atelier" },
  { stage: "Curated specialist layer", detail: "Checked the rate against the agency overlay" },
  { stage: "Vetted external sources", detail: "Found no active notice on this property" },
];

export const people = { advisor: "R. Devane", advisorShort: "RD", colleague: "J. Dubois", colleagueShort: "JD", lead: "M. Keller", leadShort: "MK", ops: "A. Blanc", opsShort: "AB" };

export const publishQueue = [
  { id: "spa-pub", text: "Spa closure — submitted by R. Devane, team scope", action: "Publish agency-wide (owner preserved)" },
  { id: "rw-pub", text: "Rosewood-class +5% incentive — from forwarded mail", action: "Review source" },
];

export const adminPolicy = {
  defaults: [
    { kind: "Knowledge from email", detail: "a forwarded email, after sender checks", value: "Private to the receiving advisor" },
    { kind: "Traveller profiles", detail: "preferences, notes, history", value: "Private to the owning advisor" },
    { kind: "Itineraries", detail: "drafts and confirmed trips", value: "Whole agency" },
    { kind: "Knowledge uploads", detail: "documents an advisor adds by hand", value: "The uploader's team" },
  ],
  breakGlass: [
    { actor: "MK (admin)", action: "opened a personal note", reason: "advisor on leave", expiry: "expires 18:00", when: "Today 09:41" },
    { actor: "JB (admin)", action: "opened a traveller profile", reason: "complaint review", note: "owner notified", when: "Yesterday 15:12" },
  ],
  governed: { advisors: 34, admins: 3, desks: 4, records: 1284 },
};

export const itinerary = {
  title: "Kyoto & Kansai",
  status: "Draft",
  client: "S. Marchetti",
  dates: "12–19 Oct 2026",
  sharedWith: "MK",
  days: [
    { n: 1, events: [
      { type: "Transfer", title: "Kyoto station — private transfer", note: "driver holds a name card", time: "14:20" },
      { type: "Accommodation", title: "Ryokan Suikawa", note: "3 nights · garden wing", time: "15:00", chips: ["Meridian", "+3% through 30 Sep"] },
      { type: "Dining", title: "Dinner — Gion Watanabe", note: "counter seats · confirmed", time: "19:30" },
    ] },
  ],
  ideaConflict: { title: "Hôtel Verlaine — Day 3 idea", conflict: "conflicts with a stated preference for classic interiors", action: "swap the property" },
  addFromRecords: [
    { name: "Kikunoi Honten", meta: "kaiseki · verified May 2026", primary: true },
    { name: "Gion Sasaki", meta: "counter kaiseki · verified Apr 2026" },
    { name: "Wa Yamamura — Nara", meta: "3 stars · verified Jan 2026" },
  ],
};
