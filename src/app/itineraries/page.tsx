"use client";
/**
 * Itineraries — the ledger over every trip, recomposed, with one trip opened beneath
 * it as a document (docs/rebuild/04-recomposition-brief.md).
 *
 * Job (evals/contracts.mjs): check a trip is ready to travel. The briefing's
 * Departures widget expands here with `?window=30` already applied — a departure is
 * an itinerary with a near date, not a second data set.
 *
 * Chapters, in order: the ledger (saved views as FilterChips — status, and the 30-day
 * window — selected inverts; the Table with micro-caps heads, 40px rows, hairlines,
 * the selected row's 2px ink edge) · Kyoto & Kansai — the day board (one trip,
 * opened; schematic) · Add from records (preview → grey button) · Why the warning
 * appeared (quiet).
 *
 * The one primary: "Open the trip", at the bottom of the inspector — the tool that
 * follows the selected row (contract: open a trip). There is no trip route in this
 * build, so it lands on the opened trip beneath the ledger. "Open the traveller" is a
 * text action in the inspector's title row; "Add … to Day 1", "Show every trip" and
 * the day tabs are secondary or selected-inverse.
 *
 * No new components: the page's own FilterChip is gone in favour of the shared one.
 */
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDemo, canViewCommissions } from "@/lib/store";
import {
  trips, itinerary, productById, type ItineraryStatus, type Trip,
} from "@/data/seed";
import { PageHeader, SplitPage, PropertyImage } from "@/components/layouts";
import {
  Chip, EmptyState, Section, SeverityBanner, NarrationNote, SchematicBadge, FilterChip,
  Rows, Row, RowStack, DataList, StatusDot,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight, Bed, CarFront, Compass, PlaneTakeoff, Search, Ticket, UtensilsCrossed,
} from "lucide-react";

/* The pipeline, in its own order. */
const STATUSES: ItineraryStatus[] = [
  "Inbound", "Planning", "Booked", "Traveling", "Traveled", "Cancelled",
];

const statusTone = (s: ItineraryStatus) =>
  s === "Booked" || s === "Traveling"
    ? "ok"
    : s === "Cancelled"
      ? "crit"
      : s === "Planning" || s === "Inbound"
        ? "primary"
        : "neutral";

/* Five event types, five marks. The board draws whichever the day holds. */
const EVENT_TYPES = [
  { type: "Transfer", icon: CarFront },
  { type: "Accommodation", icon: Bed },
  { type: "Dining", icon: UtensilsCrossed },
  { type: "Activity", icon: Ticket },
  { type: "Flight", icon: PlaneTakeoff },
] as const;

const eventIcon = (type: string) =>
  EVENT_TYPES.find((e) => e.type === type)?.icon ?? Compass;

export default function ItinerariesPage() {
  return (
    <Suspense fallback={null}>
      <Itineraries />
    </Suspense>
  );
}

function Itineraries() {
  const { s } = useDemo();
  const money = canViewCommissions(s);
  const search = useSearchParams();

  /* The Departures widget arrives with its view already applied. */
  const windowParam = search?.get("window") ?? null;
  const [near, setNear] = useState(() => windowParam === "30");
  const [status, setStatus] = useState<ItineraryStatus | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const rows = useMemo(() => {
    let list = [...trips];
    if (near) list = list.filter((t) => t.startsInDays !== null && t.startsInDays <= 30);
    if (status !== "all") list = list.filter((t) => t.status === status);
    return list.sort((a, b) => {
      const av = a.startsInDays ?? Number.MAX_SAFE_INTEGER;
      const bv = b.startsInDays ?? Number.MAX_SAFE_INTEGER;
      return av - bv;
    });
  }, [near, status]);

  const counts = useMemo(() => {
    const base = near ? trips.filter((t) => t.startsInDays !== null && t.startsInDays <= 30) : trips;
    const c = {} as Record<ItineraryStatus, number>;
    for (const st of STATUSES) c[st] = 0;
    for (const t of base) c[t.status] += 1;
    return c;
  }, [near]);

  const active = selected ? rows.find((t) => t.id === selected) : undefined;

  const header = (
    <>
      <PageHeader
        title={
          <>
            Itineraries
            {/* Counts what is on screen, so the title agrees with the list under it. */}
            <Chip tone="neutral">
              <span className="tnum">{rows.length}</span>
              {rows.length === trips.length ? " trips" : ` of ${trips.length} trips`}
            </Chip>
          </>
        }
      />

      <NarrationNote>
        Departures are not a second data set. The widget expands into the surface that already holds
        the trips, with the view applied — which is what makes the briefing proof that the underlying
        surfaces are real.
      </NarrationNote>
    </>
  );

  return (
    <SplitPage
      header={header}
      panelOpen={!!active}
      onClosePanel={() => setSelected(null)}
      panelTitle={active?.title ?? "Trip"}
      panel={active ? <TripPanel t={active} /> : null}
    >
      <Section>
        {/* ── saved views: status, and the 30-day window ── */}
        <div className="flex flex-wrap items-center gap-[var(--space-2)]">
          <FilterChip
            selected={status === "all"}
            onClick={() => setStatus("all")}
            count={STATUSES.reduce((n, st) => n + counts[st], 0)}
          >
            All
          </FilterChip>
          {STATUSES.filter((st) => counts[st] > 0).map((st) => (
            <FilterChip
              key={st}
              selected={status === st}
              onClick={() => setStatus(status === st ? "all" : st)}
              count={counts[st]}
            >
              {st}
            </FilterChip>
          ))}
          <span aria-hidden className="mx-[var(--space-1)] h-[var(--control-h-sm)] border-l border-hairline" />
          <FilterChip selected={near} onClick={() => setNear((v) => !v)}>
            Departing within 30 days
          </FilterChip>
        </div>

        {/* ── the ledger ── */}
        {rows.length === 0 ? (
          <EmptyState
            className="mt-[var(--space-4)]"
            title="No trips under this filter."
            body="Nothing is hidden by accident — widen the window or clear the status."
            action={
              <Button variant="secondary" size="sm" onClick={() => { setNear(false); setStatus("all"); }}>
                Show every trip
              </Button>
            }
          />
        ) : (
          <div className="mt-[var(--space-4)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Trip</TableHead>
                  <TableHead className="hidden sm:table-cell">Traveller</TableHead>
                  <TableHead className="hidden lg:table-cell">Destinations</TableHead>
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
                      onClick={() => setSelected(on ? null : t.id)}
                      aria-selected={on}
                      data-state={on ? "selected" : undefined}
                      className="cursor-pointer"
                    >
                      <TableCell className="max-w-[220px] truncate type-data-strong">{t.title}</TableCell>
                      <TableCell className="hidden text-label-secondary sm:table-cell">{t.traveller}</TableCell>
                      <TableCell className="hidden max-w-[220px] truncate text-label-secondary lg:table-cell">
                        {t.destinations.join(", ")}
                      </TableCell>
                      <TableCell className="hidden text-label-secondary tnum md:table-cell">
                        {t.dates} · {t.nights}n
                      </TableCell>
                      <TableCell>
                        {t.alert
                          ? <Chip tone="warn">{t.alert}</Chip>
                          : t.checklist
                            ? <Chip tone="neutral" className="tnum">checklist {t.checklist.done}/{t.checklist.of}</Chip>
                            : <span className="text-label-secondary">—</span>}
                      </TableCell>
                      <TableCell><Chip tone={statusTone(t.status)}>{t.status}</Chip></TableCell>
                      <TableCell className="text-right text-label-secondary tnum">
                        {t.startsInDays === null ? "—" : `in ${t.startsInDays}d`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="mt-[var(--space-3)] type-meta tnum">
          {rows.length} of {trips.length} trips shown · sorted by days to departure
        </p>
      </Section>

      {/* ── one trip, opened — the document beneath the ledger ── */}
      <OpenedTrip money={money} />
    </SplitPage>
  );
}

/* ── the inspector — the tool that follows the selected row ─────────────────────
   The trip in summary, and the one primary at its bottom.                       */
function TripPanel({ t }: { t: Trip }) {
  const linked = t.products.map((id) => productById(id)).filter(Boolean);

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-[var(--space-2)]">
          <h2 className="type-section">{t.title}</h2>
          {t.travellerId && (
            <Button asChild variant="link" size="sm">
              <Link href={`/travellers/${t.travellerId}`}>Open the traveller <ArrowRight aria-hidden /></Link>
            </Button>
          )}
        </div>
        <p className="mt-1 type-meta">
          {t.traveller} · {t.destinations.join(" · ")}
        </p>
        <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-2)]">
          <Chip tone={statusTone(t.status)}>{t.status}</Chip>
          {t.startsInDays !== null && (
            <Chip tone={t.startsInDays <= 14 ? "warn" : "neutral"}>
              departs in <span className="tnum">{t.startsInDays}</span> days
            </Chip>
          )}
          {t.alert && <Chip tone="warn">{t.alert}</Chip>}
        </div>
      </div>

      <DataList
        rows={[
          { label: "Dates", value: <span className="tnum">{t.dates}</span> },
          { label: "Nights", value: <span className="tnum">{t.nights}</span> },
          { label: "Destinations", value: t.destinations.join(", ") },
        ]}
      />

      {t.checklist && (
        <div>
          <div className="flex items-baseline justify-between gap-[var(--space-3)]">
            <span className="type-data">Departure checklist</span>
            <span className="type-meta tnum">{t.checklist.done}/{t.checklist.of}</span>
          </div>
          <Progress tone="neutral" value={(t.checklist.done / t.checklist.of) * 100} className="mt-[var(--space-2)]" />
        </div>
      )}

      <div>
        <div className="type-micro-caps text-label-tertiary">Linked records</div>
        <Rows className="mt-[var(--space-2)]">
          {linked.map((p) =>
            p ? (
              <Row key={p.id}>
                <Link
                  href={`/records/${p.id}`}
                  className="row-primary flex items-center gap-[var(--space-3)] underline decoration-hairline underline-offset-4 hover:decoration-ink"
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
            ) : null,
          )}
          {linked.length === 0 && (
            <li className="py-[11px] type-data-read text-label-secondary">No record is linked to this trip yet.</li>
          )}
        </Rows>
      </div>

      <Button asChild className="w-full">
        <a href="#opened-trip">Open the trip <ArrowRight aria-hidden /></a>
      </Button>
    </div>
  );
}

/* ── one trip, opened — deliberately schematic ─────────────────────────────────
   It exists to show where record intelligence lands: programme chips, incentive
   windows, and the preference warning at the moment of selection.              */
function OpenedTrip({ money }: { money: boolean }) {
  const [added, setAdded] = useState(false);
  const [openDay, setOpenDay] = useState(1);
  const day = itinerary.days.find((d) => d.n === openDay) ?? itinerary.days[0];
  const builtDays = itinerary.days.map((d) => d.n);
  const suggested = itinerary.addFromRecords.find((r) => "primary" in r && r.primary) ?? itinerary.addFromRecords[0];

  return (
    <div id="opened-trip" className="min-w-0">
      <Section
        deep
        title={
          <>
            {itinerary.title} — the day board
            <Chip tone="neutral">{itinerary.status}</Chip>
            <SchematicBadge />
          </>
        }
      >
        <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data-read text-label-secondary">
          One trip, opened. {itinerary.client} · <span className="tnum">{itinerary.dates}</span> · shared with{" "}
          {itinerary.sharedWith} · saved 12:04
        </p>

        <NarrationNote>
          The itinerary surface is deliberately schematic. It exists to show where record intelligence
          lands: programme chips, incentive windows, and the preference warning at the moment of
          selection.
        </NarrationNote>

        <Tabs value={String(openDay)} onValueChange={(v) => setOpenDay(Number(v))} className="mt-[var(--space-3)]">
          <TabsList aria-label="Itinerary days">
            {[1, 2, 3].map((n) => (
              <TabsTrigger key={n} value={String(n)} disabled={!builtDays.includes(n)}>
                Day {n}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Rows className="mt-[var(--space-3)]">
          {day.events.map((e) => {
            const Icon = eventIcon(e.type);
            return (
              <RowStack
                key={e.title}
                head={
                  <>
                    <span className="flex min-w-0 items-center gap-[var(--space-2)]">
                      <Icon className="size-[var(--icon-md)] shrink-0 text-label-secondary" aria-hidden />
                      <span className="truncate type-data-strong">{e.title}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-[var(--space-2)]">
                      {"chips" in e && e.chips
                        ? e.chips.map((c) =>
                            money || !c.startsWith("+") ? (
                              <Chip key={c} tone={c.startsWith("+") ? "primary" : "neutral"}>{c}</Chip>
                            ) : null,
                          )
                        : null}
                      <span className="type-meta tnum">{e.time}</span>
                    </span>
                  </>
                }
              >
                {e.type} · {e.note}
              </RowStack>
            );
          })}
        </Rows>

        <p className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-4)] type-micro text-label-secondary">
          {EVENT_TYPES.map(({ type, icon: Icon }) => (
            <span key={type} className="inline-flex items-center gap-[var(--space-1)]">
              <Icon className="size-[var(--icon-sm)]" aria-hidden />
              {type}
            </span>
          ))}
        </p>

        {/* Preference conflict — warn, not block */}
        <div className="mt-[var(--space-4)]">
          <SeverityBanner severity="Important">
            <div className="flex flex-wrap items-center gap-[var(--space-2)]">
              <span className="min-w-0">
                <b>{itinerary.ideaConflict.title}</b> — {itinerary.ideaConflict.conflict}.
              </span>
              <span className="ml-auto" />
              <Chip tone="warn">preference conflict</Chip>
              <Button asChild variant="link" size="sm">
                <Link href="/travellers/s-marchetti">{itinerary.ideaConflict.action}</Link>
              </Button>
            </div>
            <p className="mt-[var(--space-2)] type-meta">A warning, not a block — proceeding is possible and recorded.</p>
          </SeverityBanner>
        </div>
      </Section>

      <Section title="Add from records" deep>
        <div className="relative max-w-sm">
          <Search
            className="pointer-events-none absolute left-[10px] top-1/2 size-[var(--icon-md)] -translate-y-1/2 text-label-tertiary"
            aria-hidden
          />
          <Input readOnly size="sm" value="kaiseki" className="pl-8" aria-label="Search records" />
        </div>
        <p className="mt-[var(--space-2)] type-meta">Matches in records — verified first.</p>
        <Rows className="mt-[var(--space-3)]">
          {itinerary.addFromRecords.map((r) => (
            <Row key={r.name}>
              <span className="row-primary type-data-strong">{r.name}</span>
              <span className="row-trailing type-meta">{r.meta}</span>
            </Row>
          ))}
        </Rows>
        <div className="mt-[var(--space-3)]">
          {added ? (
            <Chip tone="ok">{suggested.name} added to Day 1 · draft</Chip>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setAdded(true)}>
              Add {suggested.name} to Day 1
            </Button>
          )}
        </div>
      </Section>

      <Section title="Why the warning appeared" quiet deep>
        <p className="max-w-[60ch] type-data-read text-label-secondary">
          <StatusDot tone="warn">Preference conflict</StatusDot> — Hôtel Verlaine is tagged contemporary
          design in the record. The traveller profile holds a preference for classic interiors on 3
          sources. The product does not remove the property — it says what it found and offers a swap.
        </p>
      </Section>
    </div>
  );
}
