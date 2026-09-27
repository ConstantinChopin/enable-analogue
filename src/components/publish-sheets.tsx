"use client";
/**
 * Publishing to the team: the two composers (docs/rebuild/05-two-roles.md, 2026-09-24).
 *
 *   NoticeSheet        one fact on one record — "spa closed to 15 September". Opened
 *                      from the record. It stays until a named person retires it.
 *   AnnouncementSheet  a dated message to people — "new in Kyoto" — that links records.
 *                      Opened from the Briefing's "From the agency" chapter.
 *
 * Both ask who it is for before what it says (the edit sheet's rule), and both follow the
 * one sharing rule: personal and team go out at once; the whole agency goes out at once
 * when the owner writes it and waits in her publish queue when a user does. What the
 * owner publishes is an agency source, so each sheet says, before it is sent, that
 * answers may cite it.
 */
import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDemo, type ShareScope } from "@/lib/store";
import { people, personName, products } from "@/data/seed";
import { ConfirmBanner } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

function SheetBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-[var(--space-6)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]", className)}>{children}</div>;
}

const newId = () => Date.now().toString(36);

/* ── who it is for ──────────────────────────────────────────────────────────── */
type Audience = { v: ShareScope; label: string; hint: string };

function audiences(owner: boolean, withPrivate: boolean): Audience[] {
  return [
    ...(withPrivate ? [{ v: "private" as const, label: "Just me", hint: "Only you. It answers nobody else." }] : []),
    { v: "team", label: "My team", hint: "Paris desk · 6 advisors · at once" },
    {
      v: "agency", label: "The whole agency",
      hint: owner ? "Every advisor · at once" : `Every advisor · waits for ${people.owner} to release it`,
    },
  ];
}

function AudiencePicker({ id, value, onChange, options }: {
  id: string; value: ShareScope; onChange: (v: ShareScope) => void; options: Audience[];
}) {
  return (
    <div>
      <div className="type-data-strong">Who is this for?</div>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as ShareScope)} className="mt-[var(--space-3)]">
        {options.map((o) => (
          <div key={o.v} className="flex items-start gap-[var(--space-3)]">
            <RadioGroupItem value={o.v} id={`${id}-${o.v}`} className="mt-px" />
            <Label htmlFor={`${id}-${o.v}`} className="flex flex-col items-start gap-0.5">
              <span className="type-data">{o.label}</span>
              <span className="type-meta">{o.hint}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

/** What happens on send, said before it happens. */
function OnSend({ waits, scope, cited }: { waits: boolean; scope: ShareScope; cited: boolean }) {
  const { s } = useDemo();
  return (
    <div className="border-t border-hairline pt-[var(--space-4)]">
      <div className="type-micro-caps text-label-tertiary">On send</div>
      <p className="mt-1 type-data-read text-label-secondary">
        {waits
          ? <>Waits for {people.owner} to release it to the whole agency, with you kept as its author. Until then your team and you see it.</>
          : <>Live at once · {scope === "private" ? `only ${personName[s.role]}` : scope === "team" ? "the Paris desk" : "every advisor"} · as {personName[s.role]}, today.</>}
        {cited && !waits && scope !== "private" && <> Answers may cite it, with its date.</>}
      </p>
    </div>
  );
}

/* ═══════════════ A notice, on one record ═══════════════ */
const SEVERITIES = ["Info", "Important", "Critical"] as const;

export function NoticeSheet({
  productId, productName, open, onOpenChange,
}: { productId: string; productName: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { s, d } = useDemo();
  const owner = s.role === "owner";
  const [scope, setScope] = useState<ShareScope>(owner ? "agency" : "private");
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>("Important");
  const [text, setText] = useState("");
  const [sent, setSent] = useState<ShareScope | null>(null);
  const waits = scope === "agency" && !owner;

  const reset = (v: boolean) => {
    onOpenChange(v);
    if (!v) { setText(""); setSent(null); }
  };
  const send = () => {
    if (!text.trim()) return;
    d({ type: "createNotice", notice: { id: newId(), productId, productName, text: text.trim(), severity, scope, by: s.role } });
    setSent(scope);
  };

  return (
    <Sheet open={open} onOpenChange={reset}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add a notice</SheetTitle>
          <SheetDescription>
            One fact about {productName}, with a severity and an owner. It stays until a named person retires it.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {sent ? (
            <>
              <ConfirmBanner show>
                {sent === "agency" && !owner
                  ? `Sent to ${people.owner}. It reaches the whole agency when she releases it.`
                  : sent === "agency"
                    ? "Published to the whole agency. It leads the record, and answers about the property cite it."
                    : sent === "team"
                      ? "Shared with the Paris desk. It leads the record for them now."
                      : "Saved for you alone."}
              </ConfirmBanner>
              <Button variant="secondary" onClick={() => reset(false)}>Close</Button>
            </>
          ) : (
            <>
              <AudiencePicker id="notice-scope" value={scope} onChange={setScope} options={audiences(owner, true)} />
              <div>
                <Label htmlFor="notice-text">What changed at the property?</Label>
                <Textarea
                  id="notice-text" rows={3} value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. Spa closed to 15 September for renovation."
                  className="mt-[var(--space-2)]"
                />
              </div>
              <div>
                <div className="type-data-strong">Severity</div>
                <RadioGroup value={severity} onValueChange={(v) => setSeverity(v as typeof severity)} className="mt-[var(--space-3)] flex gap-[var(--space-4)]">
                  {SEVERITIES.map((v) => (
                    <div key={v} className="flex items-center gap-[var(--space-2)]">
                      <RadioGroupItem value={v} id={`notice-sev-${v}`} />
                      <Label htmlFor={`notice-sev-${v}`} className="type-data">{v}</Label>
                    </div>
                  ))}
                </RadioGroup>
                <p className="mt-[var(--space-2)] type-meta">
                  {severity === "Critical"
                    ? "Critical blocks shortlisting until the advisor acknowledges it, by name and date."
                    : severity === "Important"
                      ? "Important leads the record and the answer."
                      : "Info sits on the record."}
                </p>
              </div>
              <OnSend waits={waits} scope={scope} cited />
              <Button disabled={!text.trim()} onClick={send}>
                {waits ? "Submit for release" : scope === "agency" ? "Publish" : scope === "team" ? "Share with the team" : "Save notice"}
              </Button>
            </>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/* ═══════════════ An announcement, to people ═══════════════ */
export function AnnouncementSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { s, d } = useDemo();
  const owner = s.role === "owner";
  const [scope, setScope] = useState<ShareScope>(owner ? "agency" : "team");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [sent, setSent] = useState<ShareScope | null>(null);
  const waits = scope === "agency" && !owner;

  /* Records to link: the directory, searched by name or place. Unconfirmed ones can be
     linked, and the record itself says it is not confirmed yet. */
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => !links.includes(p.id) && `${p.name} ${p.city} ${p.country}`.toLowerCase().includes(q))
      .slice(0, 5);
  }, [query, links]);

  const reset = (v: boolean) => {
    onOpenChange(v);
    if (!v) { setTitle(""); setBody(""); setLinks([]); setQuery(""); setSent(null); }
  };
  const ready = title.trim() && body.trim();
  const send = () => {
    if (!ready) return;
    d({
      type: "createAnnouncement",
      announcement: { id: newId(), title: title.trim(), body: body.trim(), links, audience: scope === "agency" ? "agency" : "team", by: s.role },
    });
    setSent(scope);
  };

  return (
    <Sheet open={open} onOpenChange={reset}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Write to the agency</SheetTitle>
          <SheetDescription>
            A dated message to your team or the whole agency. Link the records it is about; the facts stay on them.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {sent ? (
            <>
              <ConfirmBanner show>
                {sent === "agency" && !owner
                  ? `Sent to ${people.owner}. It reaches the whole agency when she releases it.`
                  : sent === "agency"
                    ? "Published to the whole agency. It leads their Briefing, and answers may cite it."
                    : "Shared with the Paris desk. It leads their Briefing now."}
              </ConfirmBanner>
              <div className="flex flex-wrap gap-[var(--space-2)]">
                <Button asChild variant="secondary"><Link href="/knowledge?source=Announcements" onClick={() => reset(false)}>See it in the archive</Link></Button>
                <Button variant="tertiary" onClick={() => reset(false)}>Close</Button>
              </div>
            </>
          ) : (
            <>
              <AudiencePicker id="ann-scope" value={scope} onChange={setScope} options={audiences(owner, false)} />
              <div>
                <Label htmlFor="ann-title">Title</Label>
                <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New in Kyoto for autumn" className="mt-[var(--space-2)]" />
              </div>
              <div>
                <Label htmlFor="ann-body">Message</Label>
                <Textarea id="ann-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What should the desk know, and why now?" className="mt-[var(--space-2)]" />
              </div>
              <div>
                <Label htmlFor="ann-link">Link records</Label>
                <p className="mt-1 type-meta">Each linked record shows this announcement, and opens from it.</p>
                <Input id="ann-link" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the directory by name or place" className="mt-[var(--space-2)]" />
                {matches.length > 0 && (
                  <ul className="mt-[var(--space-2)] divide-y divide-hairline">
                    {matches.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-[var(--space-2)] py-[var(--space-2)]">
                        <span className="min-w-0 truncate type-data">{p.name} <span className="text-label-secondary">· {p.city}</span></span>
                        <Button variant="tertiary" size="sm" onClick={() => { setLinks((l) => [...l, p.id]); setQuery(""); }}>Link</Button>
                      </li>
                    ))}
                  </ul>
                )}
                {links.length > 0 && (
                  <ul className="mt-[var(--space-3)] divide-y divide-hairline border-t border-hairline">
                    {links.map((id) => {
                      const p = products.find((x) => x.id === id);
                      return (
                        <li key={id} className="flex items-center justify-between gap-[var(--space-2)] py-[var(--space-2)]">
                          <span className="min-w-0 truncate type-data-strong">{p?.name}</span>
                          <Button variant="tertiary" size="sm" onClick={() => setLinks((l) => l.filter((x) => x !== id))}>Remove</Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <OnSend waits={waits} scope={scope} cited />
              <Button disabled={!ready} onClick={send}>
                {waits ? "Submit for release" : scope === "agency" ? "Publish" : "Share with the team"}
              </Button>
            </>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
