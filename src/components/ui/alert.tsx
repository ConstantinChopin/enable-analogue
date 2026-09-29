import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* An alert is a bordered row at column width: symbol · title · one sentence.
   Ink on tint for state; the neutral form is a hairline box on raised paper. */
const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg px-[var(--space-4)] py-[var(--space-3)] type-data has-[>svg]:grid-cols-[calc(var(--icon-lg)+var(--space-3))_1fr] has-[>svg]:gap-x-0 [&>svg]:size-[var(--icon-lg)] [&>svg]:translate-y-px [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "border border-hairline bg-raised text-label",
        ok: "bg-ok-soft text-ok",
        warn: "bg-warn-soft text-warn",
        crit: "bg-crit-soft text-crit",
        destructive: "bg-crit-soft text-crit",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 type-data-strong", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("col-start-2 grid justify-items-start gap-1 type-data", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
