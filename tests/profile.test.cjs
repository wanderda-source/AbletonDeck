const {test}=require('node:test'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),path=require('node:path');
test('bundled profile has exactly the HUD layout and contains no personal paths or foreign actions',()=>{
  const script=`import json,sys
from zipfile import ZipFile
with ZipFile(sys.argv[1]) as z:
 data={n:json.loads(z.read(n)) for n in z.namelist()}
 print(json.dumps(data))`;
  const result=spawnSync('python',['-c',script,path.join(__dirname,'../com.personal.abletondeck.sdPlugin/profiles/Wander_scope HUD.streamDeckProfile')],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const data=JSON.parse(result.stdout),raw=JSON.stringify(data);
  assert.doesNotMatch(raw,/Users|A00SA|Disco|com\.barraider|AppData/);
  const page=Object.values(data).find(d=>d.Controllers?.[0]?.Actions),actions=page.Controllers[0].Actions;
  const rows=[['click','peak','reactive','lufs','spectrogram'],['spectrum1','spectrum2','spectrum3','spectrum4','spectrum5'],['goniometer','midside','play','pitch','waveform']];
  assert.equal(Object.keys(actions).length,15);
  rows.forEach((row,y)=>row.forEach((kind,x)=>assert.equal(actions[`${x},${y}`].UUID,'com.personal.abletondeck.'+kind)));
  const manifest=require('../com.personal.abletondeck.sdPlugin/manifest.json');
  assert.equal(manifest.Profiles[0].DeviceType,0);assert.equal(manifest.Profiles[0].AutoInstall,true);
  assert.equal(manifest.Profiles[0].Readonly,false);
});
