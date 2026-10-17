// @beyan görsel
import * as Phaser from 'phaser';
import { FONT } from '../config';
import { ustKatman } from './DocumentCard';
import { PAL } from './palette';
import { PX, rastgele, snap, Tuval } from './pixel';

/** Ahşap masa: kalaslar, damarlar, kenarlarda karartma. */
export function masaCiz(scene: Phaser.Scene, y: number): Phaser.GameObjects.Image {
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
  return t.goruntu(0, y).setOrigin(0).setDepth(0);
}

/**
 * Uyarı fişi (yer tutucu geri bildirim). Doğruysa yeşilimsi, yanlışsa pembe kâğıt. Yanlış kararda satırlar:
 * başlık, doğru damga, kusurlar. Boyu metne göre; kap.width / kap.height ile okunur. Yerini GameScene
 * seçer (masanın boş yeri), sonra fisDusur ile düşürülür.
 */
export function fisKur(scene: Phaser.Scene, dogru: boolean, metin: string): Phaser.GameObjects.Container {
  const yazi = scene.add
    .text(0, 2, metin, { fontFamily: FONT, fontSize: dogru ? '32px' : '30px', color: PAL.murekkep, align: 'center', lineSpacing: 4 })
    .setOrigin(0.5);
  const W = Math.max(dogru ? 72 : 96, Math.ceil((yazi.width + 48) / PX));
  const H = Math.max(dogru ? 30 : 44, Math.ceil((yazi.height + 36) / PX));
  const t = new Tuval(scene, W, H + 2, 'fis');
  const renk = dogru ? PAL.fisYesil : PAL.fisKirmizi;
  const koyu = dogru ? '#9faa8a' : '#b8958a';
  t.rect(1, 2, W - 1, H, '#00000055');
  t.rect(0, 0, W - 1, H, renk);
  t.benek(0, 0, W - 1, H, koyu, 0.04, rastgele(W * 31 + H));
  // Delikli üst kenar
  for (let xx = 0; xx < W - 1; xx += 2) t.ctx.clearRect(xx, 0, 1, 1);
  t.rect(0, 1, W - 1, 1, koyu);
  t.rect(3, 5, W - 7, 1, koyu);
  t.rect(3, H - 4, W - 7, 1, koyu);
  t.rect(3, 3, 4, 1, dogru ? PAL.damgaGuvenli : PAL.damgaBosalt);
  const kap = scene.add.container(0, -400);
  kap.add(t.goruntu(0, 0));
  kap.add(yazi);
  kap.setSize(W * PX, (H + 2) * PX);
  kap.setAlpha(0);
  return kap;
}

/** Fişi (x, y) ortasına düşürür. derinlik verilmezse masadaki en üst katman. */
export function fisDusur(scene: Phaser.Scene, kap: Phaser.GameObjects.Container, x: number, y: number, derinlik?: number): void {
  kap.setDepth(derinlik ?? ustKatman());
  kap.setPosition(snap(x), snap(y) - 140);
  scene.tweens.add({ targets: kap, y: snap(y), alpha: 1, duration: 420, ease: 'Bounce.easeOut' });
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

/**
 * Giriş koruması sürerken düğmenin üstünde soldan sağa dolan açık şerit; dolunca düğme bir kez parlar ve şerit
 * söner (G23b: "hazır"; gün sonu raporu ve G24 gazete).
 */
export function hazirGostergesi(scene: Phaser.Scene, dugme: Phaser.GameObjects.Container, sure: number): void {
  const w = dugme.width - PX * 2;
  const h = dugme.height - PX * 2;
  const dolgu = scene.add.rectangle(-w / 2, 0, w, h, 0xf0e6cc, 0.28).setOrigin(0, 0.5);
  dolgu.scaleX = 0;
  dugme.addAt(dolgu, 1);
  scene.tweens.add({
    targets: dolgu,
    scaleX: 1,
    duration: sure,
    ease: 'Stepped',
    easeParams: [6],
    onComplete: () => {
      dolgu.setFillStyle(0xfff6dc, 0.7);
      scene.tweens.add({ targets: dolgu, alpha: 0, duration: 260, ease: 'Stepped', easeParams: [3], onComplete: () => dolgu.destroy() });
    },
  });
}

/**
 * Masa tarzı piksel düğme (gün sonu, gazete, sonuç): koyu çerçeve, damga renginde gövde, yanında tuş ipucu.
 * Fareyle tıklanır; tuşu çağıran bağlar. Kap döner (alpha 0'dan açılır).
 */
export function pikselDugme(
  scene: Phaser.Scene,
  x: number,
  y: number,
  metin: string,
  ipucuMetni: string,
  is: () => void,
  renk: { govde: string; acik: string; koyu: string } = { govde: PAL.damgaGuclendir, acik: '#d0ad52', koyu: '#8a6a20' },
): Phaser.GameObjects.Container {
  const yazi = scene.add.text(0, 0, metin, { fontFamily: FONT, fontSize: '44px', color: PAL.panel }).setOrigin(0.5);
  const ipucu = scene.add.text(0, 0, ipucuMetni, { fontFamily: FONT, fontSize: '26px', color: PAL.panel }).setOrigin(0.5);
  const w = snap(yazi.width + ipucu.width + 96);
  const h = 72;
  const tw = w / PX;
  const th = h / PX;
  const t = new Tuval(scene, tw, th, 'dugme');
  t.rect(0, 0, tw, th, PAL.cerceveKoyu);
  t.rect(1, 1, tw - 2, th - 2, renk.govde);
  t.rect(1, 1, tw - 2, 1, renk.acik);
  t.rect(1, th - 2, tw - 2, 1, renk.koyu);
  const kap = scene.add.container(snap(x), snap(y));
  kap.add(t.goruntu(0, 0));
  yazi.setPosition(snap(-ipucu.width / 2 - 16), 0);
  ipucu.setPosition(snap(w / 2 - ipucu.width / 2 - 24), 4);
  kap.add([yazi, ipucu]);
  kap.setSize(w, h).setInteractive({ useHandCursor: true });
  kap.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => kap.setScale(1.04));
  kap.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => kap.setScale(1));
  kap.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, is);
  kap.setAlpha(0);
  return kap;
}
