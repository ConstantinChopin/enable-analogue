"use client";
/**
 * AppShell — the session gate, the dock, and the invisible presenter layer.
 *
 * Per review 01 §1 and §7: no banner, no world switch, no persona switch, no
 * presenter rail. The demo machinery survives in two places only — the sign-in
 * screen (which sits outside the product) and a keyboard layer here that renders
 * nothing unless invoked. The single presenter pixel allowed in the product is the
 * narration marker, so the presenter can see the overlay is live.
 */
import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useDemo, type Action } from "@/lib/store";
import { Dock } from "@/components/dock";
import { productById, travellerCards, commissions, candidates } from "@/data/seed";

/* ── the frame bar: back · forward · breadcrumb, outside the panel ── */

const sectionLabel: Record<string, string> = {
  briefing: "Briefing",
  notifications: "Notifications",
  ask: "Ask",
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
  review: "Confirm new records",
  settings: "Settings",
};

/** Resolve a dynamic segment to the name of the thing it is. */
function entityLabel(section: string, id: string): string {
  if (section === "records") return productById(id)?.name ?? id;
  if (section === "travellers") return travellerCards.find((t) => t.id === id)?.name ?? id;
  if (section === "commissions") return commissions.find((c) => c.id === id)?.property ?? id;
  if (section === "review") return candidates.find((c) => c.id === id)?.name ?? id;
  return sectionLabel[id] ?? id;
}

function crumbFor(pathname: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return ["Briefing"];
  const out: string[] = [];
  parts.forEach((part, i) => {
    if (part === "admin" || part === "ops") return;            // grouping only, not a place
    const known = sectionLabel[part];
    if (known) { out.push(known); return; }
    const parent = parts[i - 1] ?? "";
    out.push(entityLabel(parent, part));
  });
  return out.length ? out : ["Briefing"];
}

function FrameBar() {
  const router = useRouter();
  const pathname = usePathname();
  const crumbs = crumbFor(pathname);
  const btn =
    "grid size-6 place-items-center rounded-[var(--radius-control)] text-muted-foreground " +
    "hover:bg-muted hover:text-foreground disabled:opacity-40 cursor-pointer";
  return (
    <div className="flex h-7 shrink-0 items-center gap-1 px-1">
      <button onClick={() => router.back()} className={btn} aria-label="Back"><ArrowLeft className="size-3.5" /></button>
      <button onClick={() => router.forward()} className={btn} aria-label="Forward"><ArrowRight className="size-3.5" /></button>
      <nav aria-label="Breadcrumb" className="ml-1 flex min-w-0 items-center gap-1.5 t-meta">
        {crumbs.map((c, i) => (
          <span key={`${c}-${i}`} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <span className="text-border">/</span>}
            <span className={i === crumbs.length - 1 ? "truncate text-foreground" : "truncate"}>{c}</span>
          </span>
        ))}
      </nav>
    </div>
  );
}

type Dispatch = React.Dispatch<Action>;
type Router = ReturnType<typeof useRouter>;

/** Demo checkpoints. A persona change is now a sign-in, not a toggle. */
const checkpoints: { key: string; label: string; go: (r: Router, d: Dispatch) => void }[] = [
  { key: "1", label: "morning", go: (r, d) => { d({ type: "signIn", role: "advisor" }); d({ type: "world", world: "v2" }); r.push("/briefing"); } },
  { key: "2", label: "commission", go: (r, d) => { d({ type: "signIn", role: "advisor" }); r.push("/commissions/vo"); } },
  { key: "3", label: "record", go: (r, d) => { d({ type: "signIn", role: "advisor" }); d({ type: "world", world: "v2" }); r.push("/records/maison-leandre"); } },
  { key: "4", label: "ask", go: (r, d) => { d({ type: "askScope", scope: "Maison Léandre" }); r.push("/ask"); } },
  { key: "5", label: "refusal", go: (r, d) => { d({ type: "askScope", scope: null }); r.push("/ask?state=refusal"); } },
  { key: "6", label: "v1 rewind", go: (r, d) => { d({ type: "world", world: "v1" }); r.push("/records/maison-leandre"); } },
  { key: "7", label: "traveller", go: (r, d) => { d({ type: "world", world: "v2" }); r.push("/travellers/s-marchetti"); } },
  { key: "8", label: "admin confirm", go: (r, d) => { d({ type: "signIn", role: "lead" }); r.push("/admin/review/sereno"); } },
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

  /* The store rehydrates from sessionStorage in an effect, and a child's effect runs
     before the provider's. Settle one tick later so a mid-demo reload is not read as
     a signed-out session and bounced to sign-in. */
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!settled) return;
    if (!s.signedIn && !onSignIn) router.replace("/signin");
    if (s.signedIn && onSignIn) router.replace("/briefing");
  }, [settled, s.signedIn, onSignIn, router]);

  /* ── Invisible presenter layer ── */
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;   /* ⌘1…⌘7 belong to the dock */
    if (typingOrDialog(e)) return;
    const k = e.key.toLowerCase();
    if (k === "n") { d({ type: "narration" }); return; }
    if (k === "v") { d({ type: "world", world: s.world === "v2" ? "v1" : "v2" }); return; }
    const cp = checkpoints.find((c) => c.key === e.key);
    if (cp) { e.preventDefault(); cp.go(router, d); }
  }, [router, d, s.world]);

  useEffect(() => {
    if (onSignIn) return;
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey, onSignIn]);

  /* Sign-in sits outside the product: no dock, no page chrome, no presenter keys. */
  if (onSignIn) return <>{children}</>;

  if (!settled || !s.signedIn) return <div className="min-h-dvh bg-background" />;

  return (
    <div className="h-dvh overflow-hidden bg-subtle p-[var(--frame-inset)]">
      {/* The frame: a breadcrumb strip outside the border, a panel that owns its own
          scroll, and the dock floating over the inset below. The page never scrolls. */}
      <div className="flex h-full flex-col gap-[var(--frame-inset)]">
        <FrameBar />
        <main
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-background"
          style={{
            border: "1px solid var(--frame-stroke)",
            borderRadius: "var(--radius-panel)",
          }}
        >
          {children}
        </main>
        {/* The dock's own row — the panel ends above it, so the border truly
            excludes the dock rather than being overlapped by it. */}
        <div className="h-[60px] shrink-0" aria-hidden />
      </div>

      {s.narration && (
        <div
          className="pointer-events-none fixed bottom-6 left-4 z-50 rounded-full border border-border bg-card/90 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-widest text-muted-foreground"
          role="status"
        >
          narration
        </div>
      )}

      <Dock />
    </div>
  );
}
