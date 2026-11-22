/* Verkleinert die Icons (Gegenstände und Gegner) aus assets/icons (480 px PNG, ~450 KB) auf 300 px JPG (~30 KB) -> assets/icons-klein/<ID>.jpg
 *   node layout/make-icons.js */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { quelle, DIR } = require('./icons.js');
const daten = require('../gegenstaende.json');
(async () => {
  fs.mkdirSync(path.join(DIR, 'icons-klein'), { recursive: true });
  const benutzt = new Set(); let n = 0;
  for (const it of [...daten.gegenstaende, ...daten.gegner]) {
    const q = quelle(it.id);
    if (!q) continue;
    benutzt.add(path.basename(q));
    await sharp(q).flatten({ background: '#000000' }).resize(300, 300).jpeg({ quality: 90 }).toFile(path.join(DIR, 'icons-klein', it.id + '.jpg'));
    n++;
  }
  console.log(n + ' Icons erzeugt');
  const nichtZugeordnet = fs.readdirSync(path.join(DIR, 'icons')).filter(f => f.endsWith('.png') && !benutzt.has(f));
  if (nichtZugeordnet.length) console.log('Keine Gegenstands-ID gefunden für:', nichtZugeordnet.join(', '));
  console.log('Gegenstände ohne Icon:', daten.gegenstaende.filter(i => !quelle(i.id)).map(i => i.id).join(', '));
  console.log('Gegner ohne Icon:', daten.gegner.filter(i => !quelle(i.id)).map(i => i.id).join(', '));
})();
