// первый запуск: пустая сцена, проверяю letterbox
const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x0d1022,
  antialias: true,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  autoDensity: true,
});
document.body.appendChild(app.view);

// рисую в дизайн-разрешении 1080x1920 (портрет), потом вписываю в экран
const W = 1080, H = 1920;
const root = new PIXI.Container();
app.stage.addChild(root);
let viewScale = 1;

function layout() {
  const w = window.innerWidth, h = window.innerHeight;
  app.renderer.resize(w, h);
  const s = Math.min(w / W, h / H);
  viewScale = s;
  root.scale.set(s);
  root.position.set((w - W * s) / 2, (h - H * s) / 2);
}
layout();
window.addEventListener('resize', layout);

const bg = new PIXI.Graphics()
  .beginFill(0x12152a)
  .drawRect(0, 0, W, H)
  .endFill();
root.addChild(bg);

const caption = new PIXI.Text('MOB RUSH! — dev build', {
  fontFamily: 'Arial', fontSize: 40, fontWeight: '900', fill: 0xffd23f,
});
caption.position.set(40, 40);
root.addChild(caption);

app.ticker.add(() => {
  // игровой цикл будет тут
});
