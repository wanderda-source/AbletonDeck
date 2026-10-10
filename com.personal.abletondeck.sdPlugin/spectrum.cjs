const COUNT=480;
const {idle}=require('./idle.cjs');
const {numericText}=require('./typography.cjs');
const frequency=edge=>25*Math.pow(800,edge/60);
const label=hz=>hz<1000?`${Math.round(hz)}`:`${(hz/1000).toFixed(hz>=10000?0:1)}k`;
const isSpectrum=kind=>/^spectrum[1-5]$/.test(kind);
function curvePath(points){
  if(!points.length)return '';
  const fmt=v=>v.toFixed(2);
  const slopes=points.slice(1).map((p,j)=>(p[1]-points[j][1])/(p[0]-points[j][0]));
  const tangents=points.map((_,j)=>{
    if(j===0||j===points.length-1)return 0;
    const a=slopes[j-1],b=slopes[j];
    if(a*b<=0)return 0;
    const h0=points[j][0]-points[j-1][0],h1=points[j+1][0]-points[j][0];
    const w0=2*h1+h0,w1=h1+2*h0;
    return (w0+w1)/(w0/a+w1/b);
  });
  let path=`M${fmt(points[0][0])} ${fmt(points[0][1])}`;
  for(let j=1;j<points.length;j++){
    const a=points[j-1],b=points[j],dx=(b[0]-a[0])/3;
    // Monotone cubic interpolation: smooth joins without invented overshoot.
    path+=` C${fmt(a[0]+dx)} ${fmt(a[1]+tangents[j-1]*dx)} ${fmt(b[0]-dx)} ${fmt(b[1]-tangents[j]*dx)} ${fmt(b[0])} ${fmt(b[1])}`;
  }
  return path;
}
class Spectrum {
  constructor(){this.target=Array(COUNT).fill(-120);this.level=[...this.target];this.peak=[...this.target];this.hold=Array(COUNT).fill(0);this.time=0;this.tickTime=0;this.frozen=null;}
  receive(values,now=Date.now(),metadata={}){
    if(![60,COUNT].includes(values.length)||!values.every(v=>Number.isFinite(v)&&v>=-120&&v<=120))return false;
    if(!this.time||now-this.time>=1800){this.level=Array(COUNT).fill(-120);this.peak=[...this.level];this.hold.fill(0);}
    if(values.length===60){
      this.target=Array.from({length:COUNT},(_,j)=>{
        const hz=20*Math.pow(1000,(j+.5)/COUNT),index=Math.log(hz/25)/Math.log(800)*60-.5;
        const a=Math.max(0,Math.min(59,Math.floor(index))),b=Math.min(59,a+1),f=Math.max(0,Math.min(1,index-a));
        return values[a]*(1-f)+values[b]*f;
      });
    }else this.target=[...values];
    this.metadata={mode:metadata.mode||'legacy',binHz:metadata.binHz,windowMs:metadata.windowMs,strongest:metadata.peak};
    this.time=now;return true;
  }
  tick(now=Date.now()){
    const dt=Math.max(0,Math.min(0.2,this.tickTime?(now-this.tickTime)/1000:0.05));this.tickTime=now;
    for(let j=0;j<COUNT;j++){
      const target=now-this.time<1800?this.target[j]:-120;
      const tau=target>this.level[j]?0.055:0.28;
      this.level[j]+=(target-this.level[j])*(1-Math.exp(-dt/tau));
      if(this.level[j]>=this.peak[j]){this.peak[j]=this.level[j];this.hold[j]=now+550;}
      else if(now>this.hold[j])this.peak[j]=Math.max(this.level[j],this.peak[j]-dt*23);
    }
  }
  toggle(now=Date.now()){
    if(this.frozen){this.frozen=null;return true;}
    if(!this.time||now-this.time>=1800)return false;
    this.frozen={level:[...this.level],peak:[...this.peak],...this.metadata};return true;
  }
  snapshot(){return this.frozen||{level:this.level,peak:this.peak,...this.metadata};}
}
function renderSpectrum(panel,data={},opts={}){
  const offset=panel*144;
  let body='';
  const precise=data.mode==='fft';
  const y=db=>precise?126-Math.max(0,Math.min(112,(db+84)/84*112)):138-Math.max(0,Math.min(128,(db+12+72)/72*128));
  const axis=()=>{
    let axis='';
    for(const db of [0,-24,-48,-72]){
      axis+=`<path d="M${offset} ${y(db).toFixed(2)}H${offset+144}" stroke="#181818" stroke-width=".6"/>`;
      if(panel===0)axis+=`<text x="${offset+5}" y="${(y(db)+10).toFixed(2)}" font-family="Arial" font-size="10" fill="#777">${db}</text>`;
    }
    for(const hz of [20,50,100,200,500,1000,2000,5000,10000,20000]){
      const x=720*Math.log(hz/20)/Math.log(1000);
      if(x>=offset&&x<=offset+144){
        const tx=Math.max(offset+9,Math.min(offset+135,x));
        axis+=`<path d="M${x.toFixed(2)} 14V126" stroke="#181818" stroke-width=".6"/><text x="${tx.toFixed(2)}" y="140" text-anchor="middle" font-family="Arial" font-size="11" fill="#999">${hz>=1000?(hz/1000)+'k':hz}</text>`;
      }
    }
    return axis;
  };
  if(precise)body+=axis();
  if(!opts.connected){
    body=idle(false,offset);
  }else if(opts.silent||!data.level?.some(v=>v>-110)){
    body+=`<path data-spectrum="silence" d="M${offset} ${precise?126:138}H${offset+144}" fill="none" stroke="#333333" stroke-width="1"/>`;
  }else{
    body+=`<defs><linearGradient id="spectrum${panel}" gradientUnits="userSpaceOnUse" x1="0" y1="8" x2="0" y2="144"><stop stop-color="#f25623" stop-opacity="0.65"/><stop offset="0.6" stop-color="#f25623" stop-opacity="0.12"/><stop offset="1" stop-color="#f25623" stop-opacity="0"/></linearGradient></defs>`;
    // Shared global coordinates; retain neighbors outside each key for seamless curves.
    const count=data.level.length;
    const contour=values=>{
      const first=precise?Math.max(0,Math.floor(panel*count/5)-2):0,last=precise?Math.min(count,Math.ceil((panel+1)*count/5)+2):count;
      const points=Array.from({length:last-first},(_,k)=>{const j=first+k;return [(j+.5)*720/count,y(values?.[j]??-120)];});
      if(first===0)points.unshift([0,y(values?.[0]??-120)]);
      if(last===count)points.push([720,y(values?.[count-1]??-120)]);
      return curvePath(points);
    };
    const current=contour(data.level);
    body+=`<path data-spectrum="fill" d="${current} L${offset+148} ${precise?126:138}L${offset-4} ${precise?126:138}Z" fill="url(#spectrum${panel})"/><path data-spectrum="peak" d="${contour(data.peak)}" fill="none" stroke="#dedede" stroke-opacity="0.22" stroke-width="0.8"/><path data-spectrum="contour" d="${current}" fill="none" stroke="#ffffff" stroke-width="1.25"/>`;
    if(precise&&data.strongest&&data.strongest.db>-84){
      const peak=data.strongest,x=720*Math.log(peak.hz/20)/Math.log(1000);
      if(x>=offset&&x<offset+144){
        const tx=Math.max(offset+42,Math.min(offset+102,x));
        body+=`<path data-spectrum="frequency-peak" d="M${x.toFixed(2)} 38V126" stroke="#f25623" stroke-opacity=".35" stroke-width=".7"/>`+numericText(`${Math.round(peak.hz)} Hz`,24,14,{x:tx,align:'middle',maxWidth:90})+`<text x="${tx.toFixed(2)}" y="37" text-anchor="middle" font-family="Arial" font-size="10" fill="#999">${peak.db.toFixed(1)} dBFS</text>`;
      }
    }
    if(opts.frozen)body+=`<g data-frozen="true" fill="#dedede"><rect x="${offset+121}" y="9" width="3" height="9"/><rect x="${offset+127}" y="9" width="3" height="9"/></g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="${offset} 0 144 144"><rect x="${offset}" width="144" height="144" fill="#000000"/>${body}</svg>`;
}
module.exports={Spectrum,renderSpectrum,isSpectrum,frequency,COUNT,curvePath};
