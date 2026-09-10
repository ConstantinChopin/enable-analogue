# Divider

**Purpose.** Three greys do three different jobs. A divider is never decorative; each weight/colour pair means one thing.

**Confidence.** Computed at 1440; counts from the listing page census.

## Kinds

| Kind | Value | Width | Count | Job |
|---|---|---|---|---|
| Section rule | 1px `#DDDDDD` (`grey400`, `border-tertiary`) | 653 in the content column, 1120 full width | 6 + 5 | separates one section from the next; sits *between* sections, drawn by its own element, not as a section border |
| Row rule (sheet) | 1px `#DDDDDD` | row width | per row | separates rows in a long single-column list |
| Input segment | 1px `#8C8C8C` (`grey600`, `border-secondary`) | 324 | 4 | the line between CHECK-IN and CHECKOUT — a *control* boundary, darker than a content rule |
| Card hairline | 1px `rgba(0,0,0,.04)` | card width | 2 | part of the elevation recipe; makes a white card edge survive on white |
| Chrome hairline | 1px `#EBEBEB` (`grey300`, `bg-divider`) | full | 1 | bottom tab bar top edge (mobile) |
| Sticky header edge | `0 1px 0 rgba(0,0,0,.10)` as box-shadow | full | 1 | the header's lower edge when it floats |
| Selected outline | 1px `#222` | control | 4 | a pressed/selected control's border — not a divider, but the same 1px stroke family |

## Rules the measurements show

1. **Section rules are the rhythm.** Every content section on the listing page is `padding 48 · content · padding 48 · 1px #DDD`. The rule plus 96px of air is the section unit. At 375 the air drops to 32 + 24 but the rule stays.
2. **Rules span the column, not the page.** 653 in the left column, 1120 for full-width sections. A rule tells you how wide the section is.
3. **Darker means "control".** `#8C8C8C` appears only inside inputs. `#DDDDDD` is content. `#EBEBEB` is chrome. The eye learns the hierarchy from three values.
4. **Hairlines belong to elevation.** The 4% black ring is always paired with a shadow; it never appears alone.
5. **No rules inside a section.** Rows on the page are separated by height (48) and columns, never by lines. Lines return only in the sheet, where the list is long and single-column.
