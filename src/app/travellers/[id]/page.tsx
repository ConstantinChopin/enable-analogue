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
 * Who reaches it (docs/rebuild/05-two-roles.md). The seeded travellers are
 * R. Devane's. The owner, M. Keller, reaches one only when R. Devane shares it with
 * her: the personal layer is the advisor's, inside an agency or not, and there is no
 * policy access. Unshared, the profile is absent — not masked — and the only thing
 * on the page is "Request access from R. Devane" (a secondary; it notifies R. Devane
 * and grants nothing). At Collaborator Basic: name and contact. At Full: the profile.
 *
 * The one primary: "Share with M. Keller" / "Change sharing" (the advisor's act that
 * Journey F is about), at the bottom of the Sharing tool, where a request from the
 * owner also shows — the share answers it. A collaborator at Collaborator Full sees
 * the tool with no action, because she cannot re-share. Secondary actions: "Proceed
 * knowingly (recorded)", "Confirm as preference"; text actions: "swap the property",
 * "confirm this", "Discard". "Start a trip" waits for the itinerary builder.
 *
 * Every other seeded id renders a real profile from its own card — never a stub. Its
 * Sharing tool carries state only: no share action is wired for those profiles, so
 * the generic profile has no filled button.
 *
 * A traveller added by hand (U24) renders what its maker entered: name, email, and
 * her note, attributed to her and dated today. Its Sharing tool's primary opens the
 * one share control — Just me · My team · The whole agency — and the whole agency
 * waits for the owner unless the owner is the one sharing. Anyone it has not reached
 * gets the absent page.
 */
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useDemo, canViewCommissions, scopeAudience, type CreatedTraveller, type DemoState, type ShareScope,
} from "@/lib/store";
import {
  traveller, travellerCards, trips, shortlistConflict, people, personName, type TravellerCard,
} from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import {
  Chip, DataList, Section, SeverityBanner, NarrationNote, ConfirmBanner, SourceTag, SchematicBadge,
  ConfidenceMeter, Rows, Row, RowStack,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRight, Clock, Lock, Share2 } from "lucide-react";

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
  const { s } = useDemo();
  if (id === traveller.id) return <MarchettiProfile />;
  const created = s.createdTravellers.find((t) => t.id === id);
  if (created) return <CreatedProfile t={created} />;
  return <GenericProfile id={id} />;
}

/* ── the absent page: nothing of the profile, not even its name ── */
function NotOnYourList() {
  return (
    <Page width="wide">
      <PageHeader title="Not on your list" />
      <Section>
        <p className="type-data-read text-label-secondary">
          Nothing at this address for you. What is not shared is absent, not locked.
        </p>
        <Button asChild variant="secondary" size="sm" className="mt-[var(--space-3)]">
          <Link href="/travellers">Back to travellers <ArrowRight aria-hidden /></Link>
        </Button>
      </Section>
    </Page>
  );
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

  /* The owner's request to see this profile, if she made one. It lives in the store, so
     it survives a reload and reaches R. Devane as a notification. */
  const ownerAsked = s.accessRequests.some((r) => r.travellerId === traveller.id && r.by === "owner");

  /* ── Owner + private: absent, not masked ──
     She reached this address by name, from a departure or a commission. Nothing of the
     profile renders — not its name, not a locked row — only who holds it and the ask. */
  if (viaShare && s.shareTier === "private") {
    return (
      <Page width="wide">
        <PageHeader title="Not shared with you" />
        <Section>
          <div className="space-y-[var(--space-4)]">
            {ownerAsked && (
              <ConfirmBanner show>
                Your request is with {people.advisor} · today. It grants nothing: the profile opens
                only if {people.advisor} shares it with you.
              </ConfirmBanner>
            )}
            <p className="max-w-[62ch] type-data-read text-label-secondary">
              This traveller profile belongs to {people.advisor}, and it has not been shared with
              you. A profile belongs to its advisor inside the agency too; what is not shared is
              absent, and nothing here unlocks it.
            </p>
            {!ownerAsked && (
              <Button variant="secondary" size="sm" onClick={() => d({ type: "requestAccess", travellerId: traveller.id })}>
                Request access from {people.advisor}
              </Button>
            )}
          </div>
        </Section>
      </Page>
    );
  }

  /* ── Owner + basic: name + contact only ── */
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

  /* ── R. Devane, who holds the profile, or the owner at Collaborator Full ── */
  const done = traveller.departure.checklist.done;
  const of = traveller.departure.checklist.of;

  const visibilityLine = viaShare
    ? "Collaborator Full. All fields, including the sensitive ones, and you can edit them."
    : s.shareTier === "private"
      ? `Private to you. Nobody else at the agency can read this profile, ${people.owner} included.`
      : s.shareTier === "full"
        ? `Shared with ${people.owner} — Collaborator Full. All fields, including the sensitive ones; she can edit, but not re-share or delete.`
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
                  : `Shared with ${people.owner} at ${tierLabel[s.shareTier]}, from now. Explicit, attributed, and yours to withdraw.`}
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
                  <Chip tone="neutral">proceeded knowingly · {personName[s.role]} · recorded</Chip>
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
              <TierChip tier={s.shareTier} who={s.shareTier === "private" ? null : viaShare ? "you" : people.owner} />
            </div>
            {/* A request from the owner waits here, where the act that answers it lives. */}
            {!viaShare && ownerAsked && s.shareTier === "private" && (
              <SeverityBanner severity="Info" className="mt-[var(--space-3)]">
                <b>{people.owner} asked to see this profile</b> · today. The request grants nothing
                by itself; sharing answers it.
              </SeverityBanner>
            )}
            <p className="mt-[var(--space-3)] type-data-read text-label-secondary">{visibilityLine}</p>
            {!viaShare && ownerAsked && s.shareTier !== "private" && (
              <p className="mt-[var(--space-2)] type-meta">Answers {people.owner}&rsquo;s request to see this profile.</p>
            )}
            <Rows className="mt-[var(--space-3)]">
              <Row>
                <span className="row-primary">Advisor</span>
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
            <SheetDescription>Sharing with {people.owner}, the agency owner</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
            <RadioGroup
              value={pickedTier}
              onValueChange={(v) => setPickedTier(v as typeof pickedTier)}
              className="gap-[var(--space-3)]"
            >
              {([
                ["private", "Private", `Only you. Nobody else at the agency can read it, ${people.owner} included.`],
                ["full", `Collaborator Full · ${people.owner}`, "All fields, including the sensitive ones; she can edit. She cannot re-share or delete."],
                ["basic", `Collaborator Basic · ${people.owner}`, "Name and contact only, for a limited introduction."],
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
              <p>A share with a named person takes effect at once, and you can withdraw it at any time.</p>
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

  if (!card) return <NotOnYourList />;

  /* The owner reaches R. Devane's traveller only through a share recorded on its card;
     S. Marchetti's live tier governs S. Marchetti alone. */
  const viaShare = s.role === "owner";
  const reachable = !viaShare || card.shared === people.owner;
  if (!reachable) {
    return (
      <Page width="wide">
        <PageHeader title="Not shared with you" />
        <Section>
          <p className="type-data-read text-label-secondary">
            This traveller profile belongs to {people.advisor}, and it has not been shared with
            you. It is absent from your list, not locked inside it.
          </p>
        </Section>
      </Page>
    );
  }
  /* The seed records every card share at Collaborator Full. */
  const basic = false;

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
                <TierChip tier={card.shared ? "full" : "private"} who={viaShare ? "you" : card.shared} />
              </div>
              <p className="mt-[var(--space-3)] type-data-read text-label-secondary">
                {viaShare
                  ? `Shared with you by ${people.advisor} — Collaborator Full. A collaborator cannot re-share or delete.`
                  : card.shared
                    ? `Shared with ${card.shared} — Collaborator Full. Explicit, attributed, and revocable.`
                    : "Private to you. Nobody else at the agency can read this profile."}
              </p>
              <Rows className="mt-[var(--space-3)]">
                <Row>
                  <span className="row-primary">Advisor</span>
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

/* ═══════════════ A traveller added by hand (U24) ═══════════════
   Everything created starts private to its maker. It reaches her team the moment she
   shares it; it reaches the whole agency when the owner releases it from the publish
   queue — or at once, when the owner is the one sharing. "pending" is the owner
   reading what an advisor sent to the whole agency, which she has yet to release.   */
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

function CreatedProfile({ t }: { t: CreatedTraveller }) {
  const { s, d } = useDemo();
  const [shareOpen, setShareOpen] = useState(false);
  const [picked, setPicked] = useState<ShareScope>(t.share);
  const [banner, setBanner] = useState(false);

  const reach = reachOfCreated(t, s);
  if (!reach) return <NotOnYourList />;

  const mine = reach === "maker";
  const maker = personName[t.by];
  const team = scopeAudience("team", t.by);
  const decided = s.released[`trv-${t.id}`];
  const viaQueue = t.share === "agency" && t.by === "user";
  const waiting = viaQueue && !decided;
  const returned = viaQueue && decided?.outcome === "returned";

  const chip = t.share === "private" ? (
    <Chip tone="neutral"><Lock className="size-[var(--icon-sm)]" aria-hidden /> private to you</Chip>
  ) : waiting ? (
    <Chip tone="neutral">
      <Clock className="size-[var(--icon-sm)]" aria-hidden />
      {mine ? `waiting for ${people.owner}` : "waiting for your release"}
    </Chip>
  ) : returned ? (
    <Chip tone="neutral"><Lock className="size-[var(--icon-sm)]" aria-hidden /> returned by {people.owner}</Chip>
  ) : (
    <Chip tone="primary">
      <Share2 className="size-[var(--icon-sm)]" aria-hidden />
      {t.share === "team" ? "your team" : "the whole agency"}{mine ? "" : ` · shared by ${maker}`}
    </Chip>
  );

  const visibilityLine =
    t.share === "private"
      ? `Only you. Nobody else at the agency can read this profile${t.by === "user" ? `, ${people.owner} included` : ""}.`
      : waiting
        ? mine
          ? `In ${people.owner}’s publish queue. It reaches the whole agency when she releases it; until then it is private to you.`
          : `${maker} shared this profile with the whole agency. It waits for your release in the publish queue.`
        : returned
          ? `${people.owner} returned it${decided?.note ? `: “${decided.note}”` : ""}. It has not reached the whole agency, and it is private to you until you share it again.`
          : t.share === "team"
            ? mine
              ? `Your team reads it — ${team}. It took effect when you shared it.`
              : `${maker} shared this profile with the team — ${team}.`
            : mine
              ? "Every advisor in the agency reads it."
              : `${maker} shared this profile with the whole agency.`;

  const confirmLine =
    t.share === "private"
      ? "Private to you again. The audit records the shared interval."
      : t.share === "team"
        ? `Shared with your team — ${team}. It took effect at once.`
        : t.by === "owner"
          ? "Shared with the whole agency. It went out directly."
          : `Sent to ${people.owner}’s publish queue. It reaches the whole agency when she releases it.`;

  const scopes: [ShareScope, string, string][] = [
    ["private", "Just me", t.by === "user" ? `Only you. Nobody else at the agency can read it, ${people.owner} included.` : "Only you."],
    ["team", "My team", `${team}, at once.`],
    [
      "agency",
      "The whole agency",
      t.by === "user"
        ? `Every advisor in the agency, once ${people.owner} releases it from the publish queue. Until then it stays private to you.`
        : "Every advisor in the agency, at once.",
    ],
  ];

  function applyShare() {
    d({ type: "shareCreated", kind: "traveller", id: t.id, scope: picked });
    setShareOpen(false);
    setBanner(true);
  }

  return (
    <Page width="wide">
      <PageHeader
        title={
          <>
            {t.name}
            <Chip tone="neutral">added by hand</Chip>
          </>
        }
      >
        <p className="mt-[var(--space-2)] type-meta">Added by hand by {maker} · today</p>
      </PageHeader>

      <div className="doc-layout">
        <div className="min-w-0">
          {banner && mine && (
            <div className="pb-[var(--gap-2)]">
              <ConfirmBanner show>{confirmLine}</ConfirmBanner>
            </div>
          )}

          <Section title="Contact">
            <DataList
              rows={[
                { label: "Name", value: t.name },
                { label: "Email", value: t.email },
              ]}
            />
          </Section>

          {/* Her note, attributed and dated — never the traveller's own statement. */}
          <Section title={`What ${maker} already knows`} deep chips={<Chip tone="neutral">a note, not a preference</Chip>}>
            {t.note ? (
              <Rows>
                <RowStack head={<span className="row-primary type-data-read">{t.note}</span>}>
                  <SourceTag kind="manual" label={`note, ${maker} · today`} />
                </RowStack>
              </Rows>
            ) : (
              <p className="type-data-read text-label-secondary">Nothing noted yet.</p>
            )}
            <p className="mt-[var(--space-3)] max-w-[62ch] type-meta">
              Kept as {maker} wrote it, with her name and the date. It is not something the
              traveller said, and nothing becomes a preference until a source confirms it.
            </p>
          </Section>

          <Section title="Everything else" quiet deep>
            <p className="max-w-[62ch] type-data-read text-label-secondary">
              Preferences, travel profiles and trips arrive with their sources as the relationship
              does. None is guessed into this profile.
            </p>
          </Section>
        </div>

        {/* ── the tool that follows you: who can see this, and the one action ── */}
        <aside className="doc-rail" data-rail-label="Sharing">
          <Section variant="tool" follows title="Sharing">
            <div className="flex flex-wrap items-center gap-[var(--space-2)]">{chip}</div>
            <p className="mt-[var(--space-3)] type-data-read text-label-secondary">{visibilityLine}</p>
            <Rows className="mt-[var(--space-3)]">
              <Row>
                <span className="row-primary">Added by</span>
                <span className="row-trailing text-label-secondary">{maker} · today</span>
              </Row>
              <Row>
                <span className="row-primary">Audit</span>
                <span className="row-trailing text-label-secondary">every share, every revoke</span>
              </Row>
            </Rows>
            {mine ? (
              <div className="mt-[var(--space-4)]">
                <Button
                  className="w-full"
                  onClick={() => {
                    setPicked(t.share);
                    setShareOpen(true);
                  }}
                >
                  {t.share === "private" ? "Share this traveller" : "Change sharing"}
                </Button>
                <p className="mt-[var(--space-2)] text-center type-meta">Explicit, attributed, revocable.</p>
              </div>
            ) : reach === "pending" ? (
              <Button asChild variant="secondary" size="sm" className="mt-[var(--space-4)]">
                <Link href="/admin/publish">Open the publish queue <ArrowRight aria-hidden /></Link>
              </Button>
            ) : (
              <p className="mt-[var(--space-4)] type-meta">
                Shared with you by {maker}. Only {maker} can change who sees it.
              </p>
            )}
          </Section>
        </aside>
      </div>

      {/* ── Sharing sheet: the one share control ── */}
      <Sheet open={shareOpen} onOpenChange={setShareOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Who can see this profile</SheetTitle>
            <SheetDescription>{t.name} · added by hand by {maker}</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
            <RadioGroup
              value={picked}
              onValueChange={(v) => setPicked(v as ShareScope)}
              className="gap-[var(--space-3)]"
            >
              {scopes.map(([v, label, hint]) => (
                <div key={v} className="flex items-start gap-[var(--space-3)]">
                  <RadioGroupItem value={v} id={`scope-${v}`} className="mt-px" />
                  <Label htmlFor={`scope-${v}`} className="flex flex-col items-start gap-0.5">
                    <span className="type-data-strong">{label}</span>
                    <span className="type-meta">{hint}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <div className="mt-[var(--space-4)] space-y-[var(--space-2)] border-t border-hairline pt-[var(--space-4)] type-meta">
              <p>Private when created. Sharing is an explicit action.</p>
              <p>
                {t.by === "user"
                  ? `Your team sees it at once; the whole agency waits for ${people.owner}, and it goes out with your name kept.`
                  : "Your team and the whole agency see it at once: you are the one who would release it."}
              </p>
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
