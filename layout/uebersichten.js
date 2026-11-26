/* Inhalt der laminierten Übersichten (Einheit 3, 4, 7, 8) – gemeinsam genutzt von layout/build-karten.js
 * (Aufbau und Reihenfolge der Karten) und web/app.js (welche Gegenstände eine Stufe zeigt).
 * Änderungen hier wirken auf beide; Gegner kommen über ihre Stufe aus gegenstaende.json. */
export const NEUE_GEGENSTAENDE = {
  4: ['gewitterstein', 'frostsiegel', 'rune-der-glut', 'rune-der-meisterschaft'],
  7: {
    waffen: ['eislanze', 'flammenschwert', 'glutdolch', 'lavaklinge'],
    ring: 'fjordgreifer',
    ausruestung: ['armband-des-feuers', 'ring-der-glut', 'handschuhe-des-glutschmieds'],
  },
  8: ['wutklinge', 'klinge-der-rachsucht', 'wirbelklinge', 'gleichmaessige-klinge'],
};
/** Einheiten, deren Übersicht auch Gegner zeigt (Gegner dieser Stufe). */
export const GEGNER_IN_UEBERSICHT = [3, 4, 8];

/** Alle IDs (Gegenstände und Gegner), die auf der Übersicht der Einheit nr stehen; [] ohne Übersicht. */
export function uebersichtIds(daten, nr) {
  const neu = NEUE_GEGENSTAENDE[nr];
  let ids = [];
  if (Array.isArray(neu)) ids = [...neu];
  else if (neu) ids = [...neu.waffen, neu.ring, ...neu.ausruestung,
    ...daten.gegenstaende.filter(i => i.stufe === nr).map(i => i.id)];   // Einheit 7: auch alle Gegenstände der Stufe
  if (GEGNER_IN_UEBERSICHT.includes(nr)) ids.push(...daten.gegner.filter(g => g.stufe === nr).map(g => g.id));
  return [...new Set(ids)];
}
