// @beyan metin
import type { Damga } from './building';
import { MUFETTIS_GAZETE, RET_GAZETE, ZARF_GAZETE } from './diyalog';
import { depremOzeti, oyuncuOzeti, type DepremBinaSonucu, type DepremOzeti } from './session';

/**
 * Büyük deprem, gazete ve sonuç ekranının metinleri (G31: lider onaylı, docs/TAKIM_CEVAPLARI.md 3-4).
 * Ton (GDD): kurban gösterilmez, sayı verilmez; odak önlemede. Sayılar yalnızca bina sayısıdır.
 */

/** Gece geçişindeki yazı (G24: deprem önceden bilinmez; saat ya da tarih iddiası yok). */
export const GECE_SAATI = 'Bir gece';
/** Büyük deprem sahnesinin köşesindeki ipucu (G25, G28): Enter/Space/tık depremi hızlandırır (gece kartında da). */
export const DEPREM_GEC = 'Enter ya da tıkla: hızlandır';
/** Hızlandırıldıktan sonra ipucu (G39): ikinci basış depremin sonuna atlar (deprem bitince gazeteye geçer). */
export const DEPREM_ATLA = 'Enter ya da tıkla: geç';

export const GAZETE_ADI = 'Dereboyu Postası';
/** Gazete künyesi. G11: tarih yok (deprem dili: tarih ve kehanet verilmez). */
export const GAZETE_TARIH = 'Dereboyu · Sabah baskısı';
export const FOTO_ALTI = 'Deprem sonrası sokak';
/** Gazetedeki doldurma haberlerin başlıkları (metni gri çizgilerle temsil edilir). */
export const DOLGU_BASLIKLAR = ['Toplanma alanları yeniden işaretlendi', 'Okullarda deprem tatbikatı yapıldı', 'Dere kenarındaki imar tartışılıyor'];

const DAMGA_AD: Record<Damga, string> = { guvenli: 'GÜVENLİ', guclendir: 'GÜÇLENDİR', bosalt: 'BOŞALT', iade: 'İADE' };

/** 5 günlük yolun gazetesinde bina adı (G35): günü ve gün sonu raporundaki adı ("Gün 3 · Bina 10", "Gün 2 · Bina H1"). */
export const binaAdi = (b: Pick<DepremBinaSonucu, 'gun' | 'adres'>): string => `Gün ${b.gun} · ${b.adres}`;

const durumAdi = (b: DepremBinaSonucu): string =>
  b.coktu ? 'çöktü' : b.durum === 'agirHasar' ? 'ağır hasarlı' : b.durum === 'hasarli' ? 'hasarlı' : 'ayakta';

/** Denetimden geçmiş mi, yoksa İADE edilip denetlenmeden mi kalmış. */
const gecmis = (b: DepremBinaSonucu): string =>
  b.damga === 'iade' ? 'iade edilmişti, denetlenmeden kaldı' : `denetimden ${DAMGA_AD[b.damga]} geçmişti`;

/** Gazetede zarf alınan binanın satırına eklenen kısım. */
const ZARF_SATIR_EK = ', zarf alınmıştı';

/** Sayıya göre tekil ya da çoğul biçim (G35): tek bina için tekil. */
interface SayiMetni {
  tekil: string;
  cogul: string;
}
const sayiyla = (n: number, m: SayiMetni): string => (n === 1 ? m.tekil : m.cogul);
/** Cümle biçimi (G31): ilk harf büyük (Türkçe), sonda nokta. */
const cumle = (m: string): string => `${m.charAt(0).toLocaleUpperCase('tr')}${m.slice(1)}.`;

/** Manşetlerin sayıya bağlı biçimleri (gazete dili: büyük harf). */
const MANSET_SAYILI: Record<'iadeCoken' | 'doluCoken' | 'bosCoken', SayiMetni> = {
  iadeCoken: { tekil: 'DENETLENMEDEN KALAN BİNA ÇÖKTÜ', cogul: 'DENETLENMEDEN KALAN BİNALAR ÇÖKTÜ' },
  doluCoken: { tekil: 'DENETİMDEN GEÇEN BİNA ÇÖKTÜ', cogul: 'DENETİMDEN GEÇEN BİNALAR ÇÖKTÜ' },
  bosCoken: { tekil: 'ÇÖKEN BİNA BOŞALTILMIŞTI', cogul: 'ÇÖKEN BİNALAR BOŞALTILMIŞTI' },
};

/**
 * Kısa yolda (G37, takım kararı) jürinin binaları çökmediyse ama sokaktaki denetlemediği binalardan çöken varsa
 * manşet ve değerlendirme iki parçalı: önce jürinin binaları, sonra sokakta denetlenmeyenler (mesaj: hazırlık tek
 * binayla olmaz). Parçalar küçük harfle; manşette büyük harfe çevrilir (G31). Tekil/çoğul G35 gibi.
 */
const KISA_SENIN: Record<'ayakta' | 'hasarli' | 'agir' | 'bosCoken', SayiMetni> = {
  ayakta: { tekil: 'denetlediğin bina ayakta', cogul: 'denetlediğin binalar ayakta' },
  hasarli: { tekil: 'denetlediğin bina ayakta ama hasarlı', cogul: 'denetlediğin binalar ayakta, hasar var' },
  bosCoken: { tekil: 'boşalttığın bina çöktü, içinde kimse yoktu', cogul: 'boşalttığın binalar çöktü, içlerinde kimse yoktu' },
  agir: { tekil: 'denetlediğin binada yıkım yok ama ağır hasar var', cogul: 'denetlediğin binalarda yıkım yok ama ağır hasar var' },
};
const KISA_SOKAK_COKEN: SayiMetni = {
  tekil: 'sokakta denetlenmeyen bina çöktü',
  cogul: 'sokakta denetlenmeyen binalar çöktü',
};

/** Kısa yolun (G21) manşet ve değerlendirmeye verdiği ek bilgi (G37). 5 günlük yolda verilmez. */
export interface KisaYolBilgisi {
  /** Jürinin denetlemediği (sokaktaki örnek) binalardan çökenlerin sayısı. */
  sokakCoken: number;
}

/** Kısa yolda jürinin denetlemediği (sokaktaki örnek) binalardan çökenlerin sayısı (G37). */
export function sokakCokenSayisi(s: readonly DepremBinaSonucu[], juri: ReadonlySet<string>): number {
  return s.filter((b) => !juri.has(b.dosyaId) && b.coktu).length;
}

/**
 * Ana manşet: duruma göre dört şablondan biri. kisa (yalnızca kısa yol, G37): jürinin binası çökmediyse ve sokakta
 * denetlenmeyenlerden çöken varsa manşet iki parçalı olur. 5 günlük yolda verilmez.
 */
export function manset(o: DepremOzeti, kisa?: KisaYolBilgisi): string {
  const sokakCoken = kisa?.sokakCoken ?? 0;
  if (o.toplam === 0) return 'SOKAKTA DENETLENMİŞ BİNA YOKTU';
  if (o.doluCoken > 0 && o.doluCoken === o.iadeCoken) return sayiyla(o.doluCoken, MANSET_SAYILI.iadeCoken);
  if (o.doluCoken > 0) return sayiyla(o.doluCoken, MANSET_SAYILI.doluCoken);
  if (o.coken > 0) return sayiyla(o.coken, MANSET_SAYILI.bosCoken);
  if (sokakCoken > 0)
    return `${sayiyla(o.toplam, o.hasarli > 0 ? KISA_SENIN.hasarli : KISA_SENIN.ayakta)}, ${sayiyla(sokakCoken, KISA_SOKAK_COKEN)}`.toLocaleUpperCase('tr');
  if (o.hasarli > 0) return 'SOKAKTA HASAR VAR, ÇÖKEN YOK';
  return 'SOKAK AYAKTA';
}

/**
 * Sayı satırı (bina sayıları). Sonuç ekranıyla aynı tanımlar (G5b): "içi boş" çökenlerin boşaltılmış olanları.
 * Sokağın tamamındaki boşaltılmış sayısı gazetede ayrı kalem değil (G46: çökenlerdeki "içi boş" ile çelişkili
 * okunuyordu); sonuç ekranında BOŞALTILMIŞ kutusu "N binadan" alt yazısıyla gösterir.
 */
export function sayiSatiri(o: DepremOzeti): string {
  const k = [`Ayakta: ${o.ayakta} bina`, `Hasarlı: ${o.hasarli}`, `Çöken: ${o.coken}${o.coken > 0 ? ` (içi boş: ${o.cokenBos})` : ''}`];
  if (o.iade > 0) k.push(`İade edilmiş: ${o.iade}`);
  return kalemDizisi(k);
}

/**
 * Kalemleri alt alta dizer (G31c, 5 günlük gazete): her kalem ayrı satırda. " · " ile yan yana dizilince dar sütunda
 * satır kaydırma ayırıcıyı satır başına düşürüyordu; kalem kendi içinde yine sözcük arasından kırılabilir.
 */
export function kalemDizisi(kalemler: readonly string[]): string {
  return kalemler.join('\n');
}

/** Kısa yol gazetesindeki iki sayı bloğunun başlıkları (G30, T22). */
export const KISA_GAZETE = { senin: 'Senin binaların', sokak: 'Bütün sokak' };

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
 * binalarından biri çöktüyse ya da hasar gördüyse. Sıfır olan kalemler yazılmaz; boşaltılmış sayısı ayrı kalem değil
 * (G46). Kalemler ayrı döner (G31c): gazete onları dar sütuna " · " ile kendisi dizer (satır yalnızca kalemler
 * arasında kırılır).
 */
export function kisaSayiBloklari(s: readonly DepremBinaSonucu[], juri: ReadonlySet<string>): { baslik: string; kalemler: string[] }[] {
  const j = s.filter((b) => juri.has(b.dosyaId));
  const { iade, icBos } = juriGordukleri(s, juri);
  const kalemler = (o: DepremOzeti): string[] => {
    const k: string[] = [];
    if (o.ayakta > 0) k.push(`Ayakta: ${o.ayakta} bina`);
    if (o.hasarli > 0) k.push(`Hasarlı: ${o.hasarli}`);
    if (o.coken > 0) k.push(`Çöken: ${o.coken}${icBos && o.cokenBos > 0 ? ` (içi boş: ${o.cokenBos})` : ''}`);
    if (iade && o.iade > 0) k.push(`İade edilmiş: ${o.iade}`);
    return k;
  };
  // Jüri hiç damga vurmadıysa (sokakta binası yok) yalnızca sokak bloğu.
  const sokak = { baslik: KISA_GAZETE.sokak, kalemler: kalemler(depremOzeti(s)) };
  return j.length > 0 ? [{ baslik: KISA_GAZETE.senin, kalemler: kalemler(oyuncuOzeti(s, juri)) }, sokak] : [sokak];
}

/** Sonucun ağırlığı (sıralama): çöken, ağır hasarlı, hasarlı, ayakta. */
const agirlik = (b: DepremBinaSonucu): number => (b.coktu ? 3 : b.durum === 'agirHasar' ? 2 : b.durum === 'hasarli' ? 1 : 0);

/**
 * Öne çıkan binalar (en çok 3 satır) ve fotoğrafın odaklanacağı bina (ilk satırınki). oncelik (G21 kısa yol):
 * oyuncunun kendi binaları önce, en ağır sonuçtan başlayarak. gunlu (G35, 5 günlük yol): bina adı günüyle
 * (binaAdi); verilmezse yalnızca adres ("Bina 10"; G54: sokak boyunca tek numara, gün sonu raporundakiyle aynı).
 */
export function oneCikanlar(
  s: readonly DepremBinaSonucu[],
  oncelik?: ReadonlySet<string>,
  gunlu = false,
): { satirlar: string[]; odak?: DepremBinaSonucu } {
  // 5 günlük yolda (G35) bina adı gün sonu raporundakiyle aynı ve günüyle: "Gün 3 · Bina 10"; kısa yolda yalnızca adres.
  const ad = (b: DepremBinaSonucu): string => (gunlu ? binaAdi(b) : b.adres);
  const out: { b: DepremBinaSonucu; metin: string }[] = [];
  // Zarf alınan binanın satırında zarf da geçer (G23): "Bina 02 çöktü; denetimden GÜVENLİ geçmişti, zarf alınmıştı".
  const ekle = (b: DepremBinaSonucu | undefined, metin: (b: DepremBinaSonucu) => string): void => {
    if (b && out.length < 3 && !out.some((x) => x.b === b)) out.push({ b, metin: b.zarf ? metin(b) + ZARF_SATIR_EK : metin(b) });
  };
  // Doğru GÜÇLENDİR kararının ödülü (kusurlu bina güçlendirildi, çökmedi ve ağır hasar almadı): iki yolda aynı satır (G51).
  const guclendirildi = (b: DepremBinaSonucu): boolean => b.damga === 'guclendir' && b.kusurlu && !b.coktu && b.durum !== 'agirHasar';
  const guclendirMetni = (b: DepremBinaSonucu): string => `${ad(b)} ${b.durum === 'ayakta' ? 'ayakta' : 'hasarlı ama ayakta'}: güçlendirilmişti`;
  if (oncelik)
    for (const b of s.filter((x) => oncelik.has(x.dosyaId)).sort((a, c) => agirlik(c) - agirlik(a) || a.no - c.no))
      ekle(b, (b) =>
        b.bos ? `${ad(b)} ${durumAdi(b)}; boşaltılmıştı, içinde kimse yoktu` : guclendirildi(b) ? guclendirMetni(b) : `${ad(b)} ${durumAdi(b)}; ${gecmis(b)}`,
      );
  const doluCoken = s.filter((b) => b.coktu && !b.bos);
  ekle(doluCoken[0], (b) => `${ad(b)} çöktü; ${gecmis(b)}`);
  // İADE edilen bina: oyuncunun denetlemeden bıraktığı (bilinçli) risk; gazetede ayrı satır. G54: öbür satırlar gibi
  // durumla başlar ("Bina 05 ayakta; iade edilmişti, denetlenmeden kaldı").
  ekle(
    s.find((b) => b.damga === 'iade' && !b.coktu),
    (b) => `${ad(b)} ${durumAdi(b)}; ${gecmis(b)}`,
  );
  ekle(
    s.find((b) => b.coktu && b.bos),
    (b) => `${ad(b)} çöktü; boşaltılmıştı, içinde kimse yoktu`,
  );
  ekle(s.find(guclendirildi), guclendirMetni);
  ekle(doluCoken[1], (b) => `${ad(b)} çöktü; ${gecmis(b)}`);
  ekle(
    s.find((b) => !b.coktu && !b.bos && b.durum === 'agirHasar'),
    (b) => `${ad(b)} ağır hasarlı; ${gecmis(b)}`,
  );
  ekle(
    s.find((b) => b.damga === 'guvenli' && !b.kusurlu && b.durum === 'ayakta'),
    (b) => `${ad(b)} ayakta: denetimden GÜVENLİ geçmişti, kusuru yoktu`,
  );
  return { satirlar: out.map((x) => x.metin), odak: out[0]?.b };
}

/** Değerlendirmenin sayıya bağlı biçimleri. */
const DEGERLENDIRME_SAYILI: Record<'iadeCoken' | 'doluCoken', SayiMetni> = {
  iadeCoken: { tekil: 'iade ettiğin bina denetlenmeden çöktü', cogul: 'iade ettiğin binalar denetlenmeden çöktü' },
  doluCoken: { tekil: 'onayladığın bina çöktü', cogul: 'onayladığın binalar çöktü' },
};

/**
 * Değerlendirmede onaylanan çöken binalardan zarf alınmış olanlar (G37; kısa yol ve 5 günlük yol): zarf ayrıca
 * "zarf aldığın N bina çöktü" diye sayılmaz (aynı bina iki kez), çöken binaların ifadesine eklenir.
 */
const DEGERLENDIRME_ZARFLI: Record<'hepsi' | 'bazisi', SayiMetni> = {
  hepsi: { tekil: 'zarf almıştın', cogul: 'hepsinden zarf almıştın' },
  bazisi: { tekil: 'birinden zarf almıştın', cogul: 'bazılarından zarf almıştın' },
  // bazisi: zarf alınan çöken bina sayısına göre (biri ya da birkaçı); hepsi: çöken bina sayısına göre.
};

/**
 * Sonuç ekranındaki değerlendirme satırı (üç şablon). Zarf (G22): zarf alınan bina hasar gördüyse satıra eklenir
 * ve ton kötüye döner; zarf alındı ama binalar sağlamsa yalnızca not düşülür. G37: onaylanıp çöken binanın zarfı
 * çöken ifadesine eklenir, ayrıca sayılmaz (iki yolda da). kisa (yalnızca kısa yol, G37): manset ile aynı; jürinin
 * binaları çökmediyse sokak cümlesi uyarı olarak eklenir, ton jürinin binalarına göre (takım kararı: 'iyi', ağır
 * hasar varsa 'orta'). Biçim (G31): etiketsiz cümle, ilk harf büyük, sonda nokta; zarf eki ayrı cümle.
 */
export function degerlendirme(o: DepremOzeti, kisa?: KisaYolBilgisi): { metin: string; ton: 'iyi' | 'orta' | 'kotu' } {
  const sokakCoken = kisa?.sokakCoken ?? 0;
  // Onaylanıp (iade değil) çöken ve zarf alınmış binalar çöken ifadesinde geçer; zarf ekinde yalnızca kalanlar.
  const onayCoken = o.doluCoken > 0 && o.doluCoken !== o.iadeCoken;
  const zarfOnay = onayCoken ? o.zarfDoluCoken : 0;
  const zCoken = o.zarfCoken - zarfOnay;
  const zHasar = o.zarfHasar - o.zarfCoken;
  const z = zCoken + zHasar > 0 ? zarfSonucu('zarf aldığın', zCoken, zHasar) : o.zarf > 0 && zarfOnay === 0 ? 'zarf aldın' : '';
  const d = (metin: string, ton: 'iyi' | 'orta' | 'kotu'): { metin: string; ton: 'iyi' | 'orta' | 'kotu' } => ({
    metin: z ? `${cumle(metin)} ${cumle(z)}` : cumle(metin),
    ton: o.zarfHasar > 0 ? 'kotu' : ton,
  });
  // Manşetle aynı durum (G23b): damgalı bina yoksa "denetlediğin bina yoktu".
  if (o.toplam === 0) return d('denetlediğin bina yoktu', 'orta');
  if (o.doluCoken > 0 && o.doluCoken === o.iadeCoken) return d(sayiyla(o.doluCoken, DEGERLENDIRME_SAYILI.iadeCoken), 'kotu');
  if (o.doluCoken > 0) {
    const coken = sayiyla(o.doluCoken, DEGERLENDIRME_SAYILI.doluCoken);
    if (zarfOnay === 0) return d(coken, 'kotu');
    const zarfli = zarfOnay === o.doluCoken ? sayiyla(o.doluCoken, DEGERLENDIRME_ZARFLI.hepsi) : sayiyla(zarfOnay, DEGERLENDIRME_ZARFLI.bazisi);
    return d(`${coken}; ${zarfli}`, 'kotu');
  }
  // G37 (kısa yol): jürinin binaları çökmedi ama sokakta denetlenmeyenlerden çöken var.
  if (sokakCoken > 0) {
    // Jürinin çöken binası varsa hepsi boşaltılmıştı (dolu çöken yukarıda); manşet de "çöken bina boşaltılmıştı".
    const senin =
      o.coken > 0
        ? sayiyla(o.coken, KISA_SENIN.bosCoken)
        : sayiyla(o.toplam, o.doluAgir > 0 ? KISA_SENIN.agir : o.hasarli > 0 ? KISA_SENIN.hasarli : KISA_SENIN.ayakta);
    return d(`${senin}; ${sayiyla(sokakCoken, KISA_SOKAK_COKEN)}`, o.doluAgir > 0 ? 'orta' : 'iyi');
  }
  if (o.doluAgir > 0) return d('yıkım yok ama ağır hasar var', 'orta');
  return d('sokak depreme hazırdı', 'iyi');
}

/**
 * Zarf izi (G17): kabul edilen zarfın binası depremde hasar gördüyse (ya da çöktüyse) gazetede bir satır.
 * Kabul edilmediyse ya da binalar sağlamsa null. G57: müfettişin el koyduğu zarfın binası sayılmaz (onun satırı
 * gazeteZarfSatirlari'nda ayrı).
 */
export function zarfSatiri(s: readonly DepremBinaSonucu[]): string | null {
  return s.some((b) => b.zarf && !b.mufettis && (b.coktu || b.durum !== 'ayakta')) ? ZARF_GAZETE : null;
}

/** Gazetenin zarf satırı (G57): metin ve tonu (kötü: kırmızı, iyi: yeşil). */
export interface GazeteSatiri {
  metin: string;
  iyi: boolean;
}

/**
 * Gazetenin sağ sütunundaki zarf satırları (G57), öncelik sırasıyla: müfettiş en az bir zarfa el koyduysa kırmızı
 * satır; yakalanmayan zarflı bina hasar gördüyse eski zarf izi (kırmızı); en az bir zarf geri verildiyse yeşil
 * dürüstlük satırı. Sığmazsa sondan düşer (öncelik kırmızıda).
 */
export function gazeteZarfSatirlari(s: readonly DepremBinaSonucu[]): GazeteSatiri[] {
  const out: GazeteSatiri[] = [];
  if (s.some((b) => b.mufettis)) out.push({ metin: MUFETTIS_GAZETE, iyi: false });
  const z = zarfSatiri(s);
  if (z) out.push({ metin: z, iyi: false });
  if (s.some((b) => b.zarfRet)) out.push({ metin: RET_GAZETE, iyi: true });
  return out;
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
  return `Kabul edilen zarf: ${adet}, toplam ${toplam} TL${coken + hasarli > 0 ? ` · ${zarfSonucu('zarf alınan', coken, hasarli)}` : ''}`;
}

// ---- G21 kısa yol ("Büyük deprem bu gece olsaydı?") ----

/**
 * Gün 1 raporundaki kısa yol düğmesi ve açıklaması. G24 (takım kararı): deprem önceden bilinmez; kısa yol bir
 * soru, kehanet değil.
 */
export const KISA_YOL_DUGME = 'BÜYÜK DEPREM BU GECE OLSAYDI?';
/** G11: düğmenin altındaki açıklama ve oyunun sonra sürdüğü bilgisi. T23: soru düğmede, satır kısa. */
export const KISA_YOL_ACIKLAMA = 'Kararlarının sonucunu şimdi gör.';
export const KISA_YOL_DEVAM = 'Sonra 2. günden devam edebilirsin.';

/** Gün 1 sonundaki küçük deprem (kodda "öncü"): gişe camındaki şerit. G24: "asıl deprem gelecek" yok. */
export const KUCUK_DEPREM_SERIT = 'Küçük bir deprem oldu.';
/**
 * Gün sonu raporundaki küçük deprem satırı (G25: tek sayı ve tek liste). catlayanlar: çatlayan binalar (adı, damgası,
 * içinde insan var mıydı), dosya sırasıyla. Ör. "Küçük deprem oldu, 2 bina çatladı: Bina 02 (GÜVENLİ,
 * içinde insan vardı), Bina 03 (BOŞALT, boştu)"; tek binada "1 bina çatladı".
 */
export function kucukDepremSatiri(catlayanlar: readonly { ad: string; damga: Damga; bos: boolean }[]): string {
  if (catlayanlar.length === 0) return 'Küçük deprem: çatlayan bina yok';
  const liste = catlayanlar.map((b) => `${b.ad} (${DAMGA_AD[b.damga]}, ${b.bos ? 'boştu' : 'içinde insan vardı'})`).join(', ');
  return `Küçük deprem oldu, ${catlayanlar.length} bina çatladı: ${liste}`;
}
/** Depremde oyuncunun binalarının üstündeki etiket. */
export const SENIN_DAMGAN = 'SENİN DAMGAN';

/** Küçük depremde (öncü) çatlayan binanın etiketi (G5b; pencerede damga etiketinin üstünde). */
export function oncuEtiketi(bos: boolean): string {
  return bos ? 'ÇATLADI · İÇİ BOŞ' : 'ÇATLADI';
}

/** Depremde oyuncunun binasının sonucu (etiket). */
export function sonucEtiketi(b: DepremBinaSonucu): string {
  if (b.bos && b.coktu) return 'ÇÖKTÜ · İÇİ BOŞTU';
  return b.coktu ? 'ÇÖKTÜ' : b.durum === 'agirHasar' ? 'AĞIR HASAR' : b.durum === 'hasarli' ? 'HASARLI' : 'AYAKTA';
}

/** Sonuç ekranında oyuncunun binalarının özeti. */
export function seninBinalarin(o: DepremOzeti): string {
  return `Senin binaların: ayakta ${o.ayakta}, hasarlı ${o.hasarli}, çöken ${o.coken}`;
}

/** Sonuç ekranındaki kısa yol başlıkları. */
export const KISA_SONUC = {
  sag: 'GÜN 1 + DEPREM',
  alt: 'Büyük deprem gün 1 gecesi olsaydı: senin binaların ve sokak',
  senin: 'SENİN BİNALARIN',
  sokak: (toplam: number, senin: number): string => `BÜYÜK DEPREM · SOKAK (${toplam} bina, ${senin} tanesi senin)`,
};
