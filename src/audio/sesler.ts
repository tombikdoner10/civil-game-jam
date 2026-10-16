import { sfx } from './sfx';

/**
 * Oyun olayları → Kenney CC0 ses dosyaları (src/sounds/kenney/<paket>/). Takım ara testte dinleyip buradan
 * değiştirir: dosya adını değiştir (uzantısız), yeni dosyayı aynı klasöre kopyala; docs/SESLER.md'de adaylar var.
 * Ayarlar: volume (düzey), rate (hız ve perde; 0.5 = bir oktav pes), gecikme (sn), bas (baştaki sessizliği atla, sn).
 * Her tanımın üçüncü bağımsız değişkeni, dosyalar yüklenmezse çalınacak sentez sesidir (sfx.ts).
 * Hazır kaynak beyanı: src/data/credits.ts (ASSETS.audio) ve README.
 */
export function seslerKur(): void {
  const t = sfx.dosyaTanimla;

  // Arayüz (menü düğmeleri, duraklatma, ayarlar). Var olan sentez adlarının yerine geçer.
  t('confirm', { dosya: ['click1'], volume: 0.9 }, 'confirm');
  t('click', { dosya: ['click2'], volume: 0.9 }, 'click');
  t('back', { dosya: ['back_003'], volume: 0.7 }, 'back');
  t('hover', { dosya: ['rollover2'], volume: 0.35 }, 'hover');

  // Damga tokmağı: ağır yumruk (tok) + ahşap masa (küt).
  t(
    'damga',
    [
      { dosya: ['impactPunch_heavy_000', 'impactPunch_heavy_001', 'impactPunch_heavy_002'], volume: 1.1, rate: 0.85, bas: 0.008 },
      { dosya: ['impactWood_heavy_000', 'impactWood_heavy_001', 'impactWood_heavy_002'], volume: 0.8, rate: 0.9 },
    ],
    'thud',
  );

  // İADE damgası: daha hafif ve tiz bir tokmak + dosya kapanır (geri çevrildi). Yeni dosya yok.
  t(
    'iade',
    [
      { dosya: ['impactPunch_heavy_000', 'impactPunch_heavy_001', 'impactPunch_heavy_002'], volume: 0.8, rate: 1.05, bas: 0.008 },
      { dosya: ['bookClose'], volume: 0.7, rate: 0.9, gecikme: 0.08, bas: 0.06 },
    ],
    'thud',
  );

  // Kâğıt: gişeden kayma, elde tutma, masaya bırakma, toplanıp geri verilme.
  t('kagitKay', { dosya: ['bookFlip2', 'bookFlip3'], volume: 0.9, rate: 1.1, oynama: 0.08, bas: 0.02 }, 'whoosh');
  t('kagitAl', { dosya: ['bookFlip3'], volume: 0.45, rate: 1.25, oynama: 0.08, bas: 0.025 }, 'click');
  t('kagitBirak', { dosya: ['bookPlace1', 'bookPlace2', 'bookPlace3'], volume: 0.4, rate: 1.3, oynama: 0.08, bas: 0.01 }, 'thud');
  t(
    'kagitTopla',
    [
      { dosya: ['bookClose'], volume: 0.8, bas: 0.06 },
      { dosya: ['bookFlip2', 'bookFlip3'], volume: 0.7, rate: 1.1, gecikme: 0.12, bas: 0.02 },
    ],
    'whoosh',
  );

  // Kural kitabı.
  t(
    'kitapAc',
    [
      { dosya: ['bookOpen'], volume: 2.5, bas: 0.01 },
      { dosya: ['bookPlace3'], volume: 0.35, rate: 1.1 },
    ],
    'click',
  );
  t('kitapKapa', { dosya: ['bookClose'], volume: 0.8, bas: 0.06 }, 'click');
  t('sayfa', { dosya: ['bookFlip1'], volume: 1.2, rate: 1.15, bas: 0.26 }, 'click');

  // Damga çubuğu (Tab): ahşap çekmece.
  t('tepsi', { dosya: ['impactWood_light_001'], volume: 0.5, rate: 0.9, gecikme: 0.12 }, 'click');

  // İnceleme modu.
  t('inceleAc', { dosya: ['metalLatch'], volume: 0.8, rate: 0.9, bas: 0.03 }, 'click');
  t('inceleKapa', { dosya: ['metalClick'], volume: 1.2, rate: 0.95, bas: 0.05 }, 'back');
  t('sec', { dosya: ['click2'], volume: 0.8, rate: 1.1 }, 'click');
  t('secBirak', { dosya: ['back_002'], volume: 0.6 }, 'back');
  t(
    'kusur',
    [
      { dosya: ['bong_001'], volume: 0.9, rate: 0.8, oynama: 0 },
      { dosya: ['impactPlate_heavy_001'], volume: 0.45, rate: 0.9 },
    ],
    'confirm',
  );
  t('tutarsizlikYok', { dosya: ['error_004'], volume: 0.6, rate: 0.9 }, 'error');

  // Karar fişi ve geri bildirim.
  t(
    'fis',
    [
      { dosya: ['bookFlip3'], volume: 0.6, rate: 1.35, bas: 0.025 },
      { dosya: ['bookPlace1', 'bookPlace3'], volume: 0.35, rate: 1.5, gecikme: 0.15 },
    ],
    'whoosh',
  );
  t('dogru', { dosya: ['confirmation_001'], volume: 0.35, rate: 0.9, oynama: 0 }, 'confirm');
  t('uyari', { dosya: ['error_005'], volume: 0.45 }, 'error');

  // Gişe: mal sahibinin ayak sesleri.
  t(
    'siluet',
    [
      { dosya: ['footstep00'], volume: 0.3, rate: 0.9 },
      { dosya: ['footstep03'], volume: 0.25, rate: 0.9, gecikme: 0.32 },
    ],
    'thud',
  );

  // Gişe konuşması (G17): balonda harf yazılırken kısa tık; zarf masaya kayar, çekmeceye girer, geri verilir.
  t('konus', { dosya: ['click2'], volume: 0.14, rate: 1.9, oynama: 0.18 }, 'click');
  t('zarfKay', { dosya: ['bookFlip2'], volume: 0.8, rate: 0.85, bas: 0.02 }, 'whoosh');
  t(
    'zarfCekmece',
    [
      { dosya: ['bookPlace2'], volume: 0.5, rate: 1.1 },
      { dosya: ['impactWood_light_001'], volume: 0.5, rate: 0.85, gecikme: 0.1 },
    ],
    'thud',
  );
  t('zarfRet', { dosya: ['bookFlip3'], volume: 0.8, rate: 0.9, bas: 0.025 }, 'whoosh');

  // Deprem (Quake.ts): gürleme tabanı sfx.gurleme() (kodla), üstüne bunlar.
  t(
    'depremVurus',
    [
      { dosya: ['impactSoft_heavy_003'], volume: 1.3, rate: 0.4, oynama: 0.1 },
      { dosya: ['impactPunch_heavy_000', 'impactPunch_heavy_001', 'impactPunch_heavy_002'], volume: 0.9, rate: 0.35, oynama: 0.1, gecikme: 0.04 },
    ],
    'explosion',
  );
  t('moloz', { dosya: ['impactMining_000', 'impactMining_002', 'impactMining_004'], volume: 0.5, rate: 0.85, oynama: 0.15 }, 'hit');
  t('catirti', { dosya: ['creak1', 'creak3', 'impactPlank_medium_001', 'impactPlank_medium_002'], volume: 0.5, rate: 0.65, oynama: 0.12 }, 'hit');
  t('camTitreme', { dosya: ['impactGlass_light_000', 'impactGlass_light_002'], volume: 0.18, rate: 0.95, oynama: 0.1 }, 'hit');
  t(
    'hasar',
    [
      { dosya: ['impactPlank_medium_001', 'impactPlank_medium_002'], volume: 0.8, rate: 0.6, oynama: 0.1 },
      { dosya: ['impactMining_000', 'impactMining_002', 'impactMining_004'], volume: 0.6, rate: 0.7, oynama: 0.1, gecikme: 0.05 },
    ],
    'hit',
  );
  t(
    'cokus',
    [
      { dosya: ['impactSoft_heavy_003'], volume: 1.4, rate: 0.35 },
      { dosya: ['impactMining_000', 'impactMining_002', 'impactMining_004'], volume: 0.9, rate: 0.55, oynama: 0.1, gecikme: 0.05 },
      { dosya: ['impactMining_000', 'impactMining_002', 'impactMining_004'], volume: 0.7, rate: 0.7, oynama: 0.1, gecikme: 0.3 },
      { dosya: ['impactGlass_heavy_000'], volume: 0.5, rate: 0.8, gecikme: 0.15 },
    ],
    'explosion',
  );

  // Gün sonu raporu (müzik düzeyine bağlı).
  t('gunIyi', { dosya: ['jingles_PIZZI10'], volume: 0.8, oynama: 0, kanal: 'muzik' }, 'win');
  t('gunKotu', { dosya: ['jingles_PIZZI07'], volume: 0.8, oynama: 0, kanal: 'muzik' }, 'hurt');
}
