// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import type { Damga } from '../game/building';
import { num, PAL } from './palette';
import { PX, rastgele, snap, Tuval } from './pixel';

export const DAMGA_ADI: Record<Damga, string> = { guvenli: 'GÜVENLİ', guclendir: 'GÜÇLENDİR', bosalt: 'BOŞALT', iade: 'İADE' };
export const DAMGA_RENK: Record<Damga, string> = {
  guvenli: PAL.damgaGuvenli,
  guclendir: PAL.damgaGuclendir,
  bosalt: PAL.damgaBosalt,
  iade: PAL.damgaIade,
};
/**
 * Mürekkep izinin rengi (G5b): krem kâğıtta okunsun diye GÜÇLENDİR (hardal) ve İADE (gri mavi) daha koyu;
 * GÜVENLİ ve BOŞALT lastik rengiyle aynı.
 */
const MUREKKEP: Record<Damga, string> = {
  guvenli: PAL.damgaGuvenli,
  guclendir: '#7e5e14',
  bosalt: PAL.damgaBosalt,
  iade: '#34465c',
};
/** Raf sırası; 1-4 tuşları da bu sırayla. */
const SIRA: Damga[] = ['guvenli', 'guclendir', 'bosalt', 'iade'];

/** Kaşeliğin yeri (ekran, sol üst köşe ve boy). Masa sınırı bunun solunda biter (RAF_SOL). */
const RAF = { x: 1560, y: 480, w: 344, h: 472 };
export const RAF_SOL = RAF.x - 16;
/** Istampa (mürekkep kutusu): kaşeliğin altında. Ortası ve boy. */
const ISTAMPA = { x: 1732, y: 1016, w: 224, h: 104 };

/** Raf sanat pikseli ölçüleri: iki raf, rafta iki yuva. Raf tahtasının üst kenarı (kaşenin bastığı yer). */
const RW = RAF.w / PX;
const RH = RAF.h / PX;
const TAHTA = [50, 106];
const TAHTA_H = 10;
/** Kaşe görüntüsü (sanat pikseli). */
const KW = 24;
const KH = 38;

const KONT = '#1d191b';
const AHSAP = { koyu: '#3a2a1f', orta: '#5a4232', acik: '#6b4e38', parlak: '#8a6648', ic: '#2e2119' };
const SAP = { koyu: '#553a2a', orta: '#7a5236', acik: '#9a6c48' };

/** Yuvanın kaşe tabanı (ekran): kaşe görüntüsünün alt ortası. */
function yuva(d: Damga): [number, number] {
  const i = SIRA.indexOf(d);
  const sutun = i % 2;
  const sira = Math.floor(i / 2);
  return [RAF.x + (sutun === 0 ? 86 : 258), RAF.y + TAHTA[sira] * PX];
}

/** Ayarlar: GameScene bağlar. */
export interface KaselikAyar {
  /** Tek tıklamada kaşenin uçacağı nokta (ruhsatın mühür yeri); damga vurulamıyorsa null. */
  hedef: () => [number, number] | null;
  /** Kaşe ruhsata indi: damga sayıldıysa true (mürekkep, ses ve akış GameScene'de). */
  vur: (d: Damga, x: number, y: number) => boolean;
  /** Kaşeye dokunuldu (tıklama, sürükleme ya da tuş): inceleme modu kapanır. */
  dokunuldu: () => void;
  /** Bu kaşe şu an alınabilir mi (G22: zarf kararı bekleniyor ya da zarf alındı). Verilmezse hepsi. */
  izin?: (d: Damga) => boolean;
}

interface Basili {
  d: Damga;
  img: Phaser.GameObjects.Image;
  x0: number;
  y0: number;
  surukle: boolean;
}

/**
 * Masanın sağında ahşap kaşelik: iki raf, dikine duran tahta saplı kaşeler (tabanında renkli lastik, rafın
 * önünde etiket). Altında ıstampa. Kaşeye TEK TIKLAMA: kaşe kalkar, ıstampaya dokunur, ruhsatın üstüne uçar,
 * vurur ve yerine döner (~0,6 sn). İsteğe bağlı ikinci yol: kaşeyi sürükleyip ruhsata bırakmak (boş masaya
 * bırakılırsa yerine döner, damga sayılmaz). 1-4 tuşları doğrudan vurur. Kaşeler kurallarla gelir (gün ayarı).
 */
export class Kaselik {
  private readonly kaseler = new Map<Damga, Phaser.GameObjects.Image>();
  private readonly golge: Phaser.GameObjects.Image;
  private readonly yeniIsaret = new Map<Damga, Phaser.GameObjects.Container>();
  private basili?: Basili;
  /** Kaşe havada (otomatik vuruş ya da yerine dönüş): yeni vuruş alınmaz. */
  private ucuyor = false;
  private kilitli = false;
  private ipucuTweenler: Phaser.Tweens.Tween[] = [];
  private ipucuCerceve?: Phaser.GameObjects.Graphics;
  /** Kilit uyarısı (G22): rafın üst oyuğunda koyu şerit. */
  private readonly uyari: Phaser.GameObjects.Container;
  private readonly uyariYazi: Phaser.GameObjects.Text;
  private readonly uyariZemin: Phaser.GameObjects.Rectangle;
  private readonly uyariKenar: Phaser.GameObjects.Rectangle;

  constructor(
    private readonly scene: Phaser.Scene,
    raf: readonly Damga[],
    yeni: readonly Damga[],
    private readonly ayar: KaselikAyar,
  ) {
    const s = scene;
    this.rafCiz(raf).setDepth(9);
    this.istampaCiz().setDepth(9);
    // Etiketler (rafın önünde)
    for (const d of SIRA) {
      const [x, y] = yuva(d);
      const var_ = raf.includes(d);
      // Plakanın iç ortası y + 20; VT323 satır kutusunun altı boş, yazı 2 px yukarı (Ç'nin çengeli kenara değmesin).
      const ty = y + 18;
      s.add
        .text(x + 8, ty, var_ ? DAMGA_ADI[d] : '', { fontFamily: FONT, fontSize: '28px', color: PAL.murekkep })
        .setOrigin(0.5)
        .setDepth(10);
    }
    // Havadaki kaşenin masaya düşen gölgesi
    const gt = new Tuval(s, 22, 6, 'kase-golge');
    gt.rect(3, 0, 16, 6, '#000000').rect(0, 1, 22, 4, '#000000');
    this.golge = gt.goruntu(0, 0).setAlpha(0.3).setDepth(8590).setVisible(false);

    for (const d of raf) {
      const img = this.kaseCiz(d);
      const [x, y] = yuva(d);
      img.setOrigin(0.5, 1).setPosition(x, y).setDepth(11);
      img.setInteractive({ useHandCursor: true }).setData('incelemeYok', true);
      img.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
        if (!this.basili && !this.ucuyor && this.ipucuTweenler.length === 0) img.y = y - PX;
      });
      img.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
        if (!this.basili && !this.ucuyor && this.ipucuTweenler.length === 0) img.y = y;
      });
      img.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => this.bas(d, p));
      this.kaseler.set(d, img);
      if (yeni.includes(d)) this.yeniKur(d);
    }

    // Kilit uyarısı (gizli başlar).
    this.uyariYazi = s.add.text(0, -1, '', { fontFamily: FONT, fontSize: '24px', color: '#f0e6cc' }).setOrigin(0.5);
    this.uyariKenar = s.add.rectangle(0, 0, 8, 44, 0x1d191b);
    this.uyariZemin = s.add.rectangle(0, 0, 8, 36, num(PAL.damgaBosalt));
    this.uyari = s.add
      .container(RAF.x + RAF.w / 2, RAF.y + 28, [this.uyariKenar, this.uyariZemin, this.uyariYazi])
      .setDepth(13)
      .setVisible(false);

    const hareket = (p: Phaser.Input.Pointer): void => this.hareket(p);
    const birak = (p: Phaser.Input.Pointer): void => this.birak(p);
    s.input.on(Phaser.Input.Events.POINTER_MOVE, hareket);
    s.input.on(Phaser.Input.Events.POINTER_UP, birak);
    s.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, birak);
    const kb = s.input.keyboard;
    const tuslar = ['ONE', 'TWO', 'THREE', 'FOUR'];
    const isleyiciler = tuslar.map((_, i) => (): void => this.tikla(SIRA[i]));
    tuslar.forEach((t, i) => kb?.on(`keydown-${t}`, isleyiciler[i]));
    s.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      s.input.off(Phaser.Input.Events.POINTER_MOVE, hareket);
      s.input.off(Phaser.Input.Events.POINTER_UP, birak);
      s.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, birak);
      tuslar.forEach((t, i) => kb?.off(`keydown-${t}`, isleyiciler[i]));
    });
  }

  /**
   * Kaşelerin kilit durumu (G22): izin vermeyen kaşeler sönük; uyarı metni rafın üstünde (null: gizli).
   * GameScene zarf teklif edilince, karar verilince ve yeni dosyada çağırır.
   */
  durum(uyari: string | null): void {
    for (const [d, img] of this.kaseler) {
      if (this.izinli(d)) img.clearTint().setAlpha(1);
      else img.setTint(0x6a6058).setAlpha(0.7);
    }
    if (!uyari) {
      this.uyari.setVisible(false);
      return;
    }
    this.uyariYazi.setText(uyari);
    const w = Math.min(RAF.w - 16, snap(this.uyariYazi.width + 24));
    this.uyariZemin.setSize(w, 36);
    this.uyariZemin.setDisplayOrigin(w / 2, 18);
    this.uyariKenar.setSize(w + 8, 44);
    this.uyariKenar.setDisplayOrigin(w / 2 + 4, 22);
    if (this.uyariYazi.width > w - 12) this.uyariYazi.setScale((w - 12) / this.uyariYazi.width);
    else this.uyariYazi.setScale(1);
    this.uyari.setVisible(true);
  }

  private izinli(d: Damga): boolean {
    return this.ayar.izin ? this.ayar.izin(d) : true;
  }

  /** Kilitli kaşeye dokunuş: kısa "tık-tık", kaşe yerinde sarsılır, uyarı göz kırpar (inceleme modu kapanmaz). */
  private kilitTik(d: Damga): void {
    const img = this.kaseler.get(d);
    sfx.play('kaseKilit');
    if (img) {
      const [x] = yuva(d);
      this.scene.tweens.killTweensOf(img);
      img.x = x;
      this.scene.tweens.add({ targets: img, x: x + PX, duration: 40, yoyo: true, repeat: 2, ease: 'Stepped', onComplete: () => (img.x = x) });
    }
    if (this.uyari.visible) {
      this.scene.tweens.killTweensOf(this.uyari);
      this.uyari.setAlpha(1);
      this.scene.tweens.add({ targets: this.uyari, alpha: 0.3, duration: 90, yoyo: true, repeat: 2, ease: 'Stepped' });
    }
  }

  /** Masa kilidi (öncü sarsıntı, gün sonu): kaşeler alınmaz; elde olan yerine döner. */
  kilitle(on: boolean): void {
    this.kilitli = on;
    if (on && this.basili) this.yerineDon(this.basili.d);
  }

  /** Gün 1 ilk dosya: kaşeler sırayla hafifçe zıplar, rafın çevresi yanıp söner; ilk kullanımda durur. */
  ipucuBaslat(): void {
    if (this.ipucuTweenler.length > 0) return;
    let i = 0;
    for (const [d, img] of this.kaseler) {
      const [, y] = yuva(d);
      this.ipucuTweenler.push(
        this.scene.tweens.add({ targets: img, y: y - 3 * PX, duration: 160, yoyo: true, ease: 'Quad.easeOut', delay: i * 140, repeat: -1, repeatDelay: 1100 }),
      );
      i++;
    }
    const g = this.scene.add.graphics().setDepth(10);
    g.lineStyle(PX, num(PAL.saat), 1).strokeRect(RAF.x - 2 * PX, RAF.y - 2 * PX, RAF.w + 4 * PX, RAF.h + 4 * PX);
    this.ipucuCerceve = g;
    this.ipucuTweenler.push(this.scene.tweens.add({ targets: g, alpha: 0.15, duration: 520, yoyo: true, repeat: -1 }));
  }

  private ipucuDur(): void {
    if (this.ipucuTweenler.length === 0) return;
    this.ipucuTweenler.forEach((t) => t.remove());
    this.ipucuTweenler = [];
    this.ipucuCerceve?.destroy();
    this.ipucuCerceve = undefined;
    for (const [d, img] of this.kaseler) if (!this.basili || this.basili.d !== d) img.y = yuva(d)[1];
  }

  /** Kaşeye dokunuş: ipucu ve YENİ işareti kalkar, inceleme modu kapanır. */
  private dokun(d: Damga): void {
    this.ipucuDur();
    const y = this.yeniIsaret.get(d);
    if (y) {
      this.scene.tweens.killTweensOf(y);
      y.destroy();
      this.yeniIsaret.delete(d);
    }
    this.ayar.dokunuldu();
  }

  // ---- Girdi ----

  private bas(d: Damga, p: Phaser.Input.Pointer): void {
    if (this.kilitli || this.ucuyor || this.basili) return;
    const img = this.kaseler.get(d);
    if (!img) return;
    if (!this.izinli(d)) {
      this.kilitTik(d);
      return;
    }
    this.dokun(d);
    this.basili = { d, img, x0: p.worldX, y0: p.worldY, surukle: false };
  }

  private hareket(p: Phaser.Input.Pointer): void {
    const b = this.basili;
    if (!b || !p.isDown) return;
    if (!b.surukle && Math.hypot(p.worldX - b.x0, p.worldY - b.y0) > 12) {
      b.surukle = true;
      sfx.play('kaseAl');
      b.img.setDepth(8600);
      this.golge.setVisible(true);
    }
    if (b.surukle) this.tasi(b.img, p.worldX, p.worldY + 8 * PX);
  }

  private birak(p: Phaser.Input.Pointer): void {
    const b = this.basili;
    if (!b) return;
    this.basili = undefined;
    if (!b.surukle) {
      // Tıklama: otomatik vuruş.
      this.otomatik(b.d);
      return;
    }
    // Sürükle-bırak: lastiğin ortası bırakılan nokta.
    const x = snap(p.worldX);
    const y = snap(p.worldY + 8 * PX);
    this.ucuyor = true;
    this.scene.tweens.add({
      targets: b.img,
      y,
      duration: 60,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (this.ayar.vur(b.d, x, y - 2 * PX)) this.kalkVeDon(b.d);
        else this.yerineDon(b.d);
      },
    });
  }

  /** Tıklama ya da 1-4: kaşe doğrudan vurur. */
  private tikla(d: Damga): void {
    if (this.kilitli || this.ucuyor || this.basili || !this.kaseler.has(d)) return;
    if (!this.izinli(d)) {
      this.kilitTik(d);
      return;
    }
    this.dokun(d);
    this.otomatik(d);
  }

  // ---- Hareket ----

  private tasi(img: Phaser.GameObjects.Image, x: number, y: number, yukseklik = 6 * PX): void {
    img.setPosition(snap(x), snap(y));
    this.golge.setPosition(snap(x + 4 * PX), snap(y + yukseklik));
  }

  /**
   * Otomatik vuruş: kalk → ıstampaya dokun → ruhsatın üstüne uç → vur → kalk → yerine dön (~0,6 sn).
   * Vurulamıyorsa (dosya yok, masa meşgul) kaşe yerinde hafifçe kalkıp iner.
   */
  private otomatik(d: Damga): void {
    const img = this.kaseler.get(d);
    if (!img) return;
    const sy = yuva(d)[1];
    const hedef = this.ayar.hedef();
    this.ucuyor = true;
    this.scene.tweens.killTweensOf(img);
    if (!hedef) {
      sfx.play('kaseKoy');
      this.scene.tweens.chain({
        targets: img,
        tweens: [
          { y: sy - 4 * PX, duration: 80, ease: 'Quad.easeOut' },
          { y: sy, duration: 120, ease: 'Quad.easeIn' },
        ],
        onComplete: () => {
          this.ucuyor = false;
        },
      });
      return;
    }
    const [hx, hy] = hedef;
    sfx.play('kaseAl');
    img.setDepth(8600);
    this.golge.setVisible(true);
    const kalk = 10 * PX;
    // Basit yol: her adımda x/y doğrusal; gölge kaşeyi izler.
    const adim = (x: number, y: number, ms: number, ease: string, sonra?: () => void): Phaser.Types.Tweens.TweenBuilderConfig => ({
      targets: img,
      x,
      y,
      duration: ms,
      ease,
      onUpdate: () => this.golge.setPosition(snap(img.x + 4 * PX), snap(img.y + 4 * PX)),
      onComplete: sonra,
    });
    const iy = ISTAMPA.y + 4 * PX;
    this.scene.tweens.chain({
      tweens: [
        adim(ISTAMPA.x, iy - kalk, 100, 'Quad.easeOut'),
        adim(ISTAMPA.x, iy, 50, 'Quad.easeIn', () => sfx.play('istampa')),
        adim(hx, hy - kalk, 180, 'Cubic.easeInOut'),
        adim(hx, hy, 60, 'Quad.easeIn', () => {
          if (this.ayar.vur(d, hx, hy - 2 * PX)) this.kalkVeDon(d);
          else this.yerineDon(d);
        }),
      ],
    });
  }

  /** Vuruştan sonra: kısa kalkış, yerine dönüş. */
  private kalkVeDon(d: Damga): void {
    const img = this.kaseler.get(d);
    if (!img) return;
    this.scene.tweens.add({
      targets: img,
      y: img.y - 8 * PX,
      duration: 80,
      ease: 'Quad.easeOut',
      onUpdate: () => this.golge.setPosition(snap(img.x + 4 * PX), snap(img.y + 8 * PX)),
      onComplete: () => this.yerineDon(d),
    });
  }

  /** Kaşe yerine uçar (damga sayılmadıysa da). */
  private yerineDon(d: Damga): void {
    const img = this.kaseler.get(d);
    if (!img) return;
    if (this.basili?.d === d) this.basili = undefined;
    this.ucuyor = true;
    const [x, y] = yuva(d);
    this.scene.tweens.killTweensOf(img);
    this.scene.tweens.add({
      targets: img,
      x,
      y,
      duration: 200,
      ease: 'Cubic.easeInOut',
      onUpdate: () => this.golge.setPosition(snap(img.x + 4 * PX), snap(img.y + 2 * PX)),
      onComplete: () => {
        img.setDepth(11);
        this.golge.setVisible(false);
        this.ucuyor = false;
        sfx.play('kaseKoy');
      },
    });
  }

  // ---- Çizim ----

  /** Raf: arka pano, iki oyuk, raf tahtaları, etiket plakaları; boş yuvada toz izi. */
  private rafCiz(raf: readonly Damga[]): Phaser.GameObjects.Image {
    const t = new Tuval(this.scene, RW, RH, 'kaselik');
    const rnd = rastgele(61);
    t.rect(0, 0, RW, RH, KONT);
    t.rect(1, 1, RW - 2, RH - 2, AHSAP.orta);
    t.benek(1, 1, RW - 2, RH - 2, AHSAP.koyu, 0.05, rnd);
    for (let x = 4; x < RW - 2; x += 7) t.rect(x, 1, 1, RH - 2, '#523c2d');
    // Oyuklar (gölgeli iç) ve aradaki dikme
    for (let i = 0; i < 2; i++) {
      const ust = i === 0 ? 3 : TAHTA[0] + TAHTA_H + 1;
      const alt = TAHTA[i];
      t.rect(3, ust, RW - 6, alt - ust, AHSAP.ic);
      t.dither(3, ust, RW - 6, 2, '#1a120d');
      t.rect(RW / 2 - 1, ust, 2, alt - ust, AHSAP.orta).rect(RW / 2 - 1, ust, 1, alt - ust, AHSAP.acik);
    }
    // Raf tahtaları
    for (const ty of TAHTA) {
      t.rect(0, ty, RW, TAHTA_H, KONT);
      t.rect(1, ty, RW - 2, TAHTA_H - 1, AHSAP.acik);
      t.rect(1, ty, RW - 2, 1, AHSAP.parlak);
      t.rect(1, ty + TAHTA_H - 2, RW - 2, 1, AHSAP.koyu);
      t.benek(1, ty + 1, RW - 2, TAHTA_H - 3, AHSAP.orta, 0.08, rnd);
    }
    // Etiket plakaları (renk çipi solda)
    for (const d of SIRA) {
      const [x, y] = yuva(d);
      const cx = (x - RAF.x) / PX;
      const ty = (y - RAF.y) / PX;
      const pw = 38;
      const px0 = Math.round(cx - pw / 2);
      const var_ = raf.includes(d);
      t.rect(px0, ty + 1, pw, TAHTA_H - 2, KONT);
      t.rect(px0 + 1, ty + 2, pw - 2, TAHTA_H - 4, var_ ? PAL.krem : '#9d917a');
      if (var_) t.rect(px0 + 2, ty + 3, 2, TAHTA_H - 6, DAMGA_RENK[d]);
      t.px(px0 + 1, ty + 2, '#8a8578').px(px0 + pw - 2, ty + 2, '#8a8578');
      // Boş yuva: rafta kaşenin toz izi (ileride gelecek)
      if (!var_) t.rect(cx - KW / 2 + 2, ty - 1, KW - 4, 1, '#3d2c22').dither(cx - KW / 2 + 3, ty - 2, KW - 6, 1, '#4a372a');
    }
    // Köşe vidaları
    for (const [x, y] of [
      [2, 2],
      [RW - 4, 2],
      [2, RH - 4],
      [RW - 4, RH - 4],
    ])
      t.rect(x, y, 2, 2, '#6a665c').px(x, y, '#8a8578');
    return t.goruntu(RAF.x, RAF.y).setOrigin(0);
  }

  /** Istampa: teneke kutu, içinde koyu mürekkepli keçe; menteşeli kapak arkada açık. */
  private istampaCiz(): Phaser.GameObjects.Image {
    const W = ISTAMPA.w / PX;
    const H = ISTAMPA.h / PX;
    const t = new Tuval(this.scene, W, H, 'istampa');
    const rnd = rastgele(7);
    // Gölge
    t.rect(2, 3, W - 2, H - 3, '#00000066');
    // Açık kapak (arkada)
    t.rect(0, 0, W - 2, 8, KONT);
    t.rect(1, 1, W - 4, 6, '#5d6068');
    t.rect(1, 1, W - 4, 1, '#8a8d94');
    t.rect(3, 3, W - 8, 2, '#43464d');
    // Kutu
    t.rect(0, 8, W - 2, H - 11, KONT);
    t.rect(1, 9, W - 4, H - 13, '#757780');
    t.rect(1, 9, W - 4, 1, '#9a9ca3');
    // Keçe
    t.rect(4, 12, W - 10, H - 19, '#231d2a');
    t.benek(4, 12, W - 10, H - 19, '#3a2f45', 0.12, rnd);
    t.dither(4, 12, W - 10, 1, '#151119');
    t.rect(5, 13, 10, 1, '#4a3d58');
    // Etiket
    t.rect(W / 2 - 9, H - 6, 18, 2, '#c9c0a8');
    return t.goruntu(ISTAMPA.x, ISTAMPA.y);
  }

  /** Kaşe: tahta topuz (üstünde renkli gösterge), boyun, yaka, tahta gövde, metal taban, renkli lastik. */
  private kaseCiz(d: Damga): Phaser.GameObjects.Image {
    const t = new Tuval(this.scene, KW, KH, 'kase');
    const renk = DAMGA_RENK[d];
    // Topuz
    t.rect(7, 0, 10, 1, KONT).rect(5, 1, 14, 8, KONT).rect(7, 9, 10, 1, KONT);
    t.rect(7, 1, 10, 8, SAP.orta).rect(6, 2, 12, 6, SAP.orta);
    t.rect(7, 2, 4, 2, SAP.acik);
    t.rect(7, 7, 10, 1, SAP.koyu).rect(8, 8, 8, 1, SAP.koyu);
    t.rect(10, 1, 4, 2, renk);
    // Boyun
    t.rect(9, 10, 6, 6, KONT).rect(10, 10, 4, 6, SAP.koyu).rect(10, 10, 1, 6, SAP.orta);
    // Yaka
    t.rect(5, 16, 14, 3, KONT).rect(6, 16, 12, 2, SAP.orta).rect(6, 16, 12, 1, SAP.acik);
    // Gövde
    t.rect(3, 19, 18, 12, KONT);
    t.rect(4, 19, 16, 11, '#6b4a35');
    t.rect(4, 19, 2, 11, '#8a6448');
    t.rect(18, 19, 2, 11, '#553a2a');
    for (const y of [22, 26]) t.rect(7, y, 10, 1, '#5e4130');
    // Metal taban
    t.rect(2, 31, 20, 3, KONT).rect(3, 31, 18, 2, '#8e897d').rect(3, 31, 18, 1, '#b0aaa0');
    // Lastik
    t.rect(2, 34, 20, 4, KONT).rect(3, 34, 18, 3, renk).dither(3, 36, 18, 1, '#00000055');
    return t.goruntu(0, 0);
  }

  /**
   * Yeni gelen kaşenin oyuğunda yanıp sönen "YENİ" (kaşe ilk kez kullanılınca kalkar). Oyuğun sol üst köşesinde,
   * kaşenin topuzunun üstündeki boşlukta: üst raftaki etikete ve kaşe başına binmez.
   */
  private yeniKur(d: Damga): void {
    const s = this.scene;
    const i = SIRA.indexOf(d);
    const oyukSol = RAF.x + (i % 2 === 0 ? 3 : RW / 2 + 1) * PX;
    const oyukUst = RAF.y + (i < 2 ? 3 : TAHTA[0] + TAHTA_H + 1) * PX;
    const yazi = s.add.text(0, -1, 'YENİ', { fontFamily: FONT, fontSize: '22px', color: '#f0e6cc' }).setOrigin(0.5);
    const w = snap(yazi.width + 12);
    const h = 28;
    const kap = s.add.container(snap(oyukSol + PX + (w + 8) / 2), oyukUst + h / 2).setDepth(12);
    kap.add(s.add.rectangle(0, 0, w + 8, h, 0x1d191b));
    kap.add(s.add.rectangle(0, 0, w, h - 8, num(PAL.damgaBosalt)));
    kap.add(yazi);
    s.tweens.add({ targets: kap, alpha: 0.35, duration: 450, yoyo: true, repeat: -1 });
    this.yeniIsaret.set(d, kap);
  }
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
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(MUREKKEP[d].slice(i, i + 2), 16));
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
