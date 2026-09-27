"use client";
/**
 * The assistant — a lab (Constantin, 2026-09-25), on Notion's split: search, the assistant
 * and the inbox are three surfaces with one job each, bridged rather than merged. (The
 * first pass folded all three into one card, and a search result landed "under This page".
 * That is what merging them gets you.)
 *
 *   ⌘K search      a centred palette: records, travellers, trips and commissions by name.
 *                  Its last row hands the words to the assistant.
 *   the assistant  the button at the bottom right (or ⌘J): CONVERSATIONS in the right-hand
 *                  card, titled by their question, all of them one list behind "All". The page a
 *                  conversation began on is its context, shown as a chip, never a filter.
 *                  It answers with its sources, and it acts. It replaces Ask.
 *   the inbox      Notifications keeps its own place and its badge; the assistant triages
 *                  it when asked ("catch me up").
 *   insights       stay on the page, in its tool card; the assistant explains one ("why?").
 *   the peek       off by default (Constantin, 2026-09-25): the button never interrupts;
 *                  urgent things wait on the Briefing rail and in Notifications. PEEK below
 *                  turns the old interrupt back on (tier 1 only, once per session).
 *
 * GO or DO, by the copy alone (Constantin, 2026-09-25). "See Cap d'Estel" shows a result;
 * "Match EUR 410 to booking VO-2214" performs. A Do runs as a task you watch: its steps
 * arrive in the chat, the thing it works on is ringed on your screen (the assistant takes
 * you to it), and it stops at a confirm, because nothing in this product commits itself.
 *
 * The answers and tasks are deterministic here: intents over the model, using the facts
 * the insight engine computes. In production a model phrases them over the same facts.
 */
import React from "react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { Check, Loader2, MessagesSquare, Plus, X } from "lucide-react";
import { useDemo, inboxFor, canViewCommissions, allTrips, type DemoState, type TaskId, type AssistantThread, type AssistantAnswer } from "@/lib/store";
import { insightsFor, type Insight } from "@/lib/insights";
import { areaFor } from "@/lib/areas";
import {
  products, productById, travellerCards, trips, commissions, notices, askThreads, conversations, personName,
} from "@/data/seed";
import { linesOf, supplierOf, draftRequest, stamp, TODAY } from "@/data/trip-lines";
import { blockOf } from "@/lib/trip-checks";
import { isDraftIntent, startDraft, continueDraft, planDraft, type DraftPlan } from "@/lib/draft-trip";
import type { DraftBrief } from "@/data/trip-lines";
import { Button } from "@/components/ui/button";
import { AreaDot, IconChrome } from "@/components/bits";
import { AnnouncementSheet } from "@/components/publish-sheets";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import type { Dispatch } from "react";
import type { Action } from "@/lib/store";

/* ── the mark: the meridian (FLORA round 1, route 3), drawn to read at 24px ── */
export function EnableMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden>
      <circle cx="40" cy="40" r="25.9" stroke="currentColor" strokeWidth="3.4" />
      <path d="M40 6.8V73.3" stroke="currentColor" strokeWidth="3.4" />
      <path d="m40 33.4-6.4 6.4 6.4 6.4 6.4-6.4L40 33.4z" fill="currentColor" />
    </svg>
  );
}

const norm = (x: string) => x.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const eur = (n: number) => `EUR ${n.toLocaleString("en-GB")}`;
const human = (k: string) => k.replace(/([A-Z])/g, " $1").toLowerCase();
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** A fact as a person reads it: an ISO date as "02 Sep". */
const readable = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v.slice(8, 10)} ${MONTHS[Number(v.slice(5, 7)) - 1]}` : v);

/* ── context: the page a conversation began on, as its chip ──────────────────── */

interface Context { label: string; path: string; productId?: string; tripId?: string }

const SECTION: Record<string, string> = {
  briefing: "your day", notifications: "your notifications", records: "the records",
  travellers: "your travellers", itineraries: "the trips", knowledge: "the knowledge vault",
  commissions: "commissions", connections: "connections", settings: "settings", ask: "the agency's sources",
  "admin/review": "records to confirm", "admin/publish": "the publish queue", "ops/resolution": "unmatched payments",
};

function contextFor(path: string): Context {
  const [a, b] = path.split("/").filter(Boolean);
  if (a === "records" && b) return { label: productById(b)?.name ?? "this record", path, productId: b };
  if (a === "commissions" && b) return { label: commissions.find((c) => c.id === b)?.property ?? "this commission", path };
  if (a === "travellers" && b) return { label: travellerCards.find((t) => t.id === b)?.name ?? "this traveller", path };
  if (a === "itineraries" && b) return { label: trips.find((t) => t.id === b)?.title ?? "this trip", path, tripId: b };
  const key = Object.keys(SECTION).find((k) => path.slice(1).startsWith(k));
  return { label: key ? SECTION[key] : "this page", path };
}

/* ── Go: a result to see. The copy says so: "See …" ─────────────────────────── */

function placeName(href: string): string {
  const [path] = href.split("?");
  const [a, b] = path.split("/").filter(Boolean);
  if (a === "records" && b) return productById(b)?.name ?? "the record";
  if (a === "commissions" && b) return commissions.find((c) => c.id === b)?.property ?? "the commission";
  if (a === "travellers" && b) return travellerCards.find((t) => t.id === b)?.name ?? "the traveller";
  if (a === "itineraries" && b) return trips.find((t) => t.id === b)?.title ?? "the trip";
  if (a === "admin" && b === "review") return path.split("/")[3] ? "the candidate" : "records to confirm";
  const key = Object.keys(SECTION).find((k) => path.slice(1).startsWith(k));
  return key ? SECTION[key].replace(/^your /, "your ") : "it";
}
const see = (href: string) => ({ label: `See ${placeName(href)}`, href });

/* ── Do: a task the assistant performs, watched, and confirmed by a person ─────── */

interface TaskDef {
  label: string;
  /** Where it works: the assistant takes you there, so you watch it happen. */
  where: string;
  /** The element it works on, ringed while it does (data-agent-target on the page). */
  target: string;
  steps: [string, string][];
  /** The human stop: what you are confirming, and the button that commits it. */
  ready: string;
  confirm: string;
  done: string;
  /** Commits what the person confirmed. `path` is where the task began (a trip's page). */
  commit: (d: Dispatch<Action>, s: DemoState, path: string) => void;
  /** The parts that read the live state, worked out when shown (how many, and which). */
  live?: (s: DemoState, path: string, task?: TaskState) => Partial<Pick<TaskDef, "where" | "target" | "steps" | "ready" | "confirm">>;
  /** Before the first step, where the work will be watched (a draft makes its trip). */
  start?: (d: Dispatch<Action>, s: DemoState, task: TaskState) => void;
  /** As a step completes: what it puts on the screen (a draft's lines, step by step). */
  onStep?: (d: Dispatch<Action>, s: DemoState, step: number, task: TaskState) => void;
  /** "Not now": what the task takes back (a draft removes its trip). */
  abandon?: (d: Dispatch<Action>, s: DemoState, task: TaskState) => void;
}
type TaskState = NonNullable<import("@/lib/store").AssistantTurn["task"]>;

/** The lines on a trip the assistant may ask about: ideas with someone to ask, and not
    on a record the agency has closed to bookings. */
function askable(s: DemoState, tripId: string) {
  return linesOf(s.tripLines, tripId).filter((l) => l.status === "idea" && l.kind !== "note" && !l.suggested && supplierOf(l) && !blockOf(s, l.productId));
}
const tripOfPath = (path: string, s: DemoState) => allTrips(s).find((t) => path === `/itineraries/${t.id}` || path.startsWith(`/itineraries/${t.id}?`));
const WORD = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight"];
/** "Chauffeurs de Paris (two), Musée Rodin and Le Clos Arsène" */
function suppliersSaid(lines: ReturnType<typeof askable>) {
  const count = new Map<string, number>();
  for (const l of lines) { const n = supplierOf(l)!.name.split(",")[0]; count.set(n, (count.get(n) ?? 0) + 1); }
  const names = [...count].map(([n, c]) => (c > 1 ? `${n} (${WORD[c] ?? c})` : n));
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0] ?? "";
}

/** A task as it stands now: its fixed parts, and the parts that read the state. */
function defOf(id: TaskId, s: DemoState, path: string, task?: TaskState): TaskDef {
  const def = TASKS[id];
  return { ...def, ...(def.live?.(s, path, task) ?? {}) };
}

/* A draft's plan, worked out once per brief: the steps must not move while they run. */
const plans = new Map<string, DraftPlan | null>();
function planOf(brief: DraftBrief | undefined, s: DemoState): DraftPlan | null {
  if (!brief) return null;
  if (!plans.has(brief.tripId)) plans.set(brief.tripId, planDraft(brief, s));
  return plans.get(brief.tripId) ?? null;
}

const TASKS: Record<TaskId, TaskDef> = {
  "match-op1": {
    label: "Match EUR 410 to booking VO-2214",
    where: "/ops/resolution", target: "payment-op1",
    steps: [
      ["Finding the booking", "VO-2214, booked by M. Osei"],
      ["Checking the amount", "EUR 410 is the deposit on VO-2214"],
      ["Checking the name", "R. Osei is the traveller on VO-2214, so the payment came in under the traveller"],
    ],
    ready: "Ready to match EUR 410 to VO-2214. It is logged with your name and today’s date; the booking itself is not edited.",
    confirm: "Confirm the match",
    done: "Matched and logged. The payment has left the open list.",
    commit: (d) => d({ type: "matchPayment" }),
  },
  "draft-vo": {
    label: "Draft the reminder to Villa Ortensia",
    where: "/commissions/vo", target: "reminder-vo",
    steps: [
      ["Opening the commission", "Villa Ortensia · VO-2214 · EUR 1,240"],
      ["Checking what is owed", "12 days overdue, booked under Meridian"],
      ["Drafting the reminder", "To the property’s accounts team, with the booking reference and the rate terms"],
    ],
    ready: "The draft is ready. It goes on the commission for you to read, edit and send. I never send it.",
    confirm: "Put the draft on the commission",
    done: "The draft is on the commission. Send it from there when you are happy with it.",
    commit: (d) => d({ type: "reminder", state: "draft" }),
  },
  "shortlist-verlaine": {
    label: "Take Hôtel Verlaine off L. Grandin’s shortlist",
    where: "/itineraries", target: "trip-paris-anniversary",
    steps: [
      ["Opening the trip", "Paris, thirtieth anniversary · L. Grandin · 03–07 Dec"],
      ["Checking the shortlist", "Hôtel Verlaine, closed to bookings by the agency since 26 Aug"],
    ],
    ready: "Ready to take Hôtel Verlaine off the shortlist. The rest of the trip is untouched.",
    confirm: "Take it off the shortlist",
    done: "Done. The proposal no longer carries Hôtel Verlaine, and the notice stops asking.",
    commit: (d) => d({ type: "shortlistOff", trip: "paris-anniversary", product: "hotel-verlaine" }),
  },
  /* The builder (the lab): a trip drafted from a brief, watched as it is assembled. The
     trip appears first, then each step's lines as the step completes, each a suggestion
     with its reason. The human stop is the review on the trip itself. */
  "draft-trip": {
    label: "Draft the trip",
    where: "/itineraries", target: "standing",
    steps: [], ready: "", confirm: "Review the draft",
    done: "The draft is on the trip. Keep, swap or remove each line; ask for the kept ones when you are ready.",
    live: (s, _path, task) => {
      const plan = planOf(task?.brief, s);
      if (!plan) return {};
      const done = task ? Math.max(0, task.step - 1) : 0;
      const lastLines = plan.steps.slice(0, done + 1).flatMap((x) => x.lines);
      return {
        where: `/itineraries/${plan.trip.id}`,
        target: lastLines.length ? `line-${lastLines[lastLines.length - 1].id}` : "standing",
        steps: plan.steps.map((x) => [x.label, x.detail] as [string, string]),
        ready: `${plan.count} suggestions are on ${plan.trip.title}, each with its reason. Review them there: keep, swap or remove. Nothing is asked of anyone until you keep it.`,
      };
    },
    start: (d, s, task) => {
      const plan = planOf(task.brief, s);
      if (plan) d({ type: "tripCreate", trip: plan.trip });
    },
    onStep: (d, s, step, task) => {
      const plan = planOf(task.brief, s);
      for (const line of plan?.steps[step]?.lines ?? []) d({ type: "lineAdd", line });
    },
    abandon: (d, _s, task) => { if (task.brief) d({ type: "tripRemove", id: task.brief.tripId }); },
    commit: (d) => d({ type: "assistant", open: false }),
  },
  /* The builder (the lab): every idea on a trip, asked at once. Drafted from each line and
     the traveller, shown on the page as it goes, and sent only on the person's confirm. */
  "ask-ideas": {
    label: "Ask the suppliers about every idea on this trip",
    where: "/itineraries", target: "standing",
    steps: [["Opening the trip", ""], ["Reading the ideas", ""], ["Leaving out what cannot be asked", ""], ["Drafting one request per supplier", "From each line and the traveller: the dates, the party, the occasion"]],
    ready: "", confirm: "",
    done: "Sent. Each line now reads Asked, and each reply will wait on its line for you to accept.",
    live: (s, path) => {
      const t = tripOfPath(path, s);
      if (!t) return {};
      const ideas = askable(s, t.id);
      const blocked = linesOf(s.tripLines, t.id).filter((l) => l.status === "idea" && blockOf(s, l.productId));
      const n = ideas.length;
      return {
        where: `/itineraries/${t.id}`,
        target: ideas[0] ? `line-${ideas[0].id}` : "standing",
        steps: [
          ["Opening the trip", `${t.title} · ${t.traveller} · ${t.dates}`],
          ["Reading the ideas", ideas.map((l) => l.what.split(",")[0]).join(" · ") || "none left to ask"],
          ["Leaving out what cannot be asked", blocked.length ? blocked.map((l) => `${productById(l.productId!)?.name}, closed to bookings by the agency`).join(" · ") : "nothing: every idea can be asked"],
          ["Drafting one request per supplier", "From each line and the traveller: the dates, the party, the occasion"],
        ],
        ready: n
          ? `${WORD[n] ? WORD[n].charAt(0).toUpperCase() + WORD[n].slice(1) : n} ${n === 1 ? "request is" : "requests are"} drafted, to ${suppliersSaid(ideas)}. Each goes once, from your address, when you confirm. Replies land in Forwarded mail and wait on their lines.`
          : "Nothing is left to ask on this trip.",
        confirm: n ? `Send the ${n === 1 ? "request" : `${WORD[n] ?? n} requests`}` : "Close",
      };
    },
    commit: (d, s, path) => {
      const t = tripOfPath(path, s);
      if (!t) return;
      const signer = `${personName[s.role]}${s.role === "user" ? ", Paris desk" : ""}`;
      askable(s, t.id).forEach((l, i) => d({
        type: "lineSend", id: l.id,
        request: {
          id: `${l.id}-r${l.requests.length + 1}-${Date.now().toString(36)}`, kind: "availability", sentAt: stamp(), sentOn: TODAY,
          to: supplierOf(l)!.email, text: draftRequest(l, "availability", signer, t), by: s.role, replyAt: Date.now() + 5000 + i * 2500,
        },
      }));
    },
  },
};

/* ── answers ──────────────────────────────────────────────────────────────── */

type Act = NonNullable<AssistantAnswer["actions"]>[number];
type Answer = AssistantAnswer;

/** What the assistant can DO about an insight, if anything; otherwise a result to see. */
function actsFor(i: Insight, s: DemoState): Act[] {
  if (i.id === "unmatched" && s.role === "owner" && !s.paymentMatched) return [{ label: TASKS["match-op1"].label, task: "match-op1" }, see("/ops/resolution")];
  if (i.id === "notice-verlaine-crit-paris-anniversary") return [{ label: TASKS["shortlist-verlaine"].label, task: "shortlist-verlaine" }, see("/records/hotel-verlaine")];
  if (i.action.sheet) return [{ label: i.action.label, sheet: i.action.sheet }];
  return i.action.href ? [see(i.action.href)] : [];
}

function explainInsight(i: Insight, s: DemoState): Answer {
  return {
    text: [i.headline + ".", i.text],
    facts: Object.entries(i.facts).slice(0, 5).map(([k, v]) => [human(k), readable(Array.isArray(v) ? v.join(", ") : String(v))]),
    sources: [i.evidence],
    actions: actsFor(i, s),
  };
}

/** The insight that belongs to where you are: its act leads to this page, or failing
    that to this page's area. */
function insightHere(s: DemoState, path: string): Insight | undefined {
  const all = insightsFor(s);
  const here = areaFor(path);
  return all.find((i) => i.action.href && path.startsWith(i.action.href.split("?")[0]))
    ?? (here && here !== "today" ? all.find((i) => i.action.href && areaFor(i.action.href.split("?")[0]) === here) : all[0]);
}

function answerFor(q: string, ctx: Context, s: DemoState): Answer {
  const t = norm(q.trim());
  const money = canViewCommissions(s);

  /* an insight or a notification, explained: from the rail's "Why?", or a peek */
  if (t.startsWith("why:")) {
    const id = q.trim().slice(4);
    const insight = insightsFor(s).find((i) => i.id === id);
    if (insight) return explainInsight(insight, s);
    const n = inboxFor(s).find((x) => x.id === id);
    if (n) return {
      text: [n.headline + ".", n.detail],
      facts: [["severity", n.severity], ["noticed by", n.generatedBy], ["when", n.when]],
      sources: [n.evidence ?? n.generatedBy],
      actions: n.action?.href ? [see(n.action.href)] : [],
    };
    return { text: ["That has been dealt with since, so there is nothing left to explain."] };
  }

  /* the inbox, triaged */
  if (/catch me up|what'?s waiting|what needs me|inbox|notifications/.test(t)) {
    const open = inboxFor(s).filter((n) => { const st = s.notices[n.id] ?? n.defaultState; return st === "new" || st === "seen"; });
    const count = (sev: string) => open.filter((n) => n.severity === sev).length;
    const order = ["Critical", "Important", "Info"];
    const ranked = [...open].sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
    const vo = open.find((n) => n.subject?.href === "/commissions/vo" || n.action?.href === "/commissions/vo");
    return {
      text: [
        `${open.length} things are waiting on you: ${count("Critical")} critical, ${count("Important")} important and ${count("Info")} for information.`,
        ranked[0] ? `Start with the first: ${ranked[0].headline.charAt(0).toLowerCase() + ranked[0].headline.slice(1)}.` : "",
      ].filter(Boolean),
      facts: ranked.slice(0, 3).map((n) => [n.severity.toLowerCase(), n.headline]),
      sources: ["your notifications, as of now"],
      actions: [
        ...(vo && money && s.reminder === "idle" ? [{ label: TASKS["draft-vo"].label, task: "draft-vo" as TaskId }] : []),
        ...(ranked[0]?.action?.href ? [see(ranked[0].action.href)] : []),
        see("/notifications"),
      ],
    };
  }

  /* on a trip (the builder): ask the suppliers about its ideas */
  if (ctx.tripId && s.lab && /ask (for|about)|request|availability|ideas|suppliers/.test(t)) {
    const trip = allTrips(s).find((x) => x.id === ctx.tripId);
    const n = askable(s, ctx.tripId).length;
    return n
      ? {
          text: [`${trip?.title} has ${WORD[n] ?? n} ${n === 1 ? "idea" : "ideas"} nobody has asked about. I can draft one request per supplier from the lines and the traveller, and show them to you before anything goes.`],
          sources: [`the trip's lines · ${trip?.title}`],
          actions: [{ label: TASKS["ask-ideas"].label, task: "ask-ideas" as TaskId }],
        }
      : { text: ["Every idea on this trip has been asked about, or cannot be: a closed record stays unasked."] };
  }

  /* why is this flagged: the insight for where you are */
  if (/^why\b|flag|explain/.test(t)) {
    const i = insightHere(s, ctx.path);
    if (i) return explainInsight(i, s);
  }

  /* chase a commission */
  const chase = t.match(/^(chase|remind)\s+(.+)/);
  if (chase) {
    if (!money) return { text: ["Commission figures are not shared with you, so there is nothing for me to chase."] };
    const c = commissions.find((x) => norm(x.property).includes(chase[2]) || chase[2].includes(norm(x.property)));
    if (c) return {
      text: [
        `${c.property} (${c.bookingRef}) owes ${eur(c.amount)}${c.overdueDays ? `, ${c.overdueDays} days overdue` : ""}${c.program ? `, booked under ${c.program}` : ""}.`,
        c.id === "vo" ? "I can draft the reminder. You read it and send it; I never send." : "Reminders are drafted from the commission itself.",
      ],
      sources: [`commission record ${c.bookingRef}`],
      actions: [
        ...(c.id === "vo" && s.reminder === "idle" ? [{ label: TASKS["draft-vo"].label, task: "draft-vo" as TaskId }] : []),
        see(`/commissions/${c.id}`),
      ],
    };
  }

  /* write to the team */
  if (/write to the (team|agency)|announce/.test(t)) {
    return {
      text: [s.role === "owner"
        ? "A note to the team reaches every advisor at once when you publish it, and answers cite it with its date."
        : "A note to your team goes out at once; to the whole agency it waits for M. Keller to release it."],
      actions: [{ label: "Write to the team", sheet: "announcement" }],
    };
  }

  /* what the agency said about Kyoto */
  if (/kyoto/.test(t)) {
    return {
      text: [askThreads.kyoto.a1, askThreads.kyoto.a2],
      sources: ["agency announcement · New in Kyoto for autumn · M. Keller · 26 Aug", "directory record · Ryokan Suikawa · verified May 2026"],
      actions: [see("/records/ryokan-suikawa")],
    };
  }

  /* a record, named or the one the conversation is about */
  const named = products.find((p) => t.includes(norm(p.name)));
  const p = named ?? (ctx.productId && /this|it\b|here|true|rate|commission|notice|spa|represent/.test(t) ? productById(ctx.productId) : undefined);
  if (p) {
    const open = notices.filter((n) => n.productId === p.id && !s.retired[n.id]);
    return {
      text: [
        `${p.name}, ${p.city}, ${p.country}. ${p.luxuryTier}${p.programs.length ? `, in ${p.programs.join(" and ")}` : ""}.`,
        open.length ? `${open.length === 1 ? "One notice is" : `${open.length} notices are`} open: ${open.map((n) => `“${n.text}”`).join(" ")}` : "No notice is open on it.",
        money ? `The commission on the record is ${p.rate}, ${p.evidence.label}.` : "",
      ].filter(Boolean),
      sources: [`directory record · updated ${p.updated}`, ...open.map((n) => `${n.severity} notice · ${n.owner} · opened ${n.openedAt}`)],
      actions: [see(`/records/${p.id}`)],
    };
  }

  /* a traveller, and their trips */
  const tc = travellerCards.find((x) => t.includes(norm(x.name)));
  if (tc) {
    const theirs = trips.filter((x) => x.traveller === tc.name);
    return {
      text: [`${tc.name} has ${theirs.length === 1 ? "one trip" : `${theirs.length} trips`} on file.`],
      facts: theirs.map((x) => [x.title, `${x.dates} · ${x.status}`]),
      sources: ["trip records"],
      actions: [see(`/travellers/${tc.id}`)],
    };
  }

  return {
    text: ["I can’t find that in the agency’s sources, so I won’t guess.", "Try a property, a traveller or a commission by name, or ask me to catch you up."],
  };
}

/** Ask the assistant. A "why" about where you are is pinned to the insight it is about,
    and the answer is worked out now and kept with the turn, so the conversation stays a
    record of what was said. `fresh` starts a new conversation. */
export function askAssistant(d: Dispatch<Action>, s: DemoState, words: string, path: string, fresh = false) {
  let q = words.trim();
  if (!q) return;
  /* a draft in conversation: this answers the question it asked last */
  const cur = fresh ? undefined : s.assistantThreads.find((t) => t.id === s.assistantThread);
  const waiting = cur?.turns[cur.turns.length - 1]?.answer?.draft;
  if (waiting?.awaiting && s.lab) { d({ type: "ask", q, path, answer: continueDraft(waiting, q, s) }); return; }
  if (s.lab && isDraftIntent(q)) {
    if (fresh) d({ type: "thread", id: null });
    d({ type: "ask", q, path, answer: startDraft(q, path, s, newDraftId()), title: "Draft a trip" });
    return;
  }
  if (!q.startsWith("why:") && /^why\b|flag|explain/.test(norm(q))) {
    const here = insightHere(s, path);
    if (here) q = `why:${here.id}`;
  }
  if (fresh) d({ type: "thread", id: null });
  d({ type: "ask", q, path, answer: answerFor(q, contextFor(path), s), title: titleOf(q, s) });
}

let drafts = 0;
const newDraftId = () => `d${++drafts}${Date.now().toString(36).slice(-4)}`;

/** Start a draft with what is already known (the New trip sheet hands over its fields):
    the assistant asks only for the rest. */
export function startDraftWith(d: Dispatch<Action>, s: DemoState, path: string, seed: Partial<DraftBrief>) {
  d({ type: "thread", id: null });
  d({ type: "ask", q: "Draft a trip", path, answer: startDraft("", path, s, newDraftId(), seed), title: "Draft a trip" });
}

/** A conversation's title as a person reads it: a "why" hand-off by what it explains. */
function titleOf(q: string, s: DemoState): string {
  if (!q.startsWith("why:")) return q;
  const id = q.slice(4);
  const about = insightsFor(s).find((i) => i.id === id)?.headline ?? inboxFor(s).find((n) => n.id === id)?.headline;
  /* titled as the question it is, so it never reads like the act it may offer */
  return about ? `Why: ${about}` : "Why is this flagged?";
}

/* ── the button, and its peek ─────────────────────────────────────────────── */

/** The peek beside the button. Off by default (Constantin, 2026-09-25). */
const PEEK = false;

export function AssistantButton() {
  const { s, d } = useDemo();
  const pathname = usePathname();
  const [peeking, setPeeking] = React.useState<{ id: string; headline: string; area: ReturnType<typeof areaFor> } | null>(null);

  /* The peek is off by default: nothing rises beside the button unless PEEK is set.
     When on, the one interrupt: the first tier-1 thing not yet peeked this session, an insight
     or a Critical notification. Everything else waits where it lives. */
  const candidates = React.useMemo(() => [
    ...insightsFor(s).filter((i) => i.tier === 1).map((i) => ({ id: i.id, headline: i.headline, area: i.action.href ? areaFor(i.action.href.split("?")[0]) : null })),
    ...inboxFor(s).filter((n) => n.severity === "Critical" && (s.notices[n.id] ?? n.defaultState) === "new")
      .map((n) => ({ id: n.id, headline: n.headline, area: n.action?.href ? areaFor(n.action.href.split("?")[0]) : null })),
  ], [s]);
  const next = candidates.find((c) => !s.dismissed[`peek-${c.id}`]);
  const nextId = next?.id;
  React.useEffect(() => {
    if (!PEEK || !next || s.assistantOpen) return;
    const show = window.setTimeout(() => setPeeking(next), 900);
    const hide = window.setTimeout(() => { setPeeking(null); d({ type: "dismiss", id: `peek-${next.id}` }); }, 7500);
    return () => { window.clearTimeout(show); window.clearTimeout(hide); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextId, s.assistantOpen]);

  return (
    <div className="pointer-events-none fixed right-[var(--frame-inset)] bottom-3 z-40 flex items-center gap-2">
      {peeking && !s.assistantOpen && (
        <button
          type="button"
          onClick={() => {
            setPeeking(null);
            d({ type: "dismiss", id: `peek-${peeking.id}` });
            askAssistant(d, s, `why:${peeking.id}`, pathname, true);
          }}
          /* A small card, not a pill: a pill chooses, and this acts (tier 2, "a pill never
             acts"). It says what it is about, then what pressing it does. */
          className="peek-in glass pointer-events-auto flex max-w-[380px] cursor-pointer flex-col items-start gap-0.5 rounded-lg px-4 py-2.5 text-left"
        >
          <AreaDot area={peeking.area}><span className="line-clamp-1 type-data-strong text-label">{peeking.headline}</span></AreaDot>
          <span className="type-meta">Ask Enable why</span>
        </button>
      )}
      <button
        type="button"
        aria-label="Ask Enable"
        aria-expanded={s.assistantOpen}
        onClick={() => d({ type: "assistant", open: !s.assistantOpen })}
        className="pressable glass pointer-events-auto grid size-12 cursor-pointer place-items-center rounded-full text-label"
      >
        <EnableMark className="size-6" />
      </button>
    </div>
  );
}

/* ── the conversations ────────────────────────────────────────────────────── */


export function AssistantCard() {
  const { s, d } = useDemo();
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [writing, setWriting] = React.useState(false);
  const [listing, setListing] = React.useState(false);
  const end = React.useRef<HTMLDivElement>(null);

  const thread: AssistantThread | undefined = s.assistantThreads.find((t) => t.id === s.assistantThread);
  const ctx = contextFor(thread?.path ?? pathname);
  const turns = thread?.turns ?? [];

  /* ── the task in progress: take the person to it, ring what it works on, step on ── */
  const activeIndex = turns.findIndex((t) => t.task?.status === "running");
  const active = activeIndex >= 0 ? turns[activeIndex].task! : undefined;
  const readyIndex = turns.findIndex((t) => t.task?.status === "ready");
  const working = active ?? (readyIndex >= 0 ? turns[readyIndex].task : undefined);

  React.useEffect(() => {
    if (!active || !thread) return;
    const def = defOf(active.id, s, turns[activeIndex].path, active);
    if (active.step === 0) def.start?.(d, s, active);
    if (active.step === 0 && !pathname.startsWith(def.where)) router.push(def.where);
    const t = window.setTimeout(() => {
      def.onStep?.(d, s, active.step, active);
      d({ type: "taskStep", thread: thread.id, index: activeIndex, steps: def.steps.length });
    }, 1100);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id, activeIndex, active?.step]);

  const workingTarget = working ? defOf(working.id, s, turns[activeIndex >= 0 ? activeIndex : readyIndex]?.path ?? pathname, working).target : null;
  React.useEffect(() => {
    if (!working || !workingTarget) return;
    const target = workingTarget;
    let el: Element | null = null;
    const find = window.setInterval(() => {
      el = document.querySelector(`[data-agent-target="${target}"]`);
      if (el) { el.classList.add("agent-working"); el.scrollIntoView({ block: "center", behavior: "smooth" }); window.clearInterval(find); }
    }, 150);
    return () => { window.clearInterval(find); el?.classList.remove("agent-working"); };
  }, [working?.id, pathname, workingTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [turns.length, active?.step]);

  const ask = (words: string) => { if (words.trim()) { setListing(false); askAssistant(d, s, words, pathname); } };
  const act = (a: Act) => {
    if (a.sheet) { setWriting(true); return; }
    if (a.reply) { ask(a.reply); return; }
    if (a.task) { d({ type: "task", task: a.task, label: TASKS[a.task].label, path: pathname, brief: a.brief }); return; }
    if (a.href) router.push(a.href);
  };


  /* Starters come from where you are: the insight here, the record you are on. */
  const here = insightHere(s, pathname);
  const pageCtx = contextFor(pathname);
  const starters = [
    { label: "Catch me up on what’s waiting", q: "catch me up" },
    ...(here ? [{ label: `Why: ${here.headline}`, q: `why:${here.id}` }] : []),
    ...(pageCtx.productId ? [{ label: `What’s true about ${pageCtx.label}?`, q: `what is true about ${pageCtx.label}` }] : []),
    ...(pageCtx.tripId && s.lab ? [{ label: "Ask the suppliers about every idea", q: "ask about every idea" }] : []),
    ...(s.lab ? [{ label: pageCtx.label && /^\/travellers\/./.test(pathname) ? `Draft a trip for ${pageCtx.label}` : "Draft a trip", q: /^\/travellers\/./.test(pathname) ? `Draft a trip for ${pageCtx.label}` : "Draft a trip" }] : []),
    { label: "What is new in Kyoto this autumn?", q: "What is new in Kyoto this autumn?" },
  ];

  return (
    <aside
      data-inspector
      data-assistant
      aria-label="Ask Enable"
      className="inspector-in absolute top-[var(--space-1)] right-[var(--space-1)] bottom-[var(--space-1)] z-20 flex w-[400px] flex-col overflow-hidden rounded-lg bg-raised shadow-elev-3"
    >
      {/* The title is the conversation (Constantin, 2026-09-25); on its line, to the right:
          every conversation, a new one, close. The same tiny round chrome throughout. */}
      <header className="flex shrink-0 items-center gap-[var(--space-1)] px-[var(--space-6)] pt-[var(--space-6)] pb-[var(--space-3)]">
        {!listing && !thread && <EnableMark className="mr-[var(--space-1)] size-5 shrink-0" />}
        <h2 className="min-w-0 flex-1 truncate type-section" title={thread ? titleOf(thread.title, s) : undefined}>
          {listing ? "All conversations" : thread ? titleOf(thread.title, s) : "Ask Enable"}
        </h2>
        <IconChrome label="All conversations" pressed={listing} onClick={() => setListing((v) => !v)}>
          <MessagesSquare className="size-3.5" aria-hidden />
        </IconChrome>
        <IconChrome label="New conversation" onClick={() => { setListing(false); d({ type: "thread", id: null }); }}>
          <Plus className="size-3.5" aria-hidden />
        </IconChrome>
        <IconChrome label="Close" onClick={() => d({ type: "assistant", open: false })}>
          <X className="size-3.5" aria-hidden />
        </IconChrome>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-hairline px-[var(--space-6)] pb-[var(--space-4)]">
        {listing ? (
          /* ── every conversation, as titles stacked ── */
          <ul className="divide-y divide-hairline">
            {s.assistantThreads.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => { setListing(false); d({ type: "thread", id: t.id }); }} className="w-full cursor-pointer py-[var(--space-3)] text-left hover:text-label-secondary">
                  <span className="block truncate type-data-strong">{titleOf(t.title, s)}</span>
                  <span className="block type-meta">{t.when} · about {contextFor(t.path).label} · {t.turns.length} {t.turns.length === 1 ? "turn" : "turns"}</span>
                </button>
              </li>
            ))}
            {conversations.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => { setListing(false); d({ type: "assistant", open: false }); router.push(`/ask?c=${c.id}`); }} className="w-full cursor-pointer py-[var(--space-3)] text-left hover:text-label-secondary">
                  <span className="block truncate type-data-strong">{c.title}</span>
                  <span className="block type-meta">{c.when} · opens in full, with its sources</span>
                </button>
              </li>
            ))}
          </ul>
        ) : !thread ? (
          <div className="pt-[var(--space-4)]">
            <p className="type-data-read text-label-secondary">
              Ask about {pageCtx.label}, or anything in the agency’s sources. Every answer shows where it came from.
            </p>
            <div className="mt-[var(--space-4)] flex flex-col items-start gap-[var(--space-1)]">
              {starters.map((x) => (
                <Button key={x.q} size="sm" variant="tertiary" className="h-auto min-h-[var(--control-h-sm)] max-w-full py-1 text-left whitespace-normal" onClick={() => ask(x.q)}>
                  {x.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* the context: what this conversation is about, not a filter on anything */}
            <p className="pt-[var(--space-4)]">
              <span className="inline-flex h-6 items-center rounded-full bg-faint px-2.5 type-micro text-label-secondary">About {ctx.label}</span>
            </p>
            <ol className="space-y-[var(--space-6)] pt-[var(--space-3)]">
              {turns.map((turn, i) => (
                <li key={i} className="space-y-[var(--space-3)]">
                  <p className="ml-auto w-fit max-w-[85%] rounded-lg bg-interactive px-[var(--space-3)] py-[var(--space-2)] type-data">
                    {turn.q.startsWith("why:") ? "Why is this flagged?" : turn.q}
                  </p>
                  {turn.task ? (
                    <TaskView
                      def={defOf(turn.task.id, s, turn.path, turn.task)}
                      step={turn.task.step}
                      status={turn.task.status}
                      onConfirm={() => { defOf(turn.task!.id, s, turn.path, turn.task).commit(d, s, turn.path); d({ type: "taskEnd", thread: thread.id, index: i, status: "done" }); }}
                      onCancel={() => { defOf(turn.task!.id, s, turn.path, turn.task).abandon?.(d, s, turn.task!); d({ type: "taskEnd", thread: thread.id, index: i, status: "cancelled" }); }}
                    />
                  ) : (
                    <AnswerView a={turn.answer ?? answerFor(turn.q, contextFor(turn.path), s)} onAct={i === turns.length - 1 ? act : undefined} onReply={i === turns.length - 1 ? ask : undefined} />
                  )}
                </li>
              ))}
            </ol>
          </>
        )}
        <div ref={end} />
      </div>

      <form
        className="shrink-0 border-t border-hairline p-[var(--space-3)]"
        onSubmit={(e) => { e.preventDefault(); ask(q); setQ(""); }}
      >
        <label className="field-pill flex h-10 items-center gap-[var(--space-2)] rounded-full bg-interactive px-[var(--space-4)]">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={thread ? `Ask about ${ctx.label}…` : `Ask about ${pageCtx.label}…`}
            aria-label="Ask Enable"
            className="min-w-0 flex-1 bg-transparent type-data text-label outline-none placeholder:text-label-placeholder"
          />
        </label>
      </form>

      <AnnouncementSheet open={writing} onOpenChange={setWriting} />
    </aside>
  );
}

/* An answer as it was given. Its acts show on the latest turn only: an earlier offer may
   no longer stand (a payment since matched), and history is not a control panel. */
function AnswerView({ a, onAct, onReply }: { a: Answer; onAct?: (x: Act) => void; onReply?: (words: string) => void }) {
  return (
    <div className="space-y-[var(--space-2)]">
      {a.text.map((para, j) => <p key={j} className={a.ask ? "type-prose" : "type-data-read"}>{para}</p>)}
      {a.ask && onReply && <QuickReplies ask={a.ask} onReply={onReply} />}
      {a.facts && a.facts.length > 0 && (
        <dl className="divide-y divide-hairline">
          {a.facts.map(([k, v]) => (
            <div key={k + v} className="flex items-baseline justify-between gap-[var(--space-3)] py-[var(--space-2)]">
              <dt className="shrink-0 type-meta">{k}</dt>
              <dd className="min-w-0 text-right type-data">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {a.sources && a.sources.length > 0 && <p className="type-meta">From {a.sources.join(" · ")}</p>}
      {onAct && a.actions && a.actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-[var(--space-2)] pt-[var(--space-1)]">
          {a.actions.map((x) => (
            <Button key={x.label} size="sm" variant="secondary" onClick={() => onAct(x)}>{x.label}</Button>
          ))}
        </div>
      )}
    </div>
  );
}

/* A task you watch: its steps arrive one by one, then it stops for you. */
/* Quick replies: pills, because they choose (the control grammar). One group answers on
   a tap; two are chosen, then sent. The input below always answers too. */
function QuickReplies({ ask, onReply }: { ask: NonNullable<Answer["ask"]>; onReply: (words: string) => void }) {
  const [picked, setPicked] = React.useState<Record<string, string>>({});
  const single = ask.groups.length === 1 && !ask.submit;
  const ready = ask.groups.every((g) => picked[g.name]);
  return (
    <div className="space-y-[var(--space-3)] pt-[var(--space-1)]">
      {ask.groups.map((g) => (
        <div key={g.name} role="radiogroup" aria-label={g.name} className="flex flex-wrap gap-[var(--space-2)]">
          {g.options.map((o) => {
            const on = picked[g.name] === o;
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => (single ? onReply(o) : setPicked((p) => ({ ...p, [g.name]: o })))}
                className={cn(
                  "pressable flex h-[var(--control-h-sm)] cursor-pointer items-center rounded-full border px-[var(--control-px-sm)] type-data",
                  on ? "border-selected bg-selected text-on-selected" : "border-control-edge bg-control-rest text-label hover:border-control-edge-hover",
                )}
              >
                {o}
              </button>
            );
          })}
        </div>
      ))}
      {!single && (
        <Button size="sm" variant="secondary" disabled={!ready} onClick={() => onReply(ask.groups.map((g) => picked[g.name]).join(" · "))}>
          {ask.submit ?? "Continue"}
        </Button>
      )}
    </div>
  );
}

function TaskView({ def, step, status, onConfirm, onCancel }: {
  def: TaskDef; step: number; status: "running" | "ready" | "done" | "cancelled";
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="space-y-[var(--space-3)]">
      <ol className="space-y-[var(--space-2)]">
        {def.steps.map(([label, result], i) => {
          const doneStep = i < step;
          const now = i === step && status === "running";
          if (i > step) return null;
          return (
            <li key={label} className="flex gap-[var(--space-2)]">
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center" aria-hidden>
                {doneStep ? <Check className="size-3.5 text-label" /> : <Loader2 className="size-3.5 animate-spin text-label-tertiary" />}
              </span>
              <span className="min-w-0">
                <span className={now ? "type-data text-label-secondary" : "type-data"}>{label}{now ? "…" : ""}</span>
                {doneStep && <span className="block type-meta">{result}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      {status === "ready" && (
        <div className="space-y-[var(--space-3)] rounded-lg bg-interactive p-[var(--space-3)]">
          <p className="type-data-read">{def.ready}</p>
          <div className="flex items-center gap-[var(--space-2)]">
            <Button size="sm" onClick={onConfirm}>{def.confirm}</Button>
            <Button size="sm" variant="tertiary" onClick={onCancel}>Not now</Button>
          </div>
        </div>
      )}
      {status === "done" && <p className="type-data-read"><Check className="mr-1 inline size-3.5" aria-hidden />{def.done}</p>}
      {status === "cancelled" && <p className="type-meta">Stopped. Nothing was changed.</p>}
    </div>
  );
}

/* ── ⌘K: search, by name; the last row hands the words to the assistant ─────── */

export function SearchPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { s, d } = useDemo();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = React.useState("");
  const n = norm(q.trim());
  const money = canViewCommissions(s);

  const recs = n ? products.filter((p) => norm(p.name).includes(n) || norm(p.city).includes(n)).slice(0, 6) : [];
  const people = n ? travellerCards.filter((t) => norm(t.name).includes(n)).slice(0, 4) : [];
  const theirTrips = n ? trips.filter((t) => norm(t.title).includes(n) || norm(t.traveller).includes(n)).slice(0, 4) : [];
  const owed = n && money ? commissions.filter((c) => norm(c.property).includes(n) || norm(c.bookingRef).includes(n)).slice(0, 4) : [];

  const close = () => { onOpenChange(false); setQ(""); };
  const go = (href: string) => { close(); router.push(href); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setQ(""); onOpenChange(v); }}>
      <DialogContent className="overflow-hidden p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">Search</DialogTitle>
        <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-label-secondary [&_[cmdk-group]]:px-2 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5">
          <CommandInput value={q} onValueChange={setQ} placeholder="Search records, travellers, trips, commissions…" />
          <CommandList>
            <CommandEmpty>{n ? "Nothing by that name." : "Type a name. Anything else, ask Enable."}</CommandEmpty>
            {recs.length > 0 && (
              <CommandGroup heading="Records">
                {recs.map((p) => (
                  <CommandItem key={p.id} value={`r-${p.id}`} onSelect={() => go(`/records/${p.id}`)}>
                    <AreaDot area="knowledge">{p.name}</AreaDot>
                    <span className="ml-auto type-meta">{p.city}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {people.length > 0 && (
              <CommandGroup heading="Travellers">
                {people.map((t) => (
                  <CommandItem key={t.id} value={`t-${t.id}`} onSelect={() => go(`/travellers/${t.id}`)}>
                    <AreaDot area="clients">{t.name}</AreaDot>
                    {t.nextTrip && <span className="ml-auto type-meta">{t.nextTrip}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {theirTrips.length > 0 && (
              <CommandGroup heading="Trips">
                {theirTrips.map((t) => (
                  <CommandItem key={t.id} value={`i-${t.id}`} onSelect={() => go("/itineraries")}>
                    <AreaDot area="clients">{t.title}</AreaDot>
                    <span className="ml-auto type-meta">{t.traveller} · {t.dates}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {owed.length > 0 && (
              <CommandGroup heading="Commissions">
                {owed.map((c) => (
                  <CommandItem key={c.id} value={`c-${c.id}`} onSelect={() => go(`/commissions/${c.id}`)}>
                    <AreaDot area="money">{c.property}</AreaDot>
                    <span className="ml-auto type-meta">{c.bookingRef} · {eur(c.amount)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {n && (
              <CommandGroup heading="Ask">
                <CommandItem value="ask" onSelect={() => { askAssistant(d, s, q, pathname, true); close(); }}>
                  <EnableMark className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">Ask Enable about “{q.trim()}”</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
