const {numericText}=require('./typography.cjs');
function renderPitch(pitch,silent=false){
  const valid=pitch&&!silent;
  const hz=valid?pitch.hz.toFixed(1):'0.0';
  const note=valid?pitch.note:'—';
  const cents=valid?Math.round(pitch.cents):0;
  const x=72+Math.max(-50,Math.min(50,cents))*1.08;
  let scale='<rect x="66.6" y="76" width="10.8" height="10" rx="2" fill="#dedede" opacity=".14"/><path data-detune="scale" d="M18 81H126" stroke="#777" stroke-width="1.4"/>';
  for(const c of [-50,-25,0,25,50])scale+=`<path d="M${72+c*1.08} ${c===0?74:78}V${c===0?88:84}" stroke="${c===0?'#ffffff':'#777'}" stroke-width="${c===0?1.5:1}"/>`;
  if(valid)scale+=`<path data-pitch="${pitch.note}" d="M${x.toFixed(2)} 76L${(x+4).toFixed(2)} 81L${x.toFixed(2)} 86L${(x-4).toFixed(2)} 81Z" fill="${Math.abs(cents)<=5?'#ffffff':'#f25623'}"/>`;
  return numericText(note,58,40,{x:72,align:'middle',maxWidth:120})+scale+numericText(hz,120,25,{x:72,align:'middle',maxWidth:116})+'<text x="72" y="137" text-anchor="middle" fill="#999" font-family="Arial" font-size="11">Hz</text>';
}
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const hash=(a,b=0)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v);};
function noise(t,seed){const i=Math.floor(t),f=t-i,q=f*f*(3-2*f);return (hash(i,seed)*(1-q)+hash(i+1,seed)*q)*2-1;}
class ReactiveFlow {
  constructor(){
    this.time=0;this.last=0;this.level=0;this.onset=0;
    this.particles=Array.from({length:125},(_,j)=>({x:72+48*(hash(j,5)-.5),y:72+48*(hash(j,6)-.5),trail:[]}));
  }
  tick(meter,silent,now=Date.now()){
    const dt=this.last?clamp((now-this.last)/1000,0,.1):.05;this.last=now;

    const bands=meter.bands||[],energy=silent?0:clamp(((meter.m??-120)+54)/48);
    const bass=silent?0:clamp(((bands[1]??meter.peak??-120)+60)/48);
    const high=silent?0:clamp(((bands[6]??-120)+60)/48);
    const width=silent?0:clamp((meter.sidePower||0)/Math.max(1e-12,(meter.midPower||0)+(meter.sidePower||0)));
    const level=silent?0:clamp(((meter.peak??-120)+60)/54);
    this.onset=Math.max(this.onset*Math.exp(-dt*9),silent?0:clamp((level-this.level)*5));
    this.level+=(level-this.level)*(1-Math.exp(-dt*7));
    this.energy=energy;this.bass=bass;this.high=high;
    this.time+=dt*(silent?.07:.6+energy*.8);const t=this.time;
    const cx=72+noise(t*.7,1)*24*(.5+width),cy=72+noise(t*.6,2)*24;
    this.particles.forEach((p,j)=>{
      const dx=p.x-cx,dy=p.y-cy,r=Math.max(8,Math.hypot(dx,dy));
      const angle=Math.atan2(dy,dx)+Math.PI/2+noise(t*(1.4+high),j)*(.5+high*.6)+this.onset*.8+width*.35;
      const speed=silent?1.4:12+30*energy+35*this.onset+12*bass;
      const inward=(r-(24+14*bass))*(silent?.025:.22);
      p.x+=(Math.cos(angle)*speed-dx/r*inward)*dt;p.y+=(Math.sin(angle)*speed-dy/r*inward)*dt;
      if(p.x<8||p.x>136||p.y<8||p.y>136){const a=hash(j,t)*Math.PI*2;p.x=cx+20*Math.cos(a);p.y=cy+20*Math.sin(a);p.trail=[];}
      p.trail.push([p.x,p.y]);if(p.trail.length>9)p.trail.shift();
    });
    return this.snapshot();
  }
  snapshot(){return {time:this.time,energy:this.energy||0,bass:this.bass||0,high:this.high||0,onset:this.onset,particles:this.particles.map(p=>({x:p.x,y:p.y,trail:p.trail.map(v=>[...v])}))};}
}
function renderForm(style,flow,opts){
  const t=flow.time||0,l=flow.energy||0,b=flow.bass||0,h=flow.high||0;
  const eco=opts.performance==='economy',f=v=>v.toFixed(2);
  const path=(points,opacity,width=1.2)=>`<path d="${points.map(([x,y],k)=>`${k?'L':'M'}${f(x)} ${f(y)}`).join(' ')}" stroke-opacity="${f(opacity)}" stroke-width="${width}"/>`;
  let body=`<g data-reactive="true" data-style="${style}" fill="none" stroke="#f25623" stroke-linecap="round" stroke-linejoin="round">`;
  if(style==='ribbon'){
    const count=eco?5:7,steps=eco?36:72;
    for(let j=0;j<count;j++){
      const layer=j*6/(count-1),points=[];
      for(let k=0;k<=steps;k++){
        const u=k/steps,envelope=Math.pow(Math.sin(u*Math.PI),.7);
        points.push([12+u*120,72+(layer-3)*3+envelope*(Math.sin(u*7-t*.8+layer*.26)*(12+21*l)+Math.sin(u*13+t*.6+layer*.1)*(3+10*h))]);
      }
      body+=path(points,.2+layer*.1);
    }
  }else if(style==='field'){
    const cx=72+noise(t*.55,1)*30,cy=72+noise(t*.61,2)*30;
    for(let row=0;row<7;row++)for(let col=0;col<7;col++){
      const x=21+col*17,y=21+row*17,dx=x-cx,dy=y-cy,r=Math.hypot(dx,dy);
      const a=Math.atan2(dy,dx)+Math.PI/2+.9*Math.sin(x*.034+y*.052+t*.6)+h*.4;
      const len=4.4+2.6*l+1.1*b*Math.cos(r*.06),vx=Math.cos(a)*len,vy=Math.sin(a)*len;
      body+=path([[x-vx,y-vy],[x+vx,y+vy]],.4+.5*Math.max(0,1-r/130),1.55);
    }
  }else if(style==='mesh'){
    const p=(x,y)=>{
      const r=Math.hypot(x-4,y-4),z=Math.sin(r*1.3-t*1.1)*(5+10*l)+Math.cos(x*.7+y*.8+t*.5)*(4+4*b);
      return [72+(x-4)*12+(y-4)*4,73+(y-4)*8-z];
    };
    const steps=eco?24:40;
    for(let axis=0;axis<2;axis++)for(let j=0;j<9;j++){
      const points=[];for(let k=0;k<=steps;k++)points.push(p(axis?j:k*8/steps,axis?k*8/steps:j));
      body+=path(points,.35+j*.055,1.1);
    }
  }
  return body+'</g>';
}
function renderReactive(meter={},opts={}){
  const silent=opts.silent||!Number.isFinite(meter.peak)||meter.peak<=-110;

  let flow=meter.flow;
  if(!flow){
    const preview=new ReactiveFlow(),start=(opts.animationTime??1)*1000;
    for(let j=0;j<50;j++)preview.tick(meter,silent,start+j*25);
    // Deterministic standalone previews vary with their supplied phase.
    preview.time+=opts.animationTime??0;
    flow=preview.tick(meter,silent,start+1250);
  }
  if(['ribbon','field','mesh'].includes(opts.visualStyle))return renderForm(opts.visualStyle,flow,opts);
  let body='<g data-reactive="true" data-style="flow" fill="none" stroke-linecap="round" stroke-linejoin="round">';
  flow.particles.forEach((p,j)=>{
    if(opts.performance==='economy'&&j%2)return;
    const orange=j%17===0,color=orange?'#f25623':'#dedede';
    const d=(opts.performance==='economy'?p.trail.slice(-4):p.trail).map(([x,y],k)=>`${k?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
    body+=`<path d="${d}" stroke="${color}" stroke-opacity="${orange?.75:.35}" stroke-width=".6"/><circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${(.65+flow.onset*.55).toFixed(2)}" fill="${color}"/>`;
  });
  return body+'</g>';
}
module.exports={renderPitch,renderReactive,ReactiveFlow};
