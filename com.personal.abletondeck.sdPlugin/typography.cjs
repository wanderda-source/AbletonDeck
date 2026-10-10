const {units,glyphs}=require('./font-glyphs.json');
function numericText(value,y,size=38,{x=12,align='start',maxWidth=114,color='#ffffff'}={}){
 const text=String(value),items=Array.from(text).map(c=>glyphs[c]||glyphs['?']);
 const width=items.reduce((sum,g)=>sum+g.advance,0),scale=Math.min(size/units,maxWidth/width);
 const offset=align==='middle'?x-width*scale/2:align==='end'?x-width*scale:x;
 let cursor=0;
 const paths=items.map(g=>{const result=`<path transform="translate(${cursor} 0)" d="${g.path}"/>`;cursor+=g.advance;return result}).join('');
 const safe=text.replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));
 return `<g data-value="${safe}" fill="${color}" transform="translate(${offset.toFixed(3)} ${y}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})">${paths}</g>`;
}
module.exports={numericText};
