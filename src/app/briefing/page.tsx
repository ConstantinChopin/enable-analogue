"use client";
/**
 * Briefing — recomposed as a document, not a dashboard (VIS-070; T4 in
 * docs/rebuild/00-plan-revised.md §4.5).
 *
 * The panel said the brief was "correct but impersonal": five equal cards in a
 * grid, which cannot be ordered by anyone's day. So the brief is now addressed to
 * the person, opens with her day in sentences with the figures inline, and then
 * walks her obligations as chapters in the order she owes them. Each chapter ends in
 * the text action that opens the saved view it summarises.
 *
 * Per type the chapter set comes from `widgetsFor[s.role]` (docs/rebuild/05-two-roles.md),
 * so each type gets a different morning. The same four criteria apply to both.
 *   user  — Commissions · Departures · Notices · Expiring incentives · Records verified
 *   owner — Records to confirm · Publish queue · Unmatched payments · Commissions ·
 *           Under projection · Connections · Departures · Notices
 *
 * The tool that follows her down the page is the insight rail (Constantin, 2026-09-24;
 * components/insight-rail.tsx, logic in lib/insights.ts). An insight is what a chapter's
 * rows cannot say, computed by a deterministic join so every claim can be checked, and
 * ending in the reader's own act; the rail shows one at a time, ranked, so its action is
 * the page's one primary. The first is the day's first move. It moves with the page:
 * the chapter being read brings up its insight, and the arrows carry the page to the
 * next one. Closed, it gives its column back until the header brings it back.
 * It replaced the Today checklist, tried and cancelled the same day: a list of counts
 * restated the chapters, and ticking them measured nothing.
 *
 * Counts are live. The publish queue counts what still waits (`queueItems` less what
 * she has published or returned); a retired notice leaves the notices chapter. The
 * owner sees a departure only for a traveller shared with her: trips are private to
 * their advisors.
 */
import React from "react";
import Link from "next/link";
import { useDemo, canViewCommissions, queueItems, announcementsFor } from "@/lib/store";
import { insightsFor } from "@/lib/insights";
import { InsightRail } from "@/components/insight-rail";
import { askAssistant } from "@/components/assistant";
import {
  widgetsFor, personName, commissions, departures, notices, promotions, briefing,
  candidates, connectionsFor, connectionHealth, orphanedPayments,
  travellerCards, people, productById,
  type Widget,
} from "@/data/seed";
import { AnnouncementSheet } from "@/components/publish-sheets";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, Section, Rows, Row, RowStack, StatusDot } from "@/components/bits";
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

/* ── an entity named in the day: every one opens the object it names ────────
   The lead is written as sentences, but each noun in it is a row in the model, so
   it is a way in, not a summary to read and then go looking for. A quiet hairline
   underline in the serif; the ink one under the pointer. */
function Ent({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="underline decoration-hairline underline-offset-[5px] hover:decoration-ink">
      {children}
    </Link>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function Briefing() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s);
  const widgets = widgetsFor[s.role];
  const [writing, setWriting] = React.useState(false);

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
      /* Retired by a named person on the record: it has stopped being true. */
      if (s.retired[n.id]) return false;
      return true;
    })
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  const critical = activeNotices.filter((n) => n.severity === "Critical");

  /* The trips in the data are R. Devane's. The owner sees a departure only for a
     traveller shared with her: the personal layer is the advisor's. */
  const sharedWithOwner = (name: string) => {
    if (travellerCards.some((t) => t.name === name && t.shared === people.owner)) return true;
    return name === "S. Marchetti" && s.shareTier !== "private";
  };
  const visibleDepartures = departures.filter(
    (t) => s.role === "user" || sharedWithOwner(t.traveller),
  );
  const soonest = visibleDepartures[0];
  /* A traveller named in the day opens her profile; the trip itself opens in the
     departures ledger until trips have a page of their own (the builder, U21). */
  const travellerHref = (name: string, id?: string) =>
    `/travellers/${id ?? travellerCards.find((t) => t.name === name)?.id ?? ""}`;
  /* Incentives are commission programmes: absent with the rest of the money. */
  const expiring = money ? [...promotions].sort((a, b) => a.daysLeft - b.daysLeft) : [];

  /* What still waits for the owner: shared this session, and the seeded queue, less
     whatever she has already published or returned. */
  const waiting = queueItems(s).filter((q) => !s.released[q.id]);
  const agencySources = connectionsFor("owner").filter((c) => c.scope === "agency");

  const flagged = commissions.filter((c) => c.discrepancy);
  const orphanTotal = orphanedPayments.reduce((n, p) => n + p.amount, 0);

  /* ── the day, in sentences (criteria 1 and 3) ───────────────────────────── */
  const lead: React.ReactNode = (() => {
    switch (s.role) {
      case "user":
        return (
          <>
            {soonest
              ? <><Ent href={travellerHref(soonest.traveller, soonest.travellerId)}>{soonest.traveller}</Ent> leaves for <Ent href="/itineraries?window=30">{soonest.title}</Ent> in {soonest.startsInDays} days{soonest.alert ? `, with a ${soonest.alert}` : ""}; <Ent href="/itineraries?window=30">{visibleDepartures.length - 1} more {visibleDepartures.length - 1 === 1 ? "departure" : "departures"}</Ent> follow within the month. </>
              : <>No departures in the coming weeks. </>}
            {money && (
              <><Ent href="/commissions?state=overdue">{overdue.length} commissions are overdue</Ent> and <Ent href="/commissions?state=open">{eur(outstanding)} is outstanding across {openCommissions.length}</Ent>{longestChase ? <>; <Ent href={`/commissions/${longestChase.id}`}>{longestChase.property}</Ent> has waited {longestChase.overdueDays} days</> : null}. </>
            )}
            {critical.length > 0
              ? <>{critical.length === 1 ? "One property" : `${critical.length} properties`} must not be booked until further notice: {critical.map((n, i) => <React.Fragment key={n.id}>{i > 0 && ", "}<Ent href={`/records/${n.productId}`}>{n.productName}</Ent></React.Fragment>)}. </>
              : null}
            {expiring.length > 0 && <><Ent href="/records?promotion=active">{expiring.length} incentives</Ent> expire within {expiring[expiring.length - 1].daysLeft} days.</>}
          </>
        );
      case "owner":
        return (
          <>
            <Ent href="/admin/review">{candidates.length} candidate records</Ent> wait to be confirmed and{" "}
            {waiting.length === 0 ? "nothing waits" : <Ent href="/admin/publish">{waiting.length === 1 ? "1 item waits" : `${waiting.length} items wait`}</Ent>} to be published to the whole agency.{" "}
            <Ent href="/ops/resolution">{orphanedPayments.length} payments totalling {eur(orphanTotal)}</Ent> arrived without a booking to match.{" "}
            {connectionHealth.needAttention > 0
              ? <><Ent href="/connections">{connectionHealth.needAttention} of {connectionHealth.sources} agency connections</Ent> need attention. </>
              : <>All {connectionHealth.sources} agency connections are healthy. </>}
            {critical.length > 0 && <>{critical.map((n, i) => <React.Fragment key={n.id}>{i > 0 && ", "}<Ent href={`/records/${n.productId}`}>{n.productName}</Ent></React.Fragment>)} is closed to bookings under your Critical notice.</>}
          </>
        );
    }
  })();

  /* ── the chapters (criterion 2: ordered by her obligations) ─────────────── */
  const chapter = (w: Widget): React.ReactNode => {
    switch (w.id) {
      case "departures":
        return (
          <Section key={w.id} anchor={w.id} title="Departures" footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}>
            {visibleDepartures.length === 0 ? (
              <p className="type-data-read text-label-secondary">
                {s.role === "owner"
                  ? "Trips are private to their advisors; none are shared with you."
                  : "No departures in the coming weeks."}
              </p>
            ) : (
              <Rows>
                {/* Two lines: the traveller and when on the first, the trip and its marks on
                    the second. On one line the name truncated under its own chips on the
                    phone, which is the row rule's own failure case. */}
                {visibleDepartures.map((t) => (
                  <RowStack
                    key={t.id}
                    head={
                      <>
                        <span className="row-primary type-data-strong">{t.traveller}</span>
                        <span className="type-meta tnum">in {t.startsInDays}d</span>
                      </>
                    }
                  >
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{t.title}</span>
                      {t.checklist && <Chip tone="neutral">checklist {t.checklist.done}/{t.checklist.of}</Chip>}
                      {t.alert && <Chip tone="warn">{t.alert}</Chip>}
                    </span>
                  </RowStack>
                ))}
              </Rows>
            )}
          </Section>
        );

      case "commissions":
        return (
          <Section
            key={w.id} anchor={w.id}
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
            key={w.id} anchor={w.id}
            title="Notices"
            chips={s.world === "v1" ? <Chip tone="crit">v1 build</Chip> : undefined}
            footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}
          >
            {activeNotices.length === 0 && (
              <p className="type-data-read text-label-secondary">No notice is active. A notice leaves this list only when a named person closes it.</p>
            )}
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
              </div>
            )}
          </Section>
        );

      case "incentives":
        return (
          <Section key={w.id} anchor={w.id} title="Expiring incentives" deep footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}>
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
          <Section key={w.id} anchor={w.id} title="Records verified this quarter" quiet deep footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}>
            <div className="flex items-baseline gap-[var(--space-3)]">
              <span className="type-figure">{briefing.recordsVerified.done}</span>
              <span className="type-meta tnum">of {briefing.recordsVerified.of} in Paris</span>
            </div>
            <Progress tone="neutral" value={(briefing.recordsVerified.done / briefing.recordsVerified.of) * 100}
              className="mt-[var(--space-2)] max-w-md"
            />
            <p className="mt-[var(--space-2)] max-w-[60ch] type-data-read text-label-secondary">
              Carried forward, unchecked: <span className="tnum">{briefing.recordsVerified.carriedForward}</span>.
              An unchecked field still answers — with its date and a freshness warning.
            </p>
          </Section>
        );

      /* ── both types: what the agency wrote to its desk (05-two-roles.md, 2026-09-24) ──
         The newest three. Each opens in the Knowledge archive, where it is a source of
         its own; each linked record opens the record. Anyone can write one: the owner's
         goes out at once, a user's to the whole agency waits for her. */
      case "announcements": {
        const items = announcementsFor(s).slice(0, 3);
        return (
          <Section
            key={w.id} anchor={w.id}
            title="From the agency"
            footer={
              <span className="flex flex-wrap items-center gap-x-[var(--space-4)]">
                <Button variant="tertiary" size="sm" onClick={() => setWriting(true)}>Write to the agency</Button>
                <Opens href={w.expandsTo}>{w.expandLabel}</Opens>
              </span>
            }
          >
            {items.length === 0 ? (
              <p className="type-data-read text-label-secondary">Nothing announced yet. What the agency writes to its desk arrives here.</p>
            ) : (
              <Rows>
                {items.map((a) => (
                  <RowStack
                    key={a.id}
                    head={
                      <>
                        <Link href={`/knowledge?source=Announcements&doc=${a.id}`} className="row-primary type-data-strong underline decoration-hairline underline-offset-4 hover:decoration-ink">
                          {a.title}
                        </Link>
                        <span className="type-meta tnum">{a.when}</span>
                      </>
                    }
                  >
                    {personName[a.by]} · {a.audience === "agency" ? "whole agency" : "Paris desk"}
                    {a.waiting && ` · waiting for ${people.owner} to release it`}
                    {a.links.length > 0 && (
                      <>
                        {" · "}
                        {a.links.map((id, i) => (
                          <React.Fragment key={id}>
                            {i > 0 && ", "}
                            <Link href={`/records/${id}`} className="underline decoration-hairline underline-offset-4 hover:decoration-ink">
                              {productById(id)?.name ?? id}
                            </Link>
                          </React.Fragment>
                        ))}
                      </>
                    )}
                  </RowStack>
                ))}
              </Rows>
            )}
          </Section>
        );
      }

      /* ── agency owner ── */
      case "publish":
        return (
          <Section
            key={w.id} anchor={w.id}
            title="Publish queue"
            chips={waiting.length > 0 ? <Chip tone="neutral">{waiting.length} waiting</Chip> : undefined}
            footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}
          >
            {waiting.length === 0 ? (
              <p className="type-data-read text-label-secondary">
                Nothing waits to be published. What an advisor shares with the whole agency arrives here.
              </p>
            ) : (
              <Rows>
                {waiting.map((q) => (
                  <RowStack key={q.id} head={<span className="row-primary type-data-strong">{q.text}</span>}>
                    {q.kind} · shared by {q.by}
                  </RowStack>
                ))}
              </Rows>
            )}
          </Section>
        );

      case "confirm":
        return (
          <Section key={w.id} anchor={w.id} title="Records to confirm" chips={<Chip tone="neutral">{candidates.length} waiting</Chip>} footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}>
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
            key={w.id} anchor={w.id}
            title="Connections"
            chips={connectionHealth.needAttention > 0 ? <Chip tone="neutral">{connectionHealth.label}</Chip> : undefined}
            footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}
          >
            {/* The agency's sources, the ones the health count is taken over. An advisor's
                own mailbox is hers, and degrades only her answers. */}
            <Rows>
              {agencySources.map((c) => (
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

      case "unmatched":
        return (
          <Section key={w.id} anchor={w.id} title="Unmatched payments" chips={<Chip tone="neutral">{orphanedPayments.length} to match</Chip>} footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}>
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

      /* Reconciliation is a view of the owner's ledger (/commissions), not a chapter of
         her brief; no widget names it. */
      case "discrepancies":
        return (
          <Section key={w.id} anchor={w.id} title="Under projection" deep footer={<Opens href={w.expandsTo}>{w.expandLabel}</Opens>}>
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

  /* ── the rail: this reader's insights, ranked (src/lib/insights.ts) ───────── */
  const insights = React.useMemo(() => insightsFor(s), [s]);
  const railKey = `briefing-insights-${s.role}`;
  const railOpen = !s.dismissed[railKey];
  /* One card on the right at a time (Constantin, 2026-09-25): a conversation takes the
     slot, and closing it gives the rail back where it was, on the insight asked about.
     The rail stays mounted while hidden, so it keeps its place. */
  const railShown = railOpen && !s.assistantOpen;

  /* Absent, not masked: without the entitlement the money chapters are not drawn. */
  const gatedOut = (w: Widget) => (w.id === "commissions" || w.id === "incentives") && !money;

  return (
    <Page width="wide">
      <PageHeader
        title={<>Good morning, {personName[s.role]}</>}
        actions={!railOpen && insights.length > 0 ? (
          <Button variant="tertiary" size="sm" onClick={() => d({ type: "restore", id: railKey })}>
            Show insights <span className="type-micro tnum">{insights.length}</span>
          </Button>
        ) : undefined}
      >
        <p className="mt-[var(--space-2)] type-meta">{TODAY} · synced {briefing.syncedAt}</p>
      </PageHeader>

      {/* Closed, the rail gives its column back to the chapters. */}
      <div className="doc-layout" style={railShown ? undefined : { gridTemplateColumns: "minmax(0, 1fr)" }}>
        <div className="min-w-0">

          {/* The day, written. Serif because it is addressed to a person; figures inline. */}
          <section className="chapter" data-slot="chapter" data-chapter="today" id="chapter-today">
            <p className="max-w-[62ch] type-prose-lead">{lead}</p>
            <p className="mt-[var(--space-3)] type-meta">
              <StatusDot tone="warn">TripSuite figures up to 48 hours behind</StatusDot>
            </p>
          </section>

          {widgets.filter((w) => !gatedOut(w)).map(chapter)}
        </div>

        {railOpen && (
          <aside className={railShown ? "doc-rail" : "doc-rail hidden"} data-rail-label="Insights">
            <InsightRail
              insights={insights}
              onClose={() => d({ type: "dismiss", id: railKey })}
              onSheet={() => setWriting(true)}
              /* The rail hands an insight to the assistant, which takes the right-hand slot. */
              onWhy={(id) => askAssistant(d, s, `why:${id}`, "/briefing", true)}
              paused={!railShown}
            />
          </aside>
        )}
      </div>

      <AnnouncementSheet open={writing} onOpenChange={setWriting} />
    </Page>
  );
}
