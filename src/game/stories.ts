import type { Bina, BinaEk, Hikaye, KusurId } from './building';
import { kusurluBinaKur } from './building';
import type { Rng } from './rng';

/**
 * Elle yazılmış "hikâye binası" şablonu: sabit kusurlar, isteğe bağlı sabit
 * yıl/kat, sahip ve söz. Rastgele kısımlar (kolon sayısı, mesafeler...) rng'den gelir.
 */
export interface HikayeSablonu {
  id: string;
  /** Hangi günün dosyalarına karışır. */
  gun: number;
  adres: string;
  kusurlar: KusurId[];
  hikaye: Hikaye;
  kendiBinan?: boolean;
  yil?: number;
  ruhsatKat?: number;
}

// TODO(takım): gerçek hikâye metinleri, sahip adları ve binaları.
export const HIKAYELER: HikayeSablonu[] = [
  {
    id: 'hikaye-1',
    gun: 2,
    adres: 'Bina H1',
    kusurlar: ['kesikKolon'],
    hikaye: { sahip: '[Mal sahibinin adı]', soz: '[Mal sahibinin sözü]' },
  },
  {
    id: 'hikaye-2',
    gun: 5,
    adres: '[Kendi apartmanın]',
    kusurlar: ['dusukBeton', 'caprazCatlak'],
    hikaye: { sahip: '[Komşu]', soz: '[Komşunun sözü]' },
    kendiBinan: true,
  },
];

export function hikayeBinasiKur(rng: Rng, s: HikayeSablonu): Bina {
  const ek: BinaEk = { id: s.id, adres: s.adres, hikaye: s.hikaye };
  if (s.kendiBinan) ek.kendiBinan = true;
  if (s.yil !== undefined) ek.yil = s.yil;
  if (s.ruhsatKat !== undefined) ek.ruhsatKat = s.ruhsatKat;
  return kusurluBinaKur(rng, s.kusurlar, ek);
}
