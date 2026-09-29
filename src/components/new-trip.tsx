"use client";
/**
 * Starting a trip (the itinerary builder, in the lab; U21 in docs/rebuild/05-two-roles.md).
 *
 * The four things a trip cannot exist without: who travels, what it is called, where,
 * and when. Everything else is a line, added on the trip itself. A new trip is Planning,
 * private to whoever made it (DEC-30), and opens empty with its first move on the rail:
 * where they sleep.
 *
 * Two doors, one sheet: "New trip" on the trip list, "Start a trip" on a traveller. And
 * a third way through it: "Let Enable draft it" hands what is filled in to the assistant,
 * which asks only for the rest and assembles the draft (src/lib/draft-trip.ts).
 *
 * 2026-09-28 (UX sweep COL-04, COL-10; VIS-098, VIS-101): the owner is offered only the
 * travellers she added herself, never an advisor's (they are absent to her, not locked),
 * so the button is hers only when she has one. The footer reads Cancel, then the act at
 * the right. "Private to you until you share it" is now true: the trip page shares it.
 */
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { startDraftWith } from "@/components/assistant";
import { useDemo, type DemoState } from "@/lib/store";
import { travellerCards, type Trip } from "@/data/seed";
import { datesLabel, TODAY, addDays } from "@/data/trip-lines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus } from "lucide-react";

/** Everyone this person can start a trip for: the advisor's own travellers (the seeded
    ones are hers), and those she added by hand. The owner has only her own (VIS-098). */
function travellersOf(s: DemoState) {
  return [
    ...(s.role === "user" ? travellerCards.map((t) => ({ id: t.id, name: t.name })) : []),
    ...s.createdTravellers.filter((t) => t.by === s.role).map((t) => ({ id: t.id, name: t.name })),
  ];
}

let made = 0;
const tripId = (title: string) => `t-${title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32)}-${++made}${Date.now().toString(36).slice(-3)}`;
const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export function NewTripSheet({ open, onOpenChange, travellerId }: {
  open: boolean; onOpenChange: (v: boolean) => void; travellerId?: string;
}) {
  const { s, d } = useDemo();
  const router = useRouter();
  const pathname = usePathname();
  const people = travellersOf(s);
  const [who, setWho] = useState(travellerId ?? "");
  const [title, setTitle] = useState("");
  const [where, setWhere] = useState("");
  const [from, setFrom] = useState(addDays(TODAY, 30));
  const [to, setTo] = useState(addDays(TODAY, 34));

  /* Each opening starts clean, on the traveller it was opened from. */
  const [was, setWas] = useState(open);
  if (open !== was) {
    setWas(open);
    if (open) { setWho(travellerId ?? ""); setTitle(""); setWhere(""); setFrom(addDays(TODAY, 30)); setTo(addDays(TODAY, 34)); }
  }

  const nights = days(from, to);
  const places = where.split(",").map((x) => x.trim()).filter(Boolean);
  const person = people.find((p) => p.id === who);
  const ready = !!person && places.length > 0 && nights > 0 && from >= TODAY;
  const name = title.trim() || (places[0] ? `${places[0]}, ${nights} ${nights === 1 ? "night" : "nights"}` : "");

  const create = () => {
    if (!ready || !person) return;
    const trip: Trip = {
      id: tripId(name), title: name, traveller: person.name, travellerId: person.id,
      destinations: places, dates: datesLabel(from, to), startsInDays: days(TODAY, from),
      status: "Planning", nights, products: [],
    };
    d({ type: "tripCreate", trip });
    onOpenChange(false);
    router.push(`/itineraries/${trip.id}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>New trip</SheetTitle>
          <SheetDescription>Who, where and when. Everything else is added on the trip, line by line.</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-4)] overflow-y-auto px-[var(--space-6)] pb-[var(--space-6)]">
          <div className="flex flex-col gap-[var(--space-1)]">
            <Label>For</Label>
            <Select value={who} onValueChange={setWho}>
              <SelectTrigger size="sm" className="w-full"><SelectValue placeholder="Choose a traveller" /></SelectTrigger>
              <SelectContent>
                {people.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-[var(--space-1)]">
            <Label htmlFor="trip-where">Where</Label>
            <Input id="trip-where" size="sm" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Paris, or Kyoto, Nara" />
          </div>
          <div className="grid grid-cols-2 gap-[var(--space-3)]">
            <div className="flex flex-col gap-[var(--space-1)]">
              <Label htmlFor="trip-from">From</Label>
              <Input id="trip-from" size="sm" type="date" min={TODAY} value={from} onChange={(e) => { setFrom(e.target.value); if (e.target.value >= to) setTo(addDays(e.target.value, 1)); }} />
            </div>
            <div className="flex flex-col gap-[var(--space-1)]">
              <Label htmlFor="trip-to">To</Label>
              <Input id="trip-to" size="sm" type="date" min={addDays(from, 1)} value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-[var(--space-1)]">
            <Label htmlFor="trip-title">Name</Label>
            <Input id="trip-title" size="sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={name || "Paris, thirtieth anniversary"} />
            <p className="type-meta">Optional. As the traveller would say it; the place and the nights if you leave it.</p>
          </div>
          <p className="type-meta">
            {nights > 0 ? `${datesLabel(from, to)} · ${nights} ${nights === 1 ? "night" : "nights"}. ` : "The trip ends after it starts. "}
            Private to you until you share it.
          </p>
        </div>
        <div className="flex items-center justify-end gap-[var(--space-2)] border-t border-hairline px-[var(--space-6)] py-[var(--space-4)]">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          {/* the other door: the assistant drafts it, asking only for what is not filled in */}
          {s.lab && (
            <Button variant="secondary" onClick={() => {
              onOpenChange(false);
              startDraftWith(d, s, pathname, {
                who: person, where: places[0],
                ...(nights > 0 && from >= TODAY && (where.trim() || title.trim()) ? { from, to } : {}),
              });
            }}>
              Let Enable draft it
            </Button>
          )}
          <Button onClick={create} disabled={!ready}>Create the trip</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** "Start a trip" on a traveller, or "New trip" on the list: the same sheet. Lab only, and
    only for someone with a traveller to start one for. */
export function NewTripButton({ travellerId, label = "New trip" }: { travellerId?: string; label?: string }) {
  const { s } = useDemo();
  const [open, setOpen] = useState(false);
  if (!s.lab || travellersOf(s).length === 0) return null;
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}><Plus aria-hidden /> {label}</Button>
      <NewTripSheet open={open} onOpenChange={setOpen} travellerId={travellerId} />
    </>
  );
}
