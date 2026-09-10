import type { Metadata } from "next";
import { Inter, Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { DemoProvider } from "@/lib/store";
import { Shell } from "@/components/shell";

/**
 * Two voices. Inter is the machine — chosen over the alternatives because it carries an
 * optical-size axis (opsz 14–32), the structural behaviour that makes SF work across sizes,
 * and the tallest x-height-to-cap in the candidate set (0.750), matching SF's screen-first
 * proportion. Newsreader is the person — opsz 6–72 and a much smaller eye (0.636), so prose
 * reads as a different register rather than a decorated version of the same one.
 * Both are self-hosted at build time: the demo runs on Windows, where no system stack
 * resolves to anything Apple-like.
 */
const inter = Inter({ variable: "--font-sans", subsets: ["latin"], axes: ["opsz"] });
const newsreader = Newsreader({ variable: "--font-serif", subsets: ["latin"], axes: ["opsz"], style: ["normal", "italic"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono-stack", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Enable",
  description: "The working environment for a lifestyle advisory practice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${newsreader.variable} ${mono.variable} antialiased`}>
        <DemoProvider>
          <Shell>{children}</Shell>
        </DemoProvider>
      </body>
    </html>
  );
}
