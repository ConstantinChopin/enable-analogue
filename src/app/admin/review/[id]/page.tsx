"use client";
/**
 * Candidate detail — Journey D (docs/journeys/journey-d-ingestion-confirmation.md),
 * recomposed as a document. A candidate becomes truth only when a person confirms it
 * field by field; a held field has no confirm control; nothing merges automatically.
 *
 * Chapters, in order: the identity check (no match, said plainly; or a possible match,
 * a Warning whose Keep is "Keep both records") · Extracted fields (label · value · where
 * in the document it came from, with the reading in words beside the bar; a held row
 * carries its reason and no confirm control; template copy is marked and excluded) · for
 * the unreadable row, "Nothing read from this row".
 *
 * The rail (Review) counts what is ready, confirmed, held and template, and holds the one
 * act. UX sweep COL-05, FB-06, NAV-09 (2026-09-28):
 *   - "Confirm record" was live at "Confirmed 0 of 14", so the field-by-field rule could
 *     be skipped without saying so. The act now says what it does: "Confirm all 14
 *     fields" (every readable field, then the record), "Confirm the other 10" once some
 *     are checked, and "Confirm record" only when every field is confirmed or keyed.
 *   - After a decision the rail says what happened in place ("Confirmed · 10:14 ·
 *     M. Keller") and names the next candidate; a toast offers Undo for ten seconds. No
 *     green blocks.
 *   - Reject sits in the title row as a destructive act, away from the confirm, never
 *     under it and never the primary. Its sheet asks for the reason.
 * The decision is shared with the queue through ./review.ts, so the queue's count drops.
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
import { Page, PageHeader, ActionBar } from "@/components/layouts";
import {
  Chip, Section, ConfidenceMeter, SourceTag, Rows, Row, DataList, Done, Warning,
} from "@/components/bits";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  outcomeOf, outcomeLine, nextCandidate, decideCandidate, undoCandidate, isHeldField, isTemplate, fieldList,
} from "../review";

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

  if (!candidate) {
    return (
      <Page width="wide">
        <PageHeader title="No candidate at this address" />
        <Section>
          <p className="type-data text-label-secondary">Nothing is waiting for confirmation here.</p>
          <Button asChild variant="link" size="sm" className="mt-[var(--space-3)]">
            <Link href="/admin/review">Back to Confirm records</Link>
          </Button>
        </Section>
      </Page>
    );
  }

  const isHeld = candidate.kind === "held";
  const raw = "raw" in candidate ? candidate.raw : undefined;
  const isDup = candidate.kind === "duplicate";
  const canonical = products.find((p) => p.id === "maison-leandre");
  const canonicalByLabel: Record<string, string> = canonical
    ? { Name: canonical.name, Rooms: String(canonical.rooms ?? "—"), Commission: canonical.rate }
    : {};

  const outcome = outcomeOf(s, candidate.id);
  const confirmedAlready = outcome?.what === "Confirmed";
  const next = nextCandidate(s, candidate.id);
  const kind = sourceKind(candidate.uri);

  /* A field a person has keyed is no longer held, so it stops being counted as one. */
  const readyFields = candidate.fields.filter((f) => (!isHeldField(f) && !isTemplate(f)) || corrected[f.label]);
  const confirmedCount = confirmedAlready
    ? readyFields.length
    : readyFields.filter((f) => fieldOk[f.label]).length;
  const remaining = readyFields.length - confirmedCount;
  const heldLeft = candidate.fields.filter((f) => isHeldField(f) && !corrected[f.label]);
  const templateLeft = candidate.fields.filter((f) => isTemplate(f) && !corrected[f.label]);
  const staysHeld = [...heldLeft, ...templateLeft].map((f) => f.label);

  const decide = (what: string, message: string, detail?: string) => {
    decideCandidate(d, candidate.id, what);
    notify(message, { detail, undo: () => undoCandidate(d, candidate.id), seconds: 10 });
  };

  function confirmRecord() {
    setFieldOk(Object.fromEntries(readyFields.map((f) => [f.label, true])));
    decide(
      "Confirmed",
      `${candidate!.name} confirmed`,
      staysHeld.length ? `${fieldList(staysHeld)} stay held` : "Every field is live",
    );
  }

  const confirmLabel = remaining === 0
    ? "Confirm record"
    : remaining === readyFields.length
      ? `Confirm all ${readyFields.length} fields`
      : `Confirm the other ${remaining}`;

  /* The one act, by kind; absent once decided. Repeated in the ActionBar under 1024. */
  const primary = outcome ? null : isHeld ? (
    <Button className="w-full" onClick={() => { setEditField("Name"); setEditValue(corrected.Name ?? ""); }}>
      {corrected.Name ? "Key the name again" : "Key the name by hand"}
    </Button>
  ) : isDup ? (
    <Button className="w-full" onClick={() => { setMergeOpen(true); setReason(""); }}>
      Merge into {candidate.match?.target}…
    </Button>
  ) : (
    <Button className="w-full" onClick={confirmRecord}>{confirmLabel}</Button>
  );

  return (
    <Page width="wide">
      <PageHeader
        title={candidate.name}
        actions={!outcome ? (
          <Button variant="destructive" size="sm" onClick={() => { setRejectOpen(true); setReason(""); }}>
            Reject…
          </Button>
        ) : undefined}
      >
        <p className="mt-[var(--space-2)] flex flex-wrap items-center gap-x-[var(--space-2)] gap-y-1 type-meta">
          {isDup ? <Chip tone="warn">possible duplicate</Chip> : <Chip tone="neutral">{isHeld ? "nothing read" : "new record"}</Chip>}
          <span>{candidate.from} · <span className="tnum">{candidate.uri}</span></span>
        </p>
      </PageHeader>

      <div className="doc-layout">
        {/* ── the body: chapters at column width ── */}
        <div className="min-w-0">
          {/* Identity check: first, because it decides whether anything below creates a
              record or overlays one. */}
          {!isHeld && (isDup || !outcome) && (
            <div className="pb-[var(--gap-2)]">
              {isDup && candidate.match ? (
                <Warning
                  title={`Possible match: ${candidate.match.target}`}
                  kept={outcome?.what === "Kept as a separate record" ? outcomeLine(outcome) : undefined}
                  actions={!outcome ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => decide("Kept as a separate record", "Kept as a separate record", `${candidate.name} and ${candidate.match?.target} both stand`)}
                    >
                      Keep both records
                    </Button>
                  ) : undefined}
                >
                  The name is {Math.round(candidate.match.similarity * 100)}% alike, the city is the same,
                  and there is no place ID to compare. Merge it field by field, or keep both.
                </Warning>
              ) : !outcome ? (
                <p className="type-data text-label-secondary">
                  No existing record matches it by name, city or place ID, so confirming creates a new record.
                </p>
              ) : null}
            </div>
          )}

          {/* Nothing read: the row is all there is to show. */}
          {isHeld && (
            <Section title="Nothing read from this row">
              <p className="max-w-[62ch] type-data text-label-secondary">
                It stays out of answers and search until you key the name by hand, or reject it.
              </p>
              <DataList
                className="mt-[var(--space-3)]"
                rows={[
                  { label: "Where", value: <SourceTag kind={kind} label={raw?.where ?? ""} /> },
                  { label: "What is wrong", value: <span className="type-data">{raw?.note}</span> },
                  {
                    label: "Name",
                    value: corrected.Name ? (
                      <span className="inline-flex flex-wrap items-center justify-end gap-[var(--space-2)]">
                        <span className="type-data-strong">{corrected.Name}</span>
                        <Chip tone="neutral">keyed · {people.owner}</Chip>
                      </span>
                    ) : undefined,
                    absent: "pending",
                  },
                ]}
              />
              <Button variant="secondary" size="sm" className="mt-[var(--space-3)]" onClick={() => setSourceOpen(true)}>
                Show the source row
              </Button>
            </Section>
          )}

          {/* The fields, in the order the sheet holds them. */}
          {!isHeld && (
            <Section title="Extracted fields">
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
                          <>
                            <Chip tone="neutral">held</Chip>
                            <span className="type-data text-label-secondary">{f.value}</span>
                          </>
                        ) : (
                          <span className={cn("type-data-strong", template && !fixed && "italic text-label-secondary")}>
                            {fixed ?? f.value}
                          </span>
                        )}
                        {/* A supplied value is marked as keyed, not as extracted: the two are
                            not the same evidence and the record must tell them apart. */}
                        {fixed && <Chip tone="neutral">{held ? "keyed" : "corrected"} · {people.owner}</Chip>}
                        {template && !fixed && <Chip tone="neutral">template copy</Chip>}
                        {confirmed && <Chip tone="neutral">confirmed</Chip>}
                      </div>

                      {held && !fixed && "heldReason" in f && f.heldReason && (
                        <p className="mt-1 type-meta">{String(f.heldReason)}</p>
                      )}
                      {template && !fixed && (
                        <p className="mt-1 type-meta">Portal boilerplate, so it is left out of answers.</p>
                      )}

                      {/* The row's controls. A held row has no confirm control at all: it
                          offers only the way to supply what is missing. */}
                      {!outcome && (
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
                                  agency's partner programmes or it is not a programme. */}
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
                              <Button type="button" variant="tertiary" size="sm" onClick={() => setEditField(null)}>Cancel</Button>
                            </form>
                          ) : (
                            <>
                              {confirmable && !confirmed && (
                                <Button variant="secondary" size="sm" onClick={() => setFieldOk((m) => ({ ...m, [f.label]: true }))}>
                                  Confirm
                                </Button>
                              )}
                              {held && !fixed ? (
                                /* A held row starts empty: prefilling it would seed the box
                                   with the hold's own description as though it were a draft. */
                                <Button variant="secondary" size="sm" onClick={() => { setEditField(f.label); setEditValue(""); }}>
                                  Enter value
                                </Button>
                              ) : (
                                <Button
                                  variant="tertiary"
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
                      )}
                    </FieldLine>
                  );
                })}
              </div>
            </Section>
          )}
        </div>

        {/* ── the tool that follows: what is settled, what is not, and the one act ── */}
        <aside className="doc-rail" data-rail-label="Review">
          <Section variant="tool" follows title="Review">
            <Rows>
              {isHeld ? (
                <Row>
                  <span className="row-primary">Fields read</span>
                  <span className="row-trailing tnum">0</span>
                </Row>
              ) : (
                <>
                  <Row>
                    <span className="row-primary">Confirmed</span>
                    <span className="row-trailing tnum">{confirmedCount} of {readyFields.length}</span>
                  </Row>
                  {heldLeft.length > 0 && (
                    <Row>
                      <span className="row-primary">Held</span>
                      <span className="row-trailing tnum">{heldLeft.length}</span>
                    </Row>
                  )}
                  {templateLeft.length > 0 && (
                    <Row>
                      <span className="row-primary">Template copy</span>
                      <span className="row-trailing tnum">{templateLeft.length}</span>
                    </Row>
                  )}
                </>
              )}
            </Rows>

            <div className="mt-[var(--space-4)] space-y-[var(--space-2)]">
              {outcome ? (
                <>
                  <Done>{outcomeLine(outcome)}</Done>
                  {confirmedAlready && staysHeld.length > 0 && (
                    <p className="type-meta">{fieldList(staysHeld)} stay held and out of answers.</p>
                  )}
                  <Button asChild variant="link" size="sm">
                    {next
                      ? <Link href={`/admin/review/${next.id}`}>Next: {next.name}</Link>
                      : <Link href="/admin/review">Back to Confirm records</Link>}
                  </Button>
                </>
              ) : isHeld && editField === "Name" ? (
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
                  <div className="flex items-center justify-end gap-[var(--space-2)]">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setEditField(null)}>Cancel</Button>
                    <Button type="submit" variant="secondary" size="sm">Save</Button>
                  </div>
                </form>
              ) : (
                <>
                  {primary}
                  <p className="text-center type-meta">
                    {isHeld
                      ? "The source row stays as it arrived; what you key is marked as yours."
                      : isDup
                        ? "Field by field, with a reason."
                        : staysHeld.length
                          ? `${fieldList(staysHeld)} stay held and out of answers.`
                          : "Every field goes live for the agency."}
                  </p>
                </>
              )}
            </div>
          </Section>
        </aside>
      </div>

      {primary && !(isHeld && editField === "Name") && <ActionBar>{primary}</ActionBar>}

      {/* The source row, exactly as it arrived */}
      <Sheet open={sourceOpen} onOpenChange={setSourceOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Source row</SheetTitle>
            <SheetDescription>{candidate.from} · {candidate.uri}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <div className="type-meta tnum text-label-secondary">{raw?.where}</div>
            <pre className="overflow-x-auto rounded-lg bg-sunken p-[var(--space-4)] type-meta tnum text-inherit">{raw?.text}</pre>
            <p className="type-data text-label-secondary">{raw?.note}</p>
            <p className="type-meta">The sheet itself is not changed. What you key is kept on the candidate, with your name.</p>
          </SheetBody>
          <SheetFooter className="sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setSourceOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Reject: the rejection carries its reason */}
      <Sheet open={rejectOpen} onOpenChange={setRejectOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Reject {candidate.name}</SheetTitle>
            <SheetDescription>It leaves the queue and does not become a record. Your reason is kept with it.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <div>
              <Label htmlFor="reject-reason">Reason <span className="text-label-secondary">(required)</span></Label>
              <Textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Not a real property: a marketing row in the source sheet."
                className="mt-[var(--space-2)]"
              />
            </div>
          </SheetBody>
          <SheetFooter className="sm:flex-row sm:justify-end">
            <SheetClose asChild><Button variant="secondary">Cancel</Button></SheetClose>
            <Button
              variant="destructive"
              disabled={!reason.trim()}
              onClick={() => {
                setRejectOpen(false);
                decide(`Rejected: ${reason.trim()}`, `${candidate.name} rejected`, reason.trim());
              }}
            >
              Reject candidate
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Merge: field by field, and a reason */}
      <Sheet open={mergeOpen} onOpenChange={setMergeOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Merge into {candidate.match?.target}</SheetTitle>
            <SheetDescription>
              The incoming values are laid over the existing record; the record&rsquo;s own values stay readable underneath.
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
                  <div className="mt-1 flex justify-between type-meta text-label-tertiary">
                    <span>existing</span>
                    <span>incoming</span>
                  </div>
                </li>
              ))}
            </Rows>
            <div className="border-t border-hairline pt-[var(--space-4)]">
              <Label htmlFor="merge-reason">Reason <span className="text-label-secondary">(required)</span></Label>
              <Textarea
                id="merge-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Same property: the portal sync drops the accent."
                className="mt-[var(--space-2)]"
              />
            </div>
          </SheetBody>
          <SheetFooter className="sm:flex-row sm:justify-end">
            <SheetClose asChild><Button variant="secondary">Cancel</Button></SheetClose>
            <Button
              disabled={!reason.trim()}
              onClick={() => {
                setMergeOpen(false);
                decide(`Merged into ${candidate.match?.target}: ${reason.trim()}`, `Merged into ${candidate.match?.target}`, reason.trim());
              }}
            >
              Merge into {candidate.match?.target}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Page>
  );
}
