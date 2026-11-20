import { grades } from './studio-state.js';

const GOLD = '#e8c780';
const INK = '#071c23';
let noiseCanvas;

export function getPanelGeometry(width, height, layout = 'Syndicate 7') {
  const landscape = width / height > 1.3;
  const portrait = height / width > 1.1;
  let boxes;

  if (landscape) {
    boxes = [
      [.335, 0, .307, .77],
      [.02, .115, .307, .317],
      [.02, .442, .307, .328],
      [.65, .115, .159, .317],
      [.817, .115, .163, .317],
      [.65, .442, .159, .328],
      [.817, .442, .163, .328]
    ];
  } else if (portrait) {
    boxes = [
      [.35, 0, .63, .435],
      [.02, .105, .32, .16],
      [.02, .275, .32, .16],
      [.02, .445, .475, .145],
      [.505, .445, .475, .145],
      [.02, .60, .475, .145],
      [.505, .60, .475, .145]
    ];
  } else {
    boxes = [
      [.335, 0, .365, .715],
      [.02, .11, .305, .295],
      [.02, .415, .305, .30],
      [.71, .11, .13, .295],
      [.85, .11, .13, .295],
      [.71, .415, .13, .30],
      [.85, .415, .13, .30]
    ];
  }

  if (layout === 'Collage') {
    boxes = [
      [.30, .08, .40, .65],
      [.02, .11, .27, .30],
      [.02, .42, .27, .31],
      [.71, .11, .27, .15],
      [.71, .27, .27, .15],
      [.71, .43, .27, .15],
      [.71, .59, .27, .14]
    ];
  }

  if (layout === 'Strip') {
    boxes = Array.from({ length: 7 }, (_, index) => [
      .02 + index * .138,
      .12,
      .13,
      .60
    ]);
  }

  return boxes.map(([x, y, w, h]) => ({
    x: x * width,
    y: y * height,
    w: w * width,
    h: h * height
  }));
}

function fitText(ctx, text, font, size, maxWidth) {
  ctx.font = `${size}px ${font}`;
  const measured = Math.max(1, ctx.measureText(text).width);
  return size * Math.min(1, maxWidth / measured);
}

function line(ctx, x1, y1, x2, y2, color = GOLD, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function drawGradedPhotoPanel(ctx, photo, panel, box, state) {
  const { x, y, w, h } = box;
  const image = photo.image;
  const scale = Math.max(w / image.width, h / image.height) * panel.zoom;
  const dw = image.width * scale;
  const dh = image.height * scale;
  const dx = x + (w - dw) / 2 + panel.x * Math.max(0, (dw - w) / 2);
  const dy = y + (h - dh) / 2 + panel.y * Math.max(0, (dh - h) / 2);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // Blend the filtered photo over its original to make strength continuous.
  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.globalAlpha = state.strength / 100;
  ctx.filter = grades[state.grade].filter;
  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.filter = 'none';

  const overlay = ctx.createLinearGradient(x, y, x + w, y + h);
  const colors = grades[state.grade].colors;
  overlay.addColorStop(0, colors[0]);
  overlay.addColorStop(.55, colors[1]);
  overlay.addColorStop(1, colors[2]);

  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = state.strength / 170;
  ctx.fillStyle = overlay;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  const vignette = ctx.createRadialGradient(
    x + w * .5,
    y + h * .4,
    w * .1,
    x + w * .5,
    y + h * .4,
    Math.max(w, h) * .8
  );
  vignette.addColorStop(0, '#001d2200');
  vignette.addColorStop(1, `rgba(0,12,22,${state.vignette / 120})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(x, y, w, h);

  const shade = ctx.createLinearGradient(0, y + h * .65, 0, y + h);
  shade.addColorStop(0, '#05171d00');
  shade.addColorStop(1, '#05171de8');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.globalAlpha = .6;
  ctx.lineWidth = .6;
  ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
  ctx.globalAlpha = 1;
}

export function drawPanelNameTag(ctx, panel, box, unit) {
  const { x, y, w, h } = box;
  const tagHeight = Math.min(unit * .065, h * .26);
  const base = y + h - tagHeight - 8;
  const nameSize = fitText(ctx, panel.name, 'Bebas', unit * .032, w - 31);

  ctx.fillStyle = '#071b21eb';
  ctx.beginPath();
  ctx.moveTo(x + 8, base);
  ctx.lineTo(x + w - 13, base);
  ctx.lineTo(x + w - 23, base + tagHeight);
  ctx.lineTo(x + 8, base + tagHeight);
  ctx.fill();

  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(x + 9, base);
  ctx.lineTo(x + 14, base);
  ctx.lineTo(x + 10, base + tagHeight);
  ctx.lineTo(x + 5, base + tagHeight);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.font = `${nameSize}px Bebas`;
  ctx.fillStyle = '#fff0d1';
  ctx.fillText(panel.name, x + 22, base + tagHeight * .52);

  const bioSize = fitText(ctx, panel.bio, 'Bebas', unit * .0115, w - 34);
  ctx.font = `${bioSize}px Bebas`;
  ctx.fillStyle = '#ddcfae';
  ctx.fillText(panel.bio, x + 22, base + tagHeight * .83);
}

export function drawRetroChromeTitle(ctx, title, width, height, portrait) {
  const unit = Math.min(width, height);
  const center = width * (portrait ? .5 : .405);
  const maxWidth = width * (portrait ? .91 : .76);
  const baseline = height * (portrait ? .845 : .825);
  const size = fitText(ctx, title, 'Anton', unit * (portrait ? .145 : .18), maxWidth);

  // A separate fill layer keeps the pinstripes inside the letter shapes.
  const layer = document.createElement('canvas');
  layer.width = width;
  layer.height = height;
  const titleContext = layer.getContext('2d');
  titleContext.textAlign = 'center';
  titleContext.font = `${size}px Anton`;

  const gradient = titleContext.createLinearGradient(
    0,
    baseline - size * .9,
    0,
    baseline
  );
  gradient.addColorStop(0, '#fff8d6');
  gradient.addColorStop(.3, '#ffd278');
  gradient.addColorStop(.52, '#fa9770');
  gradient.addColorStop(.68, '#ef668b');
  gradient.addColorStop(1, '#9a79be');

  titleContext.fillStyle = gradient;
  titleContext.fillText(title, center, baseline);
  titleContext.globalCompositeOperation = 'source-atop';
  titleContext.fillStyle = '#532e544a';

  for (let y = baseline - size; y < baseline; y += Math.max(3, unit * .004)) {
    titleContext.fillRect(0, y, width, 1);
  }

  ctx.save();
  ctx.translate(center, baseline);
  ctx.rotate(-.018);
  ctx.translate(-center, -baseline);
  ctx.font = `${size}px Anton`;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';

  ctx.lineWidth = unit * .025;
  ctx.strokeStyle = '#004e58';
  ctx.strokeText(title, center + unit * .008, baseline + unit * .012);

  ctx.lineWidth = unit * .016;
  ctx.strokeStyle = '#051720';
  ctx.strokeText(title, center, baseline);

  ctx.lineWidth = unit * .002;
  ctx.strokeStyle = '#ffdd9f';
  ctx.strokeText(title, center, baseline);
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

export function drawNeonScriptSubtitle(ctx, state, width, height, portrait) {
  const unit = Math.min(width, height);
  const x = width * (portrait ? .5 : .42);
  const y = height * (portrait ? .89 : .887);
  const size = fitText(
    ctx,
    state.subtitle,
    'Pacifico',
    unit * .055,
    width * (portrait ? .89 : .72)
  );

  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `${size}px Pacifico`;
  ctx.shadowBlur = unit * state.glow / 2400;
  ctx.shadowColor = '#ff247d';
  ctx.strokeStyle = '#6a183f';
  ctx.lineWidth = unit * .006;
  ctx.strokeText(state.subtitle, x, y);
  ctx.fillStyle = '#ff8eb5';
  ctx.fillText(state.subtitle, x, y);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawStarburstSeal(ctx, x, y, radius) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(.13);
  ctx.beginPath();

  for (let i = 0; i < 48; i++) {
    const angle = i * Math.PI / 24;
    const r = i % 2 ? radius * .87 : radius;
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }

  ctx.closePath();
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, radius * .79, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;

  ctx.font = `${radius * .18}px Bebas`;
  ctx.fillText('ORIGINAL COVER ART', 0, -radius * .30);
  ctx.font = `${radius * .43}px Bebas`;
  ctx.fillText('100%', 0, radius * .10);
  ctx.font = `${radius * .17}px Bebas`;
  ctx.fillText('SHOT ON YOUR CAMERA', 0, radius * .40);
  ctx.restore();
}

function drawPortraitEditionBadge(ctx, width, height, unit) {
  const x = width * .77;
  const y = height * .014;
  const w = width * .195;
  const h = unit * .032;

  ctx.fillStyle = '#071c23dd';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = .8;
  ctx.strokeRect(x, y, w, h);
  ctx.textAlign = 'center';
  ctx.font = `${unit * .014}px Bebas`;
  ctx.fillStyle = GOLD;
  ctx.fillText('VOL. 1 / AFTER HOURS', x + w / 2, y + h * .70);

  drawStarburstSeal(ctx, width * .90, height * .32, unit * .052);
}

export function drawPosterChrome(ctx, state, width, height) {
  const unit = Math.min(width, height);
  const portrait = height / width > 1.1;

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(width * .012, height * .086, width * .976, height * .9);
  ctx.lineWidth = .7;
  ctx.strokeRect(width * .016, height * .092, width * .968, height * .888);

  // The later hero pass masks the middle of these rules, leaving a top bleed.
  const quoteX = width * .025;
  const quoteWidth = width * .30;
  const quoteCenter = quoteX + quoteWidth / 2;
  const quote = `“${state.quote}”`;

  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = `${unit * .019}px Arial`;
  ctx.fillText('★★★★★', quoteCenter, height * .031);

  ctx.font = `${fitText(ctx, quote, 'Bebas', unit * .022, quoteWidth)}px Bebas`;
  ctx.fillStyle = '#fff0d3';
  ctx.fillText(quote, quoteCenter, height * .059);

  ctx.font = `${unit * .010}px Bebas`;
  ctx.fillStyle = GOLD;
  ctx.fillText('— ' + state.newspaper, quoteCenter, height * .077);

  if (!portrait) {
    ctx.textAlign = 'right';
    ctx.font = `${unit * .014}px Bebas`;
    ctx.fillText('AN INDEPENDENT COASTAL PICTURE', width * .976, height * .045);
    ctx.font = `${unit * .021}px Bebas`;
    ctx.fillText('VOL. 1 / THE SUNSET EDITION', width * .976, height * .075);
  }
}

function drawBillingAndBarcode(ctx, state, width, height) {
  const unit = Math.min(width, height);
  const portrait = height / width > 1.1;
  const taglineY = height * (portrait ? .929 : .935);

  line(
    ctx,
    width * .03,
    taglineY - unit * .027,
    width * .97,
    taglineY - unit * .027,
    GOLD,
    .7
  );

  ctx.textAlign = 'center';
  ctx.font = `${fitText(ctx, state.tagline, 'Bebas', unit * .025, width * .75)}px Bebas`;
  ctx.fillStyle = GOLD;
  ctx.fillText(state.tagline, width * .45, taglineY);

  ctx.font = `${unit * .0095}px Bebas`;
  ctx.fillStyle = '#a9b6a9';
  ctx.fillText(
    'A VELVET HOUR PICTURE · STARRING THE BOSS · THE DRIVER · THE MECHANIC · THE CAPTAIN · THE RIDER · THE FIXER · THE LOOKOUT · THE WHEELMAN',
    width * .44,
    taglineY + unit * .024,
    width * .79
  );
  ctx.fillText(
    'SHOT ON YOUR OWN CAMERA  /  GRADED BY HAND  /  EVERY CITY HAS A STORY. THIS ONE IS YOURS.',
    width * .44,
    taglineY + unit * .039,
    width * .77
  );

  // The whole barcode is inset. Its text gets additional internal padding.
  const barcodeX = width * .875;
  const barcodeWidth = width * .09;
  const barcodeY = height * .924;
  const barcodeHeight = height * .047;

  ctx.fillStyle = '#f8e8bb';
  ctx.fillRect(
    barcodeX - 6,
    barcodeY - 4,
    barcodeWidth + 12,
    barcodeHeight + unit * .015
  );

  ctx.fillStyle = INK;
  let seed = 71;
  for (let i = 0; i < 49; i++) {
    seed = (seed * 17 + 23) % 101;
    if (seed % 3 === 0) continue;
    ctx.fillRect(
      barcodeX + i * barcodeWidth / 49,
      barcodeY,
      barcodeWidth / 80,
      barcodeHeight * .68
    );
  }

  ctx.textAlign = 'center';
  ctx.font = `${Math.min(unit * .010, barcodeWidth / 11)}px Bebas`;
  ctx.fillText(
    '0  62841  02601  8',
    barcodeX + barcodeWidth / 2,
    barcodeY + barcodeHeight * .97,
    barcodeWidth * .88
  );

  ctx.textAlign = 'left';
  ctx.font = `${unit * .017}px Bebas`;
  ctx.fillStyle = GOLD;
  ctx.fillText('COMING SOON', width * .035, height * .979);
}

function getFilmGrain() {
  if (noiseCanvas) return noiseCanvas;

  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 256;
  noiseCanvas.height = 256;
  const ctx = noiseCanvas.getContext('2d');
  const data = ctx.createImageData(256, 256);
  let seed = 1234567;

  for (let i = 0; i < data.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const n = seed >>> 24;
    data.data[i] = n;
    data.data[i + 1] = n;
    data.data[i + 2] = n;
    data.data[i + 3] = 90;
  }

  ctx.putImageData(data, 0, 0);
  return noiseCanvas;
}

function drawFilmTexture(ctx, state, width, height) {
  ctx.save();
  ctx.globalAlpha = state.grain / 150;
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = ctx.createPattern(getFilmGrain(), 'repeat');
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = .04 * state.grain / 50;
  ctx.fillStyle = '#ffcf8b';

  for (let y = 0; y < height * .72; y += 8) {
    for (let x = y % 16 ? 4 : 0; x < width; x += 8) {
      ctx.beginPath();
      ctx.arc(x, y, .7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function renderCoverPoster(canvas, state, photos, { selected = -1 } = {}) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const unit = Math.min(width, height);
  const portrait = height / width > 1.1;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, width, height);

  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, '#203a3c');
  background.addColorStop(.5, '#0e2930');
  background.addColorStop(1, '#160f26');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  drawPosterChrome(ctx, state, width, height);
  const boxes = getPanelGeometry(width, height, state.layout);

  // Supporting frames precede the hero, which interrupts the top rule.
  for (const index of [1, 2, 3, 4, 5, 6, 0]) {
    const panel = state.panels[index];
    const photo = photos.find(item => item.id === panel.photo);
    drawGradedPhotoPanel(ctx, photo, panel, boxes[index], state);

    const labelBox = { ...boxes[index] };
    const square = Math.abs(width / height - 1) < .05;
    if (!portrait && (index <= 2 || square) && labelBox.y + labelBox.h > height * .65) {
      labelBox.h = height * .65 - labelBox.y;
    }
    drawPanelNameTag(ctx, panel, labelBox, unit);
  }

  const fade = ctx.createLinearGradient(0, height * .68, 0, height * .92);
  fade.addColorStop(0, '#071c2300');
  fade.addColorStop(1, '#071c23');
  ctx.fillStyle = fade;
  ctx.fillRect(0, height * .68, width, height * .24);

  drawFilmTexture(ctx, state, width, height);
  drawRetroChromeTitle(ctx, state.title, width, height, portrait);
  drawNeonScriptSubtitle(ctx, state, width, height, portrait);

  if (portrait) {
    drawPortraitEditionBadge(ctx, width, height, unit);
  } else {
    drawStarburstSeal(ctx, width * .895, height * .837, unit * .073);
  }

  drawBillingAndBarcode(ctx, state, width, height);

  if (selected >= 0) {
    const box = boxes[selected];
    ctx.save();
    ctx.strokeStyle = '#f8e9b9';
    ctx.setLineDash([8, 5]);
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x + 8, box.y + 8, box.w - 16, box.h - 16);
    ctx.restore();
  }

  return boxes;
}

export function exportCoverPng(state, photos, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  renderCoverPoster(canvas, state, photos);
  return canvas.toDataURL('image/png');
}
