"use client";
/**
 * Settings — configuration, not a workspace (§6, §10.8). It sits behind the
 * account cluster in the dock rather than taking a tile, and it stays small:
 * who you are, what reaches you, and the way out to connections for the role
 * that owns them.
 */
import { useState } from "react";
import Link from "next/link";
import { useDemo } from "@/lib/store";
import { personName, personEmail, roleLabel, connections } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, Section, SchematicBadge } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Plug } from "lucide-react";

const NOTIFICATION_PREFS: { id: string; label: string; detail: string; on: boolean }[] = [
  {
    id: "critical",
    label: "Critical notices",
    detail: "A property advisory that blocks output reaches you immediately.",
    on: true,
  },
  {
    id: "commissions",
    label: "Commission ageing",
    detail: "A commission that passes its due date raises one item, not a daily reminder.",
    on: true,
  },
  {
    id: "departures",
    label: "Departure watch",
    detail: "A trip inside thirty days with an open checklist.",
    on: true,
  },
  {
    id: "freshness",
    label: "Freshness sweep",
    detail: "Records that have not been verified in ninety days, gathered weekly.",
    on: false,
  },
  {
    id: "digest",
    label: "Daily digest by email",
    detail: "Off by default. The briefing is the digest, and it does not need a copy.",
    on: false,
  },
];

export default function SettingsPage() {
  const { s } = useDemo();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.id, p.on])),
  );

  const failing = connections.filter((c) => c.state !== "ok").length;

  return (
    <Page width="wide">
      <PageHeader title="Settings" />

      <div className="space-y-4">
        <Section title="Profile">
          <dl className="divide-y divide-border">
            <div className="row-grid">
              <dt className="row-primary t-body text-muted-foreground">Name</dt>
              <dd className="row-trailing t-body">{personName[s.role]}</dd>
            </div>
            <div className="row-grid">
              <dt className="row-primary t-body text-muted-foreground">Role</dt>
              <dd className="row-trailing t-body">{roleLabel[s.role]}</dd>
            </div>
            <div className="row-grid">
              <dt className="row-primary t-body text-muted-foreground">Email</dt>
              <dd className="row-trailing t-body">{personEmail[s.role]}</dd>
            </div>
          </dl>
          <p className="mt-3 t-meta">
            Name, role and address come from the agency directory. Changing them is an
            administrator&rsquo;s act, not a personal one.
          </p>
        </Section>

        <Section title="Notifications" chips={<SchematicBadge />}>
          <ul className="divide-y divide-border">
            {NOTIFICATION_PREFS.map((p) => (
              <li key={p.id} className="flex items-start gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <label htmlFor={`pref-${p.id}`} className="block type-data-strong">
                    {p.label}
                  </label>
                  <p className="mt-1 t-meta">{p.detail}</p>
                </div>
                <Switch
                  id={`pref-${p.id}`}
                  checked={prefs[p.id]}
                  onCheckedChange={(v) => setPrefs((m) => ({ ...m, [p.id]: v }))}
                  className="mt-1"
                />
              </li>
            ))}
          </ul>
          <p className="mt-3 t-meta">
            These switches decide what raises an item. Nothing here clears an item — an item is
            actioned or deferred in triage, deliberately.
          </p>
        </Section>

        {s.role === "lead" ? (
          <Section
            title={
              <span className="inline-flex items-center gap-2">
                <Plug className="size-3.5 text-muted-foreground" aria-hidden /> Connections
              </span>
            }
            chips={
              failing > 0 ? (
                <Chip tone="crit">
                  <span className="tnum">{failing}</span> need attention
                </Chip>
              ) : (
                <Chip tone="ok">all connected</Chip>
              )
            }
          >
            <p className="t-body text-muted-foreground">
              <span className="tnum">{connections.length}</span> sources feed this workspace. Each
              one carries its last success, and a failed source degrades answers visibly.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/admin/connections">
                Open connections <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </Section>
        ) : (
          <Section title="Connections">
            <p className="t-body text-muted-foreground">
              Source connections are an agency lead&rsquo;s setting. What they change is visible to
              you on every answer: a source that has failed is named in the answer rather than
              quietly left out.
            </p>
          </Section>
        )}
      </div>
    </Page>
  );
}
