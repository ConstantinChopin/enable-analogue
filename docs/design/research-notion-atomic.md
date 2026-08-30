# Research: Notion, and atomic composition as documented practice

Purpose: extract *documented* practice — from Notion, and from the citable literature on atomic composition and design tokens — that we can apply to a dense enterprise web application for luxury-travel advisors (Dashboard, Conversation, Catalogue, Ledger, Document archetypes; bottom dock; triage queue).

Companion to `research-linear.md`. Same evidence rules.

## Source tiers — read this before trusting a number

- **Tier A — primary, published.** Notion's own help centre, developer reference and company blog. W3C Design Tokens Community Group draft. Brad Frost's book text. Vendor design-system documentation (Adobe, Microsoft, Figma, Tailwind, Atlassian).
- **Tier M — measured by us.** Values read directly out of Notion's shipped stylesheet and rendered DOM on a public `notion.site` page on 2026-08-29, viewport 1498 x 1270, default (not full-width) page. This is Notion's real product CSS, not marketing. It is accurate for that page on that day and Notion does not commit to it.
- **Tier O — named-practitioner opinion.** Citable because the author is named and the argument is public, but it is not a specification.
- **Inference.** Explicitly labelled. No number appears in this document unless a source states it or we measured it and said so.

**Scope warning:** Notion publishes no design system, no token documentation, no type scale, and no density specification. Everything numeric in Part A is Tier M. Where we could not verify something — table row height, cell padding — this document says "not verified" rather than guessing.

Measurement page: `https://thomasfrank.notion.site/Block-Basics-1d39743f7e184b3aa94cf0f63d97c5ae` (a public page rendered by Notion's own client, so it loads Notion's production stylesheet).

---

# Part A — Notion

## A1. Design principles, as far as they are published

Notion has not published a design-principles page or a design system. The closest thing to a stated principle is in their product blog.

**Delight is anticipation, not visual noise.** "We believe making software delightful isn't about attention-grabbing visuals. It's about the software anticipating what you need and delivering it when and where you need it, in the simplest, smoothest way possible."
Rule: no surface earns decoration; it earns the right to appear by being the thing needed at that moment.
Source: https://www.notion.com/blog/the-design-thinking-behind-notion-ai

**A conversational surface is a horizontal layer over the primitives, not a vertical feature.** "We see AI not as a standalone vertical feature, but as a horizontal layer that works with every block and surface and comes packaged for the most common workflows."
Rule: Ask must operate *on* records, tables and documents in place, not live only in its own tab.
Source: https://www.notion.com/blog/the-design-thinking-behind-notion-ai

**Explicitly against the blank-input pattern.** "Many of today's AI tools are little more than a thin-wrapped API call on a blank text input. Notion AI, by contrast, has to seamlessly fit with Notion's building blocks and workflows."
Rule: the Conversation archetype opens with context-derived affordances, not an empty field.
Source: https://www.notion.com/blog/the-design-thinking-behind-notion-ai

**Context selects the offered actions.** Notion documents that AI actions differ by state: drafting tools on a new page, editing tools when text is selected, summarisation when content already exists.
Rule: the action set is a function of selection state; never show the union of all actions.
Source: https://www.notion.com/blog/the-design-thinking-behind-notion-ai

**Prepackage the common case, leave the tail composable.** "Most people will use the pre-packaged tools we offer out of the box. But the toolmakers among us will learn to prompt the model to tailor AI to their own workflows."
Source: https://www.notion.com/blog/the-design-thinking-behind-notion-ai

## A2. The block as a composable primitive

This is the part of Notion worth stealing wholesale, because it is a *composition* decision, not a visual one.

**One primitive, uniformly typed.** "Everything you see in Notion is a block. Text, images, lists, a row in a database, even pages themselves — these are all blocks."
Source: https://www.notion.com/blog/data-model-behind-notion

**Every block has the same shared envelope, and a type-keyed payload.** The public API is the formal statement of the model: every block object carries `object`, `id`, `parent`, `type`, `created_time`, `last_edited_time`, `created_by`, `last_edited_by`, `has_children`, `in_trash`. Then: "Every block object has a key corresponding to the value of `type`. Under the key is an object with type-specific block information."
Rule (the important one): **a discriminated union with a shared envelope, not a bag of optional props.** The envelope holds identity, ownership and hierarchy; the type key holds everything that varies. Applied to us: every row, card, chip and message shares one envelope (`id`, `kind`, `provenance`, `confidence`, `updatedAt`) and carries its variable payload under a key named by `kind`.
Source: https://developers.notion.com/reference/block

**The type list is long and flat, not a deep hierarchy.** Documented block types include bookmark, breadcrumb, bulleted_list_item, callout, child_database, child_page, column, column_list, divider, embed, equation, file, heading_1–4, image, link_preview, numbered_list_item, paragraph, pdf, quote, synced_block, table, table_of_contents, tab, to_do, toggle, video, audio, code, and `unsupported`.
Rule: **a forward-compatible `unsupported` member is part of the contract.** An unknown type renders as `type: "unsupported"` with a `block_type` field naming the real type, rather than crashing or being dropped. Applied to us: an unrecognised record kind or citation type must degrade to a labelled placeholder, not vanish — which matters in a product whose proposition is provenance.
Source: https://developers.notion.com/reference/block

**Composition is by containment, and containers differ only in how they render children.** Blocks nest through a `content` array of child block IDs, producing a render tree; "lists display content indented, toggles show content only when expanded, and pages display content on separate views."
Rule: containers own layout; children own themselves. A container never restyles its children.
Source: https://www.notion.com/blog/data-model-behind-notion

**Any block can become any other block.** "Any block in Notion can be turned into any other type of block in order to use, view, or deepen that information in a new way." (`Turn into` in the `⋮⋮` menu.)
Rule: because the envelope is shared, transformation is a type change, not a rebuild. Applied to us: the same record must be presentable as a Ledger row, a Catalogue card and a Document page without three separate data shapes.
Source: https://www.notion.com/help/what-is-a-block

**Every block owns its own vertical space; blocks do not push each other apart.** *(Tier M.)* Measured on consecutive top-level blocks: `margin-top` and `margin-bottom` are `0px` on every block, and the top of each block equals the bottom of the previous one exactly (e.g. block at y=375 with height 64 is followed by a block at y=439; 731 + 64 = 795). A single-line paragraph block measures 40px tall against a 24px line box; a two-line block 64px; a three-line block 88px. So the box is `24n + 16`, i.e. every text block carries 16px of leading inside itself.
Rule: **spacing belongs to the component, never to the gap between components.** No collapsing margins, no `+ *` sibling selectors, no layout-owned vertical rhythm. This is what makes arbitrary block order safe, and it is the single most transferable composition rule in Notion.
Source: measured, 2026-08-29. Notion does not publish this.

## A3. Typography

All Tier M except the option names.

**Three documented typography settings, page-level, not block-level:** `Default`, `Serif`, `Mono` — plus a `Small text` toggle and a `Full width` toggle, all in the `•••` menu at the top right. Notion notes these exist on desktop and web only.
Source: https://www.notion.com/help/customize-and-style-your-content

**The faces actually shipped** *(Tier M, from `@font-face` declarations in Notion's production stylesheet)*:
- `Lyon-Text` — weights 400 and 600, roman and italic. This is the `Serif` option. (Lyon Text is Commercial Type, licensed.)
- `iawriter-mono` — 400 and 600, roman and italic. This is the `Mono` option.
- `inter` — 400, 500, 600, 700, self-hosted.
- `permanent-marker` — 400, one weight, for handwriting-style use.
- `Noto Serif SC`/`TC`, `Noto Sans Arabic`, `Noto Sans Hebrew` for script coverage.

**The `Default` face is the system stack, not Inter.** The computed `font-family` on body text is:
`ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica, "Apple Color Emoji", "Noto Sans Arabic", "Noto Sans Hebrew", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"`
Note for us: this stack resolves to **Segoe UI Variable Display on Windows** — Notion ships Inter but does not use it for body prose by default. Relevant because our demo machine is Windows; Notion's answer to that problem is to name Segoe UI Variable explicitly rather than let `-apple-system` fail into Arial.
Source: measured, 2026-08-29.

**Measured type values (default page, not `Small text`):**

| Role | Size | Line-height | Weight | Colour |
|---|---|---|---|---|
| Body text block | 16px | 24px (1.5) | 400 | `#2c2c2b` |
| Bulleted list item | 16px | 24px | 400 | `#2c2c2b` |
| Heading 2 (`sub_header`) | 24px | 31.2px (1.3) | 600 | `#2c2c2b` |
| Page title | 40px | 48px (1.2) | 700 | `#2c2c2b` |
| Breadcrumb / top bar | 14px | 16.8px (1.2) | 400 | `#2c2c2b` |

`letter-spacing` is `normal` at every size measured — Notion does no optical tracking correction. Heading 1 and Heading 3 were not present on the measured page: **not verified**.
Rule worth taking: **one line-height per band, and the bands are 1.5 for prose, 1.3 for headings, 1.2 for titles and chrome.** Three ratios, not five.
Source: measured, 2026-08-29.

**The reading measure.** *(Tier M.)* The document column is **exactly 720px** (`width: 720px`, `max-width: 100%`, `padding: 8px 0 0`) at a 1498px viewport — a fixed column, not a percentage. Measured characters-per-line across six multi-line paragraphs: 68.0, 83.5, 79.0, 82.6, 69.7, 75.3 — a mean of about **76 characters**.
Note honestly: that is *wider* than the classic 45–75 recommendation, and Notion is comfortable there. `Full width` "shrinks the margins on any page and widens your content area", removing the 720px cap entirely.
Rule: hold the Document and Conversation archetypes to a fixed pixel measure with an explicit full-width escape hatch, rather than to a fluid percentage.
Sources: measured 2026-08-29; https://www.notion.com/help/customize-and-style-your-content

## A4. The neutral palette, and where the warmth is

*(Tier M — read from the `:root, .notion-light-theme` rule in Notion's production stylesheet. 742 custom properties are declared in that one rule.)*

**The greys are warm by construction, and the warmth is strongest in the translucent overlays.** The opaque grey ramp:

`--c-palGra0: #fff` · `--c-palGra50: #f8f8f7` · `--c-palGra500: #73726e` · `--c-palGra600: #5f5e5b` · `--c-palGra700: #484743` · `--c-palGra800: #32302c` · `--c-palGra900: #1d1b16`

Every opaque step has R ≥ G ≥ B. But the *alpha* steps give the game away — they are not black at low opacity, they are brown:

`--cl-palGra30: rgba(84,72,49,.04)` · `--cl-palGra75: rgba(84,72,49,.08)` · `--cl-palGra100: rgba(84,72,49,.15)` · `--cl-palGra200: rgba(81,73,60,.32)` · `--cl-palGra300: rgba(70,68,64,.45)` · `--cl-palGra400: rgba(71,70,68,.6)`

Rule: **overlays, hovers and hairlines must be tinted warm, not neutral black at low alpha.** rgba(0,0,0,.04) on a warm paper ground reads grey and kills the warmth; rgba(84,72,49,.04) keeps it. This is the specific, copyable move.
Source: measured, 2026-08-29.

**The resolved semantic neutrals (light theme):**

| Token | Value | Role |
|---|---|---|
| `--c-texPri` | `#2c2c2b` | primary text |
| `--c-texSec` | `#7d7a75` | secondary text |
| `--c-texTer` | `#a19e99` | tertiary text |
| `--c-texDis` | `#bcbab6` | disabled text |
| `--c-icoPri` | `#383836` | primary icon (lighter than text — icons are *not* text colour) |
| `--c-icoSec` | `#8e8b86` | secondary icon |
| `--c-borPri` | `#e6e5e3` | primary border |
| `--c-borSec` | `#f0efed` | secondary border |
| `--c-borStr` | `#d4d3cf` | strong border |
| `--c-bacPri` | `#fff` | primary background |
| `--c-bacSec` | `#f9f8f7` | secondary background |
| `--c-bacTer` | `#f0efed` | tertiary background |
| `--c-bacEle` | `#fff` | elevated surface |
| `--c-bacInt` | `#f4f3f3` | interactive/hover background |

Two rules fall out. **(1) Four text steps, three border steps, and a separate `Int` background reserved for interaction** — hover is a named token, not an opacity trick. **(2) Icons get their own ramp**: `--c-icoPri` `#383836` is lighter than `--c-texPri` `#2c2c2b`. Notion optically compensates icons rather than reusing text colour.
Source: measured, 2026-08-29.

**The earth tones are a first-class hue family with the full role matrix.** Brown, light theme:
`--c-broTexPri #584437` · `--c-broTexSec #9f765a` · `--c-broTexTer #bca290` · `--c-broBorPri #ebdfd7` · `--c-broBorSec #f5ede9` · `--c-broBorStr #e0cdc0` · `--c-broBacPri #faf8f6` · `--c-broBacSec #f5ede9` · `--c-broBacTer #ebdfd7` · `--c-broBacAccPri #b68965` · `--c-broBacInt #f7f2f0`

Orange: `--c-oraTexPri #6a4222` · `--c-oraBacAccPri #d5803b` · `--c-oraBacSec #fbebde` · `--c-oraBorStr #eaccb2`.

Rule: **an accent hue is not a colour, it is a complete role matrix.** If we adopt an earth-tone accent, we owe it text/icon/border/background at primary/secondary/tertiary/strong/accent/interactive — otherwise it will be used inconsistently. This is directly our "warm paper neutrals with earth-tone accents" direction, already solved.
Source: measured, 2026-08-29.

**Colour restraint: nine hues, and that is the whole vocabulary.** The palette declares exactly nine hue families — `Gra`, `Bro`, `Ora`, `Yel`, `Gre`, `Blu`, `Pur`, `Pin`, `Red` — plus three special-purpose palettes (`palUiBlu` for the interactive blue, `palTraGra` for translucent grey, `palPagGla`/`palWasGla` for page glass). No hue exists outside that list, and there is no per-feature colour.
Source: measured, 2026-08-29.

**The primitive ramp is deliberately non-uniform, and dense at the light end.** Steps are `0, 30, 50, 75, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900`. Five of the fourteen steps live below 100.
Inference (labelled): the ramp is finest exactly where UI surfaces, hairlines and hovers sit — the difference between a 3% and a 4% wash matters enormously on a near-white ground, whereas nobody needs a step between 600 and 700. **Our neutral ramp should be built the same way: extra resolution in the top 10% of the scale, coarse in the shadows.**
Source: measured, 2026-08-29.

**Same token names, different resolved values per theme.** `--c-texPri` computes to `#2c2c2b` in light and `#f0efed` in dark on the same element. Consumers never branch on theme.
Source: measured, 2026-08-29.

**Four value-kind prefixes exist: `--c-`, `--ca-`, `--cl-`, `--cd-`.** `--ca-` values are consistently `rgba()`. The distinction between `--cl-` and `--cd-` could not be determined from the stylesheet — **not verified**; do not copy the four-prefix scheme, copy the tiering below instead.

## A5. Notion's token architecture, inferred from the names

*(Tier M for the names and values; the tier reading is labelled inference, but the naming is unambiguous enough that we consider it strong.)*

Three tiers, in one flat namespace, distinguished by name shape. Every segment is truncated to three letters and PascalCase-concatenated.

1. **Primitive / palette** — `--{prefix}-pal{Hue}{Step}`, e.g. `--c-palGra50`, `--cd-palBro500`, `--ca-palUiBlu300`.
2. **Semantic / alias** — `--{prefix}-[{hue}]{Element}{Rank}`, e.g. `--c-texPri`, `--c-graBacSec`, `--c-broBorStr`, `--c-oraTexAccPri`. Element vocabulary is exactly four: `Tex` (text), `Ico` (icon), `Bor` (border), `Bac` (background). Rank vocabulary: `Pri`, `Sec`, `Ter`, `Dis` (disabled), `Str` (strong), `Ele` (elevated), `Int` (interactive), `Acc` (accent), `Inv` (inverse), `Tra` (transparent).
3. **Component** — `--{prefix}-{comp}{Part}{Prop}{State}`, e.g. `--c-rowHovBac`, `--c-heaRowColBac` (header row column background), `--c-carBacHov` / `--c-carBacPre` (card background hover/pressed), `--c-selBacBlu`, `--c-inpMenIteBac` (input menu item background), `--ca-swiButTeaBg`, `--c-empStaPreJoiButBac` (empty-state preview join-button background), `--c-waxPapBac`.

Three things to take from this:

- **The element × rank matrix is small and closed.** 4 elements × ~10 ranks × 9 hues generates the entire semantic tier mechanically. Nobody invents a semantic token name; they read one off the matrix.
- **State lives in the component tier, not the semantic tier.** `Hov` and `Pre` appear on `--c-carBacHov`, not on `--c-bacPri`. The one exception is `Int`, the generic interactive background.
- **Empty states and row hover are named tokens.** `--c-empStaPre*` and `--c-rowHovBac` exist. Inference: if a state is worth designing, it is worth a token; if it has no token it will be improvised in a component file.

Source: measured, 2026-08-29.

## A6. Density: data surface versus document surface, in one product

This is our Ledger/Catalogue versus Conversation/Document tension, and Notion's answer is structural rather than stylistic.

**The document surface is one fixed column; the data surface is a viewport-width grid.** The document column is 720px (A3). Table views are not constrained to it. Notion never tries to make a table obey the reading measure.
Rule: **the reading measure is a property of the Document and Conversation archetypes only.** Ledger and Catalogue take the full content width. Do not apply one measure token globally.
Source: measured 2026-08-29 for the 720px column.

**A database is a collection of pages, so a row *is* a document.** "Databases in Notion are collections of pages." "Every item you enter into your database is a Notion page. Open a database item to add more information in the form of text, images, and more, as you would with any other Notion page!"
Rule: this is the bridge. The Ledger row and the Document page are the same object at two densities — which means one data shape, two renderers, and no impedance mismatch when a triage row is opened.
Source: https://www.notion.com/help/intro-to-databases

**The transition between the two surfaces is a documented, named, three-way setting.** `Open pages in` offers **side peek** ("Open pages on the right side of the database, with the rest of the database view continuing to be interactive on the left"), **center peek** ("a focused, center modal"), and **full page**. Documented defaults: Table, Board, List and Timeline default to side peek; Gallery and Calendar default to center peek. "Pages will always open in a peek preview. Click ⤡ at the top left to view in full page mode."
Rule: opening a record from a dense view must not destroy the dense view. Side peek keeps the queue interactive — exactly what a triage queue needs.
Sources: https://www.notion.com/help/views-filters-and-sorts · https://www.notion.com/help/intro-to-databases

**A data surface can be embedded inside a document surface.** Inline databases live inside another page; full-page databases are pages themselves, and dragging one into a page converts it.
Rule: the Ledger must be embeddable as a block inside a Document, at reduced width, without a different component.
Source: https://www.notion.com/help/guides/full-page-vs-inline-databases

**Density is per-view, chosen by the user, not per-product.** Verified on the table-view page: column resize by dragging column edges; `Wrap text` per property; column and row reordering by drag; `Calculate` per column for a footer aggregate; `Open pages in` under `Layout`.
Reported but **not verified by fetch** (search-result summaries only, do not cite as documented): `Show vertical lines`, `Wrap all columns`, board `Card size` large/medium/small, row-height drag in dashboard edit mode.
Rule: density is a view setting with a small closed set of steps, not a continuous knob and not a global preference.
Source: https://www.notion.com/help/tables

**Notion assigns each view a purpose in prose, which is how it avoids six views that all mean "list".**
- Table — "Comprising rows and columns, tables are great for giving you a bird's eye view of large data sets"; "great for getting a high-level look at information in a glance."
- List — "A simple, clean view which shows individual pages in a list"; "great for shared documentation" where extensive properties aren't needed.
- Gallery — "An eye-catching way to organize pages visually in a grid where you can showcase images."
- Board — status/ownership at a glance, drag to change state.
- Timeline — "A Gantt chart where you can see project scopes."
- Calendar — "For high-level planning."

Rule: **each of our five archetypes needs one sentence of documented purpose, and a new layout may not ship without one.** Notion's list/gallery distinction is precisely "few properties, read as documents" versus "image-led" — the same distinction as our Ledger versus Catalogue.
Source: https://www.notion.com/help/guides/when-to-use-each-type-of-database-view

**Table row height, cell padding, header row height: not verified.** Notion does not publish them and we could not measure a table view on a public page. Do not cite a number for these.

## A7. Restraint with chrome, empty states, progressive disclosure

**Chrome is revealed on hover, in the margin, and is otherwise absent.** Documented exactly: the `+` icon "appears in the left margin whenever you hover over a new line. Click it to open a menu of content types you can add to your page." The `⋮⋮` icon "appears in the left margin whenever you hover over a new line or content block. Click and drag to move a block. Or click it to open a menu of actions."
Rule: **per-row and per-block actions live in a reserved left gutter and appear on hover.** They occupy no layout width when hidden — the gutter is always there, the controls are not. For a dense Ledger this is how you get row actions without paying for them in every row.
Source: https://www.notion.com/help/writing-and-editing-basics

**One keyboard entry point replaces both menus.** The `/` command is documented as "essentially a shortcut for the same functionality of the `+` and `⋮⋮` menus."
Rule: every hover-revealed action must also be reachable from a single typed command surface. No action exists only behind a hover.
Source: https://www.notion.com/help/writing-and-editing-basics

**Transformation is a first-class menu item, not a re-creation flow.** `Turn into` "Transforms the block into another type of block (like a bullet into a checkbox, or plain text into a heading), or into a page."
Source: https://www.notion.com/help/writing-and-editing-basics

**Empty states are designed enough to have their own tokens.** `--c-empStaPreCalInd` and `--c-empStaPreJoiButBac` exist in the shipped stylesheet — empty-state preview tokens for a calendar indicator and a join button.
Inference: Notion treats the empty state as a component with its own visual contract, not as a paragraph of grey text. We should do the same for the triage queue at zero, the Catalogue at zero results, and Ask before the first question.
Source: measured, 2026-08-29.

---

# Part B — atomic composition, documented practice

## B1. Atomic Design: what the book actually says, and what it does not

**The five stages, verbatim.**
- Atoms: "atoms of our interfaces serve as the foundational building blocks that comprise all our user interfaces."
- Molecules: "relatively simple groups of UI elements functioning together as a unit."
- Organisms: "relatively complex UI components composed of groups of molecules and/or atoms and/or other organisms."
- Templates: "page-level objects that place components into a layout and articulate the design's underlying content structure."
- Pages: "specific instances of templates that show what a UI looks like with real representative content in place."
Source: https://atomicdesign.bradfrost.com/chapter-2/

**It is explicitly not a hierarchy you must obey, and Frost says so in the book.** "Atomic design is not a linear process, but rather a mental model to help us think of our user interfaces as both a cohesive whole and a collection of parts *at the same time*." And: "Atomic design is not rigid dogma. Ultimately, whatever taxonomy you choose to work with should help you and your organization communicate more effectively." He approvingly cites GE Design's alternative naming (Principles, Basics, Components, Templates, Features, Applications).
Rule: renaming the tiers is *following* the book, not deviating from it. We are free to call them what our team says out loud.
Source: https://atomicdesign.bradfrost.com/chapter-2/

**Frost's own defence of why some hierarchy is needed.** "Atoms, molecules, and organisms does have a built-in hierarchy to it," and "my issue with terms like 'modules' and 'components' is that they don't carry any sense of hierarchy, and become these amorphous clusters of interface."
Source: https://bradfrost.com/blog/link/where-atomic-design-fell-short/

**The documented, concrete failure mode: the boundaries are subjective.** *(Tier O — Kasey Bonifacio, Sparkbox.)* "The lines between what is an atom, molecule, etc. are too fuzzy, leading to confusion about how to categorize design system components." Their worked example is the icon button: "Are they atoms because they are a button variant or are they molecules because they contain an icon component?" Diagnosis: "The rules for categorizing are subjective, which means everyone is going to have a different definition." Their proposed refinement: "start with a flat hierarchy, where all components are treated equally — no atoms, no molecules, just components," and "When we start to experience pain points working with the flat hierarchy, that's when it's time to evolve our system."
Rule: **do not spend argument on which tier a component belongs to.** Categorisation is only worth its cost when a specific pain point demands it.
Source: https://sparkbox.com/foundry/iterating_on_atomic_design

**The second documented critique: isolation.** *(Tier O — Jay Freestone.)* "Molecules are manufactured, shoehorned, then revised when they fail to pair convincingly as part of a larger system." "The car is not *designed* in isolation, it is *manufactured* in isolation." He quotes Frost's own concession that "Viewing everything in context allows us to loop back to modify our molecules, organisms, and templates."
Rule: components are *manufactured* in isolation but must be *designed* in a real composed screen. Our archetype pages are the design surface; the component library is the manufacturing surface.
Source: https://www.jayfreestone.com/writing/perils-of-atomic-design/

**Where Frost's thinking has gone since.** His Global Design System proposal argues for "a vanilla base containing only browser-default styles," explicitly not "a comprehensive solution for all UI needs" (he invokes the 80/20 rule), "easily themeable," and interoperable across stacks.
Inference for us: the same 80/20 argument applies internally — a small closed set of primitives plus composition, not an exhaustive component catalogue.
Source: https://bradfrost.com/blog/post/a-global-design-system/

## B2. W3C Design Tokens Community Group: the actual specification

Current draft: **Design Tokens Format Module 2025.10**. Source for everything in this section: https://www.designtokens.org/TR/drafts/format/ (`tr.designtokens.org/format/` 301-redirects here).

**A token is a JSON object with `$value`; everything else is optional.** Defined properties: `$value` (required), `$type`, `$description`, `$extensions`, `$deprecated` (boolean, or a string explaining the deprecation). All format-defined properties use the `$` prefix.
Rule: `$deprecated` is in the spec — use it rather than deleting a token, and pair it with the replacement name in the description.

**Name restrictions are normative and short.** Names "MUST NOT" start with `$`, and "MUST NOT" contain `{`, `}`, or `.`.
Rule: the dot is reserved as the alias path separator, so no token name may contain one. Our CSS-variable names must be mechanically derivable from the token path — pick a separator now (`-`) and never use it as a semantic character.

**Aliasing has two documented forms.** Curly-brace references `{group.token}` resolve to the target's whole `$value`. JSON Pointer references via `$ref` (RFC 6901, e.g. `"#/colors/blue/$value"`) are also required to be supported and can address a specific property inside a composite value.
Rule: every semantic token's `$value` should be an alias, never a literal. If a semantic token holds a raw hex, the primitive tier has been bypassed.

**Groups are objects without `$value`, and `$type` is inherited down the tree.** Resolution order: the token's own `$type`; then the resolved group's `$type`; then each parent group walking up; a token with no determinable type is invalid. `$extends` allows group inheritance (`"$extends": "{button}"`).
Rule: set `$type` once on the group. A `$type` repeated on every token is a smell.

**The full defined type list:** `color`, `dimension` (value + `px`|`rem`), `fontFamily` (string or array), `fontWeight` (1–1000 or the predefined keyword strings), `duration` (value + `ms`|`s`), `cubicBezier` (4-number array), `number`; composites `strokeStyle`, `border`, `transition`, `shadow`, `gradient`, `typography`.
Rule for us specifically: **`typography` is a composite token type in the spec.** A type role is one token bundling family, size, weight, letter-spacing and line-height — not five separate tokens and not a utility class.

**The spec defines no tiers.** It does not define primitive / semantic / component layers, or any prescribed hierarchical meaning. Token organisation is arbitrary group structure.
Rule, and this is the important one: **primitive → semantic → component is a community convention, not a standard.** So the *only* thing that makes the tiering real is enforcement (see B5). Nothing in the format will stop a component from referencing a primitive.

## B3. How mature systems actually layer and name tokens

The tier vocabulary the spec declines to define is, in practice, remarkably consistent across systems. Three tiers, three sets of names for them.

| System | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| Material 3 | reference (`ref`) | system (`sys`) | component (`comp`) |
| Adobe Spectrum | global | alias | component-specific |
| GitHub Primer | base | functional | — |
| Atlassian | (unnamed primitives) | semantic (`color.icon.success`) | — |
| Notion (measured) | `pal{Hue}{Step}` | `{Element}{Rank}` | `{comp}{Part}{Prop}{State}` |

### Material 3 — reference / system / component

**Three named classes, encoded in the token name itself.** "There are three classes of tokens in Material: reference, system, and component." Names are period-separated and go "from the most general information ('md') to the most specific ('on-secondary')": system name → class abbreviation (`ref` / `sys` / `comp`) → role words. Examples given: `md.ref.palette.secondary90`, `md.comp.fab.primary.container.color`.
Rule: the tier is *in the name*, so a violation is visible in a diff without tooling.
Source: https://m3.material.io/foundations/design-tokens/overview

**Reference tokens are context-free; system tokens are where theming happens.** "Reference tokens don't change based on context." "System tokens define the purpose a reference token serves in the UI. This is where theming occurs. The system token can point to different reference tokens depending on the context, such as a light or dark theme."
Rule: **theming lives in exactly one tier.** If a component token or a primitive changes per theme, the layering has already failed.
Source: https://m3.material.io/foundations/design-tokens/overview

**Aliasing is a should, stated plainly.** "Whenever possible, system tokens should point to reference tokens rather than static values."
Source: https://m3.material.io/foundations/design-tokens/overview

**Component specs are organised state-first, then by element.** "Tokens are first grouped by state (enabled, disabled, hover, etc) and then by element, which is the part of the component that a token or value applies to, such as the container or label text."
Rule: a good component spec table is `state × element`, which is also a completeness check — an empty cell is an undesigned state.
Source: https://m3.material.io/foundations/design-tokens/overview

### Adobe Spectrum — global / alias / component-specific, with an explicit precedence order

**The three types, defined.** A **global token** is "A token used across the design system. This is the opposite of a component-specific token" (examples: `corner-radius-75` = 2 px; `component-height-100` = 32 px desktop / 40 px mobile). An **alias** is "A token that references another token, instead of referencing a hard-coded value" (example: `negative-border-color-default` → `negative-color-900`). A **component-specific token** is "A token used for a particular component" (examples: `tooltip-maximum-width` = 160 px desktop / 200 px mobile; `divider-thickness-small` = 1 px).
Source: https://spectrum.adobe.com/page/design-tokens/

**A stated order of preference — this is the clearest guidance published anywhere.**
- "Only use global tokens when there are no available aliases for your use case. Global tokens are easy to reference and are the building blocks of Spectrum, but they're also the least tied to the logic of our design language."
- "Alias tokens are the recommended type to use when building your product with design tokens."
- "When building Spectrum verified components, use component-specific tokens. This ensures that as a component's design evolves, you won't have to retrace any higher-level design decisions."
- "It's not recommended to use component-specific tokens interchangeably with other components, unless one is derivative of the other."
Rule: **alias by default; component tokens inside their own component; globals only as a last resort.**
Source: https://spectrum.adobe.com/page/design-tokens/

**Fewer tokens on purpose.** "The overall methodology is to have a focused set of tokens rather than all possible tokens for all possible scenarios." And a caveat worth keeping honest: "tokens only provide some — if not most — of the information needed to represent or implement a UI component."
Source: https://spectrum.adobe.com/page/design-tokens/

**Naming: three parts, flat, human-readable.** "We use a 3-part structure for coming up with token names: context, common unit, and clarification… Token names start with broad context, then go into more specific detail." Explicit principles: "Human-readable"; "Flat structure. We use a flat structure — not a nested or tree structure — so that we aren't prioritizing a particular coding construct"; "Predictable and flexible."
Worked examples they give: `gray-100` (colour, then specific value); `checkbox-control-size-small` (component → common unit → t-shirt size); `action-button-edge-to-hold-icon-large` (component → spacing construct described in words → size).
Rule: the last segment should be the property being set. Not every name needs all three parts, but the order never changes.
Source: https://spectrum.adobe.com/page/design-tokens/

**Sizes are a small t-shirt set on a linear scale; numerals only where a wide range is genuinely needed.** "These are designed to offer a limited number of size options that follow a linear scale: for example, on desktop, each size increases or decreases by 8 px." Non-linear numeral scales are reserved for components "frequently used inside of other components across a wide range of use cases — like avatars or thumbnails."
Rule: t-shirt sizes for anything used in composition; numeric scales only for the two or three atoms that nest everywhere.
Source: https://spectrum.adobe.com/page/design-tokens/

**Platform scale is a token dimension, not a media query.** The same token carries a desktop and a mobile value (`component-height-100` = 32 px / 40 px; `tooltip-maximum-width` = 160 px / 200 px).
Inference for us: our own density postures are better expressed as a second value on the same token than as a parallel set of tokens.
Source: https://spectrum.adobe.com/page/design-tokens/

### Atlassian — Foundation · Property · Modifier

**A three-segment naming anatomy where each segment answers one question.** "Foundation: The type of visual design attribute or foundational style, such as color, elevation, or space. Property: The UI element the token is being applied to, such as a border, background, shadow, or other property. Modifier: Additional details about the token's purpose, such as its color role, emphasis, or interaction state." Examples: `color.icon.success`; and "Not every token has a modifier. For example, `color.text` is our default body text color."
Rule: **the unmodified name is the default.** `color.text` beats `color.text.default` — the base case should be the shortest name.
Source: https://atlassian.design/tokens/design-tokens

**The colour tier is enumerated by what it paints.** "There are dedicated color tokens for text, links, icons, backgrounds, borders, blankets, charts, and skeleton loaders."
Note this is Notion's Tex/Ico/Bor/Bac matrix again, plus link, blanket, chart and skeleton. `blanket` (the scrim behind a modal) and `skeleton` are the two we would otherwise forget.
Source: https://atlassian.design/tokens/design-tokens

**Pick by meaning, never by appearance — stated as a Do/Don't.** "Choose tokens based on meaning where applicable, not specific values." Don't: "Don't use a token just because the colors appear to match. This can break the experience in other themes."
Rule: the strongest one-line argument for the semantic tier that exists in any published system.
Source: https://atlassian.design/tokens/design-tokens

**Density is a theme, not a component prop.** "A theme is a collection of token values designed to achieve a certain look or style… Non-color themes are also possible: think cozy/comfortable/compact views, reduced motion, or custom typography styles."
Rule, and it matters a great deal for us: **our density postures should be a theme that re-points spacing and size tokens, not a `density` prop threaded through every component.**
Source: https://atlassian.design/tokens/design-tokens

**Enforcement is published alongside the tokens** — see B5 for the exact ESLint configuration.

### IBM Carbon — one spacing scale, in multiples of two, four and eight

**The published scale, exactly:**

| Token | rem | px | | Token | rem | px |
|---|---|---|---|---|---|---|
| `$spacing-01` | 0.125 | 2 | | `$spacing-08` | 2.5 | 40 |
| `$spacing-02` | 0.25 | 4 | | `$spacing-09` | 3 | 48 |
| `$spacing-03` | 0.5 | 8 | | `$spacing-10` | 4 | 64 |
| `$spacing-04` | 0.75 | 12 | | `$spacing-11` | 5 | 80 |
| `$spacing-05` | 1 | 16 | | `$spacing-12` | 6 | 96 |
| `$spacing-06` | 1.5 | 24 | | `$spacing-13` | 10 | 160 |
| `$spacing-07` | 2 | 32 | | | | |

"The Carbon spacing scale complements the 2x Grid and typography scale by using multiples of two, four, and eight. It includes both small increments needed to create appropriate spatial relationships for detail-level designs as well as larger increments used to control the density of a design."
Rule: **thirteen steps, one scale, used both inside components and between them.** Note the shape: 2/4/8/12/16 at the bottom (five steps under 20px, where dense UI lives), then a widening ladder — the same "fine where it matters" principle as Notion's colour ramp.
Source: https://carbondesignsystem.com/elements/spacing/overview/

**Components should not own their outer margins.** Carbon's Stack component "allows components to not use margin and instead delegate the responsibility of positioning and layout to parent components."
Note the tension with Notion (A2), which puts the leading *inside* the block. Both work; what does not work is doing both. **Pick one and enforce it.** For us: Notion's rule for stackable content blocks in Document and Conversation, Carbon's rule for layout composition in Dashboard, Ledger and Catalogue.
Source: https://carbondesignsystem.com/elements/spacing/overview/

**Spacing is stated as a hierarchy mechanism, not decoration.** "Space can also be used to denote groups of associated information. This creates content sections on a page without having to use lines or other graphical elements as a divider." And: "Elements that have more spacing around them tend to be perceived as higher in importance."
Rule: reach for space before a rule line. Relevant given our flat, hairline-heavy direction.
Source: https://carbondesignsystem.com/elements/spacing/overview/

### GitHub Primer — base / functional, and consumers only import functional

**Two published layers.** `src/tokens/base/` holds core primitive values (colour, typography, motion, sizing); `src/tokens/functional/` holds semantic, theme-specific tokens derived from them, subdivided into `color/` (per theme, with accessibility variants), `size/`, `spacing/`, `typography/`. Consumers import from `dist/css/functional/` — e.g. `@primer/primitives/dist/css/functional/themes/light.css`.
Rule: **the package boundary does the enforcing.** If the primitive layer is simply not in the import path products use, no lint rule is needed for that particular violation.
Source: https://github.com/primer/primitives (README)

**Naming rules are mechanical.** Token names "have to be in camelCase or kebab-case and may only include letters, numbers and `-`." A `@` key denotes the default value where a parent token also has sub-tokens: `bgColor.accent['@']` is the default, `bgColor.accent.muted` the variant.
Rule: same idea as Atlassian's missing modifier — there must be one designated way to say "the default of this group".
Source: https://github.com/primer/primitives (README)

### Apple

Not covered here. Apple publishes semantic system colours and Dynamic Type text styles in the HIG, but our direction is explicitly flat with no materials, and we could not verify Apple's numeric values within this pass. **Do not cite Apple values from this document.** If we need them, they belong in a separate, dedicated pass.

## B4. Component API design: variants, props, and when to make a new component

**Declare the component's API as data, and validate tokens against it.** Adobe publishes a versioned JSON-Schema specification for component declarations. Normative rules include: "Each key in `options` **MUST** be camelCase"; "Boolean option names **MUST** begin with `is` or `has`." Slots are "the component's named **content injection points**", and the slot vocabulary is a fixed list: `default`, `icon`, `label`, `help-text`, `negative-help-text`, `action`, `heading`, `description`, `hero`, `footer`, `tooltip`. Components declare anatomy parts and states (each with `trigger: "prop" | "interaction"`, `precedence`, `layered`), and cross-reference rules SPEC-018…SPEC-040 mean a token whose `anatomy`/`state`/`variant` field does not match a declared value fails the build.
Rule: the component's props, slots, anatomy and states should be a machine-readable file that CI checks, not something discovered by reading the TypeScript type.
Source: https://opensource.adobe.com/spectrum-design-data/spec/component-format/

**Split emphasis from intent into two orthogonal enums.** Polaris `Button` documents `variant: "auto" | "primary" | "secondary" | "tertiary"` and, separately, `tone: "critical" | "auto" | "neutral"`. Documented meanings: primary is "High emphasis button for the primary action on the page. Should be used sparingly"; critical is for "Urgent problems or destructive actions", and "Use critical tone only for destructive actions that are difficult or impossible to undo."
Rule: `variant="primary-critical"` is a fused enum and is where combinatorial rot starts. Two enums, multiplied at render time.
Source: https://shopify.dev/docs/api/app-home/polaris-web-components/actions/button

**Variants of one component should form a single ordered scale, not an unordered bag.** Material 3's five button variants are documented as an emphasis ladder: Filled = "High-emphasis buttons… for primary actions"; Filled tonal = "Also for primary or significant actions"; Elevated "Serves a similar purpose to tonal buttons"; Outlined = "Medium-emphasis buttons, containing actions that are important but not primary"; Text = "Low-emphasis buttons."
Note this cuts both ways: by Google's own wording, Elevated and Tonal overlap. M3 is the cautionary example of what happens when a variant set stops being a scale.
Source: https://developer.android.com/develop/ui/compose/components/button

**Mutually exclusive props must be a discriminated union, not parallel booleans.** Fluent UI v9's implementation guide: "If there are properties that are mutually exclusive, then a discriminated union is a better choice. The caller cannot accidentally specify multiple values which could lead to unpredictable behavior." Also documented there: when a single optional value may expand later, "prefer a discriminated union with one value" instead of a boolean flag; and "Avoid prefixing the component name (e.g. prefer `icon` over `buttonIcon`)."
Source: https://github.com/microsoft/fluentui/blob/master/docs/react-v9/contributing/implementation-best-practices.md

**The clearest documented "variant or new component?" procedure.** Fluent UI's new-component checklist: (1) "Before making the decision to design a new component, check to see if the pattern already exists within any current Microsoft design system including our Figma toolkit." (2) "If the new component pattern you are proposing already exists, but varies slightly, then please consider creating a variant of the component." (3) Does it "add value at a broad level or is it a product-specific customization"? Paired with their packaging rule: "Each package should generally contain one component, and any variants. For example, `react-button` contains `Button`, `MenuButton`, `SplitButton`, and `ToggleButton`, which are all variants of each other."
Read the practice, not just the words: Fluent ships `SplitButton` and `ToggleButton` as **separate exported components co-located in one package**, not as `<Button split toggle>`. The line is drawn at structural and behavioural difference, while stylistic difference stays a prop (`appearance`).
Rule: **same anatomy + same interaction model + same ARIA role → variant prop. Different anatomy, different interaction model, or different role → new component, same package.**
Sources: https://github.com/microsoft/fluentui/blob/master/docs/react-v9/contributing/new-components.md · https://github.com/microsoft/fluentui/blob/master/docs/react-v9/contributing/component-implementation-guide.md

**A variant may never change the rendered semantic role.** React Aria: "The `Button` component always represents a button semantically. To create a link that visually looks like a button, use the Link component instead."
Rule: `<Button variant="link">` that renders an `<a>` is a documented anti-pattern.
Source: https://react-aria.adobe.com/Button

**Orthogonal binary axes must be boolean properties, not variant axes — this is the single biggest lever against variant-count multiplication.** Figma documents the constraint that causes the explosion: "All variants within the component set should use the same properties and values, but each variant needs to be a unique combination of them." And the lever: component properties come in five types — Boolean, Instance swap, Text, Variant, Slot — with the guidance "We recommend reviewing your existing design system before you adopt component properties. That way, you can decide which aspects you can reflect as component properties and which need to be variants." Figma also documents a real cost: "When you add an instance with variants to a file, Figma will import every variant in that component set. Importing large component sets will impact Figma's speed and performance."
Rule: has-icon, has-badge, is-selected are booleans. Only genuinely enumerated, mutually exclusive axes are variants.
Caveat worth recording: **Figma documents no numeric limit on variants.** Anyone citing "more than N variants means split the component" is citing opinion, not documentation.
Sources: https://help.figma.com/hc/en-us/articles/360056440594-Create-and-use-variants · https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties · https://www.figma.com/best-practices/component-architecture/

**A prop with no story and no test does not exist.** React Spectrum's contribution guide: "A Storybook story should be written for each visual state that a component can be in (based on props)" and "Anything that should be changed by a prop should be tested via react-testing-library." Significant changes go through an RFC first.
Rule: a cheap mechanical brake on prop growth — adding a prop costs a story and a test.
Source: https://github.com/adobe/react-spectrum/blob/main/CONTRIBUTING.md

**List-shaped components take `items` plus a render function, not a rendered array.** React Spectrum's collections API exists for "a consistent API across many types of collection components that is easy to learn, performant on large collections, and extensible for advanced features." Documented rationale: "Using the `items` prop and providing a render function allows React Spectrum to automatically cache the results of rendering each item and avoid re-rendering all items in the collection when only one of them changes"; `array.map()` "will not be as performant." Items must be immutable and carry an `id`/`key`.
Rule: directly relevant to the Ledger and the triage queue — the row component never owns the data array.
Source: https://react-spectrum.adobe.com/react-spectrum/collections.html

**Configurable versus composable, the practitioner heuristic.** *(Tier O — Nathan Curtis.)* The diagnosis: "Increasingly feature-rich components get brittle. Esoteric props start to conflict and grow into a ridiculously long list." "A system can't anticipate and produce every configuration of every need anyone ever has." The heuristic: "Make the **very common** configurable. Make the **uncommon** composable. Make the **less common** configurable, as time permits." A subcomponent is "an independently composible UI component with a well-defined API intended for use only within a specific parent component or context."
On slots: a slot is "an intentional opening in a component's hierarchy to allow custom variation"; supporting every shift in "content, styling, interactivity and layout" via props is "impractical" and creates "avoidable brittleness"; "An increase in component slots and custom compositions within them could lead to a decrease in the need for configurable properties."
On process: normalise **anatomy, properties, layout** before building, in a neutral written document rather than in Figma or in code. Anatomy "establishes the hierarchy of elements and groups that map to web markup, object composition, and Figma layers."
Sources: https://nathanacurtis.substack.com/p/subcomponents-753ce9f6600a · https://nathanacurtis.substack.com/p/slots-in-design-systems · https://nathanacurtis.substack.com/p/crafting-ui-component-api-together-81946d140371

**Contribution scope, documented.** Atlassian accepts fixes and "small enhancements: adding a new icon to the existing icon library. This change doesn't break existing behavior", and does not accept "Major enhancements: adding a new feature to a component… requires system-wide coordination" or "New components or patterns" through the same path. Atlassian publishes no props-level API rulebook.
Source: https://atlassian.design/contribution

## B5. Enforcing consistency mechanically

This is the section that matters most, because B2 established that nothing in the token format enforces tiering.

**Lint by domain, not by property, and enforce the token function.** Atlassian's published ESLint config, verbatim:
```js
'@atlaskit/design-system/ensure-design-token-usage': [
  'error', { domains: ['color', 'spacing'], shouldEnforceFallbacks: true }
]
'@atlaskit/design-system/no-unsafe-design-token-usage': [
  'error', { shouldEnforceFallbacks: true }
]
```
`no-unsafe-design-token-usage` accepts `fallbackUsage: 'none'` to block new fallbacks. Documented rationale for routing values through a `token()` function: "This ensures you have proper prefixes, type checking, and linting so you'll know if a token ever changes, is deleted, or is used incorrectly." Every token deprecation ships with a codemod: `npx @atlaskit/codemod-cli --preset remove-token-fallbacks`.
Rule: deprecation without a codemod is a request, not a migration.
Source: https://atlassian.design/foundations/tokens/use-tokens-in-code/

**In CSS, use a regex-driven strict-value rule and turn on shorthand expansion.** `stylelint-declaration-strict-value`, rule `scale-unlimited/declaration-strict-value`, documented config:
```json
"scale-unlimited/declaration-strict-value": [["/color$/", "z-index", "font-size"]]
```
Documented secondary options: `ignoreVariables` (default `true`), `ignoreFunctions`, `ignoreValues` (per-property maps, e.g. `{ "/color$/": ["currentColor"], "fill": "inherit" }`), `ignoreAtRules` (e.g. `"@font-face"`), `expandShorthand` (validates `border: 1px solid #FFF` against `border-color`), `recurseLonghand`, `disableFix`, `autoFixFunc`, and a `message` template supporting `${types} ${value} ${property}`.
Rule: the regex `/color$/` catches `color`, `background-color`, `border-color` and `outline-color` in one entry, and `expandShorthand` is essential because shorthand is where hardcoded values hide.
Source: https://github.com/AndyOGo/stylelint-declaration-strict-value

**Make arbitrary values unnecessary before you ban them.** Tailwind v4 `@theme`: "Theme variables aren't *just* CSS variables — they also instruct Tailwind to create new utility classes that you can use in your HTML." Namespaces are fixed and documented: `--color-*`, `--font-*`, `--text-*`, `--font-weight-*`, `--tracking-*`, `--leading-*`, `--breakpoint-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--blur-*`, `--animate-*`. The closure mechanism:
```css
@theme { --color-*: initial; --color-white: #fff; --color-clay: #b68965; }
```
Verbatim: "When you do this, all of the default utilities that use that namespace *(like `bg-red-500`)* will be removed, and only your custom values *(like `bg-midnight`)* will be available." Full reset is `--*: initial;`. Also documented: `@theme inline` when a theme variable references another variable, and `@theme static` to emit all variables regardless of use.
Rule: **`--color-*: initial` before declaring the palette.** Namespace closure deletes `bg-red-500` from existence, so the linter only has to catch `bg-[#ff0000]`.
Source: https://tailwindcss.com/docs/theme

**Then ban arbitrary values, and remember to register your variant wrapper.** `eslint-plugin-tailwindcss` rule `no-arbitrary-value`, documented rationale: "Arbitrary values are great but can be problematic too if you wish to restrict developer to stick with the values defined in the Tailwind CSS config file." "By default this rule is turned `off`, if you want to use it set it to `warn` or `error`." Options include `callees` (default `["classnames","clsx","ctl","cva","tv"]`) and `ignoredKeys` (default `["compoundVariants","defaultVariants"]`). Documented limitation: "This rule will not fix the issue for you because it cannot guess the correct class candidate."
Rule: add your own `cva`/`tv` wrapper to `callees`, otherwise arbitrary values inside variant definitions go unchecked — which is exactly where design-system code puts them. Caveat: Tailwind's own docs treat `rounded-[calc(var(--radius-xl)-1px)]` as idiomatic, so allow arbitrary values that only reference `var(--*)`.
Source: https://github.com/francoismassart/eslint-plugin-tailwindcss/blob/master/docs/rules/no-arbitrary-value.md

**Put the replacement in the lint message.** MetaMask's `eslint-plugin-design-tokens` ships `color-no-hex` ("Prevent the use of hex color values") and `no-deprecated-classnames`, configured as a map from old class to a custom message:
```json
"@metamask/design-tokens/no-deprecated-classnames": ["warn", {
  "bg-white": "Use 'bg-default' to align with the design system's color tokens.",
  "text-red-500": "Use 'text-error-default' to align with the design system's color tokens."
}]
```
Rule: the cheapest possible migration documentation is the error string.
Source: https://github.com/MetaMask/eslint-plugin-design-tokens

**Do not expect the token build to validate anything — negative finding.** Style Dictionary documents only `value` as required ("For any design tokens you wish to output, the 'value' attribute is required"), with optional `comment`, `themeable`, `name`, `attributes`, auto-added `name`/`path`/`original`/`filePath`/`isSource`, and aliasing via `{size.font.medium}`. It documents collision *warnings* when a token is defined in multiple source files, and file order determining overrides — but **no built-in validation or linting**. Custom validation must be built with the Parsers and Filters hooks. Salesforce's standalone `design-tokens` repo is marked deprecated.
Rule: validation lives in the linter (Atlassian model) or in a schema (Adobe model), never in the build.
Source: https://styledictionary.com/info/tokens/

---

# What we should take

Ranked. Each line is a rule we can enforce, with the reason in one line.

## (i) Composition and token architecture

1. **Insert a semantic tier, and forbid components from reaching past it.** Primitive (`palette.*`) → semantic (`text.*`, `border.*`, `background.*`, `icon.*`) → component (`row.hover.background`). Spectrum's stated precedence, adopted verbatim: alias by default; component tokens only inside their own component; primitives only when no alias exists.
   *Reason: it is the only tier boundary that survives a re-skin, and the DTCG format explicitly will not enforce it — nothing will, unless we do.*
2. **Theming and density both live in exactly one tier: semantic.** No primitive and no component token may change per theme or per density posture. Density is a theme that re-points spacing and size tokens — Atlassian's "cozy/comfortable/compact" — not a `density` prop threaded through every component.
   *Reason: with five archetypes and enterprise density, a density prop would reach every component we own; a theme reaches none of them.*
3. **Close the element × rank matrix and never invent a semantic name outside it.** Elements: text, icon, border, background — plus link, blanket, chart and skeleton, which Atlassian enumerates and everyone else forgets. Ranks: primary, secondary, tertiary, disabled, strong, elevated, interactive, accent, inverse.
   *Reason: the matrix generates the whole tier mechanically, so nobody names anything and no two people name the same thing differently.*
4. **Make each type role one composite `typography` token, not a size utility.** Family, size, weight, line-height and tracking travel together per role: `type.prose.body`, `type.data.cell`, `type.title.page`.
   *Reason: it is a spec-defined composite type, and it is the only structure that carries our sans-versus-serif split as a property of the role rather than a pairing the author has to remember.*
5. **Decide who owns vertical space per archetype, and never let both own it.** Notion's rule (the block owns its own leading; zero margins; measured `24n + 16`) for stackable content in Document and Conversation. Carbon's rule (components carry no outer margin; a Stack parent owns the gap) for Dashboard, Ledger and Catalogue.
   *Reason: both are documented and both work; the failure mode is a codebase that does half of each, which is exactly how "precision in composition" dies.*
6. **One shared envelope plus a type-keyed payload for every displayable thing.** `id`, `kind`, `provenance`, `confidence`, `updatedAt` on the envelope; everything variable under a key named by `kind`; an explicit `unsupported` member.
   *Reason: it makes "the same record as a Ledger row, a Catalogue card and a Document page" a rendering choice instead of three data shapes, and `unsupported` keeps an unrecognised citation visible in a product that sells provenance.*
7. **Put the tier in the name, and let the package boundary do the enforcing.** Material's `ref`/`sys`/`comp` infix makes a violation visible in a diff; Primer's split — products import only `dist/css/functional/` — makes one whole class of violation unreachable.
   *Reason: the cheapest enforcement is the one that needs no linter.*
8. **Build the neutral ramp and the spacing scale fine at the end that matters.** Notion's colour steps: 0, 30, 50, 75, 90, 100, then 200…900 — five of fourteen below 100. Carbon's spacing: 2, 4, 8, 12, 16 before it widens.
   *Reason: near-white surfaces and sub-20px gaps are where a dense enterprise UI actually lives; the shadows and the 96px gaps can be coarse.*
9. **Tint every overlay, hover and hairline warm; never black at low alpha.** Notion's grey washes are `rgba(84,72,49,.04)`, not `rgba(0,0,0,.04)`.
   *Reason: on warm paper, neutral-black alpha reads grey and silently destroys the warmth the palette exists for.*
10. **Two orthogonal enums, never one fused enum.** Emphasis and intent are separate props; orthogonal binary axes are booleans, not variant axes; mutually exclusive options are a discriminated union, not parallel booleans.
    *Reason: the documented cause of combinatorial rot, and the one API decision that is expensive to reverse later.*
11. **Same anatomy + same interaction model + same ARIA role → variant. Otherwise a new component in the same folder.** A variant may never change the rendered role.
    *Reason: it replaces a subjective argument with a three-part test anyone can apply in review.*
12. **Close the utility namespace before banning arbitrary values.** `--color-*: initial` first, then the lint rule; register our own `cva`/`tv` wrapper in `callees`; allow arbitrary values that only reference `var(--*)`.
    *Reason: closure removes the wrong classes from existence, so linting only has to catch the escape hatch — either alone leaks.*
13. **Lint by domain, with fallbacks enforced, and ship a codemod with every deprecation.** Colour and spacing first; `/color$/` plus `expandShorthand` in Stylelint; the replacement token named in the error message.
    *Reason: "absolute precision in composition" is a claim until it is a failing build.*
14. **Spec each component as a `state × element` table.** Material's component specs are grouped by state first, then by element.
    *Reason: an empty cell in that table is an undesigned state, which is how hover, disabled and empty get found before a demo does.*
15. **Default to a flat `components/` directory; introduce tiers only when a named pain point demands it.** Rename them to whatever we say out loud.
    *Reason: the atoms/molecules boundary is documented as subjective, and Frost's own text says the taxonomy is ours — arguing about it is pure cost.*
16. **A prop with no story and no test does not exist.**
    *Reason: the cheapest available brake on prop growth, and it costs nothing to adopt now.*
17. **Design components in a composed archetype screen; manufacture them in isolation.**
    *Reason: the documented failure of atomic design is molecules invented in isolation that do not survive contact with a real screen.*

## (ii) Notion-specific interface rules

1. **The reading measure belongs to Document and Conversation only; Ledger and Catalogue take the full content width.** Fixed pixel column with an explicit full-width escape, not a fluid percentage.
   *Reason: Notion never makes a table obey the document measure, and a single global measure token is how a dense product ends up with a narrow table.*
2. **Opening a record from a dense view must not destroy the dense view — side peek by default.** "Open pages on the right side of the database, with the rest of the database view continuing to be interactive on the left"; centre peek for image-led views; full page as an explicit escalation.
   *Reason: this is precisely the triage-queue interaction, already solved and already named.*
3. **Row-level actions live in a reserved left gutter, revealed on hover, occupying no width when hidden.**
   *Reason: it buys per-row affordances at zero density cost, which is the whole problem with dense rows.*
4. **Every hover-revealed action must also be reachable from one typed command surface.** Notion documents `/` as "essentially a shortcut for the same functionality of the `+` and `⋮⋮` menus."
   *Reason: hover-only actions are invisible to a power user scanning all day, and our advisors are power users.*
5. **The conversational surface is a horizontal layer over the primitives, not a tab.** Ask operates on the selected rows, the open record and the current document, in place.
   *Reason: Notion states this as a decision — "not as a standalone vertical feature, but as a horizontal layer that works with every block and surface" — and it is the difference between an assistant and a chatbot bolted on.*
6. **Never open a blank input; derive the offered actions from selection state.** Drafting actions on empty, editing actions on selection, summarising actions when content exists.
   *Reason: Notion names the blank-input pattern as the thing they were avoiding, and our users need to be shown what the product can answer.*
7. **The accent hue gets the full role matrix or it does not ship.** Text/icon/border/background at primary/secondary/tertiary/strong/accent/interactive, exactly as Notion's brown and orange families do.
   *Reason: a single accent hex gets used six inconsistent ways within a week.*
8. **Nine hues, closed. Semantic trust colours are separate tokens that alias into the ramp, not new hues.**
   *Reason: Notion's entire product runs on nine hue families and no per-feature colour.*
9. **Icons get their own colour ramp, one step lighter than text.** Notion: `--c-icoPri #383836` against `--c-texPri #2c2c2b`.
   *Reason: reusing text colour on icons makes them optically heavier than the text they label.*
10. **Give each of the five archetypes one sentence of documented purpose, and refuse to ship a sixth without one.** Notion's list-versus-gallery split — "few properties, read as documents" versus "showcase images" — is our Ledger-versus-Catalogue split.
    *Reason: it is the only thing that stops five archetypes becoming five ways of drawing a list.*
11. **Density is a per-view setting with a small closed set of steps, not a global preference or a continuous knob.** Verified in Notion: per-column `Wrap text`, drag-resize column widths, a `Calculate` footer per column.
    *Reason: advisors work at different densities in different queues, and a global toggle forces one compromise on all of them.*
12. **Empty states are components with their own tokens, not a paragraph of grey text.** Notion ships `--c-empStaPre*` tokens.
    *Reason: the triage queue at zero, the Catalogue at zero results and Ask before the first question are three of the most-seen screens in the demo.*
13. **Three line-height ratios, not five: 1.5 prose, 1.3 headings, 1.2 titles and chrome.** Notion sets `letter-spacing: normal` at every size measured.
    *Reason: it is the smallest set that reads correctly across a document surface and a data surface, and no tracking table means nothing to get wrong.*
14. **Name the Windows face explicitly in the font stack.** Notion's default stack names `"Segoe UI Variable Display", "Segoe UI"` before `Helvetica` and `Arial`, and ships Inter self-hosted but does not use it for default body prose.
    *Reason: our demo machine is Windows; a stack that leans on `-apple-system` fails silently into Arial.*

# What we should not take

- **Notion's variable naming.** Three-letter truncation (`--c-broTexAccPri`, `--ca-swiButTeaBg`) is unreadable and unsearchable, and the four prefixes `--c-` / `--ca-` / `--cl-` / `--cd-` have no documented meaning we could verify. Take the three tiers and the element × rank matrix; write the names out in full.
- **742 colour variables in one rule.** That is the cost of nine hue families × a full role matrix × alpha variants. We need a warm neutral, one earth-tone accent and the semantic trust colours — building the matrix for nine hues would be weeks of tokens nobody uses.
- **The 76-character measure.** Measured at 68–84 characters on Notion's 720px column. That is wider than the 45–75 convention and it suits Notion's sans; our Document and Conversation surfaces are set in an editorial serif for prose, where a shorter measure is the point. Take the *fixed pixel column with a full-width escape*, choose our own width.
- **Notion's chrome-on-hover density as a whole model.** Notion is an authoring tool; the hover gutter exists because every block is editable. Our Ledger is mostly read. Take the reserved gutter, do not take the assumption that every row is a drag handle away from being restructured.
- **`Turn into` as a user-facing feature.** The *data* lesson (one envelope, transformable) is the valuable half. Letting an advisor turn a booking into a heading is not a feature we want.
- **Material 3's variant set as a model.** Five button variants where Elevated and Tonal overlap by Google's own wording. Use the emphasis-ladder idea, not that ladder.
- **Atomic design's chemistry vocabulary in conversation.** Documented as subjective at the boundaries; Frost's own text says the taxonomy is ours. Use it as a mental model, not as folder names we defend.
- **Style Dictionary as a correctness guarantee.** It validates nothing beyond requiring `value`. Do not let a green build imply a consistent system.
- **Any numeric threshold for "too many variants" or "too many props".** No primary source states one. If we want a limit it is our house rule, and it should be labelled as such.
- **Notion's table density values.** We could not measure them and Notion does not publish them. Nothing in this document should be cited as a Notion row height.
- **Material's `md.comp.fab.primary.container.color` verbosity.** Take the `ref`/`sys`/`comp` infix — it is the cheap half. A five-segment component token for a system with one product and one team is ceremony.
- **Carbon's thirteen spacing steps as a starting number.** Take the *shape* (fine below 20px, widening above) and the "multiples of two, four and eight" rule. Thirteen steps is IBM's answer to IBM's problem; ours should be the smallest ladder our five archetypes actually use.
- **Adobe's platform-scale duality applied everywhere.** Two values per token is right for a genuine desktop/mobile split. If we adopt density postures as a theme (take-list item 2) we should not *also* carry a second value on every size token.
- **Apple HIG values, from this document.** Not verified in this pass. Deliberately out of scope, given the flat direction.

