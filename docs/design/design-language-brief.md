# Visual language — brief

**Direction:** tech humanist. As close to Apple as is honest on the web.
**Status:** brief fixed; research in flight; component and layout plan to follow.

---

## The thesis

> These users live in an iOS world personally. The product should feel like somewhere they already know.

That is the whole argument, and it is a *reason* rather than a taste. It gives the visual language a job: reduce the distance between the tool an advisor is made to use at work and the software they choose at home. Familiarity is not decoration here — it is the shortest path to trust in a product whose entire proposition is trustworthiness.

It also sets the bar. Being *near* Apple reads as derivative; being *precise* reads as considered. The difference is composition discipline, not surface.

## Fixed decisions

1. **Two voices, split by who is speaking.**
   - **Sans** for everything the system computes: tables, chips, counts, labels, provenance, status, controls.
   - **Editorial serif** for everything a person reads as prose: answers in Ask, quoted source excerpts, refusals, page titles.

   This is not a flourish. The product's proposition is turning fragmented data into an answer someone can trust and read; the typography carries that distinction rather than merely decorating it. A table is machine output. An answer is a statement made to a person.

2. **Flat.** No translucency, vibrancy or layered materials. Typography, spacing and hairlines do the work. Anything in the research that depends on Apple's materials is out of scope by decision, not oversight.

3. **Enterprise density, with absolute precision in composition.** Advisors scan all day; we do not trade rows for air. Warmth comes from type and colour, never from padding. Density without precision is clutter, so the composition rules must be exact and enforced.

4. **Warm paper neutrals, earth-tone accents.** The current near-white and indigo are both in play. Semantic trust colours (verified / stale / conflict / critical) stay separate from the accent, as they are now.

5. **Windows is the demo machine.** The Apple system font stack is unavailable in practice, so the typefaces must be chosen and self-hosted on evidence — lineage, metrics, x-height, contrast — not on the assumption that `-apple-system` will resolve.

## What this replaces

The remaining build budget goes here. The visual language *is* the polish pass; there is no separate incremental tidy afterwards.

## Why the timing works

The system was locked immediately before this: design tokens in one file, a five-step type scale, a single spacing ladder, chosen radii, and one row primitive. The visual language therefore lives in a small number of places, and a re-skin changes values and faces rather than files. The sweep now converting every surface from arbitrary sizes onto the semantic scale is what makes this affordable — it was worth doing for its own sake, and it is what turns this from a rewrite into a re-skin.

## Open, pending research

- The two typefaces, chosen on evidence against SF Pro and New York.
- The neutral ramp and the earth-tone accent, with contrast verified rather than eyeballed.
- Which composition rules from Apple, Linear and Notion we adopt, mapped onto our existing atoms, molecules, organisms and five layouts.
- Where the serif starts and stops, precisely enough to be a rule rather than a judgement call.
