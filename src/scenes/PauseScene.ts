import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { HEIGHT, WIDTH } from '../config';
import { Button } from '../ui/Button';
import { MenuNav } from '../ui/MenuNav';
import { label } from '../ui/text';
import { SCENES } from './keys';

/** Oyun sahnesinin üstünde açılan duraklatma katmanı. */
export class PauseScene extends Phaser.Scene {
  private from: string = SCENES.Game;

  constructor() {
    super(SCENES.Pause);
  }

  init(data: { from?: string }): void {
    this.from = data.from ?? SCENES.Game;
  }

  create(): void {
    sfx.play('click');
    const dim = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.65).setOrigin(0).setInteractive();
    dim.setAlpha(0);
    this.tweens.add({ targets: dim, alpha: 1, duration: 150 });

    label(this, WIDTH / 2, 270, 'Duraklatıldı', { size: 88, weight: 'bold' });

    const resume = (): void => {
      this.scene.resume(this.from);
      this.scene.stop();
    };
    const buttons = [
      new Button(this, WIDTH / 2, 470, 'Devam', resume),
      new Button(this, WIDTH / 2, 592, 'Yeniden Başla', () => {
        this.scene.stop(this.from);
        this.scene.start(this.from);
      }),
      new Button(this, WIDTH / 2, 714, 'Ayarlar', () => {
        this.scene.launch(SCENES.Settings, { from: SCENES.Pause, overlay: true });
        // Uyut: ayarlar açıkken bu menü görünmesin; ayarlar kapanınca uyandırılır.
        this.scene.sleep();
      }),
      new Button(this, WIDTH / 2, 836, 'Ana Menü', () => {
        this.scene.stop(this.from);
        this.scene.start(SCENES.Menu);
      }, { sound: 'back' }),
    ];
    new MenuNav(this, buttons, { back: resume });
  }
}
