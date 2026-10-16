import * as Phaser from 'phaser';
import { COLORS, DEV, HEIGHT, SUBTITLE, TEAM, TITLE, VERSION, WIDTH } from '../config';
import { gunAyar, SON_GUN } from '../game/days';
import { ornekKayitlar } from '../game/ornek';
import { gunHesabi } from '../game/session';
import { popIn } from '../systems/fx';
import { fadeIn, goTo } from '../systems/transition';
import { addBackdrop } from '../ui/backdrop';
import { Button } from '../ui/Button';
import { MenuNav } from '../ui/MenuNav';
import { label } from '../ui/text';
import { SCENES } from './keys';
import type { DepremData } from './QuakeScene';

/**
 * Yalnızca dev: ?dev&deprem[&tohum=N] "Oyna"yı gün 5 sonuna (büyük deprem → gazete → sonuç) bağlar; beş gün
 * örnek kararlarla (doğru ve yanlış karışık) dolu. Test ve sunum provası için.
 */
function devDeprem(): DepremData | null {
  if (!DEV) return null;
  const q = new URLSearchParams(location.search);
  if (!q.has('deprem')) return null;
  const t = Number(q.get('tohum'));
  const tohum = q.has('tohum') && Number.isFinite(t) ? t : Math.floor(Math.random() * 1_000_000_000);
  const kayitlar = ornekKayitlar(tohum, SON_GUN + 1);
  const para = kayitlar.reduce((n, k) => n + gunHesabi(k.kararlar, gunAyar(k.gun).dosyaSayisi).toplam, 0);
  return { tohum, para, kayitlar };
}

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
      [
        'Oyna',
        () => {
          const deprem = devDeprem();
          if (deprem) goTo(this, SCENES.Quake, deprem);
          else goTo(this, SCENES.Game);
        },
      ],
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
