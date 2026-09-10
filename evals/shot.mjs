/**
 * Screenshot one or more screens at a real viewport, signed in as a role.
 *
 *   EVAL_BASE=http://localhost:3100 node evals/shot.mjs advisor /briefing /records/maison-leandre
 *   … --width 375 --height 812 --out ./shots-mobile --full
 *
 * Uses the same seeded session as tiers 2 and 3, so what it captures is what the
 * harness sees. Files land in `--out` (default evals/shots) as <route>--<role>.png.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { open } from "./lib/browser.mjs";

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const flag = (name) => args.includes(name);
const width = Number(opt("--width", 1440));
const height = Number(opt("--height", 900));
const out = opt("--out", join(process.cwd(), "evals", "shots"));
const full = flag("--full");
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--") && !args[i - 1].startsWith("--full")));
const role = positional[0] ?? "advisor";
const paths = positional.slice(1);
if (!paths.length) { console.error("usage: node evals/shot.mjs <role> <path> [path…]"); process.exit(2); }

mkdirSync(out, { recursive: true });
const h = await open({ width, height });
try {
  for (const path of paths) {
    const { page, ctx, landed } = await h.visit(path, role);
    const file = join(out, `${path.replace(/^\//, "").replace(/[\/\[\]]+/g, "-") || "root"}--${role}${width < 768 ? "--mobile" : ""}.png`);
    await page.screenshot({ path: file, fullPage: full });
    console.log(`${landed === path ? "ok " : "→ " + landed}  ${file}`);
    await ctx.close();
  }
} finally {
  await h.close();
}
