"use client";
/**
 * Unmatched payments — the owner's third queue. A commission payment that arrived
 * without a booking reference waits here until a person matches it to a booking, with
 * a reason, and the reason is kept.
 *
 * Triage, as every queue (UX sweep COL-05, COL-12, COL-13, FB-06, VIS-096, 2026-09-28):
 *   list       the payments still to match; selecting one opens it in the inspector.
 *              Nothing is acted on from a row.
 *   inspector  the payment (amount, the name it arrived under, when) and its candidates,
 *              each an open commission with its amount, traveller, due date and the
 *              difference from this payment, strongest first, so "EUR 862 is exactly
 *              what ML-1108 owes" is on the screen rather than left to be noticed. A
 *              reason is required.
 *   footer     the one act, naming its target: "Match to CD-3301". After it the
 *              selection moves to the next payment, the count drops, and a toast offers
 *              Undo for ten seconds (store `matchPaymentTo` / `unmatchPayment`).
 *   Closed     what was matched this session, then the desk's earlier matches.
 * The rail that repeated the list and a third count is gone; each thing is said once.
 * A matched payment marks its commission paid on /commissions (../commissions/ledger.ts).
 */
import { Suspense, useState } from "react";
import Link from "next/link";
import { useDemo, canViewCommissions } from "@/lib/store";
import { closedPayments, commissions, orphanedPayments, personName } from "@/data/seed";
import { PageHeader, SplitPage, useQueryState } from "@/components/layouts";
import { Chip, Section, Rows, RowStack, DataList, Done } from "@/components/bits";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { eur, matchedCandidate, timeOf } from "@/app/commissions/ledger";

type Payment = (typeof orphanedPayments)[number];
type Candidate = Payment["candidates"][number];

const commissionOf = (cand: Candidate) => commissions.find((c) => c.id === cand.commission);

/** The difference between what arrived and what the commission owes, in words. */
function difference(p: Payment, cand: Candidate) {
  const c = commissionOf(cand);
  if (!c) return "";
  const diff = c.amount - p.amount;
  if (diff === 0) return "the same amount";
  return diff > 0 ? `${eur(diff)} more than this payment` : `${eur(-diff)} less than this payment`;
}

const linkCls = "underline decoration-link-rest underline-offset-4 hover:decoration-ink";

export default function ResolutionQueue() {
  return (
    <Suspense fallback={null}>
      <Queue />
    </Suspense>
  );
}

function Queue() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s);
  const [sel, setSel] = useQueryState("sel");
  /** The candidate and reason being chosen, per payment. */
  const [forms, setForms] = useState<Record<string, { ref: string; reason: string }>>({});

  const open = orphanedPayments.filter((p) => !matchedCandidate(s, p));
  const matchedNow = orphanedPayments.filter((p) => matchedCandidate(s, p));
  const active = orphanedPayments.find((p) => p.id === sel) ?? null;
  const form = active ? forms[active.id] ?? { ref: "", reason: "" } : { ref: "", reason: "" };
  const setForm = (patch: Partial<{ ref: string; reason: string }>) =>
    active && setForms((m) => ({ ...m, [active.id]: { ...form, ...patch } }));

  const amount = (p: { amount: number }) => (money ? eur(p.amount) : "A payment");

  const match = () => {
    if (!active) return;
    const cand = active.candidates.find((c) => c.ref === form.ref);
    const c = cand && commissionOf(cand);
    if (!cand || !c || !form.reason.trim()) return;
    d({ type: "matchPaymentTo", id: active.id, ref: cand.ref, reason: form.reason.trim() });
    /* The queue moves on: the next payment still to match, or nothing. */
    const next = open.find((p) => p.id !== active.id);
    setSel(next?.id ?? null);
    const id = active.id;
    notify(`Matched ${amount(active)} to ${c.bookingRef}`, {
      detail: `${c.property} shows as paid.`,
      undo: () => d({ type: "unmatchPayment", id }),
      seconds: 10,
    });
  };

  const chosen = active?.candidates.find((c) => c.ref === form.ref);
  const chosenCommission = chosen && commissionOf(chosen);

  const header = (
    <PageHeader title="Unmatched payments" count={`${open.length} to match`} />
  );

  const row = (p: Payment) => {
    const on = sel === p.id;
    return (
      <li
        key={p.id}
        data-agent-target={`payment-${p.id}`}
        data-state={on ? "selected" : undefined}
        className="row-select -mx-[var(--space-3)] px-[var(--space-3)]"
      >
        <button
          type="button"
          aria-pressed={on}
          onClick={() => setSel(on ? null : p.id)}
          className="row-stack block w-full cursor-pointer text-left"
        >
          <span className="row-stack-head">
            <span className="row-primary min-w-0 truncate">
              <span className="type-data-strong tnum">{amount(p)}</span>
              <span className="text-label-secondary"> under {p.raw}</span>
            </span>
            <Chip tone="neutral">{p.candidates.length} {p.candidates.length === 1 ? "candidate" : "candidates"}</Chip>
          </span>
          <span className="row-stack-body block type-meta">{p.note} · received {p.received.toLowerCase()}</span>
        </button>
      </li>
    );
  };

  return (
    <SplitPage
      header={header}
      panelOpen={Boolean(active)}
      onClosePanel={() => setSel(null)}
      panelTitle={active ? `${amount(active)} under ${active.raw}` : "Payment"}
      panel={active ? (
        <PaymentPanel
          p={active}
          money={money}
          form={form}
          setForm={setForm}
        />
      ) : null}
      footer={active && !matchedCandidate(s, active) ? (
        <div className="space-y-[var(--space-2)]">
          <Button className="w-full" disabled={!chosen || !form.reason.trim()} onClick={match}>
            {chosenCommission ? `Match to ${chosenCommission.bookingRef}` : "Match payment"}
          </Button>
          <p className="text-center type-meta">
            {chosenCommission
              ? `${chosenCommission.property}'s commission shows as paid. The booking itself is not changed.`
              : "Choose the booking it belongs to, and say why."}
          </p>
        </div>
      ) : undefined}
    >
      <Section title="To match">
        {open.length > 0 ? (
          <Rows>{open.map(row)}</Rows>
        ) : (
          <p className="type-data text-label-secondary">Every payment is matched.</p>
        )}
      </Section>

      <Section title="Closed" deep>
        <Rows>
          {/* Matched this session, first, in the same shape as the desk's earlier ones. */}
          {matchedNow.map((p) => {
            const cand = matchedCandidate(s, p);
            const c = cand && commissionOf(cand);
            const rec = s.payments[p.id];
            return (
              <RowStack
                key={p.id}
                head={
                  <>
                    <span className="row-primary min-w-0 truncate">
                      {money && <span className="type-data-strong tnum">{eur(p.amount)} · </span>}
                      <span className={money ? undefined : "type-data-strong"}>{c ? `${c.bookingRef} · ${c.property}` : p.raw}</span>
                    </span>
                    <span className="type-meta tnum">{rec ? `${personName[rec.by]} · Today ${timeOf(rec.at)}` : "the assistant · Today"}</span>
                  </>
                }
              >
                {rec?.reason ?? "Matched through the assistant."}
              </RowStack>
            );
          })}
          {closedPayments.map((p) => (
            <RowStack
              key={p.id}
              head={
                <>
                  <span className="row-primary min-w-0 truncate">
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
    </SplitPage>
  );
}

/* ── the inspector: the payment, and the bookings it could belong to ──────────── */
function PaymentPanel({
  p, money, form, setForm,
}: {
  p: Payment;
  money: boolean;
  form: { ref: string; reason: string };
  setForm: (patch: Partial<{ ref: string; reason: string }>) => void;
}) {
  const { s } = useDemo();
  const matched = matchedCandidate(s, p);
  const record = s.payments[p.id];

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <DataList
        rows={[
          ...(money ? [{ label: "Amount", value: <span className="tnum">{eur(p.amount)}</span> }] : []),
          { label: "Arrived under", value: p.raw },
          { label: "Received", value: <span className="tnum">{p.received}</span> },
          { label: "What is known", value: p.note },
        ]}
      />

      {matched ? (
        <div className="space-y-[var(--space-2)]">
          <MatchLine p={p} cand={matched} money={money} />
          {record?.reason && <p className="type-data text-label-secondary">Reason: &ldquo;{record.reason}&rdquo;</p>}
          <Done>
            Matched · {record ? `${timeOf(record.at)} · ${personName[record.by]}` : "through the assistant"}
          </Done>
        </div>
      ) : (
        <>
          <fieldset>
            <legend className="type-data-strong">Which booking is it for?</legend>
            <p className="mt-1 type-meta">Open commissions it could settle, strongest first.</p>
            <RadioGroup value={form.ref} onValueChange={(v) => setForm({ ref: v })} className="mt-[var(--space-3)] gap-[var(--space-2)]">
              {p.candidates.map((cand) => {
                const id = `cand-${p.id}-${cand.commission}`;
                return (
                  <label
                    key={cand.ref}
                    htmlFor={id}
                    className="flex cursor-pointer items-start gap-[var(--space-3)] rounded-lg border border-hairline p-[var(--space-3)] transition-colors duration-200 ease-standard hover:border-stroke-hover has-[[data-state=checked]]:border-selected"
                  >
                    <RadioGroupItem value={cand.ref} id={id} className="mt-1" />
                    <MatchLine p={p} cand={cand} money={money} />
                  </label>
                );
              })}
            </RadioGroup>
          </fieldset>
          <div>
            <Label htmlFor="match-reason">Reason <span className="text-label-secondary">(required)</span></Label>
            <Input
              id="match-reason"
              value={form.reason}
              onChange={(e) => setForm({ reason: e.target.value })}
              placeholder="e.g. same amount; the booker confirmed by phone"
              className="mt-[var(--space-2)]"
            />
          </div>
        </>
      )}
    </div>
  );
}

/** A candidate booking: which commission, whose, how much and when, and how far off. */
function MatchLine({ p, cand, money }: { p: Payment; cand: Candidate; money: boolean }) {
  const c = commissionOf(cand);
  if (!c) return <span className="type-data">{cand.ref}</span>;
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
        <span className="type-data-strong">
          <span className="tnum">{c.bookingRef}</span> · <Link href={`/commissions/${c.id}`} className={linkCls}>{c.property}</Link>
        </span>
        <Chip tone="neutral">{cand.strength}</Chip>
      </span>
      <span className="type-data text-label-secondary">
        {c.traveller}
        {money && <> · <span className="tnum">{eur(c.amount)}</span> due {c.dueDate}</>}
        {c.overdueDays ? <span className="tnum"> · {c.overdueDays} days overdue</span> : null}
      </span>
      <span className={cn("type-meta", difference(p, cand) === "the same amount" && "text-label")}>
        {money && <>{difference(p, cand).replace(/^./, (x) => x.toUpperCase())} · </>}{cand.why}
      </span>
    </span>
  );
}
