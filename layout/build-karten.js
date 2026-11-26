/* Gegenstandskarten (A4 quer, 3 Spalten: links Bild, rechts Schaden + Modifikatoren; Überschriften Waffen / Zaubergegenstände / Ausrüstung).
 *   node layout/build-karten.js            ->  pptx/pergament/gegenstandskarten.pptx und pptx/ohne-hintergrund/gegenstandskarten.pptx
 *   node layout/build-karten.js uebersicht 3|4|7  ->  Übersicht zu einer Einheit (…/uebersicht-einheit-N.pptx)
 *   node layout/build-karten.js 7          ->  nur Gegenstände der Stufe 7;  `gegner` / `gegner-3`: Gegnerkarten (alle / nur Stufe 3) (…-stufe-7.pptx); die Stufe steht NICHT auf der Karte
 */
import path from 'path';
import fs from 'fs';
import pptxgen from 'pptxgenjs';
import dateinamen from './dateinamen.js';
const ROOT = path.join(import.meta.dirname, '..');
const A = n => path.join(import.meta.dirname, 'assets', n);
import { iconPfad } from './icons.js';
import * as kt from './kartentext.js';
import { NEUE_GEGENSTAENDE as NEU } from './uebersichten.js';
const daten = JSON.parse(fs.readFileSync(path.join(ROOT, 'gegenstaende.json'), 'utf8'));
const fmt = x => (Math.round(x * 100) / 100).toString().replace('.', ',');

const INK = '2E2114', PAPER = 'FFFDF6', SAND = 'EFE3BE', CREAM = 'F8F1DE', GREY = '6B5B45';
const HEAD = 'Cambria', BODY = 'Calibri';
const PW = 11.69, PH = 8.27;          // A4 quer
const COLS = 3, GAP = 0.14, MX = 0.5, TOP = 0.72, BOT = PH - 0.62;
let CW = (PW - 2 * MX - (COLS - 1) * GAP) / COLS; const CW0 = CW;
let SPALTEN = COLS;
const ABSCHNITTE = [['waffe', 'Waffen'], ['zauber', 'Zaubergegenstände'], ['ruestung', 'Ausrüstung']];

/* ---------- Layout: A4 quer, 3 Spalten, Zeilenhöhe richtet sich nach dem Inhalt ---------- */
const FLOW_TOP = TOP, FLOW_BOT = BOT, HEAD_H = 0.42;
let SQ = 0.9;
const PAD = 0.12;
const wrapLines = (text, maxChars) => {        // grobe Zeilenzahl-Schätzung (Wortumbruch)
  let n = 0;
  String(text).split('\n').forEach(par => { let cur = 0; n += 1; par.split(' ').forEach(w => { if (cur && cur + 1 + w.length > maxChars) { n++; cur = w.length; } else cur += (cur ? 1 : 0) + w.length; }); });
  return n;
};
const nameSize = n => (n.length <= 22 ? 12 : n.length <= 27 ? 10.5 : 9.5);
const IY0 = 0.6, UNT0 = 0.43;
let IY = IY0;                                               // Oberkante des Bildes in der Karte
/* Abstände, die eine Übersicht (cfg.abst) gegenüber dem Standard lockern kann (Übersicht 8, Julians Anpassung):
 *   iy = Bildoberkante · unt = Lage des Untertitels (Typ) · dx = Bild + rechte Spalte nach rechts · hExtra = Karte höher · abschnitt = Abstand vor dem nächsten Abschnitt */
let UNT = UNT0, DX = 0, HEXTRA = 0, ABSCHNITT = 0;
function setAbst(a = {}) { IY = a.iy ?? IY0; UNT = a.unt ?? UNT0; DX = a.dx ?? 0; HEXTRA = a.hExtra ?? 0; ABSCHNITT = a.abschnitt ?? 0; }
let RX, RW, RCH;                                            // rechte Spalte (neben dem Bild); RCH = Zeichen je Zeile (geschätzt)
function setSQ(v, cols = COLS) { SQ = v; SPALTEN = cols; CW = (PW - 2 * MX - (cols - 1) * GAP) / cols; RX = PAD + SQ + 0.14; RW = CW - RX - PAD; RCH = Math.floor(RW * 16.3); }
setSQ(0.9);

function kopf(pres, slide, name, untertitel, x, y, h, fl, CW = CW0, fs, unt = UNT) {
  slide.addShape(pres.ShapeType.rect, { x, y, w: CW, h, fill: fl(PAPER), line: { color: INK, width: 2.25 } });
  slide.addShape(pres.ShapeType.rect, { x: x + 0.05, y: y + 0.05, w: CW - 0.1, h: h - 0.1, fill: { type: 'none' }, line: { color: INK, width: 0.6 } });
  slide.addShape(pres.ShapeType.rect, { x: x + 0.1, y: y + 0.1, w: CW - 0.2, h: 0.32, fill: { color: INK }, line: { color: INK, width: 0.5 } });
  slide.addText(name, { x: x + 0.12, y: y + 0.1, w: CW - 0.24, h: 0.32, fontFace: HEAD, fontSize: fs || nameSize(name), bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, fit: 'shrink', isTextBox: true });
  slide.addText(untertitel, { x: x + 0.1, y: y + unt, w: CW - 0.2, h: 0.16, fontFace: BODY, fontSize: 8.5, italic: true, color: GREY, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
}
function bild(pres, slide, id, name, x, y) {
  const ico = iconPfad(id);
  if (ico) {
    slide.addImage({ path: ico, x, y, w: SQ, h: SQ, altText: name });
    slide.addShape(pres.ShapeType.rect, { x, y, w: SQ, h: SQ, fill: { type: 'none' }, line: { color: INK, width: 1.25 } });
  } else {
    slide.addShape(pres.ShapeType.rect, { x, y, w: SQ, h: SQ, fill: { color: 'FFFFFF' }, line: { color: INK, width: 1.25, dashType: 'dash' } });
    slide.addText('Bild', { x, y, w: SQ, h: SQ, fontFace: BODY, fontSize: 9, italic: true, color: GREY, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  }
}

/* Inhalt einer Gegenstandskarte: rechts neben dem Bild erst die Schadenstabelle, darunter die Modifikatoren; unten das Würfelband */
function itemLayout(it) {
  const mods = kt.modZeilen(it);
  const tb = kt.tabelle(it), rows = tb.length ? tb.length + 1 : 0;
  const desc = (it.beschreibung && !tb.length && !kt.absolutZeilen(it).length) ? it.beschreibung : null;
  const lines = mods.reduce((n, m) => n + wrapLines(m, RCH), 0) + (desc ? wrapLines(desc, RCH + 2) : 0);
  const tH = rows * 0.19, mY = tH + (rows && lines ? 0.08 : 0), textH = lines ? lines * 0.148 + 0.04 : 0;
  const wue = kt.hatWuerfel(it);
  const inh = Math.max(SQ, mY + textH);
  return { mods, desc, tb, rows, tH, mY, textH, wue, h: IY + inh + (wue ? 0.08 + 0.22 : 0) + 0.1 + HEXTRA };
}
function karte(pres, slide, it, x, y, h, PLAIN) {
  const fl = c => ({ color: c });   // Füllungen (Kästen, Labels) bleiben auch ohne Pergament erhalten – nur der Hintergrund entfällt (Julian, 10.11.)
  const L = itemLayout(it);
  kopf(pres, slide, it.name, it.typ, x, y, h, fl, CW);
  bild(pres, slide, it.id, it.name, x + PAD + DX, y + IY);
  const rx = x + RX + DX;
  if (L.tb.length) {
    const kp = t => ({ text: t, options: { bold: true, fill: { color: SAND }, align: 'center' } });
    let rows, colW;
    if (kt.alleFest(L.tb)) {          // fester Angriffswert: eine Zelle statt drei
      rows = [[kp('Schadensart'), kp(kt.KOPF_FEST)]];
      L.tb.forEach(s => rows.push([{ text: s.quelle, options: { align: 'left', fontSize: 8.5 } }, { text: fmt(s.mittel), options: { align: 'center' } }]));
      colW = [RW * 0.5, RW * 0.5];
    } else {
      rows = [['Schadensart', 'Min', 'Mittel', 'Max'].map(kp)];
      L.tb.forEach(s => rows.push([{ text: s.quelle, options: { align: 'left', fontSize: 8.5 } }, ...[s.min, s.mittel, s.max].map(v => ({ text: fmt(v), options: { align: 'center' } }))]));
      colW = [RW * 0.38, RW * 0.17, RW * 0.25, RW * 0.2];
    }
    slide.addTable(rows, { x: rx, y: y + IY, w: RW, colW, rowH: 0.19, border: { type: 'solid', pt: 0.75, color: INK }, fontFace: BODY, fontSize: 9, color: INK, valign: 'middle', margin: [0, 0.02, 0, 0.02] });
  }
  if (L.mods.length || L.desc) {
    const runs = L.mods.map(m => ({ text: m, options: { breakLine: true, bold: true, fontSize: 9 } }));
    if (L.desc) runs.push({ text: L.desc, options: { italic: true, fontSize: 8.5 } });
    else runs[runs.length - 1].options.breakLine = false;
    slide.addText(runs, { x: rx, y: y + IY + L.mY, w: RW, h: Math.max(0.2, L.textH), fontFace: BODY, color: INK, margin: 0, valign: 'top', isTextBox: true, paraSpaceAfter: 1 });
  }
  if (L.wue) {
    slide.addShape(pres.ShapeType.rect, { x: x + 0.1, y: y + h - 0.34, w: CW - 0.2, h: 0.22, fill: fl(SAND), line: { color: INK, width: 0.75 } });
    slide.addText('Würfel:   1–2 = Min   ·   3–4 = Mittel   ·   5–6 = Max', { x: x + 0.1, y: y + h - 0.34, w: CW - 0.2, h: 0.22, fontFace: BODY, fontSize: 8.5, bold: true, color: INK, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  }
}

/* Gegnerkarte: links Bild, rechts LP + Eigenschaften (Widerstand / Immunität / Anfälligkeit) */
function gegnerLayout(g) {
  const zl = kt.gegnerZeilen(g);
  const lines = zl.reduce((n, t) => n + wrapLines(t, RCH), 0);
  const tH = lines * 0.15;
  return { zl, tH, h: IY + Math.max(SQ, 0.36 + 0.07 + tH) + 0.1 };
}
function gegnerKarte(pres, slide, g, x, y, h, PLAIN) {
  const fl = c => ({ color: c });   // Füllungen (Kästen, Labels) bleiben auch ohne Pergament erhalten – nur der Hintergrund entfällt (Julian, 10.11.)
  const L = gegnerLayout(g);
  kopf(pres, slide, g.name, 'Gegner', x, y, h, fl);
  bild(pres, slide, g.id, g.name, x + PAD, y + IY);
  const rx = x + RX;
  slide.addShape(pres.ShapeType.rect, { x: rx, y: y + IY, w: RW, h: 0.36, fill: fl(SAND), line: { color: INK, width: 0.75 } });
  slide.addText(`Lebenspunkte (LP): ${g.lp}`, { x: rx, y: y + IY, w: RW, h: 0.36, fontFace: HEAD, fontSize: 11.5, bold: true, color: INK, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  slide.addText(L.zl.map((t, i) => ({ text: t, options: { breakLine: i < L.zl.length - 1, bold: true } })), { x: rx, y: y + IY + 0.43, w: RW, h: Math.max(0.2, L.tH), fontFace: BODY, fontSize: 9, color: INK, margin: 0, valign: 'top', isTextBox: true, paraSpaceAfter: 1 });
}

function ueberschrift(pres, slide, text, y) {
  slide.addText(text, { x: MX, y, w: PW - 2 * MX, h: 0.3, fontFace: HEAD, fontSize: 15, bold: true, color: INK, align: 'left', valign: 'middle', margin: 0, isTextBox: true });
  slide.addShape(pres.ShapeType.line, { x: MX, y: y + 0.33, w: PW - 2 * MX, h: 0, line: { color: INK, width: 1.5 } });
}

/* Verteilt Abschnitte (Überschrift + Karten in 3er-Zeilen) auf Seiten. */
function seitenPlan(abschnitte, layoutFn0) {
  const seiten = [[]]; let y = FLOW_TOP;
  const neueSeite = () => { seiten.push([]); y = FLOW_TOP; };
  abschnitte.forEach(ab => {
    if (ab.neueSeite && y > FLOW_TOP) neueSeite();
    const reihen = [];
    if (ab.kind === 'gross') {            // große Gegnerkarten: Reihen zu je 3, Höhe max. 3,4 in (Restplatz der Seite)
      const kh = ab.titel ? HEAD_H : 0;
      if (ab.titel) { if (FLOW_BOT - y - kh < 2.4 && y > FLOW_TOP) neueSeite(); seiten[seiten.length - 1].push({ art: 'kopf', text: ab.titel, y }); y += kh; }
      const gc = ab.cols || COLS, gw = (PW - 2 * MX - (gc - 1) * GAP) / gc;
      for (let i = 0; i < ab.items.length; i += gc) {
        if (FLOW_BOT - y < 2.4 && y > FLOW_TOP) neueSeite();
        const h = Math.min(3.4, FLOW_BOT - y);
        seiten[seiten.length - 1].push({ art: 'reihe', items: ab.items.slice(i, i + gc), alle: ab.items, kind: 'gross', h, y, w: gw });
        y += h + GAP;
      }
      y += 0.06; return;
    }
    const layoutFn = ab.kind === 'gegner' ? gegnerLayout : (layoutFn0 || itemLayout);
    const sp = ab.cols || SPALTEN;
    for (let i = 0; i < ab.items.length; i += sp) {
      const r = ab.items.slice(i, i + sp);
      reihen.push({ items: r, kind: ab.kind, h: Math.max(...r.map(it => layoutFn(it).h)) });
    }
    const kopfH = ab.titel ? HEAD_H : 0;
    if (y + kopfH + reihen[0].h > FLOW_BOT && y > FLOW_TOP) neueSeite();
    if (ab.titel) { seiten[seiten.length - 1].push({ art: 'kopf', text: ab.titel, y }); y += kopfH; }
    reihen.forEach(r => {
      if (y + r.h > FLOW_BOT && y > FLOW_TOP) neueSeite();
      seiten[seiten.length - 1].push({ art: 'reihe', ...r, y });
      y += r.h + GAP;
    });
    y += 0.06 + ABSCHNITT;
  });
  return seiten;
}

/* Große Gegnerkarten (Übersicht): Bild oben, LP als Plakette im Bild, Eigenschaften darunter; 2 Reihen */
function gegnerGrossKarte(pres, slide, g, x, y, w, h, pic, PLAIN) {
  const fl = c => ({ color: c });   // Füllungen (Kästen, Labels) bleiben auch ohne Pergament erhalten – nur der Hintergrund entfällt (Julian, 10.11.)
  kopf(pres, slide, g.name, '', x, y, h, fl, w, g.name.length <= 20 ? 15 : g.name.length <= 26 ? 13.5 : 12.5, UNT0);
  const px = x + (w - pic) / 2, py = y + 0.54, ico = iconPfad(g.id);
  if (ico) slide.addImage({ path: ico, x: px, y: py, w: pic, h: pic, altText: g.name });
  const vh = Math.min(0.8, pic);                                  // Verlauf: unten dunkel, nach oben ins Bild ausgeblendet
  slide.addImage({ path: A('lp-verlauf.png'), x: px, y: py + pic - vh, w: pic, h: vh, altText: '' });
  slide.addShape(pres.ShapeType.rect, { x: px, y: py, w: pic, h: pic, fill: { type: 'none' }, line: { color: INK, width: 1.5 } });
  slide.addText(`Lebenspunkte: ${g.lp}`, { x: px, y: py + pic - 0.36, w: pic, h: 0.36, fontFace: HEAD, fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  const zl = kt.gegnerZeilen(g);
  slide.addText(zl.map((t, k) => ({ text: t, options: { breakLine: k < zl.length - 1 } })), { x: x + 0.15, y: py + pic + 0.08, w: w - 0.3, h: y + h - 0.12 - (py + pic + 0.08), fontFace: BODY, fontSize: 10.5, bold: true, color: INK, align: 'center', valign: 'middle', margin: 0, isTextBox: true, paraSpaceAfter: 2 });
}
const grossTextH = (items, w) => {
  const cpl = Math.floor((w - 0.3) * 72 / (10.5 * 0.47));
  return Math.max(...items.map(g => kt.gegnerZeilen(g).reduce((k, t) => k + wrapLines(t, cpl), 0))) * 0.17;
};
const grossPic = (items, w, h) => Math.min(w - 0.3, h - (0.1 + 0.34 + 0.1) - 0.08 - grossTextH(items, w) - 0.14);
function gegnerGross(pres, slide, items, PLAIN) {
  const n = items.length, cols = Math.ceil(n / 2), rows = n > cols ? 2 : 1;
  const w = (PW - 2 * MX - (cols - 1) * GAP) / cols, areaH = BOT - TOP, h = Math.min(3.9, (areaH - (rows - 1) * GAP) / rows);
  const pic = grossPic(items, w, h);
  items.forEach((g, i) => gegnerGrossKarte(pres, slide, g, MX + (i % cols) * (w + GAP), TOP + Math.floor(i / cols) * (h + GAP), w, h, pic, PLAIN));
}

/* Einheit 7 (Julians Layout): Waffen oben; die Ausrüstung bildet eine „Treppe“: Ring rechts neben Lavaklinge, darunter Zeile mit Armband + Handschuhen */
function treppeSeite(pres, slide, t, PLAIN) {
  const colX = c => MX + c * (CW + GAP), line = (x, y, w, h) => slide.addShape(pres.ShapeType.line, { x, y, w, h, line: { color: INK, width: 1.5 } });
  const [h1, h2] = [Math.max(...t.waffen.slice(0, 3).map(i => itemLayout(i).h)), itemLayout(t.waffen[3]).h];
  const h3 = Math.max(...t.ausruestung.map(i => itemLayout(i).h)), hr = itemLayout(t.ring).h;
  const y1 = TOP + 0.51, y2 = y1 + h1 + GAP, y3 = BOT - h3, yLinie = y3 - 0.12;       // Überschrift „Ausrüstung“ + Linie über Zeile 3
  const yRing = yLinie - hr - 0.03, yStufe = yRing - 0.3;     // Julians Anpassung: Stufe 0,3" über dem Ring
  ueberschrift(pres, slide, 'Waffen', TOP + 0.09);
  t.waffen.slice(0, 3).forEach((it, c) => karte(pres, slide, it, colX(c), y1, h1, PLAIN));
  karte(pres, slide, t.waffen[3], colX(0), y2, h2, PLAIN);
  karte(pres, slide, t.ring, colX(2), yRing, hr, PLAIN);
  t.ausruestung.forEach((it, c) => karte(pres, slide, it, colX(c), y3, h3, PLAIN));
  const xs = colX(1) + 1.583;                              // Julians Anpassung: senkrechte Linie in der Lücke, Linie unter „Ausrüstung“ reicht bis dorthin
  line(xs, yStufe, PW - MX - xs, 0);                       // waagerecht über Ring (und Lücke)
  line(xs, yStufe, 0, yLinie - yStufe);                    // senkrecht nach unten
  line(MX, yLinie, xs - MX, 0);                            // Linie unter „Ausrüstung“
  slide.addText('Ausrüstung', { x: MX + 0.05, y: yLinie - 0.35, w: xs - MX - 0.1, h: 0.3, fontFace: HEAD, fontSize: 15, bold: true, color: INK, align: 'left', valign: 'middle', margin: 0, isTextBox: true });
}

const byId = id => daten.gegenstaende.find(i => i.id === id);
const UEBERSICHTEN = {
  3: { kopf: 'Einheit 3 · Die Monsterhöhlen  –  Gegnerübersicht  ·  Ein Gegner ist besiegt, wenn seine Lebenspunkte 0 oder weniger erreichen', gross: daten.gegner.filter(g => g.stufe === 3) },
  4: { kopf: 'Einheit 4 · Die Schriftrollenhändlerin  –  Übersicht', abschnitte: [
    { titel: 'Neue Ausrüstung', items: NEU[4].map(byId) },
    { titel: 'Neue Gegner', kind: 'gross', items: daten.gegner.filter(g => g.stufe === 4) }] },
  8: { kopf: 'Einheit 8 · Die Arena  –  Übersicht', cols: 4, abst: { iy: 0.72333, unt: 0.506, dx: 0.03, hExtra: 0.01, abschnitt: 0.1355 }, abschnitte: [   // abst = Julians gelockertes Spacing (Pergament-Version von Hand)
    { titel: 'Die Klingen', items: NEU[8].map(byId) },
    { titel: 'Die Gegner der Arena', kind: 'gross', cols: 4, items: daten.gegner.filter(g => g.stufe === 8) }] },
  7: { kopf: 'Einheit 7 · Duelle  –  Übersicht der neuen Gegenstände', treppe: {   // Julians Layout: Ausrüstung als „Treppe“ neben/unter den Waffen
      waffen: NEU[7].waffen.map(byId),
      ring: byId(NEU[7].ring), ausruestung: NEU[7].ausruestung.map(byId) },   // Julian 09.11.: Fjordgreifer (Kälte) oben rechts, unten Armband · Ring · Handschuhe
 abschnitte: [
    { titel: 'Waffen', items: daten.gegenstaende.filter(i => i.stufe === 7 && i.slot === 'waffe') },
    { titel: 'Ausrüstung', neueSeite: true, items: [byId('armband-des-feuers'), ...daten.gegenstaende.filter(i => i.stufe === 7 && i.slot !== 'waffe')] }] },
};

async function bauenUebersicht(nr, modus) {
  const cfg = UEBERSICHTEN[nr]; if (!cfg) throw new Error('Übersicht für Einheit ' + nr + ' nicht definiert');
  const PLAIN = modus === 'ohne-hintergrund';
  setSQ(cfg.sq || 0.9, cfg.cols || COLS); setAbst(cfg.abst);
  const pres = new pptxgen();
  pres.defineLayout({ name: 'A4_QUER', width: PW, height: PH });
  pres.layout = 'A4_QUER';
  pres.title = `Übersicht Einheit ${nr} – Powergaming mit Prozenten`;
  const plan = (cfg.gross || cfg.treppe) ? [[]] : seitenPlan(cfg.abschnitte);
  if (plan.length > 1) console.warn('WARNUNG: Übersicht Einheit ' + nr + ' braucht ' + plan.length + ' Seiten');
  plan.forEach(elemente => {
    const slide = pres.addSlide();
    if (!PLAIN) slide.background = { path: A('pergament-a4quer.jpg') };
    slide.addImage({ path: A('rahmen-a4quer.png'), x: 0, y: 0, w: PW, h: PH, altText: 'Rahmen' });
    slide.addText(cfg.kopf, { x: MX, y: 0.4, w: PW - 2 * MX, h: 0.26, fontFace: HEAD, fontSize: 12, bold: true, italic: true, color: INK, align: 'center', margin: 0, isTextBox: true });
    if (cfg.gross) return gegnerGross(pres, slide, cfg.gross, PLAIN);
    if (cfg.treppe) return treppeSeite(pres, slide, cfg.treppe, PLAIN);
    elemente.forEach(e => {
      if (e.art === 'kopf') return ueberschrift(pres, slide, e.text, e.y);
      {
        if (e.kind === 'gross') { const gw = e.w || CW, pic = grossPic(e.alle || e.items, gw, e.h); e.items.forEach((it, c) => gegnerGrossKarte(pres, slide, it, MX + c * (gw + GAP), e.y, gw, e.h, pic, PLAIN)); }
        else e.items.forEach((it, c) => (e.kind === 'gegner' ? gegnerKarte : karte)(pres, slide, it, MX + c * (CW + GAP), e.y, e.h, PLAIN));
      }
    });
  });
  const dir = path.join(ROOT, 'pptx', modus); fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, dateinamen.uebersicht(nr));
  await pres.writeFile({ fileName: out });
  console.log('geschrieben', out, plan.length, 'Seite(n)');
}

async function bauen(stufe, modus) {
  setSQ(0.9, COLS); setAbst();
  const PLAIN = modus === 'ohne-hintergrund';
  const pres = new pptxgen();
  pres.defineLayout({ name: 'A4_QUER', width: PW, height: PH });
  pres.layout = 'A4_QUER';
  pres.title = 'Gegenstandskarten – Powergaming mit Prozenten';
  const gegnerModus = stufe === 'gegner' || String(stufe).startsWith('gegner-');
  const gStufe = gegnerModus && stufe.includes('-') ? Number(stufe.split('-')[1]) : null;
  let items = daten.gegenstaende.slice().sort((a, b) => a.stufe - b.stufe);
  if (gegnerModus) items = daten.gegner.filter(g => !gStufe || g.stufe === gStufe);
  else if (stufe) items = items.filter(i => i.stufe === Number(stufe));
  const abschnitte = gegnerModus ? [{ titel: null, kind: 'gross', items }]
    : ABSCHNITTE.map(([slot, titel]) => ({ titel, items: items.filter(i => i.slot === slot) })).filter(a => a.items.length);
  const plan = seitenPlan(abschnitte, itemLayout);
  const seiten = plan.length;
  plan.forEach((elemente, s) => {
    const slide = pres.addSlide();
    if (!PLAIN) slide.background = { path: A('pergament-a4quer.jpg') };
    slide.addImage({ path: A('rahmen-a4quer.png'), x: 0, y: 0, w: PW, h: PH, altText: 'Rahmen' });
    slide.addText(gegnerModus ? 'Gegnerkarten  ·  Ein Gegner ist besiegt, wenn seine Lebenspunkte 0 oder weniger erreichen' : 'Gegenstandskarten', { x: MX, y: 0.4, w: PW - 2 * MX, h: 0.26, fontFace: HEAD, fontSize: 12, bold: true, italic: true, color: INK, align: 'center', margin: 0, isTextBox: true });
    slide.addText(`Seite ${s + 1} von ${seiten}`, { x: MX, y: PH - 0.56, w: PW - 2 * MX, h: 0.2, fontFace: BODY, fontSize: 8.5, italic: true, color: GREY, align: 'center', margin: 0, isTextBox: true });
    elemente.forEach(e => {
      if (e.art === 'kopf') return ueberschrift(pres, slide, e.text, e.y);
      if (e.kind === 'gross') { const gw = e.w || CW, pic = grossPic(e.alle, gw, e.h); e.items.forEach((it, c) => gegnerGrossKarte(pres, slide, it, MX + c * (gw + GAP), e.y, gw, e.h, pic, PLAIN)); }
      else e.items.forEach((it, c) => karte(pres, slide, it, MX + c * (CW + GAP), e.y, e.h, PLAIN));
    });
  });
  const dir = path.join(ROOT, 'pptx', modus); fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, gegnerModus ? dateinamen.gegnerkarten(gStufe) : dateinamen.gegenstandskarten(stufe));
  await pres.writeFile({ fileName: out });
  console.log('geschrieben', out, items.length, 'Karten,', seiten, 'Seiten');
}
(async () => {
  const arg = process.argv[2], uebersicht = process.argv[2] === 'uebersicht';
  for (const m of ['pergament', 'ohne-hintergrund']) {
    if (uebersicht) await bauenUebersicht(process.argv[3], m); else await bauen(arg, m);
  }
})();
