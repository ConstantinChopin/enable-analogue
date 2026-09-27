"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/* ── Tabs — selected is inverse (VIS-021) ────────────────────────────────────
   default  a row of pills; the selected one inverts (ink on paper).
   line     text tabs on a hairline; the selected one carries a 2px ink rule.
   Either way the selected tab differs by more than colour.                    */
function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-[var(--space-4)] data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center group-data-[orientation=vertical]/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "gap-[var(--space-2)]",
        line: "gap-[var(--space-4)] border-b border-hairline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "pressable relative inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap type-data font-medium text-label-secondary hover:text-label disabled:cursor-not-allowed disabled:text-label-disabled [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[var(--icon-md)]",
        /* pills */
        "group-data-[variant=default]/tabs-list:h-[var(--control-h-sm)] group-data-[variant=default]/tabs-list:rounded-full group-data-[variant=default]/tabs-list:border group-data-[variant=default]/tabs-list:border-control-edge group-data-[variant=default]/tabs-list:bg-control-rest group-data-[variant=default]/tabs-list:px-[var(--control-px-sm)]",
        "group-data-[variant=default]/tabs-list:hover:border-control-edge-hover group-data-[variant=default]/tabs-list:hover:bg-control-rest-hover",
        "group-data-[variant=default]/tabs-list:data-[state=active]:border-selected group-data-[variant=default]/tabs-list:data-[state=active]:bg-selected group-data-[variant=default]/tabs-list:data-[state=active]:text-on-selected",
        /* line */
        "group-data-[variant=line]/tabs-list:-mb-px group-data-[variant=line]/tabs-list:h-[var(--control-h-md)] group-data-[variant=line]/tabs-list:border-b-2 group-data-[variant=line]/tabs-list:border-transparent group-data-[variant=line]/tabs-list:px-1",
        "group-data-[variant=line]/tabs-list:data-[state=active]:border-selected group-data-[variant=line]/tabs-list:data-[state=active]:text-label",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
