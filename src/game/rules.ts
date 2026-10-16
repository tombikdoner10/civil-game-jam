import type { Bina, Damga, Kural, Kusur, KusurId } from './building';
import { TUNING } from './tuning';

/** Kusur başına yer tutucu etiket, ciddiyet ve kanıt alanları. */
export const KUSUR_BILGI: Record<KusurId, Omit<Kusur, 'id'>> = {
  kacakKat: {
    etiket: 'Kaçak kat',
    ciddiyet: 'guclendir',
    kanit: [{ belge: 'ruhsat', alan: 'kat' }, { belge: 'foto', alan: 'kat' }],
  },
  kesikKolon: {
    etiket: 'Kesik kolon',
    ciddiyet: 'bosalt',
    kanit: [{ belge: 'proje', alan: 'kolon' }, { belge: 'foto', alan: 'kolon' }],
  },
  dusukBeton: {
    etiket: 'Düşük beton',
    ciddiyet: 'bosalt',
    kanit: [{ belge: 'karot', alan: 'mpa' }],
  },
  dereyeYakin: {
    etiket: 'Dereye yakın',
    ciddiyet: 'guclendir',
    kanit: [{ belge: 'vaziyet', alan: 'dere' }],
  },
  fayaYakin: {
    etiket: 'Faya yakın',
    ciddiyet: 'guclendir',
    kanit: [{ belge: 'vaziyet', alan: 'fay' }],
  },
  zeminEtuduYok: {
    etiket: 'Zemin etüdü yok',
    ciddiyet: 'guclendir',
    kanit: [{ belge: 'zemin', alan: 'rapor' }],
  },
  sivilasma: {
    etiket: 'Sıvılaşma riski',
    ciddiyet: 'bosalt',
    kanit: [{ belge: 'zemin', alan: 'tur' }],
  },
  caprazCatlak: {
    etiket: 'Çapraz çatlak',
    ciddiyet: 'bosalt',
    kanit: [{ belge: 'foto', alan: 'catlak' }],
  },
  sahteBelge: {
    etiket: 'Sahte belge',
    ciddiyet: 'guclendir',
    kanit: [{ belge: 'ruhsat', alan: 'yil' }, { belge: 'ruhsat', alan: 'muhur' }],
  },
};

export const KUSUR_IDLERI = Object.keys(KUSUR_BILGI) as KusurId[];

/** Kural kitabı (gün planı, GDD). Metinler yer tutucu. */
export const KURALLAR: Kural[] = [
  { id: 'kat', ilkGun: 1, kusurlar: ['kacakKat'], metin: '[Kural: ruhsattaki kat sayısı gerçekle aynı olmalı]' },
  {
    id: 'kolon',
    ilkGun: 2,
    kusurlar: ['kesikKolon', 'caprazCatlak'],
    metin: '[Kural: zemin katta kolon kesilmemiş, gövdede çapraz çatlak olmamalı]',
  },
  { id: 'beton', ilkGun: 3, kusurlar: ['dusukBeton'], metin: `[Kural: beton dayanımı en az ${TUNING.betonEsikMpa} MPa]` },
  {
    id: 'saha',
    ilkGun: 4,
    kusurlar: ['dereyeYakin', 'fayaYakin', 'zeminEtuduYok', 'sivilasma'],
    metin: `[Kural: dereye en az ${TUNING.dereMinM} m, faya en az ${TUNING.fayMinM} m; zemin etüdü olmalı, sıvılaşma olmamalı]`,
  },
  { id: 'belge', ilkGun: 5, kusurlar: ['sahteBelge'], metin: '[Kural: belge tarihleri ve mühür tutarlı olmalı]' },
];

function kusur(id: KusurId): Kusur {
  return { id, ...KUSUR_BILGI[id] };
}

/** Kurallardan bağımsız: binadaki bütün gerçek kusurlar. */
export function gercekKusurlar(b: Bina): Kusur[] {
  const g = b.gercek;
  const out: KusurId[] = [];
  if (g.kat !== b.belgeler.ruhsat.kat) out.push('kacakKat');
  if (g.kesikKolonlar.length > 0) out.push('kesikKolon');
  if (g.betonMpa < TUNING.betonEsikMpa) out.push('dusukBeton');
  if (g.dereMesafeM < TUNING.dereMinM) out.push('dereyeYakin');
  if (g.fayMesafeM < TUNING.fayMinM) out.push('fayaYakin');
  if (b.belgeler.zemin === null) out.push('zeminEtuduYok');
  if (g.zemin === 'sivilasma') out.push('sivilasma');
  if (g.catlak === 'capraz') out.push('caprazCatlak');
  if (g.ruhsatSahte) out.push('sahteBelge');
  return out.map(kusur);
}

export function aktifKurallar(gun: number): Kural[] {
  return KURALLAR.filter((k) => k.ilkGun <= gun);
}

/** O güne kadar aktif kurallara göre görünen (yakalanabilir) kusurlar. */
export function gorunenKusurlar(b: Bina, gun: number): Kusur[] {
  const kapsam = new Set<KusurId>();
  for (const k of aktifKurallar(gun)) for (const id of k.kusurlar) kapsam.add(id);
  return gercekKusurlar(b).filter((k) => kapsam.has(k.id));
}

/** Aktif kusurların en ağırına göre doğru damga. */
export function dogruDamga(b: Bina, gun: number): Damga {
  const kusurlar = gorunenKusurlar(b, gun);
  if (kusurlar.some((k) => k.ciddiyet === 'bosalt')) return 'bosalt';
  if (kusurlar.length > 0) return 'guclendir';
  return 'guvenli';
}

/** Kurallardan bağımsız deprem riski (0-1). */
export function riskHesapla(b: Bina): number {
  const R = TUNING.risk;
  let r = R.taban;
  for (const k of gercekKusurlar(b)) r += k.ciddiyet === 'bosalt' ? R.bosalt : R.guclendir;
  if (b.gercek.demir === 'duz') r += R.duzDemir;
  if (b.gercek.denizKumu) r += R.denizKumu;
  if (b.yil < TUNING.eskiYapiYili) r += R.eskiYapi;
  return Math.min(1, r);
}

export type HasarDurumu = 'ayakta' | 'hasarli' | 'agirHasar';
export interface DepremSonucu {
  durum: HasarDurumu;
  /** Bina boşaltılmış mı (içeride kimse yok). */
  bos: boolean;
  risk: number;
}

/** Oyuncunun damgasına göre deprem sonucu. siddet: risk çarpanı (varsayılan 1). */
export function depremSonucu(b: Bina, damga: Damga, siddet = 1): DepremSonucu {
  const R = TUNING.risk;
  let risk = riskHesapla(b) * siddet;
  if (damga === 'guclendir') risk *= R.guclendirCarpan;
  const durum: HasarDurumu = risk < R.hasarEsik ? 'ayakta' : risk < R.agirHasarEsik ? 'hasarli' : 'agirHasar';
  return { durum, bos: damga === 'bosalt', risk };
}
