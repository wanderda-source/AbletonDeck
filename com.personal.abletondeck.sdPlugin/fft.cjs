const POINTS=480,MIN_HZ=20,MAX_HZ=20000;
const frequency=(index)=>MIN_HZ*Math.pow(MAX_HZ/MIN_HZ,(index+.5)/POINTS);
const db=power=>Math.max(-120,10*Math.log10(Math.max(1e-12,power)));
class FFTFrames {
  constructor(){this.frames=new Map();this.completed=null;this.session=null;this.retired=new Set();this.lastPacket=0;}
  receive(values,now=Date.now(),session=null){
    const [id,rate,offset,total,...chunk]=values;
    if(!values.every(Number.isFinite)||!Number.isInteger(id)||id<0||id>=1000000||rate<22050||rate>192000||!Number.isInteger(total)||total<8192||total>65536||(total&(total-1))||!Number.isInteger(offset)||offset<0||offset%2||chunk.length<2||chunk.length>600||chunk.length%2||offset+chunk.length>total*2)return null;
    if(session!==null&&(!Number.isInteger(session)||session<1||session>16777215))return null;
    // Older devices have no session identifier: let their sequence restart after a gap.
    if(this.lastPacket&&now-this.lastPacket>750){this.frames.clear();this.completed=null;this.session=null;this.retired.clear();}
    if(session!==this.session){
      if(this.retired.has(session))return null;
      if(this.session!==null)this.retired.add(this.session);
      if(this.retired.size>8)this.retired.delete(this.retired.values().next().value);
      this.frames.clear();this.completed=null;this.session=session;
    }
    this.lastPacket=now;
    if(this.completed!==null){const delta=(id-this.completed+1000000)%1000000;if(delta===0||delta>500000)return null;}
    for(const [key,frame] of this.frames)if(now-frame.time>750)this.frames.delete(key);
    let frame=this.frames.get(id);
    if(!frame){if(this.frames.size>=2)this.frames.delete(this.frames.keys().next().value);frame={rate,total,time:now,samples:new Float64Array(total*2),received:new Uint8Array(total*2),count:0};this.frames.set(id,frame);}
    if(frame.rate!==rate||frame.total!==total){this.frames.delete(id);return null;}
    for(let j=0;j<chunk.length;j++){
      const index=offset+j;
      if(frame.received[index]&&frame.samples[index]!==chunk[j]){this.frames.delete(id);return null;}
      if(!frame.received[index]){frame.received[index]=1;frame.count++;frame.samples[index]=chunk[j];}
    }
    if(frame.count!==total*2)return null;
    this.frames.delete(id);this.completed=id;return {rate,samples:frame.samples};
  }
}
class StereoFFT {
  analyze(samples,rate){
    const n=samples.length/2;
    if(!Number.isInteger(n)||n<8192||n>65536||(n&(n-1))||!Number.isFinite(rate)||rate<22050||rate>192000||!samples.every(Number.isFinite))return null;
    if(this.n!==n){
      this.n=n;this.re=new Float64Array(n);this.im=new Float64Array(n);this.window=new Float64Array(n);this.sum=0;
      for(let j=0;j<n;j++){this.window[j]=.5-.5*Math.cos(2*Math.PI*j/n);this.sum+=this.window[j];}
    }
    const re=this.re,im=this.im;let meanL=0,meanR=0;
    for(let j=0;j<n;j++){meanL+=samples[j*2];meanR+=samples[j*2+1];}meanL/=n;meanR/=n;
    // Two real stereo channels packed in one complex transform, never summed.
    for(let j=0;j<n;j++){re[j]=(samples[j*2]-meanL)*this.window[j];im[j]=(samples[j*2+1]-meanR)*this.window[j];}
    for(let i=1,j=0;i<n;i++){
      let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;
      if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]];}
    }
    for(let length=2;length<=n;length*=2){
      const angle=-2*Math.PI/length,wr=Math.cos(angle),wi=Math.sin(angle);
      for(let start=0;start<n;start+=length){
        let ur=1,ui=0;
        for(let k=0;k<length/2;k++){
          const a=start+k,b=a+length/2,vr=re[b]*ur-im[b]*ui,vi=re[b]*ui+im[b]*ur;
          re[b]=re[a]-vr;im[b]=im[a]-vi;re[a]+=vr;im[a]+=vi;
          const next=ur*wr-ui*wi;ui=ur*wi+ui*wr;ur=next;
        }
      }
    }
    const power=new Float64Array(n/2+1),scale=(2/this.sum)**2;
    for(let k=1;k<n/2;k++){
      const mirror=n-k,lr=(re[k]+re[mirror])*.5,li=(im[k]-im[mirror])*.5;
      const rr=(im[k]+im[mirror])*.5,ri=(re[mirror]-re[k])*.5;
      power[k]=(lr*lr+li*li+rr*rr+ri*ri)*.5*scale;
    }
    const binHz=rate/n,maxHz=Math.min(MAX_HZ,rate/2-binHz);let strongest=0;
    const minBin=Math.max(1,Math.ceil(MIN_HZ/binHz)),maxBin=Math.min(n/2-1,Math.floor(maxHz/binHz));
    for(let k=minBin;k<=maxBin;k++)if(power[k]>power[strongest])strongest=k;
    let peak=null;
    if(power[strongest]>1e-12){
      const k=strongest,a=db(power[k-1]),b=db(power[k]),c=db(power[k+1]);
      const denominator=a-2*b+c,shift=denominator?Math.max(-.5,Math.min(.5,.5*(a-c)/denominator)):0;
      peak={hz:(k+shift)*binHz,db:b-.25*(a-c)*shift};
    }
    const displayPower=power.slice();
    for(let k=minBin;k<=maxBin;k++)if(power[k]>1e-12&&power[k]>=power[k-1]&&power[k]>=power[k+1]){
      const a=db(power[k-1]),b=db(power[k]),c=db(power[k+1]),den=a-2*b+c;
      const shift=den?Math.max(-.5,Math.min(.5,.5*(a-c)/den)):0;
      displayPower[k]=Math.pow(10,(b-.25*(a-c)*shift)/10);
    }
    // Display the strongest FFT bin in each logarithmic cell. This is tone amplitude,
    // not octave-band integrated energy or an equalized/tilted spectrum.
    const values=Array.from({length:POINTS},(_,j)=>{
      const hz=frequency(j);if(hz>maxHz)return -120;
      const lo=MIN_HZ*Math.pow(MAX_HZ/MIN_HZ,j/POINTS),hi=MIN_HZ*Math.pow(MAX_HZ/MIN_HZ,(j+1)/POINTS);
      const first=Math.max(1,Math.ceil(lo/binHz)),last=Math.min(maxBin,Math.floor(hi/binHz));
      if(first<=last){let p=0;for(let k=first;k<=last;k++)p=Math.max(p,displayPower[k]);return db(p);}
      const position=hz/binHz,k=Math.floor(position),f=position-k;
      return db((displayPower[k]||0)*(1-f)+(displayPower[k+1]||0)*f);
    });
    return {values,peak,binHz,windowMs:n/rate*1000,mode:'fft'};
  }
}
module.exports={FFTFrames,StereoFFT,POINTS,MIN_HZ,MAX_HZ,frequency};
