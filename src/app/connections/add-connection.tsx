"use client";
/**
 * Adding a connection — the same four steps for both types (docs/rebuild/05-two-roles.md).
 * An advisor connects her own mailbox or Drive; the owner also connects the agency's
 * sources. Either way what the source indexes arrives closed to whoever connected it:
 * an advisor's mailbox to her, an agency drive to the administrators.
 *
 * The step a generic OAuth wizard treats as an afterthought is the one that matters:
 * WHAT gets indexed. A drive connected whole pulls in the managing partner's folder, or
 * an advisor's personal files, along with the rate notes — so the person connecting
 * picks folders, and "Everything in My Drive" is marked as the bad idea it is.
 *
 * What this flow deliberately does NOT decide is who can read any of it. Connecting a
 * source indexes it; sharing is a separate, per-document, logged act in the knowledge
 * vault. See the note above STEPS.
 *
 * There is no password field anywhere in this flow, and that is not an omission. The
 * whole point of an authorisation redirect is that the third-party application never
 * sees the credential. A connector that asked for the password in its own form would
 * be teaching the person connecting to do the one thing every security team tells them
 * not to — and it would be an inaccurate drawing of OAuth besides. The provider's screen
 * belongs to the provider; this flow shows the handoff and the grant that comes back.
 *
 * Recomposed against the rebuilt system: the sheet is its own surface, and its one
 * primary is the stepper's "Continue" / "Connect Google Drive" / "Done" in the footer,
 * at the right after Back or Cancel. The provider handoff ("Continue to Google Drive")
 * is a secondary under the grant it extends; "Use another account" is a text action.
 * Options are hairline boxes that take the ink stroke when chosen.
 *
 * 2026-09-28, UX sweep NAV-04, FB-05, FB-06: the flow is "New connection" wherever it
 * starts, so its sheet says so; the commit names what it connects; states (authorised,
 * recommended, connected) are neutral words and a finished connection is a <Done>, not
 * a green chip.
 */
import { useState } from "react";
import { connectors, personEmail, type Connector } from "@/data/seed";
import { useDemo } from "@/lib/store";
import { Chip, DataList, Done } from "@/components/bits";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ExternalLink } from "lucide-react";

/* There is no "who can read it" step, and its absence is the policy — for both types.
   Connecting a source INDEXES it; it does not share anything. Everything it indexes
   arrives closed to whoever connected it — an advisor's own source to her, an agency
   source to the administrators — and reaches anyone else a document at a time in the
   vault, by a named person, on the record. An audience picker here would be a bulk
   share performed at the moment someone is thinking about folders and OAuth scopes,
   which is exactly when nobody is thinking about who should read what. It would also
   contradict the one sharing rule every other surface keeps: everything starts
   private, and opening it is an act somebody performs. */
const STEPS = ["Source", "Authorise", "What to index", "Review"] as const;

/* An option you can press: hairline at rest, ink stroke on hover and when chosen. */
const OPTION =
  "flex cursor-pointer items-start gap-[var(--space-3)] rounded-lg border border-hairline p-[var(--space-3)] transition-colors duration-200 ease-standard hover:border-stroke-hover has-[[data-state=checked]]:border-selected";

export function AddConnection({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { s, d } = useDemo();
  const owner = s.role === "owner";
  /* Who the index arrives closed to: whoever connected it. */
  const closedTo = owner ? "the administrators" : "you";
  /* An advisor connects her own mailbox or Drive; the intranet is the agency's to connect. */
  const offered = owner ? connectors : connectors.filter((c) => c.id !== "intranet");

  const [step, setStep] = useState(0);
  const [pick, setPick] = useState<Connector | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const reset = () => {
    setStep(0); setPick(null); setAccount(null); setScopes([]); setDone(false);
  };
  const close = () => { onOpenChange(false); window.setTimeout(reset, 250); };

  const toggleScope = (id: string) =>
    setScopes((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const canAdvance =
    step === 0 ? !!pick
    : step === 1 ? !!account
    : step === 2 ? scopes.length > 0
    : true;

  const chosen = pick?.scopeOptions.filter((o) => scopes.includes(o.id)) ?? [];

  /* Connecting is the commit: the source joins the list as syncing, and its first
     documents start arriving in the vault, closed to whoever connected it. */
  const connect = () => {
    if (pick && account) {
      d({ type: "connect", connection: { connectorId: pick.id, name: `${pick.name} — ${account}`, scopes, by: s.role, at: Date.now() } });
    }
    setDone(true);
  };

  const summary = pick && account
    ? [
        { label: "Source", value: pick.name },
        { label: "Account", value: account },
        { label: "Indexing", value: chosen.map((c) => c.label).join(", ") },
        { label: "Arrives as", value: `Closed to ${closedTo}` },
        { label: "Posture", value: pick.posture },
      ]
    : [];

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <SheetContent side="right" className="w-[min(92vw,560px)]">
        <SheetHeader className="shrink-0">
          <SheetTitle>{done ? `${pick?.name ?? "Source"} connected` : "New connection"}</SheetTitle>
          <SheetDescription>
            {done
              ? `The first sync is running. Documents become answerable to ${closedTo} as they are indexed.`
              : `Step ${step + 1} of ${STEPS.length} · ${STEPS[step]}`}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
          {done && pick ? (
            <div className="space-y-[var(--space-4)]">
              <Done>Connected · first sync running</Done>
              <DataList rows={summary} />
              <p className="type-meta">{pick.cannot}</p>
            </div>
          ) : step === 0 ? (
            <RadioGroup
              value={pick?.id ?? ""}
              onValueChange={(v) => setPick(offered.find((c) => c.id === v) ?? null)}
              className="gap-[var(--space-3)]"
            >
              {offered.map((c) => (
                <label key={c.id} htmlFor={`src-${c.id}`} className={OPTION}>
                  <RadioGroupItem value={c.id} id={`src-${c.id}`} className="mt-1" />
                  <span className="flex flex-1 flex-col items-start gap-1">
                    <span className="flex flex-wrap items-center gap-[var(--space-2)]">
                      <span className="type-data-strong">{c.name}</span>
                      <Chip tone="neutral">{c.posture}</Chip>
                    </span>
                    <span className="type-meta">{c.subtitle}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          ) : step === 1 && pick ? (
            <div className="space-y-[var(--space-4)]">
              <p className="type-data">
                You will be taken to {pick.name} to sign in. Enable never sees the password. It
                receives a token, scoped to what you approve there, which you can revoke from{" "}
                {pick.name} at any time.
              </p>
              <div className="rounded-lg bg-sunken p-[var(--space-4)]">
                <div className="type-meta text-label-tertiary">What Enable will be granted</div>
                <ul className="mt-[var(--space-2)] space-y-1">
                  {pick.grants.map((g) => (
                    <li key={g} className="flex items-start gap-[var(--space-2)] type-data">
                      <Check className="mt-0.5 size-[var(--icon-md)] shrink-0 text-label-secondary" aria-hidden /> {g}
                    </li>
                  ))}
                </ul>
              </div>
              {account ? (
                <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                  <Done>Authorised as {account}</Done>
                  <Button variant="tertiary" size="sm" onClick={() => setAccount(null)}>
                    Use another account
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setAccount(owner && pick.id === "mailbox" ? "parisdesk@enable.example" : personEmail[s.role])
                  }
                >
                  <ExternalLink aria-hidden /> Continue to {pick.name}
                </Button>
              )}
            </div>
          ) : step === 2 && pick ? (
            <div className="space-y-[var(--space-3)]">
              <p className="type-meta">
                {pick.scopeLabel}. Connecting the whole account indexes everything it can see,
                including what nobody meant to share.
              </p>
              {pick.scopeOptions.map((o) => (
                <label key={o.id} htmlFor={`scope-${o.id}`} className={OPTION}>
                  <Checkbox
                    id={`scope-${o.id}`}
                    checked={scopes.includes(o.id)}
                    onCheckedChange={() => toggleScope(o.id)}
                    className="mt-0.5"
                  />
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-[var(--space-2)]">
                      <span className="type-data-strong">{o.label}</span>
                      {o.recommended && <Chip tone="neutral">recommended</Chip>}
                    </span>
                    <span className="type-meta">{o.detail}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : pick ? (
            <div className="space-y-[var(--space-4)]">
              <DataList rows={summary} />
              <div className="border-t border-hairline pt-[var(--space-4)]">
                <div className="type-meta text-label-tertiary">This connection cannot</div>
                <p className="mt-1 type-data">{pick.cannot}</p>
              </div>
              {/* Stated at the moment of connecting, because this is the moment the
                  person connecting assumes the opposite. */}
              <div className="rounded-lg bg-sunken p-[var(--space-4)]">
                <div className="type-meta text-label-tertiary">Connecting does not share anything</div>
                <p className="mt-1 type-data">
                  {owner
                    ? "Documents arrive closed to the administrators and answer nobody else. Each one is opened to others in Knowledge, one at a time, by a named person."
                    : "Documents arrive closed to you and answer nobody else. You open each one to others in Knowledge: a colleague, your team or the whole agency."}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <SheetFooter className="shrink-0 sm:flex-row sm:justify-end">
          {done ? (
            <Button onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => (step === 0 ? close() : setStep((v) => v - 1))}>
                {step === 0 ? "Cancel" : "Back"}
              </Button>
              <Button
                disabled={!canAdvance}
                onClick={() => (step === STEPS.length - 1 ? connect() : setStep((v) => v + 1))}
              >
                {step === STEPS.length - 1 ? `Connect ${pick?.name ?? "source"}` : "Continue"}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
