"use client";
/**
 * Itineraries — the Ledger archetype over every trip, with the worked example
 * (a Document) below it.
 *
 * This is where the briefing's Departures widget expands: a departure is an
 * itinerary with a near date, so ?window=30 is a saved view onto this same list
 * rather than a page of its own (§8).
 */
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, canViewCommissions } from "@/lib/store";
import {
  trips, itinerary, productById, type ItineraryStatus, type Trip,
} from "@/data/seed";
import { PageHeader, SplitPage, PropertyImage } from "@/components/layouts";
import { Chip, Section, SeverityBanner, NarrationNote, SchematicBadge } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, Bed, CarFront, Compass, PlaneTakeoff, Search, Ticket, UtensilsCrossed, X,
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
  const money = canViewCommissions(s.role);
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
            <Chip tone="neutral">
              <span className="tnum">{trips.length}</span> trips
            </Chip>
          </>
        }
      >
        <p className="mt-2 max-w-[62ch] t-body text-muted-foreground">
          A departure is an itinerary with a near date. The briefing&rsquo;s departures widget is this
          list, filtered to the next thirty days.
        </p>
      </PageHeader>

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
      {
          <div className="min-w-0">
            {/* ── filters ── */}
            <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              <FilterChip
                label="All"
                count={STATUSES.reduce((n, st) => n + counts[st], 0)}
                on={status === "all"}
                onClick={() => setStatus("all")}
              />
              {STATUSES.filter((st) => counts[st] > 0).map((st) => (
                <FilterChip
                  key={st}
                  label={st}
                  count={counts[st]}
                  on={status === st}
                  onClick={() => setStatus(status === st ? "all" : st)}
                />
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {near ? (
                <Chip tone="primary" className="pr-1">
                  <span className="text-muted-foreground">Window</span> departing within 30 days
                  <button
                    type="button"
                    aria-label="Remove the 30-day window"
                    onClick={() => setNear(false)}
                    className="grid size-4 cursor-pointer place-items-center rounded-full hover:bg-border"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </Chip>
              ) : (
                <button
                  type="button"
                  onClick={() => setNear(true)}
                  className="cursor-pointer rounded-md border border-border px-3 py-1 t-body text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Departing within 30 days
                </button>
              )}
              <span className="ml-auto t-meta">
                <span className="tnum">{rows.length}</span> {rows.length === 1 ? "trip" : "trips"}
              </span>
            </div>

            {/* ── the ledger ── */}
            {rows.length === 0 ? (
              <Section className="mt-4 py-12 text-center">
                <p className="t-title">No trips under this filter.</p>
                <p className="mx-auto mt-2 max-w-[46ch] t-meta">
                  Nothing is hidden by accident — widen the window or clear the status.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setNear(false);
                    setStatus("all");
                  }}
                >
                  Show every trip
                </Button>
              </Section>
            ) : (
              <Section flush className="mt-4" bodyClassName="p-0">
                <ul>
                <li className="row-grid px-4 t-micro uppercase tracking-widest text-muted-foreground">
                  <span className="row-primary">Trip</span>
                  <span className="row-meta">Dates</span>
                  <span className="row-trailing">Departs</span>
                </li>
                {rows.map((t) => (
                  <li key={t.id} className="border-t border-border">
                    <button
                      type="button"
                      onClick={() => setSelected(t.id)}
                      aria-pressed={selected === t.id}
                      className={cn(
                        "row-grid w-full cursor-pointer px-4 text-left transition-colors",
                        selected === t.id ? "bg-muted/70" : "hover:bg-muted/40",
                      )}
                    >
                      <span className="row-primary">
                        <span className="block truncate t-body font-semibold">{t.title}</span>
                        <span className="block truncate t-meta">
                          {t.traveller} · {t.destinations.join(", ")}
                        </span>
                      </span>
                      <span className="row-meta flex items-center gap-2 t-meta">
                        {t.alert && <Chip tone="warn">{t.alert}</Chip>}
                        <span className="tnum">
                          {t.dates} · {t.nights}n
                        </span>
                      </span>
                      <span className="row-trailing flex items-center gap-2">
                        <Chip tone={statusTone(t.status)}>{t.status}</Chip>
                        <span className="tnum t-meta">
                          {t.startsInDays === null ? "—" : `in ${t.startsInDays}d`}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
                </ul>
              </Section>
            )}

            <p className="mt-3 t-meta">
              <span className="tnum">{rows.length}</span> of{" "}
              <span className="tnum">{trips.length}</span> trips shown · sorted by days to departure
            </p>
          </div>
      }

      {/* ── the worked example, beneath the ledger ── */}
      <WorkedExample money={money} />
    </SplitPage>
  );
}

function FilterChip({
  label, count, on, onClick,
}: { label: string; count: number; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-1 t-body transition-colors",
        on
          ? "border-foreground bg-foreground font-semibold text-background"
          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
      <span className="tnum t-micro opacity-70">{count}</span>
    </button>
  );
}

/* ── the trip, in summary ───────────────────────────────────────────────────── */
function TripPanel({ t }: { t: Trip }) {
  const linked = t.products.map((id) => productById(id)).filter(Boolean);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="t-title">{t.title}</h2>
        <p className="t-meta">
          {t.traveller} · {t.destinations.join(" · ")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={statusTone(t.status)}>{t.status}</Chip>
        {t.startsInDays !== null && (
          <Chip tone={t.startsInDays <= 14 ? "warn" : "neutral"}>
            departs in <span className="tnum">{t.startsInDays}</span> days
          </Chip>
        )}
        {t.alert && <Chip tone="warn">{t.alert}</Chip>}
      </div>

      <dl className="rounded-md border border-border p-4 t-body">
        <div className="flex items-baseline justify-between gap-3 py-1">
          <dt className="text-muted-foreground">Dates</dt>
          <dd className="tnum text-right">{t.dates}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 py-1">
          <dt className="text-muted-foreground">Nights</dt>
          <dd className="tnum text-right">{t.nights}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 py-1">
          <dt className="text-muted-foreground">Destinations</dt>
          <dd className="text-right">{t.destinations.join(", ")}</dd>
        </div>
      </dl>

      {t.checklist && (
        <div>
          <Progress value={(t.checklist.done / t.checklist.of) * 100} className="h-1.5" />
          <p className="mt-2 t-meta">
            Departure checklist{" "}
            <span className="tnum">
              {t.checklist.done}/{t.checklist.of}
            </span>
          </p>
        </div>
      )}

      <div>
        <h3 className="t-micro uppercase tracking-widest text-muted-foreground">Linked products</h3>
        <ul className="mt-2 space-y-2">
          {linked.map((p) =>
            p ? (
              <li key={p.id}>
                <Link
                  href={`/records/${p.id}`}
                  className="flex items-center gap-3 rounded-md border border-border p-2 transition-colors hover:bg-muted/50"
                >
                  <span className="size-8 shrink-0 overflow-hidden rounded-md border border-border">
                    <PropertyImage id={p.id} name={p.name} category={p.category} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate type-data-strong">{p.name}</span>
                    <span className="block truncate t-meta">
                      {p.city} · {p.country}
                    </span>
                  </span>
                </Link>
              </li>
            ) : null,
          )}
          {linked.length === 0 && (
            <li className="t-meta">No record is linked to this trip yet.</li>
          )}
        </ul>
      </div>

      {t.travellerId && (
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/travellers/${t.travellerId}`}>
            Open the traveller <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </Button>
      )}
    </div>
  );
}

/* ── the worked example — a Document, deliberately schematic ─────────────────── */
function WorkedExample({ money }: { money: boolean }) {
  const [added, setAdded] = useState(false);
  const [openDay, setOpenDay] = useState(1);
  const day = itinerary.days.find((d) => d.n === openDay) ?? itinerary.days[0];
  const builtDays = itinerary.days.map((d) => d.n);

  return (
    <section className="mt-8 border-t border-border pt-8">
      <header className="mb-4">
        <h2 className="flex flex-wrap items-center gap-2 t-title">
          {itinerary.title} — the day board
          <Chip tone="neutral">{itinerary.status}</Chip>
          <SchematicBadge />
        </h2>
        <p className="mt-2 t-meta">
          {itinerary.client} · <span className="tnum">{itinerary.dates}</span> · shared with{" "}
          {itinerary.sharedWith} · saved 12:04
        </p>
      </header>

      <NarrationNote>
        The itinerary surface is deliberately schematic. It exists to show where record intelligence
        lands: programme chips, incentive windows, and the preference warning at the moment of
        selection.
      </NarrationNote>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {/* Day tabs */}
          <div role="tablist" aria-label="Itinerary days" className="flex gap-1">
            {[1, 2, 3].map((n) => {
              const built = builtDays.includes(n);
              const on = n === openDay;
              return (
                <button
                  key={n}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  disabled={!built}
                  onClick={() => setOpenDay(n)}
                  className={cn(
                    "rounded-md px-3 py-1 t-body transition-colors",
                    on
                      ? "border border-border bg-card font-semibold"
                      : built
                        ? "cursor-pointer text-muted-foreground hover:text-foreground"
                        : "cursor-not-allowed text-muted-foreground/50",
                  )}
                >
                  Day {n}
                </button>
              );
            })}
          </div>

          <Section className="p-0">
            <ul className="divide-y divide-border">
              {day.events.map((e) => {
                const Icon = eventIcon(e.type);
                return (
                  <li key={e.title} className="row-grid px-4">
                    <span className="row-primary flex items-center gap-3">
                      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0">
                        <span className="block truncate type-data-strong">{e.title}</span>
                        <span className="block truncate t-meta">
                          {e.type} · {e.note}
                        </span>
                      </span>
                    </span>
                    <span className="row-meta flex flex-wrap gap-2">
                      {"chips" in e && e.chips
                        ? e.chips.map((c) =>
                            money || !c.startsWith("+") ? (
                              <Chip key={c} tone={c.startsWith("+") ? "primary" : "neutral"}>
                                {c}
                              </Chip>
                            ) : null,
                          )
                        : null}
                    </span>
                    <span className="row-trailing tnum t-meta">{e.time}</span>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-4 border-t border-border p-4">
              {EVENT_TYPES.map(({ type, icon: Icon }) => (
                <span key={type} className="inline-flex items-center gap-2 t-micro text-muted-foreground">
                  <Icon className="size-3.5" aria-hidden />
                  {type}
                </span>
              ))}
            </div>
          </Section>

          {/* Preference conflict — warn, not block */}
          <SeverityBanner severity="Important">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0">
                <b>{itinerary.ideaConflict.title}</b> — {itinerary.ideaConflict.conflict}.
              </span>
              <span className="ml-auto" />
              <Chip tone="warn">preference conflict</Chip>
              <Link
                href="/travellers/s-marchetti"
                className="type-data-strong text-primary underline underline-offset-2"
              >
                {itinerary.ideaConflict.action}
              </Link>
            </div>
            <p className="mt-2 t-meta">A warning, not a block — proceeding is possible and recorded.</p>
          </SeverityBanner>
        </div>

        <div className="space-y-4">
          <Section title="Add from records">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input readOnly value="kaiseki" className="h-8 pl-8 t-body" aria-label="Search records" />
            </div>
            <p className="mt-2 t-meta">Matches in records — verified first.</p>
            <div className="mt-2 space-y-2">
              {itinerary.addFromRecords.map((r, i) => (
                <div
                  key={r.name}
                  className={cn(
                    "rounded-md p-4",
                    i === 0 ? "border border-primary/40 bg-card" : "border border-border bg-subtle",
                  )}
                >
                  <div className="t-body font-semibold">{r.name}</div>
                  <div className="t-meta">{r.meta}</div>
                  {"primary" in r && r.primary ? (
                    added ? (
                      <div className="mt-2">
                        <Chip tone="ok">added to Day 1 · draft</Chip>
                      </div>
                    ) : (
                      <Button size="sm" className="mt-2 w-full" onClick={() => setAdded(true)}>
                        Add to Day 1
                      </Button>
                    )
                  ) : null}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Why the warning appeared">
            <p className="flex gap-2 t-meta">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-warn" aria-hidden />
              Hôtel Verlaine is tagged contemporary design in the record. The traveller profile holds
              a preference for classic interiors on three sources. The product does not remove the
              property — it says what it found and offers a swap.
            </p>
          </Section>
        </div>
      </div>
    </section>
  );
}
