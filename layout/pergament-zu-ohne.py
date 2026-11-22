"""Pergament-Arbeitsblatt (pptx) -> Variante ohne Hintergrund: nur das Slide-Hintergrundbild entfernen; Kasten-/Label-Füllungen (PAPER/SAND/Merke-Gelb) bleiben erhalten, damit sie sich auf Pergamentpapier abheben.
Tabellen (graphicFrame) und alle anderen Formen bleiben unverändert, exakt wie build-arbeitsblatt.js im Modus 'ohne-hintergrund'."""
import zipfile,sys,re
from lxml import etree
ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
BOX={'FFFDF6','EFE3BE','F3E9C9'}
RELNS='http://schemas.openxmlformats.org/package/2006/relationships'
def conv(src,dst):
    zi=zipfile.ZipFile(src); parts={}
    for it in zi.infolist(): parts[it.filename]=(it,zi.read(it.filename))
    for n in list(parts):
        if re.match(r'ppt/slides/slide\d+\.xml$',n):
            it,data=parts[n]; t=etree.fromstring(data)
            for bg in t.findall('.//p:cSld/p:bg',ns): bg.getparent().remove(bg)
            parts[n]=(it,etree.tostring(t,xml_declaration=True,encoding='UTF-8',standalone=True))
            used=set(re.findall(rb'r:(?:embed|link|id)="([^"]+)"',parts[n][1]))
            rn=n.replace('slides/','slides/_rels/')+'.rels'
            if rn in parts:
                rit,rdata=parts[rn]; rt=etree.fromstring(rdata)
                for r in list(rt):
                    if r.get('Type','').endswith('/image') and r.get('Id').encode() not in used: rt.remove(r)
                parts[rn]=(rit,etree.tostring(rt,xml_declaration=True,encoding='UTF-8',standalone=True))
    # nicht mehr referenzierte Medien entfernen
    refd=set()
    for n,(it,d) in parts.items():
        if n.endswith('.rels'):
            base=n.replace('_rels/','').rsplit('.rels',1)[0]; bdir=base.rsplit('/',1)[0] if '/' in base else ''
            for r in etree.fromstring(d):
                tg=r.get('Target')
                if r.get('TargetMode')=='External': continue
                import posixpath
                refd.add(posixpath.normpath(posixpath.join(bdir,tg)) if not tg.startswith('/') else tg[1:])
    zo=zipfile.ZipFile(dst,'w',zipfile.ZIP_DEFLATED)
    for n,(it,d) in parts.items():
        if n.endswith('/') or (n.startswith('ppt/media/') and n not in refd): continue
        zo.writestr(it,d)
    zo.close()
if __name__=='__main__': conv(sys.argv[1],sys.argv[2])
