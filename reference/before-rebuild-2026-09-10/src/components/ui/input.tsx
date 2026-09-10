import * as React from "react"

import { cn } from "@/lib/utils"

/* `size` mirrors Button's, so the rule "controls of the same class on one line take the
   same size" is expressible. A filter row is uniformly `sm`; a form is `md`. */
function Input({
  className, type, size = "md", ...props
}: Omit<React.ComponentProps<"input">, "size"> & { size?: "sm" | "md" }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        size === "sm" ? "control-sm" : "control-md",
        /* `control-md` carries height, inline padding, radius and type together, so an
           input and a button on the same line cannot drift apart. shadcn shipped
           `text-base` with a `md:text-sm` override — two sizes, neither of them a role. */
        "w-full min-w-0 border border-input bg-transparent shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
