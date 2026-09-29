// Всплывающие числа: +30, -50 и т.п. Тоже пул, без new в кадре.
import { CONFIG } from '../config.js';

const C = CONFIG;
const MAX = 14;

export class Popups {
  constructor(layer) {
    this.items = [];
    for (let i = 0; i < MAX; i++) {
      const t = new PIXI.Text('', {
        fontFamily: 'Arial', fontSize: 84, fontWeight: '900',
        fill: 0xffffff, stroke: 0x1a1d33, strokeThickness: 12,
      });
      t.anchor.set(0.5);
      t.visible = false;
      layer.addChild(t);
      this.items.push({ spr: t, on: false });
    }
    this.cursor = 0;
  }

  show(x, y, str, color) {
    const p = this.items[this.cursor];
    this.cursor = (this.cursor + 1) % MAX;

    p.on = true;
    p.spr.visible = true;
    p.spr.text = str;
    p.spr.style.fill = color;
    p.spr.position.set(x, y);
    p.spr.scale.set(0.2);
    p.spr.alpha = 1;
    p.life = 0.9;
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
      const t = 1 - p.life / 0.9;
      // выскакивает и улетает вверх
      p.spr.scale.set(t < 0.25 ? 0.2 + (t / 0.25) * 1.1 : 1.3 - (t - 0.25) * 0.35);
      p.spr.y -= 200 * dt;
      p.spr.alpha = p.life < 0.3 ? p.life / 0.3 : 1;
    }
  }
}
