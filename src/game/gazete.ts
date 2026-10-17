// @beyan metin
import type { Damga } from './building';
import { ZARF_GAZETE } from './diyalog';
import { depremOzeti, oyuncuOzeti, type DepremBinaSonucu, type DepremOzeti } from './session';

/**
 * Büyük deprem, gazete ve sonuç ekranının metinleri. HEPSİ YER TUTUCU: TODO(takım) gerçek metinleri yazacak.
 * Ton (GDD): kurban gösterilmez, sayı verilmez; odak önlemede. Sayılar yalnızca bina sayısıdır.
 */

/** Gece geçişindeki yazı (G24: deprem önceden bilinmez; saat ya da tarih iddiası yok). */
export const GECE_SAATI = '[Bir gece]';
/** Büyük deprem sahnesinin köşesindeki ipucu (G25, G28): Enter/Space/tık depremi hızlandırır (gece kartında da). */
export const DEPREM_GEC = '[Enter ya da tıkla: hızlandır]';

export const GAZETE_ADI = '[GAZETE ADI]';
/** Gazete künyesi. G11: tarih yok (deprem dili: tarih ve kehanet verilmez). */
export const GAZETE_TARIH = '[Şehir adı] · [Sabah baskısı]';
export const FOTO_ALTI = '[Fotoğraf: deprem sonrası sokak]';
/** Gazetedeki doldurma haberlerin başlıkları (metni gri çizgilerle temsil edilir). */
export const DOLGU_BASLIKLAR = ['[Haber başlığı]', '[Haber başlığı]', '[Haber başlığı]'];

const DAMGA_AD: Record<Damga, string> = { guvenli: 'GÜVENLİ', guclendir: 'GÜÇLENDİR', bosalt: 'BOŞALT', iade: 'İADE' };
const no = (b: DepremBinaSonucu): string => `Bina ${String(b.no).padStart(2, '0')}`;

/** 5 günlük yolun gazetesinde bina adı (G35): günü ve gün sonu raporundaki adı ("Gün 3 · Bina 02", "Gün 2 · Bina H1"). */
export const binaAdi = (b: Pick<DepremBinaSonucu, 'gun' | 'adres'>): string => `Gün ${b.gun} · ${b.adres}`;

const durumAdi = (b: DepremBinaSonucu): string =>
  b.coktu ? 'çöktü' : b.durum === 'agirHasar' ? 'ağır hasarlı' : b.durum === 'hasarli' ? 'hasarlı' : 'ayakta';

/** Denetimden geçmiş mi, yoksa İADE edilip denetlenmeden mi kalmış. */
const gecmis = (b: DepremBinaSonucu): string =>
  b.damga === 'iade' ? 'iade edilmişti, denetlenmeden kaldı' : `denetimden ${DAMGA_AD[b.damga]} geçmişti`;

/** Gazetede zarf alınan binanın satırına eklenen kısım (yer tutucu). */
const ZARF_SATIR_EK = ', zarf alınmıştı';

/** Sayıya göre tekil ya da çoğul biçim (G35): tek bina için tekil. */
interface SayiMetni {
  tekil: string;
  cogul: string;
}
const sayiyla = (n: number, m: SayiMetni): string => (n === 1 ? m.tekil : m.cogul);

/** Manşetlerin sayıya bağlı biçimleri (yer tutucu; TODO(takım)). */
const MANSET_SAYILI: Record<'iadeCoken' | 'doluCoken' | 'bosCoken', SayiMetni> = {
  iadeCoken: { tekil: '[Manşet: denetlenmeden kalan bina çöktü]', cogul: '[Manşet: denetlenmeden kalan binalar çöktü]' },
  doluCoken: { tekil: '[Manşet: denetimden geçen bina çöktü]', cogul: '[Manşet: denetimden geçen binalar çöktü]' },
  bosCoken: { tekil: '[Manşet: çöken bina boşaltılmıştı]', cogul: '[Manşet: çöken binalar boşaltılmıştı]' },
};

/** Ana manşet: duruma göre dört şablondan biri. */
export function manset(o: DepremOzeti): string {
  if (o.toplam === 0) return '[Manşet: sokakta denetlenmiş bina yoktu]';
  if (o.doluCoken > 0 && o.doluCoken === o.iadeCoken) return sayiyla(o.doluCoken, MANSET_SAYILI.iadeCoken);
  if (o.doluCoken > 0) return sayiyla(o.doluCoken, MANSET_SAYILI.doluCoken);
  if (o.coken > 0) return sayiyla(o.coken, MANSET_SAYILI.bosCoken);
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

/** Kısa yol gazetesindeki iki sayı bloğunun başlıkları (G30, T22). Yer tutucu: TODO(takım). */
export const KISA_GAZETE = { senin: '[Senin binaların]', sokak: '[Bütün sokak]' };

/**
 * Kısa yolda jürinin gördüğü kalemler (T22; gazete G30 ve sonuç ekranı G28b aynı koşulu kullanır): iade, jüri en az
 * bir İADE vurduysa; icBos, jürinin BOŞALT damgalı binalarından biri çöktüyse ya da hasar gördüyse.
 */
export function juriGordukleri(s: readonly DepremBinaSonucu[], juri: ReadonlySet<string>): { iade: boolean; icBos: boolean } {
  const j = s.filter((b) => juri.has(b.dosyaId));
  return {
    iade: j.some((b) => b.damga === 'iade'),
    icBos: j.some((b) => b.damga === 'bosalt' && (b.coktu || b.durum !== 'ayakta')),
  };
}

/**
 * Kısa yol gazetesinin sayıları (G30, takım kararı T22): önce jürinin kendi binaları, sonra bütün sokak. Tanımlar
 * sayiSatiri ile aynı; jürinin özeti sonuç ekranındaki "Senin binaların" ile aynı (oyuncuOzeti). Jürinin görmediği
 * satırlar gizli: "İade edilmiş" yalnızca jüri en az bir İADE vurduysa, "içi boş" yalnızca jürinin BOŞALT damgalı
 * binalarından biri çöktüyse ya da hasar gördüyse. Sıfır olan kalemler yazılmaz.
 */
export function kisaSayiBloklari(s: readonly DepremBinaSonucu[], juri: ReadonlySet<string>): { baslik: string; satir: string }[] {
  const j = s.filter((b) => juri.has(b.dosyaId));
  const { iade, icBos } = juriGordukleri(s, juri);
  const satir = (o: DepremOzeti): string => {
    const k: string[] = [];
    if (o.ayakta > 0) k.push(`Ayakta: ${o.ayakta} bina`);
    if (o.hasarli > 0) k.push(`Hasarlı: ${o.hasarli}`);
    if (o.coken > 0) k.push(`Çöken: ${o.coken}${icBos && o.cokenBos > 0 ? ` (içi boş: ${o.cokenBos})` : ''}`);
    if (o.bos > 0) k.push(`Boşaltılmış (toplam): ${o.bos}`);
    if (iade && o.iade > 0) k.push(`İade edilmiş: ${o.iade}`);
    return `[${k.join(' · ')}]`;
  };
  // Jüri hiç damga vurmadıysa (sokakta binası yok) yalnızca sokak bloğu.
  const sokak = { baslik: KISA_GAZETE.sokak, satir: satir(depremOzeti(s)) };
  return j.length > 0 ? [{ baslik: KISA_GAZETE.senin, satir: satir(oyuncuOzeti(s, juri)) }, sokak] : [sokak];
}

/** Sonucun ağırlığı (sıralama): çöken, ağır hasarlı, hasarlı, ayakta. */
const agirlik = (b: DepremBinaSonucu): number => (b.coktu ? 3 : b.durum === 'agirHasar' ? 2 : b.durum === 'hasarli' ? 1 : 0);

/**
 * Öne çıkan binalar (en çok 3 satır) ve fotoğrafın odaklanacağı bina (ilk satırınki). oncelik (G21 kısa yol):
 * oyuncunun kendi binaları önce, en ağır sonuçtan başlayarak. gunlu (G35, 5 günlük yol): bina adı günüyle
 * (binaAdi); verilmezse sokak sırası ("Bina 02").
 */
export function oneCikanlar(
  s: readonly DepremBinaSonucu[],
  oncelik?: ReadonlySet<string>,
  gunlu = false,
): { satirlar: string[]; odak?: DepremBinaSonucu } {
  // 5 günlük yolda (G35) bina adı gün sonu raporundakiyle aynı ve günüyle: "Gün 3 · Bina 02"; kısa yolda sokak sırası.
  const ad = (b: DepremBinaSonucu): string => (gunlu ? binaAdi(b) : no(b));
  const out: { b: DepremBinaSonucu; metin: string }[] = [];
  // Zarf alınan binanın satırında zarf da geçer (G23): "[Bina 02 çöktü; denetimden GÜVENLİ geçmişti, zarf alınmıştı]".
  const ekle = (b: DepremBinaSonucu | undefined, metin: (b: DepremBinaSonucu) => string): void => {
    if (b && out.length < 3 && !out.some((x) => x.b === b)) out.push({ b, metin: b.zarf ? metin(b).replace(/\]$/, `${ZARF_SATIR_EK}]`) : metin(b) });
  };
  if (oncelik)
    for (const b of s.filter((x) => oncelik.has(x.dosyaId)).sort((a, c) => agirlik(c) - agirlik(a) || a.no - c.no))
      ekle(b, (b) => (b.bos ? `[${ad(b)} ${durumAdi(b)}; boşaltılmıştı, içinde kimse yoktu]` : `[${ad(b)} ${durumAdi(b)}; ${gecmis(b)}]`));
  const doluCoken = s.filter((b) => b.coktu && !b.bos);
  ekle(doluCoken[0], (b) => `[${ad(b)} çöktü; ${gecmis(b)}]`);
  // İADE edilen bina: oyuncunun denetlemeden bıraktığı (bilinçli) risk; gazetede ayrı satır.
  ekle(
    s.find((b) => b.damga === 'iade' && !b.coktu),
    (b) => `[${ad(b)}: iade edilmişti, denetlenmeden kaldı; ${durumAdi(b)}]`,
  );
  ekle(
    s.find((b) => b.coktu && b.bos),
    (b) => `[${ad(b)} çöktü; boşaltılmıştı, içinde kimse yoktu]`,
  );
  ekle(
    s.find((b) => b.damga === 'guclendir' && b.kusurlu && !b.coktu && b.durum !== 'agirHasar'),
    (b) => `[${ad(b)} ${b.durum === 'ayakta' ? 'ayakta' : 'hasarlı ama ayakta'}: güçlendirilmişti]`,
  );
  ekle(doluCoken[1], (b) => `[${ad(b)} çöktü; ${gecmis(b)}]`);
  ekle(
    s.find((b) => !b.coktu && !b.bos && b.durum === 'agirHasar'),
    (b) => `[${ad(b)} ağır hasarlı; ${gecmis(b)}]`,
  );
  ekle(
    s.find((b) => b.damga === 'guvenli' && !b.kusurlu && b.durum === 'ayakta'),
    (b) => `[${ad(b)} ayakta: denetimden GÜVENLİ geçmişti, kusuru yoktu]`,
  );
  return { satirlar: out.map((x) => x.metin), odak: out[0]?.b };
}

/** Değerlendirmenin sayıya bağlı biçimleri (yer tutucu; TODO(takım)). */
const DEGERLENDIRME_SAYILI: Record<'iadeCoken' | 'doluCoken', SayiMetni> = {
  iadeCoken: { tekil: 'iade ettiğin bina denetlenmeden çöktü', cogul: 'iade ettiğin binalar denetlenmeden çöktü' },
  doluCoken: { tekil: 'onayladığın bina çöktü', cogul: 'onayladığın binalar çöktü' },
};

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
  if (o.doluCoken > 0 && o.doluCoken === o.iadeCoken) return d(sayiyla(o.doluCoken, DEGERLENDIRME_SAYILI.iadeCoken), 'kotu');
  if (o.doluCoken > 0) return d(sayiyla(o.doluCoken, DEGERLENDIRME_SAYILI.doluCoken), 'kotu');
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

// ---- G21 kısa yol ("Büyük deprem bu gece olsaydı?") ----

/**
 * Gün 1 raporundaki kısa yol düğmesi ve açıklaması. G24 (takım kararı): deprem önceden bilinmez; kısa yol bir
 * soru, kehanet değil.
 */
export const KISA_YOL_DUGME = '[BÜYÜK DEPREM BU GECE OLSAYDI?]';
/** G11: düğmenin altındaki açıklama ve oyunun sonra sürdüğü bilgisi; yer tutucu. T23: soru düğmede, satır kısa. */
export const KISA_YOL_ACIKLAMA = '[Kararlarının sonucunu şimdi gör.]';
export const KISA_YOL_DEVAM = '[Sonra 2. günden devam edebilirsin.]';

/** Gün 1 sonundaki küçük deprem (kodda "öncü"): gişe camındaki şerit. G24: "asıl deprem gelecek" yok. */
export const KUCUK_DEPREM_SERIT = '[Küçük bir deprem oldu.]';
/**
 * Gün sonu raporundaki küçük deprem satırı (G25: tek sayı ve tek liste). catlayanlar: çatlayan binalar (adı, damgası,
 * içinde insan var mıydı), dosya sırasıyla. Ör. "[Küçük deprem: 2 bina çatladı: Bina 02 (GÜVENLİ, içinde insan
 * vardı), Bina 03 (BOŞALT, boştu)]".
 */
export function kucukDepremSatiri(catlayanlar: readonly { ad: string; damga: Damga; bos: boolean }[]): string {
  if (catlayanlar.length === 0) return '[Küçük deprem: çatlayan bina yok]';
  const liste = catlayanlar.map((b) => `${b.ad} (${DAMGA_AD[b.damga]}, ${b.bos ? 'boştu' : 'içinde insan vardı'})`).join(', ');
  return `[Küçük deprem: ${catlayanlar.length} bina çatladı: ${liste}]`;
}
/** Depremde oyuncunun binalarının üstündeki etiket. */
export const SENIN_DAMGAN = '[SENİN DAMGAN]';

/** Küçük depremde (öncü) çatlayan binanın etiketi (G5b; pencerede damga etiketinin üstünde). */
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
  alt: '[Büyük deprem gün 1 gecesi olsaydı: senin binaların ve sokak]',
  senin: 'SENİN BİNALARIN',
  sokak: (toplam: number, senin: number): string => `BÜYÜK DEPREM · SOKAK [${toplam} bina, ${senin} tanesi senin]`,
};
