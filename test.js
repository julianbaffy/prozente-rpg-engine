/* Tests: von Hand nachgerechnete Werte + Plausibilitätsprüfung der Stufen.  Start:  node test.js */
const assert = require('assert');
const daten = require('./gegenstaende.json');
const { erzeuge } = require('./engine.js');
const rpg = erzeuge(daten);
const fmt = rpg.fmt;

let ok = 0;
function gleich(ist, soll, name) {
  assert(Math.abs(ist - soll) < 1e-6, `${name}: erwartet ${soll}, bekommen ${ist}`);
  ok++;
}

/* --- Beispiel aus dem Original-Arbeitsblatt (mit eigenen Testdaten) --- */
{
  const t = erzeuge({
    quellen: daten.quellen, gruppen: daten.gruppen, gegner: [],
    gegenstaende: [
      { id: 'schwert', slot: 'waffe', name: 's', schaden: [{ quelle: 'EIS', min: 5, max: 5 }, { quelle: 'FEUER', min: 10, max: 10 }] },
      { id: 'unterwaesche', slot: 'zauber', name: 'u', modifikatoren: [{ quelle: 'EIS', prozent: 20 }] },
      { id: 'ring', slot: 'ruestung', name: 'r', modifikatoren: [{ quelle: 'ELEMENTAR', prozent: 40 }] }
    ]
  });
  const p = t.profil({ waffe: 'schwert', zauber: 'unterwaesche', ruestung: 'ring' });
  gleich(p.EIS.faktor, 1.6, 'Beispiel: EIS +60 %');
  gleich(p.FEUER.faktor, 1.4, 'Beispiel: FEUER +40 % (im PDF steht fälschlich 20 %)');
}

/* --- Stufe 1 --- */
gleich(rpg.treffer({ waffe: 'mjoelnir', zauber: 'glueckbringender-magnetstein' }).avg, 105, 'Mjölnir + Magnetstein');
gleich(rpg.treffer({ waffe: 'valdorils-vermaechtnis', zauber: 'ring-der-eiskoenigin' }).avg, 87.5, 'Valdoril + Ring der Eiskönigin');
gleich(rpg.treffer({ waffe: 'weltenschaffer', zauber: 'feenstaub' }).avg, 70.5, 'Weltenschaffer + Feenstaub');

/* --- Stufe 2 --- */
gleich(rpg.treffer({ waffe: 'zerreisser-des-seelenfadens', ruestung: 'letzte-bastion', zauber: 'rote-bullentrinkflasche' }).avg, 228, 'Zerreißer+Bastion+Flasche');
gleich(rpg.treffer({ waffe: 'mjoelnir', ruestung: 'wams-des-wahnsinns' }).avg, 83.125, 'Mjölnir + Wams (Umwandlung)');
gleich(rpg.treffer({ waffe: 'beruehrung-des-wahnsinns', ruestung: 'ruestung-der-dunkelheit', zauber: 'feenstaub' }).avg, 122.4, 'Dunkelheit verdoppelt Modifikatoren');
gleich(rpg.treffer({ waffe: 'mjoelnir', ruestung: 'koenigin-des-waldes', zauber: 'glueckbringender-magnetstein' }).avg, 165, 'Königin + Mjölnir + Magnetstein');

/* --- Stufe 3: Widerstände --- */
gleich(rpg.treffer({ waffe: 'valdorils-vermaechtnis' }, 'eisgolem').avg, 0, 'Eisgolem immun gegen EIS');
gleich(rpg.treffer({ waffe: 'weltenschaffer' }, 'eisgolem').avg, 63.75, 'Weltenschaffer vs Eisgolem');
gleich(rpg.treffer({ waffe: 'mjoelnir', zauber: 'glueckbringender-magnetstein' }, 'flederbestie').avg, 65, 'Mjölnir vs Flederbestie');

/* --- Stufe 4: „um“ = „auf“ --- */
{
  const a = rpg.treffer({ waffe: 'verdammnissaeher', zauber: 'wetzstein-der-schaerfe' }).avg;
  const b = rpg.treffer({ waffe: 'verdammnissaeher', zauber: 'rune-der-meisterschaft' }).avg;
  gleich(a, b, 'Wetzstein (+30 %) == Rune (auf 130 %)');
  const q = rpg.loeseQuest(daten.quests.find(x => x.id === '4a'));
  assert.strictEqual(q.gleichwertig.length, 1); ok++;          // Beispiel: nur (um 25 = auf 125) sind gleichwertig
  const q2 = rpg.loeseQuest(daten.quests.find(x => x.id === '4b'));
  assert.strictEqual(q2.gleichwertig.length, 2); ok++;         // (um 40 = auf 140) und (verr. um 40 = verr. auf 60)
}

/* --- Stufe 5: Prozentsatz --- */
{
  const s = id => rpg.loeseQuest(daten.quests.find(x => x.id === id));
  gleich(s('5a').aenderung, 30, '5a'); assert(s('5a').konsistent); ok++;
  assert.deepStrictEqual(s('5b').zeilen.map(z => Math.round(z.aenderung)), [35, 20, 100, 10]); ok++;
  assert.deepStrictEqual(s('5c').zeilen.map(z => Math.round(z.aenderung)), [-15, -10, -75]); ok++;
  [...s('5b').zeilen, ...s('5c').zeilen].forEach(z => { assert(z.konsistent, z.name + ' Min/Max inkonsistent'); ok++; });
  gleich(s('5d').aenderung, 100 / 3, '5d');
  assert.deepStrictEqual(s('5e').zeilen.map(z => Math.round(z.aenderung)), [20, 10, -15]); ok++;
  s('5e').zeilen.forEach(z => { assert(z.konsistent, z.name + ' Spanne inkonsistent'); ok++; });
}

/* --- Stufe 6: Grundwert --- */
{
  const s = id => rpg.loeseQuest(daten.quests.find(x => x.id === id));
  gleich(s('6a').grundschaden, 30, '6a'); gleich(s('6b').grundschaden, 36, '6b'); gleich(s('6c').grundschaden, 60, '6c');
  assert.deepStrictEqual([s('6a').lohntSich, s('6b').lohntSich, s('6c').lohntSich, s('6f').lohntSich], [false, true, true, true]); ok++;
  gleich(s('6f').grundschaden, 45, '6f');
  // typischer Fehler (W − p·W) führt bei 6b und 6f zur falschen Entscheidung
  assert.strictEqual(s('6b').falscheLoesung > 35, false); assert.strictEqual(s('6f').falscheLoesung > 40, false); ok++;
  const b = s('6d').zeilen.map(z => z.grundschaden), c = s('6e').zeilen.map(z => z.grundschaden);
  gleich(b[0], 60, '6d PHYSISCH (Umhang + Flasche = +75 %)'); gleich(b[1], 40, '6d EIS (Umhang + Ring der Eiskönigin = +125 %)');
  gleich(c[0], 30, '6e EIS (−50 %)'); gleich(c[1], 30, '6e PHYSISCH (+50 %)');
}

/* --- Stufe 7: absolut vs. prozentual --- */
{
  const v = rpg.loeseQuest(daten.quests.find(x => x.id === '7a'));
  gleich(v.zeilen[0].mitHandschuhen, 44, 'Eislanze mit Handschuhen'); gleich(v.zeilen[1].mitHandschuhen, 47.5, 'Flammenschwert mit Ring (fester Bonus)');
  gleich(v.zeilen[0].absolutMehr, 4, 'A absolut'); gleich(v.zeilen[1].absolutMehr, 10, 'B absolut');
  const s = rpg.loeseQuest(daten.quests.find(x => x.id === '7b'));
  gleich(s.schwellenGrundschaden, 62.5, 'Schwelle Armband/Handschuhe');
  assert.deepStrictEqual(s.zeilen.map(z => z.besser), ['Armband des Feuers', 'Armband des Feuers', 'Ring der Glut']); ok++;
}

/* --- Stufe 8: Zinsen --- */
{
  gleich(rpg.rechner.zins(30, 5, 3), 30 * 1.05 ** 3, 'Zinsformel');
  const w = { waffe: 'wutklinge' }, k = { waffe: 'wirbelklinge' };
  gleich(rpg.schadenNachRunden(w, null, 2), 30 + 31.5, 'Wutklinge 2 Runden');
  gleich(rpg.schadenNachRunden(k, null, 1), 12 + 12.6, 'Wirbelklinge 1 Runde (2 Angriffe)');
  assert.strictEqual(rpg.ueberholRunde(w, k), 9); ok++;
  const z = rpg.loeseQuest(daten.quests.find(x => x.id === '8a'));
  assert.deepStrictEqual(z.tabelle.map(r => r.schneller), ['Wutklinge', 'Wutklinge', 'Wirbelklinge', 'Wirbelklinge']); ok++;
}

/* --- Datenintegrität --- */
{
  const ids = new Set();
  daten.gegenstaende.forEach(i => { assert(!ids.has(i.id), 'doppelte ID ' + i.id); ids.add(i.id); ok++;
    (i.schaden || []).forEach(s => assert(s.min <= s.max && daten.quellen.includes(s.quelle), 'Schaden kaputt: ' + i.id));
    (i.modifikatoren || []).forEach(m => assert(daten.quellen.includes(m.quelle) || daten.gruppen[m.quelle], 'Modifikator kaputt: ' + i.id)); });
  daten.quests.forEach(q => (q.optionen || []).forEach(o => { if (o.waffe) { rpg.item(o.waffe); rpg.item(o.zauber); } }));
}
console.log(`\n✔ ${ok} Prüfungen bestanden\n`);

/* ================= Demo / Spielbarkeit ================= */
const name = id => rpg.item(id).name;
const bstr = b => ['waffe', 'ruestung', 'zauber'].filter(s => b[s]).map(s => name(b[s])).join(' + ');

for (const stufe of [1, 2]) {
  console.log(`--- Stufe ${stufe}: beste Ausrüstungen (Durchschnitt) ---`);
  rpg.besteBuilds(stufe, 'avg', 3).forEach(r => console.log(fmt(r.schaden).padStart(7), ' ', bstr(r.build)));
  const b = rpg.besteBuilds(stufe, 'avg', 1)[0].build;
  console.log('  Rechnung:', rpg.erklaere(b).join(' | '));
}

console.log('\n--- Stufe 3: Gibt es zwei Sets, die alle 6 Monster in 3 Runden schaffen? ---');
for (const modus of ['min', 'avg', 'max']) {
  const r = rpg.setPaare(modus, 3);
  console.log(`  ${modus.padEnd(3)}: ${r.paare.length} Paare gefunden (von ${r.anzahlBuilds} vollständigen Builds)` +
    (r.unschaffbar.length ? `; von keinem Set allein schaffbar: ${r.unschaffbar.join(', ')}` : ''));
  if (r.paare.length) { const [a, b] = r.paare[0]; console.log('      Beispiel: ', bstr(a), '  ||  ', bstr(b)); }
}

console.log('\n--- Stufe 8: Rundenzahl bis zum Sieg ---');
rpg.loeseQuest(daten.quests.find(x => x.id === '8a')).tabelle.forEach(r => console.log(' ', JSON.stringify(r)));
console.log('  Wirbelklinge überholt Wutklinge (kumuliert) ab Runde', rpg.ueberholRunde({ waffe: 'wutklinge' }, { waffe: 'wirbelklinge' }));

/* ================= Würfel ================= */
{
  const a = [1, 2, 3, 4, 5, 6].map(rpg.wuerfelZuModus);
  assert.deepStrictEqual(a, ['min', 'min', 'avg', 'avg', 'max', 'max']);
  assert.deepStrictEqual(rpg.itemTabelle('feuersturm'), [
    { quelle: 'PHYSISCH', min: 6, mittel: 10.5, max: 15, fest: false }, { quelle: 'FEUER', min: 20, mittel: 30, max: 40, fest: false }]);
  // feste Angriffswerte (wert): eine Zelle, min = mittel = max
  assert.deepStrictEqual(rpg.itemTabelle('wutklinge'), [{ quelle: 'PHYSISCH', min: 30, mittel: 30, max: 30, fest: true }]); ok++;
  assert.deepStrictEqual(rpg.itemTabelle('armband-des-feuers'), [{ quelle: 'FEUER', min: 5, mittel: 12.5, max: 20, fest: false }]); ok++;
  daten.gegenstaende.forEach(i => (i.schaden || []).forEach(s => assert.strictEqual(s.mittel, (s.min + s.max) / 2, 'mittel falsch: ' + i.id)));
  // Würfelkampf: Mjölnir+Magnetstein (min 100 / Ø 105 / max 110) gegen Tiefebenenriese (500 LP): 1, 4, 6 -> 100 + 105 + 110 = 315
  const k = rpg.kampf({ waffe: 'mjoelnir', zauber: 'glueckbringender-magnetstein' }, 'tiefebenenriese', { wuerfel: [1, 4, 6], maxRunden: 3 });
  assert.strictEqual(k.log.map(l => l.stufe).join(), 'min,avg,max');
  gleich(k.log[2].restLP, 500 - 315, 'Würfelkampf Rest-LP');
  console.log('✔ Würfel-Tests bestanden (1–2 min, 3–4 Ø, 5–6 max)');
}

/* ================= Duell / Einheit 7 ================= */
{
  const d = daten.duelle[0], [A, B] = d.sets;
  [38.5, 44, 49.5].forEach((v, i) => gleich(rpg.treffer(A)[['min', 'avg', 'max'][i]], v, 'Set A ' + i));
  [42.5, 47.5, 52.5].forEach((v, i) => gleich(rpg.treffer(B)[['min', 'avg', 'max'][i]], v, 'Set B ' + i));
  const w = rpg.duellWahrscheinlichkeit(A, B, d.lp);
  gleich(w.A + w.B + w.unentschieden, 1, 'Wahrscheinlichkeiten summieren sich zu 1');
  assert(w.B > 0.85 && w.A < 0.15); ok++;                         // Entscheidung für das richtige Set zählt klar
  // Alle würfeln 3 (Mittelwert): A 44/Runde, B 47,5/Runde -> nach 5 Runden A bei -37,5, B bei -20 -> B gewinnt
  const k = rpg.duell(A, B, 200, { wuerfelA: [3, 3, 3, 3, 3], wuerfelB: [3, 3, 3, 3, 3] });
  assert.strictEqual(k.runden, 5); gleich(k.log[4].lpA, 200 - 237.5, 'LP A'); gleich(k.log[4].lpB, 200 - 220, 'LP B');
  assert.strictEqual(k.sieger, 'B'); ok++;
  // Simulation gegen exakte Rechnung
  let sB = 0, N = 20000, s = 12345; const zufall = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  for (let i = 0; i < N; i++) if (rpg.duell(A, B, d.lp, { zufall }).sieger === 'B') sB++;
  assert(Math.abs(sB / N - w.B) < 0.02, 'Simulation passt nicht zur exakten Rechnung'); ok++;
  // Absolut vs. prozentual: Schwellenwert 5 : 0,1 = 50
  const R = rpg.rechner;
  gleich(R.steigernUm(50, 10), 50 + 5, 'Schwelle 50: beide gleich'); gleich(R.steigernUm(80, 10) - (80 + 5), 3, 'bei 80 gewinnen Handschuhe');
  console.log('✔ Duell-Tests bestanden');
}

/* ================= Einheit 8: Zinsen ================= */
{
  const W = { waffe: 'wutklinge' }, K = { waffe: 'wirbelklinge' }, L = { waffe: 'gleichmaessige-klinge' };
  gleich(rpg.schadenNachRunden(W, null, 4), 30 + 31.5 + 33.075 + 34.72875, 'Beispiel: 4 Angriffe');
  gleich(rpg.schadenNachRunden(K, null, 2), 12 + 12.6 + 13.23 + 13.8915, 'Wirbelklinge 2 Runden');
  gleich(rpg.schadenNachRunden(L, null, 10), 10 * 30 + 2 * 45, 'linear (+2 SP je Angriff): 10 Angriffe = 390');
  gleich(rpg.schadenNachRunden(L, null, 14), 602, 'linear: 14 Angriffe = 602');
  gleich(Math.round(rpg.schadenNachRunden(W, null, 14) * 100) / 100, 587.96, 'Zins: 14 Angriffe = 587,96');
  gleich(rpg.ueberholRunde(L, W), 19, 'Wutklinge liegt beim Gesamtschaden ab dem 19. Angriff vorn');
  gleich(rpg.schadenNachRunden(W, null, 10), 30 * (1.05 ** 10 - 1) / 0.05, 'Zins: Summenformel');
  assert(rpg.schadenNachRunden(W, null, 10) < rpg.schadenNachRunden(L, null, 10)); ok++;   // bis 10 Angriffe ist der feste Aufbau vorn
  assert(rpg.schadenNachRunden(W, null, 20) > rpg.schadenNachRunden(L, null, 20)); ok++;   // bei 20 Angriffen die Zinsen
  assert.strictEqual(rpg.ueberholRunde(W, K), 9); ok++;
  const rn = g => [rpg.kampf(W, g).runden, rpg.kampf(K, g).runden];
  assert.deepStrictEqual(['grubenratte', 'goblinkrieger', 'steintroll', 'uralter-drache'].map(rn), [[1, 2], [4, 5], [11, 10], [23, 19]]); ok++;
  // Würfel + Zins: fester Angriffswert, der Würfel ändert nichts; Aufbau multipliziert
  const k = rpg.kampf(W, 'goblinkrieger', { wuerfel: [1, 3, 5, 6] });
  gleich(k.log[0].schaden, 30, 'Angriff 1 (fester Wert, Würfel egal)'); gleich(k.log[1].schaden, 30 * 1.05, 'Angriff 2'); gleich(k.log[2].schaden, 30 * 1.05 ** 2, 'Angriff 3');
  // Klinge der Rachsucht: 25 SP, +8 % je Angriff
  const R = { waffe: 'klinge-der-rachsucht' };
  gleich(rpg.schadenNachRunden(R, null, 2), 25 + 27, 'Rachsucht 2 Angriffe');
  gleich(Math.round(25 * 1.08 ** 9 * 100) / 100, 49.98, 'Rachsucht: 10. Angriff = 49,98');
  assert.strictEqual(rpg.ueberholRunde(W, R), 13); ok++;                     // Gesamtschaden: Rachsucht liegt ab dem 13. Angriff vorn
  let nE = 1; while (25 * 1.08 ** (nE - 1) <= 30 * 1.05 ** (nE - 1)) nE++; assert.strictEqual(nE, 8); ok++;   // pro Angriff ab dem 8.
  console.log('✔ Zins-Tests bestanden');
}

/* ================= Helm des Nachhalls: „nachträglich“ (multipliziert) statt addiert ================= */
{
  const HELM = 'helm-des-nachhalls', UMH = 'umhang-des-bescheidenen';
  const treffer = b => rpg.treffer(b).avg;
  // Verdammnissäher + Rote Bullentrinkflasche: PHYSISCH 35 · (1 + 0,5 + 0,5) = 70
  const A = { waffe: 'verdammnissaeher', zauber: 'rote-bullentrinkflasche' };
  gleich(treffer(A), 70, 'Helm: ohne Rüstung');
  gleich(treffer({ ...A, ruestung: HELM }), 70 * 1.25, 'Helm: 70 · 1,25 = 87,5 (nachträglich)');
  gleich(treffer({ ...A, ruestung: UMH }), 35 * (1 + 0.5 + 0.5 + 0.25), 'Umhang: 35 · 2,25 = 78,75 (addiert)');
  // Vorteil des Helms gegenüber gleich hohem addiertem Bonus = G · m · x
  gleich(treffer({ ...A, ruestung: HELM }) - treffer({ ...A, ruestung: UMH }), 35 * 1.0 * 0.25, 'Helm − Umhang = G · m · x');
  // Schadensart frei wählbar: Mjölnir + Magnetstein (BLITZ 80, PHYSISCH 25)
  const M = { waffe: 'mjoelnir', zauber: 'glueckbringender-magnetstein' };
  gleich(treffer(M), 105, 'Mjölnir + Magnetstein');
  gleich(treffer({ ...M, ruestung: HELM, nachtraeglichAuf: 'BLITZ' }), 125, 'Helm auf BLITZ: 80 · 1,25 + 25');
  gleich(treffer({ ...M, ruestung: HELM, nachtraeglichAuf: 'PHYSISCH' }), 111.25, 'Helm auf PHYSISCH: 80 + 25 · 1,25');
  gleich(treffer({ ...M, ruestung: HELM }), 125, 'ohne Angabe: Schadensart mit dem höchsten Mittelwert');
  gleich(treffer({ ...M, ruestung: UMH }), 90 + 31.25, 'Umhang wirkt auf alle Schadensarten: 90 + 31,25');
  // Verteilter Schaden: Weltenschaffer + Feenstaub – hier gewinnt der Umhang
  const W = { waffe: 'weltenschaffer', zauber: 'feenstaub' };
  gleich(treffer({ ...W, ruestung: HELM, nachtraeglichAuf: 'FEUER' }), 42 * 1.25 + 21 + 7.5, 'Weltenschaffer + Feenstaub: Helm auf FEUER');
  gleich(treffer({ ...W, ruestung: UMH }), 30 * 1.65 + 15 * 1.65 + 7.5 * 1.25, 'Weltenschaffer + Feenstaub: Umhang');
  assert(treffer({ ...W, ruestung: UMH }) > treffer({ ...W, ruestung: HELM, nachtraeglichAuf: 'FEUER' })); ok++;
  // ohne Modifikatoren (m = 0) ist der Helm so gut wie ein addierter Bonus
  const N = { waffe: 'weltenschaffer' };     // keine Modifikatoren
  gleich(rpg.profil({ ...N, ruestung: HELM, nachtraeglichAuf: 'FEUER' }).FEUER.mittel, rpg.profil({ ...N, ruestung: UMH }).FEUER.mittel, 'm = 0: Helm = addierter Bonus (bei dieser Schadensart)');
  // Gegnerwiderstände wirken zusätzlich (Eisgolem: PHYSISCH −50 %, BLITZ ohne Widerstand)
  gleich(rpg.treffer({ ...M, ruestung: HELM, nachtraeglichAuf: 'BLITZ' }, 'eisgolem').avg, 100 + 25 * 0.5, 'Helm + Gegnerwiderstand');
  assert.throws(() => rpg.profil({ ...M, ruestung: HELM, nachtraeglichAuf: 'WASSER' })); ok++;
  // Stufe 9: nicht im Pool der Einheiten 1–3
  assert(!rpg.alleBuilds(2).some(b => b.ruestung === HELM)); ok++;
  assert(!rpg.alleBuilds(3).some(b => b.ruestung === HELM)); ok++;
  console.log('✔ Helm-Tests bestanden (nachträglich = multipliziert)');
}
