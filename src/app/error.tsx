"use client";
/**
 * The error boundary. Say what happened and give the person the next act. No apology,
 * no "oops", and no claim the boundary cannot check: it does not know what was or was
 * not written before the screen failed, so it does not say (UX sweep FB-08, 2026-09-28).
 *
 * Recomposed (docs/rebuild/04): the page's name once in the header, then an
 * EmptyState at column width. The ONE primary is "Load it again" — the act that
 * belongs to this surface — and "Back to the briefing" is the grey secondary
 * beside it. The reference, when there is one, is the only machine text.
 */
import Link from "next/link";
import { Page, PageHeader } from "@/components/layouts";
import { EmptyState } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { CircleAlert } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Page width="wide">
      <PageHeader title="This screen did not load" />
      <EmptyState
        icon={CircleAlert}
        title="Something went wrong while showing this screen."
        body="Load it again. If it fails again, go back to the Briefing and open it from there."
        action={
          <>
            {error.digest && (
              <p className="mb-[var(--space-4)] type-meta tnum text-label-secondary">reference {error.digest}</p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-[var(--space-2)]">
              <Button onClick={reset}>Load it again</Button>
              <Button asChild variant="secondary">
                <Link href="/briefing">Back to the briefing</Link>
              </Button>
            </div>
          </>
        }
      />
    </Page>
  );
}
