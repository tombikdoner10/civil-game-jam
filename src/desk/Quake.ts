// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import { depremSonucu, type HasarDurumu } from '../game/rules';
import type { SarsintiSonucu } from '../game/session';
import { TUNING } from '../game/tuning';
import { settings } from '../systems/settings';
import { TEX } from '../systems/textures';
import { PAL } from './palette';
import { snap } from './pixel';
import type { Sokak, SokakHasar, SokakYeri } from './Street';

/** Dışarıdan verilen bina sonucu (G5: session.buyukDeprem). coker: çöker (cokme açıksa). */
export interface DisSonuc {
  durum: HasarDurumu;
  bos: boolean;
  coker?: boolean;
}

export interface SarsintiSecenek {
  /** Toplam süre (ms): yükselme, tepe, sönme ve durulma. */
  sure?: number;
  /** Kamera sarsıntısının tepe yoğunluğu (Phaser shake). */
  genlik?: number;
  /** En ağır sonuç (öncü: 'hasarli', yani en fazla çatlak). */
  enAgir?: HasarDurumu;
  /** Gizli zayıflıklar (düz demir, deniz kumu, eski yönetmelik) sayılsın mı. Öncü: hayır. */
  gizli?: boolean;
  /** Çökmesi gereken binalar çöksün mü (G5 büyük deprem). Hesap verilmezse ağır hasarlılar çöker. */
  cokme?: boolean;
  /** Ekranın üstünde şerit yazı (yer tutucu metin; verilmezse yok). */
  yazi?: string;
  /**
   * Ses gücü (1 = öncü sarsıntı). Gürleme düzeyini, moloz/çatırtı sıklığını ve vuruşların gücünü ölçekler.
   * Verilmezse şiddetten: siddet / 2.5 (öncü 2.5 → 1; G5 büyük depremde daha yüksek şiddet daha güçlü çalar).
   */
  sesGucu?: number;
  /** Bina sonucunu dışarıdan ver (verilmezse depremSonucu ile). */
  hesap?: (b: SokakYeri) => DisSonuc;
  /**
   * Büyük deprem görünümü (G5): uzun tepe; görünüm sokakta binalık gruplarla ilerler ve her grup sırayla tepki
   * verir; sonunda bütün sokak görünür. Oda tozu yok (sokak tam ekran); toz ve dökülme sokakla birlikte kayar.
   */
  buyuk?: boolean;
  /**
   * Büyük depremde tarama grupları (verilmezse sokak sırasıyla TUNING.buyukDeprem.grup'luk gruplar). Kısa gruplar
   * görünümde ortalanır (G21: önce oyuncunun binaları).
   */
  gruplar?: SokakYeri[][];
  /** Grupların süre ağırlıkları (verilmezse eşit; eksik olanlar 1). */
  agirlik?: number[];
  /** Büyük depremde bir grubun binaları tepki verdikten sonra (gi: grup sırası, sonuclar: gruptakiler). */
  grupSonu?: (gi: number, sonuclar: QuakeSonucu[]) => void;
}

export interface QuakeSonucu extends SarsintiSonucu {
  yer: number;
  /** Sokakta görünen sonuç (çökme dahil). */
  gorunen: SokakHasar;
}

const SIRA: HasarDurumu[] = ['ayakta', 'hasarli', 'agirHasar'];
const TIK = 50;

/** Öncü sarsıntı zarfı (0..1): yükselir, tepede kalır, söner; son kısım durulma (toz çöker). */
function zarfOncu(u: number): number {
  if (u < 0.06) return 0;
  if (u < 0.2) return ((u - 0.06) / 0.14) * 0.35;
  if (u < 0.3) return 0.35 + ((u - 0.2) / 0.1) * 0.65;
  if (u < 0.55) return 1;
  if (u < 0.78) return 1 - (u - 0.55) / 0.23;
  return 0;
}

/** Büyük deprem zarfı: derinden gelir, uzun tepe (dalgalanarak), söner; uzun durulma. */
function zarfBuyuk(u: number): number {
  if (u < 0.04) return 0;
  if (u < 0.1) return ((u - 0.04) / 0.06) * 0.45;
  if (u < 0.14) return 0.45 + ((u - 0.1) / 0.04) * 0.55;
  if (u < 0.74) return 0.88 + 0.12 * Math.sin(u * 60);
  if (u < 0.84) return 1 - (u - 0.74) / 0.1;
  return 0;
}

/** Büyük depremde zaman çizelgesi (T'nin oranı): grupların tarandığı aralık ve sokağın bütününe açılış. */
const BUYUK = { taramaBas: 0.1, taramaSon: 0.74, genis: 0.78 };

/**
 * Sokakta deprem sekansı (öncü sarsıntı ve G5 büyük deprem aynı sınıf). Masa ve pencere sarsılır (kamera),
 * tavandan toz ve sıva dökülür, binalar titrer, lambalar göz kırpar; her bina sonucuna göre tepki verir
 * (çatlak, ağır hasar ya da çökme). Hepsi sahnenin zamanlayıcısı ve tween'leriyle: sahne duraklayınca sekans da durur.
 */
export class Quake {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sokak: Sokak,
    /** Sokak tozunun derinliği (pencere duvarının altında kalsın, pencereden taşmasın). */
    private readonly sokakDerinlik: number,
  ) {}

  /** Büyük depremde binalar kaçar kaçar gösterilir (sokak sırasıyla gruplar). */
  static gruplar(binalar: readonly SokakYeri[]): SokakYeri[][] {
    const n = TUNING.buyukDeprem.grup;
    const sirali = [...binalar].sort((a, b) => a.yer - b.yer);
    const out: SokakYeri[][] = [];
    for (let i = 0; i < sirali.length; i += n) out.push(sirali.slice(i, i + n));
    return out;
  }

  /** Büyük deprem öncesi görünüm: ilk grup (sahne açılırken sokak zaten orada dursun). */
  hazirla(binalar: readonly SokakYeri[], gruplar?: SokakYeri[][]): void {
    const g = (gruplar ?? Quake.gruplar(binalar))[0];
    if (g) this.grupOdakla(g, 0, !!gruplar);
  }

  private grupOdakla(g: readonly SokakYeri[], sure: number, ortala = false): void {
    const n = TUNING.buyukDeprem.grup;
    // Son grup kısa kalsa da ölçek aynı kalsın: grup genişliği hep n parsel. ortala: kısa grup ortada.
    const i0 = ortala ? g[0].yer - Math.floor((n - Math.min(n, g.length)) / 2) : g[0].yer;
    this.sokak.odakla(i0, i0 + n - 1, sure, undefined, 0.5, 0.1);
  }

  oynat(siddet: number, binalar: readonly SokakYeri[], bitince: (sonuclar: QuakeSonucu[]) => void, secenek: SarsintiSecenek = {}): void {
    const scene = this.scene;
    const buyuk = secenek.buyuk ?? false;
    const T = secenek.sure ?? 9000;
    const genlik = secenek.genlik ?? 0.006;
    const enAgir = SIRA.indexOf(secenek.enAgir ?? 'agirHasar');
    const zarf = buyuk ? zarfBuyuk : zarfOncu;

    // Sonuçlar baştan hesaplanır; görüntü tepe anında sırayla işlenir.
    const sonuclar: QuakeSonucu[] = binalar.map((b) => {
      let durum: HasarDurumu;
      let bos: boolean;
      let coker: boolean;
      if (secenek.hesap) {
        const s = secenek.hesap(b);
        durum = s.durum;
        bos = s.bos;
        coker = s.coker ?? false;
      } else {
        const s = depremSonucu(b.bina, b.damga, siddet, secenek.gizli ?? true);
        durum = s.durum;
        bos = s.bos;
        coker = durum === 'agirHasar';
      }
      durum = SIRA[Math.min(SIRA.indexOf(durum), enAgir)];
      // Önceki sarsıntıdan kalan hasar geri gitmez.
      if (b.hasar && b.hasar !== 'yikik' && SIRA.indexOf(b.hasar) > SIRA.indexOf(durum)) durum = b.hasar;
      const gorunen: SokakHasar = secenek.cokme && coker && durum === 'agirHasar' ? 'yikik' : durum;
      return { yer: b.yer, dosyaId: b.bina.id, durum, bos, gorunen };
    });

    this.sokak.vurguKaldir();
    const yerler = binalar.map((b) => b.yer);
    const ilkYer = yerler.length > 0 ? Math.min(...yerler) : 0;
    const sonYer = yerler.length > 0 ? Math.max(...yerler) : 0;
    if (!buyuk && binalar.length > 0) this.sokak.odakla(ilkYer, sonYer, 500);

    // Parçacıklar: tavandan toz ve sıva parçaları (odanın her yerine; büyük depremde yok), binalardan toz.
    const tavan = buyuk
      ? undefined
      : scene.add
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
    const parca = buyuk
      ? undefined
      : scene.add
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
    const O = this.sokak.olcek;
    // Büyük depremde toz ve dökülme sokak kökünün koordinatında: kökle birlikte kayar ve küçülür.
    const toz = scene.add
      .particles(0, 0, TEX.px, {
        speedX: { min: -36 * (O / 2), max: 36 * (O / 2) },
        speedY: { min: -46 * (O / 2), max: -6 },
        gravityY: 26,
        lifespan: buyuk ? { min: 1400, max: 2600 } : { min: 900, max: 1700 },
        scale: buyuk ? { min: 0.75, max: 1.5 } : 0.5,
        tint: [0x9a9282, 0x7a746a, 0xb8ae9c],
        alpha: { start: buyuk ? 0.75 : 0.9, end: 0 },
        emitting: false,
        ...(buyuk ? {} : { deathZone: { type: 'onLeave' as const, source: pen } }),
      })
      .setDepth(this.sokakDerinlik + 3);
    // Toz bulutu (çökmede): iri, yavaş, uzun ömürlü kareler.
    const bulut = buyuk
      ? scene.add
          .particles(0, 0, TEX.px, {
            speedX: { min: -40, max: 40 },
            speedY: { min: -30, max: -4 },
            lifespan: { min: 2600, max: 4200 },
            scale: { start: 2, end: 6 },
            tint: [0x8a8478, 0x6e6a62, 0x9a9282],
            alpha: { start: 0.55, end: 0 },
            emitting: false,
          })
          .setDepth(this.sokakDerinlik + 4)
      : undefined;
    // Dökülme: cepheden düşen sıva ve tuğla parçaları.
    const dokulme = buyuk
      ? scene.add
          .particles(0, 0, TEX.px, {
            speedX: { min: -30, max: 30 },
            speedY: { min: -20, max: 40 },
            gravityY: 1400,
            lifespan: 900,
            scale: { min: 0.75, max: 1.5 },
            tint: [0xc8bfa6, 0x9a5a44, 0x8a8276],
            emitting: false,
          })
          .setDepth(this.sokakDerinlik + 2)
      : undefined;
    const yerel = [toz, bulut, dokulme].filter((p): p is Phaser.GameObjects.Particles.ParticleEmitter => !!p);
    const esle = (): void => {
      const g = this.sokak.gorunum;
      for (const p of yerel) p.setPosition(g.x, g.y).setScale(g.olcek);
    };
    if (buyuk) {
      esle();
      scene.events.on(Phaser.Scenes.Events.POST_UPDATE, esle);
    }
    /** Binanın içinden rastgele bir nokta (büyük depremde yerel, öncüde ekran koordinatı). */
    const nokta = (yer: number, ust: number): [number, number] => {
      const k = buyuk ? this.sokak.yerelKutu(yer) : this.sokak.dunyaKutu(yer);
      return [k.x + Math.random() * k.width, k.bottom - Math.random() * k.height * ust];
    };

    const yazi = secenek.yazi ? this.seritKur(secenek.yazi, 0.24 * T) : undefined;

    const guc = secenek.sesGucu ?? siddet / 2.5;

    /** Bir binanın tepkisi: hasar, toz, dökülme ve ses. */
    const tepki = (s: QuakeSonucu): void => {
      this.sokak.hasarVer(s.yer, s.gorunen, true);
      const yikik = s.gorunen === 'yikik';
      const n = yikik ? (buyuk ? 90 : 60) : s.gorunen === 'agirHasar' ? (buyuk ? 45 : 30) : buyuk ? 20 : 16;
      for (let k = 0; k < n; k++) toz.emitParticleAt(...nokta(s.yer, yikik ? 1 : 0.6), 1);
      if (dokulme) {
        const d = yikik ? 40 : s.gorunen === 'agirHasar' ? 24 : 10;
        for (let k = 0; k < d; k++) dokulme.emitParticleAt(...nokta(s.yer, 0.9), 1);
      }
      if (bulut && yikik) {
        // Bina yere inerken alttan kalkan toz bulutu.
        scene.time.delayedCall(700, () => {
          const k = this.sokak.yerelKutu(s.yer);
          for (let j = 0; j < 26; j++) bulut.emitParticleAt(k.x + Math.random() * k.width, k.bottom - Math.random() * 40 * (O / 3), 1);
        });
      }
      if (yikik) sfx.play('cokus', { volume: Math.min(1.3, 0.8 * guc) });
      else sfx.play('hasar', { volume: Math.min(1.2, (s.gorunen === 'agirHasar' ? 0.8 : 0.6) * guc) });
    };

    const tepkiler = sonuclar.filter((s) => s.gorunen !== 'ayakta');
    if (buyuk) {
      // Gruplar sırayla: görünüm gruba kayar, gruptaki binalar sırayla tepki verir; sonunda bütün sokak.
      const ozel = !!secenek.gruplar;
      const gruplar = (secenek.gruplar ?? Quake.gruplar(binalar)).filter((g) => g.length > 0);
      const bas = BUYUK.taramaBas * T;
      const agir = gruplar.map((_, gi) => secenek.agirlik?.[gi] ?? 1);
      const birim = gruplar.length > 0 ? ((BUYUK.taramaSon - BUYUK.taramaBas) * T) / agir.reduce((a, b) => a + b, 0) : 0;
      const sonucu = new Map(sonuclar.map((s) => [s.yer, s]));
      let t0 = bas;
      gruplar.forEach((g, gi) => {
        const adim = birim * agir[gi];
        const kayma = Math.min(600, adim * 0.3);
        const bu = t0;
        if (gi > 0) scene.time.delayedCall(bu, () => this.grupOdakla(g, kayma, ozel));
        const hepsi = g.map((b) => sonucu.get(b.yer)).filter((s): s is QuakeSonucu => !!s);
        const etkin = hepsi.filter((s) => s.gorunen !== 'ayakta');
        const aralik = etkin.length > 0 ? ((adim - kayma) * 0.6) / etkin.length : 0;
        etkin.forEach((s, j) => scene.time.delayedCall(bu + kayma + 200 + j * aralik, () => tepki(s)));
        const grupSonu = secenek.grupSonu;
        if (grupSonu) scene.time.delayedCall(bu + kayma + 200 + (adim - kayma) * 0.62, () => grupSonu(gi, hepsi));
        t0 += adim;
      });
      if (binalar.length > 0)
        scene.time.delayedCall(BUYUK.genis * T, () => {
          // Özel gruplarda (G21) kenarlarda birer parsel pay: baştaki binaların etiketleri ekrandan taşmasın.
          const pay = ozel ? 1 : 0;
          this.sokak.odakla(ilkYer - pay, sonYer + pay, 1600, undefined, 0.5, 0.05);
          // Bütün sokak küçülünce arkadaki şehir binaları gölgede kalsın: göz sokağa gitsin.
          this.sokak.uzakSoldur(0.2, 1600);
        });
    } else {
      // Hasarlı binalar tepe anında sırayla tepki verir.
      const tepkiBas = 0.32 * T;
      const tepkiAralik = tepkiler.length > 0 ? (0.2 * T) / tepkiler.length : 0;
      tepkiler.forEach((s, j) => scene.time.delayedCall(tepkiBas + j * tepkiAralik, () => tepki(s)));
    }

    // Ses: sürekli gürleme (kodla) zarfı izler; üstüne derin vuruşlar, moloz, çatırtı ve cam titremesi (Kenney).
    const gur = sfx.gurleme();
    let gurDuzey = 0;
    let durdu = false;
    const sustur = (): void => gur.seviye(0, 0.15);
    const surdur = (): void => gur.seviye(gurDuzey, 0.15);
    const kapat = (sure: number): void => {
      if (durdu) return;
      durdu = true;
      gur.durdur(sure);
      scene.events.off(Phaser.Scenes.Events.PAUSE, sustur);
      scene.events.off(Phaser.Scenes.Events.SLEEP, sustur);
      scene.events.off(Phaser.Scenes.Events.RESUME, surdur);
      scene.events.off(Phaser.Scenes.Events.WAKE, surdur);
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, esle);
    };
    // Duraklatınca gürleme susar, devam edince kaldığı yerden sürer; sahne kapanırsa kesilir.
    scene.events.on(Phaser.Scenes.Events.PAUSE, sustur);
    scene.events.on(Phaser.Scenes.Events.SLEEP, sustur);
    scene.events.on(Phaser.Scenes.Events.RESUME, surdur);
    scene.events.on(Phaser.Scenes.Events.WAKE, surdur);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kapat(0.1));

    sfx.play('depremVurus', { volume: 0.4 * guc });
    const vurus = buyuk ? [0.1, 0.14, 0.3, 0.5] : [0.22, 0.38];
    vurus.forEach((u, i) =>
      scene.time.delayedCall(u * T, () => sfx.play('depremVurus', { volume: Math.min(1.4, (0.85 - i * 0.05) * guc), rate: i % 2 ? 0.9 : 1 })),
    );

    const cam = scene.cameras.main;
    let t = 0;
    const tik = scene.time.addEvent({
      delay: TIK,
      loop: true,
      callback: () => {
        t += TIK;
        const u = t / T;
        const e = zarf(u);
        // Gürleme sarsıntıdan biraz önce derinden başlar, zarfla kabarır, durulmada söner.
        const on = buyuk ? 0.04 : 0.06;
        gurDuzey = Math.min(1.5, guc * Math.max(e, u < on ? (u / on) * 0.2 : 0));
        gur.seviye(gurDuzey);
        if (e > 0.15 && Math.random() < 0.09 * e * guc) sfx.play('moloz', { volume: 0.3 + 0.5 * e, pan: Math.random() * 1.6 - 0.8 });
        if (e > 0.3 && Math.random() < 0.05 * e * guc) sfx.play('catirti', { volume: 0.3 + 0.5 * e, pan: Math.random() * 1.2 - 0.6 });
        if (e > 0.3 && Math.random() < 0.14 * e) sfx.play('camTitreme', { volume: 0.5 + 0.5 * e });
        if (e > 0.6 && Math.random() < 0.025 * guc) sfx.play('depremVurus', { volume: Math.min(1.2, 0.5 * e * guc), rate: 1.1 });
        if (e > 0 && settings.get().shake) cam.shake(TIK + 30, genlik * (0.25 + 0.75 * e), true);
        this.sokak.sallan(e > 0.05 ? (buyuk ? 0.8 + 1.4 * e : 0.6 + e) : 0);
        // Toz yoğunluğu sarsıntıyla artar; tepede sıva parçaları.
        const adet = Math.floor(e * 8 + Math.random() * e * 4);
        if (adet > 0) tavan?.emitParticle(adet);
        if (e > 0.5 && Math.random() < 0.6 * e) parca?.emitParticle(1 + Math.floor(Math.random() * 2));
        // Büyük depremde görünen binalardan sürekli ince toz.
        if (buyuk && e > 0.3 && binalar.length > 0 && Math.random() < 0.7 * e) {
          const b = binalar[Math.floor(Math.random() * binalar.length)];
          toz.emitParticleAt(...nokta(b.yer, 1), 1);
        }
        if (t >= T) {
          tik.remove();
          kapat(0.6);
          this.sokak.sallan(0);
          const bitir = (): void => {
            for (const p of [tavan, parca, toz, bulut, dokulme]) p?.destroy();
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
