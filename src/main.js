// MOB RUSH! — playable ad (crowd runner)
// Точка входа: создаём приложение, слои, системы, машину состояний и ввод.
import { CONFIG } from './config.js';
import { FSM } from './state.js';
import { Sprites } from './render/sprites.js';
import { Track } from './systems/track.js';
import { Crowd } from './systems/crowd.js';
import { Obstacles } from './systems/obstacles.js';
import { Particles } from './systems/particles.js';
import { Popups } from './systems/popupText.js';
import { Camera } from './systems/camera.js';
import { AudioSys } from './systems/audio.js';
import { Ads } from './systems/ads.js';
import { Tutorial } from './ui/tutorial.js';
import { EndCard } from './ui/endcard.js';

const C = CONFIG;
const DEBUG = /[?&#]debug/.test(location.href);   // хук для отладки в консоли
const SHOW_FPS = DEBUG && /[?&#]fps/.test(location.href); // fps-оверлей

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
}

function boot() {
  Sprites.init();

  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x0d1022,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    forceCanvas: !hasWebGL(), // в некоторых webview нет WebGL — рисуем через canvas 2d
  });
  document.body.appendChild(app.view);

  // корень дизайн-разрешения + letterbox под любой экран
  const root = new PIXI.Container();
  app.stage.addChild(root);
  const layout = { scale: 1 };
  function layoutNow() {
    const w = window.innerWidth, h = window.innerHeight;
    app.renderer.resize(w, h);
    const s = Math.min(w / C.W, h / C.H);
    layout.scale = s;
    root.scale.set(s);
    root.position.set((w - C.W * s) / 2, (h - C.H * s) / 2);
  }
  layoutNow();
  window.addEventListener('resize', layoutNow);

  // слои: мир трясётся, UI — нет
  const worldWrap = new PIXI.Container();
  root.addChild(worldWrap);
  const world = new PIXI.Container();
  worldWrap.addChild(world);

  const roadLayer = new PIXI.Container();
  const objLayer = new PIXI.Container();
  const crowdLayer = new PIXI.Container();
  const fxLayer = new PIXI.Container();
  world.addChild(roadLayer, objLayer, crowdLayer, fxLayer);
  const uiLayer = new PIXI.Container();
  root.addChild(uiLayer);

  // системы
  const track = new Track(roadLayer, Sprites);
  const crowd = new Crowd(crowdLayer, Sprites, null);
  const particles = new Particles(fxLayer);
  const popups = new Popups(fxLayer);
  const cam = new Camera(worldWrap);
  const fx = { particles, popups, cam, audio: AudioSys };
  crowd.fx = fx; // толпе эффекты нужны после создания камеры
  const obstacles = new Obstacles(track.events, objLayer, crowd, fx);
  const tutorial = new Tutorial(uiLayer);
  const endcard = new EndCard(uiLayer, () => Ads.openStore(C.STORE_URL));

  // --- ввод ---
  let dragging = false;
  let lastX = 0;
  let dragAccum = 0;
  const clampTarget = (x) =>
    Math.max(C.ROAD_X + 70, Math.min(C.ROAD_X + C.ROAD_W - 70, x));

  app.view.addEventListener('pointerdown', (e) => {
    AudioSys.unlock();
    dragging = true;
    lastX = e.clientX;
    if (fsm.currentName === 'endcard') endcard.click();
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = ((e.clientX - lastX) / layout.scale) * C.DRAG_SENS;
    lastX = e.clientX;
    crowd.targetX = clampTarget(crowd.targetX + dx);
    dragAccum += Math.abs(dx);
  });
  window.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('pointercancel', () => { dragging = false; });

  // --- пауза, когда реклама не видна ---
  let paused = false;
  Ads.init(
    () => { paused = true; AudioSys.suspend(); },
    () => { paused = false; AudioSys.resume(); },
  );

  // --- перезапуск забега ---
  function resetRun() {
    track.reset();
    obstacles.reset();
    crowd.reset();
    particles.clear();
    dragAccum = 0;
  }

  // --- проигрыш ---
  function lose() {
    if (['lose', 'win', 'endcard'].includes(fsm.currentName)) return;
    AudioSys.lose();
    cam.shake(18, 0.4);
    cam.hitStop(90);
    popups.show(C.W / 2, C.CROWD_Y - 320, 'TRY AGAIN!', C.COLORS.bad);
    Ads.trackEvent('run_failed', { crowd: crowd.count });
    fsm.go('lose');
  }
  crowd.onEmpty = lose;

  // --- босс ---
  obstacles.onBoss = (v) => {
    if (crowd.count > v.ev.hp) {
      Ads.trackEvent('level_complete', { crowd: crowd.count });
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

  // --- машина состояний ---
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
      Ads.trackEvent('tutorial_start');
      tutorial.show();
    },
    update(dt) {
      gameUpdate(dt);
      if (dragAccum > 60) {
        tutorial.hide();
        Ads.trackEvent('tutorial_complete');
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
        fsm.go('run'); // туториал второй раз не показываем
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
        endcard.show(crowd.count);
        fsm.go('endcard');
      }
    },
  });

  fsm.add('endcard', {
    enter() {
      crowd.label.visible = false; // чтобы не просвечивала под затемнением
    },
    update(dt) {
      particles.update(dt);
      popups.update(dt);
    },
  });

  // --- FPS-оверлей для отладки (?#debug&#fps в адресе) ---
  let fpsText = null;
  if (SHOW_FPS) {
    fpsText = new PIXI.Text('', {
      fontFamily: 'monospace', fontSize: 26, fill: 0x80ed99,
    });
    fpsText.position.set(20, 20);
    uiLayer.addChild(fpsText);
  }

  // --- главный цикл ---
  app.ticker.add(() => {
    if (paused) return;
    const rawDt = Math.min(app.ticker.deltaMS, 34) / 1000;
    cam.update(rawDt);
    const dt = rawDt * cam.dtScale();
    fsm.update(dt);
    tutorial.update(dt);
    endcard.update(dt);
    if (SHOW_FPS) fpsText.text = `FPS ${app.ticker.FPS.toFixed(0)} | агентов ${crowd.agents.length} | толпа ${crowd.count}`;
  });

  crowd.reset();
  fsm.go('tutorial');

  // хук для отладки: в консоли можно дергать системы руками
  if (DEBUG) {
    window.__mob = { app, crowd, track, obstacles, fsm, popups, particles, AudioSys };
  }
}

boot();
