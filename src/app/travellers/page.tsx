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
 * Chapters, in order: the count line · the list (grid or table). Beside it, the
 * inspector: identity, the one primary, then the profile's figures and its
 * sharing state.
 *
 * The one primary: "Open full profile" (contract: open a traveller). It sits at
 * the top of the inspector, the tool that follows the selection; with nothing
 * selected the page has no filled button. The one secondary: "New traveller"
 * (U24), for both types, opening a sheet whose own filled action is "Create
 * traveller" — after a check for a traveller with that name or email.
 *
 * Who sees what (docs/rebuild/05-two-roles.md, "Everything created starts private"
 * and "One sharing rule, for everything"). The seeded travellers are R. Devane's.
 * The owner reaches one only when it is shared with her: the personal layer is the
 * advisor's, inside an agency or not. A traveller someone added by hand is private
 * to its maker until she shares it — with her team at once, with the whole agency
 * once the owner releases it (the owner's own agency-wide shares go out directly).
 *
 * The owner's empty page is the scope-isolation proof: an unshared profile is absent
 * from the list, never a locked row — and so there is nothing to ask for. Asking for
 * access lives on a profile she reached by name from elsewhere in the product.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDemo, type CreatedTraveller, type DemoState } from "@/lib/store";
import { travellerCards, traveller, people, personName, type Persona } from "@/data/seed";
import { PageHeader, SplitPage, ViewToggle } from "@/components/layouts";
import { Chip, DataList, EmptyState, ConfirmBanner, SeverityBanner, SourceTag } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, Clock, Lock, Share2, Users } from "lucide-react";

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

/* ── the sharing state, in words, for one row ── */
type Sharing = { tone: "neutral" | "primary"; icon: React.ElementType; text: string };

function sharingOfCreated(t: CreatedTraveller, s: Pick<DemoState, "role" | "released">): Sharing {
  const mine = t.by === s.role;
  const decided = s.released[`trv-${t.id}`];
  if (!mine) {
    if (t.share === "agency" && t.by === "user" && !decided) {
      return { tone: "neutral", icon: Clock, text: `added by hand · ${personName[t.by]} · waiting for your release` };
    }
    return {
      tone: "primary", icon: Share2,
      text: `added by hand · shared by ${personName[t.by]} · ${t.share === "team" ? "your team" : "the whole agency"}`,
    };
  }
  if (t.share === "private") return { tone: "neutral", icon: Lock, text: "added by hand · private to you" };
  if (t.share === "team") return { tone: "primary", icon: Share2, text: "added by hand · your team" };
  if (t.by === "owner" || decided?.outcome === "published") {
    return { tone: "primary", icon: Share2, text: "added by hand · the whole agency" };
  }
  if (decided?.outcome === "returned") {
    return { tone: "neutral", icon: Lock, text: `added by hand · returned by ${people.owner}` };
  }
  return { tone: "neutral", icon: Clock, text: `added by hand · waiting for ${people.owner}` };
}

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
  /** Collaborator Basic: name and contact only; the rest is not rendered. */
  basic: boolean;
  sharing: Sharing;
  created?: CreatedTraveller;
}

/* ── the identity plate: initials on sunken paper; inverse when selected ────── */
function Initials({ name, size = "md", selected }: { name: string; size?: "sm" | "md" | "lg"; selected?: boolean }) {
  const dims = { sm: "size-8 type-micro", md: "size-12 type-data-strong", lg: "size-16 type-figure" }[size];
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
  const { s, d } = useDemo();
  /* The seeded travellers are R. Devane's. The owner reaches one only through a
     share — the personal layer is the advisor's, inside an agency or not. */
  const viaShare = s.role === "owner";

  const [view, setView] = useState<"grid" | "table">("grid");
  const [selected, setSelected] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  const rows = useMemo<Item[]>(() => {
    /* The seeded cards: all of them for their advisor; for the owner, only what has
       been shared with her. S. Marchetti follows the live tier from her profile. */
    const cards = travellerCards
      .filter((c) => {
        if (!viaShare) return true;
        if (c.id === traveller.id) return s.shareTier !== "private";
        return c.shared === people.owner;
      })
      .map((c): Item => {
        const tier = c.id === traveller.id ? s.shareTier : c.shared ? "full" : "private";
        const who = c.id === traveller.id ? people.owner : c.shared;
        const basic = viaShare && c.id === traveller.id && s.shareTier === "basic";
        const sharing: Sharing =
          tier === "private"
            ? { tone: "neutral", icon: Lock, text: "private to you" }
            : viaShare
              ? { tone: "primary", icon: Share2, text: `${tier === "full" ? "Collaborator Full" : "Collaborator Basic"} · shared by ${people.advisor}` }
              : { tone: "primary", icon: Share2, text: `${tier === "full" ? "Collaborator Full" : "Collaborator Basic"}${who ? ` · ${who}` : ""}` };
        return {
          id: c.id, name: c.name, status: c.relationshipStatus, nextTrip: c.nextTrip,
          departsInDays: c.departsInDays, preferences: c.preferences, profiles: c.profiles,
          basic, sharing,
        };
      });

    /* Added by hand this session: the maker's own, and what reaches this person. */
    const created = s.createdTravellers
      .filter((t) => reachOfCreated(t, s) !== null)
      .map((t): Item => ({
        id: t.id, name: t.name, status: t.by === s.role ? "Added by hand" : `Added by hand by ${personName[t.by]}`,
        nextTrip: null, departsInDays: null, preferences: null, profiles: null,
        basic: false, sharing: sharingOfCreated(t, s), created: t,
      }));

    return [...created, ...cards];
  }, [viaShare, s]);

  const active = selected ? rows.find((c) => c.id === selected) : undefined;
  const handMade = rows.filter((r) => r.created).length;
  const ownCount = s.createdTravellers.filter((t) => t.by === s.role).length;

  function create(t: CreatedTraveller) {
    d({ type: "createTraveller", traveller: t });
    setNewOpen(false);
    setJustCreated(t.id);
    setSelected(t.id);
  }
  const created = justCreated ? s.createdTravellers.find((t) => t.id === justCreated) : undefined;

  const header = (
    <>
      <PageHeader
        title={
          <>
            Travellers
            <Chip tone="neutral">
              {!viaShare ? "your clients" : ownCount > 0 ? "yours, and shared with you" : "shared with you"}
            </Chip>
          </>
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setNewOpen(true)}>
              New traveller
            </Button>
            {rows.length > 0 && <ViewToggle value={view} onChange={setView} />}
          </>
        }
      >
        <p className="mt-[var(--space-2)] max-w-[62ch] type-data-read text-label-secondary">
          A profile belongs to the advisor who holds it and is private to her until she shares
          it. Sharing is explicit, attributed, and revocable.
        </p>
      </PageHeader>

    </>
  );

  return (
    <SplitPage
      header={header}
      panelOpen={!!active}
      onClosePanel={() => setSelected(null)}
      panelTitle={active?.name ?? "Traveller"}
      panel={active ? <TravellerPanel item={active} /> : null}
    >
      {created && (
        <div className="mt-[var(--space-3)]">
          <ConfirmBanner show>
            {created.name} added by hand · private to you. Nobody else sees this profile until you
            share it from the profile.
          </ConfirmBanner>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          className="mt-[var(--space-4)]"
          icon={Users}
          title="No travellers shared with you"
          body={`Traveller profiles belong to the advisors who hold them, and appear here only when one is shared with you. A profile nobody has shared is absent, not locked. A traveller you add yourself is yours from the start.`}
        />
      ) : (
        <div className="min-w-0">
          <p className="mt-[var(--space-3)] type-meta">
            <span className="tnum">{rows.length}</span>{" "}
            {rows.length === 1 ? "traveller" : "travellers"}
            {handMade > 0 && <> · <span className="tnum">{handMade}</span> added by hand</>}
            {rows.some((r) => r.basic) && " · name and contact only at Collaborator Basic"}
          </p>

          {view === "grid" ? (
            <ul className="mt-[var(--gap-2)] grid grid-cols-1 gap-x-[var(--gap-2)] gap-y-[var(--gap-4)] sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((c) => (
                <li key={c.id}>
                  <TravellerCardTile item={c} selected={selected === c.id} onSelect={() => setSelected(c.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-[var(--gap-2)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Traveller</TableHead>
                    <TableHead className="hidden sm:table-cell">Next trip</TableHead>
                    <TableHead className="hidden md:table-cell">Departs</TableHead>
                    <TableHead>Sharing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => {
                    const on = selected === c.id;
                    return (
                      <TableRow
                        key={c.id}
                        onClick={() => setSelected(c.id)}
                        aria-selected={on}
                        data-state={on ? "selected" : undefined}
                        className="cursor-pointer"
                      >
                        <TableCell>
                          <div className="flex items-center gap-[var(--space-3)]">
                            <Initials name={c.name} size="sm" selected={on} />
                            <span className="min-w-0">
                              <span className={cn("block type-data-strong", on && "underline decoration-ink underline-offset-4")}>{c.name}</span>
                              <span className="block type-meta">{c.status}</span>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-label-secondary">
                          {c.basic ? "contact on file" : c.created ? c.created.email : (c.nextTrip ?? "no trip on file")}
                        </TableCell>
                        <TableCell className="hidden md:table-cell tnum text-label-secondary">
                          {!c.basic && c.departsInDays !== null ? `in ${c.departsInDays}d` : "—"}
                        </TableCell>
                        <TableCell>
                          {c.basic ? <Chip tone="primary">Collaborator Basic</Chip> : <SharingChip sharing={c.sharing} />}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      <NewTravellerSheet
        open={newOpen}
        onOpenChange={setNewOpen}
        role={s.role}
        visible={rows}
        taken={new Set([...travellerCards.map((c) => c.id), ...s.createdTravellers.map((t) => t.id)])}
        onCreate={create}
      />
    </SplitPage>
  );
}

/* ── the listing card for a person: a plate plus a caption, no container ────────
   The initials disc is the image; it inverts when selected, and the name keeps an
   underline — selected differs by more than colour (VIS-021).                   */
function TravellerCardTile({ item: c, selected, onSelect }: { item: Item; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
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
          {c.basic ? <Chip tone="primary">Collaborator Basic</Chip> : <SharingChip sharing={c.sharing} />}
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

/* ── the inspector: the tool that follows the selection ───────────────────────── */
function TravellerPanel({ item: c }: { item: Item }) {
  return (
    <div className="space-y-[var(--space-6)]">
      <div className="flex items-center gap-[var(--space-3)]">
        <Initials name={c.name} size="md" />
        <div className="min-w-0">
          <h2 className="truncate type-section">{c.name}</h2>
          <p className="type-meta">{c.status}</p>
        </div>
      </div>

      {/* The one primary: always here, never scrolled to. */}
      <div>
        <Button asChild size="sm">
          <Link href={`/travellers/${c.id}`}>
            Open full profile <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>

      {c.basic ? (
        <p className="type-data-read text-label-secondary">
          Name and contact only at Collaborator Basic. Preferences, journeys, intelligence and spend
          fields are absent — not masked. The share is explicit, attributed, and revocable by{" "}
          {people.advisor}.
        </p>
      ) : c.created ? (
        <>
          <DataList
            rows={[
              { label: "Email", value: c.created.email },
              { label: "Added by hand by", value: `${personName[c.created.by]} · today` },
            ]}
          />
          {c.created.note && (
            <div>
              <div className="type-micro-caps text-label-tertiary">What {personName[c.created.by]} already knows</div>
              <p className="mt-[var(--space-2)] type-data-read">{c.created.note}</p>
              <p className="mt-[var(--space-1)]">
                <SourceTag kind="manual" label={`note, ${personName[c.created.by]} · today`} />
              </p>
            </div>
          )}
          <div>
            <div className="type-micro-caps text-label-tertiary">Sharing</div>
            <div className="mt-[var(--space-2)]">
              <SharingChip sharing={c.sharing} />
            </div>
            <p className="mt-[var(--space-2)] type-meta">
              Sharing lives on the profile itself.
            </p>
          </div>
        </>
      ) : (
        <>
          <DataList
            rows={[
              { label: "Next trip", value: c.nextTrip, absent: "none on file" },
              {
                label: "Departs in",
                value: c.departsInDays === null ? null : <span className="tnum">{c.departsInDays} days</span>,
                absent: "not applicable",
              },
              { label: "Travel profiles", value: <span className="tnum">{c.profiles}</span> },
              { label: "Preferences", value: <span className="tnum">{c.preferences}</span> },
            ]}
          />

          <div>
            <div className="type-micro-caps text-label-tertiary">Sharing</div>
            <div className="mt-[var(--space-2)]">
              <SharingChip sharing={c.sharing} />
            </div>
            <p className="mt-[var(--space-2)] type-meta">
              <span className="tnum">{c.preferences}</span> preferences, each attributed to a source
              and a date. Sharing and the full journey history live on the profile itself.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* ── New traveller (U24) ────────────────────────────────────────────────────────
   Like raising a ticket: name, email, and whatever she already knows. The check runs
   against the travellers this person can already reach, by name or email — a match
   is shown instead of a second profile. It does not reach a profile she cannot see:
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
    if (!valid || match) return;
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
          <SheetDescription>Private to you when created. You choose who else sees it.</SheetDescription>
        </SheetHeader>
        <form
          id="new-traveller"
          className="space-y-[var(--space-4)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]"
          onSubmit={(e) => { e.preventDefault(); submit(); }}
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
            <p className="type-meta">
              Kept as your note, with your name and today&rsquo;s date — not as something the
              traveller said.
            </p>
          </div>

          {match && (
            <SeverityBanner severity="Info">
              <p>
                <b>{match.name}</b> is already on your list
                {match.created ? ` · ${match.created.email}` : ` · ${match.status}`}. Open that
                profile rather than adding a second one.
              </p>
              <Button asChild variant="link" size="sm" className="mt-[var(--space-2)]">
                <Link href={`/travellers/${match.id}`}>Open {match.name}</Link>
              </Button>
            </SeverityBanner>
          )}
        </form>
        <SheetFooter>
          <Button type="submit" form="new-traveller" disabled={!valid || !!match}>
            Create traveller
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
