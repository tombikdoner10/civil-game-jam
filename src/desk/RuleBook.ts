// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import { aktifKurallar } from '../game/rules';
import type { SecimNesne, Yuzey } from './Inspect';
import { PAL } from './palette';
import { PX, rastgele, snap, Tuval } from './pixel';
import { kuralKitabi } from './props';

/** Açık sayfanın yeri ve boyu (ekran pikseli): masanın sağında, damga çubuğunun üstünde. */
const SAYFA = { x: 1432, y: 476, w: 448, h: 592 };
/** Açık kitap damga çubuğunun (4000) üstünde, inceleme çizimlerinin (9000) altında. */
const DERINLIK = 5000;

const KAGIT = '#cfc5a6';
const KAGIT_KOYU = '#a99d7e';
const KAPAK = '#3d4a3e';
const KAPAK_KOYU = '#2f3a31';

/**
 * En küçük kural kitabı (G3): masadaki kitaba tıklayınca tek sayfa açılır ve o güne kadar aktif
 * kuralları satır satır gösterir. Tekrar tıklayınca ya da dışına tıklayınca kapanır (inceleme modunda
 * dışına tıklamak kapatmaz: kural satırı ile belge alanı birlikte seçilebilsin; köşedeki X kapatır).
 * Sayfa sayfa gezinme, resimli sayfalar ve cila G4'te.
 */
export class RuleBook {
  acik = false;
  private readonly kapali: Phaser.GameObjects.Container;
  private readonly sayfa: Phaser.GameObjects.Container;
  private readonly satirlar: SecimNesne[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    gun: number,
    /** İnceleme modu açık mı (dışına tıklama kapatmasın). */
    private readonly incelemeAcik: () => boolean,
  ) {
    this.kapali = kuralKitabi(scene, x, y);
    this.kapali.setSize(54 * PX, 69 * PX);
    this.kapali.setInteractive({ useHandCursor: true });
    this.kapali.setData('incelemeYok', true);
    this.kapali.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.ac());

    this.sayfa = this.sayfaKur(gun);

    const tikla = (_p: Phaser.Input.Pointer, ustunde: Phaser.GameObjects.GameObject[]): void => {
      if (!this.acik || this.incelemeAcik()) return;
      // Kitabı açan tıklama ya da X: kendi işleyicileri hallediyor.
      if (ustunde.some((o) => o === this.kapali || o.getData('kitapKapat'))) return;
      this.kapa();
    };
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, tikla);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.input.off(Phaser.Input.Events.POINTER_DOWN, tikla));
  }

  ac(): void {
    if (this.acik) return;
    this.acik = true;
    sfx.play('click');
    this.kapali.setVisible(false);
    this.kapali.disableInteractive(true);
    const hy = snap(SAYFA.y + SAYFA.h / 2);
    this.scene.tweens.killTweensOf(this.sayfa);
    this.sayfa.setVisible(true).setAlpha(0).setY(hy + 24);
    this.scene.tweens.add({ targets: this.sayfa, alpha: 1, y: hy, duration: 140, ease: 'Cubic.easeOut' });
  }

  kapa(): void {
    if (!this.acik) return;
    this.acik = false;
    sfx.play('click');
    this.scene.tweens.killTweensOf(this.sayfa);
    this.sayfa.setVisible(false);
    this.kapali.setVisible(true);
    this.kapali.setInteractive();
  }

  degistir(): void {
    if (this.acik) this.kapa();
    else this.ac();
  }

  /** İnceleme modu için: açıkken sayfa ve kural satırları. */
  yuzey(): Yuzey | null {
    if (!this.acik) return null;
    return {
      derinlik: DERINLIK,
      sinir: new Phaser.Geom.Rectangle(this.sayfa.x - SAYFA.w / 2, this.sayfa.y - SAYFA.h / 2, SAYFA.w, SAYFA.h),
      alanlar: this.satirlar,
    };
  }

  private sayfaKur(gun: number): Phaser.GameObjects.Container {
    const s = this.scene;
    const W = SAYFA.w / PX;
    const H = SAYFA.h / PX;
    const rnd = rastgele(77);
    const t = new Tuval(s, W + 2, H + 3, 'kitap-sayfa');
    // Gölge, cilt kenarı ve sayfa
    t.rect(2, 3, W, H, '#00000066');
    t.rect(0, 0, W, H, KAPAK_KOYU);
    t.rect(1, 1, W - 2, H - 2, KAPAK);
    t.rect(3, 2, W - 5, H - 4, KAGIT);
    t.benek(3, 2, W - 5, H - 4, KAGIT_KOYU, 0.03, rnd);
    for (let yy = 4; yy < H - 2; yy += 2) t.rect(W - 3, yy, 1, 1, KAGIT_KOYU);
    t.dither(3, H - 4, W - 5, 1, KAGIT_KOYU);
    // Başlık bandı
    t.rect(3, 2, W - 5, 14, KAPAK);
    t.rect(3, 16, W - 5, 1, KAPAK_KOYU);
    for (let x = 5; x < W - 4; x += 2) t.px(x, 4, '#4b5a4c');

    const kap = s.add.container(snap(SAYFA.x + SAYFA.w / 2), snap(SAYFA.y + SAYFA.h / 2));
    kap.setDepth(DERINLIK).setVisible(false);
    const zemin = t.goruntu(0, 0);
    kap.add(zemin);
    // Sayfa altındaki belgeleri tıklamaya kapatır (tıklama kitabı kapatır).
    zemin.setInteractive();

    const sol = -SAYFA.w / 2;
    const ust = -SAYFA.h / 2;
    // VT323 50 px: yazı tipinin pikseli tam 2 ekran pikseli (belge başlıklarıyla aynı, keskin).
    kap.add(s.add.text(sol + 24, ust + 34, 'KURAL KİTABI', { fontFamily: FONT, fontSize: '50px', color: '#e3d8b8' }).setOrigin(0, 0.5));
    // Kapat (X)
    const x = s.add
      .text(sol + SAYFA.w - 28, ust + 36, 'X', { fontFamily: FONT, fontSize: '44px', color: '#e3d8b8' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    x.setData('kitapKapat', true).setData('incelemeYok', true);
    x.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.kapa());
    kap.add(x);

    kap.add(
      s.add
        .text(sol + 24, ust + 92, `GÜN ${gun} · Yürürlükteki kurallar`, { fontFamily: FONT, fontSize: '28px', color: PAL.murekkepSoluk })
        .setOrigin(0, 0.5),
    );

    // Kural satırları: her biri inceleme modunda seçilebilir bir öğe.
    let y = ust + 120;
    const genislik = SAYFA.w - 48 - 32;
    aktifKurallar(gun).forEach((k, i) => {
      const no = s.add.text(sol + 24, y + 4, `${i + 1}.`, { fontFamily: FONT, fontSize: '30px', color: PAL.murekkep }).setOrigin(0);
      const yazi = s.add
        .text(sol + 56, y + 4, k.metin, {
          fontFamily: FONT,
          fontSize: '30px',
          color: PAL.murekkep,
          lineSpacing: 2,
          wordWrap: { width: genislik, useAdvancedWrap: true },
        })
        .setOrigin(0);
      const h = snap(Math.max(yazi.height, 32) + 12);
      const alan = s.add.rectangle(sol + 16, y, SAYFA.w - 40, h, 0xffffff, 0.001).setOrigin(0);
      alan.setData('belge', 'kural').setData('alan', k.id);
      kap.add([alan, no, yazi]);
      this.satirlar.push({ belge: 'kural', alan: k.id, nesne: alan });
      y += h;
      // Satır arası noktalı çizgi
      for (let xx = sol + 24; xx < sol + SAYFA.w - 32; xx += 8) kap.add(s.add.rectangle(xx, y, 4, 4, 0xa99d7e).setOrigin(0));
      y += 8;
    });
    return kap;
  }
}
