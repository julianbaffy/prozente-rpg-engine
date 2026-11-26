# Einheit 6: Die Trainingshalle – Wie stark ist die Übungswaffe wirklich? (Grundwert berechnen)

*Bevor du in die Arena gehst, übst du in der Trainingshalle. Dort liegen Übungswaffen, deren Grundschaden niemand kennt. Du kannst nur messen, wie viel Schaden sie mit deiner Ausrüstung machen.*

## Beispiel

In der Trainingshalle von Prozenturis liegen Übungswaffen bereit. Du trägst Handschuhe mit +10 % PHYSISCH und schlägst mit einer Übungswaffe zu: 33 SP.

| Schritt | Rechnung |
|---|---|
| Gegeben | Prozentwert W = 33 SP (gemessen, mit Handschuhen),  Bonus p = 10 % = 0,1,  gesucht: Grundwert G |
| Faktor | Der gemessene Schaden ist G · (1 + p) = G · 1,1 |
| Umstellen | G · (1 + p) = W ➔ G = W : (1 + p) = 33 : 1,1 = 30 SP |
| Probe | 30 · 1,1 = 33 SP ✓ |
| Typischer Fehler | 33 − 10 % von 33 = 29,7 ✗  (Probe: 29,7 · 1,1 = 32,67 ≠ 33) |

*Die 10 % beziehen sich auf den Grundschaden G, nicht auf den gemessenen Schaden. Darum wird durch 1,1 geteilt und nicht 10 % abgezogen.*

## Merke: Den Grundwert berechnen

> **Nach einer Steigerung um p %:**  G = W : (1 + p)  (z. B. 33 : 1,1 = 30)
>
> **Nach einer Verringerung um p %:**  G = W : (1 − p)  (z. B. 48 : 0,8 = 60)
>
> **Probe:**  G · (1 ± p) = neu  (z. B. 30 · 1,1 = 33)
>
> undefined
>
> ⚠ Nicht „10 % vom gemessenen Wert abziehen“! Die Prozente beziehen sich auf G, nicht auf den neuen Wert.

## Aufgaben

### Aufgabe 1 – Welche Übungswaffe nehme ich mit?

Berechne für jede Übungswaffe den Grundschaden.


| Handschuhe | Gemessener Schaden | Grundschaden der Übungswaffe |
|---|---|---|
| Glutfäustlinge (+25 % FEUER) | 45 |  |
| Fluchhandschuhe (−20 % PHYSISCH) | 48 |  |
| Sturmhandschuhe (+40 % BLITZ) | 63 |  |

### Aufgabe 2 – Zwei Boni auf einmal

Du trägst ***Umhang des Bescheidenen*** und einen Zaubergegenstand: ***Rote Bullentrinkflasche*** ODER ***Ring der Eiskönigin***. Entnimm die Werte aus der Übersicht der Gegenstände Stufe 1 und 2.
Die Übungswaffe macht den gemessenen Schaden. Wie hoch ist ihr Grundschaden?


| Rüstung + Zaubergegenstand | Schadensart | Gemessen | Bonus insgesamt | Grundschaden |
|---|---|---|---|---|
| Umhang des Bescheidenen + Rote Bullentrinkflasche | PHYSISCH | 105 |  |  |
| Umhang des Bescheidenen + Ring der Eiskönigin | EIS | 90 |  |  |

### Aufgabe 3 – Wenn die Rüstung schwächt

Du trägst ***Fokussierte Gedanken***. Ein Übungsstab (EIS) macht 15 SP, ein Übungsspeer (PHYSISCH) macht 45 SP. Wie hoch ist jeweils der Grundschaden?


### Aufgabe 4 – Noch mehr Training

In der Trainingshalle liegen zwei Nachbildungen echter Waffen aus der Übersicht (Stufe 1). Du trägst jeweils nur die angegebene Ausrüstung. Berechne die Grundschäden und vergleiche sie mit den Mittelwerten der Originale: stärker, schwächer oder gleich?


| Nachbildung von | Ausrüstung | Schadensart | Gemessen | Grundschaden | Original |
|---|---|---|---|---|---|
| Weltenschaffer | Feenstaub | FEUER (+40 %) | 35 |  |  |
| Weltenschaffer | Feenstaub | EIS (+40 %) | 21 |  |  |
| Baldars Weißheit | Fokussierte Gedanken | PHYSISCH (+50 %) | 30 |  |  |
| Baldars Weißheit | Fokussierte Gedanken | FEUER (−50 %) | 7,5 |  |  |
| Baldars Weißheit | Fokussierte Gedanken | EIS (−50 %) | 10 |  |  |

---

## Lösungen (Lehrkraft)

**Aufgabe 1**
- Glutfäustlinge: G = 45 : 1,25 = 36 (Fehler: 45 · 0,75 = 33,75)
- Fluchhandschuhe: G = 48 : 0,8 = 60 (Fehler: 48 · 1,2 = 57,6)
- Sturmhandschuhe: G = 63 : 1,4 = 45 (Fehler: 63 · 0,6 = 37,8)

**Aufgabe 2**
- Umhang des Bescheidenen + Rote Bullentrinkflasche: Bonus 75 % → Faktor 1,75 → G = 105 : 1,75 = 60 SP
- Umhang des Bescheidenen + Ring der Eiskönigin: Bonus 125 % → Faktor 2,25 → G = 90 : 2,25 = 40 SP

**Aufgabe 3**
- EIS: Faktor 0,5 (-50 %) → G = 15 : 0,5 = 30 SP
- PHYSISCH: Faktor 1,5 (+50 %) → G = 45 : 1,5 = 30 SP

**Aufgabe 4**
- Weltenschaffer-Nachbildung (Feenstaub): FEUER: G = 35 : 1,4 = 25 SP (Original 30 SP → schwächer); EIS: G = 21 : 1,4 = 15 SP (Original 15 SP → gleich).
- Baldars Weißheit-Nachbildung (Fokussierte Gedanken): PHYSISCH: G = 30 : 1,5 = 20 SP (Original 15 SP → stärker); FEUER: G = 7,5 : 0,5 = 15 SP (Original 15 SP → gleich); EIS: G = 10 : 0,5 = 20 SP (Original 15 SP → stärker).
