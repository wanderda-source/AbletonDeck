const fs=require('node:fs'),path=require('node:path');
const {render,scopeFromValues}=require('../com.personal.abletondeck.sdPlugin/shared.cjs');
const sharp=require(process.env.SHARP_PATH || 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const raw=Array.from({length:960},(_,j)=>{
  const m=0.34*Math.sin(2*Math.PI*220*j/48000)+0.10*Math.sin(2*Math.PI*880*j/48000);
  const s=0.21*Math.sin(2*Math.PI*330*j/48000);
  return [(m+s)/Math.SQRT2,(m-s)/Math.SQRT2];
});
const samples=Array.from({length:128},(_,j)=>raw[Math.floor(j*960/128)]).flat();
const envelope=Array.from({length:64},(_,j)=>{
  const chunk=raw.slice(j*15,(j+1)*15),l=chunk.map(p=>p[0]),r=chunk.map(p=>p[1]);
  return [Math.min(...l),Math.max(...l),Math.min(...r),Math.max(...r)];
}).flat();
const scope=scopeFromValues([20,...samples,...envelope]);scope.trail=scope.samples;
const midPower=raw.reduce((sum,[l,r])=>sum+(l+r)**2/2,0)/960;
const sidePower=raw.reduce((sum,[l,r])=>sum+(l-r)**2/2,0)/960;
const m={scope,midPower,sidePower};
const kinds=['midside','waveform','vectorscope','goniometer'];
const captions=['Энергия Mid и Side','Осциллограмма L / R','Облако стереоточек','Линия стереосигнала'];
let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="390"><rect width="1040" height="390" rx="24" fill="#000000"/><text x="32" y="43" font-family="Arial" font-size="26" font-weight="bold" fill="#eef3f8">ABLETON DECK / AUDIO VISUALS</text><text x="32" y="73" font-family="Arial" font-size="15" fill="#8c9daf">Пример на синтетическом сигнале · кнопки показаны крупнее реальных</text>';
kinds.forEach((kind,j)=>{
  const x=32+j*250;
  svg+=`<g transform="translate(${x},102) scale(1.5)">${render(kind,{},m,{audio:true,stereo:true,scope:true,theme:kind==='goniometer'?'blue':'orange'})}</g>`;
  svg+=`<text x="${x+108}" y="348" text-anchor="middle" font-family="Arial" font-size="16" fill="#d4dce5">${captions[j]}</text>`;
});svg+='</svg>';
fs.writeFileSync(path.join(__dirname,'../preview.svg'),svg);
sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,'../preview.png')).catch(e=>{console.error(e);process.exitCode=1});
