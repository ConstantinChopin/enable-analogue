"use client";
/** Confirm new records — the extraction review queue (Journey D). Nothing extracted becomes truth until a person confirms it. */
import Link from "next/link";
import { useDemo } from "@/lib/store";
import { candidates } from "@/data/seed";
import { Chip, Section, PageHeader, NarrationNote, SchematicBadge } from "@/components/bits";
import { CircleDashed } from "lucide-react";

export default function ReviewQueue() {
  const { s } = useDemo();

  return (
    <div className="mx-auto max-w-[980px] px-6 py-6">
      <PageHeader crumb="Governance / Confirm new records" title={<>Confirm new records <Chip tone="primary">{candidates.length + (s.requestFiled ? 1 : 0)} in review</Chip></>} />

      <NarrationNote>
        The pipeline proposes; people decide. Below the reliability bar, auto-commit destroys trust — so a candidate never surfaces in answers, cards, or search until a named person confirms it.
      </NarrationNote>

      <Section className="mt-4">
        <ul className="divide-y divide-border text-[13.5px]">
          {candidates.map((c) => {
            const confirmed = c.id === "sereno" && s.candidateConfirmed;
            const body = (
              <>
                <div className="min-w-0">
                  <span className="font-medium">{c.name}</span>
                  <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{c.from} · {c.uri}</div>
                </div>
                <span className="ml-auto" />
                {confirmed ? (
                  <Chip tone="ok">confirmed today</Chip>
                ) : c.kind === "new" ? (
                  <Chip tone="primary">new candidate</Chip>
                ) : c.kind === "duplicate" ? (
                  <Chip tone="warn">possible duplicate</Chip>
                ) : (
                  <Chip tone="crit"><CircleDashed className="size-3" aria-hidden /> held: low confidence</Chip>
                )}
              </>
            );
            return (
              <li key={c.id}>
                <Link href={`/admin/review/${c.id}`} className="flex flex-wrap items-center gap-2 py-2.5 hover:bg-muted/50 -mx-2 px-2 rounded-md">{body}</Link>
              </li>
            );
          })}
          {s.requestFiled && (
            <li className="flex flex-wrap items-center gap-2 py-2.5">
              <div className="min-w-0">
                <span className="font-medium">Requested from directory</span>
                <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">advisor request · gap logged</div>
              </div>
              <span className="ml-auto" />
              <Chip tone="neutral"><CircleDashed className="size-3" aria-hidden /> awaiting extraction</Chip>
            </li>
          )}
        </ul>
        <p className="mt-2 border-t border-border pt-2 text-[12px] text-muted-foreground">
          Admin reviews every product candidate for the first ~3 months, including exact google_place_id matches; programs and promotions stay admin-only.
        </p>
      </Section>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Section title="Scope inheritance">
          <p className="text-[12.5px] text-muted-foreground">
            A derived record inherits the tightest scope of its sources. A record extracted from a private document arrives private; widening it is an explicit, attributed act — never a side effect of confirmation.
          </p>
        </Section>
        <Section title="Bulk seeding" chips={<SchematicBadge />}>
          <p className="text-[12.5px] text-muted-foreground">
            A list import — an openings list, a consortium roster — creates dozens of candidates at once. The queue batch-confirms high-confidence fields and holds the flagged ones; held fields never ride through on a batch.
          </p>
        </Section>
      </div>
    </div>
  );
}
