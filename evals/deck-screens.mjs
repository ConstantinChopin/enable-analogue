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
/* The same, but the element's foot sits just above the frame's foot: for a list whose
   point is at its end. */
const scrollToFoot = (locate, offset = 24) => async (page) => {
  const el = await locate(page);
  await el.evaluate((node, off) => {
    let sc = node.parentElement;
    while (sc && !(sc.scrollHeight > sc.clientHeight && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
    if (!sc) return;
    const bottom = node.getBoundingClientRect().bottom - sc.getBoundingClientRect().top + sc.scrollTop;
    sc.scrollTop = Math.max(0, bottom - sc.clientHeight + off);
  }, offset);
};
const sectionOf = (name) => (page) => heading(name)(page).locator("xpath=ancestor::section[1]");

export const SCREENS = [
  {
    file: "02-v2-ask-spa.png", role: "user", path: "/ask",
    /* The spa question: the answer carries the active notice. */
    prepare: async (page) => { await page.getByText("Is the spa at Maison Léandre open?", { exact: true }).first().click(); },
  },
  { file: "03-briefing.png", role: "user", path: "/briefing" },
  {
    file: "05-record-fields.png", role: "user", path: "/records/maison-leandre",
    /* Commission and amenities, programme by programme (VIS-102, VIS-103): Atelier's tray
       open with the three sources disagreeing and the negotiated perk, Meridian's closed
       beneath it with its rate and what guests get. */
    prepare: scrollTo(heading("Programmes")),
  },
  {
    file: "15-traveller.png", role: "user", path: "/travellers/s-marchetti",
    /* The slide's beat is the suggestion row, so the frame holds the attributed
       preferences and the labelled suggestion together; the top of the page cuts it off. */
    prepare: scrollTo(heading(/^Preferences/), 24),
  },
  {
    file: "16-itinerary.png", role: "user", path: "/itineraries/kyoto-kansai?line=k2",
    /* The caption is that products come straight off the directory: the ryokan's line
       open beside the trip carries the record, its programme and what guests get, read
       from the same programme link the record shows. */
  },
  /* The vault as the owner sees it: what arrives, from where, and who may read it. */
  { file: "18-knowledge.png", role: "owner", path: "/knowledge" },
  /* Challenge 1: what the extractor proposed, with the file each came from; one a
     possible duplicate, one held because its source row was unreadable. */
  { file: "22-review-queue.png", role: "owner", path: "/admin/review" },
  {
    file: "13-admin-sereno.png", role: "owner", path: "/admin/review/sereno",
    /* The slide's beat is the held rows at the foot of the sheet: the extractor
       declining to guess, with no confirm on them, beside the rail's count. */
    prepare: scrollToFoot(sectionOf("Extracted fields")),
  },
  {
    file: "24-record-editing.png", role: "user", path: "/records/maison-leandre",
    /* The header's Edit keeps every field's Edit showing, not only on hover. */
    prepare: async (page) => {
      await page.getByRole("button", { name: "Edit", exact: true }).click();
      await scrollTo(heading("Enable canonical"))(page);
    },
  },
  {
    file: "24-edit-sheet.png", role: "user", path: "/records/maison-leandre",
    /* Who the change is for, asked before what it says; the whole agency goes to the
       owner for release, and the commit says so. Only the sheet is captured. */
    prepare: async (page) => {
      await page.getByRole("button", { name: "Edit pool hours" }).click({ force: true });
      await page.getByLabel("The whole agency").click();
      await page.getByLabel("New value").fill("07:00–20:00");
      await page.getByLabel(/^Why\?/).fill("Confirmed by the front desk on today’s call.");
      await page.locator("textarea:focus").blur();
    },
    element: "[role=dialog]",
  },
  {
    file: "25-ledger-selected.png", role: "user", path: "/commissions?sel=vo",
    /* Challenge 4, details that hold: a selected row lifts rather than tints, ochre is
       the one commission waiting on a decision, every other state is a word, and the
       inspector repeats the row in the page's own words. */
  },
  {
    file: "21-sharing-sheet.png", role: "user", path: "/travellers/s-marchetti",
    /* A traveller is shared with a person, and spend stays behind the entitlement. A
       short frame, so the sheet ends where its content does. */
    viewport: { width: 1440, height: 560 },
    prepare: async (page) => {
      await page.getByRole("button", { name: /^Share with/ }).click();
      await page.getByLabel(/the full profile/).click();
    },
    element: "[role=dialog]",
  },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const shot of SCREENS) {
    if (ONLY.size && !ONLY.has(shot.file)) continue;
    const ctx = await browser.newContext({
      viewport: shot.viewport ?? { width: 1440, height: 900 },
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
    const want = new URL(BASE + shot.path).pathname;
    /* A sheet is shown on its own, beside the record it belongs to. */
    if (shot.element) await page.locator(shot.element).first().screenshot({ path: join(OUT, shot.file) });
    else await page.screenshot({ path: join(OUT, shot.file) });
    console.log(`${landed === want ? "ok " : "→ " + landed}  ${shot.file}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
