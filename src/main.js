// туториал: рука показывает свайп, прячется после первого касания
import { CONFIG } from './config.js';
import { FSM } from './state.js';
import { Sprites } from './render/sprites.js';
import { Track } from './systems/track.js';
import { Crowd } from './systems/crowd.js';
import { Obstacles } from './systems/obstacles.js';
import { Popups } from './systems/popupText.js';
import { Particles } from './systems/particles.js';
import { AudioSys } from './systems/audio.js';
import { Camera } from './systems/camera.js';
import { Tutorial } from './ui/tutorial.js';

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

const worldWrap = new PIXI.Container();
root.addChild(worldWrap);
const roadLayer = new PIXI.Container();
const objLayer = new PIXI.Container();
const crowdLayer = new PIXI.Container();
const fxLayer = new PIXI.Container();
worldWrap.addChild(roadLayer, objLayer, crowdLayer, fxLayer);
const uiLayer = new PIXI.Container();
root.addChild(uiLayer);

const track = new Track(roadLayer, Sprites);
const particles = new Particles(fxLayer);
const popups = new Popups(fxLayer);
const cam = new Camera(worldWrap);
const fx = { particles, popups, cam, audio: AudioSys };
const crowd = new Crowd(crowdLayer, Sprites, fx);
const obstacles = new Obstacles(track.events, objLayer, crowd, fx);
const tutorial = new Tutorial(uiLayer);

let dragging = false;
let lastX = 0;
let dragAccum = 0;
const clampTarget = (x) =>
  Math.max(C.ROAD_X + 70, Math.min(C.ROAD_X + C.ROAD_W - 70, x));

app.view.addEventListener('pointerdown', (e) => {
  AudioSys.unlock();
  dragging = true;
  lastX = e.clientX;
});
window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = ((e.clientX - lastX) / viewScale) * C.DRAG_SENS;
  lastX = e.clientX;
  crowd.targetX = clampTarget(crowd.targetX + dx);
  dragAccum += Math.abs(dx);
});
window.addEventListener('pointerup', () => { dragging = false; });

function resetRun() {
  track.reset();
  obstacles.reset();
  crowd.reset();
  particles.clear();
  dragAccum = 0;
}

function lose() {
  if (['lose', 'win'].includes(fsm.currentName)) return;
  AudioSys.lose();
  cam.shake(18, 0.4);
  cam.hitStop(90);
  popups.show(C.W / 2, C.CROWD_Y - 320, 'TRY AGAIN!', C.COLORS.bad);
  fsm.go('lose');
}
crowd.onEmpty = lose;

obstacles.onBoss = (v) => {
  if (crowd.count > v.ev.hp) {
    obstacles.breakBoss(v);
    cam.hitStop(120);
    cam.shake(22, 0.55);
    AudioSys.win();
    particles.confettiRain();
    popups.show(C.W / 2, C.CROWD_Y - 300, 'WIN!', C.COLORS.accent);
    fsm.go('win');
  } else {
    crowd.wipeAll();
    lose();
  }
};

const fsm = new FSM();
let stateTimer = 0;

function gameUpdate(dt) {
  track.update(dt);
  obstacles.update(dt, track.traveled);
  crowd.update(dt);
  particles.update(dt);
  popups.update(dt);
  AudioSys.update();
}

fsm.add('tutorial', {
  enter() {
    tutorial.show();
  },
  update(dt) {
    gameUpdate(dt);
    if (dragAccum > 60) {
      tutorial.hide();
      fsm.go('run');
    }
  },
});

fsm.add('run', {
  update(dt) { gameUpdate(dt); },
});

fsm.add('lose', {
  enter() { stateTimer = 0; },
  update(dt) {
    gameUpdate(dt);
    stateTimer += dt;
    if (stateTimer > 1.25) {
      resetRun();
      fsm.go('run');
    }
  },
});

fsm.add('win', {
  enter() { stateTimer = 0; },
  update(dt) {
    gameUpdate(dt);
    obstacles.tickBoss(dt);
    stateTimer += dt;
    if (stateTimer > 1.9) {
      resetRun();
      fsm.go('run');
    }
  },
});

app.ticker.add(() => {
  const rawDt = Math.min(app.ticker.deltaMS, 34) / 1000;
  cam.update(rawDt);
  const dt = rawDt * cam.dtScale();
  fsm.update(dt);
  tutorial.update(dt);
});

crowd.reset();
fsm.go('tutorial');
