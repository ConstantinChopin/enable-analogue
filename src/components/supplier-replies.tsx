"use client";
/**
 * The demo's suppliers (the itinerary builder, in the lab).
 *
 * A request sent from a trip is answered a few seconds later, wherever the advisor is:
 * the reply lands in Forwarded mail, is read into a status, a date and a reference
 * (src/data/trip-lines.ts, `replyFor`), and raises a notification. It changes nothing on
 * the trip until she accepts it. Scripted, so a demo cannot hang on a real inbox.
 *
 * An arrival while she is elsewhere is the one thing a toast announces unasked (FB-10,
 * VIS-097): once, with the way to the line, and kept in the inbox as well.
 */
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/store";
import { replyFor, shortDate } from "@/data/trip-lines";
import { notify } from "@/lib/notify";

export function SupplierReplies() {
  const { s, d } = useDemo();
  const router = useRouter();
  const lines = useRef(s.tripLines);
  useEffect(() => { lines.current = s.tripLines; }, [s.tripLines]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      const now = Date.now();
      for (const l of lines.current) {
        for (const r of l.requests) {
          if (!r.reply && r.replyAt && r.replyAt <= now) {
            d({ type: "lineReply", id: l.id, request: r.id });
            const read = replyFor(l, r.kind);
            const who = l.supplier?.name ?? l.what.split(",")[0];
            const said = read.status === "held" ? `held to ${read.until ? shortDate(read.until) : "further notice"}` : read.status === "confirmed" ? "confirmed" : "declined";
            notify(`${who} replied: ${said}`, {
              detail: l.what,
              action: { label: "Open the line", onClick: () => router.push(`/itineraries/${l.tripId}?line=${l.id}`) },
              seconds: 8,
            });
          }
        }
      }
    }, 1000);
    return () => window.clearInterval(tick);
  }, [d, router]);

  return null;
}
