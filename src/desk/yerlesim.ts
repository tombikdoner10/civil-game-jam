import type { BelgeTuru } from '../game/building';

/** Masadaki yerleşim (nesne ortası, ekran). Biraz dağınık ama okunur. kitap: kapalı yönetmelik klasörü. */
export interface Yerlesim {
  belge: Record<BelgeTuru, [number, number]>;
  kitap: [number, number];
  not: [number, number];
}

/*
 * Masa y 464-1080 (616 px). Sağ sınır 1544 (kaşeliğin solu; Kaselik.RAF_SOL). Belgeler masa üst kenarından en az 24 px
 * aşağıda (başlık bandı tezgâha değmesin), aralarında en az 24 px boşluk, alt kenardan en az 8 px yukarıda.
 * Boylar (documents.ts BOY): foto 304×416, ruhsat 376×320, proje 392×240, vaziyet 392×312, karot 328×224,
 * zemin 328×248; kapalı klasör 232×292.
 */

/**
 * Gün 4-5: altı belge ve kitap, dört sütun.
 * 1: fotoğraf · 2: ruhsat ve altında karot · 3: vaziyet planı ve altında proje özeti · 4: kitap ve altında zemin etüdü.
 */
const TAM: Yerlesim = {
  belge: {
    foto: [192, 704], // 496-912
    ruhsat: [560, 652], // 492-812
    karot: [560, 956], // 844-1068
    vaziyet: [972, 648], // 492-804
    proje: [972, 948], // 828-1068
    zemin: [1364, 948], // 824-1072
  },
  kitap: [1388, 652],
  not: [1000, 680],
};

/**
 * Gün 2-3: fotoğraf, ruhsat, proje özeti (gün 3'te karot). Az belge: tek sıra, masanın ortasına yakın;
 * karot proje özetinin altına.
 */
const GUN23: Yerlesim = {
  belge: {
    ...TAM.belge,
    foto: [200, 732], // 524-940
    ruhsat: [584, 692], // 532-852
    proje: [996, 640], // 520-760
    karot: [996, 920], // 808-1032
  },
  kitap: TAM.kitap,
  not: TAM.not,
};

/** Gün 1: yalnızca fotoğraf, ruhsat ve kural notu; masanın ortasına toplanır, göz hemen bulsun. */
const GUN1: Yerlesim = {
  belge: { ...TAM.belge, foto: [272, 744], ruhsat: [672, 688] },
  kitap: TAM.kitap,
  // G31: kural notu "yönerge" satırıyla uzadı; üst kenarı tezgâh bandının altında kalsın (y 498-974).
  not: [1136, 736],
};

export function yerlesim(gun: number): Yerlesim {
  if (gun <= 1) return GUN1;
  if (gun <= 3) return GUN23;
  return TAM;
}
