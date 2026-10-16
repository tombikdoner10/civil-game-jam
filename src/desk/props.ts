// @beyan görsel
import * as Phaser from 'phaser';
import { FONT } from '../config';
import { ustKatman } from './DocumentCard';
import { PAL } from './palette';
import { PX, rastgele, snap, Tuval } from './pixel';

/** Ahşap masa: kalaslar, damarlar, kenarlarda karartma. */
export function masaCiz(scene: Phaser.Scene, y: number): void {
  const W = 1920 / PX;
  const H = (1080 - y) / PX;
  const t = new Tuval(scene, W, H, 'masa');
  const rnd = rastgele(42);
  t.rect(0, 0, W, H, PAL.masa);
  // Kalaslar (yatay) ve damarlar
  const kalas = 22;
  for (let k = 0; k * kalas < H; k++) {
    const y0 = k * kalas;
    if (k % 2 === 1) t.dither(0, y0, W, kalas, PAL.masaKoyu, k);
    for (let d = 0; d < 9; d++) {
      const dy = y0 + 2 + Math.floor(rnd() * (kalas - 4));
      const dx = Math.floor(rnd() * W);
      const l = 20 + Math.floor(rnd() * 80);
      t.rect(dx, dy, l, 1, rnd() < 0.5 ? PAL.masaAcik : PAL.masaKoyu);
    }
    t.rect(0, y0, W, 1, '#241d19');
    // Ek yerleri
    const ek = 60 + Math.floor(rnd() * 300);
    t.rect(ek, y0, 1, kalas, '#241d19');
  }
  t.benek(0, 0, W, H, PAL.masaAcik, 0.02, rnd);
  // Tezgâhın masaya düşen gölgesi ve kenar karartma
  t.rect(0, 0, W, 2, '#1a1512');
  t.dither(0, 2, W, 2, '#1a1512');
  t.dither(0, 0, 3, H, '#1a1512');
  t.dither(W - 3, 0, 3, H, '#1a1512', 1);
  t.goruntu(0, y).setOrigin(0).setDepth(0);
}

/** Kural kitabı: masada kapalı, pasif (içeriği G4). */
export function kuralKitabi(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const W = 52;
  const H = 66;
  const t = new Tuval(scene, W + 2, H + 3, 'kitap');
  // Gölge
  t.rect(2, 3, W, H, '#00000066');
  // Sayfa kenarları
  t.rect(0, 0, W, H, '#1d191b');
  t.rect(2, 2, W - 3, H - 3, '#cfc5a6');
  for (let yy = 4; yy < H - 1; yy += 2) t.rect(W - 3, yy, 2, 1, '#a99d7e');
  for (let xx = 4; xx < W - 1; xx += 2) t.rect(xx, H - 3, 1, 2, '#a99d7e');
  // Kapak
  t.rect(0, 0, W - 3, H - 3, '#1d191b');
  t.rect(1, 1, W - 5, H - 5, '#3d4a3e');
  t.rect(1, 1, 5, H - 5, '#2f3a31');
  t.rect(6, 1, 1, H - 5, '#4b5a4c');
  t.benek(7, 2, W - 12, H - 7, '#465548', 0.08, rastgele(9));
  // Etiket plakası
  t.rect(12, 14, 32, 16, '#1d191b');
  t.rect(13, 15, 30, 14, '#c2b48c');
  t.frame(14, 16, 28, 12, '#8f8263');
  t.rect(14, 46, 28, 1, '#55664f');
  t.rect(14, 48, 20, 1, '#55664f');
  const kap = scene.add.container(snap(x), snap(y));
  kap.add(t.goruntu(0, 0));
  const tx = -((W + 2) * PX) / 2 + 28 * PX;
  const ty = -((H + 3) * PX) / 2 + 22 * PX;
  kap.add(scene.add.text(tx, ty - 11, 'KURAL', { fontFamily: FONT, fontSize: '30px', color: '#231e1b' }).setOrigin(0.5));
  kap.add(scene.add.text(tx, ty + 13, 'KİTABI', { fontFamily: FONT, fontSize: '30px', color: '#231e1b' }).setOrigin(0.5));
  kap.setDepth(5);
  return kap;
}

/**
 * Uyarı fişi (yer tutucu geri bildirim): damgadan sonra gişeden masaya düşer.
 * Doğruysa yeşilimsi, yanlışsa pembe kâğıt. Yanlış kararda üç satır: başlık, doğru damga, kusurlar.
 */
export function fisDusur(scene: Phaser.Scene, dogru: boolean, metin: string, x: number, y: number): Phaser.GameObjects.Container {
  const W = dogru ? 72 : 96;
  const H = dogru ? 30 : 44;
  const t = new Tuval(scene, W, H + 2, 'fis');
  const renk = dogru ? PAL.fisYesil : PAL.fisKirmizi;
  const koyu = dogru ? '#9faa8a' : '#b8958a';
  t.rect(1, 2, W - 1, H, '#00000055');
  t.rect(0, 0, W - 1, H, renk);
  t.benek(0, 0, W - 1, H, koyu, 0.04, rastgele(x + y));
  // Delikli üst kenar
  for (let xx = 0; xx < W - 1; xx += 2) t.ctx.clearRect(xx, 0, 1, 1);
  t.rect(0, 1, W - 1, 1, koyu);
  t.rect(3, 5, W - 7, 1, koyu);
  t.rect(3, H - 4, W - 7, 1, koyu);
  t.rect(3, 3, 4, 1, dogru ? PAL.damgaGuvenli : PAL.damgaBosalt);
  const kap = scene.add.container(snap(x), -200);
  kap.add(t.goruntu(0, 0));
  kap.add(
    scene.add
      .text(0, 4, metin, { fontFamily: FONT, fontSize: dogru ? '36px' : '30px', color: PAL.murekkep, align: 'center', lineSpacing: 4 })
      .setOrigin(0.5),
  );
  kap.setDepth(ustKatman());
  kap.y = y - 140;
  kap.setAlpha(0);
  scene.tweens.add({ targets: kap, y: snap(y), alpha: 1, duration: 420, ease: 'Bounce.easeOut' });
  return kap;
}

/** Fişi masadan kaldırır: aşağı, masa çekmecesine kayar ve silinir. */
export function fisKaldir(scene: Phaser.Scene, fis: Phaser.GameObjects.Container): void {
  scene.tweens.killTweensOf(fis);
  scene.tweens.add({
    targets: fis,
    y: 1080 + 120,
    alpha: 0,
    duration: 360,
    ease: 'Cubic.easeIn',
    onComplete: () => fis.destroy(),
  });
}
