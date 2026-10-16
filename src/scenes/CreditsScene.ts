import * as Phaser from 'phaser';
import { COLORS, HEIGHT, SUBTITLE, TEAM, WIDTH } from '../config';
import { AI, ASSETS, CATEGORIES, MEMBERS, type Category } from '../data/credits';
import { fadeIn, goTo } from '../systems/transition';
import { addBackdrop } from '../ui/backdrop';
import { Button } from '../ui/Button';
import { MenuNav } from '../ui/MenuNav';
import { label, type LabelOptions } from '../ui/text';
import { SCENES } from './keys';

const TOP = 220;
const VIEW_HEIGHT = 640;
const COLUMN = 1300;

/** Takım, yapay zekâ beyanı ve hazır kaynaklar (src/data/credits.ts). Fare tekerleği ve ↑/↓ ile kayar. */
export class CreditsScene extends Phaser.Scene {
  private content!: Phaser.GameObjects.Container;
  private maxScroll = 0;
  private keys?: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key };

  constructor() {
    super(SCENES.Credits);
  }

  create(): void {
    fadeIn(this);
    addBackdrop(this);
    label(this, WIDTH / 2, 120, 'Emeği Geçenler', { size: 96 });

    const left = WIDTH / 2 - COLUMN / 2;
    this.content = this.add.container(left, TOP);
    let y = 0;
    const add = (text: string, o: LabelOptions = {}, gap = 14): void => {
      const t = label(this, 0, y, text, { size: 38, align: 'left', wrap: COLUMN, ...o }).setOrigin(0, 0);
      this.content.add(t);
      y += t.height + gap;
    };
    const header = (text: string): void => {
      y += 30;
      add(text, { size: 48, color: COLORS.primary }, 18);
    };

    add(TEAM, { size: 60 }, 4);
    add(`${SUBTITLE} için 48 saatte geliştirildi.`, { color: COLORS.muted });
    header('Takım');
    MEMBERS.forEach((m) => add(`${m.name}  ·  ${m.role}`));
    // Teslim formundaki gibi: beş kategorinin her biri için Kullanıldı / Kullanılmadı.
    const declaration = <T,>(title: string, data: Record<Category, T[]>, describe: (item: T) => [string, string]): void => {
      header(title);
      for (const { id, label } of CATEGORIES) {
        const items = data[id];
        if (items.length === 0) {
          add(`${label}: Kullanılmadı`, { size: 34, color: COLORS.muted }, 12);
          continue;
        }
        add(`${label}: Kullanıldı`, { size: 38 }, 6);
        for (const item of items) {
          const [main, detail] = describe(item);
          add(main, { size: 34 }, 4);
          add(detail, { size: 30, color: COLORS.muted }, 16);
        }
      }
    };
    declaration('Yapay zekâ kullanımı', AI, (a) => [`${a.tool}: ${a.purpose}`, `Kullanıldığı yer: ${a.where}`]);
    declaration('Hazır kaynaklar', ASSETS, (a) => [`${a.name}  ·  ${a.author}`, `${a.license}  ·  ${a.usage}  ·  ${a.url}`]);

    const maskShape = this.make.graphics({}, false).fillStyle(0xffffff).fillRect(left - 20, TOP, COLUMN + 40, VIEW_HEIGHT);
    this.content.setMask(maskShape.createGeometryMask());
    this.maxScroll = Math.max(0, y - VIEW_HEIGHT);
    if (this.maxScroll > 0) {
      label(this, WIDTH / 2, TOP + VIEW_HEIGHT + 40, 'Kaydırmak için fare tekerleği ya da ↑ / ↓', { size: 32, color: COLORS.muted });
    }

    this.input.on(Phaser.Input.Events.POINTER_WHEEL, (_p: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => this.scrollBy(dy));
    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.keys = { up: keyboard.addKey('UP', false), down: keyboard.addKey('DOWN', false) };
    }

    const back = (): void => goTo(this, SCENES.Menu);
    const backButton = new Button(this, WIDTH / 2, 990, 'Geri', back, { width: 420, sound: 'back' });
    new MenuNav(this, [backButton], { back });
  }

  update(_time: number, delta: number): void {
    if (!this.keys) return;
    const dir = Number(this.keys.down.isDown) - Number(this.keys.up.isDown);
    if (dir) this.scrollBy(dir * delta * 0.8);
  }

  private scrollBy(dy: number): void {
    const offset = Phaser.Math.Clamp(TOP - this.content.y + dy, 0, this.maxScroll);
    this.content.y = TOP - offset;
  }
}
