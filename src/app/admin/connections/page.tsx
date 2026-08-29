"use client";
/** Connections health — Journey D EP1. MCP-first posture; failure renders as a visible gap, never as fresh. */
import { useState } from "react";
import { connections } from "@/data/seed";
import { Chip, Section, PageHeader, NarrationNote, SchematicBadge } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { KeyRound, Plus, RefreshCw } from "lucide-react";

export default function Connections() {
  const [addOpen, setAddOpen] = useState(false);
  const [connector, setConnector] = useState<"mcp" | "self">("mcp");

  return (
    <div className="mx-auto max-w-[980px] px-6 py-6">
      <PageHeader
        crumb="Settings / Connections"
        title={<>Connections <Chip tone="neutral">{connections.length} sources</Chip></>}
        right={<Button variant="outline" size="sm" onClick={() => setAddOpen(true)}><Plus className="size-3.5" /> Add connection…</Button>}
      />

      <NarrationNote>
        Integration health is a first-class surface: every connector shows its last success, and a failed source degrades answers visibly instead of silently.
      </NarrationNote>

      <Section className="mt-4">
        <ul className="divide-y divide-border text-[13.5px]">
          {connections.map((c) => (
            <li key={c.name} className="flex flex-wrap items-center gap-2 py-2.5">
              <div className="min-w-0">
                <div className="font-medium">{c.name}</div>
                <div className="text-[11.5px] text-muted-foreground">{c.posture}</div>
              </div>
              <span className="ml-auto" />
              <span className="text-[12px] text-muted-foreground tnum">last success {c.lastSuccess}</span>
              {c.state === "ok" && <Chip tone="ok">connected</Chip>}
              {c.state === "syncing" && <Chip tone="neutral"><RefreshCw className="size-3" aria-hidden /> syncing</Chip>}
              {c.state === "credentials" && <Chip tone="crit"><KeyRound className="size-3" aria-hidden /> credentials expired</Chip>}
            </li>
          ))}
        </ul>
      </Section>

      <Section className="mt-4" title="When a source fails downstream">
        <p className="text-[12.5px] text-muted-foreground">
          Answers exclude a failed source and carry a visible gap note — &ldquo;source unreachable since 24 Aug&rdquo; — instead of answering as if the source were current. Previously confirmed records remain, with their provenance and date. Nothing stale is presented as fresh.
        </p>
      </Section>

      {/* Add connection — schematic */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">Add connection <SchematicBadge /></SheetTitle>
            <SheetDescription>Connector posture is MCP-first.</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <RadioGroup value={connector} onValueChange={(v) => setConnector(v as "mcp" | "self")} className="gap-3">
              <div className="flex items-start gap-2.5">
                <RadioGroupItem value="mcp" id="conn-mcp" className="mt-0.5" />
                <Label htmlFor="conn-mcp" className="flex flex-col items-start gap-0.5 font-normal">
                  <span className="text-[13.5px] font-medium">MCP upstream</span>
                  <span className="text-[12px] text-muted-foreground">Consume the source&apos;s own MCP server where one exists.</span>
                </Label>
              </div>
              <div className="flex items-start gap-2.5">
                <RadioGroupItem value="self" id="conn-self" className="mt-0.5" />
                <Label htmlFor="conn-self" className="flex flex-col items-start gap-0.5 font-normal">
                  <span className="text-[13.5px] font-medium">Self-hosted connector</span>
                  <span className="text-[12px] text-muted-foreground">Fallback where no upstream MCP exists.</span>
                </Label>
              </div>
            </RadioGroup>
            <p className="mt-4 border-t border-border pt-3 text-[12px] text-muted-foreground">
              Scoped credentials, a sync cadence, and read-only where the source system is ground truth — the booking system stays authoritative for money.
            </p>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Continue (schematic)</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
