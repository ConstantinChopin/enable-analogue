"use client";
/**
 * Unmatched payments — the Ledger archetype. Money that cannot be matched to a
 * booking is visible and ranked, never silently parked. A match is closed by a
 * person, with a reason, and the reason is stored.
 */
import { useState } from "react";
import { useDemo, canViewCommissions } from "@/lib/store";
import { closedPayments, orphanedPayments, people } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, Section, NarrationNote, ConfirmBanner, MoneyValue } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import { CircleDollarSign } from "lucide-react";

interface MatchDecision {
  ref: string;
  reason: string;
}

export default function ResolutionQueue() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s.role);

  const [sheetFor, setSheetFor] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<string>("");
  const [reason, setReason] = useState("");
  const [matches, setMatches] = useState<Record<string, MatchDecision>>({});
  const [justMatched, setJustMatched] = useState<string | null>(null);

  const open = orphanedPayments.find((p) => p.id === sheetFor);
  const stillOpen = orphanedPayments.filter((p) => !matches[p.id]).length;

  const confirmMatch = () => {
    if (!open || !candidate || !reason.trim()) return;
    setMatches((m) => ({ ...m, [open.id]: { ref: candidate, reason: reason.trim() } }));
    setJustMatched(open.id);
    d({ type: "matchPayment" });
    setSheetFor(null);
    setCandidate("");
    setReason("");
  };

  return (
    <Page width="wide">
      <PageHeader
        title={
          <>
            Unmatched payments
            <Chip tone={stillOpen > 0 ? "warn" : "ok"}>
              <span className="tnum">{stillOpen}</span> open
            </Chip>
          </>
        }
      >
        <p className="mt-2 max-w-[62ch] type-data text-muted-foreground">
          Money that cannot be matched to a booking lands here, and stays until a person closes
          it with a reason.
        </p>
      </PageHeader>

      <NarrationNote>
        Money arrives under a traveller&rsquo;s name instead of the booker&rsquo;s, or against a
        property name that does not resolve. It cannot auto-match, so it is visible and ranked, and a
        person closes it with a reason.
      </NarrationNote>

      <Section variant="list" className="mt-4">
        <ul>
          {orphanedPayments.map((p, i) => {
            const matched = matches[p.id];
            return (
              <li key={p.id} className={i > 0 ? "border-t border-border" : undefined}>
                <div className="row-grid px-4">
                  <span className="row-primary flex items-center gap-3">
                    <CircleDollarSign className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate type-data-strong">
                        {money ? (
                          <>
                            <MoneyValue amount={p.amount} currency={p.currency} /> · {p.raw}
                          </>
                        ) : (
                          p.raw
                        )}
                      </span>
                      <span className="block truncate type-meta">{p.note}</span>
                    </span>
                  </span>
                  <span className="row-trailing flex items-center gap-2">
                    {matched ? (
                      <Chip tone="ok">matched · logged</Chip>
                    ) : (
                      <>
                        <Chip tone="warn">unmatched</Chip>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSheetFor(p.id);
                            setCandidate("");
                            setReason("");
                          }}
                        >
                          Match
                        </Button>
                      </>
                    )}
                  </span>
                </div>
                {matched && (
                  <p className="px-4 pb-3 type-meta">
                    → {matched.ref} · reason: &ldquo;{matched.reason}&rdquo; · attributed{" "}
                    {people.ops}
                  </p>
                )}
                {justMatched === p.id && (
                  <div className="px-4 pb-4">
                    <ConfirmBanner show>
                      Matched with a reason — attributed to {people.ops}, logged on the payment.
                    </ConfirmBanner>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      {/* The queue's floor. Two open rows above a large empty panel read as a broken
          screen; this is the state the queue is built to reach, so it has to look like
          a finished morning rather than a failure to load. */}
      <Section
        variant="list"
        className="mt-4"
        title="Closed"
        chips={<Chip tone="neutral"><span className="tnum">{closedPayments.length}</span> in the last two days</Chip>}
      >
        <ul>
          {closedPayments.map((p, i) => (
            <li key={p.id} className={i > 0 ? "border-t border-border" : undefined}>
              <div className="px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {money && (
                    <span className="tnum type-data-strong">
                      {p.currency} {p.amount.toLocaleString("en-GB")}
                    </span>
                  )}
                  <span className="type-data">{p.ref}</span>
                  <span className="ml-auto type-meta">{p.by} · {p.when}</span>
                </div>
                <p className="mt-1 type-meta">{p.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {!money && (
        <Section className="mt-4" title="Amounts are absent here">
          <p className="type-data text-muted-foreground">
            Viewing as {people.colleague}: payment amounts are absent by policy, not masked. The
            identity work is still visible, because reviewing it does not require the figure.
          </p>
        </Section>
      )}

      {/* Match sheet — a reason is required */}
      <Sheet open={!!open} onOpenChange={(o) => { if (!o) setSheetFor(null); }}>
        <SheetContent side="right">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle>Match payment</SheetTitle>
                <SheetDescription>
                  {money ? (
                    <>
                      <MoneyValue amount={open.amount} currency={open.currency} /> ·{" "}
                    </>
                  ) : null}
                  arrived as {open.raw} — {open.note}.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4">
                <div>
                  <div className="mb-2 type-micro uppercase tracking-widest text-muted-foreground">
                    Candidates, strongest first
                  </div>
                  <RadioGroup value={candidate} onValueChange={setCandidate} className="gap-2">
                    {open.candidates.map((c) => (
                      <label
                        key={c.ref}
                        className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 has-[[data-state=checked]]:border-primary"
                      >
                        <RadioGroupItem value={c.ref} className="mt-1" />
                        <span className="min-w-0">
                          <span className="block font-mono type-data">{c.ref}</span>
                          <span className="mt-1 block">
                            <Chip tone={c.strength === "strong" ? "ok" : "neutral"}>
                              {c.strength} candidate
                            </Chip>
                          </span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                  <p className="mt-2 type-meta">
                    Ranking suggests which booking this payment belongs to. It never edits
                    anything on the booking itself.
                  </p>
                </div>
                <div>
                  <Label htmlFor="match-reason" className="type-data">
                    Reason (required)
                  </Label>
                  <Input
                    id="match-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. traveller name on the remittance; booker confirmed by ref"
                    className="mt-2 type-data"
                  />
                </div>
              </div>
              <SheetFooter>
                <Button size="sm" disabled={!candidate || !reason.trim()} onClick={confirmMatch}>
                  Confirm match (attributed)
                </Button>
                <SheetClose asChild>
                  <Button size="sm" variant="outline">
                    Cancel
                  </Button>
                </SheetClose>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Page>
  );
}
