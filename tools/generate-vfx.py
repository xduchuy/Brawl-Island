"""Original pixel-stylized RGBA flipbooks. Seeded; no downloaded artwork."""
from pathlib import Path
import json, random, math, subprocess
from PIL import Image, ImageDraw
import importlib.util
spec=importlib.util.spec_from_file_location("skill_art",Path(__file__).with_name("generate-skill-icons.py"));art=importlib.util.module_from_spec(spec);spec.loader.exec_module(art)
ROOT=Path(__file__).resolve().parents[1]
code="const fs=require('fs'),vm=require('vm'),c={};vm.createContext(c);vm.runInContext(['src/fighters/roster.js','src/fighters/skills.js'].map(p=>fs.readFileSync(p,'utf8')).join('\\n')+';this.skills=SKILLS;this.profiles=FIGHTER_PROFILES;',c);console.log(JSON.stringify({skills:c.skills,profiles:c.profiles}));"
data=json.loads(subprocess.check_output(['node','-e',code],cwd=ROOT))
N=96; FRAMES=8; rng=random.Random(8249)
manifest={'version':1,'assets':{},'skills':{}}
def rgba(c,a=255):return tuple(int(c[i:i+2],16) for i in (1,3,5))+(int(a),)
def sheet(key,shape,color='#e9f5e1'):
    out=Image.new('RGBA',(N*FRAMES,N))
    kind,slot=key.split('/')
    kind={'grinsk':'goblin','bonewarden':'skeleton'}.get(kind,kind)
    signature=art.motif(kind,['special','skill2','ultimate'].index(slot),72) if kind!='common' else None
    for f in range(FRAMES):
        im=Image.new('RGBA',(N,N));d=ImageDraw.Draw(im);t=(f+1)/FRAMES;alpha=255*(1-t*.78);c=rgba(color,alpha);white=(255,250,234,int(alpha));r=12+t*28
        if shape in ('slash','trail','blade'):
            box=(10,13,85,81);d.arc(box,195-f*7,330-f*7,fill=c,width=max(2,9-f));d.arc((15,18,80,76),190-f*7,315-f*7,fill=white,width=2)
            for i in range(6):
                x=20+i*9;y=70-int(27*math.sin(i*.4));d.line((x,y,x-8,y+9),fill=c,width=2)
        elif shape in ('beam','line','nail'):
            y=48;w=17 if shape=='beam' else 5;d.polygon([(5,y-w//2),(70,y-w),(89,y),(70,y+w),(5,y+w//2)],fill=(28,14,48,int(alpha)));d.polygon([(7,y-w//3),(70,y-w+4),(88,y),(70,y+w-4),(7,y+w//3)],fill=c);d.line((9,48,84,48),fill=white,width=3)
            for i in range(5):d.line((12+i*12,38,20+i*12,41),fill=c,width=2)
        elif shape in ('lightning','echo','spark','parry'):
            for i in range(8 if shape!='lightning' else 4):
                a=i*math.tau/(8 if shape!='lightning' else 4)+f*.04
                pts=[(48,48)]
                for j in range(1,5):
                    rr=r*j/4;aa=a+(-1 if j%2 else 1)*.15;pts.append((48+math.cos(aa)*rr,48+math.sin(aa)*rr))
                d.line(pts,fill=(24,13,32,int(alpha)),width=8);d.line(pts,fill=c,width=4);d.line(pts,fill=white,width=1)
            d.polygon([(48,35),(52,44),(62,48),(52,52),(48,61),(44,52),(34,48),(44,44)],fill=white)
        elif shape in ('smoke','dust','explosion'):
            for i in range(12):
                a=i*2.4;rr=(8+i%4)*t*2;x=48+math.cos(a)*rr;y=48+math.sin(a)*rr;s=8+i%5+t*4
                d.ellipse((x-s,y-s,x+s,y+s),fill=rgba(color,alpha*(.45+i%3*.15)))
                d.line((x-s/2,y-s/2,x+s/2,y-s/2),fill=rgba(color,alpha*.8),width=2)
        elif shape in ('dog','spirit'):
            d.polygon([(17,67),(25,48),(29,23),(40,38),(57,35),(72,21),(71,49),(81,65),(64,78),(33,78)],fill=c)
            d.polygon([(29,49),(42,52),(40,57),(28,54)],fill=white);d.polygon([(55,52),(69,48),(69,54),(56,57)],fill=white)
            d.polygon([(43,64),(56,64),(49,71)],fill=(24,23,38,int(alpha)))
            for i in range(4):d.line((20+i*15,76,15+i*15,84),fill=c,width=2)
        elif shape=='cracks':
            rr=36*t
            for i in range(7):
                a=i*.9;pts=[(48,48)]
                for j in range(1,5):pts.append((48+math.cos(a+(j%2)*.16)*rr*j/4,48+math.sin(a+(j%2)*.16)*rr*j/4))
                d.line(pts,fill=c,width=2);x,y=pts[2];d.line((x,y,x+math.sin(a)*9,y+math.cos(a)*9),fill=c,width=1)
        elif shape=='soul':
            d.polygon([(18,72),(22,33),(32,22),(40,39),(46,15),(54,38),(64,21),(72,29),(75,72),(50,83)],fill=c)
            for i in range(4):d.line((28+i*10,46,28+i*10,65),fill=(30,55,57,int(alpha)),width=2)
            d.line((22,67,70,67),fill=white,width=2)
        else:
            # Rune rings, vortex, aura and shields have broken edges and asymmetric glyphs.
            for j in range(3):
                rr=r-j*6
                if rr<3:continue
                for i in range(6):d.arc((48-rr,48-rr,48+rr,48+rr),i*60+f*8,i*60+f*8+45,fill=white if j==1 else c,width=2+j%2)
            for i in range(8):
                a=i*math.tau/8+f*.12;x=48+math.cos(a)*(r-4);y=48+math.sin(a)*(r-4)
                d.rectangle((x-2,y-2,x+2,y+2),fill=c)
            if shape in ('domain','gravity','aura'):
                for i in range(5):
                    a=i*1.24+f*.2;d.line((48+math.cos(a)*8,48+math.sin(a)*8,48+math.cos(a+.7)*r,48+math.sin(a+.7)*r),fill=c,width=2)
        if signature:
            # Each ability carries its own silhouette, animating from compressed startup
            # through full impact to dissipating fragments (rather than tint-only reuse).
            scale=.48+math.sin(t*math.pi*.85)*.52
            icon=signature.resize((int(72*scale),int(72*scale)),Image.Resampling.LANCZOS)
            icon.putalpha(icon.getchannel('A').point(lambda a:int(a*(1-t*.65))))
            im.alpha_composite(icon,((N-icon.width)//2,(N-icon.height)//2))
            if slot=='ultimate':
                for j in range(5):
                    a=j*math.tau/5+f*.16;rr=15+f*3
                    x=48+math.cos(a)*rr;y=48+math.sin(a)*rr
                    d.line((x,y,x+math.cos(a)*6,y+math.sin(a)*6),fill=white,width=2)
        # Four transparent texels around every tile prevent adjacent-frame bleed.
        im.paste((0,0,0,0),(0,0,96,4));im.paste((0,0,0,0),(0,92,96,96));im.paste((0,0,0,0),(0,0,4,96));im.paste((0,0,0,0),(92,0,96,96))
        out.paste(im,(f*N,0))
    path=ROOT/'assets/vfx'/f'{key}.png';path.parent.mkdir(parents=True,exist_ok=True);out.quantize(colors=256,method=Image.Quantize.FASTOCTREE).convert('RGBA').save(path,optimize=True) if signature else out.save(path,optimize=True)
    manifest['assets'][key]={'path':str(path.relative_to(ROOT)),'frames':FRAMES,'columns':FRAMES,'fps':18,'tileSize':N,'shape':shape,'color':color,'blend':'normal' if shape in ('dust','smoke','dog','spirit','beam','lightning','echo','slash','blade','soul') else 'additive'}
common={'slash_arc':'slash','hit_spark':'spark','impact_burst':'explosion','shockwave':'ring','dash_trail':'trail','dust_sheet':'dust','block_impact':'shield','parry_flash':'parry','lightning':'lightning','smoke_sheet':'smoke','magic_particle':'aura','ground_cracks':'cracks','explosion_sheet':'explosion','summon':'spirit','aura':'aura','domain_field':'domain'}
for name,shape in common.items():sheet('common/'+name,shape)
shapes={'yuji':['echo','lightning','lightning'],'gojo':['ring','gravity','beam'],'sukuna':['slash','slash','domain'],'megumi':['dog','domain','domain'],'nobara':['spark','nail','explosion'],'toji':['blade','line','blade'],'kenjaku':['spirit','gravity','domain'],'geto':['gravity','spirit','beam'],'mahito':['soul','soul','domain'],'goblin':['explosion','trail','explosion'],'skeleton':['shield','blade','domain']}
for kind,p in data['profiles'].items():
    folder={'goblin':'grinsk','skeleton':'bonewarden'}.get(kind,kind)
    for i,slot in enumerate(['special','skill2','ultimate']):sheet(folder+'/'+slot,shapes[kind][i],'#c28aff' if kind=='gojo' and slot=='ultimate' else '#ff5264' if kind=='gojo' and slot=='special' else p[1])
for id,s in data['skills'].items():
    kind=s['fighter'];slot=s['category'];folder={'goblin':'grinsk','skeleton':'bonewarden'}.get(kind,kind)
    key=folder+'/'+slot if slot in ['special','skill2','ultimate'] else 'common/slash_arc'
    manifest['skills'][id]={'asset':key,'startup':key if slot in ['special','skill2','ultimate'] else 'common/aura','impact':key if slot in ['special','skill2','ultimate'] else 'common/hit_spark','recovery':key,'recoveryDuration':s['recoveryFrames']/60,'scale':4 if slot=='ultimate' else 2,'ground':s['hitbox']['type'] in ['radial','field'],'duration':.6 if slot!='ultimate' else 1.3}
(ROOT/'assets/vfx/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Generated',len(manifest['assets']),'RGBA flipbooks;',len(manifest['skills']),'skill bindings')
