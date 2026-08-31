import { redirect } from "next/navigation";

/**
 * Notices due has been retired (§10b). The queues — notices due, records awaiting
 * confirmation, unmatched payments — are tags inside the one triage space rather
 * than three destinations, so this address forwards to triage.
 *
 * It forwards without a tag on purpose. `Records` exists only for the advisor and
 * the colleague; a lead or ops following this address landed on a filter that could
 * not match anything and read as an empty inbox. Triage already opens on everything
 * still open, and the tags are one click from there.
 */
export default function NoticesRedirect(): never {
  redirect("/notifications");
}
