// @beyan görsel
import * as Phaser from 'phaser';
import type { AlanRef, BelgeTuru } from '../game/building';

/** Belge üzerindeki tıklanabilir bir alan (G3 inceleme modu bunları dinleyecek). */
export interface AlanNesne extends AlanRef {
  nesne: Phaser.GameObjects.GameObject;
}

export const KART_W = 460;
export const KART_H = 330;

/** Masa sınırları (kartların tamamı bu sınırın içinde kalır). */
export const MASA = { x: 20, y: 120, w: 1600, h: 940 };

let enUst = 10;

/** Sürüklenebilir kâğıt belge. Alanlar ayrı nesnelerdir ve karta çocuk olarak eklenir. */
export class DocumentCard extends Phaser.GameObjects.Container {
  readonly tur: BelgeTuru;
  private readonly alanListesi: AlanNesne[] = [];

  constructor(scene: Phaser.Scene, tur: BelgeTuru, baslik: string, x: number, y: number) {
    super(scene, x, y);
    this.tur = tur;
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.35).fillRect(-KART_W / 2 + 6, -KART_H / 2 + 10, KART_W, KART_H);
    g.fillStyle(0xd9d9d4, 1).fillRect(-KART_W / 2, -KART_H / 2, KART_W, KART_H);
    g.lineStyle(3, 0x8d8d86, 1).strokeRect(-KART_W / 2, -KART_H / 2, KART_W, KART_H);
    g.fillStyle(0xbdbdb6, 1).fillRect(-KART_W / 2, -KART_H / 2, KART_W, 48);
    const t = scene.add
      .text(-KART_W / 2 + 18, -KART_H / 2 + 24, baslik, { fontFamily: 'sans-serif', fontSize: '28px', fontStyle: 'bold', color: '#1c1c1c' })
      .setOrigin(0, 0.5);
    this.add([g, t]);
    this.setSize(KART_W, KART_H);
    this.setInteractive({ draggable: true, useHandCursor: true });
    scene.add.existing(this);

    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.one());
    this.on('drag', (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
      this.setPosition(
        Phaser.Math.Clamp(dx, MASA.x + KART_W / 2, MASA.x + MASA.w - KART_W / 2),
        Phaser.Math.Clamp(dy, MASA.y + KART_H / 2, MASA.y + MASA.h - KART_H / 2),
      );
    });
  }

  /** Tutulan belge en üste gelir. */
  one(): void {
    this.setDepth(++enUst);
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
