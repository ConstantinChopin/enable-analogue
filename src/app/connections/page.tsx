"use client";
/**
 * Connections — the sources a person's answers are built from, and their health.
 * Open to both types (docs/rebuild/05-two-roles.md §3). An advisor sees the sources she
 * connected: her mailbox, her Drive. The owner sees her own and the agency's: the shared
 * drive, the intranet, the partner portal. Nobody sees another advisor's personal
 * sources, the owner included — the list is `connectionsFor(role)`, never `connections`.
 *
 * Chapters, in order: Sources (the ledger — source · last success · state; the row
 * being reconnected is selected). For the owner each row says whose source it is,
 * "agency" or "yours", in words. "Add connection" is the text action in the title row
 * and opens the flow in ./add-connection.tsx.
 *
 * The one primary sits at the bottom of the tool that follows (Needs attention):
 * "Reconnect {source}" on the first of this person's sources whose credentials have
 * expired; with none failing, "Connect a source", which opens the add flow. Today that
 * is "Reconnect partner portal" for M. Keller and "Connect a source" for R. Devane. The
 * failing row keeps a secondary "Reconnect…" so the fix is reachable where the fault is
 * read. Connection state is carried by Chip only: connected · syncing · credentials
 * expired.
 *
 * Connecting shares nothing, for either type: what a source indexes arrives closed to
 * whoever connected it.
 */
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { connectionsFor, type Persona } from "@/data/seed";
import { useDemo } from "@/lib/store";
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

type Connection = ReturnType<typeof connectionsFor>[number];

function StateChip({ state }: { state: Connection["state"] }) {
  if (state === "ok") return <Chip tone="ok">connected</Chip>;
  /* `syncing` is counted in "need attention", so it is marked as one — a neutral chip
     beside a header that counts it read as a disagreement on the same screen. */
  if (state === "syncing") return <Chip tone="warn">syncing</Chip>;
  return <Chip tone="crit">credentials expired</Chip>;
}

/* Whose source it is, in the owner's words. An advisor's list holds only her own, so
   the word would say nothing there and is left out. */
function whose(c: Connection, role: Persona) {
  if (role !== "owner") return null;
  return c.scope === "agency" ? "agency" : "yours";
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
  const { s } = useDemo();
  const wantsAdd = useSearchParams()?.get("add") === "1";
  const [addOpen, setAddOpen] = useState(wantsAdd);

  const [reconnect, setReconnect] = useState<string | null>(null);
  const [reconnectSent, setReconnectSent] = useState(false);

  /* What this person sees, counted by the seed's one rule (anything not `ok`). For the
     owner the list is the agency's sources plus her own, so the figure agrees with the
     agency count on /settings and her briefing; for an advisor it counts only hers. */
  const mine = connectionsFor(s.role);
  const attention = mine.filter((c) => c.state !== "ok");
  const failing = mine.find((c) => c.state === "credentials");
  const reconnecting = mine.find((c) => c.name === reconnect);

  const closeReconnect = () => { setReconnect(null); setReconnectSent(false); };

  return (
    <Page width="wide">
      <PageHeader
        title="Connections"
        actions={<Button variant="link" size="sm" onClick={() => setAddOpen(true)}>Add connection</Button>}
      >
        <p className="mt-[var(--space-2)] type-meta">
          <StatusDot tone={attention.length > 0 ? "warn" : "ok"}>
            {/* One child. StatusDot lays its children out with a gap, so several text
                nodes would each take a gap of their own and read as double spaces. */}
            <span>
              <span className="tnum">{mine.length}</span> {mine.length === 1 ? "source" : "sources"} ·{" "}
              {attention.length > 0
                ? <><span className="tnum">{attention.length}</span> need attention</>
                : "all healthy"}
            </span>
          </StatusDot>
        </p>
      </PageHeader>

      <div className="doc-layout">
        {/* ── the body: the ledger ── */}
        <div className="min-w-0">
          <NarrationNote>
            Integration health is a surface, not a log line. A failed source degrades answers
            visibly, which is the difference between a system you can trust and one you have to
            second-guess. Connecting a source shares nothing: what it indexes arrives closed to
            whoever connected it.
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
                {mine.map((c) => {
                  const owner = whose(c, s.role);
                  return (
                    <TableRow key={c.name} data-state={reconnect === c.name ? "selected" : undefined}>
                      <TableCell className="whitespace-normal pl-0">
                        <span className="block type-data-strong">{c.name}</span>
                        <span className="block type-meta">
                          {owner && <>{owner} · </>}{c.posture}
                        </span>
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
                  );
                })}
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
              <p className="type-data-read text-label-secondary">
                Nothing of yours needs attention. Every source synced today.
              </p>
            )}
            <div className="mt-[var(--space-4)]">
              {failing ? (
                <>
                  <Button className="w-full" onClick={() => setReconnect(failing.name)}>
                    Reconnect {failing.name.toLowerCase()}
                  </Button>
                  <p className="mt-[var(--space-2)] text-center type-meta">
                    Answers exclude it, and say so, until a sync succeeds.
                  </p>
                </>
              ) : (
                <>
                  <Button className="w-full" onClick={() => setAddOpen(true)}>
                    Connect a source
                  </Button>
                  <p className="mt-[var(--space-2)] text-center type-meta">
                    {s.role === "owner"
                      ? "What it indexes arrives closed to the administrators."
                      : "What it indexes arrives closed to you."}
                  </p>
                </>
              )}
            </div>
          </Section>
        </aside>
      </div>

      {/* Reconnect — the fix for a broken row */}
      <Sheet open={!!reconnect} onOpenChange={(o) => { if (!o) closeReconnect(); }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Reconnect {reconnect}</SheetTitle>
            <SheetDescription>
              Last successful sync {reconnecting?.lastSuccess}. Credentials expired; the source has
              not been reachable since.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
            <div className="divide-y divide-hairline">
              <div className="pb-[var(--space-4)]">
                <div className="type-data-strong">While this source is down</div>
                <p className="mt-1 type-data-read text-label-secondary">
                  Answers exclude it and carry a gap note naming the date. Records confirmed before
                  {" "}{reconnecting?.lastSuccess} still answer, with their own provenance and their
                  own date.
                </p>
              </div>
              <div className="py-[var(--space-4)]">
                <div className="type-data-strong">What reconnecting needs</div>
                <p className="mt-1 type-data-read text-label-secondary">
                  {reconnecting?.scope === "personal"
                    ? "You re-authorise at the provider."
                    : `A named person re-authorises at the ${reconnect?.toLowerCase()}.`}{" "}
                  Enable never stores the credential — it holds a scoped token, which is what
                  expired.
                </p>
              </div>
            </div>
            <ConfirmBanner show={reconnectSent}>
              {reconnecting?.scope === "personal"
                ? "Re-authorisation requested · logged today."
                : "Re-authorisation requested from A. Blanc · logged today."}{" "}
              The row stays flagged until a sync succeeds.
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
