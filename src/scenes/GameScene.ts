import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { DEV, FONT } from '../config';
import { DocumentCard, MASA, ustKatman } from '../desk/DocumentCard';
import { belgeKur, BOY, ISTE_DUGME_AD, isteDugmesi, raporKur, SAHA_DUGME_AD, sahaDugmesi, sahaNotuKur } from '../desk/documents';
import { SahaTesti } from '../desk/Saha';
import { PX, snap } from '../desk/pixel';
import { DUGME, Inspect, yaziSinirlari, type Yuzey } from '../desk/Inspect';
import { num, PAL } from '../desk/palette';
import { fisDusur, fisKaldir, fisKur, masaCiz } from '../desk/props';
import { Klasor } from '../desk/Klasor';
import { RuleNote } from '../desk/RuleNote';
import { DAMGA_ADI, damgaIzi, Kaselik, RAF_SOL } from '../desk/Kaselik';
import { binaEtiketi, ETIKET_KUCUK, ETIKET_KUCUK_YUKSEKLIK, type BinaEtiketi } from '../desk/BinaEtiketi';
import { ONCU_SARSINTI_SONU, ONCU_TEPKI_SONU, Quake } from '../desk/Quake';
import { BANT_H, GISE_ALAN, GOZ, MASA_Y, PENCERE_CAMLARI, Pencere, SOKAK_DERINLIK } from '../desk/Window';
import { yerlesim, type Yerlesim } from '../desk/yerlesim';
import { Cekmece, Zarf, ZARF_ALAN } from '../desk/Zarf';
import { Portre, PORTRE_EKRAN } from '../desk/Portre';
import type { Bina, Damga, KusurId, Kural } from '../game/building';
import {
  ARAC_IPUCU,
  CERCEVE,
  degiskenler,
  desteler,
  INCELE_IPUCU,
  SAHA_METIN,
  SAHA_SURE,
  sabitOran,
  ZARF_DUGME,
  ZARF_ETIKET,
  ZARF_FIS,
  ZARF_IPUCU,
  ZARF_NOT,
  type Degiskenler,
  type Desteler,
} from '../game/diyalog';
import { ISTE_BELGE_METIN, ISTE_METIN, KENDI_ZARF_GIRIS, MIZAC_IFADE, MIZAC_METIN, MIZACLAR, SOR_METIN, ZARF_ISTEK } from '../game/diyalog-metin';
import { mizacSec, type Ifade, type IsteAlani, type Kisi, type SorCevap, type ZarfIstek } from '../game/kisi';
import { KUCUK_DEPREM_SERIT, oncuEtiketi } from '../game/gazete';
import { KUSUR_BILGI } from '../game/rules';
import { ornekKayitlar } from '../game/ornek';
import { gunAyar } from '../game/days';
import { aracGecmisi, GunOturumu, gunHesabi, isteGecmisi, sokakKayitlari, type AracGecmisi, type GunKaydi, type SarsintiKaydi } from '../game/session';
import type { SahaSonucu } from '../game/saha';
import { TUNING } from '../game/tuning';
import type { DayEndData } from './DayEndScene';
import { yeniEv, type EvHazirlik } from '../game/ev';
import { Controls } from '../systems/controls';
import { punch } from '../systems/fx';
import { fadeIn, goTo } from '../systems/transition';
import { SCENES } from './keys';

/** Günler arasında taşınan oyun durumu. Menüden boş gelir (gün 1, yeni tohum). */
export interface GameData {
  gun?: number;
  tohum?: number;
  /** Birikmiş para (önceki günlerin toplamı). */
  para?: number;
  /** Önceki günlerin kararları (sokak ve deprem günü için; G4b/G5). */
  kayitlar?: GunKaydi[];
  /** Kendi evinin hazırlığı (G42; oturum boyunca kalıcı, menüden boş). */
  ev?: EvHazirlik;
  /** İnceleme ipucunu yeniden aç (G36: duraklatmadan Yeniden Başla; jüri bilgisayarında kişi değişebilir). */
  ipucuSifirla?: boolean;
}

/** Etiket metnini iki satıra bölmek için. */
const SATIR_SONU = String.fromCharCode(10);

/**
 * Masada boş yer yoksa uyarı fişi gişe camının sol alt köşesine düşer (belgeleri örtmez). x: sol kenar;
 * w: siluetin solunda kalan genişlik (siluet gişenin ortasında, yaklaşık 1424-1712).
 */
const FIS_GISE = { x: 1256, w: 160, alt: 384, derinlik: 3500 };

/** İSTE ile gelen ve giden kartın kayarken derinliği: masanın (0) üstünde, kapalı klasörün (5) ve belgelerin altında. */
const KAYAN_DERINLIK = 4;

/** İSTE balonunun başlığı (yer tutucu). */
const ISTE_BASLIK: Record<IsteAlani, string> = {
  karot: 'İSTE · KAROT RAPORU',
  zemin: 'İSTE · ZEMİN ETÜDÜ',
  ruhsat: 'İSTE · RUHSAT',
  vaziyet: 'İSTE · VAZİYET PLANI',
};

/** Tezgâhtaki saha testi hak sayacı (G19; İNCELE düğmesinin sağı). */
const SAHA_SAYAC = { x: 1048, y: BANT_H + 24, w: 152, h: 40 };
/**
 * Saha testinin süre göstergesi (G24): tezgâhtaki saatin (Window, x 248) hemen altında asılı kısa etiket. Saha
 * paneli masayı örttüğü için onun üstünde (derinlik). G35: tezgâh panellerinin altı ile saha yüzeyinin çerçevesi
 * arasındaki şeride sığar (beton yüzeyine taşmaz); boy yazı boyuyla birlikte.
 */
const SAAT_YANI = { x: 248, y: BANT_H + 44, boy: 24, derinlik: 7620 };
/** Öncü etiketlerinin üstü ile pencerenin iç üst kenarı arasındaki en az boşluk (oyun pikseli; 1280×720'de 8 px). */
const ETIKET_UST_PAY = 12;
/** Köşedeki fişin (gölgesi dahil) alt kenarı ile ekranın altı arasındaki boşluk (0: gölge ekranın alt kenarında). */
const FIS_ALT_PAY = 0;
/**
 * Fiş ölçekleri (G26): önce tam boy, sığmazsa adım adım küçük. Gün 1'de yanlış fiş kural notunun altına notu örtmeden
 * en az küçülmeyle sığsın.
 */
const FIS_OLCEK = [1, 0.95, 0.9, 0.85, 0.8, 0.75];

/** İnceleme ipucu (G24) fişte gösterildi mi: her yeni oyunda yalnızca incelemesiz ilk yanlış kararda (G34). */
let incelemeIpucuGosterildi = false;

/** Damgaya göre gişedeki kişinin yüzü. */
const DAMGA_IFADE: Record<Damga, Ifade> = { guvenli: 'sevincli', guclendir: 'mahcup', bosalt: 'kizgin', iade: 'kizgin' };

/**
 * Sabırsız cümlesi eklenen cevabın yüzü (G33): cevabın kendi ifadesi sabırsız ifadesinden güçlüyse o kalır. Zarf
 * teklifinin sevinçli yüzü hep kalır (zarf olayı öne çıksın).
 */
const IFADE_GUC: Record<Ifade, number> = { notr: 0, mahcup: 1, gergin: 2, kizgin: 3, sevincli: 4 };

/** Masa sahnesi: üstte belediye penceresi ve gişe, altta masa, belgeler, yönetmelik klasörü ve kaşelik. */
export class GameScene extends Phaser.Scene {
  private controls!: Controls;
  private oturum!: GunOturumu;
  private gun = 1;
  private tohum = 0;
  private para = 0;
  private kayitlar: GunKaydi[] = [];
  private ev: EvHazirlik = yeniEv();
  private yer!: Yerlesim;
  private not?: RuleNote;
  private kartlar: DocumentCard[] = [];
  /** Damgalanmış dosyanın masadan kalkmakta olan belgeleri (fiş yeri ve kusur işaretleri için hâlâ masada). */
  private giden: DocumentCard[] = [];
  private mesgul = true;
  private bitirildi = false;
  private pencere!: Pencere;
  private kaselik!: Kaselik;
  private fis?: Phaser.GameObjects.Container;
  private ilkDosya = true;
  private inceleme!: Inspect;
  private kitap?: Klasor;
  private ipucu?: Phaser.GameObjects.Text;
  /** Yeni araç ipucu (G48): oyunda hiç kullanılmamış SOR / İSTE / SAHA düğmesinin yanında; anahtar: tür ve yön. */
  private aracIpucu?: Phaser.GameObjects.Text;
  private aracIpucuAnahtar = '';
  /** Araç ipucu yazısının ölçüsü (anahtar: tür ve yön; genişlik, yükseklik). */
  private readonly aracIpucuOlcu = new Map<string, [number, number]>();
  /** Araçlar oyunda kullanıldı mı (önceki günlerin kayıtları ve bugün; G48). */
  private aracKullanildi: AracGecmisi = { sor: false, iste: false, saha: false };
  /** Bu günün öncü sarsıntı sonucu (gün sonu raporuna gider). */
  private oncu?: SarsintiKaydi;
  /** Gişeden kayan zarf (G17) ve onu alan çekmece. */
  private zarf?: Zarf;
  private cekmece!: Cekmece;
  /** Öncü sarsıntıda binaların üstündeki etiketler (x0: sokak kabındaki ilk yeri; G23 cama sığdırma). */
  private oncuEtiketler: { e: BinaEtiketi; x0: number; yer: number; sonuc?: string; zemin?: string; bolundu?: boolean }[] = [];
  /** Açık saha testi (G19) ve tezgâhtaki hak sayacı. */
  private saha?: SahaTesti;
  private sahaSayac?: Phaser.GameObjects.Text;
  /** Gişedeki kişiye bu dosyada kaç SOR / İSTE yapıldı (G33: sabırsız cümlesi). */
  private soruSayisi = 0;
  /** Denetçi uzun süre bir şey yapmazsa kişinin bekleme cümlesi (G33; kişi başına bir kez). */
  private beklemeSaat?: Phaser.Time.TimerEvent;
  private beklemeSoylendi = false;

  constructor() {
    super(SCENES.Game);
  }

  init(data: GameData): void {
    // Yeni oyun (menüden Oyna: veri yok; sonuçtan Yeniden oyna: gün 1, kayıt yok) inceleme ipucunu yeniden açar
    // (G34: oyun açık kalınca sonraki jüri üyesi de görsün). Gün geçişi kayıt taşır; duraklatmadan Yeniden Başla
    // kayıt taşısa da ipucunu yeniden açar (G36).
    if (data?.gun === undefined || (data.gun === 1 && data.kayitlar === undefined) || data.ipucuSifirla) incelemeIpucuGosterildi = false;
    this.gun = data?.gun ?? 1;
    this.tohum = data?.tohum ?? Math.floor(Math.random() * 1_000_000_000);
    this.para = data?.para ?? TUNING.para.baslangic;
    this.kayitlar = data?.kayitlar ?? [];
    this.ev = data?.ev ?? yeniEv();
    // ?dev&gun=N&tohum=M yalnızca ilk girişte (menüden); sonraki günler veriden gelir.
    if (DEV && data?.gun === undefined) {
      const q = new URLSearchParams(location.search);
      const g = Number(q.get('gun'));
      const t = q.get('tohum');
      if (q.has('gun') && Number.isFinite(g) && g >= 1) this.gun = Math.floor(g);
      if (t !== null && Number.isFinite(Number(t))) this.tohum = Number(t);
      // ?dev&gun=N&sokak: önceki günler örnek kararlarla dolu gelsin (sokak ve deprem testleri için).
      if (q.has('sokak')) {
        this.kayitlar = ornekKayitlar(this.tohum, this.gun);
        // Para da örnek günlerin toplamı (sonuç ekranındaki birikmiş para tablo toplamıyla tutarlı olsun).
        this.para += this.kayitlar.reduce((n, k) => n + gunHesabi(k.kararlar, gunAyar(k.gun).dosyaSayisi).toplam, 0);
      }
    }
    this.kartlar = [];
    this.giden = [];
    this.mesgul = true;
    this.bitirildi = false;
    this.fis = undefined;
    this.ilkDosya = true;
    this.ipucu = undefined;
    this.aracIpucu = undefined;
    this.aracIpucuAnahtar = '';
    this.aracKullanildi = aracGecmisi(this.kayitlar);
    this.not = undefined;
    this.kitap = undefined;
    this.oncu = undefined;
    this.zarf = undefined;
    this.oncuEtiketler = [];
    this.saha = undefined;
    this.sahaSayac = undefined;
    this.soruSayisi = 0;
    this.beklemeSaat = undefined;
    this.beklemeSoylendi = false;
  }

  create(): void {
    fadeIn(this);
    this.cameras.main.setRoundPixels(true);
    this.controls = new Controls(this);
    this.oturum = new GunOturumu(this.gun, this.tohum, isteGecmisi(this.kayitlar));
    const ayar = this.oturum.ayar;
    this.yer = yerlesim(this.gun);
    if (DEV) this.input.keyboard?.on('keydown-ENTER', () => this.bitir());

    MASA.x = 0;
    MASA.y = MASA_Y;
    MASA.w = RAF_SOL;
    MASA.h = 1080 - MASA_Y;
    masaCiz(this, MASA_Y);
    // Yönetmelik klasörü gün 2'den; gün 1'de masada yalnızca kural notu (hedef ve tek kural).
    if (ayar.kitap) {
      this.kitap = new Klasor(this, this.yer.kitap[0], this.yer.kitap[1], this.gun);
      // Kapalı klasörün üstündeki belgeye ya da nota tıklamak klasörü açmasın (inceleme modunda belgeler tıklama almaz).
      this.kitap.ortulu = (x, y) =>
        this.masadakiKartlar().some((k) => k.sinir().contains(x, y)) || (!!this.not?.active && this.not.sinir().contains(x, y));
      // Açık klasör saha notunu örtmesin (G24): saha notu ve saha kuralı incelemede birlikte seçilebilsin.
      this.kitap.kacilacak = () => this.kartlar.filter((k) => k.active && k.getData('sahaNotu')).map((k) => k.sinir());
    }
    if (ayar.not) this.notGetir(ayar.not.gorev, ayar.not.kurallar);
    this.pencere = new Pencere(this, this.gun, sokakKayitlari(this.tohum, this.kayitlar));
    // Kaşelik (masanın sağı; masa sınırı onun solunda biter). Kaşeler kurallarla gelir (gün ayarı).
    this.kaselik = new Kaselik(this, ayar.kaseler, ayar.yeniKaseler, {
      hedef: () => this.muhurYeri(),
      vur: (d, x, y) => this.damgala(d, x, y),
      dokunuldu: () => {
        if (this.inceleme.acik) this.inceleme.kapa();
      },
      // Zarfın bedeli (G22): zarf karar beklerken hiçbir kaşe, zarf alındıysa yalnızca istenen kaşe. G45: kendiliğinden
      // zarf sıradayken de kilitli (zarf masaya gelmeden damga vurulup zarf kaçmasın).
      izin: (d) => !this.oturum.kendiZarfSirada && this.oturum.damgaIzinli(d),
    });

    this.cekmece = new Cekmece(this);
    if (ayar.sahaHak > 0) this.sahaSayacKur();
    this.incelemeKur();
    // G48: araç ipucu inceleme çiziminden sonra (etiketler o karede yerine oturmuş olsun).
    const aracIpucu = (): void => this.aracIpucuGuncelle();
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, aracIpucu);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.POST_UPDATE, aracIpucu));
    this.dosyaGetir();
    if (DEV && new URLSearchParams(location.search).has('portreler')) this.portreler();

    // Pencere odağı kaçarsa (alt-tab, başka sekme) oyunu duraklat.
    const onBlur = (): void => {
      if (this.scene.isActive()) this.pauseGame();
    };
    this.game.events.on(Phaser.Core.Events.BLUR, onBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(Phaser.Core.Events.BLUR, onBlur));
  }

  update(_time: number, delta: number): void {
    if (this.saha) {
      // Saha testi açık (G19): Esc vazgeçer (tamamlandıysa notu alır), Space notu alır; saat işlemeye devam eder.
      if (this.controls.justDown('pause')) this.saha.esc();
      else if (this.controls.justDown('action')) this.saha.onay();
    } else if (this.controls.justDown('pause')) {
      // Esc önce açık klasörü, sonra inceleme modunu kapatır; ikisi de kapalıyken duraklatır (G51).
      if (this.kitap?.acik) this.kitap.kapa();
      else if (this.inceleme.acik) this.inceleme.kapa();
      else this.pauseGame();
      return;
    } else if (this.controls.justDown('action')) this.inceleme.degistir();
    if (this.bitirildi) {
      // Öncü sarsıntı: sokak odaklanırken etiketler pencere camlarında kalsın.
      if (this.oncuEtiketler.length > 0) this.oncuEtiketSigdir();
      return;
    }
    if (!this.mesgul) {
      // Gün 1 ilk dosyada "Space: İNCELE" ipucu duruyorken (öğrenme anı) saat yavaş akar.
      const hiz = this.ipucu && this.oturum.no === 1 ? TUNING.mesai.ipucuHiz : 1;
      this.oturum.ilerle((Math.min(delta, 100) / 1000) * hiz);
      if (this.oturum.mesaiBitti) {
        this.mesgul = true;
        this.bitir();
        return;
      }
    }
    this.pencere.setSaat(this.oturum.saatMetni());
  }

  /** İnceleme modu: açıkken belgeler sürüklenmez; kaşeye dokunmak modu kapatır. */
  private incelemeKur(): void {
    this.inceleme = new Inspect(this, {
      yuzeyler: () => this.yuzeyListesi(),
      kontrol: (secim) => this.oturum.incele(secim),
      izin: () => !this.mesgul && !this.bitirildi && !this.saha,
      sorulabilir: (id) => this.oturum.sorulabilir(id),
      istenebilir: (id) => this.oturum.isteAlani(id) !== null,
      // Geçersiz karot (G19): etikette SAHA.
      sahaGoster: (id) => this.oturum.sahaKusurda(id),
      sahaAcik: (id) => this.oturum.sahaKusurda(id) && this.oturum.sahaYapilabilir(),
      // Kusur etiketi belge düğmelerini (İSTE, SAHA), zarfı, açık çekmeceyi ve fişi neredeyse hiç örtmesin; kapalı klasörü
      // az örtsün (G49; açık klasör yüzeylerde).
      etiketEngelleri: () => {
        const out: [Phaser.Geom.Rectangle, number][] = [];
        for (const k of this.masadakiKartlar())
          for (const ad of [ISTE_DUGME_AD, SAHA_DUGME_AD]) {
            const d = k.getByName(ad) as Phaser.GameObjects.Rectangle | null;
            if (d) out.push([d.getBounds(), 20]);
          }
        if (this.zarf?.active) out.push([this.zarf.getBounds(), 20]);
        if (this.cekmece.acik) {
          const A = Cekmece.ALAN;
          out.push([new Phaser.Geom.Rectangle(A.x, A.y, A.w, A.h), 20]);
        }
        if (this.fis?.active) out.push([this.fis.getBounds(), 20]);
        if (this.kitap && !this.kitap.acik) out.push([this.kitap.sinir, 1]);
        return out;
      },
    });
    this.inceleme.on('sor', (id: KusurId) => this.sor(id));
    this.inceleme.on('saha', () => this.sahaAc());
    // Geçersiz belge (G17b): etiketteki İSTE, belgenin düzgününü ister.
    this.inceleme.on('iste', (id: KusurId) => {
      const alan = this.oturum.isteAlani(id);
      const kart = alan ? this.kartlar.find((k) => k.tur === alan && k.active) : undefined;
      if (alan && kart) this.iste(alan, kart);
    });
    // Tutarsızlık bulununca gişedeki kişi gerilir.
    this.inceleme.on('bulundu', () => {
      if (!this.mesgul) this.pencere.ifade('gergin');
      // Kusur bulmak da eylem (G33): bekleme sayacı baştan.
      this.eylem();
    });
    this.inceleme.on('ac', () => {
      this.eylem();
      // Zarf inceleme modunda da sürüklenir ve düğmeleri tıklanır (G22; inceleme tıklamayı yutmaz: incelemeYok).
      for (const k of this.kartlar) k.disableInteractive(true);
      this.not?.disableInteractive(true);
      this.kitap?.kilitle(true);
      if (this.ipucu) {
        this.tweens.killTweensOf(this.ipucu);
        this.ipucu.destroy();
        this.ipucu = undefined;
      }
    });
    this.inceleme.on('kapa', () => {
      for (const k of this.kartlar) if (k.active) k.setInteractive();
      this.not?.setInteractive();
      this.kitap?.kilitle(false);
    });
    // Gün 1 ipucu (yer tutucu metin): inceleme modu bir kez açılınca kaybolur.
    if (this.gun === 1) {
      this.ipucu = this.add
        .text(DUGME.x + DUGME.w / 2 + 24, DUGME.y, '< Space: İNCELE', { fontFamily: FONT, fontSize: '32px', color: PAL.saat })
        .setOrigin(0, 0.5)
        .setDepth(3020);
      this.tweens.add({ targets: this.ipucu, alpha: 0.25, duration: 420, yoyo: true, repeat: -1 });
    }
  }

  /** Masadaki yüzeyler (belgeler, kural notu, açık klasör): inceleme modu ve araç ipucunun örtülü düğme denetimi. */
  private yuzeyListesi(): Yuzey[] {
    const out: Yuzey[] = this.masadakiKartlar().map((k) => ({
      derinlik: k.depth,
      sinir: k.sinir(),
      alanlar: k.alanlar(),
      yazilar: () => yaziSinirlari(k),
    }));
    const not = this.not;
    if (not?.active) out.push({ ...not.yuzey(), yazilar: () => yaziSinirlari(not) });
    const kitap = this.kitap?.yuzey();
    if (kitap) out.push(kitap);
    return out;
  }

  // ---- Yeni araç ipuçları (G48) ----

  /** Araç ipucunun bugün çıkabileceği günler mi ve araç oyunda henüz kullanılmadı mı. */
  private aracIpucuUygun(tur: keyof AracGecmisi): boolean {
    if (this.aracKullanildi[tur]) return false;
    const A = TUNING.mesai.aracIpucu;
    const ilk = tur === 'sor' ? A.sorIlkGun : tur === 'iste' ? TUNING.kisi.isteIlkGun : TUNING.saha.ilkGun;
    return this.gun >= ilk && this.gun < ilk + A.gunSayisi;
  }

  /**
   * Gösterilecek araç ipucu (öncelik İSTE, SAHA, SOR): tıklanabilir düğmenin sınırı ve ipucunun yanına konabileceği
   * kutular (önce düğmenin kendisi). Kart düğmesinde ikinci kutu karttaki İSTE + SAHA ikilisi (öbür düğmeyi örtmesin);
   * etiket düğmesinde bütün etiket (ipucu etiketin yanında durur).
   */
  private aracIpucuHedefi(): { tur: keyof AracGecmisi; dugme: Phaser.Geom.Rectangle; kutular: Phaser.Geom.Rectangle[] } | null {
    const kartDugmesi = (ad: string): { dugme: Phaser.Geom.Rectangle; kutular: Phaser.Geom.Rectangle[] } | null => {
      for (const k of this.kartlar) {
        if (!k.active || k.alpha < 1) continue;
        const d = k.getByName(ad) as Phaser.GameObjects.Rectangle | null;
        if (!d?.input?.enabled) continue;
        const r = d.getBounds();
        // Üstüne daha yüksekte bir belge, not ya da açık klasör çekilmişse düğme görünmüyor.
        if (this.yuzeyListesi().some((y) => y.derinlik > k.depth && y.sinir.contains(r.centerX, r.centerY))) continue;
        const ikili = [ISTE_DUGME_AD, SAHA_DUGME_AD]
          .map((a) => k.getByName(a) as Phaser.GameObjects.Rectangle | null)
          .filter((x): x is Phaser.GameObjects.Rectangle => !!x)
          .map((x) => x.getBounds())
          .reduce((a, b) => Phaser.Geom.Rectangle.Union(a, b));
        return { dugme: r, kutular: [r, ikili] };
      }
      return null;
    };
    for (const tur of ['iste', 'saha', 'sor'] as const) {
      if (!this.aracIpucuUygun(tur)) continue;
      const kart = tur === 'iste' ? kartDugmesi(ISTE_DUGME_AD) : tur === 'saha' ? kartDugmesi(SAHA_DUGME_AD) : null;
      if (kart) return { tur, ...kart };
      const [e] = this.inceleme.dugmeSinirlari(tur);
      if (e) return { tur, dugme: e.dugme, kutular: [e.etiket] };
    }
    return null;
  }

  /**
   * Araç ipucu her karede: uygun düğme varsa yanında (sağında "<" ile, sığmazsa ya da bir şeyi örtecekse solunda ">"
   * ile), yoksa kalkar. Yer: belgeleri, etiketleri, düğmeleri ve zarfı en az örten aday; masanın içinde kalır.
   */
  private aracIpucuGuncelle(): void {
    const h = this.mesgul || this.bitirildi || this.saha ? null : this.aracIpucuHedefi();
    if (!h) {
      this.aracIpucuKaldir();
      return;
    }
    const metin = { sag: ARAC_IPUCU[h.tur], sol: `${ARAC_IPUCU[h.tur].replace(/^<\s*/, '')} >` };
    const yazi =
      this.aracIpucu ??
      this.add
        .text(0, 0, metin.sag, { fontFamily: FONT, fontSize: '32px', color: PAL.saat, backgroundColor: '#151413', padding: { x: 10, y: 4 } })
        .setOrigin(0, 0.5)
        .setDepth(9002);
    if (!this.aracIpucu) {
      this.aracIpucu = yazi;
      this.tweens.add({ targets: yazi, alpha: 0.25, duration: 420, yoyo: true, repeat: -1 });
    }
    // İki yönün genişliği tür başına bir kez ölçülür (her karede yazı yeniden çizilmesin).
    const olcu = (yon: 'sag' | 'sol'): [number, number] => {
      const a = `${h.tur}:${yon}`;
      let o = this.aracIpucuOlcu.get(a);
      if (!o) {
        yazi.setText(metin[yon]);
        o = [yazi.width, yazi.height];
        this.aracIpucuOlcu.set(a, o);
        this.aracIpucuAnahtar = a;
      }
      return o;
    };
    // Engeller ve ağırlıkları: düğmeler ve etiketler hiç örtülmesin, zarf ve açık klasör neredeyse hiç, belgelerdeki
    // değerler (inceleme alanları) az, kâğıdın boş yeri en az.
    const engel: [Phaser.Geom.Rectangle, number][] = [];
    for (const y of this.yuzeyListesi())
      for (const a of y.alanlar) {
        const n = a.nesne as unknown as Phaser.GameObjects.Components.GetBounds & Phaser.GameObjects.Components.Visible;
        if (a.nesne.active && n.visible) engel.push([n.getBounds(), 50]);
      }
    for (const k of this.masadakiKartlar()) {
      engel.push([k.sinir(), 1]);
      for (const ad of [ISTE_DUGME_AD, SAHA_DUGME_AD]) {
        const d = k.getByName(ad) as Phaser.GameObjects.Rectangle | null;
        if (d) engel.push([d.getBounds(), 1000]);
      }
    }
    if (this.not?.active) engel.push([this.not.sinir(), 1]);
    if (this.kitap) engel.push([this.kitap.sinir, this.kitap.acik ? 50 : 1]);
    if (this.zarf?.active) engel.push([this.zarf.getBounds(), 100]);
    if (this.fis?.active) engel.push([this.fis.getBounds(), 100]);
    for (const r of this.inceleme.etiketSinirlari()) engel.push([r, 1000]);
    const masa = new Phaser.Geom.Rectangle(8, MASA_Y + 8, RAF_SOL - 16, 1080 - MASA_Y - 10);
    let en: { x: number; y: number; sol: boolean; puan: number } | null = null;
    // Adaylar: her kutunun sağı ("<") ve solu (">"), düğme hizasında ya da biraz aşağı / yukarı (ok yine düğmenin
    // yanında); eşitlikte önceki aday (düğmenin kendi yanı, sağ, tam hiza) kalır.
    for (const kutu of h.kutular)
      for (const sol of [false, true])
        for (const dy of [0, 24, -24, 40, -40]) {
          const [w, yuk] = olcu(sol ? 'sol' : 'sag');
          const x = snap(sol ? kutu.left - 16 - w : kutu.right + 16);
          const y = snap(h.dugme.centerY + dy);
          const r = new Phaser.Geom.Rectangle(x, y - yuk / 2, w, yuk);
          const ic = Phaser.Geom.Rectangle.Intersection(r, masa);
          let puan = (r.width * r.height - ic.width * ic.height) * 10_000 + Math.abs(dy) * 10;
          for (const [e, agirlik] of engel) {
            const k = Phaser.Geom.Rectangle.Intersection(r, e);
            puan += k.width * k.height * agirlik;
          }
          if (!en || puan < en.puan) en = { x, y, sol, puan };
        }
    if (!en) return;
    const a = `${h.tur}:${en.sol ? 'sol' : 'sag'}`;
    if (a !== this.aracIpucuAnahtar) {
      yazi.setText(en.sol ? metin.sol : metin.sag);
      this.aracIpucuAnahtar = a;
    }
    yazi.setPosition(en.x, en.y);
  }

  private aracIpucuKaldir(): void {
    if (!this.aracIpucu) return;
    this.tweens.killTweensOf(this.aracIpucu);
    this.aracIpucu.destroy();
    this.aracIpucu = undefined;
    this.aracIpucuAnahtar = '';
  }

  /** Masadaki belgeler: mevcut dosyanınkiler ve damgalanıp henüz kalkmamış olanlar. */
  private masadakiKartlar(): DocumentCard[] {
    return [...this.kartlar, ...this.giden].filter((k) => k.active);
  }

  /** Gün 1 kural notu: gişeden masaya kayar ve gün boyu masada kalır. */
  private notGetir(gorev: string, kurallar: Kural[]): void {
    // Gün 1: notun en üstünde oyunu çerçeveleyen tek cümle (G5b, yer tutucu).
    const not = new RuleNote(this, GOZ.x, GOZ.y, this.gun, gorev, kurallar, this.gun === 1 ? CERCEVE : undefined);
    not.setDepth(ustKatman()).setAlpha(0);
    const [x, y] = not.masadaKonum(this.yer.not[0], this.yer.not[1]);
    this.tweens.add({ targets: not, alpha: 1, duration: 120, delay: 150 });
    this.tweens.add({ targets: not, x, y, duration: 460, delay: 150, ease: 'Cubic.easeOut', onStart: () => sfx.play('kagitKay') });
    this.not = not;
  }

  /** Masadaki engeller: belgeler, kural notu ve kitap (pay: her yana genişletme). */
  private engeller(pay: number): Phaser.Geom.Rectangle[] {
    const engel: Phaser.Geom.Rectangle[] = this.masadakiKartlar().map((k) => k.sinir());
    if (this.not?.active) engel.push(this.not.sinir());
    if (this.kitap) engel.push(this.kitap.sinir);
    if (pay) engel.forEach((r) => Phaser.Geom.Rectangle.Inflate(r, pay, pay));
    return engel;
  }

  /**
   * Uyarı fişi için masada boş yer (belge, not ve kitapla örtüşmeyen; birden çoksa gişeye en yakın).
   * Hiç boş yer yoksa null (fiş gişe camına düşer).
   */
  private bosYer(w: number, h: number): [number, number] | null {
    const engel = this.engeller(12);
    let en: [number, number] | null = null;
    let enPuan = Infinity;
    // 16 px adımlı ızgara; masa kenarlarına ve engellerin kenarlarına dayalı konumlar da denenir (dar boşluklar kaçmasın).
    const adimlar = (bas: number, son: number, kenarlar: number[]): number[] => {
      const out: number[] = [];
      for (let v = bas; v < son; v += 16) out.push(v);
      out.push(son, ...kenarlar.filter((v) => v >= bas && v <= son));
      return out;
    };
    const ys = adimlar(MASA.y + h / 2 + 8, MASA.y + MASA.h - h / 2 - 8, engel.flatMap((e) => [e.top - h / 2 - 4, e.bottom + h / 2 + 4]));
    const xs = adimlar(MASA.x + w / 2 + 8, MASA.x + MASA.w - w / 2 - 8, engel.flatMap((e) => [e.left - w / 2 - 4, e.right + w / 2 + 4]));
    for (const y of ys)
      for (const x of xs) {
        const r = new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h);
        const ortu = engel.some((e) => Phaser.Geom.Intersects.RectangleToRectangle(r, e));
        if (ortu) continue;
        const puan = Math.hypot(x - GOZ.x, y - MASA.y);
        if (puan < enPuan) {
          enPuan = puan;
          en = [x, y];
        }
      }
    return en;
  }

  /**
   * Fişin sabit yeri (G23): masanın sağ alt köşesi (kaşeliğin solu), sağ ve alt kenara dayalı. Doğru ve yanlış fiş
   * boyları farklı olsa da hep aynı köşeye düşer. Orası doluysa (belge ya da not taşınmışsa) null.
   */
  private fisKosesi(w: number, h: number): [number, number] | null {
    // Köşe masanın alt kenarına yakın; fişin tamamı (kâğıt ve gölgesi) ekranda kalır (G23b). Belgeler, not ve kitapla
    // aralık 4 px.
    const x = MASA.x + MASA.w - 16 - w / 2;
    const y = MASA.y + MASA.h - FIS_ALT_PAY - h / 2;
    const r = new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h);
    const engel = this.masadakiKartlar().map((k) => Phaser.Geom.Rectangle.Inflate(k.sinir(), 4, 4));
    if (this.kitap) engel.push(Phaser.Geom.Rectangle.Inflate(this.kitap.sinir, 4, 4));
    // Fiş kural notuna hiç binmez (G26); gün 1'de sığmazsa biraz küçülür (FIS_OLCEK).
    if (this.not?.active) engel.push(Phaser.Geom.Rectangle.Inflate(this.not.sinir(), 4, 4));
    return engel.some((e) => Phaser.Geom.Intersects.RectangleToRectangle(r, e)) ? null : [x, y];
  }

  /**
   * Masada boş yer yoksa zarf için en az örten yer (G23): belgeler, not ve kitapla en az kesişen konum (eşitlikte
   * gişeye yakın olan). Çekmecenin önü de engel (zarf oraya konunca alınmış sayılır).
   */
  private enAzOrten(w: number, h: number): [number, number] {
    const engel = this.engeller(0);
    const A = Cekmece.ALAN;
    engel.push(new Phaser.Geom.Rectangle(A.x, A.y - 24, A.w, A.h + 24));
    const kesisim = (a: Phaser.Geom.Rectangle, c: Phaser.Geom.Rectangle): number => {
      const x = Math.min(a.right, c.right) - Math.max(a.left, c.left);
      const y = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
      return x > 0 && y > 0 ? x * y : 0;
    };
    let en: [number, number] = [GOZ.x - 300, MASA_Y + 140];
    let enPuan = Infinity;
    for (let y = MASA.y + h / 2 + 4; y <= MASA.y + MASA.h - h / 2; y += 8)
      for (let x = MASA.x + w / 2 + 8; x <= MASA.x + MASA.w - w / 2 - 8; x += 8) {
        const r = new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h);
        const puan = engel.reduce((n, e) => n + kesisim(r, e), 0) * 100 + Math.hypot(x - GOZ.x, y - MASA.y);
        if (puan < enPuan) {
          enPuan = puan;
          en = [x, y];
        }
      }
    return en;
  }

  /** Sıradaki dosya: siluet gişeye gelir, bina pencerede görünür, belgeler gişe gözünden masaya kayar. */
  private dosyaGetir(): void {
    const bina = this.oturum.mevcut;
    if (!bina) return;
    // Önceki dosyanın fişi kayarak masadan çekilir.
    if (this.fis) {
      fisKaldir(this, this.fis);
      this.fis = undefined;
    }
    // Yeni dosyada açık klasör kapanır (G5b): belgeler klasörün altına ya da üstüne karışmasın.
    if (this.kitap?.acik) this.kitap.kapa();
    this.kaseDurum();
    this.pencere.setDosya(this.oturum.no, this.oturum.toplam);
    this.pencere.binaGoster(bina);
    const kisi = this.oturum.kisi;
    this.soruSayisi = 0;
    this.beklemeSoylendi = false;
    this.beklemeIptal();
    if (kisi) {
      const id = bina.id;
      // G39: kişi yürüyerek gelir; yerine oturunca bekleme sayacı (G33) başlar ve selam verir.
      this.pencere.kisiGelsin(kisi, () => {
        if (this.oturum.mevcut?.id !== id || this.bitirildi) return;
        this.beklemeKur();
        // Mizaçlı selam (G33): cümle tekrarsız desteden, yüz mizaçtan.
        this.time.delayedCall(TUNING.diyalog.selamGecikme, () => {
          if (this.oturum.mevcut?.id !== id || this.bitirildi) return;
          const m = kisi.mizac;
          this.pencere.soyle(this.deste.cek(`selam:${m}`, MIZAC_METIN[m].selam, degiskenler(bina)), MIZAC_IFADE[m].selam);
          // G45: gün 1'in son kusurlu dosyasında kişi selamdan kısa süre sonra zarfı kendisi uzatır.
          if (this.oturum.kendiZarfSirada) this.time.delayedCall(TUNING.kisi.kendiZarf.gecikmeMs, () => this.kendiZarf(id));
        });
      });
    }
    // Belgeler kişi gişeye varınca kayar (G39); kişi yoksa hemen.
    const gecikme = kisi ? TUNING.gise.gelisMs : 350;
    const belgeler = this.oturum.ayar.belgeler;
    this.kartlar = belgeler.map((tur, i) => {
      const [hx, hy] = this.yer.belge[tur];
      const k = belgeKur(this, tur, bina, this.gun, GOZ.x, GOZ.y - BOY[tur][1] / 2);
      k.setDepth(ustKatman()).setAlpha(0);
      // Eksik belge: sahibinden İSTE (G17); karot yoksa yanında SAHA (G19, Schmidt çekici).
      const saha = tur === 'karot' && bina.belgeler.karot === null && this.oturum.ayar.sahaHak > 0;
      if ((tur === 'karot' || tur === 'zemin') && this.oturum.istenebilir(tur)) isteDugmesi(k, () => this.iste(tur, k), saha);
      if (saha) sahaDugmesi(k, () => this.sahaDurum(), () => this.sahaAc());
      this.tweens.add({ targets: k, alpha: 1, duration: 120, delay: gecikme + i * 80 });
      this.tweens.add({
        targets: k,
        x: snap(hx),
        y: snap(hy),
        duration: 420,
        delay: gecikme + i * 80,
        ease: 'Cubic.easeOut',
        onStart: () => sfx.play('kagitKay', { volume: 0.7 }),
        // Son belge masaya inince kâğıt sesi.
        // Son belge masaya inince kâğıt sesi; mesai saati ancak o zaman işlemeye başlar.
        onComplete: () => {
          if (i === belgeler.length - 1) {
            sfx.play('kagitBirak');
            this.belgelerOturdu();
          }
        },
      });
      return k;
    });
    // Gişeden gelen belgelerin yolu kural notunun üstünden geçmesin (G41): not yeni belgelerin üstünde çizilir, belgeler
    // altından kayıp yerine oturur (yerleşimde notla belgeler çakışmaz).
    if (this.not?.active) this.not.setDepth(ustKatman());
  }

  /** Dosyanın bütün belgeleri masada: masa açılır, saat işler; gün 1 ilk dosyada kaşelik göz kırpar. */
  private belgelerOturdu(): void {
    if (this.bitirildi) return;
    this.mesgul = false;
    if (this.ilkDosya) {
      this.ilkDosya = false;
      if (this.gun === 1) this.kaselik.ipucuBaslat();
    }
  }

  /** Tek tıklamalı kaşenin ineceği yer: ruhsatın sol alt köşesi (mühür yeri). Damga vurulamıyorsa null. */
  private muhurYeri(): [number, number] | null {
    if (this.mesgul || this.bitirildi || this.saha) return null;
    const r = this.kartlar.find((k) => k.tur === 'ruhsat' && k.active);
    if (!r) return null;
    return [snap(r.x - r.genislik / 2 + 152), snap(r.y + r.yukseklik / 2 - 60)];
  }

  // ---- Gişedeki kişi (G17): SOR, İSTE, zarf ----

  /** SOR: bulunan tutarsızlık kişiye sorulur; cevap balonda (bahane, itiraf ya da zarf). */
  private sor(id: KusurId): void {
    if (this.mesgul || this.bitirildi) return;
    const kisi = this.oturum.kisi;
    const c = this.oturum.sor(id);
    if (!c || !kisi) return;
    this.aracKullanildi.sor = true;
    this.eylem();
    const baslik = `SOR · ${KUSUR_BILGI[id].etiket.toLocaleUpperCase('tr-TR')}`;
    const [metin, ifade] = this.sorMetni(kisi, c);
    this.pencere.soyle(metin, ifade, { baslik });
    if (c.zarf !== undefined) {
      const miktar = c.zarf;
      const istenen = c.istenen ?? 'guvenli';
      const dosya = this.oturum.mevcut?.id;
      this.kaseDurum();
      this.time.delayedCall(700, () => {
        if (this.oturum.mevcut?.id === dosya && !this.mesgul) this.zarfGetir(miktar, istenen);
      });
    }
  }

  /**
   * Kendiliğinden zarf (G45): kişi SOR beklemeden zarfı uzatır. Cümle: mizacın giriş cümlesi (sığarsa), kusurun zarf
   * cümlesi ve istenen damga; zarf SOR zarfı gibi masaya kayar (AL / GERİ VER, sürükleme, kaşeler kilitli).
   */
  private kendiZarf(dosya: string): void {
    if (this.oturum.mevcut?.id !== dosya || this.bitirildi) return;
    const kisi = this.oturum.kisi;
    const c = this.oturum.kendiZarf();
    if (!c || !kisi || c.zarf === undefined) return;
    this.eylem();
    const D = this.deste;
    const m = kisi.mizac;
    const d = degiskenler(this.oturum.mevcut, c.zarf);
    let metin = D.cek(`sor:${c.kusur}:zarf`, SOR_METIN[c.kusur].zarf, d);
    if (c.istenen) metin += `\n${D.cek(`istek:${c.istenen}`, ZARF_ISTEK[c.istenen], d)}`;
    const anahtar = `kendiZarfGiris:${m}`;
    const uzun = `${D.cek(anahtar, KENDI_ZARF_GIRIS[m], d)}\n${metin}`;
    if (this.pencere.sigar(uzun)) metin = uzun;
    else D.geriKoy(anahtar);
    this.pencere.soyle(metin, c.ifade);
    this.kaseDurum();
    const miktar = c.zarf;
    const istenen = c.istenen ?? 'guvenli';
    this.time.delayedCall(700, () => {
      if (this.oturum.mevcut?.id === dosya && !this.bitirildi && this.oturum.zarfBekliyor) this.zarfGetir(miktar, istenen);
    });
  }

  /**
   * Kaşeliğin kilit durumu ve uyarısı (G22): zarf karar bekliyorsa hepsi kilitli ("Önce zarfa karar ver"), zarf
   * alındıysa yalnızca istenen kaşe açık ("Zarf aldın: GÜVENLİ"); zarf yoksa ya da geri verildiyse hepsi açık.
   */
  private kaseDurum(): void {
    const z = this.oturum.zarf;
    let uyari: string | null = null;
    if (z && !this.oturum.bitti) {
      if (z.kabul === undefined) uyari = ZARF_IPUCU.bekliyor;
      else if (z.kabul) uyari = ZARF_IPUCU.alindi.replace('{damga}', DAMGA_ADI[z.istenen]);
    }
    this.kaselik.durum(uyari);
  }

  /**
   * Zarf gişeden masaya kayar; çekmece açılır. Üstünde kişinin istediği damga, altında AL / GERİ VER (G22).
   * Sürükleme de karar verir: gişeye geri sürüklenirse ret, çekmeceye konursa kabul. İnceleme modunda da çalışır.
   */
  private zarfGetir(miktar: number, istenen: ZarfIstek): void {
    this.cekmece.ac(ustKatman());
    const z = new Zarf(this, miktar, GOZ.x, GOZ.y - 24, {
      not: ZARF_NOT.replace('{damga}', DAMGA_ADI[istenen]),
      al: ZARF_DUGME.al,
      geri: ZARF_DUGME.geri,
    });
    z.setDepth(ustKatman()).setAlpha(0);
    const yer = this.bosYer(ZARF_ALAN.w, ZARF_ALAN.h) ?? this.enAzOrten(ZARF_ALAN.w, ZARF_ALAN.h);
    this.tweens.add({ targets: z, alpha: 1, duration: 120 });
    this.tweens.add({ targets: z, x: snap(yer[0]), y: snap(yer[1] - ZARF_ALAN.dy), duration: 460, ease: 'Cubic.easeOut' });
    sfx.play('zarfKay');
    z.on('birakildi', (x: number, y: number) => this.zarfBirakildi(z, x, y));
    z.on('karar', (kabul: boolean) => (kabul ? this.zarfAl(z) : this.zarfGeriVer(z)));
    this.zarf = z;
    this.kaseDurum();
  }

  private zarfBirakildi(z: Zarf, x: number, y: number): void {
    if (this.mesgul || this.zarf !== z) return;
    if (y < MASA_Y + 8) this.zarfGeriVer(z);
    else if (this.cekmece.icinde(x, y)) this.zarfAl(z);
  }

  /** Zarf geri verildi (ret): kişi kızgın ya da mahcup, kaşeler açılır; oyuncu özgürce karar verir. */
  private zarfGeriVer(z: Zarf): void {
    if (this.mesgul || this.zarf !== z || !this.oturum.zarfBekliyor) return;
    this.oturum.zarfKarar(false);
    this.zarf = undefined;
    z.kilitle();
    this.tweens.add({ targets: z, x: GOZ.x, y: GOZ.y - 60, alpha: 0, duration: 380, ease: 'Cubic.easeIn', onComplete: () => z.destroy() });
    sfx.play('zarfRet');
    this.cekmece.kapa(200);
    this.eylem();
    const kisi = this.oturum.kisi;
    if (kisi) {
      const m = kisi.mizac;
      this.pencere.soyle(this.deste.cek(`zarfRet:${m}`, MIZAC_METIN[m].zarfRet, this.degisken()), MIZAC_IFADE[m].zarfRet);
    }
    this.kaseDurum();
  }

  /** Zarf alındı (kabul): çekmeceye kayar; yalnızca kişinin istediği kaşe açık kalır. */
  private zarfAl(z: Zarf): void {
    if (this.mesgul || this.zarf !== z || !this.oturum.zarfBekliyor) return;
    this.oturum.zarfKarar(true);
    this.zarfCekmeceye(z);
    this.eylem();
    const kisi = this.oturum.kisi;
    if (kisi) {
      const m = kisi.mizac;
      this.pencere.soyle(this.deste.cek(`zarfKabul:${m}`, MIZAC_METIN[m].zarfKabul, this.degisken()), 'sevincli');
    }
    this.kaseDurum();
  }

  /** Zarf çekmeceye kayar ve çekmece kapanır (kabul). */
  private zarfCekmeceye(z: Zarf): void {
    if (this.zarf === z) this.zarf = undefined;
    z.kilitle();
    const [x, y] = this.cekmece.agiz;
    this.tweens.add({ targets: z, x, y, scale: 0.7, duration: 260, ease: 'Cubic.easeIn' });
    this.tweens.add({ targets: z, alpha: 0, delay: 200, duration: 160, onComplete: () => z.destroy() });
    this.cekmece.kapa(300);
  }

  /**
   * İSTE: eksik belge ya da geçersiz belgenin düzgünü (G17b) kişiden istenir. Gerçek ya da sahte belge gelirse
   * kart gişeden kayar ve eski kartın ("Rapor yok" ya da geçersiz belge) yerine geçer (eski kart gişeye geri
   * döner); getiremezse kart gelmez.
   */
  private iste(alan: IsteAlani, eski: DocumentCard): void {
    if (this.mesgul || this.bitirildi) return;
    const once = this.oturum.mevcut;
    const eksik = !!once && (alan === 'karot' || alan === 'zemin') && once.belgeler[alan] === null;
    const kisi = this.oturum.kisi;
    const c = this.oturum.iste(alan);
    const bina = this.oturum.mevcut;
    if (!c || !bina || !kisi) return;
    this.aracKullanildi.iste = true;
    this.eylem();
    const anahtar = `${eksik ? 'iste' : 'isteBelge'}:${c.tur}`;
    const govde = this.deste.cek(anahtar, (eksik ? ISTE_METIN : ISTE_BELGE_METIN)[c.tur], this.degisken());
    const [metin, ifade] = this.sabirsizEkle(kisi, govde, c.ifade);
    this.pencere.soyle(metin, ifade, { baslik: ISTE_BASLIK[alan] });
    const rapor = c.rapor;
    if (!rapor) return;
    this.time.delayedCall(TUNING.diyalog.raporGecikme, () => {
      if (this.oturum.mevcut?.id !== bina.id || this.mesgul || this.bitirildi) return;
      const yeni = raporKur(this, bina, rapor, this.gun, GOZ.x, GOZ.y);
      yeni.setY(GOZ.y - yeni.yukseklik / 2);
      const h = yeni.yukseklik;
      const hedef = eski.active ? [eski.x, eski.y] : this.yer.belge[alan];
      const [hx, hy] = yeni.masadaKonum(hedef[0], hedef[1]);
      // Kayarken yeni ve eski kart masadaki her şeyin altından geçer (G5b: öbür belgeleri ve klasörü örtmez); yeni
      // kart yerine inince eski kartın katmanına çıkar.
      const sonDerinlik = eski.active ? eski.depth : ustKatman();
      yeni.setDepth(KAYAN_DERINLIK).setAlpha(0);
      if (this.inceleme.acik) yeni.disableInteractive(true);
      this.tweens.add({ targets: yeni, alpha: 1, duration: 120 });
      this.tweens.add({
        targets: yeni,
        x: hx,
        y: hy,
        duration: 440,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          if (yeni.active && yeni.depth === KAYAN_DERINLIK) yeni.setDepth(sonDerinlik);
          sfx.play('kagitBirak');
        },
      });
      sfx.play('kagitKay');
      const i = this.kartlar.indexOf(eski);
      if (i >= 0) this.kartlar.splice(i, 1, yeni);
      else this.kartlar.push(yeni);
      if (eski.active) {
        this.input.setDraggable(eski, false);
        eski.disableInteractive();
        eski.setDepth(KAYAN_DERINLIK);
        this.tweens.add({ targets: eski, x: GOZ.x, y: GOZ.y - h / 2 - 40, alpha: 0, duration: 360, ease: 'Cubic.easeIn', onComplete: () => eski.destroy() });
      }
    });
  }

  // ---- Gişe diyaloğu (G33): mizaç, tekrarsız deste, oyuncuya tepki ----

  /** Oyunun cümle desteleri (oturum boyu; günler arasında sıfırlanmaz). */
  private get deste(): Desteler {
    return desteler(this.tohum);
  }

  /** Mevcut dosyanın cümle değişkenleri ({kat}, {yil}, {ada}, {bina}; zarf varsa {para}). */
  private degisken(): Degiskenler {
    return degiskenler(this.oturum.mevcut, this.oturum.zarf?.miktar);
  }

  /**
   * SOR cevabı: kusurun cevap cümlesi (zarfta istenen damga da), bazen (TUNING.diyalog.sorGiris, deterministik) başta
   * mizacın giriş cümlesi; üçüncü SOR / İSTE'den itibaren en başta sabırsız cümlesi. Balona sığmayan giriş düşer.
   */
  private sorMetni(kisi: Kisi, c: SorCevap): [string, Ifade] {
    const D = this.deste;
    const m = kisi.mizac;
    const d = degiskenler(this.oturum.mevcut, c.zarf);
    let govde = D.cek(`sor:${c.kusur}:${c.tur}`, SOR_METIN[c.kusur][c.tur], d);
    // Zarf (G22): kişi zarfı uzatırken hangi damgayı istediğini söyler; karar verilene kadar kaşeler kilitli.
    if (c.zarf !== undefined && c.istenen) govde += `\n${D.cek(`istek:${c.istenen}`, ZARF_ISTEK[c.istenen], d)}`;
    const binaId = this.oturum.mevcut?.id ?? '';
    if (sabitOran(this.tohum, `sorGiris:${binaId}:${c.kusur}`) < TUNING.diyalog.sorGiris) {
      const anahtar = `sorGiris:${m}`;
      const uzun = `${D.cek(anahtar, MIZAC_METIN[m].sorGiris, d)}\n${govde}`;
      // Sabırsız cümlesi de gelecekse onun en uzunuyla birlikte sığmalı: önce sabırsız, sonra giriş düşer.
      if (this.pencere.sigar(this.sabirsizPayi(kisi, uzun), true)) govde = uzun;
      else D.geriKoy(anahtar);
    }
    return this.sabirsizEkle(kisi, govde, c.ifade);
  }

  /** Bu cevaba sabırsız cümlesi eklenecekse metnin önüne mizacın en uzun sabırsız cümlesi (sığma denetimi için). */
  private sabirsizPayi(kisi: Kisi, govde: string): string {
    if (this.soruSayisi + 1 < TUNING.diyalog.sabirsizSoru[kisi.mizac]) return govde;
    const enUzun = MIZAC_METIN[kisi.mizac].sabirsiz.reduce((a, b) => (b.length > a.length ? b : a), '');
    return `${enUzun}\n${govde}`;
  }

  /**
   * Aynı kişiye eşikteki ve sonraki SOR / İSTE (TUNING.diyalog.sabirsizSoru, mizaca göre): cevabın önüne yeni satırda mizacın
   * sabırsız cümlesi; yüz sabırsız yüzü, cevabın kendi yüzü daha güçlüyse o (IFADE_GUC). Sığmazsa eklenmez.
   */
  private sabirsizEkle(kisi: Kisi, govde: string, ifade: Ifade): [string, Ifade] {
    this.soruSayisi++;
    const m = kisi.mizac;
    if (this.soruSayisi < TUNING.diyalog.sabirsizSoru[m]) return [govde, ifade];
    const anahtar = `sabirsiz:${m}`;
    const metin = `${this.deste.cek(anahtar, MIZAC_METIN[m].sabirsiz, this.degisken())}\n${govde}`;
    if (!this.pencere.sigar(metin, true)) {
      this.deste.geriKoy(anahtar);
      return [govde, ifade];
    }
    const s = MIZAC_IFADE[m].sabirsiz;
    return [metin, IFADE_GUC[ifade] >= IFADE_GUC[s] ? ifade : s];
  }

  /** Denetçi bir şey yaptı (SOR, İSTE, saha, zarf, inceleme açma, kusur bulma): bekleme sayacı baştan başlar. */
  private eylem(): void {
    if (!this.beklemeSoylendi) this.beklemeKur();
  }

  private beklemeKur(): void {
    this.beklemeIptal();
    if (this.beklemeSoylendi || this.bitirildi || !this.oturum.kisi) return;
    this.beklemeSaat = this.time.delayedCall(TUNING.diyalog.beklemeMs, () => this.beklemeSoyle());
  }

  private beklemeIptal(): void {
    this.beklemeSaat?.remove();
    this.beklemeSaat = undefined;
  }

  /** Bekleme cümlesi (kişi başına bir kez). Başka konuşma sürüyorsa ya da saha testi açıksa biraz sonra yeniden dener. */
  private beklemeSoyle(): void {
    this.beklemeSaat = undefined;
    const kisi = this.oturum.kisi;
    if (this.beklemeSoylendi || this.mesgul || this.bitirildi || !kisi) return;
    if (this.pencere.konusuyor || this.saha) {
      this.beklemeSaat = this.time.delayedCall(TUNING.diyalog.beklemeTekrarMs, () => this.beklemeSoyle());
      return;
    }
    this.beklemeSoylendi = true;
    const m = kisi.mizac;
    this.pencere.soyle(this.deste.cek(`bekleme:${m}`, MIZAC_METIN[m].bekleme, this.degisken()), MIZAC_IFADE[m].bekleme);
  }

  // ---- Saha testi (G19, Schmidt çekici) ----

  /** Tezgâhta "SAHA 2": günün kalan saha testi hakkı. */
  private sahaSayacKur(): void {
    const S = SAHA_SAYAC;
    this.add.rectangle(S.x, S.y, S.w, S.h, num(PAL.panel)).setStrokeStyle(PX, num(PAL.panelKenar)).setDepth(3004);
    this.sahaSayac = this.add
      .text(S.x, S.y, '', { fontFamily: FONT, fontSize: '32px', color: PAL.panelYazi })
      .setOrigin(0.5)
      .setDepth(3005);
    this.sahaSayacGuncelle();
  }

  private sahaSayacGuncelle(): void {
    const hak = this.oturum.sahaHakki;
    this.sahaSayac?.setText(SAHA_METIN.sayac.replace('{hak}', String(hak))).setColor(hak > 0 ? PAL.panelYazi : PAL.murekkepAcik);
  }

  /** "Rapor yok" kartındaki SAHA düğmesinin durumu. */
  private sahaDurum(): 'acik' | 'hakYok' | 'yok' {
    if (this.mesgul || this.bitirildi || this.saha || !this.oturum.sahaGerekli()) return 'yok';
    return this.oturum.sahaYapilabilir() ? 'acik' : 'hakYok';
  }

  /**
   * Saha testi açılır: masa kilitlenir (kaşelik, inceleme, belgeler örtülü), saat işlemeye devam eder. Tamamlanınca
   * hak harcanır ve saat ilerler; NOTU AL ile saha notu karot kartının yerine masaya düşer. VAZGEÇ hak harcamaz.
   */
  private sahaAc(): void {
    if (this.mesgul || this.bitirildi || this.saha) return;
    const bina = this.oturum.mevcut;
    const sonuc = this.oturum.sahaOnizle();
    if (!bina || !sonuc) return;
    this.aracKullanildi.saha = true;
    this.eylem();
    if (this.inceleme.acik) this.inceleme.kapa();
    this.inceleme.gizle(true);
    this.kaselik.kilitle(true);
    const saha = new SahaTesti(this, { bina, tohum: this.tohum, sonuc, hak: this.oturum.sahaHakki });
    saha.on('tamamlandi', () => {
      this.oturum.sahaTamamla();
      this.sahaSayacGuncelle();
      saha.hakGoster(this.oturum.sahaHakki);
      this.sahaSureGoster(saha);
    });
    saha.on('kapandi', (s: SahaSonucu | null) => {
      this.saha = undefined;
      this.inceleme.gizle(false);
      if (this.bitirildi) return;
      this.kaselik.kilitle(false);
      const edinildi = this.oturum.mevcut?.id === bina.id && this.oturum.edinilenBilgi.kaynak.karot === 'saha';
      if (s && edinildi) this.sahaNotuDusur(bina, s);
    });
    this.saha = saha;
  }

  /**
   * Saha testinin zaman bedeli (G24): test tamamlanınca tezgâhtaki saatin altında "[+30 dk]" (saat o anda ilerler).
   * Saha paneli açık kaldıkça durur; panel kapanınca (NOTU AL) 2,5 sn daha görünür ve söner.
   */
  private sahaSureGoster(saha: SahaTesti): void {
    const yazi = this.add
      .text(SAAT_YANI.x, SAAT_YANI.y, SAHA_SURE.replace('{dk}', String(TUNING.saha.dakika)), {
        fontFamily: FONT,
        fontSize: `${SAAT_YANI.boy}px`,
        color: '#f0e6cc',
        backgroundColor: PAL.damgaBosalt,
        padding: { x: 6, y: 0 },
      })
      .setOrigin(0.5, 0)
      .setDepth(SAAT_YANI.derinlik)
      .setAlpha(0);
    this.tweens.add({ targets: yazi, alpha: 1, duration: 160, ease: 'Stepped', easeParams: [3] });
    saha.once('kapandi', () => {
      this.tweens.add({ targets: yazi, alpha: 0, duration: 400, delay: 2500, ease: 'Stepped', easeParams: [3], onComplete: () => yazi.destroy() });
    });
  }

  /** Saha notu karot kartının (Rapor yok ya da geçersiz karot) yerine masaya düşer; eski kart gişeye döner. */
  private sahaNotuDusur(bina: Bina, s: SahaSonucu): void {
    const eski = this.kartlar.find((k) => k.tur === 'karot' && k.active);
    const hedef = eski ? [eski.x, eski.y] : this.yer.belge.karot;
    const yeni = sahaNotuKur(this, bina, s, this.gun, hedef[0], hedef[1]);
    yeni.setData('sahaNotu', true);
    const [hx, hy] = yeni.masadaKonum(hedef[0], hedef[1]);
    yeni.setPosition(hx, hy - 24).setDepth(ustKatman()).setAlpha(0).setScale(1.08);
    this.tweens.add({
      targets: yeni,
      alpha: 1,
      y: hy,
      scale: 1,
      duration: 260,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        sfx.play('kagitBirak');
        // Klasör açıksa ve not altında kaldıysa klasör yana kayar (G24).
        this.kitap?.kacin();
      },
    });
    sfx.play('kagitKay', { volume: 0.7 });
    const i = eski ? this.kartlar.indexOf(eski) : -1;
    if (i >= 0) this.kartlar.splice(i, 1, yeni);
    else this.kartlar.push(yeni);
    if (eski) {
      const h = eski.yukseklik;
      this.input.setDraggable(eski, false);
      eski.disableInteractive();
      eski.setDepth(KAYAN_DERINLIK);
      this.tweens.add({ targets: eski, x: GOZ.x, y: GOZ.y - h / 2 - 40, alpha: 0, duration: 360, ease: 'Cubic.easeIn', onComplete: () => eski.destroy() });
    }
  }

  /**
   * Kaşe (x, y) noktasına indi. Ruhsatın üstündeyse damga sayılır (true): mürekkep izi o noktada; değilse
   * (boş masa, başka belge, masa meşgul) false ve kaşe yerine döner.
   */
  private damgala(damga: Damga, x: number, y: number): boolean {
    if (this.mesgul || this.bitirildi || this.saha) return false;
    const ruhsat = this.kartlar.find((k) => k.tur === 'ruhsat' && k.active);
    if (!ruhsat || !ruhsat.sinir().contains(x, y)) return false;
    // Damga oturumu sonraki dosyaya geçirir: tepki veren kişi ve binası önceden alınır (G33).
    const kisi = this.oturum.kisi;
    const d = this.degisken();
    // Örtük kabul yok (G22): zarf karar beklerken ya da alınan zarfın istemediği damga vurulmaz (kaşelik zaten kilitli).
    const sonuc = this.oturum.damgala(damga);
    if (!sonuc) return false;
    this.mesgul = true;
    this.beklemeIptal();
    // G51: etiketlerdeki SOR / İSTE / SAHA düğmeleri söner (dosya kalkana kadar etiketler masada).
    this.inceleme.damgalandi();
    const sonKarar = this.oturum.kararlar[this.oturum.kararlar.length - 1];
    const zarfAlindi = !!sonKarar?.zarf?.kabul;
    this.kaseDurum();
    // Kişi damgaya mizacıyla tepki verir (G33); yüz damgadan.
    if (kisi) {
      const tepki = this.deste.cek(`damga:${kisi.mizac}:${damga}`, MIZAC_METIN[kisi.mizac].damga[damga], d);
      this.time.delayedCall(260, () => this.pencere.soyle(tepki, DAMGA_IFADE[damga]));
    }

    // Kaşe indi: mürekkep izi ruhsatta, indiği yerde (kart içinde kalacak şekilde).
    sfx.play(damga === 'iade' ? 'iade' : 'damga');
    this.pencere.damgaVur(damga, zarfAlindi);
    punch(this, 0.01, 110);
    ruhsat.one();
    const iz = damgaIzi(this, damga, this.tohum + this.oturum.kararlar.length * 131);
    const mx = ruhsat.genislik / 2 - iz.displayWidth / 2 - 8;
    const my = ruhsat.yukseklik / 2 - iz.displayHeight / 2 - 8;
    iz.setPosition(snap(Phaser.Math.Clamp(x - ruhsat.x, -mx, mx)), snap(Phaser.Math.Clamp(y - ruhsat.y, -my, my)));
    ruhsat.add(iz);

    // Uyarı fişi (yer tutucu geri bildirim).
    this.time.delayedCall(450, () => {
      if (this.fis) fisKaldir(this, this.fis);
      // Yanlış kararda doğrusu ve dosyadaki kusurlar (atlanan ya da olmadığı halde görülen).
      // Eksiksiz dosyayı İADE etmek: gerekçe "dosya eksiksiz" (yer tutucu metin).
      const kusurlar = sonuc.etiketler.join('\n') || (damga === 'iade' ? 'Kusur yok, dosya eksiksiz' : 'Kusur yok');
      // Doğru kararda da kısa gerekçe (G5b): kusurlar ya da "Kusur yok", ok ve vurulan damga.
      const gerekce = `${sonuc.etiketler.join(', ') || 'Kusur yok'} → ${DAMGA_ADI[damga]}`;
      let metin = sonuc.dogru ? `Doğru karar\n${gerekce}` : `Yanlış karar\nDoğrusu: ${DAMGA_ADI[sonuc.dogruDamga]}\n${kusurlar}`;
      // İnceleme kullanılmadan verilen ilk yanlış kararda (oturumda bir kez, G24) inceleme ipucu; ceza yok. Oyuncu bu
      // dosyada kusuru incelemeyle bulduysa ipucu çıkmaz (G25): incelemeyi zaten biliyor. Kusursuz dosyada da çıkmaz
      // (G27): kanıtlanacak kusur yok; ipucu hakkı kusurlu bir dosyadaki ilk yanlışa kalır. Zarf alınıp istenen kaşe
      // vurulduysa (G51) yanlış bilinçli: ipucu yerine zarf satırı, ipucu hakkı harcanmaz.
      if (!sonuc.dogru && zarfAlindi) metin += `\n${ZARF_FIS}`;
      else if (!sonuc.dogru && !incelemeIpucuGosterildi && sonuc.kusurlar.length > 0 && (sonKarar?.bulunan.length ?? 0) === 0) {
        incelemeIpucuGosterildi = true;
        metin += `\n${INCELE_IPUCU}`;
      }
      const fis = fisKur(this, sonuc.dogru, metin);
      // Masanın boş yerine; yer yoksa gişe camının altına (belge değerlerini örtmesin).
      // Önce tam boy, sığmazsa biraz küçük; masada hiç yer yoksa gişe camının sol kenarına küçülerek (silueti örtmez).
      // Önce sabit köşe (G23: doğru ve yanlış fiş aynı yere), doluysa masanın başka boş yeri.
      let yer: [number, number] | null = null;
      for (const bul of [(w: number, h: number) => this.fisKosesi(w, h), (w: number, h: number) => this.bosYer(w, h)]) {
        for (const s of FIS_OLCEK) {
          yer = bul(fis.width * s, fis.height * s);
          if (yer) {
            fis.setScale(s);
            break;
          }
        }
        if (yer) break;
      }
      if (yer) fisDusur(this, fis, yer[0], yer[1]);
      else {
        const s = Phaser.Math.Clamp(FIS_GISE.w / fis.width, 0.5, 1);
        fis.setScale(s);
        fisDusur(this, fis, FIS_GISE.x + (fis.width * s) / 2, FIS_GISE.alt - (fis.height * s) / 2, FIS_GISE.derinlik);
      }
      this.fis = fis;
      sfx.play('fis');
      sfx.play(sonuc.dogru ? 'dogru' : 'uyari');
    });

    // Belgeler toplanıp gişeden geri verilir, mal sahibi yürüyerek ayrılır; gişe bir an boş kalır (G39).
    const eski = this.kartlar;
    this.kartlar = [];
    this.giden = eski;
    const topla = 1300;
    this.time.delayedCall(topla, () => {
      this.inceleme.dosyaBitti();
      this.pencere.kisiGitsin();
      eski.forEach((k, i) => {
        this.input.setDraggable(k, false);
        k.disableInteractive();
        this.tweens.add({
          targets: k,
          x: GOZ.x,
          y: GOZ.y - k.yukseklik / 2 - 40,
          duration: 380,
          delay: i * 50,
          ease: 'Cubic.easeIn',
          onComplete: () => k.destroy(),
        });
      });
      sfx.play('kagitTopla');
    });
    // Mesai saati bu geçişte durur (mesgul): yeni dosyanın belgeleri masaya inince yeniden işler.
    const belgeSonu = topla + 380 + eski.length * 50 + 120;
    const cikis = topla + (kisi ? TUNING.gise.gidisMs : 0);
    if (this.oturum.bitti) this.time.delayedCall(Math.max(belgeSonu, cikis), () => this.bitir());
    else this.time.delayedCall(Math.max(belgeSonu, cikis + (kisi ? TUNING.gise.bosMs : 0)), () => this.dosyaGetir());
    return true;
  }

  /** Gün bitti (dosyalar ya da mesai): öncü sarsıntı kancası, sonra gün sonu ekranı. */
  private bitir(): void {
    if (this.bitirildi) return;
    this.bitirildi = true;
    this.mesgul = true;
    this.beklemeIptal();
    // Mesai saha testinde biterse test kapanır (sonuç yok).
    this.saha?.kapat(null);
    if (this.inceleme.acik) this.inceleme.kapa();
    this.gunSonuOncesi(() => this.gunSonu());
  }

  /**
   * Gün sonu ekranından önceki adım: öncü sarsıntı olan günlerde (gün 1) sokak sallanır, zayıf binalar çatlar;
   * sonuç gün sonu raporuna ve sonraki günlerin sokağına taşınır. Sekans sırasında masa kilitli; Esc çalışır.
   */
  private gunSonuOncesi(devam: () => void): void {
    this.events.emit('gunSonuOncesi', this.oturum.ayar);
    if (!this.oturum.ayar.oncuSarsinti) {
      devam();
      return;
    }
    this.masaKilitle();
    const O = TUNING.oncu;
    const sokak = this.pencere.sokak;
    const binalar = sokak.damgalilar();
    // Her damgalı binanın üstünde damga etiketi (G5b); çatlayanlarda üstünde sonuç belirir. Sokak, en uzun
    // binanın etiketi pencereye sığacak kadar küçülür (etiketler sokakla birlikte ölçeklenir); etiketin üstü
    // pencerenin iç üst kenarından en az ETIKET_UST_PAY aşağıda (G23b: 1280×720'de 8 px).
    let olcek = 1;
    for (const b of binalar) {
      const k = sokak.yerelKutu(b.yer);
      olcek = Math.min(olcek, (k.bottom - ETIKET_UST_PAY) / (k.height + ETIKET_KUCUK_YUKSEKLIK));
    }
    // Sokak etiketler belirmeden önce küçülür (G23b): etiketler hiçbir an pencerenin üstünden taşmasın. Sarsıntı
    // aynı görünümü kullanır.
    if (binalar.length > 0) {
      const yerler = binalar.map((b) => b.yer);
      sokak.odakla(Math.min(...yerler), Math.max(...yerler), 500, undefined, 0.5, 0.5, olcek);
    }
    this.time.delayedCall(700, () => {
      this.oncuEtiketler = [];
      const etiketler = new Map<string, BinaEtiketi>();
      for (const b of binalar) {
        const e = binaEtiketi(this, b.damga, ETIKET_KUCUK, undefined, b.zarf ? ZARF_ETIKET : undefined);
        e.kap.setAlpha(0);
        this.tweens.add({ targets: e.kap, alpha: 1, duration: 240, ease: 'Stepped', easeParams: [3] });
        sokak.ustuneEkle(b.yer, e.kap);
        etiketler.set(b.bina.id, e);
        this.oncuEtiketler.push({ e, x0: e.kap.x, yer: b.yer });
      }
      // Rapora geçiş (G23): sallantı bittikten sonra kısa bir durulma; son bina tepki verdikten sonra Enter, Space
      // ya da tıklama hemen geçer.
      let gecildi = false;
      const gec = (): void => {
        if (gecildi) return;
        gecildi = true;
        this.input.keyboard?.off('keydown-ENTER', atla);
        this.input.keyboard?.off('keydown-SPACE', atla);
        this.input.off(Phaser.Input.Events.POINTER_DOWN, atla);
        devam();
      };
      const kontrol = new Quake(this, sokak, SOKAK_DERINLIK).oynat(
        O.siddet,
        binalar,
        (sonuclar) => {
          this.oncu = { siddet: O.siddet, sonuclar: sonuclar.map(({ dosyaId, durum, bos }) => ({ dosyaId, durum, bos })) };
          gec();
        },
        {
          sure: O.sureMs,
          genlik: O.sarsinti,
          enAgir: 'hasarli',
          gizli: false,
          yazi: KUCUK_DEPREM_SERIT,
          yaziAlan: GISE_ALAN,
          enBuyukOlcek: olcek,
          binaTepki: (s) => {
            const o = this.oncuEtiketler.find((x) => x.e === etiketler.get(s.dosyaId));
            if (!o) return;
            o.sonuc = oncuEtiketi(s.bos);
            o.zemin = s.bos ? PAL.damgaIade : PAL.damgaBosalt;
            o.e.sonucGoster(o.sonuc, o.zemin);
            this.oncuEtiketSigdir();
          },
        },
      );
      let atlanabilir = false;
      const atla = (): void => {
        if (atlanabilir) kontrol.bitir();
      };
      this.input.keyboard?.on('keydown-ENTER', atla);
      this.input.keyboard?.on('keydown-SPACE', atla);
      this.input.on(Phaser.Input.Events.POINTER_DOWN, atla);
      this.time.delayedCall(ONCU_TEPKI_SONU * O.sureMs + 400, () => (atlanabilir = true));
      this.time.delayedCall(ONCU_SARSINTI_SONU * O.sureMs + O.durulmaMs, () => kontrol.bitir());
    });
  }

  /**
   * Öncü sarsıntı etiketleri pencere camlarının içinde kalsın (G23): etiket, binasının bulunduğu camın (orta kayıt
   * ve çerçeve arası) sınırlarına kaydırılır; çubuğu binanın üstünde kalır. Cama hiç sığmayan sonuç iki satıra
   * bölünür. Sokak odaklanırken her karede çağrılır.
   */
  private oncuEtiketSigdir(): void {
    const sokak = this.pencere.sokak;
    const g = sokak.gorunum;
    const pay = 8;
    const ara = 8;
    const yer = this.oncuEtiketler.map((o) => {
      const ax = g.x + o.x0 * g.olcek;
      const cam =
        PENCERE_CAMLARI.find((c) => ax >= c.x0 && ax <= c.x1) ??
        PENCERE_CAMLARI.reduce((a, c) => (Math.min(Math.abs(ax - c.x0), Math.abs(ax - c.x1)) < Math.min(Math.abs(ax - a.x0), Math.abs(ax - a.x1)) ? c : a));
      let w = o.e.genislik() * g.olcek;
      const genis = cam.x1 - cam.x0 - pay * 2;
      if (w > genis && o.sonuc?.includes(' · ') && !o.bolundu) {
        // Sonuç çipi cama sığmıyor: "[ÇATLADI · İÇİ BOŞ]" iki satır.
        o.bolundu = true;
        o.e.sonucGoster(o.sonuc.replace(' · ', SATIR_SONU), o.zemin ?? PAL.damgaIade);
        w = o.e.genislik() * g.olcek;
      }
      const x = w > genis ? (cam.x0 + cam.x1) / 2 : Phaser.Math.Clamp(ax, cam.x0 + pay + w / 2, cam.x1 - pay - w / 2);
      // Etiketin dikey aralığı (cephenin üstünden etiket boyu kadar yukarı): yan yana etiketler çakışıyor mu.
      const alt = g.y + sokak.yerelKutu(o.yer).y * g.olcek;
      return { o, ax, cam, w, x, alt, ust: alt - ETIKET_KUCUK_YUKSEKLIK * g.olcek };
    });
    // Aynı camdaki komşu etiketler üst üste binmesin: sağdaki sağa, sığmazsa soldaki sola itilir.
    const sirali = [...yer].sort((a, b) => a.x - b.x);
    for (let i = 1; i < sirali.length; i++) {
      const a = sirali[i - 1];
      const b = sirali[i];
      if (a.cam !== b.cam || a.alt < b.ust || b.alt < a.ust) continue;
      const gerek = a.x + a.w / 2 + ara + b.w / 2;
      if (b.x >= gerek) continue;
      b.x = Math.min(gerek, b.cam.x1 - pay - b.w / 2);
      if (b.x < gerek) a.x = Math.max(a.cam.x0 + pay + a.w / 2, b.x - b.w / 2 - ara - a.w / 2);
    }
    for (const { o, ax, x } of yer) {
      const kayma = Math.round((x - ax) / g.olcek / 2) * 2;
      o.e.kap.setX(o.x0 + kayma);
      // Çubuk binanın ortasında kalır; etiket çok kaydıysa etiketin altından çıkacak kadar yana.
      const yari = Math.max(0, o.e.genislik() / 2 - 12);
      o.e.cubuk.setX(Phaser.Math.Clamp(-kayma, -yari, yari));
    }
  }

  /** Sekans sırasında belgeler, kural notu, klasör ve kaşelik kilitli. */
  private masaKilitle(): void {
    if (this.ipucu) {
      this.tweens.killTweensOf(this.ipucu);
      this.ipucu.destroy();
      this.ipucu = undefined;
    }
    for (const k of this.masadakiKartlar()) k.disableInteractive(true);
    this.zarf?.tiklanmaz();
    this.not?.disableInteractive(true);
    this.kitap?.kilitle(true);
    this.kaselik.kilitle(true);
  }

  /**
   * Yalnızca dev (?dev&portreler): solda 24 portre (her biri kendi mizacının taban yüzüyle), sağda her mizacın
   * beş ifadesi (satır başına bir kişi). Görsel denetim için (G40); oyunun üstünü tümüyle örter.
   */
  private portreler(): void {
    const ifadeler: Ifade[] = ['notr', 'gergin', 'kizgin', 'mahcup', 'sevincli'];
    const s = 0.5;
    const w = PORTRE_EKRAN.w * s;
    const h = PORTRE_EKRAN.h * s;
    const D = 7000;
    this.add.rectangle(0, 0, 1920, 1080, 0x2b2926).setOrigin(0).setDepth(D);
    const yazi = (x: number, y: number, m: string): void => {
      this.add.text(x, y, m, { fontFamily: FONT, fontSize: '20px', color: '#bdb7aa' }).setDepth(D + 2);
    };
    for (let i = 0; i < 24; i++) {
      const tohum = this.tohum * 31 + i * 7919;
      const m = mizacSec(tohum);
      const x = 16 + (i % 6) * (w + 6);
      const y = 30 + Math.floor(i / 6) * (h + 26);
      const p = new Portre(this, tohum, x, y, m);
      p.img.setScale(PX * s).setDepth(D + 1);
      p.galeriKipi();
      yazi(x + 4, y + h + 2, m);
    }
    const x0 = 1020;
    ifadeler.forEach((f, j) => yazi(x0 + j * (w + 4) + 4, 4, f));
    MIZACLAR.forEach((m, r) => {
      const tohum = this.tohum * 31 + (30 + r) * 7919;
      const y = 30 + r * (h + 12);
      yazi(x0 - 96, y + h / 2 - 10, m);
      ifadeler.forEach((f, j) => {
        const p = new Portre(this, tohum, x0 + j * (w + 4), y, m);
        p.img.setScale(PX * s).setDepth(D + 1);
        p.galeriKipi();
        p.setIfade(f);
      });
    });
  }

  private gunSonu(): void {
    const data: DayEndData = {
      gun: this.gun,
      tohum: this.tohum,
      paraOnce: this.para,
      kararlar: this.oturum.kararlar.slice(),
      dosyalar: this.oturum.dosyalar.map((b) => ({ id: b.id, adres: b.adres })),
      kayitlar: this.kayitlar,
      oncu: this.oncu,
      ev: this.ev,
    };
    goTo(this, SCENES.DayEnd, data);
  }

  pauseGame(): void {
    // "Yeniden Başla" bu günü aynı tohum, para ve önceki günlerin kayıtlarıyla baştan kurar.
    const yeniden: GameData = { gun: this.gun, tohum: this.tohum, para: this.para, kayitlar: this.kayitlar, ev: this.ev, ipucuSifirla: true };
    this.scene.launch(SCENES.Pause, { from: SCENES.Game, yeniden });
    this.scene.pause();
  }
}
