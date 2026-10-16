// Eşikler oyun için sadeleştirilmiş yer tutuculardır; takım resmî kaynakla doğrulayacak (TASKS T2).

/** Bütün eşikler ve olasılıklar. Sayıları yalnızca buradan değiştir. */
export const TUNING = {
  /** Ruhsattaki kat sayısı aralığı. */
  kat: { min: 2, max: 7 },
  /** Kaçak katta ruhsatın üstüne eklenen kat. */
  kacakKatEkle: { min: 1, max: 2 },
  /** Gün 1 açılış dosyalarında (1: temiz, 2: kaçak katlı) ruhsattaki kat: fotoğrafta bina iri ve sayılabilir olsun. */
  acilisKat: { min: 4, max: 6 },
  /** Yapım yılı aralığı. */
  yil: { min: 1965, max: 2008 },
  /** Bu yıldan eski binalar "eski yönetmelik" sayılır (yalnızca riske ekler). */
  eskiYapiYili: 1999,
  /** Zemin katta kolon sayısı. */
  kolon: { min: 5, max: 8 },
  /** Kesik kolon sayısı. */
  kesikKolonSayisi: { min: 1, max: 2 },

  /** Beton dayanımı eşiği (MPa). Altı kusur. */
  betonEsikMpa: 20,
  betonIyi: { min: 24, max: 38 },
  betonDusuk: { min: 8, max: 17 },

  /** Dere ve fay mesafe eşikleri (m). Altı kusur. */
  dereMinM: 30,
  fayMinM: 150,
  dereIyi: { min: 60, max: 400 },
  dereKotu: { min: 5, max: 25 },
  fayIyi: { min: 250, max: 1500 },
  fayKotu: { min: 20, max: 120 },

  /** Sahte ruhsatta mühür yılı, yapım yılından kaç yıl sonra. */
  sahteMuhurFark: { min: 2, max: 8 },
  /** Gerçek ruhsatta mühür yılı, yapım yılından kaç yıl önce (0 = aynı yıl). */
  gercekMuhurFark: { min: 0, max: 2 },

  /** Üretici olasılıkları. */
  olasilik: {
    /** Gün dosyalarında kusursuz bina oranı. */
    temiz: 0.35,
    /** Kusurlu binada ikinci kusur olasılığı. */
    ikinciKusur: 0.3,
    /** Kusursuz binada zararsız kılcal çatlak (yanıltıcı). */
    kilcalCatlak: 0.25,
    duzDemirEski: 0.5,
    duzDemirYeni: 0.05,
    denizKumu: 0.1,
    /** Kusursuz binada karot raporunun eksik olması. */
    karotYok: 0.15,
    /** Zemin kusursuzsa sağlam olma olasılığı (kalanı orta). */
    zeminSaglam: 0.6,
  },

  /** Mesai: gerçek süre (sn) 09.00-17.00 arasına denk gelir; gün başına dosya sayısı (gün 1 = ilk eleman). */
  mesai: { sure: 180, baslangicSaat: 9, bitisSaat: 17, dosyaSayisi: [4, 5, 6, 7, 8] },

  /** Deprem riski (0..1). */
  risk: {
    taban: 0.05,
    bosalt: 0.35,
    guclendir: 0.15,
    duzDemir: 0.08,
    denizKumu: 0.08,
    eskiYapi: 0.05,
    /** Güçlendirilmiş binada risk çarpanı. */
    guclendirCarpan: 0.6,
    /** Risk bu değerin altındaysa bina ayakta. */
    hasarEsik: 0.4,
    /** Risk bu değerin üstündeyse ağır hasar. */
    agirHasarEsik: 0.65,
  },
} as const;
