const path=require('node:path');
const sharp=require(process.env.SHARP_PATH||'sharp');
const directory=path.join(__dirname,'../com.personal.abletondeck.sdPlugin/images');
Promise.all([128,256].map((size,j)=>sharp(path.join(directory,'plugin.svg')).resize(size,size).png().toFile(path.join(directory,j?'plugin@2x.png':'plugin.png')))).catch(e=>{console.error(e);process.exitCode=1});
