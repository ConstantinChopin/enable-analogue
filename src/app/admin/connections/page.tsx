"use client";
/**
 * Connections — integration health as a first-class surface. The Ledger archetype
 * without a detail panel: every connector shows its last success, and a failed
 * source degrades answers visibly instead of silently.
 */
import { useState } from "react";
import { connectionHealth, connections } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, Section, NarrationNote, SchematicBadge } from "@/components/bits";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { KeyRound, Plus, RefreshCw } from "lucide-react";

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

export default function Connections() {
  const [addOpen, setAddOpen] = useState(false);
  const [connector, setConnector] = useState<"mcp" | "self">("mcp");
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
        <p className="mt-2 max-w-[62ch] type-data text-muted-foreground">
          A source needs attention when it is not connected — expired credentials and a sync
          running behind both degrade an answer.
        </p>
      </PageHeader>

      <NarrationNote>
        Integration health is a surface, not a log line. A failed source degrades answers visibly,
        which is the difference between a system you can trust and one you have to second-guess.
      </NarrationNote>

      <Section flush className="mt-4" bodyClassName="p-0">
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

      {/* Add connection — schematic */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Add connection <SchematicBadge />
            </SheetTitle>
            <SheetDescription>Connector posture is MCP-first.</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <RadioGroup
              value={connector}
              onValueChange={(v) => setConnector(v as "mcp" | "self")}
              className="gap-3"
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="mcp" id="conn-mcp" className="mt-1" />
                <Label htmlFor="conn-mcp" className="flex flex-col items-start gap-1 font-normal">
                  <span className="type-data font-semibold">MCP upstream</span>
                  <span className="type-meta">
                    Consume the source&rsquo;s own MCP server where one exists.
                  </span>
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <RadioGroupItem value="self" id="conn-self" className="mt-1" />
                <Label htmlFor="conn-self" className="flex flex-col items-start gap-1 font-normal">
                  <span className="type-data font-semibold">Self-hosted connector</span>
                  <span className="type-meta">Fallback where no upstream MCP exists.</span>
                </Label>
              </div>
            </RadioGroup>
            <p className="mt-4 border-t border-border pt-4 type-meta">
              Scoped credentials, a sync cadence, and read-only where the source system is ground
              truth — the booking system stays authoritative for money.
            </p>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Continue
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Page>
  );
}
