"use client";
/**
 * Knowledge vault — recomposed as a document with a ledger (Pass 1.5).
 *
 * Chapters, in order: Needs you (lead and ops only) · Documents (the ledger) ·
 * Carrying a verified source (quiet, deep) · Adding a document (quiet, deep).
 * The inspector is the tool that follows: the selected document's provenance and
 * history, and the ONE primary at its bottom — "Assign access" for a lead or ops
 * (contract: assign access to a document), "Open document" for an advisor
 * (contract: open a document). Text actions (New connection · Upload) sit in
 * the title row.
 *
 * The three Deel defects (01-feedback-deel.md §2 Craft) were all on this surface,
 * and each is now structurally impossible rather than merely fixed:
 *   C1  the bar and its legend read ONE constant, VERIFIED_TONE — there is no
 *       second place a colour could be chosen.
 *   C2  every count on the page goes through count(): digits with a thousands
 *       separator, then the one noun, in one grammar.
 *   C3  the selected row is a TableRow with data-state="selected" (2px ink edge
 *       and a fill, from the primitive); the selected source filter inverts.
 *
 * Access defaults are the governance posture: private on arrival, every widening
 * logged. Colour here means access scope or document state, nothing else.
 *
 * Local components (not promoted to bits): AccessChip, ProvenancePanel.
 */
import React, { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";
import { vaultDocs, vaultStats, connections, personName, type VaultDoc } from "@/data/seed";
import { PageHeader, SplitPage } from "@/components/layouts";
import {
  Chip, DataList, Section, NarrationNote, SchematicBadge, StatusDot, Rows, Row, RowStack, ConfirmBanner,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Building2, FileText, HardDrive, Lock, Mail, Users2, Loader2 } from "lucide-react";

/* ── C1: one tone for the meter and its key ─────────────────────────────────────
   The bar and the legend swatch beneath it both read this. A legend that disagrees
   with its bar would need a second constant, and there is none.                */
const VERIFIED_TONE = "ok" as const;

/* ── C2: one grammar for every count ────────────────────────────────────────────
   Digits with the en-GB thousands separator, then the noun. Nothing on this page
   writes a number any other way, so "3 documents" and "1,284 documents" cannot
   drift into "three errors" beside "700 Drive".                                */
const digits = (v: number) => v.toLocaleString("en-GB");
type Noun = readonly [singular: string, plural: string];
const DOCUMENTS: Noun = ["document", "documents"];
const RECORDS: Noun = ["record", "records"];
function count(v: number, noun: Noun) {
  return (
    <>
      <span className="tnum">{digits(v)}</span> {v === 1 ? noun[0] : noun[1]}
    </>
  );
}

const sourceIcon: Record<string, React.ElementType> = {
  Upload: FileText,
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

/* Every access value is a chip, including the one that is waiting. "Processing"
   used to render as bare text in a column of pills, so the single row awaiting a
   decision was the one that looked like nothing. The tone is document state
   (indexing); the scope values carry an icon and a word, no colour.            */
function AccessChip({ access }: { access: string }) {
  const indexing = access === "processing";
  const icon = indexing ? (
    <Loader2 className="size-[var(--icon-sm)] animate-spin" aria-hidden />
  ) : access === "private" || access === "admin only" ? (
    <Lock className="size-[var(--icon-sm)]" aria-hidden />
  ) : access.startsWith("team") ? (
    <Users2 className="size-[var(--icon-sm)]" aria-hidden />
  ) : access === "agency" ? (
    <Building2 className="size-[var(--icon-sm)]" aria-hidden />
  ) : null;
  return (
    <Chip tone={indexing ? "warn" : "neutral"}>
      {icon}
      {indexing ? "indexing" : access === "agency" ? "whole agency" : access}
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
  /* Connecting a source is an administrative act — it decides what every answer in the
     agency gets built from. The flow itself lives under /admin, which only these two
     roles may enter. */
  const canConnect = s.role === "lead" || s.role === "ops";
  const indexingCount = vaultDocs.filter((doc) => doc.access === "processing").length;
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

  const openDoc = (name: string) => {
    setSelected(name);
    setPanelOpen(true);
  };

  const header = (
    <>
      <PageHeader
        title={<>Knowledge vault <Chip tone="neutral">{count(vaultStats.total, DOCUMENTS)}</Chip></>}
        /* Two ways a document reaches the vault, and they are not the same act.
           Uploading one is an advisor's daily work. Connecting a SOURCE decides what
           the whole agency's answers get built from, and it belongs to the people who
           administer the agency — so the connection action is absent for an advisor
           rather than disabled. Both are text actions: the primary lives in the
           inspector, on the document it acts on. */
        actions={
          <>
            {canConnect && (
              <Button asChild variant="link" size="sm">
                <Link href="/admin/connections?add=1">New connection</Link>
              </Button>
            )}
            <span className="inline-flex items-center gap-[var(--space-2)]">
              <Button variant="link" size="sm">Upload</Button>
              <SchematicBadge />
            </span>
          </>
        }
      >
        {/* ── the source filter: pills, the selected one inverts (C3) ── */}
        <Tabs value={tab} onValueChange={setTab} className="mt-[var(--space-4)]">
          <TabsList aria-label="Document sources" className="max-w-full flex-wrap">
            {Object.entries(vaultStats.tabs).map(([t, c]) => (
              <TabsTrigger key={t} value={t}>
                {t}
                <span className="type-micro tnum">{digits(c)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
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
      panelTitle={sel ? sel.name : "No document selected"}
      panel={<ProvenancePanel sel={sel} onManageAccess={setAccessFor} />}
    >
      <div className="min-w-0">
        {/* ── what needs a decision ──────────────────────────────────────────
            An administrator's job in the vault is to decide what the assistant is
            allowed to answer from. So the decisions lead, each one a way in to the
            thing it counts. An advisor sees none of this: they cannot assign access
            or repair a source, and a queue of other people's work is noise on the
            screen where they came to find a document. */}
        {canConnect && (
          <Section title="Needs you">
            <Rows>
              {indexingCount > 0 && (
                <Row>
                  <span className="row-primary">
                    <StatusDot tone="warn">
                      {count(indexingCount, DOCUMENTS)} indexing, no access set
                    </StatusDot>
                  </span>
                  <span className="row-trailing">
                    <Button variant="secondary" size="sm" onClick={() => setTab("Uploads")}>
                      Review
                    </Button>
                  </span>
                </Row>
              )}
              <Row>
                <span className="row-primary">
                  <StatusDot tone="crit">{count(3, DOCUMENTS)} from the intranet not syncing</StatusDot>
                </span>
                <span className="row-trailing">
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/admin/connections">Open connections</Link>
                  </Button>
                </span>
              </Row>
            </Rows>
          </Section>
        )}

        {/* ── the ledger ── */}
        <Section
          title="Documents"
          /* The facets total 1,284 and the list holds a sample. Rather than imply a
             pagination that does not exist, the footer says which of the two numbers
             is the build and which is the vault — in the same grammar. */
          footer={
            <span className="flex flex-col gap-1 type-meta sm:flex-row sm:items-baseline sm:justify-between sm:gap-[var(--space-4)]">
              <span className="shrink-0">{count(rows.length, DOCUMENTS)} shown · newest first</span>
              <span className="sm:text-right">
                A working sample of the {count(vaultStats.total, DOCUMENTS)} in the vault. Paging is not built.
              </span>
            </span>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Access</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((doc) => {
                const Icon = sourceIcon[doc.source] ?? FileText;
                const isSel = doc.name === selected && panelOpen;
                return (
                  /* C3: the selected row carries data-state="selected" — the primitive
                     draws the 2px ink edge and the fill; the name takes the strong
                     weight. Three differences besides colour, none chosen here. */
                  <TableRow
                    key={doc.name}
                    data-state={isSel ? "selected" : undefined}
                    aria-selected={isSel}
                    tabIndex={0}
                    onClick={() => openDoc(doc.name)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openDoc(doc.name);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <TableCell className={cn("max-w-[32ch] truncate", isSel ? "type-data-strong" : "type-data")}>
                      {doc.name}
                    </TableCell>
                    <TableCell className="text-label-secondary">
                      <span className="inline-flex items-center gap-[var(--space-2)]">
                        <Icon className="size-[var(--icon-md)] shrink-0" aria-hidden />
                        {doc.source}
                      </span>
                    </TableCell>
                    <TableCell className="type-meta tnum">{doc.updated}</TableCell>
                    <TableCell className="text-right">
                      <AccessChip access={doc.access} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Section>

        {/* ── context, not a task ────────────────────────────────────────────
            The screen used to open on this statistic. It is a report — true,
            unactionable — so it sits below the decisions and the ledger, and states
            its own consequence rather than a bare percentage. */}
        <Section title="Carrying a verified source" quiet deep>
          <div className="flex flex-wrap items-center gap-x-[var(--space-6)] gap-y-[var(--space-3)]">
            <span className="type-figure">{vaultStats.verifiedSourcePct}%</span>
            <div className="flex max-w-md flex-1 flex-col gap-[var(--space-2)]">
              <Progress tone={VERIFIED_TONE} value={vaultStats.verifiedSourcePct} />
              <span className="flex flex-wrap items-center gap-x-[var(--space-4)] gap-y-1 type-meta">
                <StatusDot tone={VERIFIED_TONE}>verified · {count(vaultStats.verified, DOCUMENTS)}</StatusDot>
                <StatusDot tone="muted">no source yet · {count(vaultStats.noSource, DOCUMENTS)}</StatusDot>
              </span>
            </div>
          </div>
          <p className="mt-[var(--space-3)] max-w-[60ch] type-data-read text-label-secondary">
            A document with no verified source still answers — with its date and a freshness
            warning attached.
          </p>
        </Section>

        <Section title="Adding a document" quiet deep>
          <p className="max-w-[60ch] type-data-read text-label-secondary">
            Upload a document, or mail one in — {inbound?.name.replace("Inbound mail — ", "")} ·{" "}
            {inbound?.posture}.
          </p>
        </Section>

        {/* ── Manage access — widening is an act, and the act is attributed and logged ── */}
        <Sheet
          open={!!accessFor}
          onOpenChange={(o) => { if (!o) { setAccessFor(null); setAccessDone(false); } }}
        >
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Access · {accessFor}</SheetTitle>
              <SheetDescription>
                A document arrives at the tightest scope its source allows. Widening it is
                deliberate, attributed and recorded in this document&rsquo;s history.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-[var(--space-4)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
              <RadioGroup value={accessScope} onValueChange={setAccessScope} className="gap-[var(--space-3)]">
                {[
                  { v: "private", label: "Private", detail: "Only you. Never reaches another desk's answers." },
                  { v: "team · Paris", label: "Team · Paris", detail: "The Paris desk. Answers for anyone on it may cite this." },
                  { v: "agency", label: "Whole agency", detail: "Every advisor. The widest scope, and the hardest to walk back." },
                ].map((o) => (
                  <div key={o.v} className="flex items-start gap-[var(--space-3)]">
                    <RadioGroupItem value={o.v} id={`acc-${o.v}`} className="mt-px" />
                    <Label htmlFor={`acc-${o.v}`} className="flex flex-col items-start gap-0.5">
                      <span className="type-data-strong">{o.label}</span>
                      <span className="type-meta">{o.detail}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <ConfirmBanner show={accessDone}>
                Access set to {accessScope} · {personName[s.role]} · today. Recorded in this
                document&rsquo;s history.
              </ConfirmBanner>
            </div>
            <SheetFooter className="flex-row justify-end">
              <Button variant="secondary" onClick={() => setAccessFor(null)}>Close</Button>
              <Button disabled={accessDone} onClick={() => setAccessDone(true)}>
                Apply and log
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </SplitPage>
  );
}

/* ── the inspector: the document, its history, and the one action ───────────────
   The SplitPage panel is already the tool on raised paper, so nothing inside it is
   boxed again. Read the role directly rather than threading it down: the panel is
   the only part of this page that offers the way through to review, and only some
   roles get it.                                                                  */
function ProvenancePanel({ sel, onManageAccess }: { sel: VaultDoc | undefined; onManageAccess: (name: string) => void }) {
  const { s } = useDemo();
  const reviewer = s.role === "lead" || s.role === "ops";

  if (!sel) {
    return (
      <p className="type-data-read text-label-secondary">
        Select a document to see where it came from and who can read it.
      </p>
    );
  }

  return (
    <div className="space-y-[var(--space-6)]">
      {/* The same DataList every other panel uses. */}
      <DataList
        rows={[
          { label: "Source", value: sel.detail ? "Drive / Partners" : sel.source },
          ...(sel.detail
            ? [
                { label: "Synced", value: <span className="tnum">{sel.detail.synced}</span> },
                { label: "Used in", value: sel.detail.usedIn },
              ]
            : []),
          { label: "Updated", value: <span className="tnum">{sel.updated}</span> },
          { label: "Access", value: <AccessChip access={sel.access} /> },
        ]}
      />

      <div>
        <h3 className="type-section-quiet">History</h3>
        {sel.detail ? (
          <>
            <Rows className="mt-[var(--space-2)]">
              {sel.detail.history.map((item) => {
                const [head, ...rest] = item.split(" · ");
                return (
                  <RowStack key={item} head={<span className="row-primary type-data">{head}</span>}>
                    {rest.join(" · ")}
                  </RowStack>
                );
              })}
            </Rows>
            <p className="mt-[var(--space-3)] type-meta">
              Every widening is logged. Nothing becomes readable by accident.
            </p>
          </>
        ) : (
          <p className="mt-[var(--space-2)] type-data-read text-label-secondary">
            This document has not been widened since it arrived. Every widening is logged.
            Nothing becomes readable by accident.
          </p>
        )}
      </div>

      {/* A document that arrives here proposes records, and those records wait for a
          person. Only a lead or ops can act on it, so only they are offered the way
          through. */}
      {reviewer && (
        <Rows className="border-t border-hairline">
          <Row>
            <span className="row-primary type-data">
              {count(3, RECORDS)} proposed from the vault, waiting to be confirmed
            </span>
            <span className="row-trailing">
              <Button asChild variant="link" size="sm">
                <Link href="/admin/review">Open review</Link>
              </Button>
            </span>
          </Row>
        </Rows>
      )}

      {/* The one primary, at the bottom of the tool that owns it. For a lead or ops the
          act is assigning access (the vault's governance claim); for an advisor it is
          opening the document, which this build draws and does not wire. Widening a
          scope stays reachable for an advisor as a secondary — a private document is
          theirs to widen. */}
      <div className="space-y-[var(--space-2)] border-t border-hairline pt-[var(--space-4)]">
        {reviewer ? (
          <Button className="w-full" onClick={() => onManageAccess(sel.name)}>
            Assign access
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-[var(--space-2)]">
              <Button className="flex-1">Open document</Button>
              <SchematicBadge />
            </div>
            <Button variant="secondary" size="sm" className="w-full" onClick={() => onManageAccess(sel.name)}>
              Manage access
            </Button>
          </>
        )}
        <p className="text-center type-meta">
          {reviewer
            ? "Widening is attributed, dated and written to this document's history."
            : "Permission holds wherever the document opens."}
        </p>
      </div>
    </div>
  );
}
