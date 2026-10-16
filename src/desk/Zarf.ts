// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import { PAL } from './palette';
import { PX, rastgele, snap, Tuval } from './pixel';

const KRAFT = '#b39a6b';
const KRAFT_KOYU = '#8f784f';
const KRAFT_ACIK = '#c7b083';
const PARA = '#7d8f6a';

/** Zarfın boyu (ekran). */
export const ZARF_BOY = { w: 192, h: 120 };

/**
 * Masaya kayan zarf (G17, rüşvet): üstünde para yazar. Masada serbestçe sürüklenir (gişeye ve tezgâha
 * da çıkabilir); bırakılınca 'birakildi' olayı (x, y) yayar. Nereye bırakıldığına GameScene karar verir:
 * gişe (ret) ya da çekmece (kabul).
 */
export class Zarf extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    readonly miktar: number,
    x: number,
    y: number,
  ) {
    super(scene, x, y);
    const W = ZARF_BOY.w / PX;
    const H = ZARF_BOY.h / PX;
    const t = new Tuval(scene, W + 1, H + 2, 'zarf');
    const rnd = rastgele(miktar * 13 + 5);
    t.rect(1, 2, W, H, '#00000066');
    // Zarftan taşan banknot kenarı
    t.rect(6, 0, W - 16, 4, PARA).rect(6, 0, W - 16, 1, '#93a37e');
    for (let i = 8; i < W - 12; i += 5) t.px(i, 2, '#64745a');
    t.rect(0, 3, W, H - 3, KRAFT);
    t.benek(0, 3, W, H - 3, KRAFT_KOYU, 0.05, rnd);
    t.frame(0, 3, W, H - 3, KRAFT_KOYU);
    // Kapak (V)
    for (let i = 0; i < W / 2; i++) {
      const y = 3 + Math.floor(i * 0.42);
      t.px(i, y, KRAFT_KOYU).px(W - 1 - i, y, KRAFT_KOYU);
      if (y > 4) t.rect(i + 1, 4, W - 2 - i * 2, 1, KRAFT_ACIK);
    }
    t.rect(1, 4, W - 2, 1, KRAFT_ACIK);
    this.add(t.goruntu(0, 0));
    this.add(
      scene.add
        .text(0, 20, `${miktar} TL`, { fontFamily: FONT, fontSize: '44px', color: PAL.murekkep })
        .setOrigin(0.5),
    );
    this.setSize(ZARF_BOY.w, ZARF_BOY.h);
    this.setInteractive({ draggable: true, useHandCursor: true });
    scene.add.existing(this);
    this.on('drag', (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
      this.setPosition(
        snap(Phaser.Math.Clamp(dx, ZARF_BOY.w / 2, 1920 - ZARF_BOY.w / 2)),
        snap(Phaser.Math.Clamp(dy, ZARF_BOY.h / 2, 1080 - ZARF_BOY.h / 2)),
      );
    });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => sfx.play('kagitAl'));
    this.on('dragend', (p: Phaser.Input.Pointer) => this.emit('birakildi', p.worldX, p.worldY));
  }
}

/**
 * Masanın sol alt köşesindeki çekmece: zarf masaya gelince açılır (yukarı kayar), zarf konunca ya da
 * gişeye geri verilince kapanır. icinde(): bırakılan nokta çekmecenin üstünde mi.
 */
export class Cekmece {
  static readonly ALAN = { x: 24, y: 976, w: 336, h: 104 };
  private readonly kap: Phaser.GameObjects.Container;
  acik = false;

  constructor(private readonly scene: Phaser.Scene) {
    const A = Cekmece.ALAN;
    const W = A.w / PX;
    const H = A.h / PX;
    const t = new Tuval(scene, W, H + 4, 'cekmece');
    t.rect(0, 0, W, H + 4, PAL.cerceveKoyu);
    t.rect(1, 1, W - 2, H + 2, '#2a221d');
    t.dither(1, 1, W - 2, 3, '#14100e');
    // İç: koyu, kenarlarda ahşap
    t.rect(2, 4, W - 4, H - 2, '#1c1714');
    t.rect(0, H - 6, W, 10, PAL.masaAcik).rect(0, H - 6, W, 1, '#5a4a3e').benek(0, H - 5, W, 9, PAL.masaKoyu, 0.08, rastgele(4));
    // Kulp
    t.rect(W / 2 - 8, H - 3, 16, 2, '#6a665c').rect(W / 2 - 8, H - 3, 16, 1, '#8a8578');
    const kap = scene.add.container(A.x, 1080 + 8);
    kap.add(t.goruntu(0, 0).setOrigin(0));
    kap.add(scene.add.text(A.w / 2, 30, 'ÇEKMECE', { fontFamily: FONT, fontSize: '28px', color: PAL.murekkepAcik }).setOrigin(0.5));
    kap.setVisible(false);
    this.kap = kap;
  }

  icinde(x: number, y: number): boolean {
    const A = Cekmece.ALAN;
    return this.acik && x >= A.x && x <= A.x + A.w && y >= A.y - 24;
  }

  ac(derinlik: number): void {
    if (this.acik) return;
    this.acik = true;
    this.scene.tweens.killTweensOf(this.kap);
    this.kap.setVisible(true).setDepth(derinlik);
    this.scene.tweens.add({ targets: this.kap, y: Cekmece.ALAN.y, duration: 260, ease: 'Cubic.easeOut' });
    sfx.play('tepsi');
  }

  kapa(gecikme = 0): void {
    if (!this.acik) return;
    this.acik = false;
    this.scene.tweens.killTweensOf(this.kap);
    this.scene.tweens.add({
      targets: this.kap,
      y: 1080 + 8,
      delay: gecikme,
      duration: 240,
      ease: 'Cubic.easeIn',
      onStart: () => sfx.play('zarfCekmece'),
      onComplete: () => this.kap.setVisible(false),
    });
  }

  /** Çekmecenin ağzı (zarf buraya kayıp kaybolur). */
  get agiz(): [number, number] {
    return [Cekmece.ALAN.x + Cekmece.ALAN.w / 2, Cekmece.ALAN.y + 40];
  }
}
