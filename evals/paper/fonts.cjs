/* Ten sans-serif variants of one screen: re-serialize it with each family set in the live
   prototype (studio treatment on), then render each as a studio figure to check it.
     node evals/paper/fonts.cjs [screen]      default 03-briefing */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const { createRequire } = require("node:module");
const r = createRequire(path.join(__dirname, "../../package.json"));
const { chromium } = r("playwright");
const SCREEN = process.argv[2] || "03-briefing";
const FONTS = ["Geist", "IBM Plex Sans", "Instrument Sans", "DM Sans", "Manrope", "Figtree", "Public Sans", "Hanken Grotesk", "Schibsted Grotesk", "Albert Sans"];
const OUT = path.join(__dirname, "out-fonts");
const slug = (f) => f.toLowerCase().replace(/ /g, "-");
const FIG = fs.readFileSync(path.join(__dirname, "out-studio/figure.html"), "utf8");
const LINE = fs.readFileSync(path.join(__dirname, "out-studio/hairline.html"), "utf8");
(async () => {
  for (const f of FONTS) {
    const dir = path.join(OUT, slug(f));
    const log = execFileSync("node", [path.join(__dirname, "serialize.mjs"), dir, SCREEN], { env: { ...process.env, STUDIO: "1", SANS: f }, encoding: "utf8" });
    process.stdout.write(`${f}: ${log.trim()}\n`);
    const j = JSON.parse(fs.readFileSync(path.join(dir, SCREEN + ".json"), "utf8"));
    const body = j.chunks.map((c) => c.html).join("") + LINE;
    const html = FIG.replace('layer-name="Figure"', `layer-name="${f} — studio figure"`).replace("></div>", ">" + body + "</div>");
    fs.writeFileSync(path.join(OUT, `${slug(f)}.paper.html`), html.replace(/<\/div><div /g, "</div>\n<div "));
  }
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 1060 } });
  for (const f of FONTS) {
    const html = fs.readFileSync(path.join(OUT, `${slug(f)}.paper.html`), "utf8");
    const fam = (x) => x.replace(/ /g, "+");
    await p.setContent(`<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${fam(f)}:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400..600&family=Newsreader:opsz,wght@6..72,400..600&family=IBM+Plex+Mono:wght@400;500&display=block"><style>*{box-sizing:border-box;margin:0}body{background:#fff}</style></head><body><div style="position:relative;width:1600px;height:1060px;background:#fff">${html}<div style="position:absolute;left:80px;top:1000px;font:500 13px '${f}';color:rgba(17,15,15,.55);letter-spacing:.02em">${f}</div></div></body></html>`, { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, `${slug(f)}.png`) });
  }
  await b.close();
})();
