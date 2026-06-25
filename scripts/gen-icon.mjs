// Generates a 1024x1024 PNG app icon (purple rounded square + white "M")
// with no external deps, using Node's zlib for PNG compression.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const S = 1024;
const buf = Buffer.alloc(S * S * 4); // RGBA

const BG = [123, 63, 228]; // accent purple
const FG = [255, 255, 255];

function set(x, y, [r, g, b], a = 255) {
  if (x < 0 || y < 0 || x >= S || y >= S) return;
  const i = (y * S + x) * 4;
  // simple src-over alpha blend
  const ia = a / 255;
  buf[i] = buf[i] * (1 - ia) + r * ia;
  buf[i + 1] = buf[i + 1] * (1 - ia) + g * ia;
  buf[i + 2] = buf[i + 2] * (1 - ia) + b * ia;
  buf[i + 3] = Math.max(buf[i + 3], a);
}

// Rounded-square background
const radius = 200;
function inRoundedRect(x, y) {
  const r = radius;
  const minx = r,
    maxx = S - r,
    miny = r,
    maxy = S - r;
  if (x >= minx && x <= maxx) return y >= 0 && y < S;
  if (y >= miny && y <= maxy) return x >= 0 && x < S;
  const cx = x < minx ? minx : maxx;
  const cy = y < miny ? miny : maxy;
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}
for (let y = 0; y < S; y++)
  for (let x = 0; x < S; x++) if (inRoundedRect(x, y)) set(x, y, BG);

// Thick line (capsule) for the "M" strokes
function thickLine(x0, y0, x1, y1, w) {
  const half = w / 2;
  const minx = Math.floor(Math.min(x0, x1) - half);
  const maxx = Math.ceil(Math.max(x0, x1) + half);
  const miny = Math.floor(Math.min(y0, y1) - half);
  const maxy = Math.ceil(Math.max(y0, y1) + half);
  const dx = x1 - x0,
    dy = y1 - y0;
  const len2 = dx * dx + dy * dy || 1;
  for (let y = miny; y <= maxy; y++) {
    for (let x = minx; x <= maxx; x++) {
      let t = ((x - x0) * dx + (y - y0) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const px = x0 + t * dx,
        py = y0 + t * dy;
      const d = Math.hypot(x - px, y - py);
      const a = d <= half ? 255 : d <= half + 1.5 ? 255 * (half + 1.5 - d) / 1.5 : 0;
      if (a > 0) set(x, y, FG, a);
    }
  }
}

// "M" geometry
const top = 320,
  bottom = 704,
  w = 96;
const lx = 300,
  rx = 724,
  mx = 512,
  mid = 540;
thickLine(lx, bottom, lx, top, w); // left vertical
thickLine(lx, top, mx, mid, w); // left diagonal
thickLine(rx, top, mx, mid, w); // right diagonal
thickLine(rx, bottom, rx, top, w); // right vertical

// ---- PNG encode ----
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(b) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
// raw scanlines with filter byte 0
const raw = Buffer.alloc(S * (S * 4 + 1));
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0;
  buf.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
}
const idat = deflateSync(raw, { level: 9 });
const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const png = Buffer.concat([
  sig,
  chunk("IHDR", ihdr),
  chunk("IDAT", idat),
  chunk("IEND", Buffer.alloc(0)),
]);

const here = dirname(fileURLToPath(import.meta.url));
const out = `${here}/../src-tauri/app-icon.png`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, png);
console.log("wrote", out, png.length, "bytes");
