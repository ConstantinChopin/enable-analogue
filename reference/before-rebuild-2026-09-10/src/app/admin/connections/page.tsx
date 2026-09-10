"use client";
/**
 * Connections — integration health as a first-class surface. The Ledger archetype
 * without a detail panel: every connector shows its last success, and a failed
 * source degrades answers visibly instead of silently.
 */
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { connectionHealth, connections } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, Section, NarrationNote } from "@/components/bits";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { KeyRound, Plus, RefreshCw } from "lucide-react";
import { AddConnection } from "./add-connection";

function StateChip({ state }: { state: (typeof connections)[number]["state"] }) {
  if (state === "ok") return <Chip tone="ok">connected</Chip>;
  /* `syncing` is counted in "need attention", so it is marked as one — a neutral chip
     beside a header that counts it read as a disagreement on the same screen. */
  if (state === "syncing")
    return (
      <Chip tone="warn">
        <RefreshCw className="size-3" aria-hidden /> syncing
      </Chip>
    );
  return (
    <Chip tone="crit">
      <KeyRound className="size-3" aria-hidden /> credentials expired
    </Chip>
  );
}

/* `?add=1` opens the new-connection flow on arrival, so a button labelled "New
   connection" on another surface can start the flow rather than land on a list of the
   ones that already exist. The flow keeps one owner: this page. The same pattern the
   record uses for `?compose=notice`. */
export default function ConnectionsPage() {
  return (
    <Suspense fallback={null}>
      <Connections />
    </Suspense>
  );
}

function Connections() {
  const wantsAdd = useSearchParams()?.get("add") === "1";
  const [addOpen, setAddOpen] = useState(wantsAdd);

  const [reconnect, setReconnect] = useState<string | null>(null);
  const [reconnectSent, setReconnectSent] = useState(false);

  /* The count comes from the seed's one rule (anything not `ok`), so this header,
     /settings and the lead briefing cannot disagree about the same number. */
  const { sources, needAttention, label } = connectionHealth;

  return (
    <Page width="wide">
      <PageHeader
        title={
          <>
            Connections
            <Chip tone={needAttention > 0 ? "crit" : "neutral"}>
              <span className="tnum">{sources}</span> sources
              {needAttention > 0 ? ` · ${label}` : ""}
            </Chip>
          </>
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-3.5" aria-hidden /> Add connection
          </Button>
        }
      >
        {/* No definition of "needs attention" here. The rows say which sources are
            disconnected and why, and each one carries its own state — a page that opens
            by defining its own terms is writing documentation, not showing a list. */}
      </PageHeader>

      <NarrationNote>
        Integration health is a surface, not a log line. A failed source degrades answers visibly,
        which is the difference between a system you can trust and one you have to second-guess.
      </NarrationNote>

      <Section variant="list" className="mt-4">
        <div className="row-grid px-4 type-micro uppercase tracking-widest text-muted-foreground">
          <span className="row-primary">Source</span>
          <span className="row-meta">Last success</span>
          <span className="row-trailing">State</span>
        </div>
        <ul>
          {connections.map((c) => (
            <li key={c.name} className="row-grid border-t border-border px-4">
              <span className="row-primary">
                <span className="block truncate type-data-strong">{c.name}</span>
                <span className="block truncate type-meta">{c.posture}</span>
              </span>
              <span className="row-meta tnum type-meta">{c.lastSuccess}</span>
              <span className="row-trailing flex items-center gap-2">
                <StateChip state={c.state} />
                {/* A health surface where the broken thing has no fix is a report, not a
                    console. Reconnecting is credential work that happens at the source,
                    so the control opens that — it does not pretend to repair anything. */}
                {c.state === "credentials" && (
                  <Button size="sm" variant="outline" onClick={() => setReconnect(c.name)}>
                    Reconnect
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* The closing essay is gone. It restated the subtitle's claim in the same
          viewport, and what it described — a failed source producing a visible gap
          note rather than a confident answer — is shown on the answer itself. */}

      {/* Reconnect — the fix for the one broken row */}
      <Sheet open={!!reconnect} onOpenChange={(o) => { if (!o) { setReconnect(null); setReconnectSent(false); } }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Reconnect {reconnect}</SheetTitle>
            <SheetDescription>
              Last successful sync 24 Aug. Credentials expired; the source has not been reachable
              since.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="rounded-lg border border-border p-3">
              <div className="type-data-strong">While this source is down</div>
              <p className="mt-1 type-meta">
                Answers exclude it and carry a gap note naming the date. Records confirmed before
                24 Aug still answer, with their own provenance and their own date.
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="type-data-strong">What reconnecting needs</div>
              <p className="mt-1 type-meta">
                A named person re-authorises at the partner portal. Enable never stores the
                credential — it holds a scoped token, which is what expired.
              </p>
            </div>
            {reconnectSent && (
              <p className="rounded-lg border border-ok/40 bg-ok/10 p-3 type-meta">
                Re-authorisation requested from A. Blanc · logged today. The row stays flagged until
                a sync succeeds.
              </p>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setReconnect(null)}>Close</Button>
            <Button disabled={reconnectSent} onClick={() => setReconnectSent(true)}>
              Request re-authorisation
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AddConnection open={addOpen} onOpenChange={setAddOpen} />
    </Page>
  );
}
