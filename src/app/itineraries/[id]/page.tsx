"use client";
/**
 * The trip — the itinerary builder (docs/rebuild/06-itinerary-builder.md).
 *
 * Job: get a trip to confirmed. A trip is its lines; a line is a fact with a status
 * (Idea · Asked · Held until … · Confirmed · Declined), and it becomes confirmed only
 * when a named person accepts what a supplier said. The page reads like the record page:
 *
 *   Where it stands   one sentence of what is settled and what is not, in the serif,
 *                     with the projected commission beneath it for those who see money
 *   The days          one chapter per date; a stay is drawn once, on its first day, and
 *                     each night after it carries a quiet "staying at" line, so a night
 *                     nobody sleeps anywhere shows as a gap in place
 *   The rail          the trip's checks (src/lib/trip-checks.ts), ranked, one at a time;
 *                     its action is the page's one primary
 *   The card          a selected line, in the floating card: the record it books, the
 *                     programme it is booked under and what that gives, the notices and
 *                     tastes that argue with it, its requests and replies, and the one act
 *                     its state allows. The rail gives way to it: one card on the right.
 *
 * Nothing sends itself. A request is drafted from the line and the traveller, read,
 * edited and sent by the advisor; the reply lands in Forwarded mail, is read into a
 * status, a date and a reference, and waits until she accepts it.
 *
 * 2026-09-28 (UX sweep COL-01, NAV-02, FB-01, FB-02, NAV-09, COL-09, COL-10; VIS-096 to
 * VIS-101). This is the only trip view, in both modes: every "Open the trip" lands here.
 * In the lab the advisor builds the trip; outside it the page is read: the overview, the
 * day tabs, the lines, the checks, with the builder's controls drawn and marked
 * (`SchematicAction`), never live-looking and never the primary. What is not building
 * works in both: taking a closed property off the trip, keeping a line despite a taste,
 * and sharing the trip. The owner reads a trip whose traveller is shared with her and
 * acts on none of it (06 §7); a trip she may not see is absent (VIS-098).
 *
 * One attention item per line (VIS-099): a closed record is a Blocker whose one act is
 * "Take it off the trip" (destructive, with Undo, never the primary: NAV-09); a taste it
 * argues with is a Warning (Find another, Keep it; kept is recorded with who and when)
 * and is not said while the closure stands. The line, the tab and a pending act live in
 * the URL (`?line=`, `?day=`, `?act=` from the ledger's footer).
 */
import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, canViewCommissions, type DemoState } from "@/lib/store";
import { productById, products, personName, type Trip } from "@/data/seed";
import {
  linesOf, daysOf, dayLabel, shortDate, nightsOf, statusWord, termsFor, supplierOf, draftRequest, addDays,
  stamp, TODAY, type TripLine, type LineKind, type LineRequest,
} from "@/data/trip-lines";
import {
  tripChecks, tallyOf, projectedOf, blockOf, cautionOf, tasteClash, tasteKey, keptWords, incentiveOf, incentiveWords, offerOf,
  inCommissions, visibleTrips, takeOff, tripShareOf, tripShareKey, type Check,
} from "@/lib/trip-checks";
import { notify } from "@/lib/notify";
import { askWhy, EnableMark } from "@/components/assistant";
import { InsightRail } from "@/components/insight-rail";
import { ShareSheet, audienceOptions, audienceLabel } from "@/components/share-sheet";
import { PageHeader, SplitPage, PropertyImage } from "@/components/layouts";
import {
  Chip, Section, SeverityBanner, Segmented, ConfirmBanner, EmptyState, Blocker, Warning, SchematicAction, Rows, Row, Done,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  ArrowRight, Bed, CarFront, DoorOpen, PlaneLanding, Plus, Search, Share2, StickyNote, Ticket, TrainFront, UtensilsCrossed,
} from "lucide-react";

const eur = (n: number) => `EUR ${n.toLocaleString("en-GB")}`;
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

const KIND: Record<LineKind, { label: string; icon: React.ElementType }> = {
  stay: { label: "Stay", icon: Bed },
  transfer: { label: "Transfer", icon: CarFront },
  dining: { label: "Dining", icon: UtensilsCrossed },
  experience: { label: "Experience", icon: Ticket },
  note: { label: "Note", icon: StickyNote },
};
/* A transfer names how it moves: the same mark for a train and a car read as one thing. */
function LineIcon({ l, className }: { l: TripLine; className?: string }) {
  if (l.kind === "transfer" && /eurostar|shinkansen|train/i.test(l.what)) return <TrainFront className={className} aria-hidden />;
  if (l.kind === "transfer" && /flight|lands/i.test(l.what)) return <PlaneLanding className={className} aria-hidden />;
  if (l.kind === "transfer") return <CarFront className={className} aria-hidden />;
  if (l.kind === "stay") return <Bed className={className} aria-hidden />;
  if (l.kind === "dining") return <UtensilsCrossed className={className} aria-hidden />;
  if (l.kind === "experience") return <Ticket className={className} aria-hidden />;
  return <StickyNote className={className} aria-hidden />;
}

/** A line made here: an id nobody else has. */
let made = 0;
const nextId = () => `n${++made}${Date.now().toString(36)}`;

/** A reply read and not yet accepted: the line's open question. */
const waitingReply = (l: TripLine) => [...l.requests].reverse().find((r) => r.reply && !r.reply.accepted);

/** What a control does in this mode: works (the lab, the advisor), is drawn and marked
    (the advisor outside the lab: COL-09), or is not there (the owner reads). */
type Mode = "edit" | "drawn" | "read";

/* ── the status, as a chip: words always, the tone only repeats them ─────────── */
function LineStatus({ l, s }: { l: TripLine; s: DemoState }) {
  if (l.suggested) return <Chip tone="primary">Suggested</Chip>;
  if (l.kind === "note") return null;
  if (blockOf(s, l.productId) && l.status !== "confirmed") return <Chip tone="crit">Closed to bookings</Chip>;
  if (waitingReply(l)) return <Chip tone="primary">Reply to read</Chip>;
  const word = statusWord(l, TODAY);
  const tone =
    /* colour means severity only (VIS-097): ochre where she must decide (a hold about to
       lapse, a refusal to replace), otherwise the words carry it */
    (l.status === "held" && l.holdUntil && Date.parse(l.holdUntil) - Date.parse(TODAY) <= 2 * 86_400_000) || l.status === "declined" ? "warn"
    : l.status === "held" || l.status === "confirmed" ? "primary"
    : "neutral";
  return <Chip tone={tone}>{word}</Chip>;
}

export default function TripPage() {
  return (
    <Suspense fallback={null}>
      <TripView />
    </Suspense>
  );
}

type Compose = { line: string; kind: LineRequest["kind"] };
type Adding = { kind?: LineKind; on?: string; replace?: string } | null;

/* Several of the URL's keys change in one act (a line on another day brings its day
   forward), so they are written together: two writes in one tick would each start from
   the same address and the second would undo the first. */
function useQuery() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const set = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(Array.from(params.entries()));
    for (const [k, v] of Object.entries(patch)) { if (v === null || v === "") next.delete(k); else next.set(k, v); }
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [params, router, pathname]);
  return [params, set] as const;
}

function TripView() {
  const { id } = useParams<{ id: string }>();
  const { s, d } = useDemo();
  const [params, setQuery] = useQuery();
  /* The owner sees a trip only once its traveller is shared with her (VIS-098). */
  const trip = visibleTrips(s).find((t) => t.id === id);
  const canAct = s.role === "user";
  const mode: Mode = !canAct ? "read" : s.lab ? "edit" : "drawn";

  const selected = params.get("line");
  const tab = params.get("day") ?? "overview";
  const pendingAct = params.get("act");
  const [compose, setCompose] = useState<Compose | null>(null);
  const [adding, setAdding] = useState<Adding>(null);
  const [sharing, setSharing] = useState(false);

  const lines = useMemo(() => (trip ? linesOf(s.tripLines, trip.id) : []), [s.tripLines, trip]);
  const checks = useMemo(() => (trip ? tripChecks(s, trip) : []), [s, trip]);
  const line = lines.find((l) => l.id === selected);

  const select = (lineId: string | null, then?: Compose | null) => {
    setCompose(then ?? null);
    /* a line on another day's tab brings its day forward; the overview holds every line */
    const on = lineId ? lines.find((l) => l.id === lineId)?.on : undefined;
    setQuery({ line: lineId, act: null, ...(on && tab !== "overview" && tab !== on ? { day: on } : {}) });
    if (lineId) window.setTimeout(() => document.querySelector(`[data-agent-target="line-${lineId}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 60);
  };
  const setTab = (t: string) => setQuery({ day: t === "overview" ? null : t });

  /* An act, from the rail or from the ledger's footer: ask, confirm, chase, add, open. */
  const run = (act: string) => {
    if (!trip) return;
    const [verb, a, b] = act.split(":");
    if (verb === "select") { select(a); return; }
    if (verb === "day") { setQuery({ day: a === "overview" ? null : a, act: null }); return; }
    if (mode !== "edit") { setQuery({ act: null }); return; }
    if (verb === "compose") { select(a, { line: a, kind: b as LineRequest["kind"] }); return; }
    if (verb === "add") { setAdding({ kind: a as LineKind, on: b }); setQuery({ act: null }); return; }
    /* "Find another" from a traveller's page: the add sheet, on that line's day and kind */
    if (verb === "find") {
      const l = lines.find((x) => x.id === a);
      if (l) { select(a); setAdding({ kind: l.kind, on: l.on, replace: l.id }); } else setQuery({ act: null });
      return;
    }
    if (verb === "ask-all") {
      setQuery({ act: null });
      d({ type: "thread", id: null });
      d({ type: "task", task: "ask-ideas", label: "Ask the suppliers about every idea on this trip", path: `/itineraries/${trip.id}` });
    }
  };
  /* The ledger's footer started an act here: run it once the page is up, then take it off
     the address (the act clears `act`, so a reload does not repeat it). */
  useEffect(() => {
    if (!pendingAct || !trip) return;
    const t = window.setTimeout(() => run(pendingAct), 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAct, trip?.id]);

  if (!trip) {
    return (
      <div className="p-[var(--panel-pad)]">
        <PageHeader title="Not on your list" />
        <EmptyState
          title="Nothing at this address for you"
          body="A trip that is not shared with you is absent, not locked."
          action={<Button asChild variant="secondary" size="sm"><Link href="/itineraries">Every trip you can see</Link></Button>}
        />
      </div>
    );
  }

  const railKey = `trip-rail-${trip.id}`;
  /* Closed, the card collapses to a small "N insights" control in its place, as on the
     Briefing (FB-11): it is never taken away with what is still waiting on it. */
  const collapsed = !!s.dismissed[railKey];
  /* One card on the right at a time: a line's card or a conversation takes the slot, and
     closing it gives the rail back where it was. Mounted while hidden, so it keeps its place. */
  const railShown = !line && !s.assistantOpen;

  /* Read, the rail's acts point at what they are about: a line opens, a day comes forward.
     The builder's acts (ask, add) are the lab's. */
  const railChecks: Check[] = mode === "edit" ? checks : checks.map((c) => {
    if (c.action.act?.startsWith("select:")) return c;
    if (c.line) return { ...c, action: { label: "Open the line", act: `select:${c.line}` } };
    if (c.chapter.startsWith("day-")) return { ...c, action: { label: "Show the day", act: `day:${c.chapter.slice(4)}` } };
    return { ...c, action: { label: "Show the overview", act: "day:overview" } };
  });

  const days = daysOf(trip);
  const money = canViewCommissions(s);
  const pending = lines.filter((l) => l.suggested);
  const share = tripShareOf(s, trip.id);
  const shareKey = tripShareKey(trip.id);

  return (
    <SplitPage
      header={
        <PageHeader
          title={trip.title}
          actions={
            canAct ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => setSharing(true)}><Share2 aria-hidden /> Share</Button>
                {mode === "edit"
                  ? <Button variant="secondary" size="sm" onClick={() => setAdding({})}><Plus aria-hidden /> Add to trip</Button>
                  : <SchematicAction><Plus className="size-[var(--icon-md)]" aria-hidden /> Add to trip</SchematicAction>}
              </>
            ) : undefined
          }
        >
          <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-[var(--space-1)]">
            <p className="type-meta tnum">
              {trip.travellerId ? (
                <Link href={`/travellers/${trip.travellerId}`} className="underline decoration-link-rest underline-offset-4 hover:decoration-ink">{trip.traveller}</Link>
              ) : trip.traveller}
              {" · "}{trip.dates} · {trip.nights} nights · {trip.destinations.join(", ")}
              {trip.startsInDays !== null && <> · leaves in {trip.startsInDays} days</>}
            </p>
            <Chip tone={trip.status === "Planning" || trip.status === "Inbound" ? "primary" : "neutral"}>{trip.status}</Chip>
            <span className="type-meta">
              {!canAct ? `Shared with you by ${personName.user}` : share === "private" ? "Only you can see it" : `Shared with ${audienceLabel(share, false).replace(/^The/, "the")}`}
            </span>
          </div>
        </PageHeader>
      }
      panelOpen={!!line}
      onClosePanel={() => select(null)}
      panelTitle={line?.what ?? "Line"}
      panel={line ? (
        <LineCard
          key={line.id} l={line} trip={trip} mode={mode}
          compose={compose?.line === line.id ? compose.kind : null}
          setCompose={(k) => setCompose(k ? { line: line.id, kind: k } : null)}
          onRemoved={() => select(null)}
          onFindAnother={(kind, on, replace) => setAdding({ kind, on, replace })}
        />
      ) : null}
    >
      <div className="doc-layout" style={!railShown ? { gridTemplateColumns: "minmax(0, 1fr)" } : collapsed ? { gridTemplateColumns: "minmax(0, 1fr) auto" } : undefined}>
        <div className="min-w-0">
          {pending.length > 0 && (
            <div className="mb-[var(--space-4)] flex flex-wrap items-center gap-x-[var(--space-4)] gap-y-[var(--space-3)] rounded-lg bg-sunken px-[var(--space-4)] py-[var(--space-3)]">
              <EnableMark className="size-5 shrink-0 text-label-secondary" />
              <p className="min-w-0 flex-1 type-data">
                Enable drafted {pending.length === 1 ? "one line" : `${pending.length} lines`} from {trip.traveller}&apos;s profile and the agency&apos;s records. Keep, swap or remove each: nothing is asked of anyone until you keep it.
              </p>
              {mode === "edit" ? (
                <Button size="sm" variant="secondary" onClick={() => pending.forEach((l) => d({ type: "lineSet", id: l.id, patch: { suggested: undefined } }))}>
                  Keep all {pending.length}
                </Button>
              ) : mode === "drawn" ? <SchematicAction>Keep all {pending.length}</SchematicAction> : null}
            </div>
          )}

          {/* A trip that arrived with no lines here (booked in the booking system) has no
              days to tab through outside the lab: its summary is the page. */}
          {(lines.length > 0 || mode === "edit") && (
            <DayStrip
              days={days} lines={lines} s={s} tab={tab} onTab={setTab} editable={mode === "edit"}
              onLine={(lid) => select(lid)}
              onGap={(day) => (mode === "edit" ? setAdding({ kind: "stay", on: day }) : setTab(day))}
            />
          )}

          <div role="tabpanel" aria-label={tab === "overview" ? "Overview" : dayLabel(tab)} className="mt-[var(--space-4)]">
            {tab === "overview" ? (
              <>
                <Standing trip={trip} lines={lines} s={s} money={money} />
                {lines.length === 0 && (
                  <Arrived trip={trip} building={mode === "edit"} started={s.createdTrips.some((c) => c.id === trip.id)} />
                )}
                {lines.length > 0 && days.map((day, i) => (
                  <DayChapter
                    key={day} compact day={day} n={i + 1} last={i === days.length - 1} lines={lines} s={s} mode={mode}
                    selected={selected}
                    onSelect={(lid) => select(lid === selected ? null : lid)}
                    onAddStay={() => setAdding({ kind: "stay", on: day })}
                    onOpen={() => setTab(day)}
                  />
                ))}
              </>
            ) : (
              <DayChapter
                day={tab} n={days.indexOf(tab) + 1} last={tab === days[days.length - 1]} lines={lines} s={s} mode={mode}
                selected={selected}
                onSelect={(lid) => select(lid === selected ? null : lid)}
                onAddStay={() => setAdding({ kind: "stay", on: tab })}
                onAdd={() => setAdding({ on: tab })}
              />
            )}
          </div>
        </div>

        {(railChecks.length > 0 || !collapsed) && (
          <aside className={railShown ? "doc-rail" : "doc-rail hidden"} data-rail-label="This trip">
            <InsightRail
              insights={railChecks}
              collapsed={collapsed}
              onClose={() => d({ type: "dismiss", id: railKey })}
              onOpen={() => d({ type: "restore", id: railKey })}
              onAct={(i) => run(i.action.act ?? "")}
              onWhy={(i) => askWhy(d, s, i, `/itineraries/${trip.id}`)}
              empty={{ label: "This trip", text: "Nothing on this trip is waiting on you." }}
              paused={!railShown}
              lead="standing"
              /* on a day's tab, stepping to an insight about another day opens that day */
              onFocus={(i) => { if (tab !== "overview" && i.chapter.startsWith("day-")) setTab(i.chapter.slice(4)); }}
            />
          </aside>
        )}
      </div>

      {mode === "edit" && (
        <AddSheet trip={trip} adding={adding} onClose={() => setAdding(null)} onAdded={(lid) => { setAdding(null); select(lid); }} />
      )}

      {/* Sharing a trip (COL-10, VIS-101): the same sheet as everything else. Only me or
          the Paris desk for now; the whole agency waits on the store's trip share, which
          would carry it to the owner's publish queue. */}
      {canAct && (
        <ShareSheet
          open={sharing}
          onOpenChange={setSharing}
          what={trip.title}
          current={share}
          options={audienceOptions(false).filter((o) => o.value !== "agency")}
          describe={(v) => (v === "private" ? "The trip is private to you again" : "Shared the trip with the Paris desk")}
          onShare={(v) => (v === "private" ? d({ type: "undecide", id: shareKey }) : d({ type: "decide", id: shareKey, what: v }))}
        />
      )}
    </SplitPage>
  );
}

/* ── a trip that arrived with no lines here: what it came with ─────────────────── */
function Arrived({ trip, building, started }: { trip: Trip; building: boolean; started: boolean }) {
  const records = trip.products.map((id) => productById(id)).filter((p): p is NonNullable<ReturnType<typeof productById>> => !!p);
  return (
    <section className="chapter" data-slot="chapter" data-chapter="standing" id="chapter-standing" data-agent-target="standing">
      {started ? (
        <p className="max-w-[62ch] type-prose-lead">
          Nothing on this trip yet.{building ? " Start with where they sleep; each line begins as an idea, and nobody is asked until you ask." : ""}
        </p>
      ) : (
        <>
          <p className="max-w-[62ch] type-prose-lead">
            {trip.status}{trip.checklist ? `, with the departure checklist at ${trip.checklist.done} of ${trip.checklist.of}` : ""}.
            {trip.alert ? ` ${cap(trip.alert)}.` : ""}
          </p>
          <p className="mt-[var(--space-3)] type-data text-label-secondary">
            Its lines are in the booking system.{building ? " Add them here as ideas to work them in Enable." : ""}
          </p>
          {records.length > 0 && (
            <Rows className="mt-[var(--space-4)]">
              {records.map((p) => (
                <Row key={p.id}>
                  <Link href={`/records/${p.id}`} className="row-primary flex items-center gap-[var(--space-3)] underline decoration-link-rest underline-offset-4 hover:decoration-ink">
                    <span className="size-8 shrink-0 overflow-hidden rounded-md bg-sunken">
                      <PropertyImage id={p.id} name={p.name} category={p.category} />
                    </span>
                    <span className="min-w-0 truncate"><span className="type-data-strong">{p.name}</span><span className="text-label-secondary"> · {p.city}</span></span>
                  </Link>
                </Row>
              ))}
            </Rows>
          )}
        </>
      )}
    </section>
  );
}

/* ── where it stands: one sentence, then money ─────────────────────────────────── */
function Standing({ trip, lines: all, s, money }: { trip: Trip; lines: TripLine[]; s: DemoState; money: boolean }) {
  /* Suggestions are not the trip yet: they are counted apart, and only until kept. */
  const pending = all.filter((l) => l.suggested).length;
  const lines = all.filter((l) => !l.suggested);
  const t = tallyOf(lines);
  if (!t.total && pending) {
    return (
      <section className="chapter" data-slot="chapter" data-chapter="standing" id="chapter-standing" data-agent-target="standing">
        <p className="max-w-[62ch] type-prose-lead">
          Enable drafted this trip from {trip.traveller}&apos;s profile and the agency&apos;s records: {pending === 1 ? "one suggestion" : `${pending} suggestions`} to review, day by day.
        </p>
      </section>
    );
  }
  if (!t.total) return null;
  const held = lines.filter((l) => l.status === "held" && !blockOf(s, l.productId));
  const blocked = lines.filter((l) => blockOf(s, l.productId) && l.status !== "confirmed");
  const replies = lines.filter((l) => waitingReply(l)).length;
  const ideas = lines.filter((l) => l.status === "idea" && l.kind !== "note" && !blockOf(s, l.productId)).length;
  const asked = lines.filter((l) => l.status === "requested" && !waitingReply(l)).length;
  const parts = [
    t.confirmed === t.total ? "Every line is confirmed." : `${t.confirmed} of ${t.total} lines are confirmed.`,
    ...held.map((l) => `${productById(l.productId ?? "")?.name ?? l.what} is held until ${shortDate(l.holdUntil ?? TODAY)}.`),
    replies ? `${replies === 1 ? "A reply waits" : `${replies} replies wait`} for you.` : "",
    asked ? `${asked === 1 ? "One question is" : `${asked} questions are`} out with suppliers.` : "",
    ideas ? `${ideas === 1 ? "One idea has" : `${ideas} ideas have`} not been asked yet.` : "",
    ...blocked.map((l) => `${productById(l.productId ?? "")?.name} is closed to bookings.`),
    t.declined ? `${t.declined === 1 ? "One supplier" : `${t.declined} suppliers`} said no.` : "",
    pending ? `${pending === 1 ? "One suggestion waits" : `${pending} suggestions wait`} for review.` : "",
  ].filter(Boolean);

  const projected = lines
    .filter((l) => l.status === "confirmed" && l.productId && l.program)
    .map((l) => projectedOf(l, termsFor(l.productId!, l.program!, l.offer)?.rate ?? null) ?? 0)
    .reduce((a, b) => a + b, 0);
  const coming = lines
    .filter((l) => (l.status === "held" || l.status === "requested") && l.productId && l.program)
    .map((l) => projectedOf(l, termsFor(l.productId!, l.program!, l.offer)?.rate ?? null) ?? 0)
    .reduce((a, b) => a + b, 0);

  return (
    <section className="chapter" data-slot="chapter" data-chapter="standing" id="chapter-standing" data-agent-target="standing">
      <p className="max-w-[62ch] type-prose-lead">{parts.join(" ")}</p>
      {money && (projected > 0 || coming > 0) && (
        <p className="mt-[var(--space-3)] type-meta tnum">
          {projected > 0 && <>Projected commission {eur(projected)} on the confirmed lines</>}
          {projected > 0 && coming > 0 && " · "}
          {coming > 0 && <>{eur(coming)} more once the held and asked lines confirm</>}
        </p>
      )}
    </section>
  );
}

/* ── the days, as tabs, with where they sleep drawn beneath ──────────────────────
   Overview first, then one tab per day (the same pill that chooses everywhere else).
   The stay band runs under the tabs across the nights each stay covers, so the shape of
   the trip stays in view whichever day is open; a night with nowhere to sleep is an amber
   gap in it. Under each day, what it holds, in a word. Long trips scroll sideways. */
function DayStrip({ days, lines, s, tab, onTab, onLine, onGap, editable }: {
  days: string[]; lines: TripLine[]; s: DemoState; tab: string; editable: boolean;
  onTab: (t: string) => void; onLine: (id: string) => void; onGap: (day: string) => void;
}) {
  const sleepable = (l: TripLine) => l.kind === "stay" && !!l.until && l.status !== "declined" && !blockOf(s, l.productId);
  const stays = lines.filter(sleepable).sort((a, b) => Number(a.status === "idea") - Number(b.status === "idea") || a.on.localeCompare(b.on));
  /* lanes: an alternative for the same nights sits under the stay, not over it */
  const lanes: [number, number][][] = [];
  const placed = stays.map((l) => {
    const from = Math.max(0, days.indexOf(l.on));
    const to = days.indexOf(l.until!) < 0 ? days.length - 1 : days.indexOf(l.until!);
    let lane = lanes.findIndex((ln) => ln.every(([a, b]) => to <= a || from >= b));
    if (lane < 0) { lanes.push([]); lane = lanes.length - 1; }
    lanes[lane].push([from, to]);
    return { l, from, to, lane };
  });
  const bare = stays.length ? days.slice(0, -1).map((d, i) => (stays.some((l) => d >= l.on && d < l.until!) ? -1 : i)).filter((i) => i >= 0) : [];
  const gaps: [number, number][] = [];
  for (const i of bare) { const g = gaps[gaps.length - 1]; if (g && g[1] === i) g[1] = i + 1; else gaps.push([i, i + 1]); }
  const bandRows = Math.max(1, lanes.length);
  const word = (day: string) => {
    const here = lines.filter((l) => l.on === day);
    const pend = here.filter((l) => l.suggested).length;
    const replies = here.filter((l) => waitingReply(l)).length;
    if (pend) return `${pend} suggested`;
    if (replies) return `${replies} ${replies === 1 ? "reply" : "replies"}`;
    if (here.length === 1 && here[0].kind === "note") return "free day";
    return here.length ? `${here.length} ${here.length === 1 ? "line" : "lines"}` : "—";
  };
  const tabClass = (on: boolean) => cn(
    "pressable flex h-[var(--control-h-sm)] cursor-pointer items-center justify-center whitespace-nowrap rounded-full border px-[var(--control-px-sm)] type-data",
    on ? "border-selected bg-selected text-on-selected" : "border-control-edge bg-control-rest text-label-secondary hover:border-control-edge-hover hover:text-label",
  );
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="grid gap-x-[var(--space-2)] gap-y-[var(--space-1)]" style={{ gridTemplateColumns: `auto repeat(${days.length}, minmax(76px, 1fr))` }}>
        <div role="tablist" aria-label="Days" className="contents">
          <button type="button" role="tab" aria-selected={tab === "overview"} onClick={() => onTab("overview")} className={tabClass(tab === "overview")} style={{ gridRow: 1, gridColumn: 1 }}>
            Overview
          </button>
          {days.map((d, i) => (
            <button key={d} type="button" role="tab" aria-selected={tab === d} title={dayLabel(d)} onClick={() => onTab(d)} className={tabClass(tab === d)} style={{ gridRow: 1, gridColumn: i + 2 }}>
              {dayLabel(d).split(" ").slice(0, 2).join(" ")}
            </button>
          ))}
        </div>
        {placed.map(({ l, from, to, lane }) => (
          <button
            key={l.id}
            type="button"
            onClick={() => onLine(l.id)}
            title={`${l.what} · ${l.suggested ? "suggested" : statusWord(l, TODAY)}`}
            style={{ gridRow: 2 + lane, gridColumn: `${from + 2} / ${to + 2}` }}
            className={cn(
              "pressable flex h-[var(--control-h-sm)] min-w-0 cursor-pointer items-center gap-[var(--space-1)] rounded-md border px-[var(--space-2)] type-meta",
              l.status === "idea" ? "border-dashed border-hairline text-label-secondary" : "border-hairline bg-sunken text-label",
              "hover:bg-interactive",
            )}
          >
            <Bed className="size-[var(--icon-sm)] shrink-0" aria-hidden />
            <span className="truncate">{productById(l.productId ?? "")?.name ?? l.what.split(",")[0]} · {nightsOf(l)} {nightsOf(l) === 1 ? "night" : "nights"} · {l.suggested ? "suggested" : statusWord(l, TODAY).charAt(0).toLowerCase() + statusWord(l, TODAY).slice(1)}</span>
          </button>
        ))}
        {gaps.map(([from, to]) => (
          <button
            key={`gap-${from}`}
            type="button"
            onClick={() => onGap(days[from])}
            style={{ gridRow: 2, gridColumn: `${from + 2} / ${to + 2}` }}
            className="pressable flex h-[var(--control-h-sm)] min-w-0 cursor-pointer items-center gap-[var(--space-2)] rounded-md border border-dashed border-hairline px-[var(--space-1)] type-meta text-label-secondary hover:bg-interactive"
          >
            <Chip tone="warn">No stay · {to - from} {to - from === 1 ? "night" : "nights"}</Chip>
            {editable && <span className="truncate">add one</span>}
          </button>
        ))}
        {days.map((d, i) => (
          <span key={`w-${d}`} className="truncate px-1 text-center type-meta text-label-tertiary" style={{ gridRow: 2 + bandRows, gridColumn: i + 2 }}>{word(d)}</span>
        ))}
      </div>
    </div>
  );
}

/* ── a day: its lines, the stay it sleeps in, or the gap where one should be ────
   Full on its own tab, with "Add to" for that day; compact on the overview, where the
   band already says where they sleep and the day's name opens its tab. */
function DayChapter({ day, n, last, lines, s, mode, selected, onSelect, onAddStay, compact = false, onOpen, onAdd }: {
  day: string; n: number; last: boolean; lines: TripLine[]; s: DemoState; mode: Mode;
  selected: string | null; onSelect: (id: string) => void; onAddStay: () => void;
  compact?: boolean; onOpen?: () => void; onAdd?: () => void;
}) {
  const today = lines.filter((l) => l.on === day);
  /* A night shows the stay they sleep in. An alternative on the table (a second idea for
     the same nights, a closed record) is its own line on its first day, not a second bed. */
  const sleepable = (l: TripLine) => l.kind === "stay" && !!l.until && l.status !== "declined" && !blockOf(s, l.productId);
  const firm = lines.filter((l) => sleepable(l) && l.status !== "idea");
  const pool = (d0: (l: TripLine) => boolean) => { const f = firm.filter(d0); return f.length ? f : lines.filter((l) => sleepable(l) && d0(l)); };
  const staying = pool((l) => l.on < day && day < l.until!);
  const leaving = pool((l) => l.until === day);
  const hasStays = lines.some((l) => l.kind === "stay" && l.status !== "declined");
  const sleeps = lines.some((l) => sleepable(l) && l.on <= day && day < l.until!);
  const bare = hasStays && !last && !sleeps;
  const short = dayLabel(day).split(" ").slice(0, 2).join(" ");

  if (compact) {
    return (
      <Section
        anchor={`day-${day}`}
        title={
          <button type="button" onClick={onOpen} className="flex cursor-pointer items-baseline gap-[var(--space-2)] hover:text-label-secondary">
            {dayLabel(day)}<span className="type-meta">Day {n}</span>
          </button>
        }
      >
        <ul className="divide-y divide-hairline">
          {today.map((l) => <LineRow key={l.id} compact l={l} s={s} on={selected === l.id} onSelect={() => onSelect(l.id)} />)}
          {!today.length && <li className="py-[var(--space-2)] pl-[calc(var(--space-3)+2px)] type-meta">{sleeps ? "Nothing planned but the night." : "Nothing planned."}</li>}
        </ul>
      </Section>
    );
  }

  return (
    <Section
      anchor={`day-${day}`}
      title={<>{dayLabel(day)}<span className="type-meta">Day {n}</span></>}
      actions={
        !onAdd ? undefined
        : mode === "edit" ? <Button variant="tertiary" size="sm" onClick={onAdd}><Plus aria-hidden /> Add to {short}</Button>
        : mode === "drawn" ? <SchematicAction><Plus className="size-[var(--icon-md)]" aria-hidden /> Add to {short}</SchematicAction>
        : undefined
      }
    >
      <ul className="divide-y divide-hairline">
        {leaving.map((l) => (
          <li key={`out-${l.id}`} className="flex items-center gap-[var(--space-2)] py-[var(--space-2)] pl-[calc(var(--space-3)+2px)] type-meta">
            <DoorOpen className="size-[var(--icon-sm)]" aria-hidden /> Check out of {productById(l.productId ?? "")?.name ?? l.what.split(",")[0]}
          </li>
        ))}
        {today.map((l) => (
          <LineRow key={l.id} l={l} s={s} on={selected === l.id} onSelect={() => onSelect(l.id)} />
        ))}
        {staying.map((l) => (
          <li key={`in-${l.id}`} className="flex items-center gap-[var(--space-2)] py-[var(--space-2)] pl-[calc(var(--space-3)+2px)] type-meta">
            <Bed className="size-[var(--icon-sm)]" aria-hidden />
            Staying at {productById(l.productId ?? "")?.name ?? l.what.split(",")[0]} · night {Math.round((Date.parse(day) - Date.parse(l.on)) / 86_400_000) + 1} of {nightsOf(l)}
          </li>
        ))}
        {bare && (
          <li className="flex flex-wrap items-center justify-between gap-[var(--space-2)] py-[var(--space-2)] pl-[calc(var(--space-3)+2px)]">
            <Chip tone="warn">Nowhere to sleep tonight</Chip>
            {mode === "edit" ? <Button variant="tertiary" size="sm" onClick={onAddStay}>Add a stay</Button>
              : mode === "drawn" ? <SchematicAction>Add a stay</SchematicAction> : null}
          </li>
        )}
        {!today.length && !staying.length && !leaving.length && !bare && (
          <li className="py-[var(--space-2)] pl-[calc(var(--space-3)+2px)] type-meta">Nothing planned.</li>
        )}
      </ul>
    </Section>
  );
}

function LineRow({ l, s, on, onSelect, compact = false }: { l: TripLine; s: DemoState; on: boolean; onSelect: () => void; compact?: boolean }) {
  const who = l.productId ? [l.program].filter(Boolean).join("") : supplierOf(l)?.name;
  const second = [
    l.kind === "stay" ? `${nightsOf(l)} nights, to ${dayLabel(l.until ?? l.on)}` : KIND[l.kind].label,
    who,
    l.status === "confirmed" && l.confirmation ? `ref ${l.confirmation.ref}${l.confirmation.by === "traveller" ? ", booked by the travellers" : ""}` : l.detail,
  ].filter(Boolean).join(" · ");
  return (
    <li data-agent-target={`line-${l.id}`} className="row-select">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={on}
        className={cn(
          "block w-full cursor-pointer px-[var(--space-3)] text-left",
          compact ? "py-[var(--space-2)]" : "py-[var(--space-3)]",
        )}
      >
        <span className="flex items-center gap-[var(--space-2)]">
          <LineIcon l={l} className="size-[var(--icon-md)] shrink-0 text-label-secondary" />
          <span className={cn("min-w-0 flex-1 truncate", l.kind === "note" ? "type-data" : "type-data-strong")}>{l.what}</span>
          {l.time && <span className="shrink-0 type-meta tnum">{l.time}</span>}
          <span className="shrink-0"><LineStatus l={l} s={s} /></span>
        </span>
        {second && !compact && <span className="mt-0.5 block truncate pl-[calc(var(--icon-md)+var(--space-2))] type-meta">{second}</span>}
      </button>
    </li>
  );
}

/* ── the card: one line, and the one act its state allows ───────────────────────── */
function LineCard({ l, trip, mode, compose, setCompose, onRemoved, onFindAnother }: {
  l: TripLine; trip: Trip; mode: Mode;
  compose: LineRequest["kind"] | null;
  setCompose: (k: LineRequest["kind"] | null) => void;
  onRemoved: () => void;
  onFindAnother: (kind: LineKind, on: string, replace?: string) => void;
}) {
  const { s, d } = useDemo();
  const money = canViewCommissions(s);
  const p = l.productId ? productById(l.productId) : undefined;
  const block = blockOf(s, l.productId);
  const caution = cautionOf(s, l.productId, l.on);
  const clash = tasteClash(trip.traveller, l.productId);
  const kept = keptWords(s, trip, l.productId);
  const inc = incentiveOf(l);
  const offer = offerOf(l);
  const used = !!offer && l.offer === offer.id;
  const terms = l.productId && l.program ? termsFor(l.productId, l.program, l.offer) : null;
  const projected = terms ? projectedOf(l, terms.rate) : null;
  /* what the line earns on the programme's own rate, and on the offer's */
  const onBase = l.productId && l.program ? projectedOf(l, termsFor(l.productId, l.program)?.rate ?? null) : null;
  const onOffer = offer && l.productId && l.program ? projectedOf(l, termsFor(l.productId, l.program, offer.id)?.rate ?? null) : null;
  const chose = offer ? s.decisions[`offer:${l.id}`] : undefined;
  /* Choosing the offer's rate: the advisor's act, recorded with who and when. */
  const useOffer = () => {
    if (!offer) return;
    d({ type: "lineSet", id: l.id, patch: { offer: offer.id } });
    d({ type: "decide", id: `offer:${l.id}`, what: `Booked on ${offer.offer!.name}` });
  };
  const who = supplierOf(l);
  const reply = waitingReply(l);
  const [byHand, setByHand] = useState(false);
  const [ref, setRef] = useState("");
  const open = l.status === "idea" || l.status === "requested" || l.status === "held" || l.status === "declined";
  const edit = mode === "edit";
  const canAct = mode !== "read";
  const blocked = !!block && l.status !== "confirmed";

  /* Taking it off: never the primary, destructive, with Undo (NAV-09). */
  const takeItOff = () => { takeOff(s, d, trip, l); onRemoved(); };
  /* Removing a suggestion nobody kept: immediate, and Undo puts it back. */
  const removeSuggestion = () => {
    d({ type: "lineRemove", id: l.id });
    onRemoved();
    notify("Suggestion removed", { detail: l.what, undo: () => d({ type: "lineAdd", line: l }) });
  };

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      {/* what it is, and where it stands */}
      <div className="flex flex-col gap-[var(--space-2)]">
        <div className="flex flex-wrap items-center gap-[var(--space-2)]">
          <LineStatus l={l} s={s} />
          <span className="type-meta tnum">
            {dayLabel(l.on)}{l.time ? ` · ${l.time}` : ""}{l.until ? ` → ${dayLabel(l.until)}` : ""}
          </span>
        </div>
        {l.detail && <p className="type-data text-label-secondary">{cap(l.detail)}.</p>}
      </div>

      {/* One attention item for this line (VIS-099): a closure outranks a taste, and the
          closure's one act is to take the line off the trip. Nobody acknowledges it. */}
      {/* In the card's narrow column the act sits under the sentence, not beside it. */}
      {blocked ? (
        <Blocker title="Closed to bookings">
          {block.text} <span className="type-meta">{block.by}, {block.openedAt}</span>
          {canAct && (
            <div className="mt-[var(--space-3)]">
              <Button variant="secondary" size="sm" onClick={takeItOff}>Take it off the trip</Button>
            </div>
          )}
        </Blocker>
      ) : clash && open ? (
        <Warning title={`Against ${trip.traveller}'s taste`} kept={kept}>
          {clash.sentence}
          {canAct && (
            <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-2)]">
              {edit
                ? <Button size="sm" variant="secondary" onClick={() => onFindAnother(l.kind, l.on, l.id)}>Find another</Button>
                : <SchematicAction>Find another</SchematicAction>}
              <Button size="sm" variant="secondary" onClick={() => d({ type: "decide", id: tasteKey(trip, l.productId!), what: "Kept despite the preference" })}>Keep it</Button>
            </div>
          )}
        </Warning>
      ) : caution && open ? (
        <Warning title="A notice on this property">{caution.text}</Warning>
      ) : null}
      {inc && money && l.status !== "confirmed" && (
        <SeverityBanner severity="Info">
          {incentiveWords(inc)} on bookings made by {inc.bookingWindowEnd}.
        </SeverityBanner>
      )}
      {/* A partner's offer read from this morning's email (2026-10-02): what it pays and
          adds against the programme's own rate, where it was read, and the advisor's act.
          Once chosen it says who chose it; the terms below are the offer's. */}
      {offer?.offer && money && l.status !== "confirmed" && (used ? (
        <Done>{chose ? `${chose.what} · ${personName[chose.by]}, ${/\d{1,2}:\d{2}$/.exec(chose.at)?.[0] ?? "today"}` : `Booked on ${offer.offer.name}`}</Done>
      ) : (
        <SeverityBanner severity="Info">
          <span className="type-data-strong">{offer.offer.name}</span>, from {offer.offer.from.source} at {offer.offer.from.at}: {offer.rate} instead of {Math.round((termsFor(l.productId!, l.program!)?.rate ?? 0) * 100)}%
          {onBase != null && onOffer != null ? ` (${eur(onOffer)} instead of ${eur(onBase)})` : ""}, and {offer.offer.adds.charAt(0).toLowerCase() + offer.offer.adds.slice(1)}. For stays booked by {offer.bookingWindowEnd}.
          {canAct && (
            <div className="mt-[var(--space-3)]">
              <Button size="sm" onClick={useOffer}>Use the offer rate</Button>
            </div>
          )}
        </SeverityBanner>
      ))}

      {/* the record it books */}
      {p && (
        <Link href={`/records/${p.id}`} className="flex items-center gap-[var(--space-3)] rounded-md hover:bg-interactive">
          <span className="size-10 shrink-0 overflow-hidden rounded-md bg-sunken">
            <PropertyImage id={p.id} name={p.name} category={p.category} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate type-data-strong">{p.name}</span>
            <span className="block type-meta">{p.city} · verified {p.lastVerified}</span>
          </span>
          <ArrowRight className="size-[var(--icon-md)] text-label-secondary" aria-hidden />
        </Link>
      )}

      {/* the programme it is booked under, and what that gives */}
      {p && p.programs.length > 0 && (
        <div className="flex flex-col gap-[var(--space-3)]">
          <div className="type-meta text-label-tertiary">Programme</div>
          {edit && p.programs.length > 1 && l.status !== "confirmed" ? (
            <Segmented
              label="Programme"
              value={l.program ?? p.programs[0]}
              onChange={(v) => d({ type: "lineSet", id: l.id, patch: { program: v } })}
              options={p.programs.map((x) => ({ value: x, label: x }))}
            />
          ) : (
            <span className="type-data-strong">{l.program ?? p.programs[0]}</span>
          )}
          {terms && (
            <>
              <ul className="flex flex-col gap-[var(--space-1)] type-data">
                {terms.amenities.map((a) => <li key={a}>{a}</li>)}
              </ul>
              {money && (
                <p className="type-meta tnum">
                  {Math.round(terms.rate * 100)}% commission{l.sell ? ` on ${eur(l.sell)}: ${eur(projected ?? 0)}${inCommissions(l) ? ", projected in Commissions" : l.status === "confirmed" ? ", projected" : " once confirmed"}` : ""}. {terms.conditions}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* a suggestion: why Enable put it here, and the three things to do with it */}
      {l.suggested && (
        <div className="flex flex-col gap-[var(--space-3)]">
          <div className="type-meta text-label-tertiary">Why Enable suggested it</div>
          <p className="type-data">{cap(l.suggested.reason)}.</p>
          <p className="type-meta">From {l.suggested.source}. Nothing is asked of anyone until you keep it.</p>
          {edit ? (
            <div className="flex flex-wrap items-center gap-[var(--space-2)]">
              <Button size="sm" onClick={() => d({ type: "lineSet", id: l.id, patch: { suggested: undefined } })}>Keep</Button>
              <Button size="sm" variant="secondary" onClick={() => onFindAnother(l.kind, l.on, l.id)}>Swap</Button>
              <Button size="sm" variant="tertiary" onClick={removeSuggestion}>Remove</Button>
            </div>
          ) : canAct ? (
            <div className="flex flex-wrap items-center gap-[var(--space-2)]">
              <SchematicAction>Keep</SchematicAction><SchematicAction>Swap</SchematicAction><SchematicAction>Remove</SchematicAction>
            </div>
          ) : null}
        </div>
      )}

      {/* the act its state allows */}
      {l.suggested || blocked ? null : compose && edit ? (
        <Composer l={l} trip={trip} kind={compose} to={who} onDone={() => setCompose(null)} />
      ) : reply?.reply ? (
        <div className="flex flex-col gap-[var(--space-3)]">
          <div className="type-meta text-label-tertiary">Their reply, as read</div>
          <p className="type-data">
            {reply.reply.read.status === "held" && <>They hold it until <span className="type-data-strong">{shortDate(reply.reply.read.until ?? TODAY)}</span>.</>}
            {reply.reply.read.status === "confirmed" && <>Confirmed{reply.reply.read.ref && <>, reference <span className="type-data-strong tnum">{reply.reply.read.ref}</span></>}.</>}
            {reply.reply.read.status === "declined" && <>They cannot do it.</>}
            {reply.reply.read.note && <> “{reply.reply.read.note}”</>}
          </p>
          <p className="type-meta">From “{reply.reply.doc}”, {reply.reply.at}, in Forwarded mail. Nothing changes on the trip until you accept it.</p>
          <Acts
            mode={mode}
            primary={{ label: reply.reply.read.status === "declined" ? "Accept the refusal" : "Confirm what they said", go: () => d({ type: "lineAccept", id: l.id, request: reply.id }) }}
            secondary={{ label: "That is not what they said", go: () => setCompose("chase") }}
          />
        </div>
      ) : l.kind === "note" ? null : l.status === "idea" ? (
        <Act
          mode={mode}
          text={who ? `Nobody has asked ${who.name} yet.` : "Nobody to ask: add a supplier, or mark it confirmed by hand."}
          primary={who ? { label: `Ask ${who.name.replace(/ reservations$/, "")}`, go: () => setCompose("availability") } : undefined}
        />
      ) : l.status === "requested" ? (
        <Act
          mode={mode}
          text={`Asked ${l.requests[l.requests.length - 1]?.sentAt ?? "today"}. The reply lands in Forwarded mail and waits here for you.`}
          secondary={{ label: "Draft a chase", go: () => setCompose("chase") }}
        />
      ) : l.status === "held" ? (
        <Act
          mode={mode}
          text={`${who?.name ?? "They"} hold it until ${shortDate(l.holdUntil ?? TODAY)}. Ask them to confirm, and send their reference.`}
          primary={{ label: "Ask them to confirm", go: () => setCompose("confirm") }}
        />
      ) : l.status === "declined" ? (
        <Act
          mode={mode}
          text={l.requests[l.requests.length - 1]?.reply?.read.note ?? `${who?.name ?? "They"} cannot do it.`}
          primary={{ label: "Find another", go: () => onFindAnother(l.kind, l.on) }}
          secondary={{ label: "Ask again", go: () => setCompose("availability") }}
        />
      ) : l.status === "confirmed" && l.confirmation ? (
        <ConfirmBanner show>
          Confirmed, ref {l.confirmation.ref}. {l.confirmation.by === "traveller" ? "Booked by the travellers." : `Accepted by ${personName[l.confirmation.by]} on ${l.confirmation.at}${l.confirmation.source ? `, from “${l.confirmation.source}”` : ""}.`}
        </ConfirmBanner>
      ) : null}

      {/* by hand: a confirmation that came by phone; and taking an idea off the trip */}
      {edit && !l.suggested && !compose && !reply && open && !blocked && l.kind !== "note" && (
        byHand ? (
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor={`ref-${l.id}`}>Their reference</Label>
            <div className="flex items-center gap-[var(--space-2)]">
              <Input id={`ref-${l.id}`} size="sm" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="As they gave it" />
              <Button size="sm" variant="secondary" disabled={!ref.trim()} onClick={() => { d({ type: "lineSet", id: l.id, patch: { status: "confirmed", holdUntil: undefined, confirmation: { ref: ref.trim(), by: s.role, at: stamp().slice(0, 6), source: "by hand" } } }); setByHand(false); }}>
                Mark confirmed
              </Button>
            </div>
            <p className="type-meta">Recorded with your name and today&apos;s date.</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-[var(--space-2)]">
            <Button size="sm" variant="tertiary" onClick={() => setByHand(true)}>Confirmed by phone?</Button>
            {(l.status === "idea" || l.status === "declined") && (
              <Button size="sm" variant="secondary" onClick={takeItOff}>Take it off the trip</Button>
            )}
          </div>
        )
      )}

      {/* what was asked, and what came back */}
      {l.requests.length > 0 && (
        <div className="flex flex-col gap-[var(--space-3)]">
          <div className="type-meta text-label-tertiary">History</div>
          <ol className="flex flex-col gap-[var(--space-3)]">
            {l.requests.map((r) => (
              <li key={r.id} className="flex flex-col gap-[var(--space-1)]">
                <details className="group">
                  <summary className="cursor-pointer list-none type-data">
                    {r.kind === "confirm" ? "Asked to confirm" : r.kind === "chase" ? "Chased" : "Asked"} {(who?.email === r.to ? who.name : r.to).replace(/ reservations$/, "")} · <span className="tnum">{r.sentAt}</span>
                    <span className="ml-1 type-meta group-open:hidden">Show</span>
                  </summary>
                  <p className="mt-[var(--space-2)] whitespace-pre-line rounded-md bg-sunken p-[var(--space-3)] type-meta">{r.text}</p>
                </details>
                {r.reply ? (
                  <p className="type-meta">
                    Reply {r.reply.at}: {r.reply.read.status === "held" ? `held until ${shortDate(r.reply.read.until ?? TODAY)}` : r.reply.read.status}{r.reply.read.ref ? `, ref ${r.reply.read.ref}` : ""}
                    {r.reply.accepted ? ` · accepted by ${personName[r.reply.accepted.by]}, ${r.reply.accepted.at}` : " · not accepted yet"}
                  </p>
                ) : (
                  <p className="type-meta">No reply yet.</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

type Go = { label: string; go: () => void };

/* The acts a state allows, as this mode draws them: live in the lab, drawn and marked
   outside it (COL-09: a control that does nothing is never dressed as one that does),
   absent for the owner. */
function Acts({ mode, primary, secondary }: { mode: Mode; primary?: Go; secondary?: Go }) {
  if (mode === "read" || (!primary && !secondary)) return null;
  return (
    <div className="flex flex-wrap items-center gap-[var(--space-2)]">
      {mode === "edit" ? (
        <>
          {primary && <Button size="sm" onClick={primary.go}>{primary.label}</Button>}
          {secondary && <Button size="sm" variant="secondary" onClick={secondary.go}>{secondary.label}</Button>}
        </>
      ) : (
        <>
          {primary && <SchematicAction>{primary.label}</SchematicAction>}
          {secondary && <SchematicAction>{secondary.label}</SchematicAction>}
        </>
      )}
    </div>
  );
}

function Act({ mode, text, primary, secondary }: { mode: Mode; text: string; primary?: Go; secondary?: Go }) {
  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      <p className="type-data text-label-secondary">{text}</p>
      <Acts mode={mode} primary={primary} secondary={secondary} />
    </div>
  );
}

/* ── the request: drafted, read, edited, sent by hand ─────────────────────────────── */
function Composer({ l, trip, kind, to, onDone }: {
  l: TripLine; trip: Trip; kind: LineRequest["kind"]; to: { name: string; email: string } | null; onDone: () => void;
}) {
  const { s, d } = useDemo();
  const [text, setText] = useState(() => draftRequest(l, kind, `${personName[s.role]}${s.role === "user" ? ", Paris desk" : ""}`, trip));
  if (!to) return null;
  const send = () => {
    d({
      type: "lineSend", id: l.id,
      request: {
        id: `${l.id}-r${l.requests.length + 1}-${Date.now().toString(36)}`, kind, sentAt: stamp(), sentOn: TODAY,
        to: to.email, text, by: s.role, replyAt: Date.now() + (kind === "chase" ? 4000 : 6000),
      },
    });
    onDone();
  };
  return (
    <div className="flex flex-col gap-[var(--space-2)]" data-agent-target={`compose-${l.id}`}>
      <Label htmlFor={`draft-${l.id}`}>{kind === "confirm" ? "Ask them to confirm" : kind === "chase" ? "The chase" : "The request"}</Label>
      <p className="-mt-[var(--space-1)] type-meta">To {to.name} · {to.email}</p>
      <Textarea id={`draft-${l.id}`} value={text} onChange={(e) => setText(e.target.value)} className="min-h-56" />
      <div className="mt-[var(--space-2)] flex flex-wrap items-center justify-end gap-[var(--space-2)]">
        <Button size="sm" variant="secondary" onClick={onDone}>Discard</Button>
        <Button size="sm" onClick={send} disabled={!text.trim()}>Send</Button>
      </div>
      <p className="type-meta">Sends once, on this click. The reply lands in Forwarded mail and waits here for you.</p>
    </div>
  );
}

/* ── adding a line: from the agency's records, or by hand ──────────────────────────
   The checks run at the moment of choice, where DEC-27 put them, through the one gate
   (VIS-099): a record closed by a Critical notice says so in the words the trip uses and
   cannot be added; an Important notice and a taste it argues with warn and do not block;
   a window closing is said in money's words, for those who see money. "Find another"
   (a taste, a refusal) opens here on that day, with that kind, in the trip's places. */
function AddSheet({ trip, adding, onClose, onAdded }: {
  trip: Trip; adding: Adding; onClose: () => void; onAdded: (id: string) => void;
}) {
  const { s, d } = useDemo();
  const money = canViewCommissions(s);
  const days = daysOf(trip);
  const [from, setFrom] = useState<"records" | "own">("records");
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<string | null>(null);
  const [kind, setKind] = useState<LineKind>("stay");
  const [on, setOn] = useState(days[0] ?? TODAY);
  const [nights, setNights] = useState("1");
  const [time, setTime] = useState("");
  const [what, setWhat] = useState("");
  const [supplier, setSupplier] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState<string | null>(null);

  /* Each opening starts from what asked for it: a gap asks for a stay on its night. */
  const key = adding ? `${adding.kind ?? ""}-${adding.on ?? ""}-${adding.replace ?? ""}` : "closed";
  const [seen, setSeen] = useState(key);
  if (key !== seen) {
    setSeen(key);
    setFrom(adding?.kind && adding.kind !== "stay" && !adding.replace ? "own" : "records");
    setKind(adding?.kind ?? "stay");
    setOn(adding?.on ?? days[0] ?? TODAY);
    setPick(null); setQ(""); setWhat(""); setSupplier(""); setEmail(""); setTime(""); setNights("1"); setProgram(null);
  }

  const replacing = adding?.replace ? linesOf(s.tripLines, trip.id).find((l) => l.id === adding.replace) : undefined;
  const swap = !!replacing?.suggested;
  const results = useMemo(() => {
    const here = (c: string) => trip.destinations.some((dest) => c.toLowerCase().includes(dest.toLowerCase()));
    return products
      .filter((p) => p.category !== "Rep firm" && p.status !== "Closed")
      .filter((p) => p.id !== replacing?.productId)
      /* finding another stay: the trip's places, hotels first, unless she searches wider */
      .filter((p) => !replacing || q.trim() || (here(p.city) && (replacing.kind !== "stay" || p.category === "Hotel")))
      .filter((p) => !q.trim() || `${p.name} ${p.city} ${p.country}`.toLowerCase().includes(q.trim().toLowerCase()))
      .sort((a, b) => Number(here(b.city)) - Number(here(a.city)) || a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [q, trip.destinations, replacing]);
  const chosen = pick ? productById(pick) : undefined;
  const block = chosen ? blockOf(s, chosen.id) : null;
  const caution = chosen ? cautionOf(s, chosen.id, on) : null;
  const taste = chosen ? tasteClash(trip.traveller, chosen.id) : null;
  const maxNights = Math.max(1, days.length - 1 - days.indexOf(on));

  /* the line it replaces goes (a swap, or another in place of one against their taste) */
  const replace = () => { if (replacing) takeOff(s, d, trip, replacing, { quiet: true }); };

  const add = () => {
    const id = nextId();
    if (from === "records" && chosen) {
      const n = Number(nights);
      const stay = chosen.category === "Hotel" || chosen.category === "Cruise";
      const line: TripLine = {
        id, tripId: trip.id, kind: stay ? "stay" : "experience", on, until: stay ? addDays(on, n) : undefined, time: stay ? "15:00" : undefined,
        what: stay ? `${chosen.name}, ${numberWord(n)} ${n === 1 ? "night" : "nights"}` : chosen.name,
        productId: chosen.id, program: program ?? chosen.programs[0], status: "idea", requests: [],
        sell: stay ? n * 1100 : undefined,
      };
      d({ type: "lineAdd", line });
      replace();
      onAdded(id);
      return;
    }
    const line: TripLine = {
      id, tripId: trip.id, kind, on, time: time || undefined, what: what.trim(),
      supplier: supplier.trim() && email.trim() ? { name: supplier.trim(), email: email.trim() } : undefined,
      status: kind === "note" ? "confirmed" : "idea", requests: [],
    };
    d({ type: "lineAdd", line });
    replace();
    onAdded(id);
  };

  const DaySelect = (
    <div className="flex flex-col gap-[var(--space-1)]">
      <Label>Day</Label>
      <Select value={on} onValueChange={setOn}>
        <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          {days.map((x, i) => <SelectItem key={x} value={x}>Day {i + 1} · {dayLabel(x)}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Sheet open={!!adding} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{swap ? "Swap the suggestion" : replacing ? `Find another for ${dayLabel(replacing.on)}` : `Add to ${trip.title}`}</SheetTitle>
          <SheetDescription>
            {swap ? "Choose what goes in its place. It starts as an idea, kept."
              : replacing ? `In place of ${replacing.what.split(",")[0]}. It starts as an idea; nobody is asked until you ask.`
              : "A line starts as an idea. Nobody is asked until you ask."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-4)] overflow-y-auto px-[var(--space-6)] pb-[var(--space-6)]">
          <Segmented
            label="Add from"
            value={from}
            onChange={(v) => { setFrom(v); setPick(null); }}
            options={[{ value: "records", label: "From records" }, { value: "own", label: "By hand" }]}
          />

          {from === "records" ? (
            <>
              <label className="field-pill flex h-[var(--control-h-sm)] items-center gap-[var(--space-2)] rounded-full bg-interactive px-[var(--space-3)]">
                <Search className="size-[var(--icon-sm)] text-label-secondary" aria-hidden />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Records in ${trip.destinations.join(", ")}, or anywhere`} aria-label="Search records" className="min-w-0 flex-1 bg-transparent type-data outline-none placeholder:text-label-placeholder" />
              </label>
              <ul className="divide-y divide-hairline">
                {results.map((p) => {
                  const closed = blockOf(s, p.id);
                  const against = tasteClash(trip.traveller, p.id);
                  const on = pick === p.id;
                  return (
                    <li key={p.id} className="row-select">
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => { setPick(on ? null : p.id); setProgram(p.programs[0] ?? null); }}
                        className="block w-full cursor-pointer px-[var(--space-3)] py-[var(--space-2)] text-left"
                      >
                        <span className="block truncate type-data-strong">{p.name}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-[var(--space-1)] type-meta">
                          {p.city}{p.programs.length ? ` · ${p.programs.join(", ")}` : ""}
                          {closed && <Chip tone="crit">Closed to bookings</Chip>}
                          {!closed && against && <Chip tone="warn">Against their taste</Chip>}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {results.length === 0 && <li className="py-[var(--space-2)] type-meta">No record here matches. Search wider, or add it by hand.</li>}
              </ul>
              {chosen && (
                <div className="flex flex-col gap-[var(--space-3)] border-t border-hairline pt-[var(--space-4)]">
                  {block ? (
                    <Blocker title="Closed to bookings">
                      {block.text} <span className="type-meta">{block.by}, {block.openedAt}</span>
                    </Blocker>
                  ) : (
                    <>
                      {taste && <Warning title={`Against ${trip.traveller}'s taste`}>{taste.sentence} You can still add it.</Warning>}
                      {caution && <Warning title="A notice on this property">{caution.text}</Warning>}
                      {DaySelect}
                      {(chosen.category === "Hotel" || chosen.category === "Cruise") && (
                        <div className="flex flex-col gap-[var(--space-1)]">
                          <Label>Nights</Label>
                          <Select value={nights} onValueChange={setNights}>
                            <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: maxNights }, (_, i) => String(i + 1)).map((n) => <SelectItem key={n} value={n}>{n} {n === "1" ? "night" : "nights"}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {chosen.programs.length > 0 && (
                        <div className="flex flex-col gap-[var(--space-2)]">
                          <Label>Programme</Label>
                          <Segmented label="Programme" value={program ?? chosen.programs[0]} onChange={setProgram} options={chosen.programs.map((x) => ({ value: x, label: x }))} />
                          {(() => {
                            const tm = termsFor(chosen.id, program ?? chosen.programs[0]);
                            return tm ? <p className="type-meta">{tm.amenities.join(" · ")}{money ? ` · ${Math.round(tm.rate * 100)}% commission` : ""}</p> : null;
                          })()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <Segmented
                label="Kind"
                value={kind}
                onChange={setKind}
                options={(["transfer", "dining", "experience", "stay", "note"] as LineKind[]).map((k) => ({ value: k, label: KIND[k].label }))}
              />
              <div className="flex flex-col gap-[var(--space-1)]">
                <Label htmlFor="add-what">What</Label>
                <Input id="add-what" size="sm" value={what} onChange={(e) => setWhat(e.target.value)} placeholder={kind === "dining" ? "Dinner, Le Grand Véfour" : kind === "transfer" ? "Car from the hotel to Orly" : "As the traveller would read it"} />
              </div>
              {DaySelect}
              {kind !== "note" && (
                <>
                  <div className="flex flex-col gap-[var(--space-1)]">
                    <Label htmlFor="add-time">Time</Label>
                    <Input id="add-time" size="sm" value={time} onChange={(e) => setTime(e.target.value)} placeholder="20:00" />
                  </div>
                  <div className="flex flex-col gap-[var(--space-1)]">
                    <Label htmlFor="add-supplier">Who to ask</Label>
                    <Input id="add-supplier" size="sm" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Name" />
                    <Input size="sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Their email" />
                  </div>
                </>
              )}
            </>
          )}
        </div>
        {/* Cancel, then the act at the right (VIS-101). */}
        <div className="flex items-center justify-end gap-[var(--space-2)] border-t border-hairline px-[var(--space-6)] py-[var(--space-4)]">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={add} disabled={from === "records" ? !chosen || !!block : !what.trim()}>
            {from === "own" && kind === "note" ? "Add the note" : replacing && !swap ? "Add in its place" : "Add as an idea"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const numberWord = (n: number) => WORDS[n] ?? String(n);
