/**
 * Screen contracts — what each surface is FOR.
 *
 * This file exists because of a question the product could not answer during a
 * review: "who is this screen for, and what am I meant to do first?" Nothing in the
 * codebase declared an answer, so nothing could be checked against one, and the
 * knowledge vault drifted into serving two people and leading with a statistic
 * neither of them could act on.
 *
 * A contract is not documentation. Every tier of the eval harness reads this file:
 *   tier 1 checks the taxonomy budget against what the source actually imports
 *   tier 2 checks that `primaryAction` is present and reachable in the DOM
 *   tier 3 asks a model to describe the screen cold, then diffs its answer against
 *          `job` and `primaryAction` — which is the test that catches an unanswerable
 *          screen before a reviewer does
 *
 * `taxonomies` is a BUDGET, not a list of features. Each entry is one thing colour is
 * allowed to mean on that screen. The vault carried three — connector health, source
 * verification, document sync — through a single green dot, which is how one token
 * came to mean three unrelated things.
 */

/** Roles, and the route prefixes each may enter (mirrors shell.tsx routeRoles). */
export const ROLES = ["advisor", "colleague", "lead", "ops"];

export const ROUTE_ROLES = [
  { prefix: "/admin", roles: ["lead", "ops"] },
  { prefix: "/ops", roles: ["ops", "lead"] },
  { prefix: "/ask", roles: ["advisor", "colleague"] },
  { prefix: "/travellers", roles: ["advisor", "colleague"] },
  { prefix: "/itineraries", roles: ["advisor"] },
  { prefix: "/commissions", roles: ["advisor", "ops", "lead"] },
  { prefix: "/notices", roles: ["advisor"] },
];

export function rolesFor(path) {
  const hit = ROUTE_ROLES.find((r) => path === r.prefix || path.startsWith(r.prefix + "/"));
  return hit ? hit.roles : ROLES;
}

export const CONTRACTS = {
  "/briefing": {
    job: {
      advisor: "see what today needs from me and go to it",
      lead: "see what the desk needs from me and go to it",
    },
    primaryAction: "open the queue a widget names",
    taxonomies: ["severity", "freshness"],
  },

  "/records": {
    job: { advisor: "find a property and check what is true about it" },
    primaryAction: "open a record",
    taxonomies: ["evidence state", "trust"],
  },

  "/records/maison-leandre": {
    job: { advisor: "check a value, see where it came from, and settle it if it disagrees" },
    primaryAction: "resolve the disputed commission",
    taxonomies: ["evidence state", "layer ownership"],
  },

  "/ask": {
    job: { advisor: "ask a question and be able to check the answer" },
    primaryAction: "ask a question",
    taxonomies: ["answer state"],
  },

  "/knowledge": {
    job: {
      lead: "decide what the assistant is allowed to answer from",
      ops: "decide what the assistant is allowed to answer from",
      advisor: "find and read a document",
    },
    primaryAction: { lead: "assign access to a document", advisor: "open a document" },
    taxonomies: ["access scope", "document state"],
  },

  "/commissions": {
    job: { advisor: "see what is owed and chase what is late" },
    primaryAction: "open a commission",
    taxonomies: ["payment state"],
  },

  "/admin/connections": {
    job: { lead: "keep the sources the answers are built from healthy" },
    primaryAction: "reconnect a failing source",
    taxonomies: ["connection state"],
  },

  "/admin/publish": {
    job: { lead: "release what arrived, and set what the agency shares by default" },
    primaryAction: "publish a queued item",
    taxonomies: ["publication state"],
  },

  "/admin/review": {
    job: { lead: "decide which extracted candidates become records" },
    primaryAction: "open a candidate for review",
    taxonomies: ["extraction confidence"],
  },

  "/travellers": {
    job: { advisor: "find a traveller" },
    primaryAction: "open a traveller",
    taxonomies: ["sharing state"],
  },

  "/itineraries": {
    job: { advisor: "check a trip is ready to travel" },
    primaryAction: "open a trip",
    taxonomies: ["readiness"],
  },

  "/notices": {
    job: { advisor: "see what changed at a property and act on it" },
    primaryAction: "acknowledge or action a notice",
    taxonomies: ["severity"],
  },

  "/notifications": {
    job: { advisor: "clear what is waiting on me" },
    primaryAction: "action a notification",
    taxonomies: ["severity"],
  },

  "/settings": {
    job: { advisor: "change how the product behaves for me" },
    primaryAction: "change a setting",
    taxonomies: [],
  },
};

/** Every (path, role) pair the harness should exercise. */
export function matrix() {
  const out = [];
  for (const [path, c] of Object.entries(CONTRACTS)) {
    const allowed = rolesFor(path);
    const declared = Object.keys(c.job);
    for (const role of declared) {
      if (allowed.includes(role)) out.push({ path, role, contract: c });
    }
  }
  return out;
}
