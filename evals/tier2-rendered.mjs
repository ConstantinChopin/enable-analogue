/**
 * Tier 2 — rendered invariants.
 *
 * These are the defects tier 1 cannot see, because the source is fine and the RENDER
 * is wrong: a column whose cells disagree about their own shape, a bar drawn in a
 * colour its own legend contradicts, a card with two left edges. Every check here
 * corresponds to something that actually shipped and was found by a person looking at
 * a screen, which is the expensive way to find it.
 *
 * Assertions are STRUCTURAL, never pixel comparisons. A screenshot diff fails when
 * anyone edits a sentence and teaches the team to approve failures without reading
 * them. "Every cell in this column has the same shape" survives content changes and
 * fails only when the thing it describes is genuinely broken.
 */
import { open, palette } from "./lib/browser.mjs";
import { matrix } from "./contracts.mjs";

const results = [];
const record = (check, path, role, ok, detail) =>
  results.push({ check, path, role, ok, detail });

/* Collect a page's facts in one pass, then assert in node — one evaluate call per
   page keeps the harness fast and the assertions readable. */
async function probe(page, semantic) {
  return page.evaluate((SEMANTIC) => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const bg = (el) => getComputedStyle(el).backgroundColor;

    /* Only a SEMANTIC colour makes a claim. A grey rule, an avatar ring and a dock
       indicator are furniture — they say nothing about state, so they owe no label
       and they do not spend the screen's taxonomy budget. Restricting to the declared
       state palette is what separates "this dot means something" from "this dot is
       decoration", and without it the check fires on every screen and gets ignored. */
    const claims = (el) => {
      const c = bg(el);
      return SEMANTIC.includes(c);
    };
    /* A status mark is small and roughly round. A progress bar is also `rounded-full`
       and must not be mistaken for one. */
    const isMark = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.width <= 14 && Math.abs(r.width - r.height) <= 2;
    };

    /* A "column" is the trailing cell of every row in one list. Its shape is the tag
       plus whether the cell contains a pill — which is what broke in the vault, where
       one row in a column of pills rendered bare text. */
    const columns = [];
    for (const list of document.querySelectorAll("ul")) {
      const rows = [...list.children].filter((li) => li.tagName === "LI" && vis(li));
      if (rows.length < 3) continue;
      const shapes = rows.map((li) => {
        const cell = li.querySelector(".row-trailing") ?? li.lastElementChild;
        if (!cell) return "none";
        const pill = cell.querySelector('[class*="rounded-full"][class*="border"]');
        const btn = cell.querySelector("button, a[data-slot=button]");
        return pill ? "pill" : btn ? "control" : cell.textContent.trim() ? "text" : "empty";
      });
      columns.push({ n: rows.length, shapes });
    }

    /* Every progress bar, with the legend swatches that share its card. */
    const bars = [];
    for (const bar of document.querySelectorAll("[data-slot=progress]")) {
      if (!vis(bar)) continue;
      const ind = bar.querySelector("[data-slot=progress-indicator]");
      const card = bar.closest("section") ?? bar.parentElement;
      const swatches = [...card.querySelectorAll('span[class*="rounded-full"]')]
        .filter((s) => !s.textContent.trim() && vis(s) && s.getBoundingClientRect().width < 14)
        .map(bg);
      bars.push({ fill: ind ? bg(ind) : null, swatches: [...new Set(swatches)] });
    }

    /* A coloured mark with no word anywhere near it. `closest` walks up to the nearest
       element that carries text, so a dot inside a labelled span passes. */
    const naked = [];
    for (const el of document.querySelectorAll('span[class*="rounded-full"]')) {
      if (!vis(el) || !isMark(el) || !claims(el) || el.textContent.trim()) continue;
      const holder = el.parentElement;
      const words = holder ? holder.textContent.trim() : "";
      if (!words) naked.push((holder?.className || "").slice(0, 60));
    }

    /* Direct children of a card body should share one left edge. Two edges means
       something is outside the gutter its siblings are inside. */
    /* Measuring this needs three distinctions, each of which produced a false positive
       before it was made:

       - An INLINE child aligns by its border, not its text. A chip sitting under a
         paragraph is correctly aligned when their boxes agree; its own `px-2` is
         decoration, and counting it flagged a card that was already right.
       - A LIST holds no padding itself — its rows do. Measuring the `ul` box compares
         the wrong edge against siblings that carry their own gutter.
       - Everything else aligns by its CONTENT edge, box plus padding, which is what
         catches a paragraph sitting outside the gutter its siblings are inside. */
    /* The left edge a reader aligns a card's contents to, which is not the outermost
       box. Descending until one of two things is true:

         it is a visible OBJECT (border or fill) — a chip, a nested card, an input.
           Aligns by its EDGE; its inner padding is its own business.
         it carries TEXT directly — a paragraph, a heading, a row.
           Aligns by its text, so a transparent wrapper, a list whose padding lives on
           its rows, and a Figure whose padding is the gutter all report the same thing.

       Every one of those distinctions came from a false positive: without them the
       check flagged four cards that were correct, which is how a check gets ignored. */
    const contentLeft = (el) => {
      if (/^inline/.test(getComputedStyle(el).display)) return null;
      const descend = (node) => {
        const cs = getComputedStyle(node);
        const bordered = parseFloat(cs.borderLeftWidth || 0) > 0;
        const filled = cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)";
        if (node !== el && (bordered || filled)) return Math.round(node.getBoundingClientRect().left);
        for (const child of node.childNodes) {
          if (child.nodeType === 3 && child.textContent.trim()) {
            return Math.round(node.getBoundingClientRect().left + parseFloat(cs.paddingLeft || 0));
          }
        }
        for (const child of node.children) {
          if (!vis(child)) continue;
          const found = descend(child);
          if (found !== null) return found;
        }
        return null;
      };
      return descend(el);
    };

    const edges = [];
    for (const sec of document.querySelectorAll("section[data-slot=card]")) {
      const body = sec.children.length > 1 ? sec.children[1] : null;
      if (!body || !vis(body)) continue;
      const lefts = [...body.children].filter(vis).map(contentLeft).filter((n) => n !== null);
      if (lefts.length < 2) continue;
      const uniq = [...new Set(lefts)];
      if (uniq.length > 1) {
        edges.push({ title: sec.querySelector("h3")?.textContent.trim() ?? "(untitled)", lefts: uniq });
      }
    }

    /* Distinct semantic colours in use — the taxonomy budget. */
    const marks = new Set();
    for (const el of document.querySelectorAll('span[class*="rounded-full"], [data-slot=progress-indicator]')) {
      if (!vis(el) || !claims(el)) continue;
      marks.add(bg(el));
    }

    return {
      columns,
      bars,
      naked,
      edges,
      distinctMarkColours: [...marks],
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      filledButtons: [...document.querySelectorAll("button, a[data-slot=button]")]
        .filter((b) => b.dataset.variant === "default" && vis(b))
        .map((b) => b.textContent.trim().slice(0, 40)),
    };
  }, semantic);
}

const h = await open();
try {
  for (const { path, role, contract } of matrix()) {
    const { page, ctx, landed } = await h.visit(path, role);
    if (landed !== path) {
      record("reachable", path, role, false, `redirected to ${landed}`);
      await ctx.close();
      continue;
    }
    const pal = await palette(page);
    /* Resolve the declared state palette to rendered rgb once per page, so the checks
       compare against what the stylesheet actually produced rather than a guess. */
    const semantic = await page.evaluate((vars) => {
      const probeEl = document.createElement("span");
      document.body.appendChild(probeEl);
      const out = [];
      for (const v of vars) {
        probeEl.style.backgroundColor = v;
        out.push(getComputedStyle(probeEl).backgroundColor);
      }
      probeEl.remove();
      return out.filter((c) => c && c !== "rgba(0, 0, 0, 0)");
    }, [pal.ok, pal.warn, pal.crit].filter(Boolean));
    const p = await probe(page, semantic);

    const brokenCols = p.columns.filter((c) => new Set(c.shapes.filter((s) => s !== "none")).size > 1);
    record("column keeps one shape", path, role, brokenCols.length === 0,
      brokenCols.map((c) => `${c.n} rows → ${[...new Set(c.shapes)].join(" + ")}`).join("; "));

    const wrongBars = p.bars.filter((b) => b.swatches.length > 0 && b.fill && !b.swatches.includes(b.fill));
    record("bar agrees with its legend", path, role, wrongBars.length === 0,
      wrongBars.map((b) => `fill ${b.fill} not among legend ${b.swatches.join(", ")}`).join("; "));

    record("no colour without a word", path, role, p.naked.length === 0,
      p.naked.length ? `${p.naked.length} unlabelled mark(s)` : "");

    record("card has one left edge", path, role, p.edges.length === 0,
      p.edges.map((e) => `${e.title}: ${e.lefts.join(" / ")}`).join("; "));

    /* The taxonomy budget is NOT checked here, and the attempt is worth recording.
       Counting distinct mark colours conflates a taxonomy with its values: /ask has one
       taxonomy — answer state — whose three values are conflict, refusal and answered,
       so it read as three taxonomies against a budget of one and failed a screen that
       was right. Nothing in the DOM distinguishes "three meanings" from "one meaning
       with three values"; that is a question about semantics, not structure.

       Tier 3 owns it. Its rubric already asks a model to list every distinct thing
       colour signals on the screen, which is the count the budget is about. */

    record("no horizontal overflow", path, role, !p.overflowX, p.overflowX ? "page scrolls sideways" : "");

    record("at most one filled button", path, role, p.filledButtons.length <= 1,
      p.filledButtons.length > 1 ? p.filledButtons.join(" / ") : "");

    await ctx.close();
  }
} finally {
  await h.close();
}

/* ── report ─────────────────────────────────────────────────────────────────── */
const checks = [...new Set(results.map((r) => r.check))];
let out = "\nTIER 2 — rendered invariants\n" + "─".repeat(58) + "\n";
let failed = 0;
for (const check of checks) {
  const rows = results.filter((r) => r.check === check);
  const bad = rows.filter((r) => !r.ok);
  failed += bad.length;
  out += `\n${bad.length === 0 ? "PASS" : "FAIL"}  ${check}  (${rows.length - bad.length}/${rows.length})\n`;
  for (const b of bad.slice(0, 8)) out += `      ${b.path} · ${b.role}  ${b.detail}\n`;
  if (bad.length > 8) out += `      … and ${bad.length - 8} more\n`;
}
out += "\n" + "─".repeat(58) + `\n${results.length - failed}/${results.length} assertions passed across ${matrix().length} screen/role pairs\n`;
console.log(out);
process.exit(failed ? 1 : 0);
