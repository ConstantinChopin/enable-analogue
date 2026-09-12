"use client";
/**
 * Publish queue — where the owner decides what the whole agency sees
 * (docs/rebuild/05-two-roles.md, "One sharing rule, for everything"; journey O6).
 *
 * Sharing with a colleague or a team takes effect at once. Sharing with the whole agency
 * waits here until the owner releases it — a note, a notice, a record, a document, a
 * trip, a traveller profile or a forwarded mail alike — and it goes out with its author
 * kept. She may instead return it with a note, which reaches its author. The queue is
 * the store's (`queueItems`): the seeded day plus whatever R. Devane shared agency-wide
 * this session; every decision is the store's too (`released`), so it survives a sign-out.
 *
 * Chapters, in order: Publish queue (one row per item: kind, what it is, who shared it,
 * what the owner reads before releasing it, its state) · Who the whole agency is (the
 * audience a release reaches, quiet).
 *
 * The one primary — "Publish to the whole agency" — sits at the bottom of the tool that
 * follows (Queue), naming the next waiting item it is allowed to publish, and is absent
 * when none remains. Each waiting row keeps a secondary "Publish" so the act is reachable
 * where the item is read, and a text action "Return with a note" that opens a sheet whose
 * filled action is "Return" (a note is required). A forwarded mail is read in its source
 * sheet before it can be published, from the row or the rail; opening that sheet is what
 * unlocks it. Publication state is carried by Chip only.
 */
import React, { useState } from "react";
import { adminPolicy, people, type QueueItem, type QueueKind } from "@/data/seed";
import { useDemo, queueItems } from "@/lib/store";
import { Page, PageHeader } from "@/components/layouts";
import {
  Chip, Section, NarrationNote, ConfirmBanner, Rows, Row, RowStack, DataList,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";

/** The kind, in words. */
const kindLabel: Record<QueueKind, string> = {
  note: "Note",
  notice: "Notice",
  record: "Record",
  document: "Document",
  trip: "Trip",
  traveller: "Traveller",
  mail: "Forwarded mail",
};

export default function AdminPublish() {
  const { s, d } = useDemo();
  const items = queueItems(s);

  /** Forwarded mail whose source was opened here. Nothing is published unread. */
  const [read, setRead] = useState<Record<string, boolean>>({});
  /** The item whose source sheet is open. */
  const [sourceOf, setSourceOf] = useState<QueueItem | null>(null);
  /** The item being returned, and the note that goes back with it. */
  const [returning, setReturning] = useState<QueueItem | null>(null);
  const [note, setNote] = useState("");
  const [banner, setBanner] = useState<string | null>(null);

  const waiting = items.filter((q) => !s.released[q.id]);
  const publishedCount = items.filter((q) => s.released[q.id]?.outcome === "published").length;
  const returnedCount = items.filter((q) => s.released[q.id]?.outcome === "returned").length;
  const mayPublish = (q: QueueItem) => q.kind !== "mail" || !!read[q.id];
  const next = waiting.find(mayPublish);

  const publish = (q: QueueItem) => {
    if (!mayPublish(q) || s.released[q.id]) return;
    d({ type: "release", id: q.id, outcome: "published" });
    setBanner(`Published to the whole agency — ${q.by} kept as author.`);
  };

  const openSource = (q: QueueItem) => {
    setRead((m) => ({ ...m, [q.id]: true }));
    setSourceOf(q);
  };

  const commitReturn = () => {
    if (!returning || !note.trim()) return;
    d({ type: "release", id: returning.id, outcome: "returned", note: note.trim() });
    setBanner(`Returned to ${returning.by} with your note.`);
    setReturning(null);
    setNote("");
  };

  return (
    <Page width="wide">
      <PageHeader title="Publish queue">
        <p className="mt-[var(--space-2)] max-w-[62ch] type-data-read text-label-secondary">
          What an advisor shares with the whole agency waits here. Read it, then publish it with
          its author kept, or return it with a note.
        </p>
      </PageHeader>

      <div className="doc-layout">
        {/* ── the body: chapters at column width ── */}
        <div className="min-w-0">
          <NarrationNote>
            One sharing rule for everything: a colleague or a team at once, the whole agency only
            through this queue. It is the single place the owner decides what everyone sees.
          </NarrationNote>

          <div className="space-y-[var(--space-2)] pb-[var(--gap-2)] empty:hidden">
            <ConfirmBanner show={banner !== null}>{banner}</ConfirmBanner>
          </div>

          <Section
            title="Publish queue"
            chips={<Chip tone="neutral"><span className="tnum">{waiting.length}</span> waiting</Chip>}
            footer={
              <p className="type-meta">
                Sharing with a colleague or a team takes effect at once; only the whole agency waits
                for you. Your own agency-wide shares go out directly.
              </p>
            }
          >
            <Rows>
              {items.map((q) => {
                const decided = s.released[q.id];
                const isMail = q.kind === "mail";
                return (
                  <RowStack
                    key={q.id}
                    head={
                      <>
                        <span className="flex min-w-0 items-center gap-[var(--space-2)]">
                          <Chip tone="neutral">{kindLabel[q.kind]}</Chip>
                          <span className="min-w-0 truncate type-data-strong">{q.text}</span>
                        </span>
                        {!decided ? (
                          <Chip tone="neutral">waiting</Chip>
                        ) : decided.outcome === "published" ? (
                          <Chip tone="ok">published</Chip>
                        ) : (
                          <Chip tone="primary">returned</Chip>
                        )}
                      </>
                    }
                  >
                    {q.preview && (
                      <p className="mt-[var(--space-1)] max-w-[62ch] type-data-read text-label">{q.preview}</p>
                    )}
                    {isMail && q.source && (
                      <p className="mt-[var(--space-1)] max-w-[62ch] type-data-read text-label">
                        Arrived by mail from <span className="type-code">{q.source.from}</span> ·{" "}
                        <span className="tnum">{q.source.received}</span>
                      </p>
                    )}
                    <p className="mt-[var(--space-1)]">
                      Shared by {q.by}
                      {!decided && isMail && !read[q.id] && " · read the source before publishing"}
                      {decided?.outcome === "published" && ` · published today by ${people.owner}, author kept`}
                      {decided?.outcome === "returned" && ` · returned today by ${people.owner}`}
                    </p>
                    {decided?.outcome === "returned" && decided.note && (
                      <p className="mt-[var(--space-1)] max-w-[62ch]">Your note: &ldquo;{decided.note}&rdquo;</p>
                    )}
                    {!decided && (
                      <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-3)]">
                        {isMail && (
                          <Button variant="secondary" size="sm" onClick={() => openSource(q)}>Review source</Button>
                        )}
                        {mayPublish(q) && (
                          <Button variant="secondary" size="sm" onClick={() => publish(q)}>Publish</Button>
                        )}
                        <Button variant="link" size="sm" onClick={() => { setNote(""); setReturning(q); }}>
                          Return with a note
                        </Button>
                      </div>
                    )}
                  </RowStack>
                );
              })}
            </Rows>
          </Section>

          <Section title="Who the whole agency is" quiet deep>
            <DataList
              className="max-w-md"
              rows={[
                { label: "Advisors", value: <span className="tnum">{adminPolicy.governed.advisors}</span> },
                { label: "Desks", value: <span className="tnum">{adminPolicy.governed.desks}</span> },
              ]}
            />
            <p className="mt-[var(--space-3)] type-meta">
              A published item reaches every one of them, with its author on it.
            </p>
          </Section>
        </div>

        {/* ── the tool that follows: the queue's count, and the one action ── */}
        <aside className="doc-rail" data-rail-label="Queue">
          <Section variant="tool" follows title="Queue">
            <Rows>
              <Row>
                <span className="row-primary">Waiting</span>
                <span className="row-trailing"><Chip tone="neutral" className="tnum">{waiting.length}</Chip></span>
              </Row>
              <Row>
                <span className="row-primary">Published today</span>
                {/* One shape down the column: a chip on every row, zero included. A bare
                    "0" beside chipped neighbours is the column-shape defect tier 2 catches. */}
                <span className="row-trailing">
                  <Chip tone={publishedCount > 0 ? "ok" : "neutral"} className="tnum">{publishedCount}</Chip>
                </span>
              </Row>
              <Row>
                <span className="row-primary">Returned today</span>
                <span className="row-trailing">
                  <Chip tone={returnedCount > 0 ? "primary" : "neutral"} className="tnum">{returnedCount}</Chip>
                </span>
              </Row>
            </Rows>
            <div className="mt-[var(--space-4)]">
              {next ? (
                <>
                  <p className="mb-[var(--space-2)] type-meta">
                    Next: {kindLabel[next.kind]} · {next.text}
                  </p>
                  <Button className="w-full" onClick={() => publish(next)}>Publish to the whole agency</Button>
                  <p className="mt-[var(--space-2)] text-center type-meta">
                    Published by {people.owner} today. {next.by} stays the author.
                  </p>
                </>
              ) : waiting.length > 0 ? (
                <p className="type-data-read text-label-secondary">
                  What waits arrived by mail. Review its source before it can be published.
                </p>
              ) : (
                <p className="type-data-read text-label-secondary">
                  Nothing waits. What an advisor shares with the whole agency arrives here.
                </p>
              )}
            </div>
          </Section>
        </aside>
      </div>

      {/* Review source — the forwarded mail, as it arrived */}
      <Sheet open={sourceOf !== null} onOpenChange={(o) => { if (!o) setSourceOf(null); }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Forwarded source</SheetTitle>
            <SheetDescription>
              {sourceOf?.source?.subject} — read the mail before it reaches the whole agency.
            </SheetDescription>
          </SheetHeader>
          {sourceOf?.source && (
            <div className="min-h-0 flex-1 space-y-[var(--space-4)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
              <DataList
                rows={[
                  { label: "From", value: <span className="type-code">{sourceOf.source.from}</span> },
                  { label: "Received", value: <span className="tnum">{sourceOf.source.received}</span> },
                  { label: "Forwarded by", value: sourceOf.source.forwardedBy },
                  { label: "Arrived at", value: <span className="type-code">{sourceOf.source.via}</span> },
                ]}
              />
              <blockquote className="rounded-lg bg-sunken px-[var(--space-4)] py-[var(--space-3)] type-prose-quote">
                {sourceOf.source.body}
              </blockquote>
              <p className="type-meta">
                The mail is in the vault as &ldquo;{sourceOf.source.doc}&rdquo;. Publishing it keeps{" "}
                {sourceOf.by} as its author.
              </p>
            </div>
          )}
          <SheetFooter className="sm:flex-row sm:justify-end">
            {sourceOf && !s.released[sourceOf.id] && (
              <Button onClick={() => { publish(sourceOf); setSourceOf(null); }}>
                Publish to the whole agency
              </Button>
            )}
            <SheetClose asChild><Button variant="secondary">Close</Button></SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Return with a note — the item stays where its author shared it */}
      <Sheet open={returning !== null} onOpenChange={(o) => { if (!o) { setReturning(null); setNote(""); } }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Return with a note</SheetTitle>
            <SheetDescription>
              &ldquo;{returning?.text}&rdquo; does not reach the whole agency. It stays shared with the
              people {returning?.by} chose, and your note goes to {returning?.by}.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-[var(--space-2)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
            <Label htmlFor="return-note">
              Note to {returning?.by} <span className="text-label-secondary">(required)</span>
            </Label>
            <Textarea
              id="return-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Keep this to the Paris desk until the spa dates are confirmed."
            />
          </div>
          <SheetFooter className="sm:flex-row sm:justify-end">
            <Button disabled={!note.trim()} onClick={commitReturn}>Return</Button>
            <SheetClose asChild><Button variant="secondary">Cancel</Button></SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Page>
  );
}
