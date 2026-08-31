"use client";
/**
 * The dock — the product's only persistent chrome.
 *
 * Per layout-exploration §4 and §10: fixed at the bottom, icon-only with the label
 * on hover, the active tile carrying its label permanently, a running-indicator dot,
 * a badge on Notifications alone, and a utility cluster (search · sync · account)
 * behind a divider. A tile is a place you work, not a place you configure — settings
 * and connections live behind the account.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";
import type { Persona } from "@/data/seed";
/* Identity — name, role label and initials — comes from the seed, never from a
   second map here. Two label maps produced two spellings of the same role. */
import { notifications, personInitials, personName, roleLabel } from "@/data/seed";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Sunrise, Bell, MessageCircle, LayoutGrid, Users, Route as RouteIcon, Archive,
  Search, RefreshCw, ClipboardCheck, Send, Scale,
} from "lucide-react";

/* ── Geometry. Pages clear the dock using DOCK_CLEARANCE (see layouts.tsx). ── */
export const DOCK_TILE = 44;
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
  ask: { href: "/ask", label: "Ask", icon: MessageCircle },
  records: { href: "/records", label: "Records", icon: LayoutGrid },
  travellers: { href: "/travellers", label: "Travellers", icon: Users },
  itineraries: { href: "/itineraries", label: "Itineraries", icon: RouteIcon },
  knowledge: { href: "/knowledge", label: "Knowledge", icon: Archive },
  /* The work these two roles actually do all day. Both were reachable only through a
     briefing widget or a notification, so the dock offered the lead and the ops person
     tiles they may never open and nothing for their own job. */
  confirm: { href: "/admin/review", label: "Confirm records", icon: ClipboardCheck },
  publish: { href: "/admin/publish", label: "Publish queue", icon: Send },
  resolution: { href: "/ops/resolution", label: "Unmatched payments", icon: Scale },
} satisfies Record<string, DockTile>;

/** Per-role tile sets — the permission story you can see at a glance (§10.7, §10b). */
export const dockTiles: Record<Persona, DockTile[]> = {
  advisor: [T.briefing, T.notifications, T.ask, T.records, T.travellers, T.itineraries, T.knowledge],
  colleague: [T.briefing, T.notifications, T.ask, T.records, T.travellers, T.itineraries, T.knowledge],
  lead: [T.briefing, T.notifications, T.confirm, T.publish, T.records, T.knowledge],
  ops: [T.briefing, T.notifications, T.resolution, T.records, T.knowledge],
};

/** ⌘K canned destinations — no live search index in this build. */
const paletteGroups: { heading: string; items: { label: string; href: string }[] }[] = [
  { heading: "Records", items: [
    { label: "Maison Léandre", href: "/records/maison-leandre" },
    { label: "Records directory", href: "/records" },
  ]},
  { heading: "Travellers", items: [{ label: "S. Marchetti", href: "/travellers/s-marchetti" }] },
  { heading: "Notifications", items: [{ label: "Everything needing a decision", href: "/notifications" }] },
  { heading: "Ask", items: [{ label: "Ask a question…", href: "/ask" }] },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/* ── One workspace tile ── */
function Tile({ tile, active, badge, index }: {
  tile: DockTile; active: boolean; badge?: number; index: number;
}) {
  const Icon = tile.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={tile.href}
          aria-label={tile.label}
          aria-current={active ? "page" : undefined}
          className="group relative flex shrink-0 flex-col items-center"
        >
          {/* Every tile is the same 44px square, active or not. The active tile used to
              grow to fit its label, and because the dock is centre-justified the whole
              dock slid sideways on every navigation — 56px between the shortest label
              and the longest, so the tile under the cursor moved as you arrived.
              The label is gone rather than floated: the frame bar's breadcrumb already
              names the current surface, so a permanent dock label said it twice. The
              dock now answers only "where can I go" — active state is the filled tile
              and the indicator dot, and every label is one hover away. */}
          <span
            className={cn(
              "relative flex size-11 items-center justify-center rounded-xl transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            <Icon className="size-[18px] shrink-0" aria-hidden />
            {badge ? (
              <span
                className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-crit px-1 t-micro text-white tnum"
                aria-hidden
              >
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
          </span>
          <span
            className={cn("mt-1 size-1 rounded-full", active ? "bg-foreground/60" : "bg-transparent")}
            aria-hidden
          />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={10}>
        {tile.label}
        {badge ? ` · ${badge} new` : ""}
        <span className="ml-2 opacity-60">⌘{index + 1}</span>
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
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
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

  const tiles = dockTiles[s.role] ?? dockTiles.advisor;

  /* Badge: items addressed to this role whose effective state is still "new". */
  const newForRole = useMemo(
    () =>
      notifications.filter(
        (n) => n.roles.includes(s.role) && (s.notices[n.id] ?? n.defaultState) === "new",
      ).length,
    [s.role, s.notices],
  );

  const go = useCallback((href: string) => { setPaletteOpen(false); router.push(href); }, [router]);

  /* ⌘K palette · ⌘1…⌘7 workspace jumps. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "k") { e.preventDefault(); setPaletteOpen((o) => !o); return; }
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= tiles.length) {
        e.preventDefault();
        router.push(tiles[n - 1].href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, tiles]);

  return (
    <TooltipProvider delayDuration={200}>
      <CommandDialog
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        title="Search everything"
        description="Jump to a record, traveller, or question"
      >
        <CommandInput placeholder="Search records, travellers, questions…" />
        <CommandList>
          <CommandEmpty>Nothing here by that name.</CommandEmpty>
          {paletteGroups.map((g) => (
            <CommandGroup key={g.heading} heading={g.heading}>
              {g.items.map((i) => (
                <CommandItem key={i.href} onSelect={() => go(i.href)}>{i.label}</CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>

      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3">
        <nav
          aria-label="Workspaces"
          /* Seven 44px tiles plus the account do not fit 375px, and shrinking them
             would drop below the 44pt touch minimum the iOS thesis rests on. So the
             dock scrolls — and the edge fade says so. Without it the row simply ended
             mid-tile and read as clipped chrome rather than a scrollable one. */
          className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-border bg-card px-2 py-2 shadow-[0_8px_30px_rgba(28,29,34,0.12)] [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent_0,#000_12px,#000_calc(100%-12px),transparent_100%)] sm:[mask-image:none] [&::-webkit-scrollbar]:hidden"
        >
          {tiles.map((t, i) => (
            <Tile
              key={t.href}
              tile={t}
              index={i}
              active={isActive(pathname, t.href)}
              badge={t.href === "/notifications" ? newForRole : undefined}
            />
          ))}

          <span className="mx-1 h-8 w-px shrink-0 self-center bg-border" aria-hidden />

          <div className="flex shrink-0 items-center gap-0.5 self-center">
            {/* Search and the sync indicator drop below `sm`. Seven tiles plus three
                utilities exceed 375px, and the dock scrolled — which clipped the account
                avatar and read as a broken control rather than a scrollable one. Neither
                is lost: ⌘K still opens the palette, and the sync time is in Settings.
                The account stays, because signing out has to be reachable. */}
            <span className="hidden sm:contents">
              <UtilityButton label="Search — ⌘K" onClick={() => setPaletteOpen(true)}>
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
                      className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-primary-soft t-micro text-primary transition-colors hover:bg-primary/15"
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
                  <div className="t-meta text-muted-foreground">{roleLabel[s.role]}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push("/settings")}>Settings</DropdownMenuItem>
                {s.role === "lead" && (
                  <DropdownMenuItem onSelect={() => router.push("/admin/connections")}>
                    Connections
                  </DropdownMenuItem>
                )}
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
