"use client";
/**
 * Travellers — recomposed as search results, with people instead of products
 * (docs/rebuild/04-recomposition-brief.md; anatomy/surfaces/search-results.md).
 *
 * A list of entity cards with no container: the person's initials as the plate,
 * then a caption whose hierarchy is weight and colour only. The sharing state
 * leads the caption, because it is the one taxonomy this surface is allowed
 * (contract: "sharing state"). The table is the alternate view, on the ledger.
 *
 * 2026-09-28 (UX sweep NAV-01, NAV-03, COL-02, COL-06, COL-07, COL-10, COL-11, COL-13,
 * COL-04; VIS-095, VIS-096, VIS-098, VIS-101):
 *   title row   the name, one count, "New traveller". Nothing that changes the view.
 *   toolbar     sharing, search, what is shown and its true order, and Grid or Table,
 *               all in the URL with the selection. The create never moves: the view
 *               toggle is in the toolbar, not beside it.
 *   the list    a click selects and opens the inspector; Enter or a double-click opens
 *               the profile ("Open ↗" does the same).
 *   inspector   what the card cannot show: what argues with their trips, each trip and
 *               how ready it is, who can see the profile, the last contact. Its footer
 *               is the one act this surface is about: who can see the profile.
 *   sharing     one sheet (VIS-101). A traveller is shared with a person, so the choices
 *               are Only me · M. Keller, the full profile · M. Keller, name and contact
 *               only, and the list says the same words ("J. Dubois · full profile").
 *   New         a second traveller of the same name warns (Open the one you have, or
 *               Create anyway), it does not refuse; Cancel, then the act at the right.
 *
 * Who sees what (docs/rebuild/05-two-roles.md, VIS-098). The seeded travellers are
 * R. Devane's. The owner reaches one only once it is shared with her (the store's
 * `sharedWithOwner`); otherwise it is absent, not locked, and nothing here counts it. A
 * traveller someone added by hand is private to its maker until she shares it, with
 * the Paris desk at once, with the whole agency once the owner releases it.
 */
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, sharedWithOwner, type CreatedTraveller, type DemoState, type ShareScope } from "@/lib/store";
import { travellerCards, people, personName, type Persona, type TravellerCard } from "@/data/seed";
import { PageHeader, SplitPage, ViewToggle, ListToolbar, ListSearch, useQueryState } from "@/components/layouts";
import {
  Chip, DataList, EmptyState, FilterChip, SourceTag, Blocker, Warning, SchematicAction,
} from "@/components/bits";
import { ShareSheet } from "@/components/share-sheet";
import { notify } from "@/lib/notify";
import {
  travellerShareOf, travellerShareWords, travellerShareOptions, describeTravellerShare, createdShareWords,
  tripsOfTraveller, readinessOf, attentionFor, takeOff, tasteKey, type TravellerTier,
} from "@/lib/trip-checks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Lock, Share2, Users } from "lucide-react";

/* ── initials: first token, last token ──────────────────────────────────────── */
function initialsOf(name: string) {
  const tokens = name.split(/\s+/).filter((t) => /[A-Za-zÀ-ÿ]/.test(t));
  if (tokens.length === 0) return "—";
  const first = tokens[0][0];
  const last = tokens[tokens.length - 1][0];
  return (tokens.length === 1 ? first : first + last).toUpperCase();
}

const norm = (v: string) => v.trim().replace(/\s+/g, " ").toLowerCase();

/* ── a traveller added by hand: who can reach it, under the one sharing rule ──
   "maker" and "shared" open the profile; "pending" is the owner reading what an
   advisor sent to the whole agency, which she has yet to release.               */
type CreatedReach = "maker" | "shared" | "pending" | null;
function reachOfCreated(t: CreatedTraveller, s: Pick<DemoState, "role" | "released">): CreatedReach {
  if (t.by === s.role) return "maker";
  if (t.share === "team") return "shared";
  if (t.share === "agency") {
    if (t.by === "owner") return "shared";
    const decided = s.released[`trv-${t.id}`];
    if (decided?.outcome === "published") return "shared";
    if (!decided && s.role === "owner") return "pending";
  }
  return null;
}

/* ── the sharing state, in the sheet's words, for one row ── */
type Sharing = { tone: "neutral" | "primary"; icon: React.ElementType; text: string; shared: boolean };

function SharingChip({ sharing }: { sharing: Sharing }) {
  const Icon = sharing.icon;
  return (
    <Chip tone={sharing.tone}>
      <Icon className="size-[var(--icon-sm)]" aria-hidden /> {sharing.text}
    </Chip>
  );
}

/* ── one row of the list, whichever way the traveller arrived ── */
interface Item {
  id: string;
  name: string;
  status: string;
  nextTrip: string | null;
  departsInDays: number | null;
  preferences: number | null;
  profiles: number | null;
  /** Shared at name and contact only: the rest is not rendered. */
  basic: boolean;
  sharing: Sharing;
  card?: TravellerCard;
  created?: CreatedTraveller;
}

/* ── the identity plate: initials on sunken paper; inverse when selected ────── */
function Initials({ name, size = "md", selected }: { name: string; size?: "sm" | "md" | "lg"; selected?: boolean }) {
  const dims = { sm: "size-8 type-meta", md: "size-12 type-data-strong", lg: "size-16 type-figure" }[size];
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full",
        dims,
        selected ? "bg-selected text-on-selected" : "bg-sunken text-label",
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

/* A deterministic id from the name: the same name always makes the same address, and
   a second traveller of that name takes the next free suffix. */
function idFor(name: string, taken: Set<string>) {
  const slug = name
    .normalize("NFD").replace(/\p{M}/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "traveller";
  let id = `hand-${slug}`;
  for (let n = 2; taken.has(id); n++) id = `hand-${slug}-${n}`;
  return id;
}

/* ── page ───────────────────────────────────────────────────────────────────── */
export default function TravellersPage() {
  return (
    <Suspense fallback={null}>
      <Travellers />
    </Suspense>
  );
}

function Travellers() {
  const { s, d } = useDemo();
  const router = useRouter();
  /* The seeded travellers are R. Devane's. The owner reaches one only through a share. */
  const viaShare = s.role === "owner";

  const [view, setView] = useQueryState("view", "grid");
  const [sharingQ, setSharingQ] = useQueryState("sharing", "all");
  const [q, setQ] = useQueryState("q");
  const [selected, setSelected] = useQueryState("traveller");
  const [newOpen, setNewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const all = useMemo<Item[]>(() => {
    /* The seeded cards: all of them for their advisor; for the owner, only what has been
       shared with her (VIS-098), by the store's one rule. */
    const cards = travellerCards
      .filter((c) => !viaShare || sharedWithOwner(s, c.name))
      .map((c): Item => {
        const sh = travellerShareOf(s, c);
        return {
          id: c.id, name: c.name, status: c.relationshipStatus, nextTrip: c.nextTrip,
          departsInDays: c.departsInDays, preferences: c.preferences, profiles: c.profiles,
          basic: viaShare && sh.tier === "basic", card: c,
          sharing: {
            tone: sh.tier === "private" ? "neutral" : "primary", icon: sh.tier === "private" ? Lock : Share2,
            text: travellerShareWords(sh, s.role), shared: sh.tier !== "private",
          },
        };
      });

    /* Added by hand this session: the maker's own, and what reaches this person. */
    const created = s.createdTravellers
      .filter((t) => reachOfCreated(t, s) !== null)
      .map((t): Item => {
        const w = createdShareWords(t, s);
        return {
          id: t.id, name: t.name, status: t.by === s.role ? "Added by hand today" : `Added by hand by ${personName[t.by]}`,
          nextTrip: null, departsInDays: null, preferences: null, profiles: null, basic: false, created: t,
          sharing: { tone: w.shared && !w.waiting ? "primary" : "neutral", icon: w.waiting ? Clock : w.shared ? Share2 : Lock, text: w.text, shared: w.shared },
        };
      });

    return [...created, ...cards];
  }, [viaShare, s]);

  const hasCreated = all.some((r) => r.created?.by === s.role);
  const rows = useMemo(() => all
    .filter((r) => !q || norm(r.name).includes(norm(q)))
    .filter((r) => sharingQ === "all" || (sharingQ === "shared" ? r.sharing.shared : !r.sharing.shared))
    /* The stated order is the true one: what you added today first, then the soonest
       departure; nobody travelling last, by name. */
    .sort((a, b) =>
      Number(b.created?.by === s.role) - Number(a.created?.by === s.role)
      || (a.departsInDays ?? Number.MAX_SAFE_INTEGER) - (b.departsInDays ?? Number.MAX_SAFE_INTEGER)
      || a.name.localeCompare(b.name)),
  [all, q, sharingQ, s.role]);

  const active = selected ? all.find((c) => c.id === selected) : undefined;
  const open = (id: string) => router.push(`/travellers/${id}`);
  const filtered = rows.length !== all.length;
  const tableView = view === "table";

  function create(t: CreatedTraveller) {
    const before = s.createdTravellers;
    d({ type: "createTraveller", traveller: t });
    setNewOpen(false);
    setSelected(t.id);
    notify(`${t.name} added · only you can see them`, {
      detail: "Share the profile when someone else should.",
      undo: () => { d({ type: "patch", patch: { createdTravellers: before } }); setSelected(null); },
    });
  }

  /* The inspector's one act: who can see this profile (VIS-101). Live where the store
     keeps the share (S. Marchetti, a traveller added by hand); drawn for the others. */
  const footer = !active || viaShare ? undefined
    : active.created ? (active.created.by === s.role
      ? <Button variant="secondary" className="w-full" onClick={() => setShareOpen(true)}><Share2 aria-hidden /> {active.created.share === "private" ? "Share" : "Change sharing"}</Button>
      : undefined)
    : active.card && travellerShareOf(s, active.card).live
      ? <Button variant="secondary" className="w-full" onClick={() => setShareOpen(true)}><Share2 aria-hidden /> {s.shareTier === "private" ? "Share" : "Change sharing"}</Button>
      : <SchematicAction className="w-full justify-center"><Share2 className="size-[var(--icon-md)]" aria-hidden /> {active.card?.shared ? "Change sharing" : "Share"}</SchematicAction>;

  const header = (
    <PageHeader
      title="Travellers"
      count={viaShare
        ? `${all.length} shared with you`
        : `${all.length} ${all.length === 1 ? "traveller" : "travellers"}`}
      create={<Button variant="secondary" size="sm" onClick={() => setNewOpen(true)}>New traveller</Button>}
    />
  );

  return (
    <SplitPage
      header={header}
      panelOpen={!!active}
      onClosePanel={() => setSelected(null)}
      panelTitle={active?.name ?? "Traveller"}
      openHref={active ? `/travellers/${active.id}` : undefined}
      panel={active ? <TravellerPanel item={active} /> : null}
      footer={footer}
    >
      {all.length === 0 ? (
        <EmptyState
          className="mt-[var(--space-4)]"
          icon={Users}
          title="No travellers shared with you"
          body="A traveller appears here once the advisor who holds them shares them with you. One you add yourself is yours from the start."
        />
      ) : (
        <>
          <ListToolbar
            filters={viaShare ? undefined : (
              <>
                <FilterChip selected={sharingQ === "all"} onClick={() => setSharingQ("all")}>All</FilterChip>
                <FilterChip selected={sharingQ === "private"} onClick={() => setSharingQ(sharingQ === "private" ? "all" : "private")}>Only you</FilterChip>
                <FilterChip selected={sharingQ === "shared"} onClick={() => setSharingQ(sharingQ === "shared" ? "all" : "shared")}>Shared</FilterChip>
              </>
            )}
            search={<ListSearch value={q} onChange={(v) => setQ(v)} placeholder="Search travellers" />}
            result={`${filtered ? `${rows.length} of ${all.length} · ` : ""}${hasCreated ? "added today first, then " : ""}soonest departure first`}
            view={<ViewToggle value={tableView ? "table" : "grid"} onChange={(v) => setView(v)} />}
          />

          {rows.length === 0 ? (
            <EmptyState
              className="mt-[var(--space-4)]"
              title="Nobody under this filter"
              body="Clear the search or the sharing filter."
              action={<Button variant="secondary" size="sm" onClick={() => { setQ(null); setSharingQ(null); }}>Show everyone</Button>}
            />
          ) : !tableView ? (
            <ul className="mt-[var(--gap-2)] grid grid-cols-1 gap-x-[var(--gap-2)] gap-y-[var(--gap-4)] sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((c) => (
                <li key={c.id}>
                  <TravellerCardTile item={c} selected={selected === c.id} onSelect={() => setSelected(c.id)} onOpen={() => open(c.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Traveller</TableHead>
                  <TableHead className="hidden sm:table-cell">Next trip</TableHead>
                  <TableHead className="hidden md:table-cell">Departs</TableHead>
                  <TableHead>Who can see it</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => {
                  const on = selected === c.id;
                  return (
                    <TableRow
                      key={c.id}
                      onClick={() => setSelected(c.id)}
                      onOpen={() => open(c.id)}
                      aria-selected={on}
                      data-state={on ? "selected" : undefined}
                    >
                      <TableCell>
                        <div className="flex items-center gap-[var(--space-3)]">
                          <Initials name={c.name} size="sm" selected={on} />
                          <span className="min-w-0">
                            <span className="block type-data-strong">{c.name}</span>
                            <span className="block type-meta">{c.status}</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-label-secondary">
                        {c.basic ? "Contact on file" : c.created ? c.created.email : (c.nextTrip ?? "No trip on file")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell tnum text-label-secondary">
                        {!c.basic && c.departsInDays !== null ? `in ${c.departsInDays}d` : "—"}
                      </TableCell>
                      <TableCell><SharingChip sharing={c.sharing} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </>
      )}

      <NewTravellerSheet
        open={newOpen}
        onOpenChange={setNewOpen}
        role={s.role}
        visible={all}
        taken={new Set([...travellerCards.map((c) => c.id), ...s.createdTravellers.map((t) => t.id)])}
        onCreate={create}
      />

      {/* One sharing sheet (VIS-101). A seeded traveller is shared with a person; one added
          by hand with an audience, which is what the store keeps for it. */}
      {active?.card && travellerShareOf(s, active.card).live && (
        <ShareSheet<TravellerTier>
          open={shareOpen}
          onOpenChange={setShareOpen}
          what={active.name}
          current={s.shareTier}
          options={travellerShareOptions}
          describe={(v) => describeTravellerShare(active.name, v)}
          onShare={(v) => d({ type: "share", tier: v })}
        />
      )}
      {active?.created && active.created.by === s.role && (
        <ShareSheet<ShareScope>
          open={shareOpen}
          onOpenChange={setShareOpen}
          what={active.name}
          current={active.created.share}
          onShare={(v) => d({ type: "shareCreated", kind: "traveller", id: active.id, scope: v })}
        />
      )}
    </SplitPage>
  );
}

/* ── the listing card for a person: a plate plus a caption, no container ────────
   The initials disc is the image; it inverts when selected, and the name keeps an
   underline — selected differs by more than colour (VIS-021). A click selects; Enter
   on the selected card, or a double-click, opens the profile (VIS-096).          */
function TravellerCardTile({ item: c, selected, onSelect, onOpen }: { item: Item; selected: boolean; onSelect: () => void; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" && selected) { e.preventDefault(); onOpen(); } }}
      aria-pressed={selected}
      data-state={selected ? "selected" : undefined}
      /* Named. A screen reader reached six of these and announced "button" six times. */
      aria-label={`${c.name} — ${c.status}`}
      className="group flex w-full cursor-pointer items-start gap-[var(--space-4)] rounded-lg text-left"
    >
      <Initials name={c.name} size="lg" selected={selected} />

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={cn(
            "truncate type-data-strong underline-offset-4 group-hover:underline group-hover:decoration-ink",
            selected && "underline decoration-ink",
          )}
        >
          {c.name}
        </span>
        <span className="type-data text-label-secondary">{c.status}</span>

        {c.basic ? (
          <span className="type-data text-label-secondary">Contact on file</span>
        ) : c.created ? (
          <span className="truncate type-data text-label-secondary">{c.created.email}</span>
        ) : (
          <span className="type-data text-label-secondary">
            {c.nextTrip ?? "No trip on file"}
            {c.departsInDays !== null && <> · departs in <span className="tnum">{c.departsInDays}</span>d</>}
          </span>
        )}

        {/* Sharing leads the marks: it is the subject of this whole surface. */}
        <span className="mt-[var(--space-2)] flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-1">
          <SharingChip sharing={c.sharing} />
          {!c.basic && c.preferences !== null && c.profiles !== null && (
            <span className="type-meta">
              <span className="tnum">{c.preferences}</span> {c.preferences === 1 ? "preference" : "preferences"}
              {" · "}
              <span className="tnum">{c.profiles}</span> {c.profiles === 1 ? "travel profile" : "travel profiles"}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

/* ── the inspector: what the card cannot show (COL-13) ────────────────────────────
   Not the name, status, next trip or counts again: what argues with their trips (one
   item per subject, VIS-099), each trip with how ready it is, who can see the profile
   and the last time you spoke. Opening the profile is the header's "Open ↗".       */
function TravellerPanel({ item: c }: { item: Item }) {
  const { s, d } = useDemo();
  const router = useRouter();
  const owner = s.role === "owner";

  if (c.basic) {
    return (
      <p className="type-data text-label-secondary">
        Shared with you at name and contact only. Preferences, trips and spend stay with {people.advisor}.
      </p>
    );
  }

  if (c.created) {
    const maker = personName[c.created.by];
    return (
      <div className="space-y-[var(--space-6)]">
        <DataList
          rows={[
            { label: "Email", value: c.created.email },
            { label: "Added by hand", value: `${maker} · today` },
            { label: "Who can see it", value: c.sharing.text },
          ]}
        />
        {c.created.note && (
          <div>
            <div className="type-meta text-label-tertiary">What {maker} already knows</div>
            <p className="mt-[var(--space-2)] type-data">{c.created.note}</p>
            <p className="mt-[var(--space-1)]"><SourceTag kind="manual" label={`note, ${maker} · today`} /></p>
          </div>
        )}
      </div>
    );
  }

  const trips = tripsOfTraveller(s, c.id, c.name);
  const items = attentionFor(s, trips);

  return (
    <div className="space-y-[var(--space-6)]">
      {items.map((a) => a.kind === "block" ? (
        /* In the inspector's narrow column the act sits under the sentence. */
        <Blocker key={a.line.id} title={`${a.name} is closed to bookings`}>
          On {a.trip.title}. {a.block!.text}
          {!owner && (
            <div className="mt-[var(--space-3)]">
              <Button variant="secondary" size="sm" onClick={() => takeOff(s, d, a.trip, a.line)}>Take it off the trip</Button>
            </div>
          )}
        </Blocker>
      ) : (
        <Warning key={a.line.id} title={`Against ${c.name}'s taste`} kept={a.kept}>
          {a.sentence} On {a.trip.title}.
          {!owner && (
            <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-2)]">
              {s.lab
                ? <Button size="sm" variant="secondary" onClick={() => router.push(`/itineraries/${a.trip.id}?line=${a.line.id}&act=find:${a.line.id}`)}>Find another</Button>
                : <SchematicAction>Find another</SchematicAction>}
              <Button size="sm" variant="secondary" onClick={() => d({ type: "decide", id: tasteKey(a.trip, a.line.productId!), what: "Kept despite the preference" })}>Keep it</Button>
            </div>
          )}
        </Warning>
      ))}

      <div>
        <div className="type-meta text-label-tertiary">Trips</div>
        {trips.length ? (
          <ul className="mt-[var(--space-2)] divide-y divide-hairline">
            {trips.map((t) => {
              const r = readinessOf(s, t);
              return (
                <li key={t.id} className="flex flex-col items-start gap-[var(--space-1)] py-[var(--space-2)]">
                  <Link href={`/itineraries/${t.id}`} className="type-data underline decoration-hairline underline-offset-4 hover:decoration-ink">
                    {t.title}
                  </Link>
                  <span className="row-trailing flex items-center gap-[var(--space-2)]">
                    <span className="type-meta tnum">{t.dates}</span>
                    {r ? <Chip tone={r.tone}>{r.text}</Chip> : <Chip tone="neutral">{t.status}</Chip>}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-[var(--space-2)] type-data text-label-secondary">No trip on file.</p>
        )}
      </div>

      <DataList
        rows={[
          { label: "Who can see it", value: c.sharing.text },
          { label: "Last contact", value: c.card?.lastContact ?? null },
        ]}
      />
    </div>
  );
}

/* ── New traveller (U24) ────────────────────────────────────────────────────────
   Like raising a ticket: name, email, and whatever she already knows. The check runs
   against the travellers this person can already reach, by name or email. A match warns
   and does not refuse (COL-11): two people can share a name. "Open" goes to the one on
   file; "Create anyway" makes the second. It does not reach a profile she cannot see:
   reporting that one exists would disclose it. What she types is her note, attributed
   to her and dated today; it is never presented as the traveller's own statement.  */
function NewTravellerSheet({
  open, onOpenChange, role, visible, taken, onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  role: Persona;
  visible: Item[];
  taken: Set<string>;
  onCreate: (t: CreatedTraveller) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const match = useMemo(() => {
    const n = norm(name);
    const e = norm(email);
    if (!n && !e) return undefined;
    return visible.find((v) => (n && norm(v.name) === n) || (e && v.created && norm(v.created.email) === e));
  }, [name, email, visible]);

  const valid = norm(name).length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function reset(v: boolean) {
    if (!v) { setName(""); setEmail(""); setNote(""); }
    onOpenChange(v);
  }

  function submit() {
    if (!valid) return;
    const clean = name.trim().replace(/\s+/g, " ");
    onCreate({
      id: idFor(clean, taken),
      name: clean,
      email: email.trim(),
      note: note.trim() || undefined,
      by: role,
      share: "private",
    });
    setName(""); setEmail(""); setNote("");
  }

  return (
    <Sheet open={open} onOpenChange={reset}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>New traveller</SheetTitle>
          <SheetDescription>Only you can see them until you share the profile.</SheetDescription>
        </SheetHeader>
        <form
          id="new-traveller"
          className="space-y-[var(--space-4)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]"
          onSubmit={(e) => { e.preventDefault(); if (!match) submit(); }}
        >
          <div className="space-y-[var(--space-2)]">
            <Label htmlFor="nt-name">Name</Label>
            <Input id="nt-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder="J. Okafor" />
          </div>
          <div className="space-y-[var(--space-2)]">
            <Label htmlFor="nt-email">Email</Label>
            <Input id="nt-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" placeholder="name@example.com" />
          </div>
          <div className="space-y-[var(--space-2)]">
            <Label htmlFor="nt-note">What you already know <span className="type-meta">· optional</span></Label>
            <Textarea
              id="nt-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Met at the Lyon fair. Asked about a walking holiday in the Dolomites."
            />
            <p className="type-meta">Kept as your note, with your name and today&rsquo;s date.</p>
          </div>

          {match && (
            <Warning title={`${match.name} is already on your list`}>
              {match.created ? match.created.email : match.status}. Open that profile, or create a second {match.name}.
              <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-3)]">
                <Button asChild variant="link" size="sm"><Link href={`/travellers/${match.id}`}>Open {match.name}</Link></Button>
                <Button type="button" variant="secondary" size="sm" disabled={!valid} onClick={submit}>Create anyway</Button>
              </div>
            </Warning>
          )}
        </form>
        {/* Cancel, then the act at the right (VIS-101). */}
        <div className="mt-auto flex items-center justify-end gap-[var(--space-2)] border-t border-hairline px-[var(--space-6)] py-[var(--space-4)]">
          <Button type="button" variant="secondary" onClick={() => reset(false)}>Cancel</Button>
          <Button type="submit" form="new-traveller" disabled={!valid || !!match}>Create traveller</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
