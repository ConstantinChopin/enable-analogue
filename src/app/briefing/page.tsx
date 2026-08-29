"use client";
/** Briefing room — Journey C EP1, demo beat 1. Pattern-setter screen. */
import Link from "next/link";
import { useDemo, canViewCommissions } from "@/lib/store";
import { briefing, commissions, notices, promotions, commissionEdgeCases, people } from "@/data/seed";
import { Chip, Section, PageHeader, SeverityBanner, NarrationNote, FreshnessDate, SchematicBadge } from "@/components/bits";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays, Plus } from "lucide-react";

export default function Briefing() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s.persona);
  // Departures list soonest-first. For the colleague, unshared travellers are absent — not masked:
  // under the private tier the widget holds no rows at all; under full/basic only the shared VIC shows.
  const departures = [...briefing.departures]
    .sort((a, b) => a.inDays - b.inDays)
    .filter((dep) => s.persona !== "colleague" || (s.shareTier !== "private" && dep.traveller === "S. Marchetti"));
  const activeNotices = notices.filter((n) => {
    if (n.id === "contradict") return false;
    if (s.world === "v1" && n.v1ExpiredOngoing) return false;
    if (s.spaNoticeClosed && n.id === "spa") return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-[980px] px-6 py-6">
      <PageHeader crumb={`Briefing / Paris desk`} title={<>Good morning <Chip tone="neutral">Tuesday 30 July</Chip></>} />

      <NarrationNote>
        The screen the agency asked for by name — “the first thing that you will viewing in the morning.” Pulled forward on the roadmap 2026-03-31 because users named it.
      </NarrationNote>

      {money && (
        <Section className="mt-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-[26px] font-semibold tnum">EUR {briefing.headline.outstanding.toLocaleString("en-GB")}</span>
            <span className="text-[13px] text-muted-foreground">{briefing.headline.note} · EUR {briefing.headline.collectedThisWeek} collected this week</span>
            <span className="ml-auto"><FreshnessDate>synced {briefing.syncedAt} · booking-system figures up to 48h behind</FreshnessDate></span>
          </div>
        </Section>
      )}

      {/* overdue callout */}
      {money && (
        <SeverityBanner severity="Important" className="mt-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <b>Villa Ortensia commission is 12 days overdue.</b>{" "}
              EUR 1,240, due 18 July. A reminder can be drafted and waits for your review. Nothing sends without it.
            </div>
            <Button asChild size="sm" className="ml-auto"><Link href="/commissions/vo">Open commission</Link></Button>
          </div>
        </SeverityBanner>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {money && (
          <Section title="Commissions" chips={<Chip tone="warn">1 overdue</Chip>}>
            <ul className="divide-y divide-border text-[13.5px]">
              {commissions.map((c) => (
                <li key={c.id} className="flex items-center gap-2 py-2">
                  {c.state === "overdue" ? (
                    <Link href={`/commissions/${c.id}`} className="font-medium hover:text-primary">{c.property}</Link>
                  ) : (
                    <span>{c.property}</span>
                  )}
                  <span className="ml-auto tnum">EUR {c.amount.toLocaleString("en-GB")}</span>
                  <Chip tone={c.state === "overdue" ? "crit" : c.state === "paid" ? "ok" : "neutral"}>
                    {c.state === "overdue" ? `overdue ${c.overdueDays}d` : c.state === "paid" ? `paid ${c.paidDate}` : `due ${c.dueDate}`}
                  </Chip>
                </li>
              ))}
            </ul>
            {/* CommissionCalendar — agenda list by decision, not a month grid */}
            <div className="mt-3 border-t border-border pt-2.5">
              <div className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold">
                <CalendarDays className="size-3.5 text-muted-foreground" aria-hidden /> Commission calendar <SchematicBadge />
              </div>
              <ul className="space-y-1.5 text-[12.5px]">
                <li className="flex items-baseline gap-2">
                  <span className="w-12 shrink-0 font-mono text-[11.5px] text-muted-foreground tnum">18 Jul</span>
                  <Link href="/commissions/vo" className="hover:text-primary">Villa Ortensia commission due</Link>
                  <Chip tone="crit" className="ml-auto">overdue</Chip>
                </li>
                <li className="flex items-baseline gap-2">
                  <span className="w-12 shrink-0 font-mono text-[11.5px] text-muted-foreground tnum">05 Sep</span>
                  <span>Villa Ortensia +3% booking window closes</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span className="w-12 shrink-0 font-mono text-[11.5px] text-muted-foreground tnum">12 Sep</span>
                  <span>Atelier upgrade credit booking window closes</span>
                </li>
              </ul>
            </div>
          </Section>
        )}

        <Section title="Departures">
          {departures.length === 0 ? (
            <p className="py-2 text-[13.5px] text-muted-foreground">No departures for travellers shared with you.</p>
          ) : (
          <ul className="divide-y divide-border text-[13.5px]">
            {departures.map((dep) => (
              <li key={dep.traveller} className="flex items-center gap-2 py-2">
                {dep.traveller === "S. Marchetti" ? (
                  <Link href="/travellers/s-marchetti" className="font-medium hover:text-primary">{dep.traveller}</Link>
                ) : (
                  <span>{dep.traveller}</span>
                )}
                <span className="text-muted-foreground">· {dep.trip}</span>
                <span className="ml-auto" />
                {"checklist" in dep && dep.checklist && <Chip tone="primary">checklist {dep.checklist.done}/{dep.checklist.of}</Chip>}
                {"alert" in dep && dep.alert && <Chip tone="warn">{dep.alert}</Chip>}
                <span className="text-muted-foreground tnum">in {dep.inDays}d</span>
              </li>
            ))}
          </ul>
          )}
        </Section>

        <Section title="Notices" chips={s.world === "v1" ? <Chip tone="crit">v1 world</Chip> : undefined}>
          {s.world === "v1" && (
            <SeverityBanner severity="Info" className="mb-2">
              <span className="text-muted-foreground">The spa notice auto-expired on 1 Aug and is gone — while the spa is still closed. This silence is the v1 failure.</span>
            </SeverityBanner>
          )}
          <ul className="divide-y divide-border text-[13.5px]">
            {activeNotices.map((n) => (
              <li key={n.id} className="flex items-center gap-2 py-2">
                <Link href={`/records/${n.productId}`} className="hover:text-primary">
                  <span className="font-medium">{n.productName}</span> — {n.text}
                </Link>
                <span className="ml-auto" />
                <Chip tone={n.severity === "Critical" ? "crit" : n.severity === "Important" ? "warn" : "neutral"}>{n.severity}</Chip>
                {n.staleReviewDue && s.world === "v2" && <Chip tone="warn">review due</Chip>}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link href={{ pathname: "/ask" }} onClick={() => d({ type: "askScope", scope: "Maison Léandre" })}>
                Ask about the spa closure <ArrowRight className="size-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/records/maison-leandre?compose=notice">
                <Plus className="size-3.5" /> New notice
              </Link>
            </Button>
          </div>
        </Section>

        {money && (
          <Section title="Expiring incentives">
            <ul className="divide-y divide-border text-[13.5px]">
              {promotions.map((p) => (
                <li key={p.id} className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.productName}</span>
                    <span>{p.rate}</span>
                    <Chip tone="warn" className="ml-auto">{p.daysLeft} days left</Chip>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                    {p.stacksWithBase ? "bonus — adds to base" : "override — replaces base"} · book by {p.bookingWindowEnd} · travel by {p.travelWindowEnd}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Records verified this quarter">
          <div className="flex items-center gap-3">
            <span className="text-[20px] font-semibold tnum">{briefing.recordsVerified.done}</span>
            <span className="text-[13px] text-muted-foreground">of {briefing.recordsVerified.of} in Paris</span>
          </div>
          <Progress value={(briefing.recordsVerified.done / briefing.recordsVerified.of) * 100} className="mt-2 h-1.5" />
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            Carried forward, unchecked: {briefing.recordsVerified.carriedForward}. An unchecked field still answers — with its date and a freshness warning.
          </p>
        </Section>

        {money && (
          <Section title="Unconfirmed cancellation" chips={<Chip tone="warn">24h no acknowledgment</Chip>}>
            <p className="text-[13.5px]">{commissionEdgeCases.unconfirmedCancellation.property}: cancellation sent 24h ago — {commissionEdgeCases.unconfirmedCancellation.note.toLowerCase()}</p>
            <Button variant="outline" size="sm" className="mt-2">Contact property directly</Button>
          </Section>
        )}
      </div>

      {!money && (
        <p className="mt-4 text-[12.5px] text-muted-foreground">
          Viewing as {people.colleague}: commission figures are absent by policy, not masked.
        </p>
      )}
    </div>
  );
}
