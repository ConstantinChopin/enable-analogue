"use client";
/**
 * Session + demo state.
 *
 * Two layers live here and they are deliberately separate:
 *  - session: who is signed in. Changing it is a sign-out/sign-in, not a toggle.
 *  - demo:    the presenter's affordances (build vintage, narration, checkpoints).
 *             These never render as product chrome; they are reached by keyboard,
 *             or set on the sign-in screen, which sits outside the product.
 */
import React, { createContext, useContext, useReducer } from "react";
import { personName } from "@/data/seed";
import type { Persona, World } from "@/data/seed";

export type NoticeState = "new" | "seen" | "actioned" | "deferred";

/* ── editing a record ───────────────────────────────────────────────────────────
   Every edit answers "who is this for" before it answers "what does it say".

   Scope is VISIBILITY; layer is where the value displays. The seed already draws the
   line this way — `note-team` is `layer: "personal"` described as "team scope" — so
   team is not a fourth layer, it is a wider audience for a value that still is not the
   agency's position. personal and team land in the personal layer; agency lands in the
   agency overlay. Canonical is never a choice: Enable publishes it, an agency writes
   above it, and the value underneath stays readable.                                */
export type EditScope = "personal" | "team" | "agency";

export interface FieldEdit {
  value: string;
  scope: EditScope;
  reason: string;
  by: Persona;
  /** Agency-wide, written by someone who cannot approve it, waits for review. */
  pending: boolean;
}

export interface DemoState {
  /* session */
  signedIn: boolean;
  role: Persona;

  /* presenter */
  world: World;
  narration: boolean;

  /* the seeded day's mutations */
  conflictResolved: boolean;
  /* Which value the advisor kept, and why. The screen exists to prove the advisor
     decides; recording only that a decision happened threw the decision away. */
  conflictChoice: string | null;
  conflictReason: string | null;
  reminder: "idle" | "draft" | "sent";
  spaNoticeClosed: boolean;
  verlaineAcked: boolean;
  candidateConfirmed: boolean;
  paymentMatched: boolean;
  shareTier: "private" | "full" | "basic";
  requestFiled: boolean;
  noteSaved: boolean;
  prefConfirmed: boolean;
  askScope: string | null;
  notices: Record<string, NoticeState>;
  /** Field key → the edit written over it, if any. */
  fieldEdits: Record<string, FieldEdit>;
}

const initial: DemoState = {
  signedIn: false,
  role: "advisor",
  world: "v2",
  narration: false,
  conflictResolved: false,
  conflictChoice: null,
  conflictReason: null,
  reminder: "idle",
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
};

export type Action =
  | { type: "hydrate"; state: DemoState }
  | { type: "signIn"; role: Persona }
  | { type: "signOut" }
  | { type: "world"; world: World }
  | { type: "narration"; on?: boolean }
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
  | { type: "reset" };

function reducer(s: DemoState, a: Action): DemoState {
  switch (a.type) {
    case "hydrate": return a.state;
    case "signIn": return { ...s, signedIn: true, role: a.role };
    case "signOut": return { ...initial, world: s.world, narration: s.narration };
    case "world": return { ...s, world: a.world };
    case "narration": return { ...s, narration: a.on ?? !s.narration };
    case "resolveConflict": return { ...s, conflictResolved: true, conflictChoice: a.choice, conflictReason: a.reason };
    case "reminder": return { ...s, reminder: a.state };
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
    case "reset": return { ...initial, signedIn: s.signedIn, role: s.role, world: s.world, narration: s.narration };
  }
}

/** The personas a `?demo=` link is allowed to name. */
const personas = ["advisor", "colleague", "lead", "ops"] as const;

const Ctx = createContext<{ s: DemoState; d: React.Dispatch<Action> } | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [s, d] = useReducer(reducer, initial);
  const wroteOnce = React.useRef(false);
  // Survive an accidental reload mid-demo. The write effect skips its first run so
  // StrictMode's double-invocation can never persist `initial` over a stored state.
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("enable-demo-state");
      if (raw) { d({ type: "hydrate", state: { ...initial, ...JSON.parse(raw) } }); return; }
      // A framed or deep-linked view has no session storage of its own — an iframe is a
      // separate origin, so nothing carries into it. `?demo=advisor` signs that view in
      // so a link can open straight onto a screen; the case study embeds the record this
      // way. A session that already exists always wins, so this can never overwrite one.
      const who = new URLSearchParams(window.location.search).get("demo");
      if (who && (personas as readonly string[]).includes(who)) {
        d({ type: "signIn", role: who as Persona });
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

/** Commission figures are absent — never masked — for roles without the entitlement. */
export function canViewCommissions(role: Persona) {
  return role !== "colleague";
}

/* ── who may write what ─────────────────────────────────────────────────────────
   One rule, and it is about blast radius rather than seniority: you may write
   directly to any audience you are already accountable to, and the agency's shared
   position takes a second pair of eyes.

     personal   anyone, directly      — it is your own record of the place
     team       anyone, directly      — your desk, and your desk can see who wrote it
     agency     lead and ops directly; everyone else proposes

   An advisor is not blocked from agency-wide change, which would push the work into
   email and lose the attribution entirely. They write it, it queues, a lead approves.
   The distinction that matters is not "may I" but "does it go live unreviewed", and
   the sheet says which of the two is about to happen before the button is pressed. */
export function scopeWrite(role: Persona, scope: EditScope): "direct" | "review" {
  if (scope === "agency" && role !== "lead" && role !== "ops") return "review";
  return "direct";
}

/** Who ends up seeing a value written at this scope. Shown before it is written. */
export function scopeAudience(scope: EditScope, role: Persona): string {
  if (scope === "personal") return `Only ${personName[role]}`;
  if (scope === "team") return "Paris desk · 6 advisors";
  return "Every advisor in the agency";
}

/* Scope is visibility; layer is where the value comes to rest. Team is a wider
   audience for a value that is still not the agency's position, so it shares the
   personal layer — the convention the seed already uses for the team note. */
export function layerForScope(scope: EditScope): "agency" | "personal" {
  return scope === "agency" ? "agency" : "personal";
}
