// @beyan görsel
import * as Phaser from 'phaser';
import { FONT } from '../config';
import { binaEtiketi, ETIKET_BUYUK, type BinaEtiketi } from '../desk/BinaEtiketi';
import { PAL } from '../desk/palette';
import { Quake } from '../desk/Quake';
import { Sokak, type SokakYeri } from '../desk/Street';
import { SON_GUN } from '../game/days';
import { buyukDeprem, sokakKayitlari, type DepremBinaSonucu, type GunKaydi } from '../game/session';
import { TUNING } from '../game/tuning';
import { GECE_SAATI, SENIN_DAMGAN, sonucEtiketi } from '../game/gazete';
import { ZARF_ETIKET } from '../game/diyalog';
import { Controls } from '../systems/controls';
import { goTo } from '../systems/transition';
import { SCENES } from './keys';
import type { NewspaperData } from './NewspaperScene';

/** Gün 5 sonundan büyük depreme taşınan durum. */
export interface DepremData {
  tohum: number;
  /** Birikmiş para (5 günün sonu). */
  para: number;
  /** Beş günün kayıtları (sokak bunlardan kurulur). */
  kayitlar: GunKaydi[];
  /** Kısa yol (G21, gün 1 raporundan "Depremi şimdi yaşa"); yoksa normal oyun sonu. */
  kisa?: KisaYol;
}

/** Kısa yolun taşıdığı durum: sokak (kayitlar) oyuncunun günleri + örnek binalar; oyuncunun kendi kayıtları ayrı. */
export interface KisaYol {
  /** Oyuncunun gerçek kayıtları (gün 1). Sonuç ekranı ve "Gün 2'den devam" bunlarla. */
  gercek: GunKaydi[];
  /** Oyuncunun damgaladığı binalar (sokakta en önde). */
  juri: string[];
}

const SOKAK_D = 10;
/**
 * Kısa yol etiketleri (G21b): sokakla birlikte küçülmez; ekrandaki ölçekleri sokağın ölçeğini izler ama ETIKET_EN_AZ'ın
 * altına inmez (genel görünümde 1280×720'de de okunur). Yan yana etiketler çakışmasın diye ETIKET_ARA ile açılır;
 * binasından kayan etiket ince bir çubukla binaya bağlanır.
 */
const ETIKET_EN_AZ = 0.8;
const ETIKET_ARA = 32;

/** Oyuncunun binasının deprem sonucunun rengi: içinde insan varken ağır sonuç kırmızı, boş binada gri. */
export function sonucRengi(s: DepremBinaSonucu): string {
  if (s.coktu || s.durum === 'agirHasar') return s.bos ? PAL.damgaIade : PAL.damgaBosalt;
  return s.durum === 'hasarli' ? PAL.damgaGuclendir : PAL.damgaGuvenli;
}
/** Sahne zamanlaması (ms): saat yazısı, perdenin açılması, depremin başlaması, gazeteye geçiş. */
const ZAMAN = { saatGel: 400, saatGit: 2600, perde: 3000, perdeSure: 1600, deprem: 5200, sonra: 2400 };

/**
 * Büyük deprem (G5): gece geçişi (kararma, saat), sonra oyuncunun kararlarıyla dolan sokak tam ekran ve gece.
 * Sokak binalık gruplarla taranır, her bina adalet kurallarıyla (session.buyukDeprem) tepki verir; sonunda bütün
 * sokak görünür ve gazeteye geçilir. Girdi yok; Esc duraklatır (gürleme susar, sekans durur).
 */
export class QuakeScene extends Phaser.Scene {
  private veri!: DepremData;
  private controls!: Controls;

  constructor() {
    super(SCENES.Quake);
  }

  init(data: DepremData): void {
    this.veri = data;
    this.sonucEtiketleri = [];
    this.etiketler = [];
    this.sokak = undefined;
    this.bagCizgi = undefined;
  }

  create(): void {
    const cam = this.cameras.main;
    cam.setBackgroundColor(0x000000).setRoundPixels(true);
    this.input.enabled = true;
    this.controls = new Controls(this);
    const v = this.veri;
    const B = TUNING.buyukDeprem;
    const K = TUNING.kisaYol;
    const zaman = v.kisa ? K.zaman : ZAMAN;

    const sonuclar = buyukDeprem(v.tohum, v.kayitlar);
    const sonucu = new Map(sonuclar.map((s) => [s.dosyaId, s]));
    // Sokak ekrandan biraz taşar: kamera sarsıntısında kenarlarda boşluk görünmesin (kaldırım yine y=1038'de).
    const sokak = new Sokak(this, { x: -48, y: -48, w: 2016, h: 1128 }, SON_GUN, sokakKayitlari(v.tohum, v.kayitlar), SOKAK_D, {
      olcek: 3,
      gece: true,
    });
    const binalar = sokak.damgalilar();
    const quake = new Quake(this, sokak, SOKAK_D);
    // Kısa yol: ilk grup oyuncunun binaları (etiketli, daha uzun), ardından örnek binalar.
    const juri = new Set(v.kisa?.juri ?? []);
    let gruplar: SokakYeri[][] | undefined;
    if (v.kisa) {
      const sizin = binalar.filter((b) => juri.has(b.bina.id));
      const kalan = binalar.filter((b) => !juri.has(b.bina.id));
      gruplar = [sizin, ...Quake.gruplar(kalan)].filter((g) => g.length > 0);
      this.sokak = sokak;
      this.bagCizgi = this.add.graphics().setDepth(SOKAK_D + 5);
      for (const b of sizin) {
        const s = sonucu.get(b.bina.id);
        if (s) this.etiketKur(b, s);
      }
      this.etiketYerlestir();
    }
    quake.hazirla(binalar, gruplar);

    // Gece geçişi: kararma, saat (yer tutucu), perde açılır; sessiz sokak bir an durur.
    const perde = this.add.rectangle(0, 0, 1920, 1080, 0x000000).setOrigin(0).setDepth(100);
    const saat = this.add
      .text(960, 540, GECE_SAATI, { fontFamily: FONT, fontSize: '112px', color: PAL.saat })
      .setOrigin(0.5)
      .setDepth(101)
      .setAlpha(0);
    this.tweens.add({ targets: saat, alpha: 1, duration: v.kisa ? 300 : 500, delay: zaman.saatGel, ease: 'Stepped', easeParams: [4] });
    this.tweens.add({ targets: saat, alpha: 0, duration: v.kisa ? 300 : 400, delay: zaman.saatGit, ease: 'Stepped', easeParams: [4] });
    this.tweens.add({ targets: perde, alpha: 0, duration: zaman.perdeSure, delay: zaman.perde, ease: 'Stepped', easeParams: [8] });
    // Köşede küçük saat: deprem boyunca.
    const kose = this.add
      .text(48, 44, GECE_SAATI, { fontFamily: FONT, fontSize: '44px', color: PAL.panelYazi })
      .setOrigin(0, 0.5)
      .setDepth(90)
      .setAlpha(0);
    this.tweens.add({ targets: kose, alpha: 0.8, duration: 400, delay: zaman.perde + zaman.perdeSure });

    this.time.delayedCall(zaman.deprem, () =>
      quake.oynat(
        1,
        binalar,
        () => {
          this.time.delayedCall(zaman.sonra, () => {
            const data: NewspaperData = { ...v, sonuclar };
            goTo(this, SCENES.Newspaper, data, 600);
          });
        },
        {
          sure: v.kisa ? K.depremMs : B.sureMs,
          genlik: B.sarsinti,
          sesGucu: B.sesGucu,
          cokme: true,
          buyuk: true,
          gruplar,
          agirlik: gruplar ? [K.ilkGrupAgirlik] : undefined,
          grupSonu: v.kisa
            ? (gi) => {
                // Oyuncunun binaları tepki verdi: sonuç etiketleri belirir.
                if (gi === 0) for (const goster of this.sonucEtiketleri) goster();
              }
            : undefined,
          hesap: (b) => {
            const s = sonucu.get(b.bina.id);
            return s ? { durum: s.durum, bos: s.bos, coker: s.coktu } : { durum: 'ayakta', bos: b.damga === 'bosalt' };
          },
        },
      ),
    );

    // Pencere odağı kaçarsa duraklat.
    const onBlur = (): void => {
      if (this.scene.isActive()) this.duraklat();
    };
    this.game.events.on(Phaser.Core.Events.BLUR, onBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(Phaser.Core.Events.BLUR, onBlur));
  }

  /** Kısa yolda sonuç etiketleri (ilk grup tepki verince görünür). */
  private sonucEtiketleri: (() => void)[] = [];
  /** Kısa yolda oyuncunun binalarının etiketleri (ekran katmanında; her karede sokağa göre yerleşir). */
  private etiketler: { e: BinaEtiketi; yer: number }[] = [];
  private sokak?: Sokak;
  private bagCizgi?: Phaser.GameObjects.Graphics;

  /**
   * Oyuncunun binasının üstünde: "SENİN DAMGAN" şeridi, damga renginde damga adı ve (gizli) sonuç etiketi
   * (yer tutucu metinler, gazete.ts; bileşen BinaEtiketi.ts). Sokakla kayar; boyu etiketYerlestir'de.
   */
  private etiketKur(b: SokakYeri, s: DepremBinaSonucu): void {
    const e = binaEtiketi(this, b.damga, ETIKET_BUYUK, SENIN_DAMGAN, b.zarf ? ZARF_ETIKET : undefined);
    e.kap.setDepth(SOKAK_D + 6);
    this.sonucEtiketleri.push(() => e.sonucGoster(sonucEtiketi(s), sonucRengi(s)));
    this.etiketler.push({ e, yer: b.yer });
  }

  /** Etiketleri binalarının üstüne yerleştir: sabit en az boy, çakışma yok, kayan etikete bağ çubuğu (G21b). */
  private etiketYerlestir(): void {
    const sokak = this.sokak;
    if (!sokak || this.etiketler.length === 0) return;
    const g = sokak.gorunum;
    const sc = Phaser.Math.Clamp(g.olcek, ETIKET_EN_AZ, 1);
    const ogeler = this.etiketler
      .map(({ e, yer }) => {
        const k = sokak.yerelKutu(yer);
        // ust: çubuğun indiği yer (çöken binada moloz yığını, G23).
        const ust = g.y + sokak.ustKenar(yer) * g.olcek;
        return { e, ax: g.x + k.centerX * g.olcek, ay: g.y + k.y * g.olcek, ust, w: e.genislik() * sc, x: 0 };
      })
      .sort((a, b) => a.ax - b.ax);
    // Soldan sağa it (çakışmasın), sonra grubu binaların ortasına geri kaydır ve ekrana sığdır.
    ogeler.forEach((o, i) => {
      o.x = i === 0 ? o.ax : Math.max(o.ax, ogeler[i - 1].x + (ogeler[i - 1].w + o.w) / 2 + ETIKET_ARA);
    });
    const n = ogeler.length;
    let kay = ogeler.reduce((t, o) => t + o.ax - o.x, 0) / n;
    // Ekrana sığdırma yalnızca bütün binalar görünürken (başka grup taranırken etiketler binalarıyla ekran dışına kayar).
    if (ogeler[0].ax >= 0 && ogeler[n - 1].ax <= 1920) {
      const sol = ogeler[0].x + kay - ogeler[0].w / 2;
      const sag = ogeler[n - 1].x + kay + ogeler[n - 1].w / 2;
      if (sol < 24) kay += 24 - sol;
      else if (sag > 1896) kay -= sag - 1896;
    }
    const cizgi = this.bagCizgi;
    cizgi?.clear();
    for (const o of ogeler) {
      const x = Math.round(o.x + kay);
      const dx = x - o.ax;
      const kalk = Math.min(60, Math.abs(dx)) * sc;
      o.e.kap.setPosition(x, Math.round(o.ay - kalk)).setScale(sc);
      if (cizgi && (Math.abs(dx) > 2 || o.ust - o.ay > 2)) {
        cizgi.lineStyle(4 * sc, 0x0e0d10, 0.9);
        cizgi.lineBetween(x, o.ay - kalk, o.ax, o.ust);
      }
    }
  }

  update(): void {
    this.etiketYerlestir();
    if (this.controls.justDown('pause')) this.duraklat();
  }

  private duraklat(): void {
    // "Yeniden Başla" depremi aynı sokakla baştan oynatır.
    this.scene.launch(SCENES.Pause, { from: SCENES.Quake, yeniden: this.veri });
    this.scene.pause();
  }
}
