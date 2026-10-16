// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { COLORS } from '../config';

/** Tıklanıp sürüklenebilen 0..1 değer çubuğu (ses ayarları için). */
export class ValueBar extends Phaser.GameObjects.Container {
  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly barWidth: number;
  private readonly onChange: (value: number) => void;
  private value: number;
  private lastTick = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, value: number, onChange: (value: number) => void) {
    super(scene, x, y);
    this.barWidth = width;
    this.value = value;
    this.onChange = onChange;
    this.gfx = scene.add.graphics();
    this.add(this.gfx);

    this.setSize(width + 40, 64);
    this.setInteractive({ useHandCursor: true, draggable: true });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => this.setFromPointer(p));
    this.on(Phaser.Input.Events.GAMEOBJECT_DRAG, (p: Phaser.Input.Pointer) => this.setFromPointer(p));

    this.draw();
    scene.add.existing(this);
  }

  getValue(): number {
    return this.value;
  }

  setValue(value: number, notify = true): this {
    const v = Phaser.Math.Clamp(Math.round(value * 20) / 20, 0, 1);
    if (v === this.value) return this;
    this.value = v;
    this.draw();
    if (notify) {
      this.onChange(v);
      const now = this.scene.time.now;
      if (now - this.lastTick > 50) {
        sfx.play('type', { rate: 0.7 + v * 0.8 });
        this.lastTick = now;
      }
    }
    return this;
  }

  private setFromPointer(p: Phaser.Input.Pointer): void {
    const left = this.x - this.barWidth / 2;
    this.setValue((p.x - left) / this.barWidth);
  }

  private draw(): void {
    const w = this.barWidth;
    const h = 18;
    const filled = Math.max(h, w * this.value);
    this.gfx.clear();
    this.gfx.fillStyle(COLORS.panelHi).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    if (this.value > 0) this.gfx.fillStyle(COLORS.primary).fillRoundedRect(-w / 2, -h / 2, filled, h, h / 2);
    this.gfx.fillStyle(COLORS.text).fillCircle(-w / 2 + w * this.value, 0, 20);
  }
}
