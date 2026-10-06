"use client";
/**
 * Conversations — the assistant at full size (VIS-100, Constantin, 2026-09-28).
 *
 * Until 2026-09-28 this page was a read-only archive of the seeded conversations, with a
 * landing that sent you to the corner panel to ask, while the panel kept its own
 * conversations that never reached here (AI-01, AI-06). It is now the same assistant as
 * the panel, over the same conversations (components/assistant.tsx `threadsFor`), drawn
 * by the same `ThreadView` at the full density:
 *
 *   the list     280 wide on the left: every conversation, Today then Earlier, each with
 *                its state in a word and a dot. `?c=<id>` opens one; the selection lives
 *                in the URL.
 *   the thread   a 680 measure in the centre, the composer pinned at its foot. Arriving
 *                with nothing open, the composer sits in the middle of the column with
 *                starters from where you are (catch me up, the first insight's "why",
 *                a record). A conversation reopens at its last turn, word for word; if
 *                what an answer rested on has changed since, it says so and offers to ask
 *                again with today's sources.
 *   the rail     Sources, then "How this answer was built", for the answer in view. It
 *                follows the reading; a citation selects its source. Below xl it is an
 *                appendix under the thread.
 *
 * The panel does not draw here (the shell), and nothing on this page opens it (AI-02):
 * the corner button shows as the place you are, and it and ⌘J bring the focus to this
 * composer. Arriving while a conversation is open in the panel opens it here.
 *
 * Demo branches kept from the archive: `?state=refusal` opens the refused conversation,
 * `?state=stale` the stale one, `?state=loading` a retrieval that timed out.
 */
import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, canViewCommissions, type AnswerSource, type AssistantAnswer, type AssistantThread } from "@/lib/store";
import { askThreads, commissionConflict, traceFor, keptSource, people, sourceDocuments } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, Section, ConfidenceMeter, LayerBadge, StatusDot, Rows, SourceTag, DataList, Warning } from "@/components/bits";
import {
  ThreadView, Composer, Starters, EnableMark, AgentSays, Mark,
  threadsFor, groupThreads, threadState, titleOf, whenOf, startersFor, pickStarter, askAssistant, useRunAct, PAGE_COMPOSER,
} from "@/components/assistant";
import { AnnouncementSheet } from "@/components/publish-sheets";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpRight, Copy, Loader2 } from "lucide-react";

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function AskPage() {
  return (
    <Suspense fallback={null}>
      <Conversations />
    </Suspense>
  );
}

function Conversations() {
  const { s, d } = useDemo();
  const router = useRouter();
  const params = useSearchParams();
  const c = params?.get("c") ?? null;
  const st = params?.get("state") ?? null;
  const money = canViewCommissions(s);

  const threads = threadsFor(s);
  const thread = threads.find((t) => t.id === s.assistantThread);
  const loading = st === "loading";

  const [listOpen, setListOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [writing, setWriting] = useState(false);
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  /* the answer the rail shows, and the source a citation selected in it */
  const [inView, setInView] = useState<number | null>(null);
  const [cited, setCited] = useState<{ turn: number; n: number } | null>(null);
  const composer = useRef<HTMLInputElement>(null);
  const focusComposer = () => window.setTimeout(() => composer.current?.focus(), 0);

  const run = useRunAct({ inPanel: false, onSheet: (x) => (x === "resolve" ? setResolveOpen(true) : setWriting(true)) });

  /* ── arrival: ?c=, ?state=, the conversation open in the panel, or a new one ── */
  const synced = useRef<string | null>(null);
  useEffect(() => {
    const want = st === "refusal" ? "third-night" : st === "stale" ? "pool-hours" : c;
    if (want && threadsFor(s).some((t) => t.id === want)) {
      synced.current = want;
      if (s.assistantThread !== want || s.assistantOpen) d({ type: "thread", id: want, open: false });
      return;
    }
    if (s.assistantOpen && !loading) {
      /* open in the panel: it opens here instead (AI-02) */
      synced.current = s.assistantThread;
      d({ type: "assistant", open: false });
      if (s.assistantThread) router.replace(`/ask?c=${s.assistantThread}`, { scroll: false });
      return;
    }
    synced.current = null;
    if (s.assistantThread !== null || s.assistantOpen) d({ type: "thread", id: null, open: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c, st]);

  /* the conversation in front, into the URL, so Back and a link come back to it */
  const lastThread = useRef(s.assistantThread);
  useEffect(() => {
    if (s.assistantThread === lastThread.current) return;
    lastThread.current = s.assistantThread;
    setInView(null);
    setCited(null);
    if (s.assistantThread === synced.current) return;
    synced.current = s.assistantThread;
    router.replace(s.assistantThread ? `/ask?c=${s.assistantThread}` : "/ask", { scroll: false });
  }, [s.assistantThread, router]);

  /* The corner button and ⌘J open the panel everywhere else; here the page is the
     assistant, so they bring the focus to this composer instead (AI-02). */
  const wasOpen = useRef(s.assistantOpen);
  useEffect(() => {
    const was = wasOpen.current;
    wasOpen.current = s.assistantOpen;
    if (!s.assistantOpen || was) return;
    d({ type: "assistant", open: false });
    focusComposer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.assistantOpen]);

  const pick = (id: string) => { setListOpen(false); d({ type: "thread", id, open: false }); };
  const fresh = () => { setListOpen(false); d({ type: "thread", id: null, open: false }); if (loading) router.replace("/ask"); focusComposer(); };
  const ask = (words: string) => askAssistant(d, s, words, "/ask", !thread, { open: false });

  /* ── the rail follows the answer in view ── */
  const scroller = useRef<HTMLDivElement>(null);
  const turnCount = thread?.turns.length ?? 0;
  useEffect(() => {
    const root = scroller.current;
    if (!root || !thread) return;
    /* A new turn brings the rail to its answer; after that, the reading steers it. The
       observer's first report is where things already sit, so it is not a move. */
    setInView(null);
    let first = true;
    const io = new IntersectionObserver(
      (entries) => {
        if (first) { first = false; return; }
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const n = Number(e.target.getAttribute("data-answer-turn"));
          setInView(n);
          setCited((x) => (x && x.turn !== n ? null : x));
        }
      },
      { root, rootMargin: "-15% 0px -55% 0px" },
    );
    root.querySelectorAll("[data-answer-turn]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [thread?.id, turnCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const answered = thread ? thread.turns.flatMap((t, i) => (t.answer ? [i] : [])) : [];
  const railTurn = cited?.turn ?? (inView !== null && answered.includes(inView) ? inView : answered[answered.length - 1]);
  const railAnswer = thread && railTurn !== undefined ? thread.turns[railTurn]?.answer : undefined;
  const cite = (turn: number, n: number) => {
    setCited({ turn, n });
    window.setTimeout(() => document.querySelectorAll(`[data-source="${turn}-${n}"]`).forEach((el) => el.scrollIntoView({ block: "nearest", behavior: "smooth" })), 0);
  };

  return (
    <Page width="wide" fill>
      <div className="flex h-full min-h-0 flex-col">
        <PageHeader
          className="shrink-0"
          title="Conversations"
          count={`${threads.length} ${threads.length === 1 ? "conversation" : "conversations"}`}
          actions={
            <Button variant="tertiary" size="sm" className="lg:hidden" onClick={() => setListOpen(true)}>
              Show the list
            </Button>
          }
          create={<Button variant="secondary" size="sm" onClick={fresh}>New conversation</Button>}
        />

        <div className="flex min-h-0 flex-1 gap-[var(--gap-3)]">
          {/* ── every conversation ── */}
          <div className="lift-room hidden min-h-0 w-[280px] shrink-0 overflow-y-auto lg:block">
            <ConversationList threads={threads} current={s.assistantThread} onPick={pick} />
          </div>

          {/* ── the conversation, and its composer ── */}
          <section aria-label={thread ? titleOf(thread.title, s) : "New conversation"} className="flex min-w-0 flex-1 flex-col">
            <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="mx-auto w-full max-w-[680px] pb-[var(--space-6)]"><LoadingThread money={money} /></div>
              ) : thread ? (
                <>
                  <div className="mx-auto w-full max-w-[680px] pb-[var(--space-6)]">
                    <ThreadView thread={thread} density="full" inPanel={false} onAct={(a) => run(a, thread)} onCite={cite} />
                  </div>
                  {/* Below xl the sources are an appendix under the thread. */}
                  {railAnswer && railTurn !== undefined && (
                    <div className="mx-auto w-full max-w-[680px] border-t border-hairline pt-[var(--space-6)] pb-[var(--space-6)] xl:hidden">
                      <SourcesRail a={railAnswer} turn={railTurn} selected={cited?.n ?? null} onOpenDoc={setOpenDoc} boxed={false} />
                    </div>
                  )}
                </>
              ) : (
                /* Nothing open: the composer in the middle of the column, with starters
                   from where you are (AI-06). */
                <div className="flex min-h-full flex-col justify-center py-[var(--space-6)]">
                  <div className="mx-auto w-full max-w-[680px] space-y-[var(--space-4)]">
                    <div className="flex items-center gap-[var(--space-3)]">
                      <EnableMark className="size-6 shrink-0" />
                      <p className="type-prose-lead">Ask about anything the agency knows.</p>
                    </div>
                    <Composer id={PAGE_COMPOSER} inputRef={composer} context={null} onAsk={ask} large />
                    <Starters className="-mx-[var(--space-3)]" items={startersFor(s, "/ask")} onPick={(x) => pickStarter(d, s, x, "/ask", false)} />
                  </div>
                </div>
              )}
            </div>
            {(thread || loading) && (
              <div className="shrink-0 pt-[var(--space-3)]">
                <div className="mx-auto w-full max-w-[680px]">
                  <Composer id={PAGE_COMPOSER} inputRef={composer} context={null} onAsk={ask} />
                </div>
              </div>
            )}
          </section>

          {/* ── the sources: the tool that follows ──
              `[&>*]:shrink-0` is what makes the `overflow-y-auto` mean anything: as a
              flex item the tool would otherwise compress to fit instead of overflowing.
              The negative margin leaves room for the elevation's shadow inside the
              scrolling column. */}
          {railAnswer && railTurn !== undefined && !loading && (
            <aside
              aria-label="Sources"
              className="-mx-[var(--space-4)] hidden w-[356px] shrink-0 flex-col overflow-y-auto px-[var(--space-4)] pb-[var(--space-6)] xl:flex [&>*]:shrink-0"
            >
              <SourcesRail a={railAnswer} turn={railTurn} selected={cited?.n ?? null} onOpenDoc={setOpenDoc} boxed />
            </aside>
          )}
          {loading && (
            <aside aria-label="Sources" className="-mx-[var(--space-4)] hidden w-[356px] shrink-0 flex-col overflow-y-auto px-[var(--space-4)] pb-[var(--space-6)] xl:flex [&>*]:shrink-0">
              <Section variant="tool" follows title="How this answer was built">
                <TraceList stages={traceOfLoading(money)} pending={2} />
              </Section>
            </aside>
          )}
        </div>
      </div>

      {/* every conversation, on a small screen */}
      <Sheet open={listOpen} onOpenChange={setListOpen}>
        <SheetContent side="left" className="w-[min(92vw,360px)]">
          <SheetHeader>
            <SheetTitle>Conversations</SheetTitle>
            <SheetDescription>Today’s, then the ones kept on this desk.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-4)] py-[var(--space-3)]">
            <ConversationList threads={threads} current={s.assistantThread} onPick={pick} />
          </div>
        </SheetContent>
      </Sheet>

      <ResolveSheet open={resolveOpen} onOpenChange={setResolveOpen} />
      <AnnouncementSheet open={writing} onOpenChange={setWriting} />
      <DocumentSheet doc={openDoc} open={!!openDoc} onOpenChange={(v) => !v && setOpenDoc(null)} />
    </Page>
  );
}

/* ── the list: every conversation, Today then Earlier ────────────────────────── */

function ConversationList({ threads, current, onPick }: {
  threads: AssistantThread[]; current: string | null; onPick: (id: string) => void;
}) {
  const { s } = useDemo();
  return (
    <nav aria-label="Conversations">
      {groupThreads(threads).map((g) => (
        <div key={g.label} className="pb-[var(--space-3)]">
          <p className="px-[var(--space-3)] pb-[var(--space-1)] type-meta text-label-tertiary">{g.label}</p>
          <ul role="listbox" aria-label={`${g.label}’s conversations`} className="divide-y divide-hairline type-data">
            {g.threads.map((t) => {
              const on = t.id === current;
              const state = threadState(t, s);
              const title = titleOf(t.title, s);
              return (
                /* The selectable row (VIS-093): selected lifts onto raised paper — a
                   difference in surface and elevation, not in colour. */
                <li key={t.id} role="none" className="row-select">
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    aria-label={`${title}, ${whenOf(t)}, ${state.word}`}
                    onClick={() => onPick(t.id)}
                    className="block w-full cursor-pointer px-[var(--space-3)] py-[var(--space-3)] text-left"
                  >
                    <span className="flex items-baseline gap-[var(--space-2)]">
                      <span className="min-w-0 flex-1 truncate type-data-strong">{title}</span>
                      <span className="row-trailing shrink-0 type-meta tnum text-label-secondary">{whenOf(t)}</span>
                    </span>
                    <span className="mt-[var(--space-1)] flex items-center type-meta text-label-secondary">
                      <StatusDot tone={state.tone}>{state.word}</StatusDot>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* ── a retrieval that timed out (the `?state=loading` branch) ─────────────────── */

const traceOfLoading = (money: boolean) => traceFor("leandre-rate", true).filter((t) => !t.needsCommission || money);

function LoadingThread({ money }: { money: boolean }) {
  return (
    <div className="space-y-[var(--space-3)]">
      <p className="ml-auto w-fit max-w-[85%] rounded-lg bg-interactive px-[var(--space-3)] py-[var(--space-2)] type-data">{askThreads.commission.q}</p>
      <AgentSays full>
        <p className="flex items-center gap-[var(--space-2)] type-data-strong">
          <Loader2 className="size-[var(--icon-md)] animate-spin text-label-secondary" aria-hidden />
          Building the answer
        </p>
        <div className="xl:hidden"><TraceList stages={traceOfLoading(money)} pending={2} /></div>
        <Warning
          title="The search timed out at the last stage."
          actions={<Button asChild variant="secondary" size="sm"><Link href="/ask?c=leandre-rate">Try again</Link></Button>}
        >
          The stages that ran are shown. No partial answer is given.
        </Warning>
      </AgentSays>
    </div>
  );
}

/* ── the trace ────────────────────────────────────────────────────────────── */

function TraceList({ stages, pending }: { stages: { stage: string; detail: string }[]; pending?: number }) {
  /* Clamped, so "the stage that timed out" is always the last visible one. */
  const from = pending === undefined ? undefined : Math.min(pending, stages.length - 1);
  return (
    <Rows>
      {stages.map((t, i) => {
        const waiting = from !== undefined && i >= from;
        return (
          <li key={t.stage} className="row-stack">
            <div className="row-stack-head">
              {waiting ? (
                <span className="inline-flex items-center gap-1.5 text-label-secondary">
                  <Loader2 className="size-[var(--icon-sm)] shrink-0 animate-spin" aria-hidden />
                  {t.stage}
                </span>
              ) : (
                <StatusDot tone="muted">{t.stage}</StatusDot>
              )}
            </div>
            <div className="row-stack-body type-meta">{waiting ? "pending" : t.detail}</div>
          </li>
        );
      })}
    </Rows>
  );
}

/* ── the sources, and how the answer was built ─────────────────────────────────
   For the answer in view. A citation you cannot open is a footnote, and a footnote asks
   to be taken on trust, so a source with its document opens it. `boxed` is the xl rail
   (a tool, elevated because it follows); unboxed it is the appendix under the thread. */

const KIND_WORD: Record<NonNullable<AnswerSource["kind"]>, string> = {
  portal: "portal", intranet: "intranet", email: "email", gdrive: "capture", manual: "note",
  announcement: "announcement", tripsuite: "feed", axus: "feed", web: "open web",
};

function SourcesRail({ a, turn, selected, onOpenDoc, boxed }: {
  a: AssistantAnswer; turn: number; selected: number | null; onOpenDoc: (doc: string) => void; boxed: boolean;
}) {
  const { s } = useDemo();
  const variant = boxed ? "tool" : "chapter";
  const numbered = (a.sources ?? []).filter((x): x is AnswerSource => typeof x !== "string");
  const named = (a.sources ?? []).filter((x): x is string => typeof x === "string");
  const held = a.contract?.status === "refused" ? a.contract.held ?? [] : [];
  const kept = a.basis?.key === "conflict" && a.basis.was.startsWith("kept:") ? keptSource(s.conflictChoice) : null;

  return (
    <Section variant={variant} follows={boxed} title={held.length ? "Held back" : "Sources"} footer={boxed && numbered.length > 0 ? <CopyExportMenu /> : undefined}>
      {held.length > 0 && (
        <>
          <p className="mb-[var(--space-3)] type-data text-label-secondary">Both sources fail the freshness rule, so neither is in the answer.</p>
          <Rows>
            {held.map((h, i) => (
              <li key={h.label} className="row-stack">
                <div className="row-stack-head">
                  <span className="row-primary flex min-w-0 items-center gap-[var(--space-2)] type-data-strong">
                    <Mark n={i + 1} />
                    <span className="truncate">{h.label}</span>
                  </span>
                  <Chip tone="neutral">{h.age}</Chip>
                </div>
                <div className="row-stack-body type-meta">{h.detail}</div>
              </li>
            ))}
          </Rows>
        </>
      )}

      {numbered.length > 0 && (
        <Rows>
          {numbered.map((src) => {
            const openable = !!src.doc && !!sourceDocuments[src.doc];
            return (
              <li
                key={src.n}
                data-source={`${turn}-${src.n}`}
                data-state={selected === src.n ? "selected" : undefined}
                className="row-lift -mx-[var(--space-2)] flex items-start gap-[var(--space-2)] rounded-lg px-[var(--space-2)] py-[var(--space-3)]"
              >
                <span className="mt-px"><Mark n={src.n} /></span>
                <div className="min-w-0 flex-1">
                  <div className="type-data-strong">
                    {openable ? (
                      <Button variant="tertiary" size="sm" className="-mx-[var(--control-px-sm)]" onClick={() => onOpenDoc(src.doc!)} aria-label={`Open ${src.label}, ${src.detail}`}>
                        {src.label} <ArrowUpRight aria-hidden />
                      </Button>
                    ) : src.label}
                  </div>
                  <div className="mt-0.5">{src.kind ? <SourceTag kind={src.kind} label={src.detail} /> : <span className="type-meta">{src.detail}</span>}</div>
                  {/* Someone else's words, quoted verbatim: prose, in italic. */}
                  {src.quote && (
                    <blockquote className="mt-[var(--space-2)] rounded-lg bg-sunken px-[var(--space-4)] py-[var(--space-3)] type-prose italic">
                      {src.quote}
                    </blockquote>
                  )}
                </div>
                {src.kind && <span className="row-trailing shrink-0 type-meta text-label-tertiary">{KIND_WORD[src.kind]}</span>}
              </li>
            );
          })}
        </Rows>
      )}

      {named.length > 0 && <p className="type-meta">From {named.join(" · ")}</p>}

      {kept && (
        <p className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-2)] type-meta">
          <LayerBadge layer="agency" /> {kept.value} kept from {kept.label} · stored today · both other sources reachable
        </p>
      )}

      {a.trace && a.trace.length > 0 && (
        <div className={cn("border-t border-hairline pt-[var(--space-4)]", numbered.length || held.length ? "mt-[var(--space-6)]" : "border-t-0 pt-0")}>
          <div className="type-data text-label-secondary">How this answer was built</div>
          <div className="mt-[var(--space-1)]"><TraceList stages={a.trace} /></div>
        </div>
      )}

      {!numbered.length && !named.length && !held.length && !a.trace?.length && (
        <p className="type-meta">This answer cites no document.</p>
      )}
    </Section>
  );
}

/* ── copy / export ────────────────────────────────────────────────────────── */

function CopyExportMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm">
          <Copy aria-hidden /> Copy or export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>
          <Copy aria-hidden /> Copy with its sources
        </DropdownMenuItem>
        <DropdownMenuItem>
          <ArrowUpRight aria-hidden /> Export for a client, without the trace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── the document behind a citation ─────────────────────────────────────────────
   The cited passage is marked in place rather than extracted, so the reader sees what
   surrounds it. An extract can be quoted fairly or unfairly and there is no way to
   tell from the extract; the paragraph before it is how you tell.

   Paper, not product: a serif measure on a raised sheet over the sunken ground, the
   app's own chrome kept to the header and the footer. The kinds differ because the
   documents differ — a countersigned contract and a rep's email carry different
   weight, and an advisor deciding what to trust should see which one they are
   looking at before they read a word of it.                                        */
function DocumentSheet({
  doc, open, onOpenChange,
}: { doc: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const d = doc ? sourceDocuments[doc] : null;
  if (!d) return null;

  const kindLabel = { pdf: "PDF document", email: "Email", page: "Claromentis page" }[d.kind];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(92vw,680px)]">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-[var(--space-2)]">
            {d.title}
            <Chip tone="neutral">{kindLabel}</Chip>
            {d.page && <Chip tone="neutral" className="tnum">p.{d.page.n} of {d.page.of}</Chip>}
          </SheetTitle>
          {d.subtitle && <SheetDescription>{d.subtitle}</SheetDescription>}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-sunken p-[var(--space-4)]">
          <article className="mx-auto max-w-[62ch] rounded-lg bg-raised p-[var(--space-6)] shadow-elev-1">
            {d.header && (
              <dl className="mb-[var(--space-4)] space-y-1 border-b border-hairline pb-[var(--space-4)]">
                {d.header.map((h) => (
                  <div key={h.label} className="grid grid-cols-[72px_minmax(0,1fr)] gap-[var(--space-3)]">
                    <dt className="type-meta text-label-tertiary">{h.label}</dt>
                    <dd className="type-data">{h.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="space-y-[var(--space-3)]">
              {d.blocks.map((b, i) =>
                b.heading ? (
                  <h4 key={i} className="pt-[var(--space-2)] type-data-strong">{b.text}</h4>
                ) : (
                  <p
                    key={i}
                    className={cn(
                      "type-prose",
                      /* The passage the answer rests on, marked where it sits: a sunken
                         tile, rounded like a row (VIS-093), hanging into the gutter. */
                      b.cited && "-mx-[var(--space-3)] rounded-lg bg-sunken px-[var(--space-3)] py-[var(--space-1)]",
                    )}
                  >
                    {b.text}
                  </p>
                ),
              )}
            </div>
          </article>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-[var(--space-2)] border-t border-hairline px-[var(--space-6)] py-[var(--space-3)]">
          <span className="type-meta tnum text-label-secondary">{d.locator}</span>
          <span className="ml-auto type-meta">The marked passage is the one the answer cites.</span>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── the sheet body: 24 inside, rows stacked — the record's anatomy ───────── */
function SheetBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-[var(--space-6)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]", className)}>{children}</div>;
}

/* ── resolve sheet — the same anatomy as the record's ─────────────────────── */

function ResolveSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { d } = useDemo();
  /* The same anatomy as the record's, and the same behaviour: all three values are
     selectable, the chosen one inverts its edge (VIS-021), and the decision carries a
     reason, because every irreversible act in this product does. Settled here, the
     conversation says so under its answer and offers to ask again (AI-06). */
  const [picked, setPicked] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const chosen = commissionConflict.sources.find((c) => c.id === picked);

  const commit = () => {
    if (!picked || !reason.trim()) return;
    d({ type: "resolveConflict", choice: picked, reason: reason.trim() });
    onOpenChange(false);
    setPicked(null);
    setReason("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(92vw,560px)]">
        <SheetHeader>
          <SheetTitle>{commissionConflict.field}, 3 sources</SheetTitle>
          <SheetDescription>The sources disagree. Keep one, and say why.</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-[var(--space-4)]">
          <div role="radiogroup" aria-label="Sources" className="space-y-[var(--space-2)]">
            {commissionConflict.sources.map((src) => {
              const on = picked === src.id;
              return (
                <button
                  key={src.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPicked(src.id)}
                  className={cn(
                    "pressable block w-full cursor-pointer rounded-lg border p-[var(--space-4)] text-left",
                    on ? "border-selected bg-sunken" : "border-hairline hover:border-stroke-hover",
                  )}
                >
                  <div className="flex flex-wrap items-start gap-[var(--space-3)]">
                    <div className="min-w-0">
                      <div className="type-data-strong">{src.label}</div>
                      <div className="type-meta">{src.detail} · {src.when}</div>
                    </div>
                    <span className="ml-auto type-figure">{src.value}</span>
                  </div>
                  <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-[var(--space-3)]">
                    <span className="type-data-strong">{src.status}</span>
                    <ConfidenceMeter agree={src.agree} total={src.total} />
                    {on && <Chip tone="primary" className="ml-auto">Selected</Chip>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* The reason, required, and shown only once a value is chosen — so the sheet
              asks for a justification of a decision, not of an empty form. */}
          {chosen && (
            <div className="border-t border-hairline pt-[var(--space-4)]">
              <Label htmlFor="ask-resolve-reason">
                Why {chosen.value}? <span className="text-label-secondary">(required)</span>
              </Label>
              <p className="mt-1 type-meta">Kept with the decision, beside the value.</p>
              <Textarea
                id="ask-resolve-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Signed terms supersede the rate feed; confirmed with the rep firm."
                className="mt-[var(--space-3)]"
              />
              <Button className="mt-[var(--space-4)]" disabled={!reason.trim()} onClick={commit}>
                Store {chosen.value} at the agency layer
              </Button>
            </div>
          )}

          <div className="border-t border-hairline pt-[var(--space-4)]">
            <div className="type-meta text-label-tertiary">Where this value goes</div>
            <p className="mt-1 type-data text-label-secondary">
              The value you keep is what the directory shows, what a quote uses, and what answers give.
            </p>
            <DataList className="mt-[var(--space-2)]" rows={commissionConflict.impact.map((row) => ({
              label: row.surface, value: <span className="type-data-strong tnum">{chosen ? chosen.value : row.value}</span>,
            }))} />
          </div>

          <p className="type-meta">
            Stored at the agency layer, attributed to {people.advisor} and dated today. Both other sources stay reachable.
          </p>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
