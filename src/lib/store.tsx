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
import type { Persona, World } from "@/data/seed";

export type NoticeState = "new" | "seen" | "actioned" | "deferred";

export interface DemoState {
  /* session */
  signedIn: boolean;
  role: Persona;

  /* presenter */
  world: World;
  narration: boolean;

  /* the seeded day's mutations */
  conflictResolved: boolean;
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
}

const initial: DemoState = {
  signedIn: false,
  role: "advisor",
  world: "v2",
  narration: false,
  conflictResolved: false,
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
};

export type Action =
  | { type: "hydrate"; state: DemoState }
  | { type: "signIn"; role: Persona }
  | { type: "signOut" }
  | { type: "world"; world: World }
  | { type: "narration"; on?: boolean }
  | { type: "resolveConflict" }
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
  | { type: "reset" };

function reducer(s: DemoState, a: Action): DemoState {
  switch (a.type) {
    case "hydrate": return a.state;
    case "signIn": return { ...s, signedIn: true, role: a.role };
    case "signOut": return { ...initial, world: s.world, narration: s.narration };
    case "world": return { ...s, world: a.world };
    case "narration": return { ...s, narration: a.on ?? !s.narration };
    case "resolveConflict": return { ...s, conflictResolved: true };
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
    case "reset": return { ...initial, signedIn: s.signedIn, role: s.role, world: s.world, narration: s.narration };
  }
}

const Ctx = createContext<{ s: DemoState; d: React.Dispatch<Action> } | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [s, d] = useReducer(reducer, initial);
  const wroteOnce = React.useRef(false);
  // Survive an accidental reload mid-demo. The write effect skips its first run so
  // StrictMode's double-invocation can never persist `initial` over a stored state.
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("enable-demo-state");
      if (raw) d({ type: "hydrate", state: { ...initial, ...JSON.parse(raw) } });
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
