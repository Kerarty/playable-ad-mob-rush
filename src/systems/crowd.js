// Толпа: агенты на пружине держатся за лидера и отталкиваются друг от друга
import { CONFIG } from '../config.js';

const C = CONFIG;

export class Crowd {
  constructor(layer, sprites) {
    this.sprites = sprites;
    this.layer = layer;
    this.count = 0;
    this.agents = [];
    this.pool = [];
    this.targetX = C.W / 2;
    this.leaderX = C.W / 2;

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

  _free(a) {
    a.spr.visible = false;
    a.shadow.visible = false;
    this.pool.push(a);
  }

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
    a.sc = 0;
    a.colorIdx = (Math.random() * this.sprites.palette.length) | 0;
    a.sx = Math.cos(ang) * rad;
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
    this.leaderX += (this.targetX - this.leaderX) * Math.min(1, dt * 10);

    // разделение через сетку — без неё толпа слипается в одну точку
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

    const k = 26, damp = 7.5;
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
