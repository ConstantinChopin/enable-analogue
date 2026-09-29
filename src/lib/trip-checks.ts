/**
 * Trip checks — quality control on a trip, not trip generation
 * (docs/rebuild/06-itinerary-builder.md §5).
 *
 * The market's lesson: the model's value here is in reading data in and checking it,
 * not in writing seven-day trips. Each check is a deterministic join over the trip's
 * lines and what the agency already knows (its notices, its programmes' incentives, the
 * traveller's preferences, the world's events); a model would only phrase `facts`.
 * They come out as insights, so the trip page's rail and the Briefing read them the
 * same way. One per line: the most urgent covers the rest.
 *
 * Rank, as on the Briefing: 1 a traveller at risk (a blocked line, a hold ending, an
 * outside event on an unbooked day) · 2 money with a deadline, a gap, a refusal, a reply
 * waiting · 3 the rest (unasked ideas, a chase, a taste).
 *
 * 2026-09-28 (UX sweep COL-01, FB-01, FB-02, FB-07, NAV-09; VIS-097 to VIS-099): a check
 * also says its `state` in a few words, for the ledger's readiness column and the
 * inspector, with the tone the attention model allows (claret only for a line that
 * cannot proceed, ochre for a decision, else neutral). The gate is the store's one
 * `noticeGate`, so every surface blocks on the same notice in the same words. A taste
 * the advisor kept is recorded in the store (`decide`) and checks no more.
 */
import type { Dispatch } from "react";
import type { Action, CreatedTraveller, DemoState, ShareScope } from "@/lib/store";
import type { AudienceOption } from "@/components/share-sheet";
import { canViewCommissions, noticeGate, tripsFor } from "@/lib/store";
import { notify } from "@/lib/notify";
import type { Insight, Tier } from "@/lib/insights";
import { promotions, productById, worldEvents, personName, personInitials, people, type Persona, type Trip } from "@/data/seed";
import {
  linesOf, daysOf, dayLabel, shortDate, addDays, supplierOf, preferencesOf, TODAY,
  type TripLine,
} from "@/data/trip-lines";

const daysFromToday = (iso: string) => Math.round((Date.parse(iso) - Date.parse(TODAY)) / 86_400_000);
const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekday = (iso: string) => WEEKDAY[new Date(`${iso}T12:00:00Z`).getUTCDay()];
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
/** A line as a person names it: the record's name, or the line's own first words. */
export const nameOf = (l: TripLine) => (l.productId ? productById(l.productId)?.name : undefined) ?? l.what.split(",")[0];
const open = (l: TripLine) => l.status === "idea" || l.status === "requested" || l.status === "held";

/** A check as the trip page and the ledger read it: an insight, the line it is about, and
    its state in a few words with the tone the attention model allows (VIS-097). */
export type Check = Insight & { line?: string; state?: string; tone?: "crit" | "warn" | "neutral" };

/** The notice that closes a record to bookings, if one is in force. One gate (VIS-099):
    this reads the store's `noticeGate`, so a Critical notice blocks the same way on the
    trip, the add sheet, the traveller page and the record. Nobody acknowledges it. */
export function blockOf(s: DemoState, productId?: string) {
  if (!productId) return null;
  const g = noticeGate(s, productId);
  if (g?.level !== "block") return null;
  const by = (Object.keys(personInitials) as Persona[]).find((p) => personInitials[p] === g.notice.owner);
  return { text: g.notice.text, openedAt: g.notice.openedAt, by: by ? personName[by] : g.notice.owner };
}

/** An Important notice in force on the dates a line uses: a warning beside the property
    wherever it is chosen (VIS-099). A notice whose condition ends before then says nothing. */
export function cautionOf(s: DemoState, productId?: string, on?: string) {
  if (!productId) return null;
  const g = noticeGate(s, productId);
  if (g?.level !== "warn") return null;
  if (on && g.notice.until && g.notice.until < on) return null;
  return { text: g.notice.text, openedAt: g.notice.openedAt };
}

/* How a record's tag reads in the conflict sentence. */
const TAG_WORD: Record<string, string> = { "contemporary design": "contemporary" };

/** A preference of the traveller's that the record's own tags argue with, and the one
    sentence that says so (FB-02): "L. Grandin prefers classic interiors (3 sources);
    Hôtel Verlaine is contemporary." */
export function tasteClash(traveller: string, productId?: string) {
  const p = productId ? productById(productId) : undefined;
  if (!p?.tags) return null;
  const pref = (preferencesOf[traveller] ?? []).find((x) => x.avoid?.some((a) => p.tags!.includes(a)));
  if (!pref) return null;
  const tag = pref.avoid!.find((a) => p.tags!.includes(a))!;
  const n = pref.sources ?? 1;
  return {
    pref: pref.text, source: pref.source, tag, sources: n,
    sentence: `${traveller} prefers ${pref.prefers ?? pref.text.toLowerCase()} (${plural(n, "source", "sources")}); ${p.name} is ${TAG_WORD[tag] ?? tag}.`,
  };
}

/** The recorded choice to keep a property despite the traveller's taste (FB-07): one key
    per traveller and property, so the trip and the traveller page read the same record. */
export const tasteKey = (t: Pick<Trip, "travellerId" | "traveller">, productId: string) =>
  `keep:pref:${t.travellerId ?? t.traveller}:${productId}`;

/** "Kept despite the preference · R. Devane, 28 Aug", once someone kept it. */
export function keptWords(s: DemoState, t: Pick<Trip, "travellerId" | "traveller">, productId?: string) {
  const k = productId ? s.decisions[tasteKey(t, productId)] : undefined;
  return k ? `Kept despite the preference · ${personName[k.by]}, ${k.at.slice(0, 6)}` : null;
}

/** An incentive in words: a rate pays, a perk is added. */
export function incentiveWords(p: { program: string; rate: string; stacksWithBase: boolean }) {
  return /^[+\d]/.test(p.rate)
    ? `${p.program} pays ${p.rate}${p.stacksWithBase ? " extra" : ""}`
    : `${p.program} adds ${p.rate.charAt(0).toLowerCase() + p.rate.slice(1)}`;
}

/** A confirmed line whose commission this session put in Commissions: accepted from a
    reply, or marked by hand. Seeded bookings arrived from the booking system already. */
export function inCommissions(l: TripLine) {
  return l.status === "confirmed" && !!l.productId && !!l.program && !!l.sell && l.confirmation?.by !== "traveller"
    && (l.requests.some((r) => r.reply?.accepted && r.sentOn >= TODAY) || l.confirmation?.source === "by hand");
}

/** The incentive this line could still catch: its programme's promotion, window open. */
export function incentiveOf(l: TripLine) {
  if (!l.productId) return null;
  return promotions.find((p) => p.productId === l.productId && p.program === l.program && p.daysLeft > 0) ?? null;
}

const reason = (text: string) => { const r = text.split(" — ")[0].replace(/\.$/, ""); return r.charAt(0).toLowerCase() + r.slice(1); };

export function tripChecks(s: DemoState, t: Trip): Check[] {
  const lines = linesOf(s.tripLines, t.id);
  const out: Check[] = [];
  const soon = (t.startsInDays ?? 999) <= 30;
  const base = (l: TripLine | null, tier: Tier, id: string) => ({
    id: `${t.id}-${id}`, chapter: l ? `day-${l.on}` : "standing", title: "This trip", tier,
    subject: l ? `line:${l.id}` : `trip:${t.id}:${id}`, line: l?.id,
  });

  /* an empty trip: its first move is where they sleep. Only a trip started here is empty;
     a seeded trip with no lines keeps what it arrived with (its lines are in the booking
     system), so it has nothing to check here. */
  if (!lines.length) {
    const first = daysOf(t)[0];
    if (!first || !s.createdTrips.some((c) => c.id === t.id)) return [];
    return [{
      id: `${t.id}-start`, chapter: "standing", title: "This trip", tier: 3, within: t.startsInDays ?? undefined,
      subject: `trip:${t.id}:start`, facts: { nights: t.nights, destinations: t.destinations },
      headline: "Start with where they sleep", state: "Nothing on it yet", tone: "neutral",
      text: `${t.nights} ${t.nights === 1 ? "night" : "nights"} in ${t.destinations.join(" and ")}. Add a stay from the agency's records: its notices, programmes and the traveller's taste come with it.`,
      evidence: `the trip as you started it`,
      action: { label: "Add a stay", act: `add:stay:${first}` },
    }];
  }

  /* a draft waiting for review comes first: its lines are suggestions, not yet the trip */
  const pending = lines.filter((x) => x.suggested);
  if (pending.length) {
    out.push({
      id: `${t.id}-review`, chapter: "standing", title: "This trip", tier: 1, within: 0,
      subject: `trip:${t.id}:review`, facts: { suggestions: pending.length }, line: pending[0].id,
      state: `${plural(pending.length, "suggestion", "suggestions")} to review`, tone: "warn",
      headline: pending.length === 1 ? "Review the last suggestion" : `Review the ${pending.length} suggestions`,
      text: `Enable drafted them from ${t.traveller}'s profile and the agency's records. Keep, swap or remove each; nothing is asked of anyone until you keep it.`,
      evidence: "the draft, as assembled",
      action: { label: "Review the first", act: `select:${pending[0].id}` },
    });
  }

  for (const l of lines.filter((x) => x.kind !== "note" && !x.suggested)) {
    const name = nameOf(l);
    const who = supplierOf(l)?.name ?? name;

    /* 1 · the agency closed the record this line books. The one act is to take it off,
       and it lives on the line (a destructive act with Undo, never the rail's primary:
       NAV-09), so the rail opens the line. The taste it may also argue with is outranked
       and not said again (VIS-099). */
    const block = blockOf(s, l.productId);
    if (block && open(l)) {
      out.push({
        ...base(l, 1, `block-${l.id}`), within: 0, state: `${name} closed to bookings`, tone: "crit",
        facts: { line: l.what, notice: block.text, by: block.by, openedAt: block.openedAt },
        headline: `Take ${name} off the trip`,
        text: `${block.by} closed it to bookings on ${block.openedAt}: ${reason(block.text)}. It stays closed until the property reopens.`,
        evidence: `Critical notice · ${block.by} · opened ${block.openedAt}`,
        action: { label: "Open the line", act: `select:${l.id}` },
      });
      continue;
    }

    /* 1 · a hold about to lapse */
    if (l.status === "held" && l.holdUntil && daysFromToday(l.holdUntil) <= 2) {
      const asked = l.requests.some((r) => r.kind === "confirm" && !r.reply);
      if (!asked) {
        out.push({
          ...base(l, 1, `hold-${l.id}`), within: daysFromToday(l.holdUntil), state: `Hold ends ${shortDate(l.holdUntil)}`, tone: "warn",
          facts: { line: l.what, holdUntil: l.holdUntil, supplier: who },
          headline: `Confirm ${name} before ${weekday(l.holdUntil)}`,
          text: `They hold it until ${shortDate(l.holdUntil)}. After that it goes back on sale.`,
          evidence: `${who}${l.requests.find((r) => r.reply?.accepted)?.reply?.accepted ? `, accepted ${l.requests.find((r) => r.reply?.accepted)!.reply!.accepted!.at}` : ""}`,
          action: { label: "Ask them to confirm", act: `compose:${l.id}:confirm` },
        });
        continue;
      }
    }

    /* 1 · an outside event on the day of a line nobody has booked */
    const event = worldEvents.find((e) => t.destinations.includes(e.place) && l.on >= e.from && l.on <= e.to && e.affects.includes(l.kind === "transfer" ? "transfer" : l.kind === "stay" ? "hotel" : "touring"));
    if (event && l.status !== "confirmed") {
      out.push({
        ...base(l, 1, `world-${l.id}`), within: daysFromToday(l.on), state: `${cap(event.kind)} day, not booked`, tone: "warn",
        facts: { line: l.what, event: event.headline, on: l.on },
        headline: `Book ${l.what.charAt(0).toLowerCase() + l.what.slice(1)} before the ${event.kind}`,
        text: `${dayLabel(l.on)} is a ${event.kind} day in ${event.place}: ${event.effect}. Nothing is booked for this yet.`,
        evidence: `${event.source} · read ${event.readAt}`,
        action: { label: `Ask ${who}`, act: `compose:${l.id}:availability` },
      });
      continue;
    }

    /* 2 · a reply read and waiting to be accepted */
    const waiting = [...l.requests].reverse().find((r) => r.reply && !r.reply.accepted);
    if (waiting?.reply) {
      const said = waiting.reply.read.status === "held" ? `hold it until ${shortDate(waiting.reply.read.until ?? TODAY)}` : waiting.reply.read.status === "confirmed" ? `confirmed it${waiting.reply.read.ref ? `, ref ${waiting.reply.read.ref}` : ""}` : "said no";
      out.push({
        ...base(l, 2, `reply-${l.id}`), within: 0, state: "A reply to read", tone: "neutral",
        facts: { line: l.what, supplier: who, read: waiting.reply.read.status },
        headline: waiting.reply.read.status === "declined" ? `${who} said no` : `Accept what ${who} said`,
        text: waiting.reply.read.status === "declined"
          ? `${waiting.reply.read.note ?? "They cannot do it."}`
          : `The reply reads as: they ${said}. It stays a question until you accept it.`,
        evidence: `“${waiting.reply.doc}”, ${waiting.reply.at}`,
        action: { label: "Open the reply", act: `select:${l.id}` },
      });
      continue;
    }

    /* 2 · they said no */
    if (l.status === "declined") {
      out.push({
        ...base(l, 2, `declined-${l.id}`), within: daysFromToday(l.on), state: `${name} said no`, tone: "neutral",
        facts: { line: l.what, supplier: who },
        headline: `Find another ${l.kind === "dining" ? "table" : l.kind === "stay" ? "stay" : "option"} for ${dayLabel(l.on)}`,
        text: `${who} cannot do it. ${l.requests[l.requests.length - 1]?.reply?.read.note ?? ""}`.trim(),
        evidence: `Reply from ${who}`,
        action: { label: "Open the line", act: `select:${l.id}` },
      });
      continue;
    }

    /* 2 · an incentive window closing before the line is booked (money: gated) */
    const inc = incentiveOf(l);
    if (inc && canViewCommissions(s) && l.status !== "confirmed" && (t.status === "Planning" || t.status === "Inbound")) {
      out.push({
        ...base(l, 2, `incentive-${l.id}`), within: inc.daysLeft, state: `Book by ${inc.bookingWindowEnd}`, tone: "neutral",
        facts: { line: l.what, incentive: `${inc.program} ${inc.rate}`, bookBy: inc.bookingWindowEnd },
        headline: `Book ${name} by ${inc.bookingWindowEnd}`,
        text: `${incentiveWords(inc)} on bookings made before then. It is ${l.status === "idea" ? "still an idea" : "not confirmed yet"}.`,
        evidence: `${inc.program} incentive · ends in ${inc.daysLeft} days`,
        action: l.status === "idea" ? { label: `Ask ${who}`, act: `compose:${l.id}:availability` } : { label: "Open the line", act: `select:${l.id}` },
      });
      continue;
    }

    /* 3 · asked, no answer in two days */
    const last = l.requests[l.requests.length - 1];
    if (l.status === "requested" && last && !last.reply && daysFromToday(last.sentOn) <= -2) {
      out.push({
        ...base(l, 3, `chase-${l.id}`), within: 0, state: "No reply in 2 days", tone: "neutral",
        facts: { line: l.what, supplier: who, sentOn: last.sentOn },
        headline: `Chase ${who}`,
        text: `You asked on ${shortDate(last.sentOn)} and have no reply.`,
        evidence: `Request sent ${last.sentAt}`,
        action: { label: "Draft the chase", act: `compose:${l.id}:chase` },
      });
      continue;
    }

    /* 3 · against the traveller's stated taste, unless someone kept it (FB-07) */
    const clash = tasteClash(t.traveller, l.productId);
    if (clash && open(l) && !keptWords(s, t, l.productId)) {
      out.push({
        ...base(l, 3, `taste-${l.id}`), within: daysFromToday(l.on), state: `Against ${t.traveller}'s taste`, tone: "warn",
        facts: { line: l.what, preference: clash.pref, tag: clash.tag },
        headline: `Check ${name} against ${t.traveller}'s taste`,
        text: clash.sentence,
        evidence: `Preference · ${clash.source}`,
        action: { label: "Open the line", act: `select:${l.id}` },
      });
    }
  }

  /* 2 · nights nobody sleeps anywhere (only once a stay exists: an empty trip is a plan) */
  const stays = lines.filter((l) => l.kind === "stay" && l.until && l.status !== "declined");
  if (stays.length) {
    const nights = daysOf(t).slice(0, -1);
    const bare = nights.filter((n) => !stays.some((l) => n >= l.on && n < l.until!));
    if (bare.length) {
      const from = bare[0];
      const to = addDays(bare[bare.length - 1], 1);
      out.push({
        id: `${t.id}-gap`, chapter: `day-${from}`, title: "This trip", tier: soon ? 1 : 2, within: daysFromToday(from),
        subject: `trip:${t.id}:gap`, state: `${plural(bare.length, "night", "nights")} with no stay`, tone: "warn",
        facts: { nights: bare.length, from, to },
        headline: `Find a stay for ${plural(bare.length, "night", "nights")}`,
        text: `Nothing covers ${dayLabel(from)} to ${dayLabel(to)}. ${t.traveller} would have nowhere to sleep.`,
        evidence: `${plural(stays.length, "stay", "stays")} on the trip · ${plural(nights.length, "night", "nights")} in all`,
        action: { label: "Add a stay", act: `add:stay:${from}` },
      });
    }
  }

  /* 3 · ideas nobody has asked about yet, together: the assistant can ask for them all */
  const covered = new Set(out.map((x) => x.line).filter(Boolean));
  const ideas = lines.filter((l) => l.status === "idea" && l.kind !== "note" && !l.suggested && !covered.has(l.id) && !blockOf(s, l.productId) && supplierOf(l));
  if (ideas.length) {
    out.push({
      id: `${t.id}-ideas`, chapter: "standing", title: "This trip", tier: 3, within: t.startsInDays ?? undefined,
      subject: `trip:${t.id}:ideas`, line: ideas[0].id,
      state: `${plural(ideas.length, "idea", "ideas")} not asked`, tone: "neutral",
      facts: { ideas: ideas.map((l) => l.what) },
      headline: ideas.length === 1 ? `Ask about ${ideas[0].what.charAt(0).toLowerCase() + ideas[0].what.slice(1)}` : `Ask for the ${ideas.length} ideas`,
      text: ideas.length === 1 ? "Nobody has asked the supplier yet." : `Nobody has asked the suppliers yet. Enable can draft every request for you to read before it goes.`,
      evidence: `the trip's ${plural(ideas.length, "idea", "ideas")}, as of now`,
      action: ideas.length === 1 ? { label: `Ask ${supplierOf(ideas[0])!.name}`, act: `compose:${ideas[0].id}:availability` } : { label: "Ask for all of them", act: "ask-all" },
    });
  }

  return out.sort((a, b) => a.tier - b.tier || (a.within ?? 999) - (b.within ?? 999));
}

/** Where a trip stands, counted: what a person reads before the days. */
export function tallyOf(lines: TripLine[]) {
  const real = lines.filter((l) => l.kind !== "note");
  const n = (st: TripLine["status"]) => real.filter((l) => l.status === st).length;
  return { confirmed: n("confirmed"), held: n("held"), requested: n("requested"), idea: n("idea"), declined: n("declined"), total: real.length };
}

/** The commission a line will earn, worked from its programme's terms. Money: gated by
    the caller. */
export function projectedOf(l: TripLine, rate: number | null) {
  return l.sell && rate ? Math.round(l.sell * rate) : null;
}

/* ── readiness, in a word: the ledger's column and the inspector (COL-01) ─────────
   The most urgent check when one needs you now (tier 1), in its own few words and tone;
   otherwise how many lines are confirmed. A seeded trip with no lines here says what it
   arrived with: its alert, or its departure checklist. */
export type Readiness = { tone: "crit" | "warn" | "neutral"; text: string };
export function readinessOf(s: DemoState, t: Trip): Readiness | null {
  const lines = linesOf(s.tripLines, t.id);
  if (!lines.length) {
    if (t.alert) return { tone: "warn", text: cap(t.alert) };
    if (t.checklist) return { tone: "neutral", text: `Checklist ${t.checklist.done} of ${t.checklist.of}` };
    return s.createdTrips.some((c) => c.id === t.id) ? { tone: "neutral", text: "Nothing on it yet" } : null;
  }
  const first = tripChecks(s, t)[0];
  if (first && first.tier === 1) return { tone: first.tone ?? "warn", text: first.state ?? first.headline };
  const n = tallyOf(lines.filter((l) => !l.suggested));
  return { tone: "neutral", text: n.total ? `${n.confirmed} of ${n.total} confirmed` : "Nothing on it yet" };
}

/* ── who sees which trips (VIS-098) ─────────────────────────────────────────────
   The store's rule (`tripsFor`), and one more: a traveller shared at name and contact
   only brings none of their trips (a Basic share withholds journeys). */
export function visibleTrips(s: DemoState): Trip[] {
  return tripsFor(s).filter((t) => s.role === "user" || !(t.traveller === "S. Marchetti" && s.shareTier === "basic"));
}

/** A traveller's trips this person can see, soonest first; past trips last. */
export function tripsOfTraveller(s: DemoState, id: string, name: string): Trip[] {
  return visibleTrips(s)
    .filter((t) => t.travellerId === id || t.traveller === name)
    .sort((a, b) => (a.startsInDays ?? Number.MAX_SAFE_INTEGER) - (b.startsInDays ?? Number.MAX_SAFE_INTEGER));
}

/* ── one attention item per subject (VIS-099) ────────────────────────────────────
   What argues with a traveller's trips, for the traveller page and the list's inspector:
   one item per property on a trip, the most severe winning. A closed record outranks a
   taste, so the taste is not said while the notice stands. */
export interface Attention {
  trip: Trip; line: TripLine; name: string;
  kind: "block" | "taste";
  block?: NonNullable<ReturnType<typeof blockOf>>;
  /** The taste, as one sentence; and, once kept, who kept it and when. */
  sentence?: string; kept?: string | null;
}
export function attentionFor(s: DemoState, trips: Trip[]): Attention[] {
  const out: Attention[] = [];
  for (const t of trips) {
    for (const l of linesOf(s.tripLines, t.id)) {
      if (!l.productId || l.suggested || !open(l)) continue;
      const block = blockOf(s, l.productId);
      if (block) { out.push({ trip: t, line: l, name: nameOf(l), kind: "block", block }); continue; }
      const clash = tasteClash(t.traveller, l.productId);
      if (clash) out.push({ trip: t, line: l, name: nameOf(l), kind: "taste", sentence: clash.sentence, kept: keptWords(s, t, l.productId) });
    }
  }
  return out;
}

/* ── taking a line off a trip (NAV-09, FB-01, 2026-09-28) ────────────────────────
   Never the primary; destructive where it destroys; and every immediate removal can be
   put back from the toast. A property on the trip's shortlist comes off the shortlist as
   well (the store's `shortlistOff`), so the notice's notification closes with it. */
export function takeOff(s: DemoState, d: Dispatch<Action>, trip: Trip, line: TripLine, opts: { quiet?: boolean } = {}) {
  const listed = !!line.productId && (trip.shortlist ?? []).includes(line.productId) && !(s.shortlistOff[trip.id] ?? []).includes(line.productId);
  const before = s.shortlistOff;
  const removed = listed
    ? s.tripLines.filter((l) => l.id === line.id || (l.tripId === trip.id && l.productId === line.productId && l.status === "idea"))
    : [line];
  if (listed) d({ type: "shortlistOff", trip: trip.id, product: line.productId! });
  d({ type: "lineRemove", id: line.id });
  if (opts.quiet) return;
  notify(`${nameOf(line)} is off the trip`, {
    detail: trip.title,
    undo: () => {
      if (listed) d({ type: "patch", patch: { shortlistOff: before } });
      for (const l of removed) d({ type: "lineAdd", line: l });
    },
  });
}

/* ── a trip's audience (COL-10, VIS-101) ─────────────────────────────────────────
   Private to whoever made it until she shares it. Kept as a recorded choice (who, when)
   until the store has a trip-share field of its own, which would also carry a share with
   the whole agency into the owner's publish queue (reported 2026-09-28). */
export const tripShareKey = (id: string) => `share:trip:${id}`;
export function tripShareOf(s: DemoState, id: string): ShareScope {
  const v = s.decisions[tripShareKey(id)]?.what;
  return v === "team" || v === "agency" ? v : "private";
}

/* ── who can see a traveller, in the words the sheet uses (COL-10, VIS-101) ────────
   A traveller is shared with a person, not an audience: the list's label, the profile's
   sharing tool and the sheet say the same thing ("M. Keller · full profile"). The seeded
   share with J. Dubois is at the full profile too. Only S. Marchetti's share has a place
   in the store (`shareTier`); the others are shown and cannot yet be changed (reported
   2026-09-28: a per-traveller share in the store). */
export type TravellerTier = "private" | "full" | "basic";
export interface TravellerShare { tier: TravellerTier; with: string | null; live: boolean }

export function travellerShareOf(s: DemoState, card: { id: string; shared: string | null }): TravellerShare {
  if (card.id === "s-marchetti") return { tier: s.shareTier, with: s.shareTier === "private" ? null : people.owner, live: true };
  return card.shared ? { tier: "full", with: card.shared, live: false } : { tier: "private", with: null, live: false };
}

export function travellerShareWords(sh: TravellerShare, viewer: Persona): string {
  if (sh.tier === "private") return "Only you";
  const what = sh.tier === "full" ? "full profile" : "name and contact only";
  return viewer === "owner" ? `Shared by ${people.advisor} · ${what}` : `${sh.with} · ${what}`;
}

/** The sheet's choices for a traveller: the person, and how much of the profile. */
export const travellerShareOptions: AudienceOption<TravellerTier>[] = [
  { value: "private", label: "Only me", hint: `Nobody else at the agency reads it, ${people.owner} included.` },
  { value: "full", label: `${people.owner}, the full profile`, hint: "Every field, the sensitive ones included. She can edit it; she cannot share it on or delete it." },
  { value: "basic", label: `${people.owner}, name and contact only`, hint: "For an introduction. Preferences, trips and spend stay with you." },
];

export const describeTravellerShare = (name: string, v: TravellerTier) =>
  v === "private" ? `${name} is private to you` : `Shared ${name} with ${people.owner}, ${v === "full" ? "the full profile" : "name and contact only"}`;

/** A traveller added by hand: who can see it, in the words of the audience sheet. */
export function createdShareWords(t: CreatedTraveller, s: Pick<DemoState, "role" | "released">): { text: string; waiting: boolean; shared: boolean } {
  const mine = t.by === s.role;
  const decided = s.released[`trv-${t.id}`];
  const by = mine ? "" : `Shared by ${personName[t.by]} · `;
  if (t.share === "private") return { text: "Only you", waiting: false, shared: false };
  if (t.share === "team") return { text: `${by}The Paris desk`, waiting: false, shared: true };
  if (t.by === "owner" || decided?.outcome === "published") return { text: `${by}The whole agency`, waiting: false, shared: true };
  if (decided?.outcome === "returned") return { text: `Returned by ${people.owner}`, waiting: false, shared: false };
  return { text: mine ? `The whole agency, after ${people.owner}'s release` : `Waiting for your release · ${personName[t.by]}`, waiting: true, shared: true };
}
