"use client";
/**
 * Confirm new records — the extraction review queue. The Ledger archetype.
 * Nothing extracted becomes truth until a named person confirms it.
 */
import Link from "next/link";
import { useDemo } from "@/lib/store";
import { candidates, confirmedRecently } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, Section, NarrationNote } from "@/components/bits";
import { CircleDashed } from "lucide-react";

export default function ReviewQueue() {
  const { s } = useDemo();
  const inReview = candidates.length + (s.requestFiled ? 1 : 0);

  return (
    <Page width="wide">
      <PageHeader
        title={
          <>
            Confirm new records
            <Chip tone="primary">
              <span className="tnum">{inReview}</span> in review
            </Chip>
          </>
        }
      >
        <p className="mt-2 max-w-[62ch] t-body text-muted-foreground">
          A candidate never surfaces in answers, cards, or search until a named person confirms it.
        </p>
      </PageHeader>

      <NarrationNote>
        The pipeline proposes; people decide. Below the reliability bar, auto-commit destroys trust
        faster than a missing record does.
      </NarrationNote>

      <Section
        flush
        className="mt-4"
        bodyClassName="p-0"
      >
        <div className="row-grid px-4 t-micro uppercase tracking-widest text-muted-foreground">
          <span className="row-primary">Candidate</span>
          <span className="row-meta">Source</span>
          <span className="row-trailing">State</span>
        </div>
        <ul>
          {candidates.map((c) => {
            const confirmed = c.id === "sereno" && s.candidateConfirmed;
            return (
              <li key={c.id} className="border-t border-border">
                <Link
                  href={`/admin/review/${c.id}`}
                  className="row-grid px-4 transition-colors hover:bg-muted/40"
                >
                  <span className="row-primary">
                    <span className="block truncate type-data-strong">{c.name}</span>
                    <span className="block truncate font-mono t-micro text-muted-foreground">
                      {c.uri}
                    </span>
                  </span>
                  <span className="row-meta t-meta">{c.from}</span>
                  <span className="row-trailing">
                    {confirmed ? (
                      <Chip tone="ok">confirmed today</Chip>
                    ) : c.kind === "new" ? (
                      <Chip tone="primary">new candidate</Chip>
                    ) : c.kind === "duplicate" ? (
                      <Chip tone="warn">possible duplicate</Chip>
                    ) : (
                      <Chip tone="crit">
                        <CircleDashed className="size-3" aria-hidden /> held: low confidence
                      </Chip>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
          {s.requestFiled && (
            <li className="row-grid border-t border-border px-4">
              <span className="row-primary">
                <span className="block truncate type-data-strong">Requested from directory</span>
                <span className="block truncate font-mono t-micro text-muted-foreground">
                  advisor request · gap logged
                </span>
              </span>
              <span className="row-meta t-meta">advisor request</span>
              <span className="row-trailing">
                <Chip tone="neutral">
                  <CircleDashed className="size-3" aria-hidden /> awaiting extraction
                </Chip>
              </span>
            </li>
          )}
        </ul>
      </Section>

      {/* The two essays that used to sit here — scope inheritance, bulk seeding — are
          gone. One described a feature that does not exist, and both explained the
          queue to someone already looking at it. Scope inheritance is demonstrated on
          the candidate itself, where a private source produces a private record.

          What sits here instead is what the queue has already cleared: three rows above
          an empty half-page read as a broken screen, and an empty queue is the state
          this surface is built to reach. */}
      <Section
        flush
        className="mt-4"
        title="Confirmed"
        chips={<Chip tone="neutral"><span className="tnum">{confirmedRecently.length}</span> in the last two days</Chip>}
        bodyClassName="p-0"
      >
        <ul>
          {confirmedRecently.map((c, i) => (
            <li key={c.id} className={i > 0 ? "border-t border-border" : undefined}>
              <div className="px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="type-data-strong">{c.name}</span>
                  <span className="font-mono t-micro text-muted-foreground">{c.uri}</span>
                  <span className="ml-auto t-meta">{c.by} · {c.when}</span>
                </div>
                <p className="mt-1 t-meta">{c.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </Page>
  );
}
