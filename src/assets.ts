import type * as Phaser from 'phaser';

/**
 * Dosyadan yüklenen varlıklar. Dosyaları src/art/ ya da src/sounds/ altına koy, burada import et
 * ve loadAssets içinde yükle. import edilen dosyalar ZIP sürümünde (npm run zip) HTML'in içine gömülür;
 * oyun böylece internetsiz, çift tıklayınca çalışır. public/ klasöründen yüklenen dosyalar ZIP'te ÇALIŞMAZ.
 *
 * ÖNEMLİ (kural 3.4, 4.2): Hazır bir kaynak eklediğinde src/data/credits.ts'e ve README'deki
 * beyan tablosuna kategorisiyle (görsel, ses, kod, metin, diğer) ekle. Takımın kendi çizdiği ya da
 * kaydettiği dosyalar hazır kaynak değildir. Yeniden dağıtımı yasak dosyaları repoya koyma (kural 3.6).
 */

// import oyuncu from './art/oyuncu.png';
// import patlama from './art/patlama.png';
// import muzik from './sounds/muzik.mp3';

export function loadAssets(_load: Phaser.Loader.LoaderPlugin): void {
  // _load.image('oyuncu', oyuncu);
  // _load.spritesheet('patlama', patlama, { frameWidth: 64, frameHeight: 64 });
  // _load.audio('muzik', muzik);
}
