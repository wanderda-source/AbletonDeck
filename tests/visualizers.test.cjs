const {test}=require('node:test'),assert=require('node:assert/strict');
const {ReactiveFlow,renderReactive}=require('../com.personal.abletondeck.sdPlugin/music-visuals.cjs');
test('four styles retain a frozen frame, react to audio, and drift during silence',()=>{
  const flow=new ReactiveFlow();flow.tick({peak:-120},true,1000);
  const first=flow.snapshot();flow.tick({peak:-120},true,2000);const quiet=flow.snapshot();
  flow.tick({peak:-8,m:-12,bands:Array(8).fill(-15)},false,2100);const active=flow.snapshot();
  const images=[];
  for(const visualStyle of ['particles','ribbon','field','mesh']){
    const opts={visualStyle,silent:true};
    const image=renderReactive({flow:first},opts);images.push(image);
    assert.notEqual(image,renderReactive({flow:quiet},opts),`${visualStyle} drifts in silence`);
    assert.notEqual(image,renderReactive({peak:-8,flow:active},{visualStyle}),`${visualStyle} reacts`);
    assert.equal(image,renderReactive({flow:first},opts),`${visualStyle} frozen snapshot stays unchanged`);
    assert.doesNotMatch(image,/NaN|Infinity/);
  }
  assert.equal(new Set(images).size,4);
  assert.equal(renderReactive({flow:first}),renderReactive({flow:first},{visualStyle:'particles'}));
  assert.equal(renderReactive({flow:first},{visualStyle:'unknown'}),renderReactive({flow:first}));
});
test('economy lowers new curved geometry without changing the enlarged field',()=>{
  const flow=new ReactiveFlow();flow.tick({peak:-10,m:-18},false,1000);
  for(const visualStyle of ['ribbon','mesh']){
    const meter={peak:-10,flow:flow.snapshot()};
    assert.ok(renderReactive(meter,{visualStyle,performance:'economy'}).length<renderReactive(meter,{visualStyle}).length);
  }
  assert.equal((renderReactive({flow:flow.snapshot()},{visualStyle:'field'}).match(/<path/g)||[]).length,49);
});
