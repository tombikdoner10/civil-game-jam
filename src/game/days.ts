import type { BelgeTuru, Kural, KusurId } from './building';
import { aktifKurallar, GOREV_NOTU, KURALLAR } from './rules';
import { TUNING } from './tuning';

/** Oyundaki gün sayısı. Son günün sonunda (şimdilik) sonuç ekranına geçilir; büyük deprem G5'te. */
export const SON_GUN = 5;

/** Bir günün yapılandırması: o gün masada ne var, kaç dosya gelir, mesai ne kadar. */
export interface GunAyar {
  gun: number;
  /** O gün yürürlükteki bütün kurallar (kural kitabı). */
  kurallar: Kural[];
  /** O gün ilk kez gelen kurallar (kitapta "YENİ"; üretici bunları ilk iki dosyadan birine koyar). */
  yeniKurallar: Kural[];
  /** Masaya gelen belge türleri (kurallar geldikçe eklenir). */
  belgeler: BelgeTuru[];
  dosyaSayisi: number;
  /** Mesai süresi (gerçek saniye; dosya gelip giderken saat durur). */
  sure: number;
  /** Kural kitabı masada mı (gün 2'den itibaren). */
  kitap: boolean;
  /** Masadaki küçük kural notu (gün 1): hedef satırı ve o günün kuralı. Yoksa null. */
  not: { gorev: string; kurallar: Kural[] } | null;
  /** Gün sonu ekranından önce öncü sarsıntı olacak mı (G4b dolduracak; şimdilik yalnızca işaret). */
  oncuSarsinti: boolean;
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

function sinirla(gun: number): number {
  return Math.min(Math.max(Math.floor(gun), 1), SON_GUN);
}

function listeden<T>(liste: readonly T[], gun: number): T {
  return liste[Math.min(sinirla(gun), liste.length) - 1];
}

/** Günün yapılandırması (gün 1-5; dışındakiler sınıra çekilir). */
export function gunAyar(gun: number): GunAyar {
  const g = sinirla(gun);
  const yeni = KURALLAR.filter((k) => k.ilkGun === g);
  return {
    gun: g,
    kurallar: aktifKurallar(g),
    yeniKurallar: yeni,
    belgeler: BELGE_SIRASI.filter((t) => BELGE_GUNU[t] <= g),
    dosyaSayisi: listeden(TUNING.mesai.dosyaSayisi, g),
    sure: listeden(TUNING.mesai.sure, g),
    kitap: g >= 2,
    not: g === 1 ? { gorev: GOREV_NOTU, kurallar: yeni } : null,
    oncuSarsinti: g === 1,
  };
}

/** O gün ilk kez gelen kuralların kusurları. */
export function yeniKusurlar(gun: number): KusurId[] {
  return gunAyar(gun).yeniKurallar.flatMap((k) => k.kusurlar);
}
