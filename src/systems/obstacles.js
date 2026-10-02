// Препятствия: ворота с операциями, лопасти, шипы, стена-босс.
// Объекты стоят на своей дистанции и «едут» на игрока по мере пробега.
import { CONFIG } from '../config.js';
import { Sprites } from '../render/sprites.js';

const C = CONFIG;

export class Obstacles {
  constructor(events, layer, crowd, fx) {
    this.events = events;
    this.layer = layer;
    this.crowd = crowd;
    this.fx = fx;
    this.active = [];
    this.lastHitAt = 0;
    this.onBoss = null;   // ставит main
  }

  reset() {
    for (const ev of this.events) ev.spawned = false;
    for (const v of this.active) v.view.destroy({ children: true });
    this.active.length = 0;
  }

  // экранная Y объекта по его дистанции
  _y(ev, traveled) {
    return C.CROWD_Y + (traveled - ev.dist);
  }

  update(dt, traveled) {
    // спавним то, что подъехало на экран
    for (const ev of this.events) {
      if (!ev.spawned && ev.dist - traveled < 2100) {
        ev.spawned = true;
        this.active.push(this._makeView(ev));
      }
    }

    for (let i = this.active.length - 1; i >= 0; i--) {
      const v = this.active[i];
      const y = this._y(v.ev, traveled);
      v.view.position.y = y;
      if (v.prevY === undefined) v.prevY = y;

      switch (v.ev.type) {
        case 'gates': this._updateGates(v, y, dt); break;
        case 'blades': this._updateBlades(v, y, dt); break;
        case 'spikes': this._updateSpikes(v, y); break;
        case 'boss': this._updateBoss(v, y); break;
      }

      // уехало вниз — убираем
      if (y > C.CROWD_Y + 700 && v.passed) {
        if (this._bossView === v) { this._bossView = null; this._bossAnim = null; }
        v.view.destroy({ children: true });
        this.active.splice(i, 1);
      }
      v.prevY = y;
    }
  }

  _makeView(ev) {
    const view = new PIXI.Container();
    view.position.set(C.W / 2, -2000);
    const v = { ev, view, passed: false };

    if (ev.type === 'gates') {
      const half = C.ROAD_W / 2 - 8;
      const mkPanel = (op, x, good) => {
        const p = new PIXI.Sprite(Sprites.panel);
        p.tint = good ? C.COLORS.good : C.COLORS.bad;
        p.anchor.set(0.5);
        p.scale.set((half + 8) / 460, 0.8);
        p.position.set(x, 0);
        const txt = new PIXI.Text(`${op.op}${op.v}`, {
          fontFamily: 'Arial', fontSize: 96, fontWeight: '900',
          fill: 0xffffff, stroke: 0x1a1d33, strokeThickness: 12,
        });
        txt.anchor.set(0.5);
        txt.position.set(x, 0);
        view.addChild(p, txt);
        return { p, txt };
      };
      v.left = mkPanel(ev.left, -half / 2 - 4, ev.left.op === '×' || ev.left.op === '+');
      v.right = mkPanel(ev.right, half / 2 + 4, ev.right.op === '×' || ev.right.op === '+');
    } else if (ev.type === 'blades') {
      v.sprites = [];
      for (let i = 0; i < ev.n; i++) {
        const s = new PIXI.Sprite(Sprites.blade);
        s.anchor.set(0.5);
        s.scale.set(0.9);
        s.x = ev.n === 1 ? 0 : (i === 0 ? -190 : 190);
        view.addChild(s);
        v.sprites.push(s);
      }
      v.r = 76;
    } else if (ev.type === 'spikes') {
      const side = ev.side; // -1 левая половина, 1 правая
      const half = C.ROAD_W / 2;
      const base = new PIXI.Graphics()
        .beginFill(0x1a1d33, 0.85)
        .drawRoundedRect(side < 0 ? -half : 0, -30, half, 60, 12)
        .endFill();
      view.addChild(base);
      for (let i = 0; i < 6; i++) {
        const s = new PIXI.Sprite(Sprites.spike);
        s.anchor.set(0.5);
        const x = side < 0
          ? -half + 40 + i * (half - 80) / 5
          : 40 + i * (half - 80) / 5;
        s.position.set(x, 0);
        view.addChild(s);
      }
    } else if (ev.type === 'boss') {
      const wall = new PIXI.Sprite(Sprites.bossWall);
      wall.anchor.set(0.5);
      view.addChild(wall);
      v.wall = wall;
      const txt = new PIXI.Text(String(ev.hp), {
        fontFamily: 'Arial', fontSize: 150, fontWeight: '900',
        fill: 0xffd23f, stroke: 0x1a1d33, strokeThickness: 16,
      });
      txt.anchor.set(0.5);
      view.addChild(txt);
      v.txt = txt;
    }

    this.layer.addChild(view);
    return v;
  }

  // --- поведение каждого типа ---

  _updateGates(v, y, dt) {
    if (!v.passed && v.prevY < C.CROWD_Y && y >= C.CROWD_Y) {
      v.passed = true;
      const goLeft = this.crowd.leaderX < C.W / 2;
      const chosen = goLeft ? v.ev.left : v.ev.right;
      const chosenPanel = goLeft ? v.left : v.right;
      const other = goLeft ? v.right : v.left;

      const before = this.crowd.count;
      this.crowd.applyOp(chosen.op, chosen.v);
      const after = this.crowd.count;
      const good = after > before;

      this.fx.popups.show(
        C.W / 2 + (goLeft ? -200 : 200), C.CROWD_Y - 160,
        `${chosen.op}${chosen.v}`,
        good ? C.COLORS.good : C.COLORS.bad,
      );
      if (good) this.fx.audio.gateGood(); else this.fx.audio.gateBad();
      this.fx.cam.shake(good ? 5 : 9, 0.18);
      try { navigator.vibrate && navigator.vibrate(12); } catch (e) { /* не на мобиле */ }

      // панели разлетаются в стороны и гаснут
      v.anim = (dt2) => {
        for (const [obj, dir] of [[chosenPanel, goLeft ? -1 : 1], [other, goLeft ? 1 : -1]]) {
          obj.p.x += dir * 1500 * dt2;
          obj.p.alpha = Math.max(0, obj.p.alpha - dt2 * 3.5);
          obj.txt.alpha = Math.max(0, obj.txt.alpha - dt2 * 3.5);
          obj.txt.y -= 240 * dt2;
        }
      };
    }
    if (v.anim) v.anim(dt);
  }

  _updateBlades(v, y, dt) {
    for (const s of v.sprites) {
      s.rotation += dt * 4.2;
      const bx = C.W / 2 + s.x;
      const by = y;
      const hitR = v.r + C.AGENT_R;
      for (const a of this.crowd.agents) {
        const dx = a.x - bx, dy = a.y - by;
        if (dx * dx + dy * dy < hitR * hitR) {
          if (this.crowd.killAt(bx, by)) {
            const now = performance.now();
            if (now - this.lastHitAt > 70) {
              this.lastHitAt = now;
              this.fx.audio.hit();
              this.fx.cam.shake(6, 0.12);
            }
          }
          break; // одна лопасть — один юнит за кадр
        }
      }
    }
  }

  _updateSpikes(v, y) {
    if (!v.passed && v.prevY < C.CROWD_Y && y >= C.CROWD_Y) {
      v.passed = true;
      const killed = this.crowd.killSide(v.ev.side);
      if (killed > 0) {
        this.fx.audio.hit();
        this.fx.cam.shake(10, 0.2);
        this.fx.popups.show(
          C.W / 2 + v.ev.side * 220, C.CROWD_Y - 140,
          `-${killed}`, C.COLORS.bad,
        );
        try { navigator.vibrate && navigator.vibrate(25); } catch (e) { /* ладно */ }
      }
    }
  }

  _updateBoss(v, y) {
    if (!v.passed && v.prevY < C.CROWD_Y && y >= C.CROWD_Y - 60) {
      v.passed = true;
      if (this.onBoss) this.onBoss(v);
    }
  }

  // пробитие стены (победа): стена оседает и тает
  breakBoss(v) {
    this._bossView = v;
    this._bossAnim = (dt) => {
      if (v.view.destroyed) return; // вид уже уехал и удалён
      v.wall.scale.y = Math.max(0.02, v.wall.scale.y - dt * 3);
      v.wall.alpha = Math.max(0, v.wall.alpha - dt * 2.4);
      v.txt.alpha = Math.max(0, v.txt.alpha - dt * 3.5);
    };
  }

  tickBoss(dt) {
    if (this._bossAnim) this._bossAnim(dt);
  }
}
