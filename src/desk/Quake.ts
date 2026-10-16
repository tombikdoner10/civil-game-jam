// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import { depremSonucu, type HasarDurumu } from '../game/rules';
import type { SarsintiSonucu } from '../game/session';
import { settings } from '../systems/settings';
import { TEX } from '../systems/textures';
import { PAL } from './palette';
import { snap } from './pixel';
import type { Sokak, SokakHasar, SokakYeri } from './Street';

export interface SarsintiSecenek {
  /** Toplam süre (ms): yükselme, tepe, sönme ve durulma. */
  sure?: number;
  /** Kamera sarsıntısının tepe yoğunluğu (Phaser shake). */
  genlik?: number;
  /** En ağır sonuç (öncü: 'hasarli', yani en fazla çatlak). */
  enAgir?: HasarDurumu;
  /** Gizli zayıflıklar (düz demir, deniz kumu, eski yönetmelik) sayılsın mı. Öncü: hayır. */
  gizli?: boolean;
  /** Ağır hasarlı binalar çöksün mü (G5 büyük deprem). */
  cokme?: boolean;
  /** Ekranın üstünde şerit yazı (yer tutucu metin; verilmezse yok). */
  yazi?: string;
}

export interface QuakeSonucu extends SarsintiSonucu {
  yer: number;
  /** Sokakta görünen sonuç (çökme dahil). */
  gorunen: SokakHasar;
}

const SIRA: HasarDurumu[] = ['ayakta', 'hasarli', 'agirHasar'];
const TIK = 50;

/** Sarsıntı zarfı (0..1): yükselir, tepede kalır, söner; son kısım durulma (toz çöker). */
function zarf(u: number): number {
  if (u < 0.06) return 0;
  if (u < 0.2) return ((u - 0.06) / 0.14) * 0.35;
  if (u < 0.3) return 0.35 + ((u - 0.2) / 0.1) * 0.65;
  if (u < 0.55) return 1;
  if (u < 0.78) return 1 - (u - 0.55) / 0.23;
  return 0;
}

/**
 * Sokakta deprem sekansı (öncü sarsıntı ve G5 büyük deprem aynı sınıf). Masa ve pencere sarsılır (kamera),
 * tavandan toz ve sıva dökülür, binalar titrer, lambalar göz kırpar; her bina depremSonucu ile tepki verir
 * (çatlak, ağır hasar ya da çökme). Hepsi sahnenin zamanlayıcısı ve tween'leriyle: sahne duraklayınca sekans da durur.
 */
export class Quake {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sokak: Sokak,
    /** Sokak tozunun derinliği (pencere duvarının altında kalsın, pencereden taşmasın). */
    private readonly sokakDerinlik: number,
  ) {}

  oynat(siddet: number, binalar: readonly SokakYeri[], bitince: (sonuclar: QuakeSonucu[]) => void, secenek: SarsintiSecenek = {}): void {
    const scene = this.scene;
    const T = secenek.sure ?? 9000;
    const genlik = secenek.genlik ?? 0.006;
    const enAgir = SIRA.indexOf(secenek.enAgir ?? 'agirHasar');

    // Sonuçlar baştan hesaplanır; görüntü tepe anında sırayla işlenir.
    const sonuclar: QuakeSonucu[] = binalar.map((b) => {
      const s = depremSonucu(b.bina, b.damga, siddet, secenek.gizli ?? true);
      let durum = SIRA[Math.min(SIRA.indexOf(s.durum), enAgir)];
      // Önceki sarsıntıdan kalan hasar geri gitmez.
      if (b.hasar && b.hasar !== 'yikik' && SIRA.indexOf(b.hasar) > SIRA.indexOf(durum)) durum = b.hasar;
      const gorunen: SokakHasar = secenek.cokme && durum === 'agirHasar' ? 'yikik' : durum;
      return { yer: b.yer, dosyaId: b.bina.id, durum, bos: s.bos, gorunen };
    });

    this.sokak.vurguKaldir();
    if (binalar.length > 0) {
      const yerler = binalar.map((b) => b.yer);
      this.sokak.odakla(Math.min(...yerler), Math.max(...yerler), 500);
    }

    // Parçacıklar: tavandan toz ve sıva parçaları (odanın her yerine), binalardan toz (pencere içinde).
    const tavan = scene.add
      .particles(0, -8, TEX.px, {
        x: { min: 0, max: 1920 },
        speedY: { min: 20, max: 90 },
        speedX: { min: -12, max: 12 },
        gravityY: 240,
        lifespan: { min: 2200, max: 3600 },
        scale: { min: 0.5, max: 1 },
        tint: [0xb8ae9c, 0x9a9282, 0xd0c6ae],
        alpha: { start: 0.85, end: 0.15 },
        emitting: false,
      })
      .setDepth(4500);
    const parca = scene.add
      .particles(0, -8, TEX.px, {
        x: { min: 40, max: 1880 },
        speedY: { min: 40, max: 120 },
        gravityY: 900,
        lifespan: 1600,
        scale: { min: 1, max: 2 },
        tint: [0xc8bfa6, 0xa89e88],
        rotate: { min: 0, max: 90 },
        emitting: false,
      })
      .setDepth(4501);
    const pen = this.sokak.pencere;
    const toz = scene.add
      .particles(0, 0, TEX.px, {
        speedX: { min: -36, max: 36 },
        speedY: { min: -46, max: -6 },
        gravityY: 26,
        lifespan: { min: 900, max: 1700 },
        scale: 0.5,
        tint: [0x9a9282, 0x7a746a, 0xb8ae9c],
        alpha: { start: 0.9, end: 0 },
        emitting: false,
        deathZone: { type: 'onLeave', source: pen },
      })
      .setDepth(this.sokakDerinlik + 3);

    const yazi = secenek.yazi ? this.seritKur(secenek.yazi, 0.24 * T) : undefined;

    // Hasarlı binalar tepe anında sırayla tepki verir.
    const tepkiler = sonuclar.filter((s) => s.gorunen !== 'ayakta');
    const tepkiBas = 0.32 * T;
    const tepkiAralik = tepkiler.length > 0 ? (0.2 * T) / tepkiler.length : 0;
    tepkiler.forEach((s, j) => {
      scene.time.delayedCall(tepkiBas + j * tepkiAralik, () => {
        this.sokak.hasarVer(s.yer, s.gorunen, true);
        const kutu = this.sokak.dunyaKutu(s.yer);
        const n = s.gorunen === 'yikik' ? 60 : s.gorunen === 'agirHasar' ? 30 : 16;
        for (let k = 0; k < n; k++) {
          const x = kutu.x + Math.random() * kutu.width;
          const y = kutu.bottom - Math.random() * (s.gorunen === 'yikik' ? kutu.height : kutu.height * 0.6);
          toz.emitParticleAt(x, y, 1);
        }
        sfx.play('hit', { volume: 0.5, rate: 0.6 });
      });
    });

    // Gürleme
    sfx.play('explosion', { volume: 0.35, rate: 0.5 });
    scene.time.delayedCall(0.22 * T, () => sfx.play('explosion', { volume: 0.55, rate: 0.45 }));
    scene.time.delayedCall(0.38 * T, () => sfx.play('explosion', { volume: 0.5, rate: 0.4 }));

    const cam = scene.cameras.main;
    let t = 0;
    const tik = scene.time.addEvent({
      delay: TIK,
      loop: true,
      callback: () => {
        t += TIK;
        const e = zarf(t / T);
        if (e > 0 && settings.get().shake) cam.shake(TIK + 30, genlik * (0.25 + 0.75 * e), true);
        this.sokak.sallan(e > 0.05 ? 0.6 + e : 0);
        // Toz yoğunluğu sarsıntıyla artar; tepede sıva parçaları.
        const adet = Math.floor(e * 8 + Math.random() * e * 4);
        if (adet > 0) tavan.emitParticle(adet);
        if (e > 0.5 && Math.random() < 0.6 * e) parca.emitParticle(1 + Math.floor(Math.random() * 2));
        if (t >= T) {
          tik.remove();
          this.sokak.sallan(0);
          const bitir = (): void => {
            for (const p of [tavan, parca, toz]) p.destroy();
            bitince(sonuclar);
          };
          if (yazi) scene.tweens.add({ targets: yazi, alpha: 0, duration: 300, onComplete: () => (yazi.destroy(), bitir()) });
          else bitir();
        }
      },
    });
  }

  /** Pencerenin üstünde koyu şerit ve yazı (yer tutucu metin). */
  private seritKur(metin: string, gecikme: number): Phaser.GameObjects.Container {
    const pen = this.sokak.pencere;
    const kap = this.scene.add.container(snap(pen.centerX), snap(pen.y + 56)).setDepth(3010);
    const yazi = this.scene.add.text(0, 0, metin, { fontFamily: FONT, fontSize: '44px', color: PAL.kremAcik }).setOrigin(0.5);
    const w = snap(Math.min(pen.width - 32, yazi.width + 64));
    kap.add(this.scene.add.rectangle(0, 0, w, 64, 0x151413, 0.86));
    kap.add(this.scene.add.rectangle(0, -32, w, 4, 0xa8352d));
    kap.add(this.scene.add.rectangle(0, 28, w, 4, 0xa8352d));
    kap.add(yazi);
    kap.setAlpha(0);
    this.scene.tweens.add({ targets: kap, alpha: 1, duration: 200, delay: gecikme, ease: 'Stepped', easeParams: [3] });
    return kap;
  }
}
