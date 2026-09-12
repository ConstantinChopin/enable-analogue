"use client";
/**
 * Candidate detail — Journey D (docs/journeys/journey-d-ingestion-confirmation.md),
 * recomposed as a document. A candidate becomes truth only when a human confirms it
 * field by field; a held field has no confirm control; nothing merges automatically.
 *
 * Chapters, in order: the identity check (a banner: no match, or a possible match with
 * its signals) · Extracted fields (label · value · where in the document it came from,
 * with the reading in words beside the bar; a held row carries its reason and NO
 * confirm control; template copy is marked and excluded) · for the unreadable row,
 * "Nothing extracted from this row".
 *
 * The one primary lives at the bottom of the tool that follows (Review), which counts
 * what is ready, held and template: "Confirm record — stamped M. Keller, today" on a
 * new candidate (demo J3, key 8); "Review the match" on a possible duplicate (opens the
 * merge sheet, which requires a reason); "Key the name by hand" on the unreadable row.
 * Secondary: Confirm / Enter value on a row, Create new record under the match banner,
 * Show the source row. Text: Fix on a row, Reject — reason logged. Sheets (source,
 * reject, merge) carry their own commit, as the record's sheets do.
 *
 * Local components: FieldLine (label · body · provenance on the shared .field-row
 * track), readingWords (the bar's label in words, so "confidence" never appears).
 */
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";
import { candidates, products, people, filterOptions } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import {
  Chip, Section, NarrationNote, ConfirmBanner, ConfidenceMeter, SeverityBanner,
  SourceTag, Rows, Row, DataList,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* Which extracted fields are ENTITIES, and what they may be.
   Anything absent from this table is genuinely free text — a rate, a description, an
   address — and keeps its input box. */
function entityOptions(label: string): string[] | null {
  const key = label.toLowerCase();
  if (key.startsWith("programme")) return filterOptions.programme;
  if (key.startsWith("consorti")) return filterOptions.consortia;
  if (key.startsWith("tier")) return filterOptions.luxuryTier;
  if (key.startsWith("categor")) return filterOptions.category;
  if (key.startsWith("status")) return filterOptions.status;
  if (key.startsWith("region")) return filterOptions.region as string[];
  return null;
}

/* The bar's label, in words. The two-decimal probability was model internals wearing
   a UI; the word "confidence" beside a bar is a number pretending to be a reason. */
function readingWords(c: number) {
  if (c >= 0.9) return "read cleanly";
  if (c >= 0.75) return "read, small doubt";
  if (c >= 0.5) return "read with doubt";
  return "barely read";
}

function sourceKind(uri: string): "gdrive" | "portal" | "intranet" {
  if (uri.startsWith("gdrive://")) return "gdrive";
  if (uri.startsWith("portal://")) return "portal";
  return "intranet";
}

/* ── the field row's shape: label · value · provenance on one shared track ── */
function FieldLine({
  label, provenance, children,
}: { label: string; provenance?: ReactNode; children: ReactNode }) {
  return (
    <div className="field-row">
      <div className="type-data text-label-secondary">{label}</div>
      <div className="min-w-0">{children}</div>
      {provenance && (
        <div className="flex max-w-[30ch] flex-col items-start gap-1 sm:items-end sm:text-right">
          {provenance}
        </div>
      )}
    </div>
  );
}

/* ── the sheet body: 24 inside ── */
function SheetBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("min-h-0 flex-1 space-y-[var(--space-4)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]", className)}>{children}</div>;
}

export default function CandidateDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { s, d } = useDemo();
  const candidate = candidates.find((c) => c.id === id);

  const [fieldOk, setFieldOk] = useState<Record<string, boolean>>({});
  /* Per-field correction — an inline fix, attributed to the reviewer. */
  const [corrected, setCorrected] = useState<Record<string, string>>({});
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [banner, setBanner] = useState<string | null>(null);

  if (!candidate) {
    return (
      <Page width="wide">
        <PageHeader title="No candidate at this address" />
        <Section>
          <p className="type-data-read text-label-secondary">Nothing is waiting for confirmation here.</p>
          <Button asChild variant="link" size="sm" className="mt-[var(--space-3)]">
            <Link href="/admin/review">Open the queue</Link>
          </Button>
        </Section>
      </Page>
    );
  }

  /* A candidate whose source row could not be read — held, and visibly so. The three
     acts the copy names (open the source, fix it by hand, reject it with a reason)
     are rendered as controls rather than described. */
  const isHeld = candidate.kind === "held";
  const raw = "raw" in candidate ? candidate.raw : undefined;
  const isDup = candidate.kind === "duplicate";
  const canonical = products.find((p) => p.id === "maison-leandre");
  const canonicalByLabel: Record<string, string> = canonical
    ? { Name: canonical.name, Rooms: String(canonical.rooms ?? "—"), Commission: canonical.rate }
    : {};

  const confirmedAlready = candidate.id === "sereno" && s.candidateConfirmed;
  const kind = sourceKind(candidate.uri);

  const isHeldField = (f: (typeof candidate.fields)[number]) => "held" in f && !!f.held;
  const isTemplate = (f: (typeof candidate.fields)[number]) => "template" in f && !!f.template;

  /* A field a person has keyed is no longer held, so it stops being counted as one. */
  const heldCount = candidate.fields.filter((f) => (isHeldField(f) || isTemplate(f)) && !corrected[f.label]).length;
  const readyFields = candidate.fields.filter((f) => (!isHeldField(f) && !isTemplate(f)) || corrected[f.label]);
  const confirmedCount = confirmedAlready
    ? readyFields.length
    : readyFields.filter((f) => fieldOk[f.label]).length;
  const heldOnly = candidate.fields.filter((f) => isHeldField(f) && !corrected[f.label]).length;
  const templateOnly = candidate.fields.filter((f) => isTemplate(f) && !corrected[f.label]).length;

  function confirmRecord() {
    d({ type: "confirmCandidate" });
    setBanner(
      heldCount === 0
        ? "Confirmed. Every field is either extracted and checked or keyed by hand, and the record is live at the agency layer: answerable in Ask, visible in Records."
        : `Confirmed with ${heldCount} ${heldCount === 1 ? "field" : "fields"} still held — they stay in review, excluded from answers. The rest is live at the agency layer: answerable in Ask, visible in Records.`,
    );
  }

  const kindChip = isHeld
    ? <Chip tone="crit">held</Chip>
    : isDup
      ? <Chip tone="warn">possible duplicate</Chip>
      : <Chip tone="primary">new candidate</Chip>;

  const reject = (
    <Button variant="link" size="sm" onClick={() => { setRejectOpen(true); setReason(""); }}>
      Reject — reason logged
    </Button>
  );

  return (
    <Page width="wide">
      <PageHeader title={<>{candidate.name} {kindChip}</>}>
        <p className="mt-[var(--space-2)] type-meta">
          {candidate.from} · <span className="type-code">{candidate.uri}</span>
        </p>
      </PageHeader>

      <div className="doc-layout">
        {/* ── the body: chapters at column width ── */}
        <div className="min-w-0">
          {!isHeld && (
            <NarrationNote>
              Every extracted field arrives with what, where and when. The held fields demonstrate
              the hold gate: a converted figure without its source currency, a rate with no
              programme, an empty cell — and boilerplate masquerading as content.
            </NarrationNote>
          )}

          <div className="space-y-[var(--space-2)] pb-[var(--gap-2)] empty:hidden">
            {banner && <ConfirmBanner show>{banner}</ConfirmBanner>}
            {confirmedAlready && !banner && (
              <ConfirmBanner show>
                Confirmed by {people.owner} — live at the agency layer with{" "}
                <span className="tnum">{heldCount}</span> fields still held in review.
              </ConfirmBanner>
            )}

            {/* Identity check — first, because it decides whether anything below creates
                a record or overlays one. */}
            {isHeld ? null : isDup && candidate.match ? (
              <SeverityBanner severity="Important">
                <div className="type-data-strong">
                  Possible match: {candidate.match.target} · match signal{" "}
                  <span className="tnum">{candidate.match.similarity}</span>
                </div>
                <div className="mt-[var(--space-2)] flex flex-wrap gap-[var(--space-2)]">
                  {candidate.match.signals.map(([k, v]) => (
                    <Chip key={k} tone="neutral" className="font-mono">{k} {v}</Chip>
                  ))}
                </div>
                <p className="mt-[var(--space-2)] type-meta">
                  The decision is merge into the existing record, or create a new one. Creating
                  a new record keeps both: the match stays logged against them, so the duplicate
                  comes back for a later human pass rather than disappearing.
                </p>
                {/* The other half of the choice, under the content it extends. */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-[var(--space-3)]"
                  onClick={() =>
                    setBanner(`Created as a separate record — both stand, attributed to ${people.owner}. The match signal is logged against them.`)
                  }
                >
                  Create new record
                </Button>
              </SeverityBanner>
            ) : (
              <SeverityBanner severity="Info">
                Identity check — no canonical match. Name, city and place-id are all clear, so
                this creates a new record.
              </SeverityBanner>
            )}
          </div>

          {/* Nothing extracted — the row is all there is to show. */}
          {isHeld && (
            <Section title="Nothing extracted from this row">
              <p className="max-w-[62ch] type-data-read text-label-secondary">
                Nothing was extracted with confidence from this row. The candidate is held — it
                never surfaces anywhere until a person opens the source, fixes it by hand, or
                rejects it with a reason.
              </p>
              <DataList
                className="mt-[var(--space-3)]"
                rows={[
                  { label: "Where", value: <SourceTag kind={kind} label={raw?.where ?? ""} /> },
                  { label: "Why it is held", value: <span className="type-data-read">{raw?.note}</span> },
                  {
                    label: "Name",
                    value: corrected.Name ? (
                      <span className="inline-flex flex-wrap items-center justify-end gap-[var(--space-2)]">
                        <span className="type-data-strong">{corrected.Name}</span>
                        <Chip tone="ok">keyed · {people.owner}</Chip>
                      </span>
                    ) : undefined,
                    absent: "pending",
                  },
                ]}
              />
              {corrected.Name && (
                <p className="mt-[var(--space-2)] type-meta">
                  Keyed by hand, attributed. The source row is unchanged, and the candidate stays
                  held until the rest of it can be read.
                </p>
              )}
              {/* Preview → grey button → sheet: the row itself opens beside the page. */}
              <Button variant="secondary" size="sm" className="mt-[var(--space-3)]" onClick={() => setSourceOpen(true)}>
                Show the source row
              </Button>
            </Section>
          )}

          {/* The fields, in the order the sheet holds them. */}
          {!isHeld && (
            <Section title="Extracted fields" chips={<Chip tone="neutral"><span className="tnum">{candidate.fields.length}</span> fields</Chip>}>
              <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data-read text-label-secondary">
                Each value, and where in the document it came from. A held field is shown with its
                reason and cannot be confirmed; a keyed value is carried as a manual entry, not an
                extraction.
              </p>
              <div className="divide-y divide-hairline">
                {candidate.fields.map((f) => {
                  const held = isHeldField(f);
                  const template = isTemplate(f);
                  const fixed = corrected[f.label];
                  const editing = editField === f.label;
                  const confirmable = (!held && !template) || !!fixed;
                  const confirmed = confirmable && (fieldOk[f.label] || confirmedAlready);
                  const options = entityOptions(f.label);

                  return (
                    <FieldLine
                      key={f.label}
                      label={f.label}
                      provenance={
                        <>
                          <SourceTag kind={kind} label={f.snippet} />
                          <ConfidenceMeter
                            agree={Math.round(f.confidence * 100)}
                            total={100}
                            label={readingWords(f.confidence)}
                          />
                        </>
                      }
                    >
                      <div className="flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-1">
                        {held && !fixed ? (
                          /* Each hold has its own reason; the value is the hold itself. */
                          <Chip tone="crit">{f.value}</Chip>
                        ) : (
                          <span className={cn("type-data-strong", template && !fixed && "italic text-label-secondary")}>
                            {fixed ?? f.value}
                          </span>
                        )}
                        {/* A supplied value is marked as keyed, not as extracted: the two are
                            not the same evidence and the record must tell them apart. */}
                        {fixed && <Chip tone={held ? "primary" : "ok"}>{held ? "keyed" : "corrected"} · {people.owner}</Chip>}
                        {template && !fixed && <Chip tone="warn">template copy</Chip>}
                        {confirmed && <Chip tone="ok">confirmed</Chip>}
                      </div>

                      {held && !fixed && (
                        <p className="mt-1 type-meta">
                          {"heldReason" in f && f.heldReason
                            ? String(f.heldReason)
                            : "Held here, and excluded from answers, until a person supplies what is missing."}
                        </p>
                      )}
                      {held && fixed && (
                        <p className="mt-1 type-meta">
                          Hold cleared. Keyed by {people.owner} today, and carried as a manual entry
                          rather than as an extraction.
                        </p>
                      )}
                      {template && !fixed && (
                        <p className="mt-1 type-meta">Excluded from corroboration; queued for enrichment.</p>
                      )}

                      {/* The row's controls. A held row has no confirm control at all: it
                          offers only the way to supply what is missing. */}
                      <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-[var(--space-2)] empty:hidden">
                        {editing ? (
                          <form
                            className="flex flex-wrap items-center gap-[var(--space-2)]"
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (editValue.trim()) setCorrected((m) => ({ ...m, [f.label]: editValue.trim() }));
                              setEditField(null);
                            }}
                          >
                            {/* Some fields are ENTITIES, not text: a programme is one of the
                                agency's partner programmes or it is not a programme. Typed
                                fields get a list; the rest get a box. */}
                            {options ? (
                              <Select
                                value={editValue}
                                onValueChange={(v) => {
                                  setCorrected((m) => ({ ...m, [f.label]: v }));
                                  setEditField(null);
                                }}
                              >
                                <SelectTrigger size="sm" className="w-44" aria-label={`${f.label} value`}>
                                  <SelectValue placeholder={`Choose ${f.label.toLowerCase()}…`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                size="sm"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                aria-label={`Corrected value for ${f.label}`}
                                className="w-48"
                                autoFocus
                              />
                            )}
                            {!options && <Button type="submit" variant="secondary" size="sm">Save</Button>}
                            <Button type="button" variant="link" size="sm" onClick={() => setEditField(null)}>Cancel</Button>
                          </form>
                        ) : (
                          <>
                            {confirmable && !confirmed && (
                              <Button variant="secondary" size="sm" onClick={() => setFieldOk((m) => ({ ...m, [f.label]: true }))}>
                                Confirm
                              </Button>
                            )}
                            {held && !fixed ? (
                              /* A held row starts empty. Prefilling it with `f.value` would seed
                                 the box with the hold's own reason as though it were a draft. */
                              <Button variant="secondary" size="sm" onClick={() => { setEditField(f.label); setEditValue(""); }}>
                                Enter value
                              </Button>
                            ) : (
                              <Button
                                variant="link"
                                size="sm"
                                aria-label={`Fix ${f.label}`}
                                onClick={() => { setEditField(f.label); setEditValue(fixed ?? f.value); }}
                              >
                                Fix
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </FieldLine>
                  );
                })}
              </div>
            </Section>
          )}
        </div>

        {/* ── the tool that follows: what is settled, what is not, and the one action ── */}
        <aside className="doc-rail" data-rail-label="Review">
          <Section variant="tool" follows title="Review">
            <Rows>
              {isHeld ? (
                <>
                  <Row>
                    <span className="row-primary">Extracted</span>
                    <span className="row-trailing tnum">0</span>
                  </Row>
                  <Row>
                    <span className="row-primary">Candidate</span>
                    <span className="row-trailing"><Chip tone="crit">held</Chip></span>
                  </Row>
                  {corrected.Name && (
                    <Row>
                      <span className="row-primary">Name</span>
                      <span className="row-trailing"><Chip tone="ok">keyed</Chip></span>
                    </Row>
                  )}
                </>
              ) : (
                <>
                  {isDup && candidate.match && (
                    <Row>
                      <span className="row-primary">Possible match</span>
                      <span className="row-trailing"><Chip tone="warn">{candidate.match.target}</Chip></span>
                    </Row>
                  )}
                  <Row>
                    <span className="row-primary">Ready to confirm</span>
                    <span className="row-trailing tnum">{readyFields.length}</span>
                  </Row>
                  <Row>
                    <span className="row-primary">Confirmed</span>
                    <span className="row-trailing">
                      {confirmedCount > 0
                        ? <Chip tone="ok" className="tnum">{confirmedCount} of {readyFields.length}</Chip>
                        : <span className="tnum text-label-secondary">0 of {readyFields.length}</span>}
                    </span>
                  </Row>
                  {heldOnly > 0 && (
                    <Row>
                      <span className="row-primary">Held</span>
                      <span className="row-trailing"><Chip tone="crit" className="tnum">{heldOnly}</Chip></span>
                    </Row>
                  )}
                  {templateOnly > 0 && (
                    <Row>
                      <span className="row-primary">Template copy</span>
                      <span className="row-trailing"><Chip tone="warn" className="tnum">{templateOnly}</Chip></span>
                    </Row>
                  )}
                </>
              )}
            </Rows>

            <div className="mt-[var(--space-4)]">
              {isHeld ? (
                editField === "Name" ? (
                  <form
                    className="space-y-[var(--space-2)]"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editValue.trim()) setCorrected((m) => ({ ...m, Name: editValue.trim() }));
                      setEditField(null);
                    }}
                  >
                    <Label htmlFor="keyed-name">Name, keyed by hand</Label>
                    <Input
                      id="keyed-name"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="What the row should have said"
                      autoFocus
                    />
                    <div className="flex items-center gap-[var(--space-2)]">
                      <Button type="submit" variant="secondary" size="sm">Save</Button>
                      <Button type="button" variant="link" size="sm" onClick={() => setEditField(null)}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <Button className="w-full" onClick={() => { setEditField("Name"); setEditValue(corrected.Name ?? ""); }}>
                    {corrected.Name ? "Key the name again" : "Key the name by hand"}
                  </Button>
                )
              ) : isDup ? (
                <Button className="w-full" onClick={() => { setMergeOpen(true); setReason(""); }}>
                  Review the match
                </Button>
              ) : (
                <Button className="w-full" disabled={confirmedAlready} onClick={confirmRecord}>
                  Confirm record — stamped {people.owner}, today
                </Button>
              )}
              <p className="mt-[var(--space-2)] text-center type-meta">
                {isHeld
                  ? "The row stays as it arrived; what you key is attributed to you."
                  : isDup
                    ? "Field by field, with a reason. Nothing merges automatically."
                    : "Live at the agency layer; held fields stay in review."}
              </p>
              <div className="mt-[var(--space-3)] flex justify-center">{reject}</div>
            </div>
          </Section>
        </aside>
      </div>

      {/* Open source — the row exactly as it arrived */}
      <Sheet open={sourceOpen} onOpenChange={setSourceOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Source row</SheetTitle>
            <SheetDescription>{candidate.from} · {candidate.uri}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <div className="type-code text-label-secondary">{raw?.where}</div>
            <pre className="overflow-x-auto rounded-lg bg-sunken p-[var(--space-4)] type-code">{raw?.text}</pre>
            <p className="type-data-read text-label-secondary">{raw?.note}</p>
            <p className="type-meta">
              The source is read-only here. Ground truth stays in the sheet: a correction is keyed
              against the candidate and attributed, and the row is left as it is.
            </p>
          </SheetBody>
          <SheetFooter className="sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setSourceOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Reject sheet — the rejection carries its reason */}
      <Sheet open={rejectOpen} onOpenChange={setRejectOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Reject candidate</SheetTitle>
            <SheetDescription>
              {candidate.name} — the rejection is logged, so the pipeline&rsquo;s misses stay reviewable.
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            <div>
              <Label htmlFor="reject-reason">Reason <span className="text-label-secondary">(required)</span></Label>
              <Textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Not a real property — a marketing row in the source sheet."
                className="mt-[var(--space-2)]"
              />
            </div>
          </SheetBody>
          <SheetFooter className="sm:flex-row sm:justify-end">
            <Button
              variant="destructive"
              disabled={!reason.trim()}
              onClick={() => {
                setRejectOpen(false);
                setBanner(`Rejected — reason logged, attributed to ${people.owner}.`);
              }}
            >
              Reject candidate
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Merge sheet — field by field, and a reason */}
      <Sheet open={mergeOpen} onOpenChange={setMergeOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Merge into canonical</SheetTitle>
            <SheetDescription>
              Field by field against {candidate.match?.target}. Nothing merges automatically.
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            <Rows>
              {candidate.fields.map((f) => (
                <li key={f.label} className="py-[var(--space-3)]">
                  <div className="type-meta">{f.label}</div>
                  <div className="mt-1 flex items-center gap-[var(--space-2)] type-data">
                    <span className="min-w-0 flex-1 truncate">{canonicalByLabel[f.label] ?? "—"}</span>
                    <span className="text-label-tertiary" aria-hidden>⟷</span>
                    <span className="min-w-0 flex-1 truncate text-right type-data-strong">{f.value}</span>
                  </div>
                  <div className="mt-1 flex justify-between type-micro-caps text-label-tertiary">
                    <span>canonical</span>
                    <span>incoming</span>
                  </div>
                </li>
              ))}
            </Rows>
            <div className="border-t border-hairline pt-[var(--space-4)]">
              <Label htmlFor="merge-reason">Merge reason <span className="text-label-secondary">(required)</span></Label>
              <Textarea
                id="merge-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Same property — the portal sync drops the accent."
                className="mt-[var(--space-2)]"
              />
              <p className="mt-[var(--space-2)] type-meta">
                The choice is stored with its reason, attributed to {people.owner}.
              </p>
            </div>
          </SheetBody>
          <SheetFooter className="sm:flex-row sm:justify-end">
            <Button
              disabled={!reason.trim()}
              onClick={() => {
                setMergeOpen(false);
                setBanner(`Merged as an overlay on ${candidate.match?.target} — reason stored, attributed to ${people.owner}.`);
              }}
            >
              Merge as overlay on canonical
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Page>
  );
}
