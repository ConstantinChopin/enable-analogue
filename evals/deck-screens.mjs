/**
 * The case study's screens, captured from the prototype.
 *
 * The deck (../enable-collins-v2/assets/screens) shows the prototype at 1440×900 at 2×.
 * Each entry below is one screen the deck uses: who is signed in, where, and what is
 * done before the capture — a conversation opened, a chapter scrolled into view. It
 * lives here, beside the harness, so the deck can be re-shot whenever the product
 * changes instead of drifting away from it.
 *
 *   EVAL_BASE=http://localhost:3100 node evals/deck-screens.mjs <out-dir> [file …]
 *
 * With no file names every screen is captured.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = process.env.EVAL_BASE ?? "http://localhost:3100";
const OUT = process.argv[2];
const ONLY = new Set(process.argv.slice(3));
if (!OUT) { console.error("usage: node evals/deck-screens.mjs <out-dir> [file …]"); process.exit(2); }

/* Scroll the nearest scrolling ancestor so an element sits a little below its top edge.
   The page owns its scroll — the window never scrolls — so scrollIntoView alone would
   pin the element hard against the frame. */
const scrollTo = (locate, offset = 24) => async (page) => {
  const el = await locate(page);
  await el.evaluate((node, off) => {
    let sc = node.parentElement;
    while (sc && !(sc.scrollHeight > sc.clientHeight && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
    if (!sc) return;
    const top = node.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop;
    sc.scrollTop = Math.max(0, top - off);
  }, offset);
};
const heading = (name) => (page) => page.getByRole("heading", { name }).first();

export const SCREENS = [
  {
    file: "02-v2-ask-spa.png", role: "user", path: "/ask",
    /* The spa question: the answer carries the active notice. */
    prepare: async (page) => { await page.getByText("Is the spa at Maison Léandre open?", { exact: true }).first().click(); },
  },
  { file: "03-briefing.png", role: "user", path: "/briefing" },
  {
    file: "05-record-fields.png", role: "user", path: "/records/maison-leandre",
    /* The agency layer: three sources disagreeing on commission, the overlay, provenance. */
    prepare: scrollTo(heading("Agency overlay")),
  },
  {
    file: "15-traveller.png", role: "user", path: "/travellers/s-marchetti",
    /* The slide's beat is the suggestion row, so the frame holds the attributed
       preferences and the labelled suggestion together; the top of the page cuts it off. */
    prepare: scrollTo(heading(/^Preferences/), 24),
  },
  {
    file: "16-itinerary.png", role: "user", path: "/itineraries",
    /* The caption is that products come straight off the directory. The trips list shows
       no product; the day board shows one carrying its programme and incentive. */
    prepare: scrollTo((page) => page.locator("#opened-trip"), 24),
  },
  /* The vault as the owner sees it: what arrives, from where, and who may read it. */
  { file: "18-knowledge.png", role: "owner", path: "/knowledge" },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const shot of SCREENS) {
    if (ONLY.size && !ONLY.has(shot.file)) continue;
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      reducedMotion: "reduce",
    });
    await ctx.addInitScript((role) => {
      try { window.sessionStorage.setItem("enable-demo-state", JSON.stringify({ signedIn: true, role, world: "v2" })); } catch {}
    }, shot.role);
    const page = await ctx.newPage();
    await page.goto(BASE + shot.path, { waitUntil: "networkidle", timeout: 300_000 });
    /* The Next dev indicator is not the product. */
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await page.waitForTimeout(1200);
    if (shot.prepare) { await shot.prepare(page); await page.waitForTimeout(700); }
    const landed = new URL(page.url()).pathname;
    await page.screenshot({ path: join(OUT, shot.file) });
    console.log(`${landed === shot.path ? "ok " : "→ " + landed}  ${shot.file}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
