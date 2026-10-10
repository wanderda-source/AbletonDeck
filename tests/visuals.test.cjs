const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {midSideBalance,stereoPoint,scopeFromValues,render}=require('../com.personal.abletondeck.sdPlugin/shared.cjs');
test('orthonormal Mid/Side conserves energy and distinguishes mono from opposite polarity',()=>{
  for(const [l,r] of [[0.4,0.4],[0.4,-0.4],[0.4,0],[-0.2,0.8]]){
    const [s,m]=stereoPoint(l,r);
    assert.ok(Math.abs(m*m+s*s-l*l-r*r)<1e-12);
  }
  assert.equal(stereoPoint(1,1)[0],0);assert.ok(Math.abs(stereoPoint(1,1)[1]-Math.SQRT2)<1e-12);
  assert.equal(stereoPoint(1,-1)[1],0);
  assert.equal(midSideBalance(1,0).mid,100);
  assert.equal(midSideBalance(0,1).side,100);
  assert.equal(midSideBalance(1,1).mid,50);
  assert.equal(midSideBalance(0,0),null);
  assert.equal(midSideBalance(-1,1),null);
});
test('circular stereo capture wraps, preserves transients and emits a bounded visual packet',()=>{
  const size=4800,left=Array(size).fill(0),right=Array(size).fill(0),messages=[];
  // position 0.1 -> end 352; capture begins at 4192, wrapping at 4800.
  left[4193]=0.9;right[4193]=-0.8;
  const objects=new Map();
  const context=vm.createContext({post(){},Date:{now:()=>1000},arrayfromargs:a=>Array.from(a),
    outlet:(i,v)=>{if(i===0)messages.push(v)},
    Buffer:function(){this.framecount=()=>size;this.channelcount=()=>2;
      this.peek=(channel,start,count)=>(channel===1?left:right).slice(start,start+count)},
    patcher:{getnamed(name){if(!objects.has(name))objects.set(name,{message(){}});return objects.get(name)}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../Max for Live/yfc-meter.js'),'utf8'),context);
  context.samplerate(48000);context.scope(0.1);
  const packet=Array.from(messages.at(-1));
  assert.equal(packet[0],'/yfc/scope');assert.equal(packet.length,514);
  const scope=scopeFromValues(packet.slice(1));
  assert.equal(scope.windowMs,20);assert.equal(scope.samples.length,128);assert.equal(scope.envelope.length,64);
  assert.equal(scope.envelope[0][1],0.9);assert.equal(scope.envelope[0][2],-0.8);
  assert.ok(!scope.samples.some(([l])=>l===0.9),'transient lies between decimated points');
  for(const kind of ['waveform','vectorscope','goniometer']){
    const svg=render(kind,{}, {scope},{scope:true,audio:true});
    assert.doesNotMatch(svg,/NaN|Infinity|undefined/);assert.doesNotMatch(svg,/<text/);
  }
  const bad=packet.slice(1);bad[257]=1;bad[258]=-1;
  assert.equal(scopeFromValues(bad),null);
  assert.equal(scopeFromValues([20,NaN]),null);
  const previous=messages.length;left[4193]=NaN;context.scope(0.1);assert.equal(messages.length,previous);
});
test('Max graph measures both raw channels and connects scope recording and scheduler',()=>{
  const p=JSON.parse(fs.readFileSync(path.join(__dirname,'../Max for Live/AbletonDeck Meter.maxpat'),'utf8')).patcher;
  const box=id=>p.boxes.find(b=>b.box.id===id).box;
  assert.equal(box('ms_mid').text,'+~');assert.equal(box('ms_side').text,'-~');
  assert.match(box('scope_record').text,/@loop 1/);
  for(const dest of ['ms_mid','ms_side','scope_record'])for(let c=0;c<2;c++)
    assert.ok(p.lines.some(({patchline:l})=>l.source[0]==='input'&&l.source[1]===c&&l.destination[0]===dest&&l.destination[1]===c));
  assert.equal(box('scope_clock').text,'qmetro 25');
  assert.equal(box('scope_clock').varname,'scope_clock');
});
test('combined waveform retains opposite-polarity channel extrema; silence has no text',()=>{
  const scope={samples:[[0.5,-0.5]],envelope:Array(64).fill([0.5,0.5,-0.5,-0.5])};
  const svg=render('waveform',{}, {scope},{scope:true});
  assert.equal([...svg.matchAll(/data-wave="combined"/g)].length,64);
  assert.match(svg,/18.90V125.10/);
  const silent={scope:{samples:[[0,0]],envelope:Array(64).fill([0,0,0,0])}};
  assert.match(render('waveform',{},silent,{scope:true}),/M8 72H136/);
  assert.doesNotMatch(render('waveform',{},silent,{scope:true}),/data-idle/);
  assert.doesNotMatch(render('waveform',{}, {},{scope:false}),/<text/);
});
test('silent numeric displays read zero without modifying accumulated measurements',()=>{
  const meter={peak:-120,hold:-0.5,m:-120,s:-90,i:-14,clip:1,midPower:0,sidePower:0};
  const original=JSON.stringify(meter);
  for(const mode of ['m','s','i']){
    const svg=render('lufs',{},meter,{audio:true,mode,target:-14});
    assert.match(svg,/data-value="0.0"/);assert.doesNotMatch(svg,/data-idle|fill="#f25623"/);
  }
  assert.equal([...render('peak',{},meter,{audio:true}).matchAll(/data-value="0.0"/g)].length,2);
  assert.equal([...render('midside',{},meter,{audio:true,stereo:true}).matchAll(/data-value="0.0"/g)].length,2);
  assert.equal(JSON.stringify(meter),original);
  assert.match(render('lufs',{}, {...meter,peak:-95,s:-95},{audio:true,mode:'s',gateDb:-100}),/data-value="-95.0"/);
});
test('loudness history uses audio feedback without requiring waveform packets',()=>{
  const svg=render('vectorscope',{}, {historyTime:31000,history:[[1000,-48],[16000,-24],[31000,0]]},{audio:true,scope:false,animationTime:31});
  assert.match(svg,/data-history="true"/);
  assert.match(svg,/M12.00 124.00/);
  assert.match(svg,/132.00 28.00/);
});
