"use client";
/**
 * Confirm records — the extraction review queue. Nothing extracted becomes truth until a
 * named person confirms it. Named as the dock and the crumb name it (UX sweep NAV-06).
 *
 * Triage, as every queue (UX sweep COL-05, FB-06, COL-13, VIS-096, 2026-09-28). Until
 * then the rail's "Open for review" was the page's ink button, the queue never moved
 * after a confirmation, and "3 in review" never dropped. Now:
 *   list       the candidates still waiting; selecting one opens it in the inspector.
 *              Enter or a double-click opens its page, where each field is checked.
 *   inspector  the candidate: where it came from, the fields that will go live, and the
 *              ones that stay held, each with its reason. "Open ↗" to its page.
 *   footer     its one act, named for what it does: "Confirm all 14 fields" on a new
 *              record (every readable field, and the record; held fields stay held),
 *              "Keep both records" on a possible duplicate (merging goes field by field,
 *              with a reason, on its page). After it the selection moves on, the count
 *              drops, and a toast offers Undo for ten seconds.
 *   Decided    what was decided this session, then what the queue closed before.
 * Extraction state is a word in a neutral chip; ochre only where a decision waits (a
 * possible duplicate), per VIS-097.
 */
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/store";
import { candidates, confirmedRecently } from "@/data/seed";
import { PageHeader, SplitPage, useQueryState } from "@/components/layouts";
import { Chip, Section, Rows, Row, RowStack, DataList, Done } from "@/components/bits";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import {
  outcomeOf, outcomeLine, nextCandidate, decideCandidate, undoCandidate,
  readyFields, heldFields, isTemplate, fieldList, type Candidate,
} from "./review";

function KindChip({ c }: { c: Candidate }) {
  if (c.kind === "duplicate") return <Chip tone="warn">possible duplicate</Chip>;
  if (c.kind === "held") return <Chip tone="neutral">nothing read</Chip>;
  return <Chip tone="neutral">new record</Chip>;
}

export default function ReviewQueue() {
  return (
    <Suspense fallback={null}>
      <Queue />
    </Suspense>
  );
}

function Queue() {
  const { s, d } = useDemo();
  const router = useRouter();
  const [sel, setSel] = useQueryState("sel");

  const waiting = candidates.filter((c) => !outcomeOf(s, c.id));
  const decided = candidates.filter((c) => outcomeOf(s, c.id));
  const inReview = waiting.length + (s.requestFiled ? 1 : 0);
  const active = candidates.find((c) => c.id === sel) ?? null;

  const act = (c: Candidate, what: string, message: string, detail: string) => {
    decideCandidate(d, c.id, what);
    setSel(nextCandidate(s, c.id)?.id ?? null);
    notify(message, { detail, undo: () => undoCandidate(d, c.id), seconds: 10 });
  };

  const footer = (c: Candidate) => {
    if (outcomeOf(s, c.id)) return undefined;
    if (c.kind === "new") {
      const ready = readyFields(c).length;
      const held = heldFields(c).map((f) => f.label);
      return (
        <div className="space-y-[var(--space-3)]">
          <p className="type-meta">
            {ready} fields go live for the agency. {fieldList(held)} stay held and out of answers.
          </p>
          <Button
            className="w-full"
            onClick={() => act(c, "Confirmed", `${c.name} confirmed`, `${ready} fields live, ${held.length} held`)}
          >
            Confirm all {ready} fields
          </Button>
        </div>
      );
    }
    if (c.kind === "duplicate") {
      return (
        <div className="space-y-[var(--space-3)]">
          <p className="type-meta">To merge it into {c.match?.target}, open it: merging goes field by field, with a reason.</p>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => act(c, "Kept as a separate record", "Kept as a separate record", `${c.name} and ${c.match?.target} both stand`)}
            >
              Keep both records
            </Button>
          </div>
        </div>
      );
    }
    return undefined;
  };

  const header = <PageHeader title="Confirm records" count={`${inReview} waiting`} />;

  return (
    <SplitPage
      header={header}
      panelOpen={Boolean(active)}
      onClosePanel={() => setSel(null)}
      panelTitle={active?.name ?? "Candidate"}
      openHref={active ? `/admin/review/${active.id}` : undefined}
      panel={active ? <CandidatePanel c={active} /> : null}
      footer={active ? footer(active) : undefined}
    >
      <Section title="Waiting">
        {inReview === 0 ? (
          <p className="type-data text-label-secondary">Nothing is waiting on you.</p>
        ) : (
          <Rows>
            {waiting.map((c) => {
              const on = sel === c.id;
              return (
                <li
                  key={c.id}
                  data-state={on ? "selected" : undefined}
                  className="row-select -mx-[var(--space-3)] px-[var(--space-3)]"
                >
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSel(c.id)}
                    onDoubleClick={() => router.push(`/admin/review/${c.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && on) { e.preventDefault(); router.push(`/admin/review/${c.id}`); }
                    }}
                    className="row-stack block w-full cursor-pointer text-left"
                  >
                    <span className="row-stack-head">
                      <span className="min-w-0 truncate type-data-strong">{c.name}</span>
                      <KindChip c={c} />
                    </span>
                    <span className="row-stack-body block truncate type-meta">
                      {c.from} · <span className="tnum">{c.uri}</span>
                    </span>
                  </button>
                </li>
              );
            })}
            {s.requestFiled && (
              <Row className="-mx-[var(--space-3)] px-[var(--space-3)]">
                <span className="row-primary">
                  <span className="block truncate type-data-strong">Requested from the directory</span>
                  <span className="block truncate type-meta">asked for by an advisor · waiting to be extracted</span>
                </span>
                <span className="row-meta" />
                <span className="row-trailing"><Chip tone="neutral">requested</Chip></span>
              </Row>
            )}
          </Rows>
        )}
      </Section>

      {/* What the queue has closed: this session's decisions first, then earlier ones. */}
      <Section title="Decided" deep>
        <Rows>
          {decided.map((c) => {
            const o = outcomeOf(s, c.id)!;
            return (
              <RowStack
                key={c.id}
                head={
                  <>
                    <span className="row-primary flex min-w-0 flex-wrap items-baseline gap-x-[var(--space-3)]">
                      <span className="type-data-strong">{c.name}</span>
                      <span className="truncate type-meta tnum text-label-secondary">{c.uri}</span>
                    </span>
                    <span className="type-meta tnum">{o.by} · Today{/\d{1,2}:\d{2}$/.exec(o.at) ? ` ${/\d{1,2}:\d{2}$/.exec(o.at)![0]}` : ""}</span>
                  </>
                }
              >
                {o.what}
              </RowStack>
            );
          })}
          {confirmedRecently.map((c) => (
            <RowStack
              key={c.id}
              head={
                <>
                  <span className="row-primary flex min-w-0 flex-wrap items-baseline gap-x-[var(--space-3)]">
                    <span className="type-data-strong">{c.name}</span>
                    <span className="truncate type-meta tnum text-label-secondary">{c.uri}</span>
                  </span>
                  <span className="type-meta tnum">{c.by} · {c.when}</span>
                </>
              }
            >
              {c.note}
            </RowStack>
          ))}
        </Rows>
      </Section>
    </SplitPage>
  );
}

/* ── the inspector: what confirming would put live, and what stays held ───────── */
function CandidatePanel({ c }: { c: Candidate }) {
  const { s } = useDemo();
  const o = outcomeOf(s, c.id);
  const raw = "raw" in c ? c.raw : undefined;

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <KindChip c={c} />
        <span className="type-meta">{c.from}</span>
      </div>

      {o && <Done>{outcomeLine(o)}</Done>}

      {c.kind === "duplicate" && c.match && (
        <p className="type-data">
          Looks like <span className="type-data-strong">{c.match.target}</span>, already a record:
          the name is {Math.round(c.match.similarity * 100)}% alike and the city is the same.
        </p>
      )}

      {c.kind === "held" && raw && (
        <div>
          <p className="type-data">{raw.note}</p>
          <pre className="mt-[var(--space-2)] overflow-x-auto rounded-lg bg-sunken p-[var(--space-3)] type-meta tnum text-inherit">{raw.text}</pre>
          <p className="mt-[var(--space-2)] type-meta">Open it to key the name by hand, or to reject it.</p>
        </div>
      )}

      {readyFields(c).length > 0 && (
        <div>
          <div className="type-meta text-label-tertiary">
            {c.kind === "duplicate" ? "Incoming fields" : `Read from the source · ${readyFields(c).length}`}
          </div>
          <DataList rows={readyFields(c).map((f) => ({ label: f.label, value: f.value }))} />
        </div>
      )}

      {heldFields(c).length > 0 && (
        <div>
          <div className="type-meta text-label-tertiary">Stay held · {heldFields(c).length}</div>
          <ul className="mt-[var(--space-2)] space-y-[var(--space-3)]">
            {heldFields(c).map((f) => (
              <li key={f.label}>
                <div className="type-data-strong">{f.label}</div>
                <div className="type-data text-label-secondary">
                  {isTemplate(f)
                    ? "Portal boilerplate, not a description of this hotel."
                    : "heldReason" in f && f.heldReason ? String(f.heldReason) : f.value}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
