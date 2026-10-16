// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { num, PAL } from '../desk/palette';
import { PX, snap } from '../desk/pixel';

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

  /** Masa tarzı: koyu oluk, damga sarısı dolgu, piksel sürgü (köşesiz, 4 px ızgarası). */
  private draw(): void {
    const w = this.barWidth;
    const h = 24;
    const x0 = -w / 2;
    const filled = snap(w * this.value);
    const g = this.gfx;
    g.clear();
    g.fillStyle(num(PAL.cerceveKoyu)).fillRect(x0 - PX, -h / 2 - PX, w + PX * 2, h + PX * 2);
    g.fillStyle(num(PAL.tezgahKoyu)).fillRect(x0, -h / 2, w, h);
    if (filled > 0) {
      g.fillStyle(num(PAL.damgaGuclendir)).fillRect(x0, -h / 2, filled, h);
      g.fillStyle(0xd0ad52).fillRect(x0, -h / 2, filled, PX);
    }
    const sx = snap(x0 + filled);
    g.fillStyle(num(PAL.cerceveKoyu)).fillRect(sx - 12, -28, 24, 56);
    g.fillStyle(num(PAL.kremAcik)).fillRect(sx - 8, -24, 16, 48);
    g.fillStyle(num(PAL.kremKoyu)).fillRect(sx - 8, 16, 16, 8);
  }
}
