"use client";
/** Records directory — Journey E EP1. Master–detail: segmented tabs, filters, table + quick-look rail. */
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDemo, canViewCommissions } from "@/lib/store";
import { products, directoryCounts, directoryFooter, leandreFields, people } from "@/data/seed";
import { Chip, Section, PageHeader, SeverityBanner, NarrationNote, FreshnessDate, EvidenceDot, ConfirmBanner, SchematicBadge } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { X, ArrowRight, ArrowUpDown } from "lucide-react";

const tabToCategory: Record<string, string> = { Hotels: "Hotel", Cruises: "Cruise", DMCs: "DMC", "Rep firms": "Rep firm" };

export default function RecordsDirectory() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s.persona);
  const [tab, setTab] = useState<keyof typeof directoryCounts>("Hotels");
  const [filters, setFilters] = useState([
    { id: "paris", label: "Paris" },
    { id: "prog", label: "Programme: Atelier" },
  ]);
  const [checked, setChecked] = useState<string[]>(["maison-leandre"]);
  const [selected, setSelected] = useState<string | null>("maison-leandre");
  // PhoneStack (Layout 8): below md the quick-look renders as a bottom sheet, opened per row tap.
  const [quickLookOpen, setQuickLookOpen] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  // Close the quick-look on Escape (rail and sheet alike).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      setQuickLookOpen(false);
      setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // An unconfirmed candidate never surfaces in the directory for working personas —
  // it appears only once confirmed (or to the reviewing lead/ops personas, marked unconfirmed).
  const reviewer = s.persona === "lead" || s.persona === "ops";
  const rows = products.filter(
    (p) => p.category === tabToCategory[tab] && (p.id !== "sereno-kyoto" || s.candidateConfirmed || reviewer)
  );
  const selectedProduct = selected ? products.find((p) => p.id === selected) : undefined;

  const pick = (id: string) => {
    setSelected(id);
    if (isPhone) setQuickLookOpen(true);
  };

  const toggleChecked = (id: string, on: boolean) =>
    setChecked((c) => (on ? [...new Set([...c, id])] : c.filter((x) => x !== id)));

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6">
      <PageHeader crumb={`Records / ${tab}`} title={tab}
        right={
          <div role="tablist" aria-label="Record categories" className="flex max-w-full overflow-x-auto rounded-md border border-border">
            {(Object.keys(directoryCounts) as (keyof typeof directoryCounts)[]).map((t) => (
              <button key={t} role="tab" aria-selected={t === tab} onClick={() => setTab(t)}
                className={cn(
                  "border-b-2 px-3 py-1.5 text-[12.5px] cursor-pointer whitespace-nowrap",
                  t === tab ? "border-b-primary bg-muted font-semibold text-foreground" : "border-b-transparent text-muted-foreground hover:text-foreground"
                )}>
                {t} <span className="tnum text-muted-foreground">{directoryCounts[t]}</span>
              </button>
            ))}
          </div>
        }
      />

      <NarrationNote>
        The catalogue door into the same reconciled model the chat answers from — every trust state on the record is visible before it is ever felt in a conversation.
      </NarrationNote>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── table column ── */}
        <div className="min-w-0">
          {/* filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((f) => (
              <Chip key={f.id} tone="neutral" className="pr-1">
                {f.label}
                <button aria-label={`Remove filter ${f.label}`} onClick={() => setFilters((fs) => fs.filter((x) => x.id !== f.id))}
                  className="grid size-4 place-items-center rounded-full hover:bg-border cursor-pointer">
                  <X className="size-3" />
                </button>
              </Chip>
            ))}
            <span className="ml-auto text-[12px] text-muted-foreground">
              {directoryFooter.inParis} in Paris{money && " · commission, highest first"}
            </span>
          </div>

          {/* bulk bar */}
          {checked.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-primary/40 bg-primary-soft/50 px-3 py-2">
              <span className="text-[13px] font-medium tnum">{checked.length} selected</span>
              <Button variant="outline" size="sm">Add to a list</Button>
              <Button variant="outline" size="sm">Compare <SchematicBadge /></Button>
              <Button variant="outline" size="sm">Export <SchematicBadge /></Button>
              <button onClick={() => setChecked([])} className="ml-auto text-[12.5px] text-primary underline underline-offset-2 cursor-pointer">Clear</button>
            </div>
          )}

          {/* table — wide content scrolls in its own container, never the page */}
          <div className="mt-3 rounded-lg border border-border bg-card">
            <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                  <th className="w-9 py-2 pl-3 font-normal" aria-label="Select" />
                  <th className="py-2 pr-3 font-normal">Property</th>
                  <th className="hidden py-2 pr-3 font-normal md:table-cell">Programme</th>
                  {money && (
                    <th className="py-2 pr-3 font-normal">
                      <span className="inline-flex items-center gap-1">Rate <ArrowUpDown className="size-3" aria-hidden /></span>
                    </th>
                  )}
                  <th className="py-2 pr-3 font-normal">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((p) => (
                  <tr key={p.id} onClick={() => pick(p.id)} aria-selected={selected === p.id}
                    className={cn("cursor-pointer", selected === p.id ? "bg-muted/70" : "hover:bg-muted/40")}>
                    <td className="py-2.5 pl-3 align-top" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={checked.includes(p.id)} onCheckedChange={(v) => toggleChecked(p.id, v === true)} aria-label={`Select ${p.name}`} />
                    </td>
                    <td className="py-2.5 pr-3">
                      <button onClick={() => pick(p.id)} className="text-left font-medium cursor-pointer">{p.name}</button>
                      <div className="text-[12px] text-muted-foreground">{p.city} · updated {p.updated}</div>
                    </td>
                    <td className="hidden py-2.5 pr-3 md:table-cell">
                      <span className="flex flex-wrap gap-1">
                        {p.programs.map((pr) => <Chip key={pr} tone="neutral" className="border border-border bg-background">{pr}</Chip>)}
                      </span>
                    </td>
                    {money && <td className="py-2.5 pr-3 tnum">{p.rate}</td>}
                    <td className="py-2.5 pr-3">
                      {p.id === "sereno-kyoto" && s.candidateConfirmed
                        ? <Chip tone="ok">confirmed today</Chip>
                        : <EvidenceDot kind={p.evidence.kind} label={p.evidence.label} />}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={money ? 5 : 4} className="px-3 py-6 text-center text-[13px] text-muted-foreground">No records match the current filters.</td></tr>
                )}
              </tbody>
            </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-[12px] text-muted-foreground">
              <span>{directoryFooter.inParis} results in Paris · {directoryFooter.verifiedThisQuarter} fields verified this quarter</span>
              <span className="tnum">{rows.length} of {directoryFooter.inParis} shown</span>
            </div>
          </div>

          {/* E-U5 — record missing from the directory */}
          <Section className="mt-4" title="Can't find a property?">
            <p className="text-[13px] text-muted-foreground">
              A missing record can be requested. The extraction pipeline creates a candidate for review, and the miss is logged to the knowledge-gaps report.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => d({ type: "fileRequest" })} disabled={s.requestFiled}>
                Request via the extraction pipeline
              </Button>
            </div>
            <div className="mt-2">
              <ConfirmBanner show={s.requestFiled}>
                Request filed. A candidate record now sits in the review queue; the gap is logged.
              </ConfirmBanner>
            </div>
          </Section>
        </div>

        {/* ── quick-look rail (md and up) ── */}
        <aside className="hidden min-w-0 md:block">
          {selectedProduct ? (
            <div className="relative">
              <button aria-label="Close quick look" onClick={() => setSelected(null)}
                className="absolute right-2 top-2 z-10 grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer">
                <X className="size-3.5" />
              </button>
              {selectedProduct.id === "maison-leandre" ? <LeandreQuickLook /> : <GenericQuickLook id={selectedProduct.id} money={money} />}
            </div>
          ) : (
            <Section><p className="text-[13px] text-muted-foreground">Select a row to inspect it here.</p></Section>
          )}
        </aside>
      </div>

      {/* ── PhoneStack: quick-look as bottom sheet below md ── */}
      <Sheet open={isPhone && quickLookOpen && !!selectedProduct} onOpenChange={(o) => { if (!o) setQuickLookOpen(false); }}>
        <SheetContent side="bottom" className="max-h-[80dvh] gap-0 overflow-y-auto p-4">
          <SheetTitle asChild><span className="sr-only">Quick look</span></SheetTitle>
          {selectedProduct && (
            selectedProduct.id === "maison-leandre" ? <LeandreQuickLook /> : <GenericQuickLook id={selectedProduct.id} money={money} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ── Maison Léandre rich quick-look ── */
function LeandreQuickLook() {
  const { s } = useDemo();
  const money = canViewCommissions(s.persona);
  const p = products.find((x) => x.id === "maison-leandre")!;
  const personalNote = leandreFields.find((f) => f.key === "note-rd");

  return (
    <div className="space-y-3">
      <Section>
        <div className="text-[15px] font-semibold">{p.name}</div>
        <div className="text-[12.5px] text-muted-foreground">{p.category} · {p.city}</div>
      </Section>

      {/* world-aware notice */}
      {s.world === "v2" && !s.spaNoticeClosed && (
        <SeverityBanner severity="Important">
          <div className="font-medium">Open notice</div>
          <div>Spa closed to 15 Sep. Opened 12 Jun at the agency layer.</div>
        </SeverityBanner>
      )}
      {s.world === "v1" && (
        <SeverityBanner severity="Info">
          <span className="text-muted-foreground">The spa notice auto-expired on 1 Aug. The card looks clean — the spa is still closed.</span>
        </SeverityBanner>
      )}

      <Section title="The record">
        <dl className="space-y-1.5 text-[13px]">
          {([["Address", p.address], ["Rooms", String(p.rooms)], ["Programme", p.brand], ["Rep firm", p.repFirm]] as [string, string | undefined][]).map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className={cn("text-right", k === "Rooms" && "tnum")}>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-2 border-t border-border pt-2">
          <FreshnessDate>updated {p.updated} · last verified {p.lastVerified}</FreshnessDate>
        </div>
      </Section>

      {money && (
        <Section title="Commission">
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-semibold tnum">{p.rate}</span>
            {s.conflictResolved
              ? <Chip tone="ok">resolved · agency layer</Chip>
              : <EvidenceDot kind="disagree" label={p.evidence.label} />}
          </div>
          {!s.conflictResolved && (
            <>
              <p className="mt-1.5 text-[12.5px] text-muted-foreground">Three sources hold three values, and none of them is chosen.</p>
              <Button asChild size="sm" className="mt-2 w-full">
                <Link href="/records/maison-leandre">Resolve 3 sources</Link>
              </Button>
            </>
          )}
        </Section>
      )}

      {personalNote && (
        <Section title="Personal note">
          <p className="text-[13.5px]">{personalNote.value}</p>
          <p className="mt-1 text-[12px] text-muted-foreground">{people.advisor} · booked Mar 2026</p>
          <p className="mt-1.5 border-t border-border pt-1.5 text-[12px] text-muted-foreground">Personal until shared.</p>
        </Section>
      )}

      <Button asChild variant="ghost" size="sm" className="text-primary">
        <Link href="/records/maison-leandre">Open full record <ArrowRight className="size-3.5" /></Link>
      </Button>
    </div>
  );
}

/* ── minimal quick-look for other rows ── */
function GenericQuickLook({ id, money }: { id: string; money: boolean }) {
  const p = products.find((x) => x.id === id);
  if (!p) return null;
  return (
    <div className="space-y-3">
      <Section>
        <div className="text-[15px] font-semibold">{p.name}</div>
        <div className="text-[12.5px] text-muted-foreground">{p.category} · {p.city}, {p.country}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip tone="neutral">{p.luxuryTier}</Chip>
          {p.programs.map((pr) => <Chip key={pr} tone="neutral" className="border border-border bg-background">{pr}</Chip>)}
          {p.status !== "Active" && <Chip tone="warn">{p.status}</Chip>}
        </div>
      </Section>
      <Section title="State">
        <div className="space-y-1.5 text-[13px]">
          <EvidenceDot kind={p.evidence.kind} label={p.evidence.label} />
          {money && p.rate !== "—" && (
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground">Commission</span><span className="tnum">{p.rate}</span>
            </div>
          )}
          <div><FreshnessDate>updated {p.updated} · last verified {p.lastVerified}</FreshnessDate></div>
        </div>
      </Section>
      <Button asChild variant="ghost" size="sm" className="text-primary">
        <Link href={`/records/${p.id}`}>Open full record <ArrowRight className="size-3.5" /></Link>
      </Button>
    </div>
  );
}
