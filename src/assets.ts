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

// Kenney Tiny Town (CC0 1.0): bina cepheleri ve sokak; renkler çalışma anında palete boyanır (src/desk/tiles.ts).
import tinyTown from './art/tiny-town/tilemap_packed.png';

// Kenney ses paketleri (CC0 1.0): src/sounds/kenney/<paket>/*.ogg. Hepsi derlemede import edilir (eager glob,
// dinamik import değil); ZIP sürümünde HTML'e gömülür. Anahtar: uzantısız dosya adı (src/audio/sesler.ts kullanır).
const kenneySesleri = import.meta.glob<string>('./sounds/kenney/**/*.ogg', { eager: true, import: 'default' });
// Ana menü müziği (G68): takımın bestesi (FL Studio; hazır döngü, örnek paketi ve yapay zekâ yok). Claude WAV'ı OGG'ye
// dönüştürdü. MenuScene döngüyle çalar.
import anaMenuMuzik from './sounds/takim/ana-menu.ogg';
/** Ana menü müziğinin ses önbelleği anahtarı. */
export const ANA_MENU_MUZIK = 'ana-menu-muzik';
// import oyuncu from './art/oyuncu.png';
// import patlama from './art/patlama.png';
// import muzik from './sounds/muzik.mp3';

export function loadAssets(_load: Phaser.Loader.LoaderPlugin): void {
  _load.image('tiny-town', tinyTown);
  for (const [yol, url] of Object.entries(kenneySesleri)) {
    const ad = yol.slice(yol.lastIndexOf('/') + 1).replace(/\.ogg$/, '');
    _load.audio(ad, url);
  }
  _load.audio(ANA_MENU_MUZIK, anaMenuMuzik);
  // _load.image('oyuncu', oyuncu);
  // _load.spritesheet('patlama', patlama, { frameWidth: 64, frameHeight: 64 });
  // _load.audio('muzik', muzik);
}
