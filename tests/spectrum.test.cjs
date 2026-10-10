const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {Spectrum,renderSpectrum,frequency}=require('../com.personal.abletondeck.sdPlugin/spectrum.cjs');
test('panorama uses contiguous logarithmic bands and common gain across all five keys',()=>{
  assert.equal(frequency(0),25);assert.equal(frequency(60),20000);
  for(let j=1;j<60;j++)assert.ok(frequency(j)>frequency(j-1));
  let globalStrokes;
  for(let panel=0;panel<5;panel++){
    const svg=renderSpectrum(panel,{level:Array(60).fill(-36),peak:Array(60).fill(-30)},{connected:true});
    assert.ok(svg.includes(`viewBox="${panel*144} 0 144 144"`));
    const contour=svg.match(/<path data-spectrum="contour"[^>]+>/)[0];
    if(panel===0)globalStrokes=contour;else assert.equal(contour,globalStrokes,'every screen clips the same panorama');
    assert.match(contour,/52.67/);
    assert.doesNotMatch(svg,/<text/);
    assert.doesNotMatch(svg,/NaN|undefined|Infinity/);
  }
});
test('spectrum attack, peak hold, decay and whole-row freeze remain coherent',()=>{
  const s=new Spectrum();assert.equal(s.toggle(1000),false);
  assert.equal(s.receive(Array(60).fill(-30),1000),true);
  for(let now=1000;now<=1400;now+=50)s.tick(now);
  assert.ok(s.level[0]>-31);const high=s.peak[0];
  assert.equal(s.toggle(1400),true);const frozen=[...s.snapshot().level];
  s.receive(Array(60).fill(-80),1400);s.tick(1500);
  assert.deepEqual(s.snapshot().level,frozen);assert.equal(s.peak[0],high);
  s.tick(2000);assert.ok(s.peak[0]<high);
  s.toggle(2100);assert.ok(s.snapshot().level[0]<frozen[0]);
  assert.equal(s.receive(Array(59).fill(-30),2200),false);
  assert.equal(s.receive([...Array(59).fill(-30),NaN],2200),false);
  s.tick(4000);assert.equal(s.toggle(4000),false);
});
test('Max filters peak at their expected frequencies and transmit valid stereo powers',()=>{
  const objects=new Map(),output=[];
  const context=vm.createContext({post(){},Date:{now:()=>1000},arrayfromargs:a=>Array.from(a),outlet:(i,v)=>{if(i===0)output.push(v)},
    patcher:{getnamed(name){if(!objects.has(name))objects.set(name,{messages:[],message(...args){this.messages.push(args)}});return objects.get(name)}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../Max for Live/yfc-meter.js'),'utf8'),context);
  function response(coeffs,f,rate){
    const w=2*Math.PI*f/rate,[b0,b1,b2,a1,a2]=coeffs;
    return ((b0+b1*Math.cos(w)+b2*Math.cos(2*w))**2+(b1*Math.sin(w)+b2*Math.sin(2*w))**2)/((1+a1*Math.cos(w)+a2*Math.cos(2*w))**2+(a1*Math.sin(w)+a2*Math.sin(2*w))**2);
  }
  for(const rate of [44100,48000,96000,192000]){
    context.samplerate(rate);
    for(const index of [0,10,25,40,59]){
      const f=frequency(index+0.5),coeffs=objects.get('pan'+index+'_0').messages.at(-1).slice(1);
      assert.ok(Math.abs(response(coeffs,f,rate)-1)<1e-7);
      assert.ok(response(coeffs,f/2,rate)<0.02);
      assert.deepEqual(coeffs,objects.get('pan'+index+'_1').messages.at(-1).slice(1));
    }
    assert.equal(objects.get('pan_avg0').messages.at(-1)[0],Math.round(rate*.08));
  }
  context.spectrum(...Array(60).fill(0.01));
  assert.equal(output.at(-1).length,61);assert.equal(output.at(-1)[0],'/yfc/spectrum');
  assert.ok(Math.abs(output.at(-1)[1]+20)<1e-9);
  const count=output.length;context.spectrum(...Array(59).fill(0.01),-1);assert.equal(output.length,count);
  const p=JSON.parse(fs.readFileSync(path.join(__dirname,'../Max for Live/AbletonDeck Meter.maxpat'),'utf8')).patcher;
  assert.equal(p.boxes.some(b=>b.box.id==='panorama_trigger'),false,'new Max device uses FFT instead of the legacy filter bank');
});
