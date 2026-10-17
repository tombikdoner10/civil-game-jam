import type { DepremBinaSonucu, GunKaydi, Karar } from './session';
import { TUNING } from './tuning';

/**
 * Kendi evinin hazırlığı (G42, takım fikri; GDD "Para ve kendi evin"). Saf TS, Phaser yok; oyun RNG'si kullanılmaz.
 * Gün sonu raporunda birikmiş parayla üç tek seferlik kalem alınır; oturum boyunca kalıcıdır (sahneler arasında
 * veriyle taşınır). Büyük depremde "Senin evin" sonucu bunlara göre, deterministik.
 */

export type EvKalem = 'canta' | 'sabitleme' | 'guclendirme';
/** Rapordaki sıra (1 / 2 / 3 tuşları). */
export const EV_KALEMLER: readonly EvKalem[] = ['canta', 'sabitleme', 'guclendirme'];

export interface EvAlim {
  /** Alındığı gün. */
  gun: number;
  fiyat: number;
  /** Zarf parası olmadan alınamazdı (bedelin bir kısmı zarf parasından). */
  zarfla: boolean;
}

export interface EvHazirlik {
  alinan: Partial<Record<EvKalem, EvAlim>>;
  /** Harcanan zarf parası (önce temiz para harcanır, yetmezse zarf parası). */
  zarfHarcanan: number;
}

export function yeniEv(): EvHazirlik {
  return { alinan: {}, zarfHarcanan: 0 };
}

export function evFiyat(k: EvKalem): number {
  return TUNING.ev.fiyat[k];
}

/** Evine harcanan toplam (TL). */
export function evHarcanan(ev: EvHazirlik | undefined): number {
  if (!ev) return 0;
  return EV_KALEMLER.reduce((n, k) => n + (ev.alinan[k]?.fiyat ?? 0), 0);
}

/** Kabul edilen zarfların toplamı: önceki günlerin kayıtları ve (varsa) bugünün kararları. */
export function zarfToplami(kayitlar: readonly GunKaydi[], bugun: readonly Karar[] = []): number {
  let n = 0;
  for (const c of [...kayitlar.flatMap((k) => k.kararlar), ...bugun]) if (c.zarf?.kabul) n += c.zarf.miktar;
  return n;
}

export type AlimDurumu = 'alindi' | 'alinabilir' | 'yetmiyor';

export function alimDurumu(ev: EvHazirlik, k: EvKalem, para: number): AlimDurumu {
  if (ev.alinan[k]) return 'alindi';
  return para >= evFiyat(k) ? 'alinabilir' : 'yetmiyor';
}

/**
 * Kalemi al (saf; yeni durum döner). Alınmışsa ya da para yetmiyorsa null: para eksiye inmez, kalem iki kez
 * alınmaz. Temiz para (para − harcanmamış zarf parası) önce harcanır; yetmezse kalan zarf parasından ve kalem
 * "zarfla" işaretlenir (zarf olmadan alınamazdı).
 */
export function satinAl(
  ev: EvHazirlik,
  k: EvKalem,
  para: number,
  zarfToplam: number,
  gun: number,
): { ev: EvHazirlik; para: number; zarfla: boolean } | null {
  const fiyat = evFiyat(k);
  if (ev.alinan[k] || para < fiyat) return null;
  const zarfBakiye = Math.max(0, Math.min(para, zarfToplam - ev.zarfHarcanan));
  const temiz = para - zarfBakiye;
  const zarfdan = Math.max(0, fiyat - temiz);
  const zarfla = zarfdan > 0;
  return {
    ev: { alinan: { ...ev.alinan, [k]: { gun, fiyat, zarfla } }, zarfHarcanan: ev.zarfHarcanan + zarfdan },
    para: para - fiyat,
    zarfla,
  };
}

/** Evin depremdeki durumu. coktuBos: kendi apartmanın BOŞALT damgalıydı (içinde kimse yoktu). */
export type EvDurum = 'saglam' | 'hafif' | 'agir' | 'coktu' | 'coktuBos';

export interface EvSonucu {
  durum: EvDurum;
  canta: boolean;
  sabitleme: boolean;
  guclendirme: boolean;
  /** Zarf parasıyla alınan kalemler (rapor sırasıyla). */
  zarfla: EvKalem[];
  harcanan: number;
  /** Ev, 5 günlük yolda gün 5'te damgaladığın kendi apartmanın. */
  kendiBina?: DepremBinaSonucu;
}

/**
 * "Senin evin" (G42, deterministik). Kendi apartmanını damgaladıysan (5 günlük yol, gün 5) evin durumu onun deprem
 * sonucudur (güçlendirme payı ödendiyse en az GÜÇLENDİR sayılmış olarak; bkz. session.buyukDeprem). Yoksa (kısa yol ya
 * da damgalanmadı) güçlendirme payıyla hafif hasar, payı yoksa ağır hasar. Çanta ve sabitleme yalnızca alınıp
 * alınmadığına bağlı.
 */
export function evSonucu(ev: EvHazirlik | undefined, sonuclar: readonly DepremBinaSonucu[]): EvSonucu {
  const e = ev ?? yeniEv();
  const kendi = sonuclar.find((b) => b.kendiBinan);
  const guclendirme = !!e.alinan.guclendirme;
  let durum: EvDurum;
  if (kendi) durum = kendi.coktu ? (kendi.bos ? 'coktuBos' : 'coktu') : kendi.durum === 'agirHasar' ? 'agir' : kendi.durum === 'hasarli' ? 'hafif' : 'saglam';
  else durum = guclendirme ? 'hafif' : 'agir';
  const out: EvSonucu = {
    durum,
    canta: !!e.alinan.canta,
    sabitleme: !!e.alinan.sabitleme,
    guclendirme,
    zarfla: EV_KALEMLER.filter((k) => e.alinan[k]?.zarfla),
    harcanan: evHarcanan(e),
  };
  if (kendi) out.kendiBina = kendi;
  return out;
}
