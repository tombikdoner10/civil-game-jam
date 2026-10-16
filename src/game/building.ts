import { Rng } from './rng';
import { TUNING } from './tuning';
import { gorunenKusurlar, KURALLAR } from './rules';
import { HIKAYELER, hikayeBinasiKur } from './stories';

// ---- Temel tipler ----

export type Zemin = 'saglam' | 'orta' | 'sivilasma';
export type Demir = 'nervurlu' | 'duz';
export type Catlak = 'yok' | 'kilcal' | 'capraz';
/** Damgalar. İADE: dosya eksik ve tamamlanamadı; bina denetlenmeden geri çevrilir (içinde insanlar kalır). */
export type Damga = 'guvenli' | 'guclendir' | 'bosalt' | 'iade';
/** Kusurun gerektirdiği damga. 'iade': eksik belge (karot ya da zemin etüdü yok). */
export type Ciddiyet = 'guclendir' | 'bosalt' | 'iade';

export type KusurId =
  | 'kacakKat'
  | 'kesikKolon'
  | 'dusukBeton'
  | 'karotYok'
  | 'dereyeYakin'
  | 'fayaYakin'
  | 'zeminEtuduYok'
  | 'sivilasma'
  | 'caprazCatlak'
  | 'sahteBelge'
  /** Gişeden getirilen sahte rapor (G17). Binanın değil oturumun kusuru: üretici kullanmaz. */
  | 'sahteRapor';

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
  /** Kaçak kat varsa fazla kat sayısı (verilmezse TUNING.kacakKatEkle aralığından). */
  kacakFark?: number;
  hikaye?: Hikaye;
  kendiBinan?: boolean;
}

/** Aynı binada birlikte olamayan kusurlar (eksik belge, arkasında saklanan kusurla birlikte seçilmez). */
const CATISAN: [KusurId, KusurId][] = [
  ['sivilasma', 'zeminEtuduYok'],
  ['dusukBeton', 'karotYok'],
];

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
  const kat = ruhsatKat + (has('kacakKat') ? (ek.kacakFark ?? rng.int(T.kacakKatEkle.min, T.kacakKatEkle.max)) : 0);

  const kolonSayisi = rng.int(T.kolon.min, T.kolon.max);
  const kesik: number[] = [];
  if (has('kesikKolon')) {
    const n = rng.int(T.kesikKolonSayisi.min, T.kesikKolonSayisi.max);
    // Yalnızca iç kolonlar kesilir: vitrin iki bölmeyi kaplar ve fotoğrafta açıkça görünür.
    const idx = rng.shuffle(Array.from({ length: kolonSayisi - 2 }, (_, i) => i + 1)).slice(0, n);
    kesik.push(...idx.sort((a, b) => a - b));
  }

  // Eksik belgenin arkasında gerçek kusur saklı olabilir (İADE edilen bina depremde gerçek durumuyla sınanır).
  const sakliBeton = has('karotYok') && rng.chance(T.olasilik.eksikBelgeSakliKusur);
  const betonMpa = has('dusukBeton') || sakliBeton
    ? rng.int(T.betonDusuk.min, T.betonDusuk.max)
    : rng.int(T.betonIyi.min, T.betonIyi.max);

  const dereMesafeM = has('dereyeYakin')
    ? rng.int(T.dereKotu.min, T.dereKotu.max)
    : rng.int(T.dereIyi.min, T.dereIyi.max);
  const fayMesafeM = has('fayaYakin')
    ? rng.int(T.fayKotu.min, T.fayKotu.max)
    : rng.int(T.fayIyi.min, T.fayIyi.max);

  const sakliZemin = has('zeminEtuduYok') && rng.chance(T.olasilik.eksikBelgeSakliKusur);
  const zemin: Zemin = has('sivilasma') || sakliZemin
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


  const belgeler: Belgeler = {
    ruhsat: { kat: ruhsatKat, yil, muhurYili },
    proje: { zeminKolonSayisi: kolonSayisi },
    foto: fotografUret(gercek),
    karot: has('karotYok') ? null : { mpa: betonMpa },
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

export interface GunDosyaSecenekleri {
  /** O güne ait hikâye binalarını dosyalara karıştır. Varsayılan true. */
  hikayeDahil?: boolean;
}

/** Bir dosyanın planı: temiz ya da ana kusuru (ikinci kusur kurulurken rastgele eklenebilir). */
type Plan = 'temiz' | KusurId;

/**
 * Günün dosya planı (deterministik). Kurallar:
 * - Gün 1 (GDD "İlk 30 saniye"): dosya 1 temiz, dosya 2 bir kaçak kat, dosya 3 tohuma göre temiz ya da
 *   2+ kaçak kat; sonrası (varsa) karışık.
 * - Gün 2+: o günün yeni kuralının bir kusuru ilk iki dosyadan birinde; öbürü temiz ya da eski bir kusur.
 *   Kalan dosyalar torbadan: aktif kusurlar sırayla tükenir (aynı kusur üst üste gelmez), temiz oranı tutar.
 */
function gunPlani(rng: Rng, gun: number, adet: number): Plan[] {
  const aktif = aktifKusurlar(gun);
  const yeni = KURALLAR.filter((k) => k.ilkGun === gun).flatMap((k) => k.kusurlar);
  const eski = aktif.filter((k) => !yeni.includes(k));
  const plan: Plan[] = [];
  if (gun === 1) {
    plan.push('temiz', 'kacakKat', rng.chance(0.5) ? 'temiz' : 'kacakKat');
  } else if (yeni.length > 0) {
    const yeniYer = rng.int(0, 1);
    const ilk: Plan[] = ['temiz', 'temiz'];
    ilk[yeniYer] = rng.pick(yeni);
    if (eski.length > 0 && rng.chance(0.4)) ilk[1 - yeniYer] = rng.pick(eski);
    plan.push(...ilk);
  }
  plan.length = Math.min(plan.length, adet);

  // Kalan dosyalar: temiz sayısı orana göre (günde en az bir temiz), kusurlar torbadan.
  const kalan = adet - plan.length;
  if (kalan <= 0) return plan;
  const temizHedef = Math.max(1, Math.round(adet * TUNING.olasilik.temiz));
  const temizKalan = Math.max(0, Math.min(kalan, temizHedef - plan.filter((p) => p === 'temiz').length));
  // Yeni kurallar o gün torbada iki kez: gün yeni kurala ağırlık versin.
  let torba: KusurId[] = [];
  const doldur = (): void => {
    torba = rng.shuffle([...aktif, ...yeni]);
  };
  const ek: Plan[] = Array.from({ length: temizKalan }, () => 'temiz' as Plan);
  while (ek.length < kalan) {
    if (torba.length === 0) doldur();
    ek.push(torba.pop() as KusurId);
  }
  // Aynı kusur üst üste gelmesin (temizler hariç): birkaç karıştırma dene, olmazsa yanındakiyle takas et.
  const yanyana = (l: Plan[]): boolean => l.some((p, i) => i > 0 && p !== 'temiz' && p === l[i - 1]);
  let tum = [...plan, ...rng.shuffle(ek)];
  for (let deneme = 0; deneme < 24 && yanyana(tum); deneme++) tum = [...plan, ...rng.shuffle(ek)];
  for (let i = Math.max(1, plan.length); i < tum.length; i++) {
    if (tum[i] === 'temiz' || tum[i] !== tum[i - 1]) continue;
    const j = tum.findIndex((p, k) => k > i && p !== tum[i] && (k + 1 >= tum.length || tum[k + 1] !== tum[i]));
    if (j > 0) [tum[i], tum[j]] = [tum[j], tum[i]];
  }
  return tum;
}

/** Plandan bina: kusurlu planda ana kusur ve olasılıkla ikinci bir aktif kusur. */
function plandanBina(rng: Rng, gun: number, plan: Plan, ek: BinaEk): Bina {
  if (plan === 'temiz') return kusurluBinaKur(rng, [], ek);
  const secili: KusurId[] = [plan];
  const aktif = aktifKusurlar(gun);
  // Dere ve fay kuralı zemin etüdüne bağlı: yakın binalarda zemin üç durumdan biri (sağlam/orta, sıvılaşma, etüt yok).
  if ((plan === 'dereyeYakin' || plan === 'fayaYakin') && aktif.includes('sivilasma') && aktif.includes('zeminEtuduYok')) {
    const Z = TUNING.olasilik.yakinZemin;
    const r = rng.next();
    if (r < Z.sivilasma) secili.push('sivilasma');
    else if (r < Z.sivilasma + Z.etutYok) secili.push('zeminEtuduYok');
    return kusurluBinaKur(rng, secili, ek);
  }
  if (rng.chance(TUNING.olasilik.ikinciKusur)) {
    const aday = rng.shuffle(aktif).find((k) => k !== plan && !catisir(k, secili));
    if (aday) secili.push(aday);
  }
  return kusurluBinaKur(rng, secili, ek);
}

/**
 * Aynı tohum ve gün, aynı dosyalar. Dağılım gunPlani'nda. Hikâye binaları ilk iki dosyaya girmez
 * (açılış ve yeni kural yerleri). Her günde en az bir temiz ve en az bir kusurlu dosya bulunur.
 */
export function gunDosyalari(tohum: number, gun: number, adet: number, secenek: GunDosyaSecenekleri = {}): Bina[] {
  const rng = new Rng(((tohum >>> 0) ^ Math.imul(gun, 0x9e3779b1)) >>> 0);
  const ek = (i: number): BinaEk => {
    const no = String(i + 1).padStart(2, '0');
    return { id: `g${gun}-${no}`, adres: `Bina ${no}` };
  };
  const plan = gunPlani(rng, gun, adet);

  // Hikâye binaları ilk iki dosyaya girmez; mümkünse aynı kusurlu bir planın yerine ve aynı kusurun
  // yanına düşmeyecek yere konur (dağılım bozulmasın).
  const hikayeYeri = new Map<number, (typeof HIKAYELER)[number]>();
  if (secenek.hikayeDahil !== false) {
    for (const s of HIKAYELER.filter((h) => h.gun === gun)) {
      const ana = (s.kusurlar.length > 0 ? s.kusurlar[0] : 'temiz') as Plan;
      const bos = plan.map((_, i) => i).filter((i) => i >= 2 && !hikayeYeri.has(i));
      const komsuOk = (i: number): boolean => ana === 'temiz' || (plan[i - 1] !== ana && plan[i + 1] !== ana);
      const iyi = bos.filter((i) => komsuOk(i) && plan[i] === ana);
      const orta = bos.filter(komsuOk);
      const sec = iyi.length > 0 ? iyi : orta.length > 0 ? orta : bos;
      if (sec.length === 0) continue;
      const i = rng.pick(sec);
      hikayeYeri.set(i, s);
      plan[i] = ana;
    }
  }

  const dosyalar: Bina[] = plan.map((p, i) => {
    const hikaye = hikayeYeri.get(i);
    if (hikaye) return hikayeBinasiKur(rng, hikaye);
    if (gun === 1 && i < 3) {
      // Açılış: pencerede ve fotoğrafta iri, sayılabilir bina. Dosya 2 tek kaçak kat; dosya 3 iki ve üstü.
      const e: BinaEk = { ...ek(i), ruhsatKat: rng.int(TUNING.acilisKat.min, TUNING.acilisKat.max) };
      if (p === 'kacakKat') e.kacakFark = i === 1 ? 1 : rng.int(TUNING.kacakKatBosaltFark, TUNING.kacakKatEkle.max);
      return kusurluBinaKur(rng, p === 'temiz' ? [] : [p], e);
    }
    return plandanBina(rng, gun, p, ek(i));
  });

  // Güvenlik: en az bir temiz ve en az bir kusurlu dosya (plan zaten sağlıyor; hikâyeler bozarsa).
  const temiz = (b: Bina): boolean => gorunenKusurlar(b, gun).length === 0;
  const serbest = dosyalar.map((_, i) => i).filter((i) => i >= 2 && !dosyalar[i].hikaye);
  if (!dosyalar.some(temiz) && serbest.length > 0) {
    const i = rng.pick(serbest);
    dosyalar[i] = kusurluBinaKur(rng, [], ek(i));
  }
  // Sahte belge kuralı gelmeden mühür yılı yapım yılıyla aynı: fark, oyuncuya kusur gibi görünmesin.
  const sahteGunu = KURALLAR.find((k) => k.kusurlar.includes('sahteBelge'))?.ilkGun ?? Infinity;
  if (gun < sahteGunu) for (const b of dosyalar) if (!b.gercek.ruhsatSahte) b.belgeler.ruhsat.muhurYili = b.yil;
  return dosyalar;
}
