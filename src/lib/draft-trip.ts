/**
 * Drafting a trip — the assistant asks, then assembles (the builder, in the lab;
 * Constantin, 2026-09-25).
 *
 * The market calls "generate a seven-day trip" low value for luxury work, because a
 * generator invents. This one does not: it asks only what it cannot work out (who, where
 * and when, what it is for and how full the days should be), then ASSEMBLES a draft from
 * what the agency already knows: the traveller's profile, the agency's records in that
 * place (open, in a programme, not closed by a notice, not against the traveller's
 * taste), and the desk's own notes. Every line arrives as a suggestion carrying its
 * reason and its source; nothing is asked of a supplier until the advisor keeps it.
 *
 * The conversation is kept in the answers themselves: each question's answer carries the
 * brief so far and what it is waiting for, so a reply (a tapped option or typed words)
 * answers the last question asked. Deterministic here; a model would phrase the same
 * facts in production.
 */
import type { DemoState, AssistantAnswer } from "@/lib/store";
import { allTrips } from "@/lib/store";
import { travellerCards, products, commissions, type Trip } from "@/data/seed";
import {
  addDays, daysOf, datesLabel, dayLabel, preferencesOf, termsFor, TODAY,
  type DraftBrief, type TripLine, type LineKind,
} from "@/data/trip-lines";
import { blockOf, tasteClash } from "@/lib/trip-checks";

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const SHORT = MONTHS.map((m) => m.slice(0, 3));
const pad = (n: number) => String(n).padStart(2, "0");
const norm = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const nightsBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/* ── what the desk knows about a place: its arrival point, its drivers, its days ──
   Fictional, written as the desk's own notes would be. A place with nothing here still
   gets a draft; it says what is missing instead of inventing it. */
interface Idea { what: string; time: string; supplier: { name: string; email: string }; reason: string }
interface Place {
  hub: string; arriveBy: "train" | "flight";
  drivers: { name: string; email: string };
  ideas: Idea[];
  dinners: (Idea & { avoid?: string[] })[];
  source: string;
}
const PLACES: Record<string, Place> = {
  paris: {
    hub: "Gare du Nord", arriveBy: "train",
    drivers: { name: "Chauffeurs de Paris", email: "bookings@chauffeursdeparis.example" },
    ideas: [
      { what: "Private morning at the Musée Rodin", time: "09:00", supplier: { name: "Musée Rodin, group bookings", email: "groupes@musee-rodin.example" }, reason: "Opens early for two; the garden is at its quietest before ten" },
      { what: "The Marais with a historian", time: "10:00", supplier: { name: "Paris Heritage Walks", email: "book@parisheritage.example" }, reason: "Two hours at their own pace, from the hotel's door" },
      { what: "The Orangerie at the quiet hour", time: "14:30", supplier: { name: "Musée de l'Orangerie, groups", email: "groupes@orangerie.example" }, reason: "The water lilies without the crowd" },
      { what: "The Seine by private boat at dusk", time: "17:00", supplier: { name: "Vedettes Privées", email: "reservations@vedettesprivees.example" }, reason: "An hour on the water, heated cabin in December" },
    ],
    dinners: [
      { what: "Dinner, Le Clos Arsène", time: "20:00", supplier: { name: "Le Clos Arsène", email: "reservations@closarsene.example" }, reason: "Classic French with no shellfish on the tasting menu" },
      { what: "Dinner, Maison Lafitte", time: "20:00", supplier: { name: "Maison Lafitte", email: "table@maisonlafitte.example" }, reason: "A quiet room upstairs, bookable for two" },
    ],
    source: "Paris desk notes",
  },
  lisbon: {
    hub: "Lisbon airport", arriveBy: "flight",
    drivers: { name: "Lisboa Private Drivers", email: "ops@lisboadrivers.example" },
    ideas: [
      { what: "A day in Sintra with a private guide", time: "09:30", supplier: { name: "Sintra Private Tours", email: "hello@sintraprivate.example" }, reason: "The palaces before the coaches arrive" },
      { what: "Tile workshop in Alfama", time: "10:00", supplier: { name: "Azulejo Atelier", email: "studio@azulejoatelier.example" }, reason: "Two hours, and they take a tile home" },
      { what: "Fado in a private house", time: "21:00", supplier: { name: "Casa do Fado", email: "reservas@casadofado.example" }, reason: "Twelve guests, no stage" },
    ],
    dinners: [{ what: "Dinner, Casa Aldeia", time: "20:30", supplier: { name: "Casa Aldeia", email: "mesa@casaaldeia.example" }, reason: "The terrace over the river, heated in winter" }],
    source: "Lisbon notes, R. Devane",
  },
  kyoto: {
    hub: "Kyoto station", arriveBy: "train",
    drivers: { name: "Kyoto Private Cars", email: "desk@kyotocars.example" },
    ideas: [
      { what: "Fushimi Inari before the crowds", time: "07:30", supplier: { name: "Kyoto Private Cars", email: "desk@kyotocars.example" }, reason: "The gates at first light, with a driver waiting" },
      { what: "Private tea ceremony in Gion", time: "10:00", supplier: { name: "Gion Chakai", email: "reserve@gionchakai.example" }, reason: "A host who speaks English, for two" },
      { what: "Kaiseki cooking lesson", time: "15:00", supplier: { name: "Kyo-Ryori School", email: "class@kyoryori.example" }, reason: "Three hours, ending at the table" },
    ],
    dinners: [{ what: "Kaiseki, Kikunoi Honten", time: "19:00", supplier: { name: "Kikunoi Honten", email: "reserve@kikunoi.example" }, reason: "The agency's kaiseki of record, verified May" }],
    source: "New in Kyoto for autumn, the agency",
  },
  cotswolds: {
    hub: "Moreton-in-Marsh station", arriveBy: "train",
    drivers: { name: "Cotswold Chauffeurs", email: "book@cotswoldchauffeurs.example" },
    ideas: [
      { what: "Hidcote gardens with the head gardener", time: "10:00", supplier: { name: "Hidcote, private visits", email: "visits@hidcote.example" }, reason: "An hour before the gates open, in May bloom" },
      { what: "A morning in Chipping Campden", time: "10:30", supplier: { name: "Cotswold Chauffeurs", email: "book@cotswoldchauffeurs.example" }, reason: "The wool town on foot, the car waiting at the end" },
      { what: "Cookery at a farm kitchen", time: "14:00", supplier: { name: "Daylesford Cookery School", email: "cookery@daylesford.example" }, reason: "A half day, lunch included" },
    ],
    dinners: [{ what: "Dinner, The Wild Rabbit", time: "19:30", supplier: { name: "The Wild Rabbit", email: "table@thewildrabbit.example" }, reason: "A quiet corner table, fish that is not shellfish" }],
    source: "Cotswolds notes, the agency",
  },
  marrakech: {
    hub: "Marrakech airport", arriveBy: "flight",
    drivers: { name: "Atlas Private Cars", email: "book@atlascars.example" },
    ideas: [
      { what: "Majorelle Garden at opening", time: "08:00", supplier: { name: "Jardin Majorelle, groups", email: "groupes@majorelle.example" }, reason: "The only quiet hour it has" },
      { what: "A private hammam", time: "16:00", supplier: { name: "Hammam de la Rose", email: "rdv@hammamrose.example" }, reason: "Booked for two, not shared" },
      { what: "The Atlas foothills, with lunch", time: "09:00", supplier: { name: "Atlas Private Cars", email: "book@atlascars.example" }, reason: "A day out of the medina, back by dusk" },
    ],
    dinners: [{ what: "Dinner, Dar Yacout", time: "20:30", supplier: { name: "Dar Yacout", email: "tables@daryacout.example" }, reason: "The roof terrace, booked ahead for two" }],
    source: "Marrakech notes, the agency",
  },
};

/* What the profile says the occasion is, when it says. */
const OCCASIONS: Record<string, { anniversary?: { label: string; on?: string } }> = {
  "L. Grandin": { anniversary: { label: "thirtieth anniversary", on: "12-05" } },
};

/* Where the traveller has said they want to go: the first options offered. */
const WISHES: Record<string, string[]> = {
  "L. Grandin": ["Paris, 3–7 December", "The Cotswolds, 4 nights in May"],
  "N. Achebe": ["Marrakech, 12–16 November", "Lisbon, 4 nights in October"],
  "S. Marchetti": ["Kyoto, 4 nights in April", "Lisbon, 4 nights in October"],
  "A. Whitfield": ["Lisbon, 4 nights in October", "Paris, early December"],
};

/* ── reading a reply ──────────────────────────────────────────────────────────── */

function whoFrom(text: string, s: DemoState): DraftBrief["who"] {
  const t = norm(text);
  const people = [
    ...travellerCards.map((x) => ({ id: x.id, name: x.name })),
    ...s.createdTravellers.filter((x) => x.by === s.role).map((x) => ({ id: x.id, name: x.name })),
  ];
  return people.find((p) => {
    const surname = norm(p.name).split(/[.\s&]+/).filter((w) => w.length > 2).pop() ?? "";
    return surname && t.includes(surname);
  });
}

const KNOWN_PLACES = () => [...new Set([
  ...Object.keys(PLACES),
  ...products.map((p) => norm(p.city).replace(/\s*\d+e$/, "")),
])];

function whereFrom(text: string): string | undefined {
  const t = norm(text);
  const hit = KNOWN_PLACES().find((p) => p.length > 3 && t.includes(p));
  if (hit) return hit.replace(/\b\w/g, (c) => c.toUpperCase());
  const m = text.match(/\b(?:to|in)\s+([A-Z][a-zà-ÿ]+(?:\s[A-Z][a-zà-ÿ]+)?)/);
  return m && !MONTHS.includes(norm(m[1])) ? m[1] : undefined;
}

/** "3 to 7 December", "3–7 Dec", "12–16 November", "4 nights in October", "early December". */
function whenFrom(text: string): { from: string; to: string } | undefined {
  const t = norm(text);
  const mi = MONTHS.findIndex((m, i) => t.includes(m) || new RegExp(`\\b${SHORT[i]}\\b`).test(t));
  if (mi < 0) {
    if (/next month/.test(t)) return span(Number(TODAY.slice(5, 7)) % 12, 12, 4);
    return undefined;
  }
  const nums = [...t.matchAll(/\b(\d{1,2})\b/g)].map((m) => Number(m[1]));
  const nightsWord = t.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s+nights?\b/);
  const nights = nightsWord ? (Number(nightsWord[1]) || WORDS.indexOf(nightsWord[1])) : /week\b/.test(t) ? 7 : /long weekend/.test(t) ? 3 : 4;
  const days = nums.filter((n) => n >= 1 && n <= 31 && !(nightsWord && n === nights));
  if (days.length >= 2 && days[1] > days[0]) return span(mi, days[0], days[1] - days[0]);
  if (days.length === 1) return span(mi, days[0], nights);
  return span(mi, /mid/.test(t) ? 14 : /late|end/.test(t) ? 24 : 3, nights);
}
function span(month: number, day: number, nights: number) {
  const thisYear = Number(TODAY.slice(0, 4));
  let from = `${thisYear}-${pad(month + 1)}-${pad(day)}`;
  if (from <= TODAY) from = `${thisYear + 1}-${pad(month + 1)}-${pad(day)}`;
  return { from, to: addDays(from, Math.max(1, nights)) };
}

function purposeFrom(text: string, who?: DraftBrief["who"]): Pick<DraftBrief, "occasion" | "pace"> {
  const t = norm(text);
  const pace: DraftBrief["pace"] | undefined = /slow|one thing|quiet|relax|gentle/.test(t) ? "slow" : /full|busy|packed|lots/.test(t) ? "full" : undefined;
  let occasion: string | undefined;
  if (/anniversary/.test(t)) occasion = (who && OCCASIONS[who.name]?.anniversary?.label) ?? "an anniversary";
  else if (/birthday/.test(t)) occasion = "a birthday";
  else if (/honeymoon/.test(t)) occasion = "a honeymoon";
  else if (/break|nothing in particular|just/.test(t)) occasion = "a break";
  return { occasion, pace };
}

/* ── the next question, or the brief played back ─────────────────────────────── */

export function isDraftIntent(q: string) {
  return /\b(draft|plan|build|put together|make)\b.*\b(trip|itinerary|journey)\b|\bdraft (a|an|the)\b/i.test(q);
}

/** A new draft, from the first words and where it was asked. */
export function startDraft(q: string, path: string, s: DemoState, tripId: string, seed: Partial<DraftBrief> = {}): AssistantAnswer {
  const onTraveller = path.match(/^\/travellers\/([^/?]+)/)?.[1];
  const fromPage = onTraveller ? travellerCards.find((t) => t.id === onTraveller) : undefined;
  const who = seed.who ?? whoFrom(q, s) ?? (fromPage ? { id: fromPage.id, name: fromPage.name } : undefined);
  const when = whenFrom(q);
  const brief: DraftBrief = {
    tripId, who,
    where: seed.where ?? whereFrom(q),
    from: seed.from ?? when?.from, to: seed.to ?? when?.to,
    ...purposeFrom(q, who),
    ...(seed.occasion ? { occasion: seed.occasion } : {}),
    ...(seed.pace ? { pace: seed.pace } : {}),
  };
  return nextQuestion(brief);
}

/** A reply to the last question asked. */
export function continueDraft(prev: DraftBrief, reply: string, s: DemoState): AssistantAnswer {
  const b: DraftBrief = { ...prev };
  const t = norm(reply);
  switch (prev.awaiting) {
    case "who": { const w = whoFrom(reply, s); if (w) b.who = w; else return { ...nextQuestion(b), text: ["I can't find them among your travellers. Choose one, or add them in Travellers first."] }; break; }
    case "where": { const w = whereFrom(reply); const d = whenFrom(reply); if (w) b.where = w; if (d) { b.from = d.from; b.to = d.to; } break; }
    case "when": { const d = whenFrom(reply); if (d) { b.from = d.from; b.to = d.to; } break; }
    case "purpose": { const p = purposeFrom(reply, b.who); b.occasion = p.occasion ?? b.occasion ?? (reply.trim() ? reply.trim().toLowerCase() : undefined); b.pace = p.pace ?? b.pace ?? "slow"; break; }
    case "change": {
      if (/who/.test(t)) b.who = undefined;
      else if (/where|when/.test(t)) { b.where = undefined; b.from = undefined; b.to = undefined; }
      else { b.occasion = undefined; b.pace = undefined; }
      break;
    }
    case "confirm": {
      if (/change|no|different/.test(t)) return changeQuestion(b);
      break;
    }
  }
  return nextQuestion(b);
}

function changeQuestion(b: DraftBrief): AssistantAnswer {
  return {
    text: ["What should change?"], draft: { ...b, awaiting: "change" },
    ask: { groups: [{ name: "Change", options: ["Who is going", "Where and when", "What it is for"] }] },
  };
}

function nextQuestion(b: DraftBrief): AssistantAnswer {
  if (!b.who) {
    return {
      text: ["Who is travelling?"], draft: { ...b, awaiting: "who" },
      ask: { groups: [{ name: "Traveller", options: travellerCards.map((t) => t.name) }] },
    };
  }
  if (!b.where) {
    return {
      text: [`Where is ${b.who.name} going, and when?`], draft: { ...b, awaiting: "where" },
      ask: { groups: [{ name: "Where and when", options: WISHES[b.who.name] ?? ["Paris, early December", "Lisbon, 4 nights in October"] }] },
      sources: WISHES[b.who.name] ? [`${b.who.name}'s profile: places they have asked about`] : undefined,
    };
  }
  if (!b.from || !b.to) {
    return {
      text: [`When are they in ${b.where}, and for how many nights?`], draft: { ...b, awaiting: "when" },
      ask: { groups: [{ name: "When", options: ["4 nights in early December", "A week in October", "A long weekend next month"] }] },
    };
  }
  if (!b.occasion || !b.pace) {
    const known = OCCASIONS[b.who.name]?.anniversary;
    return {
      text: ["What is it for, and how full should the days be?"], draft: { ...b, awaiting: "purpose" },
      ask: {
        groups: [
          { name: "For", options: [known ? `Their ${known.label}` : "An anniversary", "A birthday", "A honeymoon", "Just a break"] },
          { name: "Pace", options: ["Slow: one thing a day", "Full days"] },
        ],
        submit: "Continue",
      },
      sources: known ? [`${b.who.name}'s profile: ${known.label}`] : undefined,
    };
  }
  const n = nightsBetween(b.from, b.to);
  const prefs = (preferencesOf[b.who.name] ?? []).map((p) => p.text.toLowerCase());
  return {
    text: ["Here is what I heard. I'll assemble the draft from their profile and the agency's records, and put every line on the trip as a suggestion with its reason. Nothing is asked of anyone until you keep it."],
    facts: [
      ["who", b.who.name],
      ["where", b.where],
      ["when", `${datesLabel(b.from, b.to)} · ${n} ${n === 1 ? "night" : "nights"}`],
      ["for", b.occasion],
      ["pace", b.pace === "slow" ? "slow: one thing a day" : "full days"],
      ...(prefs.length ? [["their taste", prefs.join("; ")] as [string, string]] : []),
    ],
    draft: { ...b, awaiting: "confirm" },
    actions: [{ label: "Draft it", task: "draft-trip", brief: { ...b, awaiting: undefined } }, { label: "Change something", reply: "change something" }],
  };
}

/* ── the draft itself ─────────────────────────────────────────────────────────────── */

export interface DraftStep { label: string; detail: string; lines: TripLine[] }
export interface DraftPlan { trip: Trip; steps: DraftStep[]; count: number }

const titleCase = (x: string) => x.replace(/\b\w/g, (c) => c.toUpperCase());
const capFirst = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

export function planDraft(b: DraftBrief, s: DemoState): DraftPlan | null {
  if (!b.who || !b.where || !b.from || !b.to) return null;
  const city = norm(b.where);
  const place = PLACES[city];
  const nights = nightsBetween(b.from, b.to);
  const occasion = b.occasion && b.occasion !== "a break" ? b.occasion : undefined;
  const trip: Trip = {
    id: b.tripId,
    title: occasion ? `${titleCase(b.where)}, ${occasion.replace(/^(an?|their) /, "")}` : `${titleCase(b.where)}, ${WORDS[nights] ?? nights} nights`,
    traveller: b.who.name, travellerId: b.who.id,
    destinations: [titleCase(b.where)], dates: datesLabel(b.from, b.to),
    startsInDays: nightsBetween(TODAY, b.from), status: "Planning", nights, products: [],
  };
  const days = daysOf(trip);
  const line = (k: string, x: Omit<TripLine, "id" | "tripId" | "requests" | "status">): TripLine => ({ id: `${b.tripId}-${k}`, tripId: b.tripId, status: "idea", requests: [], ...x });
  const prefs = preferencesOf[b.who.name] ?? [];
  const steps: DraftStep[] = [];

  steps.push({ label: "Starting the trip", detail: `${trip.title} · ${b.who.name} · ${trip.dates}`, lines: [] });
  steps.push({
    label: `Reading ${b.who.name}'s profile`,
    detail: prefs.length ? prefs.map((p) => p.text.toLowerCase()).join(" · ") : "No stated preferences yet: the draft leans on the agency's records alone",
    lines: [],
  });

  /* where they sleep: the agency's own records in that place, open, in a programme, not
     closed by a notice, not against their taste; one they have stayed at before first */
  const here = products.filter((p) => (p.category === "Hotel" || p.category === "Cruise") && norm(p.city).includes(city));
  const stayedAt = new Set(commissions.filter((c) => c.traveller === b.who!.name).map((c) => c.productId));
  const fit = here
    .filter((p) => p.status === "Active" && !blockOf(s, p.id) && !tasteClash(b.who!.name, p.id))
    .sort((x, y) => Number(stayedAt.has(y.id)) - Number(stayedAt.has(x.id)) || y.programs.length - x.programs.length);
  const left = here.filter((p) => !fit.includes(p)).map((p) => {
    const why = [blockOf(s, p.id) ? "closed to bookings by the agency" : "", tasteClash(b.who!.name, p.id) ? `listed as ${tasteClash(b.who!.name, p.id)!.tag}` : "", p.status !== "Active" ? p.status.toLowerCase() : ""].filter(Boolean).join(", and ");
    return `not ${p.name}: ${why}`;
  });
  const hotel = fit[0];
  if (hotel) {
    const program = hotel.programs[0];
    const terms = program ? termsFor(hotel.id, program) : null;
    const quiet = prefs.find((p) => /quiet/i.test(p.text));
    const reason = [
      `${hotel.luxuryTier}, ${hotel.city}`,
      program && terms ? `${program}: ${terms.amenities.slice(0, 2).join(", ").toLowerCase()}` : "",
      stayedAt.has(hotel.id) ? `${b.who.name} has stayed here before` : "",
      quiet ? "courtyard rooms, away from the street" : "",
    ].filter(Boolean).join("; ");
    steps.push({
      label: "Choosing where they sleep",
      detail: [`${hotel.name}, ${nights} nights`, ...left].join(" · "),
      lines: [line("stay", {
        kind: "stay", on: b.from, until: b.to, time: "15:00", what: `${hotel.name}, ${WORDS[nights] ?? nights} nights`,
        detail: quiet ? "a courtyard room, away from the street" : undefined,
        productId: hotel.id, program, sell: nights * 1150,
        suggested: { reason, source: `the agency's record, verified ${hotel.lastVerified}${left.length ? `; ${left.join("; ")}` : ""}` },
      })],
    });
  } else {
    steps.push({
      label: "Choosing where they sleep",
      detail: `The agency has no open record in ${titleCase(b.where)}${left.length ? ` (${left.join("; ")})` : ""}`,
      lines: [line("stay", {
        kind: "stay", on: b.from, until: b.to, time: "15:00", what: `A stay in ${titleCase(b.where)}, ${WORDS[nights] ?? nights} nights`,
        suggested: { reason: "Nothing in the agency's records fits: add the stay from a record you know, or by hand", source: "the agency's records" },
      })],
    });
  }
  const sleepAt = hotel?.name ?? "the hotel";

  /* there and back: a car at each end; they book their own train or flight */
  const drivers = place?.drivers;
  const hub = place?.hub ?? "the airport";
  steps.push({
    label: "Getting them there and back",
    detail: `A car from ${hub} on arrival and back on ${dayLabel(b.to)}. The ${place?.arriveBy ?? "flight"} itself is theirs to book.`,
    lines: [
      line("in", { kind: "transfer", on: b.from, time: "14:15", what: `Car from ${hub} to ${sleepAt}`, supplier: drivers, suggested: { reason: "Every arrival on this desk gets a car; the travellers book their own " + (place?.arriveBy ?? "flight"), source: "the desk's standing rule" } }),
      line("out", { kind: "transfer", on: b.to, time: "11:00", what: `Car from ${sleepAt} to ${hub}`, supplier: drivers, suggested: { reason: "Check-out is at noon; the car leaves room for traffic", source: "the desk's standing rule" } }),
    ],
  });

  /* the days: one thing a day at a slow pace (and one day left free), two at a full one */
  const full = days.slice(1, -1);
  const ideas = place?.ideas ?? [];
  const occasionDay = (() => {
    const known = b.who && OCCASIONS[b.who.name]?.anniversary?.on;
    const exact = known && /anniversary/.test(occasion ?? "") ? full.find((d) => d.slice(5) === known) : undefined;
    return exact ?? full[Math.floor((full.length - 1) / 2)] ?? days[0];
  })();
  const dayLines: TripLine[] = [];
  let k = 0;
  full.forEach((d, i) => {
    const freeDay = b.pace === "slow" && full.length >= 3 && i === full.length - 1;
    if (freeDay) {
      dayLines.push(line(`free-${i}`, { kind: "note", on: d, what: "A free day", detail: "nothing planned, as they asked", suggested: { reason: "A slow pace keeps one day empty", source: "your brief" } }));
      return;
    }
    const per = b.pace === "full" ? 2 : 1;
    for (let j = 0; j < per && k < ideas.length; j++, k++) {
      const x = ideas[k];
      dayLines.push(line(`day-${i}-${j}`, { kind: "experience" as LineKind, on: d, time: x.time, what: x.what, supplier: x.supplier, suggested: { reason: x.reason, source: place!.source } }));
    }
  });
  if (!ideas.length && full.length) {
    dayLines.push(line("days", { kind: "note", on: full[0], what: `Plan the days in ${titleCase(b.where)}`, detail: "the desk has no notes here yet", suggested: { reason: "Nothing on file to suggest from; this is left to you", source: "the agency's records" } }));
  }
  steps.push({
    label: b.pace === "full" ? "Filling the days" : "Filling the days, slowly",
    detail: dayLines.length ? dayLines.map((l) => `${dayLabel(l.on)}: ${l.what.toLowerCase()}`).join(" · ") : "No full days on this trip",
    lines: dayLines,
  });

  /* the occasion's dinner, on its night, against what they will not eat */
  if (occasion && place?.dinners.length) {
    const avoid = prefs.map((p) => p.text.toLowerCase());
    const dinner = place.dinners.find((x) => !x.avoid?.some((a) => avoid.some((p) => p.includes(a)))) ?? place.dinners[0];
    const tenth = b.who.name === "L. Grandin" && /Clos Arsène/.test(dinner.what) ? "; they celebrated their tenth here" : "";
    /* "Dinner no earlier than 20:00" moves the table to that hour, and the reason says
       so: the last step claims nothing is against their taste, so the time must not be. */
    const earliest = avoid.map((p) => p.match(/dinner no earlier than (\d{1,2}:\d{2})/)?.[1]).find(Boolean);
    const time = earliest && earliest.padStart(5, "0") > dinner.time ? earliest.padStart(5, "0") : dinner.time;
    const moved = time !== dinner.time ? `; booked at ${time}, as they prefer` : "";
    steps.push({
      label: `The ${occasion.replace(/^(an?|their) /, "")} dinner`,
      detail: `${dinner.what.replace(/^Dinner, /, "")}, ${dayLabel(occasionDay)}: ${dinner.reason.toLowerCase()}${tenth}${moved}`,
      lines: [line("dinner", {
        kind: "dining", on: occasionDay, time, what: `${capFirst(occasion.replace(/^(an?|their) /, ""))} dinner, ${dinner.what.replace(/^Dinner, /, "")}`,
        detail: tenth ? "the table by the window" : undefined, supplier: dinner.supplier,
        suggested: { reason: `${dinner.reason}${tenth}${moved}`, source: tenth ? `${b.who.name}'s profile, call notes 14 Jul` : place.source },
      })],
    });
  }

  steps.push({
    label: "Checking the draft",
    detail: `Every night has a stay · a car at each end · nothing on a record the agency has closed${prefs.length ? " · nothing against their taste" : ""}`,
    lines: [],
  });
  return { trip, steps, count: steps.reduce((n, x) => n + x.lines.length, 0) };
}

/** Does this trip already exist (made by a draft that has started)? */
export const draftExists = (s: DemoState, id: string) => allTrips(s).some((t) => t.id === id);
