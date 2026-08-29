"use client";
/** Ask — Journey A. Thread + sources rail; states: default (conflict → resolved), refusal, stale, empty, loading. */
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo, canViewCommissions } from "@/lib/store";
import { askThreads, commissionConflict, trace, connections, notices, people } from "@/data/seed";
import {
  Chip, Section, PageHeader, SeverityBanner, NarrationNote, ConfidenceMeter, LayerBadge,
  ConfirmBanner, SchematicBadge,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  ArrowRight, CheckCircle2, XCircle, CircleDashed, Scale, Copy, Loader2, Search, Mail, Archive, LayoutGrid,
} from "lucide-react";

export default function AskPage() {
  return (
    <Suspense fallback={null}>
      <Ask />
    </Suspense>
  );
}

function Ask() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s.persona);
  const state = useSearchParams()?.get("state") ?? null;
  const [resolveOpen, setResolveOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const crumb = s.askScope ? `Ask / scoped to ${s.askScope}` : "Ask";
  const title =
    state === "refusal" ? "Third night free on suites"
    : state === "stale" ? "Pool hours"
    : state === "empty" ? "Ask"
    : "Maison Léandre — Atelier rate";

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6">
      <PageHeader crumb={crumb} title={title} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── thread column ── */}
        <div className="mx-auto w-full max-w-[660px] min-w-0 space-y-3">
          {state === "empty" && <EmptyThread />}
          {state === "refusal" && <RefusalThread />}
          {state === "stale" && <StaleThread />}
          {state === "loading" && <LoadingThread />}
          {state === null && (
            <DefaultThread money={money} dismissed={dismissed} onDismiss={() => setDismissed(true)} onResolve={() => setResolveOpen(true)} />
          )}

          {state !== "empty" && (
            <form onSubmit={(e) => e.preventDefault()} className="pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input placeholder="Ask a follow-up…" aria-label="Ask a follow-up" className="pl-8" />
              </div>
            </form>
          )}
        </div>

        {/* ── sources rail ── */}
        <aside className="min-w-0 space-y-3">
          {state === "refusal" ? (
            <HeldBackRail />
          ) : state === "empty" ? null : (
            <>
              <TraceRail pendingStage={state === "loading" ? 2 : undefined} />
              {state === null && money && <SourcesRail resolved={s.conflictResolved} />}
            </>
          )}
        </aside>
      </div>

      <ResolveSheet open={resolveOpen} onOpenChange={setResolveOpen} />
    </div>
  );
}

/* ── bubbles + citation marks ── */
function Q({ children }: { children: React.ReactNode }) {
  return <div className="ml-auto w-fit max-w-[85%] rounded-lg bg-primary px-4 py-2.5 text-[13.5px] text-primary-foreground">{children}</div>;
}
function A({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-lg border border-border bg-card px-4 py-3 text-[13.5px]", className)}>{children}</div>;
}
function Cite({ n }: { n: number }) {
  return (
    <span className="ml-1 inline-grid size-[17px] translate-y-[-1px] place-items-center rounded-full border border-primary/50 align-middle text-[10px] font-medium text-primary tnum">
      {n}
    </span>
  );
}

/* ── default flow: rep answer, then the commission question in conflict → resolved ── */
function DefaultThread({ money, dismissed, onDismiss, onResolve }: { money: boolean; dismissed: boolean; onDismiss: () => void; onResolve: () => void }) {
  const { s } = useDemo();
  const resolved = s.conflictResolved;
  return (
    <>
      <Q>{askThreads.rep.q}</Q>
      <A>
        {askThreads.rep.a}
        {askThreads.rep.cites.map((n) => <Cite key={n} n={n} />)}
      </A>

      {money && (
        <>
          <Q>{askThreads.commission.q}</Q>

          {!resolved && !dismissed && (
            <A className="border-warn/60">
              <div className="flex items-center gap-2 font-semibold">
                <Scale className="size-4 text-warn" aria-hidden /> Sources disagree — nothing assumed.
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">{commissionConflict.headline}</p>
              <div className="mt-2.5 divide-y divide-border rounded-md border border-border">
                {commissionConflict.sources.map((src) => (
                  <div key={src.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium">{src.label}</div>
                      <div className="text-[11.5px] text-muted-foreground">{src.detail} · {src.when}</div>
                    </div>
                    <span className="ml-auto text-[15px] font-semibold tnum">{src.value}</span>
                    <Chip tone={src.id === "portal" ? "ok" : src.id === "manual" ? "crit" : "warn"}>{src.status}</Chip>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={onResolve}>Resolve…</Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/records/maison-leandre">Open the record <ArrowRight className="size-3.5" /></Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={onDismiss}>Dismiss</Button>
              </div>
              <div className="mt-3">
                <NarrationNote>
                  A ranking rule would be wrong often enough to cost money — the advisor decides once, and the decision is stored where every surface reads it.
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
              <div className="space-y-1.5">
                {askThreads.commission.resolved.lines.map((l) => (
                  <p key={l.cite}>{l.text}<Cite n={l.cite} /></p>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border pt-2.5 text-[12px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-ok" aria-hidden />{askThreads.commission.resolved.meta.sources} sources</span>
                <span>oldest {askThreads.commission.resolved.meta.oldest}</span>
                <span>corroborated by {askThreads.commission.resolved.meta.corroborated}</span>
                <span className="ml-auto flex items-center gap-1">
                  <Chip tone="ok">answer contract met</Chip>
                  <CopyExportMenu />
                </span>
              </div>
              <p className="mt-1.5 text-[12px] text-muted-foreground">
                Cites the resolution stored today at the agency layer — both sources reachable.
              </p>
            </A>
          )}
        </>
      )}

      <SpaThread />
    </>
  );
}

/* ── spa question — the v1/v2 payoff (A-E1 / B-U1) ── */
function SpaThread() {
  const { s } = useDemo();
  const spa = notices.find((n) => n.id === "spa");
  const noticeActive = s.world === "v2" && !!spa && !s.spaNoticeClosed;
  return (
    <>
      <Q>Is the spa at Maison Léandre open?</Q>
      {noticeActive && spa ? (
        <>
          <SeverityBanner severity="Important">
            <b>Active notice: spa closed to 15 Sep.</b>{" "}
            <span className="text-muted-foreground">Opened {spa.openedAt} · {spa.scope} scope · {spa.owner}</span>
          </SeverityBanner>
          <A>
            <p>No. The record lists a spa, and an active agency notice holds it closed to 15 September.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-2">
              <Chip tone="warn">answer carries the notice</Chip>
              <Button asChild variant="ghost" size="sm" className="ml-auto text-primary">
                <Link href="/records/maison-leandre">Open the record <ArrowRight className="size-3.5" /></Link>
              </Button>
            </div>
          </A>
        </>
      ) : (
        <>
          <A>
            <p>Yes — the record lists a spa, and no notice is attached to it.</p>
          </A>
          {s.world === "v1" && (
            <NarrationNote>
              The v1 failure: the advisory expired silently on 1 Aug. The spa is still closed, and this answer is confidently wrong — no warning exists anywhere in the product.
            </NarrationNote>
          )}
        </>
      )}
    </>
  );
}

/* ── refusal ── */
function RefusalThread() {
  const r = askThreads.refusal;
  const inbound = connections.find((c) => c.name.startsWith("Inbound mail"));
  const inboundAddr = inbound ? inbound.name.replace("Inbound mail — ", "") : "the inbound address";
  const [recovery, setRecovery] = useState<"forward" | "rep" | "flag" | null>(null);
  return (
    <>
      <Q>{r.q}</Q>
      <A>
        <div className="rounded-md border border-border bg-subtle px-3 py-2.5">
          <div className="flex items-center gap-2 text-[15px] font-semibold">
            <CircleDashed className="size-4 text-muted-foreground" aria-hidden /> {r.headline}
          </div>
          <p className="mt-1 text-[13px]">{r.body}</p>
        </div>
        <ul className="mt-3 space-y-1.5">
          {r.contract.map((c) => (
            <li key={c.clause} className="flex items-start gap-2 text-[13px]">
              {c.ok
                ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
                : <XCircle className="mt-0.5 size-4 shrink-0 text-crit" aria-hidden />}
              <span><b>{c.clause}</b> {c.note}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2.5 border-t border-border pt-2.5 text-[12.5px] text-muted-foreground">{r.policy}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="border-primary text-primary" onClick={() => setRecovery("forward")}>
            Forward a document to the vault inbound address
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRecovery("rep")}>{r.ctas[0]}</Button>
          <Button variant="ghost" size="sm" onClick={() => setRecovery("flag")}>{r.ctas[2]}</Button>
        </div>
        {recovery && (
          <div className="mt-2.5">
            <ConfirmBanner show>
              {recovery === "forward" && <>Watching <span className="font-mono text-[12px]">{inboundAddr}</span> — a verified document reopens this answer.</>}
              {recovery === "rep" && <>Draft opened to Corvin &amp; Wells — nothing sends without review.</>}
              {recovery === "flag" && <>Flagged — appears in Confirm new records.</>}
            </ConfirmBanner>
          </div>
        )}
        <div className="mt-3">
          <NarrationNote>
            A refusal is a first-class outcome, not an error — what was found, which clause failed, and how to recover, all stated.
          </NarrationNote>
        </div>
      </A>
    </>
  );
}

/* ── stale ── */
function StaleThread() {
  const st = askThreads.stale;
  return (
    <>
      <Q>{st.q}</Q>
      <A>
        <p>{st.a}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-2">
          <Chip tone="warn">stale — inherits the field&apos;s warning</Chip>
          <Button asChild variant="ghost" size="sm" className="ml-auto text-primary">
            <Link href="/records/maison-leandre">Open the record <ArrowRight className="size-3.5" /></Link>
          </Button>
        </div>
      </A>
    </>
  );
}

/* ── retrieval timeout (X1) ── */
function LoadingThread() {
  return (
    <>
      <Q>{askThreads.commission.q}</Q>
      <SeverityBanner severity="Important">
        <div className="flex flex-wrap items-center gap-2">
          <span>Retrieval timed out at the third stage. The partial trace is shown — no partial answer is rendered.</span>
          <Button asChild size="sm" variant="outline" className="ml-auto">
            <Link href="/ask">Retry</Link>
          </Button>
        </div>
      </SeverityBanner>
    </>
  );
}

/* ── guided empty (U5) ── */
function EmptyThread() {
  const inbound = connections.find((c) => c.name.startsWith("Inbound mail"));
  return (
    <Section title="Nothing to answer from yet">
      <p className="text-[13px] text-muted-foreground">
        This desk has no knowledge connected. An answer only renders when it can cite a source you can open.
      </p>
      <ul className="mt-3 space-y-2.5 text-[13.5px]">
        <li className="flex items-center gap-2.5">
          <Archive className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>Connect sources — intranet, Drive, the booking system.</span>
        </li>
        <li className="flex items-center gap-2.5">
          <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>Forward mail to <span className="font-mono text-[12px]">{inbound ? inbound.name.replace("Inbound mail — ", "") : "the inbound address"}</span></span>
        </li>
        <li className="flex items-center gap-2.5">
          <LayoutGrid className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span><Link href="/records" className="text-primary hover:underline">Browse the canonical directory</Link> — it answers without any local knowledge.</span>
        </li>
      </ul>
    </Section>
  );
}

/* ── rails ── */
function TraceRail({ pendingStage }: { pendingStage?: number }) {
  return (
    <Section title="How this answer was built">
      <ol className="space-y-2.5">
        {trace.map((t, i) => {
          const pending = pendingStage !== undefined && i >= pendingStage;
          return (
            <li key={t.stage} className="flex items-start gap-2 text-[13px]">
              {pending
                ? <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />}
              <span>
                <span className={cn(pending && "text-muted-foreground")}>{t.stage}</span>
                <span className="block text-[11.5px] text-muted-foreground">{pending ? "pending" : t.detail}</span>
              </span>
            </li>
          );
        })}
      </ol>
      {pendingStage !== undefined && (
        <p className="mt-2.5 border-t border-border pt-2 text-[12px] text-muted-foreground">
          Partial trace shown — no partial answer is rendered.
        </p>
      )}
    </Section>
  );
}

function SourcesRail({ resolved }: { resolved: boolean }) {
  return (
    <Section title="Sources">
      <div className="space-y-2.5">
        {askThreads.commission.sources.map((src) => (
          <div key={src.n} className={cn("rounded-md border p-2.5", src.n === 1 ? "border-primary/50" : "border-border")}>
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <span className="inline-grid size-[17px] place-items-center rounded-full border border-border text-[10px] tnum">{src.n}</span>
              {src.label}
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">{src.detail}</div>
            {src.n === 1 && src.quote && (
              <blockquote className="mt-2 rounded-sm border-l-2 border-primary/60 bg-muted px-2.5 py-2 text-[12px]">
                {src.quote}
              </blockquote>
            )}
          </div>
        ))}
      </div>
      {resolved && (
        <p className="mt-2.5 flex items-center gap-1.5 border-t border-border pt-2 text-[12px] text-muted-foreground">
          <LayerBadge layer="agency" /> resolution stored today · both sources reachable
        </p>
      )}
      <p className="mt-2 text-[11.5px] text-muted-foreground">A permission-filtered source never appears in this panel.</p>
    </Section>
  );
}

function HeldBackRail() {
  const r = askThreads.refusal;
  return (
    <>
      <Section title="Held back">
        <p className="text-[12.5px] text-muted-foreground">
          Both sources fail the freshness rule. They are visible here and excluded from the answer.
        </p>
      </Section>
      <Section title="Sources found">
        <div className="space-y-2.5">
          {r.held.map((h, i) => (
            <div key={h.label} className="rounded-md border border-dashed border-border p-2.5">
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <span className="inline-grid size-[17px] place-items-center rounded-full border border-border text-[10px] tnum">{i + 1}</span>
                {h.label}
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">{h.detail}</div>
              <Chip tone="crit" className="mt-1.5">{h.age}</Chip>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

/* ── copy / export ── */
function CopyExportMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-muted-foreground">
          <Copy className="size-3.5" aria-hidden /> Copy
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-muted-foreground">
          Copy &amp; export <SchematicBadge />
        </div>
        <DropdownMenuItem>Copy — advisor (keeps provenance footer)</DropdownMenuItem>
        <DropdownMenuItem>Export for client (strips internal reasoning)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── resolve sheet — same anatomy as the record's ── */
function ResolveSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { d } = useDemo();
  const keep = () => { d({ type: "resolveConflict" }); onOpenChange(false); };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Scale className="size-4 text-crit" aria-hidden /> {commissionConflict.field} — 3 sources</SheetTitle>
          <SheetDescription>{commissionConflict.headline}</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4 pb-5">
          {commissionConflict.sources.map((src) => (
            <div key={src.id} className={cn("rounded-lg border p-3", src.id === "portal" ? "border-primary/50" : "border-border")}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium">{src.label}</div>
                  <div className="text-[12px] text-muted-foreground">{src.detail} · {src.when}</div>
                </div>
                <span className="ml-auto text-[20px] font-semibold tnum">{src.value}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-[12.5px] font-semibold">{src.status}</span>
                <ConfidenceMeter agree={src.agree} total={src.total} />
                <Button size="sm" variant="outline" className="ml-auto" onClick={keep} disabled={src.id !== "portal"}>
                  Keep this value
                </Button>
              </div>
            </div>
          ))}

          <div className="rounded-md border border-border bg-subtle p-3">
            <div className="text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">Where this value goes</div>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">
              The value you keep is what the directory shows, what a quote uses, and what the chat answers with. One decision, three places.
            </p>
            <dl className="mt-2 space-y-1 text-[13px]">
              {commissionConflict.impact.map((row) => (
                <div key={row.surface} className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">{row.surface}</dt>
                  <dd className="tnum font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="text-[12px] text-muted-foreground">
            The kept value is stored at the agency layer, attributed to {people.advisor} and dated today. Both other sources stay reachable.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
