// подключил толпу, дорога пока прямо здесь
import { CONFIG } from './config.js';
import { Sprites } from './render/sprites.js';
import { Crowd } from './systems/crowd.js';

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

// дорога: тайловый спрайт, скроллю вниз — ощущение бега вперёд
function makeRoadTex(h) {
  const w = C.ROAD_W;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#20243d';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#2b3052';
  g.fillRect(0, 0, w, 26);
  return PIXI.Texture.from(c);
}
const road = new PIXI.TilingSprite(makeRoadTex(220), C.ROAD_W, C.H);
road.position.set(C.ROAD_X, 0);
root.addChild(road);

const crowdLayer = new PIXI.Container();
root.addChild(crowdLayer);
const crowd = new Crowd(crowdLayer, Sprites);

// тащим толпу пальцем/мышкой
let dragging = false;
let lastX = 0;
app.view.addEventListener('pointerdown', (e) => {
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
  const dt = Math.min(app.ticker.deltaMS, 34) / 1000;
  road.tilePosition.y = (road.tilePosition.y + C.SPEED * dt) % 220;
  crowd.update(dt);
});

crowd.reset();
