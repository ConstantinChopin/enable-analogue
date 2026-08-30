# Apple interface-design practice, as documented

Research for the Enable analogue: a dense luxury-travel intelligence product for professional
advisors. Direction is "tech humanist, as close to Apple as possible", on the thesis that these
users live in an iOS world personally and the product should feel like somewhere they already know.

Constraints that shape what is usable here: **flat** (no translucency, no vibrancy, no materials),
**enterprise density**, warm paper neutrals with earth accents, and a **type split** — sans for
anything the system computes, editorial serif for anything a person reads as prose.

## How this was sourced

The HIG pages are JavaScript single-page apps; plain fetching returns an empty shell. Every HIG
number below was read from Apple's own DocC JSON, which is the exact payload the rendered page
displays:

```
https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json
```

Human-readable page URLs are cited throughout. Font metrics in section 1 were measured directly
from the shipping binaries (OS/2 and fvar tables) rather than taken from specimen copy.

Three labels are used consistently:

- **Documented** — Apple states it, verbatim.
- **INFERENCE** — my reasoning, not Apple's. Flagged every time.
- **Not documented** — Apple does not publish it. Called out rather than filled with a
  plausible-sounding number from a blog.

---

# 1. Typography

## 1.1 The system families, in Apple's own words

> "**SF Pro.** This neutral, flexible, sans-serif typeface is the system font for Apple platforms.
> SF Pro features nine weights, variable optical sizes for optimal legibility, four widths, and
> includes a rounded variant."

> "**New York.** A companion to San Francisco, this serif typeface is based on essential aspects of
> historical type styles. New York features six weights, supports Latin, Greek, and Cyrillic
> scripts, and features variable optical sizes allowing it to perform as a traditional reading face
> at small sizes and a graphic display face at larger sizes."

Source: <https://developer.apple.com/fonts/>

The HIG adds that NY "is a serif typeface family designed to work well by itself and alongside the
SF fonts" (<https://developer.apple.com/design/human-interface-guidelines/typography>).

**What distinguishes New York from a book serif.** Apple's own framing is the answer: NY is a
*companion* to a UI sans, not a standalone reading face. Three documented consequences:

1. It carries **six weights** on SF's weight ladder, so serif and sans can be set at matching
   weights in the same interface — a book serif typically ships regular/bold and an italic.
2. It has **variable optical sizes** spanning UI captions to display, so one family covers a
   9pt provenance line and a 34pt page title.
3. It is a **system font** on every Apple platform, supporting the same text styles and Dynamic
   Type as SF — meaning it is expected to appear inside chrome, not only inside a text column.

Apple's usage, from the WWDC20 session: "Throughout the system, we have used New York and SF Pro
Rounded in our apps, like here with the Books and Reminders app."
(<https://developer.apple.com/videos/play/wwdc2020/10175/>)

*INFERENCE, not Apple's:* NY's skeleton reads as transitional/Scotch rather than old-style —
near-vertical stress, moderate contrast, sturdy bracketed serifs that survive small sizes on
screen. Apple says only "based on essential aspects of historical type styles" and does not name a
historical model. Do not repeat a specific attribution as fact.

## 1.2 Optical sizes and the Text/Display crossover

The current HIG **no longer states a crossover point**. It describes a continuous axis:

> "the system fonts support dynamic optical sizes, which merge discrete optical sizes (like Text and
> Display) and weights into a single, continuous design, letting the system interpolate each glyph
> or letterform to produce a structure that's precisely adapted to the point size."

Source: <https://developer.apple.com/design/human-interface-guidelines/typography>

The 20pt figure everyone quotes is **historical**, and Apple said so on the record when it changed:

> "We designed SF Text for small sizes below 20 points and SF Display for 20 points and above."

> "This year, with SF Pro becoming a variable font, there is no hard break around 20 points anymore
> and the design now transitions from Text to Display between 17 and 28 points."

Source: WWDC20, *The details of UI typography*,
<https://developer.apple.com/videos/play/wwdc2020/10175/>

**Takeaway:** the honest modern rule is a *transition zone of 17–28pt*, not a switch at 20pt.

## 1.3 Text styles — the actual tables

### iOS / iPadOS, Large (default Dynamic Type size)

| Style | Weight | Size (pt) | Leading (pt) | Emphasized weight |
|---|---|---|---|---|
| Large Title | Regular | 34 | 41 | Bold |
| Title 1 | Regular | 28 | 34 | Bold |
| Title 2 | Regular | 22 | 28 | Bold |
| Title 3 | Regular | 20 | 25 | Semibold |
| Headline | Semibold | 17 | 22 | Semibold |
| Body | Regular | 17 | 22 | Semibold |
| Callout | Regular | 16 | 21 | Semibold |
| Subhead | Regular | 15 | 20 | Semibold |
| Footnote | Regular | 13 | 18 | Semibold |
| Caption 1 | Regular | 12 | 16 | Semibold |
| Caption 2 | Regular | 11 | 13 | Semibold |

### macOS built-in text styles — **the relevant table for a desktop web app**

| Text style | Weight | Size (pt) | Line height (pt) | Emphasized weight |
|---|---|---|---|---|
| Large Title | Regular | 26 | 32 | Bold |
| Title 1 | Regular | 22 | 26 | Bold |
| Title 2 | Regular | 17 | 22 | Bold |
| Title 3 | Regular | 15 | 20 | Semibold |
| Headline | **Bold** | 13 | 16 | Heavy |
| Body | Regular | 13 | 16 | Semibold |
| Callout | Regular | 12 | 15 | Semibold |
| Subheadline | Regular | 11 | 14 | Semibold |
| Footnote | Regular | 10 | 13 | Semibold |
| Caption 1 | Regular | 10 | 13 | Medium |
| Caption 2 | Medium | 10 | 13 | Semibold |

Source for both: <https://developer.apple.com/design/human-interface-guidelines/typography>

Three things worth extracting from the macOS table:

- **The whole desktop system runs on eleven styles across a 10–26pt range.** Body is 13/16.
  Everything dense sits at 10–13pt.
- **Line-height ratios are tight**: Body 13/16 = **1.23**; Caption 10/13 = **1.30**; Large Title
  26/32 = **1.23**. Compare iOS Body 17/22 = 1.29. Apple's desktop leading is tighter than the
  common web default of 1.5.
- **macOS Headline is distinguished by weight alone** — 13pt Bold against 13pt Regular Body, same
  size, same leading. This is the single clearest documented instance of Apple creating hierarchy
  without size and without colour.

### Minimum and default text sizes

| Platform | Default size | Minimum size |
|---|---|---|
| iOS, iPadOS | 17 pt | 11 pt |
| macOS | **13 pt** | **10 pt** |
| tvOS | 29 pt | 23 pt |
| visionOS | 17 pt | 12 pt |
| watchOS | 16 pt | 12 pt |

> "Follow the recommended default and minimum text sizes for each platform — **for both custom and
> system fonts**."

> "If you use a custom font with a thin weight, aim for larger than the recommended sizes to
> increase legibility."

> "In general, avoid light font weights… prefer Regular, Medium, Semibold, or Bold font weights,
> and avoid Ultralight, Thin, and Light font weights."

> "Minimize the number of typefaces you use, even in a highly customized interface. Mixing too many
> different typefaces can obscure your information hierarchy."

Source: <https://developer.apple.com/design/human-interface-guidelines/typography>

## 1.4 Tracking — and a correction to a common belief

Apple publishes full per-point-size tracking tables. **The premise that "SF uses negative tracking
at display sizes" is wrong.** SF Pro's tracking is negative only in a narrow band and turns
**positive above 24pt**. Extract of the iOS/iPadOS/visionOS SF Pro table (identical to the macOS
table at every size checked):

| Size (pt) | Tracking (1/1000 em) | Tracking (pt) |
|---|---|---|
| 10 | +12 | +0.12 |
| 11 | +6 | +0.06 |
| **12** | **0** | **0.0** |
| 13 | −6 | −0.08 |
| 15 | −16 | −0.23 |
| **17** | **−26** | **−0.43** |
| 20 | −23 | −0.45 |
| 22 | −12 | −0.26 |
| **23** | **−4** | **−0.10** |
| **24** | **+3** | **+0.07** |
| 28 | +14 | +0.38 |
| 34 | +12 | +0.40 |
| 48 | +8 | +0.35 |
| 72 | +2 | +0.14 |
| 80+ | 0 | 0 |

The real shape: **positive below 12pt, zero at 12pt, negative from 13–23pt with a trough around
17–20pt (≈ −0.43 to −0.45pt), positive again from 24pt, decaying to zero by 80pt.**

**New York runs the opposite curve** — it *does* tighten monotonically at display sizes:

| Size (pt) | Tracking (1/1000 em) | Tracking (pt) |
|---|---|---|
| 10 | +16 | +0.15 |
| 13 | +4 | +0.05 |
| **15** | **0** | **0.00** |
| 17 | −4 | −0.07 |
| 20 | −10 | −0.20 |
| 28 | −12 | −0.33 |
| 34 | −14 | −0.45 |
| 48 | −14 | −0.68 |
| 72 | −16 | −1.09 |
| 96 | −16 | −1.50 |
| 260 | −18 | −4.57 |

Source for both tables: <https://developer.apple.com/design/human-interface-guidelines/typography>

Why the tables exist at all:

> "It really is an essential part of the behavior of system fonts and the reason why we publish
> tracking tables… if you want to accurately reproduce a system font's behavior, you need to know
> how much tracking to apply for each point size."

Source: <https://developer.apple.com/videos/play/wwdc2020/10175/>

*INFERENCE:* SF's positive tracking above 24pt is almost certainly a *correction* applied on top of
the Display optical cut, which is already natively tight — not an instruction to set headlines
loose. Applied to a substitute face that has no Display cut, copying the positive values would look
wrong. The transferable rule is the **negative band at 13–23pt**, which is exactly the size range
this product's UI lives in.

## 1.5 Leading as a documented density lever

> "In iOS and macOS, tight leading decreases the line height by two points, while loose leading
> increases the line spacing by two points."

> "Sometimes you are working with a more constrained space, so saving spaces between lines can
> increase the information density."

Source: <https://developer.apple.com/videos/play/wwdc2020/10175/>

The HIG gives the rule and its hard limit:

> "if you need to display multiple lines of text in an area where height is constrained — for
> example, in a list row — decreasing the space between lines (tight leading) can help the text fit
> well."

> "**If you need to display three or more lines of text, avoid tight leading** even in areas where
> height is limited."

Source: <https://developer.apple.com/design/human-interface-guidelines/typography>

## 1.6 Dynamic Type principles

macOS has none — "**macOS doesn't support Dynamic Type**" — but the underlying principles are the
ones worth carrying to a web app that must survive browser zoom and user font-size settings.

- "Prioritize important content when responding to text-size changes. Not all content is equally
  important… they don't always want to increase the size of every word on the screen." The example
  Apple gives: tab titles should not grow.
- "Maintain a consistent information hierarchy regardless of the current font size."
- "Keep text truncation to a minimum as font size increases."
- "Consider adjusting your layout at large font sizes… inline items (like glyphs and timestamps)
  and container boundaries can crowd text and cause truncation." Remedy: stack text above secondary
  items, and "**Reduce the number of columns when the font size increases**."
- Accessibility target: "give people the option to enlarge text by at least **200 percent**."
  (<https://developer.apple.com/design/human-interface-guidelines/accessibility>)

Source unless noted: <https://developer.apple.com/design/human-interface-guidelines/typography>

## 1.7 Licence: SF and New York cannot be used here

This is unambiguous and settles the question. The licence is printed on Apple's own fonts page:

> "**APPLE INC. LICENSE AGREEMENT FOR THE APPLE SAN FRANCISCO FONT — For iOS, OS X and tvOS
> application uses only**"

> "THE APPLE SAN FRANCISCO FONT IS TO BE USED SOLELY FOR CREATING MOCK-UPS OF USER INTERFACES TO BE
> USED IN SOFTWARE PRODUCTS RUNNING ON APPLE'S iOS, OS X OR tvOS OPERATING SYSTEMS."

> "The grants set forth in this License **do not permit you to**… install, use or run the Apple Font
> for the purpose of creating mock-ups of user interfaces to be used in software products running
> on **any non-Apple operating system** or to enable others to do so. **You may not embed the Apple
> Font in any software programs or other products.**"

Source: <https://developer.apple.com/fonts/>

A browser-based product is a non-Apple-OS software product and webfont delivery is embedding.
**SF is out, for the app and for the mockups.** The HIG separately says "don't embed system fonts
in your app or game"
(<https://developer.apple.com/design/human-interface-guidelines/typography>).

**New York:** Apple's fonts page prints the full licence text only for San Francisco ("iOS, OS X and
tvOS application uses only") and SF Compact ("Apple watchOS uses only"). *INFERENCE:* the NY licence
ships inside `NY.dmg` and is an Apple Font licence of the same family; I did not verify its exact
wording. Treat NY as equally unusable and do not rely on a distinction I have not confirmed.

## 1.8 Substitutes — measured, not asserted

All nine candidates are **SIL Open Font License 1.1**, confirmed from the `OFL.txt` in each family's
directory in the Google Fonts repository (`github.com/google/fonts/tree/main/ofl/<family>`). All are
free to self-host and embed.

Metrics measured directly from the shipping variable TTFs (OS/2 `sxHeight`, `sCapHeight`, `head`
`unitsPerEm`, `hhea` metrics, `fvar` axes). Ratios are normalised, so they compare across different
em squares:

| Family | x-height / em | cap-height / em | **x / cap** | Default line-height | Variable axes |
|---|---|---|---|---|---|
| **Inter** | 0.546 | 0.728 | **0.750** | 1.210 | `opsz` 14–32, `wght` 100–900 |
| Geist | 0.530 | 0.710 | 0.747 | 1.300 | `wght` 100–900 |
| Public Sans | 0.517 | 0.723 | 0.715 | 1.175 | `wght` 100–900 |
| Instrument Sans | 0.510 | 0.720 | 0.708 | 1.220 | `wdth` 75–100, `wght` 400–700 |
| Source Sans 3 | 0.478 | 0.660 | 0.724 | 1.424 | `wght` 200–900 |
| **Newsreader** | 0.426 | 0.670 | **0.636** | 1.000 | `opsz` 6–72, `wght` 200–800 |
| Literata | 0.507 | 0.700 | 0.724 | 1.485 | `opsz` 7–72, `wght` 200–900 |
| Source Serif 4 | 0.475 | 0.670 | 0.709 | 1.371 | `wght` 200–900, `opsz` 8–60 |
| Spectral | 0.450 | 0.660 | 0.682 | 1.522 | none (static only) |

OpenType features present, checked in `GSUB`/`GPOS` — `tnum` (tabular figures) is non-negotiable for
this product's tables:

| Family | `tnum` | Notable |
|---|---|---|
| Inter | **yes** | `zero` (slashed zero), `cv01`, `salt`, `case`, `frac` — 43 features |
| Geist | yes | `ss01`, `ss02`, `case`, `frac` |
| Public Sans | yes | `onum`/`lnum`, `frac`, `salt` |
| Instrument Sans | yes | `ss01`, `ss02`, `case` |
| **Source Sans 3** | **NO** | 54 features but **no `tnum` in the variable build** |
| Newsreader | yes | minimal set (11 features) |
| Literata | yes | `zero`, `onum`/`lnum`, `frac` |
| Source Serif 4 | yes | `zero`, `onum`/`lnum`, `frac` |
| Spectral | yes | `zero`, `onum`/`lnum`, `frac` |

### Recommendation for SF → **Inter**

Evidence, in order of weight:

1. **Optical size axis.** Inter is the *only* candidate with an `opsz` axis (14–32). That is the one
   structural behaviour that makes SF look like SF — Apple's documented "dynamic optical sizes…
   adapted to the point size", transitioning "between 17 and 28 points". Inter's 14–32 range brackets
   Apple's 17–28 transition zone almost exactly. Geist, Public Sans and Instrument Sans have weight
   only; matching SF's optical behaviour with them is impossible.
2. **Proportions.** Inter's x/cap of 0.750 is the tallest x-height relative to caps in the set —
   the neo-grotesque, screen-first proportion SF shares. Instrument Sans (0.708) and Public Sans
   (0.715) are visibly smaller-eyed; Source Sans 3 (0.724, on a small 0.478 x/em) is a humanist
   Adobe text face and reads as a different genre.
3. **Weight ladder.** 100–900 matches SF Pro's documented **nine weights**. Instrument Sans stops at
   400–700, which cannot express Apple's Regular/Medium/Semibold/Bold hierarchy plus a light caption
   register.
4. **Table features.** `tnum` plus `zero` plus `case`. Source Sans 3 is **disqualified outright** —
   no tabular figures in the variable build, in a product built on dense numeric tables.
5. **Lineage, stated by the designer, in Apple's own vocabulary.** Rasmus Andersson describes Inter
   as "a workhorse of a typeface carefully crafted & designed for a wide range of applications, from
   detailed user interfaces to marketing & signage", with "**Optical size ranges from 'text' to
   'display'**" — the *same* Text/Display axis concept SF uses. He states the mechanism explicitly:
   "The smaller 'text' optical-size designs features a tall x-height to aid in legibility of
   lower-case text", with "contrast-enhancing details like ink traps and bridges", while the display
   cut has "clean lines, smooth curves and delicate details". Licence stated on the same page: SIL
   Open Font License 1.1. (<https://rsms.me/inter/>) This is the closest documented parallel to
   Apple's own optical-size rationale of any candidate.

Honest caveat: Inter's default line-height metric is 1.21 and it is a *cooler*, more mechanical face
than SF, which has more humanist detail in `a`, `g`, `t` terminals. Against a warm paper palette
Inter can read slightly clinical. **Geist is the credible runner-up** — nearly identical proportions
(x/cap 0.747), slightly warmer, but no optical axis. *INFERENCE:* if the design turns out to want
warmth over fidelity, Geist is the swap; the token layer should make it a one-line change.

### Recommendation for New York → **Newsreader**

Evidence:

1. **The optical-size argument again, and it is decisive.** Apple's stated reason NY exists is
   "variable optical sizes allowing it to perform as a traditional reading face at small sizes and a
   graphic display face at larger sizes". Newsreader's `opsz` runs **6–72**, the widest in the set,
   and Production Type built it precisely as three optical cuts — Caption, Text, Display. Spectral
   has **no variable axes at all** and is out on that basis.
2. **Design brief matches ours.** Production Type: designed "for on-screen, longer-form reading",
   for "readers of news streams and publishing platforms", aiming at "elegant, sturdy, contemporary
   and bookish". That is the answer surface and the quoted excerpt, exactly.
   (<https://productiontype.com/font/newsreader>)
3. **Contrast against the sans.** Newsreader's x/cap of **0.636** is the lowest in the set — a
   markedly smaller eye than Inter's 0.750. This is a feature, not a defect: the prose voice should
   be visibly a *different register*, not a serif-ised version of the UI font. Literata (0.724) sits
   so close to Inter that the split would read as an accident.
4. Weight range 200–800 covers the six-weight ladder NY offers.

Honest caveats: Newsreader has the thinnest OpenType feature set of the serifs (11 features, no
`zero`, no oldstyle/lining toggle) — but it *does* have `tnum`, which is what provenance lines need.
Its default line-height metric is 1.000, so **line-height must be set explicitly everywhere**; do
not rely on the font's own metrics. **Source Serif 4 is the runner-up** if the smaller eye proves
too quiet at 13–15pt: `opsz` 8–60, x/cap 0.709, and a much richer feature set.

Rejected and why: **Spectral** — no variable axes, contradicts the one thing NY is *for*.
**Literata** — too close to Inter's proportions to make the sans/serif split legible.

---

# 2. Layout and spacing

## 2.1 The most important finding: Apple publishes almost no numbers

This needs saying before anything else, because the gap is usually filled with folklore.

**Apple does not document:**

1. **Margin values** for iOS, iPadOS or macOS. The HIG names the layout guides — a layout guide
   "defines a rectangular region", and the system "includes predefined layout guides that make it
   easy to apply standard margins around content" — but never publishes their measurements.
2. **Any spacing scale or grid unit.** The "8pt grid" is **not Apple guidance**. It appears nowhere
   in the HIG.
3. **List or table row heights**, or row content padding, on any platform.
4. **Separator inset behaviour**, and there is no plain / grouped / inset-grouped comparison in the
   HIG at all. The phrase "inset grouped" does not appear.
5. **Toolbar heights**, any platform.
6. **Sidebar widths**, or any macOS sidebar-to-content proportion.
7. **Inspector widths** — there is no `/inspectors` HIG page; that URL 404s.
8. **macOS mini/small/regular/large control point values.** (The 28/32/44/52/64 table that
   circulates is the **visionOS** button table, not macOS.)
9. **Size-class point breakpoints**, or minimum iPad window dimensions.
10. **macOS window default or minimum sizes.**

Sources: <https://developer.apple.com/design/human-interface-guidelines/layout>,
<https://developer.apple.com/design/human-interface-guidelines/lists-and-tables>,
<https://developer.apple.com/design/human-interface-guidelines/sidebars>,
<https://developer.apple.com/design/human-interface-guidelines/toolbars>,
<https://developer.apple.com/design/human-interface-guidelines/windows>

**Consequence for us:** the spacing scale is ours to invent. There is no Apple number to be faithful
to. Fidelity to Apple in spacing means fidelity to the *type metrics* (section 1.3) and to the
*minimum-size and padding rules* (section 2.4), which are documented.

## 2.2 Layout rules that are documented

- "Group related items to help people find the information they want… you might use negative space,
  background shapes, colors, materials, or separator lines."
- "Make essential information easy to find by giving it sufficient space. People want to view the
  most important information right away, so don't obscure it by crowding it with nonessential
  details."
- "Place items to convey their relative importance. People often start by viewing items in reading
  order — that is, from top to bottom and from the leading to trailing side."
- "**Align components with one another to make them easier to scan** and to communicate organization
  and hierarchy… Along with indentation, alignment can also help people understand an information
  hierarchy."
- "Take advantage of progressive disclosure to help people discover content that's currently
  hidden."
- "Make controls easier to use by providing enough space around them and grouping them in logical
  sections. If unrelated controls are too close together — or if other content crowds them — they
  can be difficult for people to tell apart."
- macOS: "**Avoid placing controls or critical information at the bottom of a window.** People often
  move windows so that the bottom edge is below the bottom of the screen."
- Safe area definition: "A safe area defines the area within a view that isn't covered by a toolbar,
  tab bar, or other views a window might provide."

Source: <https://developer.apple.com/design/human-interface-guidelines/layout>

The only hard inset numbers on the Layout page are tvOS: "Inset primary content 60 points from the
top and bottom of the screen, and 80 points from the sides", and the tvOS grid tables (horizontal
spacing 40pt, minimum vertical spacing 100pt at every column count; unfocused content width 860pt
for two columns down to 160pt for nine). Neither transfers to a desktop web app.

## 2.3 Size classes and adaptation

Definition, verbatim:

> "A size class is a value that's either regular or compact, where **regular** refers to a larger
> screen or a screen in landscape orientation and **compact** refers to a smaller screen or a screen
> in portrait orientation."

Apple publishes the full device mapping table — all iPads are regular/regular in both orientations;
Max/Plus-class iPhones go regular-width/compact-height in landscape; all other iPhones are
compact/compact in landscape. Apple does **not** publish the point breakpoint at which the class
flips.

The adaptation guidance is behavioural, and it is the useful part:

> "As someone resizes a window, **defer switching to a compact view for as long as possible**."

> "**Design for a full-screen view first**, and only switch to a compact view when a version of the
> full layout no longer fits. This helps the UI feel more stable and familiar."

> "For more complex layouts such as [split views], **prefer hiding tertiary columns such as
> inspectors** as the view narrows."

> "Test your layout at common system-provided sizes" — halves, thirds and quadrants of the screen.

Split views: "Prefer using a split view in a regular — not a compact — environment."

Sources: <https://developer.apple.com/design/human-interface-guidelines/layout>,
<https://developer.apple.com/design/human-interface-guidelines/split-views>

## 2.4 Control sizes and spacing — the documented density floor

This is the richest numeric material, and it lives on the **Accessibility** page, not Layout.

| Platform | Default control size | Minimum control size |
|---|---|---|
| iOS, iPadOS | 44 × 44 pt | 28 × 28 pt |
| **macOS** | **28 × 28 pt** | **20 × 20 pt** |
| tvOS | 66 × 66 pt | 56 × 56 pt |
| visionOS | 60 × 60 pt | 28 × 28 pt |
| watchOS | 44 × 44 pt | 28 × 28 pt |

> "Controls that are too small are hard for many people to interact with and select. Strive to meet
> the recommended minimum control size for each platform."

Two corrections to common belief: 44 × 44 is the iOS **default** with 28 × 28 as the floor, not a
single hard rule; and **28 × 28 is the macOS default**, with 20 × 20 the macOS floor. The Buttons
page frames 44 × 44 as a **hit region**, not a visual size: "a button needs a hit region of at least
44x44 pt… to ensure that people can select it easily, whether they use a fingertip, a pointer, their
eyes, or a remote."

**The padding rule — the one real spacing number Apple publishes:**

> "In general, it works well to add about **12 points of padding** around elements that include a
> bezel. For elements without a bezel, about **24 points of padding** works well around the
> element's visible edges."

> "Consider spacing between controls as important as size."

Stated identically on two pages:
<https://developer.apple.com/design/human-interface-guidelines/accessibility> and
<https://developer.apple.com/design/human-interface-guidelines/pointing-devices>.

The failure modes are given both ways: "If the hit region is too small, it can make people feel that
they have to be extra precise"; too large and "people can feel that it takes a lot of effort to pull
the pointer away."

Sources: <https://developer.apple.com/design/human-interface-guidelines/accessibility>,
<https://developer.apple.com/design/human-interface-guidelines/buttons>,
<https://developer.apple.com/design/human-interface-guidelines/pointing-devices>

## 2.5 Lists and tables

The lists-and-tables page contains **zero numbers**. What it does contain:

- "Prefer displaying text in a list or table… the row-based format is especially well suited to
  making text easy to scan and read." Use a collection instead for items that "vary widely in size".
- "Keep item text succinct so row content is comfortable to read." If each item carries a lot of
  text, "consider alternatives that help you avoid displaying over-large table rows. For example,
  you could list item titles only, letting people choose an item to reveal its content in a detail
  view."
- Narrow columns: "an ellipsis in the middle of text can make an item easier to distinguish because
  it preserves both the beginning and the end of the content."
- "Use descriptive column headings in a multicolumn table. Use nouns or short noun phrases with
  [title-style capitalization], and don't add ending punctuation."
- Selection feedback: "a table that helps people navigate through a hierarchy **persistently
  highlights the selected row** to clarify the path people are taking." A table of options
  "highlights a row only briefly before adding an image — such as a checkmark".

macOS multi-column rules, all four of them:

- "let people click a column heading to sort a table view based on that column. If people click the
  heading of a column that's already sorted, re-sort the data in the opposite direction."
- "**Let people resize columns.** Data displayed in a table view often varies in width."
- "**Consider using alternating row colors in a multicolumn table.** Alternating colors can help
  people track row values across columns, especially in a wide table."
- "Use an outline view instead of a table view to present hierarchical data."

Apple names only three list styles across the entire page, in passing: the iOS/iPadOS **grouped**
style, which "uses headers, footers, and additional space to separate groups of data"; the watchOS
**elliptical** style; and the macOS **bordered** style, which "uses alternating row backgrounds to
help make large tables easier to use".

Source: <https://developer.apple.com/design/human-interface-guidelines/lists-and-tables>

## 2.6 Chrome: sidebars, split views, toolbars

**Sidebars** (<https://developer.apple.com/design/human-interface-guidelines/sidebars>)

- Three sizes: "A sidebar's row height, text, and glyph size depend on its overall size, which can
  be **small, medium, or large**." Users can change it in General settings.
- "In general, **show no more than two levels of hierarchy in a sidebar**." Deeper than that,
  "consider using a split view interface that includes a content list."
- "Consider automatically hiding and revealing a sidebar when its container window resizes."
- "Avoid putting critical information or actions at the bottom of a sidebar."
- Widths: **not documented.**

**Split views** (<https://developer.apple.com/design/human-interface-guidelines/split-views>)

- The one hard macOS number in this whole area: "**The thin divider measures one point in width**,
  giving you maximum space for content." And: "Avoid using thicker divider styles unless you have a
  specific need."
- "Set reasonable defaults for minimum and maximum pane sizes" — if a pane gets too small "the
  divider can seem to disappear". No values given.
- Proportions are documented for tvOS only: "a split view devotes a third of the screen width to the
  primary pane and two-thirds to the secondary pane."

**Toolbars** (<https://developer.apple.com/design/human-interface-guidelines/toolbars>)

- Heights: **not documented**, any platform. The density guidance is structural instead:
- "Choose items deliberately to avoid overcrowding."
- "Minimize the number of groups… In general, aim for a maximum of three."
- "keep the title under 15 characters long so you leave enough room for other controls."
- Three item locations: **leading edge** (not customizable), **center area** (items "automatically
  collapse into the system-managed overflow menu when the window shrinks"), **trailing edge** (items
  "remain visible at all window sizes"). Trailing edge holds "buttons that open nearby inspectors".
- "The system automatically adds an overflow menu… **Don't add an overflow menu manually**", and
  "avoid layouts that cause toolbar items to overflow by default".
- "Separate text-labelled buttons with fixed space" — adjacent text "may appear to run together,
  making the buttons indistinguishable".

**Inspectors** — no dedicated page. Guidance is scattered: an inspector "displays the details of the
currently selected item, automatically updating its contents"
(<https://developer.apple.com/design/human-interface-guidelines/panels>); it "typically presents
information on the trailing side of a split view"
(<https://developer.apple.com/design/human-interface-guidelines/windows>). Crucially, a panel whose
contents *don't* change with selection — an Info window — "always maintains the same contents" and
should be a regular window instead.

**Windows** (<https://developer.apple.com/design/human-interface-guidelines/windows>)

- Two conceptual types: **primary** (main navigation and content) and **auxiliary** (one specific
  task, no navigation).
- "Avoid putting critical information or actions in a bottom bar, because people often relocate a
  window in a way that hides its bottom edge."

## 2.7 The macOS density statement

The single sentence that best states Apple's desktop intent, and the one to hold the whole product
against:

> "**Leverage large displays to present more content in fewer nested levels and with less need for
> modality, while maintaining a comfortable information density that doesn't make people strain to
> view the content they want.**"

Source: <https://developer.apple.com/design/human-interface-guidelines/designing-for-macos>

---

# 3. Colour

## 3.1 The system colours — the only palette Apple publishes with numbers

Apple publishes a single unified table (no longer per-platform) as **sRGB triplets, not hex**, with
four columns: default light, default dark, increased-contrast light, increased-contrast dark.

| Colour | Default light | Default dark | Inc. contrast light | Inc. contrast dark |
|---|---|---|---|---|
| Red | 255, 56, 60 | 255, 66, 69 | 233, 21, 45 | 255, 97, 101 |
| Orange | 255, 141, 40 | 255, 146, 48 | 197, 83, 0 | 255, 160, 86 |
| Yellow | 255, 204, 0 | 255, 214, 0 | 161, 106, 0 | 254, 223, 67 |
| Green | 52, 199, 89 | 48, 209, 88 | 0, 137, 50 | 74, 217, 104 |
| Mint | 0, 200, 179 | 0, 218, 195 | 0, 133, 117 | 84, 223, 203 |
| Teal | 0, 195, 208 | 0, 210, 224 | 0, 129, 152 | 59, 221, 236 |
| Cyan | 0, 192, 232 | 60, 211, 254 | 0, 126, 174 | 109, 217, 255 |
| Blue | 0, 136, 255 | 0, 145, 255 | 30, 110, 244 | 92, 184, 255 |
| Indigo | 97, 85, 245 | 109, 124, 255 | 86, 74, 222 | 167, 170, 255 |
| Purple | 203, 48, 224 | 219, 52, 242 | 176, 47, 194 | 234, 141, 255 |
| Pink | 255, 45, 85 | 255, 55, 95 | 231, 18, 77 | 255, 138, 196 |
| **Brown** | **172, 127, 94** | **183, 138, 102** | **149, 109, 81** | **219, 166, 121** |

Source: <https://developer.apple.com/design/human-interface-guidelines/color>

Notes that matter:

- Values date to a **June 9, 2025** update ("Updated system color values"), revised again
  December 16, 2025. Apple's own caveat: the published values are for reference during design and
  "may fluctuate from release to release."
- Apple's heading is literally "**Avoid hard-coding system color values in your app.**"
- They "vary subtly depending on the system appearance," and dark values are not inversions:
  "while many colors are inverted, some are not."
  (<https://developer.apple.com/design/human-interface-guidelines/dark-mode>)
- **Brown is a real Apple system colour.** For a product whose accent register is earth tones, this
  is the closest documented Apple precedent — see 3.5.

### System grays — six levels, iOS/iPadOS only

| Name | Default light | Default dark | Inc. contrast light | Inc. contrast dark |
|---|---|---|---|---|
| systemGray | 142, 142, 147 | 142, 142, 147 | 108, 108, 112 | 174, 174, 178 |
| systemGray2 | 174, 174, 178 | 99, 99, 102 | 142, 142, 147 | 124, 124, 128 |
| systemGray3 | 199, 199, 204 | 72, 72, 74 | 174, 174, 178 | 84, 84, 86 |
| systemGray4 | 209, 209, 214 | 58, 58, 60 | 188, 188, 192 | 68, 68, 70 |
| systemGray5 | 229, 229, 234 | 44, 44, 46 | 216, 216, 220 | 54, 54, 56 |
| systemGray6 | 242, 242, 247 | 28, 28, 30 | 235, 235, 240 | 36, 36, 38 |

Source: <https://developer.apple.com/design/human-interface-guidelines/color>

Two observations. `systemGray` is **identical in light and dark**. Grays 2–6 **run in opposite
directions** between modes — progressively lighter in light mode, progressively darker in dark.
And every one of them is a **cool** gray: blue channel exceeds red at every level (142/147,
242/247, 229/234). Our palette is warm paper, so these are structurally instructive and
chromatically wrong for us — see 3.5.

The current HIG gives no purpose statement for the grays. The archived pre-2022 HIG introduced them
as "six opaque gray colors you can use in rare cases where translucency doesn't work well" —
**archived, superseded, cited only for intent**
(<https://web.archive.org/web/2019/https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/color/>).

## 3.2 Semantic meaning versus accent

This is the distinction the brief asked about, and Apple draws it sharply.

- **Semantic colours are defined by purpose:** each dynamic system colour is "semantically defined by
  its purpose, rather than its appearance or color values."
- **Accent is brand, and the user can overrule it.** "Consider choosing an accent color"
  (<https://developer.apple.com/design/human-interface-guidelines/branding>). On macOS 11+, if a
  user picks a different accent colour, "the system applies their chosen color… replacing your
  accent color." The documented exception is a fixed-colour sidebar icon, because it "uses a
  specific color to provide meaning."
- **Tint is the meaning-carrying override.** SwiftUI's `tint(_:)`: unlike an app's accent colour,
  "the tint color is always respected and should be used as a way to provide additional meaning to
  the control." Apple's example tints Answer green and Decline red.
  (<https://developer.apple.com/documentation/swiftui/view/tint(_:)>)
- **Destructive is not the accent.** "A primary button uses an app's accent color, whereas a
  destructive button uses the system red color."
  (<https://developer.apple.com/design/human-interface-guidelines/buttons>) Role is a first-class
  API concept — `ButtonRole` has `.destructive`, `.cancel`, `.confirm`, `.close`
  (<https://developer.apple.com/documentation/swiftui/buttonrole>).
- **Don't repurpose:** heading "Avoid redefining the semantic meanings of dynamic system colors" —
  don't use `separator` as a text colour, or a secondary label colour as a background.
- **Don't overload:** heading "Avoid using the same color to mean different things."

Source unless noted: <https://developer.apple.com/design/human-interface-guidelines/color>

### Never colour alone

> "Avoid relying solely on color to differentiate between objects, indicate interactivity, or
> communicate essential information."

Remedy Apple prescribes: text labels or glyph shapes. The Accessibility page repeats it — "Convey
information with more than color alone" — names red-green and blue-orange as difficult pairings, and
prescribes "distinct shapes or icons" alongside colour.
(<https://developer.apple.com/design/human-interface-guidelines/accessibility>)

### Restraint in the current (Liquid Glass era) guidance

- Apply colour sparingly.
- For prominent buttons, "apply color to the **background** rather than to symbols or text."
- "Refrain from adding color to the background of multiple controls."
- Prefer monochromatic toolbars and tab bars over colourful content.
- "Use tinting to help primary actions stand out clearly."
  (<https://developer.apple.com/videos/play/wwdc2025/356/>)

Source: <https://developer.apple.com/design/human-interface-guidelines/color>

## 3.3 The label hierarchy — and an important negative finding

**Apple does not publish opacity percentages for the label levels.** Not on the current HIG colour
page, not on `ui-element-colors`, not on the individual `UIColor` symbol pages, and not in the
archived pre-2022 HIG. The system colours' RGB values are published (embedded in swatch image alt
text); the label/fill/separator alphas are not published anywhere.

The widely circulated figures — secondaryLabel 60 %, tertiaryLabel 30 %, quaternaryLabel 18 % over
`rgb(60,60,67)`; fills 20/16/12/8 %; separator 29 % — are **non-primary and unverified**, derived
from community runtime introspection of `UIColor`, e.g.
<https://gist.github.com/eonist/7b5abce6979ce4a272c5de57eb0fb550/> and
<https://sarunw.com/posts/dark-color-cheat-sheet/>. Do not cite them as Apple's.

Apple's position is that the *name* is the contract, not the value: the names "reflect their
intended use, rather than specific color values."
(<https://developer.apple.com/documentation/uikit/ui-element-colors>)

What Apple **does** document:

**Labels** — four levels, purpose only: `label` (primary content), `secondaryLabel`,
`tertiaryLabel`, `quaternaryLabel`.

**Fills** — documented by the *size of shape they go behind*, and they carry transparency ("System
fill colors incorporate transparency to allow the background color to show through"):

| Token | For |
|---|---|
| `systemFill` | thin/small shapes — "the track of a slider" |
| `secondarySystemFill` | medium shapes — the background of a switch |
| `tertiarySystemFill` | large shapes — input fields, search bars, buttons |
| `quaternarySystemFill` | large areas with complex content — an expanded table cell |

**Separators** — `separator` "may be partially transparent to allow the underlying content to show
through"; `opaqueSeparator` "is always opaque."

**Backgrounds** — two parallel sets of three. `systemBackground` / `secondarySystemBackground` /
`tertiarySystemBackground`, and the grouped variants `systemGroupedBackground` /
`secondarySystemGroupedBackground` / `tertiarySystemGroupedBackground`, the latter "for grouped
content, including table views and platter-based designs." The levels are **structural, not
decorative**:

> primary = the overall view · secondary = grouping within the overall view · tertiary = grouping
> within secondary elements

Also documented: `placeholderText`, `link`, `tintColor` (resolves at runtime from the trait
hierarchy), and non-adapting `darkText` / `lightText`. macOS has a separate, larger AppKit table
(~37 entries: `labelColor`, `secondaryLabelColor`, `tertiaryLabelColor`, `quaternaryLabelColor`,
`separatorColor`, `controlAccentColor`, `windowBackgroundColor`, …) — again names and purposes, no
values.

The ordering rule *is* stated explicitly, in the vibrancy section of Materials:

> "The default level has the highest contrast, whereas **quaternary (when it exists) has the lowest
> contrast**."

Sources: <https://developer.apple.com/documentation/uikit/ui-element-colors>,
<https://developer.apple.com/design/human-interface-guidelines/color>,
<https://developer.apple.com/design/human-interface-guidelines/materials>

## 3.4 Contrast

Apple's table, reproduced exactly — note the middle row reads "18 pts", not "18 pts and larger":

| Text size | Text weight | Minimum contrast ratio |
|---|---|---|
| Up to 17 pts | All | **4.5:1** |
| 18 pts | All | **3:1** |
| All | Bold | **3:1** |

Source: <https://developer.apple.com/design/human-interface-guidelines/accessibility>

- Apple notes Accessibility Inspector uses these WCAG Level AA values, and names two measurement
  standards: **WCAG** and **APCA**.
- **A stricter number exists for custom colours**, on the Dark Mode page: "make sure the contrast
  ratio between colors is no lower than 4.5:1," and for custom foreground/background pairs "strive
  for a contrast ratio of **7:1**, especially in small text."
  (<https://developer.apple.com/design/human-interface-guidelines/dark-mode>)
- **Non-text contrast is absent from the HIG.** The 3:1 figure for interactive controls and non-text
  state exists only in App Store Connect Help, and is phrased as "commonly recommended" rather than
  as an Apple requirement.
  (<https://developer.apple.com/help/app-store-connect/manage-app-accessibility/sufficient-contrast-evaluation-criteria/>)
- **Increase Contrast** is a real user setting with a real API surface —
  `UIAccessibility.isDarkerSystemColorsEnabled`, the `UIAccessibilityContrast` trait
  (`.unspecified` / `.normal` / `.high`), and SwiftUI's `@Environment(\.colorSchemeContrast)`
  returning `.standard` or `.increased`. Apple: the value "depends entirely on user settings, and
  you can't change it."
  (<https://developer.apple.com/documentation/swiftui/environmentvalues/colorschemecontrast>)
- Obligation if you define a custom colour: "supply light and dark variants, **and an increased
  contrast option for each variant**."

## 3.5 What this means for a warm paper palette — INFERENCE

Everything in this subsection is my reasoning, not Apple's.

- Apple's greys are **cool** at every level. Copying their values would fight the paper-toned
  direction. What transfers is the **structure** — a base gray identical across modes, then a
  numbered ramp — not the hues. Build a warm equivalent with the same number of steps and the same
  light/dark inversion behaviour.
- Apple's four-level label hierarchy is the single most portable idea in this section, and it costs
  nothing: primary / secondary / tertiary / quaternary, defined by *role*, with values as an
  implementation detail. Since Apple publishes no alphas, we are free to tune ours to warm paper —
  and we are not "deviating from Apple" by doing so, because there is no published number to deviate
  from.
- **Brown (172, 127, 94)** is the documented Apple system colour nearest our earth-tone accent
  register, and it is a legitimate precedent for an earth accent being a *system* colour rather than
  a decorative one.
- The three-level background hierarchy (view → group → group-within-group) maps directly onto
  page → card → nested row, and is a stronger organising principle for us than borders, since we
  cannot use materials.

---

# 4. Composition principles

## 4.1 Clarity, deference, depth — what the current HIG actually says

**Finding: the triad is no longer live guidance.** "Deference" does not appear as a named design
theme anywhere in the current HIG. I searched the DocC JSON of the typography, layout, colour,
materials, lists-and-tables, sidebars, split-views, toolbars, windows, tab-bars, buttons,
accessibility, branding, designing-for-iOS and designing-for-macOS pages: the word "deference"
appears **zero times**. The triad was the iOS 7 design-themes framing and has been retired from the
guidelines.

**What replaced it: a "Design principles" page, reintroduced June 8, 2026** (its own change log reads
"Reintroduced design principles"). Eight groups, each with named sub-principles: **Purpose**,
**Agency**, **Responsibility**, **Familiarity**, **Flexibility**, **Simplicity**, **Craft**,
**Delight**. The three most load-bearing for us:

> **"Establish hierarchy."** — "Prioritize recognizable controls and a consistent structure."
> (under Simplicity)

> **"Stay out of the way."** — "The best designs are unobtrusive and present when people need them."
> (under Agency)

> **"Include just what's necessary."** — "**Simplicity isn't minimalism.** Aim for a focused, useful
> experience." (under Simplicity)

Source: <https://developer.apple.com/design/human-interface-guidelines/design-principles>

For the record, the original triad — banner-marked "Retired Document" — read: Deference, "The UI
helps users understand and interact with the content"; Clarity, "Text is legible at every size, icons
are precise and lucid"; Depth, "Visual layers and realistic motion heighten users' delight and
understanding."
(<https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/TransitionGuide/index.html>)
The themes disappeared in the June 2022 HIG rebuild, which "merged its platform-specific guidance
into a unified document" (<https://developer.apple.com/news/?id=v8a3aetj>).

The *idea* of deference survives in two other places. On the Branding page:

> "**Ensure branding always defers to content.** Using screen space for an element that does nothing
> but display a brand asset can mean there's less room for the content people care about. Aim to
> incorporate branding in refined, unobtrusive ways that don't distract people from your
> experience."

> "Resist the temptation to display your logo throughout your app or game unless it's essential for
> providing context. People seldom need to be reminded which app they're using, and it's usually
> better to use the space to give people valuable information and controls."

Source: <https://developer.apple.com/design/human-interface-guidelines/branding>

**Depth** has been replaced by an explicit *layer* model in the Liquid Glass era — and this is the
part that transfers even though the material does not:

> "Liquid Glass forms a **distinct functional layer for controls and navigation elements** — like tab
> bars and sidebars — that **floats above the content layer**, establishing a clear visual hierarchy
> between functional elements and content."

> "**Don't use Liquid Glass in the content layer.** Liquid Glass works best when it provides a clear
> distinction between interactive elements and content, and including it in the content layer can
> result in unnecessary complexity and a confusing visual hierarchy."

Source: <https://developer.apple.com/design/human-interface-guidelines/materials>

*INFERENCE:* the durable principle is **two layers — chrome and content — that never borrow each
other's treatment**. Apple's current means of expressing that separation is a material; ours has to
be something else (see 4.5 and the recommendations). The separation itself is the Apple idea, not
the glass.

And in the Liquid Glass framing itself, where deference is restated almost verbatim:

> "Its primary goal is to remain visually clear, **deferring to the content underneath**."

Source: WWDC25, *Meet Liquid Glass*, <https://developer.apple.com/videos/play/wwdc2025/219/>

**Clarity** persists as scattered concrete rules rather than a named theme — the legibility minimums
(1.3), "Minimize the number of typefaces you use", "Choose items deliberately to avoid
overcrowding", "avoid relying solely on color".

## 4.2 Hierarchy and emphasis

- "**Adjust font weight, size, and color as needed to emphasize important information** and help
  people visualize hierarchy. Be sure to maintain the relative hierarchy and visual distinction of
  text elements when people adjust text sizes."
- The text styles exist for exactly this: "Taken together, the text styles form a typographic
  hierarchy you can use to express the different levels of importance in your content."
- "The system-defined text styles give you a convenient and consistent way to convey your
  information hierarchy through **font size and weight**."
- "System APIs define font adjustments — called symbolic traits… For example, **the bold trait adds
  weight to text, letting you create another level of hierarchy.**"
- "Maintain a consistent information hierarchy regardless of the current font size."

Source: <https://developer.apple.com/design/human-interface-guidelines/typography>

From Layout:

- "Place items to convey their relative importance. People often start by viewing items in reading
  order — that is, from top to bottom and from the leading to trailing side."
- "**Align components with one another to make them easier to scan** and to communicate organization
  and hierarchy… Along with indentation, alignment can also help people understand an information
  hierarchy."
- "Take advantage of progressive disclosure to help people discover content that's currently
  hidden."
- "Group related items… you might use negative space, background shapes, colors, materials, or
  separator lines."

Source: <https://developer.apple.com/design/human-interface-guidelines/layout>

### Emphasis without colour

Apple never states a heading like "achieve emphasis without colour". But the guidance is there, and
it is unambiguous when assembled:

1. **Colour may not be load-bearing at all.** "Avoid relying solely on color to differentiate
   between objects, indicate interactivity, or communicate essential information." Every emphasis
   Apple builds must therefore *also* work without colour.
   (<https://developer.apple.com/design/human-interface-guidelines/color>)
2. **Weight is a documented hierarchy level in its own right** — "the bold trait adds weight to
   text, letting you create another level of hierarchy."
3. **Apple demonstrates it in its own type scale.** macOS Headline is **13 pt Bold** against Body's
   **13 pt Regular** — identical size, identical 16 pt line height, differing only in weight. This
   is the cleanest documented proof that Apple treats weight alone as sufficient for a rank change.
4. **Position and space carry emphasis.** "Make essential information easy to find by **giving it
   sufficient space**"; place important items "near the top and leading side".
5. **Restraint amplifies.** "Apply color sparingly"; "Refrain from adding color to the background of
   multiple controls"; prefer "a monochromatic appearance for tab bars".
6. **On the platform where Apple forbids colour-as-focus, it names the substitutes:** tvOS —
   "Avoid using only color to indicate focus. **Subtle scaling and responsive animation** are the
   primary ways to [indicate focus]." (<https://developer.apple.com/design/human-interface-guidelines/color>)

7. **Apple has said this out loud, and recently.** WWDC25, *Get to know the new design system*:
   "**we're all relearning where emphasis comes from**", and "**Instead of relying on decoration,
   hierarchy should be expressed through layout and grouping.**"
   (<https://developer.apple.com/videos/play/wwdc2025/356/>) This is the closest thing to an explicit
   mandate for the direction this product is taking.

**Honest limit:** Apple never assembles these into a stated no-colour emphasis *method*, and there is
no HIG heading to that effect. *INFERENCE:* treating **weight → size → position → whitespace** as an
ordered emphasis ladder, with colour as a fifth, optional and never-sole channel, is a synthesis of
the above rather than Apple's own framing. It is nonetheless precisely the toolkit a flat,
paper-toned, typography-led product needs.

## 4.3 Optical alignment and baselines

Apple **does** document optical alignment — but only for icons and symbols, never generalised into a
layout principle.

**Optical centring, stated plainly on the Icons page:**

> "**If necessary, add padding to a custom interface icon to achieve optical alignment.**"

Icons "can look unbalanced when you center them geometrically instead of optically", and
"Adjustments for optical centering are typically very small" while being high-impact.

**Icon-to-text weight matching, same page:**

> "In general, **match the weights of interface icons and adjacent text**."

Source: <https://developer.apple.com/design/human-interface-guidelines/icons>

**Optical alignment as a symbol-authoring feature:** "SF Symbols supports **negative side margins to
aid optical horizontal alignment** when a symbol contains a badge or other elements that increase
its width." Custom symbols must match system ones "in level of detail, **optical weight**, alignment,
position, and perspective."
(<https://developer.apple.com/design/human-interface-guidelines/sf-symbols>)

**Baselines: the rule is real, but it lives in WWDC, not the HIG.** The HIG's only geometric anchor
for symbols is cap height (see 4.4). The baseline rule is stated in WWDC20, *SF Symbols 2*:

> "**Symbols and text are baseline-aligned.**"

> "When laying symbols next to text, remember to align them to the base line **not** to align them to
> their center."

Apple also concedes the judgement involved: symbols are "vertically centered with a cap height", the
baseline is "a flexible guide", some symbols deliberately sit above it to "optically balance the
shape of the symbol with San Francisco", and on badge alignment — "This is an optical alignment so
you should use your best judgment."

Source: <https://developer.apple.com/videos/play/wwdc2020/10207/>

Also: "Separate text-labelled buttons with fixed space" or "adjacent text may appear to run
together" (<https://developer.apple.com/design/human-interface-guidelines/toolbars>).

**Not documented:** any general optical-vs-mathematical alignment discussion outside Icons and the
SF Symbols negative-margin note. Apple never turns it into a layout principle, and no HIG page
addresses optical centring of arbitrary shapes.

*INFERENCE:* the transferable idea is that Apple engineers alignment into the *asset* — padding,
negative margins, cap-height-relative scales — so that layout code stays naive. For us that means
baking optical corrections into the icon component and the type tokens, not into per-instance layout
nudges.

## 4.4 SF Symbols — rules, and why we cannot use them

### The rules worth stealing

- **Nine weights, mapped to the type.** "Each of the **nine symbol weights — from ultralight to
  black — corresponds to a weight of the San Francisco system font**, helping you achieve precise
  weight matching between symbols and adjacent text."
- **Three scales, defined against cap height.** "Each symbol is also available in three scales:
  **small, medium (the default), and large**. **The scales are defined relative to the cap height of
  the San Francisco system font.**" Scale "lets you adjust a symbol's emphasis compared to adjacent
  text, **without disrupting the weight matching** with text that uses the same point size."
- Corroborated from the Typography page: "Because SF Symbols use equivalent weights, you can achieve
  precise weight matching between symbols and adjacent text, regardless of the size or style you
  choose", and symbols "automatically align with text in all weights and sizes."
- **Four rendering modes:** monochrome, hierarchical, palette, multicolor. Hierarchical "assigns a
  different opacity of a single color to each layer" — a way to get depth inside an icon *without a
  second hue*.
- **Variant selection is contextual, and often not yours to make:** "The outline variant works well
  in toolbars, lists, and other places where you display a symbol alongside text." Fill "tend[s] to
  give a symbol more visual emphasis". "In many cases, the view that displays a symbol determines
  whether to use outline or fill."
- **Enclosure aids small sizes:** "Symbols that use an enclosing shape — like a square or circle —
  can improve legibility at small sizes."
- **Animation restraint:** "Apply symbol animations judiciously. While there's no limit to how many
  animations you can add to a view, **too many animations can overwhelm an interface and distract
  people**." And "Make sure that animations serve a clear purpose."
- Icons should scale with text: "Increase the size of meaningful interface icons as font size
  increases." (<https://developer.apple.com/design/human-interface-guidelines/typography>)

Source unless noted: <https://developer.apple.com/design/human-interface-guidelines/sf-symbols>

### When not to use them — including here

The HIG states the restriction directly:

> "Be sure to understand the terms and conditions for using SF Symbols, including **the prohibition
> against using symbols — or images that are confusingly similar — in app icons, logos, or any other
> trademarked use**."

> "SF Symbols includes copyrighted symbols that depict Apple products and features. **You can display
> these symbols in your app, but you can't customize them.**"

> "**Don't design replicas of Apple products.** Apple products are copyrighted and you can't reproduce
> them in your custom symbols."

Source: <https://developer.apple.com/design/human-interface-guidelines/sf-symbols>

**The controlling licence — verified.** It is §2.10 "System-Provided Images" of the **Xcode and
Apple SDKs Agreement**, <https://www.apple.com/legal/sla/docs/xcode.pdf>:

> "The system-provided assets (e.g., images, symbols) owned by Apple and documented as such in
> Apple's Human Interface Guidelines… ('System-Provided Images') are **licensed to You solely for the
> purpose of developing Applications for Apple-branded products** that run on the system for which
> the image was provided. You agree that you shall **not use or incorporate the System-Provided
> Images or any substantially or confusingly similar images into app icons, logos** or make any other
> trademark use of the System-Provided Images."

**This settles it: SF Symbols cannot be used in a web product.** "Solely for… Applications for
Apple-branded products" excludes a website, an Android app, and print marketing.

Two things commonly overstated, worth getting right:

- The licence contains **no blanket no-modification clause.** Modification is permitted, and Apple
  ships the export/annotate workflow for it. The no-modification rule is narrower and lives in the
  HIG, applying only to symbols depicting Apple products or features.
- Post-termination, "You may continue to distribute the System-Provided Images as used within
  Applications You developed using the Apple Software."

*INFERENCE:* the practical upshot is that a redrawn generic symbol is licence-compliant *on Apple
platforms*, while any symbol used as a logo or app icon — modified or not — is not. Neither helps
us; the platform restriction is the binding one.

### The substitute

*INFERENCE, with measured support:* **Phosphor Icons** is the closest honest analogue. It ships
"1,248 icons and counting" in six weights — "Thin, Light, Regular, Bold, Fill, and Duotone" —
"Designed at 16 x 16px to read well small and scale up big", under "MIT" licence
(<https://github.com/phosphor-icons/homepage>). The weight ladder plus a Fill variant reproduces
SF Symbols' two most useful structural properties: weight-matching to adjacent text, and an
outline/fill pair for unselected/selected. It does not reproduce cap-height-relative scales — that
has to be built into our icon component.

## 4.5 Restraint

The strongest single statement Apple makes, and the one to put on the wall:

> "**Don't mistake delight for decoration.**" — "don't let pursuit of delight for its own sake get in
> the way of your product's core purpose."

> "**Include just what's necessary.** Simplicity isn't minimalism. Aim for a focused, useful
> experience."

Source: <https://developer.apple.com/design/human-interface-guidelines/design-principles>

- Split view: "**The thin divider measures one point in width, giving you maximum space for
  content.**" "Avoid using thicker divider styles unless you have a specific need."
- Motion: "In apps, generally **avoid adding motion to UI interactions that occur frequently**."
  (<https://developer.apple.com/design/human-interface-guidelines/motion>)
- Pointing devices: "**Avoid creating gratuitous pointer and content effects.** Creating a purely
  decorative pointer effect can distract and even irritate people."
  (<https://developer.apple.com/design/human-interface-guidelines/pointing-devices>)
- iOS best practice: "**limiting the number of onscreen controls** while making secondary details and
  actions discoverable with minimal interaction."
  (<https://developer.apple.com/design/human-interface-guidelines/designing-for-ios>)
- Branding: "Ensure branding always defers to content"; "Resist the temptation to display your logo
  throughout your app."
- Branding, on standard patterns: "Help people feel comfortable by using standard patterns
  consistently. **Even a highly stylized interface can be approachable if it maintains familiar
  behaviors.** For example, place UI components in expected locations."
- Colour: "Apply color sparingly"; "Refrain from adding color to the background of multiple
  controls."
- Typography: "**Minimize the number of typefaces you use, even in a highly customized interface.**
  Mixing too many different typefaces can obscure your information hierarchy."
- Toolbars: "Choose items deliberately to avoid overcrowding"; max three groups.
- Sidebars: "show no more than two levels of hierarchy."
- Layout: "Make essential information easy to find by giving it sufficient space… don't obscure it
  by crowding it with nonessential details."
- visionOS, on shadows: "you generally want to avoid adding shadows to increase text contrast."

**Where Apple does NOT document restraint, despite the folklore:**

- **There is no HIG rule about borders, shadows, or dividers as decoration.** No page carries a
  guideline headed "border". The only divider guidance is *permissive* — "you might use… separator
  lines" to group, in Layout — and semantic (the Color separator tokens). The anti-divider position
  exists only in WWDC25 session narration ("replacing hard dividers with subtle blur to reduce
  clutter"), and that mechanism is a blur, which we cannot use.
- **The phrase "let content lead" appears nowhere in the HIG.** The nearest documented equivalents
  are "Stay out of the way" (Design principles) and "bring focus to the underlying content"
  (Adopting Liquid Glass).

## 4.6 The branding rule that argues against our type split — and how it resolves

This one cuts against the plan, so it is worth stating plainly rather than burying:

> "Consider using a custom font. If your brand is strongly associated with a specific font, be sure
> that it's legible at all sizes… **It can work well to use a custom font for headlines and
> subheadings while using a system font for body copy and captions, because the system fonts are
> designed for optimal legibility at small sizes.**"

Source: <https://developer.apple.com/design/human-interface-guidelines/branding>

Read literally, Apple's advice is the *inverse* of ours: expressive face for headings, workhorse for
body. Our plan puts the serif in the prose body.

**The resolution, and it is Apple's own precedent:** New York is a *system* font, and Apple uses it
as a **reading** face — Apple Books, Safari Reader — not merely for headings. The WWDC20 statement is
"Throughout the system, we have used New York… like here with the Books and Reminders app"
(<https://developer.apple.com/videos/play/wwdc2020/10175/>), and Apple's own description is that NY's
optical sizes let it "perform as a **traditional reading face at small sizes**"
(<https://developer.apple.com/fonts/>).

So the defensible rule for us is narrower than "serif for prose":

- Serif is permitted where a person **reads continuously** — answers, quoted excerpts, refusals, page
  titles. This matches Books.
- Serif is **not** permitted for captions, labels, chips, column heads, counts or provenance
  metadata. That is where Apple's warning bites, and where "the system fonts are designed for optimal
  legibility at small sizes" applies.
- The serif must therefore be one with a genuine small-size optical cut — which is exactly why
  Newsreader (`opsz` 6–72, with a Caption cut) is the recommendation and Spectral (no optical axis)
  is not.

---

# 5. Density

## 5.1 Apple's stated position on dense surfaces

Apple has no "density mode" and publishes no compact/comfortable toggle. What it has is one
sentence of intent for the desktop and a set of floors:

> "Leverage large displays to present more content in fewer nested levels and with less need for
> modality, **while maintaining a comfortable information density that doesn't make people strain**
> to view the content they want."

Source: <https://developer.apple.com/design/human-interface-guidelines/designing-for-macos>

Read carefully, that is a mandate for density — *more content, fewer levels, less modality* — bounded
by legibility rather than by whitespace fashion.

## 5.2 Compact vs regular size classes

Covered in 2.3. The essential points for a desktop web app:

- **regular** = larger screen or landscape; **compact** = smaller screen or portrait. Apple does not
  publish the point breakpoint.
- "Design for a full-screen view first, and only switch to a compact view when a version of the full
  layout no longer fits."
- "**Defer switching to a compact view for as long as possible.**"
- Narrowing a split view: "prefer hiding tertiary columns such as inspectors."

*INFERENCE:* mapped to this product, "compact" is not a density setting — it is a **layout collapse
order**. Inspector goes first, then the meta column in rows, then the sidebar. Apple never suggests
shrinking type or padding to cope with width; it suggests removing tiers.

## 5.3 The documented floors that bound density

Everything below is the outer edge of what Apple sanctions. Going past any of these is going past
Apple, not being more Apple.

| Floor | Value | Source |
|---|---|---|
| macOS minimum text size | **10 pt** | [Typography](https://developer.apple.com/design/human-interface-guidelines/typography) |
| macOS default text size | **13 pt** | Typography |
| macOS default control size | **28 × 28 pt** | [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| macOS minimum control size | **20 × 20 pt** | Accessibility |
| Padding around bezelled elements | **~12 pt** | Accessibility, [Pointing devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices) |
| Padding around unbezelled elements | **~24 pt** | Accessibility, Pointing devices |
| Split-view divider | **1 pt** ("thin divider… giving you maximum space for content") | [Split views](https://developer.apple.com/design/human-interface-guidelines/split-views) |
| Text contrast, ≤17 pt any weight | **4.5:1** | Accessibility |
| Text contrast, 18 pt any weight, or bold at any size | **3:1** | Accessibility |
| Text enlargement support | **≥200 %** | Accessibility |

## 5.4 How Apple keeps dense surfaces legible

Six documented techniques, none of which cost vertical space:

1. **Tight leading, with a stated limit.** "decreasing the space between lines (tight leading) can
   help the text fit well" in a list row — but "**If you need to display three or more lines of
   text, avoid tight leading**." The mechanism is quantified: "tight leading decreases the line
   height by two points" (iOS/macOS).
   ([Typography](https://developer.apple.com/design/human-interface-guidelines/typography),
   [WWDC20](https://developer.apple.com/videos/play/wwdc2020/10175/))
2. **Shorten the text, not the type.** "Keep item text succinct so row content is comfortable to
   read"; if items are text-heavy, "list item titles only, letting people choose an item to reveal
   its content in a detail view."
   ([Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables))
3. **Alternating row backgrounds.** "Consider using alternating row colors in a multicolumn table.
   Alternating colors can help people track row values across columns, especially in a wide table."
   The macOS **bordered** style exists specifically because it "uses alternating row backgrounds to
   help make large tables easier to use." (Lists and tables)
4. **Middle truncation.** "an ellipsis in the middle of text can make an item easier to distinguish
   because it preserves both the beginning and the end of the content." (Lists and tables)
5. **Weight, not size, for rank.** macOS Headline is 13 pt Bold against 13 pt Regular Body — same
   size, same 16 pt line height. (Typography, macOS text styles table)
6. **Hover treatment that doesn't reflow.** "scaling doesn't work well for a table row because a row
   can't expand without overlapping adjacent rows" — for tight elements "consider using a hover
   effect that includes tint, but not scale and shadow."
   ([Pointing devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices))

Two more that constrain the chrome rather than the rows:

- Toolbar: "Choose items deliberately to avoid overcrowding"; "aim for a maximum of three" groups;
  title "under 15 characters".
  ([Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars))
- Sidebar: "show no more than two levels of hierarchy".
  ([Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars))

## 5.5 The bottom dock — what Apple documents about persistent bottom bars

The product has a bottom dock, so the tab-bar rules are the relevant precedent:

- "**Use a tab bar to support navigation, not to provide actions.** If you need to provide controls
  that act on elements in the current view, use a toolbar instead."
- "Make sure the tab bar is visible when people navigate to different sections of your app. If you
  hide the tab bar, people can forget which area of the app they're in."
- "**Don't disable or hide tab bar buttons, even when their content is unavailable.** Having tab bar
  buttons available in some cases but not others makes your app's interface appear unstable and
  unpredictable. If a section is empty, explain why its content is unavailable."
- "Include tab labels to help with navigation… **Use single words whenever possible.**"
- "**Avoid overflow tabs**" — a More tab "makes it harder for people to reach and notice content".
- Badges: "**Reserve badges for critical information so you don't dilute their impact and meaning.**"
- "it's generally easier to navigate among fewer tabs."

Source: <https://developer.apple.com/design/human-interface-guidelines/tab-bars>

Counterweight from the desktop side, which applies to a *web* app in a browser window:

> "Avoid putting critical information or actions in a bottom bar, because people often relocate a
> window in a way that hides its bottom edge."

Source: <https://developer.apple.com/design/human-interface-guidelines/windows>

*INFERENCE:* these two are reconcilable for us. A browser viewport does not get dragged off-screen
the way a macOS window does, so the macOS warning is weaker here — but its underlying point stands:
**the dock may hold navigation and status, never the only route to a destructive or critical
action.**

---

# What we should take

Ranked by value to this product. Each item names the rule, the reason in one line, and where it
lands in the existing locked system (`docs/design/visual-system.md`).

## Adopt — ranked

**1. Set Inter (sans) and Newsreader (serif), both variable, both with their optical-size axes wired
to font-size.**
The only two candidates whose *structural behaviour* matches SF and NY rather than merely their
silhouette — and the licence question is settled: SF and NY are legally unusable here.

**2. Take Apple's macOS type table, not the iOS one, as the metric reference.**
Our users are at a desk at 1–3 feet, not holding a phone; macOS Body is 13 pt and the whole desktop
system runs 10–26 pt, which is exactly the range our locked five-step scale already occupies.

**3. Add line-heights to the type scale — it currently has none — using Apple's macOS ratios.**
Apple's desktop leading is materially tighter than the web's default 1.5, and this is the single
cheapest change that will make the product read as Apple rather than as Tailwind.

| Existing token | Size / weight | **Add line-height** | Apple source row (macOS) |
|---|---|---|---|
| `.t-display` | 24 / 600 | **30px** (1.23) | Large Title 26/32 = 1.23 |
| `.t-title` | 15 / 600 | **20px** (1.33) | Title 3 15/20 |
| `.t-body` | 13 / 400 | **16px** (1.23) | Body 13/16 |
| `.t-meta` | 12 / 400 | **15px** (1.25) | Callout 12/15 |
| `.t-micro` | 11 / 500 | **14px** (1.27) | Subheadline 11/14 |

Note the shape: *smaller text gets more relative leading, larger text less.* That is Apple's curve,
and it is the opposite of a single global `line-height`.

**4. Set tracking from Apple's published tables, per step, per family.**
The tables exist precisely so a substitute can reproduce system behaviour; right now `.t-display`
carries −0.01em, which is correct for a serif title and wrong for a sans one.

| Token | Size | **Sans (SF table)** | **Serif (NY table)** |
|---|---|---|---|
| `.t-display` | 24 | **+0.003em** | **−0.011em** ← current −0.01em is right *if* display is serif |
| `.t-title` | 15 | **−0.016em** | 0 |
| `.t-body` | 13 | **−0.006em** | +0.004em |
| `.t-meta` | 12 | **0** | +0.006em |
| `.t-micro` | 11 | **+0.006em** | +0.011em |

Correction worth internalising: **SF's tracking is not negative at display sizes.** It is negative
only from 13–23 pt, troughing near −0.43 pt at 17 pt, and turns *positive* from 24 pt. New York runs
the opposite curve and tightens monotonically as it grows. See 1.4.

**5. Use weight, not size or colour, for the first level of emphasis.**
Apple's own macOS Headline is 13 pt Bold against 13 pt Regular Body — same size, same leading — which
is the documented proof that a flat, near-monochrome product can still build hierarchy.

**6. Adopt the four-level label hierarchy (primary / secondary / tertiary / quaternary) as roles.**
It is the most portable idea Apple has, it maps cleanly onto value → label → provenance → disabled,
and since Apple publishes **no** alpha values (3.3) we can tune ours to warm paper without deviating
from anything.

**7. Adopt the three-level background hierarchy: view → group → group-within-group.**
With materials off the table, nested solid backgrounds are how we get depth — and it lets us cut
borders, which currently do all the structural work.

**8. Hold the macOS control floors: 28×28 default, 20×20 minimum, ~12 px padding around bezelled
controls.**
These are the documented outer edge of Apple-sanctioned density; our locked control height of 28 is
already exactly Apple's macOS default, and the dock tile at 44 is exactly the iOS default — both
should be recorded as deliberate, not coincidental.

**9. Alternating row backgrounds in the wide tables, and let columns be resized and sorted.**
Three of the four things Apple documents about macOS multi-column tables, and the alternating-row
rule is stated for exactly our case: "especially in a wide table."

**10. Middle-truncate, and truncate exactly one element per row.**
Apple's rule — an ellipsis mid-string "preserves both the beginning and the end" — plus the row
primitive already locked in §6 of the visual system; property names like "Four Seasons Hotel George
V, Paris" fail badly under end-truncation.

**11. Constrain the chrome: sidebar ≤ 2 levels of hierarchy, toolbar ≤ 3 groups, titles < 15
characters.**
Documented ceilings that stop an intelligence product's navigation from sprawling as entity types
accumulate.

**12. Treat the dock as navigation only, always visible, never disabled.**
"Use a tab bar to support navigation, not to provide actions"; and "Don't disable or hide tab bar
buttons… If a section is empty, explain why its content is unavailable" — an empty queue must show
an empty state, not a dead tile.

**13. Reserve badges for critical information.**
"so you don't dilute their impact and meaning" — in a product with queues and notices, badge
inflation is the default failure mode.

**14. Never let colour be the only channel.**
Required by Apple, and doubly so here: earth-tone accents on warm paper have less separation than
Apple's saturated system colours, so every status needs a label or a glyph shape too.

**15. Collapse layout by removing tiers, not by shrinking type.**
"Defer switching to a compact view for as long as possible"; the order is inspector → row meta
column → sidebar. Apple never suggests reducing type size or padding to cope with width.

**16. Hover on rows with tint only — no scale, no shadow.**
Documented: "scaling doesn't work well for a table row because a row can't expand without
overlapping adjacent rows."

**17. Keep serif out of small metadata.**
Apple's branding rule warns that system fonts, not custom ones, are "designed for optimal legibility
at small sizes"; the serif earns its place in continuously-read prose (as NY does in Books) and
nowhere else. See 4.6.

**18. Adopt Phosphor at matched weights, with an outline/fill pair for unselected/selected.**
Reproduces the two SF Symbols properties that matter — weight-matching to adjacent text and a
selection variant — under MIT, with SF Symbols legally closed to us.

**18a. Build three things into the icon component, not into page layout: weight matched to adjacent
text, baseline alignment (not centre), and per-icon optical padding.**
All three are documented Apple practice — "match the weights of interface icons and adjacent text",
"align them to the base line not… to their center", "add padding to a custom interface icon to
achieve optical alignment" — and all three are invisible when right and conspicuous when wrong.

**19. Hold 4.5:1 for all text, and don't take the 18 pt → 3:1 relaxation.**
*INFERENCE:* Apple's own stricter guidance for **custom** colour pairs is "strive for 7:1, especially
in small text"; our palette is entirely custom and low-chroma, so the relaxation is the wrong side of
the trade.

**20. Add tabular figures everywhere numbers align, and a slashed zero.**
Already locked as `.tnum`; Inter additionally ships `zero`, which is worth enabling for reference
codes and commission figures.

## Reject, and why

### Depends on translucency or materials — we are flat

- **Liquid Glass in all its forms**, both `regular` and `clear` variants, and the 35 %-opacity
  dimming layer rule. The entire mechanism is "allowing color to pass through from background to
  foreground."
- **Standard materials** (`ultraThin` / `thin` / `regular` / `thick`) and macOS background blending
  modes (behind-window, within-window).
- **The vibrancy hierarchy.** Note this is *distinct* from the plain label hierarchy in item 6: the
  vibrant labels/fills/separators are explicitly "designed to work with each material" and are
  meaningless without one. Take the four-level *structure*; reject the vibrant colour set.
- **Scroll edge effects.** The HIG says to use one "instead of a background" to separate content from
  the control area — but it is a blur, so it is unavailable. **We must replace it with something.**
  *INFERENCE:* a hairline plus a background-value step is the flat equivalent; our locked system
  already does this with the panel stroke.
- **`separator` as specified** — "may be partially transparent to allow the underlying content to
  show through." Use `opaqueSeparator` semantics instead.
- **System fills as specified** — they "incorporate transparency to allow the background color to
  show through." Take the *sizing* logic (thin shapes → small shapes → large shapes → complex areas);
  reject the transparency.
- **Hierarchical rendering mode for icons** relies on layered opacities; with flat solid colour we
  get monochrome only, which is fine and is what Apple recommends for toolbars anyway.

### Depends on iOS-only interaction or hardware

- **The 44×44 pt rule as our governing minimum.** It is a *touch* figure; Apple's own pointer-driven
  platform sets 28×28 default and 20×20 floor. Using 44 everywhere would destroy enterprise density
  for no accessibility gain on a mouse-and-keyboard product. (Keep 44 for the dock tiles, which are
  large hit targets by choice.)
- **The reach ergonomics rule** — "easier and more comfortable for people to reach a control when
  it's located in the middle or bottom area of the display" is about holding a phone one-handed.
- **Swipe-to-navigate-back and swipe actions in list rows.**
- **Dynamic Type as an API.** macOS has none — "macOS doesn't support Dynamic Type." Keep the
  *principles* (item 15, plus "don't scale every word", "maintain hierarchy at any size") and
  implement against browser zoom and rem-based sizing instead.
- **Size classes as literal breakpoints.** Apple publishes no point values for them; take the
  collapse *order*, not the mechanism.
- **The iOS tab-bar fill-variant convention** ("an iOS tab bar prefers the fill variant") is an
  iOS-specific default; on a desktop dock, choose deliberately.
- **Badge appearance as specified** — "a red oval containing white text" is an iOS artefact and will
  fight an earth-tone palette. Keep the *scarcity* rule, restyle the object.

### Legally unavailable

- **SF Pro, SF Compact, SF Mono, New York.** "For iOS, OS X and tvOS application uses only"; "You may
  not embed the Apple Font in any software programs or other products." Applies to the shipped app
  *and* to mockups of it.
- **SF Symbols.** Verified: Xcode and Apple SDKs Agreement §2.10 licenses system-provided images
  "solely for the purpose of developing Applications for Apple-branded products".
  (<https://www.apple.com/legal/sla/docs/xcode.pdf>)

### Wrong for this palette, though structurally sound

- **Apple's system greys as values.** Every level is cool — blue channel exceeds red at all six
  steps. Take the ladder shape and the light/dark inversion behaviour; rebuild the hues warm.
- **The saturated system colours as accents.** Take **Brown (172, 127, 94)** as precedent that an
  earth tone can be a *system* colour, and take the four-column light / dark / increased-contrast
  light / increased-contrast dark discipline. Don't take systemBlue as our accent.

### Not Apple guidance at all — do not cite Apple for these

- **The 8 pt grid.** It appears nowhere in the HIG. Our 4·8·12·16·24·32 ladder is a sound decision
  that must be defended on its own merits.
- **Any margin, row-height, toolbar-height, sidebar-width or inspector-width number.** Apple
  publishes none. See 2.1 for the full list of ten documented gaps.
- **The label-opacity percentages** (60/30/18 %) and fill percentages (20/16/12/8 %). Community
  runtime introspection, not Apple. See 3.3.
- **"SF switches from Text to Display at 20 pt."** Retired by Apple in 2020; the current answer is a
  transition zone of **17–28 pt**.
- **"SF uses negative tracking at display sizes."** False per Apple's own table; tracking turns
  positive at 24 pt. See 1.4.
- **"Clarity, deference, depth" as current guidance.** They are the iOS 7 themes, from a document
  Apple banner-marks "Retired". The live replacement is the **Design principles** page (Purpose,
  Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, Delight), reintroduced
  8 June 2026. Cite that instead. See 4.1.
- **Optical alignment as a general Apple principle.** Apple documents it *only* for icons ("add
  padding to a custom interface icon to achieve optical alignment") and for SF Symbols negative side
  margins. It is never generalised to layout, and the symbol baseline rule is WWDC-only, not HIG.
  See 4.3.
- **An Apple rule against borders or dividers.** None exists. Layout is permissive about separator
  lines; the anti-divider position is WWDC narration about *blur*, which we cannot use. See 4.5.

## Open questions

1. **Whether `.t-display` stays serif.** The tracking recommendation in adopt-item 4 forks on this,
   and the answer determines whether the currently-specified −0.01em is correct or wrong.
2. **Warm grey ladder values** — the structure is settled (3.5), the six hues are not, and there is
   no Apple number to derive them from.
3. **What replaces the scroll edge effect** at the chrome/content boundary. Apple's answer is a blur;
   ours has to be a hairline plus a background step, and that needs to be decided once and applied to
   the panel, the dock and the inspector together rather than per-surface.
4. **New York's exact licence wording** — inferred to match the San Francisco licence, not verified;
   the text ships inside `NY.dmg`. Immaterial to the decision (we cannot use it either way), but it
   should not be cited as if verified.

## Corrections this document makes to widely held beliefs

Collected because several of these were assumed in the brief:

| Common belief | What Apple actually documents |
|---|---|
| SF uses negative tracking at display sizes | Negative only 13–23 pt; **positive from 24 pt**. NY is the one that tightens as it grows. |
| SF switches Text→Display at 20 pt | Retired in 2020. Now a **17–28 pt transition zone** on a continuous axis. |
| Apple's design themes are clarity, deference, depth | Retired iOS 7 framing. Live page is **Design principles**, eight groups, reintroduced June 2026. |
| Apple mandates an 8 pt grid | **No grid, no spacing scale, no margin values** appear anywhere in the HIG. |
| 44 × 44 pt is Apple's minimum target | 44 × 44 is the **iOS default**; the iOS floor is 28 × 28, and **macOS is 28 × 28 default / 20 × 20 floor**. |
| Label opacities are 60 / 30 / 18 % | **Apple publishes no alpha values at all.** Those figures are community runtime introspection. |
| Apple doesn't document optical alignment | It does — for **icons** and **SF Symbols**, though never generalised to layout. |


