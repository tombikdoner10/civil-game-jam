// @beyan görsel
import * as Phaser from 'phaser';
import type { Bina, Damga } from '../game/building';
import { gecerliRuhsat } from '../game/building';
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
  iadeCiz,
  iskeleCiz,
  karanlikCiz,
  KATMAN_PAY,
  molozCiz,
  seritCiz,
  zarfCiz,
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
/** Parsel genişliği (sanat pikseli): cephe ve iki yanında boşluk. */
const PARSEL = 124;
const BOSLUK = (PARSEL - CEPHE_W) / 2;
/** Sokağın başında (solda) dolgu binalar ve sonunda (sağda) boş arsalar. */
const DOLGU_SAYI = 6;
const ARSA = 14;
/** Moloz yığınının ortadaki yüksekliği (sanat pikseli; tiles.molozCiz yaklaşık 18-22). */
const MOLOZ_TEPE = 18;
/** Zemin şeridi kaldırım çizgisinin altında ne kadar uzar (küçültülünce pencerenin altı boş kalmasın). */
const ZEMIN_ALT = 42;

/** İncelenen bina pencerenin ortasının biraz sağında: solda geçmiş binalardan ikisi tam görünsün. */
const INCELE_ORAN = 0.58;
/**
 * Sokak dolunca (en az `esik` geçmiş bina) masa penceresinde sokak yarı boyda (1 sanat pikseli = 1 ekran
 * pikseli, keskin) ve incelenen bina sağda: solunda 6 kadar geçmiş bina görünür.
 */
const DOLU = { esik: 3, olcek: 0.5, oran: 0.76 };
/** Gün başı turu: sokağın tamamı (ya da son kısmı) küçük ölçekte; bekle, sonra incelenen binaya yaklaş. */
const TUR = { minOlcek: 0.25, bekle: 1300, yaklas: 1400 };

const TON_GUN = { incelenen: 0xe6dcd4, damgali: 0xa09898, dolgu: 0x4a4654, arsa: 0x8a8480, gok: 0xe6dcd4 };
/** Gece (G5 büyük deprem): soğuk ve karanlık; binalar lamba ışığında seçilir. */
const TON_GECE = { incelenen: 0x9a9cb4, damgali: 0x8a8ca6, dolgu: 0x2e3044, arsa: 0x5a5a6a, gok: 0xffffff };
/**
 * Dolgu (dekor) binalar gerçek binalardan ayrılsın (G23): daha alçak, koyu ve hafif saydam (gök biraz geçer,
 * kontrast düşer); uzakta duruyormuş gibi.
 */
const DOLGU = { katEn: 2, katAralik: 3, alfa: 0.85 };
/**
 * Deprem yakın planı (G23b): odaktaki grubun dışında kalan (kenarda görünen) binalar dekor gibi soluk; göz gruba
 * gider, gruptaki binalar komşularıyla karışmaz.
 */
const ODAK_DISI_ALFA = 0.4;

export type SokakHasar = HasarDurumu | 'yikik';

/** Sokağa konan kayıt: SokakKaydi, hasar çökük ('yikik') de olabilir (gazete fotoğrafı). */
export type SokakGirdi = Omit<SokakKaydi, 'hasar'> & { hasar?: SokakHasar };

export interface SokakSecenek {
  /** Bir sanat pikseli kaç ekran pikseli (varsayılan SOKAK_OLCEK). Pencere tuvali alan / olcek. */
  olcek?: number;
  /** Gece görünümü: karanlık gök, ay, yanan lambalar, soğuk tonlar. */
  gece?: boolean;
  /** Uzak siluet (arkadaki şehir) çizilsin mi (varsayılan evet; gazete fotoğrafında hayır). */
  uzak?: boolean;
  /**
   * Masa penceresi: gün başında sokak turu (dolu sokak küçük ölçekte görünür, sonra ilk dosyanın binasına
   * yaklaşılır) ve dolu sokakta yarı boy görünüm (DOLU).
   */
  tur?: boolean;
}

/** Sokaktaki bir bina yeri (Quake bunlarla çalışır). */
export interface SokakYeri {
  yer: number;
  bina: Bina;
  damga: Damga;
  hasar?: SokakHasar;
  /** Damgalandığı gün (yeni gelen incelenen binada yok). */
  gun?: number;
  /** Bu binada zarf alındı (G22). */
  zarf?: boolean;
}

interface Parsel {
  yer: number;
  bina: Bina;
  damga?: Damga;
  hasar?: SokakHasar;
  gun?: number;
  zarf?: boolean;
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
  hasarDerece?: HasarDurumu;
  isaret?: Phaser.GameObjects.Image;
  serit?: Phaser.GameObjects.Image;
  zarfImg?: Phaser.GameObjects.Image;
  /** Çöken binanın molozu (gövde kabının dışında; odak soluklaştırmasında birlikte). */
  moloz?: Phaser.GameObjects.Image;
}

/**
 * Pencereden görünen kalıcı sokak: o güne kadar damgalanan her bina damgalanma sırasıyla bir parselde durur.
 * GÜÇLENDİR iskeleli, BOŞALT şeritli ve karanlık, İADE (denetlenmedi) kapısında beyaz kâğıtla; sarsıntıdan kalan hasar çatlak olarak görünür. İncelenen
 * dosyanın binası sıradaki parselde, ortada ve aydınlık. Sokak kaydırılır (ve gerekirse küçültülür): okunur kalsın.
 * Aynı sınıf G5'te büyük deprem için tam ekran (olcek 3, gece) ve gazete fotoğrafı için küçük kullanılır.
 */
export class Sokak {
  private readonly kok: Phaser.GameObjects.Container;
  private readonly arka: Phaser.GameObjects.Container;
  private readonly binaKap: Phaser.GameObjects.Container;
  private readonly on: Phaser.GameObjects.Container;
  private readonly parseller: Parsel[] = [];
  private readonly dolgular: { kap: Phaser.GameObjects.Container; x0: number }[] = [];
  private readonly arsalar = new Map<number, Phaser.GameObjects.Image>();
  /** Lamba ışıkları ve taban saydamlıkları (sarsıntıda göz kırpar, sonra tabana döner). */
  private readonly lambalar: { img: Phaser.GameObjects.Image; alfa: number }[] = [];
  private uzakImg?: Phaser.GameObjects.Image;
  private incelenen?: Parsel;
  private kaydirma?: Phaser.Tweens.Tween;
  /** Masa penceresi modu (SokakSecenek.tur). */
  private readonly masa: boolean;
  /** Gün başı turu sürüyor: ilk incele beklemeden sonra yaklaşır. */
  private turda = false;
  private turBekleme?: Phaser.Time.TimerEvent;
  /** Ekran pikseli / sanat pikseli. */
  private readonly O: number;
  /** Pencere tuvali (sanat pikseli) ve kaldırım çizgisi. */
  private readonly penW: number;
  private readonly penH: number;
  private readonly ufuk: number;
  private readonly gece: boolean;
  private readonly TON: typeof TON_GUN;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly alan: Alan,
    gun: number,
    kayitlar: readonly SokakGirdi[],
    derinlik: number,
    secenek: SokakSecenek = {},
  ) {
    this.O = secenek.olcek ?? SOKAK_OLCEK;
    this.penW = Math.round(alan.w / this.O);
    this.penH = Math.round(alan.h / this.O);
    this.ufuk = this.penH - 14;
    this.gece = secenek.gece ?? false;
    this.TON = this.gece ? TON_GECE : TON_GUN;
    this.gokCiz(gun, derinlik, secenek.uzak ?? true);
    this.kok = scene.add.container(alan.x, alan.y).setDepth(derinlik + 1);
    this.arka = scene.add.container(0, 0);
    this.binaKap = scene.add.container(0, 0);
    this.on = scene.add.container(0, 0);
    this.kok.add([this.arka, this.binaKap, this.on]);

    const son = kayitlar.length + ARSA;
    this.zeminCiz(-DOLGU_SAYI - 2, son + 2);
    for (let yer = -DOLGU_SAYI; yer < 0; yer++) this.dolguKur(yer, gun);
    for (let yer = kayitlar.length; yer < son; yer++) this.arsaKur(yer);
    kayitlar.forEach((k, yer) => {
      const p = this.parselKur(k.bina, yer);
      p.damga = k.damga;
      p.gun = k.gun;
      p.zarf = k.zarf;
      this.isaretKur(p, false);
      this.tonla(p);
      if (k.hasar) this.hasarVer(yer, k.hasar, false);
    });
    this.masa = secenek.tur ?? false;
    const n = kayitlar.length;
    if (this.masa && n >= DOLU.esik) {
      // Gün başı turu: dolu sokak (sığmazsa en son damgalananlar) küçük ölçekte; ilk dosyada binaya yaklaşılır.
      const sigan = Math.floor((this.penW / TUR.minOlcek - 16) / PARSEL);
      const i0 = Math.max(-1, n + 1 - sigan);
      this.odakla(i0, n, 0, undefined, 0.5, TUR.minOlcek);
      this.turda = true;
    } else {
      // Gün başında sokağın başından başlanır; ilk dosyada sıradaki parsele kayılır (sokak bir kez gözden geçer).
      this.odakla(0, 0, 0, undefined, INCELE_ORAN);
    }
  }

  /** Damgalı bina sayısı (sıradaki boş parsel). */
  get damgaliSayisi(): number {
    return this.parseller.filter((p) => p.damga).length;
  }

  /** Sokaktaki damgalı binalar (sarsıntı bunlarla oynatılır). */
  damgalilar(): SokakYeri[] {
    return this.parseller
      .filter((p) => p.damga)
      .map((p) => ({ yer: p.yer, bina: p.bina, damga: p.damga as Damga, hasar: p.hasar, gun: p.gun, zarf: p.zarf }));
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
    // Dolu sokakta (masa penceresi) yarı boy: incelenen bina sağda, solunda geçmiş kararlar.
    const dolu = this.masa && yer >= DOLU.esik;
    const s = dolu ? DOLU.olcek : 1;
    const oran = dolu ? DOLU.oran : INCELE_ORAN;
    const c = (yer + 0.5) * PARSEL;
    this.turBekleme?.remove();
    this.turBekleme = undefined;
    if (this.turda) {
      // Gün başı turu: sokak bir an bütün görünür, sonra binaya yaklaşılır.
      this.turda = false;
      this.turBekleme = this.scene.time.delayedCall(TUR.bekle, () => {
        this.turBekleme = undefined;
        this.git(c, s, oran, TUR.yaklas);
      });
      return;
    }
    const hedef = this.konum(c, s, oran);
    const uzak = Math.abs(this.kok.x - hedef.x) / (PARSEL * this.O * s);
    this.git(c, s, oran, Math.min(2200, 300 + 140 * uzak));
  }

  /** İncelenen bina damgalandı: işareti canlandırarak yerine oturur ve sokakta kalır. zarf: zarf alındı (G22). */
  damgala(damga: Damga, zarf = false): void {
    const p = this.incelenen;
    if (!p) return;
    this.incelenen = undefined;
    p.damga = damga;
    p.zarf = zarf || undefined;
    this.isaretKur(p, true);
  }

  /** Vurguyu kaldır: incelenen bina da sokağın geri kalanı gibi soluk (sarsıntı başında). */
  vurguKaldir(): void {
    this.incelenen = undefined;
    for (const q of this.parseller) this.tonla(q);
  }

  /**
   * [i0, i1] parsellerini pencereye al (oran: ortalarının penceredeki yatay yeri, 0.5 = orta); sığmıyorsa
   * küçült (en az minOlcek; pencere varsayılanı yarı boy). maxOlcek: en büyük ölçek (varsayılan 1).
   */
  odakla(i0: number, i1: number, sure = 400, bitince?: () => void, oran = 0.5, minOlcek = 0.5, maxOlcek = 1): void {
    const genislik = (i1 - i0 + 1) * PARSEL + 16;
    const s = Phaser.Math.Clamp(this.penW / genislik, Math.min(minOlcek, maxOlcek, 1), Math.min(maxOlcek, 1));
    const c = ((i0 + i1 + 1) / 2) * PARSEL;
    this.turBekleme?.remove();
    this.turBekleme = undefined;
    this.git(c, s, oran, sure, bitince);
  }

  /** s ölçeğinde pencereye kaç parsel sığar (odakla'nın payı dahil; kesirli). G38 deprem genel planı. */
  sigan(s: number): number {
    return (this.penW / s - 16) / PARSEL;
  }

  /** Bir parselin s ölçeğinde ekran genişliği (px). */
  parselEkran(s: number): number {
    return PARSEL * this.O * s;
  }

  /** Kökü c (sanat pikseli, sokak boyunca) pencerenin oran noktasına ve s ölçeğine götürür. */
  private git(c: number, s: number, oran: number, sure: number, bitince?: () => void): void {
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
    const r = this.yerelKutu(yer);
    const s = this.kok.scale;
    return new Phaser.Geom.Rectangle(this.kok.x + r.x * s, this.kok.y + r.y * s, r.width * s, r.height * s);
  }

  /** Binanın sokak kabındaki (ölçeksiz) dikdörtgeni: kökle birlikte kayan ve küçülen parçacıklar için. */
  yerelKutu(yer: number): Phaser.Geom.Rectangle {
    const p = this.parseller.find((q) => q.yer === yer);
    const h = p ? p.h : 60;
    const O = this.O;
    return new Phaser.Geom.Rectangle(this.parselX(yer) + BOSLUK * O, (this.ufuk - h) * O, CEPHE_W * O, h * O);
  }

  /**
   * Binanın şu anki üst kenarı (sokak kabında, ölçeksiz y): ayaktaysa cephenin üstü; çöküyorsa inen gövdenin üstü,
   * en altta moloz yığınının tepesi (G23: çöken binanın etiket çubuğu havada kalmasın).
   */
  ustKenar(yer: number): number {
    const k = this.yerelKutu(yer);
    const p = this.parseller.find((q) => q.yer === yer);
    if (!p || p.hasar !== 'yikik') return k.y;
    return Math.min(k.y + p.kap.y, (this.ufuk - MOLOZ_TEPE) * this.O);
  }

  /**
   * Binanın üstüne sokakla birlikte kayan ve küçülen bir öğe koy (G21 "SENİN DAMGAN" etiketi). Öğenin (0, 0)'ı
   * cephenin üst kenarının ortasına gelir; öğe binaların önündeki katmanda (sallanmaz, çökmede yerinde kalır).
   */
  ustuneEkle(yer: number, obj: Phaser.GameObjects.Container): void {
    const k = this.yerelKutu(yer);
    obj.setPosition(Math.round(k.centerX), Math.round(k.y));
    this.on.add(obj);
  }

  /** Sokak kökünün ekrandaki yeri ve ölçeği (parçacık yayıcıları bununla eşlenir). */
  get gorunum(): { x: number; y: number; olcek: number } {
    return { x: this.kok.x, y: this.kok.y, olcek: this.kok.scale };
  }

  /** Pencerenin ekrandaki dikdörtgeni. */
  get pencere(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.alan.x, this.alan.y, this.alan.w, this.alan.h);
  }

  /** Uzak siluetin saydamlığı (büyük depremde bütün sokak görünürken arkada kalsın). */
  uzakSoldur(alfa: number, sure = 800): void {
    if (this.uzakImg) this.scene.tweens.add({ targets: this.uzakImg, alpha: alfa, duration: sure });
  }

  /**
   * Deprem yakın planı (G23b): yerler kümesindeki binalar tam görünür, ötekiler (kenarda kalan komşular) dekor gibi
   * soluklaşır. null: hepsi tam (bütün sokak görünümü).
   */
  odakDisiSoldur(yerler: ReadonlySet<number> | null, sure = 400): void {
    for (const p of this.parseller) {
      const alfa = !yerler || yerler.has(p.yer) ? 1 : ODAK_DISI_ALFA;
      const hedefler = p.moloz ? [p.kap, p.moloz] : [p.kap];
      if (sure <= 0) for (const h of hedefler) h.setAlpha(alfa);
      else this.scene.tweens.add({ targets: hedefler, alpha: alfa, duration: sure });
    }
  }

  /** Lamba ışığı sayısı (menü: arızalı lamba titrer, G11). */
  get lambaSayisi(): number {
    return this.lambalar.length;
  }

  /** i. lamba ışığının parlaklığı (k: taban saydamlığın katı; 1 = olağan). */
  lambaParlakligi(i: number, k: number): void {
    const l = this.lambalar[i];
    if (l) l.img.setAlpha(l.alfa * k);
  }

  /** Bir sanat pikselinin ekran boyu. */
  get olcek(): number {
    return this.O;
  }

  /** Sarsıntıda binalar yerinde titrer (guc: sanat pikseli; 0 = yerine dön). Lambalar titrer. */
  sallan(guc: number): void {
    const O = this.O;
    const oynat = (kap: Phaser.GameObjects.Container, x0: number): void => {
      kap.x = x0 + (guc > 0 ? Math.round((Math.random() - 0.5) * 2 * guc) * O : 0);
    };
    for (const p of this.parseller) oynat(p.kap, p.x0);
    for (const d of this.dolgular) oynat(d.kap, d.x0);
    for (const l of this.lambalar) l.img.setAlpha(guc > 0 && Math.random() < 0.35 ? l.alfa * 0.15 : l.alfa);
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

  /** Parselin sol kenarı (kök kabın içinde, ekran pikseli). */
  private parselX(yer: number): number {
    return yer * PARSEL * this.O;
  }

  /** Kök kabın yeri: c (sanat pikseli, sokak boyunca) pencerenin oran noktasına gelsin; ızgaraya oturur. */
  private konum(c: number, s: number, oran = 0.5): { x: number; y: number } {
    const O = this.O;
    const x = this.alan.x + Math.round((this.alan.w * oran) / O) * O - c * O * s;
    return { x: Math.round(x / O) * O, y: this.alan.y + this.ufuk * O * (1 - s) };
  }

  /** Gök, güneş (gece: ay ve yıldızlar) ve ayrı görüntüde uzak siluet (sabit; sokak önünden kayar). */
  private gokCiz(gun: number, derinlik: number, uzakVar: boolean): void {
    const W = this.penW;
    const H = this.penH;
    const UFUK = this.ufuk;
    const t = new Tuval(this.scene, W, H, 'gok');
    const rnd = rastgele(0x5eed + gun * 977);
    const gok: readonly string[] = this.gece ? PAL.gokGece : PAL.gok;
    const bant = Math.ceil(UFUK / gok.length);
    gok.forEach((c, i) => {
      t.rect(0, i * bant, W, bant, c);
      if (i > 0) t.dither(0, i * bant, W, 2, gok[i - 1]);
    });
    const gx = Math.round(W * 0.8);
    if (this.gece) {
      for (let k = 0; k < W * UFUK * 0.0015; k++) t.px(Math.floor(rnd() * W), Math.floor(rnd() * UFUK * 0.6), rnd() < 0.3 ? '#8a8ca0' : '#5a5c70');
      t.daire(gx, Math.round(UFUK * 0.25), 7, '#c8c6b4');
      t.daire(gx + 3, Math.round(UFUK * 0.25) - 2, 6, gok[0]);
    } else {
      t.daire(gx, UFUK - 40, 9, '#d4b98c');
      t.dither(gx - 12, UFUK - 52, 25, 25, '#c9ad85', 1);
      t.daire(gx, UFUK - 40, 8, '#dcc39a');
    }
    t.rect(0, UFUK, W, H - UFUK, PAL.asfalt);
    t.goruntu(this.alan.x, this.alan.y, this.O).setOrigin(0).setTint(this.TON.gok).setDepth(derinlik);
    if (!uzakVar) return;
    const u = new Tuval(this.scene, W, H, 'uzak');
    const uzak = this.gece ? ['#1e2030', '#191a28'] : [PAL.uzakBina, PAL.uzakBinaKoyu];
    const isik = this.gece ? PAL.isik : PAL.isikKoyu;
    for (let x = 0; x < W; ) {
      const bw = 14 + Math.floor(rnd() * 26);
      const bh = 26 + Math.floor(rnd() * 56);
      u.rect(x, UFUK - bh, bw, bh, rnd() < 0.5 ? uzak[0] : uzak[1]);
      const oran = this.gece ? 0.004 : 0.01;
      for (let k = 0; k < bw * bh * oran; k++) u.px(x + 2 + Math.floor(rnd() * (bw - 4)), UFUK - bh + 3 + Math.floor(rnd() * (bh - 6)), isik);
      x += bw + Math.floor(rnd() * 6);
    }
    this.uzakImg = u.goruntu(this.alan.x, this.alan.y, this.O).setOrigin(0).setTint(this.TON.gok).setDepth(derinlik);
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
    this.on.add(t.goruntu(this.parselX(ilk), this.ufuk * this.O, this.O).setOrigin(0).setTint(this.TON.incelenen));
    // Her üç parselde bir lamba (parsel arasındaki boşlukta).
    for (let yer = ilk + 1; yer < son; yer += 3) this.lambaKur(this.parselX(yer) + this.O);
  }

  private lambaKur(x: number): void {
    const O = this.O;
    const l = new Tuval(this.scene, 14, 52, 'lamba');
    l.rect(0, 0, 2, 52, '#1e1c1e');
    l.rect(0, 0, 12, 2, '#1e1c1e');
    l.rect(9, 2, 5, 2, '#1e1c1e');
    l.rect(10, 4, 3, 1, PAL.isik);
    const y = (this.ufuk - 52) * O;
    this.on.add(l.goruntu(x, y, O).setOrigin(0).setTint(this.TON.incelenen));
    const isik = new Tuval(this.scene, 15, 8, 'lamba-isik');
    isik.dither(0, 0, 15, 8, PAL.isik, 1);
    const img = isik.goruntu(x + 4 * O, y + 5 * O, O).setOrigin(0).setTint(0xe6dcd4);
    this.on.add(img);
    this.lambalar.push({ img, alfa: 1 });
    if (this.gece) {
      // Gece: lambanın altında kaldırıma düşen ışık.
      const h = 52 - 6;
      const k = new Tuval(this.scene, 31, h, 'lamba-koni');
      for (let j = 0; j < h; j++) {
        const w = 3 + Math.round((j / h) * 26);
        k.dither(15 - Math.floor(w / 2), j, w, 1, PAL.isik, j);
      }
      const koni = k.goruntu(x + 11 * O - 15 * O, y + 6 * O, O).setOrigin(0).setAlpha(0.18);
      this.on.add(koni);
      this.lambalar.push({ img: koni, alfa: 0.18 });
    }
  }

  /** Sokağın başındaki dolgu binalar (soluk, işaretsiz). */
  private dolguKur(yer: number, gun: number): void {
    const O = this.O;
    const rnd = rastgele(0xd01 + yer * 131 + gun * 7);
    const kat = DOLGU.katEn + Math.floor(rnd() * DOLGU.katAralik);
    const h = cepheH(kat - 1);
    const t = new Tuval(this.scene, CEPHE_W, h, 'dolgu');
    cepheCiz(this.scene, t.ctx, 0, 0, { kat, kolon: 6, vitrin: [], catlak: 'yok', secim: cepheSecimi(rnd), aksam: true, rnd });
    const x0 = this.parselX(yer) + BOSLUK * O;
    const kap = this.scene.add.container(x0, 0);
    kap.add(t.goruntu(0, (this.ufuk - h) * O, O).setOrigin(0).setTint(this.TON.dolgu).setAlpha(DOLGU.alfa));
    this.binaKap.add(kap);
    this.dolgular.push({ kap, x0 });
  }

  /** Boş arsa: alçak tahta perde (sıradaki binalar buraya gelir). */
  private arsaKur(yer: number): void {
    const O = this.O;
    const W = PARSEL - 4;
    const H = 12;
    const t = new Tuval(this.scene, W, H, 'arsa');
    t.rect(0, H - 3, W, 3, '#4a4038');
    t.dither(0, H - 4, W, 1, '#4a4038');
    for (let x = 2; x < W - 2; x += 9) t.rect(x, 1, 2, H - 2, '#5a5048').px(x, 1, '#6e6458');
    t.rect(2, 3, W - 4, 1, '#5a5048');
    t.rect(2, 6, W - 4, 1, '#5a5048');
    const img = t.goruntu(this.parselX(yer) + 2 * O, (this.ufuk - H) * O, O).setOrigin(0).setTint(this.TON.arsa);
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
      ekKat: Math.max(0, kat - gecerliRuhsat(bina.belgeler.ruhsat).kat),
      aksam: true,
      rnd: rastgele(dizgiTohum(bina.id) ^ 0x1a5),
    });
    const x0 = this.parselX(yer) + (BOSLUK - KATMAN_PAY.yan) * this.O;
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
    return t.goruntu(0, (this.ufuk - h - KATMAN_PAY.ust) * this.O, this.O).setOrigin(0);
  }

  private tonla(p: Parsel): void {
    const ton = p === this.incelenen ? this.TON.incelenen : this.TON.damgali;
    for (const o of p.kap.list) (o as Phaser.GameObjects.Image).setTint(ton);
  }

  /** Damga işareti: GÜÇLENDİR iskele, BOŞALT karanlık pencereler ve şerit, İADE kapıda beyaz kâğıt. canlandir: kurulurken görünsün. */
  private isaretKur(p: Parsel, canlandir: boolean): void {
    const { yan, ust } = KATMAN_PAY;
    const ton = p === this.incelenen ? this.TON.incelenen : (p.kap.list[0] as Phaser.GameObjects.Image).tintTopLeft;
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
    } else if (p.damga === 'iade') {
      // Denetlenmedi: kapıda küçük beyaz kâğıt; bina sokakta olduğu gibi (içi dolu) kalır.
      const t = this.katman(p.h, 'iade');
      iadeCiz(t.ctx, yan, ust, p.kat);
      p.isaret = this.katmanGoruntu(t, p.h).setTint(ton);
      p.kap.add(p.isaret);
      if (canlandir) {
        p.isaret.setAlpha(0);
        this.scene.tweens.add({ targets: p.isaret, alpha: 1, duration: 300, delay: 200, ease: 'Stepped', easeParams: [3] });
      }
    }
    // Zarf izi (G22): damga işaretinin üstünde, kapının yanında küçük sarı zarf.
    if (p.zarf && !p.zarfImg) {
      const t = this.katman(p.h, 'zarf-iz');
      zarfCiz(t.ctx, yan, ust, p.kat);
      p.zarfImg = this.katmanGoruntu(t, p.h).setTint(ton);
      p.kap.add(p.zarfImg);
      if (canlandir) {
        p.zarfImg.setAlpha(0);
        this.scene.tweens.add({ targets: p.zarfImg, alpha: 1, duration: 300, delay: 500, ease: 'Stepped', easeParams: [3] });
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

  /** Çatlak katmanı; daha ağır hasar gelirse eskisinin yerine yenisi çizilir. */
  private hasarKur(p: Parsel, derece: HasarDurumu, canlandir: boolean): void {
    if (derece === 'ayakta' || p.hasarDerece === derece || p.hasarDerece === 'agirHasar') return;
    if (p.hasarImg) p.hasarImg.destroy();
    const t = this.katman(p.h, 'hasar');
    hasarCiz(t.ctx, KATMAN_PAY.yan, KATMAN_PAY.ust, p.kat, derece, p.secim, rastgele(dizgiTohum(p.bina.id) ^ 0xc4a7));
    const ton = (p.kap.list[0] as Phaser.GameObjects.Image).tintTopLeft;
    p.hasarImg = this.katmanGoruntu(t, p.h).setTint(ton);
    p.hasarDerece = derece;
    // Çatlak duvarın üstünde, iskele, şerit ve zarf izinin altında.
    const altinda = p.isaret ?? p.serit ?? p.zarfImg;
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

  /** Çökme (G5): bina çatlar, sarsılarak yere iner; kaldırımda moloz ve kolon kalıntısı kalır. */
  private yik(p: Parsel, canlandir: boolean): void {
    const O = this.O;
    const t = new Tuval(this.scene, CEPHE_W, 32, 'moloz');
    molozCiz(t.ctx, 0, 32, rastgele(dizgiTohum(p.bina.id) ^ 0x3017));
    const moloz = t.goruntu(this.parselX(p.yer) + BOSLUK * O, (this.ufuk - 32) * O, O).setOrigin(0).setTint(this.TON.damgali);
    // Moloz yolun (önde) arkasında, binaların önünde kalsın.
    this.binaKap.add(moloz);
    p.moloz = moloz;
    const govde = p.kap;
    if (!canlandir) {
      govde.setVisible(false);
      return;
    }
    this.hasarKur(p, 'agirHasar', false);
    moloz.setAlpha(0);
    const molozAlfa = govde.alpha;
    // Önce bir an titrer ve hafif yan yatar, sonra kat kat çöker (yere inerken alttan kırpılır gibi görünür).
    this.scene.tweens.add({
      targets: govde,
      y: p.h * O,
      duration: 1100,
      delay: 250,
      ease: 'Quad.easeIn',
      onComplete: () => govde.setVisible(false),
    });
    this.scene.tweens.add({ targets: moloz, alpha: molozAlfa, duration: 300, delay: 850 });
  }
}
