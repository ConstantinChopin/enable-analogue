"use client";
/**
 * Commissions — the ledger, recomposed (docs/rebuild/04-recomposition-brief.md).
 *
 * Job (evals/contracts.mjs): see what is owed and chase what is late. The briefing's
 * commissions widget expands here with its saved view already applied (`?state=`),
 * so the widget is a view onto this ledger, not a page of its own.
 *
 * Chapters, in order: the figure line under the title (outstanding · overdue ·
 * unrecovered) · the ledger — saved views as a Segmented (selected inverts), a search
 * field at the same control size, and the Table (micro-caps heads, 40px rows,
 * hairlines; the selected row carries a 2px ink left edge via data-state="selected").
 *
 * The one primary: "Open the commission", at the bottom of the inspector — the tool
 * that follows the selected row (contract: open a commission). Nothing else on the
 * surface is filled. The inspector summarises the timeline; the full commission —
 * reminder gate, discrepancy handling, chase log — lives on /commissions/[id].
 *
 * Entitlement-gated: for a colleague the ledger is absent, with the policy stated —
 * never a masked table. No new components.
 */
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDemo, canViewCommissions } from "@/lib/store";
import { commissions, personName, roleLabel, type Commission } from "@/data/seed";
import { Page, PageHeader, SplitPage } from "@/components/layouts";
import {
  Chip, Section, Segmented, MoneyValue, SourceTag, SeverityBanner, NarrationNote, DataList,
} from "@/components/bits";
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

/** The saved view's predicate, shared by the rows and the counts on the chips. */
const inView = (c: Commission, f: FilterKey) => {
  if (f === "open") return c.state !== "paid";
  if (f === "overdue") return c.state === "overdue" || c.state === "chased";
  if (f === "paid") return c.state === "paid";
  if (f === "discrepancy") return Boolean(c.discrepancy);
  return true;
};

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
  if (c.overdueDays) return `${c.overdueDays}d`;
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
  const money = canViewCommissions(s);
  const param = useSearchParams()?.get("state") ?? null;

  const initial: FilterKey =
    param === "all" || param === "overdue" || param === "paid" || param === "discrepancy" ? param : "open";

  const [filter, setFilter] = useState<FilterKey>(initial);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const rows = useMemo(() => {
    const text = q.trim().toLowerCase();
    return commissions
      .filter((c) => inView(c, filter))
      .filter((c) => {
        if (!text) return true;
        return [c.property, c.bookingRef, c.traveller ?? ""].join(" ").toLowerCase().includes(text);
      })
      .sort((a, b) => BAND[a.state] - BAND[b.state] || (b.overdueDays ?? 0) - (a.overdueDays ?? 0));
  }, [filter, q]);

  const views = useMemo(
    () => FILTERS.map((f) => ({ ...f, count: commissions.filter((c) => inView(c, f.value)).length })),
    [],
  );

  const open = commissions.filter((c) => c.state !== "paid");
  const outstanding = open.reduce((n, c) => n + c.amount, 0);
  const overdue = commissions.filter((c) => c.state === "overdue");
  const unrecovered = overdue.reduce((n, c) => n + c.amount, 0);

  const active = rows.find((c) => c.id === selected) ?? null;

  if (!money) {
    return (
      <Page width="wide">
        <PageHeader title="Commissions" />
        <Section>
          <p className="max-w-[60ch] type-data-read">
            Commission records stay with the owning advisor. Signed in as {personName[s.role]} (
            {roleLabel[s.role]}), this ledger is absent by policy.
          </p>
          <p className="mt-[var(--space-2)] max-w-[60ch] type-meta">
            Nothing is masked or blurred here: the rows are not fetched, so there is no figure to
            read past. Sharing a traveller does not share their money.
          </p>
        </Section>
      </Page>
    );
  }

  const header = (
    <>
      <PageHeader title="Commissions">
        {/* The one figure the briefing widget does not carry: what is unrecovered. */}
        <p className="mt-[var(--space-2)] type-meta tnum">
          <span className="type-figure text-label">{eur(outstanding)}</span> outstanding across{" "}
          {open.length} · {overdue.length} overdue · {eur(unrecovered)} unrecovered
        </p>
      </PageHeader>

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
      <Section>
        {/* Both controls are filters, so both sit at control-sm. */}
        <div className="flex flex-wrap items-center gap-[var(--space-2)]">
          <Segmented
            value={filter}
            onChange={(v) => { setFilter(v); setSelected(null); }}
            options={views}
            label="Commission state"
            className="flex-wrap"
          />
          <div className="relative min-w-0 flex-1 sm:max-w-[280px]">
            <Search
              className="pointer-events-none absolute left-[10px] top-1/2 size-[var(--icon-md)] -translate-y-1/2 text-label-tertiary"
              aria-hidden
            />
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

        <div className="mt-[var(--space-4)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Property</TableHead>
                <TableHead className="hidden sm:table-cell">Booking</TableHead>
                <TableHead className="hidden lg:table-cell">Traveller</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="hidden md:table-cell">Due</TableHead>
                <TableHead className="hidden md:table-cell">Ageing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => {
                const on = c.id === selected;
                return (
                  <TableRow
                    key={c.id}
                    onClick={() => setSelected(on ? null : c.id)}
                    aria-selected={on}
                    data-state={on ? "selected" : undefined}
                    className="cursor-pointer"
                  >
                    <TableCell className="max-w-[220px] truncate type-data-strong">
                      {c.property}
                      {c.discrepancy && <Chip tone="warn" className="ml-[var(--space-2)]">under projection</Chip>}
                      {c.creditNotRefund && <Chip tone="crit" className="ml-[var(--space-2)]">credit</Chip>}
                    </TableCell>
                    <TableCell className="hidden type-code sm:table-cell">{c.bookingRef}</TableCell>
                    <TableCell className="hidden text-label-secondary lg:table-cell">{c.traveller ?? "—"}</TableCell>
                    <TableCell className="text-right type-data-strong tnum">{eur(c.amount)}</TableCell>
                    <TableCell>{stateChip(c)}</TableCell>
                    <TableCell className="hidden text-label-secondary tnum md:table-cell">{c.dueDate}</TableCell>
                    <TableCell className="hidden text-label-secondary tnum md:table-cell">{ageing(c)}</TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-[var(--space-8)] text-center text-label-secondary">
                    No commissions match this view.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <p className="mt-[var(--space-3)] type-meta tnum">
          {rows.length} of {commissions.length} records · overdue first, oldest first
        </p>
      </Section>
    </SplitPage>
  );
}

/* ── the inspector — the tool that follows the selected row ─────────────────────
   A summary of the record's timeline, and the one primary at its bottom. The full
   commission — reminder gate, discrepancy handling, chase log — is its own route. */
function DetailPanel({ c }: { c: Commission }) {
  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <div>
        <div className="flex flex-wrap items-center gap-[var(--space-2)]">
          <h3 className="type-section">{c.property}</h3>
          {stateChip(c)}
        </div>
        <p className="mt-1 type-meta">
          <span className="type-code">{c.bookingRef}</span>
          {c.traveller && ` · ${c.traveller}`}
        </p>
      </div>

      <DataList
        rows={[
          {
            label: "Projected",
            value: (
              <span className="type-data-strong">
                <MoneyValue amount={c.amount} currency={c.currency} /> · {c.projected.rate}
              </span>
            ),
          },
          {
            label: "Due",
            value: (
              <span className="tnum">
                {c.dueDate}
                {c.overdueDays ? ` · ${c.overdueDays}d late` : ""}
              </span>
            ),
          },
          {
            label: "Paid",
            value: c.state === "paid"
              ? <span className="tnum">{c.paidDate}</span>
              : <span className="text-label-secondary">not yet received</span>,
          },
        ]}
      />

      <div>
        <div className="type-micro-caps text-label-tertiary">Rate provenance</div>
        <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-[var(--space-2)]">
          <SourceTag kind="portal" label={c.projected.source} />
          {c.projected.incentive && <Chip tone="primary">{c.projected.incentive}</Chip>}
        </div>
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

      <Button asChild className="w-full">
        <Link href={`/commissions/${c.id}`}>
          Open the commission <ArrowRight aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
