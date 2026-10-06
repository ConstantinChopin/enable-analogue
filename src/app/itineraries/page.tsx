"use client";
/**
 * Itineraries — the ledger over every trip (docs/rebuild/04-recomposition-brief.md).
 *
 * Job (evals/contracts.mjs): check a trip is ready to travel. The briefing's
 * Departures widget expands here with `?window=30` already applied — a departure is
 * an itinerary with a near date, not a second data set.
 *
 * 2026-09-28 (UX sweep COL-01, NAV-02, COL-04, NAV-01/03, COL-02/06/07; VIS-095, VIS-096,
 * VIS-098). A directory never renders one item's body under the list: the Kyoto "day
 * board" that sat here (always Kyoto whatever row was chosen, a Draft the ledger called
 * Booked, three day tabs for seven nights, a Paris hotel as a Japan idea) is gone with its
 * seed. Every trip opens on its own page, /itineraries/[id], in and out of the lab.
 *
 *   title row   the name, one count, "New trip" (in the lab, where trips are built)
 *   toolbar     the status switch, the 30-day window and search; what is shown and its
 *               true order at the right. All of it, and the selection, lives in the URL.
 *   ledger      a row click selects and opens the inspector; Enter or a double-click
 *               opens the trip. Readiness is a column: the trip's most urgent check in
 *               a few words (src/lib/trip-checks.ts), claret only for a closed line.
 *   inspector   "Open ↗" to the trip; the body is what the row cannot show (where the
 *               lines stand, the checks, who can see it, the records); the footer is the
 *               trip's one next act.
 *
 * Who sees what (VIS-098): the owner sees a trip only once its traveller is shared with
 * her; otherwise it is absent here, not locked, and the count counts only what she sees.
 */
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDemo, type DemoState } from "@/lib/store";
import { NewTripButton } from "@/components/new-trip";
import { audienceLabel } from "@/components/share-sheet";
import { linesOf } from "@/data/trip-lines";
import {
  tripChecks, tallyOf, readinessOf, visibleTrips, tripShareOf, takeOff, attentionFor, type Check,
} from "@/lib/trip-checks";
import { productById, type ItineraryStatus, type Trip } from "@/data/seed";
import {
  PageHeader, SplitPage, PropertyImage, ListToolbar, ListSearch, useQueryState,
} from "@/components/layouts";
import { Chip, EmptyState, FilterChip, Rows, Row, DataList } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowRight } from "lucide-react";

/* The pipeline, in its own order. */
const STATUSES: ItineraryStatus[] = [
  "Inbound", "Planning", "Booked", "Traveling", "Traveled", "Cancelled",
];

/* A status is a state, not a severity: in progress reads stronger, the rest neutral
   (colour means severity only, VIS-097). */
const statusTone = (s: ItineraryStatus) => (s === "Planning" || s === "Inbound" ? "primary" : "neutral");

const near = (t: Trip) => t.startsInDays !== null && t.startsInDays <= 30;
const matches = (t: Trip, q: string) =>
  !q || `${t.title} ${t.traveller} ${t.destinations.join(" ")}`.toLowerCase().includes(q.toLowerCase());

export default function ItinerariesPage() {
  return (
    <Suspense fallback={null}>
      <Itineraries />
    </Suspense>
  );
}

function ReadinessChip({ s, t }: { s: DemoState; t: Trip }) {
  const r = readinessOf(s, t);
  if (!r) return <span className="text-label-secondary">—</span>;
  return <Chip tone={r.tone} className="tnum">{r.text}</Chip>;
}

function Itineraries() {
  const { s } = useDemo();
  const router = useRouter();

  /* The list's lenses and its selection are in the URL (VIS-096): Back from a trip
     restores the list as it was left, and a selection can be linked. */
  const [status, setStatus] = useQueryState("status", "all");
  const [windowQ, setWindow] = useQueryState("window");
  const [q, setQ] = useQueryState("q");
  const [selected, setSelected] = useQueryState("trip");
  const soon = windowQ === "30";

  const all = useMemo(() => visibleTrips(s), [s]);
  const rows = useMemo(() => {
    let list = all.filter((t) => matches(t, q));
    if (soon) list = list.filter(near);
    if (status !== "all") list = list.filter((t) => t.status === status);
    /* The stated order is the true one: soonest departure first, trips already
       travelled (no departure) last, then by name. */
    return list.sort((a, b) =>
      (a.startsInDays ?? Number.MAX_SAFE_INTEGER) - (b.startsInDays ?? Number.MAX_SAFE_INTEGER) || a.title.localeCompare(b.title));
  }, [all, q, soon, status]);

  const counts = useMemo(() => {
    const base = all.filter((t) => matches(t, q) && (!soon || near(t)));
    const c = {} as Record<ItineraryStatus, number>;
    for (const st of STATUSES) c[st] = 0;
    for (const t of base) c[t.status] += 1;
    return { by: c, total: base.length };
  }, [all, q, soon]);

  const active = selected ? rows.find((t) => t.id === selected) : undefined;
  /* The footer holds the trip's next act only when there is one, and never for the owner:
     she reads a shared trip, she does not work it (06 §7). */
  const next = active && s.role === "user" && tripChecks(s, active).length > 0;
  const open = (t: Trip) => router.push(`/itineraries/${t.id}`);
  const filtered = rows.length !== all.length;

  const header = (
    <PageHeader
      title="Itineraries"
      count={`${all.length} ${all.length === 1 ? "trip" : "trips"}`}
      create={<NewTripButton />}
    />
  );

  return (
    <SplitPage
      header={header}
      panelOpen={!!active}
      onClosePanel={() => setSelected(null)}
      panelTitle={active?.title ?? "Trip"}
      openHref={active ? `/itineraries/${active.id}` : undefined}
      panel={active ? <TripPanel t={active} /> : null}
      footer={next && active ? <TripNext t={active} /> : undefined}
    >
      {all.length === 0 ? (
        /* The owner with no traveller shared: nothing here, and nothing about what is not. */
        <EmptyState
          className="mt-[var(--space-4)]"
          title="No trips shared with you"
          body="A trip appears here once the advisor who holds its traveller shares that traveller with you."
        />
      ) : (
        <>
          <ListToolbar
            state={
              <div role="group" aria-label="Status" className="flex flex-wrap items-center gap-[var(--space-2)]">
                <FilterChip selected={status === "all"} onClick={() => setStatus("all")} count={counts.total}>All</FilterChip>
                {STATUSES.filter((st) => counts.by[st] > 0 || status === st).map((st) => (
                  <FilterChip key={st} selected={status === st} onClick={() => setStatus(status === st ? "all" : st)} count={counts.by[st]}>
                    {st}
                  </FilterChip>
                ))}
              </div>
            }
            filters={
              <>
                {/* a hairline between the status switch and the window, so the window does
                    not read as one more status */}
                <span aria-hidden className="h-[var(--control-h-sm)] border-l border-hairline" />
                <FilterChip selected={soon} onClick={() => setWindow(soon ? null : "30")}>
                  Departing within 30 days
                </FilterChip>
              </>
            }
            search={<ListSearch value={q} onChange={(v) => setQ(v)} placeholder="Search trips" />}
            result={`${filtered ? `${rows.length} of ${all.length} · ` : ""}soonest departure first`}
          />

          {rows.length === 0 ? (
            <EmptyState
              className="mt-[var(--space-4)]"
              title="No trips under this filter"
              body="Widen the window, clear the status or the search."
              action={
                <Button variant="secondary" size="sm" onClick={() => router.replace("/itineraries", { scroll: false })}>
                  Show every trip
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Trip</TableHead>
                  <TableHead className="hidden sm:table-cell">Traveller</TableHead>
                  <TableHead className="hidden xl:table-cell">Destinations</TableHead>
                  <TableHead className="hidden md:table-cell">Dates</TableHead>
                  <TableHead>Readiness</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Departs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => {
                  const on = selected === t.id;
                  return (
                    <TableRow
                      key={t.id}
                      data-agent-target={`trip-${t.id}`}
                      onClick={() => setSelected(t.id)}
                      onOpen={() => open(t)}
                      aria-selected={on}
                      data-state={on ? "selected" : undefined}
                    >
                      <TableCell className="max-w-[220px] truncate type-data-strong">{t.title}</TableCell>
                      <TableCell className="hidden text-label-secondary sm:table-cell">{t.traveller}</TableCell>
                      <TableCell className="hidden max-w-[220px] truncate text-label-secondary xl:table-cell">
                        {t.destinations.join(", ")}
                      </TableCell>
                      <TableCell className="hidden text-label-secondary tnum md:table-cell">
                        {t.dates} · {t.nights}n
                      </TableCell>
                      <TableCell><ReadinessChip s={s} t={t} /></TableCell>
                      <TableCell><Chip tone={statusTone(t.status)}>{t.status}</Chip></TableCell>
                      <TableCell className="text-right text-label-secondary tnum">
                        {t.startsInDays === null ? "—" : `in ${t.startsInDays}d`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </SplitPage>
  );
}

/* ── the inspector — what the row cannot show (VIS-096) ─────────────────────────
   Where the lines stand, the checks in rank order, who can see the trip, and the
   records it books. Opening the trip is the header's "Open ↗", never a button here. */
function TripPanel({ t }: { t: Trip }) {
  const { s } = useDemo();
  const lines = linesOf(s.tripLines, t.id).filter((l) => !l.suggested);
  const n = tallyOf(lines);
  const checks = tripChecks(s, t).slice(0, 3);
  const owner = s.role === "owner";
  const records = [...new Set([...t.products, ...lines.map((l) => l.productId).filter(Boolean) as string[]])]
    .map((id) => productById(id))
    .filter((p): p is NonNullable<ReturnType<typeof productById>> => !!p);

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <div>
        <p className="type-meta">
          {t.travellerId ? (
            <Link href={`/travellers/${t.travellerId}`} className="underline decoration-link-rest underline-offset-4 hover:decoration-ink">{t.traveller}</Link>
          ) : t.traveller}
          {" · "}{t.destinations.join(" · ")}
        </p>
        <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-2)]">
          <Chip tone={statusTone(t.status)}>{t.status}</Chip>
          {t.startsInDays !== null && (
            <Chip tone="neutral">departs in <span className="tnum">{t.startsInDays}</span> days</Chip>
          )}
        </div>
      </div>

      <DataList
        rows={[
          { label: "Dates", value: <span className="tnum">{t.dates} · {t.nights} nights</span> },
          lines.length
            ? { label: "Lines", value: <span className="tnum">{n.confirmed} of {n.total} confirmed{n.held ? ` · ${n.held} held` : ""}{n.idea ? ` · ${n.idea} not asked` : ""}</span> }
            : { label: "Lines", value: null, absent: "none on file" },
          { label: "Who can see it", value: owner ? "Shared with you with its traveller" : audienceLabel(tripShareOf(s, t.id), false) },
        ]}
      />

      {/* The checks, in rank order: what stands between this trip and ready. */}
      {lines.length > 0 ? (
        <div>
          <div className="type-meta text-label-tertiary">What needs doing</div>
          {checks.length ? (
            <ul className="mt-[var(--space-2)] divide-y divide-hairline">
              {checks.map((c) => (
                <li key={c.id} className="flex flex-col items-start gap-[var(--space-1)] py-[var(--space-2)]">
                  <span className="type-data">{c.headline}</span>
                  <span className="row-trailing">{c.state && <Chip tone={c.tier === 1 ? c.tone ?? "neutral" : "neutral"}>{c.state}</Chip>}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-[var(--space-2)] type-data text-label-secondary">Nothing on this trip is waiting on you.</p>
          )}
        </div>
      ) : t.checklist ? (
        <div>
          <div className="flex items-baseline justify-between gap-[var(--space-3)]">
            <span className="type-data">Departure checklist</span>
            <span className="type-meta tnum">{t.checklist.done} of {t.checklist.of}</span>
          </div>
          <Progress tone="neutral" value={(t.checklist.done / t.checklist.of) * 100} className="mt-[var(--space-2)]" />
          {t.alert && <p className="mt-[var(--space-2)] type-data text-label-secondary">{t.alert.charAt(0).toUpperCase() + t.alert.slice(1)}.</p>}
        </div>
      ) : null}

      <div>
        <div className="type-meta text-label-tertiary">Records on the trip</div>
        <Rows className="mt-[var(--space-2)]">
          {records.map((p) => (
            <Row key={p.id}>
              <Link
                href={`/records/${p.id}`}
                className="row-primary flex items-center gap-[var(--space-3)] underline decoration-link-rest underline-offset-4 hover:decoration-ink"
              >
                <span className="size-8 shrink-0 overflow-hidden rounded-md bg-sunken">
                  <PropertyImage id={p.id} name={p.name} category={p.category} />
                </span>
                <span className="min-w-0 truncate">
                  <span className="type-data-strong">{p.name}</span>
                  <span className="text-label-secondary"> · {p.city}</span>
                </span>
              </Link>
            </Row>
          ))}
          {records.length === 0 && (
            <li className="py-[11px] type-data text-label-secondary">No record is on this trip yet.</li>
          )}
        </Rows>
      </div>
    </div>
  );
}

/* ── the footer — the trip's one next act, pinned (VIS-096) ─────────────────────
   The most urgent check, and its act. A closed line comes off the trip here, with Undo
   (destructive, never the primary: NAV-09). An act that needs the trip's own tools (a
   request to draft, a stay to add) starts there, in the lab, with that tool open. A
   check that is only looked at is a link to its line. Outside the lab the builder is
   drawn, not wired, so the act is named and the trip is one "Open ↗" away. */
function TripNext({ t }: { t: Trip }) {
  const { s, d } = useDemo();
  const router = useRouter();
  const blocked = attentionFor(s, [t]).find((a) => a.kind === "block");
  const top: Check | undefined = tripChecks(s, t)[0];
  if (!top) return null;

  if (blocked) {
    return (
      <div className="flex flex-col gap-[var(--space-3)]">
        <p className="type-data"><span className="type-data-strong">{blocked.name} is closed to bookings</span> until the property reopens.</p>
        <div>
          <Button variant="secondary" size="sm" onClick={() => takeOff(s, d, t, blocked.line)}>
            Take it off the trip
          </Button>
        </div>
      </div>
    );
  }

  const [verb, line] = (top.action.act ?? "").split(":");
  const lineHref = `/itineraries/${t.id}${top.line ? `?line=${top.line}` : ""}`;
  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      <p className="type-data-strong">{top.headline}</p>
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        {verb === "select" || !s.lab ? (
          <Button asChild variant="link" size="sm">
            <Link href={lineHref}>{verb === "select" ? top.action.label : "See it on the trip"} <ArrowRight aria-hidden /></Link>
          </Button>
        ) : (
          <Button size="sm" onClick={() => router.push(`/itineraries/${t.id}?${line && verb !== "add" ? `line=${line}&` : ""}act=${encodeURIComponent(top.action.act ?? "")}`)}>
            {top.action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
