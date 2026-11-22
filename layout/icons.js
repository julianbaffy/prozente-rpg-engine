/* Item-Icons: layout/assets/icons/<gegenstandsID>.png (Originale, von Hand abgelegt)
 * -> verkleinerte Kopien in layout/assets/icons-klein/<ID>.jpg (erzeugt mit `node layout/make-icons.js`).
 * iconPfad(id) liefert den Pfad der kleinen Version oder null (dann bleibt der „Bild“-Platzhalter). */
import fs from 'fs';
import path from 'path';
const DIR = path.join(import.meta.dirname, 'assets');
/* Dateien, die (noch) nicht exakt wie die Gegenstands-ID heißen: ID -> Dateiname ohne .png */
const ALIASE = {};
const quelle = id => [id, ALIASE[id]].filter(Boolean).map(n => path.join(DIR, 'icons', n + '.png')).find(p => fs.existsSync(p)) || null;
const iconPfad = id => { const p = path.join(DIR, 'icons-klein', id + '.jpg'); return fs.existsSync(p) ? p : null; };
export { ALIASE, quelle, iconPfad, DIR };
