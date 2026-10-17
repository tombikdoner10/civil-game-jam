// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import type { Kural } from '../game/building';
import { tarih } from '../game/diyalog';
import { aktifKurallar, kuralSatiri, kuralYeni } from '../game/rules';
import { MASA, masayaSikistir, ustKatman } from './DocumentCard';
import { yaziSinirlari, type SecimNesne, type Yuzey } from './Inspect';
import { num, PAL } from './palette';
import { PX, rastgele, snap, Tuval } from './pixel';

/**
 * Bölümler (ayraç sekmeleri) ve kuralların bölümü. Adlar yer tutucu (takım değiştirebilir). Bilinmeyen kural
 * GENEL'e düşer. Sıra = sekme sırası.
 */
const BOLUMLER = [
  { id: 'genel', ad: 'GENEL', renk: '#c9c0a8' },
  { id: 'kat', ad: 'KAT', renk: PAL.damgaGuclendir },
  { id: 'kolon', ad: 'KOLON', renk: PAL.damgaBosalt },
  { id: 'beton', ad: 'BETON', renk: '#8a8d94' },
  { id: 'saha', ad: 'SAHA', renk: '#5b8a9a' },
  { id: 'zemin', ad: 'ZEMİN', renk: '#9a7a52' },
  { id: 'belge', ad: 'BELGE', renk: PAL.damgaIade },
] as const;
type BolumId = (typeof BOLUMLER)[number]['id'];
const KURAL_BOLUMU: Record<string, BolumId> = {
  oncelik: 'genel',
  kat: 'kat',
  kolon: 'kolon',
  beton: 'beton',
  karot: 'beton',
  rapor: 'beton',
  // G19: saha testi (Schmidt çekici) kuralı SAHA bölümünde.
  saha: 'saha',
  dere: 'saha',
  fay: 'saha',
  zeminEtudu: 'zemin',
  sivilasma: 'zemin',
  gecersiz: 'belge',
  belge: 'belge',
};
const bolumu = (k: Kural): BolumId => KURAL_BOLUMU[k.id] ?? 'genel';

/** Açık klasörün boyu (ekran): sol sayfa (sekmeler), halka yeri, sağ sayfa (kurallar). */
const ACIK = { w: 656, h: 560 };
const SOL_W = 184;
const HALKA_W = 32;
const SAG_X = -ACIK.w / 2 + 8 + SOL_W + HALKA_W;
const SAG_W = ACIK.w / 2 - 8 - SAG_X;
const ICERIK_UST = 104;
const ICERIK_ALT = ACIK.h - 64;
/** Kapalı klasör (sanat pikseli). */
const KW = 56;
const KH = 70;

const KONT = '#1d191b';
const KAGIT = '#d9d2bb';
const KAGIT_KOYU = '#b3aa90';
const KAPAK = '#3b4a5e';
const KAPAK_KOYU = '#2c3848';
const KAPAK_ACIK = '#4c5c72';
const METAL = '#9a9ca3';
const METAL_KOYU = '#5d6068';

interface Bolum {
  id: BolumId;
  ad: string;
  renk: string;
  yeni: boolean;
  sekme: Phaser.GameObjects.Container;
  sayfalar: Phaser.GameObjects.Container[];
}

/**
 * Yönetmelik klasörü (gün 2'den itibaren masada): halkalı, kalın bir klasör; kenarından renkli ayraç sekmeleri
 * taşar. Tıklayınca iki sayfalı açılır: solda bölüm sekmeleri, sağda o bölümün kuralları (sığmazsa bölüm
 * içinde < > ile sayfa). O gün gelen kurallarda "YENİ"; klasör ilk açılışta ilk yeni kuralın bölümünde açılır.
 * Açık klasör masada sürüklenir (kaşeliğin solunda kalır), X kapatır. Kural satırları inceleme modunda seçilir.
 */
export class Klasor {
  acik = false;
  private readonly kapali: Phaser.GameObjects.Container;
  private readonly sayfa: Phaser.GameObjects.Container;
  private readonly bolumler: Bolum[] = [];
  private readonly satirlar: SecimNesne[] = [];
  private bolumNo = 0;
  private sayfaNo = 0;
  private sayfaYazi!: Phaser.GameObjects.Text;
  private sayfaDugmeleri: Phaser.GameObjects.Text[] = [];
  private baslik!: Phaser.GameObjects.Text;
  private yeniIsaret?: Phaser.GameObjects.Container;
  private yeniBolum = -1;
  private kilitli = false;
  /**
   * Noktada kapalı klasörün üstünde başka bir kâğıt (belge, not) var mı (GameScene verir). İnceleme modunda
   * belgeler tıklama almaz; üstlerine tıklamak alttaki kapalı klasörü açmasın (G5b).
   */
  ortulu?: (x: number, y: number) => boolean;
  /**
   * Açık klasörün örtmemesi gereken alanlar (G24: saha notu; GameScene verir). Açılırken klasör bunlarla
   * çakışmayan en yakın yere kayar (yalnızca yatayda: masa klasörden çok az yüksek).
   */
  kacilacak?: () => Phaser.Geom.Rectangle[];

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly gun: number,
  ) {
    this.kapali = this.kapaliCiz(x, y);
    this.kapali.setSize(KW * PX, KH * PX);
    this.kapali.setInteractive({ useHandCursor: true });
    this.kapali.setData('incelemeYok', true);
    this.kapali.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      if (this.ortulu?.(p.worldX, p.worldY)) return;
      // G50: açan tıklama tüketilir; sahnenin POINTER_DOWN'ı (inceleme seçimi) açılan sayfadaki kural satırını seçmesin.
      e.stopPropagation();
      this.ac();
    });

    this.sayfa = this.acikKur();
    if (this.yeniBolum >= 0) this.yeniIsaretKur();
  }

  get sinir(): Phaser.Geom.Rectangle {
    if (this.acik) return new Phaser.Geom.Rectangle(this.sayfa.x - ACIK.w / 2, this.sayfa.y - ACIK.h / 2, ACIK.w, ACIK.h);
    return this.kapali.getBounds();
  }

  ac(): void {
    if (this.acik) return;
    this.acik = true;
    sfx.play('klasorAc');
    if (this.yeniIsaret) {
      this.scene.tweens.killTweensOf(this.yeniIsaret);
      this.yeniIsaret.destroy();
      this.yeniIsaret = undefined;
      this.bolumGoster(Math.max(0, this.yeniBolum), 0);
    }
    this.kapali.setVisible(false);
    this.kapali.disableInteractive(true);
    const [hx, hy] = this.acikYer(this.kapali.x, this.kapali.y);
    this.scene.tweens.killTweensOf(this.sayfa);
    this.sayfa.setDepth(ustKatman());
    this.sayfa.setVisible(true).setAlpha(0).setPosition(hx, hy + 24);
    this.scene.tweens.add({ targets: this.sayfa, alpha: 1, y: hy, duration: 140, ease: 'Cubic.easeOut' });
    // Açık klasör tıklamaları hep tutar (arkasındaki düğmelere geçmesin, G5b); inceleme modunda yalnızca sürüklenmez.
    this.sayfa.setInteractive();
    this.scene.input.setDraggable(this.sayfa, !this.kilitli);
  }

  /** Açık klasör kaçılacak bir alanı örtüyorsa (ör. üstüne saha notu düştü) yana kayar (G24). */
  kacin(): void {
    if (!this.acik) return;
    const [x, y] = this.acikYer(this.sayfa.x, this.sayfa.y);
    if (x === this.sayfa.x && y === this.sayfa.y) return;
    this.scene.tweens.killTweensOf(this.sayfa);
    this.scene.tweens.add({ targets: this.sayfa, x, y, alpha: 1, duration: 180, ease: 'Cubic.easeOut' });
  }

  /**
   * Açık klasörün yeri: (x, y) masaya sıkıştırılır; kaçılacak alanlarla çakışıyorsa yatayda örtüşmesi en az ve
   * (eşitlikte) istenen yere en yakın konum.
   */
  private acikYer(x: number, y: number): [number, number] {
    const [hx, hy] = masayaSikistir(x, y, ACIK.w, ACIK.h);
    const engel = this.kacilacak?.() ?? [];
    const ortu = (cx: number): number =>
      engel.reduce((n, e) => {
        const w = Math.min(cx + ACIK.w / 2, e.right) - Math.max(cx - ACIK.w / 2, e.left);
        const h = Math.min(hy + ACIK.h / 2, e.bottom) - Math.max(hy - ACIK.h / 2, e.top);
        return n + (w > 0 && h > 0 ? w * h : 0);
      }, 0);
    if (ortu(hx) === 0) return [hx, hy];
    let en = hx;
    let enPuan = Infinity;
    const sol = MASA.x + ACIK.w / 2;
    const sag = Math.max(sol, MASA.x + MASA.w - ACIK.w / 2);
    for (let cx = sol; cx <= sag + 0.5; cx += 8) {
      const puan = ortu(cx) * 1000 + Math.abs(cx - hx);
      if (puan < enPuan) {
        enPuan = puan;
        en = cx;
      }
    }
    return [snap(en), hy];
  }

  kapa(): void {
    if (!this.acik) return;
    this.acik = false;
    sfx.play('klasorKapa');
    this.scene.tweens.killTweensOf(this.sayfa);
    this.sayfa.setVisible(false);
    this.sayfa.disableInteractive();
    this.kapali.setVisible(true);
    this.kapali.setInteractive();
  }

  degistir(): void {
    if (this.acik) this.kapa();
    else this.ac();
  }

  /**
   * İnceleme modunda açık klasör sürüklenmez (sekmeler, sayfa ve X çalışır). Etkileşimi kapanmaz: üstüne
   * tıklamak arkasındaki belgelere ve düğmelere (İSTE) geçmesin.
   */
  kilitle(on: boolean): void {
    this.kilitli = on;
    if (!this.acik) return;
    this.scene.input.setDraggable(this.sayfa, !on);
  }

  /** İnceleme modu için: açıkken klasör ve görünen bölüm sayfasındaki kural satırları. */
  yuzey(): Yuzey | null {
    if (!this.acik) return null;
    // Sekmeler ve kural yazıları: kusur etiketi bunları örtmesin (G49).
    return { derinlik: this.sayfa.depth, sinir: this.sinir, alanlar: this.satirlar, yazilar: () => yaziSinirlari(this.sayfa) };
  }

  private bolumGoster(b: number, s: number): void {
    this.bolumNo = Phaser.Math.Clamp(b, 0, this.bolumler.length - 1);
    const bol = this.bolumler[this.bolumNo];
    this.sayfaNo = Phaser.Math.Clamp(s, 0, bol.sayfalar.length - 1);
    this.bolumler.forEach((x, i) => {
      x.sayfalar.forEach((p, j) => p.setVisible(i === this.bolumNo && j === this.sayfaNo));
      // Seçili sekme halkaya doğru uzanır.
      x.sekme.setX(i === this.bolumNo ? PX * 3 : 0);
      (x.sekme.getAt(1) as Phaser.GameObjects.Rectangle).setFillStyle(num(i === this.bolumNo ? KAGIT : KAGIT_KOYU));
    });
    this.baslik.setText(bol.ad);
    const cok = bol.sayfalar.length > 1;
    this.sayfaDugmeleri.forEach((d) => d.setVisible(cok));
    this.sayfaYazi.setVisible(cok).setText(`${this.sayfaNo + 1}/${bol.sayfalar.length}`);
  }

  /** Kapalı klasörün üstünde yanıp sönen "YENİ": o gün yeni kural geldi (klasör açılınca kalkar). */
  private yeniIsaretKur(): void {
    const s = this.scene;
    const k = this.kapali;
    const kap = s.add.container(snap(k.x + 40), snap(k.y - (KH * PX) / 2 - 12)).setDepth(6);
    const yazi = s.add.text(0, 0, 'YENİ', { fontFamily: FONT, fontSize: '30px', color: '#f0e6cc' }).setOrigin(0.5);
    const w = snap(yazi.width + 20);
    kap.add(s.add.rectangle(PX, PX, w + 8, 40, 0x000000, 0.4));
    kap.add(s.add.rectangle(0, 0, w + 8, 40, 0x1d191b));
    kap.add(s.add.rectangle(0, 0, w, 32, num(PAL.damgaBosalt)));
    kap.add(yazi);
    this.yeniIsaret = kap;
    s.tweens.add({ targets: kap, alpha: 0.35, duration: 450, yoyo: true, repeat: -1 });
  }

  /** Kapalı klasör (üstten): kapak, sırt bandı ve parmak deliği, etiket, sayfa kalınlığı, taşan ayraç sekmeleri. */
  private kapaliCiz(x: number, y: number): Phaser.GameObjects.Container {
    const s = this.scene;
    const t = new Tuval(s, KW + 2, KH + 3, 'klasor');
    const rnd = rastgele(19);
    t.rect(2, 3, KW, KH, '#00000066');
    // Taşan ayraç sekmeleri (sağ kenar)
    const renkler = BOLUMLER.map((b) => b.renk);
    for (let i = 0; i < 5; i++) t.rect(KW - 4, 12 + i * 10, 4, 6, KONT).rect(KW - 4, 13 + i * 10, 3, 4, renkler[(i + 1) % renkler.length]);
    // Sayfa kalınlığı
    t.rect(0, 0, KW - 3, KH, KONT);
    t.rect(2, 2, KW - 6, KH - 3, KAGIT);
    for (let yy = 3; yy < KH - 1; yy += 2) t.rect(KW - 6, yy, 2, 1, KAGIT_KOYU);
    for (let xx = 4; xx < KW - 5; xx += 2) t.rect(xx, KH - 3, 1, 2, KAGIT_KOYU);
    // Kapak
    t.rect(0, 0, KW - 6, KH - 3, KONT);
    t.rect(1, 1, KW - 8, KH - 5, KAPAK);
    t.benek(1, 1, KW - 8, KH - 5, KAPAK_ACIK, 0.06, rnd);
    // Sırt bandı
    t.rect(1, 1, 10, KH - 5, KAPAK_KOYU);
    t.rect(11, 1, 1, KH - 5, KAPAK_ACIK);
    // Parmak deliği (metal halkalı)
    t.daire(6, KH - 14, 3, METAL_KOYU).daire(6, KH - 14, 2, '#151413').px(5, KH - 16, METAL);
    // Sırt etiketi
    t.rect(3, 6, 6, 34, KONT).rect(4, 7, 4, 32, '#e3d8b8');
    // Ön etiket plakası
    t.rect(15, 14, 32, 18, KONT);
    t.rect(16, 15, 30, 16, '#d6c9a4');
    t.frame(17, 16, 28, 14, '#8f8263');
    // Metal köşe koruyucuları
    for (const [cx, cy] of [
      [KW - 10, 1],
      [KW - 10, KH - 7],
    ])
      t.rect(cx, cy, 3, 3, METAL).px(cx, cy, '#c9cbd0');
    const kap = s.add.container(snap(x), snap(y));
    kap.add(t.goruntu(0, 0));
    const tx = -((KW + 2) * PX) / 2 + 31 * PX;
    const ty = -((KH + 3) * PX) / 2 + 23 * PX;
    kap.add(s.add.text(tx, ty, 'YÖNETMELİK', { fontFamily: FONT, fontSize: '26px', color: '#231e1b' }).setOrigin(0.5));
    kap.setDepth(5);
    return kap;
  }

  /** Açık klasör: iki sayfa, halka mekanizması, sekmeler ve bölüm sayfaları. */
  private acikKur(): Phaser.GameObjects.Container {
    const s = this.scene;
    const W = ACIK.w / PX;
    const H = ACIK.h / PX;
    const rnd = rastgele(77);
    const t = new Tuval(s, W + 2, H + 3, 'klasor-acik');
    t.rect(2, 3, W, H, '#00000066');
    // Kapak (iki yana açık) ve sırt
    t.rect(0, 0, W, H, KONT);
    t.rect(1, 1, W - 2, H - 2, KAPAK);
    t.benek(1, 1, W - 2, H - 2, KAPAK_ACIK, 0.04, rnd);
    const solX = 2;
    const solW = SOL_W / PX;
    const halkaX = solX + solW;
    const halkaW = HALKA_W / PX;
    const sagX = halkaX + halkaW;
    const sagW = W - 2 - sagX;
    // Sayfalar
    t.rect(solX, 2, solW, H - 4, KAGIT);
    t.benek(solX, 2, solW, H - 4, KAGIT_KOYU, 0.03, rnd);
    t.rect(sagX, 2, sagW, H - 4, KAGIT);
    t.benek(sagX, 2, sagW, H - 4, KAGIT_KOYU, 0.03, rnd);
    // Sayfa kalınlığı (alt kenar) ve cilt gölgesi
    t.dither(solX, H - 4, solW, 1, KAGIT_KOYU).dither(sagX, H - 4, sagW, 1, KAGIT_KOYU);
    t.dither(halkaX - 2, 2, 2, H - 4, KAGIT_KOYU).dither(sagX, 2, 2, H - 4, KAGIT_KOYU);
    // Delgi delikleri (sağ sayfa) ve halka mekanizması
    t.rect(halkaX, 2, halkaW, H - 4, KAPAK_KOYU);
    t.rect(halkaX + 2, 8, halkaW - 4, H - 16, METAL_KOYU).rect(halkaX + 3, 9, halkaW - 6, H - 18, METAL).rect(halkaX + 3, 9, 1, H - 18, '#c9cbd0');
    for (const hy of [30, H - 30]) {
      t.rect(sagX + 1, hy - 1, 2, 3, '#7a7466');
      t.rect(halkaX - 1, hy - 2, halkaW + 4, 5, KONT);
      t.rect(halkaX, hy - 1, halkaW + 2, 3, METAL).rect(halkaX, hy - 1, halkaW + 2, 1, '#c9cbd0');
    }
    // Sağ sayfa başlık çizgisi
    t.rect(sagX + 4, 22, sagW - 8, 1, PAL.murekkepSoluk);

    const kap = s.add.container(0, 0);
    kap.setVisible(false);
    kap.add(t.goruntu(0, 0));
    kap.setSize(ACIK.w, ACIK.h);
    kap.setInteractive({ draggable: true, cursor: 'grab' });
    kap.disableInteractive();
    kap.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => kap.setDepth(ustKatman()));
    kap.on('drag', (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
      const [x, y] = masayaSikistir(dx, dy, ACIK.w, ACIK.h);
      kap.setPosition(x, y);
    });

    const sol = -ACIK.w / 2 + 8;
    const ust = -ACIK.h / 2;
    const dugme = (x: number, y: number, metin: string, is: () => void): Phaser.GameObjects.Text => {
      const o = s.add
        .text(x, y, metin, { fontFamily: FONT, fontSize: '44px', color: PAL.murekkep })
        .setOrigin(0.5)
        .setPadding(10, 2, 10, 2)
        .setInteractive({ useHandCursor: true });
      o.setData('kitapKapat', metin === 'X').setData('incelemeYok', true);
      o.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation();
        is();
      });
      kap.add(o);
      return o;
    };

    // Sol sayfa: klasör adı, gün, sekmeler
    kap.add(s.add.text(sol + 16, ust + 36, 'YÖNETMELİK', { fontFamily: FONT, fontSize: '40px', color: PAL.murekkep }).setOrigin(0, 0.5));
    kap.add(s.add.text(sol + 16, ust + 68, `GÜN ${this.gun}`, { fontFamily: FONT, fontSize: '26px', color: PAL.murekkepSoluk }).setOrigin(0, 0.5));
    kap.add(s.add.text(sol + 16, ust + 92, tarih(this.gun), { fontFamily: FONT, fontSize: '26px', color: PAL.murekkepSoluk }).setOrigin(0, 0.5));

    // Sağ sayfa başlığı ve X
    const sagSol = SAG_X;
    this.baslik = s.add.text(sagSol + 20, ust + 46, '', { fontFamily: FONT, fontSize: '44px', color: PAL.murekkep }).setOrigin(0, 0.5);
    kap.add(this.baslik);
    dugme(ACIK.w / 2 - 32, ust + 40, 'X', () => this.kapa());

    // Kurallar bölümlere; her bölüm sağ sayfaya sığmazsa birden çok sayfa.
    const kurallar = aktifKurallar(this.gun);
    const genislik = SAG_W - 48 - 24;
    let sekmeY = ust + 140;
    for (const B of BOLUMLER) {
      const liste = kurallar.map((k, i) => ({ k, no: i + 1 })).filter(({ k }) => bolumu(k) === B.id);
      if (liste.length === 0) continue;
      const bi = this.bolumler.length;
      const yeni = liste.some(({ k }) => kuralYeni(k, this.gun));
      // Sekme: renkli ayraç şeridi + ad (+ YENİ)
      const sekme = s.add.container(0, 0);
      const sh = 44;
      const sw = SOL_W - 16;
      sekme.add(s.add.rectangle(sol + 8 + PX, sekmeY + PX, sw, sh, 0x000000, 0.25).setOrigin(0, 0.5));
      sekme.add(s.add.rectangle(sol + 8, sekmeY, sw, sh, num(KAGIT_KOYU)).setOrigin(0, 0.5).setStrokeStyle(PX, 0x1d191b));
      sekme.add(s.add.rectangle(sol + 8 + PX, sekmeY, 4 * PX, sh - 2 * PX, num(B.renk)).setOrigin(0, 0.5));
      sekme.add(s.add.text(sol + 36, sekmeY, B.ad, { fontFamily: FONT, fontSize: '32px', color: PAL.murekkep }).setOrigin(0, 0.5));
      if (yeni) {
        sekme.add(
          s.add
            .text(sol + 8 + sw - 8, sekmeY, 'YENİ', { fontFamily: FONT, fontSize: '22px', color: '#f0e6cc', backgroundColor: PAL.damgaBosalt, padding: { x: 4, y: 0 } })
            .setOrigin(1, 0.5),
        );
      }
      const alan = s.add.rectangle(sol + 8, sekmeY, sw, sh, 0xffffff, 0.001).setOrigin(0, 0.5);
      alan.setInteractive({ useHandCursor: true }).setData('incelemeYok', true);
      alan.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation();
        if (this.bolumNo === bi && this.sayfaNo === 0) return;
        sfx.play('sekme');
        this.bolumGoster(bi, 0);
      });
      sekme.add(alan);
      kap.add(sekme);
      sekmeY += sh + 12;

      // Önce bütün satırlar ölçülür: bölüm tek sayfaya (sayfa çevirme satırı olmadan, alta kadar) sığıyorsa
      // bölünmez ve "1/2" göstergesi çıkmaz (G5b). 30 px sığmazsa 28 ve 26 px denenir; hiçbiri sığmazsa 30 px ve
      // ICERIK_ALT'ta sayfa bölünür.
      const olc = (boy: number) => {
        const out = liste.map(({ k, no }) => {
          const yk = kuralYeni(k, this.gun);
          const yazi = s.add
            .text(sagSol + 64, 0, kuralSatiri(k, this.gun), {
              fontFamily: FONT,
              fontSize: `${boy}px`,
              color: PAL.murekkep,
              lineSpacing: 2,
              wordWrap: { width: yk ? genislik - 56 : genislik, useAdvancedWrap: true },
            })
            .setOrigin(0);
          return { k, no, yk, yazi, boy, h: snap(Math.max(yazi.height, 32) + 12) };
        });
        return { out, toplam: out.reduce((n, x) => n + x.h + 8, 0) };
      };
      const tekSayfa = ACIK.h - 24 - ICERIK_UST;
      let olcum = olc(30);
      let alt = ICERIK_ALT;
      for (const boy of [30, 28, 26]) {
        const o = boy === 30 ? olcum : olc(boy);
        if (o.toplam <= tekSayfa) {
          if (o !== olcum) olcum.out.forEach((x) => x.yazi.destroy());
          olcum = o;
          alt = ACIK.h - 24;
          break;
        }
        if (o !== olcum) o.out.forEach((x) => x.yazi.destroy());
      }
      const satirlar = olcum.out;
      const sayfalar: Phaser.GameObjects.Container[] = [];
      let sayfa = s.add.container(0, 0);
      sayfalar.push(sayfa);
      let y = ust + ICERIK_UST;
      for (const { k, no, yk, yazi, h, boy } of satirlar) {
        if (y + h > ust + alt && y > ust + ICERIK_UST) {
          sayfa = s.add.container(0, 0);
          sayfalar.push(sayfa);
          y = ust + ICERIK_UST;
        }
        yazi.setY(y + 4);
        const noYazi = s.add.text(sagSol + 20, y + 4, `${no}.`, { fontFamily: FONT, fontSize: `${boy}px`, color: yk ? PAL.damgaBosalt : PAL.murekkep }).setOrigin(0);
        const r = s.add.rectangle(sagSol + 12, y, SAG_W - 28, h, 0xffffff, 0.001).setOrigin(0);
        r.setData('belge', 'kural').setData('alan', k.id);
        sayfa.add([r, noYazi, yazi]);
        if (yk) {
          if (this.yeniBolum < 0) this.yeniBolum = bi;
          sayfa.add(
            s.add
              .text(ACIK.w / 2 - 20, y + 6, 'YENİ', { fontFamily: FONT, fontSize: '26px', color: '#f0e6cc', backgroundColor: PAL.damgaBosalt, padding: { x: 6, y: 0 } })
              .setOrigin(1, 0),
          );
        }
        this.satirlar.push({ belge: 'kural', alan: k.id, nesne: r });
        y += h;
        for (let xx = sagSol + 20; xx < ACIK.w / 2 - 24; xx += 8) sayfa.add(s.add.rectangle(xx, y, 4, 4, num(KAGIT_KOYU)).setOrigin(0));
        y += 8;
      }
      kap.add(sayfalar);
      this.bolumler.push({ id: B.id, ad: B.ad, renk: B.renk, yeni, sekme, sayfalar });
    }
    // Yeni kuralın bölümü: kural sırasına göre ilk yeni kural (sekme sırasına göre değil).
    const ilkYeni = kurallar.find((k) => kuralYeni(k, this.gun));
    if (ilkYeni) this.yeniBolum = this.bolumler.findIndex((b) => b.id === bolumu(ilkYeni));

    // Bölüm içi sayfa çevirme
    const ay = ust + ACIK.h - 36;
    this.sayfaDugmeleri = [
      dugme(sagSol + 40, ay, '<', () => {
        sfx.play('sayfa');
        this.bolumGoster(this.bolumNo, this.sayfaNo - 1);
      }),
      dugme(ACIK.w / 2 - 40, ay, '>', () => {
        sfx.play('sayfa');
        this.bolumGoster(this.bolumNo, this.sayfaNo + 1);
      }),
    ];
    this.sayfaYazi = s.add.text(sagSol + SAG_W / 2, ay, '', { fontFamily: FONT, fontSize: '30px', color: PAL.murekkepSoluk }).setOrigin(0.5);
    kap.add(this.sayfaYazi);
    this.bolumGoster(0, 0);
    return kap;
  }
}
