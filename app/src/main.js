import { loadStudioAssets, grades } from './studio-state.js';
import {
  renderCoverPoster,
  getPanelGeometry,
  exportCoverPng
} from './render-poster.js';
import {
  configureShotScene,
  renderDeterministicShot
} from './shots.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const { state, width, height } = configureShotScene(params);
const photos = await loadStudioAssets();
const canvas = $('preview');

let size = [width, height];
let selected = 0;
let drag = null;
let toastTimer;

function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $('toast').classList.remove('visible');
  }, 2400);
}

function draw() {
  canvas.width = 1600;
  canvas.height = Math.round(1600 * size[1] / size[0]);

  renderCoverPoster(canvas, state, photos, { selected });

  $('dimensions').textContent = `${size[0]} × ${size[1]} PX`;
  $('scene-label').textContent =
    `${grades[state.grade].name.toUpperCase()} / ${state.layout.toUpperCase()}`;

  document.querySelectorAll('[data-size]').forEach(button => {
    button.classList.toggle('active', button.dataset.size === size.join(','));
  });
}

function addOption(select, value, label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  select.append(option);
}

function initializeGradePickers() {
  for (const id of ['grade', 'header-grade']) {
    const picker = $(id);

    for (const [key, grade] of Object.entries(grades)) {
      addOption(picker, key, grade.name);
    }

    picker.value = state.grade;
    picker.onchange = () => {
      state.grade = picker.value;
      $('grade').value = state.grade;
      $('header-grade').value = state.grade;
      draw();
    };
  }
}

function initializeLayoutPickers() {
  for (const id of ['layout', 'header-layout']) {
    const picker = $(id);

    for (const layout of ['Syndicate 7', 'Collage', 'Strip']) {
      addOption(picker, layout, layout);
    }

    picker.onchange = () => {
      state.layout = picker.value;
      $('layout').value = state.layout;
      $('header-layout').value = state.layout;
      draw();
    };
  }
}

function initializeCopyInputs() {
  for (const id of ['title', 'subtitle', 'tagline']) {
    const input = $(id);
    input.value = state[id];
    input.oninput = () => {
      state[id] = input.value;
      draw();
    };
  }
}

function initializeLookSliders() {
  for (const id of ['strength', 'grain', 'glow', 'vignette']) {
    const input = $(id);
    input.value = state[id];
    $(id + '-value').textContent = state[id] + '%';

    input.oninput = () => {
      state[id] = Number(input.value);
      $(id + '-value').textContent = state[id] + '%';
      draw();
    };
  }
}

function selectPanel(index) {
  selected = index;
  const panel = state.panels[index];
  const photo = photos.find(item => item.id === panel.photo);

  $('panel-number').textContent = String(index + 1).padStart(2, '0');
  $('selected-name').textContent = panel.name;
  $('selected-photo').src = photo.src;
  $('panel-photo').value = panel.photo;
  $('panel-name').value = panel.name;
  $('panel-bio').value = panel.bio;
  $('zoom').value = panel.zoom;
  $('zoom-value').textContent = panel.zoom.toFixed(2) + '×';

  document.querySelectorAll('.photo-tile').forEach(button => {
    button.classList.toggle('active', button.dataset.photo === panel.photo);
  });

  draw();
}

function assignPhoto(id) {
  const photo = photos.find(item => item.id === id);

  Object.assign(state.panels[selected], {
    photo: id,
    name: photo.name,
    bio: photo.bio,
    x: 0,
    y: 0,
    zoom: 1
  });

  selectPanel(selected);
}

function refreshTray() {
  $('photo-tray').replaceChildren();
  $('panel-photo').replaceChildren();

  for (const photo of photos) {
    const tile = document.createElement('button');
    tile.className = 'photo-tile';
    tile.dataset.photo = photo.id;
    tile.title = `Assign ${photo.name} to selected panel`;

    const image = new Image();
    image.src = photo.src;
    image.alt = photo.name;

    const caption = document.createElement('span');
    caption.textContent = photo.name;

    tile.append(image, caption);
    tile.onclick = () => assignPhoto(photo.id);
    $('photo-tray').append(tile);
    addOption($('panel-photo'), photo.id, photo.name);
  }

  $('photo-count').textContent = photos.length;
}

function initializePanelInputs() {
  $('panel-photo').onchange = () => assignPhoto($('panel-photo').value);

  for (const [id, key] of [['panel-name', 'name'], ['panel-bio', 'bio']]) {
    $(id).oninput = () => {
      state.panels[selected][key] = $(id).value;
      $('selected-name').textContent = state.panels[selected].name;
      draw();
    };
  }

  $('zoom').oninput = () => {
    const panel = state.panels[selected];
    panel.zoom = Number($('zoom').value);
    $('zoom-value').textContent = panel.zoom.toFixed(2) + '×';
    draw();
  };

  $('reset-crop').onclick = () => {
    Object.assign(state.panels[selected], { x: 0, y: 0, zoom: 1 });
    selectPanel(selected);
  };
}

function initializeAspectButtons() {
  document.querySelectorAll('[data-size]').forEach(button => {
    button.onclick = () => {
      size = button.dataset.size.split(',').map(Number);
      draw();
    };
  });
}

function startPanelPan(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * canvas.width;
  const y = (event.clientY - rect.top) / rect.height * canvas.height;
  const boxes = getPanelGeometry(canvas.width, canvas.height, state.layout);

  const index = boxes.findIndex(box =>
    x >= box.x && x <= box.x + box.w &&
    y >= box.y && y <= box.y + box.h
  );

  if (index < 0) return;

  selectPanel(index);
  canvas.setPointerCapture(event.pointerId);
  drag = {
    x: event.clientX,
    y: event.clientY,
    px: state.panels[index].x,
    py: state.panels[index].y
  };
}

function movePanelPan(event) {
  if (!drag) return;

  const panel = state.panels[selected];
  panel.x = Math.max(-1, Math.min(1, drag.px + (event.clientX - drag.x) / 100));
  panel.y = Math.max(-1, Math.min(1, drag.py + (event.clientY - drag.y) / 100));
  draw();
}

function readPhotoLocally(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function importPersonalPhotos(event) {
  for (const file of event.target.files) {
    try {
      const src = await readPhotoLocally(file);
      const image = new Image();
      image.src = src;
      await image.decode();

      const id = 'upload-' + photos.length;
      const name = file.name.replace(/\.[^.]+$/, '').toUpperCase().slice(0, 32);

      photos.push({
        id,
        name,
        bio: 'YOUR CITY · YOUR STORY · YOUR RULES',
        src,
        image
      });

      refreshTray();
      assignPhoto(id);
      toast('Photo added. Welcome to the cast.');
    } catch {
      toast('This image could not be opened. Try a JPG or PNG.');
    }
  }

  event.target.value = '';
}

function downloadCover(width, height) {
  const data = exportCoverPng(state, photos, width, height);
  const anchor = document.createElement('a');
  const title = state.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  anchor.href = data;
  anchor.download = `${title}-${width}x${height}.png`;
  anchor.click();

  toast(`Exported ${width} × ${height} PNG`);
  return data;
}

async function downloadAllCoverSizes() {
  for (const dimensions of [[1080, 1080], [1080, 1350], [1920, 1080]]) {
    downloadCover(...dimensions);
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  toast('Three covers exported. Roll credits.');
}

function initializeExportButtons() {
  document.querySelectorAll('[data-export]').forEach(button => {
    button.onclick = () => {
      downloadCover(...button.dataset.export.split(',').map(Number));
    };
  });

  $('export-all').onclick = downloadAllCoverSizes;
}

initializeGradePickers();
initializeLayoutPickers();
initializeCopyInputs();
initializeLookSliders();
initializePanelInputs();
initializeAspectButtons();
initializeExportButtons();

canvas.onpointerdown = startPanelPan;
canvas.onpointermove = movePanelPan;
canvas.onpointerup = canvas.onpointercancel = () => { drag = null; };
$('upload').onchange = importPersonalPhotos;

refreshTray();
selectPanel(0);
await renderDeterministicShot(params, state, photos, ...size);

// The same public renderer powers the automated checks and all export buttons.
window.studio = {
  state,
  photos,
  draw,
  selectPanel,
  exportPng: (width, height) => exportCoverPng(state, photos, width, height)
};
window.__ready = true;
