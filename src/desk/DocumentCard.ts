// @beyan görsel
import * as Phaser from 'phaser';
import type { AlanRef, BelgeTuru } from '../game/building';
import { PX, snap, type Tuval } from './pixel';

/** Belge üzerindeki tıklanabilir bir alan (G3 inceleme modu bunları dinleyecek). */
export interface AlanNesne extends AlanRef {
  nesne: Phaser.GameObjects.GameObject;
}

/** Masa sınırları (ekran). Kartın ortası bu sınırın içinde kalır. GameScene ayarlar. */
export const MASA = { x: 0, y: 464, w: 1880, h: 616 };

let enUst = 10;
/** Masadaki bir sonraki üst katman (fiş gibi başka nesneler de kullanır). */
export function ustKatman(): number {
  return ++enUst;
}

/** Sürüklenebilir kâğıt belge. Alanlar ayrı nesnelerdir ve karta çocuk olarak eklenir. */
export class DocumentCard extends Phaser.GameObjects.Container {
  readonly tur: BelgeTuru;
  readonly w: number;
  readonly h: number;
  private readonly alanListesi: AlanNesne[] = [];

  constructor(scene: Phaser.Scene, tur: BelgeTuru, w: number, h: number, x: number, y: number) {
    super(scene, x, y);
    this.tur = tur;
    this.w = w;
    this.h = h;
    // Masaya düşen gölge
    const golge = scene.add.rectangle(PX, PX * 2, w, h, 0x000000, 0.38);
    this.add(golge);
    this.setSize(w, h);
    this.setInteractive({ draggable: true, useHandCursor: true });
    scene.add.existing(this);

    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.one());
    this.on('drag', (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
      this.setPosition(
        snap(Phaser.Math.Clamp(dx, MASA.x + w / 2, MASA.x + MASA.w - w / 2)),
        snap(Phaser.Math.Clamp(dy, MASA.y + h / 2, MASA.y + MASA.h - h / 2)),
      );
    });
  }

  /** Kâğıt tuvalini kartın zemini yap (gölgenin hemen üstü). */
  zeminEkle(t: Tuval): void {
    this.addAt(t.goruntu(0, 0), 1);
  }

  /** Tutulan belge en üste gelir. */
  one(): void {
    this.setDepth(ustKatman());
  }

  /** Karta bir alan nesnesi ekle ve alan listesine kaydet. */
  alanEkle(alan: string, nesne: Phaser.GameObjects.GameObject): void {
    nesne.setData('belge', this.tur);
    nesne.setData('alan', alan);
    this.add(nesne);
    this.alanListesi.push({ belge: this.tur, alan, nesne });
  }

  alanlar(): readonly AlanNesne[] {
    return this.alanListesi;
  }
}
