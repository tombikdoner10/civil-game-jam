/**
 * Oyun genelindeki sabitler. Tema açıklanınca ilk iş burayı güncelle:
 * başlık, palet ve gerekirse çözünürlük.
 */

export const TITLE = 'OYUN ADI';
export const SUBTITLE = 'CIVIL GAME JAM 2026';
export const TEAM = 'Prompt Engineers';

/** localStorage öneki. github.io'da aynı kullanıcının bütün oyunları aynı depoyu paylaşır, çakışmasın. */
export const GAME_ID = 'pe-cgj26';

/** Mantıksal çözünürlük; tarayıcı penceresine orantılı ölçeklenir. Piksel sanatı için küçült ve main.ts'de pixelArt: true yap. */
export const WIDTH = 1920;
export const HEIGHT = 1080;

/**
 * İkisi de piksel yazı tipi (SIL OFL 1.1).
 * FONT (VT323): arayüz, düğmeler, belgeler, saat; bütün gövde metni ve etiketler.
 * BASLIK_FONT (Pixelify Sans): yalnızca birkaç büyük başlık. Pixelify'ın köşeleri kesik çizildiği
 * için her boyda Z→2, B→G, C→O, 5→S, E/e→ε gibi karışıyor; küçük metinde ve bu harfleri
 * içeren başlıklarda kullanma.
 */
export const FONT = '"VT323", Consolas, monospace';
export const MONO = FONT;
export const BASLIK_FONT = '"Pixelify Sans", "Segoe UI", system-ui, sans-serif';

/** Renk paleti (Phaser sayı biçimi). Metin rengi gerekirse css() ile dönüştür. */
export const COLORS = {
  bg: 0x12141a,
  panel: 0x1d212b,
  panelHi: 0x2a3040,
  text: 0xf2f4f8,
  muted: 0x8a93a6,
  primary: 0xffb020,
  accent: 0x4cc9f0,
  danger: 0xef476f,
  success: 0x06d6a0,
} as const;

export const css = (color: number): string => '#' + color.toString(16).padStart(6, '0');

/** `npm run dev` ile ya da adrese ?dev eklenince açık: geliştirici menüleri ve kısayollar. */
export const DEV = import.meta.env.DEV || new URLSearchParams(location.search).has('dev');

export const COMMIT: string = __COMMIT__;
export const BUILD_TIME: string = __BUILD_TIME__;

/** Menüde görünen kısa sürüm: commit'in ilk 7 hanesi; kaydedilmemiş değişiklik varsa sonunda *. */
export const VERSION = COMMIT.slice(0, 7) + (COMMIT.endsWith('-degisiklikli') ? '*' : '');
