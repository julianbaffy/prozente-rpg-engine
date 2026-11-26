/* Übersicht über das ganze Unterrichtsvorhaben (UV): eine Tabelle mit allen Einheiten, A4 quer, Pergamentstil wie die Arbeitsblätter.
 *   node layout/build-uv-uebersicht.js   ->  pptx/pergament/uv-uebersicht.pptx  UND  pptx/ohne-hintergrund/uv-uebersicht.pptx
 * Spalten: Nummer + Name der Einheit | Kontext und Aufgaben | mathematischer Zusammenhang / Lernziel | Material
 * Die Texte stehen unten in EINHEITEN; die Titel kommen aus einheit-N.json. Die Zeilen werden auf Seiten verteilt (Seite 1 mit Banner).
 */
import fs from 'fs';
import path from 'path';
import pptxgen from 'pptxgenjs';
import dateinamen from './dateinamen.js';
const ROOT = path.join(import.meta.dirname, '..');
const A = n => path.join(import.meta.dirname, 'assets', n);

const INK = '2E2114', PAPER = 'FFFDF6', SAND = 'EFE3BE', CREAM = 'F8F1DE', GREY = '6B5B45';
const HEAD = 'Cambria', BODY = 'Calibri';
const PW = 11.69, PH = 8.27, MX = 0.5, TOP = 0.72, BOT = PH - 0.62, CW = PW - 2 * MX;

/* ---------- Inhalt ---------- */
const EINHEITEN = [
  { nr: 1,
    kontext: 'In der Schmiede von Prozenturis hängen Waffen und Zaubergegenstände an den Wänden. Welche Kombination trifft am härtesten?',
    aufgaben: 'A1 drei Angebote des Schmieds berechnen · A2 den besten Build zusammenstellen (Build-Vorlage) · ★ A3 sicher oder riskant? (Würfelduell mit Min, Mittel, Max)',
    mathe: 'Prozentwert berechnen: W = p · G. Bonus = Grundschaden · Modifikator, neuer Schaden = Grundschaden + Bonus. Modifikatoren derselben Schadensart werden addiert (+50 % und +50 % = +100 %).',
    material: ['30× Arbeitsblatt (2 Seiten, doppelseitig auf ein Blatt)', '10× Gegenstandskarten Stufe 1 (laminiert)', 'Regeln-Präsentation'] },
  { nr: 2,
    kontext: 'In der Rüstkammer hängen magische Rüstungen. Es zählt nur der Schaden, nicht die Schutzwirkung: Manche Rüstungen steigern den Schaden gewaltig, andere hindern mehr, als sie bringen.',
    aufgaben: 'A1 sechs Rüstungen mit Feuersturm testen · A2 Letzte Bastion – Segen oder Fluch? · A3 den stärksten Helden bauen (Build-Vorlage) · ★ A4 Rüstung der Dunkelheit',
    mathe: 'Mehrschrittige Rechnungen ordnen: zusätzlicher Grundschaden zählt mit, Umwandlung vor den Modifikatoren, negative Modifikatoren. Systematisch in Tabellen rechnen und vergleichen.',
    material: ['30× Arbeitsblatt (2 Seiten)', '10× Gegenstandskarten Stufe 1 und 2 (laminiert)'] },
  { nr: 3,
    kontext: 'In den Monsterhöhlen lauern Gegner, die manche Schadensarten kaum spüren und gegen andere empfindlich sind. Der Gesamtschaden hängt jetzt auch davon ab, wen du bekämpfst.',
    aufgaben: 'A1 Set „Gewitter“ gegen sechs Monster · A2 zwei Sets bauen, mit denen alle Monster in 3 Runden fallen · A3 Würfelduell Held gegen Monster (Duellprotokoll)',
    mathe: 'Widerstand, Immunität und Anfälligkeit als Faktor 1 ± p (immun = Faktor 0), für jede Schadensart einzeln auf den fertigen Schaden. Treffer bis zum Sieg: Lebenspunkte : Schaden (aufrunden).',
    material: ['30× Arbeitsblatt (5 Seiten)', '10× Übersicht Einheit 3 (Gegner, laminiert)', '10× Gegenstandskarten Stufe 1 und 2 (laminiert)', 'W6-Würfel für die Duelle'] },
  { nr: 4,
    kontext: 'Auf dem Marktplatz verkauft Schriftrollenhändlerin Thelya Rollen, die den Schaden verändern. Die Beschreibungen klingen verdächtig ähnlich …',
    aufgaben: 'Beispiel: vier Rollen für ein Schwert mit Grundschaden 80 · A1 Zwillinge und Fallen · A2 Übersetzungsrolle (um ⇄ auf) · A3 Wer hat recht? · A4 zwei Golems · A5 Ausrüstung kombinieren',
    mathe: 'Steigern / Verringern UM p % (G · (1 ± p)) und AUF a % (G · a) unterscheiden und ineinander umrechnen. Steigern um p % = Steigern auf (100 % + p).',
    material: ['30× Arbeitsblatt (3 Seiten)', '10× Übersicht Einheit 4 (neue Ausrüstung und Gegner, laminiert)'] },
  { nr: 5,
    kontext: 'Magister Quillon verzaubert Waffen. Er kennt den Grundschaden, misst danach den Gesamtschaden und möchte daraus die Qualität seines Zaubers berechnen.',
    aufgaben: 'A1 Quillons Messungen · A2 wenn der Zauber misslingt · A3 hält Quillon sein Versprechen („um 40 %“)? · ★ A4 Schaden mit Spanne (Minimum und Maximum)',
    mathe: 'Prozentsatz berechnen: p = W : G. Änderung = (neu − alt) : alt; „auf 130 %“ heißt „um 30 % mehr“. Probe: G · p = W.',
    material: ['30× Arbeitsblatt (2 Seiten)', 'keine Übersicht nötig'] },
  { nr: 6,
    kontext: 'In der Trainingshalle liegen Übungswaffen mit unbekanntem Grundschaden. Du kannst nur messen, was sie mit deiner Ausrüstung anrichten. Lohnt es sich, sie mitzunehmen?',
    aufgaben: 'A1 welche Übungswaffe nehme ich mit? · A2 zwei Boni auf einmal · A3 wenn die Rüstung schwächt (negativer Modifikator)',
    mathe: 'Grundwert berechnen: G = W : (1 + p) bzw. G = W : (1 − p). Mehrere Boni zuerst addieren, dann dividieren. Typischer Fehler: „10 % vom gemessenen Wert abziehen“. Probe: G · (1 ± p) = W.',
    material: ['30× Arbeitsblatt (2 Seiten)', 'Gegenstandskarten sind auf dem Arbeitsblatt abgedruckt'] },
  { nr: 7,
    kontext: 'Auf dem Turnierplatz ruft Ritter Lohnamm zum Duell. Du darfst zwischen zwei Ausrüstungssets wählen, wenn du klug rechnest.',
    aufgaben: 'Beispiel: Handschuhe (+10 %) oder Helm (+5)? · A1 Helm oder Handschuhe · A2 absolut ⇄ prozentual umrechnen · A3 Armband oder Ring? · A4 Das Duell gegen Lohnamm (Set A prozentual, Set B fest; Würfelduell)',
    mathe: 'Absoluten und prozentualen Bonus vergleichen: Ein fester Bonus bleibt gleich, ein prozentualer wächst mit dem Grundwert. Schwellenwert bestimmen (z. B. 5 : 0,1 = 50) und begründen.',
    material: ['30× Arbeitsblatt (3 Seiten)', '10× Übersicht Einheit 7 (neue Gegenstände, laminiert)', 'W6-Würfel für das Duell'] },
  { nr: 8,
    kontext: 'In der Arena werden manche Waffen im Kampf stärker: Mit jedem Angriff wächst der Schaden um einen Prozentsatz („Zinsen“). Welche Klinge lohnt sich gegen welchen Gegner?',
    aufgaben: 'A1 Wutklinge (+5 %) gegen Klinge der Rachsucht (+8 %) · A2 Wirbelklinge (2 Angriffe pro Runde) · A3 Gesamtschaden gegen vier Gegner · A4 wann lohnt sich die schnelle Klinge? · ★ A5 Zinsen oder fester Aufbau?',
    mathe: 'Wiederholte prozentuale Steigerung: Schaden nach n Steigerungen = G · qⁿ mit q = 1 + p (Potenz). Wachstum mit Zinsen und festes (lineares) Wachstum vergleichen; Schwellenwerte in Tabelle und Koordinatensystem.',
    material: ['30× Arbeitsblatt (4 Seiten)', '10× Übersicht Einheit 8 (Klingen und Gegner, laminiert)'] },
  { nr: 9, stern: true,
    kontext: 'Ein zwielichtiger Typ will in einem alten Grab einen legendären Helm gefunden haben, der Schaden besser verstärken soll als „moderne“ Helme.',
    aufgaben: 'A1 Helm oder Umhang? · A2 welche Schadensart soll der Helm verstärken? (Aufgaben im Heft)',
    mathe: 'Reihenfolge der Rechenschritte: Prozentsätze derselben Schadensart werden addiert, die +25 % des Helms wirken nachträglich als eigener Faktor (1,25) auf den fertigen Wert. Addieren und Multiplizieren unterscheiden.',
    material: ['Zusatzseite (1 Seite, bunt gedruckt und laminiert)', 'Gegenstandskarten Stufe 1 und 2'] },
];

const HINWEISE = [
  ['Roter Faden: ', 'Prozentwert (Einheit 1–3) → Steigern um / auf (4) → Prozentsatz (5) → Grundwert (6) → absolut oder prozentual (7) → Zinsen (8). Vor Einheit 1: das Klett-Blatt „03.1 Prozentwerte berechnen“.'],
  ['Bonus und Faktor: ', 'Einheit 1–3 rechnen mit dem Bonus (Grundschaden · Modifikator); der Faktor (1 ± p) kommt erst in Einheit 4. Nur der Gegnerfaktor in Einheit 3 steht früher.'],
  ['Material: ', 'Angenommen 30 Schülerinnen und Schüler. Arbeitsblätter bekommt jedes Kind; Übersichten und Gegenstandskarten werden laminiert und gemeinsam genutzt (3 SuS teilen sich einen Satz, also 10 Sätze). Die Arbeitsblätter selbst enthalten keine Bilder.'],
  ['★ ', 'kennzeichnet Zusatzaufgaben bzw. die Zusatzseite für schnelle Kinder.'],
];

/* ---------- Textmessung (großzügig) ---------- */
function lines(text, wIn, pt, factor = 0.47) {
  const cpl = Math.max(8, Math.floor(wIn * 72 / (pt * factor)));
  return String(text).split('\n').reduce((n, par) => {
    let l = 1, cur = 0;
    par.split(/\s+/).forEach(w => { if (cur + w.length + (cur ? 1 : 0) > cpl) { l++; cur = w.length; } else cur += w.length + (cur ? 1 : 0); });
    return n + l;
  }, 0);
}

/* ---------- Tabelle ---------- */
const PT = 9, LS = 1.2;
const SPALTEN = [{ t: 'Einheit', w: 1.95 }, { t: 'Kontext und Aufgaben', w: 4.1 }, { t: 'Mathematischer Zusammenhang / Lernziel', w: 2.85 }, { t: 'Material', w: 1.85 }];
const sw = SPALTEN.reduce((s, c) => s + c.w, 0), COLW = SPALTEN.map(c => CW * c.w / sw);
const PADX = 0.08, PADY = 0.035;

function zeilenHoehe(e, titel) {
  const hc = n => n * PT * LS / 72;
  const h2 = hc(lines(e.kontext, COLW[1] - 2 * PADX, PT, 0.45)) + hc(lines('Aufgaben: ' + e.aufgaben, COLW[1] - 2 * PADX, PT, 0.45)) + 0.05;
  const h3 = hc(lines(e.mathe, COLW[2] - 2 * PADX, PT, 0.45));
  const h4 = e.material.reduce((s, m) => s + hc(lines('• ' + m, COLW[3] - 2 * PADX - 0.1, PT, 0.45)), 0);
  const h1 = 0.2 + lines(titel, COLW[0] - 2 * PADX, 11.5, 0.55) * 11.5 * 1.2 / 72 + (e.stern ? 0.2 : 0);
  return Math.max(h1, h2, h3, h4) + 2 * PADY;
}
const kopfH = 0.32;

function zellen(e, titel) {
  const c = (text, o = {}) => ({ text, options: { fill: { color: 'FFFFFF' }, align: 'left', valign: 'middle', ...o } });
  const nameRuns = [
    { text: `EINHEIT ${e.nr}`, options: { fontFace: BODY, fontSize: 8.5, bold: true, color: GREY, charSpacing: 3, breakLine: true } },
    { text: titel, options: { fontFace: HEAD, fontSize: 11.5, bold: true, color: INK, breakLine: !!e.stern } },
  ];
  if (e.stern) nameRuns.push({ text: '★ Zusatzseite', options: { fontFace: BODY, fontSize: 8.5, italic: true, color: GREY } });
  const mat = [];
  e.material.forEach((m, i) => mat.push({ text: m, options: { bullet: { indent: 10 }, breakLine: i < e.material.length - 1, paraSpaceAfter: 1 } }));
  return [
    c(nameRuns, { align: 'center', fill: { color: SAND } }),
    c([{ text: e.kontext, options: { breakLine: true, paraSpaceAfter: 3 } }, { text: 'Aufgaben: ', options: { bold: true } }, { text: e.aufgaben, options: { bold: false } }]),
    c(e.mathe),
    c(mat),
  ];
}

/* ---------- Seite bauen ---------- */
function bauen(modus) {
  const PLAIN = modus === 'ohne-hintergrund';
  const fl = c => (PLAIN ? { type: 'none' } : { color: c });
  const pres = new pptxgen();
  pres.defineLayout({ name: 'A4_QUER', width: PW, height: PH });
  pres.layout = 'A4_QUER';
  pres.title = 'Powergaming mit Prozenten – Übersicht über alle Einheiten';
  pres.author = 'Prozentrechnung RPG';

  const titel = nr => JSON.parse(fs.readFileSync(path.join(ROOT, `einheit-${nr}.json`), 'utf8')).titel;
  const daten = EINHEITEN.map(e => ({ e, t: titel(e.nr), h: zeilenHoehe(e, titel(e.nr)) }));

  /* Zeilen auf Seiten verteilen: Seite 1 trägt das Banner (weniger Platz) */
  const seitenStart = [], BANNER_W = 5.5, BANNER_H = BANNER_W * 260 / 1400;
  const y1 = TOP - 0.12 + BANNER_H + 0.38, y2 = TOP + 0.55;
  const seiten = [[]]; let y = y1;
  daten.forEach(d => { const gr = BOT - 0.03; if (y + (seiten.length === 1 && !seiten[0].length ? kopfH : 0) + d.h > gr && seiten[seiten.length - 1].length) { seiten.push([]); y = y2; } if (!seiten[seiten.length - 1].length) y += kopfH; seiten[seiten.length - 1].push(d); y += d.h; });
  const letzteEnde = y;

  seiten.forEach((zeilen, si) => {
    const slide = pres.addSlide();
    if (!PLAIN) slide.background = { path: A('pergament-a4quer.jpg') };
    slide.addImage({ path: A('rahmen-a4quer.png'), x: 0, y: 0, w: PW, h: PH, altText: 'Rahmen' });
    let yy;
    if (si === 0) {
      const bx = (PW - BANNER_W) / 2, by = TOP - 0.12, k = BANNER_W / 7.27;
      slide.addImage({ path: A('banner.png'), x: bx, y: by, w: BANNER_W, h: BANNER_H, altText: 'Banner' });
      slide.addText('UNTERRICHTSVORHABEN', { x: bx, y: by + 0.3 * k, w: BANNER_W, h: 0.25 * k, fontFace: HEAD, fontSize: 10, bold: true, color: CREAM, align: 'center', charSpacing: 6, margin: 0, isTextBox: true });
      slide.addText('Powergaming mit Prozenten', { x: bx, y: by + 0.56 * k, w: BANNER_W, h: 0.55 * k, fontFace: HEAD, fontSize: 21, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, isTextBox: true, fit: 'shrink' });
      slide.addText('Übersicht über alle Einheiten  ·  ein Rollenspiel zur Prozentrechnung für Klasse 7', { x: MX, y: by + BANNER_H + 0.06, w: CW, h: 0.28, fontFace: HEAD, fontSize: 12.5, italic: true, color: INK, align: 'center', margin: 0, isTextBox: true });
      yy = y1;
    } else {
      slide.addText('Powergaming mit Prozenten – Übersicht über alle Einheiten', { x: MX, y: TOP - 0.05, w: CW, h: 0.25, fontFace: HEAD, fontSize: 10.5, italic: true, bold: true, color: INK, align: 'center', margin: 0, isTextBox: true });
      slide.addImage({ path: A('trenner.png'), x: (PW - 6) / 2, y: TOP + 0.2, w: 6, h: 6 / 15 });
      yy = y2;
    }
    const kopf = SPALTEN.map(c => ({ text: c.t, options: { bold: true, color: CREAM, fill: { color: INK }, align: 'center', valign: 'middle', fontFace: HEAD, fontSize: 10.5 } }));
    const rows = [kopf, ...zeilen.map(d => zellen(d.e, d.t))];
    slide.addTable(rows, { x: MX, y: yy, w: CW, colW: COLW, rowH: [kopfH, ...zeilen.map(d => d.h)], border: { type: 'solid', pt: 1, color: INK }, fontFace: BODY, fontSize: PT, color: INK, valign: 'middle', margin: [PADY, PADX, PADY, PADX] });
    slide.addText(`Seite ${si + 1} von ${seiten.length}`, { x: MX, y: PH - 0.56, w: CW, h: 0.2, fontFace: BODY, fontSize: 8.5, italic: true, color: GREY, align: 'center', margin: 0, isTextBox: true });

    /* Hinweise im Kasten (Pergamentstil wie im Arbeitsblatt), auf der letzten Seite unter der Tabelle */
    if (si === seiten.length - 1) {
      const pad = 0.13, ptH = 9.5, innerW = CW - 2 * pad;
      const hs = HINWEISE.map(([a, b]) => lines(a + b, innerW - 0.2, ptH, 0.43) * ptH * 1.22 / 72 + 0.07);
      const H = pad + 0.36 + hs.reduce((s, h) => s + h, 0) + pad;
      const by = Math.min(letzteEnde + 0.3, BOT - H);
      if (by < letzteEnde + 0.2) console.warn('WARNUNG: Hinweiskasten passt nicht mehr unter die Tabelle (', by.toFixed(2), '<', letzteEnde.toFixed(2), ')');
      slide.addShape(pres.ShapeType.rect, { x: MX, y: by, w: CW, h: H, fill: fl(PAPER), line: { color: INK, width: 2.25 } });
      slide.addShape(pres.ShapeType.rect, { x: MX + 0.06, y: by + 0.06, w: CW - 0.12, h: H - 0.12, fill: { type: 'none' }, line: { color: INK, width: 0.6 } });
      slide.addImage({ path: A('raute.png'), x: MX + pad, y: by + pad + 0.05, w: 0.2, h: 0.2 });
      slide.addText('Hinweise', { x: MX + pad + 0.3, y: by + pad, w: innerW - 0.3, h: 0.3, fontFace: HEAD, fontSize: 13, bold: true, color: INK, margin: 0, valign: 'middle', isTextBox: true });
      let cy = by + pad + 0.36;
      HINWEISE.forEach(([a, b], i) => {
        slide.addText([{ text: a, options: { bold: true } }, { text: b }], { x: MX + pad + 0.1, y: cy, w: innerW - 0.2, h: hs[i], fontFace: BODY, fontSize: ptH, color: INK, margin: 0, valign: 'top', isTextBox: true });
        cy += hs[i];
      });
    }
  });
  const dir = path.join(ROOT, 'pptx', modus); fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, dateinamen.uvPptx);
  return pres.writeFile({ fileName: out }).then(() => console.log('geschrieben', out, seiten.length, 'Seite(n),', seiten.map(s => s.length).join('+'), 'Zeilen'));
}
export { EINHEITEN, HINWEISE };
if (path.resolve(process.argv[1] || '') === import.meta.filename) (async () => { for (const m of ['pergament', 'ohne-hintergrund']) await bauen(m); })();
