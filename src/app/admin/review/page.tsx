"use client";
/**
 * Confirm new records — the extraction review queue, recomposed as a document
 * (docs/rebuild/04-recomposition-brief.md). Nothing extracted becomes truth until a
 * named person confirms it.
 *
 * Chapters, in order: In review (one row per candidate; the row is the link) ·
 * Confirmed (what the queue has already closed — the floor that keeps an emptying
 * queue from reading as a broken screen).
 *
 * The one primary — "Open for review" — sits at the bottom of the tool that follows
 * (Next up), pointed at the first candidate nobody has confirmed. Contract: open a
 * candidate for review. Every row opens its own candidate; the pill names the next.
 * Extraction confidence is carried by Chip only: new candidate · possible duplicate ·
 * held · confirmed.
 */
import Link from "next/link";
import { useDemo } from "@/lib/store";
import { candidates, confirmedRecently } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, Section, Rows, Row, RowStack } from "@/components/bits";
import { Button } from "@/components/ui/button";

type Candidate = (typeof candidates)[number];

export default function ReviewQueue() {
  const { s } = useDemo();
  const inReview = candidates.length + (s.requestFiled ? 1 : 0);
  const isConfirmed = (c: Candidate) => c.id === "sereno" && s.candidateConfirmed;
  const next = candidates.find((c) => !isConfirmed(c));

  const stateChip = (c: Candidate) => {
    if (isConfirmed(c)) return <Chip tone="ok">confirmed today</Chip>;
    if (c.kind === "new") return <Chip tone="primary">new candidate</Chip>;
    if (c.kind === "duplicate") return <Chip tone="warn">possible duplicate</Chip>;
    return <Chip tone="crit">held · low confidence</Chip>;
  };

  return (
    <Page width="wide">
      <PageHeader title="Confirm new records">
        <p className="mt-[var(--space-2)] max-w-[62ch] type-data-read text-label-secondary">
          <span className="tnum">{inReview}</span> in review. A candidate never surfaces in
          answers, cards or search until a named person confirms it.
        </p>
      </PageHeader>

      <div className="doc-layout">
        <div className="min-w-0">

          <Section title="In review" chips={<Chip tone="neutral"><span className="tnum">{inReview}</span> waiting</Chip>}>
            <Rows>
              {candidates.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/review/${c.id}`}
                    className="row-grid -mx-[var(--space-2)] rounded-md px-[var(--space-2)] transition-colors duration-200 ease-standard hover:bg-interactive/60"
                  >
                    <span className="row-primary">
                      <span className="block truncate type-data-strong">{c.name}</span>
                      <span className="block truncate type-code text-label-secondary">{c.uri}</span>
                    </span>
                    <span className="row-meta type-meta">{c.from}</span>
                    <span className="row-trailing">{stateChip(c)}</span>
                  </Link>
                </li>
              ))}
              {s.requestFiled && (
                <Row>
                  <span className="row-primary">
                    <span className="block truncate type-data-strong">Requested from directory</span>
                    <span className="block truncate type-code text-label-secondary">advisor request · gap logged</span>
                  </span>
                  <span className="row-meta type-meta">advisor request</span>
                  <span className="row-trailing"><Chip tone="neutral">awaiting extraction</Chip></span>
                </Row>
              )}
            </Rows>
          </Section>

          {/* What the queue has already cleared. An empty queue is the state this surface
              is built to reach, and it has to look like a finished morning. */}
          <Section
            title="Confirmed"
            deep
            chips={<Chip tone="neutral"><span className="tnum">{confirmedRecently.length}</span> since yesterday</Chip>}
          >
            <Rows>
              {confirmedRecently.map((c) => (
                <RowStack
                  key={c.id}
                  head={
                    <>
                      <span className="row-primary flex min-w-0 flex-wrap items-baseline gap-x-[var(--space-3)]">
                        <span className="type-data-strong">{c.name}</span>
                        <span className="truncate type-code text-label-secondary">{c.uri}</span>
                      </span>
                      <span className="type-meta tnum">{c.by} · {c.when}</span>
                    </>
                  }
                >
                  {c.note}
                </RowStack>
              ))}
            </Rows>
          </Section>
        </div>

        {/* The tool that follows: the next candidate, and the one action. */}
        <aside className="doc-rail" data-rail-label="Next up">
          <Section variant="tool" follows title="Next up">
            {next ? (
              <>
                <Rows>
                  <Row>
                    <span className="row-primary">
                      <span className="block truncate type-data-strong">{next.name}</span>
                      <span className="block truncate type-meta">{next.from}</span>
                    </span>
                    <span className="row-trailing">{stateChip(next)}</span>
                  </Row>
                  {next.fields.length > 0 && (
                    <Row>
                      <span className="row-primary text-label-secondary">Fields extracted</span>
                      <span className="row-trailing tnum">{next.fields.length}</span>
                    </Row>
                  )}
                </Rows>
                <div className="mt-[var(--space-4)]">
                  <Button asChild className="w-full">
                    <Link href={`/admin/review/${next.id}`}>Open for review</Link>
                  </Button>
                  <p className="mt-[var(--space-2)] text-center type-meta">
                    Confirmed field by field, stamped with your name and the date.
                  </p>
                </div>
              </>
            ) : (
              <p className="type-data-read text-label-secondary">Nothing is waiting on you.</p>
            )}
          </Section>
        </aside>
      </div>
    </Page>
  );
}
