// @beyan metin
import type { EvDurum, EvKalem, EvSonucu, AlimDurumu } from './ev';

/**
 * Kendi evinin hazırlığı (G42) metinleri. HEPSİ YER TUTUCU: TODO(takım) gerçek metinleri yazacak (TASKS T35).
 * Ton (GDD T4): kurban yok, sayı yok; odak hazırlıkta. Tekil cümleler.
 */

/** Gün sonu raporunun yanındaki "Evin" kâğıdı. */
export const EV_BASLIK = '[EVİN]';
export const EV_ALT = '[Ailenin deprem hazırlığı]';
/** Kalemlerin adı ve kısa açıklaması (gerçek hazırlık adımları: çanta, sabitleme, güçlendirme). */
export const EV_KALEM_METIN: Record<EvKalem, { ad: string; aciklama: string }> = {
  canta: { ad: '[Deprem çantası]', aciklama: '[Su, el feneri, düdük, ilk yardım]' },
  sabitleme: { ad: '[Eşya sabitleme]', aciklama: '[Dolapları duvara sabitle]' },
  guclendirme: { ad: '[Güçlendirme payı]', aciklama: '[Binanın güçlendirmesine katıl]' },
};
/** Kalemin durumu (rapordaki etiket). */
export const EV_ALIM_ETIKET: Record<AlimDurumu, string> = {
  alindi: '[ALINDI]',
  alinabilir: '[AL]',
  yetmiyor: '[PARA YETMİYOR]',
};
/** Kâğıdın altındaki ipucu ve para satırları. */
export const EV_IPUCU = '[1 · 2 · 3 ya da tıkla]';
export const EV_PARAN = '[Paran]';
export const evHarcananSatiri = (tl: string): string => `[Evine harcanan: ${tl}]`;

/** Gazete kutusu ve sonuç ekranındaki başlık. */
export const EV_GAZETE_BASLIK = '[Senin evin]';
export const EV_SONUC_BASLIK = 'SENİN EVİN';
/** 5 günlük yolda evin, gün 5'te damgaladığın kendi apartmanınsa. */
export const EV_KENDI_BINA = '[Gün 5\'te kendi apartmanını sen damgalamıştın.]';
/** Kendi apartmanın güçlendirme payıyla güçlendirildiyse (damgası GÜVENLİ ya da İADE'ydi). */
export const EV_PAYLI = '[Güçlendirme payınla bina güçlendirilmişti.]';

/** Evin depremdeki durumu. */
export const EV_DURUM_METIN: Record<EvDurum, string> = {
  saglam: '[Evin hasarsız kaldı.]',
  hafif: '[Evin hafif hasarla ayakta kaldı.]',
  agir: '[Evin ağır hasar aldı.]',
  coktu: '[Evin çöktü.]',
  coktuBos: '[Evin çöktü; bina boşaltılmıştı.]',
};
/** Deprem çantası. */
export const EV_CANTA_METIN = { var: '[Ailen toplanma alanına hazırlıklı çıktı.]', yok: '[Ailen toplanma alanına hazırlıksız çıktı.]' };
/** Eşya sabitleme. */
export const EV_SABITLEME_METIN = { var: '[Eşyalar devrilmedi.]', yok: '[Dolap devrildi.]' };
/** Zarf bağı: zarf parası olmadan alınamayacak kalem alındıysa (tek kalem: kalemin cümlesi; birden çok: genel). */
export const EV_ZARF_METIN: Record<EvKalem, string> & { birden: string } = {
  canta: '[Deprem çantasını zarf parasıyla aldın.]',
  sabitleme: '[Eşyaları zarf parasıyla sabitledin.]',
  guclendirme: '[Zarf parasıyla evini güçlendirdin.]',
  birden: '[Evinin hazırlığını zarf parasıyla yaptın.]',
};

/** "Senin evin" cümleleri sırasıyla: evin durumu, çanta, sabitleme ve (varsa) zarf yan cümlesi. */
export function evCumleleri(s: EvSonucu): string[] {
  const out = [EV_DURUM_METIN[s.durum], s.canta ? EV_CANTA_METIN.var : EV_CANTA_METIN.yok, s.sabitleme ? EV_SABITLEME_METIN.var : EV_SABITLEME_METIN.yok];
  const z = evZarfCumlesi(s);
  if (z) out.push(z);
  return out;
}

export function evZarfCumlesi(s: EvSonucu): string | null {
  if (s.zarfla.length === 0) return null;
  return s.zarfla.length === 1 ? EV_ZARF_METIN[s.zarfla[0]] : EV_ZARF_METIN.birden;
}
