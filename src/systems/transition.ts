import * as Phaser from 'phaser';

const busy = new WeakSet<Phaser.Scene>();

/** Ekranı karartıp başka sahneye geç. Geçiş sürerken gelen ikinci tıklamayı yok sayar. */
export function goTo(from: Phaser.Scene, key: string, data?: object, ms = 220): void {
  if (busy.has(from)) return;
  busy.add(from);
  from.input.enabled = false;
  from.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    busy.delete(from);
    from.input.enabled = true;
  });
  const cam = from.cameras.main;
  cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => from.scene.start(key, data));
  cam.fadeOut(ms, 0, 0, 0);
}

/** Sahne açılırken karanlıktan aç. Her tam ekran sahnenin create() başında çağır. */
export function fadeIn(scene: Phaser.Scene, ms = 220): void {
  scene.input.enabled = true;
  scene.cameras.main.fadeIn(ms, 0, 0, 0);
}
