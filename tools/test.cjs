const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const directory=path.join(__dirname,'../tests');
const files=fs.readdirSync(directory).filter(name=>name.endsWith('.test.cjs')).sort().map(name=>path.join(directory,name));
if(!files.length)throw new Error('No tests found');
const result=spawnSync(process.execPath,['--test',...files],{stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
