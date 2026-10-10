const PALETTES={
  orange:{name:'Original orange',accent:'#f25623'},
  violet:{name:'Violet',accent:'#9b23f2',stops:['#d34aff','#9b23f2','#6515cf']},
  purple:{name:'Purple',accent:'#da23f2',stops:['#ff45e4','#da23f2','#8f1ad8']},
  green:{name:'Green',accent:'#23f278',stops:['#8aff42','#23f278','#0dbb88']},
  blue:{name:'Blue',accent:'#237cf2',stops:['#35c3ff','#237cf2','#3451d9']},
  red:{name:'Red',accent:'#f22b23',stops:['#ff6433','#f22b23','#c61116']},
  white:{name:'White',accent:'#ffffff',stops:['#ffffff','#dddddd','#aaaaaa']}
};
const THEME_ORDER=Object.keys(PALETTES);
function themeName(value,fallback='orange'){
  // Previous experimental selections keep a valid appearance after the update.
  if(value==='gradient')return 'violet';
  return Object.hasOwn(PALETTES,value)?value:fallback;
}
function resolveTheme(local,global){return themeName(local,themeName(global));}
function nextTheme(value){return THEME_ORDER[(THEME_ORDER.indexOf(themeName(value))+1)%THEME_ORDER.length];}
function applyTheme(svg,name,{visual=false}={}){
  name=themeName(name);
  const palette=PALETTES[name],accent=palette.accent;
  if(palette.stops){
    const stops=palette.stops;
    // Existing spectrum fills retain their opacity envelope; stops gain hue.
    svg=svg.replace(/<stop\b[^>]*stop-color="#f25623"[^>]*\/>/g,stop=>{
      const offset=Number(stop.match(/offset="([\d.]+)"/)?.[1]||0);
      return stop.replace('#f25623',stops[offset>=1?2:offset>=.5?1:0]);
    });
    svg=svg.replace(/(fill|stroke)="#f25623"/g,'$1="url(#ws-accent)"');
    // White numeric glyph fills must never be replaced with gradient paint.
    if(accent!=='#ffffff')svg=svg.replace(new RegExp('(fill|stroke)="'+accent+'"','g'),'$1="url(#ws-accent)"');
    svg=svg.replace(new RegExp('<g\\b[^>]*color="'+accent+'"[^>]*>[\\s\\S]*?<\\/g>','g'),g=>g.replace(/(fill|stroke)="currentColor"/g,'$1="url(#ws-icon)"'));
    if(visual)svg=svg.replace(/stroke="(?:#dedede|#ffffff)"/g,'stroke="url(#ws-accent)"');
    const gradient=(id,height)=>`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${height}"><stop stop-color="${stops[0]}"/><stop offset=".5" stop-color="${stops[1]}"/><stop offset="1" stop-color="${stops[2]}"/></linearGradient>`;
    return svg.replace(/<svg\b[^>]*>/,root=>root+'<defs>'+gradient('ws-accent',144)+gradient('ws-icon',24)+'</defs>');
  }
  svg=svg.replaceAll('#f25623',accent);
  // Only graph strokes change hue. Numeric glyph fills and text stay white.
  if(visual)svg=svg.replace(/stroke="(?:#dedede|#ffffff)"/g,`stroke="${accent}"`);
  return svg;
}
function heatStops(name){
  name=themeName(name);
  if(name==='orange')return [[0,0,0],[46,14,8],[242,86,35],[255,243,230]];
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const [top,mid,bottom]=PALETTES[name].stops.map(rgb);
  return [[0,0,0],bottom.map(c=>Math.round(c*.18)),bottom,mid,top,top.map(c=>Math.round(c*.2+255*.8))];
}
module.exports={PALETTES,THEME_ORDER,themeName,resolveTheme,nextTheme,applyTheme,heatStops};
