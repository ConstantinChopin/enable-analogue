"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* ── Table — the ledger, reconciled with the row primitive ───────────────────
   Column heads in `type-micro-caps` (Airbnb's field-label form), body rows at
   the 40px row module, hairlines between rows, none under the last. Hover is a
   fill step; a selected row inverts nothing — it carries a 2px ink left edge,
   so selection reads without colour and without hiding the row's own tints.  */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom type-data", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:border-hairline", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={className}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-hairline bg-sunken type-data-strong [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-hairline transition-colors duration-200 ease-standard hover:bg-interactive/60 has-aria-expanded:bg-interactive/60",
        "data-[state=selected]:shadow-[inset_2px_0_0_0_var(--sys-fill-selected)] data-[state=selected]:bg-interactive/40",
        "[&:not(:first-child)]:border-t",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-[var(--control-h-sm)] px-[var(--space-4)] text-left align-middle whitespace-nowrap type-micro-caps text-label-tertiary [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "h-[var(--row-h)] px-[var(--space-4)] py-[11px] align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-[var(--space-4)] type-meta", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
