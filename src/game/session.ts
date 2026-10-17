import type { Bina, Damga, Kusur, KusurId, Zemin } from './building';
import { baskaBinaBelgesi, gunDosyalari } from './building';
import { gunAyar, type GunAyar } from './days';
import type { IsteTuru } from './diyalog';
import {
  gecersizAlani,
  ipucuAlani,
  ISTE_KUSURU,
  isteCevabi,
  kisiKur,
  sorCevabi,
  sorulabilir,
  type GetirilenRapor,
  type IsteAlani,
  type IsteCevap,
  type Kisi,
  type SorCevap,
  type ZarfIstek,
} from './kisi';
import {
  bilgiyleTamamla,
  buyukDepremSonucu,
  dogruDamgalar,
  fizikselKusurlar,
  GECERSIZ_KURALI,
  gorunenKusurlar,
  KUSUR_BILGI,
  RAPOR_KURALI,
  seciminKusuru,
  type EdinilenBilgi,
  type HasarDurumu,
  type SecimRef,
} from './rules';
import { sahaSonucu, type SahaSonucu } from './saha';
import { TUNING } from './tuning';

export type { EdinilenBilgi } from './rules';
export type { SahaSonucu } from './saha';

/** Bilginin kaynağı: dosyadaki belge, gişedeki kişiden isteme (G17) ya da saha testi (G19). */
export type BilgiKaynak = 'belge' | 'iste' | 'saha';
/** Eksik ya da geçersiz olabilen belgelerin bilgisi (ruhsat ve vaziyet planı G17b). */
export type BilgiAlani = IsteAlani;

/** Dosya başına edinilen bilgi ve kaynağı (G17 İSTE ve G19 saha testi `bilgiEdin` ile doldurur). */
export interface DosyaBilgisi {
  bilgi: EdinilenBilgi;
  kaynak: Partial<Record<BilgiAlani, BilgiKaynak>>;
}

/**
 * Gişede teklif edilen zarf (G17, G22). Kabul (AL ya da çekmeceye) ya da ret (GERİ VER ya da gişeye); örtük kabul
 * yok. Kabul edilince vurulan damga kişinin istediği damgadır.
 */
export interface ZarfKaydi {
  miktar: number;
  kabul: boolean;
  /** Kişinin zarfla istediği damga. */
  istenen: ZarfIstek;
}

export interface Karar {
  dosyaId: string;
  damga: Damga;
  /**
   * Gösterilecek doğru damga: karar doğruysa verilen damga, değilse tercih edilen doğru damga (eksik bilgi başka
   * yoldan edinildiyse ona göre damga, yoksa asıl doğru damga).
   */
  dogruDamga: Damga;
  dogru: boolean;
  /** Kabul edilen damgalar (eksik belgeli dosyada İADE ve bilgi edinildiyse gerçek damga). */
  kabul?: Damga[];
  /** Eksik bilgi başka yoldan edinildiyse kaynakları. */
  kaynak?: DosyaBilgisi['kaynak'];
  /** O günün kurallarına göre dosyadaki kusurlar (geri bildirim fişi için). */
  kusurlar: KusurId[];
  /** kusurlar ile aynı sırada fişte görünen etiketler (kaçak katta fark: "Kaçak kat (+2)"). Gün sonu raporu da bunu kullanır. */
  etiketler?: string[];
  /** Oyuncunun inceleme modunda bu dosyada bulduğu kusurlar (gün sonu ekranı için). */
  bulunan: KusurId[];
  /** Gişede teklif edilen zarf (kabul edildiyse damga istenen damgadır; para gün sonuna eklenir). */
  zarf?: ZarfKaydi;
  /** Eksik belge istendiyse kişinin cevabı. */
  iste?: Partial<Record<BilgiAlani, IsteTuru>>;
}

/** Bir sarsıntıda tek binanın sonucu. */
export interface SarsintiSonucu {
  dosyaId: string;
  durum: HasarDurumu;
  /** Bina boşaltılmış mı (içeride kimse yok). */
  bos: boolean;
}

/** Bir sarsıntının kaydı (öncü sarsıntı; G5 büyük depremi de aynı biçimi kullanabilir). */
export interface SarsintiKaydi {
  siddet: number;
  sonuclar: SarsintiSonucu[];
}

/** Bitmiş bir günün kaydı (günler arasında taşınır; sokak ve deprem günü için). */
export interface GunKaydi {
  gun: number;
  kararlar: Karar[];
  /** O günün sonundaki öncü sarsıntı (varsa). Çatlayan binalar sonraki günlerde de çatlak görünür. */
  oncu?: SarsintiKaydi;
  /** Binalar başka tohumdan (G21 kısa yolun örnek binaları; yoksa oyunun tohumu). */
  tohum?: number;
}

/** Sokakta duran (damgalanmış) bir bina. */
export interface SokakKaydi {
  bina: Bina;
  damga: Damga;
  gun: number;
  /** Önceki sarsıntılardan kalan hasar (yoksa sağlam). */
  hasar?: HasarDurumu;
  /** Bu dosyada zarf kabul edilmişti (G22: sokakta iz, sarsıntıda etiket). */
  zarf?: boolean;
}

/**
 * Önceki günlerin kararlarından sokak: damgalanan her bina damgalanma sırasıyla. Binalar tohumdan yeniden
 * üretilir (aynı tohum ve gün, aynı dosyalar); hasar, kayıtlı sarsıntılardan (en sonuncusu geçerli).
 */
export function sokakKayitlari(tohum: number, kayitlar: readonly GunKaydi[]): SokakKaydi[] {
  const hasar = new Map<string, HasarDurumu>();
  for (const k of kayitlar) for (const s of k.oncu?.sonuclar ?? []) if (s.durum !== 'ayakta') hasar.set(s.dosyaId, s.durum);
  const out: SokakKaydi[] = [];
  for (const k of kayitlar) {
    const binalar = new Map(gunDosyalari(k.tohum ?? tohum, k.gun, gunAyar(k.gun).dosyaSayisi).map((b) => [b.id, b]));
    for (const karar of k.kararlar) {
      const bina = binalar.get(karar.dosyaId);
      if (bina) {
        const kayit: SokakKaydi = { bina, damga: karar.damga, gun: k.gun, hasar: hasar.get(karar.dosyaId) };
        if (karar.zarf?.kabul) kayit.zarf = true;
        out.push(kayit);
      }
    }
  }
  return out;
}

/** Büyük depremde tek binanın sonucu (gazete ve sonuç ekranı). */
export interface DepremBinaSonucu {
  dosyaId: string;
  /** Sokaktaki sıra (1 tabanlı; gazetede "Bina 07"). */
  no: number;
  /** Damgalandığı gün. */
  gun: number;
  /** Binanın gün sonu raporundaki adı (ör. "Bina 03", hikâye binasında "Bina H1"; G35 gazete). */
  adres: string;
  damga: Damga;
  /** Oyuncunun kararı o günün kurallarına göre doğru muydu. */
  dogru: boolean;
  /** Damgalandığı günün kurallarıyla fiziksel kusuru var mıydı (eksik belgenin arkasında saklananlar dahil). */
  kusurlu: boolean;
  /** Bu dosyada zarf kabul edilmişti. */
  zarf: boolean;
  durum: HasarDurumu;
  coktu: boolean;
  /** Boşaltılmıştı (içeride kimse yoktu). */
  bos: boolean;
  /** Oyuncunun kendi apartmanı (G42: gün 5 hikâye binası, oyuncu damgaladıysa); "Senin evin" sonucu bundan. */
  kendiBinan?: true;
  /** G42: güçlendirme payı tam ödendiği (G43: 3/3 taksit) için GÜÇLENDİR sayıldı (damgası GÜVENLİ ya da İADE'ydi). */
  evPayi?: true;
  /** G44: güçlendirme payının 2/3 taksiti ödendiği için sonucu bir kademe iyileşti (damgası GÜVENLİ ya da İADE'ydi). */
  evKismi?: true;
}

/** Büyük depremin oyuncunun evine bağlı seçeneği (G42; G43 kademeli). */
export interface DepremEvSecenek {
  /**
   * Güçlendirme payının ödenen taksit sayısı; hepsi (3/3) ödendiyse kendi apartmanın en az GÜÇLENDİR sayılır, 2/3'te
   * (G44) sonucu bir kademe iyileşir (öncü sarsıntı hasarının altına inmez).
   */
  guclendirmeKademe?: number;
}

/**
 * Büyük deprem: sokaktaki her bina için sonuç (sokak sırasıyla). Saf; Quake görüntüsü ve gazete bunu kullanır.
 * zarfKaynak (G23b, kısa yol): zarf işareti yalnızca bu kayıtlardaki (oyuncunun kendi) kabul edilen zarflardan;
 * verilmezse bütün kayıtlardan (normal oyunda hepsi oyuncunun). ev (G42): oyuncunun kendi apartmanı (zarfKaynak'taki
 * kendiBinan binası) güçlendirme payının bütün taksitleri (G43: 3/3) ödendiyse GÜVENLİ ya da İADE damgalı olsa da GÜÇLENDİR sonucunu alır;
 * 2/3 taksitte (G44) aynı damgalarla sonucu bir kademe iyileşir (çöktü → ağır hasar → hasarlı → ayakta). Öbür binalar
 * ve ev verilmediğinde ya da 0-1 taksitte hepsi değişmez.
 */
export function buyukDeprem(
  tohum: number,
  kayitlar: readonly GunKaydi[],
  zarfKaynak: readonly GunKaydi[] = kayitlar,
  ev: DepremEvSecenek = {},
): DepremBinaSonucu[] {
  const dogru = new Map<string, boolean>();
  const zarf = new Set<string>();
  const kendi = new Set<string>();
  for (const k of kayitlar) for (const c of k.kararlar) dogru.set(c.dosyaId, c.dogru);
  for (const k of zarfKaynak)
    for (const c of k.kararlar) {
      kendi.add(c.dosyaId);
      if (c.zarf?.kabul) zarf.add(c.dosyaId);
    }
  return sokakKayitlari(tohum, kayitlar).map((s, i) => {
    const kendiBinan = !!s.bina.kendiBinan && kendi.has(s.bina.id);
    const taksit = ev.guclendirmeKademe ?? 0;
    const tumu = TUNING.ev.kademe.guclendirme.length;
    const payDamga = kendiBinan && (s.damga === 'guvenli' || s.damga === 'iade');
    const payli = payDamga && taksit >= tumu;
    const r = buyukDepremSonucu(s.bina, payli ? 'guclendir' : s.damga, s.gun, { oncuHasar: s.hasar });
    const ek: Pick<DepremBinaSonucu, 'kendiBinan' | 'evPayi' | 'evKismi'> = {};
    if (kendiBinan) ek.kendiBinan = true;
    if (payli) ek.evPayi = true;
    // G44: 2/3 taksit, sonucu bir kademe iyileştirir (soyut evdeki "hasarlı" ile aynı mantık); öncü hasarın altına inmez.
    let { durum, coker } = r;
    if (payDamga && taksit === tumu - 1) {
      const kademe = Math.max(r.kademe - 1, s.hasar ? HASAR_KADEME.indexOf(s.hasar) : 0);
      if (kademe < r.kademe) {
        durum = HASAR_KADEME[Math.min(kademe, 2)];
        coker = kademe >= 3;
        ek.evKismi = true;
      }
    }
    return {
      ...ek,
      dosyaId: s.bina.id,
      no: i + 1,
      gun: s.gun,
      adres: s.bina.adres,
      damga: s.damga,
      dogru: dogru.get(s.bina.id) ?? false,
      kusurlu: fizikselKusurlar(s.bina, s.gun).length > 0,
      zarf: zarf.has(s.bina.id),
      durum,
      coktu: coker,
      bos: r.bos,
    };
  });
}

/** Büyük deprem kademesinden hasar durumu (rules.buyukDepremSonucu ile aynı sıra; 3 ve üstü çöker). */
const HASAR_KADEME: readonly HasarDurumu[] = ['ayakta', 'hasarli', 'agirHasar'];

/** Deprem sonrası sokak özeti. "Hasarlı" ayakta kalan hasarlı ve ağır hasarlı binalar; çökenler ayrı. */
export interface DepremOzeti {
  toplam: number;
  ayakta: number;
  hasarli: number;
  coken: number;
  /** Çöken ve boşaltılmış. */
  cokenBos: number;
  /** Boşaltılmış binaların hepsi. */
  bos: number;
  /** İçinde insan varken çöken (boşaltılmamış). */
  doluCoken: number;
  /** İçinde insan varken ağır hasar alan (çökmeyen). */
  doluAgir: number;
  /** İADE edilmiş (denetlenmeden kalmış) binalar. */
  iade: number;
  /** İADE edilmiş ve çöken. */
  iadeCoken: number;
  /** İADE edilmiş ve ağır hasar alan (çökmeyen). */
  iadeAgir: number;
  /** Zarf alınan binalar ve bunların hasar gören (ya da çöken) olanları (G22); zarfCoken: bunlardan çökenler (G23). */
  zarf: number;
  zarfHasar: number;
  zarfCoken: number;
  /** Zarf alınan ve içinde insan varken çöken binalar (G37: değerlendirmede onaylanıp çökenlerle aynı bina). */
  zarfDoluCoken: number;
}

/**
 * Manşetin ve değerlendirmenin dayandığı özet (G23b): kısa yolda yalnızca oyuncunun (jürinin) binaları, normal oyunda
 * bütün sokak. Gazete ve sonuç ekranı aynı özeti kullanır (aynı ton).
 */
export function oyuncuOzeti(s: readonly DepremBinaSonucu[], juri?: ReadonlySet<string>): DepremOzeti {
  return depremOzeti(juri ? s.filter((b) => juri.has(b.dosyaId)) : s);
}

export function depremOzeti(s: readonly DepremBinaSonucu[]): DepremOzeti {
  const coken = s.filter((b) => b.coktu);
  const iade = s.filter((b) => b.damga === 'iade');
  const zarf = s.filter((b) => b.zarf);
  return {
    zarf: zarf.length,
    zarfHasar: zarf.filter((b) => b.coktu || b.durum !== 'ayakta').length,
    zarfCoken: zarf.filter((b) => b.coktu).length,
    zarfDoluCoken: zarf.filter((b) => b.coktu && !b.bos && b.damga !== 'iade').length,
    iade: iade.length,
    iadeCoken: iade.filter((b) => b.coktu).length,
    iadeAgir: iade.filter((b) => !b.coktu && b.durum === 'agirHasar').length,
    toplam: s.length,
    ayakta: s.filter((b) => !b.coktu && b.durum === 'ayakta').length,
    hasarli: s.filter((b) => !b.coktu && b.durum !== 'ayakta').length,
    coken: coken.length,
    cokenBos: coken.filter((b) => b.bos).length,
    bos: s.filter((b) => b.bos).length,
    doluCoken: coken.filter((b) => !b.bos).length,
    doluAgir: s.filter((b) => !b.coktu && !b.bos && b.durum === 'agirHasar').length,
  };
}

/** Bütün günlerin toplamı (sonuç ekranı). */
export interface OyunToplami {
  dosya: number;
  dogru: number;
  yanlis: number;
  islenmeyen: number;
  /** İnceleme modunda bulunan kusur ve dosyalardaki (görünen) kusur sayısı. */
  bulunan: number;
  kusur: number;
}

/**
 * Kararda bulunan kusur sayısı, dosyanın son kusur listesiyle kesişen (G36): İSTE ya da saha ile bilgi edinilince
 * eksik belge kusuru listeden düşer; incelemeyle bulunmuş olsa da sayılmaz (bulunan hiçbir zaman kusurdan fazla
 * görünmesin).
 */
export function bulunanSayisi(c: Pick<Karar, 'bulunan' | 'kusurlar'>): number {
  return c.bulunan.filter((id) => c.kusurlar.includes(id)).length;
}

/**
 * Bulunan kusurun gün sonu raporundaki etiketi (G35): fişle aynı kaynak (kararın kusur etiketleri; kaçak katta fark
 * "(+n)"). Kusur dosyanın son listesinde yoksa yer tutucu etiket.
 */
export function kusurEtiketi(c: Pick<Karar, 'kusurlar' | 'etiketler'>, id: KusurId): string {
  const i = c.kusurlar.indexOf(id);
  return (i >= 0 ? c.etiketler?.[i] : undefined) ?? KUSUR_BILGI[id].etiket;
}

export function oyunToplami(kayitlar: readonly GunKaydi[]): OyunToplami {
  const t: OyunToplami = { dosya: 0, dogru: 0, yanlis: 0, islenmeyen: 0, bulunan: 0, kusur: 0 };
  for (const k of kayitlar) {
    const h = gunHesabi(k.kararlar, gunAyar(k.gun).dosyaSayisi);
    t.dosya += gunAyar(k.gun).dosyaSayisi;
    t.dogru += h.dogru;
    t.yanlis += h.yanlis;
    t.islenmeyen += h.islenmeyen;
    for (const c of k.kararlar) {
      t.bulunan += bulunanSayisi(c);
      t.kusur += c.kusurlar.length;
    }
  }
  return t;
}

export interface IncelemeSonucu {
  kusur: Kusur;
  /** Bu dosyada ilk kez mi bulundu. */
  yeni: boolean;
}

export function gunDosyaSayisi(gun: number): number {
  return gunAyar(gun).dosyaSayisi;
}

/** Damga sonucu (uyarı fişi için). */
export interface DamgaSonucu {
  dogru: boolean;
  /** Doğruysa verilen damga; değilse tercih edilen doğru damga (fişte "Doğrusu"; bilgi edinildiyse ona göre). */
  dogruDamga: Damga;
  /** Kabul edilen bütün damgalar. */
  kabul: Damga[];
  kusurlar: KusurId[];
  /** Kusurların fişte görünen etiketleri (kaçak katta fazla kat sayısıyla). */
  etiketler: string[];
}

/** Gün sonu hesabı (yer tutucu para: doğru başına maaş, yanlış başına ceza). */
export interface GunHesabi {
  dogru: number;
  yanlis: number;
  /** Mesai bittiği için damgalanmayan dosyalar. */
  islenmeyen: number;
  maas: number;
  ceza: number;
  /** Kabul edilen zarfların toplamı (G17). */
  zarf: number;
  /** Teklif edilen ve kabul edilen zarf sayısı. */
  zarfTeklif: number;
  zarfKabul: number;
  toplam: number;
}

export function gunHesabi(kararlar: readonly Karar[], dosyaSayisi: number): GunHesabi {
  const P = TUNING.para;
  const dogru = kararlar.filter((k) => k.dogru).length;
  const yanlis = kararlar.length - dogru;
  const maas = dogru * P.maas;
  const ceza = yanlis * P.ceza;
  const kabul = kararlar.filter((k) => k.zarf?.kabul);
  const zarf = kabul.reduce((n, k) => n + (k.zarf?.miktar ?? 0), 0);
  return {
    dogru,
    yanlis,
    islenmeyen: Math.max(0, dosyaSayisi - kararlar.length),
    maas,
    ceza,
    zarf,
    zarfTeklif: kararlar.filter((k) => k.zarf).length,
    zarfKabul: kabul.length,
    toplam: maas - ceza + zarf,
  };
}

/** Bir günün oturumu: dosyalar, sıradaki dosya, kararlar ve mesai saati. Saf TS, Phaser yok. */
export class GunOturumu {
  readonly dosyalar: Bina[];
  readonly kararlar: Karar[] = [];
  readonly ayar: GunAyar;
  private idx = 0;
  private gecenSn = 0;
  /** Mevcut dosyada bulunan kusurlar (bulunma sırasıyla). Dosya damgalanınca sıfırlanır. */
  private bulunan: KusurId[] = [];
  /** Mevcut dosyanın bilgisi (belgelerden ve başka yollardan edinilen). Dosya damgalanınca yenilenir. */
  private bilgi: DosyaBilgisi = { bilgi: {}, kaynak: {} };
  /** Gişedeki kişi ve onunla konuşulanlar (G17); dosya damgalanınca yenilenir. */
  private kisiBilgi?: Kisi;
  private sorulan: KusurId[] = [];
  private istenen: Partial<Record<BilgiAlani, IsteCevap>> = {};
  private zarfTeklif?: { miktar: number; istenen: ZarfIstek; kabul?: boolean };
  /** Günün kalan saha testi hakkı (G19). */
  private sahaKalan: number;

  constructor(
    readonly gun: number,
    readonly tohum: number,
  ) {
    this.ayar = gunAyar(gun);
    this.dosyalar = gunDosyalari(tohum, gun, this.ayar.dosyaSayisi);
    this.sahaKalan = this.ayar.sahaHak;
    this.bilgiSifirla();
  }

  /** Gişedeki kişi (mevcut dosyanın sahibi). */
  get kisi(): Kisi | undefined {
    return this.kisiBilgi;
  }

  /** Mevcut dosyada teklif edilen zarf (kabul: henüz karar yoksa undefined). */
  get zarf(): Readonly<{ miktar: number; istenen: ZarfIstek; kabul?: boolean }> | undefined {
    return this.zarfTeklif;
  }

  /** Zarf masada, karar bekliyor (G22): karar verilene kadar hiçbir damga vurulamaz. */
  get zarfBekliyor(): boolean {
    return !!this.zarfTeklif && this.zarfTeklif.kabul === undefined;
  }

  /**
   * Bu damga şu an vurulabilir mi (G22): zarf karar bekliyorsa hiçbiri; zarf alındıysa yalnızca kişinin istediği
   * damga; zarf yoksa ya da geri verildiyse hepsi (kaşeliğin o günkü kaşeleri).
   */
  damgaIzinli(damga: Damga): boolean {
    const z = this.zarfTeklif;
    if (!z) return true;
    if (z.kabul === undefined) return false;
    return !z.kabul || damga === z.istenen;
  }

  /** Bu kusur gişedeki kişiye sorulabilir mi (bulunmuş, sorulmamış, eksik belge değil). */
  sorulabilir(id: KusurId): boolean {
    return !!this.mevcut && !this.bitti && this.ayar.sor && sorulabilir(id) && this.bulunan.includes(id) && !this.sorulan.includes(id);
  }

  /**
   * SOR: bulunan tutarsızlığı kişiye sor. Cevap (bahane / itiraf / zarf) deterministik; zarf teklifinde zarf
   * masaya kayar ve zarfKarar ile kabul ya da ret edilene kadar damga vurulamaz (G22).
   */
  sor(id: KusurId): SorCevap | null {
    const b = this.mevcut;
    const kisi = this.kisiBilgi;
    if (!b || !kisi || !this.sorulabilir(id) || !sorulabilir(id)) return null;
    const ciddiyet = id === 'sahteRapor' ? 'iade' : (this.gorunen(b).find((k) => k.id === id)?.ciddiyet ?? KUSUR_BILGI[id].ciddiyet);
    const c = sorCevabi(this.tohum, b, kisi, id, ciddiyet, this.ayar, this.zarfTeklif !== undefined);
    this.sorulan.push(id);
    if (c.zarf !== undefined) this.zarfTeklif = { miktar: c.zarf, istenen: c.istenen ?? 'guvenli' };
    return c;
  }

  /** Zarf kararı (bir kez): ret (gişeye geri) ya da kabul (çekmeceye; damga kişinin istediği olur). */
  zarfKarar(kabul: boolean): void {
    if (this.zarfTeklif && this.zarfTeklif.kabul === undefined) this.zarfTeklif.kabul = kabul;
  }

  /**
   * Belge bu dosyada istenebilir mi (daha önce istenmemiş): eksik belge (yok, kuralı gelmiş) ya da geçersiz belge
   * (G17b: elle düzeltilmiş, başka binaya ait, imzasız; kusuru inceleme modunda bulunmuş olmalı).
   */
  istenebilir(alan: BilgiAlani): boolean {
    const b = this.mevcut;
    if (!b || this.bitti || !this.ayar.iste || this.istenen[alan]) return false;
    if ((alan === 'karot' || alan === 'zemin') && b.belgeler[alan] === null)
      return gorunenKusurlar(b, this.gun).some((k) => k.id === ISTE_KUSURU[alan]);
    return this.bulunan.some((id) => gecersizAlani(b, id) === alan);
  }

  /** Bulunan geçersiz belge kusurunun düzgünü istenebiliyorsa istenecek belge (inceleme etiketinde İSTE). */
  isteAlani(id: KusurId): BilgiAlani | null {
    const b = this.mevcut;
    const alan = b ? gecersizAlani(b, id) : null;
    return alan && this.istenebilir(alan) ? alan : null;
  }

  /**
   * İSTE: eksik belgeyi ya da geçersiz belgenin düzgününü kişiden iste. Gerçek belge bilgiyi edindirir (gerçek
   * damga da doğru olur); sahte belge edindirmez (doğru damga İADE kalır; inceleme modunda "Sahte rapor"
   * bulunur); getiremezse kart gelmez.
   */
  iste(alan: BilgiAlani): IsteCevap | null {
    const b = this.mevcut;
    const kisi = this.kisiBilgi;
    if (!b || !kisi || !this.istenebilir(alan)) return null;
    const c = isteCevabi(this.tohum, b, kisi, alan, this.ayar);
    this.istenen[alan] = c;
    if (c.tur === 'gercek' && c.rapor) {
      if (alan === 'karot') this.bilgiEdin('karot', c.rapor.deger as number, 'iste');
      else if (alan === 'zemin') this.bilgiEdin('zemin', c.rapor.deger as Zemin, 'iste');
      else this.bilgiEdin(alan, true, 'iste');
    }
    return c;
  }

  // ---- Saha testi (G19, Schmidt çekici) ----

  /** Günün kalan saha testi hakkı. */
  get sahaHakki(): number {
    return this.sahaKalan;
  }

  /**
   * Bu dosyada saha testi gerekli mi: karot raporu yok (kuralı gelmiş) ya da geçersiz (başka binanın karotu ya da
   * gişeden gelen sahte karot; ikisi de incelemede bulunmuş olmalı) ve karot bilgisi başka yoldan (İSTE gerçek
   * rapor, saha testi) edinilmemiş. Hak bitse de gerekli sayılır (düğme sönük görünür).
   */
  sahaGerekli(): boolean {
    const b = this.mevcut;
    if (!b || this.bitti || this.ayar.sahaHak <= 0) return false;
    const k = this.bilgi.kaynak.karot;
    if (k === 'iste' || k === 'saha') return false;
    if (b.belgeler.karot === null) {
      if (!gorunenKusurlar(b, this.gun).some((x) => x.id === 'karotYok')) return false;
      // Sahte karot geldiyse önce sahte olduğu bulunmalı (kart artık "Rapor yok" değil).
      return !this.sahteRaporlar.some((r) => r.alan === 'karot') || this.bulunan.includes('sahteRapor');
    }
    return baskaBinaBelgesi(b.belgeler) === 'karot' && this.bulunan.includes('baskaBina');
  }

  /** Saha testi şu an yapılabilir mi (gerekli ve hak var). */
  sahaYapilabilir(): boolean {
    return this.sahaKalan > 0 && this.sahaGerekli();
  }

  /** Bulunan kusurun etiketinde SAHA düğmesi çıksın mı: geçersiz karot (başka binanın ya da sahte karot). */
  sahaKusurda(id: KusurId): boolean {
    const b = this.mevcut;
    if (!b || !this.sahaGerekli() || !this.bulunan.includes(id)) return false;
    if (id === 'baskaBina') return baskaBinaBelgesi(b.belgeler) === 'karot';
    if (id === 'sahteRapor') return this.sahteRaporlar.some((r) => r.alan === 'karot');
    return false;
  }

  /** Mini oyunun göstereceği okumalar ve sonuç (hak harcamaz; VAZGEÇ için). Saha testi yapılamıyorsa null. */
  sahaOnizle(): SahaSonucu | null {
    const b = this.mevcut;
    return b && this.sahaYapilabilir() ? sahaSonucu(this.tohum, b) : null;
  }

  /**
   * Saha testi tamamlandı: hak harcanır, mesai saati TUNING.saha.dakika ilerler, tahmini dayanım karot bilgisi
   * olarak edinilir (kaynak 'saha'; doğru damga saha kuralına göre, bkz. rules.dogruDamgalar).
   */
  sahaTamamla(): SahaSonucu | null {
    const s = this.sahaOnizle();
    if (!s) return null;
    this.sahaKalan--;
    const M = TUNING.mesai;
    this.ilerle((TUNING.saha.dakika / ((M.bitisSaat - M.baslangicSaat) * 60)) * this.ayar.sure);
    this.bilgiEdin('karot', s.mpa, 'saha');
    return s;
  }

  /** Bu dosyada getirilen sahte raporlar. */
  get sahteRaporlar(): GetirilenRapor[] {
    return Object.values(this.istenen)
      .filter((c): c is IsteCevap => !!c && c.tur === 'sahte' && !!c.rapor)
      .map((c) => c.rapor as GetirilenRapor);
  }

  /** O günün kurallarıyla görünen kusurlar; İSTE ile edinilen bilgi eksik belgeyi tamamlar. */
  private gorunen(b: Bina): Kusur[] {
    const dis = this.disBilgi();
    return gorunenKusurlar(dis ? bilgiyleTamamla(b, dis) : b, this.gun);
  }

  /** Mevcut dosyada belgeden gelen bilgi ve (varsa) başka yoldan edinilen bilgi. */
  get edinilenBilgi(): Readonly<DosyaBilgisi> {
    return this.bilgi;
  }

  /**
   * Eksik belgenin bilgisini edin (G17 İSTE: kişi gerçek belgeyi getirdi; G19 saha testi). Alan edinilince
   * eksik belgeli dosyada gerçek duruma göre damga da doğru sayılır (bkz. rules.dogruDamgalar).
   */
  bilgiEdin(alan: 'karot', deger: number, kaynak: BilgiKaynak): void;
  bilgiEdin(alan: 'zemin', deger: Zemin, kaynak: BilgiKaynak): void;
  bilgiEdin(alan: 'ruhsat' | 'vaziyet', deger: true, kaynak: BilgiKaynak): void;
  bilgiEdin(alan: BilgiAlani, deger: number | Zemin | true, kaynak: BilgiKaynak): void {
    if (!this.mevcut || this.bitti) return;
    if (alan === 'karot') this.bilgi.bilgi.karot = deger as number;
    else if (alan === 'zemin') this.bilgi.bilgi.zemin = deger as Zemin;
    else this.bilgi.bilgi[alan] = true;
    this.bilgi.kaynak[alan] = kaynak;
  }

  private bilgiSifirla(): void {
    const b = this.mevcut;
    // Mizaç (G33): aynı gün art arda iki kişi aynı mizaçta olmasın (önceki kişi henüz kisiBilgi'de).
    this.kisiBilgi = b ? kisiKur(this.tohum, b, this.ayar, this.kisiBilgi?.mizac) : undefined;
    this.sorulan = [];
    this.istenen = {};
    this.zarfTeklif = undefined;
    const B = b?.belgeler;
    const d: DosyaBilgisi = { bilgi: {}, kaynak: {} };
    // Başka binanın belgesi bilgi saymaz (G17b).
    const baska = B ? baskaBinaBelgesi(B) : null;
    if (B?.karot && baska !== 'karot') {
      d.bilgi.karot = B.karot.mpa;
      d.kaynak.karot = 'belge';
    }
    if (B?.zemin && baska !== 'zemin') {
      d.bilgi.zemin = B.zemin.tur;
      d.kaynak.zemin = 'belge';
    }
    this.bilgi = d;
  }

  /** Belge dışından edinilen bilgi (yalnızca İSTE / saha; belgeden gelenler eksik belgeyi tamamlamaz). */
  private disBilgi(): EdinilenBilgi | undefined {
    const { bilgi, kaynak } = this.bilgi;
    const out: EdinilenBilgi = {};
    if (kaynak.karot === 'saha') out.karotSaha = bilgi.karot;
    else if (kaynak.karot && kaynak.karot !== 'belge') out.karot = bilgi.karot;
    if (kaynak.zemin && kaynak.zemin !== 'belge') out.zemin = bilgi.zemin;
    if (kaynak.ruhsat && kaynak.ruhsat !== 'belge') out.ruhsat = true;
    if (kaynak.vaziyet && kaynak.vaziyet !== 'belge') out.vaziyet = true;
    return Object.keys(out).length > 0 ? out : undefined;
  }

  get mevcut(): Bina | undefined {
    return this.dosyalar[this.idx];
  }
  /** 1 tabanlı sıra; bittiğinde toplam. */
  get no(): number {
    return Math.min(this.idx + 1, this.dosyalar.length);
  }
  get toplam(): number {
    return this.dosyalar.length;
  }
  get dogruSayisi(): number {
    return this.kararlar.filter((k) => k.dogru).length;
  }
  get mesaiBitti(): boolean {
    return this.gecenSn >= this.ayar.sure;
  }
  get bitti(): boolean {
    return this.idx >= this.dosyalar.length || this.mesaiBitti;
  }

  /** Mevcut dosyada inceleme moduyla bulunan kusurlar. */
  get bulunanKusurlar(): readonly KusurId[] {
    return this.bulunan;
  }

  /**
   * İnceleme modu: seçilen iki öğe, mevcut dosyada o günün kurallarıyla görünen bir kusurun kanıtı mı?
   * Kanıtsa kusur bu dosya için kaydedilir.
   */
  incele(secim: readonly SecimRef[]): IncelemeSonucu | null {
    const b = this.mevcut;
    if (!b || this.bitti) return null;
    // Gişeden gerçek belge geldiyse belgeler onunla (ör. düzgün ruhsattaki kat, gelen karottaki düşük beton);
    // sahte belgeyle değişen kartın alanları dosyanın eski kusurlarını kanıtlamaz.
    const dis = this.disBilgi();
    const etkin = dis ? bilgiyleTamamla(b, dis) : b;
    const degisen = new Set(this.sahteRaporlar.map((r) => r.alan as string));
    const eski = seciminKusuru(etkin, this.gun, secim);
    // Saha notu (G19) sahte karotun yerine geçer: saha kusurunun kanıtı sahte kartın alanı sayılmaz.
    const kusur = this.sahteKaniti(secim) ?? (eski && (eski.id === 'sahaBeton' || !eski.kanit.some((k) => degisen.has(k.belge))) ? eski : null);
    if (!kusur) return null;
    const yeni = !this.bulunan.includes(kusur.id);
    if (yeni) this.bulunan.push(kusur.id);
    return { kusur, yeni };
  }

  /**
   * Sahte belgenin kanıtı (sırası önemsiz): kartındaki ipucu alanı ve kural satırı (mühür ve tarih: rapor kuralı;
   * elle düzeltme: rapor ya da geçersiz belge kuralı; imza: geçersiz belge kuralı) ya da ada / parselde ruhsat
   * ile getirilen planın ada / parseli.
   */
  private sahteKaniti(secim: readonly SecimRef[]): Kusur | null {
    if (secim.length !== 2) return null;
    const esit = (kanit: SecimRef[]): boolean => kanit.every((k) => secim.some((s) => s.belge === k.belge && s.alan === k.alan));
    for (const r of this.sahteRaporlar) {
      // Saha notu sahte karotun yerine geçtiyse (G19) kartı masada değil.
      if (r.alan === 'karot' && this.bilgi.kaynak.karot === 'saha') continue;
      const alan = ipucuAlani(r);
      if (!alan) continue;
      const adaylar: SecimRef[][] = [];
      if (r.ipucu === 'ada')
        adaylar.push([
          { belge: 'ruhsat', alan: 'ada' },
          { belge: r.alan, alan: 'ada' },
        ]);
      else {
        const kurallar = r.ipucu === 'imza' ? [GECERSIZ_KURALI] : r.ipucu === 'elle' ? [RAPOR_KURALI, GECERSIZ_KURALI] : [RAPOR_KURALI];
        for (const k of kurallar)
          adaylar.push([
            { belge: r.alan, alan },
            { belge: 'kural', alan: k },
          ]);
      }
      if (adaylar.some(esit)) return { id: 'sahteRapor', ...KUSUR_BILGI.sahteRapor };
    }
    return null;
  }

  /** Mesai saatini ilerlet (gerçek saniye). */
  ilerle(sn: number): void {
    if (!this.mesaiBitti) this.gecenSn += sn;
  }

  /** "09:12" gibi oyun saati. */
  saatMetni(): string {
    const m = TUNING.mesai;
    const oran = Math.min(1, this.gecenSn / this.ayar.sure);
    const dk = Math.floor(oran * (m.bitisSaat - m.baslangicSaat) * 60);
    const toplam = m.baslangicSaat * 60 + dk;
    return `${String(Math.floor(toplam / 60)).padStart(2, '0')}:${String(toplam % 60).padStart(2, '0')}`;
  }

  get hesap(): GunHesabi {
    return gunHesabi(this.kararlar, this.toplam);
  }

  /** Damga vur. Zarf karar bekliyorsa ya da alınan zarfın istediği damga değilse vurulmaz (null; G22). */
  damgala(damga: Damga): DamgaSonucu | null {
    const b = this.mevcut;
    if (!b || this.bitti || !this.damgaIzinli(damga)) return null;
    const dis = this.disBilgi();
    const kabul = dogruDamgalar(b, this.gun, dis);
    const dogru = kabul.includes(damga);
    // G34: eksik bilgi başka yoldan (İSTE gerçek belge, saha testi) edinildiyse tercih edilen doğru damga edinilen
    // bilgiye göre damgadır (kabul[1]); İADE de doğru sayılmaya devam eder. Fiş, gün sonu raporu ve kayıt bunu kullanır.
    const tercih = kabul[kabul.length - 1];
    // Gerekçe edinilen bilgiye göre (ör. "Karot raporu yok" yerine gelen karottaki düşük beton). Yalnızca doğru İADE
    // vurulduysa gerekçe eksik belgenin kendisi.
    const gorunen = dis && !(dogru && damga === 'iade') ? this.gorunen(b) : gorunenKusurlar(b, this.gun);
    // Sahte rapor getirildiyse dosyanın kusuru sayılır (doğru damga zaten İADE ya da BOŞALT).
    if (this.sahteRaporlar.length > 0) gorunen.push({ id: 'sahteRapor', ...KUSUR_BILGI.sahteRapor });
    const kusurlar = gorunen.map((k) => k.id);
    const etiketler = gorunen.map((k) => k.etiket);
    const sonuc: DamgaSonucu = { dogru, dogruDamga: dogru ? damga : tercih, kabul, kusurlar, etiketler };
    const karar: Karar = {
      dosyaId: b.id,
      damga,
      dogruDamga: dogru ? damga : tercih,
      dogru,
      kabul,
      kusurlar,
      etiketler: etiketler.slice(),
      bulunan: this.bulunan.slice(),
    };
    if (dis) karar.kaynak = { ...this.bilgi.kaynak };
    if (this.zarfTeklif) karar.zarf = { miktar: this.zarfTeklif.miktar, kabul: this.zarfTeklif.kabul === true, istenen: this.zarfTeklif.istenen };
    const iste = Object.entries(this.istenen) as [BilgiAlani, IsteCevap][];
    if (iste.length > 0) karar.iste = Object.fromEntries(iste.map(([a, c]) => [a, c.tur]));
    this.kararlar.push(karar);
    this.bulunan = [];
    this.idx++;
    this.bilgiSifirla();
    return sonuc;
  }
}
