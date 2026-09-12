"use client";
/**
 * Settings — configuration, not a workspace (§6, §10.8). It sits behind the
 * account cluster in the dock rather than taking a tile, and it stays small:
 * who you are, what reaches you, and the way out to connections for the role
 * that owns them.
 *
 * Recomposed as a document of quiet chapters (Pass 1.5): Profile · Notifications ·
 * Connections (lead only). Each control sits in a row of the list it belongs to.
 *
 * No ink pill on this surface. The contract's primary is "change a setting", and
 * the switch IS the change — it applies as it is flipped, so a filled "Save" would
 * promise a step that does not exist. "Open connections" is a secondary: it leaves
 * the page. The taxonomy budget is empty, so nothing here carries state colour;
 * the connection health chip is words on a hairline.
 *
 * Local components (not promoted to bits): SettingRow.
 */
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useDemo } from "@/lib/store";
import { personName, personEmail, roleLabel, connectionHealth } from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, DataList, Section, SchematicBadge, Rows } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowRight } from "lucide-react";

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
    detail: "A trip inside 30 days with an open checklist.",
    on: true,
  },
  {
    id: "freshness",
    label: "Freshness sweep",
    detail: "Records that have not been verified in 90 days, gathered weekly.",
    on: false,
  },
  {
    id: "digest",
    label: "Daily digest by email",
    detail: "Off by default. The briefing is the digest, and it does not need a copy.",
    on: false,
  },
];

/* ── a setting's row: name and consequence on the left, the control on the right ──
   The same row module as DataList, with a control where the value would be.     */
function SettingRow({
  id, label, detail, control,
}: { id: string; label: string; detail: string; control: ReactNode }) {
  return (
    <li className="flex items-start justify-between gap-[var(--space-4)] py-[11px]">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block type-data-strong">{label}</label>
        <p className="mt-1 type-meta">{detail}</p>
      </div>
      <div className="shrink-0 pt-px">{control}</div>
    </li>
  );
}

export default function SettingsPage() {
  const { s } = useDemo();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.id, p.on])),
  );

  /* Same helper the connections page and the lead briefing read. */
  const { sources, needAttention } = connectionHealth;

  return (
    <Page width="text">
      <PageHeader title="Settings" />

      <Section title="Profile" quiet>
        <DataList
          rows={[
            { label: "Name", value: personName[s.role] },
            { label: "Role", value: roleLabel[s.role] },
            { label: "Email", value: personEmail[s.role] },
          ]}
        />
        <p className="mt-[var(--space-3)] type-meta">
          Name, role and address come from the agency directory. Changing them is an
          administrator&rsquo;s act, not a personal one.
        </p>
      </Section>

      <Section title="Notifications" quiet deep chips={<SchematicBadge />}>
        <Rows>
          {NOTIFICATION_PREFS.map((p) => (
            <SettingRow
              key={p.id}
              id={`pref-${p.id}`}
              label={p.label}
              detail={p.detail}
              control={
                <Switch
                  id={`pref-${p.id}`}
                  checked={prefs[p.id]}
                  onCheckedChange={(v) => setPrefs((m) => ({ ...m, [p.id]: v }))}
                />
              }
            />
          ))}
        </Rows>
        <p className="mt-[var(--space-3)] type-meta">
          These switches decide what raises an item. Nothing here clears an item — an item is
          actioned or deferred in triage, deliberately.
        </p>
      </Section>

      {/* Both types connect sources, so both reach them from here. */}
      {(

        <Section
          title="Connections"
          quiet
          deep
          chips={
            <Chip tone="neutral">
              {needAttention > 0 ? connectionHealth.label : "all connected"}
            </Chip>
          }
        >
          <p className="type-data-read text-label-secondary">
            <span className="tnum">{sources}</span> sources feed this workspace. Each one carries
            its last success, and a failed source degrades answers visibly.
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-[var(--space-4)]">
            <Link href="/connections">
              Open connections <ArrowRight aria-hidden />
            </Link>
          </Button>
        </Section>
      )}
    </Page>
  );
}
