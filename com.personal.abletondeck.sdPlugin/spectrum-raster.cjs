// Render the whole graph once, then send only native 72px PNG tiles to Stream Deck.
const zlib=require('node:zlib');
const {PALETTES,themeName}=require('./themes.cjs');
const W=720,H=432,NW=360,NH=216;
const FONT={
 '0':['111','101','101','101','111'],'1':['010','110','010','010','111'],
 '2':['111','001','111','100','111'],'3':['111','001','111','001','111'],
 '4':['101','101','111','001','001'],'5':['111','100','111','001','111'],
 '6':['111','100','111','101','111'],'7':['111','001','010','010','010'],
 '8':['111','101','111','101','111'],'9':['111','101','111','001','111'],
 '-':['000','000','111','000','000'],'.':['000','000','000','000','010'],
 'k':['100','101','110','101','101'],'H':['101','101','111','101','101'],
 'z':['000','111','010','100','111'],'d':['001','001','111','101','111'],
 'B':['110','101','110','101','110'],'F':['111','100','110','100','100'],
 'S':['111','100','111','001','111'],' ':['000','000','000','000','000']
};
const crcTable=Uint32Array.from({length:256},(_,c)=>{for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);return c>>>0;});
function chunk(type,data){const t=Buffer.from(type),n=Buffer.alloc(4),sum=Buffer.alloc(4);n.writeUInt32BE(data.length);let crc=0xffffffff;for(const b of Buffer.concat([t,data]))crc=(crc>>>8)^crcTable[(crc^b)&255];sum.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([n,t,data,sum]);}
function tilePNG(pixels,x,y){
 const raw=Buffer.alloc(72*217);for(let row=0;row<72;row++)pixels.copy(raw,row*217+1,((y*72+row)*NW+x*72)*3,((y*72+row)*NW+x*72+72)*3);
 const head=Buffer.alloc(13);head.writeUInt32BE(72,0);head.writeUInt32BE(72,4);head[8]=8;head[9]=2;
 return 'data:image/png;base64,'+Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',zlib.deflateSync(raw,{level:1})),chunk('IEND',Buffer.alloc(0))]).toString('base64');
}
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
function colourAt(palette,y){
 if(!palette.stops)return rgb(palette.accent);
 const q=Math.max(0,Math.min(2,y/H*2)),k=Math.min(1,Math.floor(q)),f=q-k;
 const a=rgb(palette.stops[k]),b=rgb(palette.stops[k+1]);return a.map((v,i)=>v+(b[i]-v)*f);
}
const ordinate=db=>410-Math.max(0,Math.min(390,(db+84)/84*390));
function sampleCurve(values){
 const n=values.length,dx=W/n,ys=values.map(ordinate);
 const slopes=ys.slice(1).map((v,i)=>(v-ys[i])/dx);
 const tangents=ys.map((_,i)=>i===0||i===n-1||slopes[i-1]*slopes[i]<=0?0:2/(1/slopes[i-1]+1/slopes[i]));
 return Float64Array.from({length:W},(_,x)=>{
  const pos=(x+.5)/dx-.5;if(pos<=0)return ys[0];if(pos>=n-1)return ys[n-1];
  const j=Math.floor(pos),t=pos-j,t2=t*t,t3=t2*t;
  return (2*t3-3*t2+1)*ys[j]+(t3-2*t2+t)*dx*tangents[j]+(-2*t3+3*t2)*ys[j+1]+(t3-t2)*dx*tangents[j+1];
 });
}
function rasterSpectrum(data={},theme='orange',silent=false){
 const palette=PALETTES[themeName(theme)],pixels=Buffer.alloc(W*H*3);
 const colours=Array.from({length:H},(_,y)=>colourAt(palette,y));
 const paint=(x,y,c,a=1)=>{x=Math.round(x);y=Math.round(y);if(x<0||x>=W||y<0||y>=H)return;const i=(y*W+x)*3;for(let k=0;k<3;k++)pixels[i+k]=Math.round(pixels[i+k]*(1-a)+c[k]*a);};
 const live=!silent&&data.level?.some(v=>v>-110);
 for(const db of [0,-24,-48,-72]){const y=ordinate(db);for(let x=0;x<W;x++)paint(x,y,[24,24,24],.6);}
 for(const hz of [20,50,100,200,500,1000,2000,5000,10000,20000]){const x=W*Math.log(hz/20)/Math.log(1000);for(let y=14;y<410;y++)paint(Math.min(W-1,x),y,[24,24,24],.6);}
 if(live){
  const current=sampleCurve(data.level),peak=sampleCurve(data.peak||data.level);
  for(let x=0;x<W;x++)for(let y=Math.max(0,Math.ceil(current[x]));y<410;y++){
   const f=y/H,alpha=f<.6?.65+(.12-.65)*f/.6:.12*(1-f)/.4;paint(x,y,colours[y],alpha);
  }
  // Supersampling provides smooth strokes while retaining all 480 FFT display points.
  const line=(points,alpha,width)=>{for(let x=0;x<W;x++){
   const lo=Math.min(points[x],points[Math.max(0,x-1)]),hi=Math.max(points[x],points[Math.max(0,x-1)]);
   for(let y=Math.floor(lo-width);y<=Math.ceil(hi+width);y++){
    const distance=y<lo?lo-y:y>hi?y-hi:0,coverage=Math.max(0,Math.min(1,width+.5-distance));
    if(coverage)paint(x,y,colours[Math.max(0,Math.min(H-1,y))],alpha*coverage);
   }
  }};
  line(peak,.22,.8);line(current,1,1.0);
  if(data.mode==='fft'&&data.strongest?.db>-84&&data.strongest.hz>=20&&data.strongest.hz<=20000){
   const x=W*Math.log(data.strongest.hz/20)/Math.log(1000);for(let y=38;y<410;y++)paint(Math.min(W-1,x),y,colours[y],.35);
  }
 }
 if(!live)for(let x=0;x<W;x++)paint(x,410,[51,51,51]);
 const native=Buffer.alloc(NW*NH*3);
 for(let y=0;y<NH;y++)for(let x=0;x<NW;x++)for(let c=0;c<3;c++){
  const i=((y*2)*W+x*2)*3+c;native[(y*NW+x)*3+c]=Math.round((pixels[i]+pixels[i+3]+pixels[i+W*3]+pixels[i+W*3+3])/4);
 }
 const text=(value,x,y,colour=[153,153,153],scale=1)=>{
  for(const ch of value){const glyph=FONT[ch]||FONT[' '];for(let gy=0;gy<5;gy++)for(let gx=0;gx<3;gx++)if(glyph[gy][gx]==='1')for(let sy=0;sy<scale;sy++)for(let sx=0;sx<scale;sx++){
   const px=x+gx*scale+sx,py=y+gy*scale+sy;if(px>=0&&px<NW&&py>=0&&py<NH){const i=(py*NW+px)*3;for(let c=0;c<3;c++)native[i+c]=colour[c];}
  }x+=4*scale;}
 };
 for(const db of [0,-24,-48,-72]){const y=Math.round(ordinate(db)/2)+2; text(String(db),2,Math.min(Math.floor(y/72)*72+66,y));}
 for(const hz of [20,50,100,200,500,1000,2000,5000,10000,20000]){
  const label=hz>=1000?(hz/1000)+'k':String(hz),x=Math.round(NW*Math.log(hz/20)/Math.log(1000));text(label,Math.max(1,Math.min(NW-label.length*4,x-label.length*2)),209);
 }
 if(live&&data.mode==='fft'&&data.strongest?.db>-84){
  const peak=data.strongest,hz=Math.round(peak.hz);
  if(Number.isFinite(hz)&&hz>=20&&hz<=20000){const label=hz+' Hz',position=Math.min(NW-1,NW*Math.log(hz/20)/Math.log(1000)),left=Math.floor(position/72)*72;
   const x=Math.round(Math.max(left+4,Math.min(left+68-label.length*8,position-label.length*4)));
   text(label,x,2,[255,255,255],2);text(peak.db.toFixed(1)+' dBFS',x,14);
  }
 }
 return native;
}
class SpectrumRaster {
 constructor(){this.key=null;this.tiles=null;}
 render(data,theme,silent){
  const key=JSON.stringify([data.level,data.peak,data.strongest,data.mode,theme,silent]);
  if(key!==this.key){const pixels=rasterSpectrum(data,theme,silent);this.tiles=Array.from({length:15},(_,i)=>tilePNG(pixels,i%5,Math.floor(i/5)));this.key=key;}
  return this.tiles;
 }
}
module.exports={SpectrumRaster,rasterSpectrum,sampleCurve,ordinate};
