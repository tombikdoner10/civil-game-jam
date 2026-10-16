import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { DEV } from '../config';
import { DocumentCard, MASA, ustKatman } from '../desk/DocumentCard';
import { belgeKur, BOY, SIRA } from '../desk/documents';
import { snap } from '../desk/pixel';
import { fisDusur, kuralKitabi, masaCiz } from '../desk/props';
import { DAMGA_ADI, damgaIzi, StampTray } from '../desk/StampTray';
import { GOZ, MASA_Y, Pencere } from '../desk/Window';
import type { BelgeTuru, Damga } from '../game/building';
import { GunOturumu } from '../game/session';
import { Controls } from '../systems/controls';
import { punch } from '../systems/fx';
import { fadeIn, goTo } from '../systems/transition';
import { SCENES } from './keys';

export interface GameData {
  gun?: number;
  tohum?: number;
}

/** Masadaki yerleşim (kart ortası, ekran). Biraz dağınık ama okunur. */
const YER: Record<BelgeTuru, [number, number]> = {
  foto: [196, 700],
  ruhsat: [572, 628],
  proje: [580, 920],
  vaziyet: [984, 636],
  karot: [968, 936],
  zemin: [1352, 920],
};
const KITAP: [number, number] = [1388, 640];
const FIS: [number, number] = [1300, 576];

/** Masa sahnesi: üstte belediye penceresi ve gişe, altta masa, belgeler ve damga çubuğu. */
export class GameScene extends Phaser.Scene {
  private controls!: Controls;
  private oturum!: GunOturumu;
  private gun = 1;
  private tohum = 0;
  private kartlar: DocumentCard[] = [];
  private mesgul = true;
  private bitirildi = false;
  private pencere!: Pencere;
  private tepsi!: StampTray;
  private fis?: Phaser.GameObjects.Container;
  private ilkDosya = true;

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
    this.fis = undefined;
    this.ilkDosya = true;
  }

  create(): void {
    fadeIn(this);
    this.cameras.main.setRoundPixels(true);
    this.controls = new Controls(this);
    this.oturum = new GunOturumu(this.gun, this.tohum);
    if (DEV) this.input.keyboard?.on('keydown-ENTER', () => this.bitir());

    MASA.x = 0;
    MASA.y = MASA_Y;
    MASA.w = 1880;
    MASA.h = 1080 - MASA_Y;
    masaCiz(this, MASA_Y);
    kuralKitabi(this, KITAP[0], KITAP[1]);
    this.pencere = new Pencere(this, this.gun);
    this.tepsi = new StampTray(this, (d) => this.damgala(d));

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
    this.pencere.setSaat(this.oturum.saatMetni());
  }

  /** Sıradaki dosya: siluet gişeye gelir, bina pencerede görünür, belgeler gişe gözünden masaya kayar. */
  private dosyaGetir(): void {
    const bina = this.oturum.mevcut;
    if (!bina) return;
    this.pencere.setDosya(this.oturum.no, this.oturum.toplam);
    this.pencere.binaGoster(bina);
    this.pencere.siluetGelsin(this.tohum + this.oturum.no * 7919);
    const gecikme = 350;
    this.kartlar = SIRA.map((tur, i) => {
      const [hx, hy] = YER[tur];
      const k = belgeKur(this, tur, bina, GOZ.x, GOZ.y - BOY[tur][1] / 2);
      k.setDepth(ustKatman()).setAlpha(0);
      this.tweens.add({ targets: k, alpha: 1, duration: 120, delay: gecikme + i * 80 });
      this.tweens.add({
        targets: k,
        x: snap(hx),
        y: snap(hy),
        duration: 420,
        delay: gecikme + i * 80,
        ease: 'Cubic.easeOut',
        onStart: () => sfx.play('whoosh'),
      });
      return k;
    });
    this.time.delayedCall(gecikme + 420 + SIRA.length * 80, () => {
      this.mesgul = false;
      if (this.ilkDosya) {
        this.ilkDosya = false;
        this.tepsi.ac();
      }
    });
  }

  private damgala(damga: Damga): void {
    if (this.mesgul || this.bitirildi) return;
    const sonuc = this.oturum.damgala(damga);
    if (!sonuc) return;
    this.mesgul = true;

    // Tokmak iner, mürekkep ruhsata basılır.
    const ruhsat = this.kartlar.find((k) => k.tur === 'ruhsat');
    this.tepsi.bas(damga);
    this.time.delayedCall(70, () => {
      sfx.play('thud');
      punch(this, 0.01, 110);
      if (ruhsat?.active) {
        ruhsat.one();
        const iz = damgaIzi(this, damga, this.tohum + this.oturum.kararlar.length * 131);
        iz.setPosition(-ruhsat.w / 2 + 152, ruhsat.h / 2 - 60);
        ruhsat.add(iz);
      }
    });

    // Uyarı fişi (yer tutucu geri bildirim).
    this.time.delayedCall(450, () => {
      this.fis?.destroy();
      const metin = sonuc.dogru ? 'Doğru karar' : `Yanlış karar:\ndoğrusu ${DAMGA_ADI[sonuc.dogruDamga]}`;
      this.fis = fisDusur(this, sonuc.dogru, metin, FIS[0], FIS[1]);
      sfx.play(sonuc.dogru ? 'confirm' : 'error');
    });

    // Belgeler toplanıp gişeden geri verilir, mal sahibi ayrılır.
    const eski = this.kartlar;
    this.kartlar = [];
    const topla = 1300;
    this.time.delayedCall(topla, () => {
      this.pencere.siluetGitsin();
      eski.forEach((k, i) => {
        this.input.setDraggable(k, false);
        k.disableInteractive();
        this.tweens.add({
          targets: k,
          x: GOZ.x,
          y: GOZ.y - k.h / 2 - 40,
          duration: 380,
          delay: i * 50,
          ease: 'Cubic.easeIn',
          onComplete: () => k.destroy(),
        });
      });
      sfx.play('whoosh');
    });
    this.time.delayedCall(topla + 380 + eski.length * 50 + 120, () => {
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
