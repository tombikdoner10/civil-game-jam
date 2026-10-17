import type { AlanRef, Bina, Ciddiyet, Damga, Kural, Kusur, KusurId, Zemin } from './building';
import { baskaBinaBelgesi, gecerliRuhsat, ruhsatGecersiz } from './building';
import { tarih } from './diyalog';
import { TUNING } from './tuning';

/** Getirilen raporun kuralı (sahte rapor: mühür, tarih, elle düzeltme; G17). */
export const RAPOR_KURALI = 'rapor';
/** Geçersiz belge kuralı (G17b: elle düzeltilmiş, başka binaya ait, imzasız). */
export const GECERSIZ_KURALI = 'gecersiz';
/** Saha testi kuralı (G19, Schmidt çekici): saha notu ön değerlendirmedir. */
export const SAHA_KURALI = 'saha';

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
  karotYok: {
    etiket: 'Karot raporu yok',
    ciddiyet: 'iade',
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
    ciddiyet: 'iade',
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
  // G36 (takım kararı T29): sahte ruhsat da geçersiz belge ailesinde → İADE. Ruhsatsız yapı olduğu için depremde
  // fiziksel kusur sayılmaya devam eder (bkz. fiziksel()).
  sahteBelge: {
    etiket: 'Sahte belge',
    ciddiyet: 'iade',
    kanit: [{ belge: 'ruhsat', alan: 'yil' }, { belge: 'ruhsat', alan: 'muhur' }],
  },
  // Kanıtı rapordaki ipucuna göre değişir (getirilen rapor kartındaki alan + rapor kuralı); oturum denetler.
  sahteRapor: {
    etiket: 'Sahte rapor',
    ciddiyet: 'iade',
    kanit: [{ belge: 'karot', alan: 'lab' }],
  },
  // G17b geçersiz belge (eksik belge gibi: düzgününü iste, getiremezse İADE). Etiketler yer tutucu.
  // Elle düzeltmenin kanıt alanı düzeltilen alandır (kat ya da yıl; kusurListesi koyar) + geçersiz belge kuralı.
  elleDuzeltme: {
    etiket: 'Elle düzeltilmiş',
    ciddiyet: 'iade',
    kanit: [{ belge: 'ruhsat', alan: 'kat' }],
  },
  // Kanıt: ruhsattaki ve öbür belgedeki ada / parsel (öbür belge kusurListesi'nde).
  baskaBina: {
    etiket: 'Başka binanın belgesi',
    ciddiyet: 'iade',
    kanit: [{ belge: 'ruhsat', alan: 'ada' }, { belge: 'vaziyet', alan: 'ada' }],
  },
  imzaYok: {
    etiket: 'İmza yok',
    ciddiyet: 'iade',
    kanit: [{ belge: 'ruhsat', alan: 'imza' }],
  },
  // G19 saha notu (karot kartının yerinde): tahmini dayanım + saha kuralı. Ciddiyet tahmine göre (sahaKusuru).
  sahaBeton: {
    etiket: 'Düşük beton (saha)',
    ciddiyet: 'bosalt',
    kanit: [{ belge: 'karot', alan: 'mpa' }],
  },
};

export const KUSUR_IDLERI = Object.keys(KUSUR_BILGI) as KusurId[];

/** Eksik belge kusurları (ciddiyet 'iade'): bilgi başka yoldan edinilmediyse doğru damga İADE. */
export const EKSIK_BELGE: readonly KusurId[] = ['karotYok', 'zeminEtuduYok'];
/** Geçersiz belge kusurları (G17b; ciddiyet 'iade'): eksik belge gibi, ama bulunması inceleme ister. */
export const GECERSIZ_BELGE: readonly KusurId[] = ['elleDuzeltme', 'baskaBina', 'imzaYok'];

const fayMetni = (): string =>
  TUNING.fayKurali === 'bosalt'
    ? `[Kural: fay hattına ${TUNING.fayMinM} m'den yakınsa → BOŞALT]`
    : `[Kural: fay hattına ${TUNING.fayMinM} m'den yakınsa zemin etüdüne bak: sağlam ya da orta → GÜÇLENDİR, sıvılaşma → BOŞALT, etüt yok → İADE]`;

/**
 * Kural kitabı (gün planı, GDD). Metinler yer tutucu; takım yazacak. Her satır sonunda vurulacak damgayı yazar
 * (takım kararı 16 Ekim 23.53). Tek alanlı kusur, inceleme modunda alan + kendi kural satırıyla kanıtlanır.
 */
export const KURALLAR: Kural[] = [
  {
    id: 'kat',
    ilkGun: 1,
    kusurlar: ['kacakKat'],
    metin: `[Kural: ruhsattaki kat sayısı (zemin dahil) fotoğraftakiyle aynı olmalı. +1 kat → GÜÇLENDİR, +${TUNING.kacakKatBosaltFark} ve üstü → BOŞALT]`,
  },
  {
    id: 'kolon',
    ilkGun: 2,
    kusurlar: ['kesikKolon', 'caprazCatlak'],
    metin: '[Kural: zemin katta kesik kolon ya da gövdede çapraz çatlak varsa → BOŞALT]',
  },
  {
    id: 'oncelik',
    ilkGun: 2,
    kusurlar: [],
    metin: '[Kural: birden çok kusurda en ağır damga: BOŞALT, sonra İADE, sonra GÜÇLENDİR. Kusur yoksa → GÜVENLİ]',
  },
  { id: 'beton', ilkGun: 3, kusurlar: ['dusukBeton'], metin: `[Kural: beton dayanımı en az ${TUNING.betonEsikMpa} MPa; altındaysa → BOŞALT]` },
  {
    id: 'karot',
    ilkGun: 3,
    kusurlar: ['karotYok'],
    metin: '[Kural: karot raporu yoksa sahibinden iste; getiremezse saha testi yap ya da → İADE]',
  },
  {
    id: RAPOR_KURALI,
    ilkGun: 3,
    // Sahte rapor binanın kusuru değil (üretici seçmesin): kanıtı oturum denetler (session.incele).
    kusurlar: [],
    metin: '[Kural: getirilen raporda lab mührü olmalı, tarihi bugünü ({bugun}) geçmemeli, değeri elle düzeltilmemeli; değilse sahte → İADE]',
  },
  {
    id: 'dere',
    ilkGun: 4,
    kusurlar: ['dereyeYakin'],
    metin: `[Kural: dere yatağına ${TUNING.dereMinM} m'den yakınsa zemin etüdüne bak: sağlam ya da orta → GÜÇLENDİR, sıvılaşma → BOŞALT, etüt yok → İADE]`,
  },
  { id: 'fay', ilkGun: 4, kusurlar: ['fayaYakin'], metin: fayMetni() },
  {
    // G19: saha notu ön değerlendirme (SAHA bölümünde dere ve fayın ardından: gün 4'te yeni kurallar önce). Saha
    // kusuru binanın değil oturumun (üretici seçmesin): kapsam() ekler.
    id: SAHA_KURALI,
    ilkGun: TUNING.saha.ilkGun,
    kusurlar: [],
    metin: `[Kural: saha notu (Schmidt çekici) ön değerlendirmedir, kesin karar karot ister: tahmini dayanım ${TUNING.betonEsikMpa} MPa'nın altındaysa → BOŞALT, değilse → GÜÇLENDİR]`,
  },
  {
    id: 'zeminEtudu',
    ilkGun: 4,
    kusurlar: ['zeminEtuduYok'],
    metin: '[Kural: zemin etüdü yoksa sahibinden iste; getiremezse saha testi yap ya da → İADE]',
  },
  { id: 'sivilasma', ilkGun: 4, kusurlar: ['sivilasma'], metin: '[Kural: zeminde sıvılaşma riski varsa → BOŞALT]' },
  {
    // G17b: gün 4 imzasız ruhsat; gün 5'te elle düzeltme ve başka binanın belgesi aynı satıra eklenir.
    id: GECERSIZ_KURALI,
    ilkGun: TUNING.belgeHile.imzaGun,
    kusurlar: ['imzaYok'],
    metin: '[Kural: ruhsat imzasızsa geçersizdir; düzgününü iste, getiremezse → İADE]',
    ek: {
      gun: TUNING.belgeHile.elleBaskaGun,
      kusurlar: ['elleDuzeltme', 'baskaBina'],
      metin: '[Kural: belge elle düzeltilmişse, başka binaya aitse (ada/parsel) ya da imzasızsa geçersizdir; düzgününü iste, getiremezse → İADE]',
    },
  },
  { id: 'belge', ilkGun: 5, kusurlar: ['sahteBelge'], metin: '[Kural: mühür yılı yapım yılından sonraysa belge sahte → İADE]' },
];

/** Kural kitabında gösterilecek metin: {bugun} o günün tarihi olur; genişleyen kuralda o günün metni. */
export function kuralMetni(k: Kural, gun: number): string {
  const m = k.ek && gun >= k.ek.gun ? k.ek.metin : k.metin;
  return m.replace('{bugun}', tarih(gun));
}

/** Kuralın o gün kapsadığı kusurlar (gelmemişse boş; genişleyen kuralda ek kusurlar dahil). */
export function kuralKusurlari(k: Kural, gun: number): KusurId[] {
  if (k.ilkGun > gun) return [];
  return k.ek && gun >= k.ek.gun ? [...k.kusurlar, ...k.ek.kusurlar] : k.kusurlar;
}

/** Kural o gün yeni mi (ilk kez geldi ya da genişledi; kitapta "YENİ"). */
export function kuralYeni(k: Kural, gun: number): boolean {
  return k.ilkGun === gun || k.ek?.gun === gun;
}

/** Kuralın o gün ilk kez kapsadığı kusurlar. */
export function yeniKusurlari(k: Kural, gun: number): KusurId[] {
  const out: KusurId[] = [];
  if (k.ilkGun === gun) out.push(...k.kusurlar);
  if (k.ek?.gun === gun) out.push(...k.ek.kusurlar);
  return out;
}

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

/** Saha notundaki tahmine göre saha kusuru (G19): eşiğin altında BOŞALT, üstünde GÜÇLENDİR. */
export function sahaKusuru(mpa: number): Kusur {
  const dusuk = mpa < TUNING.betonEsikMpa;
  return { ...kusur('sahaBeton'), etiket: dusuk ? KUSUR_BILGI.sahaBeton.etiket : 'Saha ön değerlendirmesi', ciddiyet: dusuk ? 'bosalt' : 'guclendir' };
}

/** Dere ya da fay yakınlığının ciddiyeti: zemine bağlı (sıvılaşma BOŞALT, değilse GÜÇLENDİR; bkz. TUNING.fayKurali). */
function yakinlikCiddiyeti(id: 'dereyeYakin' | 'fayaYakin', zemin: Zemin | null): Ciddiyet {
  if (id === 'fayaYakin' && TUNING.fayKurali === 'bosalt') return 'bosalt';
  return zemin === 'sivilasma' ? 'bosalt' : 'guclendir';
}

/**
 * Binanın kusurları. belge: belgelerde görünenler (eksik ya da geçersiz belgenin arkasındaki kusur görünmez;
 * geçersiz belgedeki bilgi yok sayılır; dere/fay ciddiyeti zemin etüdündeki türe göre). gercek: binanın gerçek
 * durumu; eksik ve geçersiz belge kusurları da listede (ciddiyet 'iade').
 */
function kusurListesi(b: Bina, mod: 'belge' | 'gercek'): Kusur[] {
  const g = b.gercek;
  const B = b.belgeler;
  const gercekMod = mod === 'gercek';
  const out: Kusur[] = [];
  const ruhsatHile = ruhsatGecersiz(B.ruhsat);
  const baska = baskaBinaBelgesi(B);
  // Kaçak kat: geçersiz ruhsattaki kat değerlendirilemez (gerçekte daksilin altındaki asıl kat).
  if (gercekMod || !ruhsatHile) {
    const fark = g.kat - gecerliRuhsat(B.ruhsat).kat;
    if (fark !== 0) out.push(kacakKatKusuru(fark));
  }
  const ekle = (id: KusurId, ciddiyet?: Ciddiyet): Kusur => {
    const k = kusur(id);
    if (ciddiyet) k.ciddiyet = ciddiyet;
    out.push(k);
    return k;
  };
  const karot = B.karot && baska !== 'karot' ? B.karot : null;
  const zeminBelge = B.zemin && baska !== 'zemin' ? B.zemin : null;
  const zemin = gercekMod ? g.zemin : (zeminBelge?.tur ?? null);
  const mpa = gercekMod ? g.betonMpa : karot?.mpa;
  // Vaziyet planı başka binanınsa mesafeleri yok sayılır.
  const plan = gercekMod || baska !== 'vaziyet';
  const dere = gercekMod ? g.dereMesafeM : B.vaziyet.dereM;
  const fay = gercekMod ? g.fayMesafeM : B.vaziyet.fayM;
  if (g.kesikKolonlar.length > 0) ekle('kesikKolon');
  // Saha notu (G19): tahmin ayrı kuralla (ön değerlendirme); düşük beton kusuru yerine saha kusuru.
  if (!gercekMod && karot?.saha) out.push(sahaKusuru(karot.mpa));
  else if (mpa !== undefined && mpa < TUNING.betonEsikMpa) ekle('dusukBeton');
  if (B.karot === null) ekle('karotYok');
  if (plan && dere < TUNING.dereMinM) ekle('dereyeYakin', yakinlikCiddiyeti('dereyeYakin', zemin));
  if (plan && fay < TUNING.fayMinM) ekle('fayaYakin', yakinlikCiddiyeti('fayaYakin', zemin));
  if (B.zemin === null) ekle('zeminEtuduYok');
  if (zemin === 'sivilasma') ekle('sivilasma');
  if (g.catlak === 'capraz') ekle('caprazCatlak');
  if (g.ruhsatSahte) ekle('sahteBelge');
  if (ruhsatHile === 'elleDuzeltme') ekle('elleDuzeltme').kanit = [{ belge: 'ruhsat', alan: B.ruhsat.duzeltme?.alan ?? 'kat' }];
  else if (ruhsatHile === 'imzaYok') ekle('imzaYok');
  if (baska)
    ekle('baskaBina').kanit = [
      { belge: 'ruhsat', alan: 'ada' },
      { belge: baska, alan: 'ada' },
    ];
  return out;
}

/**
 * Kusur depremde fiziksel mi: eksik ve geçersiz belge (ciddiyet 'iade') değildir. Sahte ruhsat (G36) masada İADE
 * ister ama bina ruhsatsız yapıdır: depremde GÜÇLENDİR ağırlığında kusur sayılır (T29 öncesindeki gibi).
 */
function fiziksel(k: Kusur): boolean {
  return k.ciddiyet !== 'iade' || k.id === 'sahteBelge';
}

/** Kurallardan bağımsız: binadaki bütün gerçek kusurlar (eksik belgenin arkasında saklananlar dahil). */
export function gercekKusurlar(b: Bina): Kusur[] {
  return kusurListesi(b, 'gercek');
}

export function aktifKurallar(gun: number): Kural[] {
  return KURALLAR.filter((k) => k.ilkGun <= gun);
}

function kapsam(gun: number): Set<KusurId> {
  const out = new Set<KusurId>();
  for (const k of aktifKurallar(gun)) {
    for (const id of kuralKusurlari(k, gun)) out.add(id);
    if (k.id === SAHA_KURALI) out.add('sahaBeton');
  }
  return out;
}

/** O güne kadar aktif kurallara göre belgelerde görünen (yakalanabilir) kusurlar; eksik belgeler dahil. */
export function gorunenKusurlar(b: Bina, gun: number): Kusur[] {
  const k = kapsam(gun);
  return kusurListesi(b, 'belge').filter((x) => k.has(x.id));
}

/**
 * Binanın o günün kurallarıyla fiziksel kusurları: eksik belge kusurları hariç, eksik belgenin arkasında
 * saklananlar dahil (deprem sonucu bununla). Dosya eksiksizse görünen kusurlarla aynıdır.
 */
export function fizikselKusurlar(b: Bina, gun: number): Kusur[] {
  const k = kapsam(gun);
  return gercekKusurlar(b).filter((x) => k.has(x.id) && fiziksel(x));
}

/** Dosyada (o günün kurallarıyla) eksik belge var mı. */
export function eksikBelgeVar(b: Bina, gun: number): boolean {
  return gorunenKusurlar(b, gun).some((k) => k.ciddiyet === 'iade');
}

/**
 * Oyuncunun eksik belge yerine başka yoldan edindiği bilgi (G17 İSTE, G19 saha testi). Alan varsa o bilgi edinilmiş
 * sayılır; doğru damga binanın GERÇEK durumuna göre hesaplanır (sahte belgeye inanmak yanlıştır). Saha testi
 * (karotSaha) ise ön değerlendirmedir: doğru damga saha kuralına göre (tahmin eşiğin altında BOŞALT, üstünde
 * GÜÇLENDİR).
 */
export interface EdinilenBilgi {
  karot?: number;
  /** Saha testinin tahmini dayanımı (G19; karot yoksa ya da geçersizse). karot verilmişse o geçerli. */
  karotSaha?: number;
  zemin?: Zemin;
  /** Düzgün (geçerli) ruhsat ya da vaziyet planı getirildi (G17b). */
  ruhsat?: boolean;
  vaziyet?: boolean;
}

/**
 * Eksik ya da geçersiz belgeleri, bilgisi edinilmiş alanlar için gerçek durumla (binanın kendi ada / parseliyle)
 * tamamlanmış bina kopyası.
 */
export function bilgiyleTamamla(b: Bina, bilgi: EdinilenBilgi): Bina {
  const B = b.belgeler;
  const g = b.gercek;
  const ada = B.ruhsat.ada;
  const baska = baskaBinaBelgesi(B);
  const karotYok = B.karot === null || baska === 'karot';
  const zeminYok = B.zemin === null || baska === 'zemin';
  return {
    ...b,
    belgeler: {
      ...B,
      ruhsat: bilgi.ruhsat ? gecerliRuhsat(B.ruhsat) : B.ruhsat,
      karot:
        karotYok && bilgi.karot !== undefined
          ? { mpa: g.betonMpa, ada }
          : karotYok && bilgi.karotSaha !== undefined
            ? { mpa: bilgi.karotSaha, ada, saha: true }
            : B.karot,
      zemin: zeminYok && bilgi.zemin !== undefined ? { tur: g.zemin, ada } : B.zemin,
      vaziyet: baska === 'vaziyet' && bilgi.vaziyet ? { dereM: g.dereMesafeM, fayM: g.fayMesafeM, ada } : B.vaziyet,
    },
  };
}

/**
 * Görünen kusurlara göre asıl doğru damga. Öncelik: BOŞALT > İADE (eksik belge) > GÜÇLENDİR > GÜVENLİ. BOŞALT
 * gerektiren kusur zaten görünüyorsa eksik belge kararı değiştirmez. bilgi verilirse eksik belgeler tamamlanır.
 */
export function dogruDamga(b: Bina, gun: number, bilgi?: EdinilenBilgi): Damga {
  const kusurlar = gorunenKusurlar(bilgi ? bilgiyleTamamla(b, bilgi) : b, gun);
  if (kusurlar.some((k) => k.ciddiyet === 'bosalt')) return 'bosalt';
  if (kusurlar.some((k) => k.ciddiyet === 'iade')) return 'iade';
  if (kusurlar.length > 0) return 'guclendir';
  return 'guvenli';
}

/**
 * Kabul edilen damgalar (çoklu doğru cevap); ilk eleman asıl doğru damga. Eksik belgeli dosyada İADE; oyuncu
 * eksik bilgiyi başka yoldan edindiyse (bilgi) gerçek duruma göre damga da doğru. Dosya eksiksizse İADE yanlış.
 */
export function dogruDamgalar(b: Bina, gun: number, bilgi?: EdinilenBilgi): Damga[] {
  const ana = dogruDamga(b, gun);
  if (ana !== 'iade' || !bilgi) return [ana];
  const tam = dogruDamga(b, gun, bilgi);
  return tam === ana ? [ana] : [ana, tam];
}

/**
 * Kurallardan bağımsız deprem riski (0-1). gizli: belgelerde kusur olarak görünmeyen zayıflıklar (düz demir,
 * deniz kumu, eski yönetmelik) da sayılsın mı (öncü sarsıntı saymaz: yalnızca kusurların bedeli görünsün).
 * Eksik belge fiziksel bir kusur değildir; arkasında saklanan gerçek kusur sayılır.
 */
export function riskHesapla(b: Bina, gizli = true): number {
  const R = TUNING.risk;
  let r = R.taban;
  for (const k of gercekKusurlar(b)) if (fiziksel(k)) r += k.ciddiyet === 'bosalt' ? R.bosalt : R.guclendir;
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

/**
 * Oyuncunun damgasına göre deprem sonucu. siddet: risk çarpanı (varsayılan 1). gizli: bkz. riskHesapla.
 * İADE edilen bina denetlenmemiştir: GÜVENLİ damgalıymış gibi (güçlendirme yok, içinde insanlar var).
 */
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

/** Belgelerde görünmeyen zayıflık: düz demir, deniz kumu ya da o günün kurallarıyla kapsanmayan gerçek kusur. */
export function gizliZayiflik(b: Bina, gun: number): boolean {
  const n = gercekKusurlar(b).filter(fiziksel).length;
  return b.gercek.demir === 'duz' || b.gercek.denizKumu || n > fizikselKusurlar(b, gun).length;
}

/**
 * Büyük deprem sonucu (kademe kuralları TUNING.buyukDeprem'de). Adalet: belgelerdeki kusurlara göre doğru
 * damgalanan bina haksız cezalandırılmaz. Taban kademe fiziksel kusurlardan (dosya eksiksizse görünen kusurlarla
 * aynı). İADE edilen bina denetlenmemiştir: gerçek kusurlarıyla GÜVENLİ damgalıymış gibi sonuç alır, içi dolu.
 * gun: binanın damgalandığı gün (o günün kuralları). oncuHasar: öncü sarsıntıdan kalan hasar (bir kademe ekler;
 * kalan hasar geri gitmez).
 */
export function buyukDepremSonucu(
  b: Bina,
  damga: Damga,
  gun: number,
  secenek: { gizli?: boolean; oncuHasar?: HasarDurumu } = {},
): BuyukDepremSonucu {
  const B = TUNING.buyukDeprem;
  const kusurlar = fizikselKusurlar(b, gun);
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

/** Bu kusuru kapsayan kural (kural kitabındaki satır; genişleyen kuralın ek kusurları dahil). */
export function kusurKurali(id: KusurId): Kural | undefined {
  if (id === 'sahaBeton') return KURALLAR.find((k) => k.id === SAHA_KURALI);
  return KURALLAR.find((k) => k.kusurlar.includes(id) || !!k.ek?.kusurlar.includes(id));
}

/**
 * Bu kusurun kanıtı için tıklanması gereken öğeler. İki alanlı kanıt olduğu gibi; tek alanlı kanıtta
 * alan ve o kusuru kapsayan kural satırı (eşik kural kitabında). Kusur nesnesi verilirse onun kanıtı (elle
 * düzeltme ve başka binanın belgesinde alan binaya göre değişir).
 */
export function kanitOgeleri(k: KusurId | Kusur): SecimRef[] {
  const id = typeof k === 'string' ? k : k.id;
  const kanit: SecimRef[] = (typeof k === 'string' ? KUSUR_BILGI[k].kanit : k.kanit).slice();
  if (kanit.length === 1) {
    const kural = kusurKurali(id);
    if (kural) kanit.push({ belge: 'kural', alan: kural.id });
  }
  return kanit;
}

const ayni = (a: SecimRef, b: SecimRef): boolean => a.belge === b.belge && a.alan === b.alan;

/** Seçim, kusurun kanıt öğeleriyle (sırası önemsiz) aynı mı? */
export function kanitEslesir(k: KusurId | Kusur, secim: readonly SecimRef[]): boolean {
  const kanit = kanitOgeleri(k);
  return kanit.length === secim.length && kanit.every((x) => secim.some((s) => ayni(x, s)));
}

/** Seçimin kanıtladığı, o gün görünen (kuralı gelmiş) kusur; yoksa null. */
export function seciminKusuru(b: Bina, gun: number, secim: readonly SecimRef[]): Kusur | null {
  return gorunenKusurlar(b, gun).find((k) => kanitEslesir(k, secim)) ?? null;
}
