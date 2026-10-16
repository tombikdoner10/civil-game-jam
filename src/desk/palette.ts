// @beyan görsel
/**
 * Masa sahnesinin tek paleti: solgun, kasvetli, Papers, Please havası.
 * Renkler CSS dizgisi; Phaser sayısı gerekirse num() ile çevir.
 */

export const PAL = {
  // Oda ve masa
  duvar: '#2b2926',
  duvarAcik: '#35322e',
  duvarKoyu: '#1f1d1b',
  cerceve: '#46423b',
  cerceveAcik: '#5d584e',
  cerceveKoyu: '#161514',
  masa: '#3b302a',
  masaAcik: '#45382f',
  masaKoyu: '#2e2521',
  tezgah: '#55514a',
  tezgahAcik: '#6f6a5f',
  tezgahKoyu: '#34312d',
  golge: '#000000',

  // Kâğıtlar
  krem: '#d6c9a4',
  kremKoyu: '#bfb08a',
  kremAcik: '#e3d8b8',
  kirliBeyaz: '#d3cec0',
  kirliBeyazKoyu: '#b9b3a3',
  lab: '#c5cab6',
  labKoyu: '#a9af98',
  teknik: '#d2cfbf',
  teknikIzgara: '#c2bea9',
  plan: '#4c6680',
  planKoyu: '#3e566e',
  planIzgara: '#567290',
  planCizgi: '#d5dfe6',
  planDere: '#9cc6dc',
  fotoKenar: '#e0ddd2',
  fotoKenarKoyu: '#c4c0b2',
  fisKirmizi: '#d4b2a6',
  fisYesil: '#bfc9a9',

  // Mürekkep ve yazı
  murekkep: '#26211e',
  murekkepSoluk: '#5d5348',
  murekkepAcik: '#857a6b',
  /** Belge etiketleri: soluk ama kâğıt üstünde yeterli kontrast. */
  etiket: '#3d342c',
  basikSerit: '#5d3530',
  mavisi: '#3f4f78',
  muhur: '#5a4f7a',
  damgaGuvenli: '#3f7a4a',
  damgaGuclendir: '#b08a2c',
  damgaBosalt: '#a8352d',
  fay: '#c0504a',

  // Dışarısı (akşamüstü)
  gok: ['#4f4c5c', '#5e5866', '#6f656c', '#857470', '#9c8676', '#b29a7e', '#c2a986'],
  uzakBina: '#4a4552',
  uzakBinaKoyu: '#3e3a46',
  isik: '#c9a85a',
  isikKoyu: '#a8873f',
  asfalt: '#2d2b2c',
  asfaltCizgi: '#8a8470',
  kaldirim: '#6a665f',

  // Gişe
  buzlu: '#8b938d',
  buzluAcik: '#9aa29b',
  buzluKoyu: '#7c847f',
  siluet: '#1c1d20',

  // Panel yazıları
  panel: '#151413',
  panelKenar: '#57524a',
  panelYazi: '#c9c0a8',
  saat: '#d9a441',
} as const;

/** CSS rengini Phaser sayısına çevirir ('#rrggbb' → 0xrrggbb). */
export function num(c: string): number {
  return parseInt(c.slice(1, 7), 16);
}

/**
 * Tiny Town karolarının yeniden boyanması için rampalar (koyudan açığa, 5 ton).
 * Paketteki mavi-gri taş tonları ve kahve-kırmızı tonlar bu rampalara eşlenir.
 */
export const RAMPA = {
  beton: ['#26252a', '#46454a', '#58565a', '#8a867f', '#aaa49a'],
  bej: ['#2a2422', '#55493f', '#685a4e', '#9d8c76', '#bfae94'],
  yesil: ['#22262a', '#454f4c', '#56625d', '#86918a', '#a8b0a6'],
  pembe: ['#2a2223', '#574546', '#6a5553', '#a0857c', '#bea59a'],
  tugla: ['#2a1e1c', '#5a3a31', '#6e483b', '#94664f', '#ad8a70'],
  cerceve: ['#2a1e1c', '#4a3530', '#5e4439', '#7a5c4a', '#93785f'],
  arduaz: ['#1f2024', '#36383e', '#43464d', '#5d6068', '#757780'],
  kiremit: ['#2a1d1b', '#5a342c', '#6d3f33', '#8a5442', '#a06c58'],
  zeytin: ['#2b2e25', '#3f4a37', '#525c40', '#5f6a4a', '#6f7a58'],
} as const;

export type RampaAdi = keyof typeof RAMPA;

export const CAM = { acik: '#8c9a9c', koyu: '#56636a', yanik: '#c9a85a', yanikKoyu: '#a8873f' } as const;
export const KONTUR = '#1d191b';
