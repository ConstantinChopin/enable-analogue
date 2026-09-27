import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { DemoProvider } from "@/lib/store";
import { Shell } from "@/components/shell";

/**
 * Two voices, and only two. Instrument Sans is the machine (VIS-090) — chosen on
 * 2026-09-24 from ten sans-serifs set live on the Briefing (evals/paper/out-fonts). It
 * replaces Inter, whose optical-size axis was the earlier argument; Instrument Sans has
 * none, so the 14/18 data floor now stands on reading comfort alone. Newsreader is the
 * person — opsz 6–72 and a much smaller eye (0.636), so prose reads as a different
 * register rather than a decorated version of the same one.
 *
 * Self-hosted from the Fontsource variable packages, read from node_modules at build
 * (2026-09-25). next/font/google fetched them from Google at dev time, and when that
 * fetch failed it fell back without a word: Newsreader became Times New Roman and the
 * mono became Arial at 135%, and screens were judged in the wrong type for a day. A
 * local file cannot fail that way. The third voice, IBM Plex Mono, went at the same
 * time: machine strings (a source URI, a record id) are set in the sans, as meta.
 */
const sans = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    { path: "../../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2", weight: "400 700", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-italic.woff2", weight: "400 700", style: "italic" },
  ],
});
const newsreader = localFont({
  variable: "--font-serif",
  display: "swap",
  /* "standard" carries both axes, weight and optical size. */
  src: [
    { path: "../../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-standard-normal.woff2", weight: "200 800", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-standard-italic.woff2", weight: "200 800", style: "italic" },
  ],
});

export const metadata: Metadata = {
  title: "Enable",
  description: "The working environment for a lifestyle advisory practice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${newsreader.variable} antialiased`}>
        <DemoProvider>
          <Shell>{children}</Shell>
        </DemoProvider>
      </body>
    </html>
  );
}
