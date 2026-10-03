// Туториал: анимированная рука показывает свайп. Убирается, как только
// игрок сам потянул толпу. Без единого слова — так и должно быть в playable.
import { CONFIG } from '../config.js';
import { Sprites } from '../render/sprites.js';

const C = CONFIG;

export class Tutorial {
  constructor(layer) {
    this.hand = new PIXI.Sprite(Sprites.hand);
    this.hand.anchor.set(0.5);
    this.hand.scale.set(1.4);
    this.hand.visible = false;
    layer.addChild(this.hand);

    this.ring = new PIXI.Graphics();
    this.ring.visible = false;
    layer.addChild(this.ring);

    this.t = 0;
    this.active = false;
  }

  show() {
    this.active = true;
    this.hand.visible = true;
    this.ring.visible = true;
  }

  hide() {
    this.active = false;
    this.hand.visible = false;
    this.ring.visible = false;
  }

  update(dt) {
    if (!this.active) return;
    this.t += dt;

    // рука ходит влево-вправо от центра, как будто водит толпу
    const swing = Math.sin(this.t * 2.2) * 170;
    this.hand.position.set(C.W / 2 + swing, C.CROWD_Y - 60);
    this.hand.rotation = Math.sin(this.t * 2.2) * 0.12;

    // пульсирующее кольцо вокруг точки касания
    const p = (this.t % 1) / 1;
    this.ring.clear()
      .lineStyle({ width: 8 * (1 - p) + 2, color: 0xffffff, alpha: 0.7 * (1 - p) })
      .drawCircle(C.W / 2 + swing, C.CROWD_Y - 30, 30 + p * 70);
  }
}
