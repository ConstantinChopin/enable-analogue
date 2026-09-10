"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-[var(--space-3)]", className)}
      {...props}
    />
  )
}

/* Selected is inverse: an ink ring with a paper dot inside it. */
function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "pressable aspect-square size-[18px] shrink-0 cursor-pointer rounded-full border border-strong bg-raised",
        "hover:border-stroke-hover",
        "data-[state=checked]:border-selected data-[state=checked]:bg-selected",
        "disabled:cursor-not-allowed disabled:border-hairline disabled:bg-disabled",
        "aria-invalid:border-crit",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex size-full items-center justify-center"
      >
        <span className="size-[6px] rounded-full bg-on-selected" aria-hidden />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
