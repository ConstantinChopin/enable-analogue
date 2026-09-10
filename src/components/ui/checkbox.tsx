"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/* Checked is inverse: ink box, paper mark (VIS-021). 18px, a hairline at rest. */
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "pressable peer size-[18px] shrink-0 cursor-pointer rounded-sm border border-strong bg-raised",
        "hover:border-stroke-hover",
        "data-[state=checked]:border-selected data-[state=checked]:bg-selected data-[state=checked]:text-on-selected",
        "disabled:cursor-not-allowed disabled:border-hairline disabled:bg-disabled disabled:text-label-disabled",
        "aria-invalid:border-crit",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" strokeWidth={2.5} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
