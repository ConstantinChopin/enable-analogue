"use client";
/**
 * Demo state — persona, world (v1/v2), presenter layer, and the seeded day's mutations.
 * Deterministic; reset returns to the opening state (presenter key 0).
 */
import React, { createContext, useContext, useReducer } from "react";
import type { Persona, World } from "@/data/seed";

export interface DemoState {
  persona: Persona;
  world: World;
  narration: boolean; // presenter overlay (key N)
  conflictResolved: boolean; // commission conflict → 12% kept at agency layer
  reminder: "idle" | "draft" | "sent";
  spaNoticeClosed: boolean;
  verlaineAcked: boolean; // Critical acknowledgment
  candidateConfirmed: boolean;
  shareTier: "private" | "full" | "basic";
  requestFiled: boolean; // E-U5 pipeline request
  noteSaved: boolean;
  prefConfirmed: boolean; // kaiseki suggestion → preference
  askScope: string | null; // EP3/EP4 context carry
}

const initial: DemoState = {
  persona: "advisor",
  world: "v2",
  narration: false,
  conflictResolved: false,
  reminder: "idle",
  spaNoticeClosed: false,
  verlaineAcked: false,
  candidateConfirmed: false,
  shareTier: "private",
  requestFiled: false,
  noteSaved: false,
  prefConfirmed: false,
  askScope: null,
};

export type Action =
  | { type: "hydrate"; state: DemoState }
  | { type: "persona"; persona: Persona }
  | { type: "world"; world: World }
  | { type: "narration"; on?: boolean }
  | { type: "resolveConflict" }
  | { type: "reminder"; state: DemoState["reminder"] }
  | { type: "closeSpaNotice" }
  | { type: "ackVerlaine" }
  | { type: "confirmCandidate" }
  | { type: "share"; tier: DemoState["shareTier"] }
  | { type: "fileRequest" }
  | { type: "saveNote" }
  | { type: "confirmPref" }
  | { type: "askScope"; scope: string | null }
  | { type: "reset" };

function reducer(s: DemoState, a: Action): DemoState {
  switch (a.type) {
    case "hydrate": return a.state;
    case "persona": return { ...s, persona: a.persona };
    case "world": return { ...s, world: a.world };
    case "narration": return { ...s, narration: a.on ?? !s.narration };
    case "resolveConflict": return { ...s, conflictResolved: true };
    case "reminder": return { ...s, reminder: a.state };
    case "closeSpaNotice": return { ...s, spaNoticeClosed: true };
    case "ackVerlaine": return { ...s, verlaineAcked: true };
    case "confirmCandidate": return { ...s, candidateConfirmed: true };
    case "share": return { ...s, shareTier: a.tier };
    case "fileRequest": return { ...s, requestFiled: true };
    case "saveNote": return { ...s, noteSaved: true };
    case "confirmPref": return { ...s, prefConfirmed: true };
    case "askScope": return { ...s, askScope: a.scope };
    case "reset": return { ...initial, narration: s.narration };
  }
}

const Ctx = createContext<{ s: DemoState; d: React.Dispatch<Action> } | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [s, d] = useReducer(reducer, initial);
  const wroteOnce = React.useRef(false);
  // Survive an accidental hard reload mid-demo. Read-then-dispatch on mount; the write
  // effect skips its first run so StrictMode's double-effect can never persist `initial`
  // over a stored state before hydration settles.
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("enable-demo-state");
      if (raw) d({ type: "hydrate", state: { ...initial, ...JSON.parse(raw) } });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

/** Gate helper: commissions are absent (not masked) for the colleague persona. */
export function canViewCommissions(p: Persona) {
  return p !== "colleague";
}
