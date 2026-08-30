"use client";
/**
 * Connections — integration health as a first-class surface. The Ledger archetype
 * without a detail panel: every connector shows its last success, and a failed
 * source degrades answers visibly instead of silently.
 */
import { useState } from "react";
import { connections } from "@/data/seed";
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
  if (state === "syncing")
    return (
      <Chip tone="neutral">
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

  const failing = connections.filter((c) => c.state === "credentials").length;

  return (
    <Page width="wide">
      <PageHeader
        title={
          <>
            Connections
            <Chip tone={failing > 0 ? "crit" : "neutral"}>
              <span className="tnum">{connections.length}</span> sources
              {failing > 0 ? ` · ${failing} failing` : ""}
            </Chip>
          </>
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-3.5" aria-hidden /> Add connection
          </Button>
        }
      >
        <p className="mt-2 max-w-[62ch] t-body text-muted-foreground">
          Each source shows when it last succeeded. Nothing stale is presented as fresh.
        </p>
      </PageHeader>

      <NarrationNote>
        Integration health is a surface, not a log line. A failed source degrades answers visibly,
        which is the difference between a system you can trust and one you have to second-guess.
      </NarrationNote>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        <div className="row-grid px-4 t-micro uppercase tracking-widest text-muted-foreground">
          <span className="row-primary">Source</span>
          <span className="row-meta">Last success</span>
          <span className="row-trailing">State</span>
        </div>
        <ul>
          {connections.map((c) => (
            <li key={c.name} className="row-grid border-t border-border px-4">
              <span className="row-primary">
                <span className="block truncate type-data-strong">{c.name}</span>
                <span className="block truncate t-meta">{c.posture}</span>
              </span>
              <span className="row-meta tnum t-meta">{c.lastSuccess}</span>
              <span className="row-trailing">
                <StateChip state={c.state} />
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Section className="mt-4" title="When a source fails downstream">
        <p className="t-body text-muted-foreground">
          Answers exclude a failed source and carry a visible gap note — &ldquo;source unreachable
          since 24 Aug&rdquo; — instead of answering as if the source were current. Previously
          confirmed records remain, with their provenance and their date. Nothing stale is presented
          as fresh.
        </p>
      </Section>

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
                  <span className="t-body font-semibold">MCP upstream</span>
                  <span className="t-meta">
                    Consume the source&rsquo;s own MCP server where one exists.
                  </span>
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <RadioGroupItem value="self" id="conn-self" className="mt-1" />
                <Label htmlFor="conn-self" className="flex flex-col items-start gap-1 font-normal">
                  <span className="t-body font-semibold">Self-hosted connector</span>
                  <span className="t-meta">Fallback where no upstream MCP exists.</span>
                </Label>
              </div>
            </RadioGroup>
            <p className="mt-4 border-t border-border pt-4 t-meta">
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
