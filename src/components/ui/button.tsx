import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/* ── Button — what a control is, said by its shape (VIS-042) ──────────────────
   A rectangle DOES. A pill CHOOSES (Segmented, Tabs, FilterChip) or STATES (Chip).
   An underline GOES somewhere. Nothing crosses: a pill never acts, a rectangle never
   chooses, an underline never acts. Fill says how much an action matters.

   default     the ONE primary action per surface (and per sheet, VIS-081): ink fill,
               radius-2. At the end of the tool that owns it.
   secondary   a grey fill, radius-2, under the content it extends.
   tertiary    a quiet action: no fill at rest, the grey fill on hover, radius-2. In
               the title row or a chapter footer. Verb labels ("Add note", "Upload").
   destructive the one filled action that removes something: claret, radius-2, only
               inside the sheet that confirms it.
   ghost       icon-only chrome (back, close, search): a circle, no fill at rest.
   link        NAVIGATION ONLY: underlined text that opens another screen or a saved
               view ("Open the ledger →"). Never an action — an action is a tertiary.
   outline     retired (VIS-042): a secondary sits on any ground now that surfaces
               are translucent. Kept only so nothing breaks while callers move.

   Sizes: md 40 (the row module) and sm 32; icon variants are circles.
   States (VIS-060): hover is a fill step, press is scale 0.96 (`.pressable`),
   focus is the double ring (global), disabled is a colour swap.               */
const buttonVariants = cva(
  "pressable font-sans inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap type-data font-medium select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[var(--icon-md)]",
  {
    variants: {
      variant: {
        default:
          "rounded-md bg-ink text-on-ink hover:bg-ink-hover active:bg-ink-pressed disabled:bg-ink-disabled disabled:text-on-ink-disabled",
        secondary:
          "rounded-md bg-interactive text-label hover:bg-interactive-hover active:bg-interactive-pressed disabled:bg-disabled disabled:text-label-disabled",
        tertiary:
          "rounded-md text-label hover:bg-interactive active:bg-interactive-pressed disabled:text-label-disabled",
        outline:
          "rounded-md border border-hairline bg-raised text-label hover:border-stroke-hover disabled:border-hairline disabled:text-label-disabled",
        ghost:
          "rounded-md text-label-secondary hover:bg-interactive hover:text-label disabled:text-label-disabled",
        link:
          "h-auto rounded-sm px-0 text-label underline underline-offset-4 decoration-link-rest hover:decoration-ink disabled:text-label-disabled",
        destructive:
          "rounded-md bg-crit text-on-ink hover:brightness-95 disabled:bg-disabled disabled:text-label-disabled",
      },
      size: {
        default: "h-[var(--control-h-md)] px-[var(--control-px-md)]",
        sm: "h-[var(--control-h-sm)] gap-1.5 px-[var(--control-px-sm)]",
        icon: "size-[var(--control-h-md)] rounded-full",
        "icon-sm": "size-[var(--control-h-sm)] rounded-full",
      },
    },
    /* A text action has no box: whatever size it is given for line-height parity, it
       keeps no height and no inline padding, so it sits flush with the text beside it. */
    compoundVariants: [
      { variant: "link", size: "default", className: "h-auto px-0" },
      { variant: "link", size: "sm", className: "h-auto px-0" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
