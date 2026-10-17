// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { MONO } from '../config';
import type { Bina, Damga } from '../game/building';
import { tarih } from '../game/diyalog';
import type { Ifade, Kisi } from '../game/kisi';
import type { SokakKaydi } from '../game/session';
import { TUNING } from '../game/tuning';
import { Konusma, type SoyleSecenek } from './Konusma';
import { PAL } from './palette';
import { dizgiTohum, PX, rastgele, snap, Tuval } from './pixel';
import { Portre, PORTRE_EKRAN } from './Portre';
import { Sokak } from './Street';
import { cepheSecimi } from './tiles';

/** Üst bandın ölçüleri (ekran pikseli). */
export const BANT_H = 416;
export const TEZGAH_H = 48;
/** Masa bu y'den başlar. */
export const MASA_Y = BANT_H + TEZGAH_H;

const PEN = { x: 32, y: 32, w: 1168, h: 360 };
const GISE = { x: 1248, y: 32, w: 640, h: 360 };
/** Gişe camının alanı (ekran): öncü sarsıntının şerit yazısı burada (G5b). */
export const GISE_ALAN: Readonly<typeof GISE> = GISE;
/**
 * Sokak penceresinin camları (ekran x aralıkları): orta kayıt (duvar görüntüsünde, x 944-960) ve pencere çerçevesi
 * sokağın önünde. Öncü sarsıntı etiketleri bu aralıklara sıkıştırılır (G23: kayıtta ya da kenarda kırpılmasın).
 */
export const PENCERE_CAMLARI: readonly { x0: number; x1: number }[] = [
  { x0: PEN.x, x1: PEN.x + 912 },
  { x0: PEN.x + 928, x1: PEN.x + PEN.w },
];
/** Belgelerin girip çıktığı gişe gözü (ekran). */
export const GOZ = { x: 1568, y: BANT_H + 8 };

/** Sokak (gök ve binalar) gişenin arkasında: pencereden taşan kısmı duvar ve buzlu cam örter. */
const D = { sokak: 2990, arka: 3000, siluet: 3001, on: 3002, duvar: 3003, yazi: 3004, balon: 3015 };
/** Gişedeki kişi camın sağ yarısında; konuşma balonu solda, cama iliştirilmiş fiş gibi. */
const KISI = { x: GISE.x + GISE.w - PORTRE_EKRAN.w - 40, y: GISE.y + GISE.h - PORTRE_EKRAN.h };
/** Kişinin gişeye girip çıktığı yer (G39): camın sağ kenarının dışı; ötesini duvar örter. */
const KISI_DIS = GISE.x + GISE.w;
/** hMax (G33): balon en çok gişe camının alt kenarına kadar iner; daha uzun cevap kısaltılır (GameScene). */
const BALON = { x: GISE.x + 8, y: GISE.y + 32, w: 320, hMax: GISE.h - 32 };
/** Sokaktaki tozun derinliği (Quake). */
export const SOKAK_DERINLIK = D.sokak;

/** Bina cephe seçimi dosyaya bağlı: pencerede ve fotoğrafta aynı bina görünsün. */
export function binaSecimi(bina: Bina): ReturnType<typeof cepheSecimi> {
  return cepheSecimi(rastgele(dizgiTohum(bina.id)));
}

/** Belediye penceresi: dışarıda kalıcı sokak ve dosyanın binası, sağda buzlu camlı gişe, altta tezgâh ve paneller. */
export class Pencere {
  readonly sokak: Sokak;
  private portre?: Portre;
  private yuruyus?: Phaser.Tweens.Tween;
  private readonly balon: Konusma;
  private readonly saatYazi: Phaser.GameObjects.Text;
  private readonly dosyaYazi: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    gun: number,
    sokak: readonly SokakKaydi[] = [],
  ) {
    this.sokak = new Sokak(scene, PEN, gun, sokak, D.sokak, { tur: true });
    this.duvarCiz();
    this.giseCiz();
    const yaz = (x: number, t: string, font: string, size: number, renk: string): Phaser.GameObjects.Text =>
      scene.add
        .text(x, BANT_H + 24, t, { fontFamily: font, fontSize: `${size}px`, color: renk })
        .setOrigin(0.5, 0.5)
        .setDepth(D.yazi);
    yaz(96, `GÜN ${gun}`, MONO, 32, PAL.panelYazi);
    this.saatYazi = yaz(248, '09:00', MONO, 40, PAL.saat);
    this.dosyaYazi = yaz(440, '', MONO, 32, PAL.panelYazi);
    // Oyun içi tarih (G5b): ileri tarihli getirilen raporu yakalamak için bugünün tarihi tezgâhta.
    yaz(644, tarih(gun), MONO, 32, PAL.panelYazi);
    this.balon = new Konusma(scene, BALON, D.balon);
  }

  setSaat(t: string): void {
    if (this.saatYazi.text !== t) this.saatYazi.setText(t);
  }

  setDosya(k: number, n: number): void {
    this.dosyaYazi.setText(`DOSYA ${k}/${n}`);
  }

  private duvarCiz(): void {
    const W = 480;
    const H = (BANT_H + TEZGAH_H) / PX;
    const t = new Tuval(this.scene, W, H, 'duvar');
    const rnd = rastgele(7);
    t.rect(0, 0, W, H, PAL.duvar);
    t.benek(0, 0, W, 104, PAL.duvarAcik, 0.03, rnd);
    t.benek(0, 0, W, 104, PAL.duvarKoyu, 0.03, rnd);
    t.rect(0, 0, W, 2, PAL.duvarKoyu);
    // Pencere çerçevesi
    const pc = (x: number, y: number, w: number, h: number): void => {
      t.rect(x - 4, y - 4, w + 8, h + 8, PAL.cerceveKoyu);
      t.rect(x - 3, y - 3, w + 6, h + 6, PAL.cerceve);
      t.rect(x - 3, y - 3, w + 6, 1, PAL.cerceveAcik);
      t.rect(x - 3, y - 3, 1, h + 6, PAL.cerceveAcik);
      t.rect(x - 1, y - 1, w + 2, h + 2, PAL.cerceveKoyu);
      t.ctx.clearRect(x, y, w, h);
    };
    const p = { x: PEN.x / PX, y: PEN.y / PX, w: PEN.w / PX, h: PEN.h / PX };
    pc(p.x, p.y, p.w, p.h);
    // Kayıt (dikey kayıt): binayı kesmeyen yerde.
    t.rect(p.x + 228, p.y, 4, p.h, PAL.cerceve);
    t.rect(p.x + 228, p.y, 1, p.h, PAL.cerceveAcik);
    t.rect(p.x + 231, p.y, 1, p.h, PAL.cerceveKoyu);
    // Pencere pervazı
    t.rect(p.x - 6, p.y + p.h + 3, p.w + 12, 2, PAL.cerceveAcik);
    const g = { x: GISE.x / PX, y: GISE.y / PX, w: GISE.w / PX, h: GISE.h / PX };
    pc(g.x, g.y, g.w, g.h);
    // Tezgâh
    const ty = BANT_H / PX;
    t.rect(0, ty, W, TEZGAH_H / PX, PAL.tezgah);
    t.rect(0, ty, W, 1, PAL.tezgahAcik);
    t.rect(0, ty + 1, W, 1, PAL.tezgahAcik);
    t.dither(0, ty + 2, W, 1, PAL.tezgahAcik);
    t.rect(0, ty + TEZGAH_H / PX - 2, W, 2, PAL.tezgahKoyu);
    t.benek(0, ty + 3, W, 7, PAL.tezgahKoyu, 0.04, rnd);
    // Gişe gözü (belgeler buradan girer ve çıkar)
    const gx = GOZ.x / PX - 40;
    t.rect(gx - 1, ty, 82, 4, PAL.cerceveKoyu);
    t.rect(gx, ty, 80, 3, '#0d0c0b');
    t.rect(gx, ty + 3, 80, 1, PAL.tezgahAcik);
    // Paneller
    const panel = (x: number, w: number): void => {
      t.rect(x, ty + 2, w, 9, PAL.panelKenar);
      t.rect(x + 1, ty + 3, w - 2, 7, PAL.panel);
    };
    panel(6, 36);
    panel(46, 32);
    panel(84, 52);
    panel(140, 42);
    t.goruntu(0, 0).setOrigin(0).setDepth(D.duvar);
    // Cam yansımaları (pencere üstünde, hafif)
    const y = new Tuval(this.scene, p.w, p.h, 'yansima');
    for (let k = 0; k < 3; k++) {
      const bx = 30 + k * 90;
      for (let j = 0; j < p.h; j++) y.rect(bx - j * 0.6, j, 3 + (k % 2) * 3, 1, '#ffffff');
    }
    y.goruntu(PEN.x, PEN.y).setOrigin(0).setDepth(D.on).setAlpha(0.05);
  }

  private giseCiz(): void {
    const w = GISE.w / PX;
    const h = GISE.h / PX;
    const rnd = rastgele(11);
    const arka = new Tuval(this.scene, w, h, 'gise');
    for (let j = 0; j < h; j++) arka.rect(0, j, w, 1, j < h * 0.35 ? PAL.buzluAcik : j < h * 0.75 ? PAL.buzlu : PAL.buzluKoyu);
    arka.dither(0, Math.floor(h * 0.35), w, 1, PAL.buzluAcik);
    arka.dither(0, Math.floor(h * 0.75), w, 1, PAL.buzlu);
    for (let x = 2; x < w; x += 5) arka.rect(x, 0, 1, h, PAL.buzluKoyu);
    arka.benek(0, 0, w, h, PAL.buzluAcik, 0.05, rnd);
    arka.goruntu(GISE.x, GISE.y).setOrigin(0).setDepth(D.arka);

    const on = new Tuval(this.scene, w, h, 'gise-on');
    for (let x = 4; x < w; x += 5) on.dither(x, 0, 2, h, PAL.buzluAcik, x);
    // Buzlu cam hafif: arkadaki portre okunsun.
    on.goruntu(GISE.x, GISE.y).setOrigin(0).setDepth(D.on).setAlpha(0.2);
    // Konuşma deliği ve alt kayıt
    const g = new Tuval(this.scene, w, h, 'gise-delik');
    const cx = Math.floor(w / 2);
    for (let j = 0; j < 3; j++) for (let i = -4; i <= 4; i++) g.px(cx + i * 2, h - 18 + j * 2, PAL.cerceveKoyu);
    g.frame(cx - 11, h - 21, 23, 9, PAL.cerceve);
    g.rect(0, h - 6, w, 6, PAL.cerceve);
    g.rect(0, h - 6, w, 1, PAL.cerceveAcik);
    g.goruntu(GISE.x, GISE.y).setOrigin(0).setDepth(D.on);
  }

  /** Dosyanın binası sokakta sıradaki parsele gelir (incelenen, ortada ve aydınlık). */
  binaGoster(bina: Bina): void {
    this.sokak.incele(bina);
  }

  /** Damga basıldı: bina sokaktaki yerine işaretiyle oturur (iskele, şerit; zarf alındıysa zarf izi, G22). */
  damgaVur(damga: Damga, zarf = false): void {
    this.sokak.damgala(damga, zarf);
  }

  /**
   * Gişeye yeni mal sahibi gelir (portre tohumdan; aynı dosya, aynı kişi). G39: camın sağından adım adım yürüyerek
   * gelir, yerine oturur; oturdu, oturma bitince çağrılır (selam, bekleme sayacı).
   */
  kisiGelsin(kisi: Kisi, oturdu?: () => void): void {
    this.portre?.destroy();
    this.balon.temizle();
    const G = TUNING.gise;
    const p = new Portre(this.scene, kisi.portre, KISI_DIS, KISI.y);
    p.img.setDepth(D.siluet);
    this.portre = p;
    this.yuru(p, KISI_DIS, KISI.x, G.gelisMs, G.gelisAdim, Phaser.Math.Easing.Sine.Out, false, () => {
      // Durma: bir sanat pikseli çöküp doğrulur.
      p.img.setY(KISI.y + PX);
      this.scene.time.delayedCall(G.oturmaMs, () => {
        if (!p.img.active) return;
        p.img.setY(KISI.y);
        oturdu?.();
      });
    });
  }

  /** Kişi gişeden ayrılır (G39): sırtını dönmeden, geldiği yoldan adım adım çıkar ve söner. */
  kisiGitsin(): void {
    const p = this.portre;
    this.balon.kapat();
    if (!p) return;
    this.portre = undefined;
    p.konus(false);
    const G = TUNING.gise;
    this.yuru(p, p.img.x, KISI_DIS, G.gidisMs, G.gidisAdim, Phaser.Math.Easing.Sine.In, true, () => p.destroy());
  }

  /**
   * Yürüyüş (G39): x0'dan x1'e yatay kayma; her adımda TUNING.gise.sekme px yukarı sekme (piksel ızgarasında) ve
   * adım inişinde ayak sesi. son: giderken son kısımda söner.
   */
  private yuru(
    p: Portre,
    x0: number,
    x1: number,
    sure: number,
    adim: number,
    ease: (v: number) => number,
    son: boolean,
    bitince: () => void,
  ): void {
    const G = TUNING.gise;
    const img = p.img;
    // Yarım kalan yürüyüş (geliş bitmeden gidiş) durur.
    this.yuruyus?.stop();
    img.setPosition(x0, KISI.y).setAlpha(1);
    let inen = 0;
    const ilerle = { u: 0 };
    this.yuruyus = this.scene.tweens.add({
      targets: ilerle,
      u: 1,
      duration: sure,
      onUpdate: () => {
        if (!img.active) return;
        const u = ilerle.u;
        const faz = u * adim;
        // Adım ortasında havada, iniş ve kalkışta yerde.
        const havada = u < 1 && Math.sin(Math.PI * (faz % 1)) > 0.35;
        img.setPosition(snap(x0 + (x1 - x0) * ease(u)), KISI.y - (havada ? snap(G.sekme) : 0));
        if (son) img.setAlpha(u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5);
        const n = Math.min(adim, Math.floor(faz + 1e-6));
        if (n > inen) {
          inen = n;
          sfx.play('adim', { volume: son ? 0.75 : 1, pan: 0.45 });
        }
      },
      onComplete: () => {
        if (!img.active) return;
        img.setPosition(x1, KISI.y);
        if (inen < adim) sfx.play('adim', { volume: son ? 0.75 : 1, pan: 0.45 });
        bitince();
      },
    });
  }

  /** Gişedeki kişinin balonu ekranda mı (G33: bekleme cümlesi konuşmanın üstüne binmesin). */
  get konusuyor(): boolean {
    return this.balon.acik;
  }

  /** Metin balona sığar mı (G33). */
  sigar(metin: string, baslik = false): boolean {
    return this.balon.sigar(metin, baslik);
  }

  ifade(i: Ifade): void {
    this.portre?.setIfade(i);
  }

  /** Gişedeki kişi konuşur: balonda harf harf, ağzı kıpırdar. */
  soyle(metin: string, ifade?: Ifade, secenek: SoyleSecenek = {}): void {
    if (ifade) this.ifade(ifade);
    const p = this.portre;
    this.balon.soyle(metin, {
      ...secenek,
      konusan: (on) => {
        p?.konus(on);
        secenek.konusan?.(on);
      },
    });
  }
}
