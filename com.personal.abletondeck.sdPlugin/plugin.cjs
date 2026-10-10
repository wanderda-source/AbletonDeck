const WebSocket = require('./node_modules/ws');
const dgram = require('node:dgram');
const fs = require('node:fs');
const path = require('node:path');
const { render, decodeOSC, encodeOSC, fresh, scopeFromValues, VISUAL_ACTIONS } = require('./shared.cjs');
const {Spectrum,renderSpectrum,isSpectrum}=require('./spectrum.cjs');
const spectrum=new Spectrum();
const {resolveTheme,nextTheme,themeName,applyTheme}=require('./themes.cjs');
const {renderDue,nativeImage}=require('./performance.cjs');
let globalSettings={theme:'orange',performance:'smooth'};
function invalidate(){for(const entry of contexts.values())entry.nextRender=0;}
function updateGlobal(value){globalSettings={...globalSettings,...value,theme:themeName(value.theme??globalSettings.theme),performance:value.performance==='economy'?'economy':'smooth'};invalidate();}
const {Spectrogram}=require('./spectrogram.cjs');
const spectrogram=new Spectrogram();
const spectrogramGate=new (require('./display.cjs').DisplayGate)();
const {FFTFrames,StereoFFT}=require('./fft.cjs');
const fftFrames=new FFTFrames(),fft=new StereoFFT();let fftTime=0;
const {detectPitch,PitchFrames}=require('./pitch.cjs');
const pitchFrames=new PitchFrames();
const {DEFAULT_GATE,gateThreshold,DisplayGate,TriggerScope}=require('./display.cjs');
const triggerScope=new TriggerScope();
const {LoudnessHistory}=require('./history.cjs');
const history=new LoudnessHistory();
const {BeatClock}=require('./beat.cjs');
const beatClock=new BeatClock();
const {ReactiveFlow}=require('./music-visuals.cjs');
let pitchTime=0;
let rawWaveTime=0;
const connectionFile=path.join(__dirname,'meter-connection.json');
let known={};
try{if(!process.env.ABLETONDECK_TEST_PORT_BASE)known=JSON.parse(fs.readFileSync(connectionFile,'utf8').replace(/^\uFEFF/,''));}catch(_){}
function remember(kind){
  if(known[kind]===true)return;
  known[kind]=true;
  invalidate();
  try{if(!process.env.ABLETONDECK_TEST_PORT_BASE)fs.writeFileSync(connectionFile,JSON.stringify(known));}catch(e){log(e);}
}
const argv = process.argv.slice(2);
function arg(k) { return argv[argv.indexOf(k) + 1]; }
const contexts = new Map();
const inspectors=new Set();
function notifyAppearance(){for(const context of inspectors)send('sendToPropertyInspector',context,{type:'appearance',settings:globalSettings});}
let state = {}, meter = {}, stateTime = 0, meterTime = 0, scopeTime = 0, stereoTime = 0;
const portBase = Number(process.env.ABLETONDECK_TEST_PORT_BASE || 17940);
const udp = dgram.createSocket('udp4');
let websocket;
const packetStats={};let statusTime=0,meterStatus=null;
function log(e) {
  try { fs.appendFileSync(path.join(__dirname, 'plugin.log'), `${new Date().toISOString()} ${String(e)}\n`); } catch (_) {}
}
function send(event, context, payload) {
  if (websocket?.readyState === WebSocket.OPEN) websocket.send(JSON.stringify({ event, context, payload }));
}
function command(name) {
  if (!fresh(stateTime)) return false;
  udp.send(Buffer.from(JSON.stringify({ v: 1, command: name })), portBase, '127.0.0.1');
  return true;
}
udp.on('error', log);
udp.on('listening',()=>{try{udp.setRecvBufferSize(4*1024*1024);}catch(e){log(e);}});
udp.on('message', (buf, rinfo) => {
  if (rinfo.address !== '127.0.0.1' || buf.length > 8192) return;
  try {
    if (buf[0] === 123) {
      const msg = JSON.parse(buf.toString());
      if (msg.v !== 1 || msg.type !== 'state') return;
      state = msg; stateTime = Date.now();beatClock.receive(state,stateTime);
    } else {
      const msg = decodeOSC(buf,{allowLegacyPitchPrefix:true});
      packetStats[msg.address]=(packetStats[msg.address]||0)+1;
      if(msg.address==='/yfc/status'){meterStatus=msg.values;return;}
      if(msg.address==='/yfc/fftchunk'||msg.address==='/yfc/fftchunk2'){
        const frame=msg.address==='/yfc/fftchunk2'?fftFrames.receive(msg.values.slice(1),Date.now(),msg.values[0]):fftFrames.receive(msg.values);
        if(frame&&[...contexts.values()].some(e=>isSpectrum(e.kind)||e.kind==='spectrogram')){const result=fft.analyze(frame.samples,frame.rate);if(result){
          spectrum.receive(result.values,Date.now(),result);
          spectrogram.receive(result.values,Date.now());
          if(!fftTime&&!process.env.ABLETONDECK_TEST_PORT_BASE){
            try{fs.writeFileSync(path.join(__dirname,'fft-diagnostics.json'),JSON.stringify({mode:'fft',rate:frame.rate,points:result.values.length,binHz:result.binHz,windowMs:result.windowMs,receivedAt:new Date().toISOString()}));}catch(e){log(e);}
          }
          fftTime=Date.now();remember('spectrum');
        }}
      }else if(msg.address==='/yfc/pitchbuffer'||msg.address==='/yfc/pitchchunk'){
        const frame=msg.address==='/yfc/pitchchunk'?pitchFrames.receive(msg.values):{rate:msg.values[0],samples:msg.values.slice(1)};
        if(!frame||![...contexts.values()].some(e=>['pitch','waveform'].includes(e.kind)))return;
        const {rate,samples}=frame;
        if(rate<8000||rate>16000||samples.length<640||samples.length>1400||!msg.values.every(Number.isFinite))return;
        const now=Date.now();
        let pitch=meter.pitch;
        if(now-pitchTime>=90){pitch=detectPitch(samples,rate);pitchTime=now;}
        meter={...meter,pitch,triggerWave:triggerScope.receive(samples,rate,pitch?.hz)};rawWaveTime=now;remember('pitch');
      }else if (msg.address === '/yfc/spectrum') {
        if(!fresh(fftTime)&&spectrum.receive(msg.values)){spectrogram.receive(msg.values);remember('spectrum');}
      } else if (msg.address === '/yfc/scope') {
        const scope = scopeFromValues(msg.values);
        if (!scope) return;
        remember('scope');
        scope.trail = [...(fresh(scopeTime) ? meter.scope?.trail || [] : []), ...scope.samples].slice(-384);
        let triggerWave=meter.triggerWave;
        if(Date.now()-rawWaveTime>150){
          const power=c=>scope.samples.reduce((sum,p)=>sum+p[c]*p[c],0);
          const channel=power(0)>=power(1)?0:1;
          triggerWave=triggerScope.receive(scope.samples.map(p=>p[channel]),scope.samples.length*1000/scope.windowMs);
        }
        meter = { ...meter, scope,triggerWave }; scopeTime = Date.now();
      } else if (msg.address === '/yfc/meter') {
        if (![14,16].includes(msg.values.length) || !msg.values.every(Number.isFinite)) return;
        const [m, s, i, peak, hold, clip] = msg.values;
        const [midPower,sidePower] = msg.values.slice(14);
        if (msg.values.length === 16 && (midPower < 0 || sidePower < 0)) return;
        remember('audio');if(msg.values.length===16)remember('stereo');
        const now=Date.now();
        meter = { ...meter, m, s, i, peak, hold, clip, bands: msg.values.slice(6,14), midPower,sidePower }; meterTime = now;
        stereoTime = msg.values.length === 16 ? Date.now() : 0;
      }
    }
  } catch (e) { log(e); }
});
udp.bind(portBase + 1, '127.0.0.1');
function redraw() {
  if(!contexts.size)return;
  const now=Date.now();
  if(!process.env.ABLETONDECK_TEST_PORT_BASE&&now-statusTime>2000){
    statusTime=now;
    try{fs.writeFileSync(path.join(__dirname,'runtime-status.json'),JSON.stringify({at:new Date(now).toISOString(),packets:packetStats,meterStatus,fftTime,fftPending:[...fftFrames.frames.values()].map(f=>({count:f.count,total:f.total,rate:f.rate})),fftSession:fftFrames.session,audioFresh:fresh(meterTime),scopeFresh:fresh(scopeTime),spectrumFresh:fresh(spectrum.time),spectrumFrozen:!!spectrum.frozen}));}catch(e){log(e);}
  }
  meter={...meter,history:history.tick(fresh(meterTime,now)?meter:{},known.audio===true,now,DEFAULT_GATE),historyTime:now};
  spectrum.tick(now);
  if([...contexts.values()].some(e=>e.kind==='spectrogram'))spectrogram.tick(now,spectrogramGate.update(fresh(meterTime)?meter.peak:NaN,DEFAULT_GATE),true);
  for (const [context, entry] of contexts) {
    if(!renderDue(entry,now,globalSettings.performance))continue;
    const gateDb=gateThreshold(entry.settings.gateDb);
    const silent=(entry.displayGate??=new DisplayGate()).update(fresh(meterTime)?meter.peak:NaN,gateDb);
    const options = {
      live: fresh(stateTime), beat:beatClock.visualAt(now), audio: known.audio===true, mode: entry.settings.mode || 's',
      stereo: known.stereo===true, scope: known.scope===true, frozen: !!entry.frozenMeter,
      pitch:known.pitch===true,spectrum:known.spectrum===true,
      silent:known.audio===true&&silent,gateDb,scopeMode:entry.settings.scopeMode||'triggered',
      visualStyle:entry.settings.visualStyle||'particles',theme: resolveTheme(entry.settings.theme,globalSettings.theme),performance:globalSettings.performance, target: Number(entry.settings.target ?? -14)
    };
    let drawMeter=entry.kind==='pitch'&&!fresh(pitchTime)?{...meter,pitch:null}:meter;
    if(entry.kind==='spectrogram'&&!entry.frozenMeter)drawMeter={...drawMeter,spectrogram:spectrogram.snapshot(resolveTheme(entry.settings.theme,globalSettings.theme))};
    if(entry.kind==='reactive'&&!entry.frozenMeter){
      const flow=(entry.flow??=new ReactiveFlow());
      drawMeter={...drawMeter,flow:flow.tick(meter,options.silent,now)};
    }
    let svg = entry.kind==='theme'?render('theme',{}, {},options):isSpectrum(entry.kind) ? renderSpectrum(Number(entry.kind.slice(-1))-1,spectrum.snapshot(),{connected:known.spectrum===true,audio:options.audio,frozen:!!spectrum.frozen,silent:!spectrum.frozen&&(options.silent||!fresh(spectrum.time))}) : render(entry.kind, state, entry.frozenMeter || drawMeter, entry.frozenMeter ? { ...options, ...entry.frozenOptions, frozen:true,animationTime:entry.frozenTime } : options);
    svg=applyTheme(svg,options.theme,{visual:VISUAL_ACTIONS.includes(entry.kind)||isSpectrum(entry.kind)||entry.kind==='bands'});
    svg=nativeImage(svg);
    if (svg === entry.lastImage) continue;
    entry.lastImage = svg;
    send('setImage', context, { image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, target: 0 });
    if(!entry.titleCleared){send('setTitle', context, { title: '', target: 0 });entry.titleCleared=true;}
  }
}
if (arg('-port') && arg('-pluginUUID')) {
  websocket = new WebSocket(`ws://127.0.0.1:${arg('-port')}`);
  websocket.on('open', () => {
    websocket.send(JSON.stringify({ event: arg('-registerEvent'), uuid: arg('-pluginUUID') }));
    send('getGlobalSettings',arg('-pluginUUID'),{});
  });
  websocket.on('error', log);
  websocket.on('close', () => { udp.close(); process.exit(0); });
  websocket.on('message', raw => {
    try {
      const msg = JSON.parse(raw.toString());
      if(msg.event==='propertyInspectorDidAppear'){inspectors.add(msg.context);notifyAppearance();}
      else if(msg.event==='propertyInspectorDidDisappear'){inspectors.delete(msg.context);}
      else if(msg.event==='sendToPlugin'&&msg.payload?.type==='appearanceQuery'){inspectors.add(msg.context);notifyAppearance();}
      else if(msg.event==='didReceiveGlobalSettings'){updateGlobal(msg.payload.settings||{});notifyAppearance();}
      else if(msg.event==='sendToPlugin'&&msg.payload?.type==='appearance'){
        updateGlobal(msg.payload.settings||{});send('setGlobalSettings',arg('-pluginUUID'),globalSettings);notifyAppearance();
      }else if (msg.event === 'willAppear') {
        contexts.set(msg.context, { kind: msg.action.split('.').pop(), settings: msg.payload.settings || {} });
      } else if (msg.event === 'willDisappear') contexts.delete(msg.context);
      else if (msg.event === 'didReceiveSettings') {
        const entry = contexts.get(msg.context);
        if (entry) {entry.settings = msg.payload.settings || {};entry.nextRender=0;}
      } else if (msg.event === 'keyDown') {
        const entry = contexts.get(msg.context);
        if (entry) entry.down = Date.now();
      } else if (msg.event === 'keyUp') {
        const entry = contexts.get(msg.context);
        if (!entry || !entry.down) return;
        const held = Date.now() - entry.down >= 650;
        entry.down = 0;
        entry.nextRender=0;
        if(entry.kind==='click')return;
        if(entry.kind==='theme'){
          globalSettings.theme=nextTheme(globalSettings.theme);invalidate();
          send('setGlobalSettings',arg('-pluginUUID'),globalSettings);
          notifyAppearance();
        }else
        if (isSpectrum(entry.kind)) {
          if(!spectrum.toggle())send('showAlert',msg.context,{});
        } else if (['lufs', 'peak'].includes(entry.kind) && held || entry.kind === 'reset') {
          if (!fresh(meterTime)) send('showAlert', msg.context, {});
          else udp.send(encodeOSC('/yfc/reset'), portBase + 2, '127.0.0.1');
        } else if (entry.kind === 'lufs') {
          const modes = ['s', 'm', 'i'];
          entry.settings.mode = modes[(modes.indexOf(entry.settings.mode || 's') + 1) % modes.length];
          send('setSettings', msg.context, entry.settings);
        } else if (VISUAL_ACTIONS.includes(entry.kind)) {
          if (held) {
            entry.settings.theme = nextTheme(resolveTheme(entry.settings.theme,globalSettings.theme));
            send('setSettings', msg.context, entry.settings);
          } else if (entry.frozenMeter) { entry.frozenMeter = null; entry.frozenOptions = null; }
          else if (entry.kind === 'spectrogram' ? fresh(spectrum.time) : entry.kind === 'midside' ? fresh(stereoTime) : entry.kind === 'pitch'?fresh(pitchTime):['vectorscope','reactive'].includes(entry.kind) ? fresh(meterTime) : fresh(scopeTime)) {
            entry.frozenMeter = { ...meter,spectrogram:spectrogram.snapshot(resolveTheme(entry.settings.theme,globalSettings.theme)),flow:entry.flow?.snapshot() };
            entry.frozenTime=Date.now()/1000;
            entry.frozenOptions = {audio:meterTime>0,stereo:stereoTime>0,scope:scopeTime>0,pitch:known.pitch===true,silent:entry.displayGate?.update(meter.peak,gateThreshold(entry.settings.gateDb))??false};
          } else send('showAlert', msg.context, {});
        } else if (entry.kind === 'bands') {
          entry.settings.theme = nextTheme(resolveTheme(entry.settings.theme,globalSettings.theme));
          send('setSettings', msg.context, entry.settings);
        } else if (entry.kind !== 'peak' && !command(entry.kind)) send('showAlert', msg.context, {});
      }
      redraw();
    } catch (e) { log(e); }
  });
  setInterval(redraw,25);
} else {
  log('Missing Stream Deck launch arguments');
  udp.close();
}
