// Пул частиц: конфетти, «поп» при найме, взрывы при потерях.
// Никаких new в игровом цикле — только переиспользование.
import { CONFIG } from '../config.js';
import { Sprites } from '../render/sprites.js';

const C = CONFIG;
const MAX = 500;

export class Particles {
  constructor(layer) {
    this.items = [];
    for (let i = 0; i < MAX; i++) {
      const s = new PIXI.Sprite(Sprites.dot);
      s.anchor.set(0.5);
      s.visible = false;
      layer.addChild(s);
      this.items.push({ spr: s, on: false });
    }
    this.cursor = 0;
  }

  burst(x, y, n, opts = {}) {
    const {
      speed = 240, life = 0.6, tex = 'dot', tint = 0xffffff,
      scale = 1, gravity = 700, spread = Math.PI * 2, angle = -Math.PI / 2,
    } = opts;
    for (let i = 0; i < n; i++) {
      const p = this.items[this.cursor];
      this.cursor = (this.cursor + 1) % MAX;

      const a = angle + (Math.random() - 0.5) * spread;
      const sp = speed * (0.5 + Math.random() * 0.8);
      p.on = true;
      p.spr.visible = true;
      p.spr.texture = tex === 'confetti' ? Sprites.confetti : Sprites.dot;
      p.spr.tint = tint;
      p.spr.position.set(x, y);
      p.spr.scale.set(scale * (0.7 + Math.random() * 0.6));
      p.spr.rotation = Math.random() * Math.PI;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.vr = (Math.random() - 0.5) * 12;
      p.life = life * (0.7 + Math.random() * 0.6);
      p.maxLife = p.life;
      p.grav = gravity;
    }
  }

  // конфетти на победу
  confettiRain() {
    for (let i = 0; i < 120; i++) {
      const p = this.items[this.cursor];
      this.cursor = (this.cursor + 1) % MAX;
      p.on = true;
      p.spr.visible = true;
      p.spr.texture = Sprites.confetti;
      p.spr.tint = Sprites.palette[(Math.random() * Sprites.palette.length) | 0];
      p.spr.position.set(C.ROAD_X + Math.random() * C.ROAD_W, -40 - Math.random() * 400);
      p.spr.scale.set(0.9 + Math.random() * 0.9);
      p.spr.rotation = Math.random() * Math.PI;
      p.vx = (Math.random() - 0.5) * 160;
      p.vy = 220 + Math.random() * 260;
      p.vr = (Math.random() - 0.5) * 10;
      p.life = 2.4 + Math.random() * 1.4;
      p.maxLife = p.life;
      p.grav = 120;
    }
  }

  update(dt) {
    for (const p of this.items) {
      if (!p.on) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.on = false;
        p.spr.visible = false;
        continue;
      }
      p.vy += p.grav * dt;
      p.spr.x += p.vx * dt;
      p.spr.y += p.vy * dt;
      p.spr.rotation += p.vr * dt;
      p.spr.alpha = Math.min(1, p.life / (p.maxLife * 0.4));
    }
  }

  clear() {
    for (const p of this.items) {
      p.on = false;
      p.spr.visible = false;
    }
  }
}
