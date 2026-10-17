// @beyan görsel
import * as Phaser from 'phaser';
import { FONT } from '../config';
import { binaEtiketi, ETIKET_BUYUK, type BinaEtiketi } from '../desk/BinaEtiketi';
import { PAL } from '../desk/palette';
import { Quake, type QuakeKontrol } from '../desk/Quake';
import { Sokak, type SokakYeri } from '../desk/Street';
import { SON_GUN } from '../game/days';
import { buyukDeprem, sokakKayitlari, type DepremBinaSonucu, type GunKaydi } from '../game/session';
import { TUNING } from '../game/tuning';
import { DEPREM_ATLA, DEPREM_GEC, GECE_SAATI, SENIN_DAMGAN, sonucEtiketi } from '../game/gazete';
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
/**
 * G38: etiketlerin ekran payları (px). sol/sag: etiket bu çizgilerin dışına taşmaz (kenarda kırpılmaz); ust: etiketin
 * tepesi köşedeki "[Bir gece]" ve hızlandırma ipucunun (y ≈ 10-80) altında kalır. Binasının ortası ekran kenarına
 * solmaPay kadar yaklaşınca etiket sönmeye başlar, solma px sonra tamamen sönmüş olur (sönmüş etiket yer kaplamaz).
 */
const EKRAN = { sol: 24, sag: 1896, ust: 104, solmaPay: 80, solma: 160 };

/** Oyuncunun binasının deprem sonucunun rengi: içinde insan varken ağır sonuç kırmızı, boş binada gri. */
export function sonucRengi(s: DepremBinaSonucu): string {
  if (s.coktu || s.durum === 'agirHasar') return s.bos ? PAL.damgaIade : PAL.damgaBosalt;
  return s.durum === 'hasarli' ? PAL.damgaGuclendir : PAL.damgaGuvenli;
}
/** Sahne zamanlaması (ms): saat yazısı, perdenin açılması, depremin başlaması, gazeteye geçiş. */
const ZAMAN = { saatGel: 400, saatGit: 2600, perde: 3000, perdeSure: 1600, deprem: 5200, sonra: 2400 };
/**
 * Hızlı geçiş (G25, G28, G39; jüri için): ilk Enter/Space/tık sahnenin zamanını (zamanlayıcılar ve tween'ler) rampa
 * ms içinde yumuşakça 1'den kat'a çıkarır (G39: 3 kat, çöküşler görünür kalsın); ilk basıştan en az ikinci ms sonraki
 * ikinci YENİ basış depremin sonuna atlar (Quake sonaAtla: binalar son hâlinde, etiketler ve genel plan görünür).
 * Deprem bitince normal hıza döner, genel görünüm sonra ms durur ve gazeteye geçilir; o sırada basış hemen gazeteye
 * geçer. Sonuçlar baştan hesaplı olduğu için değişmez.
 * Gece kartı ("[Bir gece]") göründükten koruma ms sonra gelen YENİ basış (tuş tekrarı değil) saklanır ve kart bitince
 * uygulanır (G28; birinci basış sayılır): rapordan kısa yolu başlatan Enter ya da basılı tutulan tuş depremi
 * atlatmaz. Hiç basılmazsa deprem tam süre oynar. Kart bittikten sonraki basış hemen uygulanır.
 */
const ATLA = { koruma: 250, kat: 3, rampa: 500, ikinci: 300 };
/**
 * Hızlandırma ipucu (G28): koyu zemin üstünde tam opak; hızlandırılana kadar hafifçe nabız gibi atar. G28b: sağ üstte,
 * gökyüzü bandında; dikey ortası köşedeki "[Bir gece]" yazısıyla aynı (y), sağ kenardan payı onun sol payı kadar (x =
 * kutunun sağ kenarı). Binaların, etiketlerin ve ayın üstünde kalır, hiçbirini örtmez.
 */
const IPUCU = { x: 1872, y: 44, boyut: 44, pay: 18, nabiz: 0.06, nabizMs: 520 };

/**
 * Büyük deprem (G5): gece geçişi (kararma, saat), sonra oyuncunun kararlarıyla dolan sokak tam ekran ve gece.
 * Sokak binalık gruplarla taranır, her bina adalet kurallarıyla (session.buyukDeprem) tepki verir; sonunda genel
 * plan (G38: büyük ölçekte, sığmazsa sokak boyunca kayar) görünür ve gazeteye geçilir. Enter/Space/tık depremi hızlandırır (G25, G28: gece kartında da; ATLA); Esc
 * duraklatır (gürleme susar, sekans durur).
 */
export class QuakeScene extends Phaser.Scene {
  private veri!: DepremData;
  private controls!: Controls;
  /** Hızlandırma rampası (G39): her karede gerçek süreyle (delta) ilerler. */
  private hizAdim?: (delta: number) => void;

  constructor() {
    super(SCENES.Quake);
  }

  init(data: DepremData): void {
    this.veri = data;
    this.sonucEtiketleri = [];
    this.etiketler = [];
    this.sokak = undefined;
    this.bagCizgi = undefined;
    this.hizAdim = undefined;
  }

  create(): void {
    // Hızlı geçişten kalan zaman katı sıfırlanır ("Yeniden Başla" sahneyi baştan kurar).
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    const cam = this.cameras.main;
    cam.setBackgroundColor(0x000000).setRoundPixels(true);
    this.input.enabled = true;
    this.controls = new Controls(this);
    const v = this.veri;
    const B = TUNING.buyukDeprem;
    const K = TUNING.kisaYol;
    const zaman = v.kisa ? K.zaman : ZAMAN;

    // Kısa yolda zarf işareti yalnızca oyuncunun kendi kararlarından (G23b).
    const sonuclar = buyukDeprem(v.tohum, v.kayitlar, v.kisa?.gercek);
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

    // Hızlı geçiş (G25, G39): sağ üst köşede ipucu (G28b); deprem bitince normal hız, genel görünüm durur, sonra gazete.
    let kontrol: QuakeKontrol | undefined;
    let hizli = false;
    let atlandi = false;
    let bitti = false;
    let gidildi = false;
    /** Hız rampası (G39): ilk basışta zaman katı rampa ms içinde 1'den ATLA.kat'a yumuşakça çıkar. */
    let rampada = false;
    let rampaU = 0;
    let kat = 1;
    const katUygula = (k: number): void => {
      kat = k;
      this.time.timeScale = k;
      this.tweens.timeScale = k;
      kontrol?.hizlandir(k);
    };
    const normalHiz = (): void => {
      rampada = false;
      kat = 1;
      this.time.timeScale = 1;
      this.tweens.timeScale = 1;
    };
    this.hizAdim = (delta) => {
      if (!rampada) return;
      rampaU = Math.min(1, rampaU + Math.min(delta, 100) / ATLA.rampa);
      katUygula(1 + (ATLA.kat - 1) * Phaser.Math.Easing.Sine.InOut(rampaU));
      if (rampaU >= 1) rampada = false;
    };
    const gazeteyeGec = (): void => {
      if (gidildi) return;
      gidildi = true;
      normalHiz();
      const data: NewspaperData = { ...v, sonuclar };
      goTo(this, SCENES.Newspaper, data, 600);
    };
    // İpucu: koyu zemin üstünde büyük ve tam opak (G28); gece kartı göründüğünde belirir, basılana kadar atar.
    const ipucuYazi = this.add
      .text(0, 0, DEPREM_GEC, { fontFamily: FONT, fontSize: `${IPUCU.boyut}px`, color: PAL.saat })
      .setOrigin(1, 0.5);
    const ipucuZemin = this.add
      .rectangle(IPUCU.pay, 0, ipucuYazi.width + IPUCU.pay * 2, ipucuYazi.height + IPUCU.pay, 0x0e0d10, 0.85)
      .setOrigin(1, 0.5)
      .setStrokeStyle(4, 0x3a3644);
    const ipucu = this.add
      .container(IPUCU.x - IPUCU.pay, IPUCU.y, [ipucuZemin, ipucuYazi])
      .setDepth(102)
      .setAlpha(0);
    let nabiz: Phaser.Tweens.Tween | undefined;
    const nabizBaslat = (): void => {
      nabiz?.stop();
      nabiz = this.tweens.add({
        targets: ipucu,
        scale: 1 + IPUCU.nabiz,
        duration: IPUCU.nabizMs,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    };
    /** İpucu metni değişir (G39: hızlanınca "geç"); zemin yazıya göre yeniden boyutlanır. */
    const ipucuMetin = (t: string): void => {
      if (ipucuYazi.text === t) return;
      ipucuYazi.setText(t);
      ipucuZemin.setSize(ipucuYazi.width + IPUCU.pay * 2, ipucuYazi.height + IPUCU.pay);
    };
    // Kart bitince basışlar serbest (saklanan basışlar varsa hemen uygulanır).
    const kartSonu = zaman.saatGit + (v.kisa ? 300 : 400);
    const girisAcik = zaman.saatGel + ATLA.koruma;
    let saklanabilir = false;
    let atlanabilir = false;
    /** Gece kartında saklanan basış sayısı (1: hızlandır, 2: sona atla). */
    let saklanan = 0;
    /** Son kabul edilen basışın gerçek zamanı (ms): sonraki basış en az ATLA.ikinci ms sonra sayılır. */
    let sonBasis = -Infinity;
    this.time.delayedCall(girisAcik, () => {
      saklanabilir = true;
      if (gidildi || saklanan > 0) return;
      this.tweens.add({ targets: ipucu, alpha: 1, duration: 240, ease: 'Stepped', easeParams: [3] });
      nabizBaslat();
    });
    // İlk basış alındı: ipucu "geç"e döner ve atmayı sürdürür (ikinci basış sona atlar).
    const ipucuGec = (): void => {
      ipucuMetin(DEPREM_ATLA);
      this.tweens.killTweensOf(ipucu);
      ipucu.setScale(1).setAlpha(1);
      nabizBaslat();
    };
    // İkinci basış alındı: ipucu durur ve söner.
    const ipucuSondur = (): void => {
      nabiz?.stop();
      nabiz = undefined;
      this.tweens.killTweensOf(ipucu);
      ipucu.setScale(1).setAlpha(0.55);
    };
    const hizlandir = (): void => {
      if (hizli || gidildi || bitti) return;
      hizli = true;
      ipucuGec();
      rampaU = 0;
      rampada = true;
    };
    // Gece geçişini hemen bitir (deprem başlamadan sona atlanırsa).
    const perdeBitir = (): void => {
      this.tweens.killTweensOf([perde, saat, kose]);
      perde.setAlpha(0);
      saat.setAlpha(0);
      kose.setAlpha(0.8);
    };
    let baslat: () => void = () => undefined;
    let baslaSaat: Phaser.Time.TimerEvent | undefined;
    const sonaAtla = (): void => {
      if (atlandi || gidildi || bitti) return;
      atlandi = true;
      ipucuSondur();
      if (!kontrol) {
        baslaSaat?.remove();
        perdeBitir();
        baslat();
      }
      kontrol?.sonaAtla();
    };
    this.time.delayedCall(kartSonu, () => {
      atlanabilir = true;
      if (saklanan >= 1) hizlandir();
      if (saklanan >= 2) sonaAtla();
    });
    const atla = (e?: { repeat?: boolean }): void => {
      if (gidildi || e?.repeat) return;
      const simdi = performance.now();
      if (simdi - sonBasis < ATLA.ikinci) return;
      if (!atlanabilir) {
        // Gece kartında: koruma süresinden sonraki yeni basışlar saklanır, kart bitince uygulanır.
        if (saklanabilir && saklanan < 2) {
          saklanan++;
          sonBasis = simdi;
          if (saklanan === 1) ipucuGec();
          else ipucuSondur();
        }
        return;
      }
      sonBasis = simdi;
      if (bitti) gazeteyeGec();
      else if (!hizli) hizlandir();
      else sonaAtla();
    };
    const tus = (e: KeyboardEvent): void => atla(e);
    const tik = (): void => atla();
    const kb = this.input.keyboard;
    kb?.on('keydown-ENTER', tus);
    kb?.on('keydown-SPACE', tus);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, tik);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb?.off('keydown-ENTER', tus);
      kb?.off('keydown-SPACE', tus);
      this.input.off(Phaser.Input.Events.POINTER_DOWN, tik);
    });

    baslat = (): void => {
      if (kontrol) return;
      baslaSaat = undefined;
      kontrol = quake.oynat(
        1,
        binalar,
        (_s, kayma) => {
          bitti = true;
          normalHiz();
          // Hiç basılmadıysa da ipucu artık "geç" der (basış gazeteye geçer).
          if (!hizli && !atlandi) ipucuMetin(DEPREM_ATLA);
          // Genel plan sokağın başına kayıyorsa (G38) kayış bitince de genel görünüm sonra ms durur.
          this.time.delayedCall(zaman.sonra + kayma, gazeteyeGec);
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
      );
      // Deprem başlamadan hızlandırıldıysa (gece geçişinde) ortam sesleri de seyrelsin.
      if (hizli) kontrol.hizlandir(kat);
    };
    baslaSaat = this.time.delayedCall(zaman.deprem, () => baslat());

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

  /**
   * Etiketleri binalarının üstüne yerleştir: sabit en az boy, çakışma yok, kayan etikete bağ çubuğu (G21b). G38:
   * etiket hiçbir zaman ekran kenarında kırpılmaz (EKRAN payları içine sıkıştırılır, köşe yazılarının altında kalır);
   * binası ekrandan çıkan etiket kenarda durup söner.
   */
  private etiketYerlestir(): void {
    const sokak = this.sokak;
    if (!sokak || this.etiketler.length === 0) return;
    const g = sokak.gorunum;
    const sc = Phaser.Math.Clamp(g.olcek, ETIKET_EN_AZ, 1);
    const { sol: L, sag: R } = EKRAN;
    const ogeler = this.etiketler
      .map(({ e, yer }) => {
        const k = sokak.yerelKutu(yer);
        // ust: çubuğun indiği yer (çöken binada moloz yığını, G23).
        const ust = g.y + sokak.ustKenar(yer) * g.olcek;
        const w = e.genislik() * sc;
        const ax = g.x + k.centerX * g.olcek;
        // Hedef: binanın ortası, ekran payları içine sıkıştırılmış.
        const hedef = Phaser.Math.Clamp(ax, L + w / 2, R - w / 2);
        // Binası ekran kenarından çıktıkça etiket söner (kenarda yığılıp başka binanınmış gibi durmasın).
        const disari = Math.max(0, EKRAN.solmaPay - ax, ax - (1920 - EKRAN.solmaPay));
        const alfa = Phaser.Math.Clamp(1 - disari / EKRAN.solma, 0, 1);
        e.kap.setAlpha(alfa).setVisible(alfa > 0);
        return { e, ax, ay: g.y + k.y * g.olcek, ust, w, hedef, x: hedef, alfa };
      })
      // Sönmüş etiketler yer kaplamaz (görünenleri itmesin).
      .filter((o) => o.alfa > 0)
      .sort((a, b) => a.hedef - b.hedef);
    const n = ogeler.length;
    const cizgi = this.bagCizgi;
    cizgi?.clear();
    if (n === 0) return;
    // Soldan sağa it (çakışmasın), sonra grubu hedeflerin ortasına geri kaydır (sol paydan taşmadan).
    ogeler.forEach((o, i) => {
      if (i > 0) o.x = Math.max(o.hedef, ogeler[i - 1].x + (ogeler[i - 1].w + o.w) / 2 + ETIKET_ARA);
    });
    const kay = Math.max(ogeler.reduce((t, o) => t + o.hedef - o.x, 0) / n, L - (ogeler[0].x - ogeler[0].w / 2));
    for (const o of ogeler) o.x += kay;
    // Sağ paydan taşan varsa sağdan sola geri it; en son her etiket tek tek paylar içine (grup ekrandan genişse üst üste
    // binebilir ama kırpılmaz).
    for (let i = n - 1; i >= 0; i--) {
      const sinir = i === n - 1 ? R - ogeler[i].w / 2 : ogeler[i + 1].x - (ogeler[i + 1].w + ogeler[i].w) / 2 - ETIKET_ARA;
      ogeler[i].x = Math.min(ogeler[i].x, sinir);
    }
    for (const o of ogeler) {
      const x = Math.round(Phaser.Math.Clamp(o.x, L + o.w / 2, R - o.w / 2));
      const dx = x - o.ax;
      const kalk = Math.min(60, Math.abs(dx)) * sc;
      let y = Math.round(o.ay - kalk);
      o.e.kap.setPosition(x, y).setScale(sc);
      // Üst pay: köşedeki "[Bir gece]" ve hızlandırma ipucunun altında kalsın.
      const tepe = o.e.kap.getBounds().top;
      if (tepe < EKRAN.ust) {
        y += Math.ceil(EKRAN.ust - tepe);
        o.e.kap.setY(y);
      }
      if (cizgi && (Math.abs(dx) > 2 || o.ust - y > 2)) {
        cizgi.lineStyle(4 * sc, 0x0e0d10, 0.9 * o.alfa);
        cizgi.lineBetween(x, y, o.ax, o.ust);
      }
    }
  }

  update(_time: number, delta: number): void {
    this.hizAdim?.(delta);
    this.etiketYerlestir();
    if (this.controls.justDown('pause')) this.duraklat();
  }

  private duraklat(): void {
    // "Yeniden Başla" depremi aynı sokakla baştan oynatır.
    this.scene.launch(SCENES.Pause, { from: SCENES.Quake, yeniden: this.veri });
    this.scene.pause();
  }
}
