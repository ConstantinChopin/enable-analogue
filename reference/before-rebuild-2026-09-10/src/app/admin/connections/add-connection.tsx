"use client";
/**
 * Adding a connection — the path an administrator actually walks.
 *
 * The step a generic OAuth wizard treats as an afterthought is the one that matters:
 * WHAT gets indexed. A drive connected whole pulls in the managing partner's folder
 * along with the rate notes, so an administrator picks folders and "Everything in My
 * Drive" is marked as the bad idea it is.
 *
 * What this flow deliberately does NOT decide is who can read any of it. Connecting a
 * source indexes it; sharing is a separate, per-document, logged act in the knowledge
 * vault. See the note above STEPS.
 *
 * There is no password field anywhere in this flow, and that is not an omission. The
 * whole point of an authorisation redirect is that the third-party application never
 * sees the credential. A connector that asked for the password in its own form would
 * be teaching an administrator to do the one thing every security team tells them not
 * to — and it would be an inaccurate drawing of OAuth besides. The provider's screen
 * belongs to the provider; this flow shows the handoff and the grant that comes back.
 */
import { useState } from "react";
import { connectors, type Connector } from "@/data/seed";
import { Chip, DataList } from "@/components/bits";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Check, ExternalLink } from "lucide-react";

/* There is no "who can read it" step, and its absence is the policy.
   Connecting a source INDEXES it; it does not share anything. Everything arrives
   closed — administrators only — and is opened one document at a time in the vault,
   by a named person, on the record. An audience picker here would have been a bulk
   share performed at the moment an administrator is thinking about folders and OAuth
   scopes, which is exactly when nobody is thinking about who should read what. It
   also contradicted the governance page a click away, which states that every kind of
   record arrives closed and that opening one is an act somebody performs. */
const STEPS = ["Source", "Authorise", "What to index", "Review"] as const;

export function AddConnection({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
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

  const summary = pick && account
    ? [
        { label: "Source", value: pick.name },
        { label: "Account", value: account },
        { label: "Indexing", value: chosen.map((c) => c.label).join(", ") },
        { label: "Arrives as", value: "Closed — administrators only" },
        { label: "Posture", value: pick.posture },
      ]
    : [];

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[560px]">
        <SheetHeader className="shrink-0 border-b border-border">
          <SheetTitle>{done ? "Source connected" : "Add a connection"}</SheetTitle>
          <SheetDescription>
            {done
              ? "The first sync is running. Documents become answerable as they are indexed."
              : `Step ${step + 1} of ${STEPS.length} · ${STEPS[step]}`}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {done && pick ? (
            <div className="space-y-[var(--space-4)]">
              <Chip tone="ok">connected · first sync running</Chip>
              <DataList rows={summary} />
              <p className="type-meta">{pick.cannot}</p>
            </div>
          ) : step === 0 ? (
            <RadioGroup
              value={pick?.id ?? ""}
              onValueChange={(v) => setPick(connectors.find((c) => c.id === v) ?? null)}
              className="gap-3"
            >
              {connectors.map((c) => (
                <div key={c.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <RadioGroupItem value={c.id} id={`src-${c.id}`} className="mt-1" />
                  <Label htmlFor={`src-${c.id}`} className="flex flex-1 flex-col items-start gap-1 font-normal">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="type-data-strong">{c.name}</span>
                      <Chip tone={c.posture === "MCP upstream" ? "primary" : "neutral"}>{c.posture}</Chip>
                    </span>
                    <span className="type-meta">{c.subtitle}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : step === 1 && pick ? (
            <div className="space-y-[var(--space-4)]">
              <p className="type-data">
                You will be taken to {pick.name} to sign in. Enable never sees the password — it
                receives a token, scoped to what you approve there, which you can revoke from{" "}
                {pick.name} at any time.
              </p>
              <div className="rounded-[var(--radius-card)] border border-border bg-subtle p-[var(--space-3)]">
                <div className="type-micro text-muted-foreground">What Enable will be granted</div>
                <ul className="mt-2 space-y-1">
                  {pick.grants.map((g) => (
                    <li key={g} className="flex items-start gap-2 type-data">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-ok" aria-hidden /> {g}
                    </li>
                  ))}
                </ul>
              </div>
              {account ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone="ok">authorised</Chip>
                  <span className="type-data">{account}</span>
                  <Button variant="ghost" size="sm" onClick={() => setAccount(null)}>
                    Use another account
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() =>
                    setAccount(pick.id === "mailbox" ? "parisdesk@enable.example" : "m.keller@enable.example")
                  }
                >
                  <ExternalLink className="size-3.5" aria-hidden /> Continue to {pick.name}
                </Button>
              )}
            </div>
          ) : step === 2 && pick ? (
            <div className="space-y-[var(--space-3)]">
              <p className="type-meta">
                {pick.scopeLabel}. A source connected whole pulls in everything the account can
                see, including what nobody meant to publish.
              </p>
              {pick.scopeOptions.map((o) => (
                <label
                  key={o.id}
                  htmlFor={`scope-${o.id}`}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3"
                >
                  <Checkbox
                    id={`scope-${o.id}`}
                    checked={scopes.includes(o.id)}
                    onCheckedChange={() => toggleScope(o.id)}
                    className="mt-0.5"
                  />
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="type-data-strong">{o.label}</span>
                      {o.recommended && <Chip tone="ok">recommended</Chip>}
                    </span>
                    <span className="type-meta">{o.detail}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : pick ? (
            <div className="space-y-[var(--space-4)]">
              <DataList rows={summary} />
              <div className="rounded-[var(--radius-card)] border border-border p-[var(--space-3)]">
                <div className="type-micro text-muted-foreground">This connection cannot</div>
                <p className="mt-1 type-data">{pick.cannot}</p>
              </div>
              {/* Stated at the moment of connecting, because this is the moment an
                  administrator assumes the opposite. */}
              <div className="rounded-[var(--radius-card)] border border-border bg-subtle p-[var(--space-3)]">
                <div className="type-micro text-muted-foreground">Connecting does not share anything</div>
                <p className="mt-1 type-data">
                  Documents arrive closed and answer nobody. Each one is opened in the knowledge
                  vault, to a named audience, by a person — and the log records who.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <SheetFooter className="shrink-0 border-t border-border">
          {done ? (
            <Button onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => (step === 0 ? close() : setStep((v) => v - 1))}>
                {step === 0 ? "Cancel" : "Back"}
              </Button>
              <Button
                disabled={!canAdvance}
                onClick={() => (step === STEPS.length - 1 ? setDone(true) : setStep((v) => v + 1))}
              >
                {step === STEPS.length - 1 ? "Connect source" : "Continue"}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
