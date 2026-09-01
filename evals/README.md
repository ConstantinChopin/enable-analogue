# Design evals

Three tiers that make the design system's rules executable.

## Why this exists

Every defect this harness was built after had the same shape: **a rule that existed,
was correct, was written down, and was unenforced.**

`bits.tsx` contains this comment, verbatim:

> `/* ── EvidenceDot: state in words + dot, never color alone ── */`

The rule is right. The knowledge vault violated it on fourteen rows anyway — an 8px
circle beside a date, green on twelve of them, labelled by nothing — and shipped. The
same story holds for the rest:

| Rule, as written | Where it lived | How it broke |
|---|---|---|
| "never colour alone" | a comment in `bits.tsx` | naked dot on every table row |
| "children own their gutter" | a comment on `Section` | cards with two left edges |
| space scale is 4·8·12·16·24·32 | nowhere | `var(--space-5)` computed to `0` in silence |
| one type role per purpose | `globals.css` comments | raw `font-semibold` at 25 call sites |
| colour means state | a comment | one green carrying three taxonomies |

A rule that lives in a comment is a preference, and preferences degrade at exactly the
rate people write new code. Manual audits are the same category of activity as the
mistake — sampling, by hand, against a spec nothing enforces.

## The tiers

```bash
npm run eval            # all three
npm run eval:static     # tier 1 — no browser needed
npm run eval:rendered   # tier 2 — needs the dev server running
npm run eval:judge      # tier 3 — needs the dev server + ANTHROPIC_API_KEY
```

### Tier 1 — static invariants (`tier1-static.mjs`)

Source-level. Sub-second, deterministic, CI-friendly. Catches the **bypass class**: a
call site reaching around a primitive to hand-roll something the system already owns.
Invisible to `tsc` and `eslint`, because the result is valid TypeScript in a valid
component.

Checks: colour with no word · state colour painted by a page · tokens that resolve to
nothing · raw type utilities instead of roles · a bar with no tone beside a legend ·
contracts naming screens that do not exist.

**Baseline.** A checker reporting 68 problems on day one gets switched off by Friday.
`evals/baseline.json` records what was already there so CI fails on a *regression*, not
on history. Debt is visible and can only shrink.

```bash
npm run eval:static -- --update   # re-baseline deliberately; the diff is reviewable
```

### Tier 2 — rendered invariants (`tier2-rendered.mjs`)

Playwright over every screen × role. Catches what tier 1 cannot see, because the source
is fine and the **render** is wrong.

Checks: every column keeps one shape · a bar agrees with its own legend · no semantic
colour without a word · a card has one left edge · the screen stays within its taxonomy
budget · no horizontal overflow · at most one filled button.

Assertions are **structural, never pixel diffs**. A screenshot diff fails when anyone
edits a sentence, which teaches a team to approve failures without reading them. "Every
cell in this column has the same shape" survives content changes and fails only when the
thing it describes is genuinely broken.

Only **semantic** colours are checked. A grey rule or an avatar ring is furniture — it
makes no claim about state, so it owes no label. Without that distinction the check
fires on every screen and gets ignored.

### Tier 3 — judgement (`tier3-judgement.mjs`)

Screenshots each screen, asks a model to describe it **cold** — no contract in the
prompt — then diffs what it saw against what the contract says the screen is for.

Tiers 1 and 2 check whether the product agrees with itself. Both would have **passed**
the screen that failed a design review, because it was internally consistent and still
could not answer *"who is this for, and what am I meant to do first?"*

The rubric asks for observations, not opinions. "Does this look good" produces agreeable
noise; "name the largest element and say whether it is actionable" produces a fact that
can be compared with an intention.

Without a key it writes screenshots to `evals/shots/` and exits clean.

## The spine — `contracts.mjs`

Every tier reads it. Each screen declares who it is for, its one job, its primary action,
and its **taxonomy budget** — how many distinct things colour is allowed to mean there.

```js
"/knowledge": {
  job: { lead: "decide what the assistant is allowed to answer from",
         advisor: "find and read a document" },
  primaryAction: { lead: "assign access to a document", advisor: "open a document" },
  taxonomies: ["access scope", "document state"],   // exactly two
}
```

The budget is the fix for the original defect. The vault carried **three** taxonomies —
connector health, source verification, document sync — through a single green dot, which
is how one token came to mean three unrelated things.

Tier 3 fails when a model's cold reading disagrees with `job`. That is the test that
catches an unanswerable screen before a reviewer does.

## Adding a screen

Add it to `CONTRACTS`. Tier 1 fails if the route has no page; tiers 2 and 3 pick it up
automatically. A screen with no contract is not evaluated — which is itself the argument
for writing one.
