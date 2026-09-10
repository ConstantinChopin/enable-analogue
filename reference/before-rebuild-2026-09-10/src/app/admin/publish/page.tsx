"use client";
/**
 * Publish queue and sharing defaults — the agency lead's governance surface.
 * The Document archetype (§7): main column plus a context rail.
 */
import React, { useState } from "react";
import { people, publishQueue, adminPolicy, type PublishSource } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, Section, NarrationNote, ConfirmBanner } from "@/components/bits";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Inbox, Mail, ShieldAlert, SlidersHorizontal } from "lucide-react";

export default function AdminPublish() {
  const [published, setPublished] = useState<Record<string, boolean>>({});
  const [banner, setBanner] = useState(false);
  /** "Review source" opens the mail the item arrived on — nothing else. */
  const [source, setSource] = useState<PublishSource | null>(null);

  const pending = publishQueue.filter((q) => !published[q.id]).length;

  return (
    <Page width="wide">
      <PageHeader
        title={
          <>
            Publish queue and sharing defaults
            <Chip tone="neutral">workspace policy</Chip>
          </>
        }
      >
        <p className="mt-2 max-w-[62ch] type-data text-muted-foreground">
          Every kind of record arrives closed. Opening one is an act somebody performs, and the log
          records it.
        </p>
      </PageHeader>

      <div className="doc-layout">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-4">
          {banner && <ConfirmBanner show>Published agency-wide — owner preserved.</ConfirmBanner>}

          <Section
            variant="list"
            title={
              <span className="inline-flex items-center gap-2">
                <Inbox className="size-3.5 text-muted-foreground" aria-hidden /> Publish queue
              </span>
            }
            chips={
              <Chip tone={pending > 0 ? "primary" : "ok"}>
                <span className="tnum">{pending}</span> pending
              </Chip>
            }
            footer={
              <span className="type-meta">
                An advisor&rsquo;s notice reaches the agency layer only through this review.
                Publication keeps the original owner on the record.
              </span>
            }
          >
            <ul className="divide-y divide-border">
              {publishQueue.map((q) => (
                <li key={q.id} className="row-grid px-4">
                  <span className="row-primary type-data">{q.text}</span>
                  <span className="row-trailing">
                    {published[q.id] ? (
                      <Chip tone="ok">published · owner preserved</Chip>
                    ) : q.action.startsWith("Publish") ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setPublished((m) => ({ ...m, [q.id]: true }));
                          setBanner(true);
                        }}
                      >
                        {q.action}
                      </Button>
                    ) : q.source ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSource(q.source ?? null)}
                      >
                        {q.action}
                      </Button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            variant="list"
            title={
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="size-3.5 text-muted-foreground" aria-hidden /> Default
                visibility
              </span>
            }
            chips={
              <Chip tone="neutral">
                <span className="tnum">{adminPolicy.defaults.length}</span> record kinds
              </Chip>
            }
          >
            <ul className="divide-y divide-border">
              {adminPolicy.defaults.map((row) => (
                <li key={row.kind} className="row-grid px-4">
                  <span className="row-primary">
                    <span className="block truncate type-data-strong">{row.kind}</span>
                    <span className="block truncate type-meta">{row.detail}</span>
                  </span>
                  <span className="row-trailing rounded-lg border border-border bg-muted px-3 py-1 type-data">
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            variant="list"
            title={
              <span className="inline-flex items-center gap-2">
                <ShieldAlert className="size-3.5 text-muted-foreground" aria-hidden /> Admin access to
                personal records
              </span>
            }
            chips={<Chip tone="neutral">per agency policy</Chip>}
          >
            <p className="border-b border-border px-4 py-3 type-meta">
              Every admin access is logged with a reason and a time limit, and the owner can be
              notified.
            </p>
            <ul className="divide-y divide-border">
              {adminPolicy.breakGlass.map((row) => (
                <li key={row.when} className="row-grid px-4">
                  {/* The amber dot is gone. Every row in this log carried one, so it
                      distinguished nothing — and being unlabelled it made a colour claim
                      it never explained. It also pushed every row title 20px right of
                      the paragraph above, giving the card two left edges for the sake of
                      a mark that said nothing. The rows say what happened. */}
                  <span className="row-primary flex items-start gap-3">
                    <span className="min-w-0">
                      <span className="block truncate type-data-strong">
                        {row.actor} {row.action}
                      </span>
                      <span className="block truncate type-meta">
                        reason: {row.reason}
                        {"expiry" in row && row.expiry
                          ? ` · ${row.expiry}`
                          : "note" in row && row.note
                            ? ` · ${row.note}`
                            : ""}
                      </span>
                    </span>
                  </span>
                  <span className="row-trailing tnum type-meta">{row.when}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* ── Context rail ── */}
        <div className="space-y-4">
          <Section variant="list" title="Who this applies to">
            <ul className="divide-y divide-border">
              <li className="row-grid px-4">
                <span className="row-primary type-data">Advisors</span>
                <span className="row-trailing tnum type-meta">{adminPolicy.governed.advisors}</span>
              </li>
              <li className="row-grid px-4">
                <span className="row-primary type-data">Admins</span>
                <span className="row-trailing tnum type-meta">{adminPolicy.governed.admins}</span>
              </li>
              <li className="row-grid px-4">
                <span className="row-primary type-data">Desks</span>
                <span className="row-trailing tnum type-meta">{adminPolicy.governed.desks}</span>
              </li>
              <li className="row-grid px-4">
                <span className="row-primary type-data-strong">Records governed</span>
                <span className="row-trailing tnum type-data-strong">
                  {adminPolicy.governed.records.toLocaleString("en-GB")}
                </span>
              </li>
            </ul>
          </Section>

          <NarrationNote>
            Why defaults, not exceptions: a permission model that depends on people remembering to
            close something will leak.
          </NarrationNote>

          <Section title="Last change">
            <p className="flex items-center gap-2 type-data">
              <span className="size-2 rounded-full bg-ok" aria-hidden /> Policy saved
            </p>
            <p className="mt-1 type-meta">{people.leadShort} · 09:12 today</p>
          </Section>
        </div>
      </div>

      {/* Review source — the forwarded mail, as it arrived */}
      <Sheet open={source !== null} onOpenChange={(o) => { if (!o) setSource(null); }}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Mail className="size-3.5 text-muted-foreground" aria-hidden /> Forwarded source
            </SheetTitle>
            <SheetDescription>
              {source?.subject} — read the mail before the notice reaches the agency layer.
            </SheetDescription>
          </SheetHeader>
          {source && (
            <div className="px-4">
              <dl className="divide-y divide-border">
                <div className="row-grid">
                  <dt className="row-primary type-data text-muted-foreground">From</dt>
                  <dd className="row-trailing type-code">{source.from}</dd>
                </div>
                <div className="row-grid">
                  <dt className="row-primary type-data text-muted-foreground">Received</dt>
                  <dd className="row-trailing tnum type-meta">{source.received}</dd>
                </div>
                <div className="row-grid">
                  <dt className="row-primary type-data text-muted-foreground">Forwarded by</dt>
                  <dd className="row-trailing type-data">{source.forwardedBy}</dd>
                </div>
                <div className="row-grid">
                  <dt className="row-primary type-data text-muted-foreground">Arrived at</dt>
                  <dd className="row-trailing type-code">{source.via}</dd>
                </div>
              </dl>
              <blockquote className="mt-4 rounded-lg border border-border bg-subtle p-4 type-data">
                {source.body}
              </blockquote>
              <p className="mt-4 type-meta">
                The mail is in the vault as &ldquo;{source.doc}&rdquo;, at{" "}
                {source.access} scope. Publishing a notice from it stays a separate act,
                and it keeps the original owner.
              </p>
            </div>
          )}
          <SheetFooter>
            <Button variant="outline" onClick={() => setSource(null)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Page>
  );
}
