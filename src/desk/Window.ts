// @beyan görsel
import * as Phaser from 'phaser';
import { MONO } from '../config';
import type { Bina } from '../game/building';
import { PAL } from './palette';
import { dizgiTohum, PX, rastgele, Tuval } from './pixel';
import { cepheCiz, cepheH, cepheSecimi, CEPHE_W } from './tiles';

/** Üst bandın ölçüleri (ekran pikseli). */
export const BANT_H = 416;
export const TEZGAH_H = 48;
/** Masa bu y'den başlar. */
export const MASA_Y = BANT_H + TEZGAH_H;

const PEN = { x: 32, y: 32, w: 1168, h: 360 };
const GISE = { x: 1248, y: 32, w: 640, h: 360 };
/** Belgelerin girip çıktığı gişe gözü (ekran). */
export const GOZ = { x: 1568, y: BANT_H + 8 };

const D = { arka: 3000, siluet: 3001, on: 3002, duvar: 3003, yazi: 3004 };

/** Bina cephe seçimi dosyaya bağlı: pencerede ve fotoğrafta aynı bina görünsün. */
export function binaSecimi(bina: Bina): ReturnType<typeof cepheSecimi> {
  return cepheSecimi(rastgele(dizgiTohum(bina.id)));
}

/** Belediye penceresi: dışarıda sokak ve dosyanın binası, sağda buzlu camlı gişe, altta tezgâh ve paneller. */
export class Pencere {
  private sokak?: Phaser.GameObjects.Image;
  private siluet?: Phaser.GameObjects.Image;
  private readonly saatYazi: Phaser.GameObjects.Text;
  private readonly dosyaYazi: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    gun: number,
  ) {
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
    on.goruntu(GISE.x, GISE.y).setOrigin(0).setDepth(D.on).setAlpha(0.35);
    // Konuşma deliği ve alt kayıt
    const g = new Tuval(this.scene, w, h, 'gise-delik');
    const cx = Math.floor(w / 2);
    for (let j = 0; j < 3; j++) for (let i = -4; i <= 4; i++) g.px(cx + i * 2, h - 18 + j * 2, PAL.cerceveKoyu);
    g.frame(cx - 11, h - 21, 23, 9, PAL.cerceve);
    g.rect(0, h - 6, w, 6, PAL.cerceve);
    g.rect(0, h - 6, w, 1, PAL.cerceveAcik);
    g.goruntu(GISE.x, GISE.y).setOrigin(0).setDepth(D.on);
  }

  /** Dosyanın binasını sokağa koy (eskisiyle çapraz geçiş). */
  binaGoster(bina: Bina): void {
    const W = PEN.w / 2;
    const H = PEN.h / 2;
    const t = new Tuval(this.scene, W, H, 'sokak');
    const rnd = rastgele(dizgiTohum(bina.id) ^ 0x5eed);
    const ufuk = H - 14;
    // Gök: bantlar ve dama geçişler
    const bant = Math.ceil(ufuk / PAL.gok.length);
    PAL.gok.forEach((c, i) => {
      t.rect(0, i * bant, W, bant, c);
      if (i > 0) t.dither(0, i * bant, W, 2, PAL.gok[i - 1]);
    });
    // Güneş
    t.daire(470, ufuk - 40, 9, '#d4b98c');
    t.dither(458, ufuk - 52, 25, 25, '#c9ad85', 1);
    t.daire(470, ufuk - 40, 8, '#dcc39a');
    // Uzak siluet
    for (let x = 0; x < W; ) {
      const bw = 14 + Math.floor(rnd() * 26);
      const bh = 26 + Math.floor(rnd() * 56);
      t.rect(x, ufuk - bh, bw, bh, rnd() < 0.5 ? PAL.uzakBina : PAL.uzakBinaKoyu);
      for (let k = 0; k < bw * bh * 0.01; k++) t.px(x + 2 + Math.floor(rnd() * (bw - 4)), ufuk - bh + 3 + Math.floor(rnd() * (bh - 6)), PAL.isikKoyu);
      x += bw + Math.floor(rnd() * 6);
    }
    // Komşular (soluk) ve dosyanın binası
    const bx = Math.floor(W / 2 - CEPHE_W / 2);
    const komsu = [bx - 124, bx + 124, bx - 248, bx + 248];
    for (const kx of komsu) {
      const kat = 3 + Math.floor(rnd() * 4);
      const kh = cepheH(kat - 1);
      cepheCiz(this.scene, t.ctx, kx, ufuk - kh, { kat, kolon: 6, vitrin: [], catlak: 'yok', secim: cepheSecimi(rnd), aksam: true, rnd });
      t.ctx.fillStyle = 'rgba(40,34,46,0.5)';
      t.ctx.fillRect(kx, ufuk - kh, CEPHE_W, kh);
    }
    const f = bina.belgeler.foto;
    const ustH = cepheH(f.gorunenKat - 1);
    cepheCiz(this.scene, t.ctx, bx, ufuk - ustH, {
      kat: f.gorunenKat,
      kolon: bina.belgeler.proje.zeminKolonSayisi,
      vitrin: f.vitrinKolonlar,
      catlak: f.gorunenCatlak,
      secim: binaSecimi(bina),
      ekKat: Math.max(0, f.gorunenKat - bina.belgeler.ruhsat.kat),
      aksam: true,
      rnd,
    });
    // Kaldırım ve yol
    t.rect(0, ufuk, W, 5, PAL.kaldirim);
    for (let x = 0; x < W; x += 8) t.px(x, ufuk + 1 + ((x / 8) % 2) * 2, '#5a564f');
    t.rect(0, ufuk + 5, W, 1, '#8a857a');
    t.rect(0, ufuk + 6, W, 8, PAL.asfalt);
    for (let x = 4; x < W; x += 24) t.rect(x, ufuk + 10, 10, 1, PAL.asfaltCizgi);
    // Sokak lambası
    const lx = 96;
    t.rect(lx, ufuk - 52, 2, 52, '#1e1c1e');
    t.rect(lx, ufuk - 52, 12, 2, '#1e1c1e');
    t.rect(lx + 9, ufuk - 50, 5, 2, '#1e1c1e');
    t.rect(lx + 10, ufuk - 48, 3, 1, PAL.isik);
    t.dither(lx + 4, ufuk - 47, 15, 8, PAL.isik, 1);

    const img = t.goruntu(PEN.x, PEN.y, 2).setOrigin(0).setDepth(D.arka).setTint(0xe6dcd4);
    const eski = this.sokak;
    this.sokak = img;
    if (eski) {
      img.setAlpha(0);
      this.scene.tweens.add({ targets: img, alpha: 1, duration: 450, onComplete: () => eski.destroy() });
    }
  }

  /** Gişeye yeni mal sahibinin silueti gelir. */
  siluetGelsin(tohum: number): void {
    const rnd = rastgele(tohum);
    const W = 72;
    const H = 76;
    const t = new Tuval(this.scene, W, H, 'siluet');
    const cx = 36 + Math.floor(rnd() * 5) - 2;
    const omuz = 26 + Math.floor(rnd() * 8);
    const basR = 10 + Math.floor(rnd() * 3);
    const basY = 24;
    const sapka = rnd() < 0.3;
    const topuz = !sapka && rnd() < 0.3;
    const icinde = (x: number, y: number): boolean => {
      const dx = x - cx;
      const dyB = y - basY;
      if ((dx * dx) / (basR * basR) + (dyB * dyB) / ((basR + 2) * (basR + 2)) <= 1) return true;
      if (topuz && (dx + 4) * (dx + 4) + (y - (basY - basR - 1)) ** 2 <= 20) return true;
      if (sapka && y >= basY - basR - 7 && y <= basY - basR + 2 && Math.abs(dx) <= basR - 1) return true;
      if (sapka && y >= basY - basR + 1 && y <= basY - basR + 3 && Math.abs(dx) <= basR + 6) return true;
      if (y > basY + basR - 2 && y < basY + basR + 8 && Math.abs(dx) <= 5) return true;
      const gy = basY + basR + 6;
      if (y >= gy) {
        const k = Math.min(1, (y - gy) / 14);
        const yari = 10 + (omuz - 10) * Math.sqrt(k);
        if (Math.abs(dx) <= yari) return true;
      }
      return false;
    };
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!icinde(x, y)) continue;
        const kenar = !icinde(x - 1, y) || !icinde(x + 1, y) || !icinde(x, y - 1);
        if (kenar && (x + y) % 2 === 1) continue;
        t.px(x, y, kenar ? '#3b3d40' : PAL.siluet);
      }
    const eski = this.siluet;
    if (eski) eski.destroy();
    const x = GISE.x + GISE.w / 2 - (W * PX) / 2;
    const y = GISE.y + GISE.h - H * PX;
    const img = t.goruntu(x + 64, y).setOrigin(0).setDepth(D.siluet).setAlpha(0);
    this.siluet = img;
    this.scene.tweens.add({ targets: img, x, alpha: 0.82, duration: 500, ease: 'Sine.easeOut' });
  }

  siluetGitsin(): void {
    const img = this.siluet;
    if (!img) return;
    this.siluet = undefined;
    this.scene.tweens.add({ targets: img, x: img.x - 96, alpha: 0, duration: 450, ease: 'Sine.easeIn', onComplete: () => img.destroy() });
  }
}
