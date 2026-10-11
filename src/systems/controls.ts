import * as Phaser from 'phaser';

export type Action = 'left' | 'right' | 'up' | 'down' | 'action' | 'alt' | 'pause';

/** Varsayılan tuşlar. Oyuna göre burada değiştir; README'deki kontrol listesini de güncelle. */
export const BINDINGS: Record<Action, string[]> = {
  left: ['LEFT', 'A'],
  right: ['RIGHT', 'D'],
  up: ['UP', 'W'],
  down: ['DOWN', 'S'],
  action: ['SPACE', 'Z', 'J'],
  alt: ['X', 'K', 'SHIFT'],
  pause: ['ESC', 'P'],
};

/** Klavye girdisini eylem adlarıyla okur: controls.isDown('left'), controls.justDown('action'). */
export class Controls {
  private readonly keys = {} as Record<Action, Phaser.Input.Keyboard.Key[]>;
  /**
   * Son kareden beri basılan eylemler. Phaser'ın JustDown'ı, aynı kare içinde basılıp bırakılan
   * tuşu kaçırır; burada basış, tuşun "down" olayı anında kaydedilir ve kare sonunda temizlenir.
   */
  private readonly pressed = new Set<Action>();

  constructor(scene: Phaser.Scene, bindings: Record<Action, string[]> = BINDINGS) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Klavye eklentisi kapalı');
    for (const action of Object.keys(bindings) as Action[]) {
      this.keys[action] = bindings[action].map((name) => {
        const key = keyboard.addKey(name);
        key.on(Phaser.Input.Keyboard.Events.DOWN, () => this.pressed.add(action));
        return key;
      });
    }
    const clear = (): void => this.pressed.clear();
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, clear);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.POST_UPDATE, clear));
  }

  isDown(action: Action): boolean {
    return this.keys[action].some((key) => key.isDown);
  }

  /** Son kareden beri basıldı mı? (Ateş, zıpla, duraklat gibi tek seferlik eylemler için.) */
  justDown(action: Action): boolean {
    return this.pressed.has(action);
  }

  /** Yön ekseni (-1..1); çaprazda hız artmasın diye normalize edilir. */
  axis(): Phaser.Math.Vector2 {
    const v = new Phaser.Math.Vector2(
      Number(this.isDown('right')) - Number(this.isDown('left')),
      Number(this.isDown('down')) - Number(this.isDown('up')),
    );
    return v.lengthSq() > 1 ? v.normalize() : v;
  }
}
