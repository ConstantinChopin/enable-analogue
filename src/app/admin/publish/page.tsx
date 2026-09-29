"use client";
/**
 * Publish queue — where the owner decides what the whole agency sees
 * (docs/rebuild/05-two-roles.md, "One sharing rule, for everything"; journey O6).
 *
 * Sharing with a colleague or a team takes effect at once. Sharing with the whole agency
 * waits here until the owner releases it — a note, a notice, a record, a document, a
 * trip, a traveller profile or a forwarded mail alike — and it goes out with its author
 * kept. She may instead return it with a note, which reaches its author. The queue is
 * the store's (`queueItems`): the seeded day plus whatever R. Devane shared agency-wide
 * this session; every decision is the store's too (`released`), so it survives a sign-out.
 *
 * Triage, as every queue (UX sweep COL-05, FB-06, FB-09, COL-13, VIS-096, 2026-09-28).
 * Until then the rail's ink button published whatever was "Next", named only in small
 * grey text, instantly and for good, while returning needed a note. Now:
 *   list       one row per item, waiting first. Selecting a row opens it; Enter or a
 *              double-click opens the thing itself (the record, the vault).
 *   inspector  exactly what will be published: the notice or note as written, the
 *              document, or the forwarded mail in full (so a mail is read before it can
 *              go out: opening it is reading it). "Open ↗" goes to the object.
 *   footer     the consequence first ("Reaches 34 advisors on 4 desks, R. Devane stays
 *              the author"), then Return with a note, then the ink act at the right:
 *              "Publish to the whole agency". After either, the selection moves to the
 *              next waiting item, the count drops, and a toast offers Undo for ten
 *              seconds. The row then says what happened, with when and by whom.
 * The rail that repeated the counts is gone; the count is said once, in the title row.
 */
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminPolicy, people, type QueueItem, type QueueKind } from "@/data/seed";
import { useDemo, queueItems, type DemoState } from "@/lib/store";
import { PageHeader, SplitPage, useQueryState } from "@/components/layouts";
import { Chip, Rows, DataList, Done } from "@/components/bits";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";

/** The kind, in words. */
const kindLabel: Record<QueueKind, string> = {
  note: "Note",
  notice: "Notice",
  record: "Record",
  document: "Document",
  trip: "Trip",
  traveller: "Traveller",
  mail: "Forwarded mail",
  announcement: "Announcement",
};

/** Where the thing being published lives, so it can be opened before it goes out. */
function hrefFor(s: DemoState, q: QueueItem): string | undefined {
  if (q.id === "spa-pub" || q.id === "note-pub") return "/records/maison-leandre";
  if (q.kind === "document" || q.kind === "mail") return "/knowledge";
  if (q.id.startsWith("rec-")) return `/records/${q.id.slice(4)}`;
  if (q.id.startsWith("trv-")) return `/travellers/${q.id.slice(4)}`;
  if (q.id.startsWith("ntc-")) {
    const n = s.createdNotices.find((x) => `ntc-${x.id}` === q.id);
    return n ? `/records/${n.productId}` : undefined;
  }
  /* An announcement not yet released has no page to open: the inspector shows it whole. */
  return undefined;
}

const stampTime = (at?: string) => (at ? /\d{1,2}:\d{2}$/.exec(at)?.[0] ?? "today" : "today");

export default function AdminPublish() {
  return (
    <Suspense fallback={null}>
      <PublishQueue />
    </Suspense>
  );
}

function PublishQueue() {
  const { s, d } = useDemo();
  const router = useRouter();
  const items = queueItems(s);
  const [sel, setSel] = useQueryState("sel");

  /* Undo takes back this one decision, from the state as it is when Undo is pressed,
     so a later decision in the same ten seconds is not undone with it. */
  const latest = useRef(s);
  useEffect(() => { latest.current = s; });

  /** The item being returned, and the note that goes back with it. */
  const [returning, setReturning] = useState<QueueItem | null>(null);
  const [note, setNote] = useState("");

  const waiting = items.filter((q) => !s.released[q.id]);
  const ordered = [...waiting, ...items.filter((q) => s.released[q.id])];
  const active = items.find((q) => q.id === sel) ?? null;

  const advance = (from: string) => {
    const next = waiting.find((q) => q.id !== from);
    setSel(next?.id ?? null);
  };
  const undo = (id: string) => () => {
    const cur = latest.current;
    const released = { ...cur.released };
    delete released[id];
    const decisions = { ...cur.decisions };
    delete decisions[`publish:${id}`];
    d({ type: "patch", patch: { released, decisions } });
  };

  const publish = (q: QueueItem) => {
    if (s.released[q.id]) return;
    d({ type: "release", id: q.id, outcome: "published" });
    d({ type: "decide", id: `publish:${q.id}`, what: "Published" });
    advance(q.id);
    notify("Published to the whole agency", { detail: `${q.text} · ${q.by} stays the author`, undo: undo(q.id), seconds: 10 });
  };

  const commitReturn = () => {
    if (!returning || !note.trim()) return;
    const q = returning;
    d({ type: "release", id: q.id, outcome: "returned", note: note.trim() });
    d({ type: "decide", id: `publish:${q.id}`, what: "Returned" });
    setReturning(null);
    setNote("");
    advance(q.id);
    notify(`Returned to ${q.by}`, { detail: q.text, undo: undo(q.id), seconds: 10 });
  };

  /** What happened to an item, with when and by whom. */
  const outcome = (q: QueueItem) => {
    const r = s.released[q.id];
    if (!r) return null;
    const when = stampTime(s.decisions[`publish:${q.id}`]?.at);
    return r.outcome === "published" ? `Published · ${when} · ${people.owner}` : `Returned · ${when} · ${people.owner}`;
  };

  const header = <PageHeader title="Publish queue" count={`${waiting.length} waiting`} />;

  return (
    <SplitPage
      header={header}
      panelOpen={Boolean(active)}
      onClosePanel={() => setSel(null)}
      panelTitle={active?.text ?? "Item"}
      openHref={active ? hrefFor(s, active) : undefined}
      panel={active ? <ItemPanel q={active} outcome={outcome(active)} /> : null}
      footer={active && !s.released[active.id] ? (
        <div className="space-y-[var(--space-3)]">
          <p className="type-meta">
            Reaches {adminPolicy.governed.advisors} advisors on {adminPolicy.governed.desks} desks. {active.by} stays the author.
          </p>
          <div className="flex flex-wrap items-center justify-end gap-[var(--space-2)]">
            <Button variant="secondary" onClick={() => { setNote(""); setReturning(active); }}>Return…</Button>
            <Button onClick={() => publish(active)}>Publish to the whole agency</Button>
          </div>
        </div>
      ) : undefined}
    >
      {items.length === 0 ? (
        <p className="type-data text-label-secondary">
          Nothing waits. What an advisor shares with the whole agency arrives here.
        </p>
      ) : (
        <Rows>
          {ordered.map((q) => {
            const on = sel === q.id;
            const r = s.released[q.id];
            const href = hrefFor(s, q);
            return (
              <li
                key={q.id}
                data-state={on ? "selected" : undefined}
                className="row-select -mx-[var(--space-3)] px-[var(--space-3)]"
              >
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSel(q.id)}
                  onDoubleClick={() => href && router.push(href)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && on && href) { e.preventDefault(); router.push(href); }
                  }}
                  className="row-stack block w-full cursor-pointer text-left"
                >
                  <span className="row-stack-head">
                    <span className="flex min-w-0 items-center gap-[var(--space-2)]">
                      <Chip tone="neutral">{kindLabel[q.kind]}</Chip>
                      <span className="min-w-0 truncate type-data-strong">{q.text}</span>
                    </span>
                    {/* The count says how many wait; a row names only what was decided. */}
                    {r && <Chip tone="neutral">{r.outcome}</Chip>}
                  </span>
                  <span className="row-stack-body block type-meta">
                    {outcome(q) ?? `Shared with the whole agency by ${q.by}`}
                  </span>
                </button>
              </li>
            );
          })}
        </Rows>
      )}

      {/* Return with a note: the item stays where its author shared it */}
      <Sheet open={returning !== null} onOpenChange={(o) => { if (!o) { setReturning(null); setNote(""); } }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Return with a note</SheetTitle>
            <SheetDescription>
              &ldquo;{returning?.text}&rdquo; does not reach the whole agency. It stays shared with the
              people {returning?.by} chose, and your note goes to {returning?.by}.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-[var(--space-2)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
            <Label htmlFor="return-note">
              Note to {returning?.by} <span className="text-label-secondary">(required)</span>
            </Label>
            <Textarea
              id="return-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Keep this to the Paris desk until the spa dates are confirmed."
            />
          </div>
          <SheetFooter className="sm:flex-row sm:justify-end">
            <SheetClose asChild><Button variant="secondary">Cancel</Button></SheetClose>
            <Button disabled={!note.trim()} onClick={commitReturn}>Return to {returning?.by}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </SplitPage>
  );
}

/* ── the inspector: exactly what will be published ─────────────────────────────── */
function ItemPanel({ q, outcome }: { q: QueueItem; outcome: string | null }) {
  const { s } = useDemo();
  const returned = s.released[q.id]?.outcome === "returned" ? s.released[q.id]?.note : null;
  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <DataList
        rows={[
          { label: "Kind", value: kindLabel[q.kind] },
          { label: "Shared by", value: q.by },
          ...(q.source ? [
            { label: "From", value: <span className="type-meta tnum text-inherit">{q.source.from}</span> },
            { label: "Received", value: <span className="tnum">{q.source.received}</span> },
            { label: "Forwarded by", value: q.source.forwardedBy },
          ] : []),
        ]}
      />

      <div>
        <div className="type-meta text-label-tertiary">{q.source ? q.source.subject : "What will be published"}</div>
        <blockquote className="mt-[var(--space-2)] rounded-lg bg-sunken px-[var(--space-4)] py-[var(--space-3)] type-prose italic">
          {q.source ? q.source.body : q.preview ?? q.text}
        </blockquote>
        {q.source && (
          <p className="mt-[var(--space-2)] type-meta">In the vault as &ldquo;{q.source.doc}&rdquo;.</p>
        )}
      </div>

      {outcome && (
        <div className="space-y-[var(--space-1)]">
          <Done>{outcome}</Done>
          {returned && <p className="type-meta">Your note: &ldquo;{returned}&rdquo;</p>}
        </div>
      )}
    </div>
  );
}
