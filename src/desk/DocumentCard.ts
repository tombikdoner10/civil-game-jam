// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import type { AlanRef, BelgeTuru } from '../game/building';
import { PX, snap, type Tuval } from './pixel';

/** Belge üzerindeki tıklanabilir bir alan (G3 inceleme modu bunları dinleyecek). */
export interface AlanNesne extends AlanRef {
  nesne: Phaser.GameObjects.GameObject;
}

/**
 * Masa sınırları (ekran). Kartın tamamı bu sınırın içinde kalır. GameScene ayarlar; damga çubuğu
 * açıkken sağ sınır çubuğun sol kenarıdır.
 */
export const MASA = { x: 0, y: 464, w: 1880, h: 616 };

/** Ortası (x, y), boyu w×h olan nesneyi masa sınırının içine sıkıştırır (ızgaraya oturtur). */
export function masayaSikistir(x: number, y: number, w: number, h: number): [number, number] {
  const yw = w / 2;
  const yh = h / 2;
  return [
    snap(Phaser.Math.Clamp(x, MASA.x + yw, Math.max(MASA.x + yw, MASA.x + MASA.w - yw))),
    snap(Phaser.Math.Clamp(y, MASA.y + yh, Math.max(MASA.y + yh, MASA.y + MASA.h - yh))),
  ];
}

let enUst = 10;
/** Masadaki bir sonraki üst katman (fiş gibi başka nesneler de kullanır). */
export function ustKatman(): number {
  return ++enUst;
}

/** Sürüklenebilir kâğıt belge. Alanlar ayrı nesnelerdir ve karta çocuk olarak eklenir. */
export class DocumentCard extends Phaser.GameObjects.Container {
  readonly tur: BelgeTuru;
  /**
   * Kartın gerçek boyu (ekran pikseli). `w`/`h` adları kullanılmaz: Phaser'ın Transform bileşeninde
   * `w` alanı var ve `setPosition(x, y)` onu 0'a çekiyor (sürüklemeden sonra genişlik 0 görünüyordu).
   */
  readonly genislik: number;
  readonly yukseklik: number;
  private readonly alanListesi: AlanNesne[] = [];

  constructor(scene: Phaser.Scene, tur: BelgeTuru, w: number, h: number, x: number, y: number) {
    super(scene, x, y);
    this.tur = tur;
    this.genislik = w;
    this.yukseklik = h;
    // Masaya düşen gölge
    const golge = scene.add.rectangle(PX, PX * 2, w, h, 0x000000, 0.38);
    this.add(golge);
    this.setSize(w, h);
    this.setInteractive({ draggable: true, useHandCursor: true });
    scene.add.existing(this);

    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.one();
      sfx.play('kagitAl');
    });
    this.on('dragend', () => sfx.play('kagitBirak'));
    this.on('drag', (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
      const [x2, y2] = this.masadaKonum(dx, dy);
      this.setPosition(x2, y2);
    });
  }

  /** Verilen konumu masa sınırına (kartın tamamı masada, damga çubuğunun dışında) sıkıştırır. */
  masadaKonum(x: number, y: number): [number, number] {
    return masayaSikistir(x, y, this.genislik, this.yukseklik);
  }

  /** Kartın ekrandaki dikdörtgeni. */
  sinir(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.x - this.genislik / 2, this.y - this.yukseklik / 2, this.genislik, this.yukseklik);
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
