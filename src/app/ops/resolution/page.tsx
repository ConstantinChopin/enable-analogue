"use client";
/** Resolution queue — Journey C U1 (ops home). Unmatched money is visible, never silently parked. */
import React, { useState } from "react";
import { useDemo, canViewCommissions } from "@/lib/store";
import { orphanedPayments, people } from "@/data/seed";
import { Chip, Section, PageHeader, NarrationNote, ConfirmBanner, MoneyValue } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { CircleDollarSign } from "lucide-react";

interface MatchDecision { ref: string; reason: string }

export default function ResolutionQueue() {
  const { s } = useDemo();
  const money = canViewCommissions(s.persona);

  const [sheetFor, setSheetFor] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<string>("");
  const [reason, setReason] = useState("");
  const [matches, setMatches] = useState<Record<string, MatchDecision>>({});
  const [justMatched, setJustMatched] = useState<string | null>(null);

  const open = orphanedPayments.find((p) => p.id === sheetFor);

  const confirmMatch = () => {
    if (!open || !candidate || !reason.trim()) return;
    setMatches((m) => ({ ...m, [open.id]: { ref: candidate, reason: reason.trim() } }));
    setJustMatched(open.id);
    setSheetFor(null);
    setCandidate("");
    setReason("");
  };

  return (
    <div className="mx-auto max-w-[980px] px-6 py-6">
      <PageHeader
        crumb="Ops / Resolution queue"
        title={<>Unmatched payments <Chip tone="warn">{orphanedPayments.filter((p) => !matches[p.id]).length} open</Chip></>}
      />

      <NarrationNote>
        SIG-11: money arrives under a traveller&apos;s name instead of the booker, or against an unresolvable property name. It cannot auto-match, so it lands here — visible, ranked, and closed by a person with a reason.
      </NarrationNote>

      <Section className="mt-4">
        <ul className="divide-y divide-border text-[13.5px]">
          {orphanedPayments.map((p) => {
            const matched = matches[p.id];
            return (
              <li key={p.id} className="py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <CircleDollarSign className="size-3.5 text-muted-foreground" aria-hidden />
                  {money && <span className="font-semibold"><MoneyValue amount={p.amount} currency={p.currency} /></span>}
                  <span className="font-medium">{p.raw}</span>
                  <span className="text-muted-foreground">· {p.note}</span>
                  <span className="ml-auto" />
                  {matched ? (
                    <Chip tone="ok">matched · logged</Chip>
                  ) : (
                    <>
                      <Chip tone="warn">unmatched</Chip>
                      <Button size="sm" variant="outline" onClick={() => { setSheetFor(p.id); setCandidate(""); setReason(""); }}>Match…</Button>
                    </>
                  )}
                </div>
                {matched && (
                  <div className="mt-1 pl-5.5 text-[12.5px] text-muted-foreground">
                    → {matched.ref} · reason: “{matched.reason}” · attributed {people.ops}
                  </div>
                )}
                {justMatched === p.id && (
                  <div className="mt-2"><ConfirmBanner show>Matched with reason — attributed to {people.ops}, logged on the payment.</ConfirmBanner></div>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      <p className="mt-3 text-[12.5px] text-muted-foreground">
        Ranking orders identity candidates only — never intelligence values.
      </p>
      {!money && (
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Viewing as {people.colleague}: payment amounts are absent by policy, not masked.
        </p>
      )}

      {/* Match sheet */}
      <Sheet open={!!open} onOpenChange={(o) => { if (!o) setSheetFor(null); }}>
        <SheetContent>
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="text-[15px]">Match payment</SheetTitle>
                <SheetDescription className="text-[12.5px]">
                  {money ? <><MoneyValue amount={open.amount} currency={open.currency} /> · </> : null}
                  arrived as {open.raw} — {open.note}.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4">
                <div>
                  <div className="mb-2 text-[12px] font-medium">Candidates, strongest first</div>
                  <RadioGroup value={candidate} onValueChange={setCandidate}>
                    {open.candidates.map((c) => (
                      <label key={c.ref} className="flex items-start gap-2.5 rounded-md border border-border p-2.5 text-[13px] has-[[data-state=checked]]:border-primary cursor-pointer">
                        <RadioGroupItem value={c.ref} className="mt-0.5" />
                        <span className="min-w-0">
                          <span className="block font-mono text-[12px]">{c.ref}</span>
                          <Chip tone={c.strength === "strong" ? "ok" : "neutral"} className="mt-1">{c.strength} candidate</Chip>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                  <p className="mt-2 text-[11.5px] text-muted-foreground">Ranking orders identity candidates only — never intelligence values.</p>
                </div>
                <div>
                  <Label htmlFor="match-reason" className="text-[12px]">Reason (required)</Label>
                  <Input id="match-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. traveller name on remittance; booker confirmed by ref" className="mt-1.5 text-[13px]" />
                </div>
              </div>
              <SheetFooter>
                <Button size="sm" disabled={!candidate || !reason.trim()} onClick={confirmMatch}>
                  Confirm match (attributed)
                </Button>
                <SheetClose asChild><Button size="sm" variant="outline">Cancel</Button></SheetClose>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
