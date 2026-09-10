"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        /* A label names a field, which makes it the machine's voice at the control's
           own weight — the same 510 stop Button uses. It shipped at shadcn's 14px,
           the last live `text-sm` in the product, so every form still spoke a size
           the type scale does not contain. */
        "flex items-center gap-2 type-data font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
