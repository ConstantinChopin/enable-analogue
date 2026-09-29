"use client";
/**
 * AppShell — the session gate, the dock, and the invisible presenter layer.
 *
 * Per review 01 §1 and §7: no banner, no world switch, no persona switch, no
 * presenter rail. The demo machinery survives in two places only — the sign-in
 * screen (which sits outside the product) and a keyboard layer here that renders
 * nothing unless invoked. The narration overlay (presenter notes on every page, and
 * its marker) was removed on 2026-09-25: notes about the product do not belong in it.
 */
import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FlaskConical, History } from "lucide-react";
import { useDemo, allTrips, type Action, type DemoState } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Dock } from "@/components/dock";
import { QuietLoading } from "@/components/bits";
import { AssistantButton, AssistantCard } from "@/components/assistant";
import { SupplierReplies } from "@/components/supplier-replies";
import { productById, travellerCards, commissions, candidates, type Persona } from "@/data/seed";
import { areaFor } from "@/lib/areas";

/* ── the frame bar: back · forward · breadcrumb, outside the panel ── */

const sectionLabel: Record<string, string> = {
  briefing: "Briefing",
  notifications: "Notifications",
  ask: "Conversations",
  records: "Records",
  travellers: "Travellers",
  commissions: "Commissions",
  itineraries: "Itineraries",
  knowledge: "Knowledge",
  notices: "Notices",
  ops: "Operations",
  admin: "Administration",
  resolution: "Unmatched payments",
  publish: "Publish queue",
  connections: "Connections",
  review: "Confirm records",
  settings: "Settings",
  system: "The system",
  lab: "Lab",
};

/** Resolve a dynamic segment to the name of the thing it is. */
function entityLabel(section: string, id: string, s: DemoState): string {
  if (section === "records") return productById(id)?.name ?? id;
  if (section === "travellers") return travellerCards.find((t) => t.id === id)?.name ?? id;
  if (section === "commissions") return commissions.find((c) => c.id === id)?.property ?? id;
  if (section === "review") return candidates.find((c) => c.id === id)?.name ?? id;
  if (section === "itineraries") return allTrips(s).find((t) => t.id === id)?.title ?? id;
  return sectionLabel[id] ?? id;
}

/** Each level of the path, named, with the address of that level (NAV-07). */
function crumbFor(pathname: string, s: DemoState): { label: string; href: string }[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return [{ label: "Briefing", href: "/briefing" }];
  const out: { label: string; href: string }[] = [];
  /* Pages behind the account start at the account, as the dock lights it. */
  if (parts[0] === "settings" || parts[0] === "connections") out.push({ label: "Account", href: "/settings" });
  parts.forEach((part, i) => {
    if (part === "admin" || part === "ops") return;            // grouping only, not a place
    const href = "/" + parts.slice(0, i + 1).join("/");
    const known = sectionLabel[part];
    if (known) { out.push({ label: known, href }); return; }
    const parent = parts[i - 1] ?? "";
    out.push({ label: entityLabel(parent, part, s), href });
  });
  return out.length ? out : [{ label: "Briefing", href: "/briefing" }];
}

/* The bar lives in the panel's top edge (Constantin, 2026-09-25): no strip of its own
   above the frame, just the smallest chrome. Back is a tiny circle and each crumb a tiny
   pill, on the faintest surface. Every crumb but the last is a link to its level, so the
   bar follows the product's structure; Back follows history (NAV-07). Forward went: a
   browser's own forward does that, and two arrows read as the product's navigation. */
function FrameBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { s, d } = useDemo();
  const crumbs = crumbFor(pathname, s);
  const btn = "pressable grid size-6 cursor-pointer place-items-center rounded-full bg-faint text-label-secondary hover:bg-interactive hover:text-label";
  return (
    <div className="frame-bar box-content flex h-6 shrink-0 items-center gap-1 px-[var(--space-4)] pt-[var(--space-4)]">
      <button onClick={() => router.back()} className={btn} aria-label="Back"><ArrowLeft className="size-3" /></button>
      <nav aria-label="Breadcrumb" className="ml-1 flex min-w-0 items-center gap-1">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          const pill = "flex h-6 min-w-0 items-center truncate rounded-full bg-faint px-2.5 type-meta";
          return last ? (
            <span key={`${c.href}-${i}`} aria-current="page" className={cn(pill, "text-label")}>{c.label}</span>
          ) : (
            <Link key={`${c.href}-${i}`} href={c.href} className={cn(pill, "text-label-secondary hover:bg-interactive hover:text-label")}>{c.label}</Link>
          );
        })}
      </nav>

      {/* The vintage marker lives in the frame, not on the screens. It was marked on
          one surface and not the others, so pressing V on Ask made the product look
          like it gave two answers to one question — a bug, not an iteration. Here it
          is true everywhere at once, and no screen has to caption its own failure. */}
      {/* The lab: the itinerary builder on trial (docs/rebuild/06-itinerary-builder.md).
          Switching back keeps the page. */}
      {s.lab && (
        <button
          type="button"
          onClick={() => d({ type: "lab", on: false })}
          className="ml-auto flex h-6 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-faint px-2.5 type-meta text-label-secondary hover:bg-interactive hover:text-label"
        >
          <FlaskConical className="size-3" aria-hidden />
          Lab · the itinerary builder · switch to live
        </button>
      )}
      {s.world === "v1" && (
        <span
          className="ml-auto mr-1 flex h-[var(--chip-h)] shrink-0 items-center gap-1.5 rounded-full bg-crit-soft px-2.5 type-meta text-crit"
          role="status"
        >
          <History className="size-3" aria-hidden />
          March build — superseded
        </span>
      )}
    </div>
  );
}

type Dispatch = React.Dispatch<Action>;
type Router = ReturnType<typeof useRouter>;

/* ── route scoping ────────────────────────────────────────────────
   Which roles a surface exists for. A path not listed is open to every
   signed-in role. Kept beside the dock's tile list deliberately: if the two
   ever disagree, a tile leads somewhere that bounces, which is worse than
   either alone. */
/* Every surface is shared except the owner's three acts: confirming a record,
   publishing to the whole agency, and matching money nobody claimed. */
const routeRoles: { prefix: string; roles: Persona[] }[] = [
  { prefix: "/admin", roles: ["owner"] },
  { prefix: "/ops", roles: ["owner"] },
];

const roleHome: Record<Persona, string> = {
  user: "/briefing",
  owner: "/briefing",
};

function allowedRoles(pathname: string): Persona[] | null {
  const hit = routeRoles.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  return hit ? hit.roles : null;
}

/** Demo checkpoints. A persona change is now a sign-in, not a toggle. */
const checkpoints: { key: string; label: string; go: (r: Router, d: Dispatch) => void }[] = [
  { key: "1", label: "morning", go: (r, d) => { d({ type: "signIn", role: "user" }); d({ type: "world", world: "v2" }); r.push("/briefing"); } },
  { key: "2", label: "commission", go: (r, d) => { d({ type: "signIn", role: "user" }); r.push("/commissions/vo"); } },
  { key: "3", label: "record", go: (r, d) => { d({ type: "signIn", role: "user" }); d({ type: "world", world: "v2" }); r.push("/records/maison-leandre"); } },
  { key: "4", label: "ask", go: (r) => { r.push("/ask?c=leandre-rate"); } },
  { key: "5", label: "refusal", go: (r) => { r.push("/ask?state=refusal"); } },
  { key: "6", label: "v1 rewind", go: (r, d) => { d({ type: "world", world: "v1" }); r.push("/records/maison-leandre"); } },
  { key: "7", label: "traveller", go: (r, d) => { d({ type: "world", world: "v2" }); r.push("/travellers/s-marchetti"); } },
  { key: "8", label: "admin confirm", go: (r, d) => { d({ type: "signIn", role: "owner" }); r.push("/admin/review/sereno"); } },
  { key: "0", label: "reset", go: (r, d) => { d({ type: "reset" }); r.push("/briefing"); } },
];

/** Keys are ignored while text is being entered or a dialog owns the screen. */
function typingOrDialog(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  if (t) {
    const tag = t.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable) return true;
  }
  return Boolean(document.querySelector('[role="dialog"][data-state="open"]'));
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { s, d } = useDemo();
  const pathname = usePathname();
  const router = useRouter();
  const onSignIn = pathname === "/signin";
  const panelHere = s.assistantOpen && !pathname.startsWith("/ask");
  /* Outside the product too: the clickable roadmap (/roadmap) and the door that enters the
     prototype as someone (/door). No frame, no sign-in redirect. */
  const outside = pathname.startsWith("/roadmap") || pathname === "/door";

  /* The current area is written as data-area on <html>, so the canvas, the selected
     controls, the primary and every portal (menus, sheets, tooltips, toasts) wear it. */
  useEffect(() => {
    const html = document.documentElement;
    const area = areaFor(pathname);
    if (area) html.dataset.area = area; else delete html.dataset.area;
  }, [pathname]);

  /* The store rehydrates from sessionStorage in an effect, and a child's effect runs
     before the provider's. Settle one tick later so a mid-demo reload is not read as
     a signed-out session and bounced to sign-in. */
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!settled || outside) return;
    if (!s.signedIn && !onSignIn) router.replace("/signin");
    if (s.signedIn && onSignIn) router.replace("/briefing");
  }, [settled, s.signedIn, onSignIn, outside, router]);

  /* Role scoping is a product claim, not a nav convenience: a surface a role cannot
     use does not exist for them. Hiding the dock tile is not enough — the route has
     to hold when the URL is typed, or the claim is only true of the menu. */
  useEffect(() => {
    if (!settled || !s.signedIn) return;
    const allowed = allowedRoles(pathname);
    if (allowed && !allowed.includes(s.role)) router.replace(roleHome[s.role]);
  }, [settled, s.signedIn, s.role, pathname, router]);

  /* ── Invisible presenter layer ── */
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;   /* ⌘1…⌘7 belong to the dock */
    if (typingOrDialog(e)) return;
    const k = e.key.toLowerCase();
    if (k === "v") { d({ type: "world", world: s.world === "v2" ? "v1" : "v2" }); return; }
    if (k === "l") { d({ type: "lab" }); return; }
    const cp = checkpoints.find((c) => c.key === e.key);
    if (cp) { e.preventDefault(); cp.go(router, d); }
  }, [router, d, s.world]);

  useEffect(() => {
    if (onSignIn || outside) return;
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey, onSignIn, outside]);

  /* Sign-in sits outside the product: no dock, no page chrome, no presenter keys. */
  if (onSignIn || outside) return <>{children}</>;

  /* While the store rehydrates — and while a session-less route is being replaced —
     the frame is drawn and the panel carries the one loading treatment. A blank
     screen on reload reads as a broken build, which is the wrong first impression
     for a product whose argument is that nothing is hidden. */
  if (!settled || !s.signedIn) {
    return (
      <div className="canvas h-dvh overflow-hidden bg-base p-[var(--frame-inset)]">
        <div className="flex h-full flex-col gap-[var(--frame-inset)]">
          <div
            className="min-h-0 flex-1 overflow-hidden rounded-xl frame-surface"
          >
            <QuietLoading note="Restoring the session. The workspace draws once who you are is settled." />
          </div>
          <div className="h-[var(--dock-row)] shrink-0" aria-hidden />
        </div>
      </div>
    );
  }

  return (
    <div className="canvas h-dvh overflow-hidden bg-base p-[var(--frame-inset)] transition-colors duration-300">
      {/* The frame: a breadcrumb strip outside the border, a panel that owns its own
          scroll, and the dock floating over the inset below. The page never scrolls. */}
      <div className="flex h-full flex-col gap-[var(--frame-inset)]">
        <main
          /* The frame does not scroll — each page owns its scroll, so an inspector can
             be a genuinely full-height column beside content that scrolls independently.
             The bar sits in its top edge. */
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl frame-surface"
        >
          <FrameBar />
          {/* The assistant's card takes the right-hand slot on every page but one, and the
              page gives it the room on a wide screen, as it does for an inspector. On
              Conversations the page IS the assistant at full size, so the card does not
              draw there (AI-02, VIS-100). */}
          <div className={cn("min-h-0 flex-1", panelHere && "lg:mr-[424px]")}>{children}</div>
          {panelHere && <AssistantCard />}
        </main>
        {/* The dock's own row — the panel ends above it, so the border truly
            excludes the dock rather than being overlapped by it. The dock is 48 tall,
            12 from the bottom; this row is 42, so the panel ends 6 above the dock
            (tightened 2026-09-25). */}
        <div className="h-[var(--dock-row)] shrink-0" aria-hidden />
      </div>

      <Dock />
      <AssistantButton />
      {s.lab && <SupplierReplies />}

    </div>
  );
}
