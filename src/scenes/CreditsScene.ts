import * as Phaser from 'phaser';
import { SUBTITLE, TEAM, WIDTH } from '../config';
import { num, PAL } from '../desk/palette';
import { AI, ASSETS, CATEGORIES, MEMBERS, TAKIM_KARARLARI, type Category } from '../data/credits';
import { fadeIn, goTo } from '../systems/transition';
import { addBackdrop } from '../ui/backdrop';
import { Button } from '../ui/Button';
import { kagitPanel } from '../ui/kagit';
import { MenuNav } from '../ui/MenuNav';
import { label, type LabelOptions } from '../ui/text';
import { SCENES } from './keys';

const TOP = 220;
const VIEW_HEIGHT = 640;
const COLUMN = 1300;

/** Takım, takımın kararları, hazır kaynaklar ve yapay zekâ beyanı (src/data/credits.ts). Fare tekerleği ve ↑/↓ ile kayar. */
export class CreditsScene extends Phaser.Scene {
  private content!: Phaser.GameObjects.Container;
  private maxScroll = 0;
  /** Kayan metnin satır bantları (içerik koordinatında, G31d). */
  private bands: { top: number; bottom: number }[] = [];
  private maskShape?: Phaser.GameObjects.Graphics;
  private left = 0;
  private keys?: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key };

  constructor() {
    super(SCENES.Credits);
  }

  create(): void {
    fadeIn(this);
    addBackdrop(this);
    this.cameras.main.setRoundPixels(true);
    // Masada büyük bir kâğıt: başlık şeridi, kayan beyan metni, altta Geri.
    kagitPanel(this, WIDTH / 2, 556, 1440, 984, { serit: 120, tohum: 41 });
    label(this, WIDTH / 2, 132, 'Emeği Geçenler', { size: 80, color: num(PAL.kremAcik) });

    const left = WIDTH / 2 - COLUMN / 2;
    this.content = this.add.container(left, TOP);
    let y = 0;
    const add = (text: string, o: LabelOptions = {}, gap = 14, x = 0): void => {
      const t = label(this, x, y, text, { size: 38, align: 'left', wrap: COLUMN - x, color: num(PAL.murekkep), ...o }).setOrigin(0, 0);
      this.content.add(t);
      y += t.height + gap;
    };
    /** Madde imli satır: imden sonra asılı girinti. */
    const bullet = (text: string, o: LabelOptions = {}, gap = 6): void => {
      this.content.add(label(this, 12, y, '·', { size: 30, align: 'left', color: num(PAL.murekkepSoluk), ...o }).setOrigin(0, 0));
      add(text, { size: 30, color: num(PAL.murekkepSoluk), ...o }, gap, 44);
    };
    const header = (text: string): void => {
      y += 30;
      add(text, { size: 48, color: num(PAL.basikSerit) }, 18);
    };

    add(TEAM, { size: 60 }, 4);
    add(`${SUBTITLE} için 48 saatte geliştirildi.`, { color: num(PAL.murekkepSoluk) });
    header('Takım');
    // G31: köşeli parantezli (yer tutucu) üye satırları gizlenir; takım adlarını yazınca görünür.
    const yerTutucu = (s: string): boolean => /\[[^\]]*\]/.test(s);
    MEMBERS.filter((m) => !yerTutucu(m.name) && !yerTutucu(m.role)).forEach((m) => add(`${m.name}  ·  ${m.role}`));
    // Sıra (madde 4.3 izlenimi, G38): önce takımın emeği, sonra hazır kaynaklar, en son yapay zekâ.
    if (TAKIM_KARARLARI.length > 0) {
      header('Takımın kararları');
      TAKIM_KARARLARI.forEach((k) => bullet(k, { size: 34, color: num(PAL.murekkep) }, 10));
    }
    // Teslim formundaki gibi: beş kategorinin her biri için Kullanıldı / Kullanılmadı.
    const declaration = <T,>(title: string, data: Record<Category, T[]>, describe: (item: T) => [string, string]): void => {
      header(title);
      for (const { id, label } of CATEGORIES) {
        const items = data[id];
        if (items.length === 0) {
          add(`${label}: Kullanılmadı`, { size: 34, color: num(PAL.murekkepSoluk) }, 12);
          continue;
        }
        add(`${label}: Kullanıldı`, { size: 38 }, 6);
        for (const item of items) {
          const [main, detail] = describe(item);
          add(main, { size: 34 }, 4);
          add(detail, { size: 30, color: num(PAL.murekkepSoluk) }, 16);
        }
      }
    };
    declaration('Hazır kaynaklar', ASSETS, (a) => [`${a.name}  ·  ${a.author}`, `${a.license}  ·  ${a.usage}  ·  ${a.url}`]);
    // Yapay zekâ beyanı (okunur özet, docs/ai-ozet.json): araç bir kez, sonra her kategori için
    // Kullanıldı / Kullanılmadı, kısa amaç ve kullanıldığı yerler. Ayrıntılı kayıt docs/AI_BEYAN.md'de.
    header('Yapay zekâ kullanımı');
    const tools = [...new Set(CATEGORIES.flatMap(({ id }) => AI[id].map((a) => a.tool)))];
    if (tools.length === 1) add(`Araç: ${tools[0]}`, { size: 32, color: num(PAL.murekkepSoluk) }, 10);
    for (const { id, label: kategori } of CATEGORIES) {
      const items = AI[id];
      y += 14;
      if (items.length === 0) {
        add(`${kategori}: Kullanılmadı`, { size: 38, color: num(PAL.murekkepSoluk) }, 12);
        continue;
      }
      add(`${kategori}: Kullanıldı`, { size: 40, color: num(PAL.basikSerit) }, 8);
      for (const a of items) {
        if (tools.length > 1) add(`Araç: ${a.tool}`, { size: 30, color: num(PAL.murekkepSoluk) }, 6);
        add(a.purpose, { size: 34 }, 8);
        a.where.forEach((w) => bullet(w));
        y += 10;
      }
    }

    // G31d: maske her kaydırmada satır sınırına oturur; kenarı kesen satır bütünüyle gizlenir, tam satırlar açık kalır.
    this.left = left;
    this.bands = this.content.list
      .filter((o): o is Phaser.GameObjects.Text => o instanceof Phaser.GameObjects.Text)
      .flatMap((t) => {
        const n = Math.max(1, t.getWrappedText().length);
        const h = t.height / n;
        return Array.from({ length: n }, (_, i) => ({ top: t.y + i * h, bottom: t.y + (i + 1) * h }));
      });
    this.maskShape = this.make.graphics({}, false);
    this.content.setMask(this.maskShape.createGeometryMask());
    this.maxScroll = Math.max(0, y - VIEW_HEIGHT);
    // G31c'deki soluklaşan kenar şeridi kaldırıldı (G31d): yarım satır artık hiç çizilmiyor, şerit ise tam satırların
    // alt/üst piksellerini örtüyordu.
    this.scrollBy(0);
    if (this.maxScroll > 0) {
      label(this, WIDTH / 2, TOP + VIEW_HEIGHT + 40, 'Kaydırmak için fare tekerleği ya da ↑ / ↓', { size: 32, color: num(PAL.murekkepSoluk) });
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
    // Kenarı kesen satırın (bant) dışında kalan kısmı da gizlensin diye maske o satırın ötesine çekilir.
    let ust = offset;
    let alt = offset + VIEW_HEIGHT;
    for (const b of this.bands) {
      if (b.top < offset - 0.5 && b.bottom > offset + 0.5) ust = Math.max(ust, b.bottom);
      if (b.top < offset + VIEW_HEIGHT - 0.5 && b.bottom > offset + VIEW_HEIGHT + 0.5) alt = Math.min(alt, b.top);
    }
    this.maskShape
      ?.clear()
      .fillStyle(0xffffff)
      .fillRect(this.left - 20, TOP + ust - offset, COLUMN + 40, Math.max(0, alt - ust));
  }
}
