import { redirect } from "next/navigation";

/**
 * Notices due has been retired (§10b). The queues — notices due, records awaiting
 * confirmation, unmatched payments — are tags inside the one triage space rather
 * than three destinations, so this address forwards to its tag.
 */
export default function NoticesRedirect(): never {
  redirect("/notifications?tag=Records");
}
