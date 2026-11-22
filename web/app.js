/* Powergaming mit Prozenten – Schadensrechner im Browser.
 * Alle Zahlen kommen aus der Rechenmaschine (../engine.js) und den Daten (../gegenstaende.json).
 * Hier wird nur dargestellt, nicht gerechnet (außer Bonus = Schaden − Grundschaden und Summen). */
import { erzeuge } from '../engine.js';

const ICONS = '../layout/assets/icons-klein/';
const SLOTS = [
  { key: 'waffe', titel: 'Waffe' },
  { key: 'ruestung', titel: 'Rüstung' },
  { key: 'zauber', titel: 'Zaubergegenstand' }
];
/* Würfel: 1–2 Minimum, 3–4 Mittelwert, 5–6 Maximum. profil() nennt den Mittelwert „mittel“, treffer()/kampf() „avg“. */
const MODI = [
  { key: 'min', titel: 'Min', wuerfel: '1–2', treffer: 'min' },
  { key: 'mittel', titel: 'Mittel', wuerfel: '3–4', treffer: 'avg' },
  { key: 'max', titel: 'Max', wuerfel: '5–6', treffer: 'max' }
];

let rpg, daten;
const zu = new Set();      // eingeklappte Abschnitte
const zustand = {
  waffe: null, ruestung: null, zauber: null, nachtraeglichAuf: '',
  stufe: 'alle',
  modus: matchMedia('(min-width: 760px)').matches ? 'alle' : 'mittel',
  rechenweg: 'bonus'
};

/* ---------- Hilfen ---------- */
const $ = sel => document.querySelector(sel);
const el = (tag, attrs = {}, ...kinder) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kinder.flat()) if (k !== null && k !== undefined && k !== false) e.append(k);
  return e;
};
const zahl = x => rpg.fmt(Math.abs(x) < 1e-9 ? 0 : x);
const prozent = p => (p >= 0 ? '+' : '−') + zahl(Math.abs(p)) + ' %';
const faktorText = f => zahl(f);
const aktiveModi = () => (zustand.modus === 'alle' ? MODI : MODI.filter(m => m.key === zustand.modus));
const build = () => {
  const b = {};
  SLOTS.forEach(s => { if (zustand[s.key]) b[s.key] = zustand[s.key]; });
  if (zustand.nachtraeglichAuf) b.nachtraeglichAuf = zustand.nachtraeglichAuf;
  return b;
};
const sichtbar = item => zustand.stufe === 'alle' || item.stufe <= Number(zustand.stufe);

/* ---------- Zustand in der Adresse (Link teilen, Neuladen) ---------- */
const SCHLUESSEL = ['waffe', 'ruestung', 'zauber', 'nachtraeglichAuf', 'stufe', 'modus', 'rechenweg'];
function ausAdresse() {
  const p = new URLSearchParams(location.hash.slice(1));
  for (const k of SCHLUESSEL) if (p.has(k)) zustand[k] = p.get(k) || (k === 'nachtraeglichAuf' ? '' : null);
  SLOTS.forEach(s => { const id = zustand[s.key]; if (id && !daten.gegenstaende.some(i => i.id === id && i.slot === s.key)) zustand[s.key] = null; });
}
function inAdresse() {
  const p = new URLSearchParams();
  for (const k of SCHLUESSEL) if (zustand[k]) p.set(k, zustand[k]);
  history.replaceState(null, '', '#' + p.toString());
}

/* ---------- Texte zu Gegenständen ---------- */
function schadenText(s) {
  if (s.min === s.max) return `${zahl(s.min)} ${s.quelle}schaden (fest)`;
  return `${zahl(s.min)} / ${zahl(s.mittel ?? (s.min + s.max) / 2)} / ${zahl(s.max)} ${s.quelle}schaden`;
}
function modText(m) {
  if (m.auf !== undefined) return `${m.quelle}schaden auf ${zahl(m.auf)} %`;
  return `${prozent(m.prozent)} ${m.quelle}schaden`;
}
function effektText(e) {
  switch (e.typ) {
    case 'umwandlung': return `${zahl(e.anteil)} % jedes anderen Grundschadens wird zu ${e.nach}schaden.`;
    case 'keinSchaden': return `Verursacht keinen ${e.quellen.map(q => q + 'schaden').join(' und keinen ')}.`;
    case 'alleModifikatorenAuf': return `Alle Modifikatoren werden ×${zahl(e.faktor)} genommen und wirken auf ${e.nach}schaden.`;
    case 'nachtraeglich': return `Danach wird eine Schadensart noch einmal um ${zahl(e.prozent)} % gesteigert (multipliziert).`;
    default: return e.typ;
  }
}
function aufbauText(a) {
  if (a.art === 'zins') return `Jeder Angriff macht ${zahl(a.prozent)} % mehr Schaden als der vorherige.`;
  if (a.art === 'linear') return a.betrag !== undefined ? `Jeder Angriff macht ${zahl(a.betrag)} SP mehr als der vorherige.` : `Jeder Angriff macht ${zahl(a.prozent)} % des ersten Angriffs mehr.`;
  return '';
}

/* ---------- Auswahl (Grid mit Icons) ---------- */
function kachel(item, gewaehlt, onclick) {
  return el('button', { type: 'button', class: 'kachel', 'aria-pressed': String(gewaehlt), title: item.name, 'data-fokus': 'k-' + item.id, onclick },
    el('img', { src: ICONS + item.id + '.jpg', alt: '', loading: 'lazy', width: 300, height: 300 }),
    el('span', { class: 'kachel-name' }, item.name),
    item.lp !== undefined ? el('span', { class: 'kachel-info' }, `${zahl(item.lp)} LP`) : el('span', { class: 'kachel-info' }, `Stufe ${item.stufe}`));
}

function detailKarte(item) {
  const zeilen = [];
  (item.schaden || []).forEach(s => zeilen.push(el('li', {}, (item.slot === 'waffe' ? '' : '+ ') + schadenText(s))));
  (item.modifikatoren || []).forEach(m => zeilen.push(el('li', {}, modText(m))));
  (item.effekte || []).forEach(e => zeilen.push(el('li', {}, effektText(e))));
  if (item.angriffeProRunde > 1) zeilen.push(el('li', {}, `${item.angriffeProRunde} Angriffe pro Runde`));
  if (item.aufbau) zeilen.push(el('li', {}, aufbauText(item.aufbau)));
  const karte = el('div', { class: 'detail' },
    el('p', { class: 'detail-kopf' }, el('strong', {}, item.name), ` · ${item.typ} · Stufe ${item.stufe}`),
    zeilen.length ? el('ul', {}, zeilen) : null,
    item.beschreibung ? el('p', { class: 'detail-text' }, item.beschreibung) : null);
  if ((item.effekte || []).some(e => e.typ === 'nachtraeglich')) {
    const sel = el('select', { onchange: ev => { zustand.nachtraeglichAuf = ev.target.value; aktualisieren(); } },
      el('option', { value: '' }, 'automatisch (höchster Mittelwert)'),
      daten.quellen.map(q => el('option', { value: q, selected: zustand.nachtraeglichAuf === q }, q)));
    karte.append(el('label', { class: 'detail-wahl' }, 'Nachhall wirkt auf ', sel));
  }
  return karte;
}

function zeichneAuswahl() {
  const ziel = $('#auswahl');
  ziel.replaceChildren();
  SLOTS.forEach(s => {
    const items = daten.gegenstaende.filter(i => i.slot === s.key && sichtbar(i));
    const gewaehlt = zustand[s.key] ? rpg.item(zustand[s.key]) : null;
    const gruppe = el('div', { class: 'raster', role: 'group', 'aria-label': s.titel },
      items.map(i => kachel(i, i.id === zustand[s.key], () => {
        zustand[s.key] = zustand[s.key] === i.id ? null : i.id;      // nochmal tippen = abwählen
        if (s.key === 'ruestung') zustand.nachtraeglichAuf = '';
        aktualisieren();
      })));
    ziel.append(el('details', { class: 'slot', open: !zu.has(s.key), ontoggle: ev => { if (ev.target.open) zu.delete(s.key); else zu.add(s.key); } },
      el('summary', {}, el('span', { class: 'slot-titel' }, s.titel), el('span', { class: 'slot-wahl' }, gewaehlt ? gewaehlt.name : '– nichts gewählt –')),
      items.length ? gruppe : el('p', { class: 'hinweis' }, 'Auf dieser Stufe gibt es noch keine Gegenstände hier.'),
      gewaehlt ? detailKarte(gewaehlt) : null));
  });
}

/* ---------- Einstellungen ---------- */
function umschalter(ziel, optionen, key) {
  ziel.replaceChildren(...optionen.map(o => el('button', {
    type: 'button', 'aria-pressed': String(zustand[key] === o.key), 'data-fokus': key + '-' + o.key,
    onclick: () => { zustand[key] = o.key; aktualisieren(); }
  }, o.titel, o.klein ? el('small', {}, o.klein) : null)));
}
function zeichneEinstellungen() {
  $('#stufe').value = zustand.stufe;
  umschalter($('#modus'), [...MODI.map(m => ({ key: m.key, titel: m.titel, klein: `🎲 ${m.wuerfel}` })), { key: 'alle', titel: 'Alle' }], 'modus');
  umschalter($('#rechenweg'), [{ key: 'bonus', titel: 'Bonus', klein: 'Einheit 1–3' }, { key: 'faktor', titel: 'Faktor', klein: 'ab Einheit 4' }], 'rechenweg');
}

/* ---------- Ergebnis-Tabelle ---------- */
function modZelle(q) {
  const liste = q.modifikatoren;
  const teile = liste.map(m => el('div', {}, `${prozent(m.prozent)} `, el('span', { class: 'von' }, m.von)));
  if (liste.length > 1) teile.push(el('div', { class: 'summe' }, `= ${prozent(q.modifikatorSumme)}`));
  if (q.nachtraeglichFaktor) teile.push(el('div', { class: 'nachhall' }, `danach × ${faktorText(q.nachtraeglichFaktor)}`));
  return el('td', { class: 'mods' }, teile.length ? teile : '–');
}

function zeichneErgebnis() {
  const ziel = $('#ergebnis');
  const b = build();
  if (!Object.keys(b).some(k => SLOTS.some(s => s.key === k))) {
    ziel.replaceChildren(el('p', { class: 'hinweis' }, 'Wähle oben mindestens einen Gegenstand.'));
    return;
  }
  const profil = rpg.profil(b);
  const modi = aktiveModi();
  const mehrere = modi.length > 1;
  const zeilen = daten.quellen.filter(q => profil[q].basis.max > 0 || profil[q].modifikatoren.length > 0);
  const bonusSpalte = zustand.rechenweg === 'bonus';

  // Kopf: bei „Alle“ zweizeilig (Min / Mittel / Max unter jeder Wertespalte)
  const wert = (titel) => el('th', { scope: 'colgroup', colspan: modi.length }, titel);
  const kopf1 = el('tr', {},
    el('th', { scope: 'col', rowspan: mehrere ? 2 : 1 }, 'Schadensart'),
    wert(mehrere ? 'Grundschaden' : `Grundschaden (${modi[0].titel})`),
    el('th', { scope: 'col', rowspan: mehrere ? 2 : 1 }, 'Modifikatoren'),
    bonusSpalte ? wert('Bonus') : el('th', { scope: 'col', rowspan: mehrere ? 2 : 1 }, 'Faktor'),
    wert('Schaden'));
  const kopf2 = mehrere ? el('tr', { class: 'unterkopf' },
    [0, 1, 2].filter(i => bonusSpalte || i !== 1).flatMap(() => modi.map(m => el('th', { scope: 'col' }, m.titel)))) : null;

  const summe = { basis: {}, bonus: {}, schaden: {} };
  modi.forEach(m => { summe.basis[m.key] = 0; summe.bonus[m.key] = 0; summe.schaden[m.key] = 0; });

  const koerper = zeilen.map(q => {
    const p = profil[q];
    const leer = p.basis.max === 0;
    const zellen = [el('th', { scope: 'row', class: 'art art-' + q.toLowerCase() }, q)];
    modi.forEach(m => { summe.basis[m.key] += p.basis[m.key]; zellen.push(el('td', { class: 'num' }, zahl(p.basis[m.key]))); });
    zellen.push(modZelle(p));
    if (bonusSpalte) modi.forEach(m => { const bo = p[m.key] - p.basis[m.key]; summe.bonus[m.key] += bo; zellen.push(el('td', { class: 'num' }, (bo >= 0 ? '+' : '−') + zahl(Math.abs(bo)))); });
    else zellen.push(el('td', { class: 'num' }, '× ' + faktorText(p.faktor) + (p.nachtraeglichFaktor ? ` × ${faktorText(p.nachtraeglichFaktor)}` : '')));
    modi.forEach(m => { summe.schaden[m.key] += p[m.key]; zellen.push(el('td', { class: 'num schaden' }, zahl(p[m.key]))); });
    return el('tr', { class: leer ? 'leer' : null, title: leer ? 'kein Grundschaden – die Modifikatoren wirken auf 0' : null }, zellen);
  });

  const fuss = el('tr', {},
    el('th', { scope: 'row' }, 'Gesamt'),
    modi.map(m => el('td', { class: 'num' }, zahl(summe.basis[m.key]))),
    el('td', {}),
    bonusSpalte ? modi.map(m => el('td', { class: 'num' }, (summe.bonus[m.key] >= 0 ? '+' : '−') + zahl(Math.abs(summe.bonus[m.key])))) : el('td', {}),
    modi.map(m => el('td', { class: 'num schaden' }, zahl(summe.schaden[m.key]) + ' SP')));

  ziel.replaceChildren(
    el('div', { class: 'tabelle-rahmen' },
      el('table', { class: 'werte' },
        el('thead', {}, kopf1, kopf2),
        el('tbody', {}, koerper.length ? koerper : el('tr', {}, el('td', { colspan: 99, class: 'hinweis' }, 'Diese Ausrüstung macht keinen Schaden.'))),
        el('tfoot', {}, fuss))),
    el('p', { class: 'erklaerung' }, bonusSpalte
      ? 'Bonus = Grundschaden · Modifikator; Schaden = Grundschaden + Bonus. Modifikatoren auf dieselbe Schadensart werden addiert.'
      : 'Schaden = Grundschaden · (1 + Summe der Modifikatoren). Modifikatoren auf dieselbe Schadensart werden addiert.'));
}

/* ---------- Ablauf ---------- */
function aktualisieren() {
  const fokus = document.activeElement?.dataset?.fokus;      // Fokus nach dem Neuzeichnen wiederherstellen (Tastatur)
  inAdresse();
  zeichneEinstellungen();
  zeichneAuswahl();
  zeichneErgebnis();
  if (fokus) document.querySelector(`[data-fokus="${fokus}"]`)?.focus({ preventScroll: true });
}

async function start() {
  try {
    const antwort = await fetch('../gegenstaende.json');
    if (!antwort.ok) throw new Error(`gegenstaende.json: ${antwort.status}`);
    daten = await antwort.json();
    rpg = erzeuge(daten);
  } catch (err) {
    document.querySelector('main').replaceChildren(el('p', { class: 'hinweis fehler' },
      'Die Daten konnten nicht geladen werden. Die Seite muss über einen Webserver geöffnet werden (nicht per Doppelklick). ', String(err.message || err)));
    return;
  }
  const stufen = [...new Set(daten.gegenstaende.map(i => i.stufe))].sort((a, b) => a - b);
  $('#stufe').append(...stufen.map(s => el('option', { value: String(s) }, `Stufe ${s}`)));
  $('#stufe').addEventListener('change', ev => {
    zustand.stufe = ev.target.value;
    SLOTS.forEach(s => { if (zustand[s.key] && !sichtbar(rpg.item(zustand[s.key]))) zustand[s.key] = null; });
    aktualisieren();
  });
  ausAdresse();
  aktualisieren();
}
start();
