import * as Phaser from 'phaser';
import { audio } from '../audio/audio';
import { seslerKur } from '../audio/sesler';
import { sfx } from '../audio/sfx';
import { loadFonts } from '../systems/fonts';
import { createTextures } from '../systems/textures';
import { SCENES } from './keys';

/** Fontları, kodla üretilen dokuları ve ses sistemini hazırlar. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Boot);
  }

  create(): void {
    createTextures(this);
    audio.init(this.sound);
    seslerKur();
    sfx.warmup();
    this.scene.launch(SCENES.Debug);
    void loadFonts().then(() => this.scene.start(SCENES.Preload));
  }
}
