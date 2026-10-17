// @beyan görsel
import * as Phaser from 'phaser';
import { PAL } from '../desk/palette';
import { PX, rastgele, snap, Tuval } from '../desk/pixel';

export interface KagitSecenek {
  /** Kâğıt rengi ve kenar/benek rengi (varsayılan krem). */
  renk?: string;
  koyu?: string;
  /** Üstte koyu kırmızı başlık şeridi (ruhsattaki gibi), ekran pikseli yüksekliği. 0 = yok. */
  serit?: number;
  /** Ruhsat süsü (G11): iç çerçeve ve başlık şeridinin üst/alt kenarında noktalı süs (masadaki ruhsat gibi). */
  ruhsat?: boolean;
  /** Mühür (G11): kâğıdın sol üstünden sanat pikseli olarak ortası; ruhsattaki gibi halka içinde yıldız. */
  muhur?: [number, number];
  tohum?: number;
}

/**
 * Menü ekranlarının kâğıdı: masa belgeleriyle aynı dil (benekli krem kâğıt, koyu kenar, alt gölge, kıvrık köşe).
 * (x, y) ortası; boyut 4 px ızgarasına yuvarlanır. Kap döner (gölge + kâğıt).
 */
export function kagitPanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, o: KagitSecenek = {}): Phaser.GameObjects.Container {
  const renk = o.renk ?? PAL.krem;
  const koyu = o.koyu ?? PAL.kremKoyu;
  const W = Math.round(snap(w) / PX);
  const H = Math.round(snap(h) / PX);
  const t = new Tuval(scene, W, H, 'menu-kagit');
  const rnd = rastgele(o.tohum ?? W * 131 + H);
  t.rect(0, 0, W, H, renk);
  t.benek(0, 0, W, H, koyu, 0.035, rnd);
  t.benek(0, 0, W, H, '#ffffff10', 0.02, rnd);
  t.frame(0, 0, W, H, koyu);
  t.dither(1, H - 2, W - 2, 1, koyu);
  t.dither(W - 2, 1, 1, H - 2, koyu, 1);
  // Sağ üstte kıvrık köşe
  for (let i = 0; i < 4; i++) t.ctx.clearRect(W - 4 + i, 0, 1, 4 - i);
  for (let i = 0; i < 4; i++) t.rect(W - 5, i, i + 1, 1, koyu);
  t.rect(W - 4, 4, 4, 1, koyu);
  if (o.ruhsat) t.frame(2, 2, W - 4, H - 4, koyu);
  const serit = Math.round((o.serit ?? 0) / PX);
  if (serit > 0) {
    t.rect(3, 3, W - 9, serit, PAL.basikSerit);
    t.dither(3, 3 + serit, W - 9, 1, PAL.basikSerit);
    if (o.ruhsat)
      for (let x = 3; x < W - 7; x += 2) {
        t.px(x, 3, '#7a4a42');
        t.px(x + 1, 2 + serit, '#7a4a42');
      }
  }
  if (o.muhur) muhurCiz(t, o.muhur[0], o.muhur[1], renk, rnd);
  const kap = scene.add.container(snap(x), snap(y));
  kap.add(scene.add.rectangle(PX, PX * 2, W * PX, H * PX, 0x000000, 0.4));
  kap.add(t.goruntu(0, 0));
  return kap;
}

/** Ruhsat mührü (masadaki ruhsatın mührünün büyüğü): iki halka, içinde beş kollu yıldız, yer yer mürekkep almamış. */
function muhurCiz(t: Tuval, cx: number, cy: number, kagit: string, rnd: () => number): void {
  const c = PAL.muhur;
  t.daire(cx, cy, 10, c, true);
  t.daire(cx, cy, 8, c, true);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    t.line(cx, cy, cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, c);
  }
  // Mürekkep almamış pikseller kâğıt renginde.
  for (let i = 0; i < 22; i++) t.px(cx - 11 + Math.floor(rnd() * 22), cy - 11 + Math.floor(rnd() * 22), kagit);
}
