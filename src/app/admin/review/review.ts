/**
 * The confirmation queue's decisions, read by the queue and by a candidate's page so
 * the two agree (UX sweep COL-05, 2026-09-28). A candidate leaves the queue when it is
 * decided: confirmed, kept as a separate record, merged, or rejected. Each decision is
 * the store's `decide` under "review:<id>", so it carries who and when, and Undo takes
 * back that one key. Hotel Sereno Kyoto's confirmation is also the store's older flag
 * (`candidateConfirmed`), which the inbox reads to resolve its notification.
 *
 * Not a route: co-located with the pages that read it.
 */
import type { Dispatch } from "react";
import type { Action, DemoState } from "@/lib/store";
import { candidates, personName } from "@/data/seed";

export type Candidate = (typeof candidates)[number];
type Field = Candidate["fields"][number];

export const isHeldField = (f: Field) => "held" in f && !!f.held;
export const isTemplate = (f: Field) => "template" in f && !!f.template;
/** Fields a person can confirm as read: neither held nor template copy. */
export const readyFields = (c: Candidate) => c.fields.filter((f) => !isHeldField(f) && !isTemplate(f));
/** "Rate, commission, programme and description": field names in a sentence. */
export function fieldList(labels: string[]) {
  const words = labels.map((l, i) => (i === 0 ? l : l.toLowerCase()));
  return words.length > 1 ? `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}` : words[0] ?? "";
}

/** Fields that stay out of answers when the record is confirmed. */
export const heldFields = (c: Candidate) => c.fields.filter((f) => isHeldField(f) || isTemplate(f));

export interface ReviewOutcome { what: string; by: string; at: string }

export function outcomeOf(s: DemoState, id: string): ReviewOutcome | null {
  const dec = s.decisions[`review:${id}`];
  if (dec) return { what: dec.what, by: personName[dec.by], at: dec.at };
  if (id === "sereno" && s.candidateConfirmed) return { what: "Confirmed", by: personName.owner, at: "" };
  return null;
}

/** "Confirmed · 10:14 · M. Keller". */
export function outcomeLine(o: ReviewOutcome) {
  const time = /\d{1,2}:\d{2}$/.exec(o.at)?.[0];
  return [o.what.split(":")[0], time, o.by].filter(Boolean).join(" · ");
}

/** The next candidate nobody has decided, after this one. */
export const nextCandidate = (s: DemoState, from: string) =>
  candidates.find((c) => c.id !== from && !outcomeOf(s, c.id));

/** Record a decision on a candidate. Confirming Sereno also sets the store's flag. */
export function decideCandidate(d: Dispatch<Action>, id: string, what: string) {
  if (id === "sereno" && what === "Confirmed") d({ type: "confirmCandidate" });
  d({ type: "decide", id: `review:${id}`, what });
}

/** Undo one decision: that key only, so a later decision is not undone with it. */
export function undoCandidate(d: Dispatch<Action>, id: string) {
  d({ type: "undecide", id: `review:${id}` });
  if (id === "sereno") d({ type: "patch", patch: { candidateConfirmed: false } });
}
