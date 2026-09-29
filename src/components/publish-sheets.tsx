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
 * when the owner writes it and waits in her publish queue when a user does.
 *
 * 2026-09-28, UX sweep COL-10, FB-06, FB-09 (VIS-097, VIS-099, VIS-101):
 *   - the audience is the sharing sheet's picker, in its words ("Who can see this?",
 *     Only me · The Paris desk · The whole agency), not a second set of labels.
 *   - before the commit, one line says what will happen and to whom. A Critical notice
 *     says what it closes and how many live trips it touches ("Closes Hôtel Verlaine
 *     for every advisor; 1 live trip includes it"), counted from the trips' shortlists
 *     and lines, so one click to the whole agency is never a surprise.
 *   - one footer order: Cancel, then the act at the right, named for what it does
 *     ("Publish notice", "Send to M. Keller for release").
 *   - on commit the sheet closes and a toast confirms, with Undo (the result is on the
 *     record or the Briefing, not here). No green block left in the sheet.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useDemo, allTrips, onTrip, type DemoState, type ShareScope } from "@/lib/store";
import { deskTrips, people, products } from "@/data/seed";
import { notify } from "@/lib/notify";
import { AudiencePicker, audienceOptions } from "@/components/share-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";

function SheetBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("min-h-0 flex-1 space-y-[var(--space-6)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]", className)}>{children}</div>;
}

const newId = () => Date.now().toString(36);

/** Live trips a property is on, as far as this audience reaches: this desk's trips
    (shortlisted or on a line, store `onTrip`), and for the whole agency the other
    advisors' trips too, counted without names. */
function tripsWith(s: DemoState, productId: string, scope: ShareScope): number {
  if (scope === "private" && s.role === "owner") return 0;
  const desk = allTrips(s).filter((t) => t.status !== "Traveled" && t.status !== "Cancelled" && onTrip(s, t.id, productId)).length;
  const others = scope === "agency" ? deskTrips.filter((t) => t.products.includes(productId)).length : 0;
  return desk + others;
}

/** Who a notice or announcement reaches, in the sentence's words. */
const reachOf = (scope: ShareScope) => (scope === "private" ? "you only" : scope === "team" ? "the Paris desk" : "every advisor");

/** What happens on commit, said before it happens. */
function Consequence({ children }: { children: ReactNode }) {
  return (
    <div className="border-t border-hairline pt-[var(--space-4)]">
      <div className="type-meta text-label-tertiary">What happens</div>
      <p className="mt-1 type-data">{children}</p>
    </div>
  );
}

/* ═══════════════ A notice, on one record ═══════════════ */
const SEVERITIES = ["Info", "Important", "Critical"] as const;
type Severity = (typeof SEVERITIES)[number];

/* What each severity does (VIS-099, one notice gate). */
const SEVERITY_DOES: Record<Severity, string> = {
  Critical: "Closes the property: it cannot be added to a trip or asked for, and where it is already on a trip the one act is to take it off.",
  Important: "Shows as a warning beside the property wherever it is chosen.",
  Info: "Sits on the record as context.",
};

export function NoticeSheet({
  productId, productName, open, onOpenChange,
}: { productId: string; productName: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { s, d } = useDemo();
  const owner = s.role === "owner";
  const latest = useRef(s);
  useEffect(() => { latest.current = s; });
  const [scope, setScope] = useState<ShareScope>(owner ? "agency" : "private");
  const [severity, setSeverity] = useState<Severity>("Important");
  const [text, setText] = useState("");
  const waits = scope === "agency" && !owner;

  const close = () => { onOpenChange(false); setText(""); };

  const n = tripsWith(s, productId, scope);
  const touches = n === 0 ? "no live trip includes it" : `${n} live ${n === 1 ? "trip includes" : "trips include"} it`;
  const effect = severity === "Critical"
    ? `Closes ${productName} for ${reachOf(scope)}; ${touches}.`
    : severity === "Important"
      ? `A warning on ${productName} for ${reachOf(scope)}, wherever it is chosen; ${touches}.`
      : `A note on ${productName}'s record for ${reachOf(scope)}.`;
  const cited = scope === "agency" ? " Answers about it may cite it, with its date." : "";

  const label = waits
    ? `Send to ${people.owner} for release`
    : scope === "agency" ? "Publish notice" : scope === "team" ? "Share with the Paris desk" : "Save for me only";

  const send = () => {
    if (!text.trim()) return;
    const id = newId();
    d({ type: "createNotice", notice: { id, productId, productName, text: text.trim(), severity, scope, by: s.role } });
    close();
    notify(
      waits ? `Sent to ${people.owner} for release` : scope === "agency" ? "Notice published to the whole agency" : scope === "team" ? "Notice shared with the Paris desk" : "Notice saved for you",
      {
        detail: `${severity} · ${productName}`,
        undo: () => d({ type: "patch", patch: { createdNotices: latest.current.createdNotices.filter((x) => x.id !== id) } }),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add a notice</SheetTitle>
          <SheetDescription>
            One fact about {productName}, with a severity. It stays until someone retires it.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <AudiencePicker id="notice-scope" value={scope} onChange={setScope} options={audienceOptions(owner, true)} />
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
            <RadioGroup value={severity} onValueChange={(v) => setSeverity(v as Severity)} className="mt-[var(--space-3)] flex gap-[var(--space-4)]">
              {SEVERITIES.map((v) => (
                <div key={v} className="flex items-center gap-[var(--space-2)]">
                  <RadioGroupItem value={v} id={`notice-sev-${v}`} />
                  <Label htmlFor={`notice-sev-${v}`} className="type-data">{v}</Label>
                </div>
              ))}
            </RadioGroup>
            <p className="mt-[var(--space-2)] type-meta">{SEVERITY_DOES[severity]}</p>
          </div>
          <Consequence>
            {waits && <>Goes to {people.owner} first. Once she releases it: </>}
            {effect}{cited}
          </Consequence>
        </SheetBody>
        <SheetFooter className="sm:flex-row sm:justify-end">
          <SheetClose asChild><Button variant="secondary">Cancel</Button></SheetClose>
          <Button disabled={!text.trim()} onClick={send}>{label}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ═══════════════ An announcement, to people ═══════════════ */
export function AnnouncementSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { s, d } = useDemo();
  const owner = s.role === "owner";
  const latest = useRef(s);
  useEffect(() => { latest.current = s; });
  const [scope, setScope] = useState<ShareScope>(owner ? "agency" : "team");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [query, setQuery] = useState("");
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

  const close = () => { onOpenChange(false); setTitle(""); setBody(""); setLinks([]); setQuery(""); };
  const ready = title.trim() && body.trim();

  const label = waits ? `Send to ${people.owner} for release` : scope === "agency" ? "Publish announcement" : "Share with the Paris desk";

  const send = () => {
    if (!ready) return;
    const id = newId();
    d({
      type: "createAnnouncement",
      announcement: { id, title: title.trim(), body: body.trim(), links, audience: scope === "agency" ? "agency" : "team", by: s.role },
    });
    close();
    notify(
      waits ? `Sent to ${people.owner} for release` : scope === "agency" ? "Announcement published to the whole agency" : "Announcement shared with the Paris desk",
      {
        detail: title.trim(),
        undo: () => d({ type: "patch", patch: { createdAnnouncements: latest.current.createdAnnouncements.filter((x) => x.id !== id) } }),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Write to the agency</SheetTitle>
          <SheetDescription>
            A dated message to your team or the whole agency. Link the records it is about; the facts stay on them.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <AudiencePicker id="ann-scope" value={scope} onChange={setScope} options={audienceOptions(owner, false)} />
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
          <Consequence>
            {waits
              ? <>Goes to {people.owner} first. Once she releases it, every advisor sees it on their Briefing, and answers may cite it with its date.</>
              : scope === "agency"
                ? <>Every advisor sees it on their Briefing at once, and answers may cite it with its date.</>
                : <>The Paris desk sees it on their Briefing at once.</>}
          </Consequence>
        </SheetBody>
        <SheetFooter className="sm:flex-row sm:justify-end">
          <SheetClose asChild><Button variant="secondary">Cancel</Button></SheetClose>
          <Button disabled={!ready} onClick={send}>{label}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
