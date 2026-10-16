// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import { num, PAL } from '../desk/palette';
import { PX, snap } from '../desk/pixel';

export interface ButtonOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  /** Odakta gövde rengi (varsayılan damga sarısı). */
  color?: number;
  /** Basınca çalınacak efekt; null ise ses yok. */
  sound?: string | null;
}

/** Fare ve klavyeyle (MenuNav) kullanılan, sesli ve animasyonlu buton (masa tarzı piksel düğme). */
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
    this.boxWidth = snap(opts.width ?? 460, PX * 2);
    this.boxHeight = snap(opts.height ?? 88, PX * 2);
    this.accent = opts.color ?? num(PAL.damgaGuclendir);
    this.pressSound = opts.sound === undefined ? 'confirm' : opts.sound;

    this.bg = scene.add.graphics();
    this.label = scene.add
      .text(0, 0, text, { fontFamily: FONT, fontSize: `${opts.fontSize ?? 50}px`, color: PAL.kremAcik })
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

  /**
   * Masa tarzı piksel düğme (props.pikselDugme ile aynı dil): koyu çerçeve, köşesiz gövde, üstte açık, altta
   * koyu çizgi. Odakta damga sarısı gövde, koyu yazı.
   */
  private draw(): void {
    const w = this.boxWidth;
    const h = this.boxHeight;
    const x = -w / 2;
    const y = -h / 2;
    const g = this.bg;
    const govde = this.focused ? this.accent : num(PAL.tezgah);
    const acik = this.focused ? 0xd0ad52 : num(PAL.tezgahAcik);
    const koyu = this.focused ? 0x8a6a20 : num(PAL.tezgahKoyu);
    g.clear();
    g.fillStyle(0x000000, 0.4).fillRect(x + PX, y + PX * 2, w, h);
    g.fillStyle(num(PAL.cerceveKoyu)).fillRect(x, y, w, h);
    g.fillStyle(govde).fillRect(x + PX, y + PX, w - PX * 2, h - PX * 2);
    g.fillStyle(acik).fillRect(x + PX, y + PX, w - PX * 2, PX);
    g.fillStyle(koyu).fillRect(x + PX, y + h - PX * 2, w - PX * 2, PX);
    this.label.setColor(this.focused ? PAL.panel : PAL.kremAcik);
  }
}
