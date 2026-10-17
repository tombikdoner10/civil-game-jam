// @beyan metin
import { EV_KADEME, type AlimDurumu, type EvDurum, type EvKalem, type EvSonucu } from './ev';

/**
 * Kendi evinin hazırlığı (G42; G43 kademeli) metinleri. HEPSİ YER TUTUCU: TODO(takım) gerçek metinleri yazacak
 * (TASKS T35). Ton (GDD T4): kurban yok, sayı yok; odak hazırlıkta. Tekil cümleler. Kademe sayaçları ("1/3") yalnızca
 * durum etiketlerinde (kart, taksit satırı), cümlelerde değil.
 */

/** Gün sonu raporunun yanındaki "Evin" kâğıdı. */
export const EV_BASLIK = '[EVİN]';
export const EV_ALT = '[Ailenin deprem hazırlığı]';
/** Kalemlerin adı (gerçek hazırlık adımları: çanta, sabitleme, güçlendirme). */
export const EV_KALEM_METIN: Record<EvKalem, { ad: string }> = {
  canta: { ad: '[Deprem çantası]' },
  sabitleme: { ad: '[Eşya sabitleme]' },
  guclendirme: { ad: '[Güçlendirme payı]' },
};
/** Her kalemin üç kademesi (sırayla alınır): kartta sıradaki kademenin adı ve kısa açıklaması. */
export const EV_KADEME_METIN: Record<EvKalem, readonly { ad: string; aciklama: string }[]> = {
  canta: [
    { ad: '[Su ve fener]', aciklama: '[Su, el feneri, düdük]' },
    { ad: '[İlk yardım]', aciklama: '[İlk yardım çantası, ilaçlar]' },
    { ad: '[Aile planı]', aciklama: '[Buluşma yeri ve haberleşme planı]' },
  ],
  sabitleme: [
    { ad: '[Dolaplar]', aciklama: '[Dolapları duvara sabitle]' },
    { ad: '[Beyaz eşya]', aciklama: '[Buzdolabını ve makineleri sabitle]' },
    { ad: '[Raflar ve camlar]', aciklama: '[Rafları kilitle, camlara film]' },
  ],
  guclendirme: [
    { ad: '[Proje ve etüt]', aciklama: '[Mühendis incelemesi ve proje]' },
    { ad: '[Kolonlar]', aciklama: '[Kolonların sarılması]' },
    { ad: '[Perde duvar]', aciklama: '[Perde duvar ve temel]' },
  ],
};
/** Kalem tamamlanınca kartta kademe satırının yerine. */
export const EV_TAMAM_METIN: Record<EvKalem, { ad: string; aciklama: string }> = {
  canta: { ad: '[Çanta hazır]', aciklama: '[Ailen ne yapacağını biliyor]' },
  sabitleme: { ad: '[Ev sabitlendi]', aciklama: '[Devrilecek bir şey kalmadı]' },
  guclendirme: { ad: '[Bütün taksitler ödendi]', aciklama: '[Binanın güçlendirmesi tamam]' },
};
/** Güçlendirme kartında sıradaki taksit (n: 1..3). */
export const evTaksitEtiketi = (n: number): string => `[Taksit ${n}/${EV_KADEME}]`;
/** Kartta sıradaki kademenin başlığı: güçlendirmede taksit etiketiyle. */
export function evKademeBasligi(k: EvKalem, n: number): string {
  const ad = EV_KADEME_METIN[k][n - 1].ad;
  return k === 'guclendirme' ? `${evTaksitEtiketi(n)} ${ad}` : ad;
}
/** Kalemin durumu (rapordaki etiket). */
export const EV_ALIM_ETIKET: Record<AlimDurumu, string> = {
  tamam: '[TAMAM]',
  alinabilir: '[AL]',
  yetmiyor: '[PARA YETMİYOR]',
};
/** Kâğıdın altındaki ipucu ve para satırları. */
export const EV_IPUCU = '[1 · 2 · 3 ya da tıkla]';
export const EV_PARAN = '[Paran]';
export const evHarcananSatiri = (tl: string): string => `[Evine harcanan: ${tl}]`;
/** Gazete ve sonuçta güçlendirme payının taksit durumu. */
export const evTaksitSatiri = (n: number): string => `[Güçlendirme: ${n}/${EV_KADEME} taksit]`;

/** Gazete kutusu ve sonuç ekranındaki başlık. */
export const EV_GAZETE_BASLIK = '[Senin evin]';
export const EV_SONUC_BASLIK = 'SENİN EVİN';
/** 5 günlük yolda evin, gün 5'te damgaladığın kendi apartmanınsa. */
export const EV_KENDI_BINA = '[Gün 5\'te kendi apartmanını sen damgalamıştın.]';
/** Kendi apartmanın güçlendirme payıyla (bütün taksitler) güçlendirildiyse (damgası GÜVENLİ ya da İADE'ydi). */
export const EV_PAYLI = '[Güçlendirme payınla bina güçlendirilmişti.]';

/** Evin depremdeki durumu. */
export const EV_DURUM_METIN: Record<EvDurum, string> = {
  saglam: '[Evin hasarsız kaldı.]',
  hafif: '[Evin hafif hasarla ayakta kaldı.]',
  hasarli: '[Evin hasar aldı ama ayakta kaldı.]',
  agir: '[Evin ağır hasar aldı.]',
  coktu: '[Evin çöktü.]',
  coktuBos: '[Evin çöktü; bina boşaltılmıştı.]',
};
/** Güçlendirme payı, ödenen taksite göre (0..3). */
export const EV_GUCLENDIRME_METIN: readonly string[] = [
  '[Binanın güçlendirmesine katılmamıştın.]',
  '[Güçlendirme çalışması başlamıştı ama bitmemişti.]',
  '[Güçlendirmenin çoğu bitmişti.]',
  '[Güçlendirme tamamlanmıştı.]',
];
/** Deprem çantası, kademeye göre (0..3). */
export const EV_CANTA_METIN: readonly string[] = [
  '[Ailen toplanma alanına hazırlıksız çıktı.]',
  '[Ailenin yanında su ve fener vardı.]',
  '[Su, fener ve ilk yardım çantası yanlarındaydı.]',
  '[Ailen buluşma planıyla toplanma alanında buluştu.]',
];
/** Eşya sabitleme, kademeye göre (0..3). */
export const EV_SABITLEME_METIN: readonly string[] = [
  '[Dolap devrildi.]',
  '[Dolaplar devrilmedi ama buzdolabı kaydı.]',
  '[Dolaplar ve beyaz eşya yerinde kaldı; raflar döküldü.]',
  '[Evde hiçbir şey devrilmedi.]',
];
/** Zarf bağı: bir kalemin en az bir kademesi zarf parası olmadan alınamazdı (tek kalem: kalemin cümlesi; birden çok: genel). */
export const EV_ZARF_METIN: Record<EvKalem, string> & { birden: string } = {
  canta: '[Deprem çantasını zarf parasıyla hazırladın.]',
  sabitleme: '[Eşyaları zarf parasıyla sabitledin.]',
  guclendirme: '[Güçlendirme payını zarf parasıyla ödedin.]',
  birden: '[Evinin hazırlığını zarf parasıyla yaptın.]',
};

/** "Senin evin" cümleleri sırasıyla: evin durumu, güçlendirme, çanta, sabitleme ve (varsa) zarf yan cümlesi. */
export function evCumleleri(s: EvSonucu): string[] {
  const out = [EV_DURUM_METIN[s.durum], EV_GUCLENDIRME_METIN[s.guclendirme], EV_CANTA_METIN[s.canta], EV_SABITLEME_METIN[s.sabitleme]];
  const z = evZarfCumlesi(s);
  if (z) out.push(z);
  return out;
}

export function evZarfCumlesi(s: EvSonucu): string | null {
  if (s.zarfla.length === 0) return null;
  return s.zarfla.length === 1 ? EV_ZARF_METIN[s.zarfla[0]] : EV_ZARF_METIN.birden;
}
