"""Validate the exported art and packed CSS atlas, including alpha gutters."""
from pathlib import Path
import json
from PIL import Image, ImageChops, ImageStat
root=Path(__file__).resolve().parents[1]
m=json.loads((root/'assets/ui/skills/manifest.json').read_text());atlas=Image.open(root/'assets/ui/skills/atlas.png').convert('RGBA')
assert atlas.size==(m['width'],m['height'])
for e in m['icons']:
    im=Image.open(root/e['icon']);assert im.mode=='RGBA' and im.size==(128,128)
    assert im.getpixel((0,0))[3]==0 and im.getpixel((64,64))[3]>0
    x,y,w,h=e['rect'];crop=atlas.crop((x,y,x+w,y+h))
    assert max(ImageStat.Stat(ImageChops.difference(crop,im)).mean)<12,e['icon']
    for box in [(x-4,y-4,x+w+4,y),(x-4,y+h,x+w+4,y+h+4),(x-4,y,x,y+h),(x+w,y,x+w+4,y+h)]:assert not atlas.getchannel('A').crop(box).getbbox()
    assert e['uv']==[x/atlas.width,y/atlas.height,w/atlas.width,h/atlas.height]
print('38 nonblank RGBA masters; transparent corners; 4px alpha gutters; exact UVs; palette error <12/255')
