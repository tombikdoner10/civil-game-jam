// @beyan metin
import type { Damga, KusurId } from './building';

/**
 * Gişedeki mal sahibinin cümleleri (G17). HEPSİ YER TUTUCU: TODO(takım) gerçek metinleri yazacak (TASKS T17).
 * Ton: saygılı, kaba ya da aşağılayıcı ifade yok; deprem kayıplarına gönderme yok. Seçim deterministik:
 * oturum bir sayı verir, liste uzunluğuna göre satır seçilir (src/game/kisi.ts). {para}: zarftaki miktar.
 */

/** Dosya gelince kısa selam. */
export const SELAM = ['[Merhaba, dosyam burada]', '[İyi günler, sıra bende]', '[Kolay gelsin, şu dosya]', '[Buyrun, belgelerim]'];

/** SOR cevabının türü: bahane (bilgi yok), itiraf (kusuru doğrular), zarf (rüşvet teklifi). */
export type SorTuru = 'bahane' | 'itiraf' | 'zarf';

/** Sorulabilen kusurlar (eksik belgede SOR yerine İSTE). */
export type SorulanKusur = Exclude<KusurId, 'karotYok' | 'zeminEtuduYok'>;

export const SOR_METIN: Record<SorulanKusur, Record<SorTuru, string[]>> = {
  kacakKat: {
    bahane: ['[O kat hep vardı, ruhsat eski]', '[Çatı katı sayılmaz ki]', '[Belediyeden biri onaylamıştı]'],
    itiraf: ['[Üst kat sonradan çıkıldı]', '[Oğlum evlenince bir kat ekledik]', '[Herkes yapıyor diye biz de çıktık]'],
    zarf: ['[Bu kat meselesini aramızda halletsek?]', '[Şunu bir değerlendirin, {para}]'],
  },
  kesikKolon: {
    bahane: ['[Vitrin projede de vardı]', '[Usta o kolon yük taşımaz dedi]', '[Dükkân hep böyleydi]'],
    itiraf: ['[Dükkânı genişletmek için kestirdik]', '[Kiracı istedi, kolonu aldık]'],
    zarf: ['[Dükkân kapanırsa ekmeğimiz gider, {para}]', '[Bunu görmeseniz olur mu?]'],
  },
  caprazCatlak: {
    bahane: ['[O sıva çatlağı, önemli değil]', '[Boya tutmadı, o kadar]', '[Yeni boyatacaktık zaten]'],
    itiraf: ['[Geçen sarsıntıdan beri var]', '[Her yıl biraz büyüyor]'],
    zarf: ['[Bir boya parası sayın, {para}]', '[Bunu dosyaya yazmasanız?]'],
  },
  dusukBeton: {
    bahane: ['[Laboratuvar yanlış ölçmüş]', '[Numune kötü yerden alındı]', '[Bu bina yıllardır ayakta]'],
    itiraf: ['[Müteahhit çimentodan kısmış]', '[Betonu elde karıştırmışlar]'],
    zarf: ['[Raporu bir daha düşünseniz, {para}]', '[Bu rakam biraz yükselse?]'],
  },
  dereyeYakin: {
    bahane: ['[Dere yıllardır kuru]', '[Plan eski, dere yer değiştirdi]', '[Su hiç buraya gelmedi]'],
    itiraf: ['[Eskiden bahçe sınırı dereydi]', '[Dereyi biraz doldurduk]'],
    zarf: ['[Birkaç metre fark eder mi, {para}]', '[Ölçümü yeniden yapsanız?]'],
  },
  fayaYakin: {
    bahane: ['[O fay haritası eski]', '[Burası sağlam yerdir derler]', '[Komşular da aynı yerde]'],
    itiraf: ['[Arsayı ucuz diye almıştık]', '[Fayı biliyorduk ama]'],
    zarf: ['[Harita yanlış olabilir, {para}]', '[Bu çizgiyi görmezsek?]'],
  },
  sivilasma: {
    bahane: ['[Zemin sağlamdır, eskiden bağ vardı]', '[Etüdü yapan acemiydi]', '[Hiç su basmadı]'],
    itiraf: ['[Bodrumu hep su basar]', '[Eskiden burası sazlıkmış]'],
    zarf: ['[Etüt bir daha okunsa, {para}]', '[Bu satırı geçsek?]'],
  },
  sahteBelge: {
    bahane: ['[Mühür sonradan basıldı, normal]', '[Memur yılı yanlış yazmış]', '[Ruhsat kaybolmuştu, yenisi bu]'],
    itiraf: ['[Ruhsatı sonradan çıkardık]', '[Bir tanıdık halletti]'],
    zarf: ['[Kâğıt işini uzatmayalım, {para}]', '[Bu mühür meselesini kapatalım?]'],
  },
  sahteRapor: {
    bahane: ['[Laboratuvar öyle verdi]', '[Mühür unutulmuş, raporu gerçek]', '[Tarih yanlış yazılmış sadece]'],
    itiraf: ['[Raporu bir tanıdık hazırladı]', '[Gerçek raporu bulamadım]'],
    zarf: ['[Raporu kabul etseniz, {para}]', '[Bu rapor olur, değil mi?]'],
  },
};

/** İSTE cevabının türü: gerçek raporu getirir, sahte rapor getirir ya da getiremez. */
export type IsteTuru = 'gercek' | 'sahte' | 'yok';

export const ISTE_METIN: Record<IsteTuru, string[]> = {
  gercek: ['[Buyrun, raporum burada]', '[Çantamdaymış, işte]', '[Laboratuvardan dün aldım]'],
  sahte: ['[Raporum var tabii, buyrun]', '[İşte rapor, her şey yolunda]', '[Laboratuvar yeni verdi]'],
  yok: ['[Yarın getiririm]', '[Rapor evde kaldı]', '[Laboratuvar daha vermedi]'],
};

/** Zarfa verilen karşılık. */
export const ZARF_TEPKI = {
  ret: ['[Peki, siz bilirsiniz]', '[Yanlış anladınız, öyle demek istemedim]'],
  kabul: ['[Anlaştık o zaman]', '[Teşekkürler, aramızda]'],
};

/** Damga vurulunca mal sahibinin tepkisi. */
export const DAMGA_TEPKI: Record<Damga, string[]> = {
  guvenli: ['[Teşekkürler]', '[Sağ olun, iyi günler]'],
  guclendir: ['[Güçlendirme mi? Peki]', '[Masrafı kim karşılayacak?]'],
  bosalt: ['[Boşaltmak mı? Nereye gideceğiz?]', '[Bu kararı kabul etmiyorum]'],
  iade: ['[Eksikleri tamamlayıp gelirim]', '[Yine mi sıra bekleyeceğim?]'],
};

/** Gazete ve sonuç ekranındaki zarf izi (yalnızca kabul edilen zarfın binası depremde hasar gördüyse). */
export const ZARF_GAZETE = '[Denetçinin masasında zarf bulundu]';

/**
 * Oyunun takvimi (yer tutucu): gün 1'in tarihi. Getirilen raporun tarihi bununla karşılaştırılır; kural
 * kitabında "bugün" olarak yazar. TODO(takım): kurgudaki tarih.
 */
export const TAKVIM = { yil: 2026, ay: 10, gun: 19 };

/** Oyun gününün tarihi (gg.aa.yyyy). gunFark: o günden kaç gün sonra (eksi: önce). */
export function tarih(gun: number, gunFark = 0): string {
  const d = new Date(Date.UTC(TAKVIM.yil, TAKVIM.ay - 1, TAKVIM.gun + gun - 1 + gunFark));
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

/** Satır seç: liste boşsa boş dizgi. */
export function satir(liste: readonly string[], secim: number, para?: number): string {
  if (liste.length === 0) return '';
  const s = liste[Math.abs(Math.floor(secim)) % liste.length];
  return para === undefined ? s : s.replace('{para}', `${para} TL`);
}
