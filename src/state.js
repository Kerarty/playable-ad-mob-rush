// Простая машина состояний: boot -> tutorial -> run -> (win | lose) -> endcard
export class FSM {
  constructor() {
    this.states = {};
    this.current = null;
    this.currentName = '';
  }

  add(name, handlers) {
    this.states[name] = handlers;
    return this;
  }

  go(name, ...args) {
    const prev = this.current;
    if (prev && prev.exit) prev.exit();
    this.currentName = name;
    this.current = this.states[name];
    if (this.current && this.current.enter) this.current.enter(...args);
  }

  update(dt) {
    if (this.current && this.current.update) this.current.update(dt);
  }
}

// детерминированный рандом — уровень генерится по сиду и всегда одинаковый
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
