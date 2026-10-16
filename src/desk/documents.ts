// @beyan görsel
import * as Phaser from 'phaser';
import type { Belgeler, BelgeTuru, Bina, Zemin } from '../game/building';
import { DocumentCard, KART_H, KART_W } from './DocumentCard';

const INK = '#1c1c1c';
const ZEMIN_ADI: Record<Zemin, string> = { saglam: 'Sağlam', orta: 'Orta', sivilasma: 'Sıvılaşma riski' };
const BASLIK: Record<BelgeTuru, string> = {
  ruhsat: 'Ruhsat',
  foto: 'Fotoğraf',
  proje: 'Proje özeti',
  vaziyet: 'Vaziyet planı',
  karot: 'Karot sonucu',
  zemin: 'Zemin etüdü',
};
/** Masadaki dizilim (3 sütun x 2 satır). */
export const SIRA: BelgeTuru[] = ['ruhsat', 'foto', 'proje', 'vaziyet', 'karot', 'zemin'];

function metin(scene: Phaser.Scene, x: number, y: number, t: string, size = 28, bold = false): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, t, { fontFamily: 'sans-serif', fontSize: `${size}px`, fontStyle: bold ? 'bold' : 'normal', color: INK })
    .setOrigin(0, 0.5);
}

/** Çizim alanı için görünmez ama tıklanabilir dikdörtgen. */
function bolge(scene: Phaser.Scene, cx: number, cy: number, w: number, h: number): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(cx, cy, w, h, 0xffffff, 0.001);
}

const SOL = -KART_W / 2 + 24;
const ALT = KART_H / 2;

function ruhsat(s: Phaser.Scene, c: DocumentCard, b: Belgeler): void {
  c.alanEkle('kat', metin(s, SOL, -30, `Kat sayısı: ${b.ruhsat.kat}`));
  c.alanEkle('yil', metin(s, SOL, 30, `Yapım yılı: ${b.ruhsat.yil}`));
  c.alanEkle('muhur', metin(s, SOL, 90, `Mühür yılı: ${b.ruhsat.muhurYili}`));
}

function foto(s: Phaser.Scene, c: DocumentCard, b: Belgeler): void {
  const f = b.foto;
  const g = s.add.graphics();
  const W = 330;
  const x0 = -W / 2;
  const zeminH = 50;
  const ustAdet = Math.max(0, f.gorunenKat - 1);
  const katH = ustAdet > 0 ? Math.min(32, (200 - zeminH) / ustAdet) : 0;
  const yAlt = ALT - 24;
  const yZemin = yAlt - zeminH;
  const yUst = yZemin - katH * ustAdet;
  g.fillStyle(0x9fb4c8, 1).fillRect(x0 - 30, yUst - 14, W + 60, yAlt - yUst + 14);
  for (let i = 0; i < ustAdet; i++) {
    const y = yZemin - katH * (i + 1);
    g.fillStyle(0xc9bfae, 1).fillRect(x0, y, W, katH - 2);
    g.fillStyle(0x4b5b6b, 1);
    for (let k = 0; k < 4; k++) g.fillRect(x0 + 24 + k * 78, y + 5, 36, Math.max(6, katH - 12));
  }
  g.fillStyle(0x6e6a63, 1).fillRect(x0, yZemin, W, zeminH);
  const n = b.proje.zeminKolonSayisi;
  const aralik = (W - 20) / (n - 1 || 1);
  for (let i = 0; i < n; i++) {
    const cx = x0 + 10 + i * aralik;
    if (f.vitrinKolonlar.includes(i)) g.fillStyle(0x7ad0e8, 1).fillRect(cx - 14, yZemin + 6, 28, zeminH - 6);
    else g.fillStyle(0x3a3835, 1).fillRect(cx - 6, yZemin, 12, zeminH);
  }
  const cy = yUst + (yAlt - yUst) * 0.25;
  g.lineStyle(f.gorunenCatlak === 'capraz' ? 5 : 2, 0x2a2a2a, 1);
  if (f.gorunenCatlak === 'capraz') {
    g.lineBetween(x0 + 60, cy, x0 + 150, cy + 80);
    g.lineBetween(x0 + 150, cy, x0 + 60, cy + 80);
  } else if (f.gorunenCatlak === 'kilcal') {
    g.lineBetween(x0 + 200, cy, x0 + 230, cy + 22);
  }
  c.add(g);
  c.alanEkle('kat', bolge(s, 0, (yUst + yZemin) / 2, W, Math.max(10, yZemin - yUst)));
  c.alanEkle('kolon', bolge(s, 0, yZemin + zeminH / 2, W, zeminH));
  c.alanEkle('catlak', bolge(s, x0 + 120, cy + 40, 200, 100));
}

function proje(s: Phaser.Scene, c: DocumentCard, b: Belgeler): void {
  const n = b.proje.zeminKolonSayisi;
  const g = s.add.graphics();
  const W = 360;
  const aralik = (W - 24) / (n - 1 || 1);
  for (let i = 0; i < n; i++) g.fillStyle(0x333333, 1).fillRect(-W / 2 + 12 + i * aralik - 12, 20, 24, 24);
  g.lineStyle(2, 0x666666, 1).strokeRect(-W / 2 - 6, 5, W + 12, 54);
  c.add(g);
  c.add(metin(s, SOL, -40, 'Zemin kat kolon planı', 26));
  c.alanEkle('kolon', bolge(s, 0, 32, W + 12, 54));
  c.add(metin(s, SOL, 100, `${n} kolon`, 26));
}

function vaziyet(s: Phaser.Scene, c: DocumentCard, b: Belgeler): void {
  const v = b.vaziyet;
  const g = s.add.graphics();
  const cy = 30;
  g.fillStyle(0xc7d2b0, 1).fillRect(-200, cy - 90, 400, 180);
  g.lineStyle(2, 0x666666, 1).strokeRect(-200, cy - 90, 400, 180);
  g.fillStyle(0x555555, 1).fillRect(-30, cy - 30, 60, 60);
  // Mesafeler karekökle ölçeklenir (yer tutucu; cetvel G7'de).
  const dx = -30 - (20 + 6 * Math.sqrt(v.dereM));
  g.lineStyle(8, 0x3d8bd9, 1).lineBetween(dx, cy - 90, dx, cy + 90);
  const fx = 30 + (20 + 3 * Math.sqrt(v.fayM));
  g.lineStyle(5, 0xb3402f, 1);
  for (let y = cy - 90; y < cy + 90; y += 24) g.lineBetween(fx, y, fx, Math.min(y + 14, cy + 90));
  c.add(g);
  c.alanEkle('dere', metin(s, dx + 12, cy - 60, `Dere: ${v.dereM} m`, 24));
  c.alanEkle('fay', metin(s, fx - 12, cy + 60, `Fay: ${v.fayM} m`, 24).setOrigin(1, 0.5));
}

function karot(s: Phaser.Scene, c: DocumentCard, b: Belgeler): void {
  c.alanEkle('mpa', metin(s, SOL, 20, b.karot ? `Beton dayanımı: ${b.karot.mpa} MPa` : 'Rapor yok', 30, !b.karot));
}

function zemin(s: Phaser.Scene, c: DocumentCard, b: Belgeler): void {
  if (b.zemin) c.alanEkle('tur', metin(s, SOL, 20, `Zemin türü: ${ZEMIN_ADI[b.zemin.tur]}`, 30));
  else c.alanEkle('rapor', metin(s, SOL, 20, 'Rapor yok', 30, true));
}

const CIZIM: Record<BelgeTuru, (s: Phaser.Scene, c: DocumentCard, b: Belgeler) => void> = { ruhsat, foto, proje, vaziyet, karot, zemin };

/** Bir belgeyi veriden çizer (yer tutucu görünüm). */
export function belgeKur(scene: Phaser.Scene, tur: BelgeTuru, bina: Bina, x: number, y: number): DocumentCard {
  const kart = new DocumentCard(scene, tur, BASLIK[tur], x, y);
  CIZIM[tur](scene, kart, bina.belgeler);
  return kart;
}
