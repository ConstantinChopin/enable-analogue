"use client";
/**
 * Layout primitives. Every page opens with the same header zone — the page's
 * name (the one serif on the screen) left, actions right — and clears the dock
 * by way of <Page>, which owns the bottom padding.
 */
import React, { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";
import { Segmented, IconChrome } from "@/components/bits";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { X, LayoutGrid, Rows3 } from "lucide-react";

/* ── Dock clearance ──────────────────────────────────────────────────────────── */
export const DOCK_FOOTPRINT = 84;
export const DOCK_CLEARANCE = "pb-[112px]";

/* ── PageHeader ───────────────────────────────────────────────────────────────
   The title row: the page's name, and its text actions right-aligned (Airbnb's
   title row carries Share · Save as text). The primary never lives here; it sits
   at the bottom of the tool that owns it.                                       */
/* ── PageHeader — the title-row rule (Constantin, 2026-09-25) ─────────────────
   The title row holds the title, WHAT YOU ARE LOOKING AT, and the page's acts:
   a state or view switch (Open · Actioned · Deferred, Open · Overdue · Paid, Grid ·
   Table) and the actions go in `actions`, on the title's line, at the right. The line
   below holds only what NARROWS the list: tags, sources, facets, search.            */
export function PageHeader({
  back, crumb, title, actions, children, className,
}: {
  back?: boolean | string;
  crumb?: React.ReactNode;
  title: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  void back; void crumb;
  return (
    <header className={cn("mb-[var(--gap-2)]", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-[var(--space-4)] gap-y-[var(--space-2)]">
        <h1 className="type-title-page flex min-w-0 flex-wrap items-center gap-[var(--space-3)]">{title}</h1>
        {actions && <div className="flex flex-wrap items-center gap-[var(--space-2)]">{actions}</div>}
      </div>
      {children}
    </header>
  );
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

/* ── SplitPage ───────────────────────────────────────────────────────────────
   A catalogue or ledger with an inspector: a full-height column at the frame's
   right edge, on raised paper behind a hairline. On the phone, a bottom sheet. */
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

  const { s, d } = useDemo();
  /* The right-hand slot holds one card at a time: choosing an item folds the assistant
     away, so the item shows. */
  useEffect(() => {
    if (panelOpen && s.assistantOpen) d({ type: "assistant", open: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen]);
  const open = isDesktop && panelOpen && !s.assistantOpen;

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
          aria-label={panelTitle}
          data-inspector
          className="inspector-in absolute top-[var(--space-1)] right-[var(--space-1)] bottom-[var(--space-1)] z-10 flex w-[400px] flex-col overflow-hidden rounded-lg bg-raised shadow-elev-3"
        >
            <div className="flex shrink-0 items-start justify-between gap-[var(--space-3)] px-[var(--space-6)] pt-[var(--space-6)] pb-[var(--space-2)]">
              <span className="min-w-0 truncate type-section">{panelTitle}</span>
              <IconChrome label="Close panel" onClick={onClosePanel} className="-mt-0.5 -mr-1">
                <X aria-hidden />
              </IconChrome>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-6)] pt-[var(--space-2)] pb-[var(--space-6)]">{panel}</div>
        </aside>
      )}

      {!isDesktop && (
        <Sheet open={panelOpen} onOpenChange={(o) => { if (!o) onClosePanel(); }}>
          <SheetContent side="bottom" showCloseButton={false} className="max-h-[85dvh] gap-0 p-0">
            <SheetTitle asChild><span className="sr-only">{panelTitle}</span></SheetTitle>
            <div className="flex items-center justify-between gap-2 border-b border-hairline px-[var(--space-6)] py-[var(--space-3)]">
              <span className="truncate type-section">{panelTitle}</span>
              <IconChrome label="Close panel" onClick={onClosePanel}><X aria-hidden /></IconChrome>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-[var(--space-6)] pb-[var(--space-8)]">{panel}</div>
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

/* ── ViewToggle ─────────────────────────────────────────────────────────────── */
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

export function PropertyImage({
  id, name, category, className, src,
}: {
  id: string;
  name?: string;
  category?: string;
  className?: string;
  src?: string;
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
        onError={() => setPhotoFailed(true)}
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

/* ── PropertyGallery ────────────────────────────────────────────────────────────
   The record's images as a mosaic: one establishing view held large, two closer
   views stacked beside it. Radius-5 (the gallery step), 2px gaps, imagery scales
   1.04 on hover. The reveal is the disclosure pattern: a grey button at the
   content's left edge under the preview (VIS-071).                              */
export function PropertyGallery({
  id, name, category, className,
}: { id: string; name?: string; category?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const views = [`/records/${id}.jpg`, `/records/${id}-2.jpg`, `/records/${id}-3.jpg`];
  const openAt = (i: number) => { setAt(i); setOpen(true); };
  const step = (n: number) => setAt((v) => (v + n + views.length) % views.length);

  const tile = (i: number, extra?: string) => (
    <button
      type="button"
      onClick={() => openAt(i)}
      aria-label={`${name ?? "Property"} — view ${i + 1} of ${views.length}`}
      className={cn("img-hover group relative cursor-pointer overflow-hidden bg-sunken", extra)}
    >
      <PropertyImage id={id} name={name} category={category} src={views[i]} />
    </button>
  );

  return (
    <>
      <div
        className={cn(
          "grid gap-[2px] overflow-hidden rounded-2xl",
          "aspect-[16/10] grid-cols-1 sm:aspect-[2/1] sm:grid-cols-[1.7fr_1fr]",
          className,
        )}
      >
        {tile(0, "size-full")}
        <div className="hidden grid-rows-2 gap-[2px] sm:grid">
          {tile(1)}
          {tile(2)}
        </div>
      </div>

      <div className="mt-[var(--space-3)]">
        <Button variant="secondary" size="sm" onClick={() => openAt(0)}>
          Show all {views.length} photos
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(96vw,1100px)] gap-[var(--space-4)]">
          <DialogHeader>
            <DialogTitle>{name ?? "Property"}</DialogTitle>
            <DialogDescription>
              Generated view {at + 1} of {views.length}. The properties in this directory are fictional; the imagery is generated and depicts no real business.
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-sunken">
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
