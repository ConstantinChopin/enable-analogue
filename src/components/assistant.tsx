"use client";
/**
 * The assistant — one assistant at two sizes (VIS-100, Constantin, 2026-09-28).
 *
 * The Conversations page (/ask) is the assistant at full size; the panel is the same
 * conversation, compact, beside your work. Both read one list of conversations
 * (`threadsFor`): the ones kept on this desk from before the session (`seededThreads`,
 * from src/data/seed.ts) and the ones started today (store `assistantThreads`). Both draw
 * a conversation with the same `ThreadView` and the same `AnswerView`, at two densities.
 * Until 2026-09-28 there were two assistants with two stores, and the panel's list mixed
 * them (AI-01).
 *
 *   ⌘K search      a centred palette: records, travellers, trips and commissions by name,
 *                  under the one visibility rule (VIS-098). Its last row hands the words
 *                  to the assistant.
 *   the assistant  the button at the bottom right (or ⌘J). One name for the place,
 *                  "Conversations", one for the act, "Ask Enable", one mark (AI-12).
 *   entry points   `askWhy` (an insight's "Why?") and `askAbout` (an object's "Ask about
 *                  this"). The assistant speaks first, with its mark, quoting what you
 *                  pressed on; a user bubble holds only what the user typed or tapped
 *                  (AI-03, AI-04). Pressing the same entry point again reopens the same
 *                  conversation (AI-10).
 *   answers        every answer keeps its numbered sources and the answer contract it was
 *                  checked against (AI-05), and reads word for word when reopened; if
 *                  what it rested on has changed since, the conversation says so and
 *                  offers to ask again (AI-06).
 *   tasks          run by the button, not the card, so they go on when the panel closes;
 *                  the button rings while one works and shows a dot while a confirm waits
 *                  (AI-09).
 *
 * GO or DO, by the copy alone (Constantin, 2026-09-25). "See Cap d'Estel" shows a result;
 * "Match EUR 690 to booking CD-3301" performs. A Do runs as a task you watch: its steps
 * arrive in the chat, the thing it works on is ringed on your screen (the assistant takes
 * you to it, and says so as a step), and it stops at a confirm, because nothing in this
 * product commits itself.
 *
 * The answers and tasks are deterministic here: intents over the model, using the facts
 * the insight engine computes. In production a model phrases them over the same facts.
 */
import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUp, ArrowUpRight, Check, ChevronDown, Loader2, Plus, X } from "lucide-react";
import {
  useDemo, needsYou, canViewCommissions, allTrips, tripsFor, sharedWithOwner,
  type DemoState, type TaskId, type AssistantThread, type AssistantAnswer, type AssistantTurn,
  type AnswerSource, type AnswerContract, type AssistantOpening, type Action,
} from "@/lib/store";
import { insightsFor, type Insight } from "@/lib/insights";
import { tripChecks, blockOf } from "@/lib/trip-checks";
import { areaFor, type Area } from "@/lib/areas";
import {
  products, productById, travellerCards, commissions, notices, askThreads, conversations, personName,
  commissionConflict, keptSource, traceFor, connections, orphanedPayments, programmeRates, type Product,
} from "@/data/seed";
import { linesOf, supplierOf, draftRequest, stamp, TODAY } from "@/data/trip-lines";
import { isDraftIntent, startDraft, continueDraft, planDraft, type DraftPlan } from "@/lib/draft-trip";
import type { DraftBrief } from "@/data/trip-lines";
import { Button } from "@/components/ui/button";
import { AreaDot, Chip, IconChrome, StatusDot } from "@/components/bits";
import { AnnouncementSheet } from "@/components/publish-sheets";
import { notify } from "@/lib/notify";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import type { Dispatch } from "react";

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
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** A fact as a person reads it: an ISO date as "02 Sep". */
const readable = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v.slice(8, 10)} ${MONTHS[Number(v.slice(5, 7)) - 1]}` : v);
const capital = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
/** "Book a car…" → "book a car…"; "EUR 690…" stays as it is. */
const lower = (x: string) => (x.length > 1 && x[1] === x[1].toLowerCase() ? x.charAt(0).toLowerCase() + x.slice(1) : x);
const clock = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

/** The Conversations page's composer, focused by the corner button and ⌘J there (AI-02). */
export const PAGE_COMPOSER = "conversations-composer";

function useIsDesktop() {
  const [is, setIs] = React.useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIs(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return is;
}

/* ── focus: the composer takes it only when you came by keyboard or an entry point ──
   (AI-12, 2026-09-28.) Every open used to autofocus, which pulled a phone's keyboard up
   over a conversation you only wanted to read. */
let lastInput: "key" | "pointer" = "pointer";
let focusWanted = false;
function wantFocus() { focusWanted = true; }
function takeFocus() { const w = focusWanted || lastInput === "key"; focusWanted = false; return w; }
function useLastInput() {
  React.useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key !== "Shift") lastInput = "key"; };
    const pointer = () => { lastInput = "pointer"; };
    window.addEventListener("keydown", key, true);
    window.addEventListener("pointerdown", pointer, true);
    return () => { window.removeEventListener("keydown", key, true); window.removeEventListener("pointerdown", pointer, true); };
  }, []);
}

/* ── context: the subject of the page you are on ─────────────────────────────────
   Shown as a removable chip in the composer, and used only when it shows there (AI-07,
   2026-09-28). A conversation's origin lives in its opening card, never in a chip that
   stays while you move. */

export interface PageContext {
  label: string; path: string; area: Area | null;
  productId?: string; tripId?: string; travellerId?: string; commissionId?: string;
}

const SECTION: Record<string, string> = {
  briefing: "your Briefing", notifications: "your Notifications", records: "Records",
  travellers: "Travellers", itineraries: "Itineraries", knowledge: "Knowledge",
  commissions: "Commissions", connections: "Connections", settings: "Settings",
  "admin/review": "Confirm records", "admin/publish": "Publish queue", "ops/resolution": "Unmatched payments",
};

/** Records a reader may see: the unconfirmed candidate exists only for the owner, until
    she confirms it (the same rule the Records page keeps). */
const recordVisible = (s: DemoState, id: string) => id !== "sereno-kyoto" || s.candidateConfirmed || s.role === "owner";
const travellerVisible = (s: DemoState, name: string) => s.role === "user" || sharedWithOwner(s, name);

export function contextFor(path: string, s: DemoState): PageContext | null {
  const clean = path.split("?")[0];
  const [a, b] = clean.split("/").filter(Boolean);
  const area = areaFor(clean);
  if (!a || a === "ask") return null;
  if (a === "records" && b) { const p = productById(b); return p && recordVisible(s, b) ? { label: p.name, path: clean, area, productId: b } : null; }
  if (a === "commissions" && b) { const c = commissions.find((x) => x.id === b); return c ? { label: c.property, path: clean, area, commissionId: b } : null; }
  if (a === "travellers" && b) { const t = travellerCards.find((x) => x.id === b); return t ? { label: t.name, path: clean, area, travellerId: b } : null; }
  if (a === "itineraries" && b) { const t = allTrips(s).find((x) => x.id === b); return t ? { label: t.title, path: clean, area, tripId: b } : null; }
  const key = Object.keys(SECTION).find((k) => clean.slice(1).startsWith(k));
  return key ? { label: SECTION[key], path: clean, area } : null;
}

/** Where something is, named for a sentence: "your Briefing", "Paris, thirtieth anniversary". */
function placeName(href: string, s: DemoState): string {
  const clean = href.split("?")[0];
  const [a, b, c] = clean.split("/").filter(Boolean);
  if (a === "ask") return "Conversations";
  if (a === "admin" && b === "review" && c) return "the candidate";
  return contextFor(clean, s)?.label ?? "it";
}
const see = (href: string, s: DemoState) => ({ label: `See ${placeName(href, s)}`, href });

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
type TaskState = NonNullable<AssistantTurn["task"]>;

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

/** A task as it stands now: its fixed parts, and the parts that read the state. A task
    that works somewhere other than where it began takes you there as its first step,
    and says so (AI-09, 2026-09-28): the page changing under you is part of the work. */
function defOf(id: TaskId, s: DemoState, path: string, task?: TaskState): TaskDef & { offset: number } {
  const def = TASKS[id];
  const first = { ...def, ...(def.live?.(s, path, task) ?? {}) };
  const offset = path.split("?")[0].startsWith(first.where) ? 0 : 1;
  if (!offset) return { ...first, offset };
  const inner = task ? { ...task, step: Math.max(0, task.step - 1) } : task;
  const full = { ...def, ...(def.live?.(s, path, inner) ?? {}) };
  return { ...full, offset, steps: [[`Taking you to ${placeName(full.where, s)}`, ""], ...full.steps] };
}

/* A draft's plan, worked out once per brief: the steps must not move while they run. */
const plans = new Map<string, DraftPlan | null>();
function planOf(brief: DraftBrief | undefined, s: DemoState): DraftPlan | null {
  if (!brief) return null;
  if (!plans.has(brief.tripId)) plans.set(brief.tripId, planDraft(brief, s));
  return plans.get(brief.tripId) ?? null;
}

/* The payment the owner's insight is about, read from the seed rather than restated: it
   was re-pointed to CD-3301 on 2026-09-28 (COL-12), and the task still named VO-2214. */
const OP1 = (() => {
  const p = orphanedPayments.find((x) => x.id === "op1");
  const c = p?.candidates.find((x) => x.strength === "strong");
  const [ref = "the booking", who = ""] = c?.ref.split(" · ") ?? [];
  const property = commissions.find((x) => x.id === c?.commission)?.property;
  return { amount: p ? eur(p.amount) : "the payment", raw: p?.raw ?? "the traveller", full: c?.ref ?? "", ref, property, booker: who.match(/booker (.+?) \(/)?.[1] };
})();

const TASKS: Record<TaskId, TaskDef> = {
  "match-op1": {
    label: `Match ${OP1.amount} to booking ${OP1.ref}`,
    where: "/ops/resolution", target: "payment-op1",
    steps: [
      ["Finding the booking", [OP1.ref, OP1.property, OP1.booker ? `booked by ${OP1.booker}` : ""].filter(Boolean).join(", ")],
      ["Checking the amount", `${OP1.amount} is the commission owed on ${OP1.ref}`],
      ["Checking the name", `${OP1.raw} travels on ${OP1.ref}, so the payment came in under the traveller`],
    ],
    ready: `Ready to match ${OP1.amount} to ${OP1.ref}. It is logged with your name and today’s date; the booking itself is not edited.`,
    confirm: "Confirm the match",
    done: "Matched and logged. The payment has left the open list.",
    /* The owner's own act (COL-05): recorded with who, when and why, so the n-payment
       notification and the ledger resolve with it. */
    commit: (d) => d({ type: "matchPaymentTo", id: "op1", ref: OP1.full, reason: "Matched through the assistant: the payment came in under the traveller's name." }),
  },
  "draft-vo": {
    label: "Draft the reminder to Villa Ortensia",
    where: "/commissions/vo", target: "reminder-vo",
    steps: [
      ["Opening the commission", "Villa Ortensia · VO-2214 · EUR 1,240"],
      ["Checking what is owed", "12 days overdue, booked under Meridian"],
      ["Drafting the reminder", "To the property’s accounts team, with the booking reference and the rate terms"],
    ],
    ready: "The draft is ready. It goes on the commission for you to read, edit and send.",
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
    done: "Done. The proposal no longer carries Hôtel Verlaine.",
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

export type Act = NonNullable<AssistantAnswer["actions"]>[number];
type Answer = AssistantAnswer;

/** Every insight, wherever it is shown: the Briefing's, then each trip's own checks. */
function findInsight(s: DemoState, id: string): { i: Insight; tripId?: string } | undefined {
  const briefed = insightsFor(s).find((x) => x.id === id);
  if (briefed) return { i: briefed };
  for (const t of allTrips(s)) {
    const c = tripChecks(s, t).find((x) => x.id === id);
    if (c) return { i: c, tripId: t.id };
  }
  return undefined;
}

/** The insight's OWN act, as the one action (AI-03): performed where the assistant can
    perform it, otherwise the place to do it. */
function actsFor(i: Insight, s: DemoState, tripId?: string): Act[] {
  if (i.id === "unmatched" && s.role === "owner" && !s.paymentMatched) return [{ label: TASKS["match-op1"].label, task: "match-op1" }];
  if (i.id === "notice-verlaine-crit-paris-anniversary") return [{ label: TASKS["shortlist-verlaine"].label, task: "shortlist-verlaine" }];
  if (i.action.sheet) return [{ label: i.action.label, sheet: i.action.sheet }];
  if (i.action.act) {
    const [verb, a] = i.action.act.split(":");
    const trip = tripId ? `/itineraries/${tripId}` : undefined;
    if (verb === "remove") return [{ label: i.action.label, remove: a }];
    if (verb === "ask-all") return [{ label: TASKS["ask-ideas"].label, task: "ask-ideas" }];
    if (trip && verb === "select") return [{ label: i.action.label, href: `${trip}?line=${a}` }];
    if (trip && verb === "compose") return [{ label: "Open the line", href: `${trip}?line=${a}` }];
    return trip ? [{ label: "Open the trip", href: trip }] : [];
  }
  return i.action.href ? [{ label: i.action.label, href: i.action.href }] : [];
}

/* A fact's label as a person reads it. Until 2026-09-28 the rows printed the model's
   camelCase keys through a regex ("in days", "leg state"): AI-03. */
const FACT: Record<string, string> = {
  traveller: "Traveller", trip: "Trip", event: "Event", leg: "Leg", legState: "Leg",
  property: "Property", notice: "Notice", severity: "Severity", incentive: "Incentive",
  bookBy: "Book by", daysLeft: "Time left", programme: "Programme", count: "Late payments",
  of: "Late payments in all", total: "Total", properties: "Properties", inDays: "Leaves in",
  open: "Still open", syncLagDays: "TripSuite lag", place: "Place", trips: "Trips",
  advisors: "Advisors", unconfirmed: "Transfers not booked", ageDays: "Age", until: "Holds until",
  tripsAfter: "Trips after that", candidate: "Candidate", from: "From", target: "Matches",
  similarity: "Similarity", tripsBooking: "Trips booking it", item: "Queued", by: "By",
  repeats: "Repeats", openedAt: "Opened", amount: "Amount", arrivedAs: "Arrived as",
  match: "Strong match", source: "Source", since: "Last success", line: "Line",
  holdUntil: "Held until", supplier: "Supplier", read: "Their answer", preference: "Preference",
  tag: "Tagged", nights: "Nights", to: "To", ideas: "Ideas", suggestions: "Suggestions",
  destinations: "Destinations", sentOn: "Asked on",
};
function factValue(k: string, v: string | number | string[]): string {
  const raw = Array.isArray(v) ? v.join(", ") : String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return readable(raw);
  switch (k) {
    case "legState": return raw === "unconfirmed" ? "not booked yet" : "booked";
    case "inDays": case "daysLeft": case "ageDays": return `${raw} days`;
    case "syncLagDays": return `up to ${Number(v) * 24} hours`;
    case "total": case "amount": return eur(Number(v));
    default: return raw;
  }
}
function factRows(i: Insight): [string, string][] {
  return Object.entries(i.facts)
    .filter(([, v]) => String(v) !== "")
    .slice(0, 6)
    .map(([k, v]): [string, string] => {
      /* a notice insight's `on` says how the trip holds the property, not a date */
      if (k === "on" && !/^\d{4}-/.test(String(v))) return ["On the trip", v === "shortlist" ? "shortlisted" : String(v)];
      return [FACT[k] ?? capital(k.replace(/([A-Z])/g, " $1").toLowerCase()), factValue(k, v)];
    });
}

/** "Transport operator notice · read 07:10" as a numbered source. */
function evidenceSource(evidence: string): AnswerSource {
  const [label, ...rest] = evidence.split(" · ");
  return { n: 1, label: capital(label), detail: rest.join(" · ") || "worked out today" };
}

/** Why an insight is there, from the insight itself (AI-08): the reason first, then its
    facts as labelled rows, its source, and its own act (AI-03). */
function explainInsight(i: Insight, s: DemoState, tripId?: string): Answer {
  return {
    text: [i.text],
    cites: [[1]],
    facts: factRows(i),
    sources: [evidenceSource(i.evidence)],
    contract: { status: "met", corroborated: 1 },
    basis: { key: `insight:${i.id}`, was: i.headline },
    actions: actsFor(i, s, tripId),
  };
}
/** An insight asked about again that no longer shows: said as a fact, never as "dealt
    with", because nothing here checked why it went (AI-08). */
const noLongerShown = (id: string, from: string): Answer => ({
  text: [`That no longer shows on ${from}.`],
  basis: { key: `insight:${id}`, was: "gone" },
});

/** The insight that belongs to where you are. */
function insightHere(s: DemoState, path: string): Insight | undefined {
  const clean = path.split("?")[0];
  const trip = tripOfPath(clean, s);
  if (trip) return tripChecks(s, trip)[0];
  const all = insightsFor(s);
  if (clean === "/ask" || clean === "/briefing") return all[0];
  const here = areaFor(clean);
  return all.find((i) => i.action.href && clean.startsWith(i.action.href.split("?")[0]))
    ?? (here && here !== "today" ? all.find((i) => i.action.href && areaFor(i.action.href.split("?")[0]) === here) : all[0]);
}

function recordAnswer(p: Product, s: DemoState): Answer {
  const money = canViewCommissions(s);
  const open = notices.filter((n) => n.productId === p.id && n.scope !== "personal" && !s.retired[n.id] && !(n.id === "spa" && s.spaNoticeClosed));
  const sources: AnswerSource[] = [
    { n: 1, label: "Directory record", detail: `${p.name} · updated ${p.updated}`, kind: "intranet" },
    ...open.map((n, i): AnswerSource => ({ n: i + 2, label: `${n.severity} notice`, detail: `${n.owner} · opened ${n.openedAt}`, kind: "manual" })),
  ];
  const text = [`${p.name}, ${p.city}, ${p.country}. ${p.luxuryTier}${p.programs.length ? `, in ${p.programs.join(" and ")}` : ""}.`];
  const cites: number[][] = [[1]];
  text.push(open.length ? `${open.length} ${open.length === 1 ? "notice is" : "notices are"} open: ${open.map((n) => `“${n.text}”`).join(" ")}` : "No notice is open on it.");
  cites.push(open.map((_, i) => i + 2));
  /* Commission belongs to a programme: say each one (2026-09-28). */
  if (money && programmeRates(p.id)) { text.push(`Commission depends on the programme a booking is made under: ${programmeRates(p.id)}. The record is ${p.evidence.label}.`); cites.push([1]); }
  return {
    text, cites, sources,
    contract: { status: open.length ? "notice" : "met", oldest: p.updated, corroborated: 1 },
    actions: [see(`/records/${p.id}`, s)],
  };
}

function travellerAnswer(name: string, id: string, s: DemoState): Answer {
  const theirs = tripsFor(s).filter((x) => x.traveller === name);
  return {
    text: [`${name} has ${theirs.length === 1 ? "1 trip" : `${theirs.length} trips`} on file.`],
    cites: [[1]],
    facts: theirs.map((x): [string, string] => [x.title, `${x.dates} · ${x.status}`]),
    sources: [{ n: 1, label: "Trip records", detail: `${theirs.length} on file`, kind: "intranet" }],
    contract: { status: "met", corroborated: 1 },
    actions: [see(`/travellers/${id}`, s)],
  };
}

function commissionAnswer(c: (typeof commissions)[number], s: DemoState): Answer {
  return {
    text: [
      `${c.property} (${c.bookingRef}) owes ${eur(c.amount)}${c.overdueDays ? `, ${c.overdueDays} days overdue` : ""}${c.program ? `, booked under ${c.program}` : ""}.`,
      c.id === "vo" ? "I can draft the reminder. You read it and send it." : "Reminders are drafted from the commission itself.",
    ],
    cites: [[1], []],
    sources: [{ n: 1, label: "Commission record", detail: c.bookingRef, kind: "tripsuite" }],
    contract: { status: "met", corroborated: 1 },
    actions: [
      ...(c.id === "vo" && s.reminder === "idle" ? [{ label: TASKS["draft-vo"].label, task: "draft-vo" as TaskId }] : []),
      see(`/commissions/${c.id}`, s),
    ],
  };
}

/** Nothing matched: a refusal, with the check it failed and a way forward (AI-05). The
    agency's own sources come first; the open web is offered, never gone to by default
    (Constantin, 2026-10-02). */
const cannotFind = (): Answer => ({
  text: ["I can’t find that in the agency’s sources, so I won’t guess.", "Name a property, a traveller or a commission, or I can look on the open web."],
  contract: { status: "refused", checks: [{ clause: "Sources", ok: false, note: "Nothing in the agency’s sources matches these words." }] },
  actions: [{ label: "Look on the open web", reply: "Look on the open web" }, { label: "Search the records", href: "/records" }],
});

/** The open web, asked for after the agency's sources could not answer: the question is
    the one they refused. Said as the web's, with the page it came from, and never added
    to the agency's records. */
function webAnswer(thread?: AssistantThread): Answer {
  const refused = [...(thread?.turns ?? [])].reverse()
    .find((x) => x.answer?.contract?.status === "refused" && x.answer.contract.checks?.some((c) => c.clause === "Sources" && !c.ok));
  const asked = norm(refused?.said ?? refused?.q ?? "");
  if (/rodin/.test(asked)) {
    return {
      text: [
        "The Musée Rodin’s own website says it is open Tuesday to Sunday, and closed on Mondays.",
        "This comes from the open web, not from the agency’s records, so check it before you tell your client.",
      ],
      cites: [[1], []],
      sources: [{ n: 1, label: "Musée Rodin website", detail: `musee-rodin.fr · Plan your visit · read today at ${clock()}`, kind: "web" }],
      contract: { status: "web", corroborated: 1 },
    };
  }
  return {
    text: [refused ? "Nothing on the open web answers that clearly either, so I won’t guess." : "Ask me something first: I look on the open web only when the agency’s sources cannot answer."],
    contract: { status: "refused", checks: [{ clause: "Sources", ok: false, note: "Neither the agency’s sources nor the open web settle it." }] },
  };
}

function answerFor(q: string, ctx: PageContext | null, s: DemoState, thread?: AssistantThread): Answer {
  const t = norm(q.trim());
  const money = canViewCommissions(s);

  /* an insight, explained: a starter's "Why …?", or an entry point */
  if (q.startsWith("why:")) {
    const found = findInsight(s, q.slice(4));
    return found ? explainInsight(found.i, s, found.tripId) : noLongerShown(q.slice(4), placeName(ctx?.path ?? "/briefing", s));
  }
  /* A follow-up "why" in a conversation about an insight is about that insight. The
     words stay as they were typed (AI-04): only what they are taken to be about is read
     from the conversation, never rewritten into another question. */
  if (thread?.about?.startsWith("insight:") && /^why\b|explain|reason/.test(t)) {
    const id = thread.about.slice(8);
    const found = findInsight(s, id);
    return found ? explainInsight(found.i, s, found.tripId) : noLongerShown(id, thread.opening?.from ?? "your Briefing");
  }

  /* "Why is this flagged?" typed with the page as context: answered about the first
     thing the page flags, and the answer says which one it took the question to be
     about. Until 2026-09-28 the words themselves were rewritten into that insight's
     question (AI-04). */
  if (ctx && /^why\b|flag/.test(t) && !products.some((p) => t.includes(norm(p.name)))) {
    const here = insightHere(s, ctx.path);
    const found = here && findInsight(s, here.id);
    if (here) {
      const a = explainInsight(here, s, found ? found.tripId : undefined);
      return { ...a, text: [`On ${ctx.label}, the first thing that needs you is “${here.headline}”.`, ...a.text], cites: [[], ...(a.cites ?? [])] };
    }
  }

  /* the inbox, triaged, in the inbox's own order (FB-04) */
  if (/catch me up|what'?s waiting|what needs me|inbox|notifications/.test(t)) {
    const open = needsYou(s);
    const count = (sev: string) => open.filter((n) => n.severity === sev).length;
    const vo = open.find((n) => n.subject?.href === "/commissions/vo" || n.action?.href === "/commissions/vo");
    return {
      text: [
        `${open.length} ${open.length === 1 ? "item is" : "items are"} waiting on you: ${count("Critical")} critical, ${count("Important")} important and ${count("Info")} for information.`,
        open[0] ? `Start with the first: ${lower(open[0].headline)}.` : "",
      ].filter(Boolean),
      cites: [[1], []],
      facts: open.slice(0, 3).map((n): [string, string] => [n.severity, n.headline]),
      sources: [{ n: 1, label: "Your notifications", detail: `as of ${clock()}` }],
      contract: { status: "met", corroborated: 1 },
      actions: [
        ...(vo && money && s.reminder === "idle" ? [{ label: TASKS["draft-vo"].label, task: "draft-vo" as TaskId }] : []),
        ...(open[0]?.action?.href ? [see(open[0].action.href, s)] : []),
        see("/notifications", s),
      ],
    };
  }

  /* on a trip (the builder): ask the suppliers about its ideas */
  if (ctx?.tripId && s.lab && /ask (for|about)|request|availability|ideas|suppliers/.test(t)) {
    const trip = allTrips(s).find((x) => x.id === ctx.tripId);
    const n = askable(s, ctx.tripId).length;
    return n
      ? {
          text: [`${trip?.title} has ${n} ${n === 1 ? "idea" : "ideas"} nobody has asked about. I can draft one request per supplier from the lines and the traveller, and show them to you before anything goes.`],
          cites: [[1]],
          sources: [{ n: 1, label: "The trip’s lines", detail: trip?.title ?? "" }],
          actions: [{ label: TASKS["ask-ideas"].label, task: "ask-ideas" as TaskId }],
        }
      : { text: ["Every idea on this trip has been asked about, or cannot be: a closed record stays unasked."] };
  }

  /* chase a commission */
  const chase = t.match(/^(chase|remind)\s+(.+)/);
  if (chase) {
    if (!money) return { text: ["Commission figures are not shared with you, so there is nothing for me to chase."] };
    const c = commissions.find((x) => norm(x.property).includes(chase[2]) || chase[2].includes(norm(x.property)));
    if (c) return commissionAnswer(c, s);
  }

  /* write to the team */
  if (/write to the (team|agency)|announce/.test(t)) {
    return {
      text: [s.role === "owner"
        ? "A note to the team reaches every advisor when you publish it, and answers cite it with its date."
        : "A note to your team goes out when you send it; one to the whole agency waits for M. Keller to release it."],
      actions: [{ label: "Write to the team", sheet: "announcement" }],
    };
  }

  /* what the agency said about Kyoto */
  if (/kyoto/.test(t)) return kyotoAnswer();

  /* the open web, asked for after a refusal */
  if (/^(look|search|check)( it up)? on the (open )?web|^(look|search|check) the (open )?web/.test(t)) return webAnswer(thread);

  /* the spa at Maison Léandre: the agency's notice answers, before the record's summary */
  if (/\bspa\b/.test(t) && t.includes("leandre")) return spaAnswer(s, basisNow("spa-notice", s) === "active");

  /* a record, named or the one the page is about */
  const named = products.find((p) => recordVisible(s, p.id) && t.includes(norm(p.name)));
  const p = named ?? (ctx?.productId && /this|it\b|here|true|rate|commission|notice|spa|represent/.test(t) ? productById(ctx.productId) : undefined);
  if (p) return recordAnswer(p, s);

  /* a traveller this reader may see, and their trips */
  const tc = travellerCards.find((x) => t.includes(norm(x.name)) && travellerVisible(s, x.name))
    ?? (ctx?.travellerId && /they|them|their|this|trip/.test(t) ? travellerCards.find((x) => x.id === ctx.travellerId && travellerVisible(s, x.name)) : undefined);
  if (tc) return travellerAnswer(tc.name, tc.id, s);

  return cannotFind();
}

/* ── the conversations kept on this desk (AI-01) ─────────────────────────────────
   Each is built as the answer was given when it was asked, sources and contract
   included, for this reader: a reader without the money entitlement was answered
   without the rate. What has changed since shows as "Since this was answered". */

const COMMISSION_KIND: Record<number, AnswerSource["kind"]> = { 1: "portal", 2: "intranet", 3: "email" };
const traceOf = (id: string, s: DemoState, noticeActive = s.world === "v2") =>
  traceFor(id, noticeActive).filter((x) => !x.needsCommission || canViewCommissions(s)).map(({ stage, detail }) => ({ stage, detail }));

function conflictAnswer(s: DemoState): Answer {
  return {
    text: [
      "Three sources disagree on the commission, so I have not given a rate.",
      "The partner portal says 12%, TripSuite 10% and a manual entry 14%. Settle it on the record and I will answer from the value you keep.",
      "The Atelier rate includes daily breakfast for two and a EUR 100 property credit.",
    ],
    cites: [[], [1, 2, 3], [1]],
    facts: commissionConflict.sources.map((x): [string, string] => [x.label, `${x.value} · ${x.status.toLowerCase()} · ${x.when}`]),
    sources: [
      { n: 1, label: "Partner portal", detail: "Atelier Collection terms · 12 Mar 2026 · p.4", kind: "portal", doc: "atelier-terms", quote: askThreads.commission.sources[0].quote },
      { n: 2, label: "TripSuite", detail: "Rate feed · 28 Feb 2026", kind: "tripsuite" },
      { n: 3, label: "Manual entry", detail: "Keyed by JB · 03 Apr 2026", kind: "manual" },
    ],
    contract: { status: "disagree", oldest: "28 Feb" },
    trace: traceOf("leandre-rate", s),
    basis: { key: "conflict", was: "open" },
    actions: [{ label: "Resolve on the record", sheet: "resolve", href: "/records/maison-leandre" }],
  };
}

function resolvedAnswer(s: DemoState): Answer {
  const kept = keptSource(s.conflictChoice);
  return {
    text: askThreads.commission.resolved.lines.map((l) => l.text.replace("12%", kept.value)),
    cites: askThreads.commission.resolved.lines.map((l) => [l.cite]),
    facts: [["Kept", `${kept.value}, from ${kept.label} · stored today at the agency layer`]],
    sources: askThreads.commission.sources.map((x): AnswerSource => ({ ...x, kind: COMMISSION_KIND[x.n] })),
    contract: { status: "met", oldest: "12 Mar", corroborated: 3 },
    trace: traceOf("leandre-rate", s),
    basis: { key: "conflict", was: `kept:${s.conflictChoice}` },
    actions: [{ label: "Open the record", href: "/records/maison-leandre" }],
  };
}

function spaAnswer(s: DemoState, active: boolean): Answer {
  const spa = notices.find((n) => n.id === "spa");
  if (active && spa) {
    return {
      text: [askThreads.spa.v2],
      cites: [[1]],
      facts: [["Notice", spa.text], ["Opened", `${spa.openedAt} · ${spa.scope} scope · ${spa.owner}`]],
      sources: [{ n: 1, label: "Agency notice", detail: "Maison Léandre · opened 12 Jun 2026 · agency scope · MK", kind: "manual" }],
      contract: { status: "notice", oldest: "12 Jun", corroborated: 1 },
      trace: traceOf("spa-status", s, true),
      basis: { key: "spa-notice", was: "active" },
      actions: [{ label: "Open the record", href: "/records/maison-leandre" }],
    };
  }
  if (s.world === "v1") {
    /* The March build: the contract checked that an answer was sourced and cited, and
       this one is both, and wrong. Freshness was not yet in it. */
    return {
      text: [askThreads.spa.v1],
      cites: [[1]],
      sources: [{ n: 1, label: "Property website capture", detail: "Pool and spa hours · Maison Léandre", kind: "gdrive" }],
      contract: { status: "met", checks: [{ clause: "Sources", ok: true, note: "One source gives the spa hours." }, { clause: "Citations", ok: true, note: "The answer cites it." }] },
      trace: traceOf("spa-status", s, false),
      basis: { key: "spa-notice", was: "closed" },
      actions: [{ label: "Open the record", href: "/records/maison-leandre" }],
    };
  }
  return {
    text: ["No notice is open on the spa now.", "The property website, captured in May, lists the spa open 07:00–21:00 daily. The capture is 96 days old, so check with the property before you tell your client."],
    cites: [[], [1]],
    sources: [{ n: 1, label: "Property website capture", detail: "Pool and spa hours · captured May · 96 days old", kind: "gdrive" }],
    contract: { status: "stale", oldest: "May" },
    trace: traceOf("spa-status", s, false),
    basis: { key: "spa-notice", was: "closed" },
    actions: [{ label: "Open the record", href: "/records/maison-leandre" }],
  };
}

function kyotoAnswer(): Answer {
  return {
    text: [askThreads.kyoto.a1, askThreads.kyoto.a2],
    cites: [[1, 2], [1]],
    sources: [
      { n: 1, label: "Agency announcement", detail: "New in Kyoto for autumn · M. Keller · 26 Aug 2026 · agency scope", kind: "announcement" },
      { n: 2, label: "Directory record", detail: "Ryokan Suikawa · verified May 2026", kind: "intranet" },
    ],
    contract: { status: "met", oldest: "May", corroborated: 2 },
    trace: traceFor("kyoto-new", false).map(({ stage, detail }) => ({ stage, detail })),
    actions: [{ label: "Open Ryokan Suikawa", href: "/records/ryokan-suikawa" }],
  };
}

function seededAnswer(id: string, s: DemoState): Answer | null {
  const money = canViewCommissions(s);
  switch (id) {
    case "leandre-rate":
      if (!money) {
        return {
          text: ["Commission terms sit with the owning advisor, so I cannot give the rate.", "The Atelier rate includes daily breakfast for two and a EUR 100 property credit."],
          cites: [[], [1]],
          sources: [{ n: 1, label: "Directory record", detail: "Maison Léandre · negotiated perk · 21 Jun", kind: "manual" }],
          contract: { status: "met", oldest: "21 Jun", corroborated: 1 },
          trace: traceOf("leandre-rate", s),
          actions: [{ label: "Open the record", href: "/records/maison-leandre" }],
        };
      }
      return conflictAnswer(s);
    case "third-night": {
      const r = askThreads.refusal;
      const inbound = connections.find((c) => c.name.startsWith("Inbound mail"));
      const address = inbound ? inbound.name.replace("Inbound mail — ", "") : "the inbound address";
      return {
        text: [r.headline, r.body],
        contract: { status: "refused", checks: r.contract, policy: r.policy, held: r.held },
        trace: traceOf("third-night", s),
        actions: [
          { label: r.ctas[0], done: `Watching ${address}. A verified document there reopens this answer.` },
          { label: r.ctas[1], done: "A note to Corvin & Wells is drafted for your review. Nothing is sent until you send it." },
          { label: r.ctas[2], done: "Flagged for review in Confirm records." },
        ],
      };
    }
    case "spa-status": return spaAnswer(s, s.world === "v2");
    case "rep-paris":
      return {
        text: [askThreads.rep.a],
        cites: [[1]],
        sources: [{ n: 1, label: "Email extract", detail: "Corvin & Wells · 21 Jun 2026", kind: "email", doc: "cw-rate-note" }],
        contract: { status: "met", oldest: "21 Jun", corroborated: 1 },
        trace: traceOf("rep-paris", s),
        actions: [{ label: "Open the rep firm", href: "/records/corvin-wells" }],
      };
    case "kyoto-new": return kyotoAnswer();
    case "pool-hours":
      return {
        text: ["The pool is open 07:00–21:00, according to the property website captured in May.", "That capture is 96 days old, so the hours may have changed."],
        cites: [[1], []],
        sources: [{ n: 1, label: "Property website capture", detail: "Pool hours · captured May · 96 days old", kind: "gdrive" }],
        contract: { status: "stale", oldest: "May" },
        trace: traceOf("pool-hours", s),
        actions: [{ label: "Open the record", href: "/records/maison-leandre" }],
      };
    default: return null;
  }
}

const SAID: Record<string, string> = {
  "leandre-rate": askThreads.commission.q, "third-night": askThreads.refusal.q, "spa-status": askThreads.spa.q,
  "rep-paris": askThreads.rep.q, "kyoto-new": askThreads.kyoto.q, "pool-hours": askThreads.stale.q,
};

export function seededThreads(s: DemoState): AssistantThread[] {
  /* Refusal is a v2 capability: in the March build the system answered rather than
     declining, so a refused conversation could not exist then. */
  return conversations
    .filter((c) => s.world === "v2" || c.state !== "refusal")
    .flatMap((c) => {
      const answer = seededAnswer(c.id, s);
      if (!answer) return [];
      const at = c.when.startsWith("Today ") ? c.when.slice(6) : undefined;
      return [{ id: c.id, title: c.title, path: "/ask", when: c.when, turns: [{ q: SAID[c.id] ?? c.preview, said: SAID[c.id] ?? c.preview, path: "/ask", at, answer }] }];
    });
}

/** Every conversation this reader has: today's first, then the ones kept on the desk. A
    conversation is private to whoever asked it. */
export function threadsFor(s: DemoState): AssistantThread[] {
  const live = s.assistantThreads.filter((t) => !t.by || t.by === s.role);
  const kept = seededThreads(s).filter((t) => !s.assistantThreads.some((x) => x.id === t.id));
  return [...live, ...kept];
}

/** Today, then earlier: the list's two groups. */
export function groupThreads(threads: AssistantThread[]) {
  const today = threads.filter((t) => t.when.startsWith("Today"));
  const earlier = threads.filter((t) => !t.when.startsWith("Today"));
  return [{ label: "Today", threads: today }, { label: "Earlier", threads: earlier }].filter((g) => g.threads.length > 0);
}
export const whenOf = (t: AssistantThread) => (t.when.startsWith("Today ") ? t.when.slice(6) : t.when);

/** A conversation's state in a word and a dot: what its last turn left. Ochre only where
    something waits on a decision; everything else neutral (VIS-097). */
export function threadState(t: AssistantThread, s?: DemoState): { tone: "warn" | "muted" | "primary"; word: string } {
  const last = t.turns[t.turns.length - 1];
  /* what it rested on has changed: the old state no longer asks anything of anyone */
  if (s && !last?.task && sinceOf(t, s)) return { tone: "muted", word: "changed since" };
  if (last?.task) {
    const st = last.task.status;
    return st === "running" ? { tone: "primary", word: "working" } : st === "ready" ? { tone: "warn", word: "waiting for you" } : { tone: "muted", word: st === "done" ? "done" : "stopped" };
  }
  if (last?.answer?.ask) return { tone: "muted", word: "waiting for your reply" };
  switch (last?.answer?.contract?.status) {
    case "disagree": return { tone: "warn", word: "sources disagree" };
    case "refused": return { tone: "muted", word: "refused" };
    case "stale": return { tone: "muted", word: "may be out of date" };
    case "notice": return { tone: "muted", word: "carries a notice" };
    case "web": return { tone: "muted", word: "from the open web" };
    default: return { tone: "muted", word: "answered" };
  }
}

/** A conversation's title as a person reads it. */
export function titleOf(title: string, s: DemoState): string {
  if (!title.startsWith("why:")) return title;
  const found = findInsight(s, title.slice(4));
  return found ? `Why ${lower(found.i.headline)}?` : "Why this?";
}

/* ── since this was answered (AI-06) ─────────────────────────────────────────────── */

function basisNow(key: string, s: DemoState): string {
  if (key === "conflict") return s.conflictResolved ? `kept:${s.conflictChoice}` : "open";
  if (key === "spa-notice") return s.world === "v2" && !s.spaNoticeClosed && !s.retired.spa ? "active" : "closed";
  if (key.startsWith("insight:")) return findInsight(s, key.slice(8))?.i.headline ?? "gone";
  return "";
}

/** What changed since the conversation's last answer, in a sentence; null if nothing. */
export function sinceOf(t: AssistantThread, s: DemoState): string | null {
  const last = [...t.turns].reverse().find((x) => x.answer);
  const basis = last?.answer?.basis;
  if (!basis) return null;
  const now = basisNow(basis.key, s);
  if (!now || now === basis.was) return null;
  if (basis.key === "conflict") {
    if (now === "open") return "the commission rate is open again.";
    const kept = keptSource(s.conflictChoice);
    return `the commission was settled at ${kept.value}, kept from ${kept.label}.`;
  }
  if (basis.key === "spa-notice") return now === "active" ? "an agency notice on the spa is open." : "the agency notice on the spa was closed.";
  const from = t.opening?.from ?? placeName(t.path, s);
  return now === "gone" ? `it no longer shows on ${from}.` : `it now reads “${now}”.`;
}

/** The same question, answered from today's sources. */
function answerAgain(t: AssistantThread, s: DemoState): Answer {
  const basis = [...t.turns].reverse().find((x) => x.answer?.basis)?.answer?.basis;
  if (basis?.key === "conflict") return s.conflictResolved ? resolvedAnswer(s) : conflictAnswer(s);
  if (basis?.key === "spa-notice") return spaAnswer(s, basisNow("spa-notice", s) === "active");
  if (basis?.key.startsWith("insight:")) {
    const id = basis.key.slice(8);
    const found = findInsight(s, id);
    return found ? explainInsight(found.i, s, found.tripId) : noLongerShown(id, t.opening?.from ?? placeName(t.path, s));
  }
  return answerFor(t.turns[0]?.q ?? "", null, s, t);
}

/** The seeded conversation in front, if it has not yet joined the store. */
const baseFor = (s: DemoState, t?: AssistantThread) => (t && !s.assistantThreads.some((x) => x.id === t.id) ? t : undefined);

/* ── entry points (the contract every page calls; VIS-100) ─────────────────────
   A page never words a question on the user's behalf. It hands the assistant WHAT the
   user pressed on, and the assistant speaks first about it:
     askWhy    "Why?" on an insight (the Briefing's card, a trip's check). The insight
               itself is passed, so the explanation never looks it up again (AI-08).
     askAbout  "Ask about this" on an object (a record, a traveller, a trip, a
               commission, a document): the panel opens on a conversation about it,
               the composer carrying it as context.
   The same subject reopens its conversation rather than starting another (AI-10). */
export interface AskSubject {
  kind: "record" | "traveller" | "trip" | "commission" | "document";
  id: string;
  label: string;
  href: string;
}

function reopen(d: Dispatch<Action>, s: DemoState, about: string): boolean {
  const existing = threadsFor(s).find((t) => t.about === about);
  if (existing) d({ type: "thread", id: existing.id });
  return !!existing;
}

export function askWhy(d: Dispatch<Action>, s: DemoState, insight: Insight, path: string) {
  wantFocus();
  const about = `insight:${insight.id}`;
  if (reopen(d, s, about)) return;
  const clean = path.split("?")[0];
  const trip = tripOfPath(clean, s);
  const tripId = trip && tripChecks(s, trip).some((x) => x.id === insight.id) ? trip.id : undefined;
  const list = tripId && trip ? tripChecks(s, trip) : insightsFor(s);
  const at = clock();
  const opening: AssistantOpening = {
    from: placeName(clean, s), at,
    area: insight.action.href ? areaFor(insight.action.href.split("?")[0]) : areaFor(clean),
    label: list[0]?.id === insight.id ? `First move · ${insight.title}` : insight.title,
    headline: insight.headline,
    evidence: insight.evidence,
  };
  d({ type: "thread", id: null });
  d({ type: "ask", q: `why:${insight.id}`, path: clean, title: `Why ${lower(insight.headline)}?`, about, opening, answer: explainInsight(insight, s, tripId) });
}

const KIND_LABEL: Record<AskSubject["kind"], string> = { record: "Record", traveller: "Traveller", trip: "Trip", commission: "Commission", document: "Document" };

export function askAbout(d: Dispatch<Action>, s: DemoState, subject: AskSubject, path: string) {
  wantFocus();
  const about = `${subject.kind}:${subject.id}`;
  if (reopen(d, s, about)) return;
  const clean = path.split("?")[0];
  let evidence: string | undefined;
  let answer: Answer = { text: [`I can answer from ${subject.label}. What would you like to know?`] };
  if (subject.kind === "record") {
    const p = productById(subject.id);
    if (p && recordVisible(s, p.id)) { evidence = `${p.city}, ${p.country} · updated ${p.updated}`; answer = recordAnswer(p, s); }
  } else if (subject.kind === "traveller") {
    const t = travellerCards.find((x) => x.id === subject.id);
    if (t && travellerVisible(s, t.name)) answer = travellerAnswer(t.name, t.id, s);
  } else if (subject.kind === "trip") {
    const t = allTrips(s).find((x) => x.id === subject.id);
    if (t) {
      const lines = linesOf(s.tripLines, t.id);
      const confirmed = lines.filter((l) => l.status === "confirmed").length;
      evidence = `${t.traveller} · ${t.dates}`;
      answer = {
        text: [`${t.title}, for ${t.traveller}: ${t.dates}, ${t.status.toLowerCase()}.`, lines.length ? `${lines.length} ${lines.length === 1 ? "line is" : "lines are"} on it, ${confirmed} confirmed.` : "Nothing is on it yet."],
        cites: [[1], [1]],
        sources: [{ n: 1, label: "The trip’s lines", detail: t.title }],
        contract: { status: "met", corroborated: 1 },
      };
    }
  } else if (subject.kind === "commission") {
    const c = commissions.find((x) => x.id === subject.id);
    if (c && canViewCommissions(s)) { evidence = `${c.bookingRef} · ${eur(c.amount)}`; answer = commissionAnswer(c, s); }
  }
  const opening: AssistantOpening = {
    from: placeName(clean, s), at: clock(), area: areaFor(subject.href.split("?")[0]),
    label: KIND_LABEL[subject.kind], headline: subject.label, evidence, href: subject.href,
  };
  d({ type: "thread", id: null });
  d({ type: "ask", q: `about:${about}`, path: clean, title: `About ${subject.label}`, about, opening, answer });
}

/** Ask the assistant. `words` is the intent; `said` what the person typed or tapped, which
    is what the conversation shows (AI-04). Free text is never rewritten into another
    question. `fresh` starts a new conversation; `open: false` keeps the panel away (the
    Conversations page); `context: false` asks without the page's subject (AI-07). */
export function askAssistant(
  d: Dispatch<Action>, s: DemoState, words: string, path: string, fresh = false,
  opts: { said?: string; about?: string; open?: boolean; context?: boolean } = {},
) {
  const q = words.trim();
  if (!q) return;
  const said = (opts.said ?? words).trim();
  const open = opts.open ?? true;
  const cur = fresh ? undefined : threadsFor(s).find((t) => t.id === s.assistantThread);
  const base = baseFor(s, cur);
  /* a draft in conversation: this answers the question it asked last */
  const waiting = cur?.turns[cur.turns.length - 1]?.answer?.draft;
  if (waiting?.awaiting && s.lab) { d({ type: "ask", q, said, path, answer: continueDraft(waiting, q, s), base, open }); return; }
  if (fresh) d({ type: "thread", id: null, open });
  if (s.lab && isDraftIntent(q)) {
    d({ type: "ask", q, said, path, answer: startDraft(q, path, s, newDraftId()), title: "Draft a trip", base, open });
    return;
  }
  const ctx = opts.context === false ? null : contextFor(path, s);
  d({ type: "ask", q, said, path, answer: answerFor(q, ctx, s, cur), title: said, about: opts.about, base, open });
}

let drafts = 0;
const newDraftId = () => `d${++drafts}${Date.now().toString(36).slice(-4)}`;

/** Start a draft with what is already known (the New trip sheet hands over its fields):
    the assistant asks only for the rest. Begun by an act, so recorded as the choice. */
export function startDraftWith(d: Dispatch<Action>, s: DemoState, path: string, seed: Partial<DraftBrief>) {
  d({ type: "thread", id: null });
  d({ type: "ask", q: "Draft a trip", chose: "Draft a trip", path, answer: startDraft("", path, s, newDraftId(), seed), title: "Draft a trip" });
}

/* ── starters: from where you are ──────────────────────────────────────────────── */

export interface Starter { label: string; q: string; about?: string }

export function startersFor(s: DemoState, path: string): Starter[] {
  const here = insightHere(s, path);
  const ctx = contextFor(path, s);
  const rec = productById(ctx?.productId ?? "maison-leandre");
  const traveller = ctx?.travellerId ? ctx.label : null;
  return [
    { label: "Catch me up on what’s waiting", q: "catch me up" },
    ...(here ? [{ label: `Why ${lower(here.headline)}?`, q: `why:${here.id}`, about: `insight:${here.id}` }] : []),
    ...(rec && recordVisible(s, rec.id) ? [{ label: `What’s true about ${rec.name}?`, q: `what is true about ${rec.name}` }] : []),
    ...(ctx?.tripId && s.lab ? [{ label: "Ask the suppliers about every idea", q: "ask about every idea" }] : []),
    ...(s.lab ? [{ label: traveller ? `Draft a trip for ${traveller}` : "Draft a trip", q: traveller ? `Draft a trip for ${traveller}` : "Draft a trip" }] : []),
  ].slice(0, 4);
}

/** A tapped starter: its label is what the person said (AI-04). A "Why" about an insight
    that already has a conversation reopens it (AI-10). */
export function pickStarter(d: Dispatch<Action>, s: DemoState, x: Starter, path: string, open = true) {
  const existing = x.about ? threadsFor(s).find((t) => t.about === x.about) : undefined;
  if (existing) { d({ type: "thread", id: existing.id, open }); return; }
  askAssistant(d, s, x.q, path, true, { said: x.label, about: x.about, open });
}

/* ── acts pressed on an answer ─────────────────────────────────────────────────── */

/** One way to act on an answer, for the panel and the page. An act is recorded as the
    choice ("You chose: …"), never as words put in the person's mouth (AI-04). */
export function useRunAct(opts: { inPanel: boolean; onSheet: (sheet: "announcement" | "resolve") => void }) {
  const { s, d } = useDemo();
  const router = useRouter();
  const pathname = usePathname();
  return (a: Act, thread: AssistantThread) => {
    const base = baseFor(s, thread);
    const open = opts.inPanel;
    const where = pathname.startsWith("/ask") ? thread.path : pathname;
    if (a.sheet === "announcement") { opts.onSheet("announcement"); return; }
    if (a.sheet === "resolve") { if (!opts.inPanel) opts.onSheet("resolve"); else if (a.href) router.push(a.href); return; }
    if (a.reply) { askAssistant(d, s, a.reply, pathname, false, { open }); return; }
    if (a.done) { d({ type: "ask", q: a.label, chose: a.label, path: where, answer: { text: [a.done] }, base, open }); return; }
    if (a.remove) {
      const line = s.tripLines.find((l) => l.id === a.remove);
      const before = s.tripLines;
      d({ type: "lineRemove", id: a.remove });
      d({ type: "ask", q: a.label, chose: a.label, path: where, answer: { text: [`${line?.what ?? "The line"} is off the trip.`] }, base, open });
      notify("Taken off the trip", { detail: line?.what, undo: () => d({ type: "patch", patch: { tripLines: before } }) });
      return;
    }
    if (a.task) { d({ type: "task", task: a.task, label: TASKS[a.task].label, path: where, brief: a.brief, base, open }); return; }
    if (a.href) router.push(a.href);
  };
}

export function askAgain(d: Dispatch<Action>, s: DemoState, t: AssistantThread, open: boolean) {
  d({ type: "ask", q: t.turns[0]?.q ?? t.title, chose: "Ask again with today’s sources", path: t.path, answer: answerAgain(t, s), base: baseFor(s, t), open });
}

/* ── the button, its task runner, and its peek ──────────────────────────────── */

/** The peek beside the button. Off by default (Constantin, 2026-09-25). */
const PEEK = false;

type Found = { thread: string; index: number; turn: AssistantTurn };
function findTask(s: DemoState, status: TaskState["status"]): Found | undefined {
  for (const t of s.assistantThreads) {
    const index = t.turns.findIndex((x) => x.task?.status === status);
    if (index >= 0) return { thread: t.id, index, turn: t.turns[index] };
  }
  return undefined;
}

/* Tasks run here, in the button that is always on screen, not in the card: closing the
   panel used to stop a task mid-step (AI-09, 2026-09-28). */
function useTaskRunner() {
  const { s, d } = useDemo();
  const pathname = usePathname();
  const router = useRouter();
  const running = findTask(s, "running");
  const ready = findTask(s, "ready");
  const key = running ? `${running.thread}:${running.index}:${running.turn.task!.step}` : null;

  React.useEffect(() => {
    if (!running) return;
    const { thread, index, turn } = running;
    const task = turn.task!;
    const def = defOf(task.id, s, turn.path, task);
    if (task.step === 0) {
      def.start?.(d, s, task);
      if (!pathname.startsWith(def.where)) {
        /* leaving Conversations for the place the work happens: the panel carries on */
        if (pathname.startsWith("/ask")) d({ type: "assistant", open: true });
        router.push(def.where);
      }
    }
    const t = window.setTimeout(() => {
      if (task.step >= def.offset) def.onStep?.(d, s, task.step - def.offset, task);
      d({ type: "taskStep", thread, index, steps: def.steps.length });
    }, 1100);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /* what it works on is ringed on the page, until the task stops */
  const working = running ?? ready;
  const target = working ? defOf(working.turn.task!.id, s, working.turn.path, working.turn.task).target : null;
  React.useEffect(() => {
    if (!target) return;
    let el: Element | null = null;
    const find = window.setInterval(() => {
      el = document.querySelector(`[data-agent-target="${target}"]`);
      if (el) { el.classList.add("agent-working"); el.scrollIntoView({ block: "center", behavior: "smooth" }); window.clearInterval(find); }
    }, 150);
    return () => { window.clearInterval(find); el?.classList.remove("agent-working"); };
  }, [working?.thread, working?.index, pathname, target]);

  return { running, ready };
}

export function AssistantButton() {
  const { s, d } = useDemo();
  const pathname = usePathname();
  const { running, ready } = useTaskRunner();
  useLastInput();
  /* On Conversations the page is the assistant: the button shows as the place you are,
     and pressing it goes to the page's composer (AI-02). */
  const here = pathname.startsWith("/ask");
  const [peeking, setPeeking] = React.useState<Insight | null>(null);

  /* the peek's one interrupt: the first Critical insight not yet peeked this session */
  const next = React.useMemo(() => (PEEK ? insightsFor(s).find((i) => i.severity === "Critical" && !s.dismissed[`peek-${i.id}`]) : undefined), [s]);
  const nextId = next?.id;
  React.useEffect(() => {
    if (!PEEK || !next || s.assistantOpen) return;
    const show = window.setTimeout(() => setPeeking(next), 900);
    const hide = window.setTimeout(() => { setPeeking(null); d({ type: "dismiss", id: `peek-${next.id}` }); }, 7500);
    return () => { window.clearTimeout(show); window.clearTimeout(hide); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextId, s.assistantOpen]);

  const press = () => {
    if (here) { document.getElementById(PAGE_COMPOSER)?.focus(); return; }
    if (!s.assistantOpen && ready) { d({ type: "thread", id: ready.thread }); return; }
    d({ type: "assistant", open: !s.assistantOpen });
  };
  const label = running ? "Ask Enable, working on a task" : ready ? "Ask Enable, a confirm is waiting for you" : "Ask Enable";

  return (
    <div className="pointer-events-none fixed right-[var(--frame-inset)] bottom-3 z-40 flex items-center gap-2">
      {PEEK && peeking && !s.assistantOpen && (
        <button
          type="button"
          onClick={() => { setPeeking(null); d({ type: "dismiss", id: `peek-${peeking.id}` }); askWhy(d, s, peeking, pathname); }}
          /* A small card, not a pill: a pill chooses, and this acts (tier 2, "a pill never
             acts"). It says what it is about, then what pressing it does. */
          className="peek-in glass pointer-events-auto flex max-w-[380px] cursor-pointer flex-col items-start gap-0.5 rounded-lg px-4 py-2.5 text-left"
        >
          <AreaDot area={peeking.action.href ? areaFor(peeking.action.href.split("?")[0]) : null}><span className="line-clamp-1 type-data-strong text-label">{peeking.headline}</span></AreaDot>
          <span className="type-meta">Ask Enable why</span>
        </button>
      )}
      <button
        type="button"
        aria-label={label}
        aria-expanded={here ? undefined : s.assistantOpen}
        aria-current={here ? "page" : undefined}
        onClick={press}
        className={cn(
          "pressable pointer-events-auto relative grid size-12 cursor-pointer place-items-center rounded-full",
          here ? "bg-selected text-on-selected" : "glass text-label",
        )}
      >
        <EnableMark className="size-6" />
        {/* working: a ring turns round the mark; a confirm waiting: a dot */}
        {running && <span aria-hidden className="pointer-events-none absolute -inset-1 animate-spin rounded-full border-2 border-transparent border-t-ink motion-reduce:animate-none" />}
        {!running && ready && (
          <StatusDot tone="warn" className="absolute top-0.5 right-0.5">
            <span className="sr-only">A confirm is waiting for you</span>
          </StatusDot>
        )}
      </button>
    </div>
  );
}

/* ── one conversation, drawn the same in the panel and on the page ─────────────── */

/** The agent's voice: the mark in a left gutter beside everything it says (AI-03). */
export function AgentSays({ full, children }: { full?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex gap-[var(--space-3)]">
      <span className="grid size-6 shrink-0 place-items-center text-label" aria-hidden>
        <EnableMark className={full ? "size-6" : "size-5"} />
      </span>
      <div className="min-w-0 flex-1 space-y-[var(--space-3)]">
        <span className="sr-only">Enable</span>
        {children}
      </div>
    </div>
  );
}

/** What an entry point was pressed on, quoted: where and when, then the card itself. */
function Opening({ o }: { o: AssistantOpening }) {
  return (
    <div className="space-y-[var(--space-2)]">
      <p className="type-meta">From {o.from} · {o.at}</p>
      <figure className="rounded-lg bg-sunken px-[var(--space-4)] py-[var(--space-3)]">
        <AreaDot area={o.area as Area | null}><span className="truncate type-meta">{o.label}</span></AreaDot>
        <p className="mt-[var(--space-1)] type-data-strong">{o.headline}</p>
        {o.evidence && <p className="mt-[var(--space-1)] type-meta">From {o.evidence}</p>}
      </figure>
    </div>
  );
}

export function ThreadView({ thread, density, inPanel, onAct, onCite }: {
  thread: AssistantThread;
  density: "compact" | "full";
  /** The panel: acts keep it open. The page: acts leave it closed. */
  inPanel: boolean;
  onAct: (a: Act) => void;
  /** Full density: a citation selects its source in the rail. */
  onCite?: (turn: number, n: number) => void;
}) {
  const { s, d } = useDemo();
  const full = density === "full";
  const turns = thread.turns;
  const last = turns[turns.length - 1];
  const since = sinceOf(thread, s);

  /* Returning to a conversation opens at its last turn; a new turn scrolls to its start. */
  const lastRef = React.useRef<HTMLLIElement>(null);
  const seen = React.useRef<{ id: string; n: number } | null>(null);
  React.useEffect(() => {
    const el = lastRef.current;
    if (!el) return;
    const prev = seen.current;
    seen.current = { id: thread.id, n: turns.length };
    el.scrollIntoView({ block: !prev || prev.id !== thread.id || prev.n !== turns.length ? "start" : "nearest" });
  }, [thread.id, turns.length, last?.task?.step]);

  /* New turns and steps are announced politely; reopening a conversation is not (AI-12). */
  const lastDef = last?.task ? defOf(last.task.id, s, last.path, last.task) : null;
  const say = last?.task && lastDef
    ? last.task.status === "ready" ? lastDef.ready : last.task.status === "running" ? lastDef.steps[last.task.step]?.[0] ?? "" : last.task.status === "done" ? lastDef.done : "Stopped."
    : last?.answer?.text[0] ?? "";
  const sig = `${thread.id}|${turns.length}|${last?.task?.step ?? ""}|${last?.task?.status ?? ""}`;
  const [announce, setAnnounce] = React.useState("");
  const heard = React.useRef(sig);
  React.useEffect(() => {
    const sameThread = heard.current.split("|")[0] === thread.id;
    if (heard.current !== sig && sameThread) setAnnounce(say);
    heard.current = sig;
  }, [sig, say, thread.id]);

  return (
    <div>
      <ol className={full ? "space-y-[var(--space-8)]" : "space-y-[var(--space-6)]"}>
        {turns.map((turn, i) => {
          const latest = i === turns.length - 1;
          const opening = i === 0 && thread.opening && !turn.said ? thread.opening : undefined;
          return (
            <li key={i} ref={latest ? lastRef : undefined} className="space-y-[var(--space-3)]">
              {turn.said && (
                <p className="ml-auto w-fit max-w-[85%] rounded-lg bg-interactive px-[var(--space-3)] py-[var(--space-2)] type-data">{turn.said}</p>
              )}
              {turn.chose && <p className="type-meta">You chose: {turn.chose}</p>}
              <AgentSays full={full}>
                {opening && <Opening o={opening} />}
                {turn.task ? (
                  <TaskView
                    def={defOf(turn.task.id, s, turn.path, turn.task)}
                    step={turn.task.step}
                    status={turn.task.status}
                    onConfirm={() => { defOf(turn.task!.id, s, turn.path, turn.task).commit(d, s, turn.path); d({ type: "taskEnd", thread: thread.id, index: i, status: "done" }); }}
                    onCancel={() => { defOf(turn.task!.id, s, turn.path, turn.task).abandon?.(d, s, turn.task!); d({ type: "taskEnd", thread: thread.id, index: i, status: "cancelled" }); }}
                  />
                ) : (
                  <AnswerView
                    a={turn.answer ?? answerFor(turn.q, contextFor(turn.path, s), s)}
                    density={density}
                    turn={i}
                    /* An answer's acts show on the latest turn only, and not once what it
                       rested on has changed: an earlier offer may no longer stand (a payment
                       since matched), and history is not a control panel. */
                    onAct={latest && !since ? onAct : undefined}
                    onReply={latest ? (words) => askAssistant(d, s, words, turn.path, false, { open: inPanel }) : undefined}
                    onCite={onCite}
                  />
                )}
              </AgentSays>
            </li>
          );
        })}
      </ol>
      {since && (
        <div className="mt-[var(--space-6)] space-y-[var(--space-2)] border-t border-hairline pt-[var(--space-3)]">
          <p className="type-meta">Since this was answered, {since}</p>
          <Button size="sm" variant="secondary" onClick={() => askAgain(d, s, thread, inPanel)}>Ask again with today’s sources</Button>
        </div>
      )}
      <p className="sr-only" aria-live="polite">{announce}</p>
    </div>
  );
}

/** A numbered source mark, the same in an answer, the panel's list and the page's rail. */
export function Mark({ n }: { n: number }) {
  return (
    <span className="inline-grid size-5 shrink-0 place-items-center rounded-full border border-hairline type-meta tnum text-label-secondary">
      {n}
    </span>
  );
}

const isSource = (x: string | AnswerSource): x is AnswerSource => typeof x !== "string";

/** The answer contract in a line: "2 sources · oldest 26 Aug · corroborated" (AI-05). */
function ContractLine({ c, count, full }: { c: AnswerContract; count: number; full: boolean }) {
  const bits = [
    count ? `${count} ${count === 1 ? "source" : "sources"}` : null,
    c.oldest ? `oldest ${c.oldest}` : null,
    c.corroborated && c.corroborated > 1 ? "corroborated" : null,
  ].filter(Boolean);
  const chip =
    c.status === "disagree" ? <Chip tone="warn">sources disagree</Chip>
    : c.status === "stale" ? <Chip tone="warn">may be out of date</Chip>
    : c.status === "web" ? <Chip tone="warn">from the open web</Chip>
    : c.status === "notice" ? <Chip tone="neutral">carries an open notice</Chip>
    /* In the reader's words: what was checked, not the name of the rule (FB-08). */
    : full ? <Chip tone="neutral">sources checked</Chip>
    : null;
  if (!chip && !bits.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-[var(--space-2)] gap-y-[var(--space-1)] pt-[var(--space-1)]">
      {chip}
      {bits.length > 0 && <span className="type-meta tnum">{bits.join(" · ")}</span>}
    </div>
  );
}

/** A refusal: the checks it failed (collapsed in the panel) and the way forward (AI-05). */
function Refusal({ c, full, actions, onAct }: { c: AnswerContract; full: boolean; actions?: Act[]; onAct?: (a: Act) => void }) {
  const [open, setOpen] = React.useState(full);
  const checks = c.checks ?? [];
  const failed = checks.filter((x) => !x.ok).length;
  return (
    <div className="space-y-[var(--space-4)] pt-[var(--space-1)]">
      {checks.length > 0 && (
        <div>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1 type-meta text-label-secondary hover:text-label"
          >
            {failed} of {checks.length} {checks.length === 1 ? "check" : "checks"} failed
            <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
          {open && (
            <>
              <ul className="mt-[var(--space-2)] divide-y divide-hairline">
                {checks.map((x) => (
                  <li key={x.clause} className="flex items-start justify-between gap-[var(--space-3)] py-[var(--space-2)]">
                    <span className="min-w-0">
                      <span className="block type-data">{x.clause}</span>
                      <span className="block type-meta">{x.note}</span>
                    </span>
                    <Chip tone={x.ok ? "neutral" : "crit"}>{x.ok ? "passed" : "failed"}</Chip>
                  </li>
                ))}
              </ul>
              {c.policy && <p className="mt-[var(--space-2)] type-meta">{c.policy}</p>}
              {!full && c.held && c.held.length > 0 && (
                <p className="mt-[var(--space-2)] type-meta">Held back: {c.held.map((h) => `${h.label}, ${h.age}`).join(" · ")}</p>
              )}
            </>
          )}
        </div>
      )}
      {actions && actions.length > 0 && onAct && (
        <div>
          <p className="type-meta text-label-tertiary">The way forward</p>
          <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-[var(--space-2)]">
            {actions.map((x, i) => (
              <Button key={x.label} size="sm" variant={i === 0 ? "secondary" : "tertiary"} onClick={() => onAct(x)}>{x.label}</Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** One answer at two densities (AI-05). Compact, in the panel: the opening line, the
    facts, the contract line and the numbered sources. Full, on the page: the opening in
    the serif, citations that select their source in the rail. */
export function AnswerView({ a, density, turn, onAct, onReply, onCite }: {
  a: Answer; density: "compact" | "full"; turn: number;
  onAct?: (x: Act) => void; onReply?: (words: string) => void; onCite?: (turn: number, n: number) => void;
}) {
  const full = density === "full";
  const numbered = (a.sources ?? []).filter(isSource);
  const named = (a.sources ?? []).filter((x): x is string => typeof x === "string");
  const refused = a.contract?.status === "refused";
  return (
    <div className="space-y-[var(--space-2)]" data-answer-turn={turn}>
      {a.text.map((para, j) => (
        /* the serif opens an answer (one with its contract); a note of what was done, or
           a question back, stays in the sans */
        <p key={j} className={full ? (j === 0 && a.contract ? "type-prose-lead" : "type-prose") : j === 0 && refused ? "type-data-strong" : "type-data"}>
          {para}
          {(a.cites?.[j] ?? []).map((n) => (full && onCite ? (
            <button
              key={n}
              type="button"
              onClick={() => onCite(turn, n)}
              aria-label={`Source ${n}`}
              className="ml-0.5 cursor-pointer align-super type-meta tnum text-label-secondary hover:text-label"
            >
              {n}
            </button>
          ) : (
            <sup key={n} className="ml-0.5 type-meta tnum text-label-secondary">{n}</sup>
          )))}
        </p>
      ))}
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
      {refused && a.contract ? (
        <Refusal c={a.contract} full={full} actions={a.actions} onAct={onAct} />
      ) : (
        a.contract && <ContractLine c={a.contract} count={numbered.length} full={full} />
      )}
      {!full && numbered.length > 0 && (
        <ol className="space-y-[var(--space-1)] pt-[var(--space-1)]" aria-label="Sources">
          {numbered.map((src) => (
            <li key={src.n} className="flex items-start gap-[var(--space-2)] type-meta">
              <Mark n={src.n} />
              <span className="min-w-0 pt-0.5">{src.label} · {src.detail}</span>
            </li>
          ))}
        </ol>
      )}
      {named.length > 0 && <p className="type-meta">From {named.join(" · ")}</p>}
      {!refused && onAct && a.actions && a.actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-[var(--space-2)] pt-[var(--space-1)]">
          {a.actions.map((x) => (
            <Button key={x.label} size="sm" variant="secondary" onClick={() => onAct(x)}>{x.label}</Button>
          ))}
        </div>
      )}
    </div>
  );
}

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

/* A task you watch: its steps arrive one by one, then it stops for you. */
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
                {doneStep && result && <span className="block type-meta">{result}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      {status === "ready" && (
        <div className="space-y-[var(--space-3)] rounded-lg bg-interactive p-[var(--space-3)]">
          <p className="type-data">{def.ready}</p>
          <div className="flex items-center gap-[var(--space-2)]">
            <Button size="sm" onClick={onConfirm}>{def.confirm}</Button>
            <Button size="sm" variant="tertiary" onClick={onCancel}>Not now</Button>
          </div>
        </div>
      )}
      {status === "done" && <p className="type-data"><Check className="mr-1 inline size-3.5" aria-hidden />{def.done}</p>}
      {status === "cancelled" && <p className="type-meta">Stopped. Nothing was changed.</p>}
    </div>
  );
}

/* ── the composer, with the page's subject as a chip you can take away (AI-07) ───── */

export function Composer({ id, inputRef, context, onAsk, large }: {
  id?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  context: PageContext | null;
  onAsk: (words: string, withContext: boolean) => void;
  large?: boolean;
}) {
  const [q, setQ] = React.useState("");
  const [dropped, setDropped] = React.useState<string | null>(null);
  const withContext = !!context && dropped !== context.path;
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!q.trim()) return; onAsk(q, withContext); setQ(""); }}>
      <label className={cn("field-pill flex items-center gap-[var(--space-2)] rounded-full bg-interactive pr-1.5 pl-[var(--space-3)]", large ? "h-12" : "h-10")}>
        {withContext && context && (
          <span className="inline-flex h-[var(--chip-h)] max-w-[45%] shrink-0 items-center gap-1 rounded-full border border-chip-edge bg-chip-rest pr-0.5 pl-2 type-meta text-label-secondary">
            <AreaDot area={context.area}><span className="truncate">{capital(context.label)}</span></AreaDot>
            <button
              type="button"
              onClick={() => setDropped(context.path)}
              aria-label={`Ask without ${context.label}`}
              title="Ask without this"
              className="grid size-4 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-interactive"
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        )}
        <input
          id={id}
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask Enable…"
          aria-label="Ask Enable"
          className="min-w-0 flex-1 bg-transparent type-data text-label outline-none placeholder:text-label-placeholder"
        />
        <IconChrome label="Ask Enable" type="submit" disabled={!q.trim()}>
          <ArrowUp aria-hidden />
        </IconChrome>
      </label>
    </form>
  );
}

export function Starters({ items, onPick, className }: { items: Starter[]; onPick: (x: Starter) => void; className?: string }) {
  return (
    <ul className={cn("space-y-[var(--space-1)]", className)} aria-label="Suggestions">
      {items.map((x) => (
        <li key={x.q}>
          <button
            type="button"
            onClick={() => onPick(x)}
            className="pressable w-full cursor-pointer rounded-md px-[var(--space-3)] py-[var(--space-2)] text-left type-data text-label hover:bg-interactive"
          >
            {x.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ── the panel: the conversation, compact, beside your work ──────────────────── */

export function AssistantCard() {
  const { s, d } = useDemo();
  const isDesktop = useIsDesktop();
  const close = () => d({ type: "assistant", open: false });
  if (isDesktop) {
    return (
      <aside
        data-inspector
        data-assistant
        aria-label="Ask Enable"
        className="inspector-in absolute top-[var(--space-1)] right-[var(--space-1)] bottom-[var(--space-1)] z-20 flex w-[400px] flex-col overflow-hidden rounded-lg bg-raised shadow-elev-3"
      >
        <PanelBody />
      </aside>
    );
  }
  /* Below 1024 the panel is a bottom sheet, as an inspector is (AI-11, 2026-09-28). */
  return (
    <Sheet open={s.assistantOpen} onOpenChange={(o) => { if (!o) close(); }}>
      <SheetContent side="bottom" showCloseButton={false} onOpenAutoFocus={(e) => e.preventDefault()} className="h-[85dvh] max-h-[85dvh] gap-0 p-0">
        <SheetTitle className="sr-only">Ask Enable</SheetTitle>
        <PanelBody />
      </SheetContent>
    </Sheet>
  );
}

function PanelBody() {
  const { s, d } = useDemo();
  const pathname = usePathname();
  const [writing, setWriting] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const thread = threadsFor(s).find((t) => t.id === s.assistantThread);
  const ctx = contextFor(pathname, s);
  const run = useRunAct({ inPanel: true, onSheet: () => setWriting(true) });

  /* Focus the composer only when you came by keyboard or an entry point (AI-12). */
  React.useEffect(() => { if (takeFocus()) input.current?.focus(); }, [s.assistantThread]);

  return (
    <>
      {/* The title is the conversation; on its line, to the right: the place it lives
          (Conversations, where it opens in full), a new one, close. One mark. */}
      <header className="flex shrink-0 items-center gap-[var(--space-1)] px-[var(--space-6)] pt-[var(--space-6)] pb-[var(--space-3)]">
        <EnableMark className="mr-[var(--space-1)] size-5 shrink-0" />
        <h2 className="line-clamp-2 min-w-0 flex-1 type-section" title={thread ? titleOf(thread.title, s) : undefined}>
          {thread ? titleOf(thread.title, s) : "Ask Enable"}
        </h2>
        {/* "Open ↗", as an inspector opens its item in full (VIS-096): here, in
            Conversations, the assistant at full size. */}
        <Link
          href={thread ? `/ask?c=${thread.id}` : "/ask"}
          aria-label="Open in Conversations"
          title="Open in Conversations"
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 type-meta text-label-secondary hover:bg-interactive hover:text-label"
        >
          Open <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
        <IconChrome label="New conversation" onClick={() => { d({ type: "thread", id: null }); input.current?.focus(); }}>
          <Plus aria-hidden />
        </IconChrome>
        <IconChrome label="Close" onClick={() => d({ type: "assistant", open: false })}>
          <X aria-hidden />
        </IconChrome>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-hairline px-[var(--space-6)] pt-[var(--space-4)] pb-[var(--space-4)]">
        {thread ? (
          <ThreadView thread={thread} density="compact" inPanel onAct={(a) => run(a, thread)} />
        ) : (
          <>
            <p className="type-data text-label-secondary">
              {ctx ? `Ask about ${ctx.label}, or anything the agency knows.` : "Ask about anything the agency knows."}
            </p>
            <Starters className="mt-[var(--space-3)] -mx-[var(--space-3)]" items={startersFor(s, pathname)} onPick={(x) => pickStarter(d, s, x, pathname)} />
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-hairline p-[var(--space-3)]">
        <Composer
          inputRef={input}
          context={ctx}
          onAsk={(words, withContext) => askAssistant(d, s, words, pathname, !thread, { context: withContext })}
        />
      </div>

      <AnnouncementSheet open={writing} onOpenChange={setWriting} />
    </>
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

  /* One visibility rule (COL-04, VIS-098, 2026-09-28): the owner finds only the
     travellers, and their trips, an advisor has shared with her; the unconfirmed
     candidate record is not a record for the advisor until the owner confirms it. */
  const recs = n ? products.filter((p) => recordVisible(s, p.id) && (norm(p.name).includes(n) || norm(p.city).includes(n))).slice(0, 6) : [];
  const people = n ? travellerCards.filter((t) => travellerVisible(s, t.name) && norm(t.name).includes(n)).slice(0, 4) : [];
  const theirTrips = n ? tripsFor(s).filter((t) => norm(t.title).includes(n) || norm(t.traveller).includes(n)).slice(0, 4) : [];
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
                  <CommandItem key={t.id} value={`i-${t.id}`} onSelect={() => go(`/itineraries/${t.id}`)}>
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
