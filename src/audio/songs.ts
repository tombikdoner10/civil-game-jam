import type { Song } from './music';

/**
 * SADECE SİSTEM TESTİ İÇİN (Oyun Alanı sahnesi). Oyunun müzikleri tema açıklandıktan sonra,
 * jam sırasında yazılacak; bu desenler teslim edilen oyunda kullanılmayacak.
 */

export const TEST_LOOP: Song = {
  bpm: 112,
  tracks: [
    { inst: 'kick', pattern: 'x . . . x . . . x . . . x . . .', volume: 0.7 },
    { inst: 'snare', pattern: '. . . . x . . . . . . . x . . x', volume: 0.35 },
    { inst: 'hat', pattern: 'x . x . x . x . x . x . x . X -', volume: 0.2 },
    { inst: 'triangle', pattern: 'C3 - - . C3 . G2 - A2 - - . F2 . G2 .', volume: 0.55 },
    { inst: 'square', pattern: 'E4 . G4 . C5 . G4 . A4 - - . G4 . E4 .', volume: 0.12, lowpass: 2500 },
  ],
};

export const TEST_JINGLE: Song = {
  bpm: 150,
  loop: false,
  tracks: [
    { inst: 'square', pattern: 'C5 E5 G5 C6 - - - .', volume: 0.18, lowpass: 4000 },
    { inst: 'triangle', pattern: 'C3 - - - C4 - - .', volume: 0.45 },
  ],
};
