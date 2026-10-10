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
  snapshot(){return {onset:this.onset,particles:this.particles.map(p=>({x:p.x,y:p.y,trail:p.trail.map(v=>[...v])}))};}
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
  let body='<g data-reactive="true" data-style="flow" fill="none" stroke-linecap="round" stroke-linejoin="round">';
  flow.particles.forEach((p,j)=>{
    const orange=j%17===0,color=orange?'#f25623':'#dedede';
    const d=p.trail.map(([x,y],k)=>`${k?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
    body+=`<path d="${d}" stroke="${color}" stroke-opacity="${orange?.75:.35}" stroke-width=".6"/><circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${(.65+flow.onset*.55).toFixed(2)}" fill="${color}"/>`;
  });
  return body+'</g>';
}
module.exports={renderPitch,renderReactive,ReactiveFlow};
