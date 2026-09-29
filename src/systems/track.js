// Дорога (тайловый скролл) и генерация уровня по сиду.
// Уровень — список событий: ворота / лопасти / шипы / босс, каждое на своей дистанции.
import { CONFIG } from '../config.js';
import { makeRng } from '../state.js';

const C = CONFIG;

export class Track {
  constructor(layer, sprites) {
    this.layer = layer;
    this.traveled = 0;

    this._buildRoad(sprites);
    this.events = this._generate();
  }

  _buildRoad(sprites) {
    // фон всего экрана
    const bg = new PIXI.Graphics()
      .beginFill(C.COLORS.bg)
      .drawRect(0, 0, C.W, C.H)
      .endFill();
    this.layer.addChild(bg);

    // текстура плитки дороги
    const tileH = 220;
    const tileTex = this._makeRoadTex(tileH);

    this.road = new PIXI.TilingSprite(tileTex, C.ROAD_W, C.H);
    this.road.position.set(C.ROAD_X, 0);
    this.layer.addChild(this.road);

    // бортики из столбиков
    const postTex = sprites.post;
    this.postL = new PIXI.TilingSprite(postTex, 30, C.H);
    this.postL.position.set(C.ROAD_X - 34, 0);
    this.postR = new PIXI.TilingSprite(postTex, 30, C.H);
    this.postR.position.set(C.ROAD_X + C.ROAD_W + 4, 0);
    this.layer.addChild(this.postL, this.postR);
  }

  _makeRoadTex(h) {
    const w = C.ROAD_W;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#20243d';
    g.fillRect(0, 0, w, h);
    // поперечная полоса — при скролле даёт ощущение скорости
    g.fillStyle = '#2b3052';
    g.fillRect(0, 0, w, 26);
    // краевые линии
    g.fillStyle = 'rgba(255,255,255,0.14)';
    g.fillRect(8, 0, 6, h);
    g.fillRect(w - 14, 0, 6, h);
    return PIXI.Texture.from(c);
  }

  _generate() {
    const rng = makeRng(C.SEED);
    const events = [];

    // симуляция «идеального» прохода: всегда берём хорошие ворота,
    // шипы обходим, лопасти чуть кусают — от неё считаем hp босса
    let sim = C.START_COUNT;
    const applySim = (op, v) => {
      if (op === '+') sim += v;
      else if (op === '×') sim *= v;
      else if (op === '−') sim = Math.max(1, sim - v);
      else sim = Math.max(1, Math.floor(sim / v));
    };
    const goodOp = () => (rng() < 0.55
      ? { op: '×', v: rng() < 0.7 ? 2 : 3 }
      : { op: '+', v: 25 + ((rng() * 36) | 0) });
    const badOp = () => (rng() < 0.5
      ? { op: '÷', v: 2 }
      : { op: '−', v: 20 + ((rng() * 41) | 0) });

    let d = 1250; // первые ворота — сразу после туториала
    let lastWasObstacle = false;
    while (d < C.LEVEL_LEN - 1500) {
      // ворота и препятствия чередуем, чтобы был ритм
      if (!lastWasObstacle || rng() < 0.45) {
        const goodFirst = rng() < 0.5;
        const g = goodFirst ? goodOp() : badOp();
        const b = goodFirst ? badOp() : goodOp();
        events.push({ type: 'gates', dist: d, left: g, right: b });
        applySim((goodFirst ? g : b).op, (goodFirst ? g : b).v);
        lastWasObstacle = false;
      } else if (rng() < 0.6) {
        const n = rng() < 0.6 ? 1 : 2;
        events.push({ type: 'blades', dist: d, n });
        sim = Math.max(1, sim - n * 2);
        lastWasObstacle = true;
      } else {
        events.push({ type: 'spikes', dist: d, side: rng() < 0.5 ? -1 : 1 });
        sim = Math.floor(sim * 0.97); // идеал почти не теряет
        lastWasObstacle = true;
      }
      d += 700 + rng() * 420;
    }

    events.push({
      type: 'boss',
      dist: C.LEVEL_LEN - 200,
      hp: Math.max(C.BOSS_MIN_HP, Math.floor(sim * 0.45)),
    });
    return events;
  }

  update(dt) {
    this.traveled += C.SPEED * dt;
    const off = this.traveled % 220;
    this.road.tilePosition.y = off;
    this.postL.tilePosition.y = off;
    this.postR.tilePosition.y = off;
  }

  reset() {
    this.traveled = 0;
    this.road.tilePosition.y = 0;
    this.postL.tilePosition.y = 0;
    this.postR.tilePosition.y = 0;
  }
}
