import * as Phaser from 'phaser';
import { COLORS, css, FONT } from '../config';
import { settings } from './settings';
import { TEX } from './textures';

/**
 * "Juice" yardımcıları: oyunu canlı hissettiren küçük efektler.
 * Hepsi tek satırda çağrılır: shake(this), burst(this, x, y, { color: COLORS.primary }) ...
 */

type Transform = Phaser.GameObjects.Components.Transform;

/** Kamera sarsıntısı. Ayarlardan kapatılabilir. */
export function shake(scene: Phaser.Scene, intensity = 0.008, duration = 140): void {
  if (!settings.get().shake) return;
  scene.cameras.main.shake(duration, intensity);
}

/** Kamera "yumruğu": anlık yakınlaşıp geri döner. Ayarlardaki sarsıntıya bağlıdır. */
export function punch(scene: Phaser.Scene, amount = 0.04, duration = 140): void {
  const cam = scene.cameras.main;
  if (!settings.get().shake || scene.tweens.isTweening(cam)) return;
  const zoom = cam.zoom;
  scene.tweens.add({
    targets: cam,
    zoom: zoom * (1 + amount),
    duration: duration / 2,
    yoyo: true,
    ease: 'Quad.easeOut',
    onComplete: () => cam.setZoom(zoom),
  });
}

/** Ekranı bir anlığına renkle parlat. */
export function flash(scene: Phaser.Scene, color: number = COLORS.text, duration = 90): void {
  const c = Phaser.Display.Color.IntegerToColor(color);
  scene.cameras.main.flash(duration, c.red, c.green, c.blue);
}

/** Kısa kare donması: vuruşlara ağırlık katar. Fizik ve tween'ler birkaç milisaniye durur. */
export function hitStop(scene: Phaser.Scene, ms = 70): void {
  const arcade = (scene as { physics?: Phaser.Physics.Arcade.ArcadePhysics }).physics?.world;
  const matter = (scene as { matter?: Phaser.Physics.Matter.MatterPhysics }).matter?.world;
  arcade?.pause();
  matter?.pause();
  scene.tweens.pauseAll();
  window.setTimeout(() => {
    arcade?.resume();
    matter?.resume();
    scene.tweens.resumeAll();
  }, ms);
}

/** Sıfırdan büyüyerek belirme. */
export function popIn(scene: Phaser.Scene, target: Transform, delay = 0, duration = 320): void {
  const { scaleX, scaleY } = target;
  target.setScale(0);
  scene.tweens.add({ targets: target, scaleX, scaleY, delay, duration, ease: 'Back.easeOut' });
}

/** Ezilip esneme: zıplama, çarpma, yere inme anlarında. */
export function squash(scene: Phaser.Scene, target: Transform, amount = 0.25, duration = 90): void {
  const { scaleX, scaleY } = target;
  scene.tweens.add({
    targets: target,
    scaleX: scaleX * (1 + amount),
    scaleY: scaleY * (1 - amount),
    duration,
    yoyo: true,
    ease: 'Quad.easeOut',
    onComplete: () => target.setScale(scaleX, scaleY),
  });
}

/** Kısa nabız: dikkat çekmek için büyüyüp küçülme. */
export function pulse(scene: Phaser.Scene, target: Transform, amount = 0.1, duration = 140): void {
  const { scaleX, scaleY } = target;
  scene.tweens.add({
    targets: target,
    scaleX: scaleX * (1 + amount),
    scaleY: scaleY * (1 + amount),
    duration,
    yoyo: true,
    ease: 'Quad.easeOut',
    onComplete: () => target.setScale(scaleX, scaleY),
  });
}

/** Yükselip kaybolan yazı: "+10", "Kombo!" vb. */
export function floatText(scene: Phaser.Scene, x: number, y: number, text: string, color: number = COLORS.text, size = 40): Phaser.GameObjects.Text {
  const t = scene.add
    .text(x, y, text, { fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color: css(color), stroke: '#000000', strokeThickness: 6 })
    .setOrigin(0.5)
    .setDepth(1000);
  scene.tweens.add({ targets: t, y: y - 90, alpha: 0, duration: 850, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  return t;
}

export interface BurstOptions {
  /** Tek renk ya da her parçacık için rastgele seçilecek renkler. */
  color?: number | number[];
  count?: number;
  /** Piksel/saniye */
  speed?: number;
  /** Milisaniye */
  lifespan?: number;
  scale?: number;
  texture?: string;
  gravityY?: number;
  /** Işık gibi toplanarak parlasın mı (koyu zeminde güzel durur). */
  glow?: boolean;
}

/** Parçacık patlaması. */
export function burst(scene: Phaser.Scene, x: number, y: number, opts: BurstOptions = {}): void {
  const { color = COLORS.text, count = 24, speed = 520, lifespan = 650, scale = 0.8, texture = TEX.soft, gravityY = 0, glow = true } = opts;
  const emitter = scene.add.particles(x, y, texture, {
    speed: { min: speed * 0.3, max: speed },
    angle: { min: 0, max: 360 },
    lifespan: { min: lifespan * 0.6, max: lifespan },
    scale: { start: scale, end: 0 },
    alpha: { start: 1, end: 0 },
    tint: color,
    gravityY,
    blendMode: glow ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL,
    emitting: false,
  });
  emitter.setDepth(900);
  emitter.explode(count);
  scene.time.delayedCall(lifespan + 100, () => emitter.destroy());
}
