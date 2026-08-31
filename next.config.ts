import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* A production build writing into .next while a dev server is reading it produces
     misleading webpack errors. Set NEXT_DIST_DIR to build alongside a running dev server. */
  distDir: process.env.NEXT_DIST_DIR || ".next",

  /* The demo is deployed so it can be opened from a link rather than a terminal.
     It is a reconstruction of client work, so it should not be indexed: the URL is
     for people who have been given it, not for search. */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
        ],
      },
    ];
  },
};

export default nextConfig;
