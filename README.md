[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/arizkis/gta6-cover-art-01-entry-r3/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/arizkis/gta6-cover-art-01-entry-r3/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Velvet Hour Cover Studio

Eight lives. One coastline. A cover with your name on it.

An offline desktop photo studio for cinematic, multi-panel coastal cover art.
Bring your own photos and caption, cast your characters, then export a complete
poster in three sizes. All compositing happens in Canvas 2D on your machine.

## Run

Use Node 22 or newer:

```sh
node serve.ts
```

Open http://localhost:8080. No installation, account, API key, or internet
connection is needed. The app bundles its photos and three OFL fonts locally.

1. Click a panel on the cover to select it.
2. Choose a cast photo, or use **Add your photo** to open your own image.
3. Drag the panel to pan its crop, then use Zoom for a closer composition.
4. Write a title, script subtitle, tagline, character name, and micro-bio.
5. Choose a layout and colour grade. Fine-tune grain, glow, and vignette.
6. Export a square, portrait, or landscape PNG, or all three at once.

Your browser may ask whether to allow multiple downloads for the all-sizes
button. Individual export buttons always remain available.

## Art direction

- Syndicate 7: a dominant frame-breaking hero, two left panels, four supporting panels.
- Collage: an alternate ensemble composition.
- Strip: seven equal vertical film frames.
- Sundown, Neon Night, Golden Hour, Tropic Teal, Heatwave, and Ultraviolet grades.
- Retro sunset chrome title with pinstripes, dark outline, and teal extrusion.
- Pink neon Pacifico subtitle and gold double-rule frames.
- Slanted character labels with individual location, time, and micro-bio.
- Newspaper pull-quote, camera seal, billing block, and deterministic barcode.

Exports adapt the composition to 1080×1080, 1080×1350, and 1920×1080.
Selection guides appear only in the editor and never in a downloaded poster.
The eight prepared cast photos and two starter location photos are included
so the studio opens with a complete composition.

## Reproducible scenes

The `shot=export` route renders only the poster. It also exposes the app's own
PNG export through `window.__exportDataUrl`. Parameters select cast A, B, or C,
grade, width, and height. Cast B has its own title and newspaper quotation.
The `shot=editor` route opens the complete studio with the hero selected.

```sh
node tools/render-shots.mjs
node tools/verify-studio.mjs
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
```

The developer tools use the competition environment's external
`../deps/node_modules/puppeteer-core` and cached Chrome. They output only binary
images and terminal diagnostics. No dependency installation is required here.

`main.ts` validates all screenshot dimensions and byte sizes before copying
the app and screenshots, logs app totals, and writes the kit dossier to `out/`.

## Source map

- `app/src/studio-state.js`: original copy, cast definitions, grades, local assets.
- `app/src/render-poster.js`: shared photo composition and poster drawing functions.
- `app/src/main.js`: uploads, selected-panel editing, panning, controls, downloads.
- `app/src/shots.js`: deterministic screenshot scenes using the shared PNG exporter.
- `tools/prepare-cast.mjs`: canvas-based JPEG asset resizing.
- `tools/render-shots.mjs`: four size-capped JPEG screenshots.
- `tools/verify-studio.mjs`: real-browser interaction and downloaded PNG checks.

## Assets and authorship

All newly authored repository text was created with explicit `apply_patch`
calls, including the font license, configuration, and tools. Font binaries
were downloaded from Google Fonts; cast JPEGs were copied from the prepared
cast source and resized locally. The kit's LICENSE, serve.ts, and vendored
dossier builder are unchanged. No Rockstar artwork, characters, logo, or fonts
are used. App code is MIT licensed; fonts use SIL OFL 1.1 in `app/fonts/OFL.txt`.
