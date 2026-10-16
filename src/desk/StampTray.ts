// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import type { Damga } from '../game/building';
import { PAL } from './palette';
import { PX, rastgele, Tuval } from './pixel';

export const DAMGA_ADI: Record<Damga, string> = { guvenli: 'GÜVENLİ', guclendir: 'GÜÇLENDİR', bosalt: 'BOŞALT' };
export const DAMGA_RENK: Record<Damga, string> = {
  guvenli: PAL.damgaGuvenli,
  guclendir: PAL.damgaGuclendir,
  bosalt: PAL.damgaBosalt,
};
const SIRA: Damga[] = ['guvenli', 'guclendir', 'bosalt'];

const TRAY = { x: 1544, y: 472, w: 376, h: 600, tutamak: 40 };
const KAPALI_X = 1920 - TRAY.tutamak;
/** Çubuğun sol kenarı (ekran x): açıkken ve kapalıyken. Masa sınırı buna göre ayarlanır. */
export const TEPSI_SOL = { acik: TRAY.x, kapali: KAPALI_X } as const;

/**
 * Sağ kenardan kayarak açılan damga çubuğu. Kapalıyken yalnızca tutamak görünür;
 * tutamağa tıklayınca ya da Tab ile açılır. Üç tokmak: GÜVENLİ / GÜÇLENDİR / BOŞALT.
 */
export class StampTray extends Phaser.GameObjects.Container {
  acik = false;
  /** İnceleme modunda çubuk kilitli: açılıp kapanmaz, tokmaklar basmaz. */
  kilitli = false;
  private readonly tokmaklar = new Map<Damga, Phaser.GameObjects.Container>();
  private readonly ok: Phaser.GameObjects.Image;
  private okTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    private readonly onStamp: (d: Damga) => void,
  ) {
    super(scene, KAPALI_X, TRAY.y);
    this.setDepth(4000);
    scene.add.existing(this);
    const govdeW = (TRAY.w - TRAY.tutamak) / PX;
    const H = TRAY.h / PX;
    const rnd = rastgele(3);

    // Gövde
    const g = new Tuval(scene, govdeW + 2, H, 'tepsi');
    g.rect(0, 0, govdeW + 2, H, PAL.cerceveKoyu);
    g.rect(1, 1, govdeW, H - 2, '#3d3a35');
    g.rect(1, 1, govdeW, 1, '#5a564e');
    g.benek(2, 2, govdeW - 2, H - 4, '#46433d', 0.06, rnd);
    for (const [x, y] of [
      [4, 4],
      [govdeW - 4, 4],
      [4, H - 5],
      [govdeW - 4, H - 5],
    ])
      g.rect(x, y, 2, 2, '#6a665c').px(x, y, '#8a8578');
    for (let i = 1; i < 3; i++) g.rect(4, i * 50, govdeW - 6, 1, PAL.cerceveKoyu).rect(4, i * 50 + 1, govdeW - 6, 1, '#4a4741');
    this.add(g.goruntu(TRAY.tutamak - PX, 0).setOrigin(0));

    // Tutamak
    const tt = new Tuval(scene, TRAY.tutamak / PX, 44, 'tutamak');
    tt.rect(0, 0, 10, 44, PAL.cerceveKoyu);
    tt.rect(1, 1, 9, 42, '#5a564e');
    tt.rect(1, 1, 9, 1, '#77726a');
    const tut = tt.goruntu(0, 120).setOrigin(0);
    this.add(tut);
    const yazi = scene.add
      .text(20, 120 + 52, 'DAMGA', { fontFamily: FONT, fontSize: '28px', color: PAL.panelYazi })
      .setOrigin(0.5)
      .setAngle(-90);
    this.add(yazi);
    const okT = new Tuval(scene, 5, 7, 'ok');
    for (let i = 0; i < 4; i++) okT.rect(4 - i, i, 1, 7 - i * 2, PAL.saat);
    this.ok = okT.goruntu(20, 120 + 112);
    this.add(this.ok);
    const tab = scene.add.text(20, 120 + 148, 'Tab', { fontFamily: FONT, fontSize: '24px', color: PAL.panelYazi }).setOrigin(0.5);
    this.add(tab);
    tut.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.degistir());

    // Tokmaklar
    SIRA.forEach((d, i) => {
      const cx = TRAY.tutamak + (TRAY.w - TRAY.tutamak) / 2;
      const cy = 112 + i * 200;
      const golge = new Tuval(scene, 56, 6, 'tgolge');
      golge.dither(2, 0, 52, 6, '#000000');
      golge.rect(4, 1, 48, 4, '#00000080');
      this.add(golge.goruntu(cx, cy + 72).setAlpha(0.6));
      const kap = this.tokmakCiz(d, cx, cy);
      this.tokmaklar.set(d, kap);
    });

    this.okYanip(true);
    const tus = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.TAB, true);
    tus?.on(Phaser.Input.Keyboard.Events.DOWN, () => this.degistir());
    this.once(Phaser.GameObjects.Events.DESTROY, () => tus?.removeAllListeners());
  }

  private tokmakCiz(d: Damga, cx: number, cy: number): Phaser.GameObjects.Container {
    const s = this.scene;
    const t = new Tuval(s, 60, 40, 'tokmak');
    const renk = DAMGA_RENK[d];
    // Tahta topuz
    t.rect(22, 0, 16, 10, KONT());
    t.rect(23, 1, 14, 8, '#6b4a35');
    t.rect(24, 1, 10, 2, '#8a6448');
    t.rect(23, 7, 14, 2, '#553a2a');
    // Sap
    t.rect(27, 10, 6, 8, KONT());
    t.rect(28, 10, 4, 8, '#77736a');
    t.rect(28, 10, 1, 8, '#9a958a');
    // Metal gövde
    t.rect(2, 18, 56, 16, KONT());
    t.rect(3, 19, 54, 14, '#6a665d');
    t.rect(3, 19, 54, 1, '#8e897d');
    t.rect(3, 32, 54, 1, '#4f4c45');
    // Lastik (mürekkepli taban)
    t.rect(4, 34, 52, 5, KONT());
    t.rect(5, 34, 50, 4, renk);
    t.dither(5, 37, 50, 1, '#00000060');
    const kap = s.add.container(cx, cy);
    kap.add(t.goruntu(0, 0));
    const lbl = s.add
      .text(0, 24 + 4, DAMGA_ADI[d], { fontFamily: FONT, fontSize: '36px', color: '#f0ead8' })
      .setOrigin(0.5)
      .setShadow(0, 4, '#00000080', 0);
    kap.add(lbl);
    kap.setSize(240, 160);
    kap.setInteractive({ useHandCursor: true });
    kap.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      if (this.acik && !this.kilitli) this.onStamp(d);
    });
    this.add(kap);
    return kap;
  }

  /** Tokmağın inip kalkması. */
  bas(d: Damga): void {
    const kap = this.tokmaklar.get(d);
    if (!kap) return;
    const y0 = 112 + Math.max(0, ['guvenli', 'guclendir', 'bosalt'].indexOf(d)) * 200;
    this.scene.tweens.killTweensOf(kap);
    kap.y = y0;
    this.scene.tweens.chain({
      targets: kap,
      tweens: [
        { y: y0 + 24, duration: 70, ease: 'Quad.easeIn' },
        { y: y0, duration: 220, delay: 90, ease: 'Quad.easeOut' },
      ],
    });
  }

  /** Kilit (inceleme modu): çubuk soluklaşır, girdiye kapanır. */
  kilitle(on: boolean): void {
    this.kilitli = on;
    this.setAlpha(on ? 0.55 : 1);
  }

  degistir(): void {
    if (this.kilitli) return;
    if (this.acik) this.kapa();
    else this.ac();
  }

  /** Açılınca 'ac', kapanınca 'kapa' olayı yayılır (masa sınırı için). */
  ac(): void {
    if (this.acik) return;
    this.acik = true;
    sfx.play('tepsi');
    this.emit('ac');
    this.okYanip(false);
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({ targets: this, x: TRAY.x, duration: 260, ease: 'Cubic.easeOut' });
  }

  kapa(): void {
    if (!this.acik) return;
    this.acik = false;
    sfx.play('tepsi', { rate: 0.92 });
    this.emit('kapa');
    this.okYanip(true);
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({ targets: this, x: KAPALI_X, duration: 220, ease: 'Cubic.easeIn' });
  }

  private okYanip(on: boolean): void {
    this.okTween?.remove();
    this.okTween = undefined;
    this.ok.setFlipX(!on).setAlpha(1);
    if (on) this.okTween = this.scene.tweens.add({ targets: this.ok, alpha: 0.2, duration: 380, yoyo: true, repeat: -1 });
  }
}

function KONT(): string {
  return '#1d191b';
}

/**
 * Mürekkep izi: hafif açılı, pürüzlü kenarlı damga baskısı. Yarım sanat pikseli ızgarasında çizilir
 * (VT323 25 px = tuvalde tam 1 piksel; döndürme ızgarada yapılır), 2 kat büyütülür.
 */
export function damgaIzi(scene: Phaser.Scene, d: Damga, tohum: number): Phaser.GameObjects.Image {
  const rnd = rastgele(tohum);
  const W = 148;
  const H = 52;
  const t = new Tuval(scene, W, H, 'iz');
  const ctx = t.ctx;
  const aci = ((rnd() * 2 - 1) * 7 * Math.PI) / 180;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(aci);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.strokeRect(-64, -18, 128, 36);
  ctx.font = `25px "VT323"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  ctx.fillText(DAMGA_ADI[d], 0, 2);
  ctx.restore();
  // Eşikle: yalnızca tam pikseller, mürekkep rengi; rastgele boşluklar (pürüz).
  const img = ctx.getImageData(0, 0, W, H);
  const p = img.data;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(DAMGA_RENK[d].slice(i, i + 2), 16));
  for (let i = 0; i < p.length; i += 4) {
    const on = p[i + 3] > 110 && rnd() > 0.1;
    p[i] = r;
    p[i + 1] = g;
    p[i + 2] = b;
    p[i + 3] = on ? 225 : 0;
  }
  ctx.putImageData(img, 0, 0);
  return t.goruntu(0, 0, PX / 2);
}
