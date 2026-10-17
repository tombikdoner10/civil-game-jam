import * as Phaser from 'phaser';
import { DEV, HEIGHT, SUBTITLE, TEAM, TITLE, VERSION, WIDTH } from '../config';
import { num, PAL } from '../desk/palette';
import { PX } from '../desk/pixel';
import { gunAyar, SON_GUN } from '../game/days';
import { ornekKayitlar } from '../game/ornek';
import { GunOturumu, gunHesabi } from '../game/session';
import { TUNING } from '../game/tuning';
import { popIn } from '../systems/fx';
import { fadeIn, goTo } from '../systems/transition';
import { addBackdrop } from '../ui/backdrop';
import { Button } from '../ui/Button';
import { kagitPanel } from '../ui/kagit';
import { MenuNav } from '../ui/MenuNav';
import { label } from '../ui/text';
import { SCENES } from './keys';
import type { DayEndData } from './DayEndScene';
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

/**
 * Yalnızca dev: ?dev&kisayol[&tohum=N] "Oyna"yı doğrudan gün 1 sonu raporuna bağlar (örnek 3 kararla, öncü
 * sarsıntı sonucu dahil); oradan "Depremi şimdi yaşa" (G21) ya da "Sonraki gün" denenir.
 */
function devKisaYol(): DayEndData | null {
  if (!DEV) return null;
  const q = new URLSearchParams(location.search);
  if (!q.has('kisayol')) return null;
  const t = Number(q.get('tohum'));
  const tohum = q.has('tohum') && Number.isFinite(t) ? t : Math.floor(Math.random() * 1_000_000_000);
  const [gun1] = ornekKayitlar(tohum, 2);
  return {
    gun: 1,
    tohum,
    paraOnce: TUNING.para.baslangic,
    kararlar: gun1.kararlar,
    dosyalar: new GunOturumu(1, tohum).dosyalar.map((b) => ({ id: b.id, adres: b.adres })),
    kayitlar: [],
    oncu: gun1.oncu,
  };
}

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Menu);
  }

  create(): void {
    fadeIn(this);
    addBackdrop(this);

    // Masada bir dosya kâğıdı: başlık şeridinde oyun adı (yer tutucu, config TITLE), altında düğmeler.
    const n = DEV ? 4 : 3;
    const kagitH = 360 + n * 112;
    // "Oyna" her zaman y≈528'de (dev menüsünde de; smoke senaryoları 960,530'a tıklıyor).
    const ust = 176;
    const kagitY = ust + kagitH / 2;
    kagitPanel(this, WIDTH / 2, kagitY, 800, kagitH, { serit: 168, tohum: 17 });
    const title = label(this, WIDTH / 2, ust + 96, TITLE, { size: 120, weight: 'bold', baslik: true, color: num(PAL.kremAcik) });
    popIn(this, title);
    label(this, WIDTH / 2, ust + 224, SUBTITLE, { size: 40, color: num(PAL.murekkepSoluk) });
    this.add.rectangle(WIDTH / 2, ust + 264, 640, PX, num(PAL.kremKoyu));

    const items: [string, () => void][] = [
      [
        'Oyna',
        () => {
          const deprem = devDeprem();
          const kisa = devKisaYol();
          if (deprem) goTo(this, SCENES.Quake, deprem);
          else if (kisa) goTo(this, SCENES.DayEnd, kisa);
          else goTo(this, SCENES.Game);
        },
      ],
      ['Ayarlar', () => goTo(this, SCENES.Settings, { from: SCENES.Menu })],
      ['Emeği Geçenler', () => goTo(this, SCENES.Credits)],
    ];
    if (DEV) items.push(['Oyun Alanı (dev)', () => goTo(this, SCENES.Playground)]);

    const buttons = items.map(([text, action], i) => new Button(this, WIDTH / 2, ust + 352 + i * 112, text, action));
    buttons.forEach((button, i) => popIn(this, button, 80 + i * 50));
    // İlk Enter doğrudan "Oyna" (G23: menü ilk girdiye tepki versin).
    new MenuNav(this, buttons, { varsayilan: 0 });

    label(this, 48, HEIGHT - 44, TEAM, { size: 34, color: num(PAL.panelYazi), align: 'left' });
    label(this, WIDTH - 48, HEIGHT - 44, `sürüm ${VERSION}`, { size: 30, color: num(PAL.panelYazi), align: 'right' });

    // Menü müziği jam sırasında eklenecek: music.play(SONGS.menu)
  }
}
