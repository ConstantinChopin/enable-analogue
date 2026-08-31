/**
 * Seed data — the single source for every screen.
 * Schema-conformant per docs/design/data-model.md; deterministic (no Date.now, no Math.random).
 *
 * Personas: advisor = R. Devane (RD) · colleague = J. Dubois (JD)
 *           agency lead = M. Keller (MK) · ops = A. Blanc (AB).
 * The traveller in the worked example is S. Marchetti (a client, not staff).
 * World: `v1` mirrors the March build (advisories carried auto-expiry); `v2` is current.
 */

export type Layer = "canonical" | "agency" | "personal";
export type Persona = "advisor" | "colleague" | "lead" | "ops";
export type World = "v1" | "v2";

export const people = {
  advisor: "R. Devane", advisorShort: "RD", advisorEmail: "r.devane@enable.example",
  colleague: "J. Dubois", colleagueShort: "JD", colleagueEmail: "j.dubois@enable.example",
  lead: "M. Keller", leadShort: "MK", leadEmail: "m.keller@enable.example",
  ops: "A. Blanc", opsShort: "AB", opsEmail: "a.blanc@enable.example",
};

export const roleLabel: Record<Persona, string> = {
  advisor: "Advisor · Paris desk",
  colleague: "Advisor · Paris desk",
  lead: "Agency lead",
  ops: "Operations",
};

export const personName: Record<Persona, string> = {
  advisor: people.advisor, colleague: people.colleague, lead: people.lead, ops: people.ops,
};

export const personEmail: Record<Persona, string> = {
  advisor: people.advisorEmail, colleague: people.colleagueEmail, lead: people.leadEmail, ops: people.opsEmail,
};

export const personInitials: Record<Persona, string> = {
  advisor: people.advisorShort, colleague: people.colleagueShort, lead: people.leadShort, ops: people.opsShort,
};

/** Every persona, in the order the sign-in screen lists them. */
export const personas: Persona[] = ["advisor", "colleague", "lead", "ops"];

/* ── provenance ───────────────────────────────────────────── */

export interface Source {
  what: string;   // the snippet that justifies the value
  where: string;  // human label
  uri: string;    // provenance URI scheme
  when: string;
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
  beneath?: { value: string; source: Source };
}

/* ── products ─────────────────────────────────────────────── */

export type ProductCategory = "Hotel" | "Cruise" | "DMC" | "Rep firm";
export type LuxuryTier = "Ultra-Luxury" | "Luxury" | "Premium" | "Boutique";
export type ProductStatus = "Active" | "Coming Soon" | "Closed";
export type EvidenceKind = "verified" | "stale" | "disagree" | "incentive" | "unconfirmed";

export interface Product {
  id: string;
  name: string;
  city: string;
  country: string;
  region: "Europe" | "Africa" | "Asia" | "Americas" | "Middle East" | "Oceania";
  category: ProductCategory;
  luxuryTier: LuxuryTier;
  status: ProductStatus;
  brand?: string;
  programs: string[];
  consortia: string[];
  rate: string;
  lastVerified: string;
  updated: string;
  staleDays?: number;
  evidence: { kind: EvidenceKind; label: string };
  address?: string;
  rooms?: number;
  repFirm?: string;
  hasNotice?: boolean;
  tags?: string[];
  blurb?: string;
}

export const products: Product[] = [
  { id: "maison-leandre", name: "Maison Léandre", city: "Paris 4e", country: "France", region: "Europe", category: "Hotel", luxuryTier: "Ultra-Luxury", status: "Active", brand: "Atelier Collection", programs: ["Atelier", "Meridian"], consortia: ["Consortium A"], rate: "12%", lastVerified: "Mar", updated: "12 Jun", evidence: { kind: "disagree", label: "3 sources disagree" }, address: "14 rue de Sévigné", rooms: 42, repFirm: "Corvin & Wells", hasNotice: true, blurb: "A courtyard hôtel particulier in the Marais, 42 rooms around a walled garden." },
  { id: "hotel-verlaine", name: "Hôtel Verlaine", city: "Paris 8e", country: "France", region: "Europe", category: "Hotel", luxuryTier: "Luxury", status: "Active", programs: ["Meridian"], consortia: [], rate: "10%", lastVerified: "Jun", updated: "18 Jun", evidence: { kind: "verified", label: "verified" }, rooms: 68, repFirm: "Corvin & Wells", hasNotice: true, tags: ["contemporary design"], blurb: "Contemporary rooms off the Champs-Élysées; a rooftop bar that runs late." },
  { id: "palacio-amoreiras", name: "Palácio das Amoreiras", city: "Lisbon", country: "Portugal", region: "Europe", category: "Hotel", luxuryTier: "Luxury", status: "Active", programs: ["Atelier"], consortia: ["Consortium A"], rate: "12%", lastVerified: "May", updated: "26 May", evidence: { kind: "verified", label: "verified" }, rooms: 31, blurb: "An eighteenth-century palace above the reservoir, restored around its tilework." },
  { id: "riad-anouar", name: "Riad Anouar", city: "Marrakech", country: "Morocco", region: "Africa", category: "Hotel", luxuryTier: "Boutique", status: "Active", programs: ["Atelier"], consortia: [], rate: "12%", lastVerified: "Jan", updated: "14 Jan", staleDays: 216, evidence: { kind: "stale", label: "6 months old" }, rooms: 11, blurb: "Eleven rooms in the medina, arranged around two courtyards and a plunge pool." },
  { id: "villa-ortensia", name: "Villa Ortensia", city: "Amalfi coast", country: "Italy", region: "Europe", category: "Hotel", luxuryTier: "Luxury", status: "Active", programs: ["Meridian"], consortia: ["Consortium B"], rate: "11%", lastVerified: "Jun", updated: "30 Jun", evidence: { kind: "incentive", label: "+3% to 30 Sep" }, rooms: 24, repFirm: "Lambert & Hale", blurb: "Terraced gardens above Praiano; the suites face west over the water." },
  { id: "cap-destel", name: "Cap d'Estel", city: "Èze", country: "France", region: "Europe", category: "Hotel", luxuryTier: "Luxury", status: "Active", programs: ["Meridian"], consortia: ["Consortium B"], rate: "11%", lastVerified: "Jun", updated: "22 Jun", evidence: { kind: "verified", label: "verified" }, rooms: 18, hasNotice: true, blurb: "A private headland between Nice and Monaco, reached by its own funicular." },
  { id: "ryokan-suikawa", name: "Ryokan Suikawa", city: "Kyoto", country: "Japan", region: "Asia", category: "Hotel", luxuryTier: "Ultra-Luxury", status: "Active", programs: ["Meridian"], consortia: [], rate: "11%", lastVerified: "May", updated: "04 Jun", evidence: { kind: "verified", label: "verified May 2026" }, rooms: 9, tags: ["kaiseki", "garden wing"], blurb: "Nine rooms on the Shirakawa canal; kaiseki served in-room, garden wing quietest." },
  { id: "sereno-kyoto", name: "Hotel Sereno Kyoto", city: "Kyoto", country: "Japan", region: "Asia", category: "Hotel", luxuryTier: "Luxury", status: "Coming Soon", programs: [], consortia: [], rate: "—", lastVerified: "—", updated: "today", evidence: { kind: "unconfirmed", label: "unconfirmed" }, rooms: 28, blurb: "Opening spring 2027 in Higashiyama. Record awaiting confirmation." },
  { id: "kirkfield-house", name: "Kirkfield House", city: "Cotswolds", country: "United Kingdom", region: "Europe", category: "Hotel", luxuryTier: "Boutique", status: "Active", programs: ["Atelier"], consortia: [], rate: "10%", lastVerified: "Apr", updated: "02 May", evidence: { kind: "verified", label: "verified" }, rooms: 16, blurb: "A manor with a working kitchen garden; the cookery school runs at weekends." },
  { id: "borgo-selvane", name: "Borgo Selvane", city: "Val d'Orcia", country: "Italy", region: "Europe", category: "Hotel", luxuryTier: "Luxury", status: "Active", programs: ["Atelier", "Meridian"], consortia: ["Consortium A"], rate: "12%", lastVerified: "Feb", updated: "20 Feb", staleDays: 189, evidence: { kind: "stale", label: "6 months old" }, rooms: 27, blurb: "A restored hamlet with its own vineyard; family suites in the old granary." },
  { id: "the-brackenmoor", name: "The Brackenmoor", city: "Perthshire", country: "United Kingdom", region: "Europe", category: "Hotel", luxuryTier: "Luxury", status: "Active", programs: ["Meridian"], consortia: ["Consortium B"], rate: "11%", lastVerified: "Jun", updated: "11 Jun", evidence: { kind: "verified", label: "verified" }, rooms: 22, repFirm: "Corvin & Wells", blurb: "Highland sporting estate; stalking and river beats let by arrangement." },
  { id: "aurora-fjelland", name: "Aurora Fjelland", city: "Lofoten", country: "Norway", region: "Europe", category: "Hotel", luxuryTier: "Boutique", status: "Active", programs: [], consortia: [], rate: "10%", lastVerified: "Mar", updated: "08 Mar", staleDays: 173, evidence: { kind: "stale", label: "5 months old" }, rooms: 14, blurb: "Fourteen cabins on a working harbour, glazed to the north for the winter light." },
  { id: "dunes-al-marah", name: "Dunes Al Marah", city: "Wadi Rum", country: "Jordan", region: "Middle East", category: "Hotel", luxuryTier: "Luxury", status: "Active", programs: ["Atelier"], consortia: [], rate: "12%", lastVerified: "May", updated: "19 May", evidence: { kind: "verified", label: "verified" }, rooms: 20, blurb: "Twenty tented suites in the protected area; night skies are the point." },
  { id: "casa-marena", name: "Casa Marena", city: "Cartagena", country: "Colombia", region: "Americas", category: "Hotel", luxuryTier: "Luxury", status: "Active", programs: ["Meridian"], consortia: [], rate: "11%", lastVerified: "Apr", updated: "27 Apr", evidence: { kind: "verified", label: "verified" }, rooms: 26, repFirm: "Verity Marsh", blurb: "A colonial house inside the walled city, courtyards stepped down to a pool." },
  { id: "tsavora-lodge", name: "Tsavora Lodge", city: "Serengeti", country: "Tanzania", region: "Africa", category: "Hotel", luxuryTier: "Ultra-Luxury", status: "Active", programs: ["Atelier"], consortia: ["Consortium A"], rate: "13%", lastVerified: "Jun", updated: "06 Jun", evidence: { kind: "verified", label: "verified" }, rooms: 8, repFirm: "Lambert & Hale", blurb: "Eight tents on a private concession; the camp moves with the migration." },
  { id: "playa-tulira", name: "Playa Tulira", city: "Riviera Nayarit", country: "Mexico", region: "Americas", category: "Hotel", luxuryTier: "Luxury", status: "Active", programs: ["Meridian"], consortia: ["Consortium B"], rate: "11%", lastVerified: "Jul", updated: "03 Jul", evidence: { kind: "verified", label: "verified" }, rooms: 45, blurb: "A long beach north of Punta Mita; minimum stays waived outside high season." },
  { id: "hanami-tarn", name: "Hanami Tarn", city: "Hakone", country: "Japan", region: "Asia", category: "Hotel", luxuryTier: "Luxury", status: "Closed", programs: ["Meridian"], consortia: [], rate: "—", lastVerified: "Feb", updated: "14 Feb", evidence: { kind: "stale", label: "closed for rebuild" }, rooms: 30, blurb: "Closed for rebuild until 2028. Kept on file for historical bookings." },
  { id: "villa-anzeleta", name: "Villa Anzeleta", city: "Paros", country: "Greece", region: "Europe", category: "Hotel", luxuryTier: "Boutique", status: "Active", programs: [], consortia: [], rate: "10%", lastVerified: "Jun", updated: "15 Jun", evidence: { kind: "verified", label: "verified" }, rooms: 7, blurb: "Seven rooms above Naoussa harbour, run by the family that built it." },

  { id: "aurelia-voyages", name: "Aurelia", city: "Small-ship ocean", country: "—", region: "Europe", category: "Cruise", luxuryTier: "Ultra-Luxury", status: "Active", programs: ["Meridian"], consortia: ["Consortium B"], rate: "14%", lastVerified: "Jun", updated: "09 Jun", evidence: { kind: "verified", label: "verified" }, blurb: "196 guests, all-suite; Mediterranean summers, Caribbean winters." },
  { id: "oberon-nile", name: "Oberon Nile", city: "Nile", country: "Egypt", region: "Africa", category: "Cruise", luxuryTier: "Luxury", status: "Active", programs: ["Atelier"], consortia: [], rate: "12%", lastVerified: "May", updated: "22 May", evidence: { kind: "verified", label: "verified" }, blurb: "A twelve-cabin dahabiya between Luxor and Aswan; sails, no engine." },
  { id: "australis-patagonia", name: "Australis Patagonia", city: "Tierra del Fuego", country: "Chile", region: "Americas", category: "Cruise", luxuryTier: "Luxury", status: "Active", programs: [], consortia: [], rate: "11%", lastVerified: "Jan", updated: "18 Jan", staleDays: 222, evidence: { kind: "stale", label: "7 months old" }, blurb: "Expedition sailings through the fjords; mobility-friendly cabins on two decks." },
  { id: "clarion-rhine", name: "Clarion Rhine", city: "Rhine", country: "Germany", region: "Europe", category: "Cruise", luxuryTier: "Premium", status: "Coming Soon", programs: ["Meridian"], consortia: [], rate: "—", lastVerified: "—", updated: "01 Aug", evidence: { kind: "unconfirmed", label: "launching 2027" }, blurb: "River programme launching 2027; itineraries not yet loaded." },

  { id: "meridiana-dmc", name: "Meridiana", city: "Athens", country: "Greece", region: "Europe", category: "DMC", luxuryTier: "Luxury", status: "Active", programs: [], consortia: [], rate: "—", lastVerified: "Jun", updated: "24 Jun", evidence: { kind: "verified", label: "verified" }, blurb: "Cyclades and mainland Greece; strongest on multi-island logistics." },
  { id: "arno-and-co", name: "Arno & Co.", city: "Florence", country: "Italy", region: "Europe", category: "DMC", luxuryTier: "Luxury", status: "Active", programs: [], consortia: [], rate: "—", lastVerified: "May", updated: "30 May", evidence: { kind: "verified", label: "verified" }, blurb: "Northern and central Italy; guides booked direct, transfers subcontracted." },
  { id: "sahara-routes", name: "Sahara Routes", city: "Marrakech", country: "Morocco", region: "Africa", category: "DMC", luxuryTier: "Premium", status: "Active", programs: [], consortia: [], rate: "—", lastVerified: "Feb", updated: "11 Feb", staleDays: 198, evidence: { kind: "stale", label: "6 months old" }, blurb: "Desert and Atlas programmes. Response times slow in high season." },

  { id: "corvin-wells", name: "Corvin & Wells", city: "Paris", country: "France", region: "Europe", category: "Rep firm", luxuryTier: "Luxury", status: "Active", programs: [], consortia: [], rate: "—", lastVerified: "Jun", updated: "21 Jun", evidence: { kind: "verified", label: "verified" }, blurb: "Represents 14 European properties. Paris account handled directly." },
  { id: "lambert-hale", name: "Lambert & Hale", city: "London", country: "United Kingdom", region: "Europe", category: "Rep firm", luxuryTier: "Luxury", status: "Active", programs: [], consortia: [], rate: "—", lastVerified: "Apr", updated: "16 Apr", evidence: { kind: "verified", label: "verified" }, blurb: "Indian Ocean and East Africa. Two named contacts, both responsive." },
  { id: "verity-marsh", name: "Verity Marsh", city: "New York", country: "United States", region: "Americas", category: "Rep firm", luxuryTier: "Premium", status: "Active", programs: [], consortia: [], rate: "—", lastVerified: "Mar", updated: "02 Mar", staleDays: 179, evidence: { kind: "stale", label: "5 months old" }, blurb: "Latin America portfolio. Contact list needs re-verifying." },
];

export const productById = (id: string) => products.find((p) => p.id === id);

/** Filter vocabulary, derived from the data contract. */
export const filterOptions = {
  category: ["Hotel", "Cruise", "DMC", "Rep firm"] as ProductCategory[],
  region: ["Europe", "Africa", "Asia", "Americas", "Middle East", "Oceania"] as Product["region"][],
  luxuryTier: ["Ultra-Luxury", "Luxury", "Premium", "Boutique"] as LuxuryTier[],
  status: ["Active", "Coming Soon", "Closed"] as ProductStatus[],
  programme: ["Atelier", "Meridian"],
  consortia: ["Consortium A", "Consortium B"],
  evidence: [
    { key: "verified", label: "Verified" },
    { key: "stale", label: "Stale 90d+" },
    { key: "disagree", label: "Sources disagree" },
    { key: "incentive", label: "Active incentive" },
    { key: "unconfirmed", label: "Unconfirmed" },
  ] as { key: EvidenceKind; label: string }[],
};

export const directoryCounts: Record<ProductCategory, number> = { Hotel: 209, Cruise: 41, DMC: 28, "Rep firm": 34 };
export const directoryFooter = { total: 312, inParis: 128, verifiedThisQuarter: 41, verifiedOf: 128 };

/* ── the commission conflict (the worked example) ─────────── */

export interface ConflictSource {
  id: string; label: string; detail: string; when: string;
  value: string; status: string; agree: number; total: number;
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

export const leandreFields: Field[] = [
  { key: "address", label: "Address", value: "14 rue de Sévigné, Paris 4e", layer: "canonical", source: { what: "canonical registry", where: "Enable directory", uri: "enable://products/maison-leandre", when: "verified May", kind: "portal" } },
  { key: "rooms", label: "Rooms", value: "42", layer: "canonical", source: { what: "brand feed", where: "Brand feed", uri: "portal://atelier/feed", when: "Mar", kind: "portal" } },
  /* `when` is a date. It held "96d unverified" — the same fact the stale chip and
     `staleDays` already carry — so the row printed one state twice, in two places,
     in two colours. A source's `when` answers "as of when", never "how bad". */
  { key: "pool", label: "Pool hours", value: "07:00–21:00", layer: "canonical", source: { what: "property site capture", where: "Property website", uri: "gdrive://capture-2026-05", when: "May", kind: "gdrive" }, state: "stale", staleDays: 96 },
  { key: "amenities-desc", label: "Amenities copy", value: "“View Hotel — experience refined luxury…”", layer: "canonical", source: { what: "portal boilerplate", where: "Consortium portal", uri: "portal://consortium/desc", when: "Feb", kind: "portal" }, state: "template" },
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
  facilityAmenities: ["Courtyard garden", "Spa", "Pool", "Restaurant", "Valet parking"],
  contacts: [
    { name: "A. Fontaine", role: "Reservations Manager", note: "Mention the agency" },
    { name: "L. Berger", role: "Commission contact" },
  ],
  whoBookedLast: "J. Dubois · May 2026",
  linkedItineraries: 2,
  clientIntelligence: { gated: true, note: "Visible only for travellers shared with you" },
};

/* ── notices (advisories) ─────────────────────────────────── */

export interface Notice {
  id: string; productId: string; productName: string; text: string;
  severity: "Info" | "Important" | "Critical";
  scope: "personal" | "team" | "agency";
  owner: string; openedAt: string; ageDays: number;
  staleReviewDue?: boolean;
  v1ValidUntil?: string; v1ExpiredOngoing?: boolean;
  endedPendingClose?: boolean;
}

export const notices: Notice[] = [
  { id: "spa", productId: "maison-leandre", productName: "Maison Léandre", text: "Spa closed to 15 Sep.", severity: "Important", scope: "agency", owner: "MK", openedAt: "12 Jun", ageDays: 76, staleReviewDue: true, v1ValidUntil: "01 Aug", v1ExpiredOngoing: true },
  { id: "gm", productId: "cap-destel", productName: "Cap d'Estel", text: "New general manager.", severity: "Info", scope: "agency", owner: "MK", openedAt: "30 May", ageDays: 90, staleReviewDue: true },
  { id: "verlaine-crit", productId: "hotel-verlaine", productName: "Hôtel Verlaine", text: "Water damage on floors 2–3 — do not confirm bookings until the property confirms reopening.", severity: "Critical", scope: "agency", owner: "MK", openedAt: "26 Aug", ageDays: 2 },
  { id: "contradict", productId: "maison-leandre", productName: "Maison Léandre", text: "Spa reopened — saw it Tuesday.", severity: "Info", scope: "personal", owner: "JD", openedAt: "25 Aug", ageDays: 3 },
  { id: "selvane-road", productId: "borgo-selvane", productName: "Borgo Selvane", text: "Approach road resurfacing until late September; transfers add 20 minutes.", severity: "Info", scope: "agency", owner: "MK", openedAt: "02 Aug", ageDays: 26 },
  { id: "tsavora-move", productId: "tsavora-lodge", productName: "Tsavora Lodge", text: "Camp relocating with the migration from 10 Sep; coordinates change.", severity: "Important", scope: "agency", owner: "MK", openedAt: "18 Aug", ageDays: 10 },
];

/* ── promotions ───────────────────────────────────────────── */

export const promotions = [
  { id: "ortensia3", program: "Meridian", productId: "villa-ortensia", productName: "Villa Ortensia", rate: "+3%", type: "bonus" as const, stacksWithBase: true, bookingWindowEnd: "05 Sep", travelWindowEnd: "20 Dec", daysLeft: 9, affectedClients: ["S. Marchetti", "T. & P. Osei", "L. Grandin"] },
  { id: "atelier-credit", program: "Atelier", productId: "maison-leandre", productName: "Atelier Collection", rate: "Upgrade credit", type: "rate_override" as const, stacksWithBase: false, bookingWindowEnd: "12 Sep", travelWindowEnd: "31 Mar 2027", daysLeft: 16, affectedClients: ["S. Marchetti"] },
  { id: "tulira-fifth", program: "Meridian", productId: "playa-tulira", productName: "Playa Tulira", rate: "Fifth night free", type: "bonus" as const, stacksWithBase: true, bookingWindowEnd: "30 Sep", travelWindowEnd: "15 Dec", daysLeft: 33, affectedClients: ["R. & M. Osei"] },
];

/* ── commissions ──────────────────────────────────────────── */

export interface Commission {
  id: string; property: string; productId?: string; bookingRef: string;
  amount: number; currency: "EUR";
  state: "overdue" | "due" | "paid" | "chased";
  dueDate: string; overdueDays?: number;
  projected: { rate: string; source: string; incentive?: string };
  paidDate?: string;
  traveller?: string;
  discrepancy?: { expected: number; actual: number; causes: string[] };
  creditNotRefund?: boolean;
}

export const commissions: Commission[] = [
  { id: "vo", property: "Villa Ortensia", productId: "villa-ortensia", bookingRef: "VO-2214", amount: 1240, currency: "EUR", state: "overdue", dueDate: "18 Jul", overdueDays: 12, traveller: "S. Marchetti", projected: { rate: "12%", source: "partner portal · Mar", incentive: "+3% active bonus — adds to base" } },
  { id: "ml", property: "Maison Léandre", productId: "maison-leandre", bookingRef: "ML-1108", amount: 862, currency: "EUR", state: "due", dueDate: "this week", traveller: "A. Whitfield", projected: { rate: "12%", source: "Atelier terms p.4 · 12 Mar" } },
  { id: "kh", property: "Kirkfield House", productId: "kirkfield-house", bookingRef: "KH-0907", amount: 410, currency: "EUR", state: "paid", dueDate: "25 Jul", paidDate: "28 Jul", traveller: "L. Grandin", projected: { rate: "10%", source: "rate feed · Feb" } },
  { id: "pa", property: "Palácio das Amoreiras", productId: "palacio-amoreiras", bookingRef: "PA-1902", amount: 1008, currency: "EUR", state: "paid", dueDate: "02 Jul", paidDate: "09 Jul", traveller: "D. Lindqvist", projected: { rate: "12%", source: "partner portal · May" }, discrepancy: { expected: 1120, actual: 1008, causes: ["rate mismatch", "currency variance (EUR→USD conversion dated 14 Jul)"] } },
  { id: "cd", property: "Cap d'Estel", productId: "cap-destel", bookingRef: "CD-3301", amount: 690, currency: "EUR", state: "overdue", dueDate: "01 Aug", overdueDays: 28, traveller: "R. & M. Osei", projected: { rate: "11%", source: "partner portal · Jun" } },
  { id: "bs", property: "Borgo Selvane", productId: "borgo-selvane", bookingRef: "BS-1745", amount: 1520, currency: "EUR", state: "due", dueDate: "12 Sep", traveller: "T. & P. Osei", projected: { rate: "12%", source: "Atelier terms · Feb" } },
  { id: "ra", property: "Riad Anouar", productId: "riad-anouar", bookingRef: "RA-0455", amount: 305, currency: "EUR", state: "paid", dueDate: "20 Jun", paidDate: "27 Jun", traveller: "S. Marchetti", projected: { rate: "12%", source: "rate feed · Jan" } },
  { id: "tl", property: "Tsavora Lodge", productId: "tsavora-lodge", bookingRef: "TL-0088", amount: 3480, currency: "EUR", state: "due", dueDate: "30 Sep", traveller: "N. Achebe", projected: { rate: "13%", source: "partner portal · Jun" } },
  { id: "au", property: "Aurelia", productId: "aurelia-voyages", bookingRef: "AU-6120", amount: 2240, currency: "EUR", state: "chased", dueDate: "05 Jul", overdueDays: 54, traveller: "H. Vandermeer", projected: { rate: "14%", source: "partner portal · Jun" } },
  { id: "hv", property: "Hôtel Verlaine", productId: "hotel-verlaine", bookingRef: "HV-2088", amount: 455, currency: "EUR", state: "paid", dueDate: "14 Jun", paidDate: "21 Jun", traveller: "A. Whitfield", projected: { rate: "10%", source: "rate feed · Jun" } },
  { id: "cm", property: "Casa Marena", productId: "casa-marena", bookingRef: "CM-4410", amount: 780, currency: "EUR", state: "overdue", dueDate: "10 Aug", overdueDays: 19, traveller: "L. Grandin", projected: { rate: "11%", source: "partner portal · Apr" } },
  { id: "on", property: "Oberon Nile", productId: "oberon-nile", bookingRef: "ON-0301", amount: 1180, currency: "EUR", state: "due", dueDate: "22 Sep", traveller: "D. Lindqvist", projected: { rate: "12%", source: "Atelier terms · May" } },
  { id: "isc", property: "Ischia booking", bookingRef: "IS-0912", amount: 540, currency: "EUR", state: "due", dueDate: "cancelled", traveller: "S. Marchetti", projected: { rate: "11%", source: "rate feed · May" }, creditNotRefund: true },
  { id: "dam", property: "Dunes Al Marah", productId: "dunes-al-marah", bookingRef: "DM-1120", amount: 960, currency: "EUR", state: "paid", dueDate: "18 May", paidDate: "29 May", traveller: "N. Achebe", projected: { rate: "12%", source: "partner portal · May" } },
];

export const commissionEdgeCases = {
  discrepancy: { property: "Palácio das Amoreiras", expected: 1120, actual: 1008, note: "actual 10% under projection", causes: ["rate mismatch", "currency variance (EUR→USD conversion dated 14 Jul)"] },
  creditNotRefund: { property: "Ischia booking", note: "Cancellation resolved as hotel credit — commission protection does not apply." },
  unconfirmedCancellation: { property: "Ischia booking", sentHoursAgo: 24, note: "No acknowledgment from property — no record of the cancellation." },
};

/* ── itineraries and departures (the same objects) ────────── */

export type ItineraryStatus = "Inbound" | "Planning" | "Booked" | "Traveling" | "Traveled" | "Cancelled";

export interface Trip {
  id: string; title: string; traveller: string; travellerId?: string;
  destinations: string[]; dates: string; startsInDays: number | null;
  status: ItineraryStatus; nights: number; products: string[];
  checklist?: { done: number; of: number };
  alert?: string;
}

export const trips: Trip[] = [
  { id: "kyoto-kansai", title: "Kyoto & Kansai", traveller: "S. Marchetti", travellerId: "s-marchetti", destinations: ["Kyoto", "Nara", "Osaka"], dates: "12–19 Oct 2026", startsInDays: 12, status: "Booked", nights: 7, products: ["ryokan-suikawa"], checklist: { done: 6, of: 9 } },
  { id: "lisbon-short", title: "Lisbon, four nights", traveller: "A. Whitfield", destinations: ["Lisbon"], dates: "02–06 Sep 2026", startsInDays: 3, status: "Booked", nights: 4, products: ["palacio-amoreiras"], alert: "transfer unconfirmed", checklist: { done: 7, of: 8 } },
  { id: "patagonia", title: "Patagonia crossing", traveller: "R. & M. Osei", destinations: ["Santiago", "Tierra del Fuego"], dates: "20 Sep–04 Oct 2026", startsInDays: 21, status: "Booked", nights: 14, products: ["australis-patagonia"], checklist: { done: 9, of: 9 } },
  { id: "amalfi-return", title: "Amalfi, return visit", traveller: "T. & P. Osei", destinations: ["Praiano", "Ravello"], dates: "11–18 Oct 2026", startsInDays: 34, status: "Planning", nights: 7, products: ["villa-ortensia"] },
  { id: "serengeti", title: "Serengeti, green season", traveller: "N. Achebe", destinations: ["Arusha", "Serengeti"], dates: "14–24 Jan 2027", startsInDays: 138, status: "Planning", nights: 10, products: ["tsavora-lodge"] },
  { id: "paris-anniversary", title: "Paris, thirtieth anniversary", traveller: "L. Grandin", destinations: ["Paris"], dates: "03–07 Dec 2026", startsInDays: 96, status: "Planning", nights: 4, products: ["maison-leandre"] },
  { id: "nile-jan", title: "Nile, dahabiya", traveller: "D. Lindqvist", destinations: ["Luxor", "Aswan"], dates: "18–27 Jan 2027", startsInDays: 142, status: "Inbound", nights: 9, products: ["oberon-nile"] },
  { id: "cartagena-may", title: "Cartagena, long weekend", traveller: "H. Vandermeer", destinations: ["Cartagena"], dates: "08–12 May 2026", startsInDays: null, status: "Traveled", nights: 4, products: ["casa-marena"] },
];

export const departures = trips
  .filter((t) => t.startsInDays !== null && t.startsInDays <= 40 && t.status === "Booked")
  .sort((a, b) => (a.startsInDays ?? 0) - (b.startsInDays ?? 0));

/* ── briefing, per role ───────────────────────────────────── */

export const briefing = {
  headline: { outstanding: 2512, note: "outstanding across three commissions", collectedThisWeek: 410 },
  bookedMTD: { amount: 184900, deltaPct: 11, bookings: 34, scope: "Paris desk only" },
  recordsVerified: { done: 41, of: 128, carriedForward: 87 },
  departures: departures.map((t) => ({ traveller: t.traveller, trip: t.title, inDays: t.startsInDays ?? 0, checklist: t.checklist, alert: t.alert })),
  syncedAt: "12:04",
};

export interface Widget {
  id: string;
  title: string;
  /** expanding a widget navigates to its surface with the view applied */
  expandsTo: string;
  expandLabel: string;
}

export const widgetsFor: Record<Persona, Widget[]> = {
  advisor: [
    { id: "commissions", title: "Commissions", expandsTo: "/commissions?state=open", expandLabel: "Open the ledger" },
    { id: "departures", title: "Departures", expandsTo: "/itineraries?window=30", expandLabel: "All departures" },
    { id: "notices", title: "Notices", expandsTo: "/notifications?tag=Records", expandLabel: "Open triage" },
    /* Expands into the promotion facet, which returns the same three records the widget
       lists. It pointed at `evidence=incentive`, which returned one of the three. */
    { id: "incentives", title: "Expiring incentives", expandsTo: "/records?promotion=active", expandLabel: "See affected records" },
    { id: "verification", title: "Records verified this quarter", expandsTo: "/records?evidence=stale", expandLabel: "Records needing verification" },
  ],
  colleague: [
    /* No Commissions widget. A titled card occupying a grid cell to explain that it is
       empty is a mask with a caption — the thing the policy claims not to do. Expiring
       incentives is simply not here either, and the record does the same: the field is
       gone, with no gap and no note. One rule, one implementation. */
    { id: "departures", title: "Departures", expandsTo: "/itineraries?window=30", expandLabel: "All departures" },
    { id: "notices", title: "Notices", expandsTo: "/notifications?tag=Records", expandLabel: "Open triage" },
    { id: "verification", title: "Records verified this quarter", expandsTo: "/records?evidence=stale", expandLabel: "Records needing verification" },
  ],
  lead: [
    { id: "publish", title: "Awaiting publication", expandsTo: "/notifications?tag=Knowledge", expandLabel: "Open triage" },
    /* The queue index is the surface this widget summarises, and it is the only way in:
       nothing else in the product links to /admin/review. */
    { id: "confirm", title: "Records awaiting confirmation", expandsTo: "/admin/review", expandLabel: "Open the confirmation queue" },
    { id: "connections", title: "Connection health", expandsTo: "/admin/connections", expandLabel: "All connections" },
    { id: "policy", title: "Policy and access", expandsTo: "/admin/publish", expandLabel: "Sharing defaults" },
  ],
  ops: [
    { id: "unmatched", title: "Unmatched payments", expandsTo: "/notifications?tag=Commissions", expandLabel: "Open triage" },
    { id: "reconciliation", title: "Reconciliation this month", expandsTo: "/commissions?state=all", expandLabel: "Open the ledger" },
    { id: "discrepancies", title: "Projected vs actual", expandsTo: "/commissions?state=discrepancy", expandLabel: "Flagged commissions" },
  ],
};

/* ── notifications — the triage space ─────────────────────── */

export type NotifTag = "Records" | "Commissions" | "Ingestion" | "Traveller" | "Connections" | "Knowledge";

export interface Notification {
  id: string;
  roles: Persona[];
  tag: NotifTag;
  severity: "Info" | "Important" | "Critical";
  headline: string;
  detail: string;
  subject: { label: string; href: string } | null;
  evidence?: string;
  generatedBy: string;
  when: string;
  action?: { label: string; href?: string };
  defaultState: "new" | "seen" | "actioned" | "deferred";
}

export const notifications: Notification[] = [
  { id: "n-conflict", roles: ["advisor", "colleague"], tag: "Records", severity: "Important", headline: "Three sources disagree on a commission rate", detail: "Maison Léandre carries 12%, 10% and 14% from three sources. Nothing has been assumed.", subject: { label: "Maison Léandre", href: "/records/maison-leandre" }, evidence: "Partner portal 12 Mar · Booking platform 28 Feb · Manual entry 03 Apr", generatedBy: "Conflict detection on the agency overlay", when: "Today 08:12", action: { label: "Resolve on the record", href: "/records/maison-leandre" }, defaultState: "new" },
  { id: "n-verlaine", roles: ["advisor", "colleague"], tag: "Records", severity: "Critical", headline: "Critical notice blocks a property you have shortlisted", detail: "Hôtel Verlaine has water damage on floors 2–3. Output is blocked until the notice is acknowledged.", subject: { label: "Hôtel Verlaine", href: "/records/hotel-verlaine" }, evidence: "Opened 26 Aug by M. Keller, agency scope", generatedBy: "Advisory severity gate", when: "Today 07:40", action: { label: "Open the record", href: "/records/hotel-verlaine" }, defaultState: "new" },
  { id: "n-overdue", roles: ["advisor"], tag: "Commissions", severity: "Important", headline: "Villa Ortensia commission is 12 days overdue", detail: "EUR 1,240 fell due 18 July. A reminder can be drafted; nothing sends without your review.", subject: { label: "VO-2214", href: "/commissions/vo" }, evidence: "Projected at 12% plus an active +3% bonus", generatedBy: "Commission ageing", when: "Today 06:00", action: { label: "Open the commission", href: "/commissions/vo" }, defaultState: "new" },
  { id: "n-stale", roles: ["advisor", "colleague"], tag: "Records", severity: "Info", headline: "Four records have not been verified in 90 days", detail: "They still answer — with their date and a freshness warning attached.", subject: { label: "Records needing verification", href: "/records?evidence=stale" }, generatedBy: "Freshness sweep", when: "Yesterday 18:20", action: { label: "Review them", href: "/records?evidence=stale" }, defaultState: "seen" },
  { id: "n-incentive", roles: ["advisor"], tag: "Commissions", severity: "Important", headline: "A +3% incentive closes for booking in 9 days", detail: "Villa Ortensia. Book by 05 Sep, travel by 20 Dec. Three clients in your book match the window.", subject: { label: "Villa Ortensia", href: "/records/villa-ortensia" }, evidence: "Bonus — adds to base commission", generatedBy: "Incentive window watch", when: "Yesterday 09:05", action: { label: "See affected clients", href: "/records/villa-ortensia" }, defaultState: "new" },
  { id: "n-cancel", roles: ["advisor", "ops"], tag: "Commissions", severity: "Important", headline: "A cancellation has not been acknowledged", detail: "The Ischia cancellation was sent 24 hours ago and the property has no record of it.", subject: { label: "IS-0912", href: "/commissions/isc" }, generatedBy: "Cancellation verification loop", when: "Today 09:30", action: { label: "Contact the property" }, defaultState: "new" },
  { id: "n-credit", roles: ["advisor", "ops"], tag: "Commissions", severity: "Important", headline: "A cancellation resolved as credit, not refund", detail: "Commission protection does not apply when a property issues a credit. The loss is a decision, not a silent write-off.", subject: { label: "IS-0912", href: "/commissions/isc" }, generatedBy: "Commission protection rule", when: "Yesterday 16:44", action: { label: "Open the commission", href: "/commissions/isc" }, defaultState: "seen" },
  { id: "n-pref", roles: ["advisor"], tag: "Traveller", severity: "Important", headline: "A shortlisted property contradicts a stated preference", detail: "Hôtel Verlaine is tagged contemporary design. The profile holds a preference for classic interiors on three sources.", subject: { label: "S. Marchetti", href: "/travellers/s-marchetti" }, evidence: "Stated by client, 27 Aug call", generatedBy: "Preference conflict check", when: "Today 08:55", action: { label: "Open the profile", href: "/travellers/s-marchetti" }, defaultState: "new" },
  { id: "n-departure", roles: ["advisor"], tag: "Traveller", severity: "Info", headline: "A departure is 12 days out with an open checklist", detail: "S. Marchetti departs for Kyoto on 12 October. Six of nine items are complete.", subject: { label: "Kyoto & Kansai", href: "/travellers/s-marchetti" }, generatedBy: "Departure watch", when: "Today 06:00", action: { label: "Open the trip", href: "/itineraries" }, defaultState: "seen" },
  { id: "n-notice-stale", roles: ["advisor"], tag: "Records", severity: "Info", headline: "Two notices are past their review interval", detail: "A notice stays active until someone closes it. These two are asking whether they are still true.", subject: { label: "Notices due", href: "/notifications?tag=Records" }, generatedBy: "Stale advisory review", when: "Yesterday 07:10", action: { label: "Review them" }, defaultState: "new" },
  { id: "n-candidate", roles: ["lead", "ops"], tag: "Ingestion", severity: "Important", headline: "A new record is waiting for confirmation", detail: "Hotel Sereno Kyoto arrived from a DMC spreadsheet. Two fields are held: a converted rate with no source currency, and portal boilerplate.", subject: { label: "Hotel Sereno Kyoto", href: "/admin/review/sereno" }, evidence: "gdrive://dmc-kyoto-2026.xlsx · row 41", generatedBy: "Extraction pipeline", when: "Today 05:20", action: { label: "Confirm the record", href: "/admin/review/sereno" }, defaultState: "new" },
  { id: "n-duplicate", roles: ["lead", "ops"], tag: "Ingestion", severity: "Important", headline: "A possible duplicate needs a human decision", detail: "“Maison Leandre” from a portal sync matches an existing canonical record at 0.92. Nothing merges automatically.", subject: { label: "Maison Leandre", href: "/admin/review/leandre-dup" }, evidence: "name_sim 0.92 · city exact · google_place_id absent", generatedBy: "Semantic dedup", when: "Today 05:22", action: { label: "Review the match", href: "/admin/review/leandre-dup" }, defaultState: "new" },
  { id: "n-payment", roles: ["ops"], tag: "Commissions", severity: "Important", headline: "Two payments cannot be matched to a booking", detail: "EUR 410 arrived under a traveller name; EUR 862 against a property name that does not resolve. Unmatched money is visible, never parked.", subject: { label: "Unmatched payments", href: "/ops/resolution" }, generatedBy: "Payment reconciliation", when: "Today 04:10", action: { label: "Open matching", href: "/ops/resolution" }, defaultState: "new" },
  { id: "n-connector", roles: ["lead"], tag: "Connections", severity: "Critical", headline: "Partner portal credentials have expired", detail: "The connector last succeeded on 24 August. Answers exclude it and say so.", subject: { label: "Connections", href: "/admin/connections" }, generatedBy: "Integration health", when: "Today 03:02", action: { label: "Open connections", href: "/admin/connections" }, defaultState: "new" },
  { id: "n-publish", roles: ["lead"], tag: "Knowledge", severity: "Info", headline: "Two notices are awaiting publication", detail: "Submitted at team scope by an advisor. Publishing preserves the original owner.", subject: { label: "Publish queue", href: "/admin/publish" }, generatedBy: "Publication queue", when: "Yesterday 15:30", action: { label: "Review and publish", href: "/admin/publish" }, defaultState: "new" },
  { id: "n-sync", roles: ["lead", "ops"], tag: "Connections", severity: "Info", headline: "Booking-system figures are up to 48 hours behind", detail: "Totals derived from it carry their last-synced time rather than pretending to be current.", subject: null, generatedBy: "Sync monitor", when: "Yesterday 12:04", defaultState: "seen" },
];

export const notificationsFor = (role: Persona) => notifications.filter((n) => n.roles.includes(role));

/* ── travellers ───────────────────────────────────────────── */

export interface TravellerCard {
  id: string; name: string; relationshipStatus: string;
  nextTrip: string | null; departsInDays: number | null;
  profiles: number; preferences: number; acuityScore: number | null;
  shared: string | null;
}

export const travellerCards: TravellerCard[] = [
  { id: "s-marchetti", name: "S. Marchetti", relationshipStatus: "Active", nextTrip: "Kyoto & Kansai", departsInDays: 12, profiles: 3, preferences: 6, acuityScore: 82, shared: null },
  { id: "osei", name: "R. & M. Osei", relationshipStatus: "Recurring", nextTrip: "Patagonia crossing", departsInDays: 21, profiles: 2, preferences: 4, acuityScore: 74, shared: "J. Dubois" },
  { id: "whitfield", name: "A. Whitfield", relationshipStatus: "Active", nextTrip: "Lisbon, four nights", departsInDays: 3, profiles: 1, preferences: 3, acuityScore: null, shared: null },
  { id: "grandin", name: "L. Grandin", relationshipStatus: "Recurring", nextTrip: "Paris, thirtieth anniversary", departsInDays: 96, profiles: 2, preferences: 5, acuityScore: 68, shared: null },
  { id: "lindqvist", name: "D. Lindqvist", relationshipStatus: "Prospect", nextTrip: "Nile, dahabiya", departsInDays: 142, profiles: 1, preferences: 2, acuityScore: null, shared: null },
  { id: "achebe", name: "N. Achebe", relationshipStatus: "Active", nextTrip: "Serengeti, green season", departsInDays: 138, profiles: 2, preferences: 4, acuityScore: 79, shared: null },
];

export const traveller = {
  id: "s-marchetti",
  name: "S. Marchetti",
  relationshipStatus: "Active",
  departure: { trip: "Kyoto & Kansai", inDays: 12, checklist: { done: 6, of: 9, items: ["Passport valid", "Rail passes", "Kaiseki reservations", "Transfer name card", "Ryokan confirmed", "Travel insurance", "Host registration — pending", "Final documents — pending", "Weather brief — pending"] } },
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
  signalsBySource: [["Email extracts", 4], ["Call transcripts", 2], ["Booking platform", 2], ["Keyed by hand", 1]] as [string, number][],
  sharing: { state: "private" as "private" | "full" | "basic", with: "J. Dubois" },
  acuity: { status: "Complete" as const, score: 82, lastRun: "14 Aug" },
  trips: [
    { title: "Kyoto & Kansai", dates: "12–19 Oct 2026", status: "Booked" },
    { title: "Amalfi coast", dates: "May 2025", status: "Traveled" },
  ],
  /**
   * Real figures, gated. This section used to be a paragraph explaining that spend
   * "renders here" — narration standing in for the feature, which made the entitlement
   * rule something the reader had to take on trust. With the numbers present, a
   * colleague at Collaborator Full opening the same profile and finding no Financials
   * section at all is the proof: the sharing tier grants the person, the commission
   * entitlement grants the money, and the two are separate grants.
   */
  financials: {
    lifetimeSpend: 148_600,
    currency: "EUR",
    trips: 7,
    averageTripValue: 21_229,
    averageDailyRate: 1_180,
    since: "2019",
    source: "Booking system · synced yesterday 18:00",
  },
  financialsGated: true,
};

export const shortlistConflict = {
  property: "Hôtel Verlaine",
  reason: "listed as contemporary design; the profile holds a preference for classic interiors on three sources",
  swap: "Maison Léandre",
};

/* ── ingestion candidates ─────────────────────────────────── */

export const candidates = [
  {
    id: "sereno", name: "Hotel Sereno Kyoto", from: "DMC spreadsheet — semi-structured Excel",
    uri: "gdrive://dmc-kyoto-2026.xlsx", kind: "new" as const, match: null,
    fields: [
      { label: "Name", value: "Hotel Sereno Kyoto", snippet: "row 41 · col B", confidence: 0.98 },
      { label: "City", value: "Kyoto", snippet: "row 41 · col C", confidence: 0.97 },
      { label: "Rooms", value: "28", snippet: "row 41 · col F", confidence: 0.95 },
      { label: "Rate", value: "held — converted figure without source currency", snippet: "row 41 · col H: “€1,180” marked (converted)", confidence: 0.4, held: true },
      { label: "Description", value: "“View Hotel — experience refined luxury…”", snippet: "portal boilerplate detected", confidence: 0.3, template: true },
    ],
  },
  {
    id: "leandre-dup", name: "“Maison Leandre”", from: "portal sync", uri: "portal://meridian/sync-0827",
    kind: "duplicate" as const,
    match: { target: "Maison Léandre", similarity: 0.92, signals: [["name_sim", "0.92"], ["city", "exact"], ["google_place_id", "absent"]] as [string, string][] },
    fields: [
      { label: "Name", value: "Maison Leandre", snippet: "sync record 114", confidence: 0.92 },
      { label: "Rooms", value: "42", snippet: "sync record 114", confidence: 0.95 },
      { label: "Commission", value: "12%", snippet: "sync record 114", confidence: 0.9 },
    ],
  },
  {
    id: "villa-unknown", name: "“Villa ????”", from: "unreadable source row",
    uri: "gdrive://dmc-kyoto-2026.xlsx", kind: "held" as const, match: null, fields: [],
    /* Nothing was extracted, so the only honest thing to show is the row itself. */
    raw: {
      where: "row 63 · cols B–H",
      text: "Villa ????\t\t0\t\t\t¤¤¤\t(see attached)",
      note: "The row is in the sheet and unreadable: the name cell holds placeholder characters, the city cell is empty, and the rate cell carries a symbol with no currency.",
    },
  },
];

/* ── knowledge vault ──────────────────────────────────────── */

export interface VaultDoc {
  name: string; source: string; updated: string; access: string; state: string;
  detail?: { synced: string; usedIn: string; history: string[] };
}

export const vaultDocs: VaultDoc[] = [
  { name: "Peru — just-back notes", source: "Upload", updated: "02 Jul", access: "team · Paris", state: "ok" },
  { name: "Commission schedule.xlsx", source: "Drive sync", updated: "30 Jun", access: "admin only", state: "ok" },
  { name: "Rate note — Corvin & Wells", source: "Email-in", updated: "21 Jun", access: "private", state: "ok" },
  { name: "Kyoto ryokan briefing", source: "Intranet", updated: "04 Jun", access: "agency", state: "ok" },
  { name: "Supplier webinar notes", source: "Upload", updated: "28 May", access: "processing", state: "processing" },
  { name: "Marrakech riad rate sheet.pdf", source: "Drive sync", updated: "18 May", access: "agency", state: "ok" },
  { name: "Team call notes — 12 May", source: "Upload", updated: "12 May", access: "team · Paris", state: "ok" },
  { name: "Venice water-taxi contacts", source: "Intranet", updated: "02 May", access: "agency", state: "ok" },
  { name: "Atelier Collection terms.pdf", source: "Drive sync", updated: "12 Mar", access: "agency", state: "ok", detail: { synced: "12:04 · every 15 min", usedIn: "14 answers this month", history: ["MK widened access: team → agency · 14 Jun · logged", "Uploaded by MK, private on arrival · 12 Mar"] } },
  { name: "Meridian programme summary", source: "Intranet", updated: "28 Feb", access: "agency", state: "ok" },
  { name: "Serengeti camp relocation note", source: "Email-in", updated: "18 Aug", access: "agency", state: "ok" },
  { name: "Patagonia operator comparison", source: "Upload", updated: "09 Aug", access: "team · Paris", state: "ok" },
  { name: "Villa contracts — owner default clause", source: "Drive sync", updated: "24 Jul", access: "admin only", state: "ok" },
  { name: "Winter rate sheet 2025 (superseded)", source: "Drive sync", updated: "12 May", access: "agency", state: "archived" },
];

export const vaultStats = { total: 1284, verifiedSourcePct: 71, verified: 912, noSource: 372, tabs: { All: 1284, Drive: 812, Email: 96, Intranet: 341, Uploads: 35 } };

/* ── connections ──────────────────────────────────────────── */

export const connections = [
  { name: "Intranet documents", state: "ok" as const, lastSuccess: "09:12", posture: "MCP upstream" },
  { name: "Google Drive", state: "ok" as const, lastSuccess: "08:40", posture: "MCP upstream" },
  { name: "Booking system", state: "syncing" as const, lastSuccess: "yesterday 18:00", posture: "read-only · ground truth stays in source · sync up to 48h" },
  { name: "Partner portal", state: "credentials" as const, lastSuccess: "24 Aug", posture: "self-hosted fallback" },
  { name: "Inbound mail — parisdesk@inbound.enable…", state: "ok" as const, lastSuccess: "11:52", posture: "private by default, sender-verified" },
];

/**
 * Connection health — one rule, three surfaces.
 *
 * A source needs attention when its state is not `ok`. Expired credentials and a
 * sync running behind both degrade an answer, so both are counted: a source that
 * cannot be reached and a source that is stale are the same fact to the person
 * reading the answer. `/admin/connections`, `/settings` and the lead briefing all
 * read this, because a product whose argument is data integrity cannot have two
 * screens disagreeing about the same number.
 */
export const connectionsNeedingAttention = connections.filter((c) => c.state !== "ok");

export const connectionHealth = {
  sources: connections.length,
  needAttention: connectionsNeedingAttention.length,
  /** The one phrase for the count, so the three surfaces also agree in words. */
  label: `${connectionsNeedingAttention.length} need attention`,
};

/* ── ops: unmatched payments ──────────────────────────────── */

/** The confirmation queue's floor, for the same reason as `closedPayments`. */
export const confirmedRecently = [
  { id: "cr1", name: "Ryokan Nishimura", uri: "gdrive://kyoto-partners.xlsx", by: "M. Keller", when: "Today 08:15", note: "Four fields confirmed, one corrected — rate currency was JPY, not USD." },
  { id: "cr2", name: "Casa Bellavista", uri: "mail://forwarded · Amalfi openings", by: "M. Keller", when: "Yesterday 14:50", note: "Confirmed as written. Programme left unset — no evidence in the source." },
  { id: "cr3", name: "Hôtel des Marais", uri: "intranet://paris-additions", by: "A. Blanc", when: "Yesterday 09:05", note: "Merged into the existing record; the duplicate stayed logged." },
];

/**
 * What the queue has already closed. A queue built to trend toward zero looks broken
 * in the state it is designed to reach — two rows and a large empty panel reads as a
 * failure to load, not as a good morning's work. The closed list gives the surface a
 * floor, and it is the audit trail the reconciliation claim depends on anyway.
 */
export const closedPayments = [
  { id: "cp1", amount: 1240, currency: "EUR", ref: "LN-4471 · Maison Léandre", reason: "Booker paid under her married name; matched against the booking email.", by: "A. Blanc", when: "Today 09:40" },
  { id: "cp2", amount: 305, currency: "EUR", ref: "KX-1108 · Kyoto transfer", reason: "Split payment, second half. Matched to the same booking as the deposit.", by: "A. Blanc", when: "Yesterday 16:15" },
  { id: "cp3", amount: 2180, currency: "EUR", ref: "VO-2214 · Verlaine", reason: "Property name misspelt on the transfer; confirmed by the partner portal reference.", by: "A. Blanc", when: "Yesterday 11:02" },
];

export const orphanedPayments = [
  { id: "op1", amount: 410, currency: "EUR", raw: "R. Osei", note: "arrived under traveller name; booker is M. Osei", candidates: [{ ref: "VO-2214 · booker M. Osei (traveller R. Osei)", strength: "strong" }, { ref: "KX-1108 · no name overlap", strength: "weak" }] },
  { id: "op2", amount: 862, currency: "EUR", raw: "“Pipery Hotel”", note: "unresolvable property name", candidates: [{ ref: "Maison Léandre (name_sim 0.41)", strength: "weak" }] },
];

/* ── ask ──────────────────────────────────────────────────── */

export interface Conversation {
  id: string; title: string; preview: string; when: string; messages: number;
  state?: "conflict" | "refusal" | "answered";
  /**
   * The thread is about commission terms. A reader without commission access may
   * still hold the question — it is theirs to ask — but the outcome describes
   * material they cannot read. `sources disagree` told a colleague that a
   * commission conflict exists, and the message count sized a transcript they
   * cannot open. Both are withheld from the index for that reader.
   */
  needsCommission?: boolean;
}

export const conversations: Conversation[] = [
  { id: "leandre-rate", title: "Maison Léandre — Atelier rate", preview: "What is our commission, and does the rate include breakfast?", when: "Today 09:14", messages: 4, state: "conflict", needsCommission: true },
  { id: "third-night", title: "Third night free on suites", preview: "Does Maison Léandre still give a third night free?", when: "Today 08:31", messages: 2, state: "refusal" },
  { id: "kaiseki", title: "Kaiseki near Gion", preview: "Counter seats for two, mid-October, walkable from the ryokan.", when: "Yesterday 17:02", messages: 6, state: "answered" },
  { id: "patagonia-mobility", title: "Patagonia — mobility-friendly cabins", preview: "Which operators have step-free cabins on the fjord sailings?", when: "Yesterday 11:20", messages: 5, state: "answered" },
  { id: "spa-status", title: "Is the spa at Maison Léandre open?", preview: "Client asked directly. Checking before I answer.", when: "26 Aug", messages: 2, state: "answered" },
  { id: "rep-paris", title: "Who represents Maison Léandre?", preview: "Rep firm and the current Paris contact.", when: "24 Aug", messages: 2, state: "answered" },
];

export const askThreads = {
  rep: { q: "Who represents Maison Léandre?", a: "Corvin & Wells hold the Paris account. The rate note is dated 21 June 2026.", cites: [3] },
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
    /* Third person, deliberately. The headline and body are the product speaking to
       the advisor and are set in the prose face; this is a footnote about how the
       system behaves, set in the machine face. A first-person sentence wearing the
       machine face made the two voices disagree in the same card. */
    policy: "Offers like this change without notice. Anything older than twelve months is held unless a second source confirms it.",
    held: [
      { label: "Partner portal", detail: "Suite offers, spring · 08 Apr 2025", age: "14 months old" },
      { label: "Email extract", detail: "Forwarded offer notice · 19 Mar 2025", age: "15 months old" },
    ],
    ctas: ["Forward a document to the vault", "Ask the rep firm", "Flag for review"],
  },
  stale: { q: "What are the pool hours at Maison Léandre?", a: "07:00–21:00 — last verified 96 days ago; may have changed.", warn: true },
  spa: {
    q: "Is the spa at Maison Léandre open?",
    v2: "The spa is closed to 15 September. An agency notice was opened on 12 June and is still active.",
    v1: "The spa is open, 07:00–21:00 daily.",
    v1Note: "The v1 build let the notice expire on 1 August. The spa is still closed. This answer is confidently wrong, and nothing on the screen says so.",
  },
};

/**
 * The trace is built from what the reader is allowed to see, not from the answer's
 * full lineage. A stage that only ever touched restricted material does not appear
 * for a reader who cannot see that material — otherwise the panel asserts it checked
 * a figure the answer has just declined to give, which is the contradiction the
 * whole product exists to avoid. `needsCommission` marks such a stage.
 */
export const trace: { stage: string; detail: string; needsCommission?: boolean }[] = [
  { stage: "Agency directory, vault, and notes", detail: "Read 3 documents in Partners / Atelier" },
  {
    stage: "Curated specialist layer",
    detail: "Checked the rate against the agency overlay",
    needsCommission: true,
  },
  { stage: "Vetted external sources", detail: "Found no active notice on this property" },
];

/* ── admin ────────────────────────────────────────────────── */

/** A queue item that arrived by mail carries the mail with it. */
export interface PublishSource {
  doc: string; from: string; via: string; received: string;
  subject: string; body: string; forwardedBy: string; access: string;
}

export const publishQueue: { id: string; text: string; action: string; source?: PublishSource }[] = [
  { id: "spa-pub", text: "Spa closure — submitted by R. Devane, team scope", action: "Publish agency-wide (owner preserved)" },
  {
    id: "camp-pub", text: "Serengeti camp relocation — from forwarded mail", action: "Review source",
    /* An item that arrived by mail carries the mail. "Review source" opens this. */
    source: {
      doc: "Serengeti camp relocation note",
      from: "operations@tsavora.example",
      via: "parisdesk@inbound.enable… · sender-verified",
      received: "18 Aug 09:26",
      subject: "Camp relocation — September",
      body: "The camp moves with the migration from 10 September. New coordinates follow next week; the airstrip transfer is unchanged. Please pass this to anyone holding September arrivals.",
      forwardedBy: "R. Devane",
      access: "agency",
    },
  },
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

/* ── itinerary (worked example) ───────────────────────────── */

export const itinerary = {
  id: "kyoto-kansai",
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
