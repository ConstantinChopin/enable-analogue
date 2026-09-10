"use client";
/**
 * Briefing — recomposed as a document, not a dashboard (VIS-070; T4 in
 * docs/rebuild/00-plan-revised.md §4.5).
 *
 * The panel said the brief was "correct but impersonal": five equal cards in a
 * grid, which cannot be ordered by anyone's day. So the brief is now addressed to
 * the person, opens with her day in sentences with the figures inline, and then
 * walks her obligations as chapters in the order she owes them: departures ·
 * commissions · notices · incentives · verification. Each chapter ends in the text
 * action that opens the saved view it summarises.
 *
 * The one primary — "Open the ledger" — sits at the bottom of the tool that follows
 * her down the page (the Today rail), because commission reconciliation is the #1
 * pain the agency named (DEC-12, DEC-13) and it is where the demo's first journey
 * begins.
 *
 * Per role the chapter set comes from `widgetsFor[s.role]`, so each role gets a
 * different morning. The same four criteria apply to all of them.
 */
import React from "react";
import Link from "next/link";
import { useDemo, canViewCommissions } from "@/lib/store";
import {
  widgetsFor, personName, commissions, departures, notices, promotions, briefing,
  publishQueue, candidates, connections, connectionHealth, adminPolicy, orphanedPayments,
  travellerCards, people,
  type Widget,
} from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, Section, NarrationNote, Rows, Row, RowStack, StatusDot } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from "lucide-react";

/** The seeded morning. Notices opened "26 Aug" read as two days old from here. */
const TODAY = "Friday 28 August";

/** Critical first. The same ranking `/notifications` uses, so the two agree. */
const SEVERITY_RANK: Record<string, number> = { Critical: 0, Important: 1, Info: 2 };

const eur = (n: number) => `EUR ${n.toLocaleString("en-GB")}`;

/* ── a chapter's closing text action: the saved view it opens ─────────────── */
function Opens({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button asChild variant="link" size="sm">
      <Link href={href}>{children} <ArrowRight aria-hidden /></Link>
    </Button>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function Briefing() {
  const { s } = useDemo();
  const money = canViewCommissions(s.role);
  const widgets = widgetsFor[s.role];

  const openCommissions = commissions.filter((c) => c.state !== "paid");
  const outstanding = openCommissions.reduce((n, c) => n + c.amount, 0);
  const overdue = commissions.filter((c) => c.state === "overdue");
  const chased = commissions.filter((c) => c.state === "chased");
  const longestChase = [...chased, ...overdue].sort((a, b) => (b.overdueDays ?? 0) - (a.overdueDays ?? 0))[0];

  const activeNotices = notices
    .filter((n) => {
      if (n.scope === "personal") return false;
      if (s.world === "v1" && n.v1ExpiredOngoing) return false;
      if (s.spaNoticeClosed && n.id === "spa") return false;
      return true;
    })
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  const critical = activeNotices.filter((n) => n.severity === "Critical");

  const sharedWithColleague = (name: string) => {
    if (travellerCards.some((t) => t.name === name && t.shared === people.colleague)) return true;
    return name === "S. Marchetti" && s.shareTier !== "private";
  };
  const visibleDepartures = departures.filter(
    (t) => s.role !== "colleague" || sharedWithColleague(t.traveller),
  );
  const soonest = visibleDepartures[0];
  const unconfirmed = visibleDepartures.filter((t) => t.alert);
  const expiring = [...promotions].sort((a, b) => a.daysLeft - b.daysLeft);

  const paid = commissions.filter((c) => c.state === "paid");
  const collected = paid.reduce((n, c) => n + c.amount, 0);
  const flagged = commissions.filter((c) => c.discrepancy);
  const orphanTotal = orphanedPayments.reduce((n, p) => n + p.amount, 0);

  /* ── the day, in sentences (criteria 1 and 3) ───────────────────────────── */
  const lead: React.ReactNode = (() => {
    switch (s.role) {
      case "advisor":
      case "colleague":
        return (
          <>
            {soonest
              ? <>{soonest.traveller} leaves for {soonest.title} in {soonest.startsInDays} days{soonest.alert ? `, with a ${soonest.alert}` : ""}; {visibleDepartures.length - 1} more {visibleDepartures.length - 1 === 1 ? "departure" : "departures"} follow within the month. </>
              : <>No departures for travellers shared with you. </>}
            {money && (
              <>{overdue.length} commissions are overdue and {eur(outstanding)} is outstanding across {openCommissions.length}{longestChase ? `; ${longestChase.property} has waited ${longestChase.overdueDays} days` : ""}. </>
            )}
            {critical.length > 0
              ? <>{critical.length === 1 ? "One property" : `${critical.length} properties`} must not be booked until further notice: {critical.map((n) => n.productName).join(", ")}. </>
              : null}
            {expiring.length > 0 && <>{expiring.length} incentives expire within {expiring[expiring.length - 1].daysLeft} days.</>}
          </>
        );
      case "lead":
        return (
          <>
            {publishQueue.length} items wait in the publish queue and {candidates.length} candidate records wait to be confirmed.{" "}
            {connectionHealth.needAttention > 0
              ? <>{connectionHealth.needAttention} of {connections.length} connections need attention. </>
              : <>All {connections.length} connections are healthy. </>}
            {critical.length > 0 && <>{critical.map((n) => n.productName).join(", ")} carries a Critical notice the desk must acknowledge before booking.</>}
          </>
        );
      case "ops":
        return (
          <>
            {orphanedPayments.length} payments totalling {eur(orphanTotal)} arrived without a booking to match.{" "}
            {eur(collected)} has been collected this quarter against {eur(outstanding)} still open, {overdue.length} of it overdue.{" "}
            {flagged.length > 0 && <>{flagged.length} {flagged.length === 1 ? "commission" : "commissions"} came in under projection.</>}
          </>
        );
    }
  })();

  /* ── the chapters (criterion 2: ordered by her obligations) ─────────────── */
  const chapter = (w: Widget): React.ReactNode => {
    switch (w.id) {
      case "departures":
        return (
          <Section key={w.id} title="Departures" footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}>
            {visibleDepartures.length === 0 ? (
              <p className="type-data-read text-label-secondary">No departures for travellers shared with you.</p>
            ) : (
              <Rows>
                {visibleDepartures.map((t) => (
                  <Row key={t.id}>
                    <span className="row-primary">
                      <span className="type-data-strong">{t.traveller}</span>
                      <span className="text-label-secondary"> · {t.title}</span>
                    </span>
                    <span className="row-meta type-meta tnum">in {t.startsInDays}d</span>
                    <span className="row-trailing flex items-center gap-2">
                      {t.checklist && <Chip tone="neutral">checklist {t.checklist.done}/{t.checklist.of}</Chip>}
                      {t.alert && <Chip tone="warn">{t.alert}</Chip>}
                    </span>
                  </Row>
                ))}
              </Rows>
            )}
          </Section>
        );

      case "commissions":
        return (
          <Section
            key={w.id}
            title="Commissions"
            chips={overdue.length > 0 ? <Chip tone="neutral">{overdue.length} overdue</Chip> : undefined}
            footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}
          >
            <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data-read text-label-secondary">
              <span className="type-figure text-label">{eur(outstanding)}</span> outstanding across {openCommissions.length} commissions · {eur(briefing.headline.collectedThisWeek)} collected this week.
            </p>
            <Rows>
              {[...openCommissions]
                .sort((a, b) => (b.overdueDays ?? 0) - (a.overdueDays ?? 0))
                .slice(0, 4)
                .map((c) => (
                  <Row key={c.id}>
                    <Link href={`/commissions/${c.id}`} className="row-primary type-data-strong underline decoration-hairline underline-offset-4 hover:decoration-ink">
                      {c.property}
                    </Link>
                    <span className="row-trailing flex items-center gap-2">
                      <span className="tnum">{eur(c.amount)}</span>
                      <Chip tone={c.state === "overdue" ? "crit" : c.state === "chased" ? "primary" : "neutral"}>
                        {c.state === "overdue" ? `overdue ${c.overdueDays}d`
                          : c.state === "chased" ? `chased · ${c.overdueDays}d`
                          : `due ${c.dueDate}`}
                      </Chip>
                    </span>
                  </Row>
                ))}
            </Rows>
          </Section>
        );

      case "notices":
        return (
          <Section
            key={w.id}
            title="Notices"
            chips={s.world === "v1" ? <Chip tone="crit">v1 build</Chip> : undefined}
            footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}
          >
            <Rows>
              {activeNotices.map((n) => (
                <RowStack
                  key={n.id}
                  head={
                    <>
                      <Link href={`/records/${n.productId}`} className="row-primary type-data-strong underline decoration-hairline underline-offset-4 hover:decoration-ink">
                        {n.productName}
                      </Link>
                      <span className="flex shrink-0 items-center gap-2">
                        <Chip tone={n.severity === "Critical" ? "crit" : n.severity === "Important" ? "warn" : "neutral"}>
                          {n.severity}
                        </Chip>
                        {n.staleReviewDue && s.world === "v2" && <Chip tone="warn">review due</Chip>}
                      </span>
                    </>
                  }
                >
                  {n.text}
                </RowStack>
              ))}
            </Rows>
            {s.world === "v1" && (
              <div className="mt-[var(--space-3)]">
                <NarrationNote>
                  The spa notice is missing from this list. The v1 build let it expire on
                  1 August; the spa is still closed. Nothing on the screen marks the silence
                  — that absence is the failure v2 was built to remove.
                </NarrationNote>
              </div>
            )}
          </Section>
        );

      case "incentives":
        return (
          <Section key={w.id} title="Expiring incentives" deep footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}>
            <Rows>
              {expiring.map((p) => (
                <RowStack
                  key={p.id}
                  head={
                    <>
                      <span className="row-primary">
                        <span className="type-data-strong">{p.productName}</span>
                        <span> · {p.rate}</span>
                      </span>
                      <Chip tone="warn" className="tnum">{p.daysLeft} days left</Chip>
                    </>
                  }
                >
                  {p.stacksWithBase ? "bonus — adds to base" : "override — replaces base"} · book by{" "}
                  {p.bookingWindowEnd} · travel by {p.travelWindowEnd}
                </RowStack>
              ))}
            </Rows>
          </Section>
        );

      case "verification":
        return (
          <Section key={w.id} title="Records verified this quarter" quiet deep footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}>
            <div className="flex items-baseline gap-[var(--space-3)]">
              <span className="type-figure">{briefing.recordsVerified.done}</span>
              <span className="type-meta tnum">of {briefing.recordsVerified.of} in Paris</span>
            </div>
            <Progress
              value={(briefing.recordsVerified.done / briefing.recordsVerified.of) * 100}
              className="mt-[var(--space-2)] max-w-md"
            />
            <p className="mt-[var(--space-2)] max-w-[60ch] type-data-read text-label-secondary">
              Carried forward, unchecked: <span className="tnum">{briefing.recordsVerified.carriedForward}</span>.
              An unchecked field still answers — with its date and a freshness warning.
            </p>
          </Section>
        );

      /* ── agency lead ── */
      case "publish":
        return (
          <Section key={w.id} title="Publish queue" footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}>
            <Rows>
              {publishQueue.map((q) => (
                <RowStack key={q.id} head={<span className="row-primary type-data-strong">{q.text}</span>}>
                  {q.action}
                </RowStack>
              ))}
            </Rows>
          </Section>
        );

      case "confirm":
        return (
          <Section key={w.id} title="Records to confirm" chips={<Chip tone="neutral">{candidates.length} waiting</Chip>} footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}>
            <Rows>
              {candidates.map((c) => (
                <Row key={c.id}>
                  <span className="row-primary">
                    <span className="type-data-strong">{c.name}</span>
                    <span className="text-label-secondary"> · {c.from}</span>
                  </span>
                  <span className="row-trailing">
                    <Chip tone={c.kind === "duplicate" ? "warn" : c.kind === "held" ? "crit" : "neutral"}>
                      {c.kind}
                    </Chip>
                  </span>
                </Row>
              ))}
            </Rows>
          </Section>
        );

      case "connections":
        return (
          <Section
            key={w.id}
            title="Connections"
            chips={connectionHealth.needAttention > 0 ? <Chip tone="neutral">{connectionHealth.label}</Chip> : undefined}
            footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}
          >
            <Rows>
              {connections.map((c) => (
                <Row key={c.name}>
                  <span className="row-primary type-data-strong">{c.name}</span>
                  <span className="row-trailing">
                    <Chip tone={c.state === "ok" ? "ok" : c.state === "credentials" ? "crit" : "warn"}>
                      {c.state === "ok" ? `last success ${c.lastSuccess}`
                        : c.state === "credentials" ? `credentials expired ${c.lastSuccess}`
                        : `syncing · ${c.lastSuccess}`}
                    </Chip>
                  </span>
                </Row>
              ))}
            </Rows>
          </Section>
        );

      case "policy":
        return (
          <Section key={w.id} title="Sharing defaults" quiet deep footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}>
            <Rows>
              {adminPolicy.defaults.map((p) => (
                <Row key={p.kind}>
                  <span className="row-primary type-data-strong">{p.kind}</span>
                  <span className="row-trailing text-label-secondary">{p.value}</span>
                </Row>
              ))}
            </Rows>
            <p className="mt-[var(--space-3)] type-meta tnum">
              {adminPolicy.governed.advisors} advisors · {adminPolicy.governed.admins} admins ·{" "}
              {adminPolicy.governed.desks} desks ·{" "}
              {adminPolicy.governed.records.toLocaleString("en-GB")} records
            </p>
            {adminPolicy.breakGlass.length > 0 && (
              <p className="mt-1 type-meta">
                {adminPolicy.breakGlass.length} break-glass openings logged, owners notified.
              </p>
            )}
          </Section>
        );

      /* ── ops ── */
      case "unmatched":
        return (
          <Section key={w.id} title="Unmatched payments" chips={<Chip tone="neutral">{orphanedPayments.length} to match</Chip>} footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}>
            <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data-read text-label-secondary">
              <span className="type-figure text-label">{eur(orphanTotal)}</span> across {orphanedPayments.length} payments.
            </p>
            <Rows>
              {orphanedPayments.map((p) => (
                <RowStack
                  key={p.id}
                  head={
                    <span className="row-primary">
                      <span className="type-data-strong tnum">{eur(p.amount)}</span>
                      <span className="text-label-secondary"> {p.raw}</span>
                    </span>
                  }
                >
                  {p.note}
                </RowStack>
              ))}
            </Rows>
          </Section>
        );

      case "reconciliation":
        return (
          <Section key={w.id} title="Reconciliation" deep footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}>
            <div className="grid max-w-md grid-cols-2 gap-[var(--space-4)]">
              <div>
                <div className="type-micro-caps text-label-tertiary">Collected</div>
                <div className="mt-1 type-figure">{eur(collected)}</div>
                <div className="type-meta tnum">{paid.length} settled</div>
              </div>
              <div>
                <div className="type-micro-caps text-label-tertiary">Outstanding</div>
                <div className="mt-1 type-figure">{eur(outstanding)}</div>
                <div className="type-meta tnum">{openCommissions.length} open · {overdue.length} overdue</div>
              </div>
            </div>
            <Progress value={(collected / (collected + outstanding)) * 100} className="mt-[var(--space-3)] max-w-md" />
            <p className="mt-[var(--space-2)] type-meta">
              Actuals arrive read-only from the booking system. Ground truth stays in the source.
            </p>
          </Section>
        );

      case "discrepancies":
        return (
          <Section key={w.id} title="Under projection" deep footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}>
            <Rows>
              {flagged.map((c) => (
                <RowStack
                  key={c.id}
                  head={
                    <>
                      <Link href={`/commissions/${c.id}`} className="row-primary type-data-strong underline decoration-hairline underline-offset-4 hover:decoration-ink">{c.property}</Link>
                      <Chip tone="warn">actual under projection</Chip>
                    </>
                  }
                >
                  <span className="tnum">
                    {c.discrepancy &&
                      `expected ${eur(c.discrepancy.expected)} · received ${eur(c.discrepancy.actual)} · ${c.discrepancy.causes.join(" · ")}`}
                  </span>
                </RowStack>
              ))}
            </Rows>
          </Section>
        );

      default:
        return null;
    }
  };

  /* ── the rail: what needs her today, and the one action ───────────────── */
  const today: { label: string; mark: React.ReactNode }[] = [];
  if (money && overdue.length) today.push({ label: "Overdue commissions", mark: <Chip tone="crit">{overdue.length}</Chip> });
  if (critical.length) today.push({ label: "Critical notice", mark: <Chip tone="crit">{critical.length}</Chip> });
  if (unconfirmed.length) today.push({ label: "Departure unconfirmed", mark: <Chip tone="warn">{unconfirmed.length}</Chip> });
  if (expiring.length && money) today.push({ label: "Incentives expiring", mark: <Chip tone="neutral">{expiring.length}</Chip> });
  if (s.role === "lead") {
    today.push({ label: "To publish", mark: <Chip tone="neutral">{publishQueue.length}</Chip> });
    today.push({ label: "To confirm", mark: <Chip tone="neutral">{candidates.length}</Chip> });
    if (connectionHealth.needAttention > 0) today.push({ label: "Connections", mark: <Chip tone="warn">{connectionHealth.needAttention}</Chip> });
  }
  if (s.role === "ops") today.push({ label: "Payments to match", mark: <Chip tone="neutral">{orphanedPayments.length}</Chip> });

  const primary =
    s.role === "lead" ? { href: "/admin/review", label: "Confirm records" }
    : s.role === "ops" ? { href: "/ops/resolution", label: "Match payments" }
    : money ? { href: "/commissions", label: "Open the ledger" }
    : { href: "/itineraries", label: "Check departures" };

  const gatedOut = (w: Widget) => w.id === "commissions" && !money;

  return (
    <Page width="wide">
      <PageHeader title={<>Good morning, {personName[s.role]}</>}>
        <p className="mt-[var(--space-2)] type-meta">{TODAY} · synced {briefing.syncedAt}</p>
      </PageHeader>

      <div className="doc-layout">
        <div className="min-w-0">
          <NarrationNote>
            The screen the agency asked for by name — “the first thing that you will viewing in
            the morning.” The chapter set is built from the signed-in role, so the permission
            story is the layout, not a claim about it.
          </NarrationNote>

          {/* The day, written. Serif because it is addressed to a person; figures inline. */}
          <section className="chapter" data-slot="chapter">
            <p className="max-w-[62ch] type-prose-lead">{lead}</p>
            <p className="mt-[var(--space-3)] type-meta">
              <StatusDot tone="warn">Booking-system figures up to 48 hours behind</StatusDot>
            </p>
          </section>

          {widgets.filter((w) => !gatedOut(w)).map(chapter)}
        </div>

        <aside className="doc-rail" data-rail-label="Today">
          <Section variant="tool" follows title="Today">
            <Rows>
              {today.map((t) => (
                <Row key={t.label}>
                  <span className="row-primary">{t.label}</span>
                  <span className="row-trailing">{t.mark}</span>
                </Row>
              ))}
              {today.length === 0 && <li className="py-[11px] type-data-read text-label-secondary">Nothing is waiting on you.</li>}
            </Rows>
            <div className="mt-[var(--space-4)]">
              <Button asChild className="w-full"><Link href={primary.href}>{primary.label}</Link></Button>
            </div>
          </Section>
        </aside>
      </div>
    </Page>
  );
}
