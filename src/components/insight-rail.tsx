"use client";
/**
 * The insight rail — the Briefing's tool that follows (src/lib/insights.ts has the logic).
 *
 * One insight at a time, in the inbox's order (FB-04: severity, then the inbox's own
 * order), so its action is the page's one primary, and each card says how bad it is in
 * the inbox's words.
 *
 *   the arrows   step through the insights and carry the page to each one's chapter
 *   the close    collapses the card to a small "N insights" control in its place, which
 *                opens it again (FB-11, 2026-09-28). It used to put the rail away for the
 *                session behind a quiet "Show insights" in the page header.
 *
 * The card no longer follows the scroll (FB-11, 2026-09-28). From 2026-09-24 the chapter
 * being read brought up its insight, so the card changed under the reader, and because it
 * was a live region a screen reader announced every scroll. It now changes only when the
 * reader asks it to (the arrows), and only that change is announced.
 * Below the desktop layout the rail sits after the chapters, and the arrows change the
 * card without moving the page.
 */
import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, IconChrome } from "@/components/bits";
import type { Insight } from "@/lib/insights";

const DESKTOP = "(min-width: 1024px)";

export function InsightRail({ insights, onClose, onOpen, collapsed = false, onSheet, onWhy, onAct, empty, onFocus, lead = "today" }: {
  insights: Insight[];
  /** The close: collapses the card (the page keeps `collapsed`), or takes the rail away. */
  onClose: () => void;
  /** Collapsed: the small control that opens the card again. */
  collapsed?: boolean;
  onOpen?: () => void;
  onSheet?: (sheet: NonNullable<Insight["action"]["sheet"]>) => void;
  /** The page handles an insight whose action is an `act` (the trip page: ask, add, take off). */
  onAct?: (i: Insight) => void;
  /** Kept for callers: the card no longer follows the scroll (FB-11), so there is
      nothing to pause while it is hidden. */
  paused?: boolean;
  /** The arrows moved to an insight: the page may bring its part forward (a day's tab). */
  onFocus?: (i: Insight) => void;
  /** The chapter the first insight's arrow carries the page to (the Briefing's "today"). */
  lead?: string;
  /** What the rail says when nothing is waiting, and its label. */
  empty?: { label: string; text: string };
  /** The assistant explains an insight: a tertiary "Why?" beside the act. */
  onWhy?: (i: Insight) => void;
}) {
  const [index, setIndex] = React.useState(0);
  /* Only a change the reader started is announced (FB-11). */
  const [announce, setAnnounce] = React.useState("");
  const count = insights.length;
  const i = Math.min(index, Math.max(0, count - 1));
  const cur = insights[i];

  const go = (to: number) => {
    const next = (to + count) % count;
    setIndex(next);
    const it = insights[next];
    if (!it) return;
    setAnnounce(`${next + 1} of ${count}${it.severity ? `, ${it.severity}` : ""}: ${it.headline}`);
    onFocus?.(it);
    if (!window.matchMedia(DESKTOP).matches) return;
    const target = next === 0 ? lead : it.chapter;
    document.getElementById(`chapter-${target}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (collapsed) {
    return (
      <Button
        variant="secondary"
        size="sm"
        aria-expanded={false}
        aria-label={count ? `Show ${count} ${count === 1 ? "insight" : "insights"}` : "Show insights"}
        onClick={onOpen}
      >
        <span className="tnum">{count}</span> {count === 1 ? "insight" : "insights"}
      </Button>
    );
  }

  if (!cur) {
    return (
      <section className="tool tool-follows flex min-w-0 flex-col" data-slot="card" data-variant="tool">
        <RailHead label={empty?.label ?? "Today"} counter="" onClose={onClose} />
        <p className="type-data text-label-secondary">{empty?.text ?? "Nothing is waiting on you today."}</p>
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
      <div key={cur.id} className="insight-in flex flex-col gap-[var(--space-4)]">
        <div className="flex flex-col gap-[var(--space-2)]">
          {/* How bad, in the inbox's words and colours (FB-04): claret only for
              Critical, ochre for a decision, everything else neutral. */}
          {cur.severity && (
            <div className="flex">
              <Chip tone={cur.severity === "Critical" ? "crit" : cur.severity === "Important" ? "warn" : "neutral"}>{cur.severity}</Chip>
            </div>
          )}
          <h3 className="type-section">{cur.headline}</h3>
          <p className="type-data text-label-secondary">{cur.text}</p>
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
          {onWhy && <Button variant="tertiary" onClick={() => onWhy(cur)}>Why?</Button>}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{announce}</p>
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
