function intervalFor(kind,mode='smooth'){
  const eco=mode==='economy';
  if(kind==='waveform')return eco?50:25;
  if(/^spectrum[1-5]$/.test(kind))return eco?100:50;
  if(['reactive','goniometer','vectorscope'].includes(kind))return eco?100:50;
  if(kind==='spectrogram')return 125;
  if(kind==='click')return eco?100:50;
  return eco?250:125;
}
function renderDue(entry,now,mode){
  if(entry.nextRender!=null&&now<entry.nextRender)return false;
  const expanded=/^spectrum[1-5]$/.test(entry.kind)&&entry.settings?.expanded===true;
  entry.nextRender=now+(expanded?(mode==='economy'?100:50):intervalFor(entry.kind,mode));return true;
}
function nativeImage(svg){return svg.replace(/(<svg\b[^>]*?)width="144" height="144"/, '$1width="72" height="72"');}
module.exports={intervalFor,renderDue,nativeImage};
