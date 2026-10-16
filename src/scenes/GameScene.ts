import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { COLORS, DEV, HEIGHT, WIDTH } from '../config';
import { DocumentCard, KART_W, MASA } from '../desk/DocumentCard';
import { belgeKur, SIRA } from '../desk/documents';
import { StampBar } from '../desk/StampBar';
import type { Damga } from '../game/building';
import { GunOturumu } from '../game/session';
import { Controls } from '../systems/controls';
import { floatText, punch } from '../systems/fx';
import { fadeIn, goTo } from '../systems/transition';
import { Button } from '../ui/Button';
import { label } from '../ui/text';
import { SCENES } from './keys';

export interface GameData {
  gun?: number;
  tohum?: number;
}

const DAMGA_ADI: Record<Damga, string> = { guvenli: 'GÜVENLİ', guclendir: 'GÜÇLENDİR', bosalt: 'BOŞALT' };

/** Masa sahnesi: dosyanın belgeleri masada, damga vurulunca sıradaki dosya gelir. */
export class GameScene extends Phaser.Scene {
  private controls!: Controls;
  private oturum!: GunOturumu;
  private gun = 1;
  private tohum = 0;
  private kartlar: DocumentCard[] = [];
  private mesgul = true;
  private bitirildi = false;
  private saatYazi!: Phaser.GameObjects.Text;
  private dosyaYazi!: Phaser.GameObjects.Text;
  private geriBildirim!: Phaser.GameObjects.Text;
  private damgaBar!: StampBar;

  constructor() {
    super(SCENES.Game);
  }

  init(data: GameData): void {
    this.gun = data?.gun ?? 1;
    this.tohum = data?.tohum ?? Math.floor(Math.random() * 1_000_000_000);
    if (DEV) {
      const q = new URLSearchParams(location.search);
      const g = Number(q.get('gun'));
      const t = q.get('tohum');
      if (q.has('gun') && Number.isFinite(g) && g >= 1) this.gun = Math.floor(g);
      if (t !== null && Number.isFinite(Number(t))) this.tohum = Number(t);
    }
    this.kartlar = [];
    this.mesgul = true;
    this.bitirildi = false;
  }

  create(): void {
    fadeIn(this);
    this.controls = new Controls(this);
    this.oturum = new GunOturumu(this.gun, this.tohum);
    if (DEV) this.input.keyboard?.on('keydown-ENTER', () => this.bitir());

    // Masa ve üst şerit
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x262a33).setOrigin(0);
    this.add.rectangle(MASA.x, MASA.y, MASA.w, MASA.h - 0, 0x30353f).setOrigin(0).setStrokeStyle(3, 0x454c5a);
    this.add.rectangle(0, 0, WIDTH, 100, COLORS.panel).setOrigin(0).setDepth(1500);
    label(this, 40, 50, `Gün ${this.gun}`, { size: 44, weight: 'bold', align: 'left' }).setDepth(1501);
    this.saatYazi = label(this, WIDTH / 2, 50, '09:00', { size: 52, weight: 'bold', mono: true, color: COLORS.primary }).setDepth(1501);
    this.dosyaYazi = label(this, WIDTH - 40, 50, '', { size: 36, align: 'right', color: COLORS.muted }).setDepth(1501);
    this.geriBildirim = label(this, WIDTH / 2, 150, '', { size: 36, weight: 'bold', stroke: true }).setDepth(1600).setAlpha(0);

    // Sağ sütun: kural kitabı (G4) ve damgalar
    const kk = new Button(this, 1770, 230, 'Kural kitabı', () => undefined, { width: 270, height: 80, fontSize: 30, color: COLORS.muted });
    kk.setEnabled(false).setDepth(2000);
    this.damgaBar = new StampBar(this, 1770, 600, (d) => this.damgala(d));

    this.dosyaGetir();

    // Pencere odağı kaçarsa (alt-tab, başka sekme) oyunu duraklat.
    const onBlur = (): void => {
      if (this.scene.isActive()) this.pauseGame();
    };
    this.game.events.on(Phaser.Core.Events.BLUR, onBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(Phaser.Core.Events.BLUR, onBlur));
  }

  update(_time: number, delta: number): void {
    if (this.controls.justDown('pause')) {
      this.pauseGame();
      return;
    }
    if (this.bitirildi) return;
    if (!this.mesgul) {
      this.oturum.ilerle(Math.min(delta, 100) / 1000);
      if (this.oturum.mesaiBitti) {
        this.mesgul = true;
        this.bitir();
        return;
      }
    }
    this.saatYazi.setText(this.oturum.saatMetni());
  }

  /** Sıradaki dosyanın belgelerini masaya getir. */
  private dosyaGetir(): void {
    const bina = this.oturum.mevcut;
    if (!bina) return;
    this.dosyaYazi.setText(`Dosya ${this.oturum.no}/${this.oturum.toplam}`);
    const kolonX = [300, 800, 1300];
    const satirY = [330, 710];
    this.kartlar = SIRA.map((tur, i) => {
      const hx = kolonX[i % 3] + (i % 2 === 0 ? -6 : 6);
      const hy = satirY[Math.floor(i / 3)];
      const k = belgeKur(this, tur, bina, hx, hy - 900);
      k.setDepth(10 + i);
      this.tweens.add({ targets: k, y: hy, duration: 380, delay: i * 70, ease: 'Cubic.easeOut' });
      this.input.setDraggable(k);
      return k;
    });
    this.time.delayedCall(380 + SIRA.length * 70, () => {
      this.mesgul = false;
    });
  }

  private damgala(damga: Damga): void {
    if (this.mesgul || this.bitirildi) return;
    const sonuc = this.oturum.damgala(damga);
    if (!sonuc) return;
    this.mesgul = true;

    const dugme = this.damgaBar.dugmeler.get(damga);
    sfx.play('thud');
    punch(this, 0.015, 120);
    if (dugme) this.tweens.add({ targets: dugme, scale: { from: 0.85, to: 1 }, duration: 200, ease: 'Back.easeOut' });

    const metin = sonuc.dogru ? 'Doğru' : `Yanlış: doğrusu ${DAMGA_ADI[sonuc.dogruDamga]}`;
    this.geriBildirim.setText(metin).setColor(sonuc.dogru ? '#06d6a0' : '#ef476f').setAlpha(1);
    this.tweens.add({ targets: this.geriBildirim, alpha: 0, delay: 1000, duration: 400 });
    floatText(this, WIDTH / 2, 230, sonuc.dogru ? '+1' : '0', sonuc.dogru ? COLORS.success : COLORS.danger, 48);

    // Belgeler masadan kayarak çıkar.
    const eski = this.kartlar;
    this.kartlar = [];
    eski.forEach((k, i) => {
      this.input.setDraggable(k, false);
      this.tweens.add({
        targets: k,
        x: -KART_W,
        duration: 350,
        delay: i * 40,
        ease: 'Cubic.easeIn',
        onComplete: () => k.destroy(),
      });
    });
    this.time.delayedCall(350 + eski.length * 40 + 80, () => {
      if (this.oturum.bitti) this.bitir();
      else this.dosyaGetir();
    });
  }

  private bitir(): void {
    if (this.bitirildi) return;
    this.bitirildi = true;
    this.mesgul = true;
    const dogru = this.oturum.dogruSayisi;
    const kararSayisi = this.oturum.kararlar.length;
    const oran = kararSayisi > 0 ? dogru / this.oturum.toplam : 0;
    this.endGame(dogru, oran >= 0.5);
  }

  pauseGame(): void {
    this.scene.launch(SCENES.Pause, { from: SCENES.Game });
    this.scene.pause();
  }

  endGame(score: number, won: boolean): void {
    goTo(this, SCENES.Result, { score, won, title: 'Gün bitti' });
  }
}

