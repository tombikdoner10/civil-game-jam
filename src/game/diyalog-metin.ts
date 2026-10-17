// @beyan metin
/**
 * Gişedeki kişilerin cümleleri (G33). Claude taslak olarak yazdı; lider onayıyla oyuna girdi (G31, docs/TAKIM_CEVAPLARI.md 5).
 *
 * Değişkenler (kod doldurur; sayıdan sonra ek gelmeyecek biçimde yazıldı):
 *   {kat}  ruhsattaki kat sayısı   {yil}  ruhsattaki yapım yılı   {ada}  ada/parsel
 *   {bina} bina adı (ör. Bina 03)  {para} zarf tutarı (ör. 300 TL)
 *
 * Mizaç yalnızca konuşma tonunu seçer; oyun kurallarını, kişinin dürüstlüğünü (Kisilik) ve zarf olasılığını değiştirmez.
 */
import type { Damga } from './building';
import type { Ifade } from './kisi';
import type { IsteTuru, SorTuru, SorulanKusur } from './diyalog';

export type Mizac = 'kibar' | 'sinirli' | 'telasli' | 'kurnaz' | 'cekingen';

export const MIZACLAR: readonly Mizac[] = ['kibar', 'sinirli', 'telasli', 'kurnaz', 'cekingen'];

export interface MizacMetin {
  /** Gişeye gelince. */
  selam: string[];
  /** Denetçi uzun süre karar vermeyince (kişi başına en çok bir kez). */
  bekleme: string[];
  /** Aynı kişiye üçüncü ve sonraki SOR/İSTE'de, cevaptan önce. */
  sabirsiz: string[];
  /** SOR cevabının önüne bazen eklenen kısa giriş. */
  sorGiris: string[];
  /** Zarf geri verilince. */
  zarfRet: string[];
  /** Zarf alınınca. */
  zarfKabul: string[];
  /** Damga vurulunca. */
  damga: Record<Damga, string[]>;
}

/** Mizaca göre yüz ifadesi (damga tepkisinin ifadesi oyun mantığından gelir). */
export const MIZAC_IFADE: Record<Mizac, Record<'selam' | 'bekleme' | 'sabirsiz' | 'zarfRet', Ifade>> = {
  kibar: { selam: 'notr', bekleme: 'notr', sabirsiz: 'gergin', zarfRet: 'mahcup' },
  sinirli: { selam: 'gergin', bekleme: 'kizgin', sabirsiz: 'kizgin', zarfRet: 'kizgin' },
  telasli: { selam: 'gergin', bekleme: 'gergin', sabirsiz: 'gergin', zarfRet: 'mahcup' },
  kurnaz: { selam: 'sevincli', bekleme: 'notr', sabirsiz: 'gergin', zarfRet: 'mahcup' },
  cekingen: { selam: 'mahcup', bekleme: 'mahcup', sabirsiz: 'mahcup', zarfRet: 'mahcup' },
};

export const MIZAC_METIN: Record<Mizac, MizacMetin> = {
  kibar: {
    selam: [
      'Merhaba, kolay gelsin. Dosyam burada.',
      'İyi günler efendim, buyrun belgelerim.',
      'Rahatsız etmiyorum umarım, sıra bendeydi.',
      'Günaydın, {bina} için geldim.',
      'Hayırlı işler, dosyayı getirdim.',
    ],
    bekleme: [
      'Acele etmeyin, ben beklerim.',
      'Bir sorun mu var, sorabilir miyim?',
      'Eksik bir şey varsa getiririm.',
      'Dikkatle bakmanız iyi, teşekkür ederim.',
    ],
    sabirsiz: [
      'Kusura bakmayın ama bunu konuşmuştuk.',
      'Elimden geleni anlattım, inanın.',
      'Başka ne söyleyebilirim bilmiyorum.',
      'Tekrar sorduğunuza göre önemli herhalde.',
    ],
    sorGiris: ['Tabii, açıklayayım.', 'Haklı bir soru.', 'Şöyle anlatayım.', 'Bildiğim kadarını söyleyeyim.'],
    zarfRet: [
      'Özür dilerim, yanlış anlaşıldı.',
      'Peki, siz bilirsiniz, kusura bakmayın.',
      'Haklısınız, hiç uzatmamam gerekirdi.',
    ],
    zarfKabul: ['Çok teşekkür ederim, unutmam.', 'Anlayışınız için sağ olun.', 'Aramızda kalsın, minnettarım.'],
    damga: {
      guvenli: ['Çok teşekkür ederim, iyi çalışmalar.', 'İçim rahatladı, sağ olun.', 'Hayırlı günler efendim.'],
      guclendir: ['Peki, bir mühendisle görüşürüm.', 'Masraflı olacak ama haklısınız.', 'Anlıyorum, gereğini yaparız.'],
      bosalt: [
        'Boşaltmak mı? Peki... nereye gideriz bilmiyorum.',
        'Çok zor ama kararınıza saygı duyarım.',
        'Komşulara nasıl söyleyeceğim?',
      ],
      iade: ['Tamam, eksikleri tamamlayıp gelirim.', 'Hangi belge eksik, not alayım.', 'Peki, yarın tekrar uğrarım.'],
    },
  },

  sinirli: {
    selam: [
      'Bir saattir sıradayım, buyrun dosya.',
      'Şunu çabuk halledelim.',
      'Yine mi belge? Al bakalım.',
      '{bina}. Bitirelim şu işi.',
      'Sabahtan beri koşturuyorum, işte dosya.',
    ],
    bekleme: [
      'Daha ne kadar bakacaksınız?',
      'Benim işim gücüm var!',
      'Arkada kuyruk birikti, haberiniz olsun.',
      'Okumayı bitirmediniz mi hâlâ?',
    ],
    sabirsiz: [
      'Kaç kere soracaksınız?',
      'Söyledim ya, başka cevabım yok!',
      'Sorgu mu bu, denetim mi?',
      'Yeter artık, damganızı vurun.',
    ],
    sorGiris: ['Ne var bunda?', 'Buna mı takıldınız?', 'Of, peki.', 'Bakın, ne diyeceğim.'],
    zarfRet: ['Ne bu tavır? Ben bir şey demedim.', 'İyi, siz bilirsiniz. Pişman olursunuz.', 'Sizin gibisini görmedim.'],
    zarfKabul: ['Hah, şöyle anlaşalım.', 'Sonunda biri işi biliyor.', 'Tamam, uzatmayalım.'],
    damga: {
      guvenli: ['Bu kadar mı? Tamam.', 'Bunun için mi beklettiniz?', 'Hah, nihayet.'],
      guclendir: ['Parasını siz mi vereceksiniz?', 'Ne güçlendirmesi, bina sapasağlam!', 'Bu işin sonu gelmeyecek.'],
      bosalt: ['Kimse beni evimden çıkaramaz!', 'Bunu mahkemede görüşürüz.', 'Siz evi görmediniz bile!'],
      iade: ['Yine mi? Daha ne istiyorsunuz?', 'Bir gün daha kaybettim.', 'Bu kâğıtları kim uyduruyor?'],
    },
  },

  telasli: {
    selam: [
      'Merhaba, çok acelem var, kusura bakmayın.',
      'Yetiştim mi? Dosyam burada.',
      'Çocuklar okulda, hızlıca bakabilir misiniz?',
      '{bina} için geldim, her şey tamam değil mi?',
      'Nefes nefese geldim, buyrun.',
    ],
    bekleme: [
      'Bir sorun mu var? Kötü bir şey mi?',
      'Ne oldu, neden öyle baktınız?',
      'Lütfen söyleyin, merak ediyorum.',
      'Saat geçiyor, işe yetişmem lazım.',
    ],
    sabirsiz: [
      'Bilmiyorum, yemin ederim bilmiyorum.',
      'Aklım karıştı, ne sormuştunuz?',
      'Lütfen, bildiğim bu kadar.',
      'Başım belada mı yani?',
    ],
    sorGiris: ['Ah, şey...', 'Bir dakika, hatırlayayım.', 'Ne diyeceğimi bilemedim.', 'Of, şimdi nasıl anlatsam.'],
    zarfRet: ['Pardon, ben öyle... boş verin.', 'Lütfen kimseye söylemeyin.', 'Ne yaptığımı bilmiyorum, özür dilerim.'],
    zarfKabul: ['Oh, çok şükür.', 'Bir dertten kurtuldum, teşekkürler.', 'Kimse öğrenmesin, değil mi?'],
    damga: {
      guvenli: ['Oh, çok şükür!', 'Gerçekten mi? Teşekkür ederim!', 'Bu gece rahat uyuyacağım.'],
      guclendir: ['Güçlendirme mi? Ne kadar sürer?', 'Bu ay mı başlamamız lazım?', 'Yıkılacak mı yani?'],
      bosalt: ['Hemen mi çıkmamız lazım?', 'Eşyaları ne yapacağız?', 'Bu gece nerede kalacağız?'],
      iade: ['Eyvah, hangisi eksik?', 'Hemen gidip getiririm.', 'Yetiştiremem ki!'],
    },
  },

  kurnaz: {
    selam: [
      'Merhaba hocam, işler nasıl?',
      'Kolay gelsin, ufak bir dosya.',
      'Sizi bir yerden tanıyorum sanki, buyrun.',
      '{bina}, temiz iş, hemen biter.',
      'Hayırlı mesailer, çay söylesek mi?',
    ],
    bekleme: [
      'Hocam, takılacak bir şey yok.',
      'O kadar bakmaya değmez, temiz dosya.',
      'Siz bilirsiniz ama zaman kaybı.',
      'Size kolaylık olsun diye hazırladım.',
    ],
    sabirsiz: [
      'Hocam, bunu uzatmayalım bence.',
      'Aynı soruya aynı cevap, değil mi?',
      'Bir şey bulacağım diye zorluyorsunuz.',
      'Bu dosya böyle, kabul edin.',
    ],
    sorGiris: ['Hocam, aslında şöyle.', 'Aramızda kalsın.', 'Büyütülecek bir şey değil.', 'Ha, o mu?'],
    zarfRet: ['Şaka yaptım hocam, ne zarfı?', 'Peki, bir dahaki sefere.', 'Ben yanlış bir şey demedim ki.'],
    zarfKabul: ['İşte böyle, anlaşırız dedim.', 'Aramızda hocam, merak etmeyin.', 'Bilirsiniz, iyilik unutulmaz.'],
    damga: {
      guvenli: ['Bildiğim gibi, sağ olun hocam.', 'Ben demiştim, temiz iş.', 'İyi çalışmalar, görüşürüz.'],
      guclendir: ['Hocam, biraz ağır olmadı mı?', 'Bir yolunu buluruz.', 'Peki, sonra konuşuruz.'],
      bosalt: ['Hocam, bunu bir daha düşünün.', 'Benim tanıdıklarım var, bilesiniz.', 'Bu iş burada bitmez.'],
      iade: ['Eksik mi? Bir telefon ederim, hallolur.', 'Ufak bir kâğıt için mi?', 'Peki, yarına tamamlanır.'],
    },
  },

  cekingen: {
    selam: [
      'Ş-şey, merhaba... dosyam.',
      'Sıra bende galiba, buyrun.',
      'Rahatsız ettim, kusura bakmayın.',
      '{bina} için... belgeler burada.',
      'Merhaba... ilk defa geliyorum.',
    ],
    bekleme: ['...', 'Ben... bekliyorum.', 'Yanlış bir şey mi getirdim?', 'Siz bakın, ben sessizce beklerim.'],
    sabirsiz: [
      'Bilmiyorum... gerçekten.',
      'Daha fazlasını bilmiyorum, özür dilerim.',
      'Bunu bana sormayın lütfen.',
      'Ben sadece dosyayı getirdim.',
    ],
    sorGiris: ['Ş-şey...', 'Ben pek bilmem ama.', 'Sanırım...', 'Bana söylenen şu.'],
    zarfRet: ['Ö-özür dilerim, utandım.', 'Bana öyle söylediler, bilmiyordum.', 'Lütfen yanlış anlamayın.'],
    zarfKabul: ['T-teşekkürler...', 'Kimseye söylemem.', 'Sağ olun... sağ olun.'],
    damga: {
      guvenli: ['Teşekkür ederim...', 'Sağ olun, iyi günler.', 'Rahatladım...'],
      guclendir: ['Peki... eve söylerim.', 'Nasıl yapılır bilmiyorum ama...', 'Anladım...'],
      bosalt: ['Ama... nereye gideceğiz?', 'Annem yaşlı, nasıl taşınır?', 'Anlıyorum... sanırım.'],
      iade: ['Peki... neyi getireyim?', 'Tekrar gelirim.', 'Özür dilerim, eksik getirmişim.'],
    },
  },
};

/**
 * Kendiliğinden zarfın giriş cümlesi (G45): kişi SOR beklemeden zarfı uzatırken mizacına göre (sorGiris bir soruya
 * cevap verir; bu, sorulmadan söze giriş).
 */
export const KENDI_ZARF_GIRIS: Record<Mizac, string[]> = {
  kibar: ['Bir ricam olacaktı, kusura bakmayın.', 'Sizi zor durumda bırakmak istemem ama...'],
  sinirli: ['Uzatmayalım, şunu alın.', 'Bakın, işimi bitirin, karşılığı var.'],
  telasli: ['Lütfen, acelem var, şunu alın.', 'Bunu kabul ederseniz hemen giderim.'],
  kurnaz: ['Hocam, aramızda kalsın.', 'Ufak bir teşekkür, kimse bilmez.'],
  cekingen: ['Ş-şey... bunu size vermem söylendi.', 'Bunu... kabul eder misiniz?'],
};

/** SOR cevabı: kusura ve cevap türüne göre (mizaçtan bağımsız; mizaç sorGiris ile ton katar). */
export const SOR_METIN: Record<SorulanKusur, Record<SorTuru, string[]>> = {
  kacakKat: {
    bahane: [
      'O kat hep vardı, ruhsat eski.',
      'Çatı katı sayılmaz ki.',
      'Belediyeden biri onaylamıştı.',
      'Ruhsatta {kat} kat yazıyorsa öyledir, üstü teras.',
      'Fotoğraf yanıltıyor, üstteki depo.',
    ],
    itiraf: [
      'Üst kat sonradan çıkıldı.',
      'Oğlum evlenince bir kat ekledik.',
      'Herkes yapıyor diye biz de çıktık.',
      'Ruhsat {kat} kat ama biz biraz büyüttük.',
      'İmar affı çıkar diye ekledik.',
    ],
    zarf: [
      'Bu kat meselesini aramızda halletsek?',
      'Şunu bir değerlendirin, {para}.',
      'Bu kat meselesi için dosya bozulmasın, {para}.',
      'Ruhsattaki gibi {kat} kat sayılsın, {para}.',
      'Üst kat görünmese olur mu? {para}.',
    ],
  },
  kesikKolon: {
    bahane: [
      'Vitrin projede de vardı.',
      'Usta o kolon yük taşımaz dedi.',
      'Dükkân hep böyleydi.',
      'O kolon değil, süs ayağıydı.',
      'Yerine çelik koyduk, daha sağlam.',
    ],
    itiraf: [
      'Dükkânı genişletmek için kestirdik.',
      'Kiracı istedi, kolonu aldık.',
      'Vitrin geniş olsun diye kaldırdık.',
      'Ustaya sormadık, kendimiz kestik.',
      'Kesileli yıllar oldu, bir şey olmadı.',
    ],
    zarf: [
      'Dükkân kapanırsa ekmeğimiz gider, {para}.',
      'Bunu görmeseniz olur mu?',
      'Kolon meselesini kapatalım, {para}.',
      'Kiracıyla aramızda kalsın, {para}.',
      'Bir vitrin için mi uğraşacağız? {para}.',
    ],
  },
  caprazCatlak: {
    bahane: [
      'O sıva çatlağı, önemli değil.',
      'Boya tutmadı, o kadar.',
      'Yeni boyatacaktık zaten.',
      'Kış soğuğundan oldu.',
      'Kamyon geçince titriyor, ondan.',
    ],
    itiraf: [
      'Geçen sarsıntıdan beri var.',
      'Her yıl biraz büyüyor.',
      'Kapılar da sıkışıyor artık.',
      'Üstünü sıvattık ama yine açıldı.',
      'Çatlak gece ses yapıyor bazen.',
    ],
    zarf: [
      'Bir boya parası sayın, {para}.',
      'Bunu dosyaya yazmasanız?',
      'Bir çatlak için bina boşalmaz, {para}.',
      'Sıva yaptırırız, siz görmemiş olun, {para}.',
      'Bu çizgiyi atlasak? {para}.',
    ],
  },
  dusukBeton: {
    bahane: [
      'Laboratuvar yanlış ölçmüş.',
      'Numune kötü yerden alındı.',
      'Bu bina yıllardır ayakta.',
      '{yil} yapımı, o zaman beton böyleydi.',
      'Cihaz bozuktu, tekrar ölçülsün.',
    ],
    itiraf: [
      'Müteahhit çimentodan kısmış.',
      'Betonu elde karıştırmışlar.',
      'Deniz kumu kullanıldı diye duymuştum.',
      'Ucuza yapıldı, biliyorduk.',
      'Demirler paslı, bodrumda görünüyor.',
    ],
    zarf: [
      'Raporu bir daha düşünseniz, {para}.',
      'Bu rakam biraz yükselse?',
      'Beton meselesini uzatmayalım, {para}.',
      'Laboratuvarla bir konuşsak, {para}.',
      'Raporu görmemiş olsanız? {para}.',
    ],
  },
  dereyeYakin: {
    bahane: [
      'Dere yıllardır kuru.',
      'Plan eski, dere yer değiştirdi.',
      'Su hiç buraya gelmedi.',
      'Dere değil, yağmur arkı o.',
      'Belediye üstünü kapattı zaten.',
    ],
    itiraf: [
      'Eskiden bahçe sınırı dereydi.',
      'Dereyi biraz doldurduk.',
      'Sel olunca bodrumu su bastı.',
      'Dere yatağına yakın, biliyoruz.',
      'Ucuz arsaydı, dereye rağmen aldık.',
    ],
    zarf: [
      'Birkaç metre fark eder mi, {para}.',
      'Ölçümü yeniden yapsanız?',
      'Dereyi haritadan silsek, {para}.',
      'Mesafe biraz uzun yazılsa? {para}.',
      'Bu satır olmasa da olur, {para}.',
    ],
  },
  fayaYakin: {
    bahane: [
      'O fay haritası eski.',
      'Burası sağlam yerdir derler.',
      'Komşular da aynı yerde.',
      'Fay dediğiniz şehrin öbür ucunda.',
      'Dedemden beri burada oturuyoruz.',
    ],
    itiraf: [
      'Arsayı ucuz diye almıştık.',
      'Fayı biliyorduk ama.',
      'Tapuda bir not vardı, okumadık.',
      'Sallantıyı en çok biz hissediyoruz.',
      'Satarken söylemediler, sonra duyduk.',
    ],
    zarf: [
      'Harita yanlış olabilir, {para}.',
      'Bu çizgiyi görmezsek?',
      'Fay meselesini kapatalım, {para}.',
      'Birkaç yüz metre ne değiştirir? {para}.',
      'Haritaya bakmamış olun, {para}.',
    ],
  },
  sivilasma: {
    bahane: [
      'Zemin sağlamdır, eskiden bağ vardı.',
      'Etüdü yapan acemiydi.',
      'Hiç su basmadı.',
      'Kum değil o, toprak.',
      'Bütün mahalle aynı zeminde.',
    ],
    itiraf: [
      'Bodrumu hep su basar.',
      'Eskiden burası sazlıkmış.',
      'Kazarken su çıktı, devam ettik.',
      'Zemin yumuşak, temel derin değil.',
      'Yağmurda bahçe çamur olur.',
    ],
    zarf: [
      'Etüt bir daha okunsa, {para}.',
      'Bu satırı geçsek?',
      'Zemin raporunu değiştirmeyelim, {para}.',
      'Kim bakacak zemine? {para}.',
      'Bu kadar ayrıntıya gerek yok, {para}.',
    ],
  },
  sahteBelge: {
    bahane: [
      'Mühür sonradan basıldı, normal.',
      'Memur yılı yanlış yazmış.',
      'Ruhsat kaybolmuştu, yenisi bu.',
      'Eski ruhsat yıprandı, çoğaltma bu.',
      'Belediye öyle verdi, ben ne bileyim.',
    ],
    itiraf: [
      'Ruhsatı sonradan çıkardık.',
      'Bir tanıdık halletti.',
      'Asıl ruhsat hiç olmadı.',
      'Bir aracıya para verdik, bu geldi.',
      'Mührü başka belgeden kopyaladık.',
    ],
    zarf: [
      'Kâğıt işini uzatmayalım, {para}.',
      'Bu mühür meselesini kapatalım?',
      'Ruhsat gerçek sayılsın, {para}.',
      'Kimse bu mühre bakmaz, {para}.',
      'Bir imzanıza bakar, {para}.',
    ],
  },
  sahteRapor: {
    bahane: [
      'Laboratuvar öyle verdi.',
      'Mühür unutulmuş, raporu gerçek.',
      'Tarih yanlış yazılmış sadece.',
      'Laboratuvar kapandı, rapor eski.',
      'Fotokopi o, asıl rapor evde.',
    ],
    itiraf: [
      'Raporu bir tanıdık hazırladı.',
      'Gerçek raporu bulamadım.',
      'Asıl rapor kötü çıktı, bunu yaptırdık.',
      'Bir örnek bulup doldurduk.',
      'Laboratuvara hiç gitmedik.',
    ],
    zarf: [
      'Raporu kabul etseniz, {para}.',
      'Bu rapor olur, değil mi?',
      'Rapor rapordur, {para}.',
      'Bir rapor için dosya mı yanar? {para}.',
      'Mühür eksikliğini görmeyin, {para}.',
    ],
  },
  elleDuzeltme: {
    bahane: [
      'Memur yanlış yazmış, biz düzelttik.',
      'Daksil değil o, kâğıt eski.',
      'Rakam silinmişti, yeniden yazdık.',
      'Mürekkep dağıldı, üstünden geçtik.',
      'Belediyede düzelttiler, imza sonra.',
    ],
    itiraf: [
      'Kat sayısını ben düzelttim.',
      'Eski rakam işimize gelmiyordu.',
      'Yılı biraz yeni gösterdik.',
      'Kalemle düzeltmek kolaydı.',
      'Kimse fark etmez sandım.',
    ],
    zarf: [
      'Bir rakam için uğraşmayalım, {para}.',
      'Bu düzeltmeyi görmeseniz?',
      'Kalem kaymış sayın, {para}.',
      'Rakam öyle kalsın, {para}.',
      'Bir mavi kalem yüzünden mi? {para}.',
    ],
  },
  baskaBina: {
    bahane: [
      'Parsel numarası yanlış basılmış.',
      'Aynı ada, ne fark eder?',
      'Komşunun planı karışmış.',
      'Bizim parsel {ada}, kâğıtta karışmış.',
      'İki bina aynı müteahhidin, planı aynı.',
    ],
    itiraf: [
      'Bizimkini bulamadım, komşununkini getirdim.',
      'Bizim rapor kötü çıkınca bunu koyduk.',
      'Yan binanın raporu daha iyiydi.',
      'Kendi belgemiz hiç olmadı.',
      'Kardeşimin binasının kâğıdı bu.',
    ],
    zarf: [
      'Numara meselesi, {para}.',
      'Parseli düzeltiriz, bunu geçseniz?',
      'Bir rakam farkı, {para}.',
      'Komşu da razı, {para}.',
      'Ada parsel kimin umurunda? {para}.',
    ],
  },
  imzaYok: {
    bahane: [
      'Memur imzayı unutmuş.',
      'İmza arkada olacaktı.',
      'Fotokopide çıkmamış.',
      'İmzalayan memur emekli oldu.',
      'Islak imza sonra gelecek.',
    ],
    itiraf: [
      'İmzalatmaya vaktim olmadı.',
      'Belediyede imzalatamadım.',
      'İmzalamadılar, eksik var dediler.',
      'Kimse sorumluluğu almadı.',
      'İmza için sıra çok uzundu.',
    ],
    zarf: [
      'İmza işini aramızda halletsek, {para}.',
      'İmzasız da olur, değil mi?',
      'Bir imza eksik diye mi? {para}.',
      'İmzayı siz atın, {para}.',
      'Sonra imzalatırım, şimdi geçin, {para}.',
    ],
  },
};

/** Eksik raporu (karot, zemin etüdü) İSTE. */
export const ISTE_METIN: Record<IsteTuru, string[]> = {
  gercek: [
    'Buyrun, raporum burada.',
    'Çantamdaymış, işte.',
    'Laboratuvardan dün aldım.',
    'Hazırlıklı geldim, buyrun.',
    'İşte, mühürlü asıl rapor.',
  ],
  sahte: [
    'Raporum var tabii, buyrun.',
    'İşte rapor, her şey yolunda.',
    'Laboratuvar yeni verdi.',
    'Bakın, her şey yazıyor.',
    'Bu rapor tertemiz, inceleyin.',
  ],
  yok: ['Yarın getiririm.', 'Rapor evde kaldı.', 'Laboratuvar daha vermedi.', 'Rapor mu gerekiyordu?', 'Hiç yaptırmadık ki.'],
};

/** Geçersiz belgenin (ruhsat, vaziyet planı, başka binanın raporu) düzgününü İSTE. */
export const ISTE_BELGE_METIN: Record<IsteTuru, string[]> = {
  gercek: [
    'Haklısınız, asıl belge bu.',
    'Buyrun, düzgünü burada.',
    'Pardon, doğrusu bu.',
    'Karıştırmışım, asıl belge bu.',
    'İşte, temiz nüshası.',
  ],
  sahte: [
    'Buyrun, bu kesin doğru.',
    'İşte asıl belge.',
    'Bu sefer tamam, bakın.',
    'Yeni çıkarttım, buyrun.',
    'Bu nüsha belediyeden.',
  ],
  yok: ['Asıl belge bende yok.', 'Belediyeden almam lazım.', 'Başka belgem yok.', 'O belge kayıp.', 'Hiç verilmedi ki bize.'],
};

/** Zarfı uzatırken istenen damga. */
export const ZARF_ISTEK: Record<'guvenli' | 'guclendir', string[]> = {
  guvenli: [
    'Bir GÜVENLİ damgası yeter.',
    'GÜVENLİ vurun, gerisini unutun.',
    'Sadece GÜVENLİ, başka bir şey istemem.',
    'GÜVENLİ yazsın, yeter.',
  ],
  guclendir: [
    'BOŞALT olmasın, GÜÇLENDİR yeter.',
    'Kimseyi çıkarmayalım, GÜÇLENDİR vurun.',
    'En fazla GÜÇLENDİR, lütfen.',
    'Evden çıkmayalım, GÜÇLENDİR olsun.',
  ],
};
