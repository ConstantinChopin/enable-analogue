"use client";
/**
 * Briefing — the Dashboard archetype (layout-exploration §7, §10.7).
 *
 * Per role: the widget set comes from `widgetsFor[s.role]`, so each role gets a
 * different morning. Every widget is a saved view (§8, DEC §10.2) — its footer
 * action navigates to the real surface with the view applied. There are no
 * bespoke widget pages.
 *
 * No nav, no dock, no top bar: the shell owns those.
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
import { Chip, Section, NarrationNote, FreshnessDate, Rows, Row, RowStack } from "@/components/bits";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

/** The seeded morning. Notices opened "26 Aug" read as two days old from here. */
const TODAY = "Friday 28 August";

/* ── the widget frame ─────────────────────────────────────────────────────── */

function WidgetCard({
  title, chip, expandsTo, expandLabel, children,
}: {
  title: string;
  chip?: React.ReactNode;
  expandsTo?: string;
  expandLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Section
      variant="list"
      title={title}
      chips={chip}
      footer={
        expandsTo && expandLabel ? (
          <Button asChild variant="ghost" size="sm" className="h-auto w-full justify-between px-0 py-0 text-primary">
            <Link href={expandsTo}>
              {expandLabel} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        ) : undefined
      }
    >
      {children}
    </Section>
  );
}

function Quiet({ children }: { children: React.ReactNode }) {
  return <p className="px-[var(--space-4)] py-1 type-data text-muted-foreground">{children}</p>;
}
/** A widget's non-row content — a headline figure, a meter — owning its own gutter,
    which is the `list` card's contract: children inset themselves so rows can bleed. */
function Figure({ children }: { children: React.ReactNode }) {
  return <div className="px-[var(--space-4)]">{children}</div>;
}

const eur = (n: number) => `EUR ${n.toLocaleString("en-GB")}`;

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function Briefing() {
  const { s } = useDemo();
  const money = canViewCommissions(s.role);
  const widgets = widgetsFor[s.role];

  const openCommissions = commissions.filter((c) => c.state !== "paid");
  const outstanding = openCommissions.reduce((n, c) => n + c.amount, 0);
  const overdueCount = commissions.filter((c) => c.state === "overdue").length;

  /* Under v1 an advisory expired on 1 Aug and is simply gone. */
  const activeNotices = notices.filter((n) => {
    if (n.scope === "personal") return false;
    if (s.world === "v1" && n.v1ExpiredOngoing) return false;
    if (s.spaNoticeClosed && n.id === "spa") return false;
    return true;
  });

  /* For the colleague, travellers who are not shared are absent — never masked. */
  const sharedWithColleague = (name: string) => {
    if (travellerCards.some((t) => t.name === name && t.shared === people.colleague)) return true;
    return name === "S. Marchetti" && s.shareTier !== "private";
  };
  const visibleDepartures = departures.filter(
    (t) => s.role !== "colleague" || sharedWithColleague(t.traveller),
  );

  const body = (w: Widget): React.ReactNode => {
    switch (w.id) {
      /* ── advisor / colleague ── */
      case "commissions":
        /* No permission branch. A role without commission access does not receive this
           widget at all (see `widgetsFor.colleague`), so there is nothing here to
           explain — which is the whole of "absent, not masked". */
        return (
          <>
            <Figure>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="type-data-strong tnum">{eur(outstanding)}</span>
                <span className="type-meta">
                  outstanding across {openCommissions.length} commissions
                </span>
              </div>
              <p className="mt-1 type-meta tnum">
                {eur(briefing.headline.collectedThisWeek)} collected this week
              </p>
            </Figure>
            <div className="mt-3">
              <Rows>
                {[...openCommissions]
                  .sort((a, b) => (b.overdueDays ?? 0) - (a.overdueDays ?? 0))
                  .slice(0, 4)
                  .map((c) => (
                    <Row key={c.id}>
                      <Link href={`/commissions/${c.id}`} className="row-primary type-data-strong hover:text-primary">
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
            </div>
          </>
        );

      case "departures":
        if (visibleDepartures.length === 0) {
          return <Quiet>No departures for travellers shared with you.</Quiet>;
        }
        return (
          <Rows>
            {visibleDepartures.map((t) => (
              <Row key={t.id}>
                <span className="row-primary">
                  <span className="type-data-strong">{t.traveller}</span>
                  <span className="text-muted-foreground"> · {t.title}</span>
                </span>
                <span className="row-meta type-meta tnum">in {t.startsInDays}d</span>
                <span className="row-trailing flex items-center gap-2">
                  {t.checklist && <Chip tone="primary">checklist {t.checklist.done}/{t.checklist.of}</Chip>}
                  {t.alert && <Chip tone="warn">{t.alert}</Chip>}
                </span>
              </Row>
            ))}
          </Rows>
        );

      case "notices":
        return (
          <>
            {/* Two lines: the property and its severity on the first, the advisory
                itself on the second. On one line the Critical notice lost two thirds
                of its text — and the part it lost was "do not confirm bookings until
                the property confirms reopening", which is the only actionable half. */}
            <Rows>
              {activeNotices.map((n) => (
                <RowStack
                  key={n.id}
                  head={
                    <>
                      <Link
                        href={`/records/${n.productId}`}
                        className="row-primary type-data-strong hover:text-primary"
                      >
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
              <div className="mt-3 px-[var(--space-4)]">
                <NarrationNote>
                  The spa notice is missing from this list. The v1 build let it expire on
                  1 August; the spa is still closed. Nothing on the screen marks the silence
                  — that absence is the failure v2 was built to remove.
                </NarrationNote>
              </div>
            )}
          </>
        );

      case "incentives":
        return (
          <Rows>
            {promotions.map((p) => (
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
        );

      case "verification":
        return (
          <Figure>
            <div className="flex items-baseline gap-3">
              <span className="type-data-strong tnum">{briefing.recordsVerified.done}</span>
              <span className="type-meta tnum">
                of {briefing.recordsVerified.of} in Paris
              </span>
            </div>
            <Progress
              value={(briefing.recordsVerified.done / briefing.recordsVerified.of) * 100}
              className="mt-2 h-1"
            />
            <p className="mt-2 type-meta">
              Carried forward, unchecked: <span className="tnum">{briefing.recordsVerified.carriedForward}</span>.
              An unchecked field still answers — with its date and a freshness warning.
            </p>
          </Figure>
        );

      /* ── agency lead ── */
      case "publish":
        return (
          <Rows>
            {publishQueue.map((q) => (
              <RowStack key={q.id} head={<span className="row-primary type-data-strong">{q.text}</span>}>
                {q.action}
              </RowStack>
            ))}
          </Rows>
        );

      case "confirm":
        return (
          <Rows>
            {candidates.map((c) => (
              <Row key={c.id}>
                <span className="row-primary">
                  <span className="type-data-strong">{c.name}</span>
                  <span className="text-muted-foreground"> · {c.from}</span>
                </span>
                <span className="row-trailing">
                  <Chip tone={c.kind === "duplicate" ? "warn" : c.kind === "held" ? "crit" : "neutral"}>
                    {c.kind}
                  </Chip>
                </span>
              </Row>
            ))}
          </Rows>
        );

      case "connections":
        return (
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
        );

      case "policy":
        return (
          <>
            <Rows>
              {adminPolicy.defaults.map((p) => (
                <Row key={p.kind}>
                  <span className="row-primary type-data-strong">{p.kind}</span>
                  <span className="row-trailing text-muted-foreground">{p.value}</span>
                </Row>
              ))}
            </Rows>
            <p className="mt-2 type-meta tnum">
              {adminPolicy.governed.advisors} advisors · {adminPolicy.governed.admins} admins ·{" "}
              {adminPolicy.governed.desks} desks · {adminPolicy.governed.records} records
            </p>
            {adminPolicy.breakGlass.length > 0 && (
              <p className="mt-1 type-meta">
                {adminPolicy.breakGlass.length} break-glass openings logged, owners notified.
              </p>
            )}
          </>
        );

      /* ── ops ── */
      case "unmatched":
        return (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-[var(--space-4)]">
              <span className="type-data-strong tnum">
                {eur(orphanedPayments.reduce((n, p) => n + p.amount, 0))}
              </span>
              <span className="type-meta">
                across {orphanedPayments.length} payments
              </span>
            </div>
            <div className="mt-3">
              <Rows>
                {orphanedPayments.map((p) => (
                  <RowStack
                    key={p.id}
                    head={
                      <span className="row-primary">
                        <span className="type-data-strong tnum">{eur(p.amount)}</span>
                        <span className="text-muted-foreground"> {p.raw}</span>
                      </span>
                    }
                  >
                    {p.note}
                  </RowStack>
                ))}
              </Rows>
            </div>
          </>
        );

      case "reconciliation": {
        const paid = commissions.filter((c) => c.state === "paid");
        const collected = paid.reduce((n, c) => n + c.amount, 0);
        return (
          <>
            <div className="grid grid-cols-2 gap-3 px-[var(--space-4)]">
              <div>
                <div className="type-code uppercase tracking-widest text-muted-foreground">Collected</div>
                <div className="mt-1 type-data-strong tnum">{eur(collected)}</div>
                <div className="type-meta tnum">{paid.length} settled</div>
              </div>
              <div>
                <div className="type-code uppercase tracking-widest text-muted-foreground">Outstanding</div>
                <div className="mt-1 type-data-strong tnum">{eur(outstanding)}</div>
                <div className="type-meta tnum">
                  {openCommissions.length} open · {overdueCount} overdue
                </div>
              </div>
            </div>
            <Progress
              value={(collected / (collected + outstanding)) * 100}
              className="mt-3 h-1.5"
            />
            <p className="mt-2 type-meta">
              Actuals arrive read-only from the booking system. Ground truth stays in the source.
            </p>
          </>
        );
      }

      case "discrepancies": {
        /* Same predicate the ledger's `?state=discrepancy` view uses — the widget and the
           surface it expands into must never disagree about what they hold. */
        const flagged = commissions.filter((c) => c.discrepancy);
        return (
          <Rows>
            {flagged.map((c) => (
              <RowStack
                key={c.id}
                head={
                  <>
                    <Link href={`/commissions/${c.id}`} className="row-primary type-data-strong hover:text-primary">
                      {c.property}
                    </Link>
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
        );
      }

      default:
        return null;
    }
  };

  const chipFor = (w: Widget): React.ReactNode => {
    if (w.id === "commissions" && money && overdueCount > 0) return <Chip tone="crit">{overdueCount} overdue</Chip>;
    if (w.id === "notices" && s.world === "v1") return <Chip tone="crit">v1 build</Chip>;
    if (w.id === "unmatched") return <Chip tone="warn">{orphanedPayments.length} to match</Chip>;
    if (w.id === "confirm") return <Chip tone="warn">{candidates.length} waiting</Chip>;
    if (w.id === "connections") {
      /* The seed's one rule, so this chip cannot disagree with /admin/connections. */
      return connectionHealth.needAttention > 0 ? (
        <Chip tone="warn">{connectionHealth.label}</Chip>
      ) : undefined;
    }
    return undefined;
  };

  return (
    <Page width="wide">
      <PageHeader title={<>Good morning, {personName[s.role]}</>}>
        <p className="mt-2 type-data text-muted-foreground">
          {TODAY} ·{" "}
          <FreshnessDate>
            synced {briefing.syncedAt} · booking-system figures up to 48 hours behind
          </FreshnessDate>
        </p>
      </PageHeader>

      <NarrationNote>
        The screen the agency asked for by name — “the first thing that you will viewing in
        the morning.” The widget set is built from the signed-in role, so the permission
        story is the layout, not a claim about it.
      </NarrationNote>

      <div className="mt-4 grid gap-3 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {widgets.map((w) => {
          const gated = w.id === "commissions" && !money;
          return (
            <WidgetCard
              key={w.id}
              title={w.title}
              chip={chipFor(w)}
              expandsTo={gated ? undefined : w.expandsTo}
              expandLabel={gated ? undefined : w.expandLabel}
            >
              {body(w)}
            </WidgetCard>
          );
        })}
      </div>

      {/* The saved-view explanation is gone from all three roles' briefings. Every
          widget footer already names the surface it opens — "Open the ledger", "All
          departures" — and clicking one proves the claim in a way a sentence cannot. */}
    </Page>
  );
}
