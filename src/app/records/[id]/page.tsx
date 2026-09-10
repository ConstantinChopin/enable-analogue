"use client";
/**
 * The record — recomposed first (docs/rebuild/02-sequence.md, Pass 1.5).
 *
 * Affinity: Airbnb's listing detail (anatomy/surfaces/listing-detail.md). One entity,
 * presented in full: imagery, then chapters at column width separated by hairlines,
 * and beside them the one tool that follows you — the Summary — which holds
 * everything unsettled about the record and the ONE primary action, at its bottom.
 *
 * Chapters, in order: the advisory banner (if any) · Enable canonical · Agency
 * overlay · Personal · Amenities (preview → grey button → sheet) · Contacts ·
 * Active promotion · Client intelligence (lead only, quiet).
 *
 * The one primary: "Resolve 3 sources" (contract: resolve the disputed commission).
 * It lives in the Summary tool. The commission row carries the three values and a
 * secondary "Resolve…" so the decision is reachable from the field too (VIS-072).
 * Text actions (Edit · Add note · Add notice) sit in the title row.
 *
 * Maison Léandre carries the whole anatomy; Hôtel Verlaine the Critical gate; every
 * other id renders a real record from its own seed fields.
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
  Rows, Row, DataList,
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

/* ── the sheet body: 24 inside, rows stacked ──────────────────────────────── */
function SheetBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-[var(--space-6)] overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]", className)}>{children}</div>;
}

/* ═══════════════ Edit a field ═══════════════
   The scope question comes FIRST, because it is the one an advisor gets wrong.
   Canonical is never a target: Enable publishes that layer; the agency writes above
   it, and the sheet shows the value that will remain underneath.                    */
function EditFieldSheet({
  field, open, onOpenChange,
}: { field: Field | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { s, d } = useDemo();
  const [value, setValue] = useState("");
  const [scope, setScope] = useState<EditScope>("personal");
  const [reason, setReason] = useState("");

  const key = field?.key ?? "";
  const [seeded, setSeeded] = useState("");
  if (open && key && seeded !== key) {
    setSeeded(key);
    setValue(s.fieldEdits[key]?.value ?? field?.value ?? "");
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
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit {field.label.toLowerCase()}</SheetTitle>
          <SheetDescription>
            {field.layer === "canonical"
              ? "This value is published by Enable. Your change is stored above it — the canonical value stays, and stays visible."
              : "Your change is stored at the layer the scope implies, attributed to you and dated."}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <DataList rows={[
            { label: field.layer === "canonical" ? "Canonical — stays beneath your change" : "Current value", value: field.value },
            { label: "Source", value: `${field.source.where} · ${field.source.when}` },
          ]} />

          <div>
            <Label htmlFor="edit-value">New value</Label>
            <Textarea
              id="edit-value"
              rows={2}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-[var(--space-2)]"
            />
          </div>

          <div>
            <div className="type-data-strong">Who is this change for?</div>
            <RadioGroup
              value={scope}
              onValueChange={(v) => setScope(v as EditScope)}
              className="mt-[var(--space-3)]"
            >
              {SCOPES.map(({ v, label }) => {
                const needsReview = scopeWrite(s.role, v) === "review";
                return (
                  <div key={v} className="flex items-start gap-[var(--space-3)]">
                    <RadioGroupItem value={v} id={`edit-scope-${v}`} className="mt-px" />
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
            <Label htmlFor="edit-reason">
              Why? <span className="text-label-secondary">(required)</span>
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
              className="mt-[var(--space-2)]"
            />
          </div>

          <div className="border-t border-hairline pt-[var(--space-4)]">
            <div className="type-micro-caps text-label-tertiary">On save</div>
            <p className="mt-1 type-data-read text-label-secondary">
              {mode === "review" ? (
                <>Queued for {people.lead} to approve. Until then the record answers with the value it has now.</>
              ) : (
                <>Live immediately · {scopeAudience(scope, s.role)} · as {personName[s.role]}, today.</>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-[var(--space-2)]">
            <Button disabled={!dirty || !reason.trim()} onClick={commit}>
              {mode === "review" ? "Submit for review" : "Save change"}
            </Button>
            {s.fieldEdits[field.key] && (
              <Button
                variant="secondary"
                onClick={() => { d({ type: "revertField", key: field.key }); onOpenChange(false); }}
              >
                Remove my change
              </Button>
            )}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/* ═══════════════ Resolve sheet ═══════════════
   All three values are selectable; the chosen one inverts its edge (VIS-021) and the
   decision carries a reason, because every irreversible act in this product does.  */
function ResolveSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { d } = useDemo();
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
      <SheetContent side="right" className="w-[min(92vw,560px)]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Scale className="size-[var(--icon-lg)] text-crit" aria-hidden /> {commissionConflict.field} — 3 sources</SheetTitle>
          <SheetDescription>{commissionConflict.headline}</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-[var(--space-4)]">
          <NarrationNote>
            A ranking rule would settle this in a line of code — and would be wrong often enough to cost money. The advisor decides, once; the choice is stored at the agency layer and the question is not asked again.
          </NarrationNote>

          <div role="radiogroup" aria-label="Sources" className="space-y-[var(--space-2)]">
            {commissionConflict.sources.map((src) => {
              const on = picked === src.id;
              return (
                <button
                  key={src.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPicked(src.id)}
                  className={cn(
                    "pressable block w-full cursor-pointer rounded-lg border p-[var(--space-4)] text-left",
                    on ? "border-selected bg-sunken" : "border-hairline hover:border-stroke-hover",
                  )}
                >
                  <div className="flex flex-wrap items-start gap-[var(--space-3)]">
                    <div className="min-w-0">
                      <div className="type-data-strong">{src.label}</div>
                      <div className="type-meta">{src.detail} · {src.when}</div>
                    </div>
                    <span className="ml-auto type-figure">{src.value}</span>
                  </div>
                  <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-[var(--space-3)]">
                    <span className="type-data-strong">{src.status}</span>
                    <ConfidenceMeter agree={src.agree} total={src.total} />
                    {on && <Chip tone="primary" className="ml-auto">Selected</Chip>}
                  </div>
                </button>
              );
            })}
          </div>

          {chosen && (
            <div className="border-t border-hairline pt-[var(--space-4)]">
              <Label htmlFor="resolve-reason">
                Why {chosen.value}? <span className="text-label-secondary">(required)</span>
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
                className="mt-[var(--space-3)]"
              />
              <Button className="mt-[var(--space-4)]" disabled={!reason.trim()} onClick={commit}>
                Store {chosen.value} at the agency layer
              </Button>
            </div>
          )}

          <div className="border-t border-hairline pt-[var(--space-4)]">
            <div className="type-micro-caps text-label-tertiary">Where this value goes</div>
            <p className="mt-1 type-data-read text-label-secondary">
              The value you keep is what the directory shows, what a quote uses, and what the chat answers with.
            </p>
            <DataList className="mt-[var(--space-2)]" rows={commissionConflict.impact.map((row) => ({
              label: row.surface, value: <span className="type-data-strong tnum">{chosen ? chosen.value : row.value}</span>,
            }))} />
          </div>

          <div className="border-t border-hairline pt-[var(--space-4)]">
            <div className="type-micro-caps text-label-tertiary">The other fields</div>
            <DataList className="mt-[var(--space-2)]" rows={commissionConflict.otherFields.map((f) => ({
              label: f.label, value: <LayerBadge layer={f.layer} />,
            }))} />
            <p className="mt-[var(--space-2)] type-meta">Only commission is in dispute.</p>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/* Each layer says what it is, once, where it governs. */
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
  const search = useSearchParams();
  const [resolveOpen, setResolveOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(() => search?.get("compose") === "notice");
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
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
  const fieldsFor = (layer: Layer) =>
    leandreFields.filter(
      (f) =>
        f.layer === layer &&
        (money || f.key !== "commission") &&
        (s.role === "advisor" || f.key !== "note-rd")
    );

  const scopeLabel = { private: "private to " + people.advisor, team: "team · Paris desk", agency: "agency-wide" }[savedScope];
  const staleField = leandreFields.find((f) => f.state === "stale");
  const kept = keptSource(s.conflictChoice);

  /* Amenities: preview five, the rest behind the disclosure pattern (VIS-071). */
  const amenities = leandreContext.clientAmenities;
  const AMENITY_PREVIEW = 5;

  return (
    <Page width="wide">
      <PageHeader
        back="/records"
        crumb="Records / Hotel"
        title={<>Maison Léandre <Chip tone="neutral">Hotel · Paris 4e</Chip></>}
        actions={
          <>
            <Button variant="link" size="sm" onClick={() => setEditing((v) => !v)}>
              {editing ? "Done editing" : "Edit"}
            </Button>
            <Button variant="link" size="sm" onClick={() => setNoteOpen(true)}>Add note</Button>
            <Button variant="link" size="sm" onClick={() => setNoticeOpen(true)}>Add notice</Button>
          </>
        }
      >
        <RecordPlate p={p} />
      </PageHeader>

      <div className="doc-layout">
        {/* ── the body: chapters at column width ── */}
        <div className="min-w-0">
          <NarrationNote>
            The record is the model, inspectable — every value carries where it came from, how old it is, and which layer owns it. The conflict is seen here before it is felt in the conversation.
          </NarrationNote>

          <div className="space-y-[var(--space-2)] pb-[var(--gap-2)] empty:hidden">
            {s.world === "v2" && spaNotice && !s.spaNoticeClosed && (
              <SeverityBanner severity="Important">
                <div className="flex flex-wrap items-center gap-2">
                  <span><b>{spaNotice.text}</b> Opened {spaNotice.openedAt} · {spaNotice.scope} scope · {spaNotice.owner}</span>
                  <span className="ml-auto" />
                  {spaNotice.staleReviewDue && <Chip tone="warn">Still true? review due · {spaNotice.ageDays}d open</Chip>}
                </div>
              </SeverityBanner>
            )}
            <ConfirmBanner show={s.noteSaved}>Note saved — {scopeLabel} · attributed and dated.</ConfirmBanner>
            {editing && (
              <div className="rounded-lg bg-sunken px-[var(--space-4)] py-[var(--space-3)]">
                <div className="type-data-strong">Editing as {personName[s.role]}</div>
                <p className="mt-1 type-data-read text-label-secondary">
                  Canonical values belong to Enable. A change is stored above one, and the published value
                  stays readable underneath. Every change picks who it is for: just you, your team, or the
                  whole agency.{" "}
                  {scopeWrite(s.role, "agency") === "review"
                    ? `Agency-wide changes go to ${people.lead} for review before anyone else sees them.`
                    : "You can publish agency-wide changes directly."}
                </p>
              </div>
            )}
          </div>

          {groups.map((g) => (
            <Section key={g.layer} title={g.title}>
              <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data-read text-label-secondary">{layerLede[g.layer]}</p>
              <div className="divide-y divide-hairline">
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

          <Section title="Amenities" deep>
            <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data-read text-label-secondary">What the client gets, and what the agency earns on it.</p>
            <div className="divide-y divide-hairline">
              <FieldGrid label="Facility copy">
                <p className="type-data-read italic text-label-secondary">“View Hotel — experience refined luxury…”</p>
                <Chip tone="warn" className="mt-1">template copy — needs editorial</Chip>
              </FieldGrid>
              <FieldGrid label="Client amenities">
                <Rows>
                  {amenities.slice(0, AMENITY_PREVIEW).map((a) => (
                    <Row key={a.slug}>
                      <span className="row-primary">{a.benefit}</span>
                      <span className="row-trailing type-code text-label-secondary">{a.slug}</span>
                    </Row>
                  ))}
                </Rows>
                {amenities.length > AMENITY_PREVIEW && (
                  <Button variant="secondary" size="sm" className="mt-[var(--space-3)]" onClick={() => setAmenitiesOpen(true)}>
                    Show all {amenities.length} amenities
                  </Button>
                )}
              </FieldGrid>
              {money && (
                <FieldGrid label="Agent terms">
                  {leandreContext.agentAmenities.map((a) => (
                    <p key={a.category} className="flex flex-wrap items-center gap-2 py-0.5">
                      <Chip tone="primary">{a.category}</Chip> <span className="tnum">{a.text}</span>
                    </p>
                  ))}
                </FieldGrid>
              )}
            </div>
          </Section>

          <Section title="Contacts" deep>
            <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data-read text-label-secondary">
              Rep firm of record · Corvin &amp; Wells — Paris account. Booked last by {leandreContext.whoBookedLast}.
            </p>
            <Rows>
              {leandreContext.contacts.map((c) => (
                <li key={c.name} className="py-[11px]">
                  <div className="row-grid !min-h-0 !py-0">
                    <span className="row-primary">
                      <span className="type-data-strong">{c.name}</span>
                      <span className="text-label-secondary"> · {c.role}</span>
                    </span>
                  </div>
                  {c.note && <div className="mt-0.5 type-meta">{c.note}</div>}
                </li>
              ))}
            </Rows>
          </Section>

          {money && promo && (
            <Section title="Active promotion" deep>
              <div className="type-data-strong">{promo.productName} — {promo.rate}</div>
              <p className="mt-1 type-meta">
                {promo.stacksWithBase ? "bonus — adds to base" : "override — replaces base"} · book by {promo.bookingWindowEnd} · travel by {promo.travelWindowEnd}
              </p>
              <Chip tone="warn" className="mt-[var(--space-2)] tnum">{promo.daysLeft} days left</Chip>
            </Section>
          )}

          {s.role === "lead" && (
            <Section title="Client intelligence" quiet deep>
              <p className="flex items-center gap-2 type-meta">
                <EyeOff className="size-[var(--icon-sm)] shrink-0" aria-hidden />
                {leandreContext.clientIntelligence.note}
              </p>
            </Section>
          )}
        </div>

        {/* ── the tool that follows you: everything unsettled, and the one action ── */}
        <aside className="doc-rail" data-rail-label="Summary">
          <Section variant="tool" follows title="Summary">
            <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-meta">What is unsettled about this record, before any of the detail.</p>
            <Rows>
              {money && (
                <Row>
                  <span className="row-primary">Commission</span>
                  <span className="row-trailing">
                    {s.conflictResolved
                      ? <Chip tone="ok">resolved · {kept.value}</Chip>
                      : <Chip tone="crit">3 sources disagree</Chip>}
                  </span>
                </Row>
              )}
              {staleField && (
                <Row>
                  <span className="row-primary">{staleField.label}</span>
                  <span className="row-trailing"><Chip tone="warn" className="tnum">{staleField.staleDays}d unverified</Chip></span>
                </Row>
              )}
              {s.world === "v2" && spaNotice && !s.spaNoticeClosed && (
                <Row>
                  <span className="row-primary">Notice open</span>
                  <span className="row-trailing"><Chip tone="warn" className="tnum">{spaNotice.ageDays}d</Chip></span>
                </Row>
              )}
              {money && promo && (
                <Row>
                  <span className="row-primary">Promotion</span>
                  <span className="row-trailing"><Chip tone="neutral" className="tnum">{promo.daysLeft} days left</Chip></span>
                </Row>
              )}
            </Rows>
            {money && !s.conflictResolved && (
              <div className="mt-[var(--space-4)]">
                <Button className="w-full" onClick={() => setResolveOpen(true)}>Resolve 3 sources</Button>
                <p className="mt-[var(--space-2)] text-center type-meta">The decision is stored at the agency layer with your reason.</p>
              </div>
            )}
          </Section>
        </aside>
      </div>

      <ResolveSheet open={resolveOpen} onOpenChange={setResolveOpen} />
      <EditFieldSheet field={editField} open={!!editField} onOpenChange={(v) => !v && setEditField(null)} />

      {/* ── all amenities: the sheet reuses the page's rows ── */}
      <Sheet open={amenitiesOpen} onOpenChange={setAmenitiesOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Client amenities</SheetTitle>
            <SheetDescription>{amenities.length} on file, from the partner programme.</SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-0">
            <Rows>
              {amenities.map((a) => (
                <Row key={a.slug}>
                  <span className="row-primary">{a.benefit}</span>
                  <span className="row-trailing type-code text-label-secondary">{a.slug}</span>
                </Row>
              ))}
            </Rows>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* ── note composer ── */}
      <Sheet open={noteOpen} onOpenChange={setNoteOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Add a note</SheetTitle>
            <SheetDescription>Attributed to {people.advisor}, dated today. The scope is chosen at creation.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <Textarea placeholder="What should the record remember?" aria-label="Note text" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <RadioGroup value={noteScope} onValueChange={(v) => setNoteScope(v as typeof noteScope)}>
              {([["private", "Private", `Only ${people.advisor}`], ["team", "Team", "Paris desk"], ["agency", "Agency-wide", "Every advisor"]] as const).map(([v, l, hint]) => (
                <div key={v} className="flex items-start gap-[var(--space-3)]">
                  <RadioGroupItem value={v} id={`scope-${v}`} className="mt-px" />
                  <Label htmlFor={`scope-${v}`} className="flex flex-col items-start gap-0.5">
                    <span className="type-data">{l}</span>
                    <span className="type-meta font-normal">{hint}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Button onClick={() => { setSavedScope(noteScope); d({ type: "saveNote" }); setNoteOpen(false); }}>Save note</Button>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* ── notice composer (schematic) ── */}
      <Sheet open={noticeOpen} onOpenChange={setNoticeOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">Add a notice <SchematicBadge /></SheetTitle>
            <SheetDescription>A notice carries a severity, a scope, and an owner. It stays open until someone closes it.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <Textarea placeholder="What changed at the property?" aria-label="Notice text" />
            <div>
              <div className="mb-[var(--space-2)] type-micro-caps text-label-tertiary">Severity</div>
              <div className="flex gap-2">
                <Chip tone="neutral">Info</Chip><Chip tone="warn">Important</Chip><Chip tone="crit">Critical</Chip>
              </div>
            </div>
            <div>
              <div className="mb-[var(--space-2)] type-micro-caps text-label-tertiary">Scope</div>
              <div className="flex gap-2">
                <Chip tone="neutral">Personal</Chip><Chip tone="neutral">Team</Chip><Chip tone="primary">Agency</Chip>
              </div>
            </div>
            <Button variant="secondary">Submit for review</Button>
          </SheetBody>
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
            <ProvenancePopover source={f.source}><span className="type-data-strong tnum">{kept.value}</span></ProvenancePopover>
            <Chip tone="ok">resolved</Chip>
            <span className="type-meta">agency layer · {kept.label} · by {people.advisor} today · both other sources reachable</span>
            {reason && <span className="basis-full type-meta">Reason: “{reason}”</span>}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {commissionConflict.sources.map((src) => (
                <span key={src.id} className="rounded-md border border-hairline px-2 py-1 type-data">
                  <b className="tnum">{src.value}</b> <span className="text-label-secondary">{src.label} · {src.when}</span>
                </span>
              ))}
            </div>
            {/* The decision is reachable from the field, as a secondary; the one
                primary lives in the Summary, the tool that owns it (VIS-072). */}
            <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-2">
              <Chip tone="crit">3 sources disagree</Chip>
              <Button variant="secondary" size="sm" onClick={onResolve}>Resolve 3 sources</Button>
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
              f.state === "template" && "italic text-label-secondary",
              edit && !edit.pending && "line-through text-label-secondary",
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

      {editing && onEdit && (
        <Button variant="secondary" size="sm" className="mt-[var(--space-2)]" onClick={onEdit}>
          {edit ? "Change again" : "Edit"}
        </Button>
      )}

      {f.state === "stale" && !verified && (
        <Button variant="secondary" size="sm" className="mt-[var(--space-2)]" onClick={() => setVerified(true)}>
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

/* ── the field row's shape: label · value · provenance on one shared track ── */
function FieldGrid({
  label, provenance, children,
}: { label: string; provenance?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="field-row">
      <div className="type-data text-label-secondary">{label}</div>
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

      <div className="doc-layout">
        <div className="min-w-0">
          <div className="pb-[var(--gap-2)]">
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
          </div>

          <Section title="The record">
            {p.blurb && <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data-read text-label-secondary">{p.blurb}</p>}
            <dl className="divide-y divide-hairline type-data">
              <DlRow k="City">{p.city}, {p.country}</DlRow>
              <DlRow k="Tier">{p.luxuryTier}</DlRow>
              <DlRow k="Rooms" tnum>{p.rooms}</DlRow>
              <DlRow k="Programme">{p.programs.join(" · ")}</DlRow>
              <DlRow k="Rep firm">{p.repFirm}</DlRow>
              {money && <DlRow k="Commission" tnum>{p.rate}</DlRow>}
              <DlRow k="Style">{p.tags?.join(" · ")}</DlRow>
            </dl>
            <div className="mt-[var(--space-3)] flex items-center gap-[var(--space-3)] border-t border-hairline pt-[var(--space-3)]">
              <EvidenceDot kind="verified" label={p.evidence.label} />
              <FreshnessDate>updated {p.updated}</FreshnessDate>
            </div>
          </Section>

          <Section title="Open notices" deep>
            <div className="space-y-[var(--space-3)]">
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
        </div>

        <aside className="doc-rail" data-rail-label="Use in itineraries">
          <Section variant="tool" follows title="Use in itineraries">
            <p className="-mt-[var(--space-2)] type-data-read text-label-secondary">
              A Critical notice blocks shortlist and proposal use until it is acknowledged. Dismissing the notice is not an acknowledgment.
            </p>
            <div className="mt-[var(--space-4)] flex flex-wrap items-center gap-[var(--space-2)]">
              <Button className="w-full" onClick={onShortlist} disabled={added}>
                Add to itinerary shortlist
              </Button>
              {added && <Chip tone="ok">on the shortlist</Chip>}
            </div>
          </Section>
        </aside>
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
            <Button variant="secondary" onClick={() => setDlgOpen(false)}>Close</Button>
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
          <p className="type-data-read text-label-secondary">
            No record carries this id. A missing property can be requested from the directory — the extraction pipeline creates a candidate for review.
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-[var(--space-3)]">
            <Link href="/records">Back to records <ArrowRight aria-hidden /></Link>
          </Button>
        </Section>
      </Page>
    );
  }

  if (p.id === "sereno-kyoto" && !s.candidateConfirmed && !reviewer) {
    return (
      <Page width="wide">
        <PageHeader back="/records" crumb="Records" title="Awaiting confirmation" />
        <Section>
          <p className="type-data-read text-label-secondary">
            This candidate arrived from a DMC spreadsheet and has not been confirmed. It does not answer
            questions and it is not offered to a client until a reviewer has been through it field by field.
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-[var(--space-3)]">
            <Link href="/records">Back to records <ArrowRight aria-hidden /></Link>
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

      <div className="doc-layout">
        <div className="min-w-0">
          {productNotices.length > 0 && (
            <div className="space-y-[var(--space-2)] pb-[var(--gap-2)]">
              {productNotices.map((n) => (
                <SeverityBanner key={n.id} severity={n.severity}>
                  <div>{n.text}</div>
                  <div className="mt-1 type-meta">
                    Opened {n.openedAt} · {n.scope} scope · {n.owner} · <span className="tnum">{n.ageDays}d</span> open
                  </div>
                </SeverityBanner>
              ))}
            </div>
          )}

          <Section title="The record">
            {p.blurb && <p className="-mt-[var(--space-2)] mb-[var(--space-2)] type-data-read text-label-secondary">{p.blurb}</p>}
            <dl className="divide-y divide-hairline type-data">
              <DlRow k="Location">{p.city}{p.country !== "—" ? `, ${p.country}` : ""} · {p.region}</DlRow>
              <DlRow k="Tier">{p.luxuryTier}</DlRow>
              {p.brand && <DlRow k="Brand">{p.brand}</DlRow>}
              {p.address && <DlRow k="Address">{p.address}</DlRow>}
              {p.rooms !== undefined && <DlRow k="Rooms" tnum>{p.rooms}</DlRow>}
              <DlRow k="Status">
                {p.status === "Active" ? "Active" : <Chip tone="warn">{p.status}</Chip>}
              </DlRow>
              {p.repFirm && <DlRow k="Rep firm">{p.repFirm}</DlRow>}
              {money && p.rate !== "—" && <DlRow k="Commission" tnum>{p.rate}</DlRow>}
            </dl>
          </Section>

          <Section title="Programmes and consortia" deep>
            <div className="flex flex-wrap gap-2">
              {p.programs.map((pr) => <Chip key={pr} tone="primary">{pr}</Chip>)}
              {p.consortia.map((c) => <Chip key={c} tone="neutral">{c}</Chip>)}
              {p.programs.length === 0 && p.consortia.length === 0 && (
                <p className="type-data-read text-label-secondary">
                  No programme or consortium membership on file.
                </p>
              )}
            </div>
            {p.tags && p.tags.length > 0 && (
              <p className="mt-[var(--space-3)] border-t border-hairline pt-[var(--space-3)] type-data">
                <span className="text-label-secondary">Style · </span>{p.tags.join(" · ")}
              </p>
            )}
          </Section>

          {money && productPromo && (
            <Section title="Active promotion" deep>
              <div className="type-data-strong">{productPromo.rate}</div>
              <p className="mt-1 type-meta">
                {productPromo.stacksWithBase ? "bonus — adds to base" : "override — replaces base"} · book by {productPromo.bookingWindowEnd} · travel by {productPromo.travelWindowEnd}
              </p>
              <Chip tone="warn" className="mt-[var(--space-2)] tnum">{productPromo.daysLeft} days left</Chip>
            </Section>
          )}
        </div>

        <aside className="doc-rail" data-rail-label="Evidence">
          <Section variant="tool" follows title="Evidence">
            <div className="space-y-[var(--space-2)] type-data">
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
        </aside>
      </div>
    </Page>
  );
}

/* The same track as FieldGrid, in description-list markup. */
function DlRow({ k, children, tnum }: { k: string; children: ReactNode; tnum?: boolean }) {
  return (
    <div className="field-row">
      <dt className="type-data text-label-secondary">{k}</dt>
      <dd className={cn("min-w-0 type-data", tnum && "tnum")}>{children}</dd>
    </div>
  );
}
