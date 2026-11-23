# Powergaming mit Prozenten (Prozentrechnung RPG, Klasse 7 Mathe)

Unterrichtsmaterial von Julian (Lehrer, Deutschland). Sprache: Deutsch (Material, Kommentare, Commit-Messages, Antworten).
Ausführliches Konzept: `KONZEPT.md` (Stufen 1–9, Regeln, Gegenstände, offene Punkte). Bei Widersprüchen gilt die Datei von Julian bzw. `KONZEPT.md`.

## Ordner
- `gegenstaende.json` – alle Gegenstände und Gegner (37 Gegenstände, 12 Gegner)
- `engine.js` – Rechenmaschine (Schadensberechnung, Zins, Gegnerwiderstände)
- `test.js` – Engine-Tests und Kontrollrechnungen
- `arbeitsblaetter.js` – erzeugt Inhalt der Arbeitsblätter (`einheit-N.md/.json` inkl. Lösungen)
- `layout/` – Generatoren für pptx (`build-arbeitsblatt.js`, `build-karten.js`, `build-regeln.js`, `icons.js`, `make-assets.js`, `make-icons.js`, `kartentext.js`, `pergament-zu-ohne.py`, `loesungen-tauschen.py`), Bilder in `layout/assets/`
- `pptx/`, `PDFs/` – generierte Dateien (nicht in Git, siehe `.gitignore`)
- `web/` – browserbasiertes Tool (`index.html`, `app.js`, `style.css`): Gegenstände wählen, Werte berechnen lassen

## Befehle
- `node test.js` – Engine-Tests (muss nach jeder Änderung an Engine/JSON grün sein)
- `node arbeitsblaetter.js N` – Inhalt der Einheit N neu erzeugen
- `node layout/build-arbeitsblatt.js alle` (oder `N`) – Arbeitsblätter, je `pptx/pergament/` und `pptx/ohne-hintergrund/`
- `node layout/build-karten.js [stufe | gegner | gegner-3 | uebersicht 3|4|7|8]` – Gegenstands-/Gegnerkarten, Übersichten
- `node layout/build-regeln.js [--mit-ruestung]` – Regel-Präsentation
- `node layout/make-icons.js` – Icons neu erzeugen
- `python3 layout/make-og-bild.py` – Vorschaubild für Links (`web/og-bild.jpg`, 1200 × 630) neu erzeugen; OG-Tags in `index.html` und `web/index.html` nutzen absolute Adressen unter `https://julianbaffy.github.io/prozente-rpg-engine/`

## Wichtige Arbeitsregeln
- **Julians pptx-Dateien werden nie überschrieben.** Er ändert pptx von Hand. Änderungen daraus entweder in den Generator übernehmen (Text vergleichen) oder direkt in die vorhandene Datei nachziehen. Nur die Pergament-Variante wird von Hand bearbeitet, „ohne Hintergrund“ wird daraus abgeleitet. Vor dem Überschreiben generierter Dateien immer prüfen, ob Julian sie geändert hat (mtime).
- Lösungsseiten (Fußzeile „Lösungen · Einheit“) dürfen per `layout/loesungen-tauschen.py` aus dem Generator in Julians Dateien eingesetzt werden; alle anderen Folien bleiben unangetastet.
- Lösungen und Zahlen kommen immer aus der Engine, nie von Hand rechnen.
- Interne Schlüssel in JSON/JS (`quelle`, `quellen`, `proQuelle`) bleiben unverändert, sichtbarer Begriff ist **Schadensart**.

## Schreibweise im Material
- Schadensart + „schaden“ klein zusammen: FEUERschaden, EISschaden, BLITZschaden, PHYSISCHschaden, CHAOSschaden, ELEMENTARschaden (kein Bindestrich, kein Leerzeichen); „PHYSISCHer/PHYSISCHen Schaden“ bleibt gebeugt.
- Einheiten: SP (Schaden), LP (Leben). Schadensarten in GROSSBUCHSTABEN.
- Lösungsseiten überall mindestens 11 pt; Build-Vorlage: Kopf/Beschriftungen 9 pt, Namen und Tabellenzellen 10 pt.
- Arbeitsblätter enthalten keine Bilder, sondern verweisen auf laminierte Übersichten/Gegenstandskarten.

## Regeln der Rechenmaschine
- Reihenfolge: Grundschaden summieren → Umwandlung (50 % jedes anderen Grundschadens wird zur Zielschadensart) → „kein Schaden“ → Modifikatoren → Gegnerwiderstände (Faktor 1 ± p, immun 0) → Aufbau pro Angriff.
- Modifikatoren auf dieselbe Schadensart (Schadensartwort, ELEMENTAR, SCHADEN) werden **addiert**, dann Faktor 1 + Summe. „Auf a %“ zählt als a − 100 %.
- Einheiten 1–3 rechnen mit Bonus (Grundschaden · Modifikator, neuer Schaden = Grundschaden + Bonus); der Faktor kommt erst in Einheit 4. Nur der Gegnerfaktor in Einheit 3 (× 0,5, × 2) bleibt.
- Würfel (W6): 1–2 Minimum, 3–4 Mittelwert, 5–6 Maximum.
- Feste Werte: Waffe mit nur einem Angriffswert steht im JSON als `wert` (min = mittel = max).
- Gegenstände ohne Waffe (Armband des Feuers, Ring der Glut, Letzte Bastion) haben keine Schadenstabelle; ihr absoluter Schaden ist ein Modifikator („+12,5 FEUERschaden“).
- Feenstaub: alle drei Modifikatoren (FEUER, EIS, BLITZ) +40 %.
- Wams des Wahnsinns: 50 % des Grundschadens jeder Schadensart (ohne Modifikatoren) werden CHAOS, danach +25 % auf CHAOS; FEUER und PHYSISCH behalten ihre eigenen Modifikatoren.
- Rüstung der Dunkelheit: alle Modifikatoren werden verdoppelt und wirken auf CHAOS.
- Zins: Schaden des n-ten Angriffs = Basis · (1 + Satz)^(n−1), Zähler startet pro Kampf neu (Wutklinge 5 %, Klinge der Rachsucht 8 %). Alternativ `linear` (Gleichmäßige Klinge, +2 SP pro Angriff).
- Engine-Regel `nachtraeglich` (Helm des Nachhalls): +25 % wirken nach den addierten Modifikatoren multiplikativ auf eine wählbare Schadensart.
- Handschuhe zählen als Rüstung, Ringe/Armbänder als Zaubergegenstände.

## Web-Tool (`web/`)
Zweck: Julian und Schüler prüfen damit eigene Rechnungen (Gegenstände wählen, Werte werden berechnet). Es läuft nur online, Offline-Nutzung per Doppelklick ist nicht nötig.
- Reines HTML/CSS/JavaScript, kein Framework, kein Build-Schritt, keine npm-Abhängigkeiten im Browser.
- Der Browser lädt dieselbe `engine.js` wie Node (über `../engine.js`) und `gegenstaende.json` per `fetch`. Keine Kopien der Engine oder der Daten anlegen.
- `engine.js` ist ein ES-Modul (`export`/`import`, `"type": "module"` in `package.json`) und wird von Node und Browser gemeinsam genutzt. Alle Generatoren in `layout/`, `arbeitsblaetter.js` und `test.js` nutzen `import`; JSON wird per `fs.readFileSync` gelesen.
- Gegenstände und Gegner erscheinen nur als Icon; beim Zeigen (Maus), Tippen (Touch) oder Tastatur-Fokus erscheint die Karte wie im Material. „Deine Ausrüstung“ zeigt die Karten von Waffe, Rüstung, Zaubergegenstand (und Gegner) untereinander. Die Kartentexte (`modZeilen`, `gegnerZeilen`) stehen in `layout/kartentext.js` und werden von `build-karten.js` und `web/app.js` gemeinsam genutzt.
- `app.js` stellt nur dar; Zahlen kommen aus `profil()`, `treffer()`, `kampf()`, `schadenNachRunden()` und `verlauf()` der Engine. Der Zustand (Auswahl, Würfel, Rechenweg) steht in der Adresse (`#waffe=…&gegner=…`), Links lassen sich teilen.
- Funktionen: Waffe/Rüstung/Zaubergegenstand wählen, Gegner wählen, Min/Mittel/Max, Aufbau/Zins-Verlauf, Gesamtschaden gegen einen Gegner.
- Optik: Fantasy / Pen-and-Paper, passend zu den Arbeitsblättern; für Handy und Tablet im Klassenraum geeignet.
- Lokal testen mit einem Server im Repo-Hauptordner (z. B. `npx serve .` oder `python3 -m http.server`), da Module und `fetch` nicht über `file://` laufen.

## Deployment
- Das gesamte Repo ist öffentlich und wird mit GitHub Pages aus dem Branch `main`, Ordner `/ (root)` veröffentlicht. Es gibt keinen Build-Schritt und keine Action.
- Die Seite liegt unter `https://<name>.github.io/<repo>/web/`. Eine `index.html` im Hauptordner leitet auf `web/` weiter.
- Veröffentlicht wird alles, was eingecheckt ist (Engine, JSON, Lösungen, Konzept). Das ist von Julian so gewollt. `pptx/` und `PDFs/` sind ignoriert und werden nicht veröffentlicht.
- Pfade im Web-Tool immer relativ angeben (`../engine.js`, `../gegenstaende.json`), weil die Seite in einem Unterpfad liegt.

## Git
- Repo liegt in `rpg-engine/`. Generierte Ordner (`pptx/`, `PDFs/`) sind ignoriert, enthalten aber Julians handbearbeitete Dateien: nie löschen oder überschreiben, ohne zu fragen.
- Kleine, sinnvolle Commits mit deutscher Beschreibung.
