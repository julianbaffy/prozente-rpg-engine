/* Powergaming mit Prozenten – Schadensrechner im Browser.
 * Alle Zahlen kommen aus der Rechenmaschine (../engine.js) und den Daten (../gegenstaende.json).
 * Hier wird nur dargestellt, nicht gerechnet (außer Bonus = Schaden − Grundschaden und Summen). */
import { erzeuge } from '../engine.js';
import * as kt from '../layout/kartentext.js';   // dieselben Kartentexte wie die gedruckten Gegenstandskarten

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

const MAX_N = 60;            // höchstens so viele Angriffe im Verlauf
let rpg, daten;
let einheiten = [];         // [{nr, titel, ids}] – welche Gegenstände/Gegner im Arbeitsblatt der Einheit vorkommen
const zu = new Set();      // eingeklappte Abschnitte
const zustand = {
  waffe: null, ruestung: null, zauber: null, nachtraeglichAuf: '', gegner: null,
  n: null,                     // Anzahl Angriffe im Verlauf (null = automatisch)
  stufe: null,                 // gewählte Stufen, z. B. '3,8' (null = alle)
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
/** Wie replaceChildren, überspringt aber null/false und glättet Arrays. */
const fuellen = (ziel, ...kinder) => ziel.replaceChildren(...kinder.flat(Infinity).filter(k => k !== null && k !== undefined && k !== false));
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
const gewaehlteStufen = () => (zustand.stufe ? zustand.stufe.split(',').map(Number) : []);
/** Sichtbar ist, was in einem Arbeitsblatt der gewählten Stufen vorkommt (keine Stufe gewählt = alles). */
const sichtbar = item => {
  const st = gewaehlteStufen();
  return !st.length || einheiten.some(e => st.includes(e.nr) && e.ids.has(item.id));
};

/* ---------- Zustand in der Adresse (Link teilen, Neuladen) ---------- */
const SCHLUESSEL = ['waffe', 'ruestung', 'zauber', 'nachtraeglichAuf', 'gegner', 'n', 'stufe', 'modus', 'rechenweg'];
function ausAdresse() {
  const p = new URLSearchParams(location.hash.slice(1));
  for (const k of SCHLUESSEL) if (p.has(k)) zustand[k] = p.get(k) || (k === 'nachtraeglichAuf' ? '' : null);
  SLOTS.forEach(s => { const id = zustand[s.key]; if (id && !daten.gegenstaende.some(i => i.id === id && i.slot === s.key)) zustand[s.key] = null; });
  if (zustand.gegner && !daten.gegner.some(g => g.id === zustand.gegner)) zustand.gegner = null;
  const gueltig = gewaehlteStufen().filter(n => einheiten.some(e => e.nr === n));
  zustand.stufe = gueltig.length ? [...new Set(gueltig)].sort((a, b) => a - b).join(',') : null;
  zustand.n = zustand.n && Number(zustand.n) >= 1 ? Math.min(MAX_N, Math.round(Number(zustand.n))) : null;
}
function inAdresse() {
  const p = new URLSearchParams();
  for (const k of SCHLUESSEL) if (zustand[k]) p.set(k, zustand[k]);
  history.replaceState(null, '', '#' + p.toString());
}

/* ---------- Texte ---------- */
function aufbauText(a) {
  if (a.art === 'zins') return `Jeder Angriff macht ${zahl(a.prozent)} % mehr Schaden als der vorherige.`;
  if (a.art === 'linear') return a.betrag !== undefined ? `Jeder Angriff macht ${zahl(a.betrag)} SP mehr als der vorherige.` : `Jeder Angriff macht ${zahl(a.prozent)} % des ersten Angriffs mehr.`;
  return '';
}

/* ---------- Karten wie im Material (Texte aus layout/kartentext.js, wie die gedruckten Karten) ---------- */
function bildKarte(id, name) {
  return el('img', { class: 'karte-bild', src: ICONS + id + '.jpg', alt: name, width: 300, height: 300 });
}
function karteRahmen(name, typ, inhalt, fuss) {
  return el('article', { class: 'karte' },
    el('h3', { class: 'karte-name' }, name),
    el('p', { class: 'karte-typ' }, typ),
    el('div', { class: 'karte-inhalt' }, inhalt),
    fuss);
}
/** Gegenstandskarte: Bild, Schadenstabelle (nur Waffen), fett die Modifikatoren/Effekte, unten das Würfelband. */
function gegenstandKarte(it, extra = null) {
  const tb = kt.tabelle(it);
  let tabelle = null;
  if (tb.length) {
    const fest = kt.alleFest(tb);
    const kopf = fest ? ['Schadensart', kt.KOPF_FEST] : ['Schadensart', 'Min', 'Mittel', 'Max'];
    tabelle = el('table', { class: 'karte-tabelle' },
      el('thead', {}, el('tr', {}, kopf.map(k => el('th', { scope: 'col' }, k)))),
      el('tbody', {}, tb.map(z => el('tr', {}, el('th', { scope: 'row' }, z.quelle),
        (fest ? [z.mittel] : [z.min, z.mittel, z.max]).map(v => el('td', {}, zahl(v)))))));
  }
  const mods = kt.modZeilen(it);
  const beschreibung = it.beschreibung && !tb.length && !kt.absolutZeilen(it).length ? it.beschreibung : null;
  return karteRahmen(it.name, it.typ, [
    bildKarte(it.id, it.name),
    el('div', { class: 'karte-rechts' }, tabelle,
      mods.length ? el('ul', { class: 'karte-mods' }, mods.map(m => el('li', {}, m))) : null,
      beschreibung ? el('p', { class: 'karte-text' }, beschreibung) : null,
      extra)
  ], kt.hatWuerfel(it) ? el('p', { class: 'karte-wuerfel' }, 'Würfel:  1–2 = Min ·  3–4 = Mittel ·  5–6 = Max') : null);
}
/** Gegnerkarte: Bild, Lebenspunkte, Eigenschaften. */
function gegnerKarte(g) {
  return karteRahmen(g.name, 'Gegner', [
    bildKarte(g.id, g.name),
    el('div', { class: 'karte-rechts' },
      el('p', { class: 'karte-lp' }, `Lebenspunkte (LP): ${zahl(g.lp)}`),
      el('ul', { class: 'karte-mods' }, kt.gegnerZeilen(g).map(z => el('li', {}, z))))
  ], null);
}
const karteVon = id => (daten.gegner.some(g => g.id === id) ? gegnerKarte(rpg.gegner(id)) : gegenstandKarte(rpg.item(id)));

/* ---------- Karte beim Zeigen (Maus), Tippen (Touch) oder Tastatur-Fokus ----------
 * Maus: erst nach kurzer Verzögerung (Durchfahren des Rasters zeigt nichts), danach beim Weiterwandern sofort.
 * Tastatur und Wechsel zwischen Icons: ohne Animation. Ein-/Ausblenden über CSS-Transitions (.offen, .sofort). */
const VERZOEGERUNG = 250, WARM = 300;      // ms
const pop = { el: null, id: null, fest: false, zeiger: 'mouse', offen: false, timer: 0, warmBis: 0 };
function zeigeKarte(id, anker, fest = false, sofort = false) {
  clearTimeout(pop.timer);
  if (!anker) return versteckeKarte(true);
  const warOffen = pop.offen;
  if (pop.id !== id) fuellen(pop.el, karteVon(id));
  pop.id = id; pop.fest = fest;
  const r = anker.getBoundingClientRect(), b = pop.el.offsetWidth, h = pop.el.offsetHeight, rand = 8;
  const unten = r.bottom + 8 + h <= innerHeight - rand || r.top - 8 - h < rand;
  let y = unten ? r.bottom + 8 : r.top - 8 - h;
  y = Math.max(rand, Math.min(y, innerHeight - h - rand));
  const x = Math.max(rand, Math.min(r.left + r.width / 2 - b / 2, innerWidth - b - rand));
  pop.el.style.left = x + 'px'; pop.el.style.top = y + 'px';
  // Herkunft: die Karte wächst aus dem Icon heraus (unter dem Icon von oben, über dem Icon von unten)
  pop.el.dataset.seite = unten ? 'unten' : 'oben';
  pop.el.style.transformOrigin = `${Math.round(r.left + r.width / 2 - x)}px ${unten ? '0' : '100%'}`;
  pop.el.classList.toggle('sofort', warOffen || sofort);
  void pop.el.offsetWidth;                 // Startzustand festhalten, dann einblenden
  pop.el.classList.add('offen');
  pop.el.setAttribute('aria-hidden', 'false');
  pop.offen = true;
}
function versteckeKarte(auchFest = false) {
  clearTimeout(pop.timer);
  if (pop.fest && !auchFest) return;
  if (pop.offen) pop.warmBis = performance.now() + WARM;
  pop.el.classList.remove('sofort', 'offen');      // Ausblenden immer mit (kurzer) Transition
  pop.el.setAttribute('aria-hidden', 'true');
  pop.offen = false; pop.id = null; pop.fest = false;
}

/* ---------- Auswahl: nur Icons ---------- */
function kachel(item, slot, onwahl) {
  const id = item.id;
  return el('button', {
    type: 'button', class: 'kachel', 'aria-pressed': String(zustand[slot] === id), 'aria-label': item.name, 'data-fokus': 'k-' + id, 'data-id': id, 'data-slot': slot,
    onpointerdown: ev => { pop.zeiger = ev.pointerType; },
    onpointerenter: ev => {
      if (ev.pointerType !== 'mouse') return;
      const anker = ev.currentTarget;
      if (pop.offen || performance.now() < pop.warmBis) zeigeKarte(id, anker, false, true);
      else { clearTimeout(pop.timer); pop.timer = setTimeout(() => zeigeKarte(id, anker), VERZOEGERUNG); }
    },
    onpointerleave: ev => { if (ev.pointerType === 'mouse') versteckeKarte(); },
    onfocus: ev => { if (ev.currentTarget.matches(':focus-visible')) zeigeKarte(id, ev.currentTarget, false, true); },   // Tastatur: ohne Animation
    onblur: () => { if (!pop.fest) versteckeKarte(); },
    onclick: ev => {
      const touch = pop.zeiger === 'touch' || pop.zeiger === 'pen';
      onwahl();
      // Auf Touch-Geräten bleibt die Karte des getippten Icons stehen, bis woanders getippt wird
      if (touch) zeigeKarte(id, ev.currentTarget, true);
    }
  }, el('img', { src: ICONS + id + '.jpg', alt: '', loading: 'lazy', width: 300, height: 300, draggable: 'false' }));
}

function wahlText(key) {
  if (key === 'gegner') return zustand.gegner ? rpg.gegner(zustand.gegner).name : '– ohne Gegner –';
  return zustand[key] ? rpg.item(zustand[key]).name : '– nichts gewählt –';
}
function abschnitt(key, titel, inhalt, klasse = '') {
  return el('details', { class: 'slot ' + klasse, open: !zu.has(key), ontoggle: ev => { if (ev.target.open) zu.delete(key); else zu.add(key); } },
    el('summary', {}, el('span', { class: 'slot-titel' }, titel), el('span', { class: 'slot-wahl', 'data-slot': key }, wahlText(key))),
    inhalt);
}

/* Das Raster wird nur neu gebaut, wenn sich die Stufe ändert. Sonst werden nur Auswahl und Beschriftung angepasst –
 * so bleiben die Icons dieselben Elemente, und Übergänge (goldener Rand) können laufen. */
let rasterStufe = null;
function zeichneAuswahl() {
  const ziel = $('#auswahl');
  if (rasterStufe === zustand.stufe && ziel.childElementCount) {
    ziel.querySelectorAll('.kachel').forEach(k => k.setAttribute('aria-pressed', String(zustand[k.dataset.slot] === k.dataset.id)));
    ziel.querySelectorAll('.slot-wahl').forEach(sp => { sp.textContent = wahlText(sp.dataset.slot); });
    return;
  }
  rasterStufe = zustand.stufe;
  ziel.replaceChildren();
  SLOTS.forEach(s => {
    const items = daten.gegenstaende.filter(i => i.slot === s.key && sichtbar(i));
    if (!items.length) return;              // in den gewählten Stufen keine Gegenstände dieser Art: Abschnitt weglassen
    ziel.append(abschnitt(s.key, s.titel,
      el('div', { class: 'raster', role: 'group', 'aria-label': s.titel }, items.map(i => kachel(i, s.key, () => {
          zustand[s.key] = zustand[s.key] === i.id ? null : i.id;      // nochmal tippen = abwählen
          if (s.key === 'ruestung') zustand.nachtraeglichAuf = '';
          aktualisieren();
        })))));
  });
  const gegner = daten.gegner.filter(sichtbar);
  if (gegner.length) ziel.append(abschnitt('gegner', 'Gegner',
    el('div', { class: 'raster', role: 'group', 'aria-label': 'Gegner' }, gegner.map(x => kachel(x, 'gegner', () => {
        zustand.gegner = zustand.gegner === x.id ? null : x.id;
        aktualisieren();
      }))), 'slot-gegner'));
}

/* ---------- Ausrüstung: die gewählten Karten untereinander ---------- */
function ablegen(titel, onclick) {
  return el('button', { type: 'button', class: 'ablegen', 'aria-label': titel + ' ablegen', title: 'ablegen', 'data-fokus': 'ab-' + titel, onclick }, '✕');
}
function zeichneAusruestung() {
  const teile = SLOTS.map(s => {
    const it = zustand[s.key] ? rpg.item(zustand[s.key]) : null;
    if (!it && !daten.gegenstaende.some(i => i.slot === s.key && sichtbar(i))) return null;   // Art kommt nicht vor
    if (!it) return el('div', { class: 'platz leer' }, el('span', { class: 'platz-titel' }, s.titel), el('p', { class: 'karte-leer' }, `${s.key === 'zauber' ? 'Kein' : 'Keine'} ${s.titel} gewählt`));
    let extra = null;
    if ((it.effekte || []).some(e => e.typ === 'nachtraeglich')) {
      const sel = el('select', { 'data-fokus': 'nachhall', onchange: ev => { zustand.nachtraeglichAuf = ev.target.value; aktualisieren(); } },
        el('option', { value: '' }, 'automatisch (höchster Mittelwert)'),
        daten.quellen.map(q => el('option', { value: q, selected: zustand.nachtraeglichAuf === q }, q)));
      extra = el('label', { class: 'karte-wahl' }, 'Nachhall wirkt auf ', sel);
    }
    return el('div', { class: 'platz' }, el('span', { class: 'platz-titel' }, s.titel),
      ablegen(s.titel, () => { zustand[s.key] = null; if (s.key === 'ruestung') zustand.nachtraeglichAuf = ''; aktualisieren(); }),
      gegenstandKarte(it, extra));
  });
  const g = zustand.gegner ? rpg.gegner(zustand.gegner) : null;
  if (g) teile.push(el('div', { class: 'platz platz-gegner' }, el('span', { class: 'platz-titel' }, 'Gegner'),
    ablegen('Gegner', () => { zustand.gegner = null; aktualisieren(); }), gegnerKarte(g)));
  fuellen($('#ausruestung-karten'), teile);
}

/* ---------- Einstellungen ---------- */
function umschalter(ziel, optionen, key) {
  fuellen(ziel, ...optionen.map(o => el('button', {
    type: 'button', 'aria-pressed': String(zustand[key] === o.key), 'data-fokus': key + '-' + o.key,
    onclick: () => { zustand[key] = o.key; aktualisieren(); }
  }, o.titel, o.klein ? el('small', {}, o.klein) : null)));
}
function zeichneEinstellungen() {
  const st = gewaehlteStufen();
  fuellen($('#stufe'),
    el('button', { type: 'button', 'aria-pressed': String(!st.length), 'data-fokus': 'stufe-alle', onclick: () => stufeWaehlen(null) }, 'Alle'),
    einheiten.map(e => el('button', {
      type: 'button', 'aria-pressed': String(st.includes(e.nr)), 'data-fokus': 'stufe-' + e.nr,
      title: `Stufe ${e.nr}: ${e.titel}`, 'aria-label': `Stufe ${e.nr}: ${e.titel}`, onclick: () => stufeWaehlen(e.nr)
    }, String(e.nr))));
  umschalter($('#modus'), [...MODI.map(m => ({ key: m.key, titel: m.titel, klein: `🎲 ${m.wuerfel}` })), { key: 'alle', titel: 'Alle' }], 'modus');
  umschalter($('#rechenweg'), [{ key: 'bonus', titel: 'Bonus', klein: 'Einheit 1–3' }, { key: 'faktor', titel: 'Faktor', klein: 'ab Einheit 4' }], 'rechenweg');
}

/* ---------- Ergebnis-Tabelle ---------- */
function modZelle(q) {
  const liste = q.modifikatoren;
  const teile = liste.map(m => el('div', {}, `${prozent(m.prozent)} `, el('span', { class: 'von' }, m.von)));
  if (liste.length > 1) teile.push(el('div', { class: 'summe' }, `= ${prozent(q.modifikatorSumme)}`));
  if (q.nachtraeglichFaktor) teile.push(el('div', { class: 'nachhall' }, `danach × ${faktorText(q.nachtraeglichFaktor)}`));
  return el('td', { class: 'mods' }, teile.length ? el('div', { class: 'mods-liste' }, teile) : '–');
}

function zeichneErgebnis() {
  const ziel = $('#ergebnis');
  const b = build();
  if (!Object.keys(b).some(k => SLOTS.some(s => s.key === k))) {
    fuellen(ziel, el('p', { class: 'hinweis' }, 'Wähle oben mindestens einen Gegenstand.'));
    return;
  }
  const profil = rpg.profil(b);
  const g = zustand.gegner ? rpg.gegner(zustand.gegner) : null;
  const treffer = g ? rpg.treffer(b, g) : null;
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
    wert('Schaden'),
    g ? el('th', { scope: 'col', rowspan: mehrere ? 2 : 1, class: 'gegner-spalte' }, `Faktor ${g.name}`) : null,
    g ? wert('Treffer') : null);
  const kopf2 = mehrere ? el('tr', { class: 'unterkopf' },
    [0, 1, 2, 3].filter(i => (bonusSpalte || i !== 1) && (g || i !== 3)).flatMap(() => modi.map(m => el('th', { scope: 'col' }, m.titel)))) : null;

  const summe = { basis: {}, bonus: {}, schaden: {}, treffer: {} };
  modi.forEach(m => { summe.basis[m.key] = 0; summe.bonus[m.key] = 0; summe.schaden[m.key] = 0; summe.treffer[m.key] = 0; });

  const koerper = zeilen.map(q => {
    const p = profil[q];
    const leer = p.basis.max === 0;
    const zellen = [el('th', { scope: 'row', class: 'art art-' + q.toLowerCase() }, q)];
    modi.forEach(m => { summe.basis[m.key] += p.basis[m.key]; zellen.push(el('td', { class: 'num' }, zahl(p.basis[m.key]))); });
    zellen.push(modZelle(p));
    if (bonusSpalte) modi.forEach(m => { const bo = p[m.key] - p.basis[m.key]; summe.bonus[m.key] += bo; zellen.push(el('td', { class: 'num' }, (bo >= 0 ? '+' : '−') + zahl(Math.abs(bo)))); });
    else zellen.push(el('td', { class: 'num' }, '× ' + faktorText(p.faktor) + (p.nachtraeglichFaktor ? ` × ${faktorText(p.nachtraeglichFaktor)}` : '')));
    modi.forEach(m => { summe.schaden[m.key] += p[m.key]; zellen.push(el('td', { class: 'num schaden' }, zahl(p[m.key]))); });
    if (g) {
      const t = treffer.proQuelle[q];
      const f = t.widerstandsFaktor;
      zellen.push(el('td', { class: 'num gegner-spalte' + (f === 0 ? ' immun' : f < 1 ? ' widerstand' : f > 1 ? ' anfaellig' : '') },
        f === 0 ? 'immun' : f === 1 ? '–' : '× ' + faktorText(f)));
      modi.forEach(m => { summe.treffer[m.key] += t[m.treffer]; zellen.push(el('td', { class: 'num treffer' }, zahl(t[m.treffer]))); });
    }
    return el('tr', { class: leer ? 'leer' : null, title: leer ? 'kein Grundschaden – die Modifikatoren wirken auf 0' : null }, zellen);
  });

  const fuss = el('tr', {},
    el('th', { scope: 'row' }, 'Gesamt'),
    modi.map(m => el('td', { class: 'num' }, zahl(summe.basis[m.key]))),
    el('td', {}),
    bonusSpalte ? modi.map(m => el('td', { class: 'num' }, (summe.bonus[m.key] >= 0 ? '+' : '−') + zahl(Math.abs(summe.bonus[m.key])))) : el('td', {}),
    modi.map(m => el('td', { class: 'num schaden' }, zahl(summe.schaden[m.key]) + ' SP')),
    g ? el('td', { class: 'gegner-spalte' }) : null,
    g ? modi.map(m => el('td', { class: 'num treffer' }, zahl(treffer[m.treffer]) + ' SP')) : null);

  const tabelle = el('table', { class: 'werte' + (mehrere ? ' fest-links' : ' stapel') },
    el('thead', {}, kopf1, kopf2),
    el('tbody', {}, koerper.length ? koerper : el('tr', {}, el('td', { colspan: 99, class: 'hinweis' }, 'Diese Ausrüstung macht keinen Schaden.'))),
    el('tfoot', {}, fuss));
  if (!mehrere) {             // Beschriftungen für die Kartenansicht auf dem Handy
    const titel = [...kopf1.children].map(th => th.textContent);
    tabelle.querySelectorAll('tbody tr, tfoot tr').forEach(tr => [...tr.children].forEach((z, i) => { if (i > 0 && titel[i]) z.dataset.label = titel[i]; }));
  }
  fuellen(ziel, 
    rahmen(tabelle),
    el('p', { class: 'erklaerung' }, bonusSpalte
      ? 'Bonus = Grundschaden · Modifikator; Schaden = Grundschaden + Bonus. Modifikatoren auf dieselbe Schadensart werden addiert.'
      : 'Schaden = Grundschaden · (1 + Summe der Modifikatoren). Modifikatoren auf dieselbe Schadensart werden addiert.'),
    g ? el('p', { class: 'erklaerung' }, `Treffer = Schaden · Faktor des Gegners (Widerstand verringert, Anfälligkeit erhöht, immun = 0).`) : null,
    g ? kampfBlock(b, g, modi) : null);
}

/* ---------- Kampf gegen den gewählten Gegner ---------- */
function kampfBlock(b, g, modi) {
  const titel = el('h3', {}, `Kampf gegen ${g.name} (${zahl(g.lp)} LP)`);
  if (!b.waffe) return el('div', { class: 'kampf' }, titel, el('p', { class: 'hinweis' }, 'Für einen Kampf brauchst du eine Waffe.'));
  const waffe = rpg.item(b.waffe);
  const apr = waffe.angriffeProRunde || 1;
  const zeilen = modi.map(m => {
    const k = rpg.kampf(b, g, { modus: m.treffer });
    const drei = rpg.schadenNachRunden(b, g, 3, m.treffer);
    return el('tr', {},
      el('th', { scope: 'row' }, `${m.titel} `, el('small', {}, `🎲 ${m.wuerfel}`)),
      el('td', { class: 'num' }, zahl(rpg.treffer(b, g)[m.treffer]) + ' SP'),
      el('td', { class: 'num' }, zahl(drei) + ' SP', drei + 1e-9 >= g.lp ? el('span', { class: 'ok' }, ' ✔') : null),
      k.besiegt
        ? el('td', { class: 'num stark' }, `${k.angriffe} Treffer` + (apr > 1 ? ` (${k.runden} ${k.runden === 1 ? 'Runde' : 'Runden'})` : ''))
        : el('td', { class: 'num nicht' }, 'nicht zu besiegen'));
  });
  return el('div', { class: 'kampf' }, titel,
    rahmen(el('table', { class: 'werte' },
      el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Wurf'), el('th', { scope: 'col' }, waffe.aufbau ? '1. Treffer' : 'pro Treffer'),
        el('th', { scope: 'col' }, 'nach 3 Runden'), el('th', { scope: 'col' }, 'bis zum Sieg'))),
      el('tbody', {}, zeilen))),
    el('p', { class: 'erklaerung' }, `Jeder Treffer mit demselben Wurf. ${apr > 1 ? `${waffe.name}: ${apr} Angriffe pro Runde. ` : ''}${waffe.aufbau ? aufbauText(waffe.aufbau) : ''}`));
}

/* ---------- Verlauf (Zins-Waffen) ---------- */
/** „Schöne“ Achsenschritte: 1, 2, 5 · 10^k */
function achse(max, teile = 5) {
  const roh = max / teile, p = Math.pow(10, Math.floor(Math.log10(roh || 1)));
  const schritt = [1, 2, 5, 10].map(f => f * p).find(x => x >= roh) || p * 10;
  const oben = Math.ceil(max / schritt) * schritt || schritt;
  return { oben, ticks: Array.from({ length: Math.round(oben / schritt) + 1 }, (_, i) => i * schritt) };
}

const SVG = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, ...kinder) => {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) e.setAttribute(k, v);
  kinder.flat().forEach(k => k !== null && k !== undefined && e.append(k));
  return e;
};

/** Säulendiagramm über die Angriffe. werte = Zahlen je Angriff; opt.linie = waagerechte Linie { wert, text, klasse };
 *  opt.markiere = Index der hervorgehobenen Säule (Sieg). */
function diagramm(zeilen, werte, opt = {}) {
  const schmal = innerWidth < 600;                       // auf dem Handy schmaleres Koordinatensystem = größere Schrift
  const B = schmal ? 380 : 640, H = schmal ? 230 : 250, L = 46, R = 10, O = 16, U = 38;
  const w = B - L - R, h = H - O - U, n = zeilen.length;
  const a = achse(Math.max(...werte, opt.linie ? opt.linie.wert : 0) * 1.05);
  const y = v => O + h - v / a.oben * h;
  const breite = w / n;
  const teile = [];
  a.ticks.forEach(t => teile.push(
    svg('line', { x1: L, x2: L + w, y1: y(t), y2: y(t), class: 'gitter' }),
    svg('text', { x: L - 6, y: y(t) + 4, 'text-anchor': 'end', class: 'achse' }, zahl(t))));
  werte.forEach((v, i) => teile.push(svg('rect', {
    x: L + i * breite + breite * 0.15, y: y(v), width: breite * 0.7, height: Math.max(0, O + h - y(v)),
    class: 'saeule' + (i === opt.markiere ? ' sieg' : '') + (opt.klasse ? ' ' + opt.klasse : '')
  }, svg('title', {}, `${zeilen[i].angriff}. Angriff: ${zahl(v)} SP`))));
  const jede = Math.ceil(n / (schmal ? 10 : 15));
  zeilen.forEach((z, i) => { if (i % jede === 0 || i === n - 1) teile.push(svg('text', { x: L + (i + 0.5) * breite, y: O + h + 16, 'text-anchor': 'middle', class: 'achse' }, String(z.angriff))); });
  teile.push(svg('text', { x: L + w / 2, y: H - 3, 'text-anchor': 'middle', class: 'achse titel' }, 'Angriff'));
  if (opt.linie) {
    teile.push(svg('line', { x1: L, x2: L + w, y1: y(opt.linie.wert), y2: y(opt.linie.wert), class: opt.linie.klasse }));
    teile.push(svg('text', { x: L + 6, y: y(opt.linie.wert) - 5, class: 'achse linien-text' }, opt.linie.text));
  }
  return svg('svg', { viewBox: `0 0 ${B} ${H}`, class: 'diagramm', role: 'img', 'aria-label': opt.beschreibung }, teile);
}

function zeichneVerlauf() {
  const bereich = $('#verlauf-bereich');
  const b = build();
  const waffe = b.waffe ? rpg.item(b.waffe) : null;
  if (!waffe || !waffe.aufbau) { bereich.hidden = true; return; }
  bereich.hidden = false;
  const g = zustand.gegner ? rpg.gegner(zustand.gegner) : null;
  const modus = zustand.modus === 'alle' ? MODI[1] : MODI.find(m => m.key === zustand.modus);
  const apr = waffe.angriffeProRunde || 1;
  let n = zustand.n;
  if (!n) {                     // automatisch: bis zum Sieg (mit Gegner), sonst 10 Angriffe
    const k = g ? rpg.kampf(b, g, { modus: modus.treffer }) : null;
    n = k && k.besiegt ? Math.min(MAX_N, k.angriffe) : 10;
  }
  const zeilen = rpg.verlauf(b, g, n, modus.treffer);
  const sieg = g ? zeilen.find(z => z.restLP === 0) : null;

  const eingabe = el('input', { type: 'number', min: 1, max: MAX_N, value: n, inputmode: 'numeric', id: 'anzahl', 'data-fokus': 'anzahl',
    onchange: ev => { const v = Math.round(Number(ev.target.value)); zustand.n = v >= 1 ? Math.min(MAX_N, v) : null; aktualisieren(); } });
  const tabelle = el('table', { class: 'werte verlauf-tabelle' },
    el('thead', {}, el('tr', {},
      el('th', { scope: 'col' }, 'Angriff'),
      apr > 1 ? el('th', { scope: 'col' }, 'Runde') : null,
      el('th', { scope: 'col' }, 'Schaden'),
      el('th', { scope: 'col' }, 'Zuwachs'),
      el('th', { scope: 'col' }, 'Summe'),
      g ? el('th', { scope: 'col', title: `verbleibende LP ${g.name}` }, 'Rest-LP') : null)),
    el('tbody', {}, zeilen.map((z, i) => el('tr', { class: z === sieg ? 'sieg' : null },
      el('th', { scope: 'row', class: 'num' }, String(z.angriff)),
      apr > 1 ? el('td', { class: 'num' }, String(z.runde)) : null,
      el('td', { class: 'num schaden' }, zahl(z.schaden)),
      el('td', { class: 'num' }, i === 0 ? '–' : '+' + zahl(z.schaden - zeilen[i - 1].schaden)),
      el('td', { class: 'num' }, zahl(z.summe)),
      g ? el('td', { class: 'num' }, z.restLP === 0 ? '0 ✔' : zahl(z.restLP)) : null))));

  fuellen($('#verlauf'), 
    el('p', {}, el('strong', {}, waffe.name), ': ', aufbauText(waffe.aufbau), apr > 1 ? ` ${apr} Angriffe pro Runde.` : '',
      ` Wurf: ${modus.titel}${zustand.modus === 'alle' ? ' (oben Min oder Max wählen)' : ''}.`),
    el('label', { class: 'anzahl' }, 'Angriffe: ', eingabe,
      el('button', { type: 'button', class: 'klein', 'data-fokus': 'n-auto', onclick: () => { zustand.n = null; aktualisieren(); } }, g ? 'bis zum Sieg' : 'zurücksetzen')),
    el('h3', {}, 'Schaden pro Angriff'),
    diagramm(zeilen, zeilen.map(z => z.schaden), {
      linie: { wert: zeilen[0].schaden, text: `1. Angriff: ${zahl(zeilen[0].schaden)} SP (ohne Zuwachs)`, klasse: 'basis' },
      markiere: sieg ? sieg.angriff - 1 : null,
      beschreibung: `Schaden pro Angriff von ${zahl(zeilen[0].schaden)} bis ${zahl(zeilen[n - 1].schaden)} SP` }),
    g ? el('h3', {}, `Gesamtschaden gegen ${g.name}`) : null,
    g ? diagramm(zeilen, zeilen.map(z => z.summe), {
      linie: { wert: g.lp, text: `${g.name}: ${zahl(g.lp)} LP`, klasse: 'lp-linie' },
      markiere: sieg ? sieg.angriff - 1 : null, klasse: 'summe',
      beschreibung: `Gesamtschaden nach ${n} Angriffen: ${zahl(zeilen[n - 1].summe)} SP, Gegner hat ${zahl(g.lp)} LP` }) : null,
    sieg ? el('p', { class: 'stark' }, `${g.name} ist nach ${sieg.angriff} Angriffen besiegt${apr > 1 ? ` (Runde ${sieg.runde})` : ''}.`) : null,
    rahmen(tabelle),
    el('p', { class: 'erklaerung' }, waffe.aufbau.art === 'zins'
      ? `Schaden des n-ten Angriffs = Schaden des 1. Angriffs · ${zahl(1 + waffe.aufbau.prozent / 100)}^(n − 1). Der Zähler beginnt in jedem Kampf neu.`
      : 'Der Zuwachs ist bei jedem Angriff gleich groß (linear). Der Zähler beginnt in jedem Kampf neu.'));
}

/* ---------- Ergebnisleiste unten (bleibt beim Auswählen sichtbar) ---------- */
function zeichneLeiste() {
  const leiste = $('#leiste');
  const b = build();
  if (!SLOTS.some(s => b[s.key])) { leiste.classList.remove('offen'); leiste.setAttribute('aria-hidden', 'true'); return; }
  const g = zustand.gegner ? rpg.gegner(zustand.gegner) : null;
  const t = rpg.treffer(b, g);
  const modi = aktiveModi();
  const werte = modi.map(m => zahl(t[m.treffer])).join(' / ');
  const teile = [el('span', {}, g ? `Treffer gegen ${g.name}` : 'Schaden', modi.length === 1 ? ` (${modi[0].titel})` : '', ': ', el('strong', {}, werte + ' SP'))];
  if (g && b.waffe) {
    const k = rpg.kampf(b, g, { modus: modi.length === 1 ? modi[0].treffer : 'avg' });
    const vorsatz = modi.length === 1 ? '' : 'Mittel: ';
    teile.push(el('span', {}, k.besiegt ? `${vorsatz}${k.angriffe} Treffer bis zum Sieg` : 'nicht zu besiegen'));
  }
  teile.push(el('a', { href: '#ergebnis-titel', onclick: ev => { ev.preventDefault(); $('#ergebnis-titel').scrollIntoView({ behavior: 'smooth' }); } }, 'Tabelle ↓'));
  fuellen(leiste, ...teile);
  leiste.classList.add('offen');            // gleitet beim ersten Mal von unten herein
  leiste.setAttribute('aria-hidden', 'false');
}

/* ---------- Tabellen: Hinweis, dass es nach rechts weitergeht ---------- */
/** Scrollbereich in einer Hülle; die Hülle trägt den Verlauf am rechten Rand (.mehr-rechts). */
function rahmen(tabelle) {
  return el('div', { class: 'tabelle-huelle' }, el('div', { class: 'tabelle-rahmen' }, tabelle));
}
function pruefeScroll(r) {
  r.parentElement?.classList.toggle('mehr-rechts', r.scrollLeft + r.clientWidth < r.scrollWidth - 2);
}
/** Nach dem Neuzeichnen: Zustand sofort setzen (ohne Übergang), animiert wird nur beim Scrollen. */
function pruefeAlleTabellen() {
  const huellen = [...document.querySelectorAll('.tabelle-huelle')];
  huellen.forEach(h => { h.classList.add('sofort'); pruefeScroll(h.firstElementChild); });
  requestAnimationFrame(() => requestAnimationFrame(() => huellen.forEach(h => h.classList.remove('sofort'))));
}

/* ---------- Ablauf ---------- */
function aktualisieren() {
  const fokus = document.activeElement?.dataset?.fokus;      // Fokus nach dem Neuzeichnen wiederherstellen (Tastatur)
  inAdresse();
  zeichneEinstellungen();
  zeichneAuswahl();
  zeichneAusruestung();
  zeichneErgebnis();
  zeichneVerlauf();
  zeichneLeiste();
  if (fokus) document.querySelector(`[data-fokus="${fokus}"]`)?.focus({ preventScroll: true });
  pruefeAlleTabellen();
  if (pop.id) {                 // offene Karte an das neu gezeichnete Icon hängen
    const anker = document.querySelector(`.kachel[data-id="${pop.id}"]`);
    if (anker) zeigeKarte(pop.id, anker, pop.fest, true); else versteckeKarte(true);
  }
}

/* Welche Gegenstände und Gegner braucht eine Stufe? Genau die, die im Arbeitsblatt (einheit-N.json, mit Lösungen)
 * mit Namen vorkommen – das umfasst auch die Übersichten. Stufen ohne Gegenstände (z. B. 5) erscheinen nicht. */
async function ladeEinheiten() {
  const alle = [...daten.gegenstaende, ...daten.gegner];
  const letzte = Math.max(...daten.stufen.map(s => s.nr), ...alle.map(x => x.stufe));   // höchste Einheit (derzeit 9)
  const liste = await Promise.all(Array.from({ length: letzte }, (_, i) => i + 1).map(async nr => {
    try {
      const a = await fetch(`../einheit-${nr}.json`);
      if (!a.ok) return null;
      const text = await a.text();
      const ids = new Set(alle.filter(x => text.includes(x.name)).map(x => x.id));
      return ids.size ? { nr, titel: JSON.parse(text).titel, ids } : null;
    } catch { return null; }
  }));
  return liste.filter(Boolean);
}
/** Stufe an- oder abwählen (Mehrfachauswahl); null = alle. Was danach nicht mehr sichtbar ist, wird abgelegt. */
function stufeWaehlen(nr) {
  let st = gewaehlteStufen();
  st = nr === null ? [] : st.includes(nr) ? st.filter(x => x !== nr) : [...st, nr];
  zustand.stufe = st.length ? st.sort((a, b) => a - b).join(',') : null;
  SLOTS.forEach(s => { if (zustand[s.key] && !sichtbar(rpg.item(zustand[s.key]))) zustand[s.key] = null; });
  if (zustand.gegner && !sichtbar(rpg.gegner(zustand.gegner))) zustand.gegner = null;
  aktualisieren();
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
  einheiten = await ladeEinheiten();
  pop.el = $('#karte-pop');
  document.addEventListener('pointerdown', ev => { if (!ev.target.closest('.kachel, #karte-pop')) versteckeKarte(true); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') versteckeKarte(true); });
  addEventListener('scroll', () => versteckeKarte(true), { passive: true });
  addEventListener('resize', () => { versteckeKarte(true); pruefeAlleTabellen(); });
  document.addEventListener('scroll', ev => { if (ev.target.classList?.contains('tabelle-rahmen')) pruefeScroll(ev.target); }, { capture: true, passive: true });
  matchMedia('(max-width: 599px)').addEventListener('change', zeichneVerlauf);   // Handy gedreht: Diagramm neu zeichnen
  ausAdresse();
  aktualisieren();
}
start();
