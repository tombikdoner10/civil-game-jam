# Görevler

Proje hafızası: lider yönetir. Bir görev bir geliştirici çağrısına sığmalı.

Biçim: `- [ ] G12 [teknik] Kısa başlık: kabul ölçütü`
- `[teknik]`: ajanlar yapar (kod, hata, entegrasyon)
- `[takım]`: takım elle yapar (fikir, görsel, ses, video, sunum); ajanlar yapmaz
- `[bulut]`: bulut oturumunda yapılabilecek teknik iş (yaratıcı karar ya da takım dosyası gerektirmez)

## Şimdi

- [ ] G2c [teknik] G2b düzeltmeleri: okunurluk (Z/2, B/G, C/G, 5/S), kat sayımı (zemin dahil, sayılabilir pencere sıraları), gün 1 ilk dosya temiz + ikinci kaçak kat, masa sınırı damga çubuğunda bitsin, kesik kolon fotoğrafta kolon eksik görünsün, fiş yeni dosyada kalksın ve kusur adını göstersin, kart genişliği 0 hatası, smoke.mjs arka plan bayrakları.

## Sırada

Çekirdek döngü (gri kutularla; hedef: Cumartesi 14.00 ara test)

- [ ] G3 [teknik] İnceleme modu: Space ile aç/kapat; iki belge alanına tıklanınca tutarsızlık varsa işaret ve etiket ("Kaçak kat" gibi, metinler yer tutucu), yoksa "tutarsızlık yok".
- [ ] G4 [teknik] Kural kitabı ve gün yapısı: gün yapılandırması (kurallar, dosya sayısı, süre) JSON/TS veriden; kural kitabı paneli (yer tutucu metinler); gün sonu ekranı (doğru/yanlış, maaş, ceza); 5 gün akışı.
- [ ] G5 [teknik] Deprem günü ve sonuç: üstten şehir haritası (gri kutular), damgalanan binaların sonucu, sarsıntı efekti, gazete ekranı (yer tutucu manşetler); Result sahnesine bağlanıyor.

Araçlar ve derinlik

- [ ] G6 [teknik] Büyüteç: fotoğrafı büyütünce gizli kusur görünür (çapraz çatlak, pas, deniz kabuğu; yer tutucu çizimler).
- [ ] G7 [teknik] Cetvel: vaziyet planında sürükleyerek mesafe ölçme; kurala bağlı.
- [ ] G8 [teknik] Karot presi: numuneyi prese sürükle, dayanım değeri çıksın.
- [ ] G9 [teknik] Baskı olayları ve aile bütçesi: zarf (kabul/ret), kota, mal sahibi sözü; gün sonunda kira/ısınma/okul seçimleri (metinler yer tutucu).
- [ ] G10 [teknik] Son gün "kendi binan" dosyası ve sonlara etkisi.

Görsel, ses, cila (takım paketleri onaylayınca)

- [ ] G11 [teknik] Görsel cila: diğer sahneleri (menü, sonuç, gün sonu) aynı piksel tarza getir; belge ayrıntıları (mühür, imza, tarih damgası).
- [ ] G12 [teknik] Sesler: damga, kâğıt, gün sonu, deprem; `src/sounds/`, beyan.
- [ ] G13 [teknik] Menü, başlık, Emeği Geçenler güncel; ilk 30 saniye akışı (Gate/Splash kısa).

Bulutta yapılabilecekler

- [ ] G14 [teknik] [bulut] Bina üreticisi ve kural motoru için düğüm (node) test betiği: belirli tohumlarla üretilen binalarda kusur listesi ve doğru damga beklenen değerle eşleşiyor (G1'den sonra).
- [ ] G15 [teknik] [bulut] Smoke senaryosu: masada bir dosyayı inceleyip damgalayan `npm run smoke -- --senaryo` JSON'u (G2–G3'ten sonra).

## Takım işleri

- [ ] T1 [takım] Oyunun ve kurgusal şehrin adı.
- [ ] T2 [takım] Kural kitabı metinleri ve eşikler (5 gün); TBDY 2018, AFAD ve Bakanlık kaynaklarıyla doğrula, kaynakları not et.
- [ ] T3 [takım] 6–8 hikâye binası: kısa dosya metni, mal sahibinin bir cümlesi, gizli kusur.
- [ ] T4 [takım] Gazete manşetleri ve sonlar (ton: kurban yok, sayı yok, odak önleme).
- [ ] T10 [takım] Kaçak katlar fotoğrafta farklı malzemeyle (sıvalıysa tuğla, tuğlaysa beton) çiziliyor; ipucu kalsın mı, kapansın mı? (src/desk/tiles.ts ekKat)
- [ ] T11 [takım] Pencere sokağı, gişedeki siluet ve renk paleti onayı; uyarı fişi metinleri ("Doğru karar" / "Yanlış karar: doğrusu X" yer tutucu).
- [ ] T6 [takım] Ses seçimi: damga, kâğıt, gün sonu, deprem (havuzdaki Kenney ses paketlerinden).
- [ ] T7 [takım] Kararlar: deprem hangi gün; imar affı belgesi olacak mı; kaçak kat GÜÇLENDİR mi BOŞALT mı (kod şu an GÜÇLENDİR, GDD ilk 30 saniye BOŞALT diyor).
- [ ] T8 [takım] Cumartesi 14.00 ara test: oyunu oyna, geri bildirim ver (Kontrol 2).
- [ ] T9 [takım] Pazar: 1 dakikalık video (MP4) ve 3 dakikalık sunum.

## Bitti

- [x] G1 [teknik] Bina veri modeli ve üretici: `src/game/building.ts` (gerçek kat, ruhsat katı, yapım yılı, beton dayanımı, kolon durumu, dere/fay mesafesi, zemin raporu); tohumlu rastgele üretici + elle yazılabilir hikâye binası biçimi; her bina için kusur listesi ve doğru damga hesaplanıyor; `npm run check` temiz. (6cab272)
- [x] G2 [teknik] Masa sahnesi iskeleti: `GameScene` masa alanı, veriden çizilen gri belge kartları (ruhsat, fotoğraf yer tutucusu, vaziyet planı, karot sonucu) sürüklenebiliyor, 3 damga düğmesi, mesai saati; damga basınca sıradaki dosya geliyor. (40eccc7; test G2b ile birlikte yapılacak)
- [x] T5 [takım] Görsel yön ve fontlar: Papers, Please tarzı; Tiny Town (boyanmış) + kodla kâğıt/damga; Pixelify Sans + VT323 (16 Ekim 19.50)
- [x] G2b [teknik] Papers, Please görsel yönü: piksel çizim, solgun palet, pencere (sokak + gişe) ve masa düzeni, belge kâğıtları, kayan damga çubuğu ve mürekkep izi, Pixelify Sans + VT323, Tiny Town cepheleri; G2 işlevleri bozulmadan. (4c96a95, Opus; test geçti 20.55)
