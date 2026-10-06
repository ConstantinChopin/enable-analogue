"use client";
/**
 * Connections — the sources a person's answers are built from, and their health.
 * Open to both types (docs/rebuild/05-two-roles.md §3). An advisor sees the sources she
 * connected: her mailbox, her Drive. The owner sees her own and the agency's: the shared
 * drive, the intranet, the partner portal. Nobody sees another advisor's personal
 * sources, the owner included — the list is `connectionsFor(role)`, never `connections`.
 *
 * 2026-09-28, UX sweep NAV-01, NAV-04, COL-13, FB-05, FB-06 (VIS-095, VIS-097):
 *   title row  the name, one count, and the one create: "New connection", the same words
 *              on every surface that starts the flow (Knowledge uses them too). It was
 *              "Add connection" here and "Connect a source" in the rail, for one act.
 *   Sources    the ledger: source · last success · state, every state a neutral word.
 *              A source whose credentials expired is a Blocker on its own row: what
 *              it stops, and its act, named for its target ("Reconnect partner
 *              portal"). That is the page's one ink button, and only while it is broken.
 *   gone       the header's amber dot summarising the failure, and the rail that listed
 *              the same sources a second time with a third count.
 * Reconnecting is a request to the person who holds the credential; it closes its sheet
 * with a toast (the result is elsewhere) and the Blocker says, in place, that it was
 * asked for and by whom, until a sync succeeds.
 *
 * `?add=1` opens the new-connection flow on arrival, so "New connection" on another
 * surface starts the flow here. Connecting shares nothing, for either type.
 */
import { Fragment, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { connectionsFor, personName, type Persona } from "@/data/seed";
import { useDemo, syncedAt, useArrivalClock } from "@/lib/store";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, Section, Blocker, Done } from "@/components/bits";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import { AddConnection } from "./add-connection";

/** A row on the list: a seeded source, or one connected this session. */
type Connection = {
  name: string;
  state: "ok" | "syncing" | "credentials";
  lastSuccess: string;
  posture: string;
  scope: "agency" | "personal";
  by: Persona;
};

/** The admin who holds the agency's credentials. */
const CREDENTIAL_HOLDER = "A. Blanc";

const STATE_WORD: Record<Connection["state"], string> = {
  ok: "connected",
  syncing: "syncing",
  credentials: "credentials expired",
};

/* Whose source it is, in the owner's words. An advisor's list holds only her own, so
   the word would say nothing there and is left out. */
function whose(c: Connection, role: Persona) {
  if (role !== "owner") return null;
  return c.scope === "agency" ? "agency" : "yours";
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={null}>
      <Connections />
    </Suspense>
  );
}

function Connections() {
  const { s, d } = useDemo();
  const wantsAdd = useSearchParams()?.get("add") === "1";
  const [addOpen, setAddOpen] = useState(wantsAdd);
  const [reconnect, setReconnect] = useState<Connection | null>(null);

  /* A source connected this session leads the list, syncing until its first documents
     are in. The same rule as `connectionsFor`: a person sees the sources she connected. */
  const now = useArrivalClock(s);
  const added: Connection[] = s.createdConnections
    .filter((c) => c.by === s.role)
    .reverse()
    .map((c) => {
      const synced = now >= syncedAt(c);
      return {
        name: c.name,
        state: synced ? "ok" : "syncing",
        lastSuccess: synced ? "just now" : "first sync",
        posture: c.by === "owner" ? "read-only · closed to the administrators" : `read-only · private to ${personName[c.by]}`,
        scope: c.by === "owner" ? "agency" : "personal",
        by: c.by,
      };
    });
  const mine = [...added, ...connectionsFor(s.role)];

  const requestReauth = (c: Connection) => {
    const key = `reauth:${c.name}`;
    d({ type: "decide", id: key, what: "Re-authorisation requested" });
    setReconnect(null);
    notify(
      c.scope === "personal" ? `Sign-in requested for ${c.name}` : `Asked ${CREDENTIAL_HOLDER} to re-authorise the ${c.name.toLowerCase()}`,
      { undo: () => d({ type: "undecide", id: key }) },
    );
  };

  return (
    <Page width="wide">
      <PageHeader
        title="Connections"
        count={`${mine.length} ${mine.length === 1 ? "source" : "sources"}`}
        create={<Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>New connection</Button>}
      />

      <Section>
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
              const asked = s.decisions[`reauth:${c.name}`];
              return (
                <Fragment key={c.name}>
                  <TableRow>
                    <TableCell className="whitespace-normal pl-0">
                      <span className="block type-data-strong">{c.name}</span>
                      <span className="block type-meta">
                        {owner && <>{owner} · </>}{c.posture}
                      </span>
                    </TableCell>
                    <TableCell className="type-meta tnum">{c.lastSuccess}</TableCell>
                    <TableCell className="pr-0 text-right">
                      <Chip tone="neutral">{STATE_WORD[c.state]}</Chip>
                    </TableCell>
                  </TableRow>
                  {/* A source that cannot be reached is a Blocker on its own row: what it
                      stops, and the act that clears it. It stays until a sync succeeds. */}
                  {c.state === "credentials" && (
                    <tr>
                      <td colSpan={3} className="pb-[var(--space-3)]">
                        <Blocker
                          title={`${c.name} cannot be reached`}
                          action={asked ? undefined : (
                            <Button size="sm" onClick={() => setReconnect(c)}>Reconnect {c.name.toLowerCase()}</Button>
                          )}
                        >
                          Its credentials expired; it last synced on {c.lastSuccess}. Answers leave it out until it is reconnected.
                          {asked && (
                            <Done className="mt-[var(--space-1)] flex">
                              {asked.what} · {/\d{1,2}:\d{2}$/.exec(asked.at)?.[0] ?? "today"} · {personName[asked.by]}
                            </Done>
                          )}
                        </Blocker>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Section>

      {/* Reconnect: the fix for a broken source is a request to whoever holds its
          credential. Enable holds a token from the provider, never the password. */}
      <Sheet open={!!reconnect} onOpenChange={(o) => { if (!o) setReconnect(null); }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Reconnect {reconnect?.name.toLowerCase()}</SheetTitle>
            <SheetDescription>
              Last synced {reconnect?.lastSuccess}. Its access token expired, so it has not been reachable since.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
            <div className="divide-y divide-hairline">
              <div className="pb-[var(--space-4)]">
                <div className="type-data-strong">Until it is reconnected</div>
                <p className="mt-1 type-data text-label-secondary">
                  Answers leave it out and say so. Records confirmed before {reconnect?.lastSuccess} still
                  answer, with their own dates.
                </p>
              </div>
              <div className="pt-[var(--space-4)]">
                <div className="type-data-strong">What reconnecting needs</div>
                <p className="mt-1 type-data text-label-secondary">
                  {reconnect?.scope === "personal"
                    ? "You sign in again at the provider."
                    : `${CREDENTIAL_HOLDER} signs in again at the ${reconnect?.name.toLowerCase()}. You can ask her from here.`}
                </p>
              </div>
            </div>
          </div>
          <SheetFooter className="sm:flex-row sm:justify-end">
            <SheetClose asChild><Button variant="secondary">Cancel</Button></SheetClose>
            {reconnect && (
              <Button onClick={() => requestReauth(reconnect)}>
                {reconnect.scope === "personal" ? "Sign in again" : `Ask ${CREDENTIAL_HOLDER} to re-authorise`}
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AddConnection open={addOpen} onOpenChange={setAddOpen} />
    </Page>
  );
}
