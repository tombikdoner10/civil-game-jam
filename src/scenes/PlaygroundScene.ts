import * as Phaser from 'phaser';
import { jingles, music } from '../audio/music';
import { sfx } from '../audio/sfx';
import { TEST_JINGLE, TEST_LOOP } from '../audio/songs';
import { COLORS, HEIGHT, WIDTH } from '../config';
import { burst, flash, floatText, hitStop, punch, shake, squash } from '../systems/fx';
import { TEX } from '../systems/textures';
import { fadeIn, goTo } from '../systems/transition';
import { Button } from '../ui/Button';
import { label } from '../ui/text';
import { SCENES } from './keys';

const ARENA_TOP = 640;
const PALETTE = [COLORS.primary, COLORS.accent, COLORS.danger, COLORS.success];

/**
 * Geliştirici oyun alanı (yalnızca dev modunda menüde görünür).
 * Ses efektlerini, müzik sıralayıcıyı ve efekt yardımcılarını denemek ve ayarlamak için.
 */
export class PlaygroundScene extends Phaser.Scene {
  private ball!: Phaser.Physics.Arcade.Image;
  private musicLabel!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.Playground);
  }

  create(): void {
    fadeIn(this);
    label(this, WIDTH / 2, 70, 'Oyun Alanı · sistem testi', { size: 52, weight: 'bold' });
    label(this, WIDTH / 2, 135, 'Boşluğa tıkla: patlama   ·   M: test müziği   ·   J: jingle   ·   H: kare donması   ·   Esc: menü', {
      size: 28,
      color: COLORS.muted,
    });
    this.musicLabel = label(this, WIDTH / 2, 185, '', { size: 26, color: COLORS.accent, mono: true });
    this.updateMusicLabel();

    sfx.names().forEach((name, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      new Button(this, WIDTH / 2 + (col - 1.5) * 330, 265 + row * 92, name, () => sfx.play(name), {
        width: 300,
        height: 72,
        fontSize: 28,
        color: PALETTE[col],
        sound: null,
      });
    });

    this.add.rectangle(WIDTH / 2, ARENA_TOP, WIDTH - 120, 4, COLORS.panelHi);
    this.physics.world.setBounds(60, ARENA_TOP, WIDTH - 120, HEIGHT - ARENA_TOP - 40);
    this.ball = this.physics.add.image(WIDTH / 2, ARENA_TOP + 150, TEX.dot).setTint(COLORS.accent).setScale(2);
    this.ball.setCollideWorldBounds(true, 1, 1, true).setVelocity(520, 380);
    this.physics.world.on(Phaser.Physics.Arcade.Events.WORLD_BOUNDS, () => {
      sfx.play('thud', { pan: (this.ball.x / WIDTH) * 2 - 1 });
      squash(this, this.ball, 0.3);
      burst(this, this.ball.x, this.ball.y, { color: COLORS.accent, count: 8, speed: 260, lifespan: 380, scale: 0.5 });
    });

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0) return;
      burst(this, p.x, p.y, { color: PALETTE, count: 36 });
      floatText(this, p.x, p.y - 30, '+10', COLORS.primary);
      shake(this);
      punch(this);
      sfx.play('explosion', { pan: (p.x / WIDTH) * 2 - 1 });
    });

    const keyboard = this.input.keyboard;
    keyboard?.on('keydown-M', () => {
      if (music.current === TEST_LOOP) music.stop();
      else music.play(TEST_LOOP);
      this.updateMusicLabel();
    });
    keyboard?.on('keydown-J', () => jingles.play(TEST_JINGLE));
    keyboard?.on('keydown-H', () => {
      flash(this, COLORS.text, 80);
      sfx.play('hit');
      burst(this, this.ball.x, this.ball.y, { color: COLORS.danger, count: 30 });
      hitStop(this, 140);
    });
    keyboard?.on('keydown-ESC', () => goTo(this, SCENES.Menu));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (music.current === TEST_LOOP) music.stop();
    });
  }

  private updateMusicLabel(): void {
    this.musicLabel.setText(`müzik: ${music.current === TEST_LOOP ? 'test döngüsü çalıyor' : 'kapalı'}`);
  }
}
