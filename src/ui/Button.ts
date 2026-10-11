import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { COLORS, css, FONT } from '../config';

export interface ButtonOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  /** Kenar ve odak rengi. */
  color?: number;
  /** Basınca çalınacak efekt; null ise ses yok. */
  sound?: string | null;
}

/** Fare ve klavyeyle (MenuNav) kullanılan, sesli ve animasyonlu buton. */
export class Button extends Phaser.GameObjects.Container {
  readonly label: Phaser.GameObjects.Text;
  /** MenuNav, fare üstüne gelince odağı güncellemek için kullanır. */
  onFocus?: () => void;
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly boxWidth: number;
  private readonly boxHeight: number;
  private readonly accent: number;
  private readonly pressSound: string | null;
  private readonly action: () => void;
  private focused = false;
  private pressed = false;
  private enabled = true;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, action: () => void, opts: ButtonOptions = {}) {
    super(scene, x, y);
    this.action = action;
    this.boxWidth = opts.width ?? 460;
    this.boxHeight = opts.height ?? 96;
    this.accent = opts.color ?? COLORS.primary;
    this.pressSound = opts.sound === undefined ? 'confirm' : opts.sound;

    this.bg = scene.add.graphics();
    this.label = scene.add
      .text(0, 0, text, { fontFamily: FONT, fontSize: `${opts.fontSize ?? 40}px`, fontStyle: 'bold', color: css(COLORS.text) })
      .setOrigin(0.5);
    this.add([this.bg, this.label]);

    this.setSize(this.boxWidth, this.boxHeight);
    this.setInteractive({ useHandCursor: true });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => this.setFocused(true));
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      this.pressed = false;
      this.setFocused(false);
    });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.pressed = true;
      scene.tweens.add({ targets: this, scale: 0.95, duration: 60 });
    });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      if (!this.pressed) return;
      this.pressed = false;
      this.press();
    });

    this.draw();
    scene.add.existing(this);
  }

  setFocused(on: boolean): this {
    if (this.focused === on) return this;
    this.focused = on;
    if (on) {
      sfx.play('hover');
      this.onFocus?.();
    }
    this.scene.tweens.add({ targets: this, scale: on ? 1.05 : 1, duration: 120, ease: 'Quad.easeOut' });
    this.draw();
    return this;
  }

  /** Butona basılmış gibi davran (klavyeden seçimde de kullanılır). */
  press(): void {
    if (!this.enabled) return;
    if (this.pressSound) sfx.play(this.pressSound);
    this.scene.tweens.add({ targets: this, scale: { from: 0.93, to: this.focused ? 1.05 : 1 }, duration: 180, ease: 'Back.easeOut' });
    this.action();
  }

  setLabel(text: string): this {
    this.label.setText(text);
    return this;
  }

  setEnabled(on: boolean): this {
    this.enabled = on;
    this.setAlpha(on ? 1 : 0.4);
    return this;
  }

  private draw(): void {
    const w = this.boxWidth;
    const h = this.boxHeight;
    const radius = Math.min(22, h / 2);
    this.bg.clear();
    this.bg.fillStyle(0x000000, 0.35).fillRoundedRect(-w / 2 + 4, -h / 2 + 8, w, h, radius);
    this.bg.fillStyle(this.focused ? this.accent : COLORS.panel, 1).fillRoundedRect(-w / 2, -h / 2, w, h, radius);
    this.bg.lineStyle(4, this.accent, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
    this.label.setColor(css(this.focused ? COLORS.bg : COLORS.text));
  }
}
