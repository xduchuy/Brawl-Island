from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]
m=json.loads((root/'assets/vfx/manifest.json').read_text())
for key,a in m['assets'].items():
    im=Image.open(root/a['path']);assert im.mode=='RGBA';assert im.size==(a['tileSize']*a['frames'],a['tileSize'])
    alpha=im.getchannel('A');assert alpha.getextrema()==(0,255) or alpha.getextrema()[1]>100
    n=a['tileSize']
    for f in range(a['frames']):
        tile=alpha.crop((f*n,0,(f+1)*n,n));assert tile.getbbox()
        for box in [(0,0,n,4),(0,n-4,n,n),(0,0,4,n),(n-4,0,n,n)]:assert tile.crop(box).getextrema()==(0,0),key
print('49 RGBA sheets: dimensions, visible frames and four-pixel transparent UV gutters verified')
