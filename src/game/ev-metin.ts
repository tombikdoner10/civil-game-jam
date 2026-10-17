// @beyan metin
import { EV_KADEME, type AlimDurumu, type EvDurum, type EvKalem, type EvSonucu } from './ev';

/**
 * Kendi evinin hazırlığı (G42; G43 kademeli) metinleri (G31: lider onaylı, docs/TAKIM_CEVAPLARI.md 6; AFAD
 * önerileriyle uyumlu). Ton (GDD T4): kurban yok, sayı yok; odak hazırlıkta. Tekil cümleler. Kademe sayaçları ("1/3")
 * yalnızca durum etiketlerinde (kart, taksit satırı), cümlelerde değil.
 */

/** Gün sonu raporunun yanındaki "Evin" kâğıdı (başlık şeridinde büyük harf, sonuçtaki SENİN EVİN gibi). */
export const EV_BASLIK = 'EVİN';
export const EV_ALT = 'Ailenin deprem hazırlığı';
/** Kalemlerin adı (gerçek hazırlık adımları: çanta, sabitleme, güçlendirme). */
export const EV_KALEM_METIN: Record<EvKalem, { ad: string }> = {
  canta: { ad: 'Deprem çantası' },
  sabitleme: { ad: 'Eşya sabitleme' },
  guclendirme: { ad: 'Güçlendirme payı' },
};
/** Her kalemin üç kademesi (sırayla alınır): kartta sıradaki kademenin adı ve kısa açıklaması. */
export const EV_KADEME_METIN: Record<EvKalem, readonly { ad: string; aciklama: string }[]> = {
  canta: [
    { ad: 'Su ve fener', aciklama: 'Su, fener, düdük' },
    { ad: 'İlk yardım', aciklama: 'İlk yardım çantası ve ilaçlar' },
    { ad: 'Aile planı', aciklama: 'Aile buluşma planı ve belge kopyaları' },
  ],
  sabitleme: [
    { ad: 'Dolaplar', aciklama: 'Dolapları duvara sabitle' },
    { ad: 'Beyaz eşya', aciklama: 'Beyaz eşya ve şofbeni sabitle' },
    { ad: 'Raflar ve camlar', aciklama: 'Raflar, ayna ve camlar (cam filmi)' },
  ],
  guclendirme: [
    { ad: 'proje', aciklama: 'Mühendis incelemesi ve proje' },
    { ad: 'kolon sarma', aciklama: 'Kolonların sarılması' },
    { ad: 'tamamlandı', aciklama: 'Perde duvar ve temel' },
  ],
};
/** Kalem tamamlanınca kartta kademe satırının yerine. */
export const EV_TAMAM_METIN: Record<EvKalem, { ad: string; aciklama: string }> = {
  canta: { ad: 'Çanta hazır', aciklama: 'Ailen ne yapacağını biliyor' },
  sabitleme: { ad: 'Ev sabitlendi', aciklama: 'Devrilecek bir şey kalmadı' },
  guclendirme: { ad: 'Bütün taksitler ödendi', aciklama: 'Binanın güçlendirmesi tamam' },
};
/** Güçlendirme kartında sıradaki taksit (n: 1..3). */
export const evTaksitEtiketi = (n: number): string => `Taksit ${n}/${EV_KADEME}`;
/** Kartta sıradaki kademenin başlığı: güçlendirmede taksit etiketiyle ("Taksit 1/3: proje"). */
export function evKademeBasligi(k: EvKalem, n: number): string {
  const ad = EV_KADEME_METIN[k][n - 1].ad;
  return k === 'guclendirme' ? `${evTaksitEtiketi(n)}: ${ad}` : ad;
}
/** Kartta alınan son kademe (G45): "Alındı: …" satırı; kalem tamamsa EV_ALINDI_TAMAM. */
export const evAlindiSatiri = (ad: string): string => `Alındı: ${ad}`;
export const EV_ALINDI_TAMAM = 'Tamamlandı';
/** Kalemin kartta okunacak "Alındı" satırı (n: alınan kademe sayısı); hiç alınmadıysa null. */
export function evAlindi(k: EvKalem, n: number): string | null {
  if (n <= 0) return null;
  if (n >= EV_KADEME) return EV_ALINDI_TAMAM;
  return evAlindiSatiri(EV_KADEME_METIN[k][n - 1].ad);
}
/** Kalemin durumu (rapordaki etiket). */
export const EV_ALIM_ETIKET: Record<AlimDurumu, string> = {
  tamam: 'TAMAM',
  alinabilir: 'AL',
  yetmiyor: 'PARA YETMİYOR',
};
/** Kâğıdın altındaki ipucu ve para satırları. */
export const EV_IPUCU = '1 · 2 · 3 ya da tıkla';
export const EV_PARAN = 'Paran';
export const evHarcananSatiri = (tl: string): string => `Evine harcanan: ${tl}`;
/** Gazete ve sonuçta güçlendirme payının taksit durumu. */
export const evTaksitSatiri = (n: number): string => `Güçlendirme: ${n}/${EV_KADEME} taksit`;

/** Gazete kutusu ve sonuç ekranındaki başlık. */
export const EV_GAZETE_BASLIK = 'Senin evin';
export const EV_SONUC_BASLIK = 'SENİN EVİN';
/** 5 günlük yolda evin, gün 5'te damgaladığın kendi apartmanınsa. */
export const EV_KENDI_BINA = 'Gün 5\'te kendi apartmanını sen damgalamıştın.';
/** Kendi apartmanın güçlendirme payıyla (bütün taksitler) güçlendirildiyse (damgası GÜVENLİ ya da İADE'ydi). */
export const EV_PAYLI = 'Güçlendirme payınla bina güçlendirilmişti.';

/** Evin depremdeki durumu. */
export const EV_DURUM_METIN: Record<EvDurum, string> = {
  saglam: 'Evin sağlam kaldı.',
  hafif: 'Evin hafif hasar aldı.',
  hasarli: 'Evin hasar aldı, onarım gerekiyor.',
  agir: 'Evin ağır hasar aldı, oturulamaz.',
  coktu: 'Evin çöktü.',
  coktuBos: 'Evin çöktü; bina boşaltılmıştı.',
};
/** Güçlendirme payı, ödenen taksite göre (0..3). */
export const EV_GUCLENDIRME_METIN: readonly string[] = [
  'Binanın güçlendirmesine katılmamıştın.',
  'Güçlendirme çalışması başlamıştı ama bitmemişti.',
  'Güçlendirmenin çoğu bitmişti.',
  'Güçlendirme tamamlanmıştı.',
];
/** Deprem çantası, kademeye göre (0..3). */
export const EV_CANTA_METIN: readonly string[] = [
  'Ailen gece sokağa hazırlıksız çıktı.',
  'Ailen su ve fenerle çıktı.',
  'Ailen ilk yardım çantasıyla çıktı.',
  'Ailen buluşma noktasında bir araya geldi.',
];
/** Eşya sabitleme, kademeye göre (0..3). */
export const EV_SABITLEME_METIN: readonly string[] = [
  'Dolaplar devrildi.',
  'Dolaplar yerinde, beyaz eşya kaydı.',
  'Büyük eşyalar yerinde, camlar kırıldı.',
  'Evde hiçbir şey devrilmedi.',
];
/** Zarf bağı: bir kalemin en az bir kademesi zarf parası olmadan alınamazdı (tek kalem: kalemin cümlesi; birden çok: genel). */
export const EV_ZARF_METIN: Record<EvKalem, string> & { birden: string } = {
  canta: 'Deprem çantasını zarf parasıyla hazırladın.',
  sabitleme: 'Eşyaları zarf parasıyla sabitledin.',
  guclendirme: 'Güçlendirme payını zarf parasıyla ödedin.',
  birden: 'Evinin hazırlığını zarf parasıyla yaptın.',
};

/**
 * Bağlam cümlesi (G45): soyut ev (kendi apartmanını damgalamadın) hasarlı ya da ağır hasarlı ve güçlendirmenin en çok
 * bir taksiti ödendiyse nedeni. Kusursuz dürüst oyuncunun yeşil değerlendirmesiyle kırmızı evi arasındaki çelişkiyi
 * açıklar: dürüst maaş güçlendirmeye zamanla yeter. G31 (lider kararı): yalnızca hiçbir kademe zarfla alınmadıysa.
 */
export const EV_BAGLAM_METIN = 'Güçlendirme tek maaşla bitmez.';

export function evBaglamCumlesi(s: EvSonucu): string | null {
  if (s.kendiBina || s.guclendirme > 1 || s.zarfla.length > 0) return null;
  return s.durum === 'hasarli' || s.durum === 'agir' ? EV_BAGLAM_METIN : null;
}

/** Ev çöktü mü (G45): çöken evde eşya sabitleme cümlesi gösterilmez (devrilen dolap çöken binada anlamsız). */
export function evCoktu(s: EvSonucu): boolean {
  return s.durum === 'coktu' || s.durum === 'coktuBos';
}

/**
 * "Senin evin" cümleleri sırasıyla: evin durumu, (varsa) bağlam cümlesi, güçlendirme, çanta, sabitleme (ev çöktüyse
 * yok; G45) ve (varsa) zarf yan cümlesi.
 */
export function evCumleleri(s: EvSonucu): string[] {
  const out = [EV_DURUM_METIN[s.durum]];
  const b = evBaglamCumlesi(s);
  if (b) out.push(b);
  out.push(EV_GUCLENDIRME_METIN[s.guclendirme], EV_CANTA_METIN[s.canta]);
  if (!evCoktu(s)) out.push(EV_SABITLEME_METIN[s.sabitleme]);
  const z = evZarfCumlesi(s);
  if (z) out.push(z);
  return out;
}

export function evZarfCumlesi(s: EvSonucu): string | null {
  if (s.zarfla.length === 0) return null;
  return s.zarfla.length === 1 ? EV_ZARF_METIN[s.zarfla[0]] : EV_ZARF_METIN.birden;
}
