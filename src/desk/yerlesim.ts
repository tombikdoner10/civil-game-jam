import type { BelgeTuru } from '../game/building';

/** Masadaki yerleşim (nesne ortası, ekran). Biraz dağınık ama okunur. */
export interface Yerlesim {
  belge: Record<BelgeTuru, [number, number]>;
  kitap: [number, number];
  not: [number, number];
}

/** Gün 4-5: altı belge ve kitap. Gün 2-3 aynı yerleri kullanır (gelmeyen belgelerin yeri boş kalır). */
const TAM: Yerlesim = {
  belge: {
    foto: [196, 700],
    ruhsat: [572, 628],
    proje: [580, 920],
    vaziyet: [984, 636],
    karot: [968, 936],
    zemin: [1352, 920],
  },
  kitap: [1388, 640],
  not: [1000, 680],
};

/** Gün 1: yalnızca fotoğraf, ruhsat ve kural notu; masanın ortasına toplanır, göz hemen bulsun. */
const GUN1: Yerlesim = {
  belge: { ...TAM.belge, foto: [272, 744], ruhsat: [672, 688] },
  kitap: TAM.kitap,
  not: [1136, 696],
};

export function yerlesim(gun: number): Yerlesim {
  return gun <= 1 ? GUN1 : TAM;
}
