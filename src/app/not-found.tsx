"use client";
/**
 * The not-found boundary. Same voice as the missing candidate on
 * /admin/review/[id]: name the address, say what is not there, and offer the
 * surface that holds the thing the person was probably looking for.
 *
 * Recomposed (docs/rebuild/04): the page's name once, then an EmptyState. There
 * is no primary here — nothing on this surface is an act the person came to do —
 * so the way back is a grey secondary, and the second route is a text action.
 * A client component because it hands EmptyState an icon component, which a
 * server boundary cannot serialise.
 */
import Link from "next/link";
import { Page, PageHeader } from "@/components/layouts";
import { EmptyState } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <Page width="wide">
      <PageHeader title="No screen at this address" />
      <EmptyState
        icon={SearchX}
        title="Nothing in this workspace answers to it."
        body="The address may be older than the build, or the surface may have moved behind the account menu — settings and connections are not workspace tiles."
        action={
          <div className="flex flex-wrap items-center justify-center gap-[var(--space-4)]">
            <Button asChild variant="secondary">
              <Link href="/briefing">Back to the briefing</Link>
            </Button>
            <Button asChild variant="link" size="sm">
              <Link href="/notifications">Everything needing a decision</Link>
            </Button>
          </div>
        }
      />
    </Page>
  );
}
