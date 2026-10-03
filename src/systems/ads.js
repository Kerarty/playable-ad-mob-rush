// Обвязка под рекламные сети: MRAID, если он есть; иначе обычный браузер.
// Плюс интерфейс аналитики — в реальном ad-кейсе сюда идут события воронки.

export const Ads = {
  hasMraid: false,
  viewable: true,
  onPause: null,
  onResume: null,

  init(onPause, onResume) {
    this.onPause = onPause;
    this.onResume = onResume;

    if (typeof window.mraid !== 'undefined') {
      this.hasMraid = true;
      const mraid = window.mraid;
      const onReady = () => {
        this.viewable = mraid.isViewable();
        mraid.addEventListener('viewableChange', (v) => this._setViewable(v));
      };
      if (mraid.getState() === 'loading') mraid.addEventListener('ready', onReady);
      else onReady();
      mraid.addEventListener('error', (e) => console.warn('mraid error:', e));
    } else {
      // fallback: обычный браузер / превью в сети
      document.addEventListener('visibilitychange', () => {
        this._setViewable(!document.hidden);
      });
    }
  },

  _setViewable(v) {
    if (v === this.viewable) return;
    this.viewable = v;
    if (v && this.onResume) this.onResume();
    if (!v && this.onPause) this.onPause();
  },

  // события воронки: tutorial_start, tutorial_complete, level_complete, cta_click...
  trackEvent(name, data) {
    if (!window.__adEvents) window.__adEvents = [];
    window.__adEvents.push({ name, data, t: Date.now() });
    console.debug('[ad-event]', name, data || '');
  },

  // переход в стор по CTA
  openStore(url) {
    this.trackEvent('cta_click');
    if (this.hasMraid && typeof window.mraid.open === 'function') {
      window.mraid.open(url);
    } else {
      window.open(url, '_blank');
    }
  },
};
