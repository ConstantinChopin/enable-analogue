"use client";
/**
 * Ask — recomposed as a document (docs/rebuild/04-recomposition-brief.md).
 *
 * Ask is a conversation product, not one conversation (review 01 §4). The page keeps
 * its three panes — recent conversations · the open thread · the sources that let the
 * reader check the answer — and still sizes against its panel, but each pane is now
 * typeset as the document it is rather than a grid of cards.
 *
 * Chapters, in the thread: one exchange is one chapter. The question is the chapter's
 * title, in the machine's voice, because it is what you typed; the answer follows in
 * the serif — an opening statement or a refusal in type-prose-lead, the rest in
 * type-prose, a quoted source in type-prose-quote. The answer's state (answered ·
 * sources disagree · refused · stale) and the way onward sit in the chapter's footer,
 * carried by Chip / SeverityBanner / StatusDot, never a raw colour. The landing is a
 * chapter too ("What do you need to know?") holding the entry composer.
 *
 * The one primary: "Ask" — the composer's send (contract: ask a question). It is the
 * pill at the bottom of the composer, the tool that owns it, pinned at the foot of the
 * thread pane and elevated because it follows you. Everything a thread offers —
 * Resolve…, Forward a document to the vault, Retry, Open — is a grey secondary or a
 * text action, because the person this page exists for is someone with a question,
 * and the next question is always the next thing.
 *
 * The tool that follows: "Sources" — the numbered sources with their excerpts, each
 * opening the document it was quoted from, and beneath them the trace of how the
 * answer was built — so the answer can be checked while it is being read. Below xl it
 * becomes an appendix under the thread. Text actions in the title row: Conversations
 * (small screens) · New conversation.
 *
 * Local components (page-only): Exchange (a chapter whose title is the question),
 * Foot (the footer row: state first, then actions), Mark (a numbered source mark),
 * Cite (a citation number carrying ProvenancePopover), StateMark (StatusDot by
 * conversation state), SheetBody (the same 24-inside body the record's sheets use).
 */
import React, { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, canViewCommissions } from "@/lib/store";
import {
  askThreads, commissionConflict, traceFor, keptSource, connections, notices, people, conversations, sourceDocuments,
  type Conversation,
} from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import {
  Chip, Section, SeverityBanner, NarrationNote, ConfidenceMeter, LayerBadge, ConfirmBanner,
  SchematicBadge, StatusDot, Rows, RowStack, ProvenancePopover, SourceTag, DataList, FilterChip,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowRight, ArrowUpRight, Copy, Loader2, X } from "lucide-react";

/** Threads reachable in this build: the four saved conversations plus two demo branches. */
type ThreadId = Conversation["id"] | "stale" | "loading";

const COMPOSER_PLACEHOLDER = "Ask about a rate, a property, a traveller…";

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function AskPage() {
  return (
    <Suspense fallback={null}>
      <Ask />
    </Suspense>
  );
}

function Ask() {
  const { s } = useDemo();
  const money = canViewCommissions(s.role);
  const stateParam = useSearchParams()?.get("state") ?? null;

  /* ?state= drives the demo branches. Nothing else auto-opens a thread. */
  const fromParams: ThreadId | null =
    stateParam === "refusal" ? "third-night"
    : stateParam === "stale" ? "stale"
    : stateParam === "loading" ? "loading"
    : null;

  /* A reader's pick is remembered against the URL it was made under, so a presenter
     jumping to a new ?state= always gets that branch rather than the last click. */
  const [picked, setPicked] = useState<{ under: string | null; id: ThreadId | null } | null>(null);
  const active = picked && picked.under === stateParam ? picked.id : fromParams;

  const [listOpen, setListOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [openDoc, setOpenDoc] = useState<string | null>(null);

  const choose = (id: ThreadId | null) => {
    setPicked({ under: stateParam, id });
    setDismissed(false);
    setListOpen(false);
  };

  const showRail = active !== null;

  return (
    // Same column as every other surface, so the title lands where the eye expects it
    // when moving between dock tiles. Ask still manages its own height below.
    <Page width="wide" fill>
      {/* Height comes from the panel this sits in, not from the viewport. Measuring
          100dvh here double-counted the shell's own chrome and padding, so the pinned
          composer ended up past the panel's bottom edge and under the dock. */}
      <div className="flex h-full min-h-0 flex-col">
        <PageHeader
          className="shrink-0"
          title="Ask"
          actions={
            <>
              {/* Both are routine navigation, so both are text actions. The one action
                  this surface exists for is asking, and that pill lives in the composer. */}
              <Button variant="link" size="sm" className="lg:hidden" onClick={() => setListOpen(true)}>
                Conversations
              </Button>
              <Button variant="link" size="sm" onClick={() => choose(null)}>
                New conversation
              </Button>
            </>
          }
        />

        <div className="flex min-h-0 flex-1 gap-[var(--gap-3)]">
          {/* ── recent conversations: page furniture, not nav, and not a box ── */}
          <div className="hidden min-h-0 w-[280px] shrink-0 flex-col lg:flex">
            <div className="shrink-0 pb-[var(--space-2)] type-micro-caps text-label-tertiary">Recent</div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ConversationList active={active} onPick={choose} />
            </div>
          </div>

          {/* ── the open thread ── */}
          <section className="flex min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto w-full min-w-0 max-w-[680px]">
                {active === null ? (
                  <Landing onPick={choose} />
                ) : (
                  <Thread
                    active={active}
                    money={money}
                    dismissed={dismissed}
                    onDismiss={() => setDismissed(true)}
                    onResolve={() => setResolveOpen(true)}
                  />
                )}
              </div>

              {/* Below xl the sources are an appendix under the thread, as chapters. */}
              {showRail && (
                <div className="mx-auto mt-[var(--gap-3)] w-full max-w-[680px] border-t border-hairline pt-[var(--space-6)] xl:hidden">
                  <Rail active={active} money={money} onOpenDoc={setOpenDoc} boxed={false} />
                </div>
              )}
            </div>

            {/* The composer is the tool that owns the one primary. It sits at the foot
                of the thread pane, above the dock. On the landing the large entry
                composer is the only one — two would compete. */}
            {active !== null && (
              <div className="shrink-0 pt-[var(--space-4)]">
                <div className="mx-auto w-full max-w-[680px]">
                  <Composer follows />
                </div>
              </div>
            )}
          </section>

          {/* ── the sources: the tool that follows ──
              `[&>*]:shrink-0` is what makes the `overflow-y-auto` mean anything: as a
              flex item the tool would otherwise compress to fit instead of overflowing.
              The negative margin leaves room for the elevation's shadow inside the
              scrolling column. */}
          {showRail && (
            <aside
              aria-label="Sources"
              className="-mx-[var(--space-4)] hidden w-[356px] shrink-0 flex-col overflow-y-auto px-[var(--space-4)] pb-[var(--space-6)] xl:flex [&>*]:shrink-0"
            >
              <Rail active={active} money={money} onOpenDoc={setOpenDoc} boxed />
            </aside>
          )}
        </div>
      </div>

      {/* conversations, on a small screen */}
      <Sheet open={listOpen} onOpenChange={setListOpen}>
        <SheetContent side="left" className="w-[min(92vw,360px)]">
          <SheetHeader>
            <SheetTitle>Conversations</SheetTitle>
            <SheetDescription>Recent questions on this desk.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-4)] py-[var(--space-3)]">
            <ConversationList active={active} onPick={choose} />
          </div>
        </SheetContent>
      </Sheet>

      <ResolveSheet open={resolveOpen} onOpenChange={setResolveOpen} />
      <DocumentSheet doc={openDoc} open={!!openDoc} onOpenChange={(v) => !v && setOpenDoc(null)} />
    </Page>
  );
}

/* ── conversations column ─────────────────────────────────────────────────── */

/* The conversation's outcome, in a word with a dot beside it — the "answer state"
   taxonomy, the one thing colour may mean on this screen. */
function StateMark({ state }: { state?: Conversation["state"] }) {
  if (!state) return null;
  const tone = state === "conflict" ? "crit" : state === "refusal" ? "warn" : "ok";
  const word = state === "conflict" ? "sources disagree" : state === "refusal" ? "refused" : "answered";
  return <StatusDot tone={tone}>{word}</StatusDot>;
}

function ConversationList({
  active, onPick,
}: { active: ThreadId | null; onPick: (id: ThreadId | null) => void }) {
  const { s } = useDemo();
  const role = s.role;
  /* Refusal is a v2 capability. In the March build the system answered rather than
     declining, so a thread marked `refused` could not exist — showing one dates the
     index to the wrong build and softens the failure the rewind is there to show. */
  const threads = conversations.filter((c) => s.world === "v2" || c.state !== "refusal");

  return (
    <ul role="listbox" aria-label="Recent conversations" className="divide-y divide-hairline type-data">
      {threads.map((c) => {
        const on = active === c.id;
        /* The question names the restricted figure. The outcome and the transcript
           length describe material this reader may not be able to open. Absent for
           them, not greyed. */
        const readable = !c.needsCommission || canViewCommissions(role);
        return (
          <li key={c.id} role="none">
            <button
              type="button"
              role="option"
              aria-selected={on}
              /* Named. Six conversation rows announced as "button" six times. */
              aria-label={`${c.title} — ${c.when}`}
              onClick={() => onPick(c.id)}
              className={cn(
                "pressable block w-full cursor-pointer border-l-2 py-[var(--space-3)] pr-[var(--space-2)] pl-[var(--space-3)] text-left",
                /* Selected is a 2px ink edge and the sunken ground — a difference that
                   survives without colour (VIS-021). */
                on ? "border-l-selected bg-sunken" : "border-l-transparent hover:bg-interactive",
              )}
            >
              <div className="flex items-baseline gap-[var(--space-2)]">
                <span className="min-w-0 flex-1 type-data-strong">{c.title}</span>
                <span className="shrink-0 type-micro text-label-secondary">{c.when}</span>
              </div>
              {readable && <p className="mt-0.5 line-clamp-2 type-meta">{c.preview}</p>}
              {readable && (
                <div className="mt-[var(--space-1)] flex items-center gap-[var(--space-2)] type-micro text-label-secondary">
                  <StateMark state={c.state} />
                  <span className="ml-auto tnum">{c.messages} messages</span>
                </div>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ── composer: the tool that owns the one primary ─────────────────────────── */

function Composer({ large = false, follows = false }: { large?: boolean; follows?: boolean }) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const { s, d } = useDemo();
  const grown = large || focused || value.length > 0;

  return (
    <Section variant="tool" follows={follows}>
      <form onSubmit={(e) => e.preventDefault()}>
        <Textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Ask a question"
          placeholder={COMPOSER_PLACEHOLDER}
          /* Compact by default, growing on focus; the landing's composer starts large. */
          className={cn(
            "max-h-[38vh] resize-none overflow-y-auto",
            large ? "min-h-32" : grown ? "min-h-20" : "min-h-[var(--control-h-md)]",
          )}
        />
        {/* Scope was dispatched from "Ask about this" on every record. It belongs on
            the composer: it narrows the question about to be asked, and it has to be
            removable, because a scope you cannot drop is a trap. A selected filter chip
            says both — pressing it clears it. No manifesto beside it: the scope is the
            only thing this row needs to say, because it is true, and it changes. */}
        <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-2)]">
          <span className="min-w-0 flex-1">
            {s.askScope && (
              <FilterChip selected onClick={() => d({ type: "askScope", scope: null })}>
                Scoped to {s.askScope}
                <X className="size-[var(--icon-sm)]" aria-hidden />
                <span className="sr-only">— ask across everything instead</span>
              </FilterChip>
            )}
          </span>
          <Button type="submit" disabled={!value.trim()}>Ask</Button>
        </div>
      </form>
    </Section>
  );
}

/* ── landing: the entry state ─────────────────────────────────────────────── */

function Landing({ onPick }: { onPick: (id: ThreadId | null) => void }) {
  return (
    <>
      <Section title="What do you need to know?">
        <p className="-mt-[var(--space-2)] mb-[var(--space-4)] max-w-[62ch] type-data-read text-label-secondary">
          Ask about a rate, a property, a traveller. Answers are built from this desk&apos;s own
          knowledge and carry their sources.
        </p>
        <Composer large />
        <p className="mt-[var(--space-3)] hidden type-meta lg:block">
          Or pick up one of the recent conversations on the left.
        </p>
      </Section>

      <Section title="Recent conversations" quiet className="lg:hidden">
        <ConversationList active={null} onPick={onPick} />
      </Section>
    </>
  );
}

/* ── the exchange: one question, one answer, one chapter ─────────────────────

   The two voices, on the one surface where the distinction is load-bearing. The
   question keeps the sans: it is what you typed, not what was written for you, and
   it is the chapter's title because it owns everything beneath it. The answer is the
   sentence an advisor forwards to a client, and is set in the serif. The trace, the
   chips and the sources stay sans — they are the machine showing its work.        */
function Exchange({ q, footer, children }: { q: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <Section title={q} footer={footer}>
      {children}
    </Section>
  );
}

/** The chapter's foot: the answer's state first, then the way onward. */
function Foot({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-[var(--space-2)]">{children}</div>;
}

/** A numbered source mark, the same in the answer's rail and the held-back list. */
function Mark({ n }: { n: number }) {
  return (
    <span className="inline-grid size-5 shrink-0 place-items-center rounded-full border border-hairline type-micro tnum text-label-secondary">
      {n}
    </span>
  );
}

/* A citation is a value with provenance: the number opens the source's what · where ·
   when, and the same number in the rail opens the document itself. */
function Cite({ n, sources }: { n: number; sources: RailSource[] }) {
  const src = sources.find((x) => x.n === n);
  const mark = <sup className="type-micro tnum">{n}</sup>;
  if (!src) return <span className="ml-0.5 text-label-secondary">{mark}</span>;
  return (
    <span className="ml-0.5">
      <ProvenancePopover source={provenanceOf(src)}>{mark}</ProvenancePopover>
    </span>
  );
}

function OpenRecord({ href = "/records/maison-leandre", children = "Open the record" }: { href?: string; children?: ReactNode }) {
  return (
    <Button asChild variant="link" size="sm">
      <Link href={href}>{children} <ArrowRight aria-hidden /></Link>
    </Button>
  );
}

/* ── thread router ────────────────────────────────────────────────────────── */

function Thread({
  active, money, dismissed, onDismiss, onResolve,
}: {
  active: ThreadId;
  money: boolean;
  dismissed: boolean;
  onDismiss: () => void;
  onResolve: () => void;
}) {
  switch (active) {
    case "leandre-rate":
      return <CommissionThread money={money} dismissed={dismissed} onDismiss={onDismiss} onResolve={onResolve} />;
    case "third-night":
      return <RefusalThread />;
    case "spa-status":
      return <SpaThread />;
    case "rep-paris":
      return <RepThread />;
    case "stale":
      return <StaleThread />;
    case "loading":
      return <LoadingThread />;
    default:
      return <UnbuiltThread id={active} />;
  }
}

/* ── the commission question: conflict → resolved ─────────────────────────── */

function CommissionThread({
  money, dismissed, onDismiss, onResolve,
}: { money: boolean; dismissed: boolean; onDismiss: () => void; onResolve: () => void }) {
  const { s } = useDemo();
  const resolved = s.conflictResolved;
  const q = askThreads.commission.q;

  if (!money) {
    return (
      <Exchange q={q} footer={<Foot><OpenRecord /></Foot>}>
        <p className="type-prose-lead">Commission terms sit with the owning advisor.</p>
        <p className="mt-[var(--space-2)] type-prose">
          This desk cannot answer the rate part of the question, and there is no partial figure to show.
        </p>
        <p className="mt-[var(--space-3)] type-meta">
          The breakfast and credit part of the question is answerable from the record.
        </p>
      </Exchange>
    );
  }

  if (!resolved && dismissed) {
    return (
      <Exchange q={q}>
        <SeverityBanner severity="Important">
          <div className="flex flex-wrap items-center gap-[var(--space-2)]">
            {/* The fact, without the boast. */}
            <span>The commission field stays in conflict.</span>
            <Button variant="secondary" size="sm" className="ml-auto" onClick={onResolve}>Resolve…</Button>
          </div>
        </SeverityBanner>
      </Exchange>
    );
  }

  if (!resolved) {
    return (
      <Exchange
        q={q}
        footer={
          <Foot>
            <Chip tone="crit">3 sources disagree</Chip>
            {/* The decision is offered as a secondary: the one primary on this surface is
                the next question. Dismissing is a text action — sometimes the answer is
                not knowable today, and the product lets you leave it that way. */}
            <Button variant="secondary" size="sm" onClick={onResolve}>Resolve…</Button>
            <OpenRecord />
            <Button variant="link" size="sm" onClick={onDismiss}>Dismiss (stays in conflict)</Button>
          </Foot>
        }
      >
        <p className="type-prose-lead">{commissionConflict.headline}</p>
        {/* Two lines per source: the subject keeps its width beside the value and its
            standing; where it came from and when sits beneath. */}
        <Rows className="mt-[var(--space-4)]">
          {commissionConflict.sources.map((src) => (
            <RowStack
              key={src.id}
              head={
                <>
                  <span className="row-primary truncate type-data-strong">{src.label}</span>
                  <span className="flex shrink-0 items-center gap-[var(--space-2)]">
                    <span className="type-data-strong tnum">{src.value}</span>
                    <Chip tone={src.id === "portal" ? "ok" : src.id === "manual" ? "crit" : "warn"}>{src.status}</Chip>
                  </span>
                </>
              }
            >
              {src.detail} · {src.when}
            </RowStack>
          ))}
        </Rows>
        <div className="mt-[var(--space-4)]">
          <NarrationNote>
            A ranking rule would be wrong often enough to cost money — the advisor decides once,
            and the decision is stored where every surface reads it.
          </NarrationNote>
        </div>
      </Exchange>
    );
  }

  const meta = askThreads.commission.resolved.meta;
  return (
    <Exchange
      q={q}
      footer={
        <Foot>
          <Chip tone="ok">answer contract met</Chip>
          <span className="type-meta"><StatusDot tone="ok">{meta.sources} sources</StatusDot></span>
          <span className="type-meta">oldest {meta.oldest}</span>
          <span className="type-meta">corroborated by {meta.corroborated}</span>
        </Foot>
      }
    >
      <div className="space-y-[var(--space-2)] type-prose">
        {askThreads.commission.resolved.lines.map((l) => (
          <p key={l.cite}>
            {l.text.replace("12%", keptSource(s.conflictChoice).value)}
            <Cite n={l.cite} sources={commissionSources} />
          </p>
        ))}
      </div>
      <p className="mt-[var(--space-3)] type-meta">
        Cites the resolution stored today at the agency layer — both other sources stay reachable.
      </p>
    </Exchange>
  );
}

/* ── the spa question — the v1/v2 payoff ──────────────────────────────────── */

function SpaThread() {
  const { s } = useDemo();
  const money = canViewCommissions(s.role);
  const spa = notices.find((n) => n.id === "spa");
  const noticeActive = s.world === "v2" && !!spa && !s.spaNoticeClosed;
  const sources = sourcesFor("spa-status", s.world, money);

  if (noticeActive && spa) {
    return (
      <Exchange
        q={askThreads.spa.q}
        footer={<Foot><Chip tone="warn">answer carries the notice</Chip><OpenRecord /></Foot>}
      >
        <SeverityBanner severity="Important" className="mb-[var(--space-4)]">
          <b>{spa.text}</b>{" "}
          <span>Opened {spa.openedAt} · {spa.scope} scope · {spa.owner}</span>
        </SeverityBanner>
        <p className="type-prose-lead">{askThreads.spa.v2}<Cite n={1} sources={sources} /></p>
      </Exchange>
    );
  }

  return (
    <Exchange
      q={askThreads.spa.q}
      footer={
        <Foot>
          {/* The contract is named, not merely asserted. In March it checked that an
              answer was sourced and cited — and this answer is both, and wrong. That
              is the argument: the contract was real, freshness was not yet in it. */}
          <Chip tone="ok">{s.world === "v1" ? "answer contract met — sourced, cited" : "answer contract met"}</Chip>
          <OpenRecord />
        </Foot>
      }
    >
      <p className="type-prose-lead">{askThreads.spa.v1}<Cite n={1} sources={sources} /></p>
      {s.world === "v1" && (
        <div className="mt-[var(--space-4)]">
          <NarrationNote>{askThreads.spa.v1Note}</NarrationNote>
        </div>
      )}
    </Exchange>
  );
}

/* ── rep firm ─────────────────────────────────────────────────────────────── */

function RepThread() {
  const { s } = useDemo();
  const sources = sourcesFor("rep-paris", s.world, canViewCommissions(s.role));
  return (
    <Exchange
      q={askThreads.rep.q}
      footer={
        <Foot>
          <Chip tone="ok">answer contract met</Chip>
          <OpenRecord href="/records/corvin-wells">Open the rep firm</OpenRecord>
        </Foot>
      }
    >
      <p className="type-prose-lead">
        {askThreads.rep.a}
        {askThreads.rep.cites.map((n) => <Cite key={n} n={n} sources={sources} />)}
      </p>
    </Exchange>
  );
}

/* ── refusal ──────────────────────────────────────────────────────────────── */

function RefusalThread() {
  const r = askThreads.refusal;
  const inbound = connections.find((c) => c.name.startsWith("Inbound mail"));
  const inboundAddr = inbound ? inbound.name.replace("Inbound mail — ", "") : "the inbound address";
  const [recovery, setRecovery] = useState<"forward" | "rep" | "flag" | null>(null);
  return (
    <Exchange q={r.q} footer={<Foot><Chip tone="warn">refused — answer contract not met</Chip></Foot>}>
      {/* The refusal is the most human sentence the product says, so it is set in the
          prose face. The contract beneath it is a check the machine ran, and stays in
          the machine's voice. */}
      <p className="type-prose-lead">{r.headline}</p>
      <p className="mt-[var(--space-2)] type-prose">{r.body}</p>

      <div className="mt-[var(--space-6)] type-micro-caps text-label-tertiary">The answer contract</div>
      <Rows>
        {r.contract.map((cl) => (
          <RowStack
            key={cl.clause}
            head={
              <>
                <span className="row-primary type-data-strong">{cl.clause}</span>
                <Chip tone={cl.ok ? "ok" : "crit"}>{cl.ok ? "passed" : "failed"}</Chip>
              </>
            }
          >
            {cl.note}
          </RowStack>
        ))}
      </Rows>
      <p className="mt-[var(--space-3)] type-meta">{r.policy}</p>

      {/* Ranked, not three equal controls. A refusal's whole value is the route forward,
          and only one of these actually reopens the answer — forwarding a document the
          vault can verify. That one is the grey secondary; the other two are text. */}
      <div className="mt-[var(--space-6)] type-micro-caps text-label-tertiary">The way forward</div>
      <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-[var(--space-3)]">
        <Button variant="secondary" size="sm" onClick={() => setRecovery("forward")}>{r.ctas[0]}</Button>
        <Button variant="link" size="sm" onClick={() => setRecovery("rep")}>{r.ctas[1]}</Button>
        <Button variant="link" size="sm" onClick={() => setRecovery("flag")}>{r.ctas[2]}</Button>
      </div>
      {recovery && (
        <div className="mt-[var(--space-3)]">
          <ConfirmBanner show>
            {recovery === "forward" && (
              <>Watching <span className="type-code">{inboundAddr}</span> — a verified document reopens this answer.</>
            )}
            {recovery === "rep" && <>Draft opened to Corvin &amp; Wells — nothing sends without review.</>}
            {recovery === "flag" && <>Flagged — appears in Confirm new records.</>}
          </ConfirmBanner>
        </div>
      )}
      <div className="mt-[var(--space-4)]">
        <NarrationNote>
          A refusal is a first-class outcome, not an error — what was found, which clause failed,
          and how to recover, all stated.
        </NarrationNote>
      </div>
    </Exchange>
  );
}

/* ── stale ────────────────────────────────────────────────────────────────── */

function StaleThread() {
  const { s } = useDemo();
  const st = askThreads.stale;
  const sources = sourcesFor("stale", s.world, canViewCommissions(s.role));
  return (
    <Exchange
      q={st.q}
      footer={
        <Foot>
          <Chip tone="warn">stale — inherits the field&apos;s warning</Chip>
          <OpenRecord />
        </Foot>
      }
    >
      <p className="type-prose-lead">{st.a}<Cite n={1} sources={sources} /></p>
    </Exchange>
  );
}

/* ── retrieval timeout ────────────────────────────────────────────────────── */

function LoadingThread() {
  return (
    <Exchange q={askThreads.commission.q}>
      <p className="flex items-center gap-[var(--space-2)] type-data-strong">
        <Loader2 className="size-[var(--icon-md)] animate-spin text-label-secondary" aria-hidden />
        Building the answer
      </p>
      <div className="mt-[var(--space-3)]">
        <TraceList threadId="leandre-rate" pendingStage={2} />
      </div>
      <SeverityBanner severity="Important" className="mt-[var(--space-4)]">
        <div className="flex flex-wrap items-center gap-[var(--space-2)]">
          <span>
            Retrieval timed out at the last stage. The partial trace is shown — no partial answer is
            rendered.
          </span>
          <Button asChild variant="secondary" size="sm" className="ml-auto">
            <Link href="/ask?state=loading">Retry</Link>
          </Button>
        </div>
      </SeverityBanner>
    </Exchange>
  );
}

/* ── conversations kept on file but not reconstructed in this build ───────── */

function UnbuiltThread({ id }: { id: ThreadId }) {
  const c = conversations.find((x) => x.id === id);
  return (
    <Exchange q={c?.preview ?? "…"}>
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <span className="type-data-strong">{c?.title}</span>
        <SchematicBadge />
      </div>
      <p className="mt-[var(--space-2)] type-data-read text-label-secondary">
        This thread is on file with {c?.messages ?? 0} messages. Its transcript is not reconstructed
        in this build — the conversations it demonstrates are the rate, the refusal and the notice.
      </p>
    </Exchange>
  );
}

/* ── the trace ────────────────────────────────────────────────────────────── */

function TraceList({ threadId, pendingStage }: { threadId?: string | null; pendingStage?: number }) {
  const { s } = useDemo();
  /* The notice state at the moment of asking, so the stage reports what is true now. */
  const noticeActive = s.world === "v2" && !s.spaNoticeClosed;
  /* Built from what this reader can see. A stage that only touched restricted
     material is absent, exactly as the field itself is absent on the record —
     never a caption saying a stage was hidden. */
  const stages = traceFor(threadId ?? null, noticeActive).filter(
    (t) => !t.needsCommission || canViewCommissions(s.role),
  );
  /* Clamped, so "the stage that timed out" is always the last visible one rather
     than an index into a list this reader does not have. */
  const pendingFrom = pendingStage === undefined ? undefined : Math.min(pendingStage, stages.length - 1);

  return (
    <Rows>
      {stages.map((t, i) => {
        const pending = pendingFrom !== undefined && i >= pendingFrom;
        return (
          <RowStack
            key={t.stage}
            head={
              pending ? (
                <span className="inline-flex items-center gap-1.5 text-label-secondary">
                  <Loader2 className="size-[var(--icon-sm)] shrink-0 animate-spin" aria-hidden />
                  {t.stage}
                </span>
              ) : (
                <StatusDot tone="ok">{t.stage}</StatusDot>
              )
            }
          >
            {pending ? "pending" : t.detail}
          </RowStack>
        );
      })}
    </Rows>
  );
}

/* ── sources ──────────────────────────────────────────────────────────────── */

type SourceKind = "portal" | "intranet" | "email" | "gdrive" | "manual";
interface RailSource { n: number; label: string; detail: string; kind: SourceKind; quote?: string; doc?: string }

/** The kind of each cited commission source, by its number: a portal PDF, an intranet page, an email. */
const COMMISSION_KIND: Record<number, SourceKind> = { 1: "portal", 2: "intranet", 3: "email" };
const commissionSources: RailSource[] = askThreads.commission.sources.map((src) => ({
  ...src, kind: COMMISSION_KIND[src.n] ?? "portal",
}));

/** what · where · when for the popover, read off the source's own line. */
function provenanceOf(src: RailSource) {
  const parts = src.detail.split(" · ");
  const when = parts.find((p) => /\d{4}|\d+ days/.test(p)) ?? parts[parts.length - 1];
  const where = parts.filter((p) => p !== when).join(" · ") || src.label;
  return { what: src.label, where, when, kind: src.kind };
}

function sourcesFor(active: ThreadId, world: string, money: boolean): RailSource[] {
  switch (active) {
    case "leandre-rate":
      return money ? commissionSources : [];
    case "rep-paris":
      return [commissionSources[2]];
    case "spa-status":
      return world === "v2"
        ? [{ n: 1, label: "Agency notice", detail: "Maison Léandre · opened 12 Jun 2026 · agency scope · MK", kind: "manual" }]
        : [{ n: 1, label: "Property website capture", detail: "Pool and spa hours · Maison Léandre", kind: "gdrive" }];
    case "stale":
      return [{ n: 1, label: "Property website capture", detail: "Pool hours · 96 days unverified", kind: "gdrive" }];
    default:
      return [];
  }
}

/** The threads whose retrieval is reconstructed in this build. */
const BUILT: ThreadId[] = ["leandre-rate", "spa-status", "rep-paris", "stale"];

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

  const kindLabel = { pdf: "PDF document", email: "Email", page: "Intranet page" }[d.kind];

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
                    <dt className="type-micro-caps text-label-tertiary">{h.label}</dt>
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
                      /* The passage the answer rests on, marked where it sits: an ink edge. */
                      b.cited && "-mx-[var(--space-3)] border-l-2 border-l-selected bg-sunken py-[var(--space-1)] pr-[var(--space-3)] pl-[calc(var(--space-3)-2px)]",
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
          <span className="type-code text-label-secondary">{d.locator}</span>
          <span className="ml-auto type-meta">Highlighted passage is the one this answer cites.</span>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* The tool that follows: the sources, then how the answer was built. `boxed` is the
   xl rail (a tool, elevated because it follows); unboxed it is the appendix under
   the thread on a narrower panel, as chapters. */
function Rail({
  active, money, onOpenDoc, boxed,
}: { active: ThreadId | null; money: boolean; onOpenDoc: (doc: string) => void; boxed: boolean }) {
  const { s } = useDemo();
  if (active === null) return null;

  const variant = boxed ? "tool" : "chapter";

  if (active === "third-night") return <HeldBackRail boxed={boxed} />;

  if (!BUILT.includes(active) && active !== "loading") {
    return (
      <Section variant={variant} follows={boxed} title="Sources" chips={<SchematicBadge />}>
        <p className="type-meta">
          The trace and sources for this thread are not reconstructed in this build.
        </p>
      </Section>
    );
  }

  if (active === "loading") {
    return (
      <Section variant={variant} follows={boxed} title="How this answer was built">
        <TraceList threadId={active} pendingStage={2} />
        <p className="mt-[var(--space-3)] border-t border-hairline pt-[var(--space-3)] type-meta">
          Partial trace shown — no partial answer is rendered.
        </p>
      </Section>
    );
  }

  const sources = sourcesFor(active, s.world, money);
  const kept = keptSource(s.conflictChoice);

  return (
    <Section
      variant={variant}
      follows={boxed}
      title="Sources"
      footer={
        <>
          <CopyExportMenu />
          <p className="mt-[var(--space-2)] type-meta">
            A client-facing export drops the trace, the layer marks and the internal notes. The advisor
            copy keeps them.
          </p>
        </>
      }
    >
      {/* A citation you cannot open is a footnote, and a footnote asks to be taken on
          trust — the one thing this product refuses to ask anywhere else. The source's
          name is the text action that opens the document. The permission guarantee is
          not stated here: a panel that says nothing is being hidden has raised the
          possibility. The rule holds in the code; the screen shows what it shows. */}
      {sources.length > 0 && (
        <Rows>
          {sources.map((src) => {
            const openable = !!src.doc && !!sourceDocuments[src.doc];
            return (
              <li key={src.n} className="flex items-start gap-[var(--space-2)] py-[var(--space-3)]">
                <span className="mt-px"><Mark n={src.n} /></span>
                <div className="min-w-0 flex-1">
                  <div className="type-data-strong">
                    {openable ? (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => onOpenDoc(src.doc!)}
                        aria-label={`Open ${src.label} — ${src.detail}`}
                      >
                        {src.label}
                      </Button>
                    ) : (
                      src.label
                    )}
                  </div>
                  <div className="mt-0.5"><SourceTag kind={src.kind} label={src.detail} /></div>
                  {/* Someone else's words, quoted verbatim from a contract — prose, and
                      the one place the italic quote role belongs. */}
                  {src.quote && (
                    <blockquote className="mt-[var(--space-2)] border-l-2 border-l-selected pl-[var(--space-3)] type-prose-quote">
                      {src.quote}
                    </blockquote>
                  )}
                </div>
              </li>
            );
          })}
        </Rows>
      )}

      {active === "leandre-rate" && s.conflictResolved && (
        <p className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-2)] type-meta">
          <LayerBadge layer="agency" /> {kept.value} kept from {kept.label} · stored today · both other sources reachable
        </p>
      )}

      <div className={cn("border-t border-hairline pt-[var(--space-4)]", sources.length > 0 ? "mt-[var(--space-6)]" : "border-t-0 pt-0")}>
        <div className="type-section-quiet">How this answer was built</div>
        <div className="mt-[var(--space-1)]">
          <TraceList threadId={active} />
        </div>
      </div>
    </Section>
  );
}

function HeldBackRail({ boxed }: { boxed: boolean }) {
  const r = askThreads.refusal;
  return (
    <Section variant={boxed ? "tool" : "chapter"} follows={boxed} title="Held back">
      <p className="-mt-[var(--space-2)] type-data-read text-label-secondary">
        Both sources fail the freshness rule. They are visible here and excluded from the answer.
      </p>
      <Rows className="mt-[var(--space-3)]">
        {r.held.map((h, i) => (
          <RowStack
            key={h.label}
            head={
              <>
                <span className="row-primary flex min-w-0 items-center gap-[var(--space-2)] type-data-strong">
                  <Mark n={i + 1} />
                  <span className="truncate">{h.label}</span>
                </span>
                <Chip tone="crit">{h.age}</Chip>
              </>
            }
          >
            {h.detail}
          </RowStack>
        ))}
      </Rows>
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
          <Copy aria-hidden /> Copy (keeps provenance footer)
        </DropdownMenuItem>
        <DropdownMenuItem>
          <ArrowUpRight aria-hidden /> Export for client (strips internal reasoning)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── the sheet body: 24 inside, rows stacked — the record's anatomy ───────── */
function SheetBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-[var(--space-6)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]", className)}>{children}</div>;
}

/* ── resolve sheet — the same anatomy as the record's ─────────────────────── */

function ResolveSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { d } = useDemo();
  /* The same anatomy as the record's, and the same behaviour: all three values are
     selectable, the chosen one inverts its edge (VIS-021), and the decision carries a
     reason, because every irreversible act in this product does. */
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
          <SheetTitle>{commissionConflict.field} — 3 sources</SheetTitle>
          <SheetDescription>{commissionConflict.headline}</SheetDescription>
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
              <p className="mt-1 type-meta">
                Stored with the decision, so the next person sees what was kept and why.
              </p>
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
            <div className="type-micro-caps text-label-tertiary">Where this value goes</div>
            <p className="mt-1 type-data-read text-label-secondary">
              The value you keep is what the directory shows, what a quote uses, and what the chat
              answers with.
            </p>
            <DataList className="mt-[var(--space-2)]" rows={commissionConflict.impact.map((row) => ({
              label: row.surface, value: <span className="type-data-strong tnum">{chosen ? chosen.value : row.value}</span>,
            }))} />
          </div>

          <p className="type-meta">
            The kept value is stored at the agency layer, attributed to {people.advisor} and dated
            today. Both other sources stay reachable.
          </p>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
