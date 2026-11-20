// Velvet Hour Cover Studio's standard-library submission entry point.
// Validate every screenshot before copying any submission files.
// Report the app's asset and source totals, enforce the competition caps,
// then retain the kit's deterministic dossier construction and output layout.
// Use MAKEFUN_OUTPUT_DIR=out node main.ts for a local submission build.

import { cpSync, existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function screenshotDimensions(bytes: Buffer): [number, number] {
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  }
  if (bytes[0] !== 255 || bytes[1] !== 216) throw new Error('Screenshot is not PNG or JPEG');
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset++] !== 255) continue;
    const marker = bytes[offset++];
    if (marker === 255) { offset--; continue; }
    if (marker === 216 || marker === 1) continue;
    if (marker === 217 || marker === 218) break;
    const length = bytes.readUInt16BE(offset);
    if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)) {
      return [bytes.readUInt16BE(offset + 5), bytes.readUInt16BE(offset + 3)];
    }
    if (length < 2) break;
    offset += length;
  }
  throw new Error('Cannot find screenshot dimensions');
}

function validateScreenshots() {
  const names = readdirSync(join(here, 'screenshots')).filter(name => /\.(jpg|jpeg|png)$/i.test(name));
  if (names.length < 3 || names.length > 4) throw new Error('Provide 3–4 screenshots');
  for (const name of names) {
    const bytes = readFileSync(join(here, 'screenshots', name));
    const [width, height] = screenshotDimensions(bytes);
    if (bytes.length > 256 * 1024 || Math.max(width,height) > 1280 || Math.min(width,height) < 480) {
      throw new Error(`Screenshot cap exceeded: ${name}: ${width}x${height}, ${bytes.length} bytes; need ≤256 KiB, long side ≤1280, short side ≥480`);
    }
  }
}

validateScreenshots();

function appManifest(directory: string): { files: number; bytes: number; source: number } {
  const totals = { files: 0, bytes: 0, source: 0 };
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      const child = appManifest(path);
      totals.files += child.files;
      totals.bytes += child.bytes;
      totals.source += child.source;
    } else {
      const size = statSync(path).size;
      totals.files++;
      totals.bytes += size;
      if (/\.(html|js|css|json)$/.test(entry.name)) totals.source += size;
    }
  }
  return totals;
}

const manifest = appManifest(join(here, 'app'));
if (manifest.files > 993 || manifest.bytes > 48 * 1024 * 1024 || manifest.source > 150 * 1024) {
  throw new Error(`App exceeds competition caps: ${JSON.stringify(manifest)}`);
}
console.log(`Velvet Hour manifest: ${manifest.files} app files, ${manifest.bytes} bytes, ${manifest.source} source bytes; screenshots validated.`);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
