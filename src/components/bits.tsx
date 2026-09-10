"use client";
/**
 * Atoms and small molecules. Every value here is a sys-* utility or a type role;
 * nothing holds a literal. Each component's rule is in docs/rebuild/decisions.md.
 */
import React from "react";
import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, HardDrive, Mail, Route, Database, Globe, PenLine, Presentation } from "lucide-react";

/* ── Absent ──────────────────────────────────────────────────────────────────
   One vocabulary for empty. Restricted material never reaches the page; every
   other empty says which kind of empty it is. The dash is the constant; the word
   after it is the reason.                                                       */
export function Absent({ reason, className }: { reason: "not run" | "none on file" | "not applicable" | "pending"; className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 text-label-secondary", className)}>
      <span aria-hidden>—</span>
      <span className="type-micro">{reason}</span>
    </span>
  );
}

/* ── DataList ─────────────────────────────────────────────────────────────────
   One shape for label-and-value: hairline rows at the row module, label in the
   secondary level, value right-aligned. No box — a list is content, not a tool. */
export function DataList({
  rows, className,
}: {
  rows: { label: string; value: React.ReactNode; absent?: "not run" | "none on file" | "not applicable" | "pending" }[];
  className?: string;
}) {
  return (
    <dl className={cn("type-data", className)}>
      {rows.map((r, i) => (
        <div
          key={r.label}
          className={cn(
            "flex min-h-[var(--row-h)] flex-wrap items-baseline justify-between gap-x-[var(--space-4)] gap-y-1 py-[11px]",
            i > 0 && "border-t border-hairline",
          )}
        >
          <dt className="text-label-secondary">{r.label}</dt>
          <dd className="min-w-0 text-right text-label">
            {r.value ?? <Absent reason={r.absent ?? "none on file"} />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ── EmptyState ───────────────────────────────────────────────────────────────
   "There is nothing here", with the way back out.                              */
export function EmptyState({
  title, body, icon: Icon, action, className,
}: {
  title: string;
  body: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-[var(--gap-5)] text-center", className)}>
      {Icon && <Icon className="mx-auto size-[var(--icon-lg)] text-label-tertiary" aria-hidden />}
      <p className={cn("type-data-strong", Icon && "mt-[var(--space-3)]")}>{title}</p>
      <p className="mx-auto mt-1 max-w-[46ch] type-meta">{body}</p>
      {action && <div className="mt-[var(--space-4)]">{action}</div>}
    </div>
  );
}

/* ── Rows ─────────────────────────────────────────────────────────────────────
   The list row, shared. Hairlines between rows, none under the last; the row
   module is 40. A row owns its horizontal gutter when it sits inside a tool
   (`inset`), and none when it sits in a chapter, where the column is the edge. */
export function Rows({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn("divide-y divide-hairline type-data", className)}>{children}</ul>;
}

export function Row({ children, className, inset }: { children: React.ReactNode; className?: string; inset?: boolean }) {
  return <li className={cn("row-grid", inset && "px-[var(--space-6)]", className)}>{children}</li>;
}

/** Subject + one trailing mark on line one; the message on line two. */
export function RowStack({
  head, children, className, inset,
}: { head: React.ReactNode; children: React.ReactNode; className?: string; inset?: boolean }) {
  return (
    <li className={cn("row-stack", inset && "px-[var(--space-6)]", className)}>
      <div className="row-stack-head">{head}</div>
      <div className="row-stack-body type-meta">{children}</div>
    </li>
  );
}

/* ── Chip — a status carrier, never an action ─────────────────────────────────
   24 high, a pill (it floats over content). Fill is reserved for severity: warn
   and crit take ink on tint; everything else is outlined so the row's subject
   stays on top. Words always; the tone is redundant with them.                 */
export function Chip({ tone = "neutral", className, title, children }: { tone?: "neutral" | "ok" | "warn" | "crit" | "primary"; className?: string; title?: string; children: React.ReactNode }) {
  const tones = {
    neutral: "border-hairline text-label-secondary",
    ok: "border-ok/40 text-ok",
    primary: "border-strong text-label",
    warn: "border-warn-soft bg-warn-soft text-warn",
    crit: "border-crit-soft bg-crit-soft text-crit",
  } as const;
  return (
    <span
      title={title}
      data-slot="chip"
      className={cn("inline-flex h-[var(--chip-h)] items-center gap-1 whitespace-nowrap rounded-full border px-2.5 type-micro", tones[tone], className)}
    >
      {children}
    </span>
  );
}

/* ── FilterChip — a chip you can press (VIS-021) ──────────────────────────────
   32 high, a pill, hairline at rest, ink stroke on hover, INVERSE when selected.
   `aria-pressed` carries the state for the harness and for readers.           */
export function FilterChip({
  selected, onClick, className, children, count,
}: { selected?: boolean; onClick?: () => void; className?: string; children: React.ReactNode; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      onClick={onClick}
      data-slot="filter-chip"
      className={cn(
        "pressable inline-flex h-[var(--control-h-sm)] cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-[var(--control-px-sm)] type-data font-medium",
        selected
          ? "border-selected bg-selected text-on-selected"
          : "border-hairline bg-raised text-label hover:border-stroke-hover",
        className,
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn("type-micro tnum", selected ? "text-on-selected/70" : "text-label-tertiary")}>{count}</span>
      )}
    </button>
  );
}

/* ── StatusDot — a state, in a word, with a dot beside it ─────────────────────
   The label is a REQUIRED child: you cannot render a naked coloured circle.   */
export function StatusDot({
  tone, children, className,
}: {
  tone: "ok" | "warn" | "crit" | "muted" | "primary";
  children: React.ReactNode;
  className?: string;
}) {
  const color = {
    ok: "bg-ok", warn: "bg-warn", crit: "bg-crit",
    primary: "bg-ink", muted: "border border-strong",
  }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", className)}>
      <span className={cn("size-2 shrink-0 rounded-full", color)} aria-hidden />
      {children}
    </span>
  );
}

/* ── EvidenceDot: state in words + dot, never colour alone ── */
export function EvidenceDot({ kind, label }: { kind: "verified" | "stale" | "disagree" | "incentive" | "unconfirmed"; label: string }) {
  const color = { verified: "bg-ok", stale: "bg-warn", disagree: "bg-crit", incentive: "bg-ink", unconfirmed: "border border-strong" }[kind];
  return (
    <span className="inline-flex items-center gap-1.5 type-meta text-label">
      <span className={cn("size-2 rounded-full", color)} aria-hidden />
      {label}
    </span>
  );
}

/* ── LayerBadge — which layer a value came from, in a word ── */
export function LayerBadge({ layer }: { layer: "canonical" | "agency" | "personal" }) {
  const color = { canonical: "bg-ok", agency: "bg-ink", personal: "bg-strong" }[layer];
  return (
    <span className="inline-flex items-center gap-1.5 type-micro text-label-secondary">
      <span className={cn("size-1.5 rounded-full", color)} aria-hidden />
      {layer}
    </span>
  );
}

/* ── FreshnessDate: a date, never an icon alone ── */
export function FreshnessDate({ children, stale }: { children: React.ReactNode; stale?: boolean }) {
  return <span className={cn("type-micro", stale ? "text-warn" : "text-label-secondary")}>{children}</span>;
}

/* ── SourceTag ── */
const sourceIcons = { intranet: FileText, gdrive: HardDrive, email: Mail, axus: Route, tripsuite: Database, portal: Globe, manual: PenLine } as const;
export function SourceTag({ kind, label }: { kind: keyof typeof sourceIcons; label: string }) {
  const Icon = sourceIcons[kind];
  return (
    <span className="inline-flex items-center gap-1 type-code text-label-secondary">
      <Icon className="size-[var(--icon-sm)]" aria-hidden />
      {label}
    </span>
  );
}

/* ── ConfidenceMeter: "3 of 4 sources agree" ── */
export function ConfidenceMeter({ agree, total, label, className }: { agree: number; total: number; label?: string | null; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="h-1.5 w-16 overflow-hidden rounded-full bg-sunken"
        role="meter"
        aria-valuenow={agree}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label ?? "confidence"}
      >
        <span className="block h-full rounded-full bg-ink" style={{ width: `${(agree / total) * 100}%` }} />
      </span>
      {label !== null && (
        <span className="type-micro text-label-secondary">
          {label ?? `${agree} of ${total} sources agree`}
        </span>
      )}
    </span>
  );
}

/* ── MoneyValue: dual-currency / dated conversion / held ── */
export function MoneyValue({ amount, currency = "EUR", converted, held }: { amount: number | string; currency?: string; converted?: { amount: string; currency: string; date: string }; held?: boolean }) {
  if (held) return <Chip tone="crit">held — converted figure without source currency</Chip>;
  return (
    <span className="tnum">
      {currency} {typeof amount === "number" ? amount.toLocaleString("en-GB") : amount}
      {converted && <span className="type-micro text-label-secondary"> · {converted.currency} {converted.amount} (conversion dated {converted.date})</span>}
    </span>
  );
}

/* ── ConfirmBanner: transient success ── */
export function ConfirmBanner({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return <div className="rounded-lg bg-ok-soft px-[var(--space-4)] py-[var(--space-3)] type-data-read text-ok" role="status">{children}</div>;
}

/* ── SeverityBanner — ink on tint, one sentence ── */
export function SeverityBanner({ severity, className, children }: { severity: "Info" | "Important" | "Critical" | "ok"; className?: string; children: React.ReactNode }) {
  const tones = { Info: "bg-sunken text-label", Important: "bg-warn-soft text-warn", Critical: "bg-crit-soft text-crit", ok: "bg-ok-soft text-ok" } as const;
  return <div className={cn("rounded-lg px-[var(--space-4)] py-[var(--space-3)] type-data-read", tones[severity], className)}>{children}</div>;
}

/* ── TrustRow — trust is a row of words (VIS-070) ─────────────────────────────
   symbol · label · one sentence of reason · figures, in a hairline row at column
   width. Colour never says "trusted".                                          */
export function TrustRow({
  icon: Icon, label, reason, figures, className,
}: { icon?: React.ElementType; label: string; reason: string; figures?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-[var(--space-4)] rounded-lg border border-hairline px-[var(--space-6)] py-[var(--space-4)]", className)}>
      {Icon && <Icon className="size-[var(--icon-lg)] shrink-0 text-label" aria-hidden />}
      <div className="min-w-0 flex-1">
        <div className="type-data-strong">{label}</div>
        <div className="type-data-read text-label-secondary">{reason}</div>
      </div>
      {figures && <div className="shrink-0 text-right type-data tnum">{figures}</div>}
    </div>
  );
}

/* ── SchematicBadge — the controls you can see here are drawn, not wired ── */
export function SchematicBadge() {
  return (
    <Chip
      tone="neutral"
      className="font-mono uppercase tracking-wide"
      title="Drawn, not wired — these controls do not change anything in this build."
    >
      schematic
    </Chip>
  );
}

/* ── NarrationNote: presenter-overlay only ── */
export function NarrationNote({ children }: { children: React.ReactNode }) {
  const { s } = useDemo();
  if (!s.narration) return null;
  return (
    <aside className="flex gap-2 rounded-lg border border-dashed border-strong bg-sunken/60 px-[var(--space-4)] py-[var(--space-3)] type-data-read text-label">
      <Presentation className="mt-0.5 size-[var(--icon-md)] shrink-0 text-label-secondary" aria-hidden />
      <span>{children}</span>
    </aside>
  );
}

/* ── ProvenancePopover on a field value ───────────────────────────────────────
   A value you can press: hairline underline at rest, fill on hover.           */
export function ProvenancePopover({ source, children }: { source: { what: string; where: string; when: string; kind: keyof typeof sourceIcons }; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="pressable -mx-1 cursor-pointer rounded-sm px-1 text-left underline decoration-hairline underline-offset-4 hover:bg-interactive hover:decoration-ink">{children}</button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-2 type-data">
        <div className="type-micro-caps text-label-tertiary">Field provenance</div>
        <div><span className="text-label-secondary">What · </span>{source.what}</div>
        <div><span className="text-label-secondary">Where · </span>{source.where}</div>
        <div><span className="text-label-secondary">When · </span>{source.when}</div>
        <div className="border-t border-hairline pt-2"><SourceTag kind={source.kind} label="open document (permission holds)" /></div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Section — the page's atom (VIS-070).
 *
 *   chapter  the section unit: padding · title · content · padding · rule, at
 *            column width. No box. Content lives here.
 *   tool     a hairline box on raised paper, 24 inside: something that must stay
 *            in reach while the page scrolls. `follows` elevates it (step 2).
 *   padded   (transitional) the previous boxed card, 16 inside.
 *   list     (transitional) the previous boxed card with a flush body.
 *
 * The header has two zones: IDENTITY (title + at most one qualifier) and ACTION
 * (controls only). Status that describes the content belongs in the body.
 */
export function Section({
  title, chips, actions, footer, variant = "chapter", quiet, deep, follows, className, bodyClassName, children,
}: {
  title?: React.ReactNode;
  chips?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "chapter" | "tool" | "padded" | "list";
  /** A note's title (14/400 secondary), not a chapter's. */
  quiet?: boolean;
  /** Below the fold: 48 of breathing room instead of 32. */
  deep?: boolean;
  /** A tool that follows you: elevation 2. */
  follows?: boolean;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const chapter = variant === "chapter";
  const tool = variant === "tool";
  const list = variant === "list";
  const boxed = !chapter;
  return (
    <section
      data-slot={chapter ? "chapter" : "card"}
      data-variant={variant}
      className={cn(
        chapter && "chapter",
        chapter && deep && "chapter-deep",
        tool && "tool",
        tool && follows && "tool-follows",
        (variant === "padded" || list) && "flex min-w-0 flex-col overflow-hidden rounded-lg bg-raised shadow-elev-0",
        variant === "padded" && "p-[var(--space-4)]",
        boxed && "flex min-w-0 flex-col",
        className,
      )}
    >
      {title && (
        <header
          className={cn(
            "flex flex-wrap items-center gap-[var(--space-2)]",
            chapter && "mb-[var(--space-4)]",
            tool && "mb-[var(--space-4)]",
            list ? "border-b border-hairline px-[var(--space-4)] py-[var(--space-3)]" : variant === "padded" && "mb-[var(--space-3)]",
          )}
        >
          <h3 className={cn("flex min-w-0 flex-wrap items-center gap-[var(--space-2)]", quiet ? "type-section-quiet" : "type-section")}>{title}</h3>
          {chips}
          {actions && <div className="ml-auto flex items-center gap-[var(--space-2)]">{actions}</div>}
        </header>
      )}
      <div className={cn("min-w-0 flex-1", list && "py-[var(--space-3)]", bodyClassName)}>{children}</div>
      {footer && (
        <footer className={cn(
          "mt-auto",
          chapter && "mt-[var(--space-4)]",
          tool && "mt-[var(--space-4)] border-t border-hairline pt-[var(--space-4)]",
          list && "border-t border-hairline px-[var(--space-4)] py-[var(--space-3)]",
          variant === "padded" && "border-t border-hairline pt-[var(--space-3)]",
        )}>
          {footer}
        </footer>
      )}
    </section>
  );
}

/* ── Segmented — one control for view toggles and state filters ──────────────
   A row of pills at control-sm; the selected one inverts (VIS-021).          */
export function Segmented<T extends string>({
  value, onChange, options, label, className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ElementType; count?: number }[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("inline-flex shrink-0 items-center gap-[var(--space-2)]", className)}
    >
      {options.map((o) => {
        const on = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "pressable flex h-[var(--control-h-sm)] cursor-pointer items-center gap-1.5 rounded-full border px-[var(--control-px-sm)] type-data font-medium",
              on
                ? "border-selected bg-selected text-on-selected"
                : "border-hairline bg-raised text-label-secondary hover:border-stroke-hover hover:text-label",
            )}
          >
            {Icon && <Icon className="size-[var(--icon-md)]" aria-hidden />}
            {o.label}
            {o.count !== undefined && <span className={cn("type-micro tnum", on ? "text-on-selected/70" : "text-label-tertiary")}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── QuietLoading ─────────────────────────────────────────────────────────────
   A skeleton of the shape that is coming rather than a spinner.               */
export function QuietLoading({ note }: { note?: string }) {
  return (
    <div className="p-[var(--panel-pad)]" role="status" aria-live="polite">
      <Skeleton className="h-7 w-64" />
      <p className="mt-[var(--space-3)] type-meta">
        {note ?? "Reading the workspace. Nothing is drawn until the data behind it is here."}
      </p>
      <div className="mt-[var(--space-6)] space-y-[var(--space-3)]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-b border-hairline pb-[var(--space-4)]">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
