// Interpolate between Live's transport updates, re-anchor on loops/seeks/tempo changes.
class BeatClock {
  constructor(){this.position=0;this.time=0;this.playing=false;this.tempo=120;this.pulsePosition=0;this.pulseTime=Date.now();}
  at(now=Date.now()){
    return this.position+(this.playing?Math.max(0,now-this.time)/1000*this.tempo/60:0);
  }
  visualAt(now=Date.now()){return this.pulsePosition+Math.max(0,now-this.pulseTime)/1000*this.tempo/60;}
  receive(state,now=Date.now()){
    const visual=this.visualAt(now);
    const projected=this.time?this.at(now):0;
    this.position=Number.isFinite(state.song_time)?state.song_time:projected;
    this.time=now;this.playing=!!state.playing;
    this.pulsePosition=this.playing?this.position:visual;this.pulseTime=now;
    this.tempo=Number.isFinite(state.tempo)&&state.tempo>0?state.tempo:120;
  }
}
function beatPulse(position){const phase=((position%1)+1)%1;return Math.exp(-phase*10);}
module.exports={BeatClock,beatPulse};
