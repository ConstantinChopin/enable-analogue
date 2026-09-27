const fs = require("fs"), path = require("path");
const { createRequire } = require("node:module");
const { chromium } = createRequire(path.join(__dirname, "../../package.json"))("playwright");
const F = ["geist","ibm-plex-sans","instrument-sans","dm-sans","manrope","figtree","public-sans","hanken-grotesk","schibsted-grotesk","albert-sans"];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2000, height: 560 } });
  const img = (f) => `data:image/png;base64,${fs.readFileSync(path.join(__dirname, "out-fonts", f + ".png")).toString("base64")}`;
  await p.setContent(`<body style="margin:0;background:#fff;display:flex;flex-wrap:wrap;gap:0">${F.map((f) => `<img src="${img(f)}" style="width:400px;height:265px;object-fit:cover">`).join("")}</body>`);
  await p.screenshot({ path: path.join(__dirname, "out-fonts", "contact-sheet.png"), fullPage: true });
  // Detail crops: the commissions block, where the sans does most work
  for (const f of F) {}
  await b.close();
})();
