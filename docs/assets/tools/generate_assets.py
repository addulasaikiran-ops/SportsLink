#!/usr/bin/env python3
"""Regenerate the six SPORTSLINK mini-voxel bot SVGs.
Run from repository root: python3 docs/assets/tools/generate_assets.py
Uses Python standard library only. Scene compositions remain hand-editable SVGs.
"""
from pathlib import Path
import html
ROOT = Path(__file__).resolve().parents[1]
BOTS = {
"scout":("#39E7D5","#176B68","#C7FFF5","BINOCULARS · DISCOVER"),
"courier":("#FF6EA8","#873C67","#FFE0ED","ENVELOPE · MESSAGES"),
"referee":("#B49AFF","#59488C","#E7DEFF","SHIELD · AUTH + RLS"),
"recruiter":("#FFD84D","#8A6818","#FFF2B2","CLIPBOARD · OPPORTUNITIES"),
"mechanic":("#FF985C","#914D2A","#FFE0CA","WRENCH · API + CI"),
"pocket":("#8EE36B","#477A35","#E0FFD1","PHONE · ANDROID APK")}
ROWS=["....bbbbbbbb....","...bccccccccb...","..bccddddcccb..",".bccddddddcccb.","bccddddddddcccb","bcceeeccceeeccb","bcceeeccceeeccb","bcccccbbccccccb","..bbccccccccbb..","...bccccccccb...","...bccccccccb...","..bbccccccccbb..","..bccccccccccb..","..bccccccccccb..","..bccccccccccb..","..bbccccccccbb..","...bccccccccb...","...bccccccccb...","....bb....bb....","....bb....bb...."]
ICONS={
"scout":'<rect x="80" y="20" width="9" height="8" fill="none" stroke="{hi}" stroke-width="2"/><rect x="92" y="20" width="9" height="8" fill="none" stroke="{hi}" stroke-width="2"/>',
"courier":'<rect x="82" y="20" width="22" height="15" fill="none" stroke="{hi}" stroke-width="2"/><path d="m83 21 10 8 10-8" fill="none" stroke="{hi}" stroke-width="2"/>',
"referee":'<path d="M92 17l12 5v9q-4 9-12 12-8-3-12-12v-9z" fill="none" stroke="{hi}" stroke-width="2"/>',
"recruiter":'<rect x="84" y="17" width="17" height="25" fill="none" stroke="{hi}" stroke-width="2"/><path d="M87 24h11m-11 5h11m-11 5h7" stroke="{hi}" stroke-width="2"/>',
"mechanic":'<path d="M83 19a9 9 0 0 0 10 11l8 9 4-4-9-8a9 9 0 0 0-10-10l4 5-4 4z" fill="none" stroke="{hi}" stroke-width="2"/>',
"pocket":'<rect x="85" y="15" width="16" height="27" rx="2" fill="none" stroke="{hi}" stroke-width="2"/><path d="M89 19h8m-5 19h3" stroke="{hi}" stroke-width="2"/>'}
def render(name, palette):
 color,dark,hi,caption=palette
 squares=[]
 for y,row in enumerate(ROWS):
  for x,cell in enumerate(row):
   if cell==".": continue
   fill=dark if cell=="b" else color if cell=="c" else "#0b0f14" if cell=="d" else hi
   squares.append(f'<rect x="{x*3+8}" y="{y*3+7}" width="3" height="3" fill="{fill}" stroke="#0b0f14" stroke-opacity=".3" stroke-width=".4"/>')
 title=html.escape(name.title()+" mini-voxel bot")
 icon=ICONS[name].format(hi=hi)
 return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 100" role="img" aria-labelledby="t d"><title id="t">{title}</title><desc id="d">Original {name} robot made from tiny shaded square pixels. {html.escape(caption)}.</desc><defs><style>@keyframes bob{{0%,100%{{transform:translateY(0)}}50%{{transform:translateY(-2px)}}}}@keyframes blink{{0%,92%,100%{{opacity:1}}95%{{opacity:.15}}}}.bot{{animation:bob 1.8s steps(4,end) infinite}}.eye{{animation:blink 3.8s steps(1,end) infinite}}@media(prefers-reduced-motion:reduce){{.bot,.eye{{animation:none}}}}</style></defs><rect width="220" height="100" fill="none"/><g class="bot">{''.join(squares)}<rect x="20" y="22" width="6" height="6" fill="#0b0f14" class="eye"/><rect x="32" y="22" width="6" height="6" fill="#0b0f14" class="eye"/><rect x="22" y="23" width="2" height="2" fill="#fff"/><rect x="34" y="23" width="2" height="2" fill="#fff"/>{icon}</g><text x="111" y="73" fill="{color}" font-family="monospace" font-size="10" font-weight="700">{name.upper()} BOT</text><text x="111" y="87" fill="#A8B4C2" font-family="monospace" font-size="7.2">{html.escape(caption)}</text></svg>'''
def main():
 for name,palette in BOTS.items():
  path=ROOT/"bots"/(name+".svg"); path.parent.mkdir(parents=True,exist_ok=True)
  path.write_text(render(name,palette)+"\n",encoding="utf-8")
 print("Generated 6 bot SVGs in",ROOT/"bots")
if __name__=="__main__": main()
