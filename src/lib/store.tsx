"use client";
/**
 * Session + demo state.
 *
 * Two layers live here and they are deliberately separate:
 *  - session: who is signed in. Changing it is a sign-out/sign-in, not a toggle.
 *  - demo:    the presenter's affordances (build vintage, narration, checkpoints).
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
  personName, publishQueue, leandreFields, travellerCards, notificationsFor, people,
} from "@/data/seed";
import type { Persona, World, Notification, QueueItem, ProductCategory } from "@/data/seed";

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

export interface DemoState {
  /* session */
  signedIn: boolean;
  role: Persona;

  /* presenter */
  world: World;
  narration: boolean;

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
  askScope: string | null;
  notices: Record<string, NoticeState>;
  /** Field key → the edit written over it, if any. */
  fieldEdits: Record<string, FieldEdit>;

  /* made by hand this session */
  createdRecords: CreatedRecord[];
  createdTravellers: CreatedTraveller[];
  /** Publish-queue item id → what the owner decided. */
  released: Record<string, { outcome: "published" | "returned"; note?: string }>;
  /** Notice id → who retired it and why. Nothing expires on a timer. */
  retired: Record<string, { by: Persona; reason: string }>;
  /** Requests to see a traveller, received by that traveller's advisor. */
  accessRequests: { travellerId: string; by: Persona }[];
}

const initial: DemoState = {
  signedIn: false,
  role: "user",
  world: "v2",
  narration: false,
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
  askScope: null,
  notices: {},
  fieldEdits: {},
  createdRecords: [],
  createdTravellers: [],
  released: {},
  retired: {},
  accessRequests: [],
};

export type Action =
  | { type: "hydrate"; state: DemoState }
  | { type: "signIn"; role: Persona }
  | { type: "signOut" }
  | { type: "world"; world: World }
  | { type: "narration"; on?: boolean }
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
  | { type: "askScope"; scope: string | null }
  | { type: "notice"; id: string; state: NoticeState }
  | { type: "editField"; key: string; edit: FieldEdit }
  | { type: "revertField"; key: string }
  | { type: "reviewEdit"; key: string; outcome: "approved" | "returned"; note?: string }
  | { type: "createRecord"; record: CreatedRecord }
  | { type: "createTraveller"; traveller: CreatedTraveller }
  | { type: "shareCreated"; kind: "record" | "traveller"; id: string; scope: ShareScope }
  | { type: "release"; id: string; outcome: "published" | "returned"; note?: string }
  | { type: "retireNotice"; id: string; reason: string }
  | { type: "requestAccess"; travellerId: string }
  | { type: "reset" };

function reducer(s: DemoState, a: Action): DemoState {
  switch (a.type) {
    case "hydrate": return a.state;
    case "signIn": return { ...s, signedIn: true, role: a.role };
    /* The session ends; the agency's day does not. */
    case "signOut": return { ...s, signedIn: false };
    case "world": return { ...s, world: a.world };
    case "narration": return { ...s, narration: a.on ?? !s.narration };
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
    case "askScope": return { ...s, askScope: a.scope };
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
    case "requestAccess":
      if (s.accessRequests.some((r) => r.travellerId === a.travellerId && r.by === s.role)) return s;
      return { ...s, accessRequests: [...s.accessRequests, { travellerId: a.travellerId, by: s.role }] };
    case "reset": return { ...initial, signedIn: s.signedIn, role: s.role, world: s.world, narration: s.narration };
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
  ];
  return [...shared, ...publishQueue];
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
    if (!item.id.startsWith("rec-") && !item.id.startsWith("trv-")) continue;
    if (!decided) {
      out.push({
        id: `live-queue-${item.id}`, roles: ["owner"], tag: "Knowledge", severity: "Info",
        headline: `${item.by} shared ${item.kind === "record" ? "a new record" : "a traveller profile"} with the whole agency`,
        detail: item.text, subject: null, generatedBy: "Shared with the whole agency", when: "Just now",
        action: { label: "Open the publish queue", href: "/admin/publish" }, defaultState: "new",
      });
    } else if (decided.outcome === "returned") {
      out.push({
        id: `live-queue-returned-${item.id}`, roles: ["user"], tag: "Knowledge", severity: "Info",
        headline: `${people.owner} returned “${item.text}”`,
        detail: decided.note ? `Her note: “${decided.note}”` : "Returned without a note. It stays shared with the people you chose.",
        subject: null, generatedBy: "Publish queue", when: "Just now", defaultState: "new",
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
