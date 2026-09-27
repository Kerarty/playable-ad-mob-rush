// Весь арт рисуется кодом на canvas при загрузке — ни одной картинки в билде.
// Человечки белые, цвет задаётся tint'ом у спрайта.
import { CONFIG } from '../config.js';

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  return PIXI.Texture.from(c);
}

// человечек, 2 кадра бега (ноги в разные стороны)
function runnerTex(frame) {
  const swing = frame === 0 ? 13 : -13;
  return canvasTex(72, 84, (c) => {
    c.lineCap = 'round';
    // ноги: сначала тёмный контур, потом белая нога
    const leg = (x1, y1, x2, y2) => {
      c.strokeStyle = '#1a1d33'; c.lineWidth = 13;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 7;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    };
    leg(36, 54, 36 - swing, 78);
    leg(36, 54, 36 + swing, 78);
    // тело
    c.fillStyle = '#ffffff'; c.strokeStyle = '#1a1d33'; c.lineWidth = 5;
    c.beginPath();
    if (c.roundRect) c.roundRect(21, 26, 30, 32, 13); else c.rect(21, 26, 30, 32);
    c.fill(); c.stroke();
    // голова
    c.beginPath(); c.arc(36, 15, 12, 0, Math.PI * 2);
    c.fill(); c.stroke();
  });
}

export const Sprites = {
  init() {
    this.runner0 = runnerTex(0);
    this.runner1 = runnerTex(1);

    // тень под человечком
    this.shadow = canvasTex(64, 24, (c) => {
      c.fillStyle = 'rgba(0,0,0,0.3)';
      c.beginPath(); c.ellipse(32, 12, 28, 9, 0, 0, Math.PI * 2); c.fill();
    });

    // лопасть (мясорубка)
    this.blade = canvasTex(170, 170, (c) => {
      c.translate(85, 85);
      // зубья
      for (let i = 0; i < 8; i++) {
        c.save();
        c.rotate((Math.PI * 2 / 8) * i);
        c.fillStyle = '#dfe6f5'; c.strokeStyle = '#1a1d33'; c.lineWidth = 5;
        c.beginPath();
        c.moveTo(-13, -46); c.lineTo(0, -84); c.lineTo(13, -46);
        c.closePath(); c.fill(); c.stroke();
        c.restore();
      }
      // диск
      c.fillStyle = '#aab4d4'; c.strokeStyle = '#1a1d33'; c.lineWidth = 6;
      c.beginPath(); c.arc(0, 0, 52, 0, Math.PI * 2); c.fill(); c.stroke();
      // красные полосы
      c.fillStyle = '#ff4d5e';
      for (let i = 0; i < 4; i++) {
        c.save(); c.rotate((Math.PI / 2) * i);
        c.fillRect(-5, -40, 10, 22);
        c.restore();
      }
      // центр
      c.fillStyle = '#1a1d33';
      c.beginPath(); c.arc(0, 0, 13, 0, Math.PI * 2); c.fill();
    });

    // шип
    this.spike = canvasTex(76, 56, (c) => {
      c.fillStyle = '#c7d0e8'; c.strokeStyle = '#1a1d33'; c.lineWidth = 5;
      c.beginPath();
      c.moveTo(38, 4); c.lineTo(72, 52); c.lineTo(4, 52);
      c.closePath(); c.fill(); c.stroke();
    });

    // панель для ворот (белая, цвет через tint)
    this.panel = canvasTex(460, 340, (c) => {
      c.fillStyle = 'rgba(255,255,255,0.22)';
      c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 10;
      c.beginPath();
      if (c.roundRect) c.roundRect(12, 12, 436, 316, 26); else c.rect(12, 12, 436, 316);
      c.fill(); c.stroke();
    });

    // стена-босс
    this.bossWall = canvasTex(880, 300, (c) => {
      c.fillStyle = '#3a3f66'; c.strokeStyle = '#1a1d33'; c.lineWidth = 8;
      c.beginPath();
      if (c.roundRect) c.roundRect(4, 4, 872, 292, 16); else c.rect(4, 4, 872, 292);
      c.fill(); c.stroke();
      // «кирпичи»
      c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 4;
      for (let y = 60; y < 292; y += 58) {
        c.beginPath(); c.moveTo(8, y); c.lineTo(872, y); c.stroke();
      }
      for (let y = 60, row = 0; y < 292; y += 58, row++) {
        for (let x = (row % 2 ? 60 : 110); x < 872; x += 120) {
          c.beginPath(); c.moveTo(x, y); c.lineTo(x, Math.min(y + 58, 292)); c.stroke();
        }
      }
      // сигнальные полосы сверху и снизу
      c.fillStyle = '#ffd23f';
      for (let x = -20; x < 900; x += 56) {
        c.save();
        c.beginPath();
        c.moveTo(x, 10); c.lineTo(x + 26, 10); c.lineTo(x + 10, 34); c.lineTo(x - 16, 34);
        c.closePath(); c.fill();
        c.beginPath();
        c.moveTo(x, 290); c.lineTo(x + 26, 290); c.lineTo(x + 10, 266); c.lineTo(x - 16, 266);
        c.closePath(); c.fill();
        c.restore();
      }
    });

    // рука для туториала — эмодзи в текстуру, проще и милота
    this.hand = canvasTex(150, 150, (c) => {
      c.font = '110px serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('👆', 75, 80);
    });

    // частицы
    this.dot = canvasTex(28, 28, (c) => {
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(14, 14, 11, 0, Math.PI * 2); c.fill();
    });
    this.confetti = canvasTex(24, 24, (c) => {
      c.fillStyle = '#fff';
      c.beginPath();
      if (c.roundRect) c.roundRect(2, 2, 20, 20, 5); else c.rect(2, 2, 20, 20);
      c.fill();
    });

    // столбики по краям дороги
    this.post = canvasTex(30, 170, (c) => {
      c.fillStyle = '#3d4370'; c.strokeStyle = '#1a1d33'; c.lineWidth = 4;
      c.beginPath();
      if (c.roundRect) c.roundRect(5, 10, 20, 150, 8); else c.rect(5, 10, 20, 150);
      c.fill(); c.stroke();
      c.fillStyle = '#ffd23f';
      c.beginPath(); c.arc(15, 14, 9, 0, Math.PI * 2); c.fill();
    });

    // палитра для толпы
    this.palette = CONFIG.COLORS.crowd;
  },
};
