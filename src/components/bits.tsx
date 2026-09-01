"use client";
/** Core custom atoms + small molecules per design-system-inventory.md. */
import React from "react";
import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, HardDrive, Mail, Route, Database, Globe, PenLine, Presentation } from "lucide-react";

/* ── Absent ──────────────────────────────────────────────────────────────────
   One vocabulary for empty.

   Blank space was carrying three incompatible meanings at once: a value that was
   never computed, a step already done, and material this reader is not permitted
   to see. On a product whose whole claim is that you can always tell why something
   is not there, an advisor could look at a card and not know whether Acuity had
   been withheld, never run, or did not apply.

   So: restricted material stays genuinely absent — it never reaches the page, and
   there is nothing here to render. Everything else that is empty says which kind
   of empty it is, in the em-dash form the commissions ledger already used for
   not-applicable. The dash is the constant; the word after it is the reason.        */
export function Absent({ reason, className }: { reason: "not run" | "none on file" | "not applicable" | "pending"; className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 text-muted-foreground", className)}>
      <span aria-hidden>—</span>
      <span className="type-micro">{reason}</span>
    </span>
  );
}

/* ── DataList ─────────────────────────────────────────────────────────────────
   One shape for label-and-value.

   This is among the most repeated structures in the product and it had grown four
   different implementations — label stacked above value, two-column unruled,
   two-column ruled, and two-column with a wide gap — none of them shared. A reader
   moving between the notification inspector, a traveller card and a policy widget
   was reading the same kind of thing in four different grammars.

   `rows` may carry a null value; a row with nothing to show renders the absence
   vocabulary rather than an empty cell.                                            */
export function DataList({
  rows, className,
}: {
  rows: { label: string; value: React.ReactNode; absent?: "not run" | "none on file" | "not applicable" | "pending" }[];
  className?: string;
}) {
  return (
    <dl className={cn("rounded-lg border border-border px-4 type-data", className)}>
      {rows.map((r, i) => (
        <div
          key={r.label}
          className={cn(
            "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5",
            i > 0 && "border-t border-border",
          )}
        >
          <dt className="text-muted-foreground">{r.label}</dt>
          <dd className="min-w-0 text-right">
            {r.value ?? <Absent reason={r.absent ?? "none on file"} />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ── EmptyState ───────────────────────────────────────────────────────────────
   One shape for "there is nothing here". This existed already — unexported, inside
   `notifications/page.tsx`, used once — while three other surfaces hand-rolled their
   own (a centred Section, a table cell spanning seven columns, a bare paragraph).
   The component was not missing; it was in the wrong file.

   `icon` is optional and `action` is the way back out, because an empty state that
   offers no route is a dead end rather than an answer.                            */
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
    <Section className={cn("py-12 text-center", className)}>
      {Icon && <Icon className="mx-auto size-[var(--icon-lg)] text-muted-foreground" aria-hidden />}
      <p className={cn("type-data-strong", Icon && "mt-3")}>{title}</p>
      <p className="mx-auto mt-1 max-w-[46ch] type-meta">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </Section>
  );
}

/* ── Rows ─────────────────────────────────────────────────────────────────────
   The list row, shared. Previously each surface declared its own `Row`/`Rows` pair
   locally, which is why the two-line shape existed on exactly one screen.

   A row owns its horizontal gutter so its divider and hover fill span the full card;
   the `list` card body owns none. Use `RowStack` whenever the trailing marks would
   otherwise squeeze the subject — the subject keeps at least half its width, and the
   second line takes the message.                                                    */
export function Rows({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn("divide-y divide-border type-data", className)}>{children}</ul>;
}

export function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <li className={cn("row-grid px-[var(--space-4)]", className)}>{children}</li>;
}

/** Subject + one trailing mark on line one; the message on line two. */
export function RowStack({
  head, children, className,
}: { head: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <li className={cn("row-stack px-[var(--space-4)]", className)}>
      <div className="row-stack-head">{head}</div>
      <div className="row-stack-body type-meta">{children}</div>
    </li>
  );
}

/* ── Chip ─────────────────────────────────────────────────────────────────────
   Fill is reserved for severity.

   The system's own principle is "emphasis is weight before size or colour" — but a
   chip is a filled shape, and fill outranks weight perceptually whatever the type
   size. So the stated hierarchy and the rendered one disagreed, and the chip won:
   the eye read "chased · 54d" before "Aurelia", on every list in the product.

   `warn` and `crit` keep their fill, because severity is the one thing that should
   outrank a subject. Everything else — trust, lifecycle, counts — is outlined: the
   tone still carries the meaning, and the subject returns to the top of the row.  */
export function Chip({ tone = "neutral", className, title, children }: { tone?: "neutral" | "ok" | "warn" | "crit" | "primary"; className?: string; title?: string; children: React.ReactNode }) {
  /* Every chip carries a border, so outlined and filled chips are the same height.
     Previously only the outlined ones did, and the border added to the box — a filled
     chip measured 18px and an outlined one 20px, staggering any row that held both.
     A filled chip's border matches its own fill, so it stays invisible.              */
  const tones = {
    neutral: "border-border text-muted-foreground",
    ok: "border-ok/35 text-ok",
    primary: "border-primary/30 text-primary",
    /* severity — filled, and the border takes the fill so the box is unchanged */
    warn: "border-warn-soft bg-warn-soft text-warn",
    crit: "border-crit-soft bg-crit-soft text-crit",
  } as const;
  return <span title={title} className={cn("inline-flex h-5 items-center gap-1 rounded-full border px-2 type-micro whitespace-nowrap", tones[tone], className)}>{children}</span>;
}

/* ── StatusDot ────────────────────────────────────────────────────────────────
   A state, in a word, with a dot beside it. The label is a REQUIRED child, which is
   the whole point of the component: you cannot render a naked coloured circle through
   it, so the rule "never colour alone" is enforced by the type rather than by everyone
   remembering it.

   Thirteen call sites had hand-rolled this markup at two different diameters, each
   choosing its own colour semantics locally. Most kept the word; one did not, and that
   one shipped — a column of dots beside a date, green on twelve of fourteen rows,
   telling the reader nothing and breaking pattern exactly twice.

   Colour never carries the meaning on its own here. It is redundant with the word,
   which is also what makes the whole set legible to anyone who cannot separate the
   green from the amber.                                                              */
export function StatusDot({
  tone, children, className,
}: {
  tone: "ok" | "warn" | "crit" | "muted" | "primary";
  /** Required. A dot with no word is not a status, it is decoration. */
  children: React.ReactNode;
  className?: string;
}) {
  const color = {
    ok: "bg-ok", warn: "bg-warn", crit: "bg-crit",
    primary: "bg-primary", muted: "border border-muted-foreground/60",
  }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", className)}>
      <span className={cn("size-2 shrink-0 rounded-full", color)} aria-hidden />
      {children}
    </span>
  );
}

/* ── EvidenceDot: state in words + dot, never color alone ── */
export function EvidenceDot({ kind, label }: { kind: "verified" | "stale" | "disagree" | "incentive" | "unconfirmed"; label: string }) {
  /* `unconfirmed` is the absence of a trust state rather than one of them — hollow, not filled. */
  const color = { verified: "bg-ok", stale: "bg-warn", disagree: "bg-crit", incentive: "bg-primary", unconfirmed: "border border-muted-foreground/60" }[kind];
  return (
    <span className="inline-flex items-center gap-1.5 type-meta text-foreground">
      <span className={cn("size-2 rounded-full", color)} aria-hidden />
      {label}
    </span>
  );
}

/* ── LayerBadge ── */
export function LayerBadge({ layer }: { layer: "canonical" | "agency" | "personal" }) {
  const color = { canonical: "bg-ok", agency: "bg-primary", personal: "bg-muted-foreground" }[layer];
  return (
    <span className="inline-flex items-center gap-1.5 type-micro text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", color)} aria-hidden />
      {layer}
    </span>
  );
}

/* ── FreshnessDate: a date, never an icon alone ── */
export function FreshnessDate({ children, stale }: { children: React.ReactNode; stale?: boolean }) {
  return <span className={cn("type-micro", stale ? "text-warn" : "text-muted-foreground")}>{children}</span>;
}

/* ── SourceTag ── */
const sourceIcons = { intranet: FileText, gdrive: HardDrive, email: Mail, axus: Route, tripsuite: Database, portal: Globe, manual: PenLine } as const;
export function SourceTag({ kind, label }: { kind: keyof typeof sourceIcons; label: string }) {
  const Icon = sourceIcons[kind];
  return (
    <span className="inline-flex items-center gap-1 type-micro text-muted-foreground font-mono">
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

/* ── ConfidenceMeter: "3 of 4 sources agree" ── */
/** `label={null}` renders the bar alone — for rows where the words beside it already
    say what the bar says, and repeating them is noise rather than clarity. */
export function ConfidenceMeter({ agree, total, label, className }: { agree: number; total: number; label?: string | null; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="h-1.5 w-16 rounded-full bg-muted overflow-hidden"
        role="meter"
        aria-valuenow={agree}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label ?? "confidence"}
      >
        <span className="block h-full rounded-full bg-primary" style={{ width: `${(agree / total) * 100}%` }} />
      </span>
      {label !== null && (
        <span className="type-micro text-muted-foreground">
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
      {converted && <span className="text-muted-foreground type-micro"> · {converted.currency} {converted.amount} (conversion dated {converted.date})</span>}
    </span>
  );
}

/* ── ConfirmBanner: transient success (distinct from NoticeBanner) ── */
export function ConfirmBanner({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return <div className="rounded-lg border-l-3 border-ok bg-ok-soft px-3 py-2 type-data" role="status">{children}</div>;
}

/* ── NoticeBanner tones ── */
export function SeverityBanner({ severity, className, children }: { severity: "Info" | "Important" | "Critical" | "ok"; className?: string; children: React.ReactNode }) {
  const tones = { Info: "border-border bg-subtle", Important: "border-warn bg-warn-soft", Critical: "border-crit bg-crit-soft", ok: "border-ok bg-ok-soft" } as const;
  return <div className={cn("rounded-lg border-l-3 px-3 py-2.5 type-data", tones[severity], className)}>{children}</div>;
}

/* ── SchematicBadge ──────────────────────────────────────────────────────────
   One meaning, everywhere: **the controls you can see here are drawn, not wired.**

   It had drifted across three jobs — a feature that does not exist, a feature partly
   built, and a block of controls that look live and change nothing — which made it
   unreadable. A thing that does not exist at all is not badged; it is absent, or
   named on the control itself. This badge marks only the third case, and it now says
   so on hover rather than relying on the reader to infer which sense is meant.     */
export function SchematicBadge() {
  return (
    <Chip
      tone="neutral"
      className="font-mono uppercase tracking-wide type-micro"
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
    <aside className="rounded-lg border border-dashed border-primary/50 bg-primary-soft/50 px-3 py-2.5 type-data text-foreground/90 flex gap-2">
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
      <PopoverContent align="start" className="w-80 type-data space-y-2">
        <div className="font-medium type-meta uppercase tracking-wide text-muted-foreground">Field provenance</div>
        <div><span className="text-muted-foreground">What · </span>{source.what}</div>
        <div><span className="text-muted-foreground">Where · </span>{source.where}</div>
        <div><span className="text-muted-foreground">When · </span>{source.when}</div>
        <div className="pt-1 border-t border-border"><SourceTag kind={source.kind} label="open document (permission holds)" /></div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * The card primitive.
 *
 * Two variants, each complete on its own:
 *   padded (default) — 16px body inset; prose and mixed content
 *   list             — zero body inset, children own theirs; header and footer ruled
 *
 * `list` replaces the old `flush`, which required every one of its call sites to *also*
 * pass a body padding override. A primitive that needs a second prop to function is one
 * people route around, and 31 hand-rolled card shells across 13 files were the cost.
 *
 * The header has two zones and an admission rule:
 *   IDENTITY (left) — the title, plus at most one qualifier, and only if it carries
 *                     information the title does not.
 *   ACTION (right)  — controls only.
 * Status that describes the *content* belongs in the body's first row, not up here.
 * The rule is what makes "Enable canonical ● canonical" a violation rather than taste.
 */
export function Section({
  title, chips, actions, footer, variant = "padded", className, bodyClassName, children,
}: {
  title?: React.ReactNode;
  /** One qualifier, admitted only if it adds what the title does not. */
  chips?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "padded" | "list";
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const list = variant === "list";
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-card",
        !list && "p-[var(--space-4)]",
        className,
      )}
    >
      {title && (
        <header
          className={cn(
            "flex flex-wrap items-center gap-[var(--space-2)]",
            list ? "border-b border-border px-[var(--space-4)] py-[var(--space-3)]" : "mb-[var(--space-3)]",
          )}
        >
          {/* `type-section`, not `type-data-strong`. At 13/590 the card's title was the
              same SIZE as the values under it and differed only in weight, so it sat
              among its content rather than above it — a border can enclose a group but
              it cannot subordinate one, which is why a stack of cards read as a pile of
              equals no matter how the spacing was tuned. 15/590 over 13/400 is the step
              that makes the heading own what follows, and every card in the product
              inherits it from here. */}
          <h3 className="flex min-w-0 flex-wrap items-center gap-[var(--space-2)] type-section">{title}</h3>
          {chips}
          {actions && <div className="ml-auto flex items-center gap-[var(--space-2)]">{actions}</div>}
        </header>
      )}
      <div className={cn("min-w-0 flex-1", list && "py-[var(--space-3)]", bodyClassName)}>{children}</div>
      {footer && (
        <footer className="mt-auto border-t border-border px-[var(--space-4)] py-[var(--space-3)]">
          {footer}
        </footer>
      )}
    </section>
  );
}

/* ── Segmented — one control for view toggles, tag filters, state filters ──
   Three surfaces had reimplemented this, each with its own radius and size. */
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
    /* The container is `control-sm` tall (28px) and its tabs fill it, so a segmented
       control and any other filter-class control on the same line agree. It measured
       29px against a 36px search input on the ledger — close enough to look like an
       accident, which is what it was: nothing decided either number. */
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "inline-flex h-[var(--control-h-sm)] shrink-0 items-center rounded-[var(--radius-control)] border border-border p-0.5",
        className,
      )}
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
              "flex h-full cursor-pointer items-center gap-1.5 rounded-[4px] px-2.5 type-data transition-colors",
              on ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon && <Icon className="size-[var(--icon-md)]" aria-hidden />}
            {o.label}
            {o.count !== undefined && <span className="type-micro tnum opacity-70">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── QuietLoading ───────────────────────────────────────────────────
   The one loading treatment, used by the route boundary (`app/loading.tsx`) and by
   the session gate while the store rehydrates. A skeleton of the shape that is
   coming rather than a spinner: the wait is a read, not a computation, and a blank
   frame on reload reads as a broken build. */
export function QuietLoading({ note }: { note?: string }) {
  return (
    <div className="p-[var(--panel-pad)]" role="status" aria-live="polite">
      <Skeleton className="h-7 w-64" />
      <p className="mt-3 type-meta">
        {note ?? "Reading the workspace. Nothing is drawn until the data behind it is here."}
      </p>
      <div className="mt-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* A second PageHeader lived here — its own markup, its own props, its own display size,
   imported by nothing. Every surface uses the one in layouts.tsx. Two implementations of
   one component is how a system starts disagreeing with itself, so this one is gone. */
