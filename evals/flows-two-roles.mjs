/**
 * Cross-account flows — what one sign-in does, the other sees.
 *
 * Tiers 1–3 render one screen for one person. The two-role model's claims are about
 * the handoffs between the two people (docs/rebuild/05-two-roles.md §2): a record the
 * user shares with the whole agency waits in the owner's queue and goes out when she
 * releases it; a value the user proposes at agency scope reaches the owner as a
 * notification and takes effect when she approves it. Each flow here seeds one person's
 * state, acts as the other, reads the state back, and asserts as the first again.
 *
 *   EVAL_BASE=http://localhost:3100 node evals/flows-two-roles.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.EVAL_BASE ?? "http://localhost:3000";
const KEY = "enable-demo-state";

const base = {
  signedIn: true, role: "user", world: "v2", narration: false, commissionAccess: true,
  conflictResolved: false, conflictChoice: null, conflictReason: null,
  reminder: "idle", reminderBy: null, spaNoticeClosed: false, verlaineAcked: false,
  candidateConfirmed: false, paymentMatched: false, shareTier: "private", requestFiled: false,
  noteSaved: false, prefConfirmed: false, askScope: null, notices: {}, fieldEdits: {},
  createdRecords: [], createdTravellers: [], released: {}, retired: {}, accessRequests: [], docShares: {},
};

const results = [];
const check = (flow, step, ok, detail = "") => results.push({ flow, step, ok, detail });

const browser = await chromium.launch();
async function as(state, path) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript((st) => { try { sessionStorage.setItem("enable-demo-state", JSON.stringify(st)); } catch {} }, state);
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const text = async () => (await page.locator("main").innerText()).replace(/\s+/g, " ");
  const stored = async () => JSON.parse(await page.evaluate((k) => sessionStorage.getItem(k), KEY));
  return { page, ctx, text, stored };
}

try {
  /* ── Flow 1: a record shared with the whole agency ─────────────────────────── */
  {
    const record = { id: "hand-casa-test", name: "Casa Test", category: "Hotel", city: "Lisbon", country: "Portugal", by: "user", share: "agency" };
    const asUser = { ...base, role: "user", createdRecords: [record] };

    // The owner sees it waiting, in her inbox and in her queue.
    let o = await as({ ...asUser, role: "owner" }, "/notifications");
    let t = await o.text();
    check("record → agency", "owner's inbox names it", /shared a new record with the whole agency/i.test(t), t.slice(0, 120));
    await o.ctx.close();

    o = await as({ ...asUser, role: "owner" }, "/admin/publish");
    t = await o.text();
    check("record → agency", "queue lists Casa Test as waiting", /Casa Test/.test(t) && /waiting/i.test(t));
    // She publishes it from the row.
    const row = o.page.locator("li, tr").filter({ hasText: "Casa Test" }).first();
    const publish = row.getByRole("button", { name: /^Publish$/ });
    const canPublish = (await publish.count()) > 0;
    check("record → agency", "row offers Publish", canPublish);
    let released = null;
    if (canPublish) {
      await publish.click();
      await o.page.waitForTimeout(400);
      released = (await o.stored()).released?.["rec-hand-casa-test"];
      check("record → agency", "release recorded as published", released?.outcome === "published", JSON.stringify(released));
    }
    await o.ctx.close();

    // Back as the user: it is now the whole agency's, not waiting.
    if (released) {
      const u = await as({ ...asUser, released: { "rec-hand-casa-test": released } }, "/records");
      t = await u.text();
      check("record → agency", "user's list shows it live, not waiting", /Casa Test/.test(t) && !/waiting for/i.test(t), t.match(/Casa Test[^.]{0,80}/)?.[0] ?? "");
      await u.ctx.close();
      // And the owner now sees it in her own directory.
      const o2 = await as({ ...asUser, role: "owner", released: { "rec-hand-casa-test": released } }, "/records");
      t = await o2.text();
      check("record → agency", "owner's list now holds it", /Casa Test/.test(t));
      await o2.ctx.close();
    }
  }

  /* ── Flow 2: a value proposed at agency scope ──────────────────────────────── */
  {
    const edit = { value: "44", scope: "agency", reason: "counted on the June site visit", by: "user", pending: true };
    const seeded = { ...base, fieldEdits: { rooms: edit } };

    let o = await as({ ...seeded, role: "owner" }, "/notifications");
    let t = await o.text();
    check("proposed value", "owner's inbox names the proposal", /proposed a new rooms/i.test(t), t.slice(0, 120));
    await o.ctx.close();

    o = await as({ ...seeded, role: "owner" }, "/records/maison-leandre?review=rooms");
    t = await o.text();
    check("proposed value", "record shows the proposal and its reason", /44/.test(t) && /June site visit/.test(t));
    const approve = o.page.getByRole("button", { name: /^Approve$/ }).first();
    const canApprove = (await approve.count()) > 0;
    check("proposed value", "owner is offered Approve", canApprove);
    let after = null;
    if (canApprove) {
      await approve.click();
      await o.page.waitForTimeout(400);
      after = (await o.stored()).fieldEdits?.rooms;
      check("proposed value", "approval clears pending", after && after.pending === false && !after.returned, JSON.stringify(after));
    }
    await o.ctx.close();

    if (after) {
      const u = await as({ ...seeded, fieldEdits: { rooms: after } }, "/records/maison-leandre");
      t = await u.text();
      check("proposed value", "user sees 44 applied, no longer awaiting review", /44/.test(t) && !/awaiting review/i.test(t));
      await u.ctx.close();
    }
  }

  /* ── Flow 3: the owner cannot reach a private traveller; a request goes to the user ── */
  {
    let o = await as({ ...base, role: "owner" }, "/travellers/s-marchetti");
    let t = await o.text();
    check("private traveller", "owner sees nothing of the profile", /not shared with you/i.test(t) && !/Prefers classic interiors/.test(t), t.slice(0, 100));
    const ask = o.page.getByRole("button", { name: /Request access/i }).first();
    const canAsk = (await ask.count()) > 0;
    check("private traveller", "owner may ask", canAsk);
    let requests = [];
    if (canAsk) {
      await ask.click();
      await o.page.waitForTimeout(400);
      requests = (await o.stored()).accessRequests ?? [];
      check("private traveller", "request recorded", requests.some((r) => r.travellerId === "s-marchetti" && r.by === "owner"), JSON.stringify(requests));
    }
    await o.ctx.close();

    if (requests.length) {
      const u = await as({ ...base, accessRequests: requests }, "/notifications");
      t = await u.text();
      check("private traveller", "user's inbox carries the request", /asked to see S\. Marchetti/i.test(t), t.slice(0, 120));
      await u.ctx.close();
    }
  }

  /* ── Flow 4: money switched off for the user ──────────────────────────────── */
  {
    const u = await as({ ...base, commissionAccess: false }, "/briefing");
    const t = await u.text();
    check("money switch", "user's brief carries no commission figures", !/EUR 12,532/.test(t) && !/Open the ledger/.test(t), t.slice(0, 100));
    await u.ctx.close();
    const o = await as({ ...base, role: "owner", commissionAccess: false }, "/settings");
    const t2 = await o.text();
    check("money switch", "owner's settings show the switch", /Who can see money/i.test(t2) && /R\. Devane/.test(t2));
    await o.ctx.close();
  }
} finally {
  await browser.close();
}

let out = "\nFLOWS — two roles, across accounts\n" + "─".repeat(58) + "\n";
let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  out += `${r.ok ? "PASS" : "FAIL"}  ${r.flow.padEnd(18)} ${r.step}${r.ok || !r.detail ? "" : "\n        " + r.detail}\n`;
}
out += "─".repeat(58) + `\n${results.length - failed}/${results.length} steps passed\n`;
console.log(out);
process.exit(failed ? 1 : 0);
