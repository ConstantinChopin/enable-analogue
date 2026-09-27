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

/** Roles, and the route prefixes each may enter (mirrors shell.tsx routeRoles).
    Two types (docs/rebuild/05-two-roles.md). Every surface is shared except the owner's
    three acts: confirming a record, publishing to the agency, matching unclaimed money. */
export const ROLES = ["user", "owner"];

export const ROUTE_ROLES = [
  { prefix: "/admin", roles: ["owner"] },
  { prefix: "/ops", roles: ["owner"] },
];

export function rolesFor(path) {
  const hit = ROUTE_ROLES.find((r) => path === r.prefix || path.startsWith(r.prefix + "/"));
  return hit ? hit.roles : ROLES;
}

/* A shared surface declares a job for BOTH types, so the harness renders it as each of
   them. Where the two jobs are the same sentence, that sameness is the claim. */
export const CONTRACTS = {
  "/briefing": {
    job: {
      user: "see what today needs from me and go to it",
      owner: "see what only I can clear today, and go to it",
    },
    /* The insight rail's first move is the first act (2026-09-25): one card, its action
       named for what it does. A cold reader should name that action. */
    primaryAction: { user: "act on the first insight", owner: "act on the first insight" },
    taxonomies: ["severity", "freshness"],
  },

  "/records": {
    job: {
      user: "find a property and check what is true about it",
      owner: "find a property and check what is true about it",
    },
    primaryAction: "open a record",
    taxonomies: ["evidence state", "trust"],
  },

  "/records/maison-leandre": {
    job: {
      user: "check a value, see where it came from, and settle it if it disagrees",
      owner: "check a value, see where it came from, and settle it if it disagrees",
    },
    primaryAction: "resolve the disputed commission",
    taxonomies: ["evidence state", "layer ownership"],
  },

  /* Asking is the assistant, on every screen (2026-09-25). This page keeps the saved
     conversations in full, with the sources behind each answer. */
  "/ask": {
    job: {
      user: "reread a conversation and check the sources behind its answer",
      owner: "reread a conversation and check the sources behind its answer",
    },
    primaryAction: "open a conversation",
    taxonomies: ["answer state"],
  },

  "/knowledge": {
    job: {
      user: "find and read a document",
      owner: "decide what the assistant is allowed to answer from, across the agency's sources",
    },
    primaryAction: { user: "open a document", owner: "assign access to a document" },
    taxonomies: ["access scope", "document state"],
  },

  "/commissions": {
    job: {
      user: "see what is owed on my bookings and chase what is late",
      owner: "see what is owed across the agency and chase what is late",
    },
    primaryAction: "open a commission",
    taxonomies: ["payment state"],
  },

  "/connections": {
    job: {
      user: "connect my own mailbox or Drive and keep it working",
      owner: "keep the sources the answers are built from healthy",
    },
    primaryAction: { user: "connect a source", owner: "reconnect a failing source" },
    taxonomies: ["connection state"],
  },

  "/admin/publish": {
    job: { owner: "decide what the whole agency sees" },
    primaryAction: "publish to the whole agency",
    taxonomies: ["publication state"],
  },

  "/admin/review": {
    job: { owner: "decide which extracted candidates become records" },
    primaryAction: "open a candidate for review",
    taxonomies: ["extraction confidence"],
  },

  "/travellers": {
    job: {
      user: "find a traveller",
      owner: "find a traveller I own or one shared with me",
    },
    primaryAction: "open a traveller",
    taxonomies: ["sharing state"],
  },

  "/itineraries": {
    job: {
      user: "check a trip is ready to travel",
      owner: "check a trip is ready to travel",
    },
    primaryAction: "open a trip",
    taxonomies: ["readiness"],
  },

  /* No contract for /notices. The surface was retired and folded into /notifications;
     the address survives only as a redirect. */

  "/notifications": {
    job: {
      user: "clear what is waiting on me",
      owner: "clear what is waiting on me, including what the desk needs from me",
    },
    primaryAction: "action a notification",
    taxonomies: ["severity"],
  },

  "/settings": {
    job: {
      user: "change how the product behaves for me",
      owner: "change how the product behaves for me, and who can see money",
    },
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
