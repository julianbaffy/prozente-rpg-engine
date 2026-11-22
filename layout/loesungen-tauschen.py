"""Ersetzt in Julians pptx die Lösungsfolien (oder, mit 4. Argument N, alle Folien ab der N+1.) (Fußzeile 'Lösungen · …') durch die Lösungsfolien einer generierten pptx."""
import zipfile,sys,re,posixpath,copy
from lxml import etree
NS={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
R='http://schemas.openxmlformats.org/package/2006/relationships'
CT='http://schemas.openxmlformats.org/package/2006/content-types'
RT='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
def load(f):
    z=zipfile.ZipFile(f); return {i.filename:(i,z.read(i.filename)) for i in z.infolist()}
def order(parts):
    pres=etree.fromstring(parts['ppt/presentation.xml'][1]); rels=etree.fromstring(parts['ppt/_rels/presentation.xml.rels'][1])
    rm={r.get('Id'):r.get('Target') for r in rels}
    return [(sid.get('{%s}id'%NS['r']),'ppt/'+rm[sid.get('{%s}id'%NS['r'])]) for sid in pres.find('p:sldIdLst',NS)]
def text(parts,n): return ''.join(t.text or '' for t in etree.fromstring(parts[n][1]).iter('{%s}t'%NS['a']))
def swap(base,gen,out,keep=None):
    B=load(base); G=load(gen)
    bo=order(B); go=order(G)
    if keep is None:
        bsol=[x for x in bo if 'Lösungen · Einheit' in text(B,x[1])]
        gsol=[x for x in go if 'Lösungen · Einheit' in text(G,x[1])]
    else:   # die ersten `keep` Folien der Basis bleiben, alle weiteren kommen aus der generierten Datei
        bsol=bo[keep:]; gsol=go[keep:]
    assert bsol and gsol
    layout_rel=None
    brels=lambda n:n.replace('slides/','slides/_rels/')+'.rels'
    for r in etree.fromstring(B[brels(bsol[0][1])][1]):
        if r.get('Type').endswith('/slideLayout'): layout_rel=r.get('Target')
    # entfernen
    pres=etree.fromstring(B['ppt/presentation.xml'][1]); lst=pres.find('p:sldIdLst',NS)
    prel=etree.fromstring(B['ppt/_rels/presentation.xml.rels'][1]); ct=etree.fromstring(B['[Content_Types].xml'][1])
    for rid,n in bsol:
        for sid in list(lst):
            if sid.get('{%s}id'%NS['r'])==rid: lst.remove(sid)
        for r in list(prel):
            if r.get('Id')==rid: prel.remove(r)
        for o in list(ct):
            if o.get('PartName')=='/'+n: ct.remove(o)
        for r in etree.fromstring(B[brels(n)][1]):
            if r.get('Type').endswith('/notesSlide'):
                nn_=posixpath.normpath(posixpath.join('ppt/slides',r.get('Target')))
                B.pop(nn_,None); B.pop(nn_.replace('notesSlides/','notesSlides/_rels/')+'.rels',None)
                for o in list(ct):
                    if o.get('PartName')=='/'+nn_: ct.remove(o)
        del B[n]; B.pop(brels(n),None)
    # hinzufügen
    maxn=max(int(re.search(r'slide(\d+)\.xml',n).group(1)) for n in B if re.match(r'ppt/slides/slide\d+\.xml$',n))
    maxid=max(int(s.get('id')) for s in lst) if len(lst) else 255
    maxr=max(int(r.get('Id')[3:]) for r in prel if r.get('Id').startswith('rId'))
    defaults={d.get('Extension').lower() for d in ct if d.tag.endswith('Default')}
    k=0
    for rid,n in gsol:
        k+=1; nn=f'ppt/slides/slide{maxn+k}.xml'
        B[nn]=(zipfile.ZipInfo(nn),G[n][1])
        grel=etree.fromstring(G[brels(n)][1]); newrel=etree.Element('{%s}Relationships'%R,nsmap={None:R})
        for r in grel:
            if r.get('Type').endswith('/notesSlide'): continue
            r2=copy.deepcopy(r)
            if r.get('Type').endswith('/slideLayout'): r2.set('Target',layout_rel)
            elif r.get('Type').endswith('/image'):
                src=posixpath.normpath(posixpath.join('ppt/slides',r.get('Target')))
                ext=src.rsplit('.',1)[1].lower()
                dst=f'ppt/media/swap{k}-{posixpath.basename(src)}'
                B[dst]=(zipfile.ZipInfo(dst),G[src][1]); r2.set('Target','../media/'+posixpath.basename(dst))
                if ext not in defaults:
                    d=etree.SubElement(ct,'{%s}Default'%CT); d.set('Extension',ext); d.set('ContentType','image/jpeg' if ext in('jpg','jpeg') else 'image/'+ext); defaults.add(ext)
            newrel.append(r2)
        B[brels(nn)]=(zipfile.ZipInfo(brels(nn)),etree.tostring(newrel,xml_declaration=True,encoding='UTF-8',standalone=True))
        ov=etree.SubElement(ct,'{%s}Override'%CT); ov.set('PartName','/'+nn); ov.set('ContentType','application/vnd.openxmlformats-officedocument.presentationml.slide+xml')
        maxr+=1; r=etree.SubElement(prel,'{%s}Relationship'%R); r.set('Id',f'rId{maxr}'); r.set('Type',RT+'/slide'); r.set('Target',f'slides/slide{maxn+k}.xml')
        maxid+=1; s=etree.SubElement(lst,'{%s}sldId'%NS['p']); s.set('id',str(maxid)); s.set('{%s}id'%NS['r'],f'rId{maxr}')
    for n,x in (('ppt/presentation.xml',pres),('ppt/_rels/presentation.xml.rels',prel),('[Content_Types].xml',ct)):
        B[n]=(B[n][0],etree.tostring(x,xml_declaration=True,encoding='UTF-8',standalone=True))
    # unreferenzierte Medien raus
    refd=set()
    for n,(it,d) in B.items():
        if n.endswith('.rels'):
            bdir=n.replace('_rels/','').rsplit('.rels',1)[0].rsplit('/',1)[0] if '/' in n.replace('_rels/','') else ''
            for r in etree.fromstring(d):
                if r.get('TargetMode')=='External': continue
                tg=r.get('Target'); refd.add(tg[1:] if tg.startswith('/') else posixpath.normpath(posixpath.join(bdir,tg)))
    zo=zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED)
    names=['[Content_Types].xml']+[n for n in B if n!='[Content_Types].xml']
    for n in names:
        if n.endswith('/') or (n.startswith('ppt/media/') and n not in refd): continue
        zo.writestr(n,B[n][1])
    zo.close()
if __name__=='__main__': swap(sys.argv[1],sys.argv[2],sys.argv[3],int(sys.argv[4]) if len(sys.argv)>4 else None)
