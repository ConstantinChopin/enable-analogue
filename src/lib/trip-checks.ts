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
 */
import type { DemoState } from "@/lib/store";
import { canViewCommissions } from "@/lib/store";
import type { Insight, Tier } from "@/lib/insights";
import { notices, promotions, productById, worldEvents, personName, type Trip } from "@/data/seed";
import {
  linesOf, daysOf, dayLabel, shortDate, addDays, supplierOf, preferencesOf, TODAY,
  type TripLine,
} from "@/data/trip-lines";

const daysFromToday = (iso: string) => Math.round((Date.parse(iso) - Date.parse(TODAY)) / 86_400_000);
const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekday = (iso: string) => WEEKDAY[new Date(`${iso}T12:00:00Z`).getUTCDay()];
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const nameOf = (l: TripLine) => (l.productId ? productById(l.productId)?.name : undefined) ?? l.what.split(",")[0];
const open = (l: TripLine) => l.status === "idea" || l.status === "requested" || l.status === "held";

/** The agency notice that closes a record to bookings, if one is in force. */
export function blockOf(s: DemoState, productId?: string) {
  if (!productId) return null;
  const seeded = notices.find((n) => n.productId === productId && n.severity === "Critical" && n.scope === "agency" && !s.retired[n.id]);
  if (seeded) return { text: seeded.text, openedAt: seeded.openedAt, by: personName.owner };
  const made = s.createdNotices.find((n) => n.productId === productId && n.severity === "Critical" && n.scope === "agency" && n.by === "owner");
  return made ? { text: made.text, openedAt: "today", by: personName.owner } : null;
}

/** A preference of the traveller's that the record's own tags argue with. */
export function tasteClash(traveller: string, productId?: string) {
  const p = productId ? productById(productId) : undefined;
  if (!p?.tags) return null;
  const pref = (preferencesOf[traveller] ?? []).find((x) => x.avoid?.some((a) => p.tags!.includes(a)));
  return pref ? { pref: pref.text, source: pref.source, tag: pref.avoid!.find((a) => p.tags!.includes(a))! } : null;
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

export function tripChecks(s: DemoState, t: Trip): Insight[] {
  const lines = linesOf(s.tripLines, t.id);
  const out: (Insight & { line?: string })[] = [];
  const soon = (t.startsInDays ?? 999) <= 30;
  const base = (l: TripLine | null, tier: Tier, id: string) => ({
    id: `${t.id}-${id}`, chapter: l ? `day-${l.on}` : "standing", title: "This trip", tier,
    subject: l ? `line:${l.id}` : `trip:${t.id}:${id}`, line: l?.id,
  });

  /* an empty trip: its first move is where they sleep */
  if (!lines.length) {
    const first = daysOf(t)[0];
    return first ? [{
      id: `${t.id}-start`, chapter: "standing", title: "This trip", tier: 3, within: t.startsInDays ?? undefined,
      subject: `trip:${t.id}:start`, facts: { nights: t.nights, destinations: t.destinations },
      headline: "Start with where they sleep",
      text: `${t.nights} ${t.nights === 1 ? "night" : "nights"} in ${t.destinations.join(" and ")}. Add a stay from the agency's records: its notices, programmes and the traveller's taste come with it.`,
      evidence: `the trip as you started it`,
      action: { label: "Add a stay", act: `add:stay:${first}` },
    }] : [];
  }

  /* a draft waiting for review comes first: its lines are suggestions, not yet the trip */
  const pending = lines.filter((x) => x.suggested);
  if (pending.length) {
    out.push({
      id: `${t.id}-review`, chapter: "standing", title: "This trip", tier: 1, within: 0,
      subject: `trip:${t.id}:review`, facts: { suggestions: pending.length },
      headline: pending.length === 1 ? "Review the last suggestion" : `Review the ${pending.length} suggestions`,
      text: `Enable drafted them from ${t.traveller}'s profile and the agency's records. Keep, swap or remove each; nothing is asked of anyone until you keep it.`,
      evidence: "the draft, as assembled",
      action: { label: "Review the first", act: `select:${pending[0].id}` },
    });
  }

  for (const l of lines.filter((x) => x.kind !== "note" && !x.suggested)) {
    const name = nameOf(l);
    const who = supplierOf(l)?.name ?? name;

    /* 1 · the agency closed the record this line books */
    const block = blockOf(s, l.productId);
    if (block && open(l)) {
      out.push({
        ...base(l, 1, `block-${l.id}`), within: 0,
        facts: { line: l.what, notice: block.text, by: block.by, openedAt: block.openedAt },
        headline: `Take ${name} off the trip`,
        text: `The agency closed it to bookings on ${block.openedAt}: ${reason(block.text)}. It stays closed until the property reopens.`,
        evidence: `Critical notice · ${block.by} · opened ${block.openedAt}`,
        action: { label: "Take it off the trip", act: `remove:${l.id}` },
      });
      continue;
    }

    /* 1 · a hold about to lapse */
    if (l.status === "held" && l.holdUntil && daysFromToday(l.holdUntil) <= 2) {
      const pending = l.requests.some((r) => r.kind === "confirm" && !r.reply);
      if (!pending) {
        out.push({
          ...base(l, 1, `hold-${l.id}`), within: daysFromToday(l.holdUntil),
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
        ...base(l, 1, `world-${l.id}`), within: daysFromToday(l.on),
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
        ...base(l, 2, `reply-${l.id}`), within: 0,
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
        ...base(l, 2, `declined-${l.id}`), within: daysFromToday(l.on),
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
        ...base(l, 2, `incentive-${l.id}`), within: inc.daysLeft,
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
        ...base(l, 3, `chase-${l.id}`), within: 0,
        facts: { line: l.what, supplier: who, sentOn: last.sentOn },
        headline: `Chase ${who}`,
        text: `You asked on ${shortDate(last.sentOn)} and have no reply.`,
        evidence: `Request sent ${last.sentAt}`,
        action: { label: "Draft the chase", act: `compose:${l.id}:chase` },
      });
      continue;
    }

    /* 3 · against the traveller's stated taste */
    const clash = tasteClash(t.traveller, l.productId);
    if (clash && open(l)) {
      out.push({
        ...base(l, 3, `taste-${l.id}`), within: daysFromToday(l.on),
        facts: { line: l.what, preference: clash.pref, tag: clash.tag },
        headline: `Check ${name} against ${t.traveller}'s taste`,
        text: `The record lists it as ${clash.tag}; ${t.traveller} asked for “${clash.pref.toLowerCase()}”.`,
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
        subject: `trip:${t.id}:gap`,
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
      subject: `trip:${t.id}:ideas`,
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
