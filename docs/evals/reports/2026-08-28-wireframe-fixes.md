# Wireframe fix disposition — 2026-08-28

Responds to `2026-08-28-wireframe-coverage.md` and `2026-08-28-wireframe-ux.md`. Applied and verified in-browser; artifact republished (label: eval-fix-pass).

## Applied

**UX fixes 1–12 (all):** create-notice now lands on the record with a success banner; resolved-conflict chip clears in the directory (and resets); briefing/review aliased rows de-linked (dup candidate row opens the merge sheet instead); provenance popover scoped to the commission field only; E-U5 files a request banner instead of leaking an advisor onto an admin surface; Ask crumb resets on nav and reset; candidate confirmation names its 2 held fields as excluded; scope choosers unified to Private (default) / Team / Agency-wide; nav renamed to user vocabulary (Notices due, Confirm new records, Unmatched payments) with "notice" as the single user-facing word; share-VIC and request commits got success feedback; button hierarchy corrected (solid = commit; "Send" not "Review & send"); traveller preference conflict wired to the shared resolve sheet.

**Coverage Tier 1 (all six):** records-verified fifth widget on the briefing; briefing notice → Ask (A-EP4) with context crumb; answer conflict → "Open the record" (E-EP3); commission-calendar row (C-EP3); Ask loading/timeout state with partial trace + retry (A-X1); preference composer sheet with required source taxonomy (DEC-28/F7).

**Coverage Tier 2 (cheap wins):** ⌘K placeholder in the top bar (A-EP2/E-EP2); candidate Reject CTA (D6); contradicting-notices row in Notices due (B-U4); audit placeholders for permission-shaped answers + second-account leak proof (A12/B-U3) on the publish screen; stale field with one-tap verify on the record card (E-U3); tightest-scope inheritance box (D-U5); quiet-day state note (C-E3).

## Deliberately deferred to the built prototype (not wireframe material)

- Tier 3 secondary edges: relative dates, dual currency at answer level, document dedup (A-E2/3/4); rename history (B-E2/E-E1); atomicity errors (B-X1, C-X2, D-X1, E-X2); processor-migration event (C-E2); re-ingestion diffs (D-E2); household trips + revoke audit interval (F-E3/U4); "ended pending close" render (B-E1); draft lifecycle state.
- Loading skeletons beyond Ask: a global pattern decision for the hi-fi build, noted in acceptance criteria already.
- Full feedback parity on non-demo sheet commits (merge/match/close/connect): pattern established; instances land in the build.

These deferrals are recorded so Eval 2 (acceptance) treats them as build obligations, not silent drops.
