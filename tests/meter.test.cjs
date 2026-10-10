const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { render, decodeOSC, encodeOSC, fresh } = require('../com.personal.abletondeck.sdPlugin/shared.cjs');
function engine() {
  let clock = 1000;
  const objects = new Map(), output = [];
  const context = vm.createContext({
    post(){}, Date: {now:()=>clock}, arrayfromargs: a=>Array.from(a),
    outlet: (id,v)=>{if(id===0)output.push(v)},
    patcher: {getnamed(name){if(!objects.has(name))objects.set(name,{messages:[],message(...v){this.messages.push(v)}});return objects.get(name)}}
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../Max for Live/yfc-meter.js'),'utf8'),context);
  return {context,objects,output,frame(energy, peak=0.1){clock+=100;context.frame(energy,energy,peak,peak,...Array(8).fill(0.005));return output.at(-1)}};
}
function sineEnergy(coeffs,rate) {
  const state = coeffs.map(()=>[0,0,0,0]);
  let sum=0,count=0;
  for(let n=0;n<rate;n++) {
    let value=0.1*Math.sin(2*Math.PI*1000*n/rate);
    coeffs.forEach((c,j)=>{
      const s=state[j];const y=c[0]*value+c[1]*s[0]+c[2]*s[1]-c[3]*s[2]-c[4]*s[3];
      s[1]=s[0];s[0]=value;s[3]=s[2];s[2]=y;value=y;
    });
    if(n>rate/2){sum+=2*value*value;count++}
  }
  return sum/count;
}
test('K weighted stereo 1 kHz sine is approximately -20 LUFS across sample rates',()=>{
  for(const rate of [44100,48000,96000,192000]) {
    const e=engine();e.context.samplerate(rate);
    const coeffs=['shelf0','hp0'].map(k=>e.objects.get(k).messages.find(m=>m[0]==='list').slice(1));
    assert.ok(Math.abs(e.context.loudness(sineEnergy(coeffs,rate))+20)<0.06,`rate ${rate}`);
    assert.equal(e.objects.get('avg_s').messages[0][0],rate*3);
  }
});
test('momentary, short term, absolute and relative gates and peak reset',()=>{
  const e=engine();e.context.samplerate(48000);
  const energy=Math.pow(10,(-14+0.691)/10);
  for(let j=0;j<40;j++)e.frame(energy);
  let v=e.output.at(-1);
  for(const index of [1,2,3])assert.ok(Math.abs(v[index]+14)<1e-8);
  for(let j=0;j<40;j++)e.frame(energy/1000);
  assert.ok(Math.abs(e.output.at(-1)[3]+14)<1e-8,'relative gate excludes quiet signal');
  for(let j=0;j<40;j++)e.frame(1e-10);
  assert.ok(Math.abs(e.output.at(-1)[3]+14)<1e-8,'absolute gate excludes silence');
  e.frame(energy,1.2); assert.equal(e.output.at(-1)[6],1);
  e.frame(energy,0.1); assert.ok(e.output.at(-1)[5]>0);
  e.context.reset();v=e.frame(energy,0.1);assert.equal(v[6],0);assert.ok(Math.abs(v[5]+20)<1e-8);
});
test('invalid audio frames cannot poison the integrated history',()=>{
  const e=engine();e.frame(0.1);const count=e.output.length;
  e.context.frame(NaN,...Array(11).fill(0.1));assert.equal(e.output.length,count);
});
test('OSC decoding matches Max float packets and rejects truncated data',()=>{
  const base=encodeOSC('/yfc/meter');
  const addr=base.subarray(0,base.length-4);
  const tags=Buffer.from(',ff\0');const numbers=Buffer.alloc(8);numbers.writeFloatBE(-14,0);numbers.writeFloatBE(-1,4);
  assert.deepEqual(decodeOSC(Buffer.concat([addr,tags,numbers])),{address:'/yfc/meter',values:[-14,-1]});
  assert.throws(()=>decodeOSC(Buffer.from('bad')));
  assert.deepEqual(decodeOSC(encodeOSC('/yfc/reset')),{address:'/yfc/reset',values:[]});
});
test('missing connection stays explicit; track names are escaped in SVG',()=>{
  assert.match(render('lufs',{}, {},{audio:false}),/data-idle="disconnected"/);
    assert.doesNotMatch(render('play',{}, {},{live:false}),/data-idle/);
    assert.match(render('play',{}, {},{live:false}),/M7 4L21 12L7 20Z/);
  assert.match(render('solo',{track:{name:'A&B <x>',solo:true}}, {},{live:true}),/A&amp;B &lt;x&gt;/);
  assert.equal(fresh(1000,2000),true);assert.equal(fresh(1000,3000),false);
});
test('Max audio graph has a direct stereo pass through and valid connections',()=>{
  const patch=JSON.parse(fs.readFileSync(path.join(__dirname,'../Max for Live/AbletonDeck Meter.maxpat'),'utf8')).patcher;
  const ids=new Set(patch.boxes.map(b=>b.box.id));
  for(const {patchline:l} of patch.lines){assert.ok(ids.has(l.source[0]));assert.ok(ids.has(l.destination[0]));}
  for(let c=0;c<2;c++)assert.ok(patch.lines.some(({patchline:l})=>l.source[0]==='input'&&l.source[1]===c&&l.destination[0]==='output'&&l.destination[1]===c));
  assert.equal(patch.boxes.find(b=>b.box.id==='reset').box.maxclass,'message');
  const amxd=fs.readFileSync(path.join(__dirname,'../Max for Live/AbletonDeck Meter.amxd'));
  assert.equal(amxd.toString('ascii',0,4),'ampf');assert.equal(amxd.toString('ascii',8,12),'aaaa');
  assert.equal(amxd.readUInt32LE(28),amxd.length-32);
  assert.deepEqual(JSON.parse(amxd.subarray(32,-1).toString()),{patcher:patch});
});
