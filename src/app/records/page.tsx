"use client";
/**
 * Records — the Catalogue archetype (§7).
 *
 * Grid of products with imagery is the default; the table is the alternate view
 * (§10.5). Category tabs, a real filter bar, and one right panel that both views
 * feed. Query params arrive from briefing widgets: ?evidence=stale | incentive.
 */
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, canViewCommissions } from "@/lib/store";
import {
  products, directoryCounts, filterOptions, leandreFields, notices, people, promotions,
  type Product, type ProductCategory, type EvidenceKind, type Layer,
} from "@/data/seed";
import { PageHeader, SplitPage, ViewToggle, PropertyImage } from "@/components/layouts";
import { Chip, EmptyState, Section, EvidenceDot, FreshnessDate, SeverityBanner, NarrationNote, SourceTag } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowRight, ChevronDown, MessageSquareText, X } from "lucide-react";

/* ── evidence mark ──────────────────────────────────────────────────────────────
   EvidenceDot carries the four settled states. "unconfirmed" is not a trust state
   but the absence of one, so it reads as a chip rather than a dot.               */
function EvidenceMark({ kind, label }: { kind: EvidenceKind; label: string }) {
  if (kind === "unconfirmed") return <Chip tone="warn">{label}</Chip>;
  return <EvidenceDot kind={kind} label={label} />;
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
  const money = canViewCommissions(s.role);
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

  /* An unconfirmed candidate never surfaces to a working advisor before it is
     confirmed. Lead and ops see it, marked unconfirmed, because reviewing it is
     their work. */
  const reviewer = s.role === "lead" || s.role === "ops";
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
        {/* ── category tabs ── */}
        <div
          role="tablist"
          aria-label="Record categories"
          className="mt-4 -mx-1 flex gap-1 overflow-x-auto px-1 pb-px"
        >
          {filterOptions.category.map((c) => {
            const on = c === category;
            return (
              <button
                key={c}
                role="tab"
                type="button"
                aria-selected={on}
                onClick={() => { setCategory(c); setSelected(null); }}
                className={cn(
                  "flex h-[var(--control-h-md)] shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 type-data whitespace-nowrap transition-colors",
                  on
                    ? "border-b-foreground font-semibold text-foreground"
                    : "border-b-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
                <span className="type-micro text-muted-foreground tnum">{directoryCounts[c]}</span>
              </button>
            );
          })}
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
      {
          <div className="min-w-0">
            {/* ── filter bar ──
                The count is a sibling of the filter row, not an `ml-auto` child of it.
                Inside a wrapping flex, `ml-auto` right-aligns against whichever line the
                element wraps onto rather than a shared axis — at 375px the count dropped
                74px and sat right-aligned under the facets, reading as a stray value.
                Stacked below at narrow widths, opposite ends of one row at wide. */}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {FACETS.map((f) => (
                <Popover key={f.key}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "control-sm flex cursor-pointer items-center gap-1 border border-border transition-colors hover:bg-muted",
                        filters[f.key].length > 0 ? "font-semibold text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {f.label}
                      {filters[f.key].length > 0 && (
                        <span className="type-micro tnum">{filters[f.key].length}</span>
                      )}
                      <ChevronDown className="size-3" aria-hidden />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-56 p-2">
                    <div className="mb-2 px-1 type-code uppercase tracking-widest text-muted-foreground">
                      {f.label}
                    </div>
                    <div className="space-y-0.5">
                      {f.options.map((o) => {
                        const id = `${f.key}-${o.value}`;
                        return (
                          <label
                            key={o.value}
                            htmlFor={id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-2 type-data hover:bg-muted"
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
              <span className="shrink-0 type-meta sm:pt-1">
                <span className="tnum">{rows.length}</span> {rows.length === 1 ? "record" : "records"}
              </span>
            </div>

            {/* ── applied chips ── */}
            {applied.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {applied.map((a) => (
                  <Chip key={`${a.key}-${a.value}`} tone="primary" className="pr-1">
                    <span className="text-muted-foreground">{facetLabel(a.key)}</span>
                    {optionLabel(a.key, a.value)}
                    <button
                      type="button"
                      aria-label={`Remove filter ${facetLabel(a.key)} ${optionLabel(a.key, a.value)}`}
                      onClick={() => toggle(a.key, a.value)}
                      className="grid size-4 cursor-pointer place-items-center rounded-full hover:bg-border"
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  </Chip>
                ))}
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY)}
                  className="cursor-pointer type-data text-primary underline underline-offset-2"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* ── the two views ── */}
            {rows.length === 0 ? (
              <EmptyState
                className="mt-4"
                title="No records match these filters."
                body="Nothing is hidden by accident — remove a filter to widen the set."
                action={
                  <Button variant="outline" size="sm" onClick={() => setFilters(EMPTY)}>
                    Clear all filters
                  </Button>
                }
              />
            ) : view === "grid" ? (
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
              <Section variant="list" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full type-data">
                    <thead>
                      <tr className="border-b border-border text-left type-micro text-muted-foreground">
                        <th className="py-2 pl-3 pr-3 font-normal">Record</th>
                        <th className="hidden py-2 pr-3 font-normal sm:table-cell">Tier</th>
                        <th className="hidden py-2 pr-3 font-normal md:table-cell">Programme</th>
                        <th className="py-2 pr-3 font-normal">Evidence</th>
                        {money && <th className="py-2 pr-3 font-normal">Rate</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((p) => (
                        <tr
                          key={p.id}
                          onClick={() => setSelected(p.id)}
                          aria-selected={selected === p.id}
                          className={cn(
                            "cursor-pointer",
                            selected === p.id ? "bg-muted/70" : "hover:bg-muted/40",
                          )}
                        >
                          <td className="py-3 pl-3 pr-3">
                            <div className="flex items-center gap-3">
                              <span className="size-8 shrink-0 overflow-hidden rounded-md border border-border">
                                <PropertyImage id={p.id} name={p.name} category={p.category} />
                              </span>
                              <span className="min-w-0">
                                <button type="button" className="block cursor-pointer text-left type-data-strong">
                                  {p.name}
                                </button>
                                <span className="block type-meta">
                                  {p.city} · {p.country}
                                </span>
                              </span>
                            </div>
                          </td>
                          <td className="hidden py-3 pr-3 sm:table-cell">
                            <span className="type-meta">{p.luxuryTier}</span>
                          </td>
                          <td className="hidden py-3 pr-3 md:table-cell">
                            <span className="flex flex-wrap gap-1">
                              {p.programs.length === 0
                                ? <span className="type-meta">—</span>
                                : p.programs.map((pr) => (
                                    <Chip key={pr} tone="neutral" className="border border-border bg-background">{pr}</Chip>
                                  ))}
                            </span>
                          </td>
                          <td className="py-3 pr-3">
                            {p.id === "sereno-kyoto" && s.candidateConfirmed
                              ? <Chip tone="ok">confirmed today</Chip>
                              : <EvidenceMark kind={p.evidence.kind} label={p.evidence.label} />}
                          </td>
                          {money && <td className="py-3 pr-3 tnum">{p.rate}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {/* ── footer line ── */}
            <p className="mt-3 type-meta">
              <span className="tnum">{rows.length}</span> of <span className="tnum">{inCategory.length}</span>{" "}
              {category} records shown · <span className="tnum">{directoryCounts[category]}</span> in the full directory
            </p>
          </div>
      }
    </SplitPage>
  );
}

/* ── grid card ──────────────────────────────────────────────────────────────── */
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
      className={cn(
        "flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-lg border bg-card text-left transition-colors",
        selected ? "border-primary bg-muted/40" : "border-border hover:bg-muted/30",
      )}
    >
      <span className="block aspect-[16/9] w-full overflow-hidden border-b border-border">
        <PropertyImage id={p.id} name={p.name} category={p.category} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <span className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 truncate type-data-strong">{p.name}</span>
          {money && p.rate !== "—" && <span className="shrink-0 type-data tnum">{p.rate}</span>}
        </span>
        <span className="type-meta">
          {p.city} · {p.country}
        </span>
        <span className="flex flex-wrap gap-1">
          <Chip tone="neutral">{p.luxuryTier}</Chip>
          {p.programs.map((pr) => (
            <Chip key={pr} tone="neutral" className="border border-border bg-background">{pr}</Chip>
          ))}
          {p.status !== "Active" && <Chip tone="warn">{p.status}</Chip>}
        </span>
        <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2">
          {confirmedToday
            ? <Chip tone="ok">confirmed today</Chip>
            : <EvidenceMark kind={p.evidence.kind} label={p.evidence.label} />}
          <span className="ml-auto"><FreshnessDate stale={!!p.staleDays}>updated {p.updated}</FreshnessDate></span>
        </span>
      </span>
    </button>
  );
}

/* ── right panel ────────────────────────────────────────────────────────────── */
function RecordPanel({ p }: { p: Product }) {
  const { s, d } = useDemo();
  const money = canViewCommissions(s.role);
  const notice = notices.find((n) => n.productId === p.id);
  const confirmedToday = p.id === "sereno-kyoto" && s.candidateConfirmed;

  return (
    <div className="space-y-4">
      <div className="aspect-[16/9] w-full overflow-hidden rounded-md border border-border">
        <PropertyImage id={p.id} name={p.name} category={p.category} />
      </div>

      <div>
        <h2 className="type-data-strong">{p.name}</h2>
        <p className="type-meta">
          {p.category} · {p.city}, {p.country}
        </p>
      </div>

      {/* The two things you always want are always here, never scrolled to. */}
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" className="flex-1">
          <Link href={`/records/${p.id}`}>Open full record <ArrowRight className="size-3.5" aria-hidden /></Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/ask" onClick={() => d({ type: "askScope", scope: p.name })}>
            <MessageSquareText className="size-3.5" aria-hidden /> Ask about this
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Chip tone="neutral">{p.luxuryTier}</Chip>
        {p.status !== "Active" && <Chip tone="warn">{p.status}</Chip>}
        {confirmedToday
          ? <Chip tone="ok">confirmed today</Chip>
          : <EvidenceMark kind={p.evidence.kind} label={p.evidence.label} />}
      </div>

      {p.hasNotice && notice && s.world === "v2" && (
        <SeverityBanner severity={notice.severity}>
          <div className="type-data-strong">{notice.severity} notice</div>
          <div>{notice.text}</div>
          <div className="mt-1 type-meta">
            Opened {notice.openedAt} · {notice.scope} scope · {notice.owner}
          </div>
        </SeverityBanner>
      )}
      {/* No v1 caption here. A record that announces its own failure has already
          removed the failure — the point is that the card looks clean and says
          nothing. The frame bar carries the vintage; the silence is the evidence. */}

      {p.id === "maison-leandre" ? <LayerSummary money={money} role={s.role} /> : <PlainSummary p={p} money={money} />}
    </div>
  );
}

/* Compressed three-layer anatomy — the record's structure, two fields per layer. */
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
    <div className="space-y-3">
      {groups.map((g) => {
        const fields = fieldsFor(g.layer);
        if (fields.length === 0) return null;
        return (
          <section key={g.layer} className="rounded-md border border-border p-4">
            <h3 className="type-code uppercase tracking-widest text-muted-foreground">{g.title}</h3>
            <dl className="mt-2 space-y-2">
              {fields.map((f) => (
                <div key={f.key}>
                  <dt className="type-meta">{f.label}</dt>
                  <dd className={cn("type-data", f.state === "template" && "italic text-muted-foreground")}>
                    {f.value}
                  </dd>
                  <dd className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <SourceTag kind={f.source.kind} label={f.source.where} />
                    <FreshnessDate stale={f.state === "stale"}>{f.source.when}</FreshnessDate>
                    {f.state === "conflict" && <Chip tone="crit">3 sources disagree</Chip>}
                    {f.state === "edited-overlay" && <Chip tone="primary">agency overlay</Chip>}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
      <p className="type-meta">
        Three layers, one record. The full anatomy — every field, every source — is on the record itself.
      </p>
    </div>
  );
}

/* Everything else: a shorter panel from the record's own fields. */
function PlainSummary({ p, money }: { p: Product; money: boolean }) {
  const rows: [string, string | undefined][] = [
    ["Region", p.region],
    ["Rooms", p.rooms ? String(p.rooms) : undefined],
    ["Programme", p.programs.length ? p.programs.join(" · ") : undefined],
    ["Consortia", p.consortia.length ? p.consortia.join(" · ") : undefined],
    ["Rep firm", p.repFirm],
    ["Rate", money && p.rate !== "—" ? p.rate : undefined],
  ];
  return (
    <div className="space-y-3">
      {p.blurb && <p className="type-data text-muted-foreground">{p.blurb}</p>}
      <dl className="rounded-md border border-border p-4 type-data">
        {rows.filter(([, v]) => !!v).map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 py-1">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className={cn("text-right", (k === "Rooms" || k === "Rate") && "tnum")}>{v}</dd>
          </div>
        ))}
      </dl>
      <p>
        <FreshnessDate stale={!!p.staleDays}>
          updated {p.updated} · last verified {p.lastVerified}
        </FreshnessDate>
      </p>
      {p.repFirm && (
        <p className="type-meta">
          Represented by {p.repFirm}. Contacts and terms live on the full record.
        </p>
      )}
      {p.id === "sereno-kyoto" && (
        <p className="type-meta">
          A candidate record. It does not answer questions, and it is not offered to a client, until a
          reviewer confirms it field by field — {people.lead} or {people.ops} hold that queue.
        </p>
      )}
    </div>
  );
}
