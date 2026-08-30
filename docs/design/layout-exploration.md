# App layout exploration — the dock, and what follows from it

**Status:** thinking, not decided. Written to be argued with.
**Prompted by:** review 01 — move from a left vertical menu to a fixed bottom dock of square icons; each surface gets a proper layout of its own.

---

## 1. The dock is a thesis, not a nav pattern

A left rail says *this application has sections.* A dock says *these are workspaces you move between all day.* That second claim is the truer description of this product, and it is already in the source material — the engagement's own weekly synthesis landed on it:

> "…isn't building a booking tool — it's building the operating system for a lifestyle advisory practice, where the advisor's judgment, relationships and firsthand experience are the product."

If the product is an operating layer for a working day, an OS-shaped navigation is an argument, not a decoration. That matters for the room: a panel that has seen a hundred left-rail dashboards will ask *why this?* — and "because the product is a desk, not a website" is an answer with evidence behind it.

**The honest counter-risk.** Bottom docks are rare in enterprise data tools (Linear, Notion, Retool, every consortium portal in this domain: left rail). Rare reads as *considered* when it is justified and *gimmicky* when it isn't. The justification has to be visible in how the dock behaves, not just where it sits — see §4.

## 2. What the dock buys and what it costs

**Buys**

- **Full horizontal width for data.** The left rail costs 232px — roughly 15–20% of a laptop viewport, permanently, on every screen. Records tables, comparison views and the three-layer record anatomy all want that width. The briefing widget grid goes from 2 columns to 3–4.
- **One navigation model across desktop and phone.** A bottom dock *is* the native mobile pattern. The 390px story stops being a translation of a desktop idea and becomes the same idea at a different size — that removes a whole class of responsive work and makes the phone beat coherent instead of apologetic.
- **A natural home for "what needs you."** Dock icons can carry badge counts (notices due, unconfirmed records, unmatched payments). The dock becomes the standing answer to *is anything waiting for me* — which is this product's whole proposition.
- **Role-scoping becomes visible.** Signing in as ops yields a two-icon dock. The permission story stops being an argument and becomes something you can see at a glance.

**Costs**

- **~72px of vertical, permanently.** On a 900px viewport that's 8%, and tables lose rows. Partly repaid by dropping the top bar (§5).
- **Icon ambiguity.** "Records" and "Knowledge" are not universally legible as glyphs. Enterprise tools carry labels for a reason (§4).
- **Capacity.** A dock stays comfortable at 5–7 items. Our surface count per persona: advisor 7, agency lead 6, ops 2 — workable, but it forces a decision about where governance and settings live (§6).

## 3. The collision nobody has solved yet: Ask's composer

Two things now want the bottom edge: a fixed dock, and the sticky conversation composer from review 01. Options:

| | Approach | Reading |
|---|---|---|
| A | Composer floats above the dock, constant gap | Honest, simple; ~150px of bottom furniture; composer must stay one line until focused |
| B | Dock collapses to a thin bar while Ask is focused | Elegant, contextual; inconsistent nav is a real cost |
| C | Dock and composer merge — the dock lane becomes the composer on Ask | Striking, very OS; risks confusing the two functions |
| D | Composer inline at the end of the thread, not fixed | Contradicts the review; long threads bury it |

**Leaning A**, with a compact composer that grows on focus. It's the only one where nav behaves identically everywhere, and consistency is worth more than the pixels.

## 4. Dock anatomy — the decisions that determine whether it reads as considered

- **Icon-only (Apple) or icon + label (tab bar)?** Icon-only is bolder and more OS; it costs learnability and invites *cute*. Icon + small label is more legible, more enterprise, and — with generous spacing and restrained type — arguably reads as *more* designed, not less. Given who is watching, this is the highest-leverage call in the whole layout.
- **Active state.** A dot beneath the active icon (macOS running-indicator) or a filled tile. The dot is quieter and more idiomatic.
- **Badges.** Counts on the surfaces that hold work: notices due, records to confirm, unmatched payments. Restraint matters — badge everything and the dock becomes noise.
- **Utility cluster.** macOS separates apps from utilities with a divider. Ours: workspaces on the left of the divider; search, sync status, signed-in account on the right. That gives the left rail's orphaned jobs (branding, "Synced 12:04", account) a home.
- **Keyboard.** ⌘1…⌘7 to move between workspaces. Cheap to build, very OS, and it makes the live demo look fluent.

## 5. Does a top bar survive?

If the dock owns navigation, a persistent top bar has little left to do. Three shapes:

1. **No top bar.** Each page owns its full header — breadcrumb, title, actions, view controls. Maximum canvas; recovers most of the dock's vertical cost. Requires header discipline across five layouts.
2. **Slim top bar** (~48px) for workspace identity, global search and account. Familiar, but pays the vertical cost twice.
3. **No bar, utilities in the dock's right cluster.** Identity and sync ride with the dock; pages are pure content.

**Leaning 3.** It is the only option where the dock's cost is genuinely offset.

## 6. Where governance and settings live

Advisor workspaces are obvious (briefing, ask, records, travellers, itineraries, knowledge). The rest are not workspaces in the same sense:

- **Queues** (notices due, confirm new records, unmatched payments) — these *are* daily work for the personas that own them, so they earn dock slots for those roles.
- **Settings, connections, sharing policy** — configuration, not a workspace. Better behind the account cluster in the utility zone than occupying a dock tile.

That split keeps every persona's dock at 5–7 and gives the dock a consistent meaning: *a tile is a place you work, not a place you configure.*

## 7. Five layouts, not sixteen pages

Every surface resolves to one of five archetypes. Building the system means building these:

| Archetype | Shape | Used by |
|---|---|---|
| **Dashboard** | widget grid, 3–4 columns, each widget a saved view (§8) | Briefing |
| **Conversation** | thread index + active thread + sticky composer | Ask |
| **Catalogue** | filter bar · table ⇄ grid toggle · right detail panel · full route | Records, Travellers |
| **Ledger** | filter bar · table · right detail panel | Knowledge, Notices, Commissions, Confirm records, Unmatched payments |
| **Document** | main column + context rail | full record, traveller profile, commission detail, itinerary |

Catalogue and Ledger are near-identical; the difference is the view toggle and imagery. That is one component with a flag, not two builds.

**Records specifically:** table *and* grid, toggled — table for comparison and scanning (rate, evidence, freshness in columns), grid for recognition once imagery exists. Both feed the same right panel. This is already the rule in `entity-display.md`: cards for identification, rows for triage. The toggle lets the user pick which job they're doing.

## 8. The idea that makes briefing widgets cheap and coherent

Review 01 asks that every widget expand to a full page carrying the rest of the data. The principled version: **a widget is a saved view onto a real surface, and expanding it navigates to that surface with the view applied.**

| Widget | Expands to |
|---|---|
| Commissions | Ledger, filtered to open commissions, sorted by age |
| Departures | Itineraries, filtered to trips departing within 30 days |
| Notices | Notices due, oldest first |
| Expiring incentives | Records ⇄ incentives view, filtered to active windows |
| Records verified | Records, filtered to unverified 90d+ |

This does three things at once: it satisfies the review, it removes five bespoke pages from the build, and it demonstrates the filter system by using it — the briefing becomes proof that the underlying surfaces are real. It also answers the departures question directly: departures *are* itineraries with near dates, which is exactly what the data contract says (VIC ↔ Itinerary cross-link).

## 9. What this implies for the demo

The persona switch leaves the chrome and becomes sign-in — and the dock then *shows* the consequence, because the tile set changes per role. That is a better isolation proof than a toggle was.

The vintage (v1/v2) switch has no natural home in a pure product shell. It stays a presenter affordance — see review 01 §7, still open.

## 10. Decisions — 2026-08-28

Settled with Constantin in review:

1. **The OS thesis is adopted.** The dock is justified by the product being an operating layer for a working day, with the engagement's own synthesis as the citation.
2. **Widgets are saved views.** Expanding a widget navigates to its surface with the view applied (§8). No bespoke widget pages.
3. **Ask composer floats above the dock** (§3, option A), compact by default, growing on focus. Navigation behaves identically on every surface.
4. **Dock is icon-only with labels on hover** — plus the refinement that the **active tile shows its label permanently**, so orientation never depends on a hover.
5. **Records opens as a grid of products with imagery**; the table is the alternate view via the toggle.
6. **The queues are not workspaces.** Notices due, confirm new records and unmatched payments are one category — the system saying something needs you, i.e. the roadmap's Layer 4 (Anticipate). They are what briefing widgets expand into, so they take no dock tiles.
7. **The briefing is per-role**, and is the proactive-intelligence surface:

   | Role | Briefing carries | Dock |
   |---|---|---|
   | Advisor | commissions · departures · notices · expiring incentives · verification progress | Briefing · Ask · Records · Travellers · Itineraries · Knowledge |
   | Agency lead | publish queue · records awaiting confirmation · connection health · policy changes | Briefing · Records · Knowledge |
   | Ops | unmatched payments · reconciliation state | Briefing · Records · Knowledge |

   The dock changing shape per role is now the permission-isolation proof.
8. **No global top bar.** Every page opens with the same header zone: back arrow + breadcrumb left, page actions right. Utilities (search, sync status, account) ride in the dock's right cluster behind a divider; settings and connections sit behind the account. A dock tile is a place you work, not a place you configure.
9. **Badges: briefing only** — a count of items awaiting action for the signed-in role. Every other tile stays quiet.

## 10b. Notifications as a surface — added 2026-08-28

A dedicated triage space, with its own dock tile. It is **not** the briefing:

| | Briefing | Notifications |
|---|---|---|
| Kind | dashboard — the day's *shape* | inbox — the *stream* of items needing a decision |
| Read as | state: what is outstanding, who departs, what expires | events: what changed, what the system noticed |
| You leave it | informed | empty |

**Item anatomy.** Every notification carries: what happened · a tag for the environment it came from (Records · Commissions · Ingestion · Traveller · Connections) · the subject it is attached to · the evidence behind it · severity (Info / Important / Critical, per DEC-18) · state (new / seen / actioned / deferred) · what generated it.

**Action rule.** Light actions resolve inline; heavy work opens the real surface — a source conflict opens the record's resolve sheet, an unmatched payment opens the matching flow, a candidate opens per-field confirmation. Triage is *signal → subject → decision*, never a dead end.

**Absorbs the queues.** Notices due, confirm new records and unmatched payments become **tags within this one space**, not three destinations. Near cost-neutral: it is the Ledger archetype with a different row anatomy, and it removes three surfaces.

**Inherits the product's own rule.** Nothing auto-dismisses. An item is actioned or deferred deliberately — the same posture as advisories closing manually rather than expiring silently (DEC-03).

**The tension to hold in view.** This product exists partly because the inbox failed — "sometimes we read our email, sometimes we don't, and it's always the one time we might not" (SIG-21). Building an inbox risks recreating what the product replaces. The difference that justifies it: every item is bound to its subject and carries its decision, instead of being a message you must interpret and then act on elsewhere.

**Consequences.** The badge moves from Briefing to Notifications. Dock per role:

| Role | Dock |
|---|---|
| Advisor | Briefing · Notifications · Ask · Records · Travellers · Itineraries · Knowledge |
| Agency lead | Briefing · Notifications · Records · Knowledge |
| Ops | Briefing · Notifications · Records · Knowledge |

## 11. Still open

- Ask: thread index as a column inside the page, or a distinct index screen passed through before a thread? (§7)
- Where the vintage (v1/v2) switch lives now that the chrome is pure — presenter affordance, per review 01 §7.
- Record imagery: generic stock committed locally vs generated abstract (review 01 §8).
