// @beyan görsel
import * as Phaser from 'phaser';

/** Bir sanat pikselinin ekrandaki boyu. Masa sahnesinde her şey bu ızgaraya oturur. */
export const PX = 4;

/** Değeri ızgaraya yuvarla. */
export function snap(v: number, g = PX): number {
  return Math.round(v / g) * g;
}

let sayac = 0;

/**
 * Düşük çözünürlüklü çizim tuvali (sanat pikseli). Görüntü olarak PX katı büyütülür ve
 * en yakın komşu filtresiyle çizilir: kenar yumuşatma yok, bulanıklık yok.
 */
export class Tuval {
  readonly key: string;
  readonly ctx: CanvasRenderingContext2D;
  readonly tex: Phaser.Textures.CanvasTexture;

  constructor(
    readonly scene: Phaser.Scene,
    readonly w: number,
    readonly h: number,
    onEk = 'tv',
  ) {
    this.key = `${onEk}-${++sayac}`;
    const tex = scene.textures.createCanvas(this.key, w, h);
    if (!tex) throw new Error('CanvasTexture oluşturulamadı');
    this.tex = tex;
    this.ctx = tex.getContext();
    this.ctx.imageSmoothingEnabled = false;
  }

  rect(x: number, y: number, w: number, h: number, c: string): this {
    this.ctx.fillStyle = c;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    return this;
  }

  px(x: number, y: number, c: string): this {
    return this.rect(x, y, 1, 1, c);
  }

  /** 1 piksel kalınlığında çerçeve. */
  frame(x: number, y: number, w: number, h: number, c: string): this {
    this.rect(x, y, w, 1, c).rect(x, y + h - 1, w, 1, c);
    return this.rect(x, y, 1, h, c).rect(x + w - 1, y, 1, h, c);
  }

  /** Dama tahtası deseniyle yarı ton (kenar yumuşatmasız geçiş). */
  dither(x: number, y: number, w: number, h: number, c: string, faz = 0): this {
    this.ctx.fillStyle = c;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + j + faz) % 2 === 0) this.ctx.fillRect(x + i, y + j, 1, 1);
    return this;
  }

  /** Rastgele benekler (kâğıt ve ahşap dokusu). */
  benek(x: number, y: number, w: number, h: number, c: string, yogunluk: number, rnd: () => number): this {
    this.ctx.fillStyle = c;
    const n = Math.floor(w * h * yogunluk);
    for (let k = 0; k < n; k++) this.ctx.fillRect(x + Math.floor(rnd() * w), y + Math.floor(rnd() * h), 1, 1);
    return this;
  }

  /** Bresenham çizgisi. */
  line(x0: number, y0: number, x1: number, y1: number, c: string, kalin = 1): this {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.rect(x0, y0, kalin, kalin, c);
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
    return this;
  }

  /** Piksel daire (dolu ya da halka). */
  daire(cx: number, cy: number, r: number, c: string, halka = false): this {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++) {
        const d = Math.sqrt(x * x + y * y);
        if (halka ? d <= r + 0.5 && d > r - 0.5 : d <= r + 0.3) this.px(cx + x, cy + y, c);
      }
    return this;
  }

  /** Değişiklikleri GPU'ya gönder; filtre en yakın komşu kalsın. */
  yenile(): this {
    this.tex.refresh();
    this.tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    return this;
  }

  /** Tuvali görüntü olarak sahneye koy (varsayılan: ortası x,y; ölçek PX). Görüntü yok olunca doku silinir. */
  goruntu(x = 0, y = 0, olcek = PX): Phaser.GameObjects.Image {
    this.yenile();
    const img = this.scene.add.image(x, y, this.key).setScale(olcek);
    img.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.scene.textures.exists(this.key)) this.scene.textures.remove(this.key);
    });
    return img;
  }
}

/** Basit tohumlu rastgele (mulberry32), görsel çeşitlilik için. */
export function rastgele(tohum: number): () => number {
  let s = tohum >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Dizgiden sayı tohumu. */
export function dizgiTohum(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
