/* Baut die QR-Seite zum Web-Tool (A4 hoch, Pergamentstil) als .pptx.
 *   node layout/build-qr.js   ->  pptx/pergament/0.3_QR_Web_Tool.pptx  UND  pptx/ohne-hintergrund/0.3_QR_Web_Tool.pptx
 * Der QR-Code liegt als Bild in layout/assets/qr-webtool.png (erzeugen mit: python3 layout/make-qr.py [URL]).
 */
import fs from 'fs';
import path from 'path';
import pptxgen from 'pptxgenjs';
const A = n => path.join(import.meta.dirname, 'assets', n);
const OUT = path.join(import.meta.dirname, '..', 'pptx');

const INK = '2E2114', PAPER = 'FFFDF6', CREAM = 'F8F1DE', GREY = '6B5B45';
const HEAD = 'Cambria', BODY = 'Calibri';
const PW = 8.27, PH = 11.69, MX = 0.5, CW = PW - 2 * MX;
const URL = 'https://julianbaffy.github.io/prozente-rpg-engine/';

function bauen(modus) {
  const PLAIN = modus === 'ohne-hintergrund';
  const pres = new pptxgen();
  pres.defineLayout({ name: 'A4_HOCH', width: PW, height: PH });
  pres.layout = 'A4_HOCH';
  pres.title = 'Web-Tool · QR-Code';
  pres.author = 'Prozentrechnung RPG';
  const slide = pres.addSlide();
  if (!PLAIN) slide.background = { path: A('pergament.jpg') };
  slide.addImage({ path: A('rahmen.png'), x: 0, y: 0, w: PW, h: PH, altText: 'Rahmen' });

  /* Kopf (wie Arbeitsblatt, ohne Namenszeile) */
  let y = 0.8;
  const bh = CW * 130 / 700;
  slide.addImage({ path: A('banner.png'), x: MX, y, w: CW, h: bh, altText: 'Banner' });
  slide.addText('ZUM AUSPROBIEREN', { x: MX, y: y + 0.3, w: CW, h: 0.25, fontFace: HEAD, fontSize: 10.5, bold: true, color: CREAM, align: 'center', charSpacing: 6, margin: 0, isTextBox: true });
  slide.addText('Das Web-Tool', { x: MX, y: y + 0.56, w: CW, h: 0.55, fontFace: HEAD, fontSize: 27, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  y += bh + 0.08;
  slide.addText('Prüfe deine Rechnungen – am Handy, Tablet oder Computer', { x: MX, y, w: CW, h: 0.3, fontFace: HEAD, fontSize: 12.5, italic: true, color: INK, align: 'center', margin: 0, isTextBox: true });
  y += 0.55;

  /* Karte mit QR-Code: groß und zentral */
  const cw = 6.5, ch = 6.75, cx = (PW - cw) / 2, cy = y;
  slide.addShape(pres.ShapeType.rect, { x: cx, y: cy, w: cw, h: ch, fill: { color: PAPER }, line: { color: INK, width: 2.25 } });
  slide.addShape(pres.ShapeType.rect, { x: cx + 0.06, y: cy + 0.06, w: cw - 0.12, h: ch - 0.12, fill: { type: 'none' }, line: { color: INK, width: 0.6 } });
  const q = 5.4, qx = (PW - q) / 2, qy = cy + 0.32;
  slide.addImage({ path: A('qr-webtool.png'), x: qx, y: qy, w: q, h: q, altText: `QR-Code zum Web-Tool: ${URL}` });
  slide.addShape(pres.ShapeType.rect, { x: qx, y: qy, w: q, h: q, fill: { type: 'none' }, line: { color: INK, width: 1 } });
  slide.addText('Code scannen und loslegen', { x: cx + 0.2, y: qy + q + 0.12, w: cw - 0.4, h: 0.4, fontFace: HEAD, fontSize: 17, bold: true, color: INK, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  slide.addText(URL, { x: cx + 0.2, y: qy + q + 0.52, w: cw - 0.4, h: 0.3, fontFace: BODY, fontSize: 12, italic: true, color: GREY, align: 'center', valign: 'middle', margin: 0, isTextBox: true, hyperlink: { url: URL, tooltip: 'Web-Tool öffnen' } });
  y = cy + ch + 0.25;

  /* Trenner + Hinweis */
  slide.addImage({ path: A('trenner.png'), x: MX + 1.0, y, w: CW - 2.0, h: (CW - 2.0) * 40 / 600, altText: 'Trenner' });
  y += 0.38;
  slide.addText('Gegenstände und Gegner wählen · Schaden und Kampfverlauf berechnen lassen', { x: MX, y, w: CW, h: 0.3, fontFace: BODY, fontSize: 11, color: INK, align: 'center', margin: 0, isTextBox: true });

  const dir = path.join(OUT, modus);
  fs.mkdirSync(dir, { recursive: true });
  const datei = path.join(dir, '0.3_QR_Web_Tool.pptx');
  return pres.writeFile({ fileName: datei }).then(() => console.log('✔', datei));
}
await bauen('pergament');
await bauen('ohne-hintergrund');
