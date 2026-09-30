// Тряска экрана и hit-stop (короткая заморозка времени при сильных ударах)
export class Camera {
  constructor(container) {
    this.container = container;
    this.amp = 0;
    this.dur = 0;
    this.elapsed = 0;
    this.timescale = 1;
    this.freezeLeft = 0;
  }

  shake(amp, dur) {
    this.amp = Math.max(this.amp, amp);
    this.dur = Math.max(this.dur, dur);
  }

  // заморозить игру на ms миллисекунд
  hitStop(ms) {
    this.freezeLeft = Math.max(this.freezeLeft, ms / 1000);
  }

  // множитель dt для игрового апдейта
  dtScale() {
    return this.freezeLeft > 0 ? 0 : this.timescale;
  }

  update(dt) {
    if (this.freezeLeft > 0) {
      this.freezeLeft -= dt; // freeze тикает реальным временем
      if (this.freezeLeft <= 0) {
        this.container.position.set(0, 0);
        return;
      }
    }
    if (this.dur > 0) {
      this.elapsed += dt;
      const t = 1 - this.elapsed / this.dur;
      if (t <= 0) {
        this.dur = 0;
        this.amp = 0;
        this.elapsed = 0;
        this.container.position.set(0, 0);
      } else {
        this.container.position.set(
          (Math.random() - 0.5) * 2 * this.amp * t,
          (Math.random() - 0.5) * 2 * this.amp * t,
        );
      }
    }
  }
}
