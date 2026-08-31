import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  /* `font-sans` is explicit, not inherited. A control is the machine's voice in every
     context, including inside a serif answer — a button that picks up the prose face
     from its container stops reading as something you can press. */
  /* Type comes from the system, not from shadcn's `text-sm`. Every button rendered at
     14px/20 while the largest sans role is 13px — a parallel scale underneath the
     declared one. Default icon size is `--icon-md` (14px), which pairs with 13px type
     optically; 16px is reserved for severity marks, where the icon is the information. */
  "font-sans inline-flex shrink-0 items-center justify-center gap-2 rounded-md type-data font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[var(--icon-md)]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      /* Two heights, from the control geometry system, and a rule for choosing:

           md (36) — the action a surface exists for. At most ONE filled `md` per
                     screen, because a second one cancels the first.
           sm (28) — everything else: filters, inline actions, sheet controls,
                     anything sitting in a dense row.

         Without the rule the sizes split 42/45 across 87 call sites by habit, and the
         page header's routine action carried the same weight as the one action a
         refusal exists to offer. */
      size: {
        default: "h-[var(--control-h-md)] px-[var(--control-px-md)] has-[>svg]:pl-[10px]",
        sm: "h-[var(--control-h-sm)] gap-1.5 px-[var(--control-px-sm)] has-[>svg]:pl-2",
        icon: "size-[var(--control-h-md)]",
        "icon-sm": "size-[var(--control-h-sm)]",
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
