/* Erzeugt die Inhalte der Arbeitsblätter (Einheit 4–8). Alle Lösungen kommen aus der Engine.
 *   node arbeitsblaetter.js 4      ->  einheit-4.json + einheit-4.md (Vorschau)
 */
import fs from 'fs';
import path from 'path';
import { erzeuge } from './engine.js';
import * as kt from './layout/kartentext.js';
const daten = JSON.parse(fs.readFileSync(new URL('./gegenstaende.json', import.meta.url), 'utf8'));
const rpg = erzeuge(daten);
const f = rpg.fmt;
const f3 = x => (Math.round(x * 1000) / 1000).toString().replace('.', ',');
const pct = x => f(x) + ' %';
const name = id => rpg.item(id).name;
const bi = id => '{{' + name(id) + '}}';   // {{…}} = Gegenstandsname fett und kursiv (Layout-Auszeichnung, im Markdown ***…***)

function modText(it) {
  // absoluter Schaden von Nicht-Waffen steht als Modifikator (+ X QUELLE Schaden), dazu die prozentualen Modifikatoren
  return [...kt.absolutZeilen(it), ...(it.modifikatoren || []).map(m => m.auf !== undefined ? `Steigere ${m.quelle}schaden auf ${m.auf} % des Grundschadens`
    : `${m.prozent >= 0 ? '+' : '−'}${Math.abs(m.prozent)} % ${m.quelle}`)].join(', ');
}
/* Zusatzeigenschaften (Angriffe pro Runde, Aufbau um 5 % pro Angriff) – gleiche Texte auf Karten und Arbeitsblättern */
function effektZeilen(it) {
  return (it.effekte || []).map(ef => {
    if (ef.typ === 'umwandlung') return `${ef.anteil} % jedes Grundschadens werden zu ${ef.nach}schaden`;
    if (ef.typ === 'keinSchaden') return `Verursacht keinen ${ef.quellen.join('- oder ')}schaden`;
    if (ef.typ === 'nachtraeglich') return `Nachträglich: Der fertig berechnete Schaden einer Schadensart deiner Wahl steigt noch einmal um ${ef.prozent} %`;
    if (ef.typ === 'alleModifikatorenAuf') return `Alle Modifikatoren wirken ${ef.faktor === 2 ? 'verdoppelt' : 'mal ' + ef.faktor} auf ${ef.nach}schaden`;
    return '';
  }).filter(Boolean);
}
function eigenschaften(it) {
  const z = effektZeilen(it);
  if (it.angriffeProRunde) z.push(`${it.angriffeProRunde} Angriff${it.angriffeProRunde > 1 ? 'e' : ''} pro Runde`);
  if (it.aufbau) z.push(it.aufbau.art === 'zins'
    ? `Jeder Angriff: +${it.aufbau.prozent} % mehr Schaden als der Angriff davor („Zinsen“)`
    : it.aufbau.betrag !== undefined ? `Jeder Angriff: ${it.aufbau.betrag} SP mehr Schaden (fester Betrag)`
    : `Jeder Angriff: +${it.aufbau.prozent} % des Grundschadens mehr (fester Betrag)`);
  return z;
}
/* Gegner-Karte (Bild, LP, Widerstände) */
const widerstandText = w => w.immun ? `Immun gegen ${w.quelle}schaden`
  : w.auf !== undefined ? `Erleidet nur ${w.auf} % des ${w.quelle}schadens`
  : `${w.prozent >= 0 ? '+' : '−'}${Math.abs(w.prozent)} % erlittener ${w.quelle}schaden`;
function gegnerKarte(id) {
  const g = daten.gegner.find(x => x.id === id);
  if (g.beschreibung) return { id, name: g.name, typ: 'Gegner', schaden: [], lp: g.lp, modifikatoren: g.beschreibung.replace(/^Erleidet/, 'erleidet').replace(/\.$/, ''), eigenschaften: [] };
  return { id, name: g.name, typ: 'Gegner', schaden: [], lp: g.lp, zeilen: g.widerstaende.length ? g.widerstaende.map(widerstandText) : ['Keine Widerstände'], eigenschaften: [] };
}
function karte(id) {
  const it = rpg.item(id);
  const tb = kt.tabelle(it);    // nur Waffen haben eine Schadenstabelle; fest = fester Angriffswert (eine Zelle)
  return { id, name: it.name, typ: it.typ, schaden: tb, fest: kt.alleFest(tb), modifikatoren: modText(it), eigenschaften: eigenschaften(it) };
}

function einheit4() {
  /* ---- Beispiel (Problemstellung) ---- */
  const q4a = daten.quests.find(q => q.id === '4a');
  const l4a = rpg.loeseQuest(q4a);
  const beispiel = {
    problem: q4a.text + ' Er hat vier Rollen im Angebot. Welchen Schaden macht dein Schwert nach jeder Rolle?',
    zeilen: l4a.ergebnisse.map(e => ({
      rolle: e.text.replace(/ (um|auf) /, ' **$1** '),
      rechnung: e.art === 'um'
        ? (e.richtung === 'steigern' ? `80 + 80 · ${f(e.p / 100)} = 80 + ${f(80 * e.p / 100)}` : `80 − 80 · ${f(e.p / 100)} = 80 − ${f(80 * e.p / 100)}`)   // Julian 09.11.: Rechnung „um“ als Zwischenschritt (Grundwert ± Prozentwert)
        : `80 · ${f(e.p / 100)}`,
      ergebnis: f(e.ergebnis) + ' SP'
    })),
    erkenntnis: 'Rolle 1 und 2 bewirken dasselbe. Rolle 3 und 4 klingen ähnlich, machen aber einen riesigen Unterschied!',
    gew: [2.83, 2.83, 1.34],
    tabPt: 11, kopfH: 0.321, rowH: 0.292, tabGap: 0.19, erkZeilen: 1, erkGap: 0.11   // Julian 10.11.: Tabelle 11 pt
  };

  /* ---- Sicherung (Formelkasten) ---- */
  const sicherung = {
    titel: 'Merke: Steigern / Verringern UM oder AUF',
    vorspann: {   // Julian 09.11.: Merkkasten steht auf Seite 2 nach Aufgabe 2 und beginnt mit der Ein-Schritt-Umschreibung
      intro: 'Wenn man die normalen Modifikatoren, wie “+25% FEUER” (also erhöhe **um** …) umschreibt, kann man den neuen Schaden in einem Schritt berechnen:',
      beispielText: 'Schwert: 80 FEUERschaden + Umhang des Bescheidenen (+25% SCHADEN jeder Schadensart)',
      zeilen: [{ links: 'Steigern um 25 %', rechts: 'Steigern auf 100 % + 25 % = 125 %' },
        { links: '80 + 80 · 0,25 = 80 + 20 = 100', rechts: '80 · (1+0,25) = 80 · 1,25 = 100', fett: true }] },
    formeln: [
      { wenn: 'Steigern um p %', formel: 'neuer Wert = G · (1 + p)', beispiel: 'um 25 %: G · (1 + 0,25) = G · 1,25' },
      { wenn: 'Verringern um p %', formel: 'neuer Wert = G · (1 − p)', beispiel: 'um 25 %: G · (1 − 0,25) = G · 0,75' },
      { wenn: 'Steigern / Verringern auf a %', formel: 'neuer Wert = G · a', beispiel: 'auf 125 %: G · 1,25     auf 25 %: G · 0,25' }
    ]
  };

  const aufgaben = [];

  /* A1: gleichwertige Rollen finden */
  const q4b = daten.quests.find(q => q.id === '4b'); const l4b = rpg.loeseQuest(q4b);
  aufgaben.push({
    nr: 1, titel: 'Zwillinge und Fallen', yExtra: 0.25, auchSeite1: true, zeilenAnz: { 0: 2 }, schritte: { 0: 0.51 }, text: q4b.text.replace('Dein Schwert hat Grundschaden 60.', 'Dein Schwert verursacht einen physischen Grundschaden von {{60}}.') + ' Berechne den neuen Schaden und markiere Rollen mit gleichem Ergebnis.',
    tabelle: l4b.ergebnisse.map(e => e.text), tabelleLinie: 94, zeilenabstand: 0.207,
    loesung: { ergebnisse: l4b.ergebnisse.map(e => `${e.text}: ${f(e.ergebnis)} SP`), gleichwertig: l4b.gleichwertig }
  });

  /* A2: Umschreiben */
  const umschreib = [
    { gegeben: 'Steigern um 35 %', art: 'um', richtung: 'steigern', p: 35, frage: 'auf …' },
    { gegeben: 'Verringern um 15 %', art: 'um', richtung: 'verringern', p: 15, frage: 'auf …' },
    { gegeben: 'Verringern auf 20 %', art: 'auf', richtung: 'verringern', p: 20, frage: 'um …' },
    { gegeben: 'Steigern auf 250 %', art: 'auf', richtung: 'steigern', p: 250, frage: 'um …' },
    { gegeben: 'Der Schaden wird verdoppelt', art: 'auf', richtung: 'steigern', p: 200, frage: 'um … und auf …', beide: true }
  ];
  aufgaben.push({
    nr: 2, titel: 'Die Übersetzungsrolle', neueSeite: true, text: 'Schreibe dieselbe Wirkung mit dem anderen Wort („um“ statt „auf“ und umgekehrt).',
    teile: umschreib.map(u => u.gegeben + '  →  ' + u.frage.replace('…', '___________').replace('um ___________ und auf ___________', 'um _______ und auf _________')), teileSpalten: 2,
    nachTeile: { text: 'Vervollständige die Lücken:\n\nSteigern um p %  ⇔  Steigern auf (_______ + p).\n\nVerringern um p %  ⇔  Verringern auf (100 %  ________).', zeilen: 6, gap: 0.12 },
    loesung: umschreib.map(u => {
      const faktor = u.art === 'auf' ? u.p / 100 : (u.richtung === 'steigern' ? 1 + u.p / 100 : 1 - u.p / 100);
      const um = Math.round(Math.abs(faktor - 1) * 100), auf = Math.round(faktor * 100);
      const umText = `${faktor >= 1 ? 'Steigern' : 'Verringern'} um ${um} %`;
      return u.beide ? `${umText} = Steigern auf ${auf} %` : (u.art === 'um' ? `Faktor ${f(faktor)} → ${faktor >= 1 ? 'Steigern' : 'Verringern'} auf ${auf} %` : `Faktor ${f(faktor)} → ${umText}`);
    }).concat(['Lücken: Steigern um p % ⇔ Steigern auf (100 % + p). Verringern um p % ⇔ Verringern auf (100 % − p).'])
  });

  /* A3: Fehler finden */
  const lena = { G: 60, a: 20 }, tim = { G: 40, a: 150 };
  aufgaben.push({
    nr: 3, titel: 'Wer hat recht?', yExtra: 0.2,
    text: 'Lena sagt: „Verringern auf 20 % heißt, der Schaden wird um 20 % kleiner.“ Tim sagt: „Steigern auf 150 % heißt, der Schaden wird um 150 % größer.“ Prüfe beide Aussagen mit Grundschaden 60 (Lena) bzw. 40 (Tim).',
    loesung: [
      `Lena: richtig ${f(rpg.rechner.auf(lena.G, lena.a))} SP (60 · 0,2); nach Lena wären es ${f(rpg.rechner.verringernUm(lena.G, lena.a))} SP (60 · 0,8) → falsch.`,
      `Tim: richtig ${f(rpg.rechner.auf(tim.G, tim.a))} SP (40 · 1,5); nach Tim wären es ${f(rpg.rechner.steigernUm(tim.G, tim.a))} SP (40 · 2,5) → falsch.`
    ]
  });

  /* A4: Gegner mit „um“/„auf“-Widerstand */
  const build = { waffe: 'feuersturm' };
  const moos = rpg.treffer(build, 'moosgolem').avg, asche = rpg.treffer(build, 'aschegolem').avg;
  const km = rpg.kampf(build, 'moosgolem'), ka = rpg.kampf(build, 'aschegolem');
  aufgaben.push({
    nr: 4, titel: 'Zwei Golems', neueSeite: true,   // Julian 09.11.: Gegenstands- und Gegnerkarten stehen in der Übersicht zu Einheit 4
    text: 'Du kämpfst mit {{Feuersturm}} (rechne mit dem Mittelwert) gegen den {{Moosgolem}} und den {{Aschegolem}}. Die Eigenschaften kannst du der Übersicht für Einheit 4 entnehmen.\nWie viel Schaden macht ein Treffer jeweils? Wie viele Treffer brauchst du?',
    loesung: [
      `Ohne Golem: ${rpg.erklaere(build).join(' | ')}`,
      `Moosgolem: FEUER 45 · (1 − 0,4) = 27; dazu PHYSISCH 10,5 → ${f(moos)} SP pro Treffer → ${km.angriffe} Treffer`,
      `Aschegolem: FEUER 45 · 0,4 = 18; dazu PHYSISCH 10,5 → ${f(asche)} SP pro Treffer → ${ka.angriffe} Treffer`
    ]
  });

  /* A5: Kombinationen */
  const combos = [
    { waffe: 'mjoelnir', zauber: 'gewitterstein' },
    { waffe: 'valdorils-vermaechtnis', zauber: 'frostsiegel' },
    { waffe: 'weltenschaffer', zauber: 'rune-der-glut' },
    { waffe: 'baldars-weisheit', zauber: 'rune-der-meisterschaft' }
  ];
  const erg = combos.map(b => ({ b, t: rpg.treffer(b), rechnung: rpg.erklaere(b) }));
  const beste = [...erg].sort((a, b) => b.t.avg - a.t.avg)[0];
  aufgaben.push({
    nr: 5, titel: 'Ausrüstung kombinieren',
    text: 'Berechne für jede den durchschnittlichen Schaden (Mittelwert). Welche ist die beste?\nVerwende die neue Formel zur Berechnung von Modifikatoren.',
    kombinationen: combos.map(c => `${name(c.waffe)} + ${name(c.zauber)}`),
    nachTeile: { text: 'e) Berechne für die beste Kombination Minimum, Mittelwert und Maximum.', zeilen: 2 },
    loesung: {
      kombinationen: erg.map(e => ({ name: `${name(e.b.waffe)} + ${name(e.b.zauber)}`, rechnung: e.rechnung, mittel: e.t.avg })),
      beste: `${name(beste.b.waffe)} + ${name(beste.b.zauber)}`,
      wuerfel: { min: beste.t.min, mittel: beste.t.avg, max: beste.t.max }
    }
  });

  /* A6: Echte Fallen (Julian 09.11.: Idee „Echte Fallen“) – Rollen ohne Rechnung einordnen */
  const R = rpg.rechner, G6 = 100;
  const fallen = [
    { t: 'Steigere den Schaden auf 90 %', w: R.auf(G6, 90), art: 'weniger', warum: 'Faktor 0,9: trotz „Steigere“ sinkt der Schaden auf 90 %.' },
    { t: 'Steigere den Schaden um 100 %', w: R.steigernUm(G6, 100), art: 'mehr', warum: 'Faktor 2: der Schaden wird verdoppelt (= Steigere auf 200 %).' },
    { t: 'Verringere den Schaden auf 0 %', w: R.auf(G6, 0), art: 'weniger', warum: 'Faktor 0: der Schaden ist 0 (gleiche Wirkung wie „Verringere um 100 %“).' },
    { t: 'Verringere den Schaden um 120 %', w: R.verringernUm(G6, 120), art: 'Unsinn', warum: 'Faktor 1 − 1,2 = −0,2: der Schaden wäre negativ – mehr als 100 % kann man nicht wegnehmen.' },
    { t: 'Steigere den Schaden auf 100 %', w: R.auf(G6, 100), art: 'gleich', warum: 'Faktor 1: nichts ändert sich.' },
    { t: 'Verringere den Schaden um 100 %', w: R.verringernUm(G6, 100), art: 'weniger', warum: 'Faktor 0: der Schaden ist 0 (gleiche Wirkung wie „Verringere auf 0 %“).' }
  ];
  aufgaben.push({
    nr: 6, titel: 'Echte Fallen', yExtra: 0.1,
    text: 'Borwin hat noch Rollen im Angebot, bei denen man genau lesen muss. Ordne jede Rolle ein, ohne zu rechnen:\nMacht sie mehr Schaden, weniger Schaden, bleibt der Schaden gleich oder ist die Rolle Unsinn? Begründe kurz.\nZwei Rollen haben dieselbe Wirkung. Welche?',
    zeilenAnz: { 0: 1, 1: 2, 2: 1 },
    teile: fallen.map(x => x.t), teileSpalten: 3,
    loesung: fallen.map((x, i) => `${String.fromCharCode(97 + i)}) ${x.t}: ${x.art === 'Unsinn' ? 'Unsinn' : x.art === 'gleich' ? 'bleibt gleich' : x.art === 'mehr' ? 'mehr Schaden' : 'weniger Schaden'} (bei Grundschaden 100: ${f(x.w)} SP) – ${x.warum}`)
      .concat(['Dieselbe Wirkung haben „Verringere den Schaden auf 0 %“ und „Verringere den Schaden um 100 %“ (beide: Schaden 0).'])
  });

  /* A7: ★ Die Gegenrolle (Julian 09.11.) */
  const G7 = 80, gegen = p => (1 / (1 - p / 100) - 1) * 100;
  const zeile7 = p => `„Verringere um ${p} %“: ${f(G7)} · ${f(1 - p / 100)} = ${f(R.verringernUm(G7, p))}; Gegenrolle: Faktor 1 : ${f(1 - p / 100)} = ${f3(1 / (1 - p / 100))}, also „Steigere um ${f3(gegen(p))} %“ (${f(R.verringernUm(G7, p))} · ${f3(1 / (1 - p / 100))} = ${f(G7)}).`;
  aufgaben.push({
    nr: 7, titel: '★ Die Gegenrolle', differenzierung: true,
    text: `Borwin sagt: „Zu jeder Rolle gibt es eine Gegenrolle, die sie rückgängig macht.“ Dein Schwert hat Grundschaden ${G7}.\na) Wende „Verringere um 20 %“ an. Mit welcher „Steigere um …“-Rolle bekommst du wieder ${G7} SP?\nb) Finde ebenso die Gegenrolle zu „Verringere um 50 %“ und zu „Verringere um 75 %“.\nc) Was fällt dir auf? Warum ist die Gegenrolle nicht einfach „Steigere um 20 %“?\nd) Gibt es eine Gegenrolle zu „Verringere um 100 %“? Begründe.`,
    teilGap: 0.1,
    loesung: [`a) ${zeile7(20)}`, `b) ${zeile7(50)} ${zeile7(75)}`,
      'c) Die Gegenrolle hat immer einen größeren Prozentsatz: Nach „Verringere um 20 %“ bleiben nur 80 % des Schadens übrig. 20 % von 80 sind weniger als 20 % von 100 – man muss also mehr als 20 % steigern. Der Faktor der Gegenrolle ist der Kehrwert des Faktors (1 : 0,8 = 1,25).',
      'd) Nein: Nach „Verringere um 100 %“ ist der Schaden 0, und 0 mal jeder Faktor ist wieder 0.']
  });

  return {
    einheit: 4, titel: 'Der Schriftrollenhändler', untertitel: 'Steigern um … oder auf …?',
    einstieg: 'Auf dem Marktplatz von Zahlheim baut Schriftrollenhändler Borwin seinen Stand auf. Seine Rollen verändern den Schaden deiner Waffe – aber die Beschreibungen klingen verdächtig ähnlich …',
    beispiel, sicherung, sicherungNach: 2, aufgaben, dy: { einstieg: 0.09 }
  };
}

const sp = x => (x[0] === x[1] ? f(x[0]) : `${f(x[0])}–${f(x[1])}`);
const f1 = x => (Math.round(x * 10) / 10).toString().replace('.', ',');

function einheit5() {
  const q5a = daten.quests.find(q => q.id === '5a'), l5a = rpg.loeseQuest(q5a);
  const [G, W] = [q5a.grundschaden[0], q5a.gemessen[0]];

  const beispiel = {
    problem: q5a.text,
    tabelle: { kopf: ['Schritt', 'Rechnung'], zeilen: [
      ['Gegeben', `Grundwert G = ${f(G)} SP,  Prozentwert W = ${f(W)} SP,  gesucht: p`],
      ['Quotient bilden', `p = W : G = ${f(W)} : ${f(G)} = ${f(W / G)}`],
      ['In Prozent', `${f(W / G)} = ${f(W / G * 100)} %  → der Schaden beträgt jetzt ${f(W / G * 100)} % des Grundschadens`],
      ['Änderung', `${f(W)} − ${f(G)} = ${f(W - G)} SP mehr;  ${f(W - G)} : ${f(G)} = ${f((W - G) / G)} = ${f(l5a.aenderung)} %  → Steigerung um ${f(l5a.aenderung)} %`],
      ['Probe', `${f(G)} · ${f(W / G)} = ${f(G * W / G)} SP ✓`]
    ] },
    erkenntnis: 'Der Zauber ist „30 % gut“: Er steigert den Schaden um 30 % – auf 130 %.',
    problemGap: 0.12, erkGap: 0.06, tabPt: 11, kopfH: 0.317, zeilenH: [0.289, 0.289, 0.416, 0.416, 0.289], tabGap: 0.11   // Julian 10.11.: Tabelle 11 pt, zwei Zeilen höher
  };

  const sicherung = {
    titel: 'Merke: Den Prozentsatz berechnen',
    formeln: [
      { wenn: 'Prozentsatz', formel: 'p = W : G', beispiel: '52 : 40 = 1,3 = 130 %' },
      { wenn: 'Änderung (Steigerung / Verringerung)', formel: 'Änderung = (neu − alt) : alt = neu : alt − 1', beispiel: '(52 − 40) : 40 = 0,3 = 30 %' },
      { wenn: 'Probe', formel: 'G · p = W', beispiel: '40 · 1,3 = 52' }
    ],
    umrechnung: 'Ist (neu : alt) größer als 1 (über 100 %), wurde gesteigert.\nIst (neu : alt) kleiner als 1 (unter 100 %), wurde verringert.',   // Julian 10.11.: zwei Zeilen, 11 pt
    pt: 11, umrLsm: 1.14, umrZeilen: 2, vorUmr: 0.07, umrGap: 0.11, titelGap: 0.09, padUnten: 0.18,
    achtung: 'Aus 1,3 folgt „auf 130 %“, aber nur „um 30 %“ mehr (siehe Einheit 4)!'
  };

  const aufgaben = [];
  const q5b = daten.quests.find(q => q.id === '5b'), l5b = rpg.loeseQuest(q5b);
  aufgaben.push({
    nr: 1, titel: 'Quillons Messungen', text: q5b.text,
    tabellen: [{ kopf: ['Waffe', 'Grundschaden', 'Gemessen', 'Quotient W : G', 'Prozentsatz', 'Steigerung um'],
                 zeilen: q5b.messungen.map(m => [m.name, sp(m.grundschaden), sp(m.gemessen), '', '', '']), pt: 10, kopfH: 0.317, rowH: 0.351 }],
    loesung: l5b.zeilen.map(z => `${z.name}: ${z.rechenweg}`)
  });

  const q5c = daten.quests.find(q => q.id === '5c'), l5c = rpg.loeseQuest(q5c);
  aufgaben.push({
    nr: 2, titel: 'Wenn der Zauber misslingt', yExtra: 0.09, text: q5c.text,
    tabellen: [{ kopf: ['Waffe', 'Grundschaden', 'Gemessen', 'Prozentsatz', 'Verringerung um'],
                 zeilen: q5c.messungen.map(m => [m.name, sp(m.grundschaden), sp(m.gemessen), '', '']), pt: 10, kopfH: 0.319, rowH: 0.354 }],
    loesung: l5c.zeilen.map(z => `${z.name}: ${z.rechenweg}`)
  });

  const q5d = daten.quests.find(q => q.id === '5d'), l5d = rpg.loeseQuest(q5d);
  const versprochenSP = rpg.rechner.steigernUm(q5d.grundschaden[0], q5d.versprochen);
  aufgaben.push({
    nr: 3, titel: 'Quillons Versprechen', yExtra: 0.09, text: q5d.text + ' Runde auf eine Stelle nach dem Komma.',
    loesung: [`Versprochen: ${f(q5d.grundschaden[0])} · 1,4 = ${f(versprochenSP)} SP; gemessen: ${f(q5d.gemessen[0])} SP.`,
      `Tatsächlich: ${f(q5d.gemessen[0])} : ${f(q5d.grundschaden[0])} = ${f(l5d.faktor)} → ${f1(l5d.aenderung)} % Steigerung (statt 40 %). Quillon hat sein Versprechen nicht gehalten.`]
  });

  const q5e = daten.quests.find(q => q.id === '5e'), l5e = rpg.loeseQuest(q5e);
  aufgaben.push({
    nr: 4, titel: '★ Schaden mit Spanne', differenzierung: true, yExtra: 0.1, text: q5e.text,
    tabellen: [{ kopf: ['Waffe', 'Grundschaden (Min–Max)', 'Gemessen (Min–Max)', 'p mit Minimum', 'p mit Maximum', 'Steigerung / Verringerung um'],
                 zeilen: q5e.messungen.map(m => [m.name, sp(m.grundschaden), sp(m.gemessen), '', '', '']), pt: 10, kopfH: 0.481, rowH: 0.358 }],
    loesung: [...l5e.zeilen.map(z => `${z.name}: Min ${f(z.faktor)} (${f(z.aenderung)} %), Max ${f(z.faktor)} → ${z.konsistent ? 'derselbe Prozentsatz' : '⚠ unterschiedlich'}`),
      'Beobachtung: Der Zauber wirkt auf Minimum und Maximum mit demselben Prozentsatz. Das ist die Probe: Kommt Verschiedenes heraus, wurde falsch gerechnet.']
  });

  return { einheit: 5, titel: 'Der Verzauberer', untertitel: 'Wie gut ist der Zauber? (Prozentsatz berechnen)',
    einstieg: 'In einem schiefen Turm am Rand von Zahlheim lebt Magister Quillon, der Waffenverzauberer. Er kennt den Grundschaden jeder Waffe, misst danach den Gesamtschaden – und möchte daraus die Qualität seines Zaubers berechnen. Dabei braucht er dich!',
    beispiel, sicherung, aufgaben, abstaende: { nachBeispiel: 0.29 } };
}

function einheit6() {
  const R = rpg.rechner;
  const q6a = daten.quests.find(q => q.id === '6a'), l6a = rpg.loeseQuest(q6a);
  const p = q6a.handschuhe.prozent, W = q6a.gemessen;

  const beispiel = {
    problem: `In der Trainingshalle von Zahlheim liegen Übungswaffen bereit. ${q6a.text.replace(/ Deine Hauptwaffe.*$/, '')}`,
    tabelle: { kopf: ['Schritt', 'Rechnung'], zeilen: [
      ['Gegeben', `Prozentwert W = ${f(W)} SP (gemessen, mit Handschuhen),  Bonus p = ${p} % = ${f(p / 100)},  gesucht: Grundwert G`],
      ['Faktor', `Der gemessene Schaden ist G · (1 + p) = G · ${f(1 + p / 100)}`],
      ['Umstellen', `G · (1 + p) = W ➔ G = W : (1 + p) = ${f(W)} : ${f(1 + p / 100)} = ${f(l6a.grundschaden)} SP`],
      ['Probe', `${f(l6a.grundschaden)} · ${f(1 + p / 100)} = ${f(l6a.grundschaden * (1 + p / 100))} SP ✓`],
      ['Typischer Fehler', `${f(W)} − 10 % von ${f(W)} = ${f(l6a.falscheLoesung)} ✗  (Probe: ${f(l6a.falscheLoesung)} · 1,1 = ${f(l6a.falscheLoesung * 1.1)} ≠ ${f(W)})`]
    ] },
    erkenntnis: 'Die 10 % beziehen sich auf den Grundschaden G, nicht auf den gemessenen Schaden. Darum wird durch 1,1 geteilt und nicht 10 % abgezogen.',
    problemGap: 0.12, tabPt: 10.5, kopfH: 0.317, zeilenH: [0.396, 0.289, 0.289, 0.289, 0.289], tabGap: 0.16, erkGap: 0.02   // Julian 10.11.
  };

  const sicherung = {
    titel: 'Merke: Den Grundwert berechnen',
    formeln: [
      { wenn: 'Nach einer Steigerung um p %', formel: 'G = neu : (1 + p)', beispiel: '33 : 1,1 = 30' },
      { wenn: 'Nach einer Verringerung um p %', formel: 'G = neu : (1 − p)', beispiel: '48 : 0,8 = 60' },
      { wenn: 'Probe', formel: 'G · (1 ± p) = neu', beispiel: '30 · 1,1 = 33' }
    ],
    pt: 11, titelGap: 0.05, vorUmr: 0.04, umrGap: 0.09, padUnten: 0.15,   // Julian 10.11.: Text 11 pt
    umrechnung: 'Mehrere Boni auf dieselbe Schadensart werden zuerst addiert (Einheit 1): Der Faktor ist 1 + (Summe aller Boni). Dann wird durch diesen Faktor geteilt.',
    achtung: 'Nicht „10 % vom gemessenen Wert abziehen“! Die Prozente beziehen sich auf G, nicht auf den neuen Wert.'
  };

  const aufgaben = [];

  /* A1: Übungswaffen */
  const rows = ['6b', '6c', '6f'].map(id => daten.quests.find(q => q.id === id));
  aufgaben.push({
    nr: 1, titel: 'Welche Übungswaffe nehme ich mit?',
    text: 'Berechne für jede Übungswaffe den Grundschaden.',   // Julian 10.11.: ohne Entscheidung „Mitnehmen?“
    tabellen: [{ kopf: ['Handschuhe', 'Gemessener Schaden', 'Grundschaden der Übungswaffe'], x: 1.46, w: 5.36, gew: [2.316, 1.149, 1.894], pt: 10.5, kopfH: 0.552, zeilenH: [0.38, 0.409, 0.409],
                 zeilen: rows.map(q => [`${q.handschuhe.name} (${q.handschuhe.prozent > 0 ? '+' : '−'}${Math.abs(q.handschuhe.prozent)} % ${q.handschuhe.quelle})`, f(q.gemessen), '']) }],
    loesung: rows.map(q => { const l = rpg.loeseQuest(q); return `${q.handschuhe.name}: ${l.rechenweg}`; })
  });

  /* A2: Zwei Boni */
  const q6d = daten.quests.find(q => q.id === '6d'), l6d = rpg.loeseQuest(q6d);
  const zusatzKarten = [...new Set(q6d.messungen.flatMap(m => [m.ruestung, m.zauber]))].map(karte);
  aufgaben.push({
    nr: 2, titel: 'Zwei Boni auf einmal', yExtra: 0.06,
    text: `Du trägst ${bi('umhang-des-bescheidenen')} und einen Zaubergegenstand: ${bi('rote-bullentrinkflasche')} ODER ${bi('ring-der-eiskoenigin')}. Entnimm die Werte aus der Übersicht der Gegenstände Stufe 1 und 2.\nDie Übungswaffe macht den gemessenen Schaden. Wie hoch ist ihr Grundschaden?`,   // Julian 10.11.: keine Karten, Werte aus der Übersicht
    tabellen: [{ gew: [2.138, 1.633, 0.933, 1.166, 1.4], pt: 10.5, kopfH: 0.677, rowH: 0.501, kopf: ['Rüstung + Zaubergegenstand', 'Schadensart', 'Gemessen', 'Bonus insgesamt', 'Grundschaden'],
                 zeilen: q6d.messungen.map(m => [`${name(m.ruestung)} + ${name(m.zauber)}`, m.quelle, f(m.gemessen), '', '']) }],
    loesung: l6d.zeilen.map(z => `${name(z.ruestung)} + ${name(z.zauber)}: Bonus ${f(z.summe)} % → Faktor ${f(z.faktor)} → G = ${f(z.gemessen)} : ${f(z.faktor)} = ${f(z.grundschaden)} SP`)
  });

  /* A3 */
  const q6e = daten.quests.find(q => q.id === '6e'), l6e = rpg.loeseQuest(q6e);
  aufgaben.push({
    nr: 3, titel: 'Wenn die Rüstung schwächt', yExtra: 0.06, text: q6e.text.replace('„Fokussierte Gedanken“', bi('fokussierte-gedanken')),   // Karte entfällt (Julian, 09.11.)
    loesung: l6e.zeilen.map(z => `${z.quelle}: Faktor ${f(z.faktor)} (${z.summe > 0 ? '+' : ''}${f(z.summe)} %) → G = ${f(z.gemessen)} : ${f(z.faktor)} = ${f(z.grundschaden)} SP`)
  });

  /* A4 (Julian 10.11.: übernommen): mehr Übung, gleiche Schwierigkeit wie Aufgabe 1 – ein Faktor je Schadensart.
   * Die Übungswaffen sind Nachbildungen echter Waffen aus der Übersicht (mehrere Schadensarten); Waffe, Ausrüstung und Modifikator stehen in der Tabelle.
   * Nach der Rechnung vergleichen die SuS den Grundschaden der Nachbildung mit dem Mittelwert des Originals (Übersicht). */
  {
    const sets = [
      { waffe: 'weltenschaffer', zauber: 'feenstaub', ausr: 'feenstaub', gm: { FEUER: 25, EIS: 15 } },
      { waffe: 'baldars-weisheit', ruestung: 'fokussierte-gedanken', ausr: 'fokussierte-gedanken', gm: { PHYSISCH: 20, FEUER: 15, EIS: 20 } }
    ];
    const z4 = [], l4 = [];
    sets.forEach(st => {
      const pr = rpg.profil(st.ruestung ? { waffe: st.waffe, ruestung: st.ruestung } : { waffe: st.waffe, zauber: st.zauber });
      const zl = Object.entries(st.gm).map(([art, G]) => {
        const fk = pr[art].faktor, W = G * fk;
        if (Math.abs(W * 1000 - Math.round(W * 1000)) > 1e-6 || Math.abs(R.grundwertVorAenderung(W, (fk - 1) * 100) - G) > 1e-9) throw new Error('E6 A4: Zahlen nicht glatt');
        return { art, G, W, fk, orig: pr[art].basis.mittel, pz: Math.round((fk - 1) * 100) };
      });
      zl.forEach(z => z4.push([name(st.waffe), name(st.ausr), `${z.art} (${z.pz > 0 ? '+' : '−'}${Math.abs(z.pz)} %)`, f(z.W), '', '']));
      l4.push(`${name(st.waffe)}-Nachbildung (${name(st.ausr)}): ` + zl.map(z => `${z.art}: G = ${f(z.W)} : ${f(z.fk)} = ${f(z.G)} SP (Original ${f(z.orig)} SP → ${z.G < z.orig ? 'schwächer' : z.G > z.orig ? 'stärker' : 'gleich'})`).join('; ') + '.');
    });
    aufgaben.push({
      nr: 4, titel: 'Noch mehr Training', yExtra: 0.07,
      text: 'In der Trainingshalle liegen zwei Nachbildungen echter Waffen aus der Übersicht (Stufe 1). Du trägst jeweils nur die angegebene Ausrüstung. Berechne die Grundschäden und vergleiche sie mit den Mittelwerten der Originale: stärker, schwächer oder gleich?',
      tabellen: [{ kopf: ['Nachbildung von', 'Ausrüstung', 'Schadensart', 'Gemessen', 'Grundschaden', 'Original'], gew: [1.4, 1.65, 1.4, 0.95, 1.15, 0.72], pt: 10.5, kopfH: 0.4, rowH: 0.29, randFrei: true, zeilen: z4 }],
      loesung: l4
    });
  }

  return { einheit: 6, titel: 'Die Trainingshalle', untertitel: 'Wie stark ist die Übungswaffe wirklich? (Grundwert berechnen)',
    einstieg: 'Bevor du in die Arena gehst, übst du in der Trainingshalle. Dort liegen Übungswaffen, deren Grundschaden niemand kennt. Du kannst nur messen, wie viel Schaden sie mit deiner Ausrüstung machen.',
    beispiel, sicherung, aufgaben, abstaende: { nachBeispiel: 0.19 } };
}

function einheit7() {
  const R = rpg.rechner;
  const duellDaten = daten.duelle[0];
  const [sA, sB] = duellDaten.sets;
  const tA = rpg.treffer(sA), tB = rpg.treffer(sB);
  const ref = { G: 40, p: 10, b: 5 };
  const sw = ref.b / (ref.p / 100);

  const zeileBsp = G => [String(f(G)), `${f(G)} · ${f(ref.p / 100)} = ${f(R.prozentwert(G, ref.p))}`, f(G + R.prozentwert(G, ref.p)), `${f(G)} + ${f(ref.b)}`, f(G + ref.b),
    R.prozentwert(G, ref.p) > ref.b ? 'Handschuhe' : (R.prozentwert(G, ref.p) < ref.b ? 'Helm' : 'gleich gut')];
  const beispiel = {
    problem: `Ritter Absalom schenkt dir einen Gegenstand – du darfst wählen: Handschuhe mit +${ref.p} % Schaden oder einen Helm mit +${ref.b} Schaden (fester Betrag). Dein Schwert hat Grundschaden ${ref.G}. Was ist besser? Und was, wenn dein Schwert Grundschaden 80 hätte?`,
    tabelle: { kopf: ['Grundschaden G', `Handschuhe: G · ${f(ref.p / 100)}`, 'Neuer Schaden', 'Helm: G + 5', 'Neuer Schaden', 'Besser'],
               zeilen: [zeileBsp(40), [String(80), '', '', '', '', '']] },
    loesungTabelle: { kopf: ['Grundschaden G', `Handschuhe: G · ${f(ref.p / 100)}`, 'Neuer Schaden', 'Helm: G + 5', 'Neuer Schaden', 'Besser'],
                      zeilen: [zeileBsp(40), zeileBsp(80)] },
    loesungText: `Bei G = 80 sind es ${f(R.prozentwert(80, ref.p))} SP – die Handschuhe gewinnen (88 gegen 85).`,
    erkenntnis: [
      `Bei G = 40 bringen ${ref.p} % nur ${f(R.prozentwert(40, ref.p))} SP – der Helm gewinnt.`,
      'Bei G = 80 ' + '_'.repeat(79)
    ],
    erkGap: 0.09
  };

  const sicherung = {
    titel: 'Merke: Absoluter oder prozentualer Bonus? (Ergänze die Sätze)', abstand: 0.24,
    luecken: [
      { text: 'Bei einem geringen Grundwert ist der Prozentwert ______________ als bei einem hohen Grundwert.', loesungen: ['geringer'] },
      { text: 'Bei einem hohen Grundwert ist der Prozentwert ______________ als bei einem geringen Grundwert.', loesungen: ['höher'] },
      { text: 'Ein fester Bonus (z. B. +5) ____________________ sich nicht, egal wie groß der Grundwert ist.', loesungen: ['ändert'] },
      { text: 'Ein prozentualer Bonus wird größer, wenn der Grundwert ___________________.', loesungen: ['wächst / größer wird'] },
      { text: 'Prozentuale Steigerung lohnt sich also bei einem _______________ Grundwert, ein fester Bonus bei einem ____________ Grundwert.', loesungen: ['hohen', 'geringen'], zeilenabstand: 1.5 }
    ]
  };

  const aufgaben = [];

  const ws = [['Dolch', 20], ['Rapier', 30], ['Schwert', 50], ['Streitaxt', 70], ['Zweihänder', 120]];
  aufgaben.push({
    nr: 1, titel: 'Helm oder Handschuhe?', schritte: { 0: 0.35 },
    text: 'a) Entscheide für jede Waffe: {{Handschuhe (+10 %)}} oder {{Helm (+5)}}, was ist besser? Fülle die Tabelle aus.',
    tabellen: [{ kopf: ['Waffe', 'Grundschaden G', 'Handschuhe: neuer Schaden', 'Helm: neuer Schaden', 'Besser'], zeilen: ws.map(([n, G]) => [n, String(G), '', '', '']), pt: 10.5, kopfH: 0.333, rowH: 0.368, nachGap: 0.227 }],   // Julian 10.11.
    nachTabelleBlock: { zeilen: 3, hExtra: 0.16, gap: 0.23 },
    nachTabelle: ['b) Zeichne in deinem Heft ein Diagramm: x-Achse: Grundschaden, y-Achse: neuer Schaden. Trage die Werte aus der Tabelle ein.',
      'c) Beschreibe den Verlauf der Graphen. Ab welchem Grundschaden lohnen sich die Handschuhe?'],   // Julian, 09.11.: b) und c) ergänzt
    loesung: [...ws.map(([n, G]) => { const h = R.steigernUm(G, ref.p), r = G + ref.b; return `${G === ws[0][1] ? 'a) ' : ''}${n} (G = ${G}): Handschuhe ${G} · 1,1 = ${f(h)}; Helm ${G} + 5 = ${f(r)} → ${h > r + 1e-9 ? 'Handschuhe' : (h < r - 1e-9 ? 'Helm' : 'gleich gut')}`; }),
      `b) Diagramm (x-Achse: Grundschaden, y-Achse: neuer Schaden). Handschuhe: Gerade durch den Nullpunkt: y=1,1 · x, Punkte ${ws.map(([, G]) => `(${G} | ${f(R.steigernUm(G, ref.p))})`).join(', ')}. Helm: Gerade y = x + 5 (parallel zur Winkelhalbierenden), Punkte ${ws.map(([, G]) => `(${G} | ${f(G + ref.b)})`).join(', ')}. Die beiden Geraden schneiden sich bei G = ${f(sw)}.`,
      `c) Beide Graphen steigen. Die Gerade der Handschuhe ist steiler (Steigung 1,1 gegenüber 1): Bis G = ${f(sw)} liegt der Helm vorn, bei G = ${f(sw)} sind beide gleich gut (${f(R.steigernUm(sw, ref.p))} SP), danach liegen die Handschuhe vorn und der Abstand wird immer größer (G = 120: ${f(R.steigernUm(120, ref.p))} gegen ${f(120 + ref.b)}). Schwellenwert: 5 : 0,1 = ${f(sw)}. Ab G > ${f(sw)} lohnen sich die Handschuhe.`]
  });

  const um1 = [25, 40, 100], um2 = [[60, 15], [30, 15], [200, 15]];
  aufgaben.push({
    nr: 2, titel: 'Absolut vs. prozentual',
    text: 'a) Der Helm gibt +5 SP. Welchem Prozentsatz entspricht das bei Grundschaden 25, 40 bzw. 100? b) Handschuhe geben +15 %. Welchem festen Betrag entspricht das bei Grundschaden 60, 30 bzw. 200?',
    tabellen: [{ kopf: ['a) Grundschaden G', '5 SP entsprechen p = 5 : G'], zeilen: um1.map(G => [String(G), '']), x: 2.15, w: 3.97, gew: [1.625, 2.348], pt: 11, vorGap: 0.19, nachGap: 0.38 },
               { kopf: ['b) Grundschaden G', '15 % von G'], zeilen: um2.map(([G]) => [String(G), '']), x: 2.15, w: 3.97, gew: [1.636, 2.337], pt: 11 }],   // Julian 10.11.: schmal, zentriert, 11 pt
    loesung: [...um1.map(G => `a) G = ${G}: 5 : ${G} = ${f3(5 / G)} = ${f(5 / G * 100)} %`), ...um2.map(([G, p]) => `b) G = ${G}: ${G} · ${f(p / 100)} = ${f(R.prozentwert(G, p))} SP`)]
  });

  const q7b = daten.quests.find(q => q.id === '7b'), l7b = rpg.loeseQuest(q7b);
  aufgaben.push({
    nr: 3, neueSeite: true, einBlock: true, zeilenAnz: { 0: 4 }, titel: 'Armband oder Ring?', text: q7b.text.replace('Armband des Feuers', bi('armband-des-feuers')).replace('Ring der Glut', bi('ring-der-glut')) + ' Entscheide für jede Waffe in der Tabelle, ob der Ring oder das Armband besser ist. Ab welchem Grundschaden lohnt sich der Ring? Rechne mit dem Mittelwert des Armbands.\nDie Werte aller Waffen, des Armbands und des Rings findest du in der Übersicht zu Einheit 7.',
    tabellen: [{ kopf: ['Waffe', 'mit Armband', 'mit Ring', 'besser'], zeilen: q7b.waffen.map(w => [name(w), '', '', '']), gew: [2.356, 1.481, 2.221, 1.212], pt: 11 }],
    loesung: [...l7b.zeilen.map(z => `${z.waffe}: Armband ${f(z.mitAbsolut)} SP, Ring ${f(z.mitProzent)} SP → ${z.besser}`),
      `Schwelle: 12,5 : 0,2 = ${f(l7b.schwellenGrundschaden)}. Bei G > ${f(l7b.schwellenGrundschaden)} lohnt sich der Ring.`]
  });

  const w = rpg.duellWahrscheinlichkeit(sA, sB, duellDaten.lp);
  aufgaben.push({
    nr: 4, titel: 'Das Duell',
    abstaende: { nachRegeln: 0, nachTabelle: 0, nachNachdenken: 0.08 },
    einBlock: true, blockSp6: true, zeilenAnz: { 0: 5 }, blockExtra: 0.07, schritte: { 0: 1.27 }, tabelleVorRegeln: true, trenner: true, regelPt: 11, nachdenkenStil: { pt: 11, italic: true, gap: 0.05 },   // Julian 10.11.: Tabelle direkt unter dem Text, Zierlinie, 11 pt
    text: `${duellDaten.herausforderer} bietet dir zwei Sets an: Set A mit prozentualem Bonus, Set B mit festem Bonus. Berechne für beide Sets Minimum, Mittelwert und Maximum eines Treffers. Welches Set ist besser?\nWähle dann ein Set und tritt im Würfelduell gegen ${duellDaten.herausforderer.split(' ')[1]} an.\nA Kälteset (anteilig): ${bi(sA.waffe)} + ${bi(sA.zauber)}\nB Glutset (absolut): ${bi(sB.waffe)} + ${bi(sB.zauber)}`,
    tabellen: [{ kopf: ['Set', 'Minimum', 'Mittelwert', 'Maximum'], zeilen: [['Kälte', '', '', ''], ['Glut', '', '', '']], x: 2.29, w: 3.7, gew: [0.883, 0.937, 0.937, 0.937], pt: 10.5, kopfH: 0.28, rowH: 0.31, nachGap: 0.26 }],
    regeln: [
      `Beide haben ${duellDaten.lp} LP. Du wählst zuerst ein Set, ${duellDaten.herausforderer.split(' ')[1]} bekommt das andere.`,
      `Jede Runde würfeln beide einmal: 1–2 → Min, 3–4 → Mittel, 5–6 → Max. Du würfelst auch für ${duellDaten.herausforderer.split(" ")[1]}.`,
      'Der Schaden wird gleichzeitig von den LP des anderen abgezogen.',
      'Sobald jemand 0 LP oder weniger hat, endet das Duell. Wer weniger tief im Minus liegt, gewinnt (genau gleich: Rückkampf).'
    ],
    tabellen2: [{ kopf: ['Runde', 'Dein Wurf', 'Dein Schaden', 'LP Gegenüber', 'Gegenüber: Wurf', 'Gegenüber: Schaden', 'Deine LP'], zeilen: [1, 2, 3, 4, 5, 6].map(n => [String(n), '', '', '', '', '', '']), pt: 10, randFrei: true }],
    nachdenken: ['Hat das bessere Set gewonnen? War es Glück oder Pech?', 'Spielt das Duell 10-mal und sammelt die Ergebnisse der Klasse: Wie oft gewinnt Set A, wie oft Set B?'],
    loesung: [
      `${sA.name}: ${rpg.erklaere(sA).join(' | ')} → Min ${f(tA.min)} / Mittel ${f(tA.avg)} / Max ${f(tA.max)}`,
      `${sB.name}: Flammenschwert 32,5–42,5 + Handschuhe 10 → Min ${f(tB.min)} / Mittel ${f(tB.avg)} / Max ${f(tB.max)}`,
      `Begründung: Der Grundwert ist klein (40 bzw. 37,5), 10 % davon sind nur 4 SP – der feste Bonus von 10 SP ist mehr als doppelt so viel. Set B ist besser (Mittelwert 47,5 gegen 44). Schwellenwert für +10 %: 10 : 0,1 = 100 – erst über Grundschaden 100 wären Prozente besser.`,
      `Exakte Gewinnchancen bei ${duellDaten.lp} LP: ${sA.name} ${f(w.A * 100)} %, ${sB.name} ${f(w.B * 100)} % (unentschieden ${f(w.unentschieden * 100)} %).`,
      `Das Duell dauert im Durchschnitt etwa ${f(w.erwarteteRunden)} Runden. Das bessere Set gewinnt deutlich öfter, aber nicht immer.`
    ]
  });

  return { einheit: 7, titel: 'Duelle', untertitel: 'Absolut oder prozentual?',
           einstieg: 'Auf dem Turnierplatz von Zahlheim ruft Ritter Absalom den Besten der Stadt zum Duell. Er ist großzügig: Du darfst zwischen zwei Ausrüstungssets wählen – wenn du klug rechnest.',
           beispiel, sicherung, aufgaben, abstaende: { nachBeispiel: 0.16 }, duell: { id: duellDaten.id, lp: duellDaten.lp, gewinnchance: w } };
}

function einheit8() {
  const W = { waffe: 'wutklinge' }, K = { waffe: 'wirbelklinge' }, L = { waffe: 'gleichmaessige-klinge' };
  const q8a = daten.quests.find(q => q.id === '8a'), l8a = rpg.loeseQuest(q8a);
  const G = rpg.treffer(W).avg, Gk = rpg.treffer(K).avg;
  const summe = (build, r) => rpg.schadenNachRunden(build, null, r, 'avg');
  const proAngriff = (g, n) => g * Math.pow(1.05, n - 1);

  /* ---- Beispiel: nur Einzelschaden (5 Angriffe, Rest zum Selbstausfüllen) ---- */
  const bspVoll = [1, 2, 3, 4, 5].map(n => [String(n),
    n === 1 ? `${f(G)}` : `${f3(proAngriff(G, n - 1))} · 1,05`, f3(proAngriff(G, n))]);
  const bspLeer = bspVoll.map((z, i) => i < 2 ? z : i === 2 ? [z[0], z[1], ''] : [z[0], '', '']);
  const beispiel = {
    problem: `Die Wutklinge (Langschwert) macht ${f(G)} SP. Aber: Jeder Angriff macht 5 % mehr Schaden als der Angriff davor! Wie viel Schaden macht der 2., 3., 4. und 5. Angriff? (Rechne mit dem Taschenrechner und runde erst am Ende.)`,
    tabelle: { kopf: ['Angriff', 'Rechnung', 'Schaden (SP)'], zeilen: bspLeer },
    loesungTabelle: { kopf: ['Angriff', 'Rechnung', 'Schaden (SP)'], zeilen: bspVoll },
    erkenntnis: {
      text1: 'Du multiplizierst immer wieder mit 1,05. Du kannst die Potenzschreibweise nutzen.',
      rechnung: `(${f(G)} · 1,05) · 1,05 = ${f(G)} · 1,05 · 1,05 = ${f(G)} · 1,05² = ${f3(proAngriff(G, 3))} SP.`,
      text2: 'Jeder Angriff wird um 5 % des vorherigen Wertes stärker – Zinsen auf Zinsen!'
    }
  };

  const sicherung = {
    titel: 'Merke: Wiederholte prozentuale Steigerung („Zinsen“)',
    formeln: [
      { wenn: 'Nächster Angriff (+5 %)', formel: 'neu = alt · 1,05', beispiel: '31,5 · 1,05 = 33,075' },
      { wenn: 'Mehrfach mit 1,05 multiplizieren ⇒ Potenz', formel: 'G · 1,05 · 1,05 · 1,05 = G · 1,05³',
        klammern: { labels: ['1. Schlag', '2. Schlag', '3. Schlag'], enden: ['G · 1,05', 'G · 1,05 · 1,05', 'G · 1,05 · 1,05 · 1,05'] },
        beispiel: `((${f(G)} · 1,05) · 1,05) · 1,05\n= ${f(G)} · 1,05 · 1,05 · 1,05\n= ${f(G)} · 1,05³ ≈ ${f(proAngriff(G, 4))}` },
      { wenn: 'Nach n Angriffen', formel: 'Schaden = G · 1,05ⁿ', beispiel: `nach 9 Angriffen (= 10. Angriff): ${f(G)} · 1,05⁹ ≈ ${f(proAngriff(G, 10))}` }
    ],
    umrechnung: 'Die 5 % beziehen sich immer auf den vorherigen Angriff, nicht auf den Startwert. Darum wächst der Schaden immer schneller. Der Exponent ist die Anzahl der Steigerungen.',
    achtung: 'In jedem Kampf beginnt der Aufbau wieder beim 1. Angriff.'
  };

  const aufgaben = [];

  /* A1: Wutklinge gegen Klinge der Rachsucht (Einzelschaden, 5 % gegen 8 %) – kommt vor der Wirbelklinge */
  const R = { waffe: 'klinge-der-rachsucht' }, GR = rpg.treffer(R).avg, pR = rpg.item('klinge-der-rachsucht').aufbau.prozent, fR = 1 + pR / 100;
  const pa = (g, n, fa = 1.05) => g * Math.pow(fa, n - 1);
  const zeilenR = [['Wutklinge', G, 1.05, 6], ['Wutklinge', G, 1.05, 10], ['Wutklinge', G, 1.05, 20], ['Klinge der Rachsucht', GR, fR, 6], ['Klinge der Rachsucht', GR, fR, 10], ['Klinge der Rachsucht', GR, fR, 20]]
    .map(([nm, g, fa, n]) => ({ nm, n, g, fa, s: pa(g, n, fa) }));
  const erstMind = (g, fa, ziel) => { let n = 1; while (pa(g, n, fa) < ziel) n++; return n; };
  const schwelleZiel = 40, nW40 = erstMind(G, 1.05, schwelleZiel), nR40 = erstMind(GR, fR, schwelleZiel);
  let nEinR = 1; while (pa(GR, nEinR, fR) <= pa(G, nEinR)) nEinR++;                  // ab hier macht die Rachsucht pro Angriff mehr
  aufgaben.push({
    nr: 1, titel: 'Wutklinge gegen Klinge der Rachsucht',
    text: `Alle Klingen und Gegner dieser Einheit findest du in der Übersicht zu Einheit 8. Die Klinge der Rachsucht macht mit ${f(GR)} SP etwas weniger Schaden als die Wutklinge (${f(G)} SP), wird aber bei jedem Angriff um ${pR} % stärker (die Wutklinge nur um 5 %). Du rechnest dann mit dem Faktor ${f(fR)}. a) Berechne mit der Potenz-Formel, wie viel Schaden der jeweilige Angriff macht (runde auf zwei Stellen). b) Beide Klingen sollen mindestens ${schwelleZiel} SP Schaden pro Angriff machen. Beim wievielten Angriff ist das jeweils zum ersten Mal der Fall? (Probiere mit dem Taschenrechner.) c) Ab dem wievielten Angriff macht die Klinge der Rachsucht pro Angriff mehr Schaden als die Wutklinge? d) Zeichne ein Koordinatensystem mit der Anzahl der Angriffe auf der x-Achse und dem Schaden auf der y-Achse. Trage die Werte für beide Klingen ein.`,
    einzeilig: [1, 3], schritte: { 1: 0.297, 2: 0.492, 3: 0.268, 4: 0.577 }, abstaende: { nachTabelle: -0.04 },
    tabellen: [{ kopf: ['Waffe', 'Grundschaden', 'Angriff Nr.', 'Rechnung', 'Schaden (SP)'],
                 zeilen: zeilenR.map(z => [z.nm, f(z.g), String(z.n) + '.', '', '']) }],
    loesung: [
      ...zeilenR.map(z => `${z.nm}, ${z.n}. Angriff: ${f(z.g)} · ${f(z.fa)}^${z.n - 1} = ${f(z.s)} SP`),
      `b) Wutklinge: beim ${nW40}. Angriff (${f(pa(G, nW40))} SP; der ${nW40 - 1}. macht erst ${f(pa(G, nW40 - 1))} SP). Klinge der Rachsucht: beim ${nR40}. Angriff (${f(pa(GR, nR40, fR))} SP; der ${nR40 - 1}. macht erst ${f(pa(GR, nR40 - 1, fR))} SP).`,
      `c) Ab dem ${nEinR}. Angriff: Rachsucht ${f(pa(GR, nEinR, fR))} SP gegen Wutklinge ${f(pa(G, nEinR))} SP (beim ${nEinR - 1}. Angriff noch ${f(pa(GR, nEinR - 1, fR))} gegen ${f(pa(G, nEinR - 1))} SP).`,
      'd) Koordinatensystem: x-Achse Angriffe, y-Achse Schaden (Werte aus den Rechnungen). Beide Kurven steigen; die der Klinge der Rachsucht beginnt tiefer, wird aber steiler und schneidet die der Wutklinge beim ' + nEinR + '. Angriff.',
      'Beobachtung: Der kleinere Startwert wird durch den höheren Prozentsatz ausgeglichen – bei langen Kämpfen ist die Klinge der Rachsucht deutlich stärker (20. Angriff: ' + f(pa(GR, 20, fR)) + ' gegen ' + f(pa(G, 20)) + ' SP).']
  });

  /* A2: Einzelschaden der Wirbelklinge */
  const zeilen1 = [4, 10, 20].map(n => ({ nm: 'Wirbelklinge', n, g: Gk, s: proAngriff(Gk, n) }));
  const nWirbel = erstMind(Gk, 1.05, G);
  aufgaben.push({
    nr: 2, titel: 'Die Wirbelklinge: Schaden des n-ten Angriffs',
    text: `Die Wirbelklinge (Kurzschwert) macht nur ${f(Gk)} SP, greift aber 2-mal pro Runde an – und auch bei ihr wird jeder Angriff um 5 % stärker. a) Berechne mit der Potenz-Formel, wie viel Schaden der jeweilige Angriff macht (runde auf zwei Stellen). b) Die Wutklinge macht mit ihrem 1. Angriff ${f(G)} SP. Beim wievielten Angriff macht die Wirbelklinge zum ersten Mal mindestens so viel Schaden? (Probiere mit dem Taschenrechner.)`,
    tabellen: [{ kopf: ['Waffe', 'Grundschaden', 'Angriff Nr.', 'Rechnung', 'Schaden (SP)'],
                 zeilen: zeilen1.map(z => [z.nm, f(z.g), String(z.n) + '.', '', '']) }],
    loesung: [
      ...zeilen1.map(z => `${z.nm}, ${z.n}. Angriff: ${f(z.g)} · 1,05^${z.n - 1} = ${f(z.s)} SP`),
      `b) Beim ${nWirbel}. Angriff: ${f(Gk)} · 1,05^${nWirbel - 1} = ${f(proAngriff(Gk, nWirbel))} SP (der ${nWirbel - 1}. Angriff macht erst ${f(proAngriff(Gk, nWirbel - 1))} SP).`,
      'Beobachtung: Erst der ' + nWirbel + '. Angriff der Wirbelklinge macht so viel wie der 1. der Wutklinge – dafür greift sie aber doppelt so oft an.']
  });

  /* A2: Gesamtschaden + Hilfstabelle + Gegner */
  const half = 12;
  const help = Array.from({ length: half }, (_, i) => { const r1 = i + 1, r2 = i + 1 + half;
    return [String(r1), f1(summe(W, r1)), f1(summe(K, r1)), String(r2), f1(summe(W, r2)), f1(summe(K, r2))]; });
  const w2 = [1, 2].map(n => proAngriff(G, n)), k4b = [1, 2, 3, 4].map(n => proAngriff(Gk, n));
  const w6 = [1, 2, 3, 4, 5, 6].map(n => proAngriff(G, n)); let sw = 0; const wSumme = w6.map(x => (sw += x));
  let sk = 0; const kSumme = k4b.map(x => (sk += x));
  const leer = n => Array.from({ length: n }, (_, i) => [String(i + 1), '', '', '']);
  aufgaben.push({
    nr: 3, titel: 'Gesamtschaden: Wer besiegt wen schneller?',
    hinweis: ['Jetzt zählt nicht der einzelne Angriff, sondern der Gesamtschaden: Du musst alle bisherigen Angriffe addieren.', 'Die Wirbelklinge greift zwei Mal pro Runde an.'],
    text: `a) Fülle die Tabellen (nächste Seite) aus: Berechne den Schaden jedes Angriffs (wie in Aufgabe 1 und 2) und addiere ihn zum bisherigen Gesamtschaden. Wer hat nach 2 Runden mehr Gesamtschaden gemacht? (Wutklinge: 1 Angriff pro Runde, Wirbelklinge: 2 Angriffe pro Runde.) b) In der Arena warten vier Gegner mit verschieden viel Leben (siehe Übersicht). Lies in der Hilfstabelle (Gesamtschaden nach n Runden) ab, nach wie vielen Runden jede Waffe den Gegner besiegt hat (Gesamtschaden ≥ LP). Welche Waffe ist jeweils schneller? Trage deine Ergebnisse in der Tabelle auf der nächsten Seite ein.`,
    zeilenAnz: { 1: 3 },
    tabellen: [{ titel: 'Wutklinge', kopf: ['Angriff', 'Rechnung', 'Schaden (SP)', 'Gesamtschaden (SP)'], zeilen: leer(6) },
               { titel: 'Wirbelklinge', kopf: ['Angriff', 'Rechnung', 'Schaden (SP)', 'Gesamtschaden (SP)'], zeilen: leer(4) },
               { titel: 'Hilfstabelle: Gesamtschaden nach n Runden (SP)', kopf: ['Runde', 'Wutklinge', 'Wirbelklinge', 'Runde', 'Wutklinge', 'Wirbelklinge'], zeilen: help },
               { titel: 'Deine Ergebnisse', kopf: ['Gegner', 'LP', 'Runden Wutklinge', 'Runden Wirbelklinge', 'Schneller'], zeilen: l8a.tabelle.map(r => [r.gegner, String(r.lp), '', '', '']) }],
    loesung: [`a) Wutklinge – Schaden: ${w6.map(x => f(x)).join(' | ')}; Gesamtschaden: ${wSumme.map(x => f(x)).join(' | ')}`,
      `a) Wirbelklinge – Schaden: ${k4b.map(x => f(x)).join(' | ')}; Gesamtschaden: ${kSumme.map(x => f(x)).join(' | ')}`,
      `a) Nach 2 Runden: Wutklinge ${f(summe(W, 2))} SP (2 Angriffe), Wirbelklinge ${f(summe(K, 2))} SP (4 Angriffe) – die Wutklinge ist noch vorn.`,
      ...l8a.tabelle.map(r => `b) ${r.gegner} (${r.lp} LP): Wutklinge ${r['Wutklinge']} ${r['Wutklinge'] === 1 ? 'Runde' : 'Runden'}, Wirbelklinge ${r['Wirbelklinge']} ${r['Wirbelklinge'] === 1 ? 'Runde' : 'Runden'} → ${r.schneller}${r.schneller === 'gleich schnell' ? '' : ' schneller'}`)]
  });

  /* A3: Überholen */
  const ueber = rpg.ueberholRunde(W, K);
  aufgaben.push({
    nr: 4, titel: 'Wann lohnt sich die schnelle Klinge?', zeilenMult: { 2: 1.5 }, schritte: [0.25, 0.276, 0.698, 0.513, 0.393],   // Julian 09.11.: Abstände von Hand angepasst (Start-zu-Start-Abstände), b) mit Zeilenabstand 1,5
      // Julian 09.11.: b) mit Zeilenabstand 1,5; Abstand der Teilaufgaben vergrößert
    text: 'Schau dir die Hilfstabelle genau an. a) Ab welcher Runde hat die Wirbelklinge insgesamt mehr Schaden gemacht als die Wutklinge? b) Ergänze: Bei Gegnern mit wenig Leben ist die __________________________ besser, bei Gegnern mit viel Leben die __________________________. c) Zeichne ein Koordinatensystem mit der Anzahl der Runden auf der x-Achse und dem Gesamtschaden auf der y-Achse. Trage die Werte für beide Klingen ein. d) Erkläre, warum die Wirbelklinge trotz des kleineren Startwertes irgendwann vorn liegt.',
    loesung: [`a) Ab Runde ${ueber}: Wirbelklinge ${f(summe(K, ueber))} SP, Wutklinge ${f(summe(W, ueber))} SP (Runde ${ueber - 1}: ${f(summe(K, ueber - 1))} gegen ${f(summe(W, ueber - 1))}).`,
      'b) Wenig Leben: Wutklinge (Langschwert). Viel Leben: Wirbelklinge (Kurzschwert).',
      'c) Koordinatensystem: x-Achse Runden, y-Achse Gesamtschaden (Werte aus der Hilfstabelle). Beide Kurven steigen; die der Wirbelklinge beginnt tiefer, ist aber steiler und schneidet die der Wutklinge in Runde ' + ueber + '.',
      'd) Die Wirbelklinge greift doppelt so oft an. Ihre „Zinsen“ wirken nach n Runden 2n-mal statt n-mal – der Aufbau holt den kleineren Startwert irgendwann ein. Wer lange kämpft, profitiert vom häufigeren Aufbau.']
  });

  /* ★ A4: Zins gegen fester Aufbau (Gleichmäßige Klinge: fest +2 SP pro Angriff) */
  const betrag = rpg.item('gleichmaessige-klinge').aufbau.betrag;
  const einzel = (b, n) => rpg.schadenNachRunden(b, null, n) - rpg.schadenNachRunden(b, null, n - 1);
  const lin = n => 30 + (n - 1) * betrag;
  const ns = [10, 14];
  let nEinzel = 1; while (einzel(W, nEinzel) <= einzel(L, nEinzel) + 1e-9) nEinzel++;    // ab hier macht die Wutklinge pro Angriff mehr
  const nGesamt = rpg.ueberholRunde(L, W);                                                // ab hier ist ihr Gesamtschaden größer
  const reihe = [1, 2, 3, 4].map(n => lin(n)).join('; ');
  aufgaben.push({
    nr: 5, titel: '★ Zinsen oder fester Aufbau?', differenzierung: true, teilGap: 0.12,
    text: `Die Gleichmäßige Klinge (Langschwert, 30 SP, 1 Angriff pro Runde) macht bei jedem Angriff immer ${betrag} SP mehr Schaden als beim Angriff davor (${reihe}; …). Die Wutklinge steigert dagegen jedes Mal um 5 % des vorherigen Schadens. a) Berechne den Schaden des ${ns[0]}. und des ${ns[1]}. Angriffs für beide Waffen. b) Berechne den Gesamtschaden nach ${ns[0]} bzw. ${ns[1]} Angriffen. c) Welche Waffe ist besser? Warum? d) Zeichne die Werte für die Gleichmäßige Klinge im Koordinatensystem aus Aufgabe 4 ein. e) Gibt es eine Anzahl an Angriffen, ab der sich dies ändert?`,
    loesung: [`a) Gleichmäßige Klinge: ${ns.map(n => `${n}. Angriff: 30 + ${n - 1} · ${betrag} = ${f(lin(n))} SP`).join('; ')}. Wutklinge: ${ns.map(n => `${n}. Angriff: 30 · 1,05^${n - 1} = ${f(einzel(W, n))} SP`).join('; ')}.`,
      `b) Nach ${ns[0]} Angriffen: Gleichmäßige Klinge ${f(summe(L, ns[0]))} SP, Wutklinge ${f(summe(W, ns[0]))} SP. Nach ${ns[1]} Angriffen: ${f(summe(L, ns[1]))} gegen ${f(summe(W, ns[1]))}.`,
      `c) In diesem Bereich (bis ${ns[1]} Angriffe) ist die Gleichmäßige Klinge besser: Ihr Schaden wächst zu Beginn schneller (+${betrag} SP statt anfangs +1,5 SP). Der Gesamtschaden ist bei ihr bis dahin größer.`,
      `d) Die Gleichmäßige Klinge ergibt eine Gerade (Anstieg ${betrag} SP je Angriff beim Einzelschaden), die Wutklinge eine immer steilere Kurve.`,
      `e) Ja: Bei weiteren Angriffen wird die Wutklinge immer besser, weil ihr Zuwachs jedes Mal größer wird. Ab dem ${nEinzel}. Angriff macht sie pro Angriff mehr Schaden (${f(einzel(W, nEinzel))} gegen ${f(einzel(L, nEinzel))} SP). Beim Gesamtschaden liegt sie erst ab dem ${nGesamt}. Angriff vorn (${f(summe(W, nGesamt))} gegen ${f(summe(L, nGesamt))} SP).`]
  });

  return { einheit: 8, titel: 'Die Arena', untertitel: 'Zinsen: Jeder Angriff macht prozentual mehr Schaden',
    einstieg: 'In der großen Arena von Zahlheim kämpfen die Besten gegen immer stärkere Gegner. Manche Waffen werden im Kampf stärker: Mit jedem Treffer wächst ihr Schaden. Aber welche Waffe lohnt sich gegen welchen Gegner?',
    beispiel, sicherung, aufgaben };
}

/* ====================== Einheit 1–3 ====================== */
const QU = ['FEUER', 'EIS', 'BLITZ', 'PHYSISCH', 'CHAOS'];
const vz = p => (p >= 0 ? '+' : '−') + f3(Math.abs(p)) + ' %';
const slotNamen = b => ({ waffe: b.waffe ? name(b.waffe) : '', ruestung: b.ruestung ? name(b.ruestung) : '', zauber: b.zauber ? name(b.zauber) : '' });
const itemsVon = b => [b.waffe, b.ruestung, b.zauber].filter(Boolean).map(id => rpg.item(id));
/* Schadensarten, in denen die Gegenstände Grundschaden machen (oder in die umgewandelt wird) – für die vorbereiteten Zeilen der Build-Tabelle */
function quellenVon(b) {
  const s = new Set();
  itemsVon(b).forEach(it => { (it.schaden || []).forEach(x => s.add(x.quelle)); (it.effekte || []).forEach(e => e.typ === 'umwandlung' && s.add(e.nach)); });
  return QU.filter(q => s.has(q));
}
/* Zahlen für die Build-Tabelle (Musterlösung) */
function werteVon(b) {
  const p = rpg.profil(b), zeilen = {};
  QU.forEach(q => {
    if (!(p[q].basis.max > 0)) return;
    zeilen[q] = { basis: [p[q].basis.min, p[q].basis.mittel, p[q].basis.max].map(f3), mods: p[q].modifikatorSumme ? vz(p[q].modifikatorSumme) : '0 %', faktor: f3(p[q].faktor), schaden: [p[q].min, p[q].mittel, p[q].max].map(f3),
      bonus: [p[q].min - p[q].basis.min, p[q].mittel - p[q].basis.mittel, p[q].max - p[q].basis.max].map(f3) };   // Bonus = Schaden − Grundschaden (= Grundschaden · Modifikator)
  });
  const t = rpg.treffer(b);
  return { zeilen, gesamt: [t.min, t.avg, t.max].map(f3) };
}
/* Build-Tabelle ohne Zahlen (Schüler füllen aus) */
function buildLeer(titel, b, o = {}) {
  return { titel, slots: o.slotsLeer ? {} : slotNamen(b), modus: o.modus || 'kurz', quellen: o.alle ? QU : (o.quellen || quellenVon(b)), ruestung: o.ruestung !== false, besonderheiten: !!o.besonderheiten, bonus: o.bonus !== false, ohneIcon: !!o.ohneIcon };
}
/* Build-Tabelle mit Zahlen (Musterlösung) */
function buildVoll(titel, b, o = {}) {
  const w = werteVon(b);
  const bes = itemsVon(b).flatMap(effektZeilen).join('; ');
  return { titel, slots: slotNamen(b), modus: o.modus || 'voll', quellen: Object.keys(w.zeilen), ruestung: o.ruestung !== false, besonderheiten: !!o.besonderheiten, werte: w, besonderheitenText: bes, bonus: o.bonus !== false, ohneIcon: !!o.ohneIcon };
}
/* Rechnung als Text (Mittelwerte) */
function rechnung(b, g, bonus = true) {   // Einheit 1–3 rechnen ohne Faktor (Bonus = Grundschaden · Modifikator); bonus = false liefert die alte Faktor-Schreibweise
  const p = rpg.profil(b), t = rpg.treffer(b, g);
  const teile = QU.filter(q => p[q].basis.max > 0).map(q => {
    const s = p[q], gf = g ? t.proQuelle[q].widerstandsFaktor : 1;
    let txt = `${q} ${f3(s.basis.mittel)}`;
    if (s.modifikatorSumme && bonus) txt += ` ${s.modifikatorSumme > 0 ? '+' : '−'} ${f3(s.basis.mittel)} · ${f3(Math.abs(s.modifikatorSumme) / 100)} = ${f3(s.basis.mittel)} ${s.modifikatorSumme > 0 ? '+' : '−'} ${f3(Math.abs(s.mittel - s.basis.mittel))} = ${f3(s.mittel)}`;
    else if (s.modifikatorSumme) txt += ` · (1 ${s.modifikatorSumme > 0 ? '+' : '−'} ${f3(Math.abs(s.modifikatorSumme) / 100)}) = ${f3(s.basis.mittel)} · ${f3(s.faktor)} = ${f3(s.mittel)}`;
    if (g && gf !== 1) txt += ` · ${f3(gf)} = ${f3(s.mittel * gf)}`;
    return txt;
  });
  return `${teile.join('; ')} → Ø ${f3(t.avg)} SP (Min ${f3(t.min)}, Max ${f3(t.max)})`;
}
const eng = (a, b, c) => rpg.item(a).name + (b ? ' + ' + rpg.item(b).name : '') + (c ? ' + ' + rpg.item(c).name : '');
const sBuild = b => [b.waffe, b.ruestung, b.zauber].filter(Boolean).map(name).join(' + ');
const LETTER = 'abcdefgh';

function einheit1() {
  const c = [{ waffe: 'verdammnissaeher', zauber: 'rote-bullentrinkflasche' }, { waffe: 'baldars-weisheit', zauber: 'feenstaub' }, { waffe: 'feuersturm', zauber: 'armband-des-feuers' }];
  const kurzregeln = { titel: 'Das musst du wissen', punkte: [
    'Jede Waffe macht pro Treffer Schaden (SP) zwischen einem Minimum und einem Maximum. Der Mittelwert (Ø) liegt genau dazwischen.',
    'Jeder Schaden hat eine Schadensart: FEUER, EIS, BLITZ, PHYSISCH oder CHAOS. ELEMENTAR ist der Sammelname für FEUER, EIS und BLITZ.',
    ['Ein Modifikator wie „+50 % FEUER“ erhöht den FEUERschaden anteilig vom Grundschaden.', 'Bonus = Grundschaden · Modifikator; neuer Schaden = Grundschaden + Bonus.', 'Beispiel: Grundschaden 30 FEUERschaden, Bonus: 30 SP · 0,5 = 15 SP, neuer Schaden = 30 + 15 = 45 SP'],   // mehrzeilig (Julian, 08.11.): kein Faktor in Einheit 1
    ['Modifikatoren mit derselben Schadensart werden zuerst ADDIERT und wirken dann zusammen:', '+50 % und +50 % sind +100 %.']   // mehrzeilig (Julian, 09.11.)
    ], nummerAuto: [2, 3], autoPlus: 0.02 };   // Punkt 3 und 4: automatische Nummerierung mit hängendem Einzug (Julian, 10.11.)
  const aufgaben = [];
  const gleiche = c[0];
  aufgaben.push({
    nr: 1, titel: 'Drei Angebote des Schmieds',
    text: 'Der Schmied legt dir drei Kombinationen aus Waffe und Zaubergegenstand vor. Berechne für jede den durchschnittlichen neuen Schaden pro Treffer (Mittelwert).',
    nummern: c.map(b => `Kombination: ${bi(b.waffe)} & ${bi(b.zauber)}`),
    nachText: 'Es kann dir helfen, im Heft jeweils eine solche Tabelle für die Kombinationen anzulegen.',
    /* Beispiel: erste Zeile der Kombination a) vorausgefüllt (Waffen-/Zauber-Namen eingetragen, Bilder stehen in der Übersicht) */
    builds: [{ ...buildLeer('Beispiel', gleiche, { ruestung: false, bonus: true }), ohneTitel: true, dicht: false, schadenKopf: 'Neuer Schaden (Ø)', vorgabe: [['Physisch', '35', '50 % + 50 % = 100 %', '', ''], ['…', '', '', '', '']] }],
    yExtra: 0.11,   // Abstand zum Beispiel-Kasten (Julian, 10.11.)
    loesung: c.map((b, i) => `${LETTER[i]}) ${sBuild(b)}: ${rechnung(b, undefined, true)}`)
  });
  /* A2: offene Aufgabe (Aufgabe „Addieren oder multiplizieren?“ entfällt, Julian 08.11.) */
  const top = rpg.besteBuilds(1, 'avg', 5);
  const topMax = rpg.besteBuilds(1, 'max', 3);
  const best = top[0].build;
  aufgaben.push({
    nr: 2, titel: 'Die beste Ausstattung', neueSeite: true, yExtra: 0.05, zeilenAnz: { 0: 3 },   // Julian 10.11.: Abstand oben +0,05 ", Textblock exakt 3 Zeilen
    text: 'Statte deine Figur so aus, dass sie maximalen Schaden anrichtet! Du darfst eine Waffe und einen Zaubergegenstand kombinieren (Gegenstandskarten Stufe 1). Trage deinen besten Build in die Vorlage ein, mache alle Überlegungen im Heft und schreibe sie so auf, dass du sie anderen Spielern erklären kannst.',
    builds: [buildLeer('Mein bester Build', {}, { alle: true, modus: 'voll', ruestung: false, slotsLeer: true, bonus: true, ohneIcon: true })],
    loesung: [`Beste Builds nach Mittelwert (54 mögliche Kombinationen): ${top.map(x => `${sBuild(x.build)} (Ø ${f3(x.schaden)})`).join('; ')}.`,
      'Warum Mjölnir? Er macht 40 BLITZ und 25 PHYSISCH und hat selbst +50 % BLITZ. Der Glückbringende Magnetstein gibt noch einmal +50 % auf BLITZ → Summe +100 % → Bonus 40 · 1 = 40 → BLITZ 40 + 40 = 80, dazu PHYSISCH 25 → Ø 105. Der Feenstaub gibt nur +40 % → Summe +90 % → Bonus 40 · 0,9 = 36 → BLITZ 76 → Ø 101.',
      'Alle Wege zur Lösung zählen, wenn sie begründet sind: Schüler können alle 54 Kombinationen durchrechnen oder gezielt die Waffen mit viel Grundschaden und passenden Modifikatoren vergleichen.'],
    loesungBuilds: [buildVoll('Musterlösung', best, { ruestung: false, bonus: true })]
  });
  const gl = topMax[0].build, glT = rpg.treffer(gl), beT = rpg.treffer(best);
  aufgaben.push({
    nr: 3, titel: '★ Sicher oder riskant?', differenzierung: true, einzeilig: [1], yExtra: 0.18,   // Julian 10.11.: mehr Abstand zum Kasten darüber
    text: 'Im Würfelduell zählt manchmal der Glückstreffer. a) Suche den Build, der im besten Fall (Maximum) am meisten Schaden macht, und trage ihn in die Vorlage ein. b) Vergleiche Minimum, Mittelwert und Maximum mit deinem Build aus Aufgabe 2. Wann würdest du welchen wählen?',
    builds: [{ ...buildLeer('Mein Glücks-Build', {}, { alle: true, modus: 'voll', ruestung: false, slotsLeer: true, bonus: true, ohneIcon: true }), dicht: true }],
    loesung: [`a) Größtes Maximum: ${sBuild(gl)} mit Min ${f3(glT.min)}, Ø ${f3(glT.avg)}, Max ${f3(glT.max)}.`,
      `b) Der Mjölnir-Build liegt eng zusammen (Min ${f3(beT.min)}, Ø ${f3(beT.avg)}, Max ${f3(beT.max)}): zuverlässig. Der Glücks-Build hat ein viel größeres Maximum, aber auch ein kleines Minimum (${f3(glT.min)}) – er ist riskant.`,
      'Wer sicher einen bestimmten Wert braucht, wählt den zuverlässigen Build; wer nur mit Glück gewinnen kann, setzt auf das Maximum.'],
    loesungBuilds: [buildVoll('Musterlösung', gl, { ruestung: false, bonus: true })]
  });
  return { einheit: 1, titel: 'Die Schmiede', untertitel: 'Schaden berechnen und Ausrüstung kombinieren',
    einstieg: 'In der Schmiede von Zahlheim hängen Waffen und Zaubergegenstände an den Wänden. Der Schmied verspricht: „Mit der richtigen Kombination triffst du härter als jeder andere Held!“ Aber welche ist die richtige? Das musst du ausrechnen.',
    kurzregeln, aufgaben };
}

function einheit2() {
  const basis = { waffe: 'feuersturm' };     // Aufgabe 1: nur Waffe + Rüstung, kein Zaubergegenstand
  const ruestungen = ['umhang-des-bescheidenen', 'wams-des-wahnsinns', 'fokussierte-gedanken', 'koenigin-des-waldes', 'letzte-bastion', 'ruestung-der-dunkelheit'];
  const tb0 = rpg.treffer(basis);
  const kurzregeln = { titel: 'Neu bei Rüstungen', punkte: [
    'Zusätzlicher Grundschaden (z. B. „20–40 BLITZ“) wird zum Grundschaden gezählt und von den Modifikatoren mitverstärkt.',
    'Umwandlung: Ein Teil jedes Grundschadens wird zu einer anderen Schadensart – bevor die Modifikatoren wirken (z. B. beim Wams des Wahnsinns).'] };
  const aufgaben = [];
  const dy = { einstieg: 0.10, kurz: -0.02 };   // Julian 10.11.: Abstände auf Seite 1
  const QS = ['FEUER', 'BLITZ', 'PHYSISCH', 'CHAOS'];
  const zelle = (v) => (v > 0 ? f3(v) : '–');
  const profilVon = r => rpg.profil({ ...basis, ruestung: r }), avgVon = r => rpg.treffer({ ...basis, ruestung: r }).avg;
  const zeileFuer = (r) => { const b = { ...basis, ruestung: r }, p = rpg.profil(b), t = rpg.treffer(b);
    return [r ? name(r) : 'ohne Rüstung', ...QS.map(q => zelle(p[q].mittel)), f3(t.avg), r ? (t.avg > tb0.avg + 1e-9 ? 'ja' : 'nein') : '–']; };
  const vgl = r => { const d = avgVon(r) - tb0.avg; return d > 1e-9 ? `${f3(d)} SP besser als ohne Rüstung` : d < -1e-9 ? `${f3(-d)} SP schlechter als ohne Rüstung` : 'gleich gut'; };
  const bestR = ruestungen.slice().sort((x, y) => avgVon(y) - avgVon(x))[0];
  const pD = profilVon('wams-des-wahnsinns'), pF = profilVon('fokussierte-gedanken'), pU = profilVon('umhang-des-bescheidenen'), pK = profilVon('koenigin-des-waldes');
  aufgaben.push({
    nr: 1, titel: 'Welche Rüstung lohnt sich?', yExtra: 0.15, schritte: { 0: 0.91 }, abstaende: { nachTabelle: 0.06 }, nachdenkenStil: { pt: 11, italic: false, gap: 0.05 },   // Julian 10.11.: Abstände, Hinweis 11 pt ohne Kursiv
    text: `Dein Held trägt ${bi('feuersturm')} (ohne Rüstung Ø ${f3(tb0.avg)} SP pro Treffer). Alle Waffen, Rüstungen und Zaubergegenstände findest du auf den Gegenstandskarten (Stufe 1 und 2). Probiere diese sechs Rüstungen aus: ${ruestungen.map(bi).join(', ')}. Wie viel Schaden macht jede Schadensart, wie hoch ist der Gesamtschaden (Ø) – lohnt sich die Rüstung?`,
    nachText: 'Lege dir dafür im Heft eine Tabelle an, zum Beispiel so:',
    tabellen: [{ kopf: ['Rüstung', 'FEUER', 'BLITZ', 'PHYSISCH', 'CHAOS', 'Gesamt Ø', 'Besser?'],
      zeilen: [['ohne Rüstung', ...zeileFuer(null).slice(1, 5), f3(tb0.avg), '–'], [name(ruestungen[0]), '', '', '', '', '', ''], ['…', '', '', '', '', '', '']] }],
    nachdenken: ['Welche Rüstung passt gar nicht zu dieser Waffe? Erkläre im Heft, warum.'],
    loesungTabellen: [{ titel: 'Musterlösung (Mittelwerte, Basis: Feuersturm)', kopf: ['Rüstung', 'FEUER', 'BLITZ', 'PHYSISCH', 'CHAOS', 'Gesamt Ø', 'Besser?'], zeilen: [zeileFuer(null), ...ruestungen.map(zeileFuer)] }],
    loesung: [`Beste Rüstung: ${name(bestR)} (Ø ${f3(avgVon(bestR))}): Der zusätzliche BLITZ-Grundschaden (Ø ${f3(pK.BLITZ.mittel)}) kommt voll dazu, FEUER und PHYSISCH bleiben unverändert.`,
      `Umhang des Bescheidenen: SCHADEN +25 % wird bei FEUER (+50 +25 = +${f(pU.FEUER.modifikatorSumme)} %) und PHYSISCH (+${f(pU.PHYSISCH.modifikatorSumme)} %) addiert → Ø ${f3(avgVon('umhang-des-bescheidenen'))} (${vgl('umhang-des-bescheidenen')}).`,
      `Wams des Wahnsinns: Die Hälfte des FEUER- und PHYSISCH-Grundschadens wird zu CHAOS (${f3(pD.CHAOS.basis.mittel)}); CHAOS +25 % → ${f3(pD.CHAOS.mittel)}. FEUER ${f3(pD.FEUER.mittel)} und PHYSISCH ${f3(pD.PHYSISCH.mittel)} bleiben übrig → Ø ${f3(avgVon('wams-des-wahnsinns'))} (${vgl('wams-des-wahnsinns')}).`,
      `Fokussierte Gedanken: −50 % ELEMENTAR hebt die +50 % auf FEUER auf (FEUER bleibt ${f3(pF.FEUER.mittel)}); PHYSISCH +50 % → ${f3(pF.PHYSISCH.mittel)} → Ø ${f3(avgVon('fokussierte-gedanken'))} (${vgl('fokussierte-gedanken')}).`,
      `Letzte Bastion: kein FEUER mehr (Feuersturms Hauptschaden) → nur PHYSISCH ${f3(profilVon('letzte-bastion').PHYSISCH.mittel)} → Ø ${f3(avgVon('letzte-bastion'))} (${vgl('letzte-bastion')}).`,
      'Rüstung der Dunkelheit: kein ELEMENTAR- und kein PHYSISCHschaden → Feuersturm macht gar keinen Schaden (0 SP). Sie passt nur zu Waffen mit CHAOSschaden.']
  });
  const t1 = { waffe: 'feuersturm', ruestung: 'letzte-bastion' }, t2 = { waffe: 'verdammnissaeher', ruestung: 'letzte-bastion' };
  const o1 = rpg.treffer({ waffe: 'feuersturm' }).avg, o2 = rpg.treffer({ waffe: 'verdammnissaeher' }).avg;
  aufgaben.push({
    nr: 2, titel: 'Letzte Bastion – Segen oder Fluch?', yExtra: 0.08, schritte: { 0: 0.186, 1: 0.244 },   // Julian 10.11.: erste beiden Zeilen eng (wie ein Absatz)
    text: `${bi('letzte-bastion')} gibt +50 PHYSISCH Grundschaden, aber du verursachst keinen ELEMENTARschaden mehr.\nRechne im Heft (eine Tabelle wie in Aufgabe 3 hilft dir). a) Berechne den Schaden (Ø) mit ${bi('feuersturm')}. b) Berechne den Schaden (Ø) mit dem ${bi('verdammnissaeher')}. c) Vergleiche mit dem Schaden ohne Rüstung. Für welche Waffen lohnt sich Letzte Bastion? Schreibe deine Antwort ins Heft.`,
    loesung: [`a) ${rechnung(t1)}. FEUER fällt weg, PHYSISCH: 10,5 + 50 = 60,5. Ohne Rüstung ${f3(o1)} → nur ${f3(rpg.treffer(t1).avg - o1)} SP mehr.`,
      `b) ${rechnung(t2)}. PHYSISCH: 35 + 50 = 85, +50 % → 127,5. Ohne Rüstung ${f3(o2)} → ${f3(rpg.treffer(t2).avg - o2)} SP mehr.`,
      'c) Letzte Bastion lohnt sich für Waffen, die (fast) nur PHYSISCHEN Schaden machen und PHYSISCH-Modifikatoren haben: Der zusätzliche Grundschaden wird mitverstärkt. Bei Waffen mit viel ELEMENTARschaden verliert man diesen Schaden.']
  });
  const top = rpg.besteBuilds(2, 'avg', 3), topMax = rpg.besteBuilds(2, 'max', 1);
  aufgaben.push({
    nr: 3, titel: 'Der stärkste Held', yExtra: 0.11, einBlock: true, zeilenAnz: { 0: 6 }, schritte: { 0: 1.28 },   // Julian 10.11.: Aufzählung mit Strichen in einer Textbox
    text: 'Stelle nun den Helden mit dem größten Schaden zusammen:\n- eine Waffe,\n- eine Rüstung und\n- einen Zaubergegenstand\n(Gegenstandskarten Stufe 1 und 2). Trage deinen Build in die Vorlage ein und schreibe deine Überlegungen so auf, dass du sie anderen Spielern erklären kannst.',
    builds: [buildLeer('Mein stärkster Build', {}, { alle: true, modus: 'voll', slotsLeer: true, besonderheiten: true })],
    notizen: { titel: 'Meine Überlegungen', zeilen: 6 },
    loesung: [`Beste Builds nach Mittelwert: ${top.map(x => `${sBuild(x.build)} (Ø ${f3(x.schaden)})`).join('; ')}.`,
      'Warum? Der Zerreißer des Seelenfadens hat +150 % PHYSISCH, die Rote Bullentrinkflasche +50 % PHYSISCH, dazu +50 PHYSISCH Grundschaden von Letzte Bastion: Grundschaden 26 + 50 = 76; Modifikatoren +150 % + 50 % = +200 %; Bonus 76 · 2 = 152; Schaden 76 + 152 = 228.',
      `Nach dem Maximum liegt vorn: ${sBuild(topMax[0].build)} (Max ${f3(topMax[0].schaden)}).`],
    loesungBuilds: [buildVoll('Musterlösung', top[0].build, { besonderheiten: true })]
  });
  const fp = rpg.item('feenstaub').modifikatoren[0].prozent;   // Prozent je Modifikator des Feenstaubs (alle drei gleich)
  const dk = { waffe: 'beruehrung-des-wahnsinns', ruestung: 'ruestung-der-dunkelheit', zauber: 'feenstaub' }, dkT = rpg.treffer(dk), bT = rpg.treffer(top[0].build);
  aufgaben.push({
    nr: 4, titel: '★ Die Rüstung der Dunkelheit', differenzierung: true, yExtra: 0.05, einBlock: true, zeilenAnz: { 0: 4 }, blockExtra: 0.2,   // Julian 10.11.: ein Textblock, Build-Zeile zentriert, Schreibfläche entfällt (Aufgabe passt auf Seite 2)
    text: `Die ${bi('ruestung-der-dunkelheit')} wendet alle Modifikatoren verdoppelt auf CHAOSschaden an, verursacht aber keinen ELEMENTAR- und keinen PHYSISCHschaden. Berechne im Heft den Build aus:\n~ ${bi('beruehrung-des-wahnsinns')} + ${bi('ruestung-der-dunkelheit')} + ${bi('feenstaub')}.\nVergleiche Mittelwert und Maximum mit deinem Build aus Aufgabe 3.`,
    loesung: [`CHAOS: Grundschaden ${f3(rpg.profil(dk).CHAOS.basis.mittel)} (Ø); Modifikatoren des Feenstaubs +${fp} +${fp} +${fp} = +${3 * fp} %, verdoppelt +${6 * fp} % → Bonus ${f3(rpg.profil(dk).CHAOS.basis.mittel)} · ${f3(6 * fp / 100)} = ${f3(rpg.profil(dk).CHAOS.mittel - rpg.profil(dk).CHAOS.basis.mittel)}. ${rechnung(dk)}.`,
      `Vergleich: Der Build aus Aufgabe 3 hat Ø ${f3(bT.avg)}, Max ${f3(bT.max)}; dieser Build Ø ${f3(dkT.avg)}, Max ${f3(dkT.max)} (Min ${f3(dkT.min)}). ` + (dkT.max > bT.max + 1e-9 ? 'Im Durchschnitt schlechter, mit Glück aber der stärkste Build des Spiels.' : 'Er ist im Durchschnitt und selbst im besten Fall schwächer: Die Rüstung der Dunkelheit lohnt sich nur, wenn sehr viele Modifikatoren auf CHAOS gelenkt werden.')],
    loesungBuilds: [buildVoll('Musterlösung', dk, { besonderheiten: true })]
  });
  return { einheit: 2, titel: 'Die Rüstkammer', untertitel: 'Rüstungen und ihre Sonderregeln',
    einstieg: 'In der Rüstkammer von Zahlheim hängt magische Rüstung. Hier geht es nur um den Schaden, nicht um die Schutzwirkung. Manche Rüstungen steigern deinen Schaden gewaltig – andere kosten dich mehr, als sie bringen.',
    kurzregeln, aufgaben, dy };
}

const MONSTER3 = ['flederbestie', 'eisgolem', 'fluchritter', 'tiefebenenriese', 'eiserner-fuerst-des-stahles', 'finsterer-archivar-der-algebra'];
function einheit3() {
  const EPS = 1e-9;
  const mon = MONSTER3.map(id => daten.gegner.find(g => g.id === id));
  const gew = { waffe: 'mjoelnir', ruestung: 'koenigin-des-waldes', zauber: 'feenstaub' };
  const gp = rpg.profil(gew);
  const kurzregeln = { titel: 'Das musst du über Monster wissen', pt: 11, punkte: [
    'Jedes Monster hat Lebenspunkte (LP). Es ist besiegt, wenn seine LP auf 0 oder darunter sinken.',
    'Die Eigenschaften des Monsters wirken auf deinen fertig berechneten Schaden – für jede Schadensart einzeln. Danach werden die Schadensarten addiert. ELEMENTAR gilt für FEUER, EIS und BLITZ zugleich.'] };   // Julian 09.11.: gekürzt (Faktor-Erklärung und Ziel-Regel entfallen)
  const aufgaben = [];
  /* A1 */
  const zeilenA1 = mon.map(m => { const t = rpg.treffer(gew, m.id); const b = t.proQuelle.BLITZ.avg, ph = t.proQuelle.PHYSISCH.avg; return { m, b, ph, t, n: Math.ceil(m.lp / t.avg - EPS) }; });
  aufgaben.push({
    nr: 1, titel: 'Die Monster der Höhlen',
    text: 'Sechs Monster warten in den Höhlen. Dein Held trägt das Set „Gewitter“ (siehe Build-Tabelle).\na) Fülle die Tabelle auf der Rückseite aus, um zu berechnen, wie viel Schaden du den Monstern machst und wie viele Angriffe du durchschnittlich brauchst.\nb) Welche Monster sind für dieses Set gefährlich? Warum?',   // Julian 09.11.: gekürzt, Monsterkarten entfallen
    builds: [{ ...buildVoll('Set „Gewitter“', gew, { modus: 'kurz' }), klein: true }],   // Julian 10.11.: Raute im Titel, kleine Schrift (8,5 / 9,5 / 9 pt)
    tabellen: [{ kopf: ['Monster', 'LP', 'BLITZ (Ø)', 'PHYSISCH (Ø)', 'Schaden pro Treffer', 'Treffer nötig'], zeilen: mon.map(m => [m.name, String(m.lp), '', '', '', '']), rowH: 0.31 }],
    notizen: { titel: 'Gefährliche Monster für dieses Set', zeilen: 2 }, notizenVorTabelle: true, tabellenNeueSeite: true, schritte: { 0: 0.30, 1: 0.52, 2: 0.41 }, nachBuild: 0.09,
    loesungTabellen: [{ titel: 'Musterlösung', kopf: ['Monster', 'LP', 'BLITZ (Ø)', 'PHYSISCH (Ø)', 'Schaden pro Treffer', 'Treffer nötig'], zeilen: zeilenA1.map(z => [z.m.name, String(z.m.lp), f3(z.b), f3(z.ph), f3(z.t.avg), `${z.n}`]) }],
    loesung: zeilenA1.map(z => `${z.m.name}: ${rechnung(gew, z.m.id)} → ${f3(z.m.lp)} : ${f3(z.t.avg)} = ${f3(z.m.lp / z.t.avg)} → ${z.n} Treffer.`)
      .concat([`b) Mit 3 Runden schafft das Set (im Durchschnitt) nur: ${zeilenA1.filter(z => z.n <= 3).map(z => z.m.name).join(', ')}. Kritisch sind: ${zeilenA1.filter(z => z.n > 3).map(z => z.m.name).join(', ')} – bei ihnen sind BLITZ oder PHYSISCH gedämpft bzw. der Riese hat zu viele LP.`])
  });

  /* A2: zwei Sets */
  function gewinn(A, B) {
    const L = [0, 1, 2].map(() => 0);
    return mon.map(m => {
      const tA = rpg.treffer(A, m.id), tB = rpg.treffer(B, m.id);
      const sc = t => [3 * t.min + EPS >= m.lp, 3 * t.avg + EPS >= m.lp, 3 * t.max + EPS >= m.lp].map(Number).concat(t.avg);
      const a = sc(tA), b = sc(tB);
      let useA = true; for (let i = 0; i < 4; i++) { if (a[i] !== b[i]) { useA = a[i] > b[i]; break; } }
      const t = useA ? tA : tB;
      const stufen = [t.min, t.avg, t.max];
      const p = (() => { let k = 0; for (const x of stufen) for (const y of stufen) for (const z of stufen) if (x + y + z + EPS >= m.lp) k++; return k / 27; })();
      return { m, set: useA ? 'A' : 'B', t, p };
    });
  }
  const mins = rpg.setPaare('min', 3), avgs = rpg.setPaare('avg', 3), maxs = rpg.setPaare('max', 3);
  /* Musterpaar: Set Gewitter (aus Aufgabe 1) + ein rein physisches Set – geprüft mit setPaare('avg', 3) */
  const bestePaar = [{ waffe: 'verdammnissaeher', ruestung: 'letzte-bastion', zauber: 'rote-bullentrinkflasche' }, gew];
  const [SA, SB] = bestePaar;
  const gSol = gewinn(SA, SB);
  const wie = (t, lp) => (3 * t.min + EPS >= lp ? 'Pech' : 3 * t.avg + EPS >= lp ? 'Ø' : 3 * t.max + EPS >= lp ? 'Glück' : 'nie');
  aufgaben.push({
    nr: 2, titel: 'Zwei Sets für alle Monster',
    text: 'Vorbereitung ist alles: baue zwei Sets (A und B), jeweils aus Waffe, Rüstung und Zaubergegenstand (Gegenstandskarten Stufe 1 und 2). Du darfst zwischen den Kämpfen das Set wechseln – aber nur komplett.\na) Berechne für beide Sets Min, Mittel und Max Schaden ohne Monster.\nb) Entscheide für jedes Monster, welches Set du einsetzt, und berechne den Schaden pro Treffer gegen dieses Monster. Fülle dafür die Tabelle auf Seite 3 aus.\nc) Prüfe, ob du es in 3 Runden besiegst: mit Pech (3 · Min), im Durchschnitt (3 · Mittel) oder nur mit Glück (3 · Max)?',   // Julian 09.11.: Sets auf Seite 2 festhalten, Monstertabelle auf Seite 3
    zeilenAnz: { 0: 2, 1: 1, 2: 2, 3: 2 }, schritte: [0.5, 0.23, 0.43, 0.33], botDy: 0.12,
    setBoxen: ['Set A', 'Set B'],
    tabellenNeueSeite: true, tabellenYExtra: 0.25, abstaende: { nachTabelle: 0.16 },   // Julian 10.11.
    tabellen: [{ kopf: ['Monster', 'LP', 'Set', 'Min', 'Mittel', 'Max', '3 · Min', '3 · Mittel', '3 · Max', 'Besiegt mit'], zeilen: mon.map(m => [m.name, String(m.lp), '', '', '', '', '', '', '', '']), rowH: 0.491, kopfH: 0.327, gew: [1.87, 0.56, 0.41, 0.5, 0.5, 0.5, 0.69, 0.69, 0.69, 0.87] }],
    notizen: { titel: 'Platz für Rechnungen gegen die Monster', zeilen: 7 },
    loesungBuilds: [buildVoll('Musterlösung Set A', SA, { besonderheiten: true }), buildVoll('Musterlösung Set B', SB, { besonderheiten: true })],
    loesungTabellen: [{ titel: 'Musterlösung (Schaden pro Treffer gegen das jeweilige Monster)', kopf: ['Monster', 'LP', 'Set', 'Min', 'Mittel', 'Max', '3 · Min', '3 · Mittel', '3 · Max', 'Besiegt mit'],
      zeilen: gSol.map(g => [g.m.name, String(g.m.lp), g.set, f3(g.t.min), f3(g.t.avg), f3(g.t.max), f3(3 * g.t.min), f3(3 * g.t.avg), f3(3 * g.t.max), wie(g.t, g.m.lp)]) }],
    loesung: [`Es gibt viele richtige Lösungen. Von ${avgs.anzahlBuilds} vollständigen Sets (Waffe + Rüstung + Zaubergegenstand) gibt es Paare, die alle Monster in 3 Runden schaffen: im Durchschnitt ${avgs.paare.length} Paare, mit Pech ${mins.paare.length} Paare, mit Glück ${maxs.paare.length} Paare.`,
      'Gezeigt wird das Set „Gewitter“ aus Aufgabe 1 zusammen mit einem PHYSISCH-Set (Set A) – damit wird jedes Monster zumindest im Durchschnitt in 3 Runden besiegt. Die Rechnung gegen ein Monster: jede Schadensart mit dem Faktor des Monsters multiplizieren (Widerstand 1 − p, Anfälligkeit 1 + p, Immunität 0), dann addieren.']
  });

  /* A3: Kampf (Julian 09.11.: Text, dann Kampfregeln, Protokolle auf Seite 4) */
  const regelKasten = { titel: 'Kampfregeln', pt: 11, punkte: [
    'Der Held wählt vor dem Kampf Set A oder Set B.',
    'Jede Runde würfelt der Held einmal: 1–2 = Min, 3–4 = Mittel, 5–6 = Max. Den Schaden berechnet ihr mit dem Wert für dieses Monster aus Aufgabe 2.',
    'Dieser Schaden wird von den LP des Monsters abgezogen. Ist das Monster nach höchstens 3 Runden bei 0 LP oder darunter, gewinnt der Held.'] };
  const probs = gSol.map(g => `${g.m.name} (Set ${g.set}): Pech ${f3(3 * g.t.min)}, Ø ${f3(3 * g.t.avg)}, Glück ${f3(3 * g.t.max)} gegen ${g.m.lp} LP → besiegt in 3 Runden mit Wahrscheinlichkeit ${Math.round(g.p * 100)} % (${Math.round(g.p * 27)} von 27 Wurffolgen).`);
  aufgaben.push({
    nr: 3, titel: 'Der Kampf: Held gegen Monster', yExtra: 0.16, titelGap: 0.06, schritte: { 0: 0.54 },
    text: 'Jetzt wird es Ernst. Du wagst dich in die Monsterhöhle und trittst ihnen leibhaftig gegenüber. Dabei entscheidet der Würfel über Glück und Pech. Die Tabellen auf der Rückseite können dir helfen, deine Kämpfe zu dokumentieren.',
    zeilenAnz: { 0: 2 }, regelKasten, regelNachText: true,
    protokolle: { anzahl: 6, gitter: true, neueSeite: true },
    loesung: ['Das Ergebnis hängt von den Würfen ab. Kontrolle: Der Schaden pro Runde muss genau einem der drei Werte (Min, Mittel, Max) aus der Tabelle von Aufgabe 2 entsprechen, die LP sinken Runde für Runde um diesen Wert.',
      'Zur Orientierung die Siegchancen der Musterlösung (jede Stufe hat beim W6 die Wahrscheinlichkeit 1/3):', ...probs]
  });
  return { einheit: 3, titel: 'Die Monsterhöhlen', untertitel: 'Widerstand, Immunität und Anfälligkeit',
    einstieg: 'Hinter dem Stadttor von Zahlheim beginnen die Monsterhöhlen. Dort lauern Gegner, die manche Schadensarten kaum spüren – und gegen andere besonders empfindlich sind. Dein Gesamtschaden hängt jetzt nicht nur von deiner Ausrüstung ab, sondern auch davon, wen du bekämpfst.',
    kurzregeln, aufgaben, abstaende: { nachKurz: 0.16 } };
}

/* ====================== Einheit 9: ★ Der Helm des Nachhalls (Zusatzseite, ab Einheit 2 beliebig einsetzbar) ======================
 * Eine Seite, wird bunt gedruckt und laminiert; die Aufgaben werden im Heft bearbeitet (Tabellen nur als Anregung).
 * Alle anderen Gegenstände stehen auf der Übersicht von Einheit 2 – nur der Helm hat hier seine Karte. */
function einheit9() {
  const H = 'helm-des-nachhalls', U = 'umhang-des-bescheidenen';
  const x = rpg.item(H).effekte.find(e => e.typ === 'nachtraeglich').prozent, xf = 1 + x / 100;
  const avg = b => rpg.treffer(b).avg;
  const A = { waffe: 'verdammnissaeher', zauber: 'rote-bullentrinkflasche' };       // eine Schadensart, viele Boni
  const M = { waffe: 'mjoelnir', zauber: 'glueckbringender-magnetstein' };          // zwei Schadensarten (BLITZ stark, PHYSISCH schwach)
  const W = { waffe: 'weltenschaffer', zauber: 'feenstaub' };                       // Schaden auf drei Schadensarten verteilt
  const mit = (b, q) => ({ ...b, ruestung: H, nachtraeglichAuf: q }), umh = b => ({ ...b, ruestung: U });
  const pQ = (b, q) => rpg.profil(b)[q];
  const sp = v => f3(v) + ' SP';
  const qs = b => Object.entries(rpg.profil(b)).filter(([, v]) => v.basis.max > 0);       // [[Schadensart, Profil]] mit Schaden

  /* Aufgabe 1 */
  const a0 = avg(A), a1 = avg(mit(A, 'PHYSISCH')), a2 = avg(umh(A)), gA = pQ(A, 'PHYSISCH').basis.mittel;
  /* Aufgabe 2 */
  const m0 = avg(M), mB = avg(mit(M, 'BLITZ')), mP = avg(mit(M, 'PHYSISCH')), mU = avg(umh(M));
  const pM = rpg.profil(M);
  /* Aufgabe 3 */
  const w0 = avg(W), wH = avg(mit(W, 'FEUER')), wU = avg(umh(W)), pW = rpg.profil(W), pWU = rpg.profil(umh(W));

  const aufgaben = [{
    nr: 1, titel: 'Helm oder Umhang?',
    text: `Dein Held hat die Waffe ${bi(A.waffe)} und den Zaubergegenstand ${bi(A.zauber)}, aber noch keine Rüstung. Rechne im Heft mit dem Mittelwert:`,
    liste: ['Wie viel Schaden macht er ohne Rüstung?', `…mit dem ${bi(H)}?`, `…mit dem ${bi(U)} (+25 % SCHADEN, siehe Übersicht von Einheit 2)?`, 'Welche Rüstung ist besser – und um wie viele SP?'],
    listeGap: 0.01, nachTextGap: 0.266, abstaende: { nachTabelle: -0.1 },   // Abstände nach Julians Handanpassung
    nachText: 'So eine Tabelle kann dir helfen (lege sie im Heft an, auch für Aufgabe 2):',
    tabellen: [{ kopf: ['Rüstung', 'Schadensart 1', '(gg. Schadensart 2)', 'Gesamt Ø'], gew: [2.515, 1.92, 2.012, 0.823], pt: 11, kopfH: 0.325, rowH: 0.314, zeilen: [['ohne Rüstung', '', '', ''], ['Helm des Nachhalls', '', '', ''], ['Umhang des Bescheidenen', '', '', '']] }],
    loesung: [`a) ${name(A.waffe)} + ${name(A.zauber)}: PHYSISCH ${f3(gA)} · (1 + 0,5 + 0,5) = ${sp(a0)}.`,
      `b) Helm: erst addieren (${sp(a0)}), dann nachträglich +${x} %: ${f3(a0)} · ${f3(xf)} = ${sp(a1)}.`,
      `c) Umhang: Die ${x} % werden zu den anderen addiert: ${f3(gA)} · (1 + 0,5 + 0,5 + ${f3(x / 100)}) = ${sp(a2)}.`,
      `d) Der Helm ist ${sp(a1 - a2)} besser. Grund: Beim Helm beziehen sich die ${x} % auf den schon verstärkten Wert (${x} % von ${f3(a0)} = ${f3(a0 * x / 100)}), beim Umhang nur auf den Grundschaden (${x} % von ${f3(gA)} = ${f3(gA * x / 100)}).`]
  }, {
    nr: 2, titel: 'Welche Schadensart?',
    text: `Waffe ${bi(M.waffe)}, Zaubergegenstand ${bi(M.zauber)} (BLITZ- und PHYSISCHschaden). Du wählst, welche Schadensart der Helm verstärkt.`,
    liste: ['Berechne den Gesamtschaden (Ø) für BLITZ und für PHYSISCH.', 'Begründe deine Wahl: Warum lohnt sich eine Schadensart mehr?', `Vergleiche mit dem ${bi(U)}: Wie viele SP macht der Helm mehr oder weniger?`, `Mit ${bi(W.waffe)} und ${bi(W.zauber)} (Schaden auf FEUER, EIS und PHYSISCH verteilt) gewinnt der Umhang. Erkläre, warum.`],
    listeGap: 0.01, platz: 2.3, yExtra: 0.17,   // Aufgabe 2 bleibt als Ganzes zusammen
    loesung: [`a) BLITZ ${f3(pM.BLITZ.basis.mittel)} · (1 + 0,5 + 0,5) = ${f3(pM.BLITZ.basis.mittel * pM.BLITZ.faktor)}; mit Helm · ${f3(xf)} = ${f3(pM.BLITZ.basis.mittel * pM.BLITZ.faktor * xf)}; PHYSISCH bleibt ${f3(pM.PHYSISCH.mittel)} → Gesamt ${sp(mB)}. Helm auf PHYSISCH: ${f3(pM.PHYSISCH.mittel)} · ${f3(xf)} = ${f3(pM.PHYSISCH.mittel * xf)}; BLITZ bleibt ${f3(pM.BLITZ.mittel)} → Gesamt ${sp(mP)}.`,
      `b) Der Helm bringt ${x} % vom fertigen Wert der gewählten Schadensart: bei BLITZ ${x} % von ${f3(pM.BLITZ.mittel)} = ${f3(pM.BLITZ.mittel * x / 100)} SP, bei PHYSISCH nur ${x} % von ${f3(pM.PHYSISCH.mittel)} = ${f3(pM.PHYSISCH.mittel * x / 100)} SP. Man wählt die Schadensart mit dem größten Schaden.`,
      `c) Umhang: BLITZ ${f3(pM.BLITZ.basis.mittel)} · 2,25 = ${f3(rpg.profil(umh(M)).BLITZ.mittel)}, PHYSISCH ${f3(pM.PHYSISCH.basis.mittel)} · 1,25 = ${f3(rpg.profil(umh(M)).PHYSISCH.mittel)} → Gesamt ${sp(mU)}. Der Helm (auf BLITZ) macht ${sp(mB - mU)} mehr.`,
      `d) ${name(W.waffe)} + ${name(W.zauber)}: ohne Rüstung ${sp(w0)} (FEUER ${f3(pW.FEUER.mittel)}, EIS ${f3(pW.EIS.mittel)}, PHYSISCH ${f3(pW.PHYSISCH.mittel)}). Helm auf FEUER: ${f3(pW.FEUER.mittel)} · ${f3(xf)} = ${f3(pW.FEUER.mittel * xf)} → Gesamt ${sp(wH)}. Umhang: FEUER ${f3(pWU.FEUER.mittel)} + EIS ${f3(pWU.EIS.mittel)} + PHYSISCH ${f3(pWU.PHYSISCH.mittel)} → Gesamt ${sp(wU)}. Der Umhang ist ${sp(wU - wH)} besser (+${f3(wU - w0)} statt +${f3(wH - w0)} SP gegenüber „ohne Rüstung“): Er wirkt auf alle drei Schadensarten, der Helm nur auf eine. Fazit: Der Helm lohnt sich, wenn ein großer Teil des Schadens in einer Schadensart mit vielen Boni steckt (Vorteil gegenüber einem addierten Bonus: Grundschaden · Summe der Boni · ${x} %); bei verteiltem Schaden ist der Umhang oft besser.`]
  }];
  const hel = rpg.item(H), helKarte = karte(H);
  helKarte.zeilen = [...effektZeilen(hel), hel.beschreibung];   // Satz zur Rüstungs-Regel von Julian gestrichen
  helKarte.eigenschaften = []; helKarte.zeilenGrau = 1;   // Beschreibung grau, nicht fett (Julian)
  return { einheit: 9, titel: 'Der Helm des Nachhalls', untertitel: '★ Zusatzseite – wenn ein Bonus nachträglich wirkt',
    einstieg: ['Ein zwielichter Typ behauptet, in einem alten Grab einen legendären Helm gefunden zu haben, welcher Schaden effektiver verstärkt als “moderne” Helme.', 'Bearbeite die Aufgaben im Heft. Alle anderen Gegenstände findest du in der Übersicht von Einheit 2.'],   // Text von Julian
    karten: [helKarte], kartenBreit: true, kartenH: 1.3993,
    abstaende: { nachKarte: 0.0215, nachKurz: 0.2292 },
    seite1: { rahmenDx: 0.0402, rahmenDy: 0.1745, fussDy: 0.2072, botDy: 0.5 },   // Rahmen und Seitenzahl von Hand verschoben
    kurzregeln: { titel: 'So wirkt der Helm des Nachhalls', pt: 11, hExtra: 0.07, punkte: [
      'Rechne zuerst wie gewohnt: Alle Modifikatoren derselben Schadensart werden addiert.',
      `Dann wählst du eine Schadensart. Ihr fertig berechneter Schaden steigt noch einmal um ${x} % – nachträglich. Diese ${x} % werden nicht zu den anderen Modifikatoren addiert.`] },
    aufgaben };
}

function tabelle(L, tb) {
  L.push('| ' + tb.kopf.join(' | ') + ' |', '|' + tb.kopf.map(() => '---').join('|') + '|');
  tb.zeilen.forEach(z => L.push('| ' + z.join(' | ') + ' |'));
}

function markdown(e) {
  const L = [];
  L.push(`# Einheit ${e.einheit}: ${e.titel} – ${e.untertitel}`, '', `*${[].concat(e.einstieg).join(' ')}*`, '');
  if (e.karten) L.push('## Karte', '', ...e.karten.map(k => `- **${k.name}** (${k.typ}): ${[k.modifikatoren, ...(k.eigenschaften || [])].filter(Boolean).join('; ')}`), '');
  if (e.kurzregeln) { L.push(`## ${e.kurzregeln.titel}`, ''); e.kurzregeln.punkte.forEach((t, i) => L.push(`${i + 1}. ${Array.isArray(t) ? t.join(' ') : t}`)); L.push(''); }
  if (e.beispiel) {
    L.push('## Beispiel', '', e.beispiel.problem, '');
    if (e.beispiel.tabelle) tabelle(L, e.beispiel.tabelle);
    else { L.push('| Rolle | Rechnung | Neuer Schaden |', '|---|---|---|'); e.beispiel.zeilen.forEach(z => L.push(`| ${z.rolle} | ${z.rechnung} | ${z.ergebnis} |`)); }
    const er = e.beispiel.erkenntnis;
    L.push('', Array.isArray(er) ? er.map(t => '*' + t + '*').join('\n\n') : typeof er === 'object' ? [er.text1, '', '*' + er.rechnung + '*', '', er.text2].join('\n') : '*' + er + '*', '');
  }
  if (e.sicherung) {
    L.push('## ' + e.sicherung.titel, '');
    if (e.sicherung.luecken) e.sicherung.luecken.forEach((x, i) => L.push(`> ${i + 1}. ${x.text}`, '>'));
    else {
      e.sicherung.formeln.forEach(x => L.push(`> **${x.wenn}:**  ${x.formel}  (z. B. ${x.beispiel.replace(/\n/g, " ")})`, '>'));
      L.push(`> ${e.sicherung.umrechnung}`, '>', `> ⚠ ${e.sicherung.achtung}`);
      if (e.sicherung.spielregel) L.push('>', `> ${e.sicherung.spielregel}`);
    }
    L.push('');
  }
  L.push('## Aufgaben', '');
  e.aufgaben.forEach(a => {
    L.push(`### Aufgabe ${a.nr} – ${a.titel}`, '');
    if (a.hinweis) L.push(`> 💡 ${[].concat(a.hinweis).join(' ')}`, '');
    if ((a.gegner || []).length) L.push(`Gegnerkarten: ${a.gegner.map(g => `${g.name} (${g.lp} LP)`).join(', ')}`, '');
    if (a.regelKasten) { L.push(`**${a.regelKasten.titel}**`, ''); a.regelKasten.punkte.forEach((t, i) => L.push(`${i + 1}. ${t}`)); L.push(''); }
    L.push(a.text.replace(/\{\{(.+?)\}\}/g, '***$1***'), '');
    (a.liste || []).forEach((t, i) => L.push(`${String.fromCharCode(97 + i)}) ${t.replace(/\{\{(.+?)\}\}/g, '***$1***')}`, ''));
    (a.regeln || []).forEach((r, i) => L.push(`${i + 1}. ${r}`));
    (a.tabelle || []).forEach(t => L.push(`- ${t}  → ______ SP`));
    (a.teile || []).forEach((t, i) => L.push(`- ${String.fromCharCode(97 + i)}) ${t}`));
    (a.kombinationen || []).forEach((t, i) => L.push(`- ${String.fromCharCode(97 + i)}) ${t}  → Ø ______ SP`));
    (a.karten || []).length && L.push('', '| Gegenstand | Schadensart | Min | Mittel | Max | Modifikator |', '|---|---|---|---|---|---|');
    (a.karten || []).forEach(k => {
      const mod = [k.lp !== undefined ? `LP ${k.lp}` : '', ...(k.zeilen || []), k.modifikatoren, ...(k.eigenschaften || [])].filter(Boolean).join('; ');
      if (!k.schaden.length) L.push(`| ${k.name} | – | – | – | – | ${mod} |`);
      k.schaden.forEach((s, i) => L.push(`| ${i ? '' : k.name} | ${s.quelle} | ${s.fest ? f(s.mittel) + ' (fest)' : f(s.min)} | ${s.fest ? '' : f(s.mittel)} | ${s.fest ? '' : f(s.max)} | ${i ? '' : mod} |`));
    });
    (a.builds || []).forEach(b => L.push('', `> **Build-Vorlage: ${b.titel}** (${b.modus === 'voll' ? 'Min/Mittel/Max' : 'Mittelwert'}; Schadensarten: ${b.quellen.join(', ')})`));
    (a.tabellen || []).forEach(tb => { L.push(''); tabelle(L, tb); });
    if (a.setBoxen) L.push('', `> Leere Set-Vorlagen: ${a.setBoxen.join(', ')} (Waffe, Rüstung, Zaubergegenstand; Schaden je Schadensart Min/Mittel/Max; Besonderheiten)`);
    if (a.protokolle) L.push('', a.protokolle.gitter ? `> Kampfprotokoll × ${a.protokolle.anzahl} (Monster, Set, 3 Runden: Wurf (W6) – Schaden – LP danach)` : `> Duellprotokoll × ${a.protokolle.anzahl} (Held, Monster, LP, Set, Vorhersage, 3 Runden: Wurf – Stufe – Schaden – LP danach)`);
    if (a.notizen) L.push('', `> Schreibfläche${a.notizen.titel ? ': ' + a.notizen.titel : ''} (${a.notizen.zeilen} Zeilen)`);
    (a.tabellen2 || []).forEach(tb => { L.push(''); tabelle(L, tb); });
    (a.nachdenken || []).length && L.push('', ...a.nachdenken.map(x => `- ❓ ${x}`));
    L.push('');
  });
  L.push('---', '', '## Lösungen (Lehrkraft)', '');
  if (e.sicherung && e.sicherung.luecken) {
    L.push('**Merkkasten**');
    e.sicherung.luecken.forEach((x, i) => { let k = 0; L.push(`${i + 1}. ${x.text.replace(/_{6,}/g, () => '**' + x.loesungen[k++] + '**')}`); });
    L.push('');
  }
  e.aufgaben.forEach(a => {
    L.push(`**Aufgabe ${a.nr}**`);
    const l = a.loesung;
    if (Array.isArray(l)) l.forEach(x => L.push(`- ${x}`));
    else if (l.ergebnisse) { l.ergebnisse.forEach(x => L.push(`- ${x}`)); l.gleichwertig.forEach(g => L.push(`- Gleichwertig: ${g.join(' = ')}`)); }
    else { l.kombinationen.forEach(k => L.push(`- ${k.name}: ${k.rechnung.join(' | ')} → **Ø ${f(k.mittel)} SP**`));
      L.push(`- Beste: **${l.beste}**; Würfelwerte: Min ${f(l.wuerfel.min)} / Mittel ${f(l.wuerfel.mittel)} / Max ${f(l.wuerfel.max)}`); }
    (a.loesungTabellen || []).forEach(tb => { L.push(''); tabelle(L, tb); });
    (a.loesungBuilds || []).forEach(b => { const w = b.werte; L.push('', `*${b.titel}:* ${Object.entries(w.zeilen).map(([q, z]) => (b.bonus ? `${q} ${z.basis[1]} + ${z.bonus[1]} = ${z.schaden[1]}` : `${q} ${z.basis[1]} · ${z.faktor} = ${z.schaden[1]}`)).join('; ')} → Gesamt Min ${w.gesamt[0]} / Mittel ${w.gesamt[1]} / Max ${w.gesamt[2]}`); });
    L.push('');
  });
  return L.join('\n');
}

if (path.resolve(process.argv[1] || '') === import.meta.filename) {
  const nr = process.argv[2] || '4';
  const e = { 1: einheit1, 2: einheit2, 3: einheit3, 4: einheit4, 5: einheit5, 6: einheit6, 7: einheit7, 8: einheit8, 9: einheit9 }[nr]();
  fs.writeFileSync(`einheit-${nr}.json`, JSON.stringify(e, null, 2));
  fs.writeFileSync(`einheit-${nr}.md`, markdown(e));
  console.log(markdown(e));
}
export { einheit1, einheit2, einheit3, einheit4, einheit5, einheit6, einheit7, einheit8, einheit9, markdown };
