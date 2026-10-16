// @beyan metin
import type { Damga } from './building';
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

/** Ana manşet: duruma göre dört şablondan biri. */
export function manset(o: DepremOzeti): string {
  if (o.toplam === 0) return '[Manşet: sokakta denetlenmiş bina yoktu]';
  if (o.doluCoken > 0 && o.doluCoken === o.iadeCoken) return '[Manşet: denetlenmeden kalan binalar çöktü]';
  if (o.doluCoken > 0) return '[Manşet: denetimden geçen binalar çöktü]';
  if (o.coken > 0) return '[Manşet: çöken binalar boşaltılmıştı]';
  if (o.hasarli > 0) return '[Manşet: sokakta hasar var, çöken yok]';
  return '[Manşet: sokak ayakta]';
}

/** Sayı satırı (bina sayıları). */
export function sayiSatiri(o: DepremOzeti): string {
  return `[Ayakta: ${o.ayakta} bina · Hasarlı: ${o.hasarli} · Çöken: ${o.coken} (boşaltılmış: ${o.cokenBos})${o.iade > 0 ? ` · İade edilmiş: ${o.iade}` : ''}]`;
}

/** Öne çıkan binalar (en çok 3 satır) ve fotoğrafın odaklanacağı bina (ilk satırınki). */
export function oneCikanlar(s: readonly DepremBinaSonucu[]): { satirlar: string[]; odak?: DepremBinaSonucu } {
  const out: { b: DepremBinaSonucu; metin: string }[] = [];
  const ekle = (b: DepremBinaSonucu | undefined, metin: (b: DepremBinaSonucu) => string): void => {
    if (b && out.length < 3 && !out.some((x) => x.b === b)) out.push({ b, metin: metin(b) });
  };
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

/** Sonuç ekranındaki değerlendirme satırı (üç şablon). */
export function degerlendirme(o: DepremOzeti): { metin: string; ton: 'iyi' | 'orta' | 'kotu' } {
  if (o.doluCoken > 0 && o.doluCoken === o.iadeCoken) return { metin: '[Değerlendirme: iade ettiğin binalar denetlenmeden çöktü]', ton: 'kotu' };
  if (o.doluCoken > 0) return { metin: '[Değerlendirme: onayladığın binalar çöktü]', ton: 'kotu' };
  if (o.doluAgir > 0) return { metin: '[Değerlendirme: yıkım yok ama ağır hasar var]', ton: 'orta' };
  return { metin: '[Değerlendirme: sokak depreme hazırdı]', ton: 'iyi' };
}
