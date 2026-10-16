import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { COLORS, HEIGHT, WIDTH } from '../config';
import { fadeIn, goTo } from '../systems/transition';
import { TEX } from '../systems/textures';
import { addBackdrop } from '../ui/backdrop';
import { label } from '../ui/text';
import { SCENES } from './keys';

/**
 * "Başlamak için tıkla" ekranı. Tarayıcılar ilk kullanıcı etkileşiminden önce sesi açmaz;
 * bu ekran sayesinde menü müziği ve efektler ilk andan itibaren duyulur.
 */
export class GateScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Gate);
  }

  create(): void {
    fadeIn(this);
    addBackdrop(this);

    const play = this.add.container(WIDTH / 2, HEIGHT / 2 - 40);
    const ring = this.add.image(0, 0, TEX.ring).setScale(2.6).setTint(COLORS.primary);
    const icon = this.add.graphics().fillStyle(COLORS.primary).fillTriangle(-22, -38, -22, 38, 44, 0);
    play.add([ring, icon]);
    this.tweens.add({ targets: play, scale: 1.08, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const hint = label(this, WIDTH / 2, HEIGHT / 2 + 150, 'Başlamak için tıkla ya da bir tuşa bas', { size: 48, color: COLORS.muted });
    this.tweens.add({ targets: hint, alpha: 0.35, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const start = (): void => {
      sfx.play('confirm');
      goTo(this, SCENES.Splash);
    };
    this.input.once(Phaser.Input.Events.POINTER_UP, start);
    this.input.keyboard?.once(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, start);
  }
}
