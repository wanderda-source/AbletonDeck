const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {detectPitch,PitchFrames}=require('../com.personal.abletondeck.sdPlugin/pitch.cjs');
const {render,decodeOSC}=require('../com.personal.abletondeck.sdPlugin/shared.cjs');
test('pitch tracks bass and higher monophonic tones at bounded cent error',()=>{
  for(const rate of [11025,12000])for(const hz of [40,55,82.4069,110,220,440,880,1000,1800]){
    const p=detectPitch(Array.from({length:Math.floor(rate*.09)},(_,j)=>.3*Math.sin(2*Math.PI*hz*j/rate)+.05*Math.sin(4*Math.PI*hz*j/rate)),rate);
    assert.ok(p,`${hz} Hz at ${rate}`);assert.ok(Math.abs(1200*Math.log2(p.hz/hz))<8,`${hz}: got ${p.hz}`);
  }
  const p=detectPitch(Array.from({length:1080},(_,j)=>.3*Math.sin(2*Math.PI*55*j/12000)),12000);
  assert.equal(p.note,'A1');assert.ok(Math.abs(p.cents)<1);
});
test('pitch rejects silence, DC, noise and malformed windows',()=>{
  assert.equal(detectPitch(Array(1080).fill(0),12000),null);
  assert.equal(detectPitch(Array(1080).fill(.1),12000),null);
  let seed=123;const noise=Array.from({length:1080},()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32-.5;});
  assert.equal(detectPitch(noise,12000),null);
  assert.equal(detectPitch([...noise.slice(0,-1),NaN],12000),null);
  assert.equal(detectPitch(noise,0),null);
});
test('Max longer buffer capture preserves anti-phase pitch and bounds UDP payload',()=>{
  for(const rate of [44100,48000,96000,192000]){
    const size=Math.round(rate*.1),left=Array.from({length:size},(_,j)=>.4*Math.sin(2*Math.PI*110*j/rate)),right=left.map(v=>-v),messages=[];
    const context=vm.createContext({post(){},Date:{now:()=>1000},arrayfromargs:a=>Array.from(a),outlet:(i,v)=>{if(i===0)messages.push(Array.from(v));},
      Buffer:function(){this.framecount=()=>size;this.channelcount=()=>2;this.peek=(c,start,n)=>(c===1?left:right).slice(start,start+n);},
      patcher:{getnamed(){return {message(){}};}}});
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../Max for Live/yfc-meter.js'),'utf8'),context);
    context.samplerate(rate);context.pitchcapture(.03);
    const frames=new PitchFrames();let complete;
    for(const [address,...values] of messages.reverse()){
      assert.equal(address,'/yfc/pitchchunk');assert.ok(values.length*5+32<5096,'Max default udpsend limit');
      complete=frames.receive(values,1000)||complete;
    }
    assert.ok(complete);assert.ok(Math.abs(detectPitch(complete.samples,complete.rate).hz-110)<.2);
  }
});
test('pitch chunks tolerate reordering and duplicates, reject gaps and inconsistent headers',()=>{
  const frames=new PitchFrames();
  const a=[1,12000,0,1080,...Array(600).fill(.1)],b=[1,12000,600,1080,...Array(480).fill(.2)];
  assert.equal(frames.receive(b,1000),null);assert.equal(frames.receive(b,1001),null);
  assert.equal(frames.receive(a,1002).samples.length,1080);
  assert.equal(frames.receive([2,...a.slice(1)],2000),null);
  assert.equal(frames.receive([2,...b.slice(1)],2400),null,'expired first chunk cannot form a frame');
  assert.equal(frames.receive([3,...a.slice(1)],3000),null);
  assert.equal(frames.receive([3,11025,...b.slice(2)],3001),null,'sample rates cannot mix');
  assert.equal(frames.receive([4,12000,900,1080,...Array(600).fill(1)],4000),null);
});
test('Max emits the long trigger window on every 25 ms scope tick',()=>{
  const size=4800,left=Array.from({length:size},(_,j)=>.4*Math.sin(2*Math.PI*110*j/48000)),messages=[];
  let clock=1000;
  const context=vm.createContext({post(){},Date:{now:()=>clock},arrayfromargs:a=>Array.from(a),outlet:(i,v)=>{if(i===0)messages.push(Array.from(v));},
    Buffer:function(){this.framecount=()=>size;this.channelcount=()=>2;this.peek=(c,start,n)=>left.slice(start,start+n);},
    patcher:{getnamed(){return {message(){}};}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../Max for Live/yfc-meter.js'),'utf8'),context);
  context.samplerate(48000);
  for(let j=0;j<4;j++){clock=1000+j*25;context.scope(.03+j*.25);}
  assert.equal(messages.filter(v=>v[0]==='/yfc/pitchchunk').length,8);
  assert.equal(messages.filter(v=>v[0]==='/yfc/scope').length,4);
});
test('compatibility with the old Max device recovers only its known capped pitch window',()=>{
  const string=s=>{const b=Buffer.from(s+'\0');return Buffer.concat([b,Buffer.alloc((4-b.length%4)%4)]);};
  const values=[12000,...Array.from({length:1080},(_,j)=>.3*Math.sin(2*Math.PI*55*j/12000))];
  const floats=Buffer.alloc(values.length*4);values.forEach((v,j)=>floats.writeFloatBE(v,j*4));
  const packet=Buffer.concat([string('/yfc/pitchbuffer'),string(','+'f'.repeat(values.length)),floats]).subarray(0,5096);
  assert.throws(()=>decodeOSC(packet));
  const [rate,...samples]=decodeOSC(packet,{allowLegacyPitchPrefix:true}).values;
  assert.ok(samples.length>=640&&samples.length<1080);
  assert.equal(detectPitch(samples,rate).note,'A1');
  assert.throws(()=>decodeOSC(packet.subarray(0,4000),{allowLegacyPitchPrefix:true}));
});
test('reactive geometry responds to sound and keeps visible idle motion',()=>{
  const meter={peak:-5,m:-16,bands:Array(8).fill(-30),midPower:.8,sidePower:.2};
  const opts={audio:true,animationTime:1};
  const a=render('reactive',{},meter,opts),b=render('reactive',{},meter,{...opts,animationTime:2});
  assert.notEqual(a,b);assert.match(a,/data-reactive/);
  const silent={...meter,peak:-120};
  assert.notEqual(render('reactive',{},silent,opts),render('reactive',{},silent,{...opts,animationTime:2}));assert.match(render('reactive',{},silent,opts),/<circle /);
  assert.match(render('pitch',{}, {pitch:{hz:55,note:'A1',cents:0},peak:-5},{audio:true,pitch:true}),/data-value="55.0"/);
});
