"use client";
/**
 * Notifications — recomposed as a document (Pass 1.5).
 *
 * This is not the briefing. The briefing is the day's shape; this is the stream of
 * items each needing a decision. Every item is bound to its subject and carries its
 * decision, which is the difference between this and the inbox the product replaces.
 *
 * 2026-09-28, UX sweep FB-03, NAV-01, NAV-03, NAV-06, COL-02, COL-07, FB-08 (VIS-095 to
 * VIS-097):
 *   title row   the name and one count: what the dock's badge counts, "N unseen"
 *               (store `unseenCount`'s rule, on this page's list), so the two agree.
 *   toolbar     the state switch (Open · Actioned · Deferred), the tags, then the result
 *               and its order. State, tag and the selected item live in the URL; the
 *               Briefing's widgets still arrive with `?tag=` applied.
 *   rows        each row's state is the store's `inboxState`: an item whose subject was
 *               dealt with anywhere (a reminder sent, a record confirmed, both payments
 *               matched) is Actioned on its own, and says how ("Resolved · Reminder sent
 *               by R. Devane"). Opening an item marks it seen, so the badge drops.
 *   inspector   the item in full, "Open ↗" to its subject, and its acts pinned in the
 *               footer: its own action first, then Mark actioned and Defer. Both give a
 *               toast with Undo and move the selection to the next item; the row no
 *               longer vanishes without a word.
 *
 * Whose items: `inboxFor(s)`, the seeded day for the signed-in type plus what happened
 * this session. A user without the money entitlement has no Commissions items at all
 * (absent, not masked). Colour means severity here and nothing else, and only while an
 * item is open: an actioned item's severity is a word.
 */
import { Suspense, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, inboxFor, inboxState, canViewCommissions, type NoticeState } from "@/lib/store";
import type { Notification, NotifTag } from "@/data/seed";
import { PageHeader, SplitPage, ListToolbar, useQueryState } from "@/components/layouts";
import { Chip, DataList, EmptyState, Segmented, SchematicAction, Rows, Done } from "@/components/bits";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Check, Clock } from "lucide-react";

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
const isStateFilter = (v: string): v is StateFilter => STATE_FILTERS.some((f) => f.value === v);

const inStateFilter = (state: NoticeState, f: StateFilter) =>
  f === "open" ? state === "new" || state === "seen" : state === f;

/* ── severity: the one thing colour means here, always with its word, and only while
   the item is open (an actioned item is no longer at risk) ─────────────────────── */
function SeverityChip({ severity, open }: { severity: Notification["severity"]; open: boolean }) {
  const tone = { Critical: "crit", Important: "warn", Info: "neutral" } as const;
  return <Chip tone={open ? tone[severity] : "neutral"}>{severity}</Chip>;
}

/* Triage state is a word in a neutral chip; "new" takes the ink outline so the item
   not yet looked at stands forward of the rest. */
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
  const { s, d } = useDemo();
  const router = useRouter();
  const pathname = usePathname();
  const latest = useRef(s);
  useEffect(() => { latest.current = s; });

  const [stateParam, setStateParam] = useQueryState("state", "open");
  const stateFilter: StateFilter = isStateFilter(stateParam) ? stateParam : "open";
  const [tagParam, setTagParam] = useQueryState("tag", "all");
  const tag: NotifTag | "all" = (TAG_ORDER as string[]).includes(tagParam) ? (tagParam as NotifTag) : "all";
  const [sel, setSel] = useQueryState("sel");

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
  const stateOf = (n: Notification) => inboxState(s, n);

  const byState = useMemo(
    () => mine.filter((n) => inStateFilter(inboxState(s, n).state, stateFilter)),
    [mine, stateFilter, s],
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

  // An item filtered out of the stream takes its panel with it: derived, never synced.
  const active = sel ? rows.find((n) => n.id === sel) : undefined;

  /* Opening an item marks it seen (FB-03): the badge counts only what nobody has looked at. */
  useEffect(() => {
    if (active && inboxState(s, active).state === "new") d({ type: "notice", id: active.id, state: "seen" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  const unseen = mine.filter((n) => stateOf(n).state === "new").length;
  const tagsPresent = TAG_ORDER.filter((t) => mine.some((n) => n.tag === t));

  /** Record a triage decision, move on to the next item, and offer Undo. */
  const triage = (n: Notification, next: NoticeState, message: string) => {
    const before = s.notices[n.id];
    d({ type: "notice", id: n.id, state: next });
    const rest = rows.filter((x) => x.id !== n.id);
    const i = rows.findIndex((x) => x.id === n.id);
    setSel((rest[i] ?? rest[i - 1])?.id ?? null);
    notify(message, {
      detail: n.headline,
      undo: () => {
        const notices = { ...latest.current.notices };
        if (before === undefined) delete notices[n.id]; else notices[n.id] = before;
        d({ type: "patch", patch: { notices } });
      },
    });
  };

  const header = <PageHeader title="Notifications" count={unseen > 0 ? `${unseen} unseen` : "all seen"} />;

  return (
    <SplitPage
      header={header}
      panelOpen={!!active}
      onClosePanel={() => setSel(null)}
      /* The panel is titled with what the item is about, not which tag it filed under. */
      panelTitle={active ? (active.subject?.label ?? active.headline) : "Item"}
      openHref={active?.subject?.href}
      panel={active ? <ItemPanel n={active} /> : null}
      footer={active && !stateOf(active).resolved ? <ItemActs n={active} onTriage={triage} /> : undefined}
    >
      <ListToolbar
        state={
          <Segmented
            value={stateFilter}
            onChange={(v) => setStateParam(v)}
            options={STATE_FILTERS}
            label="Triage state"
          />
        }
        /* Each tag carries its count in its own label, so the count keeps the label's
           contrast when the tag is selected (the separate count at 70% was illegible). */
        filters={
          <Segmented<NotifTag | "all">
            value={tag}
            onChange={(v) => setTagParam(v === tag ? "all" : v)}
            options={[
              { value: "all" as const, label: `All ${byState.length}` },
              ...tagsPresent.map((t) => ({ value: t, label: `${t} ${tagCounts[t]}` })),
            ]}
            label="Tag"
            className="max-w-full flex-wrap"
          />
        }
        result={rows.length > 0 ? <>{rows.length} shown · most severe first, then newest</> : undefined}
      />

      <div className="min-w-0">
        {mine.length === 0 ? (
          <EmptyState title="Nothing is waiting on you." body="New items appear here as they arrive." />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nothing here."
            body="Other items are under another tag or state."
            action={
              <Button variant="secondary" size="sm" onClick={() => router.replace(pathname, { scroll: false })}>
                Show everything open
              </Button>
            }
          />
        ) : (
          <Rows>
            {rows.map((n) => {
              const { state: st, resolved } = stateOf(n);
              const isNew = st === "new";
              const isSel = sel === n.id;
              const open = st === "new" || st === "seen";
              return (
                /* The selectable row (VIS-093): selected lifts onto raised paper, the
                   inspector's material. Enter on the selected row opens its subject. */
                <li
                  key={n.id}
                  data-state={isSel ? "selected" : undefined}
                  className="row-select -mx-[var(--space-3)] px-[var(--space-3)]"
                >
                  <button
                    type="button"
                    onClick={() => setSel(n.id)}
                    onDoubleClick={() => n.subject && router.push(n.subject.href)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && isSel && n.subject) { e.preventDefault(); router.push(n.subject.href); }
                    }}
                    aria-pressed={isSel}
                    aria-label={`${n.severity}: ${n.headline}`}
                    className="row-stack block w-full cursor-pointer text-left"
                  >
                    <span className="row-stack-head">
                      <span className={cn("row-primary", isNew ? "type-data-strong" : "type-data")}>
                        {n.headline}
                      </span>
                      <span className="flex shrink-0 items-center gap-[var(--space-2)]">
                        <SeverityChip severity={n.severity} open={open} />
                        <StateMark state={st} />
                      </span>
                    </span>
                    <span className="row-stack-body block type-meta">
                      {resolved
                        ? <>Resolved · {resolved}</>
                        : <>{n.subject && <>{n.subject.label} · </>}{n.tag} · {n.when}</>}
                    </span>
                  </button>
                </li>
              );
            })}
          </Rows>
        )}
      </div>
    </SplitPage>
  );
}

/* ── the item, in full ──────────────────────────────────────────────────────── */
function ItemPanel({ n }: { n: Notification }) {
  const { s } = useDemo();
  const { state, resolved } = inboxState(s, n);
  const open = state === "new" || state === "seen";

  return (
    <div className="space-y-[var(--space-6)]">
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <SeverityChip severity={n.severity} open={open} />
        <Chip tone="neutral">{n.tag}</Chip>
        <span className="ml-auto"><StateMark state={state} /></span>
      </div>

      <div>
        <h2 className="type-section">{n.headline}</h2>
        <p className="mt-[var(--space-2)] type-data text-label-secondary">{n.detail}</p>
      </div>

      {resolved && <Done>Resolved · {resolved}</Done>}

      <DataList
        rows={[
          ...(n.evidence ? [{ label: "Evidence", value: n.evidence }] : []),
          { label: "From", value: n.generatedBy },
          { label: "When", value: n.when },
          {
            label: "About",
            value: n.subject ? (
              <Link
                href={n.subject.href}
                className="underline decoration-link-rest underline-offset-4 hover:decoration-ink"
              >
                {n.subject.label}
              </Link>
            ) : null,
            absent: "not applicable" as const,
          },
        ]}
      />
    </div>
  );
}

/* ── the inspector's footer: the item's own act, then the triage acts ─────────────
   The item's own action is the primary: it goes where the work is done. An action this
   build only draws is a schematic control, never the primary. A resolved item has
   nothing left to do, so its footer is the resolution. */
function ItemActs({ n, onTriage }: { n: Notification; onTriage: (n: Notification, next: NoticeState, message: string) => void }) {
  const { s } = useDemo();
  const { state, resolved } = inboxState(s, n);
  if (resolved) return null;
  const open = state === "new" || state === "seen";

  return (
    <div className="space-y-[var(--space-2)]">
      {open && n.action && (n.action.href ? (
        <Button asChild className="w-full">
          <Link href={n.action.href}>{n.action.label}</Link>
        </Button>
      ) : (
        <SchematicAction className="w-full justify-center">{n.action.label}</SchematicAction>
      ))}
      <div className="flex flex-wrap gap-[var(--space-2)]">
        {state !== "actioned" && (
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onTriage(n, "actioned", "Marked actioned")}>
            <Check aria-hidden /> Mark actioned
          </Button>
        )}
        {state !== "deferred" && (
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onTriage(n, "deferred", "Deferred")}>
            <Clock aria-hidden /> Defer
          </Button>
        )}
        {!open && (
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onTriage(n, "seen", "Back in the open list")}>
            Put it back in the open list
          </Button>
        )}
      </div>
    </div>
  );
}
