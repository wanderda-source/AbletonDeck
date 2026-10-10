const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../com.personal.abletondeck.sdPlugin');
const {render}=require(path.join(root,'shared.cjs'));
const {renderSpectrum,isSpectrum}=require(path.join(root,'spectrum.cjs'));
const state={tempo:120,track:{name:'',can_arm:true}},scope={windowMs:20,envelope:[],samples:[],trail:[]};
for(let j=0;j<64;j++)scope.envelope.push([-Math.sin(j/6)*.3,Math.sin(j/6)*.3,-.3,.3].map((v,i,a)=>i%2?Math.max(a[i-1],v):Math.min(v,a[i+1])));
for(let j=0;j<128;j++)scope.samples.push([Math.sin(j/8)*.5,Math.sin(j/8+.6)*.5]);scope.trail=scope.samples;
const meter={pitch:{hz:55,note:'A1',cents:0},midPower:.75,sidePower:.25,m:-16,s:-16,i:-16,peak:-5,hold:-5,bands:[-60,-40,-24,-32,-36,-44,-50,-58],scope};
const {Spectrogram}=require('../com.personal.abletondeck.sdPlugin/spectrogram.cjs');
const sg=new Spectrogram();
for(let i=0;i<64;i++){const values=Array.from({length:480},(_,j)=>{const hz=20*Math.pow(1000,j/479);let db=-120;for(let k=1;k<=24;k++)db=Math.max(db,-24-12*Math.log2(k)-Math.pow(Math.log2(hz/(110*k))/.022,2)*6+6*Math.sin(i/7+k));return db;});sg.receive(values,1000+i*125);sg.tick(1000+i*125);}
meter.spectrogram=sg.snapshot();
for(const action of JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))).Actions){
 const kind=action.UUID.split('.').at(-1);
 const image=isSpectrum(kind)?renderSpectrum(Number(kind.at(-1))-1,{mode:'fft',level:Array.from({length:480},(_,j)=>-57+27*Math.sin(j/480*Math.PI)),peak:Array(480).fill(-120)},{connected:true}):render(kind,state,meter,{audio:true,live:true,spectrum:true,pitch:true,stereo:true,scope:true,animationTime:1,theme:'orange',target:-14});
 fs.writeFileSync(path.join(root,'images',kind+'.svg'),image);
}
