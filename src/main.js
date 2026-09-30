// добавил звук (синтез через webaudio) и тряску камеры
import { CONFIG } from './config.js';
import { Sprites } from './render/sprites.js';
import { Track } from './systems/track.js';
import { Crowd } from './systems/crowd.js';
import { Popups } from './systems/popupText.js';
import { AudioSys } from './systems/audio.js';
import { Camera } from './systems/camera.js';

const C = CONFIG;
Sprites.init();

const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x0d1022,
  antialias: true,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  autoDensity: true,
});
document.body.appendChild(app.view);

const root = new PIXI.Container();
app.stage.addChild(root);
let viewScale = 1;

function layout() {
  const w = window.innerWidth, h = window.innerHeight;
  app.renderer.resize(w, h);
  const s = Math.min(w / C.W, h / C.H);
  viewScale = s;
  root.scale.set(s);
  root.position.set((w - C.W * s) / 2, (h - C.H * s) / 2);
}
layout();
window.addEventListener('resize', layout);

// мир трясётся, UI сверху — потом пригодится
const worldWrap = new PIXI.Container();
root.addChild(worldWrap);
const roadLayer = new PIXI.Container();
const crowdLayer = new PIXI.Container();
const fxLayer = new PIXI.Container();
worldWrap.addChild(roadLayer, crowdLayer, fxLayer);

const track = new Track(roadLayer, Sprites);
const crowd = new Crowd(crowdLayer, Sprites);
const popups = new Popups(fxLayer);
const cam = new Camera(worldWrap);

let dragging = false;
let lastX = 0;
app.view.addEventListener('pointerdown', (e) => {
  AudioSys.unlock(); // звук можно включать только после жеста пользователя
  dragging = true;
  lastX = e.clientX;
});
window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = ((e.clientX - lastX) / viewScale) * C.DRAG_SENS;
  lastX = e.clientX;
  crowd.targetX = Math.max(
    C.ROAD_X + 70,
    Math.min(C.ROAD_X + C.ROAD_W - 70, crowd.targetX + dx),
  );
});
window.addEventListener('pointerup', () => { dragging = false; });

app.ticker.add(() => {
  const rawDt = Math.min(app.ticker.deltaMS, 34) / 1000;
  cam.update(rawDt);
  const dt = rawDt * cam.dtScale();
  track.update(dt);
  crowd.update(dt);
  popups.update(dt);
  AudioSys.update(); // планирует ноты фонового лупа
});

crowd.reset();
