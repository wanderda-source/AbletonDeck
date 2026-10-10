const {test}=require('node:test'),assert=require('node:assert/strict');
const {LoudnessHistory}=require('../com.personal.abletondeck.sdPlugin/history.cjs');
const {ReactiveFlow}=require('../com.personal.abletondeck.sdPlugin/music-visuals.cjs');
const {render}=require('../com.personal.abletondeck.sdPlugin/shared.cjs');
test('history scrolls through silence and packet gaps, preserving past peaks',()=>{
  const history=new LoudnessHistory();
  history.tick({peak:-5,m:-16},true,1000);
  history.tick({peak:-120,m:-100},true,1250);
  history.tick({},true,1500);
  assert.deepEqual(history.points,[[1000,-16],[1250,-48],[1500,-48]]);
  const meter={history:history.points,historyTime:1500,peak:-120};
  const a=render('vectorscope',{},meter,{audio:true,silent:true,animationTime:1.5});
  const b=render('vectorscope',{},meter,{audio:true,silent:true,animationTime:2});
  assert.notEqual(a,b,'clock shifts past peaks left even with silence');
  assert.match(a,/ 60\.00/,'past -16 LUFS peak remains visible');
  history.tick({},true,32000);assert.deepEqual(history.points,[[32000,-48]]);
});
test('flow follows sound, preserves freeze snapshots and remains bounded',()=>{
  const flow=new ReactiveFlow(),meter={peak:-5,m:-16,bands:Array(8).fill(-25),midPower:.8,sidePower:.2};
  const first=flow.tick(meter,false,1000);
  for(let j=1;j<300;j++)flow.tick(meter,false,1000+j*50);
  assert.notDeepEqual(flow.snapshot(),first);
  for(const p of flow.snapshot().particles){assert.ok(p.x>=8&&p.x<=136);assert.ok(p.y>=8&&p.y<=136);}
  assert.deepEqual(first.particles[0].trail.length,1,'old snapshot is immutable');
  const before=flow.snapshot();const after=flow.tick(meter,true,20000);assert.notDeepEqual(after,before);for(let j=0;j<125;j++)assert.ok(Math.hypot(after.particles[j].x-before.particles[j].x,after.particles[j].y-before.particles[j].y)<.5,'idle drifts slowly');
  const svg=render('reactive',{}, {...meter,flow:before},{audio:true});
  assert.match(svg,/data-style="flow"/);
  const other=new ReactiveFlow();
  for(let j=0;j<300;j++)other.tick({...meter,bands:Array(8).fill(-60),sidePower:0},false,1000+j*50);
  assert.notDeepEqual(other.snapshot(),before,'spectral content and width change the movement');
});
test('all transport icons stay recognizable when feedback is absent',()=>{
  for(const kind of ['play','stop','click','loop','record','arm','mute','solo','scene','tap','undo','redo','reset']){
    const svg=render(kind,{}, {},{live:false,audio:false});
    assert.doesNotMatch(svg,/data-idle/);assert.match(svg,/<g transform=/);
  }
});
