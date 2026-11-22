/* Gemeinsame Darstellungsregeln für Gegenstände (Karten, Arbeitsblätter).
 *  - Waffen: Schadenstabelle. Fester Angriffswert ('wert' im JSON) → eine Zelle, sonst Min / Mittel / Max (Würfel).
 *  - Alle anderen Gegenstände: keine Schadenstabelle; absoluter Schaden steht als Modifikator ("+12,5 FEUERschaden").
 */
const fmt = x => (Math.round(x * 100) / 100).toString().replace('.', ',');
const KOPF_FEST = 'zuverlässig';     // Spaltenüberschrift der Ein-Zellen-Tabelle (fester Angriffswert)

function werte(s) {
  if (s.wert !== undefined) return { min: s.wert, mittel: s.wert, max: s.wert, fest: true };
  const mittel = s.mittel !== undefined ? s.mittel : (s.min + s.max) / 2;
  return { min: s.min, mittel, max: s.max, fest: s.min === mittel && mittel === s.max };
}
/** Zeilen der Schadenstabelle (nur Waffen). */
const tabelle = it => (it.slot === 'waffe' ? (it.schaden || []).map(s => ({ quelle: s.quelle, ...werte(s) })) : []);
const alleFest = rows => rows.length > 0 && rows.every(r => r.fest);
/** Hat der Gegenstand Werte, die gewürfelt werden (Min / Mittel / Max)? */
const hatWuerfel = it => (it.schaden || []).some(s => !werte(s).fest);
/** Absoluter Schaden von Nicht-Waffen als Modifikator-Text. */
const absolutZeilen = it => (it.slot === 'waffe' ? [] : (it.schaden || []).map(s => {
  const w = werte(s);
  return w.fest ? `+${fmt(w.mittel)} ${s.quelle}schaden`
    : `+${fmt(w.min)} bis ${fmt(w.max)} ${s.quelle}schaden (Min ${fmt(w.min)} · Mittel ${fmt(w.mittel)} · Max ${fmt(w.max)})`;
}));

/** Textzeilen unter der Schadenstabelle einer Gegenstandskarte (absoluter Schaden, Modifikatoren, Effekte, Angriffe, Aufbau).
 *  Wird von layout/build-karten.js und vom Web-Tool (web/app.js) genutzt. */
function modZeilen(it) {
  const z = absolutZeilen(it).flatMap(t => t.replace(' (Min', '\n(Min').split('\n')).concat((it.modifikatoren || []).map(m => m.auf !== undefined ? `Schaden AUF ${m.auf} %  (${m.quelle})`
    : `${m.prozent >= 0 ? '+' : '−'}${Math.abs(m.prozent)} %  ${m.quelle}`));
  (it.effekte || []).forEach(ef => {
    if (ef.typ === 'umwandlung') z.push(`${ef.anteil} % jedes Grundschadens werden zu ${ef.nach}schaden`);
    if (ef.typ === 'keinSchaden') z.push(`Verursacht keinen ${ef.quellen.join('- oder ')}schaden`);
    if (ef.typ === 'nachtraeglich') z.push(`Nachträglich: Der fertig berechnete Schaden einer Schadensart deiner Wahl steigt noch einmal um ${ef.prozent} %`);
    if (ef.typ === 'alleModifikatorenAuf') z.push(`Alle Modifikatoren wirken ${ef.faktor === 2 ? 'verdoppelt' : 'mal ' + ef.faktor} auf ${ef.nach}schaden`);
  });
  if (it.angriffeProRunde) z.push(`${it.angriffeProRunde} Angriff${it.angriffeProRunde > 1 ? 'e' : ''} pro Runde`);
  if (it.aufbau) z.push(it.aufbau.art === 'zins' ? `Jeder Angriff: +${it.aufbau.prozent} % Schaden (Zinsen: ${it.aufbau.prozent} % vom Angriff davor)` : (it.aufbau.betrag !== undefined ? `Jeder Angriff: ${it.aufbau.betrag} SP mehr (fest)` : `Jeder Angriff: +${it.aufbau.prozent} % des Grundschadens (fest)`));
  return z;
}

/* Gegnerkarte: Eigenschaften (Widerstand / Immunität / Anfälligkeit) */
const widerstandText = w => w.immun ? `Immun gegen ${w.quelle}schaden`
  : w.auf !== undefined ? `Erleidet nur ${w.auf} % des ${w.quelle}schadens`
  : `${w.prozent >= 0 ? '+' : '−'}${Math.abs(w.prozent)} % erlittener ${w.quelle}schaden`;
const gegnerZeilen = g => g.beschreibung ? [g.beschreibung.replace(/\.$/, '')] : (g.widerstaende.length ? g.widerstaende.map(widerstandText) : ['Keine Widerstände']);

export { KOPF_FEST, werte, tabelle, alleFest, hatWuerfel, absolutZeilen, modZeilen, widerstandText, gegnerZeilen };
