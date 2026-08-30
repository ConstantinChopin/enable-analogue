"use client";
/**
 * Traveller profile — the Document archetype (§7): main column plus a context rail.
 *
 * S. Marchetti carries the whole anatomy (departure checklist, profile tabs,
 * attributed preferences with the confirm promotion, suggestions, the shortlist
 * conflict, tiered sharing, Acuity, gated financials, trip history). Every other id
 * renders a real profile from its own card — never a stub.
 */
import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDemo, canViewCommissions } from "@/lib/store";
import {
  traveller, travellerCards, trips, shortlistConflict, people, type TravellerCard,
} from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import {
  Chip, Section, SeverityBanner, NarrationNote, ConfirmBanner, SourceTag, SchematicBadge,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRight, Check, CircleDashed, Lock, Share2, Sparkles, Users } from "lucide-react";

const TABS = ["Overview", "Journeys", "Intelligence", "Communications", "Financials"] as const;

export default function TravellerProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  if (id === traveller.id) return <MarchettiProfile />;
  return <GenericProfile id={id} />;
}

/* ═══════════════ S. Marchetti — the full anatomy ═══════════════ */
function MarchettiProfile() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s.role);
  const isColleague = s.role === "colleague";

  const [shareOpen, setShareOpen] = useState(false);
  const [pickedTier, setPickedTier] = useState<typeof s.shareTier>(s.shareTier);
  const [shareBanner, setShareBanner] = useState(false);
  const [proceeded, setProceeded] = useState(false);
  const [suggestion, setSuggestion] = useState<"pending" | "discarded">("pending");
  const [requested, setRequested] = useState(false);

  /* ── Colleague + private: absent, not masked ── */
  if (isColleague && s.shareTier === "private") {
    return (
      <Page width="wide">
        <PageHeader title="Travellers" />
        <div className="space-y-4">
          {requested && (
            <ConfirmBanner show>
              Request sent to {people.advisor} — it appears on their briefing as a request. Access
              arrives only if they share.
            </ConfirmBanner>
          )}
          <Section className="py-12 text-center">
            <Users className="mx-auto size-6 text-muted-foreground" aria-hidden />
            <p className="mt-3 t-title">No travellers shared with you</p>
            <p className="mx-auto mt-2 max-w-[46ch] t-meta">
              An unshared profile is invisible. There is nothing here to unlock.
            </p>
            {!requested && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setRequested(true)}>
                Request access from the owner
              </Button>
            )}
          </Section>
        </div>
      </Page>
    );
  }

  /* ── Colleague + basic: name + contact only ── */
  if (isColleague && s.shareTier === "basic") {
    return (
      <Page width="wide">
        <PageHeader
          title={
            <>
              {traveller.name}
              <Chip tone="primary">Collaborator Basic</Chip>
            </>
          }
        />
        <Section title="Contact">
          <p className="t-body">
            {traveller.name} · {traveller.relationshipStatus} · contact on file
          </p>
          <p className="mt-3 t-meta">
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
        ? `Shared with ${people.colleague} — Collaborator Full. All fields; can edit and run Acuity; cannot re-share or delete.`
        : `Shared with ${people.colleague} — Collaborator Basic. Name and contact only.`;

  function applyShare() {
    d({ type: "share", tier: pickedTier });
    setShareOpen(false);
    setShareBanner(true);
  }

  return (
    <Page width="wide">
      <PageHeader
        title={
          <>
            {traveller.name}
            <Chip tone="warn">departs in {traveller.departure.inDays} days</Chip>
          </>
        }
        actions={
          isColleague ? (
            <Chip tone="primary">Collaborator Full</Chip>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPickedTier(s.shareTier);
                setShareOpen(true);
              }}
            >
              <Share2 className="size-3.5" aria-hidden /> Sharing
            </Button>
          )
        }
      >
        <p className="mt-2 t-body text-muted-foreground">
          {traveller.relationshipStatus} · {traveller.preferences.length} preferences, each
          attributed to a source and a date
        </p>
      </PageHeader>

      <NarrationNote>
        The sharing model is a three-stage documented iteration: tiered sharing called required,
        all-or-nothing shipped for simplicity with a revisit trigger, and the trigger fired —
        Collaborator Full / Basic is the schema&rsquo;s answer.
      </NarrationNote>

      {shareBanner && (
        <div className="mt-4">
          <ConfirmBanner show>
            {s.shareTier === "private"
              ? "Sharing withdrawn — the profile is private to you again. The audit records the shared interval."
              : `Shared with ${people.colleague} at the ${
                  s.shareTier === "full" ? "Collaborator Full" : "Collaborator Basic"
                } tier — explicit, attributed, revocable. Non-admin shares route through the suggestion and approval workflow.`}
          </ConfirmBanner>
        </div>
      )}

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-4">
          {/* Departure checklist */}
          <Section
            title={`${traveller.departure.trip} — departure checklist`}
            chips={
              <Chip tone="primary">
                <span className="tnum">
                  {done}/{of}
                </span>
              </Chip>
            }
          >
            <Progress value={(done / of) * 100} className="h-1.5" />
            <ul className="mt-4 grid gap-x-4 gap-y-2 t-body sm:grid-cols-2">
              {traveller.departure.checklist.items.map((item) => {
                const pending = item.includes("pending");
                return (
                  <li key={item} className="flex items-center gap-2">
                    {pending ? (
                      <CircleDashed className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    ) : (
                      <Check className="size-3.5 shrink-0 text-ok" aria-hidden />
                    )}
                    <span className={pending ? "text-muted-foreground" : undefined}>
                      {item.replace(" — pending", "")}
                    </span>
                    {pending && (
                      <span className="ml-auto">
                        <Chip tone="neutral">pending</Chip>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>

          {/* Profile-type tabs — Intelligence is the built tab in this vintage */}
          <div
            role="tablist"
            aria-label="Profile sections"
            className="flex flex-wrap items-center gap-1 border-b border-border pb-px t-body"
          >
            {TABS.map((t) =>
              t === "Intelligence" ? (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected="true"
                  className="rounded-t-md border border-b-0 border-border bg-card px-3 py-2 font-semibold"
                >
                  {t}
                </button>
              ) : (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected="false"
                  disabled
                  className="cursor-not-allowed px-3 py-2 text-muted-foreground/60"
                >
                  {t}
                </button>
              ),
            )}
            <span className="ml-auto pb-1">
              <SchematicBadge />
            </span>
          </div>

          {/* Shortlist conflict — warn, not block */}
          <SeverityBanner severity="Important">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0">
                <b>Shortlist conflict.</b> {shortlistConflict.property} is {shortlistConflict.reason}.
              </span>
              <span className="ml-auto" />
              <Link
                href="/itineraries"
                className="type-data-strong text-primary underline underline-offset-2"
              >
                swap the property
              </Link>
              {proceeded ? (
                <Chip tone="neutral">proceeded knowingly · {people.advisor} · recorded</Chip>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setProceeded(true)}>
                  Proceed knowingly (recorded)
                </Button>
              )}
            </div>
          </SeverityBanner>

          {/* Preferences */}
          <Section title="Preferences" chips={<Chip tone="neutral">every one attributed</Chip>}>
            <div className="grid gap-3 sm:grid-cols-2">
              {traveller.preferences.map((p) => {
                const confirmed = p.id === "kaiseki" && s.prefConfirmed;
                return (
                  <div key={p.id} className="rounded-md border border-border bg-subtle p-4">
                    <div className="t-body font-semibold">{p.text}</div>
                    <div className="mt-2">
                      <SourceTag kind={p.source.kind} label={`${p.source.label} · ${p.source.when}`} />
                    </div>
                    <div className="mt-2 flex items-center gap-2 t-meta">
                      {confirmed ? (
                        <>
                          <span className="size-2 rounded-full bg-ok" aria-hidden />
                          confirmed · {people.advisor} · today
                        </>
                      ) : "confirmThis" in p && p.confirmThis ? (
                        <>
                          <span className="size-2 rounded-full bg-warn" aria-hidden />
                          <button
                            type="button"
                            className="cursor-pointer font-medium text-warn hover:underline"
                            onClick={() => d({ type: "confirmPref" })}
                          >
                            confirm this
                          </button>
                          <span>· 1 source</span>
                        </>
                      ) : p.sources >= 2 ? (
                        <>
                          <span className="size-2 rounded-full bg-ok" aria-hidden />
                          <span className="tnum">{p.sources}</span> sources
                        </>
                      ) : (
                        <>
                          <span
                            className="size-2 rounded-full border border-muted-foreground"
                            aria-hidden
                          />
                          1 source
                        </>
                      )}
                      <span className="ml-auto tnum">
                        confidence {p.confidence.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* A confirmed suggestion moves in here — a preference like any other, attributed. */}
              {s.prefConfirmed &&
                suggestion !== "discarded" &&
                traveller.suggestions.map((sg) => (
                  <div key={sg.id} className="rounded-md border border-ok/50 bg-subtle p-4">
                    <div className="t-body font-semibold">{sg.text}</div>
                    <div className="mt-2">
                      <SourceTag kind="manual" label="confirmed from suggestion · today" />
                    </div>
                    <div className="mt-2 flex items-center gap-2 t-meta">
                      <span className="size-2 rounded-full bg-ok" aria-hidden />
                      confirmed · {people.advisor} · today
                    </div>
                  </div>
                ))}
            </div>
          </Section>

          {/* Suggestions */}
          <Section
            title={
              <span className="inline-flex items-center gap-2">
                <Sparkles className="size-3.5 text-primary" aria-hidden /> Suggestions
              </span>
            }
            chips={<Chip tone="primary">labelled — never applied silently</Chip>}
          >
            {traveller.suggestions.map((sg) => (
              <div key={sg.id} className="flex flex-wrap items-center gap-2 t-body">
                {suggestion === "discarded" ? (
                  <span className="text-muted-foreground">
                    Suggestion discarded — recorded, and the model learns nothing was true here.
                  </span>
                ) : s.prefConfirmed ? (
                  <span className="text-muted-foreground">
                    Confirmed and moved into Preferences · attributed to {people.advisor}.
                  </span>
                ) : (
                  <>
                    <span className="italic">{sg.text}</span>
                    <span className="t-meta">{sg.basis}</span>
                    <span className="ml-auto" />
                    <Button variant="outline" size="sm" onClick={() => d({ type: "confirmPref" })}>
                      Confirm as preference
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSuggestion("discarded")}>
                      Discard
                    </Button>
                  </>
                )}
              </div>
            ))}
          </Section>

          {/* Profiles */}
          <Section title="Travel profiles">
            <div className="flex flex-wrap gap-2">
              {traveller.profiles.map((p) => (
                <Chip key={p.type} tone={p.isPrimary ? "primary" : "neutral"}>
                  {p.type}
                  {p.isPrimary ? " · primary" : ""}
                </Chip>
              ))}
            </div>
            <p className="mt-3 t-meta">
              Six blocks per profile — a preference files into the profile it belongs to.
            </p>
          </Section>

          {/* Trips */}
          <Section flush title="Trips" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {traveller.trips.map((t) => (
                <li key={t.title} className="row-grid px-4">
                  <span className="row-primary type-data-strong">{t.title}</span>
                  <span className="row-meta tnum t-meta">{t.dates}</span>
                  <span className="row-trailing">
                    <Chip tone={t.status === "Planning" ? "primary" : "neutral"}>{t.status}</Chip>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Financials — gated; absent for the colleague, never masked */}
          {money && (
            <Section title="Financials" chips={<SchematicBadge />}>
              <p className="t-meta">
                Lifetime spend and average daily rate render here, for the owning advisor and the
                policy roles. Spend fields stay behind the commission entitlement at every sharing
                tier.
              </p>
            </Section>
          )}
        </div>

        {/* ── Context rail ── */}
        <div className="space-y-4">
          <Section
            flush
            bodyClassName="p-0"
            title="Where these come from"
            footer={<span className="t-meta">The product extracts signals. It does not decide that a signal is true.</span>}
          >
            <ul className="divide-y divide-border">
              {traveller.signalsBySource.map(([label, n]) => (
                <li key={label} className="row-grid px-4">
                  <span className="row-primary t-body">{label}</span>
                  <span className="row-trailing tnum t-meta">{n}</span>
                </li>
              ))}
              <li className="row-grid px-4">
                <span className="row-primary t-body font-semibold">Signals held</span>
                <span className="row-trailing tnum t-body font-semibold">9</span>
              </li>
            </ul>
          </Section>

          <Section title="Visibility">
            <p className="flex gap-2 t-meta">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {visibilityLine}
            </p>
          </Section>

          <Section title="One source is a note">
            <p className="t-meta">
              Three of these nine signals rest on a single source. The product marks them and asks
              for a second before it treats any of them as a preference.
            </p>
          </Section>

          <Section title="Acuity" chips={<Chip tone="ok">{traveller.acuity.status}</Chip>}>
            <div className="flex items-baseline gap-2">
              <span className="tnum t-display">{traveller.acuity.score}</span>
              <span className="t-meta">last run {traveller.acuity.lastRun}</span>
            </div>
            <p className="mt-2 t-meta">
              Four states — Not Run, Running, Complete, Locked. Running it is gated on the
              entitlement, not on the sharing tier.
            </p>
          </Section>
        </div>
      </div>

      {/* ── Sharing sheet ── */}
      <Sheet open={shareOpen} onOpenChange={setShareOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Who can see this profile</SheetTitle>
            <SheetDescription>Sharing with {people.colleague}</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <RadioGroup
              value={pickedTier}
              onValueChange={(v) => setPickedTier(v as typeof pickedTier)}
              className="gap-3"
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="private" id="tier-private" className="mt-1" />
                <Label htmlFor="tier-private" className="flex flex-col items-start gap-1 font-normal">
                  <span className="t-body font-semibold">Private to you</span>
                  <span className="t-meta">Nobody else at the agency can read it.</span>
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <RadioGroupItem value="full" id="tier-full" className="mt-1" />
                <Label htmlFor="tier-full" className="flex flex-col items-start gap-1 font-normal">
                  <span className="t-body font-semibold">Collaborator — Full</span>
                  <span className="t-meta">
                    All fields; can edit and run Acuity. Cannot re-share or delete.
                  </span>
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <RadioGroupItem value="basic" id="tier-basic" className="mt-1" />
                <Label htmlFor="tier-basic" className="flex flex-col items-start gap-1 font-normal">
                  <span className="t-body font-semibold">Collaborator — Basic</span>
                  <span className="t-meta">Name and contact only, for a limited introduction.</span>
                </Label>
              </div>
            </RadioGroup>
            <div className="mt-4 space-y-2 border-t border-border pt-4 t-meta">
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
          <p className="t-body text-muted-foreground">
            Nothing at this address for your permission path. What is not shared is absent, not
            locked.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/travellers">
              Back to travellers <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </Section>
      </Page>
    );
  }

  /* A colleague reaches a profile only through a share, and only at the live tier. */
  const isColleague = s.role === "colleague";
  const reachable = !isColleague || (s.shareTier !== "private" && card.shared === people.colleague);
  if (!reachable) {
    return (
      <Page width="wide">
        <PageHeader title="Not shared with you" />
        <Section>
          <p className="t-body text-muted-foreground">
            This profile is private to its owning advisor. It is absent from your list, not locked
            inside it.
          </p>
        </Section>
      </Page>
    );
  }
  const basic = isColleague && s.shareTier === "basic";

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
        actions={
          card.shared ? (
            <Chip tone="primary">
              <Share2 className="size-3" aria-hidden /> shared with {card.shared}
            </Chip>
          ) : (
            <Chip tone="neutral">
              <Lock className="size-3" aria-hidden /> private to you
            </Chip>
          )
        }
      >
        <p className="mt-2 t-body text-muted-foreground">{card.relationshipStatus}</p>
      </PageHeader>

      {basic ? (
        <Section title="Contact">
          <p className="t-body">
            {card.name} · {card.relationshipStatus} · contact on file
          </p>
          <p className="mt-3 t-meta">
            Name and contact only at Collaborator Basic. Preferences, journeys, intelligence and
            spend fields are absent — not masked.
          </p>
        </Section>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <Section title="Next journey">
              {trip ? (
                <>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="t-title">{trip.title}</span>
                    <Chip tone={trip.status === "Booked" ? "ok" : "neutral"}>{trip.status}</Chip>
                  </div>
                  <p className="mt-2 t-body text-muted-foreground">
                    {trip.destinations.join(" · ")} · <span className="tnum">{trip.dates}</span> ·{" "}
                    <span className="tnum">{trip.nights}</span> nights
                  </p>
                  {trip.checklist && (
                    <div className="mt-4">
                      <Progress
                        value={(trip.checklist.done / trip.checklist.of) * 100}
                        className="h-1.5"
                      />
                      <p className="mt-2 t-meta">
                        Departure checklist{" "}
                        <span className="tnum">
                          {trip.checklist.done}/{trip.checklist.of}
                        </span>
                      </p>
                    </div>
                  )}
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link href="/itineraries">
                      Open the itinerary <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="t-body text-muted-foreground">No trip on file.</p>
              )}
            </Section>

            <Section flush title="All journeys" bodyClassName="p-0">
              <ul className="divide-y divide-border">
                {past.map((t) => (
                  <li key={t.id} className="row-grid px-4">
                    <span className="row-primary type-data-strong">{t.title}</span>
                    <span className="row-meta tnum t-meta">{t.dates}</span>
                    <span className="row-trailing">
                      <Chip tone={t.status === "Traveled" ? "neutral" : "primary"}>{t.status}</Chip>
                    </span>
                  </li>
                ))}
                {past.length === 0 && (
                  <li className="p-4 t-body text-muted-foreground">Nothing recorded yet.</li>
                )}
              </ul>
            </Section>

            <Section title="Intelligence" chips={<SchematicBadge />}>
              <p className="t-body text-muted-foreground">
                <span className="tnum">{card.preferences}</span> preferences sit on this profile,
                each one attributed to a source and a date, across{" "}
                <span className="tnum">{card.profiles}</span> travel{" "}
                {card.profiles === 1 ? "profile" : "profiles"}. The per-field anatomy is built on{" "}
                <Link
                  href={`/travellers/${traveller.id}`}
                  className="text-primary underline underline-offset-2"
                >
                  {traveller.name}
                </Link>{" "}
                in this vintage.
              </p>
            </Section>
          </div>

          <div className="space-y-4">
            <Section flush title="At a glance" bodyClassName="p-0">
              <ul className="divide-y divide-border">
                <li className="row-grid px-4">
                  <span className="row-primary t-body">Relationship</span>
                  <span className="row-trailing t-meta">{card.relationshipStatus}</span>
                </li>
                <li className="row-grid px-4">
                  <span className="row-primary t-body">Travel profiles</span>
                  <span className="row-trailing tnum t-meta">{card.profiles}</span>
                </li>
                <li className="row-grid px-4">
                  <span className="row-primary t-body">Preferences</span>
                  <span className="row-trailing tnum t-meta">{card.preferences}</span>
                </li>
                <li className="row-grid px-4">
                  <span className="row-primary t-body">Departs in</span>
                  <span className="row-trailing tnum t-meta">
                    {card.departsInDays === null ? "—" : `${card.departsInDays} days`}
                  </span>
                </li>
              </ul>
            </Section>

            <Section
              title="Acuity"
              chips={
                card.acuityScore === null ? (
                  <Chip tone="neutral">Not Run</Chip>
                ) : (
                  <Chip tone="ok">Complete</Chip>
                )
              }
            >
              {card.acuityScore === null ? (
                <p className="t-meta">
                  Acuity has not been run for this profile. The score is absent rather than
                  estimated.
                </p>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="tnum t-display">{card.acuityScore}</span>
                  <span className="t-meta">last complete run</span>
                </div>
              )}
            </Section>

            <Section title="Visibility">
              <p className="flex gap-2 t-meta">
                <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {card.shared
                  ? `Shared with ${card.shared} — Collaborator Full. Explicit, attributed, and revocable.`
                  : "Private to you. Nobody else at the agency can read this profile."}
              </p>
            </Section>
          </div>
        </div>
      )}
    </Page>
  );
}
