"use client";
/**
 * Confirm new records — the extraction review queue. The Ledger archetype.
 * Nothing extracted becomes truth until a named person confirms it.
 */
import Link from "next/link";
import { useDemo } from "@/lib/store";
import { candidates } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, Section, NarrationNote, SchematicBadge } from "@/components/bits";
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
        footer={
          <span className="t-meta">
            Admin reviews every product candidate for the first three months, including exact
            place-id matches. Programmes and promotions stay admin-only.
          </span>
        }
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

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Section title="Scope inheritance">
          <p className="t-body text-muted-foreground">
            A derived record inherits the tightest scope of its sources. A record extracted from a
            private document arrives private; widening it is an explicit, attributed act — never a
            side effect of confirmation.
          </p>
        </Section>
        <Section title="Bulk seeding" chips={<SchematicBadge />}>
          <p className="t-body text-muted-foreground">
            A list import — an openings list, a consortium roster — creates dozens of candidates at
            once. The queue batch-confirms high-confidence fields and holds the flagged ones; a held
            field never rides through on a batch.
          </p>
        </Section>
      </div>
    </Page>
  );
}
