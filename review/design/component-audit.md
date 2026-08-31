# Component audit — consistency and reuse

Prompted by a real symptom: moving between dock tiles, page headers land in different places and content sits differently. Measured rather than eyeballed.

---

## 1. The layout contract was not one contract

Title position, measured from the content panel's own edge:

| Route | Title left | Why |
|---|---|---|
| Briefing, Notifications | 97px | no scrollbar |
| Records, Knowledge | 89px | a scrollbar takes 16px, so the centred column shifts 8px |
| Ask | 25px | used `width="full"` — a different contract entirely |

Two distinct defects wearing one symptom.

**Fixed.** `scrollbar-gutter: stable` on the scrolling panel, so a scrolling surface is never narrower than a still one — the 8px slide between tiles is gone. And Ask now uses the same `wide` column as every other surface; it still manages its own height for the sticky composer, but its title lands where the eye expects it. All routes now measure 89 / 25.

**Rule:** every surface uses `Page width="wide"` unless there is a stated reason in the file. `full` is not a default; it is an argument.

## 2. Reuse — what is healthy and what is not

| Primitive | Reuse | Verdict |
|---|---|---|
| `Chip` | 156 component uses vs 4 inline pills | healthy |
| `.row-grid` | every list row | healthy |
| **Card shell** | 59 `Section` uses vs **26 hand-rolled** `rounded-lg border border-border` shells, plus **3 files that invented a local `ListCard`** | **the real duplication** |
| **Segmented control** | reimplemented **3 times** (view toggle, tag filters, state filters), each with its own radius and size | **duplicated** |

The card duplication had a cause worth recording rather than just a count: `Section` baked in `p-4` and offered no header rule, so any card whose body is a list of rows — where the rows own their own gutters — could not use it. Three agents independently hit the same wall and each wrote their own. **A primitive that is missing a variant does not get extended; it gets bypassed.**

**Fixed.** `Section` now takes `flush` (header rule, body padding removed, for row-list cards), `actions` (right side of the header) and `footer` (top rule, pinned with `mt-auto` so footers align across a grid row). Defaults render exactly as before, so the 59 existing uses are untouched. `Segmented` is now one component with optional icon and count, replacing the three implementations.

## 3. Residual arbitrary values

The sweep covered seven surfaces; three things escaped it:

- **The sign-in page was never swept** — ~10 arbitrary sizes (`text-[19px]`, `text-[12.5px]`, `text-[11.5px]`…). It sits outside the app shell, which is exactly why it was missed, and exactly why it will be noticed: it is the first screen anyone sees.
- `rounded-[5px]` in two segmented controls and `text-[12.5px]` in the view toggle — all three now resolved by the `Segmented` primitive.

## 4. The standing rules

1. **One card shell.** If a card needs something `Section` cannot do, add the variant to `Section` — never hand-roll a shell.
2. **One segmented control**, one chip, one row grid.
3. **`Page width="wide"`** unless the file states why not.
4. **The panel reserves its scrollbar gutter** so layout never depends on content length.
5. **A missing variant is a bug in the primitive**, not a licence to bypass it. Every hand-rolled shell in this codebase was a variant request in disguise.
