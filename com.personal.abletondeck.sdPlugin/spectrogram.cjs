const zlib=require('node:zlib');
const {heatStops,themeName}=require('./themes.cjs');
const SIZE=64,STEP=125;
function crc(buf){let c=0xffffffff;for(const v of buf){c^=v;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(name,data){const type=Buffer.from(name),n=Buffer.alloc(4),sum=Buffer.alloc(4);n.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([type,data])));return Buffer.concat([n,type,data,sum]);}
function png(columns,theme='orange',width=SIZE,height=SIZE,offsetX=0,offsetY=0,totalHeight=height){
  const stops=heatStops(theme);
  const raw=Buffer.alloc(height*(1+width*3));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const db=columns[x+offsetX]?.[totalHeight-1-y-offsetY]??-120;
    const t=Math.max(0,Math.min(1,(db+84)/72));
    const q=t*(stops.length-1),k=Math.min(stops.length-2,Math.floor(q)),f=q-k;
    for(let c=0;c<3;c++)raw[y*(1+width*3)+1+x*3+c]=Math.round(stops[k][c]*(1-f)+stops[k+1][c]*f);
  }
  const head=Buffer.alloc(13);head.writeUInt32BE(width,0);head.writeUInt32BE(height,4);head[8]=8;head[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]).toString('base64');
}
class Spectrogram {
  constructor({width=SIZE,height=SIZE,step=STEP}={}){this.width=width;this.height=height;this.step=step;this.columns=Array.from({length:width},()=>Array(height).fill(-120));this.time=null;this.latest=null;this.received=0;this.cached=null;this.tileCache=new Map();}
  receive(values,now=Date.now()){
    if(!Array.isArray(values)||values.length<64||!values.every(Number.isFinite))return false;
    this.latest=Array.from({length:this.height},(_,row)=>{
      const start=Math.floor(row*values.length/this.height),end=Math.max(start+1,Math.floor((row+1)*values.length/this.height));
      return Math.max(...values.slice(start,end));
    });this.received=now;return true;
  }
  tick(now=Date.now(),silent=false,deferImage=false){
    const time=Math.floor(now/this.step);
    if(this.time===time)return deferImage?undefined:this.snapshot();
    const count=this.time===null?1:Math.min(this.width,Math.max(0,time-this.time));
    // Gaps become blank columns rather than stretching the last audio frame.
    for(let j=count;j>0;j--){const at=(time-j+1)*this.step;
      this.columns.shift();this.columns.push(!silent&&this.latest&&at-this.received>=-this.step&&at-this.received<400?[...this.latest]:Array(this.height).fill(-120));
    }
    this.time=time;this.cached=null;this.tileCache.clear();return deferImage?undefined:this.snapshot();
  }
  snapshot(theme='orange'){
    theme=themeName(theme);
    if(!this.cached)this.cached=new Map();
    if(!this.cached.has(theme))this.cached.set(theme,Object.freeze({png:png(this.columns,theme,this.width,this.height),time:this.time,theme,columns:this.columns.map(c=>Object.freeze([...c]))}));
    return this.cached.get(theme);
  }
  tile(x,y,theme='orange'){
    if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>4||y<0||y>2)throw new RangeError('Invalid spectrogram tile');
    theme=themeName(theme);const key=`${x},${y},${theme}`;
    if(!this.tileCache.has(key))this.tileCache.set(key,png(this.columns,theme,72,72,x*72,y*72,this.height));
    return this.tileCache.get(key);
  }
}
function renderSpectrogram(frame,theme){
  const image=theme&&frame?.columns&&theme!==frame.theme?png(frame.columns,theme):frame?.png||png([],theme);return `<image data-spectrogram="true" x="8" y="8" width="128" height="128" preserveAspectRatio="none" href="data:image/png;base64,${image}"/>`;}
module.exports={Spectrogram,renderSpectrogram,SIZE,STEP};
