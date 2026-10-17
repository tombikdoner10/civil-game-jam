// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import { num, PAL } from '../desk/palette';
import { PX, rastgele, snap, Tuval } from '../desk/pixel';
import { hazirGostergesi, masaCiz, pikselDugme, pikselDugmeEni } from '../desk/props';
import { DAMGA_ADI, DAMGA_RENK } from '../desk/Kaselik';
import type { Damga } from '../game/building';
import { SON_GUN } from '../game/days';
import { MUFETTIS_CEZA_SATIR, MUFETTIS_GELMEDI, MUFETTIS_RAPOR, MUFETTIS_ZARF_OZET, ZARF_ETIKET } from '../game/diyalog';
import { KISA_YOL_ACIKLAMA, KISA_YOL_DEVAM, KISA_YOL_DUGME, kucukDepremSatiri } from '../game/gazete';
import { alimDurumu, EV_KADEME, EV_KALEMLER, evHarcanan, evKademe, satinAl, siradakiFiyat, yeniEv, zarfToplami, type EvHazirlik, type EvKalem } from '../game/ev';
import { EV_ALIM_ETIKET, EV_ALT, EV_BASLIK, EV_IPUCU, EV_KADEME_METIN, EV_KALEM_METIN, EV_PARAN, EV_TAMAM_METIN, evAlindi, evHarcananSatiri, evKademeBasligi } from '../game/ev-metin';
import { kisaYolKayitlari } from '../game/ornek';
import { birikmisPara, gunHesabi, kusurEtiketi, type GunKaydi, type Karar, type SarsintiKaydi } from '../game/session';
import { TUNING } from '../game/tuning';
import { floatText, pulse } from '../systems/fx';
import { tamponBaslat } from '../systems/girisTamponu';
import { fadeIn, goTo } from '../systems/transition';
import type { GameData } from './GameScene';
import { SCENES } from './keys';
import type { DepremData } from './QuakeScene';

export interface DayEndData {
  gun: number;
  tohum: number;
  /** Gün başındaki birikmiş para. */
  paraOnce: number;
  kararlar: Karar[];
  /** Günün bütün dosyaları (damgalanmayanlar "işlenmedi" görünür). */
  dosyalar: { id: string; adres: string }[];
  /** Önceki günlerin kayıtları. */
  kayitlar: GunKaydi[];
  /** Günün sonundaki öncü sarsıntı (varsa): raporda bir satır, kayıtta sokağın hasarı. */
  oncu?: SarsintiKaydi;
  /** Kendi evinin hazırlığı (G42; gün başındaki durum). */
  ev?: EvHazirlik;
}

/** Rapor kâğıdı (ekran pikseli). G42: sola kaydı, sağında "Evin" kâğıdı. */
const KAGIT = { x: 40, y: 40, w: 1344, h: 1000 };
/** "Evin" kâğıdı (G42): raporun sağında, aynı yükseklikte; kenar boşlukları raporunkiyle aynı (40 px). */
const EV = { x: 1408, y: 40, w: 472, h: 1000 };
/**
 * Evin kâğıdındaki kalem kartları: ilk kartın üstü (kâğıdın üstünden), kart yüksekliği, aralık ve yan boşluk. G43:
 * sağ üstte kademe ilerlemesi (kutu kenarı, kutular arası boşluk).
 */
const EV_KART = { ust: 152, h: 212, ara: 14, kenar: 24, kutu: 20, kutuAra: 8 };
/** Para yetmeyen kalem kartının saydamlığı. */
const EV_SOLUK = 0.45;
const SATIR_H = 52;
/**
 * G57 müfettiş satırları: satır aralığı ve yazı boyu. Müfettiş cezası satırı varsa para tablosu satır aralığı PARA_SIKI.
 * G58: rapor gövdesi içeriğe göre yerleşir; düğmelerin üstüne sığmazsa sırasıyla bilgi satırlarının aralığı daralır,
 * dosya tablosunun satır aralığı SATIR_EN_AZ'a iner, para tablosunun satır aralığı PARA_EN_AZ'a iner, en son bilgi
 * satırlarının yazısı BILGI_EN_AZ'a kadar küçülür.
 */
const MUF = { ara: 40, boy: 30 };
const SATIR_EN_AZ = 40;
const PARA_ARA = 48;
const PARA_SIKI = 40;
const PARA_EN_AZ = 36;
/** Bilgi satırlarının (küçük deprem, müfettiş, kısa yol çağrısı) en küçük yazı boyu; sığmayan satır iki satıra kayar. */
const BILGI_EN_AZ = 22;
/**
 * Hesap bloğunun son satırlarının merkezi düğme merkezinin en az bu kadar üstünde (G58): sağda "Birikmiş" (44 px)
 * gün 1'deki odak çerçevesinin üstünde, solda zarf satırı (34 px) düğmenin üstünde kalır.
 */
const HESAP_ALT = { para: 68, sol: 52 };
/**
 * Sütunların sol kenarı (kâğıdın solundan). G55: sıra numarası (NO) sütunu kalktı; bina adı sokak boyunca tek
 * numara taşıyor. BİNA ilk sütun, kazanılan yer BULDUĞUN KUSURLAR'a gitti.
 */
const SUTUN = { bina: 40, damga: 336, dogru: 576, kusur: 816, sonuc: KAGIT.w - 40 };

const para = (n: number): string => `${n < 0 ? '−' : ''}${Math.abs(n)} TL`;

const SONRAKI = 'SONRAKİ GÜN';
/** G51: günün toplamı birikmiş parayı eksiye düşürecekse birikmiş 0'da kalır; raporda küçük not. */
const CEZA_ASTI = 'Ceza maaşı aştı';
/**
 * Gün 1'deki iki düğme (G25): aynı genişlik ve yazı boyu (kısa yol metni 44 px'te kâğıda sığmıyor), aralarında boşluk.
 * İkisinin toplamı kâğıdın iç genişliğine (KAGIT.w − 2·40) sığar.
 */
const IKILI = { boyut: 36, ara: 48 };

/**
 * Giriş koruması (ms, sahne açılışından): rapor açılırken basılı kalan ya da çift basılan Enter geçmesin. Önceki
 * sahnenin kararması (~220 ms) ile birlikte ilk Enter'dan ~0,5 sn sonra ikinci Enter çalışır (G23b). Koruma sürerken
 * birincil düğme soldan sağa dolar, bitince bir kez parlar ("hazır"). Koruma sürerken basılan (tekrar olmayan) Enter
 * beklemeye alınır ve koruma bitince bir kez işlenir (G26).
 */
const GIRIS_KORUMA_MS = 300;

/** Evin kâğıdındaki bir kalem kartı (G42). */
interface EvKarti {
  kalem: EvKalem;
  kap: Phaser.GameObjects.Container;
  /** Kartın içi (para yetmeyince soluk; dıştaki kap açılışta belirir). */
  ic: Phaser.GameObjects.Container;
  zemin: Phaser.GameObjects.Rectangle;
  etiket: Phaser.GameObjects.Text;
  cip: Phaser.GameObjects.Rectangle;
  /** G43: sıradaki kademenin adı ve açıklaması, fiyatı, ilerleme kutuları. */
  kademeAd: Phaser.GameObjects.Text;
  kademeAciklama: Phaser.GameObjects.Text;
  /** G45: alınan son kademenin adı ("Alındı: …"; hiç alınmadıysa boş). */
  alindi: Phaser.GameObjects.Text;
  fiyat: Phaser.GameObjects.Text;
  ilerleme: Phaser.GameObjects.Rectangle[];
}

/**
 * Gün sonu ekranı (Papers, Please'in gün sonu özeti gibi): masada bir rapor kâğıdı. Her dosya için bina,
 * verdiğin damga, doğru damga, inceleme modunda bulduğun kusurlar ve sonuç; altta maaş, ceza, günün
 * toplamı ve birikmiş para (yer tutucu değerler, TUNING.para). "Sonraki gün" (Enter/Space) bir sonraki güne,
 * son günden sonra "Gece" ile büyük depreme geçer (G5). Gün 1'de Enter/Space kısa yol "Depremi şimdi yaşa"
 * (G21b); "Sonraki gün" N ya da tıklama.
 */
export class DayEndScene extends Phaser.Scene {
  private veri!: DayEndData;
  private hazir = false;
  private gecildi = false;
  /** Birikmiş para (gün sonu hesabından sonra; G42 harcamalarıyla canlı düşer). */
  private para = 0;
  private ev: EvHazirlik = yeniEv();
  /** Bugüne kadar kabul edilen zarfların toplamı (G42: zarf parasıyla alınan kalem). */
  private zarfToplam = 0;
  private birikmisYazi?: Phaser.GameObjects.Text;
  private evParaYazi?: Phaser.GameObjects.Text;
  private evHarcananYazi?: Phaser.GameObjects.Text;
  private evKartlar: EvKarti[] = [];
  /** Yazı boyuna göre tek satır yüksekliği (G58). */
  private tekYuk = new Map<number, number>();

  constructor() {
    super(SCENES.DayEnd);
  }

  init(data: DayEndData): void {
    this.veri = data;
    this.hazir = false;
    this.gecildi = false;
    this.ev = data.ev ?? yeniEv();
    this.zarfToplam = zarfToplami(data.kayitlar, data.kararlar);
    this.evKartlar = [];
    this.birikmisYazi = undefined;
    this.evParaYazi = undefined;
    this.evHarcananYazi = undefined;
  }

  create(): void {
    fadeIn(this);
    this.cameras.main.setRoundPixels(true);
    const v = this.veri;
    const hesap = gunHesabi(v.kararlar, v.dosyalar.length);
    // Birikmiş para 0'ın altına inmez (G51): eksiye düşecekse 0 ve raporda "Ceza maaşı aştı".
    const hamPara = v.paraOnce + hesap.toplam;
    const yeniPara = birikmisPara(v.paraOnce, hesap);
    this.para = yeniPara;

    masaCiz(this, 0);
    this.kagitCiz();
    const L = KAGIT.x;
    const T = KAGIT.y;
    const yaz = (x: number, y: number, t: string, size = 32, renk: string = PAL.murekkep, ox = 0): Phaser.GameObjects.Text =>
      this.add.text(snap(x), snap(y), t, { fontFamily: FONT, fontSize: `${size}px`, color: renk }).setOrigin(ox, 0.5);

    // Başlık
    // Gün sayacı ("1/5") yok (G11): deprem önceden bilinmez, kaçıncı günde olacağı ima edilmesin.
    yaz(L + 40, T + 44, `GÜN ${v.gun} · GÜN SONU`, 64, PAL.kremAcik);
    yaz(L + 40, T + 124, 'Günlük denetim raporu', 30, PAL.murekkepSoluk);

    // G57 müfettiş: yakalanan her zarf için kırmızı satır (dosya sırasıyla); zarf alınıp yanlış damgalanan dosya
    // olduğu hâlde yakalanan yoksa soluk satır.
    const kararSira = new Map(v.kararlar.map((k) => [k.dosyaId, k]));
    const mufSatirlar: [string, string][] = v.dosyalar
      .filter((d) => kararSira.get(d.id)?.zarf?.yakalandi)
      .map((d) => [MUFETTIS_RAPOR(d.adres, TUNING.mufettis.ceza), PAL.damgaBosalt]);
    if (mufSatirlar.length === 0 && v.kararlar.some((k) => k.zarf?.kabul && !k.dogru)) mufSatirlar.push([MUFETTIS_GELMEDI, PAL.murekkepSoluk]);
    const kisaVarOn = v.gun === 1 && v.gun < SON_GUN;
    const m = mufSatirlar.length;
    const n = v.dosyalar.length;
    const bas = T + 180;
    const by = T + KAGIT.h - 64;

    // Tablonun altındaki bilgi satırları (G57b sırası): küçük deprem → müfettiş satırları → gün 1'de kısa yol açıklaması
    // ile devam satırı. ara: tek satırlıkken önceki satırın merkezinden (ilk satırda tablonun bitişinden) uzaklık.
    const bilgiler: { t: Phaser.GameObjects.Text; boy: number; ara: number }[] = [];
    const bilgiEkle = (metin: string, renk: string, boy: number, ara: number, gecikme: number): void => {
      const t = this.add.text(snap(L + 40), 0, metin, { fontFamily: FONT, fontSize: `${boy}px`, color: renk }).setOrigin(0, 0.5).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 160, delay: gecikme });
      bilgiler.push({ t, boy, ara });
    };
    const ILK_ARA = 20;
    if (v.oncu) {
      // Öncü sarsıntı satırı (yer tutucu metin). Tek sayı ve tek liste (G25): çatlayan her bina damgası ve içinde insan
      // olup olmadığıyla, dosya sırasıyla.
      const sira = new Map(v.dosyalar.map((d, i) => [d.id, i]));
      const adres = new Map(v.dosyalar.map((d) => [d.id, d.adres]));
      const catlayan = v.oncu.sonuclar
        .filter((s) => s.durum !== 'ayakta')
        .sort((a, b) => (sira.get(a.dosyaId) ?? 0) - (sira.get(b.dosyaId) ?? 0));
      const metin = kucukDepremSatiri(
        catlayan.map((s) => ({ ad: adres.get(s.dosyaId) ?? s.dosyaId, damga: kararSira.get(s.dosyaId)?.damga ?? 'guvenli', bos: s.bos })),
      );
      const kotu = catlayan.some((s) => !s.bos);
      bilgiEkle(metin, kotu ? PAL.damgaBosalt : PAL.damgaGuvenli, 34, ILK_ARA, 200 + n * 90 + 120);
    }
    // G57 müfettiş satırları: küçük deprem satırının altında (yoksa tablonun).
    mufSatirlar.forEach(([metin, renk], i) =>
      bilgiEkle(metin, renk, MUF.boy, i > 0 ? MUF.ara : v.oncu ? 56 : ILK_ARA, 200 + n * 90 + 240 + i * 90),
    );
    if (kisaVarOn) {
      // Kısa yol açıklaması (G57b: müfettiş satırlarının altında); altında oyunun sonra sürdüğünü söyleyen satır (G11).
      bilgiEkle(KISA_YOL_ACIKLAMA, PAL.damgaBosalt, 32, m > 0 ? MUF.ara + 4 : v.oncu ? 56 : ILK_ARA, 400);
      bilgiEkle(KISA_YOL_DEVAM, PAL.murekkepSoluk, 30, 44, 400);
    }

    // Para tablosunun satırları (yerleşimden önce: satır sayısı hesap bloğunun yüksekliğini belirler).
    const P = TUNING.para;
    const satirlar: [string, string, string][] = [
      [`Maaş (${hesap.dogru} × ${P.maas})`, `+${para(hesap.maas)}`, PAL.murekkep],
      [`Ceza (${hesap.yanlis} × ${P.ceza})`, hesap.ceza > 0 ? para(-hesap.ceza) : para(0), PAL.damgaBosalt],
    ];
    // G57: müfettiş cezası ayrı satır; el konan zarf "zarf dahil" toplamına girmez (hesap.zarf yalnızca yakalanmayanlar).
    if (hesap.mufettis > 0) satirlar.push([MUFETTIS_CEZA_SATIR, para(-hesap.mufettisCeza), PAL.damgaBosalt]);
    const toplamI = satirlar.length;
    const birikmisI = toplamI + 1;
    satirlar.push([hesap.zarf > 0 ? 'Günün toplamı (zarf dahil)' : 'Günün toplamı', para(hesap.toplam), PAL.murekkep], ['Birikmiş', para(yeniPara), PAL.murekkep]);
    // Sol sütunun satır aralığı (para tablosu sıkışınca o da sıkışır).
    const SA = 42;
    const solAra = (pa: number): number => Math.min(SA, pa + 2);

    // G58 yerleşim: hesap bloğu (para tablosu satır aralığı pa ile) en geç hesapEnGec'te başlarsa düğmelerin üstünde kalır.
    const hesapEnGec = (pa: number): number => {
      const sa = solAra(pa);
      const paraSon = 24 + (satirlar.length - 1) * pa + (pa < PARA_ARA ? 4 : 0);
      const solSon = 24 + sa * (hesap.islenmeyen > 0 ? 3 : 2) + 12 + (hesap.zarfTeklif > 0 ? sa : 0);
      return Math.min(by - HESAP_ALT.para - paraSon, by - HESAP_ALT.sol - solSon);
    };
    // Bilgi satırlarının merkezleri ve hesap bloğunun en erken başlangıcı (sh: dosya tablosu satır aralığı; f: bilgi
    // satırlarının aralığı, 1 eski aralıklar, 0 en sıkışık). Çok satırlı (kaymış) yazı fazla yüksekliği kadar yer açar.
    const bilgiYerles = (sh: number, f: number): { ys: number[]; ust: number } => {
      const y = bas + 24 + sh / 2 + 8 + n * sh;
      // Aralıklar piksel ızgarasına yukarı yuvarlanır (satırlar eşit aralıklı kalsın, en az aralığın altına inmesin).
      const sik = (eski: number, enAz: number): number => Math.ceil((enAz + f * Math.max(0, eski - enAz)) / PX) * PX;
      const ys: number[] = [];
      let c = y;
      let oncekiH = 0;
      let oncekiEk = 0;
      bilgiler.forEach((b, i) => {
        const h = b.t.height;
        const ek = (h - this.tekSatirYuk(parseInt(String(b.t.style.fontSize), 10))) / 2;
        c += i === 0 ? sik(b.ara + ek, -sh / 2 + 8 + h / 2) : sik(b.ara + oncekiEk + ek, (oncekiH + h) / 2 + 4);
        ys.push(c);
        oncekiH = h;
        oncekiEk = ek;
      });
      return { ys, ust: bilgiler.length > 0 ? c + sik(47 + oncekiEk, oncekiH / 2 + 22) : y + 24 };
    };
    const bilgiBoy = (kucult: number): void => {
      for (const b of bilgiler) this.bilgiBoyKur(b.t, Math.max(BILGI_EN_AZ, b.boy - kucult));
    };
    // Sığmazsa sırasıyla: bilgi aralığı, dosya tablosu, para tablosu, bilgi yazı boyu. Sonraki adıma geçildiyse önceki
    // adımların sıkışması sığdığı kadar geri açılır.
    let fAdim = 10;
    let satirH = SATIR_H;
    const paraVarsayilan = satirlar.length > 4 ? PARA_SIKI : PARA_ARA;
    let paraAra = paraVarsayilan;
    let kucult = 0;
    bilgiBoy(0);
    const sigar = (): boolean => bilgiYerles(satirH, fAdim / 10).ust <= hesapEnGec(paraAra);
    const gevset = (): void => {
      while (satirH < SATIR_H) {
        satirH += PX;
        if (!sigar()) {
          satirH -= PX;
          break;
        }
      }
      while (fAdim < 10) {
        fAdim++;
        if (!sigar()) {
          fAdim--;
          break;
        }
      }
    };
    while (!sigar() && fAdim > 0) fAdim--;
    while (!sigar() && satirH > SATIR_EN_AZ) satirH -= PX;
    if (satirH < SATIR_H) gevset();
    while (!sigar() && paraAra > PARA_EN_AZ) paraAra -= PX;
    if (paraAra < paraVarsayilan) gevset();
    while (!sigar() && kucult < 12) bilgiBoy((kucult += 2));
    if (kucult > 0) gevset();
    const yer = bilgiYerles(satirH, fAdim / 10);
    bilgiler.forEach((b, i) => b.t.setY(snap(yer.ys[i])));

    // Tablo başlığı
    const basliklar: [number, string, number][] = [
      [SUTUN.bina, 'BİNA', 0],
      [SUTUN.damga, 'DAMGAN', 0],
      [SUTUN.dogru, 'DOĞRUSU', 0],
      [SUTUN.kusur, 'BULDUĞUN KUSURLAR', 0],
      [SUTUN.sonuc, 'SONUÇ', 1],
    ];
    for (const [x, t, ox] of basliklar) yaz(L + x, bas, t, 28, PAL.etiket, ox);
    this.add.rectangle(L + 32, bas + 24, KAGIT.w - 64, PX, num(PAL.murekkepSoluk)).setOrigin(0);

    // Satırlar
    const kararlar = new Map(v.kararlar.map((k) => [k.dosyaId, k]));
    let y = bas + 24 + satirH / 2 + 8;
    v.dosyalar.forEach((d, i) => {
      const k = kararlar.get(d.id);
      const ogeler: Phaser.GameObjects.GameObject[] = [];
      ogeler.push(this.sigdir(yaz(L + SUTUN.bina, y, d.adres, 32), SUTUN.damga - SUTUN.bina - 16));
      if (k) {
        ogeler.push(...this.damgaCip(L + SUTUN.damga, y, k.damga));
        ogeler.push(...this.damgaCip(L + SUTUN.dogru, y, k.dogruDamga));
        // Fişle aynı etiket (G35): kaçak katta fark "(+n)" da görünür.
        const bulunan = k.bulunan.map((id) => kusurEtiketi(k, id)).join(', ') || '—';
        // Zarf alınan dosya (G22): sonuç sütununun solunda kırmızı işaret; kusur yazısı ona yer bırakır.
        const zarf = !!k.zarf?.kabul;
        ogeler.push(this.sigdir(yaz(L + SUTUN.kusur, y, bulunan, 30), SUTUN.sonuc - SUTUN.kusur - (zarf ? 250 : 150)));
        if (zarf) ogeler.push(yaz(L + SUTUN.sonuc - 128, y, ZARF_ETIKET, 30, PAL.damgaBosalt, 1));
        ogeler.push(yaz(L + SUTUN.sonuc, y, k.dogru ? 'DOĞRU' : 'YANLIŞ', 32, k.dogru ? PAL.damgaGuvenli : PAL.damgaBosalt, 1));
      } else {
        ogeler.push(yaz(L + SUTUN.damga, y, '—', 32, PAL.murekkepSoluk));
        ogeler.push(yaz(L + SUTUN.dogru, y, '—', 32, PAL.murekkepSoluk));
        ogeler.push(yaz(L + SUTUN.kusur, y, '—', 30, PAL.murekkepSoluk));
        ogeler.push(yaz(L + SUTUN.sonuc, y, 'İŞLENMEDİ', 32, PAL.murekkepSoluk, 1));
      }
      // Satır arası noktalı çizgi
      for (let x = L + 32; x < L + KAGIT.w - 32; x += 12) ogeler.push(this.add.rectangle(x, y + satirH / 2, 4, 4, num(PAL.kremKoyu)).setOrigin(0));
      for (const o of ogeler) {
        (o as unknown as Phaser.GameObjects.Components.Alpha).setAlpha(0);
        this.tweens.add({ targets: o, alpha: 1, duration: 160, delay: 200 + i * 90 });
      }
      y += satirH;
    });

    // Hesap: bilgi satırlarının altında, düğmelerin üstüne sığdığı sürece eskisi gibi T + 680'de başlar (G11, G58).
    const hy = Math.max(yer.ust, Math.min(T + 680, hesapEnGec(paraAra)));
    this.add.rectangle(L + 32, hy - 16, KAGIT.w - 64, PX, num(PAL.murekkepSoluk)).setOrigin(0);
    const sol = L + 40;
    // Sayılar toplanınca dosya sayısını verir (G5b): Doğru + Yanlış + İşlenmedi = dosya. İADE ayrı bir sayı değil;
    // doğru ya da yanlış içinde sayılır ve satırında "içinde İADE" olarak gösterilir (binalar denetlenmeden kaldı).
    const iadeDogru = v.kararlar.filter((k) => k.damga === 'iade' && k.dogru).length;
    const iadeYanlis = v.kararlar.filter((k) => k.damga === 'iade' && !k.dogru).length;
    const icinde = (n: number): string => (n > 0 ? `  (içinde İADE: ${n})` : '');
    const sa = solAra(paraAra);
    yaz(sol, hy + 24, `Doğru: ${hesap.dogru}${icinde(iadeDogru)}`, 34, PAL.damgaGuvenli);
    yaz(sol, hy + 24 + sa, `Yanlış: ${hesap.yanlis}${icinde(iadeYanlis)}`, 34, PAL.damgaBosalt);
    let sy = hy + 24 + sa * 2;
    if (hesap.islenmeyen > 0) {
      yaz(sol, sy, `İşlenmedi: ${hesap.islenmeyen}`, 34, PAL.murekkepSoluk);
      sy += sa;
    }
    this.add.rectangle(sol, sy - 12, 240, PX, num(PAL.murekkepSoluk)).setOrigin(0);
    yaz(sol, sy + 12, `Toplam: ${v.dosyalar.length} dosya`, 34, PAL.murekkep);
    sy += sa + 12;
    // Zarf (G17): kabul edilenler günün toplamına eklenir; ayrı satır.
    if (hesap.zarfTeklif > 0) {
      const ret = hesap.zarfTeklif - hesap.zarfKabul;
      // G57b: el konan zarf varsa özet ona göre (hepsine ya da bir kısmına el konuldu).
      const metin =
        hesap.mufettis > 0
          ? MUFETTIS_ZARF_OZET(para(hesap.zarf), hesap.zarfKabul, hesap.mufettis)
          : hesap.zarfKabul > 0
            ? `Zarf: +${para(hesap.zarf)} (${hesap.zarfKabul} kabul${ret > 0 ? `, ${ret} ret` : ''})`
            : `Zarf: ${ret} ret`;
      yaz(sol, sy, metin, 34, hesap.zarfKabul > 0 ? PAL.damgaBosalt : PAL.murekkepSoluk);
    }
    const ad = L + 640;
    const deger = L + KAGIT.w - 40;
    const etiketler: Phaser.GameObjects.Text[] = [];
    const degerler: Phaser.GameObjects.Text[] = [];
    satirlar.forEach(([a, b, renk], i) => {
      // Sıkışık tabloda toplam çizgisinin altındaki satırlar biraz aşağıda (çizgi üstteki yazıya değmesin).
      const yy = hy + 24 + i * paraAra + (paraAra < PARA_ARA && i >= toplamI ? 4 : 0);
      if (i === toplamI) this.add.rectangle(ad, yy - (paraAra < PARA_ARA ? 22 : 26), deger - ad, PX, num(PAL.murekkepSoluk)).setOrigin(0);
      etiketler.push(yaz(ad, yy, a, 36, i >= toplamI ? PAL.murekkep : PAL.etiket));
      const t = yaz(deger, yy, b, i === birikmisI ? 44 : 36, renk, 1);
      degerler.push(t);
      if (i === birikmisI) this.birikmisYazi = t;
    });
    // G51: "Ceza maaşı aştı" günün toplamı satırında, değerin solunda; etikete değecekse alttaki "Birikmiş" satırında.
    if (hamPara < 0) {
      for (const i of [toplamI, birikmisI]) {
        const not = yaz(degerler[i].x - degerler[i].width - 24, degerler[i].y, CEZA_ASTI, 28, PAL.damgaBosalt, 1);
        if (not.x - not.width >= etiketler[i].x + etiketler[i].width + 24 || i === birikmisI) break;
        not.destroy();
      }
    }

    // Kendi evinin hazırlığı (G42): raporun sağındaki kâğıt; 1/2/3 ya da tıklama. Enter satın alma yapmaz.
    this.evKagidi();

    // Sonraki gün düğmesi; gün 1'de yanında kısa yol (G21, jüri yolu; soru biçimli düğme). Gün 1'de kısa yol
    // birincil (G21b, lider kararı): Enter/Space ve D onu seçer, düğmesi çerçeveli ve nabız gibi atar; "Sonraki gün"
    // ikincil (gri, tıklama ya da N). Gün 2-5'te Enter/Space yine "Sonraki gün".
    const son = v.gun >= SON_GUN;
    const kisaVar = v.gun === 1 && !son;
    const kb = this.input.keyboard;
    const tus = (): void => this.devam();
    const kisaTus = (): void => this.devam(true);
    // Enter (G26): giriş koruması sürerken (rapor kararmadan açılırken) basılan Enter kaybolmaz, koruma bitince bir
    // kez işlenir. Basılı tutulan tuşun tekrarı (önceki sahneden kalan) beklemeye alınmaz. Space, D ve N eskisi gibi.
    let bekleyen: (() => void) | undefined;
    const enterIle =
      (is: () => void) =>
      (e?: KeyboardEvent): void => {
        if (this.hazir) is();
        else if (!e?.repeat) bekleyen = is;
      };
    const enterTus = enterIle(tus);
    const enterKisa = enterIle(kisaTus);
    const nTus = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.N || e.code === 'KeyN' || e.key === 'n' || e.key === 'N') tus();
    };
    // Gün 1'de iki düğme aynı genişlikte ve aynı yazı boyunda (G25): kâğıdın ortasına göre simetrik.
    const ikili = kisaVar ? { boyut: IKILI.boyut, en: pikselDugmeEni(this, [[SONRAKI, 'N', IKILI.boyut], [KISA_YOL_DUGME, 'Enter', IKILI.boyut]]) } : undefined;
    const dugme = pikselDugme(
      this,
      L + KAGIT.w / 2,
      by,
      son ? 'GECE' : SONRAKI,
      kisaVar ? 'N' : 'Enter',
      tus,
      kisaVar ? { govde: PAL.cerceveAcik, acik: '#7a7466', koyu: PAL.cerceve } : undefined,
      ikili,
    );
    this.tweens.add({ targets: dugme, alpha: 1, duration: 120 });
    let birincil = dugme;
    if (kisaVar) {
      const kd = pikselDugme(
        this,
        L + KAGIT.w / 2,
        by,
        KISA_YOL_DUGME,
        'Enter',
        kisaTus,
        { govde: PAL.damgaBosalt, acik: '#c4544a', koyu: '#6e2a24' },
        ikili,
      );
      // Aralarında IKILI.ara; ikisinin toplamı kâğıdın ortasında (eşit genişlik: ikisi de ortadan eşit uzakta).
      const yari = (dugme.width + IKILI.ara) / 2;
      dugme.setX(snap(L + KAGIT.w / 2 - yari));
      const kx = snap(L + KAGIT.w / 2 + yari);
      kd.setX(kx);
      this.tweens.add({ targets: kd, alpha: 1, duration: 120 });
      birincil = kd;
      // Odak çerçevesi: birincil düğmenin çevresinde, nabız gibi.
      const odak = this.add
        .rectangle(snap(kx), snap(by), snap(kd.width + 24), snap(kd.height + 24))
        .setStrokeStyle(PX, num(PAL.damgaBosalt))
        .setAlpha(0);
      this.tweens.add({ targets: odak, alpha: { from: 1, to: 0.25 }, duration: 600, delay: 600, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [3] });
      // Açıklama satırları bilgi satırlarıyla birlikte yukarıda yerleşti (G58).
      kb?.on('keydown-ENTER', enterKisa);
      kb?.on('keydown-SPACE', kisaTus);
      kb?.on('keydown-D', kisaTus);
      // "Sonraki gün": N (küçük ya da büyük harf, Shift gerekmez; G23b). Tuş kodu yoksa event.key/code'a da bakılır.
      kb?.on('keydown', nTus);
    } else {
      kb?.on('keydown-ENTER', enterTus);
      kb?.on('keydown-SPACE', tus);
    }
    // G42: 1 / 2 / 3 (üst sıra ya da sayı tuşları) evin kalemlerini alır.
    const evTus = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
      const i = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
      const j = ['Numpad1', 'Numpad2', 'Numpad3'].indexOf(e.code);
      const k = i >= 0 ? i : j >= 0 ? j : ['1', '2', '3'].indexOf(e.key);
      if (k >= 0) this.evAl(EV_KALEMLER[k]);
    };
    kb?.on('keydown', evTus);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const ad of ['keydown-ENTER', 'keydown-SPACE', 'keydown-D']) {
        kb?.off(ad, tus);
        kb?.off(ad, kisaTus);
      }
      kb?.off('keydown-ENTER', enterTus);
      kb?.off('keydown-ENTER', enterKisa);
      kb?.off('keydown', nTus);
      kb?.off('keydown', evTus);
      // Gün sonu jingle'ı depreme ya da sonraki günün masasına taşmasın (G32).
      sfx.jingleSustur();
    });
    // Rapor açılırken yanlışlıkla geçilmesin (giriş koruması); birincil düğmede "hazır" göstergesi.
    hazirGostergesi(this, birincil, GIRIS_KORUMA_MS);
    this.time.delayedCall(GIRIS_KORUMA_MS, () => {
      this.hazir = true;
      bekleyen?.();
    });
    sfx.play('kagitKay');
    // Gün sonu jingle'ı: yanlış ya da işlenmeyen dosya yoksa iyi gün, varsa kötü gün.
    const iyi = hesap.yanlis === 0 && hesap.islenmeyen === 0;
    this.time.delayedCall(350, () => sfx.play(iyi ? 'gunIyi' : 'gunKotu'));
  }

  private devam(kisa = false): void {
    if (!this.hazir || this.gecildi) return;
    this.gecildi = true;
    sfx.play('confirm');
    const v = this.veri;
    // G42: evine harcanan düşülmüş para ve evin hazırlığı sonraki güne, depreme ve sonuca taşınır.
    const yeniPara = this.para;
    const ev = this.ev;
    const kayit: GunKaydi = { gun: v.gun, kararlar: v.kararlar };
    if (v.oncu) kayit.oncu = v.oncu;
    const kayitlar: GunKaydi[] = [...v.kayitlar, kayit];
    if (kisa) {
      // Kısa yol (G21): oyuncunun binaları önde, ardından gün 2-5'i temsil eden örnek binalar; kısa deprem.
      // Oyuncunun kayıtları ayrı taşınır (sonuç ekranı, "Gün 2'den devam"); örnekler kayıtlara karışmaz.
      const data: DepremData = {
        tohum: v.tohum,
        para: yeniPara,
        kayitlar: [...kayitlar, ...kisaYolKayitlari(v.tohum)],
        kisa: { gercek: kayitlar, juri: v.kararlar.map((k) => k.dosyaId) },
        ev,
      };
      // Kararma sırasında gelen yeni basış kaybolmasın (G41): depremde hızlandırma olarak uygulanır.
      tamponBaslat();
      goTo(this, SCENES.Quake, data, 600);
      return;
    }
    if (v.gun >= SON_GUN) {
      // Son gün: gece ve büyük deprem (gece geçişi QuakeScene'de; buradan daha yavaş kararır).
      const data: DepremData = { tohum: v.tohum, para: yeniPara, kayitlar, ev };
      tamponBaslat();
      goTo(this, SCENES.Quake, data, 600);
      return;
    }
    const data: GameData = { gun: v.gun + 1, tohum: v.tohum, para: yeniPara, kayitlar, ev };
    goTo(this, SCENES.Game, data);
  }

  /**
   * "Evin" kâğıdı (G42; G43 kademeli): başlık, üç kalem kartı (tuş, ad, kademe ilerlemesi, sıradaki kademenin adı ve
   * açıklaması, fiyatı, durum), altta paran ve evine harcanan. Kart tıklanınca ya da 1/2/3 ile sıradaki kademe alınır;
   * para yetmeyen kart soluk, tamamlanan kart yeşil.
   */
  private evKagidi(): void {
    const X = EV.x;
    const Y = EV.y;
    const W = EV.w / PX;
    const H = EV.h / PX;
    const rnd = rastgele(this.veri.gun * 97 + 3);
    const t = new Tuval(this, W + 2, H + 3, 'evKagit');
    t.rect(2, 3, W, H, '#00000066');
    t.rect(0, 0, W, H, PAL.krem);
    t.benek(0, 0, W, H, PAL.kremKoyu, 0.035, rnd);
    t.frame(0, 0, W, H, PAL.kremKoyu);
    t.frame(2, 2, W - 4, H - 4, PAL.kremKoyu);
    t.dither(1, H - 2, W - 2, 1, PAL.kremKoyu);
    // Başlık şeridi (dosya kapağı mavisi; rapordan ayrı bir kâğıt olduğu belli olsun).
    t.rect(3, 3, W - 6, 22, PAL.mavisi);
    for (let x = 3; x < W - 3; x += 2) {
      t.px(x, 3, '#2f3b5c');
      t.px(x + 1, 24, '#2f3b5c');
    }
    t.goruntu(X, Y).setOrigin(0);
    const yaz = (x: number, y: number, s: string, size: number, renk: string, ox = 0): Phaser.GameObjects.Text =>
      this.add.text(snap(x), snap(y), s, { fontFamily: FONT, fontSize: `${size}px`, color: renk }).setOrigin(ox, 0.5);
    this.sigdir(yaz(X + 32, Y + 44, EV_BASLIK, 56, PAL.kremAcik), EV.w - 64);
    this.sigdir(yaz(X + 32, Y + 124, EV_ALT, 28, PAL.murekkepSoluk), EV.w - 64);

    const kx = X + EV_KART.kenar;
    const kw = EV.w - EV_KART.kenar * 2;
    const kh = EV_KART.h;
    EV_KALEMLER.forEach((kalem, i) => {
      const ky = Y + EV_KART.ust + i * (kh + EV_KART.ara);
      const kap = this.add.container(snap(kx), snap(ky));
      const ic = this.add.container(0, 0);
      const cerceve = this.add.rectangle(0, 0, kw, kh, num(PAL.kremKoyu)).setOrigin(0);
      const zemin = this.add.rectangle(PX, PX, kw - PX * 2, kh - PX * 2, num(PAL.kremAcik)).setOrigin(0);
      const m = EV_KALEM_METIN[kalem];
      // Tuş kutusu (1 / 2 / 3)
      const tusKutu = this.add.rectangle(16, 16, 44, 44, num(PAL.cerceve)).setOrigin(0);
      const tusYazi = this.add.text(38, 38, String(i + 1), { fontFamily: FONT, fontSize: '30px', color: PAL.kremAcik }).setOrigin(0.5);
      // G43: sağ üstte kademe ilerlemesi (dolu kutu: alınan kademe).
      const K = EV_KART.kutu;
      const ilerX = kw - 16 - EV_KADEME * K - (EV_KADEME - 1) * EV_KART.kutuAra;
      const ilerleme: Phaser.GameObjects.Rectangle[] = [];
      const kutular: Phaser.GameObjects.Rectangle[] = [];
      for (let j = 0; j < EV_KADEME; j++) {
        const x = ilerX + j * (K + EV_KART.kutuAra);
        kutular.push(this.add.rectangle(x - PX, 28 - PX, K + PX * 2, K + PX * 2, num(PAL.murekkepSoluk)).setOrigin(0));
        const dolgu = this.add.rectangle(x, 28, K, K, num(PAL.kremKoyu)).setOrigin(0);
        kutular.push(dolgu);
        ilerleme.push(dolgu);
      }
      const ad = this.sigdir(this.add.text(76, 38, m.ad, { fontFamily: FONT, fontSize: '32px', color: PAL.murekkep }).setOrigin(0, 0.5), ilerX - 16 - 76);
      // Sıradaki kademe: adı (güçlendirmede taksit) ve kısa açıklaması; evYenile doldurur.
      const kademeAd = this.add.text(16, 84, '', { fontFamily: FONT, fontSize: '28px', color: PAL.murekkep }).setOrigin(0, 0.5);
      const kademeAciklama = this.add.text(16, 116, '', { fontFamily: FONT, fontSize: '24px', color: PAL.murekkepSoluk }).setOrigin(0, 0.5);
      // G45: alınan son kademe (ör. "Alındı: Su ve fener"); kart ilerlemesi kutularla birlikte okunur.
      const alindi = this.add.text(16, 146, '', { fontFamily: FONT, fontSize: '24px', color: PAL.damgaGuvenli }).setOrigin(0, 0.5);
      const fiyat = this.add.text(16, kh - 30, '', { fontFamily: FONT, fontSize: '36px', color: PAL.murekkep }).setOrigin(0, 0.5);
      const cip = this.add.rectangle(kw - 16, kh - 30, 10, 44, num(PAL.damgaGuvenli)).setOrigin(1, 0.5);
      const etiket = this.add.text(kw - 28, kh - 30, '', { fontFamily: FONT, fontSize: '28px', color: '#f0e6cc' }).setOrigin(1, 0.5);
      ic.add([cerceve, zemin, tusKutu, tusYazi, ...kutular, ad, kademeAd, kademeAciklama, alindi, fiyat, cip, etiket]);
      kap.add(ic);
      kap.setSize(kw, kh);
      // Container'ın etkileşim alanı yerel noktaya displayOrigin (yarı boyut) eklenerek sınanır; kart sol üstten
      // kurulduğu için alan yarım boyut kaydırılır (kartın tamamı tıklanır).
      kap.setInteractive(new Phaser.Geom.Rectangle(kw / 2, kh / 2, kw, kh), Phaser.Geom.Rectangle.Contains);
      kap.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
        if (alimDurumu(this.ev, kalem, this.para) !== 'alinabilir') return;
        zemin.setFillStyle(num(PAL.kirliBeyaz));
        this.input.setDefaultCursor('pointer');
      });
      kap.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
        this.input.setDefaultCursor('default');
        this.evYenile();
      });
      kap.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.evAl(kalem));
      kap.setAlpha(0);
      this.tweens.add({ targets: kap, alpha: 1, duration: 160, delay: 300 + i * 90 });
      this.evKartlar.push({ kalem, kap, ic, zemin, etiket, cip, kademeAd, kademeAciklama, alindi, fiyat, ilerleme });
    });

    const py = Y + EV_KART.ust + 3 * (kh + EV_KART.ara) + 24;
    this.add.rectangle(snap(X + 24), snap(py - 24), EV.w - 48, PX, num(PAL.murekkepSoluk)).setOrigin(0);
    yaz(X + 32, py + 20, EV_PARAN, 32, PAL.etiket);
    this.evParaYazi = yaz(X + EV.w - 32, py + 20, '', 44, PAL.murekkep, 1);
    this.evHarcananYazi = yaz(X + 32, py + 72, '', 26, PAL.murekkepSoluk);
    this.sigdir(yaz(X + 32, py + 116, EV_IPUCU, 24, PAL.murekkepSoluk), EV.w - 64);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.setDefaultCursor('default'));
    this.evYenile();
  }

  /** Kartların durumunu, paran ve harcanan satırlarını ve rapordaki "Birikmiş"i güncelle. */
  private evYenile(): void {
    const kw = EV.w - EV_KART.kenar * 2;
    for (const k of this.evKartlar) {
      const d = alimDurumu(this.ev, k.kalem, this.para);
      const n = evKademe(this.ev, k.kalem);
      k.etiket.setText(EV_ALIM_ETIKET[d]);
      k.etiket.setColor(d === 'yetmiyor' ? PAL.murekkepSoluk : '#f0e6cc');
      k.cip.setVisible(d !== 'yetmiyor');
      k.cip.setFillStyle(num(d === 'tamam' ? PAL.damgaGuvenli : PAL.damgaGuclendir));
      k.cip.setSize(snap(k.etiket.width + 24), 44);
      k.zemin.setFillStyle(num(d === 'tamam' ? PAL.fisYesil : PAL.kremAcik));
      k.ic.setAlpha(d === 'yetmiyor' ? EV_SOLUK : 1);
      k.ilerleme.forEach((r, j) => r.setFillStyle(num(j < n ? PAL.damgaGuvenli : PAL.kremKoyu)));
      const sira = d === 'tamam' ? EV_TAMAM_METIN[k.kalem] : { ad: evKademeBasligi(k.kalem, n + 1), aciklama: EV_KADEME_METIN[k.kalem][n].aciklama };
      this.sigdirYaz(k.kademeAd, sira.ad, 28, kw - 32);
      this.sigdirYaz(k.kademeAciklama, sira.aciklama, 24, kw - 32);
      // G45: alınan son kademenin adı (tamamsa "TAMAM"); hiç alınmadıysa boş.
      this.sigdirYaz(k.alindi, evAlindi(k.kalem, n) ?? '', 24, kw - 32);
      const f = siradakiFiyat(this.ev, k.kalem);
      k.fiyat.setText(f === null ? '' : `${f} TL`);
    }
    const tl = para(this.para);
    this.evParaYazi?.setText(tl);
    this.evHarcananYazi?.setText(evHarcananSatiri(para(evHarcanan(this.ev))));
    this.birikmisYazi?.setText(tl);
  }

  /** Sıradaki kademeyi al (G42, G43): para düşer, kart ilerler (tamamsa yeşil); tamam ya da para yetmiyorsa kısa "olmaz" sesi. */
  private evAl(kalem: EvKalem): void {
    if (!this.hazir || this.gecildi) return;
    const kart = this.evKartlar.find((k) => k.kalem === kalem);
    const r = satinAl(this.ev, kalem, this.para, this.zarfToplam, this.veri.gun);
    if (!r) {
      sfx.play('kaseKilit');
      if (kart && alimDurumu(this.ev, kalem, this.para) === 'yetmiyor' && !this.tweens.isTweening(kart.ic))
        this.tweens.add({ targets: kart.ic, x: 8, duration: 40, yoyo: true, repeat: 2, onComplete: () => kart.ic.setX(0) });
      return;
    }
    this.ev = r.ev;
    this.para = r.para;
    sfx.play('zarfCekmece');
    this.evYenile();
    if (kart) {
      const { x, y, width: w, height: h } = kart.kap;
      const parla = this.add.rectangle(x, y, w, h, 0xf0e6cc, 0.7).setOrigin(0);
      this.tweens.add({ targets: parla, alpha: 0, duration: 260, onComplete: () => parla.destroy() });
      floatText(this, x + w - 90, y + h - 60, `−${r.fiyat} TL`, 0xa8352d, 36);
    }
    for (const t of [this.evParaYazi, this.birikmisYazi]) if (t && !this.tweens.isTweening(t)) pulse(this, t, 0.12, 120);
  }

  /** Metni yaz, boyu baştan kur ve genişliği aşarsa küçült (G43: kart yazıları her alımda değişir). */
  private sigdirYaz(t: Phaser.GameObjects.Text, s: string, boy: number, w: number): void {
    t.setFontSize(boy);
    t.setText(s);
    this.sigdir(t, w);
  }

  /**
   * Bilgi satırı (G58): kâğıdın iç genişliğine sığmazsa önce tek satırda en çok 6 px küçülür (alt sınır BILGI_EN_AZ);
   * yine sığmazsa verilen boyda kâğıt içinde alt satıra kayar.
   */
  private bilgiBoyKur(t: Phaser.GameObjects.Text, boy: number): void {
    const w = KAGIT.w - 80;
    t.setWordWrapWidth(null);
    let s = boy;
    t.setFontSize(s);
    const taban = Math.max(BILGI_EN_AZ, boy - 6);
    while (t.width > w && s > taban) {
      s -= 2;
      t.setFontSize(s);
    }
    if (t.width > w) t.setFontSize(boy).setWordWrapWidth(w, true);
  }

  /** Verilen boyda tek satırlık yazının yüksekliği (G58; çok satırlı yazının fazla yüksekliğini bulmak için). */
  private tekSatirYuk(boy: number): number {
    let h = this.tekYuk.get(boy);
    if (h === undefined) {
      const t = this.add.text(0, 0, 'ÇĞİÖŞÜ gjy', { fontFamily: FONT, fontSize: `${boy}px` });
      h = t.height;
      t.destroy();
      this.tekYuk.set(boy, h);
    }
    return h;
  }

  /** Metin genişliği aşarsa küçült. */
  private sigdir(t: Phaser.GameObjects.Text, w: number): Phaser.GameObjects.Text {
    let boy = parseInt(String(t.style.fontSize), 10);
    while (t.width > w && boy > 22) {
      boy -= 2;
      t.setFontSize(boy);
    }
    return t;
  }

  /** Damga adı, damga renginde küçük mürekkep kutusu içinde. */
  private damgaCip(x: number, y: number, d: Damga): Phaser.GameObjects.GameObject[] {
    const yazi = this.add.text(0, snap(y), DAMGA_ADI[d], { fontFamily: FONT, fontSize: '30px', color: '#f0e6cc' }).setOrigin(0, 0.5);
    const w = snap(yazi.width + 20);
    yazi.setX(snap(x + 10));
    const kutu = this.add.rectangle(snap(x), snap(y), w, 40, num(DAMGA_RENK[d])).setOrigin(0, 0.5);
    const kenar = this.add.rectangle(snap(x) - PX, snap(y), w + PX * 2, 48, 0x1d191b, 0.6).setOrigin(0, 0.5);
    kenar.setDepth(1);
    kutu.setDepth(2);
    yazi.setDepth(3);
    return [kenar, kutu, yazi];
  }

  private kagitCiz(): void {
    const W = KAGIT.w / PX;
    const H = KAGIT.h / PX;
    const rnd = rastgele(this.veri.gun * 131 + 7);
    const t = new Tuval(this, W + 2, H + 3, 'rapor');
    t.rect(2, 3, W, H, '#00000066');
    t.rect(0, 0, W, H, PAL.krem);
    t.benek(0, 0, W, H, PAL.kremKoyu, 0.035, rnd);
    t.frame(0, 0, W, H, PAL.kremKoyu);
    t.frame(2, 2, W - 4, H - 4, PAL.kremKoyu);
    t.dither(1, H - 2, W - 2, 1, PAL.kremKoyu);
    // Başlık şeridi
    t.rect(3, 3, W - 6, 22, PAL.basikSerit);
    for (let x = 3; x < W - 3; x += 2) {
      t.px(x, 3, '#7a4a42');
      t.px(x + 1, 24, '#7a4a42');
    }
    t.goruntu(KAGIT.x, KAGIT.y).setOrigin(0);
  }
}
