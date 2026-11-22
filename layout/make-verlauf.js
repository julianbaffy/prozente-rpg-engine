/* Erzeugt assets/lp-verlauf.png: dunkler Verlauf (unten deckend, nach oben transparent) für die Lebenspunkte-Leiste der großen Gegnerkarten */
const sharp = require('sharp'), path = require('path');
const W = 600, H = 160, SOLID = 0.45, ALPHA = 0.8;          // unteres Drittel/45 % deckend (0.8), darüber weich ausgeblendet
const buf = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) {
  const t = Math.min(1, (y / H) / (1 - SOLID));            // 0 oben … 1 ab Beginn der deckenden Zone
  const a = Math.round(255 * ALPHA * (t * t * (3 - 2 * t)));  // smoothstep
  for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; buf[i] = 0x2E; buf[i + 1] = 0x21; buf[i + 2] = 0x14; buf[i + 3] = a; }
}
sharp(buf, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(__dirname, 'assets', 'lp-verlauf.png')).then(() => console.log('assets/lp-verlauf.png'));
