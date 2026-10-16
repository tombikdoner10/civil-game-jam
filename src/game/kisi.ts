import type { Bina, Ciddiyet, KusurId, Zemin } from './building';
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
/** Eksik olabilen belgeler (session.BilgiAlani ile aynı). */
export type RaporAlani = 'karot' | 'zemin';

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
  return id !== 'karotYok' && id !== 'zeminEtuduYok';
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

export interface SorCevap {
  kusur: SorulanKusur;
  tur: SorTuru;
  /** Satır seçimi (diyalog.satir). */
  secim: number;
  /** Zarf teklifinde miktar (TL). */
  zarf?: number;
  /** Cevaptaki yüz ifadesi. */
  ifade: Ifade;
}

/**
 * SOR cevabı: kişiliğe, binanın gerçeğine (kusurun ağırlığı) ve güne göre. Bahane bilgi vermez, itiraf kusuru
 * doğrular, zarf rüşvet teklifidir (dosya başına en çok bir zarf: zarfVar ise bahane). Gün başına zarf
 * olasılığı TUNING.kisi.zarf (gün 5 daha sık).
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
    return { kusur, tur: 'zarf', secim, zarf, ifade: 'sevincli' };
  }
  if (r.chance(S.itiraf)) return { kusur, tur: 'itiraf', secim, ifade: 'mahcup' };
  return { kusur, tur: 'bahane', secim, ifade: 'gergin' };
}

/** Sahte raporu ele veren ipucu: laboratuvar mührü yok, tarih bugünden ileri ya da değer elle düzeltilmiş. */
export type SahteIpucu = 'muhur' | 'tarih' | 'elle';

/** Getirilen (gerçek ya da sahte) rapor: kartı çizmek ve incelemek için. */
export interface GetirilenRapor {
  alan: RaporAlani;
  /** Kartta yazan değer (sahtede yanıltıcı). */
  deger: number | Zemin;
  /** Rapor tarihi: bugünden kaç gün sonra (gerçekte eksi). */
  tarihFark: number;
  /** Sahte rapordaki ipucu; gerçek raporda yok. */
  ipucu?: SahteIpucu;
}

/**
 * İpucunun rapor kartındaki alanı (inceleme modunda rapor kuralıyla seçilir): mühür yeri, tarih ya da değerin
 * kendisi (karotta 'mpa', zeminde 'tur'; değer alanı gerçek raporda düşük beton ve sıvılaşma kanıtı da olur).
 */
export function ipucuAlani(r: GetirilenRapor): string | null {
  if (!r.ipucu) return null;
  if (r.ipucu === 'muhur') return 'lab';
  if (r.ipucu === 'tarih') return 'tarih';
  return r.alan === 'karot' ? 'mpa' : 'tur';
}

export interface IsteCevap {
  alan: RaporAlani;
  tur: IsteTuru;
  secim: number;
  ifade: Ifade;
  /** Gerçek ya da sahte rapor (getiremezse yok). */
  rapor?: GetirilenRapor;
}

/** Eksik belgenin arkasında gerçek kusur saklı mı (düşük beton ya da sıvılaşma). */
export function sakliKusur(bina: Bina, alan: RaporAlani): boolean {
  return alan === 'karot' ? bina.gercek.betonMpa < TUNING.betonEsikMpa : bina.gercek.zemin === 'sivilasma';
}

/**
 * İSTE cevabı (binanın gerçeğine göre): saklı kusur varsa sahte rapor daha olası. Sahte rapordaki değer
 * oyuncuyu yanıltacak yönde (düşük beton yüksek, sıvılaşma sağlam görünür). Sahte rapor günü gelmediyse
 * sahte yerine getiremez.
 */
export function isteCevabi(tohum: number, bina: Bina, kisi: Kisi, alan: RaporAlani, ayar: GunAyar): IsteCevap {
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
  const gercekDeger = alan === 'karot' ? bina.gercek.betonMpa : bina.gercek.zemin;
  if (tur === 'gercek') {
    const tarihFark = -r.int(I.gercekTarihOnce.min, I.gercekTarihOnce.max);
    return { alan, tur, secim, ifade: 'notr', rapor: { alan, deger: gercekDeger, tarihFark } };
  }
  // Sahte: değer yanıltıcı yönde; ipucu tek.
  let deger: number | Zemin;
  if (alan === 'karot') deger = sakli ? r.int(TUNING.betonIyi.min, TUNING.betonIyi.max) : bina.gercek.betonMpa + r.int(1, 4);
  else deger = sakli ? (r.chance(0.6) ? 'saglam' : 'orta') : 'saglam';
  const ipucu = r.pick<SahteIpucu>(['muhur', 'tarih', 'elle']);
  const tarihFark = ipucu === 'tarih' ? r.int(I.sahteTarihIleri.min, I.sahteTarihIleri.max) : -r.int(I.gercekTarihOnce.min, I.gercekTarihOnce.max);
  return { alan, tur, secim, ifade: 'gergin', rapor: { alan, deger, tarihFark, ipucu } };
}
