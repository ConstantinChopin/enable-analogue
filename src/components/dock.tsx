"use client";
/**
 * The dock — the product's only persistent chrome.
 *
 * Per layout-exploration §4 and §10: fixed at the bottom, a badge on Notifications
 * alone, and a utility cluster (search · sync · account) behind a divider. A tile is a
 * place you work, not a place you configure — settings and connections live behind the
 * account.
 *
 * The dock never moves (VIS-095, 2026-09-28): every tile is the same circle, so arriving
 * somewhere shifts nothing and a place is always where the hand left it. The place you
 * are is the circle filled in its area's colour; the page's title names it. A hairline
 * separates the area groups, so the colour code has a visible structure. The badge
 * counts what waits on you and has not been seen; it is ink, and claret only when one of
 * those is Critical (VIS-097).
 */
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, unseenCount, canViewCommissions } from "@/lib/store";
import { areaFor } from "@/lib/areas";
import { SearchPalette } from "@/components/assistant";
import type { Persona } from "@/data/seed";
/* Identity — name, role label and initials — comes from the seed, never from a
   second map here. Two label maps produced two spellings of the same role. */
import { personInitials, personName, roleLabel } from "@/data/seed";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sunrise, Bell, Building2, Users, Route as RouteIcon, Archive,
  Search, RefreshCw, ClipboardCheck, Send, Scale, Wallet,
} from "lucide-react";

/* ── Geometry. Pages clear the dock using DOCK_CLEARANCE (see layouts.tsx). ── */
export const DOCK_TILE = 36; /* 44 under a finger: --dock-tile */
/** Distance from the viewport's bottom edge to the dock's own bottom edge. */
export const DOCK_GAP = 16;

export interface DockTile {
  href: string;
  label: string;
  icon: React.ElementType;
}

const T = {
  briefing: { href: "/briefing", label: "Briefing", icon: Sunrise },
  notifications: { href: "/notifications", label: "Notifications", icon: Bell },
  records: { href: "/records", label: "Records", icon: Building2 },
  travellers: { href: "/travellers", label: "Travellers", icon: Users },
  itineraries: { href: "/itineraries", label: "Itineraries", icon: RouteIcon },
  knowledge: { href: "/knowledge", label: "Knowledge", icon: Archive },
  /* The work these two roles actually do all day. Both were reachable only through a
     briefing widget or a notification, so the dock offered the lead and the ops person
     tiles they may never open and nothing for their own job. */
  confirm: { href: "/admin/review", label: "Confirm records", icon: ClipboardCheck },
  publish: { href: "/admin/publish", label: "Publish queue", icon: Send },
  resolution: { href: "/ops/resolution", label: "Unmatched payments", icon: Scale },
  commissions: { href: "/commissions", label: "Commissions", icon: Wallet },
} satisfies Record<string, DockTile>;

/* Per-role tile sets, ordered by area, with a hairline between areas (VIS-095, reversing
   "one spacing throughout" of 2026-09-25: ten unlabelled circles need the groups drawn)
   (src/lib/areas.ts; the permission story you can see at a glance, §10.7, §10b). The areas are the same for both roles; the ORDER is the role.
   The advisor's day leads with her clients; the owner's with the agency's knowledge,
   her three acts first inside the areas they change. Commissions joins both docks:
   without it the advisor had no Money area at all. */
export const areaDock: Record<Persona, DockTile[][]> = {
  user: [
    [T.briefing, T.notifications],
    [T.travellers, T.itineraries],
    [T.records, T.knowledge],
    [T.commissions],
  ],
  owner: [
    [T.briefing, T.notifications],
    [T.confirm, T.publish, T.records, T.knowledge],
    [T.resolution, T.commissions],
    [T.travellers, T.itineraries],
  ],
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/** The shortcut's modifier as this machine names it (⌘ while rendering on the server). */
const noSubscribe = () => () => {};
function useModifier() {
  return React.useSyncExternalStore(
    noSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl+"),
    () => "⌘",
  );
}

/* ── One workspace tile ── */
function Tile({ tile, active, badge, critical, index, mod }: {
  tile: DockTile; active: boolean; badge?: number; critical?: boolean; index: number; mod: string;
}) {
  const Icon = tile.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={tile.href}
          aria-label={badge ? `${tile.label}, ${badge} new` : tile.label}
          aria-current={active ? "page" : undefined}
          className="group relative flex shrink-0 flex-col items-center"
        >
          {/* Every tile is the same circle; the place you are is filled in its area's
              colour. Nothing widens, so nothing moves. */}
          <span
            style={{ "--tile-hover": `var(--area-${areaFor(tile.href) ?? "today"}-subtle)` } as React.CSSProperties}
            className={cn(
              "pressable relative flex size-[var(--dock-tile)] items-center justify-center rounded-full transition-colors duration-200",
              active
                ? "bg-selected text-on-selected"
                : "text-label-secondary hover:bg-[var(--tile-hover,var(--sys-fill-interactive))] hover:text-label",
            )}
          >
            <Icon className="size-[17px] shrink-0" aria-hidden />
            {badge ? (
              <span
                className={cn("absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full px-1 type-meta tnum ring-2 ring-overlay", critical ? "bg-crit text-on-ink" : "bg-ink text-on-ink")}
                aria-hidden
              >
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
          </span>
        </Link>
      </TooltipTrigger>
      {/* The tooltip previews the place: it wears the colour of the area the tile leads to
          (2026-09-25). A place outside every area keeps the ordinary tooltip ink. */}
      <TooltipContent
        side="top"
        sideOffset={10}
        style={{ backgroundColor: `var(--area-${areaFor(tile.href) ?? "today"}-solid, var(--sys-ink))` }}
      >
        {tile.label}
        {badge ? ` · ${badge} new` : ""}
        {index < 9 && <span className="ml-2 text-on-selected/60">{mod}{index + 1}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

function UtilityButton({
  label, onClick, children,
}: { label: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="pressable grid size-[var(--dock-tile)] shrink-0 cursor-pointer place-items-center rounded-full text-label-secondary hover:bg-interactive hover:text-label"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={10}>{label}</TooltipContent>
    </Tooltip>
  );
}

export function Dock() {
  const { s, d } = useDemo();
  const pathname = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);

  /* Grouped by area; money is absent, not masked, without the entitlement. Ask is not a
     tile: it is the assistant, in the corner of every screen (live 2026-09-25). */
  const groups = (areaDock[s.role] ?? areaDock.user)
    .map((g) => g.filter((t) => t.href !== "/commissions" || canViewCommissions(s)))
    .filter((g) => g.length > 0);
  const tiles = groups.flat();
  const mod = useModifier();
  /* Pages behind the account (Settings, Connections) light the account, the way a
     tile lights for its place: every page shows where it sits. */
  const accountHere = pathname.startsWith("/settings") || pathname.startsWith("/connections");

  /* The canvas glow sits behind the tile of the place you are (2026-09-25):
     the dock writes that tile’s centre to <html> as --glow-x / --glow-y, and the
     gradient centres there. Re-measured when the row changes size, since the active
     pill’s label eases open and moves every tile after it. */
  const navRef = React.useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const html = document.documentElement;
    const place = () => {
      const pill = nav.querySelector<HTMLElement>('[aria-current="page"] > span');
      if (!pill) { html.style.removeProperty("--glow-x"); html.style.removeProperty("--glow-y"); return; }
      const r = pill.getBoundingClientRect();
      html.style.setProperty("--glow-x", `${Math.round(r.left + r.width / 2)}px`);
      html.style.setProperty("--glow-y", `${Math.round(r.top + r.height / 2)}px`);
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(nav);
    window.addEventListener("resize", place);
    return () => { ro.disconnect(); window.removeEventListener("resize", place); };
  }, [pathname, s.role]);

  /* Badge: what waits on this person and has not been seen. An item whose subject was
     dealt with elsewhere is resolved, and leaves the count (store `inboxState`). */
  const unseen = useMemo(() => unseenCount(s), [s]);

  /* ⌘K palette · ⌘1…⌘7 workspace jumps. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "k") { e.preventDefault(); setPaletteOpen((o) => !o); return; }
      /* ⌘J: the assistant, as in Notion */
      if (k === "j") { e.preventDefault(); d({ type: "assistant", open: !s.assistantOpen }); return; }
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= Math.min(9, tiles.length)) {
        e.preventDefault();
        router.push(tiles[n - 1].href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, tiles, s.assistantOpen, d]);

  return (
    <TooltipProvider delayDuration={200}>
      <SearchPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3">
        <nav
          ref={navRef}
          aria-label="Workspaces"
          /* Seven 44px tiles plus the account do not fit 375px, and shrinking them
             would drop below the 44pt touch minimum the iOS thesis rests on. So the
             dock scrolls — and the edge fade says so. Without it the row simply ended
             mid-tile and read as clipped chrome rather than a scrollable one. */
          className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full glass p-1.5 [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent_0,#000_12px,#000_calc(100%-12px),transparent_100%)] sm:[mask-image:none] [&::-webkit-scrollbar]:hidden"
        >
          {groups.map((g, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <span className="mx-0.5 h-5 w-px shrink-0 self-center bg-hairline" aria-hidden />}
              <div role="group" className="flex items-center gap-1">
                {g.map((t) => (
                  <Tile
                    key={t.href}
                    tile={t}
                    index={tiles.indexOf(t)}
                    mod={mod}
                    active={isActive(pathname, t.href)}
                    badge={t.href === "/notifications" ? unseen.count : undefined}
                    critical={t.href === "/notifications" && unseen.critical}
                  />
                ))}
              </div>
            </React.Fragment>
          ))}

          <span className="mx-1 h-8 w-px shrink-0 self-center bg-hairline" aria-hidden />

          <div className="flex shrink-0 items-center gap-0.5 self-center">
            {/* Search and the sync indicator drop below `sm`. Seven tiles plus three
                utilities exceed 375px, and the dock scrolled — which clipped the account
                avatar and read as a broken control rather than a scrollable one. Neither
                is lost: ⌘K still opens the palette, and the sync time is in Settings.
                The account stays, because signing out has to be reachable. */}
            <span className="hidden sm:contents">
              <UtilityButton label={`Search — ${mod}K`} onClick={() => setPaletteOpen(true)}>
                <Search className="size-[17px]" aria-hidden />
              </UtilityButton>

              <UtilityButton label="Synced 12:04">
                <RefreshCw className="size-[17px]" aria-hidden />
              </UtilityButton>
            </span>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Account"
                      aria-current={accountHere ? "page" : undefined}
                      className={cn(
                        "pressable grid size-[var(--dock-tile)] shrink-0 cursor-pointer place-items-center rounded-full type-meta",
                        accountHere ? "bg-selected text-on-selected" : "bg-sunken text-label hover:bg-interactive-hover",
                      )}
                    >
                      {personInitials[s.role]}
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={10}>{personName[s.role]}</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" side="top" sideOffset={10} className="w-56">
                <DropdownMenuLabel className="pb-2">
                  <div className="type-data-strong">{personName[s.role]}</div>
                  <div className="type-meta">{roleLabel[s.role]}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push("/settings")}>Settings</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push("/connections")}>
                  Connections
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => { d({ type: "signOut" }); router.replace("/signin"); }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}
