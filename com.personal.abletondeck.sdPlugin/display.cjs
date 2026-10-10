const DEFAULT_GATE=-60;
const gateThreshold=value=>Number.isFinite(Number(value))?Math.max(-100,Math.min(-20,Number(value))):DEFAULT_GATE;
class DisplayGate{
  constructor(){this.open=false;this.below=null;}
  update(peak,threshold=DEFAULT_GATE,now=Date.now()){
    if(!Number.isFinite(peak)){this.open=false;this.below=null;return true;}
    if(peak>threshold+(this.open?0:3)){this.open=true;this.below=null;}
    else if(this.open&&peak<=threshold){if(this.below===null)this.below=now;if(now-this.below>=150)this.open=false;}
    return !this.open;
  }
}
class TriggerScope{
  constructor(){this.trace=null;this.gain=1;}
  receive(samples,rate,hz){
    if(!samples.length||!samples.every(Number.isFinite)||!Number.isFinite(rate)||rate<=0)return this.trace;
    const peak=Math.max(...samples.map(Math.abs));if(peak<1e-6)return this.trace;
    const level=peak*.08;
    const period=Number.isFinite(hz)&&hz>=40?rate/hz:null;
    const length=period?Math.min(samples.length*.65,period*2):samples.length*.55;
    const limit=Math.floor(samples.length-length-1);
    let start=null;
    for(let j=1;j<=limit;j++)if(samples[j-1]<level&&samples[j]>=level){start=j-1+(level-samples[j-1])/(samples[j]-samples[j-1]);break;}
    if(start===null)return this.trace;
    const desired=Math.min(40,.9/peak);
    this.gain=this.trace?this.gain+(desired-this.gain)*.2:desired;
    const trace=Array.from({length:128},(_,j)=>{
      const position=start+j*length/127,index=Math.floor(position),f=position-index;
      return Math.max(-1,Math.min(1,((samples[index]??0)*(1-f)+(samples[index+1]??0)*f)*this.gain));
    });
    this.trace=trace;return trace;
  }
}
module.exports={DEFAULT_GATE,gateThreshold,DisplayGate,TriggerScope};
