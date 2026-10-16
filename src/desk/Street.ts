// @beyan görsel
import * as Phaser from 'phaser';
import type { Bina, Damga } from '../game/building';
import type { HasarDurumu } from '../game/rules';
import type { SokakKaydi } from '../game/session';
import { PAL } from './palette';
import { dizgiTohum, rastgele, Tuval } from './pixel';
import {
  CEPHE_W,
  cepheCiz,
  cepheH,
  cepheSecimi,
  hasarCiz,
  iskeleCiz,
  karanlikCiz,
  KATMAN_PAY,
  molozCiz,
  seritCiz,
  type CepheSecim,
} from './tiles';

export interface Alan {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Pencerede bir sanat pikseli = 2 ekran pikseli (uzak sokak; masa 4). */
export const SOKAK_OLCEK = 2;
const O = SOKAK_OLCEK;
/** Pencere tuvali (sanat pikseli) ve kaldırım çizgisi. */
const PEN_W = 584;
const PEN_H = 180;
const UFUK = PEN_H - 14;
/** Parsel genişliği (sanat pikseli): cephe ve iki yanında boşluk. */
const PARSEL = 124;
const BOSLUK = (PARSEL - CEPHE_W) / 2;
/** Sokağın başında (solda) dolgu binalar ve sonunda (sağda) boş arsalar. */
const DOLGU = 6;
const ARSA = 14;
/** Zemin şeridi kaldırım çizgisinin altında ne kadar uzar (küçültülünce pencerenin altı boş kalmasın). */
const ZEMIN_ALT = 42;

/** İncelenen bina pencerenin ortasının biraz sağında: solda geçmiş binalardan ikisi tam görünsün. */
const INCELE_ORAN = 0.58;

const TON = { incelenen: 0xe6dcd4, damgali: 0xa09898, dolgu: 0x6e6874, arsa: 0x8a8480 };

export type SokakHasar = HasarDurumu | 'yikik';

/** Sokaktaki bir bina yeri (Quake bunlarla çalışır). */
export interface SokakYeri {
  yer: number;
  bina: Bina;
  damga: Damga;
  hasar?: SokakHasar;
}

interface Parsel {
  yer: number;
  bina: Bina;
  damga?: Damga;
  hasar?: SokakHasar;
  secim: CepheSecim;
  kat: number;
  /** Cephe yüksekliği (sanat pikseli). */
  h: number;
  /** Parselin katmanları (gövde, karanlık, hasar, işaret) bu kapta; x0 sallanmadan önceki yer. */
  kap: Phaser.GameObjects.Container;
  x0: number;
  govde: Phaser.GameObjects.Image;
  karanlik?: Phaser.GameObjects.Image;
  hasarImg?: Phaser.GameObjects.Image;
  isaret?: Phaser.GameObjects.Image;
  serit?: Phaser.GameObjects.Image;
}

/** Parselin sol kenarı (kök kabın içinde, ekran pikseli). */
const parselX = (yer: number): number => yer * PARSEL * O;

/**
 * Pencereden görünen kalıcı sokak: o güne kadar damgalanan her bina damgalanma sırasıyla bir parselde durur.
 * GÜÇLENDİR iskeleli, BOŞALT şeritli ve karanlık; sarsıntıdan kalan hasar çatlak olarak görünür. İncelenen
 * dosyanın binası sıradaki parselde, ortada ve aydınlık. Sokak kaydırılır (ve gerekirse küçültülür): okunur kalsın.
 */
export class Sokak {
  private readonly kok: Phaser.GameObjects.Container;
  private readonly arka: Phaser.GameObjects.Container;
  private readonly binaKap: Phaser.GameObjects.Container;
  private readonly on: Phaser.GameObjects.Container;
  private readonly parseller: Parsel[] = [];
  private readonly dolgular: { kap: Phaser.GameObjects.Container; x0: number }[] = [];
  private readonly arsalar = new Map<number, Phaser.GameObjects.Image>();
  private readonly lambalar: Phaser.GameObjects.Image[] = [];
  private incelenen?: Parsel;
  private kaydirma?: Phaser.Tweens.Tween;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly alan: Alan,
    gun: number,
    kayitlar: readonly SokakKaydi[],
    derinlik: number,
  ) {
    this.gokCiz(gun).setDepth(derinlik);
    this.kok = scene.add.container(alan.x, alan.y).setDepth(derinlik + 1);
    this.arka = scene.add.container(0, 0);
    this.binaKap = scene.add.container(0, 0);
    this.on = scene.add.container(0, 0);
    this.kok.add([this.arka, this.binaKap, this.on]);

    const son = kayitlar.length + ARSA;
    this.zeminCiz(-DOLGU - 2, son + 2);
    for (let yer = -DOLGU; yer < 0; yer++) this.dolguKur(yer, gun);
    for (let yer = kayitlar.length; yer < son; yer++) this.arsaKur(yer);
    kayitlar.forEach((k, yer) => {
      const p = this.parselKur(k.bina, yer);
      p.damga = k.damga;
      p.hasar = k.hasar;
      this.isaretKur(p, false);
      if (k.hasar) this.hasarKur(p, k.hasar, false);
      this.tonla(p);
    });
    // Gün başında sokağın başından başlanır; ilk dosyada sıradaki parsele kayılır (sokak bir kez gözden geçer).
    this.odakla(0, 0, 0, undefined, INCELE_ORAN);
  }

  /** Damgalı bina sayısı (sıradaki boş parsel). */
  get damgaliSayisi(): number {
    return this.parseller.filter((p) => p.damga).length;
  }

  /** Sokaktaki damgalı binalar (sarsıntı bunlarla oynatılır). */
  damgalilar(): SokakYeri[] {
    return this.parseller.filter((p) => p.damga).map((p) => ({ yer: p.yer, bina: p.bina, damga: p.damga as Damga, hasar: p.hasar }));
  }

  /** İncelenen dosyanın binası sıradaki parsele gelir; sokak oraya kayar. */
  incele(bina: Bina): void {
    if (this.incelenen) this.parselSil(this.incelenen);
    const yer = this.damgaliSayisi;
    const p = this.parselKur(bina, yer);
    this.incelenen = p;
    for (const q of this.parseller) this.tonla(q);
    p.kap.setAlpha(0);
    this.scene.tweens.add({ targets: p.kap, alpha: 1, duration: 450 });
    const arsa = this.arsalar.get(yer);
    if (arsa) this.scene.tweens.add({ targets: arsa, alpha: 0, duration: 300 });
    const hedef = this.konum((yer + 0.5) * PARSEL, 1, INCELE_ORAN);
    const uzak = Math.abs(this.kok.x - hedef.x) / (PARSEL * O);
    this.odakla(yer, yer, Math.min(2200, 300 + 140 * uzak), undefined, INCELE_ORAN);
  }

  /** İncelenen bina damgalandı: işareti canlandırarak yerine oturur ve sokakta kalır. */
  damgala(damga: Damga): void {
    const p = this.incelenen;
    if (!p) return;
    this.incelenen = undefined;
    p.damga = damga;
    this.isaretKur(p, true);
  }

  /** Vurguyu kaldır: incelenen bina da sokağın geri kalanı gibi soluk (sarsıntı başında). */
  vurguKaldir(): void {
    this.incelenen = undefined;
    for (const q of this.parseller) this.tonla(q);
  }

  /**
   * [i0, i1] parsellerini pencereye al (oran: ortalarının penceredeki yatay yeri, 0.5 = orta); sığmıyorsa
   * küçült (en az yarı boy).
   */
  odakla(i0: number, i1: number, sure = 400, bitince?: () => void, oran = 0.5): void {
    const genislik = (i1 - i0 + 1) * PARSEL + 16;
    const s = Phaser.Math.Clamp(PEN_W / genislik, 0.5, 1);
    const c = ((i0 + i1 + 1) / 2) * PARSEL;
    const hedef = this.konum(c, s, oran);
    this.kaydirma?.stop();
    if (sure <= 0) {
      this.kok.setPosition(hedef.x, hedef.y).setScale(s);
      bitince?.();
      return;
    }
    this.kaydirma = this.scene.tweens.add({
      targets: this.kok,
      x: hedef.x,
      y: hedef.y,
      scale: s,
      duration: sure,
      ease: 'Sine.easeInOut',
      onComplete: () => bitince?.(),
    });
  }

  /** Binanın dünyadaki dikdörtgeni (parçacıklar için). */
  dunyaKutu(yer: number): Phaser.Geom.Rectangle {
    const p = this.parseller.find((q) => q.yer === yer);
    const s = this.kok.scale;
    const h = p ? p.h : 60;
    return new Phaser.Geom.Rectangle(
      this.kok.x + (parselX(yer) + BOSLUK * O) * s,
      this.kok.y + (UFUK - h) * O * s,
      CEPHE_W * O * s,
      h * O * s,
    );
  }

  /** Pencerenin ekrandaki dikdörtgeni. */
  get pencere(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.alan.x, this.alan.y, this.alan.w, this.alan.h);
  }

  /** Sarsıntıda binalar yerinde titrer (guc: sanat pikseli; 0 = yerine dön). Lambalar titrer. */
  sallan(guc: number): void {
    const oynat = (kap: Phaser.GameObjects.Container, x0: number): void => {
      kap.x = x0 + (guc > 0 ? Math.round((Math.random() - 0.5) * 2 * guc) * O : 0);
    };
    for (const p of this.parseller) oynat(p.kap, p.x0);
    for (const d of this.dolgular) oynat(d.kap, d.x0);
    for (const l of this.lambalar) l.setAlpha(guc > 0 && Math.random() < 0.35 ? 0.15 : 1);
  }

  /** Sarsıntı sonucu binaya işlenir: çatlak (hasarli/agirHasar) ya da çökme (yikik). */
  hasarVer(yer: number, hasar: SokakHasar, canlandir = true): void {
    const p = this.parseller.find((q) => q.yer === yer);
    if (!p) return;
    p.hasar = hasar;
    if (hasar === 'ayakta') return;
    if (hasar === 'yikik') this.yik(p, canlandir);
    else this.hasarKur(p, hasar, canlandir);
  }

  // ---- Kurulum ----

  /** Kök kabın yeri: c (sanat pikseli, sokak boyunca) pencerenin oran noktasına gelsin; ızgaraya oturur. */
  private konum(c: number, s: number, oran = 0.5): { x: number; y: number } {
    const x = this.alan.x + Math.round((this.alan.w * oran) / O) * O - c * O * s;
    return { x: Math.round(x / O) * O, y: this.alan.y + UFUK * O * (1 - s) };
  }

  /** Gök, güneş ve uzak siluet (sabit; sokak önünden kayar). */
  private gokCiz(gun: number): Phaser.GameObjects.Image {
    const W = PEN_W;
    const t = new Tuval(this.scene, W, PEN_H, 'gok');
    const rnd = rastgele(0x5eed + gun * 977);
    const bant = Math.ceil(UFUK / PAL.gok.length);
    PAL.gok.forEach((c, i) => {
      t.rect(0, i * bant, W, bant, c);
      if (i > 0) t.dither(0, i * bant, W, 2, PAL.gok[i - 1]);
    });
    t.daire(470, UFUK - 40, 9, '#d4b98c');
    t.dither(458, UFUK - 52, 25, 25, '#c9ad85', 1);
    t.daire(470, UFUK - 40, 8, '#dcc39a');
    for (let x = 0; x < W; ) {
      const bw = 14 + Math.floor(rnd() * 26);
      const bh = 26 + Math.floor(rnd() * 56);
      t.rect(x, UFUK - bh, bw, bh, rnd() < 0.5 ? PAL.uzakBina : PAL.uzakBinaKoyu);
      for (let k = 0; k < bw * bh * 0.01; k++) t.px(x + 2 + Math.floor(rnd() * (bw - 4)), UFUK - bh + 3 + Math.floor(rnd() * (bh - 6)), PAL.isikKoyu);
      x += bw + Math.floor(rnd() * 6);
    }
    t.rect(0, UFUK, W, PEN_H - UFUK, PAL.asfalt);
    return t.goruntu(this.alan.x, this.alan.y, O).setOrigin(0).setTint(0xe6dcd4);
  }

  /** Kaldırım, yol ve sokak lambaları (binaların önünde). */
  private zeminCiz(ilk: number, son: number): void {
    const W = (son - ilk) * PARSEL;
    const H = 14 + ZEMIN_ALT;
    const t = new Tuval(this.scene, W, H, 'sokak-zemin');
    t.rect(0, 0, W, 5, PAL.kaldirim);
    for (let x = 0; x < W; x += 8) t.px(x, 1 + ((x / 8) % 2) * 2, '#5a564f');
    t.rect(0, 5, W, 1, '#8a857a');
    t.rect(0, 6, W, H - 6, PAL.asfalt);
    for (let x = 4; x < W; x += 24) t.rect(x, 10, 10, 1, PAL.asfaltCizgi);
    t.dither(0, 13, W, 1, '#252324');
    this.on.add(t.goruntu(parselX(ilk), UFUK * O, O).setOrigin(0).setTint(0xe6dcd4));
    // Her üç parselde bir lamba (parsel arasındaki boşlukta).
    for (let yer = ilk + 1; yer < son; yer += 3) this.lambaKur(parselX(yer) + O);
  }

  private lambaKur(x: number): void {
    const l = new Tuval(this.scene, 14, 52, 'lamba');
    l.rect(0, 0, 2, 52, '#1e1c1e');
    l.rect(0, 0, 12, 2, '#1e1c1e');
    l.rect(9, 2, 5, 2, '#1e1c1e');
    l.rect(10, 4, 3, 1, PAL.isik);
    const y = (UFUK - 52) * O;
    this.on.add(l.goruntu(x, y, O).setOrigin(0).setTint(0xe6dcd4));
    const isik = new Tuval(this.scene, 15, 8, 'lamba-isik');
    isik.dither(0, 0, 15, 8, PAL.isik, 1);
    const img = isik.goruntu(x + 4 * O, y + 5 * O, O).setOrigin(0).setTint(0xe6dcd4);
    this.on.add(img);
    this.lambalar.push(img);
  }

  /** Sokağın başındaki dolgu binalar (soluk, işaretsiz). */
  private dolguKur(yer: number, gun: number): void {
    const rnd = rastgele(0xd01 + yer * 131 + gun * 7);
    const kat = 3 + Math.floor(rnd() * 4);
    const h = cepheH(kat - 1);
    const t = new Tuval(this.scene, CEPHE_W, h, 'dolgu');
    cepheCiz(this.scene, t.ctx, 0, 0, { kat, kolon: 6, vitrin: [], catlak: 'yok', secim: cepheSecimi(rnd), aksam: true, rnd });
    const x0 = parselX(yer) + BOSLUK * O;
    const kap = this.scene.add.container(x0, 0);
    kap.add(t.goruntu(0, (UFUK - h) * O, O).setOrigin(0).setTint(TON.dolgu));
    this.binaKap.add(kap);
    this.dolgular.push({ kap, x0 });
  }

  /** Boş arsa: alçak tahta perde (sıradaki binalar buraya gelir). */
  private arsaKur(yer: number): void {
    const W = PARSEL - 4;
    const H = 12;
    const t = new Tuval(this.scene, W, H, 'arsa');
    t.rect(0, H - 3, W, 3, '#4a4038');
    t.dither(0, H - 4, W, 1, '#4a4038');
    for (let x = 2; x < W - 2; x += 9) t.rect(x, 1, 2, H - 2, '#5a5048').px(x, 1, '#6e6458');
    t.rect(2, 3, W - 4, 1, '#5a5048');
    t.rect(2, 6, W - 4, 1, '#5a5048');
    const img = t.goruntu(parselX(yer) + 2 * O, (UFUK - H) * O, O).setOrigin(0).setTint(TON.arsa);
    this.arka.add(img);
    this.arsalar.set(yer, img);
  }

  /** Bir binanın parseli: katmanlar aynı boyda tuvallerde (cephe payla birlikte), parsel kabında. */
  private parselKur(bina: Bina, yer: number): Parsel {
    const f = bina.belgeler.foto;
    const kat = f.gorunenKat;
    const h = cepheH(kat - 1);
    const secim = cepheSecimi(rastgele(dizgiTohum(bina.id)));
    const t = this.katman(h, 'parsel');
    cepheCiz(this.scene, t.ctx, KATMAN_PAY.yan, KATMAN_PAY.ust, {
      kat,
      kolon: bina.belgeler.proje.zeminKolonSayisi,
      vitrin: f.vitrinKolonlar,
      catlak: f.gorunenCatlak,
      secim,
      ekKat: Math.max(0, kat - bina.belgeler.ruhsat.kat),
      aksam: true,
      rnd: rastgele(dizgiTohum(bina.id) ^ 0x1a5),
    });
    const x0 = parselX(yer) + (BOSLUK - KATMAN_PAY.yan) * O;
    const kap = this.scene.add.container(x0, 0);
    const govde = this.katmanGoruntu(t, h);
    kap.add(govde);
    this.binaKap.add(kap);
    const p: Parsel = { yer, bina, secim, kat, h, kap, x0, govde };
    this.parseller.push(p);
    const arsa = this.arsalar.get(yer);
    if (arsa) arsa.setAlpha(0);
    return p;
  }

  private parselSil(p: Parsel): void {
    const i = this.parseller.indexOf(p);
    if (i >= 0) this.parseller.splice(i, 1);
    p.kap.destroy();
  }

  private katman(h: number, onEk: string): Tuval {
    return new Tuval(this.scene, CEPHE_W + KATMAN_PAY.yan * 2, h + KATMAN_PAY.ust + KATMAN_PAY.alt, onEk);
  }

  private katmanGoruntu(t: Tuval, h: number): Phaser.GameObjects.Image {
    return t.goruntu(0, (UFUK - h - KATMAN_PAY.ust) * O, O).setOrigin(0);
  }

  private tonla(p: Parsel): void {
    const ton = p === this.incelenen ? TON.incelenen : TON.damgali;
    for (const o of p.kap.list) (o as Phaser.GameObjects.Image).setTint(ton);
  }

  /** Damga işareti: GÜÇLENDİR iskele, BOŞALT karanlık pencereler ve şerit. canlandir: kurulurken görünsün. */
  private isaretKur(p: Parsel, canlandir: boolean): void {
    const { yan, ust } = KATMAN_PAY;
    const ton = p === this.incelenen ? TON.incelenen : (p.kap.list[0] as Phaser.GameObjects.Image).tintTopLeft;
    if (p.damga === 'guclendir') {
      const t = this.katman(p.h, 'iskele');
      iskeleCiz(t.ctx, yan, ust, p.kat);
      p.isaret = this.katmanGoruntu(t, p.h).setTint(ton);
      p.kap.add(p.isaret);
      // İskele aşağıdan yukarı kat kat kurulur.
      if (canlandir) this.acil(p.isaret, 'yukari', 900, 120);
    } else if (p.damga === 'bosalt') {
      const k = this.katman(p.h, 'karanlik');
      karanlikCiz(k.ctx, yan, ust, p.kat, p.secim);
      p.karanlik = this.katmanGoruntu(k, p.h).setTint(ton);
      p.kap.addAt(p.karanlik, 1);
      const s = this.katman(p.h, 'serit');
      seritCiz(s.ctx, yan, ust, p.kat);
      p.serit = this.katmanGoruntu(s, p.h).setTint(ton);
      p.kap.add(p.serit);
      if (canlandir) {
        // Işıklar sönük sönük söner, sonra şerit soldan sağa gerilir.
        p.karanlik.setAlpha(0);
        this.scene.tweens.add({ targets: p.karanlik, alpha: 1, duration: 600, delay: 100, ease: 'Stepped', easeParams: [4] });
        this.acil(p.serit, 'saga', 500, 650);
      }
    }
  }

  /** Görüntüyü kırparak açar: 'yukari' alttan üste (kat kat), 'saga' soldan sağa. */
  private acil(img: Phaser.GameObjects.Image, yon: 'yukari' | 'saga', sure: number, gecikme: number): void {
    const W = img.frame.width;
    const H = img.frame.height;
    const d = { v: 0 };
    const kirp = (): void => {
      if (yon === 'yukari') {
        const h = Math.round(H * d.v);
        img.setCrop(0, H - h, W, h);
      } else img.setCrop(0, 0, Math.round(W * d.v), H);
    };
    kirp();
    this.scene.tweens.add({
      targets: d,
      v: 1,
      duration: sure,
      delay: gecikme,
      ease: yon === 'yukari' ? 'Stepped' : 'Linear',
      easeParams: yon === 'yukari' ? [8] : undefined,
      onUpdate: kirp,
      onComplete: () => img.setCrop(),
    });
  }

  private hasarKur(p: Parsel, derece: HasarDurumu, canlandir: boolean): void {
    if (derece === 'ayakta' || p.hasarImg) return;
    const t = this.katman(p.h, 'hasar');
    hasarCiz(t.ctx, KATMAN_PAY.yan, KATMAN_PAY.ust, p.kat, derece, p.secim, rastgele(dizgiTohum(p.bina.id) ^ 0xc4a7));
    const ton = (p.kap.list[0] as Phaser.GameObjects.Image).tintTopLeft;
    p.hasarImg = this.katmanGoruntu(t, p.h).setTint(ton);
    // Çatlak duvarın üstünde, iskele ve şeridin altında.
    const altinda = p.isaret ?? p.serit;
    if (altinda) p.kap.addAt(p.hasarImg, p.kap.getIndex(altinda));
    else p.kap.add(p.hasarImg);
    if (canlandir) {
      p.hasarImg.setAlpha(0);
      this.scene.tweens.add({ targets: p.hasarImg, alpha: 1, duration: 400, ease: 'Stepped', easeParams: [3] });
      // Çatladığı an bina bir kez parlar: göz oraya gitsin.
      for (const o of p.kap.list) (o as Phaser.GameObjects.Image).setTintFill(0xf0e6d0);
      this.scene.time.delayedCall(90, () => this.tonla(p));
    }
  }

  /** Çökme (G5): bina yerine oturur, kaldırımda moloz kalır. */
  private yik(p: Parsel, canlandir: boolean): void {
    const t = new Tuval(this.scene, CEPHE_W, 32, 'moloz');
    molozCiz(t.ctx, 0, 32, rastgele(dizgiTohum(p.bina.id) ^ 0x3017));
    const moloz = t.goruntu(parselX(p.yer) + BOSLUK * O, (UFUK - 32) * O, O).setOrigin(0).setTint(TON.damgali);
    this.binaKap.add(moloz);
    const govde = p.kap;
    if (!canlandir) {
      govde.setVisible(false);
      return;
    }
    moloz.setAlpha(0);
    this.scene.tweens.add({ targets: govde, y: p.h * O, duration: 900, ease: 'Quad.easeIn', onComplete: () => govde.setVisible(false) });
    this.scene.tweens.add({ targets: moloz, alpha: 1, duration: 300, delay: 600 });
  }
}
