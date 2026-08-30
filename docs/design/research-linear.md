# Research: Linear — documented design practice

Purpose: extract *documented* practice from Linear that we can apply to a dense enterprise web application for luxury-travel advisors (dashboard, conversation, catalogue, ledger, document archetypes; bottom dock; triage queue).

## Source tiers — read this before trusting a number

- **Tier A — primary.** `linear.app` essays (`/now`), changelog, docs, and the Linear Method. Everything here is Linear speaking about Linear.
- **Tier B — third-party measurement.** Automated scrapes of the **linear.app marketing site**, not the product. Useful for order-of-magnitude, unreliable for the app. The two Tier B sources **contradict each other** (see Type), so treat any single value as provisional.
- **Inference.** Explicitly labelled. No number appears in this document unless a source states it.

**Important scope warning:** almost all published token data describes the *marketing website*. Linear has never published the application's row heights, control heights, or motion curves. Where that is the case, this document says so rather than guessing.

---

## 1. Density and the row

### What is documented

**The row is a configurable slot machine, not a fixed layout.** Linear's Display options let the user toggle each row property independently. The documented, complete list of show/hide display properties is: ID, status, assignee, priority, SLA, project, due date, milestone, cycle, release, estimate, labels, links, customers, customer revenue, time in status, created date, updated date, pull requests, commits, Sentry issues.
Source: https://linear.app/docs/display-options

**Grouping, sub-grouping and ordering are first-class row-level controls**, not view presets. Grouping by status, assignee, project, priority, cycle, label, parent issue, team, customer, release, SLA status; sub-grouping produces "swim-lane style structure"; ordering by status, manual, priority, last created, last updated, due date, link count, each reversible. Separate toggles for "Sub-issues" and "Show empty groups".
Source: https://linear.app/docs/display-options

**Density was an explicit redesign goal, stated as a triad with hierarchy.** The 2024 UI redesign "improved hierarchy, balance, and density of all interface elements", and specifically: "The Inbox has a new look with increased density and better contrast."
Source: https://linear.app/changelog/2024-03-20-new-linear-ui

**Density is bought by dimming navigation, not by shrinking content.** The redesign adjusted "the sidebar, tabs, headers, and panels to reduce visual noise, maintain visual alignment, and increase the hierarchy and density of navigation elements."
Source: https://linear.app/now/how-we-redesigned-the-linear-ui

**The governing rule for chrome around dense rows:** "Don't compete for attention you haven't earned." In practice the sidebar became "a few notches dimmer", tab bars became "more compact", icon usage was reduced, and coloured backgrounds behind icons were removed.
Source: https://linear.app/now/behind-the-latest-design-refresh

**Separators are a last resort.** "Structure should be felt not seen." Borders had "proliferated across the platform"; the fix was to soften them and round their corners rather than add more.
Source: https://linear.app/now/behind-the-latest-design-refresh

**Selection re-themes the whole row, not just its background.** "when a row is selected, we regenerate the entire theme with the selected background as the new base, so labels, borders, and controls all re-derive against it." This is the single most technically distinctive row behaviour Linear has documented.
Source: https://linear.app/now/styling-linear-for-the-future-stylex

**Rows carry a keyboard-triggered detail preview rather than expanding.** Peek: "Tap `Space` to toggle peek on or off", or "`Space` and *hold* to turn on peek only while `Space` is depressed"; `Esc` closes; `↑`/`↓` move through adjacent items while updating the preview. It shows description, assignee, status, priority, cycle, labels, estimate, created and updated dates. It also works inside the command menu.
Source: https://linear.app/docs/peek

### Spacing base

4px base scale for margins and padding in the product; the marketing site uses an 8px scale (8/16/32/64). Tier B agreement between the two scrapes on a 4px base unit: scale 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 80, 96, 128.
Sources: https://blog.logrocket.com/ux-design/linear-design-ui-libraries-design-kits-layout-grid/ · https://styles.refero.design/style/90ce5883-bb24-4466-93f7-801cd617b0d1

### Not documented — do not fabricate

**Row height, control height, and truncation rules for the Linear application are not published anywhere I could find.** Tier B scrapes cover the marketing site only and contain no list-row spec. Any row height we adopt must be derived from our own type metrics, not borrowed from a number attributed to Linear.

*Inference (labelled):* given a 4px base, a 13px caption/meta size and single-line rows, Linear's list rows are plausibly on a 4px step in the low-to-mid 30s of pixels — but this is visual estimation, not a documented value, and should be treated as a starting hypothesis to test, not a spec.

---

## 2. Type

### What is documented (Tier A — the application)

**Two cuts of one family: a display cut for headings, the text cut for everything else.** The redesign "introduced Inter Display to add more expression to our headings while maintaining their readability" while retaining "regular Inter for the rest of the text elements."
Source: https://linear.app/now/how-we-redesigned-the-linear-ui

This is the key typographic move: **hierarchy comes from a change of cut, not a change of family or a large jump in size.**

### Tier B — the marketing site (and a contradiction)

The two available scrapes disagree, so both are recorded:

- **Refero:** Inter Variable at weights **300, 400, 510, 590**; Berkeley Mono for code. Scale: Display 72/510/1.0/-0.022em; Heading-lg 64/510/1.0/-0.022em; Heading 48/510/1.0/-0.022em; Heading-sm 32/400/1.13/-0.022em; Body-lg 20/590/1.33/-0.012em; Body 17/590/1.6; Body 16/400/1.5; Body-sm 15/400/1.6/-0.011em; Caption 13/400/1.2.
  Source: https://styles.refero.design/style/90ce5883-bb24-4466-93f7-801cd617b0d1
- **VoltAgent DESIGN.md:** custom faces "Linear Display / Linear Text / Linear Mono" with an SF Pro Display fallback stack. Scale: display-xl 80/600/1.05/-3.0px; display-lg 56/600/1.10/-1.8px; display-md 40/600/1.15/-1.0px; headline 28/600/1.20/-0.6px; card-title 22/500/1.25/-0.4px; subhead 20/400/1.40/-0.2px; body-lg 18/400/1.50/-0.1px; body 16/400/1.50/-0.05px; body-sm 14/400/1.50/0; caption 12/400/1.40/0; button 14/500/1.20/0; eyebrow 13/500/1.30/+0.4px; mono 13/400/1.50/0.
  Source: https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/linear.app/DESIGN.md

The most likely reading is that the site has since moved from Inter to a bespoke cut while the app kept Inter/Inter Display. *(Inference.)* The scrapes were taken at different dates.

**Inter feature settings in use:** `cv01`, `ss03`, `zero` — the last of which forces the slashed zero, i.e. an explicit choice for unambiguous numerals in a data product.
Source: https://typescale.app/typescales/typescale-and-typography-system-of-linear

### The transferable rules

1. **Non-standard weight stops.** 510 and 590 rather than 500 and 600 — variable-axis values chosen optically, not from the preset ladder. This is how you get hierarchy at 13–17px without changing size.
2. **Negative tracking scales with size.** -0.022em on large display type, tapering to -0.011em at 15px and 0 at caption sizes.
3. **Line-height inverts against size.** ~1.0 at display, 1.5–1.6 at body, back down to ~1.2 at caption.
4. **Slashed zero on by default** in an interface full of computed numbers.

---

## 3. Colour and contrast

**Themes are generated from three inputs, not hand-authored.** "A custom theme starts with a few inputs, like base color, accent color, and contrast, from which we derive more than a hundred color variables in LCH space." Previously they defined "98 specific variables for each theme"; the new system uses "three: base color, accent color, and contrast."
Sources: https://linear.app/now/styling-linear-for-the-future-stylex · https://linear.app/now/how-we-redesigned-the-linear-ui

**Contrast is a dial, not a fixed value.** The contrast variable "defines how contrasty a theme should be" and enables "super high-contrast themes for users who need it for accessibility reasons." Light/dark parity therefore comes free: both defaults are outputs of the same generator.
Source: https://linear.app/now/how-we-redesigned-the-linear-ui

**Accent is deliberately rationed.** They achieved "a more neutral and timeless appearance" by "limiting how much chrome (blue in our case) was used."
Source: https://linear.app/now/how-we-redesigned-the-linear-ui

**Text contrast was pushed outward symmetrically in both modes:** "making text and neutral icons darker in light mode and lighter in dark mode." Default light and dark themes both gained contrast.
Sources: https://linear.app/now/how-we-redesigned-the-linear-ui · https://linear.app/changelog/2024-03-20-new-linear-ui

**The neutrals moved warm.** Light and dark modes shifted from a "cool, blue-ish hue" toward "a warmer gray" that stays crisp while less saturated, with extensive iteration on hue, chroma and lightness to avoid the interface feeling "muddy."
Source: https://linear.app/now/behind-the-latest-design-refresh

This is directly convergent with our warm-paper-neutral direction, and it is worth noting that Linear arrived there *from* a cool blue-grey and described the risk in the same terms we will face: muddiness.

**Semantic colour is carried on small, low-chroma chips rather than filled rows.** Coloured backgrounds behind icons were removed in the refresh.
Source: https://linear.app/now/behind-the-latest-design-refresh

*Tier B neutral ramps (marketing site, dark).* Refero: Void `#08090a`, Carbon `#0f1011`, Obsidian `#161718`, Graphite `#23252a`, Smoke `#383b3f`, Ash `#62666d`, Fog `#8a8f98`, Mist `#d0d6e0`, Bone `#e5e5e6`, Paper `#ffffff`; semantics Pulse Green `#27a644`, Coral Red `#eb5757`, Signal Teal `#02b8cc`, Iris Violet `#6366f1`. VoltAgent broadly corroborates the ramp (`#010102`/`#0f1011`/`#141516`/`#18191a`, hairline `#23252a`, ink `#f7f8f8`, ink-subtle `#8a8f98`, ink-tertiary `#62666d`) with primary `#5e6ad2` and success `#27a644`. The ramp is **10 steps, tightly bunched at the dark end** — five values inside `#010102`–`#23252a`.
Sources: https://styles.refero.design/style/90ce5883-bb24-4466-93f7-801cd617b0d1 · https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/linear.app/DESIGN.md

---

## 4. Composition and components

**Styling is a contract, and violating it is made hard rather than discouraged.** Components author styles against `stylex.defineVars()` tokens and expose an `sx` prop as "the standard styling interface between components." Linear makes "styling at a distance deliberately difficult" rather than merely conventionally discouraged, maintaining "strong boundaries" with "explicit styling contracts."
Source: https://linear.app/now/styling-linear-for-the-future-stylex

**The constraint is enforced by tooling, not review.** Lint rules catch "common authoring mistakes, design-token usage, and cases where React props can overwrite generated StyleX output"; a repository checker verifies styling APIs and detects where "StyleX's property-level merge behavior can silently remove base or conditional styles"; shared mixins standardise "hover, press, and link behavior."
Source: https://linear.app/now/styling-linear-for-the-future-stylex

**Payoff is measured in CPU, not aesthetics.** "On view-heavy pages, removing runtime style injection reduced main-thread CPU work by roughly 20-to-35%," about "30% faster on a mid-tier machine."
Source: https://linear.app/now/styling-linear-for-the-future-stylex

**No layout grid; a component library instead.** Linear does not use a traditional grid, relying on "a large number of modular components" so each content format is presented "in the best way possible without being constrained by a traditional layout grid."
Source: https://blog.logrocket.com/ux-design/linear-design-ui-libraries-design-kits-layout-grid/

**Command palette is the universal action surface.** `Cmd/Ctrl K` opens the command bar; every common action has a shortcut; `?` opens the shortcut help window. Display settings themselves are keyboard-addressable: `Shift Opt O` ordering, `Shift Opt G` grouping, `Shift Opt R` board rows, `Shift Opt C` board columns; `Cmd/Ctrl B` toggles board layout.
Sources: https://linear.app/docs/display-options · https://linear.app/docs/board-layout

**Keyboard-first is enforceable as a mode.** Linear ships a keyboard-only mode that disables the mouse so users learn keyboard operation. Navigation uses chords (`G` then `A`), single keys (`F` filter, `H` snooze), and natural-language input in filters ("Completed in October", `2d` for two days).
Source: https://gunpowderlabs.com/2024/12/22/linear-delightful-patterns

**Every object is addressable.** "Every issue, project, view in Linear has its own URL."
Source: https://gunpowderlabs.com/2024/12/22/linear-delightful-patterns

**Saying no to UI, stated directly:**
- "We design it so that there's one really good way of doing things." — Jori Lallo
- "Flexible software lets everyone invent their own workflows, which eventually creates chaos as teams scale." — Jori Lallo
- "Your tools should not make you the designer and maintainer of them. A tool should work for you, not the other way around." (Say no to busy work)
- "The simplest way to increase quality is to reduce scope."
Sources: https://www.figma.com/blog/the-linear-method-opinionated-software/ · https://linear.app/method/introduction · https://www.figma.com/blog/karri-saarinens-10-rules-for-crafting-products-that-stand-out/

**Empty states:** no documented Linear position found. Treat as an open question.

---

## 5. Craft details, and the stated *why*

**Alignment work is the explicit example of craft.** They "spent time aligning labels, icons, and buttons, both vertically and horizontally in the sidebar and tabs," and describe this as "not something you'll immediately see but rather something that you'll feel."
Source: https://linear.app/now/how-we-redesigned-the-linear-ui

**The success criterion for a refresh is that nobody notices.** If users don't notice the changes, that's "probably a good sign."
Source: https://linear.app/now/behind-the-latest-design-refresh

**Latency is the design constraint, and it was engineered before the product.** Linear loads most pages in under 50ms by treating IndexedDB as the primary store and the server as a sync target; mutations apply locally first and reconcile in the background; the sync engine hydrates into per-property observables so a 50-issue update is 50 cell re-renders, not a list re-render. Tuomas Artman: "Literally the first lines of code that I wrote was the sync engine, which is very uncommon to what you usually do when you're a startup." The interaction budget cited is sub-100ms.
Sources: https://performance.dev/how-is-linear-so-fast-a-technical-breakdown · https://byteiota.com/local-first-architecture-linears-50ms-page-load-secret/ · https://gunpowderlabs.com/2024/12/22/linear-delightful-patterns

**Press feedback and focus:** interactive elements use `transform: scale(0.97)` on active state for immediate feedback, and all interactive elements carry a visible focus state. Marketing-site focus ring measured as 2px `#5e69d1` at 50% opacity.
Sources: https://blog.logrocket.com/ux-design/linear-design-ui-libraries-design-kits-layout-grid/ · https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/linear.app/DESIGN.md

**Motion timing is essentially undocumented by Linear.** The only figures available are third-party characterisations of "GPU-only animations with sub-100ms durations." No published easing curves, no per-component durations. Do not cite Linear for a motion spec.
Source: https://performance.dev/how-is-linear-so-fast-a-technical-breakdown

**Elevation: they largely avoid drop shadows.** The marketing site is characterised as having no drop shadows, achieving depth via a surface ladder plus 1px hairlines. The measured shadow tokens that do exist are near-invisible inset hairlines (`--shadow-subtle`: `rgb(35,37,42) 0 0 0 1px inset`) plus one large ambient (`--shadow-xl`: `rgba(8,9,10,0.6) 0 4px 32px`) for overlays only.
Sources: https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/linear.app/DESIGN.md · https://styles.refero.design/style/90ce5883-bb24-4466-93f7-801cd617b0d1

**On translucency in dense professional UI — Linear's own verdict.** Building their mobile take on Liquid Glass, they took "its translucency, depth, and physicality" but explicitly refused one effect: "The one effect we chose not to reproduce was Liquid Glass's refraction... refraction can make dense professional interfaces harder to read." Their stated philosophy: "purpose-built, disciplined, and designed for sustained focus."
Source: https://linear.app/now/linear-liquid-glass

This is the strongest available citation *for* our flat direction, from a company that shipped the glass.

**On why craft, from the CEO:** "Design is rarely linear. You work at different levels of abstraction, move between them." Design "was and is about finding the right problem, the right intent, the right vision." And the risk: "My worry isn't the code or the tools themselves. It's a decline in consideration, and with that, a decline in unique, well-designed products."
Source: https://linear.app/now/design-is-more-than-code

---

## 6. The Linear Method

The eight principles, verbatim, with the interface-relevant gloss:

1. **Build for the creators** — "Software project management tools should build with the end users – the creators – in mind."
2. **Purpose-built** — "Productivity software needs to be designed for purpose. It's the only way the product can truly do the heavy lifting."
3. **Create momentum – don't sprint** — "Find a cadence and routine of working... The goal is to maintain a healthy momentum with your teams, not to rush towards the end."
4. **Meaningful direction** — remind everyone of purpose and long-term goals even amid small tasks.
5. **Aim for clarity** — "Don't invent terms if possible, as these can confuse and have different meanings in different teams."
6. **Say no to busy work** — "Your tools should not make you the designer and maintainer of them. A tool should work for you, not the other way around."
7. **Simple first, then powerful** — "A tool should be simple to get started with and grow more powerful as you scale."
8. **Decide and move on** — "Sometimes the most important thing is to make a decision, and move on."

Source: https://linear.app/method/introduction · https://linear.app/method

Karri's craft rules that bear on interface decisions:

- **"The best design is opinionated"** — design for specific users, not everyone.
- **"Consider the spec your baseline minimum viable product, not your goal"** — "For quality, you need a team that views the spec as the baseline, not the finish line."
- **"The simplest way to increase quality is to reduce scope"** — "Quality isn't binary—it's about continuously refining a product to meet a standard."
- **"Quality is not perfection."**
- **"Data can be a crutch"** — "To provide the best experience, you must surprise users. You can't expect data—or even people themselves—to tell you how."

Source: https://www.figma.com/blog/karri-saarinens-10-rules-for-crafting-products-that-stand-out/

---

## What we should take

Ranked. Each with the reason in one line.

1. **Generate the whole palette from three inputs — base, accent, contrast — in LCH.** One generator gives us warm-paper light, a dark mode, and a high-contrast accessibility mode for free, instead of three hand-maintained ramps that drift. *(https://linear.app/now/styling-linear-for-the-future-stylex)*
2. **Re-derive the theme on row selection so labels, borders and controls recompute against the selected background.** Solves the perennial dense-table problem where a selected row's chips and hairlines go illegible; nobody else does this. *(same source)*
3. **Buy density by dimming chrome, not by shrinking content.** "Don't compete for attention you haven't earned" — dim the sidebar and dock, compact the tabs, and let the ledger rows stay at a readable size. *(https://linear.app/now/behind-the-latest-design-refresh)*
4. **Get hierarchy from a display cut plus non-standard weight stops, not from size jumps.** Inter Display for headings, text cut for the rest; weight stops chosen optically (their 510/590 rather than 500/600) — this is exactly how we hold a 13–16px enterprise range together. *(https://linear.app/now/how-we-redesigned-the-linear-ui · https://styles.refero.design/style/90ce5883-bb24-4466-93f7-801cd617b0d1)*
5. **Make the row's visible properties user-configurable from an explicit list, with grouping/sub-grouping/ordering as peers.** Advisors triaging differ from advisors composing an itinerary; one row spec cannot serve both, and 21 documented toggles is Linear's answer. *(https://linear.app/docs/display-options)*
6. **Adopt Peek: spacebar toggles a detail preview, hold-to-peek, arrows move through the list updating the preview, Esc closes.** The cheapest possible bridge from Ledger/Catalogue to Document without a navigation and without an inline row expansion. *(https://linear.app/docs/peek)*
7. **"Structure should be felt not seen" — soften and ration separators before adding any.** Our five archetypes will otherwise accumulate hairlines until the composition reads as a spreadsheet. *(https://linear.app/now/behind-the-latest-design-refresh)*
8. **Ration the accent; push text contrast outward in both modes symmetrically.** Earth-tone accents will read as luxurious only if they are scarce; they got "neutral and timeless" precisely by limiting chrome. *(https://linear.app/now/how-we-redesigned-the-linear-ui)*
9. **Turn on Inter's `zero` feature (slashed zero) and tabular figures for all computed data.** A product about prices, commissions and dates cannot afford an ambiguous 0/O. *(https://typescale.app/typescales/typescale-and-typography-system-of-linear)*
10. **Enforce the token contract with lint rules and a repo checker, and expose one `sx`-style styling interface.** Make styling-at-a-distance *difficult*, not merely discouraged — this is what keeps a five-archetype system coherent past month three. *(https://linear.app/now/styling-linear-for-the-future-stylex)*
11. **Give every object a URL, and make display settings keyboard-addressable.** Advisors work in tabs and send links to colleagues; and keyboard-reachable view controls are what makes density survivable. *(https://linear.app/docs/display-options · https://gunpowderlabs.com/2024/12/22/linear-delightful-patterns)*
12. **Set a sub-100ms interaction budget and treat it as a design constraint, not an engineering one.** Optimistic local mutation is what makes a dense table feel like paper rather than a form. *(https://performance.dev/how-is-linear-so-fast-a-technical-breakdown)*
13. **Spend the unglamorous time on optical alignment of labels, icons and controls.** Their own stated example of craft, and the thing that will carry the "as close to Apple as possible" read more than any single component will. *(https://linear.app/now/how-we-redesigned-the-linear-ui)*
14. **Adopt "Aim for clarity: don't invent terms."** Luxury travel already has a working vocabulary — advisor, property, itinerary, commission — and inventing product jargon over it is pure friction. *(https://linear.app/method/introduction)*

## What we should not take

- **Their dark-first identity and the bunched dark ramp.** Five of their ten neutral steps sit inside `#010102`–`#23252a`. Our warm-paper light mode is the primary register; we need the *distribution* of steps at the light end, so the ramp must be re-derived, not ported. Note that Linear itself moved *toward* warm grey and away from cool blue-grey — we should take the direction of travel, not their endpoint. *(https://linear.app/now/behind-the-latest-design-refresh)*
- **Their accent hue.** `#5e6ad2` periwinkle is a tech-brand blue, and it is the exact chroma family Linear then spent a refresh *reducing*. Our earth tones do the same structural job; do not import the hue.
- **Any shadow tokens or elevation from the marketing site.** `--shadow-xl: rgba(8,9,10,0.6) 0 4px 32px` is a dark-canvas overlay shadow and will read as grubby on warm paper. Take the *principle* (depth from a surface ladder plus 1px hairlines, no drop shadows) and re-author the values.
- **Liquid Glass / translucency, including their mobile version.** They shipped it on mobile navigation only, and explicitly refused refraction because "refraction can make dense professional interfaces harder to read." That sentence is our argument for flat — quote it, don't follow them into the glass. *(https://linear.app/now/linear-liquid-glass)*
- **Their single-family typography as a whole model.** Linear has no prose problem to solve; we do. The transferable part is *hierarchy by cut and optical weight*, which we apply within our sans for computed data. The editorial serif for prose is our own move and has no Linear precedent — do not look for one, and do not let the Linear read flatten the serif out of the Document archetype.
- **Their eight-principle Method as a product process.** It is written for issue-tracking teams (cycles, triage, issues-not-user-stories). Sections 3.1–3.6 are about *how Linear builds*, not how the interface should look; only principles 5, 6, 7 have interface consequences.
- **Any specific row height, control height, or motion curve attributed to Linear.** These are not published. Every Tier B token set describes the marketing site, and the two available scrapes contradict each other on the typeface itself. Derive our row height from our own type metrics on a 4px step.
- **"Data can be a crutch" as licence to skip advisor research.** It is a defensible position for a founder-designed developer tool with the founders as users. We are not our users; luxury-travel advisor workflows are not intuitable from the inside.
