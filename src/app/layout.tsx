import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { DemoProvider } from "@/lib/store";
import { Shell } from "@/components/shell";
import { Toaster } from "@/components/ui/sonner";

/**
 * Two faces, and only two. Instrument Sans sets everything (VIS-090) — chosen on
 * 2026-09-24 from ten sans-serifs set live on the Briefing (evals/paper/out-fonts), and
 * kept on 2026-09-28 when it took over prose as well. Source Serif 4 sets the page title
 * and the lead, nothing else (VIS-092): it replaced Newsreader, which read as the serif
 * every generated interface reaches for. Its optical axis (8–60) does the work a heavier
 * weight used to: the 28 title turns fine and open on its own, the 18 lead stays sturdy.
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
const sourceSerif = localFont({
  variable: "--font-serif",
  display: "swap",
  /* "standard" carries both axes, weight and optical size. */
  src: [
    { path: "../../node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-standard-normal.woff2", weight: "200 900", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-standard-italic.woff2", weight: "200 900", style: "italic" },
  ],
});

export const metadata: Metadata = {
  title: "Enable",
  description: "The working environment for a lifestyle advisory practice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${sourceSerif.variable} antialiased`}>
        <DemoProvider>
          <Shell>{children}</Shell>
        </DemoProvider>
        <Toaster />

      </body>
    </html>
  );
}
