# Design-system inventory — derived from journeys, interactions, and the data contract

**Method:** every entry cites its demand source — journey step (A-4.2), data-contract field (`data-model.md`), plate pattern (plate-audit §1), or demo beat. A component with no demand source doesn't get built. Base kit: shadcn/ui (new-york) + Lucide; anything not listed as an atom is composed, not installed.

**Rev 2 (2026-08-28):** patched per `evals/reports/2026-08-28-ds-inventory-completeness.md` (2 High, 10 Medium, 8 Low, 3 over-inventory — all dispositioned). Headline decisions: **CommissionCalendar ships as a schematic agenda list grouped by date, not a month grid**; **390px named transforms (bottom sheets) apply to the demo-visited screens (briefing, ask, records/record, traveller); all other surfaces owe only no-horizontal-scroll** — this is the declared cut the acceptance criteria inherit.

---

## 0. Foundations

| Token group | Values | Demand |
|---|---|---|
| Neutrals | background, sidebar `#FAFAFA`, card, subtle, muted, border | plates |
| Accent | primary indigo `#5B5BD6` + soft | plates |
| **Semantic trust set** (separate from accent) | ok/ok-soft (verified), warn/warn-soft (stale, Important, conflict-adjacent), crit/crit-soft (Critical, disagree, held), neutral-open (refusal — a refusal is NOT an error: rendered calm, not red) | A-U2, DEC-18, plate refusal |
| Type | Inter (UI), mono stack (ids, provenance, kbd); scale: 24 page title / 15 section / 13.5 body / 12 meta / 11 mono-label; `tabular-nums` on all money and counts | plates, class practice |
| Spacing/radius | 4px grid; radius 8 card / 6 control / full chip | plates |
| Elevation | border-first; shadow only on overlays + hover-lift on cards | plates |
| Motion | 120–180ms ease; rail slide; reduced-motion kills all | wireframe |
| Grid | app frame 232 nav / fluid main (max 980) / 380 rail; 390px phone stack | plates, E resp. |

## 1. Icon inventory (Lucide)

**Nav (8):** Sunrise (briefing — morning identity; House stays free for villa) · MessageCircle (ask) · LayoutGrid (records) · Route (itineraries) · Users (travellers) · Archive (knowledge) · SlidersHorizontal (settings) · Inbox (review queues)
**Categories (9, `Category.icon`):** Bed hotel · Handshake DMC · UtensilsCrossed restaurant · Ship cruise · House villa · Compass experience · CarFront transfer · Sailboat yacht · Box other
**Event types (5, Itinerary):** Bed · Compass · Plane/CarFront · UtensilsCrossed · StickyNote
**Trust/state (10):** CheckCircle2 verified · Clock stale/freshness · AlertTriangle warn · OctagonAlert critical · XCircle contract-fail · CircleDashed held/unconfirmed · Scale conflict · ShieldCheck permission-clean · Sparkles AI-suggestion/Acuity · BadgeCheck attributed
**Provenance sources (URI schemes, data-model "Value sets"):** FileText intranet-doc · HardDrive gdrive · Mail email · Route axus/access/travify/safari_portal (external itinerary platforms share one mark) · Database tripsuite/booking · Globe portal/virtuoso · PenLine manual/keyed
**Governance (7):** Lock private · Users2 team · Building2 agency · Share2 share · History audit · ShieldAlert break-glass · EyeOff **admin-only-note marker ONLY** — gated content renders nothing (GateMark rule); never a masked placeholder
**Money (3):** BadgePercent commission/incentive · CircleDollarSign amount · CalendarDays windows/calendar (TrendingUp dropped — timeline states are words per DEC-22)
**Actions/chrome (19):** Search, Command, Plus, X, Check, ChevronRight/Down, ArrowRight, ExternalLink, Copy, Filter, ArrowUpDown, MoreHorizontal, **Loader2** (button loading, Acuity Running, answer building), **Info** (Info severity mark), **Pencil** (edit field, candidate fix), **Paperclip** (attached source doc, B-EP3), **Upload** (vault upload, D-EP2); Download (export) and Columns2 (compare) exist but their flows are §6-schematic — do not build Compare because the icon exists
**Presenter (4):** Keyboard (rail) · Presentation (narration) · RefreshCw (reset/sync) · FlaskConical (schematic badge)
**Integration health (3):** RefreshCw syncing · WifiOff down · KeyRound credentials

## 2. Atoms

| Atom | Variants / states | Demand | Base |
|---|---|---|---|
| Button | primary (commit only), outline, quiet, destructive; loading | plate-audit hierarchy fix | shadcn button |
| Chip | neutral, ok, warn, crit, primary-soft; with-icon; removable (filter) | evidence states, filters | badge |
| **StatusChip** | one per enum in `data-model.md` "Value sets" (Product, Program, LinkedProduct, Promotion, RepFirm, VIC, Itinerary, Event, Acuity, match_status, **dedup_candidates.status** pending/approved/rejected/merged, **extraction_log.status** applied/skipped_existing/needs_review) — words + color, never color alone | DEC contract | badge |
| **MoneyValue** | plain / **dual-currency** (source + workspace alongside) / conversion-dated / **held** (converted figure without source currency) — never silent conversion | A-E3, D-U7, C-U3, SIG-38 | custom |
| **Breadcrumb** | every screen | plate-audit §1.1, wireframe | add: breadcrumb |
| **ConfirmBanner** | transient ok-soft success feedback (sent / created / shared / confirmed / resolved / request filed) — distinct from NoticeBanner (an advisory object) | demo beats 2/3/6b/7; wireframe ×8 | custom or sonner |
| **EvidenceDot** | verified / stale-Nd / disagree / incentive / no-source | directory Evidence column | custom |
| **LayerBadge** | canonical (green) / agency (indigo) / personal (gray) — dot + word | DEC-08, conflict rail | custom |
| **FreshnessDate** | "verified Mar" / "96d unverified" — a date, never an icon alone | entity-display | custom |
| **ConfidenceMeter** | 0–1 inline bar ("3 of 4 sources agree") | conflict plate, ai_confidence | custom |
| **SourceTag** | icon + label from provenance URI scheme | DEC-35 | custom |
| Kbd | presenter shortcuts | choreography | custom |
| Avatar/initials | traveller, actor attribution | plates | shadcn avatar |
| Skeleton | ask loading, widget loading | A-X1, C-X2 | shadcn skeleton |
| ProgressBar | verified-records meter, vault 71% | briefing, vault | add: progress |
| **SchematicBadge** | "schematic" corner tag on wireframe-fidelity surfaces | build-scope decision | custom |
| **GateMark** | absence renderer: gated content renders nothing + optional admin-only note; never a masked placeholder | canViewCommissions, U-rules | custom (convention + component) |
| Tooltip, Separator, ScrollArea | — | — | shadcn |
| **NarrationNote** | presenter-overlay-only callout block, hidden in product mode | narration decision | custom |

**shadcn still to add:** `popover, radio-group, select, textarea, checkbox, switch, command, progress, label, breadcrumb`.

## 3. Molecules

| Molecule | Composition / states | Demand |
|---|---|---|
| **FieldRow** | label · value · SourceTag · FreshnessDate · LayerBadge; states: normal / conflict / stale+verify / template-copy / edited-overlay (canonical beneath) | E anatomy, DEC-08/23 |
| **ProvenancePopover** | what (snippet) / where (source_file) / when + "open document" (permission-checked) | DEC-23/35, plate "view excerpt" |
| **ConflictValueRow** | source · date · value · ConfidenceMeter · "view excerpt" · **Keep this value** (auto-attributed; reason optional) | conflict plate, DEC-02 |
| **ImpactPanel** ("Where this value goes") | directory row / quotes / answers — one decision, N places | conflict plate (adopt) |
| **ContractChecklist** | Sources ✓ / Freshness ✗ / Corroboration ✗ per-clause rows | refusal plate, A-2 |
| **HeldSourcePanel** | source card + age + "visible here, excluded from answer" | refusal plate (adopt) |
| **CitationMark + SourceCard** | numbered cite → quoted extract, date, scope; permission-filtered absent | A-4.4, A-U4 |
| **TraceLine** | retrieval order internal → curated → external, per-stage state (done / pending / **failed-timeout** with retry) | A-4.2, A-X1, DEC-16 |
| **NoticeBanner** | severity (Info/Important/Critical) · text · owner/date · stale flag · **ended-pending-close** (commercial end date passed, closure still manual) · actions (still true? / close / **acknowledge** for Critical-with-gate) | DEC-18/03, B-E1/B12 |
| **IncentiveRow** | rate + `stacks_with_base` as words · **booking window · travel window** · days-left chip · **ended** variant (stops feeding projections) · affected-client sheet off the row | DEC-32, C-4.6/C4, B-E1 |
| **DepartureChecklist** | n/m progress + item rows; lives on briefing departures, traveller card chip, profile header | C-4.5, F-4.1/F1, beat 6b |
| **CopyExportMenu** | advisor copy (keeps provenance footer) / client export (strips internal reasoning) | A-4.6, A-AC, DEC-05 |
| **AmenityBlock** | three variants kept visually distinct: facility (freeform `amenities`) / **client** (45-slug grouped by 7 categories, {slug, benefit, amount, currency}) / **agent** (8 categories, free text) | DEC-34, entity-display full page, plate-audit §4 |
| **HistoryList** | generalized audit/history rows: field history (D-U1), notice lifecycle, rename history (E-E1), share intervals (F-U4), admin break-glass (DEC-29) | four demands + admin plate |
| **TimelineStep** | projected (rate provenance + incentive) → due → paid/chased; discrepancy flag inline | DEC-22, C |
| **DiscrepancyFlag** | both values + provenances + accept-with-reason / dispute-draft | C-U3, SIG-38 |
| **MatchSignalReadout** | similarity 0.92 · signals list (name_sim, phone, place_id) | DEC-33, dedup_candidates |
| **CandidateFieldRow** | value · snippet · confidence · confirm ✓ / fix / hold; held + template + **diff** (old-confirmed vs new-incoming, re-ingestion) states | D-4.4/D-E2, extraction_log |
| **ScopeSelector** | Private (default) / Team / Agency-wide — one component reused for notes, notices, uploads | SIG-46, wireframe fix 7 |
| **ShareTierSelector** | Collaborator Full / Basic / team / directory + approval-workflow note | DEC-31 |
| **PreferenceCard** | text · SourceTag+date · corroboration ("3 sources") · ai_confidence · confirm-this state | traveller plate, DEC-28/36 |
| **SuggestionCard** | Sparkles-labeled, confirm→preference / discard | F-U3 |
| **PrefConflictBanner** | warn-not-block + "why the warning appeared" + swap offer | DEC-27, itinerary plate |
| **AuditRow** | actor · action · reason · time-bound · logged marker | DEC-29, admin plate |
| **AccessChip + WideningHistory** | private/team·desk/agency/admin-only/processing + "MK widened team→agency · logged" | vault plate |
| **StatTile** | headline number + delta/meta (briefing headline, vault 71%) | C-4.1 |
| **FilterChipBar + BulkBar** | applied filters ×-removable; N selected · add-to-list / compare / export | directory plate |
| **TabSet** | ONE segmented style with counts (Hotels 209…) — resolves plate drift | plate-audit U6 |
| **HealthRow** | connector · last-success · state (ok/syncing/down/credentials) | DEC-24, D |
| **AcuityPanel** | 4-state machine: Not Run (CTA, gated) / Running / Complete (score badge + report) / Locked | DEC-36 |
| **EmptyState / ErrorState / SyncPendingLabel** | per-surface guided empty; gap note "unreachable since…"; "last synced · up to 48h" | U5s, X-rules, SIG-36 |
| **PersonaSwitcher / WorldToggle** | advisor **· colleague (J.D. — the second seeded account proving scope isolation)** · lead · ops / v1 Mar·v2 current | demo machinery; B-U3/E-AC/F-AC second-account proofs |
| **CommandPalette (⌘K)** | records + travellers + ask handoff; stub-depth | A-EP2/E-EP2 |

## 4. Organisms

| Organism | Contains | Demand |
|---|---|---|
| **AppShell** | nav (3 groups, persona-gated, counts) · topbar (⌘K, world, persona) · contextual footer (Synced/Saved/Policy saved) | plates |
| **QuickLookRail** | entity header · chips · compressed layer groups · context intel · actions (open full / ask) | wireframe pattern |
| **DirectoryTable** | TabSet · FilterChipBar · BulkBar · rows (name/meta, program chips, rate tnum, EvidenceDot) · verified footer | directory plate |
| **RecordCardGrid** | entity cards (name / meta / chips / foot: fact + freshness + layer dots) | wireframe, entity-display |
| **RecordFullPage** | notice banners · 3 layer groups of FieldRows · cross-links (rep firm, contacts, promotions, client-intelligence gated) · composers (note, edit, notice) · actions | E |
| **AskThread** | question · TraceLine · answer with cites · contract chip · conflict block · refusal block · follow-ups · states (loading/timeout/empty/stale) | A |
| **ConflictResolver** | full-screen: ConflictValueRows + ImpactPanel + other-fields layer list | conflict plate |
| **BriefingBoard** | StatTile · commissions widget · departures widget · notices widget · incentives widget · verified-progress · cancellation alert; per-widget failure isolation | C |
| **CommissionDetail** | TimelineStep chain · DiscrepancyFlag · reminder composer (draft→edit→send→chased) | C |
| **ResolutionQueue** | orphaned rows · match sheet (candidates + reason) | C-U1 |
| **NoticeComposer / StaleReviewQueue / PublishQueue** | severity+scope+source; oldest-first confirm/close; lead review→publish | B |
| **CandidateReview** | queue rows · candidate card (MatchSignalReadout + CandidateFieldRows + merge sheet + reject) · confirm with held-excluded summary | D |
| **TravellerProfile** | header (departure + DepartureChecklist) · profile-type tabs · PreferenceCards · SuggestionCards · share sheet · AcuityPanel · gated financials · **trip-history rows (VIC→Itineraries cross-link)** · passport/loyalty (schematic) · request-access EmptyState CTA for the unshared case (owner sees the request as a briefing item) | F, DEC-36, F-U2/F4 |
| **CommissionCalendar** | **schematic agenda list grouped by date** (due dates, incentive expiries, window closes) — deliberately NOT a month grid; C-EP3 deep-links from rows | C-EP3, DEC-22, build-scope decision |
| **RepFirmQuickLook** | QuickLookRail variant: firm · regions · named contacts · represented-properties list ("all properties this firm represents in the Indian Ocean") | E-E3, DEC-26, directory Rep firms tab |
| **VaultTable** | doc rows (source, updated, AccessChip) · rail (verified meter, doc detail, WideningHistory) | vault plate |
| **AdminPolicy** | per-record-kind defaults · break-glass AuditRows | admin plate |
| **ItineraryDay** | day tabs · 5 event types · program/incentive chips · PrefConflictBanner · add-from-records rail (verified-first) — schematic-badged | itinerary plate |
| **PresenterLayer** | bottom rail (checkpoints 1–8, 0 reset, kbd) · narration overlay toggle (N) · spec-chip toggle | choreography |
| **Sheet/Dialog system** | right sheet (composers), centered dialog (ack gate) | B-U2 etc. |

## 5. Layouts

1. **AppFrame** — nav / main / optional rail; footer status.
2. **MasterDetail** — directory (table or grid) + QuickLookRail; selection preserved.
3. **FullRecord** — main column (max 980) + context rail 380.
4. **Thread** — centered 620–720 conversation + sources rail.
5. **QueueTable** — full-width triage rows + row-level actions (queues stay rows).
6. **SettingsForm** — labeled sections + policy rail.
7. **OverlaySheet** — right 420; dialog for gates.
8. **PhoneStack (390)** — nav→bottom/sheet, rail→bottom sheet, widgets stack. **Scope (declared cut):** full named transforms on demo-visited screens only — briefing, ask (source panel → bottom sheet), records/record (layer groups stack, ProvenancePopover → bottom sheet, QuickLookRail → bottom sheet), traveller. All other surfaces owe no-horizontal-scroll only; their journey acceptance criteria inherit this cut.
9. **PresenterLayer** — fixed bottom, above all, never overlaps footer status.

## 6. Known deliberate exclusions

Dark theme (light-committed like the plates) · real ⌘K search index (stubbed results) · Compare/Export flows (schematic) · drag-and-drop uploads (button + inbound address instead) · charts beyond bar/progress (dataviz not demo-load-bearing) · month-grid calendar (CommissionCalendar is an agenda list by decision) · 390px named transforms outside demo screens (declared cut, see Layout 8).
