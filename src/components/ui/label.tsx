"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/* A label names a field: the machine's voice at the control's own weight (510). */
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 type-data font-medium text-label select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:text-label-disabled peer-disabled:cursor-not-allowed peer-disabled:text-label-disabled",
        className
      )}
      {...props}
    />
  )
}

export { Label }
