import type { Metadata } from "next";

/* The CPO's roadmap, made clickable. Unlisted: it carries dates that belong to a
   contract, so it asks search engines to stay away. */
export const metadata: Metadata = {
  title: "Enable VIC — Roadmap to V1",
  robots: { index: false, follow: false, nocache: true },
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
