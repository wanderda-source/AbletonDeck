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
  const expanded=spawnSync('python',['-c',script,path.join(__dirname,'../com.personal.abletondeck.sdPlugin/profiles/Wander_scope Spectrogram.streamDeckProfile')],{encoding:'utf8'});
  assert.equal(expanded.status,0,expanded.stderr);
  const tiles=Object.values(JSON.parse(expanded.stdout)).find(d=>d.Controllers?.[0]?.Actions).Controllers[0].Actions;
  assert.equal(Object.keys(tiles).length,15);
  for(let y=0;y<3;y++)for(let x=0;x<5;x++){
    assert.equal(tiles[`${x},${y}`].UUID,'com.personal.abletondeck.spectrogram');
    assert.deepEqual(tiles[`${x},${y}`].Settings,{expanded:true,tileX:x,tileY:y,theme:'global'});
  }
  assert.equal(manifest.Profiles[1].Readonly,true);
  const spectrum=spawnSync('python',['-c',script,path.join(__dirname,'../com.personal.abletondeck.sdPlugin/profiles/Wander_scope Spectrum.streamDeckProfile')],{encoding:'utf8'});
  assert.equal(spectrum.status,0,spectrum.stderr);
  const spectrumTiles=Object.values(JSON.parse(spectrum.stdout)).find(d=>d.Controllers?.[0]?.Actions).Controllers[0].Actions;
  assert.equal(Object.keys(spectrumTiles).length,15);
  for(let y=0;y<3;y++)for(let x=0;x<5;x++){
    assert.equal(spectrumTiles[`${x},${y}`].UUID,`com.personal.abletondeck.spectrum${x+1}`);
    assert.deepEqual(spectrumTiles[`${x},${y}`].Settings,{expanded:true,tileY:y,theme:'global'});
  }
  assert.equal(manifest.Profiles[2].Readonly,true);
});
