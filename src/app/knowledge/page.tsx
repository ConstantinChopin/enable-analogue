"use client";
/**
 * Knowledge — recomposed as a document with a ledger (Pass 1.5), read by both types
 * (docs/rebuild/05-two-roles.md §3).
 *
 * The title row acts, the toolbar views (VIS-095, NAV-01, 2026-09-28). The title is
 * "Knowledge", the name the dock and the crumb use (NAV-06), with the vault's one count
 * and its creates: Upload, drawn as a SchematicAction because this build does not wire
 * it (COL-09), and "New connection" (VIS-105). The source switch, the search and the
 * result ("4 of 812 from Drive · newest first") sit in the toolbar directly above the
 * ledger. The rows are sorted newest first, so the order the toolbar states is the
 * order they run in (COL-06).
 *
 * 2026-10-06, VIS-105: "New connection" opens the connection flow here, over the
 * vault, rather than sending the reader to Connections. What it indexes arrives in this
 * list as it is indexed, so the reader watches the result of the act where she began
 * it. It was a text link at the foot of the page, "Connect a source", which led away
 * to Connections; it was missed. The foot keeps the same act, under the same name.
 *
 * One list-and-detail pattern (VIS-096). A click on a row selects it and opens the
 * inspector; the row is keyboard-reachable through the table primitive (COL-07), and
 * the source, the search and the selection live in the URL, so Back and a link from a
 * notification (`?source=Announcements&doc=<id>`) arrive where they point. A document
 * has no page of its own, so the inspector has no "Open ↗"; its footer holds the
 * document's one act:
 *   owner, on a document from the agency's sources   "Assign access" (primary)
 *   anyone, on her own document                      "Share…" (secondary)
 *   everyone else                                    nothing filled
 * with "Ask about this" beside it. "Open document" was the advisor's only primary and
 * it did nothing (COL-09): it is now a SchematicAction on the panel's "The file" row.
 *
 * Sharing is the one sharing sheet (VIS-101, COL-10): Only me (or Administrators only,
 * for the agency's own documents) · The Paris desk · The whole agency, with the same
 * commit label and a toast with Undo. Who reads a document is read from the store, so
 * a share survives navigation.
 *
 * The three Deel defects (01-feedback-deel.md §2 Craft) were all on this surface,
 * and each is now structurally impossible rather than merely fixed:
 *   C1  the bar and its legend read ONE constant, VERIFIED — there is no second place
 *       a colour could be chosen. Since 2026-09-28 it is ink, not green: colour means
 *       severity, and a share of verified documents is not one (VIS-097, FB-05).
 *   C2  every count on the page goes through count(): digits with a thousands
 *       separator, then the one noun, in one grammar.
 *   C3  the selected row is a TableRow with data-state="selected" (lifted onto
 *       raised paper by the primitive, VIS-093); the selected source inverts.
 *
 * Access defaults are the governance posture: private on arrival to whoever brought it
 * in, every widening logged. Colour here means nothing but severity, and nothing on
 * this page is severe: access and indexing are neutral words.
 *
 * Local components (not promoted to bits): AccessChip, ProvenancePanel, DocFooter.
 */
import React, { Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useDemo, announcementsFor, arrivalsAt, useArrivalClock, type AnnouncementView, type DemoState, type ShareScope } from "@/lib/store";
import {
  vaultDocs, vaultStats, connections, people, personName, productById,
  type Persona, type VaultDoc,
} from "@/data/seed";
import { ListSearch, ListToolbar, PageHeader, SplitPage } from "@/components/layouts";
import {
  Chip, DataList, Section, SchematicAction, Segmented, StatusDot, Rows, Row, RowStack,
} from "@/components/bits";
import { ShareSheet, audienceOptions, type AudienceOption } from "@/components/share-sheet";
import { askAbout } from "@/components/assistant";
import { AddConnection } from "@/app/connections/add-connection";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Building2, FileText, HardDrive, Lock, Mail, MessageSquareText, User, Users2, Loader2, Megaphone } from "lucide-react";

/* ── C1: one tone for the meter and its key ─────────────────────────────────────
   The bar and the legend swatch beneath it both read this. A legend that disagrees
   with its bar would need a second constant, and there is none. Ink, not green: a
   share of verified documents is a quantity, not a severity (FB-05, 2026-09-28). */
const VERIFIED = { bar: "neutral", dot: "primary" } as const;

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

/** Source switch → the source it selects. `null` selects everything. */
const tabSource: Record<string, string | null> = {
  All: null,
  Drive: "Drive sync",
  Email: "Email-in",
  Claromentis: "Claromentis",
  Uploads: "Upload",
  Announcements: "Announcement",
};
const TABS = Object.keys(tabSource);

/* ── the list's state lives in the URL (COL-07, VIS-096, 2026-09-28) ─────────────
   The source, the search and the selected document, written with history.replaceState
   (which Next's router hears without a server round trip) and several keys at once. */
function useListParams(): [URLSearchParams, (patch: Record<string, string | null>) => void] {
  const params = useSearchParams();
  const patch = useCallback((next: Record<string, string | null>) => {
    const q = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") q.delete(k); else q.set(k, v);
    }
    const str = q.toString();
    window.history.replaceState(null, "", str ? `${window.location.pathname}?${str}` : window.location.pathname);
  }, []);
  return [useMemo(() => new URLSearchParams(params?.toString() ?? ""), [params]), patch];
}

/* ── newest first, and true (COL-06) ────────────────────────────────────────────
   The rows used to run 26 Aug → 12 Mar → 18 Aug under "newest first". Every date on a
   row is a day of this year ("18 Aug"), or "Today" for what was written this session. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dayKey(updated: string) {
  if (/^today$/i.test(updated)) return "2026-08-28";
  const m = updated.match(/^(\d{1,2}) ([A-Z][a-z]{2})/);
  if (!m) return "0000-00-00";
  return `2026-${String(MONTHS.indexOf(m[2]) + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}
const norm = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/* ── announcements, as the vault holds them ─────────────────────────────────────
   A source of its own (05-two-roles.md, 2026-09-24): what the agency wrote to its desk,
   dated, with its author and audience. It reaches whoever it was written for, so the
   rows are already filtered by the store. */
const ANNOUNCEMENT = "Announcement";
type Doc = VaultDoc & { key: string };
const asDoc = (a: AnnouncementView): Doc => ({
  key: a.id, name: a.title, source: ANNOUNCEMENT, updated: a.when,
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

/* ── who reads it now: the seed, and what was shared this session ───────────────────
   Read from the store's `docShares`, so a share made here is still true after Back. A
   user's share with the whole agency waits for the owner's release (the store's
   publish queue carries it as `shared-doc-…`); until then the document stays where it
   was, and says it is waiting.                                                       */
const scopeOfAccess = (access: string): ShareScope =>
  access === "agency" ? "agency" : access.startsWith("team") ? "team" : "private";
const queueId = (name: string) => `shared-doc-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
function accessNow(s: DemoState, doc: VaultDoc): { access: string; waiting: boolean } {
  if (doc.access === "processing") return { access: "processing", waiting: false };
  const shared = s.docShares[doc.name];
  if (!shared || shared.scope === scopeOfAccess(doc.access)) return { access: doc.access, waiting: false };
  if (shared.scope === "private") return { access: holderOf(doc) === "agency" ? "admin only" : "private", waiting: false };
  if (shared.scope === "team") return { access: "team · Paris", waiting: false };
  if (shared.by === "owner" || s.released[queueId(doc.name)]?.outcome === "published") return { access: "agency", waiting: false };
  return { access: doc.access, waiting: !s.released[queueId(doc.name)] };
}

/* Every access value is a chip, including the one that is indexing: "Processing" once
   rendered as bare text in a column of pills, so the one row awaiting a decision was
   the one that looked like nothing. Scope carries an icon and a word; no colour. */
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
  const word = indexing ? "indexing" : access === "agency" ? "whole agency" : access === "team · Paris" ? "Paris desk" : access;
  return (
    <Chip tone="neutral">
      {icon}
      {word}
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
  const { s } = useDemo();
  const owner = s.role === "owner";
  const [params, patch] = useListParams();
  const tabParam = params.get("source");
  const tab = tabParam && tabParam in tabSource ? tabParam : "All";
  const docParam = params.get("doc");
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const q = norm(query);
  const [connectOpen, setConnectOpen] = useState(false);

  /* The vault is permission-filtered like every other surface: a document a person
     cannot open does not appear in the list at all — absent, not masked, and not
     merely badged. `admin only` belongs to the owner. A `private` document, and one
     still indexing, is closed to whoever brought it in: an advisor's to her, and the
     owner never sees it either — the personal layer is the advisor's, inside an agency
     or not. Counting rows after the filter is deliberate: the totals a reader is given
     must be totals of what they can actually reach. */
  const announced = useMemo(() => announcementsFor(s), [s]);
  /* What a connection made this session has brought in so far: each document indexing,
     then closed to whoever connected it, and filtered by the same rule as the rest. */
  const now = useArrivalClock(s);
  const visible = useMemo<Doc[]>(() => {
    const docs = [...arrivalsAt(s, now), ...vaultDocs].filter((doc) => {
      const access = accessNow(s, doc).access;
      if (access === "admin only") return owner;
      if (access === "private" || access === "processing") {
        const h = holderOf(doc);
        return h === "agency" ? owner : h === s.role;
      }
      return true;
    });
    return [...announced.map(asDoc), ...docs.map((doc) => ({ ...doc, key: doc.name }))];
  }, [owner, s, announced, now]);

  const inSource = useMemo(() => {
    const src = tabSource[tab];
    return visible.filter((doc) => !src || doc.source === src);
  }, [tab, visible]);
  const rows = useMemo(
    () => inSource
      .filter((doc) => !q || norm(`${doc.name} ${doc.source} ${doc.by ?? ""}`).includes(q))
      .sort((a, b) => dayKey(b.updated).localeCompare(dayKey(a.updated)) || a.name.localeCompare(b.name)),
    [inSource, q],
  );

  /* The vault's figures are agency-wide; a user's totals must be totals of what she
     can reach, or the page breaks its own rule. The owner reaches the whole vault. */
  const sourceTotal = (t: string) => {
    if (!owner) return tabSource[t] === null ? visible.length : visible.filter((doc) => doc.source === tabSource[t]).length;
    if (t === "Announcements") return announced.length;
    if (t === "All") return vaultStats.tabs.All + announced.length;
    return vaultStats.tabs[t as keyof typeof vaultStats.tabs];
  };
  const total = sourceTotal("All");

  const sel = docParam ? visible.find((doc) => doc.key === docParam) : undefined;
  const selAnnouncement = sel?.source === ANNOUNCEMENT ? announced.find((a) => a.id === sel.key) : undefined;
  const inbound = connections.find((c) => c.name.startsWith("Inbound mail"));
  const onSearch = (v: string) => { setQuery(v); patch({ q: v.trim() || null }); };

  /* One count in the title (C2, COL-13); the toolbar says what the list is showing of
     it, and in what order, without saying the title's number again. A source's own
     total is said only once a source is chosen, and only when the list is short of it. */
  const scopeTotal = sourceTotal(tab);
  const shown = tab === "All"
    ? rows.length === scopeTotal ? <>All shown</> : <>{count(rows.length, DOCUMENTS)} shown</>
    : rows.length === scopeTotal ? <>All from {tab}</> : <><span className="tnum">{digits(rows.length)}</span> of <span className="tnum">{digits(scopeTotal)}</span> from {tab}</>;
  const result = <>{shown} · newest first</>;

  const header = (
    <PageHeader
      title="Knowledge"
      count={count(total, DOCUMENTS)}
      create={
        <>
          <SchematicAction>Upload</SchematicAction>
          <Button variant="secondary" size="sm" onClick={() => setConnectOpen(true)}>New connection</Button>
        </>
      }
    />
  );

  return (
    <SplitPage
      header={header}
      panelOpen={!!sel}
      onClosePanel={() => patch({ doc: null })}
      panelTitle={sel?.name ?? "Document"}
      panel={
        selAnnouncement ? <AnnouncementPanel a={selAnnouncement} />
        : sel ? <ProvenancePanel sel={sel} />
        : null
      }
      footer={sel ? <DocFooter doc={sel} announcement={!!selAnnouncement} /> : undefined}
    >
      <div className="min-w-0">
        <ListToolbar
          state={
            <Segmented
              label="Document sources"
              value={tab}
              onChange={(t) => patch({ source: t === "All" ? null : t, doc: null })}
              options={TABS.map((t) => ({ value: t, label: t }))}
            />
          }
          search={<ListSearch value={query} onChange={onSearch} placeholder="Search documents" />}
          result={result}
        />

        {/* ── the ledger ── */}
        {rows.length === 0 ? (
          <p className="py-[var(--space-6)] type-data text-label-secondary">
            No documents match. Change the search or choose another source.
          </p>
        ) : (
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
                const isSel = doc.key === sel?.key;
                const now = doc.source === ANNOUNCEMENT ? doc.access : accessNow(s, doc).access;
                return (
                  /* C3: the selected row carries data-state="selected" — the primitive
                     lifts it onto raised paper (VIS-093): a surface and an elevation,
                     not a colour. The primitive also makes the row reachable by
                     keyboard, so the page adds no key handler of its own. */
                  <TableRow
                    key={doc.key}
                    data-state={isSel ? "selected" : undefined}
                    aria-selected={isSel}
                    onClick={() => patch({ doc: doc.key })}
                  >
                    <TableCell className="max-w-[32ch] truncate type-data">{doc.name}</TableCell>
                    <TableCell className="text-label-secondary">
                      <span className="inline-flex items-center gap-[var(--space-2)]">
                        <Icon className="size-[var(--icon-md)] shrink-0" aria-hidden />
                        {doc.source}
                      </span>
                    </TableCell>
                    <TableCell className="type-meta tnum">{doc.updated}</TableCell>
                    <TableCell className="text-right">
                      <AccessChip access={now} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {owner && tab !== "Announcements" && (
          <p className="mt-[var(--space-4)] type-meta">This build shows a sample of the vault. Paging is not built.</p>
        )}

        {/* ── context, not a task ────────────────────────────────────────────
            The screen used to open on this statistic. It is a report — true,
            unactionable — so it sits below the ledger, and states its own
            consequence rather than a bare percentage. The vault-wide figure is the
            owner's: what the assistant answers from, across the agency. */}
        {owner && (
          <Section title="Carrying a verified source" quiet deep>
            <div className="flex flex-wrap items-center gap-x-[var(--space-6)] gap-y-[var(--space-3)]">
              <span className="type-figure">{vaultStats.verifiedSourcePct}%</span>
              <div className="flex max-w-md flex-1 flex-col gap-[var(--space-2)]">
                <Progress tone={VERIFIED.bar} value={vaultStats.verifiedSourcePct} />
                <span className="flex flex-wrap items-center gap-x-[var(--space-4)] gap-y-1 type-meta">
                  <StatusDot tone={VERIFIED.dot}>verified · {count(vaultStats.verified, DOCUMENTS)}</StatusDot>
                  <StatusDot tone="muted">no source yet · {count(vaultStats.noSource, DOCUMENTS)}</StatusDot>
                </span>
              </div>
            </div>
            <p className="mt-[var(--space-3)] max-w-[60ch] type-data text-label-secondary">
              A document without a verified source still answers, with its date and a note that nothing confirms it.
            </p>
          </Section>
        )}

        <Section title="Adding a document" quiet deep>
          <p className="max-w-[60ch] type-data text-label-secondary">
            Mail a document to {inbound?.name.replace("Inbound mail — ", "")} and it arrives here, private to you.
            Connecting your own mailbox or Drive indexes what is in it, also private to you.
          </p>
          <Button variant="link" size="sm" className="mt-[var(--space-3)]" onClick={() => setConnectOpen(true)}>
            New connection
          </Button>
        </Section>
      </div>

      <AddConnection open={connectOpen} onOpenChange={setConnectOpen} />
    </SplitPage>
  );
}

/* ── the inspector for an announcement ───────────────────────────────────────────
   The message as written, who wrote it and for whom, and the records it links, each a
   way into the record (COL-12). It is an agency source once it reaches the agency, so
   the panel says what that means: answers may cite it, with its date. */
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
          <h3 className="type-data text-label-secondary">Linked records</h3>
          <Rows className="mt-[var(--space-2)]">
            {a.links.map((id) => {
              const p = productById(id);
              return (
                <Row key={id}>
                  <Link href={`/records/${id}`} className="row-primary type-data-strong underline decoration-link-rest underline-offset-4 hover:decoration-ink">
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
            ? "An agency source: answers may cite it, with its date."
            : "Shared with the Paris desk. Answers for anyone on it may cite it, with its date."}
      </p>
    </div>
  );
}

/* ── the inspector: the document, whose it is, and its history ──────────────────
   The SplitPage panel is already the tool on raised paper, so nothing inside it is
   boxed again, and its name is the panel's header, so the body does not repeat it
   (COL-13).

   Who may change a document's access follows whose it is, not who is signed in:
     the agency's (from its sources)   the owner assigns access — her primary
     her own (uploaded, forwarded,     she shares it — a secondary
       or from her own source)
     someone else's                    nobody here: the panel says whose it is      */
function ProvenancePanel({ sel }: { sel: Doc }) {
  const { s } = useDemo();
  const reviewer = s.role === "owner";
  const { access, waiting } = accessNow(s, sel);
  const shared = s.docShares[sel.name];

  const holder = holderOf(sel);
  const how = sel.source === "Email-in" ? "forwarded" : sel.source === "Drive sync" ? "from a connected Drive" : "uploaded";
  const belongsTo =
    holder === "agency" ? "The agency, from its sources"
    : holder === s.role ? `You, ${how}`
    : `${holderName(holder)}, ${how}`;

  const whoDecides =
    holder === "agency"
      ? reviewer ? "What you open goes out at once." : `${people.owner} decides who reads the agency's documents.`
      : holder === s.role
        ? reviewer ? "Yours to share. What you open goes out at once." : `Yours to share. The Paris desk sees it at once; the whole agency once ${people.owner} releases it.`
        : `${holderName(holder)}'s own document. Only she changes who reads it.`;

  const history = [
    ...(shared && accessNow(s, sel).access !== sel.access
      ? [`${personName[shared.by]} changed who reads it · today`]
      : []),
    ...(waiting ? [`${personName[shared!.by]} shared it with the whole agency · waiting for ${people.owner}`] : []),
    ...(sel.detail?.history ?? []),
  ];

  return (
    <div className="space-y-[var(--space-6)]">
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
          /* Opening the file is drawn, not wired (COL-09): it keeps its place, and is
             never the inspector's act. */
          { label: "The file", value: <SchematicAction>Open document</SchematicAction> },
        ]}
      />

      <div>
        <h3 className="type-data text-label-secondary">History</h3>
        {history.length > 0 ? (
          <Rows className="mt-[var(--space-2)]">
            {history.map((item) => {
              const [head, ...rest] = item.split(" · ");
              return (
                <RowStack key={item} head={<span className="row-primary type-data">{head}</span>}>
                  {rest.join(" · ")}
                </RowStack>
              );
            })}
          </Rows>
        ) : (
          <p className="mt-[var(--space-2)] type-data text-label-secondary">
            {access === "processing" ? "Still indexing, and closed to everyone until it finishes." : "Nobody has changed who reads it since it arrived."}
          </p>
        )}
        <p className="mt-[var(--space-3)] type-meta">{whoDecides}</p>
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
    </div>
  );
}

/* ── the inspector's footer: the document's one act ─────────────────────────────
   The owner's act on an agency document is assigning access; anyone's act on her own
   is sharing it, in the one sharing sheet (VIS-101, COL-10). With neither, asking about
   it is all there is, and nothing is filled. */
function agencyOptions(): AudienceOption<ShareScope>[] {
  return [
    { value: "private", label: "Administrators only", hint: "Where it arrived. Only the administrators’ answers use it." },
    { value: "team", label: "The Paris desk", hint: "6 advisors see it at once." },
    { value: "agency", label: "The whole agency", hint: "Every advisor sees it at once." },
  ];
}

function DocFooter({ doc, announcement }: { doc: Doc; announcement: boolean }) {
  const { s, d } = useDemo();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const owner = s.role === "owner";
  const holder = holderOf(doc);
  const canAssign = !announcement && owner && holder === "agency";
  const canShare = !announcement && holder === s.role && doc.access !== "processing";
  const agencyDoc = holder === "agency";
  const current = scopeOfAccess(announcement ? doc.access : accessNow(s, doc).access);

  const describe = (next: ShareScope) =>
    next === "private"
      ? agencyDoc ? `${doc.name} is for administrators only` : `${doc.name} is private to you`
      : next === "team" ? `Shared ${doc.name} with the Paris desk`
      : owner ? `Shared ${doc.name} with the whole agency`
      : `${doc.name} is in ${people.owner}’s publish queue`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
      <Button
        variant={canAssign || canShare ? "tertiary" : "secondary"}
        size="sm"
        onClick={() => askAbout(d, s, { kind: "document", id: doc.key, label: doc.name, href: `/knowledge?doc=${encodeURIComponent(doc.key)}` }, pathname)}
      >
        <MessageSquareText aria-hidden /> Ask about this
      </Button>
      {(canAssign || canShare) && (
        <>
          <Button variant={canAssign ? "default" : "secondary"} size="sm" onClick={() => setOpen(true)}>
            {canAssign ? "Assign access" : "Share…"}
          </Button>
          <ShareSheet<ShareScope>
            open={open}
            onOpenChange={setOpen}
            what={doc.name}
            current={current}
            options={agencyDoc ? agencyOptions() : audienceOptions(owner)}
            describe={describe}
            onShare={(scope) => d({ type: "shareDocument", name: doc.name, scope })}
          />
        </>
      )}
    </div>
  );
}
