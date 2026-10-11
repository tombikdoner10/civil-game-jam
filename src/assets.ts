import type * as Phaser from 'phaser';

/**
 * Dosyadan yüklenen varlıklar. Dosyaları public/assets/ altına koy ve burada listele.
 *
 * ÖNEMLİ (kural 3.4 ve 4.2): Hazır bir kaynak eklediğinde src/data/credits.ts'e ve
 * README'deki beyan tablosuna kaynağını, lisansını ve nerede kullanıldığını yaz.
 * Yeniden dağıtımı yasak dosyaları repoya koyma (kural 3.6).
 */
export function loadAssets(load: Phaser.Loader.LoaderPlugin): void {
  load.setPath('assets/');
  // load.image('oyuncu', 'images/oyuncu.png');
  // load.spritesheet('patlama', 'images/patlama.png', { frameWidth: 64, frameHeight: 64 });
  // load.audio('muzik', ['audio/muzik.ogg', 'audio/muzik.mp3']);
}
