// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import { TUNING } from '../game/tuning';
import { PAL } from './palette';
import { PX, rastgele, snap, Tuval } from './pixel';

export interface SoyleSecenek {
  /** Balonun üstünde küçük başlık (ör. "SOR · KAÇAK KAT"). */
  baslik?: string;
  /** Yazma başlayınca / bitince (portrenin ağzı için). */
  konusan?: (on: boolean) => void;
  /** Metin tamamen yazılınca. */
  bitince?: () => void;
}

const KAGIT = '#e3d8b8';
const KAGIT_KOYU = '#bfb08a';
/** Yarıda kapatılan balon tamamlanınca solmadan önce bu kadar kalır (ms). */
const YARIM_KALIS = 500;

/**
 * Gişedeki kişinin konuşma balonu (G17): cama iliştirilmiş kâğıt fiş gibi, VT323. Metin harf harf yazılır
 * (kısa tık sesi); tıklayınca tamamlanır, tamamken tıklayınca kapanır. Yazı bitince bir süre kalır ve solar.
 * Oyunu durdurmaz: mesai saati akmaya devam eder.
 */
export class Konusma {
  private kap?: Phaser.GameObjects.Container;
  private yazi?: Phaser.GameObjects.Text;
  private tam = '';
  private n = 0;
  private saat?: Phaser.Time.TimerEvent;
  private solma?: Phaser.Time.TimerEvent;
  private secenek: SoyleSecenek = {};
  private sayac = 0;
  /** Solmakta olan önceki balon: yeni cümle gelirse hemen kalkar (üst üste binmesin). */
  private solan?: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    /** Balonun sol üst köşesi ve genişliği (ekran). */
    private readonly alan: { x: number; y: number; w: number },
    private readonly derinlik: number,
  ) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.temizle());
  }

  get yaziyor(): boolean {
    return !!this.saat;
  }

  /** Yeni cümle: öncekinin yerine geçer. */
  soyle(metin: string, secenek: SoyleSecenek = {}): void {
    this.temizle();
    this.solan?.destroy();
    this.solan = undefined;
    this.secenek = secenek;
    const s = this.scene;
    const { x, y, w } = this.alan;
    const ic = w - 40;
    const kap = s.add.container(snap(x), snap(y)).setDepth(this.derinlik);
    let ust = 20;
    let baslik: Phaser.GameObjects.Text | undefined;
    if (secenek.baslik) {
      baslik = s.add.text(20, 14, secenek.baslik, { fontFamily: FONT, fontSize: '24px', color: PAL.murekkepSoluk }).setOrigin(0, 0);
      ust = 44;
    }
    const yazi = s.add
      .text(20, ust, metin, { fontFamily: FONT, fontSize: '32px', color: PAL.murekkep, lineSpacing: 2, wordWrap: { width: ic, useAdvancedWrap: true } })
      .setOrigin(0, 0);
    const h = snap(ust + yazi.height + 20, PX * 2);
    // Satırlar baştan bölünür: yazılırken kelime satır sonundan aşağı zıplamasın.
    const bolunmus = yazi.getWrappedText(metin).join('\n');
    yazi.setWordWrapWidth(null);
    yazi.setText('');
    // Kâğıt (delikli üst kenar) ve gişeye doğru kuyruk
    const W = w / PX;
    const H = h / PX;
    const t = new Tuval(s, W + 6, H + 2, 'balon');
    t.rect(1, 2, W, H, '#00000055');
    t.rect(0, 0, W, H, KAGIT);
    t.benek(0, 0, W, H, KAGIT_KOYU, 0.04, rastgele(W * 7 + H));
    for (let xx = 0; xx < W; xx += 2) t.ctx.clearRect(xx, 0, 1, 1);
    t.rect(0, 1, W, 1, KAGIT_KOYU);
    t.frame(0, 0, W, H, KAGIT_KOYU);
    // Bant parçası (cama iliştirilmiş)
    t.rect(Math.floor(W / 2) - 6, 0, 12, 3, '#cfc8a8');
    t.dither(Math.floor(W / 2) - 6, 0, 12, 3, '#b8b090');
    // Kuyruk: sağ kenardan konuşana
    const ky = Math.min(H - 6, 10);
    for (let i = 0; i < 6; i++) t.rect(W - 1, ky + i, 6 - i, 1, KAGIT);
    t.px(W + 5, ky, KAGIT_KOYU);
    const zemin = t.goruntu(0, 0).setOrigin(0);
    kap.add(zemin);
    if (baslik) kap.add(baslik);
    kap.add(yazi);
    zemin.setInteractive({ useHandCursor: true }).setData('incelemeYok', true);
    zemin.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
      if (this.yaziyor) this.tamamla();
      else this.kapat();
    });
    kap.setAlpha(0).setY(snap(y) - 12);
    s.tweens.add({ targets: kap, alpha: 1, y: snap(y), duration: 140, ease: 'Cubic.easeOut' });
    this.kap = kap;
    this.yazi = yazi;
    this.tam = bolunmus;
    this.n = 0;
    this.sayac = 0;
    secenek.konusan?.(true);
    this.saat = s.time.addEvent({ delay: TUNING.diyalog.harfMs, loop: true, callback: () => this.harf() });
  }

  /** Metni hemen tamamla. */
  tamamla(): void {
    if (!this.saat || !this.yazi) return;
    this.n = this.tam.length;
    this.yazi.setText(this.tam);
    this.bitir();
  }

  /**
   * Balonu sol (hemen değil, kısa bir solmayla). Yazı henüz bitmediyse (G28: kişi cümle bitmeden gişeden ayrılır)
   * cümle anında tamamlanır ve okunsun diye kısa bir an (YARIM_KALIS ms) durduktan sonra solar; balon hiç yarım
   * cümleyle kaybolmaz. Oyun akışı beklemez.
   */
  kapat(): void {
    const kap = this.kap;
    if (!kap) return;
    const yarim = this.yaziyor;
    if (yarim) this.yazi?.setText(this.tam);
    this.temizle(false);
    for (const o of kap.list) (o as Phaser.GameObjects.Image).disableInteractive?.();
    this.solan = kap;
    this.scene.tweens.add({
      targets: kap,
      alpha: 0,
      duration: 200,
      delay: yarim ? YARIM_KALIS : 0,
      onComplete: () => {
        if (this.solan === kap) this.solan = undefined;
        kap.destroy();
      },
    });
  }

  /** Her şeyi hemen kaldır. */
  temizle(yokEt = true): void {
    this.saat?.remove();
    this.saat = undefined;
    this.solma?.remove();
    this.solma = undefined;
    this.secenek.konusan?.(false);
    this.secenek = {};
    if (yokEt) this.kap?.destroy();
    this.kap = undefined;
    this.yazi = undefined;
  }

  private harf(): void {
    if (!this.yazi) return;
    this.n++;
    const c = this.tam[this.n - 1];
    this.yazi.setText(this.tam.slice(0, this.n));
    if (c && c !== ' ' && c !== '[' && c !== ']' && this.sayac++ % 2 === 0) sfx.play('konus');
    if (this.n >= this.tam.length) this.bitir();
  }

  private bitir(): void {
    this.saat?.remove();
    this.saat = undefined;
    const sec = this.secenek;
    sec.konusan?.(false);
    sec.bitince?.();
    const D = TUNING.diyalog;
    this.solma = this.scene.time.delayedCall(D.kalisMs + this.tam.length * D.kalisHarfMs, () => this.kapat());
  }
}
