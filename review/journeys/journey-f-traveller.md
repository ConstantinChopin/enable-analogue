# Journey F — The Traveller

**Status:** spec (leaner scope than A/B/E by design) · **Persona:** Advisor (owner); a second advisor (collaborator); Agency lead (policy access)
**Screens touched:** Travellers list, Traveller profile, Preference composer, Share sheet, (read-only) trip history
**Evidence pack:** `../evidence/decisions.md`, `../evidence/signals.md`. Mechanisms without a DEC/SIG id are extrapolation, declared in the Appendix.

---

## 1. Purpose

The traveller (VIC) profile is the most sensitive record type in the product, and its rules differ from product records in exactly two ways: **ownership** (personal-by-default, advisor-owned [DEC-09, DEC-30]) and **sharing** (explicit and tiered: Collaborator Full/Basic, team scope, agency directory [DEC-31, superseding DEC-01 — see E1]). Everything else inherits Journey E's anatomy: layered fields, provenance, freshness. The design stake: a preference applied to a trip must be **attributed to the profile, never guessed** [DEC-28].

## 2. Profile anatomy

Identity and contact; **preferences organized in up to 7 travel-profile types** (Business / Leisure / Romantic / Adventure / Wellness / Cultural / Celebration), each with six blocks and an `is_primary` default [DEC-36] — every preference carrying its source (stated by client, observed on a trip, imported from a system, inferred-and-confirmed) and date [DEC-28; DEC-23 attribution], with a per-preference `ai_confidence` score surfacing confident preferences first [DEC-36]; constraints and dislikes; trip history via the cross-link triangle [DEC-36]; advisor notes with the standard scope choice [SIG-46; Journey E D3]; the Acuity intelligence tab with its four-state machine (Not Run / Running / Complete / Locked), locked behind `canRunAcuity` [DEC-31, DEC-36]. Financial aggregates (lifetime spend, ADR) render only behind `canViewCommissions` [DEC-31; SIG-46].

## 3. Entry points

| # | Entry | Context carried | Evidence |
|---|---|---|---|
| EP1 | **Travellers** in the left nav | owner's own VICs by default | DEC-09 |
| EP2 | Briefing departure item → traveller | the departing trip in context | DEC-13, DEC-27 (trip reminder) |
| EP3 | Product record → linked traveller (permission-gated) | the linking trip | Journey E E4; DEC-09 |

## 4. Happy path

1. Advisor opens a traveller from a departure item (EP2). Profile renders; the departing trip sits on top with its checklist [DEC-27 trip-reminder; checklist contents F1].
2. She adds a preference learned on a call — "no contemporary interiors" — choosing its source ("stated by client, 2026-08-27 call") [DEC-28].
3. She adds a note; scope choice as everywhere (private preselected) [SIG-46, DEC-09].
4. A colleague will cover her leave: she **shares the VIC** at a chosen tier [DEC-31, superseding DEC-01]: **Collaborator Full** (all fields, can edit and run Acuity, cannot re-share or delete) or **Collaborator Basic** (name + contact only, for limited intros); team scope and the admin-managed agency directory are the wider rungs [DEC-30]. As a non-admin, her share routes through the suggestion/approval workflow [DEC-31]. The share is explicit, attributed, revocable, and audited [DEC-09, DEC-29]. Spend fields stay behind `canViewCommissions` regardless of tier [DEC-31].

**Exit criteria:** every preference on the profile can answer "who says so, and when" [DEC-28].

## 5. Unhappy paths

### U1 — Preference conflict at selection [DEC-27]
An advisor adds a property to this traveller's shortlist that contradicts a known dislike. Contextual amber warning: "dislikes contemporary design — this property is listed as contemporary," citing the preference and its source [DEC-27, DEC-28]. Warning, not block: the advisor may proceed knowingly [severity choice F3].

### U2 — Unshared VIC during coverage
The covering advisor searches for the traveller and finds nothing — an unshared VIC is invisible, not "locked" [DEC-09; absent-not-masked, Journey E U2 rule]. Recovery: request access from the owner [request flow F4]. There is no admin backdoor in the advisor UI; agency-lead access follows policy and is audited [DEC-09, DEC-29].

### U3 — Guessed preference blocked
An imported or model-inferred preference without confirmation renders as a **suggestion, labeled**, outside the preferences list until the advisor confirms or discards it [DEC-28: non-cited output labeled AI suggestion; DEC-19 posture]. It is never silently applied to trips.

### U4 — Sharing regret
Share revoked: collaborator loses the profile immediately; the audit records the shared interval [DEC-01; F2].

## 6. Edge cases

- **E1 The sharing iteration — OQ-2 RESOLVED by the schema, and it's a three-stage story.** Stage 1: the data-hierarchy text calls tiered sharing "required" [DEC-09]. Stage 2: the 2026-03-31 decision ships **all-or-nothing** for simplicity, with an explicit revisit trigger ("revisit if advisors refuse to share due to sensitive notes") [DEC-01]. Stage 3: the trigger fires and the production schema carries the tiered outcome — **Collaborator Full / Basic + team scope + agency directory** [DEC-31]. The prototype implements the DEC-31 model; the presentation narrates all three stages as a documented iteration (decision → trigger → reversal), one of the strongest trade-off stories in the case study.
- **E2 Conflicting preference sources:** client said "no boats" in 2025; the same client booked a yacht charter in 2026. Both render, sourced and dated; the advisor resolves per the standard show-all pattern [DEC-02 applied to preferences; DEC-08].
- **E3 Household/shared trips:** a traveller appears on another owner's itinerary; each advisor sees only through their own permission path [DEC-09; rendering F5].

## 7. Errors

- **X1 Import failure:** a system-imported profile fragment that fails validation is held as suggestions (U3 path), never merged raw [DEC-19, DEC-28].
- **X2 Share failure:** share is atomic at its tier — the collaborator gets exactly the tier's field set, never a partial in-between state [DEC-31; F6].

## 8. Instrumentation

- **VIC preference application rate** — preferences correctly reflected and attributed in trips [DEC-28, verbatim metric].
- Suggestions confirmed vs discarded [DEC-28, DEC-19].
- Shares granted/revoked; policy-access audit events [DEC-01, DEC-09].
- Preference-conflict warnings shown vs overridden [DEC-27].

## 9. Acceptance criteria

- [ ] Travellers list shows the owner's VICs; a second seeded account sees none of them until shared.
- [ ] Every seeded preference renders source + date; the composer requires a source [DEC-28].
- [ ] U1 amber warning renders on the seeded contradiction, citing the preference; proceed is possible and recorded.
- [ ] Share flow offers Collaborator Full and Basic tiers to a named collaborator [DEC-31]; the Basic account sees name + contact only; revoke works; audit interval visible to owner.
- [ ] U2: unshared VIC is absent (not masked) for the second account; request-access flow renders.
- [ ] U3: one seeded inferred preference sits in the labeled suggestions area; confirm moves it into preferences with attribution.
- [ ] Financial aggregates absent for non-owner roles [SIG-46].
- [ ] E1 note: the OQ-2 tension is documented on the spec and in presenter material, not silently resolved.
- [ ] Loading / empty / error states; responsive at 390 px.

## 10. Decision log

| # | Decision | Date | Evidence | What changed |
|---|---|---|---|---|
| D1 | VICs personal-by-default, advisor-owned; admin access per policy, audited | data-hierarchy rule | DEC-09, DEC-29, SIG-12, SIG-13 | trust with client data became structural, unblocking rollout |
| D2 | Sharing: all-or-nothing shipped (2026-03-31), then superseded by tiered Collaborator Full/Basic + team + directory when the documented revisit trigger fired | 2026-03-31 → schema v3.1 | DEC-01 → DEC-31 | the three-stage iteration in E1; simplicity first, tiers when evidence demanded them |
| D3 | Preferences attributed, never guessed; inferences are labeled suggestions until confirmed | metric + Phase 4 rule | DEC-28, DEC-19 | personalization split from guessing, measurably |
| D4 | Preference conflicts warn in context at selection time | 2026-03-31 (Early Wins) | DEC-27 | the profile started defending the client inside the workflow |

---

## Appendix — reconstruction vs. extrapolation

| # | Extrapolated mechanism |
|---|---|
| F1 | Departure checklist contents |
| F2 | Share-audit rendering (interval, revocation display) |
| F3 | U1 warn-not-block severity choice |
| F4 | Request-access flow for coverage |
| F5 | E3 permission-path rendering |
| F6 | Share atomicity mechanics |
| F7 | The preference source taxonomy (stated / observed / imported / inferred-confirmed) — DEC-28 grounds attribution; the taxonomy is invented |
| F8 | Suggestions area presentation |
| F9 | The absent-not-masked rendering rule (shared with Journey E's E5 extrapolation; DEC-29 grounds auditability, not this rendering choice) |
| F10 | The share sheet's interaction design (picker, confirmation); DEC-09 grounds named-collaborator targeting itself |

Supporting signals: SIG-46 (financial privacy tier), SIG-42 (client knowledge trapped in personal systems), the unified-client-profile ask (2026-04-23: "pull all of that historical data... your data is at your fingertips instead of things being disjointed" — grounds trip-history aggregation).
