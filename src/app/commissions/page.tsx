"use client";
/**
 * Commissions — the ledger, recomposed (docs/rebuild/04-recomposition-brief.md).
 *
 * Job (evals/contracts.mjs): see what is owed and chase what is late. The briefing's
 * commissions widget expands here with its saved view already applied (`?state=`),
 * so the widget is a view onto this ledger, not a page of its own.
 *
 * 2026-09-28, UX sweep NAV-01, NAV-03, COL-02, COL-06, COL-07, COL-12 (VIS-095, VIS-096):
 *   title row   the name, one count, no create (a commission arrives from a booking).
 *               The figure line under it says what is outstanding and how much of it is
 *               overdue, once.
 *   toolbar     the state switch (Open · Overdue · Paid · Discrepancies · All) and the
 *               search, then the result and its true order. No counts on the switch: the
 *               figure line and the result carry them, so "Overdue" and "4 overdue" can
 *               no longer disagree (overdue includes chased: both are past due, unpaid).
 *   ledger      one Table; a row selects on click, opens on Enter or double-click.
 *   inspector   the commission in the page's words, "Open ↗" to it, and its one next
 *               act pinned in the footer ("Draft a reminder"), never "Open the commission"
 *               as the ink button.
 * The view, the search and the selection live in the URL (`state`, `q`, `sel`), so Back
 * from a commission restores the ledger as it was left.
 *
 * State is read through ./ledger.ts: a reminder sent this session makes a row chased,
 * and a payment the owner matched makes it paid, here and on the commission (COL-12).
 *
 * Entitlement-gated: for a user the owner has not given money, the ledger is absent,
 * with who can change that. Never a masked table.
 */
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDemo, canViewCommissions, allTrips } from "@/lib/store";
import { inCommissions } from "@/lib/trip-checks";
import { commissions, people, personName, productById, type Commission } from "@/data/seed";
import { termsFor } from "@/data/trip-lines";
import {
  Page, PageHeader, SplitPage, ListToolbar, ListSearch, useQueryState,
} from "@/components/layouts";
import { Chip, Section, Segmented, SourceTag, DataList, Done, Warning } from "@/components/bits";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  eur, liveState, isLate, ledgerOrder, reminderSent, settlementFor, travellerHref, sentLine, type LiveState,
} from "./ledger";

type FilterKey = "open" | "overdue" | "paid" | "discrepancy" | "all";

const FILTERS: { value: FilterKey; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "discrepancy", label: "Discrepancies" },
  { value: "all", label: "All" },
];
const isFilter = (v: string): v is FilterKey => FILTERS.some((f) => f.value === v);

/** The order the result says it is in, per view. */
const ORDER: Record<FilterKey, string> = {
  open: "overdue first, then by due date",
  overdue: "longest overdue first",
  paid: "most recently paid first",
  discrepancy: "overdue first, then by due date, then paid",
  all: "overdue first, then by due date, then paid",
};

/** Colour means severity (VIS-097): ochre only for "decide" (overdue and not chased:
    chase it or not); chased, due and paid are states, in words. */
function StateChip({ st }: { st: LiveState }) {
  if (st === "overdue") return <Chip tone="warn">overdue</Chip>;
  return <Chip tone="neutral">{st}</Chip>;
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
  const router = useRouter();
  const money = canViewCommissions(s);

  const [stateParam, setStateParam] = useQueryState("state", "open");
  const filter: FilterKey = isFilter(stateParam) ? stateParam : "open";
  const [qParam, setQParam] = useQueryState("q");
  /* The field holds its own text so typing never waits on the router; the URL follows. */
  const [q, setQ] = useState(qParam);
  const [sel, setSel] = useQueryState("sel");

  const inView = (c: Commission, f: FilterKey) => {
    const st = liveState(s, c);
    if (f === "open") return st !== "paid";
    if (f === "overdue") return isLate(st);
    if (f === "paid") return st === "paid";
    if (f === "discrepancy") return Boolean(c.discrepancy);
    return true;
  };

  const rows = useMemo(() => {
    const text = q.trim().toLowerCase();
    return commissions
      .filter((c) => inView(c, filter))
      .filter((c) => !text || [c.property, c.bookingRef, c.traveller ?? ""].join(" ").toLowerCase().includes(text))
      .sort(ledgerOrder(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, q, s]);

  const open = commissions.filter((c) => liveState(s, c) !== "paid");
  const outstanding = open.reduce((n, c) => n + c.amount, 0);
  const late = commissions.filter((c) => isLate(liveState(s, c)));
  const lateSum = late.reduce((n, c) => n + c.amount, 0);

  const active = rows.find((c) => c.id === sel) ?? null;

  /* The inspector's footer: the commission's one next act. A late commission is chased:
     "Draft a reminder" opens the draft on the commission page, where it is read and
     sent. Once sent, the footer says so in place. Nothing to do, no footer. */
  const nextAct = (c: Commission) => {
    const st = liveState(s, c);
    const sent = reminderSent(s, c);
    if (sent) return <Done>{sentLine(sent)}</Done>;
    if (!isLate(st)) return undefined;
    return (
      <Button className="w-full" onClick={() => router.push(`/commissions/${c.id}?draft=1`)}>
        {st === "chased" ? "Draft a follow-up" : "Draft a reminder"}
      </Button>
    );
  };

  if (!money) {
    return (
      <Page width="wide">
        <PageHeader title="Commissions" />
        <Section>
          <p className="max-w-[60ch] type-data">
            Commission figures are not open to you in this agency. {people.owner} can open them in
            Settings.
          </p>
        </Section>
      </Page>
    );
  }

  const header = (
    <PageHeader title="Commissions" count={`${commissions.length} commissions`}>
      <p className="mt-[var(--space-2)] type-meta tnum">
        <span className="type-figure text-label">{eur(outstanding)}</span> outstanding
        {late.length > 0 && <> · {eur(lateSum)} of it overdue, on {late.length} {late.length === 1 ? "commission" : "commissions"}</>}
      </p>
    </PageHeader>
  );

  return (
    <SplitPage
      header={header}
      panelOpen={Boolean(active)}
      onClosePanel={() => setSel(null)}
      panelTitle={active ? active.property : "Commission"}
      openHref={active ? `/commissions/${active.id}` : undefined}
      panel={active ? <DetailPanel c={active} /> : null}
      footer={active ? nextAct(active) : undefined}
    >
      <ListToolbar
        state={
          <Segmented
            value={filter}
            onChange={(v) => setStateParam(v)}
            options={FILTERS}
            label="Commission state"
          />
        }
        search={
          <ListSearch
            value={q}
            onChange={(v) => { setQ(v); setQParam(v.trim() ? v : null); }}
            placeholder="Property, booking or traveller"
          />
        }
        result={<>{rows.length} shown · {ORDER[filter]}</>}
      />

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
            const on = c.id === sel;
            const st = liveState(s, c);
            const settled = settlementFor(s, c);
            return (
              <TableRow
                key={c.id}
                onClick={() => setSel(on ? null : c.id)}
                onOpen={() => router.push(`/commissions/${c.id}`)}
                aria-selected={on}
                data-state={on ? "selected" : undefined}
              >
                <TableCell className="max-w-[260px] truncate type-data-strong">
                  {c.property}
                  {c.discrepancy && (
                    <Chip tone={s.decisions[`discrepancy:${c.id}`] ? "neutral" : "warn"} className="ml-[var(--space-2)]">under projection</Chip>
                  )}
                  {c.creditNotRefund && <Chip tone="neutral" className="ml-[var(--space-2)]">credit</Chip>}
                </TableCell>
                <TableCell className="hidden type-meta tnum text-inherit sm:table-cell">{c.bookingRef}</TableCell>
                <TableCell className="hidden text-label-secondary lg:table-cell">{c.traveller ?? "—"}</TableCell>
                <TableCell className="text-right type-data-strong tnum">{eur(c.amount)}</TableCell>
                <TableCell><StateChip st={st} /></TableCell>
                <TableCell className="hidden text-label-secondary tnum md:table-cell">{c.dueDate}</TableCell>
                <TableCell className="hidden text-label-secondary tnum md:table-cell">
                  {st === "paid" ? (settled ? "paid today" : `paid ${c.paidDate}`) : c.overdueDays ? `${c.overdueDays}d` : "—"}
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={7} className="py-[var(--space-8)] text-center text-label-secondary">
                No commissions in this view.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* The builder (the lab): a line confirmed under a programme projects its commission
          here, worked from the programme's terms. Nobody types it twice. The seeded
          bookings above arrived from the booking system; these are this session's. */}
      {s.lab && <ProjectedFromTrips />}
    </SplitPage>
  );
}

function ProjectedFromTrips() {
  const { s } = useDemo();
  const rows = s.tripLines
    .filter(inCommissions)
    .map((l) => {
      const rate = termsFor(l.productId!, l.program!)?.rate ?? 0;
      return { l, trip: allTrips(s).find((t) => t.id === l.tripId), name: productById(l.productId!)?.name ?? l.what, rate, amount: Math.round(l.sell! * rate) };
    });
  if (!rows.length) return null;
  return (
    <Section title="Projected from trips" chips={<span className="type-meta tnum">{rows.length} this session</span>} className="mt-[var(--gap-3)]">
      <ul className="divide-y divide-hairline">
        {rows.map(({ l, trip, name, rate, amount }) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-[var(--space-3)] py-[var(--space-3)]">
            <span className="min-w-0">
              <Link href={`/itineraries/${l.tripId}?line=${l.id}`} className="type-data-strong underline decoration-hairline underline-offset-4 hover:decoration-ink">{name}</Link>
              <span className="block type-meta">{trip?.traveller} · {l.program} {Math.round(rate * 100)}% · ref {l.confirmation?.ref} · confirmed {l.confirmation?.at}</span>
            </span>
            <span className="flex items-center gap-[var(--space-2)]">
              <span className="type-data tnum">EUR {amount.toLocaleString("en-GB")}</span>
              <Chip tone="neutral">projected</Chip>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const linkCls = "underline decoration-hairline underline-offset-4 hover:decoration-ink";

/* ── the inspector: what the row cannot show, in the commission page's words ─────
   Every object is named as a link: the property's record, the traveller (where this
   reader may open them). The figures match the commission page: projected is what the
   terms said, paid is what arrived. */
function DetailPanel({ c }: { c: Commission }) {
  const { s } = useDemo();
  const st = liveState(s, c);
  const settled = settlementFor(s, c);
  const traveller = travellerHref(s, c.traveller);
  const expected = c.discrepancy?.expected ?? c.amount;
  const decided = s.decisions[`discrepancy:${c.id}`];

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <StateChip st={st} />
        <span className="type-meta tnum">{c.bookingRef}</span>
      </div>

      <DataList
        rows={[
          {
            label: "Property",
            value: c.productId
              ? <Link href={`/records/${c.productId}`} className={linkCls}>{c.property}</Link>
              : c.property,
          },
          {
            label: "Traveller",
            value: c.traveller
              ? traveller ? <Link href={traveller} className={linkCls}>{c.traveller}</Link> : c.traveller
              : undefined,
          },
          { label: "Projected", value: <span className="tnum">{eur(expected)} · {c.projected.rate}</span> },
          {
            label: "Due",
            value: <span className="tnum">{c.dueDate}{isLate(st) && c.overdueDays ? ` · ${c.overdueDays} days late` : ""}</span>,
          },
          {
            label: "Paid",
            value: settled
              ? <span className="tnum">{eur(settled.payment.amount)} · matched today</span>
              : st === "paid"
                ? <span className="tnum">{eur(c.discrepancy?.actual ?? c.amount)} · {c.paidDate}</span>
                : <span className="text-label-secondary">not yet</span>,
          },
        ]}
      />

      <div>
        <div className="type-meta text-label-tertiary">Rate from</div>
        <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-[var(--space-2)]">
          <SourceTag kind="portal" label={c.projected.source} />
          {c.projected.incentive && <Chip tone="neutral">{c.projected.incentive}</Chip>}
        </div>
      </div>

      {c.discrepancy && (
        <Warning
          title={`${eur(c.discrepancy.expected - c.discrepancy.actual)} under projection`}
          kept={decided ? `${decided.what} · ${personName[decided.by]}, ${decided.at}` : undefined}
        >
          {eur(c.discrepancy.expected)} expected, {eur(c.discrepancy.actual)} received. Accept it or
          dispute it on the commission.
        </Warning>
      )}

      {c.creditNotRefund && (
        <p className="type-data text-label-secondary">
          Resolved as a hotel credit, not a refund, so commission protection does not apply.
        </p>
      )}
    </div>
  );
}

