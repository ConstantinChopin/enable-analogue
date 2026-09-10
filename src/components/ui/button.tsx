import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/* ── Button — the action ladder made visible (VIS-041) ───────────────────────
   default   the ONE primary action per surface: an ink pill. The only pill that acts.
   secondary a grey fill, radius-2, under the content it extends.
   outline   a hairline box on raised paper — a secondary that must sit on a fill.
   ghost     no surface at rest; fill on hover. For icon buttons in chrome.
   link      a text action: underlined, in the title row.
   destructive the one filled action that removes something; claret, radius-2, never a pill.

   Sizes: md 40 (the row module) and sm 32; icon variants are square.
   States (VIS-060): hover is a fill step, press is scale 0.96 (`.pressable`),
   focus is the double ring (global), disabled is a colour swap.               */
const buttonVariants = cva(
  "pressable font-sans inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap type-data font-medium select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[var(--icon-md)]",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-ink text-on-ink hover:bg-ink-hover active:bg-ink-pressed disabled:bg-ink-disabled disabled:text-on-ink-disabled",
        secondary:
          "rounded-md bg-interactive text-label hover:bg-interactive-hover active:bg-interactive-pressed disabled:bg-disabled disabled:text-label-disabled",
        outline:
          "rounded-md border border-hairline bg-raised text-label hover:border-stroke-hover disabled:border-hairline disabled:text-label-disabled",
        ghost:
          "rounded-md text-label-secondary hover:bg-interactive hover:text-label disabled:text-label-disabled",
        link:
          "h-auto rounded-sm px-0 text-label underline underline-offset-4 decoration-hairline hover:decoration-ink disabled:text-label-disabled",
        destructive:
          "rounded-md bg-crit text-on-ink hover:brightness-95 disabled:bg-disabled disabled:text-label-disabled",
      },
      size: {
        default: "h-[var(--control-h-md)] px-[var(--control-px-md)] data-[variant=default]:px-[var(--control-px-pill)]",
        sm: "h-[var(--control-h-sm)] gap-1.5 px-[var(--control-px-sm)]",
        icon: "size-[var(--control-h-md)] rounded-full",
        "icon-sm": "size-[var(--control-h-sm)] rounded-full",
      },
    },
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
