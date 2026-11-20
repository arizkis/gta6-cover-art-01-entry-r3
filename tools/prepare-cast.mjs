import { createRequire } from 'node:module';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { launchBrowser } from './studio-browser.mjs';
const require = createRequire(new URL('../../deps/package.json', import.meta.url));
const puppeteer = require('puppeteer-core');
const browser = await launchBrowser(puppeteer);
const page = await browser.newPage();
for (const name of readdirSync('app/samples').filter(n => n.startsWith('cast-'))) {
  const source = 'data:image/jpeg;base64,' + readFileSync('app/samples/' + name).toString('base64');
  const data = await page.evaluate(async source => {
    const image = new Image(); image.src = source; await image.decode();
    const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', .8).split(',')[1];
  }, source);
  writeFileSync('app/samples/' + name, Buffer.from(data, 'base64'));
  console.log(name);
}
await browser.close();
