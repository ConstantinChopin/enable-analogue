/**
 * Token-level contrast — computed once, at the token file, not per screen.
 *
 * Every sys-* foreground/background pair the constitution allows is checked here
 * against WCAG's 4.5:1 floor (3:1 for the two levels the design language restricts
 * to non-essential text). A pair that fails here fails on every screen, so this is
 * the cheapest place to catch it. Run: `node evals/tokens-aa.mjs`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/* Resolve `--name: value;` declarations inside :root, following var() references. */
const decl = {};
for (const m of css.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)) decl[m[1]] ??= m[2].trim();
function resolve(name, depth = 0) {
  const v = decl[name];
  if (!v || depth > 10) return null;
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  return ref ? resolve(ref[1], depth + 1) : v;
}
function hex(name) {
  const v = resolve(name);
  const m = v && v.match(/^#([0-9a-f]{6})$/i);
  if (!m) throw new Error(`${name} does not resolve to a hex colour (got ${v})`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lum([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(fg, bg) {
  const [a, b] = [lum(hex(fg)), lum(hex(bg))];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/* The pairs the constitution allows. `floor` is the standard the pair is held to. */
const GROUNDS = ["--sys-bg-base", "--sys-bg-raised", "--sys-bg-overlay", "--sys-bg-sunken", "--sys-fill-interactive"];
const PAIRS = [];
for (const g of GROUNDS) {
  PAIRS.push({ fg: "--sys-label-primary", bg: g, floor: 4.5 });
  PAIRS.push({ fg: "--sys-label-secondary", bg: g, floor: 4.5 });
  PAIRS.push({ fg: "--sys-label-tertiary", bg: g, floor: 3, note: "non-essential text only" });
  PAIRS.push({ fg: "--sys-ok", bg: g, floor: 4.5 });
  PAIRS.push({ fg: "--sys-warn", bg: g, floor: 4.5 });
  PAIRS.push({ fg: "--sys-crit", bg: g, floor: 4.5 });
}
PAIRS.push({ fg: "--sys-on-ink", bg: "--sys-ink", floor: 4.5 });
PAIRS.push({ fg: "--sys-on-ink", bg: "--sys-ink-hover", floor: 4.5 });
PAIRS.push({ fg: "--sys-on-ink-disabled", bg: "--sys-ink-disabled", floor: 3, note: "disabled" });
PAIRS.push({ fg: "--sys-label-on-selected", bg: "--sys-fill-selected", floor: 4.5 });
PAIRS.push({ fg: "--sys-ok", bg: "--sys-ok-soft", floor: 4.5 });
PAIRS.push({ fg: "--sys-warn", bg: "--sys-warn-soft", floor: 4.5 });
PAIRS.push({ fg: "--sys-crit", bg: "--sys-crit-soft", floor: 4.5 });
PAIRS.push({ fg: "--sys-on-ink", bg: "--sys-crit", floor: 4.5 });
PAIRS.push({ fg: "--sys-label-disabled", bg: "--sys-fill-disabled", floor: 3, note: "disabled" });

let out = "\nTOKENS — contrast at the token file\n" + "─".repeat(58) + "\n";
let failed = 0;
for (const p of PAIRS) {
  const r = ratio(p.fg, p.bg);
  const ok = r >= p.floor;
  if (!ok) failed++;
  out += `${ok ? "PASS" : "FAIL"}  ${p.fg.padEnd(26)} on ${p.bg.padEnd(24)} ${r.toFixed(2)}:1  (floor ${p.floor}${p.note ? ", " + p.note : ""})\n`;
}
out += "─".repeat(58) + `\n${PAIRS.length - failed}/${PAIRS.length} pairs pass\n`;
console.log(out);
process.exit(failed ? 1 : 0);
