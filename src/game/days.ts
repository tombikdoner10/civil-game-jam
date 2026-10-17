import type { BelgeTuru, Damga, Kural, KusurId } from './building';
import { aktifKurallar, GOREV_NOTU, KURALLAR, KUSUR_BILGI, kuralKusurlari, kuralYeni, RAPOR_KURALI, yeniKusurlari } from './rules';
import { TUNING } from './tuning';

/** Oyundaki gün sayısı. Son günün sonunda (şimdilik) sonuç ekranına geçilir; büyük deprem G5'te. */
export const SON_GUN = 5;

/** Bir günün yapılandırması: o gün masada ne var, kaç dosya gelir, mesai ne kadar. */
export interface GunAyar {
  gun: number;
  /** O gün yürürlükteki bütün kurallar (kural kitabı). */
  kurallar: Kural[];
  /** O gün ilk kez gelen ya da genişleyen kurallar (kitapta "YENİ"; üretici bunları ilk iki dosyadan birine koyar). */
  yeniKurallar: Kural[];
  /** Masaya gelen belge türleri (kurallar geldikçe eklenir). */
  belgeler: BelgeTuru[];
  dosyaSayisi: number;
  /** Mesai süresi (gerçek saniye; dosya gelip giderken saat durur). */
  sure: number;
  /** Yönetmelik klasörü masada mı (gün 2'den itibaren). */
  kitap: boolean;
  /** Kaşelikte o gün duran kaşeler (kurallar geldikçe eklenir: İADE eksik belge kuralıyla, gün 3). */
  kaseler: Damga[];
  /** O gün ilk kez rafa gelen kaşeler ("YENİ" işareti). */
  yeniKaseler: Damga[];
  /** Masadaki küçük kural notu (gün 1): hedef satırı ve o günün kuralı. Yoksa null. */
  not: { gorev: string; kurallar: Kural[] } | null;
  /** Gün sonu ekranından önce öncü sarsıntı olacak mı (G4b dolduracak; şimdilik yalnızca işaret). */
  oncuSarsinti: boolean;
  /** Bulunan tutarsızlığı gişedeki kişiye SOR (G17). */
  sor: boolean;
  /** Eksik belgeyi kişiden İSTE. */
  iste: boolean;
  /** İSTE'de sahte rapor gelebilir (kural kitabında rapor kuralı). */
  sahteRapor: boolean;
  /** Saha testi (G19, Schmidt çekici): günlük hak; 0 ise saha testi yok. */
  sahaHak: number;
  /** SOR'da taban zarf olasılığı ve pazarlıkçı kişi payı (TUNING.kisi). */
  zarf: number;
  pazarlikci: number;
}

/**
 * Belgeler kuralları geldikçe masaya eklenir (GDD gün planı):
 * gün 1 ruhsat + fotoğraf, gün 2 proje özeti, gün 3 karot, gün 4 vaziyet planı + zemin etüdü, gün 5 hepsi.
 */
const BELGE_GUNU: Record<BelgeTuru, number> = {
  ruhsat: 1,
  foto: 1,
  proje: 2,
  karot: 3,
  vaziyet: 4,
  zemin: 4,
};
const BELGE_SIRASI: BelgeTuru[] = ['foto', 'ruhsat', 'proje', 'vaziyet', 'karot', 'zemin'];

const KASE_SIRASI: Damga[] = ['guvenli', 'guclendir', 'bosalt', 'iade'];

/** Rafta o gün duran kaşeler: İADE, damgası İADE olan ilk kural (eksik belge, gün 3) yürürlüğe girince gelir. */
export function gunKaseleri(gun: number): Damga[] {
  const g = sinirla(gun);
  const iade = aktifKurallar(g).some((k) => k.id === RAPOR_KURALI || kuralKusurlari(k, g).some((id) => KUSUR_BILGI[id].ciddiyet === 'iade'));
  return KASE_SIRASI.filter((d) => d !== 'iade' || iade);
}

function sinirla(gun: number): number {
  return Math.min(Math.max(Math.floor(gun), 1), SON_GUN);
}

function listeden<T>(liste: readonly T[], gun: number): T {
  return liste[Math.min(sinirla(gun), liste.length) - 1];
}

/** Günün yapılandırması (gün 1-5; dışındakiler sınıra çekilir). */
export function gunAyar(gun: number): GunAyar {
  const g = sinirla(gun);
  const yeni = KURALLAR.filter((k) => kuralYeni(k, g));
  return {
    gun: g,
    kurallar: aktifKurallar(g),
    yeniKurallar: yeni,
    belgeler: BELGE_SIRASI.filter((t) => BELGE_GUNU[t] <= g),
    dosyaSayisi: listeden(TUNING.mesai.dosyaSayisi, g),
    sure: listeden(TUNING.mesai.sure, g),
    kitap: g >= 2,
    kaseler: gunKaseleri(g),
    yeniKaseler: gunKaseleri(g).filter((d) => g > 1 && !gunKaseleri(g - 1).includes(d)),
    not: g === 1 ? { gorev: GOREV_NOTU, kurallar: yeni } : null,
    oncuSarsinti: g === 1,
    sor: g >= TUNING.kisi.sorIlkGun,
    iste: g >= TUNING.kisi.isteIlkGun,
    sahteRapor: g >= TUNING.kisi.sahteRaporIlkGun,
    sahaHak: g >= TUNING.saha.ilkGun ? TUNING.saha.gunlukHak : 0,
    zarf: listeden(TUNING.kisi.zarf, g),
    pazarlikci: listeden(TUNING.kisi.kisilik.pazarlikci, g),
  };
}

/** O gün ilk kez gelen kusurlar (genişleyen kuralda yalnızca eklenenler). */
export function yeniKusurlar(gun: number): KusurId[] {
  const g = sinirla(gun);
  return gunAyar(g).yeniKurallar.flatMap((k) => yeniKusurlari(k, g));
}
