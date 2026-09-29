/**
 * The commission ledger as it stands this session (UX sweep COL-08, COL-12, VIS-096,
 * 2026-09-28). One place that answers "what state is this commission in now", read by
 * the ledger, the commission page and the owner's payment matching, so the three never
 * disagree:
 *
 *   paid     the seed says so, or a payment was matched to it this session (s.payments,
 *            or the assistant's older `paymentMatched` for op1). Matching money is what
 *            settles a commission; nobody marks one paid by hand.
 *   chased   the seed says so, or a reminder was sent this session. Villa Ortensia's
 *            reminder is the store's own (`reminder`); every other commission records
 *            its send as the decision "reminder:<id>", with who and when.
 *   overdue  past due and not chased. Chased is still overdue: both count as overdue in
 *            the figure line and the Overdue view, so the two always agree.
 *   due      not yet due.
 *
 * Not a route: co-located with the pages that read it, like connections/add-connection.
 */
import { sharedWithOwner, type DemoState } from "@/lib/store";
import {
  orphanedPayments, travellerCards, personName, type Commission, type Persona,
} from "@/data/seed";

export type LiveState = "overdue" | "chased" | "due" | "paid";

export const eur = (n: number) => `EUR ${n.toLocaleString("en-GB")}`;

type Payment = (typeof orphanedPayments)[number];
type Candidate = Payment["candidates"][number];

/** The candidate a payment was matched to, if it was. */
export function matchedCandidate(s: DemoState, p: Payment): Candidate | null {
  const m = s.payments[p.id];
  if (m) return p.candidates.find((c) => c.ref === m.ref) ?? null;
  /* The assistant's match (an older action) records only that op1 was matched; it
     matches the strong candidate, as its task says. */
  if (p.id === "op1" && s.paymentMatched) return p.candidates.find((c) => c.strength === "strong") ?? null;
  return null;
}

export interface Settlement { payment: Payment; at: string; by: Persona; reason: string }

/** The payment that settled this commission this session. */
export function settlementFor(s: DemoState, c: Commission): Settlement | null {
  for (const p of orphanedPayments) {
    const cand = matchedCandidate(s, p);
    if (cand?.commission !== c.id) continue;
    const m = s.payments[p.id];
    return { payment: p, at: m?.at ?? "", by: m?.by ?? "owner", reason: m?.reason ?? "Matched through the assistant." };
  }
  return null;
}

/** The reminder sent on this commission this session: who, and when ("28 Aug 10:14"). */
export function reminderSent(s: DemoState, c: Commission): { by: Persona; at: string } | null {
  const dec = s.decisions[`reminder:${c.id}`];
  if (dec) return { by: dec.by, at: dec.at };
  if (c.id === "vo" && s.reminder === "sent") return { by: s.reminderBy ?? s.role, at: "" };
  return null;
}

export function liveState(s: DemoState, c: Commission): LiveState {
  if (c.state === "paid" || settlementFor(s, c)) return "paid";
  if (c.state === "chased" || reminderSent(s, c)) return "chased";
  return c.state;
}

/** Past due and unpaid: overdue or chased. */
export const isLate = (st: LiveState) => st === "overdue" || st === "chased";

/** "28 Aug 10:14" → "10:14"; a stamp without a time says "today". */
export const timeOf = (at: string) => (/\d{1,2}:\d{2}$/.exec(at)?.[0] ?? "today");

/* ── one true order: overdue first (longest first), then by due date, then paid ── */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dayKey(d: string | undefined): number {
  const m = /^(\d{1,2}) (\w{3})/.exec(d ?? "");
  if (!m) return Number.POSITIVE_INFINITY;
  return MONTHS.indexOf(m[2]) * 31 + Number(m[1]);
}
/** The desk's today is 28 Aug; "this week" falls due before 12 Sep. A cancelled
    booking has no due date, so it sorts last. */
const dueKey = (c: Commission) => dayKey(c.dueDate === "this week" ? "30 Aug" : c.dueDate);

export function ledgerOrder(s: DemoState) {
  const band = (st: LiveState) => (isLate(st) ? 0 : st === "due" ? 1 : 2);
  return (a: Commission, b: Commission) => {
    const sa = liveState(s, a), sb = liveState(s, b);
    if (band(sa) !== band(sb)) return band(sa) - band(sb);
    if (isLate(sa)) return dueKey(a) - dueKey(b);
    if (sa === "due") return dueKey(a) - dueKey(b);
    /* paid: the most recent first, what was settled this session above all */
    const pa = settlementFor(s, a) ? Infinity : dayKey(a.paidDate);
    const pb = settlementFor(s, b) ? Infinity : dayKey(b.paidDate);
    return pb - pa;
  };
}

/** The traveller's page, where this reader may open it (VIS-098: the owner reaches a
    traveller only once the advisor has shared them). */
export function travellerHref(s: DemoState, name: string | undefined): string | null {
  if (!name) return null;
  const card = travellerCards.find((t) => t.name === name);
  if (!card) return null;
  if (s.role === "owner" && !sharedWithOwner(s, name)) return null;
  return `/travellers/${card.id}`;
}

/** "Sent · 10:14 · R. Devane". */
export const sentLine = (r: { by: Persona; at: string }) => `Sent · ${timeOf(r.at)} · ${personName[r.by]}`;
