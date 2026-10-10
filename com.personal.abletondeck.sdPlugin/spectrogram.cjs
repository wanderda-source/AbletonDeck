const zlib=require('node:zlib');
const SIZE=64,STEP=125;
function crc(buf){let c=0xffffffff;for(const v of buf){c^=v;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(name,data){const type=Buffer.from(name),n=Buffer.alloc(4),sum=Buffer.alloc(4);n.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([type,data])));return Buffer.concat([n,type,data,sum]);}
function png(columns){
  const raw=Buffer.alloc(SIZE*(1+SIZE*3));
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
    const db=columns[x]?.[SIZE-1-y]??-120;
    const t=Math.max(0,Math.min(1,(db+84)/72));
    const stops=[[0,0,0],[46,14,8],[242,86,35],[255,243,230]];
    const q=t*3,k=Math.min(2,Math.floor(q)),f=q-k;
    for(let c=0;c<3;c++)raw[y*(1+SIZE*3)+1+x*3+c]=Math.round(stops[k][c]*(1-f)+stops[k+1][c]*f);
  }
  const head=Buffer.alloc(13);head.writeUInt32BE(SIZE,0);head.writeUInt32BE(SIZE,4);head[8]=8;head[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]).toString('base64');
}
class Spectrogram {
  constructor(){this.columns=Array.from({length:SIZE},()=>Array(SIZE).fill(-120));this.time=null;this.latest=null;this.received=0;this.cached=null;}
  receive(values,now=Date.now()){
    if(!Array.isArray(values)||values.length<64||!values.every(Number.isFinite))return false;
    this.latest=Array.from({length:SIZE},(_,row)=>{
      const start=Math.floor(row*values.length/SIZE),end=Math.max(start+1,Math.floor((row+1)*values.length/SIZE));
      return Math.max(...values.slice(start,end));
    });this.received=now;return true;
  }
  tick(now=Date.now(),silent=false){
    const time=Math.floor(now/STEP);
    if(this.time===time)return this.snapshot();
    const count=this.time===null?1:Math.min(SIZE,Math.max(0,time-this.time));
    // Gaps become blank columns rather than stretching the last audio frame.
    for(let j=count;j>0;j--){const at=(time-j+1)*STEP;
      this.columns.shift();this.columns.push(!silent&&this.latest&&at-this.received>=-STEP&&at-this.received<400?[...this.latest]:Array(SIZE).fill(-120));
    }
    this.time=time;this.cached=null;return this.snapshot();
  }
  snapshot(){return this.cached??=(Object.freeze({png:png(this.columns),time:this.time}));}
}
function renderSpectrogram(frame){return `<image data-spectrogram="true" x="8" y="8" width="128" height="128" preserveAspectRatio="none" href="data:image/png;base64,${frame?.png||png([])}"/>`;}
module.exports={Spectrogram,renderSpectrogram,SIZE,STEP};
