import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { launchBrowser, serveStudio } from './studio-browser.mjs';
const require = createRequire(new URL('../../deps/package.json', import.meta.url));
const puppeteer = require('puppeteer-core');
const {server,url}=await serveStudio();
const browser=await launchBrowser(puppeteer);
try {
  const scenes=[
    ['1-cover.jpg','?shot=export&cast=A&grade=sundown&w=1920&h=1080',1280,720],
    ['2-editor.jpg','?shot=editor&cast=A',1280,720],
    ['3-cover.jpg','?shot=export&cast=B&grade=neon-night&w=1080&h=1350',1024,1280],
    ['4-cover.jpg','?shot=export&cast=C&grade=golden-hour&w=1080&h=1080',1080,1080]
  ];
  for(const [name,query,width,height] of scenes){
    const page=await browser.newPage();await page.setViewport({width,height,deviceScaleFactor:1});
    await page.goto(url+'/'+query);await page.waitForFunction(()=>window.__ready);
    let bytes;
    if(query.includes('shot=export')){
      const encoded=await page.evaluate(async({width,height})=>{
        const image=new Image();image.src=window.__exportDataUrl;await image.decode();
        const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(image,0,0,width,height);
        let quality=.85,data;
        do{data=canvas.toDataURL('image/jpeg',quality);quality-=.05;}while(atob(data.split(',')[1]).length>250*1024&&quality>.25);
        return data.split(',')[1];
      },{width,height});bytes=Buffer.from(encoded,'base64');
    }else{
      for(let quality=85;quality>=25;quality-=5){bytes=await page.screenshot({type:'jpeg',quality});if(bytes.length<=250*1024)break;}
    }
    if(bytes.length>250*1024)throw Error(`${name} exceeds 250 KiB`);
    writeFileSync('screenshots/'+name,bytes);console.log(`${name}: ${width} × ${height}, ${bytes.length} bytes`);await page.close();
  }
}finally{await browser.close();server.close();}
