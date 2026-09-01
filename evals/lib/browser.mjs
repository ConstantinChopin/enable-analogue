/**
 * Shared browser harness for tiers 2 and 3.
 *
 * Signing in is done by seeding sessionStorage before the first paint rather than by
 * driving the sign-in form. The form is a product surface and will change; the state
 * shape is the contract between the app and its own persistence. Driving the form
 * would make every eval fail the day someone redesigns a button.
 */
import { chromium } from "playwright";

export const BASE = process.env.EVAL_BASE ?? "http://localhost:3000";

const SEED = {
  signedIn: true,
  role: "advisor",
  world: "v2",
  narration: false,
  conflictResolved: false,
  conflictChoice: null,
  conflictReason: null,
  reminder: "idle",
  spaNoticeClosed: false,
  verlaineAcked: false,
  candidateConfirmed: false,
  paymentMatched: false,
  shareTier: "private",
  requestFiled: false,
  noteSaved: false,
  prefConfirmed: false,
  askScope: null,
  notices: {},
  fieldEdits: {},
};

export async function open({ width = 1440, height = 900 } = {}) {
  const browser = await chromium.launch();
  return {
    browser,
    async visit(path, role) {
      const ctx = await browser.newContext({ viewport: { width, height } });
      await ctx.addInitScript((state) => {
        try {
          window.sessionStorage.setItem("enable-demo-state", JSON.stringify(state));
        } catch {}
      }, { ...SEED, role });
      const page = await ctx.newPage();
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      /* The shell replaces the route when a role may not enter it, and the store
         rehydrates on a effect — so settle before asserting anything. */
      await page.waitForTimeout(900);
      return { page, ctx, landed: new URL(page.url()).pathname };
    },
    close: () => browser.close(),
  };
}

/** Semantic colours, resolved from the running stylesheet rather than guessed. */
export async function palette(page) {
  return page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const read = (n) => cs.getPropertyValue(n).trim();
    return { ok: read("--ok"), warn: read("--warn"), crit: read("--crit"), primary: read("--primary") };
  });
}
