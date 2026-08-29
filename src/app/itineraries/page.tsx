"use client";
/** Itinerary — schematic-badged (Journey F/E adjacency, itinerary plate). Day board + add-from-records rail. */
import { useState } from "react";
import Link from "next/link";
import { useDemo, canViewCommissions } from "@/lib/store";
import { itinerary } from "@/data/seed";
import { Chip, Section, PageHeader, SeverityBanner, NarrationNote, SchematicBadge } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bed, CarFront, Search, UtensilsCrossed } from "lucide-react";

const eventIcon: Record<string, React.ElementType> = {
  Transfer: CarFront,
  Accommodation: Bed,
  Dining: UtensilsCrossed,
};

export default function Itineraries() {
  const { s } = useDemo();
  const money = canViewCommissions(s.persona);
  const [added, setAdded] = useState(false);
  const day = itinerary.days[0];

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-6">
      <PageHeader
        crumb={`Itineraries / Marchetti — ${itinerary.title}`}
        title={<>{itinerary.title} <Chip tone="neutral">{itinerary.status}</Chip> <SchematicBadge /></>}
        right={<span className="text-[12px] text-muted-foreground">shared with {itinerary.sharedWith} · saved 12:04</span>}
      >
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Chip tone="neutral">{itinerary.client}</Chip>
          <Chip tone="neutral" className="tnum">{itinerary.dates}</Chip>
        </div>
      </PageHeader>

      <NarrationNote>
        The itinerary surface is deliberately schematic — it exists to show where record intelligence lands: program chips, incentive windows, and the preference warning at the moment of selection.
      </NarrationNote>

      <div className="mt-1 grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* ── Main ── */}
        <div className="min-w-0 space-y-4">
          {/* Day tabs */}
          <div className="flex gap-1">
            {[1, 2, 3].map((n) => (
              <span key={n} className={n === day.n
                ? "rounded-md border border-border bg-card px-3 py-1 text-[13px] font-semibold"
                : "px-3 py-1 text-[13px] text-muted-foreground"}>
                Day {n}
              </span>
            ))}
          </div>

          <Section>
            <ul className="divide-y divide-border text-[13.5px]">
              {day.events.map((e) => {
                const Icon = eventIcon[e.type] ?? Bed;
                return (
                  <li key={e.title} className="flex flex-wrap items-center gap-2.5 py-3">
                    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0">
                      <div className="font-medium">{e.title}</div>
                      <div className="text-[11.5px] text-muted-foreground">{e.note}</div>
                    </div>
                    {"chips" in e && e.chips && (
                      <span className="flex flex-wrap gap-1.5">
                        {e.chips.map((c) => (money || !c.startsWith("+") ? <Chip key={c} tone={c.startsWith("+") ? "primary" : "neutral"}>{c}</Chip> : null))}
                      </span>
                    )}
                    <span className="ml-auto text-[13px] text-muted-foreground tnum">{e.time}</span>
                  </li>
                );
              })}
            </ul>
          </Section>

          {/* Idea conflict — warn, not block */}
          <SeverityBanner severity="Important">
            <div className="flex flex-wrap items-center gap-2">
              <div>
                <b>{itinerary.ideaConflict.title}</b> — {itinerary.ideaConflict.conflict}.
              </div>
              <span className="ml-auto" />
              <Chip tone="warn">preference conflict</Chip>
              <Link href="/travellers/s-marchetti" className="text-[12.5px] font-medium text-primary underline underline-offset-2">{itinerary.ideaConflict.action}</Link>
            </div>
            <p className="mt-1 text-[11.5px] text-muted-foreground">A warning, not a block — proceeding is possible and recorded.</p>
          </SeverityBanner>
        </div>

        {/* ── Rail ── */}
        <div className="space-y-4">
          <Section title="Add from records">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input readOnly value="kaiseki" className="h-8 pl-8 text-[13px]" aria-label="Search records" />
            </div>
            <p className="mt-2 text-[11.5px] text-muted-foreground">Matches in records — verified first.</p>
            <div className="mt-2 space-y-2">
              {itinerary.addFromRecords.map((r, i) => (
                <div key={r.name} className={i === 0 ? "rounded-md border border-primary/40 bg-card p-3" : "rounded-md border border-border bg-subtle p-3"}>
                  <div className="text-[13.5px] font-semibold">{r.name}</div>
                  <div className="text-[11.5px] text-muted-foreground">{r.meta}</div>
                  {"primary" in r && r.primary && (
                    added ? (
                      <Chip tone="ok" className="mt-2">added to Day 1 · draft</Chip>
                    ) : (
                      <Button size="sm" className="mt-2 w-full" onClick={() => setAdded(true)}>Add to Day 1</Button>
                    )
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Why the warning appeared">
            <p className="flex gap-1.5 text-[12.5px] text-muted-foreground">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-warn" aria-hidden />
              Hôtel Verlaine is tagged contemporary design in the record. The traveller profile holds a preference for classic interiors on three sources. The product does not remove the property — it says what it found and offers a swap.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
