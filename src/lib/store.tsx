"use client";
/**
 * Session + demo state.
 *
 * Two layers live here and they are deliberately separate:
 *  - session: who is signed in. Changing it is a sign-out/sign-in, not a toggle.
 *  - demo:    the presenter's affordances (build vintage, checkpoints).
 *             These never render as product chrome; they are reached by keyboard,
 *             or set on the sign-in screen, which sits outside the product.
 *
 * Two sign-ins share one agency (docs/rebuild/05-two-roles.md). What the agency user
 * does is still there when the owner signs in — a proposed value waits for her, an
 * item shared with the whole agency sits in her queue — so signing out ends the
 * session and keeps the day. Key 0 is the reset.
 */
import React, { createContext, useContext, useReducer } from "react";
import {
  personName, personInitials, publishQueue, leandreFields, travellerCards, notificationsFor, people, announcements,
} from "@/data/seed";
import type { Persona, World, Notification, QueueItem, ProductCategory, Announcement, Notice } from "@/data/seed";
import { trips, type Trip } from "@/data/seed";

/** Every trip on this desk: the seeded ones, and those started by hand this session. */
export const allTrips = (s: Pick<DemoState, "createdTrips">): Trip[] => [...trips, ...s.createdTrips];
import { seedLines, replyFor, stamp, shortDate, type TripLine, type LineRequest, type DraftBrief } from "@/data/trip-lines";

export type NoticeState = "new" | "seen" | "actioned" | "deferred";

/* ── editing a record ───────────────────────────────────────────────────────────
   Every edit answers "who is this for" before it answers "what does it say".

   Scope is VISIBILITY; layer is where the value displays. personal and team land in
   the personal layer; agency lands in the agency overlay. Canonical is never a choice:
   Enable publishes it, an agency writes above it, and the value underneath stays
   readable.                                                                         */
export type EditScope = "personal" | "team" | "agency";

export interface FieldEdit {
  value: string;
  scope: EditScope;
  reason: string;
  by: Persona;
  /** Agency-wide, written by the user: waits for the owner. */
  pending: boolean;
  /** The owner sent it back. The value is not applied; the note is for its author. */
  returned?: { note: string };
}

/* ── making things, and sharing them ───────────────────────────────────────────
   Everything created starts private to whoever made it. It reaches a colleague or a
   team the moment it is shared; it reaches the whole agency only when the owner
   releases it from the publish queue. The owner's own agency-wide shares go out
   directly, since she is the one who would release them.                          */
export type ShareScope = "private" | "team" | "agency";

export interface CreatedRecord {
  id: string;
  name: string;
  category: ProductCategory;
  city: string;
  country: string;
  by: Persona;
  share: ShareScope;
}

export interface CreatedTraveller {
  id: string;
  name: string;
  email: string;
  /** What she already knows, attributed to her and dated today. */
  note?: string;
  by: Persona;
  share: ShareScope;
}

/* ── publishing to the team: a notice and an announcement ─────────────────────
   Both answer "who is this for" first and follow the one sharing rule. A notice is
   one fact on one record; an announcement is a dated message that links records.
   What the owner publishes, and what she releases, is an agency source: answers use
   it and cite it with its date (docs/rebuild/05-two-roles.md, 2026-09-24).       */
export interface CreatedNotice {
  id: string;
  productId: string;
  productName: string;
  text: string;
  severity: "Info" | "Important" | "Critical";
  scope: ShareScope;
  by: Persona;
}

export interface CreatedAnnouncement {
  id: string;
  title: string;
  body: string;
  links: string[];
  audience: "team" | "agency";
  by: Persona;
}

export interface DemoState {
  /* session */
  signedIn: boolean;
  role: Persona;

  /* presenter */
  world: World;
  /** The lab: the itinerary builder on trial (docs/rebuild/06-itinerary-builder.md), for
      this session. Entered at /lab or with L; the frame bar switches back to live. The
      assistant it first held went live on 2026-09-25. */
  lab: boolean;
  /** Whether the assistant's card is out. Closed until asked for: the
      button, ⌘J, the ⌘K hand-off, a "Why?" or a peek. */
  assistantOpen: boolean;
  /** The conversations, newest first, each with its turns and the page it began on (its
      context). A turn is a question with the answer it was given, or a task the
      assistant is performing. */
  assistantThreads: AssistantThread[];
  /** The conversation in front; null means the next question starts a new one. */
  assistantThread: string | null;
  /** Properties taken off a trip's shortlist this session: trip id → product ids. */
  shortlistOff: Record<string, string[]>;
  /** Every trip's lines (src/data/trip-lines.ts): the itinerary builder's state. What the
      live app derives from trips (a leg's state, a shortlist) reads these, so an act in
      the builder is true everywhere at once. */
  tripLines: TripLine[];
  /** Trips started by hand this session (the builder): Planning, private to whoever made them. */
  createdTrips: Trip[];

  /* the agency's entitlement for its user: whether R. Devane sees money. The owner
     always does. Set in the owner's settings. */
  commissionAccess: boolean;

  /* the seeded day's mutations */
  conflictResolved: boolean;
  conflictChoice: string | null;
  conflictReason: string | null;
  reminder: "idle" | "draft" | "sent";
  /** Who sent the reminder: the advisor on her booking, or the owner on any booking. */
  reminderBy: Persona | null;
  spaNoticeClosed: boolean;
  verlaineAcked: boolean;
  candidateConfirmed: boolean;
  paymentMatched: boolean;
  /** S. Marchetti's sharing with the owner. */
  shareTier: "private" | "full" | "basic";
  requestFiled: boolean;
  noteSaved: boolean;
  prefConfirmed: boolean;
  notices: Record<string, NoticeState>;
  /** Field key → the edit written over it, if any. */
  fieldEdits: Record<string, FieldEdit>;

  /* made by hand this session */
  createdRecords: CreatedRecord[];
  createdTravellers: CreatedTraveller[];
  createdNotices: CreatedNotice[];
  createdAnnouncements: CreatedAnnouncement[];
  /** Closed by hand this session: status toasts, and the Briefing's insight rail. */
  dismissed: Record<string, true>;
  /** Publish-queue item id → what the owner decided. */
  released: Record<string, { outcome: "published" | "returned"; note?: string }>;
  /** Notice id → who retired it and why. Nothing expires on a timer. */
  retired: Record<string, { by: Persona; reason: string }>;
  /** Requests to see a traveller, received by that traveller's advisor. */
  accessRequests: { travellerId: string; by: Persona }[];
  /** Document name → where its owner shared it this session. */
  docShares: Record<string, { scope: ShareScope; by: Persona }>;
}

const initial: DemoState = {
  signedIn: false,
  role: "user",
  world: "v2",
  lab: false,
  assistantOpen: false,
  assistantThreads: [],
  assistantThread: null,
  shortlistOff: {},
  tripLines: seedLines,
  createdTrips: [],
  commissionAccess: true,
  conflictResolved: false,
  conflictChoice: null,
  conflictReason: null,
  reminder: "idle",
  reminderBy: null,
  spaNoticeClosed: false,
  verlaineAcked: false,
  candidateConfirmed: false,
  paymentMatched: false,
  shareTier: "private",
  requestFiled: false,
  noteSaved: false,
  prefConfirmed: false,
  notices: {},
  fieldEdits: {},
  createdRecords: [],
  createdTravellers: [],
  createdNotices: [],
  createdAnnouncements: [],
  dismissed: {},
  released: {},
  retired: {},
  accessRequests: [],
  docShares: {},
};

export type Action =
  | { type: "hydrate"; state: DemoState }
  | { type: "signIn"; role: Persona }
  | { type: "signOut" }
  | { type: "world"; world: World }
  | { type: "lab"; on?: boolean }
  | { type: "assistant"; open: boolean }
  | { type: "ask"; q: string; path: string; answer?: AssistantAnswer; title?: string }
  | { type: "task"; task: TaskId; label: string; path: string; brief?: DraftBrief }
  | { type: "taskStep"; thread: string; index: number; steps: number }
  | { type: "taskEnd"; thread: string; index: number; status: "done" | "cancelled" }
  | { type: "thread"; id: string | null }
  | { type: "shortlistOff"; trip: string; product: string }
  /* the itinerary builder: a line is added, changed, asked about, answered, accepted */
  | { type: "tripCreate"; trip: Trip }
  | { type: "tripRemove"; id: string }
  | { type: "lineAdd"; line: TripLine }
  | { type: "lineRemove"; id: string }
  | { type: "lineSet"; id: string; patch: Partial<TripLine> }
  | { type: "lineSend"; id: string; request: LineRequest }
  | { type: "lineReply"; id: string; request: string }
  | { type: "lineAccept"; id: string; request: string }
  | { type: "commissionAccess"; on: boolean }
  | { type: "resolveConflict"; choice: string; reason: string }
  | { type: "reminder"; state: DemoState["reminder"] }
  | { type: "closeSpaNotice" }
  | { type: "ackVerlaine" }
  | { type: "confirmCandidate" }
  | { type: "matchPayment" }
  | { type: "share"; tier: DemoState["shareTier"] }
  | { type: "fileRequest" }
  | { type: "saveNote" }
  | { type: "confirmPref" }
  | { type: "notice"; id: string; state: NoticeState }
  | { type: "editField"; key: string; edit: FieldEdit }
  | { type: "revertField"; key: string }
  | { type: "reviewEdit"; key: string; outcome: "approved" | "returned"; note?: string }
  | { type: "createRecord"; record: CreatedRecord }
  | { type: "createTraveller"; traveller: CreatedTraveller }
  | { type: "createNotice"; notice: CreatedNotice }
  | { type: "createAnnouncement"; announcement: CreatedAnnouncement }
  | { type: "dismiss"; id: string }
  | { type: "restore"; id: string }
  | { type: "shareCreated"; kind: "record" | "traveller"; id: string; scope: ShareScope }
  | { type: "release"; id: string; outcome: "published" | "returned"; note?: string }
  | { type: "retireNotice"; id: string; reason: string }
  | { type: "requestAccess"; travellerId: string }
  | { type: "shareDocument"; name: string; scope: ShareScope }
  | { type: "reset" };

/* ── the assistant's conversations (the lab) ─────────────────────────────────── */
export type TaskId = "match-op1" | "draft-vo" | "shortlist-verlaine" | "ask-ideas" | "draft-trip";
export interface AssistantTurn {
  q: string;
  path: string;
  task?: { id: TaskId; step: number; status: "running" | "ready" | "done" | "cancelled"; brief?: DraftBrief };
  /** The answer as it was given. A conversation is a record: later changes to the model
      must not rewrite what was said (an answer about a payment that has since been
      matched still reads as it did). */
  answer?: AssistantAnswer;
}
export interface AssistantAnswer {
  text: string[];
  facts?: [string, string][];
  sources?: string[];
  actions?: { label: string; href?: string; sheet?: "announcement"; task?: TaskId; brief?: DraftBrief; reply?: string }[];
  /** A draft in conversation: the brief so far, and the question it waits on. */
  draft?: DraftBrief;
  /** Quick replies to the question asked: one group answers on a tap; several are
      chosen, then sent with `submit`. Typing answers too. */
  ask?: { groups: { name: string; options: string[] }[]; submit?: string };
}
export interface AssistantThread { id: string; title: string; path: string; when: string; turns: AssistantTurn[] }

/** A turn goes on the conversation in front, or starts one titled by its first words. */
function addTurn(s: DemoState, turn: AssistantTurn, title?: string): DemoState {
  const cur = s.assistantThreads.find((t) => t.id === s.assistantThread);
  if (cur) {
    return { ...s, assistantOpen: true, assistantThreads: s.assistantThreads.map((t) => (t.id === cur.id ? { ...t, turns: [...t.turns, turn] } : t)) };
  }
  const id = `c${s.assistantThreads.length + 1}`;
  return {
    ...s, assistantOpen: true, assistantThread: id,
    assistantThreads: [{ id, title: title ?? turn.q, path: turn.path, when: "Today", turns: [turn] }, ...s.assistantThreads],
  };
}
function mapTurn(s: DemoState, thread: string, index: number, f: (t: AssistantTurn) => AssistantTurn): DemoState {
  return {
    ...s,
    assistantThreads: s.assistantThreads.map((t) => (t.id === thread ? { ...t, turns: t.turns.map((x, i) => (i === index ? f(x) : x)) } : t)),
  };
}

function reducer(s: DemoState, a: Action): DemoState {
  switch (a.type) {
    case "hydrate": return a.state;
    case "signIn": return { ...s, signedIn: true, role: a.role };
    /* The session ends; the agency's day does not. */
    case "signOut": return { ...s, signedIn: false };
    case "world": return { ...s, world: a.world };
    case "lab": return { ...s, lab: a.on ?? !s.lab };
    case "assistant": return { ...s, assistantOpen: a.open };
    case "ask": return addTurn(s, { q: a.q, path: a.path, answer: a.answer }, a.title);
    case "task": return addTurn(s, { q: a.label, path: a.path, task: { id: a.task, step: 0, status: "running", brief: a.brief } });
    case "taskStep": return mapTurn(s, a.thread, a.index, (t) => t.task ? {
      ...t, task: { ...t.task, step: t.task.step + 1, status: t.task.step + 1 >= a.steps ? "ready" : "running" },
    } : t);
    case "taskEnd": return mapTurn(s, a.thread, a.index, (t) => t.task ? { ...t, task: { ...t.task, status: a.status } } : t);
    case "thread": return { ...s, assistantOpen: true, assistantThread: a.id };
    case "shortlistOff": return {
      ...s, shortlistOff: { ...s.shortlistOff, [a.trip]: [...(s.shortlistOff[a.trip] ?? []), a.product] },
      /* the shortlist is the trip's ideas: taking a property off takes its idea away */
      tripLines: s.tripLines.filter((l) => !(l.tripId === a.trip && l.productId === a.product && l.status === "idea")),
    };
    case "tripCreate": return s.createdTrips.some((t) => t.id === a.trip.id) ? s : { ...s, createdTrips: [...s.createdTrips, a.trip] };
    case "tripRemove": return { ...s, createdTrips: s.createdTrips.filter((t) => t.id !== a.id), tripLines: s.tripLines.filter((l) => l.tripId !== a.id) };
    case "lineAdd": return s.tripLines.some((l) => l.id === a.line.id) ? s : { ...s, tripLines: [...s.tripLines, a.line] };
    case "lineRemove": return { ...s, tripLines: s.tripLines.filter((l) => l.id !== a.id) };
    case "lineSet": return { ...s, tripLines: s.tripLines.map((l) => (l.id === a.id ? { ...l, ...a.patch } : l)) };
    case "lineSend": return {
      ...s,
      tripLines: s.tripLines.map((l) => (l.id !== a.id ? l : {
        ...l,
        /* an idea (or a refusal) becomes a question; a hold stays a hold while it is confirmed */
        status: l.status === "idea" || l.status === "declined" ? "requested" : l.status,
        requests: [...l.requests, a.request],
      })),
    };
    case "lineReply": return {
      ...s,
      tripLines: s.tripLines.map((l) => (l.id !== a.id ? l : {
        ...l,
        requests: l.requests.map((r) => {
          if (r.id !== a.request || r.reply) return r;
          const { subject, ...read } = replyFor(l, r.kind);
          return { ...r, reply: { at: stamp(), doc: subject, read } };
        }),
      })),
    };
    case "lineAccept": return {
      ...s,
      tripLines: s.tripLines.map((l) => {
        if (l.id !== a.id) return l;
        const r = l.requests.find((x) => x.id === a.request);
        if (!r?.reply) return l;
        const { read } = r.reply;
        const at = stamp();
        return {
          ...l,
          status: read.status,
          holdUntil: read.status === "held" ? read.until : undefined,
          confirmation: read.status === "confirmed" ? { ref: read.ref ?? "by reply", by: s.role, at: at.slice(0, 6), source: r.reply.doc } : l.confirmation,
          requests: l.requests.map((x) => (x.id === r.id ? { ...x, reply: { ...r.reply!, accepted: { by: s.role, at } } } : x)),
        };
      }),
    };
    case "commissionAccess": return { ...s, commissionAccess: a.on };
    case "resolveConflict": return { ...s, conflictResolved: true, conflictChoice: a.choice, conflictReason: a.reason };
    case "reminder": return { ...s, reminder: a.state, reminderBy: a.state === "sent" ? s.role : a.state === "idle" ? null : s.reminderBy };
    case "closeSpaNotice": return { ...s, spaNoticeClosed: true };
    case "ackVerlaine": return { ...s, verlaineAcked: true };
    case "confirmCandidate": return { ...s, candidateConfirmed: true };
    case "matchPayment": return { ...s, paymentMatched: true };
    case "share": return { ...s, shareTier: a.tier };
    case "fileRequest": return { ...s, requestFiled: true };
    case "saveNote": return { ...s, noteSaved: true };
    case "confirmPref": return { ...s, prefConfirmed: true };
    case "notice": return { ...s, notices: { ...s.notices, [a.id]: a.state } };
    case "editField": return { ...s, fieldEdits: { ...s.fieldEdits, [a.key]: a.edit } };
    case "revertField": {
      const next = { ...s.fieldEdits };
      delete next[a.key];
      return { ...s, fieldEdits: next };
    }
    case "reviewEdit": {
      const edit = s.fieldEdits[a.key];
      if (!edit) return s;
      const next: FieldEdit = a.outcome === "approved"
        ? { ...edit, pending: false, returned: undefined }
        : { ...edit, pending: false, returned: { note: a.note ?? "" } };
      return { ...s, fieldEdits: { ...s.fieldEdits, [a.key]: next } };
    }
    case "createRecord": return { ...s, createdRecords: [...s.createdRecords, a.record] };
    case "createTraveller": return { ...s, createdTravellers: [...s.createdTravellers, a.traveller] };
    case "createNotice": return { ...s, createdNotices: [...s.createdNotices, a.notice] };
    case "createAnnouncement": return { ...s, createdAnnouncements: [...s.createdAnnouncements, a.announcement] };
    case "dismiss": return { ...s, dismissed: { ...s.dismissed, [a.id]: true } };
    case "restore": { const rest = { ...s.dismissed }; delete rest[a.id]; return { ...s, dismissed: rest }; }
    case "shareCreated": {
      if (a.kind === "record") {
        return { ...s, createdRecords: s.createdRecords.map((r) => (r.id === a.id ? { ...r, share: a.scope } : r)) };
      }
      return { ...s, createdTravellers: s.createdTravellers.map((t) => (t.id === a.id ? { ...t, share: a.scope } : t)) };
    }
    case "release": return { ...s, released: { ...s.released, [a.id]: { outcome: a.outcome, note: a.note } } };
    case "retireNotice": return {
      ...s,
      retired: { ...s.retired, [a.id]: { by: s.role, reason: a.reason } },
      spaNoticeClosed: a.id === "spa" ? true : s.spaNoticeClosed,
    };
    case "shareDocument":
      return { ...s, docShares: { ...s.docShares, [a.name]: { scope: a.scope, by: s.role } } };
    case "requestAccess":
      if (s.accessRequests.some((r) => r.travellerId === a.travellerId && r.by === s.role)) return s;
      return { ...s, accessRequests: [...s.accessRequests, { travellerId: a.travellerId, by: s.role }] };
    case "reset": return { ...initial, signedIn: s.signedIn, role: s.role, world: s.world, lab: s.lab };
  }
}

/** The personas a `?demo=` link is allowed to name. */
const personas = ["user", "owner"] as const;

const Ctx = createContext<{ s: DemoState; d: React.Dispatch<Action> } | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [s, d] = useReducer(reducer, initial);
  const wroteOnce = React.useRef(false);
  // Survive an accidental reload mid-demo. The write effect skips its first run so
  // StrictMode's double-invocation can never persist `initial` over a stored state.
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("enable-demo-state");
      if (raw) {
        const stored = JSON.parse(raw);
        /* A session saved under the four-persona build names a role that no longer
           exists. Map it rather than hydrate a state no screen can render. */
        const legacy: Record<string, Persona> = { advisor: "user", colleague: "user", lead: "owner", ops: "owner" };
        if (stored && typeof stored.role === "string" && legacy[stored.role]) stored.role = legacy[stored.role];
        d({ type: "hydrate", state: { ...initial, ...stored } });
        return;
      }
      // A framed or deep-linked view has no session storage of its own. `?demo=user`
      // signs that view in so a link can open straight onto a screen; the case study
      // embeds the record this way. A session that already exists always wins.
      const who = new URLSearchParams(window.location.search).get("demo");
      const mapped = who === "advisor" ? "user" : who === "lead" ? "owner" : who;
      if (mapped && (personas as readonly string[]).includes(mapped)) {
        d({ type: "signIn", role: mapped as Persona });
      }
    } catch {}
  }, []);
  React.useEffect(() => {
    if (!wroteOnce.current) { wroteOnce.current = true; return; }
    try { sessionStorage.setItem("enable-demo-state", JSON.stringify(s)); } catch {}
  }, [s]);
  return <Ctx.Provider value={{ s, d }}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemo outside DemoProvider");
  return v;
}

/** Commission figures are absent — never masked — for a user the owner has not entitled. */
export function canViewCommissions(s: Pick<DemoState, "role" | "commissionAccess">) {
  return s.role === "owner" || s.commissionAccess;
}

/* ── who may write what ─────────────────────────────────────────────────────────
   You write directly to any audience you are already accountable to; the agency's
   shared position takes the owner's release.

     personal   anyone, directly
     team       anyone, directly
     agency     the owner directly; the user's waits for the owner                  */
export function scopeWrite(role: Persona, scope: EditScope): "direct" | "review" {
  return scope === "agency" && role !== "owner" ? "review" : "direct";
}

/** Who ends up seeing a value written at this scope. Shown before it is written. */
export function scopeAudience(scope: EditScope, role: Persona): string {
  if (scope === "personal") return `Only ${personName[role]}`;
  if (scope === "team") return "Paris desk · 6 advisors";
  return "Every advisor in the agency";
}

/* Scope is visibility; layer is where the value comes to rest. */
export function layerForScope(scope: EditScope): "agency" | "personal" {
  return scope === "agency" ? "agency" : "personal";
}

/* ── the publish queue, with what was shared this session ───────────────────── */
export function queueItems(s: DemoState): QueueItem[] {
  const shared: QueueItem[] = [
    ...s.createdRecords
      .filter((r) => r.share === "agency" && r.by === "user")
      .map((r): QueueItem => ({
        id: `rec-${r.id}`, kind: "record", by: personName[r.by], text: `${r.name} — added by hand`,
        preview: `${r.category} · ${r.city}, ${r.country}. Created by ${personName[r.by]} today, shared with the whole agency.`,
        action: "Publish to the whole agency",
      })),
    ...s.createdTravellers
      .filter((t) => t.share === "agency" && t.by === "user")
      .map((t): QueueItem => ({
        id: `trv-${t.id}`, kind: "traveller", by: personName[t.by], text: `${t.name} — traveller profile`,
        preview: `Added by hand by ${personName[t.by]} today, shared with the whole agency.`,
        action: "Publish to the whole agency",
      })),
    ...Object.entries(s.docShares)
      .filter(([, v]) => v.scope === "agency" && v.by === "user")
      .map(([name, v]): QueueItem => ({
        /* "shared-" marks what was shared this session; the seed's own items ("doc-pub",
           "spa-pub") must not read as live, or the owner is told about her morning twice. */
        id: `shared-doc-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, kind: "document", by: personName[v.by], text: name,
        preview: `${personName[v.by]}'s own document, shared with the whole agency today.`,
        action: "Publish to the whole agency",
      })),
    ...s.createdNotices
      .filter((n) => n.scope === "agency" && n.by === "user")
      .map((n): QueueItem => ({
        id: `ntc-${n.id}`, kind: "notice", by: personName[n.by], text: `${n.productName} — notice`,
        preview: `${n.severity} · ${n.text} Written by ${personName[n.by]} today, shared with the whole agency.`,
        action: "Publish to the whole agency",
      })),
    ...s.createdAnnouncements
      .filter((a) => a.audience === "agency" && a.by === "user")
      .map((a): QueueItem => ({
        id: `ann-${a.id}`, kind: "announcement", by: personName[a.by], text: a.title,
        preview: `${a.body} Links ${a.links.length} ${a.links.length === 1 ? "record" : "records"}.`,
        action: "Publish to the whole agency",
      })),
  ];
  return [...shared, ...publishQueue];
}

/* ── who a notice or an announcement has reached ───────────────────────────────
   Its author always. The team (the Paris desk: the user, not the owner) at once. The
   whole agency at once when the owner writes it, or when she releases a user's. */
function reaches(s: DemoState, by: Persona, scope: ShareScope, queueId: string): boolean {
  if (by === s.role) return true;
  if (scope === "team") return s.role === "user";
  if (scope === "agency") return by === "owner" || s.released[queueId]?.outcome === "published";
  return false;
}

/** Still in the owner's queue, as its author sees it. */
function waitingRelease(s: DemoState, by: Persona, scope: ShareScope, queueId: string) {
  return scope === "agency" && by === "user" && !s.released[queueId];
}

export type AnnouncementView = Announcement & { waiting: boolean };

/** Newest first: what was published this session, then the seeded ones. */
export function announcementsFor(s: DemoState): AnnouncementView[] {
  const made = s.createdAnnouncements
    .filter((a) => reaches(s, a.by, a.audience, `ann-${a.id}`) && s.released[`ann-${a.id}`]?.outcome !== "returned")
    .map((a): AnnouncementView => ({
      id: a.id, title: a.title, body: a.body, by: a.by, when: "Today", audience: a.audience, links: a.links,
      waiting: waitingRelease(s, a.by, a.audience, `ann-${a.id}`),
    }))
    .reverse();
  return [...made, ...announcements.map((a) => ({ ...a, waiting: false }))];
}

/** Notices written on a record this session that have reached this reader, shaped like the seed's. */
export function createdNoticesOn(s: DemoState, productId: string): (Notice & { waiting: boolean })[] {
  return s.createdNotices
    .filter((n) => n.productId === productId && reaches(s, n.by, n.scope, `ntc-${n.id}`))
    .map((n) => ({
      id: n.id, productId: n.productId, productName: n.productName, text: n.text, severity: n.severity,
      scope: n.scope === "private" ? "personal" : n.scope, owner: personInitials[n.by],
      openedAt: "Today", ageDays: 0,
      waiting: waitingRelease(s, n.by, n.scope, `ntc-${n.id}`),
    }));
}

/* ── notifications that exist because someone did something this session ───── */
function liveNotifications(s: DemoState): Notification[] {
  const out: Notification[] = [];

  for (const [key, edit] of Object.entries(s.fieldEdits)) {
    if (edit.by !== "user" || edit.scope !== "agency") continue;
    const label = leandreFields.find((f) => f.key === key)?.label ?? key;
    if (edit.pending) {
      out.push({
        id: `live-edit-${key}`, roles: ["owner"], tag: "Records", severity: "Important",
        headline: `${personName.user} proposed a new ${label.toLowerCase()} for Maison Léandre`,
        detail: `“${edit.value}”, for the whole agency. Reason given: “${edit.reason}”. The record answers with its current value until you approve.`,
        subject: { label: "Maison Léandre", href: "/records/maison-leandre" },
        generatedBy: "Agency-wide edit", when: "Just now",
        action: { label: "Review on the record", href: `/records/maison-leandre?review=${key}` },
        defaultState: "new",
      });
    } else if (edit.returned) {
      out.push({
        id: `live-edit-returned-${key}`, roles: ["user"], tag: "Records", severity: "Info",
        headline: `${people.owner} returned your ${label.toLowerCase()} for Maison Léandre`,
        detail: edit.returned.note ? `Her note: “${edit.returned.note}”` : "Returned without a note.",
        subject: { label: "Maison Léandre", href: "/records/maison-leandre" },
        generatedBy: "Agency-wide edit", when: "Just now",
        action: { label: "Open the record", href: "/records/maison-leandre" },
        defaultState: "new",
      });
    }
  }

  for (const item of queueItems(s)) {
    const decided = s.released[item.id];
    /* Everything in the queue was shared by R. Devane, the seeded items included, so a
       return always has her to go back to. Only what was shared this session raises
       the owner's "waiting" notification; the seeded items are her morning already. */
    const live = ["rec-", "trv-", "shared-doc-", "ntc-", "ann-"].some((p) => item.id.startsWith(p));
    if (!decided && live) {
      const what = { record: "a new record", document: "a document", traveller: "a traveller profile", notice: "a notice", announcement: "an announcement" } as Record<string, string>;
      out.push({
        id: `live-queue-${item.id}`, roles: ["owner"], tag: "Knowledge", severity: "Info",
        headline: `${item.by} shared ${what[item.kind] ?? "something"} with the whole agency`,
        detail: item.text, subject: null, generatedBy: "Shared with the whole agency", when: "Just now",
        action: { label: "Open the publish queue", href: "/admin/publish" }, defaultState: "new",
      });
    } else if (decided?.outcome === "returned") {
      out.push({
        id: `live-queue-returned-${item.id}`, roles: ["user"], tag: "Knowledge", severity: "Info",
        headline: `${people.owner} returned “${item.text}”`,
        detail: decided.note ? `Her note: “${decided.note}”` : "Returned without a note. It stays shared with the people you chose.",
        subject: null, generatedBy: "Publish queue", when: "Just now", defaultState: "new",
      });
    }
  }

  /* What the owner published directly reaches the desk as it goes out. */
  for (const a of s.createdAnnouncements) {
    if (a.by !== "owner") continue;
    out.push({
      id: `live-ann-${a.id}`, roles: ["user"], tag: "Knowledge", severity: "Info",
      headline: `${personName.owner} announced “${a.title}”`,
      detail: `${a.body.split(". ")[0].replace(/\.$/, "")}. Answers may cite it, with its date.`,
      subject: null, generatedBy: "Announcement", when: "Just now",
      action: { label: "Read the announcement", href: `/knowledge?source=Announcements&doc=${a.id}` }, defaultState: "new",
    });
  }
  for (const n of s.createdNotices) {
    if (n.by !== "owner" || n.scope === "private") continue;
    out.push({
      id: `live-ntc-${n.id}`, roles: ["user"], tag: "Records", severity: n.severity,
      headline: `${n.severity} notice on ${n.productName}`,
      detail: n.text, subject: { label: n.productName, href: `/records/${n.productId}` },
      generatedBy: "Notice", when: "Just now",
      action: { label: "Open the record", href: `/records/${n.productId}` }, defaultState: "new",
    });
  }

  /* A supplier answered: what the reply was read to say waits for the advisor. It is a
     candidate until she accepts it, as a record is until someone confirms it. */
  for (const l of s.tripLines) {
    const trip = allTrips(s).find((t) => t.id === l.tripId);
    for (const r of l.requests) {
      if (!r.reply || !trip || r.sentOn < "2026-08-28") continue;
      const { read } = r.reply;
      const said = read.status === "held" ? `held until ${read.until ? shortDate(read.until) : "further notice"}` : read.status === "confirmed" ? `confirmed${read.ref ? `, ref ${read.ref}` : ""}` : "declined";
      const who = l.supplier?.name ?? l.what.split(",")[0];
      out.push({
        id: `live-reply-${r.id}`, roles: [r.by], tag: "Traveller", severity: read.status === "declined" ? "Important" : "Info",
        headline: `${who} replied: ${said}`,
        detail: `${l.what}, ${trip.title}. ${read.note ?? "Read from the reply."} It stays as it was until you accept what they said.`,
        subject: { label: trip.title, href: `/itineraries/${trip.id}?line=${l.id}` },
        generatedBy: "Supplier reply", when: r.reply.at,
        action: { label: "Open the line", href: `/itineraries/${trip.id}?line=${l.id}` },
        defaultState: r.reply.accepted ? "actioned" : "new",
      });
    }
  }

  for (const r of s.accessRequests) {
    const t = travellerCards.find((c) => c.id === r.travellerId);
    if (!t || r.by !== "owner") continue;
    out.push({
      id: `live-access-${r.travellerId}`, roles: ["user"], tag: "Traveller", severity: "Info",
      headline: `${personName.owner} asked to see ${t.name}`,
      detail: "Nothing is shared until you share it. The request grants nothing by itself.",
      subject: { label: t.name, href: `/travellers/${t.id}` },
      generatedBy: "Access request", when: "Just now",
      action: { label: "Open the traveller", href: `/travellers/${t.id}` }, defaultState: "new",
    });
  }

  return out;
}

/** Everything in this person's inbox: the seeded day, and what happened since. */
export function inboxFor(s: DemoState): Notification[] {
  return [...liveNotifications(s).filter((n) => n.roles.includes(s.role)), ...notificationsFor(s.role)];
}
