import * as React from "react"

import { cn } from "@/lib/utils"

/* ── Input — a field's text is what the user typed (400) ─────────────────────
   Radius-2, hairline at rest, ink stroke on hover and focus (with the double
   ring), disabled is a colour swap. `size` mirrors Button's so "controls of
   the same class on one line take the same size" is expressible.            */
function Input({
  className, type, size = "md", ...props
}: Omit<React.ComponentProps<"input">, "size"> & { size?: "sm" | "md" }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        size === "sm" ? "control-sm" : "control-md",
        "pressable w-full min-w-0 border border-hairline bg-raised text-label",
        "placeholder:text-label-placeholder hover:border-stroke-hover focus-visible:border-stroke-hover",
        "disabled:cursor-not-allowed disabled:bg-disabled disabled:text-label-disabled disabled:hover:border-hairline",
        "aria-invalid:border-crit",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-label",
        className
      )}
      {...props}
    />
  )
}

export { Input }
