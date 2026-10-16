import type { Bina, Damga, Kusur, KusurId, Zemin } from './building';
import { gunDosyalari } from './building';
import { gunAyar, type GunAyar } from './days';
import type { IsteTuru } from './diyalog';
import {
  ipucuAlani,
  ISTE_KUSURU,
  isteCevabi,
  kisiKur,
  sorCevabi,
  sorulabilir,
  type GetirilenRapor,
  type IsteCevap,
  type Kisi,
  type SorCevap,
} from './kisi';
import {
  bilgiyleTamamla,
  buyukDepremSonucu,
  dogruDamgalar,
  fizikselKusurlar,
  gorunenKusurlar,
  KUSUR_BILGI,
  RAPOR_KURALI,
  seciminKusuru,
  type EdinilenBilgi,
  type HasarDurumu,
  type SecimRef,
} from './rules';
import { TUNING } from './tuning';

export type { EdinilenBilgi } from './rules';

/** Bilginin kaynağı: dosyadaki belge, gişedeki kişiden isteme (G17) ya da saha testi (G19). */
export type BilgiKaynak = 'belge' | 'iste' | 'saha';
/** Eksik olabilen belgelerin bilgisi. */
export type BilgiAlani = 'karot' | 'zemin';

/** Dosya başına edinilen bilgi ve kaynağı (G17 İSTE ve G19 saha testi `bilgiEdin` ile doldurur). */
export interface DosyaBilgisi {
  bilgi: EdinilenBilgi;
  kaynak: Partial<Record<BilgiAlani, BilgiKaynak>>;
}

/** Gişede teklif edilen zarf (G17). Kabul: çekmeceye kondu ya da damga vurulurken masada kaldı. */
export interface ZarfKaydi {
  miktar: number;
  kabul: boolean;
}

export interface Karar {
  dosyaId: string;
  damga: Damga;
  /** Gösterilecek doğru damga: karar doğruysa verilen damga, değilse asıl doğru damga. */
  dogruDamga: Damga;
  dogru: boolean;
  /** Kabul edilen damgalar (eksik belgeli dosyada İADE ve bilgi edinildiyse gerçek damga). */
  kabul?: Damga[];
  /** Eksik bilgi başka yoldan edinildiyse kaynakları. */
  kaynak?: DosyaBilgisi['kaynak'];
  /** O günün kurallarına göre dosyadaki kusurlar (geri bildirim fişi için). */
  kusurlar: KusurId[];
  /** Oyuncunun inceleme modunda bu dosyada bulduğu kusurlar (gün sonu ekranı için). */
  bulunan: KusurId[];
  /** Gişede teklif edilen zarf (damgayı değiştirmez; kabul edilen para gün sonuna eklenir). */
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
}

/** Sokakta duran (damgalanmış) bir bina. */
export interface SokakKaydi {
  bina: Bina;
  damga: Damga;
  gun: number;
  /** Önceki sarsıntılardan kalan hasar (yoksa sağlam). */
  hasar?: HasarDurumu;
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
    const binalar = new Map(gunDosyalari(tohum, k.gun, gunAyar(k.gun).dosyaSayisi).map((b) => [b.id, b]));
    for (const karar of k.kararlar) {
      const bina = binalar.get(karar.dosyaId);
      if (bina) out.push({ bina, damga: karar.damga, gun: k.gun, hasar: hasar.get(karar.dosyaId) });
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
}

/** Büyük deprem: sokaktaki her bina için sonuç (sokak sırasıyla). Saf; Quake görüntüsü ve gazete bunu kullanır. */
export function buyukDeprem(tohum: number, kayitlar: readonly GunKaydi[]): DepremBinaSonucu[] {
  const dogru = new Map<string, boolean>();
  const zarf = new Set<string>();
  for (const k of kayitlar)
    for (const c of k.kararlar) {
      dogru.set(c.dosyaId, c.dogru);
      if (c.zarf?.kabul) zarf.add(c.dosyaId);
    }
  return sokakKayitlari(tohum, kayitlar).map((s, i) => {
    const r = buyukDepremSonucu(s.bina, s.damga, s.gun, { oncuHasar: s.hasar });
    return {
      dosyaId: s.bina.id,
      no: i + 1,
      gun: s.gun,
      damga: s.damga,
      dogru: dogru.get(s.bina.id) ?? false,
      kusurlu: fizikselKusurlar(s.bina, s.gun).length > 0,
      zarf: zarf.has(s.bina.id),
      durum: r.durum,
      coktu: r.coker,
      bos: r.bos,
    };
  });
}

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
}

export function depremOzeti(s: readonly DepremBinaSonucu[]): DepremOzeti {
  const coken = s.filter((b) => b.coktu);
  const iade = s.filter((b) => b.damga === 'iade');
  return {
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

export function oyunToplami(kayitlar: readonly GunKaydi[]): OyunToplami {
  const t: OyunToplami = { dosya: 0, dogru: 0, yanlis: 0, islenmeyen: 0, bulunan: 0, kusur: 0 };
  for (const k of kayitlar) {
    const h = gunHesabi(k.kararlar, gunAyar(k.gun).dosyaSayisi);
    t.dosya += gunAyar(k.gun).dosyaSayisi;
    t.dogru += h.dogru;
    t.yanlis += h.yanlis;
    t.islenmeyen += h.islenmeyen;
    for (const c of k.kararlar) {
      t.bulunan += c.bulunan.length;
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
  /** Asıl doğru damga (fişte "Doğrusu"). */
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
  private zarfTeklif?: { miktar: number; kabul?: boolean };

  constructor(
    readonly gun: number,
    readonly tohum: number,
  ) {
    this.ayar = gunAyar(gun);
    this.dosyalar = gunDosyalari(tohum, gun, this.ayar.dosyaSayisi);
    this.bilgiSifirla();
  }

  /** Gişedeki kişi (mevcut dosyanın sahibi). */
  get kisi(): Kisi | undefined {
    return this.kisiBilgi;
  }

  /** Mevcut dosyada teklif edilen zarf (kabul: henüz karar yoksa undefined). */
  get zarf(): Readonly<{ miktar: number; kabul?: boolean }> | undefined {
    return this.zarfTeklif;
  }

  /** Bu kusur gişedeki kişiye sorulabilir mi (bulunmuş, sorulmamış, eksik belge değil). */
  sorulabilir(id: KusurId): boolean {
    return !!this.mevcut && !this.bitti && this.ayar.sor && sorulabilir(id) && this.bulunan.includes(id) && !this.sorulan.includes(id);
  }

  /**
   * SOR: bulunan tutarsızlığı kişiye sor. Cevap (bahane / itiraf / zarf) deterministik; zarf teklifinde zarf
   * masaya kayar (zarfKarar ile kabul ya da ret; damga vurulurken masada kalırsa kabul).
   */
  sor(id: KusurId): SorCevap | null {
    const b = this.mevcut;
    const kisi = this.kisiBilgi;
    if (!b || !kisi || !this.sorulabilir(id) || !sorulabilir(id)) return null;
    const ciddiyet = id === 'sahteRapor' ? 'iade' : (this.gorunen(b).find((k) => k.id === id)?.ciddiyet ?? KUSUR_BILGI[id].ciddiyet);
    const c = sorCevabi(this.tohum, b, kisi, id, ciddiyet, this.ayar, this.zarfTeklif !== undefined);
    this.sorulan.push(id);
    if (c.zarf !== undefined) this.zarfTeklif = { miktar: c.zarf };
    return c;
  }

  /** Zarf kararı (bir kez): ret (gişeye geri) ya da kabul (çekmeceye). */
  zarfKarar(kabul: boolean): void {
    if (this.zarfTeklif && this.zarfTeklif.kabul === undefined) this.zarfTeklif.kabul = kabul;
  }

  /** Eksik belge bu dosyada istenebilir mi (belge yok, kuralı gelmiş, daha önce istenmemiş). */
  istenebilir(alan: BilgiAlani): boolean {
    const b = this.mevcut;
    if (!b || this.bitti || !this.ayar.iste || b.belgeler[alan] !== null || this.istenen[alan]) return false;
    return gorunenKusurlar(b, this.gun).some((k) => k.id === ISTE_KUSURU[alan]);
  }

  /**
   * İSTE: eksik belgeyi kişiden iste. Gerçek rapor bilgiyi edindirir (gerçek damga da doğru olur); sahte rapor
   * edindirmez (doğru damga İADE kalır; inceleme modunda "Sahte rapor" bulunur); getiremezse kart gelmez.
   */
  iste(alan: BilgiAlani): IsteCevap | null {
    const b = this.mevcut;
    const kisi = this.kisiBilgi;
    if (!b || !kisi || !this.istenebilir(alan)) return null;
    const c = isteCevabi(this.tohum, b, kisi, alan, this.ayar);
    this.istenen[alan] = c;
    if (c.tur === 'gercek' && c.rapor) {
      if (alan === 'karot') this.bilgiEdin('karot', c.rapor.deger as number, 'iste');
      else this.bilgiEdin('zemin', c.rapor.deger as Zemin, 'iste');
    }
    return c;
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
  bilgiEdin(alan: BilgiAlani, deger: number | Zemin, kaynak: BilgiKaynak): void {
    if (!this.mevcut || this.bitti) return;
    if (alan === 'karot') this.bilgi.bilgi.karot = deger as number;
    else this.bilgi.bilgi.zemin = deger as Zemin;
    this.bilgi.kaynak[alan] = kaynak;
  }

  private bilgiSifirla(): void {
    const b = this.mevcut;
    this.kisiBilgi = b ? kisiKur(this.tohum, b, this.ayar) : undefined;
    this.sorulan = [];
    this.istenen = {};
    this.zarfTeklif = undefined;
    const B = b?.belgeler;
    const d: DosyaBilgisi = { bilgi: {}, kaynak: {} };
    if (B?.karot) {
      d.bilgi.karot = B.karot.mpa;
      d.kaynak.karot = 'belge';
    }
    if (B?.zemin) {
      d.bilgi.zemin = B.zemin.tur;
      d.kaynak.zemin = 'belge';
    }
    this.bilgi = d;
  }

  /** Belge dışından edinilen bilgi (yalnızca İSTE / saha; belgeden gelenler eksik belgeyi tamamlamaz). */
  private disBilgi(): EdinilenBilgi | undefined {
    const { bilgi, kaynak } = this.bilgi;
    const out: EdinilenBilgi = {};
    if (kaynak.karot && kaynak.karot !== 'belge') out.karot = bilgi.karot;
    if (kaynak.zemin && kaynak.zemin !== 'belge') out.zemin = bilgi.zemin;
    return out.karot !== undefined || out.zemin !== undefined ? out : undefined;
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
    const kusur = this.sahteKaniti(secim) ?? seciminKusuru(b, this.gun, secim) ?? this.gorunenSecim(b, secim);
    if (!kusur) return null;
    const yeni = !this.bulunan.includes(kusur.id);
    if (yeni) this.bulunan.push(kusur.id);
    return { kusur, yeni };
  }

  /** İSTE ile gerçek rapor geldiyse, raporun değeriyle bulunabilen kusur (ör. düşük beton). */
  private gorunenSecim(b: Bina, secim: readonly SecimRef[]): Kusur | null {
    const dis = this.disBilgi();
    return dis ? seciminKusuru(bilgiyleTamamla(b, dis), this.gun, secim) : null;
  }

  /** Sahte raporun kanıtı: rapor kartındaki ipucu alanı ve rapor kuralı (sırası önemsiz). */
  private sahteKaniti(secim: readonly SecimRef[]): Kusur | null {
    if (secim.length !== 2) return null;
    for (const r of this.sahteRaporlar) {
      const alan = ipucuAlani(r);
      if (!alan) continue;
      const kanit: SecimRef[] = [
        { belge: r.alan, alan },
        { belge: 'kural', alan: RAPOR_KURALI },
      ];
      if (kanit.every((k) => secim.some((s) => s.belge === k.belge && s.alan === k.alan))) return { id: 'sahteRapor', ...KUSUR_BILGI.sahteRapor };
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

  damgala(damga: Damga): DamgaSonucu | null {
    const b = this.mevcut;
    if (!b || this.bitti) return null;
    const dis = this.disBilgi();
    const kabul = dogruDamgalar(b, this.gun, dis);
    const gorunen = gorunenKusurlar(b, this.gun);
    // Sahte rapor getirildiyse dosyanın kusuru sayılır (doğru damga zaten İADE ya da BOŞALT).
    if (this.sahteRaporlar.length > 0) gorunen.push({ id: 'sahteRapor', ...KUSUR_BILGI.sahteRapor });
    const kusurlar = gorunen.map((k) => k.id);
    const dogru = kabul.includes(damga);
    const sonuc: DamgaSonucu = { dogru, dogruDamga: kabul[0], kabul, kusurlar, etiketler: gorunen.map((k) => k.etiket) };
    const karar: Karar = {
      dosyaId: b.id,
      damga,
      dogruDamga: dogru ? damga : kabul[0],
      dogru,
      kabul,
      kusurlar,
      bulunan: this.bulunan.slice(),
    };
    if (dis) karar.kaynak = { ...this.bilgi.kaynak };
    if (this.zarfTeklif) karar.zarf = { miktar: this.zarfTeklif.miktar, kabul: this.zarfTeklif.kabul ?? true };
    const iste = Object.entries(this.istenen) as [BilgiAlani, IsteCevap][];
    if (iste.length > 0) karar.iste = Object.fromEntries(iste.map(([a, c]) => [a, c.tur]));
    this.kararlar.push(karar);
    this.bulunan = [];
    this.idx++;
    this.bilgiSifirla();
    return sonuc;
  }
}
