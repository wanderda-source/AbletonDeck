// Wall-clock history keeps scrolling even when Max suspends audio processing.
class LoudnessHistory {
  constructor(){this.points=[];this.last=0;}
  tick(meter,hasAudio,now=Date.now(),gate=-60){
    if(!hasAudio)return this.points;
    this.points=this.points.filter(([t])=>now-t<=30000);
    if(!this.last||now-this.last>=250){
      const audible=Number.isFinite(meter.peak)&&meter.peak>gate;
      this.points.push([now,audible&&Number.isFinite(meter.m)?meter.m:-48]);
      this.last=now;
    }
    return this.points;
  }
}
module.exports={LoudnessHistory};
