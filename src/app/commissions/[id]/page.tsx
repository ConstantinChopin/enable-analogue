"use client";
/**
 * Commission detail — recomposed as a document (docs/rebuild/04-recomposition-brief.md).
 *
 * Job (Journey C, docs/journeys/journey-c-working-day.md): read the timeline projected →
 * due → paid with each value's source and date, see a discrepancy flagged rather than
 * absorbed, and chase — the product drafts the reminder, the advisor edits a line and
 * sends, and then the product stops. Nothing sends itself (SIG-35).
 *
 * Chapters, in order: the credit-not-refund banner (if this record carries one) ·
 * Timeline (rows of stage · value · source and date) · Chase log · Projected against
 * actual (if this record carries a discrepancy) · Sibling booking (the worked example
 * only) · Credit, not refund (the worked example only, quiet).
 *
 * The one primary lives in the Reminder — the tool that follows you down the page:
 * "Draft a reminder", and once a draft exists, "Send". It is the only filled button
 * because the send-gate is the surface's whole argument: every path ends at a review
 * step. "Discard" is secondary; "Open that record" is a text action in its chapter's
 * title row; accept-with-reason and the dispute draft open sheets, each with its own
 * filled action inside its own layer.
 *
 * Two roles (docs/rebuild/05-two-roles.md, journey O16): the owner can chase a late
 * commission on any agency booking, not only her own, by the same clicks. Her reminder is
 * signed and sent in her name, and sits in the same chase log as the advisor's; the log
 * and the sent state name whoever sent it (`reminderBy`). When the owner is about to chase
 * a booking that is the advisor's, the Reminder says so once, quietly, before the send.
 *
 * Demo (J1, checkpoint 2): /commissions/vo → Draft a reminder → edit a line → Send;
 * the title flips to "chased" and the chase log records it.
 *
 * Local components (this file only): TimelineRow — a field-row of stage · value ·
 * provenance; ProjectedAgainstActual — the two-row expected/actual block, used by both
 * discrepancy chapters; SheetBody — 24 inside, rows stacked, the helper the record uses.
 */
import { use, useState, type ReactNode } from "react";
import Link from "next/link";
import { useDemo, canViewCommissions } from "@/lib/store";
import { commissions, commissionEdgeCases, people, personName, roleLabel, type Persona } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import {
  Chip, Section, SeverityBanner, NarrationNote, ConfirmBanner, MoneyValue, SourceTag,
  FreshnessDate, StatusDot, SchematicBadge, Rows, RowStack,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose,
} from "@/components/ui/sheet";
import { ArrowRight } from "lucide-react";

const eur = (n: number) => `EUR ${n.toLocaleString("en-GB")}`;

/* The seed's bookings are the Paris desk's, held by the advisor who signs in. */
const bookingAdvisor = people.advisor;

/** The drafted chase, signed by whoever is signed in: it goes out in her name. */
const seededDraft = (role: Persona) => `Subject: Commission on booking VO-2214 — Villa Ortensia

Dear Villa Ortensia accounts team,

Our records show EUR 1,240 in commission on booking VO-2214 fell due on 18 July and remains open. Could you confirm when payment was issued, or advise if anything is missing on our side? Rate terms and the booking reference are attached.

With thanks,
${personName[role]} · Enable, ${role === "owner" ? "agency owner" : "Paris desk"}`;

/* ── a timeline row: stage · value · provenance on the record's shared track ── */
function TimelineRow({
  stage, provenance, children,
}: { stage: ReactNode; provenance?: ReactNode; children: ReactNode }) {
  return (
    <div className="field-row">
      <div className="type-data text-label-secondary">{stage}</div>
      <div className="min-w-0 type-data">{children}</div>
      {provenance && (
        <div className="flex flex-col items-start gap-0.5 sm:items-end sm:text-right">{provenance}</div>
      )}
    </div>
  );
}

/* ── expected against actual: two rows, both values with their provenance ── */
function ProjectedAgainstActual({ expected, actual }: { expected: number; actual: number }) {
  return (
    <div className="divide-y divide-hairline">
      <TimelineRow
        stage="Expected"
        provenance={<SourceTag kind="portal" label="projection · partner terms" />}
      >
        <span className="type-data-strong"><MoneyValue amount={expected} /></span>
      </TimelineRow>
      <TimelineRow
        stage="Actual"
        provenance={<SourceTag kind="tripsuite" label="booking system remittance · read-only" />}
      >
        <span className="type-data-strong"><MoneyValue amount={actual} /></span>
        <Chip tone="warn" className="ml-[var(--space-2)] tnum">{eur(expected - actual)} under</Chip>
      </TimelineRow>
    </div>
  );
}

/* ── the sheet body: 24 inside, rows stacked ── */
function SheetBody({ children }: { children: ReactNode }) {
  return <div className="space-y-[var(--space-6)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">{children}</div>;
}

export default function CommissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { s, d } = useDemo();
  const money = canViewCommissions(s);
  const c = commissions.find((x) => x.id === id);
  /** The worked example: the overdue Villa Ortensia commission carries the reminder gate. */
  const rich = id === "vo";

  /** The draft as edited; null until a line is changed, so it signs for whoever is in. */
  const [editedDraft, setEditedDraft] = useState<string | null>(null);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [acceptReason, setAcceptReason] = useState("");
  const [acceptedWithReason, setAcceptedWithReason] = useState<string | null>(null);

  if (!money) {
    return (
      <Page width="wide">
        <PageHeader title="Commission record" />
        <Section>
          <p className="max-w-[60ch] type-data-read">
            Signed in as {personName[s.role]} ({roleLabel[s.role]}), commission records are absent
            by policy. Financial scope stays with the owning advisor.
          </p>
          <p className="mt-[var(--space-2)] max-w-[60ch] type-meta">
            The record is not fetched and then hidden. There is nothing on this page to read past.
          </p>
        </Section>
      </Page>
    );
  }

  if (!c) {
    return (
      <Page width="wide">
        <PageHeader title="Not on file" />
        <Section>
          <p className="type-data-read text-label-secondary">No commission record with this reference.</p>
          <Button asChild variant="secondary" size="sm" className="mt-[var(--space-3)]">
            <Link href="/commissions">Back to the ledger <ArrowRight aria-hidden /></Link>
          </Button>
        </Section>
      </Page>
    );
  }

  const chased = rich && s.reminder === "sent";
  const sibling = commissionEdgeCases.discrepancy;
  const incentiveNote = c.projected.incentive;
  const late = c.state === "overdue" || c.state === "chased";
  /** Who the reminder is from: whoever sent it, or whoever is drafting it. */
  const sender = personName[s.reminderBy ?? s.role];
  /** The owner chasing a booking the advisor holds: said once, quietly, before the send. */
  const onBehalfNote = personName[s.role] !== bookingAdvisor ? (
    <p className="mt-[var(--space-2)] type-meta">
      This booking is {bookingAdvisor}&rsquo;s; the reminder goes out in your name and appears in
      her chase log.
    </p>
  ) : null;
  const draftText = editedDraft ?? seededDraft(s.role);

  return (
    <Page width="wide">
      <PageHeader
        title={
          <>
            {c.property}
            {c.state === "overdue" && !chased && <Chip tone="crit" className="tnum">overdue {c.overdueDays}d</Chip>}
            {c.state === "overdue" && chased && <Chip tone="primary">chased</Chip>}
            {c.state === "chased" && <Chip tone="primary" className="tnum">chased · {c.overdueDays}d open</Chip>}
            {c.state === "due" && <Chip tone="neutral">due {c.dueDate}</Chip>}
            {c.state === "paid" && <Chip tone="ok">paid {c.paidDate}</Chip>}
          </>
        }
      >
        <p className="mt-[var(--space-2)] type-meta">
          booking <span className="type-code">{c.bookingRef}</span>
          {c.traveller && <> · {c.traveller}</>}
          {" · "}
          <FreshnessDate>actuals synced 12:04 · booking-system figures up to 48h behind</FreshnessDate>
        </p>
      </PageHeader>

      <div className={rich ? "doc-layout" : "min-w-0"}>
        {/* ── the body: chapters at column width ── */}
        <div className="min-w-0">
          {rich && (
            <NarrationNote>
              The year-scale recovery hunt (SIG-30) becomes a daily, drafted, human-approved motion.
              The send-gate is a designed absence (SIG-35): no bulk-send, no auto-send, no scheduled
              chase — every path ends at a review step.
            </NarrationNote>
          )}

          {c.creditNotRefund && (
            <div className="pb-[var(--gap-2)]">
              <SeverityBanner severity="Critical">
                <b>Resolved as credit, not refund.</b> {commissionEdgeCases.creditNotRefund.note} The
                loss is a known decision, not a silent write-off.
              </SeverityBanner>
            </div>
          )}

          <Section title="Timeline">
            <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data-read text-label-secondary">
              Projected, due, paid — each value with where it came from and when.
            </p>
            <div className="divide-y divide-hairline">
              <TimelineRow
                stage={<StatusDot tone="ok">Projected</StatusDot>}
                provenance={<SourceTag kind="portal" label={c.projected.source} />}
              >
                <span className="type-data-strong"><MoneyValue amount={c.amount} currency={c.currency} /></span>
                <span className="text-label-secondary"> · rate {c.projected.rate}</span>
                {incentiveNote && <Chip tone="primary" className="ml-[var(--space-2)] tnum">{incentiveNote}</Chip>}
              </TimelineRow>

              <TimelineRow
                stage={<StatusDot tone={late ? "crit" : c.state === "paid" ? "ok" : "muted"}>Due</StatusDot>}
                provenance={<SourceTag kind="portal" label={`terms with the projection · ${c.projected.source}`} />}
              >
                <span className="tnum">{c.dueDate}</span>
                {late && <Chip tone="crit" className="ml-[var(--space-2)] tnum">{c.overdueDays}d overdue</Chip>}
              </TimelineRow>

              <TimelineRow
                stage={<StatusDot tone={c.state === "paid" ? "ok" : "muted"}>Paid</StatusDot>}
                provenance={
                  <>
                    <SourceTag kind="tripsuite" label="booking system · read-only" />
                    <FreshnessDate>{c.state === "paid" ? c.paidDate : "synced 12:04 · nothing received"}</FreshnessDate>
                  </>
                }
              >
                {c.state === "paid" ? (
                  <>
                    <span className="type-data-strong"><MoneyValue amount={c.amount} currency={c.currency} /></span>
                    <span className="text-label-secondary"> · {c.paidDate}</span>
                  </>
                ) : (
                  <span className="text-label-secondary">
                    unpaid — actuals arrive read-only from the booking system
                  </span>
                )}
              </TimelineRow>
            </div>
          </Section>

          <Section title="Chase log" deep>
            {chased ? (
              <Rows>
                <RowStack
                  head={
                    <>
                      <span className="min-w-0 truncate type-data-strong">Reminder sent</span>
                      <Chip tone="primary">chased</Chip>
                    </>
                  }
                >
                  Sent by {sender} today · logged on the timeline
                </RowStack>
              </Rows>
            ) : c.state === "chased" ? (
              <Rows>
                <RowStack
                  head={
                    <>
                      <span className="min-w-0 truncate type-data-strong">Reminder sent</span>
                      <Chip tone="neutral">no reply yet</Chip>
                    </>
                  }
                >
                  Sent by {bookingAdvisor} · 14 Aug
                </RowStack>
              </Rows>
            ) : (
              <p className="max-w-[60ch] type-data-read text-label-secondary">
                None yet.
                {rich && " A reminder drafted here is logged when it is sent, with your name and the date."}
              </p>
            )}
          </Section>

          {c.discrepancy && (
            <Section title="Projected against actual" deep chips={<Chip tone="warn">actual under projection</Chip>}>
              <ProjectedAgainstActual expected={c.discrepancy.expected} actual={c.discrepancy.actual} />
              <p className="mt-[var(--space-3)] type-meta">
                Possible causes: {c.discrepancy.causes.join(" · ")}. Flagged, never silently absorbed.
              </p>
            </Section>
          )}

          {rich && (
            <Section
              title={`Sibling booking — ${sibling.property}`}
              deep
              chips={<Chip tone="warn">actual under projection</Chip>}
              actions={
                <Button asChild variant="link" size="sm">
                  <Link href="/commissions/pa">Open that record <ArrowRight aria-hidden /></Link>
                </Button>
              }
            >
              <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data-read text-label-secondary">
                A separate booking on this desk — {sibling.note}.
              </p>
              <ProjectedAgainstActual expected={sibling.expected} actual={sibling.actual} />
              <p className="mt-[var(--space-3)] type-meta">
                Possible causes: {sibling.causes.join(" · ")}. Flagged, never silently absorbed.
              </p>
              {acceptedWithReason ? (
                <div className="mt-[var(--space-3)]">
                  <ConfirmBanner show>Accepted with reason — logged, attributed to {personName[s.role]}.</ConfirmBanner>
                </div>
              ) : (
                <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-2)]">
                  <Button variant="secondary" size="sm" onClick={() => setAcceptOpen(true)}>Accept with reason</Button>
                  <Button variant="secondary" size="sm" onClick={() => setDisputeOpen(true)}>Open dispute draft</Button>
                </div>
              )}
            </Section>
          )}

          {rich && (
            <Section title="Credit, not refund" quiet deep>
              <SeverityBanner severity="Critical">
                <b>{commissionEdgeCases.creditNotRefund.property}:</b>{" "}
                {commissionEdgeCases.creditNotRefund.note} The loss is a known decision, not a silent
                write-off.
              </SeverityBanner>
            </Section>
          )}
        </div>

        {/* ── the tool that follows you: the reminder, and the one action ── */}
        {rich && (
          <aside className="doc-rail" data-rail-label="Reminder">
            <Section variant="tool" follows title="Reminder">
              {s.reminder === "idle" && (
                <>
                  <p className="-mt-[var(--space-2)] type-data-read text-label-secondary">
                    The product drafts the chase with the booking reference and the rate terms
                    attached. It waits. Nothing sends without your review.
                  </p>
                  {onBehalfNote}
                  <div className="mt-[var(--space-4)]">
                    <Button className="w-full" onClick={() => d({ type: "reminder", state: "draft" })}>
                      Draft a reminder
                    </Button>
                  </div>
                </>
              )}

              {s.reminder === "draft" && (
                <>
                  <Label htmlFor="reminder-draft">Drafted for your review — edit freely</Label>
                  <Textarea
                    id="reminder-draft"
                    value={draftText}
                    onChange={(e) => setEditedDraft(e.target.value)}
                    className="mt-[var(--space-2)]"
                  />
                  {onBehalfNote}
                  <div className="mt-[var(--space-4)] flex flex-wrap items-center gap-[var(--space-2)]">
                    <Button onClick={() => d({ type: "reminder", state: "sent" })}>Send</Button>
                    <Button
                      variant="secondary"
                      onClick={() => { setEditedDraft(null); d({ type: "reminder", state: "idle" }); }}
                    >
                      Discard
                    </Button>
                  </div>
                  <p className="mt-[var(--space-2)] type-meta">
                    Sends once, on this click only. There is no auto-send.
                  </p>
                </>
              )}

              {s.reminder === "sent" && (
                <>
                  <ConfirmBanner show>Sent. Commission → chased; chase logged.</ConfirmBanner>
                  <p className="mt-[var(--space-3)] type-meta">
                    Sent by {sender} today. The reply, when it comes, lands on the chase log.
                  </p>
                </>
              )}
            </Section>
          </aside>
        )}
      </div>

      {/* ── accept with reason ── */}
      <Sheet open={acceptOpen} onOpenChange={setAcceptOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Accept discrepancy</SheetTitle>
            <SheetDescription>
              <span className="tnum">{eur(sibling.expected - sibling.actual)}</span> under projection on{" "}
              {sibling.property}. Accepting records the delta as a known decision, with your reason on
              the timeline.
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            <div>
              <Label htmlFor="accept-reason">
                Why? <span className="text-label-secondary">(required)</span>
              </Label>
              <Input
                id="accept-reason"
                value={acceptReason}
                onChange={(e) => setAcceptReason(e.target.value)}
                placeholder="e.g. currency variance — conversion dated 14 Jul"
                className="mt-[var(--space-2)]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-[var(--space-2)]">
              <Button
                disabled={!acceptReason.trim()}
                onClick={() => { setAcceptedWithReason(acceptReason.trim()); setAcceptOpen(false); }}
              >
                Accept with reason (logged)
              </Button>
              <SheetClose asChild><Button variant="secondary">Cancel</Button></SheetClose>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* ── dispute draft (schematic) ── */}
      <Sheet open={disputeOpen} onOpenChange={setDisputeOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-[var(--space-2)]">
              Dispute draft <SchematicBadge />
            </SheetTitle>
            <SheetDescription>
              Drafted from both values and their provenances. It waits for your review — nothing sends
              without it.
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p className="whitespace-pre-wrap type-data-read">
              {`Re: commission remittance — ${sibling.property}\n\nProjected ${eur(sibling.expected)} (partner terms) against ${eur(sibling.actual)} received. Possible causes on our side: ${sibling.causes.join("; ")}. Could you share the remittance breakdown?`}
            </p>
            <p className="border-t border-hairline pt-[var(--space-4)] type-meta">
              Draft only in this build — the send step keeps the same review gate.
            </p>
            <SheetClose asChild><Button variant="secondary">Close</Button></SheetClose>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </Page>
  );
}
