"use client";
/**
 * Layout primitives — the five archetypes are composed from these (§7).
 *
 * There is no global top bar (§10.8): every page opens with the same header zone,
 * back arrow + breadcrumb left, actions right. Every page clears the dock by way of
 * <Page>, which owns the bottom padding.
 */
import React, { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Segmented } from "@/components/bits";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { X, LayoutGrid, Rows3 } from "lucide-react";

/* ── Dock clearance ────────────────────────────────────────────────────────────
   16 (gap from viewport) + 16 (dock padding) + 44 (tile) + 8 (indicator row)
   = 84px of furniture, plus breathing room. One constant, used everywhere.      */
export const DOCK_FOOTPRINT = 84;
export const DOCK_CLEARANCE = "pb-[112px]";

/* ── PageHeader ─────────────────────────────────────────────────────────────── */
export function PageHeader({
  back, crumb, title, actions, children, className,
}: {
  /** true → router.back(); a string → push that href. */
  back?: boolean | string;
  crumb?: React.ReactNode;
  title: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  /* `back` and `crumb` are accepted for call-site compatibility but no longer drawn
     here: navigation and location belong to the frame bar, above the content panel,
     so they appear exactly once in the application. */
  void back; void crumb;
  return (
    <header className={cn("mb-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h1 className="t-display flex min-w-0 flex-wrap items-center gap-3">{title}</h1>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */
export function Page({
  width = "wide", className, children,
}: {
  width?: "wide" | "text" | "full";
  className?: string;
  children: React.ReactNode;
}) {
  /* Content fills the panel at a fixed inset on every side, rather than being centred
     inside a max-width column — the centred column produced ~97px side gutters on a
     wide screen while the top sat at 24px, which read as three different paddings.
     Only genuine prose keeps a measure. The page owns its scroll; the frame does not. */
  const max = { wide: "max-w-none", text: "max-w-[72ch]", full: "max-w-none" }[width];
  return (
    <div className={cn("h-full w-full overflow-y-auto p-[var(--panel-pad)]", className)}>
      <div className={cn("w-full min-w-0", max)}>{children}</div>
    </div>
  );
}

/* ── SplitPage ───────────────────────────────────────────────────────────────
   A catalogue or ledger with an inspector. The inspector is a full-height column
   at the right edge of the frame — the way Notion's side panel and Claude Code's
   preview behave — and the page's own header, tabs and filters stay to its left,
   narrowing as it opens. The previous arrangement nested the panel inside the
   content column below the header, which made it read as a card rather than as an
   inspector. */
export function SplitPage({
  header, panel, panelOpen, onClosePanel, panelTitle = "Detail", children,
}: {
  header?: React.ReactNode;
  panel: React.ReactNode;
  panelOpen: boolean;
  onClosePanel: () => void;
  panelTitle?: string;
  children: React.ReactNode;
}) {
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClosePanel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, onClosePanel]);

  const open = isDesktop && panelOpen;

  return (
    <div className="flex h-full min-h-0 w-full">
      <div className="min-w-0 flex-1 overflow-y-auto p-[var(--panel-pad)]">
        {header}
        {children}
      </div>

      {open && (
        <aside
          aria-label={panelTitle}
          className="flex h-full w-[400px] shrink-0 flex-col border-l border-border bg-card"
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
            <span className="truncate t-title">{panelTitle}</span>
            <button
              type="button"
              onClick={onClosePanel}
              aria-label="Close panel"
              className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{panel}</div>
        </aside>
      )}

      {!isDesktop && (
        <Sheet open={panelOpen} onOpenChange={(o) => { if (!o) onClosePanel(); }}>
          <SheetContent side="bottom" showCloseButton={false} className="max-h-[85dvh] gap-0 rounded-t-2xl p-0">
            <SheetTitle asChild><span className="sr-only">{panelTitle}</span></SheetTitle>
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <span className="truncate t-title">{panelTitle}</span>
              <button
                type="button"
                onClick={onClosePanel}
                aria-label="Close panel"
                className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-8">{panel}</div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

/* ── the desktop query ────────────────────────────────────────────────────────
   One breakpoint decides whether the inspector is a column or a sheet.          */
function useIsDesktop() {
  const [is, setIs] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIs(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return is;
}

/* ── ViewToggle ───────────────────────────────────────────────────────────────
   A thin wrapper over `Segmented` — the one segmented control. The prop signature
   is unchanged, so every call site is untouched. */
const VIEW_OPTIONS = [
  { value: "grid" as const, label: "Grid", icon: LayoutGrid },
  { value: "table" as const, label: "Table", icon: Rows3 },
];

export function ViewToggle({
  value, onChange, className,
}: { value: "grid" | "table"; onChange: (v: "grid" | "table") => void; className?: string }) {
  return (
    <Segmented
      value={value}
      onChange={onChange}
      options={VIEW_OPTIONS}
      label="View"
      className={className}
    />
  );
}

/* ── PropertyImage ──────────────────────────────────────────────────────────────
   Deterministic generated artwork (review 01 §8). Real photographs would contradict
   fictional properties and a remote image is a live-demo failure risk, so each record
   gets an abstract architectural plate derived from a hash of its id. No network,
   no randomness: the same id always draws the same picture.                        */

/** FNV-1a, 32-bit. Stable across runs and machines. */
function hashId(id: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

type Motif = "arch" | "windows" | "horizon" | "palm";

function motifFor(category: string | undefined, h: number): Motif {
  const c = (category ?? "").toLowerCase();
  if (/cruise|yacht|ship|sail|voyage/.test(c)) return "horizon";
  if (/dmc|destination|experience|guide|tour/.test(c)) return "palm";
  if (/rep|firm|office|agency|consorti/.test(c)) return "windows";
  if (/hotel|resort|villa|lodge|château|chateau|riad|palace/.test(c)) return "arch";
  return (["arch", "windows", "horizon", "palm"] as Motif[])[h % 4];
}

export function PropertyImage({
  id, name, category, className, src,
}: {
  id: string;
  name?: string;
  category?: string;
  className?: string;
  /** A real photograph, if one is ever dropped in, wins over the generated plate. */
  src?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name ?? ""} className={cn("size-full object-cover", className)} />
    );
  }

  const h = hashId(id);
  const hue = h % 360;
  const hue2 = (hue + 34) % 360;
  const sky = `hsl(${hue} 26% 92%)`;
  const skyDeep = `hsl(${hue} 30% 84%)`;
  const mass = `hsl(${hue} 22% 46%)`;
  const massLight = `hsl(${hue} 20% 60%)`;
  const accent = `hsl(${hue2} 48% 58%)`;
  const motif = motifFor(category, h);
  const gid = `pi-${(h >>> 0).toString(36)}`;

  const bits = [3, 5, 7, 11, 13, 17].map((p) => (h >>> p) & 7);

  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={name ? `${name} — generated plate` : "Generated plate"}
      className={cn("size-full", className)}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky} />
          <stop offset="100%" stopColor={skyDeep} />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${gid})`} />

      {motif === "arch" && (
        <g>
          <circle cx={250 + bits[0] * 4} cy={44 + bits[1] * 3} r="16" fill={accent} opacity="0.55" />
          <rect x="40" y={92 - bits[2] * 4} width="240" height={108 + bits[2] * 4} fill={mass} />
          {[0, 1, 2].map((i) => {
            const w = 52;
            const x = 62 + i * 66;
            const top = 128 - bits[i] * 5;
            return (
              <path
                key={i}
                d={`M${x} 200 L${x} ${top} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${top} L${x + w} 200 Z`}
                fill={sky}
                opacity="0.9"
              />
            );
          })}
          <rect x="40" y={92 - bits[2] * 4} width="240" height="6" fill={massLight} />
        </g>
      )}

      {motif === "windows" && (
        <g>
          <rect x="34" y="34" width="252" height="166" fill={mass} />
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 6 }).map((__, c) => {
              const lit = ((h >>> (r * 6 + c)) & 3) === 0;
              return (
                <rect
                  key={`${r}-${c}`}
                  x={50 + c * 38}
                  y={50 + r * 38}
                  width="26"
                  height="26"
                  fill={lit ? accent : sky}
                  opacity={lit ? 0.85 : 0.7}
                />
              );
            }),
          )}
        </g>
      )}

      {motif === "horizon" && (
        <g>
          <circle cx={80 + bits[0] * 8} cy={62 + bits[1] * 3} r="22" fill={accent} opacity="0.7" />
          <rect x="0" y="126" width="320" height="74" fill={mass} />
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x="0"
              y={140 + i * 18}
              width="320"
              height="4"
              fill={massLight}
              opacity={0.5 - i * 0.12}
            />
          ))}
          <path
            d={`M${196 + bits[2] * 6} 126 L${216 + bits[2] * 6} ${86 - bits[3] * 4} L${236 + bits[2] * 6} 126 Z`}
            fill={massLight}
          />
        </g>
      )}

      {motif === "palm" && (
        <g>
          <circle cx={244 + bits[0] * 3} cy={54 + bits[1] * 2} r="18" fill={accent} opacity="0.6" />
          <rect x="0" y="164" width="320" height="36" fill={mass} opacity="0.9" />
          <path d={`M${112 + bits[2] * 4} 164 C ${106} 124, ${104} 100, ${100 + bits[3] * 3} 76`} stroke={mass} strokeWidth="7" fill="none" strokeLinecap="round" />
          {[-1, 1].map((dir) =>
            [0, 1, 2].map((i) => (
              <path
                key={`${dir}-${i}`}
                d={`M${100 + bits[3] * 3} 76 C ${100 + dir * (28 + i * 12)} ${68 - i * 8}, ${100 + dir * (52 + i * 14)} ${76 + i * 10}, ${100 + dir * (60 + i * 16)} ${94 + i * 14}`}
                stroke={massLight}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />
            )),
          )}
        </g>
      )}
    </svg>
  );
}
