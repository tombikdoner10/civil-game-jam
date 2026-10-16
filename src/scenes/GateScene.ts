import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { HEIGHT, WIDTH } from '../config';
import { num, PAL } from '../desk/palette';
import { fadeIn, goTo } from '../systems/transition';
import { addBackdrop } from '../ui/backdrop';
import { kagitPanel } from '../ui/kagit';
import { label } from '../ui/text';
import { SCENES } from './keys';

/**
 * "Başlamak için tıkla" ekranı. Tarayıcılar ilk kullanıcı etkileşiminden önce sesi açmaz; bu ekran sayesinde
 * efektler ilk andan itibaren duyulur. Masa tarzı: masada küçük bir not kâğıdı, tek tık.
 */
export class GateScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Gate);
  }

  create(): void {
    fadeIn(this);
    addBackdrop(this);

    kagitPanel(this, WIDTH / 2, HEIGHT / 2, 640, 200, { renk: PAL.not, koyu: PAL.notKoyu, tohum: 5 });
    const ipucu = label(this, WIDTH / 2, HEIGHT / 2 - 20, 'Başlamak için tıkla', { size: 56, color: num(PAL.murekkep) });
    label(this, WIDTH / 2, HEIGHT / 2 + 40, 'ya da bir tuşa bas', { size: 34, color: num(PAL.murekkepSoluk) });
    this.tweens.add({ targets: ipucu, alpha: 0.45, duration: 700, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [3] });

    const start = (): void => {
      sfx.play('confirm');
      goTo(this, SCENES.Splash, undefined, 160);
    };
    this.input.once(Phaser.Input.Events.POINTER_UP, start);
    this.input.keyboard?.once(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, start);
  }
}
