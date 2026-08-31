"use client";
/**
 * Ask — the Conversation archetype (layout-exploration §7).
 *
 * Ask is a conversation *product*, not a single conversation (review 01 §4). Landing
 * shows recent conversations beside a composer; nothing auto-opens. The composer is
 * pinned to the bottom of the thread pane and floats above the dock (DEC §10.3,
 * option A), compact by default and growing on focus.
 *
 * The conversations column is page furniture — the dock owns navigation.
 */
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, canViewCommissions } from "@/lib/store";
import {
  askThreads, commissionConflict, traceFor, keptSource, connections, notices, people, conversations,
  type Conversation,
} from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import {
  Chip, Section, SeverityBanner, NarrationNote, ConfidenceMeter, LayerBadge, ConfirmBanner,
  SchematicBadge,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowRight, CheckCircle2, XCircle, CircleDashed, Scale, Copy, Loader2, MessagesSquare,
  Plus, SendHorizontal, ArrowUpRight, X,
} from "lucide-react";

/** Threads reachable in this build: the six saved conversations plus two demo branches. */
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

  const choose = (id: ThreadId | null) => {
    setPicked({ under: stateParam, id });
    setDismissed(false);
    setListOpen(false);
  };

  const rail = <Rail active={active} money={money} />;
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
          className="mb-4 shrink-0"
          /* Scope lives on the composer, where it is removable. One place only. */
          title="Ask"
          actions={
            <>
              {/* Starting a conversation is routine navigation, not the action this
                  surface exists for — and while a refusal is on screen the one action
                  that matters is its recovery. Both were filled primaries, so the
                  ranking inside the refusal was cancelled from the header. */}
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setListOpen(true)}>
                <MessagesSquare className="size-[var(--icon-md)]" aria-hidden /> Conversations
              </Button>
              <Button variant="outline" size="sm" onClick={() => choose(null)}>
                <Plus className="size-[var(--icon-md)]" aria-hidden /> New conversation
              </Button>
            </>
          }
        />

        <div className="flex min-h-0 flex-1 gap-6">
          {/* ── recent conversations (page furniture, not nav) ── */}
          <Section
            variant="list"
            className="hidden w-[290px] shrink-0 lg:flex"
            bodyClassName="flex min-h-0 flex-col p-0"
          >
            <ConversationList active={active} onPick={choose} />
          </Section>

          {/* ── the active thread ── */}
          <section className="flex min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
              <div className="mx-auto w-full max-w-[680px] min-w-0 space-y-3">
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

              {showRail && (
                <div className="mx-auto mt-5 w-full max-w-[680px] space-y-3 xl:hidden">{rail}</div>
              )}
            </div>

            {/* The composer sits at the foot of the thread pane, above the dock. On the
                landing state the large entry composer is the only one — two would compete. */}
            {active !== null && (
              <div className="shrink-0 pt-3">
                <div className="mx-auto w-full max-w-[680px]">
                  <Composer />
                </div>
              </div>
            )}
          </section>

          {/* ── sources rail ── */}
          {showRail && (
            <aside className="hidden w-[320px] shrink-0 flex-col gap-3 overflow-y-auto xl:flex">{rail}</aside>
          )}
        </div>
      </div>

      {/* conversations, on a small screen */}
      <Sheet open={listOpen} onOpenChange={setListOpen}>
        <SheetContent side="left" className="w-[320px] max-w-[86vw] gap-0 p-0">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle className="type-data-strong">Conversations</SheetTitle>
            <SheetDescription className="type-meta">Recent questions on this desk.</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col">
            <ConversationList active={active} onPick={choose} />
          </div>
        </SheetContent>
      </Sheet>

      <ResolveSheet open={resolveOpen} onOpenChange={setResolveOpen} />
    </Page>
  );
}

/* ── conversations column ─────────────────────────────────────────────────── */

function StateMark({ state }: { state?: Conversation["state"] }) {
  if (!state) return null;
  const tone = state === "conflict" ? "bg-crit" : state === "refusal" ? "bg-warn" : "bg-ok";
  const word = state === "conflict" ? "sources disagree" : state === "refusal" ? "refused" : "answered";
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 type-micro text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", tone)} aria-hidden />
      {word}
    </span>
  );
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
    <>
      {/* The conversation rail is furniture. A filled, full-width primary here is the
          third filled button on the surface and competes with whatever the open thread
          is actually asking the reader to do. */}
      <div className="shrink-0 border-b border-border p-2">
        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onPick(null)}>
          <Plus className="size-[var(--icon-md)]" aria-hidden /> New conversation
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-3 pt-3 type-code uppercase tracking-widest text-muted-foreground">
          Recent
        </div>
        <ul className="p-2">
          {threads.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onPick(c.id)}
                aria-current={active === c.id}
                /* Named. Six conversation cards announced as "button" six times. */
                aria-label={`${c.title} — ${c.when}`}
                className={cn(
                  "w-full cursor-pointer rounded-md px-3 pb-2 text-left transition-colors",
                  active === c.id ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <div className="row-grid">
                  <span className="row-primary type-data-strong">{c.title}</span>
                  <span className="row-trailing type-micro text-muted-foreground">{c.when}</span>
                </div>
                {/* The question names the restricted figure. Withheld with the outcome
                    and the count, rather than shown to a reader who cannot have the answer. */}
                {(!c.needsCommission || canViewCommissions(role)) && (
                  <p className="line-clamp-2 type-meta">{c.preview}</p>
                )}
                {/* The outcome and the transcript length describe material this reader
                    may not be able to open. Absent for them, not greyed. */}
                {(!c.needsCommission || canViewCommissions(role)) && (
                  <div className="mt-1 flex items-center gap-2">
                    <StateMark state={c.state} />
                    <span className="ml-auto type-micro text-muted-foreground tnum">{c.messages} messages</span>
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/* ── composer ─────────────────────────────────────────────────────────────── */

function Composer({ large = false }: { large?: boolean }) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const { s, d } = useDemo();
  const grown = large || focused || value.length > 0;

  /* Scope was dispatched from "Ask about this" on every record and read into a crumb
     the header does not draw, so arriving from a record looked identical to arriving
     cold. It belongs on the composer: it narrows the question about to be asked, and
     it has to be removable, because a scope you cannot drop is a trap. */
  const scopeChip = s.askScope ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted py-0.5 pl-2.5 pr-1 type-micro">
      Scoped to {s.askScope}
      <button
        type="button"
        onClick={() => d({ type: "askScope", scope: null })}
        aria-label={`Ask across everything instead of ${s.askScope}`}
        className="grid size-4 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      >
        <X className="size-3" aria-hidden />
      </button>
    </span>
  ) : null;

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div
        className={cn(
          "rounded-lg border bg-card transition-colors",
          focused ? "border-primary/60" : "border-border",
        )}
      >
        <Textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Ask a question"
          placeholder={COMPOSER_PLACEHOLDER}
          className={cn(
            "max-h-[38vh] resize-none overflow-y-auto border-0 bg-transparent px-4 py-2 type-data shadow-none transition-[min-height] duration-150 focus-visible:ring-0",
            grown ? (large ? "min-h-[120px]" : "min-h-[76px]") : "min-h-[42px]",
          )}
        />
        {/* No manifesto here. The composer showed a permanent claim — "every answer cites
            sources you can open" — that a restricted reader can see is false on the very
            screen it sits on. The scope chip below is the only thing this row needs to say:
            it is true, and it changes. */}
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
          <span className="min-w-0 flex-1">{scopeChip}</span>
          <Button type="submit" size="sm" disabled={!value.trim()}>
            <SendHorizontal className="size-3.5" aria-hidden /> Ask
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ── landing: the entry state ─────────────────────────────────────────────── */

function Landing({ onPick }: { onPick: (id: ThreadId) => void }) {
  return (
    <div className="pt-6">
      <h2 className="type-section">What do you need to know?</h2>
      <p className="mt-1 type-data text-muted-foreground">
        Ask about a rate, a property, a traveller. Answers are built from this desk&apos;s own
        knowledge and carry their sources.
      </p>

      <div className="mt-4">
        <Composer large />
      </div>

      <div className="mt-6 lg:hidden">
        <div className="type-code uppercase tracking-widest text-muted-foreground">
          Recent conversations
        </div>
        <Section variant="list" className="mt-2">
          <ul className="divide-y divide-border">
          {conversations.slice(0, 4).map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onPick(c.id)}
                className="w-full cursor-pointer px-3 pb-2 text-left hover:bg-muted/60"
              >
                <div className="row-grid">
                  <span className="row-primary type-data-strong">{c.title}</span>
                  <span className="row-trailing type-micro text-muted-foreground">{c.when}</span>
                </div>
                <p className="truncate type-meta">{c.preview}</p>
              </button>
            </li>
          ))}
          </ul>
        </Section>
      </div>

      <p className="mt-6 hidden type-meta lg:block">
        Or pick up one of the recent conversations on the left.
      </p>
    </div>
  );
}

/* ── bubbles + citation marks ─────────────────────────────────────────────── */

/* The two voices, on the one surface where the distinction is load-bearing.

   The type system says: sans for anything the machine computed, serif for anything a
   person reads as prose. Every table, chip and figure in the product honours it — and
   Ask, which is nothing but prose, was set entirely in the machine voice. The answer
   is the sentence an advisor forwards to a client; it should not look like a cell.

   The question keeps the sans. It is what you typed, not what was written for you, and
   the contrast between the two is the point: you ask in the interface's voice and are
   answered in a human one. The trace, the chips and the sources stay sans throughout —
   they are the machine showing its work, and that is exactly what they should look
   like.                                                                              */
function Q({ children }: { children: React.ReactNode }) {
  return (
    <div className="ml-auto w-fit max-w-[85%] rounded-lg bg-primary px-4 py-3 type-data text-primary-foreground">
      {children}
    </div>
  );
}
function A({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Section className={cn("px-4 py-3", className)} bodyClassName="type-prose">
      {children}
    </Section>
  );
}
function Cite({ n }: { n: number }) {
  return (
    <span className="ml-1 inline-grid size-[17px] translate-y-[-1px] place-items-center rounded-full border border-primary/50 align-middle type-micro text-primary tnum">
      {n}
    </span>
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

  if (!money) {
    return (
      <>
        <Q>{askThreads.commission.q}</Q>
        <A>
          <p>
            Commission terms sit with the owning advisor. This desk cannot answer the rate part of
            the question, and there is no partial figure to show.
          </p>
          <p className="mt-2 type-meta">
            The breakfast and credit part of the question is answerable from the record.
          </p>
          <Button asChild variant="ghost" size="sm" className="mt-2 px-0 text-primary">
            <Link href="/records/maison-leandre">
              Open the record <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </A>
      </>
    );
  }

  return (
    <>
      <Q>{askThreads.commission.q}</Q>

      {!resolved && !dismissed && (
        <A className="border-warn/60">
          <div className="flex items-center gap-2 font-semibold">
            <Scale className="size-4 text-warn" aria-hidden /> Sources disagree — nothing assumed.
          </div>
          <p className="mt-1 type-data text-muted-foreground">{commissionConflict.headline}</p>
          <div className="mt-3 divide-y divide-border rounded-lg border border-border">
            {commissionConflict.sources.map((src) => (
              <div key={src.id} className="row-grid px-3">
                <span className="row-primary type-data-strong">{src.label}</span>
                <span className="row-meta type-meta">{src.detail} · {src.when}</span>
                <span className="row-trailing flex items-center gap-2">
                  <span className="type-data-strong tnum">{src.value}</span>
                  <Chip tone={src.id === "portal" ? "ok" : src.id === "manual" ? "crit" : "warn"}>{src.status}</Chip>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={onResolve}>Resolve…</Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/records/maison-leandre">
                Open the record <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={onDismiss}>Dismiss (stays in conflict)</Button>
          </div>
          <div className="mt-3">
            <NarrationNote>
              A ranking rule would be wrong often enough to cost money — the advisor decides once,
              and the decision is stored where every surface reads it.
            </NarrationNote>
          </div>
        </A>
      )}

      {!resolved && dismissed && (
        <SeverityBanner severity="Important">
          <div className="flex flex-wrap items-center gap-2">
            <span>The commission field stays in conflict. Nothing is assumed.</span>
            <Button size="sm" variant="outline" className="ml-auto" onClick={onResolve}>Resolve…</Button>
          </div>
        </SeverityBanner>
      )}

      {resolved && (
        <A>
          <div className="space-y-2">
            {askThreads.commission.resolved.lines.map((l) => (
              <p key={l.cite}>{l.text.replace("12%", keptSource(s.conflictChoice).value)}<Cite n={l.cite} /></p>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3 type-meta">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-ok" aria-hidden />
              {askThreads.commission.resolved.meta.sources} sources
            </span>
            <span>oldest {askThreads.commission.resolved.meta.oldest}</span>
            <span>corroborated by {askThreads.commission.resolved.meta.corroborated}</span>
            <Chip tone="ok" className="ml-auto">answer contract met</Chip>
          </div>
          <p className="mt-2 type-meta">
            Cites the resolution stored today at the agency layer — both other sources stay reachable.
          </p>
        </A>
      )}
    </>
  );
}

/* ── the spa question — the v1/v2 payoff ──────────────────────────────────── */

function SpaThread() {
  const { s } = useDemo();
  const spa = notices.find((n) => n.id === "spa");
  const noticeActive = s.world === "v2" && !!spa && !s.spaNoticeClosed;
  return (
    <>
      <Q>{askThreads.spa.q}</Q>
      {noticeActive && spa ? (
        <>
          <SeverityBanner severity="Important">
            <b>Active notice: {spa.text}</b>{" "}
            <span className="text-muted-foreground">
              Opened {spa.openedAt} · {spa.scope} scope · {spa.owner}
            </span>
          </SeverityBanner>
          <A>
            <p>{askThreads.spa.v2}<Cite n={1} /></p>
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-2">
              <Chip tone="warn">answer carries the notice</Chip>
              <Button asChild variant="ghost" size="sm" className="ml-auto text-primary">
                <Link href="/records/maison-leandre">
                  Open the record <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
            </div>
          </A>
        </>
      ) : (
        <>
          <A>
            <p>{askThreads.spa.v1}<Cite n={1} /></p>
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-2">
              {/* The contract is named, not merely asserted. In March it checked that an
                  answer was sourced and cited — and this answer is both, and wrong. That
                  is the argument: the contract was real, freshness was not yet in it. */}
              <Chip tone="ok">
                {s.world === "v1" ? "answer contract met — sourced, cited" : "answer contract met"}
              </Chip>
            </div>
          </A>
          {s.world === "v1" && <NarrationNote>{askThreads.spa.v1Note}</NarrationNote>}
        </>
      )}
    </>
  );
}

/* ── rep firm ─────────────────────────────────────────────────────────────── */

function RepThread() {
  return (
    <>
      <Q>{askThreads.rep.q}</Q>
      <A>
        {askThreads.rep.a}
        {askThreads.rep.cites.map((n) => <Cite key={n} n={n} />)}
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-2">
          <Chip tone="ok">answer contract met</Chip>
          <Button asChild variant="ghost" size="sm" className="ml-auto text-primary">
            <Link href="/records/corvin-wells">
              Open the rep firm <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </A>
    </>
  );
}

/* ── refusal ──────────────────────────────────────────────────────────────── */

function RefusalThread() {
  const r = askThreads.refusal;
  const inbound = connections.find((c) => c.name.startsWith("Inbound mail"));
  const inboundAddr = inbound ? inbound.name.replace("Inbound mail — ", "") : "the inbound address";
  const [recovery, setRecovery] = useState<"forward" | "rep" | "flag" | null>(null);
  return (
    <>
      <Q>{r.q}</Q>
      <A>
        {/* The refusal is the most human sentence the product says, and it was set in
            the smallest machine face. It reads as prose; the contract beneath it is a
            check the machine ran, and stays in the machine's voice. */}
        <div className="rounded-lg border border-border bg-subtle px-3 py-3">
          <div className="flex items-center gap-2">
            <CircleDashed className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="type-prose-lead">{r.headline}</span>
          </div>
          <p className="mt-1 type-prose">{r.body}</p>
        </div>
        <ul className="mt-3 space-y-2">
          {r.contract.map((cl) => (
            <li key={cl.clause} className="flex items-start gap-2 type-data">
              {cl.ok
                ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
                : <XCircle className="mt-0.5 size-4 shrink-0 text-crit" aria-hidden />}
              <span><b>{cl.clause}</b> {cl.note}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-border pt-3 type-meta">{r.policy}</p>
        {/* Ranked, not three equal outlines.
            A refusal's whole value is the route forward, and only one of these three
            actually reopens the answer — forwarding a document the vault can verify.
            Weighting all three the same offered a choice where the product has an
            opinion, so none of them read as the recommended one. */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={() => setRecovery("forward")}>
            {r.ctas[0]}
          </Button>
          <button
            type="button"
            onClick={() => setRecovery("rep")}
            className="cursor-pointer type-meta underline underline-offset-2 hover:text-foreground"
          >
            {r.ctas[1]}
          </button>
          <button
            type="button"
            onClick={() => setRecovery("flag")}
            className="cursor-pointer type-meta underline underline-offset-2 hover:text-foreground"
          >
            {r.ctas[2]}
          </button>
        </div>
        {recovery && (
          <div className="mt-3">
            <ConfirmBanner show>
              {recovery === "forward" && (
                <>Watching <span className="font-mono">{inboundAddr}</span> — a verified document reopens this answer.</>
              )}
              {recovery === "rep" && <>Draft opened to Corvin &amp; Wells — nothing sends without review.</>}
              {recovery === "flag" && <>Flagged — appears in Confirm new records.</>}
            </ConfirmBanner>
          </div>
        )}
        <div className="mt-3">
          <NarrationNote>
            A refusal is a first-class outcome, not an error — what was found, which clause failed,
            and how to recover, all stated.
          </NarrationNote>
        </div>
      </A>
    </>
  );
}

/* ── stale ────────────────────────────────────────────────────────────────── */

function StaleThread() {
  const st = askThreads.stale;
  return (
    <>
      <Q>{st.q}</Q>
      <A>
        <p>{st.a}<Cite n={1} /></p>
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-2">
          <Chip tone="warn">stale — inherits the field&apos;s warning</Chip>
          <Button asChild variant="ghost" size="sm" className="ml-auto text-primary">
            <Link href="/records/maison-leandre">
              Open the record <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </A>
    </>
  );
}

/* ── retrieval timeout ────────────────────────────────────────────────────── */

function LoadingThread() {
  return (
    <>
      <Q>{askThreads.commission.q}</Q>
      <A className="border-warn/60">
        <div className="flex items-center gap-2 type-data-strong">
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
          Building the answer
        </div>
        <div className="mt-3">
          <TraceList threadId="leandre-rate" pendingStage={2} />
        </div>
      </A>
      <SeverityBanner severity="Important">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            Retrieval timed out at the last stage. The partial trace is shown — no partial answer is
            rendered.
          </span>
          <Button asChild size="sm" variant="outline" className="ml-auto">
            <Link href="/ask?state=loading">Retry</Link>
          </Button>
        </div>
      </SeverityBanner>
    </>
  );
}

/* ── conversations kept on file but not reconstructed in this build ───────── */

function UnbuiltThread({ id }: { id: ThreadId }) {
  const c = conversations.find((x) => x.id === id);
  return (
    <>
      <Q>{c?.preview ?? "…"}</Q>
      <A>
        <div className="flex flex-wrap items-center gap-2">
          <span className="type-data-strong">{c?.title}</span>
          <SchematicBadge />
        </div>
        <p className="mt-2 type-data text-muted-foreground">
          This thread is on file with {c?.messages ?? 0} messages. Its transcript is not reconstructed
          in this build — the conversations it demonstrates are the rate, the refusal and the notice.
        </p>
      </A>
    </>
  );
}

/* ── rails ────────────────────────────────────────────────────────────────── */

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
    <ol className="space-y-3">
      {stages.map((t, i) => {
        const pending = pendingFrom !== undefined && i >= pendingFrom;
        return (
          <li key={t.stage} className="flex items-start gap-2 type-data">
            {pending
              ? <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
              : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />}
            <span>
              <span className={cn(pending && "text-muted-foreground")}>{t.stage}</span>
              <span className="block type-meta">{pending ? "pending" : t.detail}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

interface RailSource { n: number; label: string; detail: string; quote?: string }

function sourcesFor(active: ThreadId, world: string, money: boolean): RailSource[] {
  const cs = askThreads.commission.sources;
  switch (active) {
    case "leandre-rate":
      return money ? cs : [];
    case "rep-paris":
      return [cs[2]];
    case "spa-status":
      return world === "v2"
        ? [{ n: 1, label: "Agency notice", detail: "Maison Léandre · opened 12 Jun 2026 · agency scope · MK" }]
        : [{ n: 1, label: "Property website capture", detail: "Pool and spa hours · Maison Léandre" }];
    case "stale":
      return [{ n: 1, label: "Property website capture", detail: "Pool hours · 96 days unverified" }];
    default:
      return [];
  }
}

/** The threads whose retrieval is reconstructed in this build. */
const BUILT: ThreadId[] = ["leandre-rate", "spa-status", "rep-paris", "stale"];

function Rail({ active, money }: { active: ThreadId | null; money: boolean }) {
  const { s } = useDemo();
  if (active === null) return null;

  if (active === "third-night") return <HeldBackRail />;

  if (!BUILT.includes(active) && active !== "loading") {
    return (
      <Section title="Sources" chips={<SchematicBadge />}>
        <p className="type-meta">
          The trace and sources for this thread are not reconstructed in this build.
        </p>
      </Section>
    );
  }

  if (active === "loading") {
    return (
      <Section title="How this answer was built">
        <TraceList threadId={active} pendingStage={2} />
        <p className="mt-3 border-t border-border pt-2 type-meta">
          Partial trace shown — no partial answer is rendered.
        </p>
      </Section>
    );
  }

  const sources = sourcesFor(active, s.world, money);

  return (
    <>
      <Section title="How this answer was built">
        <TraceList threadId={active} />
      </Section>

      {sources.length > 0 && (
        <Section title="Sources">
          <div className="space-y-3">
            {sources.map((src) => (
              <div
                key={src.n}
                className={cn("rounded-lg border p-3", src.n === 1 ? "border-primary/50" : "border-border")}
              >
                <div className="flex items-center gap-2 type-data-strong">
                  <span className="inline-grid size-[17px] shrink-0 place-items-center rounded-full border border-border type-micro tnum">
                    {src.n}
                  </span>
                  {src.label}
                </div>
                <div className="mt-1 type-meta">{src.detail}</div>
                {/* Someone else's words, quoted verbatim from a contract — prose, and
                    the one place the italic quote role belongs. */}
                {src.n === 1 && src.quote && (
                  <blockquote className="mt-2 rounded-lg border-l-2 border-primary/60 bg-muted px-3 py-2 type-prose-quote">
                    {src.quote}
                  </blockquote>
                )}
              </div>
            ))}
          </div>
          {active === "leandre-rate" && s.conflictResolved && (
            <p className="mt-3 flex items-center gap-2 border-t border-border pt-2 type-meta">
              <LayerBadge layer="agency" /> {keptSource(s.conflictChoice).value} kept from {keptSource(s.conflictChoice).label} · stored today · both other sources reachable
            </p>
          )}
          <p className="mt-2 type-meta">
            A source you are not permitted to read never appears in this panel.
          </p>
        </Section>
      )}

      <Section title="Copy and export" chips={<SchematicBadge />}>
        <div className="flex flex-wrap gap-2">
          <CopyExportMenu />
        </div>
        <p className="mt-2 type-meta">
          A client-facing export drops the trace, the layer marks and the internal notes. The advisor
          copy keeps them.
        </p>
      </Section>
    </>
  );
}

function HeldBackRail() {
  const r = askThreads.refusal;
  return (
    <>
      <Section title="Held back">
        <p className="type-meta">
          Both sources fail the freshness rule. They are visible here and excluded from the answer.
        </p>
      </Section>
      <Section title="Sources found">
        <div className="space-y-3">
          {r.held.map((h, i) => (
            <div key={h.label} className="rounded-lg border border-dashed border-border p-3">
              <div className="flex items-center gap-2 type-data-strong">
                <span className="inline-grid size-[17px] shrink-0 place-items-center rounded-full border border-border type-micro tnum">
                  {i + 1}
                </span>
                {h.label}
              </div>
              <div className="mt-1 type-meta">{h.detail}</div>
              <Chip tone="crit" className="mt-2">{h.age}</Chip>
            </div>
          ))}
        </div>
        <p className="mt-2 type-meta">
          A source you are not permitted to read never appears in this panel.
        </p>
      </Section>
    </>
  );
}

/* ── copy / export ────────────────────────────────────────────────────────── */

function CopyExportMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Copy className="size-3.5" aria-hidden /> Copy or export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>
          <Copy className="size-3.5" aria-hidden /> Copy (keeps provenance footer)
        </DropdownMenuItem>
        <DropdownMenuItem>
          <ArrowUpRight className="size-3.5" aria-hidden /> Export for client (strips internal reasoning)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── resolve sheet — the same anatomy as the record's ─────────────────────── */

function ResolveSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { d } = useDemo();
  /* The same anatomy as the record's, and now the same behaviour. This door had all
     three values on screen and only one of them selectable, which is the ranking rule
     wearing the interface that exists to refuse it. */
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
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Scale className="size-4 text-crit" aria-hidden /> {commissionConflict.field} — 3 sources
          </SheetTitle>
          <SheetDescription>{commissionConflict.headline}</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4 pb-5">
          {commissionConflict.sources.map((src) => (
            <div
              key={src.id}
              className={cn("rounded-lg border p-4", src.id === picked ? "border-primary/50 bg-primary-soft/40" : "border-border")}
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0">
                  <div className="type-data-strong">{src.label}</div>
                  <div className="type-meta">{src.detail} · {src.when}</div>
                </div>
                <span className="ml-auto type-data-strong tnum">{src.value}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="type-data-strong">{src.status}</span>
                <ConfidenceMeter agree={src.agree} total={src.total} />
                <Button
                  size="sm"
                  variant={picked === src.id ? "default" : "outline"}
                  className="ml-auto"
                  onClick={() => setPicked(src.id)}
                >
                  {picked === src.id ? "Selected" : "Keep this value"}
                </Button>
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-border bg-subtle p-4">
            <div className="type-code uppercase tracking-widest text-muted-foreground">
              Where this value goes
            </div>
            <p className="mt-2 type-meta">
              The value you keep is what the directory shows, what a quote uses, and what the chat
              answers with. One decision, three places.
            </p>
            <dl className="mt-2 space-y-1 type-data">
              {commissionConflict.impact.map((row) => (
                <div key={row.surface} className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">{row.surface}</dt>
                  <dd className="type-data-strong tnum">{chosen ? chosen.value : row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* The reason, required, and shown only once a value is chosen — so the sheet
              asks for a justification of a decision, not of an empty form. */}
          {picked && (
            <div className="rounded-lg border border-border p-4">
              <span className="type-data-strong">Why this value</span>
              <p className="mt-1 type-meta">Stored with the decision, so the next person sees what was kept and why.</p>
              <Textarea
                className="mt-2"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Signed terms supersede the rate feed; confirmed with the rep firm."
              />
              <Button size="sm" className="mt-3" disabled={!reason.trim()} onClick={commit}>
                Store {chosen?.value} at the agency layer
              </Button>
            </div>
          )}

          <p className="type-meta">
            The kept value is stored at the agency layer, attributed to {people.advisor} and dated
            today. Both other sources stay reachable.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
