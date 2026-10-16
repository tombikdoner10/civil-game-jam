import * as Phaser from 'phaser';
import { COLORS, DEV, HEIGHT, SUBTITLE, TEAM, TITLE, VERSION, WIDTH } from '../config';
import { popIn } from '../systems/fx';
import { fadeIn, goTo } from '../systems/transition';
import { addBackdrop } from '../ui/backdrop';
import { Button } from '../ui/Button';
import { MenuNav } from '../ui/MenuNav';
import { label } from '../ui/text';
import { SCENES } from './keys';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Menu);
  }

  create(): void {
    fadeIn(this);
    addBackdrop(this);

    const title = label(this, WIDTH / 2, 250, TITLE, { size: 136, weight: 'bold', baslik: true });
    popIn(this, title);
    label(this, WIDTH / 2, 365, SUBTITLE, { size: 40, color: COLORS.muted });

    const items: [string, () => void][] = [
      ['Oyna', () => goTo(this, SCENES.Game)],
      ['Ayarlar', () => goTo(this, SCENES.Settings, { from: SCENES.Menu })],
      ['Emeği Geçenler', () => goTo(this, SCENES.Credits)],
    ];
    if (DEV) items.push(['Oyun Alanı (dev)', () => goTo(this, SCENES.Playground)]);

    const buttons = items.map(([text, action], i) => new Button(this, WIDTH / 2, 530 + i * 122, text, action));
    buttons.forEach((button, i) => popIn(this, button, 120 + i * 70));
    new MenuNav(this, buttons);

    label(this, 48, HEIGHT - 44, TEAM, { size: 34, color: COLORS.muted, align: 'left' });
    label(this, WIDTH - 48, HEIGHT - 44, `sürüm ${VERSION}`, { size: 30, color: COLORS.muted, align: 'right' });

    // Menü müziği jam sırasında eklenecek: music.play(SONGS.menu)
  }
}
