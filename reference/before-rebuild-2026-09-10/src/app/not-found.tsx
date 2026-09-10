/**
 * The not-found boundary. Same voice as the missing candidate on
 * /admin/review/[id]: name the address, say what is not there, and offer the
 * surface that holds the thing the person was probably looking for.
 */
import Link from "next/link";
import { Page, PageHeader } from "@/components/layouts";
import { Section } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <Page width="wide">
      <PageHeader title="No screen at this address" />
      <Section>
        <p className="max-w-[62ch] type-data text-muted-foreground">
          Nothing in this workspace answers to it. The address may be older than the build, or the
          surface may have moved behind the account menu — settings and connections are not
          workspace tiles.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/briefing">
              Back to the briefing <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/notifications">
              Everything needing a decision <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>
    </Page>
  );
}
