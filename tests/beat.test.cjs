const {test}=require('node:test'),assert=require('node:assert/strict');
const {BeatClock,beatPulse}=require('../com.personal.abletondeck.sdPlugin/beat.cjs');
const {render}=require('../com.personal.abletondeck.sdPlugin/shared.cjs');
test('metronome phase follows tempo, loop jumps and stop/start',()=>{
  const clock=new BeatClock();
  clock.receive({song_time:16,playing:true,tempo:120},1000);
  assert.equal(clock.at(1250),16.5);assert.equal(clock.at(1500),17);
  assert.equal(beatPulse(clock.at(1500)),1);assert.ok(beatPulse(clock.at(1250))<.01);
  clock.receive({song_time:4,playing:true,tempo:60},1600);
  assert.equal(clock.at(2100),4.5);
  clock.receive({song_time:4.5,playing:false,tempo:60},2100);
  assert.equal(clock.at(4000),4.5);
  clock.receive({playing:true,tempo:120},4000);
  assert.equal(clock.at(4250),5,'old script without song_time retains BPM fallback');
});
test('design accent metronome pulses only during playback regardless of audible click',()=>{
 for(const playing of [true,false])for(const metronome of [true,false]){
  const state={playing,metronome,tempo:120};
  const a=render('click',state,{}, {live:true,beat:0}),b=render('click',state,{}, {live:true,beat:.5});
  if(playing){assert.notEqual(a,b);assert.match(a,/data-metronome-pulse="1.000" opacity="1.000"/);}
  else {assert.equal(a,b);assert.match(a,/opacity="0.750"/);}
  assert.match(a,/color="#f25623"/);assert.match(a,/data-value="120.0"/);
 }
 const clock=new BeatClock();clock.receive({song_time:16,playing:true,tempo:120},1000);
 assert.equal(clock.visualAt(1250),16.5);
 clock.receive({song_time:16.5,playing:false,tempo:120},1250);
 assert.equal(clock.visualAt(1500),17);
 clock.receive({song_time:16.5,playing:false,tempo:120},1500);
 assert.equal(clock.visualAt(1750),17.5,'stopped feedback does not reset animation');
 clock.receive({song_time:4,playing:true,tempo:60},2000);
 assert.equal(clock.visualAt(2500),4.5,'playback re-syncs to Live');
});
