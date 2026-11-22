/* Powergaming mit Prozenten – Rechenmaschine
 * Läuft in Node (require) und im Browser (window.RPG).
 *
 *   const daten = require('./gegenstaende.json');
 *   const rpg = require('./engine.js').erzeuge(daten);
 *   rpg.kampf({ waffe: 'mjoelnir', zauber: 'glueckbringender-magnetstein' }, 'eisgolem', { modus: 'avg' });
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RPG = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const EPS = 1e-9;
  const SLOTS = ['waffe', 'ruestung', 'zauber'];

  /* ---------- Einfache Prozentrechnung (für Lösungsblätter) ---------- */
  const rechner = {
    prozentwert: (G, p) => G * p / 100,                              // W = p · G
    steigernUm: (G, p) => G * (1 + p / 100),                         // G · (1 + p)
    verringernUm: (G, p) => G * (1 - p / 100),                       // G · (1 − p)
    auf: (G, a) => G * a / 100,                                      // „auf a %“ = a · G
    prozentsatz: (G, W) => W / G * 100,                              // p = W : G
    aenderung: (G, Wneu) => (Wneu / G - 1) * 100,                    // p der Änderung
    grundwert: (W, p) => W / (p / 100),                              // G = W : p
    grundwertVorAenderung: (Wneu, pAenderung) => Wneu / (1 + pAenderung / 100), // pAenderung < 0 = verringert
    zins: (G, p, n) => G * Math.pow(1 + p / 100, n)                  // G · (1 + p)^n
  };

  function erzeuge(daten) {
    const quellen = daten.quellen;
    const gruppen = daten.gruppen;
    /* Fester Angriffswert: { quelle, wert } gilt als min = mittel = max = wert (kein Würfel nötig). */
    daten.gegenstaende.forEach(i => (i.schaden || []).forEach(sc => { if (sc.wert !== undefined) { sc.min = sc.mittel = sc.max = sc.wert; } }));
    const items = new Map(daten.gegenstaende.map(i => [i.id, i]));
    const gegnerMap = new Map(daten.gegner.map(g => [g.id, g]));

    const item = id => {
      const i = items.get(id);
      if (!i) throw new Error('Unbekannter Gegenstand: ' + id);
      return i;
    };
    const gegner = g => (typeof g === 'string' ? (gegnerMap.get(g) || fehler('Unbekannter Gegner: ' + g)) : g);
    function fehler(m) { throw new Error(m); }

    /** Deckt das Schadensartwort (z. B. ELEMENTAR) die Schadensart (z. B. EIS) ab? */
    const deckt = (wort, quelle) => wort === quelle || (gruppen[wort] || []).includes(quelle);
    const quellenVon = wort => quellen.filter(q => deckt(wort, q));

    const leer = () => Object.fromEntries(quellen.map(q => [q, { min: 0, mittel: 0, max: 0 }]));
    const mittelVon = s => (s.mittel !== undefined ? s.mittel : (s.min + s.max) / 2);
    const prozentVon = m => (m.auf !== undefined ? m.auf - 100 : m.prozent);

    /* ---------- 1. Schadensprofil einer Ausrüstung (ohne Gegner) ---------- */
    function profil(build) {
      const teile = SLOTS.map(s => build[s]).filter(Boolean).map(item);
      const basis = leer();
      teile.forEach(t => (t.schaden || []).forEach(s => {
        basis[s.quelle].min += s.min; basis[s.quelle].mittel += mittelVon(s); basis[s.quelle].max += s.max;
      }));
      const effekte = teile.flatMap(t => t.effekte || []);

      // Umwandlung (vor den Modifikatoren): anteil % jedes Grundschadens -> Zielschadensart
      effekte.filter(e => e.typ === 'umwandlung').forEach(e => {
        quellen.forEach(q => {
          if (q === e.nach) return;
          const mn = basis[q].min * e.anteil / 100, md = basis[q].mittel * e.anteil / 100, mx = basis[q].max * e.anteil / 100;
          basis[q].min -= mn; basis[q].mittel -= md; basis[q].max -= mx;
          basis[e.nach].min += mn; basis[e.nach].mittel += md; basis[e.nach].max += mx;
        });
      });
      // „verursache keinen … Schaden“
      effekte.filter(e => e.typ === 'keinSchaden').forEach(e => {
        e.quellen.flatMap(quellenVon).forEach(q => { basis[q].min = 0; basis[q].mittel = 0; basis[q].max = 0; });
      });

      // Modifikatoren einsammeln (Schadensartwort + Prozent)
      let mods = teile.flatMap(t => (t.modifikatoren || []).map(m => ({ wort: m.quelle, p: prozentVon(m), von: t.name })));
      const umlenk = effekte.find(e => e.typ === 'alleModifikatorenAuf');
      if (umlenk) mods = mods.map(m => ({ wort: umlenk.nach, p: m.p * umlenk.faktor, von: m.von }));

      const ergebnis = {};
      quellen.forEach(q => {
        const summe = mods.filter(m => deckt(m.wort, q)).reduce((a, m) => a + m.p, 0);
        const faktor = Math.max(0, 1 + summe / 100);
        ergebnis[q] = {
          basis: { ...basis[q] }, modifikatorSumme: summe, faktor,
          min: basis[q].min * faktor, mittel: basis[q].mittel * faktor, max: basis[q].max * faktor
        };
      });

      // „nachträglich“ (Helm des Nachhalls): NACH den addierten Modifikatoren wird der fertige Schaden einer frei wählbaren Schadensart
      // noch einmal um x % gesteigert (multipliziert, nicht addiert). build.nachtraeglichAuf wählt die Schadensart,
      // ohne Angabe nimmt die Engine die Schadensart mit dem höchsten Mittelwert.
      const nach = effekte.find(e => e.typ === 'nachtraeglich');
      if (nach) {
        let wahl = build.nachtraeglichAuf;
        if (wahl && !quellen.includes(wahl)) throw new Error('Unbekannte Schadensart: ' + wahl);
        if (!wahl) wahl = quellen.reduce((b, q) => (ergebnis[q].mittel > ergebnis[b].mittel + EPS ? q : b), quellen[0]);
        const nf = 1 + nach.prozent / 100;
        const e = ergebnis[wahl];
        e.vorNachtraeglich = { min: e.min, mittel: e.mittel, max: e.max };
        e.nachtraeglichFaktor = nf;
        e.min *= nf; e.mittel *= nf; e.max *= nf;
      }
      return ergebnis;
    }

    /* ---------- 2. Ein Treffer gegen einen Gegner ---------- */
    function widerstandsFaktor(g, quelle) {
      let summe = 0;
      for (const w of g.widerstaende || []) {
        if (!deckt(w.quelle, quelle)) continue;
        if (w.immun) return 0;
        summe += prozentVon(w);
      }
      return Math.max(0, 1 + summe / 100);
    }

    function treffer(build, g) {
      const gg = g ? gegner(g) : { widerstaende: [] };
      const p = profil(build);
      const out = { min: 0, avg: 0, max: 0, proQuelle: {} };
      quellen.forEach(q => {
        const f = widerstandsFaktor(gg, q);
        const mn = p[q].min * f, md = p[q].mittel * f, mx = p[q].max * f;
        out.proQuelle[q] = { min: mn, avg: md, max: mx, widerstandsFaktor: f };
        out.min += mn; out.max += mx; out.avg += md;
      });
      return out;
    }

    /* ---------- 3. Aufbau („Zinsen“) pro Angriff ---------- */
    /* Schaden des (n+1)-ten Angriffs im Kampf (n = 0 → erster Angriff) aus dem Treffer-Wert `wert`.
       zins:   wert · (1 + p/100)^n            (Zinseszins, p % vom vorherigen Angriff)
       linear: wert + n · betrag               (fester Betrag in SP pro Angriff)  – oder  wert · (1 + n·p/100)  (p % vom Grundschaden) */
    function aufbauAnwenden(waffe, n, wert) {
      const a = waffe.aufbau;
      if (!a) return wert;
      if (a.art === 'zins') return wert * Math.pow(1 + a.prozent / 100, n);
      if (a.art === 'linear') return a.betrag !== undefined ? wert + n * a.betrag : wert * (1 + n * a.prozent / 100);
      throw new Error('Unbekannter Aufbau: ' + a.art);
    }

    /* ---------- 3b. Würfel: 1–2 = Minimum, 3–4 = Mittelwert, 5–6 = Maximum ---------- */
    const WUERFEL = ['min', 'min', 'avg', 'avg', 'max', 'max'];     // Index = Augenzahl − 1
    const wuerfelZuModus = augen => WUERFEL[augen - 1];
    const w6 = (zufall = Math.random) => 1 + Math.floor(zufall() * 6);

    /** Tabelle für Gegenstandskarten: Grundschaden je Schadensart als Min / Mittel / Max.
     *  fest = true: fester Angriffswert (min = mittel = max) → auf Karten nur eine Zelle. */
    const istFest = s => s.min === mittelVon(s) && mittelVon(s) === s.max;
    function itemTabelle(id) {
      return (item(id).schaden || []).map(s => ({ quelle: s.quelle, min: s.min, mittel: mittelVon(s), max: s.max, fest: istFest(s) }));
    }

    /* ---------- 4. Kampf ---------- */
    function kampf(build, g, opt = {}) {
      // opt.wuerfel = Funktion, die pro Angriff eine Augenzahl 1–6 liefert (oder Array von Augenzahlen); sonst opt.modus
      const wf = Array.isArray(opt.wuerfel) ? (i => opt.wuerfel[i]) : opt.wuerfel;
      const modus = opt.modus || 'avg';
      const maxRunden = opt.maxRunden || 200;
      const gg = gegner(g);
      const w = item(build.waffe);
      const apr = w.angriffeProRunde || 1;
      const t = treffer(build, gg);
      let lp = gg.lp, n = 0;
      const log = [];
      for (let runde = 1; runde <= maxRunden; runde++) {
        for (let a = 0; a < apr; a++) {
          const augen = wf ? wf(n) : null;
          const m = augen ? wuerfelZuModus(augen) : modus;
          const sp = aufbauAnwenden(w, n, t[m]);
          lp -= sp; n++;
          log.push({ runde, angriff: n, augen, stufe: m, schaden: sp, restLP: Math.max(0, lp) });
          if (lp <= EPS) return { besiegt: true, runden: runde, angriffe: n, log };
        }
      }
      return { besiegt: false, runden: maxRunden, angriffe: n, log };
    }

    /** Gesamtschaden nach vollen Runden (ohne Lebenspunkte-Grenze). */
    function schadenNachRunden(build, g, runden, modus = 'avg') {
      const w = item(build.waffe);
      const apr = w.angriffeProRunde || 1;
      const t = treffer(build, g);
      let summe = 0;
      for (let n = 0; n < runden * apr; n++) summe += aufbauAnwenden(w, n, t[modus]);
      return summe;
    }
    
    /* ---------- 4b. Duell: beide gleich viele LP, gleichzeitige Angriffe (W6 -> min/Ø/max) ---------- */
    /** Entscheidet die Runde, in der mindestens einer auf 0 LP oder darunter fällt:
     *  Es gewinnt, wer weniger tief im Minus liegt (= mehr Gesamtschaden gemacht hat). Genau gleich = unentschieden. */
    function duellSieger(lpA, lpB) {
      if (lpA > EPS && lpB > EPS) return null;
      if (Math.abs(lpA - lpB) < EPS) return 'unentschieden';
      return lpA > lpB ? 'A' : 'B';
    }

    /** Würfelduell. opt.wuerfelA / opt.wuerfelB: Array von Augenzahlen (pro Runde) oder Funktion(rundenIndex) -> 1–6. */
    function duell(buildA, buildB, lp, opt = {}) {
      const get = w => (Array.isArray(w) ? (i => w[i]) : (w || (() => w6(opt.zufall))));
      const wA = get(opt.wuerfelA), wB = get(opt.wuerfelB);
      const tA = treffer(buildA), tB = treffer(buildB);
      let a = lp, b = lp; const log = [];
      for (let r = 0; r < (opt.maxRunden || 100); r++) {
        const augA = wA(r), augB = wB(r);
        const sA = tA[wuerfelZuModus(augA)], sB = tB[wuerfelZuModus(augB)];
        b -= sA; a -= sB;
        log.push({ runde: r + 1, augenA: augA, schadenA: sA, augenB: augB, schadenB: sB, lpA: a, lpB: b });
        const s = duellSieger(a, b);
        if (s) return { sieger: s, runden: r + 1, log };
      }
      return { sieger: 'offen', runden: opt.maxRunden || 100, log };
    }

    /** Exakte Wahrscheinlichkeiten (jeder Wurf: min, Ø, max mit je 1/3). */
    function duellWahrscheinlichkeit(buildA, buildB, lp) {
      const tA = treffer(buildA), tB = treffer(buildB);
      const wA = [tA.min, tA.avg, tA.max], wB = [tB.min, tB.avg, tB.max];
      const key = (a, b) => a.toFixed(6) + '|' + b.toFixed(6);
      let zustand = new Map([[key(lp, lp), { a: lp, b: lp, p: 1 }]]);
      const res = { A: 0, B: 0, unentschieden: 0, erwarteteRunden: 0 };
      for (let r = 1; r <= 300 && zustand.size; r++) {
        const neu = new Map();
        for (const z of zustand.values()) for (const sA of wA) for (const sB of wB) {
          const p = z.p / 9, a = z.a - sB, b = z.b - sA, s = duellSieger(a, b);
          if (s) { res[s] += p; res.erwarteteRunden += p * r; continue; }
          const k = key(a, b), alt = neu.get(k);
          if (alt) alt.p += p; else neu.set(k, { a, b, p });
        }
        zustand = neu;
      }
      return res;
    }

    /* ---------- 5. Optimierer (nur Gegenstände der Stufen 1–3) ---------- */
    function pool(stufe) {
      const gueltig = i => i.stufe <= Math.min(stufe, 3);
      const proSlot = s => daten.gegenstaende.filter(i => i.slot === s && gueltig(i)).map(i => i.id);
      return { waffe: proSlot('waffe'), ruestung: proSlot('ruestung'), zauber: proSlot('zauber') };
    }

    function alleBuilds(stufe, vollstaendig = false) {
      const p = pool(stufe);
      const mitRuestung = stufe >= 2;
      const r = mitRuestung ? (vollstaendig ? p.ruestung : [null, ...p.ruestung]) : [null];
      const z = vollstaendig ? p.zauber : [null, ...p.zauber];
      const out = [];
      p.waffe.forEach(w => r.forEach(ru => z.forEach(za => out.push({ waffe: w, ruestung: ru, zauber: za }))));
      return out;
    }

    function besteBuilds(stufe, modus = 'avg', anzahl = 5, g = null) {
      return alleBuilds(stufe)
        .map(b => ({ build: b, schaden: treffer(b, g)[modus] }))
        .sort((a, b) => b.schaden - a.schaden)
        .slice(0, anzahl);
    }

    /** Stufe 3: Gibt es zwei Sets, die zusammen alle Monster in `runden` Runden schaffen? */
    function setPaare(modus = 'avg', runden = 3, monster = daten.gegner.filter(x => x.stufe === 3)) {
      const builds = alleBuilds(3, true);
      const tabelle = builds.map(b => monster.map(m => schadenNachRunden(b, m, runden, modus) + EPS >= m.lp));
      const paare = [];
      for (let i = 0; i < builds.length; i++) {
        for (let j = i; j < builds.length; j++) {
          if (monster.every((_, k) => tabelle[i][k] || tabelle[j][k])) paare.push([builds[i], builds[j]]);
        }
      }
      // Welche Monster schafft kein einziges Set allein?
      const unschaffbar = monster.filter((_, k) => !tabelle.some(z => z[k])).map(m => m.name);
      return { anzahlBuilds: builds.length, paare, unschaffbar };
    }

    /* ---------- 6. Lesbare Rechnung (Basis für Lösungsblatt / Druckvorlage) ---------- */
    const fmt = x => (Math.round(x * 100) / 100).toString().replace('.', ',');
    function erklaere(build) {
      const p = profil(build);
      const zeilen = [];
      quellen.forEach(q => {
        if (p[q].basis.max === 0 && p[q].modifikatorSumme === 0) return;
        const b = p[q].basis;
        if (b.max === 0) return;
        zeilen.push(`${q}: Grundschaden ${fmt(b.min)}–${fmt(b.max)}, Modifikatoren ${p[q].modifikatorSumme >= 0 ? '+' : ''}${fmt(p[q].modifikatorSumme)} % ` +
          `→ Faktor ${fmt(p[q].faktor)} → ${fmt(p[q].min)}–${fmt(p[q].max)} SP`);
      });
      return zeilen;
    }

    /* ---------- 7. Quest-Löser (Stufen 4–8) ---------- */
    function loeseQuest(q) {
      return ({ umAuf, prozentsatz, prozentsatzListe, grundwert, grundwertBuild, vergleich, schwelle, zins, zuwachs })[q.typ](q);
    }

    function umAuf(q) {
      const ergebnisse = q.varianten.map(v => {
        const faktor = v.art === 'auf' ? v.p / 100 : (v.richtung === 'steigern' ? 1 + v.p / 100 : 1 - v.p / 100);
        return { ...v, faktor, ergebnis: q.grundwert * faktor, aequivalentUm: (faktor - 1) * 100 };
      });
      const gruppenMap = {};
      ergebnisse.forEach(e => { (gruppenMap[round(e.ergebnis)] = gruppenMap[round(e.ergebnis)] || []).push(e.text); });
      return { ergebnisse, gleichwertig: Object.values(gruppenMap).filter(g => g.length > 1) };
    }
    const round = x => Math.round(x * 1e6) / 1e6;

    function prozentsatz(q) {
      const [g0, g1] = q.grundschaden, [w0, w1] = q.gemessen;
      const f0 = w0 / g0, f1 = w1 / g1;
      return { faktor: f0, prozentsatzAuf: f0 * 100, aenderung: (f0 - 1) * 100,
               konsistent: Math.abs(f0 - f1) < 1e-9,
               rechenweg: `${fmt(w0)} : ${fmt(g0)} = ${fmt(f0)} → ${fmt(f0 * 100)} % des Grundschadens → ${f0 >= 1 ? 'Steigerung' : 'Verringerung'} um ${fmt(Math.abs(f0 - 1) * 100)} %` };
    }

    function prozentsatzListe(q) {
      return { zeilen: q.messungen.map(m => ({ name: m.name, ...prozentsatz(m) })) };
    }

    /** Grundschaden einer Übungswaffe, wenn Rüstung/Zaubergegenstand denselben Schaden verstärken (Boni werden addiert). */
    function grundwertBuild(q) {
      return { zeilen: q.messungen.map(m => {
        const pr = profil({ ruestung: m.ruestung, zauber: m.zauber })[m.quelle];
        return { ...m, summe: pr.modifikatorSumme, faktor: pr.faktor, grundschaden: m.gemessen / pr.faktor };
      }) };
    }

    function grundwert(q) {
      const p = q.handschuhe.prozent;
      const G = q.gemessen / (1 + p / 100);
      const falsch = q.gemessen * (1 - p / 100);     // typischer Fehler: „10 % abziehen“
      return { grundschaden: G, falscheLoesung: falsch,
               lohntSich: G > q.hauptwaffeGrundschaden,
               rechenweg: `G = ${fmt(q.gemessen)} : ${fmt(1 + p / 100)} = ${fmt(G)} (Fehler: ${fmt(q.gemessen)} · ${fmt(1 - p / 100)} = ${fmt(falsch)})` };
    }

    function vergleich(q) {
      const zeilen = q.optionen.map(o => {
        const build = { waffe: o.waffe, zauber: o.zauber };
        const ohne = treffer({ waffe: o.waffe }).avg;
        const mit = treffer(build).avg;
        return { name: o.name, ohneHandschuhe: ohne, mitHandschuhen: mit, absolutMehr: mit - ohne, prozentMehr: (mit / ohne - 1) * 100 };
      });
      return { zeilen, besterSchaden: [...zeilen].sort((a, b) => b.mitHandschuhen - a.mitHandschuhen)[0].name,
               meistAbsolut: [...zeilen].sort((a, b) => b.absolutMehr - a.absolutMehr)[0].name,
               meistProzent: [...zeilen].sort((a, b) => b.prozentMehr - a.prozentMehr)[0].name };
    }

    function zuwachs(q) {
      return { zeilen: q.optionen.map(o => ({ name: o.name, absolut: o.G * o.p / 100, neu: o.G * (1 + o.p / 100), prozent: o.p })) };
    }

    function schwelle(q) {
      const abs = item(q.absolut);
      const absAvg = abs.schaden.reduce((s, x) => s + mittelVon(x), 0);
      const pr = item(q.prozentual).modifikatoren[0].prozent;
      const grenze = absAvg / (pr / 100);          // ab diesem Grundschaden lohnt der Prozentbonus mehr
      const zeilen = q.waffen.map(w => {
        const a = treffer({ waffe: w, zauber: q.absolut }).avg;
        const b = treffer({ waffe: w, zauber: q.prozentual }).avg;
        return { waffe: item(w).name, mitAbsolut: a, mitProzent: b, besser: b > a ? item(q.prozentual).name : item(q.absolut).name };
      });
      return { schwellenGrundschaden: grenze, zeilen };
    }

    /** Runde, ab der Waffe B (kumuliert) mehr Schaden gemacht hat als Waffe A. */
    function ueberholRunde(buildA, buildB, modus = 'avg', max = 200) {
      for (let r = 1; r <= max; r++) {
        if (schadenNachRunden(buildB, null, r, modus) > schadenNachRunden(buildA, null, r, modus) + EPS) return r;
      }
      return null;
    }

    function zins(q) {
      const [a, b] = q.waffen;
      const tabelle = q.gegner.map(gid => {
        const g = gegner(gid);
        const ka = kampf({ waffe: a }, g), kb = kampf({ waffe: b }, g);
        const sieger = ka.runden === kb.runden ? 'gleich schnell' : (ka.runden < kb.runden ? item(a).name : item(b).name);
        return { gegner: g.name, lp: g.lp, [item(a).name]: ka.runden, [item(b).name]: kb.runden, schneller: sieger };
      });
      return { tabelle, ueberholRunde: ueberholRunde({ waffe: a }, { waffe: b }) };
    }

    function zinsTabelle(basis, prozent, n) {
      return Array.from({ length: n }, (_, k) => ({ angriff: k + 1, schaden: rechner.zins(basis, prozent, k) }));
    }

    return { daten, rechner, item, gegner, profil, treffer, kampf, duell, duellWahrscheinlichkeit, schadenNachRunden, w6, wuerfelZuModus, itemTabelle, alleBuilds, besteBuilds,
             setPaare, erklaere, loeseQuest, ueberholRunde, zinsTabelle, fmt };
  }

  return { erzeuge, rechner };
}));
