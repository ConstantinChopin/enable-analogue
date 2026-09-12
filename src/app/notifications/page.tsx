"use client";
/**
 * Notifications — recomposed as a document (Pass 1.5).
 *
 * This is not the briefing. The briefing is the day's shape; this is the stream of
 * items each needing a decision. Every item is bound to its subject and carries its
 * decision, which is the difference between this and the inbox the product replaces.
 * Nothing auto-dismisses (DEC-03): an item is actioned or deferred deliberately.
 *
 * Chapters, in order: the filters (state · tag, one row under the title) · the
 * stream, one chapter titled by the state it shows (Waiting on you · Actioned ·
 * Deferred). The inspector is the tool that follows: the item in full, its
 * evidence, and the ONE primary at its bottom — the item's own action (contract:
 * action a notification). Mark actioned · Defer are secondaries; "Put it back in
 * the open list" is a text action.
 *
 * Whose items: `inboxFor(s)` — the seeded day for the signed-in type plus what happened
 * this session (a proposed value, a share waiting in the queue, a return, an access
 * request). A live item is an item like any other: its action is the panel's primary.
 * Tags are the ones present — the user's Records · Commissions · Traveller; the owner's
 * add Ingestion · Connections · Knowledge. A user without the money entitlement has no
 * Commissions items at all (absent, not masked).
 *
 * Colour means severity here and nothing else (contract taxonomies: ["severity"]).
 * The severity chip is the only chroma on a row; triage state is a neutral chip
 * whose word does the work. A selected row carries a 2px ink left edge and a fill.
 *
 * Local components (not promoted to bits): SeverityChip, StateMark.
 */
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, inboxFor, canViewCommissions, type NoticeState } from "@/lib/store";
import type { Notification, NotifTag } from "@/data/seed";
import { PageHeader, SplitPage } from "@/components/layouts";
import { Chip, DataList, EmptyState, Section, Segmented, NarrationNote, SchematicBadge, Rows } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Clock } from "lucide-react";

const TAG_ORDER: NotifTag[] = ["Records", "Commissions", "Ingestion", "Traveller", "Connections", "Knowledge"];

const SEVERITY_RANK = { Critical: 0, Important: 1, Info: 2 } as const;

/** "Today 08:12" / "Yesterday 18:20" → a comparable number. Newest is largest.
    "Just now" is what happened this session, so it sorts above the seeded day. */
function recency(when: string) {
  if (when === "Just now") return 100000;
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
/** The chapter's title, by the state it shows. */
const STATE_TITLE: Record<StateFilter, string> = {
  open: "Waiting on you",
  actioned: "Actioned",
  deferred: "Deferred",
};

const inStateFilter = (state: NoticeState, f: StateFilter) =>
  f === "open" ? state === "new" || state === "seen" : state === f;

/* ── severity: the one thing colour means here, always with its word ─────────── */
function SeverityChip({ severity }: { severity: Notification["severity"] }) {
  const tone = { Critical: "crit", Important: "warn", Info: "neutral" } as const;
  return <Chip tone={tone[severity]}>{severity}</Chip>;
}

/* Four states, one shape, no chroma: severity owns the colour budget on this
   surface, so triage state is carried by the word. "new" takes the ink outline so
   the item that has not been looked at yet still stands forward of the rest. */
function StateMark({ state }: { state: NoticeState }) {
  if (state === "new") return <Chip tone="primary">new</Chip>;
  return <Chip tone="neutral">{state}</Chip>;
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

  /* The money gate applies to the stream as it does everywhere else: a user the owner
     has not entitled has no commission items, rather than items with figures hidden.
     A Records item about a commission rate (the three-source conflict) is money too.
     The seed carries no flag for it yet, so the headline is read. */
  const money = canViewCommissions(s);
  const mine = useMemo(
    () => inboxFor(s).filter((n) => money || !(n.tag === "Commissions" || /commission/i.test(n.headline))),
    // inboxFor reads the session's mutations; `s` is a new object on every one of them.
    [s, money],
  );
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
        title={
          <>
            Notifications
            {openCount > 0 && (
              <Chip tone="neutral"><span className="tnum">{openCount}</span> open</Chip>
            )}
          </>
        }
      >
        <p className="mt-[var(--space-2)] max-w-[62ch] type-data-read text-label-secondary">
          What changed, and what the system noticed. Each item carries its subject and its decision.
        </p>

        {/* Two controls, one row: the state on the left because it is the smaller,
            more-used axis, the tags on the right. Clicking the live tag clears it. */}
        <div className="mt-[var(--space-4)] flex flex-wrap items-center gap-x-[var(--space-4)] gap-y-[var(--space-2)]">
          <Segmented
            value={stateFilter}
            onChange={setStateFilter}
            options={STATE_FILTERS}
            label="Triage state"
          />
          <Segmented<NotifTag | "all">
            value={tag}
            onChange={(v) => setTag(v === tag ? "all" : v)}
            options={[
              { value: "all" as const, label: "All", count: byState.length },
              ...tagsPresent.map((t) => ({ value: t, label: t, count: tagCounts[t] })),
            ]}
            label="Tag"
            className="max-w-full flex-wrap"
          />
        </div>
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
      /* The panel is titled with what the item is about, not which tag it filed under. */
      panelTitle={active ? (active.subject?.label ?? active.headline) : "Item"}
      panel={active ? <ItemPanel n={active} state={stateOf(active)} /> : null}
    >
      <div className="min-w-0">
        {mine.length === 0 ? (
          <EmptyState
            title="Nothing waiting."
            body="No item has asked for a decision today. The system is not inventing work to look busy."
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nothing waiting under this filter."
            body="Items are still here under another tag or state."
            action={
              <Button variant="secondary" size="sm" onClick={() => { setTag("all"); setStateFilter("open"); }}>
                Show everything open
              </Button>
            }
          />
        ) : (
          <Section
            title={STATE_TITLE[stateFilter]}
            footer={
              <p className="type-meta">
                <span className="tnum">{rows.length}</span> shown · <span className="tnum">{openCount}</span> open
                across every tag
              </p>
            }
          >
            <Rows>
              {rows.map((n) => {
                const st = stateOf(n);
                const isNew = st === "new";
                const isSel = selected === n.id;
                return (
                  /* Selected is more than a colour: a 2px ink left edge, a fill, and the
                     row's own word. The edge sits in the gutter so the text keeps the
                     column's left edge whether or not the row is selected. */
                  <li
                    key={n.id}
                    data-state={isSel ? "selected" : undefined}
                    className={cn(
                      "-mx-[var(--space-3)] border-l-2 pl-[calc(var(--space-3)-2px)] pr-[var(--space-3)] transition-colors duration-200 ease-standard",
                      isSel ? "border-l-selected bg-interactive/40" : "border-l-transparent hover:bg-interactive/60",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(n.id)}
                      aria-pressed={isSel}
                      aria-label={`${n.severity}: ${n.headline}`}
                      className="row-stack block w-full cursor-pointer text-left"
                    >
                      <span className="row-stack-head">
                        <span className={cn("row-primary", isNew ? "type-data-strong" : "type-data")}>
                          {n.headline}
                        </span>
                        <span className="flex shrink-0 items-center gap-[var(--space-2)]">
                          <SeverityChip severity={n.severity} />
                          <StateMark state={st} />
                        </span>
                      </span>
                      <span className="row-stack-body type-meta">
                        {n.subject && <>{n.subject.label} · </>}
                        {n.tag} · {n.when}
                      </span>
                    </button>
                  </li>
                );
              })}
            </Rows>
          </Section>
        )}
      </div>
    </SplitPage>
  );
}

/* ── the item, in full ──────────────────────────────────────────────────────── */
function ItemPanel({ n, state }: { n: Notification; state: NoticeState }) {
  const { d } = useDemo();
  const set = (next: NoticeState) => d({ type: "notice", id: n.id, state: next });

  return (
    <div className="space-y-[var(--space-6)]">
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <SeverityChip severity={n.severity} />
        <Chip tone="neutral">{n.tag}</Chip>
        <span className="ml-auto"><StateMark state={state} /></span>
      </div>

      <div>
        <h2 className="type-section">{n.headline}</h2>
        <p className="mt-[var(--space-2)] type-data-read text-label-secondary">{n.detail}</p>
      </div>

      <DataList
        rows={[
          ...(n.evidence ? [{ label: "Evidence", value: n.evidence }] : []),
          { label: "Generated by", value: n.generatedBy },
          { label: "When", value: n.when },
          {
            label: "Subject",
            value: n.subject ? (
              <Link
                href={n.subject.href}
                className="underline decoration-hairline underline-offset-4 hover:decoration-ink"
              >
                {n.subject.label}
              </Link>
            ) : null,
            absent: "not applicable" as const,
          },
        ]}
      />

      {/* The one primary is the item's own action: heavy work opens the real surface.
          An action this build only draws is a grey button with the schematic mark.
          Recording the decision is secondary; undoing it is a text action. */}
      <div className="space-y-[var(--space-2)] border-t border-hairline pt-[var(--space-4)]">
        {n.action &&
          (n.action.href ? (
            <Button asChild className="w-full">
              <Link href={n.action.href}>
                {n.action.label} <ArrowRight aria-hidden />
              </Link>
            </Button>
          ) : (
            <div className="flex items-center gap-[var(--space-2)]">
              <Button variant="secondary" className="flex-1">{n.action.label}</Button>
              <SchematicBadge />
            </div>
          ))}

        <div className="flex gap-[var(--space-2)]">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            disabled={state === "actioned"}
            onClick={() => set("actioned")}
          >
            <Check aria-hidden /> Mark actioned
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            disabled={state === "deferred"}
            onClick={() => set("deferred")}
          >
            <Clock aria-hidden /> Defer
          </Button>
        </div>

        {(state === "actioned" || state === "deferred") && (
          <div className="flex justify-center pt-[var(--space-2)]">
            <Button variant="link" size="sm" onClick={() => set("seen")}>
              Put it back in the open list
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
