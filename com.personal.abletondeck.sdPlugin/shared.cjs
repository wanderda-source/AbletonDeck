const COLORS = { orange: '#f25623', blue: '#dedede', mint: '#f25623', violet: '#dedede' };
const {curvePath}=require('./spectrum.cjs');
const {numericText}=require('./typography.cjs');
const {idle}=require('./idle.cjs');
const {renderPitch,renderReactive}=require('./music-visuals.cjs');
const {gateThreshold}=require('./display.cjs');
const {renderSpectrogram}=require('./spectrogram.cjs');
const {beatPulse}=require('./beat.cjs');
function escape(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])); }
function fresh(time, now = Date.now()) { return time > 0 && now - time < 1800; }
function number(n,floor=-60) { return Number.isFinite(n) && n > floor ? n.toFixed(1) : '0.0'; }
const VISUAL_ACTIONS = ['midside', 'waveform', 'vectorscope', 'goniometer','pitch','reactive','spectrogram'];
function scopeFromValues(values) {
  if (values.length !== 513 || !values.every(Number.isFinite) || values[0] <= 0 || values[0] > 100) return null;
  const samples = [], envelope = [];
  for (let j = 1; j < 257; j += 2) samples.push([values[j], values[j + 1]]);
  for (let j = 257; j < 513; j += 4) {
    const row = values.slice(j, j + 4);
    if (row[0] > row[1] || row[2] > row[3]) return null;
    envelope.push(row);
  }
  return { windowMs: values[0], samples, envelope };
}
function midSideBalance(mid, side) {
  if (!Number.isFinite(mid) || !Number.isFinite(side) || mid < 0 || side < 0 || mid + side < 1e-12) return null;
  return { mid: 100 * mid / (mid + side), side: 100 * side / (mid + side), delta: 10 * Math.log10(side / mid) };
}
function stereoPoint(left, right) { return [(right - left) / Math.SQRT2, (left + right) / Math.SQRT2]; }
function frozenIcon(on) {
  return on ? '<g data-frozen="true" fill="#dedede"><rect x="120" y="9" width="3" height="9"/><rect x="126" y="9" width="3" height="9"/></g>' : '';
}
function glyph(kind, colour='#ffffff', y=35, size=74) {
  const paths={
    play:'<path d="M7 4L21 12L7 20Z" fill="currentColor" stroke="none"/>',
    pause:'<path d="M8 5V19 M16 5V19" stroke-width="4"/>',
    stop:'<rect x="5" y="5" width="14" height="14" rx="1" fill="currentColor" stroke="none"/>',
    record:'<circle cx="12" cy="12" r="7" fill="currentColor" stroke="none"/>',
    sessionrecord:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/>',
    loop:'<path d="M5 8H19L16 5 M19 8V14 M19 16H5L8 19 M5 16V10"/>',
    click:'<path d="M6 20L10 4H14L18 20Z M12 15L17 7 M5 20H19"/>',
    mute:'<path d="M3 9H7L12 5V19L7 15H3Z M17 9L22 15 M22 9L17 15"/>',
    solo:'<path d="M16 6H9C4 6 4 12 9 12H15C20 12 20 18 15 18H7"/>',
    arm:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
    prev:'<path d="M15 5L8 12L15 19"/>', next:'<path d="M9 5L16 12L9 19"/>',
    scene:'<path d="M4 5V19 M10 5L21 12L10 19Z"/>',
    stopclips:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    undo:'<path d="M8 4L3 9L8 14 M3 9H14C23 9 23 20 14 20"/>',
    redo:'<path d="M16 4L21 9L16 14 M21 9H10C1 9 1 20 10 20"/>',
    tap:'<circle cx="12" cy="12" r="8"/><path d="M12 7V12L16 15"/>',
    overdub:'<circle cx="12" cy="12" r="8"/><path d="M12 7V17 M7 12H17"/>',
    reset:'<path d="M4 10A8 8 0 1 1 5 17 M4 4V10H10"/>'
  };
  return `<g transform="translate(${(144-size)/2},${y}) scale(${size/24})" color="${colour}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[kind]||paths.reset}</g>`;
}
function renderVisual(kind, meter, opts, text, accent) {
  if(kind==='spectrogram')return renderSpectrogram(meter.spectrogram);
  if(kind==='pitch')return renderPitch(meter.pitch,opts.silent);
  if(kind==='reactive')return renderReactive(meter,opts);
  if(kind==='vectorscope'){
    const history=meter.history||[];
    const now=opts.frozen?meter.historyTime:(opts.animationTime!=null?opts.animationTime*1000:Date.now());
    const points=history.filter(p=>now-p[0]<=30000).map(([t,v])=>[12+120*(1-(now-t)/30000),124-Math.max(0,Math.min(96,(v+48)/48*96))]);
    if(!points.length)points.push([12,124],[132,124]);
    const curve=curvePath(points);
    return '<path d="M12 124H132 M12 76H132 M12 28H132" stroke="#202020"/>'+`<path data-history="true" d="${curve}" fill="none" stroke="#dedede" stroke-width="1.4"/>`;
  }
  if (kind === 'midside') {
    if(opts.silent)return '<text x="12" y="27" fill="#f25623" font-family="Arial" font-size="12">M</text><text x="130" y="27" text-anchor="end" fill="#dedede" font-family="Arial" font-size="12">S</text>'+numericText('0.0',72,36,{x:12,maxWidth:50})+numericText('0.0',72,36,{x:132,align:'end',maxWidth:50})+'<path d="M12 90H132" stroke="#4d4d4d"/>'+numericText('0.0 dB',123,16,{x:72,align:'middle'});
    const ratio = midSideBalance(meter.midPower, meter.sidePower);
    if (!ratio) return renderVisual(kind,meter,{...opts,silent:true},text,accent);
    const delta = ratio.delta === Infinity ? '+∞' : ratio.delta === -Infinity ? '−∞' : `${ratio.delta >= 0 ? '+' : ''}${ratio.delta.toFixed(1)}`;
    const m=Math.round(ratio.mid),side=Math.round(ratio.side);
    return `<g data-mid="${m}" data-side="${side}"><text x="12" y="27" fill="#f25623" font-family="Arial" font-size="12">M</text><text x="130" y="27" text-anchor="end" fill="#dedede" font-family="Arial" font-size="12">S</text>` +
      numericText(m,72,36,{x:12,maxWidth:50})+numericText(side,72,36,{x:132,align:'end',maxWidth:50})+
      `<rect x="12" y="89" width="120" height="3" fill="#4d4d4d"/><rect x="12" y="89" width="${(120*ratio.mid/100).toFixed(2)}" height="3" fill="#f25623"/>`+
      numericText(`${delta} dB`,123,16,{x:72,align:'middle',maxWidth:120})+'</g>';
  }
  const scope = meter.scope||{samples:[[0,0]],envelope:Array(64).fill([0,0,0,0])};
  const points = kind === 'vectorscope' ? scope.trail || scope.samples : scope.samples;
  const peak = Math.max(1e-6, ...points.flatMap(pair => pair.map(Math.abs)), ...scope.envelope.flat().map(Math.abs));
  const gain = Math.min(40, 0.9 / peak);
  const silent=opts.silent||peak<=1e-6;
  let body='';
  if (kind === 'waveform') {
    body += '<path d="M8 72H136" stroke="#777777" stroke-width="1.25"/>';
    if(silent)return body;
    if(opts.scopeMode!=='free'&&meter.triggerWave?.length){
      return body+`<path data-wave="triggered" d="${meter.triggerWave.map((v,j)=>`${j?'L':'M'}${(8+j*128/(meter.triggerWave.length-1)).toFixed(2)} ${(72-v*59).toFixed(2)}`).join(' ')}" fill="none" stroke="#ffffff" stroke-width="1.25" stroke-linejoin="round"/>`;
    }
    scope.envelope.forEach((row, j) => {
      const x = 8 + j * 128 / 63;
      // Union of channel extrema retains anti-phase signals and inter-sample transients.
      const low=Math.max(-1,Math.min(1,Math.min(row[0],row[2])*gain));
      const high=Math.max(-1,Math.min(1,Math.max(row[1],row[3])*gain));
      body+=`<path data-wave="combined" d="M${x.toFixed(2)} ${(72-high*59).toFixed(2)}V${(72-low*59).toFixed(2)}" stroke="#ffffff" stroke-width="1.5"/>`;
    });
  } else {
    body += '<circle cx="72" cy="72" r="61" fill="none" stroke="#292929"/><path d="M11 72H133 M72 11V133 M29 29L115 115 M29 115L115 29" stroke="#222222" stroke-width="1"/>';
    if(silent)return body+'<circle cx="72" cy="72" r="1" fill="#dedede"/>';
    const coords = points.map(([left,right]) => {
      const [x,y] = stereoPoint(left,right);
      return [72 + x*gain*45, 72 - y*gain*45];
    });
    if (kind === 'vectorscope') coords.forEach(([x,y], j) => {
      body += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="1.25" fill="#dedede" opacity="${(0.2+0.8*(j+1)/coords.length).toFixed(2)}"/>`;
    });
    else body += `<path d="${coords.map(([x,y],j)=>`${j?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')}" fill="none" stroke="#dedede" stroke-width="1.25" stroke-opacity="0.95"/>`;
  }
  return body;
}
function render(kind, state = {}, meter = {}, opts = {}) {
  opts={...opts,gateDb:gateThreshold(opts.gateDb),silent:opts.silent??(Number.isFinite(meter.peak)&&meter.peak<=gateThreshold(opts.gateDb))};
  const accent = COLORS[opts.theme] || COLORS.orange;
  const text = (s, y, size = 16, color = '#ffffff') => `<text x="72" y="${y}" text-anchor="middle" fill="${color}" font-family="Arial, sans-serif" font-size="${size}" font-weight="700">${escape(s)}</text>`;
  let content = '';
  if (VISUAL_ACTIONS.includes(kind)) {
    const connected = kind === 'spectrogram' ? opts.spectrum : kind === 'midside' ? opts.stereo : ['vectorscope','reactive'].includes(kind)?opts.audio:kind==='pitch'?opts.pitch:opts.scope;
    if (!connected) content = idle(false);
    else content = renderVisual(kind, meter, opts, text, accent);
  } else if (['lufs', 'peak', 'bands', 'reset'].includes(kind)) {
    if(kind==='reset')content=glyph('reset',accent);
    else if (!opts.audio) content = idle(false);
    else if (kind === 'lufs') {
      const mode = ['m','s','i'].includes(opts.mode) ? opts.mode : 's';
      const val = meter[mode], hot=!opts.silent&&Number.isFinite(val)&&val>opts.target+1;
      const level=opts.silent?0:Math.max(0,Math.min(1,((val??-120)+60)/60));
      content = `<text x="12" y="26" fill="#dedede" font-family="Arial" font-size="12">${mode.toUpperCase()}${mode==='i'?'*':''}</text>` +numericText(opts.silent?'0.0':number(val,opts.gateDb),91,41);
      for(let j=0;j<14;j++)content+=`<rect x="131" y="${125-j*7}" width="3" height="4" fill="${j/14<level?'#dedede':'#202020'}"/>`;
      if(hot)content+='<rect x="12" y="127" width="8" height="2" fill="#f25623"/>';
    } else if (kind === 'peak') {
      content = '<text x="12" y="26" fill="#dedede" font-family="Arial" font-size="12">dBFS</text>'+numericText(opts.silent?'0.0':number(meter.peak,opts.gateDb),91,41)+numericText(opts.silent?'0.0':number(meter.hold,opts.gateDb),126,18);
      if(meter.clip&&!opts.silent)content+='<rect x="131" y="14" width="3" height="116" fill="#f25623"/>';
    } else if (kind === 'reset') content=glyph('reset',accent);
    else {
      const points=(opts.silent?Array(8).fill(-120):meter.bands||[]).slice(0,8).map((db,j)=>[8+j*128/7,132-Math.max(0,Math.min(116,(db+72)/72*116))]);
      const curve=curvePath(points);
      content=`<path d="${curve} L136 136 L8 136Z" fill="#4d4d4d" fill-opacity="0.12"/><path d="${curve}" fill="none" stroke="#dedede" stroke-width="1.2"/>`;
    }
  } else {
    if(!opts.live)state={};
    const track = Array.from(state.track?.name || '').slice(0, 15).join('');
    const active={play:state.playing,record:state.record,sessionrecord:state.session_record,loop:state.loop,click:state.metronome,mute:state.track?.mute,solo:state.track?.solo,arm:state.track?.arm,overdub:state.overdub}[kind];
    const tracked=['mute','solo','arm','prev','next'].includes(kind);
    content=glyph(kind==='play'&&state.playing?'pause':kind,active?accent:'#ffffff',tracked?24:35,tracked?64:74);
    if(kind==='click'){
      const pulse=state.playing?beatPulse(opts.beat??state.song_time??0):0;
      const opacity=state.playing?.42+.58*pulse:.75;
      content=`<g data-metronome-pulse="${pulse.toFixed(3)}" opacity="${opacity.toFixed(3)}">${glyph('click',COLORS.orange)}</g>`;
    }
    if(tracked)content+=text(track,119,12,'#dedede');
    if(['tap','click'].includes(kind)&&opts.live)content+=numericText(Number(state.tempo||0).toFixed(1),132,15,{x:72,align:'middle'});
    if(kind==='scene')content+=text(Array.from(state.scene||'').slice(0,15).join(''),130,11,'#dedede');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" fill="#000000"/>${content}${frozenIcon(opts.frozen)}</svg>`;
}
function oscString(s) { const b = Buffer.from(s + '\0'); return Buffer.concat([b, Buffer.alloc((4 - b.length % 4) % 4)]); }
function encodeOSC(address) { return Buffer.concat([oscString(address), oscString(',')]); }
function decodeOSC(buf,{allowLegacyPitchPrefix=false}={}) {
  let p = 0;
  function str() { const end = buf.indexOf(0, p); if (end < 0) throw Error('Unterminated OSC string'); const s = buf.toString('utf8', p, end); p = (end + 4) & ~3; return s; }
  const address = str();let types = str();
  if (types[0] !== ',') throw Error('Invalid OSC types');
  // Earlier Max devices cap this one known float-only packet at 5096 bytes.
  // A contiguous prefix preserves sample spacing; use it until the device reloads.
  if(allowLegacyPitchPrefix&&address==='/yfc/pitchbuffer'&&buf.length===5096&&/^,f+$/.test(types)&&p+4*(types.length-1)>buf.length){
    const count=Math.floor((buf.length-p)/4);
    if(count<641)throw Error('Insufficient legacy pitch samples');
    types=types.slice(0,count+1);
  }
  const values = [];
  for (const t of types.slice(1)) {
    if(p+4>buf.length)throw Error('Truncated OSC payload');
    if (t === 'f') { values.push(buf.readFloatBE(p)); p += 4; }
    else if (t === 'i') { values.push(buf.readInt32BE(p)); p += 4; }
    else throw Error(`Unsupported OSC type ${t}`);
  }
  return { address, values };
}
module.exports = { render, decodeOSC, encodeOSC, fresh, scopeFromValues, midSideBalance, stereoPoint, VISUAL_ACTIONS };
