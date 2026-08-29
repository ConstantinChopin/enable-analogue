"use client";
/** Publish queue + sharing defaults — the agency lead's home (Journey B EP4, admin plate). */
import { useState } from "react";
import { people, publishQueue, adminPolicy } from "@/data/seed";
import { Chip, Section, PageHeader, NarrationNote, ConfirmBanner } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Inbox, ShieldAlert, SlidersHorizontal } from "lucide-react";

export default function AdminPublish() {
  const [published, setPublished] = useState<Record<string, boolean>>({});
  const [banner, setBanner] = useState(false);

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-6">
      <PageHeader crumb="Settings / Admin" title={<>Publish queue &amp; sharing defaults <Chip tone="neutral">workspace policy</Chip></>} />

      <div className="mt-1 grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* ── Main ── */}
        <div className="min-w-0 space-y-4">
          {banner && <ConfirmBanner show>Published agency-wide; owner preserved</ConfirmBanner>}

          <Section title={<span className="inline-flex items-center gap-1.5"><Inbox className="size-3.5 text-muted-foreground" aria-hidden /> Publish queue</span>} chips={<Chip tone="primary">{publishQueue.filter((q) => !published[q.id]).length} pending</Chip>}>
            <ul className="divide-y divide-border text-[13.5px]">
              {publishQueue.map((q) => (
                <li key={q.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <span className="min-w-0">{q.text}</span>
                  <span className="ml-auto" />
                  {published[q.id] ? (
                    <Chip tone="ok">published · owner preserved</Chip>
                  ) : q.action.startsWith("Publish") ? (
                    <Button size="sm" onClick={() => { setPublished((m) => ({ ...m, [q.id]: true })); setBanner(true); }}>{q.action}</Button>
                  ) : (
                    <Button variant="outline" size="sm">{q.action}</Button>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] text-muted-foreground">
              An advisor&apos;s notice reaches the agency layer only through this review. Publication keeps the original owner on the record.
            </p>
          </Section>

          <Section title={<span className="inline-flex items-center gap-1.5"><SlidersHorizontal className="size-3.5 text-muted-foreground" aria-hidden /> Default visibility</span>} chips={<Chip tone="neutral">{adminPolicy.defaults.length} record kinds</Chip>}>
            <ul className="divide-y divide-border">
              {adminPolicy.defaults.map((row) => (
                <li key={row.kind} className="flex flex-wrap items-center gap-2 py-2.5 text-[13.5px]">
                  <div className="min-w-0">
                    <div className="font-medium">{row.kind}</div>
                    <div className="text-[11.5px] text-muted-foreground">{row.detail}</div>
                  </div>
                  <span className="ml-auto rounded-md border border-border bg-muted px-2.5 py-1 text-[12.5px]">{row.value}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={<span className="inline-flex items-center gap-1.5"><ShieldAlert className="size-3.5 text-muted-foreground" aria-hidden /> Admin access to personal records</span>} chips={<Chip tone="neutral">per agency policy</Chip>}>
            <p className="text-[12.5px] text-muted-foreground">
              Every admin access is logged with a reason and a time limit, and the owner can be notified.
            </p>
            <ul className="mt-2 divide-y divide-border text-[13px]">
              {adminPolicy.breakGlass.map((row) => (
                <li key={row.when} className="flex flex-wrap items-start gap-2 py-2.5">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-warn" aria-hidden />
                  <div className="min-w-0">
                    <div className="font-medium">{row.actor} {row.action}</div>
                    <div className="text-[11.5px] text-muted-foreground">reason: {row.reason} · {"expiry" in row && row.expiry ? row.expiry : "note" in row && row.note ? row.note : ""}</div>
                  </div>
                  <span className="ml-auto text-[12px] text-muted-foreground tnum">{row.when}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* ── Rail ── */}
        <div className="space-y-4">
          <Section title="Who this applies to">
            <ul className="text-[13px]">
              <li className="flex items-center justify-between py-1"><span>Advisors</span><span className="tnum text-muted-foreground">{adminPolicy.governed.advisors}</span></li>
              <li className="flex items-center justify-between py-1"><span>Admins</span><span className="tnum text-muted-foreground">{adminPolicy.governed.admins}</span></li>
              <li className="flex items-center justify-between py-1"><span>Desks</span><span className="tnum text-muted-foreground">{adminPolicy.governed.desks}</span></li>
            </ul>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-[13px] font-medium">
              <span>Records governed</span><span className="tnum">{adminPolicy.governed.records.toLocaleString("en-GB")}</span>
            </div>
          </Section>

          <NarrationNote>
            Why defaults, not exceptions: a permission model that depends on people remembering to close something will leak. Every kind of record arrives closed, and opening it is an act somebody performs and the log records.
          </NarrationNote>

          <Section title="Last change">
            <p className="flex items-center gap-1.5 text-[13px]">
              <span className="size-2 rounded-full bg-ok" aria-hidden /> Policy saved
            </p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{people.leadShort} · 09:12 today</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
