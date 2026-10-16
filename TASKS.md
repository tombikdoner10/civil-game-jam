# Görevler

Proje hafızası: lider yönetir. Bir görev bir geliştirici çağrısına sığmalı.

Biçim: `- [ ] G12 [teknik] Kısa başlık: kabul ölçütü`
- `[teknik]`: ajanlar yapar (kod, hata, entegrasyon)
- `[takım]`: takım elle yapar (fikir, görsel, ses, video, sunum); ajanlar yapmaz

## Şimdi

- [ ] G22 [teknik] Zarfın bedeli (takım kararı 01.30): zarfı kabul eden oyuncu kişinin istediği damgayı vurmak zorunda (diğer kaşeler kilitli, "zarf aldın" ipucu); bina sokakta küçük bir iz taşır; doğru/yanlış ve deprem gerçek damgaya göre; gazete ve sonuçta görünür. G18 testi: inceleme modunda zarf sürüklenemiyor (sessiz); zarf masadayken kaşe vurmak örtük kabul sayılıyor ve oyuncuya söylenmiyor; bunlar G22 tasarımında netleşsin.

## Sırada

Çekirdek döngü (hedef: Cumartesi 14.00 ara test; sıra: G4 → G4b → G12 → G5 → G13)




Ara test sonrası (sıra 01.30: G18 → G21 → G5b → G22 → G19 → G20; özellik dondurma Cumartesi 24.00)


- [ ] G23 [teknik] Küçük kalanlar: kısa yol sonuç ekranında Enter = Gün 2'den devam (yanlışlıkla Yeniden oyna riski); çöken binanın etiket çubuğu havaya iniyor; gün 2 sokak turunda soluk dekor binaları gerçek binalarla karışıyor (daha koyu/alçak).
- [ ] G19 [teknik] Saha testi, yalnızca Schmidt çekici (takım kararı 01.30): karot yoksa ya da geçersizse SAHA ile beton yüzeyine vurma mini oyunu (geri tepme değeri → dayanım), günde sınırlı hak, zaman harcar; sonuç masaya "saha notu" olarak düşer ve kanıt sayılır (bilgiEdin karot, saha). Burgu YOK.
- [ ] G20 [teknik] Takip denetimi (küçük): gün 3'ten itibaren önceki GÜÇLENDİR binalarından biri geri gelir; fotoğrafta iskele var ya da yok (bırakılmış), güçlendirme raporu; kural ve damga.

Araçlar ve derinlik (ara test sonrası saha testi bunların yerini alıyor; düşük öncelik)


Görsel, ses, cila (takım paketleri onaylayınca)

- [ ] G11 [teknik] Görsel cila: diğer sahneleri (menü, sonuç, gün sonu) aynı piksel tarza getir; belge ayrıntıları (mühür, imza, tarih damgası).


## Takım işleri

- [ ] T1 [takım] Oyunun ve kurgusal şehrin adı.
- [ ] T12 [takım] Eleştirmenin teknik doğruluk soruları (T2 ile): mühür yılı ruhsat mı iskân mı ("Ruhsat tarihi"?); beton eşiği (TBDY 2018 yeni yapıda C25; mevcut yapıda Riskli Yapı Esasları) ve yıl-dayanım ilişkisi; dere 30 m / fay 150 m kaynağı, dere GÜÇLENDİR ile çözülür mü; zemin etüdü yok = dosya iadesi mi; sıvılaşma hep BOŞALT mı; ZA–ZF zemin sınıfları; 6306 sayılı kanun "riskli yapı" dili.
- [ ] T2 [takım] Kural kitabı metinleri ve eşikler (5 gün); TBDY 2018, AFAD ve Bakanlık kaynaklarıyla doğrula, kaynakları not et.
- [ ] T3 [takım] 6–8 hikâye binası: kısa dosya metni, mal sahibinin bir cümlesi, gizli kusur.
- [ ] T4 [takım] Gazete manşetleri ve sonlar (ton: kurban yok, sayı yok, odak önleme).
- [ ] T10 [takım] Kaçak katlar fotoğrafta farklı malzemeyle (sıvalıysa tuğla, tuğlaysa beton) çiziliyor; ipucu kalsın mı, kapansın mı? (src/desk/tiles.ts ekKat)
- [ ] T13 [takım] Ara testte ayarla: maaş/ceza değerleri ve para birimi (şu an doğru 20, yanlış 10 TL), gün süreleri (90/180/200/220/240 sn), dosya sayıları (3/5/6/7/8); karot "Rapor yok" kusur sayılsın mı?
- [ ] T14 [takım] Öncü sarsıntı: doğru BOŞALT damgalanan zayıf bina da "boş" olarak çatlıyor; böyle mi kalsın, yoksa boşaltılanlar sağlam mı görünsün? Öncü şiddeti/süresi (TUNING.oncu). İskele, şerit, çatlak çizimleri onayı. Tavanda sallanan lamba istenir mi?
- [ ] T15 [takım] Büyük deprem ağırlığı: örnek oyunda 29 binadan 14'ü çöktü (10'u boşaltılmıştı). Doğru BOŞALT damgalı ağır kusurlu binalar çöksün mü, ağır hasarlı mı kalsın (TUNING.buyukDeprem.kademe.bosaltKusur 3 → 2)? Gazete ve sonuç metinleri src/game/gazete.ts (T4 ile).
- [x] T16 [takım] KARAR A + C (01.30): gün 1 sonunda "Depremi şimdi yaşa" (G21) + video/anlatım. Jüri büyük depremi normal yolla göremiyor (5 gün ~8–10 dk). Seçenekler: menüde "Depremi göster" düğmesi, kısa mod, ya da yalnızca sunum/video için ?dev&deprem adresi. Karar takımın (tema ve yaratıcılık puanı).
- [ ] T17 [takım] Diyalog metinleri: mal sahiplerinin bahaneleri, itirafları, zarf teklifleri, belge getirme/getirememe cümleleri (G17 yer tutucuları). Kural kitabı satırlarının son metni (G16).
- [ ] T18 [takım] G16 sonrası: fay kuralı (şu an dere gibi zemine bağlı; TUNING.fayKurali "bosalt" yapılabilir), gün 4'te sıvılaşma sıklığı (yakinZemin.sivilasma 0.3 → 0.2?), İADE rengi ve sesi, sahte belge cezası (şu an GÜÇLENDİR).
- [ ] T19 [takım] G17a: portreleri ?dev&portreler ile onayla; diyalog metinleri src/game/diyalog.ts (T17); zarf sıklığı (gün 5'te %60, TUNING.kisi.zarf); konuşma/zarf seslerini dinle; oyun içi takvim (TAKVIM). Zarf alınca damga yine DOĞRU sayılıyor (rüşvetin ağırlığı düşük): sonuçta ceza, gazetede iz ya da müfettiş olayı istenir mi? İnceleme modunda saat akmaya devam ediyor (zaman baskısı); yavaşlasın mı?
- [ ] T20 [takım] TAKVİM (takım kararı 01.30): bütün metinler (oyun adı, diyalog, kural metinleri, gazete, gün 1 çerçeve cümlesi, Emeği Geçenler isimleri) Cumartesi 18.00'e kadar; özellik dondurma Cumartesi 24.00; video Pazar 10.00–12.00; kod dondurma Pazar 15.00.
- [ ] T11 [takım] Pencere sokağı, gişedeki siluet ve renk paleti onayı; uyarı fişi metinleri ("Doğru karar" / "Yanlış karar: doğrusu X" yer tutucu).
- [ ] T6 [takım] Sesleri ara testte dinle; Claude'un seçtiği Kenney adaylarını onayla ya da değiştir.
- [ ] T7 [takım] Kararlar: imar affı belgesi olacak mı. (Deprem günü ve kaçak kat 21.49'da karara bağlandı.)
- [ ] T8 [takım] Cumartesi 14.00 ara test: oyunu oyna, geri bildirim ver (Kontrol 2).
- [ ] T9 [takım] Pazar: 1 dakikalık video (MP4) ve 3 dakikalık sunum.

## Bitti

- [x] G6, G7, G9, G10: KESİLDİ (büyüteç, cetvel, eski baskı/aile, kendi binan ayrı görevi; eleştirmen 2, 17 Ekim 01:26; zarf G9'un yerini aldı, kendi binan hikâye binası olarak var)

- [x] G8 [teknik] Karot presi: KESİLDİ (eleştirmen, 16 Ekim 21.23; kapsam)

- [x] G1 [teknik] Bina veri modeli ve üretici: `src/game/building.ts` (gerçek kat, ruhsat katı, yapım yılı, beton dayanımı, kolon durumu, dere/fay mesafesi, zemin raporu); tohumlu rastgele üretici + elle yazılabilir hikâye binası biçimi; her bina için kusur listesi ve doğru damga hesaplanıyor; `npm run check` temiz. (6cab272)
- [x] G2 [teknik] Masa sahnesi iskeleti: `GameScene` masa alanı, veriden çizilen gri belge kartları (ruhsat, fotoğraf yer tutucusu, vaziyet planı, karot sonucu) sürüklenebiliyor, 3 damga düğmesi, mesai saati; damga basınca sıradaki dosya geliyor. (40eccc7; test G2b ile birlikte yapılacak)
- [x] T5 [takım] Görsel yön ve fontlar: Papers, Please tarzı; Tiny Town (boyanmış) + kodla kâğıt/damga; Pixelify Sans + VT323 (16 Ekim 19.50)
- [x] G2b [teknik] Papers, Please görsel yönü: piksel çizim, solgun palet, pencere (sokak + gişe) ve masa düzeni, belge kâğıtları, kayan damga çubuğu ve mürekkep izi, Pixelify Sans + VT323, Tiny Town cepheleri; G2 işlevleri bozulmadan. (4c96a95, Opus; test geçti 20.55)
- [x] G2c [teknik] G2b düzeltmeleri: okunurluk (Z/2, B/G, C/G, 5/S), kat sayımı (zemin dahil, sayılabilir pencere sıraları), gün 1 ilk dosya temiz + ikinci kaçak kat, masa sınırı damga çubuğunda bitsin, kesik kolon fotoğrafta kolon eksik görünsün, fiş yeni dosyada kalksın ve kusur adını göstersin, kart genişliği 0 hatası, smoke.mjs arka plan bayrakları. (c82bcab, Opus/high)
- [x] G3 [teknik] İnceleme modu: Space ile aç/kapat; iki belge alanına tıklanınca tutarsızlık varsa işaret ve etiket ("Kaçak kat" gibi, metinler yer tutucu), yoksa "tutarsızlık yok". (cf78f50, Opus/high; en küçük kural kitabı dahil)
- [x] G4 [teknik] Gün yapısı ve gün sonu: gün yapılandırması veriden (kurallar, belgeler, dosya sayısı, süre); gün 1 kısa (3 dosya, ~90 sn), yalnızca ruhsat + fotoğraf + açık kural notu, belgeler kuralları geldikçe gelir; kaçak kat 1 kat GÜÇLENDİR / 2+ BOŞALT; gün sonu ekranı (doğru/yanlış, bulunan kusurlar, maaş/ceza); 5 gün akışı; kural kitabı damga çubuğunu örtmesin, sürüklenebilir; ilk dosyalarda temiz/kusurlu karışımı çeşitli; fiş ve kusur etiketleri belge değerlerini örtmesin. (be33cc4, Opus/high)
- [x] G4b [teknik] Sokak ve öncü sarsıntı: pencere sokağı damgalanan binalarla kalıcı dolar (güçlendirilene iskele, boşaltılana şerit); gün 1 sonunda ~10 sn öncü sarsıntı (sokak sallanır, zayıf onaylanmış binalar çatlar, toz); gün sonu ekranına bağlanır. (7818e01, Opus/high; test geçti 22.57)
- [x] G12 [teknik] Sesler (ara testten önce): Kenney CC0 paketlerinden aday seç ve bağla (damga tokmağı, kâğıt, inceleme bulma/yok, gişe, saat/gün sonu, sarsıntı); src/sounds/, credits.ts, README. (c207380, Opus/high; 42 Kenney OGG, docs/SESLER.md; Yeniden Başla düzeltildi)
- [x] G5 [teknik] Büyük deprem günü ve gazete: 5. gün sonunda aynı sokakta büyük deprem; damgaların sonucu (ayakta / hasarlı / ağır hasar, boşaltılan boş); gazete ekranı (yer tutucu manşetler); Result. (+ sonuç ekranı masa tarzına) (d7424e7, Opus/high; npm run adalet 4644 denetim 0 hata)
- [x] G13 [teknik] Gate/Splash kısalt (ara testten önce, eleştirmen); Emeği Geçenler güncel; ilk 30 saniye akışı. (G4c ile birlikte)
- [x] G4c [teknik] G4b test bulguları: gün 2+ belgeler üst kenarda kırpılıyor (RUHSAT başlığı HUD şeridine değiyor; 20–30 px aşağı); 4–5. günde dolu sokak görünmüyor (pencerede 3–4 bina; gün başı turunda kamera geri çekilsin/uzaklaşsın); gün 5'ten önce mühür yılı = yapım yılı (yanlış kusur izlenimi); inceleme etiketi damga çubuğuna taşmasın; fiş gişe camında silueti örtmesin; mesai saati belgeler masaya oturunca başlasın. + G13 (Gate/Splash kısalt) (79eef37, Opus/high)
- [x] G16 [teknik] Kurallar netleşsin + İADE: kural kitabında her satır damgasını yazsın; 4. damga İADE (sonucu: bina denetimsiz, depremde gerçek durumuyla); eksik karot/zemin etüdü akışı (iste → değerlendir → saha testi ya da İADE için kanca); dereye/faya yakın karar zemin etüdüne bağlı; doğru damga, fiş, gün sonu, adalet betiği buna uysun. (ea01399, Opus/high; adalet 9086 denetim 0 hata)
- [x] G17a [teknik] Gişede insan ve sorgu: kodla piksel portreli mal sahibi (siluet yerine); SOR (bulunan tutarsızlıkta: bahane / itiraf / zarf) ve İSTE (eksik belgede: gerçek / sahte / yok); belge hileleri (elle düzeltilmiş rakam, ada/parsel uyuşmazlığı, eksik imza/boş alan, sahte rapor) ve kuralları; diyalog metinleri yer tutucu, takım yazacak. (63e6900, Opus/high; adalet 16724 denetim 0 hata)
- [x] G17b [teknik] Belge hileleri: elle düzeltilmiş rakam (tipp-ex, üstü çizili), ada/parsel uyuşmazlığı (başka binanın belgesi), eksik imza/boş alan; "geçersiz belge" eksik belge gibi işler (İSTE → gerçek/sahte/yok → İADE); kural satırları ve günlere dağılım. (27ca242, Opus/high; adalet 21282 denetim 0 hata)
- [x] G18 [teknik] Fiziksel kaşe ve yönetmelik klasörü: kayan damga çubuğu yerine masadaki kaşeler (GÜVENLİ / GÜÇLENDİR / BOŞALT / İADE): al, ıstampaya bastır, belgeye vur; yeşil kural kitabı yerine halkalı yönetmelik klasörü; jüri 30 saniyede bulsun. Kaşeler kuralları geldikçe masaya gelsin (İADE gün 3). Ruhsattaki Ada/Parsel ve İmza satırları kuralları gelene kadar (gün 4–5) görünmesin; gün 1 masası sade kalsın. (6343fe3, Opus/high; tek tıklama)
- [x] G21 [teknik] Depremi şimdi yaşa (T16, takım kararı A + C): gün 1 sonu raporunda "Depremi şimdi yaşa" düğmesi; jürinin kendi 3 binası + hazır doldurulmuş sokakla (ornek.ts) ~30 sn büyük deprem → gazete → sonuç; normal akış (Sonraki gün) de kalır. (6eda7b7 + c96f6aa, Opus/high; kısa yol ~30 sn, adalet 21732 denetim 0 hata)
- [x] G14, G15: KALDIRILDI (bulut görevleriydi; takım 17 Ekim'de bulutu tamamen kapattı. G14'ün işini scripts/adalet.mjs, G15'inkini geliştiricilerin smoke senaryoları zaten yapıyor)
- [x] G5b [teknik] Toplu küçük düzeltmeler ve cila: çerçeve cümlesi, öncü etiketleri, gerekçeli fiş, koyu mürekkep, gün sonu toplamları, tezgâhta tarih, klasör (tıklama geçirgenliği, yeni dosyada kapanma, tek sayfa), kaşelik rozeti, inceleme çizgisi ve SORULDU/İSTENDİ, kayan kart, boş mühür, RAPOR YOK, gazete/sonuç tanımları, smoke beklemeleri, kullanılmayan fontlar kaldırıldı (ZIP 1,02 → 0,81 MB), README/BENIOKU kontroller (6cf541f, Opus/high)
- [x] G21b [teknik] G21 test bulguları: "Gün 2'den devam" sonrası gün 2 sokağına kısa yolun örnek binaları sızıyor olabilir (doğrula, yalnızca jürinin binaları kalsın); sonuç ekranı düğmeleri hemen görünsün (şu an ~2,5–6 sn boş); uzak plandaki deprem etiketleri büyüsün ya da sabit lejant olsun; gün 1 raporunda Enter = Depremi şimdi yaşa, Sonraki gün ikincil (N ya da tık); saat dosyalar arasında geri gidiyor gibi (09:18 → 09:13), doğrula ve düzelt; sonuç ekranındaki değerlendirme satırının kontrastı. Ek: dev yolunda sonuç ekranı "Birikmiş para: 0 TL" gösteriyor (tablo toplamı farklı). (1fbc253, Opus/high; sızıntı ve saat hatası doğrulanamadı, kod gereği yok; test sürüyor)
