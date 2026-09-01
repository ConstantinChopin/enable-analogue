"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/* A bar measures a quantity, and a quantity in this product usually has a colour
   already — the legend under it, or the chip beside it, has named one. The bar had no
   way to agree: the indicator was hardcoded to `bg-primary`, so the vault drew its
   verified proportion in near-black one line under a legend saying verified is green.
   The bar and its own key disagreed about the same number.

   `tone` keeps that decision in the primitive rather than letting call sites paint
   indicators by hand. `neutral` is the default and is what every existing bar keeps:
   a plain quantity with no colour claim anywhere near it. */
const TONES = {
  neutral: { fill: "bg-primary", track: "bg-primary/20" },
  ok: { fill: "bg-ok", track: "bg-ok/15" },
  warn: { fill: "bg-warn", track: "bg-warn/15" },
  crit: { fill: "bg-crit", track: "bg-crit/15" },
} as const

function Progress({
  className,
  value,
  tone = "neutral",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  tone?: keyof typeof TONES
}) {
  const t = TONES[tone]
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full",
        t.track,
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full w-full flex-1 transition-all", t.fill)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
