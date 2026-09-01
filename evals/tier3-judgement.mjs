/**
 * Tier 3 — judgement.
 *
 * Tiers 1 and 2 check coherence: does the product agree with itself. They would both
 * have passed the screen that failed the review, because that screen was internally
 * consistent and still could not answer "who is this for, and what am I meant to do
 * first?". Nothing in the codebase declared an answer, so nothing could be checked
 * against one.
 *
 * This tier screenshots every screen, asks a model to describe it COLD — no contract
 * in the prompt, no leading — and then diffs what it saw against what the contract
 * says the screen is for. A disagreement means the screen is not communicating its own
 * purpose, which is precisely the failure a person found by looking.
 *
 * The rubric asks for observations, not opinions. "Does this look good" produces
 * agreeable noise. "Name the largest element and say whether it is actionable" produces
 * a fact that can be compared with an intention.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { open } from "./lib/browser.mjs";
import { matrix } from "./contracts.mjs";

const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.EVAL_MODEL ?? "claude-sonnet-5";
const SHOTS = join(process.cwd(), "evals", "shots");
mkdirSync(SHOTS, { recursive: true });

const RUBRIC = `You are looking at one screen of an internal product for luxury travel advisors, cold.

Answer strictly as JSON, no prose outside it:
{
  "job": "<in one short sentence, what is this screen FOR — what is the person here to accomplish?>",
  "primaryAction": "<the single most important action available, in a few words>",
  "largestElement": "<what dominates the screen visually>",
  "largestIsActionable": <true|false>,
  "firstTouch": "<what a first-time user would click first>",
  "colourMeanings": ["<each distinct thing colour signals here, one per entry>"],
  "confusions": ["<anything genuinely ambiguous or contradictory; empty array if none>"]
}

Be concrete and literal. Report what is on the screen, not what a product like this usually does.`;

function overlaps(a, b) {
  /* Deliberately generous. The question is whether the model landed in the same
     territory as the contract, not whether it guessed the same words — a stricter
     comparison would fail on synonyms and teach everyone to ignore the result. */
  const stop = new Set(["the", "a", "an", "and", "or", "to", "of", "for", "is", "it", "what",
    "this", "that", "on", "in", "from", "with", "my", "me", "i", "see", "screen", "page", "you"]);
  const words = (s) => new Set(String(s).toLowerCase().match(/[a-z]{3,}/g)?.filter((w) => !stop.has(w)) ?? []);
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return false;
  let hit = 0;
  for (const w of A) if (B.has(w)) hit++;
  return hit / Math.min(A.size, B.size) >= 0.34;
}

async function judge(pngBase64) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/png", data: pngBase64 } },
          { type: "text", text: RUBRIC },
        ],
      }],
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  const text = body.content.map((c) => c.text ?? "").join("");
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("no JSON in response");
  return JSON.parse(m[0]);
}

const rows = [];
const h = await open();
try {
  for (const { path, role, contract } of matrix()) {
    const { page, ctx, landed } = await h.visit(path, role);
    if (landed !== path) { await ctx.close(); continue; }

    const slug = (path.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home") + "--" + role;
    const png = await page.screenshot({ path: join(SHOTS, slug + ".png") });
    await ctx.close();

    if (!KEY) { rows.push({ path, role, skipped: true }); continue; }

    const declaredJob = contract.job[role] ?? Object.values(contract.job)[0];
    const declaredAction = typeof contract.primaryAction === "string"
      ? contract.primaryAction
      : contract.primaryAction[role] ?? Object.values(contract.primaryAction)[0];

    try {
      const seen = await judge(png.toString("base64"));
      rows.push({
        path, role, seen, declaredJob, declaredAction,
        jobMatch: overlaps(seen.job, declaredJob),
        actionMatch: overlaps(seen.primaryAction, declaredAction),
        budget: contract.taxonomies.length,
        colourCount: (seen.colourMeanings ?? []).length,
      });
    } catch (e) {
      rows.push({ path, role, error: e.message });
    }
  }
} finally {
  await h.close();
}

/* ── report ─────────────────────────────────────────────────────────────────── */
let out = "\nTIER 3 — judgement\n" + "─".repeat(58) + "\n";

if (!KEY) {
  out += `\n${rows.length} screenshot(s) written to evals/shots/\n`;
  out += "\nANTHROPIC_API_KEY is not set, so nothing was judged. Screenshots are on disk\n";
  out += "and the harness is ready; export a key and re-run to grade them.\n";
  console.log(out);
  process.exit(0);
}

let failures = 0;
for (const r of rows) {
  if (r.error) { out += `\nERROR ${r.path} · ${r.role}  ${r.error}\n`; failures++; continue; }
  const bad = [];
  if (!r.jobMatch) bad.push(`job: saw "${r.seen.job}"\n            contract "${r.declaredJob}"`);
  if (!r.actionMatch) bad.push(`action: saw "${r.seen.primaryAction}"\n            contract "${r.declaredAction}"`);
  if (r.seen.largestIsActionable === false) bad.push(`largest element is not actionable: "${r.seen.largestElement}"`);
  if (r.colourCount > Math.max(r.budget, 1)) bad.push(`colour carries ${r.colourCount} meanings, budget ${r.budget}: ${r.seen.colourMeanings.join(" / ")}`);
  for (const c of r.seen.confusions ?? []) bad.push(`confusion: ${c}`);

  failures += bad.length ? 1 : 0;
  out += `\n${bad.length ? "FAIL" : "PASS"}  ${r.path} · ${r.role}\n`;
  for (const b of bad) out += `      ${b}\n`;
}

out += "\n" + "─".repeat(58) + `\n${rows.length - failures}/${rows.length} screens communicate their contract\n`;
writeFileSync(join(process.cwd(), "evals", "tier3-report.json"), JSON.stringify(rows, null, 2) + "\n");
console.log(out);
process.exit(failures ? 1 : 0);
