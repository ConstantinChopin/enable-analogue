"use client";
/** Notices due — the stale-review queue (Journey B U5/E1). Oldest first; nothing auto-closes. */
import { useState } from "react";
import Link from "next/link";
import { useDemo } from "@/lib/store";
import { notices, promotions, people } from "@/data/seed";
import { Chip, Section, PageHeader, SeverityBanner, NarrationNote, ConfirmBanner, SchematicBadge } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, Scale } from "lucide-react";

export default function NoticesDue() {
  const { s, d } = useDemo();
  const [stillActive, setStillActive] = useState<Record<string, boolean>>({});
  const [closedLocal, setClosedLocal] = useState<Record<string, boolean>>({});
  const [closeTarget, setCloseTarget] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [banner, setBanner] = useState<string | null>(null);

  const queue = notices
    .filter((n) => n.staleReviewDue)
    .filter((n) => !(n.id === "spa" && s.spaNoticeClosed) && !closedLocal[n.id])
    .sort((a, b) => b.ageDays - a.ageDays); // oldest first

  const contradictA = notices.find((n) => n.id === "spa");
  const contradictB = notices.find((n) => n.id === "contradict");
  const atelier = promotions.find((p) => p.id === "atelier-credit");
  const closing = closeTarget ? notices.find((n) => n.id === closeTarget) : null;

  const sevTone = (sev: string) => (sev === "Critical" ? "crit" : sev === "Important" ? "warn" : "neutral") as "crit" | "warn" | "neutral";

  function confirmClose() {
    if (!closeTarget || !reason.trim()) return;
    if (closeTarget === "spa") d({ type: "closeSpaNotice" });
    else setClosedLocal((m) => ({ ...m, [closeTarget]: true }));
    setBanner("Closed everywhere immediately; archived with history");
    setCloseTarget(null);
    setReason("");
  }

  return (
    <div className="mx-auto max-w-[980px] px-6 py-6">
      <PageHeader crumb="Governance / Notices due" title={<>Notices due <Chip tone="neutral">oldest first</Chip></>} />

      <NarrationNote>
        The v2 answer to silent expiry: no notice auto-closes, and none outlives its truth by more than one review interval. This queue is where the two failure modes meet.
      </NarrationNote>

      {s.world === "v1" ? (
        <SeverityBanner severity="Info" className="mt-4">
          <span className="text-muted-foreground">v1 carried valid-until dates — this queue did not exist; expiry was silent.</span>
        </SeverityBanner>
      ) : (
        <>
          {banner && <div className="mt-4"><ConfirmBanner show>{banner}</ConfirmBanner></div>}

          <Section className="mt-4">
            <ul className="divide-y divide-border text-[13.5px]">
              {queue.map((n) => (
                <li key={n.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/records/${n.productId}`} className="font-medium hover:text-primary">{n.productName}</Link>
                    <span className="text-foreground/90"> — {n.text}</span>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                      <Clock className="size-3" aria-hidden /> open {n.ageDays} days · {n.owner} · {n.openedAt}
                    </div>
                  </div>
                  <span className="ml-auto" />
                  <Chip tone={sevTone(n.severity)}>{n.severity}</Chip>
                  {stillActive[n.id] ? (
                    <Chip tone="ok">still active — confirmed</Chip>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => { setStillActive((m) => ({ ...m, [n.id]: true })); setBanner(`Still active — confirmed by ${people.advisor} today. The review clock resets; nothing closed.`); }}>
                        Still active
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setCloseTarget(n.id); setReason(""); }}>Close…</Button>
                    </>
                  )}
                </li>
              ))}
              {queue.length === 0 && (
                <li className="py-4 text-[13px] text-muted-foreground">Nothing due for review. Every open notice is inside its review interval.</li>
              )}
            </ul>
          </Section>

          {/* Ended, pending close — incentive end date vs advisory closure (B-E1) */}
          {atelier && !closedLocal["atelier"] && (
            <Section className="mt-4" title="Incentive advisory" chips={<Chip tone="warn">ended, pending close</Chip>}>
              <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
                <span className="font-medium">{atelier.productName}</span>
                <span>{atelier.rate}</span>
                <span className="ml-auto" />
                <Chip tone="neutral">{atelier.program} programme</Chip>
              </div>
              <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                The commercial end date has passed — projected commissions stopped including it immediately. The advisory itself still closes manually: end dates take effect on their own; closure never does.
              </p>
              <div className="mt-2">
                <Button variant="ghost" size="sm" onClick={() => { setCloseTarget("atelier"); setReason(""); }}>Close…</Button>
              </div>
            </Section>
          )}

          {/* Contradicting pair (B-U4) */}
          {contradictA && contradictB && !s.spaNoticeClosed && (
            <Section className="mt-4" title={<span className="inline-flex items-center gap-1.5"><Scale className="size-3.5 text-muted-foreground" aria-hidden /> Contradiction on {contradictA.productName}</span>} chips={<><Chip tone="warn">both shown · resolve</Chip><SchematicBadge /></>}>
              <ul className="divide-y divide-border text-[13.5px]">
                <li className="flex flex-wrap items-center gap-2 py-2">
                  <span>“{contradictA.text}”</span>
                  <span className="ml-auto text-[11.5px] text-muted-foreground">{people.lead} ({contradictA.owner}) · {contradictA.openedAt} · agency scope</span>
                </li>
                <li className="flex flex-wrap items-center gap-2 py-2">
                  <span>“{contradictB.text}”</span>
                  <span className="ml-auto text-[11.5px] text-muted-foreground">{people.colleague} ({contradictB.owner}) · {contradictB.openedAt} · personal scope</span>
                </li>
              </ul>
              <p className="mt-2 text-[12.5px] text-muted-foreground">
                Both render to anyone who can see both, attributed and dated (both visible to you: one is yours, one is agency scope). Resolution follows the conflict pattern: a person confirms, and the confirmed state is stored at the agency layer.
              </p>
            </Section>
          )}

          {/* History — closed notices archive here with their reasons */}
          <Section className="mt-4" title="History" chips={<Chip tone="neutral">closed notices</Chip>}>
            <ul className="divide-y divide-border text-[13.5px]">
              {s.spaNoticeClosed && contradictA && (
                <li className="flex flex-wrap items-center gap-2 py-2.5">
                  <div className="min-w-0">
                    <span className="font-medium">{contradictA.productName}</span>
                    <span className="text-foreground/90"> — {contradictA.text}</span>
                  </div>
                  <span className="ml-auto" />
                  <Chip tone="neutral">closed today · reason on file · archived</Chip>
                </li>
              )}
              {notices.filter((n) => closedLocal[n.id]).map((n) => (
                <li key={n.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <div className="min-w-0">
                    <span className="font-medium">{n.productName}</span>
                    <span className="text-foreground/90"> — {n.text}</span>
                  </div>
                  <span className="ml-auto" />
                  <Chip tone="neutral">closed today · reason on file · archived</Chip>
                </li>
              ))}
              {closedLocal["atelier"] && atelier && (
                <li className="flex flex-wrap items-center gap-2 py-2.5">
                  <div className="min-w-0">
                    <span className="font-medium">{atelier.productName}</span>
                    <span className="text-foreground/90"> — {atelier.rate} incentive advisory</span>
                  </div>
                  <span className="ml-auto" />
                  <Chip tone="neutral">closed today · reason on file · archived</Chip>
                </li>
              )}
              <li className="flex flex-wrap items-center gap-2 py-2.5">
                <div className="min-w-0">
                  <span className="font-medium">Winter rate sheet superseded</span>
                </div>
                <span className="ml-auto" />
                <Chip tone="neutral">closed 12 May · MK</Chip>
              </li>
            </ul>
            <p className="mt-2 border-t border-border pt-2 text-[12px] text-muted-foreground">
              A closed notice keeps its history — who opened it, who closed it, and why.
            </p>
          </Section>
        </>
      )}

      {/* Close sheet — reason required */}
      <Sheet open={closeTarget !== null} onOpenChange={(o) => { if (!o) setCloseTarget(null); }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Close notice</SheetTitle>
            <SheetDescription>
              {closing ? <>{closing.productName} — {closing.text}</> : atelier ? <>{atelier.productName} — {atelier.rate}</> : null}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 space-y-2">
            <Label htmlFor="close-reason" className="text-[12.5px]">Reason (required)</Label>
            <Textarea id="close-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Property confirmed the spa reopened on a call today." className="text-[13px]" />
            <p className="text-[12px] text-muted-foreground">Closing removes this from answers, cards, and the briefing immediately. The notice archives with its history — who opened it, who closed it, and why.</p>
          </div>
          <SheetFooter>
            <Button disabled={!reason.trim()} onClick={confirmClose}>Close notice</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
