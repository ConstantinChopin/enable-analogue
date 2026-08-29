"use client";
/** Candidate detail — per-field confirm with source snippets (Journey D 4.4); merge sheet for duplicates (U2). */
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDemo } from "@/lib/store";
import { candidates, products, people } from "@/data/seed";
import { Chip, Section, PageHeader, NarrationNote, ConfirmBanner, ConfidenceMeter, MoneyValue, SeverityBanner } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, CircleDashed, Pencil } from "lucide-react";

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const { s, d } = useDemo();
  const candidate = candidates.find((c) => c.id === id);

  const [fieldOk, setFieldOk] = useState<Record<string, boolean>>({});
  // Per-field correction (D-U1) — inline fix, attributed to the reviewer.
  const [corrected, setCorrected] = useState<Record<string, string>>({});
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [banner, setBanner] = useState<string | null>(null);

  if (!candidate) {
    return (
      <div className="mx-auto max-w-[980px] px-6 py-6">
        <PageHeader crumb="Confirm new records" title="Candidate" />
        <Section><p className="text-[13px] text-muted-foreground">No candidate at this address.</p></Section>
      </div>
    );
  }

  /* Held candidate (unreadable source) — minimal */
  if (candidate.kind === "held") {
    return (
      <div className="mx-auto max-w-[980px] px-6 py-6">
        <PageHeader crumb={`Confirm new records / ${candidate.name}`} title={<>{candidate.name} <Chip tone="crit"><CircleDashed className="size-3" aria-hidden /> held</Chip></>} />
        <Section>
          <div className="font-mono text-[11px] text-muted-foreground">{candidate.from} · {candidate.uri}</div>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Nothing was extracted with confidence from this row. The candidate is held — it never surfaces anywhere until a person opens the source, fixes it manually, or rejects it with a reason.
          </p>
        </Section>
      </div>
    );
  }

  const isDup = candidate.kind === "duplicate";
  const canonical = products.find((p) => p.id === "maison-leandre");
  const canonicalByLabel: Record<string, string> = canonical
    ? { Name: canonical.name, Rooms: String(canonical.rooms ?? "—"), Commission: canonical.rate }
    : {};

  const confirmedAlready = candidate.id === "sereno" && s.candidateConfirmed;

  function confirmRecord() {
    d({ type: "confirmCandidate" });
    setBanner(
      "Confirmed with 2 fields still held (rate, description) — they stay in review, excluded. The rest is live at the agency layer — answerable in Ask, visible in Records."
    );
  }

  return (
    <div className="mx-auto max-w-[980px] px-6 py-6">
      <PageHeader
        crumb={`Confirm new records / ${candidate.name}`}
        title={<>{candidate.name} {isDup ? <Chip tone="warn">possible duplicate</Chip> : <Chip tone="primary">new candidate</Chip>}</>}
      />
      <div className="-mt-3 mb-4 font-mono text-[11px] text-muted-foreground">{candidate.from} · {candidate.uri}</div>

      <NarrationNote>
        Every extracted field arrives with what / where / when. The two held fields demonstrate the hold gate: a converted figure without its source currency, and boilerplate masquerading as content.
      </NarrationNote>

      {banner && <div className="mb-3"><ConfirmBanner show>{banner}</ConfirmBanner></div>}
      {confirmedAlready && !banner && (
        <div className="mb-3"><ConfirmBanner show>Confirmed by {people.lead} — live at the agency layer with 2 fields still held in review.</ConfirmBanner></div>
      )}

      {/* Identity check */}
      {isDup && candidate.match ? (
        <SeverityBanner severity="Important" className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div>
              <b>Possible match: {candidate.match.target}</b> · similarity <span className="tnum">{candidate.match.similarity}</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {candidate.match.signals.map(([k, v]) => (
                  <Chip key={k} tone="neutral" className="font-mono text-[10.5px]">{k} {v}</Chip>
                ))}
              </div>
            </div>
            <span className="ml-auto" />
            <Button variant="outline" size="sm" onClick={() => { setMergeOpen(true); setReason(""); }}>Merge…</Button>
          </div>
        </SeverityBanner>
      ) : (
        <SeverityBanner severity="Info" className="mb-4">
          Identity check — no canonical match (name, city, google_place_id all clear). This creates a new record.
        </SeverityBanner>
      )}

      {/* Fields */}
      <Section title="Extracted fields" chips={<Chip tone="neutral">value · source snippet · confidence</Chip>}>
        <ul className="divide-y divide-border">
          {candidate.fields.map((f) => {
            const held = "held" in f && f.held;
            const template = "template" in f && f.template;
            return (
              <li key={f.label} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-[13.5px]">
                <span className="w-24 shrink-0 text-[12px] text-muted-foreground">{f.label}</span>
                <div className="min-w-0">
                  {held ? <MoneyValue amount="" held /> : <span className="font-medium">{corrected[f.label] ?? f.value}</span>}
                  {!held && corrected[f.label] && <Chip tone="ok" className="ml-2">corrected · {people.lead}</Chip>}
                  {template && <Chip tone="warn" className="ml-2">template copy</Chip>}
                  <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{f.snippet}</div>
                  {held && <div className="mt-1 text-[11.5px] text-muted-foreground">A converted figure without its source currency is never committed — visible here, excluded from answers.</div>}
                  {template && <div className="mt-1 text-[11.5px] text-muted-foreground">Excluded from corroboration; queued for enrichment.</div>}
                </div>
                <span className="ml-auto" />
                <ConfidenceMeter agree={Math.round(f.confidence * 100)} total={100} label={`confidence ${f.confidence.toFixed(2)}`} />
                {!held && !template && (editField === f.label ? (
                  <form
                    className="flex items-center gap-1.5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editValue.trim()) setCorrected((m) => ({ ...m, [f.label]: editValue.trim() }));
                      setEditField(null);
                    }}
                  >
                    <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} aria-label={`Corrected value for ${f.label}`} className="h-7 w-40 text-[12.5px]" autoFocus />
                    <Button type="submit" variant="outline" size="sm">Save</Button>
                  </form>
                ) : (
                  <Button variant="ghost" size="sm" className="px-2" aria-label={`Fix ${f.label}`} onClick={() => { setEditField(f.label); setEditValue(corrected[f.label] ?? f.value); }}>
                    <Pencil className="size-3.5" aria-hidden />
                  </Button>
                ))}
                {!held && !template && editField !== f.label && (
                  fieldOk[f.label] || confirmedAlready ? (
                    <Chip tone="ok"><Check className="size-3" aria-hidden /> confirmed</Chip>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setFieldOk((m) => ({ ...m, [f.label]: true }))}>
                      <Check className="size-3.5" /> Confirm
                    </Button>
                  )
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Actions */}
      {!isDup && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button disabled={confirmedAlready} onClick={confirmRecord}>
            Confirm record (stamped: {people.lead}, today)
          </Button>
          <Button variant="outline" onClick={() => { setRejectOpen(true); setReason(""); }}>Reject… (reason logged)</Button>
        </div>
      )}

      {/* Reject sheet */}
      <Sheet open={rejectOpen} onOpenChange={setRejectOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Reject candidate</SheetTitle>
            <SheetDescription>{candidate.name} — the rejection is logged so the pipeline&apos;s misses stay reviewable.</SheetDescription>
          </SheetHeader>
          <div className="px-4 space-y-2">
            <Label htmlFor="reject-reason" className="text-[12.5px]">Reason (required)</Label>
            <Textarea id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Not a real property — a marketing row in the source sheet." className="text-[13px]" />
          </div>
          <SheetFooter>
            <Button variant="destructive" disabled={!reason.trim()} onClick={() => { setRejectOpen(false); setBanner(`Rejected — reason logged, attributed to ${people.lead}.`); }}>
              Reject candidate
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Merge sheet */}
      <Sheet open={mergeOpen} onOpenChange={setMergeOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Merge into canonical</SheetTitle>
            <SheetDescription>Field-by-field against {candidate.match?.target}. Nothing merges automatically.</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <ul className="divide-y divide-border text-[13px]">
              {candidate.fields.map((f) => (
                <li key={f.label} className="py-2">
                  <div className="text-[11.5px] text-muted-foreground">{f.label}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="min-w-0 flex-1">{canonicalByLabel[f.label] ?? "—"}</span>
                    <span className="text-muted-foreground" aria-hidden>⟷</span>
                    <span className="min-w-0 flex-1 text-right font-medium">{f.value}</span>
                  </div>
                  <div className="mt-0.5 flex justify-between font-mono text-[10.5px] text-muted-foreground">
                    <span>canonical</span><span>incoming</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-2">
              <Label htmlFor="merge-reason" className="text-[12.5px]">Merge reason (required)</Label>
              <Textarea id="merge-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Same property — the portal sync drops the accent." className="text-[13px]" />
              <p className="text-[12px] text-muted-foreground">Merge as overlay on canonical — nothing merges automatically; the choice is stored with its reason, attributed.</p>
            </div>
          </div>
          <SheetFooter>
            <Button disabled={!reason.trim()} onClick={() => { setMergeOpen(false); setBanner(`Merged as an overlay on ${candidate.match?.target} — reason stored, attributed to ${people.lead}.`); }}>
              Merge as overlay on canonical
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <p className="mt-4 text-[12px] text-muted-foreground">
        <Link href="/admin/review" className="hover:text-primary">← Back to the queue</Link>
      </p>
    </div>
  );
}
