"""Vorschaubild für Links (Open Graph, 1200 × 630) im Stil der Arbeitsblätter.

    python3 layout/make-og-bild.py      ->  web/og-bild.jpg

Pergament, Doppelrahmen, Banner mit Titel, Trenner und fünf Gegenstands-Icons aus layout/assets/.
Schrift: Cambria (aus Microsoft Office), sonst Georgia.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HIER = Path(__file__).resolve().parent
ASSETS = HIER / "assets"
ZIEL = HIER.parent / "web" / "og-bild.jpg"
B, H = 1200, 630
TINTE = (46, 33, 20)
CREME = (248, 241, 222)
GRAU = (107, 91, 69)
ICONS = ["mjoelnir", "feuersturm", "wams-des-wahnsinns", "feenstaub", "uralter-drache"]


def schrift(fett=False, kursiv=False, groesse=40):
    namen = {(True, False): ["Cambriab.ttf", "Georgia Bold.ttf"],
             (False, True): ["Cambriai.ttf", "Georgia Italic.ttf"],
             (False, False): ["Cambria.ttc", "Georgia.ttf"]}[(fett, kursiv)]
    orte = [Path(p) for p in Path("/Applications").glob("Microsoft */Contents/Resources/DFonts")]
    orte += [Path("/System/Library/Fonts/Supplemental"), Path("/Library/Fonts")]
    for n in namen:
        for o in orte:
            if (o / n).exists():
                return ImageFont.truetype(str(o / n), groesse)
    return ImageFont.load_default(groesse)


def mitte(d, y, text, f, farbe):
    w = d.textlength(text, font=f)
    d.text(((B - w) / 2, y), text, font=f, fill=farbe)


bild = Image.open(ASSETS / "pergament-quer.jpg").convert("RGB")
s = max(B / bild.width, H / bild.height)
bild = bild.resize((round(bild.width * s), round(bild.height * s)), Image.LANCZOS)
x0, y0 = (bild.width - B) // 2, (bild.height - H) // 2
bild = bild.crop((x0, y0, x0 + B, y0 + H))
d = ImageDraw.Draw(bild)

# Doppelrahmen wie auf den Karten
d.rectangle((18, 18, B - 19, H - 19), outline=TINTE, width=6)
d.rectangle((30, 30, B - 31, H - 31), outline=TINTE, width=2)

# Banner mit Titel
banner = Image.open(ASSETS / "banner.png").convert("RGBA")
bw = 1000
banner = banner.resize((bw, round(banner.height * bw / banner.width)), Image.LANCZOS)
by = 62
bild.paste(banner, ((B - bw) // 2, by), banner)
f_titel = schrift(fett=True, groesse=60)
titel = "Powergaming mit Prozenten"
kasten = d.textbbox((0, 0), titel, font=f_titel)
mitte(d, by + (banner.height - (kasten[3] - kasten[1])) / 2 - kasten[1] - 4, titel, f_titel, CREME)

# Untertitel
mitte(d, by + banner.height + 22, "Schadensrechner zur Prozentrechnung · Klasse 7", schrift(kursiv=True, groesse=38), GRAU)

# Icons
n, g, abstand = len(ICONS), 150, 34
iy = 345
ix = (B - (n * g + (n - 1) * abstand)) // 2
for i, name in enumerate(ICONS):
    ico = Image.open(ASSETS / "icons-klein" / f"{name}.jpg").convert("RGB").resize((g, g), Image.LANCZOS)
    x = ix + i * (g + abstand)
    d.rectangle((x - 7, iy - 7, x + g + 6, iy + g + 6), fill=(255, 253, 246), outline=TINTE, width=3)
    bild.paste(ico, (x, iy))
    d.rectangle((x, iy, x + g - 1, iy + g - 1), outline=TINTE, width=2)

# Trenner und Fußzeile
trenner = Image.open(ASSETS / "trenner.png").convert("RGBA")
tw = 760
trenner = trenner.resize((tw, round(trenner.height * tw / trenner.width)), Image.LANCZOS)
bild.paste(trenner, ((B - tw) // 2, 520), trenner)
mitte(d, 550, "Ausrüstung wählen – Schaden berechnen – Rechnung überprüfen", schrift(groesse=30), TINTE)

ZIEL.parent.mkdir(exist_ok=True)
bild.save(ZIEL, "JPEG", quality=86, optimize=True, progressive=True)
print(ZIEL, ZIEL.stat().st_size // 1024, "KB")
