"use client";
/**
 * Commission detail — the Document archetype.
 *
 * Timeline (projected → due → paid) with rate provenance · the chase log · the
 * draft → edit → send reminder machine. The send-gate is a designed absence: there
 * is no auto-send, no schedule and no bulk path anywhere on this surface.
 */
import React, { use, useState } from "react";
import Link from "next/link";
import { useDemo, canViewCommissions } from "@/lib/store";
import { commissions, commissionEdgeCases, people, personName, roleLabel } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import {
  Chip, Section, SeverityBanner, NarrationNote, ConfirmBanner, MoneyValue, SourceTag, FreshnessDate,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import { BadgePercent, CalendarDays, CircleDashed, CheckCircle2, History, Mail, ArrowRight } from "lucide-react";

const eur = (n: number) => `EUR ${n.toLocaleString("en-GB")}`;

const seededDraft = `Subject: Commission on booking VO-2214 — Villa Ortensia

Dear Villa Ortensia accounts team,

Our records show EUR 1,240 in commission on booking VO-2214 fell due on 18 July and remains open. Could you confirm when payment was issued, or advise if anything is missing on our side? Rate terms and the booking reference are attached.

With thanks,
R. Devane · Enable, Paris desk`;

function TimelineRow({ marker, label, children }: { marker: "done" | "flag" | "empty"; label: string; children: React.ReactNode }) {
  return (
    <li className="group relative flex gap-3 pb-4 last:pb-0">
      <span className="absolute left-[7px] top-5 bottom-0 w-px bg-border group-last:hidden" aria-hidden />
      <span className="relative z-10 mt-0.5 shrink-0">
        {marker === "done" && <CheckCircle2 className="size-4 text-ok" aria-hidden />}
        {marker === "flag" && <CalendarDays className="size-4 text-crit" aria-hidden />}
        {marker === "empty" && <CircleDashed className="size-4 text-muted-foreground" aria-hidden />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="t-micro font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="mt-1 t-body">{children}</div>
      </div>
    </li>
  );
}

export default function CommissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { s, d } = useDemo();
  const money = canViewCommissions(s.role);
  const c = commissions.find((x) => x.id === id);
  /** The worked example: the overdue Villa Ortensia commission carries the reminder gate. */
  const rich = id === "vo";

  const [draftText, setDraftText] = useState(seededDraft);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [acceptReason, setAcceptReason] = useState("");
  const [acceptedWithReason, setAcceptedWithReason] = useState<string | null>(null);

  if (!money) {
    return (
      <Page width="text">
        <PageHeader back="/briefing" crumb="Briefing" title="Commission record" />
        <Section>
          <p className="t-body">
            Signed in as {personName[s.role]} ({roleLabel[s.role]}), commission records are absent
            by policy. Financial scope stays with the owning advisor.
          </p>
          <p className="mt-2 t-meta">
            The record is not fetched and then hidden. There is nothing on this page to read past.
          </p>
        </Section>
      </Page>
    );
  }

  if (!c) {
    return (
      <Page width="text">
        <PageHeader back="/commissions" crumb="Commissions" title="Not on file" />
        <Section>
          <p className="t-body text-muted-foreground">No commission record with this reference.</p>
          <Button asChild size="sm" variant="outline" className="mt-3">
            <Link href="/commissions">Back to the ledger</Link>
          </Button>
        </Section>
      </Page>
    );
  }

  const chased = rich && s.reminder === "sent";
  const sibling = commissionEdgeCases.discrepancy;
  const incentiveNote = c.projected.incentive;

  return (
    <Page width="text">
      <PageHeader
        back="/commissions"
        crumb={<>Commissions / {c.property}</>}
        title={
          <>
            {c.property}
            {c.state === "overdue" && !chased && <Chip tone="crit">overdue {c.overdueDays}d</Chip>}
            {c.state === "overdue" && chased && <Chip tone="primary">chased</Chip>}
            {c.state === "chased" && <Chip tone="primary">chased · {c.overdueDays}d open</Chip>}
            {c.state === "due" && <Chip tone="neutral">due {c.dueDate}</Chip>}
            {c.state === "paid" && <Chip tone="ok">paid {c.paidDate}</Chip>}
          </>
        }
        actions={<span className="font-mono t-micro text-muted-foreground">booking {c.bookingRef}</span>}
      />

      {rich && (
        <NarrationNote>
          The year-scale recovery hunt (SIG-30) becomes a daily, drafted, human-approved motion.
          The send-gate is a designed absence (SIG-35): no bulk-send, no auto-send, no scheduled
          chase — every path ends at a review step.
        </NarrationNote>
      )}

      {/* (a) Timeline */}
      <Section title="Timeline" className="mt-4" chips={<BadgePercent className="size-3.5 text-muted-foreground" aria-hidden />}>
        <ul className="mt-1">
          <TimelineRow marker="done" label="Projected">
            <span className="font-semibold"><MoneyValue amount={c.amount} currency={c.currency} /></span>
            <span className="text-muted-foreground"> · rate {c.projected.rate}</span>
            {c.traveller && <span className="text-muted-foreground"> · {c.traveller}</span>}
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <SourceTag kind="portal" label={c.projected.source} />
              {incentiveNote && <Chip tone="primary" className="tnum">{incentiveNote}</Chip>}
            </div>
          </TimelineRow>
          <TimelineRow
            marker={c.state === "overdue" || c.state === "chased" ? "flag" : c.state === "paid" ? "done" : "empty"}
            label="Due"
          >
            {c.dueDate}
            {(c.state === "overdue" || c.state === "chased") && (
              <Chip tone="crit" className="ml-2 tnum">{c.overdueDays} days overdue</Chip>
            )}
          </TimelineRow>
          <TimelineRow marker={c.state === "paid" ? "done" : "empty"} label="Paid">
            {c.state === "paid" ? (
              <>
                <MoneyValue amount={c.amount} currency={c.currency} />{" "}
                <span className="text-muted-foreground">· {c.paidDate} · booking system, read-only</span>
              </>
            ) : (
              <span className="text-muted-foreground">
                unpaid — actuals arrive read-only from the booking system
              </span>
            )}
          </TimelineRow>
        </ul>
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 t-meta">
          <History className="size-3.5" aria-hidden />
          Chase log —{" "}
          {chased ? (
            <span className="text-foreground">chased today by {people.advisor} · logged</span>
          ) : c.state === "chased" ? (
            <span className="text-foreground">chased 14 Aug by {people.advisor} · no reply yet</span>
          ) : (
            "none yet"
          )}
        </div>
      </Section>

      {/* (b) Reminder — the send-gate */}
      {rich && (
        <Section title="Reminder" className="mt-4" chips={<Mail className="size-3.5 text-muted-foreground" aria-hidden />}>
          {s.reminder === "idle" && (
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={() => d({ type: "reminder", state: "draft" })}>Draft a reminder</Button>
              <span className="t-meta">
                The product drafts. It waits. Nothing sends without review.
              </span>
            </div>
          )}
          {s.reminder === "draft" && (
            <div>
              <Label htmlFor="reminder-draft" className="t-meta">
                Drafted for your review — edit freely
              </Label>
              <Textarea
                id="reminder-draft"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="mt-2 max-h-[40vh] min-h-[120px] font-mono t-body"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => d({ type: "reminder", state: "sent" })}>Send</Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setDraftText(seededDraft); d({ type: "reminder", state: "idle" }); }}
                >
                  Discard
                </Button>
                <span className="t-meta">
                  Sends once, on this click only. There is no auto-send.
                </span>
              </div>
            </div>
          )}
          {s.reminder === "sent" && <ConfirmBanner show>Sent. Commission → chased; chase logged.</ConfirmBanner>}
        </Section>
      )}

      {/* (c) This record's own discrepancy, when it has one */}
      {c.discrepancy && (
        <Section
          title="Projected against actual"
          className="mt-4"
          chips={<Chip tone="warn">actual under projection</Chip>}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border p-4">
              <div className="t-micro font-mono uppercase tracking-widest text-muted-foreground">Expected</div>
              <div className="mt-1 t-title"><MoneyValue amount={c.discrepancy.expected} /></div>
              <div className="mt-1"><SourceTag kind="portal" label="projection · partner terms" /></div>
            </div>
            <div className="rounded-md border border-warn p-4">
              <div className="t-micro font-mono uppercase tracking-widest text-muted-foreground">Actual</div>
              <div className="mt-1 t-title"><MoneyValue amount={c.discrepancy.actual} /></div>
              <div className="mt-1"><SourceTag kind="tripsuite" label="booking system remittance · read-only" /></div>
            </div>
          </div>
          <p className="mt-2 t-meta">
            Possible causes: {c.discrepancy.causes.join(" · ")}. Flagged, never silently absorbed.
          </p>
        </Section>
      )}

      {/* (d) Credit, not refund */}
      {c.creditNotRefund && (
        <div className="mt-4">
          <SeverityBanner severity="Critical">
            <b>Resolved as credit, not refund.</b> {commissionEdgeCases.creditNotRefund.note} The loss is a
            known decision, not a silent write-off.
          </SeverityBanner>
        </div>
      )}

      {/* (e) The sibling booking, shown beside the worked example */}
      {rich && (
        <Section
          title={`Sibling booking — ${sibling.property}`}
          className="mt-4"
          chips={<Chip tone="warn">actual under projection</Chip>}
        >
          <p className="t-meta">
            A separate booking on this desk, shown with this one so the discrepancy is not lost —
            flagged, never silently absorbed.
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border p-4">
              <div className="t-micro font-mono uppercase tracking-widest text-muted-foreground">Expected</div>
              <div className="mt-1 t-title"><MoneyValue amount={sibling.expected} /></div>
              <div className="mt-1"><SourceTag kind="portal" label="projection · partner terms" /></div>
            </div>
            <div className="rounded-md border border-warn p-4">
              <div className="t-micro font-mono uppercase tracking-widest text-muted-foreground">Actual</div>
              <div className="mt-1 t-title"><MoneyValue amount={sibling.actual} /></div>
              <div className="mt-1"><SourceTag kind="tripsuite" label="booking system remittance · read-only" /></div>
            </div>
          </div>
          <div className="mt-2 t-meta">
            {sibling.note} · possible causes: {sibling.causes.join(" · ")}
          </div>
          {acceptedWithReason ? (
            <div className="mt-3">
              <ConfirmBanner show>Accepted with reason — logged, attributed to {people.advisor}.</ConfirmBanner>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setAcceptOpen(true)}>Accept with reason</Button>
              <Button size="sm" variant="outline" onClick={() => setDisputeOpen(true)}>Open dispute draft</Button>
              <Button asChild size="sm" variant="ghost" className="text-primary">
                <Link href="/commissions/pa">
                  Open that record <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
            </div>
          )}

          <div className="mt-4">
            <SeverityBanner severity="Critical">
              <b>{commissionEdgeCases.creditNotRefund.property}:</b>{" "}
              {commissionEdgeCases.creditNotRefund.note} The loss is a known decision, not a silent
              write-off.
            </SeverityBanner>
          </div>
        </Section>
      )}

      <p className="mt-3">
        <FreshnessDate>
          actuals synced 12:04 · booking-system figures up to 48h behind · ground truth stays in the
          source system
        </FreshnessDate>
      </p>

      {/* Accept-with-reason sheet */}
      <Sheet open={acceptOpen} onOpenChange={setAcceptOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="t-title">Accept discrepancy</SheetTitle>
            <SheetDescription className="t-meta">
              <span className="tnum">{eur(sibling.expected - sibling.actual)}</span> under projection on{" "}
              {sibling.property}. Accepting records the delta as a known decision, with your reason on
              the timeline.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <Label htmlFor="accept-reason" className="t-micro">Reason (required)</Label>
            <Input
              id="accept-reason"
              value={acceptReason}
              onChange={(e) => setAcceptReason(e.target.value)}
              placeholder="e.g. currency variance — conversion dated 14 Jul"
              className="mt-2 t-body"
            />
          </div>
          <SheetFooter>
            <Button
              size="sm"
              disabled={!acceptReason.trim()}
              onClick={() => { setAcceptedWithReason(acceptReason.trim()); setAcceptOpen(false); }}
            >
              Accept with reason (logged)
            </Button>
            <SheetClose asChild><Button size="sm" variant="outline">Cancel</Button></SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Dispute draft sheet */}
      <Sheet open={disputeOpen} onOpenChange={setDisputeOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 t-title">
              Dispute draft
              <Chip tone="neutral" className="font-mono uppercase tracking-wide">schematic</Chip>
            </SheetTitle>
            <SheetDescription className="t-meta">
              Drafted from both values and their provenances. It waits for your review — nothing sends
              without it.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 t-meta">
            <div className="rounded-md border border-border bg-subtle p-4 font-mono t-meta whitespace-pre-wrap">
              {`Re: commission remittance — ${sibling.property}\n\nProjected ${eur(sibling.expected)} (partner terms) against ${eur(sibling.actual)} received. Possible causes on our side: ${sibling.causes.join("; ")}. Could you share the remittance breakdown?`}
            </div>
            <p className="mt-2 text-muted-foreground">
              Draft only in this build — the send step keeps the same review gate.
            </p>
          </div>
          <SheetFooter>
            <SheetClose asChild><Button size="sm" variant="outline">Close</Button></SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Page>
  );
}
