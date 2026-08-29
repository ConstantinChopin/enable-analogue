"use client";
/** AppShell: persona-gated nav · topbar (⌘K palette, world, persona) · presenter rail. */
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";
import type { Persona } from "@/data/seed";
import { people } from "@/data/seed";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Sunrise, MessageCircle, LayoutGrid, Route as RouteIcon, Users, Archive,
  SlidersHorizontal, Inbox, Search, Keyboard, Presentation, RefreshCw, CircleDollarSign, Menu,
} from "lucide-react";

const nav: { href: string; label: string; icon: React.ElementType; personas: Persona[]; group: string; count?: number }[] = [
  { href: "/briefing", label: "Briefing", icon: Sunrise, personas: ["advisor", "colleague", "lead"], group: "The working day" },
  { href: "/ask", label: "Ask", icon: MessageCircle, personas: ["advisor", "colleague"], group: "The working day" },
  { href: "/records", label: "Records", icon: LayoutGrid, personas: ["advisor", "colleague", "lead"], group: "The model", count: 312 },
  { href: "/itineraries", label: "Itineraries", icon: RouteIcon, personas: ["advisor"], group: "The model" },
  { href: "/travellers", label: "Travellers", icon: Users, personas: ["advisor", "colleague"], group: "The model" },
  { href: "/knowledge", label: "Knowledge", icon: Archive, personas: ["advisor", "colleague", "lead"], group: "Governance", count: 1284 },
  { href: "/notices", label: "Notices due", icon: SlidersHorizontal, personas: ["advisor"], group: "Governance" },
  { href: "/admin/publish", label: "Publish queue", icon: Inbox, personas: ["lead"], group: "Governance" },
  { href: "/admin/connections", label: "Connections", icon: SlidersHorizontal, personas: ["lead"], group: "Governance" },
  { href: "/admin/review", label: "Confirm new records", icon: Inbox, personas: ["lead", "ops"], group: "Governance" },
  { href: "/ops/resolution", label: "Unmatched payments", icon: CircleDollarSign, personas: ["ops"], group: "Governance" },
];

const personaHome: Record<Persona, string> = { advisor: "/briefing", colleague: "/briefing", lead: "/admin/publish", ops: "/ops/resolution" };

const checkpoints: { key: string; label: string; go: (r: ReturnType<typeof useRouter>, d: any) => void }[] = [
  { key: "1", label: "morning", go: (r, d) => { d({ type: "persona", persona: "advisor" }); d({ type: "world", world: "v2" }); r.push("/briefing"); } },
  { key: "2", label: "commission", go: (r, d) => { d({ type: "persona", persona: "advisor" }); r.push("/commissions/vo"); } },
  { key: "3", label: "record", go: (r, d) => { d({ type: "persona", persona: "advisor" }); d({ type: "world", world: "v2" }); r.push("/records/maison-leandre"); } },
  { key: "4", label: "ask", go: (r, d) => { d({ type: "askScope", scope: "Maison Léandre" }); r.push("/ask"); } },
  { key: "5", label: "refusal", go: (r, d) => { d({ type: "askScope", scope: null }); r.push("/ask?state=refusal"); } },
  { key: "6", label: "v1 rewind", go: (r, d) => { d({ type: "world", world: "v1" }); r.push("/records/maison-leandre"); } },
  { key: "7", label: "traveller", go: (r, d) => { d({ type: "world", world: "v2" }); r.push("/travellers/s-marchetti"); } },
  { key: "8", label: "admin confirm", go: (r, d) => { d({ type: "persona", persona: "lead" }); r.push("/admin/review/sereno"); } },
  { key: "0", label: "reset", go: (r, d) => { d({ type: "reset" }); r.push("/briefing"); } },
];

/** ⌘K canned destinations — stubbed by inventory decision (no real search index). */
const paletteGroups: { heading: string; items: { label: string; href: string }[] }[] = [
  { heading: "Records", items: [
    { label: "Maison Léandre", href: "/records/maison-leandre" },
    { label: "Records directory", href: "/records" },
  ]},
  { heading: "Travellers", items: [{ label: "S. Marchetti", href: "/travellers/s-marchetti" }] },
  { heading: "Ask", items: [{ label: "Ask a question…", href: "/ask" }] },
];

function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex shrink-0 rounded-md border border-border overflow-hidden">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)}
          className={cn("px-2.5 py-1 text-[11.5px] font-mono whitespace-nowrap cursor-pointer", v === value ? "bg-muted text-foreground font-semibold" : "text-muted-foreground hover:text-foreground")}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground text-[14px] font-semibold">E</span>
      <div className="leading-tight">
        <div className="text-[13.5px] font-semibold">Enable</div>
        <div className="text-[11.5px] text-muted-foreground">Paris desk</div>
      </div>
    </div>
  );
}

function NavPanel({ items, pathname, onOpenPalette, onNavigate }: {
  items: typeof nav; pathname: string; onOpenPalette: () => void; onNavigate?: () => void;
}) {
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <>
      <button onClick={onOpenPalette}
        className="mx-3 mb-2 flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12.5px] text-muted-foreground hover:text-foreground cursor-pointer">
        <Search className="size-3.5" /> Search everything
        <kbd className="ml-auto rounded border border-border px-1 text-[10px] font-mono">⌘K</kbd>
      </button>
      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {groups.map((g) => (
          <div key={g}>
            <div className="px-2 pt-4 pb-1 text-[10.5px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">{g}</div>
            {items.filter((i) => i.group === g).map((i) => {
              const active = pathname.startsWith(i.href);
              return (
                <Link key={i.href} href={i.href} onClick={onNavigate}
                  className={cn("flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13.5px]", active ? "bg-muted font-semibold" : "text-foreground/80 hover:bg-muted/60")}>
                  <i.icon className="size-4 text-muted-foreground" aria-hidden />
                  {i.label}
                  {i.count && <span className="ml-auto text-[12px] text-muted-foreground tnum">{i.count.toLocaleString("en-GB")}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-1.5 border-t border-border px-4 py-2.5 text-[12px] text-muted-foreground">
        <RefreshCw className="size-3" aria-hidden /> Synced 12:04
      </div>
    </>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { s, d } = useDemo();
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (paletteOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === "n") d({ type: "narration" });
      const cp = checkpoints.find((c) => c.key === e.key);
      if (cp) cp.go(router, d);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, d, paletteOpen]);

  const items = nav.filter((n) => n.personas.includes(s.persona));

  const goFromPalette = (href: string) => {
    setPaletteOpen(false);
    router.push(href);
  };

  return (
    <div className="flex h-screen w-full flex-col">
      {/* ⌘K palette — canned destinations, no live index (declared cut) */}
      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen} title="Search everything" description="Jump to a record, traveller, or question">
        <CommandInput placeholder="Search records, travellers, questions…" />
        <CommandList>
          <CommandEmpty>Nothing here by that name.</CommandEmpty>
          {paletteGroups.map((g) => (
            <CommandGroup key={g.heading} heading={g.heading}>
              {g.items.map((i) => (
                <CommandItem key={i.href} onSelect={() => goFromPalette(i.href)}>{i.label}</CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>

      {/* compact top bar (below md): logo + nav-as-sheet */}
      <div className="flex items-center gap-2 border-b border-border bg-sidebar px-3 py-2 md:hidden">
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger asChild>
            <button aria-label="Open navigation"
              className="grid size-8 place-items-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground cursor-pointer">
              <Menu className="size-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[264px] gap-0 bg-sidebar p-0">
            <SheetTitle asChild><span className="sr-only">Navigation</span></SheetTitle>
            <div className="px-4 py-4"><Logo /></div>
            <NavPanel items={items} pathname={pathname}
              onOpenPalette={() => { setNavOpen(false); setPaletteOpen(true); }}
              onNavigate={() => setNavOpen(false)} />
          </SheetContent>
        </Sheet>
        <Logo />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* nav (md and up) */}
        <aside className="hidden w-[232px] shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
          <div className="px-4 py-4"><Logo /></div>
          <NavPanel items={items} pathname={pathname} onOpenPalette={() => setPaletteOpen(true)} />
        </aside>

        {/* main + topbar */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border px-3 py-2 md:px-5">
            <span className="hidden text-[11px] font-mono uppercase tracking-widest text-muted-foreground lg:inline">Analogue environment · reconstruction, analogue dataset</span>
            <span className="flex-1" />
            <span className="text-[11px] font-mono text-muted-foreground">world</span>
            <Seg value={s.world} options={[["v1", "v1 Mar"], ["v2", "v2 current"]]} onChange={(w) => d({ type: "world", world: w })} />
            <span className="text-[11px] font-mono text-muted-foreground">viewing as</span>
            <Seg value={s.persona}
              options={[["advisor", people.advisorShort], ["colleague", people.colleagueShort], ["lead", people.leadShort], ["ops", people.opsShort]]}
              onChange={(p) => { d({ type: "persona", persona: p }); router.push(personaHome[p]); }} />
            <button onClick={() => d({ type: "narration" })} title="Narration overlay (N)" aria-label="Toggle narration overlay (N)"
              className={cn("rounded-md border px-2 py-1", s.narration ? "border-primary text-primary bg-primary-soft" : "border-border text-muted-foreground hover:text-foreground")}>
              <Presentation className="size-3.5" />
            </button>
          </div>
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>

      {/* presenter rail — scrolls within itself, never the page */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border bg-sidebar px-4 py-1.5">
        <Keyboard className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="mr-1 shrink-0 text-[10.5px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">Presenter</span>
        {checkpoints.map((c) => (
          <button key={c.key} onClick={() => c.go(router, d)}
            className="shrink-0 whitespace-nowrap rounded border border-border bg-background px-2 py-0.5 text-[11px] font-mono text-foreground/80 hover:border-primary hover:text-primary cursor-pointer">
            {c.key} {c.label}
          </button>
        ))}
        <span className="ml-auto shrink-0 pl-2 text-[11px] font-mono text-muted-foreground">N narration {s.narration ? "on" : "off"}</span>
      </div>
    </div>
  );
}
