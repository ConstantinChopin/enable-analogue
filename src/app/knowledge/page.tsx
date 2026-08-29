"use client";
/** Knowledge vault — per the vault plate: provenance-first table + rail (verified meter, doc detail, widening history). */
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { vaultDocs, vaultStats, connections } from "@/data/seed";
import { Chip, Section, PageHeader, NarrationNote } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, HardDrive, Mail, Upload, Lock, Users2, Building2, X, History } from "lucide-react";

type VaultDoc = (typeof vaultDocs)[number];

const sourceIcon: Record<string, React.ElementType> = {
  Upload: Upload,
  "Drive sync": HardDrive,
  "Email-in": Mail,
  Intranet: FileText,
};

const tabSource: Record<string, string | null> = {
  All: null,
  Drive: "Drive sync",
  Email: "Email-in",
  Intranet: "Intranet",
  Uploads: "Upload",
};

function AccessChip({ access }: { access: string }) {
  const icon =
    access === "private" ? <Lock className="size-3" aria-hidden /> :
    access.startsWith("team") ? <Users2 className="size-3" aria-hidden /> :
    access === "agency" ? <Building2 className="size-3" aria-hidden /> :
    access === "admin only" ? <Lock className="size-3" aria-hidden /> : null;
  return (
    <Chip tone={access === "processing" ? "warn" : "neutral"}>
      {icon}
      {access}
    </Chip>
  );
}

function WideningHistory({ items }: { items: string[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold">
        <History className="size-3.5 text-muted-foreground" aria-hidden /> History
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => {
          const parts = item.split(" · ");
          return (
            <li key={item} className="flex gap-2.5 text-[12.5px]">
              <span className={cn("mt-1 size-2 shrink-0 rounded-full", i === 0 ? "bg-primary" : "border border-muted-foreground")} aria-hidden />
              <span>
                {parts[0]}
                <span className="block text-[11.5px] text-muted-foreground">{parts.slice(1).join(" · ")}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[12px] text-muted-foreground">Every widening is logged. Nothing becomes readable by accident.</p>
    </div>
  );
}

export default function KnowledgeVault() {
  const [tab, setTab] = useState<string>("All");
  const [ownerFilter, setOwnerFilter] = useState(true);
  const [selected, setSelected] = useState<string>("Atelier Collection terms.pdf");

  const rows = vaultDocs.filter((doc) => {
    const src = tabSource[tab];
    return !src || doc.source === src;
  });
  const sel: VaultDoc | undefined = vaultDocs.find((doc) => doc.name === selected);
  const inbound = connections.find((c) => c.name.startsWith("Inbound mail"));

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-6">
      <PageHeader
        crumb="Knowledge / All documents"
        title="Knowledge vault"
        right={
          <div className="flex flex-wrap rounded-md border border-border overflow-hidden">
            {Object.entries(vaultStats.tabs).map(([t, n]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-2.5 py-1 text-[12px] cursor-pointer",
                  t === tab ? "bg-muted font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t} <span className="tnum text-muted-foreground">{n.toLocaleString("en-GB")}</span>
              </button>
            ))}
          </div>
        }
      />

      <NarrationNote>
        The vault plate adopted wholesale: a provenance-first table, the verified-source meter, and a widening history on every document. Access defaults are the governance posture — private on arrival, every widening logged.
      </NarrationNote>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_300px]">
        {/* table */}
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {ownerFilter && (
              <Chip tone="neutral">
                Owner: anyone
                <button onClick={() => setOwnerFilter(false)} aria-label="Remove owner filter" className="cursor-pointer hover:text-foreground">
                  <X className="size-3" aria-hidden />
                </button>
              </Chip>
            )}
            <span className="ml-auto flex items-center gap-3 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-ok" aria-hidden /> drive · live</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-crit" aria-hidden /> 3 intranet errors</span>
            </span>
          </div>

          <Section className="p-0">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              <span className="flex-1">Document</span>
              <span className="hidden w-24 sm:block">Source</span>
              <span className="w-20">Updated</span>
              <span className="w-28 text-right sm:w-32">Access</span>
            </div>
            <ul className="divide-y divide-border text-[13.5px]">
              {rows.map((doc) => {
                const Icon = sourceIcon[doc.source] ?? FileText;
                const isSel = doc.name === selected;
                return (
                  <li key={doc.name}>
                    <button
                      onClick={() => setSelected(doc.name)}
                      className={cn(
                        "flex w-full items-center gap-2 px-4 py-2.5 text-left cursor-pointer hover:bg-muted/50",
                        isSel && "bg-muted/60"
                      )}
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        <span className={cn("truncate", isSel && "font-semibold")}>{doc.name}</span>
                      </span>
                      <span className="hidden w-24 text-muted-foreground sm:block">{doc.source}</span>
                      <span className="flex w-20 items-center gap-1.5">
                        <span className={cn("size-2 rounded-full", doc.state === "processing" ? "bg-warn" : "bg-ok")} aria-hidden />
                        <span className="text-muted-foreground">{doc.state === "processing" ? "processing" : doc.updated}</span>
                      </span>
                      <span className="w-28 text-right sm:w-32"><AccessChip access={doc.access} /></span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2 text-[12px] text-muted-foreground">
              <span className="tnum">{vaultStats.total.toLocaleString("en-GB")} documents · newest first</span>
              <span className="ml-auto tnum">{rows.length} of {vaultStats.total.toLocaleString("en-GB")} shown</span>
            </div>
          </Section>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline"><Upload className="size-3.5" aria-hidden /> Upload</Button>
            <span className="text-[12px] text-muted-foreground">
              or mail it in — {inbound?.name.replace("Inbound mail — ", "")} · {inbound?.posture}
            </span>
          </div>
        </div>

        {/* rail */}
        <div className="space-y-4">
          <Section>
            <div className="text-[12px] text-muted-foreground">Carrying a verified source</div>
            <div className="mt-1 text-[26px] font-semibold tnum">{vaultStats.verifiedSourcePct}%</div>
            <Progress value={vaultStats.verifiedSourcePct} className="mt-2 h-1.5" />
            <ul className="mt-3 space-y-1.5 text-[12.5px]">
              <li className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-ok" aria-hidden /> Verified source · <span className="tnum">{vaultStats.verified}</span></li>
              <li className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden /> No source yet · <span className="tnum">{vaultStats.noSource}</span></li>
            </ul>
            <p className="mt-3 text-[12px] text-muted-foreground">
              A document with no verified source still answers. It answers with its date and a freshness warning attached.
            </p>
          </Section>

          {sel && (
            <Section>
              <div className="text-[13px] font-semibold">{sel.name}</div>
              <dl className="mt-3 space-y-2 text-[12.5px]">
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Source</dt><dd className="text-right">{sel.detail ? "Drive / Partners" : sel.source}</dd></div>
                {sel.detail && (
                  <>
                    <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Synced</dt><dd className="text-right">{sel.detail.synced}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Used in</dt><dd className="text-right">{sel.detail.usedIn}</dd></div>
                  </>
                )}
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Updated</dt><dd className="text-right">{sel.updated}</dd></div>
                <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                  <dt className="text-muted-foreground">Access</dt>
                  <dd className="text-right">{sel.access === "agency" ? "Whole agency" : sel.access}</dd>
                </div>
              </dl>
              <Button size="sm" variant="outline" className="mt-3 w-full"><Lock className="size-3.5" aria-hidden /> Manage access</Button>
            </Section>
          )}

          {sel?.detail && (
            <Section>
              <WideningHistory items={sel.detail.history} />
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
