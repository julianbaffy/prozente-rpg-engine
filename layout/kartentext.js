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

module.exports = { KOPF_FEST, werte, tabelle, alleFest, hatWuerfel, absolutZeilen };
