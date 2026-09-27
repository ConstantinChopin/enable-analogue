"use client";
/**
 * /system — the state matrix. Every primitive in every declared state, on one page,
 * so a person can see the system and the harness can check that each state renders
 * (docs/rebuild/registry.md). Not a product surface: no contract, no dock tile,
 * reachable by URL for anyone signed in.
 */
import React, { useState } from "react";
import { Page, PageHeader } from "@/components/layouts";
import {
  Section, Chip, FilterChip, Segmented, Rows, Row, RowStack, DataList, TrustRow,
  StatusDot, EvidenceDot, LayerBadge, FreshnessDate, SourceTag, ConfidenceMeter,
  MoneyValue, SeverityBanner, ConfirmBanner, Absent, EmptyState,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Search, ArrowRight } from "lucide-react";
import Link from "next/link";

function Swatch({ name, cls }: { name: string; cls: string }) {
  return (
    <div className="flex items-center gap-[var(--space-3)]">
      <span className={`size-9 shrink-0 rounded-md border border-hairline ${cls}`} aria-hidden />
      <span className="type-code text-label-secondary">{name}</span>
    </div>
  );
}

function Specimen({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <div className="type-micro-caps text-label-tertiary">{label}</div>
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">{children}</div>
    </div>
  );
}

export default function SystemPage() {
  const [seg, setSeg] = useState<"all" | "overdue" | "paid">("all");
  const [chip, setChip] = useState<string[]>(["Hotel"]);
  const [sheet, setSheet] = useState(false);
  const [dialog, setDialog] = useState(false);
  const toggle = (c: string) => setChip((v) => (v.includes(c) ? v.filter((x) => x !== c) : [...v, c]));

  return (
    <TooltipProvider>
      <Page width="wide">
        <PageHeader title="The system" actions={<Button variant="link" size="sm" asChild><a href="/briefing">Back to the product</a></Button>}>
          <p className="mt-[var(--space-2)] type-meta">Every primitive in every declared state. docs/rebuild/registry.md is the record; this page is the proof.</p>
        </PageHeader>

        <Section title="Type" quiet>
          <div className="space-y-[var(--space-3)]">
            <div className="type-title-page">Maison Léandre — the page&apos;s name, once</div>
            <div className="type-prose-lead">A. Whitfield leaves for Lisbon in 3 days, with a transfer unconfirmed. (prose-lead 18/28)</div>
            <div className="type-prose">Answers, explanations and the brief are set in the person&apos;s voice at 16/24. (prose)</div>
            <div className="type-prose-quote">“Rate confirmed on the 21 June note.” (prose-quote 15/24)</div>
            <div className="type-section">A chapter title (section 16/20 590)</div>
            <div className="type-section-quiet">A note&apos;s title (section-quiet 14/18 secondary)</div>
            <div className="type-figure">EUR 12,532 (figure 18/24 tnum)</div>
            <div className="type-data">The data body, 14/18 400, in Instrument Sans.</div>
            <div className="type-data-read max-w-[60ch]">A paragraph of machine text at 14/20, read rather than scanned, with room between the lines because someone reads it rather than scans it.</div>
            <div className="type-data-strong">The subject of a row (data-strong 14/18 590)</div>
            <div className="type-meta">Attribution, dates, secondary facts (meta 12/16 secondary)</div>
            <div className="type-micro">chips, counts (micro 11/14 510)</div>
            <div className="type-micro-caps text-label-tertiary">a field label (micro-caps 10/12 700)</div>
            <div className="type-code">partner_portal · rate_note_21jun (code 11/14)</div>
          </div>
        </Section>

        <Section title="Colour roles" quiet>
          <div className="grid gap-[var(--space-3)] sm:grid-cols-2 lg:grid-cols-4">
            <Swatch name="bg-base" cls="bg-base" /><Swatch name="bg-raised" cls="bg-raised" /><Swatch name="bg-overlay" cls="bg-overlay" /><Swatch name="bg-sunken" cls="bg-sunken" />
            <Swatch name="fill-interactive" cls="bg-interactive" /><Swatch name="fill-interactive-hover" cls="bg-interactive-hover" /><Swatch name="fill-selected" cls="bg-selected" /><Swatch name="fill-disabled" cls="bg-disabled" />
            <Swatch name="ink" cls="bg-ink" /><Swatch name="ink-hover" cls="bg-ink-hover" /><Swatch name="ink-pressed" cls="bg-ink-pressed" /><Swatch name="ink-disabled" cls="bg-ink-disabled" />
            <Swatch name="ok / ok-soft" cls="bg-ok-soft border-ok" /><Swatch name="warn / warn-soft" cls="bg-warn-soft border-warn" /><Swatch name="crit / crit-soft" cls="bg-crit-soft border-crit" /><Swatch name="stroke-hairline · strong" cls="bg-raised border-strong" />
          </div>
          <div className="mt-[var(--space-4)] flex flex-wrap gap-[var(--space-4)] type-data">
            <span className="text-label">label-primary</span><span className="text-label-secondary">label-secondary</span><span className="text-label-tertiary">label-tertiary</span><span className="text-label-quaternary">label-quaternary</span><span className="text-label-disabled">label-disabled</span>
          </div>
        </Section>

        {/* VIS-042: shape says what a control is. A rectangle does, a pill chooses, a
            chip states, an underline goes. Fill says how much an action matters. */}
        <Section title="Controls, by what they are" quiet>
          <div className="space-y-[var(--space-4)]">
            <Specimen label="does · a rectangle · md">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="tertiary">Tertiary</Button>
              <Button variant="destructive">Remove</Button>
            </Specimen>
            <Specimen label="does · sm">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="secondary">Show all 30 amenities</Button>
              <Button size="sm" variant="tertiary">Add note</Button>
            </Specimen>
            <Specimen label="does · icon chrome · a circle">
              <Button size="icon" variant="ghost" aria-label="Search"><Search /></Button>
              <Button size="icon-sm" variant="ghost" aria-label="Search"><Search /></Button>
            </Specimen>
            <Specimen label="does · disabled">
              <Button disabled>Primary</Button>
              <Button variant="secondary" disabled>Secondary</Button>
              <Button variant="tertiary" disabled>Tertiary</Button>
            </Specimen>
            <Specimen label="goes · an underline">
              <Button asChild variant="link"><Link href="/commissions">Open the ledger <ArrowRight aria-hidden /></Link></Button>
              <Button asChild variant="link" size="sm"><Link href="/records">All records</Link></Button>
            </Specimen>
          </div>
        </Section>

        <Section title="Fields" quiet>
          <div className="grid max-w-3xl gap-[var(--space-4)] sm:grid-cols-2">
            <div><Label htmlFor="sys-in">Work email</Label><Input id="sys-in" className="mt-[var(--space-2)]" placeholder="name@agency.example" /></div>
            <div><Label htmlFor="sys-in-sm">Filter (sm)</Label><Input id="sys-in-sm" size="sm" className="mt-[var(--space-2)]" placeholder="Search records" /></div>
            <div><Label htmlFor="sys-in-d">Disabled</Label><Input id="sys-in-d" className="mt-[var(--space-2)]" disabled value="Not editable" readOnly /></div>
            <div><Label htmlFor="sys-in-x">Invalid</Label><Input id="sys-in-x" className="mt-[var(--space-2)]" aria-invalid defaultValue="14%%" /></div>
            <div className="sm:col-span-2"><Label htmlFor="sys-ta">Why? <span className="text-label-secondary">(required)</span></Label><Textarea id="sys-ta" className="mt-[var(--space-2)]" placeholder="e.g. confirmed by the property on today’s call" /></div>
            <div>
              <Label>Select</Label>
              <Select defaultValue="agency">
                <SelectTrigger className="mt-[var(--space-2)] w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Just me</SelectItem>
                  <SelectItem value="team">My team</SelectItem>
                  <SelectItem value="agency">The whole agency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-[var(--space-6)]">
              <span className="flex items-center gap-2"><Checkbox id="sys-cb" defaultChecked /><Label htmlFor="sys-cb">Checked</Label></span>
              <span className="flex items-center gap-2"><Checkbox id="sys-cb2" /><Label htmlFor="sys-cb2">Unchecked</Label></span>
              <span className="flex items-center gap-2"><Checkbox id="sys-cb3" disabled /><Label htmlFor="sys-cb3">Disabled</Label></span>
              <span className="flex items-center gap-2"><Switch id="sys-sw" defaultChecked /><Label htmlFor="sys-sw">On</Label></span>
              <span className="flex items-center gap-2"><Switch id="sys-sw2" /><Label htmlFor="sys-sw2">Off</Label></span>
              <RadioGroup defaultValue="a" className="flex gap-[var(--space-4)]">
                <span className="flex items-center gap-2"><RadioGroupItem value="a" id="sys-ra" /><Label htmlFor="sys-ra">Selected</Label></span>
                <span className="flex items-center gap-2"><RadioGroupItem value="b" id="sys-rb" /><Label htmlFor="sys-rb">Not</Label></span>
              </RadioGroup>
            </div>
          </div>
        </Section>

        <Section title="Chooses — a pill; the selected one is inverse" quiet>
          <div className="space-y-[var(--space-4)]">
            <Specimen label="several of · filter chips">
              {["Hotel", "Villa", "DMC", "Cruise"].map((c) => (
                <FilterChip key={c} selected={chip.includes(c)} onClick={() => toggle(c)} count={c === "Hotel" ? 128 : undefined}>{c}</FilterChip>
              ))}
            </Specimen>
            <Specimen label="one of · segmented">
              <Segmented value={seg} onChange={setSeg} label="State" options={[{ value: "all", label: "All", count: 9 }, { value: "overdue", label: "Overdue", count: 3 }, { value: "paid", label: "Paid" }]} />
            </Specimen>
            <Specimen label="one of · tabs">
              <Tabs defaultValue="fields">
                <TabsList>
                  <TabsTrigger value="fields">Fields</TabsTrigger>
                  <TabsTrigger value="sources">Sources</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
              </Tabs>
            </Specimen>
          </div>
        </Section>

        <Section title="States — a chip, never an action" quiet>
          <div className="space-y-[var(--space-4)]">
            <Specimen label="chips">
              <Chip tone="neutral">due 12 Sep</Chip><Chip tone="ok">verified today</Chip><Chip tone="primary">agency overlay</Chip><Chip tone="warn">96d unverified</Chip><Chip tone="crit">3 sources disagree</Chip>
            </Specimen>
            <Specimen label="badges">
              <Badge>default</Badge><Badge variant="outline">outline</Badge><Badge variant="ok">confirmed</Badge><Badge variant="warn">held</Badge><Badge variant="crit">rejected</Badge>
            </Specimen>
            <Specimen label="dots, evidence, layers, freshness, sources">
              <StatusDot tone="ok">healthy</StatusDot><StatusDot tone="warn">syncing</StatusDot><StatusDot tone="crit">credentials expired</StatusDot><StatusDot tone="muted">not run</StatusDot>
              <EvidenceDot kind="verified" label="verified May" /><EvidenceDot kind="unconfirmed" label="unconfirmed" />
              <LayerBadge layer="canonical" /><LayerBadge layer="agency" /><LayerBadge layer="personal" />
              <FreshnessDate>12 Mar</FreshnessDate><FreshnessDate stale>96d unverified</FreshnessDate>
              <SourceTag kind="portal" label="Partner portal" /><SourceTag kind="manual" label="R. Devane · today" />
              <ConfidenceMeter agree={3} total={4} />
              <MoneyValue amount={2240} /><MoneyValue amount="1,180" currency="USD" held />
              <Absent reason="not run" />
            </Specimen>
            <Specimen label="bars agree with their key">
              <div className="w-64"><Progress value={62} tone="ok" /></div><StatusDot tone="ok">verified 62%</StatusDot>
              <div className="w-64"><Progress tone="neutral" value={30} /></div><span className="type-meta">a plain quantity</span>
            </Specimen>
          </div>
        </Section>

        <Section title="Banners and trust" quiet>
          <div className="max-w-3xl space-y-[var(--space-3)]">
            <SeverityBanner severity="Info">Info — sunken paper, the label voice.</SeverityBanner>
            <SeverityBanner severity="Important"><b>Spa closed to 15 Sep.</b> Opened 12 Jun · agency scope · MK</SeverityBanner>
            <SeverityBanner severity="Critical"><b>Critical.</b> Water damage on floors 2–3 — do not confirm bookings until the property confirms reopening.</SeverityBanner>
            <ConfirmBanner show>Note saved — private to R. Devane · attributed and dated.</ConfirmBanner>
            <Alert><ShieldCheck /><AlertTitle>Permissions filter every surface</AlertTitle><AlertDescription>Including citations. Restricted material never reaches the page.</AlertDescription></Alert>
            <TrustRow icon={ShieldCheck} label="Verified against source" reason="3 of 4 sources agree; the fourth is a superseded rate." figures={<><div>12%</div><div className="type-meta">signed terms</div></>} />
          </div>
        </Section>

        <Section title="Lists and the ledger" quiet>
          <div className="grid gap-[var(--gap-3)] lg:grid-cols-2">
            <div>
              <div className="mb-[var(--space-2)] type-micro-caps text-label-tertiary">rows</div>
              <Rows>
                <Row><span className="row-primary type-data-strong">Aurelia</span><span className="row-meta type-meta tnum">EUR 2,240</span><span className="row-trailing"><Chip tone="primary">chased · 54d</Chip></span></Row>
                <Row><span className="row-primary type-data-strong">Cap d&apos;Estel</span><span className="row-meta type-meta tnum">EUR 690</span><span className="row-trailing"><Chip tone="crit">overdue 28d</Chip></span></Row>
                <RowStack head={<><span className="row-primary type-data-strong">Hôtel Verlaine</span><Chip tone="crit">Critical</Chip></>}>Water damage on floors 2–3 — do not confirm bookings until the property confirms reopening.</RowStack>
              </Rows>
              <div className="mt-[var(--space-6)] mb-[var(--space-2)] type-micro-caps text-label-tertiary">data list</div>
              <DataList rows={[{ label: "Rooms", value: <span className="tnum">42</span> }, { label: "Rep firm", value: "Corvin & Wells" }, { label: "Quality score", value: null, absent: "not run" }]} />
            </div>
            <div>
              <div className="mb-[var(--space-2)] type-micro-caps text-label-tertiary">table · one selected row</div>
              <Table>
                <TableHeader><TableRow><TableHead>Property</TableHead><TableHead>Amount</TableHead><TableHead>State</TableHead></TableRow></TableHeader>
                <TableBody>
                  <TableRow><TableCell className="type-data-strong">Aurelia</TableCell><TableCell className="tnum">EUR 2,240</TableCell><TableCell><Chip tone="primary">chased · 54d</Chip></TableCell></TableRow>
                  <TableRow data-state="selected"><TableCell className="type-data-strong">Villa Ortensia</TableCell><TableCell className="tnum">EUR 1,240</TableCell><TableCell><Chip tone="crit">overdue 12d</Chip></TableCell></TableRow>
                  <TableRow><TableCell className="type-data-strong">Casa Marena</TableCell><TableCell className="tnum">EUR 780</TableCell><TableCell><Chip tone="crit">overdue 19d</Chip></TableCell></TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </Section>

        <Section title="Layers over the page" quiet deep>
          <div className="flex flex-wrap items-center gap-[var(--space-2)]">
            <Button variant="secondary" onClick={() => setSheet(true)}>Open a sheet</Button>
            <Button variant="secondary" onClick={() => setDialog(true)}>Open a dialog</Button>
            <Popover>
              <PopoverTrigger asChild><Button variant="secondary">Open a popover</Button></PopoverTrigger>
              <PopoverContent align="start"><div className="type-micro-caps text-label-tertiary">Field provenance</div><p className="mt-1 type-data">Partner portal · row 41, column C · 12 Mar</p></PopoverContent>
            </Popover>
            <Tooltip><TooltipTrigger asChild><Button variant="secondary">Hover for a tooltip</Button></TooltipTrigger><TooltipContent>Synced 12:04</TooltipContent></Tooltip>
            <Avatar><AvatarFallback>RD</AvatarFallback></Avatar>
          </div>
          <div className="mt-[var(--space-6)] max-w-md"><EmptyState title="Nothing is waiting on you" body="When a notification needs a decision it appears here with what it needs." action={<Button variant="secondary" size="sm">Open the brief</Button>} /></div>

          <Sheet open={sheet} onOpenChange={setSheet}>
            <SheetContent side="right">
              <SheetHeader><SheetTitle>A sheet</SheetTitle><SheetDescription>Radius-7, elevation 4, and the page&apos;s own rows.</SheetDescription></SheetHeader>
              <div className="px-[var(--space-6)] py-[var(--space-6)]">
                <Rows>
                  <Row><span className="row-primary">Daily breakfast for two</span><span className="row-trailing type-code text-label-secondary">daily_breakfast_two</span></Row>
                  <Row><span className="row-primary">EUR 100 property credit</span><span className="row-trailing type-code text-label-secondary">property_credit</span></Row>
                </Rows>
              </div>
            </SheetContent>
          </Sheet>
          <Dialog open={dialog} onOpenChange={setDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>A dialog</DialogTitle><DialogDescription>Closing this does not unblock the property.</DialogDescription></DialogHeader>
              <DialogFooter><Button variant="secondary" onClick={() => setDialog(false)}>Close</Button><Button onClick={() => setDialog(false)}>Acknowledge</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>
      </Page>
    </TooltipProvider>
  );
}
