import type { Bina } from './building';
import { Rng } from './rng';
import { TUNING } from './tuning';

/**
 * Saha testi (G19): Schmidt çekici (geri tepme çekici) okumaları ve tahmini beton dayanımı. Saf TS, Phaser yok.
 * Okumalar (oyun tohumu, dosya) ikilisinden deterministik: oyuncu nereye vurursa vursun geçerli okumalar aynı
 * sırayla gelir (adalet denetimi aynı sonucu bulur). Sıva ya da çatlak üstüne vurulan okuma geçersizdir, sayılmaz.
 */

export interface SahaSonucu {
  /** Geçerli okumalar (R), vurulma sırasıyla. */
  okumalar: number[];
  /** Ortalama R (bir ondalık). */
  ortR: number;
  /** Tahmini dayanım (MPa, tamsayı). */
  mpa: number;
  /** ± pay (MPa). */
  pay: number;
}

/** Vurulan yüzey: temiz beton, sıva yaması ya da çatlak (ve çevresi). */
export type SahaYuzey = 'temiz' | 'siva' | 'catlak';

/** FNV-1a: dizgiden 32 bit tohum. */
function ozet(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(tohum: number, bina: Bina, anahtar: string): Rng {
  return new Rng((ozet(`${bina.id}:saha:${anahtar}`) ^ Math.imul(tohum >>> 0, 0x27d4eb2f)) >>> 0);
}

/** Dönüşüm tablosunda doğrusal ara değer (uçlarda dışa uzatılır). x sütunu, y sütunu. */
function ara(x: number, tablo: readonly (readonly [number, number])[], ters: boolean): number {
  const p = tablo.map(([r, m]) => (ters ? [m, r] : [r, m]));
  let i = 0;
  while (i < p.length - 2 && x > p[i + 1][0]) i++;
  const [x0, y0] = p[i];
  const [x1, y1] = p[i + 1];
  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
}

/** Ortalama R → tahmini dayanım (MPa). */
export function rdenMpa(r: number): number {
  return ara(r, TUNING.saha.donusum, false);
}

/** Dayanım (MPa) → beklenen ortalama R. */
export function mpadanR(mpa: number): number {
  return ara(mpa, TUNING.saha.donusum, true);
}

const bir = (v: number): number => Math.round(v * 10) / 10;

/**
 * Saha testinin sonucu: TUNING.saha.okuma kadar geçerli okuma, ortalaması ve tahmini dayanım. Tahmin binanın
 * gerçek dayanımına yakın ve eşiğin (TUNING.betonEsikMpa) hep aynı yanında.
 */
export function sahaSonucu(tohum: number, bina: Bina): SahaSonucu {
  const S = TUNING.saha;
  const esik = TUNING.betonEsikMpa;
  const gercek = bina.gercek.betonMpa;
  const r = rng(tohum, bina, 'okuma');
  const hedef = mpadanR(gercek);
  const n = S.okuma;
  // Gürültü sıfır ortalamalı (ortalama hedefte kalsın), üstüne en çok ±sapma kayma.
  const ham = Array.from({ length: n }, () => r.int(-S.gurultu, S.gurultu));
  const kayma = r.int(-S.sapma, S.sapma);
  const tabanR = Math.round(hedef);
  const fark = n * (tabanR + kayma) - ham.reduce((a, b) => a + tabanR + b, 0);
  // Farkı okumalara tek tek dağıt (tamsayı kalsın).
  const okumalar = ham.map((g) => tabanR + g);
  for (let k = 0; k < Math.abs(fark); k++) okumalar[k % n] += Math.sign(fark);
  let ortR = bir(okumalar.reduce((a, b) => a + b, 0) / n);
  let mpa = Math.round(rdenMpa(ortR));
  // Adalet: tahmin eşiğin gerçek dayanımla aynı yanında (kayma eşiği aşırırsa kaymasız; yine aşarsa sınıra).
  if (mpa < esik !== gercek < esik) {
    const d = n * tabanR - okumalar.reduce((a, b) => a + b, 0);
    for (let k = 0; k < Math.abs(d); k++) okumalar[k % n] += Math.sign(d);
    ortR = bir(okumalar.reduce((a, b) => a + b, 0) / n);
    mpa = Math.round(rdenMpa(ortR));
    if (mpa < esik !== gercek < esik) mpa = gercek < esik ? esik - 1 : esik;
  }
  const pay = Math.max(S.payEn, Math.round(mpa * S.payOran));
  return { okumalar, ortR, mpa, pay };
}

/** i. geçersiz okumanın gösterilen değeri (sıvada düşük, çatlakta tutarsız düşük); sayılmaz. */
export function gecersizOkuma(tohum: number, bina: Bina, i: number, yuzey: Exclude<SahaYuzey, 'temiz'>): number {
  const S = TUNING.saha;
  const r = rng(tohum, bina, `gecersiz:${i}`);
  const hedef = mpadanR(bina.gercek.betonMpa);
  const v = yuzey === 'siva' ? hedef * S.siva + r.int(-2, 2) : hedef + S.catlak + r.int(-4, 4);
  return Math.max(10, Math.round(v));
}
