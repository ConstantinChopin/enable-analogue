"use client";
/** Traveller profile — Journey F. Attributed preferences, tiered sharing, gated intelligence. */
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDemo, canViewCommissions } from "@/lib/store";
import { traveller, shortlistConflict, people } from "@/data/seed";
import { Chip, Section, PageHeader, SeverityBanner, NarrationNote, ConfirmBanner, SourceTag, SchematicBadge } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, CircleDashed, Lock, Share2, Sparkles, Users } from "lucide-react";

const TABS = ["Overview", "Journeys", "Intelligence", "Communications", "Financials"] as const;

export default function TravellerProfile() {
  const { id } = useParams<{ id: string }>();
  const { s, d } = useDemo();
  const money = canViewCommissions(s.persona);
  const isColleague = s.persona === "colleague";

  const [shareOpen, setShareOpen] = useState(false);
  const [pickedTier, setPickedTier] = useState<typeof s.shareTier>(s.shareTier);
  const [shareBanner, setShareBanner] = useState(false);
  const [proceeded, setProceeded] = useState(false);
  const [suggestion, setSuggestion] = useState<"pending" | "discarded">("pending");
  const [requested, setRequested] = useState(false);

  /* ── Minimal page for any other id ── */
  if (id !== traveller.id) {
    return (
      <div className="mx-auto max-w-[980px] px-6 py-6">
        <PageHeader crumb="Travellers" title="Traveller" />
        <Section>
          <p className="text-[13px] text-muted-foreground">Nothing at this address for your permission path. What is not shared is absent, not locked.</p>
        </Section>
      </div>
    );
  }

  /* ── Colleague + private: absent, not masked ── */
  if (isColleague && s.shareTier === "private") {
    return (
      <div className="mx-auto max-w-[980px] px-6 py-6">
        <PageHeader crumb="Travellers" title="Travellers" />
        {requested && <div className="mb-3"><ConfirmBanner show>Request sent to {people.advisor} → appears on {people.advisor}&apos;s briefing as a request. Access arrives only if they share.</ConfirmBanner></div>}
        <Section>
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Users className="size-6 text-muted-foreground" aria-hidden />
            <div className="text-[14px] font-medium">No travellers shared with you</div>
            <p className="max-w-[420px] text-[12.5px] text-muted-foreground">An unshared profile is invisible — there is nothing here to unlock.</p>
            {!requested && <Button variant="outline" size="sm" className="mt-1" onClick={() => setRequested(true)}>Request access from the owner</Button>}
          </div>
        </Section>
      </div>
    );
  }

  /* ── Colleague + basic: name + contact only ── */
  if (isColleague && s.shareTier === "basic") {
    return (
      <div className="mx-auto max-w-[980px] px-6 py-6">
        <PageHeader crumb={`Travellers / ${traveller.name}`} title={<>{traveller.name} <Chip tone="primary">Collaborator Basic</Chip></>} />
        <Section title="Contact">
          <p className="text-[13.5px]">{traveller.name} · {traveller.relationshipStatus} · contact on file</p>
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            Name and contact only at this tier. Preferences, journeys, intelligence, and spend fields are absent — not masked. The share is explicit, attributed, and revocable by {people.advisor}.
          </p>
        </Section>
      </div>
    );
  }

  /* ── Owner (advisor/lead) or colleague + full ── */
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
    <div className="mx-auto max-w-[1180px] px-6 py-6">
      <PageHeader
        crumb={`Travellers / ${traveller.name}`}
        title={<>{traveller.name} <Chip tone="warn">departs in {traveller.departure.inDays} days</Chip></>}
        right={!isColleague ? (
          <Button variant="outline" size="sm" onClick={() => { setPickedTier(s.shareTier); setShareOpen(true); }}>
            <Share2 className="size-3.5" /> Sharing
          </Button>
        ) : (
          <Chip tone="primary">Collaborator Full</Chip>
        )}
      />

      <NarrationNote>
        The sharing model is a three-stage documented iteration: tiered sharing called required, all-or-nothing shipped for simplicity with a revisit trigger, and the trigger fired — Collaborator Full / Basic is the schema&apos;s answer.
      </NarrationNote>

      {shareBanner && (
        <div className="mt-3">
          <ConfirmBanner show>
            {s.shareTier === "private"
              ? "Sharing withdrawn — the profile is private to you again. The audit records the shared interval."
              : `Shared with ${people.colleague} at the ${s.shareTier === "full" ? "Collaborator Full" : "Collaborator Basic"} tier — explicit, attributed, revocable. Non-admin shares route through the suggestion/approval workflow.`}
          </ConfirmBanner>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-4">
          {/* Departure checklist */}
          <Section title={`${traveller.departure.trip} — departure checklist`} chips={<Chip tone="primary">{done}/{of}</Chip>}>
            <Progress value={(done / of) * 100} className="h-1.5" />
            <ul className="mt-3 grid gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-2">
              {traveller.departure.checklist.items.map((item) => {
                const pending = item.includes("pending");
                return (
                  <li key={item} className="flex items-center gap-1.5">
                    {pending
                      ? <CircleDashed className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      : <Check className="size-3.5 shrink-0 text-ok" aria-hidden />}
                    <span className={pending ? "text-muted-foreground" : undefined}>{item.replace(" ✓", "").replace(" — pending", "")}</span>
                    {pending && <Chip tone="neutral" className="ml-auto">pending</Chip>}
                  </li>
                );
              })}
            </ul>
          </Section>

          {/* Tabs — Intelligence is the built tab; the rest are disabled in this build */}
          <div role="tablist" aria-label="Profile sections" className="flex flex-wrap items-center gap-1 border-b border-border pb-px text-[13px]">
            {TABS.map((t) => t === "Intelligence" ? (
              <button key={t} type="button" role="tab" aria-selected="true"
                className="rounded-t-md border border-b-0 border-border bg-card px-3 py-1.5 font-semibold">
                {t}
              </button>
            ) : (
              <button key={t} type="button" role="tab" aria-selected="false" disabled
                className="cursor-not-allowed px-3 py-1.5 text-muted-foreground/60">
                {t}
              </button>
            ))}
            <span className="ml-auto pb-1"><SchematicBadge /></span>
          </div>

          {/* Shortlist conflict — warn, not block */}
          <SeverityBanner severity="Important">
            <div className="flex flex-wrap items-center gap-2">
              <div>
                <b>Shortlist conflict.</b> {shortlistConflict.property} is {shortlistConflict.reason}.
              </div>
              <span className="ml-auto" />
              <Link href="/itineraries" className="text-[12.5px] font-medium text-primary underline underline-offset-2">swap the property</Link>
              {proceeded ? (
                <Chip tone="neutral">proceeded knowingly · {people.advisor} · recorded</Chip>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setProceeded(true)}>Proceed knowingly (recorded)</Button>
              )}
            </div>
          </SeverityBanner>

          {/* Preferences */}
          <Section title="Preferences" chips={<Chip tone="neutral">every one attributed</Chip>}>
            <div className="grid gap-3 sm:grid-cols-2">
              {traveller.preferences.map((p) => {
                const confirmed = p.id === "kaiseki" && s.prefConfirmed;
                return (
                  <div key={p.id} className="rounded-md border border-border bg-subtle px-3 py-2.5">
                    <div className="text-[13.5px] font-medium">{p.text}</div>
                    <div className="mt-1"><SourceTag kind={p.source.kind} label={`${p.source.label} · ${p.source.when}`} /></div>
                    <div className="mt-2 flex items-center gap-1.5 text-[12px]">
                      {confirmed ? (
                        <><span className="size-2 rounded-full bg-ok" aria-hidden /> confirmed · {people.advisor} · today</>
                      ) : p.confirmThis ? (
                        <>
                          <span className="size-2 rounded-full bg-warn" aria-hidden />
                          <button className="font-medium text-warn cursor-pointer hover:underline" onClick={() => d({ type: "confirmPref" })}>confirm this</button>
                          <span className="text-muted-foreground">· 1 source</span>
                        </>
                      ) : p.sources >= 2 ? (
                        <><span className="size-2 rounded-full bg-ok" aria-hidden /> {p.sources} sources</>
                      ) : (
                        <><span className="size-2 rounded-full border border-muted-foreground" aria-hidden /> 1 source</>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* A confirmed suggestion moves in here — a preference like any other, attributed */}
              {s.prefConfirmed && suggestion !== "discarded" && traveller.suggestions.map((sg) => (
                <div key={sg.id} className="rounded-md border border-ok/50 bg-subtle px-3 py-2.5">
                  <div className="text-[13.5px] font-medium">{sg.text}</div>
                  <div className="mt-1"><SourceTag kind="manual" label="confirmed from suggestion · today" /></div>
                  <div className="mt-2 flex items-center gap-1.5 text-[12px]">
                    <span className="size-2 rounded-full bg-ok" aria-hidden /> confirmed · {people.advisor} · today
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Suggestions */}
          <Section title={<span className="inline-flex items-center gap-1.5"><Sparkles className="size-3.5 text-primary" aria-hidden /> Suggestions</span>} chips={<Chip tone="primary">labeled — never applied silently</Chip>}>
            {traveller.suggestions.map((sg) => (
              <div key={sg.id} className="flex flex-wrap items-center gap-2 text-[13.5px]">
                {suggestion === "discarded" ? (
                  <span className="text-muted-foreground">Suggestion discarded — recorded, and the model learns nothing was true here.</span>
                ) : s.prefConfirmed ? (
                  <span className="text-muted-foreground">
                    Confirmed → moved into Preferences · attributed to {people.advisor}.
                  </span>
                ) : (
                  <>
                    <span className="italic">{sg.text}</span>
                    <span className="text-[11.5px] text-muted-foreground">{sg.basis}</span>
                    <span className="ml-auto" />
                    <Button variant="outline" size="sm" onClick={() => d({ type: "confirmPref" })}>Confirm → preference</Button>
                    <Button variant="ghost" size="sm" onClick={() => setSuggestion("discarded")}>Discard</Button>
                  </>
                )}
              </div>
            ))}
          </Section>

          {/* Profiles */}
          <Section title="Travel profiles">
            <div className="flex flex-wrap gap-1.5">
              {traveller.profiles.map((p) => (
                <Chip key={p.type} tone={p.isPrimary ? "primary" : "neutral"}>{p.type}{p.isPrimary ? " · primary" : ""}</Chip>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] text-muted-foreground">Six blocks per profile — preferences file into the profile they belong to.</p>
          </Section>

          {/* Trips */}
          <Section title="Trips">
            <ul className="divide-y divide-border text-[13.5px]">
              {traveller.trips.map((t) => (
                <li key={t.title} className="flex items-center gap-2 py-2">
                  <span className="font-medium">{t.title}</span>
                  <span className="text-muted-foreground">{t.dates}</span>
                  <Chip tone={t.status === "Planning" ? "primary" : "neutral"} className="ml-auto">{t.status}</Chip>
                </li>
              ))}
            </ul>
          </Section>

          {/* Financials — gated; absent for the colleague */}
          {money && (
            <Section title="Financials" chips={<SchematicBadge />}>
              <p className="text-[12.5px] text-muted-foreground">
                Lifetime spend and ADR render here — visible to owner + policy roles. Spend fields stay behind canViewCommissions at every tier.
              </p>
            </Section>
          )}
        </div>

        {/* ── Right rail ── */}
        <div className="space-y-4">
          <Section title="Where these come from">
            <ul className="text-[13px]">
              {traveller.signalsBySource.map(([label, n]) => (
                <li key={label} className="flex items-center justify-between py-1">
                  <span>{label}</span>
                  <span className="tnum text-muted-foreground">{n}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 border-t border-border pt-2 text-[13px]">
              <div className="flex items-center justify-between font-medium">
                <span>Signals held</span><span className="tnum">9</span>
              </div>
              <p className="mt-1.5 text-[12px] text-muted-foreground">The product extracts signals. It does not decide that a signal is true.</p>
            </div>
          </Section>

          <Section title="Visibility">
            <p className="flex gap-1.5 text-[12.5px] text-muted-foreground">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {visibilityLine}
            </p>
          </Section>

          <Section title="One source is a note">
            <p className="text-[12.5px] text-muted-foreground">
              Three of these nine signals rest on a single source. The product marks them and asks for a second before it treats any of them as a preference.
            </p>
          </Section>

          <Section title="Acuity" chips={<Chip tone="ok">{traveller.acuity.status}</Chip>}>
            <div className="flex items-baseline gap-2">
              <span className="text-[26px] font-semibold tnum">{traveller.acuity.score}</span>
              <span className="text-[12px] text-muted-foreground">last run {traveller.acuity.lastRun}</span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-muted-foreground">States: Not Run · Running · Complete · Locked — running is gated canRunAcuity.</p>
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
            <RadioGroup value={pickedTier} onValueChange={(v) => setPickedTier(v as typeof pickedTier)} className="gap-3">
              <div className="flex items-start gap-2.5">
                <RadioGroupItem value="private" id="tier-private" aria-labelledby="tier-private-label" className="mt-0.5" />
                <Label htmlFor="tier-private" className="flex flex-col items-start gap-0.5 font-normal">
                  <span id="tier-private-label" className="text-[13.5px] font-medium">Private to you <Chip tone="neutral" className="ml-1">personal</Chip></span>
                </Label>
              </div>
              <div className="flex items-start gap-2.5">
                <RadioGroupItem value="full" id="tier-full" aria-labelledby="tier-full-label" className="mt-0.5" />
                <Label htmlFor="tier-full" className="flex flex-col items-start gap-0.5 font-normal">
                  <span id="tier-full-label" className="text-[13.5px] font-medium">Collaborator — Full</span>
                  <span className="text-[12px] text-muted-foreground">All fields; can edit and run Acuity. Cannot re-share or delete.</span>
                </Label>
              </div>
              <div className="flex items-start gap-2.5">
                <RadioGroupItem value="basic" id="tier-basic" aria-labelledby="tier-basic-label" className="mt-0.5" />
                <Label htmlFor="tier-basic" className="flex flex-col items-start gap-0.5 font-normal">
                  <span id="tier-basic-label" className="text-[13.5px] font-medium">Collaborator — Basic</span>
                  <span className="text-[12px] text-muted-foreground">Name + contact only, for limited introductions.</span>
                </Label>
              </div>
            </RadioGroup>
            <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-[12px] text-muted-foreground">
              <p>Private by default. Sharing is an explicit action.</p>
              <p>Non-admin shares route through the suggestion/approval workflow.</p>
              <p>Spend fields stay behind canViewCommissions at every tier.</p>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={applyShare}>Apply sharing</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
