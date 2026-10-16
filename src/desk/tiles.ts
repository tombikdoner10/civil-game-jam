// @beyan görsel
import type * as Phaser from 'phaser';
import type { Catlak } from '../game/building';
import { CAM, KONTUR, RAMPA, type RampaAdi } from './palette';

/** assets.ts'de yüklenen Kenney Tiny Town karo tablosu (16×16, aralıksız, 12 sütun). */
export const TT_KEY = 'tiny-town';
const T = 16;
const SUTUN = 12;

/** Paketteki taş (mavi-gri) tonları, koyudan açığa rampa sırası. */
const TAS: Record<string, number> = {
  '#262b44': 0,
  '#52607c': 1,
  '#51607d': 1,
  '#5a6988': 2,
  '#8b9bb4': 3,
  '#8c9cb5': 3,
  '#c0cbdc': 4,
  '#c1ccdd': 4,
};
/** Kahve, turuncu ve kırmızı tonlar. */
const KAHVE: Record<string, number> = {
  '#763b36': 0,
  '#773833': 0,
  '#bd6c4a': 1,
  '#be6c49': 1,
  '#c34b35': 1,
  '#cf8254': 2,
  '#e38628': 2,
  '#e84537': 2,
  '#e94334': 2,
  '#eaa56c': 3,
  '#eba66c': 3,
  '#f28462': 3,
  '#ff706d': 3,
  '#fdbe53': 3,
  '#fcbc8f': 4,
  '#fec99c': 4,
};
const YESIL: Record<string, number> = { '#479f4a': 1, '#65a556': 2, '#84c669': 3, '#8bd87d': 4 };
const DIGER: Record<string, string> = {
  '#3f2631': KONTUR,
  '#3d212d': KONTUR,
  '#ffffff': '#d6d0c0',
  '#009adc': '#3e5a66',
  '#76e4ff': '#8aa2a8',
};

/** Pencere karoları: iç cam alanı ayrı boyanır (pakette cam ile duvar aynı ton). */
const PENCERE = [84, 88];

const hex = (r: number, g: number, b: number): string =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

function parse(c: string): [number, number, number] {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}

const onbellek = new Map<string, HTMLCanvasElement>();

/**
 * Karo tablosunun palete boyanmış kopyası. taş: mavi-gri tonların rampası, kahve: kahve-kırmızıların.
 * Çalışma anında piksel piksel renk eşleme (paketin rengi değiştirildi; beyanda yazılı).
 */
export function boyaliTablo(scene: Phaser.Scene, tas: RampaAdi, kahve: RampaAdi): HTMLCanvasElement {
  const anahtar = `${tas}/${kahve}`;
  const var_ = onbellek.get(anahtar);
  if (var_) return var_;
  const src = scene.textures.get(TT_KEY).getSourceImage() as HTMLImageElement;
  const cv = document.createElement('canvas');
  cv.width = src.width;
  cv.height = src.height;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2d bağlam yok');
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, cv.width, cv.height);
  const d = img.data;
  const rT = RAMPA[tas];
  const rK = RAMPA[kahve];
  for (let y = 0; y < cv.height; y++)
    for (let x = 0; x < cv.width; x++) {
      const i = (y * cv.width + x) * 4;
      if (d[i + 3] === 0) continue;
      const c = hex(d[i], d[i + 1], d[i + 2]);
      let yeni: string;
      const karo = Math.floor(y / T) * SUTUN + Math.floor(x / T);
      const lx = x % T;
      const ly = y % T;
      const camIci = PENCERE.includes(karo) && lx >= 5 && lx <= 10 && ly >= 5 && ly <= 10;
      if (camIci && (c in TAS || c in KAHVE)) {
        const L = (TAS[c] ?? KAHVE[c] ?? 2) >= 3;
        yeni = ly <= 6 ? CAM.acik : L ? CAM.acik : CAM.koyu;
      } else if (c in TAS) yeni = rT[TAS[c]];
      else if (c in KAHVE) yeni = rK[KAHVE[c]];
      else if (c in YESIL) yeni = RAMPA.zeytin[YESIL[c]];
      else yeni = DIGER[c] ?? c;
      const [r, g, b] = parse(yeni);
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
  ctx.putImageData(img, 0, 0);
  onbellek.set(anahtar, cv);
  return cv;
}

function karo(ctx: CanvasRenderingContext2D, tablo: HTMLCanvasElement, id: number, x: number, y: number, sy = 0, sh = T): void {
  ctx.drawImage(tablo, (id % SUTUN) * T, Math.floor(id / SUTUN) * T + sy, T, sh, x, y + sy, T, sh);
}

// ---- Cephe ----

export const CEPHE_W = 112;
const CATI_H = 12;
const KAT_H = 16;
/** Zemin kat (dükkân) üst katlardan yüksek: vitrin ve tabela sığsın. 9 kat: 12 + 8×16 + 24 = 164. */
export const ZEMIN_H = 24;

export function cepheH(ustKat: number): number {
  return CATI_H + KAT_H * ustKat + ZEMIN_H;
}

export interface CepheSecim {
  stil: 'siva' | 'tugla';
  duvar: RampaAdi;
  cati: 'arduaz' | 'kiremit';
  /** İç 5 karo için pencere maskesi (1 = pencere). */
  desen: number;
}

export function cepheSecimi(rnd: () => number): CepheSecim {
  const desenler = [0b11011, 0b10101, 0b11111, 0b01110, 0b11011];
  const duvarlar: RampaAdi[] = ['beton', 'bej', 'yesil', 'pembe'];
  const stil = rnd() < 0.75 ? 'siva' : 'tugla';
  return {
    stil,
    duvar: stil === 'tugla' ? 'tugla' : duvarlar[Math.floor(rnd() * duvarlar.length)],
    cati: rnd() < 0.6 ? 'arduaz' : 'kiremit',
    desen: desenler[Math.floor(rnd() * desenler.length)],
  };
}

export interface CepheVeri {
  /** Zemin kat dahil toplam kat. */
  kat: number;
  kolon: number;
  vitrin: readonly number[];
  catlak: Catlak;
  secim: CepheSecim;
  /** Akşam: bazı pencerelerde ışık yanar. */
  aksam?: boolean;
  /** En üstteki kaç kat sonradan eklenmiş (sıvasız, farklı malzeme): kaçak kat ilk bakışta seçilsin. */
  ekKat?: number;
  rnd: () => number;
}

export interface CepheDuzen {
  w: number;
  h: number;
  /** Üst katların dikey aralığı (cephe içinde). */
  katY0: number;
  katY1: number;
  zeminY: number;
  catlak: { x: number; y: number; w: number; h: number };
}

/**
 * Bir apartman cephesini (x,y sol üst) Tiny Town karolarından kurar; zemin kat kolonları, vitrin
 * ve çatlak kodla çizilir. Ölçüler sanat pikseli (karo 16 px).
 */
export function cepheCiz(scene: Phaser.Scene, ctx: CanvasRenderingContext2D, x0: number, y0: number, v: CepheVeri): CepheDuzen {
  const s = v.secim;
  const duvar = s.stil === 'tugla' ? boyaliTablo(scene, 'beton', 'tugla') : boyaliTablo(scene, s.duvar, 'cerceve');
  const catiT = s.cati === 'arduaz' ? boyaliTablo(scene, 'arduaz', 'cerceve') : boyaliTablo(scene, 'beton', 'kiremit');
  const rd = s.stil === 'tugla' ? RAMPA.tugla : RAMPA[s.duvar];
  const ust = Math.max(0, v.kat - 1);
  const n = 7;
  const fill = (x: number, y: number, w: number, h: number, c: string): void => {
    ctx.fillStyle = c;
    ctx.fillRect(x0 + x, y0 + y, w, h);
  };

  // Çatı: üst karonun üst yarısı + alt karonun saçak kısmı.
  const [ustSol, ustOrta, ustSag, altSol, altOrta, altSag] = s.cati === 'arduaz' ? [48, 49, 50, 60, 61, 62] : [52, 53, 54, 64, 65, 66];
  for (let i = 0; i < n; i++) {
    const a = i === 0 ? ustSol : i === n - 1 ? ustSag : ustOrta;
    const b = i === 0 ? altSol : i === n - 1 ? altSag : altOrta;
    ctx.drawImage(catiT, (a % SUTUN) * T, Math.floor(a / SUTUN) * T, T, 6, x0 + i * T, y0, T, 6);
    ctx.drawImage(catiT, (b % SUTUN) * T, Math.floor(b / SUTUN) * T + 10, T, 6, x0 + i * T, y0 + 6, T, 6);
  }

  // Üst katlar. Sonradan eklenen katlar ters malzemeyle (sıvalıysa tuğla, tuğlaysa çıplak beton).
  const ek = Math.min(ust, v.ekKat ?? 0);
  const ekTablo = s.stil === 'tugla' ? boyaliTablo(scene, 'beton', 'cerceve') : boyaliTablo(scene, 'beton', 'tugla');
  for (let k = 0; k < ust; k++) {
    const y = CATI_H + k * KAT_H;
    const kacak = k < ek;
    const tugla = kacak ? s.stil !== 'tugla' : s.stil === 'tugla';
    const [sol, duz, sag, pen] = tugla ? [72, 73, 75, 84] : [76, 77, 79, 88];
    const tablo = kacak ? ekTablo : duvar;
    for (let i = 0; i < n; i++) {
      let id = duz;
      if (i === 0) id = sol;
      else if (i === n - 1) id = sag;
      else if ((s.desen >> (i - 1)) & 1) id = pen;
      karo(ctx, tablo, id, x0 + i * T, y0 + y);
      if (id === pen && v.aksam && v.rnd() < 0.3) {
        fill(i * T + 5, y + 5, 6, 6, v.rnd() < 0.5 ? CAM.yanik : CAM.yanikKoyu);
        fill(i * T + 7, y + 5, 2, 6, KONTUR);
      }
    }
    // Cephe boyunca koyu çizgi ve üstünde açık şerit: katlar tek tek sayılsın.
    fill(0, y + KAT_H - 1, CEPHE_W, 1, rd[0]);
    fill(1, y + KAT_H - 2, CEPHE_W - 2, 1, rd[4]);
  }

  // Zemin kat (kodla): kiriş, kolonlar, bölmeler, vitrin. Zemin kat da bir kattır (ruhsattaki sayıya dahil).
  const zy = CATI_H + ust * KAT_H;
  fill(0, zy, CEPHE_W, ZEMIN_H, KONTUR);
  fill(1, zy, CEPHE_W - 2, 1, rd[4]);
  fill(1, zy + 1, CEPHE_W - 2, 2, rd[3]);
  fill(1, zy + 3, CEPHE_W - 2, 1, rd[1]);
  const ic = '#2a2526';
  const icY = zy + 4;
  const icH = ZEMIN_H - 5;
  fill(2, icY, CEPHE_W - 4, icH, ic);
  const kw = 5;
  const kx = (i: number): number => 2 + Math.round((i * (CEPHE_W - 4 - kw)) / Math.max(1, v.kolon - 1));
  // Normal bölmeler: kepenk çizgileri.
  for (let i = 0; i < v.kolon - 1; i++) {
    const a = kx(i) + kw;
    const b = kx(i + 1);
    for (let yy = icY + 1; yy < zy + ZEMIN_H - 1; yy += 2) fill(a + 1, yy, b - a - 2, 1, '#3a3433');
  }
  // Vitrin: kesilen kolonun yeri dahil iki bölmeyi kaplayan geniş cam ve üstünde parlak tabela.
  // Kesik kolondan iz kalmaz: fotoğraftaki tam boy kolon sayısı projedekinden eksik görünür.
  for (const i of v.vitrin) {
    const a = i > 0 ? kx(i - 1) + kw : 2;
    const b = i < v.kolon - 1 ? kx(i + 1) : CEPHE_W - 2;
    const w = b - a;
    // Tabela
    fill(a, icY, w, 6, KONTUR);
    fill(a + 1, icY + 1, w - 2, 4, '#c79a3a');
    fill(a + 1, icY + 1, w - 2, 1, '#e2bd5e');
    for (let xx = a + 3; xx < b - 3; xx += 4) fill(xx, icY + 2, 2, 2, '#5e4520');
    // Cam
    const cy0 = icY + 6;
    const ch = zy + ZEMIN_H - 1 - cy0;
    fill(a, cy0, w, ch, KONTUR);
    fill(a + 1, cy0 + 1, w - 2, ch - 2, '#9fc8cb');
    fill(a + 1, cy0 + 1, w - 2, 2, '#c6e2e0');
    fill(a + 1, cy0 + ch - 4, w - 2, 3, '#77a2a6');
    for (let d = 0; d < ch - 3; d++) {
      const hx = a + 3 + d;
      if (hx < b - 2) fill(hx, cy0 + ch - 3 - d, 1, 1, '#eef6f2');
      const hx2 = a + 6 + d;
      if (hx2 < b - 2 && d < ch - 6) fill(hx2, cy0 + ch - 3 - d, 1, 1, '#d8eae6');
    }
  }
  // Kolonlar (tam boy, kirişten döşemeye).
  for (let i = 0; i < v.kolon; i++) {
    if (v.vitrin.includes(i)) continue;
    const x = kx(i);
    fill(x, icY, kw, icH, KONTUR);
    fill(x + 1, icY, kw - 2, icH, rd[3]);
    fill(x + 1, icY, 1, icH, rd[4]);
  }
  fill(0, zy + ZEMIN_H - 1, CEPHE_W, 1, KONTUR);

  // Çatlak: en alttaki üst katta, duvar üstünde.
  const cy = zy - KAT_H + 1;
  let duvarI = 3;
  for (let i = 1; i <= 5; i++)
    if (!((s.desen >> (i - 1)) & 1)) {
      duvarI = i;
      break;
    }
  const ox = duvarI * T;
  const catlak = { x: ox, y: cy, w: 16, h: 13 };
  if (v.catlak === 'capraz') {
    const c = KONTUR;
    for (let t = 0; t <= 11; t++) {
      fill(ox + 1 + t, cy + t, 2, 1, c);
      fill(ox + 13 - t, cy + t, 2, 1, c);
    }
    fill(ox + 5, cy + 1, 1, 2, c);
    fill(ox + 11, cy + 9, 2, 1, c);
  } else if (v.catlak === 'kilcal') {
    const pts = [
      [74, cy + 3],
      [75, cy + 4],
      [75, cy + 5],
      [76, cy + 6],
      [76, cy + 7],
      [77, cy + 8],
    ];
    for (const [px, py] of pts) fill(px, py, 1, 1, rd[1]);
    catlak.x = 70;
  }

  return { w: CEPHE_W, h: cepheH(ust), katY0: CATI_H, katY1: zy, zeminY: zy, catlak };
}
