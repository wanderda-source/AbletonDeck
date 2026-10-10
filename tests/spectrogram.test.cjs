const {test}=require('node:test'),assert=require('node:assert/strict'),zlib=require('node:zlib');
const {Spectrogram,SIZE}=require('../com.personal.abletondeck.sdPlugin/spectrogram.cjs');
const {render}=require('../com.personal.abletondeck.sdPlugin/shared.cjs');
function pixels(frame){const b=Buffer.from(frame.png,'base64');let at=8,data=[];while(at<b.length){const n=b.readUInt32BE(at);if(b.toString('ascii',at+4,at+8)==='IDAT')data.push(b.subarray(at+8,at+8+n));at+=n+12;}return zlib.inflateSync(Buffer.concat(data));}
test('spectrogram places bass below treble, newest data right, and emits valid PNG pixels',()=>{
 const s=new Spectrogram(),values=Array(480).fill(-120);values[0]=-12;s.receive(values,1000);const a=s.tick(1000),raw=pixels(a);
 const pixel=(x,y)=>raw.subarray(y*(1+SIZE*3)+1+x*3,y*(1+SIZE*3)+4+x*3);
 assert.deepEqual([...pixel(63,63)],[255,243,230]);assert.deepEqual([...pixel(63,0)],[0,0,0]);assert.deepEqual([...pixel(62,63)],[0,0,0]);
 assert.match(render('spectrogram',{}, {spectrogram:a},{spectrum:true,audio:true}),/data-spectrogram="true"/);
 assert.equal(values[0],-12);assert.equal(values[1],-120);
});
test('spectrogram scrolls through silence and gaps; freeze snapshots stay immutable',()=>{
 const s=new Spectrogram();s.receive(Array(480).fill(-20),1000);const frozen=s.tick(1000),saved=frozen.png;
 s.tick(1125,true);assert.equal(s.columns[62][0],-20);assert.equal(s.columns[63][0],-120);
 s.tick(1250,true);assert.equal(s.columns[61][0],-20);assert.equal(frozen.png,saved);assert.notEqual(s.snapshot().png,saved);
 s.tick(10000);assert.ok(s.columns.every(c=>c.every(v=>v===-120)),'stale audio never paints a fake sustained band');
 assert.equal(s.receive([NaN],11000),false);
});
test('oscilloscope retains a visible zero line in silence',()=>{
 assert.match(render('waveform',{}, {peak:-120},{scope:true,audio:true}),/M8 72H136" stroke="#777777"/);
});
