"use client";
/**
 * Publish queue and sharing defaults — the agency lead's governance surface.
 * The Document archetype (§7): main column plus a context rail.
 */
import React, { useState } from "react";
import { people, publishQueue, adminPolicy } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, Section, NarrationNote, ConfirmBanner } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Inbox, ShieldAlert, SlidersHorizontal } from "lucide-react";

export default function AdminPublish() {
  const [published, setPublished] = useState<Record<string, boolean>>({});
  const [banner, setBanner] = useState(false);

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
        <p className="mt-2 max-w-[62ch] t-body text-muted-foreground">
          Every kind of record arrives closed. Opening one is an act somebody performs, and the log
          records it.
        </p>
      </PageHeader>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-4">
          {banner && <ConfirmBanner show>Published agency-wide — owner preserved.</ConfirmBanner>}

          <Section
            flush
            bodyClassName="p-0"
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
              <span className="t-meta">
                An advisor&rsquo;s notice reaches the agency layer only through this review.
                Publication keeps the original owner on the record.
              </span>
            }
          >
            <ul className="divide-y divide-border">
              {publishQueue.map((q) => (
                <li key={q.id} className="row-grid px-4">
                  <span className="row-primary t-body">{q.text}</span>
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
                    ) : (
                      <Button variant="outline" size="sm">
                        {q.action}
                      </Button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            flush
            bodyClassName="p-0"
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
                    <span className="block truncate t-meta">{row.detail}</span>
                  </span>
                  <span className="row-trailing rounded-md border border-border bg-muted px-3 py-1 t-body">
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            flush
            bodyClassName="p-0"
            title={
              <span className="inline-flex items-center gap-2">
                <ShieldAlert className="size-3.5 text-muted-foreground" aria-hidden /> Admin access to
                personal records
              </span>
            }
            chips={<Chip tone="neutral">per agency policy</Chip>}
          >
            <p className="border-b border-border px-4 py-3 t-meta">
              Every admin access is logged with a reason and a time limit, and the owner can be
              notified.
            </p>
            <ul className="divide-y divide-border">
              {adminPolicy.breakGlass.map((row) => (
                <li key={row.when} className="row-grid px-4">
                  <span className="row-primary flex items-start gap-3">
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-warn" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate type-data-strong">
                        {row.actor} {row.action}
                      </span>
                      <span className="block truncate t-meta">
                        reason: {row.reason}
                        {"expiry" in row && row.expiry
                          ? ` · ${row.expiry}`
                          : "note" in row && row.note
                            ? ` · ${row.note}`
                            : ""}
                      </span>
                    </span>
                  </span>
                  <span className="row-trailing tnum t-meta">{row.when}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* ── Context rail ── */}
        <div className="space-y-4">
          <Section flush bodyClassName="p-0" title="Who this applies to">
            <ul className="divide-y divide-border">
              <li className="row-grid px-4">
                <span className="row-primary t-body">Advisors</span>
                <span className="row-trailing tnum t-meta">{adminPolicy.governed.advisors}</span>
              </li>
              <li className="row-grid px-4">
                <span className="row-primary t-body">Admins</span>
                <span className="row-trailing tnum t-meta">{adminPolicy.governed.admins}</span>
              </li>
              <li className="row-grid px-4">
                <span className="row-primary t-body">Desks</span>
                <span className="row-trailing tnum t-meta">{adminPolicy.governed.desks}</span>
              </li>
              <li className="row-grid px-4">
                <span className="row-primary t-body font-semibold">Records governed</span>
                <span className="row-trailing tnum t-body font-semibold">
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
            <p className="flex items-center gap-2 t-body">
              <span className="size-2 rounded-full bg-ok" aria-hidden /> Policy saved
            </p>
            <p className="mt-1 t-meta">{people.leadShort} · 09:12 today</p>
          </Section>
        </div>
      </div>
    </Page>
  );
}
