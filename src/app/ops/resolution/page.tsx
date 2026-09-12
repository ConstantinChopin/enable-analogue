"use client";
/**
 * Unmatched payments — the ops desk, recomposed as a document. Money that cannot be
 * matched to a booking is visible and ranked, never silently parked. A match is
 * closed by a person, with a reason, and the reason is stored.
 *
 * Chapters, in order: Open (one row per payment; the row whose sheet is open is
 * selected) · Closed (what the desk has already matched — the floor that keeps an
 * emptying queue from reading as a broken screen) · Amounts are absent here (a quiet
 * note, only for a reader without commission access).
 *
 * The one primary — "Match this payment" — sits at the bottom of the tool that follows
 * (To match), pointed at the first open payment, and opens the match sheet; the sheet
 * requires a candidate and a reason and carries its own commit. Each open row keeps a
 * secondary "Match…" so the act is reachable where the payment is read. Payment state
 * is carried by Chip only: unmatched · matched · logged.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDemo, canViewCommissions } from "@/lib/store";
import { closedPayments, orphanedPayments, people } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, Section, NarrationNote, ConfirmBanner, MoneyValue, Rows, Row, RowStack } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";

interface MatchDecision {
  ref: string;
  reason: string;
}

export default function ResolutionQueue() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s);

  const [sheetFor, setSheetFor] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<string>("");
  const [reason, setReason] = useState("");
  const [matches, setMatches] = useState<Record<string, MatchDecision>>({});
  const [justMatched, setJustMatched] = useState<string | null>(null);

  const open = orphanedPayments.find((p) => p.id === sheetFor);
  const unmatched = orphanedPayments.filter((p) => !matches[p.id]);
  const stillOpen = unmatched.length;
  const next = unmatched[0];

  const startMatch = (id: string) => {
    setSheetFor(id);
    setCandidate("");
    setReason("");
  };

  const confirmMatch = () => {
    if (!open || !candidate || !reason.trim()) return;
    setMatches((m) => ({ ...m, [open.id]: { ref: candidate, reason: reason.trim() } }));
    setJustMatched(open.id);
    d({ type: "matchPayment" });
    setSheetFor(null);
    setCandidate("");
    setReason("");
  };

  const subject = (p: (typeof orphanedPayments)[number]) =>
    money ? <><MoneyValue amount={p.amount} currency={p.currency} /> · {p.raw}</> : p.raw;

  return (
    <Page width="wide">
      <PageHeader title="Unmatched payments">
        <p className="mt-[var(--space-2)] max-w-[62ch] type-data-read text-label-secondary">
          Money that cannot be matched to a booking lands here, and stays until a person closes it
          with a reason.
        </p>
      </PageHeader>

      <div className="doc-layout">
        {/* ── the body: chapters at column width ── */}
        <div className="min-w-0">
          <NarrationNote>
            Money arrives under a traveller&rsquo;s name instead of the booker&rsquo;s, or against
            a property name that does not resolve. It cannot auto-match, so it is visible and
            ranked, and a person closes it with a reason.
          </NarrationNote>

          <Section title="Open" chips={<Chip tone="neutral"><span className="tnum">{stillOpen}</span> to match</Chip>}>
            <Rows>
              {orphanedPayments.map((p) => {
                const matched = matches[p.id];
                const selected = sheetFor === p.id;
                return (
                  <li
                    key={p.id}
                    className={cn("row-stack", selected && "border-l-2 border-l-selected pl-[var(--space-3)]")}
                  >
                    <div className="row-stack-head">
                      <span className="row-primary type-data-strong">{subject(p)}</span>
                      <span className="flex shrink-0 items-center gap-[var(--space-2)]">
                        {matched ? (
                          <Chip tone="ok">matched · logged</Chip>
                        ) : (
                          <>
                            <Chip tone="warn">unmatched</Chip>
                            <Button variant="secondary" size="sm" onClick={() => startMatch(p.id)}>Match…</Button>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="row-stack-body type-meta">
                      {matched
                        ? <>→ {matched.ref} · reason: &ldquo;{matched.reason}&rdquo; · attributed {people.owner}</>
                        : <>{p.note} · <span className="tnum">{p.candidates.length}</span> {p.candidates.length === 1 ? "candidate" : "candidates"}</>}
                    </div>
                    {justMatched === p.id && (
                      <div className="mt-[var(--space-2)]">
                        <ConfirmBanner show>
                          Matched with a reason — attributed to {people.owner}, logged on the payment.
                        </ConfirmBanner>
                      </div>
                    )}
                  </li>
                );
              })}
            </Rows>
          </Section>

          {/* The queue's floor: the state the desk is built to reach has to look like a
              finished morning rather than a failure to load. */}
          <Section
            title="Closed"
            deep
            chips={<Chip tone="neutral"><span className="tnum">{closedPayments.length}</span> since yesterday</Chip>}
          >
            <Rows>
              {closedPayments.map((p) => (
                <RowStack
                  key={p.id}
                  head={
                    <>
                      <span className="row-primary">
                        {money && <span className="type-data-strong tnum">{p.currency} {p.amount.toLocaleString("en-GB")} · </span>}
                        <span className={money ? undefined : "type-data-strong"}>{p.ref}</span>
                      </span>
                      <span className="type-meta tnum">{p.by} · {p.when}</span>
                    </>
                  }
                >
                  {p.reason}
                </RowStack>
              ))}
            </Rows>
          </Section>

        </div>

        {/* ── the tool that follows: what is still open, and the one action ── */}
        <aside className="doc-rail" data-rail-label="To match">
          <Section variant="tool" follows title="To match">
            {unmatched.length > 0 ? (
              <Rows>
                {unmatched.map((p) => (
                  <Row key={p.id}>
                    <span className="row-primary">
                      <span className="block truncate type-data-strong">{subject(p)}</span>
                      <span className="block truncate type-meta">{p.note}</span>
                    </span>
                    <span className="row-trailing">
                      <Chip tone={p.candidates.some((c) => c.strength === "strong") ? "primary" : "neutral"}>
                        {p.candidates.some((c) => c.strength === "strong") ? "strong candidate" : "weak candidates"}
                      </Chip>
                    </span>
                  </Row>
                ))}
              </Rows>
            ) : (
              <p className="type-data-read text-label-secondary">Every payment is matched and logged.</p>
            )}
            {next && (
              <div className="mt-[var(--space-4)]">
                <Button className="w-full" onClick={() => startMatch(next.id)}>Match this payment</Button>
                <p className="mt-[var(--space-2)] text-center type-meta">
                  A booking and a reason, attributed to {people.owner}. Nothing on the booking is edited.
                </p>
              </div>
            )}
          </Section>
        </aside>
      </div>

      {/* Match sheet — a reason is required */}
      <Sheet open={!!open} onOpenChange={(o) => { if (!o) setSheetFor(null); }}>
        <SheetContent side="right">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle>Match payment</SheetTitle>
                <SheetDescription>
                  {money && <><MoneyValue amount={open.amount} currency={open.currency} /> · </>}
                  arrived as {open.raw} — {open.note}.
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 space-y-[var(--space-4)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
                <div>
                  <div className="mb-[var(--space-2)] type-micro-caps text-label-tertiary">Candidates, strongest first</div>
                  <RadioGroup value={candidate} onValueChange={setCandidate} className="gap-[var(--space-2)]">
                    {open.candidates.map((c) => (
                      <label
                        key={c.ref}
                        className="flex cursor-pointer items-start gap-[var(--space-3)] rounded-lg border border-hairline p-[var(--space-3)] transition-colors duration-200 ease-standard hover:border-stroke-hover has-[[data-state=checked]]:border-selected"
                      >
                        <RadioGroupItem value={c.ref} className="mt-1" />
                        <span className="min-w-0">
                          <span className="block type-code text-label">{c.ref}</span>
                          <span className="mt-1 block">
                            <Chip tone={c.strength === "strong" ? "ok" : "neutral"}>{c.strength} candidate</Chip>
                          </span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                  <p className="mt-[var(--space-2)] type-meta">
                    Ranking suggests which booking this payment belongs to. It never edits anything
                    on the booking itself.
                  </p>
                </div>
                <div>
                  <Label htmlFor="match-reason">Reason <span className="text-label-secondary">(required)</span></Label>
                  <Input
                    id="match-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. traveller name on the remittance; booker confirmed by ref"
                    className="mt-[var(--space-2)]"
                  />
                </div>
              </div>
              <SheetFooter className="sm:flex-row sm:justify-end">
                <SheetClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </SheetClose>
                <Button disabled={!candidate || !reason.trim()} onClick={confirmMatch}>
                  Confirm match (attributed)
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Page>
  );
}
