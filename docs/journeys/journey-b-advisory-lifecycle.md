# Journey B — The Advisory Lifecycle

**Status:** spec · **Personas:** Advisor (creates personal advisories), Agency lead (publishes agency advisories, governs sharing)
**Screens touched:** Advisory composer, Record card (notices region), Briefing (notices widget), Answer thread (advisory banner), Admin publish queue, Stale-review queue
**Evidence pack:** `../evidence/decisions.md`, `../evidence/signals.md`. Mechanisms without a DEC/SIG id are design extrapolation, declared in the Appendix.
**Demo note:** this journey carries the time-travel beat (v1 auto-expire → v2 manual close), see `../presenter/demo-choreography.md` beat 6.

---

## 1. Purpose

Time-bound intelligence — a spa closure, a rep change, a commission bonus with a deadline — enters the system at the moment it is learned, surfaces everywhere it changes a decision, and is closed manually, by a person, when it stops being true [DEC-03]. Today this intelligence lives in email and evaporates [SIG-21: "sometimes we read our email, sometimes we don't. And it's always the one time we might not"].

## 2. The advisory object

Per DEC-20, every advisory carries: source + timestamp + owner; visibility scope (personal vs agency [DEC-20]; the team tier per SIG-46's note-level scope). Severity is DEC-18's, not DEC-20's: **Info / Important / Critical**; Critical requires acknowledgment before the subject is used in any itinerary/proposal output; advisories are always permission-filtered; an expired or closed advisory is never treated as current truth.

Lifecycle (v2, current): **draft → active → closed (manual, with reason) → archived**, plus a **stale-review nudge** when an advisory ages past its review interval [DEC-03]. There is no auto-expire [DEC-03, reversing DEC-20's valid-until option — see Decision log D2]. The advisory review interval is its own configurable [B9], deliberately distinct from DEC-27's 90-day stale-data warning on record fields.

Commission incentives are advisories [DEC-21]: linked to the product and partner program, surfaced at search/itinerary time [DEC-21; DEC-27 incentive alert at view/add-to-itinerary], and feeding projected-commission calculations while active.

## 3. Entry points

| # | Entry | Context carried | Evidence |
|---|---|---|---|
| EP1 | Record card → "Add notice" | entity pre-linked | extrapolation B1 |
| EP2 | Briefing → notices widget → "New notice" | none | DEC-13 (briefing as home); mechanism B1 |
| EP3 | Vault document → "Create notice from this" (e.g. a forwarded rate-promo email) | source document pre-attached | DEC-14 + DEC-21; mechanism B2 |
| EP4 | Admin publish queue (agency lead) | advisor-submitted advisory pending publication | DEC-20 (admins/ops publish agency advisories); queue mechanics B3 |

## 4. Happy path

1. Advisor learns the spa at Maison Léandre is closed to mid-September. From the record card (EP1) she creates an advisory: text, severity **Important**, source (the email), scope **personal**.
2. It renders immediately on her record card, her briefing, and her answers involving the property [DEC-18 surfacing; Journey A E1].
3. She shares it to the desk team; scope change is explicit and attributed [DEC-08: no silent overwrites; DEC-09 tiered sharing posture; SIG-46 team-level scope].
4. The agency lead reviews it in the publish queue (EP4) and publishes it **agency-wide**; the advisory now carries the agency layer badge with the original owner preserved [DEC-20; DEC-08].
5. Weeks later the property confirms the spa reopened. The advisor **closes** the advisory with a reason [close-reason rule B11]; it archives; in-product surfaces (answers, cards, briefing) stop showing it immediately, while values synced to upstream systems follow the documented sync reality [SIG-36] [DEC-03; DEC-18: closed is never current truth].
6. If she forgets: at the review interval the advisory appears in her **stale-review queue** — "still true?" — with one-tap confirm-still-active or close [DEC-03: stale advisory review nudge].

**Exit criteria:** no advisory ever dies silently, and none outlives its truth by more than one review interval.

## 5. The documented iteration (v1 → v2) — build both

**v1 (as originally specified):** advisories carry **auto-expire (valid-until)** or manual close [DEC-20, Phase 2 pillar wording].
**Observed failure mode:** an advisory expires while the issue is still ongoing — the spa is still closed, but the notice vanishes and answers return clean. The failure is silent and lands on the client. The adjacent real-world pattern: deferred obligations fall through exactly when a date passes without a human in the loop [SIG-22: "9 couples that were upset because their advisors didn't register them... that's where it falls through the cracks"].
**v2 (resolved 2026-03-31):** no auto-expire; advisories stay active until manually closed; a stale-review nudge catches the opposite failure (immortal advisories) [DEC-03; SIG-23].

**Prototype requirement:** a world toggle renders the same seeded day under v1 and v2. Under v1 the spa advisory has expired and the Journey A answer omits it; under v2 it is active-but-stale and the review nudge is pending. This is demo beat 6.

## 6. Unhappy paths

### U1 — Expired-but-ongoing (the v1 failure, preserved for demonstration)
Under the v1 toggle: advisory hit its valid-until date, issue persists, answers render clean. No warning exists anywhere; the prototype preserves this state to demonstrate the v1 failure. [DEC-20 v1 spec; failure class SIG-22]

### U2 — Critical advisory unacknowledged [DEC-18]
An advisor adds the property to an itinerary/proposal output while a **Critical** advisory is active and unacknowledged. Output is blocked with the advisory shown; acknowledgment is recorded (who, when); only then does the flow continue. Dismissal is not acknowledgment [interaction rule B13].

### U3 — Scope leakage prevented [DEC-18: always permission-filtered; SIG-12]
A personal advisory must never appear in another advisor's answers, cards, or briefing, and never in agency search. Verified from a second seeded account. Admin access follows policy, is deliberate, and is audited [DEC-09; DEC-29: "any override is auditable", break-glass admin access; SIG-13].

### U4 — Contradicting advisories
Two advisors hold contradicting personal advisories on one property ("spa closed" / "spa reopened, saw it Tuesday"). Both render to anyone who can see both, attributed and dated; resolution follows the Journey A conflict pattern: a human confirms, the confirmed state is stored at the agency layer (DEC-08: "usually Agency") [DEC-02]. [surfacing mechanics: extrapolation B4]

### U5 — Stale pile-up
An advisor ignores review nudges; the queue accumulates. The queue sorts oldest-first and escalates visibility on the briefing; advisories are still never auto-closed [DEC-03]. [oldest-first sort + escalation presentation: extrapolation B5]

## 7. Edge cases

- **E1 Incentive expiry vs advisory expiry are different things** [DEC-21 + DEC-03]: a commission bonus has a hard commercial end date ("through June 30" — SIG-20). The *incentive terms* end on the date; the *advisory* still closes manually. After the end date the advisory renders as "ended, pending close" [render state B12], and projected commissions stop including it immediately [DEC-21: active bonus rates feed projected-commission calculations]. Commercial end dates still take effect; advisory closure stays manual.
- **E2 Advisory on an entity mid-change** (property changing brand): advisory follows the entity, not the name; the rename renders in its history. [entity-follow: pure extrapolation B6]
- **E3 Advisory created from a forwarded email** [DEC-14 + EP3]: source document stays attached and permission-filtered; a reader who cannot open the source still sees the advisory text but not the document [DEC-07 zero-leakage posture; mechanism B2].

## 8. Errors

- **X1 Publish failure:** advisor's share/publish action fails mid-flight; the advisory remains at its previous scope with an explicit retry — never a half-published state. [extrapolation B7]
- **X2 Notification miss:** surfacing never depends on notifications; the record card, briefing, and answers are the source of truth [SIG-21 is the argument: inboxes get missed]. Notifications are additive only.

## 9. Instrumentation

- Advisories closed with reason vs. closed from the stale queue (deliberate vs. rescued) [DEC-03 intent].
- Median advisory age at close; count past review interval [extrapolation B8].
- Critical acknowledgments per output; blocked-output count [DEC-18].
- Zero scope-leak audit [DEC-18, SIG-12].

## 10. Acceptance criteria

- [ ] All four entry points create an advisory with correct pre-linked context.
- [ ] Severity model renders all three tiers; Critical blocks itinerary/proposal use until acknowledged, and the acknowledgment is attributed.
- [ ] Scope model: personal / shared-to-team / agency [SIG-46 note-level scope], each change explicit and attributed; second seeded account proves U3 isolation.
- [ ] Manual close requires a reason; closed advisories vanish from answers immediately and appear in history.
- [ ] Stale-review queue renders, sorts oldest-first, and one-tap confirm/close works.
- [ ] **v1/v2 world toggle works on the seeded day**: v1 shows the expired-but-ongoing failure in a Journey A answer; v2 shows active-but-stale + pending nudge.
- [ ] E1: expired incentive stops feeding projections while its advisory awaits manual close.
- [ ] Admin publish queue playable as the agency-lead persona.
- [ ] Loading / empty / error states on every screen; responsive at 390 px.

## 11. Decision log

| # | Decision | Date | Evidence | What changed |
|---|---|---|---|---|
| D1 | Advisory as a first-class object: source + timestamp + owner + scope + severity | Phase 2 pillar | DEC-20 (fields, scope); DEC-18 (severity) | time-bound intel moved out of email into the product [SIG-21] |
| D2 | **Auto-expire reversed → manual close + stale-review nudge** | 2026-03-31 | DEC-20 (v1) → DEC-03 (v2) | the silent-expiry failure mode outweighed the stale-pile-up risk; the nudge addresses the latter [SIG-22, SIG-23] |
| D3 | Critical severity gates output use behind acknowledgment | Phase 2 pillar | DEC-18 | reading a warning and acting on it became separable, auditable steps |
| D4 | Commission incentives modeled as advisories, feeding projections | Phase 2 pillar | DEC-21, SIG-20 | one lifecycle for all time-bound truth instead of a parallel promo system |
| D5 | Advisories permission-filtered everywhere; personal never leaks | Phase 2 pillar + rollout gate | DEC-18, DEC-09, SIG-12, SIG-13 | governance became a launch dependency, not a feature |

---

## Appendix — reconstruction vs. extrapolation

| # | Extrapolated mechanism |
|---|---|
| B1 | Record-card "Add notice" and briefing-widget composer entry points |
| B2 | "Create notice from document" flow and its permission-split rendering (E3) |
| B3 | Publish-queue mechanics (review, publish, badge rendering) |
| B4 | Contradicting-advisories surfacing (U4) beyond the DEC-02 resolution pattern |
| B5 | Stale-queue oldest-first sort and escalation presentation (U5) |
| B6 | Advisory-follows-entity behavior through renames (E2) |
| B7 | X1 half-publish prevention and retry |
| B8 | Derived metrics beyond the DEC-03/DEC-18 intents |
| B9 | The four-state lifecycle naming (draft/active/closed/archived); "review interval" as a configurable |
| B10 | The seeded demo day and the v1/v2 world toggle as a prototype device |
| B11 | Manual close requires a reason (DEC-03 specifies manual close only; the reason rule is design) |
| B12 | E1's "ended, pending close" render state |
| B13 | Dismissal-is-not-acknowledgment interaction rule (U2) |

Supporting signals beyond inline citations: SIG-20 (a real expiring incentive), SIG-34 (infrastructure shifts advisors track by hand — the class of agency-level advisory the publish queue exists for), SIG-40/41 (intelligence spoken aloud and lost — the capture argument).
