// Eşikler oyun için sadeleştirilmiş yer tutuculardır; takım resmî kaynakla doğrulayacak (TASKS T2).

/** Bütün eşikler ve olasılıklar. Sayıları yalnızca buradan değiştir. */
export const TUNING = {
  /** Ruhsattaki kat sayısı aralığı. */
  kat: { min: 2, max: 7 },
  /** Kaçak katta ruhsatın üstüne eklenen kat. */
  kacakKatEkle: { min: 1, max: 2 },
  /** Kaçak kat farkı bu sayıya ulaşınca doğru damga BOŞALT (altı GÜÇLENDİR). Takım kararı: 2. */
  kacakKatBosaltFark: 2,
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

  /**
   * Mesai: gün başına gerçek süre (sn, 09.00-17.00 arasına denk gelir; dosya gelip giderken saat durur)
   * ve dosya sayısı. Gün 1 = ilk eleman. Gün 1 kısa: jüri 2 dakikada bitirsin (GDD "Jüri yolu").
   */
  mesai: { sure: [90, 180, 200, 220, 240], baslangicSaat: 9, bitisSaat: 17, dosyaSayisi: [3, 5, 6, 7, 8] },

  /** Gün sonu parası (yer tutucu değerler; aile bütçesi yok). */
  para: { baslangic: 0, maas: 20, ceza: 10 },

  /**
   * Öncü sarsıntı (gün 1 sonu): risk çarpanı, süre (ms) ve kamera sarsıntısı genliği. Öncüde yalnızca belgelerdeki
   * kusurlar sayılır ve en fazla çatlak olur. 2.5 ile: 1 kaçak katlı bina GÜVENLİ damgalıysa çatlar, GÜÇLENDİR
   * damgalıysa sağlam kalır; temiz bina sağlam kalır.
   */
  oncu: { siddet: 2.5, sureMs: 9000, sarsinti: 0.006 },

  /**
   * Büyük deprem (gün 5 sonu, G5). Sonuç risk sayısıyla değil, kademeyle (adil ve öngörülebilir):
   * 0 ayakta, 1 hasarlı, 2 ağır hasar, 3 çöker. Taban kademe binanın damgalandığı günün kurallarıyla görünen
   * kusurlardan: kusursuz bina hep ayakta (gizli zayıflık sayılmaz). Kusurlu binada gizli zayıflık (düz demir,
   * deniz kumu, kuralı henüz gelmemiş kusur) ve öncü sarsıntı çatlağı birer kademe ekler. GÜÇLENDİR kademeyi
   * düşürür ve en fazla hasarlı bırakır; BOŞALT sonucu değiştirmez ama bina boştur.
   */
  buyukDeprem: {
    sureMs: 20000,
    sarsinti: 0.012,
    sesGucu: 2,
    kademe: { guclendirKusur: 2, bosaltKusur: 3 },
    gizliKademe: 1,
    oncuKademe: 1,
    guclendirIndirim: 2,
    guclendirTavan: 1,
    /** Tarama: görünüm sokakta kaçar binalık gruplarla ilerler. */
    grup: 5,
  },

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
