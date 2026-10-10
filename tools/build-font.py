import json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

root=Path(__file__).resolve().parents[1]
font=instantiateVariableFont(TTFont(root/'fonts'/'SpaceGrotesk.ttf'), {'wght':500})
glyphset=font.getGlyphSet()
cmap=font.getBestCmap()
glyphs={}
for code in list(range(32,127))+[0x2212,0x221e,0x2014]:
    name=cmap.get(code)
    if name is None:
        continue
    pen=SVGPathPen(glyphset)
    glyphset[name].draw(pen)
    glyphs[chr(code)]={'path':pen.getCommands(),'advance':font['hmtx'].metrics[name][0]}
(root/'com.personal.abletondeck.sdPlugin'/'font-glyphs.json').write_text(json.dumps({'units':font['head'].unitsPerEm,'glyphs':glyphs},separators=(',',':')),encoding='utf-8')
print('Generated Space Grotesk Medium outlines')
