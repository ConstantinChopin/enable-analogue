"use client";
/**
 * The record — recomposed first (docs/rebuild/02-sequence.md, Pass 1.5).
 *
 * Affinity: Airbnb's listing detail (anatomy/surfaces/listing-detail.md). One entity,
 * presented in full: imagery, then chapters at column width separated by hairlines,
 * and beside them the one tool that follows you — the Summary — which holds
 * everything unsettled about the record and the ONE primary action, at its bottom.
 *
 * One anatomy for every record (COL-08, 2026-09-28). Every record page has the same
 * title row — the name, then Edit · Add note · Add notice — the same meta line and
 * capped gallery, the same notices at the head of the body, and the same Summary rail
 * with the record's one act. Where a control is not wired for a record it is drawn as
 * a SchematicAction in its place: never missing, never the primary. Maison Léandre
 * carries the three layers; every other record renders from its own seed fields.
 *
 * The gallery is capped at 288 (240 on a phone) so the notices, the Summary and its
 * act are on screen on arrival at 1440 × 900 (NAV-08); under 1024, where the rail
 * becomes an appendix, an ActionBar pinned to the bottom of the scroll carries the
 * page's act. The Summary lists what is unsettled once: the notice speaks for itself
 * at the head of the body, so it is not a Summary row as well (COL-13).
 *
 * The one act, in order: "Resolve 3 sources" where the commission is disputed and you
 * see money; otherwise "Add to a trip…" (COL-03), a trip picker that lists the trips
 * you can see, the likely traveller's first, and adds the record as an Idea line. A
 * record closed to bookings by a Critical notice cannot be added: its Blocker says so,
 * and where it already sits on one of your trips its one act is to take it off
 * (VIS-099). Nobody acknowledges a Critical notice: the acknowledgment dialog went.
 *
 * Notices (VIS-097). Critical is a Blocker, Important a Warning, Info a neutral line.
 * A notice whose review is due asks its owner "Still true" or "Retire…"; "Still true"
 * is recorded in the store with who and when (FB-07) and collapses to that line where
 * the question was; retiring confirms in claret, not ink, and can be undone (NAV-09).
 *
 * Editing (COL-11). Every editable field shows "Edit" on hover and focus, so changing
 * one value is one step; the header's Edit keeps them all showing. The sheet asks who
 * the change is for before what it says, with nothing chosen. A value the advisor
 * proposes for the whole agency waits on its field for the owner, who approves it in
 * place or returns it with a note. `?review=<key>` scrolls to that field on arrival,
 * and `?resolve=1` (the Records inspector's act) opens the resolve sheet.
 *
 * Confirmations are made in place with the time, or by a toast with Undo where the
 * result is elsewhere (FB-06). A note is kept in the store with who and when, so its
 * "Saved 10:14" is still true an hour later.
 */
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useDemo, canViewCommissions, scopeWrite, createdNoticesOn, announcementsFor, noticeGate, onTrip,
  type CreatedRecord, type DemoState, type EditScope, type ShareScope,
} from "@/lib/store";
import { takeOff, visibleTrips, tasteClash, cautionOf } from "@/lib/trip-checks";
import { NoticeSheet } from "@/components/publish-sheets";
import {
  products, productById, leandreFields, leandreContext, commissionConflict, notices, promotions, people, personName,
  travellerCards, commissions, keptSource, programmes, programmeLinksFor, programmeRates,
  type Field, type Layer, type Notice, type Persona, type Product, type Trip, type ProgrammeId, type ProgrammeLink,
} from "@/data/seed";
import { linesOf, spanOf, addDays, stamp, TODAY, type TripLine } from "@/data/trip-lines";
import { ActionBar, Page, PageHeader, PropertyGallery, useQueryState } from "@/components/layouts";
import {
  Blocker, Chip, DataList, Done, LayerBadge, ProvenancePopover, Rows, Row, SchematicAction, Section, SourceTag,
  ConfidenceMeter, Warning,
} from "@/components/bits";
import { AudiencePicker, ShareSheet, audienceOptions, type AudienceOption } from "@/components/share-sheet";
import { askAbout } from "@/components/assistant";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ChevronDown, EyeOff, MessageSquareText, Pencil, Scale } from "lucide-react";

export default function RecordPage() {
  return (
    <Suspense fallback={null}>
      <RecordRoute />
    </Suspense>
  );
}

function RecordRoute() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  if (id === "maison-leandre") return <LeandreRecord />;
  return <GenericRecord id={id} />;
}

/* ── small words ───────────────────────────────────────────────────────────── */
/** "28 Aug 10:14" → "10:14": the seeded day is always today. */
const timeOf = (at: string) => at.slice(-5);
const NAME_OF_INITIALS: Record<string, string> = {
  [people.advisorShort]: people.advisor, [people.ownerShort]: people.owner, [people.colleagueShort]: people.colleague,
};
const nameOfInitials = (i: string) => NAME_OF_INITIALS[i] ?? i;
const NOTICE_AUDIENCE: Record<Notice["scope"], string> = { personal: "its author", team: "the Paris desk", agency: "the whole agency" };
const linkClass = "underline decoration-hairline underline-offset-4 hover:decoration-ink";

/* ── the sheet body: 24 inside, rows stacked ──────────────────────────────── */
function SheetBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-[var(--space-6)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]", className)}>{children}</div>;
}

/* Cancel, then the act, at the right, on every sheet (COL-11). Anything that removes
   stands apart at the left. */
function SheetActions({ aside, children }: { aside?: ReactNode; children: ReactNode }) {
  return (
    <SheetFooter className="flex-row flex-wrap items-center justify-end">
      {aside && <div className="mr-auto">{aside}</div>}
      {children}
    </SheetFooter>
  );
}

/* ═══════════════ One anatomy (COL-08, NAV-08) ═══════════════ */

/** The title row: the name, and the same three acts on every record. An act that is not
    wired for this record is drawn as a SchematicAction in its place. */
function RecordHeader({
  name, meta, p, edit, onNote, onNotice,
}: {
  name: string; meta: string; p?: Product;
  edit?: { on: boolean; toggle: () => void };
  onNote: () => void; onNotice: () => void;
}) {
  return (
    <PageHeader
      title={name}
      actions={
        <>
          {edit
            ? <Button variant="tertiary" size="sm" onClick={edit.toggle}><Pencil aria-hidden /> {edit.on ? "Done editing" : "Edit"}</Button>
            : <SchematicAction>Edit</SchematicAction>}
          <Button variant="tertiary" size="sm" onClick={onNote}>Add note</Button>
          <Button variant="tertiary" size="sm" onClick={onNotice}>Add notice</Button>
        </>
      }
    >
      <p className="mt-[var(--space-1)] type-meta">{meta}</p>
      {p && (
        <div className="mt-[var(--space-4)]">
          <PropertyGallery id={p.id} name={p.name} category={p.category} />
        </div>
      )}
    </PageHeader>
  );
}

/** The rail's acts: the one act, and asking about the record. Under 1024 the ActionBar
    carries them instead, so the rail's copy is hidden there. */
function RailActs({ act, ask }: { act?: ReactNode; ask: ReactNode }) {
  return (
    <div className="mt-[var(--space-4)] hidden flex-col gap-[var(--space-2)] lg:flex">
      {act}
      {ask}
    </div>
  );
}

function AskButton({ id, name, alone, className }: { id: string; name: string; alone: boolean; className?: string }) {
  const { s, d } = useDemo();
  const pathname = usePathname();
  return (
    <Button
      variant={alone ? "secondary" : "tertiary"}
      size="sm"
      className={className}
      onClick={() => askAbout(d, s, { kind: "record", id, label: name, href: `/records/${id}` }, pathname)}
    >
      <MessageSquareText aria-hidden /> Ask about this
    </Button>
  );
}

/* ── the trips a record sits on, each a way to the trip and its traveller (COL-12) ── */
function travellerHref(t: Trip) {
  const id = t.travellerId ?? travellerCards.find((c) => c.name === t.traveller)?.id;
  return id ? `/travellers/${id}` : null;
}
function OnTrips({ p }: { p: { id: string } }) {
  const { s } = useDemo();
  const on = visibleTrips(s).filter((t) => onTrip(s, t.id, p.id));
  if (on.length === 0) return null;
  return (
    <div className="mt-[var(--space-4)]">
      <div className="type-meta text-label-tertiary">On trips</div>
      <Rows className="mt-[var(--space-1)]">
        {on.map((t) => {
          const href = travellerHref(t);
          return (
            <Row key={t.id}>
              <Link href={`/itineraries/${t.id}`} className={cn("row-primary type-data", linkClass)}>{t.title}</Link>
              <span className="row-trailing type-meta">
                {href ? <Link href={href} className={linkClass}>{t.traveller}</Link> : t.traveller}
              </span>
            </Row>
          );
        })}
      </Rows>
    </div>
  );
}

/* ═══════════════ Add to a trip (COL-03, VIS-099, 2026-09-28) ═══════════════
   Replaces "Add to itinerary shortlist". The picker lists the trips this person can
   see (VIS-098), past ones left out, the likely traveller's first: a trip to the
   record's city, then a traveller who has stayed here, then one its promotion names.
   Choosing one adds the record as an Idea line, the itinerary builder's own shape, and
   says so with a way to the trip and Undo. A trip it is already on says so and cannot
   be chosen again; an Important notice and a traveller's taste warn, and do not block. */
const NIGHTS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
function ideaLine(t: Trip, p: Product): TripLine {
  const span = spanOf(t);
  const on = span?.[0] ?? TODAY;
  const stay = p.category === "Hotel" || p.category === "Cruise";
  const until = stay ? (span?.[1] ?? addDays(on, 1)) : undefined;
  const n = until ? Math.max(1, Math.round((Date.parse(until) - Date.parse(on)) / 86_400_000)) : 1;
  return {
    id: `rec-${p.id}-${Date.now().toString(36)}`, tripId: t.id, kind: stay ? "stay" : "experience",
    on, until, time: stay ? "15:00" : undefined,
    what: stay ? `${p.name}, ${NIGHTS[n] ?? n} ${n === 1 ? "night" : "nights"}` : p.name,
    productId: p.id, program: p.programs[0], status: "idea", requests: [],
    sell: stay ? n * 1100 : undefined,
  };
}

function tripChoices(s: DemoState, p: Product) {
  const stayed = new Set(commissions.filter((c) => c.productId === p.id && c.traveller).map((c) => c.traveller!));
  const promoted = new Set(promotions.find((x) => x.productId === p.id)?.affectedClients ?? []);
  const city = p.city.toLowerCase();
  return visibleTrips(s)
    .filter((t) => t.status !== "Traveled" && t.status !== "Cancelled")
    .map((t) => {
      const here = t.destinations.find((dest) => city.includes(dest.toLowerCase()));
      const why = here ? `In ${here}` : stayed.has(t.traveller) ? `${t.traveller} has stayed here` : promoted.has(t.traveller) ? "Its promotion names this traveller" : null;
      const score = here ? 3 : stayed.has(t.traveller) ? 2 : promoted.has(t.traveller) ? 1 : 0;
      return { t, why, score, on: onTrip(s, t.id, p.id), clash: tasteClash(t.traveller, p.id) };
    })
    .sort((a, b) => b.score - a.score || (a.t.startsInDays ?? Number.MAX_SAFE_INTEGER) - (b.t.startsInDays ?? Number.MAX_SAFE_INTEGER));
}

/** Whether a record can be offered to a trip at all: a property, open, confirmed. */
function addable(s: DemoState, p: Product) {
  if (p.category === "Rep firm" || p.status === "Closed") return false;
  if (p.id === "sereno-kyoto" && !s.candidateConfirmed) return false;
  if (s.world === "v2" && noticeGate(s, p.id)?.level === "block") return false;
  return tripChoices(s, p).length > 0;
}

/* notify() carries Undo or a way to the result, not both. This act needs both: the
   result is on another page, and it can be taken back. The same toast, in the same
   place, with the product's Undo (reported for notify, 2026-09-28). */
function notifyAdded(t: Trip, open: () => void, undo: () => void) {
  toast(`Added to ${t.title} as an idea`, {
    duration: 7000,
    action: { label: "Open the trip", onClick: open },
    cancel: { label: "Undo", onClick: () => { undo(); toast("Undone", { duration: 2500 }); } },
  });
}

function AddToTrip({ p, primary, size = "default", className }: { p: Product; primary: boolean; size?: "sm" | "default"; className?: string }) {
  const { s, d } = useDemo();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const choices = useMemo(() => tripChoices(s, p), [s, p]);
  const caution = s.world === "v2" ? cautionOf(s, p.id) : null;

  const add = (t: Trip) => {
    const line = ideaLine(t, p);
    d({ type: "lineAdd", line });
    setOpen(false);
    notifyAdded(t, () => router.push(`/itineraries/${t.id}?line=${line.id}`), () => d({ type: "lineRemove", id: line.id }));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={primary ? "default" : "secondary"} size={size} className={className}>Add to a trip…</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-[var(--space-2)]">
        <p className="px-[var(--space-2)] pt-[var(--space-1)] pb-[var(--space-2)] type-meta text-label-tertiary">Add {p.name} as an idea on</p>
        {caution && (
          <p className="mx-[var(--space-2)] mb-[var(--space-2)] type-meta">Notice: {caution.text}</p>
        )}
        <div className="space-y-0.5">
          {choices.map(({ t, why, on, clash }) => (
            <button
              key={t.id}
              type="button"
              disabled={on}
              onClick={() => add(t)}
              className="flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-md px-[var(--space-2)] py-[var(--space-2)] text-left hover:bg-interactive disabled:cursor-default disabled:hover:bg-transparent"
            >
              <span className={cn("type-data-strong", on && "text-label-disabled")}>{t.title}</span>
              <span className="type-meta">
                {t.traveller} · {t.dates}{on ? " · already on it" : why ? ` · ${why}` : ""}
              </span>
              {clash && !on && <span className="type-meta">{clash.sentence}</span>}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* Take a blocked property off a trip, the way the trip itself does it (trip-checks
   `takeOff`: its line and its shortlist entry go, and the toast carries Undo). A
   property that is only shortlisted, with no line of its own, comes off the list. */
function takeOffTrip(s: DemoState, d: ReturnType<typeof useDemo>["d"], t: Trip, p: { id: string; name: string }) {
  const line = linesOf(s.tripLines, t.id).find((l) => l.productId === p.id);
  if (line) { takeOff(s, d, t, line); return; }
  const before = s.shortlistOff;
  d({ type: "shortlistOff", trip: t.id, product: p.id });
  notify(`${p.name} is off the trip`, { detail: t.title, undo: () => d({ type: "patch", patch: { shortlistOff: before } }) });
}

/** The Blocker's one act, where the closed record sits on one of this person's trips. */
function useBlockAct(p: { id: string; name: string }) {
  const { s, d } = useDemo();
  const [took, setTook] = useState<{ title: string; at: string } | null>(null);
  const on = visibleTrips(s).find((t) => onTrip(s, t.id, p.id));
  const act = on ? (
    <Button variant="secondary" size="sm" onClick={() => { takeOffTrip(s, d, on, p); setTook({ title: on.title, at: stamp() }); }}>
      Take it off {on.title}
    </Button>
  ) : undefined;
  const done = took && !on ? <Done>Taken off {took.title} · {timeOf(took.at)}</Done> : null;
  return { act, done };
}

/* ═══════════════ Notices (VIS-097, VIS-099, FB-07, NAV-09) ═══════════════
   Nothing expires on a timer. When a notice's review is due its owner answers: still
   true, recorded in the store with who and when and shown where the question was, or
   retired with a reason. A notice someone else owns carries no control.            */
const initialsFor: Record<Persona, string> = { user: people.advisorShort, owner: people.ownerShort };
function ownsNotice(n: Notice, role: Persona) {
  return n.owner === initialsFor[role];
}

function NoticeBlock({ n, act, after }: { n: Notice & { waiting?: boolean }; act?: ReactNode; after?: ReactNode }) {
  const { s, d } = useDemo();
  const [retireOpen, setRetireOpen] = useState(false);
  if (s.retired[n.id]) return <RetiredLine n={n} />;

  const owns = ownsNotice(n, s.role);
  const kept = s.decisions[`still-true:${n.id}`];
  const due = !!n.staleReviewDue && !kept;
  const meta = (
    <span className="type-meta">
      Opened {n.openedAt} by {nameOfInitials(n.owner)} · for {NOTICE_AUDIENCE[n.scope]} · <span className="tnum">{n.ageDays}</span> days open
      {due && !owns ? " · review due" : ""}
    </span>
  );
  const keptLine = kept ? <Warning title="" kept={`Still true · ${personName[kept.by]}, ${kept.at}`} className="mt-[var(--space-2)]" /> : null;
  const waiting = n.waiting ? <p className="mt-1 type-meta">Waiting for {people.owner} to release it to the whole agency.</p> : null;
  const review = owns && due ? (
    <>
      <Button variant="secondary" size="sm" onClick={() => d({ type: "decide", id: `still-true:${n.id}`, what: "Still true" })}>Still true</Button>
      <span aria-hidden className="h-5 border-l border-hairline" />
      <Button variant="tertiary" size="sm" onClick={() => setRetireOpen(true)}>Retire…</Button>
    </>
  ) : undefined;

  let block: ReactNode;
  if (n.severity === "Critical") {
    block = <Blocker title="Closed to bookings" action={act}>{n.text} {meta}{waiting}</Blocker>;
  } else if (n.severity === "Important" || review) {
    block = (
      <Warning title={n.text} actions={review}>
        {meta}
        {review && <p className="mt-1">Its review is due. Is it still true?</p>}
        {waiting}{keptLine}
      </Warning>
    );
  } else {
    block = (
      <div className="rounded-lg bg-sunken px-[var(--space-4)] py-[var(--space-3)]">
        <p className="type-data">{n.text}</p>
        {meta}{waiting}{keptLine}
      </div>
    );
  }
  return (
    <div className="space-y-[var(--space-2)]">
      {block}
      {after}
      {owns && <RetireNoticeSheet n={n} open={retireOpen} onOpenChange={setRetireOpen} />}
    </div>
  );
}

/* Said once, where the notice was. */
function RetiredLine({ n }: { n: Notice }) {
  const { s } = useDemo();
  const r = s.retired[n.id];
  if (!r) return null;
  return <Done>“{n.text}” retired by {personName[r.by]} today: {r.reason}</Done>;
}

/* Retiring is destructive: it confirms in claret, in the sheet, never as a page's
   primary, and the toast can put it back (NAV-09, 2026-09-28). */
function RetireNoticeSheet({ n, open, onOpenChange }: { n: Notice; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { s, d } = useDemo();
  const [reason, setReason] = useState("");

  const commit = () => {
    if (!reason.trim()) return;
    const before = { retired: s.retired, spaNoticeClosed: s.spaNoticeClosed };
    d({ type: "retireNotice", id: n.id, reason: reason.trim() });
    onOpenChange(false);
    notify("Notice retired", { detail: n.text, undo: () => d({ type: "patch", patch: before }) });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Retire this notice</SheetTitle>
          <SheetDescription>It leaves the record for everyone who could see it, with your name, today&rsquo;s date and your reason.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <DataList rows={[
            { label: "Notice", value: n.text },
            { label: "Opened", value: `${n.openedAt} · ${n.ageDays} days open` },
            { label: "For", value: NOTICE_AUDIENCE[n.scope] },
          ]} />
          <div>
            <Label htmlFor={`retire-${n.id}`}>
              Why is it no longer true? <span className="text-label-secondary">(required)</span>
            </Label>
            <Textarea
              id={`retire-${n.id}`}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. confirmed with the property on today’s call"
              className="mt-[var(--space-2)]"
            />
          </div>
        </SheetBody>
        <SheetActions>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={!reason.trim()} onClick={commit}>Retire notice</Button>
        </SheetActions>
      </SheetContent>
    </Sheet>
  );
}

/* ═══════════════ Notes (FB-06, COL-10, 2026-09-28) ═══════════════
   A note is kept in the store as a recorded choice (who and when), keyed by the record,
   with its audience beside it: the store has no notes of its own yet. It answers "who
   can see this?" in the sharing sheet's words (VIS-101). An advisor's note reaches
   herself or the Paris desk; the whole agency would need the owner's publish queue,
   which does not take notes, so it is not offered to her. Saving an empty note is not
   possible. The note is confirmed where it lands, with the time it was saved.        */
const noteKey = (id: string) => `note:${id}`;
const noteScopeKey = (id: string) => `note-scope:${id}`;

function noteOf(s: DemoState, id: string) {
  const n = s.decisions[noteKey(id)];
  if (!n) return null;
  const v = s.decisions[noteScopeKey(id)]?.what;
  const scope: ShareScope = v === "team" || v === "agency" ? v : "private";
  const seen = n.by === s.role || (scope === "team" && s.role === "user") || (scope === "agency" && n.by === "owner");
  return seen ? { ...n, scope } : null;
}

function noteAudience(scope: ShareScope, mine: boolean) {
  if (scope === "private") return mine ? "only you" : "its author";
  return scope === "team" ? "the Paris desk" : "the whole agency";
}

function NoteSheet({ recordId, recordName, open, onOpenChange, onSaved }: {
  recordId: string; recordName: string; open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        {/* Mounted on every open, so the sheet starts from the note on file. */}
        <NoteBody recordId={recordId} recordName={recordName} close={() => onOpenChange(false)} onSaved={onSaved} />
      </SheetContent>
    </Sheet>
  );
}

function NoteBody({ recordId, recordName, close, onSaved }: { recordId: string; recordName: string; close: () => void; onSaved: () => void }) {
  const { s, d } = useDemo();
  const owner = s.role === "owner";
  const current = noteOf(s, recordId);
  const mine = current?.by === s.role;
  const [text, setText] = useState(mine ? current!.what : "");
  const [scope, setScope] = useState<ShareScope>(mine ? current!.scope : "private");
  const options = audienceOptions(owner).filter((o) => owner || o.value !== "agency") as AudienceOption<ShareScope>[];

  const save = () => {
    if (!text.trim()) return;
    d({ type: "decide", id: noteKey(recordId), what: text.trim() });
    d({ type: "decide", id: noteScopeKey(recordId), what: scope });
    d({ type: "saveNote" });
    close();
    onSaved();
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{mine ? "Your note" : "Add a note"}</SheetTitle>
        <SheetDescription>On {recordName}, with your name and today&rsquo;s date.</SheetDescription>
      </SheetHeader>
      <SheetBody>
        <div>
          <Label htmlFor="note-text">Note</Label>
          <Textarea id="note-text" className="mt-[var(--space-2)]" placeholder="What should the record remember?" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <AudiencePicker id="note-scope" value={scope} onChange={setScope} options={options} />
      </SheetBody>
      <SheetActions>
        <Button variant="secondary" onClick={close}>Cancel</Button>
        <Button disabled={!text.trim()} onClick={save}>Save note</Button>
      </SheetActions>
    </>
  );
}

/** The note, where it lives on the record, confirmed with its time. Its author changes
    who sees it in the one sharing sheet (VIS-101). */
function NoteRow({ recordId }: { recordId: string }) {
  const { s, d } = useDemo();
  const [shareOpen, setShareOpen] = useState(false);
  const n = noteOf(s, recordId);
  if (!n) return null;
  const mine = n.by === s.role;
  const owner = s.role === "owner";
  return (
    <FieldGrid
      id={`note-${recordId}`}
      label={mine ? "Your note" : `${personName[n.by]}’s note`}
      provenance={<SourceTag kind="manual" label={`${personName[n.by]} · ${n.at.slice(0, 6)}`} />}
    >
      <p className="type-data">“{n.what}”</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-1">
        <Done>Saved {timeOf(n.at)} · {noteAudience(n.scope, mine)}</Done>
        {mine && <Button variant="tertiary" size="sm" onClick={() => setShareOpen(true)}>Share…</Button>}
      </div>
      {mine && (
        <ShareSheet<ShareScope>
          open={shareOpen}
          onOpenChange={setShareOpen}
          what="your note"
          current={n.scope}
          options={audienceOptions(owner).filter((o) => owner || o.value !== "agency") as AudienceOption<ShareScope>[]}
          onShare={(scope) => d({ type: "decide", id: noteScopeKey(recordId), what: scope })}
        />
      )}
    </FieldGrid>
  );
}

/** After a save, bring the note into view: the sheet has closed over it. */
function useScrollTo() {
  const [target, setTarget] = useState<string | null>(null);
  useEffect(() => {
    if (!target) return;
    const t = window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ block: "center", behavior: "smooth" });
      setTarget(null);
    }, 60);
    return () => window.clearTimeout(t);
  }, [target]);
  return setTarget;
}

/* ═══════════════ Edit a field (COL-11, 2026-09-28) ═══════════════
   Who the change is for comes FIRST, with nothing chosen, because it is the question an
   advisor gets wrong; the value and the reason follow. The words are the sharing
   sheet's (VIS-101). Canonical is never a target: Enable publishes that layer; the
   agency writes above it, and the sheet shows the value that will remain underneath.  */
const EDIT_AUDIENCE: Record<EditScope, string> = { personal: "only you", team: "the Paris desk", agency: "the whole agency" };
function editOptions(role: Persona): AudienceOption<EditScope>[] {
  return [
    { value: "personal", label: "Only me", hint: "Nobody else sees it." },
    { value: "team", label: "The Paris desk", hint: "6 advisors see it at once." },
    {
      value: "agency", label: "The whole agency",
      hint: role === "owner" ? "Every advisor sees it at once." : `Every advisor, once ${people.owner} releases it.`,
    },
  ];
}

function EditFieldSheet({
  field, open, onOpenChange,
}: { field: Field | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        {field && <EditBody key={field.key} field={field} close={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function EditBody({ field, close }: { field: Field; close: () => void }) {
  const { s, d } = useDemo();
  /* Seed from an edit this person may see: her own, or one applied for the whole agency. */
  const existing = s.fieldEdits[field.key];
  const mine = existing?.by === s.role;
  const seedFrom = existing && (mine || (existing.scope === "agency" && !existing.pending && !existing.returned)) ? existing : undefined;
  const [value, setValue] = useState(seedFrom?.value ?? field.value);
  const [scope, setScope] = useState<EditScope | null>(mine ? existing!.scope : null);
  const [reason, setReason] = useState("");

  const mode = scope ? scopeWrite(s.role, scope) : null;
  const dirty = value.trim() !== "" && value.trim() !== field.value;
  const ready = !!scope && dirty && !!reason.trim();

  const commit = () => {
    if (!ready || !scope) return;
    const before = { fieldEdits: s.fieldEdits };
    d({
      type: "editField",
      key: field.key,
      edit: { value: value.trim(), scope, reason: reason.trim(), by: s.role, pending: mode === "review" },
    });
    close();
    notify(
      mode === "review" ? `Sent to ${people.owner} for the whole agency` : `${field.label} changed`,
      {
        detail: mode === "review" ? "The record answers with its current value until she releases it." : `Seen by ${EDIT_AUDIENCE[scope]}.`,
        undo: () => d({ type: "patch", patch: before }),
      },
    );
  };
  const remove = () => {
    const before = { fieldEdits: s.fieldEdits };
    d({ type: "revertField", key: field.key });
    close();
    notify("Your change is removed", { detail: field.label, undo: () => d({ type: "patch", patch: before }) });
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Edit {field.label.toLowerCase()}</SheetTitle>
        <SheetDescription>
          {field.layer === "canonical"
            ? "Enable publishes this value. Your change sits above it, and the published value stays readable underneath."
            : "Your change is kept with your name and today’s date."}
        </SheetDescription>
      </SheetHeader>

      <SheetBody>
        <DataList rows={[
          { label: field.layer === "canonical" ? "Published value" : "Current value", value: field.value },
          { label: "Source", value: `${field.source.where} · ${field.source.when}` },
        ]} />

        <AudiencePicker<EditScope>
          id="edit-scope"
          question="Who is this change for?"
          value={(scope ?? "") as EditScope}
          onChange={setScope}
          options={editOptions(s.role)}
        />

        <div>
          <Label htmlFor="edit-value">New value</Label>
          <Textarea id="edit-value" rows={2} value={value} onChange={(e) => setValue(e.target.value)} className="mt-[var(--space-2)]" />
        </div>

        <div>
          <Label htmlFor="edit-reason">
            Why? <span className="text-label-secondary">(required)</span>
          </Label>
          <p className="mt-1 type-meta">Kept with the value, for the next person who opens this field.</p>
          <Textarea
            id="edit-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. confirmed by the property on today’s call"
            className="mt-[var(--space-2)]"
          />
        </div>
      </SheetBody>
      <SheetActions aside={mine ? <Button variant="tertiary" onClick={remove}>Remove my change</Button> : undefined}>
        <Button variant="secondary" onClick={close}>Cancel</Button>
        <Button disabled={!ready} onClick={commit}>{mode === "review" ? "Send for release" : "Save change"}</Button>
      </SheetActions>
    </>
  );
}

/* ═══════════════ Resolve sheet ═══════════════
   All three values are selectable; the chosen one inverts its edge (VIS-021) and the
   decision carries a reason, because every irreversible act in this product does. The
   act sits in the footer, after Cancel, like every sheet's (COL-11), and the toast can
   put the dispute back (FB-09).                                                      */
function ResolveSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { s, d } = useDemo();
  const [picked, setPicked] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const chosen = commissionConflict.sources.find((x) => x.id === picked);

  const commit = () => {
    if (!picked || !chosen || !reason.trim()) return;
    const before = { conflictResolved: s.conflictResolved, conflictChoice: s.conflictChoice, conflictReason: s.conflictReason, decisions: s.decisions };
    d({ type: "resolveConflict", choice: picked, reason: reason.trim() });
    d({ type: "decide", id: "resolved:commission", what: picked });
    onOpenChange(false);
    setPicked(null);
    setReason("");
    notify(`Commission kept at ${chosen.value}`, { detail: "For the whole agency, with your reason.", undo: () => d({ type: "patch", patch: before }) });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(92vw,560px)]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Scale className="size-[var(--icon-lg)] text-label-secondary" aria-hidden /> {commissionConflict.field}: 3 sources</SheetTitle>
          <SheetDescription>{commissionConflict.headline}</SheetDescription>
        </SheetHeader>
        <div className="space-y-[var(--space-4)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
          <div role="radiogroup" aria-label="Sources" className="space-y-[var(--space-2)]">
            {commissionConflict.sources.map((src) => {
              const on = picked === src.id;
              return (
                <button
                  key={src.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPicked(src.id)}
                  className={cn(
                    "pressable block w-full cursor-pointer rounded-lg border p-[var(--space-4)] text-left",
                    on ? "border-selected bg-sunken" : "border-hairline hover:border-stroke-hover",
                  )}
                >
                  <div className="flex flex-wrap items-start gap-[var(--space-3)]">
                    <div className="min-w-0">
                      <div className="type-data-strong">{src.label}</div>
                      <div className="type-meta">{src.detail} · {src.when}</div>
                    </div>
                    <span className="ml-auto type-figure">{src.value}</span>
                  </div>
                  <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-[var(--space-3)]">
                    <span className="type-data-strong">{src.status}</span>
                    <ConfidenceMeter agree={src.agree} total={src.total} />
                    {on && <Chip tone="primary" className="ml-auto">Selected</Chip>}
                  </div>
                </button>
              );
            })}
          </div>

          {chosen && (
            <div className="border-t border-hairline pt-[var(--space-4)]">
              <Label htmlFor="resolve-reason">
                Why {chosen.value}? <span className="text-label-secondary">(required)</span>
              </Label>
              <p className="mt-1 type-meta">Kept with the value for the whole agency, with your name and today&rsquo;s date.</p>
              <Textarea
                id="resolve-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. confirmed by Corvin & Wells on the 21 June rate note"
                className="mt-[var(--space-3)]"
              />
            </div>
          )}

          <div className="border-t border-hairline pt-[var(--space-4)]">
            <div className="type-meta text-label-tertiary">Where this value goes</div>
            <p className="mt-1 type-data text-label-secondary">
              The value you keep is what the directory shows, what a quote uses, and what the assistant answers with.
            </p>
            <DataList className="mt-[var(--space-2)]" rows={commissionConflict.impact.map((row) => ({
              label: row.surface, value: <span className="type-data-strong tnum">{chosen ? chosen.value : row.value}</span>,
            }))} />
          </div>

          <div className="border-t border-hairline pt-[var(--space-4)]">
            <div className="type-meta text-label-tertiary">The other fields</div>
            <DataList className="mt-[var(--space-2)]" rows={commissionConflict.otherFields.map((f) => ({
              label: f.label, value: <LayerBadge layer={f.layer} />,
            }))} />
            <p className="mt-[var(--space-2)] type-meta">Only commission is in dispute.</p>
          </div>
        </div>
        <SheetActions>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!chosen || !reason.trim()} onClick={commit}>{chosen ? `Keep ${chosen.value}` : "Keep a value"}</Button>
        </SheetActions>
      </SheetContent>
    </Sheet>
  );
}

/* Each layer says what it is, once, where it governs. */
const layerLede: Record<Layer, string> = {
  canonical: "Published by Enable. Shared by every agency, and not yours to edit.",
  agency: "What your agency has decided, sitting over the canonical value beneath it.",
  personal: "Yours. Scoped when you write it, and visible to no one you did not name.",
};

/* ═══════════════ Maison Léandre — the full anatomy ═══════════════ */
function LeandreRecord() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s);
  const p = productById("maison-leandre")!;
  const trays = useProgrammeTrays(p.id);
  const search = useSearchParams();
  const [resolveOpen, setResolveOpen] = useState(() => search?.get("resolve") === "1");
  const [noteOpen, setNoteOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(() => search?.get("compose") === "notice");
  const [editing, setEditing] = useState(false);
  const [editField, setEditField] = useState<Field | null>(null);
  const [returnKey, setReturnKey] = useState<string | null>(null);
  const scrollTo = useScrollTo();
  const spaNotice = notices.find((n) => n.id === "spa");
  const promo = promotions.find((x) => x.id === "atelier-credit");
  const rep = products.find((x) => x.name === p.repFirm);

  /* A notification about a proposed value opens the record at that field. */
  const reviewKey = search?.get("review") ?? null;
  useEffect(() => {
    if (!reviewKey) return;
    document.getElementById(`field-${reviewKey}`)?.scrollIntoView({ block: "center" });
  }, [reviewKey]);

  /* The owner decides in place; the field shows the result, and the toast can take the
     decision back (FB-06). */
  const approve = (f: Field) => {
    const edit = s.fieldEdits[f.key];
    const before = { fieldEdits: s.fieldEdits };
    d({ type: "reviewEdit", key: f.key, outcome: "approved" });
    notify(`${f.label} approved for the whole agency`, {
      detail: edit ? `${personName[edit.by]}’s value now answers for everyone.` : undefined,
      undo: () => d({ type: "patch", patch: before }),
    });
  };
  const returnField = leandreFields.find((f) => f.key === returnKey) ?? null;

  const groups: { layer: Layer; title: string }[] = [
    { layer: "canonical", title: "Enable canonical" },
    { layer: "agency", title: "Agency overlay" },
    { layer: "personal", title: "Personal" },
  ];
  /* The programme's own fields (its commission, the perk negotiated on it, membership)
     are shown in the Programmes chapter, in Atelier's column, not in the layer list: a
     commission is only true under the programme that pays it (2026-09-28). */
  const PROGRAMME_KEYS = ["commission", "perk", "program"];
  const fieldsFor = (layer: Layer) =>
    leandreFields.filter(
      (f) =>
        f.layer === layer &&
        !PROGRAMME_KEYS.includes(f.key) &&
        (s.role === "user" || f.key !== "note-rd")
    );
  const fieldRow = (key: string, label?: string) => {
    const f = leandreFields.find((x) => x.key === key);
    if (!f) return null;
    const shown = label ? { ...f, label } : f;
    return (
      <FieldRow
        f={shown}
        resolved={s.conflictResolved}
        onResolve={() => setResolveOpen(true)}
        editing={editing}
        onEdit={() => setEditField(f)}
        onApprove={() => approve(f)}
        onReturn={() => setReturnKey(f.key)}
      />
    );
  };

  const staleField = leandreFields.find((f) => f.state === "stale");
  const staleDone = staleField ? s.decisions[`verified:${staleField.key}`] : undefined;
  const kept = keptSource(s.conflictChoice);

  /* The one act: settle the dispute, if you see money and it is open; otherwise put the
     record on a trip. */
  const resolveAct = money && !s.conflictResolved;
  const canAdd = addable(s, p);
  const act = resolveAct
    ? <Button className="w-full" onClick={() => setResolveOpen(true)}>Resolve 3 sources</Button>
    : canAdd ? <AddToTrip p={p} primary className="w-full" /> : undefined;
  const second = resolveAct && canAdd ? <AddToTrip p={p} primary={false} className="w-full" /> : undefined;

  return (
    <Page width="wide">
      <RecordHeader
        name={p.name}
        meta={`${p.category} · ${p.city}, ${p.country}`}
        p={p}
        edit={{ on: editing, toggle: () => setEditing((v) => !v) }}
        onNote={() => setNoteOpen(true)}
        onNotice={() => setNoticeOpen(true)}
      />

      <div className="doc-layout">
        {/* ── the body: chapters at column width ── */}
        <div className="min-w-0">
          <div className="space-y-[var(--space-2)] pb-[var(--gap-2)] empty:hidden">
            {createdNoticesOn(s, p.id).map((n) => <NoticeBlock key={n.id} n={n} />)}
            {s.world === "v2" && spaNotice && (s.retired[spaNotice.id] || !s.spaNoticeClosed) && <NoticeBlock n={spaNotice} />}
          </div>

          {groups.map((g) => (
            <Section key={g.layer} title={g.title}>
              <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data text-label-secondary">{layerLede[g.layer]}</p>
              <div className="divide-y divide-hairline">
                {fieldsFor(g.layer).map((f) => (
                  <FieldRow
                    key={f.key}
                    f={f}
                    resolved={s.conflictResolved}
                    onResolve={() => setResolveOpen(true)}
                    editing={editing}
                    onEdit={() => setEditField(f)}
                    onApprove={() => approve(f)}
                    onReturn={() => setReturnKey(f.key)}
                  />
                ))}
                {g.layer === "personal" && <NoteRow recordId={p.id} />}
              </div>
            </Section>
          ))}

          {/* Commission and amenities, programme by programme. Atelier's column carries
              the record's own layered fields: the disputed commission, and the perk the
              agency negotiated over the programme's standard (2026-09-28). */}
          <ProgrammesChapter
            p={p}
            money={money}
            trays={trays}
            slots={{
              Atelier: {
                rate: s.conflictResolved
                  ? <span className="type-data-strong tnum">{kept.value}</span>
                  : <Chip tone="warn">3 sources disagree</Chip>,
                commission: fieldRow("commission"),
                afterGuests: fieldRow("perk", "Negotiated perk"),
              },
            }}
          />

          {/* What the property itself offers, kept apart from what a programme promises
              (DEC-34): its facilities, and its own description copy. */}
          <Section title="Facilities" deep>
            <div className="divide-y divide-hairline">
              <FieldGrid label="On site">
                <p className="type-data">{leandreContext.facilityAmenities.join(" · ")}</p>
              </FieldGrid>
              <FieldGrid label="Description copy">
                <p className="type-data italic text-label-secondary">“View Hotel — experience refined luxury…”</p>
                <Chip tone="neutral" className="mt-1">template copy, needs editorial</Chip>
              </FieldGrid>
            </div>
          </Section>

          <Section title="Contacts" deep>
            <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data text-label-secondary">
              Rep firm of record:{" "}
              {rep ? <Link href={`/records/${rep.id}`} className={linkClass}>{rep.name}</Link> : p.repFirm}, Paris account.
              Last booked by {leandreContext.whoBookedLast.replace(" · ", ", ")}.
            </p>
            <Rows>
              {leandreContext.contacts.map((c) => (
                <li key={c.name} className="py-[11px]">
                  <div className="row-grid !min-h-0 !py-0">
                    <span className="row-primary">
                      <span className="type-data-strong">{c.name}</span>
                      <span className="text-label-secondary"> · {c.role}</span>
                    </span>
                  </div>
                  {c.note && <div className="mt-0.5 type-meta">{c.note}</div>}
                </li>
              ))}
            </Rows>
          </Section>

          {/* Both types: each traveller in it is visible only through that traveller's own sharing. */}
          <Section title="Client intelligence" quiet deep>
            <p className="flex items-center gap-2 type-meta">
              <EyeOff className="size-[var(--icon-sm)] shrink-0" aria-hidden />
              {leandreContext.clientIntelligence.note}
            </p>
          </Section>
        </div>

        {/* ── the tool that follows you: everything unsettled, and the one act ── */}
        <aside className="doc-rail" data-rail-label="Summary">
          <Section variant="tool" follows title="Summary">
            <DataList rows={[
              ...(money ? [{
                label: "Atelier commission",
                value: s.conflictResolved
                  ? <Chip tone="neutral">resolved · {kept.value}</Chip>
                  : <Chip tone="warn">3 sources disagree</Chip>,
              }] : []),
              ...(staleField ? [{
                label: staleField.label,
                value: <Chip tone="neutral" className="tnum">{staleDone ? `verified ${timeOf(staleDone.at)}` : `${staleField.staleDays}d unverified`}</Chip>,
              }] : []),
              ...(money && promo ? [{
                label: "Promotion",
                value: <Chip tone="neutral" className="tnum">{promo.daysLeft} days left</Chip>,
              }] : []),
            ]} />
            <RailActs
              act={act && <>{act}{second}</>}
              ask={<AskButton id={p.id} name={p.name} alone={!act} className="w-full" />}
            />
            {resolveAct && <p className="mt-[var(--space-2)] hidden text-center type-meta lg:block">Kept for the whole agency, with your reason.</p>}
            <OnTrips p={p} />
          </Section>
        </aside>
      </div>

      <ResolveSheet open={resolveOpen && money && !s.conflictResolved} onOpenChange={setResolveOpen} />
      <EditFieldSheet field={editField} open={!!editField} onOpenChange={(v) => !v && setEditField(null)} />
      <ReturnEditSheet
        key={returnKey ?? "none"}
        field={returnField}
        open={!!returnField}
        onOpenChange={(v) => !v && setReturnKey(null)}
      />


      <NoteSheet recordId={p.id} recordName={p.name} open={noteOpen} onOpenChange={setNoteOpen} onSaved={() => scrollTo(`note-${p.id}`)} />
      <NoticeSheet productId={p.id} productName={p.name} open={noticeOpen} onOpenChange={setNoticeOpen} />

      <ActionBar>
        <AskButton id={p.id} name={p.name} alone={!act} />
        {resolveAct
          ? <Button size="sm" onClick={() => setResolveOpen(true)}>Resolve 3 sources</Button>
          : canAdd ? <AddToTrip p={p} primary size="sm" /> : null}
      </ActionBar>
    </Page>
  );
}

/* ── one field row, all states ──────────────────────────────────────────────────
   An editable value shows "Edit" beside it on hover and on focus, so changing one
   value is one step (COL-11); the header's Edit keeps every one of them showing. */
function FieldRow({
  f, resolved, onResolve, editing, onEdit, onApprove, onReturn,
}: {
  f: Field; resolved: boolean; onResolve: () => void;
  editing?: boolean; onEdit?: () => void;
  onApprove?: () => void; onReturn?: () => void;
}) {
  const { s, d } = useDemo();
  const kept = keptSource(s.conflictChoice);
  const reason = s.conflictReason;
  const resolvedBy = s.decisions["resolved:commission"];
  const verified = s.decisions[`verified:${f.key}`];

  /* An edit is seen by its author, and by everyone once it is written for the whole
     agency. Personal and team edits are absent for the other type, never masked. */
  const raw = s.fieldEdits[f.key];
  const mine = raw?.by === s.role;
  const edit = raw && (mine || raw.scope === "agency") ? raw : undefined;
  const applied = edit && !edit.pending && !edit.returned ? edit : undefined;
  const waiting = edit && edit.pending && mine ? edit : undefined;
  const returned = edit && edit.returned && mine ? edit : undefined;
  /* The owner's to decide: an advisor's proposal for the whole agency. */
  const proposal = edit && edit.pending && !mine && s.role === "owner" ? edit : undefined;

  if (f.state === "conflict") {
    return (
      <FieldGrid id={`field-${f.key}`} label={f.label}>
        {resolved ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <ProvenancePopover source={f.source}><span className="type-data-strong tnum">{kept.value}</span></ProvenancePopover>
            <Chip tone="neutral">resolved</Chip>
            <span className="type-meta">
              agency layer · {kept.label} · by {resolvedBy ? `${personName[resolvedBy.by]}, ${resolvedBy.at}` : `${people.advisor} today`} · both other sources still reachable
            </span>
            {reason && <span className="basis-full type-meta">Reason: “{reason}”</span>}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {commissionConflict.sources.map((src) => (
                <span key={src.id} className="rounded-md border border-hairline px-2 py-1 type-data">
                  <span className="type-data-strong tnum">{src.value}</span> <span className="text-label-secondary">{src.label} · {src.when}</span>
                </span>
              ))}
            </div>
            {/* The decision is reachable from the field, as a secondary; the one
                primary lives in the Summary, the tool that owns it (VIS-072). */}
            <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-2">
              <Chip tone="warn">3 sources disagree</Chip>
              <Button variant="secondary" size="sm" onClick={onResolve}>Resolve 3 sources</Button>
            </div>
          </>
        )}
      </FieldGrid>
    );
  }

  const canEdit = !!onEdit && !proposal && !returned;
  return (
    <FieldGrid
      id={`field-${f.key}`}
      label={f.label}
      className="group"
      provenance={
        <>
          <SourceTag kind={f.source.kind} label={f.source.where} />
          <span className="type-meta">{f.source.when}</span>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <ProvenancePopover source={f.source}>
          <span
            className={cn(
              "type-data", f.key === "rooms" && "tnum",
              f.state === "template" && "italic text-label-secondary",
              applied && "line-through text-label-secondary",
            )}
          >
            {f.value}
          </span>
        </ProvenancePopover>
        {applied && <span className="type-data-strong">{applied.value}</span>}
        {applied && <Chip tone="neutral">{applied.scope} · edited by {personName[applied.by]} today</Chip>}
        {waiting && <Chip tone="neutral">waiting for {people.owner}</Chip>}
        {returned && <Chip tone="warn">returned by {people.owner}</Chip>}
        {proposal && <Chip tone="warn">proposed by {personName[proposal.by]}</Chip>}
        {f.state === "edited-overlay" && !applied && <Chip tone="neutral">agency overlay</Chip>}
        {f.state === "stale" && verified && <Chip tone="neutral">verified {timeOf(verified.at)} · {personName[verified.by]}</Chip>}
        {f.state === "stale" && !verified && <Chip tone="neutral" className="tnum">{f.staleDays}d unverified</Chip>}
        {f.state === "template" && <Chip tone="neutral">template copy, needs editorial</Chip>}
        {canEdit && (
          <Button
            variant="tertiary"
            size="sm"
            onClick={onEdit}
            aria-label={`Edit ${f.label.toLowerCase()}`}
            className={cn(!editing && "sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 sm:focus-visible:opacity-100")}
          >
            <Pencil aria-hidden /> Edit
          </Button>
        )}
      </div>

      {applied && <p className="mt-1 type-meta">Reason: “{applied.reason}”</p>}

      {waiting && (
        <p className="mt-1 type-meta">
          Proposed “{waiting.value}” for the whole agency · Reason: “{waiting.reason}”. The record answers with its
          current value until {people.owner} releases it.
        </p>
      )}

      {/* Returned to its author: not applied, with the owner's note. */}
      {returned && (
        <div className="mt-[var(--space-2)]">
          <p className="type-meta">
            Your proposed “{returned.value}” was not applied.{" "}
            {returned.returned?.note ? <>{people.owner}’s note: “{returned.returned.note}”</> : <>Returned without a note.</>}
          </p>
          <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-[var(--space-3)]">
            {onEdit && <Button variant="secondary" size="sm" onClick={onEdit}>Edit again</Button>}
            <Button variant="tertiary" size="sm" onClick={() => d({ type: "revertField", key: f.key })}>
              Remove my change
            </Button>
          </div>
        </div>
      )}

      {/* The owner decides in place. Approve is a secondary: the page's primary stays
          in the Summary. */}
      {proposal && (
        <div className="mt-[var(--space-3)] border-t border-hairline pt-[var(--space-3)]">
          <div className="type-meta text-label-tertiary">Proposed for the whole agency</div>
          <div className="mt-1 type-data-strong">{proposal.value}</div>
          <p className="mt-1 type-meta">
            By {personName[proposal.by]}, today · Reason: “{proposal.reason}”. The record answers with its current value until you approve.
          </p>
          <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-3)]">
            <Button variant="secondary" size="sm" onClick={onApprove}>Approve</Button>
            <Button variant="tertiary" size="sm" onClick={onReturn}>Return with a note</Button>
          </div>
        </div>
      )}

      {f.state === "stale" && !verified && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-[var(--space-2)]"
          onClick={() => d({ type: "decide", id: `verified:${f.key}`, what: "Verified against source" })}
        >
          Verify against source
        </Button>
      )}

      {f.state === "template" && (
        <p className="mt-1 type-meta">Not used to corroborate answers.</p>
      )}
      {f.state === "edited-overlay" && f.beneath && (
        <p className="mt-1 type-meta">
          canonical beneath ·{" "}
          <ProvenancePopover source={f.beneath.source}><span>{f.beneath.value}</span></ProvenancePopover>
        </p>
      )}
    </FieldGrid>
  );
}

/* ── the field row's shape: label · value · provenance on one shared track ── */
function FieldGrid({
  id, label, provenance, className, children,
}: { id?: string; label: string; provenance?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div id={id} className={cn("field-row", className)}>
      <div className="type-data text-label-secondary">{label}</div>
      <div className="min-w-0">{children}</div>
      {provenance && (
        <div className="flex flex-col items-start gap-0.5 sm:items-end sm:text-right">
          {provenance}
        </div>
      )}
    </div>
  );
}

/* ═══════════════ Every other record — real, from its own fields ═══════════════
   Hôtel Verlaine is one of them now: its Critical notice is a Blocker through the
   store's one gate, not a page of its own with an acknowledgment (COL-03).          */
function GenericRecord({ id }: { id: string }) {
  const { s } = useDemo();
  const search = useSearchParams();
  const [noticeOpen, setNoticeOpen] = useState(() => search?.get("compose") === "notice");
  const [noteOpen, setNoteOpen] = useState(false);
  const scrollTo = useScrollTo();
  const money = canViewCommissions(s);
  const p = productById(id);
  const reviewer = s.role === "owner";
  const block = useBlockAct({ id, name: p?.name ?? "" });
  const trays = useProgrammeTrays(id);

  /* A record added by hand, for whoever it has reached. For anyone else it is not in
     the directory: the same page an id nobody carries gets. */
  const made = s.createdRecords.find((r) => r.id === id);
  if (made && createdVisible(s, made)) return <CreatedRecordPage r={made} />;

  if (!p) {
    return (
      <Page width="wide">
        <PageHeader title="Not in the directory" />
        <Section>
          <p className="type-data text-label-secondary">
            No record carries this id. A property that is missing can be added by hand from Records.
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-[var(--space-3)]">
            <Link href="/records">Back to records <ArrowRight aria-hidden /></Link>
          </Button>
        </Section>
      </Page>
    );
  }

  if (p.id === "sereno-kyoto" && !s.candidateConfirmed && !reviewer) {
    return (
      <Page width="wide">
        <PageHeader title="Awaiting confirmation" />
        <Section>
          <p className="type-data text-label-secondary">
            This candidate arrived from a DMC spreadsheet and has not been confirmed yet. Until a reviewer has
            been through it field by field, it answers no questions and is not offered to clients.
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-[var(--space-3)]">
            <Link href="/records">Back to records <ArrowRight aria-hidden /></Link>
          </Button>
        </Section>
      </Page>
    );
  }

  /* A personal or team notice reaches only whoever wrote it; the agency's reach everyone. */
  const productNotices = s.world === "v2" ? notices.filter((n) => n.productId === p.id && (n.scope === "agency" || ownsNotice(n, s.role))) : [];
  const madeNotices = s.world === "v2" ? createdNoticesOn(s, p.id) : [];
  const gate = s.world === "v2" ? noticeGate(s, p.id) : null;
  const productPromo = promotions.find((x) => x.productId === p.id);
  /* What the agency announced about this property: the record links back to it. */
  const announcedHere = announcementsFor(s).filter((a) => a.links.includes(p.id) && !a.waiting);
  const rep = p.repFirm ? products.find((x) => x.name === p.repFirm) : undefined;
  const represented = p.category === "Rep firm" ? products.filter((x) => x.repFirm === p.name) : [];

  /* The one act. Closed to bookings: the Blocker carries it. The owner's unconfirmed
     candidate: review it. Otherwise: put it on a trip, where there is one to put it on. */
  const candidate = p.id === "sereno-kyoto" && !s.candidateConfirmed && reviewer;
  const canAdd = addable(s, p);
  const act = candidate
    ? <Button asChild className="w-full"><Link href="/admin/review">Review the candidate</Link></Button>
    : canAdd ? <AddToTrip p={p} primary className="w-full" /> : undefined;
  const barAct = candidate
    ? <Button asChild size="sm"><Link href="/admin/review">Review the candidate</Link></Button>
    : canAdd ? <AddToTrip p={p} primary size="sm" /> : null;

  return (
    <Page width="wide">
      <RecordHeader
        name={p.name}
        meta={`${p.category} · ${p.city}${p.country !== "—" ? `, ${p.country}` : ""}`}
        p={p}
        onNote={() => setNoteOpen(true)}
        onNotice={() => setNoticeOpen(true)}
      />

      <div className="doc-layout">
        <div className="min-w-0">
          {(productNotices.length > 0 || madeNotices.length > 0) && (
            <div className="space-y-[var(--space-2)] pb-[var(--gap-2)]">
              {madeNotices.map((n) => <NoticeBlock key={n.id} n={n} />)}
              {productNotices.map((n) => (
                <NoticeBlock
                  key={n.id}
                  n={n}
                  act={n.severity === "Critical" && gate?.level === "block" && gate.notice.id === n.id ? block.act : undefined}
                  after={n.severity === "Critical" ? block.done : undefined}
                />
              ))}
            </div>
          )}

          {announcedHere.length > 0 && (
            <Section title="Announced">
              <Rows>
                {announcedHere.map((a) => (
                  <Row key={a.id}>
                    <Link href={`/knowledge?source=Announcements&doc=${a.id}`} className={cn("row-primary type-data-strong", linkClass)}>
                      {a.title}
                    </Link>
                    <span className="row-trailing type-meta tnum">{personName[a.by]} · {a.when}</span>
                  </Row>
                ))}
              </Rows>
            </Section>
          )}

          <Section title="The record">
            {p.blurb && <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data text-label-secondary">{p.blurb}</p>}
            <dl className="divide-y divide-hairline type-data">
              <DlRow k="Location">{p.city}{p.country !== "—" ? `, ${p.country}` : ""} · {p.region}</DlRow>
              <DlRow k="Tier">{p.luxuryTier}</DlRow>
              {p.brand && <DlRow k="Brand">{p.brand}</DlRow>}
              {p.address && <DlRow k="Address">{p.address}</DlRow>}
              {p.rooms !== undefined && <DlRow k="Rooms" tnum>{p.rooms}</DlRow>}
              <DlRow k="Status">{p.status}</DlRow>
              {p.repFirm && (
                <DlRow k="Rep firm">
                  {rep ? <Link href={`/records/${rep.id}`} className={linkClass}>{rep.name}</Link> : p.repFirm}
                </DlRow>
              )}
              {p.tags && p.tags.length > 0 && <DlRow k="Style">{p.tags.join(" · ")}</DlRow>}
            </dl>
          </Section>

          {/* Commission and amenities belong to a programme, so they live in it. */}
          {p.category !== "Rep firm" && <ProgrammesChapter p={p} money={money} trays={trays} />}

          {represented.length > 0 && (
            <Section title="Represents" deep>
              <Rows>
                {represented.map((x) => (
                  <Row key={x.id}>
                    <Link href={`/records/${x.id}`} className={cn("row-primary type-data", linkClass)}>{x.name}</Link>
                    <span className="row-trailing type-meta">{x.city}</span>
                  </Row>
                ))}
              </Rows>
            </Section>
          )}

          {noteOf(s, p.id) && (
            <Section title="Notes" deep>
              <NoteRow recordId={p.id} />
            </Section>
          )}
        </div>

        <aside className="doc-rail" data-rail-label="Summary">
          <Section variant="tool" follows title="Summary">
            <DataList rows={[
              ...(gate?.level === "block" ? [{ label: "Bookings", value: <Chip tone="crit">Closed to bookings</Chip> }] : []),
              ...(money && programmeRates(p.id) ? [{
                label: "Commission",
                value: <ProgrammeRateLinks productId={p.id} trays={trays} />,
              }] : []),
              {
                label: "Evidence",
                value: <Chip tone="neutral">{p.id === "sereno-kyoto" && s.candidateConfirmed ? "confirmed today" : p.evidence.label}</Chip>,
              },
              { label: "Updated", value: <span className="type-meta tnum">{p.updated} · verified {p.lastVerified}</span> },
              ...(money && productPromo ? [{
                label: "Promotion",
                value: <Chip tone="neutral" className="tnum">{productPromo.daysLeft} days left</Chip>,
              }] : []),
            ]} />
            <RailActs act={act} ask={<AskButton id={p.id} name={p.name} alone={!act} className="w-full" />} />
            <OnTrips p={p} />
          </Section>
        </aside>
      </div>

      <NoteSheet recordId={p.id} recordName={p.name} open={noteOpen} onOpenChange={setNoteOpen} onSaved={() => scrollTo(`note-${p.id}`)} />
      <NoticeSheet productId={p.id} productName={p.name} open={noticeOpen} onOpenChange={setNoticeOpen} />

      <ActionBar>
        <AskButton id={p.id} name={p.name} alone={!barAct} />
        {barAct}
      </ActionBar>
    </Page>
  );
}

/* ── Programmes — commission and amenities, programme by programme (2026-09-28) ──
   Constantin: a record's commercial terms depend on the partner programme a booking is
   made under, so they are shown, and organised, by programme; never as one flat rate
   beside a row of programme names.

   Trays (Constantin, 2026-09-28: "you might have different partner programs so they need
   to be selectable / openable trays"). A property can sit in many programmes, and side
   by side stops working at three. So each programme is a tray: a row that says what you
   compare programmes on (the programme, its commission, what guests get) and opens to
   the rest. Closed trays are rows between hairlines; an open tray lifts, the row's own
   selected state (VIS-095), and holds the same rows in the same order:
     Commission    the rate and what it is on.
     Paid          when the programme pays.
     Incentive     a promotion on this programme, with both windows.
     Guests get    the programme's amenities for this property (client_amenities),
                   kept apart from the property's own facilities (DEC-34).
     You get       the programme's agent amenities.
     How to book   the programme's way in, and this property's rate code.
     Terms         where they come from, when this property's were last verified, and
                   when the programme renews.
   Any number open at once, so two can be read one above the other. The first is open
   on arrival; which are open lives in the URL (`?programme=Atelier,Meridian`), so Back
   and a shared link keep them, and the Summary's rates open the one they name.
   Money rows are absent without the entitlement, never masked; what guests get is not
   money and always shows. `slots` lets Maison Léandre put its layered fields (the
   disputed commission, the negotiated perk) in their programme's rows, where they keep
   their provenance, edits and dispute, and its state on the tray's row. */
type ProgrammeSlots = Partial<Record<ProgrammeId, { rate?: ReactNode; commission?: ReactNode; afterGuests?: ReactNode }>>;

interface ProgrammeTrays { open: Set<ProgrammeId>; toggle: (id: ProgrammeId) => void; reveal: (id: ProgrammeId) => void }

function useProgrammeTrays(productId: string): ProgrammeTrays {
  const ids = programmeLinksFor(productId).map((l) => l.programme);
  const [param, setParam] = useQueryState("programme", ids[0] ?? "");
  const open = new Set(
    (param === "none" ? "" : param).split(",").filter((x): x is ProgrammeId => ids.includes(x as ProgrammeId)),
  );
  /* In the record's own order; "none" when every tray is closed, since an absent key
     means the first is open. */
  const write = (next: Set<ProgrammeId>) => {
    const ordered = ids.filter((x) => next.has(x));
    setParam(ordered.length ? ordered.join(",") : "none");
  };
  return {
    open,
    toggle: (id) => {
      const next = new Set(open);
      if (next.has(id)) next.delete(id); else next.add(id);
      write(next);
    },
    reveal: (id) => {
      write(new Set(open).add(id));
      requestAnimationFrame(() => document.getElementById(`programme-${id}`)?.scrollIntoView({ block: "start" }));
    },
  };
}

/** The Summary's commission: each programme's rate, and each opens its own tray. */
function ProgrammeRateLinks({ productId, trays }: { productId: string; trays: ProgrammeTrays }) {
  const links = programmeLinksFor(productId);
  return (
    <span className="type-meta tnum text-label">
      {links.map((l, i) => (
        <span key={l.programme}>
          {i > 0 && " · "}
          <a
            href={`#programme-${l.programme}`}
            onClick={(e) => { e.preventDefault(); trays.reveal(l.programme); }}
            className="hover:underline"
          >
            {programmes[l.programme].name} {l.rate}
          </a>
        </span>
      ))}
    </span>
  );
}

function ProgrammesChapter({
  p, money, slots, trays,
}: { p: Product; money: boolean; slots?: ProgrammeSlots; trays: ProgrammeTrays }) {
  const links = programmeLinksFor(p.id);
  const many = links.length > 1;
  return (
    <Section title="Programmes" deep anchor="programmes">
      <p className="-mt-[var(--space-2)] mb-[var(--space-3)] max-w-[62ch] type-data text-label-secondary">
        {links.length === 0
          ? "No partner programme on file. Bookings are made at the public rate, with no commission or amenities agreed in advance."
          : many
            ? `${p.name} sits in ${links.length} partner programmes. Commission and what guests get depend on the one a booking is made under.`
            : `${p.name} sits in one partner programme. Its commission and what guests get come with it.`}
      </p>
      {links.length > 0 && (
        <ul className="-mx-[var(--space-3)]">
          {links.map((l) => (
            <ProgrammeTray
              key={l.programme}
              l={l}
              money={money}
              slot={slots?.[l.programme]}
              open={trays.open.has(l.programme)}
              onToggle={() => trays.toggle(l.programme)}
            />
          ))}
        </ul>
      )}
      {p.consortia.length > 0 && (
        <p className="mt-[var(--space-4)] border-t border-hairline pt-[var(--space-3)] type-data">
          <span className="text-label-secondary">Networks · </span>{p.consortia.join(" · ")}
        </p>
      )}
    </Section>
  );
}

function ProgrammeTray({
  l, money, slot, open, onToggle,
}: { l: ProgrammeLink; money: boolean; slot?: ProgrammeSlots[ProgrammeId]; open: boolean; onToggle: () => void }) {
  const prog = programmes[l.programme];
  const promo = promotions.find((x) => x.productId === l.productId && x.program === l.programme);
  const bodyId = `programme-${l.programme}-terms`;
  /* What the closed row says: enough to choose which one to open. */
  const guests = l.clientAmenities.map((a) => a.benefit).join(" · ");

  return (
    <li
      id={`programme-${l.programme}`}
      data-programme={l.programme}
      data-state={open ? "selected" : undefined}
      className={cn(open ? "row-lift" : "row-select", "scroll-mt-[var(--space-6)]")}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
        className="flex w-full items-start gap-[var(--space-3)] px-[var(--space-3)] py-[var(--space-3)] text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-[var(--space-2)]">
            <span className="type-data-strong">{prog.name}</span>
            <span className="type-meta">{prog.kind}</span>
          </span>
          <span className="mt-0.5 block truncate type-meta">
            {l.note ?? `Guests get ${guests.charAt(0).toLowerCase()}${guests.slice(1)}`}
          </span>
        </span>
        {money && !l.note && (
          <span className="flex shrink-0 items-center gap-[var(--space-2)]">
            {promo && <Chip tone="neutral" className="tnum">incentive · {promo.daysLeft} days left</Chip>}
            {slot?.rate ?? <span className="type-data-strong tnum">{l.rate}</span>}
          </span>
        )}
        <ChevronDown
          aria-hidden
          className={cn(
            "mt-0.5 size-[var(--icon-md)] shrink-0 text-label-secondary transition-transform duration-[var(--dur)]",
            open && "rotate-180",
          )}
        />
      </button>

      {open && !l.note && (
        <div id={bodyId} className="mx-[var(--space-3)] divide-y divide-hairline border-t border-hairline pb-[var(--space-1)]">
          {money && (slot?.commission ?? (
            <FieldGrid label="Commission">
              <p><span className="type-data-strong tnum">{l.rate}</span> <span className="type-data text-label-secondary">{l.basis}</span></p>
            </FieldGrid>
          ))}
          {money && (
            <FieldGrid label="Paid">
              <p className="type-data">{prog.paid.charAt(0).toUpperCase() + prog.paid.slice(1)}</p>
            </FieldGrid>
          )}
          {money && promo && (
            <FieldGrid label="Incentive">
              <p className="type-data">{promo.rate}, {promo.stacksWithBase ? "adds to the commission" : "replaces the programme's terms"}</p>
              <p className="mt-0.5 type-meta tnum">Book by {promo.bookingWindowEnd} · travel by {promo.travelWindowEnd} · {promo.daysLeft} days left</p>
            </FieldGrid>
          )}
          <FieldGrid label="Guests get">
            <ul className="space-y-0.5">
              {l.clientAmenities.map((a) => <li key={a.slug} className="type-data">{a.benefit}</li>)}
            </ul>
          </FieldGrid>
          {slot?.afterGuests}
          {money && (
            <FieldGrid label="You get">
              <ul className="space-y-0.5">
                {prog.agentAmenities.map((a) => (
                  <li key={a.category} className="type-data"><span className="text-label-secondary">{a.category} · </span>{a.text}</li>
                ))}
              </ul>
            </FieldGrid>
          )}
          <FieldGrid label="How to book">
            <p className="type-data">{prog.booking}</p>
            {l.code && <p className="mt-0.5 type-meta tnum">Rate code {l.code}</p>}
          </FieldGrid>
          <FieldGrid label="Terms">
            <ProvenancePopover source={prog.source}>
              <span className="type-data">{prog.source.where}</span>
            </ProvenancePopover>
            <p className="mt-0.5 type-meta tnum">
              This property verified {l.verified}{l.staleDays ? `, ${Math.round(l.staleDays / 30)} months ago` : ""} · the programme renews {prog.renews}
            </p>
          </FieldGrid>
        </div>
      )}
    </li>
  );
}

/* The same track as FieldGrid, in description-list markup. */
function DlRow({ k, children, tnum }: { k: string; children: ReactNode; tnum?: boolean }) {
  return (
    <div className="field-row">
      <dt className="type-data text-label-secondary">{k}</dt>
      <dd className={cn("min-w-0 type-data", tnum && "tnum")}>{children}</dd>
    </div>
  );
}

/* ═══════════════ Return a proposed value ═══════════════
   The owner sends an advisor's agency-wide value back. The note is required: it is
   the only thing the advisor gets, and the value is not applied.                    */
function ReturnEditSheet({
  field, open, onOpenChange,
}: {
  field: Field | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { s, d } = useDemo();
  const [note, setNote] = useState("");
  const edit = field ? s.fieldEdits[field.key] : undefined;
  if (!field || !edit) return null;
  const author = personName[edit.by];

  const commit = () => {
    if (!note.trim()) return;
    const before = { fieldEdits: s.fieldEdits };
    d({ type: "reviewEdit", key: field.key, outcome: "returned", note: note.trim() });
    onOpenChange(false);
    notify(`Returned to ${author}`, { detail: "The record keeps the value it has.", undo: () => d({ type: "patch", patch: before }) });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Return {field.label.toLowerCase()} to {author}</SheetTitle>
          <SheetDescription>
            The value is not applied. The record keeps the value it has, and your note goes back to {author} on the field.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <DataList rows={[
            { label: "Current value", value: field.value },
            { label: "Proposed", value: edit.value },
            { label: "Their reason", value: `“${edit.reason}”` },
          ]} />
          <div>
            <Label htmlFor="return-note">
              Your note <span className="text-label-secondary">(required)</span>
            </Label>
            <Textarea
              id="return-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. the property’s site still shows the old hours; confirm with them first"
              className="mt-[var(--space-2)]"
            />
          </div>
        </SheetBody>
        <SheetActions>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!note.trim()} onClick={commit}>Return to {author}</Button>
        </SheetActions>
      </SheetContent>
    </Sheet>
  );
}

/* ═══════════════ A record added by hand ═══════════════
   Who sees it follows the one sharing rule, mirrored from /records: its maker always;
   anyone else once it has reached the whole agency — the owner's share at once, an
   advisor's once the owner releases it. A team share reaches the Paris desk, which
   has no other sign-in. This belongs beside queueItems in the store.                */
function createdVisible(s: DemoState, r: CreatedRecord) {
  if (r.by === s.role) return true;
  if (r.share !== "agency") return false;
  return r.by === "owner" || s.released[`rec-${r.id}`]?.outcome === "published";
}

function shareStatus(s: DemoState, r: CreatedRecord): { chip: string; tone: "neutral" | "warn"; line: string } {
  const maker = personName[r.by];
  const decided = s.released[`rec-${r.id}`];
  const releaser = s.role === "owner" ? "you" : people.owner;
  if (r.by !== s.role) {
    return {
      chip: "shared with the whole agency", tone: "neutral",
      line: `Added by hand by ${maker}${r.by === "user" ? `, released by ${releaser}` : ""}. Only ${maker} can change who sees it.`,
    };
  }
  if (r.share === "private") return { chip: "private to you", tone: "neutral", line: "Nobody else sees it until you share it." };
  if (r.share === "team") return { chip: "shared with the Paris desk", tone: "neutral", line: "The Paris desk sees it. Nobody else does." };
  if (r.by === "owner") return { chip: "shared with the whole agency", tone: "neutral", line: "Every advisor in the agency sees it, with your name on it." };
  if (decided?.outcome === "published") {
    return { chip: "shared with the whole agency", tone: "neutral", line: `Released by ${people.owner}. Every advisor in the agency sees it, with your name on it.` };
  }
  if (decided?.outcome === "returned") {
    return {
      chip: `returned by ${people.owner}`, tone: "warn",
      line: decided.note ? `${people.owner} returned it: “${decided.note}” Nobody else sees it.` : `${people.owner} returned it without a note. Nobody else sees it.`,
    };
  }
  return { chip: `waiting for ${people.owner}`, tone: "neutral", line: `In ${people.owner}’s publish queue. Nobody else sees it until she releases it.` };
}

/* The plain page, in the one anatomy: what was typed, who typed it, and, for its maker,
   the one act, deciding who else sees it, in the one sharing sheet (VIS-101, COL-10). */
function CreatedRecordPage({ r }: { r: CreatedRecord }) {
  const { s, d } = useDemo();
  const mine = r.by === s.role;
  const status = shareStatus(s, r);
  const [shareOpen, setShareOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const scrollTo = useScrollTo();

  const share = (className?: string, size?: "sm") => (
    <Button className={className} size={size} onClick={() => setShareOpen(true)}>Share…</Button>
  );

  return (
    <Page width="wide">
      <RecordHeader
        name={r.name}
        meta={`${r.category} · ${r.city}, ${r.country} · added by hand`}
        onNote={() => setNoteOpen(true)}
        onNotice={() => setNoticeOpen(true)}
      />

      <div className="doc-layout">
        <div className="min-w-0">
          {createdNoticesOn(s, r.id).length > 0 && (
            <div className="space-y-[var(--space-2)] pb-[var(--gap-2)]">
              {createdNoticesOn(s, r.id).map((n) => <NoticeBlock key={n.id} n={n} />)}
            </div>
          )}

          <Section title="The record">
            <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data text-label-secondary">
              Added by hand by {personName[r.by]} today. Only what was typed is on file; no source stands behind these values yet.
            </p>
            <dl className="divide-y divide-hairline type-data">
              <DlRow k="Category">{r.category}</DlRow>
              <DlRow k="City">{r.city}</DlRow>
              <DlRow k="Country">{r.country}</DlRow>
              <DlRow k="Added">By hand · {personName[r.by]} · today</DlRow>
            </dl>
          </Section>

          {noteOf(s, r.id) && (
            <Section title="Notes" deep>
              <NoteRow recordId={r.id} />
            </Section>
          )}
        </div>

        <aside className="doc-rail" data-rail-label="Summary">
          <Section variant="tool" follows title="Summary">
            <DataList rows={[
              { label: "Who sees it", value: <Chip tone={status.tone}>{status.chip}</Chip> },
              { label: "Evidence", value: <Chip tone="neutral">added by hand</Chip> },
            ]} />
            <p className="mt-[var(--space-3)] type-data text-label-secondary">{status.line}</p>
            <RailActs
              act={mine ? share("w-full") : undefined}
              ask={<AskButton id={r.id} name={r.name} alone={!mine} className="w-full" />}
            />
          </Section>
        </aside>
      </div>

      {mine && (
        <ShareSheet<ShareScope>
          open={shareOpen}
          onOpenChange={setShareOpen}
          what={r.name}
          current={r.share}
          options={audienceOptions(s.role === "owner")}
          onShare={(scope) => d({ type: "shareCreated", kind: "record", id: r.id, scope })}
        />
      )}
      <NoteSheet recordId={r.id} recordName={r.name} open={noteOpen} onOpenChange={setNoteOpen} onSaved={() => scrollTo(`note-${r.id}`)} />
      <NoticeSheet productId={r.id} productName={r.name} open={noticeOpen} onOpenChange={setNoticeOpen} />

      <ActionBar>
        <AskButton id={r.id} name={r.name} alone={!mine} />
        {mine && share(undefined, "sm")}
      </ActionBar>
    </Page>
  );
}
