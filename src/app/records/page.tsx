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
 * New record (U23) is the page's secondary, in the title row beside the view toggle.
 * Its sheet checks name and place against the directory and against what this person
 * can already see; a match is offered instead of a duplicate, and "Create record" is
 * the sheet's own filled action. A record added by hand starts private to its maker,
 * the owner included, and sits in her list marked "added by hand". Its inspector
 * carries "Change sharing" (secondary) → a sheet whose filled action is "Share record".
 * Who else sees it follows the one sharing rule: a team share reaches the Paris desk,
 * which has no other sign-in; the whole agency waits for the owner's release unless
 * the owner shared it herself.
 *
 * New local component: FacetChip — a FilterChip that forwards its ref and props so
 * a Popover can anchor to it. Same geometry and the same inverse-when-selected rule.
 */
import { Suspense, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  useDemo, canViewCommissions, scopeAudience,
  type CreatedRecord, type DemoState, type ShareScope,
} from "@/lib/store";
import {
  products, directoryCounts, filterOptions, leandreFields, notices, people, personName, promotions,
  type Product, type ProductCategory, type EvidenceKind, type Layer, type Persona,
} from "@/data/seed";
import { PageHeader, SplitPage, ViewToggle, PropertyImage } from "@/components/layouts";
import {
  Chip, ConfirmBanner, EmptyState, Section, Segmented, FilterChip, EvidenceDot, FreshnessDate, SeverityBanner,
  SourceTag, DataList,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, ChevronDown, MessageSquareText, Plus, X } from "lucide-react";

/* ── records added by hand ──────────────────────────────────────────────────────
   Who sees a record someone made. Its maker, always. Anyone else only when it is
   shared with the whole agency and has reached it: the owner's own share at once, an
   advisor's once the owner has released it from the publish queue. A team share
   reaches the Paris desk, which has no other sign-in, so it is absent for the other
   type — never masked. Mirrored in /records/[id]; it belongs beside queueItems in
   the store.                                                                        */
function createdVisible(s: DemoState, r: CreatedRecord) {
  if (r.by === s.role) return true;
  if (r.share !== "agency") return false;
  return r.by === "owner" || s.released[`rec-${r.id}`]?.outcome === "published";
}

/* What the record's sharing says, to the person looking at it. */
function shareStatus(s: DemoState, r: CreatedRecord): { chip: string; tone: "neutral" | "warn"; line: string } {
  const maker = personName[r.by];
  const decided = s.released[`rec-${r.id}`];
  const releaser = s.role === "owner" ? "you" : people.owner;
  if (r.by !== s.role) {
    return {
      chip: "shared with the whole agency", tone: "neutral",
      line: `Added by hand by ${maker}${r.by === "user" ? `, released by ${releaser}` : ""}. Only ${maker} can change who sees it.`,
    };
  }
  if (r.share === "private") return { chip: "private to you", tone: "neutral", line: "Nobody else sees it until you share it." };
  if (r.share === "team") return { chip: "shared with your team", tone: "neutral", line: `${scopeAudience("team", s.role)} see it. Nobody else does.` };
  if (r.by === "owner") return { chip: "shared with the whole agency", tone: "neutral", line: "Every advisor in the agency sees it, with your name kept." };
  if (decided?.outcome === "published") {
    return { chip: "shared with the whole agency", tone: "neutral", line: `Released by ${people.owner}. Every advisor in the agency sees it, with your name kept.` };
  }
  if (decided?.outcome === "returned") {
    return {
      chip: `returned by ${people.owner}`, tone: "warn",
      line: decided.note ? `${people.owner} returned it: “${decided.note}” Nobody else sees it.` : `${people.owner} returned it without a note. Nobody else sees it.`,
    };
  }
  return { chip: `waiting for ${people.owner}`, tone: "warn", line: `In ${people.owner}’s publish queue. Nobody else sees it until she releases it.` };
}

/* Name and place, compared the way a person would: case, accents and spacing aside,
   and "Paris" matching "Paris 4e". */
const norm = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const samePlace = (a: string, b: string) => a === b || a.startsWith(b + " ") || b.startsWith(a + " ");
const slug = (v: string) => norm(v).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "record";

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
          : "border-control-edge bg-control-rest text-label hover:border-control-edge-hover hover:bg-control-rest-hover",
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
  const [newOpen, setNewOpen] = useState(false);
  const [newKey, setNewKey] = useState(0);
  const [justCreated, setJustCreated] = useState<string | null>(null);
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

  /* Records added by hand that this person can see, newest first. They carry none of
     the facets a filter reads, so any applied filter leaves them out. */
  const createdInCategory = useMemo(
    () => s.createdRecords.filter((r) => r.category === category && createdVisible(s, r)).reverse(),
    [s, category],
  );
  const createdRows = applied.length > 0 ? [] : createdInCategory;
  const shown = rows.length + createdRows.length;

  const toggle = (key: FacetKey, value: string) =>
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
    }));

  // A record filtered out of the list takes its panel with it — derived, never synced.
  const selectedProduct = selected ? rows.find((p) => p.id === selected) : undefined;
  const selectedCreated = selected ? createdRows.find((r) => r.id === selected) : undefined;

  const openNew = () => { setNewKey((k) => k + 1); setNewOpen(true); };
  const onCreated = (r: CreatedRecord) => {
    setCategory(r.category);
    setFilters(EMPTY);
    setSelected(r.id);
    setJustCreated(r.id);
  };

  const header = (
    <>
      <PageHeader
        crumb="Records"
        title="Records"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={openNew}>
              <Plus aria-hidden /> New record
            </Button>
            <ViewToggle value={view} onChange={setView} />
          </>
        }
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

    </>
  );

  return (
    <SplitPage
      header={header}
      panelOpen={!!selectedProduct || !!selectedCreated}
      onClosePanel={() => setSelected(null)}
      panelTitle={selectedProduct?.name ?? selectedCreated?.name ?? "Record"}
      panel={
        selectedProduct ? <RecordPanel p={selectedProduct} />
        : selectedCreated ? <CreatedPanel r={selectedCreated} justCreated={justCreated === selectedCreated.id} />
        : null
      }
    >
      <NewRecordSheet
        key={newKey}
        open={newOpen}
        onOpenChange={setNewOpen}
        defaultCategory={category}
        onCreated={onCreated}
      />
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
            <span className="tnum">{shown}</span> {shown === 1 ? "record" : "records"}
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
            <Button variant="tertiary" size="sm" onClick={() => setFilters(EMPTY)}>Clear all</Button>
          </div>
        )}

        {/* ── the two views ── */}
        {shown === 0 ? (
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
            {createdRows.map((r) => (
              <li key={r.id}>
                <CreatedCard r={r} selected={selected === r.id} onSelect={() => setSelected(r.id)} />
              </li>
            ))}
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
                {createdRows.map((r) => {
                  const on = selected === r.id;
                  const status = shareStatus(s, r);
                  return (
                    <TableRow
                      key={r.id}
                      onClick={() => setSelected(r.id)}
                      aria-selected={on}
                      data-state={on ? "selected" : undefined}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <div className="flex items-center gap-[var(--space-3)]">
                          <span className="size-8 shrink-0 overflow-hidden rounded-lg bg-sunken">
                            <PropertyImage id={r.id} name={r.name} category={r.category} src={NO_PHOTO} />
                          </span>
                          <span className="min-w-0">
                            <span className={cn("block type-data-strong", on && "underline decoration-ink underline-offset-4")}>{r.name}</span>
                            <span className="block type-meta">{r.city} · {r.country}</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-label-secondary">—</TableCell>
                      <TableCell className="hidden md:table-cell text-label-secondary">—</TableCell>
                      <TableCell>
                        <span className="flex flex-wrap gap-1">
                          <Chip tone="neutral">added by hand</Chip>
                          <Chip tone={status.tone}>{status.chip}</Chip>
                        </span>
                      </TableCell>
                      {money && <TableCell className="text-label-secondary">—</TableCell>}
                    </TableRow>
                  );
                })}
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
          <span className="tnum">{shown}</span> of <span className="tnum">{inCategory.length + createdInCategory.length}</span>{" "}
          {category} records shown · <span className="tnum">{directoryCounts[category]}</span> in the full directory
          {createdInCategory.length > 0 && <> · <span className="tnum">{createdInCategory.length}</span> added by hand</>}
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
          <Link href={`/records/${p.id}`} onClick={() => { d({ type: "thread", id: null }); d({ type: "assistant", open: true }); }}>
            <MessageSquareText aria-hidden /> Ask about this
          </Link>
        </Button>
      </div>

      {p.hasNotice && notice && s.world === "v2" && !s.retired[notice.id] && (
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
          (role === "user" || f.key !== "note-rd"),
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

/* ═══════════════ Added by hand ═══════════════ */

/* A record added by hand has no photograph. An empty data URL fails at once, so the
   plate falls back to its generated drawing without a request for a file that is not
   there. */
const NO_PHOTO = "data:,";

/* The card for a record someone made: the same anatomy as a listing card, and the two
   facts that differ — it was added by hand, and who can see it. */
function CreatedCard({ r, selected, onSelect }: { r: CreatedRecord; selected: boolean; onSelect: () => void }) {
  const { s } = useDemo();
  const status = shareStatus(s, r);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-state={selected ? "selected" : undefined}
      aria-label={`${r.name} — ${r.city}, ${r.country} · added by hand`}
      className="group block w-full cursor-pointer rounded-lg text-left"
    >
      <span
        className={cn(
          "img-hover block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sunken",
          selected && "ring-2 ring-selected ring-offset-2 ring-offset-base",
        )}
      >
        <PropertyImage id={r.id} name={r.name} category={r.category} src={NO_PHOTO} />
      </span>
      <span className="mt-[var(--space-3)] flex flex-col gap-1">
        <span
          className={cn(
            "min-w-0 truncate type-data-strong underline-offset-4 group-hover:underline group-hover:decoration-ink",
            selected && "underline decoration-ink",
          )}
        >
          {r.name}
        </span>
        <span className="type-data text-label-secondary">{r.city} · {r.country}</span>
        <span className="type-data text-label-secondary">Added by hand by {personName[r.by]} · today</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-1">
          <Chip tone="neutral">added by hand</Chip>
          <Chip tone={status.tone}>{status.chip}</Chip>
        </span>
      </span>
    </button>
  );
}

/* The inspector for a record added by hand. The primary is the same as any record's;
   sharing is the secondary, and only its maker has it. */
function CreatedPanel({ r, justCreated }: { r: CreatedRecord; justCreated: boolean }) {
  const { s } = useDemo();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareKey, setShareKey] = useState(0);
  const mine = r.by === s.role;
  const status = shareStatus(s, r);

  return (
    <div className="space-y-[var(--space-6)]">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sunken">
        <PropertyImage id={r.id} name={r.name} category={r.category} src={NO_PHOTO} />
      </div>

      <div>
        <h2 className="type-section">{r.name}</h2>
        <p className="mt-1 type-meta">{r.category} · {r.city}, {r.country}</p>
        <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-[var(--space-2)]">
          <Chip tone="neutral">added by hand</Chip>
          <Chip tone={status.tone}>{status.chip}</Chip>
        </div>
      </div>

      <ConfirmBanner show={justCreated && mine && r.share === "private"}>
        Created — private to you. Nobody else sees it until you share it.
      </ConfirmBanner>

      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <Button asChild size="sm">
          <Link href={`/records/${r.id}`}>Open full record <ArrowRight aria-hidden /></Link>
        </Button>
        {mine && (
          <Button variant="secondary" size="sm" onClick={() => { setShareKey((k) => k + 1); setShareOpen(true); }}>
            Change sharing
          </Button>
        )}
      </div>

      <Section title="The record">
        <DataList rows={[
          { label: "Category", value: r.category },
          { label: "City", value: r.city },
          { label: "Country", value: r.country },
          { label: "Added", value: `By hand · ${personName[r.by]} · today` },
        ]} />
        <p className="mt-[var(--space-3)] type-meta">
          Only what was typed is on file. No source stands behind these values yet.
        </p>
      </Section>

      <Section title="Who sees it">
        <p className="type-data-read text-label-secondary">{status.line}</p>
      </Section>

      {mine && <ShareSheet key={shareKey} r={r} open={shareOpen} onOpenChange={setShareOpen} />}
    </div>
  );
}

/* ── the share control: just me · my team · the whole agency ─────────────────────
   Said before it is committed: for an advisor the whole agency waits for the owner;
   for the owner it goes out at once. Mirrored on the record's own page.            */
function ShareChoices({
  role, value, onChange, idPrefix,
}: { role: Persona; value: ShareScope; onChange: (v: ShareScope) => void; idPrefix: string }) {
  const options: { v: ShareScope; label: string; hint: string }[] = [
    { v: "private", label: "Just me", hint: `Only ${personName[role]}` },
    { v: "team", label: "My team", hint: `${scopeAudience("team", role)} · at once` },
    {
      v: "agency", label: "The whole agency",
      hint: role === "owner"
        ? "Every advisor in the agency · at once"
        : `Every advisor in the agency · waits for ${people.owner} to release it`,
    },
  ];
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as ShareScope)}>
      {options.map((o) => (
        <div key={o.v} className="flex items-start gap-[var(--space-3)]">
          <RadioGroupItem value={o.v} id={`${idPrefix}-${o.v}`} className="mt-px" />
          <Label htmlFor={`${idPrefix}-${o.v}`} className="flex flex-col items-start gap-0.5">
            <span className="type-data">{o.label}</span>
            <span className="type-meta">{o.hint}</span>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

/* What happens on share, in one sentence, before it happens. */
function onShareLine(role: Persona, scope: ShareScope) {
  if (scope === "private") return "Only you see it. Anyone it was shared with loses it.";
  if (scope === "team") return `${scopeAudience("team", role)} see it at once.`;
  if (role === "owner") return "Every advisor in the agency sees it at once, with your name kept.";
  return `It goes to ${people.owner}’s publish queue. Nobody else sees it until she releases it, and your name travels with it.`;
}

function ShareSheet({ r, open, onOpenChange }: { r: CreatedRecord; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { s, d } = useDemo();
  const [scope, setScope] = useState<ShareScope>(r.share);

  const commit = () => {
    if (scope === r.share) return;
    d({ type: "shareCreated", kind: "record", id: r.id, scope });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Share {r.name}</SheetTitle>
          <SheetDescription>
            It started private to you. Sharing with your team is immediate; the whole agency is the owner’s to release.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-[var(--space-6)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
          <div>
            <div className="type-data-strong">Who can see this record?</div>
            <div className="mt-[var(--space-3)]">
              <ShareChoices role={s.role} value={scope} onChange={setScope} idPrefix={`share-${r.id}`} />
            </div>
          </div>
          <div className="border-t border-hairline pt-[var(--space-4)]">
            <div className="type-micro-caps text-label-tertiary">On share</div>
            <p className="mt-1 type-data-read text-label-secondary">
              {scope === r.share ? "This is who sees it now." : onShareLine(s.role, scope)}
            </p>
          </div>
          <Button disabled={scope === r.share} onClick={commit}>Share record</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── New record: a short form, and a check before anything is created ───────────
   The check reads the directory and the records this person can already see. A
   match is offered in place of the create action: nothing is created twice.       */
function NewRecordSheet({
  open, onOpenChange, defaultCategory, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCategory: ProductCategory;
  onCreated: (r: CreatedRecord) => void;
}) {
  const { s, d } = useDemo();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>(defaultCategory);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const ready = name.trim() !== "" && city.trim() !== "" && country.trim() !== "";

  const match = useMemo(() => {
    if (!name.trim() || !city.trim()) return null;
    const n = norm(name);
    const c = norm(city);
    const hit = (x: { name: string; city: string }) => norm(x.name) === n && samePlace(norm(x.city), c);
    const product = products.find(hit);
    if (product) return { id: product.id, name: product.name, category: product.category, city: product.city, country: product.country, byHand: false };
    const made = s.createdRecords.find((r) => createdVisible(s, r) && hit(r));
    if (made) return { id: made.id, name: made.name, category: made.category, city: made.city, country: made.country, byHand: true };
    return null;
  }, [name, city, s]);

  const create = () => {
    if (!ready || match) return;
    const record: CreatedRecord = {
      id: `hand-${slug(name)}-${s.createdRecords.length + 1}`,
      name: name.trim(),
      category,
      city: city.trim(),
      country: country.trim(),
      by: s.role,
      share: "private",
    };
    d({ type: "createRecord", record });
    onOpenChange(false);
    onCreated(record);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>New record</SheetTitle>
          <SheetDescription>
            What you know about the property. It is private to you when created, and marked as added by hand.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-[var(--space-6)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
          <div>
            <Label htmlFor="new-record-name">Name</Label>
            <Input id="new-record-name" className="mt-[var(--space-2)]" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </div>

          <div>
            <div className="type-data-strong">Category</div>
            <Segmented
              label="Category"
              className="mt-[var(--space-2)]"
              value={category}
              onChange={setCategory}
              options={filterOptions.category.map((c) => ({ value: c, label: c }))}
            />
          </div>

          <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
            <div>
              <Label htmlFor="new-record-city">City</Label>
              <Input id="new-record-city" className="mt-[var(--space-2)]" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="off" />
            </div>
            <div>
              <Label htmlFor="new-record-country">Country</Label>
              <Input id="new-record-country" className="mt-[var(--space-2)]" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="off" />
            </div>
          </div>

          {match ? (
            <div className="rounded-lg bg-sunken px-[var(--space-4)] py-[var(--space-3)]" role="status">
              <div className="type-micro-caps text-label-tertiary">Already in the directory</div>
              <div className="mt-1 type-data-strong">{match.name}</div>
              <div className="type-meta">
                {match.category} · {match.city}{match.country !== "—" ? `, ${match.country}` : ""}
                {match.byHand ? " · added by hand" : ""}
              </div>
              <p className="mt-[var(--space-2)] type-data-read text-label-secondary">
                A record with this name and place exists, so a second one is not created. If this is a different
                property, change the name or the place.
              </p>
              <Button asChild className="mt-[var(--space-3)]">
                <Link href={`/records/${match.id}`} onClick={() => onOpenChange(false)}>
                  Open {match.name} <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="border-t border-hairline pt-[var(--space-4)]">
                <div className="type-micro-caps text-label-tertiary">On create</div>
                <p className="mt-1 type-data-read text-label-secondary">
                  Private to {personName[s.role]}, added by hand today. Share it with your team or the whole agency from
                  the record when you choose.
                </p>
              </div>
              <Button disabled={!ready} onClick={create}>Create record</Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
