"use client";
/**
 * Knowledge vault — recomposed as a document with a ledger (Pass 1.5), read by both
 * types (docs/rebuild/05-two-roles.md §3).
 *
 * Chapters, in order: Needs you (only when something of this person's is indexing or
 * one of her sources needs attention) · Documents (the ledger) · Carrying a verified
 * source (quiet, deep) · Adding a document (quiet, deep).
 * The inspector is the tool that follows: the selected document's provenance, whose it
 * is, its history, and the ONE primary at its bottom:
 *   owner, on a document from the agency's sources   "Assign access"
 *   everyone else, on every other document           "Open document"
 * An advisor's own document — one she uploaded or forwarded, or indexed from her own
 * mailbox or Drive — is the personal layer. Only she changes who reads it ("Manage
 * access", a secondary); the owner cannot, and does not see it until it is shared with
 * her. Sharing with a colleague or the team is immediate; sharing with the whole agency
 * waits for the owner to release it, and the access sheet says so before she commits.
 * Text actions (New connection · Upload) sit in the title row for both types.
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
 * Access defaults are the governance posture: private on arrival to whoever brought it
 * in, every widening logged. Colour here means access scope or document state, nothing
 * else.
 *
 * Local components (not promoted to bits): AccessChip, ProvenancePanel.
 */
import React, { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";
import {
  vaultDocs, vaultStats, connections, connectionsFor, people, personName,
  type Persona, type VaultDoc,
} from "@/data/seed";
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
import { Building2, FileText, HardDrive, Lock, Mail, User, Users2, Loader2 } from "lucide-react";

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
const SOURCES: Noun = ["source", "sources"];
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

/* ── whose document it is ───────────────────────────────────────────────────────
   The seed says (VaultDoc.by). Absent means it arrived through one of the agency's
   sources: the agency's, and the owner assigns who reads it. A name means a person
   uploaded it or forwarded it to the inbound address: the personal layer — it belongs
   to her even inside an agency, and only she changes who reads it.                 */
type Holder = "agency" | Persona | "colleague";
function holderOf(doc: VaultDoc): Holder {
  if (!doc.by) return "agency";
  if (doc.by === people.advisor) return "user";
  if (doc.by === people.owner) return "owner";
  return "colleague";
}
const holderName = (h: Exclude<Holder, "agency">) => (h === "colleague" ? people.colleague : personName[h]);

/* The words for each access value, as the sheet offers them and the banner repeats them. */
const COLLEAGUE_SHARE = `shared · ${people.colleague}`;
const accessLabel = (v: string) =>
  v === "admin only" ? "administrators only"
  : v === "agency" ? "the whole agency"
  : v === "processing" ? "closed, while it indexes"
  : v;

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
  ) : access.startsWith("shared") ? (
    <User className="size-[var(--icon-sm)]" aria-hidden />
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
  const { s, d } = useDemo();
  const owner = s.role === "owner";
  /* Both types connect sources: an advisor her own mailbox or Drive, the owner the
     agency's. Connecting indexes and never shares, so it needs no gate. */
  const canConnect = true;
  const [tab, setTab] = useState<string>("All");
  const [selected, setSelected] = useState<string | null>("Atelier Collection terms.pdf");

  /* The access sheet, and what was decided in it this session. A share that takes
     effect at once rewrites the document's chip; a user's share with the whole agency
     does not — it waits for the owner, and the document says so. */
  const [accessFor, setAccessFor] = useState<string | null>(null);
  const [accessScope, setAccessScope] = useState<string>("private");
  const [accessDone, setAccessDone] = useState(false);
  const [granted, setGranted] = useState<Record<string, string>>({});
  /* Seeded from the store, so a share sent to the owner's queue survives navigation. */
  const [waiting, setWaiting] = useState<Record<string, true>>(() =>
    Object.fromEntries(
      Object.entries(s.docShares)
        .filter(([, v]) => v.scope === "agency" && v.by === "user")
        .map(([name]) => [name, true as const]),
    ),
  );

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

  /* The vault is permission-filtered like every other surface: a document a person
     cannot open does not appear in the list at all — absent, not masked, and not
     merely badged. `admin only` belongs to the owner. A `private` document, and one
     still indexing, is closed to whoever brought it in: an advisor's to her, and the
     owner never sees it either — the personal layer is the advisor's, inside an agency
     or not. Counting rows after the filter is deliberate: the totals a reader is given
     must be totals of what they can actually reach. */
  const visible = useMemo(() => {
    const canSeeAdminOnly = owner;
    return vaultDocs.filter((doc) => {
      if (doc.access === "admin only") return canSeeAdminOnly;
      if (doc.access === "private" || doc.access === "processing") {
        const h = holderOf(doc);
        return h === "agency" ? canSeeAdminOnly : h === s.role;
      }
      return true;
    });
  }, [owner, s.role]);

  const rows = useMemo(() => {
    const src = tabSource[tab];
    return visible.filter((doc) => !src || doc.source === src);
  }, [tab, visible]);

  const accessOf = (doc: VaultDoc) =>
    doc.access === "processing" ? doc.access : (granted[doc.name] ?? doc.access);

  const sel: VaultDoc | undefined = selected
    ? visible.find((doc) => doc.name === selected)
    : undefined;
  const inbound = connections.find((c) => c.name.startsWith("Inbound mail"));

  /* What needs this person: her own documents still indexing, and her own sources
     that need attention (for the owner, the agency's too). */
  const indexingCount = visible.filter((doc) => doc.access === "processing").length;
  const troubled = connectionsFor(s.role).filter((c) => c.state !== "ok");

  /* The vault's figures are agency-wide; a user's totals must be totals of what she
     can reach, or the page breaks its own rule. The owner reaches the whole vault. */
  const tabCounts: Record<string, number> = owner
    ? vaultStats.tabs
    : Object.fromEntries(
        Object.keys(vaultStats.tabs).map((t) => {
          const src = tabSource[t];
          return [t, src === null ? visible.length : visible.filter((doc) => doc.source === src).length];
        }),
      );
  const total = owner ? vaultStats.total : visible.length;

  const openDoc = (name: string) => {
    setSelected(name);
    setPanelOpen(true);
  };

  /* ── the access sheet's document ── */
  const accessDoc = accessFor ? vaultDocs.find((doc) => doc.name === accessFor) : undefined;
  const agencyDoc = !!accessDoc && holderOf(accessDoc) === "agency";
  const closedScope = agencyDoc ? "admin only" : "private";
  const currentAccess = accessDoc ? accessOf(accessDoc) : closedScope;
  /* One sharing rule: the whole agency waits for the owner, unless she is the one sharing. */
  const waitsForOwner = !owner;
  const accessOptions = [
    agencyDoc
      ? { v: "admin only", label: "Administrators only", detail: "Where it arrived. It answers the administrators and nobody else." }
      : { v: "private", label: "Private", detail: "Only you. It never reaches anyone else's answers." },
    { v: COLLEAGUE_SHARE, label: `A colleague · ${people.colleague}`, detail: "Only her, at once." },
    { v: "team · Paris", label: "Team · Paris", detail: "The Paris desk, at once. Answers for anyone on it may cite this." },
    {
      v: "agency", label: "The whole agency",
      detail: waitsForOwner
        ? `Waits for ${people.owner} to release it, with you kept as its author. Until then it stays where it is.`
        : "Every advisor, at once. The widest scope, and the hardest to walk back.",
    },
  ];
  const sentToQueue = accessDone && accessScope === "agency" && waitsForOwner;

  const openAccess = (name: string) => {
    const doc = vaultDocs.find((d) => d.name === name);
    if (!doc) return;
    const current = accessOf(doc);
    setAccessScope(current === "processing" ? (holderOf(doc) === "agency" ? "admin only" : "private") : current);
    setAccessDone(false);
    setAccessFor(name);
  };
  const closeAccess = () => { setAccessFor(null); setAccessDone(false); };
  const applyAccess = () => {
    if (!accessFor) return;
    /* The store hears every share, so the whole-agency one reaches the owner's
       publish queue and the rest are on record. */
    d({ type: "shareDocument", name: accessFor, scope: accessScope === "agency" ? "agency" : accessScope === "private" || accessScope === "admin only" ? "private" : "team" });
    if (accessScope === "agency" && waitsForOwner) {
      setWaiting((w) => ({ ...w, [accessFor]: true }));
    } else {
      setGranted((g) => ({ ...g, [accessFor]: accessScope }));
    }
    setAccessDone(true);
  };

  const header = (
    <>
      <PageHeader
        title={<>Knowledge vault <Chip tone="neutral">{count(total, DOCUMENTS)}</Chip></>}
        /* Two ways a document reaches the vault, and neither shares it. Uploading one is
           daily work. Connecting a SOURCE — an advisor's own mailbox or Drive, or the
           agency's drive — indexes it closed to whoever connected it. Both types do both,
           so both are text actions for both: the primary lives in the inspector, on the
           document it acts on. */
        actions={
          <>
            {canConnect && (
              <Button asChild variant="link" size="sm">
                <Link href="/connections?add=1">New connection</Link>
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
            {Object.entries(tabCounts).map(([t, c]) => (
              <TabsTrigger key={t} value={t}>
                {t}
                <span className="type-micro tnum">{digits(c)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </PageHeader>

      <NarrationNote>
        Access defaults are the governance posture — a document arrives closed to whoever brought
        it in, and every widening is an act somebody performs and the log records. The owner
        assigns access on the agency&rsquo;s sources; an advisor&rsquo;s own documents are hers to
        share.
      </NarrationNote>
    </>
  );

  return (
    <SplitPage
      header={header}
      panelOpen={panelOpen}
      onClosePanel={() => setPanelOpen(false)}
      panelTitle={sel ? sel.name : "No document selected"}
      panel={
        <ProvenancePanel
          sel={sel}
          access={sel ? accessOf(sel) : ""}
          waiting={!!sel && !!waiting[sel.name]}
          onManageAccess={openAccess}
        />
      }
    >
      <div className="min-w-0">
        {/* ── what needs a decision ──────────────────────────────────────────
            Only what is this person's to act on: her own documents still indexing,
            and her own sources that need attention — for the owner, the agency's as
            well. Other people's work is not a queue on the screen where she came to
            find a document, so with nothing of hers waiting the chapter is absent. */}
        {(indexingCount > 0 || troubled.length > 0) && (
          <Section title="Needs you">
            <Rows>
              {indexingCount > 0 && (
                <Row>
                  <span className="row-primary">
                    <StatusDot tone="warn">
                      {count(indexingCount, DOCUMENTS)} indexing · closed to{" "}
                      {owner ? "the administrators" : "you"} when it lands
                    </StatusDot>
                  </span>
                  <span className="row-trailing">
                    <Button variant="secondary" size="sm" onClick={() => setTab("Uploads")}>
                      Review
                    </Button>
                  </span>
                </Row>
              )}
              {troubled.length > 0 && (
                <Row>
                  <span className="row-primary">
                    <StatusDot tone={troubled.some((c) => c.state === "credentials") ? "crit" : "warn"}>
                      {count(troubled.length, SOURCES)} {troubled.length === 1 ? "needs" : "need"} attention
                      {" · "}{troubled.map((c) => c.name).join(", ")}
                    </StatusDot>
                  </span>
                  <span className="row-trailing">
                    <Button asChild variant="secondary" size="sm">
                      <Link href="/connections">Open connections</Link>
                    </Button>
                  </span>
                </Row>
              )}
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
              {owner && (
                <span className="sm:text-right">
                  A working sample of the {count(vaultStats.total, DOCUMENTS)} in the vault. Paging is not built.
                </span>
              )}
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
                      <AccessChip access={accessOf(doc)} />
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
        {/* The vault-wide figure is the owner's: what the assistant answers from, across
            the agency. A user who can reach a dozen documents would be told about 912. */}
        {owner && (
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
        )}

        <Section title="Adding a document" quiet deep>
          <p className="max-w-[60ch] type-data-read text-label-secondary">
            Upload a document, or mail one in — {inbound?.name.replace("Inbound mail — ", "")} ·{" "}
            {inbound?.posture}. Either way it arrives private to you.
          </p>
        </Section>

        {/* ── Access — widening is an act, and the act is attributed and logged ── */}
        <Sheet open={!!accessFor} onOpenChange={(o) => { if (!o) closeAccess(); }}>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Access · {accessFor}</SheetTitle>
              <SheetDescription>
                {agencyDoc
                  ? "It arrived closed to the administrators. What you open goes out at once, attributed and recorded in this document’s history."
                  : waitsForOwner
                    ? `It arrived private to you. A colleague or your team sees it at once; the whole agency waits for ${people.owner} to release it.`
                    : "It arrived private to you. What you open goes out at once, attributed and recorded in this document’s history."}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-[var(--space-4)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
              <RadioGroup value={accessScope} onValueChange={setAccessScope} className="gap-[var(--space-3)]">
                {accessOptions.map((o) => (
                  <div key={o.v} className="flex items-start gap-[var(--space-3)]">
                    <RadioGroupItem value={o.v} id={`acc-${o.v}`} className="mt-px" disabled={accessDone} />
                    <Label htmlFor={`acc-${o.v}`} className="flex flex-col items-start gap-0.5">
                      <span className="type-data-strong">{o.label}</span>
                      <span className="type-meta">{o.detail}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <ConfirmBanner show={accessDone}>
                {sentToQueue ? (
                  <>
                    Sent to {people.owner}&rsquo;s publish queue · {personName[s.role]} · today. It
                    reaches the whole agency when she releases it; until then it stays{" "}
                    {accessLabel(currentAccess)}.
                  </>
                ) : (
                  <>
                    Access set to {accessLabel(accessScope)} · {personName[s.role]} · today. Recorded
                    in this document&rsquo;s history.
                  </>
                )}
              </ConfirmBanner>
            </div>
            <SheetFooter className="flex-row justify-end">
              <Button variant="secondary" onClick={closeAccess}>Close</Button>
              <Button disabled={accessDone || accessScope === currentAccess} onClick={applyAccess}>
                Apply and log
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </SplitPage>
  );
}

/* ── the inspector: the document, whose it is, its history, and the one action ─────
   The SplitPage panel is already the tool on raised paper, so nothing inside it is
   boxed again. Read the role directly rather than threading it down.

   Who may change a document's access follows whose it is, not who is signed in:
     the agency's (from its sources)   the owner assigns access — her primary
     her own (uploaded, forwarded,     she manages access — a secondary under
       or from her own source)           "Open document"
     someone else's                    nobody here: it is read, and the panel says
                                         whose it is and who can widen it          */
function ProvenancePanel({
  sel, access, waiting, onManageAccess,
}: {
  sel: VaultDoc | undefined;
  access: string;
  waiting: boolean;
  onManageAccess: (name: string) => void;
}) {
  const { s } = useDemo();
  const reviewer = s.role === "owner";

  if (!sel) {
    return (
      <p className="type-data-read text-label-secondary">
        Select a document to see where it came from and who can read it.
      </p>
    );
  }

  const holder = holderOf(sel);
  const canAssign = reviewer && holder === "agency";
  const canManage = holder === s.role;
  const closed = access === "private" || access === "admin only" || access === "processing";
  const how = sel.source === "Email-in" ? "forwarded" : "uploaded";
  const belongsTo =
    holder === "agency" ? "The agency · from its sources"
    : holder === s.role ? `You · ${how}`
    : `${holderName(holder)} · ${how}`;

  const footnote = canAssign
    ? "Widening is attributed, dated and written to this document's history."
    : canManage
      ? reviewer
        ? "Yours to share. What you open goes out at once, and is logged."
        : `Yours to share. Your team sees it at once; the whole agency when ${people.owner} releases it.`
      : holder === "agency"
        ? `The agency's document. ${people.owner} assigns who reads it.`
        : `${holderName(holder)}'s own document. Only she changes who reads it.`;

  return (
    <div className="space-y-[var(--space-6)]">
      {/* The same DataList every other panel uses. */}
      <DataList
        rows={[
          { label: "Source", value: sel.detail ? "Drive / Partners" : sel.source },
          { label: "Belongs to", value: belongsTo },
          ...(sel.detail
            ? [
                { label: "Synced", value: <span className="tnum">{sel.detail.synced}</span> },
                { label: "Used in", value: sel.detail.usedIn },
              ]
            : []),
          { label: "Updated", value: <span className="tnum">{sel.updated}</span> },
          { label: "Access", value: <AccessChip access={access} /> },
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
            {closed
              ? "Not opened to anyone since it arrived. Every widening is logged."
              : "Every widening is logged, with who opened it and when."}{" "}
            Nothing becomes readable by accident.
          </p>
        )}
        {waiting && (
          <p className="mt-[var(--space-2)] type-meta">
            Shared with the whole agency · waiting for {people.owner} to release it.
          </p>
        )}
      </div>

      {/* A document that arrives here proposes records, and those records wait for a
          person. Only the owner can act on it, so only she is offered the way through. */}
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

      {/* The one primary, at the bottom of the tool that owns it. On a document from the
          agency's sources the owner's act is assigning access (the vault's governance
          claim). On every other document — and always for an advisor — it is opening
          the document, which this build draws and does not wire. Her own documents keep
          "Manage access" as a secondary: the personal layer is hers to widen, and nobody
          else's. */}
      <div className="space-y-[var(--space-2)] border-t border-hairline pt-[var(--space-4)]">
        {canAssign ? (
          <Button className="w-full" onClick={() => onManageAccess(sel.name)}>
            Assign access
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-[var(--space-2)]">
              <Button className="flex-1">Open document</Button>
              <SchematicBadge />
            </div>
            {canManage && (
              <Button variant="secondary" size="sm" className="w-full" onClick={() => onManageAccess(sel.name)}>
                Manage access
              </Button>
            )}
          </>
        )}
        <p className="text-center type-meta">{footnote}</p>
      </div>
    </div>
  );
}
