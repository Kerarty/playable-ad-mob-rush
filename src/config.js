// Вся настройка игры в одном месте — удобно крутить баланс
export const CONFIG = {
  // дизайн-разрешение, под него рисую весь арт (портрет, как у playable ads)
  W: 1080,
  H: 1920,

  ROAD_W: 860,               // ширина дороги
  get ROAD_X() { return (this.W - this.ROAD_W) / 2; },

  CROWD_Y: 1380,             // где на экране стоит толпа
  SPEED: 430,                // скорость бега, px/сек
  DRAG_SENS: 1.7,            // насколько резко реагирует толпа на палец

  START_COUNT: 3,            // с какой толпы начинаем
  MAX_AGENTS: 240,           // потолок отрисованных человечков (дальше только число)
  AGENT_R: 24,               // радиус человечка для коллизий

  BOSS_MIN_HP: 25,           // у стены-босса написано число; реальное hp считает генератор уровня
  LEVEL_LEN: 12800,          // длина уровня в px

  SEED: 20261005,            // сид генерации — уровень всегда одинаковый (для ad-креатива так и надо)

  STORE_URL: 'https://play.google.com/store/apps/details?id=com.demo.mobrush',

  COLORS: {
    bg: 0x12152a,
    road: 0x20243d,
    roadStripe: 0x2b3052,
    wallSide: 0x2c3154,
    crowd: [0xffd23f, 0x4cc9f0, 0xf72585, 0x80ed99, 0xff8fab, 0xc77dff],
    good: 0x2ee66b,
    bad: 0xff4d5e,
    steel: 0xaab4d4,
    accent: 0xffd23f,
    ink: 0x1a1d33,
  },
};
