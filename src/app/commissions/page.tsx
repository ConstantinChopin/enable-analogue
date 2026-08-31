"use client";
/**
 * Commissions — the Ledger archetype (layout-exploration §7).
 *
 * This is where the briefing's commissions widget expands to: filter bar · table ·
 * right detail panel. The widget is a saved view onto this surface, so `?state=open`
 * arrives already applied (§8, DEC §10.2).
 *
 * The whole surface is entitlement-gated. For a colleague the ledger is absent, with
 * the policy stated — never a masked table.
 */
import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, canViewCommissions } from "@/lib/store";
import { commissions, briefing, personName, roleLabel, type Commission } from "@/data/seed";
import { Page, PageHeader, SplitPage } from "@/components/layouts";
import { Chip, Section, Segmented, MoneyValue, SourceTag, SeverityBanner, NarrationNote } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowRight, Search } from "lucide-react";

type FilterKey = "open" | "overdue" | "paid" | "discrepancy" | "all";

const FILTERS: { value: FilterKey; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "discrepancy", label: "Discrepancies" },
  { value: "all", label: "All" },
];

/** Overdue first, then chased, then due, then paid; within a band, oldest first. */
const BAND: Record<Commission["state"], number> = { overdue: 0, chased: 1, due: 2, paid: 3 };

const eur = (n: number) => `EUR ${n.toLocaleString("en-GB")}`;

function stateChip(c: Commission) {
  if (c.state === "overdue") return <Chip tone="crit">overdue</Chip>;
  if (c.state === "chased") return <Chip tone="primary">chased</Chip>;
  if (c.state === "paid") return <Chip tone="ok">paid</Chip>;
  return <Chip tone="neutral">due</Chip>;
}

function ageing(c: Commission) {
  if (c.state === "paid") return `settled ${c.paidDate}`;
  if (c.overdueDays) return `${c.overdueDays} days`;
  return "—";
}

export default function CommissionsPage() {
  return (
    <Suspense fallback={null}>
      <Ledger />
    </Suspense>
  );
}

function Ledger() {
  const { s } = useDemo();
  const money = canViewCommissions(s.role);
  const param = useSearchParams()?.get("state") ?? null;

  const initial: FilterKey =
    param === "all" || param === "overdue" || param === "paid" || param === "discrepancy" ? param : "open";

  const [filter, setFilter] = useState<FilterKey>(initial);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const rows = useMemo(() => {
    const text = q.trim().toLowerCase();
    return commissions
      .filter((c) => {
        if (filter === "open") return c.state !== "paid";
        if (filter === "overdue") return c.state === "overdue" || c.state === "chased";
        if (filter === "paid") return c.state === "paid";
        if (filter === "discrepancy") return Boolean(c.discrepancy);
        return true;
      })
      .filter((c) => {
        if (!text) return true;
        return [c.property, c.bookingRef, c.traveller ?? ""].join(" ").toLowerCase().includes(text);
      })
      .sort((a, b) => BAND[a.state] - BAND[b.state] || (b.overdueDays ?? 0) - (a.overdueDays ?? 0));
  }, [filter, q]);

  const open = commissions.filter((c) => c.state !== "paid");
  const outstanding = open.reduce((n, c) => n + c.amount, 0);
  const overdueCount = commissions.filter((c) => c.state === "overdue").length;

  const active = rows.find((c) => c.id === selected) ?? null;

  if (!money) {
    return (
      <Page width="wide">
        <PageHeader back="/briefing" crumb="Briefing" title="Commissions" />
        <Section>
          <p className="type-data">
            Commission records stay with the owning advisor. Signed in as {personName[s.role]} (
            {roleLabel[s.role]}), this ledger is absent by policy.
          </p>
          <p className="mt-2 type-meta">
            Nothing is masked or blurred here: the rows are not fetched, so there is no figure to
            read past. Sharing a traveller does not share their money.
          </p>
        </Section>
      </Page>
    );
  }

  const header = (
    <>
      <PageHeader
        back="/briefing"
        crumb="Briefing"
        title="Commissions"
        actions={
          <span className="type-code text-muted-foreground tnum">
            {rows.length} of {commissions.length} records
          </span>
        }
      />

      <NarrationNote>
        The briefing widget arrives here with its filter already applied. The widget is a
        saved view onto this ledger, not a page of its own.
      </NarrationNote>
    </>
  );

  return (
    <SplitPage
      header={header}
      panelOpen={Boolean(active)}
      onClosePanel={() => setSelected(null)}
      panelTitle={active ? active.bookingRef : "Commission"}
      panel={active ? <DetailPanel c={active} /> : null}
    >
      <div className="min-w-0">
        {/* ── summary strip ── */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Section>
            <div className="type-code uppercase tracking-widest text-muted-foreground">
              Total outstanding
            </div>
            <div className="mt-1 type-data-strong tnum">{eur(outstanding)}</div>
            <div className="type-meta tnum">{open.length} open commissions</div>
          </Section>
          <Section>
            <div className="type-code uppercase tracking-widest text-muted-foreground">Overdue</div>
            <div className="mt-1 type-data-strong tnum">{overdueCount}</div>
            <div className="type-meta tnum">
              {eur(commissions.filter((c) => c.state === "overdue").reduce((n, c) => n + c.amount, 0))} unrecovered
            </div>
          </Section>
          <Section>
            <div className="type-code uppercase tracking-widest text-muted-foreground">
              Collected this week
            </div>
            <div className="mt-1 type-data-strong tnum">{eur(briefing.headline.collectedThisWeek)}</div>
            <div className="type-meta">actuals read-only from the booking system</div>
          </Section>
        </div>

        {/* ── filter bar ── */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Segmented
            value={filter}
            onChange={(v) => { setFilter(v); setSelected(null); }}
            options={FILTERS}
            label="Commission state"
            className="flex-wrap"
          />
          {/* Both controls are filters, so both are `sm`. This row was the audit's
              exhibit: a 29px segmented beside a 36px input, neither number decided. */}
          <div className="relative min-w-0 flex-1 sm:max-w-[280px]">
            <Search className="absolute left-[10px] top-1/2 size-[var(--icon-md)] -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              size="sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Property, booking reference, traveller…"
              aria-label="Filter commissions"
              className="pl-8"
            />
          </div>
        </div>

        {/* ── the table ── */}
        <Section flush className="mt-4" bodyClassName="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="type-code uppercase tracking-wide">Property</TableHead>
                <TableHead className="hidden type-code uppercase tracking-wide sm:table-cell">
                  Booking
                </TableHead>
                <TableHead className="hidden type-code uppercase tracking-wide lg:table-cell">
                  Traveller
                </TableHead>
                <TableHead className="text-right type-code uppercase tracking-wide">Amount</TableHead>
                <TableHead className="type-code uppercase tracking-wide">State</TableHead>
                <TableHead className="hidden type-code uppercase tracking-wide md:table-cell">
                  Due
                </TableHead>
                <TableHead className="hidden type-code uppercase tracking-wide md:table-cell">
                  Ageing
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => setSelected(c.id === selected ? null : c.id)}
                  aria-selected={c.id === selected}
                  className={cn(
                    "cursor-pointer type-data",
                    c.id === selected && "bg-muted",
                  )}
                >
                  <TableCell className="max-w-[220px] truncate type-data-strong">
                    {c.property}
                    {c.discrepancy && <Chip tone="warn" className="ml-2">under projection</Chip>}
                    {c.creditNotRefund && <Chip tone="crit" className="ml-2">credit</Chip>}
                  </TableCell>
                  <TableCell className="hidden type-code sm:table-cell">
                    {c.bookingRef}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{c.traveller ?? "—"}</TableCell>
                  <TableCell className="text-right type-data-strong tnum">{eur(c.amount)}</TableCell>
                  <TableCell>{stateChip(c)}</TableCell>
                  <TableCell className="hidden text-muted-foreground tnum md:table-cell">{c.dueDate}</TableCell>
                  <TableCell className="hidden text-muted-foreground tnum md:table-cell">{ageing(c)}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-8 text-center type-data text-muted-foreground">
                    No commissions match this view.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Section>
      </div>
    </SplitPage>
  );
}

/* ── right panel ─────────────────────────────────────────────────────────────
   A summary of the record's timeline. The full commission — reminder gate,
   discrepancy handling, chase log — lives on its own route.                    */
function DetailPanel({ c }: { c: Commission }) {
  return (
    <div className="space-y-4 type-data">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="type-data-strong">{c.property}</h3>
          {stateChip(c)}
        </div>
        <p className="mt-1 type-code">
          {c.bookingRef}
          {c.traveller && ` · ${c.traveller}`}
        </p>
      </div>

      <dl className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Projected</dt>
          <dd className="type-data-strong">
            <MoneyValue amount={c.amount} currency={c.currency} /> · {c.projected.rate}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Due</dt>
          <dd className="tnum">
            {c.dueDate}
            {c.overdueDays ? ` · ${c.overdueDays} days late` : ""}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Paid</dt>
          <dd className="tnum">{c.state === "paid" ? c.paidDate : "not yet received"}</dd>
        </div>
      </dl>

      <div className="rounded-md border border-border bg-subtle p-4">
        <div className="type-code uppercase tracking-widest text-muted-foreground">Rate provenance</div>
        <div className="mt-2"><SourceTag kind="portal" label={c.projected.source} /></div>
        {c.projected.incentive && <Chip tone="primary" className="mt-2">{c.projected.incentive}</Chip>}
      </div>

      {c.discrepancy && (
        <SeverityBanner severity="Important">
          <b>Actual under projection.</b>{" "}
          <span className="tnum">
            {eur(c.discrepancy.expected)} expected against {eur(c.discrepancy.actual)} received.
          </span>{" "}
          Possible causes: {c.discrepancy.causes.join(" · ")}. Flagged, never silently absorbed.
        </SeverityBanner>
      )}

      {c.creditNotRefund && (
        <SeverityBanner severity="Critical">
          <b>Resolved as credit, not refund.</b> Commission protection does not apply. The loss is a
          known decision, not a silent write-off.
        </SeverityBanner>
      )}

      <Button asChild size="sm" className="w-full justify-between">
        <Link href={`/commissions/${c.id}`}>
          Open the full commission <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
