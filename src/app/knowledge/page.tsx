"use client";
/**
 * Knowledge vault — the Ledger archetype (§7).
 *
 * A provenance-first table, the verified-source meter, and a widening history on
 * every document. Access defaults are the governance posture: private on arrival,
 * every widening logged.
 */
import React, { useMemo, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { vaultDocs, vaultStats, connections, type VaultDoc } from "@/data/seed";
import { PageHeader, SplitPage } from "@/components/layouts";
import { Chip, Section, NarrationNote, SchematicBadge } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Building2, FileText, HardDrive, History, Lock, Mail, Upload, Users2, X,
} from "lucide-react";

const sourceIcon: Record<string, React.ElementType> = {
  Upload: Upload,
  "Drive sync": HardDrive,
  "Email-in": Mail,
  Intranet: FileText,
};

/** Tab → the source it selects. `null` selects everything. */
const tabSource: Record<string, string | null> = {
  All: null,
  Drive: "Drive sync",
  Email: "Email-in",
  Intranet: "Intranet",
  Uploads: "Upload",
};

function AccessChip({ access }: { access: string }) {
  const icon =
    access === "private" || access === "admin only" ? (
      <Lock className="size-3" aria-hidden />
    ) : access.startsWith("team") ? (
      <Users2 className="size-3" aria-hidden />
    ) : access === "agency" ? (
      <Building2 className="size-3" aria-hidden />
    ) : null;
  return (
    <Chip tone={access === "processing" ? "warn" : "neutral"}>
      {icon}
      {access}
    </Chip>
  );
}

const DESKTOP = "(min-width: 1024px)";
const subscribeDesktop = (cb: () => void) => {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export default function KnowledgeVault() {
  const [tab, setTab] = useState<string>("All");
  const [ownerFilter, setOwnerFilter] = useState(true);
  const [selected, setSelected] = useState<string | null>("Atelier Collection terms.pdf");

  /* The panel is the vault's second column, so it opens with the page — but only
     where there is a column for it. On a phone SplitPage is a sheet, and a sheet
     that opens by itself is an ambush. `null` means "follow the layout"; opening
     or closing it by hand pins it. */
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );
  const [pinned, setPinned] = useState<boolean | null>(null);
  const panelOpen = pinned ?? desktop;
  const setPanelOpen = (v: boolean) => setPinned(v);

  const rows = useMemo(() => {
    const src = tabSource[tab];
    return vaultDocs.filter((doc) => !src || doc.source === src);
  }, [tab]);

  const sel: VaultDoc | undefined = selected
    ? vaultDocs.find((doc) => doc.name === selected)
    : undefined;
  const inbound = connections.find((c) => c.name.startsWith("Inbound mail"));

  const header = (
    <>
      <PageHeader
        title={
          <>
            Knowledge vault
            <Chip tone="neutral">
              <span className="tnum">{vaultStats.total.toLocaleString("en-GB")}</span> documents
            </Chip>
          </>
        }
        actions={
          <Button variant="outline" size="sm">
            <Upload className="size-3.5" aria-hidden /> Upload
            <SchematicBadge />
          </Button>
        }
      >
        {/* ── segmented tabs, with the counts they filter by ── */}
        <div
          role="tablist"
          aria-label="Document sources"
          className="mt-4 -mx-1 flex gap-1 overflow-x-auto px-1 pb-px"
        >
          {Object.entries(vaultStats.tabs).map(([t, n]) => {
            const on = t === tab;
            return (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={on}
                onClick={() => setTab(t)}
                className={cn(
                  "flex shrink-0 cursor-pointer items-baseline gap-2 border-b-2 px-3 py-2 t-body whitespace-nowrap transition-colors",
                  on
                    ? "border-b-foreground font-semibold text-foreground"
                    : "border-b-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
                <span className="tnum t-micro text-muted-foreground">
                  {n.toLocaleString("en-GB")}
                </span>
              </button>
            );
          })}
        </div>
      </PageHeader>

      <NarrationNote>
        Access defaults are the governance posture — a document arrives at the tightest scope its
        source allows, and every widening is an act somebody performs and the log records.
      </NarrationNote>
    </>
  );

  return (
    <SplitPage
      header={header}
      panelOpen={panelOpen}
      onClosePanel={() => setPanelOpen(false)}
      panelTitle="Provenance"
      panel={<ProvenancePanel sel={sel} />}
    >
      {
          <div className="min-w-0">
            {/* ── applied filters and connector state ── */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {ownerFilter && (
                <Chip tone="primary" className="pr-1">
                  <span className="text-muted-foreground">Owner</span> anyone
                  <button
                    type="button"
                    onClick={() => setOwnerFilter(false)}
                    aria-label="Remove the owner filter"
                    className="grid size-4 cursor-pointer place-items-center rounded-full hover:bg-border"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </Chip>
              )}
              <span className="ml-auto flex items-center gap-4 t-meta">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-ok" aria-hidden /> drive · live
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-crit" aria-hidden />{" "}
                  <span className="tnum">3</span> intranet errors
                </span>
              </span>
            </div>

            {/* ── the table ── */}
            <Section
              flush
              className="mt-4"
              bodyClassName="p-0"
              footer={
                <span className="flex flex-wrap items-center gap-3 t-meta">
                  <span className="tnum">
                    {vaultStats.total.toLocaleString("en-GB")} documents · newest first
                  </span>
                  <span className="ml-auto tnum">
                    {rows.length} of {vaultStats.total.toLocaleString("en-GB")} shown
                  </span>
                </span>
              }
            >
              <div className="row-grid px-4 t-micro uppercase tracking-widest text-muted-foreground">
                <span className="row-primary">Document</span>
                <span className="row-meta">Updated</span>
                <span className="row-trailing">Access</span>
              </div>
              <ul>
                {rows.map((doc) => {
                  const Icon = sourceIcon[doc.source] ?? FileText;
                  const isSel = doc.name === selected && panelOpen;
                  return (
                    <li key={doc.name} className="border-t border-border">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(doc.name);
                          setPanelOpen(true);
                        }}
                        aria-pressed={isSel}
                        className={cn(
                          "row-grid w-full cursor-pointer px-4 text-left transition-colors",
                          isSel ? "bg-muted/70" : "hover:bg-muted/40",
                        )}
                      >
                        <span className="row-primary flex items-center gap-3">
                          <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                          <span
                            className={cn(
                              "min-w-0 truncate t-body",
                              isSel && "font-semibold",
                            )}
                          >
                            {doc.name}
                          </span>
                        </span>
                        <span className="row-meta flex items-center gap-2 t-meta">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              doc.state === "processing"
                                ? "bg-warn"
                                : doc.state === "archived"
                                  ? "bg-muted-foreground/40"
                                  : "bg-ok",
                            )}
                            aria-hidden
                          />
                          {doc.state === "processing" ? "processing" : doc.updated}
                        </span>
                        <span className="row-trailing">
                          <AccessChip access={doc.access} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Section>

            <p className="mt-3 t-meta">
              Upload a document, or mail one in —{" "}
              {inbound?.name.replace("Inbound mail — ", "")} · {inbound?.posture}
            </p>
          </div>
      }
    </SplitPage>
  );
}

/* ── the panel: the meter, the document, the history ────────────────────────── */
function ProvenancePanel({ sel }: { sel: VaultDoc | undefined }) {
  return (
    <div className="space-y-4">
      {/* The meter — the vault's one number */}
      <section>
        <h3 className="t-micro uppercase tracking-widest text-muted-foreground">
          Carrying a verified source
        </h3>
        <div className="mt-2 tnum t-display">{vaultStats.verifiedSourcePct}%</div>
        <Progress value={vaultStats.verifiedSourcePct} className="mt-2 h-1.5" />
        <ul className="mt-3 space-y-2 t-body">
          <li className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-ok" aria-hidden /> Verified source ·{" "}
            <span className="tnum">{vaultStats.verified}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden /> No source yet
            · <span className="tnum">{vaultStats.noSource}</span>
          </li>
        </ul>
        <p className="mt-3 t-meta">
          A document with no verified source still answers. It answers with its date and a freshness
          warning attached.
        </p>
      </section>

      {sel ? (
        <>
          <section className="rounded-md border border-border p-4">
            <h3 className="t-title">{sel.name}</h3>
            <dl className="mt-3 space-y-2 t-body">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Source</dt>
                <dd className="text-right">{sel.detail ? "Drive / Partners" : sel.source}</dd>
              </div>
              {sel.detail && (
                <>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">Synced</dt>
                    <dd className="tnum text-right">{sel.detail.synced}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">Used in</dt>
                    <dd className="text-right">{sel.detail.usedIn}</dd>
                  </div>
                </>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="tnum text-right">{sel.updated}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
                <dt className="text-muted-foreground">Access</dt>
                <dd className="text-right">
                  {sel.access === "agency" ? "Whole agency" : sel.access}
                </dd>
              </div>
            </dl>
            <Button size="sm" variant="outline" className="mt-4 w-full">
              <Lock className="size-3.5" aria-hidden /> Manage access
            </Button>
          </section>

          {sel.detail ? (
            <section className="rounded-md border border-border p-4">
              <h3 className="flex items-center gap-2 t-micro uppercase tracking-widest text-muted-foreground">
                <History className="size-3.5" aria-hidden /> History
              </h3>
              <ul className="mt-3 space-y-3">
                {sel.detail.history.map((item, i) => {
                  const parts = item.split(" · ");
                  return (
                    <li key={item} className="flex gap-3 t-body">
                      <span
                        className={cn(
                          "mt-1 size-2 shrink-0 rounded-full",
                          i === 0 ? "bg-primary" : "border border-muted-foreground",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0">
                        {parts[0]}
                        <span className="block t-meta">{parts.slice(1).join(" · ")}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 t-meta">
                Every widening is logged. Nothing becomes readable by accident.
              </p>
            </section>
          ) : (
            <p className="t-meta">
              This document has not been widened since it arrived. Every widening is logged. Nothing
              becomes readable by accident.
            </p>
          )}
        </>
      ) : (
        <p className="t-meta">Select a document to see where it came from and who can read it.</p>
      )}
    </div>
  );
}
