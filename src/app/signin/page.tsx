"use client";
/**
 * Sign in — the only surface outside the product.
 *
 * It does what a sign-in does (establishes who you are, which explains the view you
 * land in) and, per review 01 §7, it is also where the demo is set up: the accounts
 * choose the role, and a quiet disclosure chooses the build vintage. Nothing about
 * the demo is visible once you are through the door.
 */
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";
import type { Persona } from "@/data/seed";
import { personEmail, personInitials, personName, personas, roleLabel } from "@/data/seed";
import { Section } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, KeyRound } from "lucide-react";

/* The demo accounts are the personas, read from the seed. The address advertised
   here is the address the product shows in Settings and stamps on a record: a
   sign-in that offers a domain the workspace has never heard of is the first
   thing in the demo that is not true. */
const accounts: { role: Persona; name: string; title: string; email: string; initials: string }[] =
  personas.map((role) => ({
    role,
    name: personName[role],
    title: roleLabel[role],
    email: personEmail[role],
    initials: personInitials[role],
  }));

export default function SignInPage() {
  const { s, d } = useDemo();
  const router = useRouter();
  const [selected, setSelected] = useState<Persona>("advisor");
  const [email, setEmail] = useState(accounts[0].email);
  const [password, setPassword] = useState("••••••••••••");

  const choose = (role: Persona) => {
    const a = accounts.find((x) => x.role === role)!;
    setSelected(role);
    setEmail(a.email);
    setPassword("••••••••••••");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    d({ type: "signIn", role: selected });
    router.replace("/briefing");
  };

  return (
    /* The first screen a panel sees now carries the same structural signature as every
       screen after it: the 12px inset, the hairline panel, and a window that does not
       scroll. It had none of them — it was the one surface where the design language
       was absent, on the one surface seen first. */
    <div className="h-dvh overflow-hidden bg-subtle p-[var(--frame-inset)]">
      <div
        className="flex h-full items-center justify-center overflow-y-auto bg-background px-4 py-10"
        style={{ border: "1px solid var(--frame-stroke)", borderRadius: "var(--radius-panel)" }}
      >
      <div className="w-full max-w-[404px]">
        {/* product mark */}
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-primary type-data-strong text-primary-foreground">
            E
          </span>
          <span className="type-data-strong tracking-tight">Enable</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(28,29,34,0.06)] sm:p-7">
          <h1 className="type-title-page">Sign in to Enable</h1>
          <p className="mt-1 type-data text-muted-foreground">
            Your desk, your travellers and your agency&rsquo;s terms.
          </p>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="type-micro">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="password" className="type-micro">Password</Label>
                <span className="type-meta">Forgotten?</span>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full">Sign in</Button>

            <div className="flex items-center gap-3 pt-1">
              <span className="h-px flex-1 bg-border" aria-hidden />
              <span className="type-micro text-muted-foreground">or</span>
              <span className="h-px flex-1 bg-border" aria-hidden />
            </div>

            <Button type="button" variant="outline" className="w-full text-muted-foreground">
              <KeyRound className="size-4" aria-hidden />
              Use single sign-on
            </Button>
          </form>
        </div>

        {/* Demo accounts */}
        <section className="mt-6" aria-label="Demo accounts">
          <div className="mb-2 px-1 type-code uppercase tracking-widest text-muted-foreground">
            Demo accounts
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {accounts.map((a, i) => {
              const on = a.role === selected;
              return (
                <button
                  key={a.role}
                  type="button"
                  onClick={() => choose(a.role)}
                  aria-pressed={on}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-left transition-colors",
                    i > 0 && "border-t border-border",
                    on ? "bg-primary-soft/70" : "hover:bg-muted/60",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full type-micro",
                      on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {a.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate type-data-strong">{a.name}</span>
                    <span className="block truncate type-meta">{a.title}</span>
                  </span>
                  <span
                    className={cn(
                      "size-3.5 shrink-0 rounded-full border",
                      on ? "border-[4px] border-primary" : "border-border",
                    )}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </section>

      {/* Demo setup — the one place a demo control is visible. It used to float
          bottom-right, right-aligned against a centred card and attached to nothing.
          It now sits in the column it belongs to. */}
      <details className="group mt-8 type-meta">
        <summary className="flex cursor-pointer list-none items-center gap-1">
          Demo setup
          <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <Section className="mt-2 p-3">
          <div className="mb-2 type-micro text-muted-foreground">Build vintage</div>
          <div className="flex overflow-hidden rounded-md border border-border">
            {([["v2", "Current build"], ["v1", "March build"]] as const).map(([w, label]) => (
              <button
                key={w}
                type="button"
                onClick={() => d({ type: "world", world: w })}
                className={cn(
                  "flex-1 cursor-pointer px-2 py-1 type-code whitespace-nowrap",
                  s.world === w ? "bg-muted font-semibold text-foreground" : "hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>
      </details>
      </div>
      </div>
    </div>
  );
}
