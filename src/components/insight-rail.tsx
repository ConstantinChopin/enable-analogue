"use client";
/**
 * The insight rail — the Briefing's tool that follows (src/lib/insights.ts has the logic).
 *
 * One insight at a time, in rank order, so its action is the page's one primary. The
 * rail and the page move together (Constantin, 2026-09-24):
 *   scrolling    the chapter crossing the reading line brings up its first insight; a
 *                chapter with none leaves the card where it is, and the lead brings back
 *                the first move
 *   the arrows   step through the insights and carry the page to each one's chapter
 *   the close    puts the rail away for the session; the page header brings it back
 * Below the desktop layout the rail sits after the chapters: it does not track the
 * scroll, and the arrows change the card without moving the page.
 */
import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconChrome } from "@/components/bits";
import type { Insight } from "@/lib/insights";

const DESKTOP = "(min-width: 1024px)";

export function InsightRail({ insights, onClose, onSheet, onWhy, onAct, empty, paused = false, onFocus, lead = "today" }: {
  insights: Insight[];
  onClose: () => void;
  onSheet?: (sheet: NonNullable<Insight["action"]["sheet"]>) => void;
  /** The page handles an insight whose action is an `act` (the trip page: ask, add, take off). */
  onAct?: (i: Insight) => void;
  /** Hidden for now (a conversation or a card has the slot): the page's scroll does not
      steer it, so it comes back on the insight it left on. */
  paused?: boolean;
  /** The arrows moved to an insight: the page may bring its part forward (a day's tab). */
  onFocus?: (i: Insight) => void;
  /** The chapter whose reading brings back the first move (the Briefing's "today"). */
  lead?: string;
  /** What the rail says when nothing is waiting, and its label. */
  empty?: { label: string; text: string };
  /** The assistant explains an insight (the lab): a tertiary "Why?" beside the act. */
  onWhy?: (id: string) => void;
}) {
  const [index, setIndex] = React.useState(0);
  /* While the arrows are carrying the page, the chapters it passes do not steer the rail. */
  const steering = React.useRef(0);
  const held = React.useRef(paused);
  React.useEffect(() => {
    /* coming back: the page reflows as the rail returns; let it settle before scrolling steers again */
    if (held.current && !paused) steering.current = Date.now() + 1200;
    held.current = paused;
  }, [paused]);
  const count = insights.length;
  const i = Math.min(index, Math.max(0, count - 1));
  const cur = insights[i];

  React.useEffect(() => {
    if (!window.matchMedia(DESKTOP).matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (held.current || Date.now() < steering.current) return;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const chapter = e.target.getAttribute("data-chapter");
          if (chapter === lead) { setIndex(0); continue; }
          const at = insights.findIndex((x) => x.chapter === chapter);
          if (at >= 0) setIndex(at);
        }
      },
      { rootMargin: "-32% 0px -64% 0px" },
    );
    document.querySelectorAll("[data-chapter]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [insights, lead]);

  const go = (to: number) => {
    const next = (to + count) % count;
    setIndex(next);
    if (insights[next]) onFocus?.(insights[next]);
    if (!window.matchMedia(DESKTOP).matches) return;
    const target = next === 0 ? lead : insights[next].chapter;
    const el = document.getElementById(`chapter-${target}`);
    if (!el) return;
    steering.current = Date.now() + 900;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!cur) {
    return (
      <section className="tool tool-follows flex min-w-0 flex-col" data-slot="card" data-variant="tool">
        <RailHead label={empty?.label ?? "Today"} counter="" onClose={onClose} />
        <p className="type-data-read text-label-secondary">{empty?.text ?? "Nothing today that the chapters do not already say."}</p>
      </section>
    );
  }

  return (
    <section className="tool tool-follows flex min-w-0 flex-col" data-slot="card" data-variant="tool" aria-roledescription="insights">
      <RailHead
        label={i === 0 ? `First move · ${cur.title}` : cur.title}
        counter={`${i + 1} of ${count}`}
        onPrev={count > 1 ? () => go(i - 1) : undefined}
        onNext={count > 1 ? () => go(i + 1) : undefined}
        onClose={onClose}
      />
      {/* Keyed by the insight, so a change reads as a new card, not an edit. */}
      <div key={cur.id} className="insight-in flex flex-col gap-[var(--space-4)]" aria-live="polite">
        <div className="flex flex-col gap-[var(--space-2)]">
          <h3 className="type-section">{cur.headline}</h3>
          <p className="type-data-read text-label-secondary">{cur.text}</p>
        </div>
        <p className="type-meta text-label-secondary">From {cur.evidence}</p>
        <div className="flex items-center gap-[var(--space-2)]">
          {cur.action.act && onAct ? (
            <Button onClick={() => onAct(cur)}>{cur.action.label}</Button>
          ) : cur.action.sheet && onSheet ? (
            <Button onClick={() => onSheet(cur.action.sheet!)}>{cur.action.label}</Button>
          ) : (
            <Button asChild><Link href={cur.action.href ?? "#"}>{cur.action.label}</Link></Button>
          )}
          {onWhy && <Button variant="tertiary" onClick={() => onWhy(cur.id)}>Why?</Button>}
        </div>
      </div>
    </section>
  );
}

/* The chapter as a small label left; the counter and the chrome right. The heading is
   the insight's own headline, below. Icon chrome is a circle, and every control in the
   row is 32 high (VIS-042). */
function RailHead({ label, counter, onPrev, onNext, onClose }: {
  label: string; counter: string;
  onPrev?: () => void; onNext?: () => void; onClose: () => void;
}) {
  return (
    <header className="-mt-[var(--space-2)] mb-[var(--space-2)] flex items-center gap-[var(--space-1)]">
      <span className="min-w-0 flex-1 truncate type-meta">{label}</span>
      {counter && <span className="mr-[var(--space-1)] type-meta tnum">{counter}</span>}
      {onPrev && <IconChrome label="Previous insight" onClick={onPrev}><ChevronLeft /></IconChrome>}
      {onNext && <IconChrome label="Next insight" onClick={onNext}><ChevronRight /></IconChrome>}
      <IconChrome label="Close insights" onClick={onClose}><X /></IconChrome>
    </header>
  );
}
