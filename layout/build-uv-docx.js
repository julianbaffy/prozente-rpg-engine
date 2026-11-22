/* UV-Übersicht als Word-Datei (A4 quer, Tabelle bricht automatisch um; Kopfzeile wiederholt sich, Zeilen werden nicht zerschnitten).
 *   node layout/build-uv-docx.js  ->  pptx/uv-uebersicht.docx   (Texte aus build-uv-uebersicht.js, Titel aus einheit-N.json) */
import fs from 'fs';
import path from 'path';
import * as D from 'docx';
import { EINHEITEN, HINWEISE } from './build-uv-uebersicht.js';
import dateinamen from './dateinamen.js';
const ROOT = path.join(import.meta.dirname, '..');
const INK = '2E2114', SAND = 'EFE3BE', PAPER = 'FFFDF6', CREAM = 'F8F1DE', GREY = '6B5B45';
const HEAD = 'Cambria', BODY = 'Calibri';
const titel = nr => JSON.parse(fs.readFileSync(path.join(ROOT, `einheit-${nr}.json`), 'utf8')).titel;

const PAGE_W = 16838, PAGE_H = 11906, MARGIN = 850, CONTENT = PAGE_W - 2 * MARGIN;
const rel = [1.95, 4.1, 2.85, 1.85], sum = rel.reduce((a, b) => a + b, 0);
const COLW = rel.map(r => Math.round(CONTENT * r / sum)); COLW[3] += CONTENT - COLW.reduce((a, b) => a + b, 0);

const line = { style: D.BorderStyle.SINGLE, size: 8, color: INK };
const borders = { top: line, bottom: line, left: line, right: line };
const run = (text, o = {}) => new D.TextRun({ text, font: BODY, size: 19, color: INK, ...o });
const para = (children, o = {}) => new D.Paragraph({ children, spacing: { after: 40, line: 252 }, ...o });
const cell = (children, w, o = {}) => new D.TableCell({ children, width: { size: w, type: D.WidthType.DXA }, borders, margins: { top: 70, bottom: 70, left: 120, right: 120 }, verticalAlign: D.VerticalAlign.CENTER, shading: { type: D.ShadingType.CLEAR, fill: 'FFFFFF', color: 'auto' }, ...o });

const kopf = new D.TableRow({ tableHeader: true, cantSplit: true, children: ['Einheit', 'Kontext und Aufgaben', 'Mathematischer Zusammenhang / Lernziel', 'Material'].map((t, i) =>
  cell([para([run(t, { font: HEAD, bold: true, size: 21, color: CREAM })], { alignment: D.AlignmentType.CENTER, spacing: { after: 0 } })], COLW[i], { shading: { type: D.ShadingType.CLEAR, fill: INK, color: 'auto' } })) });

const zeilen = EINHEITEN.map(e => {
  const c1 = [
    para([run(`EINHEIT ${e.nr}`, { size: 17, bold: true, color: GREY, characterSpacing: 40 })], { alignment: D.AlignmentType.CENTER, spacing: { after: 20 } }),
    para([run(titel(e.nr), { font: HEAD, bold: true, size: 23 })], { alignment: D.AlignmentType.CENTER, spacing: { after: 0 } }),
  ];
  if (e.stern) c1.push(para([run('★ Zusatzseite', { size: 17, italics: true, color: GREY })], { alignment: D.AlignmentType.CENTER, spacing: { before: 20, after: 0 } }));
  const c2 = [para([run(e.kontext)], { spacing: { after: 70, line: 252 } }), para([run('Aufgaben: ', { bold: true }), run(e.aufgaben)], { spacing: { after: 0, line: 252 } })];
  const c3 = [para([run(e.mathe)], { spacing: { after: 0, line: 252 } })];
  const c4 = e.material.map((m, i) => new D.Paragraph({ children: [run(m)], numbering: { reference: 'punkte', level: 0 }, spacing: { after: i < e.material.length - 1 ? 30 : 0, line: 252 } }));
  return new D.TableRow({ cantSplit: true, children: [cell(c1, COLW[0], { shading: { type: D.ShadingType.CLEAR, fill: SAND, color: 'auto' } }), cell(c2, COLW[1]), cell(c3, COLW[2]), cell(c4, COLW[3])] });
});

/* Hinweise: aufeinanderfolgende Absätze mit gleichem Rahmen ergeben einen Kasten */
const box = { style: D.BorderStyle.SINGLE, size: 12, color: INK, space: 6 };
const boxB = { top: box, bottom: box, left: box, right: box };
const boxP = (children, o = {}) => new D.Paragraph({ children, border: boxB, shading: { type: D.ShadingType.CLEAR, fill: PAPER, color: 'auto' }, indent: { left: 140, right: 140 }, spacing: { after: 60, line: 252 }, keepNext: true, keepLines: true, ...o });
const hinweise = [
  boxP([run('◆  Hinweise', { font: HEAD, bold: true, size: 26 })], { spacing: { before: 0, after: 80 } }),
  ...HINWEISE.map(([a, b], i) => boxP([run(a, { bold: true }), run(b)], i === HINWEISE.length - 1 ? { keepNext: false } : {})),
];

const doc = new D.Document({
  creator: 'Prozentrechnung RPG', title: 'Powergaming mit Prozenten – Übersicht über alle Einheiten',
  styles: { default: { document: { run: { font: BODY, size: 19, color: INK } } } },
  numbering: { config: [{ reference: 'punkte', levels: [{ level: 0, format: D.LevelFormat.BULLET, text: '•', alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 240, hanging: 180 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: PAGE_H, height: PAGE_W, orientation: D.PageOrientation.LANDSCAPE }, margin: { top: 850, bottom: 850, left: MARGIN, right: MARGIN } } },
    footers: { default: new D.Footer({ children: [new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [run('Seite ', { size: 16, italics: true, color: GREY }), new D.TextRun({ children: [D.PageNumber.CURRENT], font: BODY, size: 16, italics: true, color: GREY }), run(' von ', { size: 16, italics: true, color: GREY }), new D.TextRun({ children: [D.PageNumber.TOTAL_PAGES], font: BODY, size: 16, italics: true, color: GREY })] })] }) },
    children: [
      new D.Paragraph({ alignment: D.AlignmentType.CENTER, shading: { type: D.ShadingType.CLEAR, fill: INK, color: 'auto' }, spacing: { before: 0, after: 0 }, children: [run('U N T E R R I C H T S V O R H A B E N', { font: HEAD, bold: true, size: 19, color: CREAM })] }),
      new D.Paragraph({ alignment: D.AlignmentType.CENTER, shading: { type: D.ShadingType.CLEAR, fill: INK, color: 'auto' }, spacing: { before: 0, after: 100 }, children: [run('Powergaming mit Prozenten', { font: HEAD, bold: true, size: 44, color: 'FFFFFF' })] }),
      new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { after: 160 }, children: [run('Übersicht über alle Einheiten  ·  ein Rollenspiel zur Prozentrechnung für Klasse 7', { font: HEAD, italics: true, size: 24 })] }),
      new D.Table({ width: { size: CONTENT, type: D.WidthType.DXA }, columnWidths: COLW, rows: [kopf, ...zeilen] }),
      new D.Paragraph({ spacing: { before: 0, after: 160 }, children: [] }),
      ...hinweise,
    ],
  }],
});
const out = path.join(ROOT, 'pptx', dateinamen.uvDocx);
D.Packer.toBuffer(doc).then(b => { fs.writeFileSync(out, b); console.log('geschrieben', out); });
