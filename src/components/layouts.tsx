"use client";
/**
 * Layout primitives. Every page opens with the same header zone — the page's
 * name (the one serif on the screen) left, actions right — and clears the dock
 * by way of <Page>, which owns the bottom padding.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";
import { IconChrome } from "@/components/bits";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { X, LayoutGrid, Rows3, Search, ArrowUpRight, ArrowLeft } from "lucide-react";

/* ── Dock clearance ──────────────────────────────────────────────────────────── */
export const DOCK_FOOTPRINT = 84;
export const DOCK_CLEARANCE = "pb-[112px]";

/* ── PageHeader — the title row acts, the toolbar views (VIS-095, 2026-09-28) ──
   The title row holds the page's name, ONE count (`count`) and at most one create
   action (`create`, secondary, "New X"), at the right. A detail page may put its own
   secondary acts on an item there (`actions`: Edit, Add note). Nothing that changes
   WHAT YOU SEE sits in this row: state switches, filters, search and the Grid/Table
   view live in the <ListToolbar> directly above the data. Supersedes the title-row
   rule of 2026-09-25, which put lenses beside acts, so a selected view outweighed
   the page's only action. The primary never lives here; it sits at the bottom of the
   tool that owns it.                                                               */
export function PageHeader({
  title, count, create, actions, children, className,
}: {
  title: React.ReactNode;
  /** The one count for the page ("8 trips"). Said once: nowhere else on the page. */
  count?: React.ReactNode;
  /** The page's create action ("New traveller"): a secondary button, right-aligned. */
  create?: React.ReactNode;
  /** A detail page's own secondary acts on its item. Never a view or state switch. */
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const right = create || actions;
  return (
    <header className={cn("mb-[var(--gap-2)]", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-[var(--space-4)] gap-y-[var(--space-2)]">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-[var(--space-3)] gap-y-[var(--space-1)]">
          <h1 className="type-title-page min-w-0">{title}</h1>
          {count !== undefined && count !== null && <span className="type-meta tnum">{count}</span>}
        </div>
        {right && <div className="flex flex-wrap items-center gap-[var(--space-2)]">{actions}{create}</div>}
      </div>
      {children}
    </header>
  );
}

/* ── ListToolbar — everything that changes what the list shows (VIS-095) ───────
   One order on every collection, directly above the data: the state switch first
   (Open · Actioned · Deferred), then filters and facets, then search; the result
   count and the Grid/Table view at the far right. Every control in it is 28 high,
   so the row shares one height (tier 2). A collection with none of these has no
   toolbar at all.                                                                 */
export function ListToolbar({
  state, filters, search, result, view, className,
}: {
  state?: React.ReactNode;
  filters?: React.ReactNode;
  search?: React.ReactNode;
  /** "9 of 14 · overdue first": what the list is showing, and its true order. */
  result?: React.ReactNode;
  view?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="list-toolbar"
      className={cn("mb-[var(--space-4)] flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-[var(--space-2)]", className)}
    >
      {state}
      {filters && <div className="flex flex-wrap items-center gap-[var(--space-2)]">{filters}</div>}
      {search}
      {(result || view) && (
        <div className="ml-auto flex items-center gap-[var(--space-3)]">
          {result && <span className="type-meta tnum text-label-tertiary">{result}</span>}
          {view}
        </div>
      )}
    </div>
  );
}

/* ── ListSearch — the one search field a collection has, 28 high ──────────────── */
export function ListSearch({
  value, onChange, placeholder, className,
}: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <label className={cn("field-pill relative flex h-[var(--control-h-sm)] w-64 max-w-full items-center gap-2 rounded-md border border-control-edge bg-control-rest px-[var(--space-3)] text-label-secondary hover:border-control-edge-hover", className)}>
      <Search className="size-[var(--icon-md)] shrink-0" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent type-data text-label outline-none placeholder:text-label-placeholder"
      />
    </label>
  );
}

/* ── useQueryState · useQueryParams — a list's selection, filters and view live in
   the URL (VIS-096, COL-07/NAV-07). Written with the native history.replaceState,
   which Next keeps in step with useSearchParams: choosing a row or a filter adds no
   history entry and makes no round trip, yet Back from a detail page restores the list
   as you left it, and a selection can be linked. Each write starts from the live URL,
   so several keys set in one handler all land. A page that reads it sits in <Suspense>. */
function writeQuery(patch: Record<string, string | null>, fallbacks: Record<string, string> = {}) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === "" || v === (fallbacks[k] ?? "")) url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  /* null, as the Next docs do: passing the router's own state object marks the call as
     the router's, and Next then does not bring useSearchParams up to date. */
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

export function useQueryState(key: string, fallback = ""): [string, (v: string | null) => void] {
  const params = useSearchParams();
  const value = params.get(key) ?? fallback;
  const set = useCallback((v: string | null) => writeQuery({ [key]: v }, { [key]: fallback }), [key, fallback]);
  return [value, set];
}

/** Several keys at once: `set({ cat: "Hotel", id: null })`. */
export function useQueryParams(): [URLSearchParams, (patch: Record<string, string | null>) => void] {
  const params = useSearchParams();
  const set = useCallback((patch: Record<string, string | null>) => writeQuery(patch), []);
  return [params as unknown as URLSearchParams, set];
}

/* ── Page ─────────────────────────────────────────────────────────────────────
   Every page has the same side margins: the panel's own padding, on both sides,
   at every width (Constantin, 2026-09-25). The centred 1120 column gave a wide
   panel gutters that no ledger page had, so the Briefing and Notifications sat
   at different distances from the frame. Prose keeps its measure inside the
   column (62ch on the lead, 72ch on a text page), aligned left, never centred.
   The page owns its scroll.                                                     */
export function Page({
  width = "wide", className, fill = false, children,
}: {
  width?: "wide" | "text" | "full";
  className?: string;
  fill?: boolean;
  children: React.ReactNode;
}) {
  const max = { wide: "max-w-none", text: "max-w-[72ch]", full: "max-w-none" }[width];
  return (
    <div className={cn("h-full w-full overflow-y-auto p-[var(--panel-pad)]", className)}>
      <div className={cn("w-full min-w-0", max, fill && "h-full")}>{children}</div>
    </div>
  );
}

/* ── The inspector's own view — an act begun in the card happens in it (VIS-104) ──
   A control inside the inspector (sharing, today) puts its act in the card instead of
   sliding a sheet over it: the card keeps its place and its corners, its header names
   the act with Back beside the close, and the act lays out its own body and foot.
   Back, Escape or choosing another item returns the card to the item, and tells the
   act it was dismissed. Outside a card, useInspector() is null and acts open as sheets. */
export interface InspectorView {
  title: string;
  /** The act: its body and its pinned foot, laid out by the act itself. */
  content: React.ReactNode;
  /** Called when the card goes back to the item without the act finishing. */
  onDismiss?: () => void;
}
const InspectorContext = createContext<{ show: (view: InspectorView | null) => void } | null>(null);
/** Inside an inspector card, the way to show an act in it; outside one, null. */
export function useInspector() { return useContext(InspectorContext); }

/* ── SplitPage — one list-and-detail pattern for every collection (VIS-096) ──
   A catalogue, ledger or queue with an inspector: a card at the frame's right edge,
   on raised paper; on the phone, a bottom sheet. Clicking a row selects it and opens
   the inspector, on every collection and queue. The inspector PREVIEWS the item:
     header   the item's name, "Open ↗" to its full page (`openHref`), and close.
              Opening is a link, never the ink button (VIS-095: ink means do).
     body     what the row cannot show, in the words the full page uses.
     footer   the item's ONE next act (`footer`), pinned to the card's bottom.
   Enter or a double-click on a row opens the full page, as "Open ↗" does.         */
export function SplitPage({
  header, panel, panelOpen, onClosePanel, panelTitle = "Detail", openHref, footer, children,
}: {
  header?: React.ReactNode;
  panel: React.ReactNode;
  panelOpen: boolean;
  onClosePanel: () => void;
  panelTitle?: string;
  /** The item's full page. Rendered as "Open ↗" in the inspector's header. */
  openHref?: string;
  /** The item's one next act, pinned to the bottom of the inspector. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const isDesktop = useIsDesktop();

  /* An act shown in the card (VIS-104). `show` is the act's own way in and out; `back`
     is the card's, and tells the act it was left unfinished. */
  const [view, setView] = useState<InspectorView | null>(null);
  const viewRef = useRef<InspectorView | null>(null);
  const show = useCallback((v: InspectorView | null) => { viewRef.current = v; setView(v); }, []);
  const back = useCallback(() => {
    const v = viewRef.current;
    if (!v) return;
    show(null);
    v.onDismiss?.();
  }, [show]);
  const inspector = useMemo(() => ({ show }), [show]);
  /* another item, or the card closing, ends the act */
  useEffect(() => { back(); }, [panelTitle, openHref, panelOpen, back]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (viewRef.current) back(); else onClosePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, onClosePanel, back]);

  const { s, d } = useDemo();
  /* The right-hand slot holds one card at a time. Choosing an item folds the assistant
     away, so the item shows; opening the assistant closes the item, so a row is never
     left selected under a card that no longer shows it. */
  useEffect(() => {
    if (panelOpen && s.assistantOpen) d({ type: "assistant", open: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen]);
  useEffect(() => {
    if (s.assistantOpen && panelOpen) onClosePanel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.assistantOpen]);
  const open = isDesktop && panelOpen && !s.assistantOpen;

  const openLink = openHref ? (
    <Link
      href={openHref}
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 type-meta text-label-secondary hover:bg-interactive hover:text-label"
    >
      Open <ArrowUpRight className="size-3.5" aria-hidden />
    </Link>
  ) : null;
  const pinned = footer ? (
    <div className="shrink-0 border-t border-hairline px-[var(--space-6)] py-[var(--space-4)]">{footer}</div>
  ) : null;
  const title = view ? view.title : panelTitle;
  const backButton = view ? (
    <IconChrome label="Back" onClick={back} className="-ml-1"><ArrowLeft aria-hidden /></IconChrome>
  ) : null;

  return (
    <div className="flex h-full min-h-0 w-full">
      {/* With the card open the column gives it the room: the card is 400 wide and inset
          4 from the panel edge, with 20 of air between the column’s scrollbar and the
          card. The column keeps its own padding inside that. */}
      <div className={cn("min-w-0 flex-1 overflow-y-auto p-[var(--panel-pad)]", open && "mr-[424px]")}>
        {header}
        {children}
      </div>

      {/* The inspector is a card that fits on the right, not a column that opens from
          the frame edge (Constantin, 2026-09-25): the panel’s full height, inset 12 from
          its edges, its own corners and shadow, white on the glass, the close in its
          top-right corner. It is placed against the panel itself (the Shell’s <main> is
          the positioned box), so it rises above the top bar, which draws in to its left
          (.frame-bar, globals.css). Its corners are concentric with the panel’s: the
          panel stays radius-4 (16) and the card takes radius-3 (12), so it sits 16 − 12 = 4
          inside the panel and the two curves run parallel (Constantin, 2026-09-25). */}
      {open && (
        <aside
          aria-label={title}
          data-inspector
          className="inspector-in absolute top-[var(--space-1)] right-[var(--space-1)] bottom-[var(--space-1)] z-10 flex w-[400px] flex-col overflow-hidden rounded-lg bg-raised shadow-elev-3"
        >
          <InspectorContext.Provider value={inspector}>
            <div className="flex shrink-0 items-center justify-between gap-[var(--space-3)] px-[var(--space-6)] pt-[var(--space-6)] pb-[var(--space-2)]">
              <div className="flex min-w-0 items-center gap-[var(--space-2)]">
                {backButton}
                <span className="min-w-0 truncate type-section">{title}</span>
              </div>
              <div className="-mr-1 flex shrink-0 items-center gap-1">
                {!view && openLink}
                <IconChrome label="Close panel" onClick={onClosePanel}>
                  <X aria-hidden />
                </IconChrome>
              </div>
            </div>
            {view ? (
              <div className="flex min-h-0 flex-1 flex-col">{view.content}</div>
            ) : (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-6)] pt-[var(--space-2)] pb-[var(--space-6)]">{panel}</div>
                {pinned}
              </>
            )}
          </InspectorContext.Provider>
        </aside>
      )}

      {!isDesktop && (
        <Sheet open={panelOpen} onOpenChange={(o) => { if (!o) onClosePanel(); }}>
          <SheetContent side="bottom" showCloseButton={false} className="max-h-[85dvh] gap-0 p-0">
            <InspectorContext.Provider value={inspector}>
              <SheetTitle asChild><span className="sr-only">{title}</span></SheetTitle>
              <div className="flex items-center justify-between gap-2 border-b border-hairline px-[var(--space-6)] py-[var(--space-3)]">
                <div className="flex min-w-0 items-center gap-[var(--space-2)]">
                  {backButton}
                  <span className="truncate type-section">{title}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!view && openLink}
                  <IconChrome label="Close panel" onClick={onClosePanel}><X aria-hidden /></IconChrome>
                </div>
              </div>
              {view ? (
                <div className="flex min-h-0 flex-1 flex-col">{view.content}</div>
              ) : (
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto p-[var(--space-6)] pb-[var(--space-8)]">{panel}</div>
                  {pinned}
                </>
              )}
            </InspectorContext.Provider>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

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

/* ── ActionBar — a detail page's primary, in reach under 1024 (NAV-08) ─────────
   Below lg the rail that holds a page's one primary becomes an appendix at the end of
   the page. The ActionBar repeats that primary in a bar pinned to the bottom of the
   scroll, so it is visible on arrival at every width. Hidden at lg and above, where the
   rail follows you. Put it last inside <Page>. */
export function ActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      data-slot="action-bar"
      className={cn(
        "sticky bottom-0 z-10 -mx-[var(--panel-pad)] mt-[var(--space-6)] flex items-center justify-end gap-[var(--space-2)] border-t border-hairline bg-raised px-[var(--panel-pad)] py-[var(--space-3)] lg:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── ViewToggle — Grid or Table, at the toolbar's far right (VIS-095) ───────────
   A lens, not an act, so it never wears the area's fill: icon-only segments in a
   sunken track, the chosen one raised onto paper (the row's lift, VIS-093). The
   selected segment differs by surface and shadow, not colour (tier 2).           */
const VIEW_OPTIONS = [
  { value: "grid" as const, label: "Grid", icon: LayoutGrid },
  { value: "table" as const, label: "Table", icon: Rows3 },
];

export function ViewToggle({
  value, onChange, className,
}: { value: "grid" | "table"; onChange: (v: "grid" | "table") => void; className?: string }) {
  return (
    <div role="radiogroup" aria-label="View" className={cn("inline-flex items-center gap-0.5 rounded-md bg-sunken p-0.5", className)}>
      {VIEW_OPTIONS.map((o) => {
        const on = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            title={o.label}
            onClick={() => onChange(o.value)}
            className={cn(
              "grid h-6 w-7 cursor-pointer place-items-center rounded-sm transition-[background-color,box-shadow,color] duration-200",
              on ? "bg-raised text-label shadow-elev-lift" : "text-label-tertiary hover:text-label",
            )}
          >
            <Icon className="size-[var(--icon-md)]" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

/* ── PropertyImage ──────────────────────────────────────────────────────────────
   A picture where the record has one, the generated plate where it does not.
   The images are GENERATED, not photographed: the properties are fictional and
   the product attaches invented commission rates to them. Each is produced from
   a fixed seed so the same record always yields the same picture.               */

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

/** The generated plate's proportions (its viewBox, 320 × 200). */
const PLATE_ASPECT = 1.6;

export function PropertyImage({
  id, name, category, className, src, onAspect,
}: {
  id: string;
  name?: string;
  category?: string;
  className?: string;
  src?: string;
  /** Called with the picture's width ÷ height once it is known, so a gallery can give
      each view its own shape instead of cropping it to a common one. */
  onAspect?: (aspect: number) => void;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const photo = src ?? `/records/${id}.jpg`;

  if (!photoFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={name ? `${name} — property photograph` : ""}
        loading="lazy"
        onLoad={(e) => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
          if (w && h) onAspect?.(w / h);
        }}
        onError={() => { setPhotoFailed(true); onAspect?.(PLATE_ASPECT); }}
        className={cn("size-full object-cover", className)}
      />
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

/* ── PropertyGallery — every view side by side, none cropped (2026-09-28) ───────
   Constantin: keep the gallery low, but show the views whole. The views sit in one
   row at one height, each at its own proportions: a tile's share of the row's width
   is its width ÷ height (flex-grow), and its aspect-ratio keeps every height equal, so
   the row fills the column and nothing is cut. The row always reaches the column's
   right edge, as the header's actions do (Constantin, 2026-09-28: a row that stopped
   short at 300px tall looked unfinished). Its height follows the width, about 300 to
   360 on a desktop; past ROW_MAX_H, on a very wide screen, the row stays that height
   and every view gives up the same thin band top and bottom rather than one view
   being cut. On a phone, three views cannot share 343px, so the row keeps a fixed
   height and scrolls sideways. Radius-5, 2px gaps, imagery scales 1.04 on hover.
   Replaces the mosaic (one view large, two stacked beside it), which cropped every
   view to the box it was given. A view opens whole in the lightbox.               */
const ROW_MAX_H = 360;

export function PropertyGallery({
  id, name, category, className,
}: { id: string; name?: string; category?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const views = [`/records/${id}.jpg`, `/records/${id}-2.jpg`, `/records/${id}-3.jpg`];
  /* The seeded views are 1.6 then 4:3; each is replaced by its measured shape on load. */
  const [aspects, setAspects] = useState<number[]>([PLATE_ASPECT, 4 / 3, 4 / 3]);
  const measured = (i: number) => (a: number) =>
    setAspects((prev) => (Math.abs(prev[i] - a) < 0.005 ? prev : prev.map((x, j) => (j === i ? a : x))));
  const openAt = (i: number) => { setAt(i); setOpen(true); };
  const step = (n: number) => setAt((v) => (v + n + views.length) % views.length);

  return (
    <>
      <div className={cn("flex gap-[2px] overflow-x-auto rounded-2xl sm:overflow-hidden", className)}>
        {views.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => openAt(i)}
            aria-label={`${name ?? "Property"} — view ${i + 1} of ${views.length}`}
            style={{ aspectRatio: String(aspects[i]), flexGrow: aspects[i], maxHeight: ROW_MAX_H }}
            className="img-hover group relative h-52 min-w-0 shrink-0 cursor-pointer overflow-hidden bg-sunken sm:h-auto sm:shrink sm:basis-0"
          >
            <PropertyImage id={id} name={name} category={category} src={src} onAspect={measured(i)} />
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(96vw,1100px)] gap-[var(--space-4)]">
          <DialogHeader>
            <DialogTitle>{name ?? "Property"}</DialogTitle>
            <DialogDescription>
              Generated view {at + 1} of {views.length}. The properties in this directory are fictional; the imagery is generated and depicts no real business.
            </DialogDescription>
          </DialogHeader>
          {/* The view whole, at its own shape, never taller than the screen allows. */}
          <div
            className="mx-auto max-h-[70dvh] max-w-full overflow-hidden rounded-2xl bg-sunken"
            style={{ aspectRatio: String(aspects[at]), width: `min(100%, calc(70dvh * ${aspects[at].toFixed(3)}))` }}
          >
            <PropertyImage id={id} name={name} category={category} src={views[at]} />
          </div>
          <div className="flex items-center gap-[var(--space-2)]">
            <Button variant="secondary" size="sm" onClick={() => step(-1)}>Previous</Button>
            <Button variant="secondary" size="sm" onClick={() => step(1)}>Next</Button>
            <span className="ml-auto type-meta tnum">{at + 1} / {views.length}</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
