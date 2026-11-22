/* Baut ein Arbeitsblatt (A4 hoch, Pergamentstil) als .pptx aus einheit-N.json.
 *   node layout/build-arbeitsblatt.js 8            ->  pptx/pergament/8.1_AB_Die_Arena.pptx  UND  pptx/ohne-hintergrund/8.1_AB_Die_Arena.pptx (Namen: layout/dateinamen.js)
 *   node layout/build-arbeitsblatt.js alle         ->  alle Einheiten 1–9 in beiden Varianten
 *   (Variante 'ohne-hintergrund': weißes Blatt, Kästen ohne Füllung – Tabellen bleiben weiß, Rahmen bleibt – z. B. für buntes Papier)
 * Layout-Idee: Textblöcke werden gemessen und von oben nach unten gesetzt; bei Platzmangel Seitenumbruch.
 */
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const ROOT = path.join(__dirname, '..');
const A = n => path.join(__dirname, 'assets', n);
const { iconPfad } = require('./icons.js');
const { KOPF_FEST } = require('./kartentext.js');
const BREITEN = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets', 'cambria-bold-breiten.json'), 'utf8'));
/* Breite eines Textes in Cambria Fett (Zoll) – für Klammern über Formeln */
for (const c of '²³⁹ⁿ') BREITEN[c] = 0.42;   // hochgestellte Zeichen sind schmal (die Schriftdatei hat sie nicht)
const wid = (t, pt) => [...String(t)].reduce((s, c) => s + (BREITEN[c] !== undefined ? BREITEN[c] : 0.55), 0) * pt / 72;

/* ---------- Gestaltung ---------- */
const INK = '2E2114', PAPER = 'FFFDF6', SAND = 'EFE3BE', CREAM = 'F8F1DE', GREY = '6B5B45';
const HEAD = 'Cambria', BODY = 'Calibri';
let MX = 0.5;
const PW = 8.27, PH = 11.69, CW = PW - 2 * MX, TOP = 0.8, BOT = PH - 0.70;

const f = x => String(x);
const fmt = x => (Math.round(x * 100) / 100).toString().replace('.', ',');

/* Textmessung (Calibri ~0,5 em je Zeichen, bewusst großzügig) */
function lines(text, wIn, pt, factor = 0.47) {
  const cpl = Math.max(8, Math.floor(wIn * 72 / (pt * factor)));
  return String(text).split('\n').reduce((n, par) => {
    const words = par.split(/\s+/); let l = 1, cur = 0;
    words.forEach(w => { if (cur + w.length + (cur ? 1 : 0) > cpl) { l++; cur = w.length; } else cur += w.length + (cur ? 1 : 0); });
    return n + l;
  }, 0);
}
const hText = (text, wIn, pt, ls = 1.22, factor = 0.47) => lines(text, wIn, pt, factor) * pt * ls / 72;
const splitTeile = t => String(t).split(/\n|\s(?=[a-e]\)\s)/);   // Absatz bei Zeilenumbruch oder vor „a) “ … „e) “

/* ---------- Seiten-Verwaltung ---------- */
function bauen(e, outFile, modus = 'pergament') {
  const PLAIN = modus === 'ohne-hintergrund';
  const fl = c => ({ color: c });   // Füllungen (Kästen, Labels) bleiben auch ohne Pergament erhalten – nur der Hintergrund entfällt (Julian, 10.11.)
  const pres = new pptxgen();
  pres.defineLayout({ name: 'A4_HOCH', width: PW, height: PH });
  pres.layout = 'A4_HOCH';
  pres.title = `Einheit ${e.einheit}: ${e.titel}`;
  pres.author = 'Prozentrechnung RPG';

  let slide = null, y = 0, seite = 0, loesungsModus = false;

  function neueSeite() {
    slide = pres.addSlide();
    seite++;
    if (!PLAIN) slide.background = { path: A('pergament.jpg') };
    const s1 = seite === 1 && !loesungsModus ? (e.seite1 || {}) : {};            // Handanpassung (Einheit 9): Rahmen und Seitenzahl auf Seite 1 verschoben
    slide.addImage({ path: A('rahmen.png'), x: s1.rahmenDx || 0, y: s1.rahmenDy || 0, w: PW, h: PH, altText: 'Rahmen' });
    y = TOP;
    if (seite === 1 && !loesungsModus) kopfErsteSeite();
    else laufKopf();
    // Seitenzahl
    slide.addText(`${loesungsModus ? 'Lösungen · ' : ''}Einheit ${e.einheit} · Seite ${seite}`, { x: MX + (s1.rahmenDx || 0), y: PH - 0.56 + (s1.fussDy || 0), w: CW, h: 0.22, fontFace: BODY, fontSize: loesungsModus ? 11 : 8.5, italic: true, color: GREY, align: 'center', margin: 0, isTextBox: true });
  }
  let botDy = 0;                                       // Aufgabe-Option botDy: unteren Rand für diese Aufgabe etwas weiter unten ansetzen
  let halb = false;                                   // Halbseiten-Modus (zwei Aufgaben je Blatt): kein automatischer Seitenumbruch
  const sicher = h => { if (!halb && y + h > BOT + botDy + (seite === 1 && !loesungsModus ? (e.seite1 || {}).botDy || 0 : 0)) neueSeite(); };   // Seite 1: unterer Rand folgt der verschobenen Seitenzahl

  function kopfErsteSeite() {
    const bh = CW * 130 / 700;
    slide.addImage({ path: A('banner.png'), x: MX, y: y, w: CW, h: bh });
    slide.addText(`EINHEIT ${e.einheit}`, { x: MX, y: y + 0.3, w: CW, h: 0.25, fontFace: HEAD, fontSize: 10.5, bold: true, color: CREAM, align: 'center', charSpacing: 6, margin: 0, isTextBox: true });
    slide.addText(e.titel, { x: MX, y: y + 0.56, w: CW, h: 0.55, fontFace: HEAD, fontSize: 27, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    y += bh + 0.08;
    slide.addText(e.untertitel, { x: MX, y, w: CW, h: 0.3, fontFace: HEAD, fontSize: 12.5, italic: true, color: INK, align: 'center', margin: 0, isTextBox: true });
    y += 0.3;
    slide.addText([{ text: 'Name: ', options: { bold: true } }, { text: '______________________________      ' }, { text: 'Klasse: ', options: { bold: true } }, { text: '________      ' }, { text: 'Datum: ', options: { bold: true } }, { text: '____________' }],
      { x: MX, y, w: CW, h: 0.25, fontFace: BODY, fontSize: 10, color: INK, align: 'center', margin: 0, isTextBox: true });
    y += 0.46;
  }
  function laufKopf() {
    slide.addText(loesungsModus ? `Lösungen für die Lehrkraft · Einheit ${e.einheit}: ${e.titel}` : `Einheit ${e.einheit}: ${e.titel}`, { x: MX, y: y - 0.05, w: CW, h: 0.25, fontFace: HEAD, fontSize: loesungsModus ? 11 : 10.5, italic: true, bold: true, color: INK, align: 'center', margin: 0, isTextBox: true });
    slide.addImage({ path: A('trenner.png'), x: MX + 1.0, y: y + 0.2, w: CW - 2.0, h: (CW - 2.0) * 40 / 600 });
    y += 0.5;
  }

  /* ---------- Bausteine ---------- */
  function abschnitt(text, opts = {}) {
    sicher(0.7);
    slide.addImage({ path: A('raute.png'), x: MX, y: y + 0.04, w: 0.2, h: 0.2 });
    slide.addText(text, { x: MX + 0.3, y, w: CW - 0.3, h: 0.28, fontFace: HEAD, fontSize: opts.pt || 14, bold: true, color: INK, margin: 0, valign: 'middle', isTextBox: true });
    if (opts.heft) slide.addText('(Heft)', { x: MX + 0.3 + text.length * 0.0855, y: y + 0.04, w: 0.524, h: 0.2, fontFace: BODY, fontSize: 13, color: INK, margin: 0, valign: 'top', isTextBox: true });   // Hinweis „Bearbeitung im Heft“
    y += loesungsModus ? 0.3 : 0.36;
  }
  /* {{Name}} -> fett + kursiv (Gegenstandsnamen); liefert Textabschnitte bzw. den reinen Text */
  const ohneBI = t => String(t).replace(/\{\{(.+?)\}\}/g, '$1');
  const biRuns = (t, opt = {}) => String(t).split(/\{\{(.+?)\}\}/).map((p, i) => ({ text: p, options: i % 2 ? { ...opt, bold: true, italic: true } : { ...opt } })).filter(r => r.text);
  function absatz(text0, o = {}) {
    if (o.block) return absatzBlock(text0, o);
    const text = String(text0).includes('{{') ? biRuns(text0, o.italic ? { italic: true } : {}) : text0, plain = ohneBI(text0);
    const w = o.w || CW, pt = o.pt || 11, lsm = o.lsm || 1, h = (o.zeilen ? o.zeilen * pt * 1.22 / 72 : hText(plain, w, pt, 1.22, o.faktor)) * lsm + 0.02;
    sicher(h);
    const y0 = y;
    slide.addText(text, { x: o.x || MX, y, w, h, fontFace: o.face || BODY, fontSize: pt, color: INK, italic: o.italic, bold: o.bold, margin: 0, valign: 'top', isTextBox: true, paraSpaceAfter: 0, ...(o.lsm ? { lineSpacingMultiple: o.lsm } : {}) });
    y += h + (o.gap === undefined ? 0.07 : o.gap);
    return y0;
  }
  /* Textblock aus mehreren Absätzen in einer Textbox (Julian 10.11., Einheit 2): „- “ = Aufzählung mit Strich (hängender Einzug), „~ “ = zentriert mit 6 pt Abstand davor/danach */
  function absatzBlock(text0, o = {}) {
    const pt = o.pt || 11, zl = String(text0).split('\n'), runs = [];
    zl.forEach((l, i) => {
      const bul = l.startsWith('- '), mitte = l.startsWith('~ '), t = bul || mitte ? l.slice(2) : l;
      biRuns(t, mitte ? { italic: false } : {}).forEach((r, j, ar) => runs.push({ text: r.text, options: { ...r.options, ...(j === 0 ? (bul ? { bullet: { characterCode: '002D', indent: 13.5 } } : mitte ? { align: 'center', paraSpaceBefore: 6, paraSpaceAfter: 6 } : (o.sp6 || o.spPt ? { paraSpaceBefore: o.spPt || 6, paraSpaceAfter: o.spPt || 6 } : {})) : {}), breakLine: j === ar.length - 1 && i < zl.length - 1 } }));
    });
    const h = o.zeilen * pt * 1.22 / 72 + (o.hExtra || 0) + 0.02;
    sicher(h);
    const y0 = y;
    slide.addText(runs, { x: o.x || MX, y, w: o.w || CW, h, fontFace: BODY, fontSize: pt, color: INK, italic: o.italic, margin: 0, valign: 'top', isTextBox: true });
    y += h + (o.gap === undefined ? 0.07 : o.gap);
    return y0;
  }
  /* **fett** in Tabellenzellen -> Textabschnitte */
  const fett = t => t.includes('**') ? t.split('**').map((p, i) => ({ text: p, options: i % 2 ? { bold: true } : {} })).filter(r => r.text) : t;
  function tabelleBauen(tb, o = {}) {
    const n = tb.kopf.length;
    const gew = tb.gew || tb.kopf.map((k, i) => Math.max(loesungsModus ? 6 : 4, Math.min(22, Math.max(k.length * 0.8, Math.max(...k.split(' ').map(w => w.length)) * 1.2, ...tb.zeilen.map(z => String(z[i]).length)))));
    const sum = gew.reduce((a, b) => a + b, 0), W = tb.w || o.w || CW;   // tb.w / tb.x: schmalere, zentrierte Tabelle (Julian 10.11., Einheit 6)
    const colW = gew.map(g => W * g / sum);
    const leer = tb.zeilen.some(z => z.some(c => c === ''));
    const L = loesungsModus, fs_ = L ? 11 : (o.pt || tb.pt || (n >= 6 ? 9 : 10));
    // Kopfzeilenhöhe nach längstem Kopfwort
    const kopfLines = Math.max(...tb.kopf.map((k, i) => lines(k, colW[i] - 0.1, fs_ + 0.5, 0.52)));
    const hKopf = tb.kopfH || Math.max(L ? 0.32 : 0.28, kopfLines * (fs_ + 0.5) * 1.2 / 72 + 0.1);
    const rowH = tb.rowH || o.rowH || (leer ? 0.31 : (tb.zeilen.length > 8 ? 0.225 : 0.255));
    const capH = tb.titel ? 0.27 : 0;
    const rows = [tb.kopf.map(k => ({ text: k, options: { bold: true, color: CREAM, fill: { color: INK }, align: 'center', fontFace: HEAD } }))];
    tb.zeilen.forEach(z => rows.push(z.map((c, i) => ({ text: String(c), options: { align: i === 0 || String(c).length > 14 ? 'left' : 'center', fill: { color: 'FFFFFF' }, bold: i === 0 && n < 6 } }))));
    const zH = L ? tb.zeilen.map(z => Math.max(0.29, Math.max(...z.map((c, i) => lines(String(c), colW[i] - 0.16, 11, 0.5))) * 11 * 1.22 / 72 + 0.09))   : (tb.zeilenH || tb.zeilen.map(() => rowH));
    const H = hKopf + zH.reduce((q, r) => q + r, 0);
    if (tb.vorGap) y += tb.vorGap;
    sicher(H + capH + (tb.randFrei ? 0 : 0.1));
    if (tb.titel) { slide.addText(tb.titel, { x: MX, y, w: CW, h: 0.24, fontFace: HEAD, fontSize: L ? 11 : 10.5, bold: true, italic: true, color: INK, margin: 0, valign: 'middle', isTextBox: true }); y += capH; }
    slide.addTable(rows, { x: tb.x || o.x || MX, y, w: W, colW, rowH: [hKopf, ...zH], border: { type: 'solid', pt: 1, color: INK }, fontFace: BODY, fontSize: fs_, color: INK, valign: 'middle', margin: [0, 0.07, 0, 0.07] });
    y += H + (tb.nachGap === undefined ? 0.14 : tb.nachGap);
  }
  function kartenReihe(karten, o = {}) {
    // zwei Karten pro Reihe; links quadratischer Bildplatzhalter (optional: erste Karte allein in der Reihe)
    const cw = o.breit ? CW : (CW - 0.2) / 2;           // breit: eine Karte über die ganze Breite (große Einzelkarte, z. B. Helm des Nachhalls)
    const reihen = [];
    let rest = karten.slice();
    if (o.ersteAllein) reihen.push(rest.shift());
    const nProReihe = o.breit ? 1 : 2;
    for (let i = 0; i < rest.length; i += nProReihe) reihen.push(rest.slice(i, i + nProReihe));
    for (const paar0 of reihen) {
      const paar = [].concat(paar0);
      const zl = k => [...(k.lp !== undefined ? ['LP: ' + k.lp] : []), ...(k.zeilen || []), ...(k.modifikatoren ? ('Modifikator: ' + k.modifikatoren).replace(' (Min', '\n(Min').split('\n') : []), ...(k.eigenschaften || [])];   // Zeilenumbruch vor „(Min · Mittel · Max)“ (Julians Anpassung)
      const sq = o.ohneBild ? 0 : o.breit ? 1.1 : (o.kompakt ? 0.78 : 0.86), minH = o.ohneBild ? 0.7 : o.breit ? 1.4 : (o.kompakt ? 1.0 : 1.14), zh = o.breit ? 0.19 : (o.kompakt ? 0.15 : 0.17), gap = o.kompakt ? 0.08 : 0.12;
      const kopfH = o.breit ? 0.5 : o.ohneBild ? 0.36 : 0.4, fz = o.breit ? 11 : 9;   // kompakt: kleineres Bild, enger gesetzt
      const gb = o.ohneBild ? -0.12 : 0;   // ohne Bild: Text beginnt am linken Rand der Karte
      const tw0 = cw - sq - 0.38 - gb;
      const nZ = k => zl(k).reduce((s, t) => s + lines(t, tw0, o.breit ? 11 : 9.5, 0.52), 0);
      const hs = paar.map(k => o.ohneBild ? kopfH + nZ(k) * 0.168 + 0.1 : Math.max(minH, (o.breit ? 0.62 : 0.46) + Math.max(k.schaden.length ? k.schaden.length + 1 : 0, 0) * 0.19 + 0.08 + nZ(k) * zh));
      const H = o.hFix || Math.max(...hs);
      sicher(o.kompakt ? H : H + gap);
      paar.forEach((k, j) => {
        const x = MX + j * (cw + 0.2);
        slide.addShape(pres.ShapeType.rect, { x, y, w: cw, h: H, fill: fl(PAPER), line: { color: INK, width: 1.75 } });
        slide.addShape(pres.ShapeType.rect, { x: x + 0.05, y: y + 0.05, w: cw - 0.1, h: H - 0.1, fill: { type: 'none' }, line: { color: INK, width: 0.5 } });
        const ico = o.ohneBild ? null : iconPfad(k.id);
        if (o.ohneBild) { /* kein Bild */ } else if (ico) {
          slide.addImage({ path: ico, x: x + 0.14, y: y + 0.14, w: sq, h: sq, altText: k.name });
          slide.addShape(pres.ShapeType.rect, { x: x + 0.14, y: y + 0.14, w: sq, h: sq, fill: { type: 'none' }, line: { color: INK, width: 1 } });
        } else {
          slide.addShape(pres.ShapeType.rect, { x: x + 0.14, y: y + 0.14, w: sq, h: sq, fill: { color: 'FFFFFF' }, line: { color: INK, width: 1, dashType: 'dash' } });
          slide.addText('Bild', { x: x + 0.14, y: y + 0.14, w: sq, h: sq, fontFace: BODY, fontSize: 8, italic: true, color: GREY, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
        }
        const tx = x + 0.14 + sq + 0.12 + gb, tw = cw - sq - 0.38 - gb;
        slide.addText([{ text: k.name, options: { bold: true, fontFace: HEAD, fontSize: o.breit ? 16 : 11 } }, { text: `  ${k.typ}`, options: { italic: true, fontSize: o.breit ? 11 : 8.5, color: GREY } }],
          { x: tx, y: y + 0.1, w: tw, h: o.breit ? 0.36 : 0.25, margin: 0, color: INK, fontFace: BODY, isTextBox: true, valign: 'middle' });
        if (k.schaden.length) {
          const kopf = t => ({ text: t, options: { bold: true, fill: { color: SAND }, align: 'center' } });
          let rws, colW;
          if (k.fest) {              // fester Angriffswert: eine Zelle statt drei
            rws = [[kopf('Schadensart'), kopf(KOPF_FEST)]];
            k.schaden.forEach(s => rws.push([{ text: s.quelle, options: { align: 'left' } }, { text: fmt(s.mittel), options: { align: 'center' } }]));
            colW = [tw * 0.45, tw * 0.55];
          } else {
            rws = [['Schadensart', 'Min', 'Mittel', 'Max'].map(kopf)];
            k.schaden.forEach(s => rws.push([{ text: s.quelle, options: { align: 'left' } }, ...[s.min, s.mittel, s.max].map(v => ({ text: fmt(v), options: { align: 'center' } }))]));
            colW = [tw * 0.34, tw * 0.22, tw * 0.22, tw * 0.22];
          }
          slide.addTable(rws, { x: tx, y: y + kopfH, w: tw, colW, rowH: 0.19, border: { type: 'solid', pt: 0.75, color: INK }, fontFace: BODY, fontSize: 8.5, color: INK, valign: 'middle', margin: [0, 0.04, 0, 0.04] });
        }
        const zz = zl(k);
        if (zz.length) slide.addText(zz.map((t, i) => ({ text: t, options: { breakLine: i < zz.length - 1, ...(i >= zz.length - (k.zeilenGrau || 0) ? { color: GREY } : { bold: true }) } }))   /* zeilenGrau: letzte n Zeilen grau, nicht fett (Beschreibung) */, { x: tx, y: y + kopfH + (k.schaden.length ? (k.schaden.length + 1) * 0.19 + 0.07 : 0), w: tw, h: nZ(k) * zh + 0.04, paraSpaceAfter: 2, fontFace: BODY, fontSize: fz, color: INK, margin: 0, valign: 'top', isTextBox: true });
      });
      y += H + gap;
    }
  }

  /* Kasten mit Titel, Inhalt wird per Callback in zwei Phasen (Messen/Setzen) abgelegt */
  function kasten(titel, inhalt, o = {}) {
    // inhalt: Array von {h, zeichne(x,y,w)}
    const pad = 0.13, kopfH = titel ? (o.kopfH || 0.36) : 0;
    const H = pad + kopfH + inhalt.reduce((s, b) => s + b.h, 0) + pad - 0.02;
    if (process.env.DEBUG) console.log('kasten', titel, 'y', y.toFixed(2), 'H', H.toFixed(2), 'BOT', BOT.toFixed(2));
    sicher(H + 0.1);
    const fill = fl(o.fill || PAPER);
    slide.addShape(pres.ShapeType.rect, { x: MX, y, w: CW, h: H, fill, line: { color: INK, width: o.dash ? 1.5 : 2.25, dashType: o.dash ? 'dash' : 'solid' } });
    if (!o.dash) slide.addShape(pres.ShapeType.rect, { x: MX + 0.06, y: y + 0.06, w: CW - 0.12, h: H - 0.12, fill: { type: 'none' }, line: { color: INK, width: 0.6 } });
    let cy = y + pad;
    if (titel) {
      if (!o.ohneIcon) slide.addImage({ path: A('raute.png'), x: MX + pad, y: cy + 0.05, w: 0.2, h: 0.2 });
      const ti = o.ohneIcon ? 0 : 0.3;   // ohneIcon: Titel ohne Raute (Julian, Einheit 1)
      slide.addText(titel, { x: MX + pad + ti, y: cy, w: CW - 2 * pad - ti, h: 0.3, fontFace: HEAD, fontSize: 13, bold: true, color: INK, margin: 0, valign: 'middle', isTextBox: true });
      cy += kopfH;
    }
    inhalt.forEach(b => { b.zeichne(MX + pad, cy, CW - 2 * pad); cy += b.h; });
    y += H + 0.12;
  }
  const blH = (text, wIn, o) => (o.zeilen ? o.zeilen * (o.pt || 11) * 1.22 / 72 : hText(text, wIn, o.pt || 11, 1.22, o.faktor)) * (o.lsm || 1);
  const blText = (text, o = {}) => ({
    h: blH(text, CW - 0.32, o) + (o.gap === undefined ? 0.07 : o.gap),
    zeichne: (x, yy, w) => slide.addText(text, { x, y: yy, w, h: blH(text, w, o) + 0.02, fontFace: o.face || BODY, fontSize: o.pt || 11, italic: o.italic, bold: o.bold, color: INK, margin: 0, valign: 'top', isTextBox: true, ...(o.lsm ? { lineSpacingMultiple: o.lsm } : {}) })
  });

  /* Kasten mit nummerierten Kurzregeln */
  function kurzKasten(k) {
    kasten(k.titel, [...k.punkte.map((t, i) => {
      if (!Array.isArray(t)) return blText(`${i + 1}.  ${t}`, { pt: k.pt || 10.5, gap: 0.05, faktor: 0.42 });   // k.pt: Julian 10.11. (Einheit 3: 11 pt)
      /* mehrzeiliger Punkt: erste Zeile nummeriert, weitere Zeilen als eigene Absätze (Julian, Einheit 1) */
      if ((k.nummerAuto || []).includes(i)) {   // Julian 10.11.: erste Zeile automatisch nummeriert (hängender Einzug 0,25 Zoll), weitere Zeilen ohne Nummer
        const hsA = t.map((x, j) => hText(x, CW - 0.32 - (j === 0 ? 0.25 : 0), 10.5, 1.22, 0.42)), hA = hsA.reduce((a, b) => a + b, 0);
        return { h: hA + 0.11 + (k.autoPlus || 0), zeichne: (x, yy, w) => slide.addText(t.map((x2, j) => ({ text: x2, options: { breakLine: j < t.length - 1, ...(j === 0 ? { bullet: { type: 'number', numberStartAt: i + 1, indent: 18 } } : {}) } })), { x, y: yy, w, h: hA + 0.02 + (k.autoPlus || 0), fontFace: BODY, fontSize: 10.5, color: INK, margin: 0, valign: 'top', isTextBox: true }) };
      }
      const zl = t.map((x, j) => j === 0 ? `${i + 1}.  ${x}` : x);
      const hs = zl.map(x => hText(x, CW - 0.32, 10.5, 1.22, 0.42));
      return { h: hs.reduce((a, b) => a + b, 0) + 0.11, zeichne: (x, yy, w) => slide.addText(zl.map((x2, j) => ({ text: x2, options: { breakLine: j < zl.length - 1 } })), { x, y: yy, w, h: hs.reduce((a, b) => a + b, 0) + 0.02, fontFace: BODY, fontSize: 10.5, color: INK, margin: 0, valign: 'top', isTextBox: true }) };
    }), ...(k.hExtra ? [{ h: k.hExtra, zeichne: () => {} }] : [])], { fill: 'F3E9C9' });
  }
  /* Linierte Schreibfläche */
  function notizenBox(n) {
    const lh = 0.3, kopf = n.titel ? 0.3 : 0.04, H = 0.1 + kopf + n.zeilen * lh + 0.04;
    sicher(H + 0.1);
    slide.addShape(pres.ShapeType.rect, { x: MX, y, w: CW, h: H, fill: fl(PAPER), line: { color: INK, width: 1.25, dashType: 'dash' } });
    let cy = y + 0.1;
    if (n.titel) { slide.addText(n.titel, { x: MX + 0.13, y: cy, w: CW - 0.26, h: 0.24, fontFace: HEAD, fontSize: 10.5, bold: true, italic: true, color: INK, margin: 0, valign: 'middle', isTextBox: true }); cy += kopf; } else cy += kopf;
    for (let i = 0; i < n.zeilen; i++) {
      slide.addShape(pres.ShapeType.line, { x: MX + 0.13, y: cy + lh - 0.04, w: CW - 0.26, h: 0, line: { color: GREY, width: 0.6 } });
      cy += lh;
    }
    y += H + 0.12;
  }
  /* Build-Vorlage: Slots (Waffe / Rüstung / Zaubergegenstand) + Rechentabelle je Schadensart */
  function buildBox(sp) {
    const voll = sp.modus === 'voll', w = sp.werte, L = loesungsModus, K = !!sp.klein;   // K: kleine Schrift (Einheit 3: Beschriftung 8,5 / Namen 9,5 / Tabelle 8,5 und 9 pt)   // Lösungsseiten: alle Schrift 11 pt (Julian, 10.11.)
    const slots = [['Waffe', 'waffe'], ...(sp.ruestung === false ? [] : [['Rüstung', 'ruestung']]), ['Zaubergegenstand', 'zauber']];
    const Wd = CW - 0.26, n = (sp.vorgabe || sp.quellen).length;
    const bo = !!sp.bonus;   // Einheit 1: Spalte „Bonus“ statt „Faktor“; im Modus „voll“ mit Min/Mittel/Max, alle Zahlenspalten gleich breit
    const prop = voll ? (bo ? [1.0, ...Array(3).fill(0.5567), 1.0, ...Array(6).fill(0.5567)] : [1.15, 0.6, 0.7, 0.6, 1.45, 0.8, 0.65, 0.75, 0.65]) : [1.3, 1.5, 2.1, 1.0, 1.4];
    const ps = prop.reduce((a, b) => a + b, 0), colW = prop.map(q => q * Wd / ps);
    const hKopf = voll ? (L ? [0.3, 0.3] : [0.25, 0.25]) : [L ? 0.5 : 0.4], rowH = L ? 0.29 : w ? 0.25 : 0.29, hGes = L ? 0.3 : 0.29;
    const hT = hKopf.reduce((a, b) => a + b, 0) + n * rowH + hGes;
    const langBes = !!sp.besonderheitenText && sp.besonderheitenText.length > 78;
    const hBes = sp.besonderheiten ? (langBes ? 0.52 : 0.36) : 0;
    const titel = sp.ohneTitel ? null : (/Build|^Set|^Musterl/.test(sp.titel) ? sp.titel : 'Build: ' + sp.titel);
    const hd = (t, o = {}) => ({ text: t, options: { bold: true, color: CREAM, fill: { color: INK }, align: 'center', fontFace: HEAD, fontSize: L ? 11 : K ? 8.5 : 9, ...o } });   // Julian 10.11.: Tabellenkopf 9 pt, Zellen 10 pt, Beschriftungen 9 pt, Namen 10 pt
    const c = (t, o = {}) => ({ text: String(t), options: { align: 'center', fill: { color: 'FFFFFF' }, ...o } });
    const inh = [
      { h: 0.54, zeichne: (x, yy, wd) => {
        const gap = 0.12, sw = (wd - gap * (slots.length - 1)) / slots.length;
        slots.forEach(([lab, key], i) => {
          const sx = x + i * (sw + gap);
          slide.addText(lab, { x: sx, y: yy, w: sw, h: 0.18, fontFace: BODY, fontSize: L ? 11 : K ? 8.5 : 9, italic: true, color: GREY, margin: 0, valign: 'middle', isTextBox: true });
          slide.addShape(pres.ShapeType.rect, { x: sx, y: yy + 0.2, w: sw, h: 0.3, fill: { color: 'FFFFFF' }, line: { color: INK, width: 0.9 } });
          const v = (sp.slots || {})[key];
          if (v) slide.addText(v, { x: sx + 0.05, y: yy + 0.2, w: sw - 0.1, h: 0.3, fontFace: BODY, fontSize: L ? 11 : K ? 9.5 : 10, bold: true, color: INK, margin: 0, valign: 'middle', align: 'center', fit: 'shrink', isTextBox: true });
        });
      } },
      { h: hT + (sp.dicht ? 0 : 0.08), zeichne: (x, yy, wd) => {
        const rows = [];
        if (voll) {
          rows.push([hd('Schadensart', { rowspan: 2 }), hd('Grundschaden', { colspan: 3 }), hd('Modifikatoren (Summe)', { rowspan: 2 }), ...(bo ? [hd('Bonus', { colspan: 3 })] : [hd('Faktor', { rowspan: 2 })]), hd('Schaden', { colspan: 3 })]);
          rows.push((bo ? ['Min', 'Mittel', 'Max', 'Min', 'Mittel', 'Max', 'Min', 'Mittel', 'Max'] : ['Min', 'Mittel', 'Max', 'Min', 'Mittel', 'Max']).map(t => hd(t, { fontFace: BODY })));
        } else rows.push(['Schadensart', 'Grundschaden (Ø)', 'Modifikatoren (Summe)', bo ? 'Bonus' : 'Faktor', sp.schadenKopf || 'Schaden (Ø)'].map(t => hd(t)));
        if (sp.vorgabe) sp.vorgabe.forEach(r => rows.push([c(r[0], { align: 'left', bold: true }), c(r[1]), c(r[2]), c(r[3]), c(r[4] || '')]));   // vorausgefülltes Beispiel
        else sp.quellen.forEach(q => {
          const z = w && w.zeilen[q];
          const base = z ? (voll ? z.basis : [z.basis[1]]) : (voll ? ['', '', ''] : ['']);
          const sch = z ? (voll ? z.schaden : [z.schaden[1]]) : (voll ? ['', '', ''] : ['']);
          const bon = z ? (voll ? z.bonus : [z.bonus[1]]) : (voll ? ['', '', ''] : ['']);
          rows.push([c(q, { align: 'left', bold: true }), ...base.map(v => c(v)), c(z ? z.mods : ''), ...(bo ? bon.map(v => c(v)) : [c(z ? z.faktor : '')]), ...sch.map(v => c(v))]);
        });
        const ges = w ? (voll ? w.gesamt : [w.gesamt[1]]) : (voll ? ['', '', ''] : ['']);
        const gf = { fill: { color: SAND }, bold: true };
        rows.push([{ text: voll ? 'Gesamtschaden' : 'Gesamtschaden (Ø)', options: { colspan: voll ? (bo ? 8 : 6) : 4, align: 'right', ...gf } }, ...ges.map(v => c(v, gf))]);
        slide.addTable(rows, { x, y: yy, w: wd, colW, rowH: [...hKopf, ...(sp.vorgabe || sp.quellen).map(() => rowH), hGes], border: { type: 'solid', pt: 0.9, color: INK }, fontFace: BODY, fontSize: L ? 11 : K ? 9 : 10, color: INK, valign: 'middle', margin: [0, 0.03, 0, 0.03] });
      } }
    ];
    if (hBes) inh.push({ h: hBes, zeichne: (x, yy, wd) => {
      const bh = hBes - 0.1;
      slide.addText('Besonderheiten:', { x, y: yy + 0.04, w: 1.15, h: bh, fontFace: BODY, fontSize: L ? 11 : 9.5, bold: true, italic: true, color: INK, margin: 0, valign: 'bottom', isTextBox: true });
      if (sp.besonderheitenText) slide.addText(sp.besonderheitenText, { x: x + 1.2, y: yy + 0.04, w: wd - 1.2, h: bh, fontFace: BODY, fontSize: L ? 11 : 9, color: INK, margin: 0, valign: 'bottom', isTextBox: true });
      slide.addShape(pres.ShapeType.line, { x: x + 1.2, y: yy + 0.04 + bh, w: wd - 1.2, h: 0, line: { color: GREY, width: 0.6 } });
    } });
    kasten(titel, inh, { ...(sp.dicht ? { kopfH: 0.29 } : {}), ohneIcon: sp.ohneIcon });
  }

  /* Leere Set-Vorlage (Einheit 3, Seite 2): links drei Slots, rechts Tabelle Schadensart × Schaden (Min/Mittel/Max), unten „Besonderheiten“ */
  function setBox(titel) {
    const quellen = ['FEUER', 'EIS', 'BLITZ', 'PHYSISCH', 'CHAOS'];
    const slots = ['Waffe', 'Rüstung', 'Zaubergegenstand'];
    const hd = (t, o = {}) => ({ text: t, options: { bold: true, color: CREAM, fill: { color: INK }, align: 'center', fontFace: HEAD, fontSize: 8.5, ...o } });
    const c = (t, o = {}) => ({ text: t, options: { align: 'center', fill: { color: 'FFFFFF' }, ...o } });
    kasten(null, [{ h: 2.46, zeichne: (x, yy, wd) => {
      slide.addImage({ path: A('raute.png'), x: x + 0.07, y: yy + 0.04, w: 0.2, h: 0.2 });
      slide.addText(titel, { x: x + 0.37, y: yy - 0.01, w: wd - 0.37, h: 0.3, fontFace: HEAD, fontSize: 13, bold: true, color: INK, margin: 0, valign: 'middle', isTextBox: true });
      slots.forEach((lab, i) => {
        const sy = yy + 0.37 + i * 0.57;
        slide.addText(lab, { x: x + 0.14, y: sy, w: 2.37, h: 0.18, fontFace: BODY, fontSize: 8.5, italic: true, color: GREY, margin: 0, valign: 'middle', isTextBox: true });
        slide.addShape(pres.ShapeType.rect, { x: x + 0.14, y: sy + 0.2, w: 2.79, h: 0.3, fill: { color: 'FFFFFF' }, line: { color: INK, width: 0.9 } });
      });
      const rows = [[hd('Schadensart', { rowspan: 2 }), hd('Schaden', { colspan: 3 })], ['Min', 'Mittel', 'Max'].map(t => hd(t, { fontFace: BODY })),
        ...quellen.map(q => [c(q, { align: 'left', bold: true }), c(''), c(''), c('')])];
      slide.addTable(rows, { x: x + 3.24, y: yy + 0.06, w: 3.6, colW: [1.18, 0.807, 0.807, 0.806], rowH: [0.25, 0.25, ...quellen.map(() => 0.289)], border: { type: 'solid', pt: 0.9, color: INK }, fontFace: BODY, fontSize: 9, color: INK, valign: 'middle', margin: [0, 0.04, 0, 0.04] });
      slide.addText('Besonderheiten:', { x: x + 0.14, y: yy + 2.15, w: 1.15, h: 0.26, fontFace: BODY, fontSize: 9.5, bold: true, italic: true, color: INK, margin: 0, valign: 'bottom', isTextBox: true });
      slide.addShape(pres.ShapeType.line, { x: x + 1.07, y: yy + 2.41, w: wd - 1.2, h: 0, line: { color: GREY, width: 0.6 } });
    } }], { });
  }
  /* Kampfprotokolle (Einheit 3, Seite 4): sechs kleine Kästen, 2 × 3 */
  function protokollGitter(anzahl) {
    const bw = (CW - 0.4) / 2, bh = 2.46, pitch = bh + 0.35;
    const hd = t => ({ text: t, options: { bold: true, color: CREAM, fill: { color: INK }, align: 'center', fontFace: HEAD } });
    const cell = t => ({ text: t, options: { align: 'center', fill: { color: 'FFFFFF' } } });
    for (let i = 0; i < anzahl; i++) {
      const sp = i % 2, zl = Math.floor(i / 2);
      if (sp === 0) sicher(pitch);
      const x = MX + sp * (bw + 0.4), y0 = y + (sp === 0 ? 0 : 0);
      if (sp === 0) { /* y bleibt für die zweite Spalte erhalten */ }
      slide.addShape(pres.ShapeType.rect, { x, y: y0, w: bw, h: bh, fill: fl(PAPER), line: { color: INK, width: 2.25 } });
      slide.addShape(pres.ShapeType.rect, { x: x + 0.06, y: y0 + 0.06, w: bw - 0.12, h: bh - 0.12, fill: { type: 'none' }, line: { color: INK, width: 0.6 } });
      slide.addImage({ path: A('raute.png'), x: x + 0.13, y: y0 + 0.18, w: 0.2, h: 0.2 });
      slide.addText(`Kampfprotokoll ${i + 1}`, { x: x + 0.43, y: y0 + 0.13, w: bw - 0.83, h: 0.3, fontFace: HEAD, fontSize: 13, bold: true, color: INK, margin: 0, valign: 'middle', isTextBox: true });
      slide.addText([{ text: 'Monster: ', options: { bold: true } }, { text: '_____________________________' }], { x: x + 0.13, y: y0 + 0.44, w: bw - 0.53, h: 0.28, fontFace: BODY, fontSize: 10, color: INK, margin: 0, valign: 'middle', isTextBox: true });
      slide.addText([{ text: 'Set:  ', options: { bold: true } }, { text: 'A  /  B' }], { x: x + 0.13, y: y0 + 0.70, w: bw - 0.53, h: 0.28, fontFace: BODY, fontSize: 10, color: INK, margin: 0, valign: 'middle', isTextBox: true });
      const tw = bw - 0.26, rows = [['Runde', 'Wurf (W6)', 'Schaden', 'LP danach'].map(hd), ...[1, 2, 3].map(r => [cell(String(r)), cell(''), cell(''), cell('')])];
      slide.addTable(rows, { x: x + 0.15, y: y0 + 1.03, w: tw, colW: [0.62, 0.79, 0.88, 0.88].map(q => q * tw / 3.17), rowH: [0.348, 0.313, 0.313, 0.313], border: { type: 'solid', pt: 0.9, color: INK }, fontFace: BODY, fontSize: 10, color: INK, valign: 'middle', margin: [0, 0.05, 0, 0.05] });
      if (sp === 1 || i === anzahl - 1) y += pitch;
    }
  }
  /* Duellprotokoll (Held würfelt, Monster notiert die LP) */
  function protokollBox(nr) {
    const rowH = 0.3, hK = 0.3;
    const inh = [
      { h: 0.34, zeichne: (x, yy, wd) => slide.addText([{ text: 'Held: ', options: { bold: true } }, { text: '_______________________   ' }, { text: 'Monster: ', options: { bold: true } }, { text: '_____________________________   ' }, { text: 'LP: ', options: { bold: true } }, { text: '________' }],
        { x, y: yy, w: wd, h: 0.28, fontFace: BODY, fontSize: 10.5, color: INK, margin: 0, valign: 'middle', isTextBox: true }) },
      { h: 0.34, zeichne: (x, yy, wd) => slide.addText([{ text: 'Set: ', options: { bold: true } }, { text: 'A  /  B' }, { text: '          Vorhersage: ', options: { bold: true } }, { text: 'Pech  /  Durchschnitt  /  Glück  /  schaffe ich nicht' }],
        { x, y: yy, w: wd, h: 0.28, fontFace: BODY, fontSize: 10.5, color: INK, margin: 0, valign: 'middle', isTextBox: true }) },
      { h: hK + 3 * rowH + 0.1, zeichne: (x, yy, wd) => {
        const hd = t => ({ text: t, options: { bold: true, color: CREAM, fill: { color: INK }, align: 'center', fontFace: HEAD } });
        const cell = t => ({ text: t, options: { align: 'center', fill: { color: 'FFFFFF' } } });
        const rows = [['Runde', 'Wurf (W6)', 'Min / Mittel / Max', 'Schaden', 'LP danach'].map(hd), ...[1, 2, 3].map(r => [cell(String(r)), cell(''), cell(''), cell(''), cell('')])];
        slide.addTable(rows, { x, y: yy, w: wd, colW: [0.14, 0.18, 0.28, 0.2, 0.2].map(q => q * wd), rowH: [hK, ...[1, 2, 3].map(() => rowH)], border: { type: 'solid', pt: 0.9, color: INK }, fontFace: BODY, fontSize: 10, color: INK, valign: 'middle', margin: [0, 0.05, 0, 0.05] });
      } },
      { h: 0.34, zeichne: (x, yy, wd) => slide.addText([{ text: 'Ergebnis: ', options: { bold: true } }, { text: 'Monster besiegt?  ja  /  nein' }, { text: '          Vorhersage richtig?  ja  /  nein' }],
        { x, y: yy, w: wd, h: 0.28, fontFace: BODY, fontSize: 10.5, color: INK, margin: 0, valign: 'middle', isTextBox: true }) }
    ];
    kasten(`Duellprotokoll ${nr}`, inh);
  }

  /* ---------- Inhalt ---------- */
  neueSeite();
  if (e.einstieg) { y += (e.dy || {}).einstieg || 0; absatz([].concat(e.einstieg).join('\n'), { italic: true, pt: 11, gap: 0.14 }); }   // Array = mehrere Absätze
  if (e.karten) kartenReihe(e.karten, { breit: e.kartenBreit, hFix: e.kartenH });      // Karten direkt unter dem Einstieg (Einheit 9: Helm des Nachhalls)
  if (e.karten) y += (e.abstaende || {}).nachKarte || 0;
  if (e.kurzregeln) { y += (e.dy || {}).kurz || 0; kurzKasten(e.kurzregeln); }
  if (e.kurzregeln) y += (e.abstaende || {}).nachKurz || 0;

  /* Beispiel */
  if (e.beispiel) {
    const b = e.beispiel, inh = [blText(b.problem, { gap: b.problemGap === undefined ? 0.07 : b.problemGap })];
    let tb = b.tabelle;
    if (!tb && b.zeilen) tb = { kopf: ['Rolle', 'Rechnung', 'Neuer Schaden'], zeilen: b.zeilen.map(z => [z.rolle, z.rechnung, z.ergebnis]) };
    if (tb) {
      const hatLuecken = tb.zeilen.some(z => z.some(c => c === ''));
      const rowH = b.rowH || (hatLuecken ? 0.27 : 0.255), hK = b.kopfH || 0.28, zH = b.zeilenH || tb.zeilen.map(() => rowH), H = hK + zH.reduce((a, c) => a + c, 0);   // b.tabPt / rowH / kopfH / zeilenH: Julian 10.11. (Einheit 4, 5: 11 pt)
      inh.push({ h: H + (b.tabGap === undefined ? 0.12 : b.tabGap), zeichne: (x, yy, w) => {
        const gew = b.gew || tb.kopf.map((k, i) => Math.max(4, Math.min(22, Math.max(k.length * 0.8, Math.max(...k.split(' ').map(w => w.length)) * 1.2, ...tb.zeilen.map(z => String(z[i]).replace(/\*\*/g, '').length)))));
        const s = gew.reduce((a, c) => a + c, 0);
        const rows = [tb.kopf.map(k => ({ text: k, options: { bold: true, color: CREAM, fill: { color: INK }, align: 'center', fontFace: HEAD } }))];
        tb.zeilen.forEach(z => rows.push(z.map((c, i) => ({ text: fett(String(c)), options: { align: i === 0 ? 'center' : 'left', fill: { color: 'FFFFFF' } } }))));
        slide.addTable(rows, { x, y: yy, w, colW: gew.map(g => w * g / s), rowH: [hK, ...zH], border: { type: 'solid', pt: 1, color: INK }, fontFace: BODY, fontSize: b.tabPt || 10, color: INK, valign: 'middle', margin: [0, 0.08, 0, 0.08] });
      } });
    }
    if (!Array.isArray(b.erkenntnis) && typeof b.erkenntnis === 'object') {
      inh.push(blText(b.erkenntnis.text1, { italic: true, gap: 0.04 }));
      if (b.erkenntnis.rechnung) inh.push({ h: 0.36, zeichne: (x, yy, w) => slide.addText(b.erkenntnis.rechnung, { x, y: yy, w, h: 0.3, fontFace: HEAD, fontSize: 12, italic: true, color: INK, align: 'center', valign: 'middle', margin: 0, isTextBox: true }) });
      if (b.erkenntnis.text2) inh.push(blText(b.erkenntnis.text2, { italic: true, gap: 0 }));
    } else if (Array.isArray(b.erkenntnis)) b.erkenntnis.forEach((t, i, arr) => inh.push(blText(t, { italic: true, gap: i === arr.length - 1 ? (b.erkGap || 0) : 0.06 })));
    else inh.push(blText(b.erkenntnis, { italic: true, gap: b.erkGap === undefined ? 0 : b.erkGap, zeilen: b.erkZeilen }));
    kasten('Beispiel', inh);
    y += (e.abstaende || {}).nachBeispiel || 0;
  }

  /* Merkkasten (Standard: vor den Aufgaben; mit e.sicherungNach = n nach Aufgabe n) */
  function sicherungBauen() {
    const s = e.sicherung, inh = [];
    if (s.formeln) {
      const breit = s.formeln.some(x => x.klammern);          // alle Formelkästen gleich breit
      if (s.titelGap) inh.push({ h: s.titelGap, zeichne: () => {} });   // mehr Luft unter dem Titel (Julian 10.11., Einheit 5)
      if (s.vorspann) {                                       // Einheit 4: Erläuterung + Beispiel „um ⇔ auf“ vor den Formeln
        const v = s.vorspann;
        inh.push({ h: 0.49, zeichne: (xx, yy, w) => slide.addText(biRuns(v.intro.replace(/\*\*(.+?)\*\*/g, '{{$1}}'), {}).map(r => (r.options.italic ? { text: r.text, options: { bold: true } } : r)), { x: xx, y: yy + 0.05, w, h: 0.44, fontFace: BODY, fontSize: 11, color: INK, margin: 0, valign: 'top', isTextBox: true }) });
        const trenner = h => ({ h, zeichne: (xx, yy, w) => slide.addImage({ path: A('trenner.png'), x: xx + (w - 3.71) / 2, y: yy, w: 3.71, h: 3.71 * 40 / 600 }) });
        inh.push(trenner(0.39));
        inh.push({ h: 0.94, zeichne: (xx, yy, w) => {   // Julian 10.11.: Beispiel als ein Textblock mit Tabulatoren, 11 pt, 4 pt Absatzabstand
          const R = (t, o = {}) => ({ text: t, options: { fontSize: 11, color: INK, ...o } });
          const tab = '\t             ⇔\t';
          const par = a_ => a_.map((r, i) => ({ text: r.text, options: { ...r.options, breakLine: false } }));
          const runs = [
            R('Beispiel:  ', { bold: true }), R(v.beispielText, { bold: true, italic: true }), R('', { breakLine: true }),
            ...v.zeilen.flatMap((z, i) => z.fett
              ? [R(z.links + ' ' + tab + z.rechts + ' ', { bold: true }), ...(i < v.zeilen.length - 1 ? [R('', { breakLine: true })] : [])]
              : [R(z.links), R(tab, { bold: true }), R(z.rechts), ...(i < v.zeilen.length - 1 ? [R('', { breakLine: true })] : [])])
          ];
          slide.addText(runs, { x: xx + 0.03, y: yy, w: w - 0.06, h: 0.913, fontFace: BODY, fontSize: 11, color: INK, margin: 0, valign: 'top', paraSpaceBefore: 4, paraSpaceAfter: 4, isTextBox: true });
        } });
        inh.push(trenner(0.4));
      }
      s.formeln.forEach(x => {
        const wW = breit ? 1.75 : 2.0, wF = breit ? 3.05 : 2.55, wB = CW - 0.32 - wW - wF;
        const nK = x.klammern ? x.klammern.labels.length : 0;
        const hF = Math.max(0.38, hText(x.formel, wF - 0.1, 11.5, 1.2, 0.55) + 0.1);
        const hFeld = nK ? 0.44 + nK * 0.18 + 0.04 : hF;
        const h = Math.max(hFeld + 0.1, hText(x.wenn, wW - 0.1, 10, 1.2) + 0.1, hText('z. B. ' + x.beispiel, wB - 0.05, 9.5, 1.45) + 0.1);
        inh.push({ h, zeichne: (xx, yy) => {
          const feldH = hFeld, fy = yy;
          slide.addText(x.wenn, { x: xx, y: yy, w: wW - 0.08, h: feldH, fontFace: BODY, fontSize: 10, bold: true, color: INK, margin: 0, valign: 'middle', isTextBox: true });
          slide.addShape(pres.ShapeType.rect, { x: xx + wW, y: fy, w: wF - 0.08, h: feldH, fill: fl(SAND), line: { color: INK, width: 0.75 } });
          const ftop = fy + feldH - 0.42;
          if (!nK) slide.addText(x.formel, { x: xx + wW, y: fy, w: wF - 0.08, h: feldH, fontFace: HEAD, fontSize: 11.5, bold: true, color: INK, margin: 0, align: 'center', valign: 'middle', isTextBox: true });
          else {
            /* Formel Zeichen für Zeichen (Token) setzen, damit die Klammern exakt über den Faktoren sitzen – unabhängig von der Schrift */
            const toks = x.formel.split(' '), GAP = 0.055;
            const tw = toks.map(t => (t === '·' ? 0.07 : t === '=' ? 0.14 : wid(t, 11.5) * 1.04));
            const gesamt = tw.reduce((a, c) => a + c, 0) + GAP * (toks.length - 1);
            let px = xx + wW + (wF - 0.08 - gesamt) / 2; const pos = [];
            toks.forEach((t, i) => {
              pos.push(px);
              slide.addText(t, { x: px - 0.05, y: ftop, w: tw[i] + 0.1, h: 0.38, fontFace: HEAD, fontSize: 11.5, bold: true, color: INK, margin: 0, align: 'center', valign: 'middle', wrap: false, isTextBox: true });
              px += tw[i] + GAP;
            });
            const x0 = pos[0];
            x.klammern.labels.forEach((lab, k) => {
              const idx = x.klammern.enden[k].split(' ').length - 1, x1 = pos[idx] + tw[idx];
              const ly = ftop + 0.06 - k * 0.18, ln = { color: INK, width: 1 };
              slide.addShape(pres.ShapeType.line, { x: x0, y: ly, w: x1 - x0, h: 0, line: ln });
              slide.addShape(pres.ShapeType.line, { x: x0, y: ly, w: 0, h: 0.07, line: ln });
              slide.addShape(pres.ShapeType.line, { x: x1, y: ly, w: 0, h: 0.07, line: ln });
              slide.addText(lab, { x: x0 + 0.12, y: ly - 0.17, w: 0.9, h: 0.16, fontFace: BODY, fontSize: 8.5, italic: true, color: GREY, margin: 0, valign: 'middle', isTextBox: true });
            });
          }
          slide.addText('z. B. ' + x.beispiel.replace(/ ([·=≈]) /g, '\u00A0$1\u00A0'), { x: xx + wW + wF, y: yy, w: wB, h: Math.max(feldH, h - 0.06), fontFace: BODY, fontSize: 9.5, italic: true, color: INK, margin: 0, valign: 'middle', lineSpacingMultiple: 1.3, isTextBox: true });
        } });
      });
      if (s.umrechnung && s.vorUmr) inh.push({ h: s.vorUmr, zeichne: () => {} });
      if (s.umrechnung) inh.push(blText(s.umrechnung, { pt: s.pt || 10.5, gap: s.umrGap === undefined ? 0.06 : s.umrGap, faktor: 0.44, lsm: s.umrLsm, zeilen: s.umrZeilen }));
      if (s.achtung) inh.push(blText('Achtung: ' + s.achtung, { pt: s.pt || 10.5, bold: true, gap: s.spielregel ? 0.06 : 0 }));
      if (s.padUnten) inh.push({ h: s.padUnten, zeichne: () => {} });
      if (s.spielregel) inh.push(blText(s.spielregel, { pt: 10.5, italic: true, gap: 0 }));
    } else if (s.luecken) {
      s.luecken.forEach((x, i) => {
        const t = `${i + 1}.  ${x.text}`, n = t.length > 112 ? 2 : 1;       // Unterstriche sind schmal: Zeilenzahl nach Zeichenzahl schätzen
        const ls = x.zeilenabstand || 1, hh = n * 0.19 * ls;
        inh.push({ h: hh + (s.abstand || 0.1), zeichne: (xx, yy, w) => slide.addText(t, { x: xx, y: yy, w, h: hh + 0.02, fontFace: BODY, fontSize: 11, color: INK, margin: 0, valign: 'top', lineSpacingMultiple: ls, isTextBox: true }) });
      });
    }
    kasten(s.titel.replace(/^Merke:\s*/, 'Merke: '), inh, { fill: 'F3E9C9' });
  }
  if (e.sicherung && !e.sicherungNach) sicherungBauen();

  /* Aufgaben */
  e.aufgaben.forEach(a => {
    const stern = !!a.differenzierung;
    const titel = `Aufgabe ${a.nr} · ${a.titel}`;
    const stuecke = []; // Funktionsliste, damit Differenzierungsaufgaben einen gestrichelten Rahmen bekommen
    const paragraphs = a.liste || a.einBlock ? [a.text] : splitTeile(a.text);
    const run = () => {
      if (a.regelKasten && !a.regelNachText) kurzKasten(a.regelKasten);
      paragraphs.forEach((p, i) => {
        const zn = (a.zeilenAnz || {})[i] || ((a.einzeilig || []).includes(i) ? 1 : undefined);   // Zeilenzahl überschreiben (statt Schätzung)
        const istTeil = q => /^[a-z]\)\s/.test(q || '');   // Teilaufgabe „a) …“
        const gap = i === paragraphs.length - 1 ? (a.nummern ? 0.2 : a.liste ? 0 : 0.1) : (a.teilGap && istTeil(p) && istTeil(paragraphs[i + 1]) ? a.teilGap : 0.04);   // teilGap: größerer Abstand zwischen Teilaufgaben
        const y0 = absatz(p, { gap, x: MX, w: CW, zeilen: zn, lsm: (a.zeilenMult || {})[i], block: a.einBlock, hExtra: a.blockExtra, sp6: a.blockSp6, spPt: a.blockSpPt });
        if (a.schritte && a.schritte[i] !== undefined) y = y0 + a.schritte[i];                  // fester Abstand zum nächsten Absatz (Handanpassung)
      });
      if (a.regelKasten && a.regelNachText) kurzKasten(a.regelKasten);   // Regelkasten unter dem Einleitungstext (Einheit 3, Kampfregeln)
      if (a.liste) buchstabenListe(a.liste, a.listeGap);
      if (a.nummern) nummernListe(a.nummern);
      if (a.nachText) absatz(a.nachText, { gap: a.nachTextGap === undefined ? 0.2 : a.nachTextGap });
      if (a.hinweis) hinweisBox(a.hinweis);
      if ((a.gegner || []).length) gegnerReihe(a.gegner);
      if (a.tabelleVorRegeln) { (a.tabellen || []).forEach(tb => tabelleBauen(tb)); if (a.trenner) { slide.addImage({ path: A('trenner.png'), x: (PW - 3.21) / 2, y, w: 3.21, h: 3.21 * 40 / 600 }); y += 0.31; } }   // Julian 10.11. (Einheit 7): Tabelle vor den Regeln, Zierlinie darunter
      (a.regeln || []).forEach((r, i) => absatz(`${i + 1}.  ${r}`, { pt: a.regelPt || 10.5, gap: 0.04 }));
      if (a.regeln && a.abstaende) y += a.abstaende.nachRegeln || 0;
      (a.tabelle || []).forEach(t => a.tabelleLinie ? absatz(`•  ${t}   →   ` + '_'.repeat(Math.max(10, a.tabelleLinie - (`•  ${t}   →   `).length)), { pt: 11, gap: a.zeilenabstand || 0.05, zeilen: 1 }) : absatz(`•  ${t}   →   ____________ SP`, { pt: 10.5, gap: a.zeilenabstand || 0.05 }));
      if (a.teileSpalten) {                                  // Teilaufgaben a)–d) in zwei Spalten, e) darunter (Einheit 4, Aufgabe 2)
        const T = a.teile.map((t, i) => `${String.fromCharCode(97 + i)})  ${t}`), n = a.teileSpalten, y0 = y;
        sicher(0.2 + (n + 1) * 0.36);
        const yy = y;
        T.slice(0, 2 * n).forEach((t, i) => { const sp = Math.floor(i / n), r = i % n; slide.addText(t, { x: MX + sp * 3.41, y: yy + r * 0.36, w: sp ? CW - 3.41 : 3.3, h: 0.23, fontFace: BODY, fontSize: 11, color: INK, margin: 0, valign: 'top', isTextBox: true }); });
        T.slice(2 * n).forEach((t, i) => slide.addText(t, { x: MX, y: yy + n * 0.36 + i * 0.36, w: CW, h: 0.23, fontFace: BODY, fontSize: 11, color: INK, margin: 0, valign: 'top', isTextBox: true }));
        y = yy + (n + T.length - 2 * n) * 0.36 + 0.06 + (a.teileNach || 0);
      } else
      (a.teile || []).forEach((t, i) => absatz(`${String.fromCharCode(97 + i)})  ${t}`, { pt: 10.5, gap: 0.12 }));
      (a.kombinationen || []).forEach((t, i) => absatz(`${String.fromCharCode(97 + i)})  ${t}   →   Ø ____________ SP`, { pt: a.kombiPt || 10.5, gap: a.kombiGap === undefined ? 0.12 : a.kombiGap }));
      if (a.kombiNach) y += a.kombiNach;
      if (a.nachTeile) absatz(a.nachTeile.text, { gap: a.nachTeile.gap === undefined ? 0.1 : a.nachTeile.gap, zeilen: a.nachTeile.zeilen });   // Absatz nach den Teilaufgaben
      if ((a.karten || []).length) kartenReihe(a.karten, { ersteAllein: a.ersteKarteAllein, kompakt: a.kartenKompakt, breit: a.kartenBreit, ohneBild: a.kartenOhneBild });
      if (a.abstaende) y += a.abstaende.nachKarten || 0;
      (a.setBoxen || []).forEach(setBox);                              // leere Set-Vorlagen (Einheit 3)
      (a.builds || []).forEach(buildBox);
      if (a.nachBuild) y += a.nachBuild;
      if (a.notizen && a.notizenVorTabelle) notizenBox(a.notizen);   // Notizfeld vor der Tabelle (z. B. Einheit 3, Aufgabe 1)
      if (a.tabellenNeueSeite) neueSeite();
      if (a.tabellenYExtra) y += a.tabellenYExtra;                          // Tabelle beginnt auf der nächsten Seite („Rückseite“)
      if (!a.tabelleVorRegeln) (a.tabellen || []).forEach(tb => tabelleBauen(tb));
      if (a.nachTabelleBlock) absatz((a.nachTabelle || []).join('\n'), { block: true, sp6: true, zeilen: a.nachTabelleBlock.zeilen, hExtra: a.nachTabelleBlock.hExtra, gap: a.nachTabelleBlock.gap });   // ein Textfeld, 6 pt Abstand (Julian 10.11.)
      else (a.nachTabelle || []).forEach((t, i, ar) => absatz(t, { gap: i === ar.length - 1 ? 0.1 : 0.12 }));   // Absätze unter der Tabelle (z. B. Teilaufgaben b), c))
      if (a.protokolle && a.protokolle.gitter) { if (a.protokolle.neueSeite) neueSeite(); protokollGitter(a.protokolle.anzahl); }
      else if (a.protokolle) for (let i = 1; i <= a.protokolle.anzahl; i++) protokollBox(i);
      if (a.abstaende) y += a.abstaende.nachTabelle || 0;
      (a.nachdenken || []).forEach(t => absatz(t, a.nachdenkenStil || { pt: 10.5, italic: true, gap: 0.05 }));   // nachdenkenStil: Julian 10.11. (Einheit 2: 11 pt, nicht kursiv)
      if (a.notizen && !a.notizenVorTabelle) notizenBox(a.notizen);
      if (a.abstaende) y += a.abstaende.nachNachdenken || 0;
      (a.tabellen2 || []).forEach(tb => tabelleBauen(tb));
    };
    if (a.halbseite) {                                       // Differenzierungsaufgabe 2× auf ein Blatt (Druck sparen): zwei Halbseiten, je eigener Rahmen
      slide = pres.addSlide(); seite++;
      if (!PLAIN) slide.background = { path: A('pergament.jpg') };
      halb = true; MX = 0.44;
      [0, 1].forEach(k => {
        slide.addImage({ path: A('rahmen-a4quer.png'), x: 0, y: k ? 5.838 : 0.086, w: PW, h: PW * 1654 / 2338, altText: 'Rahmen' });
        y = 0.4 + k * 5.752;
        laufKopf(); abschnitt(titel, { pt: 13 }); run();
      });
      halb = false; MX = 0.5;
      return;
    }
    if ((a.nr === e.aufgaben[0].nr && !e.kurzregeln && !a.auchSeite1) || a.neueSeite) neueSeite(); else sicher(a.platz || 1.5);   // a.platz: Platzbedarf der ganzen Aufgabe (zusammenhalten)
    botDy = a.botDy || 0;
    if (a.yExtra) y += a.yExtra;
    abschnitt(titel, { pt: 13, heft: a.heft });
    if (a.titelGap) y += a.titelGap;   // zusätzlicher Abstand zwischen Titel und Text (Julian 10.11.)
    run();
    y += 0.06;
    if (e.sicherung && e.sicherungNach === a.nr) sicherungBauen();
  });
  /* Nummerierte Liste (automatische Nummerierung, hängender Einzug) */
  /* Liste mit automatischer Nummerierung a) b) c) … (Word-/PowerPoint-Liste, Einzug 0,25 Zoll, 4 pt Abstand davor) */
  function buchstabenListe(items, gap = 0.1) {
    const h = items.reduce((n, t) => n + hText(ohneBI(t), CW - 0.25, 11), 0) + items.length * 4 / 72 + 0.02;
    sicher(h);
    slide.addText(items.flatMap((t, i) => biRuns(t).map((r, j, ar) => ({ text: r.text, options: { ...r.options, ...(j === 0 ? { bullet: { type: 'number', style: 'alphaLcParenR', indent: 18 }, paraSpaceBefore: 4 } : {}), breakLine: j === ar.length - 1 && i < items.length - 1 } }))), { x: MX, y, w: CW, h, fontFace: BODY, fontSize: 11, color: INK, margin: 0, valign: 'top', isTextBox: true, paraSpaceAfter: 0 });
    y += h + gap;
  }
  function nummernListe(items) {
    const h = items.reduce((n, t) => n + hText(ohneBI(t), CW - 0.3, 11), 0) + 0.02;
    sicher(h);
    slide.addText(items.flatMap((t, i) => biRuns(t).map((r, j, ar) => ({ text: r.text, options: { ...r.options, ...(j === 0 ? { bullet: { type: 'number', indent: 18 }, indentLevel: 0 } : {}), breakLine: j === ar.length - 1 && i < items.length - 1 } }))), { x: MX, y, w: CW, h, fontFace: BODY, fontSize: 11, color: INK, margin: 0, valign: 'top', isTextBox: true, paraSpaceAfter: 0 });
    y += h + 0.2;
  }
  function hinweisBox(hin) {
    const zeilen = [].concat(hin);
    const tw = CW - 0.6;
    const h = Math.max(0.62, zeilen.reduce((n, t) => n + hText(t, tw, 10.5), 0) + 0.2 + (zeilen.length - 1) * 0.04);
    sicher(h + 0.1);
    slide.addShape(pres.ShapeType.rect, { x: MX, y, w: CW, h, fill: fl(SAND), line: { color: INK, width: 1.25 } });
    slide.addText('!', { x: MX + 0.1, y, w: 0.4, h, fontFace: HEAD, fontSize: 30, color: INK, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    slide.addText(zeilen.map((t, i) => ({ text: t, options: { breakLine: i < zeilen.length - 1, bold: true } })), { x: MX + 0.5, y, w: tw, h, fontFace: BODY, fontSize: 10.5, color: INK, align: 'center', margin: 0, valign: 'middle', paraSpaceAfter: 3, isTextBox: true });
    y += h + 0.1;
  }

  /* Gegnerkarten (klein, vier nebeneinander): Name, Bild, LP, Widerstände */
  function gegnerReihe(gk) {
    const n = 4, gap = 0.1, w = (CW - gap * (n - 1)) / n, sq = 0.7;
    for (let r = 0; r < gk.length; r += n) {
      const reihe = gk.slice(r, r + n);
      const zl = g => g.zeilen || (g.modifikatoren ? [g.modifikatoren] : ['Keine Widerstände']);
      const nz = Math.max(...reihe.map(g => zl(g).reduce((c, t) => c + lines(t, w - 0.2, 8.5, 0.52), 0)));
      const H = 0.36 + sq + 0.06 + nz * 0.15 + 0.1;
      sicher(H + 0.12);
      reihe.forEach((g, j) => {
        const x = MX + j * (w + gap);
        slide.addShape(pres.ShapeType.rect, { x, y, w, h: H, fill: fl(PAPER), line: { color: INK, width: 1.5 } });
        slide.addShape(pres.ShapeType.rect, { x: x + 0.04, y: y + 0.04, w: w - 0.08, h: H - 0.08, fill: { type: 'none' }, line: { color: INK, width: 0.5 } });
        slide.addShape(pres.ShapeType.rect, { x: x + 0.07, y: y + 0.07, w: w - 0.14, h: 0.24, fill: { color: INK }, line: { color: INK, width: 0.5 } });
        slide.addText(g.name, { x: x + 0.09, y: y + 0.07, w: w - 0.18, h: 0.24, fontFace: HEAD, fontSize: g.name.length > 14 ? 8.5 : 9.5, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, fit: 'shrink', isTextBox: true });
        const ix = x + 0.1, iy = y + 0.37, ico = iconPfad(g.id);
        if (ico) {
          slide.addImage({ path: ico, x: ix, y: iy, w: sq, h: sq, altText: g.name });
          slide.addShape(pres.ShapeType.rect, { x: ix, y: iy, w: sq, h: sq, fill: { type: 'none' }, line: { color: INK, width: 1 } });
        } else {
          slide.addShape(pres.ShapeType.rect, { x: ix, y: iy, w: sq, h: sq, fill: { color: 'FFFFFF' }, line: { color: INK, width: 1, dashType: 'dash' } });
        }
        const lx = ix + sq + 0.07, lw = x + w - 0.1 - lx;
        slide.addShape(pres.ShapeType.rect, { x: lx, y: iy, w: lw, h: sq, fill: fl(SAND), line: { color: INK, width: 0.75 } });
        slide.addText([{ text: 'LP', options: { fontSize: 8.5, italic: true, breakLine: true } }, { text: String(g.lp), options: { fontSize: g.lp >= 1000 ? 13 : 15, bold: true, fontFace: HEAD } }],
          { x: lx, y: iy, w: lw, h: sq, fontFace: BODY, color: INK, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
        slide.addText(zl(g).map((t, i) => ({ text: t, options: { breakLine: i < zl(g).length - 1 } })), { x: x + 0.1, y: iy + sq + 0.05, w: w - 0.2, h: nz * 0.15 + 0.04, fontFace: BODY, fontSize: 8.5, bold: true, color: INK, align: 'center', margin: 0, valign: 'top', isTextBox: true });
      });
      y += H + 0.12;
    }
  }

  /* ---------- Lösungsseiten ---------- */
  loesungsModus = true; botDy = 0; seite = 0; neueSeite();
  absatz('Nur für die Lehrkraft – alle Werte stammen aus der Rechen-Engine (engine.js).', { italic: true, pt: 11, gap: 0.12 });
  if (e.sicherung && e.sicherung.luecken) {
    abschnitt('Merkkasten');
    e.sicherung.luecken.forEach((x, i) => { let k = 0; absatz(`${i + 1}.  ` + x.text.replace(/_{6,}/g, () => `[${x.loesungen[k++]}]`), { pt: 11, gap: 0.03 }); });
    y += 0.04;
  }
  if (e.beispiel && e.beispiel.loesungTabelle) { abschnitt('Beispiel', { pt: 12.5 }); tabelleBauen(e.beispiel.loesungTabelle); if (e.beispiel.loesungText) absatz(e.beispiel.loesungText, { pt: 11, gap: 0.08 }); }
  e.aufgaben.forEach(a => {
    abschnitt(`Aufgabe ${a.nr}`, { pt: 12.5 });
    const l = a.loesung;
    let zl = [];
    if (Array.isArray(l)) zl = l;
    else if (l.ergebnisse) { zl = [...l.ergebnisse, ...l.gleichwertig.map(g => 'Gleichwertig: ' + g.join(' = '))]; }
    else { zl = l.kombinationen.map(k => `${k.name}: ${k.rechnung.join(' | ')} → Ø ${fmt(k.mittel)} SP`); zl.push(`Beste: ${l.beste}; Würfelwerte: Min ${fmt(l.wuerfel.min)} / Mittel ${fmt(l.wuerfel.mittel)} / Max ${fmt(l.wuerfel.max)}`); }
    zl.forEach(t => absatz('•  ' + t, { pt: 11, gap: 0.03 }));
    y += 0.02;
    (a.loesungTabellen || []).forEach(tb => tabelleBauen(tb));
    (a.loesungBuilds || []).forEach(buildBox);
  });

  /* pptxgenjs schreibt bei Texten mit mehreren Abschnitten vor jeden weiteren Abschnitt ein <a:pPr> (ungültig mitten im Absatz;
     LibreOffice verliert dann z. B. Aufzählungen). Diese überzähligen pPr werden nach dem Schreiben entfernt. */
  return pres.write({ outputType: 'nodebuffer' }).then(async buf => {
    try {
      const JSZip = require(require.resolve('jszip', { paths: [path.dirname(require.resolve('pptxgenjs'))] }));   // jszip hängt an pptxgenjs
      const zip = await JSZip.loadAsync(buf);
      for (const n of Object.keys(zip.files).filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))) {
        const x = await zip.file(n).async('string');
        zip.file(n, x.replace(/(<\/a:r>)<a:pPr\b[^>]*?(?:\/>|>(?:(?!<\/a:pPr>)[\s\S])*<\/a:pPr>)/g, '$1'));
      }
      buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    } catch (err) { console.error('Hinweis: pPr-Bereinigung übersprungen (' + err.message + ')'); }
    fs.writeFileSync(outFile, buf);
    return outFile;
  });
}

if (require.main === module) {
  const arg = process.argv[2] || '8';
  const nummern = arg === 'alle' ? ['1', '2', '3', '4', '5', '6', '7', '8', '9'] : [arg];
  const varianten = process.argv[3] ? [process.argv[3]] : ['pergament', 'ohne-hintergrund'];
  (async () => {
    for (const n of nummern) {
      const e = JSON.parse(fs.readFileSync(path.join(ROOT, `einheit-${n}.json`), 'utf8'));
      for (const v of varianten) {
        const dir = path.join(ROOT, 'pptx', v); fs.mkdirSync(dir, { recursive: true });
        console.log('geschrieben', await bauen(e, path.join(dir, require('./dateinamen.js').ab(n)), v));
      }
    }
  })();
}
module.exports = { bauen };
