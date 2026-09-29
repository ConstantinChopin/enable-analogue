import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        /* A textarea grows, so it takes the type and radius of the control system but
           not its fixed height. Padding matches `control-md`'s inline value. */
        "pressable flex field-sizing-content min-h-20 w-full rounded-md border border-hairline bg-raised px-[var(--control-px-md)] py-[10px] type-data text-label",
        "placeholder:text-label-placeholder hover:border-stroke-hover focus-visible:border-stroke-hover",
        "disabled:cursor-not-allowed disabled:bg-disabled disabled:text-label-disabled",
        "aria-invalid:border-crit",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
