# Powergaming mit Prozenten – Konzept (Stand: Entwurf 0.2)

Dateien auf dem Rechner: `03 Prozentrechung RPGS/rpg-engine/` (gegenstaende.json, engine.js, test.js, arbeitsblaetter.js, einheit-N.md/.json; Test: `node test.js`; Arbeitsblatt erzeugen: `node arbeitsblaetter.js 4`)

## Aufbau der Arbeitsblätter ab Einheit 4
1. Beispiel (Problemstellung) 2. Merkkasten (Formel) 3. Anwendungsaufgaben (z. B. weitere Waffen + Zauberkombinationen); Lösungen für die Lehrkraft aus der Engine.
Reihenfolge der Einheiten bleibt 1–8 (Arbeit erfolgt in dieser Reihenfolge).

## Stufen
| Stufe | Titel | Inhalt / Lernziel | Stand |
|---|---|---|---|
| 1 | Die Schmiede | Waffe + Zaubergegenstand; W = p·G; gleiche Quellen addieren (original) | Daten ok |
| 2 | Die Rüstkammer | + Rüstung: Umwandlung, Grundschaden-Bonus, negative Modifikatoren (original) | Daten ok |
| 3 | Die Monsterhöhlen | Widerstände/Immunität/Anfälligkeit; 2 Sets; 3 Runden; Pech/Ø/Glück (original) | Daten ok |
| 4 | Schriftrollenhändler | Steigern/Verringern UM p % vs. AUF p % | Entwurf |
| 5 | Verzauberer (Magister Quillon) | Prozentsatz bestimmen: p = W : G; Änderung | Entwurf |
| 6 | Trainingshalle | Grundwert bestimmen: G = W : (1 ± p); Fehler W − p·W | Daten, Blatt offen |
| 7 | Duelle | absolut (fester Bonus) vs. prozentual; Schwellenwert b : p; Würfelduell mit gleichen LP | Entwurf |
| 8 | Arena | Zinsen: 5 % pro Angriff; Gegner mit wenig/viel Leben; Lang- vs. Kurzschwert | Daten, Blatt offen |

## Regeln der Rechenmaschine
- Modifikatoren, die dieselbe Schadensquelle treffen (Quellwort, ELEMENTAR, SCHADEN), werden addiert; ein Faktor 1 + Summe. Das gilt auch für „auf a %“ (zählt als a − 100 %). Von Julian bestätigt.
- Reihenfolge: Grundschaden summieren → Umwandlung → „kein Schaden“ → Modifikatoren → Gegnerwiderstände → Aufbau pro Angriff.
- Rüstung der Dunkelheit: alle Modifikatoren werden verdoppelt und wirken auf CHAOS.
- Zins: Schaden des n-ten Angriffs = Basis · 1,05^(n−1), Zähler startet pro Kampf neu.
- Würfel (W6): 1–2 Minimum, 3–4 Mittelwert, 5–6 Maximum. Jeder Gegenstand speichert min, mittel, max; Karten zeigen die kleine Tabelle.
- Duell: gleiche LP, gleichzeitige Angriffe; Ende bei ≤ 0 LP; es gewinnt, wer weniger tief im Minus liegt (genau gleich: Rückkampf). Exakte Gewinnchancen per `duellWahrscheinlichkeit`.

## Korrekturen am Original
- Beispieltext: Der FEUERschaden steigt um 40 % (nicht 20 %), weil der Ring ELEMENTAR +40 % gibt.
- „Eisener Fürst“ → „Eiserner Fürst“; Einheiten vereinheitlicht: SP (Schaden), LP (Leben).
