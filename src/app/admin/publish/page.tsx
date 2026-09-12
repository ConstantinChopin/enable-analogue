"use client";
/**
 * Publish queue and sharing defaults — the agency lead's governance surface,
 * recomposed as a document. Every kind of record arrives closed; opening one is an
 * act somebody performs, and the log records it.
 *
 * Chapters, in order: Publish queue (what arrived, one row each) · Sharing defaults
 * (what each kind of record is when it arrives) · Admin access to personal records
 * (the break-glass log) · Who this applies to (the governed counts, quiet).
 *
 * The one primary — the queued item's own action, "Publish agency-wide (owner
 * preserved)" — sits at the bottom of the tool that follows (Queue), pointed at the
 * next item that can be published. Contract: publish a queued item. The row keeps a
 * secondary "Publish" so the act is reachable where the item is read. "Review source"
 * is the disclosure pattern: a secondary on the row opening the mail in a sheet.
 * Publication state is carried by Chip only.
 */
import React, { useState } from "react";
import { people, publishQueue, adminPolicy, type PublishSource } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import {
  Chip, Section, NarrationNote, ConfirmBanner, Rows, Row, RowStack, DataList, StatusDot,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";

export default function AdminPublish() {
  const [published, setPublished] = useState<Record<string, boolean>>({});
  const [banner, setBanner] = useState(false);
  /** "Review source" opens the mail the item arrived on — nothing else. */
  const [source, setSource] = useState<PublishSource | null>(null);

  const pending = publishQueue.filter((q) => !published[q.id]).length;
  const releasedCount = publishQueue.length - pending;
  const next = publishQueue.find((q) => !published[q.id] && q.action.startsWith("Publish"));

  const publish = (id: string) => {
    setPublished((m) => ({ ...m, [id]: true }));
    setBanner(true);
  };

  return (
    <Page width="wide">
      <PageHeader title="Publish queue and sharing defaults">
        <p className="mt-[var(--space-2)] max-w-[62ch] type-data-read text-label-secondary">
          Every kind of record arrives closed. Opening one is an act somebody performs, and the
          log records it.
        </p>
      </PageHeader>

      <div className="doc-layout">
        {/* ── the body: chapters at column width ── */}
        <div className="min-w-0">
          <NarrationNote>
            Why defaults, not exceptions: a permission model that depends on people remembering to
            close something will leak.
          </NarrationNote>

          <div className="space-y-[var(--space-2)] pb-[var(--gap-2)] empty:hidden">
            <ConfirmBanner show={banner}>Published agency-wide — owner preserved.</ConfirmBanner>
          </div>

          <Section
            title="Publish queue"
            chips={<Chip tone="neutral"><span className="tnum">{pending}</span> waiting</Chip>}
            footer={
              <p className="type-meta">
                A submission reaches the agency layer only through this review. Publication keeps
                the original owner on the record.
              </p>
            }
          >
            <Rows>
              {publishQueue.map((q) => {
                const done = !!published[q.id];
                return (
                  <RowStack
                    key={q.id}
                    head={
                      <>
                        <span className="row-primary type-data-strong">{q.text}</span>
                        <span className="flex shrink-0 items-center gap-[var(--space-2)]">
                          {done ? (
                            <Chip tone="ok">published · owner preserved</Chip>
                          ) : q.action.startsWith("Publish") ? (
                            <>
                              <Chip tone="neutral">queued</Chip>
                              <Button variant="secondary" size="sm" onClick={() => publish(q.id)}>Publish</Button>
                            </>
                          ) : q.source ? (
                            <>
                              <Chip tone="neutral">needs reading</Chip>
                              <Button variant="secondary" size="sm" onClick={() => setSource(q.source ?? null)}>
                                {q.action}
                              </Button>
                            </>
                          ) : null}
                        </span>
                      </>
                    }
                  >
                    {done
                      ? `Published by ${people.owner} today · agency-wide · the original owner stays on the record`
                      : q.source
                        ? `arrived by mail · ${q.source.received} · forwarded by ${q.source.forwardedBy} · in the vault at ${q.source.access} scope`
                        : "team scope today · publishing lifts it to the agency layer with its owner"}
                  </RowStack>
                );
              })}
            </Rows>
          </Section>

          <Section title="Who this applies to" quiet deep>
            <DataList
              className="max-w-md"
              rows={[
                { label: "Advisors", value: <span className="tnum">{adminPolicy.governed.advisors}</span> },
                { label: "Admins", value: <span className="tnum">{adminPolicy.governed.admins}</span> },
                { label: "Desks", value: <span className="tnum">{adminPolicy.governed.desks}</span> },
                { label: "Records governed", value: <span className="type-data-strong tnum">{adminPolicy.governed.records.toLocaleString("en-GB")}</span> },
              ]}
            />
            <p className="mt-[var(--space-3)] type-meta">
              <StatusDot tone="ok">Policy saved · {people.ownerShort} · 09:12 today</StatusDot>
            </p>
          </Section>
        </div>

        {/* ── the tool that follows: the queue's count, and the one action ── */}
        <aside className="doc-rail" data-rail-label="Queue">
          <Section variant="tool" follows title="Queue">
            <Rows>
              <Row>
                <span className="row-primary">Waiting</span>
                <span className="row-trailing"><Chip tone="neutral" className="tnum">{pending}</Chip></span>
              </Row>
              <Row>
                <span className="row-primary">Published today</span>
                <span className="row-trailing">
                  {releasedCount > 0
                    ? <Chip tone="ok" className="tnum">{releasedCount}</Chip>
                    : <span className="tnum text-label-secondary">0</span>}
                </span>
              </Row>
            </Rows>
            <div className="mt-[var(--space-4)]">
              {next ? (
                <>
                  <p className="mb-[var(--space-2)] type-meta">Next: {next.text}</p>
                  <Button className="w-full" onClick={() => publish(next.id)}>{next.action}</Button>
                  <p className="mt-[var(--space-2)] text-center type-meta">Attributed to {people.owner}, today. The owner stays on the record.</p>
                </>
              ) : (
                <p className="type-data-read text-label-secondary">
                  Nothing waits to be published. What arrived by mail is read before it is released.
                </p>
              )}
            </div>
          </Section>
        </aside>
      </div>

      {/* Review source — the forwarded mail, as it arrived */}
      <Sheet open={source !== null} onOpenChange={(o) => { if (!o) setSource(null); }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Forwarded source</SheetTitle>
            <SheetDescription>
              {source?.subject} — read the mail before it reaches the agency layer.
            </SheetDescription>
          </SheetHeader>
          {source && (
            <div className="min-h-0 flex-1 space-y-[var(--space-4)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
              <DataList
                rows={[
                  { label: "From", value: <span className="type-code">{source.from}</span> },
                  { label: "Received", value: <span className="tnum">{source.received}</span> },
                  { label: "Forwarded by", value: source.forwardedBy },
                  { label: "Arrived at", value: <span className="type-code">{source.via}</span> },
                ]}
              />
              <blockquote className="rounded-lg bg-sunken px-[var(--space-4)] py-[var(--space-3)] type-prose-quote">
                {source.body}
              </blockquote>
              <p className="type-meta">
                The mail is in the vault as &ldquo;{source.doc}&rdquo;, at {source.access} scope.
                Publishing from it stays a separate act, and it keeps the original owner.
              </p>
            </div>
          )}
          <SheetFooter className="sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setSource(null)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Page>
  );
}
