# Design language — decision

Synthesis of `research-apple.md`, `research-linear.md`, `research-notion-atomic.md` against the brief in `design-language-brief.md`. This supersedes `visual-system.md` where they differ; the frame, the spacing ladder and the row primitive survive intact.

---

## 0. What the research corrected

Three assumptions in the brief were wrong, and it is worth recording them because each changes a decision.

1. **There is no Apple 8pt grid.** Apple publishes no margins, no row heights, no label opacity values. Our spacing ladder is ours to defend on its own merits, not by appeal to Apple.
2. **SF does not track negative at display sizes** — per Apple's own table it turns *positive* at 24pt. It is New York that tightens as it grows. Our display treatment follows the serif's behaviour, not the sans's.
3. **Apple's branding guidance advises the inverse of our split** — custom face for headlines, system face for body. That resolves rather than blocks: New York is itself a system face used as a *reading* face in Books, so serif for prose is defensible. But it sets a hard boundary — **the serif never appears in small metadata.**

## 1. The typefaces

**Inter for the machine. Newsreader for the person.**

Chosen on structure, not resemblance. SF and New York are legally closed to us ("For iOS, OS X and tvOS application uses only… You may not embed the Apple Font"), so the question is which free faces *behave* the way Apple's do:

- Only **Inter** and **Newsreader** carry an **optical-size axis** — Inter `opsz` 14–32, Newsreader `opsz` 6–72, measured from the binaries. That axis is the single structural behaviour that makes SF and New York work across sizes, and it is what separates a real substitute from a lookalike.
- **x-height to cap-height:** Inter 0.750 — the tallest eye in the candidate set, matching SF's screen-first proportion. Newsreader 0.636 — the smallest, so the prose voice reads as a genuinely different register rather than a decorated version of the same one.
- **Source Sans 3 is disqualified outright:** no `tnum` in the variable build. A product whose surfaces are full of aligned money cannot use it.
- Spectral has no variable axes at all.

Both are self-hosted and committed — the demo runs on Windows, so no system stack resolves to anything Apple-like.

## 2. Type roles, not type sizes

The five size utilities are replaced by **composite role tokens**, each bundling family, size, weight, line-height and tracking. This is the documented practice (Material `ref`/`sys`/`comp`, Spectrum alias precedence) and it does something specific for us: **the sans/serif split lives in the role**, so a table cell cannot be set in serif by accident. Correctness stops depending on an author pairing two classes properly.

### The data voice — Inter

Sizes and leading follow Apple's **macOS** table, not the iOS one. Body is 13/16 — a ratio of 1.23, not the web's habitual 1.5. This is what buys enterprise density honestly: the rows get tighter because the type is set correctly, not because we squeezed padding.

| Role | Size / leading / weight |
|---|---|
| `type-data-cell` | 13 / 16 / 400 |
| `type-data-strong` | 13 / 16 / **590** — same size, same leading, weight-first emphasis |
| `type-data-meta` | 12 / 15 / 400 |
| `type-data-micro` | 11 / 14 / **510** — labels, chips, column heads |
| `type-data-figure` | 13 / 16 / 400, `tnum` — money and counts |

**Weight, not size or colour, is the first level of emphasis.** Apple's own macOS Headline is 13pt Bold against 13pt Regular Body — identical size, identical leading. The weight stops are Linear's optically-chosen 510 and 590 rather than the mechanical 500/600, because at 11–13px the mechanical stops read as either invisible or heavy.

### The prose voice — Newsreader

Generous leading, because this is the register where someone reads rather than scans.

| Role | Size / leading / weight |
|---|---|
| `type-prose-lead` | 18 / 27 / 400 — a refusal headline, an answer's opening statement |
| `type-prose-body` | 16 / 25 / 400 — answers, explanations |
| `type-prose-quote` | 15 / 24 / 400 — quoted source excerpts |
| `type-title-page` | 24 / 28 / 500, tracking −0.01em — the serif tightens as it grows |

**Where the serif stops, precisely.** Page titles, answers, quoted excerpts and refusals. Nothing else. Section titles stay in the data voice (`type-data-strong`) because they label machine surfaces rather than speak. The rule in one line: **the serif names the thing you are reading; the sans labels the machine.** Nothing below 15px is ever serif.

## 3. Colour

### The ground — warm paper, three levels

Materials are off the table, so depth comes from **nested solid backgrounds plus hairlines** — Apple's three-level background hierarchy taken as roles:

- `bg-base` — the ground the app sits on
- `bg-raised` — the content panel, cards
- `bg-overlay` — popovers, sheets, the dock

Warm paper, but *low chroma*. A cream ground with a serif and a terracotta accent is the single most over-produced look in contemporary interface design; we take the warmth and decline the cliché by keeping the paper close to white and putting the earth into the neutrals rather than into a highlight.

### Labels — four levels

Apple's four-level label hierarchy as roles: `label-primary`, `label-secondary`, `label-tertiary`, `label-quaternary`. This is how a flat product gets hierarchy without reaching for colour or size.

### The accent — ink, and why

**Proposal: the accent is a warm near-black — an umber-leaning ink — and the semantic trust set carries the only real chroma in the product.**

The reasoning is a collision problem. Earth tones live in the same hue region as our semantic colours: an olive accent fights `verified`, a clay or terracotta accent fights `warn` and `critical`. Since trust state is the product's entire proposition, it must own chroma outright. Pushing the accent to a warm near-black resolves it — the accent reads as earth (brown-based, warm against paper), stays quiet, and makes the trust states *louder by contrast* because nothing else in the interface competes for colour.

Interactive emphasis then comes from fill and weight rather than hue: a filled ink control on paper, which is both editorial and unmistakably Apple in its restraint.

*This is the one open call in the document — see §8.*

### Generation

The ramp is generated in **LCH from three inputs** (base, accent, contrast) rather than hand-tuned, so light and any future high-contrast mode stay in step instead of drifting apart. Contrast is verified against the 4.5:1 floor by computation, not by eye.

## 4. Composition rules adopted

1. **Buy density by dimming chrome, not by shrinking content.** Rows stay readable; the dock, panel borders and secondary labels recede. "Don't compete for attention you haven't earned."
2. **Emphasis ladder: weight → background → colour.** Colour is the last resort and mostly belongs to semantic state.
3. **One display size per screen.** The page title is the only `type-title-page` on a surface.
4. **Vertical space has exactly one owner per archetype.** In Document and Conversation the block owns its own leading and carries no outer margins. In Dashboard, Ledger and Catalogue a Stack parent owns the gap and children carry none. This is the rule that stops spacing drift returning when new components land.
5. **Optical alignment over mathematical.** Icons align to the text baseline and match the text's weight; a glyph nudged half a pixel is correct if it looks aligned.
6. **Flat, and citable — including by Apple's own rule.** Apple's current guidance is explicitly anti-flat, but it draws a line we sit on the right side of: *"Don't use Liquid Glass in the content layer."* Glass is for the floating navigation layer; the content layer uses standard materials, and its purpose is "visual differentiation within the content layer" — which nested solid backgrounds and hairlines also achieve. This product is almost entirely content layer. Linear reached the same place from the other direction, publicly declining Liquid Glass refraction because it "can make dense professional interfaces harder to read." So: flat is not a departure from Apple here, it is Apple's content-layer rule taken literally by a product that is nearly all content.

## 5. Token architecture

Three tiers is the convergent answer across mature systems — Material `ref`/`sys`/`comp`, Spectrum `global`/`alias`/`component-specific`, Carbon `core`/`component`. Primer runs two; Atlassian and Apple publish only one consumable tier. We take three, with the tier written into the name so a violation is visible in a diff:

- **`ref-*`** primitives — raw scales. Never referenced by a component.
- **`sys-*`** semantic aliases — `sys-bg-raised`, `sys-label-secondary`, `type-data-cell`. What components consume.
- **`comp-*`** component tokens — used only inside the component that owns them.

**Precedence** (Spectrum states it most plainly — "alias tokens are the recommended type to use", globals "only when there are no available aliases"): alias by default; primitives only where no alias exists; component tokens never leave their component. Material's pointing rule applies downward — `sys` points at `ref`, `comp` points at `sys`, neither ever holds a literal.

**Naming grammar: flat narrative, kebab-case** — `--sys-bg-raised`, `--sys-label-secondary`. Two grammars exist in the wild: dot-path hierarchical (`md.sys.color.on-primary`) and flat narrative (`--fgColor-onEmphasis`). We take flat, for Spectrum's stated reason — it avoids prioritising a particular coding construct — and because CSS custom properties are flat anyway.

**Name for use, never for value.** A token's name must survive a change to what it holds. `sys-label-secondary`, never `sys-grey-60`.

**One prominence ladder, applied uniformly.** Following Apple rather than inventing: four levels for labels (`primary` / `secondary` / `tertiary` / `quaternary`), three for backgrounds (`base` / `raised` / `overlay`). The asymmetry is Apple's own and is deliberate — text needs more steps than ground does.

**Density and theming live in the semantic tier only.** A density posture re-points spacing and size aliases; there is no `density` prop threaded through components. With five archetypes, such a prop would eventually reach everything.

**Enforcement is the part teams skip.** Atlassian is the model — a typed accessor, lint rules, and a per-token map from raw values back to tokens. Our proportionate version: the existing `grep "text-\["` check becomes a lint rule that fails on arbitrary type sizes and on raw hex outside the token file. Cheap, and it is what stops the drift returning the moment a new surface is written.

## 6. What we are not taking

- **Materials, translucency, vibrancy** — decided out; the research's material guidance is therefore inapplicable, not ignored.
- **Linear's dark-first ramp and periwinkle accent** — fights the paper-and-ink direction.
- **Apple's headline/body inversion** — resolved in §0.3, but noted so nobody re-derives it later.
- **iOS-only interaction patterns** — this is a desktop professional tool; the reference is macOS and iPadOS.
- **Any claim to an Apple grid.** We defend our ladder ourselves.

## 7. Migration — what actually changes

Because the system was locked first, this is mostly a re-point rather than a rewrite.

| Layer | Change | Cost |
|---|---|---|
| Fonts | Self-host Inter + Newsreader variable, wire `opsz` | small |
| Tokens | Rename to `ref`/`sys`/`comp`; add background, label and type role tokens | medium, mechanical |
| Type | Five size classes → composite role tokens; leading tightens on data, opens on prose | medium — one pass per surface, already normalised by the sweep |
| Colour | New warm-paper ramp + ink accent, generated in LCH; semantic set unchanged | small |
| Atoms | Chip, EvidenceDot, LayerBadge, FreshnessDate, SourceTag, MoneyValue, banners re-point to roles; weight-first emphasis replaces size shifts | medium |
| Molecules | Row primitive keeps its grid, gains the data roles and the 16px leading | small |
| Organisms | Ask gains the prose voice — this is where the language is most visible | medium |
| Layouts | Vertical-space ownership rule applied per archetype | small |
| Frame / dock | Ground and hairline re-point; no structural change | small |

**Order:** fonts and tokens → atoms → row primitive and layouts → Ask's prose treatment → surface-by-surface pass → measure and verify contrast.

## 8. The accent — resolved

**The accent is umber ink. The earth lives in the ground and in the semantic set.**

The brief asked for warm paper neutrals and quieter earth-tone colours. Read precisely, that is not a request for an earth-coloured *highlight* — it is a request for a warm, quiet register. So rather than adding a decorative earth accent that would collide with the trust states, the earth goes everywhere the eye actually spends its time:

- **The ground is earth.** Warm paper, warm hairlines, a warm near-black. Nothing in the interface is a neutral grey; every neutral carries a warm hue bias, so the product reads warm continuously rather than at a few accent points.
- **The semantic set is earth.** The trust states leave the primary-colour register entirely: **moss** for verified, **ochre** for stale and important, **claret** for conflict and critical. They stay fully distinguishable and meet contrast, but they read as considered rather than as alarm bells — which suits a product whose whole argument is calm honesty about what it knows.
- **The accent is ink** — a warm near-black. Interactive emphasis comes from fill and weight, not hue.

This resolves three things at once. The collision disappears, because everything is in one family and separates by hue position and lightness rather than by saturation contrast. Chroma stays reserved for meaning, so trust states are the loudest thing on screen — which is correct, since they are the product's proposition. And it declines the cream-ground / serif / terracotta-accent combination that has become the default look of generated design, while being *warmer* than that combination rather than colder.

**Verified contrast on paper (`#FDFCFA`):** moss 6.0:1 · ochre 5.4:1 · claret 7.3:1 · secondary label 7.6:1 — all above the 4.5:1 floor. Tertiary label sits at 3.7:1 and is therefore restricted to non-essential text, matching Apple's own use of its tertiary level.
