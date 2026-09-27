# Enable screens → Paper (editable frames)

`serialize.mjs` renders the six case-study screens (the same set and states as
`../deck-screens.mjs`) and turns each into Paper-ready HTML: inline styles, flex kept as
auto layout, everything else absolutely positioned, text with the browser's own line
breaks, icons as SVG.

    node evals/paper/serialize.mjs <out>              # as shipped
    STUDIO=1 node evals/paper/serialize.mjs <out>     # constantin.studio surface treatment
    node evals/paper/preview.cjs                      # renders out-studio/*.studio.png to check

Needs the dev server on :3100 (Frontend launch entry `enable-analogue`).

STUDIO mode: floating and framing surfaces become studio glass (tint, 18px blur, glass
edge, glass shadow from constantin.studio.site/src/styles.css 47–54); neutral fills become
paper or `--surface`; neutral borders become the `--rule` hairline; dark fills (primary
actions) and status tints are kept. Each screen then sits in a studio figure
(`.case-fig .frame`: 18px radius, 0.10 hairline, `0 26px 64px -32px rgba(43,32,24,.35)`)
on a white 1600×1060 artboard: `out-studio/figure.html`, the two chunks inside it, then
`out-studio/hairline.html` last.

## Placing in Paper (file "Versatile glacier", 01M39KBTKDHXJK1CR0B39BNSE0)

Artboards (deck order): 02 Ask 5Z-0 · 03 Briefing 1-0 · 05 Record 60-0 · 15 Traveller
61-0 · 16 Itinerary 62-0 · 18 Knowledge 63-0. For each: resize to 1600×1060, background
#ffffff, left = index × 1680; delete its children; write `figure.html`; write
`<screen>.1.html` and `<screen>.2.html` into the Figure node; write `hairline.html` into
the Figure node last. Paper's free plan has a weekly MCP call limit; one full pass of six
screens is about 40 calls.
