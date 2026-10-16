import { Rng } from './rng';
import { TUNING } from './tuning';
import { KURALLAR } from './rules';
import { HIKAYELER, hikayeBinasiKur } from './stories';

// ---- Temel tipler ----

export type Zemin = 'saglam' | 'orta' | 'sivilasma';
export type Demir = 'nervurlu' | 'duz';
export type Catlak = 'yok' | 'kilcal' | 'capraz';
export type Damga = 'guvenli' | 'guclendir' | 'bosalt';
export type Ciddiyet = 'guclendir' | 'bosalt';

export type KusurId =
  | 'kacakKat'
  | 'kesikKolon'
  | 'dusukBeton'
  | 'dereyeYakin'
  | 'fayaYakin'
  | 'zeminEtuduYok'
  | 'sivilasma'
  | 'caprazCatlak'
  | 'sahteBelge';

export type BelgeTuru = 'ruhsat' | 'proje' | 'foto' | 'karot' | 'zemin' | 'vaziyet';

/**
 * Belge üzerinde tıklanabilir bir alan.
 * Alan adları: ruhsat: kat | yil | muhur; proje: kolon; foto: kat | kolon | catlak;
 * karot: mpa; zemin: tur | rapor; vaziyet: dere | fay.
 */
export interface AlanRef {
  belge: BelgeTuru;
  alan: string;
}

/**
 * Kusurun kanıtı (G3 inceleme modu için): oyuncunun tıklaması gereken alanların
 * TAMAMI (sırası önemsiz). 1 ya da 2 eleman. İki elemanlıda çelişen iki alan,
 * tek elemanlıda tek alan (karşılaştırma kural kitabındaki eşikle yapılır).
 */
export type Kanit = AlanRef[];

export interface Kusur {
  id: KusurId;
  etiket: string;
  ciddiyet: Ciddiyet;
  kanit: Kanit;
}

export interface Kural {
  id: string;
  /** İlk aktif olduğu gün (1-5). */
  ilkGun: number;
  kusurlar: KusurId[];
  /** Yer tutucu kural kitabı metni. */
  metin: string;
}

// ---- Bina ----

export interface GercekDurum {
  kat: number;
  zeminKolonSayisi: number;
  /** Kesik (yerine vitrin açılmış) kolonların konumları. Boşsa kesik kolon yok. */
  kesikKolonlar: number[];
  betonMpa: number;
  demir: Demir;
  denizKumu: boolean;
  catlak: Catlak;
  dereMesafeM: number;
  fayMesafeM: number;
  zemin: Zemin;
  /** Ruhsat sahte mi (5. gün). */
  ruhsatSahte: boolean;
}

export interface Ruhsat {
  kat: number;
  yil: number;
  /** Mühür yılı. Sahte belgede yapım yılından sonradır. */
  muhurYili: number;
}
export interface ProjeOzeti {
  zeminKolonSayisi: number;
}
export interface Fotograf {
  gorunenKat: number;
  /** Kolonun olması gereken yerde vitrin olan konumlar. */
  vitrinKolonlar: number[];
  gorunenCatlak: Catlak;
  denizKabugu: boolean;
}
export interface KarotSonucu {
  mpa: number;
}
export interface ZeminEtudu {
  tur: Zemin;
}
export interface VaziyetPlani {
  dereM: number;
  fayM: number;
}

export interface Belgeler {
  ruhsat: Ruhsat;
  proje: ProjeOzeti;
  foto: Fotograf;
  /** null: karot raporu dosyada yok. */
  karot: KarotSonucu | null;
  /** null: zemin etüdü dosyada yok. */
  zemin: ZeminEtudu | null;
  vaziyet: VaziyetPlani;
}

export interface Hikaye {
  sahip: string;
  soz: string;
}

export interface Bina {
  id: string;
  adres: string;
  yil: number;
  gercek: GercekDurum;
  belgeler: Belgeler;
  hikaye?: Hikaye;
  kendiBinan?: boolean;
}

// ---- Üretici ----

export interface UretimSecenekleri {
  /** Kusursuz bina oranı (0-1). Varsayılan TUNING.olasilik.temiz. */
  temizOran?: number;
  /** Henüz kuralı olmayan bir kusurun eklenme oranı (0-1). Varsayılan 0. */
  gizliKusurOrani?: number;
  /** Binadaki en çok kusur sayısı (aktif kurallardan). Varsayılan 2. */
  kusurMax?: number;
}

export interface BinaEk {
  id?: string;
  adres?: string;
  yil?: number;
  ruhsatKat?: number;
  hikaye?: Hikaye;
  kendiBinan?: boolean;
}

const CATISAN: [KusurId, KusurId][] = [['sivilasma', 'zeminEtuduYok']];

function catisir(a: KusurId, secili: KusurId[]): boolean {
  return CATISAN.some(([x, y]) => (a === x && secili.includes(y)) || (a === y && secili.includes(x)));
}

function aktifKusurlar(gun: number): KusurId[] {
  const out: KusurId[] = [];
  for (const k of KURALLAR) if (k.ilkGun <= gun) out.push(...k.kusurlar);
  return out;
}

function pasifKusurlar(gun: number): KusurId[] {
  const out: KusurId[] = [];
  for (const k of KURALLAR) if (k.ilkGun > gun) out.push(...k.kusurlar);
  return out;
}

/** Fotoğraf, gerçek durumdan türetilir. */
export function fotografUret(g: GercekDurum): Fotograf {
  return {
    gorunenKat: g.kat,
    vitrinKolonlar: g.kesikKolonlar.slice(),
    gorunenCatlak: g.catlak,
    denizKabugu: g.denizKumu,
  };
}

/** Verilen kusurlarla (tam olarak bunlarla) bina kurar. Belgeler gerçek durumdan türetilir. */
export function kusurluBinaKur(rng: Rng, kusurlar: readonly KusurId[], ek: BinaEk = {}): Bina {
  const T = TUNING;
  const has = (k: KusurId) => kusurlar.includes(k);

  const yil = ek.yil ?? rng.int(T.yil.min, T.yil.max);
  const ruhsatKat = ek.ruhsatKat ?? rng.int(T.kat.min, T.kat.max);
  const kat = ruhsatKat + (has('kacakKat') ? rng.int(T.kacakKatEkle.min, T.kacakKatEkle.max) : 0);

  const kolonSayisi = rng.int(T.kolon.min, T.kolon.max);
  const kesik: number[] = [];
  if (has('kesikKolon')) {
    const n = rng.int(T.kesikKolonSayisi.min, T.kesikKolonSayisi.max);
    const idx = rng.shuffle(Array.from({ length: kolonSayisi }, (_, i) => i)).slice(0, n);
    kesik.push(...idx.sort((a, b) => a - b));
  }

  const betonMpa = has('dusukBeton')
    ? rng.int(T.betonDusuk.min, T.betonDusuk.max)
    : rng.int(T.betonIyi.min, T.betonIyi.max);

  const dereMesafeM = has('dereyeYakin')
    ? rng.int(T.dereKotu.min, T.dereKotu.max)
    : rng.int(T.dereIyi.min, T.dereIyi.max);
  const fayMesafeM = has('fayaYakin')
    ? rng.int(T.fayKotu.min, T.fayKotu.max)
    : rng.int(T.fayIyi.min, T.fayIyi.max);

  const zemin: Zemin = has('sivilasma')
    ? 'sivilasma'
    : rng.chance(T.olasilik.zeminSaglam)
      ? 'saglam'
      : 'orta';

  const catlak: Catlak = has('caprazCatlak')
    ? 'capraz'
    : rng.chance(T.olasilik.kilcalCatlak)
      ? 'kilcal'
      : 'yok';

  const demir: Demir = rng.chance(yil < 1985 ? T.olasilik.duzDemirEski : T.olasilik.duzDemirYeni)
    ? 'duz'
    : 'nervurlu';
  const denizKumu = rng.chance(T.olasilik.denizKumu);
  const ruhsatSahte = has('sahteBelge');

  const gercek: GercekDurum = {
    kat,
    zeminKolonSayisi: kolonSayisi,
    kesikKolonlar: kesik,
    betonMpa,
    demir,
    denizKumu,
    catlak,
    dereMesafeM,
    fayMesafeM,
    zemin,
    ruhsatSahte,
  };

  const muhurYili = ruhsatSahte
    ? yil + rng.int(T.sahteMuhurFark.min, T.sahteMuhurFark.max)
    : yil - rng.int(T.gercekMuhurFark.min, T.gercekMuhurFark.max);

  const karotVar = has('dusukBeton') || !rng.chance(T.olasilik.karotYok);

  const belgeler: Belgeler = {
    ruhsat: { kat: ruhsatKat, yil, muhurYili },
    proje: { zeminKolonSayisi: kolonSayisi },
    foto: fotografUret(gercek),
    karot: karotVar ? { mpa: betonMpa } : null,
    zemin: has('zeminEtuduYok') ? null : { tur: zemin },
    vaziyet: { dereM: dereMesafeM, fayM: fayMesafeM },
  };

  const bina: Bina = {
    id: ek.id ?? 'bina',
    adres: ek.adres ?? 'Bina 00',
    yil,
    gercek,
    belgeler,
  };
  if (ek.hikaye) bina.hikaye = ek.hikaye;
  if (ek.kendiBinan) bina.kendiBinan = true;
  return bina;
}

/** O güne kadar aktif kurallardan 0-2 kusurlu bina üretir. */
export function binaUret(rng: Rng, gun: number, secenek: UretimSecenekleri = {}, ek: BinaEk = {}): Bina {
  const temizOran = secenek.temizOran ?? TUNING.olasilik.temiz;
  const gizli = secenek.gizliKusurOrani ?? 0;
  const kusurMax = secenek.kusurMax ?? 2;

  const secili: KusurId[] = [];
  if (!rng.chance(temizOran)) {
    const adet = kusurMax >= 2 && rng.chance(TUNING.olasilik.ikinciKusur) ? 2 : 1;
    for (const k of rng.shuffle(aktifKusurlar(gun))) {
      if (secili.length >= adet) break;
      if (!catisir(k, secili)) secili.push(k);
    }
  }
  if (gizli > 0 && rng.chance(gizli)) {
    for (const k of rng.shuffle(pasifKusurlar(gun))) {
      if (!catisir(k, secili)) {
        secili.push(k);
        break;
      }
    }
  }
  return kusurluBinaKur(rng, secili, ek);
}

export interface GunDosyaSecenekleri extends UretimSecenekleri {
  /** O güne ait hikâye binalarını dosyalara karıştır. Varsayılan true. */
  hikayeDahil?: boolean;
}

/** Aynı tohum ve gün, aynı dosyalar. */
export function gunDosyalari(tohum: number, gun: number, adet: number, secenek: GunDosyaSecenekleri = {}): Bina[] {
  const rng = new Rng(((tohum >>> 0) ^ Math.imul(gun, 0x9e3779b1)) >>> 0);
  const dosyalar: Bina[] = [];
  for (let i = 0; i < adet; i++) {
    const no = String(i + 1).padStart(2, '0');
    dosyalar.push(binaUret(rng, gun, secenek, { id: `g${gun}-${no}`, adres: `Bina ${no}` }));
  }
  if (secenek.hikayeDahil !== false) {
    const sablonlar = HIKAYELER.filter((s) => s.gun === gun);
    const yerler = rng.shuffle(dosyalar.map((_, i) => i));
    sablonlar.forEach((s, j) => {
      if (j < yerler.length) dosyalar[yerler[j]] = hikayeBinasiKur(rng, s);
    });
  }
  return dosyalar;
}
