// @beyan görsel
import * as Phaser from 'phaser';
import type { Mizac } from '../game/diyalog-metin';
import type { Ifade } from '../game/kisi';
import { KONTUR } from './palette';
import { PX, rastgele, Tuval } from './pixel';

/** Anlık ifadenin mizacın taban yüzüne dönme süresi (konuşma sürüyorsa konuşma bitince). */
const IFADE_DONUS_MS = 3500;

/** Portre tuvali (sanat pikseli): göğüs hizasına kadar, gişe camının arkasında. */
export const PORTRE_W = 72;
export const PORTRE_H = 80;

/** Solgun palete uygun tonlar: [taban, gölge]. Açık ton tabandan türetilir (ışık sol üstten). */
const TEN: [string, string][] = [
  ['#c4a58a', '#a6896f'],
  ['#b08e74', '#93735c'],
  ['#9a7a62', '#7f634e'],
  ['#cfb39b', '#b0957d'],
  ['#8a6a54', '#6f5443'],
];
const SAC_KOYU = ['#2a2321', '#3d302a', '#5a4636', '#6e5c48'];
/** Orta yaşta kırlaşmaya başlamış saç. */
const SAC_KIRLI = '#6a6560';
const SAC_KIR = ['#8f8a80', '#bdb7aa', '#a39d93', '#cdc7bb'];
const GIYSI = ['#4a4e58', '#5a4a40', '#3e4a40', '#5e5850', '#4c3e46', '#62573f', '#45505a'];
const GOMLEK = ['#c8c0ae', '#a9b0b2', '#bcae94'];
const KRAVAT = ['#6a3a34', '#3a4a5e', '#4d4a36'];
const ORTU = ['#6a5a6e', '#5a6a70', '#7a6a58', '#4e5a4a', '#86705f', '#5f5a72'];
const KASKET = ['#4a443e', '#3a3c40', '#5a4e40', '#4c4a3a'];
const SAPKA = ['#2e2a28', '#4a4038', '#3a3a3e'];
const GOZ_AK = '#d6cfc0';
const GOZ_BEBEK = '#1d191b';
const KIRPIK = '#262022';
const DUDAK = '#5e3c35';
const DUDAK_ALT = '#74493f';
const AGIZ_IC = '#2a1a18';
const TER = '#a9c6d6';
const AL = '#c4705e';
const DIS = '#e2dccd';

type Yas = 'genc' | 'orta' | 'yasli';
type Yuz = 'oval' | 'yuvarlak' | 'uzun' | 'kare';
type Cene = 'kare' | 'sivri' | 'yuvarlak';
type Burun = 'duz' | 'kemerli' | 'genis' | 'kalkik';
type GozTipi = 'normal' | 'kucuk' | 'iri';
type KasTipi = 'ince' | 'kalin' | 'gur';
type KasBicim = 'duz' | 'kavisli' | 'egik';
type SacTipi = 'kisa' | 'kel' | 'acik' | 'ayrik' | 'geri' | 'kivircik' | 'uzun' | 'topuz' | 'atkuyrugu' | 'yok';
type Sakal = 'yok' | 'tam' | 'keci' | 'kirli';
type Biyik = 'yok' | 'dolgun' | 'ince';
type Baslik = 'kasket' | 'ortu' | 'sapka' | 'yok';
type Giysi = 'ceket' | 'kazak' | 'gomlek';

/** Tohumdan portre özellikleri (deterministik; oyun RNG'sine dokunmaz). */
interface Ozellik {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  yuz: Yuz;
  cene: Cene;
  yas: Yas;
  /** [açık, taban, gölge] */
  ten: [string, string, string];
  sac: string;
  /** Kır saç: kaşlar da açık. */
  kir: boolean;
  /** Orta yaşta şakaklar kır. */
  sakakKir: boolean;
  sacTipi: SacTipi;
  ayrikSag: boolean;
  baslik: Baslik;
  baslikRenk: string;
  biyik: Biyik;
  sakal: Sakal;
  burun: Burun;
  goz: GozTipi;
  kasTipi: KasTipi;
  kasBicim: KasBicim;
  /** Ağzın yarı genişliği. */
  agizW: number;
  dolgun: boolean;
  kulak: number;
  kirpik: boolean;
  elmacik: boolean;
  ben?: [number, number];
  cil: boolean;
  gozluk: boolean;
  gozlukRenk: string;
  giysi: Giysi;
  giysiRenk: string;
  gomlek: string;
  kravat?: string;
  omuz: number;
}

function kanal(c: string): [number, number, number] {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hex(r: number, g: number, b: number): string {
  const k = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
  return `#${((k(r) << 16) | (k(g) << 8) | k(b)).toString(16).padStart(6, '0')}`;
}

function koyu(c: string, f: number): string {
  const [r, g, b] = kanal(c);
  return hex(r * f, g * f, b * f);
}

/** Beyaza doğru açar (f: 0–1). */
function acik(c: string, f: number): string {
  const [r, g, b] = kanal(c);
  return hex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
}

function karis(a: string, b: string, t: number): string {
  const [r1, g1, b1] = kanal(a);
  const [r2, g2, b2] = kanal(b);
  return hex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

function ozellik(tohum: number): Ozellik {
  const r = rastgele(tohum);
  const sec = <T,>(a: readonly T[]): T => a[Math.floor(r() * a.length)];
  const yas = sec<Yas>(['genc', 'orta', 'yasli']);
  const yuz = sec<Yuz>(['oval', 'yuvarlak', 'uzun', 'kare']);
  const rx = yuz === 'yuvarlak' ? 14 : yuz === 'kare' ? 13 : 12;
  const ry = yuz === 'uzun' ? 17 : yuz === 'yuvarlak' ? 15 : 16;
  const cene = sec<Cene>(
    yuz === 'kare'
      ? ['kare', 'kare', 'yuvarlak']
      : yuz === 'yuvarlak'
        ? ['yuvarlak', 'yuvarlak', 'sivri']
        : yuz === 'uzun'
          ? ['sivri', 'kare', 'yuvarlak']
          : ['sivri', 'yuvarlak', 'kare'],
  );
  const baslik = sec<Baslik>(['yok', 'yok', 'kasket', 'ortu', 'sapka', 'yok']);
  const havuz: Record<Yas, SacTipi[]> = {
    genc: ['kisa', 'ayrik', 'kivircik', 'uzun', 'topuz', 'atkuyrugu', 'geri', 'kisa'],
    orta: ['kisa', 'ayrik', 'geri', 'kel', 'acik', 'uzun', 'topuz', 'kivircik'],
    yasli: ['kisa', 'kel', 'acik', 'acik', 'topuz', 'geri', 'ayrik', 'kel'],
  };
  let sacTipi: SacTipi = baslik === 'ortu' ? 'yok' : sec(havuz[yas]);
  // Kasket ve şapka altında yalnızca kısa saç, kel ya da açılmış saç görünür.
  if ((baslik === 'kasket' || baslik === 'sapka') && sacTipi !== 'kel' && sacTipi !== 'acik') sacTipi = 'kisa';
  const sac = yas === 'yasli' ? sec(SAC_KIR) : yas === 'orta' ? sec([...SAC_KOYU, SAC_KIRLI]) : sec(SAC_KOYU);
  // Bıyık ve sakal yalnızca kısa saçlı ya da kel portrelerde (örtü, uzun saç, topuz ve at kuyruğuyla birlikte değil).
  const yuzKili = baslik !== 'ortu' && sacTipi !== 'uzun' && sacTipi !== 'topuz' && sacTipi !== 'atkuyrugu' && sacTipi !== 'yok';
  const sakal: Sakal = yuzKili ? sec<Sakal>(['yok', 'yok', 'yok', 'tam', 'keci', 'kirli']) : 'yok';
  const biyik: Biyik = yuzKili && (sakal === 'keci' || r() < 0.4) ? sec<Biyik>(['dolgun', 'ince']) : 'yok';
  const giysi = sec<Giysi>(['ceket', 'kazak', 'gomlek']);
  const cx = 36 + Math.floor(r() * 3) - 1;
  const cy = 36;
  const benYer: [number, number][] = [
    [cx - 8, cy + 5],
    [cx + 6, cy + 6],
    [cx - 4, cy + 12],
    [cx + 5, cy - 6],
  ];
  return {
    cx,
    cy,
    rx,
    ry,
    yuz,
    cene,
    yas,
    ...(() => {
      const [t, k] = sec(TEN);
      return { ten: [acik(t, 0.14), t, k] as [string, string, string] };
    })(),
    sac,
    kir: yas === 'yasli' || SAC_KIR.includes(sac),
    sakakKir: yas === 'orta' && r() < 0.45,
    sacTipi,
    ayrikSag: r() < 0.5,
    baslik,
    baslikRenk: baslik === 'ortu' ? sec(ORTU) : baslik === 'kasket' ? sec(KASKET) : sec(SAPKA),
    biyik,
    sakal,
    burun: sec<Burun>(['duz', 'kemerli', 'genis', 'kalkik']),
    goz: sec<GozTipi>(['normal', 'normal', 'kucuk', 'iri']),
    kasTipi: sec<KasTipi>(['ince', 'kalin', 'gur']),
    kasBicim: yas === 'yasli' ? sec<KasBicim>(['egik', 'egik', 'kavisli', 'duz']) : sec<KasBicim>(['duz', 'kavisli', 'egik']),
    agizW: r() < 0.5 ? 2 : 3,
    dolgun: r() < 0.4,
    kulak: r() < 0.3 ? 1 : 0,
    kirpik: r() < 0.35,
    elmacik: r() < 0.5,
    ben: r() < 0.2 ? sec(benYer) : undefined,
    cil: yas === 'genc' && r() < 0.2,
    gozluk: r() < (yas === 'yasli' ? 0.5 : 0.25),
    gozlukRenk: r() < 0.5 ? '#2a2624' : '#8a8478',
    giysi,
    giysiRenk: sec(GIYSI),
    gomlek: sec(GOMLEK),
    kravat: giysi === 'ceket' && r() < 0.6 ? sec(KRAVAT) : undefined,
    omuz: 28 + Math.floor(r() * 5),
  };
}

// ---- İfade: mizaç (G33) × anlık ifade ----

type Agiz =
  | 'duz'
  | 'gulumse'
  | 'genis'
  | 'sirit'
  | 'siritGenis'
  | 'sikik'
  | 'asik'
  | 'kucukAsik'
  | 'titrek'
  | 'aralik'
  | 'kucuk'
  | 'dalgali';

/** Yüz çizgilerinin o anki durumu. Kaş kaymaları sanat pikseli; eksi yukarı. */
interface YuzDurum {
  /** Kaşın iç (burna yakın) ve dış ucunun kayması. */
  kasIc: number;
  kasDis: number;
  /** Tek kaş kaldırma (asimetri). */
  kasSol: number;
  kasSag: number;
  /** Çatık: iç uçta kalın kaş. */
  kasKalin: boolean;
  goz: 'kisik' | 'normal' | 'iri';
  bebekKucuk: boolean;
  bakX: number;
  bakY: number;
  agiz: Agiz;
  /** Mahcup kızarma (yanak). */
  kizar: number;
  /** Öfke kızarması (yüz). */
  ofke: number;
  ter: number;
  alin: 'yok' | 'catik' | 'endise';
}

const TABAN: YuzDurum = {
  kasIc: 0,
  kasDis: 0,
  kasSol: 0,
  kasSag: 0,
  kasKalin: false,
  goz: 'normal',
  bebekKucuk: false,
  bakX: 0,
  bakY: 0,
  agiz: 'duz',
  kizar: 0,
  ofke: 0,
  ter: 0,
  alin: 'yok',
};

/**
 * Her mizacın taban yüzü (notr) ve beş ifadesi. Mizaç verilmezse ('yok') G17'deki genel ifadeler.
 * kibar: yumuşak kaş, hafif gülümseme · sinirli: çatık, sıkılmış dudak, kızarık yüz · telaşlı: kalkık iç kaş, iri göz,
 * aralık dudak, ter · kurnaz: tek kaş, yan gülüş, kısık göz · çekingen: aşağı/yana bakış, düşük kaş, küçük ağız.
 */
const IFADE_TABLO: Record<Mizac | 'yok', Record<Ifade, Partial<YuzDurum>>> = {
  yok: {
    notr: {},
    gergin: { kasIc: -2, agiz: 'aralik', ter: 1 },
    kizgin: { kasIc: 2, kasKalin: true, goz: 'kisik', agiz: 'asik', alin: 'catik' },
    mahcup: { kasIc: -2, bakY: 1, agiz: 'dalgali', kizar: 1 },
    sevincli: { kasIc: -1, kasDis: -1, agiz: 'genis' },
  },
  kibar: {
    notr: { agiz: 'gulumse' },
    gergin: { kasIc: -2, agiz: 'duz', ter: 1, alin: 'endise' },
    kizgin: { kasIc: 1, agiz: 'kucukAsik' },
    mahcup: { kasIc: -2, bakY: 1, agiz: 'gulumse', kizar: 1 },
    sevincli: { kasIc: -1, kasDis: -1, agiz: 'genis' },
  },
  sinirli: {
    notr: { kasIc: 2, kasKalin: true, agiz: 'sikik', ofke: 1, alin: 'catik' },
    gergin: { kasIc: 2, kasKalin: true, bakX: -1, agiz: 'sikik', ofke: 1, ter: 1, alin: 'catik' },
    kizgin: { kasIc: 2, kasKalin: true, goz: 'kisik', agiz: 'sikik', ofke: 2, alin: 'catik' },
    mahcup: { kasIc: 1, bakX: 1, agiz: 'sikik', kizar: 1 },
    sevincli: { kasIc: 1, kasKalin: true, agiz: 'genis', ofke: 1 },
  },
  telasli: {
    notr: { kasIc: -2, goz: 'iri', agiz: 'titrek', alin: 'endise' },
    gergin: { kasIc: -2, goz: 'iri', bebekKucuk: true, agiz: 'aralik', ter: 2, alin: 'endise' },
    kizgin: { kasIc: -1, goz: 'iri', agiz: 'asik', ter: 1 },
    mahcup: { kasIc: -2, goz: 'iri', bakY: 1, agiz: 'dalgali', kizar: 1, ter: 1 },
    sevincli: { kasIc: -1, kasDis: -1, goz: 'iri', agiz: 'genis' },
  },
  kurnaz: {
    notr: { kasSol: -3, kasSag: 1, goz: 'kisik', bakX: 1, agiz: 'sirit' },
    gergin: { kasIc: -1, kasSol: -1, bakX: -1, agiz: 'duz', ter: 1 },
    kizgin: { kasIc: 2, kasSol: -1, goz: 'kisik', agiz: 'asik', alin: 'catik' },
    mahcup: { kasSol: -1, bakX: 1, bakY: 1, agiz: 'sirit', kizar: 1 },
    sevincli: { kasSol: -3, kasSag: 1, goz: 'kisik', agiz: 'siritGenis' },
  },
  cekingen: {
    notr: { kasIc: -1, kasDis: 1, bakX: -1, bakY: 1, agiz: 'kucuk' },
    gergin: { kasIc: -2, kasDis: 1, bakY: 1, agiz: 'kucuk', ter: 1, alin: 'endise' },
    kizgin: { kasIc: 1, kasDis: 1, bakX: -1, bakY: 1, agiz: 'kucukAsik' },
    mahcup: { kasIc: -2, kasDis: 1, bakX: -1, bakY: 1, agiz: 'dalgali', kizar: 2 },
    sevincli: { kasIc: -1, bakY: 1, agiz: 'gulumse', kizar: 1 },
  },
};

function yuzDurum(m: Mizac | undefined, i: Ifade): YuzDurum {
  return { ...TABAN, ...IFADE_TABLO[m ?? 'yok'][i] };
}

/**
 * Gişedeki mal sahibinin kodla çizilen piksel portresi (G17, G40). Yaş, yüz ve çene biçimi, ten (üç ton, ışık sol
 * üstten), burun, göz, kaş, kulak, saç ve sakal tipi, gözlük, başlık (kasket, örtü, şapka) ve giysi tohumdan gelir
 * (aynı dosya, aynı kişi). Yüz ifadesi mizaç (G33) ile anlık ifadenin (nötr, gergin, kızgın, mahcup, sevinçli)
 * birleşimidir. Değişmeyen kısım bir kez iki katmana çizilir; ifade, konuşma ve göz kırpmada yalnızca göz, kaş,
 * ağız ve kızarma yeniden çizilir. Gerçek bir kişinin taklidi değildir.
 */
export class Portre {
  readonly img: Phaser.GameObjects.Image;
  private readonly t: Tuval;
  private readonly o: Ozellik;
  private ifade: Ifade = 'notr';
  private agizAcik = false;
  private gozKapali = false;
  private konusuyor = false;
  private agizSaat?: Phaser.Time.TimerEvent;
  private kirpSaat?: Phaser.Time.TimerEvent;
  private donusSaat?: Phaser.Time.TimerEvent;
  /** İfadenin süresi doldu; konuşma bitince taban yüze dönülür. */
  private donusBekliyor = false;
  private donusYok = false;
  /** Çizim hedefi: katman kurulurken katmanın, sonra dokunun bağlamı. */
  private hedef: CanvasRenderingContext2D;
  /** Ten pikselleri (kızarma yalnızca tene düşer); alt katman çizilirken doldurulur. */
  private readonly deri = new Uint8Array(PORTRE_W * PORTRE_H);
  private maske = false;
  private tenYaz = false;
  /** Yüz çizgilerinin altında ve üstünde kalan, bir kez çizilen katmanlar. */
  private readonly alt: HTMLCanvasElement;
  private readonly ust: HTMLCanvasElement;
  /** Dudak tonu: sakal ya da dolgun bıyık ağzı çerçeveliyorsa açık (kapalı ağız açık ağız gibi okunmasın). */
  private readonly dudak: string;

  constructor(
    private readonly scene: Phaser.Scene,
    tohum: number,
    x: number,
    y: number,
    private readonly mizac?: Mizac,
  ) {
    this.o = ozellik(tohum);
    this.dudak = this.kilCerceve() ? karis(this.o.ten[1], DUDAK, 0.55) : DUDAK;
    this.t = new Tuval(scene, PORTRE_W, PORTRE_H, 'portre');
    this.hedef = this.t.ctx;
    this.alt = this.katman(() => this.altCiz(), true);
    this.ust = this.katman(() => this.basOrtusu(), false);
    this.konturCiz();
    this.ciz();
    this.img = this.t.goruntu(x, y).setOrigin(0);
    this.kirpmaKur();
    this.img.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.agizSaat?.remove();
      this.kirpSaat?.remove();
      this.donusSaat?.remove();
    });
  }

  /**
   * Anlık ifade. Nötr dışındaki ifade IFADE_DONUS_MS sonra (konuşma sürüyorsa konuşma bitince) mizacın taban yüzüne
   * (notr) döner; yeni bir ifade sayacı baştan kurar.
   */
  setIfade(i: Ifade): void {
    this.donusSaat?.remove();
    this.donusSaat = undefined;
    this.donusBekliyor = false;
    if (i !== 'notr' && !this.donusYok && this.img?.active)
      this.donusSaat = this.scene.time.delayedCall(IFADE_DONUS_MS, () => {
        this.donusSaat = undefined;
        if (this.konusuyor) this.donusBekliyor = true;
        else this.setIfade('notr');
      });
    if (this.ifade === i) return;
    this.ifade = i;
    this.yenile();
  }

  /** Konuşurken ağız açılıp kapanır (yaklaşık 9 kez/sn). */
  konus(on: boolean): void {
    if (this.konusuyor === on || !this.img.active) return;
    this.konusuyor = on;
    this.agizSaat?.remove();
    this.agizSaat = undefined;
    if (on) {
      this.agizSaat = this.scene.time.addEvent({
        delay: 110,
        loop: true,
        callback: () => {
          this.agizAcik = !this.agizAcik || Math.random() < 0.25;
          this.yenile();
        },
      });
    } else {
      if (this.agizAcik) {
        this.agizAcik = false;
        this.yenile();
      }
      if (this.donusBekliyor) this.setIfade('notr');
    }
  }

  destroy(): void {
    this.img.destroy();
  }

  /** Yalnızca dev galerisi: göz kırpma durur ve ifade taban yüze dönmez (ekran görüntüsünde sabit kalsın). */
  galeriKipi(): void {
    this.kirpSaat?.remove();
    this.kirpSaat = undefined;
    this.donusYok = true;
  }

  private kirpmaKur(): void {
    this.kirpSaat = this.scene.time.delayedCall(1800 + Math.random() * 3200, () => {
      if (!this.img.active) return;
      this.gozKapali = true;
      this.yenile();
      this.scene.time.delayedCall(120, () => {
        if (!this.img.active) return;
        this.gozKapali = false;
        this.yenile();
        this.kirpmaKur();
      });
    });
  }

  private yenile(): void {
    if (!this.img.active) return;
    this.ciz();
    this.t.yenile();
  }

  // ---- Çizim araçları (hedef bağlama) ----

  private r(x: number, y: number, w: number, h: number, c: string): void {
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);
    if (w <= 0 || h <= 0) return;
    this.hedef.fillStyle = c;
    this.hedef.fillRect(x, y, w, h);
    if (!this.maske) return;
    const v = this.tenYaz ? 1 : 0;
    for (let j = Math.max(0, y); j < Math.min(PORTRE_H, y + h); j++)
      for (let i = Math.max(0, x); i < Math.min(PORTRE_W, x + w); i++) this.deri[j * PORTRE_W + i] = v;
  }

  private p(x: number, y: number, c: string): void {
    this.r(x, y, 1, 1, c);
  }

  private cerceve(x: number, y: number, w: number, h: number, c: string): void {
    this.r(x, y, w, 1, c);
    this.r(x, y + h - 1, w, 1, c);
    this.r(x, y, 1, h, c);
    this.r(x + w - 1, y, 1, h, c);
  }

  private daire(cx: number, cy: number, r: number, c: string, halka = false): void {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++) {
        const d = Math.sqrt(x * x + y * y);
        if (halka ? d <= r + 0.5 && d > r - 0.5 : d <= r + 0.3) this.p(cx + x, cy + y, c);
      }
  }

  private cizgi(x0: number, y0: number, x1: number, y1: number, c: string): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.p(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  private kilCerceve(): boolean {
    return this.o.sakal === 'tam' || this.o.sakal === 'keci' || this.o.biyik === 'dolgun';
  }

  /** Yalnızca ten pikseline boya (kızarma). */
  private tenP(x: number, y: number, c: string): void {
    if (x < 0 || y < 0 || x >= PORTRE_W || y >= PORTRE_H || this.deri[y * PORTRE_W + x] !== 1) return;
    this.p(x, y, c);
  }

  private katman(ciz: () => void, maske: boolean): HTMLCanvasElement {
    const cv = document.createElement('canvas');
    cv.width = PORTRE_W;
    cv.height = PORTRE_H;
    const ctx = cv.getContext('2d');
    if (!ctx) throw new Error('Portre katmanı oluşturulamadı');
    this.hedef = ctx;
    this.maske = maske;
    ciz();
    this.maske = false;
    this.tenYaz = false;
    this.hedef = this.t.ctx;
    return cv;
  }

  /** Bütün figürün çevresine koyu kontur (buzlu cam arkasında okunsun); üst katmana bir kez. */
  private konturCiz(): void {
    const a = this.alt.getContext('2d')?.getImageData(0, 0, PORTRE_W, PORTRE_H).data;
    const uctx = this.ust.getContext('2d');
    const u = uctx?.getImageData(0, 0, PORTRE_W, PORTRE_H).data;
    if (!a || !u || !uctx) return;
    const dolu = (x: number, y: number): boolean => {
      if (x < 0 || y < 0 || x >= PORTRE_W || y >= PORTRE_H) return false;
      const i = (y * PORTRE_W + x) * 4 + 3;
      return a[i] > 0 || u[i] > 0;
    };
    uctx.fillStyle = KONTUR;
    for (let y = 0; y < PORTRE_H; y++)
      for (let x = 0; x < PORTRE_W; x++)
        if (!dolu(x, y) && (dolu(x - 1, y) || dolu(x + 1, y) || dolu(x, y - 1) || dolu(x, y + 1))) uctx.fillRect(x, y, 1, 1);
  }

  /** Doku: alt katman, o anki yüz çizgileri, üst katman (başlık), ter. */
  private ciz(): void {
    const ctx = this.t.ctx;
    ctx.clearRect(0, 0, PORTRE_W, PORTRE_H);
    ctx.drawImage(this.alt, 0, 0);
    this.hedef = ctx;
    const d = yuzDurum(this.mizac, this.ifade);
    this.kizarma(d);
    this.gozler(d);
    this.gozluk();
    this.kaslar(d);
    this.agiz(d);
    ctx.drawImage(this.ust, 0, 0);
    this.ter(d);
  }

  // ---- Alt katman (bir kez) ----

  private altCiz(): void {
    const o = this.o;
    const [, ten, tenKoyu] = o.ten;

    // Uzun saç, at kuyruğu ve örtünün omza dökülen kısmı: başın arkasında.
    if (o.sacTipi === 'uzun')
      this.alan(
        (x, y) => {
          const dx = (x - o.cx) / (o.rx + 2);
          const dy = (y - o.cy) / (o.ry + 1);
          return y <= o.cy + o.ry + 10 && (y >= o.cy ? Math.abs(dx) <= 1 : dx * dx + dy * dy <= 1);
        },
        o.sac,
        koyu(o.sac, 0.8),
        0.55,
        acik(o.sac, 0.14),
      );
    if (o.sacTipi === 'atkuyrugu') this.atKuyrugu();
    if (o.baslik === 'ortu') {
      this.alan(
        (x, y) => {
          const dx = x - o.cx;
          const dy = y - (o.cy + 2);
          return (dx * dx) / ((o.rx + 3) * (o.rx + 3)) + (dy * dy) / ((o.ry + 3) * (o.ry + 3)) <= 1 || (y >= o.cy + 4 && y <= 64 && Math.abs(dx) <= o.rx + 4 + (y - o.cy - 4) * 0.5);
        },
        o.baslikRenk,
        koyu(o.baslikRenk, 0.78),
        0.55,
        acik(o.baslikRenk, 0.12),
      );
    }

    // Gövde ve boyun
    const govdeY = o.cy + o.ry + 3;
    const govde = (x: number, y: number): boolean => {
      if (y < govdeY) return false;
      const k = Math.min(1, (y - govdeY) / 10);
      return Math.abs(x - o.cx) <= 11 + (o.omuz - 11) * Math.sqrt(k);
    };
    this.tenYaz = true;
    this.alan((x, y) => Math.abs(x - o.cx) <= 4 && y >= o.cy + o.ry - 4 && y < govdeY + 2, ten, tenKoyu, 0.5);
    this.r(o.cx - 4, govdeY - 2, 9, 2, tenKoyu);
    // Çenenin boyuna düşen gölgesi
    for (let x = o.cx - 4; x <= o.cx + 4; x++) {
      let yA = -1;
      for (let y = o.cy; y <= o.cy + o.ry + 2; y++) if (this.basIcinde(x, y)) yA = y;
      if (yA < 0) continue;
      this.p(x, yA + 1, koyu(tenKoyu, 0.92));
      if ((x + yA) % 2 === 0) this.p(x, yA + 2, tenKoyu);
    }
    this.tenYaz = false;
    this.alan(govde, o.giysiRenk, koyu(o.giysiRenk, 0.78), 0.7, acik(o.giysiRenk, 0.12));
    this.yaka(govdeY);

    // Baş
    this.tenYaz = true;
    this.kulaklar();
    this.basBoya();
    this.yuzGolge();
    this.tenYaz = false;
    this.kirisik();
    this.burunCiz();
    if (o.ben) this.p(o.ben[0], o.ben[1], koyu(tenKoyu, 0.7));
    if (o.cil) {
      const c = koyu(ten, 0.84);
      for (const [dx, dy] of [
        [-7, 3],
        [-5, 4],
        [-8, 5],
        [-3, 3],
        [4, 3],
        [6, 4],
        [3, 5],
      ])
        this.p(o.cx + dx, o.cy + dy, c);
    }
    if (o.sacTipi !== 'yok') this.sacCiz();
    if (o.sakal !== 'yok') this.sakalCiz();
    if (o.biyik !== 'yok') this.biyikCiz();
  }

  /** Başın içi: üst yarı yüz biçiminden, alt yarı çene biçiminden. */
  private basIcinde(x: number, y: number): boolean {
    const o = this.o;
    const dy = (y - o.cy) / o.ry;
    let rx = o.rx;
    let p = o.yuz === 'kare' ? 2.6 : 2;
    if (dy > 0) {
      const daral = o.cene === 'sivri' ? 0.28 : o.cene === 'kare' ? 0.06 : 0.14;
      rx *= 1 - daral * dy;
      p = o.cene === 'kare' ? 3.2 : o.cene === 'sivri' ? 1.8 : 2.2;
    }
    const dx = (x - o.cx) / rx;
    return Math.abs(dx) ** p + Math.abs(dy) ** p <= 1;
  }

  /** Şekli doldur: sağ yarıda gölge (seyrek nokta), kenarlarda koyu; isik verilirse sol üst kenarda açık ton. */
  private alan(icinde: (x: number, y: number) => boolean, renk: string, golge: string, golgeEsik = 0.55, isik?: string): void {
    let x0 = PORTRE_W;
    let x1 = 0;
    for (let y = 0; y < PORTRE_H; y++)
      for (let x = 0; x < PORTRE_W; x++)
        if (icinde(x, y)) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
        }
    const orta = x0 + (x1 - x0) * golgeEsik;
    const isikSinir = x0 + (x1 - x0) * 0.35;
    for (let y = 0; y < PORTRE_H; y++)
      for (let x = 0; x < PORTRE_W; x++) {
        if (!icinde(x, y)) continue;
        const sag = x > orta;
        const kenar = !icinde(x + 1, y);
        let c = kenar || (sag && (x + y) % 2 === 0) || (x > orta + 4 && sag) ? golge : renk;
        if (isik && !sag && x < isikSinir && (!icinde(x, y - 1) || (!icinde(x, y - 2) && (x + y) % 2 === 0))) c = isik;
        this.p(x, y, c);
      }
  }

  /** Başın ten tonları: sağ yanak gölgede, alın ve sol şakak ışıkta, çene altı koyu. */
  private basBoya(): void {
    const o = this.o;
    const [tA, t, tK] = o.ten;
    const bas = (x: number, y: number): boolean => this.basIcinde(x, y);
    for (let y = o.cy - o.ry - 1; y <= o.cy + o.ry + 1; y++)
      for (let x = o.cx - o.rx - 1; x <= o.cx + o.rx + 1; x++) {
        if (!bas(x, y)) continue;
        const nx = (x - o.cx) / o.rx;
        const ny = (y - o.cy) / o.ry;
        const dama = (x + y) % 2 === 0;
        let c = t;
        if (!bas(x + 1, y) || !bas(x, y + 1)) c = tK;
        else if (nx > 0.62) c = tK;
        else if (nx > 0.38) c = dama ? tK : t;
        else if (ny > 0.5 && !bas(x, y + 2) && dama) c = tK;
        else if (ny < -0.3 && ny > -0.85 && nx > -0.6 && nx < -0.1) c = dama || nx < -0.35 ? tA : t;
        else if (nx < -0.6 && ny > -0.5 && ny < 0.3 && dama) c = tA;
        this.p(x, y, c);
      }
  }

  /** Kulaklar: her satırda başın kenarına bitişik (sol ışıkta, sağ gölgede). */
  private kulaklar(): void {
    const o = this.o;
    const [, t, tK] = o.ten;
    const y0 = o.cy - 2 - o.kulak;
    const y1 = o.cy + 4;
    for (let y = y0; y <= y1; y++) {
      let xs = o.cx;
      let xe = o.cx;
      for (let x = o.cx - o.rx - 1; x <= o.cx; x++)
        if (this.basIcinde(x, y)) {
          xs = x;
          break;
        }
      for (let x = o.cx + o.rx + 1; x >= o.cx; x--)
        if (this.basIcinde(x, y)) {
          xe = x;
          break;
        }
      const uc = y === y0 || y === y1;
      const ic = y >= o.cy && y <= o.cy + 2;
      if (!uc) this.p(xs - 2, y, t);
      this.p(xs - 1, y, ic ? tK : t);
      this.p(xe + 1, y, ic ? koyu(tK, 0.85) : tK);
      if (!uc) this.p(xe + 2, y, tK);
    }
  }

  /** Elmacık, çene ve yanak ışık-gölgesi. */
  private yuzGolge(): void {
    const o = this.o;
    const [tA, , tK] = o.ten;
    const ay = o.cy + 9;
    const alt = o.cy + o.ry;
    // Sol elmacık ışıkta
    this.r(o.cx - 10, o.cy + 2, 3, 1, tA);
    this.p(o.cx - 9, o.cy + 3, tA);
    if (o.elmacik) {
      // Elmacık altı çukuru
      this.p(o.cx - o.rx + 2, o.cy + 5, tK);
      this.p(o.cx - o.rx + 3, o.cy + 6, tK);
      this.p(o.cx - o.rx + 3, o.cy + 7, tK);
      this.p(o.cx + o.rx - 4, o.cy + 5, tK);
    }
    if (o.cene === 'kare') {
      for (let x = o.cx - 3; x <= o.cx + 3; x++) if ((x + alt) % 2 === 0) this.p(x, alt - 2, tK);
      this.p(o.cx - 2, alt - 3, tA);
      // Çene köşeleri
      this.p(o.cx - o.rx + 2, alt - 3, tK);
      this.p(o.cx + o.rx - 2, alt - 3, tK);
    } else if (o.cene === 'sivri') {
      this.p(o.cx - 1, alt - 3, tA);
      this.p(o.cx, alt - 2, tK);
    } else {
      this.r(o.cx - 1, ay + 3, 3, 1, tK);
      this.p(o.cx - 2, ay + 4, tA);
    }
  }

  /** Yaş çizgileri: alın, göz kenarı, burun-ağız, göz altı torbası. */
  private kirisik(): void {
    const o = this.o;
    const tK = o.ten[2];
    // Alın çizgisi açık tonda ve örtülü yüzde hiç yok (kaş gibi okunmasın).
    const alinK = karis(o.ten[1], tK, 0.55);
    const alin = o.baslik !== 'ortu';
    const gy = o.cy - 1;
    const bas = (x: number, y: number): boolean => this.basIcinde(x, y);
    if (o.yas === 'yasli') {
      if (alin) for (const y of [gy - 6, gy - 8]) for (let x = o.cx - 5; x <= o.cx + 4; x++) if (bas(x, y) && (x * 3 + y) % 7 !== 0) this.p(x, y, alinK);
      // Kaz ayağı
      this.p(o.cx - 9, gy, tK);
      this.p(o.cx - 9, gy + 2, tK);
      this.p(o.cx + 8, gy, tK);
      this.p(o.cx + 8, gy + 2, tK);
      // Burun-ağız çizgisi
      this.cizgi(o.cx - 3, o.cy + 6, o.cx - 5, o.cy + 10, tK);
      this.cizgi(o.cx + 3, o.cy + 6, o.cx + 5, o.cy + 10, tK);
      this.p(o.cx - 5, o.cy + 12, tK);
      this.p(o.cx + 5, o.cy + 12, tK);
      // Göz altı torbası
      for (const ex of [o.cx - 7, o.cx + 3]) {
        for (let i = 0; i < 4; i++) if ((ex + i + gy) % 2 === 0) this.p(ex + i, gy + 2, tK);
        this.r(ex + 1, gy + 3, 2, 1, tK);
      }
    } else if (o.yas === 'orta') {
      if (alin) for (let x = o.cx - 3; x <= o.cx + 2; x++) if (bas(x, gy - 7) && x % 2 === 0) this.p(x, gy - 7, alinK);
      this.p(o.cx - 4, o.cy + 8, tK);
      this.p(o.cx + 4, o.cy + 8, tK);
      this.p(o.cx - 9, gy + 1, tK);
    }
  }

  private burunCiz(): void {
    const o = this.o;
    const [tA, , tK] = o.ten;
    const gy = o.cy - 1;
    const uc = gy + 5 + (o.yuz === 'uzun' ? 1 : 0);
    const delik = koyu(tK, 0.75);
    const cx = o.cx;
    switch (o.burun) {
      case 'duz':
        for (let y = gy + 2; y < uc; y++) this.p(cx + 1, y, tK);
        this.p(cx + 1, uc, tK);
        this.p(cx, uc, tA);
        this.r(cx, uc + 1, 2, 1, tK);
        this.p(cx - 1, uc + 1, delik);
        this.p(cx + 2, uc + 1, delik);
        break;
      case 'kemerli':
        this.p(cx + 1, gy + 2, tK);
        this.p(cx + 1, gy + 3, tK);
        this.p(cx, gy + 3, tA);
        for (let y = gy + 4; y <= uc; y++) this.p(cx + 2, y, tK);
        this.p(cx + 1, uc + 1, tK);
        this.p(cx + 2, uc + 1, koyu(tK, 0.9));
        this.p(cx, uc + 1, tK);
        this.p(cx - 1, uc + 1, delik);
        break;
      case 'genis':
        for (let y = gy + 3; y < uc; y++) this.p(cx + 1, y, tK);
        this.p(cx - 2, uc, tK);
        this.p(cx, uc, tA);
        this.r(cx + 2, uc, 2, 1, tK);
        this.r(cx - 2, uc + 1, 6, 1, tK);
        this.p(cx - 1, uc + 1, delik);
        this.p(cx + 2, uc + 1, delik);
        break;
      case 'kalkik':
        this.p(cx + 1, gy + 3, tK);
        this.p(cx + 1, uc - 1, tK);
        this.p(cx, uc - 1, tA);
        this.p(cx - 1, uc, delik);
        this.p(cx, uc, tK);
        this.p(cx + 1, uc, delik);
        break;
    }
  }

  private yaka(govdeY: number): void {
    const o = this.o;
    const g = koyu(o.giysiRenk, 0.7);
    if (o.giysi === 'ceket') {
      // V yaka: gömlek ve (varsa) kravat, iki yanda ceket yakası.
      for (let j = 0; j < 12; j++) {
        const w = Math.max(0, 5 - Math.floor(j / 2));
        this.r(o.cx - w, govdeY + j, w * 2 + 1, 1, o.gomlek);
        this.p(o.cx - w - 1, govdeY + j, g);
        this.p(o.cx + w + 1, govdeY + j, g);
      }
      if (o.kravat) {
        this.r(o.cx - 1, govdeY, 3, 2, o.kravat);
        this.r(o.cx - 1, govdeY + 2, 3, 9, o.kravat);
        this.p(o.cx, govdeY + 11, o.kravat);
        this.p(o.cx + 1, govdeY + 4, koyu(o.kravat, 0.7));
        this.p(o.cx + 1, govdeY + 7, koyu(o.kravat, 0.7));
      }
      for (let j = 0; j < 8; j++) {
        this.p(o.cx - 8 + Math.floor(j / 2), govdeY + 2 + j, g);
        this.p(o.cx + 8 - Math.floor(j / 2), govdeY + 2 + j, g);
      }
    } else if (o.giysi === 'kazak') {
      this.r(o.cx - 6, govdeY, 13, 2, g);
      this.r(o.cx - 5, govdeY + 2, 11, 1, koyu(o.giysiRenk, 0.85));
      for (let y = govdeY + 5; y < PORTRE_H; y += 3) for (let x = o.cx - 20; x < o.cx + 20; x += 4) this.p(x + (y % 2), y, koyu(o.giysiRenk, 0.88));
    } else {
      // Gömlek: sivri yaka uçları ve düğme hattı.
      this.r(o.cx - 5, govdeY, 11, 2, o.gomlek);
      for (let j = 0; j < 4; j++) {
        this.r(o.cx - 5 - j, govdeY + j, 3, 1, o.gomlek);
        this.r(o.cx + 3 + j, govdeY + j, 3, 1, o.gomlek);
      }
      this.p(o.cx - 6, govdeY + 4, g);
      this.p(o.cx + 6, govdeY + 4, g);
      for (let y = govdeY + 3; y < PORTRE_H; y += 4) this.p(o.cx, y, g);
    }
  }

  /** At kuyruğu: başın sağ arkasından sarkar. */
  private atKuyrugu(): void {
    const o = this.o;
    const s = o.sac;
    const sK = koyu(s, 0.75);
    const x0 = o.cx + o.rx;
    const y0 = o.cy - o.ry + 5;
    for (let j = 0; j < 19; j++) {
      const w = j < 3 ? 4 : j < 12 ? 3 : 2;
      const x = x0 + (j < 6 ? 1 : 0) + (j > 14 ? 1 : 0);
      for (let i = 0; i < w; i++) this.p(x + i, y0 + j, i === w - 1 || (i + j) % 3 === 0 ? sK : s);
    }
    this.r(x0 + 1, y0 + 2, 3, 1, koyu(s, 0.45));
  }

  private sacCiz(): void {
    const o = this.o;
    const tip = o.sacTipi;
    const s = o.sac;
    const sK = koyu(s, 0.75);
    const sA = acik(s, 0.2);
    const kirYan = o.sakakKir ? karis(s, '#bdb7aa', 0.6) : undefined;
    const bas = (x: number, y: number): boolean => this.basIcinde(x, y);
    const hat = o.cy - Math.round(o.ry * 0.5);
    if (tip === 'kivircik') {
      this.kivircik(hat);
      return;
    }
    const tepe = o.cy - o.ry;
    for (let y = tepe - 3; y <= o.cy + 4; y++)
      for (let x = o.cx - o.rx - 2; x <= o.cx + o.rx + 2; x++) {
        const icinde = bas(x, y) || bas(x, y + 2) || bas(x - 1, y + 1) || bas(x + 1, y + 1);
        if (!icinde) continue;
        const yan = Math.abs(x - o.cx) >= o.rx - 2 && y <= o.cy - 2;
        let dolu: boolean;
        if (tip === 'kel') dolu = yan && y >= o.cy - 7;
        else if (tip === 'acik') dolu = (yan && y >= o.cy - 10) || (y <= hat - 3 && (x + y) % 2 === 0 && Math.abs(x - o.cx) <= o.rx - 4 && bas(x, y));
        else if (tip === 'geri' || tip === 'atkuyrugu') dolu = y <= hat - 1 || yan;
        else dolu = y <= hat || yan;
        // Saç çizgisi biraz dalgalı
        if ((tip === 'kisa' || tip === 'uzun' || tip === 'topuz') && y === hat + 1 && Math.abs(x - o.cx) < o.rx - 3 && (x * 7) % 5 === 0) dolu = true;
        if (!dolu) continue;
        let c = (x + y) % 3 === 0 || !bas(x, y + 1) ? sK : s;
        // Geriye taranmış: yatay tarak çizgileri
        if (tip === 'geri' || tip === 'atkuyrugu') c = !bas(x, y + 1) ? sK : y % 2 === 0 ? koyu(s, 0.86) : s;
        // Işık sol üstten
        if (x - o.cx + 1.5 * (y - tepe) < -5 && (x + y) % 2 === 0) c = sA;
        if (kirYan && yan && y >= o.cy - 9) c = kirYan;
        this.p(x, y, c);
      }
    if (tip === 'kel' || tip === 'acik') {
      // Kafa derisinde parlama
      const tA = acik(o.ten[0], 0.2);
      this.r(o.cx - 6, tepe + 3, 2, 1, tA);
      this.p(o.cx - 7, tepe + 4, tA);
    }
    if (tip === 'ayrik') {
      // Ayrık çizgisi ve geniş yandan alına düşen perçem
      const ax = o.cx + (o.ayrikSag ? 4 : -5);
      for (let y = tepe - 1; y < hat; y++) if (bas(ax, y)) this.p(ax, y, o.ten[2]);
      const yon = o.ayrikSag ? -1 : 1;
      for (let k = 1; k <= 7; k++) {
        const derin = k <= 2 ? 1 : k <= 5 ? 2 : 1;
        for (let j = 1; j <= derin; j++) this.p(ax + yon * k, hat + j, j === derin ? sK : s);
      }
    }
    if (tip === 'geri') this.r(o.cx - 7, tepe + 1, 4, 1, sA);
    if (tip === 'topuz') {
      this.daire(o.cx + 3, tepe - 3, 4, s);
      this.daire(o.cx + 3, tepe - 3, 4, sK, true);
      this.r(o.cx + 1, tepe - 5, 2, 1, sA);
    }
    if (tip === 'uzun') {
      // Yüzün iki yanında düşen saç
      this.r(o.cx - o.rx - 1, o.cy - 4, 3, o.ry + 8, s);
      this.r(o.cx - o.rx - 1, o.cy - 4, 1, o.ry + 8, sA);
      this.r(o.cx + o.rx - 1, o.cy - 4, 3, o.ry + 8, sK);
    }
  }

  /** Kıvırcık: başın üstünde ve yanlarında dalgalı kenarlı hacim. */
  private kivircik(hat: number): void {
    const o = this.o;
    const s = o.sac;
    const sK = koyu(s, 0.72);
    const sA = acik(s, 0.2);
    const ex = o.rx + 3;
    const ey = o.ry + 2;
    const ycx = o.cy - 2;
    for (let y = o.cy - o.ry - 6; y <= o.cy + 2; y++)
      for (let x = o.cx - ex - 1; x <= o.cx + ex + 1; x++) {
        const dx = (x - o.cx) / ex;
        const dy = (y - ycx) / ey;
        const kenar = 1 + 0.07 * Math.sin(Math.atan2(dy, dx) * 11);
        if (dx * dx + dy * dy > kenar * kenar) continue;
        if (this.basIcinde(x, y) && (y > hat + 1 || (y > o.cy - 3 && Math.abs(x - o.cx) < o.rx - 1))) continue;
        if (y > o.cy - 3 && this.basIcinde(x, y)) continue;
        const k = (x * 5 + y * 3) % 7;
        let c = k < 2 ? sK : s;
        if (k === 4 && x - o.cx + (y - (o.cy - o.ry)) < 0) c = sA;
        if (x > o.cx + o.rx - 2 && (x + y) % 2 === 0) c = sK;
        this.p(x, y, c);
      }
    // Alın kenarında kıvrımlar
    for (let x = o.cx - o.rx + 4; x <= o.cx + o.rx - 4; x += 3) {
      this.p(x, hat + 2, s);
      this.p(x + 1, hat + 2, sK);
    }
  }

  private sakalCiz(): void {
    const o = this.o;
    const c = koyu(o.sac, 0.9);
    const cK = koyu(c, 0.85);
    const ay = o.cy + 9;
    const altDudak = karis(o.ten[1], DUDAK, 0.3);
    if (o.sakal === 'tam') {
      for (let y = o.cy + 3; y <= o.cy + o.ry + 1; y++)
        for (let x = o.cx - o.rx; x <= o.cx + o.rx; x++) {
          if (!this.basIcinde(x, y)) continue;
          // Sakal alt dudağa kadar çıkar: ağzın çevresinde açık ten penceresi kalmasın (açık ağız gibi okunur).
          const agiz = (y >= ay - 2 && y <= ay && Math.abs(x - o.cx) <= 4) || (y === ay + 1 && Math.abs(x - o.cx) <= 1);
          const yanak = y < o.cy + 7 && Math.abs(x - o.cx) < o.rx - 3;
          if (agiz || yanak) continue;
          this.p(x, y, (x + y) % 2 === 0 ? c : cK);
        }
      this.r(o.cx - 1, ay + 1, 3, 1, altDudak);
    } else if (o.sakal === 'keci') {
      for (let y = ay + 1; y <= o.cy + o.ry + 2; y++)
        for (let x = o.cx - 4; x <= o.cx + 4; x++) {
          const w = y <= ay + 5 ? 3 : 2;
          if (Math.abs(x - o.cx) > w || (y === ay + 1 && Math.abs(x - o.cx) <= 1)) continue;
          if (!this.basIcinde(x, y) && !this.basIcinde(x, y - 2)) continue;
          this.p(x, y, (x + y) % 2 === 0 ? c : cK);
        }
      for (let y = ay; y <= ay + 1; y++) {
        this.p(o.cx - 4, y, c);
        this.p(o.cx + 4, y, cK);
      }
      this.r(o.cx - 1, ay + 1, 3, 1, altDudak);
    } else {
      // Kirli sakal: çene ve üst dudakta seyrek gölge
      const k = karis(o.ten[1], o.sac, 0.5);
      for (let y = o.cy + 5; y <= o.cy + o.ry; y++)
        for (let x = o.cx - o.rx; x <= o.cx + o.rx; x++) {
          if (!this.basIcinde(x, y) || (x + y) % 2 !== 0) continue;
          const agiz = y >= ay - 1 && y <= ay + 1 && Math.abs(x - o.cx) <= 3;
          const yanak = y < o.cy + 8 && Math.abs(x - o.cx) < o.rx - 4 && Math.abs(x - o.cx) > 3;
          const burun = y < ay - 2 && Math.abs(x - o.cx) <= 3;
          if (agiz || yanak || burun) continue;
          this.p(x, y, k);
        }
    }
  }

  private biyikCiz(): void {
    const o = this.o;
    const ay = o.cy + 9;
    const b = koyu(o.sac, 0.85);
    if (o.biyik === 'dolgun') {
      // Ortada burun altı çentiği ve sol üstte ışık: ağız içi gibi koyu bir blok olarak okunmasın.
      this.r(o.cx - 3, ay - 2, 3, 1, b);
      this.r(o.cx + 1, ay - 2, 3, 1, b);
      this.r(o.cx - 4, ay - 1, 9, 1, b);
      this.r(o.cx - 3, ay - 2, 2, 1, acik(b, 0.22));
      this.p(o.cx + 3, ay - 1, koyu(b, 0.85));
    } else {
      // İnce, düz bıyık (uçları ağız köşesine inmez; asık ağız gibi okunmasın)
      this.r(o.cx - 4, ay - 2, 9, 1, b);
    }
  }

  // ---- Üst katman (bir kez): başlıklar ----

  private basOrtusu(): void {
    const o = this.o;
    if (o.baslik === 'kasket') {
      const c = o.baslikRenk;
      const k = koyu(c, 0.72);
      const ust = o.cy - o.ry - 2;
      for (let y = ust; y <= ust + 7; y++) {
        const w = o.rx + 1 - Math.max(0, 2 - (y - ust)) * 2;
        this.r(o.cx - w, y, w * 2 + 1, 1, y === ust ? k : c);
      }
      this.r(o.cx - o.rx + 1, ust + 2, 4, 1, koyu(c, 1.15));
      for (let y = ust + 3; y <= ust + 7; y++) for (let x = o.cx + 4; x <= o.cx + o.rx + 1; x++) if ((x + y) % 2 === 0) this.p(x, y, k);
      this.r(o.cx - o.rx - 2, ust + 8, o.rx * 2 + 5, 2, k);
      this.r(o.cx - o.rx - 1, ust + 10, o.rx * 2 + 3, 1, koyu(c, 0.5));
    } else if (o.baslik === 'sapka') {
      const c = o.baslikRenk;
      const k = koyu(c, 0.7);
      const ust = o.cy - o.ry - 6;
      this.r(o.cx - o.rx + 2, ust, o.rx * 2 - 3, 9, c);
      this.r(o.cx - o.rx + 2, ust + 1, 2, 6, acik(c, 0.12));
      this.r(o.cx + o.rx - 4, ust, 3, 7, k);
      this.r(o.cx - 2, ust, 4, 1, k);
      this.r(o.cx - o.rx + 2, ust + 7, o.rx * 2 - 3, 2, '#1f1c1a');
      this.r(o.cx - o.rx - 5, ust + 9, o.rx * 2 + 11, 2, k);
      this.r(o.cx - o.rx - 3, ust + 11, o.rx * 2 + 7, 1, koyu(c, 0.5));
    } else if (o.baslik === 'ortu') {
      // Yüzü çevreleyen kenar ve kıvrım çizgileri
      const k = koyu(o.baslikRenk, 0.7);
      for (let y = o.cy - o.ry - 2; y <= o.cy + o.ry + 2; y++)
        for (let x = o.cx - o.rx - 3; x <= o.cx + o.rx + 3; x++) {
          const dx = x - o.cx;
          const dy = y - (o.cy + 1);
          const ic = (dx * dx) / ((o.rx - 1) * (o.rx - 1)) + (dy * dy) / ((o.ry - 1) * (o.ry - 1));
          const dis = (dx * dx) / ((o.rx + 3) * (o.rx + 3)) + ((y - o.cy - 2) * (y - o.cy - 2)) / ((o.ry + 3) * (o.ry + 3));
          if (ic > 1 && dis <= 1 && y < o.cy + o.ry + 1) this.p(x, y, ic < 1.25 ? k : dx < -o.rx + 1 && dy < 0 && (x + y) % 2 === 0 ? acik(o.baslikRenk, 0.12) : o.baslikRenk);
        }
      for (let j = 0; j < 6; j++) {
        this.p(o.cx - o.rx - 1 + j, o.cy + o.ry + 4 + j, k);
        this.p(o.cx + o.rx + 1 - j, o.cy + o.ry + 4 + j, k);
      }
    }
  }

  // ---- Yüz çizgileri (her ifade değişiminde) ----

  /** Gözün kutusu: sol ve sağ göz için x başlangıcı, genişlik, üst satır, yükseklik. */
  private gozKutusu(d: YuzDurum): { sol: number; sag: number; w: number; y: number; h: number } {
    const o = this.o;
    const gy = o.cy - 1;
    const w = o.goz === 'kucuk' ? 3 : 4;
    let h = o.goz === 'iri' ? 3 : 2;
    let y = o.goz === 'iri' ? gy - 1 : gy;
    if (d.goz === 'iri' && h < 3) {
      h += 1;
      y -= 1;
    }
    if (d.goz === 'kisik') {
      y += 1;
      h = Math.max(1, h - 1);
    }
    return { sol: o.cx - 3 - w, sag: o.cx + 3, w, y, h };
  }

  private gozler(d: YuzDurum): void {
    const o = this.o;
    const tK = o.ten[2];
    const g = this.gozKutusu(d);
    for (const ex of [g.sol, g.sag]) {
      const sol = ex === g.sol;
      if (this.gozKapali) {
        this.r(ex, g.y + g.h - 1, g.w, 1, GOZ_BEBEK);
        this.r(ex, g.y + g.h - 2, g.w, 1, tK);
        continue;
      }
      this.r(ex, g.y, g.w, g.h, GOZ_AK);
      const pw = d.bebekKucuk ? 1 : 2;
      const merkez = ex + Math.floor((g.w - pw) / 2) + (sol && g.w === 4 && pw === 2 ? 1 : 0);
      const bx = Math.max(ex, Math.min(ex + g.w - pw, merkez + d.bakX));
      if (d.bakY > 0) this.r(bx, g.y + g.h - 1, pw, 1, GOZ_BEBEK);
      else {
        const ph = Math.min(2, g.h);
        this.r(bx, g.y + g.h - ph, pw, ph, GOZ_BEBEK);
      }
      // Üst kapak (kısık gözde ağır ve koyu); aşağı bakarken kapak iner
      this.r(ex, g.y - 1, g.w, 1, d.goz === 'kisik' ? koyu(tK, 0.78) : tK);
      if (d.bakY > 0 && g.h >= 2) {
        this.r(ex, g.y, g.w, 1, tK);
        this.r(ex, g.y - 1, g.w, 1, koyu(tK, 0.78));
      }
      // Yaşlıda dış köşede sarkık kapak
      if (o.yas === 'yasli') this.p(sol ? ex : ex + g.w - 1, g.y, tK);
      // İri açılmış gözde alt kapak
      if (d.goz === 'iri') this.r(ex, g.y + g.h, g.w, 1, tK);
      if (o.kirpik) this.p(sol ? ex - 1 : ex + g.w, g.y, KIRPIK);
    }
  }

  private gozluk(): void {
    const o = this.o;
    if (!o.gozluk) return;
    const gy = o.cy - 1;
    const c = o.gozlukRenk;
    for (const gx of [o.cx - 6, o.cx + 4]) this.cerceve(gx - 2, gy - 2, 6, 5, c);
    this.r(o.cx - 2, gy - 1, 4, 1, c);
    this.p(o.cx - 9, gy - 1, c);
    this.p(o.cx + 8, gy - 1, c);
  }

  private kaslar(d: YuzDurum): void {
    const o = this.o;
    const tK = o.ten[2];
    const kas = o.kir ? koyu(o.sac, 0.62) : koyu(o.sac, 0.55);
    const g = this.gozKutusu(d);
    const by = Math.min(g.y, o.cy - 1) - 3;
    const bas = o.kasTipi === 'gur' ? -1 : 0;
    // Kibar mizaçta kaş hep yumuşak kavisli (tohumdaki eğik ya da düz kaş somurtkan okunmasın).
    const kasBicim = this.mizac === 'kibar' ? 'kavisli' : o.kasBicim;
    for (const sol of [true, false]) {
      let onceki: number | undefined;
      for (let i = bas; i <= 4; i++) {
        // i=0 dış uç, i=4 iç uç (burna yakın)
        const t = Math.max(0, i) / 4;
        const bicim = kasBicim === 'kavisli' ? (i === 1 || i === 2 ? -1 : 0) : kasBicim === 'egik' ? (i <= 0 ? 1 : 0) : 0;
        const y = by + Math.round(d.kasDis + (d.kasIc - d.kasDis) * t) + bicim + (sol ? d.kasSol : d.kasSag);
        const x = sol ? o.cx - 8 + i : o.cx + 7 - i;
        this.p(x, y, kas);
        if (onceki !== undefined && Math.abs(y - onceki) > 1) this.p(x, (y + onceki) >> 1, kas);
        onceki = y;
        const kalin = o.kasTipi === 'gur' || (o.kasTipi === 'kalin' && i >= 1) || (d.kasKalin && i >= 2);
        if (kalin) this.p(x, y - 1, o.kasTipi === 'gur' && i <= 0 ? koyu(kas, 1.1) : kas);
      }
    }
    if (d.alin === 'catik') {
      this.r(o.cx - 2, by, 1, 2, tK);
      this.r(o.cx + 1, by, 1, 2, tK);
    } else if (d.alin === 'endise') {
      this.r(o.cx - 2, by - 2, 4, 1, tK);
      this.p(o.cx - 3, by - 1, tK);
      this.p(o.cx + 2, by - 1, tK);
    }
  }

  private kizarma(d: YuzDurum): void {
    const o = this.o;
    const t = o.ten[1];
    if (d.ofke > 0) {
      const c = karis(t, AL, d.ofke > 1 ? 0.5 : 0.36);
      const bolge = (x0: number, y0: number, w: number, h: number, tam: boolean): void => {
        for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (tam || (x + y) % 2 === 0) this.tenP(x, y, c);
      };
      bolge(o.cx - 10, o.cy + 2, 6, 5, false);
      bolge(o.cx + 4, o.cy + 2, 6, 5, false);
      if (d.ofke > 1) {
        bolge(o.cx - 9, o.cy + 3, 4, 2, true);
        bolge(o.cx + 5, o.cy + 3, 4, 2, true);
        bolge(o.cx - 6, o.cy - 10, 12, 3, false);
      }
    }
    if (d.kizar > 0) {
      for (const bx of [o.cx - 9, o.cx + 5]) {
        for (let i = 0; i < 5; i++) this.tenP(bx + i, o.cy + 4, AL);
        for (let i = 0; i < 5; i += 2) this.tenP(bx + i, o.cy + 5, AL);
        if (d.kizar > 1) for (let i = 1; i < 5; i += 2) this.tenP(bx + i, o.cy + 3, AL);
      }
    }
  }

  private agiz(d: YuzDurum): void {
    const o = this.o;
    const tK = o.ten[2];
    const x = o.cx;
    const ay = o.cy + 9;
    const w = o.agizW;
    const D = this.dudak;
    if (this.agizAcik) {
      // Konuşma ağzı: mizaca göre biçim
      const m = this.mizac;
      if (m === 'sinirli') {
        this.r(x - 3, ay, 7, 3, AGIZ_IC);
        this.r(x - 2, ay + 1, 5, 1, DIS);
        this.r(x - 3, ay, 7, 1, D);
        this.r(x - 2, ay + 2, 5, 1, D);
      } else if (m === 'telasli') {
        this.r(x - 2, ay, 5, 4, AGIZ_IC);
        this.r(x - 2, ay, 5, 1, D);
        this.r(x - 1, ay + 3, 3, 1, D);
      } else if (m === 'cekingen') {
        this.r(x - 1, ay, 3, 2, AGIZ_IC);
        this.r(x - 1, ay, 3, 1, D);
      } else if (m === 'kurnaz') {
        this.r(x - 1, ay, 5, 3, AGIZ_IC);
        this.r(x - 1, ay, 5, 1, D);
        this.r(x, ay + 2, 3, 1, D);
        this.p(x + 4, ay - 1, D);
      } else {
        this.r(x - 2, ay, 5, 3, AGIZ_IC);
        this.r(x - 1, ay + 2, 3, 1, D);
        this.r(x - 2, ay, 5, 1, D);
      }
      return;
    }
    switch (d.agiz) {
      case 'gulumse':
        // Hafif gülümseme: uçlar yukarı kıvrık, yanaklarda kıvrım
        this.r(x - w + 1, ay, 2 * w - 1, 1, D);
        this.p(x - w, ay - 1, D);
        this.p(x + w, ay - 1, D);
        this.p(x - w - 1, ay - 2, tK);
        this.p(x + w + 1, ay - 2, tK);
        break;
      case 'genis':
        // Gülümseme: uçlar yukarı, ortada dişler
        this.p(x - w - 1, ay - 1, D);
        this.p(x + w + 1, ay - 1, D);
        this.r(x - w, ay, 2 * w + 1, 1, D);
        this.r(x - w + 1, ay, 2 * w - 1, 1, DIS);
        this.r(x - w + 1, ay + 1, 2 * w - 1, 1, D);
        break;
      case 'sirit':
        // Yan gülüş: sağ uç yukarı, yanında gamze
        this.r(x - w, ay, 2 * w, 1, D);
        this.r(x + w, ay - 1, 2, 1, D);
        this.p(x + w + 2, ay - 2, D);
        this.p(x + w + 3, ay - 1, tK);
        this.p(x + w + 2, ay, tK);
        this.p(x - w - 1, ay + 1, tK);
        break;
      case 'siritGenis':
        this.r(x - w, ay, 2 * w + 1, 1, D);
        this.r(x, ay, w, 1, DIS);
        this.r(x, ay + 1, w, 1, D);
        this.p(x + w + 1, ay - 1, D);
        this.p(x + w + 2, ay, tK);
        break;
      case 'sikik':
        // Sıkılmış dudak: ince, koyu, uçlar aşağı; çenede gerginlik
        this.r(x - w - 1, ay, 2 * w + 3, 1, koyu(D, 0.8));
        this.p(x - w - 2, ay + 1, D);
        this.p(x + w + 2, ay + 1, D);
        this.p(x - 1, ay + 3, tK);
        this.p(x + 1, ay + 3, tK);
        break;
      case 'asik':
        // Asık: ortası yukarı, uçlar aşağı
        this.r(x - 2, ay, 5, 1, D);
        this.p(x - 3, ay + 1, D);
        this.p(x + 3, ay + 1, D);
        this.p(x - 4, ay + 2, D);
        this.p(x + 4, ay + 2, D);
        break;
      case 'kucukAsik':
        this.r(x - 1, ay, 3, 1, D);
        this.p(x - 2, ay + 1, D);
        this.p(x + 2, ay + 1, D);
        this.r(x - 1, ay + 1, 3, 1, DUDAK_ALT);
        break;
      case 'aralik':
        this.r(x - 2, ay, 5, 1, D);
        this.r(x - 1, ay + 1, 3, 1, AGIZ_IC);
        this.r(x - 1, ay + 2, 3, 1, D);
        break;
      case 'kucuk':
        this.r(x - 1, ay, 3, 1, D);
        break;
      case 'titrek':
        // Telaşlı kapalı dudak: hafif dalgalı çizgi
        this.r(x - 2, ay, 2, 1, D);
        this.p(x, ay + 1, D);
        this.r(x + 1, ay, 2, 1, D);
        break;
      case 'dalgali':
        this.r(x - 1, ay + 1, 4, 1, D);
        this.p(x + 3, ay, D);
        this.p(x - 2, ay, D);
        break;
      default:
        this.r(x - w, ay, 2 * w + 1, 1, D);
        if (o.dolgun) this.r(x - 1, ay + 1, 3, 1, DUDAK_ALT);
    }
  }

  /** Ter damlası (şakakta, koyu konturlu); telaşta alnın öbür yanında ikincisi. */
  private ter(d: YuzDurum): void {
    if (d.ter <= 0) return;
    const o = this.o;
    const x = o.cx + o.rx - 2;
    const y = o.cy - 9;
    this.p(x, y - 1, KONTUR);
    this.r(x - 1, y, 3, 1, KONTUR);
    this.r(x - 2, y + 1, 5, 3, KONTUR);
    this.r(x - 1, y + 4, 3, 1, KONTUR);
    this.p(x, y, TER);
    this.r(x - 1, y + 1, 3, 3, TER);
    this.p(x - 1, y + 1, '#e8f1f4');
    this.p(x + 1, y + 3, koyu(TER, 0.75));
    if (d.ter > 1) {
      // Yanaktan süzülen ikinci damla
      const x2 = o.cx + o.rx - 1;
      const y2 = o.cy - 2;
      this.p(x2, y2 - 1, KONTUR);
      this.r(x2 - 1, y2, 3, 3, KONTUR);
      this.r(x2, y2, 1, 2, TER);
    }
  }
}

/** Portrenin ekrandaki boyu. */
export const PORTRE_EKRAN = { w: PORTRE_W * PX, h: PORTRE_H * PX };
