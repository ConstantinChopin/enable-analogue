"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      /* The header keeps its rule beneath — it is the only `border-b` in the table, and
         it separates the column names from the data the way the `<ul>` lists' header
         row does. Body rows carry `border-t` instead, so nothing rules the last row. */
      className={cn("[&_tr]:border-b [&_tr]:border-border", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      /* shadcn stripped the last row's border because every row carried `border-b`.
         Rows now carry `border-t` from the second onward, so there is nothing to
         strip — and stripping it here would remove the last row's *top* rule. */
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
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

/* ── Reconciled with the row primitive ──────────────────────────────────────────
   This is the only table primitive in the product, and the commissions ledger is its
   only consumer — every other list is `Section flush` + `.row-grid`. It arrived with
   shadcn's own spacing scale (`p-2` cells, `h-10` heads) which was never reconciled
   with the system's, so the one surface using it sat at half the horizontal inset and
   two-thirds the row height of every other table in the app: 8px against 16px, 35px
   against 52px. It read as a spreadsheet dropped into a workspace.

   The values below are the row primitive's, so a ledger row and a directory row now
   measure the same. `border-b` becomes `border-t` from the second row onward, which
   is the same rule the `<ul>` lists follow — no rule beneath the final row.          */
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-border transition-colors hover:bg-muted/40 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
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
        "h-9 px-4 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
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
      /* min-h matches `.row-grid`'s 36px; the padding ladder is the same 16/10. */
      className={cn(
        "px-4 py-2.5 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
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
      className={cn("mt-4 text-sm text-muted-foreground", className)}
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
