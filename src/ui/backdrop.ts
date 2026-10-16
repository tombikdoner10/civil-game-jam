// @beyan görsel
import * as Phaser from 'phaser';
import { COLORS, HEIGHT, WIDTH } from '../config';
import { TEX } from '../systems/textures';

/** Menü ekranlarının sade arka planı: yavaşça yükselen ışık lekeleri. Tema belli olunca değiştir. */
export function addBackdrop(scene: Phaser.Scene, color: number = COLORS.accent): void {
  scene.add
    .particles(0, 0, TEX.soft, {
      x: { min: 0, max: WIDTH },
      y: { min: HEIGHT * 0.1, max: HEIGHT + 60 },
      lifespan: 9000,
      speedY: { min: -50, max: -15 },
      speedX: { min: -10, max: 10 },
      scale: { start: 2, end: 0.3 },
      alpha: { start: 0.14, end: 0 },
      tint: color,
      frequency: 140,
      advance: 9000,
      blendMode: Phaser.BlendModes.ADD,
    })
    .setDepth(-10);
}
