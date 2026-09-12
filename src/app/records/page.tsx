"use client";
/**
 * Records — recomposed as search results (docs/rebuild/04-recomposition-brief.md).
 *
 * Affinity: Airbnb's search results (anatomy/surfaces/search-results.md). Many
 * entities, scanned: a band of filter chips under the title, the count set as meta,
 * and a list of entity cards that are an image plus a caption with no container —
 * the grid gaps (24 / 40) do the separating. Hierarchy inside a caption is weight
 * and colour, never size. The table is the alternate view, on the ledger primitive.
 *
 * Chapters, in order: the category band (Segmented) · the filter band (facet chips
 * that open their popovers; the applied values as inverted chips) · the list (grid
 * or table) · the count line. Beside it, the inspector: the record's plate, its
 * evidence, its notice, then the record's own chapters (three layers for Maison
 * Léandre; one chapter of fields for everything else).
 *
 * The one primary: "Open full record" (contract: open a record). It lives at the
 * top of the inspector, the tool that follows the selection; with nothing selected
 * the page has no filled button. "Ask about this" is the secondary beside it.
 * Selecting a card or a row is the same act in either view.
 *
 * New local component: FacetChip — a FilterChip that forwards its ref and props so
 * a Popover can anchor to it. Same geometry and the same inverse-when-selected rule.
 */
import { Suspense, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, canViewCommissions } from "@/lib/store";
import {
  products, directoryCounts, filterOptions, leandreFields, notices, people, promotions,
  type Product, type ProductCategory, type EvidenceKind, type Layer,
} from "@/data/seed";
import { PageHeader, SplitPage, ViewToggle, PropertyImage } from "@/components/layouts";
import {
  Chip, EmptyState, Section, Segmented, FilterChip, EvidenceDot, FreshnessDate, SeverityBanner,
  NarrationNote, SourceTag, DataList,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, ChevronDown, MessageSquareText, X } from "lucide-react";

/* ── evidence mark ──────────────────────────────────────────────────────────────
   EvidenceDot carries the four settled states. "unconfirmed" is not a trust state
   but the absence of one, so it reads as a chip rather than a dot.               */
function EvidenceMark({ kind, label }: { kind: EvidenceKind; label: string }) {
  if (kind === "unconfirmed") return <Chip tone="warn">{label}</Chip>;
  return <EvidenceDot kind={kind} label={label} />;
}

/* ── FacetChip — a filter chip a popover can anchor to ──────────────────────────
   FilterChip's geometry (32 high, a pill, hairline at rest, inverse when it holds
   a pick) with the ref and the trigger props forwarded, which FilterChip does not
   do. `aria-pressed` says whether the facet is filtering; the chevron says it opens. */
function FacetChip({
  selected, count, className, children, ...props
}: ComponentProps<"button"> & { selected?: boolean; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      data-slot="filter-chip"
      className={cn(
        "pressable inline-flex h-[var(--control-h-sm)] cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-[var(--control-px-sm)] type-data",
        selected
          ? "border-selected bg-selected text-on-selected"
          : "border-hairline bg-raised text-label hover:border-stroke-hover",
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined && (
        <span className={cn("type-micro tnum", selected ? "text-on-selected/70" : "text-label-tertiary")}>{count}</span>
      )}
      <ChevronDown className="size-[var(--icon-sm)]" aria-hidden />
    </button>
  );
}

/* ── facets ─────────────────────────────────────────────────────────────────── */
type FacetKey = "region" | "luxuryTier" | "programme" | "status" | "consortia" | "evidence" | "promotion";
type Filters = Record<FacetKey, string[]>;

const EMPTY: Filters = { region: [], luxuryTier: [], programme: [], status: [], consortia: [], evidence: [], promotion: [] };

const FACETS: {
  key: FacetKey;
  label: string;
  options: { value: string; label: string }[];
  match: (p: Product, v: string) => boolean;
}[] = [
  {
    key: "region", label: "Region",
    options: filterOptions.region.map((r) => ({ value: r, label: r })),
    match: (p, v) => p.region === v,
  },
  {
    key: "luxuryTier", label: "Tier",
    options: filterOptions.luxuryTier.map((t) => ({ value: t, label: t })),
    match: (p, v) => p.luxuryTier === v,
  },
  {
    key: "programme", label: "Programme",
    options: filterOptions.programme.map((t) => ({ value: t, label: t })),
    match: (p, v) => p.programs.includes(v),
  },
  {
    key: "status", label: "Status",
    options: filterOptions.status.map((t) => ({ value: t, label: t })),
    match: (p, v) => p.status === v,
  },
  {
    key: "consortia", label: "Consortia",
    options: filterOptions.consortia.map((t) => ({ value: t, label: t })),
    match: (p, v) => p.consortia.includes(v),
  },
  {
    key: "evidence", label: "Evidence",
    options: filterOptions.evidence.map((e) => ({ value: e.key, label: e.label })),
    match: (p, v) => p.evidence.kind === v,
  },
  /* An incentive is a fact about a promotion, not a trust state of a record — the two
     were conflated in the evidence facet, so the briefing's incentives widget listed
     three properties and expanded into a filter that returned one. This facet reads
     the promotions themselves, which is what the widget is summarising. */
  {
    key: "promotion", label: "Promotion",
    options: [{ value: "active", label: "Active incentive" }],
    match: (p, v) => v === "active" && promotions.some((pr) => pr.productId === p.id),
  },
];

const facetLabel = (key: FacetKey) => FACETS.find((f) => f.key === key)!.label;
const optionLabel = (key: FacetKey, value: string) =>
  FACETS.find((f) => f.key === key)!.options.find((o) => o.value === value)?.label ?? value;

const CATEGORY_OPTIONS = filterOptions.category.map((c) => ({ value: c, label: c, count: directoryCounts[c] }));

/* ── page ───────────────────────────────────────────────────────────────────── */
export default function RecordsPage() {
  return (
    <Suspense fallback={null}>
      <RecordsCatalogue />
    </Suspense>
  );
}

function RecordsCatalogue() {
  const { s } = useDemo();
  const money = canViewCommissions(s);
  const search = useSearchParams();

  /* Briefing widgets are saved views (§8): the query string is the view, applied on entry. */
  const evidenceParam = search?.get("evidence") ?? null;
  const promotionParam = search?.get("promotion") ?? null;

  const [category, setCategory] = useState<ProductCategory>("Hotel");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [filters, setFilters] = useState<Filters>(() =>
    promotionParam === "active"
      ? { ...EMPTY, promotion: ["active"] }
      : evidenceParam && filterOptions.evidence.some((e) => e.key === evidenceParam)
      ? { ...EMPTY, evidence: [evidenceParam] }
      : EMPTY,
  );
  const [selected, setSelected] = useState<string | null>(null);

  /* An unconfirmed candidate never surfaces to the agency user before it is
     confirmed. The owner sees it, marked unconfirmed, because confirming it is hers. */
  const reviewer = s.role === "owner";
  const visible = useMemo(
    () => products.filter((p) => p.id !== "sereno-kyoto" || s.candidateConfirmed || reviewer),
    [s.candidateConfirmed, reviewer],
  );

  const inCategory = useMemo(() => visible.filter((p) => p.category === category), [visible, category]);

  const rows = useMemo(
    () =>
      inCategory.filter((p) =>
        FACETS.every((f) => {
          const picked = filters[f.key];
          return picked.length === 0 || picked.some((v) => f.match(p, v));
        }),
      ),
    [inCategory, filters],
  );

  const applied = useMemo(
    () => FACETS.flatMap((f) => filters[f.key].map((v) => ({ key: f.key, value: v }))),
    [filters],
  );

  const toggle = (key: FacetKey, value: string) =>
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
    }));

  // A record filtered out of the list takes its panel with it — derived, never synced.
  const selectedProduct = selected ? rows.find((p) => p.id === selected) : undefined;

  const header = (
    <>
      <PageHeader
        crumb="Records"
        title="Records"
        actions={<ViewToggle value={view} onChange={setView} />}
      >
        {/* ── the category band: one control, the selected one inverts ── */}
        <div className="mt-[var(--space-4)] -mx-1 overflow-x-auto px-1 pb-px">
          <Segmented
            label="Record categories"
            value={category}
            onChange={(c) => { setCategory(c); setSelected(null); }}
            options={CATEGORY_OPTIONS}
          />
        </div>
      </PageHeader>

      <NarrationNote>
        The catalogue door into the same reconciled model the chat answers from. Every trust state is
        visible on the card, before it is ever felt in a conversation.
      </NarrationNote>
    </>
  );

  return (
    <SplitPage
      header={header}
      panelOpen={!!selectedProduct}
      onClosePanel={() => setSelected(null)}
      panelTitle={selectedProduct?.name ?? "Record"}
      panel={selectedProduct ? <RecordPanel p={selectedProduct} /> : null}
    >
      <div className="min-w-0">
        {/* ── the filter band ──
            The count is a sibling of the chip row, not an `ml-auto` child of it.
            Inside a wrapping flex, `ml-auto` right-aligns against whichever line the
            element wraps onto rather than a shared axis. Stacked below at narrow
            widths, opposite ends of one row at wide. */}
        <div className="mt-[var(--space-3)] flex flex-col gap-[var(--space-2)] sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-center gap-[var(--space-2)]">
            {FACETS.map((f) => (
              <Popover key={f.key}>
                <PopoverTrigger asChild>
                  <FacetChip
                    selected={filters[f.key].length > 0}
                    count={filters[f.key].length > 0 ? filters[f.key].length : undefined}
                  >
                    {f.label}
                  </FacetChip>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-[var(--space-2)]">
                  <div className="mb-[var(--space-2)] px-1 type-micro-caps text-label-tertiary">{f.label}</div>
                  <div className="space-y-0.5">
                    {f.options.map((o) => {
                      const id = `${f.key}-${o.value}`;
                      return (
                        <label
                          key={o.value}
                          htmlFor={id}
                          className="flex cursor-pointer items-center gap-[var(--space-2)] rounded-md px-1 py-[var(--space-2)] type-data hover:bg-interactive"
                        >
                          <Checkbox
                            id={id}
                            checked={filters[f.key].includes(o.value)}
                            onCheckedChange={() => toggle(f.key, o.value)}
                          />
                          {o.label}
                        </label>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            ))}
          </div>
          <span className="shrink-0 type-meta sm:pt-[var(--space-2)]">
            <span className="tnum">{rows.length}</span> {rows.length === 1 ? "record" : "records"}
          </span>
        </div>

        {/* ── applied values: inverted chips; pressing one removes it ── */}
        {applied.length > 0 && (
          <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-2)]">
            {applied.map((a) => (
              <FilterChip
                key={`${a.key}-${a.value}`}
                selected
                onClick={() => toggle(a.key, a.value)}
              >
                <span className="text-on-selected/70">{facetLabel(a.key)}</span>
                {optionLabel(a.key, a.value)}
                <X className="size-[var(--icon-sm)]" aria-hidden />
                <span className="sr-only">Remove filter</span>
              </FilterChip>
            ))}
            <Button variant="link" size="sm" onClick={() => setFilters(EMPTY)}>Clear all</Button>
          </div>
        )}

        {/* ── the two views ── */}
        {rows.length === 0 ? (
          <EmptyState
            className="mt-[var(--space-4)]"
            title="No records match these filters."
            body="Nothing is hidden by accident — remove a filter to widen the set."
            action={
              <Button variant="secondary" size="sm" onClick={() => setFilters(EMPTY)}>
                Clear all filters
              </Button>
            }
          />
        ) : view === "grid" ? (
          <ul className="mt-[var(--gap-2)] grid grid-cols-1 gap-x-[var(--gap-2)] gap-y-[var(--gap-4)] sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((p) => (
              <li key={p.id}>
                <RecordCard
                  p={p}
                  money={money}
                  selected={selected === p.id}
                  confirmedToday={p.id === "sereno-kyoto" && s.candidateConfirmed}
                  onSelect={() => setSelected(p.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-[var(--gap-2)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Record</TableHead>
                  <TableHead className="hidden sm:table-cell">Tier</TableHead>
                  <TableHead className="hidden md:table-cell">Programme</TableHead>
                  <TableHead>Evidence</TableHead>
                  {money && <TableHead>Rate</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => {
                  const on = selected === p.id;
                  return (
                    <TableRow
                      key={p.id}
                      onClick={() => setSelected(p.id)}
                      aria-selected={on}
                      data-state={on ? "selected" : undefined}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <div className="flex items-center gap-[var(--space-3)]">
                          <span className="size-8 shrink-0 overflow-hidden rounded-lg bg-sunken">
                            <PropertyImage id={p.id} name={p.name} category={p.category} />
                          </span>
                          <span className="min-w-0">
                            <span className={cn("block type-data-strong", on && "underline decoration-ink underline-offset-4")}>{p.name}</span>
                            <span className="block type-meta">{p.city} · {p.country}</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-label-secondary">{p.luxuryTier}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="flex flex-wrap gap-1">
                          {p.programs.length === 0
                            ? <span className="text-label-secondary">—</span>
                            : p.programs.map((pr) => <Chip key={pr} tone="neutral">{pr}</Chip>)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {p.id === "sereno-kyoto" && s.candidateConfirmed
                          ? <Chip tone="ok">confirmed today</Chip>
                          : <EvidenceMark kind={p.evidence.kind} label={p.evidence.label} />}
                      </TableCell>
                      {money && <TableCell className="tnum">{p.rate}</TableCell>}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ── the count line ── */}
        <p className="mt-[var(--gap-2)] type-meta">
          <span className="tnum">{rows.length}</span> of <span className="tnum">{inCategory.length}</span>{" "}
          {category} records shown · <span className="tnum">{directoryCounts[category]}</span> in the full directory
        </p>
      </div>
    </SplitPage>
  );
}

/* ── the listing card: an image plus a caption, no container ─────────────────────
   Image 4:3 at radius 20 (rounded-2xl); title 14/590, meta 14/400 secondary; the
   evidence state on the last line. Hover: the image scales, the title underlines.
   Selected: the image takes a 2px ink ring and the title keeps its underline — a
   difference that is not colour (VIS-021).                                        */
function RecordCard({
  p, money, selected, confirmedToday, onSelect,
}: {
  p: Product; money: boolean; selected: boolean; confirmedToday: boolean; onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-state={selected ? "selected" : undefined}
      aria-label={`${p.name} — ${p.city}, ${p.country}`}
      className="group block w-full cursor-pointer rounded-lg text-left"
    >
      <span
        className={cn(
          "img-hover block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sunken",
          selected && "ring-2 ring-selected ring-offset-2 ring-offset-base",
        )}
      >
        <PropertyImage id={p.id} name={p.name} category={p.category} />
      </span>

      <span className="mt-[var(--space-3)] flex flex-col gap-1">
        <span className="flex items-baseline justify-between gap-[var(--space-2)]">
          <span
            className={cn(
              "min-w-0 truncate type-data-strong underline-offset-4 group-hover:underline group-hover:decoration-ink",
              selected && "underline decoration-ink",
            )}
          >
            {p.name}
          </span>
          {money && p.rate !== "—" && <span className="shrink-0 type-data tnum">{p.rate}</span>}
        </span>
        <span className="type-data text-label-secondary">
          {p.city} · {p.country}
        </span>
        <span className="type-data text-label-secondary">
          {p.luxuryTier}
          {p.programs.length > 0 && <> · {p.programs.join(" · ")}</>}
          {p.status !== "Active" && <> · {p.status}</>}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-1">
          {confirmedToday
            ? <Chip tone="ok">confirmed today</Chip>
            : p.evidence.kind === "unconfirmed"
              ? <Chip tone="warn">{p.evidence.label}</Chip>
              : <Chip tone={p.evidence.kind === "disagree" ? "crit" : p.evidence.kind === "stale" ? "warn" : p.evidence.kind === "incentive" ? "primary" : "neutral"}>{p.evidence.label}</Chip>}
          <FreshnessDate stale={!!p.staleDays}>updated {p.updated}</FreshnessDate>
        </span>
      </span>
    </button>
  );
}

/* ── the inspector: the tool that follows the selection ───────────────────────── */
function RecordPanel({ p }: { p: Product }) {
  const { s, d } = useDemo();
  const money = canViewCommissions(s);
  const notice = notices.find((n) => n.productId === p.id);
  const confirmedToday = p.id === "sereno-kyoto" && s.candidateConfirmed;

  return (
    <div className="space-y-[var(--space-6)]">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sunken">
        <PropertyImage id={p.id} name={p.name} category={p.category} />
      </div>

      <div>
        <h2 className="type-section">{p.name}</h2>
        <p className="mt-1 type-meta">
          {p.category} · {p.city}, {p.country}
        </p>
        <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-[var(--space-2)]">
          <Chip tone="neutral">{p.luxuryTier}</Chip>
          {p.status !== "Active" && <Chip tone="warn">{p.status}</Chip>}
          {confirmedToday
            ? <Chip tone="ok">confirmed today</Chip>
            : <EvidenceMark kind={p.evidence.kind} label={p.evidence.label} />}
        </div>
      </div>

      {/* The one primary, and its secondary: always here, never scrolled to. */}
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <Button asChild size="sm">
          <Link href={`/records/${p.id}`}>Open full record <ArrowRight aria-hidden /></Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href="/ask" onClick={() => d({ type: "askScope", scope: p.name })}>
            <MessageSquareText aria-hidden /> Ask about this
          </Link>
        </Button>
      </div>

      {p.hasNotice && notice && s.world === "v2" && (
        <SeverityBanner severity={notice.severity}>
          <div className="type-data-strong">{notice.severity} advisory</div>
          <div>{notice.text}</div>
          <div className="mt-1 type-meta">
            Opened {notice.openedAt} · {notice.scope} scope · {notice.owner}
          </div>
        </SeverityBanner>
      )}
      {/* No v1 caption here. A record that announces its own failure has already
          removed the failure — the point is that the card looks clean and says
          nothing. The frame bar carries the vintage; the silence is the evidence. */}

      <div>
        {p.id === "maison-leandre" ? <LayerSummary money={money} role={s.role} /> : <PlainSummary p={p} money={money} />}
      </div>
    </div>
  );
}

/* Compressed three-layer anatomy — the record's structure, two fields per layer,
   as three chapters. The same primitive the record page uses, so the inspector and
   the record agree about what a layer looks like. */
function LayerSummary({ money, role }: { money: boolean; role: string }) {
  const groups: { layer: Layer; title: string }[] = [
    { layer: "canonical", title: "Enable canonical" },
    { layer: "agency", title: "Agency overlay" },
    { layer: "personal", title: "Personal" },
  ];
  const fieldsFor = (layer: Layer) =>
    leandreFields
      .filter(
        (f) =>
          f.layer === layer &&
          (money || f.key !== "commission") &&
          (role === "advisor" || f.key !== "note-rd"),
      )
      .slice(0, 2);

  return (
    <div>
      {groups.map((g) => {
        const fields = fieldsFor(g.layer);
        if (fields.length === 0) return null;
        return (
          <Section key={g.layer} title={g.title}>
            <dl className="space-y-[var(--space-3)]">
              {fields.map((f) => (
                <div key={f.key}>
                  <dt className="type-meta">{f.label}</dt>
                  <dd className={cn("type-data", f.state === "template" && "italic text-label-secondary")}>
                    {f.value}
                  </dd>
                  <dd className="mt-1 flex flex-wrap items-center gap-x-[var(--space-2)] gap-y-1">
                    <SourceTag kind={f.source.kind} label={f.source.where} />
                    <FreshnessDate stale={f.state === "stale"}>{f.source.when}</FreshnessDate>
                    {f.state === "conflict" && <Chip tone="crit">3 sources disagree</Chip>}
                    {f.state === "edited-overlay" && <Chip tone="primary">agency overlay</Chip>}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        );
      })}
    </div>
  );
}

/* Everything else: one chapter of the record's own fields. */
function PlainSummary({ p, money }: { p: Product; money: boolean }) {
  const rows: { label: string; value: ReactNode }[] = [
    { label: "Region", value: p.region },
    { label: "Rooms", value: p.rooms ? <span className="tnum">{p.rooms}</span> : undefined },
    { label: "Programme", value: p.programs.length ? p.programs.join(" · ") : undefined },
    { label: "Consortia", value: p.consortia.length ? p.consortia.join(" · ") : undefined },
    { label: "Rep firm", value: p.repFirm },
    { label: "Rate", value: money && p.rate !== "—" ? <span className="tnum">{p.rate}</span> : undefined },
  ].filter((r) => r.value !== undefined && r.value !== null && r.value !== "");

  return (
    <Section title="The record">
      {p.blurb && <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data-read text-label-secondary">{p.blurb}</p>}
      <DataList rows={rows} />
      <p className="mt-[var(--space-3)]">
        <FreshnessDate stale={!!p.staleDays}>
          updated {p.updated} · last verified {p.lastVerified}
        </FreshnessDate>
      </p>
      {p.repFirm && (
        <p className="mt-[var(--space-2)] type-meta">
          Represented by {p.repFirm}. Contacts and terms live on the full record.
        </p>
      )}
      {p.id === "sereno-kyoto" && (
        <p className="mt-[var(--space-2)] type-meta">
          A candidate record. It does not answer questions, and it is not offered to a client, until a
          reviewer confirms it field by field — {people.owner} holds that queue.
        </p>
      )}
    </Section>
  );
}
