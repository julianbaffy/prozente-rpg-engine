#!/usr/bin/env python3
"""Erzeugt den QR-Code zum Web-Tool als PNG (layout/assets/qr-webtool.png).
   Aufruf:  python3 layout/make-qr.py [URL]      (benötigt:  pip install segno)
   Dunkelbraun (INK) auf Weiß, Fehlerkorrektur Q, 4 Module Ruhezone – gut scannbar auch bei Druck auf Pergament-/Buntpapier."""
import sys, os
import segno
URL = sys.argv[1] if len(sys.argv) > 1 else 'https://julianbaffy.github.io/prozente-rpg-engine/'
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'qr-webtool.png')
qr = segno.make(URL, error='q', boost_error=False)
qr.save(out, scale=40, border=4, dark='#2E2114', light='#FFFFFF')
print(f'{out}  ({qr.version} → {qr.symbol_size(border=0)[0]}×{qr.symbol_size(border=0)[1]} Module) {URL}')
