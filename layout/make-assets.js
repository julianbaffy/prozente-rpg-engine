/* Erzeugt Pergament-Hintergrund + Ornamente als PNG (A4, 200 dpi). */
const sharp = require('sharp');
const fs = require('fs');
const W = 827, H = 1169;           // 100 Einheiten pro Zoll
const INK = '#2E2114';
const ES = 0.55;                   // Größe der Eckschnörkel (1 = groß)

// Eckschnörkel (für die Ecke oben links, Ursprung = Ecke des Rahmens)
const corner = `
  <g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0,0 L0,70 M0,0 L70,0" stroke-width="2.4"/>
    <path d="M10,10 L10,52 M10,10 L52,10" stroke-width="1"/>
    <path d="M0,70 C0,92 22,96 26,80 C29,68 14,62 12,74" stroke-width="1.8"/>
    <path d="M70,0 C92,0 96,22 80,26 C68,29 62,14 74,12" stroke-width="1.8"/>
    <path d="M14,14 C30,14 44,26 44,44 C44,56 34,60 30,52 C27,46 33,42 37,45" stroke-width="1.6"/>
    <path d="M22,0 C24,16 16,24 0,22" stroke-width="1"/>
    <path d="M44,44 C56,56 70,58 84,52" stroke-width="1.2"/>
    <path d="M44,44 C56,56 58,70 52,84" stroke-width="1.2"/>
  </g>
  <g fill="${INK}"><circle cx="86" cy="52" r="2.6"/><circle cx="52" cy="86" r="2.6"/><circle cx="6" cy="6" r="3.4"/>
  <path d="M0,70 l-4,8 l4,8 l4,-8z M70,0 l8,-4 l8,4 l-8,4z"/></g>`;

function frame() {
  const m = 20;                      // Rahmenabstand (100 = 1 Zoll)
  const x0 = m, y0 = m, x1 = W - m, y1 = H - m;
  return `
  <rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="none" stroke="${INK}" stroke-width="3"/>
  <rect x="${x0 + 8}" y="${y0 + 8}" width="${x1 - x0 - 16}" height="${y1 - y0 - 16}" fill="none" stroke="${INK}" stroke-width="1"/>
  <g transform="translate(${x0 + 2},${y0 + 2}) scale(${ES})">${corner}</g>
  <g transform="translate(${x1 - 2},${y0 + 2}) scale(${-ES},${ES})">${corner}</g>
  <g transform="translate(${x0 + 2},${y1 - 2}) scale(${ES},${-ES})">${corner}</g>
  <g transform="translate(${x1 - 2},${y1 - 2}) scale(${-ES},${-ES})">${corner}</g>`;
}

const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * 2}" height="${H * 2}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="noise" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="4" seed="7" result="t"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.42  0 0 0 0 0.2  0 0 0 0.16 0"/>
    </filter>
    <filter id="fine" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0 0.15  0 0 0 0.07 0"/>
    </filter>
    <radialGradient id="vig" cx="50%" cy="50%" r="75%">
      <stop offset="62%" stop-color="#C9B27A" stop-opacity="0"/>
      <stop offset="100%" stop-color="#B89B5E" stop-opacity="0.38"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#F8F1DE"/>
  <rect width="${W}" height="${H}" filter="url(#noise)"/>
  <rect width="${W}" height="${H}" filter="url(#fine)"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;

// Rahmen + Ecken als eigene, transparente Grafik (liegt auf jeder Folie über dem Hintergrund)
const rahmen = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * 2}" height="${H * 2}" viewBox="0 0 ${W} ${H}">${frame()}</svg>`;

// Trennlinie mit Ornament (transparent), 600x40
const divider = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="80" viewBox="0 0 600 40">
  <g fill="none" stroke="${INK}" stroke-linecap="round">
    <path d="M10,20 L262,20" stroke-width="1.4"/><path d="M338,20 L590,20" stroke-width="1.4"/>
    <path d="M30,24 L250,24" stroke-width="0.8"/><path d="M350,24 L570,24" stroke-width="0.8"/>
    <path d="M262,20 C272,6 286,8 290,18 C292,24 284,26 282,21" stroke-width="1.5"/>
    <path d="M338,20 C328,6 314,8 310,18 C308,24 316,26 318,21" stroke-width="1.5"/>
    <path d="M262,20 C272,34 286,32 290,22" stroke-width="1.2"/>
    <path d="M338,20 C328,34 314,32 310,22" stroke-width="1.2"/>
  </g>
  <g fill="${INK}"><path d="M300,10 L307,20 L300,30 L293,20z"/><circle cx="10" cy="20" r="3"/><circle cx="590" cy="20" r="3"/></g>
</svg>`;

// Banner (Titelband, dunkel, mit Zipfeln), 700x130
const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="260" viewBox="0 0 700 130">
  <path d="M0,26 L40,26 L40,8 L660,8 L660,26 L700,26 L676,65 L700,104 L660,104 L660,122 L40,122 L40,104 L0,104 L24,65z" fill="${INK}"/>
  <path d="M52,16 L648,16 L648,114 L52,114z" fill="none" stroke="#F3E8C8" stroke-width="1.4"/>
  <path d="M58,22 L642,22 L642,108 L58,108z" fill="none" stroke="#F3E8C8" stroke-width="0.6"/>
</svg>`;

// Zierleiste für Abschnittsköpfe (kleine Raute mit Linien), 300x24
const bullet = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24">
  <path d="M12,1 L23,12 L12,23 L1,12z" fill="${INK}"/><path d="M12,6 L18,12 L12,18 L6,12z" fill="none" stroke="#F3E8C8" stroke-width="1.2"/></svg>`;

/* --- Querformat (Folien 16:9, 10 x 5,625 Zoll) --- */
function quer(QW = 1000, QH = 562.5, e = 0.46, suffix = 'quer') {
  const m = 20;
  const x0 = m, y0 = m, x1 = QW - m, y1 = QH - m;
  const rahmenQ = `<svg xmlns="http://www.w3.org/2000/svg" width="${QW * 2}" height="${QH * 2}" viewBox="0 0 ${QW} ${QH}">
  <rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="none" stroke="${INK}" stroke-width="3"/>
  <rect x="${x0 + 8}" y="${y0 + 8}" width="${x1 - x0 - 16}" height="${y1 - y0 - 16}" fill="none" stroke="${INK}" stroke-width="1"/>
  <g transform="translate(${x0 + 2},${y0 + 2}) scale(${e})">${corner}</g>
  <g transform="translate(${x1 - 2},${y0 + 2}) scale(${-e},${e})">${corner}</g>
  <g transform="translate(${x0 + 2},${y1 - 2}) scale(${e},${-e})">${corner}</g>
  <g transform="translate(${x1 - 2},${y1 - 2}) scale(${-e},${-e})">${corner}</g></svg>`;
  const bgQ = bg.replace(`width="${W * 2}" height="${H * 2}" viewBox="0 0 ${W} ${H}"`, `width="${QW * 2}" height="${QH * 2}" viewBox="0 0 ${QW} ${QH}"`).replace(/<rect width="\d+" height="\d+"/g, `<rect width="${QW}" height="${QH}"`);
  return Promise.all([
    sharp(Buffer.from(bgQ)).flatten({ background: '#F8F1DE' }).jpeg({ quality: 86 }).toFile(`assets/pergament-${suffix}.jpg`),
    sharp(Buffer.from(rahmenQ)).png({ compressionLevel: 9 }).toFile(`assets/rahmen-${suffix}.png`)
  ]);
}

(async () => {
  if (process.argv[2] === 'quer') { await quer(); await quer(1169, 827, ES, 'a4quer'); console.log('quer fertig'); return; }
  await sharp(Buffer.from(bg)).flatten({ background: '#F8F1DE' }).jpeg({ quality: 86 }).toFile('assets/pergament.jpg');
  await sharp(Buffer.from(rahmen)).png({ compressionLevel: 9 }).toFile('assets/rahmen.png');
  await sharp(Buffer.from(divider)).png().toFile('assets/trenner.png');
  await sharp(Buffer.from(banner)).png().toFile('assets/banner.png');
  await sharp(Buffer.from(bullet)).png().toFile('assets/raute.png');
  console.log(fs.readdirSync('assets').map(f => f + ' ' + fs.statSync('assets/' + f).size));
})();
