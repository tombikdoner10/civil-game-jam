import * as Phaser from 'phaser';
import type { Button } from './Button';

export interface MenuNavOptions {
  /** Butonlar yan yanaysa ←/→ ile gezin. */
  horizontal?: boolean;
  /** Esc / Backspace ile çalışacak geri eylemi. */
  back?: () => void;
  /**
   * Hiçbir düğme seçili değilken Enter/Boşluk bu düğmeye basar (G23: ana menüde ilk Enter "Oyna"yı açsın, yalnızca
   * seçmekle kalmasın). Verilmezse ilk Enter yalnızca ilk düğmeyi seçer.
   */
  varsayilan?: number;
}

/** Butonlar arasında klavyeyle gezinme: ↑/↓ (W/S) ile seç, Enter/Boşluk ile bas, Esc ile geri. */
export class MenuNav {
  private index = -1;

  constructor(scene: Phaser.Scene, private readonly buttons: Button[], opts: MenuNavOptions = {}) {
    buttons.forEach((button, i) => {
      button.onFocus = () => this.select(i, false);
    });

    const keyboard = scene.input.keyboard;
    if (!keyboard) return;
    const prev = opts.horizontal ? ['ArrowLeft', 'KeyA'] : ['ArrowUp', 'KeyW'];
    const next = opts.horizontal ? ['ArrowRight', 'KeyD'] : ['ArrowDown', 'KeyS'];

    const onKey = (event: KeyboardEvent): void => {
      // Basılı tutulan tuşun tekrarı sayılmaz (G23: logoyu geçen tuş menüde düğmeye basmasın).
      if (!scene.input.enabled || buttons.length === 0 || event.repeat) return;
      if (prev.includes(event.code)) this.move(-1);
      else if (next.includes(event.code)) this.move(1);
      else if (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Space') {
        if (this.index >= 0) this.buttons[this.index].press();
        else if (opts.varsayilan !== undefined) this.buttons[opts.varsayilan]?.press();
        else this.select(0);
      } else if (event.code === 'Escape' || event.code === 'Backspace') opts.back?.();
    };
    keyboard.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, onKey);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard.off(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, onKey));
  }

  private move(delta: number): void {
    const n = this.buttons.length;
    const from = this.index < 0 ? (delta > 0 ? -1 : 0) : this.index;
    this.select((from + delta + n) % n);
  }

  private select(i: number, focusTarget = true): void {
    this.buttons.forEach((button, j) => {
      if (j !== i) button.setFocused(false);
    });
    this.index = i;
    if (focusTarget) this.buttons[i].setFocused(true);
  }
}
