/* Dateinamen des Materials nach Julians Schema (10.11.2026): Einheit.Nummer_Art_Name.
 * Alles zu einer Einheit steht unter derselben Zahl; innerhalb der Einheit in der Reihenfolge Regeln, Arbeitsblatt, Übersicht/Karten.
 *   1.1_Regeln  1.2_AB_Die_Schmiede  1.3_Gegenstandskarten_Stufe_1  2.1_AB_Die_Ruestkammer  2.2_Gegenstandskarten_Stufe_2 …
 *   0.x  einheitenübergreifend (UV-Übersicht, alle Gegenstands- und Gegnerkarten) */
const AB = { 1: 'Die_Schmiede', 2: 'Die_Ruestkammer', 3: 'Die_Monsterhoehlen', 4: 'Der_Schriftrollenhaendler', 5: 'Der_Verzauberer', 6: 'Die_Trainingshalle', 7: 'Duelle', 8: 'Die_Arena', 9: 'Der_Helm_des_Nachhalls' };
const nummerAB = n => (n === 1 ? 2 : 1);   // Einheit 1 hat zuerst die Regeln (1.1)
module.exports = {
  ab: n => `${n}.${nummerAB(n)}_AB_${AB[n]}.pptx`,
  uebersicht: n => `${n}.${nummerAB(n) + 1}_Uebersicht${n === 3 ? '_Gegner' : ''}.pptx`,
  gegenstandskarten: stufe => (stufe ? `${stufe}.${nummerAB(Number(stufe)) + 1}_Gegenstandskarten_Stufe_${stufe}.pptx` : '0.1_Gegenstandskarten_alle.pptx'),
  gegnerkarten: stufe => (stufe ? `${stufe}.${nummerAB(Number(stufe)) + 2}_Gegnerkarten_Stufe_${stufe}.pptx` : '0.2_Gegnerkarten_alle.pptx'),
  regeln: '1.1_Regeln.pptx',
  uvPptx: '0.0_UV_Uebersicht.pptx',
  uvDocx: '0.0_UV_Uebersicht.docx'
};
