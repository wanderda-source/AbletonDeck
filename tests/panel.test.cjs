const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
test('sending heartbeat stays active through silence, then expires without packets',()=>{
  let now=1000;
  const labels=[];
  const graphics=new Proxy({show_text:text=>labels.push(text)},{get:(o,k)=>o[k]||(()=>{})});
  function Task(fn){this.cancel=()=>{};this.repeat=()=>{};}
  const ctx=vm.createContext({mgraphics:graphics,Task,Date:{now:()=>now},Math});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../Max for Live/yfc-panel.js'),'utf8'),ctx);
  ctx.paint();assert.equal(labels.at(-2),'Idle');
  ctx.bang();ctx.paint();assert.equal(labels.at(-2),'Sending');
  for(let i=0;i<100;i++){now+=100;ctx.bang();}
  ctx.paint();assert.equal(labels.at(-2),'Sending');
  now+=801;ctx.paint();assert.equal(labels.at(-2),'Idle');
  ctx.bang();ctx.paint();assert.equal(labels.at(-2),'Sending');
});
test('narrow presentation preserves stereo passthrough and UDP packet path',()=>{
  const p=JSON.parse(fs.readFileSync(path.join(__dirname,'../Max for Live/AbletonDeck Meter.maxpat'),'utf8')).patcher;
  assert.equal(p.devicewidth,150);
  assert.deepEqual(p.boxes.filter(b=>b.box.presentation).map(b=>b.box.id),['status_panel']);
  const links=p.lines.map(l=>JSON.stringify(l.patchline));
  for(const [source,outlet,destination,inlet] of [['input',0,'output',0],['input',1,'output',1],['script',0,'send',0],['script',0,'panel_activity',0],['panel_activity',0,'status_panel',0]]){
    assert.ok(links.includes(JSON.stringify({source:[source,outlet],destination:[destination,inlet]})));
  }
});
