// Толпа: массив агентов, которые пружиной держатся за лидера (палец),
// отталкиваются друг от друга и бегут на месте (2 кадра анимации).
import { CONFIG } from '../config.js';

const C = CONFIG;

export class Crowd {
  constructor(layer, sprites, fx) {
    this.sprites = sprites;
    this.fx = fx;               // частицы/попапы/камера
    this.layer = layer;
    this.count = 0;             // «настоящее» число толпы (может быть больше отрисованных)
    this.agents = [];           // живые агенты
    this.pool = [];             // переиспользуемые спрайты
    this.targetX = C.W / 2;     // куда тянет палец
    this.leaderX = C.W / 2;
    this.onEmpty = null;        // вызовется, когда всех убили
    this.onCountChanged = null;

    this.label = new PIXI.Text('3', {
      fontFamily: 'Arial', fontSize: 72, fontWeight: '900',
      fill: 0xffffff, stroke: 0x1a1d33, strokeThickness: 10,
    });
    this.label.anchor.set(0.5);
    this.label.visible = false;
    this.labelScaleT = 0;
    layer.addChild(this.label);
  }

  reset() {
    for (const a of this.agents) this._free(a);
    this.agents.length = 0;
    this.count = C.START_COUNT;
    this.targetX = C.W / 2;
    this.leaderX = C.W / 2;
    this._syncSprites();
    this._updateLabel(true);
  }

  // применяем операцию ворот, возвращаем новое число
  applyOp(op, v) {
    if (this.count <= 0) return 0;
    switch (op) {
      case '+': this.count += v; break;
      case '×': this.count *= v; break;
      case '−': this.count = Math.max(0, this.count - v); break;
      case '÷': this.count = Math.floor(this.count / v); break;
    }
    this._syncSprites();
    this._updateLabel(true);
    if (this.count === 0 && this.onEmpty) this.onEmpty();
    return this.count;
  }

  // убить одного юнита в точке (лопасть). count — «настоящее» число,
  // а спрайтов рисуем максимум MAX_AGENTS, поэтому убираем ближайшего видимого
  killAt(x, y) {
    if (this.count <= 0) return false;
    this.count--;
    let best = null, bestD = 1e9;
    for (const a of this.agents) {
      const d = (a.x - x) * (a.x - x) + (a.y - y) * (a.y - y);
      if (d < bestD) { bestD = d; best = a; }
    }
    if (best && bestD < 220 * 220) {
      if (this.fx) {
        this.fx.particles.burst(best.x, best.y, 7, {
          speed: 260, life: 0.5, tex: 'dot',
          tint: this.sprites.palette[best.colorIdx], scale: 0.7,
        });
      }
      const i = this.agents.indexOf(best);
      this.agents.splice(i, 1);
      this._free(best);
    }
    this._updateLabel(true);
    if (this.count === 0 && this.onEmpty) this.onEmpty();
    return true;
  }

  // шипы срезают тех, кто оказался на их половине дороги
  killSide(side) {
    if (this.count <= 0) return 0;
    const dead = Math.ceil(this.count / 2);
    this.count -= dead;
    // бахнем частицами по видимой части
    let fxCount = 0;
    for (const a of this.agents) {
      if ((a.x - C.W / 2) * side < 0 && fxCount < 14) {
        this.fx.particles.burst(a.x, a.y, 5, {
          speed: 240, life: 0.45, tex: 'dot',
          tint: this.sprites.palette[a.colorIdx], scale: 0.7,
        });
        fxCount++;
      }
    }
    this._syncSprites();
    this._updateLabel(true);
    if (this.count === 0 && this.onEmpty) this.onEmpty();
    return dead;
  }

  wipeAll(burst = true) {
    this.count = 0;
    let i = 0;
    for (const a of this.agents.slice()) {
      if (burst && i++ < 20 && this.fx) {
        this.fx.particles.burst(a.x, a.y, 6, {
          speed: 280, life: 0.5, tex: 'dot',
          tint: this.sprites.palette[a.colorIdx], scale: 0.7,
        });
      }
      this._free(a);
    }
    this.agents.length = 0;
    this._updateLabel(true);
  }

  _free(a) {
    a.spr.visible = false;
    a.shadow.visible = false;
    this.pool.push(a);
  }

  // подгоняем число отрисованных агентов под count
  _syncSprites() {
    const shown = Math.min(this.count, C.MAX_AGENTS);
    while (this.agents.length > shown) {
      this._free(this.agents.pop());
    }
    while (this.agents.length < shown) {
      this._spawn();
    }
  }

  _spawn() {
    const a = this.pool.pop() || {};
    const ang = Math.random() * Math.PI * 2;
    const rad = Math.sqrt(Math.random()) * 105;
    a.x = this.leaderX + Math.cos(ang) * rad;
    a.y = C.CROWD_Y + Math.sin(ang) * rad * 0.8;
    a.vx = 0; a.vy = 0;
    a.ph = Math.random() * Math.PI * 2;
    a.sc = 0;                                    // для анимации появления
    a.colorIdx = (Math.random() * this.sprites.palette.length) | 0;
    a.sx = Math.cos(ang) * rad;                  // «свой» слот относительно лидера
    a.sy = Math.sin(ang) * rad * 0.8;
    if (!a.spr) {
      a.spr = new PIXI.Sprite(this.sprites.runner0);
      a.spr.anchor.set(0.5, 0.85);
      a.shadow = new PIXI.Sprite(this.sprites.shadow);
      a.shadow.anchor.set(0.5);
      this.layer.addChild(a.shadow);
      this.layer.addChild(a.spr);
    }
    a.spr.texture = this.sprites.runner0;
    a.spr.tint = this.sprites.palette[a.colorIdx];
    a.spr.visible = true;
    a.shadow.visible = true;
    a.spr.scale.set(0);
    this.agents.push(a);
  }

  _updateLabel(pop) {
    this.label.text = String(this.count);
    this.label.visible = this.count > 0;
    if (pop) this.labelScaleT = 1;
  }

  update(dt) {
    // лидер плавно едет за пальцем
    this.leaderX += (this.targetX - this.leaderX) * Math.min(1, dt * 10);

    // разделение через сетку — чтобы человечки не слипались в одну точку
    const cell = 56;
    const grid = new Map();
    for (const a of this.agents) {
      const key = ((a.x / cell) | 0) * 4096 + ((a.y / cell) | 0);
      let arr = grid.get(key);
      if (!arr) grid.set(key, (arr = []));
      arr.push(a);
    }
    for (const arr of grid.values()) {
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const p = arr[i], q = arr[j];
          let dx = q.x - p.x, dy = q.y - p.y;
          let d2 = dx * dx + dy * dy;
          const minD = C.AGENT_R * 1.55;
          if (d2 < minD * minD && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const push = ((minD - d) / d) * 0.5;
            dx *= push; dy *= push;
            p.x -= dx; p.y -= dy;
            q.x += dx; q.y += dy;
          }
        }
      }
    }

    const k = 26, damp = 7.5; // пружина к своему слоту
    const bob = performance.now() / 1000;
    for (const a of this.agents) {
      a.sc = Math.min(1, a.sc + dt * 6);
      const popScale = a.sc < 1 ? 1 + Math.sin(a.sc * Math.PI) * 0.35 : 1;

      const tx = this.leaderX + a.sx;
      const ty = C.CROWD_Y + a.sy;
      a.vx += (tx - a.x) * k * dt - a.vx * damp * dt;
      a.vy += (ty - a.y) * k * dt - a.vy * damp * dt;
      a.x += a.vx * dt * 8;
      a.y += a.vy * dt * 8;

      // не выходим за дорогу
      const pad = 30;
      a.x = Math.max(C.ROAD_X + pad, Math.min(C.ROAD_X + C.ROAD_W - pad, a.x));
      a.y = Math.max(C.CROWD_Y - 170, Math.min(C.CROWD_Y + 170, a.y));

      a.ph += dt * (10 + Math.hypot(a.vx, a.vy) * 0.02);
      const frame = (a.ph | 0) % 2;
      const s = (C.AGENT_R / 24) * 1.05 * popScale;
      a.spr.texture = frame ? this.sprites.runner1 : this.sprites.runner0;
      a.spr.scale.set(s);
      a.spr.position.set(a.x, a.y - Math.abs(Math.sin(bob * 9 + a.ph)) * 3);
      a.shadow.position.set(a.x, a.y + 6);
      a.shadow.scale.set(s * 0.9);
      a.shadow.alpha = 0.55;
    }

    // число над толпой
    this.label.position.set(this.leaderX, C.CROWD_Y - 250);
    if (this.labelScaleT > 0) {
      this.labelScaleT = Math.max(0, this.labelScaleT - dt * 3.5);
      const t = this.labelScaleT;
      this.label.scale.set(1 + Math.sin((1 - t) * Math.PI) * 0.5);
    } else {
      this.label.scale.set(1);
    }
  }
}
