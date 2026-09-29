"use client";
/**
 * Sign in — the only surface outside the product, recomposed against the
 * constitution (docs/rebuild/03) by the brief (docs/rebuild/04).
 *
 * One tool on the base ground: a hairline box on raised paper, 24 inside, holding
 * the page's name once, one sentence, the two fields and the ONE primary — the
 * "Sign in" pill — at its bottom. "Use single sign-on" is the grey secondary under
 * it; "Forgotten?" is a text action beside the field it concerns. No dock and no
 * frame bar: the shell steps aside for this route, so the page draws its own ground.
 *
 * Below the tool, the presenter's device (review 01 §7): the demo accounts as a
 * list of selectable rows — `aria-pressed`, and the selected row INVERTS (ink on
 * paper, VIS-021) — and the "Demo setup" disclosure for the build vintage, which
 * is a Segmented so its selected state inverts the same way. Choosing a row fills
 * the form; the pill signs that person in. Nothing about the demo is visible once
 * you are through the door.
 *
 * Local components: `AccountRow` (a person as a selectable row). Nothing was
 * added to bits.tsx.
 */
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";
import type { Persona } from "@/data/seed";
import { personEmail, personInitials, personName, personas, roleLabel } from "@/data/seed";
import { Section, Rows, Segmented } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, KeyRound } from "lucide-react";

/* The demo accounts are the personas, read from the seed. The address advertised
   here is the address the product shows in Settings and stamps on a record: a
   sign-in that offers a domain the workspace has never heard of is the first
   thing in the demo that is not true. */
type Account = { role: Persona; name: string; title: string; email: string; initials: string };
const accounts: Account[] = personas.map((role) => ({
  role,
  name: personName[role],
  title: roleLabel[role],
  email: personEmail[role],
  initials: personInitials[role],
}));

const VINTAGES = [
  { value: "v2" as const, label: "Current build" },
  { value: "v1" as const, label: "March build" },
];

/* ── AccountRow — a person you can choose (local to this page) ───────────────
   A row at the row module: avatar, name over title. `aria-pressed` carries the
   state; selected is inverse, ink with paper text, so the choice is visible
   without colour. Hover is the interactive fill; press scales.                 */
function AccountRow({ account: a, selected, onSelect }: { account: Account; selected: boolean; onSelect: () => void }) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={cn(
          "pressable flex min-h-[var(--row-h)] w-full cursor-pointer items-center gap-[var(--space-3)] px-[var(--space-3)] py-[var(--space-2)] text-left",
          selected ? "bg-selected text-on-selected" : "text-label hover:bg-interactive",
        )}
      >
        <Avatar>
          <AvatarFallback>{a.initials}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate type-data-strong">{a.name}</span>
          <span className={cn("block truncate type-meta", selected && "text-on-selected/70")}>{a.title}</span>
        </span>
      </button>
    </li>
  );
}

export default function SignInPage() {
  const { s, d } = useDemo();
  const router = useRouter();
  const [selected, setSelected] = useState<Persona>("user");
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
    <div className="flex min-h-dvh items-center justify-center bg-base px-[var(--space-4)] py-[var(--gap-5)]">
      <div className="w-full max-w-[400px]">
        {/* product mark */}
        <div className="mb-[var(--gap-2)] flex items-center gap-[var(--space-3)]">
          <span className="grid size-9 place-items-center rounded-lg bg-ink type-data-strong text-on-ink" aria-hidden>
            E
          </span>
          <span className="type-data-strong">Enable</span>
        </div>

        {/* The tool: the form, and the one primary at its bottom. */}
        <Section variant="tool">
          <h1 className="type-title-page">Sign in to Enable</h1>
          <p className="mt-[var(--space-2)] type-meta">
            Your desk, your travellers and your agency&rsquo;s terms.
          </p>

          <form onSubmit={submit} className="mt-[var(--space-6)] space-y-[var(--space-4)]">
            <div className="space-y-[var(--space-2)]">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-[var(--space-2)]">
              <div className="flex items-center justify-between gap-[var(--space-2)]">
                <Label htmlFor="password">Password</Label>
                <Button type="button" variant="link" size="sm" className="px-0">Forgotten?</Button>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-[var(--space-2)] pt-[var(--space-2)]">
              <Button type="submit" className="w-full">Sign in</Button>
              <Button type="button" variant="secondary" className="w-full">
                <KeyRound aria-hidden />
                Use single sign-on
              </Button>
            </div>
          </form>
        </Section>

        {/* The presenter's device: who to be. A quiet chapter under the tool. */}
        <Section quiet title="Demo accounts" className="mt-[var(--gap-1)]">
          {/* The rows carry their own 12px gutter so the inverted fill runs past the
              column while the names stay on the column's edge. */}
          <Rows className="-mx-[var(--space-3)]">
            {accounts.map((a) => (
              <AccountRow key={a.role} account={a} selected={a.role === selected} onSelect={() => choose(a.role)} />
            ))}
          </Rows>
        </Section>

        {/* Demo setup — the one place a demo control is visible. It sits in the
            column it belongs to, under the accounts it qualifies. */}
        <details className="group type-meta">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-sm">
            Demo setup
            <ChevronDown className="size-[var(--icon-sm)] transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="mt-[var(--space-3)]">
            <div className="mb-[var(--space-2)] type-meta text-label-tertiary">Build vintage</div>
            <Segmented
              value={s.world}
              onChange={(w) => d({ type: "world", world: w })}
              options={VINTAGES}
              label="Build vintage"
            />
          </div>
        </details>
      </div>
    </div>
  );
}
