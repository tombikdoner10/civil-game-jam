// @beyan görsel
import * as Phaser from 'phaser';
import { FONT } from '../config';
import { gecerliRuhsat, type Belgeler, type BelgeTuru, type Bina, type Zemin } from '../game/building';
import { tarih } from '../game/diyalog';
import { TUNING } from '../game/tuning';
import type { GetirilenRapor } from '../game/kisi';
import { DocumentCard } from './DocumentCard';
import { KONTUR, PAL } from './palette';
import { dizgiTohum, PX, rastgele, snap, Tuval } from './pixel';
import { cepheCiz, cepheH, cepheSecimi, CEPHE_W, ZEMIN_H } from './tiles';
import { binaSecimi } from './Window';

const ZEMIN_ADI: Record<Zemin, string> = { saglam: 'Sağlam', orta: 'Orta', sivilasma: 'Sıvılaşma riski' };
const BASLIK: Record<BelgeTuru, string> = {
  ruhsat: 'Ruhsat',
  foto: 'Fotoğraf',
  proje: 'Proje özeti',
  vaziyet: 'Vaziyet planı',
  karot: 'Karot sonucu',
  zemin: 'Zemin etüdü',
};
const ust = (s: string): string => s.toLocaleUpperCase('tr-TR');

/** Masadaki dizilim sırası. */
export const SIRA: BelgeTuru[] = ['foto', 'ruhsat', 'proje', 'vaziyet', 'karot', 'zemin'];

/** Kart boyları (ekran pikseli, 8'in katı). */
export const BOY: Record<BelgeTuru, [number, number]> = {
  ruhsat: [376, 320],
  foto: [304, 416],
  proje: [392, 240],
  vaziyet: [392, 312],
  karot: [328, 224],
  zemin: [328, 248],
};

/** Vaziyet planının çizim yüksekliği (sanat pikseli); altındaki şeritte ada / parsel. */
const PLAN_H = 72;
/** Gişeden getirilen rapor kartının yüksekliği (ekran; ada / parsel satırı için normal karttan uzun). */
const RAPOR_H = 264;
/** Elle düzeltme: daksil rengi ve tükenmez kalem mavisi (G17a raporu ve G17b ruhsatı). */
const DAKSIL = '#eeeadb';
const KALEM = '#2f3f78';

/**
 * gun: masadaki gün. Ada / parsel ve imza satırları kuralları gelene kadar gösterilmez (gün 1 sade; G18):
 * imza TUNING.belgeHile.imzaGun, ada / parsel elleBaskaGun. Veri değişmez, yalnızca çizilmez.
 */
type Ctx = { s: Phaser.Scene; c: DocumentCard; b: Belgeler; bina: Bina; t: Tuval; rnd: () => number; gun: number };
const adaGorunur = (k: Ctx): boolean => k.gun >= TUNING.belgeHile.elleBaskaGun;
const imzaGorunur = (k: Ctx): boolean => k.gun >= TUNING.belgeHile.imzaGun;

/** Sanat pikseli koordinatını kart içi ekran koordinatına çevirir. */
const X = (c: DocumentCard, a: number): number => a * PX - c.genislik / 2;
const Y = (c: DocumentCard, a: number): number => a * PX - c.yukseklik / 2;

function yazi(x: number, y: number, s: Phaser.Scene, t: string, font: string, size: number, renk: string, ox = 0): Phaser.GameObjects.Text {
  return s.add
    .text(snap(x), snap(y), t, { fontFamily: font, fontSize: `${size}px`, color: renk })
    .setOrigin(ox, 0.5);
}

/**
 * Belge yazı boyları (VT323). Yazı tipinin pikseli 1/25 em: 50 px'te tam 2 ekran pikseli (keskin başlık).
 * Etiket ve değer, en küçük ekranda da okunacak boyda.
 */
const BOY_BASLIK = 50;
const BOY_ETIKET = 30;
const BOY_DEGER = 40;

/** Başlık ve etiket. */
function etiket(k: Ctx, ax: number, ay: number, t: string, size = BOY_ETIKET, renk: string = PAL.etiket, ox = 0): Phaser.GameObjects.Text {
  const o = yazi(X(k.c, ax), Y(k.c, ay), k.s, t, FONT, size, renk, ox);
  k.c.add(o);
  return o;
}

/** Değer. */
function deger(k: Ctx, ax: number, ay: number, t: string, size = BOY_DEGER, renk: string = PAL.murekkep, ox = 0): Phaser.GameObjects.Text {
  const o = yazi(X(k.c, ax), Y(k.c, ay), k.s, t, FONT, size, renk, ox);
  k.c.add(o);
  return o;
}

/** Tıklanabilir alan için görünmez dikdörtgen (sanat pikseli koordinatı). */
function bolge(k: Ctx, alan: string, ax: number, ay: number, aw: number, ah: number): void {
  const r = k.s.add.rectangle(X(k.c, ax), Y(k.c, ay), aw * PX, ah * PX, 0xffffff, 0.001).setOrigin(0);
  k.c.alanEkle(alan, r);
}

/** Kâğıt: zemin, benek, kenar gölgesi, sağ üstte kıvrık köşe. */
function kagit(t: Tuval, renk: string, koyu: string, rnd: () => number, kose = true): void {
  const { w, h } = t;
  t.rect(0, 0, w, h, renk);
  t.benek(0, 0, w, h, koyu, 0.035, rnd);
  t.benek(0, 0, w, h, '#ffffff10', 0.02, rnd);
  t.frame(0, 0, w, h, koyu);
  t.dither(1, h - 2, w - 2, 1, koyu);
  t.dither(w - 2, 1, 1, h - 2, koyu, 1);
  if (kose) {
    for (let i = 0; i < 4; i++) t.ctx.clearRect(w - 4 + i, 0, 1, 4 - i);
    for (let i = 0; i < 4; i++) t.rect(w - 5, i, i + 1, 1, koyu);
    t.rect(w - 4, 4, 4, 1, koyu);
  }
}

/** Yazıyı taklit eden küçük çizgiler (yoğun, resmî görünüm; okunacak metin yok). */
function sahteSatir(t: Tuval, x: number, y: number, w: number, c: string, rnd: () => number): void {
  let cx = x;
  while (cx < x + w - 2) {
    const l = 2 + Math.floor(rnd() * 5);
    t.rect(cx, y, Math.min(l, x + w - cx), 1, c);
    cx += l + 1;
  }
}

/**
 * Elle düzeltme (G17a/G17b): değerin altına düzensiz kenarlı daksil lekesi, değer tükenmez kalem mavisiyle ve
 * hafif eğik yazılır. d: değer yazısı (sol ortadan konumlu), ax/ay: yazının sanat pikseli konumu.
 */
function elleDuzelt(t: Tuval, d: Phaser.GameObjects.Text, ax: number, ay: number): void {
  const dw = Math.ceil(d.width / PX) + 3;
  const x0 = ax - 2;
  const y0 = ay - 4;
  t.rect(x0, y0, dw, 8, DAKSIL);
  for (let i = 0; i < dw; i += 3) t.px(x0 + i, y0 - 1, DAKSIL).px(x0 + 1 + i, y0 + 8, DAKSIL);
  t.rect(x0 + dw, y0 + 1, 1, 5, DAKSIL);
  d.setColor(KALEM).setAngle(-2);
}

/** Ataş: belge sonradan gişeden getirildi. */
function atas(t: Tuval, kagitRenk: string): void {
  t.rect(t.w - 16, 0, 4, 9, '#8a8478').rect(t.w - 15, 1, 2, 7, kagitRenk).rect(t.w - 15, 0, 2, 1, '#b0aaa0');
}

/** Jenerik mühür: halka içinde yıldız. */
function muhur(t: Tuval, cx: number, cy: number, rnd: () => number): void {
  const c = PAL.muhur;
  t.daire(cx, cy, 8, c, true);
  t.daire(cx, cy, 6, c, true);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    t.line(cx, cy, cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, c);
  }
  for (let i = 0; i < 16; i++) t.ctx.clearRect(cx - 9 + Math.floor(rnd() * 18), cy - 9 + Math.floor(rnd() * 18), 1, 1);
  // Silinen pikseller kâğıda dönsün
  t.ctx.globalCompositeOperation = 'destination-over';
  t.rect(cx - 9, cy - 9, 19, 19, PAL.krem);
  t.ctx.globalCompositeOperation = 'source-over';
}

function ruhsat(k: Ctx): void {
  const { t, rnd, b } = k;
  kagit(t, PAL.krem, PAL.kremKoyu, rnd);
  t.frame(2, 2, t.w - 4, t.h - 4, PAL.kremKoyu);
  // Başlık şeridi ve süs deseni
  t.rect(3, 3, t.w - 9, 8, PAL.basikSerit);
  for (let x = 3; x < t.w - 6; x += 2) {
    t.px(x, 3, '#7a4a42');
    t.px(x + 1, 10, '#7a4a42');
  }
  etiket(k, 6, 7, ust(BASLIK.ruhsat), BOY_BASLIK, PAL.kremAcik);
  sahteSatir(t, 50, 6, 36, '#8a5a50', rnd);
  sahteSatir(t, 56, 8, 30, '#8a5a50', rnd);
  sahteSatir(t, 6, 13, 50, PAL.kremKoyu, rnd);
  // Alanlar. Kat sayısı zemin katı (dükkân) da içerir; etiket bunu açıkça söyler. Ada / parsel ve imza G17b.
  const r = b.ruhsat;
  const satirlar: [string, string, string, number, string?][] = [
    ['kat', 'Kat sayısı', String(r.kat), 20, '(zemin dahil)'],
    ['yil', 'Yapım yılı', String(r.yil), 32],
    ['muhur', 'Mühür yılı', String(r.muhurYili), 42],
  ];
  if (adaGorunur(k)) satirlar.push(['ada', 'Ada/Parsel', r.ada, 52]);
  for (const [alan, ad, v, y, alt] of satirlar) {
    if (alt) {
      etiket(k, 6, y - 2, ad);
      etiket(k, 6, y + 3, alt, 24);
    } else etiket(k, 6, y, ad);
    const d = deger(k, 46, y, v);
    // Elle düzeltilmiş alan: daksil üstüne mavi kalem (G17b).
    if (r.duzeltme?.alan === alan) elleDuzelt(t, d, 46, y);
    for (let x = 45; x < 74; x += 2) t.px(x, y + 4, PAL.murekkepAcik);
    bolge(k, alan, 4, y - 6, 72, alt ? 12 : 10);
  }
  // İmza: "x" ve noktalı çizgi; imzalıysa üstünde mavi kalemle karalama, imzasızsa boş (G17b).
  if (imzaGorunur(k)) {
    etiket(k, 6, 65, 'İmza');
    t.px(22, 67, PAL.murekkepSoluk).px(24, 67, PAL.murekkepSoluk).px(23, 68, PAL.murekkepSoluk).px(22, 69, PAL.murekkepSoluk).px(24, 69, PAL.murekkepSoluk);
    for (let x = 26; x < 64; x += 2) t.px(x, 70, PAL.murekkepAcik);
    if (r.imza) imzaCiz(t, 28, 62, rnd);
    bolge(k, 'imza', 4, 58, 64, 14);
  }
  muhur(t, 80, 67, rnd);
}

/** Kodla piksel imza: soldan sağa kıvrımlı tek çizgi ve altında kısa bir kuyruk (mavi kalem). */
function imzaCiz(t: Tuval, x0: number, y0: number, rnd: () => number): void {
  let x = x0;
  let y = y0 + 4;
  const n = 7 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const nx = x + 3 + Math.floor(rnd() * 3);
    const ny = y0 + 1 + Math.floor(rnd() * 6);
    t.line(x, y, nx, ny, KALEM);
    x = nx;
    y = ny;
  }
  t.line(x, y, x0 + 4, y0 + 7, KALEM);
}

function foto(k: Ctx): void {
  const { t, rnd, b, s, c, bina } = k;
  kagit(t, PAL.fotoKenar, PAL.fotoKenarKoyu, rnd, false);
  t.rect(4, 4, 68, 88, '#24211f');
  etiket(k, 6, 98, ust(BASLIK.foto), 28, PAL.murekkepSoluk);
  // Fotoğraf: 136×176 piksel, 2 kat büyütülür (baskı küçük, ayrıntı ince).
  const W = 136;
  const H = 176;
  const p = new Tuval(s, W, H, 'foto');
  const zemin = H - 10;
  const gok = ['#a3aaa8', '#acb1ac', '#b5b8b0', '#bebfb4', '#c6c5b8'];
  const bant = Math.ceil(zemin / gok.length);
  gok.forEach((g, i) => {
    p.rect(0, i * bant, W, bant, g);
    if (i > 0) p.dither(0, i * bant, W, 1, gok[i - 1]);
  });
  const f = b.foto;
  const ustAdet = Math.max(0, f.gorunenKat - 1);
  const h = cepheH(ustAdet);
  const bx = Math.floor((W - CEPHE_W) / 2);
  // Kesilmiş komşular
  const kr = rastgele(dizgiTohum(bina.id) ^ 0xf070);
  for (const kx of [bx - CEPHE_W - 4, bx + CEPHE_W + 4]) {
    const kat = 3 + Math.floor(kr() * 4);
    cepheCiz(s, p.ctx, kx, zemin - cepheH(kat - 1), { kat, kolon: 6, vitrin: [], catlak: 'yok', secim: cepheSecimi(kr), rnd: kr });
    p.ctx.fillStyle = 'rgba(190,190,180,0.35)';
    p.ctx.fillRect(kx, zemin - cepheH(kat - 1), CEPHE_W, cepheH(kat - 1));
  }
  const d = cepheCiz(s, p.ctx, bx, zemin - h, {
    kat: f.gorunenKat,
    kolon: b.proje.zeminKolonSayisi,
    vitrin: f.vitrinKolonlar,
    catlak: f.gorunenCatlak,
    secim: binaSecimi(bina),
    // Kaçak kat (elle düzeltilmiş ruhsatta da: gerçek kat daksilin altındaki asıl değere göre).
    ekKat: Math.max(0, f.gorunenKat - gecerliRuhsat(b.ruhsat).kat),
    rnd,
  });
  p.rect(0, zemin, W, 10, '#77736a');
  p.rect(0, zemin, W, 1, '#8f8a7f');
  for (let x = 3; x < W; x += 9) p.px(x, zemin + 3 + (x % 2) * 3, '#66625a');
  p.benek(0, 0, W, H, '#d8d4c8', 0.002, rnd);
  const ox = X(c, 4);
  const oy = Y(c, 4);
  const img = p.goruntu(ox, oy, 2).setOrigin(0).setTint(0xf4ead8);
  c.add(img);
  // Alanlar (fotoğraf pikseli → kart koordinatı)
  const yTop = zemin - h;
  const r = (alan: string, x: number, y: number, w: number, hh: number): void => {
    const o = s.add.rectangle(ox + x * 2, oy + y * 2, w * 2, hh * 2, 0xffffff, 0.001).setOrigin(0);
    c.alanEkle(alan, o);
  };
  // Kat sayısı zemin dahil: kat alanı bütün cepheyi kapsar. Kolon (zemin kat bandı) ve çatlak bunun
  // içinde kalır; inceleme modunda üst üste binen alanlardan küçük olan seçilir.
  r('kat', bx, yTop, CEPHE_W, h);
  r('kolon', bx, yTop + d.zeminY, CEPHE_W, ZEMIN_H);
  // Çatlak yoksa çatlak alanı da yok (boş duvara tıklayan kat alanını seçsin).
  if (f.gorunenCatlak !== 'yok') r('catlak', bx + d.catlak.x - 4, yTop + d.catlak.y - 3, d.catlak.w + 8, d.catlak.h + 6);
}

function proje(k: Ctx): void {
  const { t, rnd, b } = k;
  kagit(t, PAL.teknik, PAL.kirliBeyazKoyu, rnd);
  for (let x = 4; x < t.w - 2; x += 4) t.dither(x, 2, 1, t.h - 4, PAL.teknikIzgara);
  for (let y = 4; y < t.h - 2; y += 4) t.dither(2, y, t.w - 4, 1, PAL.teknikIzgara);
  etiket(k, 4, 6, ust(BASLIK.proje), BOY_BASLIK, PAL.murekkep);
  t.rect(3, 10, t.w - 6, 1, PAL.murekkep);
  // Kolon planı
  const n = b.proje.zeminKolonSayisi;
  const x0 = 8;
  const x1 = t.w - 9;
  t.frame(x0, 16, x1 - x0 + 1, 18, PAL.murekkep);
  t.rect(x0 + 1, 24, x1 - x0 - 1, 1, PAL.murekkepAcik);
  for (let i = 0; i < n; i++) {
    const cx = Math.round(x0 + 2 + (i * (x1 - x0 - 6)) / Math.max(1, n - 1));
    t.rect(cx, 23, 3, 3, PAL.murekkep);
    t.rect(cx + 1, 17, 1, 6, PAL.murekkepAcik);
    t.rect(cx + 1, 26, 1, 7, PAL.murekkepAcik);
  }
  // Ölçü çizgisi
  t.rect(x0, 38, x1 - x0 + 1, 1, PAL.murekkepSoluk);
  t.rect(x0, 36, 1, 5, PAL.murekkepSoluk);
  t.rect(x1, 36, 1, 5, PAL.murekkepSoluk);
  bolge(k, 'kolon', x0, 16, x1 - x0 + 1, 18);
  etiket(k, 4, 45, 'Zemin kat kolon planı', 28);
  deger(k, t.w - 5, 45, `${n} kolon`, 36, PAL.murekkep, 1);
  // Antet kutusu
  t.frame(48, 50, t.w - 52, 7, PAL.murekkepSoluk);
  t.rect(66, 50, 1, 7, PAL.murekkepSoluk);
  sahteSatir(t, 50, 53, 14, PAL.murekkepAcik, rnd);
  sahteSatir(t, 68, 52, 16, PAL.murekkepAcik, rnd);
  sahteSatir(t, 68, 54, 12, PAL.murekkepAcik, rnd);
  sahteSatir(t, 4, 53, 30, PAL.teknikIzgara, rnd);
}

function vaziyet(k: Ctx): void {
  const { t, rnd, b } = k;
  kagit(t, PAL.plan, PAL.planKoyu, rnd);
  for (let x = 4; x < t.w - 2; x += 6) t.rect(x, 2, 1, t.h - 4, PAL.planIzgara);
  for (let y = 4; y < t.h - 2; y += 6) t.rect(2, y, t.w - 4, 1, PAL.planIzgara);
  t.frame(2, 2, t.w - 4, t.h - 4, PAL.planCizgi);
  etiket(k, 5, 7, ust(BASLIK.vaziyet), BOY_BASLIK, PAL.planCizgi);
  // Kuzey oku
  const nx = t.w - 9;
  t.line(nx, 5, nx - 3, 11, PAL.planCizgi).line(nx, 5, nx + 3, 11, PAL.planCizgi).rect(nx, 6, 1, 6, PAL.planCizgi);
  // Parsel (kesik çizgi). Çizim PLAN_H yüksekliğinde; altındaki şeritte ada / parsel.
  const H = PLAN_H;
  for (let x = 8; x < t.w - 8; x += 3) {
    t.rect(x, 15, 2, 1, PAL.planCizgi);
    t.rect(x, H - 7, 2, 1, PAL.planCizgi);
  }
  for (let y = 15; y < H - 7; y += 3) {
    t.rect(8, y, 1, 2, PAL.planCizgi);
    t.rect(t.w - 9, y, 1, 2, PAL.planCizgi);
  }
  // Bina
  const bx = 43;
  const by = 36;
  t.rect(bx, by, 12, 12, PAL.planKoyu).frame(bx, by, 12, 12, PAL.planCizgi);
  for (let i = 2; i < 12; i += 3) t.line(bx + i, by + 1, bx + 1, by + i, PAL.planCizgi);
  const v = b.vaziyet;
  // Mesafeler karekökle ölçeklenir (yer tutucu; cetvel G7'de).
  const dx = Math.round(bx - 2 - (4 + 1.25 * Math.sqrt(v.dereM)));
  for (let y = 16; y < H - 7; y++) {
    const ofs = Math.round(Math.sin(y / 2.2) * 1.2);
    t.rect(dx + ofs, y, 2, 1, PAL.planDere);
  }
  const fx = Math.round(bx + 14 + (2 + 0.75 * Math.sqrt(v.fayM)));
  for (let y = 16; y < H - 7; y += 4) t.rect(fx, y, 2, 2, PAL.fay);
  const de = etiket(k, dx + 4, 20, `Dere: ${v.dereM} m`, 28, PAL.planCizgi);
  const fa = etiket(k, fx - 2, H - 11, `Fay: ${v.fayM} m`, 28, '#f0beb6', 1);
  // Gişeden getirilen sahte planda elle düzeltilmiş mesafe (G17b).
  if (v.duzeltme?.alan === 'dere') elleDuzelt(t, de, dx + 4, 20);
  if (v.duzeltme?.alan === 'fay') {
    elleDuzelt(t, fa, fx - 2 - Math.ceil(fa.width / PX), H - 11);
  }
  k.c.remove(de);
  k.c.remove(fa);
  k.c.alanEkle('dere', de);
  k.c.alanEkle('fay', fa);
  // Ada / parsel şeridi (G17b)
  if (!adaGorunur(k)) return;
  etiket(k, 9, H, 'Ada/Parsel', 26, PAL.planCizgi);
  const ad = deger(k, 40, H, v.ada, 30, PAL.planCizgi);
  k.c.remove(ad);
  k.c.alanEkle('ada', ad);
}

function karot(k: Ctx): void {
  const { t, rnd, b } = k;
  kagit(t, PAL.lab, PAL.labKoyu, rnd);
  t.rect(3, 3, t.w - 9, 8, PAL.labKoyu);
  etiket(k, 5, 7, ust(BASLIK.karot), BOY_BASLIK, PAL.murekkep);
  // Tablo
  const x0 = 4;
  const x1 = t.w - 5;
  const y0 = 15;
  const sat = 8;
  t.frame(x0, y0, x1 - x0 + 1, sat * 4 + 1, PAL.murekkepSoluk);
  t.rect(x0 + 1, y0 + 1, x1 - x0 - 1, sat - 1, PAL.labKoyu);
  for (let i = 1; i < 4; i++) t.rect(x0, y0 + i * sat, x1 - x0 + 1, 1, PAL.murekkepSoluk);
  t.rect(46, y0, 1, sat * 4 + 1, PAL.murekkepSoluk);
  sahteSatir(t, x0 + 3, y0 + 4, 30, PAL.murekkepAcik, rnd);
  sahteSatir(t, 49, y0 + 4, 20, PAL.murekkepAcik, rnd);
  sahteSatir(t, x0 + 3, y0 + 2 * sat + 4, 18 + Math.floor(rnd() * 12), PAL.labKoyu, rnd);
  sahteSatir(t, 49, y0 + 2 * sat + 4, 10, PAL.labKoyu, rnd);
  sahteSatir(t, 4, t.h - 5, 28, PAL.labKoyu, rnd);
  if (b.karot) {
    etiket(k, x0 + 3, y0 + sat + 4, 'Beton dayanımı', 26);
    const o = deger(k, 49, y0 + sat + 4, `${b.karot.mpa} MPa`, 36);
    k.c.remove(o);
    k.c.alanEkle('mpa', o);
    // Ada / parsel satırı (G17b); kuralı gelmeden sahte satır.
    if (adaGorunur(k)) {
      etiket(k, x0 + 3, y0 + 3 * sat + 4, 'Ada/Parsel', 26);
      const ad = deger(k, 49, y0 + 3 * sat + 4, b.karot.ada, 30);
      k.c.remove(ad);
      k.c.alanEkle('ada', ad);
    } else {
      sahteSatir(t, x0 + 3, y0 + 3 * sat + 4, 24, PAL.labKoyu, rnd);
      sahteSatir(t, 49, y0 + 3 * sat + 4, 14, PAL.labKoyu, rnd);
    }
  } else {
    t.rect(x0 + 1, y0 + sat + 1, x1 - x0 - 1, sat * 3 - 1, PAL.lab);
    const o = etiket(k, t.w / 2, y0 + sat * 2 + 4, 'Rapor yok', 36, PAL.damgaBosalt, 0.5);
    k.c.remove(o);
    k.c.alanEkle('mpa', o);
  }
}

function zemin(k: Ctx): void {
  const { t, rnd, b } = k;
  kagit(t, PAL.kirliBeyaz, PAL.kirliBeyazKoyu, rnd);
  etiket(k, 5, 6, ust(BASLIK.zemin), BOY_BASLIK, PAL.murekkep);
  t.rect(4, 10, t.w - 8, 1, PAL.murekkepSoluk);
  if (b.zemin) {
    sahteSatir(t, 5, 14, 40, PAL.kirliBeyazKoyu, rnd);
    sahteSatir(t, 5, 16, 34, PAL.kirliBeyazKoyu, rnd);
    etiket(k, 5, 24, 'Zemin türü');
    const o = deger(k, 5, 32, ZEMIN_ADI[b.zemin.tur], 36);
    k.c.remove(o);
    k.c.alanEkle('tur', o);
    // Sondaj kesiti: katman renkleri zemin türüne göre
    const kx = t.w - 18;
    const katman: Record<Zemin, string[]> = {
      saglam: ['#6b5a48', '#77746e', '#5e5c58', '#4b4a47'],
      orta: ['#6b5a48', '#8a6f52', '#7a6650', '#77746e'],
      sivilasma: ['#6b5a48', '#b59e72', '#a8916a', '#b59e72'],
    };
    const ks = katman[b.zemin.tur];
    ks.forEach((c, i) => {
      t.rect(kx, 14 + i * 9, 12, 9, c);
      t.benek(kx, 14 + i * 9, 12, 9, KONTUR, 0.08, rnd);
    });
    t.frame(kx - 1, 13, 14, 38, PAL.murekkepSoluk);
    if (b.zemin.tur === 'sivilasma') t.rect(kx - 3, 26, 18, 1, '#4f7d9a');
    sahteSatir(t, 5, 42, 36, PAL.kirliBeyazKoyu, rnd);
    sahteSatir(t, 5, 44, 28, PAL.kirliBeyazKoyu, rnd);
    // Ada / parsel satırı (G17b)
    if (adaGorunur(k)) {
      t.rect(4, 51, t.w - 8, 1, PAL.kirliBeyazKoyu);
      etiket(k, 5, 56, 'Ada/Parsel', 26);
      const ad = deger(k, 34, 56, b.zemin.ada, 30);
      k.c.remove(ad);
      k.c.alanEkle('ada', ad);
    }
  } else {
    sahteSatir(t, 5, 14, 30, PAL.kirliBeyazKoyu, rnd);
    const o = etiket(k, t.w / 2, 32, 'RAPOR YOK', 44, PAL.murekkepSoluk, 0.5);
    k.c.remove(o);
    k.c.alanEkle('rapor', o);
  }
}

const CIZIM: Record<BelgeTuru, (k: Ctx) => void> = { ruhsat, foto, proje, vaziyet, karot, zemin };

/** Bir belgeyi veriden çizer. */
export function belgeKur(scene: Phaser.Scene, tur: BelgeTuru, bina: Bina, gun: number, x: number, y: number): DocumentCard {
  const [w, h] = BOY[tur];
  const kart = new DocumentCard(scene, tur, w, h, x, y);
  const t = new Tuval(scene, w / PX, h / PX, `belge-${tur}`);
  const rnd = rastgele(dizgiTohum(bina.id + tur));
  CIZIM[tur]({ s: scene, c: kart, b: bina.belgeler, bina, t, rnd, gun });
  kart.zeminEkle(t);
  return kart;
}

// ---- G17: İSTE düğmesi ve gişeden getirilen rapor ----

/** Eksik belge kartındaki İSTE düğmesinin yeri (kart ortasına göre, ekran). */
const ISTE_YERI: Partial<Record<BelgeTuru, [number, number]>> = { karot: [0, 72], zemin: [0, 72] };

/**
 * "Rapor yok" kartına İSTE düğmesi (G17): tıklanınca is() çağrılır ve düğme "İSTENDİ" olarak söner.
 * İnceleme modunda da çalışır (alan seçimi sayılmaz).
 */
export function isteDugmesi(kart: DocumentCard, is: () => void): void {
  const s = kart.scene;
  const [x, y] = ISTE_YERI[kart.tur] ?? [0, 0];
  const w = 136;
  const h = 40;
  const kutu = s.add.rectangle(x, y, w, h, 0x151413).setStrokeStyle(PX, 0x57524a);
  const yazi = s.add.text(x, y, 'İSTE', { fontFamily: FONT, fontSize: '34px', color: PAL.saat }).setOrigin(0.5);
  kutu.setInteractive({ useHandCursor: true }).setData('incelemeYok', true);
  kutu.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => kutu.setFillStyle(0x3a2f22));
  kutu.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => kutu.setFillStyle(0x151413));
  kutu.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
    e.stopPropagation();
    kutu.disableInteractive();
    kutu.setFillStyle(0x151413);
    yazi.setText('İSTENDİ').setColor(PAL.murekkepAcik).setFontSize(30);
    is();
  });
  kart.add([kutu, yazi]);
}

/**
 * Gişeden getirilen rapor (gerçek ya da sahte, G17). Eksik belgenin yerine masaya kayar; köşesinde ataş.
 * Satırlar: değer, tarih, laboratuvar mührü. Sahte raporda tek bir ipucu: mühür yok, tarih bugünden ileri ya
 * da değer elle düzeltilmiş (daksil üstüne tükenmez kalem). Alanlar: değer (karot 'mpa', zemin 'tur'), 'tarih', 'lab'.
 */
export function raporKur(scene: Phaser.Scene, bina: Bina, rapor: GetirilenRapor, gun: number, x: number, y: number): DocumentCard {
  const tur: BelgeTuru = rapor.alan;
  if (tur === 'ruhsat' || tur === 'vaziyet') return belgeGetir(scene, bina, rapor, gun, x, y);
  const [w] = BOY[tur];
  const h = RAPOR_H;
  const c = new DocumentCard(scene, tur, w, h, x, y);
  const t = new Tuval(scene, w / PX, h / PX, `rapor-${tur}`);
  const rnd = rastgele(dizgiTohum(bina.id + tur + 'getirilen'));
  const k: Ctx = { s: scene, c, b: bina.belgeler, bina, t, rnd, gun };
  const karot = tur === 'karot';
  kagit(t, karot ? PAL.lab : PAL.kirliBeyaz, karot ? PAL.labKoyu : PAL.kirliBeyazKoyu, rnd);
  t.rect(3, 3, t.w - 9, 8, karot ? PAL.labKoyu : PAL.kirliBeyazKoyu);
  etiket(k, 5, 7, ust(BASLIK[tur]), BOY_BASLIK, PAL.murekkep);
  // Ataş: sonradan getirildi
  atas(t, karot ? PAL.lab : PAL.kirliBeyaz);
  // Değer
  etiket(k, 5, 16, karot ? 'Beton dayanımı' : 'Zemin türü', 26);
  const metin = karot ? `${rapor.deger} MPa` : ZEMIN_ADI[rapor.deger as Zemin];
  const d = deger(k, 6, 25, metin, 36);
  // Daksil lekesi üstüne mavi kalem (sahte rapor ipucu).
  if (rapor.ipucu === 'elle') elleDuzelt(t, d, 6, 25);
  k.c.remove(d);
  k.c.alanEkle(karot ? 'mpa' : 'tur', d);
  for (let x2 = 5; x2 < t.w - 6; x2 += 2) t.px(x2, 30, PAL.murekkepAcik);
  // Tarih
  etiket(k, 5, 36, 'Tarih', 26);
  const tr = deger(k, 28, 36, tarih(gun, rapor.tarihFark), 30);
  k.c.remove(tr);
  k.c.alanEkle('tarih', tr);
  // Laboratuvar mührü (sahtede yok: noktalı boş yer)
  etiket(k, 5, 47, 'Lab mührü', 26);
  for (let x2 = 40; x2 < t.w - 6; x2 += 2) t.px(x2, 50, PAL.murekkepAcik);
  if (rapor.ipucu !== 'muhur') muhurLab(t, 62, 45, rnd, karot ? PAL.lab : PAL.kirliBeyaz);
  bolge(k, 'lab', 38, 42, t.w - 42, 11);
  // Ada / parsel (G17b)
  if (adaGorunur(k)) {
    for (let x2 = 5; x2 < t.w - 6; x2 += 2) t.px(x2, 54, PAL.murekkepAcik);
    etiket(k, 5, 59, 'Ada/Parsel', 26);
    const ad = deger(k, 40, 59, rapor.ada, 30);
    k.c.remove(ad);
    k.c.alanEkle('ada', ad);
  }
  c.zeminEkle(t);
  return c;
}

/**
 * Gişeden getirilen ruhsat ya da vaziyet planı (G17b): normal belge gibi çizilir (gerçekte düzgünü; sahtede
 * elle düzeltme, imza yok ya da yine başka binanın ada / parseli), köşesinde ataş.
 */
function belgeGetir(scene: Phaser.Scene, bina: Bina, rapor: GetirilenRapor, gun: number, x: number, y: number): DocumentCard {
  const tur = rapor.alan as 'ruhsat' | 'vaziyet';
  const [w, h] = BOY[tur];
  const c = new DocumentCard(scene, tur, w, h, x, y);
  const t = new Tuval(scene, w / PX, h / PX, `getirilen-${tur}`);
  const B = bina.belgeler;
  const belgeler: Belgeler = { ...B, ruhsat: rapor.ruhsat ?? B.ruhsat, vaziyet: rapor.vaziyet ?? B.vaziyet };
  const b2: Bina = { ...bina, belgeler };
  const rnd = rastgele(dizgiTohum(bina.id + tur + 'getirilen'));
  CIZIM[tur]({ s: scene, c, b: belgeler, bina: b2, t, rnd, gun });
  atas(t, tur === 'ruhsat' ? PAL.krem : PAL.plan);
  c.zeminEkle(t);
  return c;
}

/** Laboratuvar mührü: halka içinde L harfi deseni (jenerik; gerçek bir kurumun mührü değil). */
function muhurLab(t: Tuval, cx: number, cy: number, rnd: () => number, kagitRenk: string): void {
  const m = PAL.muhur;
  t.daire(cx, cy, 6, m, true);
  t.daire(cx, cy, 4, m, true);
  t.rect(cx - 1, cy - 2, 1, 4, m).rect(cx - 1, cy + 1, 3, 1, m);
  for (let i = 0; i < 10; i++) t.px(cx - 6 + Math.floor(rnd() * 13), cy - 6 + Math.floor(rnd() * 13), kagitRenk);
}
