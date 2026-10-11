import * as Phaser from 'phaser';
import { COLORS, VERSION } from '../config';
import { label } from '../ui/text';
import { SCENES } from './keys';

/** Her zaman en üstte çalışan hata ayıklama katmanı. F2: FPS, açık sahneler ve fizik çizimi. */
export class DebugScene extends Phaser.Scene {
  private info!: Phaser.GameObjects.Text;
  private enabled = false;

  constructor() {
    super(SCENES.Debug);
  }

  create(): void {
    this.info = label(this, 16, 16, '', { size: 22, mono: true, align: 'left', color: COLORS.success })
      .setOrigin(0, 0)
      .setPadding(10, 6, 10, 6)
      .setBackgroundColor('rgba(0,0,0,0.6)')
      .setVisible(false);
    this.input.keyboard?.on('keydown-F2', () => this.toggle());
  }

  update(): void {
    if (!this.enabled) return;
    const scenes = this.scene.manager
      .getScenes(true)
      .map((s) => s.scene.key)
      .filter((key) => key !== SCENES.Debug)
      .join(', ');
    this.info.setText(`FPS ${Math.round(this.game.loop.actualFps)}  ·  ${scenes}\nsürüm ${VERSION}  ·  F2: kapat`);
  }

  private toggle(): void {
    this.enabled = !this.enabled;
    this.info.setVisible(this.enabled);
    for (const scene of this.scene.manager.getScenes(true)) {
      const world = (scene as { physics?: Phaser.Physics.Arcade.ArcadePhysics }).physics?.world;
      if (!world || scene === this) continue;
      if (this.enabled && !world.debugGraphic) world.createDebugGraphic();
      world.drawDebug = this.enabled;
      world.debugGraphic?.clear();
    }
  }
}
