"use client";
/**
 * Atoms and small molecules. Every value here is a sys-* utility or a type role;
 * nothing holds a literal. Each component's rule is in docs/rebuild/decisions.md.
 */
import React from "react";
import { cn } from "@/lib/utils";
import type { Area } from "@/lib/areas";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { notify } from "@/lib/notify";
import { FileText, HardDrive, Mail, Route, Database, Globe, Earth, PenLine, Megaphone, OctagonAlert, TriangleAlert, Check } from "lucide-react";

/* ── Absent ──────────────────────────────────────────────────────────────────
   One vocabulary for empty. Restricted material never reaches the page; every
   other empty says which kind of empty it is. The dash is the constant; the word
   after it is the reason.                                                       */
export function Absent({ reason, className }: { reason: "not run" | "none on file" | "not applicable" | "pending"; className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 text-label-secondary", className)}>
      <span aria-hidden>—</span>
      <span className="type-meta">{reason}</span>
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
    neutral: "border-chip-edge bg-chip-rest text-label-secondary",
    ok: "border-ok/40 text-ok",
    primary: "border-chip-edge-strong bg-chip-rest text-label",
    warn: "border-warn-soft bg-warn-soft text-warn",
    crit: "border-crit-soft bg-crit-soft text-crit",
  } as const;
  return (
    <span
      title={title}
      data-slot="chip"
      className={cn("inline-flex h-[var(--chip-h)] items-center gap-1 whitespace-nowrap rounded-full border px-2.5 type-meta", tones[tone], className)}
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
          : "border-control-edge bg-control-rest text-label hover:border-control-edge-hover hover:bg-control-rest-hover",
        className,
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn("type-meta tnum", selected ? "text-on-selected" : "text-label-tertiary")}>{count}</span>
      )}
    </button>
  );
}

/* ── StatusDot — a state, in a word, with a dot beside it ─────────────────────
   The label is a REQUIRED child: you cannot render a naked coloured circle.   */
/* ── IconChrome — the small round control on a floating surface (2026-09-25) ──
   Close, all, new, previous, next: a 28 circle on the faintest surface, the same on every
   card, sheet, dialog, rail and toast, so a close always looks like a close. `pressed`
   marks the one that is showing (the assistant's list of conversations). */
export const IconChrome = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { label: string; pressed?: boolean }
>(function IconChrome({ label, pressed, className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(
        "pressable grid size-7 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-interactive hover:text-label disabled:cursor-not-allowed disabled:text-label-disabled [&_svg]:size-3.5",
        pressed ? "bg-interactive text-label" : "bg-faint text-label-secondary",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

/* ── AreaDot — where something leads, in the colour of that area (areas.ts) ───
   Wayfinding, not state: the dot is the area's solid and never a trust colour. Like
   StatusDot it cannot render without its words. A thing in no area gets a quiet grey. */
export function AreaDot({ area, className, children }: { area: Area | null; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: area ? `var(--area-${area}-solid)` : "var(--sys-label-quaternary)" }}
        aria-hidden
      />
      {children}
    </span>
  );
}

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
    <span className="inline-flex items-center gap-1.5 type-meta text-label-secondary">
      <span className={cn("size-1.5 rounded-full", color)} aria-hidden />
      {layer}
    </span>
  );
}

/* ── FreshnessDate: a date, never an icon alone ── */
export function FreshnessDate({ children, stale }: { children: React.ReactNode; stale?: boolean }) {
  return <span className={cn("type-meta", stale ? "text-warn" : "text-label-secondary")}>{children}</span>;
}

/* ── SourceTag ── */
const sourceIcons = { intranet: FileText, gdrive: HardDrive, email: Mail, axus: Route, tripsuite: Database, portal: Globe, manual: PenLine, announcement: Megaphone, web: Earth } as const;
export function SourceTag({ kind, label }: { kind: keyof typeof sourceIcons; label: string }) {
  const Icon = sourceIcons[kind];
  return (
    <span className="inline-flex items-center gap-1 type-meta tnum text-label-secondary">
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
        <span className="type-meta text-label-secondary">
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
      {converted && <span className="type-meta text-label-secondary"> · {converted.currency} {converted.amount} (conversion dated {converted.date})</span>}
    </span>
  );
}

/* ═══ The attention model (VIS-097, 2026-09-28) ═══════════════════════════════
   Five kinds of message. Each has one trigger, one place, one look, one way out:
     Blocker       You cannot proceed (closed to bookings; a source answers depend on
                   is down). On the object, at the moment of choice. Claret, one
                   sentence, one act. Clears only when its condition does.
     Warning       You can proceed but should decide, often before a date (a taste
                   conflict, an incentive closing). Inline on the line or field it is
                   about, never page-wide. Ochre, a sentence, Fix and Keep; Keep
                   collapses it to a neutral line with who kept it and when.
     State         Context with no decision (departs in 12 days, syncing, held, one
                   source): a neutral <Chip> or grey text. Words, not colour.
     Confirmation  You acted. Where the result shows, the control is replaced in place
                   by <Done> ("Sent · 10:14 · R. Devane"). Where it does not (a sheet
                   closed, the result is elsewhere), a toast just above the dock
                   (`notify`, src/lib/notify.ts), with Undo when the act can be undone.
     Notification  Something happened without you, or waits on you: the inbox. It
                   closes when its subject is dealt with (store `inboxState`).
   Colour means severity and nothing else: claret only for blocked or at risk now,
   ochre only for "decide", everything else neutral. Copy says what is true and what
   you can do; the product's case for itself belongs in the docs, not in a banner.  */

export function Blocker({
  title, children, action, className,
}: { title: React.ReactNode; children?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div data-attention="blocker" className={cn("flex flex-wrap items-start gap-x-[var(--space-3)] gap-y-[var(--space-2)] rounded-lg bg-crit-soft px-[var(--space-4)] py-[var(--space-3)]", className)}>
      <OctagonAlert className="mt-0.5 size-[var(--icon-md)] shrink-0 text-crit" aria-hidden />
      {/* The text keeps a readable measure; at inspector width the act wraps below it. */}
      <div className="min-w-0 flex-1 basis-56">
        <p className="type-data-strong text-crit">{title}</p>
        {children && <div className="mt-0.5 type-data text-label">{children}</div>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-[var(--space-2)] self-center">{action}</div>}
    </div>
  );
}

export function Warning({
  title, children, actions, kept, className,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
  /** Fix and Keep: what resolves it. */
  actions?: React.ReactNode;
  /** Once someone kept it: "Kept despite the preference · R. Devane, 28 Aug". */
  kept?: React.ReactNode;
  className?: string;
}) {
  if (kept) {
    return (
      <p data-attention="kept" className={cn("flex items-center gap-1.5 type-meta text-label-secondary", className)}>
        <Check className="size-[var(--icon-sm)] shrink-0" aria-hidden />
        {kept}
      </p>
    );
  }
  return (
    <div data-attention="warning" className={cn("flex flex-wrap items-start gap-x-[var(--space-3)] gap-y-[var(--space-2)] rounded-lg bg-warn-soft px-[var(--space-4)] py-[var(--space-3)]", className)}>
      <TriangleAlert className="mt-0.5 size-[var(--icon-md)] shrink-0 text-warn" aria-hidden />
      <div className="min-w-0 flex-1 basis-56">
        <p className="type-data-strong text-warn">{title}</p>
        {children && <div className="mt-0.5 type-data text-label">{children}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-[var(--space-2)] self-center">{actions}</div>}
    </div>
  );
}

/* ── Done — a confirmation in place: the act, when, by whom. Neutral. ── */
export function Done({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p role="status" className={cn("inline-flex items-center gap-1.5 type-meta text-label-secondary", className)}>
      <Check className="size-[var(--icon-sm)] shrink-0" aria-hidden />
      {children}
    </p>
  );
}

/* ── ConfirmBanner — kept for its callers; it now draws a <Done>, neutral and in
   place. A confirmation is not a green block that never goes away (FB-06). ── */
export function ConfirmBanner({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return <Done className="py-[var(--space-1)]">{children}</Done>;
}

/* ── SeverityBanner — kept for its callers, drawn by the attention model: Critical is
   a blocker's look, Important a warning's, Info and ok are neutral. New code uses
   <Blocker> and <Warning>, which carry a title and their acts. ── */
export function SeverityBanner({ severity, className, children }: { severity: "Info" | "Important" | "Critical" | "ok"; className?: string; children: React.ReactNode }) {
  const tones = { Info: "bg-sunken text-label", Important: "bg-warn-soft text-label", Critical: "bg-crit-soft text-label", ok: "bg-sunken text-label" } as const;
  const Icon = severity === "Critical" ? OctagonAlert : severity === "Important" ? TriangleAlert : null;
  return (
    <div className={cn("flex items-start gap-[var(--space-3)] rounded-lg px-[var(--space-4)] py-[var(--space-3)] type-data", tones[severity], className)}>
      {Icon && <Icon className={cn("mt-0.5 size-[var(--icon-md)] shrink-0", severity === "Critical" ? "text-crit" : "text-warn")} aria-hidden />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
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
        <div className="type-data text-label-secondary">{reason}</div>
      </div>
      {figures && <div className="shrink-0 text-right type-data tnum">{figures}</div>}
    </div>
  );
}

/* ── Schematic — drawn, not wired (COL-09) ────────────────────────────────────
   Its own look, so it can never be mistaken for a status: a dashed outline and
   tertiary ink. `SchematicBadge` marks a region; `SchematicAction` stands in for a
   control that does nothing in this build: it keeps its place and its label, is
   announced as unavailable, and says so when pressed. It is never the primary. */
export function SchematicBadge({ className }: { className?: string }) {
  return (
    <span
      data-slot="schematic"
      title="Drawn, not wired: these controls do not change anything in this build."
      className={cn("inline-flex h-[var(--chip-h)] items-center whitespace-nowrap rounded-full border border-dashed border-strong px-2.5 type-meta text-label-tertiary", className)}
    >
      Schematic
    </span>
  );
}

export function SchematicAction({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      data-slot="schematic"
      aria-disabled="true"
      title="Not wired in this build"
      onClick={() => notify("Not wired in this build", { detail: "This control is drawn to show where it goes." })}
      className={cn("inline-flex h-[var(--control-h-sm)] cursor-help items-center gap-1.5 rounded-md border border-dashed border-strong px-[var(--control-px-sm)] type-data text-label-tertiary", className)}
    >
      {children}
    </button>
  );
}

/* ── ProvenancePopover on a field value ───────────────────────────────────────
   A value you can press: hairline underline at rest, fill on hover.           */
export function ProvenancePopover({ source, children }: { source: { what: string; where: string; when: string; kind: keyof typeof sourceIcons }; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="pressable -mx-1 cursor-pointer rounded-sm px-1 text-left underline decoration-link-rest underline-offset-4 hover:bg-interactive hover:decoration-ink">{children}</button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-2 type-data">
        <div className="type-meta text-label-tertiary">Field provenance</div>
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
 *
 * The header has two zones: IDENTITY (title + at most one qualifier) and ACTION
 * (controls only). Status that describes the content belongs in the body.
 */
export function Section({
  title, chips, actions, footer, variant = "chapter", quiet, deep, follows, anchor, className, bodyClassName, children,
}: {
  title?: React.ReactNode;
  chips?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "chapter" | "tool";
  /** A note's title (14/400 secondary), not a chapter's. */
  quiet?: boolean;
  /** Below the fold: 48 of breathing room instead of 32. */
  deep?: boolean;
  /** A tool that follows you: elevation 2. */
  follows?: boolean;
  /** The chapter's name for a tool that follows the reading position (the Briefing's
      insight rail): rendered as `data-chapter`, and as the id `chapter-<anchor>`. */
  anchor?: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const chapter = variant === "chapter";
  const tool = variant === "tool";
  return (
    <section
      data-slot={chapter ? "chapter" : "card"}
      data-variant={variant}
      data-chapter={anchor}
      id={anchor ? `chapter-${anchor}` : undefined}
      className={cn(
        chapter && "chapter",
        chapter && deep && "chapter-deep",
        tool && "tool",
        tool && follows && "tool-follows",
        tool && "flex min-w-0 flex-col",
        className,
      )}
    >
      {title && (
        <header
          className={cn(
            "flex flex-wrap items-center gap-[var(--space-2)]",
            "mb-[var(--space-4)]",
          )}
        >
          <h3 className={cn("flex min-w-0 flex-wrap items-center gap-[var(--space-2)]", quiet ? "type-data text-label-secondary" : "type-section")}>{title}</h3>
          {chips}
          {actions && <div className="ml-auto flex items-center gap-[var(--space-2)]">{actions}</div>}
        </header>
      )}
      <div className={cn("min-w-0 flex-1", bodyClassName)}>{children}</div>
      {footer && (
        <footer className={cn(
          "mt-auto",
          chapter && "mt-[var(--space-4)]",
          tool && "mt-[var(--space-4)] border-t border-hairline pt-[var(--space-4)]",
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
      className={cn("inline-flex flex-wrap items-center gap-[var(--space-2)]", className)}
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
              "pressable flex h-[var(--control-h-sm)] shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-[var(--control-px-sm)] type-data font-medium",
              on
                ? "border-selected bg-selected text-on-selected"
                : "border-control-edge bg-control-rest text-label-secondary hover:border-control-edge-hover hover:bg-control-rest-hover hover:text-label",
            )}
          >
            {Icon && <Icon className="size-[var(--icon-md)]" aria-hidden />}
            {o.label}
            {o.count !== undefined && <span className={cn("type-meta tnum", on ? "text-on-selected" : "text-label-tertiary")}>{o.count}</span>}
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
