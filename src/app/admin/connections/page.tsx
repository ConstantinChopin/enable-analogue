"use client";
/**
 * Connections — integration health as a first-class surface, recomposed as a document
 * with a ledger. Every connector shows its last success, and a failed source degrades
 * answers visibly instead of silently.
 *
 * Chapters, in order: Sources (the ledger — source · last success · state; the row
 * being reconnected is selected). "Add connection" is the text action in the title row
 * and opens the flow in ./add-connection.tsx.
 *
 * The one primary — "Reconnect {source}" — sits at the bottom of the tool that follows
 * (Needs attention), pointed at the first source whose credentials have expired.
 * Contract: reconnect a failing source. The failing row keeps a secondary "Reconnect…"
 * so the fix is reachable where the fault is read. Connection state is carried by
 * Chip only: connected · syncing · credentials expired.
 */
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { connectionHealth, connections } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, Section, NarrationNote, Rows, Row, StatusDot, ConfirmBanner } from "@/components/bits";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { AddConnection } from "./add-connection";

type Connection = (typeof connections)[number];

function StateChip({ state }: { state: Connection["state"] }) {
  if (state === "ok") return <Chip tone="ok">connected</Chip>;
  /* `syncing` is counted in "need attention", so it is marked as one — a neutral chip
     beside a header that counts it read as a disagreement on the same screen. */
  if (state === "syncing") return <Chip tone="warn">syncing</Chip>;
  return <Chip tone="crit">credentials expired</Chip>;
}

/* `?add=1` opens the new-connection flow on arrival, so a button labelled "New
   connection" on another surface can start the flow rather than land on a list of the
   ones that already exist. The flow keeps one owner: this page. The same pattern the
   record uses for `?compose=notice`. */
export default function ConnectionsPage() {
  return (
    <Suspense fallback={null}>
      <Connections />
    </Suspense>
  );
}

function Connections() {
  const wantsAdd = useSearchParams()?.get("add") === "1";
  const [addOpen, setAddOpen] = useState(wantsAdd);

  const [reconnect, setReconnect] = useState<string | null>(null);
  const [reconnectSent, setReconnectSent] = useState(false);

  /* The count comes from the seed's one rule (anything not `ok`), so this header,
     /settings and the lead briefing cannot disagree about the same number. */
  const { sources, needAttention, label } = connectionHealth;
  const attention = connections.filter((c) => c.state !== "ok");
  const failing = connections.find((c) => c.state === "credentials");

  const closeReconnect = () => { setReconnect(null); setReconnectSent(false); };

  return (
    <Page width="wide">
      <PageHeader
        title="Connections"
        actions={<Button variant="link" size="sm" onClick={() => setAddOpen(true)}>Add connection</Button>}
      >
        <p className="mt-[var(--space-2)] type-meta">
          <StatusDot tone={needAttention > 0 ? "warn" : "ok"}>
            <span className="tnum">{sources}</span>&nbsp;sources · {needAttention > 0 ? label : "all healthy"}
          </StatusDot>
        </p>
      </PageHeader>

      <div className="doc-layout">
        {/* ── the body: the ledger ── */}
        <div className="min-w-0">
          <NarrationNote>
            Integration health is a surface, not a log line. A failed source degrades answers
            visibly, which is the difference between a system you can trust and one you have to
            second-guess.
          </NarrationNote>

          <Section title="Sources">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-0">Source</TableHead>
                  <TableHead>Last success</TableHead>
                  <TableHead className="pr-0 text-right">State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((c) => (
                  <TableRow key={c.name} data-state={reconnect === c.name ? "selected" : undefined}>
                    <TableCell className="whitespace-normal pl-0">
                      <span className="block type-data-strong">{c.name}</span>
                      <span className="block type-meta">{c.posture}</span>
                    </TableCell>
                    <TableCell className="type-meta tnum">{c.lastSuccess}</TableCell>
                    <TableCell className="pr-0 text-right">
                      <span className="inline-flex items-center gap-[var(--space-2)]">
                        <StateChip state={c.state} />
                        {/* A health surface where the broken thing has no fix is a report,
                            not a console. Reconnecting is credential work that happens at
                            the source, so the control opens that — it does not pretend to
                            repair anything. */}
                        {c.state === "credentials" && (
                          <Button variant="secondary" size="sm" onClick={() => setReconnect(c.name)}>
                            Reconnect…
                          </Button>
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Section>
        </div>

        {/* ── the tool that follows: what needs attention, and the one action ── */}
        <aside className="doc-rail" data-rail-label="Needs attention">
          <Section variant="tool" follows title="Needs attention">
            {attention.length > 0 ? (
              <Rows>
                {attention.map((c) => (
                  <Row key={c.name}>
                    <span className="row-primary">
                      <span className="block truncate type-data-strong">{c.name}</span>
                      <span className="block truncate type-meta tnum">last success {c.lastSuccess}</span>
                    </span>
                    <span className="row-trailing"><StateChip state={c.state} /></span>
                  </Row>
                ))}
              </Rows>
            ) : (
              <p className="type-data-read text-label-secondary">Every source synced within the hour.</p>
            )}
            {failing && (
              <div className="mt-[var(--space-4)]">
                <Button className="w-full" onClick={() => setReconnect(failing.name)}>
                  Reconnect {failing.name.toLowerCase()}
                </Button>
                <p className="mt-[var(--space-2)] text-center type-meta">
                  Answers exclude it, and say so, until a sync succeeds.
                </p>
              </div>
            )}
          </Section>
        </aside>
      </div>

      {/* Reconnect — the fix for the one broken row */}
      <Sheet open={!!reconnect} onOpenChange={(o) => { if (!o) closeReconnect(); }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Reconnect {reconnect}</SheetTitle>
            <SheetDescription>
              Last successful sync 24 Aug. Credentials expired; the source has not been reachable
              since.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
            <div className="divide-y divide-hairline">
              <div className="pb-[var(--space-4)]">
                <div className="type-data-strong">While this source is down</div>
                <p className="mt-1 type-data-read text-label-secondary">
                  Answers exclude it and carry a gap note naming the date. Records confirmed before
                  24 Aug still answer, with their own provenance and their own date.
                </p>
              </div>
              <div className="py-[var(--space-4)]">
                <div className="type-data-strong">What reconnecting needs</div>
                <p className="mt-1 type-data-read text-label-secondary">
                  A named person re-authorises at the partner portal. Enable never stores the
                  credential — it holds a scoped token, which is what expired.
                </p>
              </div>
            </div>
            <ConfirmBanner show={reconnectSent}>
              Re-authorisation requested from A. Blanc · logged today. The row stays flagged until
              a sync succeeds.
            </ConfirmBanner>
          </div>
          <SheetFooter className="sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={closeReconnect}>Close</Button>
            <Button disabled={reconnectSent} onClick={() => setReconnectSent(true)}>
              Request re-authorisation
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AddConnection open={addOpen} onOpenChange={setAddOpen} />
    </Page>
  );
}
