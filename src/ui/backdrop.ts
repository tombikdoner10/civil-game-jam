// @beyan görsel
import * as Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../config';
import { masaCiz } from '../desk/props';

/**
 * Menü ekranlarının arka planı: denetçinin masası (oyundaki masanın aynısı, tam ekran) ve kenarlarda hafif
 * karartma (masa lambasının ışığı ortada).
 */
export function addBackdrop(scene: Phaser.Scene): void {
  scene.cameras.main.setRoundPixels(true);
  masaCiz(scene, 0).setDepth(-20);
  const g = scene.add.graphics().setDepth(-19);
  // Kenarlardan ortaya doğru azalan karartma (4 px'lik bantlar, piksel tarzı).
  const adim = 8;
  for (let i = 0; i < adim; i++) {
    const a = 0.07 * (adim - i) / adim;
    const pay = i * 24;
    g.fillStyle(0x000000, a);
    g.fillRect(0, 0, WIDTH, pay + 24);
    g.fillRect(0, HEIGHT - pay - 24, WIDTH, pay + 24);
    g.fillRect(0, 0, pay + 24, HEIGHT);
    g.fillRect(WIDTH - pay - 24, 0, pay + 24, HEIGHT);
  }
}
