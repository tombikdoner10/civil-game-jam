import type { DepremBinaSonucu, GunKaydi, Karar } from './session';
import { TUNING } from './tuning';

/**
 * Kendi evinin hazırlığı (G42, takım fikri; G43 kademeli; GDD "Para ve kendi evin", "Ekonomi kademeli"). Saf TS,
 * Phaser yok; oyun RNG'si kullanılmaz. Gün sonu raporunda birikmiş parayla üç kalemin kademeleri sırayla alınır
 * (her kalem 3 kademe; güçlendirme payı 3 taksit). Oturum boyunca kalıcıdır (sahneler arasında veriyle taşınır).
 * Büyük depremde "Senin evin" sonucu kademelere göre, deterministik.
 */

export type EvKalem = 'canta' | 'sabitleme' | 'guclendirme';
/** Rapordaki sıra (1 / 2 / 3 tuşları). */
export const EV_KALEMLER: readonly EvKalem[] = ['canta', 'sabitleme', 'guclendirme'];
/** Her kalemin kademe sayısı (güçlendirmede taksit). */
export const EV_KADEME = 3;

export interface EvAlim {
  /** Alınan kademe (1..EV_KADEME). */
  kademe: number;
  /** Alındığı gün. */
  gun: number;
  fiyat: number;
  /** Zarf parası olmadan alınamazdı (bedelin bir kısmı zarf parasından). */
  zarfla: boolean;
}

export interface EvHazirlik {
  /** Her kalemin alınan kademeleri, sırayla (uzunluk = kademe). */
  alinan: Partial<Record<EvKalem, EvAlim[]>>;
  /** Harcanan zarf parası (önce temiz para harcanır, yetmezse zarf parası). */
  zarfHarcanan: number;
}

export function yeniEv(): EvHazirlik {
  return { alinan: {}, zarfHarcanan: 0 };
}

/** Kalemin alınmış kademe sayısı (0..EV_KADEME). */
export function evKademe(ev: EvHazirlik | undefined, k: EvKalem): number {
  return ev?.alinan[k]?.length ?? 0;
}

/** Kalemin n. kademesinin fiyatı (n: 1..EV_KADEME). */
export function evFiyat(k: EvKalem, n: number): number {
  return TUNING.ev.kademe[k][n - 1];
}

/** Sıradaki kademenin fiyatı; kalem tamamsa null. */
export function siradakiFiyat(ev: EvHazirlik, k: EvKalem): number | null {
  const n = evKademe(ev, k);
  return n >= EV_KADEME ? null : evFiyat(k, n + 1);
}

/** Güçlendirme payı tam ödendi (3/3 taksit): 5 günlük yolda kendi apartmanın en az GÜÇLENDİR sayılır. */
export function guclendirmeTam(ev: EvHazirlik | undefined): boolean {
  return evKademe(ev, 'guclendirme') >= EV_KADEME;
}

/** Evine harcanan toplam (TL; yalnızca gerçek satın almalar, dev'de bedelsiz eklenen kademelerin fiyatı 0). */
export function evHarcanan(ev: EvHazirlik | undefined): number {
  if (!ev) return 0;
  return EV_KALEMLER.reduce((n, k) => n + (ev.alinan[k] ?? []).reduce((m, a) => m + a.fiyat, 0), 0);
}

/**
 * Kabul edilen zarfların toplamı: önceki günlerin kayıtları ve (varsa) bugünün kararları. G57: müfettişin el koyduğu
 * zarf paraya girmediği için sayılmaz (zarf parasıyla alım yalnızca gerçekten eldeki zarf parasından).
 */
export function zarfToplami(kayitlar: readonly GunKaydi[], bugun: readonly Karar[] = []): number {
  let n = 0;
  for (const c of [...kayitlar.flatMap((k) => k.kararlar), ...bugun]) if (c.zarf?.kabul && !c.zarf.yakalandi) n += c.zarf.miktar;
  return n;
}

export type AlimDurumu = 'tamam' | 'alinabilir' | 'yetmiyor';

export function alimDurumu(ev: EvHazirlik, k: EvKalem, para: number): AlimDurumu {
  const f = siradakiFiyat(ev, k);
  if (f === null) return 'tamam';
  return para >= f ? 'alinabilir' : 'yetmiyor';
}

/**
 * Kalemin sıradaki kademesini al (saf; yeni durum döner). Kalem tamamsa ya da para yetmiyorsa null: para eksiye
 * inmez, kademe atlanmaz, 3'ten sonra alınmaz. Temiz para (para − harcanmamış zarf parası) önce harcanır; yetmezse
 * kalan zarf parasından ve kademe "zarfla" işaretlenir (zarf olmadan alınamazdı).
 */
export function satinAl(
  ev: EvHazirlik,
  k: EvKalem,
  para: number,
  zarfToplam: number,
  gun: number,
): { ev: EvHazirlik; para: number; zarfla: boolean; kademe: number; fiyat: number } | null {
  const fiyat = siradakiFiyat(ev, k);
  if (fiyat === null || para < fiyat) return null;
  const kademe = evKademe(ev, k) + 1;
  const zarfBakiye = Math.max(0, Math.min(para, zarfToplam - ev.zarfHarcanan));
  const temiz = para - zarfBakiye;
  const zarfdan = Math.max(0, fiyat - temiz);
  const zarfla = zarfdan > 0;
  const alim: EvAlim = { kademe, gun, fiyat, zarfla };
  return {
    ev: { alinan: { ...ev.alinan, [k]: [...(ev.alinan[k] ?? []), alim] }, zarfHarcanan: ev.zarfHarcanan + zarfdan },
    para: para - fiyat,
    zarfla,
    kademe,
    fiyat,
  };
}

/**
 * Evin depremdeki durumu. hasarli (G45): güçlendirme 1/3 (soyut ev). coktuBos: kendi apartmanın BOŞALT damgalıydı
 * (içinde kimse yoktu).
 */
export type EvDurum = 'saglam' | 'hafif' | 'hasarli' | 'agir' | 'coktu' | 'coktuBos';

export interface EvSonucu {
  durum: EvDurum;
  /** Kademeler (0..EV_KADEME). */
  canta: number;
  sabitleme: number;
  guclendirme: number;
  /** En az bir kademesi zarf parasıyla alınan kalemler (rapor sırasıyla). */
  zarfla: EvKalem[];
  harcanan: number;
  /** Ev, 5 günlük yolda gün 5'te damgaladığın kendi apartmanın. */
  kendiBina?: DepremBinaSonucu;
}

/**
 * Soyut evin (kendi apartmanını damgalamadıysan) güçlendirme kademesine göre durumu (G45, takım kararı: her taksit bir
 * kademe): 0 ağır hasar, 1/3 hasarlı, 2/3 hafif hasar, 3/3 hasarsız.
 */
export const EV_SOYUT_DURUM: readonly EvDurum[] = ['agir', 'hasarli', 'hafif', 'saglam'];

/**
 * "Senin evin" (G42, G43 kademeli; deterministik). Kendi apartmanını damgaladıysan (5 günlük yol, gün 5) evin durumu
 * onun deprem sonucudur (G45: her taksit bir kademe iyileşmiş, 3/3 taksitse GÜÇLENDİR sayılmış ve en az iki kademe iyi;
 * bkz. session.buyukDeprem; sokak, gazete ve sonuç aynı sonucu gösterir). Yoksa (kısa yol ya da damgalanmadı)
 * güçlendirme kademesine göre (EV_SOYUT_DURUM): 0 ağır hasar, 1 hasarlı, 2 hafif hasar, 3 hasarsız. Çanta ve
 * sabitleme kademeleri ayrı cümlelere bağlanır (ev-metin.ts).
 */
export function evSonucu(ev: EvHazirlik | undefined, sonuclar: readonly DepremBinaSonucu[]): EvSonucu {
  const e = ev ?? yeniEv();
  const kendi = sonuclar.find((b) => b.kendiBinan);
  const guclendirme = evKademe(e, 'guclendirme');
  let durum: EvDurum;
  if (kendi) durum = kendi.coktu ? (kendi.bos ? 'coktuBos' : 'coktu') : kendi.durum === 'agirHasar' ? 'agir' : kendi.durum === 'hasarli' ? 'hafif' : 'saglam';
  else durum = EV_SOYUT_DURUM[guclendirme];
  const out: EvSonucu = {
    durum,
    canta: evKademe(e, 'canta'),
    sabitleme: evKademe(e, 'sabitleme'),
    guclendirme,
    zarfla: EV_KALEMLER.filter((k) => (e.alinan[k] ?? []).some((a) => a.zarfla)),
    harcanan: evHarcanan(e),
  };
  if (kendi) out.kendiBina = kendi;
  return out;
}
