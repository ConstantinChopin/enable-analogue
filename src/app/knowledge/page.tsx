"use client";
/**
 * Knowledge vault — recomposed as a document with a ledger (Pass 1.5), read by both
 * types (docs/rebuild/05-two-roles.md §3).
 *
 * Chapters, in order: Documents (the ledger) · Carrying a verified source (quiet, deep)
 * · Adding a document (quiet, deep). What used to open the page as "Needs you" (her own
 * documents indexing, her sources needing attention) is status, not a chapter, and it is
 * not raised as a pop-up either (the toasts went on 2026-09-25): a document still
 * indexing says so on its own row, and source health lives on Connections and in
 * Notifications. The assistant's peek is the one thing that interrupts.
 * The inspector is the tool that follows, and it starts CLOSED: the vault opens on the
 * ledger, and a row opens the inspector (2026-09-24, Constantin). Only a link that names
 * one document (`?doc=`) arrives with it open, because that reader came to read it.
 * It shows the selected document's provenance, whose it is, its history, and the ONE
 * primary at its bottom:
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
import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, announcementsFor, type AnnouncementView } from "@/lib/store";
import {
  vaultDocs, vaultStats, connections, people, personName, productById,
  type Persona, type VaultDoc,
} from "@/data/seed";
import { PageHeader, SplitPage } from "@/components/layouts";
import {
  Chip, DataList, Section, SchematicBadge, StatusDot, Rows, Row, RowStack, ConfirmBanner,
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
import { Building2, FileText, HardDrive, Lock, Mail, User, Users2, Loader2, Megaphone } from "lucide-react";

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
  Claromentis: FileText,
  Announcement: Megaphone,
};

/** Tab → the source it selects. `null` selects everything. */
const tabSource: Record<string, string | null> = {
  All: null,
  Drive: "Drive sync",
  Email: "Email-in",
  Claromentis: "Claromentis",
  Uploads: "Upload",
  Announcements: "Announcement",
};

/* ── announcements, as the vault holds them ─────────────────────────────────────
   A source of its own (05-two-roles.md, 2026-09-24): what the agency wrote to its desk,
   dated, with its author and audience. It reaches whoever it was written for, so the
   rows are already filtered by the store. */
const ANNOUNCEMENT = "Announcement";
const asDoc = (a: AnnouncementView): VaultDoc => ({
  name: a.title, source: ANNOUNCEMENT, updated: a.when,
  access: a.audience === "agency" ? "agency" : "team · Paris", state: "ok", by: personName[a.by],
});

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


export default function KnowledgePage() {
  return (
    <Suspense fallback={null}>
      <KnowledgeVault />
    </Suspense>
  );
}

function KnowledgeVault() {
  const { s, d } = useDemo();
  const owner = s.role === "owner";
  /* Arriving from the Briefing or a notification: `?source=Announcements&doc=<id>`
     opens the archive on that announcement, with the inspector open because that reader
     came to read it. Read once, as the initial state. */
  const params = useSearchParams();
  const arrival = (() => {
    const src = params?.get("source") ?? null;
    const id = params?.get("doc") ?? null;
    const a = id ? announcementsFor(s).find((x) => x.id === id) : undefined;
    return { tab: src && src in tabSource ? src : "All", doc: a?.title ?? null };
  })();
  /* Both types connect sources: an advisor her own mailbox or Drive, the owner the
     agency's. Connecting indexes and never shares, so it needs no gate. */
  const canConnect = true;
  const [tab, setTab] = useState<string>(arrival.tab);
  const [selected, setSelected] = useState<string | null>(arrival.doc);

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

  /* The inspector starts closed, on every layout: the vault opens on its ledger, and
     choosing a row is what opens the inspector. On a phone it is a sheet, and a sheet
     that opens by itself is an ambush; on a desktop, a document nobody chose pushed the
     ledger into a narrower column for nothing. */
  const [panelOpen, setPanelOpen] = useState(arrival.doc !== null);

  /* The vault is permission-filtered like every other surface: a document a person
     cannot open does not appear in the list at all — absent, not masked, and not
     merely badged. `admin only` belongs to the owner. A `private` document, and one
     still indexing, is closed to whoever brought it in: an advisor's to her, and the
     owner never sees it either — the personal layer is the advisor's, inside an agency
     or not. Counting rows after the filter is deliberate: the totals a reader is given
     must be totals of what they can actually reach. */
  const announced = useMemo(() => announcementsFor(s), [s]);
  const visible = useMemo(() => {
    const canSeeAdminOnly = owner;
    const docs = vaultDocs.filter((doc) => {
      if (doc.access === "admin only") return canSeeAdminOnly;
      if (doc.access === "private" || doc.access === "processing") {
        const h = holderOf(doc);
        return h === "agency" ? canSeeAdminOnly : h === s.role;
      }
      return true;
    });
    return [...announced.map(asDoc), ...docs];
  }, [owner, s.role, announced]);

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


  /* The vault's figures are agency-wide; a user's totals must be totals of what she
     can reach, or the page breaks its own rule. The owner reaches the whole vault. */
  const tabCounts: Record<string, number> = owner
    ? { ...vaultStats.tabs, All: vaultStats.tabs.All + announced.length, Announcements: announced.length }
    : Object.fromEntries(
        [...Object.keys(vaultStats.tabs), "Announcements"].map((t) => {
          const src = tabSource[t];
          return [t, src === null ? visible.length : visible.filter((doc) => doc.source === src).length];
        }),
      );
  const total = owner ? vaultStats.total + announced.length : visible.length;
  const selAnnouncement = sel?.source === ANNOUNCEMENT ? announced.find((a) => a.title === sel.name) : undefined;

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
              <Button variant="tertiary" size="sm">Upload</Button>
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

    </>
  );

  return (
    <SplitPage
      header={header}
      panelOpen={panelOpen}
      onClosePanel={() => setPanelOpen(false)}
      panelTitle={sel ? sel.name : "No document selected"}
      panel={
        selAnnouncement ? (
          <AnnouncementPanel a={selAnnouncement} />
        ) : (
          <ProvenancePanel
            sel={sel}
            access={sel ? accessOf(sel) : ""}
            waiting={!!sel && !!waiting[sel.name]}
            onManageAccess={openAccess}
          />
        )
      }
    >
      <div className="min-w-0">
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

/* ── the inspector for an announcement ───────────────────────────────────────────
   The message as written, who wrote it and for whom, and the records it links, each a
   way into the record. It is an agency source once it reaches the agency, so the panel
   says what that means: answers may cite it, with its date. No filled action — the
   next step is a record, and a record is a link. */
function AnnouncementPanel({ a }: { a: AnnouncementView }) {
  const agency = a.audience === "agency" && !a.waiting;
  return (
    <div className="space-y-[var(--space-6)]">
      <DataList
        rows={[
          { label: "Source", value: "Announcement" },
          { label: "Written by", value: personName[a.by] },
          { label: "Published", value: <span className="tnum">{a.waiting ? "waiting for release" : a.when}</span> },
          { label: "For", value: <AccessChip access={a.audience === "agency" ? "agency" : "team · Paris"} /> },
        ]}
      />
      <p className="max-w-[60ch] type-prose">{a.body}</p>
      {a.links.length > 0 && (
        <div>
          <h3 className="type-section-quiet">Linked records</h3>
          <Rows className="mt-[var(--space-2)]">
            {a.links.map((id) => {
              const p = productById(id);
              return (
                <Row key={id}>
                  <Link href={`/records/${id}`} className="row-primary type-data-strong underline decoration-hairline underline-offset-4 hover:decoration-ink">
                    {p?.name ?? id}
                  </Link>
                  <span className="row-trailing type-meta">{p ? `${p.city} · ${p.status === "Active" ? p.evidence.label : p.status.toLowerCase()}` : ""}</span>
                </Row>
              );
            })}
          </Rows>
        </div>
      )}
      <p className="border-t border-hairline pt-[var(--space-4)] type-meta">
        {a.waiting
          ? `Waiting for ${people.owner} to release it to the whole agency. Until then it reaches its author and the Paris desk.`
          : agency
            ? "An agency source: answers may cite it, with its date. The facts it states stay on the records it links."
            : "Shared with the Paris desk. Answers for anyone on it may cite it, with its date."}
      </p>
    </div>
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
