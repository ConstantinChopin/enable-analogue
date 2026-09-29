/**
 * Insights — what a Briefing chapter's rows cannot say, and the one act that follows.
 *
 * Decided with Constantin, 2026-09-24.
 *
 * WHAT COUNTS. An insight is something the rows cannot show: a pattern across rows, a
 * join to another object, or a deadline with its consequence. A restated count is not
 * one. It is COMPUTED by a deterministic join over the model, so every claim can be
 * checked against the records it names; a model only phrases it. Here the phrasing is a
 * template over `facts`; `evidence` says where the facts came from.
 *
 * HOW IT READS (Constantin, 2026-09-25). A headline that names the act, then one or two
 * short sentences of context a reader takes in at a glance: plain words, one objective,
 * no clauses stacked on colons. The evidence line carries the rest.
 *
 * WHOSE ACT. The action is always the reader's own act, never another role's. (The first
 * version asked the advisor to acknowledge the owner's Critical notice "before anyone
 * shortlists": the owner governing the agency, addressed to the wrong person.)
 *
 * THE ADVISOR gets the agency's knowledge and money, and the world, joined to HER
 * clients: she cannot hold everything the agency knows against every trip she runs.
 *   world meets a client      an outside event × a leg of her trip on its day
 *   knowledge meets a client  an agency notice × her trips and shortlists, on their dates
 *   deadline × client         an incentive's booking window × her trips still in planning
 *   money pattern             her late commissions × the programme each was booked under
 *   departure risk            an open item × days left × the booking system's lag
 * She never gets governance (candidates, the publish queue, connections) or agency totals.
 *
 * THE OWNER gets each thing she governs, multiplied by what it reaches. Other advisors'
 * trips are private: she sees COUNTS, never names.
 *   world meets the desk      an outside event × every trip on the desk it touches
 *   a notice outliving itself her notices × the dates they hold for × live trips
 *   queue by consequence      a candidate × the trusted record and the trips booking it
 *   duplicate speech          a queued post × her own published notices
 *   money, agency-wide        payments × bookings; late money × programme
 *   the agency's sources      a broken connection × the answers that cite it
 * Parked: team demand (what advisors ask the assistant × what the agency has written) —
 * it needs a question log the model does not have yet.
 *
 * RANK, for both: 1 a traveller at risk · 2 money with a deadline · 3 money without one ·
 * 4 the agency's knowledge · 5 opportunities; then the sooner one. One insight per object:
 * the higher one covers the rest.
 *
 * ONE ORDER WITH THE INBOX (FB-04, VIS-097, 2026-09-28). The tiers above still choose
 * which insight covers an object, but the rail is ordered as Notifications is (store
 * `needsYou`): by severity, Critical first, then in the inbox's own order. Each insight
 * carries a severity; where an inbox item is about the same subject (`covers`), the two
 * are one item: the insight takes the notification's severity and place, and leaves the
 * rail when the notification is dealt with or deferred. Until then an expired partner
 * portal login was Critical in the inbox and fifth of seven on the Briefing. The first
 * in this order is the day's first move.
 */
import type { DemoState } from "@/lib/store";
import { canViewCommissions, queueItems, allTrips, inboxFor, needsYou } from "@/lib/store";
import {
  commissions, notices, promotions, trips, deskTrips, worldEvents, candidates,
  orphanedPayments, connections, productById,
  type Trip, type TripLeg,
} from "@/data/seed";
import { linesOf } from "@/data/trip-lines";
import { tripChecks } from "@/lib/trip-checks";

export type Tier = 1 | 2 | 3 | 4 | 5;
/** The inbox's three severities (VIS-097): the rail and Notifications rank by the same. */
export type Severity = "Critical" | "Important" | "Info";

export interface Insight {
  id: string;
  /** The Briefing chapter it belongs to (`widgetsFor` id). */
  chapter: string;
  /** The chapter's name: the card's small label. */
  title: string;
  /** What to do, as the card's heading: an imperative the action button completes. */
  headline: string;
  tier: Tier;
  /** Days until it bites. Breaks ties inside a tier. */
  within?: number;
  /** The object it is about. Two insights never cover one object. */
  subject: string;
  /** The computed facts: what a model would phrase from, and what a reader can check. */
  facts: Record<string, string | number | string[]>;
  /** One or two short sentences of context. A template here; a model's phrasing of
      `facts` in production. */
  text: string;
  /** Where the facts came from, said like an answer's sources. */
  evidence: string;
  /** The reader's own act. `sheet` opens a sheet on the Briefing instead of a page; `act`
      is handled by the page the rail sits on (the trip page: ask, add, take off). */
  action: { label: string; href?: string; sheet?: "announcement"; act?: string };
  /** How bad, in the inbox's words. Set by `insightsFor`; a trip's own checks leave it out. */
  severity?: Severity;
  /** The inbox item about the same subject, if there is one: its subject's href, and
      where one href holds two items, the tag and severity that tell them apart. */
  covers?: { href: string; tag?: string; severity?: Severity };
  /** The inbox item it was joined to (`covers`), once ranked. */
  inbox?: string;
}

/* ── dates ─────────────────────────────────────────────────────────────────── */

/** The seeded morning (the Briefing's "Friday 28 August"). */
const TODAY = "2026-08-28";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** "02–06 Sep 2026" or "20 Sep–04 Oct 2026" → "2026-09-02". */
function tripStart(t: Trip): string | null {
  const m = t.dates.match(/^(\d{1,2})(?:\s([A-Z][a-z]{2}))?[–-]\d{1,2}\s([A-Z][a-z]{2})\s(\d{4})/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2] ?? m[3]);
  return month < 0 ? null : `${m[4]}-${pad(month + 1)}-${pad(Number(m[1]))}`;
}
/** "2026-09-02" → "02 Sep". */
const short = (iso: string) => `${iso.slice(8, 10)} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
const daysFromToday = (iso: string) => Math.round((Date.parse(iso) - Date.parse(TODAY)) / 86_400_000);

const eur = (n: number) => `EUR ${n.toLocaleString("en-GB")}`;
/** A notice's reason, without its instruction: "Water damage on floors 2–3 — do not…" → "water damage on floors 2–3". */
const reasonOf = (text: string) => { const r = text.split(" — ")[0].replace(/\.$/, ""); return r.charAt(0).toLowerCase() + r.slice(1); };
const capital = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
const live = (t: Trip) => t.status !== "Traveled" && t.status !== "Cancelled";
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const touches = (legs: TripLeg[], e: (typeof worldEvents)[number]) =>
  legs.filter((l) => e.affects.includes(l.kind) && l.on >= e.from && l.on <= e.to);

/* ── a trip, read from its lines (src/data/trip-lines.ts) ─────────────────────────
   The builder's lines are the trip's truth: a leg's state, what it books and what it
   only shortlists are read from them, so confirming a car or taking a property off a
   trip in the builder changes every insight that mentions it. A trip with no lines
   yet keeps the summary it arrived with. */
const LEG: Record<string, TripLeg["kind"] | null> = { stay: "hotel", transfer: "transfer", dining: "dining", experience: "touring", note: null };
function legsOf(s: DemoState, t: Trip): TripLeg[] {
  const lines = linesOf(s.tripLines, t.id);
  if (!lines.length) return t.legs ?? [];
  return lines.filter((l) => LEG[l.kind]).map((l) => ({ kind: LEG[l.kind]!, on: l.on, what: l.what, state: l.status === "confirmed" ? "confirmed" : "unconfirmed" }));
}
function bookedOf(s: DemoState, t: Trip): string[] {
  const lines = linesOf(s.tripLines, t.id);
  if (!lines.length) return t.products;
  return lines.filter((l) => l.productId && l.status !== "idea" && l.status !== "declined").map((l) => l.productId!);
}
function listedOf(s: DemoState, t: Trip): string[] {
  const lines = linesOf(s.tripLines, t.id);
  if (!lines.length) return (t.shortlist ?? []).filter((p) => !s.shortlistOff[t.id]?.includes(p));
  return lines.filter((l) => l.productId && l.status === "idea").map((l) => l.productId!);
}
/** Where "Open the trip" goes: the trip itself, and the line when there is one. Every
    trip has its page in live and in the lab since 2026-09-28 (read-only outside the lab);
    until then the live app fell back to the Itineraries ledger. */
const tripHref = (_s: DemoState, t: Trip, line?: string) => `/itineraries/${t.id}${line ? `?line=${line}` : ""}`;
const lineOn = (s: DemoState, t: Trip, pred: (l: ReturnType<typeof linesOf>[number]) => boolean) =>
  linesOf(s.tripLines, t.id).find(pred)?.id;

/* ══ the advisor ═══════════════════════════════════════════════════════════════ */

/** World meets a client: an outside event on the day of one of her trip's legs. */
function worldMeetsClient(s: DemoState): Insight[] {
  const out: Insight[] = [];
  for (const e of worldEvents) {
    for (const t of allTrips(s).filter((x) => live(x) && x.destinations.includes(e.place))) {
      const hit = touches(legsOf(s, t), e).sort((a, b) => (a.state === "unconfirmed" ? -1 : 1) - (b.state === "unconfirmed" ? -1 : 1))[0];
      if (!hit) continue;
      const open = hit.state === "unconfirmed";
      out.push({
        id: `world-${e.id}-${t.id}`, chapter: "departures", title: "Departures", tier: 1,
        severity: open ? "Critical" : "Important",
        within: t.startsInDays ?? daysFromToday(hit.on), subject: `trip:${t.id}`,
        facts: { traveller: t.traveller, trip: t.title, event: e.headline, on: hit.on, leg: hit.what, legState: hit.state },
        headline: open ? `Book a car for ${t.traveller}'s arrival` : `Warn ${t.traveller} about the ${e.kind}`,
        text: `${t.traveller} lands in ${e.place} on ${short(hit.on)}, a ${e.kind} day. ${capital(e.effect)}. `
          + (open ? "The airport transfer is not booked yet." : "The transfer is booked, but the roads will be slow."),
        evidence: `${e.source} · read ${e.readAt}`,
        action: { label: "Open the trip", href: tripHref(s, t, lineOn(s, t, (l) => l.what === hit.what)) },
      });
    }
  }
  return out;
}

/** Knowledge meets a client: an agency notice on a property her trip books or shortlists,
    on dates the notice still holds for. */
function knowledgeMeetsClient(s: DemoState): Insight[] {
  const out: Insight[] = [];
  for (const n of notices.filter((x) => x.scope === "agency" && !s.retired[x.id] && !(x.id === "spa" && s.spaNoticeClosed))) {
    for (const t of allTrips(s).filter(live)) {
      const booked = bookedOf(s, t).includes(n.productId);
      /* taken off the shortlist this session (by hand, by the assistant, or in the
         builder): no longer listed */
      const listed = listedOf(s, t).includes(n.productId);
      if (!booked && !listed) continue;
      const start = tripStart(t);
      /* A condition that ends before the trip starts does not touch it. */
      if (n.until && start && start > n.until) continue;
      const critical = n.severity === "Critical";
      out.push({
        id: `notice-${n.id}-${t.id}`, chapter: "notices", title: "Notices",
        tier: critical || (t.startsInDays ?? 999) <= 30 ? 1 : 4,
        severity: n.severity, covers: { href: `/records/${n.productId}`, tag: "Records", severity: n.severity },
        within: t.startsInDays ?? undefined, subject: `notice:${n.id}`,
        facts: { property: n.productName, notice: n.text, severity: n.severity, trip: t.title, traveller: t.traveller, on: listed ? "shortlist" : "booked" },
        headline: critical
          ? (listed ? `Take ${n.productName} off ${t.traveller}'s shortlist` : `Move ${t.traveller} out of ${n.productName}`)
          : `Check ${n.productName} before you quote ${t.traveller}`,
        text: critical
          ? `The agency closed it to bookings on ${n.openedAt}: ${reasonOf(n.text)}. It stays closed until the property reopens.`
          : `Their trip ${listed ? "shortlists" : "books"} it, and an agency notice covers those dates: “${n.text}”`,
        evidence: `${n.severity} notice · ${n.owner} · opened ${n.openedAt}`,
        action: { label: "Open the trip", href: tripHref(s, t, lineOn(s, t, (l) => l.productId === n.productId)) },
      });
    }
  }
  return out;
}

/** Deadline × client: an incentive's booking window × a trip of hers still in planning. */
function deadlineMeetsClient(s: DemoState): Insight[] {
  if (!canViewCommissions(s)) return [];
  const out: Insight[] = [];
  for (const p of promotions) {
    const t = allTrips(s).find((x) => (x.status === "Planning" || x.status === "Inbound")
      && (linesOf(s.tripLines, x.id).length
        ? linesOf(s.tripLines, x.id).some((l) => l.productId === p.productId && l.status !== "confirmed" && l.status !== "declined")
        : x.products.includes(p.productId)));
    if (!t) continue;
    const name = productById(p.productId)?.name ?? p.productName;
    out.push({
      id: `incentive-${p.id}`, chapter: "incentives", title: "Expiring incentives", tier: 2,
      severity: "Important", covers: { href: `/records/${p.productId}`, tag: "Commissions" },
      within: p.daysLeft, subject: `trip:${t.id}:incentive`,
      facts: { incentive: `${p.program} ${p.rate}`, property: name, bookBy: p.bookingWindowEnd, daysLeft: p.daysLeft, trip: t.title, traveller: t.traveller },
      headline: `Book ${t.traveller}'s trip by ${p.bookingWindowEnd}`,
      text: `${name} pays ${p.rate}${p.stacksWithBase ? " extra" : ""} on ${p.program} bookings made before then. The trip is still in planning.`,
      evidence: `${p.program} incentive · ends in ${p.daysLeft} days`,
      action: { label: "Open the trip", href: tripHref(s, t, lineOn(s, t, (l) => l.productId === p.productId)) },
    });
  }
  return out;
}

/** Late money that shares one programme. The advisor chases; the owner negotiates. */
function lateByProgramme(s: DemoState): Insight[] {
  if (!canViewCommissions(s)) return [];
  const late = commissions.filter((c) => c.state === "overdue" || c.state === "chased");
  const by = new Map<string, typeof late>();
  for (const c of late) if (c.program) by.set(c.program, [...(by.get(c.program) ?? []), c]);
  const [programme, group] = [...by.entries()].sort((a, b) => b[1].length - a[1].length)[0] ?? [];
  if (!programme || !group || group.length < 2) return [];
  const total = group.reduce((n, c) => n + c.amount, 0);
  const all = group.length === late.length;
  const lead = all
    ? `All ${group.length} late payments are ${programme} bookings, ${eur(total)} in total.`
    : `${group.length} of ${late.length} late payments are ${programme} bookings, ${eur(total)} in total.`;
  const base = {
    id: "late-programme", chapter: "commissions", title: "Commissions", tier: 3 as const,
    severity: "Important" as const,
    subject: `programme:${programme}`,
    facts: { programme, count: group.length, of: late.length, total, properties: group.map((c) => c.property) },
    evidence: `${late.length} late commission records · the programme each was booked under`,
  };
  if (s.role === "owner") {
    return [{ ...base, headline: `Raise the late payments with ${programme}`, text: `${lead} One call covers them all.`, action: { label: "Open the late payments", href: "/commissions?state=overdue" } }];
  }
  /* The first overdue commission: the longest-waiting one not yet chased. */
  const first = group.filter((c) => c.state === "overdue").sort((a, b) => (b.overdueDays ?? 0) - (a.overdueDays ?? 0))[0] ?? group[0];
  return [{ ...base, headline: `Chase ${first.property} first`, text: `${lead} ${first.property} is ${first.overdueDays} days overdue and not chased yet.`, action: { label: `Chase ${first.property}`, href: `/commissions/${first.id}` } }];
}

/** Trip checks that belong on the Briefing (the builder, in the lab): the ones only the
    trip knows about. A blocked line and an event on an unbooked day are already the
    notice's and the world's insights above. */
function tripsNeedYou(s: DemoState): Insight[] {
  if (!s.lab) return [];
  return allTrips(s).filter(live).flatMap((t) => tripChecks(s, t)
    .filter((c) => c.tier === 1 && !c.id.includes("-block-") && !c.id.includes("-world-"))
    .map((c) => ({
      ...c, chapter: "departures", title: "Trips", severity: "Important" as const,
      text: `${t.traveller}, ${t.title}. ${c.text}`,
      action: { label: "Open the trip", href: tripHref(s, t, (c as Insight & { line?: string }).line) },
    })));
}

/** TripSuite runs up to 48 hours behind. */
const SYNC_LAG_DAYS = 2;

/** Departure risk: an open item against the days left and the booking system's lag. */
function departureRisk(s: DemoState): Insight[] {
  const out: Insight[] = [];
  /* the open item: a transfer not confirmed, read from the lines; else the summary's */
  const alertOf = (t: Trip) => {
    const lines = linesOf(s.tripLines, t.id);
    if (!lines.length) return t.alert;
    return lines.some((l) => l.kind === "transfer" && l.status !== "confirmed") ? "transfer unconfirmed" : undefined;
  };
  for (const t0 of trips.filter((x) => x.status === "Booked" && x.startsInDays !== null && x.startsInDays <= 14)) {
    const alert = alertOf(t0);
    if (!alert) continue;
    const t = { ...t0, alert };
    const slack = (t.startsInDays ?? 0) - SYNC_LAG_DAYS;
    const by = slack <= 0 ? "today" : slack === 1 ? "by tomorrow" : `within ${slack} days`;
    out.push({
      id: `departure-${t.id}`, chapter: "departures", title: "Departures", tier: 1,
      severity: "Critical",
      within: t.startsInDays ?? undefined, subject: `trip:${t.id}`,
      facts: { traveller: t.traveller, trip: t.title, inDays: t.startsInDays ?? 0, open: t.alert ?? "", syncLagDays: SYNC_LAG_DAYS },
      headline: `Settle ${t.traveller}'s ${(t.alert ?? "").replace(" unconfirmed", "")} ${by}`,
      text: `They leave in ${t.startsInDays} days and the ${t.alert}. TripSuite runs up to ${SYNC_LAG_DAYS * 24} hours late, so a later fix may not show in time.`,
      evidence: `trip checklist ${t.checklist?.done}/${t.checklist?.of} · TripSuite sync lag`,
      action: { label: `Open ${t.title}`, href: tripHref(s, t, lineOn(s, t, (l) => l.kind === "transfer" && l.status !== "confirmed")) },
    });
  }
  return out;
}

/* ══ the owner ═════════════════════════════════════════════════════════════════ */

/** Every trip on the desk as dates, products and legs only: hers to count, not to read. */
const deskAll = (s: DemoState) => [
  ...allTrips(s).filter(live).map((t) => ({ id: t.id, advisor: "R. Devane", start: tripStart(t), products: bookedOf(s, t), legs: legsOf(s, t) })),
  ...deskTrips.map((t) => ({ id: t.id, advisor: t.advisor, start: t.startsOn, products: t.products, legs: t.legs })),
];

/** World meets the desk: one event across every trip it touches. Counts, never names. */
function worldMeetsDesk(s: DemoState): Insight[] {
  const out: Insight[] = [];
  for (const e of worldEvents) {
    const hit = deskAll(s).map((t) => ({ t, legs: touches(t.legs, e) })).filter((x) => x.legs.length > 0);
    if (hit.length < 2) continue; /* one trip is its advisor's to handle, not an announcement */
    const advisors = new Set(hit.map((x) => x.t.advisor)).size;
    const open = hit.filter((x) => x.legs.some((l) => l.state === "unconfirmed")).length;
    out.push({
      id: `world-desk-${e.id}`, chapter: "announcements", title: "From the agency", tier: 1,
      severity: "Important",
      within: daysFromToday(e.from), subject: `event:${e.id}`,
      facts: { event: e.headline, place: e.place, on: e.from, trips: hit.length, advisors, unconfirmed: open },
      headline: `Warn the team about the ${e.place} ${e.kind}`,
      text: `${plural(hit.length, "trip lands", "trips land")} in ${e.place} on ${short(e.from)}, a ${e.kind} day. ${capital(e.effect)}.${open ? ` ${plural(open, "transfer is", "transfers are")} not booked yet.` : ""}`,
      evidence: `${e.source} · read ${e.readAt} · ${plural(advisors, "advisor", "advisors")}, names withheld`,
      action: { label: "Write to the team", sheet: "announcement" },
    });
  }
  return out;
}

/** A notice outliving itself: hers, past review or past the date it holds to, and the
    live trips it will still reach. */
function noticeOutlived(s: DemoState): Insight[] {
  const out: Insight[] = [];
  for (const n of notices.filter((x) => x.scope === "agency" && x.owner === "MK" && x.staleReviewDue && !s.retired[x.id] && !(x.id === "spa" && s.spaNoticeClosed))) {
    const after = deskAll(s).filter((t) => t.products.includes(n.productId) && (!n.until || (t.start && t.start > n.until)));
    if (after.length === 0) continue;
    out.push({
      id: `outlived-${n.id}`, chapter: "notices", title: "Notices", tier: 4,
      severity: "Info", covers: { href: "/notifications?tag=Records", tag: "Records" },
      within: n.until ? daysFromToday(n.until) : undefined, subject: `notice:${n.id}`,
      facts: { property: n.productName, notice: n.text, ageDays: n.ageDays, until: n.until ?? "", tripsAfter: after.length },
      headline: n.until ? `Retire the ${n.productName} notice after ${short(n.until)}` : `Review the ${n.productName} notice`,
      text: n.until
        ? `“${n.text}” ends on ${short(n.until)}. ${plural(after.length, "live trip books", "live trips book")} the hotel after that, and answers would still warn them.`
        : `“${n.text}” is ${n.ageDays} days old and past its review. ${plural(after.length, "live trip books", "live trips book")} the property.`,
      evidence: `your notice · opened ${n.openedAt} · trips counted, names withheld`,
      action: { label: "Review the notice", href: `/records/${n.productId}` },
    });
  }
  return out;
}

/** Queue by consequence: a candidate that duplicates a record live trips already book. */
function duplicateCandidate(s: DemoState): Insight[] {
  if (s.candidateConfirmed) return [];
  const dup = candidates.find((c) => c.kind === "duplicate");
  if (!dup || !("match" in dup) || !dup.match) return [];
  const target = productById("maison-leandre");
  const booking = deskAll(s).filter((t) => target && t.products.includes(target.id)).length;
  const name = target?.name ?? dup.match.target;
  return [{
    id: "duplicate", chapter: "confirm", title: "Records to confirm", tier: 4, subject: `record:${target?.id ?? name}`,
    severity: "Important", covers: { href: `/admin/review/${dup.id}` },
    facts: { candidate: dup.name, from: dup.from, target: name, similarity: dup.match.similarity, tripsBooking: booking },
    headline: `Merge the ${dup.name} duplicate`,
    text: `A ${dup.from} created it, and it matches ${name} at ${dup.match.similarity}.${booking ? ` ${plural(booking, "live trip books", "live trips book")} the real record.` : ""}`,
    evidence: dup.match.signals.map(([k, v]) => `${k} ${v}`).join(" · "),
    action: { label: "Review the match", href: `/admin/review/${dup.id}` },
  }];
}

/** Duplicate speech: a queued post that repeats what the agency already says. */
function repeatInQueue(s: DemoState): Insight[] {
  const waiting = queueItems(s).filter((q) => !s.released[q.id]);
  const repeat = waiting.find((q) => q.kind === "notice" && notices.some((n) => n.scope === "agency" && q.text.includes(n.productName)));
  if (!repeat) return [];
  const own = notices.find((n) => n.scope === "agency" && repeat.text.includes(n.productName))!;
  return [{
    id: "repeat", chapter: "publish", title: "Publish queue", tier: 4, subject: `queue:${repeat.id}`,
    severity: "Info", covers: { href: "/admin/publish" },
    facts: { item: repeat.text, by: repeat.by, repeats: own.text, openedAt: own.openedAt },
    headline: `Return ${repeat.by}'s ${own.productName} notice`,
    text: `It repeats your own notice from ${own.openedAt}. Two notices on one fact confuse answers.`,
    evidence: `publish queue · agency notice opened ${own.openedAt} · ${own.owner}`,
    action: { label: "Open the publish queue", href: "/admin/publish" },
  }];
}

/** Money, agency-wide: a payment with no booking, and the booking it strongly matches. */
function unmatchedPayment(s: DemoState): Insight[] {
  if (s.paymentMatched) return [];
  const p = orphanedPayments.find((x) => x.candidates.some((c) => c.strength === "strong"));
  if (!p) return [];
  const match = p.candidates.find((c) => c.strength === "strong")!;
  const [ref, who] = match.ref.split(" · ");
  const booker = who?.match(/booker (.+?) \(/)?.[1];
  return [{
    id: "unmatched", chapter: "unmatched", title: "Unmatched payments", tier: 3, subject: `payment:${p.id}`,
    severity: "Important", covers: { href: "/ops/resolution" },
    facts: { amount: p.amount, arrivedAs: p.raw, match: match.ref },
    headline: `Match ${eur(p.amount)} to booking ${ref}`,
    text: `It came in under “${p.raw}”, the traveller.${booker ? ` ${ref} is booked under ${booker}, for the same trip.` : ` ${ref} is a strong match.`}`,
    evidence: "payment reference · booking records",
    action: { label: "Match payments", href: "/ops/resolution" },
  }];
}

/** The agency's sources: a broken connection, and what it does to answers. */
function brokenSource(): Insight[] {
  const broken = connections.find((c) => c.scope === "agency" && c.state === "credentials");
  if (!broken) return [];
  return [{
    id: "source", chapter: "connections", title: "Connections", tier: 4, subject: `source:${broken.name}`,
    severity: "Critical", covers: { href: "/connections", tag: "Connections" },
    facts: { source: broken.name, since: broken.lastSuccess },
    headline: `Reconnect the ${broken.name.toLowerCase()}`,
    text: `Its login expired on ${broken.lastSuccess}. Nothing has synced since, so answers from it are out of date.`,
    evidence: `connection health · last success ${broken.lastSuccess}`,
    action: { label: "Reconnect", href: "/connections" },
  }];
}

/* ══ ranked ════════════════════════════════════════════════════════════════════ */

/** This reader's insights, ranked: the first is the day's first move. */
export function insightsFor(s: DemoState): Insight[] {
  const all = s.role === "owner"
    ? [...worldMeetsDesk(s), ...unmatchedPayment(s), ...lateByProgramme(s), ...duplicateCandidate(s), ...brokenSource(), ...noticeOutlived(s), ...repeatInQueue(s)]
    : [...worldMeetsClient(s), ...knowledgeMeetsClient(s), ...tripsNeedYou(s), ...departureRisk(s), ...deadlineMeetsClient(s), ...lateByProgramme(s)];
  const ranked = all
    .map((x, i) => ({ x, i }))
    .sort((a, b) => a.x.tier - b.x.tier || (a.x.within ?? 999) - (b.x.within ?? 999) || a.i - b.i)
    .map(({ x }) => x);
  const seen = new Set<string>();
  const covered = ranked.filter((x) => (seen.has(x.subject) ? false : (seen.add(x.subject), true)));

  /* One item per subject, in the inbox's order (FB-04). */
  const inbox = inboxFor(s);
  const waiting = needsYou(s);
  return covered
    .map((x, i) => {
      const c = x.covers;
      const note = c && inbox.find((n) => n.subject?.href === c.href && (!c.tag || n.tag === c.tag) && (!c.severity || n.severity === c.severity));
      const severity: Severity = note ? note.severity : x.severity ?? (x.tier === 1 ? "Critical" : x.tier <= 3 ? "Important" : "Info");
      return { x: { ...x, severity, inbox: note ? note.id : undefined }, i, place: note ? waiting.indexOf(note) : -1, dealt: !!note && !waiting.includes(note) };
    })
    /* dealt with (or deferred) in the inbox: the one item has gone from both */
    .filter((r) => !r.dealt)
    .sort((a, b) => SEVERITY_RANK[a.x.severity] - SEVERITY_RANK[b.x.severity]
      || (a.place < 0 ? 999 : a.place) - (b.place < 0 ? 999 : b.place)
      || a.i - b.i)
    .map((r) => r.x);
}

const SEVERITY_RANK: Record<Severity, number> = { Critical: 0, Important: 1, Info: 2 };
