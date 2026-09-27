"use client";
/**
 * The demo's suppliers (the itinerary builder, in the lab).
 *
 * A request sent from a trip is answered a few seconds later, wherever the advisor is:
 * the reply lands in Forwarded mail, is read into a status, a date and a reference
 * (src/data/trip-lines.ts, `replyFor`), and raises a notification. It changes nothing on
 * the trip until she accepts it. Scripted, so a demo cannot hang on a real inbox.
 */
import { useEffect, useRef } from "react";
import { useDemo } from "@/lib/store";

export function SupplierReplies() {
  const { s, d } = useDemo();
  const lines = useRef(s.tripLines);
  useEffect(() => { lines.current = s.tripLines; }, [s.tripLines]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      const now = Date.now();
      for (const l of lines.current) {
        for (const r of l.requests) {
          if (!r.reply && r.replyAt && r.replyAt <= now) d({ type: "lineReply", id: l.id, request: r.id });
        }
      }
    }, 1000);
    return () => window.clearInterval(tick);
  }, [d]);

  return null;
}
