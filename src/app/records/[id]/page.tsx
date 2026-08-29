"use client";
/** Full record — Journey E anatomy. Maison Léandre rich; Hôtel Verlaine Critical-gated; others minimal. */
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, canViewCommissions } from "@/lib/store";
import {
  products, leandreFields, leandreContext, commissionConflict, notices, promotions, people,
  type Field, type Layer,
} from "@/data/seed";
import {
  Chip, Section, PageHeader, SeverityBanner, NarrationNote, FreshnessDate, EvidenceDot,
  ConfirmBanner, SchematicBadge, LayerBadge, ProvenancePopover, SourceTag, ConfidenceMeter,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, EyeOff, Scale } from "lucide-react";

export default function RecordPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  if (id === "maison-leandre") return <Suspense fallback={null}><LeandreRecord /></Suspense>;
  if (id === "hotel-verlaine") return <VerlaineRecord />;
  return <GenericRecord id={id ?? ""} />;
}

/* ═══════════════ Resolve sheet (same anatomy as Journey A's) ═══════════════ */
function ResolveSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { d } = useDemo();
  const keep = () => { d({ type: "resolveConflict" }); onOpenChange(false); };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Scale className="size-4 text-crit" aria-hidden /> {commissionConflict.field} — 3 sources</SheetTitle>
          <SheetDescription>{commissionConflict.headline}</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4 pb-5">
          <NarrationNote>
            A ranking rule would settle this in a line of code — and would be wrong often enough to cost money. The advisor decides, once; the choice is stored at the agency layer and the question is not asked again.
          </NarrationNote>

          {commissionConflict.sources.map((src) => (
            <div key={src.id} className={cn("rounded-lg border p-3", src.id === "portal" ? "border-primary/50" : "border-border")}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium">{src.label}</div>
                  <div className="text-[12px] text-muted-foreground">{src.detail} · {src.when}</div>
                </div>
                <span className="ml-auto text-[20px] font-semibold tnum">{src.value}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-[12.5px] font-semibold">{src.status}</span>
                <ConfidenceMeter agree={src.agree} total={src.total} />
                <Button size="sm" variant="outline" className="ml-auto" onClick={keep} disabled={src.id !== "portal"}>
                  Keep this value
                </Button>
              </div>
            </div>
          ))}

          {/* ImpactPanel */}
          <div className="rounded-md border border-border bg-subtle p-3">
            <div className="text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">Where this value goes</div>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">
              The value you keep is what the directory shows, what a quote uses, and what the chat answers with. One decision, three places.
            </p>
            <dl className="mt-2 space-y-1 text-[13px]">
              {commissionConflict.impact.map((row) => (
                <div key={row.surface} className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">{row.surface}</dt>
                  <dd className="tnum font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-md border border-border p-3">
            <div className="text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">The other fields</div>
            <dl className="mt-2 space-y-1 text-[13px]">
              {commissionConflict.otherFields.map((f) => (
                <div key={f.label} className="flex items-baseline justify-between gap-3">
                  <dt>{f.label}</dt>
                  <dd><LayerBadge layer={f.layer} /></dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 border-t border-border pt-2 text-[12px] text-muted-foreground">Only commission is in dispute.</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ═══════════════ Maison Léandre — the full anatomy ═══════════════ */
function LeandreRecord() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s.persona);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noteScope, setNoteScope] = useState<"private" | "team" | "agency">("private");
  const [noteText, setNoteText] = useState("");
  const [savedScope, setSavedScope] = useState<"private" | "team" | "agency">("private");
  const spaNotice = notices.find((n) => n.id === "spa");
  const promo = promotions.find((p) => p.id === "atelier-credit");

  // Entry from the briefing: ?compose=notice opens the Add notice sheet on load.
  const search = useSearchParams();
  const compose = search?.get("compose") ?? null;
  useEffect(() => {
    if (compose === "notice") setNoticeOpen(true);
  }, [compose]);

  const groups: { layer: Layer; title: string }[] = [
    { layer: "canonical", title: "Enable canonical" },
    { layer: "agency", title: "Agency overlay" },
    { layer: "personal", title: "Personal" },
  ];
  // A private note renders only to its owner — absent for every other persona, not masked.
  const fieldsFor = (layer: Layer) =>
    leandreFields.filter(
      (f) =>
        f.layer === layer &&
        (money || f.key !== "commission") &&
        (s.persona === "advisor" || f.key !== "note-rd")
    );

  const scopeLabel = { private: "private to " + people.advisor, team: "team · Paris desk", agency: "agency-wide" }[savedScope];

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6">
      <PageHeader crumb="Records / Maison Léandre"
        title={<>Maison Léandre <Chip tone="neutral">Hotel · Paris 4e</Chip></>}
        right={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/ask" onClick={() => d({ type: "askScope", scope: "Maison Léandre" })}>Ask about this</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setNoteOpen(true)}>Add note…</Button>
            <Button variant="outline" size="sm" onClick={() => setNoticeOpen(true)}>Add notice…</Button>
          </div>
        }
      />

      <NarrationNote>
        The record is the model, inspectable — every value carries where it came from, how old it is, and which layer owns it. The conflict is seen here before it is felt in the conversation.
      </NarrationNote>

      <div className="mt-3 space-y-2">
        {/* world-aware notice banners */}
        {s.world === "v2" && spaNotice && !s.spaNoticeClosed && (
          <SeverityBanner severity="Important">
            <div className="flex flex-wrap items-center gap-2">
              <span><b>{spaNotice.text}</b> Opened {spaNotice.openedAt} · {spaNotice.scope} scope · {spaNotice.owner}</span>
              <span className="ml-auto" />
              {spaNotice.staleReviewDue && <Chip tone="warn">Still true? review due · {spaNotice.ageDays}d open</Chip>}
            </div>
          </SeverityBanner>
        )}
        {s.world === "v1" && (
          <SeverityBanner severity="Info">
            <span className="text-muted-foreground">
              The spa notice auto-expired on 1 Aug — the card looks clean, the spa is still closed.
            </span>
          </SeverityBanner>
        )}
        <ConfirmBanner show={s.noteSaved}>Note saved — {scopeLabel} · attributed and dated.</ConfirmBanner>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── main: three layer groups ── */}
        <div className="min-w-0 space-y-4">
          {groups.map((g) => (
            <Section key={g.layer} title={g.title} chips={<LayerBadge layer={g.layer} />}>
              <div className="divide-y divide-border">
                {fieldsFor(g.layer).map((f) => (
                  <FieldRow key={f.key} f={f} resolved={s.conflictResolved} onResolve={() => setResolveOpen(true)} />
                ))}
                {g.layer === "personal" && s.noteSaved && s.persona === "advisor" && (
                  <div className="grid gap-1.5 py-2.5 sm:grid-cols-[140px_minmax(0,1fr)]">
                    <div className="text-[13px] text-muted-foreground">My note</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-[13.5px]">{noteText.trim() ? `“${noteText.trim()}”` : "Note on file"}</span>
                      <Chip tone="ok">Saved just now · {savedScope}</Chip>
                      <span className="ml-auto flex items-center gap-2">
                        <SourceTag kind="manual" label={`${people.advisor} · today`} />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          ))}
        </div>

        {/* ── context rail ── */}
        <aside className="min-w-0 space-y-3">
          <Section title="Amenities">
            <div className="space-y-3 text-[13px]">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Facility · freeform</div>
                <p className="mt-1 text-muted-foreground italic">“View Hotel — experience refined luxury…”</p>
                <Chip tone="warn" className="mt-1">template copy — needs editorial</Chip>
              </div>
              <div className="border-t border-border pt-2.5">
                <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Client amenities · programme</div>
                <ul className="mt-1 space-y-1">
                  {leandreContext.clientAmenities.map((a) => (
                    <li key={a.slug} className="flex items-baseline justify-between gap-2">
                      <span>{a.benefit}</span>
                      <span className="font-mono text-[10.5px] text-muted-foreground">{a.slug}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {money && (
                <div className="border-t border-border pt-2.5">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Agent terms</div>
                  {leandreContext.agentAmenities.map((a) => (
                    <p key={a.category} className="mt-1"><Chip tone="primary">{a.category}</Chip> <span className="tnum">{a.text}</span></p>
                  ))}
                </div>
              )}
            </div>
          </Section>

          <Section title="Contacts">
            <ul className="space-y-1.5 text-[13px]">
              {leandreContext.contacts.map((c) => (
                <li key={c.name}>
                  <span className="font-medium">{c.name}</span> <span className="text-muted-foreground">· {c.role}</span>
                  {c.note && <div className="text-[12px] text-muted-foreground">{c.note}</div>}
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t border-border pt-2 text-[13px]">
              <span className="text-muted-foreground">Rep firm · </span>Corvin &amp; Wells — Paris account
            </p>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">Booked last by {leandreContext.whoBookedLast}</p>
          </Section>

          {money && promo && (
            <Section title="Active promotion">
              <div className="text-[13.5px] font-medium">{promo.productName} — {promo.rate}</div>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {promo.stacksWithBase ? "bonus — adds to base" : "override — replaces base"} · book by {promo.bookingWindowEnd} · travel by {promo.travelWindowEnd}
              </p>
              <Chip tone="warn" className="mt-1.5 tnum">{promo.daysLeft} days left</Chip>
            </Section>
          )}

          {/* client intelligence: gated — absent, not masked; lead sees the admin-note line only */}
          {s.persona === "lead" && (
            <p className="flex items-center gap-1.5 px-1 text-[12px] text-muted-foreground">
              <EyeOff className="size-3.5 shrink-0" aria-hidden />
              Client intelligence · {leandreContext.clientIntelligence.note}
            </p>
          )}
        </aside>
      </div>

      <ResolveSheet open={resolveOpen} onOpenChange={setResolveOpen} />

      {/* ── note composer ── */}
      <Sheet open={noteOpen} onOpenChange={setNoteOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>Add a note</SheetTitle>
            <SheetDescription>Attributed to {people.advisor}, dated today. The scope is chosen at creation.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-5">
            <Textarea placeholder="What should the record remember?" aria-label="Note text" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <RadioGroup value={noteScope} onValueChange={(v) => setNoteScope(v as typeof noteScope)} className="gap-2.5">
              {([["private", "Private", `Only ${people.advisor}`], ["team", "Team", "Paris desk"], ["agency", "Agency-wide", "Every advisor"]] as const).map(([v, l, hint]) => (
                <div key={v} className="flex items-start gap-2.5">
                  <RadioGroupItem value={v} id={`scope-${v}`} className="mt-0.5" />
                  <Label htmlFor={`scope-${v}`} className="flex flex-col items-start gap-0.5">
                    <span className="text-[13.5px]">{l}</span>
                    <span className="text-[12px] font-normal text-muted-foreground">{hint}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Button size="sm" onClick={() => { setSavedScope(noteScope); d({ type: "saveNote" }); setNoteOpen(false); }}>Save note</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── notice composer (schematic) ── */}
      <Sheet open={noticeOpen} onOpenChange={setNoticeOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">Add a notice <SchematicBadge /></SheetTitle>
            <SheetDescription>A notice carries a severity, a scope, and an owner. It stays open until someone closes it.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-5">
            <Textarea placeholder="What changed at the property?" aria-label="Notice text" />
            <div>
              <div className="mb-1.5 text-[12px] font-medium">Severity</div>
              <div className="flex gap-1.5">
                <Chip tone="neutral">Info</Chip><Chip tone="warn">Important</Chip><Chip tone="crit">Critical</Chip>
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-[12px] font-medium">Scope</div>
              <div className="flex gap-1.5">
                <Chip tone="neutral">Personal</Chip><Chip tone="neutral">Team</Chip><Chip tone="primary">Agency</Chip>
              </div>
            </div>
            <Button size="sm" variant="outline">Submit for review</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ── one field row, all states ── */
function FieldRow({ f, resolved, onResolve }: { f: Field; resolved: boolean; onResolve: () => void }) {
  // Stale-field one-tap verify (E6) — local to this row.
  const [verified, setVerified] = useState(false);
  if (f.state === "conflict") {
    return (
      <div className="grid gap-1.5 py-2.5 sm:grid-cols-[140px_minmax(0,1fr)]">
        <div className="text-[13px] text-muted-foreground">{f.label}</div>
        {resolved ? (
          <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
            <ProvenancePopover source={f.source}><span className="font-medium tnum">12%</span></ProvenancePopover>
            <Chip tone="ok">resolved</Chip>
            <span className="text-[12px] text-muted-foreground">agency layer · by {people.advisor} today · both sources reachable</span>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {commissionConflict.sources.map((src) => (
                <span key={src.id} className="rounded-md border border-border px-2 py-1 text-[12.5px]">
                  <b className="tnum">{src.value}</b> <span className="text-muted-foreground">{src.label} · {src.when}</span>
                </span>
              ))}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Chip tone="crit">3 sources disagree</Chip>
              <Button size="sm" onClick={onResolve}>Resolve 3 sources</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-1.5 py-2.5 sm:grid-cols-[140px_minmax(0,1fr)]">
      <div className="text-[13px] text-muted-foreground">{f.label}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <ProvenancePopover source={f.source}>
            <span className={cn("text-[13.5px]", f.key === "rooms" && "tnum", f.state === "template" && "italic text-muted-foreground")}>{f.value}</span>
          </ProvenancePopover>
          {f.state === "edited-overlay" && <Chip tone="primary">agency overlay</Chip>}
          {f.state === "stale" && (
            verified ? (
              <Chip tone="ok">verified today · {people.advisor}</Chip>
            ) : (
              <>
                <Chip tone="warn" className="tnum">{f.staleDays}d unverified</Chip>
                <Button variant="outline" size="sm" onClick={() => setVerified(true)}>Verify against source</Button>
              </>
            )
          )}
          {f.state === "template" && <Chip tone="warn">template copy — needs editorial</Chip>}
          <span className="ml-auto flex items-center gap-2">
            <SourceTag kind={f.source.kind} label={f.source.where} />
            <FreshnessDate stale={f.state === "stale" && !verified}>{f.state === "stale" && verified ? "verified today" : f.source.when}</FreshnessDate>
          </span>
        </div>
        {f.state === "template" && (
          <p className="mt-0.5 text-[12px] text-muted-foreground">Excluded from answer corroboration.</p>
        )}
        {f.state === "edited-overlay" && f.beneath && (
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            canonical beneath ·{" "}
            <ProvenancePopover source={f.beneath.source}><span>{f.beneath.value}</span></ProvenancePopover>
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════ Hôtel Verlaine — Critical acknowledgment gate ═══════════════ */
function VerlaineRecord() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s.persona);
  const p = products.find((x) => x.id === "hotel-verlaine")!;
  const crit = notices.find((n) => n.id === "verlaine-crit")!;
  const [dlgOpen, setDlgOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const onShortlist = () => {
    if (s.verlaineAcked) setAdded(true);
    else setDlgOpen(true);
  };
  const acknowledge = () => {
    d({ type: "ackVerlaine" });
    setAdded(true);
    setDlgOpen(false);
  };

  return (
    <div className="mx-auto max-w-[980px] px-6 py-6">
      <PageHeader crumb="Records / Hôtel Verlaine"
        title={<>Hôtel Verlaine <Chip tone="neutral">Hotel · Paris 8e</Chip></>} />

      <SeverityBanner severity="Critical" className="mt-2">
        <div className="flex flex-wrap items-center gap-2">
          <span><b>Critical.</b> {crit.text}</span>
          <span className="ml-auto" />
          {s.verlaineAcked
            ? <Chip tone="ok">acknowledged — {people.advisor}, today</Chip>
            : <Chip tone="crit">acknowledgment required</Chip>}
        </div>
        <div className="mt-1 text-[12px] text-muted-foreground">Opened {crit.openedAt} · {crit.scope} scope · {crit.owner}</div>
      </SeverityBanner>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Section title="The record">
          <dl className="space-y-1.5 text-[13px]">
            <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">City</dt><dd>{p.city}, {p.country}</dd></div>
            <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Programme</dt><dd>{p.programs.join(" · ")}</dd></div>
            {money && <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Commission</dt><dd className="tnum">{p.rate}</dd></div>}
            <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Style</dt><dd>{p.tags?.join(" · ")}</dd></div>
          </dl>
          <div className="mt-2 border-t border-border pt-2 flex items-center gap-3">
            <EvidenceDot kind={p.evidence.kind} label={p.evidence.label} />
            <FreshnessDate>updated {p.updated}</FreshnessDate>
          </div>
        </Section>

        <Section title="Use in itineraries">
          <p className="text-[13px] text-muted-foreground">
            A Critical notice blocks shortlist and proposal use until it is acknowledged. Dismissing the notice is not an acknowledgment.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={onShortlist} disabled={added}>Add to itinerary shortlist</Button>
            {added && <Chip tone="ok">on the shortlist</Chip>}
          </div>
        </Section>
      </div>

      <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Critical notice on Hôtel Verlaine</DialogTitle>
            <DialogDescription>{crit.text}</DialogDescription>
          </DialogHeader>
          <SeverityBanner severity="Critical">
            Opened {crit.openedAt} · {crit.scope} scope · {crit.owner}
          </SeverityBanner>
          <p className="text-[12.5px] text-muted-foreground">
            Closing this dialog does not unblock the property. The acknowledgment is recorded with a name and a date.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgOpen(false)}>Close</Button>
            <Button onClick={acknowledge}>Acknowledge (recorded: {people.advisor}, today)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════ Minimal generic record ═══════════════ */
function GenericRecord({ id }: { id: string }) {
  const { s } = useDemo();
  const money = canViewCommissions(s.persona);
  const p = products.find((x) => x.id === id);

  if (!p) {
    return (
      <div className="mx-auto max-w-[980px] px-6 py-6">
        <PageHeader crumb="Records" title="Not in the directory" />
        <Section>
          <p className="text-[13px] text-muted-foreground">
            No record carries this id. A missing property can be requested from the directory — the extraction pipeline creates a candidate for review.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-2.5">
            <Link href="/records">Back to records <ArrowRight className="size-3.5" /></Link>
          </Button>
        </Section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[980px] px-6 py-6">
      <PageHeader crumb={`Records / ${p.name}`}
        title={<>{p.name} <Chip tone="neutral">{p.category} · {p.city}</Chip></>} />
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="The record">
          <dl className="space-y-1.5 text-[13px]">
            <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">City</dt><dd>{p.city}, {p.country}</dd></div>
            <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Tier</dt><dd>{p.luxuryTier}</dd></div>
            {p.programs.length > 0 && (
              <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Programme</dt><dd>{p.programs.join(" · ")}</dd></div>
            )}
            {money && p.rate !== "—" && (
              <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Commission</dt><dd className="tnum">{p.rate}</dd></div>
            )}
            {p.status !== "Active" && (
              <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Status</dt><dd><Chip tone="warn">{p.status}</Chip></dd></div>
            )}
          </dl>
        </Section>
        <Section title="State">
          <div className="space-y-1.5 text-[13px]">
            <EvidenceDot kind={p.evidence.kind} label={p.evidence.label} />
            <div><FreshnessDate>updated {p.updated} · last verified {p.lastVerified}</FreshnessDate></div>
          </div>
        </Section>
      </div>
    </div>
  );
}
