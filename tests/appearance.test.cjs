const {test}=require('node:test'),assert=require('node:assert/strict');
const {resolveTheme,applyTheme,THEME_ORDER}=require('../com.personal.abletondeck.sdPlugin/themes.cjs');
const {renderDue,intervalFor,nativeImage}=require('../com.personal.abletondeck.sdPlugin/performance.cjs');
const {renderReactive,ReactiveFlow}=require('../com.personal.abletondeck.sdPlugin/music-visuals.cjs');
const {Spectrogram}=require('../com.personal.abletondeck.sdPlugin/spectrogram.cjs');
test('global colours respect fixed key overrides and preserve white numeric glyphs',()=>{
  assert.equal(resolveTheme('global','green'),'green');assert.equal(resolveTheme('red','green'),'red');assert.equal(resolveTheme('garbage','blue'),'blue');
  for(const theme of THEME_ORDER){
    const svg=applyTheme('<path stroke="#ffffff"/><path fill="#f25623"/><g data-value="-14.0" fill="#ffffff"/>',theme,{visual:true});
    assert.match(svg,/data-value="-14.0" fill="#ffffff"/);assert.match(svg,/stroke="(?:#[0-9a-f]{6}|url\(#ws-accent\))"/);
  }
});
test('economy bounds per-action frames while preserving fast smooth scope and native key dimensions',()=>{
  for(const kind of ['waveform','spectrum1','reactive','lufs','play']){
    const counts=['smooth','economy'].map(mode=>{const e={kind};let n=0;for(let t=0;t<1000;t+=25)if(renderDue(e,t,mode))n++;return n;});
    assert.ok(counts[1]<counts[0]);assert.ok(counts[0]<=1000/intervalFor(kind));
  }
  assert.equal(intervalFor('waveform'),25);
  assert.match(nativeImage('<svg width="144" height="144" viewBox="288 0 144 144">'),/width="72" height="72" viewBox="288 0 144 144"/);
});
test('economy draws fewer particle segments without changing the flow simulation',()=>{
  const flow=new ReactiveFlow();for(let t=1000;t<1500;t+=50)flow.tick({peak:-12,m:-20},false,t);
  const meter={peak:-12,flow:flow.snapshot()},before=JSON.stringify(meter);
  const smooth=renderReactive(meter),eco=renderReactive(meter,{performance:'economy'});
  assert.equal((smooth.match(/<circle/g)||[]).length,125);assert.equal((eco.match(/<circle/g)||[]).length,63);
  assert.ok(eco.length<smooth.length*.6);assert.equal(JSON.stringify(meter),before);
});
test('spectrogram caches each palette and keeps frozen historical data immutable',()=>{
  const s=new Spectrogram();s.receive(Array(480).fill(-30),1000);s.tick(1000,false,true);
  const violet=s.snapshot('violet'),green=s.snapshot('green');assert.notEqual(violet.png,green.png);assert.equal(s.snapshot('violet'),violet);
  const history=JSON.stringify(violet.columns);s.tick(1250,true,true);assert.equal(JSON.stringify(violet.columns),history);
});
