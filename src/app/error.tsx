"use client";
/**
 * The error boundary. The product's rule about answers holds for its own failures:
 * say what happened, say what it did not touch, and give the person the next act.
 * No apology, no "oops", and no reload-and-hope.
 */
import Link from "next/link";
import { Page, PageHeader } from "@/components/layouts";
import { Section } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw } from "lucide-react";

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
      <Section>
        <p className="max-w-[62ch] type-data text-muted-foreground">
          The failure is in the interface, not in the workspace. Nothing was written, no record
          changed, and no answer was published from a partial read.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono type-micro text-muted-foreground">
            reference {error.digest}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={reset}>
            <RotateCcw className="size-3.5" aria-hidden /> Load it again
          </Button>
          <Button asChild variant="outline">
            <Link href="/briefing">
              Back to the briefing <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>
    </Page>
  );
}
