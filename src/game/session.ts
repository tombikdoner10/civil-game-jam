import type { Bina, Damga, Kusur, KusurId } from './building';
import { gunDosyalari } from './building';
import { gunAyar, type GunAyar } from './days';
import { dogruDamga, gorunenKusurlar, seciminKusuru, type HasarDurumu, type SecimRef } from './rules';
import { TUNING } from './tuning';

export interface Karar {
  dosyaId: string;
  damga: Damga;
  dogruDamga: Damga;
  dogru: boolean;
  /** O günün kurallarına göre dosyadaki kusurlar (geri bildirim fişi için). */
  kusurlar: KusurId[];
  /** Oyuncunun inceleme modunda bu dosyada bulduğu kusurlar (gün sonu ekranı için). */
  bulunan: KusurId[];
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
  dogruDamga: Damga;
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
  toplam: number;
}

export function gunHesabi(kararlar: readonly Karar[], dosyaSayisi: number): GunHesabi {
  const P = TUNING.para;
  const dogru = kararlar.filter((k) => k.dogru).length;
  const yanlis = kararlar.length - dogru;
  const maas = dogru * P.maas;
  const ceza = yanlis * P.ceza;
  return { dogru, yanlis, islenmeyen: Math.max(0, dosyaSayisi - kararlar.length), maas, ceza, toplam: maas - ceza };
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

  constructor(
    readonly gun: number,
    readonly tohum: number,
  ) {
    this.ayar = gunAyar(gun);
    this.dosyalar = gunDosyalari(tohum, gun, this.ayar.dosyaSayisi);
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
    const kusur = seciminKusuru(b, this.gun, secim);
    if (!kusur) return null;
    const yeni = !this.bulunan.includes(kusur.id);
    if (yeni) this.bulunan.push(kusur.id);
    return { kusur, yeni };
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
    const dogru = dogruDamga(b, this.gun);
    const gorunen = gorunenKusurlar(b, this.gun);
    const kusurlar = gorunen.map((k) => k.id);
    const sonuc: DamgaSonucu = { dogru: dogru === damga, dogruDamga: dogru, kusurlar, etiketler: gorunen.map((k) => k.etiket) };
    this.kararlar.push({ dosyaId: b.id, damga, dogruDamga: dogru, dogru: sonuc.dogru, kusurlar, bulunan: this.bulunan.slice() });
    this.bulunan = [];
    this.idx++;
    return sonuc;
  }
}
