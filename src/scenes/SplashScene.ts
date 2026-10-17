import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { HEIGHT, TEAM, WIDTH } from '../config';
import { num, PAL } from '../desk/palette';
import { fadeIn, goTo } from '../systems/transition';
import { label } from '../ui/text';
import { SCENES } from './keys';

let shown = false;
/** Açılış geçişi sırasında (Gate kararırken) tıklama ya da tuş geldi: logo hemen geçilsin (G23). */
let atlaIstendi = false;

/**
 * Gate'ten Splash'e geçiş sürerken (Phaser girdisi kapalıyken) gelen tıklama ve tuşları yakalar; Splash açılınca
 * hemen menüye geçer. Girdi tarayıcı düzeyinde dinlenir, oyuna (menü düğmelerine) iletilmez.
 */
export function splashAtlaDinle(): void {
  const dinle = (): void => {
    atlaIstendi = true;
    temizle();
  };
  const temizle = (): void => {
    window.removeEventListener('pointerdown', dinle);
    window.removeEventListener('keydown', dinle);
  };
  window.addEventListener('pointerdown', dinle);
  window.addEventListener('keydown', dinle);
  // Splash kendi girdisini dinlemeye başlayınca bu dinleyici kalkar (en geç 1 sn sonra).
  window.setTimeout(temizle, 1000);
}

/** Logo süreleri (ms): yazmaya başlama, harf başına, yazı bitince bekleme. Toplam ~1,1 sn (+ geçişler). */
const SURE = { bas: 100, harf: 28, bekle: 420 };

/**
 * Takım logosu: komut satırına yazılıyormuş gibi "> PROMPT ENGINEERS". Oturumda bir kez; tıklayınca ya da bir
 * tuşa basınca hemen geçilir (Gate'ten geçiş sürerken gelen girdi de sayılır, G23). Kısa tutuldu: jüri oyunu 3
 * dakikalık sunum sırasında oynuyor.
 */
export class SplashScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Splash);
  }

  create(): void {
    if (shown || atlaIstendi) {
      // Oturumda bir kez; geçiş sırasında tıklandıysa (G23) logo hiç beklemeden geçilir.
      shown = true;
      atlaIstendi = false;
      this.scene.start(SCENES.Menu);
      return;
    }
    shown = true;
    fadeIn(this, 160);
    this.cameras.main.setBackgroundColor(PAL.panel);

    const name = TEAM.toUpperCase();
    const size = 84;
    const y = HEIGHT / 2 - 30;
    const prompt = label(this, 0, y, '>', { size, color: num(PAL.saat), align: 'left' });
    const typed = label(this, 0, y, name, { size, color: num(PAL.kremAcik), align: 'left' });
    const gap = size * 0.6;
    const startX = WIDTH / 2 - (prompt.width + gap + typed.width) / 2;
    prompt.setX(startX);
    typed.setX(startX + prompt.width + gap).setText('');
    const cursor = this.add.rectangle(typed.x, y, size * 0.55, size * 1.05, num(PAL.saat)).setOrigin(0, 0.5);
    const subtitle = label(this, WIDTH / 2, y + 120, 'sunar', { size: 48, color: num(PAL.panelYazi) }).setAlpha(0);

    const skip = (): void => goTo(this, SCENES.Menu, undefined, 200);
    this.input.once(Phaser.Input.Events.POINTER_DOWN, skip);
    this.input.keyboard?.once(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, skip);

    let count = 0;
    const typeNext = (): void => {
      count++;
      typed.setText(name.slice(0, count));
      cursor.setX(typed.x + typed.width + 8);
      if (count % 2 === 1 && name[count - 1] !== ' ') sfx.play('type');
      if (count < name.length) return;
      this.tweens.add({ targets: cursor, alpha: 0, duration: 200, yoyo: true, repeat: -1, ease: 'Stepped' });
      this.tweens.add({ targets: subtitle, alpha: 1, duration: 150 });
      this.time.delayedCall(SURE.bekle, skip);
    };
    this.time.delayedCall(SURE.bas, () => this.time.addEvent({ delay: SURE.harf, repeat: name.length - 1, callback: typeNext }));
  }
}
