/**
 * The route-level loading boundary. Every surface in this product is a read of the
 * same workspace, so there is one loading treatment rather than a bespoke skeleton
 * per screen — and it says what is being waited on instead of spinning.
 */
import { QuietLoading } from "@/components/bits";

export default function Loading() {
  return <QuietLoading />;
}
