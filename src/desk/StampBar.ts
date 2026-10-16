// @beyan görsel
import * as Phaser from 'phaser';
import { COLORS } from '../config';
import type { Damga } from '../game/building';
import { Button } from '../ui/Button';

const DUGMELER: { damga: Damga; etiket: string; renk: number }[] = [
  { damga: 'guvenli', etiket: 'GÜVENLİ', renk: COLORS.success },
  { damga: 'guclendir', etiket: 'GÜÇLENDİR', renk: COLORS.primary },
  { damga: 'bosalt', etiket: 'BOŞALT', renk: COLORS.danger },
];

/** Üç damga düğmesi (dikey). */
export class StampBar {
  readonly dugmeler = new Map<Damga, Button>();

  constructor(scene: Phaser.Scene, x: number, y: number, onStamp: (d: Damga) => void) {
    DUGMELER.forEach((d, i) => {
      const b = new Button(scene, x, y + i * 140, d.etiket, () => onStamp(d.damga), {
        width: 270,
        height: 110,
        fontSize: 36,
        color: d.renk,
        sound: null,
      });
      b.setDepth(2000);
      this.dugmeler.set(d.damga, b);
    });
  }
}
