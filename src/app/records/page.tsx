"use client";
/**
 * Records — recomposed as search results (docs/rebuild/04-recomposition-brief.md).
 *
 * Affinity: Airbnb's search results (anatomy/surfaces/search-results.md). Many
 * entities, scanned: a list of entity cards that are an image plus a caption with no
 * container — the grid gaps (24 / 40) do the separating. Hierarchy inside a caption is
 * weight and colour, never size. The table is the alternate view, on the ledger
 * primitive.
 *
 * The title row acts, the toolbar views (VIS-095, NAV-01, 2026-09-28). The title row
 * holds "Records", the directory's one count and the one create ("New record"). The
 * toolbar directly above the data holds, in order, the category switch, the facets,
 * the search, the result ("17 of 209 hotels · needs attention first, then A to Z") and
 * the Grid/Table view at the far right. The category pills carry no counts any more:
 * "Hotel 209" beside "17 records" was two numbers for one list (COL-06).
 *
 * One list-and-detail pattern (VIS-096, COL-02, NAV-03). A click on a card or a row
 * selects it and opens the inspector; Enter on the selected one, or a double-click,
 * opens the record. The inspector previews: its header carries the name, "Open ↗" and
 * close; its body what the card cannot show; its footer the record's ONE next act —
 * "Resolve 3 sources" where the commission is disputed, "Share…" on a record its maker
 * has not shared, "Review the candidate" for the owner's unconfirmed record, and with
 * nothing to do, no filled button: "Ask about this". Opening is never the ink button.
 *
 * Everything that changes what the list shows lives in the URL (COL-07): the category,
 * the facets, the search, the view and the selection, so Back from a record puts the
 * list back as it was, and a Briefing widget is a saved view (`?evidence=stale`).
 *
 * Colour means severity (VIS-097, FB-05). A card carries one state: "Closed to
 * bookings" in claret where a Critical notice blocks it (FB-01, VIS-099), a warning in
 * ochre where something waits on a decision (sources that disagree, an Important
 * notice), and otherwise its evidence in neutral words. One item per subject: the most
 * severe wins.
 *
 * New record (U23) checks name and place against the directory and against what this
 * person can already see. A match is a Warning with "Open <record>" and "Create anyway"
 * (COL-11): the product says what it found, and the person decides. A record added by
 * hand starts private to its maker; sharing it is the one sharing sheet (VIS-101).
 *
 * New local component: FacetChip — a FilterChip that forwards its ref and props so
 * a Popover can anchor to it. Same geometry and the same inverse-when-selected rule.
 */
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  useDemo, canViewCommissions, noticeGate, onTrip,
  type CreatedRecord, type DemoState, type NoticeGate, type ShareScope,
} from "@/lib/store";
import { takeOff, visibleTrips } from "@/lib/trip-checks";
import {
  products, directoryCounts, directoryFooter, filterOptions, leandreFields, people, personName, promotions,
  programmeRates, rateRange,
  commissionConflict, keptSource,
  type Product, type ProductCategory, type Layer, type Trip,
} from "@/data/seed";
import { linesOf, stamp } from "@/data/trip-lines";
import { PageHeader, SplitPage, ViewToggle, PropertyImage, ListToolbar, ListSearch } from "@/components/layouts";
import {
  Blocker, Chip, DataList, Done, EmptyState, FilterChip, Section, Segmented, SourceTag, Warning,
} from "@/components/bits";
import { ShareSheet, audienceOptions } from "@/components/share-sheet";
import { askAbout } from "@/components/assistant";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, MessageSquareText, Plus, X } from "lucide-react";

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

/* What the record's sharing says, to the person looking at it. Waiting for the owner
   is a state, not a decision, so it is neutral; a record she returned asks its maker
   to decide what to do with it, so that one is ochre (VIS-097, FB-05, 2026-09-28). */
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
  if (r.share === "team") return { chip: "shared with the Paris desk", tone: "neutral", line: "The Paris desk sees it. Nobody else does." };
  if (r.by === "owner") return { chip: "shared with the whole agency", tone: "neutral", line: "Every advisor in the agency sees it, with your name on it." };
  if (decided?.outcome === "published") {
    return { chip: "shared with the whole agency", tone: "neutral", line: `Released by ${people.owner}. Every advisor in the agency sees it, with your name on it.` };
  }
  if (decided?.outcome === "returned") {
    return {
      chip: `returned by ${people.owner}`, tone: "warn",
      line: decided.note ? `${people.owner} returned it: “${decided.note}” Nobody else sees it.` : `${people.owner} returned it without a note. Nobody else sees it.`,
    };
  }
  return { chip: `waiting for ${people.owner}`, tone: "neutral", line: `In ${people.owner}’s publish queue. Nobody else sees it until she releases it.` };
}

/* Name and place, compared the way a person would: case, accents and spacing aside,
   and "Paris" matching "Paris 4e". */
const norm = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const samePlace = (a: string, b: string) => a === b || a.startsWith(b + " ") || b.startsWith(a + " ");
const slug = (v: string) => norm(v).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "record";
const digits = (v: number) => v.toLocaleString("en-GB");
/** "28 Aug 10:14" → "10:14": the seeded day is always today. */
const timeOf = (at: string) => at.slice(-5);
const NAME_OF_INITIALS: Record<string, string> = {
  [people.advisorShort]: people.advisor, [people.ownerShort]: people.owner, [people.colleagueShort]: people.colleague,
};

/* ── the list's state lives in the URL (COL-07, VIS-096, 2026-09-28) ─────────────
   Category, facets, search, view and the selected record, so Back from a record puts
   the list back as it was and a view can be linked. Written with the native
   history.replaceState, which Next's router hears (useSearchParams updates) without a
   server round trip, and several keys in one write: choosing a category clears the
   selection in the same step. The shared useQueryState writes one key per call from
   the render's snapshot, so two calls in one handler would undo each other. */
function useListParams(): [URLSearchParams, (patch: Record<string, string | null>) => void] {
  const params = useSearchParams();
  const patch = useCallback((next: Record<string, string | null>) => {
    const q = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") q.delete(k); else q.set(k, v);
    }
    const str = q.toString();
    window.history.replaceState(null, "", str ? `${window.location.pathname}?${str}` : window.location.pathname);
  }, []);
  return [useMemo(() => new URLSearchParams(params?.toString() ?? ""), [params]), patch];
}

/* ── FacetChip — a filter chip a popover can anchor to ──────────────────────────
   FilterChip's geometry (28 high, a pill, hairline at rest, inverse when it holds
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
        <span className={cn("type-meta tnum", selected ? "text-on-selected/70" : "text-label-tertiary")}>{count}</span>
      )}
      <ChevronDown className="size-[var(--icon-sm)]" aria-hidden />
    </button>
  );
}

/* ── facets ─────────────────────────────────────────────────────────────────── */
type FacetKey = "region" | "luxuryTier" | "programme" | "status" | "consortia" | "evidence" | "promotion";
type Filters = Record<FacetKey, string[]>;

const FACETS: {
  key: FacetKey;
  /** Its key in the URL. `evidence` and `promotion` are the Briefing's saved views. */
  param: string;
  label: string;
  options: { value: string; label: string }[];
  match: (p: Product, v: string) => boolean;
}[] = [
  {
    key: "region", param: "region", label: "Region",
    options: filterOptions.region.map((r) => ({ value: r, label: r })),
    match: (p, v) => p.region === v,
  },
  {
    key: "luxuryTier", param: "tier", label: "Tier",
    options: filterOptions.luxuryTier.map((t) => ({ value: t, label: t })),
    match: (p, v) => p.luxuryTier === v,
  },
  {
    key: "programme", param: "programme", label: "Programme",
    options: filterOptions.programme.map((t) => ({ value: t, label: t })),
    match: (p, v) => p.programs.includes(v),
  },
  {
    key: "status", param: "status", label: "Status",
    options: filterOptions.status.map((t) => ({ value: t, label: t })),
    match: (p, v) => p.status === v,
  },
  {
    key: "consortia", param: "consortia", label: "Consortia",
    options: filterOptions.consortia.map((t) => ({ value: t, label: t })),
    match: (p, v) => p.consortia.includes(v),
  },
  {
    key: "evidence", param: "evidence", label: "Evidence",
    options: filterOptions.evidence.map((e) => ({ value: e.key, label: e.label })),
    match: (p, v) => p.evidence.kind === v,
  },
  /* An incentive is a fact about a promotion, not a trust state of a record — the two
     were conflated in the evidence facet, so the briefing's incentives widget listed
     three properties and expanded into a filter that returned one. This facet reads
     the promotions themselves, which is what the widget is summarising. */
  {
    key: "promotion", param: "promotion", label: "Promotion",
    options: [{ value: "active", label: "Active incentive" }],
    match: (p, v) => v === "active" && promotions.some((pr) => pr.productId === p.id),
  },
];

const facetLabel = (key: FacetKey) => FACETS.find((f) => f.key === key)!.label;
const optionLabel = (key: FacetKey, value: string) =>
  FACETS.find((f) => f.key === key)!.options.find((o) => o.value === value)?.label ?? value;

const CATEGORY_OPTIONS = filterOptions.category.map((c) => ({ value: c, label: c }));
const CATEGORY_NOUN: Record<ProductCategory, string> = { Hotel: "hotels", Cruise: "cruises", DMC: "DMCs", "Rep firm": "rep firms" };

/* ── what a record needs, in one place (VIS-099, FB-01, 2026-09-28) ─────────────
   The notice gate, read only in the current build: the earlier build (v1) never drew
   notices, and its silence is the evidence the frame bar points at. Maison Léandre's
   disputed commission stops being a dispute the moment someone keeps a value. */
function gateOf(s: DemoState, id: string): NoticeGate {
  return s.world === "v2" ? noticeGate(s, id) : null;
}
function disputed(s: DemoState, p: Product) {
  return p.evidence.kind === "disagree" && !(p.id === commissionConflict.productId && s.conflictResolved);
}
/** 0: closed to bookings · 1: waits on a decision · 2: nothing to do. The list's order. */
function attention(s: DemoState, p: Product) {
  const g = gateOf(s, p.id);
  if (g?.level === "block") return 0;
  if (disputed(s, p) || g?.level === "warn") return 1;
  return 2;
}

/* The one state a card or a row carries: the most severe thing true about it. */
function StateChip({ s, p }: { s: DemoState; p: Product }) {
  const g = gateOf(s, p.id);
  if (g?.level === "block") return <Chip tone="crit">Closed to bookings</Chip>;
  if (disputed(s, p)) return <Chip tone="warn">{p.evidence.label}</Chip>;
  if (g?.level === "warn") {
    return (
      <Chip tone="warn" title={g.notice.text} className="max-w-full">
        <span className="min-w-0 truncate">{g.notice.text}</span>
      </Chip>
    );
  }
  return <Chip tone="neutral">{neutralState(s, p)}</Chip>;
}
function neutralState(s: DemoState, p: Product) {
  if (p.id === "sereno-kyoto" && s.candidateConfirmed) return "confirmed today";
  if (p.id === commissionConflict.productId && s.conflictResolved) return `resolved · ${keptSource(s.conflictChoice).value}`;
  return p.evidence.label;
}

type Item = { kind: "product"; id: string; name: string; p: Product } | { kind: "made"; id: string; name: string; r: CreatedRecord };

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
  const router = useRouter();
  const money = canViewCommissions(s);
  const [newOpen, setNewOpen] = useState(false);
  const [newKey, setNewKey] = useState(0);
  const [justCreated, setJustCreated] = useState<{ id: string; at: string } | null>(null);
  const [params, patch] = useListParams();

  const catParam = params.get("cat") as ProductCategory | null;
  const category: ProductCategory = catParam && filterOptions.category.includes(catParam) ? catParam : "Hotel";
  const view: "grid" | "table" = params.get("view") === "table" ? "table" : "grid";
  const selected = params.get("id");
  const filters = useMemo(
    () => Object.fromEntries(FACETS.map((f) => [f.key, (params.get(f.param) ?? "").split(",").filter(Boolean)])) as Filters,
    [params],
  );
  /* The search is typed into local state and written through to the URL, so a keystroke
     never waits on the address bar. */
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const q = norm(query);

  /* An unconfirmed candidate never surfaces to the agency user before it is
     confirmed. The owner sees it, marked unconfirmed, because confirming it is hers. */
  const reviewer = s.role === "owner";
  const visible = useMemo(
    () => products.filter((p) => p.id !== "sereno-kyoto" || s.candidateConfirmed || reviewer),
    [s.candidateConfirmed, reviewer],
  );

  const applied = useMemo(
    () => FACETS.flatMap((f) => filters[f.key].map((v) => ({ key: f.key, value: v }))),
    [filters],
  );

  const createdAll = useMemo(() => s.createdRecords.filter((r) => createdVisible(s, r)), [s]);
  const createdInCategory = createdAll.filter((r) => r.category === category);

  /* One list, in one stated order (COL-06): what needs attention first (closed to
     bookings, then what waits on a decision), then A to Z. Records added by hand carry
     none of the facets a filter reads, so any applied filter leaves them out. */
  const items: Item[] = useMemo(() => {
    const hit = (text: string) => !q || norm(text).includes(q);
    const made: Item[] = applied.length > 0 ? [] : createdInCategory
      .filter((r) => hit(`${r.name} ${r.city} ${r.country}`))
      .map((r) => ({ kind: "made", id: r.id, name: r.name, r }));
    const listed: Item[] = visible
      .filter((p) => p.category === category)
      .filter((p) => FACETS.every((f) => filters[f.key].length === 0 || filters[f.key].some((v) => f.match(p, v))))
      .filter((p) => hit(`${p.name} ${p.city} ${p.country} ${p.region} ${p.brand ?? ""}`))
      .map((p) => ({ kind: "product", id: p.id, name: p.name, p }));
    const rank = (x: Item) => (x.kind === "product" ? attention(s, x.p) : 2);
    return [...made, ...listed].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  }, [visible, category, filters, applied.length, createdInCategory, q, s]);

  const inCategory = directoryCounts[category] + createdInCategory.length;
  const total = directoryFooter.total + createdAll.length;

  const setFacet = (key: FacetKey, value: string) => {
    const f = FACETS.find((x) => x.key === key)!;
    const cur = filters[key];
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    patch({ [f.param]: next.join(",") || null });
  };
  const clearFacets = () => patch(Object.fromEntries(FACETS.map((f) => [f.param, null])));
  const onSearch = (v: string) => { setQuery(v); patch({ q: v.trim() || null }); };

  // A record filtered out of the list takes its panel with it — derived, never synced.
  const selectedItem = selected ? items.find((x) => x.id === selected) : undefined;
  const select = (id: string) => patch({ id });
  const openRecord = (id: string) => router.push(`/records/${id}`);

  const openNew = () => { setNewKey((k) => k + 1); setNewOpen(true); };
  const onCreated = (r: CreatedRecord) => {
    setQuery("");
    patch({ ...Object.fromEntries(FACETS.map((f) => [f.param, null])), q: null, cat: r.category === "Hotel" ? null : r.category, id: r.id });
    setJustCreated({ id: r.id, at: stamp() });
  };
  /* A record made by hand joins the list in its A to Z place: bring it into view, once,
     as soon as its card is drawn (the URL, and so the list, may settle a render later). */
  const scrolledTo = useRef<string | null>(null);
  useEffect(() => {
    if (!justCreated || scrolledTo.current === justCreated.id) return;
    const el = document.getElementById(`record-${justCreated.id}`);
    if (el) { el.scrollIntoView({ block: "nearest" }); scrolledTo.current = justCreated.id; }
  }, [justCreated, items]);

  const header = (
    <PageHeader
      title="Records"
      count={<>{digits(total)} records</>}
      create={
        <Button variant="secondary" size="sm" onClick={openNew}>
          <Plus aria-hidden /> New record
        </Button>
      }
    />
  );

  const product = selectedItem?.kind === "product" ? selectedItem.p : undefined;
  const made = selectedItem?.kind === "made" ? selectedItem.r : undefined;

  return (
    <SplitPage
      header={header}
      panelOpen={!!selectedItem}
      onClosePanel={() => patch({ id: null })}
      panelTitle={selectedItem?.name ?? "Record"}
      openHref={selectedItem ? `/records/${selectedItem.id}` : undefined}
      panel={
        product ? <RecordPanel p={product} />
        : made ? <CreatedPanel r={made} createdAt={justCreated?.id === made.id ? justCreated.at : null} />
        : null
      }
      footer={product ? <RecordFooter p={product} /> : made ? <CreatedFooter r={made} /> : undefined}
    >
      <NewRecordSheet
        key={newKey}
        open={newOpen}
        onOpenChange={setNewOpen}
        defaultCategory={category}
        onCreated={onCreated}
      />
      <div className="min-w-0">
        <ListToolbar
          state={
            <Segmented
              label="Record categories"
              value={category}
              onChange={(c) => patch({ cat: c === "Hotel" ? null : c, id: null })}
              options={CATEGORY_OPTIONS}
            />
          }
          filters={FACETS.map((f) => (
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
                <div className="mb-[var(--space-2)] px-1 type-meta text-label-tertiary">{f.label}</div>
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
                          onCheckedChange={() => setFacet(f.key, o.value)}
                        />
                        {o.label}
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          ))}
          search={<ListSearch value={query} onChange={onSearch} placeholder="Search records" />}
          result={<>{digits(items.length)} of {digits(inCategory)} {CATEGORY_NOUN[category]} · needs attention first, then A to Z</>}
          view={<ViewToggle value={view} onChange={(v) => patch({ view: v === "grid" ? null : v })} />}
        />

        {/* ── applied values: inverted chips; pressing one removes it ── */}
        {applied.length > 0 && (
          <div className="mb-[var(--space-4)] flex flex-wrap items-center gap-[var(--space-2)]">
            {applied.map((a) => (
              <FilterChip
                key={`${a.key}-${a.value}`}
                selected
                onClick={() => setFacet(a.key, a.value)}
              >
                <span className="text-on-selected/70">{facetLabel(a.key)}</span>
                {optionLabel(a.key, a.value)}
                <X className="size-[var(--icon-sm)]" aria-hidden />
                <span className="sr-only">Remove filter</span>
              </FilterChip>
            ))}
            <Button variant="tertiary" size="sm" onClick={clearFacets}>Clear all</Button>
          </div>
        )}

        {/* ── the two views ── */}
        {items.length === 0 ? (
          <EmptyState
            className="mt-[var(--space-4)]"
            title="No records match"
            body="Remove a filter or change the search to see more."
            action={
              <Button variant="secondary" size="sm" onClick={() => { clearFacets(); onSearch(""); }}>
                Clear filters and search
              </Button>
            }
          />
        ) : view === "grid" ? (
          <ul className="grid grid-cols-1 gap-x-[var(--gap-2)] gap-y-[var(--gap-4)] sm:grid-cols-2 xl:grid-cols-3">
            {items.map((x) => (
              <li key={x.id} id={`record-${x.id}`}>
                {x.kind === "made" ? (
                  <CreatedCard r={x.r} selected={selected === x.id} onSelect={() => select(x.id)} onOpen={() => openRecord(x.id)} />
                ) : (
                  <RecordCard p={x.p} money={money} selected={selected === x.id} onSelect={() => select(x.id)} onOpen={() => openRecord(x.id)} />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record</TableHead>
                <TableHead className="hidden sm:table-cell">Tier</TableHead>
                <TableHead className="hidden md:table-cell">Programme</TableHead>
                <TableHead>State</TableHead>
                {money && <TableHead>Commission</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((x) => {
                const on = selected === x.id;
                const common = {
                  id: `record-${x.id}`,
                  onClick: () => select(x.id),
                  onOpen: () => openRecord(x.id),
                  "aria-selected": on,
                  "data-state": on ? "selected" : undefined,
                };
                if (x.kind === "made") {
                  const status = shareStatus(s, x.r);
                  return (
                    <TableRow key={x.id} {...common}>
                      <TableCell>
                        <RowName id={x.id} name={x.r.name} category={x.r.category} place={`${x.r.city} · ${x.r.country}`} photo={NO_PHOTO} />
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
                }
                const p = x.p;
                return (
                  <TableRow key={x.id} {...common}>
                    <TableCell>
                      <RowName id={p.id} name={p.name} category={p.category} place={`${p.city} · ${p.country}`} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-label-secondary">{p.luxuryTier}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="flex flex-wrap gap-1">
                        {p.programs.length === 0
                          ? <span className="text-label-secondary">—</span>
                          : p.programs.map((pr) => <Chip key={pr} tone="neutral">{pr}</Chip>)}
                      </span>
                    </TableCell>
                    <TableCell><StateChip s={s} p={p} /></TableCell>
                    {money && <TableCell className="tnum" title={programmeRates(p.id) || undefined}>{rateRange(p.id)}</TableCell>}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* The directory's figures are its size; this build carries a sample of each
            category. Said once, under the list, rather than implied by a pager. */}
        <p className="mt-[var(--gap-2)] type-meta">This build holds a sample of each category. Paging is not built.</p>
      </div>
    </SplitPage>
  );
}

function RowName({ id, name, category, place, photo }: { id: string; name: string; category: string; place: string; photo?: string }) {
  return (
    <div className="flex items-center gap-[var(--space-3)]">
      <span className="size-8 shrink-0 overflow-hidden rounded-lg bg-sunken">
        <PropertyImage id={id} name={name} category={category} src={photo} />
      </span>
      <span className="min-w-0">
        <span className="block type-data-strong">{name}</span>
        <span className="block type-meta">{place}</span>
      </span>
    </div>
  );
}

/* ── the listing card: an image plus a caption, no container ─────────────────────
   Image 4:3 at radius 20 (rounded-2xl); title 14/500, meta 14/400 secondary; the
   record's one state on the last line. Hover: the image scales, the title underlines.
   Selected: the image takes a 2px ink ring and the title keeps its underline — a
   difference that is not colour (VIS-021). A click selects; a double-click, or Enter
   on the selected card, opens the record (VIS-096, COL-02).                        */
function cardKeys(selected: boolean, onOpen: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && selected) { e.preventDefault(); onOpen(); }
  };
}

function RecordCard({
  p, money, selected, onSelect, onOpen,
}: {
  p: Product; money: boolean; selected: boolean; onSelect: () => void; onOpen: () => void;
}) {
  const { s } = useDemo();
  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onOpen}
      onKeyDown={cardKeys(selected, onOpen)}
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
          {money && rateRange(p.id) !== "—" && <span className="shrink-0 type-data tnum" title={programmeRates(p.id)}>{rateRange(p.id)}</span>}
        </span>
        <span className="type-data text-label-secondary">
          {p.city} · {p.country}
        </span>
        <span className="type-data text-label-secondary">
          {p.luxuryTier}
          {p.programs.length > 0 && <> · {p.programs.join(" · ")}</>}
          {p.status !== "Active" && <> · {p.status}</>}
        </span>
        <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-[var(--space-3)] gap-y-1">
          <StateChip s={s} p={p} />
          <span className="type-meta">updated {p.updated}</span>
        </span>
      </span>
    </button>
  );
}

/* ── the notice gate, in the inspector (VIS-099, COL-03, 2026-09-28) ───────────────
   A Critical notice is a Blocker: the property cannot be added to a trip, and where it
   already sits on one of this person's trips the one act is to take it off. Nobody is
   asked to acknowledge it. Important is a warning; Info is a neutral line.          */
function GateNotice({ p }: { p: Product }) {
  const { s, d } = useDemo();
  const [took, setTook] = useState<{ title: string; at: string } | null>(null);
  const gate = gateOf(s, p.id);
  if (!gate) return null;
  const n = gate.notice;
  const meta = `Opened ${n.openedAt} by ${NAME_OF_INITIALS[n.owner] ?? n.owner}`;

  if (gate.level === "block") {
    const on = visibleTrips(s).find((t) => onTrip(s, t.id, p.id));
    /* The act sits under the sentence, not beside it: at the inspector's width the
       Blocker's side slot squeezes the sentence to a word per line. */
    return (
      <div className="space-y-[var(--space-2)]">
        <Blocker title="Closed to bookings">
          {n.text} <span className="type-meta">{meta}.</span>
          {on && (
            <Button variant="secondary" size="sm" className="mt-[var(--space-2)] max-w-full" onClick={() => { takeOffTrip(s, d, on, p); setTook({ title: on.title, at: stamp() }); }}>
              <span className="truncate">Take it off {on.title}</span>
            </Button>
          )}
        </Blocker>
        {took && <Done>Taken off {took.title} · {timeOf(took.at)}</Done>}
      </div>
    );
  }
  if (gate.level === "warn") {
    return <Warning title={n.text}><span className="type-meta">{meta}.</span></Warning>;
  }
  return (
    <p className="rounded-lg bg-sunken px-[var(--space-4)] py-[var(--space-3)] type-data">
      {n.text} <span className="type-meta">{meta}.</span>
    </p>
  );
}

/* Take a blocked property off a trip, the way the trip itself does it (trip-checks
   `takeOff`: the line and its shortlist entry go, and the toast carries Undo). A
   property that is only shortlisted, with no line of its own, comes off the list. */
function takeOffTrip(s: DemoState, d: ReturnType<typeof useDemo>["d"], t: Trip, p: Product) {
  const line = linesOf(s.tripLines, t.id).find((l) => l.productId === p.id);
  if (line) { takeOff(s, d, t, line); return; }
  const before = s.shortlistOff;
  d({ type: "shortlistOff", trip: t.id, product: p.id });
  notify(`${p.name} is off the trip`, { detail: t.title, undo: () => d({ type: "patch", patch: { shortlistOff: before } }) });
}

/* ── the inspector: a preview of the record, in the record's own words ──────────
   Its name is the inspector's header, so the body does not say it again (COL-13). */
function RecordPanel({ p }: { p: Product }) {
  const { s } = useDemo();
  const money = canViewCommissions(s);
  const gate = gateOf(s, p.id);
  /* The chip row carries what nothing below says: the body's notice and the disputed
     field speak for themselves. */
  const saysItself = gate?.level === "block" || disputed(s, p);

  return (
    <div className="space-y-[var(--space-6)]">
      <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-sunken">
        <PropertyImage id={p.id} name={p.name} category={p.category} />
      </div>

      <div>
        <p className="type-meta">{p.category} · {p.city}, {p.country}</p>
        <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-[var(--space-2)]">
          <Chip tone="neutral">{p.luxuryTier}</Chip>
          {p.status !== "Active" && <Chip tone="neutral">{p.status}</Chip>}
          {!saysItself && <Chip tone="neutral">{neutralState(s, p)}</Chip>}
        </div>
      </div>

      <GateNotice p={p} />

      <div>
        {p.id === "maison-leandre" ? <LayerSummary money={money} role={s.role} resolved={s.conflictResolved} /> : <PlainSummary p={p} money={money} />}
      </div>
    </div>
  );
}

/* The inspector's footer: the record's one next act, and asking about it. Opening the
   record is "Open ↗" in the header, never this slot (NAV-03, VIS-095). */
function RecordFooter({ p }: { p: Product }) {
  const { s, d } = useDemo();
  const pathname = usePathname();
  const money = canViewCommissions(s);
  let act: ReactNode = null;
  if (p.id === commissionConflict.productId && money && !s.conflictResolved) {
    act = (
      <Button asChild size="sm">
        <Link href={`/records/${p.id}?resolve=1`}>Resolve 3 sources</Link>
      </Button>
    );
  } else if (p.id === "sereno-kyoto" && s.role === "owner" && !s.candidateConfirmed) {
    act = (
      <Button asChild variant="secondary" size="sm">
        <Link href="/admin/review">Review the candidate</Link>
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
      <Button
        variant={act ? "tertiary" : "secondary"}
        size="sm"
        onClick={() => askAbout(d, s, { kind: "record", id: p.id, label: p.name, href: `/records/${p.id}` }, pathname)}
      >
        <MessageSquareText aria-hidden /> Ask about this
      </Button>
      {act}
    </div>
  );
}

/* Compressed three-layer anatomy — the record's structure, two fields per layer,
   as three chapters. The same primitive the record page uses, so the inspector and
   the record agree about what a layer looks like. */
function LayerSummary({ money, role, resolved }: { money: boolean; role: string; resolved: boolean }) {
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
                    <span className="type-meta">{f.source.when}</span>
                    {f.state === "conflict" && !resolved && <Chip tone="warn">3 sources disagree</Chip>}
                    {f.state === "edited-overlay" && <Chip tone="neutral">agency overlay</Chip>}
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

/* Everything else: one chapter of the record's own fields. The rep firm is a record of
   its own, so its name is the way to it (COL-12). */
function PlainSummary({ p, money }: { p: Product; money: boolean }) {
  const rep = p.repFirm ? products.find((x) => x.name === p.repFirm) : undefined;
  const rows: { label: string; value: ReactNode }[] = [
    { label: "Region", value: p.region },
    { label: "Rooms", value: p.rooms ? <span className="tnum">{p.rooms}</span> : undefined },
    { label: "Programme", value: p.programs.length ? p.programs.join(" · ") : undefined },
    { label: "Consortia", value: p.consortia.length ? p.consortia.join(" · ") : undefined },
    {
      label: "Rep firm",
      value: rep
        ? <Link href={`/records/${rep.id}`} className="underline decoration-link-rest underline-offset-4 hover:decoration-ink">{rep.name}</Link>
        : p.repFirm,
    },
    /* Commission belongs to a programme: each one, with its rate (2026-09-28). */
    { label: "Commission", value: money && programmeRates(p.id) ? <span className="tnum">{programmeRates(p.id)}</span> : undefined },
  ].filter((r) => r.value !== undefined && r.value !== null && r.value !== "");

  return (
    <Section title="The record">
      {p.blurb && <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data text-label-secondary">{p.blurb}</p>}
      <DataList rows={rows} />
      <p className="mt-[var(--space-3)] type-meta">
        updated {p.updated} · last verified {p.lastVerified}
      </p>
      {p.id === "sereno-kyoto" && (
        <p className="mt-[var(--space-2)] type-meta">
          Not confirmed yet, so it answers no questions and is not offered to clients. {people.owner} confirms it
          field by field in Review.
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
function CreatedCard({ r, selected, onSelect, onOpen }: { r: CreatedRecord; selected: boolean; onSelect: () => void; onOpen: () => void }) {
  const { s } = useDemo();
  const status = shareStatus(s, r);
  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onOpen}
      onKeyDown={cardKeys(selected, onOpen)}
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

/* The inspector for a record added by hand. Creating it is confirmed where it shows,
   with the time (FB-06): the inspector opens on it. */
function CreatedPanel({ r, createdAt }: { r: CreatedRecord; createdAt: string | null }) {
  const { s } = useDemo();
  const mine = r.by === s.role;
  const status = shareStatus(s, r);

  return (
    <div className="space-y-[var(--space-6)]">
      <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-sunken">
        <PropertyImage id={r.id} name={r.name} category={r.category} src={NO_PHOTO} />
      </div>

      <div>
        <p className="type-meta">{r.category} · {r.city}, {r.country}</p>
        <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-[var(--space-2)]">
          <Chip tone="neutral">added by hand</Chip>
          <Chip tone={status.tone}>{status.chip}</Chip>
        </div>
        {createdAt && mine && <Done className="mt-[var(--space-3)]">Created {timeOf(createdAt)} · only you can see it</Done>}
      </div>

      <Section title="The record">
        <DataList rows={[
          { label: "Category", value: r.category },
          { label: "City", value: r.city },
          { label: "Country", value: r.country },
          { label: "Added", value: `By hand · ${personName[r.by]} · today` },
        ]} />
        <p className="mt-[var(--space-3)] type-meta">Only what was typed is on file. No source stands behind these values yet.</p>
      </Section>

      <Section title="Who sees it">
        <p className="type-data text-label-secondary">{status.line}</p>
      </Section>
    </div>
  );
}

/* Its one next act, for its maker: deciding who else sees it, in the one sharing sheet
   (VIS-101, COL-10). Anyone else asks about it. */
function CreatedFooter({ r }: { r: CreatedRecord }) {
  const { s, d } = useDemo();
  const pathname = usePathname();
  const [shareOpen, setShareOpen] = useState(false);
  const mine = r.by === s.role;
  return (
    <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
      <Button
        variant={mine ? "tertiary" : "secondary"}
        size="sm"
        onClick={() => askAbout(d, s, { kind: "record", id: r.id, label: r.name, href: `/records/${r.id}` }, pathname)}
      >
        <MessageSquareText aria-hidden /> Ask about this
      </Button>
      {mine && (
        <>
          <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)}>Share…</Button>
          <ShareSheet<ShareScope>
            open={shareOpen}
            onOpenChange={setShareOpen}
            what={r.name}
            current={r.share}
            options={audienceOptions(s.role === "owner")}
            onShare={(scope) => d({ type: "shareCreated", kind: "record", id: r.id, scope })}
          />
        </>
      )}
    </div>
  );
}

/* ── New record: a short form, and a check before anything is created ───────────
   The check reads the directory and the records this person can already see. A
   match is a Warning, not a wall (COL-11, 2026-09-28): "Open <record>" is the act the
   product expects, and "Create anyway" stays in reach for a different property that
   shares a name. Cancel, then the act, at the right, as on every sheet.            */
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
    if (!ready) return;
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
            <Warning title={`${match.name} is already in the directory`}>
              {match.category} · {match.city}{match.country !== "—" ? `, ${match.country}` : ""}
              {match.byHand ? ", added by hand" : ""}. Open it, or create a second record if this is a different property.
            </Warning>
          ) : (
            <p className="type-data text-label-secondary">
              Private to you once created. Share it from the record when you choose.
            </p>
          )}
        </div>
        <SheetFooter className="flex-row flex-wrap items-center justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          {match ? (
            <>
              <Button variant="secondary" disabled={!ready} onClick={create}>Create anyway</Button>
              <Button asChild>
                <Link href={`/records/${match.id}`} onClick={() => onOpenChange(false)}>Open {match.name}</Link>
              </Button>
            </>
          ) : (
            <Button disabled={!ready} onClick={create}>Create record</Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
