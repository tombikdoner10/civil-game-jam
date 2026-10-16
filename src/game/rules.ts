import type { AlanRef, Bina, Damga, Kural, Kusur, KusurId } from './building';
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

/**
 * Kural kitabı (gün planı, GDD). Metinler yer tutucu; takım yazacak. Gün 4'te saha kuralları ayrı
 * satırlar: inceleme modunda tek alanlı kusur, alan + kendi kural satırıyla kanıtlanır.
 */
export const KURALLAR: Kural[] = [
  {
    id: 'kat',
    ilkGun: 1,
    kusurlar: ['kacakKat'],
    metin: `[Kural: ruhsattaki kat sayısı (zemin dahil) fotoğraftakiyle aynı olmalı. 1 fazla kat: GÜÇLENDİR, ${TUNING.kacakKatBosaltFark}+: BOŞALT]`,
  },
  {
    id: 'kolon',
    ilkGun: 2,
    kusurlar: ['kesikKolon', 'caprazCatlak'],
    metin: '[Kural: zemin katta kolon kesilmemiş, gövdede çapraz çatlak olmamalı]',
  },
  { id: 'beton', ilkGun: 3, kusurlar: ['dusukBeton'], metin: `[Kural: beton dayanımı en az ${TUNING.betonEsikMpa} MPa]` },
  { id: 'dere', ilkGun: 4, kusurlar: ['dereyeYakin'], metin: `[Kural: dere yatağına en az ${TUNING.dereMinM} m]` },
  { id: 'fay', ilkGun: 4, kusurlar: ['fayaYakin'], metin: `[Kural: fay hattına en az ${TUNING.fayMinM} m]` },
  { id: 'zeminEtudu', ilkGun: 4, kusurlar: ['zeminEtuduYok'], metin: '[Kural: dosyada zemin etüdü olmalı]' },
  { id: 'sivilasma', ilkGun: 4, kusurlar: ['sivilasma'], metin: '[Kural: zeminde sıvılaşma riski olmamalı]' },
  { id: 'belge', ilkGun: 5, kusurlar: ['sahteBelge'], metin: '[Kural: belge tarihleri ve mühür tutarlı olmalı]' },
];

/** Gün 1 kural notunun ilk satırı: oyunun hedefi (yer tutucu, takım yazacak). */
export const GOREV_NOTU = '[Görev: belgeleri karşılaştır, kurala uymayanı damgala]';

function kusur(id: KusurId): Kusur {
  return { id, ...KUSUR_BILGI[id] };
}

/** Kaçak kat: ciddiyet fazla kat sayısına bağlı (1: GÜÇLENDİR, TUNING.kacakKatBosaltFark ve üstü: BOŞALT). */
export function kacakKatKusuru(fark: number): Kusur {
  const n = Math.abs(fark);
  return {
    ...kusur('kacakKat'),
    etiket: `${KUSUR_BILGI.kacakKat.etiket} (+${n})`,
    ciddiyet: n >= TUNING.kacakKatBosaltFark ? 'bosalt' : 'guclendir',
  };
}

/** Kurallardan bağımsız: binadaki bütün gerçek kusurlar. */
export function gercekKusurlar(b: Bina): Kusur[] {
  const g = b.gercek;
  const out: Kusur[] = [];
  const fark = g.kat - b.belgeler.ruhsat.kat;
  if (fark !== 0) out.push(kacakKatKusuru(fark));
  const ids: KusurId[] = [];
  if (g.kesikKolonlar.length > 0) ids.push('kesikKolon');
  if (g.betonMpa < TUNING.betonEsikMpa) ids.push('dusukBeton');
  if (g.dereMesafeM < TUNING.dereMinM) ids.push('dereyeYakin');
  if (g.fayMesafeM < TUNING.fayMinM) ids.push('fayaYakin');
  if (b.belgeler.zemin === null) ids.push('zeminEtuduYok');
  if (g.zemin === 'sivilasma') ids.push('sivilasma');
  if (g.catlak === 'capraz') ids.push('caprazCatlak');
  if (g.ruhsatSahte) ids.push('sahteBelge');
  return out.concat(ids.map(kusur));
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

/**
 * Kurallardan bağımsız deprem riski (0-1). gizli: belgelerde kusur olarak görünmeyen zayıflıklar (düz demir,
 * deniz kumu, eski yönetmelik) da sayılsın mı (öncü sarsıntı saymaz: yalnızca kusurların bedeli görünsün).
 */
export function riskHesapla(b: Bina, gizli = true): number {
  const R = TUNING.risk;
  let r = R.taban;
  for (const k of gercekKusurlar(b)) r += k.ciddiyet === 'bosalt' ? R.bosalt : R.guclendir;
  if (!gizli) return Math.min(1, r);
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

/** Oyuncunun damgasına göre deprem sonucu. siddet: risk çarpanı (varsayılan 1). gizli: bkz. riskHesapla. */
export function depremSonucu(b: Bina, damga: Damga, siddet = 1, gizli = true): DepremSonucu {
  const R = TUNING.risk;
  let risk = riskHesapla(b, gizli) * siddet;
  if (damga === 'guclendir') risk *= R.guclendirCarpan;
  const durum: HasarDurumu = risk < R.hasarEsik ? 'ayakta' : risk < R.agirHasarEsik ? 'hasarli' : 'agirHasar';
  return { durum, bos: damga === 'bosalt', risk };
}

// ---- Büyük deprem (G5) ----

const KADEME: HasarDurumu[] = ['ayakta', 'hasarli', 'agirHasar'];

export interface BuyukDepremSonucu {
  durum: HasarDurumu;
  /** Bina çöktü mü (ağır hasarın ötesi; kademe 3). */
  coker: boolean;
  /** Bina boşaltılmış mı (içeride kimse yok). */
  bos: boolean;
  /** 0 ayakta, 1 hasarlı, 2 ağır hasar, 3 çöker. */
  kademe: number;
}

/** Belgelerde görünmeyen zayıflık: düz demir, deniz kumu ya da o günün kurallarıyla görünmeyen gerçek kusur. */
export function gizliZayiflik(b: Bina, gun: number): boolean {
  return b.gercek.demir === 'duz' || b.gercek.denizKumu || gercekKusurlar(b).length > gorunenKusurlar(b, gun).length;
}

/**
 * Büyük deprem sonucu (kademe kuralları TUNING.buyukDeprem'de). Adalet: belgelerdeki kusurlara göre doğru
 * damgalanan bina haksız cezalandırılmaz. gun: binanın damgalandığı gün (o günün kuralları). oncuHasar: öncü
 * sarsıntıdan kalan hasar (bir kademe ekler; kalan hasar geri gitmez).
 */
export function buyukDepremSonucu(
  b: Bina,
  damga: Damga,
  gun: number,
  secenek: { gizli?: boolean; oncuHasar?: HasarDurumu } = {},
): BuyukDepremSonucu {
  const B = TUNING.buyukDeprem;
  const kusurlar = gorunenKusurlar(b, gun);
  const onceki = secenek.oncuHasar ? KADEME.indexOf(secenek.oncuHasar) : 0;
  let kademe = 0;
  if (kusurlar.length > 0) {
    kademe = kusurlar.some((k) => k.ciddiyet === 'bosalt') ? B.kademe.bosaltKusur : B.kademe.guclendirKusur;
    if ((secenek.gizli ?? true) && gizliZayiflik(b, gun)) kademe += B.gizliKademe;
    if (onceki > 0) kademe += B.oncuKademe;
    kademe = Math.min(3, kademe);
    if (damga === 'guclendir') kademe = Math.min(B.guclendirTavan, Math.max(0, kademe - B.guclendirIndirim));
  }
  kademe = Math.max(kademe, onceki);
  return { durum: KADEME[Math.min(kademe, 2)], coker: kademe >= 3, bos: damga === 'bosalt', kademe };
}

// ---- İnceleme modu (G3) ----

/** İnceleme modunda seçilebilen öğe: belge alanı ya da kural kitabındaki bir kural satırı. */
export interface SecimRef {
  belge: AlanRef['belge'] | 'kural';
  alan: string;
}

/** Bu kusuru kapsayan kural (kural kitabındaki satır). */
export function kusurKurali(id: KusurId): Kural | undefined {
  return KURALLAR.find((k) => k.kusurlar.includes(id));
}

/**
 * Bu kusurun kanıtı için tıklanması gereken öğeler. İki alanlı kanıt olduğu gibi; tek alanlı kanıtta
 * alan ve o kusuru kapsayan kural satırı (eşik kural kitabında).
 */
export function kanitOgeleri(id: KusurId): SecimRef[] {
  const kanit: SecimRef[] = KUSUR_BILGI[id].kanit.slice();
  if (kanit.length === 1) {
    const kural = kusurKurali(id);
    if (kural) kanit.push({ belge: 'kural', alan: kural.id });
  }
  return kanit;
}

const ayni = (a: SecimRef, b: SecimRef): boolean => a.belge === b.belge && a.alan === b.alan;

/** Seçim, kusurun kanıt öğeleriyle (sırası önemsiz) aynı mı? */
export function kanitEslesir(id: KusurId, secim: readonly SecimRef[]): boolean {
  const kanit = kanitOgeleri(id);
  return kanit.length === secim.length && kanit.every((k) => secim.some((s) => ayni(k, s)));
}

/** Seçimin kanıtladığı, o gün görünen (kuralı gelmiş) kusur; yoksa null. */
export function seciminKusuru(b: Bina, gun: number, secim: readonly SecimRef[]): Kusur | null {
  return gorunenKusurlar(b, gun).find((k) => kanitEslesir(k.id, secim)) ?? null;
}
