"use client";
/**
 * Full record — the Document archetype (§7): main column plus a context rail.
 *
 * Maison Léandre carries the whole anatomy (three layers, provenance, conflict,
 * stale field, template copy, edited overlay, note composer). Hôtel Verlaine
 * carries the Critical acknowledgment gate. Every other id renders a real record
 * from its own seed fields — never a stub.
 */
import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, canViewCommissions } from "@/lib/store";
import {
  products, productById, leandreFields, leandreContext, commissionConflict,
  notices, promotions, people,
  type Field, type Layer, type Product,
} from "@/data/seed";
import { Page, PageHeader, PropertyImage } from "@/components/layouts";
import {
  Chip, Section, SeverityBanner, NarrationNote, FreshnessDate, EvidenceDot,
  ConfirmBanner, SchematicBadge, LayerBadge, ProvenancePopover, SourceTag, ConfidenceMeter,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, EyeOff, MessageSquareText, Scale } from "lucide-react";

export default function RecordPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  if (id === "maison-leandre") return <Suspense fallback={null}><LeandreRecord /></Suspense>;
  if (id === "hotel-verlaine") return <VerlaineRecord />;
  return <GenericRecord id={id ?? ""} />;
}

/* ── the plate that opens every record ─────────────────────────────────────── */
function RecordPlate({ p }: { p: Product }) {
  return (
    <div className="mt-4 h-28 w-full overflow-hidden rounded-lg border border-border sm:h-40">
      <PropertyImage id={p.id} name={p.name} category={p.category} />
    </div>
  );
}

/* ═══════════════ Resolve sheet ═══════════════ */
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
            <div key={src.id} className={cn("rounded-lg border p-4", src.id === "portal" ? "border-primary/50" : "border-border")}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0">
                  <div className="type-data-strong">{src.label}</div>
                  <div className="t-meta">{src.detail} · {src.when}</div>
                </div>
                <span className="ml-auto t-display tnum">{src.value}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="t-body font-semibold">{src.status}</span>
                <ConfidenceMeter agree={src.agree} total={src.total} />
                <Button size="sm" variant="outline" className="ml-auto" onClick={keep} disabled={src.id !== "portal"}>
                  Keep this value
                </Button>
              </div>
            </div>
          ))}

          {/* ImpactPanel */}
          <div className="rounded-md border border-border bg-subtle p-4">
            <div className="t-micro font-mono uppercase tracking-widest text-muted-foreground">Where this value goes</div>
            <p className="mt-2 t-meta">
              The value you keep is what the directory shows, what a quote uses, and what the chat answers with. One decision, three places.
            </p>
            <dl className="mt-2 space-y-1 t-body">
              {commissionConflict.impact.map((row) => (
                <div key={row.surface} className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">{row.surface}</dt>
                  <dd className="tnum font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-md border border-border p-4">
            <div className="t-micro font-mono uppercase tracking-widest text-muted-foreground">The other fields</div>
            <dl className="mt-2 space-y-1 t-body">
              {commissionConflict.otherFields.map((f) => (
                <div key={f.label} className="flex items-baseline justify-between gap-3">
                  <dt>{f.label}</dt>
                  <dd><LayerBadge layer={f.layer} /></dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 border-t border-border pt-2 t-meta">Only commission is in dispute.</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ═══════════════ Maison Léandre — the full anatomy ═══════════════ */
function LeandreRecord() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s.role);
  const p = productById("maison-leandre")!;
  // Entry from the briefing: ?compose=notice opens the Add notice sheet on arrival.
  const search = useSearchParams();
  const [resolveOpen, setResolveOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(() => search?.get("compose") === "notice");
  const [noteScope, setNoteScope] = useState<"private" | "team" | "agency">("private");
  const [noteText, setNoteText] = useState("");
  const [savedScope, setSavedScope] = useState<"private" | "team" | "agency">("private");
  const spaNotice = notices.find((n) => n.id === "spa");
  const promo = promotions.find((x) => x.id === "atelier-credit");

  const groups: { layer: Layer; title: string }[] = [
    { layer: "canonical", title: "Enable canonical" },
    { layer: "agency", title: "Agency overlay" },
    { layer: "personal", title: "Personal" },
  ];
  // A private note renders only to its owner — absent for every other role, not masked.
  const fieldsFor = (layer: Layer) =>
    leandreFields.filter(
      (f) =>
        f.layer === layer &&
        (money || f.key !== "commission") &&
        (s.role === "advisor" || f.key !== "note-rd")
    );

  const scopeLabel = { private: "private to " + people.advisor, team: "team · Paris desk", agency: "agency-wide" }[savedScope];

  return (
    <Page width="wide">
      <PageHeader
        back="/records"
        crumb="Records / Hotel"
        title={<>Maison Léandre <Chip tone="neutral">Hotel · Paris 4e</Chip></>}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/ask" onClick={() => d({ type: "askScope", scope: "Maison Léandre" })}>
                <MessageSquareText className="size-3.5" aria-hidden /> Ask about this
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setNoteOpen(true)}>Add note…</Button>
            <Button variant="outline" size="sm" onClick={() => setNoticeOpen(true)}>Add notice…</Button>
          </>
        }
      >
        <RecordPlate p={p} />
      </PageHeader>

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
                {g.layer === "personal" && s.noteSaved && s.role === "advisor" && (
                  <div className="grid gap-2 py-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                    <div className="t-body text-muted-foreground">My note</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="t-body">{noteText.trim() ? `“${noteText.trim()}”` : "Note on file"}</span>
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
            <div className="space-y-3 t-body">
              <div>
                <div className="t-micro font-mono uppercase tracking-widest text-muted-foreground">Facility · freeform</div>
                <p className="mt-1 text-muted-foreground italic">“View Hotel — experience refined luxury…”</p>
                <Chip tone="warn" className="mt-1">template copy — needs editorial</Chip>
              </div>
              <div className="border-t border-border pt-3">
                <div className="t-micro font-mono uppercase tracking-widest text-muted-foreground">Client amenities · programme</div>
                <ul className="divide-y divide-border">
                  {leandreContext.clientAmenities.map((a) => (
                    <li key={a.slug} className="row-grid">
                      <span className="row-primary">{a.benefit}</span>
                      <span className="row-trailing font-mono t-micro text-muted-foreground">{a.slug}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {money && (
                <div className="border-t border-border pt-3">
                  <div className="t-micro font-mono uppercase tracking-widest text-muted-foreground">Agent terms</div>
                  {leandreContext.agentAmenities.map((a) => (
                    <p key={a.category} className="mt-1"><Chip tone="primary">{a.category}</Chip> <span className="tnum">{a.text}</span></p>
                  ))}
                </div>
              )}
            </div>
          </Section>

          <Section title="Contacts">
            <ul className="divide-y divide-border t-body">
              {leandreContext.contacts.map((c) => (
                <li key={c.name}>
                  <div className="row-grid">
                    <span className="row-primary">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground"> · {c.role}</span>
                    </span>
                  </div>
                  {c.note && <div className="t-meta pb-2">{c.note}</div>}
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t border-border pt-2 t-body">
              <span className="text-muted-foreground">Rep firm · </span>Corvin &amp; Wells — Paris account
            </p>
            <p className="mt-2 t-meta">Booked last by {leandreContext.whoBookedLast}</p>
          </Section>

          {money && promo && (
            <Section title="Active promotion">
              <div className="type-data-strong">{promo.productName} — {promo.rate}</div>
              <p className="mt-1 t-meta">
                {promo.stacksWithBase ? "bonus — adds to base" : "override — replaces base"} · book by {promo.bookingWindowEnd} · travel by {promo.travelWindowEnd}
              </p>
              <Chip tone="warn" className="mt-2 tnum">{promo.daysLeft} days left</Chip>
            </Section>
          )}

          {/* client intelligence: gated — absent, not masked; lead sees the admin-note line only */}
          {s.role === "lead" && (
            <p className="flex items-center gap-2 px-1 t-meta">
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
            <RadioGroup value={noteScope} onValueChange={(v) => setNoteScope(v as typeof noteScope)} className="gap-3">
              {([["private", "Private", `Only ${people.advisor}`], ["team", "Team", "Paris desk"], ["agency", "Agency-wide", "Every advisor"]] as const).map(([v, l, hint]) => (
                <div key={v} className="flex items-start gap-3">
                  <RadioGroupItem value={v} id={`scope-${v}`} className="mt-0.5" />
                  <Label htmlFor={`scope-${v}`} className="flex flex-col items-start gap-0.5">
                    <span className="t-body">{l}</span>
                    <span className="t-meta font-normal">{hint}</span>
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
              <div className="mb-2 t-micro">Severity</div>
              <div className="flex gap-2">
                <Chip tone="neutral">Info</Chip><Chip tone="warn">Important</Chip><Chip tone="crit">Critical</Chip>
              </div>
            </div>
            <div>
              <div className="mb-2 t-micro">Scope</div>
              <div className="flex gap-2">
                <Chip tone="neutral">Personal</Chip><Chip tone="neutral">Team</Chip><Chip tone="primary">Agency</Chip>
              </div>
            </div>
            <Button size="sm" variant="outline">Submit for review</Button>
          </div>
        </SheetContent>
      </Sheet>
    </Page>
  );
}

/* ── one field row, all states ── */
function FieldRow({ f, resolved, onResolve }: { f: Field; resolved: boolean; onResolve: () => void }) {
  // Stale-field one-tap verify (E6) — local to this row.
  const [verified, setVerified] = useState(false);
  if (f.state === "conflict") {
    return (
      <div className="grid gap-2 py-3 sm:grid-cols-[140px_minmax(0,1fr)]">
        <div className="t-body text-muted-foreground">{f.label}</div>
        {resolved ? (
          <div className="flex flex-wrap items-center gap-2 t-body">
            <ProvenancePopover source={f.source}><span className="font-medium tnum">12%</span></ProvenancePopover>
            <Chip tone="ok">resolved</Chip>
            <span className="t-meta">agency layer · by {people.advisor} today · both sources reachable</span>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {commissionConflict.sources.map((src) => (
                <span key={src.id} className="rounded-md border border-border px-2 py-1 t-body">
                  <b className="tnum">{src.value}</b> <span className="text-muted-foreground">{src.label} · {src.when}</span>
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Chip tone="crit">3 sources disagree</Chip>
              <Button size="sm" onClick={onResolve}>Resolve 3 sources</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-2 py-3 sm:grid-cols-[140px_minmax(0,1fr)]">
      <div className="t-body text-muted-foreground">{f.label}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <ProvenancePopover source={f.source}>
            <span className={cn("t-body", f.key === "rooms" && "tnum", f.state === "template" && "italic text-muted-foreground")}>{f.value}</span>
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
          <p className="mt-1 t-meta">Excluded from answer corroboration.</p>
        )}
        {f.state === "edited-overlay" && f.beneath && (
          <p className="mt-1 t-meta">
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
  const money = canViewCommissions(s.role);
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
    <Page width="wide">
      <PageHeader
        back="/records"
        crumb="Records / Hotel"
        title={<>Hôtel Verlaine <Chip tone="neutral">Hotel · Paris 8e</Chip></>}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/ask" onClick={() => d({ type: "askScope", scope: p.name })}>
              <MessageSquareText className="size-3.5" aria-hidden /> Ask about this
            </Link>
          </Button>
        }
      >
        <RecordPlate p={p} />
      </PageHeader>

      <SeverityBanner severity="Critical">
        <div className="flex flex-wrap items-center gap-2">
          <span><b>Critical.</b> {crit.text}</span>
          <span className="ml-auto" />
          {s.verlaineAcked
            ? <Chip tone="ok">acknowledged — {people.advisor}, today</Chip>
            : <Chip tone="crit">acknowledgment required</Chip>}
        </div>
        <div className="mt-1 t-meta">Opened {crit.openedAt} · {crit.scope} scope · {crit.owner}</div>
      </SeverityBanner>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <Section title="The record">
            <p className="mb-3 t-body text-muted-foreground">{p.blurb}</p>
            <dl className="space-y-2 t-body">
              <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">City</dt><dd>{p.city}, {p.country}</dd></div>
              <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Tier</dt><dd>{p.luxuryTier}</dd></div>
              <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Rooms</dt><dd className="tnum">{p.rooms}</dd></div>
              <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Programme</dt><dd>{p.programs.join(" · ")}</dd></div>
              <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Rep firm</dt><dd>{p.repFirm}</dd></div>
              {money && <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Commission</dt><dd className="tnum">{p.rate}</dd></div>}
              <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Style</dt><dd>{p.tags?.join(" · ")}</dd></div>
            </dl>
            <div className="mt-2 flex items-center gap-3 border-t border-border pt-2">
              <EvidenceDot kind="verified" label={p.evidence.label} />
              <FreshnessDate>updated {p.updated}</FreshnessDate>
            </div>
          </Section>

          <Section title="Use in itineraries">
            <p className="t-body text-muted-foreground">
              A Critical notice blocks shortlist and proposal use until it is acknowledged. Dismissing the notice is not an acknowledgment.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={onShortlist} disabled={added}>Add to itinerary shortlist</Button>
              {added && <Chip tone="ok">on the shortlist</Chip>}
            </div>
          </Section>
        </div>

        <aside className="min-w-0 space-y-3">
          <Section title="Open notices">
            {notices.filter((n) => n.productId === p.id).map((n) => (
              <div key={n.id} className="t-body">
                <Chip tone={n.severity === "Critical" ? "crit" : n.severity === "Important" ? "warn" : "neutral"}>{n.severity}</Chip>
                <p className="mt-2">{n.text}</p>
                <p className="mt-1 t-meta">Opened {n.openedAt} · {n.scope} scope · {n.owner} · <span className="tnum">{n.ageDays}d</span> open</p>
              </div>
            ))}
            <p className="mt-2 border-t border-border pt-2 t-meta">
              A notice stays open until someone closes it. Nothing expires on a timer.
            </p>
          </Section>
        </aside>
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
          <p className="t-meta">
            Closing this dialog does not unblock the property. The acknowledgment is recorded with a name and a date.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgOpen(false)}>Close</Button>
            <Button onClick={acknowledge}>Acknowledge (recorded: {people.advisor}, today)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}

/* ═══════════════ Every other record — real, from its own fields ═══════════════ */
function GenericRecord({ id }: { id: string }) {
  const { s, d } = useDemo();
  const money = canViewCommissions(s.role);
  const p = productById(id);
  const reviewer = s.role === "lead" || s.role === "ops";

  if (!p) {
    return (
      <Page width="wide">
        <PageHeader back="/records" crumb="Records" title="Not in the directory" />
        <Section>
          <p className="t-body text-muted-foreground">
            No record carries this id. A missing property can be requested from the directory — the extraction pipeline creates a candidate for review.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/records">Back to records <ArrowRight className="size-3.5" aria-hidden /></Link>
          </Button>
        </Section>
      </Page>
    );
  }

  // The unconfirmed candidate is not a record yet, and does not pretend to be one.
  if (p.id === "sereno-kyoto" && !s.candidateConfirmed && !reviewer) {
    return (
      <Page width="wide">
        <PageHeader back="/records" crumb="Records" title="Awaiting confirmation" />
        <Section>
          <p className="t-body text-muted-foreground">
            This candidate arrived from a DMC spreadsheet and has not been confirmed. It does not answer
            questions and it is not offered to a client until a reviewer has been through it field by field.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/records">Back to records <ArrowRight className="size-3.5" aria-hidden /></Link>
          </Button>
        </Section>
      </Page>
    );
  }

  const productNotices = notices.filter((n) => n.productId === p.id);
  const productPromo = promotions.find((x) => x.productId === p.id);

  return (
    <Page width="wide">
      <PageHeader
        back="/records"
        crumb={`Records / ${p.category}`}
        title={<>{p.name} <Chip tone="neutral">{p.category} · {p.city}</Chip></>}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/ask" onClick={() => d({ type: "askScope", scope: p.name })}>
              <MessageSquareText className="size-3.5" aria-hidden /> Ask about this
            </Link>
          </Button>
        }
      >
        <RecordPlate p={p} />
      </PageHeader>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <Section title="The record">
            {p.blurb && <p className="mb-3 t-body text-muted-foreground">{p.blurb}</p>}
            <dl className="space-y-2 t-body">
              <Row k="Location">{p.city}{p.country !== "—" ? `, ${p.country}` : ""} · {p.region}</Row>
              <Row k="Tier">{p.luxuryTier}</Row>
              {p.brand && <Row k="Brand">{p.brand}</Row>}
              {p.address && <Row k="Address">{p.address}</Row>}
              {p.rooms !== undefined && <Row k="Rooms" tnum>{p.rooms}</Row>}
              <Row k="Status">
                {p.status === "Active" ? "Active" : <Chip tone="warn">{p.status}</Chip>}
              </Row>
              {money && p.rate !== "—" && <Row k="Commission" tnum>{p.rate}</Row>}
            </dl>
          </Section>

          <Section title="Programmes and consortia">
            <div className="flex flex-wrap gap-2">
              {p.programs.map((pr) => <Chip key={pr} tone="primary">{pr}</Chip>)}
              {p.consortia.map((c) => <Chip key={c} tone="neutral" className="border border-border bg-background">{c}</Chip>)}
              {p.programs.length === 0 && p.consortia.length === 0 && (
                <p className="t-body text-muted-foreground">
                  No programme or consortium membership on file. Nothing is inferred from the category.
                </p>
              )}
            </div>
            {p.tags && p.tags.length > 0 && (
              <p className="mt-3 border-t border-border pt-2 t-body">
                <span className="text-muted-foreground">Style · </span>{p.tags.join(" · ")}
              </p>
            )}
          </Section>

          {productNotices.length > 0 && (
            <Section title="Open notices">
              <div className="space-y-3">
                {productNotices.map((n) => (
                  <SeverityBanner key={n.id} severity={n.severity}>
                    <div>{n.text}</div>
                    <div className="mt-1 t-meta">
                      Opened {n.openedAt} · {n.scope} scope · {n.owner} · <span className="tnum">{n.ageDays}d</span> open
                    </div>
                  </SeverityBanner>
                ))}
              </div>
            </Section>
          )}
        </div>

        <aside className="min-w-0 space-y-3">
          <Section title="Evidence">
            <div className="space-y-2 t-body">
              {p.evidence.kind === "unconfirmed"
                ? <Chip tone="warn">{p.evidence.label}</Chip>
                : <EvidenceDot kind={p.evidence.kind} label={p.evidence.label} />}
              <div>
                <FreshnessDate stale={!!p.staleDays}>
                  updated {p.updated} · last verified {p.lastVerified}
                </FreshnessDate>
              </div>
              {p.staleDays !== undefined && (
                <p className="t-meta">
                  It still answers — with its date and a freshness warning attached.
                </p>
              )}
            </div>
          </Section>

          {p.repFirm && (
            <Section title="Representation">
              <p className="type-data-strong">{p.repFirm}</p>
              <p className="mt-1 t-meta">Rep firm of record.</p>
            </Section>
          )}

          {money && productPromo && (
            <Section title="Active promotion">
              <div className="type-data-strong">{productPromo.rate}</div>
              <p className="mt-1 t-meta">
                {productPromo.stacksWithBase ? "bonus — adds to base" : "override — replaces base"} · book by {productPromo.bookingWindowEnd} · travel by {productPromo.travelWindowEnd}
              </p>
              <Chip tone="warn" className="mt-2 tnum">{productPromo.daysLeft} days left</Chip>
            </Section>
          )}
        </aside>
      </div>
    </Page>
  );
}

function Row({ k, children, tnum }: { k: string; children: ReactNode; tnum?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{k}</dt>
      <dd className={cn("text-right", tnum && "tnum")}>{children}</dd>
    </div>
  );
}
