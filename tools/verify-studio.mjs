import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { launchBrowser, serveStudio } from './studio-browser.mjs';

const require = createRequire(new URL('../../deps/package.json', import.meta.url));
const puppeteer = require('puppeteer-core');
const { server, url } = await serveStudio();
const browser = await launchBrowser(puppeteer);
const downloads = mkdtempSync(join(tmpdir(), 'velvet-hour-exports-'));
const errors = [];

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  // Block every nonlocal request. Uploaded photos must work without a service.
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().startsWith(url) || /^(data:|blob:)/.test(request.url())) {
      request.continue();
    } else {
      errors.push('Unexpected remote request: ' + request.url());
      request.abort();
    }
  });

  const client = await page.createCDPSession();
  await client.send('Browser.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloads
  });

  await page.goto(url);
  await page.waitForFunction(() => window.__ready);
  assert.equal(await page.$$eval('.photo-tile', tiles => tiles.length), 10);

  // Grade pickers must change actual rendered pixels and stay synchronized.
  const gradeImages = new Set();
  for (const grade of ['sundown', 'neon-night', 'golden-hour', 'tropic-teal', 'heatwave', 'ultraviolet']) {
    await page.select('#grade', grade);
    assert.equal(await page.$eval('#header-grade', element => element.value), grade);
    gradeImages.add(await page.$eval('#preview', canvas => canvas.toDataURL()));
  }
  assert.equal(gradeImages.size, 6);

  for (const layout of ['Collage', 'Strip', 'Syndicate 7']) {
    await page.select('#header-layout', layout);
    assert.equal(await page.$eval('#layout', element => element.value), layout);
  }

  // Upload through the real file input; no app-only shortcut is used here.
  const input = await page.$('#upload');
  await input.uploadFile(resolve('app/samples/pier.jpg'));
  await page.waitForFunction(() => window.studio.photos.length === 11);
  assert.equal(await page.evaluate(() => window.studio.state.panels[0].photo), 'upload-10');

  await page.$eval('#zoom', input => {
    input.value = '1.7';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  assert.equal(await page.evaluate(() => window.studio.state.panels[0].zoom), 1.7);

  const beforePan = await page.$eval('#preview', canvas => canvas.toDataURL());
  const bounds = await (await page.$('#preview')).boundingBox();
  const x = bounds.x + bounds.width * .48;
  const y = bounds.y + bounds.height * .35;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 35, y + 20, { steps: 4 });
  await page.mouse.up();

  assert.ok(await page.evaluate(() => window.studio.state.panels[0].x > 0));
  assert.notEqual(await page.$eval('#preview', canvas => canvas.toDataURL()), beforePan);

  for (const [id, value] of [['title', 'COASTAL ALIBI'], ['subtitle', 'your city, your story'], ['tagline', 'ONE LAST SUNSET'], ['panel-name', 'THE NEWCOMER'], ['panel-bio', 'PIER NINE · 7:00 PM · JUST ARRIVED']]) {
    await page.$eval('#' + id, (input, value) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
  }

  for (const id of ['strength', 'grain', 'glow', 'vignette']) {
    await page.$eval('#' + id, input => {
      input.value = '75';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    assert.equal(await page.evaluate(id => window.studio.state[id], id), 75);
  }

  for (const size of ['1080,1350', '1080,1080', '1920,1080']) {
    await page.click(`[data-size="${size}"]`);
    const ratio = await page.$eval('#preview', canvas => canvas.width / canvas.height);
    const [w, h] = size.split(',').map(Number);
    assert.ok(Math.abs(ratio - w / h) < .001);
  }

  await page.click('#export-all');
  for (let attempt = 0; attempt < 60; attempt++) {
    if (readdirSync(downloads).filter(name => name.endsWith('.png')).length === 3) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  const files = readdirSync(downloads).filter(name => name.endsWith('.png'));
  assert.equal(files.length, 3, 'Export all must download all three PNGs');
  const dimensions = files.map(name => {
    const bytes = readFileSync(join(downloads, name));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
  }).sort();
  assert.deepEqual(dimensions, ['1080x1080', '1080x1350', '1920x1080']);

  // A shot scene exposes the very same PNG as an explicit public export.
  await page.goto(url + '/?shot=export&cast=B&grade=neon-night&w=1080&h=1350');
  await page.waitForFunction(() => window.__ready);
  assert.equal(await page.evaluate(() => window.__exportDataUrl === window.studio.exportPng(1080, 1350)), true);
  assert.equal(await page.evaluate(() => window.studio.state.quote), 'THE CITY KEEPS ITS BOOKS IN NEON');
  assert.deepEqual(errors, []);
  console.log('PASS: local upload, six grades, three layouts, pan, zoom, copy, look sliders, aspect ratios, three downloaded PNGs, shared scene export, zero browser errors or remote requests.');
} finally {
  await browser.close();
  server.close();
  rmSync(downloads, { recursive: true, force: true });
}
