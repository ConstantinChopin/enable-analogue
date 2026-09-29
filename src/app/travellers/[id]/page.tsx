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
 * Chapters, in order (S. Marchetti): what argues with their trips (when anything does) ·
 * Preferences (attributed rows; the single-source one asks to be confirmed) ·
 * Suggestions (labelled, outside the preferences until confirmed or discarded) ·
 * Where these come from (quiet) · Departure checklist · Travel profiles · Trips ·
 * Financials (entitlement-gated, absent otherwise).
 *
 * Who reaches it (docs/rebuild/05-two-roles.md, VIS-098). The seeded travellers are
 * R. Devane's. The owner, M. Keller, reaches one only when R. Devane shares it with
 * her (the store's `sharedWithOwner`): the personal layer is the advisor's, inside an
 * agency or not, and there is no policy access. Unshared, the profile is absent — not
 * masked — and the only thing on the page is "Request access from R. Devane" (a
 * secondary; it notifies R. Devane and grants nothing). At name and contact only: name
 * and contact. At the full profile: the profile.
 *
 * 2026-09-28 (UX sweep FB-02, FB-07, COL-10, COL-12, n-pref coherence; VIS-097 to VIS-101):
 *   - The shortlist conflict that sat on S. Marchetti's page was not hers: Hôtel Verlaine
 *     is on L. Grandin's Paris trip. Every profile now shows what argues with its own
 *     trips, one item per property on a trip (src/lib/trip-checks.ts `attentionFor`): a
 *     closed record is a Blocker whose one act is to take it off (Undo in the toast); a
 *     taste is a Warning with Find another and Keep it, and Keep is recorded in the store
 *     with who and when, shown where the warning was. The loop links ("swap the
 *     property" to a board that linked back) are gone.
 *   - One sharing sheet (VIS-101), with the traveller's own choices: Only me · M. Keller,
 *     the full profile · M. Keller, name and contact only. The toast carries Undo.
 *   - A trip in Trips opens its page.
 *
 * A traveller added by hand (U24) renders what its maker entered: name, email, and her
 * note, attributed to her and dated today. It is shared with an audience (Only me · the
 * Paris desk · the whole agency, after the owner's release). Anyone it has not reached
 * gets the absent page.
 */
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useDemo, canViewCommissions, sharedWithOwner, type CreatedTraveller, type DemoState, type ShareScope,
} from "@/lib/store";
import { traveller, travellerCards, people, personName, type TravellerCard } from "@/data/seed";
import { preferencesOf } from "@/data/trip-lines";
import {
  travellerShareOf, travellerShareWords, travellerShareOptions, describeTravellerShare, createdShareWords,
  tripsOfTraveller, readinessOf, attentionFor, takeOff, tasteKey, type TravellerTier,
} from "@/lib/trip-checks";
import { Page, PageHeader } from "@/components/layouts";
import { NewTripButton } from "@/components/new-trip";
import { ShareSheet } from "@/components/share-sheet";
import {
  Chip, DataList, Section, SeverityBanner, SourceTag, SchematicBadge, SchematicAction,
  ConfidenceMeter, Rows, Row, RowStack, Blocker, Warning, Done,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Clock, Lock, Share2 } from "lucide-react";

/* ── who can see it, on a chip, in the sheet's words ── */
function ShareChip({ text, shared, waiting }: { text: string; shared: boolean; waiting?: boolean }) {
  const Icon = waiting ? Clock : shared ? Share2 : Lock;
  return <Chip tone={shared && !waiting ? "primary" : "neutral"}><Icon className="size-[var(--icon-sm)]" aria-hidden /> {text}</Chip>;
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
        <p className="type-data text-label-secondary">
          Nothing at this address for you. What is not shared is absent, not locked.
        </p>
        <Button asChild variant="secondary" size="sm" className="mt-[var(--space-3)]">
          <Link href="/travellers">Back to travellers <ArrowRight aria-hidden /></Link>
        </Button>
      </Section>
    </Page>
  );
}

/* ── an advisor's traveller the owner reached by name, not shared with her ──
   Nothing of the profile renders, not its name, not a locked row: only who holds it
   and the ask, which grants nothing by itself. */
function NotSharedWithYou({ travellerId }: { travellerId: string }) {
  const { s, d } = useDemo();
  const asked = s.accessRequests.some((r) => r.travellerId === travellerId && r.by === "owner");
  return (
    <Page width="wide">
      <PageHeader title="Not shared with you" />
      <Section>
        <div className="space-y-[var(--space-4)]">
          <p className="max-w-[62ch] type-data text-label-secondary">
            This traveller profile belongs to {people.advisor}, and it has not been shared with
            you. What is not shared is absent, and nothing here unlocks it.
          </p>
          {asked ? (
            <Done>Asked {people.advisor} · today. It opens only if {people.advisor} shares it with you.</Done>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => d({ type: "requestAccess", travellerId })}>
              Request access from {people.advisor}
            </Button>
          )}
        </div>
      </Section>
    </Page>
  );
}

/* ── what argues with this traveller's trips: one item per property on a trip ──────
   A closed record outranks a taste (VIS-099). The closure's one act is to take it off
   the trip (destructive, with Undo: NAV-09); a taste is kept or replaced, and keeping it
   is recorded in the store, shown where the warning was (FB-07). */
function OnTheirTrips({ id, name }: { id: string; name: string }) {
  const { s, d } = useDemo();
  const router = useRouter();
  const owner = s.role === "owner";
  const items = attentionFor(s, tripsOfTraveller(s, id, name));
  if (!items.length) return null;
  return (
    <div className="space-y-[var(--space-2)] pb-[var(--gap-2)]">
      {items.map((a) => a.kind === "block" ? (
        <Blocker
          key={a.line.id}
          title={`${a.name} is closed to bookings`}
          action={owner ? undefined : <Button variant="secondary" size="sm" onClick={() => takeOff(s, d, a.trip, a.line)}>Take it off the trip</Button>}
        >
          It is on <Link href={`/itineraries/${a.trip.id}?line=${a.line.id}`} className="underline decoration-hairline underline-offset-4 hover:decoration-ink">{a.trip.title}</Link>. {a.block!.text} <span className="type-meta">{a.block!.by}, {a.block!.openedAt}</span>
        </Blocker>
      ) : (
        <Warning
          key={a.line.id}
          title={`Against ${name}'s taste`}
          kept={a.kept}
          actions={owner ? undefined : (
            <>
              {s.lab
                ? <Button size="sm" variant="secondary" onClick={() => router.push(`/itineraries/${a.trip.id}?line=${a.line.id}&act=find:${a.line.id}`)}>Find another</Button>
                : <SchematicAction>Find another</SchematicAction>}
              <Button size="sm" variant="secondary" onClick={() => d({ type: "decide", id: tasteKey(a.trip, a.line.productId!), what: "Kept despite the preference" })}>Keep it</Button>
            </>
          )}
        >
          {a.sentence} On <Link href={`/itineraries/${a.trip.id}?line=${a.line.id}`} className="underline decoration-hairline underline-offset-4 hover:decoration-ink">{a.trip.title}</Link>.
        </Warning>
      ))}
    </div>
  );
}

/* ── their trips, each opening its page (COL-12), with how ready it is ── */
function TripRows({ id, name, past = [] }: { id: string; name: string; past?: { title: string; dates: string; status: string }[] }) {
  const { s } = useDemo();
  const trips = tripsOfTraveller(s, id, name);
  if (!trips.length && !past.length) return <p className="type-data text-label-secondary">Nothing recorded yet.</p>;
  return (
    <Rows>
      {trips.map((t) => {
        const r = readinessOf(s, t);
        return (
          <Row key={t.id}>
            <Link href={`/itineraries/${t.id}`} className="row-primary type-data-strong underline decoration-hairline underline-offset-4 hover:decoration-ink">{t.title}</Link>
            <span className="row-meta tnum type-meta">{t.dates}</span>
            <span className="row-trailing">{r ? <Chip tone={r.tone}>{r.text}</Chip> : <Chip tone="neutral">{t.status}</Chip>}</span>
          </Row>
        );
      })}
      {past.map((t) => (
        <Row key={t.title}>
          <span className="row-primary type-data-strong">{t.title}</span>
          <span className="row-meta tnum type-meta">{t.dates}</span>
          <span className="row-trailing"><Chip tone="neutral">{t.status}</Chip></span>
        </Row>
      ))}
    </Rows>
  );
}

/* ═══════════════ S. Marchetti — the full anatomy ═══════════════ */
function MarchettiProfile() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s);
  const viaShare = s.role === "owner";
  const [shareOpen, setShareOpen] = useState(false);

  /* The owner's request to see this profile, if she made one. It lives in the store, so
     it survives a reload and reaches R. Devane as a notification. */
  const ownerAsked = s.accessRequests.some((r) => r.travellerId === traveller.id && r.by === "owner");
  /* Discarding a suggestion is a recorded choice (FB-07), not a state of this page. */
  const discarded = s.decisions[`discard:suggestion:${traveller.id}`];

  /* ── Owner + private: absent, not masked ── */
  if (viaShare && s.shareTier === "private") return <NotSharedWithYou travellerId={traveller.id} />;

  /* ── Owner + name and contact only ── */
  if (viaShare && s.shareTier === "basic") {
    return (
      <Page width="wide">
        <PageHeader title={traveller.name} />
        <Section title="Contact" chips={<Chip tone="primary">Name and contact only</Chip>}>
          <p className="type-data">
            {traveller.name} · {traveller.relationshipStatus} · contact on file
          </p>
          <p className="mt-[var(--space-3)] type-data text-label-secondary">
            Shared with you at name and contact only. Preferences, trips and spend stay with{" "}
            {people.advisor}, who can change the share.
          </p>
        </Section>
      </Page>
    );
  }

  /* ── R. Devane, who holds the profile, or the owner at the full profile ── */
  const done = traveller.departure.checklist.done;
  const of = traveller.departure.checklist.of;
  const share = travellerShareOf(s, { id: traveller.id, shared: null });

  const visibilityLine = viaShare
    ? "Shared with you: every field, the sensitive ones included. You can edit it; you cannot share it on or delete it."
    : s.shareTier === "private"
      ? `Only you. Nobody else at the agency can read this profile, ${people.owner} included.`
      : s.shareTier === "full"
        ? `${people.owner} reads the full profile. She can edit it; she cannot share it on or delete it.`
        : `${people.owner} sees the name and contact only.`;

  const singleSource = traveller.preferences.filter((p) => p.sources < 2).length;
  const past = traveller.trips.filter((t) => !t.id);

  return (
    <Page width="wide">
      <PageHeader
        title={traveller.name}
        actions={<NewTripButton travellerId={traveller.id} label="Start a trip" />}
      >
        <p className="mt-[var(--space-2)] type-meta">
          {traveller.relationshipStatus} · departs in {traveller.departure.inDays} days · {traveller.preferences.length} preferences, each
          attributed to a source and a date
        </p>
      </PageHeader>

      <div className="doc-layout">
        {/* ── the body: chapters at column width ── */}
        <div className="min-w-0">
          <OnTheirTrips id={traveller.id} name={traveller.name} />

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
                            <Chip tone="neutral">confirmed · {people.advisor} · today</Chip>
                          ) : asks ? (
                            <>
                              <Chip tone="warn">1 source</Chip>
                              <Button variant="tertiary" size="sm" onClick={() => d({ type: "confirmPref" })}>Confirm this</Button>
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
                !discarded &&
                traveller.suggestions.map((sg) => (
                  <RowStack
                    key={sg.id}
                    head={
                      <>
                        <span className="row-primary type-data-strong">{sg.text}</span>
                        <span className="row-trailing flex items-center gap-[var(--space-2)]">
                          <Chip tone="neutral">confirmed · {people.advisor} · today</Chip>
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
                {discarded ? (
                  <Done>Discarded · {personName[discarded.by]}, {discarded.at.slice(0, 6)}</Done>
                ) : s.prefConfirmed ? (
                  <Done>Confirmed and moved into Preferences · {people.advisor}</Done>
                ) : (
                  <>
                    <p className="type-data"><span className="italic">{sg.text}</span> <span className="type-meta">· {sg.basis}</span></p>
                    <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-2)]">
                      <Button variant="tertiary" size="sm" onClick={() => d({ type: "decide", id: `discard:suggestion:${traveller.id}`, what: "Discarded the suggestion" })}>
                        Discard
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => d({ type: "confirmPref" })}>
                        Confirm as preference
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
              <span className="tnum">{singleSource}</span> of these rest on a single source, and each asks for a second.
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
                      <Chip tone="neutral">{pending ? "pending" : "done"}</Chip>
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

          {/* Trips — each opens its page (COL-12). */}
          <Section title="Trips" deep>
            <TripRows id={traveller.id} name={traveller.name} past={past} />
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
                {traveller.financials.source}. Figures follow TripSuite, which stays
                authoritative for money, and carry its sync time.
              </p>
            </Section>
          )}
        </div>

        {/* ── the tool that follows you: who can see this, and the one action ── */}
        <aside className="doc-rail" data-rail-label="Sharing">
          <Section variant="tool" follows title="Sharing">
            <div className="flex flex-wrap items-center gap-[var(--space-2)]">
              <ShareChip text={travellerShareWords(share, s.role)} shared={share.tier !== "private"} />
            </div>
            {/* A request from the owner waits here, where the act that answers it lives. */}
            {!viaShare && ownerAsked && s.shareTier === "private" && (
              <SeverityBanner severity="Info" className="mt-[var(--space-3)]">
                <b>{people.owner} asked to see this profile</b> · today. Sharing answers it.
              </SeverityBanner>
            )}
            <p className="mt-[var(--space-3)] type-data text-label-secondary">{visibilityLine}</p>
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
                <span className="row-primary">Last contact</span>
                <span className="row-trailing text-label-secondary">{travellerCards.find((c) => c.id === traveller.id)?.lastContact ?? "—"}</span>
              </Row>
            </Rows>
            {viaShare ? (
              <p className="mt-[var(--space-4)] type-meta">
                Shared with you by {people.advisor}. Only {people.advisor} can change who sees it.
              </p>
            ) : (
              <div className="mt-[var(--space-4)]">
                <Button className="w-full" onClick={() => setShareOpen(true)}>
                  {s.shareTier === "private" ? `Share with ${people.owner}` : "Change sharing"}
                </Button>
              </div>
            )}
          </Section>
        </aside>
      </div>

      {/* One sharing sheet (VIS-101): a traveller is shared with a person. */}
      {!viaShare && (
        <ShareSheet<TravellerTier>
          open={shareOpen}
          onOpenChange={setShareOpen}
          what={traveller.name}
          current={s.shareTier}
          options={travellerShareOptions}
          describe={(v) => describeTravellerShare(traveller.name, v)}
          onShare={(v) => d({ type: "share", tier: v })}
          extra={<p className="type-meta">Spend stays behind the commission entitlement, whatever you choose.</p>}
        />
      )}
    </Page>
  );
}

/* ═══════════════ Every other traveller — a real profile, not a stub ═══════════════ */
function GenericProfile({ id }: { id: string }) {
  const { s } = useDemo();
  const card: TravellerCard | undefined = travellerCards.find((c) => c.id === id);

  if (!card) return <NotOnYourList />;

  /* The owner reaches R. Devane's traveller only once it is shared with her: the store's
     one rule (VIS-098), the same one the list and Itineraries use. */
  const viaShare = s.role === "owner";
  if (viaShare && !sharedWithOwner(s, card.name)) return <NotSharedWithYou travellerId={card.id} />;

  const share = travellerShareOf(s, card);
  const prefs = preferencesOf[card.name] ?? [];

  return (
    <Page width="wide">
      <PageHeader
        title={card.name}
        actions={s.role === "user" ? <NewTripButton travellerId={card.id} label="Start a trip" /> : undefined}
      >
        <p className="mt-[var(--space-2)] type-meta">
          {card.relationshipStatus}
          {card.departsInDays !== null && <> · departs in <span className="tnum">{card.departsInDays}</span> days</>}
        </p>
      </PageHeader>

      <div className="doc-layout">
        <div className="min-w-0">
          <OnTheirTrips id={card.id} name={card.name} />

          <Section title="At a glance">
            <DataList
              rows={[
                { label: "Relationship", value: card.relationshipStatus },
                { label: "Travel profiles", value: <span className="tnum">{card.profiles}</span> },
                { label: "Preferences", value: <span className="tnum">{card.preferences}</span> },
                { label: "Last contact", value: card.lastContact ?? null },
              ]}
            />
          </Section>

          <Section title="Trips" deep>
            <TripRows id={card.id} name={card.name} />
          </Section>

          {/* Their preferences, where the profile holds them all; otherwise the count. */}
          {prefs.length > 0 && prefs.length === card.preferences ? (
            <Section title="Preferences" deep chips={<Chip tone="neutral">every one attributed</Chip>}>
              <Rows>
                {prefs.map((p) => (
                  <RowStack
                    key={p.text}
                    head={
                      <>
                        <span className="row-primary type-data-strong">{p.text}</span>
                        <span className="row-trailing"><Chip tone="neutral" className="tnum">{p.sources ?? 1} {(p.sources ?? 1) === 1 ? "source" : "sources"}</Chip></span>
                      </>
                    }
                  >
                    <SourceTag kind="manual" label={p.source} />
                  </RowStack>
                ))}
              </Rows>
            </Section>
          ) : (
            <Section title="Intelligence" quiet deep chips={<SchematicBadge />}>
              <p className="max-w-[60ch] type-data text-label-secondary">
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
          )}
        </div>

        {/* The tool that follows you: who can see it, in the sheet's words. Changing it
            waits on a per-traveller share in the store, so the act is drawn, not wired. */}
        <aside className="doc-rail" data-rail-label="Sharing">
          <Section variant="tool" follows title="Sharing">
            <div className="flex flex-wrap items-center gap-[var(--space-2)]">
              <ShareChip text={travellerShareWords(share, s.role)} shared={share.tier !== "private"} />
            </div>
            <p className="mt-[var(--space-3)] type-data text-label-secondary">
              {viaShare
                ? `Shared with you by ${people.advisor}. Only ${people.advisor} can change who sees it.`
                : share.tier === "private"
                  ? "Only you. Nobody else at the agency can read this profile."
                  : `${share.with} reads the full profile. They can edit it; they cannot share it on or delete it.`}
            </p>
            <Rows className="mt-[var(--space-3)]">
              <Row>
                <span className="row-primary">Advisor</span>
                <span className="row-trailing text-label-secondary">{people.advisor}</span>
              </Row>
            </Rows>
            {!viaShare && (
              <div className="mt-[var(--space-4)]">
                <SchematicAction className="w-full justify-center">{share.tier === "private" ? "Share" : "Change sharing"}</SchematicAction>
              </div>
            )}
          </Section>
        </aside>
      </div>
    </Page>
  );
}

/* ═══════════════ A traveller added by hand (U24) ═══════════════
   Everything created starts private to its maker. It reaches the Paris desk the moment
   she shares it; it reaches the whole agency when the owner releases it from the publish
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

  const reach = reachOfCreated(t, s);
  if (!reach) return <NotOnYourList />;

  const mine = reach === "maker";
  const maker = personName[t.by];
  const w = createdShareWords(t, s);
  const decided = s.released[`trv-${t.id}`];

  const visibilityLine =
    t.share === "private"
      ? `Only you. Nobody else at the agency can read this profile${t.by === "user" ? `, ${people.owner} included` : ""}.`
      : w.waiting
        ? mine
          ? `In ${people.owner}’s publish queue. It reaches the whole agency when she releases it; until then only you see it.`
          : `${maker} shared this profile with the whole agency. It waits for your release in the publish queue.`
        : decided?.outcome === "returned" && t.share === "agency"
          ? `${people.owner} returned it${decided.note ? `: “${decided.note}”` : ""}. It has not reached the whole agency.`
          : t.share === "team"
            ? mine ? "The Paris desk reads it: 6 advisors." : `${maker} shared this profile with the Paris desk.`
            : mine ? "Every advisor in the agency reads it." : `${maker} shared this profile with the whole agency.`;

  return (
    <Page width="wide">
      <PageHeader title={t.name}>
        <p className="mt-[var(--space-2)] type-meta">Added by hand by {maker} · today</p>
      </PageHeader>

      <div className="doc-layout">
        <div className="min-w-0">
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
                <RowStack head={<span className="row-primary type-data">{t.note}</span>}>
                  <SourceTag kind="manual" label={`note, ${maker} · today`} />
                </RowStack>
              </Rows>
            ) : (
              <p className="type-data text-label-secondary">Nothing noted yet.</p>
            )}
            <p className="mt-[var(--space-3)] max-w-[62ch] type-meta">
              Kept as {maker} wrote it, with her name and the date. Nothing becomes a preference
              until a source confirms it.
            </p>
          </Section>

          <Section title="Trips" deep>
            <TripRows id={t.id} name={t.name} />
          </Section>
        </div>

        {/* ── the tool that follows you: who can see this, and the one action ── */}
        <aside className="doc-rail" data-rail-label="Sharing">
          <Section variant="tool" follows title="Sharing">
            <div className="flex flex-wrap items-center gap-[var(--space-2)]">
              <ShareChip text={w.text} shared={w.shared} waiting={w.waiting} />
            </div>
            <p className="mt-[var(--space-3)] type-data text-label-secondary">{visibilityLine}</p>
            <Rows className="mt-[var(--space-3)]">
              <Row>
                <span className="row-primary">Added by</span>
                <span className="row-trailing text-label-secondary">{maker} · today</span>
              </Row>
            </Rows>
            {mine ? (
              <div className="mt-[var(--space-4)]">
                <Button className="w-full" onClick={() => setShareOpen(true)}>
                  {t.share === "private" ? "Share this traveller" : "Change sharing"}
                </Button>
              </div>
            ) : reach === "pending" ? (
              <Button asChild variant="link" size="sm" className="mt-[var(--space-4)]">
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

      {/* One sharing sheet (VIS-101), with the audiences the store keeps for it. */}
      {mine && (
        <ShareSheet<ShareScope>
          open={shareOpen}
          onOpenChange={setShareOpen}
          what={t.name}
          current={t.share}
          onShare={(v) => d({ type: "shareCreated", kind: "traveller", id: t.id, scope: v })}
        />
      )}
    </Page>
  );
}
