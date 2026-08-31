# Data model — metadata index per object

Condensed from the production Database Schema (v3.1 era, Apr 2026). This is the entity contract the analogue's seed data, display system (`entity-display.md`), and prototype build follow. Terminology per the Enable Taxonomy.

## Ownership levels

| Level | Entities | Key |
|---|---|---|
| **Enable (shared)** | Product, Brand, Category | none — canonical across agencies |
| **Agency** | Partner Program, Linked Product, Promotion, Rep Firm, Rep Firm↔Product, Agency Contact | `agency_id` |
| **Advisor** | Advisor Note, VIC, Itinerary | `advisor_id` (+`agency_id`); private by default → team scope (union across teams) → agency directory (opt-in, admin-managed) |

## Object index

### Product (Enable-shared)
- **Identity:** name (dedup anchor) · aliases · category (9: Hotel/DMC/Restaurant/Cruise/Villa/Experience/Transfer/Yacht/Other) · subcategory · directory_product_type (multi) · product_scope (brand/property/sub_property/collection/standalone) · parent_product_id (relational, not ownership) · status (Active/Coming Soon/Closed/Suspended)
- **Brand/grouping:** brand · group_brand · network_consortia (Virtuoso, Signature, Ensemble, FHR)
- **Geo:** country/region/city/address · lat/lng (50m proximity = dedup signal) · **google_place_id (strongest dedup signal; strict unique when present)**
- **Content:** description · website (domain = dedup signal) · instagram · image_url_1..6 · amenities (freeform JSONB — facility features, distinct from program amenities) · policies
- **Ratings:** luxury_tier (Ultra-Luxury/Luxury/Premium/Boutique) · star_rating · michelin_stars · archetypes (curation engine) · quality_score + scored_date
- **Operational:** opening_date · inventory_volume · tripsuite_id · source/source_link
- **Identity tuple:** (workspace, google_place_id) when present; else (workspace, scope, name, city, country)

### Brand (Enable-shared) — ~992 rows
name (dedup anchor) · group_brand · category · description/website/logo. Tuple: (workspace, name). Orphans resolved by trigram.

### Category (Enable-shared) — 9 rows
name · slug · icon · default_subcategories.

### Partner Program (agency)
- **Identity:** partner_program_name · group_network_name · program_type (consortium/brand_pp/consortium_collection/card_program) · program_scope (umbrella/base/enhanced/promo/standalone) + parent_program_id (true parent-child) · gds_code (hard match) 
- **Lifecycle:** status (active/expiring/expired/paused) · agreement_start/renewal_date
- **Commissions:** commission_rate_standard XOR commission_tiers[{tier_name, scope, rate, minimum_nights, notes}] · commission_rate_notes · credit_amount
- **Amenities (renamed Apr 29):** `client_amenities` (JSONB, 45-slug vocabulary — what the VIC gets) · `agent_amenities` (text, 8 categories — what the advisor gets)
- **Booking:** booking_channels · instructions/requirements · portal_url/registration_url · T&C
- **Provenance:** source_file (URI schemes: claromentis:// gdrive:// email:// axus:// tripsuite:// virtuoso://) · source_snippet
- **Tuple:** (agency, program_type, network, name). Temporary incentives never become programs → Promotion.

### Linked Product (agency junction: Product↔Program)
Per-property overrides: tier · commission_rate/type/currency · credit_amount · client_amenities/agent_amenities/amenities_tags overrides · booking overrides · per-link contact · status (active/expiring/expired) · effective_from/expires_at · **last_verified** (staleness). Tuple: (agency, product, program).

### Promotion (agency)
Time-bound boost with **two windows**: booking_window vs travel_window. type (rate_override/bonus/seasonal/volume_incentive) · rate_value/rate_type · **stacks_with_base** (bonus adds, override replaces) · volume threshold/metric/retroactive · eligibility_notes · status (upcoming/active/expired). Child of a Program, scoped to product_ids or "all".

### Rep Firm (agency) + Rep Firm↔Product junction
Firm: name · representative_names[] · specialty · regions_covered[] · portal_url/credentials note · contacts · relationship_owner (single advisor) · status (active/inactive/prospect). Tuple: (agency, name); website domain is the strongest match signal.
Junction: relationship_type (represents/exclusive/regional rep) · market · product_name_raw preserved · **match_confidence + match_status (matched/unmatched/ambiguous)**.

### Agency Contact (agency)
Replaces legacy contact slots. Per product, N contacts: name · role (GM/Reservations/Commission/Sales) · email/phone · contact_note ("mention the agency"). Full provenance.

### Advisor Note (advisor)
entity_type (product/program/destination/general) + entity link · note_text · note_category (preference/tip/warning/contact/general) · personal_rating (1–5, private) · **shared_to_agency (boolean opt-in)** · provenance.

### VIC (advisor)
- **Sharing model (supersedes the Mar 31 all-or-nothing decision — the documented revisit trigger fired):** Owner (full rights) · **Collaborator Full** (all fields incl. sensitive, can edit + run Acuity, cannot re-share/delete) · **Collaborator Basic** (name + contact only) · team scope (union across teams) · agency directory (opt-in, admin-managed). Non-admin sharing routes through a suggestion/approval workflow. **Policy gates:** `canViewCommissions` hides spend/value fields; `canRunAcuity` locks the Acuity tab.
- **Identity:** full_name (required) · preferred_name · title · 2×email, 2×phone · preferred_contact_method · company/role · nationality · DOB + address (encrypted) · city/country/timezone/languages · avatar
- **Relationship:** agency/assigned_advisor/secondary_advisor · client_since · referral_source/referred_by_vic · relationship_status (Prospect/Recurring/Referred/Active/Inactive) · tags/context notes · activity_timeline
- **Preferences: 7 profile types** (Business/Leisure/Romantic/Adventure/Wellness/Cultural/Celebration), each with 6 blocks (Accommodation, Dining, Activities, Travel style, Destinations, Occasions) + **ai_confidence per preference (0–1)** + is_primary flag
- **Documents:** passport (encrypted, masked) + expiry alerts · KTN · loyalty_programs[] · secure IDs
- **Acuity:** status (Not Run/Running/Complete/Locked) · last_run · profile (markdown) · score (0–100 badge)
- **Links:** linked_product_ids[] · linked_itinerary_ids[] · linked_documents[] · linked_conversations[]

### Itinerary (advisor)
- **Meta:** title · status pipeline (Inbound/Planning/Booked/Traveling/Traveled/Cancelled/Archived — Trips kanban) · client_vic_id (the core link) · additional_travelers[] · dates · destinations[] · trip_type (Individual/Group) · version/published_at/slug (stable client URL) · allow_pdf_downloads · pricing_visibility
- **Day:** date · location · events[] · day_note
- **Event (5 types):** Accommodation (room options, selected_by_client_at) / Experience / Transfer (live flight data) / Dining / Note. Common: title/type/status (Draft/Booked/Confirmed/Cancelled) · times/location · **source_product_id (the key cross-link)** · commission (derived, gated) · cost · supplier/confirmation_number
- **Provenance:** source_platform (access/axus/travify/safari_portal/tripsuite/manual) · source_record_id · last_synced_at

## The cross-link triangle (VIC ↔ Itinerary ↔ Product)
VIC→Products ("Preferred Products" block) · VIC→Itineraries (travel history) · Event→Product (mini product card + commission) · reverse Product→VICs ("Client Intelligence", **gated by the VIC's own sharing**) · Product→Programs (Linked Product → commission display) · Product→Rep Firms (contact routing).

## Infrastructure objects
- **dedup_candidates:** incoming_payload · target_table · matched_row_id · similarity_score · match_signals ({name_sim: .92, phone_match: true}) · status (pending/approved/rejected/merged) · field_decisions (per-field admin audit). **Products: admin review on every candidate for the first ~3 months, including exact google_place_id matches. Programs/Promotions: admin-only indefinitely** — commercial-impact fields always route through the admin inbox.
- **extraction_log:** every field write — run id · source_file (URI) · target · field_name · old/new value · source_snippet · confidence · status (applied/skipped_existing/needs_review). Field-level provenance queryable from admin UI: any commission number traces to a document line.

## Value sets (display-relevant)
- **client_amenities:** 45 slugs / 7 categories + custom_other (locked v1.0, 2026-04-07; revision trigger: custom_other >15% on any program). Shape: {slug, benefit, amount, currency, applies_to, source_snippet}.
- **agent_amenities:** 8 durable categories, free-text values (values too varied to enumerate).
- Status enums per entity as listed above; match_status: matched/unmatched/ambiguous.
