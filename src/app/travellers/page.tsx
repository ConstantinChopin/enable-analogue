"use client";
/** Travellers list — Journey F EP1. The scope-isolation proof: the colleague sees only what sharing grants. */
import { useState } from "react";
import Link from "next/link";
import { useDemo } from "@/lib/store";
import { traveller, people } from "@/data/seed";
import { Chip, Section, PageHeader, NarrationNote, ConfirmBanner } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Users, Lock, Share2 } from "lucide-react";

export default function Travellers() {
  const { s } = useDemo();
  const [requested, setRequested] = useState(false);
  const isColleague = s.persona === "colleague";

  const shareChip =
    s.shareTier === "private" ? (
      <Chip tone="neutral"><Lock className="size-3" aria-hidden /> private to you</Chip>
    ) : s.shareTier === "full" ? (
      <Chip tone="primary"><Share2 className="size-3" aria-hidden /> shared · Collaborator Full</Chip>
    ) : (
      <Chip tone="primary"><Share2 className="size-3" aria-hidden /> shared · Collaborator Basic</Chip>
    );

  /* ── Colleague: the list is scope-filtered. Unshared VICs are absent, not locked. ── */
  if (isColleague && s.shareTier === "private") {
    return (
      <div className="mx-auto max-w-[980px] px-6 py-6">
        <PageHeader crumb="Travellers" title="Travellers" />
        <NarrationNote>
          The second seeded account proving U2: an unshared VIC is invisible — there is no locked row, no masked card, nothing to know exists.
        </NarrationNote>
        {requested && <div className="mb-3"><ConfirmBanner show>Request sent to {people.advisor} → appears on {people.advisor}&apos;s briefing as a request. Access arrives only if they share.</ConfirmBanner></div>}
        <Section>
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Users className="size-6 text-muted-foreground" aria-hidden />
            <div className="text-[14px] font-medium">No travellers shared with you</div>
            <p className="max-w-[420px] text-[12.5px] text-muted-foreground">
              Traveller profiles are private to their owning advisor by default. What is not shared is absent, not locked.
            </p>
            {!requested && <Button variant="outline" size="sm" className="mt-1" onClick={() => setRequested(true)}>Request access from the owner</Button>}
          </div>
        </Section>
        <p className="mt-4 text-[12.5px] text-muted-foreground">Viewing as {people.colleague}: this list is scope-filtered. Only what is explicitly shared renders.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[980px] px-6 py-6">
      <PageHeader crumb="Travellers" title={<>Travellers <Chip tone="neutral">{isColleague ? "shared with you" : "your clients"}</Chip></>} />

      <NarrationNote>
        Ownership and sharing are the only two rules that differ from product records — everything else on a profile inherits the layered anatomy. This grid renders the sharing tier live.
      </NarrationNote>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* S. Marchetti */}
        <Section>
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-[12px] font-semibold text-primary">SM</span>
            <div className="min-w-0">
              <Link href={`/travellers/${traveller.id}`} className="text-[14.5px] font-semibold hover:text-primary">{traveller.name}</Link>
              <div className="text-[11.5px] text-muted-foreground">{traveller.relationshipStatus}</div>
            </div>
          </div>

          {isColleague && s.shareTier === "basic" ? (
            <>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Chip tone="primary">Collaborator Basic</Chip>
                <Chip tone="neutral">contact on file</Chip>
              </div>
              <p className="mt-2.5 text-[12px] text-muted-foreground">
                Name and contact only at this tier. Preferences, intelligence, and spend fields are absent — not masked.
              </p>
            </>
          ) : (
            <>
              <div className="mt-2.5 text-[13px]">
                {traveller.departure.trip} <span className="text-muted-foreground">· departs in {traveller.departure.inDays}d</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Chip tone="primary">checklist {traveller.departure.checklist.done}/{traveller.departure.checklist.of}</Chip>
                {shareChip}
                <Chip tone="ok">Acuity {traveller.acuity.score}</Chip>
              </div>
              <div className="mt-3 border-t border-border pt-2 text-[11.5px] text-muted-foreground">
                {traveller.preferences.length} preferences · every one attributed to a source and a date
              </div>
            </>
          )}
        </Section>

        {/* Second, minimal card */}
        {!isColleague && (
          <Section>
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-[12px] font-semibold text-muted-foreground">TO</span>
              <div>
                <div className="text-[14.5px] font-semibold">T. &amp; P. Osei</div>
                <div className="text-[11.5px] text-muted-foreground">Patagonia</div>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Chip tone="neutral"><Lock className="size-3" aria-hidden /> private to you</Chip>
            </div>
          </Section>
        )}
      </div>

      {isColleague && (
        <p className="mt-4 text-[12.5px] text-muted-foreground">
          Viewing as {people.colleague}: one profile is shared with you at the {s.shareTier === "basic" ? "Collaborator Basic" : "Collaborator Full"} tier. Everything else is absent.
        </p>
      )}
    </div>
  );
}
