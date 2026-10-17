// @beyan metin
import type { Damga } from './building';
import { ZARF_GAZETE } from './diyalog';
import type { DepremBinaSonucu, DepremOzeti } from './session';

/**
 * Büyük deprem, gazete ve sonuç ekranının metinleri. HEPSİ YER TUTUCU: TODO(takım) gerçek metinleri yazacak.
 * Ton (GDD): kurban gösterilmez, sayı verilmez; odak önlemede. Sayılar yalnızca bina sayısıdır.
 */

/** Gece geçişindeki saat. */
export const GECE_SAATI = '[04.17]';

export const GAZETE_ADI = '[GAZETE ADI]';
export const GAZETE_TARIH = '[Şehir adı] · [Tarih] · [Sabah baskısı]';
export const FOTO_ALTI = '[Fotoğraf: deprem sonrası sokak]';
/** Gazetedeki doldurma haberlerin başlıkları (metni gri çizgilerle temsil edilir). */
export const DOLGU_BASLIKLAR = ['[Haber başlığı]', '[Haber başlığı]', '[Haber başlığı]'];

const DAMGA_AD: Record<Damga, string> = { guvenli: 'GÜVENLİ', guclendir: 'GÜÇLENDİR', bosalt: 'BOŞALT', iade: 'İADE' };
const no = (b: DepremBinaSonucu): string => `Bina ${String(b.no).padStart(2, '0')}`;

const durumAdi = (b: DepremBinaSonucu): string =>
  b.coktu ? 'çöktü' : b.durum === 'agirHasar' ? 'ağır hasarlı' : b.durum === 'hasarli' ? 'hasarlı' : 'ayakta';

/** Denetimden geçmiş mi, yoksa İADE edilip denetlenmeden mi kalmış. */
const gecmis = (b: DepremBinaSonucu): string =>
  b.damga === 'iade' ? 'iade edilmişti, denetlenmeden kaldı' : `denetimden ${DAMGA_AD[b.damga]} geçmişti`;

/** Gazetede zarf alınan binanın satırına eklenen kısım (yer tutucu). */
const ZARF_SATIR_EK = ', zarf alınmıştı';

/** Ana manşet: duruma göre dört şablondan biri. */
export function manset(o: DepremOzeti): string {
  if (o.toplam === 0) return '[Manşet: sokakta denetlenmiş bina yoktu]';
  if (o.doluCoken > 0 && o.doluCoken === o.iadeCoken) return '[Manşet: denetlenmeden kalan binalar çöktü]';
  if (o.doluCoken > 0) return '[Manşet: denetimden geçen binalar çöktü]';
  if (o.coken > 0) return '[Manşet: çöken binalar boşaltılmıştı]';
  if (o.hasarli > 0) return '[Manşet: sokakta hasar var, çöken yok]';
  return '[Manşet: sokak ayakta]';
}

/**
 * Sayı satırı (bina sayıları). Sonuç ekranıyla aynı tanımlar (G5b): "içi boş" çökenlerin boşaltılmış olanları,
 * "Boşaltılmış (toplam)" ayakta, hasarlı ve çöken bütün boşaltılmış binalar.
 */
export function sayiSatiri(o: DepremOzeti): string {
  return `[Ayakta: ${o.ayakta} bina · Hasarlı: ${o.hasarli} · Çöken: ${o.coken}${o.coken > 0 ? ` (içi boş: ${o.cokenBos})` : ''} · Boşaltılmış (toplam): ${o.bos}${o.iade > 0 ? ` · İade edilmiş: ${o.iade}` : ''}]`;
}

/** Sonucun ağırlığı (sıralama): çöken, ağır hasarlı, hasarlı, ayakta. */
const agirlik = (b: DepremBinaSonucu): number => (b.coktu ? 3 : b.durum === 'agirHasar' ? 2 : b.durum === 'hasarli' ? 1 : 0);

/**
 * Öne çıkan binalar (en çok 3 satır) ve fotoğrafın odaklanacağı bina (ilk satırınki). oncelik (G21 kısa yol):
 * oyuncunun kendi binaları önce, en ağır sonuçtan başlayarak.
 */
export function oneCikanlar(s: readonly DepremBinaSonucu[], oncelik?: ReadonlySet<string>): { satirlar: string[]; odak?: DepremBinaSonucu } {
  const out: { b: DepremBinaSonucu; metin: string }[] = [];
  // Zarf alınan binanın satırında zarf da geçer (G23): "[Bina 02 çöktü; denetimden GÜVENLİ geçmişti, zarf alınmıştı]".
  const ekle = (b: DepremBinaSonucu | undefined, metin: (b: DepremBinaSonucu) => string): void => {
    if (b && out.length < 3 && !out.some((x) => x.b === b)) out.push({ b, metin: b.zarf ? metin(b).replace(/\]$/, `${ZARF_SATIR_EK}]`) : metin(b) });
  };
  if (oncelik)
    for (const b of s.filter((x) => oncelik.has(x.dosyaId)).sort((a, c) => agirlik(c) - agirlik(a) || a.no - c.no))
      ekle(b, (b) => (b.bos ? `[${no(b)} ${durumAdi(b)}; boşaltılmıştı, içinde kimse yoktu]` : `[${no(b)} ${durumAdi(b)}; ${gecmis(b)}]`));
  const doluCoken = s.filter((b) => b.coktu && !b.bos);
  ekle(doluCoken[0], (b) => `[${no(b)} çöktü; ${gecmis(b)}]`);
  // İADE edilen bina: oyuncunun denetlemeden bıraktığı (bilinçli) risk; gazetede ayrı satır.
  ekle(
    s.find((b) => b.damga === 'iade' && !b.coktu),
    (b) => `[${no(b)}: iade edilmişti, denetlenmeden kaldı; ${durumAdi(b)}]`,
  );
  ekle(
    s.find((b) => b.coktu && b.bos),
    (b) => `[${no(b)} çöktü; boşaltılmıştı, içinde kimse yoktu]`,
  );
  ekle(
    s.find((b) => b.damga === 'guclendir' && b.kusurlu && !b.coktu && b.durum !== 'agirHasar'),
    (b) => `[${no(b)} ${b.durum === 'ayakta' ? 'ayakta' : 'hasarlı ama ayakta'}: güçlendirilmişti]`,
  );
  ekle(doluCoken[1], (b) => `[${no(b)} çöktü; ${gecmis(b)}]`);
  ekle(
    s.find((b) => !b.coktu && !b.bos && b.durum === 'agirHasar'),
    (b) => `[${no(b)} ağır hasarlı; ${gecmis(b)}]`,
  );
  ekle(
    s.find((b) => b.damga === 'guvenli' && !b.kusurlu && b.durum === 'ayakta'),
    (b) => `[${no(b)} ayakta: denetimden GÜVENLİ geçmişti, kusuru yoktu]`,
  );
  return { satirlar: out.map((x) => x.metin), odak: out[0]?.b };
}

/**
 * Sonuç ekranındaki değerlendirme satırı (üç şablon). Zarf (G22): zarf alınan bina hasar gördüyse satıra eklenir
 * ve ton kötüye döner; zarf alındı ama binalar sağlamsa yalnızca not düşülür.
 */
export function degerlendirme(o: DepremOzeti): { metin: string; ton: 'iyi' | 'orta' | 'kotu' } {
  const z = o.zarfHasar > 0 ? ` · ${zarfSonucu('zarf aldığın', o.zarfCoken, o.zarfHasar - o.zarfCoken)}` : o.zarf > 0 ? ' · zarf aldın' : '';
  const d = (metin: string, ton: 'iyi' | 'orta' | 'kotu'): { metin: string; ton: 'iyi' | 'orta' | 'kotu' } => ({
    metin: `[Değerlendirme: ${metin}${z}]`,
    ton: o.zarfHasar > 0 ? 'kotu' : ton,
  });
  // Manşetle aynı durum (G23b): damgalı bina yoksa "denetlediğin bina yoktu".
  if (o.toplam === 0) return d('denetlediğin bina yoktu', 'orta');
  if (o.doluCoken > 0 && o.doluCoken === o.iadeCoken) return d('iade ettiğin binalar denetlenmeden çöktü', 'kotu');
  if (o.doluCoken > 0) return d('onayladığın binalar çöktü', 'kotu');
  if (o.doluAgir > 0) return d('yıkım yok ama ağır hasar var', 'orta');
  return d('sokak depreme hazırdı', 'iyi');
}

/**
 * Zarf izi (G17): kabul edilen zarfın binası depremde hasar gördüyse (ya da çöktüyse) gazetede bir satır.
 * Kabul edilmediyse ya da binalar sağlamsa null.
 */
export function zarfSatiri(s: readonly DepremBinaSonucu[]): string | null {
  return s.some((b) => b.zarf && (b.coktu || b.durum !== 'ayakta')) ? ZARF_GAZETE : null;
}

/**
 * Zarf alınan binaların deprem sonucu (G23: binanın sonucuna göre; çöken "çöktü", ayakta kalıp hasar gören
 * "hasar gördü"). kim: "zarf alınan" ya da "zarf aldığın".
 */
function zarfSonucu(kim: string, coken: number, hasarli: number): string {
  if (coken > 0 && hasarli > 0) return `${kim} binalardan ${coken} tanesi çöktü, ${hasarli} tanesi hasar gördü`;
  if (coken > 0) return `${kim} ${coken} bina depremde çöktü`;
  return `${kim} ${hasarli} bina depremde hasar gördü`;
}

/** Sonuç ekranındaki zarf satırı (kabul edilen zarf yoksa null). */
export function zarfOzeti(adet: number, toplam: number, s: readonly DepremBinaSonucu[]): string | null {
  if (adet === 0) return null;
  const coken = s.filter((b) => b.zarf && b.coktu).length;
  const hasarli = s.filter((b) => b.zarf && !b.coktu && b.durum !== 'ayakta').length;
  return `[Kabul edilen zarf: ${adet}, toplam ${toplam} TL${coken + hasarli > 0 ? ` · ${zarfSonucu('zarf alınan', coken, hasarli)}` : ''}]`;
}

// ---- G21 kısa yol ("Depremi şimdi yaşa") ----

/** Gün 1 raporundaki kısa yol düğmesi ve açıklaması. */
export const KISA_YOL_DUGME = '[DEPREMİ ŞİMDİ YAŞA]';
export const KISA_YOL_ACIKLAMA = '[5 gün sonra büyük deprem olacak. Şimdi görmek ister misin?]';
/** Depremde oyuncunun binalarının üstündeki etiket. */
export const SENIN_DAMGAN = '[SENİN DAMGAN]';

/** Öncü sarsıntıda çatlayan binanın etiketi (G5b; pencerede damga etiketinin üstünde). */
export function oncuEtiketi(bos: boolean): string {
  return bos ? '[ÇATLADI · İÇİ BOŞ]' : '[ÇATLADI]';
}

/** Depremde oyuncunun binasının sonucu (etiket). */
export function sonucEtiketi(b: DepremBinaSonucu): string {
  if (b.bos && b.coktu) return '[ÇÖKTÜ · İÇİ BOŞTU]';
  return b.coktu ? '[ÇÖKTÜ]' : b.durum === 'agirHasar' ? '[AĞIR HASAR]' : b.durum === 'hasarli' ? '[HASARLI]' : '[AYAKTA]';
}

/** Sonuç ekranında oyuncunun binalarının özeti. */
export function seninBinalarin(o: DepremOzeti): string {
  return `[Senin binaların: ayakta ${o.ayakta}, hasarlı ${o.hasarli}, çöken ${o.coken}]`;
}

/** Sonuç ekranındaki kısa yol başlıkları. */
export const KISA_SONUC = {
  sag: '[GÜN 1 + DEPREM]',
  alt: '[Gün 1 ve büyük deprem: senin binaların ve sokak]',
  senin: 'SENİN BİNALARIN',
  sokak: (toplam: number, senin: number): string => `BÜYÜK DEPREM · SOKAK [${toplam} bina, ${senin} tanesi senin]`,
};
