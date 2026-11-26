/* Regel-Präsentation „Powergaming mit Prozenten – Die Spielregeln“ (Folien 16:9, Pergament).
 *   node layout/build-regeln.js        ->  pptx/1.0_Regeln.pptx (10 Folien, gekürzte Fassung)
 *   node layout/build-regeln.js --mit-ruestung  ->  inkl. der 3 Rüstungs-/Reihenfolge-Folien (13 Folien)
 * Alle Zahlen kommen aus der Rechenmaschine (engine.js).
 */
import { iconPfad } from './icons.js';
import path from 'path';
import fs from 'fs';
import pptxgen from 'pptxgenjs';
import { erzeuge } from '../engine.js';
import dateinamen from './dateinamen.js';
const ROOT = path.join(import.meta.dirname, '..');
const A = n => path.join(import.meta.dirname, 'assets', n);
const daten = JSON.parse(fs.readFileSync(path.join(ROOT, 'gegenstaende.json'), 'utf8'));
const rpg = erzeuge(daten);
const f = rpg.fmt;

const INK = '2E2114', PAPER = 'FFFDF6', SAND = 'EFE3BE', CREAM = 'F8F1DE', GREY = '6B5B45', WHITE = 'FFFFFF';
const HEAD = 'Cambria', BODY = 'Calibri';
const PW = 10, PH = 5.625, MX = 0.7, CW = PW - 2 * MX;
const SLOT = { waffe: 'WAFFE', ruestung: 'RÜSTUNG', zauber: 'ZAUBERGEGENSTAND' };

/* ---------- Beispielwerte aus der Engine ---------- */
const ORO = { waffe: 'feuersturm' };
const oroFeen = { waffe: 'feuersturm', zauber: 'feenstaub' };
const mjoFok = { waffe: 'mjoelnir', ruestung: 'fokussierte-gedanken' };
const oroDis = { waffe: 'feuersturm', ruestung: 'wams-des-wahnsinns' };
const tOro = rpg.treffer(ORO, 'eisgolem');
const tOroFeen = rpg.treffer(oroFeen), tMjoFok = rpg.treffer(mjoFok), tOroDis = rpg.treffer(oroDis);
const oro = rpg.item('feuersturm');
const golem = daten.gegner.find(g => g.id === 'eisgolem');
const ptsOro = rpg.itemTabelle('feuersturm');                   // [{quelle,min,mittel,max}]
const fe = ptsOro.find(s => s.quelle === 'FEUER'), ph = ptsOro.find(s => s.quelle === 'PHYSISCH');

const RUESTUNGSFOLIEN = process.argv.includes('--mit-ruestung');
let pres, nr = 0;
const T = (s, text, o = {}) => s.addText(text, Object.assign({ fontFace: BODY, fontSize: 14, color: INK, margin: 0, valign: 'top', isTextBox: true }, o));

function neueFolie(titel, notiz) {
  const s = pres.addSlide(); nr++;
  s.background = { path: A('pergament-quer.jpg') };
  s.addImage({ path: A('rahmen-quer.png'), x: 0, y: 0, w: PW, h: PH, altText: 'Rahmen' });
  if (titel) {
    T(s, titel, { x: MX, y: 0.36, w: CW, h: 0.5, fontFace: HEAD, fontSize: 26, bold: true, align: 'center', valign: 'middle' });
    s.addImage({ path: A('trenner.png'), x: PW / 2 - 2.4, y: 0.88, w: 4.8, h: 4.8 * 40 / 600, altText: 'Trennlinie' });
  }
  T(s, `Powergaming mit Prozenten · Spielregeln · ${nr}`, { x: MX, y: PH - 0.46, w: CW, h: 0.2, fontSize: 9.5, italic: true, color: GREY, align: 'center' });
  if (notiz) s.addNotes(notiz);
  return s;
}
function kasten(s, x, y, w, h, o = {}) {
  s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: o.fill || PAPER }, line: { color: INK, width: o.dash ? 1.5 : 2, dashType: o.dash ? 'dash' : 'solid' } });
  if (!o.dash) s.addShape(pres.ShapeType.rect, { x: x + 0.05, y: y + 0.05, w: w - 0.1, h: h - 0.1, fill: { type: 'none' }, line: { color: INK, width: 0.6 } });
}
function band(s, x, y, w, h, text, o = {}) {
  s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: INK }, line: { color: INK, width: 0.5 } });
  T(s, text, { x, y, w, h, fontFace: HEAD, fontSize: o.fs || 14, bold: true, color: WHITE, align: 'center', valign: 'middle', fit: 'shrink' });
}
function formel(s, x, y, w, h, text, o = {}) {
  s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: SAND }, line: { color: INK, width: 0.9 } });
  T(s, text, { x, y, w, h, fontFace: HEAD, fontSize: o.fs || 16, bold: true, align: 'center', valign: 'middle' });
}
function zahl(s, x, y, n, d = 0.3) {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: INK }, line: { color: CREAM, width: 1 } });
  T(s, String(n), { x, y, w: d, h: d, fontFace: HEAD, fontSize: 12, bold: true, color: WHITE, align: 'center', valign: 'middle' });
}
function tab(s, rows, o) {
  // rows[0] = Kopfzeile; Zellen sind Strings oder {text, options}
  const R = rows.map((r, i) => r.map((c, j) => {
    const t = typeof c === 'object' ? c : { text: String(c), options: {} };
    const base = i === 0 ? { bold: true, color: CREAM, fill: { color: INK }, fontFace: HEAD, align: 'center' }
      : { fill: { color: WHITE }, align: j === 0 ? 'left' : 'center', bold: j === 0 && !o.keinFett };
    return { text: t.text, options: Object.assign({}, base, t.options) };
  }));
  s.addTable(R, { x: o.x, y: o.y, w: o.w, colW: o.colW, rowH: o.rowH || 0.34, border: { type: 'solid', pt: 1, color: INK }, fontFace: BODY, fontSize: o.fs || 13, color: INK, valign: 'middle', margin: [0, 0.08, 0, 0.08] });
}

/* ---------- Gegenstandskarte (Folienformat) ---------- */
function karte(s, id, x, y, w, h, o = {}) {
  const it = rpg.item(id), tb = rpg.itemTabelle(id);
  kasten(s, x, y, w, h);
  band(s, x + 0.1, y + 0.1, w - 0.2, 0.4, it.name, { fs: 15 });
  T(s, `${it.typ}  ·  ${SLOT[it.slot]}`, { x: x + 0.1, y: y + 0.53, w: w - 0.2, h: 0.24, fontSize: 11, italic: true, color: GREY, align: 'center', valign: 'middle' });
  const sq = o.sq || 1.2, ix = x + 0.2, iy = y + 0.9;
  const ico = iconPfad(id);
  if (ico) {
    s.addImage({ path: ico, x: ix, y: iy, w: sq, h: sq, altText: it.name });
    s.addShape(pres.ShapeType.rect, { x: ix, y: iy, w: sq, h: sq, fill: { type: 'none' }, line: { color: INK, width: 1.25 } });
  } else {
    s.addShape(pres.ShapeType.rect, { x: ix, y: iy, w: sq, h: sq, fill: { color: WHITE }, line: { color: INK, width: 1.25, dashType: 'dash' } });
    T(s, 'Bild', { x: ix, y: iy, w: sq, h: sq, fontSize: 11, italic: true, color: GREY, align: 'center', valign: 'middle' });
  }
  const rx = ix + sq + 0.2, rw = w - (rx - x) - 0.2;
  let ry = iy;
  if (tb.length) {
    const rows = [['Schadensart', 'Min', 'Mittel', 'Max'], ...tb.map(r => [r.quelle, f(r.min), f(r.mittel), f(r.max)])];
    tab(s, rows, { x: rx, y: ry, w: rw, colW: [rw * 0.34, rw * 0.2, rw * 0.26, rw * 0.2], rowH: 0.29, fs: 11.5, keinFett: true });
    ry += rows.length * 0.29 + 0.1;
  }
  const mods = (it.modifikatoren || []).map(m => m.auf !== undefined ? `Steigere ${m.quelle}schaden auf ${m.auf} %` : `${m.prozent >= 0 ? '+' : '−'}${Math.abs(m.prozent)} % ${m.quelle}`);
  if (mods.length) T(s, 'Modifikator: ' + mods.join(', '), { x: rx, y: ry, w: rw, h: 0.5, fontSize: 12, bold: true });
  if (tb.length && !o.ohneWuerfel) {
    s.addShape(pres.ShapeType.rect, { x: x + 0.1, y: y + h - 0.42, w: w - 0.2, h: 0.32, fill: { color: SAND }, line: { color: INK, width: 0.75 } });
    T(s, 'Würfel:   1–2 = Min   ·   3–4 = Mittel   ·   5–6 = Max', { x: x + 0.1, y: y + h - 0.42, w: w - 0.2, h: 0.32, fontSize: 11, bold: true, align: 'center', valign: 'middle' });
  }
  return { ix, iy, sq, rx, rw, ry };
}
/* kleine Karte (Name + Regel), für Rüstungen */
function miniKarte(s, id, x, y, w, h) {
  const it = rpg.item(id);
  kasten(s, x, y, w, h, { fill: PAPER });
  band(s, x + 0.08, y + 0.08, w - 0.16, 0.32, it.name, { fs: 12 });
  T(s, `${it.typ} · ${SLOT[it.slot]}`, { x: x + 0.08, y: y + 0.42, w: w - 0.16, h: 0.2, fontSize: 9.5, italic: true, color: GREY, align: 'center', valign: 'middle' });
}

(async () => {
  pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = 'Powergaming mit Prozenten – Die Spielregeln';

  /* ===== 1 Titel ===== */
  {
    const s = pres.addSlide(); nr++;
    s.background = { path: A('pergament-quer.jpg') };
    s.addImage({ path: A('rahmen-quer.png'), x: 0, y: 0, w: PW, h: PH, altText: 'Rahmen' });
    const bw = 8.0, bh = bw * 130 / 700;
    s.addImage({ path: A('banner.png'), x: (PW - bw) / 2, y: 1.15, w: bw, h: bh, altText: 'Titelband' });
    T(s, 'S P I E L R E G E L N', { x: (PW - bw) / 2, y: 1.15 + 0.3, w: bw, h: 0.25, fontFace: HEAD, fontSize: 12, bold: true, color: CREAM, align: 'center', charSpacing: 6 });
    T(s, 'Powergaming mit Prozenten', { x: (PW - bw) / 2, y: 1.15 + 0.6, w: bw, h: 0.65, fontFace: HEAD, fontSize: 34, bold: true, color: WHITE, align: 'center', valign: 'middle' });
    T(s, 'Wie aus Zahlen ein Held geschmiedet wird', { x: MX, y: 3.1, w: CW, h: 0.4, fontFace: HEAD, fontSize: 18, italic: true, align: 'center', valign: 'middle' });
    s.addImage({ path: A('trenner.png'), x: PW / 2 - 2.4, y: 3.75, w: 4.8, h: 0.32, altText: 'Trennlinie' });
    T(s, 'Stufe 1 · Die Schmiede     Stufe 2 · Die Rüstkammer     Stufe 3 · Die Monsterhöhlen', { x: MX, y: 4.25, w: CW, h: 0.3, fontSize: 14, align: 'center' });
    s.addNotes('Einstieg: Die Klasse spielt gleich einen Helden, der mit möglichst viel Schaden Monster besiegen soll. Die Regeln werden an Beispielen erklärt; die Zahlen stammen aus der Rechenmaschine (engine.js).');
  }

  /* ===== 2 Worum geht es ===== */
  {
    const s = neueFolie('Worum geht es?', 'Drei Stufen: erst Waffe und Zaubergegenstand, dann zusätzlich die Rüstung, dann Monster mit Widerständen.');
    T(s, [{ text: 'Ein Held trägt einen ', options: {} }, { text: 'Build', options: { bold: true } }, { text: ' aus bis zu drei Gegenständen: ', options: {} }, { text: 'Waffe · Zaubergegenstand · Rüstung', options: { bold: true } }, { text: '. Gesucht ist der Build mit dem meisten Schaden pro Angriff.', options: {} }],
      { x: MX, y: 1.3, w: CW, h: 0.7, fontSize: 16, align: 'center', valign: 'middle' });
    const cw = (CW - 0.5) / 3, y0 = 2.15, h = 2.45;
    [['Stufe 1', 'Die Schmiede', 'Waffe + Zaubergegenstand', 'Rüste deine Figur so aus, dass sie maximalen Schaden anrichtet.'],
     ['Stufe 2', 'Die Rüstkammer', '+ magische Rüstung', 'Nutze auch die Rüstung für noch mehr Schaden\n(nur Schaden, nicht Schutz).'],
     ['Stufe 3', 'Die Monsterhöhlen', 'zwei komplette Sets', 'Besiege jedes Monster in höchstens 3 Kampfrunden – mit Pech, im Durchschnitt oder mit Glück.']].forEach((c, i) => {
      const x = MX + i * (cw + 0.25);
      kasten(s, x, y0, cw, h);
      band(s, x + 0.1, y0 + 0.1, cw - 0.2, 0.36, c[0].toUpperCase(), { fs: 13 });
      T(s, c[1], { x: x + 0.15, y: y0 + 0.58, w: cw - 0.3, h: 0.35, fontFace: HEAD, fontSize: 17, bold: true, align: 'center', valign: 'middle' });
      T(s, c[2], { x: x + 0.15, y: y0 + 0.95, w: cw - 0.3, h: 0.28, fontSize: 13, italic: true, color: GREY, align: 'center', valign: 'middle' });
      T(s, c[3], { x: x + 0.2, y: y0 + 1.35, w: cw - 0.4, h: 0.95, fontSize: 13.5, align: 'center', valign: 'top' });
    });
  }

  /* ===== 3 Schaden und Schadensarten ===== */
  {
    const s = neueFolie('Schaden und Schadensarten', 'Jeder Schaden hat genau eine Schadensart. Gruppenwörter (ELEMENTAR, SCHADEN) kommen bei den Modifikatoren vor.');
    T(s, [{ text: 'Schaden messen wir in ', options: {} }, { text: 'Schadenspunkten (SP)', options: { bold: true } }, { text: '. Jeder Schaden hat eine ', options: {} }, { text: 'Schadensart', options: { bold: true } }, { text: ':', options: {} }],
      { x: MX, y: 1.3, w: CW, h: 0.4, fontSize: 16, align: 'center', valign: 'middle' });
    const qs = ['FEUER', 'EIS', 'BLITZ', 'PHYSISCH', 'CHAOS'], bw = 1.5, gap = 0.2, x0 = (PW - (5 * bw + 4 * gap)) / 2, by = 1.85;
    qs.forEach((q, i) => band(s, x0 + i * (bw + gap), by, bw, 0.46, q, { fs: 15 }));
    const xr = i => x0 + i * (bw + gap);
    const klammer = (x1, x2, y, text, d) => {
      const ln = { color: INK, width: 1.25 };
      s.addShape(pres.ShapeType.line, { x: x1, y, w: x2 - x1, h: 0, line: ln });
      s.addShape(pres.ShapeType.line, { x: x1, y: y - 0.12, w: 0, h: 0.12, line: ln });
      s.addShape(pres.ShapeType.line, { x: x2, y: y - 0.12, w: 0, h: 0.12, line: ln });
      T(s, text, { x: x1, y: y + 0.05, w: x2 - x1, h: 0.3, fontFace: HEAD, fontSize: 14, bold: true, align: 'center', valign: 'middle' });
    };
    klammer(xr(0), xr(2) + bw, by + 0.7, 'ELEMENTAR = FEUER + EIS + BLITZ');
    klammer(xr(0), xr(4) + bw, by + 1.25, 'SCHADEN = alle Schadensarten zusammen');
    kasten(s, MX + 0.3, 3.75, CW - 0.6, 0.95, { fill: SAND });
    T(s, [{ text: 'Beispiele: ', options: { bold: true } }, { text: 'Ein Feuerschwert macht FEUERschaden, ein Eiszauber EISschaden, ein normales Schwert PHYSISCHen Schaden und eine Giftwolke CHAOSschaden. Manche Gegenstände haben mehrere Schadensarten.', options: {} }],
      { x: MX + 0.5, y: 3.8, w: CW - 1.0, h: 0.85, fontSize: 14, valign: 'middle' });
  }

  /* ===== 4 Karte lesen ===== */
  {
    const s = neueFolie('Eine Gegenstandskarte lesen', 'Karte: Feuersturm. Würfelregel: 1–2 Minimum, 3–4 Mittelwert, 5–6 Maximum.');
    const kx = MX, ky = 1.3, kw = 5.0, kh = 3.2;
    const g = karte(s, 'feuersturm', kx, ky, kw, kh, { sq: 1.3 });
    zahl(s, kx + 0.14, ky + 0.15, 1);
    zahl(s, kx + 0.08, g.iy - 0.14, 2);
    zahl(s, g.rx + g.rw - 0.15, g.iy - 0.16, 3);
    zahl(s, g.rx + g.rw - 0.4, g.ry - 0.04, 4);
    zahl(s, kx + 0.14, ky + kh - 0.43, 5);
    const lx = kx + kw + 0.4, lw = PW - MX - lx;
    [['Name, Typ und Platz (Waffe, Rüstung, Zauber)'],
     ['So sieht der Gegenstand aus.'],
     ['Grundschaden je Schadensart: kleinster (Min), mittlerer, größter Wert (Max)'],
     ['Modifikator: ändert den Schaden einer Schadensart um Prozent'],
     ['Der Würfel entscheidet bei jedem Angriff, welcher Wert gilt']].forEach((t, i) => {
      const y = ky + i * 0.66;
      zahl(s, lx, y, i + 1);
      T(s, t[0], { x: lx + 0.42 + (i === 1 ? 0.013 : 0), y: y - 0.04 + (i === 1 ? 0.095 : 0), w: lw - 0.42, h: 0.62, fontSize: 13, valign: 'top' });   // Text 2: Handanpassung (Julian)
    });
  }

  /* ===== 5 Modifikator: Prozentwert ===== (Fassung von Julian, 10.11.: Karte, Formeln und leere Rechentabelle) */
  {
    const s = neueFolie('Ein Modifikator: Prozentwert berechnen', 'Beispiel Feuersturm: Modifikator +50 % FEUER. Der Bonus (Prozentwert W) ist der Zuwachs. Die Tabelle füllen wir gemeinsam aus.');
    /* kleine Karte Feuersturm */
    const kx = 0.434, ky = 1.304;
    kasten(s, kx, ky, 3.47, 1.9);
    band(s, kx + 0.1, ky + 0.1, 3.27, 0.32, oro.name, { fs: 12 });
    T(s, oro.typ, { x: kx + 0.1, y: 1.734, w: 3.27, h: 0.16, fontSize: 8.5, italic: true, color: GREY, align: 'center', valign: 'middle' });
    const ico = iconPfad('feuersturm');
    if (ico) s.addImage({ path: ico, x: 0.554, y: 1.904, w: 0.9, h: 0.9, altText: oro.name });
    s.addShape(pres.ShapeType.rect, { x: 0.554, y: 1.904, w: 0.9, h: 0.9, fill: { type: 'none' }, line: { color: INK, width: 1.25 } });
    const mh = (t, o = {}) => ({ text: t, options: Object.assign({ bold: true, fill: { color: SAND }, align: 'center', fontSize: 9 }, o) });
    const mc = (t, o = {}) => ({ text: t, options: Object.assign({ fill: { color: PAPER }, align: 'center', fontSize: 9 }, o) });
    s.addTable([
      [mh('Schadensart'), mh('Min'), mh('Mittel'), mh('Max')],
      ...[ph, fe].map(r => [mc(r.quelle, { align: 'left', fontSize: 8.5 }), mc(f(r.min)), mc(f(r.mittel)), mc(f(r.max))])
    ], { x: 1.594, y: 1.904, w: 2.19, colW: [0.832, 0.372, 0.5475, 0.438], rowH: 0.19, border: { type: 'solid', pt: 0.75, color: INK }, fontFace: BODY, color: INK, valign: 'middle', margin: [0, 0.02, 0, 0.02] });
    T(s, '+50 %  FEUER', { x: 1.594, y: 2.554, w: 2.19, h: 0.2, fontSize: 9, bold: true });
    s.addShape(pres.ShapeType.rect, { x: 0.534, y: 2.864, w: 3.27, h: 0.22, fill: { color: SAND }, line: { color: INK, width: 0.75 } });
    T(s, 'Würfel:   1–2 = Min   ·   3–4 = Mittel   ·   5–6 = Max', { x: 0.534, y: 2.864, w: 3.27, h: 0.22, fontSize: 8.5, bold: true, align: 'center', valign: 'middle' });
    /* Formeln */
    formel(s, 4.339, 1.293, 4.0, 0.469, 'Bonus: Prozentwert  W = p · G', { fs: 14 });
    T(s, 'Gruppenwörter wirken auf alle ihre Schadensarten: „+40 % ELEMENTAR“ gilt für FEUER, EIS und BLITZ.', { x: 4.339, y: 1.857, w: 3.47, h: 0.35, fontSize: 12, italic: true, color: GREY, valign: 'middle' });
    formel(s, 4.339, 2.505, 4.0, 0.469, 'neuer Schaden  = G + W', { fs: 14 });
    /* leere Rechentabelle */
    const hd = (t, o = {}) => ({ text: t, options: Object.assign({ bold: true, color: CREAM, fill: { color: INK }, fontFace: HEAD, align: 'center', fontSize: 10.5 }, o) });
    const hs = t => hd(t, { fontFace: BODY });
    const bc = (t, o = {}) => ({ text: t, options: Object.assign({ fill: { color: WHITE }, align: 'center', fontSize: 11 }, o) });
    const bq = t => bc(t, { bold: true, align: 'left' });
    const leer = n => Array.from({ length: n }, () => bc(''));
    s.addTable([
      [hd('Schadensart', { rowspan: 2 }), hd('Grundschaden', { colspan: 3 }), hd('Modifikatoren (Summe)', { rowspan: 2 }), hd('Bonus', { colspan: 3 }), hd('Neuer Schaden', { colspan: 3 })],
      ['Min', 'Mittel', 'Max', 'Min', 'Mittel', 'Max', 'Min', 'Mittel', 'Max'].map(hs),
      [bq('PHYSISCH'), bc(f(ph.min)), bc(f(ph.mittel)), bc(f(ph.max)), ...leer(7)],
      [bq('FEUER'), bc(f(fe.min)), bc(f(fe.mittel)), bc(f(fe.max)), ...leer(7)],
      [bc('Gesamtschaden', { colspan: 8, align: 'right', bold: true, fill: { color: SAND } }), bc('', { fill: { color: SAND } }), bc('', { fill: { color: SAND } }), bc('', { fill: { color: SAND } })]
    ], { x: 0.434, y: 3.355, w: 8.866, colW: [1.3872, 0.6365, 0.6365, 0.6365, 1.06, 0.7428, 0.7428, 0.7428, 0.7602, 0.7602, 0.7602], rowH: [0.2988, 0.2988, 0.3466, 0.3466, 0.3466], border: { type: 'solid', pt: 0.9, color: INK }, fontFace: BODY, color: INK, valign: 'middle', margin: [0, 0.03, 0, 0.03] });
  }

  /* ===== 6 Addieren ===== (Fassung von Julian, 10.11.: zwei Karten und Rechnung Schritt für Schritt) */
  {
    const pF = rpg.item('feenstaub').modifikatoren.find(m => m.quelle === 'FEUER').prozent;   // Feenstaub: +40 % je Schadensart
    const s = neueFolie('Mehrere Modifikatoren: addieren!', 'Wichtigste Regel: Modifikatoren derselben Schadensart werden addiert, nicht multipliziert. Beispiel: Feuersturm + Feenstaub.');
    s.addImage({ path: A('regeln-karte-feuersturm.png'), x: 1.4706, y: 1.1373, w: 3.2194, h: 1.7758, altText: 'Karte Feuersturm' });
    s.addImage({ path: A('regeln-karte-feenstaub.png'), x: 5.31, y: 1.2714, w: 3.2194, h: 1.5075, altText: 'Karte Feenstaub' });
    T(s, 'FEUER', { x: 1.503, y: 2.94, w: 0.409, h: 1.479, fontSize: 14, align: 'center', valign: 'middle', vert: 'wordArtVert', charSpacing: -3 });
    const summe = 50 + pF, bonus = 30 * summe / 100;
    const r = (t, o = {}) => ({ text: t, options: Object.assign({ align: 'right', fontSize: 16, bold: true }, o) });
    const l = t => ({ text: t, options: { align: 'left', fontSize: 16, bold: true } });
    s.addTable([
      [r('Modifikator:'), l(`+50 % + ${pF} % = +${summe} %`)],
      [r('Bonus:'), l(`30 · ${summe} % = 30 · ${f(summe / 100)} = ${f(bonus)}`)],
      [r('Neuer Schaden Mittel:'), l(`30 + ${f(bonus)} = ${f(30 + bonus)}`)]
    ], { x: 1.912, y: 3.136, w: 5.5555, colW: [2.7777, 2.7778], rowH: 0.4056, border: { type: 'none' }, fontFace: BODY, color: INK, valign: 'middle' });
    T(s, [{ text: 'Verschiedene Schadensarten bekommen jeweils ihren eigenen Faktor: ', options: {} }, { text: 'PHYSISCH bleibt ' + f(ph.mittel) + '. Gesamtschaden (Mittelwert): ' + f(tOroFeen.proQuelle.FEUER.avg) + ' + ' + f(ph.mittel) + ' = ' + f(tOroFeen.avg) + ' SP.', options: { bold: true } }],
      { x: MX, y: 4.486, w: CW, h: 0.55, fontSize: 16, valign: 'middle' });
  }

  /* Folien zu Rüstungen / Reihenfolge: in der Fassung vom 7.11. von Julian entfernt (gekürzt).
   * Mit RUESTUNGSFOLIEN = true werden sie wieder eingefügt. */
  if (RUESTUNGSFOLIEN) {
    /* ===== 7 Stufe 2: Rüstungen ===== */
    {
      const s = neueFolie('Stufe 2: Die Rüstung', 'Vier typische Sonderregeln bei Rüstungen. Weitere Sonderregeln stehen auf den Karten.');
      const cw = (CW - 0.3) / 2, ch = 1.55;
      const boxen = [
        ['Zusätzlicher Grundschaden', 'koenigin-des-waldes', 'Rüstungen können eigenen Grundschaden mitbringen (hier 20–40 BLITZ). Er wird zum Grundschaden addiert und dann wie jeder andere Grundschaden modifiziert.'],
        ['Umwandlung', 'wams-des-wahnsinns', '50 % jedes Grundschadens werden in CHAOSschaden umgewandelt, danach +25 % CHAOS.'],
        ['Negative Modifikatoren', 'fokussierte-gedanken', '−50 % ELEMENTAR, +50 % PHYSISCH. Negative Prozente werden einfach mit den anderen Prozenten derselben Schadensart addiert.'],
        ['„Kein Schaden“', 'letzte-bastion', '+50 PHYSISCH Grundschaden, aber der Träger verursacht keinen ELEMENTARschaden mehr (FEUER, EIS, BLITZ fallen weg).']];
      boxen.forEach((b, i) => {
        const x = MX + (i % 2) * (cw + 0.3), y = 1.3 + Math.floor(i / 2) * (ch + 0.15);
        kasten(s, x, y, cw, ch);
        T(s, b[0], { x: x + 0.15, y: y + 0.1, w: cw - 0.3, h: 0.3, fontFace: HEAD, fontSize: 15, bold: true, valign: 'middle' });
        T(s, rpg.item(b[1]).name + ' (' + rpg.item(b[1]).typ + ')', { x: x + 0.15, y: y + 0.4, w: cw - 0.3, h: 0.26, fontSize: 12, italic: true, color: GREY, valign: 'middle' });
        T(s, b[2], { x: x + 0.15, y: y + 0.72, w: cw - 0.3, h: ch - 0.8, fontSize: 12.5 });
      });
    }

    /* ===== 8 Beispiel negativ ===== */
    {
      const s = neueFolie('Beispiel: plus und minus verrechnen', 'Mjölnir (+50 % BLITZ) mit Fokussierte Gedanken (−50 % ELEMENTAR, +50 % PHYSISCH). BLITZ: +50 − 50 = 0 %.');
      T(s, [{ text: 'Mjölnir', options: { bold: true } }, { text: ' (Streitkolben, +50 % BLITZ) und ', options: {} }, { text: 'Fokussierte Gedanken', options: { bold: true } }, { text: ' (Kettenhemd, −50 % ELEMENTAR, +50 % PHYSISCH):', options: {} }],
        { x: MX, y: 1.25, w: CW, h: 0.5, fontSize: 15, align: 'center', valign: 'middle' });
      const mt = rpg.itemTabelle('mjoelnir'), bl = mt.find(r => r.quelle === 'BLITZ'), py = mt.find(r => r.quelle === 'PHYSISCH');
      const rows = [['Schadensart', 'Grundschaden (Mittel)', 'Modifikatoren (Summe)', 'Faktor', 'Schaden'],
        ['BLITZ', f(bl.mittel), '+50 % (Mjölnir)  −50 % (Rüstung)  =  0 %', '1', f(tMjoFok.proQuelle.BLITZ.avg)],
        ['PHYSISCH', f(py.mittel), '+50 % (Rüstung)  =  +50 %', '1,5', f(tMjoFok.proQuelle.PHYSISCH.avg)]];
      tab(s, rows, { x: MX + 0.1, y: 2.0, w: CW - 0.2, colW: [1.3, 1.75, 3.55, 0.7, CW - 0.2 - 7.3], rowH: 0.5, fs: 13 });
      formel(s, PW / 2 - 2.2, 3.85, 4.4, 0.55, 'Gesamtschaden: ' + f(tMjoFok.avg) + ' SP', { fs: 20 });
      T(s, 'Heben sich Plus und Minus auf, bleibt der Grundschaden unverändert.', { x: MX, y: 4.5, w: CW, h: 0.35, fontSize: 13, italic: true, color: GREY, align: 'center', valign: 'middle' });
    }

    /* ===== 9 Reihenfolge ===== */
    {
      const s = neueFolie('In welcher Reihenfolge wird gerechnet?', 'Beispiel Feuersturm + Wams des Wahnsinns (50 % Umwandlung in CHAOS, +25 % CHAOS).');
      const steps = ['Grundschaden je Schadensart summieren (alle Gegenstände)', 'Umwandlung durchführen', '„Kein Schaden“ streichen', 'Modifikatoren je Schadensart addieren → Faktor 1 + Summe', 'Widerstände des Monsters anwenden (ab Stufe 3)'];
      steps.forEach((t, i) => {
        const y = 1.35 + i * 0.66;
        zahl(s, MX, y, i + 1, 0.36);
        T(s, t, { x: MX + 0.5, y, w: 3.3, h: 0.6, fontSize: 13.5, valign: 'middle' });
      });
      const x0 = 4.7, w = PW - MX - x0;
      T(s, 'Beispiel: Feuersturm + Wams des Wahnsinns (Mittelwerte)', { x: x0, y: 1.3, w, h: 0.4, fontSize: 13, bold: true, italic: true, align: 'center', valign: 'middle' });
      const pq = tOroDis.proQuelle;
      const rows = [['Schadensart', 'Grund-schaden', 'Um-wandlung', 'Modi-fikator', 'Schaden'],
        ['PHYSISCH', f(ph.mittel), f(ph.mittel / 2), '–', f(pq.PHYSISCH.avg)],
        ['FEUER', f(fe.mittel), f(fe.mittel / 2), '+50 %', f(pq.FEUER.avg)],
        ['CHAOS', '0', f(ph.mittel / 2 + fe.mittel / 2), '+25 %', f(pq.CHAOS.avg)]];
      tab(s, rows, { x: x0, y: 1.8, w, colW: [0.95, 0.9, 0.95, 0.85, w - 3.65], rowH: 0.5, fs: 12 });
      formel(s, x0 + 0.4, 4.0, w - 0.8, 0.5, 'Gesamt: ' + f(tOroDis.avg) + ' SP', { fs: 18 });
    }
  }

  /* ===== 10 Monster ===== */
  {
    const s = neueFolie('Monster mit Widerständen', 'Der Widerstand ändert den erlittenen Schaden je Schadensart. Immun heißt Faktor 0.');
    // Monsterkarte im Stil der großen Gegnerkarten (Julian, 10.11.): Bild mit Lebenspunkte-Leiste, Widerstände darunter
    const kx = MX, ky = 1.3125, kw = 3.47, kh = 3.64;
    s.addShape(pres.ShapeType.rect, { x: kx, y: ky, w: kw, h: kh, fill: { color: PAPER }, line: { color: INK, width: 2.25 } });
    s.addShape(pres.ShapeType.rect, { x: kx + 0.05, y: ky + 0.05, w: kw - 0.1, h: kh - 0.1, fill: { type: 'none' }, line: { color: INK, width: 0.6 } });
    band(s, kx + 0.1, ky + 0.1, kw - 0.2, 0.32, golem.name, { fs: 15 });
    const pic = 2.13, px = kx + (kw - pic) / 2, py = ky + 0.54, gIco = iconPfad(golem.id);
    if (gIco) s.addImage({ path: gIco, x: px, y: py, w: pic, h: pic, altText: golem.name });
    s.addImage({ path: A('lp-verlauf.png'), x: px, y: py + pic - 0.8, w: pic, h: 0.8, altText: '' });
    s.addShape(pres.ShapeType.rect, { x: px, y: py, w: pic, h: pic, fill: { type: 'none' }, line: { color: INK, width: 1.5 } });
    T(s, 'Lebenspunkte: ' + golem.lp, { x: px, y: py + pic - 0.36, w: pic, h: 0.36, fontFace: HEAD, fontSize: 13, bold: true, color: WHITE, align: 'center', valign: 'middle' });
    const wd = golem.widerstaende.map(w => w.immun ? `Immun gegen ${w.quelle}schaden` : `${w.prozent > 0 ? '+' : '−'}${Math.abs(w.prozent)} % erlittener ${w.quelle}schaden`);
    T(s, wd.map((t, i) => ({ text: t, options: { bold: true, breakLine: i < wd.length - 1 } })), { x: kx + 0.15, y: 4.17, w: kw - 0.3, h: 0.53, fontSize: 12, align: 'center', valign: 'middle', paraSpaceAfter: 2 });
    const x0 = 5.0, w = PW - MX - x0;
    T(s, [{ text: 'Der Widerstand wird erst ganz am Ende angewendet: auf den fertig berechneten Schaden jeder Schadensart.', options: {} }],
      { x: x0, y: 3.6, w, h: 0.9, fontSize: 16, italic: true, valign: 'top' });
  }

  /* ===== 11 Beispiel Angriff ===== */
  {
    const s = neueFolie('Beispiel: ein Angriff gegen den Eisgolem', 'Feuersturm gegen Eisgolem (300 LP): FEUER 45 · 2 = 90, PHYSISCH 10,5 · 0,5 = 5,25 → 95,25 SP.');
    T(s, [{ text: 'Waffe: ', options: {} }, { text: 'Feuersturm', options: { bold: true } }, { text: ' (nach Modifikator FEUER ' + f(fe.mittel * 1.5) + ', PHYSISCH ' + f(ph.mittel) + ').  Monster: ', options: {} }, { text: 'Eisgolem, ' + golem.lp + ' LP', options: { bold: true } }],
      { x: MX, y: 1.25, w: CW, h: 0.45, fontSize: 14, align: 'center', valign: 'middle' });
    const pq = tOro.proQuelle;
    const rows = [['Schadensart', 'Schaden vor dem Monster', 'Modifikation', 'Schaden danach'],
      ['FEUER', f(pq.FEUER.avg / pq.FEUER.widerstandsFaktor), '+100 %  → × 2', f(pq.FEUER.avg)],
      ['PHYSISCH', f(pq.PHYSISCH.avg / pq.PHYSISCH.widerstandsFaktor), '−50 %  → × 0,5', f(pq.PHYSISCH.avg)]];
    tab(s, rows, { x: MX + 0.4, y: 1.9, w: CW - 0.8, colW: [1.4, 2.4, 2.2, CW - 0.8 - 6.0], rowH: 0.48, fs: 13.5 });
    formel(s, PW / 2 - 2.5, 3.65, 5.0, 0.52, 'Ein Angriff: ' + f(tOro.avg) + ' SP', { fs: 20 });
    T(s, [{ text: 'Wie viele Angriffe? ' + golem.lp + ' : ' + f(tOro.avg) + ' ≈ ' + f(golem.lp / tOro.avg) + '  →  ', options: {} }, { text: 'mindestens ' + Math.ceil(golem.lp / tOro.avg) + ' Angriffe', options: { bold: true } }],
      { x: MX, y: 4.35, w: CW, h: 0.45, fontSize: 16, align: 'center', valign: 'middle' });
  }

  /* ===== 12 Duellregeln ===== */
  {
    const s = neueFolie('Duellregeln: Held gegen Monster', 'Gespielt wird zu zweit: eine Person führt den Helden, die andere das Monster und notiert die LP. Würfel: W6.');
    /* Julian, 10.11.: Regel „Ihr spielt zu zweit …“ gestrichen, vier Regeln, Abstände von Hand angepasst */
    const regeln = [
      ['Jede Runde würfelt der Held einmal: 1–2 → Min, 3–4 → Mittel, 5–6 → Max.', 1.3, 0.5, 1.37],
      ['Der Schaden dieses Wertes (gegen das Monster berechnet!) wird von den LP des Monsters abgezogen.', 1.85, 0.68, 1.995],
      ['Besiegt ist das Monster bei 0 LP oder weniger. Das Ziel: in höchstens 3 Runden.', 2.53, 0.5, 2.6],
      ['Zwischen den Kämpfen darfst du das Set wechseln – aber nur komplett.', 3.2, 0.5, 3.26]];
    regeln.forEach((r, i) => {
      zahl(s, MX, r[3], i + 1, 0.36);
      T(s, r[0], { x: MX + 0.5, y: r[1], w: CW - 0.5, h: r[2], fontSize: 15, valign: 'middle' });
    });
    kasten(s, MX + 0.4, 4.065, CW - 0.8, 0.6, { fill: SAND });
    T(s, [{ text: 'Vorher rechnen: ', options: { bold: true } }, { text: 'Schaffst du es mit Pech (3 · Min), im Durchschnitt (3 · Mittel) oder nur mit Glück (3 · Max)?', options: {} }],
      { x: MX + 0.5, y: 4.065, w: CW - 1.0, h: 0.6, fontSize: 12.5, valign: 'middle', align: 'center' });
  }

  /* ===== 13 Beispielduell ===== */
  {
    const s = neueFolie('Beispiel-Duell: Eisgolem in 3 Runden?', 'Vorhersage und ein gewürfeltes Beispiel. Knapp daneben: 14,25 LP bleiben übrig.');
    const mn = tOro.min, av = tOro.avg, mx = tOro.max, LP = golem.lp;
    T(s, 'Feuersturm gegen Eisgolem (' + LP + ' LP): Min ' + f(mn) + ' · Mittel ' + f(av) + ' · Max ' + f(mx) + ' SP pro Angriff', { x: MX, y: 1.25, w: CW, h: 0.4, fontSize: 14, bold: true, align: 'center', valign: 'middle' });
    const ok = v => (v >= LP ? '✓ ja' : '✗ nein');
    tab(s, [['Vorhersage', 'Rechnung', 'Gesamt', 'Besiegt?'],
      ['Pech', '3 · ' + f(mn), f(3 * mn), ok(3 * mn)],
      ['Durchschnitt', '3 · ' + f(av), f(3 * av), ok(3 * av)],
      ['Glück', '3 · ' + f(mx), f(3 * mx), ok(3 * mx)]],
      { x: MX, y: 1.8, w: 4.1, colW: [1.3, 1.0, 0.9, 0.9], rowH: 0.42, fs: 12 });
    const wuerfe = [2, 5, 3], lv = { 1: 'min', 2: 'min', 3: 'avg', 4: 'avg', 5: 'max', 6: 'max' }, wert = { min: mn, avg: av, max: mx };
    let rest = LP; const rows = [['Runde', 'Wurf', 'Schaden', 'LP danach']];
    wuerfe.forEach((w, i) => { const d = wert[lv[w]]; rest -= d; rows.push([String(i + 1), String(w), f(d), f(Math.max(rest, 0))]); });
    T(s, 'Gewürfelt: 2 – 5 – 3', { x: 5.0, y: 1.75, w: 4.4, h: 0.3, fontFace: HEAD, fontSize: 13, bold: true, italic: true, align: 'center', valign: 'middle' });
    tab(s, rows, { x: 5.0, y: 2.1, w: 4.3, colW: [0.85, 0.85, 1.2, 1.4], rowH: 0.42, fs: 12.5 });
    T(s, [{ text: 'Knapp daneben! ', options: { bold: true } }, { text: f(rest) + ' LP fehlen noch – das Monster lebt. (Auch im Durchschnitt hätte es mit ' + f(3 * av) + ' SP nicht gereicht; nur mit Glück.)', options: {} }],
      { x: MX + 0.2, y: 4.05, w: CW - 0.4, h: 0.7, fontSize: 14, align: 'center', valign: 'middle' });
  }

  fs.mkdirSync(path.join(ROOT, 'pptx'), { recursive: true });
  const out = path.join(ROOT, 'pptx', dateinamen.regeln);
  await pres.writeFile({ fileName: out });
  console.log('geschrieben', out, nr, 'Folien');
})();
