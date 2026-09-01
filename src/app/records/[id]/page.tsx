"use client";
/**
 * Full record — the Document archetype (§7): main column plus a context rail.
 *
 * Maison Léandre carries the whole anatomy (three layers, provenance, conflict,
 * stale field, template copy, edited overlay, note composer). Hôtel Verlaine
 * carries the Critical acknowledgment gate. Every other id renders a real record
 * from its own seed fields — never a stub.
 */
import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  useDemo, canViewCommissions, scopeWrite, scopeAudience, type EditScope,
} from "@/lib/store";
import {
  products, productById, leandreFields, leandreContext, commissionConflict,
  notices, promotions, people, personName,
  type Field, type Layer, type Product, keptSource,
} from "@/data/seed";
import { Page, PageHeader, PropertyGallery } from "@/components/layouts";
import {
  Chip, Section, SeverityBanner, NarrationNote, FreshnessDate, EvidenceDot,
  ConfirmBanner, SchematicBadge, LayerBadge, ProvenancePopover, SourceTag, ConfidenceMeter,
} from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, EyeOff, Scale } from "lucide-react";

export default function RecordPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  if (id === "maison-leandre") return <Suspense fallback={null}><LeandreRecord /></Suspense>;
  if (id === "hotel-verlaine") return <VerlaineRecord />;
  return <GenericRecord id={id ?? ""} />;
}

/* ── the images that open every record ─────────────────────────────────────── */
function RecordPlate({ p }: { p: Product }) {
  return (
    <div className="mt-[var(--space-4)]">
      <PropertyGallery id={p.id} name={p.name} category={p.category} />
    </div>
  );
}

/* ═══════════════ Edit a field ═══════════════
   The scope question comes FIRST, because it is the one an advisor gets wrong.

   Typing a new value is the easy half. The half that matters is who the new value is
   for: yourself, your desk, or every advisor in the agency — and whether it goes live
   when you press the button or waits for a lead. Both are stated before the button,
   not discovered after it.

   Canonical is never a target. Enable publishes that layer; the agency writes above
   it, and the sheet shows the value that will remain underneath so an edit is visibly
   an overlay rather than a replacement.                                              */
function EditFieldSheet({
  field, open, onOpenChange,
}: { field: Field | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { s, d } = useDemo();
  const [value, setValue] = useState("");
  const [scope, setScope] = useState<EditScope>("personal");
  const [reason, setReason] = useState("");

  // Re-seed the form each time a different field opens the sheet.
  const key = field?.key ?? "";
  const [seeded, setSeeded] = useState("");
  if (open && key && seeded !== key) {
    setSeeded(key);
    setValue(s.fieldEdits[key]?.value ?? field?.value ?? "");
    /* Default to the scope the field already lives at, and to the NARROWEST scope when
       it has none — canonical is nobody's to widen by accident. Defaulting a canonical
       edit to agency-wide made "submit for review" the resting state of the button,
       which both buries a lead in proposals and teaches the advisor to click past the
       one question this sheet exists to ask. Editing an agency value keeps it at the
       agency, because silently narrowing that is the opposite footgun. */
    setScope(s.fieldEdits[key]?.scope ?? (field?.layer === "agency" ? "agency" : "personal"));
    setReason("");
  }

  if (!field) return null;
  const mode = scopeWrite(s.role, scope);
  const dirty = value.trim() !== "" && value.trim() !== field.value;

  const commit = () => {
    if (!dirty || !reason.trim()) return;
    d({
      type: "editField",
      key: field.key,
      edit: { value: value.trim(), scope, reason: reason.trim(), by: s.role, pending: mode === "review" },
    });
    onOpenChange(false);
  };

  const SCOPES: { v: EditScope; label: string }[] = [
    { v: "personal", label: "Just me" },
    { v: "team", label: "My team" },
    { v: "agency", label: "The whole agency" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>Edit {field.label.toLowerCase()}</SheetTitle>
          <SheetDescription>
            {field.layer === "canonical"
              ? "This value is published by Enable. Your change is stored above it — the canonical value stays, and stays visible."
              : "Your change is stored at the layer the scope implies, attributed to you and dated."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-[var(--space-4)] px-4 pb-5">
          <div className="rounded-[var(--radius-card)] border border-border bg-subtle p-[var(--space-3)]">
            <div className="type-micro text-muted-foreground">
              {field.layer === "canonical" ? "Canonical — stays beneath your change" : "Current value"}
            </div>
            <div className="mt-1 type-data">{field.value}</div>
            <div className="mt-1 type-meta">{field.source.where} · {field.source.when}</div>
          </div>

          <div>
            <Label htmlFor="edit-value" className="type-data-strong">New value</Label>
            <Textarea
              id="edit-value"
              rows={2}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-2 type-data"
            />
          </div>

          {/* The scope question, with its consequence spelled out per option rather
              than in a footnote nobody reads. */}
          <div>
            <div className="type-data-strong">Who is this change for?</div>
            <RadioGroup
              value={scope}
              onValueChange={(v) => setScope(v as EditScope)}
              className="mt-2 gap-[var(--space-3)]"
            >
              {SCOPES.map(({ v, label }) => {
                const needsReview = scopeWrite(s.role, v) === "review";
                return (
                  <div key={v} className="flex items-start gap-3">
                    <RadioGroupItem value={v} id={`edit-scope-${v}`} className="mt-0.5" />
                    <Label htmlFor={`edit-scope-${v}`} className="flex flex-col items-start gap-0.5">
                      <span className="type-data">{label}</span>
                      <span className="type-meta font-normal">
                        {scopeAudience(v, s.role)}
                        {needsReview && " · goes to a lead for review"}
                      </span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="edit-reason" className="type-data-strong">
              Why? <span className="text-muted-foreground">(required)</span>
            </Label>
            <p className="mt-1 type-meta">
              Stored with the value. The next person to open this field reads it instead of asking you.
            </p>
            <Textarea
              id="edit-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. confirmed by the property on today’s call"
              className="mt-2 type-data"
            />
          </div>

          {/* What is about to happen, in one line, immediately above the button that
              does it. The review path is not a failure state and does not read as one. */}
          <div className="rounded-[var(--radius-card)] border border-border p-[var(--space-3)]">
            <div className="type-micro text-muted-foreground">On save</div>
            <p className="mt-1 type-meta">
              {/* The audience string is not lowercased into the sentence: it can carry
                  a name, and "Live for only m. keller" is what that produced. It sits
                  as its own clause instead. */}
              {mode === "review" ? (
                <>Queued for {people.lead} to approve. Until then the record answers with the value it has now.</>
              ) : (
                <>Live immediately · {scopeAudience(scope, s.role)} · as {personName[s.role]}, today.</>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-[var(--space-2)]">
            <Button size="sm" disabled={!dirty || !reason.trim()} onClick={commit}>
              {mode === "review" ? "Submit for review" : "Save change"}
            </Button>
            {s.fieldEdits[field.key] && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { d({ type: "revertField", key: field.key }); onOpenChange(false); }}
              >
                Remove my change
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ═══════════════ Resolve sheet ═══════════════ */
function ResolveSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { d } = useDemo();
  /* All three values are selectable. Two of the buttons were disabled, so the sheet
     that exists to prove "the advisor decides" in fact permitted one answer — the one
     a ranking rule would have picked. And the decision now carries a reason, because
     every other irreversible act in this product does: a rejection logs one, a payment
     match requires one, and this one moves money. */
  const [picked, setPicked] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const chosen = commissionConflict.sources.find((s) => s.id === picked);

  const commit = () => {
    if (!picked || !reason.trim()) return;
    d({ type: "resolveConflict", choice: picked, reason: reason.trim() });
    onOpenChange(false);
    setPicked(null);
    setReason("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Scale className="size-4 text-crit" aria-hidden /> {commissionConflict.field} — 3 sources</SheetTitle>
          <SheetDescription>{commissionConflict.headline}</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4 pb-5">
          <NarrationNote>
            A ranking rule would settle this in a line of code — and would be wrong often enough to cost money. The advisor decides, once; the choice is stored at the agency layer and the question is not asked again.
          </NarrationNote>

          {commissionConflict.sources.map((src) => (
            <div
              key={src.id}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                picked === src.id ? "border-primary bg-primary-soft/40" : "border-border",
              )}
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0">
                  <div className="type-data-strong">{src.label}</div>
                  <div className="type-meta">{src.detail} · {src.when}</div>
                </div>
                <span className="ml-auto type-data-strong tnum">{src.value}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="type-data-strong">{src.status}</span>
                <ConfidenceMeter agree={src.agree} total={src.total} />
                <Button
                  size="sm"
                  variant={picked === src.id ? "default" : "outline"}
                  className="ml-auto"
                  onClick={() => setPicked(src.id)}
                >
                  {picked === src.id ? "Selected" : "Keep this value"}
                </Button>
              </div>
            </div>
          ))}

          {/* The reason, required — and shown only once a value is chosen, so the sheet
              asks one question at a time. */}
          {chosen && (
            <div className="rounded-lg border border-primary/50 bg-card p-4">
              <Label htmlFor="resolve-reason" className="type-data-strong">
                Why {chosen.value}? <span className="text-muted-foreground">(required)</span>
              </Label>
              <p className="mt-1 type-meta">
                Stored with the value at the agency layer, attributed to you and dated. The next
                person to open this field reads it instead of asking again.
              </p>
              <Textarea
                id="resolve-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. confirmed by Corvin & Wells on the 21 June rate note"
                className="mt-3 type-data"
              />
              <Button size="sm" className="mt-3" disabled={!reason.trim()} onClick={commit}>
                Store {chosen.value} at the agency layer
              </Button>
            </div>
          )}

          {/* ImpactPanel */}
          <div className="rounded-lg border border-border bg-subtle p-4">
            <div className="type-code uppercase tracking-widest text-muted-foreground">Where this value goes</div>
            <p className="mt-2 type-meta">
              The value you keep is what the directory shows, what a quote uses, and what the chat answers with.
            </p>
            <dl className="mt-2 space-y-1 type-data">
              {commissionConflict.impact.map((row) => (
                <div key={row.surface} className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">{row.surface}</dt>
                  <dd className="tnum font-medium">{chosen ? chosen.value : row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="type-code uppercase tracking-widest text-muted-foreground">The other fields</div>
            <dl className="mt-2 space-y-1 type-data">
              {commissionConflict.otherFields.map((f) => (
                <div key={f.label} className="flex items-baseline justify-between gap-3">
                  <dt>{f.label}</dt>
                  <dd><LayerBadge layer={f.layer} /></dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 border-t border-border pt-2 type-meta">Only commission is in dispute.</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* Each layer says what it is, once, where it governs. The layer model is the record's
   whole argument and it was being carried by a badge reading "canonical" beside a
   heading reading "Enable canonical" — a label repeating a label, explaining nothing.
   A sentence explains it; a chip never could. */
const layerLede: Record<Layer, string> = {
  canonical: "Published by Enable. Shared by every agency, and not yours to edit.",
  agency: "What your agency has decided, sitting over the canonical value beneath it.",
  personal: "Yours. Scoped when you write it, and visible to no one you did not name.",
};

/* ═══════════════ Maison Léandre — the full anatomy ═══════════════ */
function LeandreRecord() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s.role);
  const p = productById("maison-leandre")!;
  // Entry from the briefing: ?compose=notice opens the Add notice sheet on arrival.
  const search = useSearchParams();
  const [resolveOpen, setResolveOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(() => search?.get("compose") === "notice");
  const [editing, setEditing] = useState(false);
  const [editField, setEditField] = useState<Field | null>(null);
  const [noteScope, setNoteScope] = useState<"private" | "team" | "agency">("private");
  const [noteText, setNoteText] = useState("");
  const [savedScope, setSavedScope] = useState<"private" | "team" | "agency">("private");
  const spaNotice = notices.find((n) => n.id === "spa");
  const promo = promotions.find((x) => x.id === "atelier-credit");

  const groups: { layer: Layer; title: string }[] = [
    { layer: "canonical", title: "Enable canonical" },
    { layer: "agency", title: "Agency overlay" },
    { layer: "personal", title: "Personal" },
  ];
  // A private note renders only to its owner — absent for every other role, not masked.
  const fieldsFor = (layer: Layer) =>
    leandreFields.filter(
      (f) =>
        f.layer === layer &&
        (money || f.key !== "commission") &&
        (s.role === "advisor" || f.key !== "note-rd")
    );

  const scopeLabel = { private: "private to " + people.advisor, team: "team · Paris desk", agency: "agency-wide" }[savedScope];

  return (
    <Page width="wide">
      <PageHeader
        back="/records"
        crumb="Records / Hotel"
        title={<>Maison Léandre <Chip tone="neutral">Hotel · Paris 4e</Chip></>}
        /* Record-level actions belong to the record, so they sit with its name. Only
           Edit is filled: it is the one that changes what other people see. */
        actions={
          <>
            {/* Outline. This was filled, which put two filled buttons on a screen that
                already has one: "Resolve 3 sources" is the decision this record exists
                to force, and Edit is a mode toggle. A rule I wrote in a comment hours
                earlier, broken by me, and caught by the harness rather than by a
                person — which is the entire argument for the harness. */}
            <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
              {editing ? "Done editing" : "Edit…"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setNoteOpen(true)}>Add note…</Button>
            <Button variant="outline" size="sm" onClick={() => setNoticeOpen(true)}>Add notice…</Button>
          </>
        }
      >
        <RecordPlate p={p} />
      </PageHeader>

      <NarrationNote>
        The record is the model, inspectable — every value carries where it came from, how old it is, and which layer owns it. The conflict is seen here before it is felt in the conversation.
      </NarrationNote>

      <div className="mt-3 space-y-2">
        {/* world-aware notice banners */}
        {s.world === "v2" && spaNotice && !s.spaNoticeClosed && (
          <SeverityBanner severity="Important">
            <div className="flex flex-wrap items-center gap-2">
              <span><b>{spaNotice.text}</b> Opened {spaNotice.openedAt} · {spaNotice.scope} scope · {spaNotice.owner}</span>
              <span className="ml-auto" />
              {spaNotice.staleReviewDue && <Chip tone="warn">Still true? review due · {spaNotice.ageDays}d open</Chip>}
            </div>
          </SeverityBanner>
        )}
        {/* The v1 record does not caption itself. Its whole failure is that the notice
            is gone and nothing says so; a banner saying so undoes the demonstration.
            The frame bar marks the vintage on every surface instead. */}
        <ConfirmBanner show={s.noteSaved}>Note saved — {scopeLabel} · attributed and dated.</ConfirmBanner>
      </div>

      {/* Edit mode says what editing MEANS here before the first field is touched —
          that canonical is Enable's and is overlaid rather than overwritten, and that
          every change picks an audience. Both are the surprising parts.

          Not a NarrationNote: that is the presenter's overlay and renders nothing
          unless narration is switched on, so this copy would have been invisible to
          the person it is written for. */}
      {editing && (
        <div className="mt-3 rounded-[var(--radius-card)] border border-border bg-subtle px-[var(--space-4)] py-[var(--space-3)]">
          <div className="type-data-strong">Editing as {personName[s.role]}</div>
          <p className="mt-1 type-data text-muted-foreground">
            Canonical values belong to Enable. A change is stored above one, and the published value
            stays readable underneath. Every change picks who it is for: just you, your team, or the
            whole agency.{" "}
            {scopeWrite(s.role, "agency") === "review"
              ? `Agency-wide changes go to ${people.lead} for review before anyone else sees them.`
              : "You can publish agency-wide changes directly."}
          </p>
        </div>
      )}

      {/* ── the record's groups, all peers ── */}
      <div className="mt-4 bento">
          {/* A layer IS a container — canonical, agency and personal are three
              different answers to "who owns this value", and a box is the honest way
              to say so. What was missing was never the box; it was a heading that
              outranked its contents (13/590 against 13/400) and a line saying what the
              layer means. Both now come from the primitive and the lede.

              Keeping the card also keeps the group's actions with the group, which is
              how every other surface in this product works.                          */}
          {groups.map((g) => (
            <Section key={g.layer} title={g.title}>
              <p className="-mt-[var(--space-1)] mb-[var(--space-2)] type-meta">{layerLede[g.layer]}</p>
              <div className="divide-y divide-border">
                {fieldsFor(g.layer).map((f) => (
                  <FieldRow
                    key={f.key}
                    f={f}
                    resolved={s.conflictResolved}
                    onResolve={() => setResolveOpen(true)}
                    editing={editing}
                    onEdit={() => setEditField(f)}
                  />
                ))}
                {g.layer === "personal" && s.noteSaved && s.role === "advisor" && (
                  <FieldGrid
                    label="My note"
                    provenance={<SourceTag kind="manual" label={`${people.advisor} · today`} />}
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="type-data">{noteText.trim() ? `“${noteText.trim()}”` : "Note on file"}</span>
                      <Chip tone="ok">Saved just now · {savedScope}</Chip>
                    </div>
                  </FieldGrid>
                )}
              </div>
            </Section>
          ))}

          <Section title="Amenities">
            <p className="-mt-[var(--space-1)] mb-[var(--space-2)] type-meta">What the client gets, and what the agency earns on it.</p>
            <div className="divide-y divide-border type-data">
              <FieldGrid label="Facility copy">
                <p className="text-muted-foreground italic">“View Hotel — experience refined luxury…”</p>
                <Chip tone="warn" className="mt-1">template copy — needs editorial</Chip>
              </FieldGrid>
              <FieldGrid label="Client amenities">
                <ul className="divide-y divide-border">
                  {leandreContext.clientAmenities.map((a) => (
                    <li key={a.slug} className="row-grid">
                      <span className="row-primary">{a.benefit}</span>
                      <span className="row-trailing type-code text-muted-foreground">{a.slug}</span>
                    </li>
                  ))}
                </ul>
              </FieldGrid>
              {money && (
                <FieldGrid label="Agent terms">
                  {leandreContext.agentAmenities.map((a) => (
                    <p key={a.category} className="flex flex-wrap items-center gap-2">
                      <Chip tone="primary">{a.category}</Chip> <span className="tnum">{a.text}</span>
                    </p>
                  ))}
                </FieldGrid>
              )}
            </div>
          </Section>

          <Section title="Contacts">
            <p className="-mt-[var(--space-1)] mb-[var(--space-2)] type-meta">
              Rep firm of record · Corvin &amp; Wells — Paris account. Booked last by {leandreContext.whoBookedLast}.
            </p>
            <ul className="divide-y divide-border type-data">
              {leandreContext.contacts.map((c) => (
                <li key={c.name} className="py-2 first:pt-0">
                  <div className="row-grid">
                    <span className="row-primary">
                      <span className="type-data-strong">{c.name}</span>
                      <span className="text-muted-foreground"> · {c.role}</span>
                    </span>
                  </div>
                  {c.note && <div className="type-meta">{c.note}</div>}
                </li>
              ))}
            </ul>
          </Section>

          {money && promo && (
            <Section title="Active promotion">
              <div className="type-data-strong">{promo.productName} — {promo.rate}</div>
              <p className="mt-1 type-meta">
                {promo.stacksWithBase ? "bonus — adds to base" : "override — replaces base"} · book by {promo.bookingWindowEnd} · travel by {promo.travelWindowEnd}
              </p>
              <Chip tone="warn" className="mt-2 tnum">{promo.daysLeft} days left</Chip>
            </Section>
          )}

          {/* client intelligence: gated — absent, not masked; lead sees the admin-note line only */}
          {s.role === "lead" && (
            <Section title="Client intelligence">
              <p className="flex items-center gap-2 type-meta">
                <EyeOff className="size-3.5 shrink-0" aria-hidden />
                {leandreContext.clientIntelligence.note}
              </p>
            </Section>
          )}
      </div>

      <ResolveSheet open={resolveOpen} onOpenChange={setResolveOpen} />
      <EditFieldSheet field={editField} open={!!editField} onOpenChange={(v) => !v && setEditField(null)} />

      {/* ── note composer ── */}
      <Sheet open={noteOpen} onOpenChange={setNoteOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>Add a note</SheetTitle>
            <SheetDescription>Attributed to {people.advisor}, dated today. The scope is chosen at creation.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-5">
            <Textarea placeholder="What should the record remember?" aria-label="Note text" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <RadioGroup value={noteScope} onValueChange={(v) => setNoteScope(v as typeof noteScope)} className="gap-3">
              {([["private", "Private", `Only ${people.advisor}`], ["team", "Team", "Paris desk"], ["agency", "Agency-wide", "Every advisor"]] as const).map(([v, l, hint]) => (
                <div key={v} className="flex items-start gap-3">
                  <RadioGroupItem value={v} id={`scope-${v}`} className="mt-0.5" />
                  <Label htmlFor={`scope-${v}`} className="flex flex-col items-start gap-0.5">
                    <span className="type-data">{l}</span>
                    <span className="type-meta font-normal">{hint}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Button size="sm" onClick={() => { setSavedScope(noteScope); d({ type: "saveNote" }); setNoteOpen(false); }}>Save note</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── notice composer (schematic) ── */}
      <Sheet open={noticeOpen} onOpenChange={setNoticeOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">Add a notice <SchematicBadge /></SheetTitle>
            <SheetDescription>A notice carries a severity, a scope, and an owner. It stays open until someone closes it.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-5">
            <Textarea placeholder="What changed at the property?" aria-label="Notice text" />
            <div>
              <div className="mb-2 type-micro">Severity</div>
              <div className="flex gap-2">
                <Chip tone="neutral">Info</Chip><Chip tone="warn">Important</Chip><Chip tone="crit">Critical</Chip>
              </div>
            </div>
            <div>
              <div className="mb-2 type-micro">Scope</div>
              <div className="flex gap-2">
                <Chip tone="neutral">Personal</Chip><Chip tone="neutral">Team</Chip><Chip tone="primary">Agency</Chip>
              </div>
            </div>
            <Button size="sm" variant="outline">Submit for review</Button>
          </div>
        </SheetContent>
      </Sheet>
    </Page>
  );
}

/* ── one field row, all states ── */
function FieldRow({
  f, resolved, onResolve, editing, onEdit,
}: {
  f: Field; resolved: boolean; onResolve: () => void;
  editing?: boolean; onEdit?: () => void;
}) {
  // Stale-field one-tap verify (E6) — local to this row.
  const [verified, setVerified] = useState(false);
  const { s } = useDemo();
  const kept = keptSource(s.conflictChoice);
  const reason = s.conflictReason;
  const edit = s.fieldEdits[f.key];
  if (f.state === "conflict") {
    return (
      <FieldGrid label={f.label}>
        {resolved ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <ProvenancePopover source={f.source}><span className="type-data font-medium tnum">{kept.value}</span></ProvenancePopover>
            <Chip tone="ok">resolved</Chip>
            <span className="type-meta">agency layer · {kept.label} · by {people.advisor} today · both other sources reachable</span>
            {reason && <span className="basis-full type-meta">Reason: “{reason}”</span>}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {commissionConflict.sources.map((src) => (
                <span key={src.id} className="rounded-lg border border-border px-2 py-1 type-data">
                  <b className="tnum">{src.value}</b> <span className="text-muted-foreground">{src.label} · {src.when}</span>
                </span>
              ))}
            </div>
            {/* The one filled button on this screen, and it sits on the field it acts
                on. It briefly lived in the action column too, which put the same filled
                label twice on one screen — the cost of moving a FIELD-level action to a
                page-level place. The column carries the value and its state; the row
                carries the decision. */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Chip tone="crit">3 sources disagree</Chip>
              <Button size="sm" onClick={onResolve}>Resolve 3 sources</Button>
            </div>
          </>
        )}
      </FieldGrid>
    );
  }

  return (
    <FieldGrid
      label={f.label}
      provenance={
        <>
          <SourceTag kind={f.source.kind} label={f.source.where} />
          <FreshnessDate stale={f.state === "stale" && !verified}>
            {f.state === "stale" && verified ? "verified today" : f.source.when}
          </FreshnessDate>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <ProvenancePopover source={f.source}>
          <span
            className={cn(
              "type-data", f.key === "rooms" && "tnum",
              f.state === "template" && "italic text-muted-foreground",
              /* A pending edit has not happened yet, so the row keeps ANSWERING with
                 the value it has. Showing the proposal as though it were live would
                 make the review step decorative. */
              edit && !edit.pending && "line-through text-muted-foreground",
            )}
          >
            {f.value}
          </span>
        </ProvenancePopover>
        {edit && !edit.pending && <span className="type-data-strong">{edit.value}</span>}
        {edit && <Chip tone={edit.pending ? "warn" : "primary"}>
          {edit.pending ? "proposed · agency-wide · awaiting review" : `${edit.scope} · edited by ${personName[edit.by]} today`}
        </Chip>}
        {f.state === "edited-overlay" && !edit && <Chip tone="primary">agency overlay</Chip>}
        {f.state === "stale" && verified && <Chip tone="ok">verified today · {people.advisor}</Chip>}
        {f.state === "stale" && !verified && <Chip tone="warn" className="tnum">{f.staleDays}d unverified</Chip>}
        {f.state === "template" && <Chip tone="warn">template copy — needs editorial</Chip>}
      </div>

      {edit && (
        <p className="mt-1 type-meta">
          {edit.pending ? <>Proposed value “{edit.value}” · </> : null}
          Reason: “{edit.reason}”
        </p>
      )}

      {/* Only in edit mode. A pencil on every row at rest turns a record you are
          reading into a form you are filling in, and the whole argument of this screen
          is that it is the former. */}
      {editing && onEdit && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onEdit}>
          {edit ? "Change again…" : "Edit…"}
        </Button>
      )}

      {/* The action sits under the value, not beside it. Inline, it competed with the
          value for the eye and it was the thing forcing the wrap that broke the
          provenance column on every stale row. */}
      {f.state === "stale" && !verified && (
        <Button variant="outline" size="sm" className="mt-2" onClick={() => setVerified(true)}>
          Verify against source
        </Button>
      )}

      {f.state === "template" && (
        <p className="mt-1 type-meta">Excluded from answer corroboration.</p>
      )}
      {f.state === "edited-overlay" && f.beneath && (
        <p className="mt-1 type-meta">
          canonical beneath ·{" "}
          <ProvenancePopover source={f.beneath.source}><span>{f.beneath.value}</span></ProvenancePopover>
        </p>
      )}
    </FieldGrid>
  );
}

/* ── the field row's shape ───────────────────────────────────────────────────
   Three real columns: label, value, provenance.

   Every row used one wrapping flex with `ml-auto` on the provenance cluster. That
   right-aligns against whatever line the cluster happens to wrap onto, not against a
   shared axis — so the "provenance column" was only a column while nothing wrapped.
   Measured on this record before the change: five rows, five different left edges
   spanning 96px, at three different vertical offsets.

   A grid column cannot do that. Alignment now comes from the track, and a row that
   needs two lines pushes its own height without moving anything else.               */
function FieldGrid({
  label, provenance, children,
}: { label: string; provenance?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="field-row">
      <div className="type-data text-muted-foreground">{label}</div>
      <div className="min-w-0">{children}</div>
      {provenance && (
        <div className="flex flex-col items-start gap-0.5 sm:items-end sm:text-right">
          {provenance}
        </div>
      )}
    </div>
  );
}

/* ═══════════════ Hôtel Verlaine — Critical acknowledgment gate ═══════════════ */
function VerlaineRecord() {
  const { s, d } = useDemo();
  const money = canViewCommissions(s.role);
  const p = products.find((x) => x.id === "hotel-verlaine")!;
  const crit = notices.find((n) => n.id === "verlaine-crit")!;
  const [dlgOpen, setDlgOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const onShortlist = () => {
    if (s.verlaineAcked) setAdded(true);
    else setDlgOpen(true);
  };
  const acknowledge = () => {
    d({ type: "ackVerlaine" });
    setAdded(true);
    setDlgOpen(false);
  };

  return (
    <Page width="wide">
      <PageHeader
        back="/records"
        crumb="Records / Hotel"
        title={<>Hôtel Verlaine <Chip tone="neutral">Hotel · Paris 8e</Chip></>}
      >
        <RecordPlate p={p} />
      </PageHeader>

      <SeverityBanner severity="Critical">
        <div className="flex flex-wrap items-center gap-2">
          <span><b>Critical.</b> {crit.text}</span>
          <span className="ml-auto" />
          {s.verlaineAcked
            ? <Chip tone="ok">acknowledged — {people.advisor}, today</Chip>
            : <Chip tone="crit">acknowledgment required</Chip>}
        </div>
        <div className="mt-1 type-meta">Opened {crit.openedAt} · {crit.scope} scope · {crit.owner}</div>
      </SeverityBanner>

      <div className="mt-4 bento">
          <Section title="The record">
            {p.blurb && <p className="-mt-[var(--space-1)] mb-[var(--space-2)] type-meta">{p.blurb}</p>}
            <dl className="divide-y divide-border type-data">
              <Row k="City">{p.city}, {p.country}</Row>
              <Row k="Tier">{p.luxuryTier}</Row>
              <Row k="Rooms" tnum>{p.rooms}</Row>
              <Row k="Programme">{p.programs.join(" · ")}</Row>
              <Row k="Rep firm">{p.repFirm}</Row>
              {money && <Row k="Commission" tnum>{p.rate}</Row>}
              <Row k="Style">{p.tags?.join(" · ")}</Row>
            </dl>
            <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
              <EvidenceDot kind="verified" label={p.evidence.label} />
              <FreshnessDate>updated {p.updated}</FreshnessDate>
            </div>
          </Section>

          <Section title="Open notices">
            <div className="space-y-3">
              {notices.filter((n) => n.productId === p.id).map((n) => (
                <SeverityBanner key={n.id} severity={n.severity}>
                  <div>{n.text}</div>
                  <div className="mt-1 type-meta">
                    Opened {n.openedAt} · {n.scope} scope · {n.owner} · <span className="tnum">{n.ageDays}d</span> open
                  </div>
                </SeverityBanner>
              ))}
            </div>
          </Section>

          {/* The rule, and the act it governs, in one box — which is the argument for
              boxes: an action belongs with the group it acts on, and the group's header
              is where a group-level action has somewhere to live. */}
          <Section title="Use in itineraries">
            <p className="-mt-[var(--space-1)] mb-[var(--space-3)] type-meta">
              A Critical notice blocks shortlist and proposal use until it is acknowledged. Dismissing the notice is not an acknowledgment.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={onShortlist} disabled={added}>
                Add to itinerary shortlist
              </Button>
              {added && <Chip tone="ok">on the shortlist</Chip>}
            </div>
          </Section>
      </div>

      <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Critical notice on Hôtel Verlaine</DialogTitle>
            <DialogDescription>{crit.text}</DialogDescription>
          </DialogHeader>
          <SeverityBanner severity="Critical">
            Opened {crit.openedAt} · {crit.scope} scope · {crit.owner}
          </SeverityBanner>
          <p className="type-meta">
            Closing this dialog does not unblock the property. The acknowledgment is recorded with a name and a date.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgOpen(false)}>Close</Button>
            <Button onClick={acknowledge}>Acknowledge (recorded: {people.advisor}, today)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}

/* ═══════════════ Every other record — real, from its own fields ═══════════════ */
function GenericRecord({ id }: { id: string }) {
  const { s } = useDemo();
  const money = canViewCommissions(s.role);
  const p = productById(id);
  const reviewer = s.role === "lead" || s.role === "ops";

  if (!p) {
    return (
      <Page width="wide">
        <PageHeader back="/records" crumb="Records" title="Not in the directory" />
        <Section>
          <p className="type-data text-muted-foreground">
            No record carries this id. A missing property can be requested from the directory — the extraction pipeline creates a candidate for review.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/records">Back to records <ArrowRight className="size-3.5" aria-hidden /></Link>
          </Button>
        </Section>
      </Page>
    );
  }

  // The unconfirmed candidate is not a record yet, and does not pretend to be one.
  if (p.id === "sereno-kyoto" && !s.candidateConfirmed && !reviewer) {
    return (
      <Page width="wide">
        <PageHeader back="/records" crumb="Records" title="Awaiting confirmation" />
        <Section>
          <p className="type-data text-muted-foreground">
            This candidate arrived from a DMC spreadsheet and has not been confirmed. It does not answer
            questions and it is not offered to a client until a reviewer has been through it field by field.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/records">Back to records <ArrowRight className="size-3.5" aria-hidden /></Link>
          </Button>
        </Section>
      </Page>
    );
  }

  const productNotices = notices.filter((n) => n.productId === p.id);
  const productPromo = promotions.find((x) => x.productId === p.id);

  return (
    <Page width="wide">
      <PageHeader
        back="/records"
        crumb={`Records / ${p.category}`}
        title={<>{p.name} <Chip tone="neutral">{p.category} · {p.city}</Chip></>}
      >
        <RecordPlate p={p} />
      </PageHeader>

      <div className="bento">
          <Section title="The record">
            {p.blurb && <p className="-mt-[var(--space-1)] mb-[var(--space-2)] type-meta">{p.blurb}</p>}
            <dl className="divide-y divide-border type-data">
              <Row k="Location">{p.city}{p.country !== "—" ? `, ${p.country}` : ""} · {p.region}</Row>
              <Row k="Tier">{p.luxuryTier}</Row>
              {p.brand && <Row k="Brand">{p.brand}</Row>}
              {p.address && <Row k="Address">{p.address}</Row>}
              {p.rooms !== undefined && <Row k="Rooms" tnum>{p.rooms}</Row>}
              <Row k="Status">
                {p.status === "Active" ? "Active" : <Chip tone="warn">{p.status}</Chip>}
              </Row>
              {p.repFirm && <Row k="Rep firm">{p.repFirm}</Row>}
              {money && p.rate !== "—" && <Row k="Commission" tnum>{p.rate}</Row>}
            </dl>
          </Section>

          <Section title="Programmes and consortia">
            <div className="flex flex-wrap gap-2">
              {p.programs.map((pr) => <Chip key={pr} tone="primary">{pr}</Chip>)}
              {p.consortia.map((c) => <Chip key={c} tone="neutral" className="bg-background">{c}</Chip>)}
              {/* The empty state, without the sentence explaining the policy behind it.
                  That an empty list is not a guess is the product's argument, and the
                  product does not argue with the advisor on the screen. */}
              {p.programs.length === 0 && p.consortia.length === 0 && (
                <p className="type-data text-muted-foreground">
                  No programme or consortium membership on file.
                </p>
              )}
            </div>
            {p.tags && p.tags.length > 0 && (
              <p className="mt-3 border-t border-border pt-3 type-data">
                <span className="text-muted-foreground">Style · </span>{p.tags.join(" · ")}
              </p>
            )}
          </Section>

          {productNotices.length > 0 && (
            <Section title="Open notices">
              <div className="space-y-3">
                {productNotices.map((n) => (
                  <SeverityBanner key={n.id} severity={n.severity}>
                    <div>{n.text}</div>
                    <div className="mt-1 type-meta">
                      Opened {n.openedAt} · {n.scope} scope · {n.owner} · <span className="tnum">{n.ageDays}d</span> open
                    </div>
                  </SeverityBanner>
                ))}
              </div>
            </Section>
          )}

          <Section title="Evidence">
            {/* The stale date and its warning chip are the statement. Narrating what
                the product does with them was a line about the product, not about
                this hotel. */}
            <div className="space-y-2 type-data">
              {p.evidence.kind === "unconfirmed"
                ? <Chip tone="warn">{p.evidence.label}</Chip>
                : <EvidenceDot kind={p.evidence.kind} label={p.evidence.label} />}
              <div>
                <FreshnessDate stale={!!p.staleDays}>
                  updated {p.updated} · last verified {p.lastVerified}
                </FreshnessDate>
              </div>
            </div>
          </Section>

          {money && productPromo && (
            <Section title="Active promotion">
              <div className="type-data-strong">{productPromo.rate}</div>
              <p className="mt-1 type-meta">
                {productPromo.stacksWithBase ? "bonus — adds to base" : "override — replaces base"} · book by {productPromo.bookingWindowEnd} · travel by {productPromo.travelWindowEnd}
              </p>
              <Chip tone="warn" className="mt-2 tnum">{productPromo.daysLeft} days left</Chip>
            </Section>
          )}
      </div>
    </Page>
  );
}

/* The same track as FieldGrid, in description-list markup. A record's fields are a
   description list, so the `dl`/`dt`/`dd` stays; only the geometry is shared. */
function Row({ k, children, tnum }: { k: string; children: ReactNode; tnum?: boolean }) {
  return (
    <div className="field-row">
      <dt className="type-data text-muted-foreground">{k}</dt>
      <dd className={cn("min-w-0 type-data", tnum && "tnum")}>{children}</dd>
    </div>
  );
}
