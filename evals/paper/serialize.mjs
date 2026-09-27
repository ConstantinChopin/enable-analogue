/* Serialize the Enable case-study screens into Paper-ready HTML (inline styles,
   flex kept as auto layout, everything else absolutely positioned). */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const require = createRequire("C:/Users/kosti/Desktop/constantin.studio/Explorations/enable-analogue/package.json");
const { chromium } = require("playwright");

const BASE = "http://localhost:3100";
const OUT = process.argv[2];
const ONLY = new Set(process.argv.slice(3));
const PUBLIC = "C:/Users/kosti/Desktop/constantin.studio/Explorations/enable-analogue/public";

const scrollTo = (locate, offset = 24) => async (page) => {
  const el = await locate(page);
  await el.evaluate((node, off) => {
    let sc = node.parentElement;
    while (sc && !(sc.scrollHeight > sc.clientHeight && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
    if (!sc) return;
    const top = node.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop;
    sc.scrollTop = Math.max(0, top - off);
  }, offset);
};
const heading = (name) => (page) => page.getByRole("heading", { name }).first();

const SCREENS = [
  { file: "02-ask", title: "Ask — the spa question", role: "user", path: "/ask",
    prepare: async (page) => { await page.getByText("Is the spa at Maison Léandre open?", { exact: true }).first().click(); } },
  { file: "03-briefing", title: "Briefing", role: "user", path: "/briefing" },
  { file: "05-record", title: "Record — agency overlay", role: "user", path: "/records/maison-leandre", prepare: scrollTo(heading("Agency overlay")) },
  { file: "15-traveller", title: "Traveller — preferences", role: "user", path: "/travellers/s-marchetti", prepare: scrollTo(heading(/^Preferences/), 24) },
  { file: "16-itinerary", title: "Itinerary — day board", role: "user", path: "/itineraries", prepare: scrollTo((page) => page.locator("#opened-trip"), 24) },
  { file: "18-knowledge", title: "Knowledge vault (owner)", role: "owner", path: "/knowledge" },
];

/* Runs in the page. */
function serialize({ PUBLIC, BASE, STUDIO, SANS }) {
  /* STUDIO: constantin.studio's surface, border and effect language (constantin.studio.site
     src/styles.css). Floating and framing surfaces become glass (tint, 18px blur, glass edge,
     glass shadow); neutral fills become paper or the translucent --surface; neutral borders
     become the --rule hairline. Dark fills are primary actions and keep their accent; tinted
     status fills (warning, overdue) keep their meaning. Radii are Enable's own. */
  const GLASS_TINT = "rgba(255, 255, 255, 0.79)";
  const GLASS_FILTER = "blur(18px) saturate(1.8) brightness(1.04)";
  const GLASS_EDGE = "inset 0 1px 1px rgba(255, 255, 255, 0.9), inset 0 -1px 1px rgba(255, 255, 255, 0.35), inset 0 0 0 0.5px rgba(255, 255, 255, 0.35), 0 0 0 0.5px rgba(17, 15, 15, 0.1)";
  const GLASS_SHADOW = "0 2px 8px rgba(24, 18, 12, 0.06), 0 10px 28px rgba(24, 18, 12, 0.07)";
  const RULE = "rgba(17, 15, 15, 0.12)", FAINT = "rgba(17, 15, 15, 0.38)", SURFACE = "rgba(17, 19, 22, 0.06)";
  const rgba = (c) => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const over = (v) => { const [r, g, b, a] = v; return [r, g, b].map((x) => a * x + (1 - a) * 255); };
  const lum = (v) => { const [r, g, b] = over(v); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
  /* Enable's greys are warm but evenly stepped (r−g ≈ g−b); a status tint is not. */
  const neutral = (v) => { const [r, g, b] = over(v); const range = Math.max(r, g, b) - Math.min(r, g, b); return range <= 10 || (range <= 18 && Math.abs((r - g) - (g - b)) <= 3); };
  function studioize(s, r) {
    const at = (k) => s.findIndex((x) => x.startsWith(k + ":"));
    const bi = at("background-color");
    const bg = bi >= 0 ? rgba(s[bi].slice(17)) : null;
    if (bg && bg[3] > 0.5 && lum(bg) < 0.35) return;               /* primary action: keep the dark accent */
    const shadow = at("box-shadow") >= 0;
    const borders = s.map((x, i) => (/^border(-(top|right|bottom|left))?:/.test(x) ? i : -1)).filter((i) => i >= 0);
    const light = bg && neutral(bg) && lum(bg) > 0.8;
    if (light && (shadow || (borders.length && r.width >= 1000))) {
      /* A floating or framing surface: glass. */
      s[bi] = `background-color:${GLASS_TINT}`;
      /* Keep the border width so children stay put; glass draws its own edge. */
      for (const i of borders) s[i] = s[i].replace(/^(border(?:-\w+)?:[\d.]+px \w+) .+$/, "$1 transparent");
      const si = at("box-shadow"); const v = `box-shadow:${GLASS_EDGE}, ${GLASS_SHADOW}`;
      if (si >= 0) s[si] = v; else s.push(v);
      /* No backdrop-filter: Paper draws it as an unclipped rectangle that bleeds past the element. */
      return;
    }
    if (bg && neutral(bg) && lum(bg) > 0.8) s[bi] = `background-color:${lum(bg) >= 0.975 ? "#ffffff" : SURFACE}`;
    for (const i of borders) {
      const m = s[i].match(/^(border(?:-\w+)?):([\d.]+px) (\w+) (.+)$/); if (!m) continue;
      const c = rgba(m[4]); if (!c || !neutral(c)) continue;
      if (bg && !neutral(bg)) continue;                              /* status chip: border belongs to its tint */
      s[i] = `${m[1]}:${m[2]} ${m[3]} ${lum(c) > 0.7 ? RULE : FAINT}`;
    }
  }

  const VW = innerWidth, VH = innerHeight;
  const R = (n) => Math.round(n);
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inter = (a, b) => ({ l: Math.max(a.l, b.l), t: Math.max(a.t, b.t), r: Math.min(a.r, b.r), b: Math.min(a.b, b.b) });
  const empty = (c) => c.r - c.l < 1 || c.b - c.t < 1;
  const box = (r) => ({ l: r.left, t: r.top, r: r.right, b: r.bottom });
  const hits = (r, c) => r.right > c.l && r.left < c.r && r.bottom > c.t && r.top < c.b;

  const fam = (f) => /newsreader/i.test(f) ? "Newsreader" : /plex_?\s?mono|mono/i.test(f) ? "IBM Plex Mono" : SANS || "Inter";
  const color = (c) => c.replace(/\s+/g, " ");
  const clear = (c) => !c || c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c) || /\/\s*0\)$/.test(c);
  const asset = (u) => {
    try {
      const url = new URL(u, BASE);
      if (url.pathname.startsWith("/_next/image")) return asset(url.searchParams.get("url"));
      if (url.origin === new URL(BASE).origin) return "paper-asset:///" + PUBLIC + decodeURIComponent(url.pathname);
      return url.href;
    } catch { return u; }
  };

  function boxStyle(cs, s) {
    if (!clear(cs.backgroundColor)) s.push(`background-color:${color(cs.backgroundColor)}`);
    if (cs.backgroundImage && cs.backgroundImage !== "none") {
      const bi = cs.backgroundImage.replace(/url\("?([^")]+)"?\)/g, (_, u) => `url("${asset(u)}")`);
      s.push(`background-image:${bi}`);
      if (/url\(/.test(bi)) s.push(`background-size:${cs.backgroundSize}`, `background-position:${cs.backgroundPosition}`);
    }
    const sides = ["top", "right", "bottom", "left"];
    const bw = sides.map((d) => parseFloat(cs[`border-${d}-width`]) || 0);
    const bs = sides.map((d) => cs[`border-${d}-style`]);
    const bc = sides.map((d) => cs[`border-${d}-color`]);
    const on = sides.map((_, i) => bw[i] > 0 && bs[i] !== "none" && bs[i] !== "hidden" && !clear(bc[i]));
    if (on.every(Boolean) && new Set(bw).size === 1 && new Set(bc).size === 1 && new Set(bs).size === 1) s.push(`border:${bw[0]}px ${bs[0]} ${color(bc[0])}`);
    else sides.forEach((d, i) => { if (on[i]) s.push(`border-${d}:${bw[i]}px ${bs[i]} ${color(bc[i])}`); });
    const rad = ["top-left", "top-right", "bottom-right", "bottom-left"].map((c) => cs[`border-${c}-radius`]);
    rad.forEach((v, i) => { if (parseFloat(v) > 9999) rad[i] = "9999px"; });
    if (rad.some((r) => parseFloat(r) > 0)) s.push(new Set(rad).size === 1 ? `border-radius:${rad[0]}` : `border-radius:${rad.join(" ")}`);
    if (cs.boxShadow && cs.boxShadow !== "none") {
      const layers = cs.boxShadow.split(/,(?![^(]*\))/).map((x) => x.trim()).filter((x) => !/rgba\([^)]*,\s*0\)/.test(x));
      if (layers.length) s.push(`box-shadow:${layers.join(", ")}`);
    }
    if (parseFloat(cs.opacity) < 1) s.push(`opacity:${cs.opacity}`);
    return on.map((o, i) => (o ? bw[i] : 0));
  }
  function textStyle(cs, s) {
    s.push(`font-family:${fam(cs.fontFamily)}`, `font-size:${cs.fontSize}`, `font-weight:${cs.fontWeight}`, `color:${color(cs.color)}`);
    const lh = cs.lineHeight === "normal" ? R(parseFloat(cs.fontSize) * 1.2) + "px" : cs.lineHeight;
    s.push(`line-height:${lh}`);
    if (cs.letterSpacing !== "normal" && parseFloat(cs.letterSpacing) !== 0) s.push(`letter-spacing:${(parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize)).toFixed(3)}em`);
    if (cs.textTransform !== "none") s.push(`text-transform:${cs.textTransform}`);
    if (cs.fontStyle === "italic") s.push("font-style:italic");
    if (cs.textAlign === "center" || cs.textAlign === "right" || cs.textAlign === "end") s.push(`text-align:${cs.textAlign === "end" ? "right" : cs.textAlign}`);
    if (cs.textDecorationLine && cs.textDecorationLine !== "none" && !clear(cs.textDecorationColor)) {
      s.push(`text-decoration:${cs.textDecorationLine}`, `text-decoration-color:${color(cs.textDecorationColor)}`);
      if (cs.textUnderlineOffset && cs.textUnderlineOffset !== "auto") s.push(`text-underline-offset:${cs.textUnderlineOffset}`);
      if (cs.textDecorationThickness && !/auto|from-font/.test(cs.textDecorationThickness)) s.push(`text-decoration-thickness:${cs.textDecorationThickness}`);
    }
    if (cs.fontVariantNumeric && cs.fontVariantNumeric !== "normal") s.push(`font-variant-numeric:${cs.fontVariantNumeric}`);
  }
  const norm = (v, d) => (!v || /^(normal|auto|legacy)$/.test(v) ? d : v.replace(/^(safe |unsafe )/, "").replace(/^(start|self-start|left)$/, "flex-start").replace(/^(end|self-end|right)$/, "flex-end"));
  const visible = (el, cs) => cs.display !== "none" && cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.01;
  const isTextLeaf = (el) => [...el.childNodes].every((n) => n.nodeType === 3 || n.nodeName === "BR") && el.textContent.trim();
  /* The text exactly as the browser broke it into lines, so Paper's slightly different
     font metrics cannot re-wrap a paragraph. */
  const lines = (el) => {
    const out = [""]; let top = null;
    const tw = el.nodeType === 3 ? { n: el, nextNode() { const x = this.n; this.n = null; return x; } } : document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const rg = document.createRange();
    for (let t = tw.nextNode(); t; t = tw.nextNode()) {
      const pcs = getComputedStyle(t.parentElement);
      if (pcs.display === "none" || pcs.visibility === "hidden") continue;
      const lh = parseFloat(pcs.lineHeight) || parseFloat(pcs.fontSize) * 1.2;
      const s = t.textContent;
      for (let i = 0; i < s.length; i++) {
        if (/\s/.test(s[i])) { if (!/ $/.test(out[out.length - 1]) && out[out.length - 1]) out[out.length - 1] += " "; continue; }
        rg.setStart(t, i); rg.setEnd(t, i + 1);
        const rr = rg.getClientRects()[0]; if (!rr) continue;
        if (top !== null && rr.top > top + lh / 2) { out[out.length - 1] = out[out.length - 1].trimEnd(); out.push(""); }
        if (top === null || rr.top > top + lh / 2) top = rr.top;
        out[out.length - 1] += s[i];
      }
    }
    return out.map((l) => l.trim()).filter(Boolean);
  };
  const singleLine = (el) => lines(el).length <= 1;
  /* A run of inline content: an element whose rendered descendants are all inline and text. */
  const inlineOnly = (el) => [...el.querySelectorAll("*")].every((d) => { const c = getComputedStyle(d); return c.display === "inline" || c.display === "none" || d.nodeName === "BR"; });

  const name = (el) => {
    const t = el.getAttribute("aria-label") || el.getAttribute("data-slot") || (el.id ? el.id : "") || "";
    const tag = el.nodeName.toLowerCase();
    const n = t || ({ header: "Header", nav: "Nav", main: "Main", aside: "Aside", section: "Section", footer: "Footer", h1: "H1", h2: "H2", h3: "H3", button: "Button", a: "Link", ul: "List", li: "Item", article: "Article", form: "Form", input: "Input", textarea: "Textarea" })[tag] || "";
    return n ? ` layer-name="${esc(n).replace(/"/g, "'").slice(0, 40)}"` : "";
  };

  let count = 0;
  /* pos: {mode:"abs", pr} or {mode:"flow"} */
  function node(el, pos, clip) {
    if (el.nodeType !== 1) return "";
    const tag = el.nodeName;
    if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|NEXTJS-PORTAL|LINK|META)$/.test(tag)) return "";
    const cs = getComputedStyle(el);
    if (!visible(el, cs)) return "";
    const r = el.getBoundingClientRect();
    if (pos.mode === "flow" && (r.width < 0.5 || r.height < 0.5) && !el.textContent.trim()) return `<div style="position:relative;flex-shrink:0;width:${R(r.width)}px;height:${R(r.height)}px" layer-name="spacer"></div>`;
    if ((r.width <= 1 || r.height <= 1) && cs.overflow !== "visible") return "";
    if (r.width < 0.5 || r.height < 0.5) {
      if (cs.overflow !== "visible" || !el.children.length) return "";
    }
    if (!hits(r, clip) && pos.mode === "abs") return "";
    count++;
    const s = [];
    if (pos.mode === "abs") s.push("position:absolute", `left:${R(r.left - pos.pr.left)}px`, `top:${R(r.top - pos.pr.top)}px`);
    else { s.push("position:relative", "flex-shrink:0"); if (cs.alignSelf !== "auto" && cs.alignSelf !== "normal") s.push(`align-self:${norm(cs.alignSelf)}`); }
    s.push(`width:${R(r.width)}px`, `height:${R(r.height)}px`);

    if (tag === "svg") {
      const c = el.cloneNode(true);
      c.setAttribute("width", R(r.width)); c.setAttribute("height", R(r.height));
      c.removeAttribute("class");
      const fix = (n, ncs) => {
        for (const a of ["fill", "stroke"]) {
          const v = n.getAttribute(a);
          if (v === "currentColor" || (!v && a === "stroke" && ncs.stroke !== "none")) n.setAttribute(a, ncs[a] === "none" ? "none" : ncs[a] || ncs.color);
          else if (!v && a === "fill" && n !== c) n.setAttribute("fill", ncs.fill);
        }
        if (ncs.strokeWidth && n.nodeName !== "svg" && !n.getAttribute("stroke-width")) n.setAttribute("stroke-width", ncs.strokeWidth);
      };
      const src = [el, ...el.querySelectorAll("*")], dst = [c, ...c.querySelectorAll("*")];
      src.forEach((n, i) => { dst[i].removeAttribute("class"); fix(dst[i], getComputedStyle(n)); });
      c.setAttribute("style", s.join(";") + `;color:${cs.color}`);
      return c.outerHTML.replace(/\s(aria-hidden|data-[\w-]+|focusable)="[^"]*"/g, "").replace(/currentColor/g, cs.color);
    }
    if (tag === "IMG") {
      const fit = cs.objectFit !== "fill" ? `;object-fit:${cs.objectFit}` : "";
      const rad = parseFloat(cs.borderRadius) ? `;border-radius:${cs.borderRadius}` : "";
      return `<img src="${esc(asset(el.currentSrc || el.src))}" style="${s.join(";")}${fit}${rad}"${name(el)}>`;
    }

    const bw = boxStyle(cs, s);
    if (STUDIO) studioize(s, r);
    const clips = cs.overflow !== "visible" || cs.overflowX !== "visible" || cs.overflowY !== "visible";
    if (clips) { s.push("overflow:hidden"); clip = inter(clip, box(r)); }

    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
      const val = tag === "SELECT" ? el.selectedOptions[0]?.text || "" : el.value || el.placeholder || "";
      if (el.type === "checkbox" || el.type === "radio" || el.type === "range") return `<div style="${s.join(";")}"${name(el)}></div>`;
      const ts = []; textStyle(cs, ts);
      if (!el.value) { const pc = getComputedStyle(el, "::placeholder").color; ts[3] = `color:${color(pc)}`; }
      s.push("display:flex", `align-items:${tag === "TEXTAREA" ? "flex-start" : "center"}`, `padding:${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`);
      return `<div style="${s.join(";")}"${name(el)}><div style="${ts.join(";")};white-space:nowrap">${esc(val)}</div></div>`;
    }

    /* Plain text leaf, or a paragraph of inline runs that we flatten (Paper has no rich text). */
    const leaf = isTextLeaf(el);
    const flatten = !leaf && el.textContent.trim() && inlineOnly(el) && ![...el.querySelectorAll("*")].some((d) => d.nodeName === "svg" || d.nodeName === "IMG");
    if (leaf || flatten) {
      if (flatten) {
        /* Keep inline runs apart when they sit on one line and differ in look. */
        const kids = [...el.childNodes].filter((n) => (n.nodeType === 3 && n.textContent.trim()) || n.nodeType === 1);
        const rich = kids.some((n) => n.nodeType === 1 && getComputedStyle(n).display !== "none" && (getComputedStyle(n).color !== cs.color || getComputedStyle(n).fontWeight !== cs.fontWeight || getComputedStyle(n).fontFamily !== cs.fontFamily || getComputedStyle(n).backgroundColor !== cs.backgroundColor && !clear(getComputedStyle(n).backgroundColor)));
        if (rich && singleLine(el)) {
          s.push(`padding:${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`);
          const jc = cs.textAlign === "center" ? "center" : cs.textAlign === "right" || cs.textAlign === "end" ? "flex-end" : "flex-start";
          s.push("display:flex", "flex-direction:row", "align-items:baseline", `justify-content:${jc}`);
          return `<div style="${s.join(";")}"${name(el)}>${pieces(el)}</div>`;
        }
      }
      let ls = lines(el);
      let truncated = el.scrollWidth > el.clientWidth + 1;
      /* Line-clamped text: keep only the lines the box shows, and end on an ellipsis. */
      if (cs.overflow !== "visible" || parseInt(cs.webkitLineClamp) > 0) {
        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
        const room = Math.max(1, Math.floor((el.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0)) / lh + 0.05));
        if (ls.length > room) { ls = ls.slice(0, room); ls[room - 1] = ls[room - 1].replace(/\s*\S*$/, "") + "…"; truncated = false; }
      }
      /* Paper has no text-overflow: cut a single overflowing line to what fits, measured
         with the element's own font, and end it on an ellipsis. */
      if (truncated && ls.length === 1) {
        const ctx = (serialize.canvas ||= document.createElement("canvas")).getContext("2d");
        ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const room = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
        let t = ls[0];
        while (t.length > 1 && ctx.measureText(t.trimEnd() + "…").width > room) t = t.slice(0, -1);
        ls = [t.trimEnd() + "…"]; truncated = false;
      }
      const one = ls.length <= 1;
      const centred = /center|right|end/.test(cs.textAlign) || /center|end|right/.test(cs.justifyContent);
      const boxed = s.some((x) => /^(background|border|box-shadow)/.test(x));
      /* Single-line, start-aligned text hugs its content: Paper's metrics differ by a pixel or
         two, and a fixed width would wrap or clip it. */
      if (one && !truncated && !centred && !(pos.mode === "flow" && parseFloat(cs.flexGrow) > 0) && (!boxed || /inline/.test(cs.display) || parseFloat(cs.paddingLeft) > 0)) {
        const wi = s.findIndex((x) => x.startsWith("width:")); s.splice(wi, 1);
        const oi = s.indexOf("overflow:hidden"); if (oi >= 0) s.splice(oi, 1);
      } else if (!truncated) { const oi = s.indexOf("overflow:hidden"); if (oi >= 0) s.splice(oi, 1); }
      textStyle(cs, s);
      s.push("white-space:pre");
      if (truncated && cs.textOverflow === "ellipsis") s.push("text-overflow:ellipsis");
      const pad = ["Top", "Right", "Bottom", "Left"].map((d) => cs[`padding${d}`]);
      if (pad.some((p) => parseFloat(p))) s.push(`padding:${pad.join(" ")}`);
      if (/flex|grid/.test(cs.display)) {
        const grid = /grid/.test(cs.display);
        const ai = grid ? cs.alignItems : cs.alignItems;
        const jc = grid ? cs.justifyItems : cs.justifyContent;
        const fix = (v, d) => (!v || /normal|stretch|legacy|auto/.test(v) ? d : v.replace(/^(start|self-start)$/, "flex-start").replace(/^(end|self-end)$/, "flex-end"));
        s.push("display:flex", `align-items:${fix(ai, grid ? "flex-start" : "stretch")}`, `justify-content:${fix(jc, "flex-start")}`);
      }
      return `<div style="${s.join(";")}"${name(el)}>${esc(ls.join("\n"))}</div>`;
    }

    /* Children: decide flow (flex) or absolute. */
    const kids = [...el.childNodes].filter((n) => (n.nodeType === 3 && n.textContent.trim()) || n.nodeType === 1);
    const isFlex = /flex/.test(cs.display);
    const scrolled = el.scrollTop > 0 || el.scrollLeft > 0;
    let flow = isFlex && !scrolled && !/reverse/.test(cs.flexDirection);
    const rendered = [];
    for (const k of kids) {
      if (k.nodeType === 3) { rendered.push(k); continue; }
      const kcs = getComputedStyle(k);
      if (!visible(k, kcs)) continue;
      if (kcs.display === "contents") { flow = false; rendered.push(k); continue; }
      const kr = k.getBoundingClientRect();
      const mainM = cs.flexDirection.startsWith("row") ? ["Left", "Right"] : ["Top", "Bottom"];
      const crossM = cs.flexDirection.startsWith("row") ? ["Top", "Bottom"] : ["Left", "Right"];
      const hasMain = mainM.some((d) => (parseFloat(kcs[`margin${d}`]) || 0) > 0.5);
      if (kr.width < 0.5 && kr.height < 0.5 && !k.children.length && !hasMain) continue;
      if (kcs.position === "absolute" || kcs.position === "fixed") flow = false;
      if (crossM.some((d) => Math.abs(parseFloat(kcs[`margin${d}`]) || 0) > 0.5) || mainM.some((d) => (parseFloat(kcs[`margin${d}`]) || 0) < -0.5)) flow = false;
      if (!hits(kr, clip)) flow = false;
      if (kcs.order !== "0") flow = false;
      rendered.push(k);
    }
    let inner = "";
    if (flow) {
      s.push("display:flex", `flex-direction:${cs.flexDirection}`);
      if (cs.flexWrap === "wrap") {
        const els = rendered.filter((k) => k.nodeType === 1).map((k) => k.getBoundingClientRect());
        const row = cs.flexDirection.startsWith("row");
        const wrapped = els.some((b) => row ? b.top >= els[0].bottom - 1 : b.left >= els[0].right - 1);
        if (wrapped) s.push("flex-wrap:wrap");
      }
      if (norm(cs.justifyContent, "flex-start") !== "flex-start") s.push(`justify-content:${norm(cs.justifyContent)}`);
      s.push(`align-items:${norm(cs.alignItems, "stretch")}`);
      const rg = parseFloat(cs.rowGap) || 0, cg = parseFloat(cs.columnGap) || 0;
      const g = cs.flexDirection.startsWith("row") ? cg : rg;
      if (g) s.push(`gap:${g}px`);
      const pad = ["Top", "Right", "Bottom", "Left"].map((d) => cs[`padding${d}`]);
      if (pad.some((p) => parseFloat(p))) s.push(`padding:${pad.join(" ")}`);
      for (const k of rendered) {
        if (k.nodeType === 3) {
          const rg2 = document.createRange(); rg2.selectNodeContents(k); const tr = rg2.getBoundingClientRect();
          const ls = lines(k);
          const ts = ["position:relative", "flex-shrink:0", `height:${R(tr.height)}px`, "white-space:pre"]; if (ls.length > 1) ts.push(`width:${Math.ceil(tr.width) + 1}px`); textStyle(cs, ts);
          inner += `<div style="${ts.join(";")}">${esc(ls.join("\n"))}</div>`;
        } else {
          const kcs = getComputedStyle(k), rw = cs.flexDirection.startsWith("row");
          const sp = (v) => (v > 0.5 ? `<div style="position:relative;flex-shrink:0;width:${rw ? R(v) : 0}px;height:${rw ? 0 : R(v)}px" layer-name="spacer"></div>` : "");
          const gap = rw ? (parseFloat(cs.columnGap) || 0) : (parseFloat(cs.rowGap) || 0);
          const kr = k.getBoundingClientRect();
          const tiny = kr.width < 0.5 && kr.height < 0.5;
          /* A spacer frame is itself a flex item and adds one gap: a zero-size carrier already had its two gaps, so its spacer is the bare margin; beside a real item the spacer is the margin less one gap. */
          if (tiny) inner += sp((parseFloat(kcs[rw ? "marginLeft" : "marginTop"]) || 0) + (parseFloat(kcs[rw ? "marginRight" : "marginBottom"]) || 0));
          else inner += sp((parseFloat(kcs[rw ? "marginLeft" : "marginTop"]) || 0) - gap) + node(k, { mode: "flow" }, clip) + sp((parseFloat(kcs[rw ? "marginRight" : "marginBottom"]) || 0) - gap);
        }
      }
    } else {
      /* The box's absolute children are measured from its padding edge (border-box minus border). */
      const pr = { left: r.left + bw[3], top: r.top + bw[0] };
      const walk = (list) => { for (const k of list) {
        if (k.nodeType === 3) inner += textRun(k, cs, pr, clip);
        else if (getComputedStyle(k).display === "contents") walk([...k.childNodes].filter((n) => (n.nodeType === 3 && n.textContent.trim()) || n.nodeType === 1));
        else inner += node(k, { mode: "abs", pr }, clip);
      } };
      const layer = (k) => { if (k.nodeType !== 1) return 0; const c = getComputedStyle(k); if (c.position === "static") return 0; const z = parseInt(c.zIndex); return 1 + (isNaN(z) ? 0 : z) / 1e6; };
      walk(rendered.map((k, i) => [k, i]).sort((a, b) => layer(a[0]) - layer(b[0]) || a[1] - b[1]).map((x) => x[0]));
    }
    return `<div style="${s.join(";")}"${name(el)}>${inner}</div>`;
  }

  function textRun(t, cs, pr, clip) {
    const rg = document.createRange(); rg.selectNodeContents(t);
    const tr = rg.getBoundingClientRect();
    if (!hits(tr, clip)) return "";
    const s = ["position:absolute", `left:${R(tr.left - pr.left)}px`, `top:${R(tr.top - pr.top)}px`, `width:${Math.ceil(tr.width) + 1}px`];
    textStyle(cs, s);
    const ls = lines(t);
    if (ls.length <= 1) s.splice(3, 1);
    s.push("white-space:pre");
    return `<div style="${s.join(";")}">${esc(ls.join("\n"))}</div>`;
  }

  /* One line of mixed inline runs, laid out as a row of text boxes. */
  function pieces(el) {
    let out = "";
    const pcs = getComputedStyle(el);
    const deco = pcs.textDecorationLine !== "none" && !clear(pcs.textDecorationColor) ? `text-decoration:${pcs.textDecorationLine}` : "";
    const inherit = (ts) => { if (deco && !ts.some((x) => x.startsWith("text-decoration"))) ts.push(deco); };
    for (const k of el.childNodes) {
      if (k.nodeType === 3) {
        const t = k.textContent.replace(/\s+/g, " ");
        if (!t.trim() && !t) continue;
        const ts = ["flex-shrink:0", "white-space:pre"]; textStyle(pcs, ts); inherit(ts);
        out += `<div style="${ts.join(";")}">${esc(t)}</div>`;
      } else if (k.nodeType === 1) {
        const kcs = getComputedStyle(k); if (kcs.display === "none") continue;
        const ts = ["flex-shrink:0", "white-space:pre"]; boxStyle(kcs, ts); if (STUDIO) studioize(ts, k.getBoundingClientRect()); textStyle(kcs, ts); inherit(ts);
        const pad = ["Top", "Right", "Bottom", "Left"].map((d) => kcs[`padding${d}`]);
        if (pad.some((p) => parseFloat(p))) ts.push(`padding:${pad.join(" ")}`);
        out += `<div style="${ts.join(";")}">${esc(k.textContent.replace(/\s+/g, " "))}</div>`;
      }
    }
    return out;
  }

  const body = document.body;
  const bcs = getComputedStyle(body);
  const vp = { l: 0, t: 0, r: VW, b: VH };
  /* Unwrap single-child shells so the artboard receives the real regions. */
  let root = body;
  const liveKids = (e) => [...e.children].filter((k) => { const c = getComputedStyle(k); return visible(k, c) && !/^(SCRIPT|STYLE|NEXTJS-PORTAL|NOSCRIPT)$/.test(k.nodeName) && k.getBoundingClientRect().width > 0; });
  const bg = [];
  while (liveKids(root).length === 1) {
    const c = getComputedStyle(root);
    if (!clear(c.backgroundColor)) bg.push(c.backgroundColor);
    const next = liveKids(root)[0];
    const nr = next.getBoundingClientRect();
    if (Math.abs(nr.width - VW) > 2 || nr.left !== 0 || nr.top !== 0) break;
    root = next;
  }
  const rcs = getComputedStyle(root);
  if (!clear(rcs.backgroundColor)) bg.push(rcs.backgroundColor);
  const chunks = liveKids(root).map((k) => ({ label: name(k).replace(/.*="|"$/g, "") || k.nodeName.toLowerCase(), html: node(k, { mode: "abs", pr: { left: 0, top: 0 } }, vp) })).filter((c) => c.html);
  return { background: STUDIO ? "#ffffff" : bg.pop() || "#ffffff", chunks, count };
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const shot of SCREENS) {
    if (ONLY.size && !ONLY.has(shot.file)) continue;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    await ctx.addInitScript((role) => { try { sessionStorage.setItem("enable-demo-state", JSON.stringify({ signedIn: true, role, world: "v2" })); } catch {} }, shot.role);
    const page = await ctx.newPage();
    await page.goto(BASE + shot.path, { waitUntil: "networkidle", timeout: 300_000 });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    /* SANS: re-set every sans-serif run in another family before capture, so wrapping and
       widths are that font's own, not Inter's. Serif and mono runs are left alone. */
    if (process.env.SANS) {
      const fam = process.env.SANS;
      await page.addStyleTag({ url: `https://fonts.googleapis.com/css2?family=${fam.replace(/ /g, "+")}:wght@400;500;600;700&display=block` }).catch(() => {});
      await page.evaluate((fam) => {
        for (const el of document.querySelectorAll("body, body *")) {
          const f = getComputedStyle(el).fontFamily;
          if (!/newsreader|mono/i.test(f)) el.style.setProperty("font-family", `"${fam}", sans-serif`, "important");
        }
      }, fam);
      await page.evaluate(async (fam) => { await document.fonts.load(`400 14px "${fam}"`); await document.fonts.load(`600 14px "${fam}"`); await document.fonts.ready; }, fam);
      /* fonts.check() is true even when nothing matched; compare widths against a fallback instead. */
      const ok = await page.evaluate((fam) => { const c = document.createElement("canvas").getContext("2d"); const w = (f) => { c.font = f; return c.measureText("Hamburgefonstiv 0123456789").width; }; return w(`14px "${fam}", monospace`) !== w("14px monospace"); }, fam);
      if (!ok) console.log("  ! font not loaded:", fam);
      await page.waitForTimeout(500);
    }
    await page.waitForTimeout(1200);
    if (shot.prepare) { await shot.prepare(page); await page.waitForTimeout(700); }
    await page.screenshot({ path: join(OUT, shot.file + ".png") });
    const res = await page.evaluate(serialize, { PUBLIC, BASE, STUDIO: !!process.env.STUDIO, SANS: process.env.SANS || "" });
    res.title = shot.title;
    writeFileSync(join(OUT, shot.file + ".json"), JSON.stringify(res));
    res.chunks.forEach((c, i) => writeFileSync(join(OUT, `${shot.file}.${i + 1}.html`), c.html));
    const size = res.chunks.reduce((a, c) => a + c.html.length, 0);
    console.log(`${shot.file}: ${res.count} nodes, ${res.chunks.length} chunks, ${(size / 1024).toFixed(0)} KB  [${res.chunks.map((c) => `${c.label}:${(c.html.length / 1024).toFixed(0)}k`).join(", ")}]`);
    await ctx.close();
  }
} finally { await browser.close(); }
