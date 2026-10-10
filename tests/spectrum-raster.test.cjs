const {test}=require('node:test'),assert=require('node:assert/strict'),zlib=require('node:zlib');
const {SpectrumRaster,rasterSpectrum,sampleCurve,ordinate}=require('../com.personal.abletondeck.sdPlugin/spectrum-raster.cjs');
function decode(uri){const b=Buffer.from(uri.split(',')[1],'base64'),blocks=[];for(let at=8;at<b.length;){const n=b.readUInt32BE(at);if(b.toString('ascii',at+4,at+8)==='IDAT')blocks.push(b.subarray(at+8,at+8+n));at+=n+12;}return zlib.inflateSync(Buffer.concat(blocks));}
test('native PNG tiles stitch pixel-exactly and reduce the spectrum transfer budget',()=>{
 const d={mode:'fft',level:Array.from({length:480},(_,j)=>-48+18*Math.sin(j/17)),peak:Array(480).fill(-24),strongest:{hz:1000,db:-24}};
 const r=new SpectrumRaster(),tiles=r.render(d,'violet',false),pixels=rasterSpectrum(d,'violet',false);
 assert.equal(tiles.length,15);assert.ok(tiles.reduce((n,t)=>n+t.length,0)<40000);
 for(let y=0;y<3;y++)for(let x=0;x<5;x++){
  const raw=decode(tiles[y*5+x]);for(let row=0;row<72;row++)assert.deepEqual(raw.subarray(row*217+1,row*217+217),pixels.subarray(((y*72+row)*360+x*72)*3,((y*72+row)*360+x*72+72)*3));
 }
 assert.equal(r.render(d,'violet',false),tiles,'frozen frames reuse encoded tiles');
 assert.notDeepEqual(r.render(d,'blue',false),tiles);
});
test('raster interpolation preserves calibration and cannot invent spectral overshoot',()=>{
 assert.equal(ordinate(0),20);assert.equal(ordinate(-84),410);
 assert.ok([...sampleCurve(Array(480).fill(-42))].every(y=>Math.abs(y-215)<1e-9));
 const curve=sampleCurve(Array.from({length:480},(_,i)=>i%2?-24:-60));
 assert.ok([...curve].every(y=>y>=ordinate(-24)-1e-9&&y<=ordinate(-60)+1e-9));
});
test('silence stays stable and invisible curve changes do not refresh empty upper keys',()=>{
 const r=new SpectrumRaster(),d={mode:'fft',level:Array(480).fill(-65),peak:Array(480).fill(-65)};
 const a=r.render(d,'orange',false);d.level=d.level.map(v=>v-2);d.peak=[...d.level];
 const b=r.render(d,'orange',false);assert.deepEqual(a.slice(0,10),b.slice(0,10));assert.notDeepEqual(a.slice(10),b.slice(10));
 const silent=r.render(d,'orange',true);d.level.fill(-120);assert.deepEqual(r.render(d,'orange',true),silent);
});
