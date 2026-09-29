/* Compose each studio screen as a studio figure (white page, 18px frame, hairline, warm shadow)
   and render it, to check the treatment before it goes into Paper. */
const fs = require("fs"), path = require("path");
const { createRequire } = require("node:module");
const r = createRequire("C:/Users/kosti/Desktop/constantin.studio/Explorations/enable-analogue/package.json");
const { chromium } = r("playwright");
const dir = "out-studio";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
const FIG = 'position:absolute;left:80px;top:80px;width:1440px;height:900px;border-radius:18px;overflow:hidden;background-color:#ffffff;box-shadow:0 26px 64px -32px rgba(43, 32, 24, 0.35)';
const LINE = 'position:absolute;left:0px;top:0px;width:1440px;height:900px;border-radius:18px;border:1px solid rgba(17, 15, 15, 0.1)';
fs.writeFileSync(path.join(dir, "figure.html"), `<div layer-name="Figure" style="${FIG}"></div>`);
fs.writeFileSync(path.join(dir, "hairline.html"), `<div layer-name="Hairline" style="${LINE}"></div>`);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 1060 } });
  for (const f of files) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const html = `<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300..800&family=Source+Serif+4:opsz,wght@8..60,400..600&family=Newsreader:opsz,wght@6..72,400..600&family=IBM+Plex+Mono:wght@400;500&display=swap"><style>*{box-sizing:border-box;margin:0}body{background:#fff}div{display:block}</style></head><body><div style="position:relative;width:1600px;height:1060px;background:#fff"><div style="${FIG}">${j.chunks.map((c) => c.html).join("")}<div style="${LINE}"></div></div></div></body></html>`;
    await p.setContent(html, { waitUntil: "networkidle" });
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(dir, f.replace(".json", ".studio.png")) });
    console.log("ok", f);
  }
  await b.close();
})();
