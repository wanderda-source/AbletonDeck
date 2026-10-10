const {test}=require('node:test'),assert=require('node:assert/strict');
const {DisplayGate,TriggerScope}=require('../com.personal.abletondeck.sdPlugin/display.cjs');
const {render}=require('../com.personal.abletondeck.sdPlugin/shared.cjs');
const {renderSpectrum}=require('../com.personal.abletondeck.sdPlugin/spectrum.cjs');
test('display gate suppresses noise, uses hysteresis and closes after a short hold',()=>{
  const gate=new DisplayGate();
  assert.equal(gate.update(-70,-60,1000),true);
  assert.equal(gate.update(-59,-60,1100),true);
  assert.equal(gate.update(-55,-60,1200),false);
  assert.equal(gate.update(-59,-60,1300),false);
  assert.equal(gate.update(-70,-60,1400),false);
  assert.equal(gate.update(-70,-60,1551),true);
  assert.equal(gate.update(-59,-60,1600),true);
  assert.equal(gate.update(-20,-60,1700),false);
  assert.equal(gate.update(NaN,-60,1800),true);
});
test('trigger aligns periodic waveforms with different capture phases',()=>{
  const osc=new TriggerScope(),rate=12000,hz=110;
  const a=osc.receive(Array.from({length:1080},(_,j)=>.3*Math.sin(2*Math.PI*hz*j/rate+.2)),rate,hz);
  const b=osc.receive(Array.from({length:1080},(_,j)=>.3*Math.sin(2*Math.PI*hz*j/rate+2.5)),rate,hz);
  assert.ok(a&&b);assert.ok(Math.max(...a.map((v,j)=>Math.abs(v-b[j])))<.002);
  assert.equal(osc.receive(Array(1080).fill(.2),rate,hz),b,'no rising trigger retains the previous trace');
  const scope={samples:[[.3,-.3]],envelope:Array(64).fill([-.3,.3,-.3,.3])};
  const svg=render('waveform',{}, {scope,triggerWave:b,peak:-10},{scope:true});
  assert.match(svg,/data-wave="triggered"/);assert.doesNotMatch(svg,/data-wave="combined"/);
});
test('noise below the display gate yields stable zero displays and graphs',()=>{
  const opts={audio:true,scope:true,stereo:true,pitch:true,gateDb:-60,silent:true};
  const a={peak:-70,m:-80,s:-90,i:-20,hold:-1,midPower:.00001,sidePower:.00002,bands:Array(8).fill(-80),pitch:{hz:55,note:'A1',cents:14}};
  const b={...a,peak:-85,m:-100,s:-110,midPower:.00002,sidePower:.00001};
  for(const kind of ['lufs','peak','midside','waveform','goniometer','vectorscope','pitch','reactive','bands']){
    assert.equal(render(kind,{},a,opts),render(kind,{},b,opts),kind+' stays fixed');
    assert.doesNotMatch(render(kind,{},a,opts),/data-idle|data-value="−∞"/);
  }
  assert.match(render('lufs',{},a,opts),/data-value="0.0"/);
  assert.match(renderSpectrum(0,{level:Array(60).fill(-80),peak:Array(60).fill(-10)},{connected:true,silent:true}),/data-spectrum="silence"/);
});
test('detune scale is centered, spans both signs, and remains inside the key',()=>{
  for(const cents of [-50,0,50]){
    const svg=render('pitch',{}, {peak:-10,pitch:{hz:440,note:'A4',cents}},{audio:true,pitch:true});
    assert.match(svg,/data-detune="scale" d="M18 81H126"/);
    assert.match(svg,new RegExp(`data-pitch="A4" d="M${(72+cents*1.08).toFixed(2)} 76`));
  }
});
