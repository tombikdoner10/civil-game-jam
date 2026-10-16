import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { COLORS, HEIGHT, WIDTH } from '../config';
import { settings, type Settings } from '../systems/settings';
import { fadeIn, goTo } from '../systems/transition';
import { addBackdrop } from '../ui/backdrop';
import { Button } from '../ui/Button';
import { MenuNav } from '../ui/MenuNav';
import { label } from '../ui/text';
import { ValueBar } from '../ui/ValueBar';
import { SCENES } from './keys';

export interface SettingsData {
  /** Geri dönülecek sahne. */
  from?: string;
  /** true: duraklatma ekranının üstünde katman olarak açılır. */
  overlay?: boolean;
}

type VolumeKey = 'master' | 'music' | 'sfx';

/** Ses seviyeleri, ekran sarsıntısı ve tam ekran. Menüden tam sahne, duraklatmadan katman olarak açılır. */
export class SettingsScene extends Phaser.Scene {
  private from: string = SCENES.Menu;
  private overlay = false;

  constructor() {
    super(SCENES.Settings);
  }

  init(data: SettingsData): void {
    this.from = data.from ?? SCENES.Menu;
    this.overlay = !!data.overlay;
  }

  create(): void {
    if (this.overlay) {
      this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.bg, 0.88).setOrigin(0).setInteractive();
    } else {
      fadeIn(this);
      addBackdrop(this);
    }

    label(this, WIDTH / 2, 150, 'Ayarlar', { size: 88, weight: 'bold', baslik: true });

    const rows: [string, VolumeKey, string][] = [
      ['Ana ses', 'master', 'click'],
      ['Müzik', 'music', 'click'],
      ['Efektler', 'sfx', 'damga'],
    ];
    const navButtons: Button[] = [];
    rows.forEach(([name, key, preview], i) => {
      const y = 320 + i * 120;
      label(this, 420, y, name, { size: 48, align: 'left' });
      const percent = label(this, 1500, y, '', { size: 40, color: COLORS.muted, align: 'left' });
      const showPercent = (v: number): void => void percent.setText(`%${Math.round(v * 100)}`);
      const bar = new ValueBar(this, 1110, y, 440, settings.get()[key], (v) => {
        settings.set({ [key]: v } as Partial<Settings>);
        showPercent(v);
      });
      showPercent(bar.getValue());
      const step = (delta: number): void => {
        bar.setValue(bar.getValue() + delta);
        sfx.play(preview);
      };
      navButtons.push(
        new Button(this, 820, y, '−', () => step(-0.1), { width: 84, height: 84, fontSize: 60, sound: null }),
        new Button(this, 1400, y, '+', () => step(0.1), { width: 84, height: 84, fontSize: 60, sound: null }),
      );
    });

    const shakeText = (): string => `Ekran sarsıntısı: ${settings.get().shake ? 'Açık' : 'Kapalı'}`;
    const shakeButton = new Button(this, WIDTH / 2, 690, shakeText(), () => {
      settings.set({ shake: !settings.get().shake });
      shakeButton.setLabel(shakeText());
      if (settings.get().shake) this.cameras.main.shake(160, 0.008);
    }, { width: 700 });

    const fullscreenText = (): string => (this.scale.isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran');
    const fullscreenButton = new Button(this, WIDTH / 2, 812, fullscreenText(), () => this.scale.toggleFullscreen(), { width: 700 });
    const syncFullscreen = (): void => void fullscreenButton.setLabel(fullscreenText());
    this.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, syncFullscreen);
    this.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, syncFullscreen);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, syncFullscreen);
      this.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, syncFullscreen);
    });

    const back = (): void => this.back();
    const backButton = new Button(this, WIDTH / 2, 960, 'Geri', back, { width: 420, sound: 'back' });
    new MenuNav(this, [...navButtons, shakeButton, fullscreenButton, backButton], { back });
  }

  private back(): void {
    if (this.overlay) {
      if (this.scene.isSleeping(this.from)) this.scene.wake(this.from);
      else this.scene.resume(this.from);
      this.scene.stop();
    } else {
      goTo(this, this.from);
    }
  }
}
