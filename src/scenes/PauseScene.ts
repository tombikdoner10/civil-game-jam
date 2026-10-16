import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { HEIGHT, WIDTH } from '../config';
import { num, PAL } from '../desk/palette';
import { Button } from '../ui/Button';
import { kagitPanel } from '../ui/kagit';
import { MenuNav } from '../ui/MenuNav';
import { label } from '../ui/text';
import { SCENES } from './keys';

/** Oyun sahnesinin üstünde açılan duraklatma katmanı: karartılmış masanın ortasında bir kâğıt. */
export class PauseScene extends Phaser.Scene {
  private from: string = SCENES.Game;
  /** Yeniden Başla'da sahneye verilecek veri (oyun sahnesi: aynı gün, aynı tohum ve para). */
  private yeniden?: object;

  constructor() {
    super(SCENES.Pause);
  }

  init(data: { from?: string; yeniden?: object }): void {
    this.from = data.from ?? SCENES.Game;
    this.yeniden = data.yeniden;
  }

  create(): void {
    sfx.play('click');
    this.cameras.main.setRoundPixels(true);
    const dim = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.65).setOrigin(0).setInteractive();
    dim.setAlpha(0);
    this.tweens.add({ targets: dim, alpha: 1, duration: 150 });

    // Kâğıt (y 192-952): üstte başlık şeridi, altında düğmeler (eski yerlerinde: 470, 592, 714, 836).
    kagitPanel(this, WIDTH / 2, 572, 640, 760, { serit: 112, tohum: 23 });
    label(this, WIDTH / 2, 262, 'Duraklatıldı', { size: 80, weight: 'bold', baslik: true, color: num(PAL.kremAcik) });

    const resume = (): void => {
      this.scene.resume(this.from);
      this.scene.stop();
    };
    const buttons = [
      new Button(this, WIDTH / 2, 470, 'Devam', resume),
      new Button(this, WIDTH / 2, 592, 'Yeniden Başla', () => {
        this.scene.stop(this.from);
        this.scene.start(this.from, this.yeniden);
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
    label(this, WIDTH / 2, 916, 'Esc: devam', { size: 30, color: num(PAL.murekkepSoluk) });
    new MenuNav(this, buttons, { back: resume });
  }
}
