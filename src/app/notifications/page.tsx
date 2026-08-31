"use client";
/**
 * Notifications — the triage space (§10b). The Ledger archetype with a different
 * row anatomy.
 *
 * This is not the briefing. The briefing is the day's shape; this is the stream of
 * items each needing a decision. Every item is bound to its subject and carries its
 * decision, which is the difference between this and the inbox the product replaces.
 *
 * Nothing auto-dismisses (DEC-03): an item is actioned or deferred deliberately.
 */
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, type NoticeState } from "@/lib/store";
import { notificationsFor, type Notification, type NotifTag } from "@/data/seed";
import { PageHeader, SplitPage } from "@/components/layouts";
import { Chip, DataList, EmptyState, Section, Segmented, NarrationNote, SchematicBadge } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Clock, Info, OctagonAlert, TriangleAlert } from "lucide-react";

const TAG_ORDER: NotifTag[] = ["Records", "Commissions", "Ingestion", "Traveller", "Connections", "Knowledge"];

const SEVERITY_RANK = { Critical: 0, Important: 1, Info: 2 } as const;

/** "Today 08:12" / "Yesterday 18:20" → a comparable number. Newest is largest. */
function recency(when: string) {
  const m = /^(Today|Yesterday)\s+(\d{1,2}):(\d{2})$/.exec(when);
  if (!m) return 0;
  return (m[1] === "Today" ? 10000 : 0) + Number(m[2]) * 60 + Number(m[3]);
}

type StateFilter = "open" | "actioned" | "deferred";
const STATE_FILTERS: { value: StateFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "actioned", label: "Actioned" },
  { value: "deferred", label: "Deferred" },
];

const inStateFilter = (state: NoticeState, f: StateFilter) =>
  f === "open" ? state === "new" || state === "seen" : state === f;

/* ── severity mark: shape and colour, never colour alone ────────────────────── */
function SeverityMark({ severity }: { severity: Notification["severity"] }) {
  const spec = {
    Critical: { Icon: OctagonAlert, tone: "text-crit" },
    Important: { Icon: TriangleAlert, tone: "text-warn" },
    Info: { Icon: Info, tone: "text-muted-foreground" },
  }[severity];
  return (
    <span className={cn("mt-0.5 inline-flex shrink-0", spec.tone)}>
      <spec.Icon className="size-4" aria-hidden />
      <span className="sr-only">{severity}</span>
    </span>
  );
}

function StateMark({ state }: { state: NoticeState }) {
  if (state === "actioned") return <Chip tone="ok">actioned</Chip>;
  if (state === "deferred") return <Chip tone="neutral">deferred</Chip>;
  if (state === "new") return <Chip tone="primary">new</Chip>;
  return <span className="type-micro text-muted-foreground">seen</span>;
}

/* ── page ───────────────────────────────────────────────────────────────────── */
export default function NotificationsPage() {
  return (
    <Suspense fallback={null}>
      <Triage />
    </Suspense>
  );
}

function Triage() {
  const { s } = useDemo();
  const search = useSearchParams();

  /* Briefing widgets are saved views (§8): ?tag=Records arrives already applied. */
  const tagParam = search?.get("tag") ?? null;
  const [tag, setTag] = useState<NotifTag | "all">(() =>
    tagParam && (TAG_ORDER as string[]).includes(tagParam) ? (tagParam as NotifTag) : "all",
  );
  const [stateFilter, setStateFilter] = useState<StateFilter>("open");
  const [selected, setSelected] = useState<string | null>(null);

  const mine = useMemo(() => notificationsFor(s.role), [s.role]);
  const stateOf = (n: Notification): NoticeState => s.notices[n.id] ?? n.defaultState;

  const byState = useMemo(
    () => mine.filter((n) => inStateFilter(stateOf(n), stateFilter)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mine, stateFilter, s.notices],
  );

  const tagCounts = useMemo(() => {
    const counts = {} as Record<NotifTag, number>;
    for (const t of TAG_ORDER) counts[t] = 0;
    for (const n of byState) counts[n.tag] += 1;
    return counts;
  }, [byState]);

  const rows = useMemo(() => {
    const list = tag === "all" ? byState : byState.filter((n) => n.tag === tag);
    return [...list].sort(
      (a, b) =>
        SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || recency(b.when) - recency(a.when),
    );
  }, [byState, tag]);

  // An item filtered out of the stream takes its panel with it — derived, never synced.
  const active = selected ? rows.find((n) => n.id === selected) : undefined;

  const openCount = mine.filter((n) => inStateFilter(stateOf(n), "open")).length;
  const tagsPresent = TAG_ORDER.filter((t) => mine.some((n) => n.tag === t));

  const header = (
    <>
      <PageHeader
        crumb="Notifications"
        title={
          <>
            Notifications
            {openCount > 0 && (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 type-micro text-primary tnum">
                {openCount} open
              </span>
            )}
          </>
        }
      >
        <p className="mt-2 max-w-[62ch] type-data text-muted-foreground">
          What changed, and what the system noticed. Each item carries its subject and its decision.
        </p>
      </PageHeader>

      <NarrationNote>
        The briefing is the day&rsquo;s shape; this is the stream of things asking for a decision. The
        product exists partly because the inbox failed, so the rule here is that an item is never a
        message you must interpret and act on somewhere else.
      </NarrationNote>
    </>
  );

  return (
    <SplitPage
      header={header}
      panelOpen={!!active}
      onClosePanel={() => setSelected(null)}
      /* The panel is titled with what the item is about, not which tag it filed under.
         It read "Records" above an item concerning Hôtel Verlaine, and the tag then
         repeated as a chip directly below it. */
      panelTitle={active ? (active.subject?.label ?? active.headline) : "Item"}
      panel={active ? <ItemPanel n={active} state={stateOf(active)} /> : null}
    >
      {
          <div className="min-w-0">
            {/* Two identical segmented controls doing different jobs, stacked with a
                sentence wedged between them, put ~90px of chrome above the first item
                on a surface whose job is getting to zero. They now share one row: the
                state on the left because it is the smaller, more-used axis, the tags
                on the right. One line instead of three. */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Segmented
                value={stateFilter}
                onChange={setStateFilter}
                options={STATE_FILTERS}
                label="Triage state"
              />
              <Segmented<NotifTag | "all">
                value={tag}
                /* Clicking the live tag clears it, as the pill row did. */
                onChange={(v) => setTag(v === tag ? "all" : v)}
                options={[
                  { value: "all" as const, label: "All", count: byState.length },
                  ...tagsPresent.map((t) => ({ value: t, label: t, count: tagCounts[t] })),
                ]}
                label="Tag"
                className="max-w-full flex-wrap"
              />
            </div>

            {/* ── the stream ── */}
            {mine.length === 0 ? (
              <EmptyState
                className="mt-3"
                title="Nothing waiting."
                body="No item has asked for a decision today. The system is not inventing work to look busy."
              />
            ) : rows.length === 0 ? (
              <EmptyState
                className="mt-3"
                title="Nothing waiting under this filter."
                body="Items are still here under another tag or state."
                action={
                  <Button variant="outline" size="sm" onClick={() => { setTag("all"); setStateFilter("open"); }}>
                    Show everything open
                  </Button>
                }
              />
            ) : (
              <Section variant="list" className="mt-3">
                <ul>
                {rows.map((n, i) => {
                  const st = stateOf(n);
                  const isNew = st === "new";
                  return (
                    <li key={n.id} className={cn(i > 0 && "border-t border-border")}>
                      <button
                        type="button"
                        onClick={() => setSelected(n.id)}
                        aria-pressed={selected === n.id}
                        aria-label={`${n.severity}: ${n.headline}`}
                        /* A Critical item sat among six Important ones at identical row
                           height and weight, separated only by a glyph and a slight hue
                           shift. The highest-consequence row now takes a solid rail and
                           a tinted ground — the same weight the record's critical banner
                           carries, so severity reads the same way everywhere. */
                        className={cn(
                          "block w-full cursor-pointer border-l-2 px-3 pb-3 text-left transition-colors",
                          selected === n.id ? "bg-muted/70" : "hover:bg-muted/40",
                          n.severity === "Critical"
                            ? "border-l-crit bg-crit/[0.04]"
                            : isNew
                              ? "border-l-primary"
                              : "border-l-transparent",
                        )}
                      >
                        <span className="row-grid">
                          <span
                            className={cn(
                              "row-primary type-data",
                              n.severity === "Critical"
                                ? "font-semibold text-foreground"
                                : isNew
                                  ? "font-semibold text-foreground"
                                  : "text-muted-foreground",
                            )}
                          >
                            <span className="mr-2 inline-block align-text-bottom">
                              <SeverityMark severity={n.severity} />
                            </span>
                            {n.headline}
                          </span>
                          {n.subject && <span className="row-meta type-meta">{n.subject.label}</span>}
                          <span className="row-trailing"><StateMark state={st} /></span>
                        </span>
                        <span className="flex flex-wrap items-center gap-2">
                          <Chip tone="neutral" className="border border-border bg-background">{n.tag}</Chip>
                          <span className="type-meta">{n.when}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
                </ul>
              </Section>
            )}

            {rows.length > 0 && (
              <p className="mt-3 type-meta">
                <span className="tnum">{rows.length}</span> shown · <span className="tnum">{openCount}</span> open
                across every tag
              </p>
            )}
          </div>
      }
    </SplitPage>
  );
}

/* The local EmptyState moved into `bits.tsx`, where the other three surfaces that
   needed one can reach it. */

/* ── the item, in full ──────────────────────────────────────────────────────── */
function ItemPanel({ n, state }: { n: Notification; state: NoticeState }) {
  const { d } = useDemo();
  const set = (next: NoticeState) => d({ type: "notice", id: n.id, state: next });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityMark severity={n.severity} />
        <span className="type-data-strong">{n.severity}</span>
        <Chip tone="neutral" className="border border-border bg-background">{n.tag}</Chip>
        <span className="ml-auto"><StateMark state={state} /></span>
      </div>

      <div>
        <h2 className="type-data-strong">{n.headline}</h2>
        <p className="mt-2 type-data text-muted-foreground">{n.detail}</p>
      </div>

      <DataList
        rows={[
          ...(n.evidence ? [{ label: "Evidence", value: n.evidence }] : []),
          { label: "Generated by", value: n.generatedBy },
          { label: "When", value: n.when },
          {
            label: "Subject",
            value: n.subject ? (
              <Link href={n.subject.href} className="text-primary underline underline-offset-2">
                {n.subject.label}
              </Link>
            ) : null,
            absent: "not applicable" as const,
          },
        ]}
      />

      {/* Heavy work opens the real surface; light actions resolve here. */}
      <div className="space-y-2">
        {n.action &&
          (n.action.href ? (
            <Button asChild size="sm" className="w-full">
              <Link href={n.action.href}>
                {n.action.label} <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="w-full">
              {n.action.label} <SchematicBadge />
            </Button>
          ))}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={state === "actioned"}
            onClick={() => set("actioned")}
          >
            <Check className="size-3.5" aria-hidden /> Mark actioned
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={state === "deferred"}
            onClick={() => set("deferred")}
          >
            <Clock className="size-3.5" aria-hidden /> Defer
          </Button>
        </div>

        {(state === "actioned" || state === "deferred") && (
          <button
            type="button"
            onClick={() => set("seen")}
            className="w-full cursor-pointer text-center type-data text-primary underline underline-offset-2"
          >
            Put it back in the open list
          </button>
        )}
      </div>

      {/* The "nothing expires on a timer" line is gone. It was the fifth restatement of
          one principle across four surfaces, and the two buttons above are the proof:
          the only way this item leaves the list is through one of them. */}
    </div>
  );
}
