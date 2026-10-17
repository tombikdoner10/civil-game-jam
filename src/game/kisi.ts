import type { Bina, Ciddiyet, Damga, KusurId, Ruhsat, VaziyetPlani, Zemin } from './building';
import { baskaAda, baskaBinaBelgesi, gecerliRuhsat } from './building';
import type { IsteTuru, SorTuru, SorulanKusur } from './diyalog';
import type { GunAyar } from './days';
import { Rng } from './rng';
import { TUNING } from './tuning';

/**
 * Gişedeki mal sahibi (G17): kişilik ve SOR / İSTE cevapları. Saf TS; her şey (oyun tohumu, dosya, soru)
 * üçlüsünden deterministik: aynı tohumda aynı kişi aynı cevabı verir. Metinler src/game/diyalog.ts'de.
 */

export type Kisilik = 'durust' | 'kacamak' | 'pazarlikci';
/** Portre ifadeleri. */
export type Ifade = 'notr' | 'gergin' | 'kizgin' | 'mahcup' | 'sevincli';
/** Eksik olabilen belgeler. */
export type RaporAlani = 'karot' | 'zemin';
/** Gişedeki kişiden istenebilen belgeler: eksik rapor ya da geçersiz belgenin düzgünü (G17b; session.BilgiAlani). */
export type IsteAlani = RaporAlani | 'ruhsat' | 'vaziyet';

export interface Kisi {
  /** Portre tohumu (yüz, saç, giysi). */
  portre: number;
  kisilik: Kisilik;
  /** Selam satırı seçimi. */
  selam: number;
}

/** Eksik belge kusurları: SOR yerine İSTE. */
export const ISTE_KUSURU: Record<RaporAlani, KusurId> = { karot: 'karotYok', zemin: 'zeminEtuduYok' };

export function sorulabilir(id: KusurId): id is SorulanKusur {
  return id !== 'karotYok' && id !== 'zeminEtuduYok' && id !== 'sahaBeton';
}

/** FNV-1a: dizgiden 32 bit tohum. */
function ozet(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** (oyun tohumu, dosya, anahtar) için ayrı rastgele dizi. */
function rng(tohum: number, bina: Bina, anahtar: string): Rng {
  return new Rng((ozet(`${bina.id}:${anahtar}`) ^ Math.imul(tohum >>> 0, 0x85ebca6b)) >>> 0);
}

/** Ağırlıklı seçim. */
function agirlikli<T extends string>(r: Rng, w: Record<T, number>): T {
  const anahtarlar = Object.keys(w) as T[];
  const top = anahtarlar.reduce((s, k) => s + Math.max(0, w[k]), 0);
  let x = r.next() * top;
  for (const k of anahtarlar) {
    x -= Math.max(0, w[k]);
    if (x < 0) return k;
  }
  return anahtarlar[anahtarlar.length - 1];
}

export function kisiKur(tohum: number, bina: Bina, ayar: GunAyar): Kisi {
  const r = rng(tohum, bina, 'kisi');
  const K = TUNING.kisi.kisilik;
  const kisilik = agirlikli<Kisilik>(r, { durust: K.durust, kacamak: K.kacamak, pazarlikci: ayar.pazarlikci });
  return { portre: r.int(0, 0x7fffffff), kisilik, selam: r.int(0, 999) };
}

/** Zarfla istenebilen damgalar (en hafifi; G22). */
export type ZarfIstek = Extract<Damga, 'guvenli' | 'guclendir'>;

export interface SorCevap {
  kusur: SorulanKusur;
  tur: SorTuru;
  /** Satır seçimi (diyalog.satir). */
  secim: number;
  /** Zarf teklifinde miktar (TL). */
  zarf?: number;
  /** Zarf teklifinde kişinin istediği damga (G22): zarfı alan bunu vurmak zorunda. */
  istenen?: ZarfIstek;
  /** Cevaptaki yüz ifadesi. */
  ifade: Ifade;
}

/**
 * SOR cevabı: kişiliğe, binanın gerçeğine (kusurun ağırlığı) ve güne göre. Bahane bilgi vermez, itiraf kusuru
 * doğrular, zarf rüşvet teklifidir (dosya başına en çok bir zarf: zarfVar ise bahane). Gün başına zarf
 * olasılığı TUNING.kisi.zarf (gün 5 daha sık). Zarfla kişi bir damga ister (istenen; G22).
 */
export function sorCevabi(
  tohum: number,
  bina: Bina,
  kisi: Kisi,
  kusur: SorulanKusur,
  ciddiyet: Ciddiyet,
  ayar: GunAyar,
  zarfVar: boolean,
): SorCevap {
  const r = rng(tohum, bina, `sor:${kusur}`);
  const S = TUNING.kisi.sor[kisi.kisilik];
  const zarfP = zarfVar ? 0 : Math.min(0.9, ayar.zarf * S.zarfCarpan * (ciddiyet === 'bosalt' ? TUNING.kisi.bosaltZarf : 1));
  const secim = r.int(0, 999);
  if (r.chance(zarfP)) {
    const Z = TUNING.kisi.zarfMiktar[ciddiyet === 'bosalt' ? 'bosalt' : 'guclendir'];
    const adim = TUNING.kisi.zarfMiktar.adim;
    const zarf = Math.round(r.int(Z.min, Z.max) / adim) * adim;
    // İstenen damga (G22): genelde GÜVENLİ; BOŞALT gerektiren kusurda bazen GÜÇLENDİR (pazarlık).
    const istenen: ZarfIstek = ciddiyet === 'bosalt' && r.chance(TUNING.kisi.zarfIstekGuclendir) ? 'guclendir' : 'guvenli';
    return { kusur, tur: 'zarf', secim, zarf, istenen, ifade: 'sevincli' };
  }
  if (r.chance(S.itiraf)) return { kusur, tur: 'itiraf', secim, ifade: 'mahcup' };
  return { kusur, tur: 'bahane', secim, ifade: 'gergin' };
}

/**
 * Sahte belgeyi ele veren ipucu: laboratuvar mührü yok, tarih bugünden ileri, değer elle düzeltilmiş; getirilen
 * ruhsatta imza yok ya da getirilen planın ada / parseli yine farklı (G17b).
 */
export type SahteIpucu = 'muhur' | 'tarih' | 'elle' | 'imza' | 'ada';

/** Getirilen (gerçek ya da sahte) belge: kartı çizmek ve incelemek için. */
export interface GetirilenRapor {
  alan: IsteAlani;
  /** Kartta yazan değer (sahtede yanıltıcı). Ruhsatta kat, vaziyet planında dere mesafesi. */
  deger: number | Zemin;
  /** Rapor tarihi: bugünden kaç gün sonra (gerçekte eksi). */
  tarihFark: number;
  /** Kartta yazan ada / parsel. */
  ada: string;
  /** Sahte belgedeki ipucu; gerçek belgede yok. */
  ipucu?: SahteIpucu;
  /** Getirilen ruhsat ya da vaziyet planı (kart normal belge gibi çizilir). */
  ruhsat?: Ruhsat;
  vaziyet?: VaziyetPlani;
}

/**
 * İpucunun kartındaki alanı (inceleme modunda kural satırıyla seçilir): mühür yeri, tarih, elle düzeltilen değer
 * (karotta 'mpa', zeminde 'tur', ruhsatta 'kat' / 'yil', planda 'dere' / 'fay'), imza ya da ada / parsel.
 */
export function ipucuAlani(r: GetirilenRapor): string | null {
  if (!r.ipucu) return null;
  if (r.ipucu === 'muhur') return 'lab';
  if (r.ipucu === 'tarih') return 'tarih';
  if (r.ipucu === 'imza') return 'imza';
  if (r.ipucu === 'ada') return 'ada';
  if (r.alan === 'ruhsat') return r.ruhsat?.duzeltme?.alan ?? 'kat';
  if (r.alan === 'vaziyet') return r.vaziyet?.duzeltme?.alan ?? 'dere';
  return r.alan === 'karot' ? 'mpa' : 'tur';
}

export interface IsteCevap {
  alan: IsteAlani;
  tur: IsteTuru;
  secim: number;
  ifade: Ifade;
  /** Gerçek ya da sahte rapor (getiremezse yok). */
  rapor?: GetirilenRapor;
}

/**
 * Eksik ya da geçersiz belgenin arkasında gerçek kusur saklı mı: düşük beton, sıvılaşma, kaçak kat (elle
 * düzeltilmiş kat) ya da dereye / faya yakınlık (başka binanın planı).
 */
export function sakliKusur(bina: Bina, alan: IsteAlani): boolean {
  const g = bina.gercek;
  if (alan === 'karot') return g.betonMpa < TUNING.betonEsikMpa;
  if (alan === 'zemin') return g.zemin === 'sivilasma';
  if (alan === 'ruhsat') return gecerliRuhsat(bina.belgeler.ruhsat).kat !== g.kat;
  return g.dereMesafeM < TUNING.dereMinM || g.fayMesafeM < TUNING.fayMinM;
}

/**
 * Getirilen sahte ruhsat ya da vaziyet planı (G17b): değer oyuncuyu yanıltacak yönde (kaçak kat gizlenir, yakın
 * dere / fay uzak görünür); tek ipucu: ruhsatta elle düzeltme ya da imza yok, planda elle düzeltme ya da yine
 * başka binanın ada / parseli.
 */
function sahteBelge(r: Rng, bina: Bina, alan: 'ruhsat' | 'vaziyet', sakli: boolean): GetirilenRapor {
  const g = bina.gercek;
  const R = gecerliRuhsat(bina.belgeler.ruhsat);
  const T = TUNING;
  const tarihFark = -r.int(T.kisi.iste.gercekTarihOnce.min, T.kisi.iste.gercekTarihOnce.max);
  if (alan === 'ruhsat') {
    const ipucu = r.pick<SahteIpucu>(['elle', 'imza']);
    const ruhsat: Ruhsat = { ...R };
    if (ipucu === 'imza') {
      ruhsat.imza = false;
      if (sakli) ruhsat.kat = g.kat;
    } else if (sakli) {
      ruhsat.kat = g.kat;
      ruhsat.duzeltme = { alan: 'kat', asil: R.kat };
    } else {
      ruhsat.yil = Math.min(T.yil.max + 4, Math.max(R.yil + r.int(T.belgeHile.yilIleri.min, T.belgeHile.yilIleri.max), T.eskiYapiYili + 1));
      ruhsat.duzeltme = { alan: 'yil', asil: R.yil };
    }
    return { alan, deger: ruhsat.kat, tarihFark, ada: R.ada, ipucu, ruhsat };
  }
  const iyiDere = r.int(T.dereIyi.min, T.dereIyi.max);
  const iyiFay = r.int(T.fayIyi.min, T.fayIyi.max);
  const ipucu = r.pick<SahteIpucu>(['elle', 'ada']);
  let vaziyet: VaziyetPlani;
  if (ipucu === 'ada') {
    vaziyet = { dereM: sakli ? iyiDere : g.dereMesafeM, fayM: sakli ? iyiFay : g.fayMesafeM, ada: baskaAda(R.ada, r) };
  } else {
    const fay = g.fayMesafeM < T.fayMinM && g.dereMesafeM >= T.dereMinM;
    vaziyet = fay
      ? { dereM: g.dereMesafeM, fayM: iyiFay, ada: R.ada, duzeltme: { alan: 'fay', asil: g.fayMesafeM } }
      : { dereM: sakli ? iyiDere : g.dereMesafeM + r.int(20, 60), fayM: g.fayMesafeM, ada: R.ada, duzeltme: { alan: 'dere', asil: g.dereMesafeM } };
  }
  return { alan, deger: vaziyet.dereM, tarihFark, ada: vaziyet.ada, ipucu, vaziyet };
}

/**
 * İSTE cevabı (binanın gerçeğine göre): saklı kusur varsa sahte rapor daha olası. Sahte rapordaki değer
 * oyuncuyu yanıltacak yönde (düşük beton yüksek, sıvılaşma sağlam görünür). Sahte rapor günü gelmediyse
 * sahte yerine getiremez.
 */
export function isteCevabi(tohum: number, bina: Bina, kisi: Kisi, alan: IsteAlani, ayar: GunAyar): IsteCevap {
  const r = rng(tohum, bina, `iste:${alan}`);
  const I = TUNING.kisi.iste;
  const sakli = sakliKusur(bina, alan);
  const w: Record<IsteTuru, number> = { ...(sakli ? I.sakli : I.temiz) };
  // Pazarlıkçı kişi sahteye, dürüst kişi gerçeğe daha yatkın.
  if (kisi.kisilik === 'pazarlikci') w.sahte *= I.pazarlikciSahte;
  if (kisi.kisilik === 'durust') w.sahte *= I.durustSahte;
  if (!ayar.sahteRapor) {
    w.yok += w.sahte;
    w.sahte = 0;
  }
  const tur = agirlikli<IsteTuru>(r, w);
  const secim = r.int(0, 999);
  if (tur === 'yok') return { alan, tur, secim, ifade: 'mahcup' };
  const g = bina.gercek;
  const ada = bina.belgeler.ruhsat.ada;
  if (alan === 'ruhsat' || alan === 'vaziyet') {
    if (tur === 'sahte') return { alan, tur, secim, ifade: 'gergin', rapor: sahteBelge(r, bina, alan, sakli) };
    const tarihFark = -r.int(I.gercekTarihOnce.min, I.gercekTarihOnce.max);
    const rapor: GetirilenRapor =
      alan === 'ruhsat'
        ? { alan, deger: gecerliRuhsat(bina.belgeler.ruhsat).kat, tarihFark, ada, ruhsat: gecerliRuhsat(bina.belgeler.ruhsat) }
        : { alan, deger: g.dereMesafeM, tarihFark, ada, vaziyet: { dereM: g.dereMesafeM, fayM: g.fayMesafeM, ada } };
    return { alan, tur, secim, ifade: 'notr', rapor };
  }
  const gercekDeger = alan === 'karot' ? g.betonMpa : g.zemin;
  if (tur === 'gercek') {
    const tarihFark = -r.int(I.gercekTarihOnce.min, I.gercekTarihOnce.max);
    return { alan, tur, secim, ifade: 'notr', rapor: { alan, deger: gercekDeger, tarihFark, ada } };
  }
  // Sahte: değer yanıltıcı yönde; ipucu tek.
  let deger: number | Zemin;
  if (alan === 'karot') deger = sakli ? r.int(TUNING.betonIyi.min, TUNING.betonIyi.max) : bina.gercek.betonMpa + r.int(1, 4);
  else deger = sakli ? (r.chance(0.6) ? 'saglam' : 'orta') : 'saglam';
  const ipucu = r.pick<SahteIpucu>(['muhur', 'tarih', 'elle']);
  const tarihFark = ipucu === 'tarih' ? r.int(I.sahteTarihIleri.min, I.sahteTarihIleri.max) : -r.int(I.gercekTarihOnce.min, I.gercekTarihOnce.max);
  return { alan, tur, secim, ifade: 'gergin', rapor: { alan, deger, tarihFark, ada, ipucu } };
}

/** Geçersiz belge kusurunun düzgünü istenecek belge (G17b): ruhsat ya da başka binaya ait belge. */
export function gecersizAlani(bina: Bina, id: KusurId): IsteAlani | null {
  if (id === 'elleDuzeltme' || id === 'imzaYok') return 'ruhsat';
  if (id === 'baskaBina') return baskaBinaBelgesi(bina.belgeler);
  return null;
}
