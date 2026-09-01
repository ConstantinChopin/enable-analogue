/**
 * Tier 1 — static invariants.
 *
 * Every rule here was already written down somewhere in this codebase, as a comment,
 * and every one of them was broken anyway. That is the whole argument for this file:
 * a rule that lives in a comment is a preference, and preferences degrade at exactly
 * the rate people write new code.
 *
 * These checks are deterministic, take under a second, and are meant to run in CI.
 * They catch the BYPASS class — a call site reaching around a primitive to hand-roll
 * something the design system already owns — which is invisible to tsc and eslint
 * because the result is perfectly valid TypeScript in a perfectly valid component.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { CONTRACTS } from "./contracts.mjs";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(p)) out.push(p);
  }
  return out;
}

const files = walk(SRC).map((p) => ({
  path: p,
  rel: relative(ROOT, p).split(sep).join("/"),
  text: readFileSync(p, "utf8"),
}));

/* A line is exempt if it sits inside a comment. These rules are about what SHIPS, and
   this repository is full of prose describing the very patterns the rules ban. */
function codeLines(text) {
  let inBlock = false;
  return text
    .split("\n")
    .map((line, i) => ({ line, n: i + 1 }))
    .filter(({ line }) => {
      const t = line.trim();
      if (inBlock) {
        if (t.includes("*/")) inBlock = false;
        return false;
      }
      if (t.startsWith("/*")) {
        if (!t.includes("*/")) inBlock = true;
        return false;
      }
      return !(t.startsWith("//") || t.startsWith("*"));
    });
}

const findings = [];
const add = (rule, file, n, detail, why) => findings.push({ rule, file, n, detail, why });

/* ── 1. colour never travels alone ──────────────────────────────────────────────
   `bits.tsx` states this rule in a comment above EvidenceDot, and the knowledge vault
   broke it on fourteen rows: an 8px circle beside a date, green on twelve of them,
   labelled by nothing at all. StatusDot exists and takes its label as a required
   child, so it cannot render a naked circle. */
for (const f of files) {
  if (f.rel.endsWith("components/bits.tsx")) continue;
  for (const { line, n } of codeLines(f.text)) {
    if (/size-(1|1\.5|2|2\.5|3)\s+(shrink-0\s+)?rounded-full/.test(line) && !/StatusDot/.test(line)) {
      add("colour-alone", f.rel, n, line.trim().slice(0, 88),
        "hand-rolled status dot — use <StatusDot tone=…>label</StatusDot>, which cannot render without a label");
    }
  }
}

/* ── 2. semantic colour belongs to primitives ───────────────────────────────────
   One green meaning three unrelated things is what happens when call sites paint.
   `bg-ok` inside a page is that page privately deciding what green means. */
const SEMANTIC = /\b(bg|text|border)-(ok|warn|crit)\b/;
for (const f of files) {
  if (!f.rel.startsWith("src/app/") || f.rel.endsWith(".css")) continue;
  for (const { line, n } of codeLines(f.text)) {
    if (SEMANTIC.test(line)) {
      add("semantic-colour-at-call-site", f.rel, n, line.trim().slice(0, 88),
        "state colour is a primitive's job — route through Chip, StatusDot, SeverityBanner or a Progress tone");
    }
  }
}

/* ── 3. the space scale has holes ───────────────────────────────────────────────
   4·8·12·16·24·32. There is no 5th or 7th stop. `var(--space-5)` resolves to nothing
   and computes to 0 in silence, which is how a rule meant to sit 20px clear of a
   heading ended up pressed flat against it. */
const SPACE_STOPS = new Set(["1", "2", "3", "4", "6", "8"]);
for (const f of files) {
  for (const { line, n } of codeLines(f.text)) {
    for (const m of line.matchAll(/--space-(\d+)/g)) {
      if (!SPACE_STOPS.has(m[1])) {
        add("undefined-token", f.rel, n, `var(--space-${m[1]})`,
          "not a stop on the scale (4·8·12·16·24·32) — resolves to nothing and computes to 0");
      }
    }
  }
}

/* ── 4. type roles, not raw type utilities ──────────────────────────────────────
   Nine roles are declared precisely so a size cannot be chosen ad hoc at a call site. */
const RAW_TYPE = /\b(text-(xs|sm|base|lg|xl|2xl)|font-(normal|medium|semibold|bold))\b/;
for (const f of files) {
  if (!f.rel.startsWith("src/app/")) continue;
  for (const { line, n } of codeLines(f.text)) {
    if (RAW_TYPE.test(line)) {
      add("raw-type-utility", f.rel, n, line.trim().slice(0, 88),
        "use a declared type role (type-data, type-meta, type-section, …) rather than a raw size or weight");
    }
  }
}

/* ── 5. a measured quantity states its own colour ───────────────────────────────
   A bar in a file that also draws a legend must say which legend entry it is. The
   vault filled its bar to the verified percentage in near-black, one line under a key
   saying verified is green. */
for (const f of files) {
  if (!f.rel.startsWith("src/app/")) continue;
  const hasLegend = /StatusDot|EvidenceDot/.test(f.text);
  for (const { line, n } of codeLines(f.text)) {
    if (/<Progress\b/.test(line) && hasLegend && !/tone=/.test(line)) {
      add("uncoloured-bar-beside-legend", f.rel, n, line.trim().slice(0, 88),
        "this file draws a legend; give the bar a `tone` so it agrees with the key beneath it");
    }
  }
}

/* ── 6. every contracted screen exists ──────────────────────────────────────────
   A contract naming a route that no longer ships is a spec drifting from the product
   it claims to describe. */
for (const path of Object.keys(CONTRACTS)) {
  const parts = path.split("/").filter(Boolean);
  const direct = join(SRC, "app", ...parts, "page.tsx");
  const dynamic = parts.length > 1 ? join(SRC, "app", parts[0], "[id]", "page.tsx") : null;
  const exists = files.some((f) => f.path === direct || (dynamic && f.path === dynamic));
  if (!exists) {
    add("contract-without-screen", "evals/contracts.mjs", 0, path, "contract names a route with no page");
  }
}

/* ── report ─────────────────────────────────────────────────────────────────── */
const RULES = [
  ["colour-alone", "Colour with no word"],
  ["semantic-colour-at-call-site", "State colour painted by a page"],
  ["undefined-token", "Token that resolves to nothing"],
  ["raw-type-utility", "Raw type utility instead of a role"],
  ["uncoloured-bar-beside-legend", "Bar that disagrees with its key"],
  ["contract-without-screen", "Contract with no screen"],
];

const byRule = {};
for (const f of findings) (byRule[f.rule] ??= []).push(f);

let out = "\nTIER 1 — static invariants\n" + "─".repeat(58) + "\n";
for (const [rule, title] of RULES) {
  const hits = byRule[rule] ?? [];
  out += `\n${hits.length === 0 ? "PASS" : "FAIL"}  ${title}  (${hits.length})\n`;
  for (const h of hits.slice(0, 10)) out += `      ${h.file}:${h.n}  ${h.detail}\n`;
  if (hits.length > 10) out += `      … and ${hits.length - 10} more\n`;
  if (hits.length) out += `      → ${hits[0].why}\n`;
}
out += "\n" + "─".repeat(58) + `\n${findings.length} finding(s) across ${files.length} files\n`;

/* ── the baseline ───────────────────────────────────────────────────────────────
   A checker that reports sixty-eight problems on the day it is introduced gets
   switched off by the end of the week. The baseline records what was already there,
   so CI fails on a REGRESSION rather than on history: the debt is visible, and it can
   only shrink. `--update` re-baselines deliberately, which is a reviewable diff.

   Counting per rule rather than per finding on purpose — line numbers move whenever
   anything above them changes, and a baseline that churns on every edit is noise. */
const BASELINE = join(ROOT, "evals", "baseline.json");
const counts = Object.fromEntries(RULES.map(([r]) => [r, (byRule[r] ?? []).length]));

if (process.argv.includes("--update")) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(BASELINE, JSON.stringify(counts, null, 2) + "\n");
  console.log(out + "\nbaseline written — " + findings.length + " known finding(s)\n");
  process.exit(0);
}

let prior = null;
try {
  prior = JSON.parse(readFileSync(BASELINE, "utf8"));
} catch {
  console.log(out + "\nno baseline yet — run `npm run eval:static -- --update` to record one\n");
  process.exit(0);
}

const regressions = RULES
  .map(([rule, title]) => ({ rule, title, was: prior[rule] ?? 0, now: counts[rule] }))
  .filter((r) => r.now > r.was);
const improvements = RULES
  .map(([rule, title]) => ({ rule, title, was: prior[rule] ?? 0, now: counts[rule] }))
  .filter((r) => r.now < r.was);

for (const i of improvements) out += `\n  ↓ ${i.title}: ${i.was} → ${i.now}`;
for (const r of regressions) out += `\n  ↑ NEW ${r.title}: ${r.was} → ${r.now}`;
out += improvements.length || regressions.length ? "\n" : "\n  no change against baseline\n";

console.log(out);
process.exit(regressions.length ? 1 : 0);
