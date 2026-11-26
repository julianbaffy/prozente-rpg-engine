# Powergaming mit Prozenten – Konzept (Stand: 26.11.2026)

Klasse 7 Mathe, Prozentrechnung als Rollenspiel (Fantasy / Pen and Paper). Alle Dateien: `03 Prozentrechung RPGS/rpg-engine/`. Arbeitsregeln und Schreibweisen: `CLAUDE.md` (in `rpg-engine/`). Ordner und Dateien dürfen umbenannt werden; der Ordner wird über den Inhalt (`gegenstaende.json`, `engine.js`) wiedererkannt.

## Dateien
- `gegenstaende.json` – 37 Gegenstände, 12 Gegner, Duelle, Quests (Aufgaben); `engine.js` – Rechenmaschine; `test.js` – Tests (`node test.js`)
- `arbeitsblaetter.js` – Inhalt der Arbeitsblätter inkl. Lösungen (`node arbeitsblaetter.js N` → `einheit-N.md/.json`)
- `layout/` – Generatoren für pptx (`build-arbeitsblatt.js`, `build-karten.js`, `build-regeln.js`, `build-uv-uebersicht.js`, `build-qr.js`), `dateinamen.js` (Namensschema), Icons und Assets
- `pptx/pergament/` (von Julian von Hand bearbeitet = Master) und `pptx/ohne-hintergrund/` (daraus abgeleitet mit `layout/pergament-zu-ohne.py`); `pptx/1.1_Regeln.pptx`, `pptx/0.0_UV_Uebersicht.docx` (von Julian von Hand gepflegt)
- `PDFs/` (neben `rpg-engine/`): PDFs aller pptx, gleiche Unterordner; nach jeder Änderung neu rendern
- `web/` – Web-Tool zum Prüfen eigener Rechnungen; QR-Seite `0.3_QR_Web_Tool` verweist darauf

Befehle: `node layout/build-arbeitsblatt.js alle|N`, `node layout/build-karten.js [stufe | gegner | gegner-3 | uebersicht 3|4|7|8]`, `node layout/build-regeln.js [--mit-ruestung]`, `node layout/make-icons.js`.

Arbeitsweise: Julians pptx werden nie überschrieben. Änderungen von ihm werden in den Generator übernommen oder direkt in die vorhandene Datei nachgezogen; Lösungsseiten (Fußzeile „Lösungen · Einheit“) dürfen per `layout/loesungen-tauschen.py` aus dem Generator eingesetzt werden. Vor dem Schreiben immer mtime der Datei auf dem Rechner prüfen.

## Dateinamen (Schema Einheit.Nummer_Art_Name)
`0.0` UV-Übersicht · `0.1` Gegenstandskarten alle · `0.2` Gegnerkarten alle · `0.3` QR Web-Tool · `1.1` Regeln · `1.2` AB Die Schmiede · `1.3` Gegenstandskarten Stufe 1 · `2.1` AB Die Rüstkammer · `2.2` Karten Stufe 2 · `3.1` AB Die Monsterhöhlen · `3.2` Übersicht Gegner · `3.3` Gegnerkarten Stufe 3 · `4.1` AB Die Schriftrollenhändlerin · `4.2` Übersicht · `5.1` AB Der Verzauberer · `6.1` AB Die Trainingshalle · `7.1` AB Duelle · `7.2` Übersicht · `8.1` AB Die Arena · `8.2` Übersicht · `9.1` AB Der Helm des Nachhalls (Namen siehe `layout/dateinamen.js`)

## Einheiten
| Einheit | Titel | Inhalt / Lernziel | Material (30 SuS) |
|---|---|---|---|
| 1 | Die Schmiede | Waffe + Zaubergegenstand; Prozentwert W = p · G; gleiche Schadensarten addieren (Bonus) | 30× AB (2 Seiten); 10× Gegenstandskarten Stufe 1 (laminiert) |
| 2 | Die Rüstkammer | + Rüstung: Umwandlung, „Grundschaden <ART>“, negative Modifikatoren, „kein Schaden“ | 30× AB (2 Seiten); 10× Karten Stufe 1 und 2 |
| 3 | Die Monsterhöhlen | Widerstand / Immunität / Anfälligkeit (× 0,5, × 2); zwei Sets; 3 Runden; Pech / Ø / Glück; Würfelduell | 30× AB (4 Seiten); 10× Übersicht Gegner; Karten; W6 |
| 4 | Die Schriftrollenhändlerin (Thelya, Prozenturis) | Steigern / Verringern UM p % vs. AUF p %; ab hier Faktor 1 ± p | 30× AB (3 Seiten); 10× Übersicht 4.2 |
| 5 | Der Verzauberer (Magister Quillon) | Prozentsatz bestimmen p = W : G; Änderung in % | 30× AB (2 Seiten) |
| 6 | Die Trainingshalle | Grundwert bestimmen G = W : (1 ± p); „Wie stark sind diese Übungswaffen?“ | 30× AB (2 Seiten) |
| 7 | Duelle (Ritter Lohnamm der Unnachgiebige) | absolut (fester Bonus) vs. prozentual; Schwellenwert b : p; Würfelduell mit gleichen LP | 30× AB (3 Seiten); 10× Übersicht 7.2; W6 |
| 8 | Die Arena | Zinsen: n-ter Angriff Basis · (1 + Satz)^(n−1); Gegner mit wenig / viel Leben; Lang- vs. Kurzschwert | 30× AB (4 Seiten); 10× Übersicht 8.2 |
| 9 | Der Helm des Nachhalls (★ Zusatz) | Nachträglicher Bonus: multiplizieren statt addieren; ab Einheit 2 einsetzbar; 1 Blatt mit Ausrüstungskarte (zum Laminieren) + Lösungsseite; Aufgaben im Heft | 1 Blatt, bunt, laminiert |

Aufbau ab Einheit 4: Beispiel (z. T. mit Lücken) → Merkkasten (Sicherung) → Anwendungsaufgaben, ★-Aufgabe am Ende → Lösungsseiten (mindestens 11 pt). Einheiten 1–3: Einstieg, Kasten „Das musst du wissen“, Aufgaben, Build-Vorlage (Waffe / Rüstung / Zaubergegenstand) mit Tabelle Schadensart | Grundschaden | Modifikatoren | Bonus | **Neuer Schaden** (je Min / Mittel / Max). Arbeitsblätter enthalten keine Bilder, sondern verweisen auf die laminierten Übersichten und Gegenstandskarten (je 3 SuS teilen sich einen Satz). Vor Einheit 1: Klett-Blatt „03.1 Prozentwerte berechnen“.

## Schreibweise
- Begriff **Schadensart** (intern bleiben `quelle`, `quellen`, `proQuelle` in JSON/JS).
- Schadensart + „schaden“ klein zusammen: FEUERschaden, EISschaden, BLITZschaden, PHYSISCHschaden, CHAOSschaden, ELEMENTARschaden; „PHYSISCHer/PHYSISCHen Schaden“ bleibt gebeugt. Einheiten: SP (Schaden), LP (Leben).
- Absoluter Grundschaden: „+50 Grundschaden PHYSISCH“. Spaltenkopf immer „Neuer Schaden“ (bei Spannen „Neuer Schaden (Ø)“).
- Ein einzelner Angriff heißt immer „Angriff“ (nicht „Treffer“ oder „Schlag“): „Schaden pro Angriff“, „Angriffe nötig“, „1. Angriff“. „Glückstreffer“ bleibt.
- Zins mit Hochzahlen (1,05³); Minus als „−“. Keine Zeile „Nur für die Lehrkraft …“ auf den Arbeitsblättern.
- Variante ohne Hintergrund: nur das Pergamentbild entfällt; Kästen und Labels behalten ihre Farbe, Tabellen sind weiß.

## Gegenstände – Namen
- Umbenennungen: Oros Opferung → Feuersturm; Discords Wahlspruch → Wams des Wahnsinns; Der Ebenholzturm → Letzte Bastion; Elsas Vermächtnis → Valdorils Vermächtnis; Baldars Weisheit; Funkenstab (BLITZ 10 / 15 / 20); Ring der Eiskönigin (+100 % EIS), Fjordgreifer (Handschuhe, +10 % EIS); Ring der Glut (+20 % FEUER, Zaubergegenstand) und Handschuhe des Glutschmieds (+10 FEUERschaden, Rüstung). Wetzstein entfernt. Handschuhe zählen als Rüstung, Ringe / Armbänder als Zaubergegenstände.
- Klinge der Rachsucht (Krummsäbel): 25 CHAOS (fest), Zins 8 %; Wutklinge 5 %; Gleichmäßige Klinge linear (+2 SP pro Angriff).

## Regeln der Rechenmaschine
- Reihenfolge: Grundschaden summieren → Umwandlung (50 % jedes anderen Grundschadens wird zur Zielschadensart) → „kein Schaden“ → Modifikatoren (addiert) → „nachträglich“ (multipliziert) → Gegnerwiderstände (Faktor 1 ± p, immun 0) → Aufbau pro Angriff.
- Modifikatoren auf dieselbe Schadensart (Schadensartwort, ELEMENTAR, SCHADEN) werden addiert; ein Faktor 1 + Summe. „Auf a %“ zählt als a − 100 %.
- Einheiten 1–3 rechnen mit Bonus (Grundschaden · Modifikator, neuer Schaden = Grundschaden + Bonus); der Faktor kommt erst in Einheit 4. Nur der Gegnerfaktor in Einheit 3 steht früher.
- Feenstaub: FEUER, EIS und BLITZ je +40 %.
- Wams des Wahnsinns: 50 % des Grundschadens jeder Schadensart werden CHAOS, danach +25 % auf CHAOS; FEUER und PHYSISCH behalten ihre Modifikatoren.
- Rüstung der Dunkelheit: alle Modifikatoren werden verdoppelt und wirken auf CHAOS.
- Helm des Nachhalls (`nachtraeglich`, +25 %): wirkt nach den addierten Modifikatoren multiplikativ auf EINE wählbare Schadensart (`build.nachtraeglichAuf`, Standard: höchster Mittelwert); Ergebnis G · (1 + m) · (1 + x), Vorteil G · m · x. `stufe: 9`, nicht in den Pools der Einheiten 1–8.
- Zins: Zähler startet pro Kampf neu. Würfel (W6): 1–2 Minimum, 3–4 Mittelwert, 5–6 Maximum. Feste Werte (`wert`): min = mittel = max (Karten zeigen eine Zelle).
- Gegenstände ohne Waffe (Armband des Feuers, Ring der Glut, Letzte Bastion) haben keine Schadenstabelle; ihr absoluter Schaden ist ein Modifikator („+12,5 FEUERschaden“).
- Duelle: Stufe 3 Held (würfelt) gegen Monster, 3 Runden, Set nur komplett wechseln. Einheit 7: Held gegen Held, gleiche LP, gleichzeitige Angriffe, Ende bei ≤ 0 LP; es gewinnt, wer weniger tief im Minus liegt (gleich: Rückkampf).
- Einheit 3 (324 vollständige Sets): Paare, die alle Monster in 3 Runden schaffen: 12 (Pech), 63 (Ø), 554 (Glück) – Werte kommen aus `node test.js`.

## Korrekturen am Original
- Beispieltext: Der FEUERschaden steigt um 40 % (nicht 20 %), weil der Ring ELEMENTAR +40 % gibt.
- „Eisener Fürst“ → „Eiserner Fürst“; Einheiten vereinheitlicht: SP (Schaden), LP (Leben).

## Weitere Dateien
- Gegenstandskarten (alle oder je Stufe), Gegnerkarten (12 Gegner), Übersichten 3 / 4 / 7 / 8 (A4 quer), Regeln-Präsentation (16:9), UV-Übersicht (docx von Julian, pptx-Generator vorhanden), QR-Seite, Web-Tool. Fehlt ein Icon, erscheint der Platzhalter „Bild“.

## Offen
- Aufräumen von Hand: Icon-Dateien in `layout/assets/icons*` (Wetzstein, alte Namen wie `oros-opferung`, `discords-wahlspruch`, `der-ebenholzturm`, `elsas-vermaechtnis`), veraltete Dateien im Ordner `pptx/`.
- Erweiterungen: weitere Gegner und Gegenstände; eigenständige Build-Vorlage zum Ausdrucken mit Platz für berechnete Werte.
