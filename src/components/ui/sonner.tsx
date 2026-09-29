"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

/* The toast (VIS-097; src/lib/notify.ts): bottom centre, just above the dock, on raised
   paper at the card's elevation, in the product's type (globals.css, "The toast"). The
   next one stacks behind it. Light only: the product has one ground. */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      offset={{ bottom: 84 }}
      mobileOffset={{ bottom: 76 }}
      visibleToasts={3}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--sys-bg-raised)",
          "--normal-text": "var(--sys-label-primary)",
          "--normal-border": "transparent",
          "--border-radius": "var(--radius-3)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
