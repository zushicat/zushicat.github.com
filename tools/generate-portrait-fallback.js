#!/usr/bin/env node
/* ============================================================
   generate-portrait-fallback.js — M3 tool (plan §5.2)
   Samples the portrait ONCE and emits all three derived artifacts
   (the tool is the single source of truth for the sampling):
     assets/portrait-grid.js        ← dot list, rendered by js/portrait.js
     assets/portrait-fallback.svg   ← noscript / no-canvas fallback
     tools/portrait-preview.png     ← inspectable raster of the same field
   Sampling: ffmpeg decodes assets/portrait.png to raw rgb24 at the
   supersampled grid; luminance → solid/screen/paper bands + dot radius;
   unsharp detail pass recovers thin features; 3 red terminals on the
   left rail (the G2 exceptions / G1 trace sources).

   Colors are token values from design/tokens.css v2.0.0 (an asset is
   allowed to carry them baked in; the page itself never hardcodes hexes).
   Requires: node, ffmpeg.
   Run: node tools/generate-portrait-fallback.js
============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawnSync } = require('child_process');

/* ---- SHARED PARAMS — keep verbatim in sync with js/portrait.js ---- */
const PARAMS = {
  GRID_W: 64,            // sample cells across
  SAMPLE_SUPER: 6,       // decode at GRID_W×this, box-average → noise-tolerant sampling
  // print model: solid ink below LUM_SOLID · halftone screen between · paper above LUM_SKIP
  LUM_SOLID: 0.40,       // L below → solid ink cell (radius ≈ cell, merges into shapes)
  LUM_SKIP: 0.80,        // L above → paper shows through
  R_SCREEN_LO: 0.18,     // screen radius floor (× cellR) — keeps the face present as texture
  R_MAX: 0.98,           // (× cellR)
  // detail stipple: unsharp-mask pass draws the features (glasses, brows, mouth)
  DETAIL_T: 0.09,        // |L - blur(L)| above → ink detail dot
  DETAIL_R0: 0.16,       // base detail radius (× cellR)
  DETAIL_K: 4.0,         // radius gain per unit detail
  DETAIL_CAP: 0.55,      // max detail radius (× cellR)
  TERMINAL_R: 0.42,      // red terminal radius (× cell radius)
  TERMINAL_COL: 0,       // leftmost column — the vertical terminal rail
  TERMINAL_ROWS: [0.25, 0.5, 0.75], // × grid height
  CELL_PX: 16,           // SVG/preview base cell size (px)
};
/* token values (design/tokens.css v2.0.0) */
const TOKEN = {
  paper: '#F2EDE2',
  ink: '#1F1D1A',
  registerStrong: '#4A463F',
  registerMid: '#8A8478',
  registerFaint: '#B5AFA2',
  accentRed: '#D93A2B',
};
const hex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'portrait.png');

/* ---- read source dimensions straight from the PNG IHDR ---- */
function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG: ' + file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

/* ---- decode to raw rgb24 at the supersampled grid via ffmpeg ---- */
function decodeGrid(file, gw, gh) {
  const res = spawnSync('ffmpeg', ['-loglevel', 'error', '-i', file, '-vf', `scale=${gw}:${gh}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 64 * 1024 * 1024 });
  if (res.error || res.status !== 0) throw new Error('ffmpeg failed: ' + (res.stderr || res.error));
  const px = new Uint8Array(res.stdout);
  if (px.length < gw * gh * 3) throw new Error(`short raw stream: ${px.length} < ${gw * gh * 3}`);
  return px;
}

/* ---- luminance + detail → dots ----
   Tone: 4×4 box-averaged luminance → solid/screen/paper bands.
   Detail: unsharp at FULL supersampled resolution, max-pooled per cell —
   recovers thin features (glasses, brows, mouth) that averaging dilutes. */
function sampleDots(raw, sw, sh, gw, gh) {
  const k = sw / gw; // supersample factor per cell
  const hi = new Float32Array(sw * sh);
  for (let i = 0; i < sw * sh; i++) {
    hi[i] = 0.2126 * raw[i * 3] / 255 + 0.7152 * raw[i * 3 + 1] / 255 + 0.0722 * raw[i * 3 + 2] / 255; // Rec.709
  }
  const hblur = new Float32Array(sw * sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      let acc = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const yy = Math.min(sh - 1, Math.max(0, y + dy)), xx = Math.min(sw - 1, Math.max(0, x + dx));
        acc += hi[yy * sw + xx]; n++;
      }
      hblur[y * sw + x] = acc / n;
    }
  }
  const dots = [];
  const counts = { solid: 0, screen: 0, detail: 0 };
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      /* tone: cell-average luminance */
      let acc = 0, n = 0, dmax = 0, dhits = 0;
      for (let sy = Math.floor(y * k); sy < Math.floor((y + 1) * k); sy++) {
        for (let sx = Math.floor(x * k); sx < Math.floor((x + 1) * k); sx++) {
          acc += hi[sy * sw + sx]; n++;
          const d = Math.abs(hi[sy * sw + sx] - hblur[sy * sw + sx]);
          if (d > dmax) dmax = d;
          if (d >= PARAMS.DETAIL_T) dhits++;
        }
      }
      const L = acc / n;
      const cellR = 0.5;                     // in cell units
      if (L < PARAMS.LUM_SKIP) {
        let band, rr;
        if (L < PARAMS.LUM_SOLID) {
          band = 'solid';                    // solid ink — merges into flat shapes
          rr = cellR * PARAMS.R_MAX;
          counts.solid++;
        } else {
          band = 'screen';                   // halftone screen, register-strong
          const t = (L - PARAMS.LUM_SOLID) / (PARAMS.LUM_SKIP - PARAMS.LUM_SOLID);
          rr = cellR * (PARAMS.R_MAX - t * (PARAMS.R_MAX - PARAMS.R_SCREEN_LO));
          counts.screen++;
        }
        dots.push({ x: x + 0.5, y: y + 0.5, r: rr, band }); // cell units
      }
      /* detail stipple — needs mass (≥2 sub-pixels firing) to beat noise */
      if (dmax >= PARAMS.DETAIL_T) {
        const rr = Math.min(PARAMS.DETAIL_CAP, PARAMS.DETAIL_R0 + PARAMS.DETAIL_K * (dmax - PARAMS.DETAIL_T)) * 0.5;
        counts.detail++;
        dots.push({ x: x + 0.5, y: y + 0.5, r: rr, band: 'detail' });
      }
    }
  }
  return { dots, counts };
}

/* ---- terminals: left rail, red, drawn over whatever is there ---- */
function terminals(gh) {
  return PARAMS.TERMINAL_ROWS.map((f) => ({
    x: PARAMS.TERMINAL_COL + 0.5,
    y: Math.round(f * (gh - 1)) + 0.5,
    r: PARAMS.TERMINAL_R,
  }));
}

/* ---- grid blob: the single source of truth for js/portrait.js ---- */
function emitGridJS(dots, terms, gw, gh, out) {
  const rd = (n) => Math.round(n * 1000) / 1000;
  const bandIdx = { screen: 0, solid: 1, detail: 2 };
  const payload = {
    gw: gw,
    gh: gh,
    aspect: rd(gw / gh),
    terminals: terms.map((t) => [rd(t.x), rd(t.y), rd(t.r)]),
    dots: dots.map((d) => [rd(d.x), rd(d.y), rd(d.r), bandIdx[d.band]]),
  };
  const js = `/* AUTO-GENERATED by tools/generate-portrait-fallback.js — do not edit by hand.\n` +
    `   Pre-sampled halftone dot field of Karin Hoehne's portrait (plan §5.2).\n` +
    `   js/portrait.js renders this as-is; assets/portrait-fallback.svg is the same field.\n` +
    `   Bands: 0 = screen (register-strong) · 1 = solid (ink) · 2 = detail (ink). */\n` +
    `window.PORTRAIT_DOTS = ${JSON.stringify(payload)};\n`;
  fs.writeFileSync(out, js);
  return Buffer.byteLength(js);
}

/* ---- SVG fallback ---- */
function emitSVG(dots, terms, gw, gh, out) {
  const s = PARAMS.CELL_PX;
  const byBand = { solid: [], screen: [], detail: [] };
  for (const d of dots) byBand[d.band].push(d);
  const fill = { solid: TOKEN.ink, screen: TOKEN.registerStrong, detail: TOKEN.ink };
  const f1 = (n) => (Math.round(n * 10) / 10).toString();
  let svg = `<!-- AUTO-GENERATED by tools/generate-portrait-fallback.js — do not edit by hand.\n`;
  svg += `     Halftone portrait of Karin Hoehne · "Paper Circuit" v2.0.0.\n`;
  svg += `     Colors are token values from design/tokens.css v2.0.0. -->\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gw * s} ${gh * s}" width="${gw * s}" height="${gh * s}" role="img" aria-label="Halftone portrait of Karin Hoehne">\n`;
  svg += `<rect width="${gw * s}" height="${gh * s}" fill="${TOKEN.paper}"/>\n`;
  for (const band of ['screen', 'solid', 'detail']) {
    svg += `<g fill="${fill[band]}">\n`;
    for (const d of byBand[band]) svg += `<circle cx="${f1(d.x * s)}" cy="${f1(d.y * s)}" r="${f1(d.r * s)}"/>`;
    svg += `</g>\n`;
  }
  svg += `<g>\n`;
  for (const t of terms) svg += `<circle cx="${f1(t.x * s)}" cy="${f1(t.y * s)}" r="${f1(t.r * s * 1.7)}" fill="${TOKEN.paper}"/>`;
  svg += `</g>\n`;
  svg += `<g fill="${TOKEN.accentRed}">\n`;
  for (const t of terms) svg += `<circle cx="${f1(t.x * s)}" cy="${f1(t.y * s)}" r="${f1(t.r * s)}"/>`;
  svg += `</g>\n</svg>\n`;
  fs.writeFileSync(out, svg);
  return Buffer.byteLength(svg);
}

/* ---- minimal PNG encoder (RGBA, filter 0) for the preview ---- */
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c; }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
function emitPreview(dots, terms, gw, gh, out) {
  const s = PARAMS.CELL_PX, W = gw * s, H = gh * s;
  const img = Buffer.alloc(W * H * 4);
  const [pr, pg, pb] = hex2rgb(TOKEN.paper);
  for (let i = 0; i < W * H; i++) { img[i * 4] = pr; img[i * 4 + 1] = pg; img[i * 4 + 2] = pb; img[i * 4 + 3] = 255; }
  const drawDot = (cx, cy, r, rgb) => {
    const x0 = Math.max(0, Math.floor(cx - r - 1)), x1 = Math.min(W - 1, Math.ceil(cx + r + 1));
    const y0 = Math.max(0, Math.floor(cy - r - 1)), y1 = Math.min(H - 1, Math.ceil(cy + r + 1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const a = Math.max(0, Math.min(1, r + 0.5 - d)); // 1px feather
      if (a <= 0) continue;
      const i = (y * W + x) * 4;
      img[i] = Math.round(rgb[0] * a + img[i] * (1 - a));
      img[i + 1] = Math.round(rgb[1] * a + img[i + 1] * (1 - a));
      img[i + 2] = Math.round(rgb[2] * a + img[i + 2] * (1 - a));
    }
  };
  const fill = { solid: hex2rgb(TOKEN.ink), screen: hex2rgb(TOKEN.registerStrong), detail: hex2rgb(TOKEN.ink) };
  for (const d of dots) drawDot(d.x * s, d.y * s, d.r * s, fill[d.band]);
  for (const t of terms) { drawDot(t.x * s, t.y * s, t.r * s * 1.7, hex2rgb(TOKEN.paper)); drawDot(t.x * s, t.y * s, t.r * s, hex2rgb(TOKEN.accentRed)); }
  fs.writeFileSync(out, encodePNG(W, H, img));
  return W * H * 4;
}

/* ---- main ---- */
const { w, h } = pngSize(SRC);
const gw = PARAMS.GRID_W;
const gh = Math.round(gw * h / w);
const sw = gw * PARAMS.SAMPLE_SUPER;
const sh = Math.round(gh * PARAMS.SAMPLE_SUPER);
const raw = decodeGrid(SRC, sw, sh);
const { dots, counts } = sampleDots(raw, sw, sh, gw, gh);
const terms = terminals(gh);

const svgBytes = emitSVG(dots, terms, gw, gh, path.join(ROOT, 'assets', 'portrait-fallback.svg'));
const gridBytes = emitGridJS(dots, terms, gw, gh, path.join(ROOT, 'assets', 'portrait-grid.js'));
const previewBytes = emitPreview(dots, terms, gw, gh, path.join(ROOT, 'tools', 'portrait-preview.png'));

console.log(`source ${w}x${h} → grid ${gw}x${gh} (cell ${PARAMS.CELL_PX}px)`);
console.log(`dots: solid ${counts.solid} · screen ${counts.screen} · detail ${counts.detail} · total ${dots.length}`);
console.log(`terminals (cell units): ${terms.map((t) => `(${t.x},${t.y})`).join(' ')}`);
console.log(`portrait-fallback.svg ${svgBytes} B · portrait-grid.js ${gridBytes} B · portrait-preview.png ${previewBytes} B`);
