"""Original procedural artwork and geometric ZOLNU icon; no remote asset dependency."""
from PIL import Image, ImageDraw, ImageFilter
import math, random
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'assets'
root.mkdir(exist_ok=True)
W,H=1100,870
def gradient(top,bottom):
 im=Image.new('RGB',(W,H)); d=ImageDraw.Draw(im)
 for y in range(H):
  t=y/(H-1); c=tuple(int(a+(b-a)*t) for a,b in zip(top,bottom)); d.line((0,y,W,y),fill=c)
 return im
im=gradient((48,27,71),(218,128,116)); d=ImageDraw.Draw(im)
d.ellipse((680,85,860,265),fill=(255,222,184))
for k,c in enumerate([(121,70,121),(100,56,104),(68,42,78),(37,29,52)]):
 points=[(x,int(405+k*106+70*math.sin(x/260+k*1.4))) for x in range(-10,W+11,6)]
 d.polygon(points+[(W,H),(0,H)],fill=c)
 for n in range(8):
  line=[(x,int(405+k*106+70*math.sin(x/260+k*1.4)+n*8+2)) for x in range(0,W,4)]
  d.line(line,fill=tuple(min(255,v+6) for v in c),width=1)
im.save(root/'dunes.png',optimize=True)
im=gradient((18,30,38),(49,69,64)); d=ImageDraw.Draw(im)
random.seed(42)
for _ in range(220):
 x,y=random.randrange(W),random.randrange(H); r=random.choice([1,1,2]); d.ellipse((x-r,y-r,x+r,y+r),fill=(145,163,145))
d.ellipse((290,175,810,695),fill=(179,198,154))
for x in range(290,810,3):
 dx=(x-550)/260; extent=math.sqrt(max(0,1-dx*dx))*260
 d.line((x,435-extent,x,435+extent),fill=(int(101+80*(x-290)/520),int(129+65*(x-290)/520),int(114+37*(x-290)/520)),width=2)
for offset in [0,4]: d.arc((100,290+offset,1000,580+offset),0,180,fill=(225,213,166),width=3)
im=im.rotate(-22, resample=Image.Resampling.BICUBIC, expand=False, fillcolor=(21,35,41)); im.save(root/'orbit.png',optimize=True)
im=gradient((40,22,59),(84,48,85)); d=ImageDraw.Draw(im)
for ring in range(18,0,-1):
 r=ring*23; color=(int(120+ring*4),int(78+ring*5),int(123+ring*4))
 for n in range(8):
  a=math.tau*n/8+ring*.14; cx=550+math.cos(a)*r*.55; cy=435+math.sin(a)*r*.55
  d.ellipse((cx-r*.4,cy-r*.4,cx+r*.4,cy+r*.4),outline=color,width=4)
d.ellipse((510,395,590,475),fill=(236,213,173)); im.save(root/'bloom.png',optimize=True)
icon=Image.new('RGB',(1024,1024),(12,12,16)); d=ImageDraw.Draw(icon)
d.rounded_rectangle((160,160,864,864),radius=215,fill=(185,160,255))
d.polygon([(320,335),(710,335),(710,410),(440,630),(710,630),(710,700),(315,700),(315,625),(585,410),(320,410)],fill=(24,17,35))
d.polygon([(761,228),(781,278),(831,298),(781,318),(761,368),(741,318),(691,298),(741,278)],fill=(211,251,162))
icon.save(root/'icon.png'); icon.resize((64,64),Image.Resampling.LANCZOS).save(root/'favicon.png')
adaptive=Image.new('RGBA',(1024,1024),(0,0,0,0)); adaptive.paste(icon.resize((700,700),Image.Resampling.LANCZOS),(162,162)); adaptive.save(root/'adaptive-icon.png')
print('Created 3 artworks and app icons.')
