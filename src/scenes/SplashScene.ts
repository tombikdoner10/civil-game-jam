import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { COLORS, HEIGHT, TEAM, WIDTH } from '../config';
import { fadeIn, goTo } from '../systems/transition';
import { label } from '../ui/text';
import { SCENES } from './keys';

let shown = false;

/**
 * Takım logosu: komut satırına yazılıyormuş gibi "> PROMPT ENGINEERS". Oturumda bir kez, tıklayınca geçilir.
 * Kısa tutuldu (~1,8 sn): jüri oyunu 3 dakikalık sunum sırasında oynuyor, her saniye değerli.
 */
export class SplashScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Splash);
  }

  create(): void {
    if (shown) {
      this.scene.start(SCENES.Menu);
      return;
    }
    shown = true;
    fadeIn(this);

    const name = TEAM.toUpperCase();
    const size = 84;
    const y = HEIGHT / 2 - 30;
    const prompt = label(this, 0, y, '>', { size, mono: true, weight: 'bold', color: COLORS.primary, align: 'left' });
    const typed = label(this, 0, y, name, { size, mono: true, weight: 'bold', align: 'left' });
    const gap = size * 0.6;
    const startX = WIDTH / 2 - (prompt.width + gap + typed.width) / 2;
    prompt.setX(startX);
    typed.setX(startX + prompt.width + gap).setText('');
    const cursor = this.add.rectangle(typed.x, y, size * 0.55, size * 1.05, COLORS.primary).setOrigin(0, 0.5);
    const subtitle = label(this, WIDTH / 2, y + 130, 'sunar', { size: 40, color: COLORS.muted }).setAlpha(0);

    const skip = (): void => goTo(this, SCENES.Menu, undefined, 250);
    this.input.once(Phaser.Input.Events.POINTER_UP, skip);
    this.input.keyboard?.once(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, skip);

    let count = 0;
    const typeNext = (): void => {
      count++;
      typed.setText(name.slice(0, count));
      cursor.setX(typed.x + typed.width + 8);
      if (name[count - 1] !== ' ') sfx.play('type');
      if (count < name.length) return;
      this.tweens.add({ targets: cursor, alpha: 0, duration: 300, yoyo: true, repeat: -1, ease: 'Stepped' });
      this.tweens.add({ targets: subtitle, alpha: 1, duration: 250, delay: 50 });
      this.time.delayedCall(700, skip);
    };
    this.time.delayedCall(150, () => this.time.addEvent({ delay: 40, repeat: name.length - 1, callback: typeNext }));
  }
}
