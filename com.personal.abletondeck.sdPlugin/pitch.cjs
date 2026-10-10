// Original implementation of YIN's cumulative mean normalized difference.
// de Cheveigne & Kawahara (2002), doi:10.1121/1.1458024.
function detectPitch(samples,rate){
  if(!Number.isFinite(rate)||rate<8000||rate>16000||samples.length<640||samples.length>1400||!samples.every(Number.isFinite))return null;
  const mean=samples.reduce((a,b)=>a+b,0)/samples.length;
  const x=samples.map(v=>v-mean),power=x.reduce((a,b)=>a+b*b,0)/x.length;
  if(power<1e-12)return null;
  const max=Math.min(Math.floor(rate/35),Math.floor(x.length/2)-1),min=Math.max(2,Math.floor(rate/2100));
  const window=x.length-max,delta=new Float64Array(max+1),norm=new Float64Array(max+1);
  let sum=0;
  for(let tau=1;tau<=max;tau++){
    let d=0;for(let j=0;j<window;j++){const e=x[j]-x[j+tau];d+=e*e;}
    delta[tau]=d;sum+=d;norm[tau]=sum?d*tau/sum:1;
  }
  for(let tau=min;tau<max;tau++){
    if(norm[tau]>=0.12)continue;
    while(tau<max&&norm[tau+1]<norm[tau])tau++;
    if(tau===max||norm[tau]>0.12)return null;
    const a=delta[tau-1],b=delta[tau],c=delta[tau+1],den=a-2*b+c;
    const shift=den?Math.max(-.5,Math.min(.5,(a-c)/(2*den))):0;
    const hz=rate/(tau+shift);
    if(hz<39.9||hz>2001)return null;
    const midi=69+12*Math.log2(hz/440),nearest=Math.round(midi);
    return {hz,confidence:1-norm[tau],midi:nearest,note:['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][((nearest%12)+12)%12]+(Math.floor(nearest/12)-1),cents:100*(midi-nearest)};
  }
  return null;
}
class PitchFrames{
  constructor(){this.frames=new Map();}
  receive(values,now=Date.now()){
    const [id,rate,offset,total,...chunk]=values;
    if(!values.every(Number.isFinite)||!Number.isInteger(id)||id<0||id>=1000000||rate<8000||rate>16000||!Number.isInteger(offset)||offset<0||!Number.isInteger(total)||total<640||total>1400||chunk.length<1||chunk.length>600||offset+chunk.length>total)return null;
    for(const [key,frame] of this.frames)if(now-frame.time>350)this.frames.delete(key);
    let frame=this.frames.get(id);
    if(!frame){if(this.frames.size>=3)this.frames.delete(this.frames.keys().next().value);frame={rate,total,time:now,samples:Array(total),received:new Uint8Array(total),count:0};this.frames.set(id,frame);}
    if(frame.rate!==rate||frame.total!==total){this.frames.delete(id);return null;}
    for(let j=0;j<chunk.length;j++){
      const index=offset+j;
      if(frame.received[index]&&frame.samples[index]!==chunk[j]){this.frames.delete(id);return null;}
      if(!frame.received[index]){frame.received[index]=1;frame.count++;frame.samples[index]=chunk[j];}
    }
    if(frame.count!==total)return null;
    this.frames.delete(id);return {rate,samples:frame.samples};
  }
}
module.exports={detectPitch,PitchFrames};
