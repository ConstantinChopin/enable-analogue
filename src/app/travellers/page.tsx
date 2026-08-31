"use client";
/**
 * Travellers — the Catalogue archetype (§7), with people instead of products.
 *
 * Grid is the default; the table is the alternate view. One right panel feeds both.
 * The colleague's view is the scope-isolation proof: an unshared profile is absent
 * from the list, never a locked row.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";
import { travellerCards, traveller, people, type TravellerCard } from "@/data/seed";
import { PageHeader, SplitPage, ViewToggle } from "@/components/layouts";
import { Absent, Chip, DataList, EmptyState, Section, NarrationNote, ConfirmBanner } from "@/components/bits";
import { Button } from "@/components/ui/button";
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
    return <Chip tone="neutral"><Lock className="size-3" aria-hidden /> private to you</Chip>;
  }
  return (
    <Chip tone="primary">
      <Share2 className="size-3" aria-hidden />
      {state === "full" ? "Collaborator Full" : "Collaborator Basic"}
      {who ? ` · ${who}` : ""}
    </Chip>
  );
}

/* ── page ───────────────────────────────────────────────────────────────────── */
export default function TravellersPage() {
  const { s } = useDemo();
  const isColleague = s.role === "colleague";

  const [view, setView] = useState<"grid" | "table">("grid");
  const [selected, setSelected] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  /* The live tier governs S. Marchetti (set from the profile's share sheet); every
     other card carries the share recorded in the data. */
  const shareStateFor = (c: TravellerCard): ShareState =>
    c.id === traveller.id ? s.shareTier : c.shared ? "full" : "private";
  const sharedWithFor = (c: TravellerCard) =>
    c.id === traveller.id ? (s.shareTier === "private" ? null : people.colleague) : c.shared;

  /* What a colleague can reach at all: the profiles explicitly shared to them. The
     tier the advisor last chose applies to that set — at "private" the set is empty,
     and an empty set is an empty page, not a page of locked rows. */
  const rows = useMemo(() => {
    if (!isColleague) return travellerCards;
    if (s.shareTier === "private") return [];
    return travellerCards.filter((c) => c.id === traveller.id || c.shared === people.colleague);
  }, [isColleague, s.shareTier]);

  /* Basic tier: name and contact only. The absent fields are not rendered at all. */
  const basic = isColleague && s.shareTier === "basic";

  const active = selected ? rows.find((c) => c.id === selected) : undefined;

  const header = (
    <>
      <PageHeader
        title={
          <>
            Travellers
            <Chip tone="neutral">{isColleague ? "shared with you" : "your clients"}</Chip>
          </>
        }
        actions={rows.length > 0 ? <ViewToggle value={view} onChange={setView} /> : undefined}
      >
        <p className="mt-2 max-w-[62ch] type-data text-muted-foreground">
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
        <div className="mt-4 space-y-4">
          {/* It claimed the request "appears on their briefing"; nothing appeared on any
              briefing. The confirmation now says only what is true — the request is
              recorded and waiting on a person — which is also the honest product
              behaviour: access arrives when the owner grants it, not on a timer. */}
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
                <Button variant="outline" size="sm" onClick={() => setRequested(true)}>
                  Request access from the owner
                </Button>
              )
            }
          />
        </div>
      ) : (
            <div className="min-w-0">
              <p className="mt-3 type-meta">
                <span className="tnum">{rows.length}</span>{" "}
                {rows.length === 1 ? "traveller" : "travellers"}
                {basic && " · name and contact only at Collaborator Basic"}
              </p>

              {view === "grid" ? (
                <ul className="mt-4 grid grid-cols-1 gap-[var(--space-6)] sm:grid-cols-2 xl:grid-cols-3">
                  {rows.map((c) => (
                    /* h-full on the row too, or a card whose title wraps grows past its
                       neighbours when the inspector narrows the column. */
                    <li key={c.id} className="h-full">
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
                <Section variant="list" className="mt-4">
                  <ul>
                  {rows.map((c, i) => (
                    <li key={c.id} className={cn(i > 0 && "border-t border-border")}>
                      <button
                        type="button"
                        onClick={() => setSelected(c.id)}
                        aria-pressed={selected === c.id}
                        className={cn(
                          "row-grid w-full cursor-pointer px-4 text-left transition-colors",
                          selected === c.id ? "bg-muted/70" : "hover:bg-muted/40",
                        )}
                      >
                        <span className="row-primary flex items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft type-micro text-primary">
                            {initialsOf(c.name)}
                          </span>
                          <span className="min-w-0 truncate type-data-strong">{c.name}</span>
                        </span>
                        <span className="row-meta type-meta">
                          {basic ? "contact on file" : (c.nextTrip ?? "no trip on file")}
                        </span>
                        <span className="row-trailing flex items-center gap-2">
                          {!basic && c.departsInDays !== null && (
                            <span className="tnum type-meta">in {c.departsInDays}d</span>
                          )}
                          <Chip tone="neutral">{c.relationshipStatus}</Chip>
                        </span>
                      </button>
                    </li>
                  ))}
                  </ul>
                </Section>
              )}

              {/* The closing line is gone: it restated the header's sharing claim in the
                  same viewport. The share chip on every card carries it instead. */}
            </div>
      )}
    </SplitPage>
  );
}

/* ── grid card ──────────────────────────────────────────────────────────────── */
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
      /* Named. A screen reader reached six of these and announced "button" six times. */
      aria-label={`${c.name} — ${c.relationshipStatus}`}
      className={cn(
        "flex h-full w-full cursor-pointer flex-col gap-3 rounded-lg border bg-card p-4 text-left transition-colors",
        selected ? "border-primary bg-muted/40" : "border-border hover:bg-muted/30",
      )}
    >
      <span className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft type-micro text-primary">
          {initialsOf(c.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate type-data-strong">{c.name}</span>
          <span className="block type-meta">{c.relationshipStatus}</span>
        </span>
      </span>

      {basic ? (
        <span className="type-data text-muted-foreground">
          Contact on file. Preferences, journeys and spend are absent at this tier — not masked.
        </span>
      ) : (
        <span className="type-data">
          {c.nextTrip ?? "No trip on file"}
          {c.departsInDays !== null && (
            <span className="text-muted-foreground"> · departs in {c.departsInDays}d</span>
          )}
        </span>
      )}

      {/* Sharing leads. It is the subject of this whole surface, and it sat last in a
          row of otherwise identical pills — counts, a score and a permission state all
          reading as the same kind of fact. It now sits first, on its own line. */}
      <span className="mt-auto border-t border-border pt-3">
        {basic ? (
          <Chip tone="primary">Collaborator Basic</Chip>
        ) : (
          <>
            <ShareChip state={share} who={sharedWith} />
            <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 type-meta">
              <span>
                <span className="tnum">{c.profiles}</span>{" "}
                {c.profiles === 1 ? "profile" : "profiles"}
              </span>
              <span>
                <span className="tnum">{c.preferences}</span>{" "}
                {c.preferences === 1 ? "preference" : "preferences"}
              </span>
              {/* Acuity was rendered only when it existed, so a card with no score
                  looked identical to one where the score was withheld. */}
              <span>
                Acuity{" "}
                {c.acuityScore === null
                  ? <Absent reason="not run" />
                  : <span className="tnum">{c.acuityScore}</span>}
              </span>
            </span>
          </>
        )}
      </span>
    </button>
  );
}

/* ── right panel ────────────────────────────────────────────────────────────── */
function TravellerPanel({
  c, basic, share, sharedWith,
}: { c: TravellerCard; basic: boolean; share: ShareState; sharedWith: string | null }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft type-data-strong text-primary">
          {initialsOf(c.name)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate type-data-strong">{c.name}</h2>
          <p className="type-meta">{c.relationshipStatus}</p>
        </div>
      </div>

      {/* The one thing you always want is always here, never scrolled to. */}
      <Button asChild size="sm" className="w-full">
        <Link href={`/travellers/${c.id}`}>
          Open full profile <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </Button>

      {basic ? (
        <p className="type-data text-muted-foreground">
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
              {
                label: "Acuity",
                value: c.acuityScore === null ? null : <span className="tnum">{c.acuityScore}</span>,
                absent: "not run",
              },
            ]}
          />

          <div className="flex flex-wrap items-center gap-2">
            <ShareChip state={share} who={sharedWith} />
          </div>

          <p className="type-meta">
            {c.preferences} preferences, each attributed to a source and a date. Sharing, Acuity and
            the full journey history live on the profile itself.
          </p>
        </>
      )}
    </div>
  );
}
