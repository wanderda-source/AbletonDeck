const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {StereoFFT,FFTFrames,POINTS,frequency}=require('../com.personal.abletondeck.sdPlugin/fft.cjs');
const {Spectrum,renderSpectrum}=require('../com.personal.abletondeck.sdPlugin/spectrum.cjs');
const tone=(n,rate,hz,amplitude=.1,polarity=1)=>Float64Array.from({length:n*2},(_,j)=>amplitude*Math.sin(2*Math.PI*hz*Math.floor(j/2)/rate)*(j%2?polarity:1));
test('FFT is calibrated for coherent tones and tracks off-bin tones across sample rates',()=>{
  const fft=new StereoFFT();
  for(const rate of [44100,48000,96000,192000]){
    const n=2**Math.ceil(Math.log2(rate*.34));
    const exact=fft.analyze(tone(n,rate,100*rate/n),rate);
    assert.ok(Math.abs(exact.peak.db+20)<1e-7,'Hann coherent amplitude calibration');
    for(const hz of [25,55,1000,10007,19000]){
      const result=fft.analyze(tone(n,rate,hz),rate);
      assert.ok(Math.abs(result.peak.hz-hz)<.12,`${rate}, ${hz}: ${result.peak.hz}`);
      assert.ok(Math.abs(result.peak.db+20)<.35,`${hz}: ${result.peak.db}`);
      assert.equal(result.values.length,POINTS);assert.ok(result.binHz<=3);
      assert.ok(result.windowMs>=340&&result.windowMs<400);
    }
  }
});
test('stereo FFT retains anti-phase content, channel power and rejects bad inputs',()=>{
  const fft=new StereoFFT(),n=16384,rate=48000;
  const normal=fft.analyze(tone(n,rate,1000),rate),opposite=fft.analyze(tone(n,rate,1000,.1,-1),rate);
  assert.ok(Math.abs(normal.peak.db-opposite.peak.db)<1e-8);
  const one=tone(n,rate,1000);for(let j=1;j<one.length;j+=2)one[j]=0;
  assert.ok(Math.abs(fft.analyze(one,rate).peak.db-normal.peak.db+3.01029995664)<1e-7);
  const quiet=fft.analyze(new Float64Array(n*2),rate);assert.equal(quiet.peak,null);assert.ok(quiet.values.every(v=>v===-120));
  const bad=tone(n,rate,1000);bad[100]=NaN;assert.equal(fft.analyze(bad,rate),null);
});
test('FFT resolves close low-frequency peaks without turning the curve into 60 broad bands',()=>{
  const n=16384,rate=48000,samples=tone(n,rate,150);
  for(let j=0;j<n;j++)samples[j*2]+= .08*Math.sin(2*Math.PI*160*j/rate),samples[j*2+1]=samples[j*2];
  const a=new StereoFFT().analyze(samples,rate);
  const maximum=(lo,hi)=>Math.max(...a.values.filter((v,j)=>frequency(j)>=lo&&frequency(j)<=hi));
  assert.ok(maximum(147,153)>-22);assert.ok(maximum(157,163)>-24);
  assert.ok(maximum(175,190)<-40);
});
test('Max sends a complete bounded stereo window, assembly tolerates reorder and gaps',()=>{
  const rate=48000,size=19200,left=Array.from({length:size},(_,j)=>.1*Math.sin(2*Math.PI*1000*j/rate)),messages=[];
  const context=vm.createContext({post(){},arrayfromargs:a=>Array.from(a),outlet:(i,v)=>{if(i===0)messages.push(Array.from(v));},
    Buffer:function(){this.framecount=()=>size;this.channelcount=()=>2;this.peek=(c,start,n)=>left.slice(start,start+n).map(v=>c===1?v:-v);},
    patcher:{getnamed(){return {message(){}};}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../Max for Live/yfc-meter.js'),'utf8'),context);
  context.samplerate(rate);context.fftcapture(.03);
  assert.equal(messages.length,55);const frames=new FFTFrames();let complete;
  for(const [address,...values] of messages.reverse()){
    assert.equal(address,'/yfc/fftchunk2');assert.ok(32+values.length*5<5096);
    complete=frames.receive(values.slice(1),1000,values[0])||complete;
  }
  assert.equal(complete.samples.length,32768);
  assert.ok(Math.abs(new StereoFFT().analyze(complete.samples,complete.rate).peak.hz-1000)<.12);
  assert.equal(frames.receive(messages[0].slice(2),1100,messages[0][1]),null,'completed duplicates cannot replay');
  const incomplete=new FFTFrames();incomplete.receive(messages[0].slice(2),1000,messages[0][1]);
  for(const message of messages.slice(1))assert.equal(incomplete.receive(message.slice(2),1800,message[1]),null,'expired first packet never completes');
});
test('new projects and reloaded meters restart immediately; late old sessions cannot replace them',()=>{
  const frames=new FFTFrames();
  const feed=(id,now,session=null)=>{
    let result=null;
    for(let offset=0;offset<16384;offset+=600)result=frames.receive([id,48000,offset,8192,...Array(Math.min(600,16384-offset)).fill(.1)],now,session)||result;
    return result;
  };
  assert.ok(feed(1000,1000,100));
  assert.ok(feed(1,1100,200),'new session starts even without a quiet interval');
  assert.equal(feed(1001,1150,100),null,'late packets from the previous device are ignored');
  assert.ok(feed(2,1200,200));
  assert.ok(feed(1,2200),'old device without a session works after a project-loading gap');
  assert.ok(feed(1000,2300));
  assert.ok(feed(1,3300),'legacy sequence restarts after inactivity');
});
test('Max recovers a buffer handle created before the new project buffer is ready',()=>{
  const size=19200,data=Array.from({length:size},(_,j)=>.1*Math.sin(2*Math.PI*1000*j/48000)),messages=[],allocation=[];
  let ready=false;
  const context=vm.createContext({post(){},Date:{now:()=>1000},arrayfromargs:a=>Array.from(a),outlet:(i,v)=>{if(i===0)messages.push(Array.from(v));},
    Buffer:function(){const bound=ready;this.framecount=()=>bound?size:0;this.channelcount=()=>bound?2:0;this.peek=(c,start,n)=>data.slice(start,start+n);},
    patcher:{getnamed(name){return {message(...args){if(name==='scope_buffer')allocation.push(args);}};}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../Max for Live/yfc-meter.js'),'utf8'),context);
  context.samplerate(48000);assert.equal(context.scopeBuffer.framecount(),0);
  ready=true;context.scope(.5);
  assert.equal(context.scopeBuffer.framecount(),19200);
  assert.ok(allocation.some(a=>a[0]==='setsize'&&a[1]===400&&a[2]===2));
  assert.ok(messages.some(a=>a[0]==='/yfc/scope'));assert.equal(messages.filter(a=>a[0]==='/yfc/fftchunk2').length,55);
});
test('precise spectrum has a fixed scale, frequency axis and a shared freeze snapshot',()=>{
  const fft=new StereoFFT().analyze(tone(16384,48000,1000),48000),s=new Spectrum();
  assert.ok(s.receive(fft.values,1000,fft));for(let now=1000;now<=1600;now+=50)s.tick(now);
  assert.ok(s.toggle(1600));const frozen=s.snapshot();
  s.receive(Array(POINTS).fill(-90),1700,{mode:'fft'});s.tick(1800);assert.equal(s.snapshot(),frozen);
  let peakMarkers=0;
  for(let panel=0;panel<5;panel++){
    const svg=renderSpectrum(panel,frozen,{connected:true});
    assert.match(svg,/<text/);assert.doesNotMatch(svg,/NaN|Infinity|undefined/);
    if(svg.includes('frequency-peak')){peakMarkers++;assert.match(svg,/1000 Hz/);}
  }
  assert.equal(peakMarkers,1);
});
