"use client";
/**
 * Candidate detail — the Document archetype (§7). Per-field confirmation with the
 * source snippet and its confidence; a merge sheet for a possible duplicate; a
 * rejection that carries its reason. Nothing merges or commits automatically.
 */
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDemo } from "@/lib/store";
import { candidates, products, people } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import {
  Chip, Section, NarrationNote, ConfirmBanner, ConfidenceMeter, MoneyValue, SeverityBanner,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Check, CircleDashed, CopyPlus, FileSearch, Pencil } from "lucide-react";

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
          <p className="type-data text-muted-foreground">
            Nothing is waiting for confirmation here.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/admin/review">
              Back to the queue <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </Section>
      </Page>
    );
  }

  /* A candidate whose source row could not be read — held, and visibly so. The three
     acts the sentence names (open the source, fix it by hand, reject it with a reason)
     are rendered as controls rather than described. */
  const isHeld = candidate.kind === "held";
  const raw = "raw" in candidate ? candidate.raw : undefined;
  const isDup = candidate.kind === "duplicate";
  const canonical = products.find((p) => p.id === "maison-leandre");
  const canonicalByLabel: Record<string, string> = canonical
    ? { Name: canonical.name, Rooms: String(canonical.rooms ?? "—"), Commission: canonical.rate }
    : {};

  const confirmedAlready = candidate.id === "sereno" && s.candidateConfirmed;
  const heldCount = candidate.fields.filter(
    (f) => ("held" in f && f.held) || ("template" in f && f.template),
  ).length;

  function confirmRecord() {
    d({ type: "confirmCandidate" });
    setBanner(
      `Confirmed with ${heldCount} fields still held (rate, description) — they stay in review, excluded from answers. The rest is live at the agency layer: answerable in Ask, visible in Records.`,
    );
  }

  return (
    <Page width="wide">
      <PageHeader
        title={
          <>
            {candidate.name}
            {isHeld ? (
              <Chip tone="crit">
                <CircleDashed className="size-3" aria-hidden /> held
              </Chip>
            ) : isDup ? (
              <Chip tone="warn">possible duplicate</Chip>
            ) : (
              <Chip tone="primary">new candidate</Chip>
            )}
          </>
        }
      >
        <p className="mt-2 type-code text-muted-foreground">
          {candidate.from} · {candidate.uri}
        </p>
      </PageHeader>

      {!isHeld && (
        <NarrationNote>
          Every extracted field arrives with what, where and when. The two held fields demonstrate
          the hold gate: a converted figure without its source currency, and boilerplate
          masquerading as content.
        </NarrationNote>
      )}

      <div className="mt-4 space-y-4">
        {banner && <ConfirmBanner show>{banner}</ConfirmBanner>}
        {confirmedAlready && !banner && (
          <ConfirmBanner show>
            Confirmed by {people.lead} — live at the agency layer with{" "}
            <span className="tnum">{heldCount}</span> fields still held in review.
          </ConfirmBanner>
        )}

        {/* Identity check */}
        {isHeld ? null : isDup && candidate.match ? (
          <SeverityBanner severity="Important">
            <div className="flex flex-wrap items-start gap-3">
              <span className="min-w-0">
                <b>Possible match: {candidate.match.target}</b> · match signal{" "}
                <span className="tnum">{candidate.match.similarity}</span>
                <span className="mt-2 flex flex-wrap gap-2">
                  {candidate.match.signals.map(([k, v]) => (
                    <Chip key={k} tone="neutral" className="font-mono">
                      {k} {v}
                    </Chip>
                  ))}
                </span>
              </span>
              <span className="ml-auto" />
              {/* The decision on a duplicate is merge into the existing record or create a
                  new one. Offering only Merge makes the other half of the choice invisible. */}
              <span className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMergeOpen(true);
                    setReason("");
                  }}
                >
                  Merge
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setBanner(
                      `Created as a separate record — both stand, attributed to ${people.lead}. The match signal is logged against them.`,
                    )
                  }
                >
                  <CopyPlus className="size-3.5" aria-hidden /> Create new record
                </Button>
              </span>
              <p className="w-full type-meta">
                Creating a new record keeps both. The match stays logged against them, so the
                duplicate comes back for a later human pass rather than disappearing.
              </p>
            </div>
          </SeverityBanner>
        ) : (
          <SeverityBanner severity="Info">
            Identity check — no canonical match. Name, city and place-id are all clear, so this
            creates a new record.
          </SeverityBanner>
        )}

        {/* Nothing extracted — the row is all there is to show */}
        {isHeld && (
          <Section title="Nothing extracted from this row">
            <p className="type-data text-muted-foreground">
              Nothing was extracted with confidence from this row. The candidate is held — it never
              surfaces anywhere until a person opens the source, fixes it by hand, or rejects it
              with a reason.
            </p>
            {corrected.Name && (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="w-24 shrink-0 type-meta">Name</span>
                  <span className="type-data-strong">{corrected.Name}</span>
                  <Chip tone="ok">corrected · {people.lead}</Chip>
                </div>
                <p className="mt-2 type-meta">
                  Keyed by hand, attributed. The source row is unchanged, and the candidate stays
                  held until the rest of it can be read.
                </p>
              </>
            )}
          </Section>
        )}

        {/* Fields */}
        {!isHeld && (
        <Section
          variant="list"
          title="Extracted fields"
          chips={<Chip tone="neutral">value · source snippet · confidence</Chip>}
        >
          <ul className="divide-y divide-border">
            {candidate.fields.map((f) => {
              const held = "held" in f && f.held;
              const template = "template" in f && f.template;
              return (
                <li key={f.label} className="p-4">
                  <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                    <span className="w-24 shrink-0 type-meta">{f.label}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {held ? (
                          <MoneyValue amount="" held />
                        ) : (
                          <span className="type-data-strong">
                            {corrected[f.label] ?? f.value}
                          </span>
                        )}
                        {!held && corrected[f.label] && (
                          <Chip tone="ok">corrected · {people.lead}</Chip>
                        )}
                        {template && <Chip tone="warn">template copy</Chip>}
                      </div>
                      <div className="mt-1 type-code text-muted-foreground">{f.snippet}</div>
                      {held && (
                        <p className="mt-2 type-meta">
                          A converted figure without its source currency is never committed —
                          visible here, excluded from answers.
                        </p>
                      )}
                      {template && (
                        <p className="mt-2 type-meta">
                          Excluded from corroboration; queued for enrichment.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* The bar carries the signal; the two-decimal probability beside it
                          was model internals wearing a UI, and added false precision to a
                          decision that is only ever confirm / correct / hold. */}
                      <ConfidenceMeter
                        agree={Math.round(f.confidence * 100)}
                        total={100}
                        label="extraction confidence"
                      />
                      {!held &&
                        !template &&
                        (editField === f.label ? (
                          <form
                            className="flex items-center gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (editValue.trim())
                                setCorrected((m) => ({ ...m, [f.label]: editValue.trim() }));
                              setEditField(null);
                            }}
                          >
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              aria-label={`Corrected value for ${f.label}`}
                              className="h-8 w-40 type-data"
                              autoFocus
                            />
                            <Button type="submit" variant="outline" size="sm">
                              Save
                            </Button>
                          </form>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-2"
                            aria-label={`Fix ${f.label}`}
                            onClick={() => {
                              setEditField(f.label);
                              setEditValue(corrected[f.label] ?? f.value);
                            }}
                          >
                            <Pencil className="size-3.5" aria-hidden />
                          </Button>
                        ))}
                      {!held &&
                        !template &&
                        editField !== f.label &&
                        (fieldOk[f.label] || confirmedAlready ? (
                          <Chip tone="ok">
                            <Check className="size-3" aria-hidden /> confirmed
                          </Chip>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFieldOk((m) => ({ ...m, [f.label]: true }))}
                          >
                            <Check className="size-3.5" aria-hidden /> Confirm
                          </Button>
                        ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>
        )}

        {/* Actions — the held candidate gets the three the copy names */}
        {isHeld ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setSourceOpen(true)}>
              <FileSearch className="size-3.5" aria-hidden /> Open source
            </Button>
            {editField === "Name" ? (
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editValue.trim())
                    setCorrected((m) => ({ ...m, Name: editValue.trim() }));
                  setEditField(null);
                }}
              >
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  aria-label="Corrected value for Name"
                  placeholder="Name, keyed by hand"
                  className="h-9 w-56 type-data"
                  autoFocus
                />
                <Button type="submit" variant="outline">
                  Save
                </Button>
              </form>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setEditField("Name");
                  setEditValue(corrected.Name ?? "");
                }}
              >
                <Pencil className="size-3.5" aria-hidden /> Fix manually
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setRejectOpen(true);
                setReason("");
              }}
            >
              Reject — reason logged
            </Button>
          </div>
        ) : !isDup ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={confirmedAlready} onClick={confirmRecord}>
              Confirm record — stamped {people.lead}, today
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRejectOpen(true);
                setReason("");
              }}
            >
              Reject — reason logged
            </Button>
          </div>
        ) : null}
      </div>

      {/* Open source — the row exactly as it arrived */}
      <Sheet open={sourceOpen} onOpenChange={setSourceOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Source row</SheetTitle>
            <SheetDescription>
              {candidate.from} · {candidate.uri}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <div className="type-code text-muted-foreground">{raw?.where}</div>
            <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-subtle p-4 type-code">
              {raw?.text}
            </pre>
            <p className="mt-4 type-data text-muted-foreground">{raw?.note}</p>
            <p className="mt-4 type-meta">
              The source is read-only here. Ground truth stays in the sheet: a correction is keyed
              against the candidate and attributed, and the row is left as it is.
            </p>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSourceOpen(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Reject sheet */}
      <Sheet open={rejectOpen} onOpenChange={setRejectOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Reject candidate</SheetTitle>
            <SheetDescription>
              {candidate.name} — the rejection is logged, so the pipeline&rsquo;s misses stay
              reviewable.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-2 px-4">
            <Label htmlFor="reject-reason" className="type-data">
              Reason (required)
            </Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Not a real property — a marketing row in the source sheet."
              className="type-data"
            />
          </div>
          <SheetFooter>
            <Button
              variant="destructive"
              disabled={!reason.trim()}
              onClick={() => {
                setRejectOpen(false);
                setBanner(`Rejected — reason logged, attributed to ${people.lead}.`);
              }}
            >
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
            <SheetDescription>
              Field by field against {candidate.match?.target}. Nothing merges automatically.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <ul className="divide-y divide-border">
              {candidate.fields.map((f) => (
                <li key={f.label} className="py-2">
                  <div className="type-meta">{f.label}</div>
                  <div className="mt-1 flex items-center gap-2 type-data">
                    <span className="min-w-0 flex-1 truncate">
                      {canonicalByLabel[f.label] ?? "—"}
                    </span>
                    <span className="text-muted-foreground" aria-hidden>
                      ⟷
                    </span>
                    <span className="min-w-0 flex-1 truncate text-right type-data-strong">{f.value}</span>
                  </div>
                  <div className="mt-1 flex justify-between type-code text-muted-foreground">
                    <span>canonical</span>
                    <span>incoming</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2">
              <Label htmlFor="merge-reason" className="type-data">
                Merge reason (required)
              </Label>
              <Textarea
                id="merge-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Same property — the portal sync drops the accent."
                className="type-data"
              />
              <p className="type-meta">
                The choice is stored with its reason, attributed. Nothing merges automatically.
              </p>
            </div>
          </div>
          <SheetFooter>
            <Button
              disabled={!reason.trim()}
              onClick={() => {
                setMergeOpen(false);
                setBanner(
                  `Merged as an overlay on ${candidate.match?.target} — reason stored, attributed to ${people.lead}.`,
                );
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
