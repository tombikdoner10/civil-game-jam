// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import { aktifKurallar } from '../game/rules';
import { masayaSikistir, ustKatman } from './DocumentCard';
import type { SecimNesne, Yuzey } from './Inspect';
import { num, PAL } from './palette';
import { PX, rastgele, snap, Tuval } from './pixel';
import { kuralKitabi } from './props';

/** Açık kitabın boyu (ekran pikseli). Masada sürüklenir; masa sınırının (damga çubuğunun) dışına çıkmaz. */
const SAYFA = { w: 448, h: 560 };
/** Sayfada kural satırlarının sığacağı alt sınır (sayfa üstünden); altında sayfa çevirme satırı. */
const ICERIK_UST = 120;
const ICERIK_ALT = SAYFA.h - 64;

const KAGIT = '#cfc5a6';
const KAGIT_KOYU = '#a99d7e';
const KAPAK = '#3d4a3e';
const KAPAK_KOYU = '#2f3a31';
const ACIK_YAZI = '#e3d8b8';

/**
 * Kural kitabı (gün 2'den itibaren masada). Kapalı kitaba tıklayınca açılır; açık kitap Papers, Please'teki
 * gibi masada sürüklenir (damga çubuğunu örtmez, belgelerle üst üste dizilir). Köşedeki X kapatır.
 * O güne kadar aktif kurallar satır satır; o gün gelenlerde "YENİ" işareti. Sığmazsa sayfa çevrilir
 * (< > düğmeleri). Kural satırları inceleme modunda seçilebilir.
 */
export class RuleBook {
  acik = false;
  private readonly kapali: Phaser.GameObjects.Container;
  private readonly sayfa: Phaser.GameObjects.Container;
  private readonly sayfalar: Phaser.GameObjects.Container[] = [];
  private readonly satirlar: SecimNesne[] = [];
  private sayfaNo = 0;
  private sayfaYazi?: Phaser.GameObjects.Text;
  private yeniIsaret?: Phaser.GameObjects.Container;
  /** Yeni kuralın ilk göründüğü sayfa: kitap ilk açılışta orada açılır. */
  private yeniSayfa = -1;
  private kilitli = false;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly gun: number,
  ) {
    this.kapali = kuralKitabi(scene, x, y);
    this.kapali.setSize(54 * PX, 69 * PX);
    this.kapali.setInteractive({ useHandCursor: true });
    this.kapali.setData('incelemeYok', true);
    this.kapali.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.ac());

    this.sayfa = this.sayfaKur();
    if (aktifKurallar(gun).some((k) => k.ilkGun === gun)) this.yeniIsaretKur();
  }

  get sinir(): Phaser.Geom.Rectangle {
    if (this.acik) return new Phaser.Geom.Rectangle(this.sayfa.x - SAYFA.w / 2, this.sayfa.y - SAYFA.h / 2, SAYFA.w, SAYFA.h);
    return this.kapali.getBounds();
  }

  ac(): void {
    if (this.acik) return;
    this.acik = true;
    sfx.play('kitapAc');
    if (this.yeniIsaret) {
      this.scene.tweens.killTweensOf(this.yeniIsaret);
      this.yeniIsaret.destroy();
      this.yeniIsaret = undefined;
      this.sayfaGoster(Math.max(0, this.yeniSayfa));
    }
    this.kapali.setVisible(false);
    this.kapali.disableInteractive(true);
    // Kapalı kitabın yerinde açılır (masa sınırı içinde).
    const [hx, hy] = masayaSikistir(this.kapali.x, this.kapali.y, SAYFA.w, SAYFA.h);
    this.scene.tweens.killTweensOf(this.sayfa);
    this.sayfa.setDepth(ustKatman());
    this.sayfa.setVisible(true).setAlpha(0).setPosition(hx, hy + 24);
    this.scene.tweens.add({ targets: this.sayfa, alpha: 1, y: hy, duration: 140, ease: 'Cubic.easeOut' });
    if (!this.kilitli) this.sayfa.setInteractive();
  }

  kapa(): void {
    if (!this.acik) return;
    this.acik = false;
    sfx.play('kitapKapa');
    this.scene.tweens.killTweensOf(this.sayfa);
    this.sayfa.setVisible(false);
    this.sayfa.disableInteractive();
    this.kapali.setVisible(true);
    this.kapali.setInteractive();
  }

  degistir(): void {
    if (this.acik) this.kapa();
    else this.ac();
  }

  /** İnceleme modunda açık kitap sürüklenmez (sayfa çevirme ve X çalışır). */
  kilitle(on: boolean): void {
    this.kilitli = on;
    if (!this.acik) return;
    if (on) this.sayfa.disableInteractive();
    else this.sayfa.setInteractive();
  }

  /** Masa sınırı daralınca (damga çubuğu açıldı) açık kitabı içeri kaydırır. */
  masayaIt(): void {
    if (!this.acik) return;
    const [x, y] = masayaSikistir(this.sayfa.x, this.sayfa.y, SAYFA.w, SAYFA.h);
    if (x === this.sayfa.x && y === this.sayfa.y) return;
    this.scene.tweens.add({ targets: this.sayfa, x, y, duration: 220, ease: 'Cubic.easeOut' });
  }

  /** İnceleme modu için: açıkken sayfa ve görünen sayfadaki kural satırları. */
  yuzey(): Yuzey | null {
    if (!this.acik) return null;
    return { derinlik: this.sayfa.depth, sinir: this.sinir, alanlar: this.satirlar };
  }

  /** Kapalı kitabın üstünde yanıp sönen "YENİ" sekmesi: o gün yeni kural geldi (kitap açılınca kalkar). */
  private yeniIsaretKur(): void {
    const s = this.scene;
    const k = this.kapali;
    const kap = s.add.container(snap(k.x + 40), snap(k.y - 69 * PX * 0.5 - 12)).setDepth(6);
    const yazi = s.add.text(0, 0, 'YENİ', { fontFamily: FONT, fontSize: '30px', color: '#f0e6cc' }).setOrigin(0.5);
    const w = snap(yazi.width + 20);
    kap.add(s.add.rectangle(PX, PX, w + 8, 40, 0x000000, 0.4));
    kap.add(s.add.rectangle(0, 0, w + 8, 40, 0x1d191b));
    kap.add(s.add.rectangle(0, 0, w, 32, num(PAL.damgaBosalt)));
    kap.add(yazi);
    this.yeniIsaret = kap;
    s.tweens.add({ targets: kap, alpha: 0.35, duration: 450, yoyo: true, repeat: -1 });
  }

  private sayfaGoster(i: number): void {
    this.sayfaNo = Phaser.Math.Clamp(i, 0, this.sayfalar.length - 1);
    this.sayfalar.forEach((p, j) => p.setVisible(j === this.sayfaNo));
    this.sayfaYazi?.setText(`${this.sayfaNo + 1}/${this.sayfalar.length}`);
  }

  private sayfaKur(): Phaser.GameObjects.Container {
    const s = this.scene;
    const W = SAYFA.w / PX;
    const H = SAYFA.h / PX;
    const rnd = rastgele(77);
    const t = new Tuval(s, W + 2, H + 3, 'kitap-sayfa');
    // Gölge, cilt kenarı ve sayfa
    t.rect(2, 3, W, H, '#00000066');
    t.rect(0, 0, W, H, KAPAK_KOYU);
    t.rect(1, 1, W - 2, H - 2, KAPAK);
    t.rect(3, 2, W - 5, H - 4, KAGIT);
    t.benek(3, 2, W - 5, H - 4, KAGIT_KOYU, 0.03, rnd);
    for (let yy = 4; yy < H - 2; yy += 2) t.rect(W - 3, yy, 1, 1, KAGIT_KOYU);
    t.dither(3, H - 4, W - 5, 1, KAGIT_KOYU);
    // Başlık bandı (tutup sürükleme yeri gibi görünür)
    t.rect(3, 2, W - 5, 14, KAPAK);
    t.rect(3, 16, W - 5, 1, KAPAK_KOYU);
    for (let x = 5; x < W - 4; x += 2) t.px(x, 4, '#4b5a4c');

    const kap = s.add.container(0, 0);
    kap.setVisible(false);
    kap.add(t.goruntu(0, 0));
    kap.setSize(SAYFA.w, SAYFA.h);
    // Sürüklenebilir; sayfa altındaki belgeleri tıklamaya kapatır.
    kap.setInteractive({ draggable: true, cursor: 'grab' });
    kap.disableInteractive();
    kap.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => kap.setDepth(ustKatman()));
    kap.on('drag', (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
      const [x, y] = masayaSikistir(dx, dy, SAYFA.w, SAYFA.h);
      kap.setPosition(x, y);
    });

    const sol = -SAYFA.w / 2;
    const ust = -SAYFA.h / 2;
    // VT323 50 px: yazı tipinin pikseli tam 2 ekran pikseli (belge başlıklarıyla aynı, keskin).
    kap.add(s.add.text(sol + 24, ust + 34, 'KURAL KİTABI', { fontFamily: FONT, fontSize: '50px', color: ACIK_YAZI }).setOrigin(0, 0.5));
    const dugme = (x: number, y: number, metin: string, is: () => void): Phaser.GameObjects.Text => {
      const o = s.add
        .text(x, y, metin, { fontFamily: FONT, fontSize: '44px', color: metin === 'X' ? ACIK_YAZI : PAL.murekkep })
        .setOrigin(0.5)
        .setPadding(10, 2, 10, 2)
        .setInteractive({ useHandCursor: true });
      o.setData('kitapKapat', metin === 'X').setData('incelemeYok', true);
      o.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation();
        is();
      });
      kap.add(o);
      return o;
    };
    dugme(sol + SAYFA.w - 30, ust + 36, 'X', () => this.kapa());

    kap.add(
      s.add
        .text(sol + 24, ust + 92, `GÜN ${this.gun} · Yürürlükteki kurallar`, { fontFamily: FONT, fontSize: '28px', color: PAL.murekkepSoluk })
        .setOrigin(0, 0.5),
    );

    // Kural satırları sayfalara dağıtılır: her biri inceleme modunda seçilebilir bir öğe.
    const genislik = SAYFA.w - 48 - 32;
    let sayfa = s.add.container(0, 0);
    this.sayfalar.push(sayfa);
    let y = ust + ICERIK_UST;
    aktifKurallar(this.gun).forEach((k, i) => {
      const yeni = k.ilkGun === this.gun;
      const yazi = s.add
        .text(sol + 56, y + 4, k.metin, {
          fontFamily: FONT,
          fontSize: '30px',
          color: PAL.murekkep,
          lineSpacing: 2,
          wordWrap: { width: yeni ? genislik - 64 : genislik, useAdvancedWrap: true },
        })
        .setOrigin(0);
      const h = snap(Math.max(yazi.height, 32) + 12);
      if (y + h > ust + ICERIK_ALT && y > ust + ICERIK_UST) {
        sayfa = s.add.container(0, 0);
        this.sayfalar.push(sayfa);
        y = ust + ICERIK_UST;
        yazi.setY(y + 4);
      }
      const no = s.add.text(sol + 24, y + 4, `${i + 1}.`, { fontFamily: FONT, fontSize: '30px', color: yeni ? PAL.damgaBosalt : PAL.murekkep }).setOrigin(0);
      const alan = s.add.rectangle(sol + 16, y, SAYFA.w - 40, h, 0xffffff, 0.001).setOrigin(0);
      alan.setData('belge', 'kural').setData('alan', k.id);
      sayfa.add([alan, no, yazi]);
      if (yeni) {
        if (this.yeniSayfa < 0) this.yeniSayfa = this.sayfalar.length - 1;
        const etiket = s.add.text(sol + SAYFA.w - 36, y + 6, 'YENİ', { fontFamily: FONT, fontSize: '26px', color: '#f0e6cc', backgroundColor: PAL.damgaBosalt, padding: { x: 6, y: 0 } }).setOrigin(1, 0);
        sayfa.add(etiket);
      }
      this.satirlar.push({ belge: 'kural', alan: k.id, nesne: alan });
      y += h;
      // Satır arası noktalı çizgi
      for (let xx = sol + 24; xx < sol + SAYFA.w - 32; xx += 8) sayfa.add(s.add.rectangle(xx, y, 4, 4, 0xa99d7e).setOrigin(0));
      y += 8;
    });
    kap.add(this.sayfalar);

    if (this.sayfalar.length > 1) {
      const ay = ust + SAYFA.h - 36;
      dugme(sol + 48, ay, '<', () => {
        sfx.play('sayfa');
        this.sayfaGoster(this.sayfaNo - 1);
      });
      dugme(sol + SAYFA.w - 52, ay, '>', () => {
        sfx.play('sayfa');
        this.sayfaGoster(this.sayfaNo + 1);
      });
      this.sayfaYazi = s.add.text(0, ay, '', { fontFamily: FONT, fontSize: '30px', color: PAL.murekkepSoluk }).setOrigin(0.5);
      kap.add(this.sayfaYazi);
    }
    this.sayfaGoster(0);
    return kap;
  }
}
