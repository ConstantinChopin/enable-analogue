"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/* A bar measures a quantity that usually has a colour already — the legend under
   it has named one. `tone` keeps that decision in the primitive so the bar and its
   own key cannot disagree. `neutral` is ink on the sunken fill: a plain quantity
   with no colour claim anywhere near it.                                         */
const TONES = {
  neutral: { fill: "bg-ink", track: "bg-sunken" },
  ok: { fill: "bg-ok", track: "bg-ok-soft" },
  warn: { fill: "bg-warn", track: "bg-warn-soft" },
  crit: { fill: "bg-crit", track: "bg-crit-soft" },
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
        "relative h-1.5 w-full overflow-hidden rounded-full",
        t.track,
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full w-full flex-1 rounded-full transition-transform duration-200 ease-standard", t.fill)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
