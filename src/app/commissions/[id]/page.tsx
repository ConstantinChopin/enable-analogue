"use client";
/**
 * Commission detail — recomposed as a document (docs/rebuild/04-recomposition-brief.md).
 *
 * Job (Journey C, docs/journeys/journey-c-working-day.md): read the timeline projected →
 * due → paid with each value's source and date, see a discrepancy and decide it, and
 * chase what is late. The product drafts the reminder, the person edits and sends it,
 * and nothing sends itself (SIG-35).
 *
 * One anatomy for every commission (UX sweep COL-08, COL-12, FB-12, 2026-09-28). Until
 * then only Villa Ortensia could be chased, and Palácio's discrepancy was decided on
 * Villa Ortensia's page. Now:
 *   header     the property, its state, and every object named as a link: the property's
 *              record and the traveller (where this reader may open them, VIS-098). A
 *              neutral freshness line says where the actuals come from and when they
 *              were last synced; nothing is amber unless a figure shown is stale.
 *   Timeline   projected (what the terms said) · due · paid (what arrived). A discrepant
 *              commission projects its expected figure, so the timeline and "Projected
 *              against actual" agree (Palácio showed 1,008 beside 1,120).
 *   Chase log  every reminder, seeded or sent this session, with who and when.
 *   Projected against actual (a discrepancy only): the two figures, and a Warning whose
 *              acts are Draft a dispute and Accept with reason (VIS-097: decide, ochre).
 *              Accepting collapses it to a kept line with who and when.
 *   Reminder   the rail, on every overdue or chased commission: Draft a reminder → read
 *              and edit → Send, then a Done in place ("Sent · 10:14 · R. Devane"). Villa
 *              Ortensia's reminder is the store's (`reminder`, the assistant drafts it);
 *              every commission records its send as the decision "reminder:<id>".
 *              `?draft=1` (the ledger's "Draft a reminder") opens the draft on arrival.
 *
 * Two roles (docs/rebuild/05-two-roles.md, journey O16): the owner can chase any agency
 * booking by the same clicks. Her reminder goes out in her name and sits in the same
 * chase log; when the booking is the advisor's, the Reminder says so once, before the send.
 *
 * A payment the owner matched to this booking (/ops/resolution) makes it paid here, with
 * the payment and who matched it (COL-12, ./ledger.ts).
 */
import { Suspense, use, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDemo, canViewCommissions } from "@/lib/store";
import {
  commissions, commissionEdgeCases, connections, people, personName, type Commission, type Persona,
} from "@/data/seed";
import { Page, PageHeader, ActionBar } from "@/components/layouts";
import {
  Chip, Section, SourceTag, StatusDot, SchematicBadge, Rows, RowStack, Done, Warning,
} from "@/components/bits";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import {
  eur, liveState, isLate, reminderSent, settlementFor, travellerHref, sentLine, timeOf,
} from "../ledger";

/* The seed's bookings are the Paris desk's, held by the advisor who signs in. */
const bookingAdvisor = people.advisor;

/** Where the actuals come from, and when they were last read. */
const tripsuite = connections.find((x) => x.name === "TripSuite");

/** The drafted chase, signed by whoever is signed in: it goes out in her name. A second
    reminder on an already-chased commission says so. */
function draftFor(c: Commission, role: Persona, followUp: boolean) {
  const opening = followUp
    ? `We wrote on 14 Aug about the ${eur(c.amount)} in commission on booking ${c.bookingRef}, due on ${c.dueDate}, and have not had a reply. It remains open.`
    : `Our records show ${eur(c.amount)} in commission on booking ${c.bookingRef} fell due on ${c.dueDate} and remains open.`;
  return `Subject: Commission on booking ${c.bookingRef}, ${c.property}

Dear ${c.property} accounts team,

${opening} Could you confirm when payment was issued, or tell us if anything is missing on our side? The booking reference and the rate terms are attached.

With thanks,
${personName[role]} · Enable, ${role === "owner" ? "agency owner" : "Paris desk"}`;
}

const linkCls = "underline decoration-link-rest underline-offset-4 hover:decoration-ink";

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

/* ── the sheet body: 24 inside, rows stacked ── */
function SheetBody({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1 space-y-[var(--space-6)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">{children}</div>;
}

export default function CommissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <CommissionBody id={id} />
    </Suspense>
  );
}

function CommissionBody({ id }: { id: string }) {
  const { s } = useDemo();
  const money = canViewCommissions(s);
  const c = commissions.find((x) => x.id === id);

  if (!money) {
    return (
      <Page width="wide">
        <PageHeader title="Commission" />
        <Section>
          <p className="max-w-[60ch] type-data">
            Commission figures are not open to you in this agency. {people.owner} can open them in
            Settings.
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
          <p className="type-data text-label-secondary">No commission has this reference.</p>
          <Button asChild variant="link" size="sm" className="mt-[var(--space-3)]">
            <Link href="/commissions">Back to Commissions</Link>
          </Button>
        </Section>
      </Page>
    );
  }

  return <CommissionPage c={c} />;
}

function CommissionPage({ c }: { c: Commission }) {
  const { s, d } = useDemo();
  const search = useSearchParams();

  const st = liveState(s, c);
  const late = isLate(st);
  const settled = settlementFor(s, c);
  const sent = reminderSent(s, c);
  const traveller = travellerHref(s, c.traveller);
  const expected = c.discrepancy?.expected ?? c.amount;
  const actual = c.discrepancy?.actual ?? c.amount;
  /** Villa Ortensia's draft is the store's (the assistant can put it there); every other
      commission drafts locally until it is sent. */
  const storeDraft = c.id === "vo";
  /* Arriving from the ledger's "Draft a reminder" (`?draft=1`): the draft is open. */
  const wantsDraft = search?.get("draft") === "1";
  const [localDraft, setLocalDraft] = useState(() => wantsDraft && !storeDraft);
  const drafting = !sent && (storeDraft ? s.reminder === "draft" : localDraft);
  const followUp = c.state === "chased";
  /** The draft as edited; null until a line is changed, so it signs for whoever is in. */
  const [editedDraft, setEditedDraft] = useState<string | null>(null);
  const draftText = editedDraft ?? draftFor(c, s.role, followUp);

  const [acceptOpen, setAcceptOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [acceptReason, setAcceptReason] = useState("");
  const decided = s.decisions[`discrepancy:${c.id}`];

  const startDraft = () => {
    if (storeDraft) d({ type: "reminder", state: "draft" });
    else setLocalDraft(true);
  };
  const discard = () => {
    setEditedDraft(null);
    if (storeDraft) d({ type: "reminder", state: "idle" });
    else setLocalDraft(false);
  };
  const send = () => {
    d({ type: "decide", id: `reminder:${c.id}`, what: "Reminder sent" });
    if (storeDraft) d({ type: "reminder", state: "sent" });
    setLocalDraft(false);
  };

  useEffect(() => {
    if (wantsDraft && storeDraft && late && !sent && s.reminder === "idle") d({ type: "reminder", state: "draft" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsDraft]);

  /** The owner chasing a booking the advisor holds: said once, before the send. */
  const onBehalfNote = personName[s.role] !== bookingAdvisor ? (
    <p className="mt-[var(--space-2)] type-meta">
      This booking is {bookingAdvisor}&rsquo;s. The reminder goes out in your name and shows in her
      chase log.
    </p>
  ) : null;

  const acceptDiscrepancy = () => {
    const reason = acceptReason.trim();
    if (!reason || !c.discrepancy) return;
    d({ type: "decide", id: `discrepancy:${c.id}`, what: `Accepted: ${reason}` });
    setAcceptOpen(false);
    setAcceptReason("");
    notify(`Accepted ${eur(c.discrepancy.expected - c.discrepancy.actual)} under projection`, {
      detail: c.property,
      undo: () => d({ type: "undecide", id: `discrepancy:${c.id}` }),
    });
  };

  /* The rail's one act, repeated in the ActionBar under 1024. */
  const primary = !late || sent
    ? null
    : drafting
      ? <Button onClick={send}>Send</Button>
      : <Button onClick={startDraft}>{followUp ? "Draft a follow-up" : "Draft a reminder"}</Button>;

  const chase: { what: string; who: string; when: string; note?: string }[] = [
    ...(sent ? [{ what: "Reminder sent", who: personName[sent.by], when: sent.at ? `${sent.at.slice(0, 6)}, ${timeOf(sent.at)}` : "today" }] : []),
    ...(c.state === "chased" ? [{ what: "Reminder sent", who: bookingAdvisor, when: "14 Aug", note: "no reply yet" }] : []),
  ];

  return (
    <Page width="wide">
      <PageHeader title={c.property}>
        <p className="mt-[var(--space-2)] flex flex-wrap items-center gap-x-[var(--space-2)] gap-y-1 type-meta">
          {st === "overdue" ? <Chip tone="warn">overdue</Chip> : <Chip tone="neutral">{st}</Chip>}
          <span>
            Booking <span className="tnum">{c.bookingRef}</span>
            {c.traveller && (
              <> for {traveller ? <Link href={traveller} className={linkCls}>{c.traveller}</Link> : c.traveller}</>
            )}
            {c.productId && (
              <> · <Link href={`/records/${c.productId}`} className={linkCls}>{c.property} record</Link></>
            )}
            {tripsuite && <> · actuals from TripSuite, last synced {tripsuite.lastSuccess}</>}
          </span>
        </p>
      </PageHeader>

      <div className={late ? "doc-layout" : "min-w-0"}>
        {/* ── the body: chapters at column width ── */}
        <div className="min-w-0">
          <Section title="Timeline">
            <div className="divide-y divide-hairline">
              <TimelineRow
                stage={<StatusDot tone="primary">Projected</StatusDot>}
                provenance={<SourceTag kind="portal" label={c.projected.source} />}
              >
                <span className="type-data-strong tnum">{eur(expected)}</span>
                <span className="text-label-secondary"> · rate {c.projected.rate}</span>
                {c.projected.incentive && <Chip tone="neutral" className="ml-[var(--space-2)]">{c.projected.incentive}</Chip>}
              </TimelineRow>

              <TimelineRow
                stage={<StatusDot tone={st === "due" ? "muted" : "primary"}>Due</StatusDot>}
                provenance={<SourceTag kind="portal" label={`terms · ${c.projected.source}`} />}
              >
                <span className="tnum">{c.dueDate}</span>
                {late && c.overdueDays ? <span className="text-label-secondary tnum"> · {c.overdueDays} days overdue</span> : null}
              </TimelineRow>

              <TimelineRow
                stage={<StatusDot tone={st === "paid" ? "primary" : "muted"}>Paid</StatusDot>}
                provenance={
                  settled
                    ? <span className="type-meta">matched by {personName[settled.by]}{settled.at ? `, ${settled.at}` : ""}</span>
                    : <SourceTag kind="tripsuite" label="TripSuite · read-only" />
                }
              >
                {settled ? (
                  <>
                    <span className="type-data-strong tnum">{eur(settled.payment.amount)}</span>
                    <span className="text-label-secondary"> · arrived under {settled.payment.raw}; {settled.reason}</span>
                  </>
                ) : st === "paid" ? (
                  <>
                    <span className="type-data-strong tnum">{eur(actual)}</span>
                    <span className="text-label-secondary tnum"> · {c.paidDate}</span>
                  </>
                ) : (
                  <span className="text-label-secondary">Nothing received yet</span>
                )}
              </TimelineRow>
            </div>
          </Section>

          {(late || chase.length > 0) && (
            <Section title="Chase log" deep>
              {chase.length > 0 ? (
                <Rows>
                  {chase.map((e, i) => (
                    <RowStack
                      key={i}
                      head={
                        <>
                          <span className="min-w-0 truncate type-data-strong">{e.what}</span>
                          <span className="type-meta tnum">{e.when}</span>
                        </>
                      }
                    >
                      By {e.who}{e.note ? ` · ${e.note}` : ""}
                    </RowStack>
                  ))}
                </Rows>
              ) : (
                <p className="type-data text-label-secondary">No reminder sent yet.</p>
              )}
            </Section>
          )}

          {c.discrepancy && (
            <Section title="Projected against actual" deep anchor="difference">
              <div className="divide-y divide-hairline">
                <TimelineRow stage="Expected" provenance={<SourceTag kind="portal" label={`projection · ${c.projected.source}`} />}>
                  <span className="type-data-strong tnum">{eur(c.discrepancy.expected)}</span>
                </TimelineRow>
                <TimelineRow stage="Received" provenance={<SourceTag kind="tripsuite" label="TripSuite remittance · read-only" />}>
                  <span className="type-data-strong tnum">{eur(c.discrepancy.actual)}</span>
                </TimelineRow>
              </div>
              <Warning
                className="mt-[var(--space-4)]"
                title={`${eur(c.discrepancy.expected - c.discrepancy.actual)} under projection`}
                kept={decided ? `${decided.what} · ${personName[decided.by]}, ${decided.at}` : undefined}
                actions={
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setDisputeOpen(true)}>Draft a dispute</Button>
                    <Button variant="secondary" size="sm" onClick={() => setAcceptOpen(true)}>Accept with reason</Button>
                  </>
                }
              >
                Possible causes: {c.discrepancy.causes.join("; ")}.
              </Warning>
            </Section>
          )}

          {c.creditNotRefund && (
            <Section title="Cancellation" deep>
              <p className="max-w-[62ch] type-data">{commissionEdgeCases.creditNotRefund.note}</p>
              <p className="mt-[var(--space-2)] max-w-[62ch] type-data text-label-secondary">
                The cancellation was sent {commissionEdgeCases.unconfirmedCancellation.sentHoursAgo} hours ago
                and the property has not acknowledged it yet.
              </p>
            </Section>
          )}
        </div>

        {/* ── the tool that follows you: the reminder, on every late commission ── */}
        {late && (
          <aside className="doc-rail" data-rail-label="Reminder" data-agent-target={`reminder-${c.id}`}>
            <Section variant="tool" follows title="Reminder">
              {sent ? (
                <>
                  <Done>{sentLine(sent)}</Done>
                  <p className="mt-[var(--space-2)] type-meta">A reply will show in the chase log.</p>
                </>
              ) : drafting ? (
                <>
                  <Label htmlFor="reminder-draft">Reminder to the {c.property} accounts team</Label>
                  <Textarea
                    id="reminder-draft"
                    value={draftText}
                    onChange={(e) => setEditedDraft(e.target.value)}
                    className="mt-[var(--space-2)] min-h-56"
                  />
                  {onBehalfNote}
                  <div className="mt-[var(--space-4)] flex flex-wrap items-center justify-end gap-[var(--space-2)]">
                    <Button variant="secondary" onClick={discard}>Discard</Button>
                    {primary}
                  </div>
                </>
              ) : (
                <>
                  <p className="-mt-[var(--space-2)] type-data text-label-secondary">
                    {followUp
                      ? `A reminder went on 14 Aug with no reply. Draft a follow-up to read and send.`
                      : "Draft a reminder with the booking reference and the rate terms, then read it and send it."}
                  </p>
                  {onBehalfNote}
                  <div className="mt-[var(--space-4)] [&>button]:w-full">{primary}</div>
                </>
              )}
            </Section>
          </aside>
        )}
      </div>

      {primary && <ActionBar>{primary}</ActionBar>}

      {/* ── accept with reason ── */}
      {c.discrepancy && (
        <Sheet open={acceptOpen} onOpenChange={setAcceptOpen}>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Accept the difference</SheetTitle>
              <SheetDescription>
                <span className="tnum">{eur(c.discrepancy.expected - c.discrepancy.actual)}</span> under projection on{" "}
                {c.property}. Your reason goes on the commission with your name and the date.
              </SheetDescription>
            </SheetHeader>
            <SheetBody>
              <div>
                <Label htmlFor="accept-reason">
                  Reason <span className="text-label-secondary">(required)</span>
                </Label>
                <Input
                  id="accept-reason"
                  value={acceptReason}
                  onChange={(e) => setAcceptReason(e.target.value)}
                  placeholder="e.g. currency variance, conversion dated 14 Jul"
                  className="mt-[var(--space-2)]"
                />
              </div>
            </SheetBody>
            <SheetFooter className="sm:flex-row sm:justify-end">
              <SheetClose asChild><Button variant="secondary">Cancel</Button></SheetClose>
              <Button disabled={!acceptReason.trim()} onClick={acceptDiscrepancy}>Accept the difference</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      {/* ── dispute draft (schematic) ── */}
      {c.discrepancy && (
        <Sheet open={disputeOpen} onOpenChange={setDisputeOpen}>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-[var(--space-2)]">
                Dispute draft <SchematicBadge />
              </SheetTitle>
              <SheetDescription>
                Drafted from both figures and where each came from. Sending is not wired in this build.
              </SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p className="whitespace-pre-wrap type-data">
                {`Re: commission remittance, ${c.property} (${c.bookingRef})\n\nWe projected ${eur(c.discrepancy.expected)} under the partner terms and received ${eur(c.discrepancy.actual)}. Possible causes on our side: ${c.discrepancy.causes.join("; ")}. Could you share the remittance breakdown?`}
              </p>
            </SheetBody>
            <SheetFooter className="sm:flex-row sm:justify-end">
              <SheetClose asChild><Button variant="secondary">Close</Button></SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </Page>
  );
}
