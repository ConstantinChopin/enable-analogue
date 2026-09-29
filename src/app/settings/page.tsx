"use client";
/**
 * Settings — configuration, not a workspace (§6, §10.8). It sits behind the
 * account cluster in the dock rather than taking a tile, and it stays small:
 * who you are, what reaches you, who can see money, and the way out to connections.
 *
 * Recomposed as a document of quiet chapters (Pass 1.5), per type
 * (docs/rebuild/05-two-roles.md §3):
 *   user  — Profile · Notifications · Connections (her own sources)
 *   owner — Profile · Notifications · Who can see money (O10) · Connections (the agency's)
 * Each control sits in a row of the list it belongs to.
 *
 * No ink pill on this surface. The contract's primary is "change a setting", and
 * the switch IS the change — it applies as it is flipped, so a filled "Save" would
 * promise a step that does not exist. That holds for the money switch too: the
 * owner's one entitlement act takes effect the moment it moves. "Open connections"
 * is a secondary: it leaves the page. The taxonomy budget is empty, so nothing here
 * carries state colour; the connection health chip is words on a hairline.
 *
 * 2026-09-28 (UX sweep FB-06, FB-08; VIS-097). The copy says what is true and what a
 * person can do, without the product's case for itself. The money switch is a choice
 * the owner makes about someone else, so it is recorded in the store with who and when
 * (`decide`) and confirmed in place, under the row, with the time. The notification
 * switches stay drawn, not wired: nothing reads them yet, and the badge says so.
 *
 * Local components (not promoted to bits): SettingRow.
 */
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useDemo, canViewCommissions } from "@/lib/store";
import {
  personName, personEmail, roleLabel, connectionHealth, connectionsFor, people,
} from "@/data/seed";
import { Page, PageHeader } from "@/components/layouts";
import { Chip, DataList, Done, Section, SchematicBadge, Rows } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowRight } from "lucide-react";

const NOTIFICATION_PREFS: { id: string; label: string; detail: string; on: boolean; money?: boolean }[] = [
  {
    id: "critical",
    label: "Critical notices",
    detail: "A notice that closes a property to bookings reaches you at once.",
    on: true,
  },
  {
    id: "commissions",
    label: "Commission ageing",
    detail: "A commission that passes its due date raises one item.",
    on: true,
    money: true,
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
    detail: "The Briefing, by email, each morning.",
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
  const { s, d } = useDemo();
  const owner = s.role === "owner";
  const money = canViewCommissions(s);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.id, p.on])),
  );

  /* Whose sources. The owner's chapter speaks for the agency and reads the same health
     rule the connections page and her brief read. The user's speaks only for the
     sources she connected herself: the agency's count is not hers to act on. */
  const ownSources = connectionsFor("user").filter((c) => c.by === "user");
  const ownAttention = ownSources.filter((c) => c.state !== "ok").length;
  const one = ownSources.length === 1;

  /* The last time the owner moved the money switch, as the store recorded it. */
  const moneyChanged = s.decisions["commission-access:user"];

  const healthWord = owner
    ? connectionHealth.needAttention > 0 ? connectionHealth.label : "all connected"
    : ownAttention > 0 ? `${ownAttention} need attention` : "all connected";

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
          Name, role and address come from the agency directory. An administrator changes them.
        </p>
      </Section>

      <Section title="Notifications" quiet deep chips={<SchematicBadge />}>
        <Rows>
          {/* A user without the money entitlement is not offered commission ageing:
              the items it would raise do not exist for her. */}
          {NOTIFICATION_PREFS.filter((p) => money || !p.money).map((p) => (
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
          These decide what raises an item in Notifications. They do not clear the items already there.
        </p>
      </Section>

      {/* O10. The one entitlement the product has, written by the owner, one row per
          agency user. The owner always sees money, so she has no row of her own. */}
      {owner && (
        <Section title="Who can see money" quiet deep>
          <Rows>
            <SettingRow
              id="money-user"
              label={people.advisor}
              detail={`${roleLabel.user} · ${s.commissionAccess ? "sees commission figures" : "commission figures absent"}`}
              control={
                <Switch
                  id="money-user"
                  checked={s.commissionAccess}
                  onCheckedChange={(on) => {
                    d({ type: "commissionAccess", on });
                    d({ type: "decide", id: "commission-access:user", what: on ? "on" : "off" });
                  }}
                />
              }
            />
          </Rows>
          {moneyChanged && (
            <Done className="mt-[var(--space-2)]">
              {s.commissionAccess ? "Turned on" : "Turned off"} by {personName[moneyChanged.by]}, {moneyChanged.at}
            </Done>
          )}
          <p className="mt-[var(--space-3)] type-meta">
            When off, commission figures are absent for her across the product, not masked.
          </p>
        </Section>
      )}

      {/* Both types connect sources, so both reach them from here. */}
      <Section title="Connections" quiet deep chips={<Chip tone="neutral">{healthWord}</Chip>}>
        {owner ? (
          <p className="type-data text-label-secondary">
            <span className="tnum">{connectionHealth.sources}</span> agency sources feed the
            assistant&rsquo;s answers. What they index arrives closed to the administrators;
            connecting a source shares nothing.
          </p>
        ) : (
          <p className="type-data text-label-secondary">
            <span className="tnum">{ownSources.length}</span> {one ? "source" : "sources"} of your
            own {one ? "feeds" : "feed"} your answers. What {one ? "it indexes" : "they index"} is
            private to you; connecting a source shares nothing.
          </p>
        )}
        <Button asChild variant="secondary" size="sm" className="mt-[var(--space-4)]">
          <Link href="/connections">
            Open connections <ArrowRight aria-hidden />
          </Link>
        </Button>
      </Section>
    </Page>
  );
}
