import * as Phaser from 'phaser';
import { loadAssets } from '../assets';
import { COLORS, HEIGHT, WIDTH } from '../config';
import { label } from '../ui/text';
import { SCENES } from './keys';

/** src/assets.ts'deki dosyaları yükleme çubuğuyla yükler. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Preload);
  }

  preload(): void {
    const w = 640;
    const h = 18;
    const x = WIDTH / 2 - w / 2;
    const y = HEIGHT / 2;
    const bar = this.add.graphics();
    const percent = label(this, WIDTH / 2, y + 70, '%0', { size: 30, color: COLORS.muted, mono: true });

    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => {
      bar.clear();
      bar.fillStyle(COLORS.panel).fillRoundedRect(x, y, w, h, h / 2);
      bar.fillStyle(COLORS.primary).fillRoundedRect(x, y, Math.max(h, w * value), h, h / 2);
      percent.setText(`%${Math.round(value * 100)}`);
    });

    loadAssets(this.load);
  }

  create(): void {
    this.scene.start(SCENES.Gate);
  }
}
