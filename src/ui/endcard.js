// End Card — финальный экран playable: логотип, кнопка INSTALL NOW.
// Клик в любую точку = переход в стор.
import { CONFIG } from '../config.js';

const C = CONFIG;

export class EndCard {
  constructor(layer, onCta) {
    this.onCta = onCta;

    this.root = new PIXI.Container();
    this.root.visible = false;
    this.root.alpha = 0;
    layer.addChild(this.root);

    // затемнение
    this.dim = new PIXI.Graphics()
      .beginFill(0x0d1022, 0.88)
      .drawRect(0, 0, C.W, C.H)
      .endFill();
    this.dim.interactive = true;
    this.root.addChild(this.dim);

    // логотип
    const logo = new PIXI.Text('MOB RUSH!', {
      fontFamily: 'Arial', fontSize: 130, fontWeight: '900', fontStyle: 'italic',
      fill: 0xffd23f, stroke: 0x1a1d33, strokeThickness: 16,
      dropShadow: true, dropShadowColor: '#000000', dropShadowBlur: 12,
      dropShadowDistance: 8, dropShadowAngle: Math.PI / 2,
    });
    logo.anchor.set(0.5);
    logo.position.set(C.W / 2, C.H * 0.34);
    this.root.addChild(logo);

    const sub = new PIXI.Text('Run. Grow. Smash the wall!', {
      fontFamily: 'Arial', fontSize: 44, fontWeight: '700',
      fill: 0xffffff,
    });
    sub.anchor.set(0.5);
    sub.alpha = 0.85;
    sub.position.set(C.W / 2, C.H * 0.42);
    this.root.addChild(sub);

    // маленький результат забега
    this.score = new PIXI.Text('', {
      fontFamily: 'Arial', fontSize: 38, fontWeight: '700',
      fill: 0x80ed99, stroke: 0x1a1d33, strokeThickness: 8,
    });
    this.score.anchor.set(0.5);
    this.score.position.set(C.W / 2, C.H * 0.48);
    this.root.addChild(this.score);

    // кнопка CTA
    this.btn = new PIXI.Container();
    const bg = new PIXI.Graphics();
    const drawBtn = (w) => {
      bg.clear()
        .beginFill(0x2ee66b)
        .lineStyle({ width: 8, color: 0x1a1d33 })
        .drawRoundedRect(-w / 2, -66, w, 132, 34)
        .endFill();
    };
    drawBtn(560);
    this.btnBg = bg;
    const btnTxt = new PIXI.Text('INSTALL NOW', {
      fontFamily: 'Arial', fontSize: 60, fontWeight: '900',
      fill: 0xffffff, stroke: 0x1a1d33, strokeThickness: 8,
    });
    btnTxt.anchor.set(0.5);
    this.btn.addChild(bg, btnTxt);
    this.btn.position.set(C.W / 2, C.H * 0.62);
    this.root.addChild(this.btn);

    this.t = 0;
  }

  show(crowdCount) {
    this.score.text = `Your crowd: ${crowdCount}`;
    this.root.visible = true;
    this.root.alpha = 0;
  }

  update(dt) {
    if (!this.root.visible) return;
    // плавное появление + пульс кнопки
    this.root.alpha = Math.min(1, this.root.alpha + dt * 3);
    this.t += dt;
    const s = 1 + Math.sin(this.t * 5) * 0.04;
    this.btn.scale.set(s);
    this.btnBg.tint = Math.sin(this.t * 5) > 0 ? 0x2ee66b : 0x27cc5e;
  }

  click() {
    if (this.root.visible && this.onCta) this.onCta();
  }
}
