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
 * selected the page has no filled button. "Request access from the owner" on the
 * colleague's empty page is a secondary — it records a request, it grants nothing.
 *
 * The colleague's view is the scope-isolation proof: an unshared profile is absent
 * from the list, never a locked row.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";
import { travellerCards, traveller, people, type TravellerCard } from "@/data/seed";
import { PageHeader, SplitPage, ViewToggle } from "@/components/layouts";
import { Chip, DataList, EmptyState, NarrationNote, ConfirmBanner } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, Lock, Share2, Users } from "lucide-react";

/* ── initials: first token, last token ──────────────────────────────────────── */
function initialsOf(name: string) {
  const tokens = name.split(/\s+/).filter((t) => /[A-Za-zÀ-ÿ]/.test(t));
  if (tokens.length === 0) return "—";
  const first = tokens[0][0];
  const last = tokens[tokens.length - 1][0];
  return (tokens.length === 1 ? first : first + last).toUpperCase();
}

type ShareState = "private" | "full" | "basic";

function ShareChip({ state, who }: { state: ShareState; who: string | null }) {
  if (state === "private") {
    return <Chip tone="neutral"><Lock className="size-[var(--icon-sm)]" aria-hidden /> private to you</Chip>;
  }
  return (
    <Chip tone="primary">
      <Share2 className="size-[var(--icon-sm)]" aria-hidden />
      {state === "full" ? "Collaborator Full" : "Collaborator Basic"}
      {who ? ` · ${who}` : ""}
    </Chip>
  );
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

/* ── page ───────────────────────────────────────────────────────────────────── */
export default function TravellersPage() {
  const { s } = useDemo();
  /* The travellers in the data are R. Devane's. The owner reaches one only through a
     share — the personal layer is the advisor's, inside an agency or not. */
  const viaShare = s.role === "owner";

  const [view, setView] = useState<"grid" | "table">("grid");
  const [selected, setSelected] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  /* The live tier governs S. Marchetti (set from the profile's share sheet); every
     other card carries the share recorded in the data. */
  const shareStateFor = (c: TravellerCard): ShareState =>
    c.id === traveller.id ? s.shareTier : c.shared ? "full" : "private";
  const sharedWithFor = (c: TravellerCard) =>
    c.id === traveller.id ? (s.shareTier === "private" ? null : people.owner) : c.shared;

  /* What a colleague can reach at all: the profiles explicitly shared to them. The
     tier the advisor last chose applies to that set — at "private" the set is empty,
     and an empty set is an empty page, not a page of locked rows. */
  const rows = useMemo(() => {
    if (!viaShare) return travellerCards;
    if (s.shareTier === "private") return [];
    return travellerCards.filter((c) => c.id === traveller.id || c.shared === people.owner);
  }, [viaShare, s.shareTier]);

  /* Basic tier: name and contact only. The absent fields are not rendered at all. */
  const basic = viaShare && s.shareTier === "basic";

  const active = selected ? rows.find((c) => c.id === selected) : undefined;

  const header = (
    <>
      <PageHeader
        title={
          <>
            Travellers
            <Chip tone="neutral">{viaShare ? "shared with you" : "your clients"}</Chip>
          </>
        }
        actions={rows.length > 0 ? <ViewToggle value={view} onChange={setView} /> : undefined}
      >
        <p className="mt-[var(--space-2)] max-w-[62ch] type-data-read text-label-secondary">
          A profile is private to its owning advisor until it is shared. Sharing is explicit,
          attributed, and revocable.
        </p>
      </PageHeader>

      <NarrationNote>
        Ownership and sharing are the only two rules that differ from product records. Everything
        else on a profile inherits the layered anatomy.
      </NarrationNote>
    </>
  );

  return (
    <SplitPage
      header={header}
      panelOpen={!!active}
      onClosePanel={() => setSelected(null)}
      panelTitle={active?.name ?? "Traveller"}
      panel={
        active ? (
          <TravellerPanel
            c={active}
            basic={basic}
            share={shareStateFor(active)}
            sharedWith={sharedWithFor(active)}
          />
        ) : null
      }
    >
      {rows.length === 0 ? (
        <div className="mt-[var(--space-4)] space-y-[var(--space-4)]">
          {/* The confirmation says only what is true — the request is recorded and
              waiting on a person. Access arrives when the owner grants it, not on
              a timer. */}
          {requested && (
            <ConfirmBanner show>
              Request recorded for {people.advisor} · today. Access arrives only if they share;
              nothing here grants it.
            </ConfirmBanner>
          )}
          <EmptyState
            icon={Users}
            title="No travellers shared with you"
            body="Traveller profiles are private to their owning advisor by default. What is not shared is absent, not locked — there is nothing here to unlock."
            action={
              !requested && (
                <Button variant="secondary" size="sm" onClick={() => setRequested(true)}>
                  Request access from the owner
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="min-w-0">
          <p className="mt-[var(--space-3)] type-meta">
            <span className="tnum">{rows.length}</span>{" "}
            {rows.length === 1 ? "traveller" : "travellers"}
            {basic && " · name and contact only at Collaborator Basic"}
          </p>

          {view === "grid" ? (
            <ul className="mt-[var(--gap-2)] grid grid-cols-1 gap-x-[var(--gap-2)] gap-y-[var(--gap-4)] sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((c) => (
                <li key={c.id}>
                  <TravellerCardTile
                    c={c}
                    basic={basic}
                    share={shareStateFor(c)}
                    sharedWith={sharedWithFor(c)}
                    selected={selected === c.id}
                    onSelect={() => setSelected(c.id)}
                  />
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
                              <span className="block type-meta">{c.relationshipStatus}</span>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-label-secondary">
                          {basic ? "contact on file" : (c.nextTrip ?? "no trip on file")}
                        </TableCell>
                        <TableCell className="hidden md:table-cell tnum text-label-secondary">
                          {!basic && c.departsInDays !== null ? `in ${c.departsInDays}d` : "—"}
                        </TableCell>
                        <TableCell>
                          {basic ? <Chip tone="primary">Collaborator Basic</Chip> : <ShareChip state={shareStateFor(c)} who={sharedWithFor(c)} />}
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
    </SplitPage>
  );
}

/* ── the listing card for a person: a plate plus a caption, no container ────────
   The initials disc is the image; it inverts when selected, and the name keeps an
   underline — selected differs by more than colour (VIS-021).                   */
function TravellerCardTile({
  c, basic, share, sharedWith, selected, onSelect,
}: {
  c: TravellerCard;
  basic: boolean;
  share: ShareState;
  sharedWith: string | null;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-state={selected ? "selected" : undefined}
      /* Named. A screen reader reached six of these and announced "button" six times. */
      aria-label={`${c.name} — ${c.relationshipStatus}`}
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
        <span className="type-data text-label-secondary">{c.relationshipStatus}</span>

        {basic ? (
          <span className="type-data text-label-secondary">Contact on file</span>
        ) : (
          <span className="type-data text-label-secondary">
            {c.nextTrip ?? "No trip on file"}
            {c.departsInDays !== null && <> · departs in <span className="tnum">{c.departsInDays}</span>d</>}
          </span>
        )}

        {/* Sharing leads the marks: it is the subject of this whole surface. */}
        <span className="mt-[var(--space-2)] flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-1">
          {basic ? <Chip tone="primary">Collaborator Basic</Chip> : <ShareChip state={share} who={sharedWith} />}
          {!basic && (
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
function TravellerPanel({
  c, basic, share, sharedWith,
}: { c: TravellerCard; basic: boolean; share: ShareState; sharedWith: string | null }) {
  return (
    <div className="space-y-[var(--space-6)]">
      <div className="flex items-center gap-[var(--space-3)]">
        <Initials name={c.name} size="md" />
        <div className="min-w-0">
          <h2 className="truncate type-section">{c.name}</h2>
          <p className="type-meta">{c.relationshipStatus}</p>
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

      {basic ? (
        <p className="type-data-read text-label-secondary">
          Name and contact only at Collaborator Basic. Preferences, journeys, intelligence and spend
          fields are absent — not masked. The share is explicit, attributed, and revocable by{" "}
          {people.advisor}.
        </p>
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
              <ShareChip state={share} who={sharedWith} />
            </div>
            <p className="mt-[var(--space-2)] type-meta">
              {c.preferences} preferences, each attributed to a source and a date. Sharing and
              the full journey history live on the profile itself.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
