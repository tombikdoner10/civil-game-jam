// @beyan görsel
import type * as Phaser from 'phaser';

/** Kodla üretilen temel dokular (beyaz; tint ile renklendir). Görsel dosyası gerekmeden prototip ve parçacıklar için. */
export const TEX = {
  /** 4×4 kare: setDisplaySize ile dikdörtgen yap. */
  px: 'tex-px',
  /** 32 px dolu daire. */
  dot: 'tex-dot',
  /** 64 px halka. */
  ring: 'tex-ring',
  /** 64 px yumuşak ışık lekesi: parçacıklar ve parlamalar için. */
  soft: 'tex-soft',
} as const;

export function createTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.px)) return;

  const g = scene.make.graphics({}, false);
  g.fillStyle(0xffffff).fillRect(0, 0, 4, 4).generateTexture(TEX.px, 4, 4).clear();
  g.fillStyle(0xffffff).fillCircle(16, 16, 16).generateTexture(TEX.dot, 32, 32).clear();
  g.lineStyle(4, 0xffffff).strokeCircle(32, 32, 29).generateTexture(TEX.ring, 64, 64).clear();
  g.destroy();

  const soft = scene.textures.createCanvas(TEX.soft, 64, 64);
  if (soft) {
    const ctx = soft.getContext();
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    soft.refresh();
  }
}
