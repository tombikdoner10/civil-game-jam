import * as Phaser from 'phaser';
import { COLORS, DEV, HEIGHT, WIDTH } from '../config';
import { Controls } from '../systems/controls';
import { fadeIn, goTo } from '../systems/transition';
import { label } from '../ui/text';
import { SCENES } from './keys';

/**
 * OYUN SAHNESİ: tema açıklandıktan sonra (16 Ekim 18.00) burası yazılacak.
 * Şimdilik yalnızca altyapıyı bağlayan boş bir iskelet: duraklatma, odak kaybında
 * otomatik duraklatma ve sonuç ekranına geçiş.
 */
export class GameScene extends Phaser.Scene {
  private controls!: Controls;

  constructor() {
    super(SCENES.Game);
  }

  create(): void {
    fadeIn(this);
    this.controls = new Controls(this);
    if (DEV) this.input.keyboard?.on('keydown-ENTER', () => this.endGame(Phaser.Math.Between(10, 999), true));

    label(this, WIDTH / 2, HEIGHT / 2 - 40, 'Oyun burada olacak', { size: 72, weight: 'bold' });
    label(this, WIDTH / 2, HEIGHT / 2 + 50, `Esc / P: duraklat${DEV ? '   ·   Enter: sonuç ekranını dene' : ''}`, { size: 32, color: COLORS.muted });

    // Pencere odağı kaçarsa (alt-tab, başka sekme) oyunu duraklat.
    const onBlur = (): void => {
      if (this.scene.isActive()) this.pauseGame();
    };
    this.game.events.on(Phaser.Core.Events.BLUR, onBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(Phaser.Core.Events.BLUR, onBlur));
  }

  update(): void {
    if (this.controls.justDown('pause')) this.pauseGame();
  }

  pauseGame(): void {
    this.scene.launch(SCENES.Pause, { from: SCENES.Game });
    this.scene.pause();
  }

  endGame(score: number, won: boolean): void {
    goTo(this, SCENES.Result, { score, won });
  }
}
