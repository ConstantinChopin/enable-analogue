"use client";
/**
 * Sharing — one sheet for everything that can be shared (COL-10, VIS-101, 2026-09-28).
 *
 * A record, a note, a document, a notice, a traveller, a trip: the same question in the
 * same words, "Who can see this?", the same consequence line said before it happens, one
 * commit label and one footer order (Cancel, then the act at the right). It closes on
 * commit and confirms with a toast that carries Undo, because the result is elsewhere:
 * in other people's views.
 *
 * The one sharing rule (store.tsx): the Paris desk sees it at once; the whole agency sees
 * it at once when the owner shares it, and after her release when a user does. A
 * traveller is shared with a person, not an audience, so its sheet passes its own
 * options (the owner, and how much of the profile she sees) through `options`.
 */
import { useState, type ReactNode } from "react";
import { useDemo, type ShareScope } from "@/lib/store";
import { people } from "@/data/seed";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export interface AudienceOption<T extends string = string> { value: T; label: string; hint: string }

/** The three audiences, in the words every sheet uses. */
export function audienceOptions(owner: boolean, withPrivate = true): AudienceOption<ShareScope>[] {
  return [
    ...(withPrivate ? [{ value: "private" as const, label: "Only me", hint: "Nobody else sees it, and it answers nobody else." }] : []),
    { value: "team", label: "The Paris desk", hint: "6 advisors see it at once." },
    {
      value: "agency", label: "The whole agency",
      hint: owner ? "Every advisor sees it at once." : `Every advisor, once ${people.owner} releases it.`,
    },
  ];
}

/** What sharing to this audience will do, said before it is done. */
export function audienceLabel(scope: ShareScope, owner: boolean): string {
  if (scope === "private") return "Only you";
  if (scope === "team") return "The Paris desk";
  return owner ? "The whole agency" : `The whole agency, after ${people.owner}'s release`;
}

export function AudiencePicker<T extends string>({
  id, value, onChange, options, question = "Who can see this?",
}: { id: string; value: T; onChange: (v: T) => void; options: AudienceOption<T>[]; question?: string }) {
  return (
    <fieldset>
      <legend className="type-data-strong">{question}</legend>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as T)} className="mt-[var(--space-3)]">
        {options.map((o) => (
          <div key={o.value} className="flex items-start gap-[var(--space-3)]">
            <RadioGroupItem value={o.value} id={`${id}-${o.value}`} className="mt-px" />
            <Label htmlFor={`${id}-${o.value}`} className="flex flex-col items-start gap-0.5">
              <span className="type-data">{o.label}</span>
              <span className="type-meta">{o.hint}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </fieldset>
  );
}

export function ShareSheet<T extends string = ShareScope>({
  open, onOpenChange, what, current, onShare, options, describe, extra,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What is being shared, as a person names it: "Maison Léandre", "your note". */
  what: string;
  current: T;
  /** Applies the audience. Called again with the previous one to undo. */
  onShare: (next: T) => void;
  /** The audiences on offer. Defaults to Only me · The Paris desk · The whole agency. */
  options?: AudienceOption<T>[];
  /** The toast's line once shared: "Shared with the Paris desk". */
  describe?: (next: T) => string;
  /** Anything the choice needs beside the audience (how much of a profile). */
  extra?: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        {/* The content mounts on every open, so the choice starts from what is current. */}
        <ShareBody what={what} current={current} onShare={onShare} options={options} describe={describe} extra={extra} close={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}

function ShareBody<T extends string>({
  what, current, onShare, options, describe, extra, close,
}: {
  what: string; current: T; onShare: (next: T) => void; options?: AudienceOption<T>[];
  describe?: (next: T) => string; extra?: ReactNode; close: () => void;
}) {
  const { s } = useDemo();
  const owner = s.role === "owner";
  const opts = options ?? (audienceOptions(owner) as unknown as AudienceOption<T>[]);
  const [choice, setChoice] = useState<T>(current);

  const said = (v: T) => {
    if (describe) return describe(v);
    if (v === "private") return `${what} is private to you`;
    const who = audienceLabel(v as ShareScope, owner);
    return `Shared ${what} with ${who.charAt(0).toLowerCase()}${who.slice(1)}`;
  };
  const commit = () => {
    const previous = current;
    onShare(choice);
    close();
    notify(said(choice), { undo: () => onShare(previous) });
  };
  const narrowing = choice === "private" && current !== "private";

  return (
    <>
      <SheetHeader>
        <SheetTitle>Share {what}</SheetTitle>
        <SheetDescription>Choose who can see it. You can change this at any time.</SheetDescription>
      </SheetHeader>
      <div className="space-y-[var(--space-6)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">
        <AudiencePicker id="share" value={choice} onChange={setChoice} options={opts} />
        {extra}
      </div>
      <div className="mt-auto flex items-center justify-end gap-[var(--space-2)] border-t border-hairline px-[var(--space-6)] py-[var(--space-4)]">
        <Button variant="secondary" onClick={close}>Cancel</Button>
        <Button disabled={choice === current} onClick={commit}>{narrowing ? "Make private" : "Share"}</Button>
      </div>
    </>
  );
}
