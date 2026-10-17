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

// G31: lider onaylı (docs/TAKIM_CEVAPLARI.md 8).
export const HIKAYELER: HikayeSablonu[] = [
  {
    id: 'hikaye-1',
    gun: 2,
    adres: 'Bina H1',
    kusurlar: ['kesikKolon'],
    hikaye: { sahip: 'Kasap Rıza Usta', soz: 'Kolonu kestirince dükkân iki katına çıktı, işler açıldı.' },
  },
  {
    id: 'hikaye-2',
    gun: 5,
    adres: 'Senin apartmanın',
    kusurlar: ['dusukBeton', 'caprazCatlak'],
    hikaye: { sahip: 'Komşun Nermin Hanım', soz: 'Siz de bu binada oturuyorsunuz, bilirsiniz ne halde olduğunu.' },
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
