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
  notices as seededNotices, orphanedPayments,
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
  /** Choices a person made and the product said it recorded (FB-07): kept a warning,
      said a notice is still true, discarded a suggestion. Who and when, so the record
      can be shown where the warning was. Keyed by what was decided, e.g.
      "keep:pref:grandin:hotel-verlaine" or "still-true:gm". */
  decisions: Record<string, Decision>;
  /** Payments the owner matched to a booking: payment id → what and why (COL-05). */
  payments: Record<string, { ref: string; reason: string; by: Persona; at: string }>;
}

export interface Decision { what: string; by: Persona; at: string }

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
  decisions: {},
  payments: {},
};

export type Action =
  | { type: "hydrate"; state: DemoState }
  | { type: "signIn"; role: Persona }
  | { type: "signOut" }
  | { type: "world"; world: World }
  | { type: "lab"; on?: boolean }
  | { type: "assistant"; open: boolean }
  /* A turn on the conversation in front (or a new one). `said` is what the person typed
     or tapped, word for word; `chose` an act they pressed; `q` the intent answered, never
     shown. `base` is a seeded conversation taking its first new turn this session;
     `about` and `opening` belong to a conversation an entry point starts (VIS-100). */
  | { type: "ask"; q: string; path: string; answer?: AssistantAnswer; title?: string; said?: string; chose?: string; about?: string; opening?: AssistantOpening; base?: AssistantThread; open?: boolean }
  | { type: "task"; task: TaskId; label: string; path: string; brief?: DraftBrief; base?: AssistantThread; open?: boolean }
  | { type: "taskStep"; thread: string; index: number; steps: number }
  | { type: "taskEnd"; thread: string; index: number; status: "done" | "cancelled" }
  /* The conversation in front. `open: false` changes it without drawing the panel (the
     Conversations page, which is the assistant at full size). */
  | { type: "thread"; id: string | null; open?: boolean }
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
  /* a choice, recorded with who and when; and its reversal */
  | { type: "decide"; id: string; what: string }
  | { type: "undecide"; id: string }
  | { type: "matchPaymentTo"; id: string; ref: string; reason: string }
  | { type: "unmatchPayment"; id: string }
  /* Undo (FB-09): put back the slices an act changed. The caller captures them before
     it acts, so any act can offer Undo without an inverse action of its own. */
  | { type: "patch"; patch: Partial<DemoState> }
  | { type: "reset" };

/* ── the assistant's conversations (VIS-100, 2026-09-28) ─────────────────────────
   One set of conversations for the panel and the Conversations page (AI-01): the
   seeded ones (src/components/assistant.tsx `seededThreads`) join these the first time
   they take a new turn. A turn keeps what the person said apart from what the
   assistant understood (AI-04), and an answer keeps its sources and the contract it
   was checked against (AI-05), so a conversation reread later is word for word. */
export type TaskId = "match-op1" | "draft-vo" | "shortlist-verlaine" | "ask-ideas" | "draft-trip";
export interface AssistantTurn {
  /** The intent answered: the words as read, or an entry point's subject ("why:<id>").
      Never shown to the person. */
  q: string;
  /** What the person typed, or the label of what they tapped, word for word. Absent when
      the assistant spoke first (an entry point) or an act began the turn. */
  said?: string;
  /** An act pressed on an earlier answer: shown as "You chose: …", never as a bubble. */
  chose?: string;
  path: string;
  /** When it was asked, "09:14". */
  at?: string;
  task?: { id: TaskId; step: number; status: "running" | "ready" | "done" | "cancelled"; brief?: DraftBrief };
  /** The answer as it was given. A conversation is a record: later changes to the model
      must not rewrite what was said (an answer about a payment that has since been
      matched still reads as it did). */
  answer?: AssistantAnswer;
}
/** A source an answer stands on, numbered as the answer cites it. */
export interface AnswerSource {
  n: number;
  label: string;
  detail: string;
  kind?: "portal" | "intranet" | "email" | "gdrive" | "manual" | "announcement" | "tripsuite" | "axus";
  /** The document it was quoted from (seed `sourceDocuments`), opened from the citation. */
  doc?: string;
  quote?: string;
}
/** The answer contract as it was checked when the answer was given. */
export interface AnswerContract {
  status: "met" | "refused" | "disagree" | "stale" | "notice";
  /** The oldest source's date, and how many sources confirm one another. */
  oldest?: string;
  corroborated?: number;
  /** The checks, each passed or failed: a refusal shows the ones it failed. */
  checks?: { clause: string; ok: boolean; note: string }[];
  policy?: string;
  /** Sources seen and held back from the answer. */
  held?: { label: string; detail: string; age: string }[];
}
export interface AssistantAnswer {
  text: string[];
  /** The sources each paragraph cites, by number. */
  cites?: number[][];
  facts?: [string, string][];
  sources?: (string | AnswerSource)[];
  contract?: AnswerContract;
  /** How the answer was built, stage by stage. */
  trace?: { stage: string; detail: string }[];
  /** What the answer rested on, as it stood then: reread later, a change shows as
      "Since this was answered: …" (AI-06). */
  basis?: { key: string; was: string };
  /** `done` is an act answered in place: the chat records the choice and what it did. */
  actions?: { label: string; href?: string; sheet?: "announcement" | "resolve"; task?: TaskId; brief?: DraftBrief; reply?: string; done?: string; remove?: string }[];
  /** A draft in conversation: the brief so far, and the question it waits on. */
  draft?: DraftBrief;
  /** Quick replies to the question asked: one group answers on a tap; several are
      chosen, then sent with `submit`. Typing answers too. */
  ask?: { groups: { name: string; options: string[] }[]; submit?: string };
}
/** What an entry point was pressed on, quoted at the top of the conversation it starts:
    where and when, and the card itself (its area, label, headline and evidence). */
export interface AssistantOpening {
  from: string;
  at: string;
  area: string | null;
  label: string;
  headline: string;
  evidence?: string;
  href?: string;
}
export interface AssistantThread {
  id: string; title: string; path: string; when: string; turns: AssistantTurn[];
  /** The subject an entry point started it about ("insight:<id>", "record:<id>"): the
      same entry point reopens it rather than starting another (AI-10). */
  about?: string;
  opening?: AssistantOpening;
  /** Whose conversation it is. A conversation is private to whoever asked. */
  by?: Persona;
}

const clock = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

/** A turn goes on the conversation in front, or starts one titled by its first words. A
    seeded conversation in front joins the store with its first new turn (`base`). */
function addTurn(
  s: DemoState, turn: AssistantTurn,
  opts: { title?: string; about?: string; opening?: AssistantOpening; base?: AssistantThread; open?: boolean } = {},
): DemoState {
  const at = turn.at ?? clock();
  const stamped = { ...turn, at };
  /* Asked on the Conversations page, the panel stays away (`open: false`). */
  const assistantOpen = opts.open ?? true;
  const cur = s.assistantThreads.find((t) => t.id === s.assistantThread);
  if (cur) {
    return { ...s, assistantOpen, assistantThreads: s.assistantThreads.map((t) => (t.id === cur.id ? { ...t, turns: [...t.turns, stamped] } : t)) };
  }
  if (opts.base && opts.base.id === s.assistantThread) {
    return { ...s, assistantOpen, assistantThreads: [{ ...opts.base, turns: [...opts.base.turns, stamped] }, ...s.assistantThreads] };
  }
  let n = s.assistantThreads.length + 1;
  while (s.assistantThreads.some((t) => t.id === `c${n}`)) n++;
  const id = `c${n}`;
  return {
    ...s, assistantOpen, assistantThread: id,
    assistantThreads: [{
      id, title: opts.title ?? turn.said ?? turn.chose ?? turn.q, path: turn.path, when: `Today ${at}`, turns: [stamped],
      about: opts.about, opening: opts.opening, by: s.role,
    }, ...s.assistantThreads],
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
    case "ask": return addTurn(s, { q: a.q, said: a.said, chose: a.chose, path: a.path, answer: a.answer }, { title: a.title, about: a.about, opening: a.opening, base: a.base, open: a.open });
    /* A task is begun by an act, so it is recorded as the choice, not as words said. */
    case "task": return addTurn(s, { q: a.label, chose: a.label, path: a.path, task: { id: a.task, step: 0, status: "running", brief: a.brief } }, { title: a.label, base: a.base, open: a.open });
    case "taskStep": return mapTurn(s, a.thread, a.index, (t) => t.task ? {
      ...t, task: { ...t.task, step: t.task.step + 1, status: t.task.step + 1 >= a.steps ? "ready" : "running" },
    } : t);
    case "taskEnd": return mapTurn(s, a.thread, a.index, (t) => t.task ? { ...t, task: { ...t.task, status: a.status } } : t);
    case "thread": return { ...s, assistantOpen: a.open ?? true, assistantThread: a.id };
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
    case "decide": return { ...s, decisions: { ...s.decisions, [a.id]: { what: a.what, by: s.role, at: stamp() } } };
    case "undecide": { const next = { ...s.decisions }; delete next[a.id]; return { ...s, decisions: next }; }
    case "matchPaymentTo": return {
      ...s,
      payments: { ...s.payments, [a.id]: { ref: a.ref, reason: a.reason, by: s.role, at: stamp() } },
      paymentMatched: s.paymentMatched || a.id === "op1",
    };
    case "unmatchPayment": {
      const next = { ...s.payments };
      delete next[a.id];
      return { ...s, payments: next, paymentMatched: a.id === "op1" ? false : s.paymentMatched };
    }
    case "patch": return { ...s, ...a.patch };
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

/** Everything in this person's inbox: the seeded day, and what happened since. Money
    items are absent, not masked, without the entitlement, so the badge, the Briefing and
    the inbox count the same things. */
export function inboxFor(s: DemoState): Notification[] {
  const money = canViewCommissions(s);
  return [...liveNotifications(s).filter((n) => n.roles.includes(s.role)), ...notificationsFor(s.role)]
    .filter((n) => money || !(n.tag === "Commissions" || /commission/i.test(n.headline)));
}

/* ── a notification closes when its subject is dealt with (FB-03, VIS-097) ──────
   An item in the inbox is about something: a rate, a commission, a record waiting to
   be confirmed. When the act on that subject happens anywhere in the product, the
   item is resolved there too, and says how. Nobody clears the same work twice, and
   the badge never counts finished work. A person still resolved it (DEC-03): the
   resolution names the act, and the act carries who and when. Opening an item marks
   it seen (the Notifications page does that); Mark actioned and Defer remain for what
   has no act of its own. */
export interface InboxState { state: NoticeState; resolved?: string }

/** Whether a product is still on a trip: shortlisted and not taken off, or a live line. */
export function onTrip(s: DemoState, tripId: string, productId: string): boolean {
  const trip = allTrips(s).find((t) => t.id === tripId);
  const listed = Boolean(trip?.shortlist?.includes(productId)) && !(s.shortlistOff[tripId] ?? []).includes(productId);
  const lined = s.tripLines.some((l) => l.tripId === tripId && l.productId === productId && l.status !== "cancelled" && l.status !== "declined");
  return listed || lined;
}

function resolvedBySubject(s: DemoState, id: string): string | null {
  switch (id) {
    case "n-conflict": return s.conflictResolved ? `Resolved on the record${s.conflictChoice ? ` · ${s.conflictChoice}` : ""}` : null;
    case "n-overdue": return s.reminder === "sent" ? `Reminder sent by ${personName[s.reminderBy ?? s.role]}` : null;
    case "n-candidate": return s.candidateConfirmed ? "Record confirmed" : null;
    case "n-duplicate": return s.decisions["review:leandre-dup"] ? `Decided · ${s.decisions["review:leandre-dup"].what}` : null;
    case "n-payment": return orphanedPayments.every((p) => s.payments[p.id]) ? "Both payments matched" : null;
    case "n-verlaine": return allTrips(s).some((t) => onTrip(s, t.id, "hotel-verlaine")) ? null : "Taken off the trip";
    /* L. Grandin's taste conflict with Verlaine: closed by taking it off, or by keeping it. */
    case "n-pref": return !onTrip(s, "paris-anniversary", "hotel-verlaine")
      ? "Taken off the trip"
      : s.decisions["keep:pref:grandin:hotel-verlaine"] ? "Kept despite the preference" : null;
    case "n-publish": return publishQueue.every((q) => s.released[q.id]) ? "Every item published or returned" : null;
    case "n-notice-stale": return ["spa", "gm"].every((n) => s.retired[n] || s.decisions[`still-true:${n}`]) ? "Both notices reviewed" : null;
    default: return null;
  }
}

export function inboxState(s: DemoState, n: Notification): InboxState {
  const resolved = resolvedBySubject(s, n.id);
  if (resolved) return { state: "actioned", resolved };
  return { state: s.notices[n.id] ?? n.defaultState };
}

const SEVERITY_ORDER: Record<Notification["severity"], number> = { Critical: 0, Important: 1, Info: 2 };

/** What waits on this person, most severe first, then in the inbox's own order (FB-04).
    The Briefing's insight card and the Notifications inbox rank by this one order. */
export function needsYou(s: DemoState): Notification[] {
  return inboxFor(s)
    .map((n, i) => ({ n, i, st: inboxState(s, n).state }))
    .filter((x) => x.st === "new" || x.st === "seen")
    .sort((a, b) => SEVERITY_ORDER[a.n.severity] - SEVERITY_ORDER[b.n.severity] || a.i - b.i)
    .map((x) => x.n);
}

/** Unseen items waiting on this person: the dock's count, and whether one is Critical. */
export function unseenCount(s: DemoState): { count: number; critical: boolean } {
  const unseen = inboxFor(s).filter((n) => inboxState(s, n).state === "new");
  return { count: unseen.length, critical: unseen.some((n) => n.severity === "Critical") };
}

/* ── who sees which trips and travellers: one rule (COL-04, VIS-098) ─────────────
   A traveller, and every trip of theirs, belongs to the advisor who holds them. The
   owner sees a traveller, and their trips, only once the advisor has shared that
   traveller with her; otherwise they are absent, not locked, everywhere: Itineraries,
   Travellers, the Briefing, search. */
export function sharedWithOwner(s: DemoState, travellerName: string): boolean {
  if (travellerCards.some((t) => t.name === travellerName && t.shared === people.owner)) return true;
  if (travellerName === "S. Marchetti") return s.shareTier !== "private";
  return s.createdTravellers.some((t) => t.name === travellerName && (t.by === "owner" || t.share !== "private"));
}

export function tripsFor(s: DemoState): Trip[] {
  const trips = allTrips(s);
  /* A traveller shared at name and contact only (Collaborator Basic) shares no trips. */
  const basic = (name: string) => name === "S. Marchetti" && s.shareTier === "basic";
  return s.role === "user" ? trips : trips.filter((t) => sharedWithOwner(s, t.traveller) && !basic(t.traveller));
}

/* ── one notice gate (COL-03, FB-01, VIS-099) ───────────────────────────────────
   A notice on a property decides what may be done with it, the same way on every
   surface: the record, the trip, the add sheet, the traveller page.
     Critical   a blocker: the property cannot be added to a trip or asked for, and
                where it already sits on a trip the one act is to take it off. Nobody
                is asked to acknowledge it: the product offers no way past it.
     Important  a warning on the property, beside it wherever it is chosen.
     Info       context: a neutral line on the record.
   A retired notice gates nothing. */
export type NoticeGate = { level: "block" | "warn" | "info"; notice: Notice } | null;

export function noticeGate(s: DemoState, productId: string): NoticeGate {
  const live: Notice[] = [
    ...seededNotices.filter((n) => n.productId === productId && n.scope !== "personal"),
    ...createdNoticesOn(s, productId).filter((n) => !n.waiting),
  ].filter((n) => !s.retired[n.id] && !(n.id === "spa" && s.spaNoticeClosed));
  const worst = [...live].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])[0];
  if (!worst) return null;
  return { level: worst.severity === "Critical" ? "block" : worst.severity === "Important" ? "warn" : "info", notice: worst };
}
