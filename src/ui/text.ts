import type * as Phaser from 'phaser';
import { BASLIK_FONT, COLORS, css, FONT } from '../config';

export interface LabelOptions {
  size?: number;
  color?: number;
  weight?: 'normal' | 'bold';
  /** Eski seçenek: artık bütün gövde metni VT323 (FONT). */
  mono?: boolean;
  /** Büyük başlık: Pixelify Sans (BASLIK_FONT). Yalnızca Z, B, C, E, 5 gibi karışan harfler içermeyen büyük başlıklarda. */
  baslik?: boolean;
  /** Hizalama aynı zamanda orijini belirler: left → sol kenar, right → sağ kenar, center → orta. */
  align?: 'left' | 'center' | 'right';
  /** Bu genişlikte satır kaydır (px). */
  wrap?: number;
  stroke?: boolean;
  lineSpacing?: number;
}

/** Projenin yazı stiliyle metin ekler. Dikeyde ortalıdır (orijin y = 0.5). */
export function label(scene: Phaser.Scene, x: number, y: number, text: string, o: LabelOptions = {}): Phaser.GameObjects.Text {
  const align = o.align ?? 'center';
  return scene.add
    .text(x, y, text, {
      fontFamily: o.baslik ? BASLIK_FONT : FONT,
      fontSize: `${o.size ?? 32}px`,
      // VT323'ün kalın kesimi yok; tarayıcının sahte kalını pikselleri bulandırıyor.
      fontStyle: o.baslik ? (o.weight ?? 'normal') : 'normal',
      color: css(o.color ?? COLORS.text),
      align,
      wordWrap: o.wrap ? { width: o.wrap, useAdvancedWrap: true } : undefined,
      stroke: o.stroke ? '#000000' : undefined,
      strokeThickness: o.stroke ? 6 : 0,
      lineSpacing: o.lineSpacing ?? 0,
    })
    .setOrigin(align === 'left' ? 0 : align === 'right' ? 1 : 0.5, 0.5);
}
