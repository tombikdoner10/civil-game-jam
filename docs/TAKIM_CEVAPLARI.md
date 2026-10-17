# Takımın cevapları ve Claude'un önerileri (17 Ekim)

Her maddede **Claude'un kararı** (teknik/işlevsel maddeler) ya da **Claude'un önerisi** (yaratıcı maddeler, seçim takımın) var.
Altındaki **Yorumunuz:** satırına "tamam", bir seçenek ya da kendi metninizi yazın; sohbete yazmanız da yeterli.
Onayladığınız metinleri Claude oyuna yerleştirir, köşeli parantezleri kaldırır, taşmayı kontrol eder ve test eder (G31).

Madde 4.3: AI'ın önerip takımın seçtiği metinler beyanda "AI önerileri; takım seçti ve düzenledi" diye yazılır. Yalnızca adları ve "Takımın kararları"nı kendi cümlelerinizle yazmanız, yaratıcılık puanı için en güçlüsü.

Son tarihler: metinler bugün 18.00 · özellik dondurma bugün 24.00 · video Pazar 10.00–12.00 · kod dondurma Pazar 15.00 · son teslim Pazar 18.00.

---

## A. Oyuna girecek metinler (bugün 18.00)

### 1. Adlar (T1) — seçim takımın
Claude'un önerisi:
- **Oyun adı** (tema: kâğıtta sağlam olan binayla gerçekte sağlam olan bina arasındaki fark):
  1. **Kâğıt Üstünde** (önerilen): "kâğıt üstünde sağlam" deyimi; damga, zarf ve depremin çelişkisini tek sözle anlatır.
  2. **Damga**: kısa, mekaniğin kendisi.
  3. **Sağlam Raporu**: denetçinin vereceği karar.
- **Kurgusal şehir:** 1. **Dereboyu** (önerilen; dere kuralına bağlanır) 2. **Yenikent** 3. **Fayvadi**
- **Gazete:** 1. **Dereboyu Postası** (önerilen) 2. **Sabah Haber** 3. **Kent Gazetesi**

Yorumunuz:

### 2. Gün 1'de jürinin ilk 30 saniyede gördükleri (T31, T11) — Claude'un kararı
Takımın daha önce kararlaştırdığı dil korunur, yalnızca yer tutucu işaretleri kalkar ve kural daha okunur yazılır:
| Ne | Karar |
|---|---|
| Çerçeve cümlesi | Belediyenin yapı denetçisisin. Deprem her an olabilir. |
| Görev satırı | Belgeleri karşılaştır, kurala uymayanı damgala. |
| Gün 1 kuralı | Ruhsattaki kat sayısı (zemin dahil) fotoğraftakiyle aynı olmalı. 1 kat fazlaysa GÜÇLENDİR, 2 ve üstüyse BOŞALT. |
| İnceleme ipucu | Space ile incele, kusuru kanıtla |
| Fiş başlıkları | Doğru karar · Yanlış karar · Doğrusu: (aynı kalır) |

Yorumunuz:

### 3. Gün sonu raporu ve deprem (T31) — Claude'un kararı
| Ne | Karar |
|---|---|
| Küçük deprem bandı | Küçük bir deprem oldu. |
| Kısa yol düğmesi | BÜYÜK DEPREM BU GECE OLSAYDI? |
| Kısa yol satırı | Kararlarının sonucunu şimdi gör. |
| Devam notu | Sonra 2. günden devam edebilirsin. |
| Deprem kartı | Bir gece |
| Hızlandırma ipucu | Enter ya da tıkla: hızlandır |
| İkinci basış ipucu | Enter ya da tıkla: geç (tıklama da çalıştığı için eklendi) |
| Etiket | SENİN DAMGAN |

Yorumunuz:

### 4. Gazete ve sonuç (T4, T30, G37) — Claude'un önerisi
Mevcut yer tutucuların anlamı korunur; "Manşet:" ve "Değerlendirme:" etiketleri kalkar, manşetler gazete diliyle büyük harf olur:
| Durum | Tekil / çoğul |
|---|---|
| Onaylanan bina çöktü | DENETİMDEN GEÇEN BİNA ÇÖKTÜ / DENETİMDEN GEÇEN BİNALAR ÇÖKTÜ |
| İade edilen bina çöktü | DENETLENMEDEN KALAN BİNA ÇÖKTÜ / …BİNALAR ÇÖKTÜ |
| Boşaltılan bina çöktü | ÇÖKEN BİNA BOŞALTILMIŞTI / ÇÖKEN BİNALAR BOŞALTILMIŞTI |
| Kimse çökmedi | SOKAK AYAKTA · SOKAKTA HASAR VAR, ÇÖKEN YOK |
| Kısa yol, kusursuz jüri | DENETLEDİĞİN BİNALAR AYAKTA, DENETLENMEYENLER ÇÖKTÜ |
| Değerlendirme (örnek) | Onayladığın binalar çöktü; birinden zarf almıştın. |
| Başlıklar | Senin binaların · Bütün sokak · GÜN 1 + DEPREM |
| Fotoğraf altı | Deprem sonrası sokak |
| Zarf izi | Denetçinin masasında zarf bulundu |

Yorumunuz:

### 5. Gişe diyalogları (T28, T17) — Claude'un önerisi
393 taslak cümle (`src/game/diyalog-metin.ts`) köşeli parantezsiz kalsın; takım yalnızca **gün 1'de görünenleri** okusun (5 mizacın selamı, damga tepkileri, zarf cümleleri, kaçak kat bahane/itiraf/zarf; toplam ~80 cümle) ve beğenmediklerini işaretlesin. Gerisi taslak olarak kalır; beyanda "AI taslağı, takım seçti".

Yorumunuz:

### 6. Kendi evin (T35) — Claude'un kararı (AFAD önerileriyle uyumlu, işlevsel metin)
| Kalem | Kademe 1 | Kademe 2 | Kademe 3 |
|---|---|---|---|
| Deprem çantası (30/40/50 TL) | Su, fener, düdük | İlk yardım çantası ve ilaçlar | Aile buluşma planı ve belge kopyaları |
| Eşya sabitleme (30/50/60 TL) | Dolapları duvara sabitle | Beyaz eşya ve şofbeni sabitle | Raflar, ayna ve camlar (cam filmi) |
| Güçlendirme payı (80/100/120 TL) | Taksit 1/3: proje | Taksit 2/3: kolon sarma | Taksit 3/3: tamamlandı |

"Senin evin" cümleleri (kurban yok, sayı yok):
- Ev: Evin sağlam kaldı · Evin hafif hasar aldı · Evin ağır hasar aldı, oturulamaz
- Çanta 0–3: Ailen gece sokağa hazırlıksız çıktı · Ailen su ve fenerle çıktı · Ailen ilk yardım çantasıyla çıktı · Ailen buluşma noktasında bir araya geldi
- Sabitleme 0–3: Dolaplar devrildi · Dolaplar yerinde, beyaz eşya kaydı · Büyük eşyalar yerinde, camlar kırıldı · Evde hiçbir şey devrilmedi
- Zarf: Evinin hazırlığını zarf parasıyla yaptın.

Yorumunuz:

### 7. Mühendislik doğruluğu (T2, T12, T21) — Claude'un kararı
Jüride iki inşaat mühendisi var; oyun gerçek yönetmeliği taklit etmiyor, sadeleştiriyor. Bunu dürüstçe göstermek için kural notunun başına bir satır: **"Belediye denetim yönergesi (oyun için sadeleştirilmiştir)"**. Tek tek:
- **Mühür yılı:** Gerçekte "ruhsat tarihi" ve "iskân (yapı kullanma izni) tarihi" var. Karar: belgede **"Ruhsat tarihi"** yazsın. Kural: "Ruhsat tarihi yapım yılından sonraysa bina ruhsatsız yapılmış demektir → İADE." ("Sahte" yerine "geçersiz/ruhsatsız", mühendis jüri için daha doğru.)
- **Beton 20 MPa:** Mevcut binada tek başına bir dayanım değeri tahliye nedeni değildir; riskli yapı tespiti çok ölçütlüdür (Riskli Yapıların Tespit Edilmesine İlişkin Esaslar). Karar: eşik kalsın, kural metni "Beton dayanımı yönerge eşiğinin (20 MPa) altındaysa → BOŞALT" desin; sunumda "sadeleştirme" olarak söylenir.
- **Schmidt çekici:** Yüzey sertliği ölçümüdür (TS EN 12504-2); dayanım tahmini için karotla ilişkilendirilmesi gerekir (TS EN 13791). Oyundaki karar zaten buna uygun: iyi sonuç GÜVENLİ verdirmez. Saha notuna "ön değerlendirme; karotla doğrulanmalı" satırı eklensin.
- **Dere 30 m / fay 150 m:** Sabit ulusal bir değer değil; dere için taşkın alanı/imar planı, fay için diri fay sakınım bandı kararları yerel ve değişken. Karar: "yönerge mesafesi" olarak kalsın (oyun kuralı).
- **Sıvılaşma her zaman BOŞALT mı:** Gerçekte zemin iyileştirmesiyle çözülebilir; oyunda sadeleştirme olarak BOŞALT kalsın. Zemin sınıfları (ZA–ZF) eklenmesin.

Yorumunuz:

### 8. Hikâye binaları (T3) — Claude'un önerisi
- **Bina H1 (gün 2, kesik kolon):** sahibi **Kasap Rıza Usta**; sözü: "Kolonu kestirince dükkân iki katına çıktı, işler açıldı."
- **[Kendi apartmanın] (gün 5):** adı **Senin apartmanın**; konuşan **Komşun Nermin Hanım**; sözü: "Siz de bu binada oturuyorsunuz, bilirsiniz ne halde olduğunu."

Yorumunuz:

---

## B. Teslimden önce: beyan ve takım bilgisi

### 9. Takım (T32) — adlar takımın
- Üyelerin adları ve rolleri: **siz yazın** (Claude bilemez).
- BENIOKU "Amaç" (Claude'un kararı): "Belediyenin yapı denetçisisin. Binaların belgelerini inceleyip kurala göre damgala; büyük deprem gelince kararlarının sonucunu gör."

Yorumunuz:

### 10. Takımın kararları (T26) — Claude'un taslağı (GDD'deki gerçek kararlarınızdan)
1. **Tema yorumu:** Afet anında değil, öncesinde: oyuncu denetim masasında karar verir; deprem bu kararları sınar.
2. **Gişede insan:** Her dosyanın arkasında mizacı olan bir mal sahibi var; zarf teklifi kabul edilirse istenen damga zorunlu olur ve bedeli depremde görülür.
3. **Kurallar:** Kaçak katta +1 GÜÇLENDİR, +2 BOŞALT; geçersiz belgeler İADE; saha testi tek başına GÜVENLİ verdirmez.
4. **Deprem dili:** Kehanet yok; "deprem her an olabilir"; kısa yol "Büyük deprem bu gece olsaydı?" sorusuyla.
5. **Kendi evin:** Paranın karşılığı ailenin hazırlığı (çanta, sabitleme, güçlendirme); rüşvet aileni koruyabilir ama onayladığın bina çöker.
6. **Seçimler:** Görsel yön (Papers, Please ilhamı, Tiny Town), Kenney sesleri, metinlerin seçimi ve düzenlenmesi takımın.

Yorumunuz (kendi cümlelerinizle yeniden yazmanız madde 4.3 için en iyisi):

### 11. AI beyanı (T27) — Claude'un kararı
Özet doğru ve eksiksiz (araçlar, modeller, beş kategori). Metinler girince "Metin" bölümü şöyle güncellenecek: "Arayüz ve oyun metinlerinin taslaklarını yazdı; takım seçti ve düzenledi. Oyun adı ve takımın kararları takımındır." (Takım kendi yazdığı metinleri belirtirse ona göre.)

Yorumunuz:

---

## C. Kısa onaylar — Claude'un kararı
- **Sesler (T6):** Mevcut seçim kalsın (ayak sesi düzeyi, gün sonu, gazete ve sonuç jingle'ları); dinleyip beğenmediğinizi söylerseniz değişir.
- **Görsel (T11, T19):** Portreler, sokak ve palet kalsın.
- **İnceleme modunda saat:** Akmaya devam etsin (zaman baskısı oyunun parçası).
- **Zarf sıklığı:** Gün 5'te %60 kalsın (son gün baskısı).

Yorumunuz:

---

## D. Pazar
- **Video (T9), 10.00–12.00, en çok 1 dk, MP4:** `?dev&gun=1&tohum=1` ile: sokak → kişi yürüyerek gelir → kaçak kat incelemesi ve damga → zarf → küçük deprem → büyük deprem (zarflı bina çöker) → gazete → "Senin binaların / Senin evin". Kayıt metinler girdikten sonra.
- **Sunum (T25):** Jüriye ilk cümle: "Kaşeye tıkla, raporda kırmızı düğmeye bas, depremde bir kez Enter." Anlatım: takımın kararları; Papers, Please ilhamı açıkça ve ayrışma (kalıcı sokak, depremler, gazete, kendi evin). Oyun jüri bilgisayarında önceden açık ya da ZIP sürümü.
- **Komutlar (Egemen):** `/dondur` 15.00'ten önce, `/teslim-kontrol` teslimden önce; teslim formunu ve erişim kodunu yalnızca Egemen girer.
