"""Seeded original layered illustrations, supersampled to 128px; no external art.
Shared motif painter also supplies distinct silhouettes for signature flipbooks.
"""
import math, random, json, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageFont
ROOT=Path(__file__).resolve().parents[1]
S=3; N=128
PALETTES={'yuji':'ff4167','gojo':'748aff','sukuna':'e52e57','megumi':'8490df','nobara':'ffae58','toji':'a9d8dd','kenjaku':'c179ee','geto':'ad8af6','mahito':'68e8ca','goblin':'a4ed53','skeleton':'9cddff','common':'ead8a5'}
MOTIFS={'yuji':['fist','echo','rush'],'gojo':['red','vortex','beam'],'sukuna':['slashes','cross','shrine'],'megumi':['wolf','snare','garden'],'nobara':['hammer','nails','doll'],'toji':['blade','chain','execution'],'kenjaku':['swarm','gravity','womb'],'geto':['spiral','spirit','maelstrom'],'mahito':['hand','morph','hands'],'goblin':['mace','rogue','mayhem'],'skeleton':['shield','sword','crest'],'common':['blade','fist','shield','boot','wings']}
def rgb(h):return tuple(bytes.fromhex(h))
def motif(kind,index,size=384):
    c=rgb(PALETTES[kind]); light=tuple(int(v*.3+178) for v in c); dark=tuple(int(v*.26) for v in c); white=(255,247,222)
    im=Image.new('RGBA',(384,384));d=ImageDraw.Draw(im);name=MOTIFS[kind][index]
    def poly(points,fill,outline=dark,w=2):d.polygon([(x*3,y*3)for x,y in points],fill=fill);d.line([(x*3,y*3)for x,y in points+[points[0]]],fill=outline,width=w*3,joint='curve')
    def line(points,fill=c,w=2):d.line([(x*3,y*3)for x,y in points],fill=fill,width=max(1,int(w*3)),joint='curve')
    def oval(box,fill,outline=None,w=1):d.ellipse(tuple(v*3 for v in box),fill=fill,outline=outline,width=w*3)
    def arc(points,color=c,width=2):line(points,color,width)
    def spiral(turns=2.5,arms=3):
        for a in range(arms):
            pts=[]
            for j in range(95):
                t=j/94;r=3+t*49;ang=t*math.tau*turns+a*math.tau/arms;pts.append((64+math.cos(ang)*r,64+math.sin(ang)*r*.8))
            line(pts,dark,6);line(pts,c,3);line(pts[-30:],light,1)
    def fist(ox=0,oy=0,scale=1):
        def p(q):return[(64+(x-64)*scale+ox,64+(y-64)*scale+oy)for x,y in q]
        poly(p([(36,94),(41,74),(33,54),(42,36),(52,39),(56,30),(67,32),(72,31),(82,38),(87,47),(94,48),(96,63),(81,83),(76,105)]),c)
        poly(p([(40,53),(46,40),(53,45),(53,61),(62,65),(72,61),(83,50),(90,53),(83,68),(68,77),(47,72)]),light)
        for x,y in [(54,40),(65,36),(76,39)]:line(p([(x,y),(x-2,y+17),(x+5,y+20)]),dark,2)
        poly(p([(43,80),(76,88),(74,101),(39,93)]),dark,light,1)
        line(p([(44,83),(73,93)]),light,2)
    def blade(flip=False):
        poly([(39,87),(85,24),(102,17),(96,39),(49,94)],c)
        poly([(45,85),(95,23),(87,45),(51,90)],white)
        poly([(30,80),(53,100),(59,95),(35,73)],light)
        poly([(27,100),(35,85),(44,93),(34,109)],dark,light,1)
        for y in range(90,104,4):line([(29,y),(37,y+4)],c,1)
    def hand(ox=0,oy=0,s=1):
        p=lambda q:[(64+(x-64)*s+ox,64+(y-64)*s+oy)for x,y in q]
        poly(p([(44,104),(43,76),(30,57),(35,51),(49,63),(47,33),(52,27),(57,55),(58,20),(65,19),(67,53),(72,27),(79,29),(76,59),(85,40),(91,43),(85,75),(73,104)]),c)
        line(p([(51,68),(66,64),(77,71),(62,88)]),light,3)
        for x in [52,63,74]:line(p([(x,48),(x,62)]),dark,1)
    def wolf(ox=0,oy=0,s=1):
        p=lambda q:[(64+(x-64)*s+ox,64+(y-64)*s+oy)for x,y in q]
        poly(p([(27,29),(48,43),(63,37),(80,43),(100,25),(94,64),(99,78),(78,88),(65,104),(45,86),(29,80),(35,62)]),dark,light,2)
        poly(p([(39,59),(56,65),(50,71)]),white);poly(p([(72,65),(88,58),(81,72)]),white)
        poly(p([(57,78),(72,78),(64,87)]),c);line(p([(47,76),(53,87),(64,94),(79,78)]),c,2)
    if name in ['fist','echo','rush']:
        if name=='echo':fist(-18,-14,.8)
        if name=='rush':
            for off in [-24,20]:fist(off,-17,.55)
        for j in range(7):
            a=j*math.tau/7;line([(64+math.cos(a)*32,64+math.sin(a)*32),(64+math.cos(a+.12)*42,64+math.sin(a+.12)*42),(64+math.cos(a)*56,64+math.sin(a)*56)],c,3)
        fist(7 if name=='echo' else 0,8 if name=='echo' else 0,.85)
    elif name in ['blade','sword','execution']: 
        if name=='execution':spiral(.55,3)
        blade()
        if name=='sword':line([(21,82),(45,63),(55,35),(85,15)],light,3)
    elif name in ['red','gravity','vortex','spiral','maelstrom','beam']:
        if name=='red':c=(255,54,88);light=(255,210,183)
        spiral(1.3 if name=='red' else 3,5 if name=='maelstrom' else 3)
        for r in range(19,0,-1):oval((64-r,64-r,64+r,64+r),tuple(int(c[k]*(1-r/28)+white[k]*(r/28)*.4)for k in range(3)))
        if name=='gravity':oval((54,54,74,74),(9,8,28),light,1)
        if name=='beam':
            poly([(13,99),(57,53),(102,17),(80,72),(26,109)],c,light,2);poly([(22,102),(99,22),(67,70)],white)
        else:line([(54,55),(61,50),(69,52)],light,2)
        if name in ['spiral','maelstrom']:
            for j in range(3 if name=='spiral' else 7):
                a=j*math.tau/(3 if name=='spiral' else 7);x=64+math.cos(a)*34;y=64+math.sin(a)*30
                oval((x-9,y-5,x+9,y+5),dark,light,1);oval((x-2,y-3,x+2,y+3),white)
        if name=='vortex':
            for j in range(7):
                a=j*math.tau/7;x=64+math.cos(a)*48;y=64+math.sin(a)*48
                poly([(x,y),(x+math.sin(a)*8,y-math.cos(a)*8),(64+math.cos(a)*29,64+math.sin(a)*29)],light,c,1)
    elif name in ['slashes','cross']:
        for j in range(3):poly([(16+j*13,104),(68+j*12,23),(86+j*8,17),(57+j*15,61)],c,light,1)
        if name=='cross':poly([(22,20),(111,94),(91,97),(45,51)],white,c,2)
    elif name in ['shrine','womb','garden','crest']:
        spiral(.7,4)
        if name=='garden':wolf(-21,10,.55);wolf(23,5,.65)
        elif name=='womb':
            for j in range(7):
                x=24+j*13;line([(x,106),(x-8,86),(64,70),(x+4,44),(x,24)],c,3)
            oval((45,38,84,87),dark,light,2);oval((53,48,76,76),c,white,1);line([(60,54),(68,62),(60,70)],dark,3)
        elif name=='crest':
            poly([(37,28),(64,15),(91,28),(85,79),(64,103),(43,79)],dark,light,2);blade()
        else:
            poly([(25,59),(40,46),(47,32),(81,32),(88,46),(103,59)],dark,c,2)
            poly([(37,43),(64,24),(91,43),(77,41),(64,35),(50,42)],light)
            for x in [40,80]:poly([(x,57),(x+7,57),(x+7,95),(x,95)],c)
            poly([(29,95),(99,95),(109,103),(20,103)],light)
            if name=='womb':oval((53,58,75,86),c,white,2)
    elif name=='wolf':wolf()
    elif name=='snare':
        oval((20,71,110,105),dark,c,2)
        for j in range(5):line([(32+j*15,87),(28+j*15,66),(43+j*11,48),(38+j*13,25)],light if j%2 else c,4)
    elif name in ['hammer','nails','doll']:
        def nail(x,y):poly([(x,y),(x+5,y+3),(x-20,y+40)],light);poly([(x-5,y-4),(x+10,y+1),(x+8,y+6),(x-8,y+1)],c)
        if name=='hammer':
            poly([(37,99),(47,103),(82,44),(73,39)],(126,81,61),light,1);poly([(56,30),(85,43),(94,28),(65,15)],dark,light,2);nail(88,66)
        elif name=='nails':
            for x,y in [(48,23),(76,38),(103,49)]:line([(x-27,y+48),(x-42,y+60)],c,3);nail(x,y)
        else:
            oval((53,23,75,45),light,dark,2);poly([(53,46),(75,46),(81,60),(99,50),(103,60),(80,73),(85,100),(72,106),(64,81),(55,105),(43,98),(48,72),(25,62),(29,51),(48,60)],(188,135,69),light,1)
            for y in [51,59,67,75]:line([(51,y),(77,y+3)],dark,1)
            nail(77,49)
    elif name=='chain':
        for j in range(14):
            a=j*.45;r=18+j*2;x=64+math.cos(a)*r;y=64+math.sin(a)*r
            oval((x-8,y-5,x+8,y+5),dark,light,2);line([(x-4,y-2),(x+3,y-2)],white,1)
    elif name in ['swarm','spirit']:
        for x,y,s in ([(0,0,1)] if name=='spirit' else [(-24,-15,.55),(23,-11,.5),(1,24,.55)]):
            p=lambda q:[(64+(a-64)*s+x,64+(b-64)*s+y)for a,b in q]
            poly(p([(64,17),(79,26),(85,45),(79,61),(95,85),(75,78),(85,109),(60,95),(43,104),(48,78),(27,92),(40,62),(40,43),(49,26)]),dark,c,2)
            poly(p([(44,42),(59,48),(54,55)]),white);poly(p([(66,48),(80,41),(76,55)]),white)
            oval((60+x-3*s,65+y-8*s,60+x+4*s,65+y+7*s),c)
            line(p([(50,73),(62,85),(75,77)]),light,1)
    elif name in ['hand','morph','hands']:
        if name=='hands':hand(-27,-5,.55);hand(28,-8,.6);hand(0,15,.7)
        elif name=='morph':spiral(1,2);hand(17,-6,.7);hand(-12,11,.8)
        else:hand()
    elif name in ['mace','mayhem']:
        if name=='mayhem':spiral(1.2,5)
        poly([(31,105),(40,109),(80,50),(70,44)],(125,79,47),light,1);oval((48,25,99,76),dark,c,2)
        for j in range(7):
            a=j*math.tau/7;x=74+math.cos(a)*24;y=50+math.sin(a)*24;poly([(x-5,y-5),(74+math.cos(a)*36,50+math.sin(a)*36),(x+5,y+5)],light)
        poly([(53,41),(70,30),(89,42),(88,61),(73,72),(56,61)],c,light,1);poly([(70,30),(73,50),(89,42)],light);poly([(73,50),(73,72),(88,61)],dark);oval((63,36,71,43),white)
    elif name in ['rogue','boot','wings']:
        for j in range(4):line([(18,35+j*13),(66-j*6,29+j*13)],light,3)
        poly([(71,24),(90,29),(80,70),(103,81),(109,91),(97,102),(61,92),(53,79)],dark,c,2)
        poly([(68,45),(85,49),(80,69),(63,66)],light)
        if name=='wings':poly([(27,20),(64,42),(56,57),(31,48),(51,44)],c,light,1)
    elif name=='shield':
        poly([(31,32),(64,18),(97,32),(90,78),(64,108),(38,78)],dark,light,3);poly([(41,39),(64,28),(86,39),(79,73),(64,94),(49,73)],c);poly([(64,32),(79,43),(73,70),(64,85)],light);oval((55,51,73,69),dark,white,1)
    # Paint volume into each opaque illustration layer, preserving the ink edges.
    pixels=im.load();grain=random.Random(931+index+sum(map(ord,kind)))
    for yy in range(384):
        for xx in range(384):
            r,g,b,a=pixels[xx,yy]
            if not a:continue
            key=(xx/384+yy/384)/2
            lightfall=max(0,1-math.hypot(xx-142,yy-124)/280)
            brush=math.sin(xx*.045+math.sin(yy*.045)*3)*.045+grain.uniform(-.025,.025)
            shade=.57+(1-key)*.43+lightfall*.25+brush
            pixels[xx,yy]=(min(255,int(r*shade)),min(255,int(g*shade)),min(255,int(b*shade)),a)
    return im.resize((size,size),Image.Resampling.LANCZOS)
def illustrated(kind,i):
    seed=sum(map(ord,kind))*19+i;rng=random.Random(seed);c=rgb(PALETTES[kind]);im=Image.new('RGBA',(384,384));pix=im.load()
    for y in range(384):
        for x in range(384):
            r=math.hypot(x-192,y-192)/184
            if r>1:continue
            glow=max(0,1-math.hypot(x-135,y-130)/260);noise=rng.uniform(-3,3)
            pix[x,y]=tuple(max(0,min(255,int(v*(.09+glow*.24)+noise)))for v in c)+(255,)
    d=ImageDraw.Draw(im)
    for j in range(24):
        a=rng.random()*math.tau;r=rng.uniform(75,165);x=192+math.cos(a)*r;y=192+math.sin(a)*r
        d.line((x,y,x-math.cos(a)*rng.uniform(5,26),y-math.sin(a)*rng.uniform(5,26)),fill=c+(rng.randrange(60,180),),width=rng.randrange(1,4))
    art=motif(kind,i);glow=art.filter(ImageFilter.GaussianBlur(10));im=Image.alpha_composite(im,glow);im=Image.alpha_composite(im,art)
    d=ImageDraw.Draw(im);d.arc((13,13,371,371),190,292,fill=tuple(min(255,v+45)for v in c)+(220,),width=3)
    mask=Image.new('L',(384,384));ImageDraw.Draw(mask).ellipse((9,9,375,375),fill=255);im.putalpha(ImageChops.multiply(im.getchannel('A'),mask))
    return im.resize((128,128),Image.Resampling.LANCZOS)
def generate():
    code="const fs=require('fs'),vm=require('vm'),c={};vm.createContext(c);vm.runInContext(['src/fighters/roster.js','src/fighters/skills.js'].map(p=>fs.readFileSync(p,'utf8')).join('\\n')+';this.skills=SKILLS;',c);console.log(JSON.stringify(c.skills));"
    skills=json.loads(subprocess.check_output(['node','-e',code],cwd=ROOT));out=ROOT/'assets/ui/skills';out.mkdir(parents=True,exist_ok=True);entries=[]
    for kind in PALETTES:
        for i,slot in enumerate(['attack','heavy','guard','dodge','dash'] if kind=='common' else ['special','skill2','ultimate']):
            filename='skill1' if slot=='special' else slot;p=out/kind/(filename+'.png');p.parent.mkdir(exist_ok=True);illustrated(kind,i).save(p,optimize=True)
            sk=skills.get(kind+'_'+slot,{});h=sk.get('hitbox',{})
            entries.append(dict(fighter=kind,slot=slot,skillId=sk.get('id'),label=sk.get('label',slot.upper()),icon=str(p.relative_to(ROOT)),cooldown=sk.get('cooldown',0),staminaCost=sk.get('cost',0),aimType='self' if h.get('type')=='radial' else 'directional' if sk else 'instant'))
    tile=136;atlas=Image.new('RGBA',(tile*8,tile*5))
    for i,e in enumerate(entries):
        x=i%8*tile+4;y=i//8*tile+4;atlas.paste(Image.open(ROOT/e['icon']),(x,y));e['rect']=[x,y,128,128];e['uv']=[x/atlas.width,y/atlas.height,128/atlas.width,128/atlas.height]
    atlas.quantize(colors=256,method=Image.Quantize.FASTOCTREE).save(out/'atlas.png',optimize=True);(out/'manifest.json').write_text(json.dumps(dict(version=1,width=atlas.width,height=atlas.height,gutter=4,icons=entries),indent=2)+'\n')
    sheet=Image.new('RGB',(680,11*168),(16,25,33));d=ImageDraw.Draw(sheet)
    for row,kind in enumerate(k for k in PALETTES if k!='common'):
        d.text((12,row*168+62),{'goblin':'GRINSK','skeleton':'BONEWARDEN'}.get(kind,kind.upper()),fill='#cadbc9')
        for i in range(3):
            a=illustrated(kind,i);sheet.paste(a,(160+i*170,row*168+6),a);e=next(e for e in entries if e['fighter']==kind and e['slot']==['special','skill2','ultimate'][i]);d.text((150+i*170,row*168+138),e['label'][:24],fill='#d7e4da')
    sheet.save(ROOT/'docs/screenshots/moba/skill-contact-sheet.png',optimize=True);print('Generated',len(entries),'original icons and guttered atlas')
if __name__=='__main__':generate()
