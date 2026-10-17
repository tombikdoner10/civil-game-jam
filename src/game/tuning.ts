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
  /**
   * Fay yakını kuralı (takım T12'de doğrulayacak). 'zemin': dere gibi zemin etüdüne bağlı (sağlam ya da orta
   * GÜÇLENDİR, sıvılaşma BOŞALT, etüt yok İADE). 'bosalt': faya yakın bina her zaman BOŞALT.
   */
  fayKurali: 'zemin' as 'zemin' | 'bosalt',
  dereIyi: { min: 60, max: 400 },
  dereKotu: { min: 5, max: 25 },
  fayIyi: { min: 250, max: 1500 },
  fayKotu: { min: 20, max: 120 },

  /** Sahte ruhsatta mühür yılı, yapım yılından kaç yıl sonra. */
  sahteMuhurFark: { min: 2, max: 8 },
  /** Gerçek ruhsatta mühür yılı, yapım yılından kaç yıl önce (0 = aynı yıl). */
  gercekMuhurFark: { min: 0, max: 2 },

  /**
   * Belge hileleri (G17b): geçersiz belge eksik belge gibi işler (düzgününü iste, getiremezse İADE). Günler:
   * imzasız ruhsat gün 4, elle düzeltme ve başka binanın belgesi gün 5 (kural kitabında tek satır).
   */
  belgeHile: {
    imzaGun: 4,
    elleBaskaGun: 5,
    /** Elle düzeltmede kat sayısı payı (kalanı yapım yılı). Kat düzeltmesi kaçak katı gizler. */
    elleKatOrani: 0.7,
    /** Elle düzeltilmiş yapım yılı asıl yıldan kaç yıl ileri. */
    yilIleri: { min: 8, max: 20 },
    /** Başka binanın belgesinde (asıl binada saklı kusur yoksa) kötü değer görünme olasılığı. */
    baskaKotuOrani: 0.5,
  },

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
    /**
     * Eksik belgenin (karot, zemin etüdü) arkasında gerçek kusur saklı olma olasılığı: düşük beton ya da
     * sıvılaşma. Belgede görünmez; İADE edilen bina depremde bununla sınanır.
     */
    eksikBelgeSakliKusur: 0.4,
    /** Dereye ya da faya yakın binada zemin: sıvılaşma ve etüt yok olasılıkları (kalanı sağlam ya da orta). */
    yakinZemin: { sivilasma: 0.3, etutYok: 0.3 },
    /** Zemin kusursuzsa sağlam olma olasılığı (kalanı orta). */
    zeminSaglam: 0.6,
  },

  /**
   * Mesai: gün başına gerçek süre (sn, 09.00-17.00 arasına denk gelir; dosya gelip giderken saat durur)
   * ve dosya sayısı. Gün 1 = ilk eleman. Gün 1 kısa: jüri 2 dakikada bitirsin (GDD "Jüri yolu").
   */
  mesai: {
    sure: [90, 180, 200, 220, 240],
    baslangicSaat: 9,
    bitisSaat: 17,
    dosyaSayisi: [3, 5, 6, 7, 8],
    /** Gün 1'de inceleme ipucu ekrandayken (ilk Space'e kadar) saatin hızı. */
    ipucuHiz: 0.5,
  },

  /** Gün sonu parası (yer tutucu değerler; aile bütçesi yok). */
  para: { baslangic: 0, maas: 20, ceza: 10 },

  /**
   * Gişedeki kişi (G17): kişilik, SOR ve İSTE olasılıkları. Gün başına değerler dizide (gün 1 = ilk eleman).
   * Zarfın bedeli (G22): zarfı alan, kişinin istediği damgayı vurmak zorunda; kabul edilen zarf parayı artırır ve
   * kayda girer (sokakta ve depremde iz).
   */
  kisi: {
    /** Kişilik ağırlıkları; pazarlıkçı payı güne göre (gün 5'te zarf daha sık). */
    kisilik: { durust: 0.4, kacamak: 0.4, pazarlikci: [0.25, 0.25, 0.3, 0.3, 0.6] },
    /** SOR'da gün başına taban zarf olasılığı; kişilik çarpanı ve BOŞALT çarpanıyla (en çok 0.9). */
    zarf: [0.3, 0.3, 0.35, 0.35, 0.6],
    bosaltZarf: 1.3,
    /** Kişiliğe göre: zarf çarpanı ve (zarf değilse) itiraf olasılığı; kalanı bahane. */
    sor: {
      durust: { zarfCarpan: 0, itiraf: 0.75 },
      kacamak: { zarfCarpan: 0.6, itiraf: 0.25 },
      pazarlikci: { zarfCarpan: 2, itiraf: 0.15 },
    },
    /** Zarftaki para (TL; maaş dosya başına 20). */
    zarfMiktar: { guclendir: { min: 40, max: 80 }, bosalt: { min: 80, max: 160 }, adim: 10 },
    /** Zarfla istenen damga (G22): genelde GÜVENLİ; BOŞALT gerektiren kusurda bu olasılıkla GÜÇLENDİR. */
    zarfIstekGuclendir: 0.4,
    /** Hangi günden itibaren: SOR, İSTE (eksik belgede) ve sahte rapor. */
    sorIlkGun: 1,
    isteIlkGun: 3,
    sahteRaporIlkGun: 3,
    /**
     * İSTE: gerçek rapor / sahte rapor / getiremez ağırlıkları. Eksik belgenin arkasında gerçek kusur saklıysa
     * sahte daha olası. Pazarlıkçıda sahte ağırlığı çarpılır, dürüstte azalır.
     */
    iste: {
      sakli: { gercek: 0.25, sahte: 0.5, yok: 0.25 },
      temiz: { gercek: 0.6, sahte: 0.15, yok: 0.25 },
      pazarlikciSahte: 1.6,
      durustSahte: 0.3,
      /** Sahte raporun tarihi bugünden kaç gün ileri (ipucu "tarih"); öbür raporlar kaç gün önce. */
      sahteTarihIleri: { min: 3, max: 25 },
      gercekTarihOnce: { min: 2, max: 40 },
    },
  },

  /**
   * Saha testi (G19, yalnızca Schmidt çekici): karot raporu yoksa ya da geçersizse binanın betonu masadan kalkıp
   * ölçülür. Günde gunlukHak kez; tamamlanınca saat dakika kadar ilerler (VAZGEÇ hak ve süre harcamaz). Okumalar
   * deterministik: binanın gerçek dayanımına karşılık gelen R değerinin çevresinde ±gurultu; ortalamanın kayması
   * en çok ±sapma. Tahmin hep eşiğin gerçek dayanımla aynı yanında kalır (adalet). Saha notu ön değerlendirmedir:
   * tahmin eşiğin altındaysa BOŞALT, üstündeyse GÜÇLENDİR (kesin karar karot ister). Dönüşüm tablosu (R → MPa,
   * yatay vuruş) yer tutucu: takım TS EN 12504-2 / üretici eğrisiyle doğrulayacak.
   */
  saha: {
    ilkGun: 3,
    gunlukHak: 2,
    okuma: 6,
    dakika: 30,
    gurultu: 3,
    sapma: 1,
    /** Tahminin ± payı (oran; en az payEn MPa). */
    payOran: 0.2,
    payEn: 2,
    donusum: [
      [10, 4],
      [20, 11],
      [25, 17],
      [30, 25],
      [35, 33],
      [40, 41],
      [45, 50],
      [55, 66],
    ] as readonly (readonly [number, number])[],
    /** Geçersiz okuma: sıva üstünde R düşer (çarpan), çatlakta tutarsız düşük okur (fark). */
    siva: 0.62,
    catlak: -9,
  },

  /**
   * Konuşma balonu: harf başına yazma süresi, metin bitince kalış süresi (taban + harf başı), gecikmeler (ms).
   * G33 (yalnızca konuşma; oyun kararlarına etkisi yok): beklemeMs denetçi bu kadar hiçbir şey yapmazsa kişi bir kez
   * mizacının bekleme cümlesini söyler (balon doluysa beklemeTekrarMs sonra yeniden dener); sorGiris SOR cevabına
   * mizacın giriş cümlesinin eklenme oranı; sabirsizSoru aynı kişiye bu kaçıncı SOR / İSTE'den itibaren cevabın önüne
   * sabırsız cümle eklenir.
   */
  diyalog: {
    harfMs: 26,
    kalisMs: 2600,
    kalisHarfMs: 40,
    selamGecikme: 700,
    raporGecikme: 1000,
    beklemeMs: 25000,
    beklemeTekrarMs: 2000,
    sorGiris: 0.4,
    sabirsizSoru: 3,
  },

  /**
   * Öncü sarsıntı (gün 1 sonu): risk çarpanı, süre (ms) ve kamera sarsıntısı genliği. Öncüde yalnızca belgelerdeki
   * kusurlar sayılır ve en fazla çatlak olur. 2.5 ile: 1 kaçak katlı bina GÜVENLİ damgalıysa çatlar, GÜÇLENDİR
   * damgalıysa sağlam kalır; temiz bina sağlam kalır. durulmaMs (G23): sallantı bittikten sonra rapora geçmeden
   * önceki bekleme; son bina tepki verdikten sonra Enter/Space/tık hemen geçer.
   */
  oncu: { siddet: 2.5, sureMs: 9000, sarsinti: 0.006, durulmaMs: 1000 },

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

  /**
   * Kısa yol (G21, jüri yolu): gün 1 sonu raporunda "Depremi şimdi yaşa". Sokak: oyuncunun gün 1 binaları önde,
   * ardından gün 2-5'i temsil eden örnek binalar (ornek.ts, tohumdan türetilen ayrı tohumla). Deprem kısa:
   * gece geçişi kısa (ms), sarsıntı depremMs; ilk grup (oyuncunun binaları) ilkGrupAgirlik kat uzun sürer.
   */
  kisaYol: {
    ornekBina: 9,
    depremMs: 20000,
    ilkGrupAgirlik: 1.8,
    zaman: { saatGel: 150, saatGit: 1100, perde: 1300, perdeSure: 800, deprem: 2300, sonra: 2000 },
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
