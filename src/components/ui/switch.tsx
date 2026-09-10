"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/* On is inverse (ink track, paper thumb); off is the strong stroke as a fill. */
function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "pressable peer group/switch inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "data-[size=default]:h-6 data-[size=default]:w-10 data-[size=sm]:h-5 data-[size=sm]:w-8",
        "data-[state=checked]:bg-selected data-[state=unchecked]:bg-strong",
        "disabled:cursor-not-allowed disabled:bg-disabled",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-raised shadow-elev-1 transition-transform duration-200 ease-standard",
          "group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-4",
          "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 group-data-[size=sm]/switch:data-[state=checked]:translate-x-3"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
