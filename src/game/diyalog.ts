// @beyan metin
import type { Bina, KusurId } from './building';

/**
 * Masadaki kısa yazılar (G17) ve gişe diyaloğunun seçimi (G33). Metinler lider onaylı (G31, docs/TAKIM_CEVAPLARI.md).
 * Gişedeki kişilerin cümleleri src/game/diyalog-metin.ts'de (mizaçlı taslaklar); burada yalnızca
 * cümlenin seçimi (tekrarsız deste) ve değişkenlerin doldurulması var. Seçim oyun RNG'sini tüketmez.
 */

/**
 * Oyunu çerçeveleyen tek cümle (G5b): gün 1 kural notunun en üstünde; 3 sn'de okunacak kadar kısa kalsın.
 */
export const CERCEVE = 'Belediyenin yapı denetçisisin. Deprem her an olabilir.';

/**
 * İlk yanlış karardan sonra fişte bir kez (G24, takım kararı): inceleme isteğe bağlı, ceza yok.
 */
export const INCELE_IPUCU = 'Space ile incele, kusuru kanıtla';

/**
 * Zarf alınıp istenen kaşe vurulduğunda yanlış kararın fişinde (G51): inceleme ipucunun yerine; seçim bilinçliydi.
 */
export const ZARF_FIS = 'Zarfı aldın; istenen kaşeyi vurdun.';

/**
 * Yeni araç ipuçları (G48, lider metni): düğmenin sağında "<" ile; düğmenin solunda gösterilirse "<" düşer, sona ">"
 * gelir (GameScene). Araç bir kez kullanılınca oyunun geri kalanında çıkmaz.
 */
export const ARAC_IPUCU = {
  sor: '< SOR: kusuru mal sahibine sor',
  iste: '< İSTE: eksik belgenin aslını iste',
  saha: '< SAHA: Schmidt çekiciyle beton ölç',
} as const;

/** İnceleme modunda seçilen iki öğe bir kusur kanıtlamıyorsa (G3). */
export const TUTARSIZLIK_YOK = 'Tutarsızlık yok';

/**
 * G60 (lider metni): kusur yok ama seçim başka binanın belgesindeki bir değere dokunuyor (mesafeleri ve değerleri
 * sayılmaz): "Tutarsızlık yok" yerine.
 */
export const BASKA_BELGE_IPUCU = 'Bu belge başka binaya ait: ada/parseli ruhsatla karşılaştır';

/**
 * G67 (lider metni): rapor kuralı dosyanın kendi karot ya da zemin etüdü kartıyla (gişeden gelmemiş) eşleştirildiğinde
 * "Tutarsızlık yok" yerine.
 */
export const GISE_RAPORU_IPUCU = 'Bu kural gişeden getirilen raporlar için';

/** Saha testi bitince tezgâhtaki saatin yanında kısa süre (G24): testin zaman bedeli. {dk}: dakika. */
export const SAHA_SURE = '+{dk} dk';

/** SOR cevabının türü: bahane (bilgi yok), itiraf (kusuru doğrular), zarf (rüşvet teklifi). */
export type SorTuru = 'bahane' | 'itiraf' | 'zarf';

/** Sorulabilen kusurlar (eksik belgede SOR yerine İSTE). */
export type SorulanKusur = Exclude<KusurId, 'karotYok' | 'zeminEtuduYok' | 'sahaBeton'>;

/** İSTE cevabının türü: gerçek raporu getirir, sahte rapor getirir ya da getiremez. */
export type IsteTuru = 'gercek' | 'sahte' | 'yok';

/**
 * Zarfın bedeli (G22): kişinin istediği damga zarfın üstünde küçük not. {damga}: istenen damganın adı (GameScene
 * doldurur).
 */
export const ZARF_NOT = '{damga} lütfen';
/** Zarfın altındaki düğmeler (sürükleme de çalışır: çekmeceye = al, gişeye = geri ver). */
export const ZARF_DUGME = { al: 'AL', geri: 'GERİ VER' };
/** Kaşelikteki ipucu: zarf karar beklerken ve zarf alındıktan sonra. */
export const ZARF_IPUCU = { bekliyor: 'Önce zarfa karar ver. Müfettiş gelebilir.', alindi: 'Zarf aldın: {damga}' };
/** Zarf alınan binanın etiket eki (öncü sarsıntı, kısa yol depremi) ve gün sonu raporundaki işaret. */
export const ZARF_ETIKET = 'ZARF';

/**
 * Saha testi (G19, Schmidt çekici): mini oyunun ve saha notunun yazıları.
 * {adres}: binanın adresi, {n}: okuma sayısı, {hak}: kalan hak.
 */
export const SAHA_METIN = {
  dugme: 'SAHA',
  hakYok: 'HAK YOK',
  sayac: 'SAHA {hak}',
  baslik: 'SAHA TESTİ',
  alt: 'Schmidt çekici · {adres}',
  ipucu: 'Temiz yüzeye vur, sıva ve çatlaktan kaçın',
  ibre: 'GERİ TEPME (R)',
  okumalar: 'Geçerli okumalar',
  gecersiz: 'Geçersiz: {n} (sayılmadı)',
  siva: 'GEÇERSİZ · SIVA',
  catlak: 'GEÇERSİZ · ÇATLAK',
  hak: 'Kalan hak: {hak}',
  vazgec: 'VAZGEÇ (Esc)',
  notuAl: 'NOTU AL',
  ortalama: 'Ortalama R',
  tahmin: 'Tahmini dayanım',
  notBaslik: 'SAHA NOTU',
  notAlt: 'Schmidt çekici, {n} okuma',
  tarih: 'Tarih',
  /** Saha notunun altındaki uyarı (G31, mühendislik doğruluğu: Schmidt çekici yüzey sertliği ölçer, TS EN 13791). */
  onDegerlendirme: ['Ön değerlendirme;', 'karotla doğrulanmalı.'],
} as const;

/** Gazete ve sonuç ekranındaki zarf izi (yalnızca kabul edilen zarfın binası depremde hasar gördüyse). */
export const ZARF_GAZETE = 'Denetçinin masasında zarf bulundu';

/**
 * Müfettiş ve dürüstlük övgüsü (G57, lider kararı; metinler aynen). Gün sonu raporu: yakalanan her zarf için bir
 * kırmızı satır; zarf alınıp yanlış damgalanan dosya olduğu hâlde yakalanan yoksa soluk satır. Para tablosunda ayrı
 * satır. Gazete: yakalanan zarf varsa kırmızı, geri verilen zarf varsa yeşil satır. Sonuç ekranı: sayıya göre.
 */
export const MUFETTIS_RAPOR = (bina: string, ceza: number): string => `Müfettiş: ${bina} dosyasındaki zarf ortaya çıktı. Zarfa el konuldu, ${ceza} TL ceza.`;
export const MUFETTIS_GELMEDI = 'Müfettiş bu akşam gelmedi.';
export const MUFETTIS_CEZA_SATIR = 'Müfettiş cezası';
/**
 * G57b: gün sonu raporundaki zarf özeti, el konan zarf varsa (lider kararı; metinler aynen). k: kabul edilen zarf
 * sayısı (el konanlar dahil), m: el konan, tutar: el konmayanların toplamı.
 */
export const MUFETTIS_ZARF_OZET = (tutar: string, k: number, m: number): string =>
  m >= k ? (m > 1 ? `Zarf: ${m} zarfa el konuldu` : 'Zarf: el konuldu') : `Zarf: +${tutar} (${k} kabul, ${m} el konuldu)`;
export const MUFETTIS_GAZETE ='Müfettiş denetçinin zarfına el koymuştu';
/**
 * G65: müfettiş gün sonunda gişeye gelir (takım kararı; metinler aynen). Balon başlığı ve cümlesi; binalar dosya
 * sırasıyla ("Bina 03", "Bina 03 ve Bina 05", "Bina 05, Bina 07 ve Bina 09"), ceza toplamı (TL).
 */
export const MUFETTIS_BASLIK = 'MÜFETTİŞ';
export const MUFETTIS_GISE = (binalar: readonly string[], ceza: number): string => {
  const son = binalar[binalar.length - 1];
  const liste = binalar.length > 1 ? `${binalar.slice(0, -1).join(', ')} ve ${son}` : son;
  return binalar.length > 1
    ? `${liste} dosyalarındaki zarfları gördüm. El koyuyorum; ${ceza} TL ceza.`
    : `${liste} dosyasındaki zarfı gördüm. El koyuyorum; ${ceza} TL ceza.`;
};
export const RET_GAZETE = 'Denetçi rüşveti geri çevirdi';
/** G64: kabul edilen zarf da varsa (kabul > 0) ret satırı kaç zarfın geri çevrildiğini söyler (lider kararı; metinler aynen). */
export const RET_SONUC = (n: number, kabul = 0): string =>
  kabul > 0 ? `${n} zarfı geri çevirdin` : n === 1 ? 'Rüşveti geri çevirdin' : `Rüşveti ${n} kez geri çevirdin`;

/**
 * Oyunun takvimi: gün 1'in tarihi. Getirilen raporun tarihi bununla karşılaştırılır; kural kitabında "bugün"
 * olarak yazar.
 */
export const TAKVIM = { yil: 2026, ay: 10, gun: 19 };

/** Oyun gününün tarihi (gg.aa.yyyy). gunFark: o günden kaç gün sonra (eksi: önce). */
export function tarih(gun: number, gunFark = 0): string {
  const d = new Date(Date.UTC(TAKVIM.yil, TAKVIM.ay - 1, TAKVIM.gun + gun - 1 + gunFark));
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

// ---- Gişe diyaloğunun seçimi (G33) ----

/** Cümlelerdeki değişkenler (diyalog-metin.ts başındaki açıklama). */
export type Degisken = 'kat' | 'yil' | 'ada' | 'bina' | 'para';
export type Degiskenler = Partial<Record<Degisken, string>>;

/**
 * Binanın değişkenleri: ruhsatta (kâğıtta) yazan kat, yapım yılı ve ada / parsel, bina adı; zarf varsa tutarı.
 * Doldurulamayan değişken (ör. zarfsız cümlede {para}) yoktur; o cümle atlanır.
 */
export function degiskenler(bina: Bina | undefined, para?: number): Degiskenler {
  const d: Degiskenler = {};
  const r = bina?.belgeler.ruhsat;
  if (r) {
    d.kat = String(r.kat);
    d.yil = String(r.yil);
    if (r.ada) d.ada = r.ada;
  }
  if (bina?.adres) d.bina = bina.adres;
  // Bölünmez boşluk (G31): balonda "80" ile "TL" ayrı satırlara düşmesin.
  if (para !== undefined) d.para = `${para}\u00A0TL`;
  return d;
}

/** Değişkenleri doldur; biri eksikse null (ekranda asla "{...}" görünmesin). */
export function doldur(s: string, d: Degiskenler): string | null {
  let eksik = false;
  const out = s.replace(/\{(\w+)\}/g, (_m, ad: string) => {
    const v = d[ad as Degisken];
    if (v === undefined) eksik = true;
    return v ?? '';
  });
  return eksik ? null : out;
}

/** FNV-1a: dizgiden 32 bit sayı. */
export function ozet(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Oyun RNG'sinden bağımsız küçük üreteç (mulberry32). */
function uretec(tohum: number): () => number {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** (tohum, anahtar) için 0-1 arası sabit sayı: ör. SOR cevabına giriş eklensin mi. */
export function sabitOran(tohum: number, anahtar: string): number {
  return uretec(ozet(anahtar) ^ Math.imul(tohum >>> 0, 0x9e3779b1))();
}

interface Deste {
  sira: number[];
  i: number;
  tur: number;
}

/**
 * Tekrarsız cümle destesi (G33): her liste (anahtar, ör. 'selam:kibar', 'sor:kacakKat:bahane') oturum boyunca
 * karıştırılmış bir destedir. Deste bitmeden aynı cümle ikinci kez çıkmaz; bitince yeniden karıştırılır ve önceki
 * destenin son cümlesi yenisinin ilki olmaz. Karıştırma (oyun tohumu, anahtar, tur) üçlüsünden deterministik; oyun
 * RNG'sini tüketmez. Günler arasında sıfırlanmaz (aynı oyun tohumu sürdükçe).
 */
export class Desteler {
  private readonly desteler = new Map<string, Deste>();

  constructor(readonly tohum: number) {}

  private karistir(anahtar: string, n: number, tur: number, son?: number): number[] {
    const r = uretec(ozet(`${anahtar}#${tur}`) ^ Math.imul(this.tohum >>> 0, 0x9e3779b1));
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (n > 1 && a[0] === son) {
      const j = 1 + Math.floor(r() * (n - 1));
      [a[0], a[j]] = [a[j], a[0]];
    }
    return a;
  }

  /** Sıradaki cümle (değişkenleri dolu). Doldurulamayan cümle atlanır, desteden sonraki alınır. */
  cek(anahtar: string, liste: readonly string[], d: Degiskenler = {}): string {
    const n = liste.length;
    if (n === 0) return '';
    let x = this.desteler.get(anahtar);
    if (!x || x.sira.length !== n) {
      x = { sira: this.karistir(anahtar, n, 0), i: 0, tur: 0 };
      this.desteler.set(anahtar, x);
    }
    for (let k = 0; k < n * 2; k++) {
      if (x.i >= n) {
        const son = x.sira[n - 1];
        x.tur++;
        x.sira = this.karistir(anahtar, n, x.tur, son);
        x.i = 0;
      }
      const s = doldur(liste[x.sira[x.i++]], d);
      if (s !== null) return s;
    }
    // Hiçbiri doldurulamadı (olmamalı): değişkensiz ilk cümle, yoksa değişkenler silinmiş hali.
    return liste.find((s) => !s.includes('{')) ?? liste[0].replace(/\s*\{\w+\}/g, '');
  }

  /** Son çekilen cümleyi desteye geri koy (ör. balona sığmadığı için kullanılmayan giriş). */
  geriKoy(anahtar: string): void {
    const x = this.desteler.get(anahtar);
    if (x && x.i > 0) x.i--;
  }
}

let aktifDeste: Desteler | undefined;

/** Oyunun (tohumun) desteleri: aynı tohum sürdükçe günler arasında aynı desteler. */
export function desteler(tohum: number): Desteler {
  if (!aktifDeste || aktifDeste.tohum !== tohum) aktifDeste = new Desteler(tohum);
  return aktifDeste;
}
