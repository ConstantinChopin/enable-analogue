"use client";
/** Core custom atoms + small molecules per design-system-inventory.md. */
import React from "react";
import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, HardDrive, Mail, Route, Database, Globe, PenLine, Presentation } from "lucide-react";

/* ── Chip ── */
export function Chip({ tone = "neutral", className, children }: { tone?: "neutral" | "ok" | "warn" | "crit" | "primary"; className?: string; children: React.ReactNode }) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    crit: "bg-crit-soft text-crit",
    primary: "bg-primary-soft text-primary",
  } as const;
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 t-micro whitespace-nowrap", tones[tone], className)}>{children}</span>;
}

/* ── EvidenceDot: state in words + dot, never color alone ── */
export function EvidenceDot({ kind, label }: { kind: "verified" | "stale" | "disagree" | "incentive" | "unconfirmed"; label: string }) {
  /* `unconfirmed` is the absence of a trust state rather than one of them — hollow, not filled. */
  const color = { verified: "bg-ok", stale: "bg-warn", disagree: "bg-crit", incentive: "bg-primary", unconfirmed: "border border-muted-foreground/60" }[kind];
  return (
    <span className="inline-flex items-center gap-1.5 t-meta text-foreground">
      <span className={cn("size-2 rounded-full", color)} aria-hidden />
      {label}
    </span>
  );
}

/* ── LayerBadge ── */
export function LayerBadge({ layer }: { layer: "canonical" | "agency" | "personal" }) {
  const color = { canonical: "bg-ok", agency: "bg-primary", personal: "bg-muted-foreground" }[layer];
  return (
    <span className="inline-flex items-center gap-1.5 t-micro text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", color)} aria-hidden />
      {layer}
    </span>
  );
}

/* ── FreshnessDate: a date, never an icon alone ── */
export function FreshnessDate({ children, stale }: { children: React.ReactNode; stale?: boolean }) {
  return <span className={cn("t-micro", stale ? "text-warn" : "text-muted-foreground")}>{children}</span>;
}

/* ── SourceTag ── */
const sourceIcons = { intranet: FileText, gdrive: HardDrive, email: Mail, axus: Route, tripsuite: Database, portal: Globe, manual: PenLine } as const;
export function SourceTag({ kind, label }: { kind: keyof typeof sourceIcons; label: string }) {
  const Icon = sourceIcons[kind];
  return (
    <span className="inline-flex items-center gap-1 t-micro text-muted-foreground font-mono">
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

/* ── ConfidenceMeter: "3 of 4 sources agree" ── */
export function ConfidenceMeter({ agree, total, label }: { agree: number; total: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-16 rounded-full bg-muted overflow-hidden" aria-hidden>
        <span className="block h-full rounded-full bg-primary" style={{ width: `${(agree / total) * 100}%` }} />
      </span>
      <span className="t-micro text-muted-foreground">{label ?? `${agree} of ${total} sources agree`}</span>
    </span>
  );
}

/* ── MoneyValue: dual-currency / dated conversion / held ── */
export function MoneyValue({ amount, currency = "EUR", converted, held }: { amount: number | string; currency?: string; converted?: { amount: string; currency: string; date: string }; held?: boolean }) {
  if (held) return <Chip tone="crit">held — converted figure without source currency</Chip>;
  return (
    <span className="tnum">
      {currency} {typeof amount === "number" ? amount.toLocaleString("en-GB") : amount}
      {converted && <span className="text-muted-foreground t-micro"> · {converted.currency} {converted.amount} (conversion dated {converted.date})</span>}
    </span>
  );
}

/* ── ConfirmBanner: transient success (distinct from NoticeBanner) ── */
export function ConfirmBanner({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return <div className="rounded-md border-l-3 border-ok bg-ok-soft px-3 py-2 t-body" role="status">{children}</div>;
}

/* ── NoticeBanner tones ── */
export function SeverityBanner({ severity, className, children }: { severity: "Info" | "Important" | "Critical" | "ok"; className?: string; children: React.ReactNode }) {
  const tones = { Info: "border-border bg-subtle", Important: "border-warn bg-warn-soft", Critical: "border-crit bg-crit-soft", ok: "border-ok bg-ok-soft" } as const;
  return <div className={cn("rounded-md border-l-3 px-3 py-2.5 t-body", tones[severity], className)}>{children}</div>;
}

/* ── SchematicBadge ── */
export function SchematicBadge() {
  return <Chip tone="neutral" className="font-mono uppercase tracking-wide text-[10px]">schematic</Chip>;
}

/* ── NarrationNote: presenter-overlay only ── */
export function NarrationNote({ children }: { children: React.ReactNode }) {
  const { s } = useDemo();
  if (!s.narration) return null;
  return (
    <aside className="rounded-md border border-dashed border-primary/50 bg-primary-soft/50 px-3 py-2.5 t-body text-foreground/90 flex gap-2">
      <Presentation className="size-4 shrink-0 text-primary mt-0.5" aria-hidden />
      <span>{children}</span>
    </aside>
  );
}

/* ── ProvenancePopover on a field value ── */
export function ProvenancePopover({ source, children }: { source: { what: string; where: string; when: string; kind: keyof typeof sourceIcons }; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-left rounded-sm hover:bg-muted/70 px-1 -mx-1 cursor-pointer">{children}</button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 t-body space-y-2">
        <div className="font-medium t-meta uppercase tracking-wide text-muted-foreground">Field provenance</div>
        <div><span className="text-muted-foreground">What · </span>{source.what}</div>
        <div><span className="text-muted-foreground">Where · </span>{source.where}</div>
        <div><span className="text-muted-foreground">When · </span>{source.when}</div>
        <div className="pt-1 border-t border-border"><SourceTag kind={source.kind} label="open document (permission holds)" /></div>
      </PopoverContent>
    </Popover>
  );
}

/* ── Section card ── */
export function Section({ title, chips, className, children }: { title?: React.ReactNode; chips?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      {title && (
        <h3 className="mb-3 flex flex-wrap items-center gap-2 t-title">
          {title} {chips}
        </h3>
      )}
      {children}
    </section>
  );
}

/* ── Page header ── */
export function PageHeader({ crumb, title, right, children }: { crumb?: string; title: React.ReactNode; right?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="mb-5">
      {crumb && <div className="mb-1 t-meta text-muted-foreground font-mono">{crumb}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="t-display flex items-center gap-3">{title}</h1>
        {right}
      </div>
      {children}
    </header>
  );
}
