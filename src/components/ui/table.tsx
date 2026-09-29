"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* ── Table — the ledger, reconciled with the row primitive ───────────────────
   Column heads in `type-meta`, tertiary ink, sentence case (VIS-092), over one
   hairline; body rows at the 40px row module, with inset hairlines between them.
   The row's states are the selectable row's (VIS-093), drawn in globals.css on
   the cells: hover a rounded fill step, selected lifted onto raised paper. A
   page marks the selected row with data-state="selected" and nothing else. */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      /* Width is auto, not full: globals.css gives the box room for a lifted row's
         shadow and takes it back with negative margins, so the table keeps its width. */
      className="relative overflow-x-auto"
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
      className={className}
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

/* A row you can click is a row you can reach (WCAG 2.1.1, COL-07): it takes focus,
   Enter or Space selects it, Enter on the selected row opens it (`onOpen`, the full
   page), and ↑/↓ move between rows. A double-click opens it too. */
function TableRow({
  className, onClick, onOpen, onKeyDown, onDoubleClick, tabIndex, ...props
}: React.ComponentProps<"tr"> & { onOpen?: () => void }) {
  const interactive = Boolean(onClick || onOpen)
  return (
    <tr
      data-slot="table-row"
      className={cn(interactive && "cursor-pointer", className)}
      tabIndex={tabIndex ?? (interactive ? 0 : undefined)}
      onClick={onClick}
      onDoubleClick={(e) => { onDoubleClick?.(e); if (!e.defaultPrevented) onOpen?.() }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented || e.target !== e.currentTarget) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          if (e.key === "Enter" && onOpen && props["aria-selected"]) onOpen()
          else onClick?.(e as unknown as React.MouseEvent<HTMLTableRowElement>)
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          const sib = (e.key === "ArrowDown" ? e.currentTarget.nextElementSibling : e.currentTarget.previousElementSibling) as HTMLElement | null
          if (sib?.dataset.slot === "table-row") { e.preventDefault(); sib.focus() }
        }
      }}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-[var(--control-h-sm)] px-[var(--space-4)] text-left align-middle whitespace-nowrap type-meta text-label-tertiary [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
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
