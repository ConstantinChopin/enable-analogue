"use client";
/**
 * Traveller profile — recomposed as a document (docs/rebuild/04-recomposition-brief.md;
 * Journey F, docs/journeys/journey-f-traveller.md).
 *
 * The most sensitive record type in the product, presented as chapters at column
 * width, and beside them the one tool that follows you — Sharing — which holds the
 * profile's visibility and the ONE primary action at its bottom. Personal by
 * default; sharing explicit, tiered, attributed, revocable; every preference
 * answers "who says so, and when".
 *
 * Chapters, in order (S. Marchetti): the shortlist conflict (warn, not block) ·
 * Preferences (attributed rows; the single-source one asks to be confirmed) ·
 * Suggestions (labelled, outside the preferences until confirmed or discarded) ·
 * Where these come from (quiet) · Departure checklist · Travel profiles · Trips ·
 * Financials (entitlement-gated, absent otherwise).
 *
 * The one primary: "Share with J. Dubois" / "Change sharing" (the owner's act that
 * Journey F is about), at the bottom of the Sharing tool; a colleague at
 * Collaborator Full sees the tool with no action, because they cannot re-share.
 * Secondary actions: "Proceed knowingly (recorded)", "Confirm as preference";
 * text actions: "swap the property", "confirm this", "Discard".
 *
 * Every other id renders a real profile from its own card — never a stub. Its
 * Sharing tool carries state only: no share action is wired for those profiles,
 * so the generic profile has no filled button.
 */
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDemo, canViewCommissions } from "@/lib/store";
import {
  traveller, travellerCards, trips, shortlistConflict, people, type TravellerCard,
} from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import {
  Chip, DataList, Section, SeverityBanner, NarrationNote, ConfirmBanner, SourceTag, SchematicBadge,
  ConfidenceMeter, Rows, Row, RowStack, EmptyState,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRight, Lock, Share2, Users } from "lucide-react";

type Tier = "private" | "full" | "basic";
const tierLabel: Record<Tier, string> = { private: "private to you", full: "Collaborator Full", basic: "Collaborator Basic" };

/* ── the sharing state, in a word, on a chip ── */
function TierChip({ tier, who }: { tier: Tier; who?: string | null }) {
  if (tier === "private") {
    return <Chip tone="neutral"><Lock className="size-[var(--icon-sm)]" aria-hidden /> {tierLabel.private}</Chip>;
  }
  return (
    <Chip tone="primary">
      <Share2 className="size-[var(--icon-sm)]" aria-hidden />
      {tierLabel[tier]}{who ? ` · ${who}` : ""}
    </Chip>
  );
}

export default function TravellerProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  if (id === traveller.id) return <MarchettiProfile />;
  return <GenericProfile id={id} />;
}

/* ═══════════════ S. Marchetti — the full anatomy ═══════════════ */
function MarchettiProfile() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s);
  const viaShare = s.role === "owner";

  const [shareOpen, setShareOpen] = useState(false);
  const [pickedTier, setPickedTier] = useState<typeof s.shareTier>(s.shareTier);
  const [shareBanner, setShareBanner] = useState(false);
  const [proceeded, setProceeded] = useState(false);
  const [suggestion, setSuggestion] = useState<"pending" | "discarded">("pending");
  const [requested, setRequested] = useState(false);

  /* ── Colleague + private: absent, not masked ── */
  if (viaShare && s.shareTier === "private") {
    return (
      <Page width="wide">
        <PageHeader title="Travellers" />
        <div className="space-y-[var(--space-4)]">
          {requested && (
            <ConfirmBanner show>
              Request recorded for {people.advisor} · today. Access arrives only if they share;
              nothing here grants it.
            </ConfirmBanner>
          )}
          <EmptyState
            icon={Users}
            title="No travellers shared with you"
            body="An unshared profile is invisible. There is nothing here to unlock."
            action={
              !requested && (
                <Button variant="secondary" size="sm" onClick={() => setRequested(true)}>
                  Request access from the owner
                </Button>
              )
            }
          />
        </div>
      </Page>
    );
  }

  /* ── Colleague + basic: name + contact only ── */
  if (viaShare && s.shareTier === "basic") {
    return (
      <Page width="wide">
        <PageHeader title={<>{traveller.name} <Chip tone="primary">Collaborator Basic</Chip></>} />
        <Section title="Contact">
          <p className="type-data">
            {traveller.name} · {traveller.relationshipStatus} · contact on file
          </p>
          <p className="mt-[var(--space-3)] type-data-read text-label-secondary">
            Name and contact only at this tier. Preferences, journeys, intelligence and spend fields
            are absent — not masked. The share is explicit, attributed, and revocable by{" "}
            {people.advisor}.
          </p>
        </Section>
      </Page>
    );
  }

  /* ── Owner (advisor / lead / ops) or colleague at Collaborator Full ── */
  const done = traveller.departure.checklist.done;
  const of = traveller.departure.checklist.of;

  const visibilityLine =
    s.shareTier === "private"
      ? "Private to you. Nobody else at the agency can read this profile."
      : s.shareTier === "full"
        ? `Shared with ${people.owner} — Collaborator Full. All fields, including the sensitive ones; can edit; cannot re-share or delete.`
        : `Shared with ${people.owner} — Collaborator Basic. Name and contact only.`;

  function applyShare() {
    d({ type: "share", tier: pickedTier });
    setShareOpen(false);
    setShareBanner(true);
  }

  const singleSource = traveller.preferences.filter((p) => p.sources < 2).length;

  return (
    <Page width="wide">
      <PageHeader
        title={
          <>
            {traveller.name}
            <Chip tone="warn">departs in {traveller.departure.inDays} days</Chip>
          </>
        }
      >
        <p className="mt-[var(--space-2)] type-meta">
          {traveller.relationshipStatus} · {traveller.preferences.length} preferences, each
          attributed to a source and a date
        </p>
      </PageHeader>

      <NarrationNote>
        The sharing model is a three-stage documented iteration: tiered sharing called required,
        all-or-nothing shipped for simplicity with a revisit trigger, and the trigger fired —
        Collaborator Full / Basic is the schema&rsquo;s answer.
      </NarrationNote>

      <div className="doc-layout">
        {/* ── the body: chapters at column width ── */}
        <div className="min-w-0">
          <div className="space-y-[var(--space-2)] pb-[var(--gap-2)] empty:hidden">
            {shareBanner && (
              <ConfirmBanner show>
                {s.shareTier === "private"
                  ? "Sharing withdrawn — the profile is private to you again. The audit records the shared interval."
                  : `Shared with ${people.owner} at the ${tierLabel[s.shareTier]} tier — explicit, attributed, revocable. Non-admin shares route through the suggestion and approval workflow.`}
              </ConfirmBanner>
            )}

            {/* Shortlist conflict — warn, not block (Journey F U1). */}
            <SeverityBanner severity="Important">
              <div className="flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-[var(--space-2)]">
                <span className="min-w-0">
                  <b>Shortlist conflict.</b> {shortlistConflict.property} is {shortlistConflict.reason}.
                </span>
                <span className="ml-auto" />
                <Button asChild variant="link" size="sm">
                  <Link href="/itineraries">swap the property</Link>
                </Button>
                {proceeded ? (
                  <Chip tone="neutral">proceeded knowingly · {people.advisor} · recorded</Chip>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setProceeded(true)}>
                    Proceed knowingly (recorded)
                  </Button>
                )}
              </div>
            </SeverityBanner>
          </div>

          {/* Preferences — every one says who said so, and when. */}
          <Section title="Preferences" chips={<Chip tone="neutral">every one attributed</Chip>}>
            <Rows>
              {traveller.preferences.map((p) => {
                const confirmed = p.id === "kaiseki" && s.prefConfirmed;
                const asks = "confirmThis" in p && !!p.confirmThis && !confirmed;
                return (
                  <RowStack
                    key={p.id}
                    head={
                      <>
                        <span className="row-primary type-data-strong">{p.text}</span>
                        <span className="row-trailing flex items-center gap-[var(--space-2)]">
                          {confirmed ? (
                            <Chip tone="ok">confirmed · {people.advisor} · today</Chip>
                          ) : asks ? (
                            <>
                              <Chip tone="warn">1 source</Chip>
                              <Button variant="link" size="sm" onClick={() => d({ type: "confirmPref" })}>confirm this</Button>
                            </>
                          ) : (
                            <Chip tone="neutral" className="tnum">{p.sources} {p.sources === 1 ? "source" : "sources"}</Chip>
                          )}
                        </span>
                      </>
                    }
                  >
                    <span className="flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-1">
                      <SourceTag kind={p.source.kind} label={`${p.source.label} · ${p.source.when}`} />
                      {/* The bare probability is gone: the corroboration count carries the
                          signal; the bar shows its weight. */}
                      <ConfidenceMeter agree={Math.round(p.confidence * 100)} total={100} label={null} />
                    </span>
                  </RowStack>
                );
              })}

              {/* A confirmed suggestion moves in here — a preference like any other, attributed. */}
              {s.prefConfirmed &&
                suggestion !== "discarded" &&
                traveller.suggestions.map((sg) => (
                  <RowStack
                    key={sg.id}
                    head={
                      <>
                        <span className="row-primary type-data-strong">{sg.text}</span>
                        <span className="row-trailing flex items-center gap-[var(--space-2)]">
                          <Chip tone="ok">confirmed · {people.advisor} · today</Chip>
                        </span>
                      </>
                    }
                  >
                    <SourceTag kind="manual" label="confirmed from suggestion · today" />
                  </RowStack>
                ))}
            </Rows>
          </Section>

          {/* Suggestions — labelled, outside the preferences until a person decides (U3). */}
          <Section title="Suggestions" chips={<Chip tone="neutral">labelled · never applied unconfirmed</Chip>}>
            {traveller.suggestions.map((sg) => (
              <div key={sg.id}>
                {suggestion === "discarded" ? (
                  <p className="type-data-read text-label-secondary">
                    Suggestion discarded — recorded, and the model learns nothing was true here.
                  </p>
                ) : s.prefConfirmed ? (
                  <p className="type-data-read text-label-secondary">
                    Confirmed and moved into Preferences · attributed to {people.advisor}.
                  </p>
                ) : (
                  <>
                    <p className="type-data-read"><span className="italic">{sg.text}</span> <span className="type-meta">· {sg.basis}</span></p>
                    <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-3)]">
                      <Button variant="secondary" size="sm" onClick={() => d({ type: "confirmPref" })}>
                        Confirm as preference
                      </Button>
                      <Button variant="link" size="sm" onClick={() => setSuggestion("discarded")}>
                        Discard
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </Section>

          {/* Where the signals come from — a note, not a chapter. */}
          <Section title="Where these come from" quiet deep>
            <Rows>
              {traveller.signalsBySource.map(([label, n]) => (
                <Row key={label}>
                  <span className="row-primary">{label}</span>
                  <span className="row-trailing tnum text-label-secondary">{n}</span>
                </Row>
              ))}
              <Row>
                <span className="row-primary type-data-strong">Signals held</span>
                <span className="row-trailing tnum type-data-strong">9</span>
              </Row>
            </Rows>
            <p className="mt-[var(--space-3)] type-meta">
              <span className="tnum">{singleSource}</span> of these rest on a single source. The product marks them and asks
              for a second before it treats any of them as settled.
            </p>
          </Section>

          {/* Departure checklist — trip admin, below the person it belongs to. */}
          <Section
            title={`${traveller.departure.trip} — departure checklist`}
            deep
            chips={<Chip tone="neutral"><span className="tnum">{done}/{of}</span> complete</Chip>}
          >
            <Progress tone="neutral" value={(done / of) * 100} className="max-w-md" />
            <Rows className="mt-[var(--space-3)]">
              {traveller.departure.checklist.items.map((item) => {
                const pending = item.includes("pending");
                return (
                  <Row key={item}>
                    <span className={pending ? "row-primary text-label-secondary" : "row-primary"}>
                      {item.replace(" — pending", "")}
                    </span>
                    <span className="row-trailing">
                      {pending ? <Chip tone="warn">pending</Chip> : <Chip tone="neutral">done</Chip>}
                    </span>
                  </Row>
                );
              })}
            </Rows>
          </Section>

          {/* Profiles */}
          <Section title="Travel profiles" deep>
            <div className="flex flex-wrap gap-[var(--space-2)]">
              {traveller.profiles.map((p) => (
                <Chip key={p.type} tone={p.isPrimary ? "primary" : "neutral"}>
                  {p.type}
                  {p.isPrimary ? " · primary" : ""}
                </Chip>
              ))}
            </div>
            <p className="mt-[var(--space-3)] type-meta">
              Six blocks per profile — a preference files into the profile it belongs to.
            </p>
          </Section>

          {/* Trips */}
          <Section title="Trips" deep>
            <Rows>
              {traveller.trips.map((t) => (
                <Row key={t.title}>
                  <span className="row-primary type-data-strong">{t.title}</span>
                  <span className="row-meta tnum type-meta">{t.dates}</span>
                  <span className="row-trailing">
                    <Chip tone={t.status === "Planning" ? "primary" : "neutral"}>{t.status}</Chip>
                  </span>
                </Row>
              ))}
            </Rows>
          </Section>

          {/* Financials — gated; absent for the colleague, never masked */}
          {money && (
            <Section title="Financials" deep chips={<Chip tone="neutral">commission entitlement</Chip>}>
              <DataList
                rows={[
                  {
                    label: `Lifetime spend · since ${traveller.financials.since}`,
                    value: (
                      <span className="tnum">
                        {traveller.financials.currency}{" "}
                        {traveller.financials.lifetimeSpend.toLocaleString("en-GB")}
                      </span>
                    ),
                  },
                  { label: "Trips booked", value: <span className="tnum">{traveller.financials.trips}</span> },
                  {
                    label: "Average trip value",
                    value: (
                      <span className="tnum">
                        {traveller.financials.currency}{" "}
                        {traveller.financials.averageTripValue.toLocaleString("en-GB")}
                      </span>
                    ),
                  },
                  {
                    label: "Average daily rate",
                    value: (
                      <span className="tnum">
                        {traveller.financials.currency}{" "}
                        {traveller.financials.averageDailyRate.toLocaleString("en-GB")}
                      </span>
                    ),
                  },
                ]}
              />
              <p className="mt-[var(--space-3)] type-meta">
                {traveller.financials.source}. Figures follow the booking system, which stays
                authoritative for money — they carry its sync time rather than claiming to be
                current.
              </p>
            </Section>
          )}
        </div>

        {/* ── the tool that follows you: who can see this, and the one action ── */}
        <aside className="doc-rail" data-rail-label="Sharing">
          <Section variant="tool" follows title="Sharing">
            <div className="flex flex-wrap items-center gap-[var(--space-2)]">
              <TierChip tier={s.shareTier} who={s.shareTier === "private" ? null : people.owner} />
            </div>
            <p className="mt-[var(--space-3)] type-data-read text-label-secondary">{visibilityLine}</p>
            <Rows className="mt-[var(--space-3)]">
              <Row>
                <span className="row-primary">Owner</span>
                <span className="row-trailing text-label-secondary">{people.advisor}</span>
              </Row>
              <Row>
                <span className="row-primary">Spend fields</span>
                <span className="row-trailing text-label-secondary">{money ? "entitled" : "absent"}</span>
              </Row>
              <Row>
                <span className="row-primary">Audit</span>
                <span className="row-trailing text-label-secondary">every share, every revoke</span>
              </Row>
            </Rows>
            {viaShare ? (
              <p className="mt-[var(--space-4)] type-meta">
                Shared with you by {people.advisor}. A collaborator cannot re-share or delete.
              </p>
            ) : (
              <div className="mt-[var(--space-4)]">
                <Button
                  className="w-full"
                  onClick={() => {
                    setPickedTier(s.shareTier);
                    setShareOpen(true);
                  }}
                >
                  {s.shareTier === "private" ? `Share with ${people.owner}` : "Change sharing"}
                </Button>
                <p className="mt-[var(--space-2)] text-center type-meta">Explicit, attributed, revocable.</p>
              </div>
            )}
          </Section>
        </aside>
      </div>

      {/* ── Sharing sheet ── */}
      <Sheet open={shareOpen} onOpenChange={setShareOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Who can see this profile</SheetTitle>
            <SheetDescription>Sharing with {people.owner}</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
            <RadioGroup
              value={pickedTier}
              onValueChange={(v) => setPickedTier(v as typeof pickedTier)}
              className="gap-[var(--space-3)]"
            >
              {([
                ["private", "Private to you", "Nobody else at the agency can read it."],
                ["full", "Collaborator — Full", "All fields, including the sensitive ones; can edit. Cannot re-share or delete."],
                ["basic", "Collaborator — Basic", "Name and contact only, for a limited introduction."],
              ] as const).map(([v, label, hint]) => (
                <div key={v} className="flex items-start gap-[var(--space-3)]">
                  <RadioGroupItem value={v} id={`tier-${v}`} className="mt-px" />
                  <Label htmlFor={`tier-${v}`} className="flex flex-col items-start gap-0.5">
                    <span className="type-data-strong">{label}</span>
                    <span className="type-meta">{hint}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <div className="mt-[var(--space-4)] space-y-[var(--space-2)] border-t border-hairline pt-[var(--space-4)] type-meta">
              <p>Private by default. Sharing is an explicit action.</p>
              <p>A non-admin share routes through the suggestion and approval workflow.</p>
              <p>Spend fields stay behind the commission entitlement at every tier.</p>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={applyShare}>Apply sharing</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Page>
  );
}

/* ═══════════════ Every other traveller — a real profile, not a stub ═══════════════ */
function GenericProfile({ id }: { id: string }) {
  const { s } = useDemo();
  const card: TravellerCard | undefined = travellerCards.find((c) => c.id === id);

  if (!card) {
    return (
      <Page width="wide">
        <PageHeader title="Not on your list" />
        <Section>
          <p className="type-data-read text-label-secondary">
            Nothing at this address for your permission path. What is not shared is absent, not
            locked.
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-[var(--space-3)]">
            <Link href="/travellers">Back to travellers <ArrowRight aria-hidden /></Link>
          </Button>
        </Section>
      </Page>
    );
  }

  /* A colleague reaches a profile only through a share, and only at the live tier. */
  const viaShare = s.role === "owner";
  const reachable = !viaShare || (s.shareTier !== "private" && card.shared === people.owner);
  if (!reachable) {
    return (
      <Page width="wide">
        <PageHeader title="Not shared with you" />
        <Section>
          <p className="type-data-read text-label-secondary">
            This profile is private to its owning advisor. It is absent from your list, not locked
            inside it.
          </p>
        </Section>
      </Page>
    );
  }
  const basic = viaShare && s.shareTier === "basic";

  const trip = trips.find((t) => t.travellerId === card.id || t.traveller === card.name);
  const past = trips.filter((t) => t.traveller === card.name);

  return (
    <Page width="wide">
      <PageHeader
        title={
          <>
            {card.name}
            {card.departsInDays !== null && !basic && (
              <Chip tone={card.departsInDays <= 14 ? "warn" : "neutral"}>
                departs in {card.departsInDays} days
              </Chip>
            )}
          </>
        }
      >
        <p className="mt-[var(--space-2)] type-meta">{card.relationshipStatus}</p>
      </PageHeader>

      {basic ? (
        <Section title="Contact">
          <p className="type-data">
            {card.name} · {card.relationshipStatus} · contact on file
          </p>
          <p className="mt-[var(--space-3)] type-data-read text-label-secondary">
            Name and contact only at Collaborator Basic. Preferences, journeys, intelligence and
            spend fields are absent — not masked.
          </p>
        </Section>
      ) : (
        <div className="doc-layout">
          <div className="min-w-0">
            <Section title="At a glance">
              <DataList
                rows={[
                  { label: "Relationship", value: card.relationshipStatus },
                  { label: "Travel profiles", value: <span className="tnum">{card.profiles}</span> },
                  { label: "Preferences", value: <span className="tnum">{card.preferences}</span> },
                  {
                    label: "Departs in",
                    value: card.departsInDays === null ? null : <span className="tnum">{card.departsInDays} days</span>,
                    absent: "not applicable",
                  },
                ]}
              />
            </Section>

            <Section title="Next journey" deep>
              {trip ? (
                <>
                  <div className="flex flex-wrap items-center gap-[var(--space-3)]">
                    <span className="type-data-strong">{trip.title}</span>
                    <Chip tone={trip.status === "Booked" ? "ok" : "neutral"}>{trip.status}</Chip>
                  </div>
                  <p className="mt-[var(--space-2)] type-data-read text-label-secondary">
                    {trip.destinations.join(" · ")} · <span className="tnum">{trip.dates}</span> ·{" "}
                    <span className="tnum">{trip.nights}</span> nights
                  </p>
                  {trip.checklist && (
                    <div className="mt-[var(--space-4)]">
                      <Progress tone="neutral" value={(trip.checklist.done / trip.checklist.of) * 100} className="max-w-md" />
                      <p className="mt-[var(--space-2)] type-meta">
                        Departure checklist{" "}
                        <span className="tnum">
                          {trip.checklist.done}/{trip.checklist.of}
                        </span>
                      </p>
                    </div>
                  )}
                  <Button asChild variant="secondary" size="sm" className="mt-[var(--space-4)]">
                    <Link href="/itineraries">Open the itinerary <ArrowRight aria-hidden /></Link>
                  </Button>
                </>
              ) : (
                <p className="type-data-read text-label-secondary">No trip on file.</p>
              )}
            </Section>

            <Section title="All journeys" deep>
              {past.length === 0 ? (
                <p className="type-data-read text-label-secondary">Nothing recorded yet.</p>
              ) : (
                <Rows>
                  {past.map((t) => (
                    <Row key={t.id}>
                      <span className="row-primary type-data-strong">{t.title}</span>
                      <span className="row-meta tnum type-meta">{t.dates}</span>
                      <span className="row-trailing">
                        <Chip tone={t.status === "Traveled" ? "neutral" : "primary"}>{t.status}</Chip>
                      </span>
                    </Row>
                  ))}
                </Rows>
              )}
            </Section>

            <Section title="Intelligence" quiet deep chips={<SchematicBadge />}>
              <p className="max-w-[60ch] type-data-read text-label-secondary">
                <span className="tnum">{card.preferences}</span> preferences sit on this profile,
                each one attributed to a source and a date, across{" "}
                <span className="tnum">{card.profiles}</span> travel{" "}
                {card.profiles === 1 ? "profile" : "profiles"}. The per-field anatomy is built on{" "}
                <Button asChild variant="link" size="sm">
                  <Link href={`/travellers/${traveller.id}`}>{traveller.name}</Link>
                </Button>{" "}
                in this vintage.
              </p>
            </Section>
          </div>

          {/* The tool that follows you: the sharing state. No share action is wired
              for this profile, so the tool carries state only. */}
          <aside className="doc-rail" data-rail-label="Sharing">
            <Section variant="tool" follows title="Sharing">
              <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                <TierChip tier={card.shared ? "full" : "private"} who={card.shared} />
              </div>
              <p className="mt-[var(--space-3)] type-data-read text-label-secondary">
                {card.shared
                  ? `Shared with ${card.shared} — Collaborator Full. Explicit, attributed, and revocable.`
                  : "Private to you. Nobody else at the agency can read this profile."}
              </p>
              <Rows className="mt-[var(--space-3)]">
                <Row>
                  <span className="row-primary">Owner</span>
                  <span className="row-trailing text-label-secondary">{people.advisor}</span>
                </Row>
                <Row>
                  <span className="row-primary">Audit</span>
                  <span className="row-trailing text-label-secondary">every share, every revoke</span>
                </Row>
              </Rows>
            </Section>
          </aside>
        </div>
      )}
    </Page>
  );
}
