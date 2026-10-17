// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import type { Kural } from '../game/building';
import { kuralMetni, YONERGE_NOTU } from '../game/rules';
import { masayaSikistir, ustKatman } from './DocumentCard';
import type { SecimNesne, Yuzey } from './Inspect';
import { PAL } from './palette';
import { PX, rastgele, snap, Tuval } from './pixel';

const W = 440;
const ICERIK = W - 48;

/**
 * Kural notu (gün 1): masada küçük, sürüklenebilir sarımsı kâğıt. İlk satır hedef (görev), altında o
 * günün kuralı. Kural satırı inceleme modunda kural kitabındaki satır gibi seçilebilir. Dosyalar gelip
 * giderken masada kalır. Metinler rules.ts'de.
 */
export class RuleNote extends Phaser.GameObjects.Container {
  readonly genislik = W;
  readonly yukseklik: number;
  private readonly satirlar: SecimNesne[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, gun: number, gorev: string, kurallar: Kural[], cerceve?: string) {
    super(scene, x, y);
    const yazi = (t: string, size: number, renk: string): Phaser.GameObjects.Text =>
      scene.add
        .text(0, 0, t, {
          fontFamily: FONT,
          fontSize: `${size}px`,
          color: renk,
          lineSpacing: 2,
          wordWrap: { width: ICERIK, useAdvancedWrap: true },
        })
        .setOrigin(0);

    // Çerçeve cümlesi (G5b, gün 1): notun en üstünde, kırmızı mürekkeple; altında ince çizgi.
    const cerceveYazi = cerceve ? yazi(cerceve, 32, PAL.damgaBosalt) : undefined;
    const cerceveH = cerceveYazi ? cerceveYazi.height + 16 : 0;
    const baslik = yazi(`KURAL NOTU · GÜN ${gun}`, 40, PAL.murekkep);
    // G31: başlığın altında küçük satır: kurallar oyun için sadeleştirilmiş bir yönerge.
    const yonergeYazi = yazi(YONERGE_NOTU, 24, PAL.murekkepSoluk);
    const gorevYazi = yazi(gorev, 30, PAL.basikSerit);
    const kuralYazilari = kurallar.map((k) => yazi(kuralMetni(k, gun), 30, PAL.murekkep));

    // Yükseklik içerikten: çerçeve, başlık, görev, ayraç, kurallar.
    let h = 20 + cerceveH + 44 + yonergeYazi.height + 8 + 8 + gorevYazi.height + 20;
    for (const k of kuralYazilari) h += k.height + 12;
    h = snap(h + 12, PX * 2);
    this.yukseklik = h;

    // Kâğıt
    const t = new Tuval(scene, W / PX, h / PX, 'kural-notu');
    const rnd = rastgele(gun * 97 + 5);
    const tw = W / PX;
    const th = h / PX;
    t.rect(0, 0, tw, th, PAL.not);
    t.benek(0, 0, tw, th, PAL.notKoyu, 0.04, rnd);
    t.frame(0, 0, tw, th, PAL.notKoyu);
    t.dither(1, th - 2, tw - 2, 1, PAL.notKoyu);
    // Üstte bant (kâğıdı masaya tutturan)
    t.rect(Math.floor(tw / 2) - 12, 0, 24, 4, '#c9c3ae');
    t.dither(Math.floor(tw / 2) - 12, 3, 24, 1, '#a9a28c');
    this.add(scene.add.rectangle(PX, PX * 2, W, h, 0x000000, 0.38));
    this.add(t.goruntu(0, 0));

    const sol = -W / 2 + 24;
    let yy = -h / 2 + 20;
    if (cerceveYazi) {
      cerceveYazi.setPosition(sol, yy - 4);
      this.add(cerceveYazi);
      yy += cerceveH;
      this.add(scene.add.rectangle(sol, snap(yy - 10), ICERIK, PX, 0xa8352d, 0.5).setOrigin(0));
    }
    baslik.setPosition(sol, yy);
    this.add(baslik);
    yy += 44;
    yonergeYazi.setPosition(sol, yy);
    this.add(yonergeYazi);
    yy += yonergeYazi.height + 8 + 8;
    gorevYazi.setPosition(sol, yy);
    this.add(gorevYazi);
    yy += gorevYazi.height + 8;
    for (let xx = sol; xx < W / 2 - 24; xx += 8) this.add(scene.add.rectangle(xx, yy, 4, 4, 0xa99d7e).setOrigin(0));
    yy += 12;
    kurallar.forEach((k, i) => {
      const o = kuralYazilari[i];
      o.setPosition(sol, yy);
      this.add(o);
      // Seçilebilir alan: kural satırı (kural kitabındaki satırla aynı kimlik).
      const alan = scene.add.rectangle(sol - 8, yy - 4, ICERIK + 16, o.height + 8, 0xffffff, 0.001).setOrigin(0);
      alan.setData('belge', 'kural').setData('alan', k.id);
      this.add(alan);
      this.satirlar.push({ belge: 'kural', alan: k.id, nesne: alan });
      yy += o.height + 12;
    });

    this.setSize(W, h);
    this.setInteractive({ draggable: true, useHandCursor: true });
    scene.add.existing(this);
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.setDepth(ustKatman());
      sfx.play('kagitAl');
    });
    this.on('dragend', () => sfx.play('kagitBirak'));
    this.on('drag', (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
      const [x2, y2] = this.masadaKonum(dx, dy);
      this.setPosition(x2, y2);
    });
  }

  masadaKonum(x: number, y: number): [number, number] {
    return masayaSikistir(x, y, this.genislik, this.yukseklik);
  }

  sinir(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.x - W / 2, this.y - this.yukseklik / 2, W, this.yukseklik);
  }

  /** İnceleme modu için yüzey. */
  yuzey(): Yuzey {
    return { derinlik: this.depth, sinir: this.sinir(), alanlar: this.satirlar };
  }
}
