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
import { useDemo } from "@/lib/store";
import { vaultDocs, vaultStats, connections, personName, type VaultDoc } from "@/data/seed";
import { PageHeader, SplitPage } from "@/components/layouts";
import { Absent, Chip, DataList, Section, NarrationNote, SchematicBadge } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Building2, FileText, HardDrive, History, Lock, Mail, Upload, Users2,
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
  const { s } = useDemo();
  const [tab, setTab] = useState<string>("All");
  const [selected, setSelected] = useState<string | null>("Atelier Collection terms.pdf");
  const [accessFor, setAccessFor] = useState<string | null>(null);
  const [accessScope, setAccessScope] = useState<string>("agency");
  const [accessDone, setAccessDone] = useState(false);

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

  /* The vault is permission-filtered like every other surface: a document a role
     cannot open does not appear in the list at all — absent, not masked, and not
     merely badged. `admin only` belongs to the agency lead and operations; a
     `private` document belongs to the advisor who received it, so a colleague
     never sees it. Counting rows after the filter is deliberate: the totals a
     reader is given must be totals of what they can actually reach. */
  const visible = useMemo(() => {
    const canSeeAdminOnly = s.role === "lead" || s.role === "ops";
    const canSeeOwnPrivate = s.role === "advisor";
    return vaultDocs.filter((doc) => {
      if (doc.access === "admin only") return canSeeAdminOnly;
      if (doc.access === "private") return canSeeOwnPrivate;
      return true;
    });
  }, [s.role]);

  const rows = useMemo(() => {
    const src = tabSource[tab];
    return visible.filter((doc) => !src || doc.source === src);
  }, [tab, visible]);

  const sel: VaultDoc | undefined = selected
    ? visible.find((doc) => doc.name === selected)
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
                  "flex h-[var(--control-h-md)] shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 type-data whitespace-nowrap transition-colors",
                  on
                    ? "border-b-foreground font-semibold text-foreground"
                    : "border-b-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
                <span className="tnum type-micro text-muted-foreground">
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
      /* Titled with the document it describes. It was called "Provenance" and opened
         with a vault-wide percentage before switching to the selected file, so two
         scopes sat under one heading and the percentage stayed pinned above whichever
         document you picked. The vault meter has moved to the page. */
      panelTitle={sel ? sel.name : "No document selected"}
      panel={<ProvenancePanel sel={sel} onManageAccess={setAccessFor} />}
    >
      {
          <div className="min-w-0">
            {/* ── applied filters and connector state ── */}
            {/* "Owner: anyone ×" is gone — it dressed the default state as an applied
                filter you could remove, and removing it changed nothing. */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="ml-auto flex items-center gap-4 type-meta">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-ok" aria-hidden /> drive · live
                </span>
                {/* The error count now goes somewhere: it filters to the source it counts. */}
                <button
                  type="button"
                  onClick={() => setTab("Intranet")}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1 transition-colors hover:bg-muted"
                >
                  <span className="size-2 rounded-full bg-crit" aria-hidden />
                  <span className="tnum">3</span> intranet errors
                </button>
              </span>
            </div>

            {/* The vault's one number, on the page it describes rather than pinned above
                whichever document happened to be selected. */}
            <Section className="mt-4" title="Carrying a verified source">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <span className="tnum type-data-strong">{vaultStats.verifiedSourcePct}%</span>
                <span className="flex min-w-[180px] flex-1 flex-col gap-2">
                  <Progress value={vaultStats.verifiedSourcePct} className="h-1" />
                  <span className="flex flex-wrap items-center gap-x-4 type-meta">
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-ok" aria-hidden /> verified ·{" "}
                      <span className="tnum">{vaultStats.verified}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden /> no
                      source yet · <span className="tnum">{vaultStats.noSource}</span>
                    </span>
                  </span>
                </span>
              </div>
              <p className="mt-3 type-meta">
                A document with no verified source still answers — with its date and a freshness
                warning attached.
              </p>
            </Section>

            {/* ── the table ── */}
            <Section
              variant="list"
              className="mt-4"
              /* The facets total 1,284 and the list holds eleven. Rather than imply a
                 pagination that does not exist, the footer says which of the two numbers
                 is the build and which is the vault. */
              /* Two slots, stacked at narrow and split at wide — not `ml-auto` across a
                 wrap, which dropped the sample note 27px and right-aligned it under the
                 count at 375px. */
              footer={
                <span className="flex flex-col gap-1 type-meta sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <span className="shrink-0">
                    <span className="tnum">{rows.length}</span> shown · newest first
                  </span>
                  <span className="sm:text-right">
                    This reconstruction carries a working sample of the{" "}
                    <span className="tnum">{vaultStats.total.toLocaleString("en-GB")}</span>{" "}
                    documents. Paging is not built.
                  </span>
                </span>
              }
            >
              <div className="row-grid px-4 type-micro uppercase tracking-widest text-muted-foreground">
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
                        aria-label={`${doc.name} — ${doc.source}, ${doc.access}`}
                        className={cn(
                          "row-grid w-full cursor-pointer px-4 text-left transition-colors",
                          isSel ? "bg-muted/70" : "hover:bg-muted/40",
                        )}
                      >
                        <span className="row-primary flex items-center gap-3">
                          <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                          <span
                            className={cn(
                              "min-w-0 truncate type-data",
                              isSel && "font-semibold",
                            )}
                          >
                            {doc.name}
                          </span>
                        </span>
                        <span className="row-meta flex items-center gap-2 type-meta">
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
                          {/* The word "processing" used to fill both this column and the
                              access column, so one state read as two different facts.
                              Updated keeps its date; access says it is not yet assigned. */}
                          {doc.updated}
                        </span>
                        <span className="row-trailing">
                          {doc.access === "processing"
                            ? <Absent reason="pending" />
                            : <AccessChip access={doc.access} />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Section>

            <p className="mt-3 type-meta">
              Upload a document, or mail one in —{" "}
              {inbound?.name.replace("Inbound mail — ", "")} · {inbound?.posture}
            </p>

            {/* Manage access — widening is an act, and the act is attributed and logged */}
            <Sheet
              open={!!accessFor}
              onOpenChange={(o) => { if (!o) { setAccessFor(null); setAccessDone(false); } }}
            >
              <SheetContent side="right" className="w-full sm:max-w-[460px]">
                <SheetHeader>
                  <SheetTitle>Access · {accessFor}</SheetTitle>
                  <SheetDescription>
                    A document arrives at the tightest scope its source allows. Widening it is
                    deliberate, attributed and recorded in this document&rsquo;s history.
                  </SheetDescription>
                </SheetHeader>
                <div className="px-4">
                  <RadioGroup value={accessScope} onValueChange={setAccessScope} className="gap-3">
                    {[
                      { v: "private", label: "Private", detail: "Only you. Never reaches another desk's answers." },
                      { v: "team · Paris", label: "Team · Paris", detail: "The Paris desk. Answers for anyone on it may cite this." },
                      { v: "agency", label: "Whole agency", detail: "Every advisor. The widest scope, and the hardest to walk back." },
                    ].map((o) => (
                      <div key={o.v} className="flex items-start gap-3">
                        <RadioGroupItem value={o.v} id={`acc-${o.v}`} className="mt-1" />
                        <Label htmlFor={`acc-${o.v}`} className="flex flex-col items-start gap-1 font-normal">
                          <span className="type-data-strong">{o.label}</span>
                          <span className="type-meta">{o.detail}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {accessDone && (
                    <p className="mt-4 rounded-md border border-ok/40 bg-ok/10 p-3 type-meta">
                      Access set to {accessScope} · {personName[s.role]} · today. Recorded in this
                      document&rsquo;s history.
                    </p>
                  )}
                </div>
                <SheetFooter>
                  <Button variant="outline" onClick={() => setAccessFor(null)}>Close</Button>
                  <Button disabled={accessDone} onClick={() => setAccessDone(true)}>
                    Apply and log
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
      }
    </SplitPage>
  );
}

/* ── the panel: the meter, the document, the history ────────────────────────── */
function ProvenancePanel({ sel, onManageAccess }: { sel: VaultDoc | undefined; onManageAccess: (name: string) => void }) {
  return (
    <div className="space-y-4">
      {sel ? (
        <>
          <section className="rounded-md border border-border p-4">
            <h3 className="type-data-strong">{sel.name}</h3>
            {/* The same DataList every other panel uses. */}
            <DataList
              className="mt-3"
              rows={[
                { label: "Source", value: sel.detail ? "Drive / Partners" : sel.source },
                ...(sel.detail
                  ? [
                      { label: "Synced", value: <span className="tnum">{sel.detail.synced}</span> },
                      { label: "Used in", value: sel.detail.usedIn },
                    ]
                  : []),
                { label: "Updated", value: <span className="tnum">{sel.updated}</span> },
                {
                  label: "Access",
                  value: sel.access === "processing"
                    ? null
                    : sel.access === "agency" ? "Whole agency" : sel.access,
                  absent: "pending" as const,
                },
              ]}
            />
            {/* Widening a scope is the vault's own governance claim — "every widening is
                an act somebody performs and the log records" — so this was the wrong
                control to leave inert. It opens the act, and the act is attributed. */}
            <Button
              size="sm"
              variant="outline"
              className="mt-4 w-full"
              onClick={() => onManageAccess(sel.name)}
            >
              <Lock className="size-3.5" aria-hidden /> Manage access
            </Button>
          </section>

          {sel.detail ? (
            <section className="rounded-md border border-border p-4">
              <h3 className="flex items-center gap-2 type-micro uppercase tracking-widest text-muted-foreground">
                <History className="size-3.5" aria-hidden /> History
              </h3>
              <ul className="mt-3 space-y-3">
                {sel.detail.history.map((item, i) => {
                  const parts = item.split(" · ");
                  return (
                    <li key={item} className="flex gap-3 type-data">
                      <span
                        className={cn(
                          "mt-1 size-2 shrink-0 rounded-full",
                          i === 0 ? "bg-primary" : "border border-muted-foreground",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0">
                        {parts[0]}
                        <span className="block type-meta">{parts.slice(1).join(" · ")}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 type-meta">
                Every widening is logged. Nothing becomes readable by accident.
              </p>
            </section>
          ) : (
            <p className="type-meta">
              This document has not been widened since it arrived. Every widening is logged. Nothing
              becomes readable by accident.
            </p>
          )}
        </>
      ) : (
        <p className="type-meta">Select a document to see where it came from and who can read it.</p>
      )}
    </div>
  );
}
