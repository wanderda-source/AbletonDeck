const fs=require('node:fs'),path=require('node:path');
const {render}=require('../com.personal.abletondeck.sdPlugin/shared.cjs');
const {renderSpectrum}=require('../com.personal.abletondeck.sdPlugin/spectrum.cjs');
const sharp=require(process.env.SHARP_PATH||'sharp');
const scope={windowMs:20,samples:[],envelope:[]};
for(let j=0;j<128;j++)scope.samples.push([Math.sin(j/8)*.5,Math.sin(j/8+.6)*.5]);scope.trail=scope.samples;
for(let j=0;j<64;j++){
 const a=Math.sin(j/3)*.45,b=Math.cos(j/3)*.4;
 scope.envelope.push([a-.03,a+.03,b-.03,b+.03]);
}
const {TriggerScope}=require('../com.personal.abletondeck.sdPlugin/display.cjs');
const triggerWave=new TriggerScope().receive(Array.from({length:1080},(_,j)=>.3*Math.sin(2*Math.PI*55*j/12000)),12000,55);
const now=Date.now();
const meter={triggerWave,pitch:{hz:55,note:'A1',cents:14},historyTime:now,history:Array.from({length:121},(_,j)=>[now-30000+j*250,-28+8*Math.sin(j/14)+3*Math.sin(j/3)]),scope,midPower:.75,sidePower:.25,m:-12.4,s:-13.2,i:-14.1,peak:-1.2,hold:-.8,bands:[-44,-25,-20,-30,-35,-41,-46,-58]};
const level=Array.from({length:60},(_,j)=>-58+28*Math.exp(-(((j-13)/11)**2))+18*Math.exp(-(((j-36)/16)**2))+3*Math.sin(j*1.3));
const {StereoFFT}=require('../com.personal.abletondeck.sdPlugin/fft.cjs');
const samples=new Float64Array(16384*2);
for(let j=0;j<16384;j++){
 let v=0;for(let k=1;k<=45;k++)v+=.15/Math.pow(k,1.2)*Math.sin(2*Math.PI*(55*k+k*k*.35)*j/48000+k*.6);
 samples[j*2]=v;samples[j*2+1]=v*.8;
}
const result=new StereoFFT().analyze(samples,48000);
const spectrum={mode:'fft',strongest:result.peak,level:result.values,peak:result.values.map(v=>v+2)};
const {Spectrogram}=require('../com.personal.abletondeck.sdPlugin/spectrogram.cjs');
const sg=new Spectrogram();
for(let i=0;i<64;i++){const values=Array.from({length:480},(_,j)=>{const hz=20*Math.pow(1000,j/479);let db=-120;for(let k=1;k<=24;k++)db=Math.max(db,-24-12*Math.log2(k)-Math.pow(Math.log2(hz/(110*k))/.022,2)*6+6*Math.sin(i/7+k));return db;});sg.receive(values,1000+i*125);sg.tick(1000+i*125);}
meter.spectrogram=sg.snapshot();
const state={playing:false,loop:true,tempo:120};
const kinds=['spectrum1','spectrum2','spectrum3','spectrum4','spectrum5','midside','waveform','goniometer','spectrogram','lufs','peak','pitch','reactive','loop','reset'];
let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1060" height="728"><rect width="1060" height="728" fill="#000000"/><text x="30" y="40" fill="#ffffff" font-family="Arial" font-size="22">ABLETONDECK · 0.3.15</text><text x="30" y="67" fill="#777777" font-family="Arial" font-size="14">Пример на синтетических данных</text>';
kinds.forEach((kind,j)=>{
 const x=30+(j%5)*202,y=96+Math.floor(j/5)*202;
 const image=kind.startsWith('spectrum')?renderSpectrum(Number(kind.at(-1))-1,spectrum,{connected:true}):render(kind,state,meter,{live:true,audio:true,spectrum:true,pitch:true,scope:true,stereo:true,animationTime:kind==='vectorscope'?now/1000:1,theme:kind==='goniometer'?'blue':'orange',mode:'s',target:-14});
 svg+=`<rect x="${x-3}" y="${y-3}" width="187" height="187" rx="10" fill="none" stroke="#191919"/><g transform="translate(${x},${y}) scale(1.25)">${image}</g>`;
});svg+='</svg>';
fs.writeFileSync(path.join(__dirname,'../design-preview.svg'),svg);
sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,'../design-preview.png')).catch(e=>{console.error(e);process.exitCode=1});
