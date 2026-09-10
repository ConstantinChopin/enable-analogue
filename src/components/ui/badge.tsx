import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/* ── Badge — a status tag: ink on tint, never tint alone, words beside colour ─
   Not an action. Radius-1 like Airbnb's tag row; the pill is reserved for chips
   that float over content (see bits.Chip). `outline` is the neutral default. */
const badgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-sm px-1.5 type-micro [&>svg]:pointer-events-none [&>svg]:size-[var(--icon-sm)]",
  {
    variants: {
      variant: {
        default: "bg-sunken text-label-secondary",
        secondary: "bg-sunken text-label-secondary",
        outline: "border border-hairline text-label-secondary",
        ok: "bg-ok-soft text-ok",
        warn: "bg-warn-soft text-warn",
        crit: "bg-crit-soft text-crit",
        destructive: "bg-crit-soft text-crit",
        ghost: "text-label-secondary",
        link: "text-label underline underline-offset-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
