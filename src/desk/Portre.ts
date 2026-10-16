// @beyan görsel
import * as Phaser from 'phaser';
import type { Ifade } from '../game/kisi';
import { KONTUR } from './palette';
import { PX, rastgele, Tuval } from './pixel';

/** Portre tuvali (sanat pikseli): göğüs hizasına kadar, gişe camının arkasında. */
export const PORTRE_W = 72;
export const PORTRE_H = 80;

/** Solgun palete uygun tonlar: [taban, gölge]. */
const TEN: [string, string][] = [
  ['#c4a58a', '#a6896f'],
  ['#b08e74', '#93735c'],
  ['#9a7a62', '#7f634e'],
  ['#cfb39b', '#b0957d'],
  ['#8a6a54', '#6f5443'],
];
const SAC = ['#2a2321', '#3d302a', '#5a4636', '#6e5c48', '#8f8a80', '#bdb7aa'];
const GIYSI = ['#4a4e58', '#5a4a40', '#3e4a40', '#5e5850', '#4c3e46', '#62573f', '#45505a'];
const GOMLEK = ['#c8c0ae', '#a9b0b2', '#bcae94'];
const KRAVAT = ['#6a3a34', '#3a4a5e', '#4d4a36'];
const ORTU = ['#6a5a6e', '#5a6a70', '#7a6a58', '#4e5a4a', '#86705f', '#5f5a72'];
const KASKET = ['#4a443e', '#3a3c40', '#5a4e40', '#4c4a3a'];
const SAPKA = ['#2e2a28', '#4a4038', '#3a3a3e'];
const GOZ_AK = '#d6cfc0';
const GOZ_BEBEK = '#1d191b';
const DUDAK = '#5e3c35';
const AGIZ_IC = '#2a1a18';
const TER = '#a9c6d6';
const AL = '#c4705e';
const DIS = '#e2dccd';

type Yuz = 'oval' | 'yuvarlak' | 'uzun' | 'kare';
type SacTipi = 'kisa' | 'kel' | 'uzun' | 'topuz' | 'yok';
type Baslik = 'kasket' | 'ortu' | 'sapka' | 'yok';
type Giysi = 'ceket' | 'kazak' | 'gomlek';

/** Tohumdan portre özellikleri (deterministik). */
interface Ozellik {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  yuz: Yuz;
  ten: [string, string];
  sac: string;
  sacTipi: SacTipi;
  baslik: Baslik;
  baslikRenk: string;
  biyik: boolean;
  sakal: boolean;
  gozluk: boolean;
  gozlukRenk: string;
  giysi: Giysi;
  giysiRenk: string;
  gomlek: string;
  kravat?: string;
  omuz: number;
}

function koyu(c: string, f: number): string {
  const n = parseInt(c.slice(1, 7), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function ozellik(tohum: number): Ozellik {
  const r = rastgele(tohum);
  const sec = <T,>(a: readonly T[]): T => a[Math.floor(r() * a.length)];
  const yuz = sec<Yuz>(['oval', 'yuvarlak', 'uzun', 'kare']);
  const rx = yuz === 'yuvarlak' ? 14 : yuz === 'kare' ? 13 : 12;
  const ry = yuz === 'uzun' ? 17 : yuz === 'yuvarlak' ? 15 : 16;
  const baslik = sec<Baslik>(['yok', 'yok', 'kasket', 'ortu', 'sapka', 'yok']);
  let sacTipi: SacTipi = baslik === 'ortu' ? 'yok' : sec<SacTipi>(['kisa', 'kisa', 'kel', 'uzun', 'topuz']);
  if (baslik !== 'yok' && (sacTipi === 'topuz' || sacTipi === 'uzun') && baslik !== 'ortu') sacTipi = 'kisa';
  // Bıyık ve sakal yalnızca kısa saçlı ya da kel portrelerde (örtü, uzun saç ve topuzla birlikte değil).
  const yuzKili = baslik !== 'ortu' && (sacTipi === 'kisa' || sacTipi === 'kel');
  const biyik = yuzKili && r() < 0.5;
  const sakal = yuzKili && r() < 0.3;
  const giysi = sec<Giysi>(['ceket', 'kazak', 'gomlek']);
  return {
    cx: 36 + Math.floor(r() * 3) - 1,
    cy: 36,
    rx,
    ry,
    yuz,
    ten: sec(TEN),
    sac: sec(SAC),
    sacTipi,
    baslik,
    baslikRenk: baslik === 'ortu' ? sec(ORTU) : baslik === 'kasket' ? sec(KASKET) : sec(SAPKA),
    biyik,
    sakal,
    gozluk: r() < 0.35,
    gozlukRenk: r() < 0.5 ? '#2a2624' : '#8a8478',
    giysi,
    giysiRenk: sec(GIYSI),
    gomlek: sec(GOMLEK),
    kravat: giysi === 'ceket' && r() < 0.6 ? sec(KRAVAT) : undefined,
    omuz: 28 + Math.floor(r() * 5),
  };
}

/**
 * Gişedeki mal sahibinin kodla çizilen piksel portresi (G17). Yüz biçimi, ten, saç, bıyık/sakal, gözlük,
 * başlık (kasket, örtü, şapka) ve giysi tohumdan gelir (aynı dosya, aynı kişi). İfadeler: nötr, gergin (ter
 * damlası), kızgın, mahcup (yanakta kızarma), sevinçli. Konuşurken ağız kıpırdar; ara sıra göz kırpar.
 * Gerçek bir kişinin taklidi değildir.
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

  constructor(
    private readonly scene: Phaser.Scene,
    tohum: number,
    x: number,
    y: number,
  ) {
    this.o = ozellik(tohum);
    this.t = new Tuval(scene, PORTRE_W, PORTRE_H, 'portre');
    this.ciz();
    this.img = this.t.goruntu(x, y).setOrigin(0);
    this.kirpmaKur();
    this.img.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.agizSaat?.remove();
      this.kirpSaat?.remove();
    });
  }

  setIfade(i: Ifade): void {
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
    } else if (this.agizAcik) {
      this.agizAcik = false;
      this.yenile();
    }
  }

  destroy(): void {
    this.img.destroy();
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

  // ---- Çizim ----

  private ciz(): void {
    const t = this.t;
    const o = this.o;
    t.ctx.clearRect(0, 0, PORTRE_W, PORTRE_H);
    const [ten, tenKoyu] = o.ten;

    // Uzun saç ve örtünün omza dökülen kısmı: başın arkasında.
    if (o.sacTipi === 'uzun')
      this.alan(
        (x, y) => {
          const dx = (x - o.cx) / (o.rx + 2);
          const dy = (y - o.cy) / (o.ry + 1);
          return y <= o.cy + o.ry + 10 && (y >= o.cy ? Math.abs(dx) <= 1 : dx * dx + dy * dy <= 1);
        },
        o.sac,
        koyu(o.sac, 0.8),
      );
    if (o.baslik === 'ortu') {
      this.alan(
        (x, y) => {
          const dx = x - o.cx;
          const dy = y - (o.cy + 2);
          return (dx * dx) / ((o.rx + 3) * (o.rx + 3)) + (dy * dy) / ((o.ry + 3) * (o.ry + 3)) <= 1 || (y >= o.cy + 4 && y <= 64 && Math.abs(dx) <= o.rx + 4 + (y - o.cy - 4) * 0.5);
        },
        o.baslikRenk,
        koyu(o.baslikRenk, 0.78),
      );
    }

    // Gövde ve boyun
    const govdeY = o.cy + o.ry + 3;
    const govde = (x: number, y: number): boolean => {
      if (y < govdeY) return false;
      const k = Math.min(1, (y - govdeY) / 10);
      return Math.abs(x - o.cx) <= 11 + (o.omuz - 11) * Math.sqrt(k);
    };
    this.alan((x, y) => Math.abs(x - o.cx) <= 4 && y >= o.cy + o.ry - 4 && y < govdeY + 2, ten, tenKoyu, 0.5);
    t.rect(o.cx - 4, govdeY - 2, 9, 2, tenKoyu);
    this.alan(govde, o.giysiRenk, koyu(o.giysiRenk, 0.78), 0.7);
    this.yaka(govdeY);

    // Baş (kulaklar dahil)
    const bas = (x: number, y: number): boolean => this.basIcinde(x, y);
    t.rect(o.cx - o.rx - 1, o.cy - 1, 2, 5, tenKoyu);
    t.rect(o.cx + o.rx, o.cy - 1, 2, 5, tenKoyu);
    this.alan(bas, ten, tenKoyu, 0.62);
    // Yanak ve çene gölgesi
    for (let y = o.cy + 6; y <= o.cy + o.ry; y++) for (let x = o.cx - o.rx; x <= o.cx + o.rx; x++) if (bas(x, y) && !bas(x, y + 2) && (x + y) % 2 === 0) t.px(x, y, tenKoyu);

    if (o.sacTipi !== 'yok') this.sac();
    if (o.sakal) this.sakal();
    this.yuz();
    this.basOrtusu();
    this.disCizgi();
    this.ifadeEkleri();
  }

  /** Başın içi (yüz biçimine göre; alt yarı çeneye doğru daralır). */
  private basIcinde(x: number, y: number): boolean {
    const o = this.o;
    const dy = (y - o.cy) / o.ry;
    const daral = o.yuz === 'kare' || o.yuz === 'yuvarlak' ? 0.08 : 0.2;
    const rx = o.rx * (1 - daral * Math.max(0, dy));
    const dx = (x - o.cx) / rx;
    const p = o.yuz === 'kare' ? 3 : 2;
    return Math.abs(dx) ** p + Math.abs(dy) ** p <= 1;
  }

  /** Şekli doldur: sağ yarıda gölge (seyrek nokta), kenarlarda koyu. */
  private alan(icinde: (x: number, y: number) => boolean, renk: string, golge: string, golgeEsik = 0.55): void {
    const t = this.t;
    let x0 = PORTRE_W;
    let x1 = 0;
    for (let y = 0; y < PORTRE_H; y++)
      for (let x = 0; x < PORTRE_W; x++)
        if (icinde(x, y)) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
        }
    const orta = x0 + (x1 - x0) * golgeEsik;
    for (let y = 0; y < PORTRE_H; y++)
      for (let x = 0; x < PORTRE_W; x++) {
        if (!icinde(x, y)) continue;
        const sag = x > orta;
        const kenar = !icinde(x + 1, y);
        t.px(x, y, kenar || (sag && (x + y) % 2 === 0) || (x > orta + 4 && sag) ? golge : renk);
      }
  }

  private yaka(govdeY: number): void {
    const t = this.t;
    const o = this.o;
    const g = koyu(o.giysiRenk, 0.7);
    if (o.giysi === 'ceket') {
      // V yaka: gömlek ve (varsa) kravat, iki yanda ceket yakası.
      for (let j = 0; j < 12; j++) {
        const w = Math.max(0, 5 - Math.floor(j / 2));
        t.rect(o.cx - w, govdeY + j, w * 2 + 1, 1, o.gomlek);
        t.px(o.cx - w - 1, govdeY + j, g).px(o.cx + w + 1, govdeY + j, g);
      }
      if (o.kravat) {
        t.rect(o.cx - 1, govdeY, 3, 2, o.kravat);
        t.rect(o.cx - 1, govdeY + 2, 3, 9, o.kravat).px(o.cx, govdeY + 11, o.kravat);
        t.px(o.cx + 1, govdeY + 4, koyu(o.kravat, 0.7)).px(o.cx + 1, govdeY + 7, koyu(o.kravat, 0.7));
      }
      for (let j = 0; j < 8; j++) t.px(o.cx - 8 + Math.floor(j / 2), govdeY + 2 + j, g).px(o.cx + 8 - Math.floor(j / 2), govdeY + 2 + j, g);
    } else if (o.giysi === 'kazak') {
      t.rect(o.cx - 6, govdeY, 13, 2, g);
      t.rect(o.cx - 5, govdeY + 2, 11, 1, koyu(o.giysiRenk, 0.85));
      for (let y = govdeY + 5; y < PORTRE_H; y += 3) for (let x = o.cx - 20; x < o.cx + 20; x += 4) t.px(x + (y % 2), y, koyu(o.giysiRenk, 0.88));
    } else {
      // Gömlek: sivri yaka uçları ve düğme hattı.
      t.rect(o.cx - 5, govdeY, 11, 2, o.gomlek);
      for (let j = 0; j < 4; j++) {
        t.rect(o.cx - 5 - j, govdeY + j, 3, 1, o.gomlek);
        t.rect(o.cx + 3 + j, govdeY + j, 3, 1, o.gomlek);
      }
      t.px(o.cx - 6, govdeY + 4, g).px(o.cx + 6, govdeY + 4, g);
      for (let y = govdeY + 3; y < PORTRE_H; y += 4) t.px(o.cx, y, g);
    }
  }

  private sac(): void {
    const t = this.t;
    const o = this.o;
    const koyuSac = koyu(o.sac, 0.75);
    const bas = (x: number, y: number): boolean => this.basIcinde(x, y);
    const hat = o.cy - Math.round(o.ry * 0.45);
    for (let y = o.cy - o.ry - 3; y <= o.cy + 4; y++)
      for (let x = o.cx - o.rx - 2; x <= o.cx + o.rx + 2; x++) {
        const icinde = bas(x, y) || bas(x, y + 2) || bas(x - 1, y + 1) || bas(x + 1, y + 1);
        if (!icinde) continue;
        const yan = Math.abs(x - o.cx) >= o.rx - 2 && y <= o.cy - 2;
        let dolu = o.sacTipi === 'kel' ? yan && y >= o.cy - 7 : y <= hat || yan;
        // Saç çizgisi biraz dalgalı
        if (o.sacTipi !== 'kel' && y === hat + 1 && Math.abs(x - o.cx) < o.rx - 3 && (x * 7) % 5 === 0) dolu = true;
        if (!dolu) continue;
        t.px(x, y, (x + y) % 3 === 0 || !bas(x, y + 1) ? koyuSac : o.sac);
      }
    if (o.sacTipi === 'topuz') t.daire(o.cx + 3, o.cy - o.ry - 3, 4, o.sac).daire(o.cx + 3, o.cy - o.ry - 3, 4, koyuSac, true);
    if (o.sacTipi === 'uzun') {
      // Yüzün iki yanında düşen saç
      t.rect(o.cx - o.rx - 1, o.cy - 4, 3, o.ry + 8, o.sac);
      t.rect(o.cx + o.rx - 1, o.cy - 4, 3, o.ry + 8, koyuSac);
    }
  }

  private sakal(): void {
    const t = this.t;
    const o = this.o;
    const c = koyu(o.sac, 0.9);
    for (let y = o.cy + 3; y <= o.cy + o.ry + 1; y++)
      for (let x = o.cx - o.rx; x <= o.cx + o.rx; x++) {
        if (!this.basIcinde(x, y)) continue;
        const agiz = y >= o.cy + 7 && y <= o.cy + 11 && Math.abs(x - o.cx) <= 4;
        const yanak = y < o.cy + 7 && Math.abs(x - o.cx) < o.rx - 3;
        if (agiz || yanak) continue;
        t.px(x, y, (x + y) % 2 === 0 ? c : koyu(c, 0.85));
      }
  }

  private yuz(): void {
    const t = this.t;
    const o = this.o;
    const [, tenKoyu] = o.ten;
    const gy = o.cy - 1;
    const sol = o.cx - 6;
    const sag = o.cx + 4;
    // Gözler (kızgında kısık, mahcupta aşağı bakar)
    const kisik = this.ifade === 'kizgin';
    const asagi = this.ifade === 'mahcup';
    for (const gx of [sol, sag]) {
      if (this.gozKapali) {
        t.rect(gx - 1, gy + 1, 4, 1, GOZ_BEBEK);
        continue;
      }
      t.rect(gx - 1, gy, 4, 2, GOZ_AK);
      const bx = gx + (gx === sol ? 1 : 0);
      if (asagi) t.rect(bx, gy + 1, 2, 1, GOZ_BEBEK);
      else t.rect(bx, gy, 2, 2, GOZ_BEBEK);
      t.rect(gx - 1, gy - 1, 4, 1, tenKoyu);
      if (kisik) t.rect(gx - 1, gy, 4, 1, tenKoyu);
    }
    // Kaşlar (ifadeye göre eğim; saçtan koyu, tenle karışmasın)
    const kas = koyu(o.sac, 0.55);
    const egim = this.ifade === 'kizgin' ? 1 : this.ifade === 'gergin' || this.ifade === 'mahcup' ? -1 : 0;
    const kasY = gy - (this.ifade === 'sevincli' ? 4 : 3);
    for (let i = 0; i < 5; i++) {
      // i=0 dış uç, i=4 iç uç (burna yakın)
      const d = Math.round((i / 4) * 2) * egim;
      t.px(sol - 2 + i, kasY + d, kas);
      t.px(sag + 3 - i, kasY + d, kas);
      if (this.ifade === 'kizgin' && i >= 2) t.px(sol - 2 + i, kasY + d - 1, kas).px(sag + 3 - i, kasY + d - 1, kas);
    }
    // Burun
    t.rect(o.cx, gy + 3, 1, 3, tenKoyu);
    t.px(o.cx - 1, gy + 6, tenKoyu).px(o.cx + 1, gy + 6, tenKoyu);
    // Bıyık
    const ay = o.cy + 9;
    if (o.biyik) {
      const b = koyu(o.sac, 0.7);
      t.rect(o.cx - 3, ay - 2, 7, 2, b);
      t.px(o.cx - 4, ay - 1, b).px(o.cx + 4, ay - 1, b);
    }
    // Ağız
    const x = o.cx;
    if (this.agizAcik) {
      t.rect(x - 2, ay, 5, 3, AGIZ_IC);
      t.rect(x - 1, ay + 2, 3, 1, DUDAK);
      t.rect(x - 2, ay, 5, 1, DUDAK);
      return;
    }
    switch (this.ifade) {
      case 'sevincli':
        // Gülümseme: uçlar yukarı, ortada dişler
        t.px(x - 4, ay - 1, DUDAK).px(x + 4, ay - 1, DUDAK);
        t.rect(x - 3, ay, 7, 1, DUDAK);
        t.rect(x - 2, ay, 5, 1, DIS);
        t.rect(x - 2, ay + 1, 5, 1, DUDAK);
        break;
      case 'kizgin':
        // Asık: ortası yukarı, uçlar aşağı
        t.rect(x - 2, ay, 5, 1, DUDAK);
        t.px(x - 3, ay + 1, DUDAK).px(x + 3, ay + 1, DUDAK);
        t.px(x - 4, ay + 2, DUDAK).px(x + 4, ay + 2, DUDAK);
        break;
      case 'gergin':
        // Sıkılmış dişler
        t.rect(x - 4, ay - 1, 9, 4, DUDAK);
        t.rect(x - 3, ay, 7, 2, DIS);
        for (let i = -2; i <= 2; i += 2) t.px(x + i, ay, AGIZ_IC).px(x + i, ay + 1, AGIZ_IC);
        break;
      case 'mahcup':
        t.rect(x - 1, ay + 1, 4, 1, DUDAK);
        t.px(x + 3, ay, DUDAK);
        break;
      default:
        t.rect(x - 2, ay, 5, 1, DUDAK);
    }
  }

  private basOrtusu(): void {
    const t = this.t;
    const o = this.o;
    if (o.baslik === 'kasket') {
      const c = o.baslikRenk;
      const k = koyu(c, 0.72);
      const ust = o.cy - o.ry - 2;
      for (let y = ust; y <= ust + 7; y++) {
        const w = o.rx + 1 - Math.max(0, 2 - (y - ust)) * 2;
        t.rect(o.cx - w, y, w * 2 + 1, 1, y === ust ? k : c);
      }
      t.rect(o.cx - o.rx + 1, ust + 2, 4, 1, koyu(c, 1.15));
      t.rect(o.cx - o.rx - 2, ust + 8, o.rx * 2 + 5, 2, k);
      t.rect(o.cx - o.rx - 1, ust + 10, o.rx * 2 + 3, 1, koyu(c, 0.5));
    } else if (o.baslik === 'sapka') {
      const c = o.baslikRenk;
      const k = koyu(c, 0.7);
      const ust = o.cy - o.ry - 6;
      t.rect(o.cx - o.rx + 2, ust, o.rx * 2 - 3, 9, c);
      t.rect(o.cx - 2, ust, 4, 1, k);
      t.rect(o.cx - o.rx + 2, ust + 7, o.rx * 2 - 3, 2, '#1f1c1a');
      t.rect(o.cx - o.rx - 5, ust + 9, o.rx * 2 + 11, 2, k);
      t.rect(o.cx - o.rx - 3, ust + 11, o.rx * 2 + 7, 1, koyu(c, 0.5));
    } else if (o.baslik === 'ortu') {
      // Yüzü çevreleyen kenar ve kıvrım çizgileri
      const k = koyu(o.baslikRenk, 0.7);
      for (let y = o.cy - o.ry - 2; y <= o.cy + o.ry + 2; y++)
        for (let x = o.cx - o.rx - 3; x <= o.cx + o.rx + 3; x++) {
          const dx = x - o.cx;
          const dy = y - (o.cy + 1);
          const ic = (dx * dx) / ((o.rx - 1) * (o.rx - 1)) + (dy * dy) / ((o.ry - 1) * (o.ry - 1));
          const dis = (dx * dx) / ((o.rx + 3) * (o.rx + 3)) + ((y - o.cy - 2) * (y - o.cy - 2)) / ((o.ry + 3) * (o.ry + 3));
          if (ic > 1 && dis <= 1 && y < o.cy + o.ry + 1) t.px(x, y, ic < 1.25 ? k : o.baslikRenk);
        }
      for (let j = 0; j < 6; j++) t.px(o.cx - o.rx - 1 + j, o.cy + o.ry + 4 + j, k).px(o.cx + o.rx + 1 - j, o.cy + o.ry + 4 + j, k);
    }
    if (o.gozluk) {
      const gy = o.cy - 1;
      const c = o.gozlukRenk;
      for (const gx of [o.cx - 6, o.cx + 4]) t.frame(gx - 2, gy - 1, 6, 4, c);
      t.rect(o.cx - 2, gy, 3, 1, c);
      t.px(o.cx - 7, gy, c).px(o.cx + 7, gy, c);
    }
  }

  /** Bütün figürün çevresine koyu kontur (buzlu cam arkasında okunsun). */
  private disCizgi(): void {
    const t = this.t;
    const veri = t.ctx.getImageData(0, 0, PORTRE_W, PORTRE_H).data;
    const dolu = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < PORTRE_W && y < PORTRE_H && veri[(y * PORTRE_W + x) * 4 + 3] > 0;
    const kontur: [number, number][] = [];
    for (let y = 0; y < PORTRE_H; y++)
      for (let x = 0; x < PORTRE_W; x++) if (!dolu(x, y) && (dolu(x - 1, y) || dolu(x + 1, y) || dolu(x, y - 1) || dolu(x, y + 1))) kontur.push([x, y]);
    for (const [x, y] of kontur) t.px(x, y, KONTUR);
  }

  private ifadeEkleri(): void {
    const t = this.t;
    const o = this.o;
    if (this.ifade === 'gergin') {
      // Ter damlası (şakakta), koyu konturlu
      const x = o.cx + o.rx - 2;
      const y = o.cy - 9;
      t.px(x, y - 1, KONTUR).rect(x - 1, y, 3, 1, KONTUR).rect(x - 2, y + 1, 5, 3, KONTUR).rect(x - 1, y + 4, 3, 1, KONTUR);
      t.px(x, y, TER).rect(x - 1, y + 1, 3, 3, TER).px(x - 1, y + 1, '#e8f1f4').px(x + 1, y + 3, koyu(TER, 0.75));
    }
    if (this.ifade === 'mahcup') {
      for (const bx of [o.cx - 9, o.cx + 5]) {
        t.rect(bx, o.cy + 4, 5, 1, AL);
        for (let i = 0; i < 5; i += 2) t.px(bx + i, o.cy + 5, AL);
      }
    }
    if (this.ifade === 'kizgin') {
      // Alında gerginlik çizgisi
      t.rect(o.cx - 1, o.cy - 6, 3, 1, koyu(o.ten[0], 0.78));
    }
  }
}

/** Portrenin ekrandaki boyu. */
export const PORTRE_EKRAN = { w: PORTRE_W * PX, h: PORTRE_H * PX };
